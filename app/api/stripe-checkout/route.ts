import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!stripeSecretKey || !supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Configurações de servidor em falta." }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json();
    const {
      reservasIds, // Passado quando é pagamento_final (2ª tranche ou extra) no Dashboard do Pai
      totalAmount,
      userEmail,
      lang = 'pt',
      campoNome,
      stripeAccountId,
      tipoPagamento,
      campoId,
      isGuest,
      guestData,
      criancas,
      reservaSpecs
    } = body;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hellocamp.pt';
    const safeLang = lang === 'en' ? 'en' : 'pt';

    let taxaComissao = 0.12;
    let organizadorId = null;

    // 1. Buscar comissão e organizador do campo
    let idCampoParaConsulta = campoId;
    if (!idCampoParaConsulta && reservasIds && reservasIds.length > 0) {
      const { data: resExistente } = await supabaseAdmin
        .from('reservas')
        .select('campo_id, organizador_id')
        .eq('id', reservasIds[0])
        .single();
      if (resExistente) {
        idCampoParaConsulta = resExistente.campo_id;
        organizadorId = resExistente.organizador_id;
      }
    }

    if (idCampoParaConsulta) {
      const { data: campoData } = await supabaseAdmin
        .from('campos')
        .select('taxa_comissao, comissao, organizador_id')
        .eq('id', idCampoParaConsulta)
        .single();

      if (campoData) {
        organizadorId = campoData.organizador_id;
        const comissaoDb = campoData.taxa_comissao ?? campoData.comissao;
        if (comissaoDb !== null && comissaoDb !== undefined) {
          taxaComissao = Number(comissaoDb) / 100;
        }
      }
    }

    // =========================================================================
    // CASO A: LIQUIDAÇÃO FINAL (2ª TRANCHE OU PAGAMENTO DE EXTRA)
    // =========================================================================
    if (tipoPagamento === 'pagamento_final' && Array.isArray(reservasIds) && reservasIds.length > 0) {
      const { data: reservaAtual } = await supabaseAdmin
        .from('reservas')
        .select('valor_total, valor_pago')
        .eq('id', reservasIds[0])
        .single();

      const valorTotalOriginal = Number(reservaAtual?.valor_total) || Number(totalAmount);
      const valorCobrarAgora = Number(totalAmount);

      const sessionDataFinal: Stripe.Checkout.SessionCreateParams = {
        customer_email: userEmail,
        customer_creation: 'always',
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: `Liquidação Final - ${campoNome || 'HelloCamp'}` },
            unit_amount: Math.round(valorCobrarAgora * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${siteUrl}/${safeLang}/cliente/dashboard?pagamento=sucesso`,
        cancel_url: `${siteUrl}/${safeLang}/cliente/dashboard`,
        metadata: {
          reservasIds: JSON.stringify(reservasIds),
          valor_total_original: valorTotalOriginal.toString(),
          pagamento_tipo: 'pagamento_final',
          is_guest: 'false',
        },
      };

      if (stripeAccountId) {
        (sessionDataFinal as any).payment_intent_data = {
          application_fee_amount: Math.round((valorCobrarAgora * taxaComissao) * 100),
          transfer_data: { destination: stripeAccountId }
        };
      }

      const sessionFinal = await stripe.checkout.sessions.create(sessionDataFinal);
      return NextResponse.json({ url: sessionFinal.url });
    }

    // =========================================================================
    // CASO B: NOVA RESERVA NO CHECKOUT (100% OU 50% SINAL)
    // =========================================================================
    let clienteId = '';
    let criancasProcessadas: any[] = [];
    let resetLink = '';

    if (isGuest && guestData) {
      const emailLimpo = guestData.email.trim().toLowerCase();
      const { data: existingUser } = await supabaseAdmin
        .from('perfis')
        .select('id')
        .ilike('email', emailLimpo)
        .maybeSingle();

      if (existingUser) {
        // Se já tinha conta (ex: enviou uma dúvida antes), reutiliza o ID sem bloquear a compra!
        clienteId = existingUser.id;
      } else {
        const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: emailLimpo,
          email_confirm: true,
          password: Math.random().toString(36).slice(-10) + 'A1!',
          user_metadata: { nome_completo: guestData.nome, telefone: guestData.telefone, role: 'cliente' }
        });

        if (authError) throw new Error("Erro ao criar conta de cliente: " + authError.message);
        clienteId = newUser.user.id;

        await supabaseAdmin.from('perfis').upsert({
          id: clienteId,
          email: emailLimpo,
          nome_completo: guestData.nome,
          telefone: guestData.telefone,
          nif: guestData.nif || null,
          contacto_emergencia: guestData.contacto_emergencia || null,
          role: 'cliente'
        });
      }

      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: emailLimpo
      });
      resetLink = linkData?.properties?.action_link || '';

      for (const c of (criancas || [])) {
        const { id, isGuestChild, escolhas_multiplas_url, ...childData } = c;
        const { data: newC, error: cErr } = await supabaseAdmin
          .from('criancas')
          .insert({ cliente_id: clienteId, ...childData })
          .select()
          .single();
        if (cErr) throw new Error("Erro ao gravar dados do participante: " + cErr.message);
        criancasProcessadas.push({ ...newC, escolhas_multiplas_url });
      }
    } else {
      const { data: userData } = await supabaseAdmin
        .from('perfis')
        .select('id')
        .ilike('email', userEmail.trim())
        .maybeSingle();
      if (!userData) throw new Error("Utilizador autenticado não encontrado.");
      clienteId = userData.id;
      criancasProcessadas = criancas || [];
    }

    const insercoes = criancasProcessadas.map((crianca: any, index: number) => {
      const respTexto = reservaSpecs?.respostas_customizadas ? reservaSpecs.respostas_customizadas[index] || {} : {};
      const respOpcoes = crianca.escolhas_multiplas_url || (reservaSpecs?.opcoes_participantes_url ? reservaSpecs.opcoes_participantes_url[index + 1] : {}) || {};

      return {
        cliente_id: clienteId,
        crianca_id: crianca.id,
        campo_id: campoId,
        organizador_id: organizadorId,
        quantidade_criancas: 1,
        valor_total: reservaSpecs.valor_por_reserva,
        turno_nome: reservaSpecs.turno_nome,
        status_pagamento: 'Pendente',
        extras_escolhidos: reservaSpecs.extras_escolhidos,
        respostas_customizadas: { ...respTexto, ...respOpcoes }
      };
    });

    const { data: idsCriados, error: rpcError } = await supabaseAdmin.rpc('criar_reserva_segura', {
      p_insercoes: insercoes
    });

    if (rpcError) {
      if (rpcError.message.includes('ESGOTADO')) {
        throw new Error("Lamentamos, mas as vagas para este turno acabaram de esgotar.");
      }
      throw new Error("Erro ao bloquear vagas na BD: " + rpcError.message);
    }

    try {
      if (idsCriados && idsCriados.length > 0 && campoId && organizadorId) {
        const isSinal = tipoPagamento === '50_sinal';
        const msgTexto = isSinal
          ? `📢 Nova intenção de inscrição iniciada! O cliente escolheu pagar sinal de 50%. A aguardar conclusão na Stripe. (Ref Reservas: ${idsCriados.join(', ')})`
          : `📢 Nova intenção de inscrição iniciada! O cliente escolheu pagar 100% da totalidade. A aguardar conclusão na Stripe. (Ref Reservas: ${idsCriados.join(', ')})`;
        await supabaseAdmin.from('mensagens').insert([{
          campo_id: campoId,
          sender_id: clienteId,
          receiver_id: organizadorId,
          texto: msgTexto,
          lida: false
        }]);
      }
    } catch (chatErr) {}

    const isSinal = tipoPagamento === '50_sinal';
    const valorCobrarAgora = isSinal ? (totalAmount / 2) : totalAmount;
    const nomeProdutoStripe = isSinal ? `Sinal (50%) - ${campoNome}` : `Inscrição - ${campoNome}`;

    const sessionData: Stripe.Checkout.SessionCreateParams = {
      customer_email: userEmail,
      customer_creation: 'always',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: nomeProdutoStripe },
          unit_amount: Math.round(valorCobrarAgora * 100)
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${siteUrl}/${safeLang}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${safeLang}/campo/${campoId}`,
      metadata: {
        reservasIds: JSON.stringify(idsCriados),
        valor_total_original: totalAmount.toString(),
        pagamento_tipo: isSinal ? '50_sinal' : '100_total',
        is_guest: isGuest ? 'true' : 'false',
        guest_reset_link: resetLink
      },
    };

    if (stripeAccountId) {
      (sessionData as any).payment_intent_data = {
        application_fee_amount: Math.round((valorCobrarAgora * taxaComissao) * 100),
        transfer_data: { destination: stripeAccountId }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    // Guarda o session_id na reserva para facilitar reembolsos futuros!
    await supabaseAdmin
      .from('reservas')
      .update({ stripe_session_id: session.id })
      .in('id', idsCriados);

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error("Erro no Checkout:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
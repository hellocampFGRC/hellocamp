import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return NextResponse.json({ error: "Chave Stripe não encontrada." }, { status: 500 });
  
  const stripe = new Stripe(stripeSecretKey);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  // Usar a Service Role Key para ter permissões de Admin (criar users, ignorar RLS nas reservas)
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await req.json();
    const { 
      totalAmount, userEmail, lang, campoNome, stripeAccountId, 
      tipoPagamento, campoId, isGuest, guestData, criancas, reservaSpecs 
    } = body;
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hellocamp.pt';

    // 1. Obter a comissão e o organizador_id do campo na base de dados
    let taxaComissao = 0.12; 
    let organizadorId = null;
    
    if (campoId) {
      const { data: campoData } = await supabaseAdmin
        .from('campos')
        .select('taxa_comissao, comissao, organizador_id')
        .eq('id', campoId)
        .single();
        
      if (campoData) {
        organizadorId = campoData.organizador_id;
        const comissaoDb = campoData.taxa_comissao || campoData.comissao;
        if (comissaoDb) {
          taxaComissao = comissaoDb / 100;
        }
      }
    }

    // ==========================================
    // 2. GESTÃO DE UTILIZADOR (GUEST VS LOGGED IN)
    // ==========================================
    let clienteId = '';
    let criancasProcessadas = [];
    let resetLink = '';

    if (isGuest && guestData) {
      // A. Verificar se o e-mail já existe
      const { data: existingUser } = await supabaseAdmin.from('perfis').select('id').eq('email', guestData.email).single();
      if (existingUser) {
        return NextResponse.json({ error: "Já existe uma conta com este e-mail. Por favor, faça login para continuar." }, { status: 400 });
      }

      // B. Criar User silenciosamente no Auth
      const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: guestData.email,
        email_confirm: true, // Já fica confirmado automaticamente
        user_metadata: { 
          nome: guestData.nome,
          telefone: guestData.telefone,
          role: 'pai'
        }
      });

      if (authError) throw new Error("Erro ao criar conta de convidado: " + authError.message);
      clienteId = newUser.user.id;

      // C. Gerar Link Mágico de Recuperação de Password (para enviarmos depois via Webhook)
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: guestData.email
      });
      resetLink = linkData?.properties?.action_link || '';

      // Esperar 1 segundo para garantir que as triggers da BD criam o perfil do pai
      await new Promise(resolve => setTimeout(resolve, 1000));

      // D. Inserir Crianças na BD com o novo clienteId
      for (const c of criancas) {
        const { id, isGuestChild, ...childData } = c; // Remover o ID temporário gerado no frontend
        const { data: newC, error: cErr } = await supabaseAdmin.from('criancas').insert({
            cliente_id: clienteId,
            ...childData
        }).select().single();
        
        if (cErr) throw new Error("Erro ao gravar dados do participante: " + cErr.message);
        criancasProcessadas.push(newC);
      }
    } else {
      // Utilizador Logado (buscar o ID pelo email)
      const { data: userData } = await supabaseAdmin.from('perfis').select('id').eq('email', userEmail).single();
      if (!userData) throw new Error("Utilizador autenticado não encontrado.");
      clienteId = userData.id;
      criancasProcessadas = criancas;
    }

    // ==========================================
    // 3. CRIAR AS RESERVAS NO SUPABASE (SEGURANÇA ANTI-OVERBOOKING)
    // ==========================================
    const insercoes = criancasProcessadas.map((crianca: any, index: number) => ({
      cliente_id: clienteId,
      crianca_id: crianca.id,
      campo_id: campoId,
      organizador_id: organizadorId,
      quantidade_criancas: 1,
      valor_total: reservaSpecs.valor_por_reserva,
      turno_nome: reservaSpecs.turno_nome,
      status_pagamento: 'Pendente',
      extras_escolhidos: reservaSpecs.extras_escolhidos,
      respostas_customizadas: reservaSpecs.respostas_customizadas ? reservaSpecs.respostas_customizadas[index] : {}
    }));

    // Chamamos a função RPC para garantir que a vaga ainda existe no exato segundo do clique
    const { data: idsCriados, error: rpcError } = await supabaseAdmin.rpc('criar_reserva_segura', {
      p_insercoes: insercoes
    });
    
    if (rpcError) {
      if (rpcError.message.includes('ESGOTADO')) {
        throw new Error("Lamentamos, mas as vagas para este turno acabaram de esgotar.");
      }
      throw new Error("Erro ao bloquear vagas na BD: " + rpcError.message);
    }

    // ==========================================
    // 4. DISPARO AUTOMÁTICO DE MENSAGEM LOGÍSTICA NA INBOX
    // ==========================================
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
    } catch (chatErr) {
      console.error("Erro em background ao inicializar chat no checkout:", chatErr);
    }

    // ==========================================
    // 5. INICIALIZAR STRIPE CHECKOUT
    // ==========================================
    const isSinal = tipoPagamento === '50_sinal';
    const valorCobrarAgora = isSinal ? (totalAmount / 2) : totalAmount;
    const nomeProdutoStripe = isSinal ? `Sinal (50%) - ${campoNome}` : `Inscrição - ${campoNome}`;

    const sessionData: Stripe.Checkout.SessionCreateParams = {
      customer_email: userEmail, // Se for Guest, já enviamos o email inserido manualmente
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
      success_url: `${siteUrl}/${lang}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${lang}/campo/${campoId}`, // Volta para a página do campo se cancelar
      metadata: {
        reservasIds: JSON.stringify(idsCriados),
        valor_total_original: totalAmount.toString(),
        pagamento_tipo: isSinal ? '50_sinal' : '100_total',
        is_guest: isGuest ? 'true' : 'false',
        guest_reset_link: resetLink // GUARDAMOS O LINK PARA O WEBHOOK ENVIAR NO EMAIL!
      },
    };

    // Aplicação de Split de Pagamento (Comissão HelloCamp vs Parceiro)
    if (stripeAccountId) {
      (sessionData as any).payment_intent_data = {
        application_fee_amount: Math.round((valorCobrarAgora * taxaComissao) * 100),
        transfer_data: { destination: stripeAccountId }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    return NextResponse.json({ url: session.url });
    
  } catch (err: any) {
    console.error("Erro no Checkout:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
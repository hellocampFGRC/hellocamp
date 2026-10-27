import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!stripeSecretKey || !resendApiKey || !supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Configurações de servidor em falta." }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' as any });
  const resend = new Resend(resendApiKey);
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { reservaId } = await req.json();

    // 1. Busca da Reserva
    const { data: reserva, error: fetchError } = await supabase
      .from('reservas')
      .select('*')
      .eq('id', reservaId)
      .single();

    if (fetchError || !reserva) throw new Error("Reserva não encontrada na Base de Dados.");
    if (reserva.status_pagamento === 'Reembolsado' || reserva.status_reembolso === 'Reembolsado') {
      throw new Error("Esta reserva já se encontra cancelada e tratada.");
    }

    // 2. Busca de Dados Complementares (incluindo datas do campo para fallback seguro)
    const { data: campoData } = await supabase
      .from('campos')
      .select('nome, local, politica_cancelamento, data_inicio, pacotes, calendario_funcionamento')
      .eq('id', reserva.campo_id)
      .single();
    const { data: criancaData } = await supabase.from('criancas').select('nome').eq('id', reserva.crianca_id).single();
    const { data: clienteData } = await supabase.from('perfis').select('nome_completo, email').eq('id', reserva.cliente_id).single();
    const { data: orgData } = await supabase.from('perfis').select('email, empresa_nome, stripe_account_id').eq('id', reserva.organizador_id).single();

    // 3. MATEMÁTICA: Calcular Dias até ao Início do Campo (Com 5 Níveis de Fallback Seguro)
    let dataInicioTurno: Date | null = null;

    // Fallback 1: Coluna reserva.turno (se existir)
    try {
      const turnoObj = typeof reserva.turno === 'string' ? JSON.parse(reserva.turno) : reserva.turno;
      if (turnoObj?.data_inicio) dataInicioTurno = new Date(turnoObj.data_inicio);
    } catch (e) {}

    // Fallback 2: Primeiro dia escolhido em extras_escolhidos.dias_soltos (formato YYYY-MM-DD)
    if (!dataInicioTurno || isNaN(dataInicioTurno.getTime())) {
      const diasSoltos = reserva.extras_escolhidos?.dias_soltos;
      if (Array.isArray(diasSoltos) && diasSoltos.length > 0) {
        const diasOrdenados = [...diasSoltos].sort();
        const d = new Date(diasOrdenados[0]);
        if (!isNaN(d.getTime())) dataInicioTurno = d;
      }
    }

    // Fallback 3: Calendário de funcionamento do campo ou data_inicio do campo
    if (!dataInicioTurno || isNaN(dataInicioTurno.getTime())) {
      const calInicio = campoData?.calendario_funcionamento?.data_inicio || campoData?.data_inicio;
      if (calInicio) {
        const d = new Date(calInicio);
        if (!isNaN(d.getTime())) dataInicioTurno = d;
      }
    }

    // Fallback 4: Se o campo não tiver data fixa definida (ex: aberto todo o ano), assume 30 dias de antecedência para não bloquear o pai
    if (!dataInicioTurno || isNaN(dataInicioTurno.getTime())) {
      dataInicioTurno = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const inicio = new Date(dataInicioTurno);
    inicio.setHours(0, 0, 0, 0);
    const diffDias = Math.ceil((inicio.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    // 4. LÓGICA DE CANCELAMENTO (Flexível, Moderada, Estrita)
    const politica = campoData?.politica_cancelamento || 'Flexível';
    const valorPagoGeral = Number(reserva.valor_pago) || Number(reserva.valor_total) || 0;
    let valorAReembolsar = 0;
    let descricaoPolitica = 'Estrita (Sem Reembolso)';

    if (politica.includes('Flexível')) {
      if (diffDias >= 7) {
        valorAReembolsar = valorPagoGeral;
        descricaoPolitica = 'Flexível (100% devolvido)';
      } else {
        descricaoPolitica = `Flexível (Cancelado a menos de 7 dias: ${diffDias} dias)`;
      }
    } else if (politica.includes('Moderada')) {
      if (diffDias >= 15) {
        valorAReembolsar = valorPagoGeral * 0.5;
        descricaoPolitica = 'Moderada (50% devolvido)';
      } else {
        descricaoPolitica = `Moderada (Cancelado a menos de 15 dias: ${diffDias} dias)`;
      }
    } else if (politica.includes('Estrita')) {
      valorAReembolsar = 0;
      descricaoPolitica = 'Estrita (0% devolvido)';
    }

    // 5. EXECUTAR REEMBOLSO NA STRIPE (Apenas se houver valor a devolver)
    let paymentIntentId = reserva.stripe_payment_intent_id;

    if (valorAReembolsar > 0) {
      if (!paymentIntentId && reserva.stripe_session_id) {
        const session = await stripe.checkout.sessions.retrieve(reserva.stripe_session_id);
        paymentIntentId = session.payment_intent as string;
      }
      if (!paymentIntentId) {
        const sessions = await stripe.checkout.sessions.list({ limit: 100 });
        const matchSession = sessions.data.find(s => {
          if (s.metadata && s.metadata.reservasIds) {
            try { return JSON.parse(s.metadata.reservasIds).includes(reservaId); } catch (e) { return false; }
          }
          return false;
        });
        paymentIntentId = matchSession?.payment_intent as string;
      }

      if (!paymentIntentId) {
        throw new Error("Transação Stripe não encontrada. O reembolso financeiro terá de ser manual.");
      }

      const quantiaReembolsoCentimos = Math.round(valorAReembolsar * 100);
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        amount: quantiaReembolsoCentimos,
        reason: 'requested_by_customer'
      };

      if (orgData?.stripe_account_id) {
        refundParams.reverse_transfer = true;
        if (valorAReembolsar === valorPagoGeral) {
          refundParams.refund_application_fee = true;
        }
      }

      await stripe.refunds.create(refundParams);
    }

    // 6. ATUALIZAR A BASE DE DADOS
    await supabase.from('reservas').update({
      status_pagamento: 'Reembolsado',
      status_reembolso: 'Reembolsado',
      status: 'Reembolsado',
      dados_reembolso: {
        data_estorno: new Date().toISOString(),
        processado_por: 'Automático via Cliente',
        politica_aplicada: descricaoPolitica,
        valor_devolvido: valorAReembolsar
      }
    }).eq('id', reservaId);

    // 7. ENVIO DOS EMAILS
    const campoNome = campoData?.nome || 'Programa HelloCamp';
    const nomeCrianca = criancaData?.nome || 'Participante';
    const turnoNome = reserva.turno_nome || 'Programa Base';
    const valorStr = valorAReembolsar.toFixed(2);

    const emailPai = clienteData?.email || reserva.email_encarregado;
    const emailCampo = orgData?.email || 'info@hellocamp.pt';
    const nomeOrganizador = orgData?.empresa_nome || 'Organizador';
    const nomePai = clienteData?.nome_completo || reserva.nome_encarregado || 'Encarregado de Educação';

    if (emailPai) {
      await resend.emails.send({
        from: 'HelloCamp Finanças <info@hellocamp.pt>',
        to: emailPai,
        subject: `Confirmação de Cancelamento - ${campoNome}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #0f172a;">
            <h1 style="font-size: 24px; font-weight: 900; text-align: center; margin-bottom: 30px; color: #0f172a;">HelloCamp</h1>
            <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 12px; padding: 25px; text-align: center;">
              <h2 style="font-size: 18px; font-weight: 700; margin-top: 0; color: #991b1b;">Inscrição Cancelada com Sucesso</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #991b1b; margin-bottom: 0;">Olá <strong>${nomePai}</strong>, confirmamos o cancelamento da sua reserva.</p>
            </div>
            <div style="margin: 30px 0;">
              <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Resumo do Cancelamento</h3>
              <table width="100%" style="font-size: 14px; color: #334155; margin-top: 12px; line-height: 2;">
                <tr><td><strong>Programa:</strong></td><td style="text-align: right;">${campoNome}</td></tr>
                <tr><td><strong>Turno / Semana:</strong></td><td style="text-align: right;">${turnoNome}</td></tr>
                <tr><td><strong>Participante:</strong></td><td style="text-align: right;">${nomeCrianca}</td></tr>
                <tr><td><strong>Política Aplicada:</strong></td><td style="text-align: right;">${descricaoPolitica}</td></tr>
                <tr><td style="padding-top: 10px; border-top: 1px dashed #e2e8f0;"><strong>Valor Estornado:</strong></td><td style="text-align: right; font-weight: bold; color: #dc2626; font-size: 16px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">${valorStr}€</td></tr>
              </table>
            </div>
          </div>
        `
      });
    }

    await resend.emails.send({
      from: 'HelloCamp Parceiros <info@hellocamp.pt>',
      to: emailCampo,
      subject: `Atualização de Ocupação: Cancelamento - ${campoNome}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #b91c1c; border-bottom: 2px solid #b91c1c; padding-bottom: 10px; font-size: 20px;">Vaga Libertada - Cancelamento</h2>
          <p>Caro parceiro da entidade <strong>${nomeOrganizador}</strong>,</p>
          <p>Informamos que uma vaga para o seu programa foi cancelada por iniciativa do cliente.</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; line-height: 1.8;">
            <p style="margin: 0;"><strong>Programa de Férias:</strong> ${campoNome}</p>
            <p style="margin: 0;"><strong>Turno Afetado:</strong> ${turnoNome}</p>
            <p style="margin: 0;"><strong>Participante removido:</strong> ${nomeCrianca}</p>
            <p style="margin: 0; color: #dc2626;"><strong>Valor Reembolsado ao Cliente:</strong> ${valorStr}€ (${descricaoPolitica})</p>
          </div>
        </div>
      `
    });

    await resend.emails.send({
      from: 'HelloCamp Control <info@hellocamp.pt>',
      to: 'info@hellocamp.pt',
      subject: `[Cancelamento Auto] ${valorStr}€ Devolvidos - ${campoNome}`,
      html: `
        <div style="font-family: monospace; font-size: 13px; color: #1e293b; padding: 30px; background-color: #fdfdfd; border: 1px solid #cbd5e1; border-radius: 8px; max-width: 650px; margin: 0 auto;">
          <h2 style="color: #0f172a; margin-top: 0;">🚨 RELATÓRIO DE CANCELAMENTO</h2>
          <p><strong>ID da Reserva:</strong> ${reservaId}</p>
          <p><strong>Programa:</strong> ${campoNome}</p>
          <p><strong>Regra Aplicada:</strong> ${descricaoPolitica} (${diffDias} dias p/ início)</p>
          <p><strong>Valor Devolvido:</strong> ${valorStr}€</p>
        </div>
      `
    });

    return NextResponse.json({ success: true, estorno: valorAReembolsar });

  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao processar o pedido: " + error.message }, { status: 500 });
  }
}
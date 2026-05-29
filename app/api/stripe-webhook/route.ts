import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!stripeSecretKey || !webhookSecret || !resendApiKey) {
    console.error("Faltam variáveis de ambiente da Stripe ou Resend na Vercel.");
    return new NextResponse('Configuração de servidor incompleta.', { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const resend = new Resend(resendApiKey);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const body = await req.text(); 
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error("Erro na assinatura do Webhook:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.metadata?.reservasIds) {
      const reservasIds = JSON.parse(session.metadata.reservasIds);

      // 1. ATUALIZAR STATUS PARA PAGO
      const { error: updateError } = await supabase
        .from('reservas')
        .update({ status_pagamento: 'Pago' })
        .in('id', reservasIds);

      if (updateError) {
        console.error('Erro ao atualizar reservas no Supabase:', updateError);
        return new NextResponse('Erro na Base de Dados', { status: 500 });
      }

      // 2. RECOLHER DADOS PARA OS EMAILS
      const { data: reservasData } = await supabase
        .from('reservas')
        .select(`
          valor_total,
          turno_nome,
          organizador_id,
          criancas ( nome ),
          campos ( nome )
        `)
        .in('id', reservasIds);

      if (reservasData && reservasData.length > 0) {
        
        // CORREÇÃO TYPESCRIPT: Tratamento seguro das junções (Joins) do Supabase
        const campoObj: any = reservasData[0].campos;
        const campoNome = Array.isArray(campoObj) ? campoObj[0]?.nome : campoObj?.nome || 'Campo de Férias';
        
        const turnoNome = reservasData[0].turno_nome || 'Programa Base';
        
        const nomesCriancas = reservasData.map(r => {
          const criancaObj: any = r.criancas;
          return Array.isArray(criancaObj) ? criancaObj[0]?.nome : criancaObj?.nome;
        }).filter(Boolean).join(', ');

        const emailPai = session.customer_email || session.customer_details?.email || '';
        const valorTotal = (session.amount_total || 0) / 100;

        const { data: organizadorData } = await supabase
          .from('perfis')
          .select('email')
          .eq('id', reservasData[0].organizador_id)
          .single();
        
        const emailCampo = organizadorData?.email || 'info@hellocamp.pt'; 
        const emailHelloCamp = 'rcruz1010@hotmail.com'; 

        // 3. DISPARAR OS EMAILS SIMULTANEAMENTE

        if (emailPai) {
          await resend.emails.send({
            from: 'HelloCamp <info@hellocamp.pt>', 
            to: emailPai,
            subject: `🎉 Confirmação de Reserva: ${campoNome}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                <h2 style="color: #059669;">A sua reserva está confirmada!</h2>
                <p>Obrigado por escolher a HelloCamp. O pagamento foi recebido com sucesso e a vaga está garantida.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Campo:</strong> ${campoNome}</p>
                  <p><strong>Participante(s):</strong> ${nomesCriancas}</p>
                  <p><strong>Turno/Programa:</strong> ${turnoNome}</p>
                  <p><strong>Valor Pago:</strong> ${valorTotal.toFixed(2)}€</p>
                </div>
                <p style="font-size: 14px; color: #64748b;">Em breve, o organizador do campo entrará em contacto com mais detalhes (o que levar, pontos de encontro, etc).</p>
              </div>
            `,
          });
        }

        await resend.emails.send({
          from: 'HelloCamp Notificações <info@hellocamp.pt>',
          to: emailCampo,
          subject: `Nova Inscrição Recebida! - ${nomesCriancas}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
              <h2 style="color: #0f172a;">Tem uma nova inscrição paga!</h2>
              <p>O pagamento já foi processado através da plataforma HelloCamp e o valor será transferido para a sua conta Stripe consoante o acordo.</p>
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 20px 0;">
                <p><strong>Participante(s):</strong> ${nomesCriancas}</p>
                <p><strong>Programa/Turno:</strong> ${turnoNome}</p>
                <p><strong>Email do Encarregado:</strong> ${emailPai}</p>
              </div>
              <p>Por favor, consulte o seu Dashboard de Parceiro para verificar detalhes de NIF e restrições alimentares.</p>
            </div>
          `,
        });

        await resend.emails.send({
          from: 'HelloCamp Sistema <info@hellocamp.pt>',
          to: emailHelloCamp,
          subject: `🚨 Nova Venda: ${campoNome} (${valorTotal}€)`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #0f172a;">Nova Transação Registada</h2>
              <p><strong>Valor Total:</strong> ${valorTotal.toFixed(2)}€</p>
              <p><strong>Campo:</strong> ${campoNome}</p>
              <p><strong>Cliente:</strong> ${emailPai}</p>
              <p><strong>Crianças:</strong> ${nomesCriancas}</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">Comissão já retida automaticamente na Stripe.</p>
            </div>
          `,
        });

        console.log(`Webhooks e 3 Emails processados para as reservas ${reservasIds.join(', ')}`);
      }
    }
  }

  return new NextResponse('Webhook processado com sucesso.', { status: 200 });
}
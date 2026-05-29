import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Força a rota a ser sempre dinâmica e desativa a geração estática no build
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Inicialização tardia: A Stripe e o Supabase só são instanciados AQUI DENTRO.
  // Isto impede o Next.js de tentar ler as chaves de API durante o "npm run build".
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!stripeSecretKey || !webhookSecret) {
    console.error("Faltam variáveis de ambiente da Stripe na Vercel.");
    return new NextResponse('Configuração de servidor incompleta.', { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const body = await req.text(); 
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error: any) {
    console.error("Erro na assinatura do Webhook:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.metadata?.reservasIds) {
      const reservasIds = JSON.parse(session.metadata.reservasIds);

      const { error } = await supabase
        .from('reservas')
        .update({ status_pagamento: 'Pago' })
        .in('id', reservasIds);

      if (error) {
        console.error('Erro ao atualizar reservas no Supabase:', error);
        return new NextResponse('Erro na Base de Dados', { status: 500 });
      }
      
      console.log(`Reservas ${reservasIds.join(', ')} marcadas como Pago!`);
    }
  }

  return new NextResponse('Webhook processado com sucesso.', { status: 200 });
}
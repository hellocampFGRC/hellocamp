import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Inicializa o Supabase do lado do servidor para gravar o ID com segurança
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Chave Secreta da Stripe não configurada no servidor." }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    const body = await req.json();
    const { userId, email, lang } = body;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hellocamp.pt';

    // 1. Procurar se o perfil já tem uma conta Stripe Connect associada
    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    let stripeAccountId = perfil?.stripe_account_id;

    // 2. Se não tiver, cria uma conta Express nova na Stripe
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      stripeAccountId = account.id;

      // Grava o novo ID imediatamente na tabela perfis do utilizador
      await supabaseAdmin
        .from('perfis')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', userId);
    }

    // 3. Gerar o link oficial de Onboarding (onde o parceiro vai colocar os dados bancários com segurança)
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${siteUrl}/${lang}/dashboard/faturacao`, // Se falhar ou expirar, volta aqui
      return_url: `${siteUrl}/${lang}/dashboard/faturacao`,  // Se concluir com sucesso, volta aqui
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
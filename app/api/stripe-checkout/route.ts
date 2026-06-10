import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return NextResponse.json({ error: "Chave não encontrada." }, { status: 500 });
  const stripe = new Stripe(stripeSecretKey);

  try {
    const body = await req.json();
    const { reservasIds, totalAmount, userEmail, lang, campoNome, stripeAccountId, tipoPagamento } = body;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hellocamp.pt';

    const isSinal = tipoPagamento === '50_sinal';
    const valorCobrarAgora = isSinal ? (totalAmount / 2) : totalAmount;
    const nomeProdutoStripe = isSinal ? `Sinal (50%) - ${campoNome}` : `Inscrição - ${campoNome}`;

    const sessionData: Stripe.Checkout.SessionCreateParams = {
      customer_email: userEmail,
      customer_creation: 'always', 
      line_items: [{
        price_data: { currency: 'eur', product_data: { name: nomeProdutoStripe }, unit_amount: Math.round(valorCobrarAgora * 100) },
        quantity: 1,
      }],
      mode: 'payment',
      payment_intent_data: { setup_future_usage: 'off_session' },
      success_url: `${siteUrl}/${lang}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${lang}`,
      metadata: {
        reservasIds: JSON.stringify(reservasIds),
        valor_total_original: totalAmount.toString(),
        pagamento_tipo: isSinal ? '50_sinal' : '100_total'
      },
    };

    if (stripeAccountId) {
      // CORREÇÃO TS: Usar `any` temporário para evitar erros de tipagem estrita no transfer_data
      (sessionData as any).payment_intent_data.application_fee_amount = Math.round((valorCobrarAgora * 0.15) * 100);
      (sessionData as any).payment_intent_data.transfer_data = { destination: stripeAccountId };
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return NextResponse.json({ error: "Chave não encontrada." }, { status: 500 });
  
  const stripe = new Stripe(stripeSecretKey);

  // Inicializar o Supabase no lado do servidor para consultar a comissão
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    // Certifique-se que o seu frontend envia o campoId para sabermos de que campo estamos a falar
    const { reservasIds, totalAmount, userEmail, lang, campoNome, stripeAccountId, tipoPagamento, campoId } = body;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hellocamp.pt';

    // 1. Obter a comissão real da base de dados (Ex: 12%)
    let taxaComissao = 0.12; // Valor default de segurança
    if (campoId) {
      const { data: campoData } = await supabase
        .from('campos')
        .select('comissao')
        .eq('id', campoId)
        .single();
        
      if (campoData && campoData.comissao) {
        // Se na BD a comissão estiver como 12, transformamos em 0.12 para a matemática
        taxaComissao = campoData.comissao / 100;
      }
    }

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
      success_url: `${siteUrl}/${lang}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${lang}`,
      metadata: {
        reservasIds: JSON.stringify(reservasIds),
        valor_total_original: totalAmount.toString(),
        pagamento_tipo: isSinal ? '50_sinal' : '100_total'
      },
    };

    if (stripeAccountId) {
      (sessionData as any).payment_intent_data = {
        // Usa a taxa de comissão dinâmica buscada da BD!
        application_fee_amount: Math.round((valorCobrarAgora * taxaComissao) * 100),
        transfer_data: { destination: stripeAccountId }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
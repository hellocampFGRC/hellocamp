import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos o Service Role Key para garantir que o sistema pode escrever na inbox do parceiro 
// independentemente das políticas RLS (Row Level Security) do pai.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reservaId, organizadorId, campoNome, mensagem, lang } = body;

    if (!reservaId || !organizadorId || !mensagem) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 });
    }

    const isEn = lang === 'en';
    const assunto = isEn ? `Change Request: ${campoNome}` : `Pedido de Alteração: ${campoNome}`;

    // 1. Inserir na tabela de Mensagens (Inbox)
    // Assumindo que a sua tabela se chama 'mensagens'
    const { error: dbError } = await supabase.from('mensagens').insert({
      reserva_id: reservaId,
      remetente_id: 'sistema', // Identificador de que é uma notificação automática
      destinatario_id: organizadorId,
      assunto: assunto,
      conteudo: `O encarregado de educação solicitou a seguinte alteração/extra para a inscrição #${reservaId}:\n\n"${mensagem}"\n\nAceda à Central de Reservas para analisar o pedido e solicitar o Pagamento Extra se aplicável.`,
      lida: false
    });

    if (dbError) throw dbError;

    // 2. Buscar o Email do Organizador
    const { data: organizador } = await supabase
      .from('perfis')
      .select('email')
      .eq('id', organizadorId)
      .single();

    // 3. Disparar Email (Exemplo genérico para Mailgun/Resend)
    if (organizador?.email) {
      /*
      await fetch('SUA_API_DE_EMAIL', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: organizador.email,
          subject: assunto,
          text: `Tem um novo pedido de alteração para a reserva ${reservaId}. Aceda à sua plataforma HelloCamp para responder.`
        })
      });
      */
    }

    return NextResponse.json({ success: true, message: 'Pedido enviado com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
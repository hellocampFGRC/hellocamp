import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reservaId, organizadorId, campoNome, mensagem, lang = 'pt' } = body;

    if (!reservaId || !organizadorId || !mensagem) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 });
    }

    const safeLang = lang === 'en' ? 'en' : 'pt';
    const isEn = safeLang === 'en';
    const assunto = isEn ? `Change Request: ${campoNome}` : `Pedido de Alteração: ${campoNome}`;

    // 1. Procurar a reserva (incluindo campo_id e cliente_id para o Chat!)
    const { data: reserva, error: fetchError } = await supabase
      .from('reservas')
      .select('campo_id, cliente_id, respostas_customizadas')
      .eq('id', reservaId)
      .single();

    if (fetchError || !reserva) throw fetchError || new Error("Reserva não encontrada.");

    const respostasAtuais = reserva.respostas_customizadas || {};
    respostasAtuais.pedido_pai_pendente = mensagem;

    // 2. Atualizar a tabela de reservas com o alerta pendente
    const { error: updateError } = await supabase
      .from('reservas')
      .update({ respostas_customizadas: respostasAtuais })
      .eq('id', reservaId);

    if (updateError) throw updateError;

    // 3. Inserir na tabela de Mensagens usando as COLUNAS REAIS (campo_id, sender_id, receiver_id, texto, lida)
    if (reserva.campo_id && reserva.cliente_id) {
      const { error: dbError } = await supabase.from('mensagens').insert([{
        campo_id: reserva.campo_id,
        sender_id: reserva.cliente_id,
        receiver_id: organizadorId,
        texto: `📝 [Pedido de Alteração / Extra - Reserva #${reservaId.split('-')[0]}]\n\n"${mensagem}"`,
        lida: false
      }]);

      if (dbError) console.error("Aviso ao gravar mensagem no chat:", dbError);
    }

    // 4. Enviar o alerta por E-mail ao Organizador
    const { data: organizador } = await supabase
      .from('perfis')
      .select('email')
      .eq('id', organizadorId)
      .single();

    if (organizador?.email) {
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px; color: #0f172a; line-height: 1.6;">
          <h2 style="color: #0f172a; margin-top: 0;">${isEn ? 'New Change Request (HelloCamp)' : 'Novo Pedido de Alteração (HelloCamp)'}</h2>
          <p>${isEn
            ? `The parent/guardian for booking <strong>#${reservaId.split('-')[0]}</strong> sent a change or extra request for the program <strong>${campoNome}</strong>:`
            : `O encarregado de educação da reserva <strong>#${reservaId.split('-')[0]}</strong> enviou uma solicitação de alteração ou adição de extras para o programa <strong>${campoNome}</strong>:`}</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0; font-style: italic; white-space: pre-wrap;">"${mensagem}"</div>
          
          <p><strong>${isEn ? 'Action required:' : 'Ação necessária:'}</strong> ${isEn
            ? 'Access your Bookings Center on HelloCamp to review this request.'
            : 'Aceda à sua Central de Reservas na HelloCamp para analisar o pedido e ajustar o valor se aplicável.'}</p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="https://www.hellocamp.pt/${safeLang}/admin/reservas" style="display: inline-block; background-color: #167524; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              ${isEn ? 'Open Bookings Center' : 'Abrir Central de Reservas'}
            </a>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'HelloCamp Notificações <info@hellocamp.pt>',
        to: organizador.email,
        subject: assunto,
        html: htmlContent
      });
    }

    return NextResponse.json({ success: true, message: 'Pedido processado e enviado com sucesso.' });

  } catch (error: any) {
    console.error("Erro na API de pedido de alteração:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Usamos o Service Role Key para garantir que o sistema pode escrever na reserva
// independentemente das restrições de RLS do utilizador comum.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reservaId, organizadorId, campoNome, mensagem, lang } = body;

    if (!reservaId || !organizadorId || !mensagem) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 });
    }

    const isEn = lang === 'en';
    const assunto = isEn ? `Change Request: ${campoNome}` : `Pedido de Alteração: ${campoNome}`;

    // 1. Procurar as respostas customizadas atuais para preservar dados antigos (como a origem ou outros formulários)
    const { data: reserva, error: fetchError } = await supabase
      .from('reservas')
      .select('respostas_customizadas')
      .eq('id', reservaId)
      .single();

    if (fetchError) throw fetchError;

    const respostasAtuais = reserva?.respostas_customizadas || {};
    // Injetar a chave exata que a tabela e a ficha do parceiro procuram para exibir o alerta
    respostasAtuais.pedido_pai_pendente = mensagem;

    // 2. Atualizar a tabela de reservas com o novo estado do JSON
    const { error: updateError } = await supabase
      .from('reservas')
      .update({ respostas_customizadas: respostasAtuais })
      .eq('id', reservaId);

    if (updateError) throw updateError;

    // 3. Inserir na tabela de Mensagens para manter o histórico da Inbox/Chat síncrono
    const { error: dbError } = await supabase.from('mensagens').insert({
      reserva_id: reservaId,
      remetente_id: 'sistema', 
      destinatario_id: organizadorId,
      assunto: assunto,
      conteudo: `O encarregado de educação solicitou a seguinte alteração/extra para a inscrição #${reservaId}:\n\n"${mensagem}"\n\nAceda à Central de Reservas para analisar o pedido e solicitar o Pagamento Extra se aplicável.`,
      lida: false
    });

    if (dbError) throw dbError;

    // 4. Procurar o Email do Organizador para enviar o alerta real para a caixa de correio externa
    const { data: organizador } = await supabase
      .from('perfis')
      .select('email')
      .eq('id', organizadorId)
      .single();

    if (organizador?.email) {
      const htmlContent = `
        <div style="font-family: sans-serif; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #0f172a;">Novo Pedido de Alteração (HelloCamp)</h2>
          <p>O encarregado de educação da reserva <strong>#${reservaId}</strong> enviou uma solicitação de alteração ou adição de extras para o programa <strong>${campoNome}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0; font-style: italic;">
            "${mensagem}"
          </div>
          
          <p><strong>Ação necessária:</strong> Aceda à sua Central de Reservas na HelloCamp, abra a ficha deste participante e utilize o painel de Controlo Financeiro para lançar a cobrança adicional correspondente.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">Este é um e-mail automático gerado pelo sistema HelloCamp.</p>
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
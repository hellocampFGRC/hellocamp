import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    return NextResponse.json({ error: "Chave do Resend não configurada." }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);

  try {
    const body = await req.json();
    const { nome, emailCliente, mensagem, emailCampo, nomeCampo } = body;

    if (!emailCliente || !mensagem || !emailCampo) {
      return NextResponse.json({ error: "Faltam dados obrigatórios." }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'HelloCamp <info@hellocamp.pt>', 
      to: emailCampo,
      replyTo: emailCliente, 
      subject: `Nova Pergunta de um Pai - ${nomeCampo}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0f172a;">Tem uma nova mensagem via HelloCamp!</h2>
          <p style="color: #475569;"><strong>De:</strong> ${nome} (${emailCliente})</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #334155; white-space: pre-wrap;">${mensagem}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">Para responder a este pai, basta clicar em "Responder" no seu cliente de email.</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Email enviado com sucesso!', id: data?.id });

  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao processar o pedido: " + error.message }, { status: 500 });
  }
}
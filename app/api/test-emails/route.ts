import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function GET() {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    return NextResponse.json({ error: "Falta a chave do Resend no .env.local" }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);

  // 1. Dados Fictícios para a Simulação
  const campoNome = "Campo de Férias Aventura & Surf (Teste)";
  const turnoNome = "Semana 1 (15 a 19 Julho)";
  const nomesCriancas = "João Silva, Margarida Silva";
  const emailPai = "pai.exemplo@gmail.com";
  const valorTotal = 320.00;
  
  // 2. O Seu Email de Destino (Receberá as 3 perspetivas)
  const emailDestino = "info@hellocamp.pt"; 

  try {
    // A. Simulação do Email para o Pai
    await resend.emails.send({
      from: 'HelloCamp <info@hellocamp.pt>',
      to: emailDestino,
      subject: `[VISÃO PAI] 🎉 Confirmação de Reserva: ${campoNome}`,
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

    // B. Simulação do Email para o Parceiro (Campo)
    await resend.emails.send({
      from: 'HelloCamp Notificações <info@hellocamp.pt>',
      to: emailDestino,
      subject: `[VISÃO CAMPO] Nova Inscrição Recebida! - ${nomesCriancas}`,
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

    // C. Simulação do Email Interno (HelloCamp Admin)
    await resend.emails.send({
      from: 'HelloCamp Sistema <info@hellocamp.pt>',
      to: emailDestino,
      subject: `[VISÃO HELLOCAMP] 🚨 Nova Venda: ${campoNome} (${valorTotal}€)`,
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

    return NextResponse.json({ 
      success: true, 
      message: "Sucesso! Os 3 emails foram enviados. Vá verificar a sua caixa de entrada (rcruz1010@hotmail.com)." 
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao enviar os emails: " + error.message }, { status: 500 });
  }
}
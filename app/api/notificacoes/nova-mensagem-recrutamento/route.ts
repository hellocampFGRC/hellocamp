import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destinatarioEmail, nomeRemetente, textoMensagem, tipoDestinatario, lang = 'pt' } = body;

    // 1. Validação básica de segurança
    if (!destinatarioEmail || !nomeRemetente || !textoMensagem || !tipoDestinatario) {
      return NextResponse.json({ error: 'Faltam parâmetros obrigatórios.' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("Falta RESEND_API_KEY nas variáveis de ambiente (.env)");
      return NextResponse.json({ error: 'Erro de configuração no servidor.' }, { status: 500 });
    }

    const safeLang = lang === 'en' ? 'en' : 'pt';
    const isEn = safeLang === 'en';

    // 2. Lógica Bilingue e Contextual (Quem envia para quem?)
    let assunto = "";
    let tituloHtml = "";
    let textoIntroHtml = "";
    let linkBotao = "";
    let textoBotao = "";

    if (tipoDestinatario === 'monitor') {
      // O PARCEIRO/CAMPO está a enviar mensagem a um jovem (Monitor)
      assunto = isEn 
        ? `New recruitment message from ${nomeRemetente} - HelloCamp`
        : `Nova mensagem de recrutamento de ${nomeRemetente} - HelloCamp`;
      
      tituloHtml = isEn ? "You have a new job proposal!" : "Tens uma nova proposta de trabalho!";
      textoIntroHtml = isEn 
        ? `The camp organizer <strong>${nomeRemetente}</strong> sent you a direct message via HelloCamp's Staff Portal.`
        : `A entidade organizadora <strong>${nomeRemetente}</strong> enviou-te uma mensagem direta através da Bolsa de Monitores da HelloCamp.`;
      
      linkBotao = `https://www.hellocamp.pt/${safeLang}/monitores/login`;
      textoBotao = isEn ? "Open Portal and Reply" : "Abrir Portal e Responder";

    } else {
      // O JOVEM (Monitor) está a responder à mensagem do Parceiro
      assunto = isEn 
        ? `Candidate ${nomeRemetente} replied to your message - HelloCamp`
        : `O candidato ${nomeRemetente} respondeu à sua mensagem - HelloCamp`;
      
      tituloHtml = isEn ? "New candidate message" : "Nova resposta de candidato";
      textoIntroHtml = isEn 
        ? `The candidate <strong>${nomeRemetente}</strong> has replied to your recruitment message on HelloCamp.`
        : `O candidato <strong>${nomeRemetente}</strong> respondeu à sua mensagem de recrutamento na HelloCamp.`;
      
      // CORREÇÃO CRÍTICA: Link de login real
      linkBotao = `https://www.hellocamp.pt/${safeLang}/login`;
      textoBotao = isEn ? "View Message in Dashboard" : "Ver Mensagem no Dashboard";
    }

    // 3. Construção do Email em HTML (Com estilos inline para máxima compatibilidade no Gmail/Outlook)
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${assunto}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Hello<span style="color: #fbbf24;">Camp</span></h1>
          </div>
          <div style="padding: 32px; color: #334155; line-height: 1.6;">
            <h2 style="margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 800;">${tituloHtml}</h2>
            <p>${textoIntroHtml}</p>
            
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: bold; margin-bottom: 0;">${isEn ? "Message content:" : "Conteúdo da mensagem:"}</p>
            <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0 24px 0; border-radius: 0 8px 8px 0; font-style: italic; color: #1e293b; white-space: pre-wrap;">"${textoMensagem}"</div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${linkBotao}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
                ${textoBotao}
              </a>
            </div>
            
            <p style="font-size: 13px; color: #64748b;">
              ${isEn 
                ? "This is an automated notification. Please use the button above to reply on the platform." 
                : "Esta é uma notificação automática. Use o botão acima para continuar a conversa na plataforma."}
            </p>
          </div>
          <div style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            &copy; ${new Date().getFullYear()} HelloCamp. ${isEn ? "All rights reserved." : "Todos os direitos reservados."} <br>
            ${isEn ? "Talent & Recruitment Portal" : "Bolsa de Talentos & Recrutamento"}
          </div>
        </div>
      </body>
      </html>
    `;

    // 4. Disparo via Resend
    const { error } = await resend.emails.send({
      from: 'HelloCamp Recrutamento <info@hellocamp.pt>',
      to: destinatarioEmail,
      subject: assunto,
      html: emailHTML
    });

    if (error) {
      console.error("Falha no disparo Resend (Recrutamento):", error);
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, message: 'Email de notificação enviado com sucesso.' }, { status: 200 });

  } catch (error: any) {
    console.error("Erro interno na API de notificações (Recrutamento):", error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
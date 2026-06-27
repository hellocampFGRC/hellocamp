import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destinatarioEmail, nomeRemetente, textoMensagem, tipoDestinatario, lang } = body;

    // 1. Validação básica de segurança
    if (!destinatarioEmail || !nomeRemetente || !textoMensagem || !tipoDestinatario) {
      return NextResponse.json({ error: 'Faltam parâmetros obrigatórios.' }, { status: 400 });
    }

    const isEn = lang === 'en';

    // 2. Configuração das credenciais do Mailgun (Lidas do ficheiro .env)
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN; // Ex: mg.hellocamp.pt

    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.error("Faltam variáveis de ambiente do Mailgun (.env)");
      return NextResponse.json({ error: 'Erro de configuração no servidor.' }, { status: 500 });
    }

    // 3. Lógica Bilingue e Contextual (Quem envia para quem?)
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
      
      linkBotao = `https://hellocamp.pt/${lang}/monitores/login`;
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
      
      linkBotao = `https://hellocamp.pt/${lang}/admin/login`;
      textoBotao = isEn ? "View Message in Dashboard" : "Ver Mensagem no Dashboard";
    }

    // 4. Construção do Email em HTML (Design Limpo e Responsivo)
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${assunto}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background-color: #0f172a; padding: 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
          .header h1 span { color: #fbbf24; }
          .content { padding: 32px; color: #334155; line-height: 1.6; }
          .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 800; }
          .message-box { background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0; font-style: italic; color: #1e293b; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }
          .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Hello<span>Camp</span></h1>
          </div>
          <div class="content">
            <h2>${tituloHtml}</h2>
            <p>${textoIntroHtml}</p>
            
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: bold; margin-bottom: 0;">${isEn ? "Message content:" : "Conteúdo da mensagem:"}</p>
            <div class="message-box">
              "${textoMensagem}"
            </div>

            <div class="btn-container">
              <a href="${linkBotao}" class="btn">${textoBotao}</a>
            </div>
            
            <p style="font-size: 13px; color: #64748b;">
              ${isEn 
                ? "This is an automated notification. Please do not reply directly to this email." 
                : "Esta é uma notificação automática. Por favor, não responda diretamente a este email. Use o botão acima para continuar a conversa na plataforma."}
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} HelloCamp Portugal. ${isEn ? "All rights reserved." : "Todos os direitos reservados."} <br>
            Bolsa de Talentos & Recrutamento
          </div>
        </div>
      </body>
      </html>
    `;

    // 5. Preparar o envio via Mailgun usando Fetch nativo do Edge/Node
    const formData = new URLSearchParams();
    formData.append('from', `HelloCamp Notificações <noreply@${MAILGUN_DOMAIN}>`);
    formData.append('to', destinatarioEmail);
    formData.append('subject', assunto);
    formData.append('html', emailHTML);

    // Codificar a API Key para o Header de Basic Auth
    const basicAuth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');

    const mailgunResponse = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!mailgunResponse.ok) {
      const errorText = await mailgunResponse.text();
      console.error("Falha no disparo Mailgun:", errorText);
      throw new Error("Erro no serviço de email.");
    }

    return NextResponse.json({ success: true, message: 'Email de notificação enviado com sucesso.' }, { status: 200 });

  } catch (error: any) {
    console.error("Erro interno na API de notificações (Recrutamento):", error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
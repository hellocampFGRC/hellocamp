import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const { lead, campoNome, parceiroEmail, lang } = data;
    const isEn = lang === 'en';

    if (!lead || !lead.nome || !lead.email || !parceiroEmail) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios para envio da notificação.' }, { status: 400 });
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("A chave API da Brevo não está configurada no servidor.");
    }

    const emailHelloCamp = 'info@hellocamp.pt';

    // 1. CONSTRUÇÃO DO ASSUNTO
    const subject = isEn 
      ? `🎯 New Booking Lead: ${campoNome}` 
      : `🎯 Nova Intenção de Reserva: ${campoNome}`;

    // 2. CONSTRUÇÃO DO CORPO DO E-MAIL (HTML Profissional)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                
                <!-- CABEÇALHO -->
                <tr>
                  <td align="center" style="background-color: #0f172a; padding: 30px;">
                    <div style="font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #ffffff;">
                      <span>Hello</span><span style="color: #EBA914;">Camp</span>
                    </div>
                  </td>
                </tr>

                <!-- CORPO DA MENSAGEM -->
                <tr>
                  <td align="left" style="padding: 40px 30px;">
                    <h2 style="font-size: 20px; font-weight: bold; color: #0f172a; margin: 0 0 20px 0;">
                      ${isEn ? 'New Booking Intent' : 'Nova Intenção de Reserva'}
                    </h2>
                    
                    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 25px 0;">
                      ${isEn 
                        ? `A customer has shown a strong interest in booking <strong>${campoNome}</strong> and was redirected to your official external form to complete the registration.` 
                        : `Um cliente demonstrou forte intenção de reserva no programa <strong>${campoNome}</strong> e foi reencaminhado da plataforma HelloCamp para o vosso formulário oficial para concluir a inscrição.`}
                    </p>

                    <!-- CAIXA DE DADOS DO CLIENTE -->
                    <div style="background-color: #f1f5f9; border-left: 4px solid #059669; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                      <h3 style="font-size: 12px; text-transform: uppercase; color: #64748b; margin: 0 0 10px 0; letter-spacing: 1px;">
                        ${isEn ? 'Customer Details (Lead)' : 'Dados do Cliente (Lead)'}
                      </h3>
                      <p style="margin: 0 0 8px 0; font-size: 15px; color: #0f172a;">
                        <strong>${isEn ? 'Name' : 'Nome'}:</strong> ${lead.nome}
                      </p>
                      <p style="margin: 0 0 8px 0; font-size: 15px; color: #0f172a;">
                        <strong>E-mail:</strong> <a href="mailto:${lead.email}" style="color: #0284c7; text-decoration: none;">${lead.email}</a>
                      </p>
                      <p style="margin: 0; font-size: 15px; color: #0f172a;">
                        <strong>${isEn ? 'Phone' : 'Telefone'}:</strong> ${lead.telefone}
                      </p>
                    </div>

                    <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 30px 0; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                      <strong>${isEn ? 'Transparency & Commissioning:' : 'Transparência e Comissionamento:'}</strong><br>
                      ${isEn 
                        ? 'For transparency and auditing purposes, this contact has been logged in our system. At the end of the billing cycle, we will ask your team to cross-reference this lead with your officially paid bookings to calculate the correct commission.' 
                        : 'Para efeitos de transparência e auditoria de comissionamento, registámos este contacto no nosso sistema. No final do ciclo de faturação, pediremos à vossa equipa que cruze esta listagem com as inscrições efetivamente pagas no vosso sistema para o cálculo correto da comissão.'}
                    </p>

                    <p style="font-size: 15px; color: #0f172a; margin: 0;">
                      ${isEn ? 'Best regards,' : 'Com os melhores cumprimentos,'}<br>
                      <strong>${isEn ? 'HelloCamp Partner Team' : 'Equipa de Parceiros HelloCamp'}</strong>
                    </p>
                  </td>
                </tr>

              </table>
              
              <!-- RODAPÉ -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                      ${isEn 
                        ? 'This is an automated message generated by the HelloCamp B2B Platform.' 
                        : 'Esta é uma mensagem automática gerada pela Plataforma B2B da HelloCamp.'}
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 3. COMUNICAÇÃO COM A BREVO REST API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Equipa HelloCamp', email: emailHelloCamp },
        to: [{ email: parceiroEmail }],
        // Adiciona a HelloCamp em CC para registo e auditoria
        cc: [{ email: emailHelloCamp, name: 'Auditoria HelloCamp' }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`A API da Brevo rejeitou o envio: ${errorData.message || JSON.stringify(errorData)}`);
    }

    return NextResponse.json({ success: true, message: 'Notificação de Lead externa disparada com sucesso via Brevo.' });

  } catch (error: any) {
    console.error('Erro na API /nova-lead-externa:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
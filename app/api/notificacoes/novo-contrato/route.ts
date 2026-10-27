import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { form, emailAcesso, lang = 'pt' } = await req.json();
    const safeLang = lang === 'en' ? 'en' : 'pt';
    const isEn = safeLang === 'en';

    // ==========================================
    // 1. E-MAIL PARA A EQUIPA HELLOCAMP (Admin)
    // ==========================================
    const adminHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #0f172a;">Novo Contrato Assinado!</h2>
        <p>Um novo parceiro acabou de assinar o contrato B2B e criou conta na plataforma.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Empresa:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${form.nomeEmpresa || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>NIF:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${form.nif || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Programa:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${form.nomePrograma || 'Global'}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Pessoa Contacto:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${form.pessoaContacto || 'N/A'} (${form.telefone || 'N/A'})</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email de Login:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${emailAcesso}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Pagamento:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${form.tipo_pagamento || 'N/A'}</td></tr>
          <tr><td style="padding: 8px;"><strong>Cancelamento:</strong></td><td style="padding: 8px;">${form.politica_cancelamento || 'N/A'}</td></tr>
        </table>
        
        <p style="margin-top: 30px; font-size: 14px;"><strong>Ação necessária:</strong> Aceda ao SuperAdmin para rever os dados e aprovar o campo para publicação.</p>
        <div style="margin-top: 20px;">
          <a href="https://www.hellocamp.pt/pt/superadmin/contratos" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
            Abrir SuperAdmin
          </a>
        </div>
      </div>
    `;

    // ==========================================
    // 2. E-MAIL PARA O PARCEIRO (Comprovativo)
    // ==========================================
    const parceiroSubject = isEn ? 'Welcome to HelloCamp! ⛺️ Contract Received' : 'Bem-vindo à HelloCamp! ⛺️ Contrato Recebido';

    const parceiroHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 900; letter-spacing: -1px; margin-bottom: 20px; text-align: center;">
          <span style="color: #0f172a;">Hello</span><span style="color: #EBA914;">Camp</span>
        </div>
        
        <p>${isEn ? 'Hello' : 'Olá'} <strong>${form.pessoaContacto || form.nomeEmpresa}</strong>,</p>
        <p>${isEn ? 'We successfully received your partnership contract for the program' : 'Recebemos com sucesso o seu contrato de parceria referente ao programa'} <strong>${form.nomePrograma || form.nomeEmpresa}</strong>.</p>
        <p>${isEn ? 'Your organizer account has been created. You can now access your dashboard using this email address:' : 'A sua conta de organizador foi criada com sucesso. Pode agora aceder ao seu portal de gestão utilizando este endereço de e-mail:'}</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 10px 0;"><strong>${isEn ? 'Contract Summary:' : 'Resumo do Acordo:'}</strong></p>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
            <li><strong>${isEn ? 'Company:' : 'Empresa:'}</strong> ${form.nomeEmpresa} (NIF: ${form.nif})</li>
            <li><strong>${isEn ? 'Booking Model:' : 'Modelo de Reserva:'}</strong> ${form.modalidadeReserva}</li>
            <li><strong>${isEn ? 'Payment Rule:' : 'Regra de Pagamento:'}</strong> ${form.tipo_pagamento}</li>
            <li><strong>${isEn ? 'Cancellation Policy:' : 'Política de Cancelamento:'}</strong> ${form.politica_cancelamento}</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://www.hellocamp.pt/${safeLang}/login" style="display: inline-block; background-color: #167524; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            ${isEn ? 'Access Partner Portal' : 'Aceder ao Portal do Parceiro'}
          </a>
        </div>
        
        <p>${isEn ? 'Our team will review your submission shortly. If you have any questions, reply directly to this email.' : 'A nossa equipa irá rever a sua submissão em breve. Se tiver alguma dúvida, basta responder diretamente a este e-mail.'}</p>
        
        <p style="margin-top: 30px;">${isEn ? 'Best regards,' : 'Com os melhores cumprimentos,'}<br><strong>${isEn ? 'The HelloCamp Team' : 'Equipa HelloCamp'}</strong></p>
      </div>
    `;

    const remetenteOficial = 'HelloCamp Sistema <info@hellocamp.pt>';

    await Promise.all([
      resend.emails.send({
        from: remetenteOficial,
        to: 'info@hellocamp.pt',
        subject: `Novo Parceiro: ${form.nomeEmpresa}`,
        html: adminHtml,
      }),
      resend.emails.send({
        from: remetenteOficial,
        to: emailAcesso,
        subject: parceiroSubject,
        html: parceiroHtml,
      })
    ]);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro ao enviar emails de novo contrato via Resend:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
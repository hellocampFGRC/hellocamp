import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { parceiroEmail, nomeCampo, status, lang = 'pt' } = body;

    if (!status || !parceiroEmail || !nomeCampo) {
      return NextResponse.json(
        { error: 'Dados insuficientes fornecidos (parceiroEmail, nomeCampo ou status em falta).' },
        { status: 400 }
      );
    }

    const safeLang = lang === 'en' ? 'en' : 'pt';
    const isEn = safeLang === 'en';
    const remetenteOficial = 'HelloCamp Parceiros <info@hellocamp.pt>';

    // ==========================================
    // FLUXO 1: CONTRATO REJEITADO
    // ==========================================
    if (status === 'Rejeitado') {
      await resend.emails.send({
        from: remetenteOficial,
        to: parceiroEmail,
        subject: isEn
          ? `[HelloCamp] Contract Review Required: ${nomeCampo}`
          : `[HelloCamp] Revisão do Contrato: ${nomeCampo}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px;">
            <h2 style="color: #b91c1c; margin-top: 0;">${isEn ? 'Hello!' : 'Olá!'}</h2>
            <p>${isEn
              ? `We reviewed the submitted contract for your program <strong>${nomeCampo}</strong>, but found some discrepancies in the provided details.`
              : `Revimos o contrato submetido para o seu programa <strong>${nomeCampo}</strong>, mas encontrámos algumas inconformidades nos dados preenchidos.`}</p>
            <p>${isEn
              ? 'Please access your Partner Dashboard to verify your company details (Name, Tax ID, Attachments, or Digital Signature) and resubmit the corrected document for validation.'
              : 'Por favor, aceda ao seu Dashboard de Parceiro para verificar as informações da entidade (Nome, NIF, Anexos ou Assinatura Digital) e submeta novamente o documento corrigido para validação.'}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://www.hellocamp.pt/${safeLang}/login" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                ${isEn ? 'Access Partner Portal' : 'Aceder ao Portal do Organizador'}
              </a>
            </div>

            <p>${isEn ? 'If you have any questions, reply directly to this email.' : 'Se tiver qualquer dúvida, responda diretamente a este e-mail.'}</p>
            <br/>
            <p>${isEn ? 'Best regards,' : 'Melhores cumprimentos,'}<br/><strong>${isEn ? 'The HelloCamp Team' : 'A Equipa HelloCamp'}</strong></p>
          </div>
        `
      });

      return NextResponse.json({ success: true, message: 'E-mail de rejeição enviado com sucesso via Resend.' });
    }

    // ==========================================
    // FLUXO 2: CONTRATO APROVADO
    // ==========================================
    if (status === 'Aprovado') {
      await resend.emails.send({
        from: remetenteOficial,
        to: parceiroEmail,
        subject: isEn
          ? `[HelloCamp] Contract Approved - Your camp is now live! 🎉`
          : `[HelloCamp] Contrato Aprovado - O seu campo está online! 🎉`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            <div style="background-color: #0f172a; padding: 25px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px; font-family: Arial, sans-serif;">
                ${isEn ? 'Congratulations, your contract is approved!' : 'Parabéns, o contrato foi validado!'}
              </h1>
            </div>
            <div style="padding: 25px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
              <p>${isEn
                ? `The partnership agreement for the program <strong>${nomeCampo}</strong> has been reviewed, signed, and validated by our team.`
                : `O acordo de intermediação para o programa <strong>${nomeCampo}</strong> foi revisto, assinado e validado com sucesso pela nossa equipa legal.`}</p>
              <p>${isEn
                ? `Your program <strong>is now active and publicly visible on the platform</strong>, and is fully eligible to receive bookings and payments from parents.`
                : `O seu programa <strong>já se encontra ativo e visível publicamente na plataforma</strong>, ficando totalmente elegível para receber inscrições e pagamentos dos encarregados de educação.`}</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.hellocamp.pt/${safeLang}/login" style="display: inline-block; background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  ${isEn ? 'Access Organizer Portal' : 'Aceder ao Portal do Organizador'}
                </a>
              </div>
              
              <p>${isEn
                ? 'You can download the full copy of your signed contract at any time directly under the "My Camps" section inside your portal.'
                : 'Poderá descarregar a cópia integral do seu contrato assinado a qualquer momento, diretamente na secção "Os Meus Campos" dentro do seu portal.'}</p>
              <br/>
              <p>${isEn ? 'We wish you a fantastic season and great sales!' : 'Desejamos-lhe um excelente período de atividades e excelentes vendas!'}</p>
              <p>${isEn ? 'Best regards,' : 'Boas reservas,'}<br/><strong>${isEn ? 'The HelloCamp Team' : 'A Equipa HelloCamp'}</strong></p>
            </div>
          </div>
        `
      });

      return NextResponse.json({ success: true, message: 'E-mail de aprovação enviado com sucesso via Resend.' });
    }

    return NextResponse.json({ error: 'Status de processamento inválido.' }, { status: 400 });

  } catch (error: any) {
    console.error('🛑 [ERRO RESEND] Falha crítica no envio do e-mail:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
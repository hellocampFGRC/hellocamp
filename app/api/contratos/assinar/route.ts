import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usar o Service Role Key para ignorar o RLS e garantir o upload do PDF e gestão Auth
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = 'info@hellocamp.pt';
const SENDER_NAME = 'HelloCamp B2B'; 

async function enviarEmailBoasVindas(emailParceiro: string, nomeEmpresa: string, urlPdf: string, lang: string) {
  if (!BREVO_API_KEY) return;

  const isPt = lang === 'pt';
  const subject = isPt ? `Bem-vindo à HelloCamp! O seu Acordo Operacional - ${nomeEmpresa}` : `Welcome to HelloCamp! Your Operational Agreement - ${nomeEmpresa}`;
  
  const htmlContent = isPt 
    ? `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
        <h2 style="color: #0E3A68;">Bem-vindo à HelloCamp, ${nomeEmpresa}!</h2>
        <p>Confirmamos a receção e a assinatura digital do seu Acordo Operacional com a HelloCamp.</p>
        <p><strong style="color: #059669; font-size: 16px;">A sua conta e os seus programas encontram-se agora 100% ativos e visíveis na nossa plataforma!</strong></p>
        <p>A sua integração foi concluída com sucesso. Já está pronto para receber pais, destacar as suas atividades e angariar novas reservas.</p>
        <p>Para sua segurança e arquivo legal, pode descarregar a cópia em formato PDF do seu contrato assinado no link abaixo:</p>
        <div style="margin: 30px 0;">
          <a href="${urlPdf}" style="background-color: #0E3A68; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Descarregar Contrato (PDF)</a>
        </div>
        <p>Caso tenha alguma dúvida ou precise de aceder ao seu painel de gestão, basta responder a este e-mail.</p>
        <p>Desejamos-lhe uma excelente temporada de reservas!<br><br>Cumprimentos,<br>A Equipa HelloCamp</p>
      </div>
    `
    : `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
        <h2 style="color: #0E3A68;">Welcome to HelloCamp, ${nomeEmpresa}!</h2>
        <p>We confirm the receipt and digital signature of your Operational Agreement with HelloCamp.</p>
        <p><strong style="color: #059669; font-size: 16px;">Your account and programs are now 100% active and visible on our platform!</strong></p>
        <p>Your onboarding is successfully complete. You are now ready to welcome parents, showcase your activities, and receive new bookings.</p>
        <p>For your security and legal records, you can download a PDF copy of your signed agreement from the link below:</p>
        <div style="margin: 30px 0;">
          <a href="${urlPdf}" style="background-color: #0E3A68; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Download Contract (PDF)</a>
        </div>
        <p>If you have any questions or need to access your management dashboard, simply reply to this email.</p>
        <p>We wish you a fantastic booking season!<br><br>Best regards,<br>The HelloCamp Team</p>
      </div>
    `;

  try {
    await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: { 'accept': 'application/json', 'api-key': BREVO_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: emailParceiro, name: nomeEmpresa }],
        subject: subject,
        htmlContent: htmlContent
      }),
    });
  } catch (error) { console.error("Erro ao enviar email de boas-vindas:", error); }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const emailAcesso = formData.get('email') as string; 
    const lang = formData.get('lang') as string || 'en';
    const contratoDadosStr = formData.get('contratoDados') as string;
    const passwordNova = formData.get('password') as string; // Nova password definida pelo parceiro
    const pdfFile = formData.get('pdf') as File;

    if (!id || !emailAcesso || !contratoDadosStr || !pdfFile) {
      return NextResponse.json({ error: 'Dados incompletos submetidos no formulário.' }, { status: 400 });
    }

    const contratoDados = JSON.parse(contratoDadosStr);

    // 1. Verificação de Segurança (Gatekeeper Backend)
    const { data: perfil, error: fetchError } = await supabaseAdmin
      .from('perfis').select('email, contrato_dados').eq('id', id).single();

    if (fetchError || !perfil) return NextResponse.json({ error: 'Perfil não encontrado na base de dados.' }, { status: 404 });

    const emailBd = perfil.email?.trim().toLowerCase();
    const emailContactoBd = perfil.contrato_dados?.emailContacto?.trim().toLowerCase();
    const inputEmail = emailAcesso.trim().toLowerCase();

    if (inputEmail !== emailBd && inputEmail !== emailContactoBd) {
      return NextResponse.json({ error: 'Tentativa de submissão não autorizada. O e-mail não corresponde.' }, { status: 403 });
    }

    // 2. Atualizar Palavra-Passe no Supabase Auth
    if (passwordNova) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: passwordNova,
        email_confirm: true // Garante que a conta fica verificada para login imediato
      });
      if (authError) throw new Error(`Erro ao configurar palavra-passe: ${authError.message}`);
    }

    // 3. Upload do PDF
    const fileName = `contrato_global_${id}_${Date.now()}.pdf`;
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('campos-documentos')
      .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });

    if (uploadError) throw new Error(`Erro ao guardar PDF: ${uploadError.message}`);

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('campos-documentos').getPublicUrl(fileName);
    const contratoUrl = publicUrlData.publicUrl;

    // 4. Atualizar Tabela Perfis (Aprova a Conta IMEDIATAMENTE)
    await supabaseAdmin.from('perfis').update({
      empresa_nome: contratoDados.empresaNome,
      nif_empresa: contratoDados.nif,
      nome_completo: contratoDados.pessoaContacto,
      telefone: contratoDados.telefone,
      status_contrato: 'Aprovado',
      parceiro_verificado: true,
      contrato_dados: contratoDados,
      modalidade_reserva: contratoDados.modalidadeReserva,
      link_externo_reserva: contratoDados.modalidadeReserva === 'link_externo' ? contratoDados.linkExternoReserva : null,
      base_comissao: contratoDados.baseComissao
    }).eq('id', id);

    // 5. Atualizar Tabela Campos (Ativa os campos instantaneamente)
    await supabaseAdmin.from('campos').update({
      status_aprovacao: 'Aprovado',
      ativo: true,
      contrato_dados: contratoDados,
      contrato_parceiro_url: contratoUrl,
      modalidade_reserva: contratoDados.modalidadeReserva,
      link_externo_reserva: contratoDados.modalidadeReserva === 'link_externo' ? contratoDados.linkExternoReserva : null,
      tipo_pagamento: contratoDados.modalidadeReserva !== 'link_externo' ? contratoDados.tipoPagamento : null,
      politica_cancelamento: contratoDados.modalidadeReserva !== 'link_externo' ? contratoDados.politicaCancelamento : null,
      base_comissao: contratoDados.baseComissao
    }).eq('organizador_id', id);

    // 6. Enviar Email de Boas-Vindas ao Parceiro com o PDF
    await enviarEmailBoasVindas(contratoDados.emailContacto || emailAcesso, contratoDados.empresaNome, contratoUrl, lang);

    return NextResponse.json({ success: true, url: contratoUrl });

  } catch (error: any) {
    console.error("Erro na API Assinar Contrato:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
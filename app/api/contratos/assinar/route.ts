import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const safeLang = lang === 'en' ? 'en' : 'pt';
  const isPt = safeLang === 'pt';
  const subject = isPt
    ? `Bem-vindo à HelloCamp! O seu Acordo Operacional - ${nomeEmpresa}`
    : `Welcome to HelloCamp! Your Operational Agreement - ${nomeEmpresa}`;

  const htmlContent = isPt
    ? `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; border: 1px solid #e2e8f0; border-radius: 10px; padding: 30px; line-height: 1.6;">
        <h2 style="color: #0E3A68; margin-top: 0;">Bem-vindo à HelloCamp, ${nomeEmpresa}!</h2>
        <p>Confirmamos a receção e a assinatura digital do seu Acordo Operacional com a HelloCamp.</p>
        <p><strong style="color: #059669; font-size: 16px;">A sua conta e os seus programas encontram-se agora 100% ativos e visíveis na nossa plataforma!</strong></p>
        <p>Para sua segurança e arquivo legal, pode descarregar a cópia em formato PDF do seu contrato assinado ou aceder diretamente ao seu Painel de Controlo:</p>
        <div style="margin: 30px 0; display: flex; gap: 12px; flex-wrap: wrap;">
          <a href="${urlPdf}" style="background-color: #0E3A68; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">Descarregar Contrato (PDF)</a>
          <a href="https://www.hellocamp.pt/pt/login" style="background-color: #167524; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Aceder ao Painel B2B</a>
        </div>
        <p>Desejamos-lhe uma excelente temporada de reservas!<br><br><strong>A Equipa HelloCamp</strong></p>
      </div>
    `
    : `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; border: 1px solid #e2e8f0; border-radius: 10px; padding: 30px; line-height: 1.6;">
        <h2 style="color: #0E3A68; margin-top: 0;">Welcome to HelloCamp, ${nomeEmpresa}!</h2>
        <p>We confirm the receipt and digital signature of your Operational Agreement with HelloCamp.</p>
        <p><strong style="color: #059669; font-size: 16px;">Your account and programs are now 100% active and visible on our platform!</strong></p>
        <p>For your security and legal records, you can download a PDF copy of your signed agreement or access your Partner Dashboard below:</p>
        <div style="margin: 30px 0;">
          <a href="${urlPdf}" style="background-color: #0E3A68; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">Download Contract (PDF)</a>
          <a href="https://www.hellocamp.pt/en/login" style="background-color: #167524; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Partner Portal</a>
        </div>
        <p>We wish you a fantastic booking season!<br><br><strong>The HelloCamp Team</strong></p>
      </div>
    `;

  try {
    await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: emailParceiro, name: nomeEmpresa }],
        cc: [{ email: SENDER_EMAIL, name: 'Auditoria Contratos HelloCamp' }],
        subject: subject,
        htmlContent: htmlContent
      }),
    });
  } catch (error) {
    console.error("Erro ao enviar email de boas-vindas:", error);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const emailAcesso = formData.get('email') as string;
    const lang = (formData.get('lang') as string) || 'en';
    const contratoDadosStr = formData.get('contratoDados') as string;
    const passwordNova = formData.get('password') as string;
    const pdfFile = formData.get('pdf') as File;

    if (!id || !emailAcesso || !contratoDadosStr || !pdfFile) {
      return NextResponse.json({ error: 'Dados incompletos submetidos no formulário.' }, { status: 400 });
    }

    const contratoDados = JSON.parse(contratoDadosStr);

    // 1. Verificação de Segurança (Gatekeeper na tabela 'perfis')
    const { data: perfil, error: fetchError } = await supabaseAdmin
      .from('perfis')
      .select('email, contrato_dados')
      .eq('id', id)
      .single();

    if (fetchError || !perfil) {
      return NextResponse.json({ error: 'Perfil não encontrado na base de dados.' }, { status: 404 });
    }

    const emailBd = perfil.email?.trim().toLowerCase();
    const emailContactoBd = perfil.contrato_dados?.emailContacto?.trim().toLowerCase();
    const inputEmail = emailAcesso.trim().toLowerCase();

    if (inputEmail !== emailBd && inputEmail !== emailContactoBd) {
      return NextResponse.json({ error: 'Tentativa de submissão não autorizada. O e-mail não corresponde.' }, { status: 403 });
    }

    // 2. Definir Palavra-Passe e Reparar/Criar Utilizador Auth (Dupla Camada de Segurança)
    let loginReady = false;
    const emailFinal = (contratoDados.emailContacto || perfil.email || inputEmail).trim().toLowerCase();

    if (passwordNova) {
      const { error: rpcError } = await supabaseAdmin.rpc('admin_set_partner_password', {
        target_user_id: id,
        new_password: passwordNova,
        target_email: emailFinal
      });

      if (!rpcError) {
        loginReady = true;
      } else {
        console.warn("Aviso RPC:", rpcError.message, "-> Tentando fallback via Auth Admin API...");
        const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(id, {
          email: emailFinal,
          password: passwordNova,
          email_confirm: true,
          user_metadata: { role: 'organizador' }
        });

        if (!updateErr) {
          loginReady = true;
        } else {
          const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
            id: id,
            email: emailFinal,
            password: passwordNova,
            email_confirm: true,
            user_metadata: { role: 'organizador' }
          });
          if (!createErr) loginReady = true;
        }
      }
    }

    // 3. Upload do Documento PDF assinado
    const fileName = `contrato_global_${id}_${Date.now()}.pdf`;
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('campos-documentos')
      .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });

    if (uploadError) throw new Error(`Erro ao guardar PDF: ${uploadError.message}`);

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('campos-documentos')
      .getPublicUrl(fileName);
    const contratoUrl = publicUrlData.publicUrl;

    // 4. Atualizar a Tabela 'perfis' com role 'organizador' e Aprovação Imediata
    await supabaseAdmin.from('perfis').update({
      email: emailFinal,
      role: 'organizador',
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

    // 5. Ativar todos os campos associados ao organizador
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

    // 6. Notificação por E-mail ao Parceiro
    await enviarEmailBoasVindas(emailFinal, contratoDados.empresaNome, contratoUrl, lang);

    return NextResponse.json({ success: true, url: contratoUrl, loginReady: loginReady });

  } catch (error: any) {
    console.error("Erro na API Assinar Contrato:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
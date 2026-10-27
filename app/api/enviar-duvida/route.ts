import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!resendApiKey) {
    return NextResponse.json({ error: "Falta a chave do Resend no .env.local" }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);
  const supabaseAdmin = createClient(supabaseUrl as string, supabaseServiceKey as string);

  try {
    const formData = await req.formData();
    const nome = (formData.get('First_Name') as string) || '';
    const apelido = (formData.get('Last_Name') as string) || '';
    const emailPai = (formData.get('Email') as string)?.trim().toLowerCase();
    const telefone = (formData.get('Phone') as string) || 'N/A';
    const idade = (formData.get('Age') as string) || 'N/A';
    const mensagem = (formData.get('Message') as string) || '';
    const subject = (formData.get('_subject') as string) || '';
    const campoId = formData.get('campo_id') as string;
    const organizadorId = formData.get('organizador_id') as string;
    const lang = (formData.get('lang') as string) || 'pt';
    const safeLang = lang === 'en' ? 'en' : 'pt';

    const nomeCompleto = `${nome} ${apelido}`.trim() || 'Encarregado de Educação';

    // 1. DADOS DO PARCEIRO / ORGANIZADOR
    let emailOrganizador = 'info@hellocamp.pt';
    let nomeOrganizador = 'Parceiro HelloCamp';

    if (organizadorId) {
      const { data: perfil } = await supabaseAdmin
        .from('perfis')
        .select('email, empresa_nome, nome_completo')
        .eq('id', organizadorId)
        .single();

      if (perfil && perfil.email) {
        emailOrganizador = perfil.email;
        nomeOrganizador = perfil.empresa_nome || perfil.nome_completo || 'Parceiro';
      }
    }

    // 2. IDENTIFICAR OU CRIAR A CONTA DO PAI
    let userIdFinal = null;

    if (emailPai) {
      const { data: existingUser } = await supabaseAdmin
        .from('perfis')
        .select('id')
        .ilike('email', emailPai)
        .maybeSingle();

      if (existingUser) {
        userIdFinal = existingUser.id;
      } else {
        const { data: authData } = await supabaseAdmin.auth.admin.createUser({
          email: emailPai,
          password: Math.random().toString(36).slice(-10) + 'A1!',
          email_confirm: true,
          user_metadata: { nome_completo: nomeCompleto, role: 'cliente' }
        });

        if (authData?.user) {
          userIdFinal = authData.user.id;
          await supabaseAdmin.from('perfis').upsert({
            id: userIdFinal,
            email: emailPai,
            nome_completo: nomeCompleto,
            telefone: telefone,
            role: 'cliente'
          });
        }
      }
    }

    // 3. GRAVAR MENSAGEM NO CHAT (Tabela 'mensagens')
    if (userIdFinal && organizadorId) {
      const prefixoIdade = idade && idade !== 'N/A' ? `(Interessado para ${idade} anos) ` : '';
      const textoFinal = `📢 [Nova Questão] ${prefixoIdade}\n\n${mensagem}`;

      const { error: msgError } = await supabaseAdmin.from('mensagens').insert([{
        campo_id: campoId,
        sender_id: userIdFinal,
        receiver_id: organizadorId,
        texto: textoFinal,
        lida: false
      }]);

      if (msgError) console.error("Erro a gravar no chat:", msgError);
    }

    // 4. DISPARAR O EMAIL VIA RESEND
    await resend.emails.send({
      from: 'HelloCamp Inbox <info@hellocamp.pt>',
      to: emailOrganizador,
      cc: 'info@hellocamp.pt',
      replyTo: emailPai,
      subject: subject || 'Nova Dúvida de Cliente - HelloCamp',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 10px; color: #0f172a;">
          <h2 style="color: #167524; margin-top: 0;">Nova Mensagem Recebida</h2>
          <p>Olá <strong>${nomeOrganizador}</strong>,</p>
          <p>Tem uma nova dúvida de um potencial cliente pendente no seu painel HelloCamp.</p>
          <p>Pode responder diretamente a este e-mail ou aceder à sua <a href="https://www.hellocamp.pt/${safeLang}/admin/inbox" style="color: #167524; font-weight: bold;">Inbox da HelloCamp</a>.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0;"><strong>De:</strong> ${nomeCompleto} (${emailPai})</p>
            <p style="margin: 0 0 8px 0;"><strong>Telefone:</strong> ${telefone}</p>
            <p style="margin: 0;"><strong>Idade do Participante:</strong> ${idade}</p>
            <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 15px 0;" />
            <p style="margin: 0; color: #334155; white-space: pre-wrap;"><strong>Mensagem:</strong><br/><br/>${mensagem}</p>
          </div>

          <div style="margin-top: 25px; text-align: center;">
            <a href="https://www.hellocamp.pt/${safeLang}/admin/inbox" style="display: inline-block; background-color: #167524; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Abrir Inbox na Plataforma
            </a>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro na API enviar-duvida:", error);
    return NextResponse.json({ error: "Erro ao enviar a mensagem: " + error.message }, { status: 500 });
  }
}
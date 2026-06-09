import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase'; // Precisamos do Supabase para ir buscar o email do parceiro

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    return NextResponse.json({ error: "Falta a chave do Resend no .env.local" }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);

  try {
    const formData = await req.formData();
    const nome = formData.get('First_Name');
    const apelido = formData.get('Last_Name');
    const email = formData.get('Email'); // Email do pai
    const telefone = formData.get('Phone');
    const idade = formData.get('Age');
    const mensagem = formData.get('Message');
    const subject = formData.get('_subject'); // Já inclui "HelloCamp" e o nome do Campo
    const organizadorId = formData.get('organizador_id'); // Capta o ID do organizador em segurança

    // Valores por defeito caso o organizador não seja encontrado
    let emailOrganizador = 'info@hellocamp.pt'; 
    let nomeOrganizador = 'Parceiro';

    // Se tivermos o ID do organizador, vamos à base de dados buscar o email real dele
    if (organizadorId) {
      const { data: perfil } = await supabase
        .from('perfis')
        .select('email, empresa_nome, nome_completo')
        .eq('id', organizadorId)
        .single();
      
      if (perfil && perfil.email) {
        emailOrganizador = perfil.email;
        nomeOrganizador = perfil.empresa_nome || perfil.nome_completo || 'Parceiro';
      }
    }

    // O Envio Perfeito (To: Campo, CC: HelloCamp, Reply-To: Pai)
    await resend.emails.send({
      from: 'HelloCamp Notificações <info@hellocamp.pt>',
      to: emailOrganizador,           // Envia para o Organizador
      cc: 'info@hellocamp.pt',        // Fiscalização e controlo da HelloCamp
      replyTo: email as string,       // Se o organizador clicar em "Responder", vai para o email do Pai
      subject: (subject as string) || 'Nova Dúvida sobre Campo - HelloCamp',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0f172a;">Nova Questão de um Encarregado de Educação</h2>
          <p>Olá <strong>${nomeOrganizador}</strong>,</p>
          <p>Recebeu uma nova dúvida através da sua página na plataforma HelloCamp. Pode responder diretamente a este email para falar com o cliente.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #e2e8f0;">
            <p><strong>Nome:</strong> ${nome} ${apelido}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Telefone:</strong> ${telefone}</p>
            <p><strong>Idade do Participante:</strong> ${idade}</p>
            <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 15px 0;" />
            <p style="margin: 0; color: #334155; white-space: pre-wrap;"><strong>Mensagem:</strong><br/><br/>${mensagem}</p>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">* A HelloCamp encontra-se em CC neste email para acompanhamento.</p>
        </div>
      `,
    });

    const referer = req.headers.get('referer');
    if (referer) {
      const url = new URL(referer);
      url.searchParams.set('sucesso_duvida', 'true');
      url.hash = 'duvidas';
      return NextResponse.redirect(url, 303);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao enviar a mensagem: " + error.message }, { status: 500 });
  }
}
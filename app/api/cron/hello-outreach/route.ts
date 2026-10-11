import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==========================================
// TRANSPORTER SMTP
// ==========================================
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.mailgun.org';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

console.log('🔧 [SMTP CONFIG] Host:', SMTP_HOST, '| Port:', SMTP_PORT, '| User:', SMTP_USER ? SMTP_USER.substring(0, 5) + '***' : 'AUSENTE');

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // SSL direto na 465, STARTTLS na 587
  pool: true,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  // Timeouts para não ficar pendurado
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
  // Debug para logs detalhados (aparecem no Vercel)
  logger: true,
  debug: true,
});

// ==========================================
// TEMPLATES (iguais ao anterior)
// ==========================================
const COLD_TEMPLATES = [
  {
    assunto: "Aumente as inscrições do seu campo de férias (Verão, Páscoa e o Ano Todo)",
    titulo: "Lotação Esgotada, Sem Intermediários",
    textoCta: "Conhecer a Plataforma",
    gerarMensagem: (nome: string) => `
      <p>Estimada equipa da <strong>${nome}</strong>,</p>
      <p>Chegou o momento de deixar de depender do "passa-a-palavra" para encher as vagas dos vossos programas. A <strong>HelloCamp</strong> é a nova plataforma tecnológica desenvolvida em Portugal que liga diretamente o seu campo de férias, escola ou atividades a milhares de famílias.</p>
      <p>Não somos um simples catálogo. Somos uma ferramenta concebida para <strong>multiplicar as suas reservas de forma exponencial</strong>, quer seja no Verão, na Páscoa, ou com atividades extracurriculares durante todo o ano letivo.</p>
      <h3 style="color: #0E3A68; font-size: 16px; margin-top: 25px; margin-bottom: 15px;">O que ganha ao juntar-se à HelloCamp:</h3>
      <ul style="padding-left: 20px; color: #4a4a4a; line-height: 1.8; margin-bottom: 25px;">
        <li><strong>Contacto Direto com os Pais:</strong> O vosso número de telefone e e-mail ficam 100% visíveis. Não bloqueamos a comunicação.</li>
        <li><strong>Sem Comissões Predatórias:</strong> Faturam exatamente o que definem. O dinheiro dos clientes vai para vocês, não para nós.</li>
        <li><strong>Visibilidade Internacional:</strong> Atraia inscrições de famílias portuguesas e escolas estrangeiras à procura de intercâmbios e campos de línguas.</li>
      </ul>
      <p>Abra as portas ao mercado digital de forma justa e transparente. Garanta o seu lugar como Parceiro Oficial hoje mesmo.</p>
    `
  },
  {
    assunto: "A sua marca em destaque. Descubra a vantagem HelloCamp.",
    titulo: "O Protagonismo é da Sua Marca",
    textoCta: "Criar Perfil Gratuito",
    gerarMensagem: (nome: string) => `
      <p>Olá <strong>${nome}</strong>,</p>
      <p>Se já trabalha com outros diretórios do mercado, provavelmente já notou o problema: a sua marca é reduzida a um logótipo pequeno, os seus contactos são ocultados e a plataforma força as famílias a falarem com eles, e não consigo.</p>
      <p>Na <strong>HelloCamp</strong>, a nossa filosofia inverte as regras do jogo. Acreditamos que a confiança constrói-se quando os pais falam diretamente com quem organiza.</p>
      <h3 style="color: #0E3A68; font-size: 16px; margin-top: 25px; margin-bottom: 15px;">A diferença tecnológica a seu favor:</h3>
      <ul style="padding-left: 20px; color: #4a4a4a; line-height: 1.8; margin-bottom: 25px;">
        <li><strong>Página de Perfil Exclusiva:</strong> Apresente fotografias, vídeos e descrições detalhadas dos vossos turnos.</li>
        <li><strong>Chat Inteligente:</strong> Tire dúvidas aos pais em tempo real através da nossa plataforma, mantendo o histórico organizado.</li>
        <li><strong>Avaliações Reais:</strong> Acumule "reviews" positivas que geram prova social e aceleram a decisão de compra de novos clientes.</li>
      </ul>
      <p>Mostre às famílias porque é que o vosso programa é a escolha certa.</p>
    `
  },
  {
    assunto: "Falta de animadores para as próximas férias? Temos a solução.",
    titulo: "Portal Dedicado a Monitores",
    textoCta: "Aceder à Bolsa de Monitores",
    gerarMensagem: (nome: string) => `
      <p>Exmos. Senhores da <strong>${nome}</strong>,</p>
      <p>Um campo de férias excecional faz-se com animadores excecionais. Contudo, o recrutamento de monitores de confiança para as pausas letivas é muitas vezes demorado e incerto.</p>
      <p>Para resolver este problema crónico no setor, a HelloCamp dispõe de um <strong>Módulo Exclusivo para Monitores</strong> integrado no seu painel de gestão.</p>
      <h3 style="color: #0E3A68; font-size: 16px; margin-top: 25px; margin-bottom: 15px;">Gestão de equipas simplificada:</h3>
      <ul style="padding-left: 20px; color: #4a4a4a; line-height: 1.8; margin-bottom: 25px;">
        <li><strong>Bolsa de Talentos:</strong> Recrute jovens certificados e experientes diretamente pela plataforma.</li>
        <li><strong>Atribuição Automática:</strong> Aloque monitores a turmas específicas e partilhe horários com um clique.</li>
        <li><strong>Acessos Seguros:</strong> Permita que os animadores vejam apenas as fichas médicas (alergias, cuidados especiais) das crianças do seu próprio grupo.</li>
      </ul>
      <p>Garanta que a sua equipa está completa e preparada meses antes de o campo começar.</p>
    `
  },
  {
    assunto: "A burocracia das inscrições está a travar o vosso crescimento",
    titulo: "O Fim da Confusão Financeira e Administrativa",
    textoCta: "Ver o Dashboard em Ação",
    gerarMensagem: (nome: string) => `
      <p>Estimados parceiros da <strong>${nome}</strong>,</p>
      <p>Quantas vagas já perdeu porque um cliente demorou a enviar o comprovativo de transferência bancária? Cruza as inscrições em papel com ficheiros de Excel desatualizados?</p>
      <p>A <strong>HelloCamp</strong> oferece-lhe um Motor Administrativo e Financeiro que automatiza o trabalho de uma secretaria inteira.</p>
      <h3 style="color: #0E3A68; font-size: 16px; margin-top: 25px; margin-bottom: 15px;">Tecnologia de gestão de topo:</h3>
      <ul style="padding-left: 20px; color: #4a4a4a; line-height: 1.8; margin-bottom: 25px;">
        <li><strong>Check-out Automático:</strong> Os pais pagam com segurança (MBWay, Multibanco ou Cartão) e a vaga fica imediatamente confirmada na vossa agenda.</li>
        <li><strong>Sinais e Tranches:</strong> Configure pagamentos faseados. Cobre um sinal no ato de inscrição e envie lembretes automáticos para o resto.</li>
        <li><strong>Reembolsos Imediatos:</strong> Em caso de cancelamento por força maior, devolva o valor à família com um único clique.</li>
      </ul>
      <p>Poupe dezenas de horas em gestão e eleve a experiência de compra dos seus clientes.</p>
    `
  },
  {
    assunto: "A época de reservas já começou. Garanta o vosso lugar.",
    titulo: "Famílias à Procura de Campos no Google",
    textoCta: "Aderir à HelloCamp",
    gerarMensagem: (nome: string) => `
      <p>Olá equipa da <strong>${nome}</strong>,</p>
      <p>Milhares de pais pesquisam neste momento no Google por "campos de férias", "atividades extracurriculares", ou "summer camps em Portugal". O nosso investimento agressivo em Marketing e SEO garante que a <strong>HelloCamp</strong> está no topo dessas pesquisas.</p>
      <p>Ao juntar-se à nossa rede, o seu campo beneficia instantaneamente deste tráfego massivo, sem custos fixos em publicidade.</p>
      <h3 style="color: #0E3A68; font-size: 16px; margin-top: 25px; margin-bottom: 15px;">Os próximos passos:</h3>
      <ul style="padding-left: 20px; color: #4a4a4a; line-height: 1.8; margin-bottom: 25px;">
        <li>Registe a sua empresa gratuitamente em menos de 5 minutos.</li>
        <li>Crie os programas (Datas, Lotação e Preços).</li>
        <li>Comece a receber inscrições diretas e a aumentar a sua faturação anual.</li>
      </ul>
      <p>A plataforma mais justa e tecnológica do país está de portas abertas. Contamos com a vossa excelência para um ano letivo e um verão inesquecíveis.</p>
    `
  }
];

function getTemplateHTML(titulo: string, mensagem: string, ctaTexto: string, ctaLink: string) {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8EDF2; border-radius: 8px; overflow: hidden;">
      <div style="height: 8px; width: 100%; display: flex;">
        <div style="background-color: #218F4C; height: 100%; width: 33.3%;"></div>
        <div style="background-color: #F3A61C; height: 100%; width: 33.4%;"></div>
        <div style="background-color: #0E3A68; height: 100%; width: 33.3%;"></div>
      </div>
      <div style="padding: 40px;">
        <div style="text-align: center; margin-bottom: 35px;">
          <h1 style="color: #0E3A68; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Hello<span style="color: #F3A61C;">Camp</span></h1>
        </div>
        <h2 style="color: #0E3A68; font-size: 20px; margin-top: 0; margin-bottom: 25px; font-weight: 700; line-height: 1.4;">
          ${titulo}
        </h2>
        <div style="color: #4a4a4a; font-size: 15px; line-height: 1.6;">
          ${mensagem}
        </div>
        <div style="text-align: center; margin-top: 40px; margin-bottom: 10px;">
          <a href="${ctaLink}" style="display: inline-block; background-color: #F3A61C; color: #ffffff; padding: 15px 35px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 40px; box-shadow: 0 4px 6px rgba(243, 166, 28, 0.2);">
            ${ctaTexto}
          </a>
        </div>
      </div>
      <div style="background-color: #0E3A68; padding: 25px 40px; text-align: center;">
        <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 10px 0;">A PLATAFORMA DE EXCELÊNCIA EM PORTUGAL</p>
        <p style="color: #8ca5c1; font-size: 11px; line-height: 1.5; margin: 0;">
          Comunicação direcionada a organizadores de eventos e campos de férias.<br/>
          Para deixar de receber comunicações, basta ignorar este e-mail.
        </p>
      </div>
    </div>
  `;
}

// ==========================================
// HANDLER
// ==========================================
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isAuthorized =
    request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}` ||
    searchParams.get('secret') === process.env.CRON_SECRET;

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
  }

  const isDebug = searchParams.get('debug') === '1';
  const testEmail = searchParams.get('test'); // ?test=alguem@exemplo.com

  // ==========================================
  // PASSO 0 — VERIFICAR CONEXÃO SMTP
  // ==========================================
  let smtpStatus: any = { verified: false, error: null };
  try {
    await transporter.verify();
    smtpStatus.verified = true;
    console.log('✅ [SMTP] Conexão verificada com sucesso');
  } catch (verifyErr: any) {
    smtpStatus.verified = false;
    smtpStatus.error = verifyErr?.message || String(verifyErr);
    smtpStatus.code = verifyErr?.code;
    smtpStatus.command = verifyErr?.command;
    smtpStatus.responseCode = verifyErr?.responseCode;
    smtpStatus.response = verifyErr?.response;
    console.error('❌ [SMTP] Falha na verificação:', smtpStatus);

    // Retorna já — não vale a pena tentar enviar 75 emails se o servidor está inacessível
    return NextResponse.json({
      step: 'smtp_verify',
      success: false,
      mensagem: 'Não foi possível conectar ao servidor SMTP. Verifica as credenciais (SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT).',
      config: {
        host: SMTP_HOST,
        port: SMTP_PORT,
        user_presente: !!SMTP_USER,
        pass_presente: !!SMTP_PASS,
        user_inicio: SMTP_USER ? SMTP_USER.substring(0, 5) + '***' : null,
      },
      erro: smtpStatus,
    }, { status: 500 });
  }

  // ==========================================
  // PASSO 1 — MODO TEST: enviar email para 1 endereço
  // ==========================================
  if (testEmail) {
    try {
      const tpl = COLD_TEMPLATES[0];
      const info = await transporter.sendMail({
        from: '"HelloCamp" <info@hellocamp.pt>',
        to: testEmail,
        subject: '[TESTE] ' + tpl.assunto,
        html: getTemplateHTML(
          tpl.titulo,
          tpl.gerarMensagem('Equipa de Teste'),
          tpl.textoCta,
          'https://www.hellocamp.pt'
        ),
      });

      return NextResponse.json({
        step: 'test_send',
        success: true,
        mensagem: `Email de teste enviado para ${testEmail}`,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      });
    } catch (testErr: any) {
      return NextResponse.json({
        step: 'test_send',
        success: false,
        mensagem: 'Falha ao enviar email de teste.',
        erro: {
          message: testErr?.message,
          code: testErr?.code,
          command: testErr?.command,
          responseCode: testErr?.responseCode,
          response: testErr?.response,
        },
      }, { status: 500 });
    }
  }

  // ==========================================
  // PASSO 2 — BUSCAR LEADS
  // ==========================================
  try {
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: leadsSemContacto, error: err1 } = await supabaseAdmin
      .from('leads_externas')
      .select('id, nome_cliente, email_cliente, fase_funil, ultimo_contacto')
      .lt('fase_funil', COLD_TEMPLATES.length)
      .is('ultimo_contacto', null)
      .not('email_cliente', 'is', null)
      .neq('email_cliente', '')
      .order('fase_funil', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(75);

    if (err1) throw new Error('Query 1 falhou: ' + err1.message);

    const { data: leadsAntigas, error: err2 } = await supabaseAdmin
      .from('leads_externas')
      .select('id, nome_cliente, email_cliente, fase_funil, ultimo_contacto')
      .lt('fase_funil', COLD_TEMPLATES.length)
      .lt('ultimo_contacto', seteDiasAtras)
      .not('email_cliente', 'is', null)
      .neq('email_cliente', '')
      .order('fase_funil', { ascending: true })
      .order('ultimo_contacto', { ascending: true })
      .limit(75);

    if (err2) throw new Error('Query 2 falhou: ' + err2.message);

    const seenIds = new Set<string>();
    const merged: any[] = [];
    for (const l of [...(leadsSemContacto || []), ...(leadsAntigas || [])]) {
      if (!seenIds.has(l.id)) {
        seenIds.add(l.id);
        merged.push(l);
      }
    }
    const leadsProntas = merged.slice(0, 75);

    if (leadsProntas.length === 0) {
      return NextResponse.json({ message: 'Nenhuma lead elegível.', smtp_verified: true });
    }

    if (isDebug) {
      return NextResponse.json({
        debug: true,
        smtp_verified: true,
        leads_prontas_count: leadsProntas.length,
        leads_amostra: leadsProntas.slice(0, 10).map(l => ({
          id: l.id, nome: l.nome_cliente, email: l.email_cliente, fase: l.fase_funil,
        })),
      });
    }

    // ==========================================
    // PASSO 3 — ENVIAR (com captura de erros por lead)
    // ==========================================
    const resultados = await Promise.all(
      leadsProntas.map(async (lead) => {
        const email = (lead.email_cliente || '').trim();
        if (!email || email.toLowerCase() === 'nan') {
          return { status: 'skipped', id: lead.id, email, reason: 'email inválido' };
        }

        const faseAtual = Number(lead.fase_funil) || 0;
        const tpl = COLD_TEMPLATES[faseAtual];
        if (!tpl) return { status: 'skipped', id: lead.id, email, reason: 'fase fora do range' };

        const linkFinal = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.hellocamp.pt'}/registar?lang=pt&utm_source=cold_email&utm_campaign=fase${faseAtual}`;

        try {
          const info = await transporter.sendMail({
            from: '"HelloCamp" <info@hellocamp.pt>',
            to: email,
            subject: tpl.assunto,
            html: getTemplateHTML(tpl.titulo, tpl.gerarMensagem(lead.nome_cliente || 'Organizador'), tpl.textoCta, linkFinal),
          });
          console.log('✉️ [OK]', email, '| msgId:', info.messageId);
          return { status: 'sent', id: lead.id, novaFase: faseAtual + 1, email };
        } catch (e: any) {
          const errInfo = {
            message: e?.message,
            code: e?.code,
            command: e?.command,
            responseCode: e?.responseCode,
            response: e?.response,
          };
          console.error(`❌ [FALHA] ${email}:`, errInfo);
          return { status: 'failed', id: lead.id, email, erro: errInfo };
        }
      })
    );

    const sucessos = resultados.filter(r => r.status === 'sent') as any[];
    const falhas = resultados.filter(r => r.status === 'failed') as any[];
    const skipped = resultados.filter(r => r.status === 'skipped') as any[];

    // Se TODAS falharam, retorna o erro detalhado do primeiro envio para diagnóstico
    if (sucessos.length === 0) {
      return NextResponse.json({
        step: 'send_batch',
        success: false,
        mensagem: 'SMTP aceitou conexão, mas rejeitou todos os envios.',
        enviados: 0,
        tentados: leadsProntas.length,
        falhas: falhas.length,
        skipped: skipped.length,
        primeiro_erro: falhas[0]?.erro || null,
        amostra_falhas: falhas.slice(0, 3).map(f => ({ email: f.email, erro: f.erro })),
        config: {
          host: SMTP_HOST,
          port: SMTP_PORT,
          from_usado: '"HelloCamp" <info@hellocamp.pt>',
          user_inicio: SMTP_USER ? SMTP_USER.substring(0, 5) + '***' : null,
        },
      }, { status: 500 });
    }

    // Atualizar fases das que enviaram
    const groupedByFase: Record<number, number[]> = {};
    for (const curr of sucessos) {
      const fase = Number(curr.novaFase);
      if (!groupedByFase[fase]) groupedByFase[fase] = [];
      groupedByFase[fase].push(Number(curr.id));
    }

    const nowIso = new Date().toISOString();
    await Promise.all(
      Object.entries(groupedByFase).map(([faseStr, ids]) =>
        supabaseAdmin
          .from('leads_externas')
          .update({ fase_funil: parseInt(faseStr, 10), ultimo_contacto: nowIso })
          .in('id', ids as number[])
      )
    );

    return NextResponse.json({
      success: true,
      mensagens_enviadas: sucessos.length,
      falhas: falhas.length,
      skipped: skipped.length,
      tentados: leadsProntas.length,
      amostra_falhas: falhas.slice(0, 3).map(f => ({ email: f.email, erro: f.erro })),
    });

  } catch (error: any) {
    console.error('❌ [CRON B2B] Erro crítico:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
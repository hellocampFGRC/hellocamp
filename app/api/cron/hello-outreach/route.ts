import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==========================================
// CONFIG BREVO
// ==========================================
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = 'info@hellocamp.pt';
const SENDER_NAME = 'HelloCamp';

// ═══════════════════════════════════════════
// URL ÚNICO DE REGISTO — usado em todos os emails B2B
// ═══════════════════════════════════════════
const LINK_REGISTO = 'https://www.hellocamp.pt/pt/registo';

console.log('🔧 [BREVO] API Key presente:', !!BREVO_API_KEY, '| Sender:', SENDER_EMAIL);

// ==========================================
// FUNÇÃO: Enviar email via Brevo HTTP API
// ==========================================
async function enviarViaBrevo(params: {
  to: { email: string; name?: string };
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; error?: any }> {
  if (!BREVO_API_KEY) {
    return { success: false, error: { message: 'BREVO_API_KEY ausente nas variáveis de ambiente' } };
  }

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [params.to],
        subject: params.subject,
        htmlContent: params.html,
        headers: {
          'X-Mailer': 'HelloCamp-B2B',
        },
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: {
          status: res.status,
          message: data?.message || data?.error || 'Erro desconhecido do Brevo',
          code: data?.code,
          raw: data,
        },
      };
    }

    return { success: true, messageId: data?.messageId };
  } catch (err: any) {
    return {
      success: false,
      error: { message: err?.message || String(err), code: 'FETCH_ERROR' },
    };
  }
}

// ==========================================
// TEMPLATES
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
          <a href="${ctaLink}" style="display: inline-block; background-color: #F3A61C; color: #ffffff; padding: 15px 35px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 40px;">
            ${ctaTexto}
          </a>
        </div>
      </div>
      <div style="background-color: #0E3A68; padding: 25px 40px; text-align: center;">
        <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 10px 0;">A PLATAFORMA DE EXCELÊNCIA EM PORTUGAL</p>
        <p style="color: #8ca5c1; font-size: 11px; line-height: 1.5; margin: 0;">
          Comunicação direcionada a organizadores de eventos e campos de férias.<br/>
          Para deixar de receber comunicações, basta responder a este e-mail com "remover".
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

  if (!BREVO_API_KEY) {
    return NextResponse.json({
      step: 'config',
      error: 'BREVO_API_KEY não está definida nas Environment Variables do Vercel.',
      dica: 'Vai a Vercel → Settings → Environment Variables e confirma que BREVO_API_KEY está definida para Production.',
    }, { status: 500 });
  }

  const isDebug = searchParams.get('debug') === '1';
  const testEmail = searchParams.get('test');

  // ==========================================
  // MODO TESTE — envia 1 email isolado
  // ==========================================
  if (testEmail) {
    const tpl = COLD_TEMPLATES[0];
    const resultado = await enviarViaBrevo({
      to: { email: testEmail, name: 'Equipa de Teste' },
      subject: '[TESTE] ' + tpl.assunto,
      html: getTemplateHTML(tpl.titulo, tpl.gerarMensagem('Equipa de Teste'), tpl.textoCta, LINK_REGISTO),
    });

    return NextResponse.json({
      step: 'test_send',
      ...resultado,
      config: {
        sender_email: SENDER_EMAIL,
        sender_name: SENDER_NAME,
        link_enviado: LINK_REGISTO,
        api_key_inicio: BREVO_API_KEY.substring(0, 10) + '...',
      },
    }, { status: resultado.success ? 200 : 500 });
  }

  // ==========================================
  // BUSCAR LEADS
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
      return NextResponse.json({ message: 'Nenhuma lead elegível.', brevo_ok: true });
    }

    if (isDebug) {
      return NextResponse.json({
        debug: true,
        brevo_ok: true,
        link_enviado: LINK_REGISTO,
        leads_prontas_count: leadsProntas.length,
        leads_amostra: leadsProntas.slice(0, 10).map(l => ({
          id: l.id, nome: l.nome_cliente, email: l.email_cliente, fase: l.fase_funil,
        })),
      });
    }

    // ==========================================
    // ENVIAR — em batches de 10 para respeitar rate limit do Brevo
    // ==========================================
    const BATCH_SIZE = 10;
    const resultados: any[] = [];

    for (let i = 0; i < leadsProntas.length; i += BATCH_SIZE) {
      const batch = leadsProntas.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (lead) => {
          const email = (lead.email_cliente || '').trim();
          if (!email || email.toLowerCase() === 'nan') {
            return { status: 'skipped', id: lead.id, email, reason: 'email inválido' };
          }

          const faseAtual = Number(lead.fase_funil) || 0;
          const tpl = COLD_TEMPLATES[faseAtual];
          if (!tpl) return { status: 'skipped', id: lead.id, email, reason: 'fase fora do range' };

          const r = await enviarViaBrevo({
            to: { email, name: lead.nome_cliente || 'Organizador' },
            subject: tpl.assunto,
            html: getTemplateHTML(tpl.titulo, tpl.gerarMensagem(lead.nome_cliente || 'Organizador'), tpl.textoCta, LINK_REGISTO),
          });

          if (r.success) {
            console.log('✉️ [OK]', email, '| msgId:', r.messageId);
            return { status: 'sent', id: lead.id, novaFase: faseAtual + 1, email, messageId: r.messageId };
          } else {
            console.error(`❌ [FALHA] ${email}:`, r.error);
            return { status: 'failed', id: lead.id, email, erro: r.error };
          }
        })
      );
      resultados.push(...batchResults);
    }

    const sucessos = resultados.filter(r => r.status === 'sent');
    const falhas = resultados.filter(r => r.status === 'failed');
    const skipped = resultados.filter(r => r.status === 'skipped');

    if (sucessos.length === 0) {
      return NextResponse.json({
        step: 'send_batch',
        success: false,
        mensagem: 'Brevo recusou todos os envios. Verifica o domínio e sender no painel Brevo.',
        enviados: 0,
        tentados: leadsProntas.length,
        primeiro_erro: falhas[0]?.erro || null,
        amostra_falhas: falhas.slice(0, 3).map((f: any) => ({ email: f.email, erro: f.erro })),
        config: {
          sender_email: SENDER_EMAIL,
          api_key_inicio: BREVO_API_KEY.substring(0, 10) + '...',
        },
      }, { status: 500 });
    }

    // Atualizar fases das que enviaram
    const groupedByFase = sucessos.reduce((acc: any, curr: any) => {
      if (!acc[curr.novaFase]) acc[curr.novaFase] = [];
      acc[curr.novaFase].push(curr.id);
      return acc;
    }, {} as Record<number, string[]>);

    const nowIso = new Date().toISOString();
    await Promise.all(
      Object.entries(groupedByFase).map(([faseStr, ids]) =>
        supabaseAdmin
          .from('leads_externas')
          .update({ fase_funil: parseInt(faseStr, 10), ultimo_contacto: nowIso })
          .in('id', ids as string[])
      )
    );

    return NextResponse.json({
      success: true,
      mensagens_enviadas: sucessos.length,
      falhas: falhas.length,
      skipped: skipped.length,
      tentados: leadsProntas.length,
      link_enviado: LINK_REGISTO,
      amostra_falhas: falhas.slice(0, 3).map((f: any) => ({ email: f.email, erro: f.erro })),
    });

  } catch (error: any) {
    console.error('❌ [CRON B2B] Erro crítico:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
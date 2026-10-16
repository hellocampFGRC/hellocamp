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
const SENDER_NAME = 'Afonso da HelloCamp';

const BASE_LINK_REGISTO = 'https://www.hellocamp.pt/pt/registo';

async function enviarViaBrevo(params: {
  to: { email: string; name?: string };
  subject: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; error?: any }> {
  if (!BREVO_API_KEY) return { success: false, error: { message: 'Sem API Key' } };

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
        headers: { 'X-Mailer': 'HelloCamp-B2B' },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: data };
    return { success: true, messageId: data?.messageId };
  } catch (err: any) {
    return { success: false, error: { message: String(err) } };
  }
}

// ==========================================
// TEMPLATES B2B: FOCO NO "SERVIÇO CHAVE-NA-MÃO"
// ==========================================
const COLD_TEMPLATES = [
  {
    gerarAssunto: (nome: string) => `uma pergunta rápida sobre as inscrições da ${nome}`,
    titulo: "Lotação Esgotada, Zero Esforço",
    textoCta: "Ver como funciona a HelloCamp",
    gerarMensagem: (nome: string) => `
      <p>Olá equipa da <strong>${nome}</strong>,</p>
      <p>Tenho acompanhado o vosso trabalho e sei como pode ser exaustivo depender do "passa-a-palavra" ou de publicidade cara para encher as vagas dos vossos campos de férias e atividades.</p>
      <p>Criámos a <strong>HelloCamp</strong> para colocar a vossa marca à frente de milhares de pais, <strong>sem cobrar comissões por reserva</strong> e sem esconder os vossos contactos (os pais falam diretamente convosco na plataforma).</p>
      <p style="background-color: #F8FAFC; padding: 15px; border-left: 4px solid #F3A61C; margin: 25px 0;">
        <strong>Sabemos que o vosso tempo é escasso. Por isso, oferecemos um serviço chave-na-mão:</strong> basta responder a este e-mail com o link ou PDF do vosso programa atual. A nossa equipa encarrega-se de criar e otimizar o vosso perfil completo no nosso portal, sem qualquer custo ou esforço da vossa parte.
      </p>
      <p>Querem poupar dezenas de horas em gestão administrativa já na próxima época?</p>
    `
  },
  {
    gerarAssunto: (nome: string) => `Fichas em papel e comprovativos de MBWay perdidos?`,
    titulo: "Diga adeus ao caos administrativo",
    textoCta: "Descobrir o Dashboard Automático",
    gerarMensagem: (nome: string) => `
      <p>Olá novamente,</p>
      <p>Falei com vários organizadores de campos de férias nas últimas semanas e a queixa é sempre a mesma: a burocracia das inscrições consome tempo que devia ser usado no terreno com os participantes.</p>
      <p>Ao colocarem a <strong>${nome}</strong> na HelloCamp, não ganham apenas publicidade. Ganham uma secretaria digital gratuita.</p>
      <p>Na nossa plataforma, <strong>os pais pagam automaticamente no momento da reserva</strong> (Multibanco ou MBWay) e as fichas médicas/alergias ficam imediatamente guardadas no vosso painel. Sem trocas infinitas de emails, sem comprovativos falsos e sem folhas de Excel desorganizadas.</p>
      <p>Acelere a vossa organização. Responda a este e-mail para ativarmos o vosso espaço.</p>
    `
  },
  {
    gerarAssunto: (nome: string) => `Porque não escondemos os contactos da ${nome} (ao contrário dos outros)`,
    titulo: "O Protagonismo é Vosso",
    textoCta: "Criar o meu Perfil Transparente",
    gerarMensagem: (nome: string) => `
      <p>Equipa da <strong>${nome}</strong>,</p>
      <p>Se já usam outros agregadores de mercado, já devem ter reparado num detalhe frustrante: eles escondem os vossos contactos para obrigar os clientes a falar com eles primeiro. Vocês tornam-se reféns da plataforma deles.</p>
      <p>A HelloCamp joga com outras regras. Acreditamos que a confiança constrói-se quando as famílias falam diretamente com quem organiza.</p>
      <p>No vosso perfil da HelloCamp, <strong>o vosso telefone, site e e-mail estão 100% visíveis</strong>. Adicionámos até um Chat integrado para que os pais possam tirar dúvidas convosco de forma rápida e segura.</p>
      <p>Recuperem o controlo da vossa comunicação. Podemos avançar com a criação da vossa página?</p>
    `
  },
  {
    gerarAssunto: (nome: string) => `Já tem a equipa de monitores fechada para as próximas férias?`,
    titulo: "Encontre os Melhores Animadores",
    textoCta: "Explorar a Bolsa de Monitores",
    gerarMensagem: (nome: string) => `
      <p>Olá,</p>
      <p>A qualidade do vosso campo de férias depende diretamente da energia e responsabilidade dos monitores que contratam. Mas sabemos que recrutar nas épocas de pico é uma dor de cabeça logística.</p>
      <p>Na HelloCamp, não trazemos apenas clientes. Construímos uma <strong>Bolsa de Talentos integrada</strong>.</p>
      <p>Através do vosso Dashboard, podem aceder a perfis de jovens animadores certificados, atribuí-los às vossas turmas e gerir permissões para que eles acedam apenas às informações (alergias, dados urgentes) das crianças que lhes estão atribuídas.</p>
      <p>Garanta que a sua equipa está completa meses antes de o campo começar.</p>
    `
  },
  {
    gerarAssunto: (nome: string) => `Último email (e a nossa oferta chave-na-mão para a ${nome})`,
    titulo: "A Época de Reservas já Começou",
    textoCta: "Garantir o meu Lugar na HelloCamp",
    gerarMensagem: (nome: string) => `
      <p>Olá equipa da <strong>${nome}</strong>,</p>
      <p>Prometo que não vos chateio mais. Queria apenas deixar um último convite antes da época alta arrancar em força e as vagas da vossa zona ficarem preenchidas por outros parceiros.</p>
      <p>Neste preciso momento, há famílias no Google a pesquisar por atividades na vossa região. A HelloCamp está a encaminhar essas famílias para os nossos organizadores oficiais.</p>
      <p><strong>Reforço a nossa oferta especial: não precisam de preencher formulários longos.</strong> Enviem-nos apenas o PDF ou link das vossas datas em resposta a este e-mail, e a nossa equipa configura o vosso espaço em menos de 24 horas.</p>
      <p>Não fiquem de fora da plataforma que está a modernizar as experiências das crianças em Portugal. Esperamos por vocês.</p>
    `
  }
];

function getTemplateHTML(titulo: string, mensagem: string, ctaTexto: string, ctaLink: string) {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8EDF2; border-radius: 8px; overflow: hidden;">
      <div style="height: 6px; width: 100%; display: flex;">
        <div style="background-color: #218F4C; height: 100%; width: 33.3%;"></div>
        <div style="background-color: #F3A61C; height: 100%; width: 33.4%;"></div>
        <div style="background-color: #0E3A68; height: 100%; width: 33.3%;"></div>
      </div>
      <div style="padding: 35px;">
        <div style="margin-bottom: 30px;">
          <h1 style="color: #0E3A68; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Hello<span style="color: #F3A61C;">Camp</span></h1>
        </div>
        <h2 style="color: #0E3A68; font-size: 19px; margin-top: 0; margin-bottom: 20px; font-weight: 700; line-height: 1.4;">
          ${titulo}
        </h2>
        <div style="color: #333333; font-size: 15px; line-height: 1.6;">
          ${mensagem}
        </div>
        <div style="margin-top: 35px; margin-bottom: 10px;">
          <a href="${ctaLink}" style="display: inline-block; background-color: #F3A61C; color: #ffffff; padding: 14px 28px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 6px;">
            ${ctaTexto}
          </a>
        </div>
      </div>
      <div style="background-color: #F8FAFC; padding: 20px 35px; border-top: 1px solid #E8EDF2;">
        <p style="color: #64748B; font-size: 11px; line-height: 1.5; margin: 0;">
          Recebeu este e-mail porque a sua entidade é uma referência no setor da educação/atividades em Portugal.<br/>
          Caso não faça sentido para si, por favor ignore este e-mail ou responda com "Remover".
        </p>
      </div>
    </div>
  `;
}

// ==========================================
// HANDLER DA API
// ==========================================
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isAuthorized = request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}` || searchParams.get('secret') === process.env.CRON_SECRET;

  if (!isAuthorized) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: leadsProntas, error } = await supabaseAdmin
      .from('leads_externas')
      .select('id, nome_cliente, email_cliente, fase_funil, ultimo_contacto')
      .lt('fase_funil', COLD_TEMPLATES.length)
      .or(`ultimo_contacto.is.null,ultimo_contacto.lt.${seteDiasAtras}`)
      .not('email_cliente', 'is', null)
      .neq('email_cliente', '')
      .order('fase_funil', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(75);

    if (error) throw error;
    if (!leadsProntas || leadsProntas.length === 0) return NextResponse.json({ message: 'Nenhuma lead elegível.' });

    const resultados: any[] = [];
    for (const lead of leadsProntas) {
      const email = (lead.email_cliente || '').trim();
      const nome = lead.nome_cliente || 'Organizador';
      const faseAtual = Number(lead.fase_funil) || 0;
      const tpl = COLD_TEMPLATES[faseAtual];

      const ctaLinkTracker = `${BASE_LINK_REGISTO}?utm_source=cold_email_b2b&utm_medium=email&utm_campaign=fase_${faseAtual}`;

      const r = await enviarViaBrevo({
        to: { email, name: nome },
        subject: tpl.gerarAssunto(nome),
        html: getTemplateHTML(tpl.titulo, tpl.gerarMensagem(nome), tpl.textoCta, ctaLinkTracker),
      });

      if (r.success) {
        resultados.push({ status: 'sent', id: lead.id, novaFase: faseAtual + 1 });
      }
    }

    const sucessos = resultados.filter(r => r.status === 'sent');

    if (sucessos.length > 0) {
      const groupedByFase = sucessos.reduce((acc: any, curr: any) => {
        if (!acc[curr.novaFase]) acc[curr.novaFase] = [];
        acc[curr.novaFase].push(curr.id);
        return acc;
      }, {} as Record<number, string[]>);

      const nowIso = new Date().toISOString();
      await Promise.all(
        Object.entries(groupedByFase).map(([faseStr, ids]) =>
          supabaseAdmin.from('leads_externas')
            .update({ fase_funil: parseInt(faseStr, 10), ultimo_contacto: nowIso })
            .in('id', ids as string[])
        )
      );
    }

    return NextResponse.json({ success: true, enviados: sucessos.length });

  } catch (error: any) {
    console.error('❌ Erro no Cron B2B:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
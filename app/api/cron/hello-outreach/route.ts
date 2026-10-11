import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailgun.org', 
  port: Number(process.env.SMTP_PORT) || 587,
  pool: true, 
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// ==========================================
// FUNIL B2B HELLOCAMP: 5 EMAILS SEQUENCIAIS
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
      
      <!-- TOPO TRICOLOR HELLOCAMP -->
      <div style="height: 8px; width: 100%; display: flex;">
        <div style="background-color: #218F4C; height: 100%; width: 33.3%;"></div> <!-- Verde -->
        <div style="background-color: #F3A61C; height: 100%; width: 33.4%;"></div> <!-- Laranja -->
        <div style="background-color: #0E3A68; height: 100%; width: 33.3%;"></div> <!-- Azul Escuro -->
      </div>
      
      <div style="padding: 40px;">
        
        <!-- LOGO TEXTO -->
        <div style="text-align: center; margin-bottom: 35px;">
          <h1 style="color: #0E3A68; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Hello<span style="color: #F3A61C;">Camp</span></h1>
        </div>
        
        <h2 style="color: #0E3A68; font-size: 20px; margin-top: 0; margin-bottom: 25px; font-weight: 700; line-height: 1.4;">
          ${titulo}
        </h2>
        
        <div style="color: #4a4a4a; font-size: 15px; line-height: 1.6;">
          ${mensagem}
        </div>
        
        <!-- BOTÃO CTA (LARANJA DA MARCA) -->
        <div style="text-align: center; margin-top: 40px; margin-bottom: 10px;">
          <a href="${ctaLink}" style="display: inline-block; background-color: #F3A61C; color: #ffffff; padding: 15px 35px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 40px; box-shadow: 0 4px 6px rgba(243, 166, 28, 0.2);">
            ${ctaTexto}
          </a>
        </div>
      </div>
      
      <!-- FOOTER AZUL ESCURO -->
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isAuthorized = request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}` || searchParams.get('secret') === process.env.CRON_SECRET;
  
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
  }

  try {
    // 7 dias de intervalo entre cada email
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // QUERY INTELIGENTE: Puxa 75 leads ordenadas obrigatoriamente pela fase do funil
    // Garante que o sistema esgota a "Fase 0" de TODOS antes de passar para a "Fase 1" de alguém.
    const { data: leadsProntas, error } = await supabaseAdmin.from('leads_externas')
      .select('id, nome_cliente, email_cliente, fase_funil')
      .lt('fase_funil', COLD_TEMPLATES.length)
      .or(`ultimo_contacto.is.null,ultimo_contacto.lt.${seteDiasAtras}`)
      .neq('email_cliente', '')
      .order('fase_funil', { ascending: true }) 
      .order('ultimo_contacto', { ascending: true, nullsFirst: true })
      .limit(75);

    if (error) throw error;

    if (!leadsProntas || leadsProntas.length === 0) {
      return NextResponse.json({ message: 'Nenhuma lead elegível para receber propostas neste momento.' });
    }

    // DISPARO EM PARALELO (SMTP)
    const promisesEnvio = leadsProntas.map(async (lead) => {
      if (!lead.email_cliente) return null;
      
      const faseAtual = lead.fase_funil || 0;
      const tpl = COLD_TEMPLATES[faseAtual];
      if (!tpl) return null;

      const linkFinal = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.hellocamp.pt'}/registar?lang=pt&utm_source=cold_email&utm_campaign=fase${faseAtual}`;
      
      try {
        await transporter.sendMail({
          from: '"HelloCamp" <info@hellocamp.pt>', 
          to: lead.email_cliente, 
          subject: tpl.assunto,
          html: getTemplateHTML(tpl.titulo, tpl.gerarMensagem(lead.nome_cliente || 'Organizador'), tpl.textoCta, linkFinal)
        });
        
        return { id: lead.id, novaFase: faseAtual + 1 };
      } catch (e) {
        console.error(`Falha no envio para ${lead.email_cliente}:`, e);
        return null;
      }
    });

    const resultados = await Promise.all(promisesEnvio);
    const sucessos = resultados.filter((r) => r !== null) as { id: string, novaFase: number }[];

    if (sucessos.length === 0) {
      return NextResponse.json({ message: 'Falha global de SMTP. 0 emails enviados.', enviados: 0 });
    }

    // ATUALIZAÇÃO NO SUPABASE
    const groupedByFase = sucessos.reduce((acc, curr) => {
      if (!acc[curr.novaFase]) acc[curr.novaFase] = [];
      acc[curr.novaFase].push(curr.id);
      return acc;
    }, {} as Record<number, string[]>);

    const nowIso = new Date().toISOString();
    
    const updatePromises = Object.entries(groupedByFase).map(([faseStr, ids]) => {
      const faseNum = parseInt(faseStr, 10);
      return supabaseAdmin.from('leads_externas')
        .update({ fase_funil: faseNum, ultimo_contacto: nowIso })
        .in('id', ids); 
    });

    await Promise.all(updatePromises);
    
    return NextResponse.json({ success: true, mensagens_enviadas: sucessos.length });
    
  } catch (error: any) {
    console.error("Erro crítico no Bot de Vendas HelloCamp:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
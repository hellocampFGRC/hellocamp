import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 segundos de limite para a Vercel

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailgun.org', // Altera para o teu host de SMTP
  port: Number(process.env.SMTP_PORT) || 587,
  pool: true, 
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// ==========================================
// FUNIL B2B (HELLO CAMP): 5 DORES E SOLUÇÕES
// ==========================================
const COLD_TEMPLATES = [
  {
    assunto: "A plataforma que revoluciona a gestão do seu Campo de Férias",
    titulo: "Bem-vindos à HelloCamp",
    textoCta: "Conhecer a HelloCamp",
    gerarMensagem: (nome: string) => `
      <p>Estimada equipa da <strong>${nome}</strong>,</p>
      <p>Sabemos que organizar um campo de férias de excelência requer dedicação total. O problema é que, no final do dia, acabam por perder horas preciosas com burocracias: inscrições em papel, pagamentos manuais por transferência, trocas infinitas de e-mails com os pais e folhas de Excel desorganizadas.</p>
      <p>A <strong>HelloCamp</strong> foi criada em Portugal para digitalizar e simplificar toda a sua operação, ligando a sua marca às famílias interessadas.</p>
      <h3 style="color: #0E3A68; font-size: 16px; margin-top: 25px; margin-bottom: 15px;">O que a nossa plataforma faz pelo seu campo:</h3>
      <ul style="padding-left: 20px; color: #4a4a4a; line-height: 1.8; margin-bottom: 25px;">
        <li><strong>Dashboard Centralizado:</strong> Controle as vagas, listas de espera e turmas numa única janela.</li>
        <li><strong>Fichas Médicas Digitais:</strong> Aceda instantaneamente ao histórico, alergias e contactos de emergência de todos os inscritos.</li>
        <li><strong>Pagamentos Seguros:</strong> O sistema processa inscrições automaticamente via MBWay ou Multibanco.</li>
      </ul>
      <p>Convidamos a sua equipa a registar-se no nosso portal e a focar-se no que realmente importa: a experiência e segurança das crianças.</p>
    `
  },
  {
    assunto: "Diga adeus às comissões ocultas e aos contactos bloqueados",
    titulo: "A Nossa Diferença: Foco na Sua Marca",
    textoCta: "Descobrir as Vantagens",
    gerarMensagem: (nome: string) => `
      <p>Olá <strong>${nome}</strong>,</p>
      <p>Muitas plataformas e diretórios do mercado oferecem visibilidade, mas cobram um preço altíssimo: escondem o vosso telefone, bloqueiam o vosso e-mail, forçam intermediações lentas e asfixiam as margens com comissões sobre cada inscrição.</p>
      <p>A filosofia da <strong>HelloCamp</strong> é radicalmente diferente. Nós queremos que as famílias conheçam o SEU campo e falem consigo diretamente.</p>
      <h3 style="color: #0E3A68; font-size: 16px; margin-top: 25px; margin-bottom: 15px;">A nossa promessa de transparência:</h3>
      <ul style="padding-left: 20px; color: #4a4a4a; line-height: 1.8; margin-bottom: 25px;">
        <li><strong>Contactos Expostos:</strong> O seu telefone e website oficial estão sempre visíveis para as famílias.</li>
        <li><strong>Chat Integrado:</strong> Fale com os pais diretamente no sistema para tirar dúvidas e partilhar informações diárias do campo.</li>
        <li><strong>Controlo Financeiro:</strong> As transações são diretas. Cobre sinais de reserva ou reembolse cancelamentos a 1 clique.</li>
      </ul>
      <p>Não seja apenas mais um logotipo num catálogo. Faça a gestão do seu negócio na ferramenta que defende a sua independência.</p>
    `
  },
  {
    assunto: "A dificuldade em recrutar e gerir animadores acabou",
    titulo: "Portal Dedicado a Monitores",
    textoCta: "Explorar o Portal de Monitores",
    gerarMensagem: (nome: string) => `
      <p>Exmos. Senhores da <strong>${nome}</strong>,</p>
      <p>A alma de qualquer campo de férias são os coordenadores e os animadores. Mas sabemos que o processo de recrutamento para as épocas de Verão e Páscoa pode ser um pesadelo logístico e jurídico.</p>
      <p>A pensar nisto, a HelloCamp não é apenas para os pais. Criámos um <strong>Módulo Integrado de Monitores</strong>.</p>
      <h3 style="color: #0E3A68; font-size: 16px; margin-top: 25px; margin-bottom: 15px;">Como ajudamos a gerir o seu Staff:</h3>
      <ul style="padding-left: 20px; color: #4a4a4a; line-height: 1.8; margin-bottom: 25px;">
        <li><strong>Bolsa de Talentos:</strong> Aceda a perfis de jovens certificados (IPDJ), com competências e histórico validados.</li>
        <li><strong>Atribuição de Turmas:</strong> Associe diretamente os seus monitores aos diferentes turnos e categorias (Desporto, Aventura, Robótica).</li>
        <li><strong>Gestão de Acessos:</strong> Dê permissões restritas aos monitores para consultarem apenas as fichas médicas e os nomes das crianças da sua responsabilidade.</li>
      </ul>
      <p>Garanta as melhores equipas para os seus campos de férias com uma organização irrepreensível.</p>
    `
  },
  {
    assunto: "Reembolsos, sinais e pagamentos em atraso? Resolvido.",
    titulo: "O Fim da Confusão Financeira",
    textoCta: "Ver Ferramentas Financeiras",
    gerarMensagem: (nome: string) => `
      <p>Estimados parceiros da <strong>${nome}</strong>,</p>
      <p>Quantas horas a sua secretaria gasta a tentar conciliar comprovativos de transferência em PDF com as fichas de inscrição em Word? Quando uma criança adoece e é preciso cancelar a reserva, quanto tempo demora a processar o reembolso?</p>
      <p>Ao integrar o seu campo na HelloCamp, passa a dispor de um autêntico <strong>Motor Financeiro Automático</strong>.</p>
      <h3 style="color: #0E3A68; font-size: 16px; margin-top: 25px; margin-bottom: 15px;">Automação que poupa horas à sua equipa:</h3>
      <ul style="padding-left: 20px; color: #4a4a4a; line-height: 1.8; margin-bottom: 25px;">
        <li><strong>Inscrições Independentes:</strong> Os pais pagam as vagas no checkout. Só entra na sua lista confirmada quem pagou, bloqueando logo a lotação.</li>
        <li><strong>Gestão de Sinais:</strong> Cobre 30% no ato de reserva e agende lembretes automáticos para o pagamento do remanescente.</li>
        <li><strong>Reembolsos Sem Atrito:</strong> Devolva o valor (total ou parcial) em segundos, sem necessitar de pedir o IBAN aos pais repetidamente.</li>
      </ul>
      <p>Profissionalize os pagamentos do seu campo e aumente a confiança das famílias que lhe entregam os filhos.</p>
    `
  },
  {
    assunto: "Faça da sua empresa uma referência nacional",
    titulo: "O Motor de Busca Que Traz Clientes",
    textoCta: "Configurar o Meu Espaço",
    gerarMensagem: (nome: string) => `
      <p>Olá equipa da <strong>${nome}</strong>,</p>
      <p>Muitas organizações confiam apenas no "boca a boca" ou nas redes sociais. No entanto, milhares de famílias pesquisam diariamente ativamente por campos de férias temáticos (Surf, Pintura, Línguas ou Programação) no Google.</p>
      <p>A <strong>HelloCamp</strong> atua como um agregador inteligente focado em SEO, canalizando essas famílias para o seu negócio.</p>
      <h3 style="color: #0E3A68; font-size: 16px; margin-top: 25px; margin-bottom: 15px;">O impacto de diversificar a sua presença:</h3>
      <ul style="padding-left: 20px; color: #4a4a4a; line-height: 1.8; margin-bottom: 25px;">
        <li><strong>Filtros Avançados:</strong> Os pais pesquisam por Localização, Preço e Faixa Etária, encontrando exatamente o programa que o seu campo oferece.</li>
        <li><strong>Venda Cruzada (Cross-Selling):</strong> Utilize um único perfil para listar colónias abertas em múltiplas épocas (Verão, Páscoa, Natal).</li>
        <li><strong>Credibilidade Imediata:</strong> Acumule avaliações de pais satisfeitos e destaque a qualidade das suas edições passadas.</li>
      </ul>
      <p>Posicione o seu campo de férias como a principal escolha no mercado português. O registo inicial é rápido, seguro e sem riscos.</p>
    `
  }
];

function getTemplateHTML(titulo: string, mensagem: string, ctaTexto: string, ctaLink: string) {
  // Ocultamos a barra inferior se for o mail principal
  const linkMonitores = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.hellocamp.pt'}/monitores?utm_source=cold_email&utm_campaign=ps_monitor`;
  
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8EDF2; border-radius: 6px;">
      
      <!-- TOPO COM BARRA TRICOLOR HELLOCAMP -->
      <div style="height: 6px; width: 100%; display: flex;">
        <div style="background-color: #218F4C; height: 100%; width: 33.3%;"></div> <!-- Verde -->
        <div style="background-color: #F3A61C; height: 100%; width: 33.4%;"></div> <!-- Laranja -->
        <div style="background-color: #0E3A68; height: 100%; width: 33.3%;"></div> <!-- Azul Escuro -->
      </div>
      
      <div style="padding: 45px;">
        
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #0E3A68; font-size: 24px; margin: 0; letter-spacing: 1px; font-weight: bold;">Hello<span style="color: #F3A61C;">Camp</span></h1>
        </div>
        
        <h2 style="color: #0E3A68; font-size: 22px; margin-top: 0; margin-bottom: 25px; border-bottom: 2px solid #F5F7FA; padding-bottom: 15px; font-weight: 700; line-height: 1.4;">
          ${titulo}
        </h2>
        
        <div style="color: #4a4a4a; font-size: 15px; line-height: 1.7;">
          ${mensagem}
        </div>
        
        <!-- BOTÃO CTA PRINCIPAL (LARANJA) -->
        <div style="text-align: center; margin-top: 45px; margin-bottom: 35px;">
          <a href="${ctaLink}" style="display: inline-block; background-color: #F3A61C; color: #ffffff; padding: 16px 40px; text-decoration: none; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-radius: 30px;">
            ${ctaTexto}
          </a>
        </div>

        <!-- P.S. ESTRATÉGICO PARA MONITORES -->
        <div style="border-top: 1px solid #E8EDF2; padding-top: 25px; margin-top: 20px;">
          <p style="color: #0E3A68; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">
            P.S. É animador de campos de férias?
          </p>
          <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 0;">
            Se não organiza os campos e é apenas animador à procura de vagas nas épocas de pausa letiva, aceda ao nosso <a href="${linkMonitores}" style="color: #218F4C; text-decoration: underline; font-weight: bold;">Portal de Monitores</a> para ser recrutado pelas melhores instituições de Portugal.
          </p>
        </div>
        
      </div>
      
      <!-- FOOTER AZUL ESCURO -->
      <div style="text-align: center; padding: 30px; background-color: #0E3A68; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px;">
        <p style="color: #F3A61C; font-size: 13px; font-weight: bold; letter-spacing: 1px; margin: 0 0 10px 0;">A FORMA MAIS SEGURA DE DESCOBRIR CAMPOS DE FÉRIAS</p>
        <p style="color: #A0AEC0; font-size: 11px; line-height: 1.6; margin: 0;">
          Comunicação direcionada a organizadores de excelência.<br/>
          Caso não deseje continuar a receber as nossas comunicações, por favor ignore este e-mail.
        </p>
      </div>
    </div>
  `;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Segurança do Cron-Job
  const isAuthorized = request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}` || searchParams.get('secret') === process.env.CRON_SECRET;
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
  }

  try {
    // Apenas enviar e-mail a quem não é contactado há mais de 7 dias
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // 1. LER BASE DE DADOS: Busca as leads inseridas do Supabase
    // Atenção: Certifica-te que a tabela e campos batem certo com o teu banco de dados
    const { data: leadsProntas, error } = await supabaseAdmin.from('leads_externas')
      .select('id, nome_cliente, email_cliente, fase_funil')
      .lt('fase_funil', COLD_TEMPLATES.length)
      .or(`ultimo_contacto.is.null,ultimo_contacto.lt.${seteDiasAtras}`)
      .neq('email_cliente', '')
      .limit(100); // Enviamos no máximo 100 a cada run para não bloquear o SMTP

    if (error) throw error;

    if (!leadsProntas || leadsProntas.length === 0) {
      return NextResponse.json({ message: 'Nenhuma lead elegível para receber propostas neste momento.' });
    }

    // 2. DISPARO EM PARALELO (SMTP)
    const promisesEnvio = leadsProntas.map(async (lead) => {
      if (!lead.email_cliente) return null;
      
      const faseAtual = lead.fase_funil || 0;
      const tpl = COLD_TEMPLATES[faseAtual];
      if (!tpl) return null;

      const linkFinal = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.hellocamp.pt'}/registar?lang=pt&utm_source=cold_email&utm_campaign=fase${faseAtual}`;
      
      try {
        await transporter.sendMail({
          from: '"Afonso da HelloCamp" <info@hellocamp.pt>', 
          to: lead.email_cliente, 
          subject: tpl.assunto,
          html: getTemplateHTML(tpl.titulo, tpl.gerarMensagem(lead.nome_cliente || 'Parceiro'), tpl.textoCta, linkFinal)
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

    // 3. ATUALIZAÇÃO NO SUPABASE
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
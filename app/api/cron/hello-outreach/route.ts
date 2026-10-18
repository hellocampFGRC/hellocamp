import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Limite máximo da Vercel

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==========================================
// CONFIG BREVO & REMETENTE
// ==========================================
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = 'info@hellocamp.pt';
const SENDER_NAME = 'Rodrigo | HelloCamp'; 
const BASE_URL = 'https://www.hellocamp.pt';

// ==========================================
// FUNÇÃO DE ENVIO BREVO
// ==========================================
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
        headers: { 'X-Mailer': 'HelloCamp-B2B-Global' },
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
// MATRIZ DE TEMPLATES MULTI-IDIOMA (FUNIL DE 4 FASES)
// ==========================================
type Template = {
  gerarAssunto: (nome: string) => string;
  titulo: string;
  textoCta: string;
  gerarMensagem: (nome: string) => string;
  footer: string;
};

const TEMPLATES: Record<string, Template[]> = {
  PT: [
    {
      gerarAssunto: (nome) => `uma pergunta rápida sobre as inscrições da ${nome}`,
      titulo: "Lotação Esgotada, Zero Esforço",
      textoCta: "Ver como funciona a HelloCamp",
      footer: "Recebeu este e-mail porque a sua entidade é uma referência em Portugal. Para remover, responda 'Remover'.",
      gerarMensagem: (nome) => `
        <p>Olá equipa da <strong>${nome}</strong>,</p>
        <p>Criámos a <strong>HelloCamp</strong> para ligar a vossa marca a milhares de pais, <strong>sem cobrar comissões por reserva</strong> e mantendo os vossos contactos visíveis.</p>
        <p style="background-color: #F8FAFC; padding: 15px; border-left: 4px solid #F3A61C; margin: 25px 0;">
          <strong>O nosso serviço chave-na-mão gratuito:</strong> sabemos que não têm tempo para preencher formulários. Basta responderem a este e-mail com o link ou PDF do vosso programa atual. A nossa equipa cria e otimiza o vosso perfil no nosso portal sem qualquer custo ou esforço da vossa parte.
        </p>
        <p>Vamos poupar-vos dezenas de horas em gestão administrativa já na próxima época?</p>
      `
    },
    {
      gerarAssunto: (nome) => `Fichas em papel e comprovativos de MBWay perdidos?`,
      titulo: "Diga adeus ao caos administrativo",
      textoCta: "Descobrir o Dashboard Automático",
      footer: "Recebeu este e-mail porque a sua entidade é uma referência em Portugal. Para remover, responda 'Remover'.",
      gerarMensagem: (nome) => `
        <p>Olá novamente,</p>
        <p>Ao colocarem a <strong>${nome}</strong> na HelloCamp, não ganham apenas publicidade. Ganham uma secretaria digital.</p>
        <p>Na nossa plataforma, <strong>os pais pagam automaticamente</strong> (Multibanco/MBWay) e as fichas médicas e de alergias ficam logo guardadas no vosso painel. Sem trocas de e-mails, sem comprovativos falsos.</p>
        <p>Para ativarmos o vosso espaço hoje, <strong>basta responderem a este e-mail com a vossa brochura</strong> e nós tratamos do resto.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Porque não escondemos os contactos da ${nome}`,
      titulo: "O Protagonismo é Vosso",
      textoCta: "Criar o meu Perfil (ou deixe-nos fazer por si)",
      footer: "Recebeu este e-mail porque a sua entidade é uma referência em Portugal. Para remover, responda 'Remover'.",
      gerarMensagem: (nome) => `
        <p>Equipa da <strong>${nome}</strong>,</p>
        <p>Outros portais escondem os vossos contactos para obrigar os clientes a falar com eles primeiro. Na HelloCamp, <strong>o vosso telefone, site e e-mail estão 100% visíveis</strong>.</p>
        <p>Recuperem o controlo da vossa comunicação. <strong>Respondam a este e-mail com os vossos programas</strong> e a nossa equipa de onboarding cria o vosso perfil gratuitamente em 24h.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Último e-mail (e a nossa oferta chave-na-mão para a ${nome})`,
      titulo: "A Época de Reservas Começou",
      textoCta: "Garantir o meu Lugar na HelloCamp",
      footer: "Recebeu este e-mail porque a sua entidade é uma referência em Portugal. Para remover, responda 'Remover'.",
      gerarMensagem: (nome) => `
        <p>Olá equipa da <strong>${nome}</strong>,</p>
        <p>Prometo que não vos chateio mais. Neste momento, há milhares de famílias a pesquisar por atividades para este verão, e estamos a encaminhá-las para os nossos parceiros.</p>
        <p><strong>Não precisam de preencher nada.</strong> Enviem-nos apenas o PDF das vossas datas em resposta a este e-mail, e configuramos o vosso espaço grátis.</p>
        <p>Esperamos por vocês.</p>
      `
    }
  ],
  EN: [
    {
      gerarAssunto: (nome) => `European students looking for ${nome} summer camps`,
      titulo: "Welcome European Students",
      textoCta: "List your Camps on HelloCamp",
      footer: "You received this because your organization is highly rated. Reply 'Remove' to unsubscribe.",
      gerarMensagem: (nome) => `
        <p>Hi <strong>${nome}</strong> team,</p>
        <p>I'm reaching out from <strong>HelloCamp</strong>, Portugal's leading search engine and booking platform for summer camps and holiday programs.</p>
        <p>We currently have thousands of families across Europe (especially in Portugal and Spain) actively looking for international summer experiences in the UK and the US. We noticed your excellent programs and would love to feature them to our audience.</p>
        <p><strong>There are no setup fees.</strong> We simply connect international families directly to your booking system or our automated dashboard.</p>
        <p>Would you be open to a quick 10-minute chat, or would you prefer to list your programs directly via the link below?</p>
      `
    },
    {
      gerarAssunto: (nome) => `Automating international bookings for ${nome}`,
      titulo: "International Growth, Zero Hassle",
      textoCta: "Create your Partner Account",
      footer: "You received this because your organization is highly rated. Reply 'Remove' to unsubscribe.",
      gerarMensagem: (nome) => `
        <p>Hello again,</p>
        <p>Expanding your summer camp to international markets usually involves expensive marketing. By listing <strong>${nome}</strong> on HelloCamp, you tap instantly into the Iberian market.</p>
        <p>We provide a dedicated B2B Partner Dashboard where you can manage dates, availability, and receive secure payments directly from European parents.</p>
        <p>Registration takes 5 minutes. Feel free to set up your account or reply to this email to schedule a quick call with our Business Development team.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Why we put ${nome}'s brand first`,
      titulo: "Your Brand Comes First",
      textoCta: "Join HelloCamp for Free",
      footer: "You received this because your organization is highly rated. Reply 'Remove' to unsubscribe.",
      gerarMensagem: (nome) => `
        <p>Hi <strong>${nome}</strong>,</p>
        <p>Unlike other directories that hide your details, at HelloCamp <strong>your website, email, and brand are 100% visible</strong> to parents.</p>
        <p>We believe in transparent partnerships. Our goal is to drive high-quality European leads directly to your programs.</p>
        <p>Create your free listing today and let us help you fill your remaining spots for the upcoming season.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Last email (European bookings for ${nome})`,
      titulo: "Booking Season is Here",
      textoCta: "Start Receiving Bookings",
      footer: "You received this because your organization is highly rated. Reply 'Remove' to unsubscribe.",
      gerarMensagem: (nome) => `
        <p>Hi <strong>${nome}</strong> team,</p>
        <p>I promise this is my last email. Booking season is peaking, and European families are finalizing their summer plans right now.</p>
        <p>We would hate for you to miss out on this demographic. You can list your programs in a few minutes, or just reply to this email and our team will set it up for you.</p>
        <p>We hope to welcome you aboard HelloCamp soon!</p>
      `
    }
  ],
  ES: [
    {
      gerarAssunto: (nome) => `Familias portuguesas buscando campamentos en ${nome}`,
      titulo: "Atrae Alumnos Internacionales",
      textoCta: "Unirse a HelloCamp",
      footer: "Recibe este email porque su entidad es una referencia. Responda 'Eliminar' si no desea más emails.",
      gerarMensagem: (nome) => `
        <p>Hola equipo de <strong>${nome}</strong>,</p>
        <p>Les escribo desde <strong>HelloCamp</strong>, el mayor buscador y plataforma de reservas de campamentos de verano en Portugal.</p>
        <p>Tenemos miles de familias portuguesas que buscan cada año enviar a sus hijos a España para disfrutar de campamentos de deporte, idiomas y aventura. Al ser el destino internacional número uno para nuestros usuarios, nos encantaría incluir sus excelentes programas en nuestro portal.</p>
        <p><strong>No hay costes de alta ni de mantenimiento.</strong> Solo conectamos a las familias con sus programas.</p>
        <p>¿Tienen disponibilidad para una breve llamada de 10 minutos, o prefieren registrar la organización directamente en el botón de abajo?</p>
      `
    },
    {
      gerarAssunto: (nome) => `Gestión internacional sin esfuerzo para ${nome}`,
      titulo: "Crece en el Mercado Ibérico",
      textoCta: "Crear Cuenta de Partner",
      footer: "Recibe este email porque su entidad es una referencia. Responda 'Eliminar' si no desea más emails.",
      gerarMensagem: (nome) => `
        <p>Hola de nuevo,</p>
        <p>Captar alumnos internacionales suele requerir mucha inversión en marketing. Al anunciar <strong>${nome}</strong> en HelloCamp, acceden directamente a miles de clientes portugueses.</p>
        <p>Les ofrecemos un Dashboard automatizado donde pueden recibir inscripciones, fichas médicas y pagos seguros de forma instantánea.</p>
        <p>Pueden registrarse en 5 minutos o responder a este email para agendar una llamada con nuestro equipo comercial y aclarar cualquier duda.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Por qué damos visibilidad total a la marca de ${nome}`,
      titulo: "Su Marca es la Protagonista",
      textoCta: "Anunciar mis Campamentos",
      footer: "Recibe este email porque su entidad es una referencia. Responda 'Eliminar' si no desea más emails.",
      gerarMensagem: (nome) => `
        <p>Equipo de <strong>${nome}</strong>,</p>
        <p>Otros portales ocultan sus datos para obligar al cliente a pasar por ellos. En HelloCamp, <strong>su teléfono, web y logo son 100% visibles</strong>.</p>
        <p>Creemos en alianzas transparentes. Nuestro objetivo es aportarles reservas de calidad desde el mercado portugués y europeo.</p>
        <p>Creen su perfil gratuito hoy mismo y prepárense para la temporada de verano.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Último email (y reservas europeas para ${nome})`,
      titulo: "La Temporada de Reservas ha Comenzado",
      textoCta: "Garantizar mi espacio",
      footer: "Recibe este email porque su entidad es una referencia. Responda 'Eliminar' si no desea más emails.",
      gerarMensagem: (nome) => `
        <p>Hola equipo de <strong>${nome}</strong>,</p>
        <p>Prometo que es mi último correo. Las familias ya están cerrando sus planes de verano y nos encantaría poder recomendar sus programas.</p>
        <p>Si prefieren no perder tiempo, <strong>respondan a este correo con un folleto/PDF de sus fechas</strong> y nuestro equipo se encargará de crear y traducir su perfil gratuitamente.</p>
        <p>Esperamos colaborar con ustedes muy pronto.</p>
      `
    }
  ],
  FR: [
    {
      gerarAssunto: (nome) => `Élèves européens cherchant des séjours avec ${nome}`,
      titulo: "Attirez des Étudiants Internationaux",
      textoCta: "Rejoindre HelloCamp",
      footer: "Vous recevez cet e-mail car votre organisation est une référence. Répondez 'Retirer' pour vous désabonner.",
      gerarMensagem: (nome) => `
        <p>Bonjour l'équipe de <strong>${nome}</strong>,</p>
        <p>Je vous contacte de la part de <strong>HelloCamp</strong>, le principal moteur de recherche de colonies de vacances au Portugal et en Europe.</p>
        <p>Des milliers de familles recherchent des expériences d'été internationales (sports, langues, aventure) et nous adorerions présenter vos excellents programmes à notre public.</p>
        <p><strong>Il n'y a aucun frais de création.</strong> Nous connectons simplement les familles européennes directement à vos séjours.</p>
        <p>Seriez-vous disponibles pour un court échange de 10 minutes, ou préférez-vous inscrire votre organisation via le lien ci-dessous ?</p>
      `
    },
    {
      gerarAssunto: (nome) => `Développement international sans effort pour ${nome}`,
      titulo: "Croissance Internationale Facilitée",
      textoCta: "Créer votre compte Partenaire",
      footer: "Vous recevez cet e-mail car votre organisation est une référence. Répondez 'Retirer' pour vous désabonner.",
      gerarMensagem: (nome) => `
        <p>Re-bonjour,</p>
        <p>En rejoignant HelloCamp, <strong>${nome}</strong> accède immédiatement au marché ibérique et européen.</p>
        <p>Nous vous fournissons un tableau de bord B2B pour gérer les dates, les disponibilités et recevoir des paiements sécurisés directement des parents.</p>
        <p>L'inscription prend 5 minutes. Vous pouvez également répondre à cet e-mail pour planifier un appel avec notre équipe de développement commercial.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Pourquoi nous ne cachons pas les contacts de ${nome}`,
      titulo: "Votre Marque Avant Tout",
      textoCta: "Créer Mon Profil",
      footer: "Vous recevez cet e-mail car votre organisation est une référence. Répondez 'Retirer' pour vous désabonner.",
      gerarMensagem: (nome) => `
        <p>L'équipe de <strong>${nome}</strong>,</p>
        <p>D'autres portails cachent vos coordonnées. Sur HelloCamp, <strong>votre téléphone, site et e-mail sont 100% visibles</strong>.</p>
        <p>Reprenez le contrôle. Créez votre profil gratuit aujourd'hui et laissez-nous vous aider à remplir vos dernières places pour la saison à venir.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Dernier e-mail (Réservations européennes pour ${nome})`,
      titulo: "La Saison des Réservations a Commencé",
      textoCta: "Rejoindre HelloCamp",
      footer: "Vous recevez cet e-mail car votre organisation est une référence. Répondez 'Retirer' pour vous désabonner.",
      gerarMensagem: (nome) => `
        <p>Bonjour <strong>${nome}</strong>,</p>
        <p>C'est mon dernier message. La saison des réservations bat son plein et les familles finalisent leurs plans d'été en ce moment même.</p>
        <p>Si vous manquez de temps, <strong>envoyez-nous simplement votre PDF en réponse</strong> et nous ferons tout le paramétrage pour vous gratuitement.</p>
        <p>Nous vous attendons avec impatience !</p>
      `
    }
  ],
  DE: [
    {
      gerarAssunto: (nome) => `Europäische Schüler suchen nach ${nome} Sommercamps`,
      titulo: "Internationale Schüler Anziehen",
      textoCta: "HelloCamp Beitreten",
      footer: "Sie erhalten diese E-Mail, da Ihr Unternehmen eine Referenz ist. Antworten Sie mit 'Entfernen', um sich abzumelden.",
      gerarMensagem: (nome) => `
        <p>Hallo <strong>${nome}</strong> Team,</p>
        <p>ich kontaktiere Sie im Namen von <strong>HelloCamp</strong>, der führenden Buchungsplattform für Feriencamps in Südeuropa.</p>
        <p>Tausende Familien suchen nach internationalen Sommererlebnissen und wir würden Ihre exzellenten Programme gerne unserem Publikum vorstellen.</p>
        <p><strong>Es gibt keine Einrichtungsgebühren.</strong> Wir verbinden europäische Familien einfach direkt mit Ihren Camps.</p>
        <p>Hätten Sie Zeit für ein kurzes 10-minütiges Gespräch oder möchten Sie Ihre Organisation direkt über den untenstehenden Link registrieren?</p>
      `
    },
    {
      gerarAssunto: (nome) => `Müheloses internationales Wachstum für ${nome}`,
      titulo: "Internationale Buchungen Automatisieren",
      textoCta: "Partnerkonto Erstellen",
      footer: "Sie erhalten diese E-Mail, da Ihr Unternehmen eine Referenz ist. Antworten Sie mit 'Entfernen', um sich abzumelden.",
      gerarMensagem: (nome) => `
        <p>Hallo nochmal,</p>
        <p>Durch die Listung von <strong>${nome}</strong> auf HelloCamp erschließen Sie sofort den iberischen und südeuropäischen Markt.</p>
        <p>Wir bieten Ihnen ein B2B-Dashboard, über das Sie sichere Zahlungen direkt von Eltern empfangen können.</p>
        <p>Die Registrierung dauert 5 Minuten. Alternativ können Sie auf diese E-Mail antworten, um ein kurzes Gespräch mit unserem Sales-Team zu vereinbaren.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Warum wir die Kontakte von ${nome} nicht verstecken`,
      titulo: "Ihre Marke im Mittelpunkt",
      textoCta: "Profil Erstellen",
      footer: "Sie erhalten diese E-Mail, da Ihr Unternehmen eine Referenz ist. Antworten Sie mit 'Entfernen', um sich abzumelden.",
      gerarMensagem: (nome) => `
        <p>Team <strong>${nome}</strong>,</p>
        <p>Andere Portale verstecken Ihre Kontaktdaten. Bei HelloCamp sind <strong>Ihr Telefon, Ihre Website und Ihre E-Mail zu 100 % sichtbar</strong>.</p>
        <p>Erstellen Sie noch heute Ihren kostenlosen Eintrag und lassen Sie uns dabei helfen, Ihre restlichen Plätze für die kommende Saison zu füllen.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Letzte E-Mail (Europäische Buchungen für ${nome})`,
      titulo: "Die Buchungssaison hat begonnen",
      textoCta: "HelloCamp Beitreten",
      footer: "Sie erhalten diese E-Mail, da Ihr Unternehmen eine Referenz ist. Antworten Sie mit 'Entfernen', um sich abzumelden.",
      gerarMensagem: (nome) => `
        <p>Hallo <strong>${nome}</strong> Team,</p>
        <p>Das ist meine letzte E-Mail. Die Buchungssaison ist in vollem Gange und die Familien planen genau jetzt ihren Sommer.</p>
        <p><strong>Senden Sie uns einfach Ihr PDF-Programm als Antwort</strong> und wir übernehmen die Einrichtung kostenlos für Sie.</p>
        <p>Wir hoffen, Sie bald bei HelloCamp begrüßen zu dürfen!</p>
      `
    }
  ]
};

// ==========================================
// RENDERIZADOR DO HTML
// ==========================================
function getTemplateHTML(titulo: string, mensagem: string, ctaTexto: string, ctaLink: string, footerText: string) {
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
          ${footerText}
        </p>
      </div>
    </div>
  `;
}

// ==========================================
// HANDLER DA API - CRON JOB LIMIT 250
// ==========================================
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isAuthorized = request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}` || searchParams.get('secret') === process.env.CRON_SECRET;

  if (!isAuthorized) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: leadsProntas, error } = await supabaseAdmin
      .from('leads_externas')
      .select('id, nome_cliente, email_cliente, fase_funil, ultimo_contacto, idioma')
      .lt('fase_funil', 4) 
      .or(`ultimo_contacto.is.null,ultimo_contacto.lt.${seteDiasAtras}`)
      .not('email_cliente', 'is', null)
      .neq('email_cliente', '')
      .order('fase_funil', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(250);

    if (error) throw error;
    if (!leadsProntas || leadsProntas.length === 0) return NextResponse.json({ message: 'Nenhuma lead elegível hoje.' });

    const resultados: any[] = [];
    const BATCH_SIZE = 25; 

    for (let i = 0; i < leadsProntas.length; i += BATCH_SIZE) {
      const batch = leadsProntas.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batch.map(async (lead) => {
          const email = (lead.email_cliente || '').trim();
          const nome = lead.nome_cliente || 'Organizador';
          const faseAtual = Number(lead.fase_funil) || 0;
          
          let lang = (lead.idioma || 'PT').toUpperCase();
          if (!TEMPLATES[lang]) lang = 'EN'; 
          
          const tpl = TEMPLATES[lang][faseAtual];
          if (!tpl) return { status: 'skipped', id: lead.id };

          const linkLang = lang === 'PT' ? 'pt' : lang === 'ES' ? 'es' : lang === 'FR' ? 'fr' : 'en';
          
          // Melhoria na URL da CTA: Leva diretamente para o onboarding de parceiros em vez de apenas "/registo"
          const ctaLinkTracker = `${BASE_URL}/${linkLang}/parceiros?utm_source=cold_email_b2b&utm_medium=email&utm_campaign=fase_${faseAtual}_${lang}`;

          const r = await enviarViaBrevo({
            to: { email, name: nome },
            subject: tpl.gerarAssunto(nome),
            html: getTemplateHTML(tpl.titulo, tpl.gerarMensagem(nome), tpl.textoCta, ctaLinkTracker, tpl.footer),
          });

          if (r.success) {
            return { status: 'sent', id: lead.id, novaFase: faseAtual + 1 };
          }
          return { status: 'failed', id: lead.id };
        })
      );
      
      resultados.push(...batchResults);
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

    return NextResponse.json({ 
      success: true, 
      enviados: sucessos.length,
      tentados: leadsProntas.length 
    });

  } catch (error: any) {
    console.error('❌ Erro no Cron B2B Global:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
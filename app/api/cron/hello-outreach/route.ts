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
const SENDER_NAME = 'Afonso | HelloCamp'; 
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
        <p>Prometo que não vos chateio mais. Neste momento, há milhares de famílias no Google a pesquisar por atividades, e estamos a encaminhá-las para os nossos parceiros.</p>
        <p><strong>Não precisam de preencher nada.</strong> Enviem-nos apenas o PDF das vossas datas em resposta a este e-mail, e configuramos o vosso espaço grátis.</p>
        <p>Esperamos por vocês.</p>
      `
    }
  ],
  EN: [
    {
      gerarAssunto: (nome) => `Quick question about ${nome}'s registrations`,
      titulo: "Fully Booked, Zero Effort",
      textoCta: "Discover HelloCamp",
      footer: "You received this because your organization is highly rated. Reply 'Remove' to unsubscribe.",
      gerarMensagem: (nome) => `
        <p>Hi <strong>${nome}</strong> team,</p>
        <p>We built <strong>HelloCamp</strong> to connect your programs with thousands of families across Europe, <strong>without charging you booking commissions</strong>.</p>
        <p style="background-color: #F8FAFC; padding: 15px; border-left: 4px solid #F3A61C; margin: 25px 0;">
          <strong>Our Free White-Glove Service:</strong> We know you are busy. Just reply to this email with a link or PDF of your current program. Our team will build and optimize your full dashboard profile at no cost and zero effort on your part.
        </p>
        <p>Let us help you reach the Iberian and European markets effortlessly.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Tired of chasing payments and medical forms?`,
      titulo: "Say Goodbye to Admin Chaos",
      textoCta: "See the Automated Dashboard",
      footer: "You received this because your organization is highly rated. Reply 'Remove' to unsubscribe.",
      gerarMensagem: (nome) => `
        <p>Hello again,</p>
        <p>By listing <strong>${nome}</strong> on HelloCamp, you get an automated digital secretary.</p>
        <p>Parents pay securely online, and crucial data (like allergies and medical forms) instantly appears on your dashboard. No more messy spreadsheets.</p>
        <p><strong>Just reply with your brochure</strong> and our onboarding team will set up your account for free.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Why we don't hide ${nome}'s contact info`,
      titulo: "Your Brand Comes First",
      textoCta: "Create Your Profile",
      footer: "You received this because your organization is highly rated. Reply 'Remove' to unsubscribe.",
      gerarMensagem: (nome) => `
        <p>Hi <strong>${nome}</strong>,</p>
        <p>Other directories hide your contact details. At HelloCamp, <strong>your phone, website, and email are 100% visible</strong> to parents.</p>
        <p>Take back control of your bookings. <strong>Reply to this email with your camp dates</strong> and we will build your page in 24 hours, completely free.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Last email (and our white-glove offer for ${nome})`,
      titulo: "Booking Season is Here",
      textoCta: "Join HelloCamp",
      footer: "You received this because your organization is highly rated. Reply 'Remove' to unsubscribe.",
      gerarMensagem: (nome) => `
        <p>Hi <strong>${nome}</strong> team,</p>
        <p>I promise this is my last email. Families across Europe are searching for camps right now, and we want to send them your way.</p>
        <p><strong>No forms to fill out.</strong> Just send us your PDF program in reply to this email, and we will do all the setup for you.</p>
        <p>We hope to welcome you aboard.</p>
      `
    }
  ],
  ES: [
    {
      gerarAssunto: (nome) => `Una pregunta rápida sobre las inscripciones de ${nome}`,
      titulo: "Más Reservas, Cero Esfuerzo",
      textoCta: "Descubrir HelloCamp",
      footer: "Recibe este email porque su entidad es una referencia. Responda 'Eliminar' si no desea más emails.",
      gerarMensagem: (nome) => `
        <p>Hola equipo de <strong>${nome}</strong>,</p>
        <p>Hemos creado <strong>HelloCamp</strong> para conectar su marca con miles de familias, <strong>sin cobrar comisiones por reserva</strong> y manteniendo sus contactos visibles.</p>
        <p style="background-color: #F8FAFC; padding: 15px; border-left: 4px solid #F3A61C; margin: 25px 0;">
          <strong>Nuestro Servicio Llave en Mano:</strong> Sabemos que no tienen tiempo. Solo responda a este correo con el enlace o PDF de su programa. Nuestro equipo creará su perfil optimizado gratis y sin esfuerzo por su parte.
        </p>
        <p>¿Quieren ahorrar decenas de horas en gestión administrativa?</p>
      `
    },
    {
      gerarAssunto: (nome) => `¿Fichas en papel y pagos caóticos?`,
      titulo: "Adiós al Caos Administrativo",
      textoCta: "Ver el Dashboard",
      footer: "Recibe este email porque su entidad es una referencia. Responda 'Eliminar' si no desea más emails.",
      gerarMensagem: (nome) => `
        <p>Hola de nuevo,</p>
        <p>Al unir <strong>${nome}</strong> a HelloCamp, ganan una secretaría digital.</p>
        <p>Los padres pagan automáticamente y las fichas médicas quedan guardadas en su panel. Sin correos perdidos ni hojas de cálculo desordenadas.</p>
        <p>Para activar su espacio hoy, <strong>solo responda a este email con su folleto</strong> y nosotros nos encargamos del resto.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Por qué no ocultamos los contactos de ${nome}`,
      titulo: "El Protagonismo es Suyo",
      textoCta: "Crear Mi Perfil",
      footer: "Recibe este email porque su entidad es una referencia. Responda 'Eliminar' si no desea más emails.",
      gerarMensagem: (nome) => `
        <p>Equipo de <strong>${nome}</strong>,</p>
        <p>Otros portales ocultan sus datos. En HelloCamp, <strong>su teléfono, web y email son 100% visibles</strong>.</p>
        <p>Recuperen el control. <strong>Respondan a este correo con sus programas</strong> y crearemos su perfil gratuitamente en 24 horas.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Último email (y nuestra oferta llave en mano para ${nome})`,
      titulo: "La Temporada ha Comenzado",
      textoCta: "Unirse a HelloCamp",
      footer: "Recibe este email porque su entidad es una referencia. Responda 'Eliminar' si no desea más emails.",
      gerarMensagem: (nome) => `
        <p>Hola equipo de <strong>${nome}</strong>,</p>
        <p>Prometo que es mi último correo. Miles de familias buscan actividades ahora mismo y queremos enviarlas a sus programas.</p>
        <p><strong>No tienen que rellenar nada.</strong> Envíennos el PDF de sus fechas respondiendo a este email y configuraremos su espacio gratis.</p>
        <p>Os esperamos.</p>
      `
    }
  ],
  FR: [
    {
      gerarAssunto: (nome) => `Une question rapide sur les inscriptions de ${nome}`,
      titulo: "Complet, Zéro Effort",
      textoCta: "Découvrir HelloCamp",
      footer: "Vous recevez cet e-mail car votre organisation est une référence. Répondez 'Retirer' pour vous désabonner.",
      gerarMensagem: (nome) => `
        <p>Bonjour l'équipe de <strong>${nome}</strong>,</p>
        <p>Nous avons créé <strong>HelloCamp</strong> pour connecter vos programmes à des milliers de familles, <strong>sans commissions sur les réservations</strong>.</p>
        <p style="background-color: #F8FAFC; padding: 15px; border-left: 4px solid #F3A61C; margin: 25px 0;">
          <strong>Notre Service Clé en Main :</strong> Nous savons que vous manquez de temps. Répondez simplement à cet e-mail avec un lien ou le PDF de votre programme. Notre équipe créera votre profil optimisé gratuitement.
        </p>
        <p>Prêt à gagner des dizaines d'heures de gestion ?</p>
      `
    },
    {
      gerarAssunto: (nome) => `Fiches papier et paiements chaotiques ?`,
      titulo: "Adieu le Chaos Administratif",
      textoCta: "Voir le Dashboard",
      footer: "Vous recevez cet e-mail car votre organisation est une référence. Répondez 'Retirer' pour vous désabonner.",
      gerarMensagem: (nome) => `
        <p>Re-bonjour,</p>
        <p>En rejoignant HelloCamp, <strong>${nome}</strong> gagne un secrétariat numérique.</p>
        <p>Les parents paient en ligne et les fiches médicales sont instantanément sauvegardées sur votre tableau de bord.</p>
        <p><strong>Répondez avec votre brochure</strong> et notre équipe configurera votre compte gratuitement.</p>
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
        <p>Reprenez le contrôle. <strong>Répondez à cet e-mail avec vos programmes</strong> et nous créerons votre profil gratuitement en 24h.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Dernier e-mail (et notre offre clé en main pour ${nome})`,
      titulo: "La Saison des Réservations a Commencé",
      textoCta: "Rejoindre HelloCamp",
      footer: "Vous recevez cet e-mail car votre organisation est une référence. Répondez 'Retirer' pour vous désabonner.",
      gerarMensagem: (nome) => `
        <p>Bonjour <strong>${nome}</strong>,</p>
        <p>C'est mon dernier message. Des milliers de familles cherchent des activités et nous voulons vous les envoyer.</p>
        <p><strong>Aucun formulaire à remplir.</strong> Envoyez-nous simplement votre PDF en réponse et nous ferons tout le paramétrage pour vous.</p>
        <p>Nous vous attendons.</p>
      `
    }
  ],
  DE: [
    {
      gerarAssunto: (nome) => `Eine kurze Frage zu den Anmeldungen von ${nome}`,
      titulo: "Ausgebucht, ohne Aufwand",
      textoCta: "HelloCamp Entdecken",
      footer: "Sie erhalten diese E-Mail, da Ihr Unternehmen eine Referenz ist. Antworten Sie mit 'Entfernen', um sich abzumelden.",
      gerarMensagem: (nome) => `
        <p>Hallo <strong>${nome}</strong> Team,</p>
        <p>Wir haben <strong>HelloCamp</strong> gegründet, um Ihre Programme mit Tausenden von Familien zu verbinden, <strong>ohne Buchungsprovisionen zu verlangen</strong>.</p>
        <p style="background-color: #F8FAFC; padding: 15px; border-left: 4px solid #F3A61C; margin: 25px 0;">
          <strong>Unser kostenloser "Rundum-sorglos-Service":</strong> Wir wissen, dass Sie beschäftigt sind. Antworten Sie einfach auf diese E-Mail mit einem Link oder PDF Ihres Programms. Unser Team erstellt kostenlos Ihr optimiertes Profil.
        </p>
        <p>Möchten Sie Zeit bei der Verwaltung sparen?</p>
      `
    },
    {
      gerarAssunto: (nome) => `Papierkram und chaotische Zahlungen?`,
      titulo: "Schluss mit dem Verwaltungs-Chaos",
      textoCta: "Dashboard Ansehen",
      footer: "Sie erhalten diese E-Mail, da Ihr Unternehmen eine Referenz ist. Antworten Sie mit 'Entfernen', um sich abzumelden.",
      gerarMensagem: (nome) => `
        <p>Hallo nochmal,</p>
        <p>Mit <strong>${nome}</strong> auf HelloCamp erhalten Sie ein digitales Sekretariat.</p>
        <p>Eltern zahlen sicher online und wichtige Daten (wie Allergien) erscheinen sofort in Ihrem Dashboard.</p>
        <p><strong>Antworten Sie einfach mit Ihrer Broschüre</strong> und wir richten Ihr Konto kostenlos ein.</p>
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
        <p>Behalten Sie die Kontrolle. <strong>Antworten Sie auf diese E-Mail mit Ihren Programmen</strong> und wir erstellen Ihr Profil innerhalb von 24 Stunden kostenlos.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Letzte E-Mail (und unser Einrichtungsangebot für ${nome})`,
      titulo: "Die Buchungssaison hat begonnen",
      textoCta: "HelloCamp Beitreten",
      footer: "Sie erhalten diese E-Mail, da Ihr Unternehmen eine Referenz ist. Antworten Sie mit 'Entfernen', um sich abzumelden.",
      gerarMensagem: (nome) => `
        <p>Hallo <strong>${nome}</strong> Team,</p>
        <p>Das ist meine letzte E-Mail. Tausende Familien suchen gerade nach Aktivitäten und wir möchten sie an Sie weiterleiten.</p>
        <p><strong>Sie müssen keine Formulare ausfüllen.</strong> Senden Sie uns einfach Ihr PDF-Programm als Antwort auf diese E-Mail und wir übernehmen die Einrichtung.</p>
        <p>Wir freuen uns auf Sie.</p>
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

    // ESCALAR PARA 250 DISPAROS DIÁRIOS
    const { data: leadsProntas, error } = await supabaseAdmin
      .from('leads_externas')
      .select('id, nome_cliente, email_cliente, fase_funil, ultimo_contacto, idioma')
      .lt('fase_funil', 4) // Todas as línguas têm 4 fases
      .or(`ultimo_contacto.is.null,ultimo_contacto.lt.${seteDiasAtras}`)
      .not('email_cliente', 'is', null)
      .neq('email_cliente', '')
      .order('fase_funil', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(250);

    if (error) throw error;
    if (!leadsProntas || leadsProntas.length === 0) return NextResponse.json({ message: 'Nenhuma lead elegível hoje.' });

    const resultados: any[] = [];
    const BATCH_SIZE = 25; // Processar de 25 em 25 para proteger o limite da API do Brevo

    for (let i = 0; i < leadsProntas.length; i += BATCH_SIZE) {
      const batch = leadsProntas.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batch.map(async (lead) => {
          const email = (lead.email_cliente || '').trim();
          const nome = lead.nome_cliente || 'Organizador';
          const faseAtual = Number(lead.fase_funil) || 0;
          
          // Fallback inteligente de idioma
          let lang = (lead.idioma || 'PT').toUpperCase();
          if (!TEMPLATES[lang]) lang = 'EN'; // Se não tiver a língua, envia em Inglês (internacional)
          
          const tpl = TEMPLATES[lang][faseAtual];
          if (!tpl) return { status: 'skipped', id: lead.id }; // Proteção caso a fase falhe

          // Link localizado dinâmico (ex: /pt/registo ou /en/registo)
          const linkLang = lang === 'PT' ? 'pt' : lang === 'ES' ? 'es' : lang === 'FR' ? 'fr' : 'en';
          const ctaLinkTracker = `${BASE_URL}/${linkLang}/registo?utm_source=cold_email_b2b&utm_medium=email&utm_campaign=fase_${faseAtual}_${lang}`;

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

    // Atualização em Bulk no Supabase (muito mais rápido do que um a um)
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
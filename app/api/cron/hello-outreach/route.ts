import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = 'info@hellocamp.pt';
const SENDER_NAME = 'Rodrigo | HelloCamp'; 
const BASE_URL = 'https://www.hellocamp.pt';

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

type Template = {
  gerarAssunto: (nome: string) => string;
  titulo: string;
  textoCta: string;
  gerarMensagem: (nome: string) => string;
  gerarFooter: (unsubscribeUrl: string) => string;
};

const TEMPLATES: Record<string, Template[]> = {
  PT: [
    {
      gerarAssunto: (nome) => `Convidamos a ${nome} a integrar o novo motor de busca de atividades juvenis`,
      titulo: "Chegue a Milhares de Famílias o Ano Inteiro",
      textoCta: "Ver como funciona a HelloCamp",
      gerarFooter: (url) => `Recebeu este e-mail porque a sua entidade é uma referência em Portugal. <a href="${url}" style="color: #64748B; text-decoration: underline;">Clique aqui para remover o seu e-mail</a> da nossa lista.`,
      gerarMensagem: (nome) => `
        <p>Olá equipa da <strong>${nome}</strong>,</p>
        <p>O meu nome é Rodrigo e faço parte da equipa da <strong>HelloCamp</strong>, um novo motor de busca internacional dedicado a campos de férias, aulas de desporto (surf, skate, etc.) e atividades extracurriculares para jovens.</p>
        <p>Notámos que a vossa organização tem excelentes programas que encaixam perfeitamente naquilo que as nossas famílias procuram para o tempo livre dos filhos (tanto no verão como no resto do ano), e gostaríamos muito de vos convidar a fazer parte do nosso diretório.</p>
        <p><strong>Como funciona o nosso modelo de parceria?</strong></p>
        <ul>
          <li><strong>Visibilidade 100% Gratuita:</strong> Estar presente no nosso motor de busca não tem qualquer custo fixo. O vosso perfil exibirá as vossas fotografias, descrições, website oficial e contactos, permitindo que as famílias vos encontrem livremente.</li>
          <li><strong>Reservas Diretas (Opcional):</strong> Caso pretendam automatizar as vossas inscrições, podem ativar a opção de reservas diretas através da HelloCamp. Neste modelo, fornecemos uma secretaria digital completa e cobramos uma comissão <strong>significativamente mais baixa que a média do mercado</strong>, aplicada apenas às reservas confirmadas.</li>
        </ul>
        <p style="background-color: #F8FAFC; padding: 15px; border-left: 4px solid #F3A61C; margin: 25px 0;">
          <strong>O nosso serviço chave-na-mão:</strong> Se pretenderem aderir, basta responderem a este e-mail com o link do vosso website ou o PDF da vossa brochura de atividades. A nossa equipa encarrega-se de construir o vosso perfil completo em 24 horas, sem qualquer esforço da vossa parte.
        </p>
        <p>Gostariam de avançar com a criação gratuita do vosso perfil?</p>
      `
    },
    {
      gerarAssunto: (nome) => `A tecnologia que vai poupar dezenas de horas à ${nome}`,
      titulo: "Diga Adeus ao Caos Administrativo",
      textoCta: "Descobrir o Painel de Parceiros",
      gerarFooter: (url) => `Recebeu este e-mail porque a sua entidade é uma referência em Portugal. <a href="${url}" style="color: #64748B; text-decoration: underline;">Clique aqui para remover o seu e-mail</a> da nossa lista.`,
      gerarMensagem: (nome) => `
        <p>Olá novamente,</p>
        <p>No meu e-mail anterior falei-vos sobre a integração da <strong>${nome}</strong> na nossa plataforma, mas hoje gostava de vos mostrar o que acontece "nos bastidores" quando ativam as reservas diretas na HelloCamp.</p>
        <p>Gerir dezenas de e-mails, pedir comprovativos de transferência e compilar fichas de alergias em folhas de Excel é exaustivo. Foi por isso que construímos um <strong>Dashboard Exclusivo para Organizadores</strong>.</p>
        <p>Ao permitirem reservas através da nossa plataforma (com a nossa estrutura de comissões muito competitiva):</p>
        <ul>
          <li>Os pais pagam diretamente por Multibanco, MBWay ou Cartão, e o valor é faturado diretamente na vossa conta (via Stripe).</li>
          <li>Os formulários de saúde, alergias e contactos de emergência ficam logo centralizados e ligados a cada participante.</li>
          <li>As vagas dos vossos desportos ou campos são atualizadas em tempo real.</li>
        </ul>
        <p>Se preferirem apenas a listagem gratuita de visibilidade, essa opção continuará sempre à vossa disposição.</p>
        <p>Podem criar o vosso espaço em menos de 5 minutos através do link abaixo, ou responder a este e-mail para agendarmos uma breve chamada.</p>
      `
    },
    {
      gerarAssunto: (nome) => `O protagonismo da ${nome} na nossa plataforma`,
      titulo: "Transparência e Controlo Total",
      textoCta: "Criar o meu Perfil Gratuitamente",
      gerarFooter: (url) => `Recebeu este e-mail porque a sua entidade é uma referência em Portugal. <a href="${url}" style="color: #64748B; text-decoration: underline;">Clique aqui para remover o seu e-mail</a> da nossa lista.`,
      gerarMensagem: (nome) => `
        <p>Cara equipa da <strong>${nome}</strong>,</p>
        <p>Muitos portais no mercado optam por esconder o website ou o telefone dos organizadores, obrigando as famílias a passar por intermediários. Na HelloCamp, não acreditamos nessa abordagem.</p>
        <p>Ao figurarem na nossa plataforma, <strong>a vossa identidade e os vossos contactos estão sempre à vista</strong>. Se os pais preferirem contactar-vos diretamente para tirar dúvidas sobre uma aula ou campo de férias, têm total liberdade para o fazer.</p>
        <p>Como referi anteriormente, a nossa taxa de comissão só é aplicada se a família optar por fechar a inscrição diretamente pelo nosso sistema automatizado.</p>
        <p>Recuperem o controlo da vossa presença online. Basta responderem a este e-mail a confirmar o vosso interesse e nós tratamos do resto.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Última oportunidade para a ${nome} garantir presença`,
      titulo: "A Época de Inscrições Começou",
      textoCta: "Garantir o meu Lugar na HelloCamp",
      gerarFooter: (url) => `Recebeu este e-mail porque a sua entidade é uma referência em Portugal. <a href="${url}" style="color: #64748B; text-decoration: underline;">Clique aqui para remover o seu e-mail</a> da nossa lista.`,
      gerarMensagem: (nome) => `
        <p>Olá equipa da <strong>${nome}</strong>,</p>
        <p>Prometo que este é o meu último e-mail. Neste exato momento, a nossa plataforma está a registar pesquisas diárias de famílias que procuram atividades extracurriculares e opções de férias para os filhos.</p>
        <p>Não queremos que fiquem de fora desta montra. Volto a reforçar que ter a vossa entidade listada para gerar visibilidade é um processo gratuito.</p>
        <p><strong>Não precisam de preencher formulários longos.</strong> Enviem-nos apenas as vossas brochuras ou o link do vosso site, e nós garantimos que ficam online ainda esta semana.</p>
        <p>Esperamos contar com vocês.</p>
      `
    }
  ],
  EN: [
    {
      gerarAssunto: (nome) => `Invitation to feature ${nome} to European families`,
      titulo: "Reach Thousands of European Students",
      textoCta: "Discover HelloCamp",
      gerarFooter: (url) => `You received this email because your organization is highly rated. <a href="${url}" style="color: #64748B; text-decoration: underline;">Click here to unsubscribe</a>.`,
      gerarMensagem: (nome) => `
        <p>Dear <strong>${nome}</strong> team,</p>
        <p>My name is Rodrigo and I'm reaching out from <strong>HelloCamp</strong>, a newly launched international search engine and booking platform for summer camps, sports clinics (surf, tennis, etc.), and extracurricular youth activities.</p>
        <p>Every year, thousands of Iberian families use our portal to plan their children's activities. We have noticed a huge surge in demand for international programs, and your offerings at <strong>${nome}</strong> perfectly match what our audience is looking for.</p>
        <p><strong>How does our partnership work?</strong></p>
        <ul>
          <li><strong>Free Visibility Listing:</strong> Being listed in our directory is completely free. We will showcase your photos, descriptions, and official contact details so European parents can find you effortlessly.</li>
          <li><strong>Direct Bookings (Optional):</strong> If you wish to streamline your enrollments, you can activate direct bookings through HelloCamp. We provide a full digital dashboard for this service and charge a <strong>highly competitive commission, significantly lower than the industry average</strong>, per confirmed booking.</li>
        </ul>
        <p style="background-color: #F8FAFC; padding: 15px; border-left: 4px solid #F3A61C; margin: 25px 0;">
          <strong>Our white-glove onboarding:</strong> To get started, simply reply to this email with a link to your website or a PDF brochure. Our team will build and optimize your profile within 24 hours at no cost.
        </p>
        <p>Would you be open to having your organization featured on our platform?</p>
      `
    },
    {
      gerarAssunto: (nome) => `Streamline your international bookings for ${nome}`,
      titulo: "International Growth, Zero Hassle",
      textoCta: "Create your Partner Account",
      gerarFooter: (url) => `You received this email because your organization is highly rated. <a href="${url}" style="color: #64748B; text-decoration: underline;">Click here to unsubscribe</a>.`,
      gerarMensagem: (nome) => `
        <p>Hello again,</p>
        <p>In my previous email, I mentioned featuring <strong>${nome}</strong> on our platform. Today, I'd like to show you the operational side of HelloCamp if you choose to activate direct bookings.</p>
        <p>Expanding to international markets often involves chasing wire transfers and managing medical forms in foreign languages. That is why we built our <strong>Partner Dashboard</strong>.</p>
        <p>By enabling direct bookings (with our highly competitive low-commission structure):</p>
        <ul>
          <li>Parents pay securely online, and funds are automatically transferred to your connected Stripe account.</li>
          <li>Medical records, dietary restrictions, and emergency contacts are standardized and accessible with one click.</li>
          <li>Your program availability is updated in real-time.</li>
        </ul>
        <p>Registration takes 5 minutes. Feel free to set up your account via the link below, or reply to this email to schedule a quick introduction call.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Why we put ${nome}'s brand front and center`,
      titulo: "Your Brand is the Protagonist",
      textoCta: "Join HelloCamp for Free",
      gerarFooter: (url) => `You received this email because your organization is highly rated. <a href="${url}" style="color: #64748B; text-decoration: underline;">Click here to unsubscribe</a>.`,
      gerarMensagem: (nome) => `
        <p>Hi <strong>${nome}</strong> team,</p>
        <p>Unlike other directories that hide your contact details to force clients through their funnels, HelloCamp believes in transparent partnerships.</p>
        <p>On our platform, <strong>your website, email, and brand logo are 100% visible</strong>. If a parent prefers to contact your admissions office directly with questions, they are free to do so.</p>
        <p>As mentioned, our commission fee is only applied if the family decides to complete their booking using our integrated payment system.</p>
        <p>Regain control of your international visibility. Create your free listing today or simply reply to this email to let our onboarding team do the work for you.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Last email (European booking season for ${nome})`,
      titulo: "The Enrollment Season has Begun",
      textoCta: "Start Receiving European Leads",
      gerarFooter: (url) => `You received this email because your organization is highly rated. <a href="${url}" style="color: #64748B; text-decoration: underline;">Click here to unsubscribe</a>.`,
      gerarMensagem: (nome) => `
        <p>Hi <strong>${nome}</strong> team,</p>
        <p>I promise this is my last email. Families are currently actively finalizing their children's sports clinics and holiday plans.</p>
        <p>We would hate for you to miss out on this high-value demographic. Again, listing your programs for visibility is entirely free.</p>
        <p>If you don't have time to create an account, <strong>just reply to this email with your program dates and prices</strong>, and our team will set it up for you.</p>
        <p>We hope to welcome you aboard HelloCamp soon!</p>
      `
    }
  ],
  ES: [
    {
      gerarAssunto: (nome) => `Familias portuguesas buscando actividades en ${nome}`,
      titulo: "Atraiga Alumnos de Toda Europa",
      textoCta: "Unirse a HelloCamp",
      gerarFooter: (url) => `Recibe este email porque su entidad es una referencia. <a href="${url}" style="color: #64748B; text-decoration: underline;">Haga clic aquí para darse de baja</a>.`,
      gerarMensagem: (nome) => `
        <p>Hola equipo de <strong>${nome}</strong>,</p>
        <p>Mi nombre es Rodrigo y les escribo desde <strong>HelloCamp</strong>, un nuevo buscador internacional y plataforma de reservas dedicado a campamentos, escuelas de deporte (surf, skate, etc.) y actividades juveniles.</p>
        <p>España es, por excelencia, el destino internacional más solicitado por nuestras familias. Hemos evaluado sus programas y consideramos que encajan a la perfección con lo que nuestro público demanda durante todo el año.</p>
        <p><strong>¿Cómo funciona nuestra colaboración?</strong></p>
        <ul>
          <li><strong>Visibilidad 100% Gratuita:</strong> Estar en nuestro buscador no tiene coste. Mostraremos sus fotos, descripciones y datos de contacto oficiales para que las familias les encuentren sin barreras.</li>
          <li><strong>Reservas Directas (Opcional):</strong> Si desean automatizar las inscripciones internacionales, pueden activar las reservas directas. En este caso, proporcionamos un panel de control completo y cobramos una comisión <strong>muy competitiva y significativamente más baja que la media del sector</strong>, solo por cada reserva confirmada.</li>
        </ul>
        <p style="background-color: #F8FAFC; padding: 15px; border-left: 4px solid #F3A61C; margin: 25px 0;">
          <strong>Servicio llave en mano:</strong> Simplemente respondan a este email con un enlace a su web o su folleto en PDF, y nuestro equipo creará su perfil en 24 horas sin esfuerzo alguno por su parte.
        </p>
        <p>¿Les gustaría que incluyamos su organización de forma gratuita?</p>
      `
    },
    {
      gerarAssunto: (nome) => `Gestión internacional sin esfuerzo para ${nome}`,
      titulo: "Crecimiento Internacional, Cero Estrés",
      textoCta: "Crear Cuenta de Organizador",
      gerarFooter: (url) => `Recibe este email porque su entidad es una referencia. <a href="${url}" style="color: #64748B; text-decoration: underline;">Haga clic aquí para darse de baja</a>.`,
      gerarMensagem: (nome) => `
        <p>Hola de nuevo,</p>
        <p>Captar y gestionar alumnos internacionales a menudo implica cruce de correos, traducciones de fichas médicas y transferencias bancarias lentas. Por eso hemos creado el <strong>Dashboard para Partners de HelloCamp</strong>.</p>
        <p>Al activar las reservas directas con nosotros (sujetas a nuestra comisión reducida):</p>
        <ul>
          <li>Los padres pagan de forma segura online, y los fondos van directamente a su cuenta bancaria.</li>
          <li>Las fichas médicas y alergias quedan centralizadas y listas para exportar.</li>
          <li>El control de plazas se actualiza en tiempo real.</li>
        </ul>
        <p>Si prefieren mantener únicamente el escaparate de visibilidad gratuita, esa opción siempre estará disponible.</p>
        <p>Pueden registrarse en 5 minutos en el siguiente enlace, o responder a este email si prefieren que organicemos una breve llamada.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Por qué damos visibilidad total a la marca de ${nome}`,
      titulo: "Su Marca es la Protagonista",
      textoCta: "Anunciar mi Organización",
      gerarFooter: (url) => `Recibe este email porque su entidad es una referencia. <a href="${url}" style="color: #64748B; text-decoration: underline;">Haga clic aquí para darse de baja</a>.`,
      gerarMensagem: (nome) => `
        <p>Equipo de <strong>${nome}</strong>,</p>
        <p>A diferencia de otros directorios que ocultan los datos de contacto para forzar al cliente a pasar por ellos, en HelloCamp creemos en las alianzas transparentes.</p>
        <p>En nuestra plataforma, <strong>su sitio web, email y número de teléfono son totalmente visibles</strong>. Si una familia prefiere llamarles directamente para aclarar dudas, tiene total libertad para hacerlo.</p>
        <p>Como mencioné antes, nuestra comisión por reserva solo se aplica cuando la familia decide completar la inscripción a través de nuestro sistema automatizado.</p>
        <p>Recuperen el control de su exposición internacional. Respondan a este correo con sus programas y nosotros nos encargaremos del resto.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Último aviso: Familias buscando actividades en ${nome}`,
      titulo: "La Temporada de Inscripciones está Activa",
      textoCta: "Garantizar mi espacio",
      gerarFooter: (url) => `Recibe este email porque su entidad es una referencia. <a href="${url}" style="color: #64748B; text-decoration: underline;">Haga clic aquí para darse de baja</a>.`,
      gerarMensagem: (nome) => `
        <p>Hola equipo de <strong>${nome}</strong>,</p>
        <p>Les prometo que este es mi último correo. Las familias europeas están buscando activamente programas deportivos y campamentos en este preciso momento.</p>
        <p>Sería una pena que se perdieran este mercado. Recuerden que estar listados para generar visibilidad es un proceso totalmente gratuito.</p>
        <p>Si no tienen tiempo, <strong>basta con que nos envíen sus tarifas y fechas por aquí</strong>, y nosotros nos encargaremos de construir su perfil hoy mismo.</p>
        <p>Esperamos colaborar con ustedes muy pronto.</p>
      `
    }
  ],
  FR: [
    {
      gerarAssunto: (nome) => `Invitation à présenter ${nome} aux familles européennes`,
      titulo: "Touchez des milliers de familles",
      textoCta: "Découvrir HelloCamp",
      gerarFooter: (url) => `Vous recevez cet e-mail car votre organisation est une référence. <a href="${url}" style="color: #64748B; text-decoration: underline;">Cliquez ici pour vous désabonner</a>.`,
      gerarMensagem: (nome) => `
        <p>Bonjour l'équipe de <strong>${nome}</strong>,</p>
        <p>Je m'appelle Rodrigo et je vous contacte de la part de <strong>HelloCamp</strong>, une nouvelle plateforme internationale de réservation dédiée aux colonies de vacances, stages sportifs (surf, etc.) et activités extrascolaires pour les jeunes.</p>
        <p>Chaque année, des milliers de familles utilisent notre portail. Nous avons remarqué que vos programmes correspondent parfaitement à ce que notre public recherche à l'international, tout au long de l'année.</p>
        <p><strong>Comment fonctionne notre partenariat ?</strong></p>
        <ul>
          <li><strong>Visibilité 100% Gratuite :</strong> Être présent dans notre annuaire n'a aucun coût fixe. Votre profil affichera vos photos, descriptions et contacts officiels pour que les parents puissent vous trouver facilement.</li>
          <li><strong>Réservations Directes (Optionnel) :</strong> Si vous souhaitez automatiser vos inscriptions, vous pouvez activer les réservations via HelloCamp. Nous facturons une commission <strong>très compétitive et nettement inférieure à la moyenne du marché</strong> par réservation confirmée.</li>
        </ul>
        <p style="background-color: #F8FAFC; padding: 15px; border-left: 4px solid #F3A61C; margin: 25px 0;">
          <strong>Notre service clé en main :</strong> Répondez simplement à cet e-mail avec un lien vers votre site ou une brochure PDF. Notre équipe créera et optimisera votre profil en 24 heures sans aucun effort de votre part.
        </p>
        <p>Seriez-vous ouverts à l'idée d'ajouter votre organisation gratuitement ?</p>
      `
    },
    {
      gerarAssunto: (nome) => `Simplifiez vos réservations internationales pour ${nome}`,
      titulo: "Croissance Internationale Sans Effort",
      textoCta: "Créer votre compte Partenaire",
      gerarFooter: (url) => `Vous recevez cet e-mail car votre organisation est une référence. <a href="${url}" style="color: #64748B; text-decoration: underline;">Cliquez ici pour vous désabonner</a>.`,
      gerarMensagem: (nome) => `
        <p>Re-bonjour,</p>
        <p>Accueillir des étudiants internationaux implique souvent des fiches médicales complexes. C'est pourquoi nous avons développé le <strong>Tableau de Bord HelloCamp</strong>.</p>
        <p>En activant les réservations directes (avec notre commission très réduite) :</p>
        <ul>
          <li>Les parents paient en ligne de manière sécurisée et les fonds vont sur votre compte.</li>
          <li>Les dossiers médicaux et les allergies sont centralisés.</li>
          <li>Vos disponibilités sont mises à jour en temps réel.</li>
        </ul>
        <p>L'inscription prend 5 minutes via le lien ci-dessous.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Pourquoi nous mettons en avant la marque de ${nome}`,
      titulo: "Votre Marque est la Protagoniste",
      textoCta: "Créer Mon Profil Gratuit",
      gerarFooter: (url) => `Vous recevez cet e-mail car votre organisation est une référence. <a href="${url}" style="color: #64748B; text-decoration: underline;">Cliquez ici pour vous désabonner</a>.`,
      gerarMensagem: (nome) => `
        <p>L'équipe de <strong>${nome}</strong>,</p>
        <p>Contrairement à d'autres plateformes qui cachent vos coordonnées, sur HelloCamp, <strong>votre site web et votre téléphone sont 100% visibles</strong>.</p>
        <p>Notre commission ne s'applique que si la famille décide de réserver directement via notre système de paiement.</p>
        <p>Reprenez le contrôle de votre visibilité internationale. Répondez à cet e-mail et nous ferons le travail pour vous.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Dernier message : Les réservations européennes pour ${nome}`,
      titulo: "La Saison Bat son Plein",
      textoCta: "Rejoindre HelloCamp",
      gerarFooter: (url) => `Vous recevez cet e-mail car votre organisation est une référence. <a href="${url}" style="color: #64748B; text-decoration: underline;">Cliquez ici pour vous désabonner</a>.`,
      gerarMensagem: (nome) => `
        <p>Bonjour <strong>${nome}</strong>,</p>
        <p>Je vous promets que c'est mon dernier e-mail. Les familles cherchent activement des programmes sportifs et séjours en ce moment même.</p>
        <p>Nous ne voulons pas que vous manquiez cette opportunité. Je vous rappelle que l'ajout à notre annuaire est totalement gratuit.</p>
        <p><strong>Envoyez-nous simplement vos dates et tarifs en réponse</strong>, et nous paramétrerons votre profil aujourd'hui.</p>
        <p>Nous espérons collaborer avec vous !</p>
      `
    }
  ],
  DE: [
    {
      gerarAssunto: (nome) => `Einladung zur Präsentation von ${nome} für europäische Familien`,
      titulo: "Erreichen Sie tausende europäische Familien",
      textoCta: "HelloCamp Entdecken",
      gerarFooter: (url) => `Sie erhalten diese E-Mail, da Ihr Unternehmen eine Referenz ist. <a href="${url}" style="color: #64748B; text-decoration: underline;">Klicken Sie hier, um sich abzumelden</a>.`,
      gerarMensagem: (nome) => `
        <p>Hallo <strong>${nome}</strong> Team,</p>
        <p>Mein Name ist Rodrigo und ich melde mich im Namen von <strong>HelloCamp</strong>, einer neuen internationalen Such- und Buchungsplattform für Feriencamps, Sportkurse und Freizeitaktivitäten für Jugendliche.</p>
        <p>Tausende Familien nutzen unser Portal. Ihre Programme passen perfekt zu dem, was unser Publikum sucht.</p>
        <p><strong>Wie funktioniert unsere Partnerschaft?</strong></p>
        <ul>
          <li><strong>100% Kostenlose Sichtbarkeit:</strong> Der Eintrag in unser Verzeichnis ist komplett kostenlos. Wir zeigen Ihre Fotos, Beschreibungen und Kontaktdaten.</li>
          <li><strong>Direktbuchungen (Optional):</strong> Wenn Sie Ihre Anmeldungen automatisieren möchten, können Sie die direkte Buchung über HelloCamp aktivieren. Wir berechnen eine äußerst <strong>wettbewerbsfähige Provision, die deutlich unter dem Branchenstandard liegt</strong>, nur bei bestätigten Buchungen.</li>
        </ul>
        <p style="background-color: #F8FAFC; padding: 15px; border-left: 4px solid #F3A61C; margin: 25px 0;">
          <strong>Unser Full-Service:</strong> Antworten Sie einfach auf diese E-Mail mit einem Link zu Ihrer Website. Unser Team erstellt und optimiert Ihr Profil innerhalb von 24 Stunden kostenlos für Sie.
        </p>
        <p>Hätten Sie Interesse an einer kostenlosen Platzierung?</p>
      `
    },
    {
      gerarAssunto: (nome) => `Vereinfachen Sie Ihre internationalen Buchungen für ${nome}`,
      titulo: "Müheloses Internationales Wachstum",
      textoCta: "Partnerkonto Erstellen",
      gerarFooter: (url) => `Sie erhalten diese E-Mail, da Ihr Unternehmen eine Referenz ist. <a href="${url}" style="color: #64748B; text-decoration: underline;">Klicken Sie hier, um sich abzumelden</a>.`,
      gerarMensagem: (nome) => `
        <p>Hallo nochmal,</p>
        <p>Durch die Aktivierung von Direktbuchungen (mit unserer wettbewerbsfähigen Provision):</p>
        <ul>
          <li>Eltern zahlen sicher online.</li>
          <li>Medizinische Daten und Allergien werden zentralisiert erfasst.</li>
          <li>Ihre Verfügbarkeiten werden in Echtzeit aktualisiert.</li>
        </ul>
        <p>Die Registrierung dauert nur 5 Minuten.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Warum wir die Marke von ${nome} in den Mittelpunkt stellen`,
      titulo: "Ihre Marke ist der Protagonist",
      textoCta: "Kostenloses Profil Erstellen",
      gerarFooter: (url) => `Sie erhalten diese E-Mail, da Ihr Unternehmen eine Referenz ist. <a href="${url}" style="color: #64748B; text-decoration: underline;">Klicken Sie hier, um sich abzumelden</a>.`,
      gerarMensagem: (nome) => `
        <p>Team <strong>${nome}</strong>,</p>
        <p>Im Gegensatz zu anderen Portalen, die Kontaktdaten verstecken, ist bei HelloCamp <strong>Ihre Website und E-Mail zu 100% sichtbar</strong>.</p>
        <p>Wenn Eltern Sie lieber direkt kontaktieren möchten, können sie das tun. Unsere Provision fällt nur an, wenn die Familie direkt über unser integriertes Zahlungssystem bucht.</p>
        <p>Erstellen Sie noch heute Ihren kostenlosen Eintrag.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Letzte E-Mail (Buchungssaison für ${nome})`,
      titulo: "Die Buchungssaison hat Begonnen",
      textoCta: "HelloCamp Beitreten",
      gerarFooter: (url) => `Sie erhalten diese E-Mail, da Ihr Unternehmen eine Referenz ist. <a href="${url}" style="color: #64748B; text-decoration: underline;">Klicken Sie hier, um sich abzumelden</a>.`,
      gerarMensagem: (nome) => `
        <p>Hallo <strong>${nome}</strong> Team,</p>
        <p>Dies ist meine letzte E-Mail. Die Buchungssaison ist in vollem Gange.</p>
        <p>Wir möchten nicht, dass Sie diese Zielgruppe verpassen. Denken Sie daran, dass der bloße Eintrag für mehr Sichtbarkeit völlig kostenlos ist.</p>
        <p><strong>Antworten Sie einfach mit Ihren Preisen und Terminen</strong>, und wir kümmern uns noch heute um Ihr Profil.</p>
        <p>Wir hoffen, Sie bald bei HelloCamp begrüßen zu dürfen!</p>
      `
    }
  ]
};

function getTemplateHTML(titulo: string, mensagem: string, ctaTexto: string, ctaLink: string, footerText: string) {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E8EDF2; border-radius: 8px; overflow: hidden;">
      <div style="height: 6px; width: 100%; display: flex;">
        <div style="background-color: #218F4C; height: 100%; width: 33.3%;"></div>
        <div style="background-color: #F3A61C; height: 100%; width: 33.4%;"></div>
        <div style="background-color: #0E3A68; height: 100%; width: 33.3%;"></div>
      </div>
      <div style="padding: 35px;">
        <div style="margin-bottom: 30px;">
          <h1 style="color: #0E3A68; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Hello<span style="color: #F3A61C;">Camp</span></h1>
        </div>
        <h2 style="color: #0E3A68; font-size: 21px; margin-top: 0; margin-bottom: 25px; font-weight: 700; line-height: 1.4;">
          ${titulo}
        </h2>
        <div style="color: #333333; font-size: 15px; line-height: 1.6;">
          ${mensagem}
        </div>
        <div style="margin-top: 40px; margin-bottom: 10px;">
          <a href="${ctaLink}" style="display: inline-block; background-color: #0E3A68; color: #ffffff; padding: 15px 30px; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${ctaTexto}
          </a>
        </div>
      </div>
      <div style="background-color: #F8FAFC; padding: 25px 35px; border-top: 1px solid #E8EDF2;">
        <p style="color: #64748B; font-size: 11px; line-height: 1.5; margin: 0;">
          ${footerText}
        </p>
      </div>
    </div>
  `;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isAuthorized = request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}` || searchParams.get('secret') === process.env.CRON_SECRET;

  if (!isAuthorized) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: leadsProntas, error } = await supabaseAdmin
      .from('leads_externas')
      .select('id, nome_cliente, email_cliente, fase_funil, ultimo_contacto, idioma')
      .is('unsubscribed', false)
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
          const ctaLinkTracker = `${BASE_URL}/${linkLang}/parceiros?utm_source=cold_email_b2b&utm_medium=email&utm_campaign=fase_${faseAtual}_${lang}`;
          const unsubscribeUrl = `${BASE_URL}/${linkLang}/unsubscribe?id=${lead.id}`;

          const r = await enviarViaBrevo({
            to: { email, name: nome },
            subject: tpl.gerarAssunto(nome),
            html: getTemplateHTML(tpl.titulo, tpl.gerarMensagem(nome), tpl.textoCta, ctaLinkTracker, tpl.gerarFooter(unsubscribeUrl)),
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
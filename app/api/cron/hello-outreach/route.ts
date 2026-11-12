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
const CALENDLY_URL = 'https://calendly.com/hellocamp-info/new-meeting';

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
        replyTo: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [params.to],
        subject: params.subject,
        htmlContent: params.html,
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
  gerarMensagem: (nome: string, parceiroUrl: string) => string;
  gerarAssinatura: (parceiroUrl: string) => string;
  gerarFooter: (unsubscribeUrl: string) => string;
};

const TEMPLATES: Record<string, Template[]> = {
  PT: [
    {
      gerarAssunto: (nome) => `Parceria com a ${nome} / HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Um abraço,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>Equipa HelloCamp<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Se não tiver interesse em receber mais mensagens nossas, pode <a href="${url}" style="color: #94A3B8; text-decoration: underline;">pedir para não ser contactado aqui</a>.`,
      gerarMensagem: (nome) => `
        <p>Olá equipa da <strong>${nome}</strong>, tudo bem?</p>
        <p>Sou o Rodrigo da <strong>HelloCamp</strong>. Estou a enviar este e-mail porque vi que organizam atividades e campos de férias para crianças e jovens, e queria dar-vos a conhecer a nossa plataforma.</p>
        <p>A HelloCamp é uma nova plataforma onde as famílias procuram e reservam campos de férias, colónias desportivas e atividades juvenis em Portugal e na Europa. Gostámos muito do vosso trabalho e achamos que faz todo o sentido a ${nome} estar connosco.</p>
        <p>O nosso modelo é muito simples e transparente: celebramos um acordo de parceria convosco para promover os vossos programas na plataforma e funcionamos exclusivamente com base numa comissão sobre as reservas que forem efetivamente realizadas através de nós.</p>
        <p>Querem marcar uma breve reunião online connosco (10-15 minutos) para saberem mais detalhes e verem a plataforma por dentro? Se sim, basta escolherem a melhor hora no nosso calendário:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Caso não precisem de reunião e queiram logo que nós criemos o vosso perfil e insiramos a informação dos vossos campos, basta responderem a este e-mail com os dados ou brochuras das atividades e nós tratamos de deixar tudo pronto para avançarmos com a parceria.</p>
        <p>Digam-me o que vos parece!</p>
      `
    },
    {
      gerarAssunto: (nome) => `Re: Parceria com a ${nome} / HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Um abraço,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>Equipa HelloCamp<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Se não tiver interesse em receber mais mensagens nossas, pode <a href="${url}" style="color: #94A3B8; text-decoration: underline;">pedir para não ser contactado aqui</a>.`,
      gerarMensagem: (nome) => `
        <p>Olá novamente equipa da <strong>${nome}</strong>,</p>
        <p>Calculo que estejam numa fase ocupada a organizar as vossas atividades, por isso volto apenas a deixar uma nota rápida no seguimento do meu e-mail anterior.</p>
        <p>Para além de levarmos novas famílias aos vossos programas, construímos a HelloCamp para facilitar a gestão diária dos nossos parceiros: sempre que recebem uma reserva pela plataforma, as fichas de saúde, alergias e contactos de emergência dos participantes ficam logo organizados no vosso painel, e só pagam comissão pelas inscrições realmente concretizadas.</p>
        <p>Se quiserem ver a plataforma por dentro e conversar sobre como funcionaria a nossa parceria, podem agendar diretamente aqui:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Em alternativa, se preferirem avançar já sem reunião, basta responderem a este e-mail com as informações dos vossos campos (ou indicarem se podemos recolher do vosso site) e nós preparamos o vosso perfil e o contrato de parceria.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Uma questão rápida sobre os programas da ${nome}`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Um abraço,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>Equipa HelloCamp<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Se não tiver interesse em receber mais mensagens nossas, pode <a href="${url}" style="color: #94A3B8; text-decoration: underline;">pedir para não ser contactado aqui</a>.`,
      gerarMensagem: (nome) => `
        <p>Olá equipa da <strong>${nome}</strong>,</p>
        <p>Sou o Rodrigo da HelloCamp outra vez. Queria partilhar convosco um detalhe importante sobre a forma como trabalhamos com os nossos parceiros.</p>
        <p>Na HelloCamp, adaptamo-nos à operação de cada organizador: no nosso contrato de parceria podem escolher entre receber inscrições com pagamento direto na plataforma ou reservas sob confirmação da vossa equipa, tendo sempre total controlo sobre as vossas vagas, turnos e preços, e pagando apenas uma comissão por reserva efetivamente feita.</p>
        <p>Gostávamos mesmo de contar convosco. Têm 10 minutos esta semana para vos mostrarmos a plataforma por dentro? Podem escolher o horário aqui:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Ou, se for mais prático para vocês, respondam apenas a este e-mail com os detalhes dos vossos campos e nós tratamos de configurar o vosso perfil completo.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Programas da ${nome} na HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Um abraço e uma excelente época,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>Equipa HelloCamp<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Se não tiver interesse em receber mais mensagens nossas, pode <a href="${url}" style="color: #94A3B8; text-decoration: underline;">pedir para não ser contactado aqui</a>.`,
      gerarMensagem: (nome) => `
        <p>Olá equipa da <strong>${nome}</strong>,</p>
        <p>Sei que o vosso dia a dia na gestão das atividades é corrido, por isso este será o meu último e-mail para não vos ocupar mais a caixa de correio.</p>
        <p>Temos cada vez mais famílias à procura de programas e campos de férias na HelloCamp e teríamos todo o gosto em fechar parceria com a ${nome} (funcionando apenas à comissão sobre as reservas realizadas).</p>
        <p>Deixo o convite em aberto: se quiserem que nós criemos o vosso perfil e deixemos os vossos programas prontos, basta responderem a este e-mail com a informação e nós tratamos de tudo. Se preferirem falar primeiro connosco para verem a plataforma por dentro, têm sempre a nossa agenda disponível em:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Fico ao vosso dispor sempre que precisarem!</p>
      `
    }
  ],
  EN: [
    {
      gerarAssunto: (nome) => `Partnership with ${nome} / HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Best regards,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>HelloCamp Team<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `If you prefer not to receive further messages from us, you can <a href="${url}" style="color: #94A3B8; text-decoration: underline;">opt out here</a>.`,
      gerarMensagem: (nome) => `
        <p>Hi <strong>${nome}</strong> team, hope you're doing well!</p>
        <p>I'm Rodrigo from <strong>HelloCamp</strong>. I'm reaching out because I saw that you organize youth activities and holiday camps, and I wanted to introduce our platform to you.</p>
        <p>HelloCamp is a new platform where families across Europe discover and book summer camps, sports clinics, language courses, and youth programs. We really like what you do at ${nome} and would love to feature your programs.</p>
        <p>Our partnership model is very straightforward: we set up a partnership agreement with you to promote your programs on the platform, and we work strictly on a commission basis for bookings that are actually completed through HelloCamp.</p>
        <p>Would you be open to a quick 10–15 minute call to learn more and see the platform from the inside? If so, feel free to pick a time that works for you on our calendar:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>If you don't need a meeting and would like us to go ahead and create your profile and upload your camp details right away, just reply to this email with your program information or brochures and our team will take care of everything.</p>
        <p>Let me know what you think!</p>
      `
    },
    {
      gerarAssunto: (nome) => `Re: Partnership with ${nome} / HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Best regards,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>HelloCamp Team<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `If you prefer not to receive further messages from us, you can <a href="${url}" style="color: #94A3B8; text-decoration: underline;">opt out here</a>.`,
      gerarMensagem: (nome) => `
        <p>Hi again <strong>${nome}</strong> team,</p>
        <p>I know you're probably busy organizing your upcoming programs, so I just wanted to send a quick follow-up to my previous note.</p>
        <p>Beyond connecting you with European families searching for camps, we built HelloCamp to make administration easier for our partners: whenever a booking is made, participant medical forms, dietary needs, and emergency contacts are collected in your partner dashboard, and a commission only applies to confirmed bookings.</p>
        <p>If you'd like to see the platform inside and discuss how a partnership would work, you can book a short chat with us here:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Or, if you'd rather skip the call and have us build your profile right away, simply reply with your program details (or let us know if we can pull them from your website) and we'll prepare your listings and partnership agreement.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Quick question regarding ${nome}'s programs`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Best regards,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>HelloCamp Team<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `If you prefer not to receive further messages from us, you can <a href="${url}" style="color: #94A3B8; text-decoration: underline;">opt out here</a>.`,
      gerarMensagem: (nome) => `
        <p>Hi <strong>${nome}</strong> team,</p>
        <p>Rodrigo from HelloCamp here again. I wanted to quickly share one key detail about how we work with camp organizers.</p>
        <p>Our partnership agreement adapts to your workflow: you can choose between instant online checkout or bookings upon request, while keeping full control over your sessions, availability, and pricing—paying a commission only when a booking is genuinely made.</p>
        <p>We'd love to have ${nome} on board. Do you have 10 minutes this week for a quick walkthrough of the platform? You can pick a slot here:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Alternatively, just reply to this email with your camp information and we'll happily set up your full profile for you.</p>
      `
    },
    {
      gerarAssunto: (nome) => `${nome} on HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Wishing you a great season ahead,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>HelloCamp Team<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `If you prefer not to receive further messages from us, you can <a href="${url}" style="color: #94A3B8; text-decoration: underline;">opt out here</a>.`,
      gerarMensagem: (nome) => `
        <p>Hi <strong>${nome}</strong> team,</p>
        <p>I know running youth programs keeps you very busy, so I'll make this my last email to avoid crowding your inbox.</p>
        <p>More and more families are using HelloCamp to book their children's holidays and activities, and we'd still love to partner with ${nome} (working strictly on a commission per completed booking).</p>
        <p>If you'd like us to create your profile and upload your camps for you, just reply to this email anytime with your information and we'll handle the rest. And if you prefer to chat first and see the platform inside, our calendar is always open at:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Feel free to reach out whenever the timing is right for you!</p>
      `
    }
  ],
  ES: [
    {
      gerarAssunto: (nome) => `Colaboración con ${nome} / HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Un saludo,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>Equipo HelloCamp<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Si prefiere no recibir más correos nuestros, puede <a href="${url}" style="color: #94A3B8; text-decoration: underline;">indicárnoslo aquí</a>.`,
      gerarMensagem: (nome) => `
        <p>Hola equipo de <strong>${nome}</strong>, ¿qué tal?</p>
        <p>Soy Rodrigo de <strong>HelloCamp</strong>. Os escribo porque he visto que organizáis actividades y campamentos para niños y jóvenes, y quería daros a conocer nuestra plataforma.</p>
        <p>HelloCamp es una nueva plataforma internacional donde las familias buscan y reservan campamentos de vacaciones, escuelas deportivas y actividades juveniles en Europa. Nos gusta mucho lo que hacéis en ${nome} y creemos que encajáis genial con lo que buscan nuestras familias.</p>
        <p>Nuestro modelo de colaboración es muy sencillo y transparente: firmamos un acuerdo de colaboración con vosotros para promocionar vuestros programas y trabajamos exclusivamente a comisión por cada reserva que se realice efectivamente a través de HelloCamp.</p>
        <p>¿Os apetece agendar una breve reunión online (10-15 minutos) con nosotros para conocer más detalles y ver la plataforma por dentro? Si os parece bien, podéis elegir el horario que mejor os venga en nuestro calendario:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>En caso de que no necesitéis reunión y prefiráis que nosotros mismos creemos ya vuestro perfil y subamos la información de vuestros campamentos, basta con que respondáis a este correo con vuestros datos o folletos y nos encargamos de todo.</p>
        <p>¡Ya me contáis qué os parece!</p>
      `
    },
    {
      gerarAssunto: (nome) => `Re: Colaboración con ${nome} / HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Un saludo,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>Equipo HelloCamp<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Si prefiere no recibir más correos nuestros, puede <a href="${url}" style="color: #94A3B8; text-decoration: underline;">indicárnoslo aquí</a>.`,
      gerarMensagem: (nome) => `
        <p>Hola de nuevo equipo de <strong>${nome}</strong>,</p>
        <p>Imagino que estaréis a tope organizando vuestras actividades, así que os escribo solo unas líneas rápidas en relación a mi correo anterior.</p>
        <p>Además de acercar vuestros programas a nuevas familias en Portugal y Europa, hemos diseñado HelloCamp para ahorraros trabajo administrativo: en cada inscripción los padres completan las fichas médicas, alergias y contactos de urgencia en un único panel, aplicando nuestra comisión únicamente sobre las reservas realmente confirmadas.</p>
        <p>Si queréis ver cómo funciona la plataforma por dentro en una llamada rápida, podéis elegir día y hora aquí:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>O si preferís avanzar ya sin reunión, responded directamente a este email con la información de vuestros programas (o confirmadnos si podemos tomarla de vuestra web) y os preparamos el perfil completo y el acuerdo de colaboración.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Una consulta rápida sobre los programas de ${nome}`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Un saludo,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>Equipo HelloCamp<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Si prefiere no recibir más correos nuestros, puede <a href="${url}" style="color: #94A3B8; text-decoration: underline;">indicárnoslo aquí</a>.`,
      gerarMensagem: (nome) => `
        <p>Hola equipo de <strong>${nome}</strong>,</p>
        <p>Soy Rodrigo de HelloCamp otra vez. Quería comentaros un detalle rápido sobre cómo trabajamos con los organizadores.</p>
        <p>Nuestro contrato de colaboración se adapta a vuestra operativa: podéis elegir entre reservas directas o reservas bajo confirmación de vuestro equipo, manteniendo siempre el control de vuestros turnos, plazas y precios, y abonando únicamente una comisión por cada reserva efectivamente realizada.</p>
        <p>Nos encantaría contar con ${nome}. ¿Tenéis 10 minutos esta semana para enseñaros la plataforma por dentro? Podéis agendarlo aquí:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Y como os comentaba, si preferís que dejemos vuestro perfil creado directamente, responded a este correo con los datos de vuestros campamentos y nosotros nos ocupamos de todo.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Programas de ${nome} en HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Un abrazo y muy buena temporada,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>Equipo HelloCamp<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Si prefiere no recibir más correos nuestros, puede <a href="${url}" style="color: #94A3B8; text-decoration: underline;">indicárnoslo aquí</a>.`,
      gerarMensagem: (nome) => `
        <p>Hola equipo de <strong>${nome}</strong>,</p>
        <p>Sé que el día a día organizando campamentos es muy intenso, así que este será mi último correo para no saturar vuestra bandeja de entrada.</p>
        <p>Cada semana tenemos más familias buscando actividades en nuestra plataforma y nos encantaría formalizar la colaboración con ${nome} (funcionando solo a comisión por reserva confirmada).</p>
        <p>Dejo la puerta totalmente abierta: si queréis que configuremos vuestro perfil y subamos vuestros programas, solo tenéis que responder a este correo con la información cuando os venga bien. Y si preferís charlar primero para ver la plataforma por dentro, tenéis nuestra agenda en:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>¡Quedo a vuestra entera disposición para lo que necesitéis!</p>
      `
    }
  ],
  FR: [
    {
      gerarAssunto: (nome) => `Partenariat avec ${nome} / HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Bien à vous,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>L'équipe HelloCamp<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Si vous ne souhaitez plus recevoir nos messages, vous pouvez <a href="${url}" style="color: #94A3B8; text-decoration: underline;">le signaler ici</a>.`,
      gerarMensagem: (nome) => `
        <p>Bonjour à toute l'équipe de <strong>${nome}</strong>,</p>
        <p>Je m'appelle Rodrigo et je fais partie de <strong>HelloCamp</strong>. Je vous écris car j'ai vu que vous organisiez des activités et des séjours pour les enfants et les jeunes, et je souhaitais vous faire découvrir notre plateforme.</p>
        <p>HelloCamp est une nouvelle plateforme internationale qui permet aux familles européennes de trouver et réserver des colonies de vacances, des stages sportifs et des activités jeunesse. Nous apprécions beaucoup ce que vous proposez chez ${nome} et aimerions vous compter parmi nos partenaires.</p>
        <p>Notre fonctionnement est très simple : nous établissons un contrat de partenariat avec vous pour diffuser vos séjours et nous fonctionnons uniquement à la commission sur les réservations effectivement réalisées via la plateforme.</p>
        <p>Souhaitez-vous planifier un court échange en visio (10-15 minutes) avec nous pour en savoir plus et découvrir la plateforme de l'intérieur ? Vous pouvez choisir directement le créneau qui vous convient sur notre calendrier :<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Si vous n'avez pas besoin de réunion et préférez que nous créions directement votre profil et vos séjours, il vous suffit de répondre à cet e-mail avec vos informations ou brochures, et nous nous occupons de tout.</p>
        <p>Dites-moi ce que vous en pensez !</p>
      `
    },
    {
      gerarAssunto: (nome) => `Re: Partenariat avec ${nome} / HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Bien à vous,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>L'équipe HelloCamp<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Si vous ne souhaitez plus recevoir nos messages, vous pouvez <a href="${url}" style="color: #94A3B8; text-decoration: underline;">le signaler ici</a>.`,
      gerarMensagem: (nome) => `
        <p>Re-bonjour l'équipe de <strong>${nome}</strong>,</p>
        <p>J'imagine que vous êtes bien occupés par la préparation de vos activités, je me permets donc un court suivi après mon précédent message.</p>
        <p>En plus de faire connaître vos séjours auprès de nouvelles familles en Europe, HelloCamp simplifie votre gestion administrative : pour chaque inscription, les fiches sanitaires, allergies et contacts d'urgence sont centralisés dans votre espace partenaire, et la commission ne s'applique qu'aux réservations réellement confirmées.</p>
        <p>Pour voir concrètement comment la plateforme fonctionne de l'intérieur, n'hésitez pas à réserver un créneau de 10 minutes avec nous ici :<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Ou, si vous préférez avancer directement sans réunion, répondez simplement à cet e-mail avec les informations de vos séjours (ou indiquez-nous si nous pouvons reprendre celles de votre site web) et notre équipe préparera votre profil complet et votre contrat.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Une question rapide concernant les séjours de ${nome}`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Bien à vous,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>L'équipe HelloCamp<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Si vous ne souhaitez plus recevoir nos messages, vous pouvez <a href="${url}" style="color: #94A3B8; text-decoration: underline;">le signaler ici</a>.`,
      gerarMensagem: (nome) => `
        <p>Bonjour l'équipe de <strong>${nome}</strong>,</p>
        <p>C'est à nouveau Rodrigo de HelloCamp. Je tenais à partager avec vous un point important sur notre façon de collaborer avec les organisateurs.</p>
        <p>Notre accord de partenariat s'adapte à votre fonctionnement : vous gardez un contrôle total sur vos tarifs, vos dates et vos places disponibles, avec une commission appliquée uniquement lorsqu'une réservation est effectivement conclue.</p>
        <p>Auriez-vous 10 minutes cette semaine pour que nous vous montrions la plateforme de l'intérieur ? Voici notre calendrier :<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Autrement, répondez simplement à ce message avec vos informations et nous préparerons votre profil et vos séjours pour vous.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Les programmes de ${nome} sur HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Très belle saison à vous,</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>L'équipe HelloCamp<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Si vous ne souhaitez plus recevoir nos messages, vous pouvez <a href="${url}" style="color: #94A3B8; text-decoration: underline;">le signaler ici</a>.`,
      gerarMensagem: (nome) => `
        <p>Bonjour l'équipe de <strong>${nome}</strong>,</p>
        <p>Je sais que votre quotidien est très chargé, ce message sera donc le dernier afin de ne pas encombrer votre boîte mail.</p>
        <p>De nombreuses familles recherchent actuellement des séjours et activités sur HelloCamp, et nous serions ravis de mettre en place un partenariat avec ${nome} (rémunéré uniquement à la commission par réservation confirmée).</p>
        <p>Si vous souhaitez que notre équipe crée votre profil et mette en ligne vos programmes, répondez simplement à cet e-mail avec vos informations quand vous le voudrez. Et si vous préférez échanger de vive voix avant, notre agenda reste disponible sur :<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Je reste à votre entière disposition !</p>
      `
    }
  ],
  DE: [
    {
      gerarAssunto: (nome) => `Partnerschaft mit ${nome} / HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Herzliche Grüße</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>HelloCamp Team<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Wenn Sie keine weiteren Nachrichten von uns erhalten möchten, können Sie sich <a href="${url}" style="color: #94A3B8; text-decoration: underline;">hier abmelden</a>.`,
      gerarMensagem: (nome) => `
        <p>Hallo liebes Team von <strong>${nome}</strong>,</p>
        <p>ich bin Rodrigo von <strong>HelloCamp</strong>. Ich schreibe Ihnen, weil ich gesehen habe, dass Sie Feriencamps und Aktivitäten für Kinder und Jugendliche organisieren, und ich Ihnen gerne unsere Plattform vorstellen möchte.</p>
        <p>HelloCamp ist eine neue internationale Plattform, auf der Familien aus ganz Europa Feriencamps, Sportkurse und Jugendreisen entdecken und buchen. Ihre Programme bei ${nome} haben uns sehr gut gefallen und passen hervorragend zu unserem Angebot.</p>
        <p>Unser Partnerschaftsmodell ist ganz transparent: Wir schließen eine Kooperationsvereinbarung mit Ihnen ab, um Ihre Camps zu vermarkten, und arbeiten rein auf Provisionsbasis für Buchungen, die tatsächlich über HelloCamp zustande kommen.</p>
        <p>Hätten Sie Lust auf ein kurzes Online-Treffen (10–15 Minuten), um mehr zu erfahren und sich die Plattform von innen anzusehen? Wählen Sie gerne direkt einen passenden Termin in unserem Kalender aus:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Falls Sie kein Vorgespräch benötigen und möchten, dass wir Ihr Profil und Ihre Camps direkt für Sie anlegen, antworten Sie einfach auf diese E-Mail mit Ihren Programminfos oder Broschüren – wir kümmern uns dann um alles Weitere.</p>
        <p>Ich freue mich auf Ihre Rückmeldung!</p>
      `
    },
    {
      gerarAssunto: (nome) => `Re: Partnerschaft mit ${nome} / HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Herzliche Grüße</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>HelloCamp Team<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Wenn Sie keine weiteren Nachrichten von uns erhalten möchten, können Sie sich <a href="${url}" style="color: #94A3B8; text-decoration: underline;">hier abmelden</a>.`,
      gerarMensagem: (nome) => `
        <p>Hallo nochmal an das Team von <strong>${nome}</strong>,</p>
        <p>da Sie sicher mitten in der Planung Ihrer Programme stecken, melde ich mich nur ganz kurz im Anschluss an meine vorherige E-Mail.</p>
        <p>Neben der internationalen Reichweite bei europäischen Familien haben wir HelloCamp entwickelt, um Veranstaltern den Verwaltungsaufwand zu erleichtern: Bei jeder Buchung werden Gesundheitsdaten, Allergien und Notfallkontakte zentral in Ihrem Partner-Dashboard erfasst, und eine Provision fällt nur bei tatsächlich bestätigten Buchungen an.</p>
        <p>Wenn Sie sich die Plattform in einem kurzen Gespräch von innen ansehen möchten, können Sie hier einen Termin buchen:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Oder antworten Sie einfach kurz auf diese E-Mail mit den Infos zu Ihren Camps (oder geben Sie uns Bescheid, ob wir die Daten von Ihrer Website übernehmen dürfen), und unser Team bereitet Ihr Profil sowie den Partnerschaftsvertrag komplett für Sie vor.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Kurze Frage zu den Programmen von ${nome}`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Herzliche Grüße</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>HelloCamp Team<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Wenn Sie keine weiteren Nachrichten von uns erhalten möchten, können Sie sich <a href="${url}" style="color: #94A3B8; text-decoration: underline;">hier abmelden</a>.`,
      gerarMensagem: (nome) => `
        <p>Hallo Team von <strong>${nome}</strong>,</p>
        <p>hier ist noch einmal Rodrigo von HelloCamp. Ich wollte Ihnen kurz einen wichtigen Punkt zu unserer Zusammenarbeit mit Veranstaltern mitteilen.</p>
        <p>Unsere Vereinbarung passt sich flexibel an Ihre Abläufe an: Sie behalten jederzeit die volle Kontrolle über Ihre Termine, Kapazitäten und Preise, und zahlen lediglich eine Provision für erfolgreich vermittelte Buchungen.</p>
        <p>Hätten Sie diese Woche 10 Minuten Zeit, damit wir Ihnen die Plattform kurz persönlich zeigen können? Hier geht es zu unserem Kalender:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Alternativ können Sie mir auch einfach auf diese E-Mail mit Ihren Programmdaten antworten, und wir richten Ihr Profil komplett für Sie ein.</p>
      `
    },
    {
      gerarAssunto: (nome) => `Programme von ${nome} auf HelloCamp`,
      gerarAssinatura: (parceiroUrl) => `
        <p style="margin-top: 24px; margin-bottom: 4px;">Herzliche Grüße und eine erfolgreiche Saison</p>
        <p style="margin: 0;"><strong>Rodrigo</strong><br/>HelloCamp Team<br/><a href="${parceiroUrl}" style="color: #0E3A68; text-decoration: none;">www.hellocamp.pt</a></p>
      `,
      gerarFooter: (url) => `Wenn Sie keine weiteren Nachrichten von uns erhalten möchten, können Sie sich <a href="${url}" style="color: #94A3B8; text-decoration: underline;">hier abmelden</a>.`,
      gerarMensagem: (nome) => `
        <p>Hallo liebes Team von <strong>${nome}</strong>,</p>
        <p>ich weiß, wie viel bei der Organisation von Jugendprogrammen zu tun ist – daher ist dies meine letzte E-Mail, um Ihr Postfach nicht unnötig zu füllen.</p>
        <p>Immer mehr Familien suchen auf HelloCamp nach passenden Ferien- und Freizeitangeboten, und wir würden uns sehr über eine Partnerschaft mit ${nome} freuen (rein auf Provisionsbasis bei tatsächlichen Buchungen).</p>
        <p>Unser Angebot steht jederzeit: Wenn wir Ihr Profil und Ihre Camps für Sie einpflegen sollen, antworten Sie mir einfach mit Ihren Infos oder einer Broschüre. Und falls Sie vorher lieber kurz mit uns sprechen möchten, finden Sie unseren Kalender hier:<br/>
        👉 <a href="${CALENDLY_URL}" style="color: #2563EB; font-weight: 600;">${CALENDLY_URL}</a></p>
        <p>Melden Sie sich jederzeit gerne, wenn es für Sie passt!</p>
      `
    }
  ]
};

function getTemplateHTML(mensagem: string, assinatura: string, footerText: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1E293B; max-width: 620px;">
      ${mensagem}
      ${assinatura}
      <div style="margin-top: 36px; padding-top: 14px; border-top: 1px solid #F1F5F9;">
        <p style="color: #94A3B8; font-size: 11px; line-height: 1.4; margin: 0;">
          ${footerText}
        </p>
      </div>
    </div>
  `;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const urlSecret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET?.replace(/['"]+/g, '').trim();

    // Aceita TANTO o Header (Bearer) COMO o link direto (?secret=...)
    const isAuthorized =
      !cronSecret ||
      authHeader === `Bearer ${cronSecret}` ||
      urlSecret === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // SEGURANÇA 1: Vamos buscar os e-mails de todos os Parceiros já registados
    const { data: perfisAtivos } = await supabaseAdmin
      .from('perfis')
      .select('email')
      .eq('role', 'organizador');

    const emailsRegistados = perfisAtivos?.map(p => p.email?.toLowerCase().trim()) || [];

    // Busca as leads na fila
    const { data: leadsPotenciais, error } = await supabaseAdmin
      .from('leads_externas')
      .select('id, nome_cliente, email_cliente, fase_funil, ultimo_contacto, idioma')
      .is('unsubscribed', false)
      .lt('fase_funil', 4)
      .or(`ultimo_contacto.is.null,ultimo_contacto.lt.${seteDiasAtras}`)
      .not('email_cliente', 'is', null)
      .neq('email_cliente', '')
      .order('fase_funil', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(300);

    if (error) throw error;
    if (!leadsPotenciais || leadsPotenciais.length === 0) {
      return NextResponse.json({ message: 'Nenhuma lead elegível hoje.' });
    }

    // SEGURANÇA 2: Filtra as leads para garantir que nenhuma está na lista de parceiros registados
    const leadsProntas: any[] = [];
    const leadsParaDesativar: string[] = [];

    for (const lead of leadsPotenciais) {
      const email = lead.email_cliente?.toLowerCase().trim();
      if (emailsRegistados.includes(email)) {
        leadsParaDesativar.push(lead.id);
      } else {
        leadsProntas.push(lead);
      }
    }

    if (leadsParaDesativar.length > 0) {
      await supabaseAdmin.from('leads_externas')
        .update({ status: 'COMPLETO', unsubscribed: true, fase_funil: 4 })
        .in('id', leadsParaDesativar);
    }

    if (leadsProntas.length === 0) {
      return NextResponse.json({ message: 'Leads filtradas porque já eram parceiros registados. Nenhuma enviada.' });
    }

    const leadsFinal = leadsProntas.slice(0, 250);
    const resultados: any[] = [];
    const BATCH_SIZE = 25;

    for (let i = 0; i < leadsFinal.length; i += BATCH_SIZE) {
      const batch = leadsFinal.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (lead) => {
          const email = (lead.email_cliente || '').trim();
          const nome = lead.nome_cliente || 'Organizador';
          const faseAtual = Number(lead.fase_funil) || 0;

          let lang = (lead.idioma || 'PT').toUpperCase();
          if (!TEMPLATES[lang]) lang = 'EN';

          const tpl = TEMPLATES[lang][faseAtual];
          if (!tpl) return { status: 'skipped', id: lead.id };

          const linkLang = lang === 'PT' ? 'pt' : 'en';
          const parceiroUrl = `${BASE_URL}/${linkLang}/parceiro`;
          const unsubscribeUrl = `${BASE_URL}/${linkLang}/unsubscribe?id=${lead.id}`;

          const r = await enviarViaBrevo({
            to: { email, name: nome },
            subject: tpl.gerarAssunto(nome),
            html: getTemplateHTML(
              tpl.gerarMensagem(nome, parceiroUrl),
              tpl.gerarAssinatura(parceiroUrl),
              tpl.gerarFooter(unsubscribeUrl)
            ),
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
      tentados: leadsFinal.length,
      limposPorJaSeremParceiros: leadsParaDesativar.length
    });

  } catch (error: any) {
    console.error('❌ Erro no Cron B2B Global:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
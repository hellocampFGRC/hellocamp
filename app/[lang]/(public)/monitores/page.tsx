import Link from "next/link";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isEn = lang === "en";
  const canonical = `https://www.hellocamp.pt/${lang}/monitores`;

  const title = isEn
    ? "HelloCamp Staff Pool | Work in Summer Camps & Youth Programs"
    : "Bolsa Nacional de Monitores HelloCamp | Trabalha em Campos de Férias";

  const description = isEn
    ? "Create your free monitor profile (ages 16-35), set your availability calendar, and receive direct job offers from verified private camps, clubs, and municipalities."
    : "Cria o teu perfil gratuito de monitor ou coordenador (16 aos 35 anos), define o teu calendário de disponibilidade e recebe propostas diretas de campos de férias privados, clubes e autarquias.";

  return {
    title,
    description,
    keywords: [
      "bolsa de monitores campos de férias",
      "trabalho de verão monitores portugal",
      "emprego monitor campo de férias",
      "recrutamento monitores campos de férias",
      "trabalho sazonal jovens portugal",
      "coordenador campo de férias ipdj",
    ],
    alternates: {
      canonical,
      languages: {
        "pt-PT": "https://www.hellocamp.pt/pt/monitores",
        "en-US": "https://www.hellocamp.pt/en/monitores",
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "HelloCamp",
      type: "website",
      locale: isEn ? "en_US" : "pt_PT",
    },
    robots: { index: true, follow: true },
  };
}

export default async function MonitoresLandingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isEn = lang === "en";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: isEn
      ? "HelloCamp National Staff Pool"
      : "Bolsa Nacional de Monitores HelloCamp",
    description: isEn
      ? "Free talent network connecting youth (16-35) with verified holiday camps, sports clubs, and municipalities in Portugal."
      : "Rede gratuita que liga jovens monitores e coordenadores (16-35 anos) a campos de férias verificados, clubes e autarquias em Portugal.",
    url: `https://www.hellocamp.pt/${lang}/monitores`,
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 px-4 md:px-8 bg-[#2563EB] border-b-4 border-[#F59E0B] text-white">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F59E0B] text-[#0F172A] rounded-md text-[11px] font-black uppercase tracking-widest mb-6 shadow-sm">
            <span>🎓</span>
            <span>
              {isEn
                ? "National Youth Staff Network (Ages 16–35)"
                : "Bolsa Nacional de Monitores • Jovens 16–35 Anos"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-[1.1] text-white">
            {isEn
              ? "Work in the best Holiday Camps in Portugal & Europe."
              : "O teu próximo trabalho como Monitor começa aqui."}
          </h1>

          <p className="text-base md:text-xl text-blue-100 font-medium mb-10 max-w-3xl mx-auto leading-relaxed">
            {isEn
              ? "Create your free professional profile, highlight your certifications and availability, and receive direct job invitations from verified private camps, sports clubs, and municipalities."
              : "Cria o teu perfil profissional gratuito, destaca as tuas certificações, línguas e disponibilidade, e recebe convites de trabalho diretos de campos privados, clubes desportivos, associações e autarquias."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={`/${lang}/monitores/registo`}
              className="w-full sm:w-auto bg-[#F59E0B] hover:bg-amber-500 text-[#0F172A] font-black uppercase tracking-widest text-xs md:text-sm px-8 py-4 rounded-md shadow-lg transition-all no-underline text-center"
            >
              {isEn ? "✍️ Create Free Monitor Profile" : "✍️ Criar Perfil de Monitor Grátis"}
            </Link>
            <Link
              href={`/${lang}/monitores/portal/perfil`}
              className="w-full sm:w-auto bg-[#0F172A] hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs md:text-sm px-8 py-4 rounded-md shadow-lg transition-all no-underline text-center"
            >
              {isEn ? "🔑 Monitor Portal (Profile & Offers)" : "🔑 Área do Monitor (Perfil & Propostas)"}
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 md:gap-5 text-xs font-black uppercase tracking-wider text-white">
            <span className="bg-white/15 px-3.5 py-2 rounded-md">
              ✓ {isEn ? "100% Free for Youth" : "100% Gratuito para Monitores"}
            </span>
            <span className="bg-white/15 px-3.5 py-2 rounded-md">
              ✓ {isEn ? "0% Salary Commission" : "0% Comissões sobre o Ordenado"}
            </span>
            <span className="bg-white/15 px-3.5 py-2 rounded-md">
              ✓ {isEn ? "Private Camps, Clubs & Councils" : "Campos Privados, Clubes e Autarquias"}
            </span>
          </div>
        </div>
      </section>

      {/* MÉTRICAS DE IMPACTO */}
      <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-md shadow-xl border border-slate-200 p-6 md:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="pt-2 sm:pt-0">
            <div className="text-3xl md:text-4xl font-black text-[#2563EB] mb-1">
              100% Direto
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {isEn
                ? "Direct Contact with Camp Directors"
                : "Contacto Direto com Diretores de Campo"}
            </div>
          </div>
          <div className="pt-4 sm:pt-0">
            <div className="text-3xl md:text-4xl font-black text-[#16A34A] mb-1">
              Todo o Ano
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {isEn
                ? "Carnival, Easter, Summer & Christmas"
                : "Carnaval, Páscoa, Verão e Natal"}
            </div>
          </div>
          <div className="pt-4 sm:pt-0">
            <div className="text-3xl md:text-4xl font-black text-[#F59E0B] mb-1">
              0€ Custos
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {isEn
                ? "Full Salary Negotiated Directly"
                : "Ordenado Acordado 100% Contigo"}
            </div>
          </div>
        </div>
      </section>

      {/* QUE PERFIS PROCURAM OS ORGANIZADORES? */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <span className="inline-block bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-3">
            {isEn ? "Opportunities" : "Perfis Mais Procurados"}
          </span>
          <h2 className="text-2xl md:text-4xl font-black text-[#0F172A] m-0">
            {isEn
              ? "Who can join the HelloCamp Staff Pool?"
              : "Que funções podes desempenhar nos Campos?"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: "🏕️",
              badge: "bg-[#16A34A]",
              title: isEn ? "Camp Monitors" : "Monitores de Campo",
              desc: isEn
                ? "Dynamic monitors for daily group supervision, games, nature activities, and overnight stays."
                : "Acompanhamento de grupos, jogos, dinâmicas de equipa, atividades outdoor e acampamentos.",
            },
            {
              icon: "🏄‍♂️",
              badge: "bg-[#2563EB]",
              title: isEn ? "Sports & Surf Coaches" : "Instrutores Desportivos",
              desc: isEn
                ? "Surf, sailing, football, multi-sport, climbing, and adventure instructors."
                : "Instrutores de surf, desportos náuticos, futebol, escalada, arvorismo, dança e artes marciais.",
            },
            {
              icon: "🎓",
              badge: "bg-[#F59E0B]",
              title: isEn ? "Camp Coordinators" : "Coordenadores Pedagógicos",
              desc: isEn
                ? "Experienced team leaders certified by IPDJ to coordinate staff schedules and logistics."
                : "Chefes de equipa e coordenadores certificados (IPDJ) para gerir equipas de monitores e logística.",
            },
            {
              icon: "🎨",
              badge: "bg-[#F43F5E]",
              title: isEn
                ? "Workshops, Tech & NEE"
                : "Oficinas, Línguas & Apoio NEE",
              desc: isEn
                ? "Science, robotics, arts, foreign language teachers, lifeguards, and special needs support."
                : "Monitores para oficinas criativas, ciência, línguas, socorrismo e apoio a necessidades educativas especiais.",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-md border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div
                  className={`w-12 h-12 ${card.badge} text-white rounded-md flex items-center justify-center text-2xl mb-4 font-black`}
                >
                  {card.icon}
                </div>
                <h3 className="text-base font-black text-[#0F172A] m-0 mb-2">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium m-0">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA EM 3 PASSOS */}
      <section className="bg-white border-y border-slate-200 py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-3">
              {isEn ? "Simple Process" : "Processo Simples"}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#0F172A] m-0">
              {isEn ? "How it works" : "Como funciona a Bolsa de Monitores?"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-[#F8FAFC] p-6 rounded-md border border-slate-200">
              <span className="inline-block bg-[#2563EB] text-white text-xs font-black px-3 py-1 rounded-md mb-4">
                PASSO 1
              </span>
              <h3 className="text-lg font-black text-[#0F172A] m-0 mb-2">
                {isEn
                  ? "Build Your Complete Profile"
                  : "Preenche o Teu Perfil Completo"}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium m-0">
                {isEn
                  ? "Indicate your role, languages, certifications (IPDJ, First Aid, Lifeguard), upload your CV and photo. If you are 16 or 17, you can generate the Parental Authorization PDF right on the page."
                  : "Indica a tua função, línguas faladas, certificações (IPDJ, Primeiros Socorros, Nadador Salvador), carrega o teu CV e foto. Se tiveres 16 ou 17 anos, geramos na hora a minuta PDF de Autorização Parental."}
              </p>
            </div>

            <div className="bg-[#F8FAFC] p-6 rounded-md border border-slate-200">
              <span className="inline-block bg-[#F59E0B] text-[#0F172A] text-xs font-black px-3 py-1 rounded-md mb-4">
                PASSO 2
              </span>
              <h3 className="text-lg font-black text-[#0F172A] m-0 mb-2">
                {isEn
                  ? "Mark Your Available Dates"
                  : "Marca o Teu Calendário e Regiões"}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium m-0">
                {isEn
                  ? "Select the districts where you can work (or nationwide with accommodation) and click the exact days you are free on the interactive calendar."
                  : "Escolhe os distritos onde podes trabalhar (ou em todo o país com alojamento incluído) e assinala no calendário interativo os dias e épocas em que estás disponível."}
              </p>
            </div>

            <div className="bg-[#F8FAFC] p-6 rounded-md border border-slate-200">
              <span className="inline-block bg-[#16A34A] text-white text-xs font-black px-3 py-1 rounded-md mb-4">
                PASSO 3
              </span>
              <h3 className="text-lg font-black text-[#0F172A] m-0 mb-2">
                {isEn
                  ? "Receive Direct Invitations"
                  : "Recebe Convites no Chat e E-mail"}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium m-0">
                {isEn
                  ? "Verified camp directors filter our talent pool and send you direct interview invitations in your Monitor Portal and by email."
                  : "Os diretores dos campos de férias filtram a nossa base de dados e enviam-te propostas diretas para o teu Portal de Monitor, e-mail ou WhatsApp."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACIDADE & CTA FINAL */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 pt-16">
        <div className="bg-[#0F172A] text-white p-7 md:p-10 rounded-md border-l-4 border-[#16A34A] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block mb-2">
              🛡️ Privacidade & Segurança RGPD
            </span>
            <h3 className="text-xl font-black text-white m-0 mb-2">
              {isEn
                ? "Your CV and contacts are strictly private."
                : "O teu CV e contactos estão protegidos."}
            </h3>
            <p className="text-xs text-slate-300 m-0 leading-relaxed max-w-xl">
              {isEn
                ? "Your profile is never indexed on Google or visible to the general public. Only verified partner organizations with an approved contract can view your details."
                : "O teu perfil nunca aparece no Google nem ao público geral. Apenas entidades organizadoras verificadas na HelloCamp têm acesso à Bolsa de Recrutamento."}
            </p>
          </div>
          <Link
            href={`/${lang}/monitores/registo`}
            className="w-full md:w-auto text-center bg-[#F59E0B] hover:bg-amber-500 text-[#0F172A] font-black text-xs uppercase tracking-widest px-7 py-4 rounded-md no-underline shrink-0"
          >
            {isEn ? "Register Now →" : "Criar Perfil Agora →"}
          </Link>
        </div>
      </section>
    </main>
  );
}
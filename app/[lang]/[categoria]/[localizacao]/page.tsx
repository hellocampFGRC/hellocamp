import React from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Metadata } from "next";
import BotaoFavorito from "@/app/[lang]/(public)/components/BotaoFavorito";
export const dynamic = "force-dynamic";

// Função utilitária para limpar acentos e comparar strings sem erros
function normalizeStr(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Dicionário inteligente de slugs para títulos bonitos e termos de pesquisa na BD
const MAPA_CATEGORIAS: Record<
  string,
  { pt: string; en: string; termos: string[]; isEpoca?: boolean; isGenerico?: boolean }
> = {
  "campos-de-ferias": {
    pt: "Campos de Férias",
    en: "Holiday & Summer Camps",
    termos: [],
    isGenerico: true,
  },
  verao: {
    pt: "Campos de Férias de Verão",
    en: "Summer Camps",
    termos: ["verao", "summer", "julho", "agosto", "junho", "setembro"],
    isEpoca: true,
  },
  natal: {
    pt: "Campos de Férias de Natal",
    en: "Christmas Holiday Camps",
    termos: ["natal", "christmas", "dezembro", "inverno", "ano todo", "year-round"],
    isEpoca: true,
  },
  pascoa: {
    pt: "Campos de Férias da Páscoa",
    en: "Easter Holiday Camps",
    termos: ["pascoa", "easter", "abril", "marco", "primavera"],
    isEpoca: true,
  },
  carnaval: {
    pt: "Campos de Férias de Carnaval",
    en: "Carnival Holiday Camps",
    termos: ["carnaval", "fevereiro"],
    isEpoca: true,
  },
  aventura: {
    pt: "Campos de Férias de Aventura e Natureza",
    en: "Adventure & Nature Camps",
    termos: ["aventura", "natureza", "outdoor", "adventure", "castor", "safari", "escalada", "arvorismo"],
  },
  natureza: {
    pt: "Campos de Férias na Natureza",
    en: "Nature & Outdoor Camps",
    termos: ["natureza", "aventura", "outdoor", "floresta", "campo"],
  },
  linguas: {
    pt: "Campos de Férias de Línguas e Cursos no Estrangeiro",
    en: "Language Camps & Courses",
    termos: ["linguas", "ingles", "espanhol", "english", "spanish", "language", "cambridge", "malta", "lal"],
  },
  ingles: {
    pt: "Campos de Férias de Inglês",
    en: "English Summer Camps",
    termos: ["ingles", "linguas", "english", "cambridge", "malta", "uk", "reino unido"],
  },
  surf: {
    pt: "Surf Camps e Campos de Férias de Surf",
    en: "Surf Camps & Watersports",
    termos: ["surf", "nautica", "bodyboard", "vela", "watersports", "praia", "onda"],
  },
  desporto: {
    pt: "Campos de Férias Desportivos",
    en: "Multi-Sports Holiday Camps",
    termos: ["desporto", "futebol", "tenis", "basquetebol", "surf", "golf", "sports", "decathlon"],
  },
  futebol: {
    pt: "Campos de Férias de Futebol",
    en: "Football Camps",
    termos: ["futebol", "football", "soccer", "desporto"],
  },
  tecnologia: {
    pt: "Campos de Férias de Tecnologia, Ciência e Robótica",
    en: "Tech, Science & Robotics Camps",
    termos: ["tecnologia", "robotica", "ciencia", "programacao", "gaming", "tech", "science"],
  },
  artes: {
    pt: "Campos de Férias de Artes, Teatro e Criatividade",
    en: "Arts, Music & Creative Camps",
    termos: ["artes", "criatividade", "teatro", "musica", "danca", "culinaria", "arts"],
  },
};

const MAPA_LOCAIS: Record<string, { pt: string; en: string; preposicaoPt: string }> = {
  portugal: { pt: "Portugal", en: "Portugal", preposicaoPt: "em Portugal" },
  lisboa: { pt: "Lisboa", en: "Lisbon", preposicaoPt: "em Lisboa" },
  cascais: { pt: "Cascais", en: "Cascais", preposicaoPt: "em Cascais" },
  anadia: { pt: "Anadia", en: "Anadia", preposicaoPt: "na Anadia" },
  sintra: { pt: "Sintra", en: "Sintra", preposicaoPt: "em Sintra" },
  oeiras: { pt: "Oeiras", en: "Oeiras", preposicaoPt: "em Oeiras" },
  amadora: { pt: "Amadora", en: "Amadora", preposicaoPt: "na Amadora" },
  porto: { pt: "Porto", en: "Porto", preposicaoPt: "no Porto" },
  algarve: { pt: "Algarve", en: "Algarve", preposicaoPt: "no Algarve" },
  faro: { pt: "Faro (Algarve)", en: "Faro (Algarve)", preposicaoPt: "em Faro e no Algarve" },
  coimbra: { pt: "Coimbra", en: "Coimbra", preposicaoPt: "em Coimbra" },
  aveiro: { pt: "Aveiro", en: "Aveiro", preposicaoPt: "em Aveiro" },
  braga: { pt: "Braga", en: "Braga", preposicaoPt: "em Braga" },
  setubal: { pt: "Setúbal", en: "Setúbal", preposicaoPt: "em Setúbal" },
  caparica: { pt: "Costa da Caparica", en: "Costa da Caparica", preposicaoPt: "na Costa da Caparica" },
  ericeira: { pt: "Ericeira", en: "Ericeira", preposicaoPt: "na Ericeira" },
  espanha: { pt: "Espanha", en: "Spain", preposicaoPt: "em Espanha" },
  "reino-unido": { pt: "Reino Unido", en: "United Kingdom", preposicaoPt: "no Reino Unido" },
  malta: { pt: "Malta", en: "Malta", preposicaoPt: "em Malta" },
};

function formatarSlugTexto(slug: string): string {
  const limpo = decodeURIComponent(slug).replace(/-/g, " ").trim();
  return limpo.replace(/\b\w/g, (l) => l.toUpperCase());
}

function obterDadosCategoria(catSlug: string) {
  const norm = normalizeStr(decodeURIComponent(catSlug)).replace(/\s+/g, "-");
  if (MAPA_CATEGORIAS[norm]) return MAPA_CATEGORIAS[norm];
  const nomeFormatado = formatarSlugTexto(catSlug);
  return {
    pt: `Campos de Férias de ${nomeFormatado}`,
    en: `${nomeFormatado} Holiday Camps`,
    termos: [normalizeStr(nomeFormatado)],
  };
}

function obterDadosLocal(locSlug: string) {
  const norm = normalizeStr(decodeURIComponent(locSlug)).replace(/\s+/g, "-");
  if (MAPA_LOCAIS[norm]) return MAPA_LOCAIS[norm];
  const nomeFormatado = formatarSlugTexto(locSlug);
  return {
    pt: nomeFormatado,
    en: nomeFormatado,
    preposicaoPt: `em ${nomeFormatado}`,
  };
}

// Filtragem inteligente que cruza categoria/época e localização (Cidade, Distrito ou País)
function filtrarCamposSEO(campos: any[], catSlug: string, locSlug: string) {
  const infoCat = obterDadosCategoria(catSlug);
  const normLoc = normalizeStr(decodeURIComponent(locSlug).replace(/-/g, " "));

  const matchesCategoria = (c: any) => {
    if (infoCat.isGenerico) return true;
    const textoCampo = normalizeStr(
      `${c.nome || ""} ${c.nome_en || ""} ${c.categoria || ""} ${c.categoria_en || ""} ${
        c.descricao || ""
      } ${JSON.stringify(c.pacotes || "")}`
    );
    if (infoCat.isEpoca && normalizeStr(catSlug) === "verao") {
      // Quase todos os campos ativos têm edição de verão se não especificarem apenas outra época
      return true;
    }
    return infoCat.termos.some((termo) => textoCampo.includes(termo));
  };

  const matchesLocal = (c: any) => {
    if (normLoc === "todos" || normLoc === "europa" || normLoc === "mundo") return true;
    const textoLocal = normalizeStr(
      `${c.local || ""} ${c.local_en || ""} ${c.Distrito || ""} ${c.Pais || ""} ${c.nome || ""} ${
        c.descricao || ""
      }`
    );
    if (normLoc === "algarve") {
      return textoLocal.includes("algarve") || textoLocal.includes("faro") || textoLocal.includes("portimao") || textoLocal.includes("lagos");
    }
    if (normLoc === "anadia") {
      return textoLocal.includes("anadia") || textoLocal.includes("aveiro") || textoLocal.includes("bairrada") || textoLocal.includes("curia");
    }
    if (normLoc === "cascais") {
      return textoLocal.includes("cascais") || textoLocal.includes("estoril") || textoLocal.includes("carcavelos") || textoLocal.includes("guincho");
    }
    return textoLocal.includes(normLoc);
  };

  const exatos = campos.filter((c) => matchesCategoria(c) && matchesLocal(c));
  const mesmaLocalizacao = campos.filter((c) => matchesLocal(c));
  const mesmaCategoria = campos.filter((c) => matchesCategoria(c));

  return {
    exatos,
    sugeridos:
      exatos.length > 0
        ? []
        : mesmaLocalizacao.length > 0
        ? mesmaLocalizacao.slice(0, 6)
        : mesmaCategoria.length > 0
        ? mesmaCategoria.slice(0, 6)
        : campos.slice(0, 6),
  };
}

// 1. METADATA DINÂMICA OTIMIZADA PARA CTR NO GOOGLE
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; categoria: string; localizacao: string }>;
}): Promise<Metadata> {
  const { lang, categoria, localizacao } = await params;
  const isEn = lang === "en";
  const anoAtual = new Date().getFullYear();

  const infoCat = obterDadosCategoria(categoria);
  const infoLoc = obterDadosLocal(localizacao);

  const metaTitle = isEn
    ? `Best ${infoCat.en} in ${infoLoc.en} (${anoAtual}) | Direct Booking`
    : `${infoCat.pt} ${infoLoc.preposicaoPt} (${anoAtual}) | Preços e Inscrições`;

  const metaDescription = isEn
    ? `Discover and book the best verified ${infoCat.en.toLowerCase()} in ${infoLoc.en} for children and teens. Compare prices, dates, day & residential options with safe booking on HelloCamp.`
    : `Procura ${infoCat.pt.toLowerCase()} ${infoLoc.preposicaoPt}? Compare preços, datas, idades (dos 3 aos 18 anos) e reserve online com segurança em organizadores verificados na HelloCamp.`;

  const cleanCat = normalizeStr(categoria).replace(/\s+/g, "-");
  const cleanLoc = normalizeStr(localizacao).replace(/\s+/g, "-");

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: isEn
      ? [
          `${infoCat.en} ${infoLoc.en}`,
          `summer camps ${infoLoc.en}`,
          `kids activities ${infoLoc.en}`,
          `holiday camps ${anoAtual}`,
        ]
      : [
          `campos de férias ${infoLoc.pt}`,
          `${infoCat.pt.toLowerCase()} ${infoLoc.pt}`,
          `colónias de férias ${infoLoc.pt} ${anoAtual}`,
          `atividades de férias para crianças ${infoLoc.pt}`,
          `campos de férias verão ${infoLoc.pt}`,
          `campos de férias natal ${infoLoc.pt}`,
        ],
    alternates: {
      canonical: `https://www.hellocamp.pt/${lang}/${cleanCat}/${cleanLoc}`,
      languages: {
        "pt-PT": `https://www.hellocamp.pt/pt/${cleanCat}/${cleanLoc}`,
        "en-US": `https://www.hellocamp.pt/en/${cleanCat}/${cleanLoc}`,
      },
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: `https://www.hellocamp.pt/${lang}/${cleanCat}/${cleanLoc}`,
      siteName: "HelloCamp",
      locale: isEn ? "en_US" : "pt_PT",
      type: "website",
      images: [
        {
          url: "https://www.hellocamp.pt/og-image.jpg",
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
  };
}

// 2. COMPONENTE DA PÁGINA PROGRAMÁTICA DE SEO
export default async function CategoriaLocalizacaoPage({
  params,
}: {
  params: Promise<{ lang: string; categoria: string; localizacao: string }>;
}) {
  const { lang, categoria, localizacao } = await params;
  const isEn = lang === "en";
  const anoAtual = new Date().getFullYear();

  const infoCat = obterDadosCategoria(categoria);
  const infoLoc = obterDadosLocal(localizacao);

  const { data: todosCampos } = await supabase
    .from("campos")
    .select("*")
    .eq("ativo", true);

  const listaCompleta = todosCampos || [];
  const { exatos, sugeridos } = filtrarCamposSEO(listaCompleta, categoria, localizacao);
  const camposParaMostrar = exatos.length > 0 ? exatos : sugeridos;

  // Cálculo do preço mínimo real para mostrar nos Rich Snippets e no texto SEO
  let precoMinimoGlobal = 0;
  camposParaMostrar.forEach((c) => {
    let p = Number(c.preco) || 0;
    if (!p && Array.isArray(c.pacotes) && c.pacotes.length > 0) {
      const precosPacotes = c.pacotes
        .flatMap((pac: any) => pac.variantes?.map((v: any) => Number(v.preco) || 0) || [])
        .filter((val: number) => val > 0);
      if (precosPacotes.length > 0) p = Math.min(...precosPacotes);
    }
    if (p > 0 && (precoMinimoGlobal === 0 || p < precoMinimoGlobal)) {
      precoMinimoGlobal = p;
    }
  });

  // Perguntas Frequentes (FAQ) específicas para capturar o topo do Google (People Also Ask)
  const faqs = isEn
    ? [
        {
          q: `How much do ${infoCat.en.toLowerCase()} in ${infoLoc.en} cost?`,
          a: `Prices for ${infoCat.en.toLowerCase()} in ${infoLoc.en} on HelloCamp start from ${
            precoMinimoGlobal > 0 ? `${precoMinimoGlobal}€` : "competitive weekly rates"
          }, depending on whether you choose a Day Camp (externato) or Full Residential program with accommodation and meals included.`,
        },
        {
          q: `What age groups can attend camps in ${infoLoc.en}?`,
          a: `Programs in ${infoLoc.en} cater to children and teenagers aged 3 to 18 years old. Participants are always divided into age-appropriate groups supervised by certified monitors.`,
        },
        {
          q: `How do I book a spot and is there flexible payment?`,
          a: `You can compare dates, check real-time availability, fill out the digital medical form, and book directly online on HelloCamp. Many camps allow securing a spot with a 30% deposit.`,
        },
      ]
    : [
        {
          q: `Quanto custa um ${infoCat.pt.toLowerCase()} ${infoLoc.preposicaoPt}?`,
          a: `Os preços para ${infoCat.pt.toLowerCase()} ${infoLoc.preposicaoPt} começam desde ${
            precoMinimoGlobal > 0 ? `${precoMinimoGlobal}€` : "valores semanais acessíveis"
          }, variando consoante a modalidade escolhida: regime de externato (sem dormida, com ou sem almoço) ou regime residencial (pensão completa, alojamento e atividades 24h).`,
        },
        {
          q: `Quais são as idades aceites nos campos de férias ${infoLoc.preposicaoPt}?`,
          a: `Na HelloCamp encontra programas ${infoLoc.preposicaoPt} para crianças dos 3 aos 6 anos, dos 7 aos 12 anos e jovens adolescentes dos 13 aos 18 anos. As atividades são sempre divididas por faixas etárias e supervisionadas por monitores e coordenadores qualificados.`,
        },
        {
          q: `Existem programas de Verão, Natal, Páscoa e Aventura ${infoLoc.preposicaoPt}?`,
          a: `Sim! Atualizamos a oferta durante todo o ano letivo e pausas escolares: campos de férias de Verão (junho a setembro), campos de Natal (dezembro), Páscoa e Carnaval, incluindo atividades de aventura, desporto, surf, robótica e línguas.`,
        },
        {
          q: `Como funciona a inscrição e a segurança na HelloCamp?`,
          a: `Todas as entidades parceiras são verificadas. Na mesma reserva preenche a Ficha Clínica Digital (alergias alimentares, medicação e contactos de emergência) e garante a vaga com pagamento seguro ou sinal de 30% nos campos elegíveis.`,
        },
      ];

  // JSON-LD: BreadcrumbList + ItemList + FAQPage
  const baseUrl = "https://www.hellocamp.pt";
  const cleanCat = normalizeStr(categoria).replace(/\s+/g, "-");
  const cleanLoc = normalizeStr(localizacao).replace(/\s+/g, "-");

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isEn ? "Home" : "Início",
        item: `${baseUrl}/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isEn ? infoCat.en : infoCat.pt,
        item: `${baseUrl}/${lang}/${cleanCat}/portugal`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: isEn ? infoLoc.en : infoLoc.pt,
        item: `${baseUrl}/${lang}/${cleanCat}/${cleanLoc}`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isEn
      ? `${infoCat.en} in ${infoLoc.en}`
      : `${infoCat.pt} ${infoLoc.preposicaoPt}`,
    numberOfItems: camposParaMostrar.length,
    itemListElement: camposParaMostrar.map((c, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${baseUrl}/${lang}/campo/${c.id}`,
      name: isEn && c.nome_en ? c.nome_en : c.nome,
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      {/* SCRIPTS JSON-LD PARA RICH SNIPPETS NO GOOGLE */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* HERO SEO LOCAL & SAZONAL */}
      <section className="bg-[#0F172A] text-white pt-16 pb-20 px-4 md:px-8 border-b-8 border-[#F59E0B] relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto relative z-10">
          {/* Breadcrumbs Visuais */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-6"
          >
            <Link href={`/${lang}`} className="hover:text-[#F59E0B] text-slate-300 no-underline">
              {isEn ? "Home" : "Início"}
            </Link>
            <span>/</span>
            <Link
              href={`/${lang}/${cleanCat}/portugal`}
              className="hover:text-[#F59E0B] text-slate-300 no-underline"
            >
              {isEn ? infoCat.en : infoCat.pt}
            </Link>
            <span>/</span>
            <span className="text-[#F59E0B]">{isEn ? infoLoc.en : infoLoc.pt}</span>
          </nav>

          <div className="inline-flex items-center gap-2 bg-[#2563EB] text-white text-[11px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-md mb-4">
            <span>🏕️</span>
            {isEn
              ? `Verified Programs ${anoAtual}`
              : `Programas Verificados ${anoAtual}`}
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
            {isEn
              ? `${infoCat.en} in ${infoLoc.en}`
              : `${infoCat.pt} ${infoLoc.preposicaoPt}`}
          </h1>

          <p className="text-slate-300 text-base md:text-xl font-medium max-w-3xl leading-relaxed mb-8">
            {isEn
              ? `Compare and book the best ${infoCat.en.toLowerCase()} in ${infoLoc.en}. Find day camps and residential programs for kids and teens with verified safety and direct online registration.`
              : `Descubra e compare os melhores ${infoCat.pt.toLowerCase()} ${infoLoc.preposicaoPt} para crianças e jovens. Opções em regime diário (externato) ou residencial com alojamento, monitores credenciados e inscrição 100% segura.`}
          </p>

          {/* Barra Rápida de Filtros de Época e Temática (Links Limpos) */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {[
              { slug: "verao", labelPt: "☀️ Férias de Verão", labelEn: "☀️ Summer Camps" },
              { slug: "natal", labelPt: "🎄 Férias de Natal", labelEn: "🎄 Christmas Camps" },
              { slug: "pascoa", labelPt: "🐣 Férias da Páscoa", labelEn: "🐣 Easter Camps" },
              { slug: "aventura", labelPt: "🧭 Aventura & Natureza", labelEn: "🧭 Adventure" },
              { slug: "surf", labelPt: "🏄‍♂️ Surf Camps", labelEn: "🏄‍♂️ Surf Camps" },
              { slug: "desporto", labelPt: "⚽ Desporto", labelEn: "⚽ Sports" },
              { slug: "linguas", labelPt: "🇬🇧 Línguas", labelEn: "🇬🇧 Languages" },
            ].map((item) => {
              const ativo = cleanCat === item.slug;
              return (
                <Link
                  key={item.slug}
                  href={`/${lang}/${item.slug}/${cleanLoc}`}
                  className={`px-4 py-2 rounded-md text-xs font-black uppercase tracking-wider no-underline transition-all ${
                    ativo
                      ? "bg-[#F59E0B] text-[#0F172A] shadow-md"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  {isEn ? item.labelEn : item.labelPt}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* LISTAGEM DE CAMPOS */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-16">
        {exatos.length === 0 && (
          <div className="bg-amber-50 border-l-4 border-[#F59E0B] p-6 rounded-md mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base md:text-lg font-black text-[#0F172A] m-0 mb-1">
                {isEn
                  ? `Exploring the closest available programs for ${infoCat.en} in ${infoLoc.en}`
                  : `A atualizar novas vagas de ${infoCat.pt} ${infoLoc.preposicaoPt}`}
              </h2>
              <p className="text-xs md:text-sm text-slate-600 m-0 font-medium">
                {isEn
                  ? "Check out these highly-rated camps available for booking right now or explore all filters."
                  : "Enquanto validamos novos turnos específicos para esta pesquisa, conheça abaixo os campos de férias em destaque mais procurados pelas famílias."}
              </p>
            </div>
            <Link
              href={`/${lang}/pesquisa`}
              className="bg-[#0F172A] hover:bg-[#2563EB] text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-md no-underline shrink-0"
            >
              {isEn ? "View All Camps →" : "Ver Todos os Campos →"}
            </Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-black text-[#2563EB] uppercase tracking-widest block mb-1">
              {isEn ? "Direct Online Booking" : "Inscrições Abertas"}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-[#0F172A] m-0">
              {exatos.length > 0
                ? isEn
                  ? `${exatos.length} ${infoCat.en} Available in ${infoLoc.en}`
                  : `${exatos.length} ${infoCat.pt} Disponíveis ${infoLoc.preposicaoPt}`
                : isEn
                ? `Recommended Camps for ${infoLoc.en}`
                : `Campos de Férias Recomendados`}
            </h2>
          </div>

          <Link
            href={`/${lang}/mapa`}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-[#2563EB] text-[#0F172A] px-4 py-2.5 rounded-md text-xs font-black uppercase tracking-wider no-underline shadow-sm"
          >
            <span>🗺️</span> {isEn ? "See on Interactive Map" : "Ver no Mapa Interativo"}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {camposParaMostrar.map((campo: any) => {
            const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
            const catCampo =
              isEn && campo.categoria_en ? campo.categoria_en : campo.categoria || "Campo de Férias";
            const localCampo =
              isEn && campo.local_en
                ? campo.local_en
                : campo.local || campo.Distrito || campo.Pais || "Portugal";

            let precoVisivel = Number(campo.preco) || 0;
            if (!precoVisivel && Array.isArray(campo.pacotes) && campo.pacotes.length > 0) {
              const todosPrecos = campo.pacotes
                .flatMap((p: any) => p.variantes?.map((v: any) => Number(v.preco) || 0) || [])
                .filter((val: number) => val > 0);
              if (todosPrecos.length > 0) precoVisivel = Math.min(...todosPrecos);
            }

            const imgUrl =
              campo.imagem && campo.imagem.startsWith("http")
                ? campo.imagem
                : Array.isArray(campo.galeria) &&
                  campo.galeria.length > 0 &&
                  campo.galeria[0]?.startsWith("http")
                ? campo.galeria[0]
                : "/og-image.jpg";

            return (
              <article
                key={campo.id}
                className="group flex flex-col bg-white border border-slate-200/80 rounded-md shadow-sm hover:shadow-xl hover:border-[#2563EB] transition-all duration-300 hover:-translate-y-1 overflow-hidden relative"
              >
                <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10">
                  <span className="sr-only">{nomeCampo}</span>
                </Link>

                <div className="absolute top-4 right-4 z-20">
                  <BotaoFavorito campoId={campo.id} />
                </div>

                <div className="relative h-60 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={`${nomeCampo} - ${localCampo}`}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#0F172A] rounded-md shadow-sm">
                    {catCampo}
                  </div>
                </div>

                <div className="flex flex-col p-6 flex-1 pointer-events-none">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    <span>📍 {localCampo}</span>
                    {campo.idade && <span>• 👶 {campo.idade}</span>}
                  </div>

                  <h3 className="text-xl font-black text-[#0F172A] leading-snug mb-4 line-clamp-2">
                    {nomeCampo}
                  </h3>

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                        {isEn ? "From" : "Desde"}
                      </span>
                      <span className="text-2xl font-black text-[#2563EB]">
                        {precoVisivel > 0 ? `${precoVisivel}€` : isEn ? "On Request" : "Sob Consulta"}
                      </span>
                    </div>
                    <span className="bg-[#0F172A] group-hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-md text-xs font-black uppercase tracking-widest transition-colors shadow-sm">
                      {isEn ? "View Camp" : "Ver Vagas"}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* SECÇÃO DE CONTEÚDO RICO (H2, H3) + FAQ PARA INTENÇÃO DE BUSCA DO GOOGLE */}
      <section className="bg-white border-t border-slate-200 py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14">
            <span className="inline-block bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-3">
              {isEn ? "Complete Parents Guide" : "Guia Completo para as Famílias"}
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#0F172A] mb-4">
              {isEn
                ? `How to choose the best ${infoCat.en} in ${infoLoc.en}?`
                : `Como escolher os melhores ${infoCat.pt} ${infoLoc.preposicaoPt}?`}
            </h2>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium">
              {isEn
                ? `Choosing a holiday camp in ${infoLoc.en} is an investment in your child's autonomy, friendships, and happiness. On HelloCamp, we gather verified organizers offering programs during Summer, Christmas, Easter, and Carnival so you can compare everything in one place.`
                : `Escolher um campo de férias ${infoLoc.preposicaoPt} é proporcionar às crianças e jovens uma experiência inesquecível de autonomia, convívio sem ecrãs e contacto com novas atividades. Na HelloCamp reunimos organizadores verificados com programas de Verão, Natal, Páscoa e Carnaval para que possa comparar horários, preços e atividades num único portal.`}
            </p>
          </div>

          {/* 3 Pilares Estruturados com H3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-[#F8FAFC] p-6 rounded-md border border-slate-200">
              <h3 className="text-base font-black text-[#0F172A] mb-2">
                {isEn ? "1. Day Camp vs. Residential" : "1. Externato ou Residencial"}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium m-0">
                {isEn
                  ? `In ${infoLoc.en}, you can choose daily programs (drop-off at 9am and pick-up at 5pm, with lunch included) or overnight residential camps with 24/7 supervision.`
                  : `Pode optar por campos de férias diários ${infoLoc.preposicaoPt} (entrega de manhã e recolha ao final da tarde, ideais para conciliar com o trabalho dos pais) ou campos residenciais com dormida e pensão completa.`}
              </p>
            </div>

            <div className="bg-[#F8FAFC] p-6 rounded-md border border-slate-200">
              <h3 className="text-base font-black text-[#0F172A] mb-2">
                {isEn ? "2. Certified Safety & Monitors" : "2. Segurança e Ficha Médica"}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium m-0">
                {isEn
                  ? "Every booking includes our Digital Medical Form where parents register food allergies, medication, and authorized pick-up contacts."
                  : "Todas as inscrições contam com Ficha Clínica Digital única: indique alergias alimentares, restrições ou medicação uma só vez e a equipa coordenadora recebe os alertas na hora."}
              </p>
            </div>

            <div className="bg-[#F8FAFC] p-6 rounded-md border border-slate-200">
              <h3 className="text-base font-black text-[#0F172A] mb-2">
                {isEn ? "3. All Seasons & Themes" : "3. Aventura, Desporto e Línguas"}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium m-0">
                {isEn
                  ? "From surf, football, and nature adventure camps to intensive English courses and tech workshops."
                  : "Desde campos de férias de aventura na natureza, surf e desporto até cursos de línguas e oficinas criativas nas férias de Verão, Natal e Páscoa."}
              </p>
            </div>
          </div>

          {/* FAQ Estruturado */}
          <h2 className="text-2xl md:text-3xl font-black text-[#0F172A] mb-6">
            {isEn
              ? `Frequently Asked Questions about Camps in ${infoLoc.en}`
              : `Perguntas Frequentes sobre ${infoCat.pt} ${infoLoc.preposicaoPt}`}
          </h2>

          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="bg-[#F8FAFC] border border-slate-200 rounded-md p-6">
                <h3 className="text-base md:text-lg font-black text-[#0F172A] m-0 mb-2">
                  {f.q}
                </h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium m-0">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MALHA DE INTERNAL LINKING SEO (Outras Localidades e Categorias) */}
      <section className="bg-[#F8FAFC] border-t border-slate-200 py-14 px-4 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
            {isEn
              ? "Explore Other Popular Locations & Themes"
              : "Explore Outras Localidades, Épocas e Categorias de Campos de Férias"}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { href: `/${lang}/campos-de-ferias/anadia`, label: "Campos de Férias na Anadia" },
              { href: `/${lang}/campos-de-ferias/cascais`, label: "Campos de Férias em Cascais" },
              { href: `/${lang}/campos-de-ferias/lisboa`, label: "Campos de Férias em Lisboa" },
              { href: `/${lang}/campos-de-ferias/porto`, label: "Campos de Férias no Porto" },
              { href: `/${lang}/verao/portugal`, label: "Campos de Férias de Verão" },
              { href: `/${lang}/natal/portugal`, label: "Campos de Férias de Natal" },
              { href: `/${lang}/pascoa/portugal`, label: "Campos de Férias da Páscoa" },
              { href: `/${lang}/aventura/portugal`, label: "Campos de Férias de Aventura" },
              { href: `/${lang}/linguas/portugal`, label: "Campos de Férias de Línguas" },
              { href: `/${lang}/surf/portugal`, label: "Campos de Férias de Surf" },
              { href: `/${lang}/desporto/lisboa`, label: "Campos Desportivos em Lisboa" },
              { href: `/${lang}/ingles/reino-unido`, label: "Campos de Inglês no Reino Unido" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white border border-slate-200 hover:border-[#2563EB] text-slate-700 hover:text-[#2563EB] text-xs font-bold px-3.5 py-2.5 rounded-md no-underline transition-colors truncate"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
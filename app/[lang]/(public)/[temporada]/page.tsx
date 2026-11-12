import React from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Metadata } from "next";
import BotaoFavorito from "../components/BotaoFavorito";

export const dynamic = "force-dynamic";

function normalizeStr(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Dicionário de Temporadas suportadas para SEO de Topo
const MAPA_TEMPORADAS: Record<
  string,
  {
    pt: string;
    en: string;
    descricaoPt: string;
    descricaoEn: string;
    termosBusca: string[];
    icone: string;
  }
> = {
  verao: {
    pt: "Campos de Férias de Verão",
    en: "Summer Holiday Camps",
    descricaoPt: "Descubra os melhores campos de férias de verão (junho, julho, agosto e setembro). Programas residenciais e de externato com aventura, surf, desporto e atividades ao ar livre.",
    descricaoEn: "Discover the best summer camps for children and teens. Compare residential and day camp programs with sports, adventure, and outdoor activities.",
    termosBusca: ["verao", "summer", "julho", "agosto", "junho", "setembro"],
    icone: "☀️",
  },
  natal: {
    pt: "Campos de Férias de Natal",
    en: "Christmas Holiday Camps",
    descricaoPt: "Encontre os melhores campos de férias e ateliês de Natal para ocupar as pausas escolares dos mais novos com muita diversão, oficinas criativas e desporto.",
    descricaoEn: "Find the best Christmas holiday camps and creative workshops to keep kids entertained during the school winter break.",
    termosBusca: ["natal", "christmas", "dezembro", "inverno"],
    icone: "🎄",
  },
  pascoa: {
    pt: "Campos de Férias da Páscoa",
    en: "Easter Holiday Camps",
    descricaoPt: "Explore programas e campos de férias para a interrupção letiva da Páscoa. Atividades desportivas, científicas e artísticas para crianças e jovens.",
    descricaoEn: "Explore Easter holiday camp programs and spring activities for children and teenagers.",
    termosBusca: ["pascoa", "easter", "abril", "marco"],
    icone: "🐣",
  },
  carnaval: {
    pt: "Campos de Férias de Carnaval",
    en: "Carnival Holiday Camps",
    descricaoPt: "Atividades e campos de férias de curta duração para o fim de semana e pausa de Carnaval.",
    descricaoEn: "Short-term holiday camps and fun activities for the Carnival school break.",
    termosBusca: ["carnaval", "fevereiro"],
    icone: "🎭",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; temporada: string }>;
}): Promise<Metadata> {
  const { lang, temporada } = await params;
  const isEn = lang === "en";
  const anoAtual = new Date().getFullYear();

  const tempNorm = normalizeStr(temporada);
  const dadosTemp = MAPA_TEMPORADAS[tempNorm] || {
    pt: `Campos de Férias de ${temporada}`,
    en: `${temporada} Camps`,
    descricaoPt: `Procura campos de férias para ${temporada}? Compare preços e reserve online na HelloCamp.`,
    descricaoEn: `Looking for ${temporada} camps? Compare prices and book online on HelloCamp.`,
  };

  const metaTitle = isEn
    ? `Best ${dadosTemp.en} (${anoAtual}) | Direct Booking`
    : `${dadosTemp.pt} (${anoAtual}) | Preços e Inscrições Online`;

  const metaDesc = isEn ? dadosTemp.descricaoEn : dadosTemp.descricaoPt;

  return {
    title: metaTitle,
    description: metaDesc,
    alternates: {
      canonical: `https://www.hellocamp.pt/${lang}/${tempNorm}`,
      languages: {
        "pt-PT": `https://www.hellocamp.pt/pt/${tempNorm}`,
        "en-US": `https://www.hellocamp.pt/en/${tempNorm}`,
      },
    },
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: `https://www.hellocamp.pt/${lang}/${tempNorm}`,
      siteName: "HelloCamp",
      locale: isEn ? "en_US" : "pt_PT",
      type: "website",
    },
  };
}

export default async function TemporadaPage({
  params,
}: {
  params: Promise<{ lang: string; temporada: string }>;
}) {
  const { lang, temporada } = await params;
  const isEn = lang === "en";
  const anoAtual = new Date().getFullYear();

  const tempNorm = normalizeStr(temporada);
  const dadosTemp = MAPA_TEMPORADAS[tempNorm] || {
    pt: `Campos de Férias de ${temporada}`,
    en: `${temporada} Camps`,
    descricaoPt: `Programas verificados para ${temporada}.`,
    descricaoEn: `Verified programs for ${temporada}.`,
    termosBusca: [tempNorm],
    icone: "🏕️",
  };

  // Buscar todos os campos ativos
  const { data: todosCampos } = await supabase
    .from("campos")
    .select("*")
    .eq("ativo", true);

  const listaCampos = todosCampos || [];

  // Filtragem inteligente por termos da época
  const camposDaTemporada = listaCampos.filter((c) => {
    if (tempNorm === "verao") return true; // Verão engloba praticamente todos os campos ativos
    const texto = normalizeStr(
      `${c.nome || ""} ${c.categoria || ""} ${c.descricao || ""} ${JSON.stringify(
        c.pacotes || ""
      )}`
    );
    return dadosTemp.termosBusca.some((termo) => texto.includes(termo));
  });

  const camposParaMostrar = camposDaTemporada.length > 0 ? camposDaTemporada : listaCampos.slice(0, 6);

  // Preço mínimo global para Rich Snippets
  let precoMinimo = 0;
  camposParaMostrar.forEach((c) => {
    let p = Number(c.preco) || 0;
    if (!p && Array.isArray(c.pacotes) && c.pacotes.length > 0) {
      const precos = c.pacotes
        .flatMap((pac: any) => pac.variantes?.map((v: any) => Number(v.preco) || 0) || [])
        .filter((val: number) => val > 0);
      if (precos.length > 0) p = Math.min(...precos);
    }
    if (p > 0 && (precoMinimo === 0 || p < precoMinimo)) precoMinimo = p;
  });

  // FAQs para SEO
  const faqs = isEn
    ? [
        {
          q: `When do ${dadosTemp.en} take place?`,
          a: `Programs are scheduled according to the school break calendar. You can check exact weekly dates, day camp (externato) or residential options directly on each camp's profile.`,
        },
        {
          q: `What is the average price for ${dadosTemp.en.toLowerCase()}?`,
          a: `Prices on HelloCamp start from ${
            precoMinimo > 0 ? `${precoMinimo}€` : "competitive weekly rates"
          }, including activities, qualified monitors, and digital insurance.`,
        },
        {
          q: `How does registration work?`,
          a: `You can compare programs, fill out the secure digital medical form, and book online with instant confirmation.`,
        },
      ]
    : [
        {
          q: `Quando se realizam os ${dadosTemp.pt.toLowerCase()}?`,
          a: `Os programas decorrem durante a interrupção letiva correspondente. Pode consultar os turnos semanais exatos, horários de acolhimento e se incluem regime residencial ou de externato diretamente na página de cada campo.`,
        },
        {
          q: `Qual é o preço médio para estes campos de férias?`,
          a: `Os valores na HelloCamp começam desde ${
            precoMinimo > 0 ? `${precoMinimo}€` : "opções semanais acessíveis"
          }, variando consoante o programa inclua alojamento e pensão completa ou apenas atividades diárias.`,
        },
        {
          q: `Como posso garantir a vaga para o meu filho?`,
          a: `Basta comparar as opções disponíveis, preencher a Ficha Clínica Digital integrada na reserva e garantir a vaga com pagamento seguro ou sinal de 30% nos campos elegíveis.`,
        },
      ];

  const baseUrl = "https://www.hellocamp.pt";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isEn ? "Home" : "Início", item: `${baseUrl}/${lang}` },
      { "@type": "ListItem", position: 2, name: isEn ? dadosTemp.en : dadosTemp.pt, item: `${baseUrl}/${lang}/${tempNorm}` },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isEn ? dadosTemp.en : dadosTemp.pt,
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
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* HERO SECTION */}
      <section className="bg-[#0F172A] text-white pt-16 pb-20 px-4 md:px-8 border-b-8 border-[#F59E0B] relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto relative z-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            <Link href={`/${lang}`} className="hover:text-[#F59E0B] text-slate-300 no-underline">{isEn ? "Home" : "Início"}</Link>
            <span>/</span>
            <span className="text-[#F59E0B]">{isEn ? dadosTemp.en : dadosTemp.pt}</span>
          </nav>

          <div className="inline-flex items-center gap-2 bg-[#2563EB] text-white text-[11px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-md mb-4">
            <span>{dadosTemp.icone}</span>
            {isEn ? `Season ${anoAtual}` : `Edição ${anoAtual}`}
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
            {isEn ? dadosTemp.en : dadosTemp.pt}
          </h1>

          <p className="text-slate-300 text-base md:text-xl font-medium max-w-3xl leading-relaxed mb-8">
            {isEn ? dadosTemp.descricaoEn : dadosTemp.descricaoPt}
          </p>

          {/* Links Rápidos para Outras Épocas */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {[
              { slug: "verao", label: "☀️ Verão" },
              { slug: "natal", label: "🎄 Natal" },
              { slug: "pascoa", label: "🐣 Páscoa" },
              { slug: "carnaval", label: "🎭 Carnaval" },
              { slug: "aventura", label: "🧭 Aventura" },
            ].map((e) => (
              <Link
                key={e.slug}
                href={`/${lang}/${e.slug}`}
                className={`px-4 py-2 rounded-md text-xs font-black uppercase tracking-wider no-underline transition-all ${
                  tempNorm === e.slug ? "bg-[#F59E0B] text-[#0F172A]" : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {e.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LISTAGEM */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-black text-[#2563EB] uppercase tracking-widest block mb-1">
              {isEn ? "Direct Registration" : "Inscrições Abertas"}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-[#0F172A] m-0">
              {isEn ? `${camposParaMostrar.length} Programs Available` : `${camposParaMostrar.length} Programas Disponíveis`}
            </h2>
          </div>
          <Link
            href={`/${lang}/pesquisa`}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-[#2563EB] text-[#0F172A] px-4 py-2.5 rounded-md text-xs font-black uppercase tracking-wider no-underline shadow-sm"
          >
            <span>🔍</span> {isEn ? "Advanced Search" : "Pesquisa Avançada"}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {camposParaMostrar.map((campo: any) => {
            const nome = isEn && campo.nome_en ? campo.nome_en : campo.nome;
            const cat = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria || "Campo de Férias";
            const local = isEn && campo.local_en ? campo.local_en : campo.local || campo.Distrito || "Portugal";

            let preco = Number(campo.preco) || 0;
            if (!preco && Array.isArray(campo.pacotes) && campo.pacotes.length > 0) {
              const precos = campo.pacotes.flatMap((p: any) => p.variantes?.map((v: any) => Number(v.preco) || 0) || []).filter((v: number) => v > 0);
              if (precos.length > 0) preco = Math.min(...precos);
            }

            const img = campo.imagem && campo.imagem.startsWith("http") ? campo.imagem : "/og-image.jpg";

            return (
              <article key={campo.id} className="group flex flex-col bg-white border border-slate-200 rounded-md shadow-sm hover:shadow-xl hover:border-[#2563EB] transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
                <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">{nome}</span></Link>
                <div className="absolute top-4 right-4 z-20"><BotaoFavorito campoId={campo.id} /></div>

                <div className="relative h-60 w-full bg-slate-100 overflow-hidden">
                  <img src={img} alt={nome} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-4 left-4 bg-white/95 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#0F172A] rounded-md shadow-sm">{cat}</div>
                </div>

                <div className="flex flex-col p-6 flex-1 pointer-events-none">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">📍 {local}</div>
                  <h3 className="text-xl font-black text-[#0F172A] leading-snug mb-4 line-clamp-2">{nome}</h3>

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isEn ? "From" : "Desde"}</span>
                      <span className="text-2xl font-black text-[#2563EB]">{preco > 0 ? `${preco}€` : "Sob Consulta"}</span>
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

      {/* SEO FAQ SECTION */}
      <section className="bg-white border-t border-slate-200 py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-[#0F172A] mb-6">
            {isEn ? `FAQ about ${dadosTemp.en}` : `Perguntas Frequentes sobre ${dadosTemp.pt}`}
          </h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="bg-[#F8FAFC] border border-slate-200 rounded-md p-6">
                <h3 className="text-base font-black text-[#0F172A] m-0 mb-2">{f.q}</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium m-0">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
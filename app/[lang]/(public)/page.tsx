import React from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Metadata } from "next";
import { getDictionary } from "@/lib/getDictionary";
import BotaoFavorito from "./components/BotaoFavorito";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isEn = lang === "en";
  const ano = new Date().getFullYear();

  return {
    title: isEn
      ? `HelloCamp | Best Summer Camps, Sports & Language Programs (${ano})`
      : `HelloCamp | Os Melhores Campos de Férias de Verão, Natal, Aventura e Línguas (${ano})`,
    description: isEn
      ? "Compare and book verified summer camps, adventure camps, surf schools, and language courses in Portugal (Lisbon, Cascais, Porto, Anadia) and Europe."
      : "Descubra e reserve os melhores campos de férias em Portugal (Lisboa, Cascais, Porto, Anadia, Algarve) e na Europa. Férias de Verão, Natal, Páscoa, Aventura, Desporto e Línguas.",
    alternates: {
      canonical: `https://www.hellocamp.pt/${lang}`,
      languages: {
        "pt-PT": "https://www.hellocamp.pt/pt",
        "en-US": "https://www.hellocamp.pt/en",
      },
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isEn = lang === "en";
  await getDictionary(lang as "pt" | "en");

  const todayISO = new Date().toISOString().split("T")[0];

  // Carrega todos os campos ativos para alimentar os destaques e validar que regiões/países têm oferta ativa
  const { data: todosCamposAtivos } = await supabase
    .from("campos")
    .select("*")
    .eq("ativo", true);

  const listaAtivos = todosCamposAtivos || [];
  const camposDeFerias = listaAtivos.slice(0, 6);

  // Catálogo base de Distritos e Países com fotografias de alta qualidade
  const CATALOGO_DISTRITOS = [
    {
      nome: "Lisboa",
      nome_en: "Lisbon",
      termos: ["lisboa", "cascais", "sintra", "oeiras", "amadora", "alfragide", "estoril"],
      imagem:
        "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&q=80&w=1200",
    },
    {
      nome: "Aveiro",
      nome_en: "Aveiro & Anadia",
      termos: ["aveiro", "anadia", "bairrada", "ilhavo", "espinho"],
      imagem:
        "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=1200",
    },
    {
      nome: "Porto",
      nome_en: "Porto",
      termos: ["porto", "matosinhos", "gaia", "maia"],
      imagem:
        "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=1200",
    },
    {
      nome: "Faro",
      nome_en: "Faro (Algarve)",
      termos: ["faro", "algarve", "lagos", "portimao", "albufeira"],
      imagem:
        "https://images.unsplash.com/photo-1533556019545-21d7b322a46c?auto=format&fit=crop&q=80&w=1200",
    },
    {
      nome: "Setúbal",
      nome_en: "Setúbal & Caparica",
      termos: ["setubal", "caparica", "almada", "sesimbra", "azeitao"],
      imagem:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
    },
    {
      nome: "Coimbra",
      nome_en: "Coimbra",
      termos: ["coimbra", "figueira da foz"],
      imagem:
        "https://images.unsplash.com/photo-1563806229-37330eb02d33?auto=format&fit=crop&q=80&w=1200",
    },
    {
      nome: "Braga",
      nome_en: "Braga",
      termos: ["braga", "guimaraes", "geres"],
      imagem:
        "https://images.unsplash.com/photo-1563806229-37330eb02d33?auto=format&fit=crop&q=80&w=1200",
    },
  ];

  const CATALOGO_PAISES = [
    {
      nome: "Portugal",
      nome_en: "Portugal",
      termos: ["portugal", "lisboa", "porto", "aveiro", "anadia", "cascais", "setubal", "algarve"],
      imagem:
        "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=800",
      desc: "Natureza, Aventura, Desporto e Sol",
      desc_en: "Nature, Adventure, Sports and Sun",
    },
    {
      nome: "Espanha",
      nome_en: "Spain",
      termos: ["espanha", "spain", "barcelona", "alicante", "madrid", "lanzarote", "canarias", "famara"],
      imagem:
        "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&q=80&w=800",
      desc: "Surf Camps, Línguas e Desporto",
      desc_en: "Surf Camps, Languages and Sports",
    },
    {
      nome: "Reino Unido",
      nome_en: "United Kingdom",
      termos: ["reino unido", "united kingdom", "uk", "cambridge", "ely", "londres", "england"],
      imagem:
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800",
      desc: "Imersão em Inglês Nativo",
      desc_en: "Native English Immersion",
    },
    {
      nome: "Malta",
      nome_en: "Malta",
      termos: ["malta"],
      imagem:
        "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&q=80&w=800",
      desc: "Cursos de Inglês e Praia no Mediterrâneo",
      desc_en: "English Courses & Mediterranean Sun",
    },
    {
      nome: "África do Sul",
      nome_en: "South Africa",
      termos: ["africa do sul", "south africa", "cape town", "cidade do cabo"],
      imagem:
        "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&q=80&w=800",
      desc: "Inglês e Aventura Safari",
      desc_en: "English & Safari Adventure",
    },
  ];

  // Filtra apenas os Distritos e Países que têm campos ativos no momento
  const distritosAtivosCards = CATALOGO_DISTRITOS.filter((dist) =>
    listaAtivos.some((c) => {
      const txt = normalizeStr(`${c.Distrito || ""} ${c.local || ""} ${c.nome || ""}`);
      return dist.termos.some((t) => txt.includes(t));
    })
  );

  const paisesAtivosCards = CATALOGO_PAISES.filter((pais) =>
    listaAtivos.some((c) => {
      const txt = normalizeStr(`${c.Pais || ""} ${c.Distrito || ""} ${c.local || ""} ${c.nome || ""}`);
      return pais.termos.some((t) => txt.includes(t));
    })
  );

  // Opções para os selects da barra de pesquisa baseadas nos ativos
  const paisesOpcoes =
    paisesAtivosCards.length > 0
      ? paisesAtivosCards.map((p) => ({ valor: p.nome, label: isEn ? p.nome_en : p.nome }))
      : [
          { valor: "Portugal", label: "Portugal" },
          { valor: "Espanha", label: isEn ? "Spain" : "Espanha" },
          { valor: "Reino Unido", label: isEn ? "United Kingdom" : "Reino Unido" },
        ];

  const distritosOpcoes = [
    { valor: "Lisboa", label: "Lisboa / Cascais" },
    { valor: "Aveiro", label: "Aveiro / Anadia" },
    { valor: "Porto", label: "Porto" },
    { valor: "Setúbal", label: "Setúbal / Caparica" },
    { valor: "Faro", label: "Faro (Algarve)" },
    { valor: "Coimbra", label: "Coimbra" },
  ];

  const categoriasOpcoes = [
    { valor: "Aventura", label: isEn ? "Adventure & Nature" : "Aventura & Natureza" },
    { valor: "Desporto", label: isEn ? "Sports" : "Desporto" },
    { valor: "Surf", label: "Surf & Náutica" },
    { valor: "Línguas", label: isEn ? "Languages (English/Spanish)" : "Línguas" },
    { valor: "Tecnologia", label: isEn ? "Tech & Science" : "Tecnologia & Ciência" },
    { valor: "Artes", label: isEn ? "Arts & Creativity" : "Artes & Criatividade" },
  ];

  const idadesOpcoes = [
    { valor: "3-6", label: isEn ? "3 to 6 years" : "3 a 6 anos" },
    { valor: "7-12", label: isEn ? "7 to 12 years" : "7 a 12 anos" },
    { valor: "13-18", label: isEn ? "13 to 18 years" : "13 a 18 anos" },
  ];

  // Links de SEO Programático Limpos (Intenção Local, Sazonal e por Categoria)
  const LINKS_SEO_PROGRAMATICOS = [
    { url: "campos-de-ferias/anadia", pt: "Campos de Férias na Anadia", en: "Summer Camps in Anadia" },
    { url: "campos-de-ferias/cascais", pt: "Campos de Férias em Cascais", en: "Summer Camps in Cascais" },
    { url: "campos-de-ferias/lisboa", pt: "Campos de Férias em Lisboa", en: "Summer Camps in Lisbon" },
    { url: "campos-de-ferias/porto", pt: "Campos de Férias no Porto", en: "Summer Camps in Porto" },
    { url: "verao/portugal", pt: "Campos de Férias de Verão", en: "Summer Holiday Camps" },
    { url: "natal/portugal", pt: "Campos de Férias de Natal", en: "Christmas Holiday Camps" },
    { url: "pascoa/portugal", pt: "Campos de Férias da Páscoa", en: "Easter Holiday Camps" },
    { url: "aventura/portugal", pt: "Campos de Férias de Aventura", en: "Adventure Camps in Portugal" },
    { url: "linguas/portugal", pt: "Campos de Férias de Línguas", en: "Language Camps" },
    { url: "surf/portugal", pt: "Campos de Férias de Surf", en: "Surf Camps in Portugal" },
    { url: "ingles/reino-unido", pt: "Cursos de Inglês no Reino Unido", en: "English Camps in the UK" },
    { url: "aventura/anadia", pt: "Campos de Aventura na Anadia", en: "Adventure Camps in Anadia" },
  ];

  // JSON-LD da Organização e Motor de Busca (Sitelinks Searchbox no Google)
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HelloCamp",
    url: "https://www.hellocamp.pt",
    potentialAction: {
      "@type": "SearchAction",
      target: `https://www.hellocamp.pt/${lang}/pesquisa?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* HERO SECTION COM IMAGEM DE CAPA GRANDE */}
      <section className="relative min-h-[85vh] w-full flex flex-col items-center justify-center pt-16 pb-32">
        <div className="absolute inset-0 z-0 bg-[#0F172A] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=2000"
            alt="Crianças e jovens em atividades de campo de férias na natureza"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/60 via-transparent to-[#F8FAFC]/20" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6 flex flex-col items-center mt-8">
          <div className="text-center mb-10 md:mb-14 w-full">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-md text-xs font-black uppercase tracking-widest text-[#F59E0B] mb-6 backdrop-blur-md shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-pulse" />
              {isEn ? "More than a holiday camp" : "Mais que um campo de férias"}
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight drop-shadow-lg">
              {isEn ? "Camps that create great stories." : "Campos que criam grandes histórias."}
            </h1>
            <p className="mt-4 md:mt-6 text-lg md:text-2xl font-medium text-slate-200 tracking-wide leading-relaxed max-w-3xl mx-auto drop-shadow-md">
              {isEn
                ? "Explore, learn, and grow in one place. Summer, Christmas, Easter, Adventure, Sports & Languages."
                : "Explora, aprende e cresce num só lugar. Campos de férias de Verão, Natal, Aventura, Desporto e Línguas."}
            </p>
          </div>

          {/* CAIXA DE PESQUISA AVANÇADA */}
          <div
            id="pesquisa"
            className="relative w-full bg-white rounded-md shadow-2xl p-6 md:p-10 border border-slate-100 scroll-mt-24"
          >
            <form action={`/${lang}/pesquisa`} method="GET" className="relative pb-10 md:pb-4 mt-2">
              <div className="flex justify-between items-end mb-4">
                <span className="text-xs font-black text-[#0F172A] uppercase tracking-widest hidden sm:block">
                  {isEn ? "Find your next adventure" : "Encontra a próxima aventura"}
                </span>

                <Link
                  href={`/${lang}/mapa`}
                  className="inline-flex items-center gap-2 bg-[#F8FAFC] text-[#2563EB] hover:bg-blue-50 px-4 py-2 rounded-md text-xs font-black no-underline transition-colors ml-auto shadow-sm border border-slate-200"
                >
                  <span>🗺️</span> {isEn ? "Interactive Map" : "Ver no Mapa"}
                </Link>
              </div>

              <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-lg">🔍</span>
                </div>
                <input
                  type="text"
                  name="q"
                  placeholder={
                    isEn
                      ? "What are you looking for? (e.g. Adventure in Anadia, Surf in Cascais...)"
                      : "O que procura? (ex: Aventura na Anadia, Campos em Cascais, Surf, Inglês...)"
                  }
                  className="w-full pl-12 pr-4 py-4 rounded-md bg-[#F8FAFC] border border-slate-200 text-[#0F172A] text-base font-bold outline-none focus:bg-white focus:border-[#2563EB] transition-all placeholder:text-slate-400 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    {isEn ? "Country" : "País"}
                  </label>
                  <select
                    name="pais"
                    className="w-full appearance-none rounded-md bg-[#F8FAFC] px-4 py-3.5 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-[#2563EB] cursor-pointer transition-all shadow-sm"
                  >
                    <option value="">{isEn ? "All Countries" : "Todos"}</option>
                    {paisesOpcoes.map((p) => (
                      <option key={p.valor} value={p.valor}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    {isEn ? "District / Region" : "Distrito / Região"}
                  </label>
                  <select
                    name="distrito"
                    className="w-full appearance-none rounded-md bg-[#F8FAFC] px-4 py-3.5 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-[#2563EB] cursor-pointer transition-all shadow-sm"
                  >
                    <option value="">{isEn ? "All Regions" : "Todos os Distritos"}</option>
                    {distritosOpcoes.map((d) => (
                      <option key={d.valor} value={d.valor}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    {isEn ? "Category" : "Categoria"}
                  </label>
                  <select
                    name="categoria"
                    className="w-full appearance-none rounded-md bg-[#F8FAFC] px-4 py-3.5 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-[#2563EB] cursor-pointer transition-all shadow-sm"
                  >
                    <option value="">{isEn ? "All Categories" : "Todas as Categorias"}</option>
                    {categoriasOpcoes.map((cat) => (
                      <option key={cat.valor} value={cat.valor}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    {isEn ? "Ages" : "Faixa Etária"}
                  </label>
                  <select
                    name="idade"
                    className="w-full appearance-none rounded-md bg-[#F8FAFC] px-4 py-3.5 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-[#2563EB] cursor-pointer transition-all shadow-sm"
                  >
                    <option value="">{isEn ? "All Ages" : "Todas as Idades"}</option>
                    {idadesOpcoes.map((faixa) => (
                      <option key={faixa.valor} value={faixa.valor}>
                        {faixa.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                    {isEn ? "Start Date" : "Data de Início"}
                  </label>
                  <input
                    type="date"
                    name="data"
                    min={todayISO}
                    className="w-full appearance-none rounded-md bg-[#F8FAFC] px-4 py-3 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-[#2563EB] cursor-pointer transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex justify-center mt-8 md:absolute md:-bottom-[4rem] md:left-1/2 md:-translate-x-1/2">
                <button
                  type="submit"
                  className="group w-full md:w-64 bg-[#F59E0B] hover:bg-amber-500 rounded-md flex items-center justify-center gap-3 py-4 md:py-5 shadow-xl shadow-amber-500/30 transition-all hover:-translate-y-1 cursor-pointer border-0"
                >
                  <svg
                    className="w-5 h-5 text-[#0F172A]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <span className="text-[#0F172A] text-xs font-black uppercase tracking-widest">
                    {isEn ? "Search Camps" : "Pesquisar Campos"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* DESTAQUES B2C */}
      {camposDeFerias.length > 0 && (
        <section className="bg-white py-20 md:py-32 border-t border-slate-200/80">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <div>
                <span className="text-xs font-black text-[#2563EB] uppercase tracking-widest block mb-2">
                  {isEn ? "Handpicked for you" : "Seleção em Destaque"}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight">
                  {isEn ? "Featured Holiday Camps" : "Próximos Campos de Férias"}
                </h2>
              </div>
              <Link
                href={`/${lang}/pesquisa`}
                className="text-sm font-black text-[#2563EB] hover:underline flex items-center gap-1 no-underline"
              >
                {isEn ? "View all programs" : "Ver todos os campos"} &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {camposDeFerias.map((campo, index) => {
                const campoId = campo.id ?? index + 1;
                const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
                const catCampo =
                  isEn && campo.categoria_en
                    ? campo.categoria_en
                    : campo.categoria || "Campo de Férias";
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
                  <div
                    key={campoId}
                    className="group flex flex-col bg-white border border-slate-200/80 rounded-md shadow-sm hover:shadow-xl hover:border-[#2563EB] transition-all duration-300 hover:-translate-y-1 overflow-hidden relative"
                  >
                    <Link href={`/${lang}/campo/${campoId}`} className="absolute inset-0 z-10">
                      <span className="sr-only">Ver {nomeCampo}</span>
                    </Link>

                    <div className="absolute top-4 right-4 z-20">
                      <BotaoFavorito campoId={campoId} />
                    </div>

                    <div className="relative h-60 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={nomeCampo}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#0F172A] rounded-md shadow-sm z-0">
                        {catCampo}
                      </div>
                    </div>

                    <div className="flex flex-col p-6 flex-1 pointer-events-none">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                        <span>📍 {localCampo}</span>
                      </div>
                      <h3 className="text-xl font-black text-[#0F172A] leading-tight mb-4 line-clamp-2">
                        {nomeCampo}
                      </h3>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                            {isEn ? "Prices from" : "Desde"}
                          </p>
                          <p className="text-2xl font-black text-[#2563EB] m-0">
                            {precoVisivel > 0 ? `${precoVisivel}€` : "Sob Consulta"}
                          </p>
                        </div>
                        <span className="bg-[#0F172A] group-hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-md text-xs font-black uppercase tracking-widest transition-colors shadow-sm">
                          {isEn ? "View Dates" : "Ver Detalhes"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* NAVEGAÇÃO POR DISTRITOS E REGIÕES COM CAMPOS ATIVOS */}
      {distritosAtivosCards.length > 0 && (
        <section className="bg-white py-20 border-t border-slate-200/80">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-black text-[#2563EB] uppercase tracking-widest block mb-2">
                {isEn ? "Explore by region" : "Explorar por Região"}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight">
                {isEn ? "Discover by District" : "Descubra os Melhores Destinos"}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {distritosAtivosCards.map((distrito) => {
                const nomeDistrito = isEn ? distrito.nome_en : distrito.nome;
                return (
                  <Link
                    href={`/${lang}/distrito/${encodeURIComponent(distrito.nome)}`}
                    key={distrito.nome}
                    className="group relative block h-[220px] w-full overflow-hidden rounded-md bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    <img
                      src={distrito.imagem}
                      alt={nomeDistrito}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-90"
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-6 bg-gradient-to-t from-black/60 to-transparent">
                      <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md text-center">
                        {nomeDistrito}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* PAÍSES COM CAMPOS ATIVOS */}
      {paisesAtivosCards.length > 0 && (
        <section className="bg-[#F8FAFC] py-20 border-t border-slate-200/80">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-black text-[#16A34A] uppercase tracking-widest block mb-2">
                {isEn ? "International Programs" : "Programas Nacionais e Internacionais"}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight">
                {isEn ? "Discover by Country" : "Descubra por País"}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {paisesAtivosCards.map((pais) => {
                const nomePais = isEn ? pais.nome_en : pais.nome;
                return (
                  <Link
                    href={`/${lang}/pesquisa/pais/${encodeURIComponent(pais.nome)}`}
                    key={pais.nome}
                    className="group relative block h-[240px] w-full overflow-hidden rounded-md bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <img
                      src={pais.imagem}
                      alt={nomePais}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-90"
                    />
                    <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                      <h3 className="text-2xl font-black text-white tracking-tight">{nomePais}</h3>
                      <p className="mt-1 text-sm font-bold text-[#F59E0B]">
                        {isEn ? pais.desc_en : pais.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* BLOCO DE SEO PROGRAMÁTICO (URLS LIMPOS E DIRETOS PARA AS PÁGINAS DE SERVIÇO/LOCAL) */}
      <section className="bg-white py-16 border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 text-center">
            {isEn ? "Popular Searches by Location & Season" : "Pesquisas Frequentes de Campos de Férias"}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {LINKS_SEO_PROGRAMATICOS.map((link) => (
              <Link
                key={link.url}
                href={`/${lang}/${link.url}`}
                className="bg-[#F8FAFC] border border-slate-200 hover:border-[#2563EB] text-slate-700 hover:text-[#2563EB] text-xs font-bold px-5 py-2.5 rounded-md transition-colors no-underline"
              >
                {isEn ? link.en : link.pt}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
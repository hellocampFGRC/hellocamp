import { supabase } from "@/lib/supabase";
import { getDictionary } from "@/lib/getDictionary";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { Metadata } from "next";
import BotaoFavorito from "../../components/BotaoFavorito";
import BotaoPartilha from "../../components/BotaoPartilha";
import DescricaoExpansivel from "../../components/DescricaoExpansivel";
import FormContactoCampo from "../../components/FormContactoCampo";
import {
  ReservaProvider,
  SeletorOpcoes,
  CaixaResumo,
} from "./CaixaReserva";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function getCampoLive(id: string) {
  noStore();
  const { data } = await supabase
    .from("campos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

function extrairCidade(
  local?: string | null,
  distrito?: string | null
): string {
  if (local) {
    const primeiraParte = local.split(",")[0].split("(")[0].trim();
    if (primeiraParte.length > 2 && !/\d{4}-\d{3}/.test(primeiraParte)) {
      return primeiraParte;
    }
  }
  return distrito || "Portugal";
}

function detetarTemporadaCampo(
  nome: string,
  desc: string,
  isEn: boolean
): string {
  const t = `${nome} ${desc}`.toLowerCase();
  if (t.includes("natal") || t.includes("christmas")) {
    return isEn ? "Christmas" : "Natal";
  }
  if (t.includes("páscoa") || t.includes("pascoa") || t.includes("easter")) {
    return isEn ? "Easter" : "Páscoa";
  }
  if (t.includes("carnaval") || t.includes("carnival")) {
    return isEn ? "Carnival" : "Carnaval";
  }
  return isEn ? "Summer" : "Verão";
}

function calcularPrecoMinimo(campo: any): number {
  let preco =
    campo.preco !== null && campo.preco !== undefined ? Number(campo.preco) : 0;
  if (!preco && Array.isArray(campo.pacotes) && campo.pacotes.length > 0) {
    const todos = campo.pacotes.flatMap((p: any) =>
      Array.isArray(p.variantes)
        ? p.variantes.map((v: any) => Math.max(0, Number(v.preco) || 0))
        : []
    );
    if (todos.length > 0) preco = Math.min(...todos);
  }
  return preco;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  noStore();
  const { lang, id } = await params;
  const isEn = lang === "en";
  const campo = await getCampoLive(id);

  if (!campo) {
    return {
      title: isEn
        ? "Camp Not Found | HelloCamp"
        : "Campo não encontrado | HelloCamp",
      robots: { index: false, follow: false },
    };
  }

  const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
  const catCampo =
    isEn && campo.categoria_en
      ? campo.categoria_en
      : campo.categoria || (isEn ? "Holiday Camp" : "Campo de Férias");
  const distrito =
    isEn && campo.Distrito_en
      ? campo.Distrito_en
      : campo.Distrito || campo.distrito || "";
  const pais = isEn && campo.pais_en ? campo.pais_en : campo.pais || "Portugal";
  const cidade = extrairCidade(
    isEn && campo.local_en ? campo.local_en : campo.local,
    distrito || pais
  );
  const descRaw =
    (isEn && campo.descricao_en ? campo.descricao_en : campo.descricao) || "";
  const temporada = detetarTemporadaCampo(nomeCampo, descRaw, isEn);
  const precoMin = calcularPrecoMinimo(campo);
  const idades =
    (isEn && campo.idade_en ? campo.idade_en : campo.idade) ||
    `${campo.idade_min || 6}-${campo.idade_max || 16} ${isEn ? "yrs" : "anos"}`;

  const temLocalNoNome = nomeCampo.toLowerCase().includes(cidade.toLowerCase());
  const title = isEn
    ? `${nomeCampo}${!temLocalNoNome ? ` in ${cidade}` : ""} | ${catCampo} Camp | HelloCamp`
    : `${nomeCampo}${!temLocalNoNome ? ` em ${cidade}` : ""} | Campo de Férias ${catCampo} | HelloCamp`;

  const precoTxt =
    precoMin > 0
      ? isEn
        ? `From €${precoMin}.`
        : `Desde ${precoMin}€.`
      : "";
  const resumoLimpo = descRaw
    .replace(/🔥|•|\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const description =
    (isEn
      ? `${nomeCampo} in ${cidade}, ${pais} (${idades}). ${precoTxt} ${resumoLimpo}`
      : `${nomeCampo} em ${cidade}${
          distrito && distrito !== cidade ? `, ${distrito}` : ""
        } (${idades}). ${precoTxt} ${resumoLimpo}`
    ).slice(0, 158) + "...";

  const keywords = isEn
    ? [
        `${catCampo.toLowerCase()} camp in ${cidade}`,
        `holiday camps in ${cidade}`,
        `${temporada.toLowerCase()} camp ${cidade}`,
        `kids camps in ${distrito || pais}`,
        `youth camps ${pais}`,
        nomeCampo,
        `children holiday programs ${cidade} ${idades}`,
        "book holiday camp online portugal",
      ]
    : [
        `campos de férias em ${cidade}`,
        `campo de férias ${cidade}`,
        `campos de férias de ${temporada.toLowerCase()} em ${cidade}`,
        `campos de férias ${catCampo.toLowerCase()} ${cidade}`,
        ...(distrito
          ? [
              `campos de férias em ${distrito}`,
              `férias escolares ${distrito}`,
            ]
          : []),
        `atl férias ${cidade}`,
        `atividades para crianças ${idades} em ${cidade}`,
        nomeCampo,
      ];

  const canonicalUrl = `https://www.hellocamp.pt/${lang}/campo/${id}`;
  const ogImage = campo.imagem?.startsWith("http")
    ? campo.imagem
    : "https://www.hellocamp.pt/og-image.jpg";

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "pt-PT": `https://www.hellocamp.pt/pt/campo/${id}`,
        "en-US": `https://www.hellocamp.pt/en/campo/${id}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "HelloCamp",
      type: "website",
      locale: isEn ? "en_US" : "pt_PT",
      images: [{ url: ogImage, width: 1200, height: 630, alt: nomeCampo }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots:
      campo.ativo === true
        ? { index: true, follow: true }
        : { index: false, follow: false },
  };
}

export default async function DetalhesDoCampo({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  noStore();
  const { lang, id } = await params;
  const isEn = lang === "en";

  const [dict, campo, reviewsRes] = await Promise.all([
    getDictionary(lang as "pt" | "en"),
    getCampoLive(id),
    supabase
      .from("reviews")
      .select("*")
      .eq("campo_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const reviews = reviewsRes.data || [];

  if (!campo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
        <div className="w-20 h-20 bg-white rounded-md flex items-center justify-center shadow-sm border border-slate-200 mb-6 text-4xl">
          🕵️‍♂️
        </div>
        <h1 className="text-3xl font-black text-slate-900">
          {isEn ? "Camp not found" : "Campo não encontrado"}
        </h1>
        <Link
          href={`/${lang}/pesquisa`}
          className="mt-6 bg-[#0E3A68] text-white px-6 py-3 rounded-md font-bold shadow-md hover:bg-[#0b2b4d] transition-colors no-underline"
        >
          {dict.detalhe.voltar_pesquisa}
        </Link>
      </div>
    );
  }

  // Regista visualização em background sem bloquear a página
  if (campo.id && campo.organizador_id) {
    supabase
      .rpc("registar_visualizacao_campo", {
        p_campo_id: campo.id,
        p_organizador_id: campo.organizador_id,
      })
      .then();
  }

  // Carrega perfil do organizador e campos relacionados em paralelo (sempre atualizados)
  const [orgRes, resParceiro, resSemelhantes] = await Promise.all([
    campo.organizador_id
      ? supabase
          .from("perfis")
          .select("*")
          .eq("id", campo.organizador_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    campo.organizador_id
      ? supabase
          .from("campos")
          .select('id, nome, nome_en, imagem, "Distrito", local, preco')
          .eq("organizador_id", campo.organizador_id)
          .eq("ativo", true)
          .neq("id", campo.id)
          .limit(3)
      : Promise.resolve({ data: [] }),
    campo.categoria
      ? supabase
          .from("campos")
          .select('id, nome, nome_en, imagem, "Distrito", local, preco')
          .eq("categoria", campo.categoria)
          .eq("ativo", true)
          .neq("id", campo.id)
          .limit(3)
      : Promise.resolve({ data: [] }),
  ]);

  const parceiroInfo = orgRes.data;
  const outrosDoParceiro = resParceiro.data || [];
  const semelhantes = resSemelhantes.data || [];

  const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
  const descCampo =
    isEn && campo.descricao_en ? campo.descricao_en : campo.descricao;
  const catCampo =
    isEn && campo.categoria_en
      ? campo.categoria_en
      : campo.categoria || (isEn ? "Holiday Camp" : "Campo de Férias");
  const distritoVisivel =
    isEn && campo.Distrito_en
      ? campo.Distrito_en
      : campo.Distrito || campo.distrito || "";
  const localCampo =
    isEn && campo.local_en
      ? campo.local_en
      : campo.local || distritoVisivel || "Portugal";

  const racioCampo =
    isEn && campo.racio_monitores_en
      ? campo.racio_monitores_en
      : campo.racio_monitores;
  const alimentacaoCampo =
    isEn && campo.alimentacao_en ? campo.alimentacao_en : campo.alimentacao;
  const alojamentoCampo =
    isEn && campo.alojamento_en ? campo.alojamento_en : campo.alojamento;
  const seguroCampo = isEn && campo.seguro_en ? campo.seguro_en : campo.seguro;
  const regrasCampo =
    isEn && campo.regras_termos_en
      ? campo.regras_termos_en
      : campo.regras_termos;

  const paisReal = campo.pais || "Portugal";
  const paisVisivel = isEn && campo.pais_en ? campo.pais_en : paisReal;
  const cidadeSeo = extrairCidade(localCampo, distritoVisivel || paisVisivel);

  const scoreAvaliacoes = Number(campo.rating_score) || 0;
  const totalAvaliacoes = Number(campo.total_reviews) || 0;

  const baseUrl = "https://www.hellocamp.pt";
  const campoUrlCompleto = `${baseUrl}/${lang}/campo/${campo.id}`;
  const calendario = campo.calendario_funcionamento || {
    data_inicio: "",
    data_fim: "",
    dias_semana: [],
  };
  const todayISO = new Date().toISOString().split("T")[0];
  const dataMaisCedo = calendario.data_inicio || campo.data_inicio || todayISO;
  const precoMinimo = calcularPrecoMinimo(campo);

  const heroImgUrl = campo.imagem?.startsWith("http")
    ? campo.imagem
    : "/og-image.jpg";

  const galeriaValida: string[] = Array.isArray(campo.galeria)
    ? campo.galeria.filter(
        (u: string) => u && u.startsWith("http") && u !== heroImgUrl
      )
    : [];

  const nomeExibicaoParceiro = parceiroInfo
    ? parceiroInfo.empresa_nome ||
      parceiroInfo.nome_empresa ||
      parceiroInfo.nome_completo ||
      "Parceiro HelloCamp"
    : "Parceiro HelloCamp";

  const descCurtaParceiro = parceiroInfo
    ? isEn && (parceiroInfo.descricao_en || parceiroInfo.biografia_empresa_en)
      ? parceiroInfo.descricao_en || parceiroInfo.biografia_empresa_en
      : parceiroInfo.descricao || parceiroInfo.biografia_empresa || ""
    : "";

  const faqsCampo = isEn
    ? [
        {
          q: `What age group is ${nomeCampo} designed for?`,
          a: `This ${catCampo.toLowerCase()} camp in ${cidadeSeo} is designed for children and youth aged ${
            campo.idade_en ||
            campo.idade ||
            `${campo.idade_min || 6} to ${campo.idade_max || 16} years`
          }.`,
        },
        {
          q: `What is the starting price and what is included?`,
          a: `${
            precoMinimo > 0
              ? `Prices start from €${precoMinimo}.`
              : "Check available packages on this page."
          } Meals: ${alimentacaoCampo || "Check details"}. Insurance: ${
            seguroCampo || "Included"
          }.`,
        },
        {
          q: `Does ${nomeCampo} include accommodation or is it a day camp?`,
          a: alojamentoCampo || "Day camp (no overnight stay included).",
        },
      ]
    : [
        {
          q: `Para que idades é indicado o programa ${nomeCampo}?`,
          a: `Este campo de férias de ${catCampo.toLowerCase()} em ${cidadeSeo} destina-se a participantes dos ${
            campo.idade ||
            `${campo.idade_min || 6} aos ${campo.idade_max || 16} anos`
          }.`,
        },
        {
          q: `Qual o preço e o que está incluído na inscrição?`,
          a: `${
            precoMinimo > 0
              ? `Os valores começam desde ${precoMinimo}€.`
              : "Consulte os pacotes disponíveis nesta página."
          } Alimentação: ${alimentacaoCampo || "Sob consulta"}. Seguro: ${
            seguroCampo || "Incluído"
          }.`,
        },
        {
          q: `O programa em ${cidadeSeo} é em regime residencial ou externato?`,
          a: alojamentoCampo || "Regime de externato (diurno, sem dormida).",
        },
      ];

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
        name: paisVisivel,
        item: `${baseUrl}/${lang}/pesquisa/pais/${encodeURIComponent(
          paisReal
        )}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: distritoVisivel || localCampo,
        item: `${baseUrl}/${lang}/distrito/${encodeURIComponent(
          campo.Distrito || localCampo
        )}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: nomeCampo,
        item: campoUrlCompleto,
      },
    ],
  };

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: nomeCampo,
    description: descCampo
      ? descCampo.replace(/\s+/g, " ").trim().slice(0, 300)
      : nomeCampo,
    startDate: dataMaisCedo,
    ...(calendario.data_fim ? { endDate: calendario.data_fim } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image: [heroImgUrl, ...galeriaValida.slice(0, 3)],
    location: {
      "@type": "Place",
      name: localCampo,
      address: {
        "@type": "PostalAddress",
        addressLocality: cidadeSeo,
        addressRegion: distritoVisivel || cidadeSeo,
        addressCountry: paisReal,
      },
    },
    organizer: {
      "@type": "Organization",
      name: nomeExibicaoParceiro,
      url: campo.organizador_id
        ? `${baseUrl}/${lang}/parceiro/${campo.organizador_id}`
        : baseUrl,
    },
    offers: {
      "@type": "Offer",
      url: campoUrlCompleto,
      price: precoMinimo,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    ...(totalAvaliacoes > 0 && scoreAvaliacoes > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: scoreAvaliacoes.toFixed(1),
            reviewCount: totalAvaliacoes,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqsCampo.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* HERO CONTIDO DE ALTA NITIDEZ */}
      <div className="bg-white border-b border-slate-200 pt-6 pb-8">
        <div className="max-w-[1100px] mx-auto px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-[11px] font-black text-slate-400 tracking-widest uppercase"
            >
              <Link
                href={`/${lang}`}
                className="hover:text-[#0E3A68] transition-colors no-underline text-slate-400"
              >
                {isEn ? "Home" : "Início"}
              </Link>
              <span>/</span>
              <Link
                href={`/${lang}/pesquisa/pais/${encodeURIComponent(paisReal)}`}
                className="hover:text-[#0E3A68] transition-colors no-underline text-slate-400"
              >
                {paisVisivel}
              </Link>
              <span>/</span>
              <Link
                href={`/${lang}/distrito/${encodeURIComponent(
                  campo.Distrito || localCampo
                )}`}
                className="hover:text-[#0E3A68] transition-colors no-underline text-slate-400"
              >
                {distritoVisivel || localCampo}
              </Link>
              <span>/</span>
              <span
                className="text-slate-900 max-w-[180px] sm:max-w-[260px] truncate"
                title={nomeCampo}
              >
                {nomeCampo}
              </span>
            </nav>

            <div className="flex items-center gap-2">
              <BotaoPartilha
                url={campoUrlCompleto}
                titulo={nomeCampo}
                isEn={isEn}
              />
              <BotaoFavorito campoId={campo.id} />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className="rounded-sm bg-[#0E3A68] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                {catCampo}
              </span>
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                📍 {localCampo}
              </span>
              <span className="text-slate-900 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-sm text-xs font-black">
                ★{" "}
                {scoreAvaliacoes > 0
                  ? scoreAvaliacoes.toFixed(1)
                  : isEn
                  ? "New"
                  : "Novo"}{" "}
                ({totalAvaliacoes})
              </span>
              {campo.idade && (
                <span className="text-xs font-black bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-sm">
                  👶 {isEn && campo.idade_en ? campo.idade_en : campo.idade}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight m-0 tracking-tight">
              {nomeCampo}
            </h1>
          </div>

          {galeriaValida.length >= 2 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-[300px] sm:h-[380px] md:h-[420px] rounded-md overflow-hidden border border-slate-200">
              <div className="md:col-span-8 h-full bg-slate-900 relative overflow-hidden">
                <img
                  src={heroImgUrl}
                  alt={nomeCampo}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="hidden md:grid md:col-span-4 grid-rows-2 gap-3 h-full">
                <div className="bg-slate-900 h-full overflow-hidden relative">
                  <img
                    src={galeriaValida[0]}
                    alt={`${nomeCampo} 2`}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <div className="bg-slate-900 h-full overflow-hidden relative">
                  <img
                    src={galeriaValida[1]}
                    alt={`${nomeCampo} 3`}
                    className="w-full h-full object-cover object-center"
                  />
                  {galeriaValida.length > 2 && (
                    <a
                      href="#galeria"
                      className="absolute bottom-3 right-3 bg-slate-950/85 hover:bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-sm no-underline shadow-md"
                    >
                      📷 +{galeriaValida.length - 2}{" "}
                      {isEn ? "Photos" : "Fotografias"}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] rounded-md overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center">
              <img
                src={heroImgUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110 pointer-events-none"
              />
              <img
                src={heroImgUrl}
                alt={nomeCampo}
                className="relative z-10 max-w-full max-h-full w-auto h-full object-contain sm:object-cover rounded-sm shadow-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* CORPO DA PÁGINA */}
      <div className="max-w-[1100px] mx-auto pt-8 pb-10 px-4 md:px-6">
        <ReservaProvider campo={campo} lang={lang}>
          <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
            {/* COLUNA ESQUERDA */}
            <div className="flex-1 w-full flex flex-col gap-6">
              {/* DESCRIÇÃO FORMATADA E JUSTIFICADA + BROCHURAS PDF */}
              <div className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-slate-200 relative z-10">
                <h2 className="text-xl font-black text-slate-900 mb-5 pb-3 border-b border-slate-100">
                  {dict.detalhe.sobre_programa}
                </h2>
                <DescricaoExpansivel texto={descCampo} isEn={isEn} />

                {Array.isArray(campo.programas_pdf) &&
                  campo.programas_pdf.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                        📄{" "}
                        {isEn
                          ? "Download Official Brochure / Schedule (PDF)"
                          : "Descarregar Programa Detalhado / Horário (PDF)"}
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {campo.programas_pdf.map((doc: any, i: number) => (
                          <a
                            key={i}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-[#167524] border border-emerald-200 px-4 py-3 rounded-md text-xs font-black no-underline transition-colors shadow-sm"
                          >
                            📥{" "}
                            {doc.nome ||
                              (isEn ? "Brochure PDF" : "Programa PDF")}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* INFORMAÇÕES LOGÍSTICAS IMPORTANTES */}
              <div className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-slate-200 relative z-10">
                <h2 className="text-xl font-black text-slate-900 mb-6">
                  {dict.detalhe.informacoes_importantes}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start sm:items-center gap-3 p-4 bg-slate-50 rounded-md border border-slate-200">
                    <span className="text-2xl">👥</span>
                    <div>
                      <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                        {dict.detalhe.racio_monitores}
                      </h4>
                      <p className="text-sm font-black text-slate-800 m-0 leading-tight">
                        {racioCampo || dict.detalhe.sob_consulta}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start sm:items-center gap-3 p-4 bg-slate-50 rounded-md border border-slate-200">
                    <span className="text-2xl">🍎</span>
                    <div>
                      <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                        {dict.detalhe.alimentacao}
                      </h4>
                      <p className="text-sm font-black text-slate-800 m-0 leading-tight">
                        {alimentacaoCampo || dict.detalhe.sob_consulta}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start sm:items-center gap-3 p-4 bg-slate-50 rounded-md border border-slate-200">
                    <span className="text-2xl">🏕️</span>
                    <div>
                      <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                        {dict.detalhe.alojamento}
                      </h4>
                      <p className="text-sm font-black text-slate-800 m-0 leading-tight">
                        {alojamentoCampo || dict.detalhe.nao_inclui_dormida}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start sm:items-center gap-3 p-4 bg-slate-50 rounded-md border border-slate-200">
                    <span className="text-2xl">🛡️</span>
                    <div>
                      <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                        {dict.detalhe.seguros}
                      </h4>
                      <p className="text-sm font-black text-slate-800 m-0 leading-tight">
                        {seguroCampo || dict.detalhe.sob_consulta}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARTÃO DE AUTORIDADE: PERFIL DO ORGANIZADOR */}
              {campo.organizador_id && parceiroInfo && (
                <div className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-slate-200 relative z-10 hover:border-[#0E3A68]/40 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-start sm:items-center gap-5">
                      <div className="w-20 h-20 bg-white rounded-md flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm flex-shrink-0 p-2">
                        {parceiroInfo.logotipo_url ? (
                          <img
                            src={parceiroInfo.logotipo_url}
                            alt={nomeExibicaoParceiro}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-slate-400 font-black text-2xl">
                            {nomeExibicaoParceiro.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-black text-slate-900 m-0 leading-none">
                            {nomeExibicaoParceiro}
                          </h3>
                          {parceiroInfo.parceiro_verificado && (
                            <span
                              className="bg-emerald-50 border border-emerald-200 text-[#167524] rounded-sm px-2 py-0.5 text-[10px] font-black uppercase"
                              title={
                                isEn ? "Verified Partner" : "Parceiro Verificado"
                              }
                            >
                              ✓ {isEn ? "Verified" : "Verificado"}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-0">
                          {isEn ? "Official Organizer" : "Organizador Oficial"}
                        </p>
                        {descCurtaParceiro && (
                          <p className="text-xs text-slate-600 mt-2 mb-0 line-clamp-2 max-w-lg text-justify">
                            {descCurtaParceiro}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/${lang}/parceiro/${campo.organizador_id}`}
                      className="w-full sm:w-auto text-center bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-md transition-all shadow-sm no-underline whitespace-nowrap"
                    >
                      {isEn ? "View Organizer Profile" : "Ver Perfil e Campos"}
                    </Link>
                  </div>
                </div>
              )}

              {/* LOCALIZAÇÃO E MAPA */}
              <div className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-slate-200 relative z-10">
                <h2 className="text-xl font-black text-slate-900 mb-2">
                  {isEn ? "Location & Directions" : "Localização e Como Chegar"}
                </h2>
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2 leading-relaxed mb-6">
                  📍 {localCampo}
                </p>

                <div className="w-full h-64 md:h-80 bg-slate-100 rounded-md mb-6 overflow-hidden border border-slate-200 relative">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${
                      campo.latitude && campo.longitude
                        ? `${campo.latitude},${campo.longitude}`
                        : encodeURIComponent(localCampo)
                    }&z=15&output=embed`}
                    className="w-full h-full border-0 outline-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={`https://maps.apple.com/?daddr=${
                      campo.latitude && campo.longitude
                        ? `${campo.latitude},${campo.longitude}`
                        : encodeURIComponent(localCampo)
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-900 px-5 py-3 rounded-md text-[10px] font-black uppercase tracking-widest border border-slate-200 no-underline"
                  >
                    Apple Maps
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${
                      campo.latitude && campo.longitude
                        ? `${campo.latitude},${campo.longitude}`
                        : encodeURIComponent(localCampo)
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] px-5 py-3 rounded-md text-[10px] font-black uppercase tracking-widest border border-[#BBF7D0] no-underline"
                  >
                    Google Maps
                  </a>
                  <a
                    href={`https://waze.com/ul?ll=${
                      campo.latitude && campo.longitude
                        ? `${campo.latitude},${campo.longitude}`
                        : ""
                    }&q=${encodeURIComponent(localCampo)}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4338CA] px-5 py-3 rounded-md text-[10px] font-black uppercase tracking-widest border border-[#C7D2FE] no-underline"
                  >
                    Waze
                  </a>
                </div>
              </div>

              {/* MOTOR DE RESERVA INTERATIVO */}
              <SeletorOpcoes />

              {/* REGRAS E TERMOS ESPECÍFICOS */}
              {regrasCampo && (
                <div className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-slate-200 relative z-10">
                  <h2 className="text-xl font-black text-slate-900 mb-4">
                    {isEn ? "Specific Rules & Terms" : "Regras e Termos"}
                  </h2>
                  <div className="bg-slate-50 p-6 rounded-md border border-slate-200">
                    <DescricaoExpansivel texto={regrasCampo} isEn={isEn} />
                  </div>
                </div>
              )}

              {/* SECÇÃO DE AVALIAÇÕES */}
              <div className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-slate-200 relative z-10">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 m-0">
                    {isEn ? "Reviews" : "Avaliações"}
                  </h2>
                  <span className="text-slate-900 bg-amber-100 px-2.5 py-1 rounded-sm text-sm font-black">
                    ★{" "}
                    {scoreAvaliacoes > 0
                      ? scoreAvaliacoes.toFixed(1)
                      : isEn
                      ? "New"
                      : "Novo"}
                  </span>
                </div>

                {!reviews || reviews.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 font-bold text-sm bg-slate-50 rounded-md border border-slate-200 border-dashed">
                    {isEn
                      ? "No reviews for this camp yet. Be the first!"
                      : "Ainda não há avaliações. Seja o primeiro a deixar opinião após o campo!"}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {reviews.map((rev: any) => (
                      <div
                        key={rev.id}
                        className="flex flex-col gap-2 pb-6 border-b border-slate-100 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-slate-200 flex items-center justify-center font-black text-slate-600 text-sm flex-shrink-0">
                            {rev.nome_pai
                              ? rev.nome_pai.charAt(0).toUpperCase()
                              : "A"}
                          </div>
                          <div>
                            <p className="font-black text-sm text-slate-900 m-0">
                              {rev.nome_pai || "Encarregado de Educação"}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0">
                              {new Date(rev.created_at).toLocaleDateString(
                                isEn ? "en-US" : "pt-PT"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-[#EBA914] text-xs">
                          {"★".repeat(rev.rating)}
                          {"☆".repeat(5 - rev.rating)}
                        </div>
                        <p className="text-sm text-slate-600 m-0 font-medium leading-relaxed text-justify bg-slate-50 p-4 rounded-md border border-slate-100">
                          {rev.comentario}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* GALERIA COMPLETA */}
              {galeriaValida.length > 0 && (
                <div
                  id="galeria"
                  className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-slate-200 relative z-10 scroll-mt-24"
                >
                  <h2 className="text-xl font-black text-slate-900 mb-6">
                    {isEn ? "Photo Gallery" : "Galeria de Fotografias"}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {galeriaValida.map((imgUrl: string, idx: number) => (
                      <div
                        key={idx}
                        className="aspect-[4/3] rounded-md overflow-hidden bg-slate-100 border border-slate-200 relative"
                      >
                        <img
                          src={imgUrl}
                          alt={`${nomeCampo} ${idx + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OUTROS CAMPOS DO PARCEIRO */}
              {outrosDoParceiro.length > 0 && (
                <div className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-slate-200 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-slate-900 m-0">
                      {isEn
                        ? `More from ${nomeExibicaoParceiro}`
                        : `Mais de ${nomeExibicaoParceiro}`}
                    </h2>
                    {campo.organizador_id && (
                      <Link
                        href={`/${lang}/parceiro/${campo.organizador_id}`}
                        className="text-[10px] font-black uppercase tracking-widest text-[#0E3A68] hover:underline"
                      >
                        {isEn ? "View all" : "Ver todos"}
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {outrosDoParceiro.map((c: any) => {
                      const cImg = c.imagem?.startsWith("http")
                        ? c.imagem
                        : "/og-image.jpg";
                      return (
                        <Link
                          key={c.id}
                          href={`/${lang}/campo/${c.id}`}
                          className="group flex flex-col gap-2 rounded-md bg-slate-50 p-2.5 border border-slate-200 hover:border-[#0E3A68] transition-colors no-underline"
                        >
                          <div className="w-full aspect-[4/3] rounded-sm overflow-hidden bg-slate-200 relative">
                            <img
                              src={cImg}
                              alt={c.nome}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="px-1 pb-1 mt-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">
                              {c.Distrito || c.local}
                            </p>
                            <h3 className="text-sm font-black text-slate-900 leading-tight line-clamp-2 group-hover:text-[#0E3A68]">
                              {isEn && c.nome_en ? c.nome_en : c.nome}
                            </h3>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CAMPOS SEMELHANTES */}
              {semelhantes.length > 0 && (
                <div className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-slate-200 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-slate-900 m-0">
                      {isEn ? "Similar Camps" : "Campos Semelhantes"}
                    </h2>
                    <Link
                      href={`/${lang}/pesquisa?categoria=${encodeURIComponent(
                        campo.categoria || ""
                      )}`}
                      className="text-[10px] font-black uppercase tracking-widest text-[#0E3A68] hover:underline"
                    >
                      {isEn ? "View all" : "Ver mais"}
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {semelhantes.map((c: any) => {
                      const cImg = c.imagem?.startsWith("http")
                        ? c.imagem
                        : "/og-image.jpg";
                      return (
                        <Link
                          key={c.id}
                          href={`/${lang}/campo/${c.id}`}
                          className="group flex flex-col gap-2 rounded-md bg-slate-50 p-2.5 border border-slate-200 hover:border-[#0E3A68] transition-colors no-underline"
                        >
                          <div className="w-full aspect-[4/3] rounded-sm overflow-hidden bg-slate-200 relative">
                            <img
                              src={cImg}
                              alt={c.nome}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="px-1 pb-1 mt-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">
                              {c.Distrito || c.local}
                            </p>
                            <h3 className="text-sm font-black text-slate-900 leading-tight line-clamp-2 group-hover:text-[#0E3A68]">
                              {isEn && c.nome_en ? c.nome_en : c.nome}
                            </h3>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PERGUNTAS FREQUENTES SEO (PT / EN) */}
              <section className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-slate-200 relative z-10">
                <h2 className="text-xl font-black text-slate-900 mb-5">
                  {isEn
                    ? `Frequently Asked Questions — ${nomeCampo}`
                    : `Perguntas Frequentes — ${nomeCampo}`}
                </h2>
                <div className="space-y-3">
                  {faqsCampo.map((faq, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-md p-4"
                    >
                      <h3 className="text-sm font-black text-slate-900 m-0 mb-1.5">
                        {faq.q}
                      </h3>
                      <p className="text-xs md:text-sm text-slate-600 leading-relaxed text-justify m-0">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* FORMULÁRIO DE CONTACTO E DÚVIDAS */}
              <div
                id="duvidas"
                className="bg-white p-6 md:p-8 rounded-md shadow-sm border border-slate-200 relative z-10 scroll-mt-24"
              >
                <h3 className="text-xl font-black text-slate-900 mb-2">
                  {dict.detalhe.duvidas_titulo}
                </h3>
                <p className="text-sm text-slate-500 font-medium mb-6">
                  {dict.detalhe.duvidas_sub}
                </p>
                <FormContactoCampo
                  campoId={campo.id}
                  organizadorId={campo.organizador_id}
                  nomeCampo={nomeCampo}
                  dict={dict}
                  isEn={isEn}
                  lang={lang}
                />
              </div>
            </div>

            {/* BARRA LATERAL COM O RESUMO FIXO */}
            <div className="w-full lg:w-[380px] flex-shrink-0 lg:sticky lg:top-8 relative z-30">
              <CaixaResumo />
            </div>
          </div>
        </ReservaProvider>
      </div>
    </main>
  );
}
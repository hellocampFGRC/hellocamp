import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BotaoPartilha from "../../components/BotaoPartilha";

export const dynamic = "force-dynamic";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&q=80&w=1200";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function limparHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyDistrito(distrito?: string | null): string {
  return (distrito || "portugal")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function detetarTemporada(titulo: string, datas?: string | null): string {
  const texto = `${titulo} ${datas || ""}`.toLowerCase();
  if (texto.includes("verao") || texto.includes("verão")) return "Verão";
  if (texto.includes("pascoa") || texto.includes("páscoa")) return "Páscoa";
  if (texto.includes("natal")) return "Natal";
  if (texto.includes("carnaval")) return "Carnaval";
  return "Férias Escolares";
}

async function getIniciativaBySlugOrId(param: string) {
  const cleanParam = decodeURIComponent(param).trim();

  if (UUID_REGEX.test(cleanParam)) {
    const { data } = await supabase
      .from("institucional_iniciativas")
      .select("*")
      .eq("id", cleanParam)
      .maybeSingle();
    return { data, matchedByUuid: true };
  }

  const { data } = await supabase
    .from("institucional_iniciativas")
    .select("*")
    .eq("slug", cleanParam)
    .maybeSingle();
  return { data, matchedByUuid: false };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  const { lang, id } = await params;
  const isEn = lang === "en";
  const { data: iniciativa } = await getIniciativaBySlugOrId(id);

  if (!iniciativa) {
    return {
      title: isEn
        ? "Municipal Program Not Found | HelloCamp"
        : "Programa Autárquico Não Encontrado | HelloCamp",
      robots: { index: false, follow: false },
    };
  }

  const concelho = iniciativa.concelho || iniciativa.distrito || "Portugal";
  const distrito = iniciativa.distrito || "Portugal";
  const entidade = iniciativa.entidade_organizadora || `Município de ${concelho}`;
  const temporada = detetarTemporada(
    iniciativa.titulo || "",
    iniciativa.datas_encontradas
  );
  const slugFinal = iniciativa.slug || iniciativa.id;
  const canonicalUrl = `https://www.hellocamp.pt/${lang}/institucional/${slugFinal}`;

  const textoLimpo = limparHtml(iniciativa.descricao_html);
  const resumoCurto =
    textoLimpo.length > 155
      ? `${textoLimpo.slice(0, 152)}...`
      : textoLimpo ||
        `Consulte datas, idades, valores e link oficial de inscrição para ${iniciativa.titulo} promovido por ${entidade}.`;

  const title = isEn
    ? `${iniciativa.titulo} | Municipal Holiday Camps in ${concelho} (${distrito})`
    : `${iniciativa.titulo} | Campos de Férias em ${concelho} (${distrito})`;

  const keywords = [
    `campos de férias em ${concelho}`,
    `campos de férias ${concelho}`,
    `campos de férias ${distrito}`,
    `férias desportivas ${concelho}`,
    `férias de ${temporada.toLowerCase()} ${concelho}`,
    `campos de férias câmara municipal de ${concelho}`,
    entidade,
    iniciativa.titulo,
    `atl férias escolares ${concelho}`,
    "campos de férias autarquias portugal",
  ];

  return {
    title,
    description: resumoCurto,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "pt-PT": `https://www.hellocamp.pt/pt/institucional/${slugFinal}`,
        "en-US": `https://www.hellocamp.pt/en/institucional/${slugFinal}`,
      },
    },
    openGraph: {
      title,
      description: resumoCurto,
      url: canonicalUrl,
      siteName: "HelloCamp",
      type: "article",
      locale: isEn ? "en_US" : "pt_PT",
      images: [
        {
          url: iniciativa.imagem_capa_url || FALLBACK_COVER,
          width: 1200,
          height: 630,
          alt: iniciativa.titulo,
        },
      ],
    },
    robots: { index: true, follow: true },
  };
}

export default async function DetalheIniciativaPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const isEn = lang === "en";

  const { data: iniciativa, matchedByUuid } = await getIniciativaBySlugOrId(id);

  // Redirecionamento 301 permanente de UUID antigo para o URL limpo com slug!
  if (iniciativa && matchedByUuid && iniciativa.slug) {
    permanentRedirect(`/${lang}/institucional/${iniciativa.slug}`);
  }

  if (!iniciativa) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="text-5xl">🏛️</span>
        <h1 className="text-2xl font-black text-slate-800">
          {isEn ? "Initiative not found." : "Iniciativa não encontrada."}
        </h1>
        <Link
          href={`/${lang}/institucional`}
          className="bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-md no-underline"
        >
          &larr; {isEn ? "Back to directory" : "Voltar a todas as Autarquias"}
        </Link>
      </div>
    );
  }

  // Carregar programas relacionados (prioridade: mesmo concelho/entidade, depois mesmo distrito)
  const { data: relacionadosRaw } = await supabase
    .from("institucional_iniciativas")
    .select("id, slug, titulo, concelho, distrito, entidade_organizadora, preco_base, datas_encontradas")
    .eq("is_active", true)
    .neq("id", iniciativa.id)
    .eq("distrito", iniciativa.distrito || "Lisboa")
    .limit(6);

  const outrasAutarquias = (relacionadosRaw || [])
    .sort((a: any, b: any) => {
      const aMesmo = a.concelho === iniciativa.concelho ? 1 : 0;
      const bMesmo = b.concelho === iniciativa.concelho ? 1 : 0;
      return bMesmo - aMesmo;
    })
    .slice(0, 3);

  const concelho = iniciativa.concelho || iniciativa.distrito || "Portugal";
  const distrito = iniciativa.distrito || "Portugal";
  const slugFinal = iniciativa.slug || iniciativa.id;
  const canonicalUrl = `https://www.hellocamp.pt/${lang}/institucional/${slugFinal}`;
  const temporada = detetarTemporada(
    iniciativa.titulo || "",
    iniciativa.datas_encontradas
  );

  const precoBase =
    iniciativa.preco_base !== null && iniciativa.preco_base !== undefined
      ? Number(iniciativa.preco_base)
      : null;
  const precoLabel =
    precoBase === null
      ? isEn
        ? "Check Municipality"
        : "Consultar Edital"
      : precoBase <= 0
      ? isEn
        ? "Free (0€)"
        : "Gratuito (0€)"
      : isEn
      ? `From ${precoBase}€`
      : `Desde ${precoBase}€`;

  const datasLimpaLista = (iniciativa.datas_encontradas || "")
    .split("|")
    .map((s: string) => s.trim())
    .filter((s: string) => s && !s.includes("2017"));

  // Perguntas Frequentes dinâmicas para SEO (FAQPage Schema + Visível)
  const faqs = [
    {
      q: `Como fazer a inscrição em ${iniciativa.titulo}?`,
      a: `As inscrições são efetuadas diretamente nos canais oficiais da entidade promotora (${iniciativa.entidade_organizadora}), através do portal de inscrições indicado nesta página.`,
    },
    {
      q: `Qual a faixa etária dos campos de férias em ${concelho}?`,
      a: `Este programa destina-se a crianças e jovens dos ${iniciativa.idade_min_global || 6} aos ${iniciativa.idade_max_global || 16} anos.`,
    },
    {
      q: `Qual o valor de inscrição neste programa municipal de ${concelho}?`,
      a:
        precoBase !== null && precoBase <= 0
          ? `Este programa municipal tem participação gratuita (0€), mediante inscrição prévia e disponibilidade de vagas.`
          : precoBase !== null
          ? `O valor de referência começa em ${precoBase}€ (podendo variar consoante a semana, descontos de irmãos ou extras opcionais como almoço e prolongamento).`
          : `Os valores e eventuais escalões sociais estão definidos nas normas de participação oficiais disponíveis no site da autarquia.`,
    },
  ];

  // JSON-LD: Event + BreadcrumbList + FAQPage
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "HelloCamp",
          item: `https://www.hellocamp.pt/${lang}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: isEn ? "Municipalities" : "Autarquias",
          item: `https://www.hellocamp.pt/${lang}/institucional`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: distrito,
          item: `https://www.hellocamp.pt/${lang}/institucional/distrito/${slugifyDistrito(
            distrito
          )}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: iniciativa.titulo,
          item: canonicalUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: iniciativa.titulo,
      description: limparHtml(iniciativa.descricao_html),
      image: [iniciativa.imagem_capa_url || FALLBACK_COVER],
      startDate: iniciativa.data_inicio_global || undefined,
      endDate: iniciativa.data_fim_global || undefined,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      location: {
        "@type": "Place",
        name: `${concelho}, ${distrito}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: concelho,
          addressRegion: distrito,
          addressCountry: "PT",
        },
      },
      organizer: {
        "@type": "GovernmentOrganization",
        name: iniciativa.entidade_organizadora,
        url: iniciativa.link_oficial || canonicalUrl,
      },
      ...(precoBase !== null
        ? {
            offers: {
              "@type": "Offer",
              price: precoBase,
              priceCurrency: "EUR",
              url: iniciativa.link_inscricao_extraido || iniciativa.link_oficial || canonicalUrl,
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
    },
    {
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
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      {/* JSON-LD PARA GOOGLE RICH SNIPPETS */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO EXECUTIVO */}
      <div className="bg-[#0F172A] text-white py-12 px-4 md:px-6 border-b-4 border-[#16A34A]">
        <div className="max-w-6xl mx-auto">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-300 mb-6"
          >
            <Link
              href={`/${lang}/institucional`}
              className="hover:text-white no-underline text-slate-300"
            >
              {isEn ? "Municipalities" : "Autarquias"}
            </Link>
            <span className="text-slate-500">/</span>
            <Link
              href={`/${lang}/institucional/distrito/${slugifyDistrito(distrito)}`}
              className="hover:text-white no-underline text-slate-300"
            >
              {distrito}
            </Link>
            <span className="text-slate-500">/</span>
            <span className="text-[#F59E0B]">{concelho}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-block bg-[#F59E0B] text-[#0F172A] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                  🏛️ {iniciativa.entidade_organizadora}
                </span>
                <span className="inline-block bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                  📅 {temporada}
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black m-0 tracking-tight leading-tight text-white">
                {iniciativa.titulo}
              </h1>

              {/* CARTÕES DE RESUMO RÁPIDO NO HEADER */}
              <div className="flex flex-wrap items-center gap-2.5 mt-5">
                <span className="bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold px-3.5 py-2 rounded-md">
                  📍 {concelho} ({distrito})
                </span>
                <span className="bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold px-3.5 py-2 rounded-md">
                  👶 {iniciativa.idade_min_global || 6} aos{" "}
                  {iniciativa.idade_max_global || 16} anos
                </span>
                <span className="bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-black px-3.5 py-2 rounded-md">
                  💶 {precoLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <BotaoPartilha
                url={canonicalUrl}
                titulo={iniciativa.titulo}
                isEn={isEn}
              />
              {(iniciativa.link_inscricao_extraido || iniciativa.link_oficial) && (
                <a
                  href={iniciativa.link_inscricao_extraido || iniciativa.link_oficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#16A34A] hover:bg-green-700 text-white font-black uppercase tracking-widest text-xs px-6 py-3.5 rounded-md no-underline shadow-md whitespace-nowrap transition-colors"
                >
                  {isEn
                    ? "Open Registration Portal ↗"
                    : "Inscrições no Portal Oficial ↗"}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUNA ESQUERDA: CONTEÚDO EDITORIAL BEM FORMATADO */}
        <div className="lg:col-span-8 space-y-6">
          {iniciativa.imagem_capa_url && (
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <img
                src={iniciativa.imagem_capa_url}
                alt={`Campos de férias em ${concelho} - ${iniciativa.titulo}`}
                className="w-full max-h-[380px] object-cover rounded-lg"
              />
            </div>
          )}

          {/* BLOCO DE DESCRIÇÃO COM TIPOGRAFIA ESTRUTURADA */}
          <article className="bg-white p-6 md:p-9 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-[#0F172A] m-0 tracking-tight">
                {isEn
                  ? "Program Details & Activities"
                  : `Sobre o Programa em ${concelho}`}
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#2563EB] bg-blue-50 px-3 py-1 rounded-md">
                {temporada}
              </span>
            </div>

            {iniciativa.descricao_html ? (
              <div
                className="
                  text-[15px] text-slate-700 leading-7
                  [&_p]:mb-4 [&_p:last-child]:mb-0
                  [&_strong]:text-[#0F172A] [&_strong]:font-black
                  [&_p>em]:block [&_p>em]:bg-amber-50 [&_p>em]:border-l-4 [&_p>em]:border-[#F59E0B] [&_p>em]:px-4 [&_p>em]:py-3 [&_p>em]:rounded-r-md [&_p>em]:text-xs [&_p>em]:text-amber-950 [&_p>em]:not-italic [&_p>em]:font-semibold [&_p>em]:my-4
                  [&_ul]:space-y-3 [&_ul]:my-6 [&_ul]:pl-0
                  [&_li]:list-none [&_li]:bg-[#F8FAFC] [&_li]:border [&_li]:border-slate-200 [&_li]:rounded-lg [&_li]:p-4 [&_li]:leading-relaxed [&_li]:text-sm
                  [&_li>strong]:block [&_li>strong]:text-[#0E3A68] [&_li>strong]:text-base [&_li>strong]:mb-1
                  [&_li>em]:inline-block [&_li>em]:mt-2 [&_li>em]:bg-emerald-50 [&_li>em]:text-[#167524] [&_li>em]:border [&_li>em]:border-emerald-200 [&_li>em]:px-2.5 [&_li>em]:py-0.5 [&_li>em]:rounded [&_li>em]:text-xs [&_li>em]:font-black [&_li>em]:not-italic
                "
                dangerouslySetInnerHTML={{ __html: iniciativa.descricao_html }}
              />
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed m-0">
                Iniciativa municipal promovida por{" "}
                <strong>{iniciativa.entidade_organizadora}</strong> para apoio
                às famílias de <strong>{concelho}</strong> ({distrito}) durante
                as férias escolares.
              </p>
            )}
          </article>

          {/* DATAS E PERÍODOS */}
          {datasLimpaLista.length > 0 && (
            <section className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest m-0 mb-4">
                📅 {isEn ? "Dates & Periods" : "Calendarização & Períodos"}
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {datasLimpaLista.map((dt: string, i: number) => (
                  <span
                    key={i}
                    className="bg-emerald-50 border border-emerald-200 text-[#167524] text-xs font-black px-4 py-2.5 rounded-md"
                  >
                    🗓️ {dt}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* PERGUNTAS FREQUENTES SEO */}
          <section className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-black text-[#0F172A] uppercase tracking-widest m-0 mb-5">
              ❓ Perguntas Frequentes — Campos de Férias em {concelho}
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-[#F8FAFC] border border-slate-200 rounded-lg p-4"
                >
                  <h3 className="text-sm font-black text-[#0F172A] m-0 mb-1.5">
                    {faq.q}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed m-0">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA: INSCRIÇÃO DIRETA E CONTACTOS */}
        <aside className="lg:col-span-4 bg-white p-6 md:p-7 rounded-xl border border-slate-200 shadow-md space-y-6 lg:sticky lg:top-24">
          <div>
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#167524] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md mb-2">
              Inscrição Direta na Autarquia
            </span>
            <h2 className="text-xl font-black text-[#0F172A] m-0">
              {isEn
                ? "Official Registration & Contacts"
                : "Portal Oficial e Contactos"}
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 mb-0 leading-relaxed">
              {isEn
                ? "This is a public municipal program. Registrations are handled directly on the municipality's official platform."
                : "Programa público promovido pela autarquia. As inscrições são efetuadas diretamente nos canais oficiais abaixo:"}
            </p>
          </div>

          <div className="space-y-3">
            {iniciativa.link_inscricao_extraido && (
              <a
                href={iniciativa.link_inscricao_extraido}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#16A34A] hover:bg-green-700 text-white font-black uppercase tracking-widest text-xs py-4 px-5 rounded-md no-underline shadow-sm transition-colors"
              >
                📝{" "}
                {isEn
                  ? "Open Registration Portal ↗"
                  : "Abrir Portal de Inscrições ↗"}
              </a>
            )}

            {iniciativa.link_oficial && (
              <a
                href={iniciativa.link_oficial}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#0F172A] hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs py-4 px-5 rounded-md no-underline shadow-sm transition-colors"
              >
                🏛️{" "}
                {isEn
                  ? "Visit Official Municipality Page ↗"
                  : "Ver Página Oficial da Autarquia ↗"}
              </a>
            )}
          </div>

          <div className="bg-[#F8FAFC] p-5 rounded-lg border border-slate-200 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 m-0">
              Contactos Diretos
            </h3>
            <p className="text-xs font-black text-[#0F172A] m-0">
              🏛️ {iniciativa.entidade_organizadora}
            </p>
            {iniciativa.telefone_contato && (
              <p className="text-xs font-bold text-slate-700 m-0">
                📞{" "}
                <a
                  href={`tel:${iniciativa.telefone_contato}`}
                  className="text-[#2563EB] underline"
                >
                  {iniciativa.telefone_contato}
                </a>
              </p>
            )}
            {iniciativa.email_contato && (
              <p className="text-xs font-bold text-slate-700 m-0 break-all">
                ✉️{" "}
                <a
                  href={`mailto:${iniciativa.email_contato.toLowerCase()}`}
                  className="text-[#2563EB] underline"
                >
                  {iniciativa.email_contato.toLowerCase()}
                </a>
              </p>
            )}
          </div>

          {/* CROSS-LINKING SEO PARA CAMPOS PRIVADOS NO MESMO CONCELHO E DISTRITO */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <p className="text-xs font-bold text-slate-600 m-0">
              {isEn
                ? `Looking for private camps with instant availability in ${concelho} or ${distrito}?`
                : `Procura também campos de férias privados com vagas abertas em ${concelho} ou ${distrito}?`}
            </p>
            <Link
              href={`/${lang}/campos-de-ferias/${slugifyDistrito(concelho)}`}
              className="block w-full text-center bg-[#2563EB] hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] py-3 rounded-md no-underline transition-colors"
            >
              🏕️ Campos de Férias em {concelho} &rarr;
            </Link>
            <Link
              href={`/${lang}/distrito/${encodeURIComponent(distrito)}`}
              className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-[#0F172A] border border-slate-300 font-black uppercase tracking-widest text-[11px] py-3 rounded-md no-underline transition-colors"
            >
              📍 Ver Todos em {distrito} &rarr;
            </Link>
          </div>
        </aside>
      </div>

      {/* OUTRAS INICIATIVAS DO MESMO CONCELHO / DISTRITO */}
      {outrasAutarquias.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 md:px-6 pt-14">
          <h2 className="text-base font-black text-[#0F172A] uppercase tracking-widest mb-4">
            Outros Programas Municipais em {distrito}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {outrasAutarquias.map((o: any) => (
              <Link
                key={o.id}
                href={`/${lang}/institucional/${o.slug || o.id}`}
                className="bg-white p-5 rounded-lg border border-slate-200 hover:border-[#16A34A] no-underline text-inherit shadow-sm transition-colors"
              >
                <span className="text-[10px] font-black uppercase text-[#16A34A] block mb-1">
                  📍 {o.concelho || o.distrito}
                </span>
                <h3 className="text-sm font-black text-[#0F172A] m-0 line-clamp-2">
                  {o.titulo}
                </h3>
                {o.datas_encontradas && (
                  <p className="text-[11px] text-slate-500 font-medium mt-2 mb-0 line-clamp-1">
                    📅 {o.datas_encontradas}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
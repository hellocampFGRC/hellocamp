import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&q=80&w=800";

function formatarDistrito(slug: string): string {
  const preposicoes = ["de", "da", "do", "das", "dos"];
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .split(" ")
    .map((w, idx) => {
      const lower = w.toLowerCase();
      if (idx > 0 && preposicoes.includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function normalizar(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function getIniciativasPorDistrito(slug: string) {
  const nomeDistrito = formatarDistrito(slug);
  const alvo = normalizar(nomeDistrito);

  const { data } = await supabase
    .from("institucional_iniciativas")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const filtradas = (data || []).filter(
    (item: any) => normalizar(item.distrito || "") === alvo
  );

  return { nomeDistrito, iniciativas: filtradas };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const isEn = lang === "en";
  const { nomeDistrito, iniciativas } = await getIniciativasPorDistrito(slug);

  const concelhos = Array.from(
    new Set(iniciativas.map((i: any) => i.concelho).filter(Boolean))
  ).slice(0, 10) as string[];

  const listaConcelhos =
    concelhos.length > 0 ? concelhos.join(", ") : nomeDistrito;

  const title = isEn
    ? `Municipal Holiday Camps in ${nomeDistrito} | City Councils | HelloCamp`
    : `Campos de Férias Municipais em ${nomeDistrito} (${iniciativas.length} Programas) | HelloCamp`;

  const description = isEn
    ? `Explore official municipal holiday camps in ${nomeDistrito} (${listaConcelhos}). Dates, ages, prices, and direct registration portals.`
    : `Descubra os campos de férias das Câmaras Municipais e Juntas de Freguesia no distrito de ${nomeDistrito}: ${listaConcelhos}. Consulte datas de Verão, Páscoa e Natal e links oficiais de inscrição.`;

  const canonical = `https://www.hellocamp.pt/${lang}/institucional/distrito/${slug}`;

  return {
    title,
    description,
    keywords: [
      `campos de férias em ${nomeDistrito}`,
      `campos de férias municipais ${nomeDistrito}`,
      ...concelhos.map((c) => `campos de férias em ${c}`),
      ...concelhos.map((c) => `férias desportivas ${c}`),
      `câmaras municipais ${nomeDistrito} férias`,
    ],
    alternates: {
      canonical,
      languages: {
        "pt-PT": `https://www.hellocamp.pt/pt/institucional/distrito/${slug}`,
        "en-US": `https://www.hellocamp.pt/en/institucional/distrito/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "HelloCamp",
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function InstitucionalDistritoPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const isEn = lang === "en";

  const { nomeDistrito, iniciativas } = await getIniciativasPorDistrito(slug);

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
          name: nomeDistrito,
          item: `https://www.hellocamp.pt/${lang}/institucional/distrito/${slug}`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Campos de Férias Municipais em ${nomeDistrito}`,
      numberOfItems: iniciativas.length,
      itemListElement: iniciativas.map((item: any, idx: number) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: item.titulo,
        url: `https://www.hellocamp.pt/${lang}/institucional/${
          item.slug || item.id
        }`,
      })),
    },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-[#0F172A] pt-14 pb-14 px-6 text-center border-b-4 border-[#16A34A]">
        <span className="inline-block bg-[#F59E0B] text-[#0F172A] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-3">
          🏛️ {isEn ? "Municipal Directory" : "Diretório Autárquico"}
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-3">
          {isEn
            ? `Municipal Holiday Camps in ${nomeDistrito}`
            : `Campos de Férias Municipais em ${nomeDistrito}`}
        </h1>
        <p className="text-slate-300 font-medium max-w-2xl mx-auto m-0 text-sm md:text-base">
          {isEn
            ? "Explore all municipal and parish programs available in your region."
            : `Consulte todos os programas de Câmaras Municipais e Juntas de Freguesia disponíveis no distrito de ${nomeDistrito}.`}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Link
            href={`/${lang}/institucional`}
            className="text-xs font-black uppercase tracking-widest text-slate-700 bg-white border border-slate-300 px-4 py-2.5 rounded-md hover:border-[#16A34A] inline-flex items-center gap-2 no-underline"
          >
            &larr;{" "}
            {isEn
              ? "Back to all municipalities"
              : "Voltar a todas as Autarquias"}
          </Link>

          <Link
            href={`/${lang}/distrito/${encodeURIComponent(nomeDistrito)}`}
            className="text-xs font-black uppercase tracking-widest text-white bg-[#2563EB] hover:bg-blue-700 px-4 py-2.5 rounded-md inline-flex items-center gap-2 no-underline"
          >
            🏕️ Ver Campos Privados em {nomeDistrito} &rarr;
          </Link>
        </div>

        {iniciativas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-md border border-slate-200">
            <span className="text-4xl block mb-3">🏛️</span>
            <p className="text-slate-600 font-bold text-sm">
              {isEn
                ? `No municipal programs found for ${nomeDistrito}.`
                : `Nenhum programa autárquico encontrado para o distrito de ${nomeDistrito}.`}
            </p>
            <Link
              href={`/${lang}/institucional`}
              className="mt-4 inline-block bg-[#0F172A] text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-md no-underline"
            >
              {isEn ? "See all programs" : "Ver todas as Autarquias"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {iniciativas.map((item: any) => (
              <article
                key={item.id}
                className="flex flex-col bg-white rounded-md shadow-sm border border-slate-200 hover:border-[#16A34A] transition-all overflow-hidden"
              >
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    loading="lazy"
                    src={item.imagem_capa_url || FALLBACK_IMG}
                    alt={`${item.titulo} - ${item.concelho || nomeDistrito}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-[#0F172A]/90 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                    📍 {item.concelho || item.distrito}
                  </span>
                </div>
                <div className="flex flex-col p-5 flex-1">
                  <p className="text-[11px] font-black uppercase text-[#2563EB] m-0 mb-1">
                    🏛️ {item.entidade_organizadora}
                  </p>
                  <h2 className="text-base font-black text-[#0F172A] leading-snug mb-4 line-clamp-2">
                    {item.titulo}
                  </h2>
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Link
                      href={`/${lang}/institucional/${item.slug || item.id}`}
                      className="text-center bg-[#0F172A] hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-md no-underline"
                    >
                      {isEn ? "Details" : "Ver Detalhes"}
                    </Link>
                    {(item.link_inscricao_extraido || item.link_oficial) && (
                      <a
                        href={item.link_inscricao_extraido || item.link_oficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center bg-[#16A34A] hover:bg-green-700 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-md no-underline"
                      >
                        Inscrição ↗
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import InstitucionalClient from "./InstitucionalClient";

export const dynamic = "force-dynamic";

function slugifyDistrito(distrito: string): string {
  return distrito
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isEn = lang === "en";
  const canonical = `https://www.hellocamp.pt/${lang}/institucional`;

  const title = isEn
    ? "Municipal & Social Youth Programs in Portugal | 100% Free Directory | HelloCamp"
    : "Campos de Férias de Autarquias, Juntas e Programas Sociais em Portugal | HelloCamp";

  const description = isEn
    ? "Find free and subsidized youth holiday camps, volunteering, and sports programs from City Councils, Parishes, and non-profits across Portugal."
    : "Consulte num só portal os campos de férias, voluntariado jovem e programas gratuitos ou subsidiados de Câmaras Municipais, Juntas de Freguesia, IPSS e associações sem fins lucrativos em todo o país.";

  return {
    title,
    description,
    keywords: [
      "campos de férias autarquias",
      "campos de férias câmaras municipais",
      "programas sociais jovens portugal",
      "voluntariado jovem câmaras municipais",
      "campos de férias gratuitos portugal",
      "campos de férias em cascais",
      "campos de férias em lisboa",
      "campos de férias no porto",
      "férias desportivas municipais",
    ],
    alternates: {
      canonical,
      languages: {
        "pt-PT": "https://www.hellocamp.pt/pt/institucional",
        "en-US": "https://www.hellocamp.pt/en/institucional",
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

export default async function InstitucionalIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isEn = lang === "en";

  const { data } = await supabase
    .from("institucional_iniciativas")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const iniciativas = data || [];
  const distritosUnicos = Array.from(
    new Set(
      iniciativas.map((i: any) => (i.distrito || "").trim()).filter(Boolean)
    )
  ).sort() as string[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isEn
      ? "Municipal & Social Youth Programs in Portugal"
      : "Campos de Férias das Autarquias e Programas Sociais em Portugal",
    numberOfItems: iniciativas.length,
    itemListElement: iniciativas.slice(0, 50).map((item: any, idx: number) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.titulo,
      url: `https://www.hellocamp.pt/${lang}/institucional/${
        item.slug || item.id
      }`,
    })),
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO AUTARQUIAS & PROGRAMAS SOCIAIS */}
      <section className="bg-[#16A34A] text-white pt-14 md:pt-20 pb-24 md:pb-28 px-4 md:px-8 border-b-8 border-[#F59E0B] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#F59E0B] rounded-full opacity-90 pointer-events-none hidden lg:block" />
        <div className="max-w-[1280px] mx-auto relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-block bg-[#0F172A] text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-md">
                🏛️{" "}
                {isEn
                  ? "Municipalities, Parishes & Non-Profits"
                  : "Autarquias, Juntas & Entidades Sociais"}
              </span>
              <span className="inline-block bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-md">
                ✓ {isEn ? "100% Free Listing (0% Fee)" : "Divulgação 100% Gratuita"}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
              {isEn
                ? "Public, Municipal & Social Youth Programs"
                : "Campos de Férias de Autarquias e Programas Sociais"}
            </h1>
            <p className="text-emerald-50 text-base md:text-lg font-medium max-w-2xl leading-relaxed m-0">
              {isEn
                ? "Consult official municipal and non-profit holiday camps, sports, and youth volunteering programs across Portugal — with direct links to official registration."
                : "Consulte num só portal os campos de férias, voluntariado jovem e programas gratuitos ou subsidiados de Câmaras Municipais, Juntas de Freguesia, IPSS e associações sem fins lucrativos."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <a
              href="mailto:info@hellocamp.pt?subject=Submeter%20Programa%20Gratuito%20-%20Autarquia%20ou%20Associa%C3%A7%C3%A3o"
              className="inline-flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest px-6 py-4 rounded-md no-underline shadow-lg transition-colors text-center"
            >
              <span>➕</span>{" "}
              {isEn
                ? "Submit Free Public Program"
                : "Submeter Programa Gratuitamente"}
            </a>
            <span className="text-[11px] font-bold text-emerald-100 text-center">
              {iniciativas.length} {isEn ? "programs" : "programas"} •{" "}
              {distritosUnicos.length} {isEn ? "districts" : "distritos"}
            </span>
          </div>
        </div>
      </section>

      {/* FILTROS INTERATIVOS + GRELHA DE PROGRAMAS */}
      <InstitucionalClient lang={lang} iniciativasIniciais={iniciativas} />

      {/* MALHA DE LINKS SEO POR DISTRITO */}
      {distritosUnicos.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-4 md:px-8 mt-16 pt-12 border-t border-slate-200">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5">
            {isEn
              ? "Browse Municipal & Social Programs by District"
              : "Explorar Programas de Autarquias por Distrito"}
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {distritosUnicos.map((d) => (
              <Link
                key={d}
                href={`/${lang}/institucional/distrito/${slugifyDistrito(d)}`}
                className="bg-white hover:bg-[#16A34A] text-[#0F172A] hover:text-white border border-slate-200 hover:border-[#16A34A] text-xs font-bold px-4 py-2 rounded-md no-underline transition-colors"
              >
                Campos de Férias em {d}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
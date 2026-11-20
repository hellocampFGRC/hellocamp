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
    ? "Municipal Holiday Camps in Portugal | City Councils & Parishes | HelloCamp"
    : "Campos de Férias das Autarquias e Câmaras Municipais em Portugal | HelloCamp";

  const description = isEn
    ? "Find official municipal holiday camps across Portugal (Cascais, Lisbon, Porto, Oeiras, Sintra, Braga, Faro). Check Summer, Easter, and Christmas dates, prices, and registration portals."
    : "Consulte num só portal os campos de férias municipais de Verão, Páscoa e Natal das Câmaras Municipais e Juntas de Freguesia (Cascais, Lisboa, Oeiras, Sintra, Loures, Porto, Braga, Faro e todo o país).";

  return {
    title,
    description,
    keywords: [
      "campos de férias autarquias",
      "campos de férias câmaras municipais",
      "campos de férias em cascais",
      "campos de férias em lisboa",
      "campos de férias em oeiras",
      "campos de férias em sintra",
      "campos de férias em loures",
      "campos de férias no porto",
      "férias desportivas municipais",
      "campos de férias gratuitos portugal",
      "campos de férias verão 2027",
      "campos de férias páscoa",
      "campos de férias natal",
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
      ? "Municipal Holiday Camps in Portugal"
      : "Campos de Férias das Autarquias em Portugal",
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

      {/* HERO AUTARQUIAS */}
      <section className="bg-[#16A34A] text-white pt-20 pb-28 px-4 md:px-8 border-b-8 border-[#F59E0B] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#F59E0B] rounded-full opacity-90 pointer-events-none hidden lg:block" />
        <div className="max-w-[1280px] mx-auto relative z-10">
          <span className="inline-block bg-[#0F172A] text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-md mb-4">
            🏛️{" "}
            {isEn
              ? "Municipalities & Parishes"
              : "Câmaras Municipais & Juntas de Freguesia"}
          </span>
          <h1 className="text-3xl md:text-6xl font-black tracking-tight text-white mb-4 max-w-3xl leading-tight">
            {isEn
              ? "Public & Municipal Holiday Programs"
              : "Campos de Férias das Autarquias e Juntas"}
          </h1>
          <p className="text-emerald-50 text-base md:text-xl font-medium max-w-2xl leading-relaxed">
            {isEn
              ? "Consult official municipal youth programs, dates, and registration links across Portugal."
              : "Consulte num só portal os programas municipais de férias de Verão, Páscoa e Natal, idades, valores e links oficiais de cada Câmara Municipal e Junta de Freguesia."}
          </p>
        </div>
      </section>

      {/* FILTROS INTERATIVOS + GRELA DE PROGRAMAS (SSR COM DADOS INICIAIS) */}
      <InstitucionalClient lang={lang} iniciativasIniciais={iniciativas} />

      {/* MALHA DE LINKS SEO POR DISTRITO (INDEXAÇÃO DIRETA PELO GOOGLE) */}
      {distritosUnicos.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-4 md:px-8 mt-16 pt-12 border-t border-slate-200">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-5">
            {isEn
              ? "Browse Municipal Programs by District"
              : "Explorar Campos de Férias Municipais por Distrito"}
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
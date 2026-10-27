"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&q=80&w=800";

export default function InstitucionalDistritoPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = use(params);
  const isEn = lang === "en";

  const preposicoes = ["de", "da", "do", "das", "dos"];
  const nomeDistrito = decodeURIComponent(slug)
    .replace(/-/g, " ")
    .split(" ")
    .map((w, idx) => {
      const lower = w.toLowerCase();
      if (idx > 0 && preposicoes.includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");

  const [iniciativas, setIniciativas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPorDistrito = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/institucional?distrito=${encodeURIComponent(nomeDistrito)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const json = await res.json();
          setIniciativas(json.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPorDistrito();
  }, [nomeDistrito]);

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-24">
      <div className="bg-[#0E3A68] pt-14 pb-14 px-6 text-center border-b border-slate-800">
        <span className="inline-block bg-white/10 text-[#e2a41d] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm mb-3">
          🏛️ {isEn ? "Municipal Directory" : "Diretório Autárquico"}
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-3">
          {isEn
            ? `Municipal Holiday Camps in ${nomeDistrito}`
            : `Campos de Férias Municipais em ${nomeDistrito}`}
        </h1>
        <p className="text-blue-100 font-medium max-w-2xl mx-auto m-0 text-sm md:text-base">
          {isEn
            ? "Explore all municipal and parish programs available in your region."
            : "Explore todos os programas de Câmaras Municipais e Juntas de Freguesia disponíveis na sua região."}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <Link
          href={`/${lang}/institucional`}
          className="text-xs font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-300 px-4 py-2.5 rounded-md hover:text-[#0E3A68] mb-8 inline-flex items-center gap-2 no-underline"
        >
          &larr;{" "}
          {isEn ? "Back to all municipalities" : "Voltar a todas as Autarquias"}
        </Link>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-md border border-slate-200 h-72 animate-pulse"
              />
            ))}
          </div>
        ) : iniciativas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-md border border-slate-200">
            <span className="text-4xl block mb-3">🏛️</span>
            <p className="text-slate-600 font-bold text-sm">
              {isEn
                ? `No municipal programs found for ${nomeDistrito}.`
                : `Nenhum programa autárquico encontrado para o distrito de ${nomeDistrito}.`}
            </p>
            <Link
              href={`/${lang}/institucional`}
              className="mt-4 inline-block bg-[#0E3A68] text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-md no-underline"
            >
              {isEn ? "See all programs" : "Ver todas as Autarquias"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {iniciativas.map((item) => (
              <div
                key={item.id}
                className="flex flex-col bg-white rounded-md shadow-sm border border-slate-200 hover:border-[#0E3A68] transition-all overflow-hidden"
              >
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    loading="lazy"
                    src={item.imagem_capa_url || FALLBACK_IMG}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMG;
                    }}
                    alt={item.titulo}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-slate-950/90 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">
                    📍 {item.concelho || item.distrito}
                  </span>
                </div>
                <div className="flex flex-col p-5 flex-1">
                  <p className="text-[11px] font-black uppercase text-[#0E3A68] m-0 mb-1">
                    🏛️ {item.entidade_organizadora}
                  </p>
                  <h3 className="text-base font-black text-slate-900 leading-snug mb-4 line-clamp-2">
                    {item.titulo}
                  </h3>
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Link
                      href={`/${lang}/institucional/${item.id}`}
                      className="text-center bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-md no-underline"
                    >
                      {isEn ? "Details" : "Ver Detalhes"}
                    </Link>
                    {item.link_oficial && (
                      <a
                        href={item.link_oficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-center bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-md no-underline"
                      >
                        Site Oficial ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
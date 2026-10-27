"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Crect fill='%23e2e8f0' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='40' font-weight='bold' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3EHelloCamp%3C/text%3E%3C/svg%3E";

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
      const { data } = await supabase
        .from("institucional_iniciativas")
        .select(
          "id, titulo, entidade_organizadora, imagem_capa_url, logotipo_url, distrito, concelho, idade_min_global, idade_max_global"
        )
        .eq("is_active", true)
        .ilike("distrito", `%${nomeDistrito}%`);

      setIniciativas(data || []);
      setLoading(false);
    };
    fetchPorDistrito();
  }, [nomeDistrito]);

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-24">
      <div className="bg-[#0E3A68] pt-16 pb-16 px-6 text-center">
        <span className="inline-block bg-white/10 text-[#e2a41d] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
          🏛️ {isEn ? "Municipal Directory" : "Diretório Autárquico"}
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
          {isEn
            ? `Municipal Holiday Camps in ${nomeDistrito}`
            : `Campos de Férias Municipais em ${nomeDistrito}`}
        </h1>
        <p className="text-blue-100 font-medium max-w-2xl mx-auto m-0">
          {isEn
            ? "Explore all municipal and parish programs available in your region."
            : "Explore todos os programas de Câmaras Municipais e Juntas de Freguesia disponíveis na sua região."}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <Link
          href={`/${lang}/institucional`}
          className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#0E3A68] mb-8 inline-flex items-center gap-2 no-underline"
        >
          &larr;{" "}
          {isEn ? "Back to all municipalities" : "Voltar a todas as autarquias"}
        </Link>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 h-72 animate-pulse"
              />
            ))}
          </div>
        ) : iniciativas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <span className="text-5xl block mb-4">🏛️</span>
            <p className="text-slate-600 font-bold">
              {isEn
                ? `No municipal programs found for ${nomeDistrito} at the moment.`
                : `Nenhum programa autárquico encontrado para o distrito de ${nomeDistrito} de momento.`}
            </p>
            <Link
              href={`/${lang}/institucional`}
              className="mt-4 inline-block bg-[#0E3A68] text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl no-underline"
            >
              {isEn ? "See all programs" : "Ver todos os programas"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {iniciativas.map((iniciativa) => (
              <Link
                key={iniciativa.id}
                href={`/${lang}/institucional/${iniciativa.id}`}
                className="group flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden no-underline text-inherit"
              >
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    loading="lazy"
                    src={iniciativa.imagem_capa_url || FALLBACK_IMG}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMG;
                    }}
                    alt={iniciativa.titulo}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col p-6 flex-1 relative pt-9">
                  <div className="absolute -top-6 left-5 w-12 h-12 bg-white rounded-full p-1.5 shadow-md border border-slate-100 flex items-center justify-center overflow-hidden">
                    {iniciativa.logotipo_url ? (
                      <img
                        loading="lazy"
                        src={iniciativa.logotipo_url}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-lg">🏛️</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-400 m-0 mb-1 line-clamp-1">
                    {iniciativa.entidade_organizadora}
                  </p>
                  <h3 className="text-lg font-black text-slate-900 leading-tight mb-4 group-hover:text-[#0E3A68] line-clamp-2">
                    {iniciativa.titulo}
                  </h3>
                  <div className="w-full text-center bg-slate-50 group-hover:bg-[#0E3A68] text-[#0E3A68] group-hover:text-white font-black uppercase tracking-widest text-xs py-3 rounded-xl transition-colors mt-auto">
                    {isEn ? "View Details" : "Ver Detalhes"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Crect fill='%23e2e8f0' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='40' font-weight='bold' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3EHelloCamp%3C/text%3E%3C/svg%3E";

export default function InstitucionalIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [iniciativas, setIniciativas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [distrito, setDistrito] = useState("");
  const [distritosDisponiveis, setDistritosDisponiveis] = useState<string[]>(
    []
  );
  const [isDistDropdownOpen, setIsDistDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchIniciativas = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("institucional_iniciativas")
        .select(
          "id, titulo, entidade_organizadora, imagem_capa_url, logotipo_url, distrito, concelho, idade_min_global, idade_max_global, is_active"
        )
        .eq("is_active", true)
        .order("titulo", { ascending: true });

      if (!error && data) {
        setIniciativas(data);
        const dists = Array.from(
          new Set(data.map((i: any) => i.distrito).filter(Boolean))
        ).sort() as string[];
        setDistritosDisponiveis(dists);
      }
      setLoading(false);
    };

    fetchIniciativas();
  }, []);

  const normalize = (s?: string) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const iniciativasFiltradas = iniciativas.filter((item) => {
    const matchDistrito =
      !distrito || normalize(item.distrito) === normalize(distrito);
    const q = normalize(pesquisa);
    const matchTexto =
      !q ||
      normalize(item.titulo).includes(q) ||
      normalize(item.entidade_organizadora).includes(q) ||
      normalize(item.concelho).includes(q) ||
      normalize(item.distrito).includes(q);
    return matchDistrito && matchTexto;
  });

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* HERO INSTITUCIONAL */}
      <section className="bg-gradient-to-br from-[#0E3A68] to-slate-900 text-white pt-16 pb-20 px-4 md:px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block bg-white/10 border border-white/20 text-[#e2a41d] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            🏛️{" "}
            {isEn
              ? "Municipalities & Parish Councils"
              : "Diretório de Câmaras Municipais e Juntas de Freguesia"}
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            {isEn
              ? "Public & Municipal Holiday Programs"
              : "Campos de Férias Municipais e Autárquicos"}
          </h1>
          <p className="text-blue-100/80 text-sm md:text-lg font-medium max-w-2xl mx-auto mb-10">
            {isEn
              ? "Discover accessible holiday programs organized by City Councils and Parish Councils across Portugal."
              : "Consulte num único lugar os programas de ocupação de tempos livres (OTL) e colónias de férias promovidos pelas autarquias."}
          </p>

          {/* BARRA DE PESQUISA + DROPDOWN CUSTOMIZADO DE DISTRITO */}
          <div className="bg-white p-3 rounded-2xl shadow-2xl max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-3 text-left">
            <div className="sm:col-span-7 flex items-center px-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 mr-3">🔍</span>
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder={
                  isEn
                    ? "Search by municipality, parish, or program..."
                    : "Pesquisar por Câmara, Junta, Concelho ou Programa..."
                }
                className="w-full py-3.5 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="sm:col-span-5 relative">
              <div
                onClick={() => setIsDistDropdownOpen(!isDistDropdownOpen)}
                className="w-full h-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 cursor-pointer flex items-center justify-between hover:border-[#0E3A68]"
              >
                <span className="truncate">
                  📍 {distrito || (isEn ? "All Districts" : "Todos os Distritos")}
                </span>
                <span className="text-[10px] text-slate-400 ml-2">▼</span>
              </div>
              {isDistDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDistDropdownOpen(false)}
                  />
                  <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                    <div
                      onClick={() => {
                        setDistrito("");
                        setIsDistDropdownOpen(false);
                      }}
                      className="p-3.5 text-xs font-black text-[#0E3A68] hover:bg-blue-50 cursor-pointer border-b border-slate-100"
                    >
                      {isEn ? "All Districts" : "Todos os Distritos"}
                    </div>
                    {distritosDisponiveis.map((d) => (
                      <div
                        key={d}
                        onClick={() => {
                          setDistrito(d);
                          setIsDistDropdownOpen(false);
                        }}
                        className="p-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ATALHOS DE DISTRITOS */}
      {distritosDisponiveis.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-6 pt-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {distritosDisponiveis.map((d) => (
              <Link
                key={d}
                href={`/${lang}/institucional/distrito/${encodeURIComponent(
                  d.toLowerCase().replace(/\s+/g, "-")
                )}`}
                className="px-4 py-2 bg-white hover:bg-[#0E3A68] hover:text-white border border-slate-200 rounded-full text-xs font-black text-slate-700 whitespace-nowrap no-underline shadow-sm transition-colors"
              >
                🏛️ {d}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* GRELHA DE INICIATIVAS */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden animate-pulse h-80"
              />
            ))}
          </div>
        ) : iniciativasFiltradas.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
            <span className="text-5xl block mb-4">🏛️</span>
            <h3 className="text-xl font-black text-slate-900 m-0 mb-2">
              {isEn
                ? "No municipal programs found"
                : "Nenhuma iniciativa municipal encontrada"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {isEn
                ? "Try clearing your search or selecting another region."
                : "Tente limpar a pesquisa ou selecionar outro distrito."}
            </p>
            <button
              type="button"
              onClick={() => {
                setPesquisa("");
                setDistrito("");
              }}
              className="bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl cursor-pointer"
            >
              {isEn ? "Reset Filters" : "Ver Todas as Autarquias"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {iniciativasFiltradas.map((iniciativa) => (
              <Link
                key={iniciativa.id}
                href={`/${lang}/institucional/${iniciativa.id}`}
                className="group flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-[#0E3A68]/30 transition-all duration-300 overflow-hidden no-underline text-inherit"
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
                  {iniciativa.distrito && (
                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[#0E3A68] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-sm">
                      📍 {iniciativa.concelho || iniciativa.distrito}
                    </span>
                  )}
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
                    {iniciativa.entidade_organizadora ||
                      (isEn ? "Official Entity" : "Entidade Municipal")}
                  </p>
                  <h3 className="text-lg font-black text-slate-900 leading-tight m-0 mb-3 group-hover:text-[#0E3A68] line-clamp-2">
                    {iniciativa.titulo}
                  </h3>

                  {(iniciativa.idade_min_global ||
                    iniciativa.idade_max_global) && (
                    <p className="text-xs font-bold text-slate-500 m-0 mb-4">
                      👶 {iniciativa.idade_min_global || 6} -{" "}
                      {iniciativa.idade_max_global || 16}{" "}
                      {isEn ? "years" : "anos"}
                    </p>
                  )}

                  <div className="w-full text-center bg-slate-50 group-hover:bg-[#0E3A68] text-[#0E3A68] group-hover:text-white font-black uppercase tracking-widest text-[11px] py-3 rounded-xl transition-colors mt-auto">
                    {isEn ? "View Programs" : "Ver Programas e Inscrição"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
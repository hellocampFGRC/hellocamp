"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&q=80&w=800";

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
      try {
        // 1. Vai buscar via API Server-Side (ignora bloqueios de RLS!)
        let registos: any[] = [];
        const res = await fetch("/api/institucional", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            registos = json.data;
          }
        }

        // 2. Fallback direto ao cliente Supabase caso necessário
        if (registos.length === 0) {
          const { data } = await supabase
            .from("institucional_iniciativas")
            .select("*")
            .order("distrito", { ascending: true });
          if (data) registos = data;
        }

        setIniciativas(registos);

        const dists = Array.from(
          new Set(
            registos
              .map((i: any) => (i.distrito || "").trim())
              .filter(Boolean)
          )
        ).sort() as string[];
        setDistritosDisponiveis(dists);
      } catch (err) {
        console.error("Erro ao carregar autarquias:", err);
      } finally {
        setLoading(false);
      }
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
      normalize(item.distrito).includes(q) ||
      normalize(item.descricao_html).includes(q);
    return matchDistrito && matchTexto;
  });

  // Limpa pipes iniciais das datas encontradas (ex: "| 1 de julho a 4 de setembro" -> "1 de julho a 4 de setembro")
  const limparDatas = (raw?: string | null) => {
    if (!raw) return null;
    const partes = raw
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s && !s.includes("2017"));
    return partes.length > 0 ? partes.slice(0, 2).join(" • ") : null;
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* CABEÇALHO / HERO EXECUTIVO */}
      <section className="bg-[#0E3A68] text-white pt-14 pb-16 px-4 md:px-6 border-b border-slate-800">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block bg-white/10 border border-white/20 text-[#e2a41d] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm mb-4">
            🏛️{" "}
            {isEn
              ? "Public Municipal Directory"
              : "Diretório Público de Câmaras Municipais e Juntas de Freguesia"}
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            {isEn
              ? "Municipal & Parish Summer Camps"
              : "Campos de Férias Municipais e Autárquicos"}
          </h1>
          <p className="text-blue-100/90 text-sm md:text-base font-medium max-w-2xl mx-auto mb-8 leading-relaxed">
            {isEn
              ? "Explore public holiday programs (ATL / OTL) organized by City Councils and Parish Councils across Portugal and access their official registration portals."
              : "Consulte os programas públicos de férias (OTL e ATL) promovidos pelas Câmaras Municipais e Juntas de Freguesia em Portugal e aceda diretamente aos portais e fichas de inscrição oficiais."}
          </p>

          {/* BARRA DE PESQUISA + DROPDOWN CUSTOMIZADO DE DISTRITO (BOTÕES RETOS rounded-md) */}
          <div className="bg-white p-2.5 rounded-md shadow-xl max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-left">
            <div className="sm:col-span-7 flex items-center px-3.5 bg-slate-50 rounded-md border border-slate-300">
              <span className="text-slate-400 mr-2.5">🔍</span>
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder={
                  isEn
                    ? "Search by municipality, parish, or city..."
                    : "Pesquisar Câmara, Junta, Concelho (ex: Lisboa, Gaia, Mafra)..."
                }
                className="w-full py-3 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
              />
              {pesquisa && (
                <button
                  type="button"
                  onClick={() => setPesquisa("")}
                  className="text-slate-400 hover:text-slate-700 font-black text-xs cursor-pointer bg-transparent border-0"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="sm:col-span-5 relative">
              <div
                onClick={() => setIsDistDropdownOpen(!isDistDropdownOpen)}
                className="w-full h-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-md text-xs font-black text-slate-800 cursor-pointer flex items-center justify-between hover:border-[#0E3A68]"
              >
                <span className="truncate">
                  📍{" "}
                  {distrito ||
                    (isEn
                      ? `All Districts (${iniciativas.length})`
                      : `Todos os Distritos (${iniciativas.length})`)}
                </span>
                <span className="text-[10px] text-slate-400 ml-2">▼</span>
              </div>
              {isDistDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDistDropdownOpen(false)}
                  />
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-2xl z-50 max-h-64 overflow-y-auto">
                    <div
                      onClick={() => {
                        setDistrito("");
                        setIsDistDropdownOpen(false);
                      }}
                      className="p-3 text-xs font-black text-[#0E3A68] hover:bg-blue-50 cursor-pointer border-b border-slate-100"
                    >
                      {isEn
                        ? `All Districts (${iniciativas.length})`
                        : `Todos os Distritos (${iniciativas.length})`}
                    </div>
                    {distritosDisponiveis.map((d) => {
                      const countDist = iniciativas.filter(
                        (i) => i.distrito === d
                      ).length;
                      return (
                        <div
                          key={d}
                          onClick={() => {
                            setDistrito(d);
                            setIsDistDropdownOpen(false);
                          }}
                          className="p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                        >
                          <span>{d}</span>
                          <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-sm text-slate-500">
                            {countDist}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FILTROS RÁPIDOS POR DISTRITO (BOTÕES RETOS) */}
      {distritosDisponiveis.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-6 pt-8">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDistrito("")}
              className={`px-3.5 py-2 rounded-md text-xs font-black uppercase tracking-wider cursor-pointer border transition-colors ${
                distrito === ""
                  ? "bg-[#0E3A68] text-white border-[#0E3A68]"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              {isEn ? "All" : "Todos"} ({iniciativas.length})
            </button>
            {distritosDisponiveis.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDistrito(distrito === d ? "" : d)}
                className={`px-3.5 py-2 rounded-md text-xs font-black uppercase tracking-wider cursor-pointer border transition-colors ${
                  distrito === d
                    ? "bg-[#0E3A68] text-white border-[#0E3A68]"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                🏛️ {d} ({iniciativas.filter((i) => i.distrito === d).length})
              </button>
            ))}
          </div>
        </section>
      )}

      {/* LISTAGEM COMPLETA DOS 24 PROGRAMAS AUTÁRQUICOS */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-md border border-slate-200 h-80 animate-pulse"
              />
            ))}
          </div>
        ) : iniciativasFiltradas.length === 0 ? (
          <div className="bg-white rounded-md border border-slate-200 p-12 text-center shadow-sm">
            <span className="text-4xl block mb-3">🏛️</span>
            <h3 className="text-lg font-black text-slate-900 m-0 mb-2">
              {isEn
                ? "No municipal programs match your search"
                : "Nenhuma iniciativa municipal encontrada para esta pesquisa"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setPesquisa("");
                setDistrito("");
              }}
              className="mt-4 bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-md cursor-pointer"
            >
              {isEn ? "Show All Municipalities" : "Mostrar Todas as Autarquias"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {iniciativasFiltradas.map((item) => {
              const datasLimpas = limparDatas(item.datas_encontradas);
              const linkDiretoInscricao =
                item.link_inscricao_extraido || item.link_oficial;
              const descTextoLimpo = (item.descricao_html || "")
                .replace(/<[^>]*>/g, "")
                .trim();

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-md border border-slate-200 shadow-sm hover:border-[#0E3A68] transition-all flex flex-col overflow-hidden"
                >
                  {/* Imagem de Topo */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                    <img
                      loading="lazy"
                      src={item.imagem_capa_url || FALLBACK_IMG}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                      alt={item.titulo}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="bg-slate-950/90 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">
                        📍 {item.concelho || item.distrito}
                      </span>
                      {item.distrito && item.distrito !== item.concelho && (
                        <span className="bg-white/95 text-slate-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">
                          {item.distrito}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Corpo do Cartão */}
                  <div className="p-5 flex-1 flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#0E3A68] block mb-1">
                      🏛️ {item.entidade_organizadora}
                    </span>

                    <Link
                      href={`/${lang}/institucional/${item.id}`}
                      className="no-underline text-slate-900 hover:text-[#0E3A68]"
                    >
                      <h3 className="text-lg font-black leading-snug m-0 mb-2 line-clamp-2">
                        {item.titulo}
                      </h3>
                    </Link>

                    {descTextoLimpo && (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 m-0 mb-4">
                        {descTextoLimpo}
                      </p>
                    )}

                    {/* Metadados Extraídos (Idades, Datas, Contactos) */}
                    <div className="mt-auto pt-3 border-t border-slate-100 space-y-1.5 text-xs mb-4">
                      <div className="flex items-center justify-between font-bold text-slate-700">
                        <span>
                          👶 Idades: {item.idade_min_global || 6} aos{" "}
                          {item.idade_max_global || 16} anos
                        </span>
                      </div>

                      {datasLimpas && (
                        <div className="text-[11px] font-bold text-[#167524] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-sm truncate">
                          📅 {datasLimpas}
                        </div>
                      )}

                      {(item.telefone_contato || item.email_contato) && (
                        <div className="text-[11px] font-semibold text-slate-500 truncate">
                          {item.telefone_contato
                            ? `📞 ${item.telefone_contato}`
                            : ""}{" "}
                          {item.email_contato
                            ? `• ✉️ ${item.email_contato.toLowerCase()}`
                            : ""}
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação Retos */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/${lang}/institucional/${item.id}`}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-center font-black uppercase tracking-widest text-[10px] py-3 rounded-md no-underline transition-colors"
                      >
                        {isEn ? "View Details" : "Ver Detalhes"}
                      </Link>

                      {linkDiretoInscricao ? (
                        <a
                          href={linkDiretoInscricao}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#167524] hover:bg-[#115a1b] text-white text-center font-black uppercase tracking-widest text-[10px] py-3 rounded-md no-underline transition-colors"
                        >
                          {isEn ? "Official Site ↗" : "Site Oficial ↗"}
                        </a>
                      ) : (
                        <Link
                          href={`/${lang}/institucional/${item.id}`}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-center font-black uppercase tracking-widest text-[10px] py-3 rounded-md no-underline"
                        >
                          Contactos
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
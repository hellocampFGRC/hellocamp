"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&q=80&w=1000";

function limparHtml(html?: string | null) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizar(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function InstitucionalClient({
  lang,
  iniciativasIniciais,
}: {
  lang: string;
  iniciativasIniciais: any[];
}) {
  const isEn = lang === "en";
  const [distritoFiltro, setDistritoFiltro] = useState("Todos");
  const [temporadaFiltro, setTemporadaFiltro] = useState("Todas");
  const [apenasJovens15, setApenasJovens15] = useState(false);
  const [apenasGratuitos, setApenasGratuitos] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownAberto(false);
      }
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  const distritosDisponiveis = [
    "Todos",
    ...Array.from(
      new Set(
        iniciativasIniciais
          .map((item) => (item.distrito || "").trim())
          .filter(Boolean)
      )
    ).sort(),
  ];

  const iniciativasFiltradas = iniciativasIniciais.filter((item) => {
    if (distritoFiltro !== "Todos" && item.distrito !== distritoFiltro) {
      return false;
    }

    if (apenasJovens15) {
      const maxIdade = Number(item.idade_max_global) || 16;
      if (maxIdade < 15) return false;
    }

    if (apenasGratuitos) {
      const precoNum =
        item.preco_base !== null && item.preco_base !== undefined
          ? Number(item.preco_base)
          : null;
      const textoGratuito = normalizar(
        `${item.titulo || ""} ${item.descricao_html || ""}`
      );
      if (
        !(
          (precoNum !== null && precoNum <= 0) ||
          textoGratuito.includes("gratuito") ||
          textoGratuito.includes("gratuita")
        )
      ) {
        return false;
      }
    }

    const textoCompleto = normalizar(
      `${item.titulo || ""} ${item.entidade_organizadora || ""} ${
        item.concelho || ""
      } ${item.distrito || ""} ${item.datas_encontradas || ""} ${
        item.descricao_html || ""
      }`
    );

    if (temporadaFiltro !== "Todas") {
      if (!textoCompleto.includes(normalizar(temporadaFiltro))) {
        return false;
      }
    }

    if (pesquisa.trim()) {
      const termo = normalizar(pesquisa.trim());
      if (!textoCompleto.includes(termo)) return false;
    }
    return true;
  });

  const temFiltros =
    distritoFiltro !== "Todos" ||
    temporadaFiltro !== "Todas" ||
    apenasJovens15 ||
    apenasGratuitos ||
    pesquisa.trim().length > 0;

  return (
    <>
      {/* BARRA DE PESQUISA E FILTROS */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8 -mt-10 relative z-30 mb-10">
        <div className="bg-white p-5 md:p-6 rounded-md shadow-xl border border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-end">
            <div className="w-full md:flex-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {isEn
                  ? "Search Municipality, Association or Activity"
                  : "Pesquisar Câmara, Associação, Concelho ou Atividade"}
              </label>
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder={
                  isEn
                    ? "e.g., Cascais, Sintra, Lisbon, Volunteering, Summer..."
                    : "Ex: Cascais, Sintra, Lisboa, Voluntariado, Verão, Desporto..."
                }
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md px-4 py-3.5 text-base sm:text-sm font-bold text-[#0F172A] outline-none focus:border-[#16A34A] focus:bg-white"
              />
            </div>

            <div ref={dropdownRef} className="w-full md:w-72 relative">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {isEn ? "Filter by District" : "Filtrar por Distrito"}
              </label>
              <button
                type="button"
                onClick={() => setDropdownAberto((prev) => !prev)}
                className="w-full bg-[#F8FAFC] border border-slate-200 hover:border-[#16A34A] rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">
                  {distritoFiltro === "Todos"
                    ? isEn
                      ? "All Districts"
                      : "Todos os Distritos"
                    : distritoFiltro}
                </span>
                <span className="text-xs text-slate-500">▼</span>
              </button>

              {dropdownAberto && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-md shadow-2xl max-h-64 overflow-y-auto py-1">
                  {distritosDisponiveis.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDistritoFiltro(d);
                        setDropdownAberto(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between cursor-pointer border-0 ${
                        distritoFiltro === d
                          ? "bg-[#16A34A] text-white font-black"
                          : "bg-white text-[#0F172A] hover:bg-slate-100"
                      }`}
                    >
                      <span>
                        {d === "Todos"
                          ? isEn
                            ? "All Districts"
                            : "Todos os Distritos"
                          : d}
                      </span>
                      {distritoFiltro === d && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {temFiltros && (
              <button
                type="button"
                onClick={() => {
                  setDistritoFiltro("Todos");
                  setTemporadaFiltro("Todas");
                  setApenasJovens15(false);
                  setApenasGratuitos(false);
                  setPesquisa("");
                }}
                className="w-full md:w-auto bg-[#F43F5E] hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest px-5 py-3.5 rounded-md border-0 cursor-pointer"
              >
                ✕ {isEn ? "Clear" : "Limpar"}
              </button>
            )}
          </div>

          {/* FILTROS RÁPIDOS: TEMPORADA + JOVENS 15+ + GRATUITOS */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">
              {isEn ? "Quick Filters:" : "Filtros Rápidos:"}
            </span>
            {["Todas", "Verão", "Páscoa", "Natal"].map((temp) => (
              <button
                key={temp}
                type="button"
                onClick={() => setTemporadaFiltro(temp)}
                className={`px-3.5 py-2 rounded-md text-xs font-black cursor-pointer border transition-colors ${
                  temporadaFiltro === temp
                    ? "bg-[#16A34A] text-white border-[#16A34A]"
                    : "bg-[#F8FAFC] text-slate-600 border-slate-200 hover:border-[#16A34A]"
                }`}
              >
                {temp === "Todas" && isEn ? "All Seasons" : temp}
              </button>
            ))}

            <div className="hidden sm:block h-5 w-px bg-slate-200 mx-1" />

            <button
              type="button"
              onClick={() => setApenasJovens15((prev) => !prev)}
              className={`px-3.5 py-2 rounded-md text-xs font-black cursor-pointer border transition-colors ${
                apenasJovens15
                  ? "bg-[#2563EB] text-white border-[#2563EB]"
                  : "bg-[#F8FAFC] text-slate-600 border-slate-200 hover:border-[#2563EB]"
              }`}
            >
              🎓 {isEn ? "Youth 15+ years" : "Jovens 15+ anos"}
            </button>

            <button
              type="button"
              onClick={() => setApenasGratuitos((prev) => !prev)}
              className={`px-3.5 py-2 rounded-md text-xs font-black cursor-pointer border transition-colors ${
                apenasGratuitos
                  ? "bg-[#F59E0B] text-[#0F172A] border-[#F59E0B]"
                  : "bg-[#F8FAFC] text-slate-600 border-slate-200 hover:border-[#F59E0B]"
              }`}
            >
              💚 {isEn ? "Free (0€)" : "Gratuitos (0€)"}
            </button>
          </div>
        </div>
      </section>

      {/* LISTAGEM DE INICIATIVAS */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <h2 className="text-xl md:text-2xl font-black text-[#0F172A] m-0">
            {isEn
              ? "Active Municipal & Social Initiatives"
              : "Iniciativas Municipais e Sociais Ativas"}
          </h2>
          <span className="bg-[#16A34A] text-white text-xs font-black px-3.5 py-1.5 rounded-md">
            {iniciativasFiltradas.length} {isEn ? "Programs" : "Programas"}
          </span>
        </div>

        {iniciativasFiltradas.length === 0 ? (
          <div className="bg-white rounded-md border border-slate-200 p-10 text-center max-w-xl mx-auto">
            <span className="text-4xl block mb-3">🏛️</span>
            <p className="text-sm font-bold text-slate-600 mb-4">
              {isEn
                ? "No programs found with these filters."
                : "Nenhum programa encontrado com os filtros selecionados."}
            </p>
            <button
              type="button"
              onClick={() => {
                setDistritoFiltro("Todos");
                setTemporadaFiltro("Todas");
                setApenasJovens15(false);
                setApenasGratuitos(false);
                setPesquisa("");
              }}
              className="bg-[#16A34A] text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-md border-0 cursor-pointer"
            >
              {isEn ? "Show All Programs" : "Ver Todos os Programas"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {iniciativasFiltradas.map((item) => {
              const titulo =
                item.titulo || item.entidade_organizadora || "Programa Municipal";
              const entidade =
                item.entidade_organizadora || item.concelho || "Autarquia";
              const resumo =
                limparHtml(item.descricao_html) ||
                "Programa municipal ou social de ocupação de tempos livres e férias escolares.";
              const fotoDefinida = item.imagem_capa_url || FALLBACK_IMG;
              const idadesTexto =
                item.idade_min_global && item.idade_max_global
                  ? `${item.idade_min_global} aos ${item.idade_max_global} anos`
                  : "6 aos 16 anos";

              const precoNum =
                item.preco_base !== null && item.preco_base !== undefined
                  ? Number(item.preco_base)
                  : null;

              return (
                <article
                  key={item.id}
                  className="group flex flex-col bg-white border border-slate-200 rounded-md shadow-sm hover:shadow-xl hover:border-[#16A34A] transition-all overflow-hidden"
                >
                  <div className="relative h-52 md:h-56 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={fotoDefinida}
                      alt={`${titulo} - ${item.concelho || item.distrito}`}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#16A34A] text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                      {item.distrito || "Portugal"}
                    </div>
                    {precoNum !== null && (
                      <div className="absolute top-3 right-3 bg-[#0F172A]/90 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                        {precoNum <= 0 ? "Gratuito" : `Desde ${precoNum}€`}
                      </div>
                    )}
                  </div>

                  <div className="p-5 md:p-6 flex flex-col flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#2563EB] mb-1 truncate">
                      {entidade} {item.concelho ? `• ${item.concelho}` : ""}
                    </span>
                    <h3 className="text-lg font-black text-[#0F172A] leading-snug mb-3 line-clamp-2">
                      {titulo}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-3 mb-4">
                      {resumo}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-500 truncate">
                        {idadesTexto}
                      </span>
                      <Link
                        href={`/${lang}/institucional/${item.slug || item.id}`}
                        className="bg-[#16A34A] hover:bg-emerald-700 text-white px-4 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest no-underline transition-colors shadow-sm shrink-0"
                      >
                        {isEn ? "View Details →" : "Ver Programa →"}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
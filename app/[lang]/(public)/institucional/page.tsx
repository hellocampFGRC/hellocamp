"use client";

import React, { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&q=80&w=1000";

function limparHtml(html: string) {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

export default function InstitucionalIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [iniciativas, setIniciativas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [distritoFiltro, setDistritoFiltro] = useState("Todos");
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

  useEffect(() => {
    async function carregarIniciativas() {
      setLoading(true);
      try {
        const res = await fetch("/api/institucional");
        if (res.ok) {
          const json = await res.json();
          const listaApi = Array.isArray(json) ? json : json.data;
          if (Array.isArray(listaApi) && listaApi.length > 0) {
            setIniciativas(listaApi);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        // Fallback direto para Supabase
      }

      const { data } = await supabase
        .from("institucional_iniciativas")
        .select("*")
        .order("created_at", { ascending: false });

      setIniciativas(data || []);
      setLoading(false);
    }

    carregarIniciativas();
  }, []);

  const distritosDisponiveis = [
    "Todos",
    ...Array.from(
      new Set(
        iniciativas
          .map((item) => (item.distrito || "").trim())
          .filter(Boolean)
      )
    ).sort(),
  ];

  const iniciativasFiltradas = iniciativas.filter((item) => {
    if (distritoFiltro !== "Todos" && item.distrito !== distritoFiltro) {
      return false;
    }
    if (pesquisa.trim()) {
      const termo = pesquisa.toLowerCase().trim();
      const texto = `${item.titulo || ""} ${item.entidade_organizadora || ""} ${
        item.entidade_nome || ""
      } ${item.concelho || ""} ${item.distrito || ""} ${
        item.descricao_html || ""
      }`.toLowerCase();
      if (!texto.includes(termo)) return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
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
              : "Consulte num só portal os programas municipais de férias desportivas e culturais, idades, datas e links oficiais de cada Câmara Municipal e Junta de Freguesia."}
          </p>
        </div>
      </section>

      {/* BARRA DE PESQUISA E DROPDOWN CUSTOMIZADO DE DISTRITO */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8 -mt-10 relative z-30 mb-12">
        <div className="bg-white p-6 rounded-md shadow-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:flex-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {isEn
                ? "Search Municipality or Program"
                : "Pesquisar Câmara, Junta ou Concelho"}
            </label>
            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder={
                isEn
                  ? "e.g., Cascais, Sintra, Lisboa, Porto..."
                  : "Ex: Cascais, Sintra, Lisboa, Porto, Oeiras..."
              }
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#16A34A] focus:bg-white"
            />
          </div>

          {/* DROPDOWN CUSTOMIZADO (SEM SELECT NATIVO) */}
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
              <svg
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  dropdownAberto ? "rotate-180 text-[#16A34A]" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
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

          {(distritoFiltro !== "Todos" || pesquisa) && (
            <button
              type="button"
              onClick={() => {
                setDistritoFiltro("Todos");
                setPesquisa("");
              }}
              className="w-full md:w-auto mt-5 bg-[#F43F5E] hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest px-5 py-3.5 rounded-md border-0 cursor-pointer"
            >
              ✕ {isEn ? "Clear" : "Limpar"}
            </button>
          )}
        </div>
      </section>

      {/* LISTAGEM DE INICIATIVAS AUTÁRQUICAS (LÊ IMAGEM_CAPA_URL E LOGOTIPO_URL REAIS) */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-[#0F172A] m-0">
            {isEn ? "Municipal Initiatives" : "Iniciativas Municipais Ativas"}
          </h2>
          <span className="bg-[#16A34A] text-white text-xs font-black px-3.5 py-1.5 rounded-md">
            {iniciativasFiltradas.length} {isEn ? "Programs" : "Programas"}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white rounded-md border border-slate-200 h-96 animate-pulse p-6"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {iniciativasFiltradas.map((item) => {
              const titulo =
                item.titulo ||
                item.entidade_organizadora ||
                item.entidade_nome ||
                "Programa Municipal";
              const entidade =
                item.entidade_organizadora ||
                item.entidade_nome ||
                item.concelho ||
                "Autarquia";
              const resumo =
                limparHtml(item.descricao_html) ||
                item.resumo ||
                "Programa municipal de ocupação de tempos livres e férias escolares.";

              // Lê a coluna real `imagem_capa_url` definida na base de dados!
              const fotoDefinida =
                item.imagem_capa_url ||
                item.imagem_url ||
                item.imagem ||
                item.foto_url ||
                FALLBACK_IMG;

              const idadesTexto =
                item.idade_min_global && item.idade_max_global
                  ? `${item.idade_min_global} aos ${item.idade_max_global} anos`
                  : item.faixa_etaria || "6 aos 16 anos";

              return (
                <div
                  key={item.id}
                  className="group flex flex-col bg-white border border-slate-200 rounded-md shadow-sm hover:shadow-xl hover:border-[#16A34A] transition-all overflow-hidden"
                >
                  <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={fotoDefinida}
                      alt={titulo}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#16A34A] text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                      🏛️ {item.distrito || "Portugal"}
                    </div>

                    {item.logotipo_url && (
                      <div className="absolute bottom-3 left-3 w-11 h-11 bg-white rounded-md p-1.5 shadow-md border border-slate-200 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.logotipo_url}
                          alt={entidade}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#2563EB] mb-1">
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
                        👶 {idadesTexto}
                      </span>
                      <Link
                        href={`/${lang}/institucional/${item.id}`}
                        className="bg-[#16A34A] hover:bg-emerald-700 text-white px-4 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest no-underline transition-colors shadow-sm"
                      >
                        {isEn ? "View Details →" : "Ver Programa →"}
                      </Link>
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
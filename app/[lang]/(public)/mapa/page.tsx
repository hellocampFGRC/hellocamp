"use client";

import React, { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MapaWrapper from "./MapaWrapper";

export default function PaginaMapa({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [campos, setCampos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [distritoFiltro, setDistritoFiltro] = useState("Todos");
  const [dropCatOpen, setDropCatOpen] = useState(false);
  const [dropDistOpen, setDropDistOpen] = useState(false);

  const catRef = useRef<HTMLDivElement>(null);
  const distRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeDrops = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setDropCatOpen(false);
      }
      if (distRef.current && !distRef.current.contains(e.target as Node)) {
        setDropDistOpen(false);
      }
    };
    document.addEventListener("mousedown", closeDrops);
    return () => document.removeEventListener("mousedown", closeDrops);
  }, []);

  useEffect(() => {
    async function fetchCampos() {
      setLoading(true);
      const { data } = await supabase
        .from("campos")
        .select("*")
        .eq("ativo", true);
      setCampos(data || []);
      setLoading(false);
    }
    fetchCampos();
  }, []);

  const categorias = [
    "Todas",
    ...Array.from(
      new Set(
        campos
          .map((c) => (isEn && c.categoria_en ? c.categoria_en : c.categoria))
          .filter(Boolean)
      )
    ),
  ];

  const distritos = [
    "Todos",
    ...Array.from(
      new Set(
        campos
          .map((c) => c.Distrito || c.local || c.local_en)
          .filter(Boolean)
      )
    ).sort(),
  ];

  const camposFiltrados = campos.filter((c) => {
    const catReal = isEn && c.categoria_en ? c.categoria_en : c.categoria;
    if (categoriaFiltro !== "Todas" && catReal !== categoriaFiltro) {
      return false;
    }
    const loc = c.Distrito || c.local;
    if (distritoFiltro !== "Todos" && loc !== distritoFiltro) {
      return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-16 flex flex-col">
      {/* BARRA DE TOPO DO MAPA */}
      <section className="bg-[#2563EB] text-white py-8 px-4 md:px-8 border-b-4 border-[#F59E0B]">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="inline-block bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-2">
              🗺️ {isEn ? "Geolocation Explorer" : "Exploração Geográfica"}
            </span>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white m-0">
              {isEn
                ? "Interactive Map of Holiday Camps"
                : "Mapa Interativo de Campos de Férias"}
            </h1>
          </div>

          {/* FILTROS COM DROPDOWNS 100% CUSTOMIZADOS */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Dropdown Categoria */}
            <div ref={catRef} className="relative w-52">
              <button
                type="button"
                onClick={() => setDropCatOpen((p) => !p)}
                className="w-full bg-white text-[#0F172A] px-4 py-3 rounded-md text-xs font-black uppercase tracking-wider flex items-center justify-between border-0 cursor-pointer shadow-md"
              >
                <span className="truncate">
                  {categoriaFiltro === "Todas"
                    ? isEn
                      ? "All Categories"
                      : "Todas as Categorias"
                    : categoriaFiltro}
                </span>
                <span>▾</span>
              </button>
              {dropCatOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-md shadow-2xl max-h-60 overflow-y-auto py-1">
                  {categorias.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategoriaFiltro(cat);
                        setDropCatOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between cursor-pointer border-0 ${
                        categoriaFiltro === cat
                          ? "bg-[#2563EB] text-white font-black"
                          : "bg-white text-[#0F172A] hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {categoriaFiltro === cat && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown Distrito */}
            <div ref={distRef} className="relative w-52">
              <button
                type="button"
                onClick={() => setDropDistOpen((p) => !p)}
                className="w-full bg-white text-[#0F172A] px-4 py-3 rounded-md text-xs font-black uppercase tracking-wider flex items-center justify-between border-0 cursor-pointer shadow-md"
              >
                <span className="truncate">
                  {distritoFiltro === "Todos"
                    ? isEn
                      ? "All Districts"
                      : "Todos os Distritos"
                    : distritoFiltro}
                </span>
                <span>▾</span>
              </button>
              {dropDistOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-md shadow-2xl max-h-60 overflow-y-auto py-1">
                  {distritos.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDistritoFiltro(d);
                        setDropDistOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between cursor-pointer border-0 ${
                        distritoFiltro === d
                          ? "bg-[#2563EB] text-white font-black"
                          : "bg-white text-[#0F172A] hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">{d}</span>
                      {distritoFiltro === d && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href={`/${lang}/pesquisa`}
              className="bg-[#F59E0B] hover:bg-amber-600 text-white px-5 py-3 rounded-md text-xs font-black uppercase tracking-widest no-underline shadow-md"
            >
              {isEn ? "List View →" : "Ver em Lista →"}
            </Link>
          </div>
        </div>
      </section>

      {/* CORPO: LISTA LATERAL + MAPA INTERATIVO (USANDO MapaWrapper) */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-8 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 w-full">
        <div className="lg:col-span-4 space-y-4 max-h-[680px] overflow-y-auto pr-1">
          <div className="bg-white p-4 rounded-md border border-slate-200 flex items-center justify-between shadow-sm">
            <span className="text-xs font-black uppercase tracking-widest text-[#0F172A]">
              {camposFiltrados.length}{" "}
              {isEn ? "Camps on Map" : "Campos no Mapa"}
            </span>
            {(categoriaFiltro !== "Todas" || distritoFiltro !== "Todos") && (
              <button
                type="button"
                onClick={() => {
                  setCategoriaFiltro("Todas");
                  setDistritoFiltro("Todos");
                }}
                className="bg-[#F43F5E] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border-0 cursor-pointer shadow-sm"
              >
                ✕ {isEn ? "Reset" : "Limpar"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-md h-28 animate-pulse border border-slate-200"
                />
              ))}
            </div>
          ) : camposFiltrados.length === 0 ? (
            <div className="bg-white p-8 rounded-md text-center border border-slate-200">
              <p className="text-sm font-bold text-slate-500 m-0">
                {isEn
                  ? "No camps found for this filter."
                  : "Nenhum campo encontrado com estes filtros."}
              </p>
            </div>
          ) : (
            camposFiltrados.map((c) => {
              const nome = isEn && c.nome_en ? c.nome_en : c.nome;
              const local = c.Distrito || c.local || "Portugal";
              const img = c.imagem?.startsWith("http")
                ? c.imagem
                : "/og-image.jpg";

              return (
                <Link
                  key={c.id}
                  href={`/${lang}/campo/${c.id}`}
                  className="flex gap-4 bg-white p-3.5 rounded-md border border-slate-200 hover:border-[#2563EB] shadow-sm transition-all no-underline group"
                >
                  <img
                    src={img}
                    alt={nome}
                    className="w-24 h-24 rounded-md object-cover flex-shrink-0 bg-slate-100"
                  />
                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <span className="inline-block bg-[#2563EB] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-1">
                        {isEn && c.categoria_en ? c.categoria_en : c.categoria}
                      </span>
                      <h3 className="text-sm font-black text-[#0F172A] group-hover:text-[#2563EB] truncate m-0">
                        {nome}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400 m-0 mt-0.5">
                        📍 {local}
                      </p>
                    </div>
                    <span className="bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md w-fit shadow-sm">
                      {isEn ? "View Camp →" : "Ver Campo →"}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <div className="lg:col-span-8 bg-white rounded-md border-2 border-slate-200 shadow-xl overflow-hidden min-h-[540px] lg:h-[680px]">
          <MapaWrapper campos={camposFiltrados || []} lang={lang} />
        </div>
      </section>
    </main>
  );
}
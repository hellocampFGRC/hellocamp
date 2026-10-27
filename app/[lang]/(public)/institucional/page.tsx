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
    const fetchTodasIniciativasAutarquicas = async () => {
      setLoading(true);

      // Procura nas 3 possíveis tabelas onde as autarquias foram inseridas (Sem exigir contrato!)
      const [resIniciativas, resProgramasInst, resCamposSemContrato] =
        await Promise.all([
          supabase.from("institucional_iniciativas").select("*"),
          supabase.from("programas_institucionais").select("*"),
          supabase
            .from("campos")
            .select("*")
            .is("contrato_parceiro_url", null),
        ]);

      const listaUnificada: any[] = [];
      const idsVistos = new Set<string>();

      // 1. Tabela institucional_iniciativas
      (resIniciativas.data || []).forEach((item: any) => {
        if (item.is_active === false) return;
        idsVistos.add(String(item.id));
        listaUnificada.push({
          id: item.id,
          origem: "institucional_iniciativas",
          titulo: item.titulo || item.nome || "Programa Municipal",
          entidade_organizadora:
            item.entidade_organizadora ||
            item.autarquia ||
            item.concelho ||
            "Câmara Municipal / Junta",
          imagem_capa_url: item.imagem_capa_url || item.imagem || FALLBACK_IMG,
          logotipo_url: item.logotipo_url || null,
          distrito: item.distrito || item.Distrito || "Portugal",
          concelho: item.concelho || item.local || "",
          idade_min_global: item.idade_min_global || item.idade_min || 6,
          idade_max_global: item.idade_max_global || item.idade_max || 16,
          link_oficial: item.link_oficial || item.website || null,
        });
      });

      // 2. Tabela programas_institucionais (Usada na Homepage!)
      (resProgramasInst.data || []).forEach((item: any) => {
        if (item.is_active === false || idsVistos.has(String(item.id))) return;
        idsVistos.add(String(item.id));
        listaUnificada.push({
          id: item.id,
          origem: "programas_institucionais",
          titulo: item.titulo || item.nome || "Programa Autárquico",
          entidade_organizadora:
            item.entidade_organizadora ||
            item.entidade ||
            item.autarquia ||
            item.concelho ||
            "Autarquia Local",
          imagem_capa_url:
            item.imagem_capa_url ||
            item.imagem_url ||
            item.imagem ||
            FALLBACK_IMG,
          logotipo_url: item.logotipo_url || null,
          distrito: item.distrito || item.Distrito || "Portugal",
          concelho: item.concelho || item.local || "",
          idade_min_global: item.idade_min_global || item.idade_min || 6,
          idade_max_global: item.idade_max_global || item.idade_max || 16,
          link_oficial:
            item.link_oficial || item.url_oficial || item.link || null,
        });
      });

      // 3. Campos Municipais / SEO sem contrato
      (resCamposSemContrato.data || []).forEach((c: any) => {
        if (idsVistos.has(String(c.id))) return;
        const texto = `${c.nome || ""} ${c.descricao || ""} ${
          c.local || ""
        }`.toLowerCase();
        const pareceAutarquia =
          texto.includes("câmara") ||
          texto.includes("camara") ||
          texto.includes("junta") ||
          texto.includes("freguesia") ||
          texto.includes("município") ||
          texto.includes("municipio") ||
          texto.includes("municipal") ||
          texto.includes("otl") ||
          !c.organizador_id;

        if (pareceAutarquia) {
          listaUnificada.push({
            id: c.id,
            origem: "campos",
            titulo: c.nome,
            entidade_organizadora: c.local || c.Distrito || "Iniciativa Local",
            imagem_capa_url: c.imagem || FALLBACK_IMG,
            logotipo_url: null,
            distrito: c.Distrito || "Portugal",
            concelho: c.local || "",
            idade_min_global: c.idade_min || 6,
            idade_max_global: c.idade_max || 16,
            link_oficial: c.link_externo_reserva || null,
          });
        }
      });

      setIniciativas(listaUnificada);

      const dists = Array.from(
        new Set(
          listaUnificada
            .map((i) => i.distrito)
            .filter((d) => d && d !== "Portugal")
        )
      ).sort() as string[];
      setDistritosDisponiveis(dists);
      setLoading(false);
    };

    fetchTodasIniciativasAutarquicas();
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
      <section className="bg-[#0E3A68] text-white pt-14 pb-16 px-4 md:px-6 text-center border-b border-slate-800">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block bg-white/10 border border-white/20 text-[#e2a41d] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm mb-4">
            🏛️{" "}
            {isEn
              ? "Public Municipal Directory"
              : "Diretório Informativo de Câmaras Municipais e Juntas de Freguesia"}
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            {isEn
              ? "Municipal & Parish Holiday Programs"
              : "Campos de Férias Municipais e Autárquicos"}
          </h1>
          <p className="text-blue-100/90 text-sm md:text-base font-medium max-w-2xl mx-auto mb-8">
            {isEn
              ? "Consult public holiday initiatives promoted by City and Parish Councils and access their official portals directly."
              : "Consulte os programas públicos de férias promovidos pelas Câmaras Municipais e Juntas de Freguesia e aceda diretamente aos portais oficiais de inscrição."}
          </p>

          {/* BARRA DE PESQUISA + DROPDOWN CUSTOMIZADO (DESIGN RETO rounded-md) */}
          <div className="bg-white p-2.5 rounded-md shadow-xl max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-left">
            <div className="sm:col-span-7 flex items-center px-3.5 bg-slate-50 rounded-md border border-slate-300">
              <span className="text-slate-400 mr-2.5">🔍</span>
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder={
                  isEn
                    ? "Search municipality, parish, or program..."
                    : "Pesquisar Câmara, Junta, Concelho ou Programa..."
                }
                className="w-full py-3 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="sm:col-span-5 relative">
              <div
                onClick={() => setIsDistDropdownOpen(!isDistDropdownOpen)}
                className="w-full h-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-md text-xs font-black text-slate-800 cursor-pointer flex items-center justify-between hover:border-[#0E3A68]"
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
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-2xl z-50 max-h-60 overflow-y-auto">
                    <div
                      onClick={() => {
                        setDistrito("");
                        setIsDistDropdownOpen(false);
                      }}
                      className="p-3 text-xs font-black text-[#0E3A68] hover:bg-blue-50 cursor-pointer border-b border-slate-100"
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
                        className="p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
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

      {/* GRELHA DE INICIATIVAS */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
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
                ? "No municipal programs found"
                : "Nenhum programa municipal encontrado"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setPesquisa("");
                setDistrito("");
              }}
              className="mt-4 bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-md cursor-pointer"
            >
              {isEn ? "Reset Filters" : "Ver Todas as Autarquias"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {iniciativasFiltradas.map((iniciativa) => {
              const hrefDestino =
                iniciativa.origem === "campos"
                  ? `/${lang}/campo/${iniciativa.id}`
                  : `/${lang}/institucional/${iniciativa.id}`;

              return (
                <div
                  key={`${iniciativa.origem}-${iniciativa.id}`}
                  className="group flex flex-col bg-white rounded-md shadow-sm border border-slate-200 hover:border-[#0E3A68] transition-all overflow-hidden"
                >
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      loading="lazy"
                      src={iniciativa.imagem_capa_url || FALLBACK_IMG}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                      alt={iniciativa.titulo}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-slate-900/90 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">
                      📍 {iniciativa.concelho || iniciativa.distrito}
                    </span>
                  </div>

                  <div className="flex flex-col p-5 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#0E3A68] m-0 mb-1 line-clamp-1">
                      🏛️ {iniciativa.entidade_organizadora}
                    </p>
                    <h3 className="text-base font-black text-slate-900 leading-snug m-0 mb-3 line-clamp-2">
                      {iniciativa.titulo}
                    </h3>

                    <p className="text-xs font-bold text-slate-500 m-0 mb-5">
                      👶 {iniciativa.idade_min_global} -{" "}
                      {iniciativa.idade_max_global} {isEn ? "years" : "anos"}
                    </p>

                    <div className="mt-auto flex flex-col gap-2">
                      <Link
                        href={hrefDestino}
                        className="w-full text-center bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest text-[11px] py-2.5 rounded-md no-underline transition-colors"
                      >
                        {isEn ? "View Details" : "Consultar Informações"}
                      </Link>
                      {iniciativa.link_oficial && (
                        <a
                          href={iniciativa.link_oficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-black uppercase tracking-widest text-[10px] py-2 rounded-md no-underline transition-colors"
                        >
                          {isEn ? "Official Website ↗" : "Site da Autarquia ↗"}
                        </a>
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
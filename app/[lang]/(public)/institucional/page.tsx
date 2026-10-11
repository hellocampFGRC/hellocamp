"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// ==========================================
// ÍCONES SVG INLINE (substituem os emojis)
// ==========================================
const IconSearch = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconBuilding = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="1" />
    <line x1="9" y1="22" x2="9" y2="18" />
    <line x1="15" y1="22" x2="15" y2="18" />
    <line x1="8" y1="6" x2="10" y2="6" />
    <line x1="8" y1="10" x2="10" y2="10" />
    <line x1="8" y1="14" x2="10" y2="14" />
    <line x1="14" y1="6" x2="16" y2="6" />
    <line x1="14" y1="10" x2="16" y2="10" />
    <line x1="14" y1="14" x2="16" y2="14" />
  </svg>
);

const IconMapPin = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconUsers = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// Fallback de imagem (SVG data URI - sem 404s)
const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Crect fill='%23e2e8f0' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='40' font-weight='bold' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3EHelloCamp%3C/text%3E%3C/svg%3E";

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function InstitucionalIndexPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [iniciativas, setIniciativas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [distrito, setDistrito] = useState('');
  const [distritosDisponiveis, setDistritosDisponiveis] = useState<string[]>([]);

  useEffect(() => {
    const fetchIniciativas = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('institucional_iniciativas')
        .select('id, titulo, entidade_organizadora, imagem_capa_url, logotipo_url, distrito, concelho, idade_min_global, idade_max_global, is_active')
        .eq('is_active', true);

      if (error) {
        console.error("Erro ao carregar iniciativas:", error);
        setIniciativas([]);
      } else if (data) {
        setIniciativas(data);
        // Extrair distritos únicos dinamicamente
        const setDistritos = new Set<string>();
        data.forEach((p: any) => {
          if (p.distrito && p.distrito.trim()) setDistritos.add(p.distrito.trim());
        });
        setDistritosDisponiveis(Array.from(setDistritos).sort());
      }
      setLoading(false);
    };
    fetchIniciativas();
  }, []);

  const programasFiltrados = iniciativas.filter(p => {
    const termo = pesquisa.toLowerCase().trim();
    const matchPesquisa =
      !termo ||
      p.titulo?.toLowerCase().includes(termo) ||
      p.entidade_organizadora?.toLowerCase().includes(termo) ||
      p.concelho?.toLowerCase().includes(termo);
    const matchDistrito = distrito === '' || p.distrito?.toLowerCase() === distrito.toLowerCase();
    return matchPesquisa && matchDistrito;
  });

  const limparFiltros = () => {
    setPesquisa('');
    setDistrito('');
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">

      {/* HERO */}
      <div className="bg-slate-900 pt-20 pb-24 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          {isEn ? 'Public & Municipal Programs' : 'Programas de Câmaras e Juntas'}
        </h1>
        <p className="text-slate-400 font-medium max-w-2xl mx-auto text-lg">
          {isEn
            ? 'Official youth initiatives promoted by Parish Councils and Municipalities.'
            : 'Iniciativas oficiais de tempos livres promovidas por Juntas de Freguesia e Municípios.'}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-10 relative z-10">

        {/* BARRA DE PESQUISA E FILTROS */}
        <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder={isEn ? "Search programs, municipalities..." : "Pesquisar programas, municípios..."}
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <select
              value={distrito}
              onChange={(e) => setDistrito(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none cursor-pointer hover:bg-slate-50 min-w-[160px]"
            >
              <option value="">{isEn ? 'All Districts' : 'Todos os Distritos'}</option>
              {distritosDisponiveis.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={limparFiltros}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
            >
              {isEn ? 'Clear' : 'Limpar'}
            </button>
          </div>
        </div>

        {/* RESULTADOS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-5 bg-slate-200 rounded w-full" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : programasFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <IconBuilding className="w-8 h-8" />
            </div>
            <p className="text-slate-500 font-bold text-lg">
              {isEn ? 'No programs found.' : 'Nenhum programa encontrado.'}
            </p>
            {(pesquisa || distrito) && (
              <button
                type="button"
                onClick={limparFiltros}
                className="mt-4 text-sm font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2 cursor-pointer"
              >
                {isEn ? 'Clear filters' : 'Limpar filtros'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programasFiltrados.map(iniciativa => (
              <Link
                key={iniciativa.id}
                href={`/${lang}/institucional/${iniciativa.id}`}
                className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 overflow-hidden"
              >

                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    loading="lazy"
                    src={iniciativa.imagem_capa_url || FALLBACK_IMG}
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                    alt={iniciativa.titulo}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                    {isEn ? 'Public Entity' : 'Entidade Pública'}
                  </div>
                </div>

                <div className="flex flex-col p-5 flex-1 relative pt-8">
                  <div className="absolute -top-6 left-5 w-12 h-12 bg-white rounded-full p-1.5 shadow-md border border-slate-100 flex items-center justify-center overflow-hidden">
                    {iniciativa.logotipo_url ? (
                      <img
                        loading="lazy"
                        src={iniciativa.logotipo_url}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-slate-500">
                        <IconBuilding className="w-5 h-5" />
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-500 mb-1 line-clamp-1">
                    {iniciativa.entidade_organizadora || (isEn ? 'Official Entity' : 'Entidade Oficial')}
                  </p>
                  <h3 className="text-lg font-black text-slate-900 leading-tight mb-4 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {iniciativa.titulo}
                  </h3>

                  <div className="space-y-2 mb-6 mt-auto">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <span className="text-slate-400">
                        <IconUsers className="w-4 h-4" />
                      </span>
                      {iniciativa.idade_min_global || 6} - {iniciativa.idade_max_global || 16} {isEn ? 'years' : 'anos'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <span className="text-slate-400">
                        <IconMapPin className="w-4 h-4" />
                      </span>
                      <span className="line-clamp-1">
                        {iniciativa.concelho || 'Portugal'}{iniciativa.distrito ? `, ${iniciativa.distrito}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="w-full text-center border border-emerald-600 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white font-bold text-sm py-2.5 rounded-lg transition-colors">
                    {isEn ? 'View Details' : 'Ver mais detalhes'}
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
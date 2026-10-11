"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// ==========================================
// ÍCONES SVG INLINE
// ==========================================
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

const IconArrowLeft = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Crect fill='%23e2e8f0' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='40' font-weight='bold' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3EHelloCamp%3C/text%3E%3C/svg%3E";

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function InstitucionalDistritoPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = use(params);
  const isEn = lang === 'en';

  // Formata o slug do URL: "viana-do-castelo" → "Viana Do Castelo"
  const nomeDistrito = decodeURIComponent(slug)
    .replace(/-/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const [iniciativas, setIniciativas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIniciativas = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('institucional_iniciativas')
        .select('id, titulo, entidade_organizadora, imagem_capa_url, logotipo_url, distrito, concelho, idade_min_global, idade_max_global')
        .eq('is_active', true)
        .ilike('distrito', `%${nomeDistrito}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Erro ao carregar iniciativas:", error);
        setIniciativas([]);
      } else if (data) {
        setIniciativas(data);
      }
      setLoading(false);
    };
    fetchIniciativas();
  }, [nomeDistrito]);

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">

      {/* HERO */}
      <div className="bg-emerald-900 pt-20 pb-16 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
          {isEn ? `Holiday Camps in ${nomeDistrito}` : `Campos de Férias em ${nomeDistrito}`}
        </h1>
        <p className="text-emerald-100 font-medium max-w-2xl mx-auto">
          {isEn
            ? 'Explore all municipal programs available in your region.'
            : 'Explore todos os programas municipais disponíveis na sua região.'}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <Link
          href={`/${lang}/institucional`}
          className="text-sm font-bold text-slate-500 hover:text-emerald-600 mb-8 inline-flex items-center gap-2 transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          {isEn ? 'Back to all programs' : 'Voltar a todos os programas'}
        </Link>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-5 bg-slate-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : iniciativas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <IconBuilding className="w-8 h-8" />
            </div>
            <p className="text-slate-500 font-bold">
              {isEn
                ? `No programs found for ${nomeDistrito} at the moment.`
                : `Nenhum programa encontrado para o distrito de ${nomeDistrito} de momento.`}
            </p>
            <Link
              href={`/${lang}/institucional`}
              className="mt-4 inline-block text-sm font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
            >
              {isEn ? 'See all programs' : 'Ver todos os programas'}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm font-bold text-slate-500">
              {iniciativas.length} {isEn ? 'programs found' : 'programas encontrados'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {iniciativas.map(iniciativa => (
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
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-4 group-hover:text-emerald-600 line-clamp-2">
                      {iniciativa.titulo}
                    </h3>
                    <div className="w-full text-center border border-emerald-600 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white font-bold text-sm py-2.5 rounded-lg transition-colors mt-auto">
                      {isEn ? 'View Details' : 'Ver Detalhes'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
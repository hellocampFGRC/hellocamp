"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function InstitucionalDistritoPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = use(params);
  const isEn = lang === 'en';
  
  const nomeDistrito = decodeURIComponent(slug).charAt(0).toUpperCase() + decodeURIComponent(slug).slice(1).replace('-', ' ');

  const [iniciativas, setIniciativas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIniciativas = async () => {
      // OTIMIZAÇÃO EGRESS: Seleção restrita
      const { data, error } = await supabase
        .from('institucional_iniciativas')
        .select('id, titulo, entidade_organizadora, imagem_capa_url, logotipo_url, distrito, concelho, idade_min_global, idade_max_global')
        .eq('is_active', true)
        .ilike('distrito', `%${nomeDistrito}%`)
        .order('created_at', { ascending: false });
      
      if (data) setIniciativas(data);
      setLoading(false);
    };
    fetchIniciativas();
  }, [nomeDistrito]);

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      
      <div className="bg-emerald-900 pt-20 pb-16 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
          {isEn ? `Holiday Camps in ${nomeDistrito}` : `Campos de Férias em ${nomeDistrito}`}
        </h1>
        <p className="text-emerald-100 font-medium max-w-2xl mx-auto">
          {isEn ? 'Explore all municipal programs available in your region.' : 'Explore todos os programas municipais disponíveis na sua região.'}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <Link href={`/${lang}/institucional`} className="text-sm font-bold text-slate-500 hover:text-emerald-600 mb-8 inline-block">
          &larr; {isEn ? 'Back to all programs' : 'Voltar a todos os programas'}
        </Link>

        {loading ? (
          <div className="text-center py-10 font-bold text-slate-400 animate-pulse">A carregar...</div>
        ) : iniciativas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
             <p className="text-slate-500 font-bold">Nenhum programa encontrado para o distrito de {nomeDistrito} de momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {iniciativas.map(iniciativa => (
               <Link key={iniciativa.id} href={`/${lang}/institucional/${iniciativa.id}`} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 overflow-hidden">
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img loading="lazy" src={iniciativa.imagem_capa_url || '/og-image.jpg'} alt={iniciativa.titulo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col p-5 flex-1 relative pt-8">
                    <div className="absolute -top-6 left-5 w-12 h-12 bg-white rounded-full p-1.5 shadow-md border border-slate-100 flex items-center justify-center overflow-hidden">
                      {iniciativa.logotipo_url ? <img loading="lazy" src={iniciativa.logotipo_url} alt="Logo" className="w-full h-full object-contain" /> : <span>🏛️</span>}
                    </div>
                    <p className="text-xs font-bold text-slate-500 mb-1">{iniciativa.entidade_organizadora}</p>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-4 group-hover:text-emerald-600 line-clamp-2">{iniciativa.titulo}</h3>
                    <div className="w-full text-center border border-emerald-600 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white font-bold text-sm py-2.5 rounded-lg transition-colors mt-auto">
                      {isEn ? 'View Details' : 'Ver Detalhes'}
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
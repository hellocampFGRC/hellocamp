"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function InstitucionalIndexPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  
  const [iniciativas, setIniciativas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [distrito, setDistrito] = useState('');

  useEffect(() => {
    const fetchIniciativas = async () => {
      setLoading(true);
      // OTIMIZAÇÃO EGRESS: Pedir apenas os campos que vão ser desenhados no ecrã!
      const { data, error } = await supabase
        .from('institucional_iniciativas')
        .select('id, titulo, entidade_organizadora, imagem_capa_url, logotipo_url, distrito, concelho, idade_min_global, idade_max_global')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (data) setIniciativas(data);
      if (error) console.error("Erro ao carregar iniciativas:", error);
      setLoading(false);
    };
    fetchIniciativas();
  }, []);

  const programasFiltrados = iniciativas.filter(p => {
    const matchPesquisa = p.titulo?.toLowerCase().includes(pesquisa.toLowerCase()) || p.entidade_organizadora?.toLowerCase().includes(pesquisa.toLowerCase());
    const matchDistrito = distrito === '' || p.distrito?.toLowerCase() === distrito.toLowerCase();
    return matchPesquisa && matchDistrito;
  });

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      
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
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
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
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none cursor-pointer hover:bg-slate-50 min-w-[140px]"
            >
              <option value="">{isEn ? 'All Districts' : 'Todos os Distritos'}</option>
              <option value="Lisboa">Lisboa</option>
              <option value="Porto">Porto</option>
              <option value="Faro">Faro</option>
              <option value="Setúbal">Setúbal</option>
              <option value="Braga">Braga</option>
            </select>
            <button onClick={() => {setPesquisa(''); setDistrito('');}} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
              {isEn ? 'Clear' : 'Limpar'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold animate-pulse">A carregar programas oficiais...</div>
        ) : programasFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-4xl block mb-4">🏛️</span>
            <p className="text-slate-500 font-bold text-lg">{isEn ? 'No programs found.' : 'Nenhum programa encontrado.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programasFiltrados.map(iniciativa => (
               <Link key={iniciativa.id} href={`/${lang}/institucional/${iniciativa.id}`} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 overflow-hidden">
                  
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    {/* OTIMIZAÇÃO: Tag <img> nativa com loading="lazy" para poupar o plano gratuito do Vercel */}
                    <img loading="lazy" src={iniciativa.imagem_capa_url || '/og-image.jpg'} alt={iniciativa.titulo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                      {isEn ? 'Public Entity' : 'Entidade Pública'}
                    </div>
                  </div>
                  
                  <div className="flex flex-col p-5 flex-1 relative pt-8">
                    <div className="absolute -top-6 left-5 w-12 h-12 bg-white rounded-full p-1.5 shadow-md border border-slate-100 flex items-center justify-center overflow-hidden">
                      {iniciativa.logotipo_url ? (
                        <img loading="lazy" src={iniciativa.logotipo_url} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xl">🏛️</span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-slate-500 mb-1 line-clamp-1">{iniciativa.entidade_organizadora}</p>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-4 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {iniciativa.titulo}
                    </h3>
                    
                    <div className="space-y-2 mb-6 mt-auto">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <span className="text-slate-400">👶</span> {iniciativa.idade_min_global || 6} - {iniciativa.idade_max_global || 16} anos
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                        <span className="text-slate-400">📍</span> <span className="line-clamp-1">{iniciativa.concelho}, {iniciativa.distrito}</span>
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
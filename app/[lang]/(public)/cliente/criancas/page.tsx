"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function ListaCriancas({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [criancas, setCriancas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCriancas = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('criancas')
        .select('*')
        .eq('cliente_id', session.user.id)
        .order('created_at', { ascending: false });
      
      setCriancas(data || []);
      setLoading(false);
    };
    fetchCriancas();
  }, []);

  const handleCriarNovaCrianca = () => {
    router.push(`/${lang}/cliente/criancas/novo`);
  };

  const calcularIdade = (dataNasc: string) => {
    if (!dataNasc) return null;
    const diff = Date.now() - new Date(dataNasc).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-20 font-sans">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 m-0 tracking-tight">
            {isEn ? 'My Children' : 'Os Meus Filhos'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">
            {isEn ? 'Manage participant profiles for faster bookings.' : 'Gira os perfis dos participantes para reservas mais rápidas e seguras.'}
          </p>
        </div>
        
        <button onClick={handleCriarNovaCrianca} className="w-full sm:w-auto bg-[#0E3A68] hover:bg-[#0b2b4d] text-white px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-md hover:-translate-y-0.5">
          + {isEn ? 'Add Child' : 'Adicionar Participante'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">
          {isEn ? 'Loading profiles...' : 'A carregar perfis familiares...'}
        </div>
      ) : criancas.length === 0 ? (
        <div className="text-center py-16 md:py-24 px-6 bg-white border-2 border-dashed border-slate-300 rounded-[2rem] shadow-sm">
          <span className="text-5xl block mb-6 opacity-50">👦</span>
          <p className="text-slate-500 mb-6 text-base md:text-lg font-medium">{isEn ? 'No children profiles found yet.' : 'Ainda não adicionou o perfil do seu filho(a).'}</p>
          <button onClick={handleCriarNovaCrianca} className="bg-[#e2a41d] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:bg-[#d4991b] transition-all cursor-pointer">
            {isEn ? 'Create profile now' : 'Criar Primeiro Perfil'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {criancas.map(c => {
            const idade = calcularIdade(c.data_nascimento);
            
            return (
              <Link key={c.id} href={`/${lang}/cliente/criancas/${c.id}`} className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-200 no-underline text-inherit flex flex-col shadow-sm hover:shadow-lg hover:border-[#0E3A68] transition-all duration-300 group">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="m-0 text-2xl font-black text-slate-900 leading-tight truncate pr-2 group-hover:text-[#0E3A68] transition-colors">{c.nome}</h3>
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0E3A68] group-hover:text-white group-hover:border-[#0E3A68] transition-all shadow-sm">
                    ✎
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap mb-8">
                  {idade !== null ? (
                    <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 shadow-sm">🎂 {idade} {isEn ? 'years' : 'anos'}</span>
                  ) : (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black shadow-sm">⚠️ Idade em falta</span>
                  )}
                  {c.sexo && c.sexo !== 'Prefiro não dizer' && (
                    <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 shadow-sm">👤 {c.sexo}</span>
                  )}
                </div>

                <div className="mt-auto pt-5 border-t border-slate-100">
                  {c.restricoes_alimentares || c.doencas_cronicas ? (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-3 shadow-inner">
                      <span className="text-lg">⚠️</span> 
                      <span className="font-bold uppercase tracking-wider text-[10px]">{isEn ? 'Active Medical Alerts' : 'Alertas Clínicos Ativos'}</span>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-3 shadow-inner">
                      <span className="text-lg text-emerald-500">✅</span> 
                      <span className="font-bold uppercase tracking-wider text-[10px]">{isEn ? 'No health restrictions' : 'Sem restrições de saúde'}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
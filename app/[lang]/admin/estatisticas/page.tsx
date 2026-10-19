"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

export default function EstatisticasPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [totais, setTotais] = useState({ visualizacoes: 0, camposAtivos: 0 });

  useEffect(() => {
    async function fetchEstatisticas() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // 1. Obter o perfil do organizador
        const { data: perfil } = await supabase
          .from("perfis")
          .select("id")
          .eq("auth_id", session.user.id)
          .single();

        if (!perfil) return;

        // 2. Obter os campos do organizador
        const { data: campos } = await supabase
          .from("campos")
          .select("id, nome, nome_en, status")
          .eq("organizador_id", perfil.id);

        if (!campos || campos.length === 0) {
          setLoading(false);
          return;
        }

        const camposAtivos = campos.filter(c => c.status === 'publicado').length;

        // 3. Obter as estatísticas de visualizações (da nova tabela SQL)
        const camposIds = campos.map(c => c.id);
        const { data: viewsData } = await supabase
          .from("campo_estatisticas_mensais")
          .select("campo_id, visualizacoes")
          .in("campo_id", camposIds);

        // 4. Agregar os dados
        let totalViewsGlobais = 0;
        const camposComEstatisticas = campos.map(campo => {
          // Somar todas as views de todos os meses para este campo específico
          const viewsDesteCampo = viewsData
            ?.filter(v => v.campo_id === campo.id)
            .reduce((acc, curr) => acc + (curr.visualizacoes || 0), 0) || 0;
          
          totalViewsGlobais += viewsDesteCampo;

          return {
            ...campo,
            nomeDisplay: isEn && campo.nome_en ? campo.nome_en : campo.nome,
            totalViews: viewsDesteCampo
          };
        });

        // Ordenar do mais visto para o menos visto
        camposComEstatisticas.sort((a, b) => b.totalViews - a.totalViews);

        setStats(camposComEstatisticas);
        setTotais({ visualizacoes: totalViewsGlobais, camposAtivos });

      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEstatisticas();
  }, [isEn]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#167524]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">
          {isEn ? 'Performance & Analytics' : 'Desempenho e Estatísticas'}
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          {isEn 
            ? 'Track how many families are viewing your camps on HelloCamp.' 
            : 'Acompanhe quantas famílias estão a visualizar os seus campos na HelloCamp.'}
        </p>
      </div>

      {/* Cartões de Resumo Global (Estética Verde B2B) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-10">
        
        {/* Cartão de Views */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#167524]/5 rounded-full -mr-10 -mt-10"></div>
          <div className="w-14 h-14 bg-[#167524]/10 text-[#167524] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
            👁️
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              {isEn ? 'Total Profile Views' : 'Visualizações Totais'}
            </p>
            <h2 className="text-4xl font-black text-slate-900 m-0">
              {totais.visualizacoes.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* Cartão de Campos Ativos */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full -mr-10 -mt-10"></div>
          <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
            🏕️
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              {isEn ? 'Active Camps' : 'Campos Publicados'}
            </p>
            <h2 className="text-4xl font-black text-slate-900 m-0">
              {totais.camposAtivos}
            </h2>
          </div>
        </div>

      </div>

      {/* Tabela de Performance por Campo */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-base font-black text-slate-900 m-0">
            {isEn ? 'Performance by Camp' : 'Performance por Campo'}
          </h3>
        </div>

        {stats.length === 0 ? (
          <div className="p-10 text-center text-slate-500 font-medium text-sm">
            {isEn ? 'You do not have any published camps yet.' : 'Ainda não tem campos publicados no diretório.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4 font-bold">{isEn ? 'Camp Name' : 'Nome do Campo'}</th>
                  <th className="px-6 py-4 font-bold">{isEn ? 'Status' : 'Estado'}</th>
                  <th className="px-6 py-4 font-bold text-right">{isEn ? 'Views' : 'Visualizações'}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {stats.map((campo) => (
                  <tr key={campo.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-800">
                      {campo.nomeDisplay}
                    </td>
                    <td className="px-6 py-4">
                      {campo.status === 'publicado' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          {isEn ? 'Online' : 'Online'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          {isEn ? 'Draft' : 'Rascunho'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 text-right">
                      {campo.totalViews > 0 ? (
                        <span className="bg-[#167524]/10 text-[#167524] px-3 py-1 rounded-lg">
                          {campo.totalViews}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
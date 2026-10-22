"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import React from "react";

export default function GestaoCamposHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  
  const [campos, setCampos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de Ajuste de Comissão
  const [showModal, setShowModal] = useState(false);
  const [campoEmEdicao, setCampoEmEdicao] = useState<any>(null);

  const fetchCamposGerais = async () => {
    const { data: camposData } = await supabase.from('campos').select('*').order('created_at', { ascending: false });
    const { data: perfisData } = await supabase.from('perfis').select('id, empresa_nome, email, taxa_comissao, base_comissao, status_contrato');

    const camposComPerfis = (camposData || []).map(campo => {
      const organizador = perfisData?.find(p => p.id === campo.organizador_id);
      
      let precoMinimo = campo.preco || 0;
      
      // BLINDAGEM DE PREVENÇÃO DE ERRO DE MAPPING
      let pacotesArray = [];
      if (typeof campo.pacotes === 'string') {
        try { pacotesArray = JSON.parse(campo.pacotes); } catch(e) { pacotesArray = []; }
      } else if (Array.isArray(campo.pacotes)) {
        pacotesArray = campo.pacotes;
      }

      if (pacotesArray.length > 0) {
        const todosPrecos = pacotesArray.flatMap((p: any) => 
          (Array.isArray(p.variantes) ? p.variantes : []).map((v: any) => Number(v.preco) || 0)
        );
        if (todosPrecos.length > 0) precoMinimo = Math.min(...todosPrecos);
      }

      return {
        ...campo,
        precoCalculado: precoMinimo,
        perfis: organizador || { empresa_nome: 'Sem Registo', email: '', status_contrato: null }
      };
    });

    setCampos(camposComPerfis);
    setLoading(false);
  };

  useEffect(() => { fetchCamposGerais(); }, []);

  const handleApagarCampo = async (id: string, nomeCampo: string) => {
    if (!window.confirm(`Tem a certeza que deseja apagar o campo "${nomeCampo}" permanentemente?`)) return;
    const { error } = await supabase.from('campos').delete().eq('id', id);
    if (!error) { 
      alert("Campo removido com sucesso."); 
      fetchCamposGerais(); 
    } else {
      alert("Erro ao apagar: " + error.message);
    }
  };

  const handleSalvarComissao = async (e: React.FormEvent) => {
    e.preventDefault();
    const taxa = campoEmEdicao.taxa_comissao === '' ? null : Number(campoEmEdicao.taxa_comissao);
    const base = campoEmEdicao.base_comissao === '' ? null : campoEmEdicao.base_comissao;

    const { error } = await supabase.from('campos').update({ taxa_comissao: taxa, base_comissao: base }).eq('id', campoEmEdicao.id);

    if (!error) { 
      alert("Comissão atualizada com sucesso no Programa!"); 
      setShowModal(false); 
      fetchCamposGerais(); 
    } else {
      alert("Erro: " + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Aprovado') return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Aprovado' };
    if (status === 'Rejeitado') return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Rejeitado' };
    return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: status || 'Pendente' }; 
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold animate-pulse">A carregar programas do Quartel General...</div>;

  return (
    <div className="max-w-7xl mx-auto font-sans pb-16 px-4 md:px-0">
      
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 m-0 tracking-tight">Gestão de Campos</h1>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Controlo absoluto sobre programas, comissões e listagens.</p>
      </div>

      {/* MODAL DE AJUSTE DE COMISSÃO */}
      {showModal && campoEmEdicao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center font-black transition-colors">&times;</button>
            <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Ajustar Comissão do Programa</h2>
            
            <form onSubmit={handleSalvarComissao} className="flex flex-col gap-5">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-800 m-0">Se deixar vazio, aplicará a comissão global do parceiro <span className="font-black">({campoEmEdicao.perfis?.taxa_comissao || 12}%)</span>.</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Taxa de Comissão (%)</label>
                <input type="number" step="0.1" value={campoEmEdicao.taxa_comissao || ''} onChange={e => setCampoEmEdicao({...campoEmEdicao, taxa_comissao: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600 transition-colors shadow-sm" placeholder="Ex: 15" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Base de Incidência</label>
                <select value={campoEmEdicao.base_comissao || ''} onChange={e => setCampoEmEdicao({...campoEmEdicao, base_comissao: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600 transition-colors shadow-sm appearance-none cursor-pointer">
                  <option value="">-- Usar regra do Parceiro --</option>
                  <option value="total">Sobre Valor Total</option>
                  <option value="apenas_programa">Apenas sobre Programa</option>
                  <option value="sem_comissao">Isento (0%)</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 mt-2 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer">
                Guardar Exceção no Programa
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[1.5rem] overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Programa</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Parceiro</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Logística & Status</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Preço & Comissão</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campos.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold text-sm">Sem programas registados.</td></tr>
            ) : (
              campos.map((campo) => {
                const isCustom = campo.taxa_comissao !== null && campo.taxa_comissao !== undefined;
                const taxaVisual = isCustom ? campo.taxa_comissao : (campo.perfis?.taxa_comissao || 12);
                const statusColor = getStatusColor(campo.status_aprovacao);
                
                return (
                  <tr key={campo.id} className="hover:bg-slate-50 transition-colors">
                    
                    {/* PROGRAMA */}
                    <td className="px-6 py-4">
                      <div className="font-black text-sm text-slate-900 leading-tight">{campo.nome}</div>
                      <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">📍 {campo.local?.split(',')[0]}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">{campo.categoria}</div>
                    </td>
                    
                    {/* PARCEIRO */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700 text-xs block truncate max-w-[150px]">{campo.perfis?.empresa_nome}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Global: {campo.perfis?.status_contrato || 'N/A'}</span>
                    </td>
                    
                    {/* LOGÍSTICA & STATUS */}
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                          {statusColor.label}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm bg-indigo-50 text-indigo-700 border-indigo-200">
                          {campo.modalidade_reserva === 'link_externo' ? '🔗 Ext.' : (campo.modalidade_reserva === 'email' ? '✉️ Cons.' : '🛒 Checkout')}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {campo.vagas_totais || 0} Vagas • {campo.pacotes?.length || 0} Pacotes
                      </span>
                    </td>
                    
                    {/* PREÇO E COMISSÃO */}
                    <td className="px-6 py-4">
                      <span className="block text-sm font-black text-slate-900 mb-1.5">
                         €{campo.precoCalculado} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Base</span>
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm ${isCustom ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        Fee: {taxaVisual}%
                      </span>
                    </td>
                    
                    {/* AÇÕES (Simplificado conforme pedido) */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 flex-wrap ml-auto">
                        <Link href={`/${lang}/superadmin/campos/editar/${campo.id}`} className="px-4 py-2 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 shadow-sm transition-colors">
                          Editar HQ
                        </Link>
                        <button onClick={() => { setCampoEmEdicao(campo); setShowModal(true); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 shadow-sm transition-colors">
                          Fee%
                        </button>
                        <button onClick={() => handleApagarCampo(campo.id, campo.nome)} className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-100 shadow-sm transition-colors">
                          Apagar
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
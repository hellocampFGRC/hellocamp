"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import React from "react";

export default function GestaoCamposHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  
  const [campos, setCampos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [campoEmEdicao, setCampoEmEdicao] = useState<any>(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState({ url: "", nome: "" });
  const [copied, setCopied] = useState(false);

  const fetchCamposGerais = async () => {
    const { data: camposData } = await supabase.from('campos').select('*').order('created_at', { ascending: false });
    const { data: perfisData } = await supabase.from('perfis').select('id, empresa_nome, email, taxa_comissao, base_comissao, status_contrato');

    const camposComPerfis = (camposData || []).map(campo => {
      const organizador = perfisData?.find(p => p.id === campo.organizador_id);
      
      let precoMinimo = campo.preco || 0;
      if (campo.pacotes && campo.pacotes.length > 0) {
        const todosPrecos = campo.pacotes.flatMap((p: any) => p.variantes?.map((v: any) => v.preco) || []);
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
    if (!error) { alert("Campo removido com sucesso."); fetchCamposGerais(); } 
    else alert("Erro ao apagar: " + error.message);
  };

  const handleSalvarComissao = async (e: React.FormEvent) => {
    e.preventDefault();
    const taxa = campoEmEdicao.taxa_comissao === '' ? null : Number(campoEmEdicao.taxa_comissao);
    const base = campoEmEdicao.base_comissao === '' ? null : campoEmEdicao.base_comissao;

    const { error } = await supabase.from('campos').update({ taxa_comissao: taxa, base_comissao: base }).eq('id', campoEmEdicao.id);

    if (!error) { alert("Comissão atualizada com sucesso no Programa!"); setShowModal(false); fetchCamposGerais(); } 
    else alert("Erro: " + error.message);
  };

  const handleGerarContrato = (campoId: string, nomeCampo: string) => {
    const url = `${window.location.origin}/${lang}/assinatura-contrato/${campoId}`;
    setShareData({ url, nome: nomeCampo });
    setCopied(false);
    setShowShareModal(true);
  };

  const copyToClipboard = async () => {
    try { await navigator.clipboard.writeText(shareData.url); setCopied(true); setTimeout(() => setCopied(false), 2500); } 
    catch (err) { alert("Erro ao copiar o link."); }
  };

  const getStatusColor = (status: string, temContrato: boolean) => {
    if (status === 'Aprovado' && temContrato) return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Aprovado' };
    if (status === 'Aprovado' && !temContrato) return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'Aprov. S/ Contrato' };
    if (status === 'Rejeitado') return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Rejeitado' };
    return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', label: status || 'Pendente' }; 
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

      {/* MODAL DE PARTILHA DE CONTRATO */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative">
            <button onClick={() => setShowShareModal(false)} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center font-black transition-colors">&times;</button>
            <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Link de Assinatura</h2>
            <p className="text-sm font-medium text-slate-500 mb-6">O Parceiro deste programa não assinou o contrato global. Envie-lhe este link exclusivo para aprovação.</p>
            
            <div className="flex flex-col gap-5">
              <div className="flex gap-2">
                <input readOnly value={shareData.url} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none shadow-inner" onClick={(e) => (e.target as HTMLInputElement).select()} />
                <button onClick={copyToClipboard} className={`px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-md ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <div className="border-t border-slate-100 my-2"></div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={`https://wa.me/?text=${encodeURIComponent(`Olá! Segue o link para validação e assinatura digital do contrato do programa "${shareData.nome}" na plataforma HelloCamp:\n\n${shareData.url}`)}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs uppercase tracking-widest rounded-xl text-center shadow-md transition-colors no-underline">
                  💬 WhatsApp
                </a>
                <a href={`mailto:?subject=${encodeURIComponent(`Assinatura de Contrato HelloCamp - ${shareData.nome}`)}&body=${encodeURIComponent(`Olá,\n\nSegue o link para validação e assinatura digital do contrato referente ao programa "${shareData.nome}".\n\nAceda através deste link seguro:\n${shareData.url}\n\nObrigado,\nEquipa HelloCamp`)}`} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl text-center shadow-md transition-colors no-underline">
                  ✉️ E-mail
                </a>
              </div>
            </div>
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
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações e Contrato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campos.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold text-sm">Sem programas registados.</td></tr>
            ) : (
              campos.map((campo) => {
                const isCustom = campo.taxa_comissao !== null && campo.taxa_comissao !== undefined;
                const taxaVisual = isCustom ? campo.taxa_comissao : (campo.perfis?.taxa_comissao || 12);
                
                const temContrato = !!campo.contrato_parceiro_url || campo.perfis?.status_contrato === 'Aprovado';
                const statusColor = getStatusColor(campo.status_aprovacao, temContrato);
                
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
                    
                    {/* AÇÕES E CONTRATOS */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 flex-wrap max-w-[280px] ml-auto">
                        <Link href={`/${lang}/campo/${campo.id}`} target="_blank" className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-50 shadow-sm transition-colors">Ver Perfil</Link>
                        <Link href={`/${lang}/superadmin/campos/editar/${campo.id}`} className="px-3 py-1.5 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-800 shadow-sm transition-colors">Editar HQ</Link>
                        <button onClick={() => { setCampoEmEdicao(campo); setShowModal(true); }} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-50 shadow-sm transition-colors">Fee%</button>
                        
                        {/* Lógica Inteligente de Contrato */}
                        {campo.contrato_parceiro_url ? (
                          <a href={campo.contrato_parceiro_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-emerald-100 shadow-sm transition-colors no-underline">Contrato Anexo</a>
                        ) : (campo.perfis?.status_contrato === 'Aprovado' ? (
                          <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] uppercase tracking-widest rounded-lg shadow-sm cursor-default">✅ Coberto (Global)</span>
                        ) : (
                          <button onClick={() => handleGerarContrato(campo.id, campo.nome)} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-blue-100 shadow-sm transition-colors">Pedir Assinatura</button>
                        ))}

                        <button onClick={() => handleApagarCampo(campo.id, campo.nome)} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-100 shadow-sm transition-colors">Apagar</button>
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
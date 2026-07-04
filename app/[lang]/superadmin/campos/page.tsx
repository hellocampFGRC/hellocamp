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

  const fetchCamposGerais = async () => {
    const { data: camposData } = await supabase.from('campos').select('*').order('created_at', { ascending: false });
    const { data: perfisData } = await supabase.from('perfis').select('id, empresa_nome, email, taxa_comissao, base_comissao');

    const camposComPerfis = (camposData || []).map(campo => {
      const organizador = perfisData?.find(p => p.id === campo.organizador_id);
      
      let precoMinimo = campo.preco || 0;
      if (campo.pacotes && campo.pacotes.length > 0) {
        const todosPrecos = campo.pacotes.flatMap((p: any) => p.variantes?.map((v: any) => v.preco) || []);
        if (todosPrecos.length > 0) {
          precoMinimo = Math.min(...todosPrecos);
        }
      }

      return {
        ...campo,
        precoCalculado: precoMinimo,
        perfis: organizador || { empresa_nome: 'Sem Registo', email: '' }
      };
    });

    setCampos(camposComPerfis);
    setLoading(false);
  };

  useEffect(() => {
    fetchCamposGerais();
  }, []);

  const handleApagarCampo = async (id: string, nomeCampo: string) => {
    if (!window.confirm(`Tem a certeza que deseja apagar o campo "${nomeCampo}" permanentemente?`)) return;
    const { error } = await supabase.from('campos').delete().eq('id', id);
    if (!error) {
      alert("Campo removido com sucesso.");
      fetchCamposGerais();
    } else alert("Erro ao apagar: " + error.message);
  };

  const handleSalvarComissao = async (e: React.FormEvent) => {
    e.preventDefault();
    const taxa = campoEmEdicao.taxa_comissao === '' ? null : Number(campoEmEdicao.taxa_comissao);
    const base = campoEmEdicao.base_comissao === '' ? null : campoEmEdicao.base_comissao;

    const { error } = await supabase.from('campos').update({
      taxa_comissao: taxa,
      base_comissao: base
    }).eq('id', campoEmEdicao.id);

    if (!error) {
      alert("Comissão atualizada com sucesso!");
      setShowModal(false);
      fetchCamposGerais();
    } else alert("Erro: " + error.message);
  };

  // Lógica do Link de Contrato Inteligente
  const handleGerarContrato = async (campoId: string) => {
    const url = `${window.location.origin}/${lang}/assinatura-contrato/${campoId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert(`✅ Link de assinatura gerado e copiado!\n\nEnvie este link ao parceiro:\n${url}\n\nO parceiro poderá rever os dados preenchidos, assinar digitalmente e o PDF será gravado na base de dados.`);
    } catch (err) {
      alert(`Erro ao copiar o link. Por favor copie manualmente:\n${url}`);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'Aprovado') return { bg: '#dcfce7', text: '#059669', border: '#bbf7d0' };
    if (status === 'Rejeitado') return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
    return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' }; 
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>A carregar programas do Quartel General...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', paddingBottom: '3rem' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>Gestão de Campos</h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '13px' }}>Controlo absoluto sobre programas, comissões e aprovação de contratos.</p>
      </div>

      {showModal && campoEmEdicao && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontWeight: '900', fontSize: '1.125rem' }}>Ajustar Comissão: {campoEmEdicao.nome}</h2>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleSalvarComissao} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '0.5rem' }}>
                Se vazio, usa a comissão geral do parceiro ({campoEmEdicao.perfis?.taxa_comissao || 12}%).
              </p>
              <div>
                <label style={labelStyle}>Taxa de Comissão (%)</label>
                <input type="number" step="0.1" value={campoEmEdicao.taxa_comissao || ''} onChange={e => setCampoEmEdicao({...campoEmEdicao, taxa_comissao: e.target.value})} style={inputStyle} placeholder="Ex: 15" />
              </div>
              <div>
                <label style={labelStyle}>Base de Incidência</label>
                <select value={campoEmEdicao.base_comissao || ''} onChange={e => setCampoEmEdicao({...campoEmEdicao, base_comissao: e.target.value})} style={selectStyle}>
                  <option value="">-- Usar regra do Parceiro --</option>
                  <option value="total">Sobre Valor Total</option>
                  <option value="apenas_programa">Apenas sobre Programa</option>
                  <option value="sem_comissao">Isento (0%)</option>
                </select>
              </div>
              <button type="submit" style={btnSubmitStyle}>Guardar Alteração</button>
            </form>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={thStyle}>PROGRAMA</th>
              <th style={thStyle}>PARCEIRO</th>
              <th style={thStyle}>LOGÍSTICA & STATUS</th>
              <th style={thStyle}>PREÇO & COMISSÃO</th>
              <th style={thStyle}>AÇÕES E CONTRATO</th>
            </tr>
          </thead>
          <tbody>
            {campos.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>Sem programas registados.</td></tr>
            ) : (
              campos.map((campo) => {
                const isCustom = campo.taxa_comissao !== null && campo.taxa_comissao !== undefined;
                const taxaVisual = isCustom ? campo.taxa_comissao : (campo.perfis?.taxa_comissao || 12);
                const statusColor = getStatusColor(campo.status_aprovacao);
                
                return (
                  <tr key={campo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    
                    {/* PROGRAMA */}
                    <td style={{ ...tdStyle, color: '#0f172a' }}>
                      <div style={{ fontWeight: '900', fontSize: '12px' }}>{campo.nome}</div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginTop: '0.25rem' }}>📍 {campo.local?.split(',')[0]}</div>
                      <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '0.15rem' }}>{campo.categoria}</div>
                    </td>
                    
                    {/* PARCEIRO */}
                    <td style={{ ...tdStyle, fontSize: '11px' }}>
                      <span style={{ fontWeight: 'bold', color: '#334155' }}>{campo.perfis?.empresa_nome}</span>
                    </td>
                    
                    {/* LOGÍSTICA & STATUS */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '9px', padding: '0.15rem 0.35rem', backgroundColor: statusColor.bg, color: statusColor.text, borderRadius: '0.25rem', fontWeight: 'bold', border: `1px solid ${statusColor.border}` }}>
                          {campo.status_aprovacao || 'Pendente'}
                        </span>
                        <span style={{ fontSize: '9px', padding: '0.15rem 0.35rem', backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: '0.25rem', fontWeight: 'bold' }}>
                          {campo.modalidade_reserva === 'link_externo' ? '🔗 Ext.' : (campo.modalidade_reserva === 'email' ? '✉️ Cons.' : '🛒 Check.')}
                        </span>
                      </div>
                      <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>
                        {campo.vagas_totais || 0} Vagas • {campo.pacotes?.length || 0} Pacotes
                      </span>
                    </td>
                    
                    {/* PREÇO E COMISSÃO */}
                    <td style={tdStyle}>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#0f172a', marginBottom: '0.25rem' }}>
                         a partir de €{campo.precoCalculado}
                      </span>
                      <span style={{ backgroundColor: isCustom ? '#fef3c7' : '#f8fafc', color: isCustom ? '#b45309' : '#475569', padding: '0.15rem 0.3rem', borderRadius: '0.25rem', fontSize: '9px', fontWeight: 'bold', border: `1px solid ${isCustom ? '#fde68a' : '#e2e8f0'}` }}>
                        Comissão: {taxaVisual}%
                      </span>
                    </td>
                    
                    {/* AÇÕES E CONTRATOS */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', maxWidth: '250px' }}>
                        <Link href={`/${lang}/campo/${campo.id}`} target="_blank" style={btnActionStyle('#f8fafc', '#0f172a', '#e2e8f0')}>Ver Perfil</Link>
                        <Link href={`/${lang}/superadmin/campos/editar/${campo.id}`} style={btnActionStyle('#f8fafc', '#0f172a', '#e2e8f0')}>Editar HQ</Link>
                        <button onClick={() => { setCampoEmEdicao(campo); setShowModal(true); }} style={btnActionStyle('#f8fafc', '#0f172a', '#e2e8f0')}>Comissão</button>
                        
                        {/* BOTÃO INTELIGENTE DO CONTRATO */}
                        {campo.contrato_parceiro_url ? (
                          <a href={campo.contrato_parceiro_url} target="_blank" rel="noopener noreferrer" style={btnActionStyle('#ecfdf5', '#059669', '#a7f3d0')}>Ver Contrato</a>
                        ) : (
                          <button onClick={() => handleGerarContrato(campo.id)} style={btnActionStyle('#eff6ff', '#2563eb', '#bfdbfe')}>Gerar Contrato</button>
                        )}

                        <button onClick={() => handleApagarCampo(campo.id, campo.nome)} style={btnActionStyle('#fef2f2', '#dc2626', '#fecaca')}>Apagar</button>
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

// ESTILOS GERAIS
const modalOverlayStyle = { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '100%', maxWidth: '400px', borderRadius: '1rem', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase' as const, marginBottom: '0.3rem' };
const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '13px', color: '#0f172a', outline: 'none' };
const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' as const };
const btnSubmitStyle = { width: '100%', padding: '1rem', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', fontSize: '12px', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem' };
const thStyle = { padding: '1rem 1rem', fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em' };
const tdStyle = { padding: '0.85rem 1rem', color: '#334155', verticalAlign: 'middle' };

const btnActionStyle = (bg: string, color: string, border: string) => ({ 
  padding: '0.35rem 0.6rem', 
  backgroundColor: bg, 
  color: color, 
  borderRadius: '0.4rem', 
  textDecoration: 'none' as const, 
  fontWeight: 'bold', 
  fontSize: '10px', 
  cursor: 'pointer', 
  border: `1px solid ${border}`, 
  display: 'inline-flex' 
});
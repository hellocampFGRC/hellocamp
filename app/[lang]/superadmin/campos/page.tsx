"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import React from "react";

export default function GestaoCamposHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  
  const [campos, setCampos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Comissão
  const [showModal, setShowModal] = useState(false);
  const [campoEmEdicao, setCampoEmEdicao] = useState<any>(null);

  // Modal Partilha de Contrato
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
        if (todosPrecos.length > 0) {
          precoMinimo = Math.min(...todosPrecos);
        }
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
      alert("Comissão atualizada com sucesso no Programa!");
      setShowModal(false);
      fetchCamposGerais();
    } else alert("Erro: " + error.message);
  };

  const handleGerarContrato = (campoId: string, nomeCampo: string) => {
    const url = `${window.location.origin}/${lang}/assinatura-contrato/${campoId}`;
    setShareData({ url, nome: nomeCampo });
    setCopied(false);
    setShowShareModal(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      alert("Erro ao copiar o link.");
    }
  };

  const getStatusColor = (status: string, temContrato: boolean) => {
    if (status === 'Aprovado' && temContrato) return { bg: '#dcfce7', text: '#059669', border: '#bbf7d0', label: 'Aprovado' };
    if (status === 'Aprovado' && !temContrato) return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: 'Aprovado (Sem Contrato)' };
    if (status === 'Rejeitado') return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca', label: 'Rejeitado' };
    return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: status || 'Pendente' }; 
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>A carregar programas do Quartel General...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', paddingBottom: '3rem' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>Gestão de Campos</h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '13px' }}>Controlo absoluto sobre programas, comissões e listagens de mercado.</p>
      </div>

      {/* MODAL DE AJUSTE DE COMISSÃO */}
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
              <button type="submit" style={btnSubmitStyle}>Guardar Exceção no Programa</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PARTILHA DE CONTRATO (QUANDO NECESSÁRIO) */}
      {showShareModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontWeight: '900', fontSize: '1.125rem', color: '#0f172a' }}>Link de Assinatura</h2>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '12px', color: '#64748b' }}>O Parceiro deste programa não assinou o contrato global. Envie-lhe este link.</p>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1rem', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}>×</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  readOnly 
                  value={shareData.url} 
                  style={{ ...inputStyle, flex: 1, backgroundColor: '#f1f5f9', color: '#334155', cursor: 'text' }} 
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button 
                  onClick={copyToClipboard}
                  style={{ padding: '0 1rem', backgroundColor: copied ? '#10b981' : '#0f172a', color: 'white', fontWeight: 'bold', fontSize: '12px', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s', whiteSpace: 'nowrap' }}
                >
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
              <div style={{ borderTop: '1px dashed #e2e8f0', margin: '0.5rem 0' }}></div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a href={`https://wa.me/?text=${encodeURIComponent(`Olá! Segue o link para validação e assinatura digital do contrato do programa "${shareData.nome}" na plataforma HelloCamp:\n\n${shareData.url}`)}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '0.8rem', backgroundColor: '#25D366', color: 'white', fontWeight: 'bold', fontSize: '12px', borderRadius: '0.5rem', textDecoration: 'none', textAlign: 'center', display: 'block' }}>WhatsApp</a>
                <a href={`mailto:?subject=${encodeURIComponent(`Assinatura de Contrato HelloCamp - ${shareData.nome}`)}&body=${encodeURIComponent(`Olá,\n\nSegue o link para validação e assinatura digital do contrato referente ao programa "${shareData.nome}".\n\nAceda através deste link seguro:\n${shareData.url}\n\nObrigado,\nEquipa HelloCamp`)}`} style={{ flex: 1, padding: '0.8rem', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '12px', borderRadius: '0.5rem', textDecoration: 'none', textAlign: 'center', display: 'block' }}>E-mail</a>
              </div>
            </div>
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
                
                // O campo é considerado como tendo contrato se o próprio campo tiver ou se o perfil global do organizador tiver o status Aprovado.
                const temContrato = !!campo.contrato_parceiro_url || campo.perfis?.status_contrato === 'Aprovado';
                const statusColor = getStatusColor(campo.status_aprovacao, temContrato);
                
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
                      <span style={{ display: 'block', color: '#94a3b8', fontSize: '9px', marginTop: '2px' }}>Estado Global: {campo.perfis?.status_contrato || 'N/A'}</span>
                    </td>
                    
                    {/* LOGÍSTICA & STATUS */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '9px', padding: '0.15rem 0.35rem', backgroundColor: statusColor.bg, color: statusColor.text, borderRadius: '0.25rem', fontWeight: 'bold', border: `1px solid ${statusColor.border}` }}>
                          {statusColor.label}
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
                        
                        {/* Lógica Inteligente de Contrato */}
                        {campo.contrato_parceiro_url ? (
                          <a href={campo.contrato_parceiro_url} target="_blank" rel="noopener noreferrer" style={btnActionStyle('#ecfdf5', '#059669', '#a7f3d0')}>Contrato Anexo</a>
                        ) : (campo.perfis?.status_contrato === 'Aprovado' ? (
                          <span style={{...btnActionStyle('#f0fdfa', '#0369a1', '#ccfbf1'), cursor: 'default'}}>✅ Coberto por Contrato Global</span>
                        ) : (
                          <button onClick={() => handleGerarContrato(campo.id, campo.nome)} style={btnActionStyle('#eff6ff', '#2563eb', '#bfdbfe')}>Pedir Assinatura</button>
                        ))}

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
const modalOverlayStyle = { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' };
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
  display: 'inline-flex',
  alignItems: 'center'
});
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
    const { data: camposData } = await supabase.from('campos').select('*').order('id', { ascending: false });
    const { data: perfisData } = await supabase.from('perfis').select('id, empresa_nome, email, taxa_comissao, base_comissao');

    const camposComPerfis = (camposData || []).map(campo => {
      const organizador = perfisData?.find(p => p.id === campo.organizador_id);
      return {
        ...campo,
        perfis: organizador || { empresa_nome: 'Sem Registo Associado', email: '' }
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

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>A carregar programas...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', paddingBottom: '3rem' }}>
      
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>Todos os Campos</h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>Gestão geral de programas e comissões associadas.</p>
      </div>

      {showModal && campoEmEdicao && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontWeight: '900', fontSize: '1.25rem' }}>Ajustar Comissão: {campoEmEdicao.nome}</h2>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleSalvarComissao} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1rem' }}>
                Se deixar em branco, será usada a comissão geral do parceiro ({campoEmEdicao.perfis?.taxa_comissao || 12}%).
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
              <button type="submit" style={btnSubmitStyle}>Guardar</button>
            </form>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={thStyle}>PROGRAMA</th>
              <th style={thStyle}>PARCEIRO</th>
              <th style={thStyle}>TURNOS / OPÇÕES</th>
              <th style={thStyle}>COMISSÃO</th>
              <th style={thStyle}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {campos.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Sem programas registados.</td></tr>
            ) : (
              campos.map((campo) => {
                const isCustom = campo.taxa_comissao !== null && campo.taxa_comissao !== undefined;
                const taxaVisual = isCustom ? campo.taxa_comissao : (campo.perfis?.taxa_comissao || 12);
                
                return (
                  <tr key={campo.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ ...tdStyle, fontWeight: '900', color: '#0f172a' }}>
                      {campo.nome}
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginTop: '0.25rem' }}>📍 {campo.local}</div>
                    </td>
                    <td style={tdStyle}><span style={{ fontWeight: 'bold', color: '#334155' }}>{campo.perfis?.empresa_nome}</span></td>
                    <td style={tdStyle}>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#059669' }}>
                         {campo.turnos?.length || 0} Turnos
                      </span>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>
                         a partir de €{campo.preco || 0}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ backgroundColor: isCustom ? '#fef3c7' : '#f8fafc', color: isCustom ? '#b45309' : '#0f172a', padding: '0.35rem 0.6rem', borderRadius: '0.5rem', fontSize: '12px', fontWeight: 'bold', border: `1px solid ${isCustom ? '#fde68a' : '#e2e8f0'}` }}>
                        {taxaVisual}% {isCustom ? '⭐' : ''}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link href={`/${lang}/campo/${campo.id}`} target="_blank" style={btnActionStyle('#f8fafc', '#0f172a', '#e2e8f0')}>Ver</Link>
                        <Link href={`/${lang}/superadmin/campos/editar/${campo.id}`} style={btnActionStyle('#f8fafc', '#0f172a', '#e2e8f0')}>Editar</Link>
                        <button onClick={() => { setCampoEmEdicao(campo); setShowModal(true); }} style={btnActionStyle('#f8fafc', '#0f172a', '#e2e8f0')}>Comissão</button>
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

const modalOverlayStyle = { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '100%', maxWidth: '500px', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase' as const, marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '14px', color: '#0f172a', outline: 'none' };
const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' as const };
const btnSubmitStyle = { width: '100%', padding: '1.25rem', backgroundColor: '#0f172a', color: 'white', fontWeight: 'bold', borderRadius: '0.75rem', border: 'none', cursor: 'pointer' };
const thStyle = { padding: '1.25rem 1.5rem', fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em' };
const tdStyle = { padding: '1rem 1.5rem', color: '#334155', verticalAlign: 'middle' };
const btnActionStyle = (bg: string, color: string, border: string) => ({ padding: '0.4rem 0.8rem', backgroundColor: bg, color: color, borderRadius: '0.5rem', textDecoration: 'none' as const, fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', border: `1px solid ${border}`, display: 'inline-flex' });
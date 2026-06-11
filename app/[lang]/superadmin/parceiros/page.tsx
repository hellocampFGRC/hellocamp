"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function GestaoParceirosHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNovoModal, setShowNovoModal] = useState(false);
  const [novoParceiro, setNovoParceiro] = useState({ email: '', password: '', empresa_nome: '' });
  const [savingNovo, setSavingNovo] = useState(false);

  const [showComissaoModal, setShowComissaoModal] = useState(false);
  const [parceiroEmEdicao, setParceiroEmEdicao] = useState<any>(null);

  const [parceiroAuditoria, setParceiroAuditoria] = useState<any>(null);

  const fetchParceiros = async () => {
    const { data } = await supabase
      .from('perfis')
      .select('*')
      .eq('is_superadmin', false)
      .not('empresa_nome', 'is', null)
      .not('empresa_nome', 'eq', '')
      .order('created_at', { ascending: false });
      
    setParceiros(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchParceiros(); }, []);

  const handleCriarParceiro = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNovo(true);
    try {
      const res = await fetch('/api/admin/criar-parceiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoParceiro)
      });
      const data = await res.json();
      if (data.success) {
        alert(`Conta B2B criada com sucesso!\n\nEmail: ${novoParceiro.email}\nPassword temporária: ${novoParceiro.password}`);
        setShowNovoModal(false);
        setNovoParceiro({ email: '', password: '', empresa_nome: '' });
        fetchParceiros(); 
      } else alert("Erro no registo: " + data.error);
    } catch (err) {
      alert("Falha na comunicação com o servidor.");
    }
    setSavingNovo(false);
  };

  const handleSalvarComissao = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('perfis').update({
      taxa_comissao: parceiroEmEdicao.taxa_comissao,
      base_comissao: parceiroEmEdicao.base_comissao
    }).eq('id', parceiroEmEdicao.id);

    if (!error) {
      alert("Contrato atualizado com sucesso!");
      setShowComissaoModal(false);
      fetchParceiros();
    } else alert("Erro na Base de Dados: " + error.message);
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>A carregar parceiros...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', paddingBottom: '3rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>Gestão de Parceiros</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>Diretório corporativo e integração financeira.</p>
        </div>
        <button onClick={() => setShowNovoModal(true)} style={{ backgroundColor: '#0f172a', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
          Novo Parceiro
        </button>
      </div>

      {showNovoModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontWeight: '900' }}>Criar Acesso</h2>
              <button onClick={() => setShowNovoModal(false)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>×</button>
            </div>
            <form onSubmit={handleCriarParceiro} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelStyle}>Entidade</label><input type="text" required value={novoParceiro.empresa_nome} onChange={e => setNovoParceiro({...novoParceiro, empresa_nome: e.target.value})} style={inputStyle} /></div>
              <div><label style={labelStyle}>Email Oficial</label><input type="email" required value={novoParceiro.email} onChange={e => setNovoParceiro({...novoParceiro, email: e.target.value})} style={inputStyle} /></div>
              <div><label style={labelStyle}>Password Padrão</label><input type="text" required value={novoParceiro.password} onChange={e => setNovoParceiro({...novoParceiro, password: e.target.value})} style={inputStyle} /></div>
              <button type="submit" disabled={savingNovo} style={btnSubmitStyle}>{savingNovo ? 'A criar...' : 'Conceder Acesso'}</button>
            </form>
          </div>
        </div>
      )}

      {showComissaoModal && parceiroEmEdicao && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontWeight: '900', fontSize: '20px' }}>Contrato: {parceiroEmEdicao.empresa_nome}</h2>
              <button onClick={() => setShowComissaoModal(false)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSalvarComissao} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div><label style={labelStyle}>Taxa de Comissão (%)</label><input type="number" step="0.1" required value={parceiroEmEdicao.taxa_comissao} onChange={e => setParceiroEmEdicao({...parceiroEmEdicao, taxa_comissao: Number(e.target.value)})} style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Base de Incidência</label>
                <select value={parceiroEmEdicao.base_comissao} onChange={e => setParceiroEmEdicao({...parceiroEmEdicao, base_comissao: e.target.value})} style={selectStyle}>
                  <option value="total">Sobre Valor Total</option>
                  <option value="apenas_programa">Apenas sobre o Programa</option>
                  <option value="sem_comissao">Isenção (0%)</option>
                </select>
              </div>
              <button type="submit" style={btnSubmitStyle}>Atualizar</button>
            </form>
          </div>
        </div>
      )}

      {parceiroAuditoria && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '800px', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '1.5rem 2rem', backgroundColor: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900' }}>Detalhes do Parceiro: {parceiroAuditoria.empresa_nome}</h2>
              </div>
              <button onClick={() => setParceiroAuditoria(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ padding: '2rem', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
              {!parceiroAuditoria.stripe_account_id && (
                 <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                   <p style={{ margin: 0, color: '#b91c1c', fontWeight: 'bold', fontSize: '13px' }}>Aviso: Este parceiro ainda não ligou a conta Stripe. A plataforma não efetuará transferências automáticas.</p>
                 </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div style={modalCardStyle}>
                  <h3 style={modalTitleStyle}>Dados Fiscais</h3>
                  <DetailRow label="Empresa" value={parceiroAuditoria.empresa_nome} />
                  <DetailRow label="NIF" value={parceiroAuditoria.nif_empresa} />
                </div>
                <div style={modalCardStyle}>
                  <h3 style={modalTitleStyle}>Contactos</h3>
                  <DetailRow label="Responsável" value={parceiroAuditoria.nome_completo} />
                  <DetailRow label="Email" value={parceiroAuditoria.email} />
                  <DetailRow label="Telefone" value={parceiroAuditoria.telefone} />
                </div>
                <div style={{...modalCardStyle, gridColumn: '1 / -1'}}>
                  <h3 style={modalTitleStyle}>Financeiro</h3>
                  <DetailRow label="IBAN" value={parceiroAuditoria.iban || 'N/D'} />
                  <DetailRow label="Stripe ID" value={parceiroAuditoria.stripe_account_id || 'N/D'} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={thStyle}>ENTIDADE</th>
              <th style={thStyle}>STATUS STRIPE</th>
              <th style={thStyle}>COMISSÃO</th>
              <th style={thStyle}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {parceiros.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '15px' }}>{p.empresa_nome || 'A Aguardar Registo'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{p.email}</div>
                </td>
                <td style={tdStyle}>
                  {p.stripe_account_id ? <span style={{ color: '#059669', fontWeight: 'bold', fontSize: '12px' }}>Conectado</span> : <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '12px' }}>Pendente</span>}
                </td>
                <td style={tdStyle}>
                  <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '1.125rem' }}>{p.taxa_comissao || 12}%</div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setParceiroAuditoria(p)} style={btnActionStyle('#f8fafc', '#0f172a', '#e2e8f0')}>Ver Ficha</button>
                    <button onClick={() => { setParceiroEmEdicao(p); setShowComissaoModal(true); }} style={btnActionStyle('#f8fafc', '#0f172a', '#e2e8f0')}>Editar Comissão</button>
                  </div>
                </td>
              </tr>
            ))}
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
const thStyle = { padding: '1rem 1.5rem', fontSize: '11px', fontWeight: '800', color: '#475569', letterSpacing: '0.05em' };
const tdStyle = { padding: '1.25rem 1.5rem', color: '#334155', verticalAlign: 'middle' };
const btnActionStyle = (bg: string, color: string, border: string) => ({ padding: '0.4rem 0.8rem', backgroundColor: bg, color: color, borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', border: `1px solid ${border}`, display: 'inline-flex' });
const modalCardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' };
const modalTitleStyle = { margin: '0 0 1.25rem 0', fontSize: '1.125rem', fontWeight: '900', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' };

const DetailRow = ({ label, value }: { label: string, value: any }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>
    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{label}:</span>
    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '800', textAlign: 'right', marginLeft: '1rem', wordBreak: 'break-word' }}>{value || 'N/D'}</span>
  </div>
);
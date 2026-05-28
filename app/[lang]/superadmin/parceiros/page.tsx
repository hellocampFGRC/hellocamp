"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function GestaoParceirosHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Criação de Parceiro
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [novoParceiro, setNovoParceiro] = useState({ email: '', password: '', empresa_nome: '' });
  const [savingNovo, setSavingNovo] = useState(false);

  // Estados para Edição de Comissão
  const [showComissaoModal, setShowComissaoModal] = useState(false);
  const [parceiroEmEdicao, setParceiroEmEdicao] = useState<any>(null);

  const fetchParceiros = async () => {
    // Busca todos os perfis que não são superadmins (os clientes normais e organizadores)
    // Para filtrar melhor, pode exigir que tenham "empresa_nome" preenchido
    const { data } = await supabase.from('perfis').select('*').eq('is_superadmin', false).order('created_at', { ascending: false });
    setParceiros(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchParceiros(); }, []);

  // GERAR PARCEIRO VIA API SEGURA
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
        alert(`Conta criada! Email: ${novoParceiro.email} | Password: ${novoParceiro.password}`);
        setShowNovoModal(false);
        setNovoParceiro({ email: '', password: '', empresa_nome: '' });
        fetchParceiros(); // Atualiza a lista
      } else {
        alert("Erro: " + data.error);
      }
    } catch (err) {
      alert("Erro de ligação à API.");
    }
    setSavingNovo(false);
  };

  // ATUALIZAR COMISSÕES
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
    } else {
      alert("Erro: " + error.message);
    }
  };

  if (loading) return <div>A carregar Quartel General...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>Gestão de Parceiros</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>Crie acessos para organizadores e defina as comissões individuais.</p>
        </div>
        
        <button onClick={() => setShowNovoModal(true)} style={{ backgroundColor: '#fbbf24', color: '#0f172a', padding: '1rem 2rem', borderRadius: '0.75rem', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(251, 191, 36, 0.3)' }}>
          + Gerar Conta de Parceiro
        </button>
      </div>

      {/* MODAL: CRIAR NOVO PARCEIRO */}
      {showNovoModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontWeight: '900' }}>Gerar Conta de Acesso</h2>
              <button onClick={() => setShowNovoModal(false)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleCriarParceiro} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Nome da Entidade / Empresa</label>
                <input type="text" required value={novoParceiro.empresa_nome} onChange={e => setNovoParceiro({...novoParceiro, empresa_nome: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email (Login do Parceiro)</label>
                <input type="email" required value={novoParceiro.email} onChange={e => setNovoParceiro({...novoParceiro, email: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Password Temporária (Partilhar com o parceiro)</label>
                <input type="text" required value={novoParceiro.password} onChange={e => setNovoParceiro({...novoParceiro, password: e.target.value})} style={inputStyle} />
              </div>
              <button type="submit" disabled={savingNovo} style={btnSubmitStyle}>
                {savingNovo ? 'A criar...' : 'Criar e Conceder Acesso'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR COMISSÃO */}
      {showComissaoModal && parceiroEmEdicao && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontWeight: '900' }}>Contrato: {parceiroEmEdicao.empresa_nome}</h2>
              <button onClick={() => setShowComissaoModal(false)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleSalvarComissao} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Taxa de Comissão (%)</label>
                <input type="number" step="0.1" required value={parceiroEmEdicao.taxa_comissao} onChange={e => setParceiroEmEdicao({...parceiroEmEdicao, taxa_comissao: Number(e.target.value)})} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Base de Incidência</label>
                <select value={parceiroEmEdicao.base_comissao} onChange={e => setParceiroEmEdicao({...parceiroEmEdicao, base_comissao: e.target.value})} style={inputStyle}>
                  <option value="total">Sobre Valor Total (Programa + Extras)</option>
                  <option value="apenas_programa">Apenas sobre Programa (Extras isentos)</option>
                  <option value="apenas_alimentacao">Apenas sobre Alimentação</option>
                  <option value="sem_comissao">Isento de Comissão (0%)</option>
                </select>
              </div>
              <button type="submit" style={btnSubmitStyle}>Atualizar Contrato</button>
            </form>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={thStyle}>ENTIDADE</th>
              <th style={thStyle}>CONTACTOS</th>
              <th style={thStyle}>TAXA (%)</th>
              <th style={thStyle}>BASE DE INCIDÊNCIA</th>
              <th style={thStyle}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {parceiros.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ ...tdStyle, fontWeight: '900', color: '#0f172a' }}>{p.empresa_nome || 'Sem Nome'}</td>
                <td style={tdStyle}>{p.email}<br/><span style={{ fontSize: '12px', color: '#64748b' }}>NIF: {p.nif_empresa || 'N/D'}</span></td>
                <td style={{ ...tdStyle, color: '#059669', fontWeight: '900', fontSize: '1.25rem' }}>{p.taxa_comissao || 12}%</td>
                <td style={tdStyle}>
                  <span style={{ backgroundColor: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', fontSize: '12px', fontWeight: 'bold' }}>
                    {p.base_comissao || 'total'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button onClick={() => { setParceiroEmEdicao(p); setShowComissaoModal(true); }} style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                    ⚙️ Ajustar Comissão
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ESTILOS GERAIS
const modalOverlayStyle = { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '100%', maxWidth: '500px', borderRadius: '1.5rem', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase' as const, marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '14px', color: '#0f172a', outline: 'none' };
const btnSubmitStyle = { width: '100%', padding: '1.25rem', backgroundColor: '#0f172a', color: 'white', fontWeight: '900', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '1.125rem' };
const thStyle = { padding: '1.25rem 1.5rem', fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em' };
const tdStyle = { padding: '1.25rem 1.5rem', color: '#334155' };
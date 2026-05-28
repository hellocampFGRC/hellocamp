"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function FaturacaoPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  
  // Dados integrais carregados da base de dados
  const [camposParceiro, setCamposParceiro] = useState<any[]>([]);
  const [reservasFull, setReservasFull] = useState<any[]>([]);
  
  // Estado do Filtro Superior
  const [filtroCampoId, setFiltroCampoId] = useState<string>('todos');

  useEffect(() => {
    const carregarDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: perfilData } = await supabase.from('perfis').select('*').eq('id', session.user.id).single();
      setPerfil(perfilData || {});

      // Buscar a lista de campos que pertencem a este organizador para preencher o Dropdown
      const { data: camposData } = await supabase
        .from('campos')
        .select('id, nome, preco, taxa_comissao, base_comissao, contrato_parceiro_url')
        .eq('organizador_id', session.user.id);
      setCamposParceiro(camposData || []);

      // Buscar TODAS as reservas e cruzar os dados do campo (para as regras de comissão)
      const { data: reservasData } = await supabase
        .from('reservas')
        .select(`
          id, created_at, valor_total, status_pagamento, turno_nome, campo_id,
          campos ( nome, preco, taxa_comissao, base_comissao ),
          criancas ( nome )
        `)
        .eq('organizador_id', session.user.id)
        .order('created_at', { ascending: false });
      
      setReservasFull(reservasData || []);
      setLoading(false);
    };
    carregarDados();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session && perfil) {
      const { error } = await supabase.from('perfis').update({
        empresa_nome: perfil.empresa_nome,
        nif_empresa: perfil.nif_empresa,
        iban: perfil.iban,
        modelo_pagamento: perfil.modelo_pagamento
      }).eq('id', session.user.id);
      
      if (error) alert("Erro ao guardar: " + error.message);
      else alert(isEn ? "Billing details saved." : "Dados de faturação guardados com sucesso.");
    }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{isEn ? 'Loading financial data...' : 'A carregar dados financeiros e comissões...'}</div>;

  // --- FILTRAGEM DE RESERVAS PELO DROPDOWN ---
  const reservasAtivas = filtroCampoId === 'todos' 
    ? reservasFull 
    : reservasFull.filter(r => r.campo_id === filtroCampoId);

  // --- MATEMÁTICA FINANCEIRA EM TEMPO REAL ---
  const taxaComissaoGeral = perfil?.taxa_comissao || 12;
  const baseIncidenciaGeral = perfil?.base_comissao || 'total'; 
  const modeloPagamento = perfil?.modelo_pagamento || 'plataforma_recebe';

  let totalVolume = 0;
  let totalComissoesGeradas = 0;
  let saldoHelloCampDeveParceiro = 0;
  let saldoParceiroDeveHelloCamp = 0;

  const historicoCalculado = reservasAtivas.map(res => {
    const valorReserva = Number(res.valor_total) || 0;
    
    if (res.status_pagamento !== 'Reembolsado') {
      totalVolume += valorReserva;
    }

    // Regras Específicas do Campo (se existirem) vs. Regras do Contrato Geral
    const taxaLinha = (res.campos?.taxa_comissao !== null && res.campos?.taxa_comissao !== undefined)
      ? Number(res.campos.taxa_comissao)
      : Number(taxaComissaoGeral);

    const baseLinha = res.campos?.base_comissao || baseIncidenciaGeral;

    let valorIncidencia = valorReserva;
    if (baseLinha === 'apenas_programa') {
      const precoBase = Number(res.campos?.preco) || valorReserva;
      valorIncidencia = Math.min(valorReserva, precoBase);
    } else if (baseLinha === 'sem_comissao') {
      valorIncidencia = 0;
    }

    const valorComissao = res.status_pagamento === 'Reembolsado' ? 0 : valorIncidencia * (taxaLinha / 100);
    
    if (res.status_pagamento !== 'Reembolsado') {
      totalComissoesGeradas += valorComissao;

      if (modeloPagamento === 'plataforma_recebe') {
        saldoHelloCampDeveParceiro += (valorReserva - valorComissao);
      } else {
        saldoParceiroDeveHelloCamp += valorComissao;
      }
    }

    return { ...res, valorIncidencia, valorComissao, taxaAplicada: taxaLinha, baseAplicada: baseLinha };
  });

  // --- DADOS PARA O CARTÃO DE COMISSÃO DE ACORDO COM O FILTRO ---
  const campoFiltradoData = filtroCampoId !== 'todos' ? camposParceiro.find(c => c.id === filtroCampoId) : null;
  const taxaExibida = campoFiltradoData && campoFiltradoData.taxa_comissao !== null ? campoFiltradoData.taxa_comissao : taxaComissaoGeral;
  const baseExibida = campoFiltradoData && campoFiltradoData.base_comissao ? campoFiltradoData.base_comissao : baseIncidenciaGeral;
  const contratoExibido = campoFiltradoData?.contrato_parceiro_url || null;

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
            {isEn ? 'Billing & Payments' : 'Faturação e Pagamentos'}
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>
            {isEn ? 'Manage financial details and track commissions.' : 'Gira as transações, comissões e saldos em tempo real.'}
          </p>
        </div>

        {/* FILTRO GLOBAL DE CAMPOS */}
        <div style={{ minWidth: '280px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {isEn ? 'Filter by Camp' : 'Filtrar Finanças por Campo'}
          </label>
          <select 
            value={filtroCampoId} 
            onChange={(e) => setFiltroCampoId(e.target.value)} 
            style={{ ...selectStyle, borderColor: '#059669', backgroundColor: '#f0fdf4', color: '#064e3b', fontWeight: '800' }}
          >
            <option value="todos">{isEn ? 'All Active Camps (Global)' : 'Visão Global (Todos os Campos)'}</option>
            {camposParceiro.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. DASHBOARD DE RESUMO FINANCEIRO DINÂMICO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{isEn ? 'Net Volume' : 'Volume Total Transacionado'}</p>
          <p style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>{totalVolume.toFixed(2)}€</p>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{isEn ? 'Commissions' : 'Comissões HelloCamp'}</p>
          <p style={{ fontSize: '2rem', fontWeight: '900', color: '#ef4444', margin: 0 }}>{totalComissoesGeradas.toFixed(2)}€</p>
        </div>

        <div style={{ backgroundColor: modeloPagamento === 'plataforma_recebe' ? '#ecfdf5' : '#fef2f2', padding: '1.5rem', borderRadius: '1rem', border: `1px solid ${modeloPagamento === 'plataforma_recebe' ? '#10b981' : '#ef4444'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: modeloPagamento === 'plataforma_recebe' ? '#065f46' : '#991b1b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {modeloPagamento === 'plataforma_recebe' ? (isEn ? 'Balance to Receive (from HelloCamp)' : 'Saldo a Receber (da HelloCamp)') : (isEn ? 'Balance to Pay (to HelloCamp)' : 'Saldo a Pagar (à HelloCamp)')}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: '900', color: modeloPagamento === 'plataforma_recebe' ? '#059669' : '#dc2626', margin: 0 }}>
            {modeloPagamento === 'plataforma_recebe' ? saldoHelloCampDeveParceiro.toFixed(2) : saldoParceiroDeveHelloCamp.toFixed(2)}€
          </p>
          <p style={{ fontSize: '11px', color: modeloPagamento === 'plataforma_recebe' ? '#047857' : '#b91c1c', marginTop: '0.5rem', fontWeight: 'bold' }}>
            * Referente ao filtro acima selecionado
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', marginBottom: '2.5rem', alignItems: 'start' }}>
        
        {/* 2. DADOS BANCÁRIOS E FISCAIS */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>{isEn ? 'Company Details' : 'Dados da Empresa / Pagamento'}</h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>{isEn ? 'Company Name' : 'Nome da Empresa / Entidade'}</label>
              <input type="text" value={perfil.empresa_nome || ''} onChange={e => setPerfil({...perfil, empresa_nome: e.target.value})} style={inputStyle} required />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>NIF</label>
                <input type="text" value={perfil.nif_empresa || ''} onChange={e => setPerfil({...perfil, nif_empresa: e.target.value})} style={inputStyle} required />
              </div>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>IBAN (Transferências)</label>
                <input type="text" value={perfil.iban || ''} onChange={e => setPerfil({...perfil, iban: e.target.value})} style={inputStyle} required />
              </div>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <label style={labelStyle}>{isEn ? 'Payment Flow' : 'Modelo de Pagamento Preferencial'}</label>
              <select value={perfil.modelo_pagamento || 'plataforma_recebe'} onChange={e => setPerfil({...perfil, modelo_pagamento: e.target.value})} style={selectStyle}>
                <option value="plataforma_recebe">{isEn ? 'HelloCamp receives from client and transfers to me' : 'HelloCamp recebe do cliente e transfere-me'}</option>
                <option value="parceiro_recebe">{isEn ? 'I receive directly and pay commission to HelloCamp' : 'Recebo diretamente do cliente e pago comissão à HelloCamp'}</option>
              </select>
            </div>
            <button type="submit" disabled={saving} style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#0f172a', color: 'white', fontWeight: '900', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              {saving ? 'A guardar...' : (isEn ? 'Save Details' : 'Gravar Dados')}
            </button>
          </form>
        </div>

        {/* 3. ACORDO BASE DE COMISSÕES (DINÂMICO) */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>
            {filtroCampoId === 'todos' ? (isEn ? 'Your Global Agreement' : 'Acordo de Comissionamento Geral') : (isEn ? 'Camp Agreement' : 'Contrato Deste Campo')}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', textAlign: 'center', minWidth: '120px' }}>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {filtroCampoId === 'todos' ? 'Taxa Base' : 'Taxa do Campo'}
                </p>
                <span style={{ fontSize: '2rem', fontWeight: '900', color: '#059669' }}>{taxaExibida}%</span>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Base de Incidência</p>
                <p style={{ fontSize: '14px', color: '#0f172a', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                  {baseExibida === 'apenas_programa' 
                    ? (isEn ? 'Base program only (Extras excluded)' : 'Apenas sobre o Programa Base')
                    : (isEn ? 'Total value (Program + Extras)' : 'Sobre Valor Total da Reserva')}
                </p>
              </div>
            </div>

            {/* DOWNLOAD DO CONTRATO (SÓ APARECE SE HOUVER UM CAMPO ESPECÍFICO COM CONTRATO) */}
            {filtroCampoId !== 'todos' && contratoExibido && (
              <a 
                href={contratoExibido} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ padding: '1rem', backgroundColor: '#fffbeb', color: '#b45309', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', border: '1px solid #fde68a', textAlign: 'center', display: 'block' }}
              >
                📥 Descarregar Contrato Validado Pela HelloCamp
              </a>
            )}
            
            {/* CORREÇÃO DO ERRO VISUAL: Caixa amarela agora fica perfeitamente contida */}
            <div style={{ backgroundColor: '#fefce8', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fef08a', marginTop: 'auto' }}>
              <p style={{ fontSize: '12px', color: '#854d0e', margin: 0, fontWeight: 'bold', lineHeight: 1.4 }}>
                💡 {isEn ? 'To change your commission rate or base, please contact your account manager.' : 'Para renegociar a sua taxa base ou alterar os termos do seu contrato, por favor contacte a Direção da HelloCamp.'}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 4. TABELA DE HISTÓRICO DE TRANSAÇÕES */}
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={cardTitleStyle}>{isEn ? 'Transaction History' : 'Histórico de Transações e Comissões'}</h2>
        
        {historicoCalculado.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
            {isEn ? 'No financial history available yet.' : 'Ainda não existem transações para a seleção efetuada.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '1rem', fontWeight: 'bold' }}>{isEn ? 'Date' : 'Data'}</th>
                  <th style={{ padding: '1rem', fontWeight: 'bold' }}>{isEn ? 'Camp / Child' : 'Campo / Criança'}</th>
                  <th style={{ padding: '1rem', fontWeight: 'bold' }}>{isEn ? 'Gross Value' : 'Valor Total'}</th>
                  <th style={{ padding: '1rem', fontWeight: 'bold', color: '#ef4444' }}>{isEn ? 'Commission' : 'Comissão'}</th>
                  <th style={{ padding: '1rem', fontWeight: 'bold' }}>{isEn ? 'Status' : 'Pagamento Cliente'}</th>
                </tr>
              </thead>
              <tbody>
                {historicoCalculado.map((res) => (
                  <tr key={res.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: res.status_pagamento === 'Reembolsado' ? '#fecaca10' : 'transparent' }}>
                    <td style={{ padding: '1rem', color: '#475569' }}>{new Date(res.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{res.campos?.nome}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{res.criancas?.nome} ({res.turno_nome})</div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{res.valor_total}€</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: res.status_pagamento === 'Reembolsado' ? '#94a3b8' : '#ef4444' }}>
                      {res.status_pagamento === 'Reembolsado' ? '0.00€' : `${res.valorComissao.toFixed(2)}€`}
                      <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: 'normal' }}>({res.taxaAplicada}%)</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: res.status_pagamento === 'Pago' ? '#ecfdf5' : (res.status_pagamento === 'Reembolsado' ? '#fef2f2' : '#fef3c7'),
                        color: res.status_pagamento === 'Pago' ? '#059669' : (res.status_pagamento === 'Reembolsado' ? '#ef4444' : '#b45309')
                      }}>
                        {res.status_pagamento || 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </main>
  );
}

// Estilos Reutilizáveis
const cardStyle = { display: 'flex', flexDirection: 'column' as const, backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const cardTitleStyle = { fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const inputBase = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '14px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s' };
const inputStyle = { ...inputBase };
const selectStyle = { ...inputBase, cursor: 'pointer', appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' };
"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function FaturacaoGlobalHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);

  const [loading, setLoading] = useState(true);
  const [reservas, setReservas] = useState<any[]>([]);
  const [loadingRefundId, setLoadingRefundId] = useState<string | null>(null);
  
  const [reservaSelecionada, setReservaSelecionada] = useState<any>(null);

  const fetchDadosFinanceiros = async () => {
    // Busca plana e separada para garantir que NUNCA falha (ignora erros de chaves estrangeiras)
    const { data: reservasData } = await supabase.from('reservas').select('*').order('created_at', { ascending: false });
    const { data: camposData } = await supabase.from('campos').select('id, nome, preco, taxa_comissao, base_comissao, local');
    const { data: perfisData } = await supabase.from('perfis').select('id, nome_completo, email, telefone, nif, empresa_nome, taxa_comissao, base_comissao');
    const { data: criancasData } = await supabase.from('criancas').select('id, nome, data_nascimento, sexo, restricoes_alimentares, doencas_cronicas, medicacao_regular');

    if (reservasData) {
      const reservasCruzadas = reservasData.map(res => {
        const campo = camposData?.find(c => c.id === res.campo_id) || {};
        const organizador = perfisData?.find(p => p.id === res.organizador_id) || {};
        const pai = perfisData?.find(p => p.id === res.cliente_id) || {};
        const crianca = criancasData?.find(c => c.id === res.crianca_id) || {};

        return {
          ...res,
          campos: campo,
          crianca: crianca,
          pai: pai,
          organizador: organizador
        };
      });
      setReservas(reservasCruzadas);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDadosFinanceiros();
  }, []);

  const handleProcessarReembolsoStripe = async (reservaId: string, valor: number) => {
    if (!window.confirm(`ATENÇÃO! Esta ação é irreversível.\nO valor de ${valor.toFixed(2)}€ sairá da conta Stripe e será devolvido ao cliente.\n\nPretende confirmar o reembolso?`)) return;

    setLoadingRefundId(reservaId);

    try {
      const res = await fetch('/api/processar-reembolso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservaId })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      alert("Reembolso concluído com sucesso.");
      
      setReservas(prev => prev.map(r => 
        r.id === reservaId ? { ...r, status_pagamento: 'Reembolsado', status_reembolso: 'Processado', status: 'Reembolsado' } : r
      ));
      setReservaSelecionada(null);
    } catch (err: any) {
      alert("Falha no reembolso: " + err.message);
    } finally {
      setLoadingRefundId(null);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>A carregar relatórios e tesouraria...</div>;

  let volumeTotal = 0;
  let comissoesTotais = 0;
  let totalReembolsado = 0;

  const historicoProcessado = reservas.map(res => {
    const valor = Number(res.valor_total) || 0;
    
    const taxa = (res.campos?.taxa_comissao !== null && res.campos?.taxa_comissao !== undefined) 
      ? Number(res.campos.taxa_comissao) 
      : Number(res.organizador?.taxa_comissao || 12);
      
    const base = res.campos?.base_comissao || res.organizador?.base_comissao || 'total';

    let valorIncidencia = valor;
    if (base === 'apenas_programa') {
      const precoBase = Number(res.campos?.preco) || valor;
      valorIncidencia = Math.min(valor, precoBase);
    } else if (base === 'sem_comissao') {
      valorIncidencia = 0;
    }

    const comissaoCalculada = valorIncidencia * (taxa / 100);

    if (res.status_pagamento === 'Reembolsado') {
      totalReembolsado += valor;
    } else {
      volumeTotal += valor;
      comissoesTotais += comissaoCalculada;
    }

    return { ...res, comissaoCalculada, taxaAplicada: taxa };
  });

  return (
    <div style={{ fontFamily: 'sans-serif', paddingBottom: '3rem', position: 'relative' }}>
      
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>Faturação Global</h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Monitorização de transações e gestão de reembolsos.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={cardStyle}>
          <span style={labelStyle}>Volume Bruto Processado</span>
          <span style={{ fontSize: '2.25rem', fontWeight: '900', color: '#059669' }}>{volumeTotal.toFixed(2)}€</span>
        </div>
        <div style={cardStyle}>
          <span style={labelStyle}>Comissões Previstas</span>
          <span style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a' }}>{comissoesTotais.toFixed(2)}€</span>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #ef4444', backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
          <span style={{...labelStyle, color: '#b91c1c'}}>Dinheiro Reembolsado</span>
          <span style={{ fontSize: '2.25rem', fontWeight: '900', color: '#ef4444' }}>{totalReembolsado.toFixed(2)}€</span>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>Registo de Transações</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#fdfdfd', borderBottom: '2px solid #e2e8f0' }}>
                <th style={thStyle}>ID / REFERÊNCIA</th>
                <th style={thStyle}>PARCEIRO / PROGRAMA</th>
                <th style={thStyle}>CLIENTE</th>
                <th style={thStyle}>VALOR (COMISSÃO)</th>
                <th style={thStyle}>ESTADO</th>
                <th style={thStyle}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {historicoProcessado.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Sem transações registadas.</td></tr>
              ) : (
                historicoProcessado.map((res: any) => {
                  const eReembolsado = res.status_pagamento === 'Reembolsado';
                  const nomePaiVisivel = res.nome_encarregado || res.pai?.nome_completo || 'N/D';
                  
                  return (
                    <tr key={res.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: eReembolsado ? 0.6 : 1 }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '12px', fontFamily: 'monospace' }}>{res.id.split('-')[0]}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>{res.metodo_pagamento || 'N/A'}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a', textDecoration: eReembolsado ? 'line-through' : 'none' }}>{res.organizador?.empresa_nome || 'Desconhecido'}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{res.campos?.nome || 'N/D'}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 'bold', color: '#334155' }}>{nomePaiVisivel}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{res.crianca?.nome || 'N/D'}</div>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>
                        {res.valor_total}€
                        <div style={{ fontSize: '11px', color: eReembolsado ? '#94a3b8' : '#dc2626', fontWeight: 'bold' }}>
                          Comissão: {eReembolsado ? '0.00€' : `${res.comissaoCalculada.toFixed(2)}€`}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase',
                          backgroundColor: eReembolsado ? '#fef2f2' : (res.status_pagamento === 'Pago' || res.status_pagamento === 'Sinal Pago' ? '#ecfdf5' : '#f1f5f9'),
                          color: eReembolsado ? '#ef4444' : (res.status_pagamento === 'Pago' || res.status_pagamento === 'Sinal Pago' ? '#059669' : '#64748b')
                        }}>
                          {res.status_pagamento || 'Pendente'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => setReservaSelecionada(res)}
                          style={{ backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reservaSelecionada && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '850px', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            <div style={{ padding: '1.5rem 2rem', backgroundColor: reservaSelecionada.status_pagamento === 'Reembolsado' ? '#ef4444' : '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900' }}>Detalhes da Reserva {reservaSelecionada.status_pagamento === 'Reembolsado' && '(Cancelada)'}</h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#cbd5e1', fontSize: '12px', fontFamily: 'monospace' }}>Ref: {reservaSelecionada.id}</p>
              </div>
              <button onClick={() => setReservaSelecionada(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <div style={{ padding: '2rem', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                
                <div style={modalCardStyle}>
                  <h3 style={modalTitleStyle}>Entidade & Programa</h3>
                  <DetailRow label="Organizador" value={reservaSelecionada.organizador?.empresa_nome} />
                  <DetailRow label="Campo de Férias" value={reservaSelecionada.campos?.nome} />
                  <DetailRow label="Semana / Turno" value={reservaSelecionada.turno_nome} />
                  
                  <h3 style={{...modalTitleStyle, marginTop: '2rem'}}>Dados Financeiros</h3>
                  <DetailRow label="Valor Total" value={`${reservaSelecionada.valor_total}€`} />
                  <DetailRow label="Comissão" value={`${reservaSelecionada.comissaoCalculada.toFixed(2)}€ (${reservaSelecionada.taxaAplicada}%)`} />
                  
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0' }}>
                    <DetailRow label="Estado" value={reservaSelecionada.status_pagamento} />
                    <DetailRow label="Valor Pago" value={`${reservaSelecionada.valor_pago || 0}€`} />
                    <DetailRow label="Valor em Falta" value={`${reservaSelecionada.valor_em_falta || 0}€`} />
                    <DetailRow label="Método" value={reservaSelecionada.metodo_pagamento || 'N/D'} />
                  </div>
                </div>

                <div style={modalCardStyle}>
                  <h3 style={modalTitleStyle}>Cliente & Participante</h3>
                  <DetailRow label="Encarregado Educação" value={reservaSelecionada.nome_encarregado || reservaSelecionada.pai?.nome_completo} />
                  <DetailRow label="Telefone" value={reservaSelecionada.telefone_encarregado || reservaSelecionada.pai?.telefone} />
                  <DetailRow label="Email" value={reservaSelecionada.email_encarregado || reservaSelecionada.pai?.email} />
                  
                  <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <span style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: '#0f172a', marginBottom: '0.5rem' }}>Participante: {reservaSelecionada.crianca?.nome || 'N/D'}</span>
                    <DetailRow label="Alergias" value={reservaSelecionada.crianca?.restricoes_alimentares || 'Nenhuma'} />
                    <DetailRow label="Doenças Crónicas" value={reservaSelecionada.crianca?.doencas_cronicas || 'Nenhuma'} />
                  </div>
                </div>

              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '2px solid #e2e8f0' }}>
                {reservaSelecionada.status_pagamento !== 'Reembolsado' && reservaSelecionada.status_pagamento !== 'Pendente' && (
                  <button
                    onClick={() => handleProcessarReembolsoStripe(reservaSelecionada.id, Number(reservaSelecionada.valor_total))}
                    disabled={loadingRefundId === reservaSelecionada.id}
                    style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.875rem 1.5rem', borderRadius: '0.5rem', fontSize: '14px', fontWeight: 'bold', cursor: loadingRefundId === reservaSelecionada.id ? 'not-allowed' : 'pointer' }}
                  >
                    {loadingRefundId === reservaSelecionada.id ? 'A processar...' : `Reembolsar Cliente (${reservaSelecionada.valor_total}€)`}
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const cardStyle = { backgroundColor: 'white', padding: '1.75rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' as const, gap: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' };
const labelStyle = { fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const thStyle = { padding: '1rem 1.5rem', fontSize: '11px', fontWeight: '800', color: '#475569', letterSpacing: '0.05em' };
const tdStyle = { padding: '1.25rem 1.5rem', color: '#334155', verticalAlign: 'middle' };
const modalCardStyle = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' };
const modalTitleStyle = { margin: '0 0 1.25rem 0', fontSize: '1.125rem', fontWeight: '900', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' };

const DetailRow = ({ label, value }: { label: string, value: any }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>
    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{label}:</span>
    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '800', textAlign: 'right', marginLeft: '1rem', wordBreak: 'break-word' }}>{value || 'N/D'}</span>
  </div>
);
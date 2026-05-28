"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function FaturacaoGlobalHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [reservas, setReservas] = useState<any[]>([]);

  const fetchDadosFinanceiros = async () => {
    // Busca segura em 2 passos para cruzar Perfis, Campos e Reservas sem erros
    const { data: reservasData } = await supabase.from('reservas').select('*').order('created_at', { ascending: false });
    const { data: camposData } = await supabase.from('campos').select('id, nome, preco, taxa_comissao, base_comissao');
    const { data: perfisData } = await supabase.from('perfis').select('id, empresa_nome, iban, taxa_comissao, base_comissao');

    if (reservasData) {
      const reservasCruzadas = reservasData.map(res => {
        const campo = camposData?.find(c => c.id === res.campo_id) || { nome: 'N/D', preco: 0 };
        const organizador = perfisData?.find(p => p.id === res.organizador_id) || { empresa_nome: 'N/D', taxa_comissao: 12, base_comissao: 'total' };
        
        return {
          ...res,
          campos: campo,
          perfis: organizador
        };
      });
      setReservas(reservasCruzadas);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDadosFinanceiros();
  }, []);

  const handleProcessarReembolso = async (reservaId: string, metodo: string, valor: number) => {
    if (!window.confirm(`Confirma o estorno de ${valor}€ via [${metodo}]?`)) return;

    setReservas(prev => prev.map(r => 
      r.id === reservaId ? { ...r, status_pagamento: 'Reembolsado', status_reembolso: 'Reembolsado' } : r
    ));

    await supabase.from('reservas').update({
      status_pagamento: 'Reembolsado',
      status_reembolso: 'Reembolsado',
      dados_reembolso: { data_estorno: new Date().toISOString(), processado_por: 'SuperAdmin HQ' }
    }).eq('id', reservaId);
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>A carregar contabilidade centralizada...</div>;

  let volumeTotal = 0;
  let comissoesTotais = 0;
  let totalReembolsado = 0;

  const historicoProcessado = reservas.map(res => {
    const valor = Number(res.valor_total) || 0;
    
    // HIERARQUIA DE COMISSÃO: 1º Verifica Campo, 2º Verifica Parceiro
    const taxa = (res.campos?.taxa_comissao !== null && res.campos?.taxa_comissao !== undefined) 
      ? Number(res.campos.taxa_comissao) 
      : Number(res.perfis?.taxa_comissao || 12);
      
    const base = res.campos?.base_comissao || res.perfis?.base_comissao || 'total';

    let valorIncidencia = valor;
    if (base === 'apenas_programa') {
      const precoBase = Number(res.campos?.preco) || valor;
      valorIncidencia = Math.min(valor, precoBase);
    } else if (base === 'sem_comissao') {
      valorIncidencia = 0;
    }

    const comissaoCalculada = valorIncidencia * (taxa / 100);

    // Soma TODAS as reservas ativas (Pagas ou Pendentes) ao volume financeiro gerado
    if (res.status_pagamento === 'Reembolsado') {
      totalReembolsado += valor;
    } else {
      volumeTotal += valor;
      comissoesTotais += comissaoCalculada;
    }

    return { ...res, comissaoCalculada, taxaAplicada: taxa };
  });

  return (
    <div style={{ fontFamily: 'sans-serif', paddingBottom: '3rem' }}>
      
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>Faturação & Fluxo Global</h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Painel macro de monitorização de capitais e comissões.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={cardStyle}>
          <span style={labelStyle}>Volume Bruto Total (Ativo)</span>
          <span style={{ fontSize: '2.25rem', fontWeight: '900', color: '#059669' }}>{volumeTotal.toFixed(2)}€</span>
        </div>
        <div style={cardStyle}>
          <span style={labelStyle}>Comissões HelloCamp Acumuladas</span>
          <span style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a' }}>{comissoesTotais.toFixed(2)}€</span>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #ef4444' }}>
          <span style={labelStyle}>Total Reembolsado</span>
          <span style={{ fontSize: '2.25rem', fontWeight: '900', color: '#ef4444' }}>{totalReembolsado.toFixed(2)}€</span>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>Histórico Logístico de Transações</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#fdfdfd', borderBottom: '2px solid #e2e8f0' }}>
                <th style={thStyle}>PROGRAMA / PARCEIRO</th>
                <th style={thStyle}>VALOR TOTAL</th>
                <th style={thStyle}>COMISSÃO HELLOCAMP</th>
                <th style={thStyle}>MÉTODO</th>
                <th style={thStyle}>ESTADO</th>
                <th style={thStyle}>AÇÕES BANCÁRIAS</th>
              </tr>
            </thead>
            <tbody>
              {historicoProcessado.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Sem transações.</td></tr>
              ) : (
                historicoProcessado.map((res: any) => {
                  const eReembolsado = res.status_pagamento === 'Reembolsado';

                  return (
                    <tr key={res.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{res.campos?.nome}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{res.perfis?.empresa_nome}</div>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 'bold' }}>{res.valor_total}€</td>
                      <td style={{ ...tdStyle, color: '#dc2626', fontWeight: '700' }}>
                        {res.comissaoCalculada.toFixed(2)}€ ({res.taxaAplicada}%)
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>💳 {res.metodo_pagamento || 'MB WAY'}</div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase',
                          backgroundColor: eReembolsado ? '#fef2f2' : (res.status_pagamento === 'Pago' ? '#ecfdf5' : '#fff7ed'),
                          color: eReembolsado ? '#ef4444' : (res.status_pagamento === 'Pago' ? '#059669' : '#c2410c')
                        }}>
                          {res.status_pagamento || 'Pendente'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {!eReembolsado ? (
                          <button
                            onClick={() => handleProcessarReembolso(res.id, res.metodo_pagamento || 'MB WAY', res.valor_total)}
                            style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            ↩️ Reembolsar
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Reembolsado</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const cardStyle = { backgroundColor: 'white', padding: '1.75rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' as const, gap: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' };
const labelStyle = { fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const thStyle = { padding: '1rem 1.5rem', fontSize: '11px', fontWeight: '800', color: '#475569', letterSpacing: '0.05em' };
const tdStyle = { padding: '1.25rem 1.5rem', color: '#334155', verticalAlign: 'middle' };
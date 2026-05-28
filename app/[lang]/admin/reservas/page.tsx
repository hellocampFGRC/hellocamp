"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function ReservasParceiroAdvanced({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [campoGrupos, setCampoGrupos] = useState<any[]>([]);
  const [filtroCampoId, setFiltroCampoId] = useState<string>('todos');

  useEffect(() => {
    const fetchDadosInscritos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: camposData } = await supabase
        .from('campos')
        .select(`
          id,
          nome,
          nome_en,
          vagas_totais,
          turnos,
          reservas (
            id,
            turno_nome,
            valor_total,
            created_at,
            extras_escolhidos,
            status_pagamento,
            criancas (
              nome, nif, data_nascimento, sexo, restricoes_alimentares
            )
          )
        `)
        .eq('organizador_id', session.user.id);

      if (camposData) {
        const listaGrupos = camposData.map((c: any) => {
          const dataOrdenacao = c.turnos && c.turnos[0]?.data_inicio ? c.turnos[0].data_inicio : '9999-12-31';
          
          const inscritos = (c.reservas || []).map((reserva: any) => ({
            reservaId: reserva.id,
            turno: reserva.turno_nome,
            valor: reserva.valor_total,
            dataReserva: reserva.created_at,
            statusPagamento: reserva.status_pagamento || 'Pendente',
            extras: reserva.extras_escolhidos,
            crianca: reserva.criancas
          }));

          // Se existirem turnos definidos, calculamos a capacidade real somando as vagas de cada turno
          const realVagasTotais = c.turnos && c.turnos.length > 0
            ? c.turnos.reduce((acc: number, curr: any) => acc + (Number(curr.vagas) || 0), 0)
            : (Number(c.vagas_totais) || 0);

          return {
            id: c.id,
            nome: isEn && c.nome_en ? c.nome_en : c.nome,
            vagas_totais: realVagasTotais,
            dataInicioCronologica: dataOrdenacao,
            inscritos: inscritos
          };
        });

        const arrayOrdenado = listaGrupos.sort((a: any, b: any) => {
          return new Date(a.dataInicioCronologica).getTime() - new Date(b.dataInicioCronologica).getTime();
        });

        setCampoGrupos(arrayOrdenado);
      }
      setLoading(false);
    };

    fetchDadosInscritos();
  }, [isEn]);

  const obterIdade = (dataNasc: string) => {
    if (!dataNasc) return 0;
    const diff = Date.now() - new Date(dataNasc).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  const temAlertaMedico = (texto: string) => {
    if (!texto) return false;
    const textoLimpo = texto.toLowerCase().trim();
    const palavrasIgnoradas = ["nenhuma", "nenhum", "nao", "não", "nada", "n/a", "no", "none", "-", "sem alergias", "saudavel", "saudável"];
    return !palavrasIgnoradas.includes(textoLimpo);
  };

  const toggleStatusPagamento = async (reservaId: string, statusAtual: string) => {
    const novoStatus = statusAtual === 'Pago' ? 'Pendente' : 'Pago';
    
    setCampoGrupos(prev => prev.map(g => ({
      ...g,
      inscritos: g.inscritos.map((i: any) => 
        i.reservaId === reservaId ? { ...i, statusPagamento: novoStatus } : i
      )
    })));

    await supabase.from('reservas').update({ status_pagamento: novoStatus }).eq('id', reservaId);
  };

  // COMPILAÇÃO DA REALIDADE SELECIONADA (VISÃO GLOBAL OU FILTRADA)
  let campoNomeFicheiro = "geral";
  let vagasTotaisExibidas = 0;
  let inscritosRows: any[] = [];

  if (filtroCampoId === 'todos') {
    campoGrupos.forEach(g => {
      vagasTotaisExibidas += g.vagas_totais;
      inscritosRows = [...inscritosRows, ...g.inscritos.map((i: any) => ({ ...i, campNome: g.nome }))];
    });
  } else {
    const grupoSelecao = campoGrupos.find(g => g.id === filtroCampoId);
    if (grupoSelecao) {
      vagasTotaisExibidas = grupoSelecao.vagas_totais;
      campoNomeFicheiro = grupoSelecao.nome.toLowerCase().replace(/\s+/g, '_');
      inscritosRows = grupoSelecao.inscritos.map((i: any) => ({ ...i, campNome: grupoSelecao.nome }));
    }
  }

  const inscritosCount = inscritosRows.length;
  const disponiveisCount = Math.max(0, vagasTotaisExibidas - inscritosCount);

  // INDICADORES DEMOGRÁFICOS DO CONTEXTO ATIVO
  let masc = 0, fem = 0, comAlergia = 0, somaIdades = 0;
  inscritosRows.forEach((item: any) => {
    if (item.crianca?.sexo === 'Masculino') masc++;
    if (item.crianca?.sexo === 'Feminino') fem++;
    if (temAlertaMedico(item.crianca?.restricoes_alimentares)) comAlergia++;
    if (item.crianca?.data_nascimento) somaIdades += obterIdade(item.crianca.data_nascimento);
  });

  const pctMasc = inscritosCount > 0 ? Math.round((masc / inscritosCount) * 100) : 0;
  const pctFem = inscritosCount > 0 ? Math.round((fem / inscritosCount) * 100) : 0;
  const pctAlergias = inscritosCount > 0 ? Math.round((comAlergia / inscritosCount) * 100) : 0;
  const mediaIdades = inscritosCount > 0 ? (somaIdades / inscritosCount).toFixed(1) : 0;

  const exportarParaExcel = () => {
    if (inscritosRows.length === 0) {
      alert("Não existem inscrições no contexto selecionado para efetuar a exportação.");
      return;
    }

    let conteudoCsv = "Campo;Turno;Nome Criança;Idade;Sexo;NIF;Alergias/Restrições;Valor;Estado Pagamento;Data/Hora Inscrição\n";
    inscritosRows.forEach((item: any) => {
      const cAlergias = temAlertaMedico(item.crianca?.restricoes_alimentares) ? item.crianca.restricoes_alimentares.replace(/;/g, ",") : "Nenhuma";
      const cData = new Date(item.dataReserva).toLocaleString('pt-PT');
      conteudoCsv += `${item.campNome};${item.turno};${item.crianca?.nome || ""};${item.crianca?.data_nascimento ? obterIdade(item.crianca.data_nascimento) : ""};${item.crianca?.sexo || ""};${item.crianca?.nif || ""};${cAlergias};${item.valor}€;${item.statusPagamento};${cData}\n`;
    });

    const blob = new Blob(["\ufeff" + conteudoCsv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `inscritos_${campoNomeFicheiro}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>A carregar painel avançado...</div>;

  return (
    <div style={{ fontFamily: 'sans-serif', paddingBottom: '3rem' }}>
      
      {/* SEÇÃO SUPERIOR FILTRADA COM DESIGN COERENTE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
            {isEn ? 'Executive Dashboard' : 'Gestão Avançada de Inscrições'}
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.25rem' }}>
            {isEn ? 'Real-time metrics, demography, and logistics data.' : 'Métricas em tempo real, demografia e controlo logístico de vagas.'}
          </p>
        </div>

        {/* REPLICA DO FILTRO PREMIUM DA FATURAÇÃO */}
        <div style={{ minWidth: '300px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
            {isEn ? 'Select Program Context' : 'Selecionar Campo de Férias'}
          </label>
          <select 
            value={filtroCampoId} 
            onChange={(e) => setFiltroCampoId(e.target.value)} 
            style={selectDropdownStyle}
          >
            <option value="todos">{isEn ? 'All Active Camps (Global)' : 'Visão Global (Todos os Campos)'}</option>
            {campoGrupos.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {campoGrupos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', border: '2px dashed #cbd5e1', borderRadius: '1.5rem', backgroundColor: 'white', color: '#64748b' }}>
          {isEn ? 'You have no active camps.' : 'Ainda não tem nenhum programa de férias registado.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* INDICADORES FINACEIROS E LOGÍSTICOS ADAPTIVOS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div style={statCardStyle}>
              <span style={statLabelStyle}>{isEn ? 'TOTAL CAPACITY' : 'VAGAS TOTAIS CONTEXTO'}</span>
              <span style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a' }}>{vagasTotaisExibidas}</span>
            </div>
            <div style={{ ...statCardStyle, borderLeft: '4px solid #059669' }}>
              <span style={statLabelStyle}>{isEn ? 'TOTAL ENROLLED' : 'TOTAL INSCRITOS'}</span>
              <span style={{ fontSize: '2rem', fontWeight: '900', color: '#059669' }}>{inscritosCount}</span>
            </div>
            <div style={{ ...statCardStyle, borderLeft: '4px solid #de5d25' }}>
              <span style={statLabelStyle}>{isEn ? 'VACANT SPOTS' : 'VAGAS LIVRES RESTRITAS'}</span>
              <span style={{ fontSize: '2rem', fontWeight: '900', color: '#de5d25' }}>{disponiveisCount}</span>
            </div>
            <div style={{ ...statCardStyle, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' }}>
              <button 
                onClick={exportarParaExcel}
                disabled={inscritosCount === 0}
                style={{ backgroundColor: inscritosCount === 0 ? '#cbd5e1' : '#0f172a', color: 'white', border: 'none', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: inscritosCount === 0 ? 'not-allowed' : 'pointer', fontSize: '13px', width: '100%', textAlign: 'center' }}
              >
                📥 {isEn ? 'Export CSV' : 'Exportar Contexto (Excel)'}
              </button>
            </div>
          </div>

          {/* DEMOGRAFIA DE AUDITORIA INTERNA */}
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem' }}>
            <div>
              <span style={analyticsLabelStyle}>{isEn ? 'GENDER RATIO' : 'DISTRIBUIÇÃO POR SEXO'}</span>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#334155', marginTop: '0.5rem' }}>
                🙋‍♂️ {pctMasc}% Masc. &nbsp;|&nbsp; 🙋‍♀️ {pctFem}% Fem.
              </div>
            </div>
            <div>
              <span style={analyticsLabelStyle}>{isEn ? 'MEDICAL RATE' : 'TAXA DE ALERTAS REAIS'}</span>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: comAlergia > 0 ? '#b91c1c' : '#047857', marginTop: '0.5rem' }}>
                ⚠️ {pctAlergias}% com Restrições Médicas ({comAlergia} miúdos)
              </div>
            </div>
            <div>
              <span style={analyticsLabelStyle}>{isEn ? 'AVERAGE AGE' : 'MÉDIA DE IDADES DO FILTRO'}</span>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginTop: '0.5rem' }}>
                📅 {mediaIdades} anos de média
              </div>
            </div>
          </div>

          {/* LISTA NOMINAL CENTRALIZADA */}
          <div style={{ backgroundColor: 'white', borderRadius: '1.25rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#334155', textTransform: 'uppercase' }}>{isEn ? 'NOMINAL ROSTER' : 'LISTA NOMINAL DE PARTICIPANTES FILTRADA'}</h3>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{inscritosCount} Registos Detetados</span>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              {inscritosCount === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>
                  Não existem inscrições processadas para a seleção atual.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fdfdfd' }}>
                      <th style={thStyle}>{isEn ? 'PARTICIPANT' : 'MIÚDO / PROGRAMA'}</th>
                      <th style={thStyle}>{isEn ? 'AGE' : 'IDADE'}</th>
                      <th style={thStyle}>{isEn ? 'HEALTH/DIET' : 'RESTRIÇÕES DE SAÚDE'}</th>
                      <th style={thStyle}>{isEn ? 'SHIFT' : 'TURNO'}</th>
                      <th style={thStyle}>{isEn ? 'DATE' : 'DATA E HORA (INSCRIÇÃO)'}</th>
                      <th style={thStyle}>{isEn ? 'PAYMENT' : 'ESTADO'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscritosRows.map((item: any, idx: number) => {
                      const alertaVerdadeiro = temAlertaMedico(item.crianca?.restricoes_alimentares);
                      const dataFormatada = new Date(item.dataReserva);
                      
                      return (
                        <tr key={idx} style={{ borderBottom: idx !== inscritosRows.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                          <td style={tdStyle}>
                            <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.crianca?.nome}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>🏕️ {item.campNome} | NIF: {item.crianca?.nif || 'N/A'}</div>
                          </td>
                          <td style={tdStyle}>{item.crianca?.data_nascimento ? `${obterIdade(item.crianca.data_nascimento)} anos` : '-'}</td>
                          <td style={tdStyle}>
                            {alertaVerdadeiro ? (
                              <span style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', fontSize: '12px', fontWeight: 'bold' }}>
                                ⚠️ {item.crianca.restricoes_alimentares}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>-</span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: '600' }}>
                            {item.turno} <div style={{ fontSize: '11px', color: '#059669' }}>{item.valor}€</div>
                          </td>
                          <td style={{ ...tdStyle, color: '#64748b', fontSize: '13px' }}>
                            <strong>{dataFormatada.toLocaleDateString('pt-PT')}</strong> às {dataFormatada.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={tdStyle}>
                            <button 
                              type="button"
                              onClick={() => toggleStatusPagamento(item.reservaId, item.statusPagamento)}
                              style={{
                                backgroundColor: item.statusPagamento === 'Pago' ? '#ecfdf5' : '#fff7ed',
                                color: item.statusPagamento === 'Pago' ? '#059669' : '#c2410c',
                                border: `1px solid ${item.statusPagamento === 'Pago' ? '#a7f3d0' : '#fed7aa'}`,
                                padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '11px', fontWeight: '900', cursor: 'pointer'
                              }}
                            >
                              {item.statusPagamento}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

const statCardStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem', backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' };
const statLabelStyle = { fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em' };
const analyticsLabelStyle = { fontSize: '11px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' };
const thStyle = { padding: '1rem 1.5rem', fontSize: '11px', fontWeight: '800', color: '#475569', letterSpacing: '0.05em' };
const tdStyle = { padding: '1.25rem 1.5rem', color: '#334155', verticalAlign: 'middle' };
const selectDropdownStyle = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid #a7f3d0', backgroundColor: '#f0fdf4', color: '#064e3b', fontWeight: '800', fontSize: '14px', outline: 'none', appearance: 'none' as const, cursor: 'pointer', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23064e3b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' };
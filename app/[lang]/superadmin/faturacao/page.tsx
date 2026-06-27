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

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold animate-pulse">A analisar tesouraria...</div>;

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
    <div className="max-w-7xl mx-auto font-sans">
      
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight m-0">Tesouraria Global</h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Transações & Reembolsos</p>
        </div>
      </div>

      {/* CARDS COMPACTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Volume Bruto</span>
          <span className="text-2xl font-black text-gray-900">{volumeTotal.toFixed(2)}€</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Comissões (Lucro)</span>
          <span className="text-2xl font-black text-emerald-600">{comissoesTotais.toFixed(2)}€</span>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Reembolsado</span>
          <span className="text-2xl font-black text-red-600">{totalReembolsado.toFixed(2)}€</span>
        </div>
      </div>

      {/* TABELA DE FATURAÇÃO COMPACTA */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Transação</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Parceiro</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Volume</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Comissão</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {historicoProcessado.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-bold text-sm">Sem transações registadas.</td></tr>
            ) : historicoProcessado.map((res: any) => {
              const eReembolsado = res.status_pagamento === 'Reembolsado';
              return (
                <tr key={res.id} className={`hover:bg-gray-50 transition-colors ${eReembolsado ? 'opacity-60 bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs font-bold text-gray-800">{res.id.split('-')[0]}</div>
                    <div className="text-[10px] text-gray-400 font-bold mt-0.5">{new Date(res.created_at).toLocaleDateString('pt-PT')}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-sm font-bold text-gray-900 truncate max-w-[200px] ${eReembolsado ? 'line-through' : ''}`}>{res.organizador?.empresa_nome || 'Desconhecido'}</div>
                    <div className="text-[10px] text-gray-500 truncate max-w-[200px] mt-0.5">{res.campos?.nome}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm font-black text-gray-900">{res.valor_total}€</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-sm font-black text-emerald-600">{eReembolsado ? '0.00€' : `${res.comissaoCalculada.toFixed(2)}€`}</div>
                    {!eReembolsado && <div className="text-[9px] text-gray-400 font-bold mt-0.5">Taxa: {res.taxaAplicada}%</div>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                      eReembolsado ? 'bg-red-100 text-red-700 border-red-200' :
                      (res.status_pagamento === 'Pago' || res.status_pagamento === 'Sinal Pago') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {res.status_pagamento || 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setReservaSelecionada(res)} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm">
                      Detalhes
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL FINANCEIRO COMPACTO */}
      {reservaSelecionada && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            
            <div className={`px-5 py-4 border-b flex justify-between items-center flex-shrink-0 ${reservaSelecionada.status_pagamento === 'Reembolsado' ? 'bg-red-600 text-white border-red-700' : 'bg-gray-900 text-white border-gray-800'}`}>
              <div>
                <h2 className="text-lg font-black flex items-center gap-2 m-0">Auditoria Financeira {reservaSelecionada.status_pagamento === 'Reembolsado' && '(Estorno)'}</h2>
                <p className="text-[10px] opacity-80 font-mono mt-0.5 m-0">Ref: {reservaSelecionada.id}</p>
              </div>
              <button onClick={() => setReservaSelecionada(null)} className="text-white hover:text-gray-300 w-8 h-8 flex items-center justify-center font-bold text-xl border-none bg-transparent cursor-pointer">&times;</button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-white space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-200 pb-1">Parceiro & Programa</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><strong className="text-gray-600">Entidade:</strong><span className="font-medium text-right ml-4">{reservaSelecionada.organizador?.empresa_nome}</span></div>
                    <div className="flex justify-between"><strong className="text-gray-600">Campo:</strong><span className="font-medium text-right ml-4">{reservaSelecionada.campos?.nome}</span></div>
                    <div className="flex justify-between"><strong className="text-gray-600">Turno:</strong><span className="font-medium text-right ml-4">{reservaSelecionada.turno_nome}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-200 pb-1">Cliente Origem</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><strong className="text-gray-600">Nome (Pai):</strong><span className="font-medium text-right ml-4">{reservaSelecionada.nome_encarregado || reservaSelecionada.pai?.nome_completo}</span></div>
                    <div className="flex justify-between"><strong className="text-gray-600">Email:</strong><span className="font-medium text-right ml-4 break-all">{reservaSelecionada.email_encarregado || reservaSelecionada.pai?.email}</span></div>
                    <div className="flex justify-between"><strong className="text-gray-600">Participante:</strong><span className="font-bold text-gray-900 text-right ml-4 break-all">{reservaSelecionada.crianca?.nome || 'N/D'}</span></div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <span className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-3 border-b border-emerald-200/50 pb-1">Lançamentos</span>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><strong className="text-emerald-900">Volume Transacionado:</strong><span className="font-black text-gray-900">{reservaSelecionada.valor_total}€</span></div>
                  <div className="flex justify-between"><strong className="text-emerald-900">Comissão HelloCamp:</strong><span className="font-black text-emerald-700">{reservaSelecionada.comissaoCalculada.toFixed(2)}€ <span className="text-[10px] font-medium text-emerald-600 ml-1">({reservaSelecionada.taxaAplicada}%)</span></span></div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200">
                 <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-200 pb-1">Status Stripe</span>
                 <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><strong className="block text-gray-600 mb-1">Estado Lógico</strong><span className="font-bold text-gray-900">{reservaSelecionada.status_pagamento}</span></div>
                    <div><strong className="block text-gray-600 mb-1">Valor Capturado</strong><span className="font-bold text-gray-900">{reservaSelecionada.valor_pago || 0}€</span></div>
                    <div><strong className="block text-gray-600 mb-1">Em Falta</strong><span className="font-bold text-gray-900">{reservaSelecionada.valor_em_falta || 0}€</span></div>
                    <div><strong className="block text-gray-600 mb-1">Método</strong><span className="font-bold text-gray-900">{reservaSelecionada.metodo_pagamento || 'N/D'}</span></div>
                 </div>
              </div>

            </div>

            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex justify-end flex-shrink-0">
              {reservaSelecionada.status_pagamento !== 'Reembolsado' && reservaSelecionada.status_pagamento !== 'Pendente' && (
                <button
                  onClick={() => handleProcessarReembolsoStripe(reservaSelecionada.id, Number(reservaSelecionada.valor_total))}
                  disabled={loadingRefundId === reservaSelecionada.id}
                  className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loadingRefundId === reservaSelecionada.id ? 'A processar estorno...' : `Forçar Reembolso (${reservaSelecionada.valor_total}€)`}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
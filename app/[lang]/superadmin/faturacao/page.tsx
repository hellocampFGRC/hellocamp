"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

export default function FaturacaoGlobalHQ({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);

  const [loading, setLoading] = useState(true);
  const [reservas, setReservas] = useState<any[]>([]);
  const [loadingRefundId, setLoadingRefundId] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<"pagas" | "todas">("pagas");

  const fetchDadosFinanceiros = async () => {
    setLoading(true);
    const [
      { data: reservasData },
      { data: camposData },
      { data: perfisData },
      { data: criancasData },
    ] = await Promise.all([
      supabase
        .from("reservas")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("campos")
        .select(
          "id, nome, preco, taxa_comissao, base_comissao, local, modalidade_reserva"
        ),
      supabase
        .from("perfis")
        .select(
          "id, nome_completo, email, telefone, nif, empresa_nome, taxa_comissao, base_comissao"
        ),
      supabase
        .from("criancas")
        .select(
          "id, nome, data_nascimento, sexo, restricoes_alimentares, doencas_cronicas"
        ),
    ]);

    if (reservasData) {
      const reservasCruzadas = reservasData.map((res) => {
        const campo = camposData?.find((c) => c.id === res.campo_id) || {};
        const organizador =
          perfisData?.find((p) => p.id === res.organizador_id) || {};
        const pai = perfisData?.find((p) => p.id === res.cliente_id) || {};
        const crianca =
          criancasData?.find((c) => c.id === res.crianca_id) || {};

        return {
          ...res,
          campos: campo,
          crianca: crianca,
          pai: pai,
          organizador: organizador,
        };
      });
      setReservas(reservasCruzadas);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDadosFinanceiros();
  }, []);

  const handleProcessarReembolsoStripe = async (
    reservaId: string,
    valor: number
  ) => {
    if (
      !window.confirm(
        `ATENÇÃO! Esta ação é irreversível.\nO valor de ${valor.toFixed(
          2
        )}€ sairá da conta Stripe e será devolvido ao cliente.\n\nPretende confirmar o reembolso?`
      )
    )
      return;

    setLoadingRefundId(reservaId);
    try {
      const res = await fetch("/api/processar-reembolso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservaId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      alert("Reembolso concluído com sucesso.");
      fetchDadosFinanceiros();
    } catch (err: any) {
      alert("Falha no reembolso: " + err.message);
    } finally {
      setLoadingRefundId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">
        A analisar tesouraria global...
      </div>
    );
  }

  let volumeTotal = 0;
  let comissoesTotais = 0;
  let totalReembolsado = 0;

  const historicoProcessado = reservas.map((res) => {
    const valor = Number(res.valor_total) || 0;
    const st = res.status_pagamento || "Pendente";
    const isPaga =
      st === "Pago" ||
      st === "Sinal Pago" ||
      st === "Aguardando Pagamento Extra";

    const taxa =
      res.campos?.taxa_comissao !== null &&
      res.campos?.taxa_comissao !== undefined
        ? Number(res.campos.taxa_comissao)
        : Number(res.organizador?.taxa_comissao ?? 12);

    const base =
      res.campos?.base_comissao || res.organizador?.base_comissao || "total";

    let valorIncidencia = valor;
    if (base === "apenas_programa") {
      const precoBaseUnitario = Number(res.campos?.preco) || valor;
      valorIncidencia = Math.min(valor, precoBaseUnitario);
    } else if (base === "sem_comissao") {
      valorIncidencia = 0;
    }

    const comissaoCalculada = isPaga ? valorIncidencia * (taxa / 100) : 0;
    const isExterno =
      res.campos?.modalidade_reserva === "link_externo" || st === "Externo";

    if (st === "Reembolsado") {
      totalReembolsado += valor;
    } else if (isPaga && !isExterno) {
      volumeTotal += valor;
      comissoesTotais += comissaoCalculada;
    }

    return {
      ...res,
      isPaga,
      comissaoCalculada,
      taxaAplicada: taxa,
      isExterno,
    };
  });

  const listaExibida =
    filtroEstado === "pagas"
      ? historicoProcessado.filter(
          (r) => r.isPaga || r.status_pagamento === "Reembolsado"
        )
      : historicoProcessado;

  return (
    <div className="max-w-7xl mx-auto font-sans pb-20">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 m-0">
            Tesouraria Global & Reembolsos Stripe
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 mb-0">
            Controlo de Volume Transacionado, Comissões Retidas e Estornos
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFiltroEstado("pagas")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer ${
              filtroEstado === "pagas"
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            Transações Confirmadas
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("todas")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer ${
              filtroEstado === "todas"
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            Todas (Incl. Abandonadas)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            Volume Bruto (GMV Pago)
          </span>
          <span className="text-3xl font-black text-slate-900">
            {volumeTotal.toFixed(2)}€
          </span>
        </div>

        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#167524] block mb-1">
            Receita HelloCamp (Comissões)
          </span>
          <span className="text-3xl font-black text-[#167524]">
            {comissoesTotais.toFixed(2)}€
          </span>
        </div>

        <div className="bg-red-50 p-6 rounded-3xl border border-red-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-700 block mb-1">
            Total Reembolsado
          </span>
          <span className="text-3xl font-black text-red-600">
            {totalReembolsado.toFixed(2)}€
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[900px] border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <tr>
              <th className="p-4">Data / Ref</th>
              <th className="p-4">Campo / Parceiro</th>
              <th className="p-4">Cliente / Participante</th>
              <th className="p-4">Valor / Comissão HQ</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Ação Financeira</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {listaExibida.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70">
                <td className="p-4">
                  <div className="font-bold text-slate-800">
                    {new Date(r.created_at).toLocaleDateString("pt-PT")}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    #{r.id.split("-")[0]}
                  </div>
                </td>

                <td className="p-4">
                  <div className="font-black text-slate-900">
                    {r.campos?.nome || "Campo"}
                  </div>
                  <div className="text-xs text-slate-500">
                    🏢 {r.organizador?.empresa_nome || "Parceiro"}
                  </div>
                </td>

                <td className="p-4">
                  <div className="font-bold text-slate-800">
                    {r.nome_encarregado || r.pai?.nome_completo || "Cliente"}
                  </div>
                  <div className="text-xs text-slate-500">
                    👦 {r.crianca?.nome || "Participante"}
                  </div>
                </td>

                <td className="p-4">
                  <div className="font-black text-slate-900">
                    {Number(r.valor_total || 0).toFixed(2)}€
                  </div>
                  <div className="text-xs font-bold text-[#167524]">
                    Fee: {r.comissaoCalculada.toFixed(2)}€ ({r.taxaAplicada}%)
                  </div>
                </td>

                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      r.isPaga
                        ? "bg-emerald-100 text-[#167524]"
                        : r.status_pagamento === "Reembolsado"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {r.status_pagamento}
                  </span>
                </td>

                <td className="p-4 text-right">
                  {r.isPaga && !r.isExterno && (
                    <button
                      type="button"
                      disabled={loadingRefundId === r.id}
                      onClick={() =>
                        handleProcessarReembolsoStripe(
                          r.id,
                          Number(r.valor_pago || r.valor_total || 0)
                        )
                      }
                      className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-xl cursor-pointer"
                    >
                      {loadingRefundId === r.id
                        ? "A estornar..."
                        : "↩ Emitir Reembolso Stripe"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
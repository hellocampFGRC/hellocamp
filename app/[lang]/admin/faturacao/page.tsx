"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function FaturacaoPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [perfil, setPerfil] = useState<any>({});

  const [camposParceiro, setCamposParceiro] = useState<any[]>([]);
  const [reservasFull, setReservasFull] = useState<any[]>([]);
  const [filtroCampoId, setFiltroCampoId] = useState<string>("todos");
  const [isCampoDropdownOpen, setIsCampoDropdownOpen] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const uid = session.user.id;

      const { data: perfilData } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      setPerfil(perfilData || {});

      const { data: camposData } = await supabase
        .from("campos")
        .select(
          "id, nome, preco, taxa_comissao, base_comissao, contrato_parceiro_url, modalidade_reserva"
        )
        .eq("organizador_id", uid);

      const listaCampos = camposData || [];
      setCamposParceiro(listaCampos);
      const idsCampos = listaCampos.map((c: any) => c.id);

      // Busca reservas por organizador_id OU campo_id
      let queryRes = supabase
        .from("reservas")
        .select("*")
        .order("created_at", { ascending: false });

      if (idsCampos.length > 0) {
        queryRes = queryRes.or(
          `organizador_id.eq.${uid},campo_id.in.(${idsCampos.join(",")})`
        );
      } else {
        queryRes = queryRes.eq("organizador_id", uid);
      }

      const { data: reservasData } = await queryRes;
      const listaReservas = reservasData || [];

      const criancasIds = Array.from(
        new Set(listaReservas.map((r: any) => r.crianca_id).filter(Boolean))
      );
      const clientesIds = Array.from(
        new Set(listaReservas.map((r: any) => r.cliente_id).filter(Boolean))
      );

      const [resCriancas, resPerfisPais] = await Promise.all([
        criancasIds.length > 0
          ? supabase
              .from("criancas")
              .select("id, nome")
              .in("id", criancasIds)
          : Promise.resolve({ data: [] }),
        clientesIds.length > 0
          ? supabase
              .from("perfis")
              .select("id, nome_completo, nif")
              .in("id", clientesIds)
          : Promise.resolve({ data: [] }),
      ]);

      const reservasConstruidas = listaReservas.map((res: any) => {
        const campoEncontrado =
          listaCampos.find((c: any) => c.id === res.campo_id) || {};
        const criancaEncontrada =
          (resCriancas.data || []).find((cr: any) => cr.id === res.crianca_id) ||
          {};
        const paiEncontrado =
          (resPerfisPais.data || []).find((p: any) => p.id === res.cliente_id) ||
          {};

        const dataReserva = new Date(res.created_at).getTime();
        const minutosPassados = (Date.now() - dataReserva) / (1000 * 60);

        let estadoReal = res.status_pagamento || res.status || "Pendente";
        if (
          estadoReal === "Pendente" &&
          minutosPassados > 30 &&
          !res.respostas_customizadas?.pedido_pai_pendente
        ) {
          estadoReal = "Abandonada";
        }

        return {
          ...res,
          status_pagamento_real: estadoReal,
          campos: campoEncontrado,
          criancas: criancaEncontrada,
          perfis: paiEncontrado,
        };
      });

      setReservasFull(reservasConstruidas);
      setLoading(false);
    };

    carregarDados();
  }, []);

  const handleStripeConnect = async () => {
    setConnectLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/stripe-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          email: session.user.email,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao ligar à Stripe.");
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      alert(err.message);
      setConnectLoading(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("perfis")
        .update({
          empresa_nome: perfil.empresa_nome,
          nif_empresa: perfil.nif_empresa,
        })
        .eq("id", perfil.id);
      if (error) throw error;
      alert(
        isEn
          ? "Company billing details saved!"
          : "Dados fiscais guardados com sucesso!"
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-bold text-slate-400 text-sm uppercase tracking-widest animate-pulse">
        {isEn
          ? "Loading financial data..."
          : "A carregar dados financeiros e faturas..."}
      </div>
    );
  }

  const reservasAtivas =
    filtroCampoId === "todos"
      ? reservasFull
      : reservasFull.filter((r) => r.campo_id === filtroCampoId);

  const taxaComissaoGeral = perfil?.taxa_comissao ?? 12;
  const baseIncidenciaGeral = perfil?.base_comissao || "total";

  let totalVolume = 0;
  let totalComissoesGeradas = 0;
  let saldoParceiroSeraTransferido = 0;

  const historicoCalculado = reservasAtivas.map((res) => {
    const valorReserva = Number(res.valor_total) || 0;
    const status = res.status_pagamento_real;

    // CORRIGIDO: Apenas reservas efetivamente pagas via HelloCamp contam no saldo financeiro!
    const isValidaFinanceiramente =
      status === "Pago" ||
      status === "Sinal Pago" ||
      status === "Aguardando Pagamento Extra";

    const campoAssociado = res.campos;
    const taxaLinha =
      campoAssociado?.taxa_comissao !== null &&
      campoAssociado?.taxa_comissao !== undefined
        ? Number(campoAssociado.taxa_comissao)
        : Number(taxaComissaoGeral);
    const baseLinha = campoAssociado?.base_comissao || baseIncidenciaGeral;

    let valorIncidencia = valorReserva;
    if (baseLinha === "apenas_programa") {
      const precoBase = Number(campoAssociado?.preco) || valorReserva;
      valorIncidencia = Math.min(valorReserva, precoBase);
    } else if (baseLinha === "sem_comissao") {
      valorIncidencia = 0;
    }

    const valorComissao = isValidaFinanceiramente
      ? valorIncidencia * (taxaLinha / 100)
      : 0;

    if (isValidaFinanceiramente) {
      totalVolume += valorReserva;
      totalComissoesGeradas += valorComissao;
      saldoParceiroSeraTransferido += valorReserva - valorComissao;
    }

    return {
      ...res,
      isValidaFinanceiramente,
      valorIncidencia,
      valorComissao,
      taxaAplicada: taxaLinha,
      baseAplicada: baseLinha,
      campoFormatado: campoAssociado,
      paiFormatado: res.perfis,
      criancaFormatado: res.criancas,
    };
  });

  const campoFiltradoData =
    filtroCampoId !== "todos"
      ? camposParceiro.find((c) => c.id === filtroCampoId)
      : null;
  const taxaExibida =
    campoFiltradoData &&
    campoFiltradoData.taxa_comissao !== null &&
    campoFiltradoData.taxa_comissao !== undefined
      ? campoFiltradoData.taxa_comissao
      : taxaComissaoGeral;
  const baseExibida =
    campoFiltradoData && campoFiltradoData.base_comissao
      ? campoFiltradoData.base_comissao
      : baseIncidenciaGeral;

  const temContratoAssinado =
    !!perfil?.contrato_dados?.assinaturaNome ||
    perfil?.status_contrato === "Aprovado";

  return (
    <main className="max-w-6xl mx-auto font-sans pb-20">
      {/* BANNER DE AVISO SE AINDA NÃO ASSINOU CONTRATO */}
      {!temContratoAssinado && (
        <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-3xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="m-0 text-sm md:text-base font-black text-amber-950">
                {isEn
                  ? "Pending Global Partnership Contract"
                  : "Contrato Global de Parceria Pendente de Assinatura"}
              </h3>
              <p className="m-0 text-xs font-medium text-amber-800 mt-0.5">
                {isEn
                  ? "Please sign your Global Contract to formalize your commission rate and enable automated payouts."
                  : "Assine o seu Contrato Global para formalizar as suas condições de faturação e desbloquear as transferências."}
              </p>
            </div>
          </div>
          <Link
            href={`/${lang}/admin/contrato`}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest no-underline whitespace-nowrap"
          >
            {isEn ? "Sign Contract" : "Assinar Contrato"} &rarr;
          </Link>
        </div>
      )}

      {/* CABEÇALHO + DROPDOWN CUSTOMIZADO DE CAMPO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 m-0 tracking-tight">
            {isEn ? "Billing & Automated Payouts" : "Faturação e Pagamentos"}
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium mb-0">
            {isEn
              ? "Track splits, manage company tax info, and connect your bank account via Stripe."
              : "Controle a divisão de valores, dados fiscais e sincronize o seu banco via Stripe."}
          </p>
        </div>

        {/* DROPDOWN CUSTOMIZADO (SEM <select> NATIVO) */}
        <div className="relative min-w-[280px] w-full md:w-auto">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
            {isEn ? "Filter Finances by Camp" : "Filtrar Finanças por Campo"}
          </label>
          <div
            onClick={() => setIsCampoDropdownOpen(!isCampoDropdownOpen)}
            className="w-full p-3.5 bg-emerald-50 border border-[#167524] rounded-xl text-xs font-black text-[#167524] cursor-pointer flex items-center justify-between shadow-sm"
          >
            <span className="truncate">
              {filtroCampoId === "todos"
                ? isEn
                  ? "All Active Camps (Global)"
                  : "Visão Global (Todos os Campos)"
                : campoFiltradoData?.nome || "Campo Selecionado"}
            </span>
            <span className="text-[10px] ml-2">▼</span>
          </div>
          {isCampoDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsCampoDropdownOpen(false)}
              />
              <div className="absolute top-[calc(100%+6px)] right-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                <div
                  onClick={() => {
                    setFiltroCampoId("todos");
                    setIsCampoDropdownOpen(false);
                  }}
                  className="p-3 text-xs font-black text-[#167524] hover:bg-emerald-50 cursor-pointer border-b border-slate-100"
                >
                  {isEn
                    ? "All Active Camps (Global)"
                    : "Visão Global (Todos os Campos)"}
                </div>
                {camposParceiro.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setFiltroCampoId(c.id);
                      setIsCampoDropdownOpen(false);
                    }}
                    className="p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                  >
                    {c.nome}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* BLOCO STRIPE CONNECT */}
      <div
        className={`mb-8 p-6 md:p-8 rounded-3xl border ${
          perfil?.stripe_account_id
            ? "bg-emerald-50/70 border-emerald-200"
            : "bg-white border-slate-200 shadow-sm"
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h3 className="m-0 text-lg font-black text-slate-900">
              {perfil?.stripe_account_id
                ? isEn
                  ? "✓ Bank Configuration Completed (Stripe)"
                  : "✓ Configuração Bancária Concluída (Stripe)"
                : isEn
                ? "⚠️ Enable Automated Payouts"
                : "⚠️ Ative os Recebimentos Automáticos (Stripe)"}
            </h3>
            <p className="mt-1.5 mb-0 text-sm text-slate-600 leading-relaxed max-w-2xl">
              {perfil?.stripe_account_id
                ? isEn
                  ? "Your bank account is securely linked via Stripe. Booking funds (minus commission) are transferred directly to your account."
                  : "A sua conta bancária está vinculada de forma segura através da Stripe. O valor das inscrições (deduzido da comissão) é transferido automaticamente para a sua conta."
                : isEn
                ? "To receive booking payments directly in your bank account, link your IBAN securely via our partner Stripe."
                : "Para receber os pagamentos das inscrições diretamente na sua conta bancária, associe o seu IBAN com segurança através da Stripe."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleStripeConnect}
            disabled={connectLoading}
            className="bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs px-6 py-4 rounded-xl cursor-pointer shadow-md whitespace-nowrap transition-colors"
          >
            {connectLoading
              ? isEn
                ? "Connecting..."
                : "A processar..."
              : perfil?.stripe_account_id
              ? isEn
                ? "Manage Stripe Account"
                : "Gerir Conta Stripe"
              : isEn
              ? "Connect to Stripe"
              : "Ligar Conta Bancária (Stripe)"}
          </button>
        </div>
      </div>

      {/* RESUMO FINANCEIRO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest m-0 mb-2">
            {isEn ? "Gross Volume" : "Volume Bruto Confirmado"}
          </p>
          <p className="text-3xl font-black text-slate-900 m-0">
            {totalVolume.toFixed(2)}€
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest m-0 mb-2">
            {isEn ? "HelloCamp Commission" : "Comissão HelloCamp"}
          </p>
          <p className="text-3xl font-black text-red-500 m-0">
            {totalComissoesGeradas.toFixed(2)}€
          </p>
        </div>

        <div className="bg-emerald-50/70 p-6 rounded-2xl border border-[#167524]">
          <p className="text-[11px] font-black text-[#167524] uppercase tracking-widest m-0 mb-2">
            {isEn ? "Your Net Balance" : "O Seu Ganho Líquido"}
          </p>
          <p className="text-3xl font-black text-[#167524] m-0">
            {saldoParceiroSeraTransferido.toFixed(2)}€
          </p>
        </div>
      </div>

      {/* DADOS FISCAIS E ACORDO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-widest m-0 mb-5 pb-3 border-b border-slate-100">
            {isEn ? "Company Tax Details" : "Dados Fiscais da Empresa"}
          </h2>
          <form onSubmit={handleSaveDetails} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {isEn ? "Company Name *" : "Nome da Empresa / Entidade *"}
              </label>
              <input
                type="text"
                required
                value={perfil.empresa_nome || ""}
                onChange={(e) =>
                  setPerfil({ ...perfil, empresa_nome: e.target.value })
                }
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#167524]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {isEn ? "NIF / Tax ID *" : "NIF / NIPC *"}
              </label>
              <input
                type="text"
                required
                value={perfil.nif_empresa || ""}
                onChange={(e) =>
                  setPerfil({ ...perfil, nif_empresa: e.target.value })
                }
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#167524]"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs rounded-xl cursor-pointer transition-colors"
            >
              {saving
                ? isEn
                  ? "Saving..."
                  : "A guardar..."
                : isEn
                ? "Save Tax Details"
                : "Gravar Dados Fiscais"}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-widest m-0 mb-5 pb-3 border-b border-slate-100">
              {isEn ? "Commission Agreement" : "Condições de Comissionamento"}
            </h2>
            <div className="flex items-center gap-5 mb-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center min-w-[110px]">
                <span className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  {isEn ? "Rate" : "Taxa"}
                </span>
                <span className="text-3xl font-black text-[#167524]">
                  {taxaExibida}%
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  {isEn ? "Incidence Base" : "Base de Incidência"}
                </span>
                <p className="text-sm font-black text-slate-900 m-0">
                  {baseExibida === "apenas_programa"
                    ? isEn
                      ? "Base program only (Extras excluded)"
                      : "Apenas sobre o Programa Base"
                    : isEn
                    ? "Total value (Program + Extras)"
                    : "Sobre o Valor Total da Reserva"}
                </p>
                <span
                  className={`inline-block mt-2 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                    temContratoAssinado
                      ? "bg-emerald-50 text-[#167524]"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {temContratoAssinado
                    ? isEn
                      ? "✓ Contract Signed"
                      : "✓ Contrato Assinado"
                    : isEn
                    ? "⚠️ Signature Pending"
                    : "⚠️ Assinatura Pendente"}
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/${lang}/admin/contrato`}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-center font-black uppercase tracking-widest text-xs rounded-xl no-underline transition-colors"
          >
            📝{" "}
            {temContratoAssinado
              ? isEn
                ? "View / Download Global Contract"
                : "Consultar / Descarregar Contrato Global"
              : isEn
              ? "Sign Global Contract Now"
              : "Assinar Contrato Global Agora"}
          </Link>
        </div>
      </div>

      {/* TABELA DE HISTÓRICO DE TRANSAÇÕES */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-black text-slate-900 uppercase tracking-widest m-0 mb-6 pb-3 border-b border-slate-100">
          {isEn ? "Transaction History" : "Histórico de Transações e Reservas"}
        </h2>

        {historicoCalculado.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            {isEn
              ? "No transactions recorded yet."
              : "Ainda não existem transações registadas para esta seleção."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="border-b-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="p-3">{isEn ? "Date" : "Data"}</th>
                  <th className="p-3">
                    {isEn ? "Program / Child" : "Programa / Participante"}
                  </th>
                  <th className="p-3">
                    {isEn ? "Parent / Tax ID" : "Encarregado / NIF"}
                  </th>
                  <th className="p-3">
                    {isEn ? "Gross Value" : "Valor Bruto"}
                  </th>
                  <th className="p-3 text-red-500">
                    {isEn ? "Commission" : "Comissão"}
                  </th>
                  <th className="p-3 text-[#167524]">
                    {isEn ? "Net Payout" : "Líquido Parceiro"}
                  </th>
                  <th className="p-3">{isEn ? "Status" : "Estado"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historicoCalculado.map((res) => {
                  const eReembolsado =
                    res.status_pagamento_real === "Reembolsado";
                  const eAbandonada =
                    res.status_pagamento_real === "Abandonada";
                  const isInativa = !res.isValidaFinanceiramente;

                  const nomePai =
                    res.nome_encarregado ||
                    res.paiFormatado?.nome_completo ||
                    "N/D";
                  const nifPai =
                    res.nif_encarregado || res.paiFormatado?.nif || "S/ NIF";
                  const nomeCrianca =
                    res.criancaFormatado?.nome ||
                    res.respostas_customizadas?.nome_crianca ||
                    "Participante";

                  return (
                    <tr
                      key={res.id}
                      className={isInativa ? "opacity-60 bg-slate-50/50" : ""}
                    >
                      <td className="p-3 text-slate-600">
                        {new Date(res.created_at).toLocaleDateString("pt-PT")}
                        <div className="text-[10px] font-bold text-slate-400">
                          {res.metodo_pagamento || "Stripe"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-black text-slate-900">
                          {res.campoFormatado?.nome || "Programa HelloCamp"}
                        </div>
                        <div className="text-xs text-slate-500">
                          👦 {nomeCrianca} ({res.turno_nome})
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">
                          {nomePai}
                        </div>
                        <div className="text-xs text-slate-500">
                          NIF: {nifPai}
                        </div>
                      </td>
                      <td className="p-3 font-black text-slate-900">
                        {Number(res.valor_total || 0).toFixed(2)}€
                      </td>
                      <td className="p-3 font-bold text-red-500">
                        {isInativa
                          ? "0.00€"
                          : `-${res.valorComissao.toFixed(2)}€ (${
                              res.taxaAplicada
                            }%)`}
                      </td>
                      <td className="p-3 font-black text-[#167524]">
                        {isInativa
                          ? "0.00€"
                          : `${(
                              Number(res.valor_total || 0) - res.valorComissao
                            ).toFixed(2)}€`}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            res.isValidaFinanceiramente
                              ? "bg-emerald-100 text-[#167524]"
                              : eReembolsado
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {eAbandonada
                            ? isEn
                              ? "Unfinished"
                              : "Não Concluída"
                            : res.status_pagamento_real}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FaturacaoPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);

  const [camposParceiro, setCamposParceiro] = useState<any[]>([]);
  const [reservasFull, setReservasFull] = useState<any[]>([]);
  const [filtroCampoId, setFiltroCampoId] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<
    "confirmadas" | "abandonadas" | "todas"
  >("confirmadas");
  const [isCampoDropdownOpen, setIsCampoDropdownOpen] = useState(false);

  const [ibanForm, setIbanForm] = useState("");
  const [nifForm, setNifForm] = useState("");
  const [empresaForm, setEmpresaForm] = useState("");

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${lang}/login`);
        return;
      }

      const uid = session.user.id;

      const [
        { data: perfilData },
        { data: camposData },
        { data: reservasData },
        { data: criancasData },
        { data: perfisPaisData },
      ] = await Promise.all([
        supabase.from("perfis").select("*").eq("id", uid).maybeSingle(),
        supabase
          .from("campos")
          .select(
            "id, nome, preco, taxa_comissao, base_comissao, regras_comissao, contrato_parceiro_url"
          )
          .eq("organizador_id", uid),
        supabase
          .from("reservas")
          .select("*")
          .eq("organizador_id", uid)
          .order("created_at", { ascending: false }),
        supabase.from("criancas").select("id, nome"),
        supabase.from("perfis").select("id, nome_completo, nif, email"),
      ]);

      setPerfil(perfilData || {});
      setIbanForm(perfilData?.iban || "");
      setNifForm(
        perfilData?.nif_empresa ? String(perfilData.nif_empresa) : ""
      );
      setEmpresaForm(
        perfilData?.empresa_nome ||
          perfilData?.nome_empresa ||
          perfilData?.nome ||
          ""
      );
      setCamposParceiro(camposData || []);

      if (reservasData) {
        const reservasConstruidas = reservasData.map((res: any) => {
          const campoEncontrado =
            camposData?.find((c: any) => c.id === res.campo_id) || {};
          const criancaEncontrada =
            criancasData?.find((cr: any) => cr.id === res.crianca_id) || {};
          const paiEncontrado =
            perfisPaisData?.find((p: any) => p.id === res.cliente_id) || {};

          const dataReserva = new Date(res.created_at).getTime();
          const minutosPassados =
            (new Date().getTime() - dataReserva) / (1000 * 60);

          let estadoReal = res.status_pagamento || "Pendente";
          if (estadoReal === "Pendente" && minutosPassados > 15) {
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
      }

      setLoading(false);
    };

    carregarDados();
  }, [lang, router]);

  // Ligar ou aceder ao Stripe Connect Express
  const handleStripeConnect = async () => {
    if (!perfil?.id) return;
    setConnectLoading(true);
    try {
      const res = await fetch("/api/stripe-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: perfil.id,
          email: perfil.email,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || "Não foi possível iniciar ligação Stripe Connect."
        );
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      alert("Aviso Stripe Connect: " + err.message);
    } finally {
      setConnectLoading(false);
    }
  };

  // Guardar IBAN e Dados Fiscais
  const handleGuardarDadosFiscais = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("perfis")
        .update({
          iban: ibanForm.trim() || null,
          nif_empresa: nifForm.trim() || null,
          empresa_nome: empresaForm.trim() || null,
          nome_empresa: empresaForm.trim() || null,
        })
        .eq("id", perfil.id);

      if (error) throw error;
      alert(
        isEn
          ? "Billing & IBAN details updated successfully!"
          : "Dados fiscais e IBAN atualizados com sucesso!"
      );
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-black text-xs uppercase tracking-widest text-slate-400 animate-pulse">
        {isEn
          ? "Loading financial data & invoices..."
          : "A carregar dados financeiros, Stripe Connect e faturas..."}
      </div>
    );
  }

  const taxaComissaoGeral = Number(perfil?.taxa_comissao ?? 12);
  const baseIncidenciaGeral = perfil?.base_comissao || "total";

  const reservasPorCampo =
    filtroCampoId === "todos"
      ? reservasFull
      : reservasFull.filter((r: any) => r.campo_id === filtroCampoId);

  const reservasExibidas = reservasPorCampo.filter((r: any) => {
    const st = r.status_pagamento_real;
    if (filtroEstado === "confirmadas") {
      return st === "Pago" || st === "Sinal Pago" || st === "Externo";
    }
    if (filtroEstado === "abandonadas") {
      return (
        st === "Abandonada" ||
        st === "Pendente" ||
        st === "Cancelada" ||
        st === "Reembolsado"
      );
    }
    return true;
  });

  // Cálculos Financeiros Reais sobre Reservas Pagas HelloCamp
  let totalVolume = 0;
  let totalComissoesGeradas = 0;
  let saldoParceiroSeraTransferido = 0;

  reservasPorCampo.forEach((r: any) => {
    const isPagaOnline =
      (r.status_pagamento_real === "Pago" ||
        r.status_pagamento_real === "Sinal Pago") &&
      r.status_pagamento !== "Externo";

    if (isPagaOnline) {
      const valPago = Number(r.valor_pago) || Number(r.valor_total) || 0;
      const taxaAplicada =
        r.campos?.taxa_comissao !== null &&
        r.campos?.taxa_comissao !== undefined
          ? Number(r.campos.taxa_comissao)
          : taxaComissaoGeral;

      const comissao = (valPago * taxaAplicada) / 100;
      totalVolume += valPago;
      totalComissoesGeradas += comissao;
      saldoParceiroSeraTransferido += valPago - comissao;
    }
  });

  const campoSelecionadoObj = camposParceiro.find(
    (c: any) => c.id === filtroCampoId
  );

  return (
    <div className="max-w-6xl mx-auto font-sans text-[#0F172A] pb-20 space-y-8">
      {/* CABEÇALHO */}
      <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="inline-block bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-2">
            {isEn ? "Finance & Stripe Connect" : "Finanças & Stripe Connect"}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#0F172A] m-0 tracking-tight">
            {isEn
              ? "Financial Control, Payouts & Commissions"
              : "Controlo Financeiro, Transferências e Comissões"}
          </h1>
          <p className="text-slate-500 mt-1 mb-0 text-xs md:text-sm font-medium">
            {isEn
              ? "Manage your Stripe Connect account, IBAN, agreed commission rates, and booking statements."
              : "Gira a sua ligação Stripe Connect, IBAN, taxas de comissão contratadas e extrato detalhado de inscrições."}
          </p>
        </div>

        <Link
          href={`/${lang}/admin/contrato`}
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-md no-underline shrink-0 shadow-sm"
        >
          📝 {isEn ? "View Global Contract" : "Ver Contrato Global"}
        </Link>
      </div>

      {/* SECÇÃO 1: STRIPE CONNECT & DADOS BANCÁRIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CARTÃO STRIPE CONNECT */}
        <div className="lg:col-span-5 bg-[#0F172A] text-white p-6 md:p-8 rounded-md border-b-4 border-[#F59E0B] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                Stripe Connect
              </span>
              {perfil?.stripe_account_id ? (
                <span className="bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                  ✓ Conectado
                </span>
              ) : (
                <span className="bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                  ⏳ Pendente
                </span>
              )}
            </div>

            <h2 className="text-xl font-black text-white m-0 mb-2">
              {perfil?.stripe_account_id
                ? isEn
                  ? "Automatic Payouts Active"
                  : "Recebimentos Automáticos Ativos"
                : isEn
                ? "Connect Your Stripe Account"
                : "Ativar Transferências Automáticas Stripe"}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {isEn
                ? "With Stripe Connect, payments made by parents by Card, MB WAY, or Multibanco are automatically split and transferred to your bank account."
                : "Com o Stripe Connect, os pagamentos dos pais por Cartão, MB WAY ou Multibanco são divididos automaticamente e transferidos para a sua conta bancária."}
            </p>
          </div>

          <button
            type="button"
            disabled={connectLoading}
            onClick={handleStripeConnect}
            className="w-full py-3.5 bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest rounded-md cursor-pointer border-0 transition-colors shadow-sm"
          >
            {connectLoading
              ? isEn
                ? "Opening Stripe..."
                : "A abrir Stripe..."
              : perfil?.stripe_account_id
              ? isEn
                ? "⚙️ Open Stripe Dashboard →"
                : "⚙️ Abrir Painel Stripe Connect →"
              : isEn
              ? "🚀 Connect Bank Account via Stripe →"
              : "🚀 Ligar Conta Bancária via Stripe →"}
          </button>
        </div>

        {/* FORMULÁRIO IBAN E DADOS FISCAIS */}
        <form
          onSubmit={handleGuardarDadosFiscais}
          className="lg:col-span-7 bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm flex flex-col justify-between"
        >
          <div>
            <span className="inline-block bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-2">
              {isEn ? "Bank Transfer & Tax ID" : "Dados Fiscais e IBAN Direto"}
            </span>
            <h2 className="text-lg font-black text-[#0F172A] m-0 mb-4">
              {isEn
                ? "IBAN & Billing Entity Details"
                : "Conta IBAN e Identificação de Faturação"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {isEn ? "Legal Entity Name" : "Designação Social da Entidade"}
                </label>
                <input
                  type="text"
                  value={empresaForm}
                  onChange={(e) => setEmpresaForm(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  IBAN Bancário
                </label>
                <input
                  type="text"
                  value={ibanForm}
                  onChange={(e) => setIbanForm(e.target.value)}
                  placeholder="PT50 0000 0000 0000 0000 0000 0"
                  className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-mono font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  NIF / NIPC / Tax ID
                </label>
                <input
                  type="text"
                  value={nifForm}
                  onChange={(e) => setNifForm(e.target.value)}
                  placeholder="500 000 000"
                  className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <span className="text-[11px] font-bold text-slate-500">
              Taxa Base Acordada: <strong>{taxaComissaoGeral}%</strong> (
              {baseIncidenciaGeral === "apenas_programa"
                ? "Apenas Programa"
                : "Total da Reserva"}
              )
            </span>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-md cursor-pointer border-0 shadow-sm"
            >
              {saving
                ? isEn
                  ? "Saving..."
                  : "A guardar..."
                : isEn
                ? "✓ Save Details"
                : "✓ Guardar Dados"}
            </button>
          </div>
        </form>
      </div>

      {/* SECÇÃO 2: KPIs FINANCEIROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-md border border-slate-200 border-b-4 border-b-[#2563EB] shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
            {isEn ? "Gross Volume (Online)" : "Volume Bruto Cobrado (Online)"}
          </span>
          <span className="text-3xl font-black text-[#0F172A] block">
            {totalVolume.toFixed(2)}€
          </span>
          <span className="text-xs font-bold text-slate-500 mt-1 block">
            Total pago pelos encarregados de educação
          </span>
        </div>

        <div className="bg-white p-6 rounded-md border border-slate-200 border-b-4 border-b-[#F59E0B] shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
            {isEn
              ? `HelloCamp Commission (${taxaComissaoGeral}%)`
              : `Comissão HelloCamp (${taxaComissaoGeral}%)`}
          </span>
          <span className="text-3xl font-black text-[#F59E0B] block">
            {totalComissoesGeradas.toFixed(2)}€
          </span>
          <span className="text-xs font-bold text-slate-500 mt-1 block">
            Comissão de intermediação (IVA incluído)
          </span>
        </div>

        <div className="bg-[#0F172A] text-white p-6 rounded-md border-b-4 border-b-[#16A34A] shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block mb-2">
            {isEn ? "Net Partner Payout" : "Receita Líquida a Transferir"}
          </span>
          <span className="text-3xl font-black text-white block">
            {saldoParceiroSeraTransferido.toFixed(2)}€
          </span>
          <span className="text-xs font-bold text-slate-300 mt-1 block">
            Valor líquido para a sua entidade
          </span>
        </div>
      </div>

      {/* SECÇÃO 3: FILTROS E TABELA DE EXTRATO DE TRANSAÇÕES */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-[#F8FAFC] border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                id: "confirmadas",
                label: isEn ? "Confirmed & Paid" : "Pagas / Confirmadas",
                bg: "bg-[#16A34A]",
              },
              {
                id: "abandonadas",
                label: isEn
                  ? "Abandoned / Canceled"
                  : "Abandonadas / Reembolsadas",
                bg: "bg-[#F43F5E]",
              },
              {
                id: "todas",
                label: isEn ? "All Transactions" : "Todo o Histórico",
                bg: "bg-[#2563EB]",
              },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFiltroEstado(t.id as any)}
                className={`px-4 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest cursor-pointer border-0 transition-colors ${
                  filtroEstado === t.id
                    ? `${t.bg} text-white`
                    : "bg-slate-200 text-[#0F172A] hover:bg-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Dropdown Customizado de Campo */}
          <div className="relative w-full md:w-72">
            <div
              onClick={() => setIsCampoDropdownOpen(!isCampoDropdownOpen)}
              className="w-full bg-white border border-slate-300 rounded-md px-4 py-2.5 text-xs font-bold text-[#0F172A] cursor-pointer flex justify-between items-center"
            >
              <span className="truncate">
                {filtroCampoId === "todos"
                  ? isEn
                    ? "All Programs"
                    : "Todos os Campos"
                  : campoSelecionadoObj?.nome || "Campo"}
              </span>
              <span className="text-[10px] text-slate-400 ml-2">▼</span>
            </div>
            {isCampoDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] right-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-30 max-h-60 overflow-y-auto">
                <div
                  onClick={() => {
                    setFiltroCampoId("todos");
                    setIsCampoDropdownOpen(false);
                  }}
                  className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100"
                >
                  {isEn ? "All Programs" : "Todos os Campos"}
                </div>
                {camposParceiro.map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setFiltroCampoId(c.id);
                      setIsCampoDropdownOpen(false);
                    }}
                    className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                  >
                    {c.nome}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Data & Cliente (NIF)
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Campo / Participante
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Estado
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Valor Bruto
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Comissão
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                  Valor Líquido
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {reservasExibidas.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-12 text-center text-slate-400 font-bold"
                  >
                    Nenhum movimento financeiro encontrado neste filtro.
                  </td>
                </tr>
              ) : (
                reservasExibidas.map((r: any) => {
                  const valBruto =
                    Number(r.valor_pago) || Number(r.valor_total) || 0;
                  const taxa =
                    r.campos?.taxa_comissao !== null &&
                    r.campos?.taxa_comissao !== undefined
                      ? Number(r.campos.taxa_comissao)
                      : taxaComissaoGeral;
                  const isExterna = r.status_pagamento_real === "Externo";
                  const comissao = isExterna ? 0 : (valBruto * taxa) / 100;
                  const liquido = valBruto - comissao;

                  return (
                    <tr key={r.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-6 py-4">
                        <div className="font-black text-[#0F172A]">
                          {r.nome_encarregado ||
                            r.perfis?.nome_completo ||
                            "Cliente"}
                        </div>
                        <div className="text-[11px] text-slate-500 font-bold">
                          {new Date(r.created_at).toLocaleDateString("pt-PT")} •
                          NIF:{" "}
                          {r.nif_encarregado ||
                            r.nif_faturacao ||
                            r.perfis?.nif ||
                            "S/ NIF"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-black text-[#2563EB]">
                          {r.campos?.nome || "Campo"}
                        </div>
                        <div className="text-[11px] font-bold text-slate-600">
                          👦{" "}
                          {r.criancas?.nome ||
                            r.respostas_customizadas?.nome_crianca ||
                            "Participante"}{" "}
                          • {r.turno_nome}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-white ${
                            r.status_pagamento_real === "Pago" ||
                            r.status_pagamento_real === "Sinal Pago"
                              ? "bg-[#16A34A]"
                              : r.status_pagamento_real === "Externo"
                              ? "bg-[#2563EB]"
                              : r.status_pagamento_real === "Abandonada"
                              ? "bg-slate-500"
                              : "bg-[#F43F5E]"
                          }`}
                        >
                          {r.status_pagamento_real}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-black text-[#0F172A]">
                        {valBruto.toFixed(2)}€
                      </td>

                      <td className="px-6 py-4 font-bold text-[#F59E0B]">
                        {isExterna
                          ? "0.00€ (Isento)"
                          : `-${comissao.toFixed(2)}€ (${taxa}%)`}
                      </td>

                      <td className="px-6 py-4 text-right font-black text-sm text-[#16A34A]">
                        {liquido.toFixed(2)}€
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
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Variante {
  nome: string;
  preco: number;
  nome_en?: string;
  taxa_comissao?: number | null;
}

interface Pacote {
  id: string;
  titulo: string;
  tipo: "semana" | "dia";
  quantidade: number;
  variantes: Variante[];
  titulo_en?: string;
}

interface OpcaoAlojamento {
  id: string;
  nome: string;
  nome_en?: string;
  preco: number;
  tipo: "semana" | "dia" | "fixo";
  taxa_comissao?: number;
}

interface Desconto {
  id: string;
  nome: string;
  nome_en?: string;
  percentagem: number;
  acumulavel: boolean;
}

const ReservaContext = createContext<any>(null);

export function ReservaProvider({
  children,
  campo,
  lang,
}: {
  children: React.ReactNode;
  campo: any;
  lang: string;
}) {
  const router = useRouter();
  const isEn = lang === "en";

  const contratoData = campo?.contrato_dados || {};
  const modalidadeReserva =
    contratoData.modalidadeReserva || campo?.modalidade_reserva || "direta";
  const isEmailMode = modalidadeReserva === "email";
  const isExternalLinkMode = modalidadeReserva === "link_externo";
  const externalLinkUrl =
    contratoData.linkExternoReserva || campo?.link_externo_reserva || "";

  const pacotes: Pacote[] = Array.isArray(campo.pacotes) ? campo.pacotes : [];
  const opcoesAlojamento: OpcaoAlojamento[] = Array.isArray(
    campo.opcoes_alojamento
  )
    ? campo.opcoes_alojamento
    : [];
  const descontosCampo: Desconto[] = Array.isArray(campo.descontos)
    ? campo.descontos
    : [];

  const calendario = campo.calendario_funcionamento || {
    data_inicio: "",
    data_fim: "",
    dias_semana: [1, 2, 3, 4, 5],
    dias_fechados: [],
  };

  const [pacoteSelecionado, setPacoteSelecionado] = useState<Pacote | null>(
    pacotes[0] || null
  );
  const [varianteSelecionada, setVarianteSelecionada] =
    useState<Variante | null>(pacotes[0]?.variantes?.[0] || null);
  const [alojamentoSelecionado, setAlojamentoSelecionado] =
    useState<OpcaoAlojamento | null>(null);

  const [quantidade, setQuantidade] = useState(1);
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);

  const todayISO = new Date().toISOString().split("T")[0];
  const dataInicialCalendario =
    calendario.data_inicio && calendario.data_inicio > todayISO
      ? new Date(calendario.data_inicio)
      : new Date();

  const [mesAtual, setMesAtual] = useState<Date>(
    new Date(
      dataInicialCalendario.getFullYear(),
      dataInicialCalendario.getMonth(),
      1
    )
  );

  // Extras e Suplementos
  const [extraSeguro, setExtraSeguro] = useState(false);
  const [extraTransporte, setExtraTransporte] = useState(false);

  // Modal de Lead Externa
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({
    nome: "",
    email: "",
    telefone: "",
  });

  // Perguntas de Escolha Múltipla (Suporta PT e EN)
  const rawPerguntas =
    isEn &&
    Array.isArray(campo.perguntas_customizadas_en) &&
    campo.perguntas_customizadas_en.length > 0
      ? campo.perguntas_customizadas_en
      : campo.perguntas_customizadas || [];

  const perguntasParsed = rawPerguntas
    .map((p: string) => {
      if (p.startsWith("ESCOLHA|")) {
        const parts = p.split("|");
        if (parts.length >= 3) {
          return {
            id: p,
            tipo: "escolha",
            titulo: parts[1].trim(),
            opcoes: parts[2]
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean),
          };
        }
      }
      return null;
    })
    .filter(Boolean);

  const [opcoesParticipantes, setOpcoesParticipantes] = useState<
    Record<number, Record<string, string>>
  >({});

  useEffect(() => {
    if (perguntasParsed.length === 0) return;
    setOpcoesParticipantes((prev) => {
      const newOpcoes = { ...prev };
      for (let i = 1; i <= quantidade; i++) {
        if (!newOpcoes[i]) {
          newOpcoes[i] = {};
          perguntasParsed.forEach((p: any) => {
            newOpcoes[i][p.titulo] = p.opcoes[0] || "";
          });
        }
      }
      return newOpcoes;
    });
  }, [quantidade, campo.perguntas_customizadas]);

  const handleOpcaoChange = (
    partIndex: number,
    titulo: string,
    valor: string
  ) => {
    setOpcoesParticipantes((prev) => ({
      ...prev,
      [partIndex]: { ...(prev[partIndex] || {}), [titulo]: valor },
    }));
  };

  // Gerar todas as datas válidas do calendário de funcionamento
  const datasDisponiveis = React.useMemo(() => {
    const inicioStr = calendario.data_inicio || todayISO;
    const fimStr =
      calendario.data_fim ||
      new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0];
    const diasSemanaAtivos = Array.isArray(calendario.dias_semana)
      ? calendario.dias_semana
      : [1, 2, 3, 4, 5];
    const fechados = Array.isArray(calendario.dias_fechados)
      ? calendario.dias_fechados
      : [];

    const lista: string[] = [];
    const cur = new Date(inicioStr);
    const fim = new Date(fimStr);
    if (isNaN(cur.getTime()) || isNaN(fim.getTime())) return lista;

    while (cur <= fim) {
      const iso = cur.toISOString().split("T")[0];
      if (
        iso >= todayISO &&
        diasSemanaAtivos.includes(cur.getDay()) &&
        !fechados.includes(iso)
      ) {
        lista.push(iso);
      }
      cur.setDate(cur.getDate() + 1);
    }
    return lista;
  }, [calendario, todayISO]);

  const trocarPacote = (novoPac: Pacote) => {
    setPacoteSelecionado(novoPac);
    setVarianteSelecionada(novoPac.variantes?.[0] || null);
    setDiasSelecionados([]);
  };

  const quantPacote = pacoteSelecionado?.quantidade || 1;
  const isDiaAvulsoFlexivel =
    pacoteSelecionado?.tipo === "dia" && quantPacote === 1;
  const isPackDiasFixo = pacoteSelecionado?.tipo === "dia" && quantPacote > 1;

  const getSemanasSelecionadas = () => {
    const segundas = new Set<string>();
    diasSelecionados.forEach((d) => {
      const dt = new Date(d);
      const day = dt.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const mon = new Date(dt);
      mon.setDate(dt.getDate() - diff);
      segundas.add(mon.toISOString().split("T")[0]);
    });
    return Array.from(segundas).sort();
  };

  const handleDiaClick = (data: string) => {
    if (!pacoteSelecionado) return;
    if (data < todayISO) return;
    if (!datasDisponiveis.includes(data)) return;

    if (pacoteSelecionado.tipo === "dia") {
      if (diasSelecionados.includes(data)) {
        setDiasSelecionados((prev) => prev.filter((d) => d !== data));
      } else {
        if (isPackDiasFixo && diasSelecionados.length >= quantPacote) return;
        setDiasSelecionados((prev) => [...prev, data].sort());
      }
    } else {
      const limiteSemanas = pacoteSelecionado.quantidade || 1;
      const semanasAtuais = getSemanasSelecionadas();

      const dateObj = new Date(data);
      const dayOfWeek = dateObj.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startMonday = new Date(dateObj);
      startMonday.setDate(dateObj.getDate() - diffToMonday);

      const startMondayStr = startMonday.toISOString().split("T")[0];
      const endSunday = new Date(startMonday);
      endSunday.setDate(startMonday.getDate() + 6);

      const diasDestaSemana = datasDisponiveis.filter((d) => {
        const dDate = new Date(d);
        return dDate >= startMonday && dDate <= endSunday;
      });

      if (diasDestaSemana.length === 0) return;

      if (semanasAtuais.includes(startMondayStr)) {
        setDiasSelecionados((prev) =>
          prev.filter((d) => !diasDestaSemana.includes(d))
        );
      } else {
        if (semanasAtuais.length >= limiteSemanas) return;
        setDiasSelecionados((prev) =>
          Array.from(new Set([...prev, ...diasDestaSemana])).sort()
        );
      }
    }
  };

  const nextMonth = () =>
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
  const prevMonth = () =>
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));

  const gerarGrelhaMes = () => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const offset = primeiroDia === 0 ? 6 : primeiroDia - 1;
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    const celulas: {
      vazio?: boolean;
      dia?: number;
      iso?: string;
      disponivel?: boolean;
      selecionado?: boolean;
    }[] = [];

    for (let i = 0; i < offset; i++) {
      celulas.push({ vazio: true });
    }
    for (let d = 1; d <= diasNoMes; d++) {
      const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
      celulas.push({
        dia: d,
        iso,
        disponivel: datasDisponiveis.includes(iso),
        selecionado: diasSelecionados.includes(iso),
      });
    }
    return celulas;
  };

  // =========================================================================
  // MATEMÁTICA COMPLETA DE PREÇOS, ALOJAMENTO, SUPLEMENTOS, TAXAS E DESCONTOS
  // =========================================================================
  const precoBase =
    Number(varianteSelecionada?.preco) || Number(campo.preco) || 0;
  const multiplicadorPrecoBase = isDiaAvulsoFlexivel
    ? Math.max(1, diasSelecionados.length)
    : 1;
  const totalUnidadesTempo = isDiaAvulsoFlexivel
    ? Math.max(1, diasSelecionados.length)
    : quantPacote;

  // 1. Custo de Alojamento Extra (por participante)
  let custoAlojamentoUnit = 0;
  if (alojamentoSelecionado) {
    const pAloj = Number(alojamentoSelecionado.preco) || 0;
    if (alojamentoSelecionado.tipo === "fixo") {
      custoAlojamentoUnit = pAloj;
    } else {
      custoAlojamentoUnit = pAloj * totalUnidadesTempo;
    }
  }

  // 2. Custo Seguro e Transporte (por participante)
  const valSeguro = Number(campo.extra_seguro) || 0;
  const custoSeguroUnit = extraSeguro
    ? campo.tipo_extra_seguro === "diario"
      ? valSeguro * totalUnidadesTempo
      : valSeguro
    : 0;

  const valTransporte = Number(campo.extra_transporte) || 0;
  const custoTransporteUnit = extraTransporte
    ? campo.tipo_extra_transporte === "diario"
      ? valTransporte * totalUnidadesTempo
      : valTransporte
    : 0;

  // 3. Taxas Fixas (Matrícula e Material por participante)
  const taxaMatriculaUnit = Number(campo.taxa_matricula) || 0;
  const taxaMaterialUnit = Number(campo.taxa_material) || 0;

  // 4. Descontos Automáticos (ex: Irmãos quando quantidade > 1)
  let percentagemDescontoAplicada = 0;
  let nomeDescontoAplicado = "";
  if (descontosCampo.length > 0 && quantidade > 1) {
    const descIrmaos = descontosCampo[0];
    if (descIrmaos && Number(descIrmaos.percentagem) > 0) {
      percentagemDescontoAplicada = Number(descIrmaos.percentagem);
      nomeDescontoAplicado =
        isEn && descIrmaos.nome_en ? descIrmaos.nome_en : descIrmaos.nome;
    }
  }

  const subtotalPrograma = precoBase * multiplicadorPrecoBase * quantidade;
  const valorDesconto =
    percentagemDescontoAplicada > 0
      ? subtotalPrograma * (percentagemDescontoAplicada / 100)
      : 0;

  const totalExtrasPorCrianca =
    custoAlojamentoUnit +
    custoSeguroUnit +
    custoTransporteUnit +
    taxaMatriculaUnit +
    taxaMaterialUnit;

  const precoTotal = Math.max(
    0,
    subtotalPrograma - valorDesconto + totalExtrasPorCrianca * quantidade
  );

  // Validação de Datas Completas
  const SemanasCount = getSemanasSelecionadas().length;
  const escolhasCompletas =
    datasDisponiveis.length === 0
      ? true
      : pacoteSelecionado?.tipo === "dia"
      ? isDiaAvulsoFlexivel
        ? diasSelecionados.length >= 1
        : diasSelecionados.length === quantPacote
      : SemanasCount === quantPacote;

  const vagasTotais = campo.vagas_totais;
  const isEsgotado = vagasTotais !== null && Number(vagasTotais) <= 0;
  const disabledReserva =
    !pacoteSelecionado ||
    !varianteSelecionada ||
    precoBase === 0 ||
    isEsgotado ||
    !escolhasCompletas;

  const tituloPacoteLocal =
    isEn && pacoteSelecionado?.titulo_en
      ? pacoteSelecionado.titulo_en
      : pacoteSelecionado?.titulo;
  const nomeVarLocal =
    isEn && varianteSelecionada?.nome_en
      ? varianteSelecionada.nome_en
      : varianteSelecionada?.nome;
  const nomeProgramaCompleto = `${tituloPacoteLocal || ""} ${
    (pacoteSelecionado?.variantes?.length || 0) > 1 && varianteSelecionada
      ? `(${nomeVarLocal})`
      : ""
  }`.trim();

  const handleReservar = () => {
    if (disabledReserva) return;

    if (isExternalLinkMode) {
      if (!externalLinkUrl) {
        alert(
          isEn
            ? "External link not configured."
            : "O organizador ainda não configurou o link externo."
        );
        return;
      }
      setShowLeadModal(true);
      return;
    }

    const params = new URLSearchParams();
    params.set("quantidade_criancas", quantidade.toString());
    params.set(
      "turno",
      JSON.stringify({
        id: pacoteSelecionado?.id,
        nome: nomeProgramaCompleto,
        dias_soltos: diasSelecionados,
        data_inicio:
          diasSelecionados[0] || calendario.data_inicio || todayISO,
        preco: varianteSelecionada?.preco,
        tipo: pacoteSelecionado?.tipo,
        quantidade: totalUnidadesTempo,
        multiplicador: multiplicadorPrecoBase,
      })
    );

    if (alojamentoSelecionado) {
      params.set(
        "alojamento",
        JSON.stringify({
          id: alojamentoSelecionado.id,
          nome:
            isEn && alojamentoSelecionado.nome_en
              ? alojamentoSelecionado.nome_en
              : alojamentoSelecionado.nome,
          custoUnit: custoAlojamentoUnit,
        })
      );
    }

    if (extraSeguro) params.set("ext_seguro", "true");
    if (extraTransporte) params.set("ext_transporte", "true");
    if (valorDesconto > 0) {
      params.set("desconto_valor", valorDesconto.toFixed(2));
      params.set("desconto_nome", nomeDescontoAplicado);
    }
    if (isEmailMode) params.set("modo", "email");

    if (perguntasParsed.length > 0) {
      params.set("opcoes_participantes", JSON.stringify(opcoesParticipantes));
    }

    router.push(`/${lang}/checkout/${campo.id}?${params.toString()}`);
  };

  const submitExternalLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !leadForm.nome ||
      !leadForm.email ||
      !leadForm.telefone ||
      !externalLinkUrl
    )
      return;

    setSubmittingLead(true);
    let newWindow: Window | null = null;
    try {
      newWindow = window.open("about:blank", "_blank");
    } catch {}

    try {
      await supabase.from("leads_externas").insert([
        {
          campo_id: campo.id,
          organizador_id: campo.organizador_id,
          nome_cliente: leadForm.nome,
          email_cliente: leadForm.email,
          telefone_cliente: leadForm.telefone,
          turno_interesse: nomeProgramaCompleto,
          preco_estimado: precoTotal,
        },
      ]);

      fetch("/api/notificar-reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: leadForm,
          campoNome: campo.nome,
          parceiroEmail: contratoData.emailReservas || "info@hellocamp.pt",
          lang,
        }),
      }).catch(() => {});

      if (newWindow) newWindow.location.href = externalLinkUrl;
      else window.location.href = externalLinkUrl;
      setShowLeadModal(false);
    } catch {
      if (newWindow) newWindow.close();
      window.location.href = externalLinkUrl;
      setShowLeadModal(false);
    } finally {
      setSubmittingLead(false);
    }
  };

  return (
    <ReservaContext.Provider
      value={{
        isEn,
        campo,
        pacotes,
        pacoteSelecionado,
        setPacoteSelecionado: trocarPacote,
        varianteSelecionada,
        setVarianteSelecionada,
        opcoesAlojamento,
        alojamentoSelecionado,
        setAlojamentoSelecionado,
        custoAlojamentoUnit,
        quantidade,
        setQuantidade,
        diasSelecionados,
        setDiasSelecionados,
        mesAtual,
        nextMonth,
        prevMonth,
        handleDiaClick,
        extraSeguro,
        setExtraSeguro,
        valSeguro,
        custoSeguro: custoSeguroUnit * quantidade,
        extraTransporte,
        setExtraTransporte,
        valTransporte,
        custoTransporte: custoTransporteUnit * quantidade,
        taxaMatriculaTotal: taxaMatriculaUnit * quantidade,
        taxaMaterialTotal: taxaMaterialUnit * quantidade,
        valorDesconto,
        nomeDescontoAplicado,
        precoTotal,
        precoBase,
        isEsgotado,
        disabledReserva,
        handleReservar,
        isEmailMode,
        isExternalLinkMode,
        externalLinkUrl,
        getSemanasSelecionadas,
        grelhaDias: gerarGrelhaMes(),
        nomesDiasCurto: isEn
          ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          : ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
        escolhasCompletas,
        showLeadModal,
        setShowLeadModal,
        leadForm,
        setLeadForm,
        submitExternalLead,
        submittingLead,
        isDiaAvulsoFlexivel,
        multiplicadorPrecoBase,
        isPackDiasFixo,
        quantPacote,
        nomeProgramaCompleto,
        perguntasParsed,
        opcoesParticipantes,
        handleOpcaoChange,
      }}
    >
      {children}
    </ReservaContext.Provider>
  );
}

// =========================================================================
// COMPONENTE: ZONA INTERATIVA DE SELEÇÃO DE PREÇOS, DATAS E OPÇÕES
// =========================================================================
export function SeletorOpcoes() {
  const ctx = useContext(ReservaContext);
  const [openCustomDropdown, setOpenCustomDropdown] = useState<string | null>(
    null
  );

  if (!ctx || ctx.pacotes.length === 0) return null;

  const escolhasFeitas =
    ctx.pacoteSelecionado?.tipo === "dia"
      ? ctx.diasSelecionados.length
      : ctx.getSemanasSelecionadas().length;

  const mesesNomes = ctx.isEn
    ? [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ]
    : [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];

  return (
    <div
      className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 relative z-20 space-y-8"
      id="reserva"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <h2 className="text-2xl font-black text-slate-900 m-0 tracking-tight">
          {ctx.isEn ? "Configure your Booking" : "Configurar Inscrição e Preços"}
        </h2>

        {/* QUANTIDADE DE PARTICIPANTES */}
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            👦 {ctx.isEn ? "Children:" : "Participantes:"}
          </span>
          <button
            type="button"
            onClick={() => ctx.setQuantidade(Math.max(1, ctx.quantidade - 1))}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-black text-slate-700 cursor-pointer"
          >
            -
          </button>
          <span className="font-black text-sm text-[#0E3A68] w-4 text-center">
            {ctx.quantidade}
          </span>
          <button
            type="button"
            onClick={() => ctx.setQuantidade(ctx.quantidade + 1)}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-black text-slate-700 cursor-pointer"
          >
            +
          </button>
        </div>
      </div>

      {/* 1. ESCOLHA DO PACOTE DE DURAÇÃO */}
      <div>
        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
          1. {ctx.isEn ? "Select Package / Duration" : "Escolha a Modalidade / Duração"}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ctx.pacotes.map((pac: Pacote) => {
            const isSel = ctx.pacoteSelecionado?.id === pac.id;
            const titulo =
              ctx.isEn && pac.titulo_en ? pac.titulo_en : pac.titulo;
            const precoMinPac = Math.min(
              ...pac.variantes.map((v) => Number(v.preco) || 0)
            );
            return (
              <button
                key={pac.id}
                type="button"
                onClick={() => ctx.setPacoteSelecionado(pac)}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSel
                    ? "border-[#0E3A68] bg-blue-50/40 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div>
                  <span className="block text-sm font-black text-slate-900">
                    {titulo}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {pac.tipo === "semana"
                      ? `${pac.quantidade} ${
                          ctx.isEn ? "Week(s)" : "Semana(s)"
                        }`
                      : `${pac.quantidade} ${ctx.isEn ? "Day(s)" : "Dia(s)"}`}
                  </span>
                </div>
                <span className="text-lg font-black text-[#0E3A68]">
                  {precoMinPac}€
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ESCOLHA DA OPÇÃO DE PREÇO (VARIANTES DO PACOTE) */}
      {ctx.pacoteSelecionado &&
        ctx.pacoteSelecionado.variantes &&
        ctx.pacoteSelecionado.variantes.length > 1 && (
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
              2. {ctx.isEn ? "Select Price Option" : "Escolha a Opção de Preço"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ctx.pacoteSelecionado.variantes.map(
                (v: Variante, idx: number) => {
                  const isVarSel = ctx.varianteSelecionada?.nome === v.nome;
                  const nomeV = ctx.isEn && v.nome_en ? v.nome_en : v.nome;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => ctx.setVarianteSelecionada(v)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer flex items-center justify-between ${
                        isVarSel
                          ? "border-[#167524] bg-emerald-50/50 font-black"
                          : "border-slate-200 bg-slate-50 hover:bg-white font-bold"
                      }`}
                    >
                      <span className="text-xs text-slate-800">{nomeV}</span>
                      <span className="text-sm font-black text-[#167524]">
                        {v.preco}€
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

      {/* 3. CALENDÁRIO INTERATIVO DE SELEÇÃO DE SEMANAS / DIAS */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            📅{" "}
            {ctx.isEn
              ? "Select Your Dates on the Calendar"
              : "Selecione os Dias / Semanas no Calendário"}
          </label>
          <span
            className={`text-xs font-black px-3 py-1 rounded-lg ${
              ctx.escolhasCompletas
                ? "bg-emerald-50 text-[#167524] border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {ctx.escolhasCompletas
              ? ctx.isEn
                ? "✓ Dates Selected"
                : "✓ Datas Selecionadas"
              : ctx.isEn
              ? `Select ${ctx.quantPacote - escolhasFeitas} more`
              : `Selecione ${ctx.quantPacote - escolhasFeitas} ${
                  ctx.pacoteSelecionado?.tipo === "semana"
                    ? "semana(s)"
                    : "dia(s)"
                }`}
          </span>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={ctx.prevMonth}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-black text-slate-700 cursor-pointer hover:bg-slate-100"
            >
              &larr;
            </button>
            <span className="text-sm font-black uppercase tracking-widest text-slate-900">
              {mesesNomes[ctx.mesAtual.getMonth()]}{" "}
              {ctx.mesAtual.getFullYear()}
            </span>
            <button
              type="button"
              onClick={ctx.nextMonth}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-black text-slate-700 cursor-pointer hover:bg-slate-100"
            >
              &rarr;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
            {ctx.nomesDiasCurto.map((d: string) => (
              <span
                key={d}
                className="text-[10px] font-black uppercase text-slate-400"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {ctx.grelhaDias.map((cel: any, i: number) => {
              if (cel.vazio) return <div key={`v-${i}`} className="h-10" />;
              return (
                <button
                  key={cel.iso}
                  type="button"
                  disabled={!cel.disponivel}
                  onClick={() => ctx.handleDiaClick(cel.iso)}
                  className={`h-10 rounded-xl text-xs font-black transition-all ${
                    cel.selecionado
                      ? "bg-[#0E3A68] text-white shadow-md scale-105 cursor-pointer"
                      : cel.disponivel
                      ? "bg-white border border-slate-200 text-slate-800 hover:border-[#0E3A68] cursor-pointer"
                      : "bg-slate-100 text-slate-300 cursor-not-allowed line-through"
                  }`}
                >
                  {cel.dia}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. OPÇÕES DE ALOJAMENTO EXTRA (SE CONFIGURADAS PELO PARCEIRO) */}
      {ctx.opcoesAlojamento && ctx.opcoesAlojamento.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
            🛏️{" "}
            {ctx.isEn
              ? "Accommodation Option (Optional)"
              : "Opção de Alojamento (Opcional)"}
          </label>
          <div className="space-y-2.5">
            <label
              onClick={() => ctx.setAlojamentoSelecionado(null)}
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer ${
                !ctx.alojamentoSelecionado
                  ? "border-[#0E3A68] bg-blue-50/30 font-black"
                  : "border-slate-200 bg-slate-50 font-bold"
              }`}
            >
              <span className="text-xs text-slate-800">
                {ctx.isEn
                  ? "Day Camp Only (No extra accommodation)"
                  : "Sem alojamento extra (Regime Base)"}
              </span>
              <span className="text-xs text-slate-500">0€</span>
            </label>

            {ctx.opcoesAlojamento.map((aloj: OpcaoAlojamento) => {
              const isAlojSel = ctx.alojamentoSelecionado?.id === aloj.id;
              const nomeAloj =
                ctx.isEn && aloj.nome_en ? aloj.nome_en : aloj.nome;
              return (
                <label
                  key={aloj.id}
                  onClick={() => ctx.setAlojamentoSelecionado(aloj)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer ${
                    isAlojSel
                      ? "border-[#0E3A68] bg-blue-50/40 font-black"
                      : "border-slate-200 bg-white font-bold"
                  }`}
                >
                  <span className="text-xs text-slate-900">{nomeAloj}</span>
                  <span className="text-xs font-black text-[#0E3A68]">
                    +{aloj.preco}€ /{" "}
                    {aloj.tipo === "semana"
                      ? ctx.isEn
                        ? "week"
                        : "semana"
                      : aloj.tipo === "dia"
                      ? ctx.isEn
                        ? "night"
                        : "noite"
                      : "fixo"}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. PERGUNTAS DE ESCOLHA MÚLTIPLA CUSTOMIZADAS PELO PARCEIRO (COM DROPDOWNS CUSTOMIZADOS!) */}
      {ctx.perguntasParsed && ctx.perguntasParsed.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-5">
          <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">
            📋{" "}
            {ctx.isEn
              ? "Participant Preferences"
              : "Opções por Participante"}
          </label>
          {Array.from({ length: ctx.quantidade }).map((_, idx) => {
            const pNum = idx + 1;
            return (
              <div
                key={pNum}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3"
              >
                <span className="block text-xs font-black text-[#0E3A68]">
                  👦 {ctx.isEn ? `Participant ${pNum}` : `Participante ${pNum}`}
                </span>
                {ctx.perguntasParsed.map((perg: any, pIdx: number) => {
                  const valorAtual =
                    ctx.opcoesParticipantes[pNum]?.[perg.titulo] ||
                    perg.opcoes[0];
                  const dropKey = `p_${pNum}_${pIdx}`;
                  return (
                    <div key={pIdx} className="relative">
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                        {perg.titulo}
                      </label>
                      <div
                        onClick={() =>
                          setOpenCustomDropdown(
                            openCustomDropdown === dropKey ? null : dropKey
                          )
                        }
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 cursor-pointer flex justify-between items-center"
                      >
                        <span>{valorAtual}</span>
                        <span className="text-[10px] text-slate-400">▼</span>
                      </div>
                      {openCustomDropdown === dropKey && (
                        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                          {perg.opcoes.map((op: string) => (
                            <div
                              key={op}
                              onClick={() => {
                                ctx.handleOpcaoChange(pNum, perg.titulo, op);
                                setOpenCustomDropdown(null);
                              }}
                              className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"
                            >
                              {op}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* 6. SUPLEMENTOS OPCIONAIS (SEGURO E TRANSPORTE) */}
      {(ctx.valSeguro > 0 || ctx.valTransporte > 0) && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">
            ➕ {ctx.isEn ? "Optional Supplements" : "Suplementos Opcionais"}
          </label>
          {ctx.valSeguro > 0 && (
            <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={ctx.extraSeguro}
                  onChange={(e) => ctx.setExtraSeguro(e.target.checked)}
                  className="w-4 h-4 accent-[#0E3A68]"
                />
                <span className="text-xs font-black text-slate-800">
                  🛡️ {ctx.isEn ? "Extra Insurance" : "Seguro Opcional"}
                </span>
              </div>
              <span className="text-xs font-black text-[#0E3A68]">
                +{ctx.valSeguro}€
              </span>
            </label>
          )}
          {ctx.valTransporte > 0 && (
            <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={ctx.extraTransporte}
                  onChange={(e) => ctx.setExtraTransporte(e.target.checked)}
                  className="w-4 h-4 accent-[#0E3A68]"
                />
                <span className="text-xs font-black text-slate-800">
                  🚌 {ctx.isEn ? "Transport / Transfer" : "Transporte / Transfer"}
                </span>
              </div>
              <span className="text-xs font-black text-[#0E3A68]">
                +{ctx.valTransporte}€
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// COMPONENTE: CAIXA DE RESUMO LATERAL (STICKY)
// =========================================================================
export function CaixaResumo() {
  const ctx = useContext(ReservaContext);
  if (!ctx) return null;

  let textoBotao = ctx.isEn ? "Book & Pay Now" : "Reservar Vaga Agora";
  if (ctx.isEmailMode)
    textoBotao = ctx.isEn ? "Request Booking" : "Pedir Reserva ao Campo";
  if (ctx.isExternalLinkMode)
    textoBotao = ctx.isEn
      ? "Go to Official Form ↗"
      : "Ir para Formulário Oficial ↗";

  const baseCalculado =
    ctx.precoBase *
    (ctx.diasSelecionados.length === 0 ? 1 : ctx.multiplicadorPrecoBase) *
    ctx.quantidade;

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-lg border border-slate-200">
      <div className="flex items-baseline justify-between border-b border-slate-100 pb-5 mb-5">
        <div>
          <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
            {ctx.isEn ? "Total Price" : "Valor Total"}
          </span>
          <span className="text-3xl font-black text-[#0E3A68]">
            {ctx.precoTotal.toFixed(2)}€
          </span>
        </div>
        <span className="text-xs font-bold text-slate-500">
          {ctx.quantidade}{" "}
          {ctx.quantidade === 1
            ? ctx.isEn
              ? "child"
              : "participante"
            : ctx.isEn
            ? "children"
            : "participantes"}
        </span>
      </div>

      <div className="space-y-3 text-xs mb-6">
        <div className="flex justify-between font-bold text-slate-700">
          <span>{ctx.nomeProgramaCompleto}</span>
          <span>{baseCalculado.toFixed(2)}€</span>
        </div>

        {ctx.alojamentoSelecionado && (
          <div className="flex justify-between font-bold text-slate-600">
            <span>🛏️ {ctx.alojamentoSelecionado.nome}</span>
            <span>
              +{(ctx.custoAlojamentoUnit * ctx.quantidade).toFixed(2)}€
            </span>
          </div>
        )}

        {ctx.extraSeguro && (
          <div className="flex justify-between font-bold text-slate-600">
            <span>🛡️ Seguro</span>
            <span>+{ctx.custoSeguro.toFixed(2)}€</span>
          </div>
        )}

        {ctx.extraTransporte && (
          <div className="flex justify-between font-bold text-slate-600">
            <span>🚌 Transporte</span>
            <span>+{ctx.custoTransporte.toFixed(2)}€</span>
          </div>
        )}

        {ctx.taxaMatriculaTotal > 0 && (
          <div className="flex justify-between font-bold text-slate-600">
            <span>📝 Taxa de Matrícula</span>
            <span>+{ctx.taxaMatriculaTotal.toFixed(2)}€</span>
          </div>
        )}

        {ctx.taxaMaterialTotal > 0 && (
          <div className="flex justify-between font-bold text-slate-600">
            <span>🎒 Taxa de Material</span>
            <span>+{ctx.taxaMaterialTotal.toFixed(2)}€</span>
          </div>
        )}

        {ctx.valorDesconto > 0 && (
          <div className="flex justify-between font-black text-[#167524] bg-emerald-50 p-2.5 rounded-xl">
            <span>✨ {ctx.nomeDescontoAplicado || "Desconto"}</span>
            <span>-{ctx.valorDesconto.toFixed(2)}€</span>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={ctx.disabledReserva}
        onClick={ctx.handleReservar}
        className="w-full py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs bg-[#e2a41d] hover:bg-[#d4991b] disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 shadow-md cursor-pointer transition-all"
      >
        {ctx.isEsgotado
          ? ctx.isEn
            ? "Sold Out"
            : "Esgotado"
          : !ctx.escolhasCompletas
          ? ctx.isEn
            ? "Select Dates on Calendar"
            : "Selecione as Datas no Calendário"
          : textoBotao}
      </button>

      {/* MODAL PARA CAMPOS DE LINK EXTERNO */}
      {ctx.showLeadModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => ctx.setShowLeadModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-slate-900 m-0 mb-2">
              {ctx.isEn
                ? "Continue to Official Registration"
                : "Avançar para o Formulário Oficial"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {ctx.isEn
                ? "Enter your contact details to be redirected to the organizer's official form."
                : "Indique os seus dados de contacto para ser reencaminhado imediatamente para o formulário oficial do organizador."}
            </p>
            <form onSubmit={ctx.submitExternalLead} className="space-y-4">
              <input
                type="text"
                required
                placeholder={ctx.isEn ? "Parent Full Name *" : "O seu Nome *"}
                value={ctx.leadForm.nome}
                onChange={(e) =>
                  ctx.setLeadForm({ ...ctx.leadForm, nome: e.target.value })
                }
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              />
              <input
                type="email"
                required
                placeholder="E-mail *"
                value={ctx.leadForm.email}
                onChange={(e) =>
                  ctx.setLeadForm({ ...ctx.leadForm, email: e.target.value })
                }
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              />
              <input
                type="tel"
                required
                placeholder={ctx.isEn ? "Phone *" : "Telemóvel *"}
                value={ctx.leadForm.telefone}
                onChange={(e) =>
                  ctx.setLeadForm({ ...ctx.leadForm, telefone: e.target.value })
                }
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              />
              <button
                type="submit"
                disabled={ctx.submittingLead}
                className="w-full py-4 bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs rounded-xl cursor-pointer"
              >
                {ctx.submittingLead
                  ? "..."
                  : ctx.isEn
                  ? "Open External Form ↗"
                  : "Abrir Formulário Oficial ↗"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
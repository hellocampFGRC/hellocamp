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
  dias_equivalentes?: number;
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
  percentagem?: number;
  preco_por_dia?: number;
  acumulavel?: boolean;
  ativo?: boolean;
  min_criancas?: number;
  min_dias?: number;
  data_inicio?: string;
  data_fim?: string;
}

const ReservaContext = createContext<any>(null);

// Helpers seguros contra desvios de fuso horário
function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

function formatDateIso(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMondayIso(iso: string): string {
  const dt = parseIsoLocal(iso);
  const day = dt.getDay();
  const diff = day === 0 ? 6 : day - 1;
  dt.setDate(dt.getDate() - diff);
  return formatDateIso(dt);
}

function formatShortDate(iso: string, isEn: boolean): string {
  const dt = parseIsoLocal(iso);
  const meses = isEn
    ? [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ]
    : [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez",
      ];
  return `${dt.getDate()} ${meses[dt.getMonth()]}`;
}

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

  const todayISO = formatDateIso(new Date());
  const dataInicialCalendario =
    calendario.data_inicio && calendario.data_inicio > todayISO
      ? parseIsoLocal(calendario.data_inicio)
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
      formatDateIso(new Date(Date.now() + 180 * 86400000));
    const diasSemanaAtivos = Array.isArray(calendario.dias_semana)
      ? calendario.dias_semana
      : [1, 2, 3, 4, 5];
    const fechados = Array.isArray(calendario.dias_fechados)
      ? calendario.dias_fechados
      : [];

    const lista: string[] = [];
    const cur = parseIsoLocal(inicioStr);
    const fim = parseIsoLocal(fimStr);
    if (isNaN(cur.getTime()) || isNaN(fim.getTime())) return lista;

    while (cur <= fim) {
      const iso = formatDateIso(cur);
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

  // Agrupar datas disponíveis por semana (segunda-feira -> dias úteis dessa semana)
  const semanasDisponiveisMap = React.useMemo(() => {
    const mapa = new Map<string, string[]>();
    datasDisponiveis.forEach((iso) => {
      const mon = getMondayIso(iso);
      if (!mapa.has(mon)) mapa.set(mon, []);
      mapa.get(mon)!.push(iso);
    });
    return mapa;
  }, [datasDisponiveis]);

  const totalSemanasDisponiveis = semanasDisponiveisMap.size;

  const isModoSemana = pacoteSelecionado?.tipo === "semana";

  // Deteta se alguma variante legada tem "Pack X Dias" no nome (só aplicável a tipo === "dia")
  const matchPackVariante = !isModoSemana
    ? (varianteSelecionada?.nome || "").match(/\b(?:pack\s+)?([2-9])\s+dias?\b/i)
    : null;
  const diasDaVarianteFixa = matchPackVariante
    ? parseInt(matchPackVariante[1], 10)
    : null;

  const quantPacote =
    !isModoSemana && diasDaVarianteFixa
      ? diasDaVarianteFixa
      : pacoteSelecionado?.quantidade || 1;

  const isDiaAvulsoFlexivel = !isModoSemana && quantPacote === 1;
  const isPackDiasFixo = !isModoSemana && quantPacote > 1;

  const calcularSelecaoInicial = (pac: Pacote | null): string[] => {
    if (!pac || datasDisponiveis.length === 0) return [];
    if (
      pac.tipo === "semana" &&
      totalSemanasDisponiveis > 0 &&
      (pac.quantidade || 1) >= totalSemanasDisponiveis
    ) {
      return [...datasDisponiveis];
    }
    return [];
  };

  useEffect(() => {
    if (
      pacoteSelecionado?.tipo === "semana" &&
      totalSemanasDisponiveis > 0 &&
      (pacoteSelecionado.quantidade || 1) >= totalSemanasDisponiveis &&
      diasSelecionados.length === 0
    ) {
      setDiasSelecionados([...datasDisponiveis]);
    }
  }, [pacoteSelecionado, totalSemanasDisponiveis, datasDisponiveis]);

  const trocarPacote = (novoPac: Pacote) => {
    setPacoteSelecionado(novoPac);
    setVarianteSelecionada(novoPac.variantes?.[0] || null);
    setDiasSelecionados(calcularSelecaoInicial(novoPac));
  };

  const trocarVariante = (novaVar: Variante) => {
    setVarianteSelecionada(novaVar);
    if (pacoteSelecionado?.tipo === "dia") {
      setDiasSelecionados([]);
    }
  };

  const getSemanasSelecionadas = () => {
    const segundas = new Set<string>();
    diasSelecionados.forEach((d) => {
      segundas.add(getMondayIso(d));
    });
    return Array.from(segundas).sort();
  };

  // Resumo legível das semanas ou dias selecionados para mostrar na CaixaResumo
  const resumoDatasSelecionadas = React.useMemo(() => {
    if (diasSelecionados.length === 0) return [];
    const sorted = [...diasSelecionados].sort();

    if (isModoSemana) {
      const porSemana = new Map<string, string[]>();
      sorted.forEach((iso) => {
        const mon = getMondayIso(iso);
        if (!porSemana.has(mon)) porSemana.set(mon, []);
        porSemana.get(mon)!.push(iso);
      });

      return Array.from(porSemana.values()).map((dias) => {
        const inicio = formatShortDate(dias[0], isEn);
        const fim = formatShortDate(dias[dias.length - 1], isEn);
        const labelIntervalo =
          dias.length > 1 ? `${inicio} – ${fim}` : inicio;
        return `${labelIntervalo} (${dias.length} ${
          isEn
            ? dias.length === 1
              ? "day"
              : "days"
            : dias.length === 1
            ? "dia"
            : "dias"
        })`;
      });
    }

    return sorted.map((iso) => formatShortDate(iso, isEn));
  }, [diasSelecionados, isModoSemana, isEn]);

  const handleDiaClick = (data: string) => {
    if (!pacoteSelecionado) return;
    if (data < todayISO) return;
    if (!datasDisponiveis.includes(data)) return;

    const startMondayStr = getMondayIso(data);
    const diasDestaSemana = semanasDisponiveisMap.get(startMondayStr) || [];

    if (!isModoSemana) {
      if (isPackDiasFixo && diasDestaSemana.length === quantPacote) {
        const semanaJaSelecionada = diasDestaSemana.every((d) =>
          diasSelecionados.includes(d)
        );
        if (semanaJaSelecionada) setDiasSelecionados([]);
        else setDiasSelecionados([...diasDestaSemana].sort());
        return;
      }

      if (diasSelecionados.includes(data)) {
        setDiasSelecionados((prev) => prev.filter((d) => d !== data));
      } else {
        if (isPackDiasFixo && diasSelecionados.length >= quantPacote) return;
        setDiasSelecionados((prev) => [...prev, data].sort());
      }
    } else {
      const limiteSemanas = Math.min(
        pacoteSelecionado.quantidade || 1,
        totalSemanasDisponiveis || pacoteSelecionado.quantidade || 1
      );
      const semanasAtuais = getSemanasSelecionadas();
      if (diasDestaSemana.length === 0) return;

      if (semanasAtuais.includes(startMondayStr)) {
        // Desseleciona a semana clicada
        setDiasSelecionados((prev) =>
          prev.filter((d) => !diasDestaSemana.includes(d))
        );
      } else if (limiteSemanas === 1) {
        // Pack 1 semana: substitui diretamente pela nova semana
        setDiasSelecionados([...diasDestaSemana].sort());
      } else if (semanasAtuais.length < limiteSemanas) {
        // Ainda faltam semanas: adiciona a semana clicada
        setDiasSelecionados((prev) =>
          Array.from(new Set([...prev, ...diasDestaSemana])).sort()
        );
      } else {
        // Já atingiu o limite (ex: 2 semanas): substitui a semana mais antiga pela nova
        const semanaARemover = semanasAtuais[0];
        const diasARemover = semanasDisponiveisMap.get(semanaARemover) || [];
        setDiasSelecionados((prev) =>
          Array.from(
            new Set([
              ...prev.filter((d) => !diasARemover.includes(d)),
              ...diasDestaSemana,
            ])
          ).sort()
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

    for (let i = 0; i < offset; i++) celulas.push({ vazio: true });
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
  // MOTOR AUTOMÁTICO DE PREÇOS (SEMANAS NUNCA DUPLICAM O PREÇO DO PACK!)
  // =========================================================================
  const precoBase =
    varianteSelecionada?.preco !== undefined &&
    varianteSelecionada?.preco !== null
      ? Number(varianteSelecionada.preco)
      : Number(campo.preco) || 0;

  // Para qualquer pack semanal (1, 2 ou 3 semanas), o preço da variante já é o preço TOTAL do pack -> multiplicador é SEMPRE 1
  const multiplicadorPrecoBase = isModoSemana
    ? 1
    : isDiaAvulsoFlexivel
    ? Math.max(1, diasSelecionados.length)
    : 1;

  const totalUnidadesTempo = isModoSemana
    ? quantPacote
    : isDiaAvulsoFlexivel
    ? Math.max(1, diasSelecionados.length)
    : quantPacote;

  const diasReferenciaSemana = React.useMemo(() => {
    const semanas = Array.from(semanasDisponiveisMap.values());
    if (semanas.length === 0) return 5;
    const alvo = Math.min(quantPacote, semanas.length);
    return semanas
      .slice(0, alvo)
      .reduce((acc, lista) => acc + lista.length, 0);
  }, [semanasDisponiveisMap, quantPacote]);

  const totalDiasReais =
    diasSelecionados.length > 0
      ? diasSelecionados.length
      : pacoteSelecionado?.dias_equivalentes
      ? Number(pacoteSelecionado.dias_equivalentes)
      : isModoSemana
      ? diasReferenciaSemana
      : quantPacote;

  const subtotalPrograma = precoBase * multiplicadorPrecoBase * quantidade;

  // 1. Avaliar todas as promoções ativas na data de hoje (todayISO)
  const promocoesAtivasHoje = descontosCampo.filter((d) => {
    if (d.ativo === false) return false;
    if (d.data_inicio && todayISO < d.data_inicio) return false;
    if (d.data_fim && todayISO > d.data_fim) return false;
    return true;
  });

  // 2. Calcular o melhor desconto elegível automaticamente
  let valorDesconto = 0;
  let nomeDescontoAplicado = "";

  const candidatosDesconto = promocoesAtivasHoje
    .map((d) => {
      const minCriancas =
        d.min_criancas !== undefined
          ? Number(d.min_criancas)
          : !d.min_dias && !d.data_fim
          ? 2
          : 1;
      const minDias = d.min_dias !== undefined ? Number(d.min_dias) : 1;

      if (quantidade < minCriancas) return null;
      if (totalDiasReais < minDias) return null;

      let poupanca = 0;
      if (d.preco_por_dia !== undefined && d.preco_por_dia !== null) {
        const novoSubtotal =
          Number(d.preco_por_dia) * totalDiasReais * quantidade;
        poupanca = Math.max(0, subtotalPrograma - novoSubtotal);
      } else if (Number(d.percentagem) > 0) {
        poupanca = subtotalPrograma * (Number(d.percentagem) / 100);
      }

      if (poupanca <= 0.009) return null;

      return {
        regra: d,
        poupanca,
        label: isEn && d.nome_en ? d.nome_en : d.nome,
      };
    })
    .filter(Boolean) as { regra: Desconto; poupanca: number; label: string }[];

  if (candidatosDesconto.length > 0) {
    const melhor = candidatosDesconto.reduce((best, curr) =>
      curr.poupanca > best.poupanca ? curr : best
    );
    valorDesconto = melhor.poupanca;
    nomeDescontoAplicado = melhor.label;
  }

  // 3. Aviso informativo de promoção disponível hoje para 2+ participantes
  const promoDesbloqueavel =
    valorDesconto === 0
      ? promocoesAtivasHoje.find(
          (d) =>
            (d.min_criancas ?? 1) > quantidade &&
            (Boolean(d.data_fim) ||
              Boolean(d.preco_por_dia) ||
              Number(d.percentagem) > 0)
        ) || null
      : null;

  // 4. Alojamento, Suplementos e Taxas
  let custoAlojamentoUnit = 0;
  if (alojamentoSelecionado) {
    const pAloj = Number(alojamentoSelecionado.preco) || 0;
    custoAlojamentoUnit =
      alojamentoSelecionado.tipo === "fixo" ? pAloj : pAloj * totalUnidadesTempo;
  }

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

  const taxaMatriculaUnit = Number(campo.taxa_matricula) || 0;
  const taxaMaterialUnit = Number(campo.taxa_material) || 0;

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
  const semanasAlvo = Math.min(
    quantPacote,
    totalSemanasDisponiveis || quantPacote
  );
  const escolhasCompletas =
    datasDisponiveis.length === 0
      ? true
      : !isModoSemana
      ? isDiaAvulsoFlexivel
        ? diasSelecionados.length >= 1
        : diasSelecionados.length === quantPacote
      : SemanasCount === semanasAlvo;

  const vagasTotais = campo.vagas_totais;
  const isEsgotado = vagasTotais !== null && Number(vagasTotais) <= 0;
  const disabledReserva =
    !pacoteSelecionado ||
    !varianteSelecionada ||
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
          turno_interesse: `${nomeProgramaCompleto}${
            resumoDatasSelecionadas.length > 0
              ? ` | Datas: ${resumoDatasSelecionadas.join(", ")}`
              : ""
          }${
            nomeDescontoAplicado ? ` | Promo: ${nomeDescontoAplicado}` : ""
          }`,
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
        setVarianteSelecionada: trocarVariante,
        opcoesAlojamento,
        alojamentoSelecionado,
        setAlojamentoSelecionado,
        custoAlojamentoUnit,
        quantidade,
        setQuantidade,
        diasSelecionados,
        setDiasSelecionados,
        resumoDatasSelecionadas,
        isModoSemana,
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
        promoDesbloqueavel,
        subtotalPrograma,
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
        quantPacote: isModoSemana ? semanasAlvo : quantPacote,
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

  const faltam = Math.max(0, ctx.quantPacote - escolhasFeitas);

  const mesesNomes = ctx.isEn
    ? [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ]
    : [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
      ];

  return (
    <div
      className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 relative z-20 space-y-8"
      id="reserva"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
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

      {/* BANNER AUTOMÁTICO DE PROMOÇÃO ATIVA OU DISPONÍVEL (SEM BOTÃO) */}
      {ctx.valorDesconto > 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <span className="text-xs font-black text-[#167524]">
            ✓ {ctx.nomeDescontoAplicado}{" "}
            {ctx.isEn ? "applied automatically!" : "aplicado automaticamente!"}
          </span>
          <span className="bg-[#167524] text-white text-xs font-black px-3 py-1 rounded-lg shrink-0">
            -{ctx.valorDesconto.toFixed(2)}€
          </span>
        </div>
      ) : ctx.promoDesbloqueavel ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs font-bold text-amber-950">
          {ctx.isEn && ctx.promoDesbloqueavel.nome_en
            ? ctx.promoDesbloqueavel.nome_en
            : ctx.promoDesbloqueavel.nome}{" "}
          —{" "}
          {ctx.isEn
            ? `Automatically applied for ${ctx.promoDesbloqueavel.min_criancas}+ children.`
            : `Aplicado automaticamente a partir de ${ctx.promoDesbloqueavel.min_criancas} participantes.`}
        </div>
      ) : null}

      {/* 1. ESCOLHA DO PACOTE DE DURAÇÃO */}
      <div>
        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
          1.{" "}
          {ctx.isEn
            ? "Select Package / Duration"
            : "Escolha a Modalidade / Duração"}
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
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
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
                <span className="text-lg font-black text-[#0E3A68] shrink-0">
                  {precoMinPac === 0
                    ? ctx.isEn
                      ? "Free"
                      : "0€"
                    : `${precoMinPac}€`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. OPÇÃO DE PREÇO (SÓ APARECE SE O PACOTE TIVER VARIANTES REAIS) */}
      {ctx.pacoteSelecionado &&
        ctx.pacoteSelecionado.variantes &&
        ctx.pacoteSelecionado.variantes.length > 1 && (
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
              2. {ctx.isEn ? "Select Option" : "Escolha a Opção"}
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
                      className={`p-3.5 rounded-xl border text-left cursor-pointer flex items-center justify-between gap-2 ${
                        isVarSel
                          ? "border-[#167524] bg-emerald-50/50 font-black"
                          : "border-slate-200 bg-slate-50 hover:bg-white font-bold"
                      }`}
                    >
                      <span className="text-xs text-slate-800">{nomeV}</span>
                      <span className="text-sm font-black text-[#167524] shrink-0">
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
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
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
                ? `✓ ${ctx.diasSelecionados.length} Day(s) Selected`
                : `✓ ${ctx.diasSelecionados.length} Dia(s) Selecionado(s)`
              : ctx.isEn
              ? `Select ${faltam} ${
                  ctx.pacoteSelecionado?.tipo === "semana" ? "week(s)" : "day(s)"
                }`
              : `Selecione ${faltam} ${
                  ctx.pacoteSelecionado?.tipo === "semana"
                    ? "semana(s)"
                    : "dia(s)"
                }`}
          </span>
        </div>

        {ctx.pacoteSelecionado?.tipo === "semana" && (
          <p className="text-[11px] font-bold text-slate-500 mt-0 mb-3">
            {ctx.isEn
              ? "Tip: Clicking any day automatically selects the entire week."
              : "Dica: Ao clicar num dia, toda a semana correspondente é selecionada automaticamente."}
          </p>
        )}

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

      {/* 4. OPÇÕES DE ALOJAMENTO EXTRA */}
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

      {/* 5. PERGUNTAS DE ESCOLHA MÚLTIPLA CUSTOMIZADAS PELO PARCEIRO */}
      {ctx.perguntasParsed && ctx.perguntasParsed.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-5">
          <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400">
            📋{" "}
            {ctx.isEn ? "Participant Preferences" : "Opções por Participante"}
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

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-lg border border-slate-200">
      <div className="flex items-baseline justify-between border-b border-slate-100 pb-5 mb-5">
        <div>
          <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
            {ctx.isEn ? "Total Price" : "Valor Total"}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#0E3A68]">
              {ctx.precoTotal.toFixed(2)}€
            </span>
            {ctx.valorDesconto > 0 && (
              <span className="text-sm font-bold text-slate-400 line-through">
                {(ctx.precoTotal + ctx.valorDesconto).toFixed(2)}€
              </span>
            )}
          </div>
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
        {/* PROGRAMA & CÁLCULO BASE */}
        <div className="flex justify-between gap-2 font-bold text-slate-700">
          <div>
            <span className="block">{ctx.nomeProgramaCompleto}</span>
            <span className="text-[10px] font-semibold text-slate-400">
              {ctx.isDiaAvulsoFlexivel && ctx.diasSelecionados.length > 0
                ? `${ctx.precoBase.toFixed(2)}€ × ${ctx.diasSelecionados.length} ${
                    ctx.isEn ? "day(s)" : "dia(s)"
                  }`
                : `${ctx.precoBase.toFixed(2)}€ / ${
                    ctx.isEn ? "participant" : "participante"
                  }`}
              {ctx.quantidade > 1
                ? ` × ${ctx.quantidade} ${
                    ctx.isEn ? "children" : "participantes"
                  }`
                : ""}
            </span>
          </div>
          <span className="shrink-0">{ctx.subtotalPrograma.toFixed(2)}€</span>
        </div>

        {/* SEMANAS / DATAS SELECIONADAS */}
        {ctx.resumoDatasSelecionadas.length > 0 && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 space-y-1.5">
            <span className="block text-[10px] font-black uppercase tracking-widest text-[#0E3A68]">
              📅{" "}
              {ctx.isModoSemana
                ? ctx.isEn
                  ? "Selected Week(s)"
                  : "Semana(s) Selecionada(s)"
                : ctx.isEn
                ? "Selected Dates"
                : "Datas Selecionadas"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ctx.resumoDatasSelecionadas.map((label: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-white border border-blue-200 text-[#0E3A68] text-[11px] font-black px-2.5 py-1 rounded-lg"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* OPÇÕES SELECIONADAS POR PARTICIPANTE */}
        {ctx.perguntasParsed && ctx.perguntasParsed.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
              📋 {ctx.isEn ? "Selected Options" : "Opções Selecionadas"}
            </span>
            {Array.from({ length: ctx.quantidade }).map((_, idx) => {
              const pNum = idx + 1;
              const respostas = ctx.opcoesParticipantes[pNum] || {};
              return (
                <div key={pNum} className="space-y-1 text-[11px]">
                  {ctx.quantidade > 1 && (
                    <span className="block font-black text-[#0E3A68]">
                      👦{" "}
                      {ctx.isEn
                        ? `Participant ${pNum}`
                        : `Participante ${pNum}`}
                    </span>
                  )}
                  {ctx.perguntasParsed.map((perg: any, pIdx: number) => {
                    const val = respostas[perg.titulo] || perg.opcoes[0] || "";
                    return (
                      <div
                        key={pIdx}
                        className="flex flex-col gap-0.5 text-slate-600"
                      >
                        <span className="text-[10px] font-semibold text-slate-400 leading-tight">
                          {perg.titulo}
                        </span>
                        <span className="font-black text-slate-800">
                          {val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

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
          <div className="flex justify-between gap-2 font-black text-[#167524] bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            <span>✨ {ctx.nomeDescontoAplicado || "Desconto"}</span>
            <span className="shrink-0">-{ctx.valorDesconto.toFixed(2)}€</span>
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
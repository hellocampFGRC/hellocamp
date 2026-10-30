"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function GestaoReservasParceiro({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const capitalize = (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<any>(null);

  // Dados Core
  const [camposParceiro, setCamposParceiro] = useState<any[]>([]);
  const [todasReservas, setTodasReservas] = useState<any[]>([]);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroCampoId, setFiltroCampoId] = useState<string>("todos");
  const [filtroTurno, setFiltroTurno] = useState<string>("todos");
  const [filtroStatusTab, setFiltroStatusTab] = useState<
    "ativas" | "pendentes" | "todas"
  >("ativas");

  // Dropdowns Customizados (Zero <select> nativos)
  const [isCampoDropdownOpen, setIsCampoDropdownOpen] = useState(false);
  const [isModalCampoDropdownOpen, setIsModalCampoDropdownOpen] =
    useState(false);

  // Painel de Filtro de Passe / Calendário
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filtroModo, setFiltroModo] = useState<"pacote" | "dia_solto">(
    "pacote"
  );
  const [filtroMesAtual, setFiltroMesAtual] = useState<Date>(new Date());
  const [filtroDiaSelecionado, setFiltroDiaSelecionado] = useState<string>("");

  // Modal Adicionar Inscrições Externas (Manual + Excel/CSV)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<"selecao" | "manual" | "excel">(
    "selecao"
  );
  const [savingExterno, setSavingExterno] = useState(false);
  const [modalidadeExterna, setModalidadeExterna] = useState<
    "pacote" | "dia_solto"
  >("pacote");
  const [modalMesAtual, setModalMesAtual] = useState<Date>(new Date());
  const [diaExterno, setDiaExterno] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [formExterno, setFormExterno] = useState({
    campo_id: "",
    turno_nome: "",
    valor_pago: 0,
    nome_crianca: "",
    idade: "",
    alergias: "",
    doencas: "",
    nome_pai: "",
    telefone_pai: "",
    email_pai: "",
  });

  // Modal Ficha Clínica Detalhada e Upsells / Ajustes Financeiros
  const [reservaSelecionada, setReservaSelecionada] = useState<any>(null);
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [savingAjuste, setSavingAjuste] = useState(false);
  const [ajusteForm, setAjusteForm] = useState({
    motivo: "",
    valor: 25,
  });

  const limparNomeParaExibicao = (nomeCru: string) => {
    if (!nomeCru) return "";
    return nomeCru.split("(")[0].split("- Dia")[0].split("- Day")[0].trim();
  };

  // ============================================================================
  // LEITURA COMPLETA DA BASE DE DADOS (COM JOIN REAL DE CRIANÇAS E PERFIS)
  // ============================================================================
  const fetchDashboardData = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/${lang}/login`);
      return;
    }
    setSessionUser(session.user);

    const uid = session.user.id;

    const [
      { data: camposData },
      { data: reservasData, error: resError },
      { data: criancasAll },
      { data: perfisAll },
    ] = await Promise.all([
      supabase
        .from("campos")
        .select(
          "id, nome, nome_en, vagas_totais, pacotes, calendario_funcionamento"
        )
        .eq("organizador_id", uid)
        .order("created_at", { ascending: false }),
      supabase
        .from("reservas")
        .select("*")
        .eq("organizador_id", uid)
        .order("created_at", { ascending: false }),
      supabase.from("criancas").select("*"),
      supabase
        .from("perfis")
        .select(
          "id, nome_completo, email, telefone, nif, contacto_emergencia, pessoas_autorizadas_recolha"
        ),
    ]);

    setCamposParceiro(camposData || []);

    if (resError) {
      console.error("Erro ao buscar reservas:", resError);
      setLoading(false);
      return;
    }

    if (reservasData) {
      const reservasFormatadas = reservasData.map((res: any) => {
        const campoRelacionado = camposData?.find(
          (c: any) => c.id === res.campo_id
        );
        const criancaDb =
          (criancasAll || []).find((cr: any) => cr.id === res.crianca_id) ||
          null;
        const paiDb =
          (perfisAll || []).find((p: any) => p.id === res.cliente_id) || null;

        // Controlo de Carrinho Abandonado (>15 min em Pendente)
        const dataReserva = new Date(res.created_at).getTime();
        const minutosPassados =
          (new Date().getTime() - dataReserva) / (1000 * 60);
        let estadoReal = res.status_pagamento || "Pendente";
        if (estadoReal === "Pendente" && minutosPassados > 15) {
          estadoReal = "Abandonada";
        }

        const isExterna =
          res.status_pagamento === "Externo" ||
          res.respostas_customizadas?.origem === "externo" ||
          res.cliente_id === uid;

        return {
          id: res.id,
          created_at: res.created_at,
          campo_id: res.campo_id,
          cliente_id: res.cliente_id,
          campo_nome: campoRelacionado
            ? isEn && campoRelacionado.nome_en
              ? campoRelacionado.nome_en
              : campoRelacionado.nome
            : "Campo",
          turno: res.turno_nome || "Turno Base",
          valor: Number(res.valor_total) || 0,
          valor_pago: Number(res.valor_pago) || Number(res.valor_total) || 0,
          valor_em_falta: Number(res.valor_em_falta) || 0,
          status: estadoReal,
          status_original: res.status_pagamento || "Pendente",
          isExterna,
          crianca: {
            nome:
              criancaDb?.nome ||
              criancaDb?.nome_completo ||
              res.respostas_customizadas?.nome_crianca ||
              res.nome_participante ||
              res.nome_encarregado ||
              "Participante",
            data_nascimento:
              criancaDb?.data_nascimento ||
              (res.respostas_customizadas?.idade_crianca
                ? `${res.respostas_customizadas.idade_crianca} anos`
                : "N/A"),
            sexo: criancaDb?.sexo || "N/D",
            nif: criancaDb?.nif || "N/D",
            tipo_sanguineo: criancaDb?.tipo_sanguineo || "N/D",
            restricoes_alimentares:
              criancaDb?.restricoes_alimentares ||
              criancaDb?.alergias ||
              res.respostas_customizadas?.alergias ||
              "Nenhuma",
            doencas_cronicas:
              criancaDb?.doencas_cronicas ||
              res.respostas_customizadas?.doencas ||
              "Sem observações",
            medicacao_regular: criancaDb?.medicacao_regular || "Nenhuma",
            limitacoes_fisicas: criancaDb?.limitacoes_fisicas || "Nenhuma",
            sabe_nadar: criancaDb?.sabe_nadar || "N/D",
            sabe_andar_bicicleta: criancaDb?.sabe_andar_bicicleta || "N/D",
            tamanho_tshirt: criancaDb?.tamanho_tshirt || "N/D",
            nivel_ingles: criancaDb?.nivel_ingles || "N/D",
            fobias_medos: criancaDb?.fobias_medos || "Nenhuma",
            perfil_comportamental: criancaDb?.perfil_comportamental || "N/D",
            autorizacao_fotografia:
              criancaDb?.autorizacao_fotografia || "Não respondido",
          },
          pai: {
            nome: res.nome_encarregado || paiDb?.nome_completo || "N/D",
            email: res.email_encarregado || paiDb?.email || "N/D",
            telefone: res.telefone_encarregado || paiDb?.telefone || "N/D",
            nif: res.nif_encarregado || res.nif_faturacao || paiDb?.nif || "S/ NIF",
            contacto_emergencia:
              paiDb?.contacto_emergencia ||
              res.telefone_encarregado ||
              paiDb?.telefone ||
              "N/D",
            pessoas_autorizadas_recolha:
              paiDb?.pessoas_autorizadas_recolha || "Encarregado de Educação",
          },
          extrasEscolhidos: res.extras_escolhidos || {},
          respostasCustomizadas: res.respostas_customizadas || {},
          pedido_pendente:
            res.respostas_customizadas?.pedido_pai_pendente || null,
        };
      });
      setTodasReservas(reservasFormatadas);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [lang]);

  // ============================================================================
  // GERADOR DE DATAS DE CALENDÁRIO PARA FILTRO E MODAL DE INSERÇÃO
  // ============================================================================
  const gerarDatasDisponiveisDoCampo = (campoObj: any, mesRef: Date) => {
    if (!campoObj) return [];
    const cal = campoObj.calendario_funcionamento || {};
    const diasSemanaPermitidos: number[] = Array.isArray(cal.dias_semana)
      ? cal.dias_semana
      : [1, 2, 3, 4, 5];
    const diasFechados: string[] = Array.isArray(cal.dias_fechados)
      ? cal.dias_fechados
      : [];

    const ano = mesRef.getFullYear();
    const mes = mesRef.getMonth();
    const totalDiasNoMes = new Date(ano, mes + 1, 0).getDate();
    const listaDatas: string[] = [];

    for (let d = 1; d <= totalDiasNoMes; d++) {
      const dt = new Date(ano, mes, d);
      const iso = dt.toISOString().split("T")[0];
      const diaSem = dt.getDay();

      if (cal.data_inicio && iso < cal.data_inicio) continue;
      if (cal.data_fim && iso > cal.data_fim) continue;
      if (diasFechados.includes(iso)) continue;
      if (!diasSemanaPermitidos.includes(diaSem)) continue;

      listaDatas.push(iso);
    }
    return listaDatas;
  };

  const campoAtivoFiltro = camposParceiro.find(
    (c: any) => c.id === filtroCampoId
  );
  const pacotesFiltro = Array.isArray(campoAtivoFiltro?.pacotes)
    ? campoAtivoFiltro.pacotes.filter((p: any) => p.tipo !== "dia")
    : [];
  const diasSoltosFiltro = Array.isArray(campoAtivoFiltro?.pacotes)
    ? campoAtivoFiltro.pacotes.filter((p: any) => p.tipo === "dia")
    : [];
  const datasFiltroVisiveis = gerarDatasDisponiveisDoCampo(
    campoAtivoFiltro,
    filtroMesAtual
  );

  const campoAtivoModal = camposParceiro.find(
    (c: any) => c.id === formExterno.campo_id
  );
  const pacotesModal = Array.isArray(campoAtivoModal?.pacotes)
    ? campoAtivoModal.pacotes.filter((p: any) => p.tipo !== "dia")
    : [];
  const diasSoltosModal = Array.isArray(campoAtivoModal?.pacotes)
    ? campoAtivoModal.pacotes.filter((p: any) => p.tipo === "dia")
    : [];
  const datasModalVisiveis = gerarDatasDisponiveisDoCampo(
    campoAtivoModal,
    modalMesAtual
  );

  const prevMonthFiltro = () =>
    setFiltroMesAtual(
      new Date(filtroMesAtual.getFullYear(), filtroMesAtual.getMonth() - 1, 1)
    );
  const nextMonthFiltro = () =>
    setFiltroMesAtual(
      new Date(filtroMesAtual.getFullYear(), filtroMesAtual.getMonth() + 1, 1)
    );

  const prevMonthModal = () =>
    setModalMesAtual(
      new Date(modalMesAtual.getFullYear(), modalMesAtual.getMonth() - 1, 1)
    );
  const nextMonthModal = () =>
    setModalMesAtual(
      new Date(modalMesAtual.getFullYear(), modalMesAtual.getMonth() + 1, 1)
    );

  const setTurnoEscolhido = (tituloPacote: string, variante: any) => {
    const labelTurno =
      modalidadeExterna === "dia_solto" && diaExterno
        ? `${tituloPacote} (${variante.nome}) - Dia ${diaExterno}`
        : `${tituloPacote} (${variante.nome})`;

    setFormExterno((prev) => ({
      ...prev,
      turno_nome: labelTurno,
      valor_pago: Number(variante.preco) || 0,
    }));
  };

  // ============================================================================
  // FILTRAGEM DE RESERVAS E CONTADORES KPI
  // ============================================================================
  const reservasFiltradas = todasReservas.filter((r: any) => {
    if (filtroCampoId !== "todos" && r.campo_id !== filtroCampoId) return false;

    if (filtroStatusTab === "ativas") {
      if (r.status === "Abandonada" || r.status === "Cancelada") return false;
    } else if (filtroStatusTab === "pendentes") {
      if (r.status !== "Pendente" && r.status !== "Abandonada") return false;
    }

    if (filtroTurno !== "todos") {
      if (
        !String(r.turno || "")
          .toLowerCase()
          .includes(filtroTurno.toLowerCase())
      ) {
        return false;
      }
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const match = `${r.crianca?.nome || ""} ${r.pai?.nome || ""} ${
        r.pai?.email || ""
      } ${r.turno || ""} ${r.campo_nome || ""}`
        .toLowerCase()
        .includes(q);
      if (!match) return false;
    }

    return true;
  });

  const countHelloCamp = todasReservas.filter(
    (r: any) =>
      !r.isExterna && r.status !== "Abandonada" && r.status !== "Cancelada"
  ).length;
  const countExternas = todasReservas.filter((r: any) => r.isExterna).length;

  // ============================================================================
  // EXPORTAR LISTA COMPLETA PARA EXCEL / CSV
  // ============================================================================
  const exportarCSV = () => {
    if (reservasFiltradas.length === 0) {
      alert(isEn ? "No bookings to export." : "Nenhuma inscrição para exportar.");
      return;
    }

    const headers = [
      "Participante",
      "Data Nascimento / Idade",
      "Tamanho T-Shirt",
      "Sabe Nadar",
      "Alergias Alimentares",
      "Doencas / Medicacao",
      "Encarregado de Educacao",
      "Telemovel / Emergencia",
      "Email",
      "NIF",
      "Campo",
      "Passe / Turno",
      "Origem",
      "Estado Pagamento",
      "Valor (EUR)",
    ];

    const rows = reservasFiltradas.map((item: any) =>
      [
        item.crianca?.nome || "N/D",
        item.crianca?.data_nascimento || "N/A",
        item.crianca?.tamanho_tshirt || "N/D",
        item.crianca?.sabe_nadar || "N/D",
        item.crianca?.restricoes_alimentares || "Nenhuma",
        `${item.crianca?.doencas_cronicas || "Nenhuma"} | Med: ${
          item.crianca?.medicacao_regular || "Nenhuma"
        }`,
        item.pai?.nome || "N/D",
        item.pai?.telefone || "N/D",
        item.pai?.email || "N/D",
        item.pai?.nif || "S/ NIF",
        item.campo_nome || "Campo",
        item.turno || "Geral",
        item.isExterna ? "Externo / Manual" : "HelloCamp Online",
        item.status,
        Number(item.valor || 0).toFixed(2),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(";")
    );

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Lista_Participantes_HelloCamp_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
  };

  // ============================================================================
  // INSERIR RESERVA EXTERNA MANUAL E IMPORTAÇÃO CSV EM LOTE
  // ============================================================================
  const handleAddExterno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser || !formExterno.campo_id || !formExterno.turno_nome)
      return;

    setSavingExterno(true);
    try {
      const { error } = await supabase.from("reservas").insert([
        {
          campo_id: formExterno.campo_id,
          organizador_id: sessionUser.id,
          cliente_id: sessionUser.id,
          turno_nome: formExterno.turno_nome,
          valor_total: Number(formExterno.valor_pago) || 0,
          valor_pago: Number(formExterno.valor_pago) || 0,
          status_pagamento: "Externo",
          nome_encarregado: formExterno.nome_pai,
          telefone_encarregado: formExterno.telefone_pai,
          email_encarregado: formExterno.email_pai,
          respostas_customizadas: {
            origem: "externo",
            nome_crianca: formExterno.nome_crianca,
            idade_crianca: formExterno.idade,
            alergias: formExterno.alergias || "Nenhuma",
            doencas: formExterno.doencas || "Sem observações",
          },
        },
      ]);

      if (error) throw error;

      setIsAddModalOpen(false);
      setImportMode("selecao");
      setFormExterno({
        campo_id: "",
        turno_nome: "",
        valor_pago: 0,
        nome_crianca: "",
        idade: "",
        alergias: "",
        doencas: "",
        nome_pai: "",
        telefone_pai: "",
        email_pai: "",
      });
      await fetchDashboardData();
    } catch (err: any) {
      alert("Erro ao adicionar inscrição: " + err.message);
    } finally {
      setSavingExterno(false);
    }
  };

  const downloadTemplateCSV = () => {
    const template =
      "\uFEFFNome_Crianca;Idade;Alergias;Doencas;Nome_Encarregado;Telemovel;Email;Turno_ou_Semana;Valor_Pago\nJoao Silva;10;Nenhuma;Nenhuma;Maria Silva;910000000;maria@exemplo.pt;Semana 1;150";
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Template_Importacao_HelloCamp.csv";
    a.click();
  };

  const handleImportCSV = async () => {
    if (!csvFile || !sessionUser) return;
    const targetCampoId =
      formExterno.campo_id ||
      (filtroCampoId !== "todos" ? filtroCampoId : camposParceiro[0]?.id);

    if (!targetCampoId) {
      alert("Selecione primeiro um campo antes de importar.");
      return;
    }

    setSavingExterno(true);
    try {
      const text = await csvFile.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        throw new Error("O ficheiro CSV está vazio.");
      }

      const payloadBatch = lines.slice(1).map((line) => {
        const cols = line.split(/[;,]/).map((c) => c.replace(/^"|"$/g, "").trim());
        const [
          nome_crianca,
          idade,
          alergias,
          doencas,
          nome_pai,
          telefone_pai,
          email_pai,
          turno_nome,
          valor_pago,
        ] = cols;

        return {
          campo_id: targetCampoId,
          organizador_id: sessionUser.id,
          cliente_id: sessionUser.id,
          turno_nome: turno_nome || "Passe Importado",
          valor_total: Number(valor_pago) || 0,
          valor_pago: Number(valor_pago) || 0,
          status_pagamento: "Externo",
          nome_encarregado: nome_pai || "Encarregado",
          telefone_encarregado: telefone_pai || "",
          email_encarregado: email_pai || "",
          respostas_customizadas: {
            origem: "externo",
            nome_crianca: nome_crianca || "Participante",
            idade_crianca: idade || "",
            alergias: alergias || "Nenhuma",
            doencas: doencas || "Sem observações",
          },
        };
      });

      const { error } = await supabase.from("reservas").insert(payloadBatch);
      if (error) throw error;

      alert(
        `${payloadBatch.length} inscrições importadas com sucesso!`
      );
      setCsvFile(null);
      setIsAddModalOpen(false);
      setImportMode("selecao");
      await fetchDashboardData();
    } catch (err: any) {
      alert("Erro ao importar CSV: " + err.message);
    } finally {
      setSavingExterno(false);
    }
  };

  // ============================================================================
  // LANÇAR AJUSTE FINANCEIRO / APROVAR PEDIDO DE UPGRADE DO PAI
  // ============================================================================
  const handleSubmeterAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaSelecionada || !ajusteForm.motivo.trim()) return;

    setSavingAjuste(true);
    try {
      const valorExtra = Number(ajusteForm.valor) || 0;
      const novoValorTotal = Number(reservaSelecionada.valor || 0) + valorExtra;
      const novoValorEmFalta =
        Number(reservaSelecionada.valor_em_falta || 0) + valorExtra;

      const historicoAtual = Array.isArray(
        reservaSelecionada.respostasCustomizadas?.historico_ajustes
      )
        ? reservaSelecionada.respostasCustomizadas.historico_ajustes
        : [];

      const novasRespostas = {
        ...reservaSelecionada.respostasCustomizadas,
        pedido_pai_pendente: null,
        historico_ajustes: [
          ...historicoAtual,
          {
            data: new Date().toISOString(),
            motivo: ajusteForm.motivo,
            valor: valorExtra,
          },
        ],
      };

      const { error } = await supabase
        .from("reservas")
        .update({
          valor_total: novoValorTotal,
          valor_em_falta: novoValorEmFalta,
          status_pagamento: "Sinal Pago",
          respostas_customizadas: novasRespostas,
        })
        .eq("id", reservaSelecionada.id);

      if (error) throw error;

      // Envia mensagem na Inbox para avisar o Pai que o ajuste foi lançado
      if (
        reservaSelecionada.cliente_id &&
        reservaSelecionada.cliente_id !== sessionUser?.id
      ) {
        await supabase.from("mensagens").insert([
          {
            campo_id: reservaSelecionada.campo_id,
            sender_id: sessionUser.id,
            receiver_id: reservaSelecionada.cliente_id,
            texto: `💳 Atualização de Reserva (${reservaSelecionada.crianca?.nome}): Foi aprovado/adicionado "${ajusteForm.motivo}" no valor de ${valorExtra}€. Pode liquidar o valor pendente diretamente no seu Painel de Pais.`,
            lida: false,
          },
        ]);
      }

      alert(
        "Fatura adicional lançada com sucesso! O encarregado de educação já pode pagar o valor no seu painel."
      );
      setIsAjusteModalOpen(false);
      setAjusteForm({ motivo: "", valor: 25 });
      setReservaSelecionada(null);
      await fetchDashboardData();
    } catch (err: any) {
      alert("Erro ao lançar ajuste: " + err.message);
    } finally {
      setSavingAjuste(false);
    }
  };

  const fecharModalReserva = () => {
    setReservaSelecionada(null);
    setIsAjusteModalOpen(false);
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-black text-xs uppercase tracking-widest text-slate-400 animate-pulse">
        {isEn
          ? "Loading Booking Operations..."
          : "A carregar Central de Reservas e Fichas Médicas..."}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto font-sans text-[#0F172A] pb-20">
      {/* HEADER & AÇÕES GLOBAIS */}
      <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <span className="inline-block bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-2">
            {isEn ? "Operations & Medical Files" : "Operação & Fichas Clínicas"}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#0F172A] m-0 tracking-tight">
            {isEn ? "Booking Operations Center" : "Central de Reservas e Logística"}
          </h1>
          <p className="text-slate-500 mt-1 mb-0 font-medium text-xs md:text-sm">
            {isEn
              ? "Manage HelloCamp and manual bookings, medical alerts, and parent upgrades in one place."
              : "Gira inscrições da HelloCamp, inscrições manuais/Excel, fichas médicas e pacotes contratados num só local."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={exportarCSV}
            className="w-full sm:w-auto px-5 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white font-black rounded-md shadow-sm transition-colors text-xs uppercase tracking-widest text-center cursor-pointer border-0"
          >
            📥 {isEn ? "Export Excel / CSV" : "Exportar Lista (Excel)"}
          </button>
          <button
            type="button"
            onClick={() => {
              setImportMode("selecao");
              setIsAddModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#16A34A] hover:bg-green-700 text-white font-black rounded-md shadow-sm transition-all text-xs uppercase tracking-widest text-center cursor-pointer border-0"
          >
            + {isEn ? "Add Bookings" : "Adicionar Inscrições"}
          </button>
        </div>
      </div>

      {/* MÉTRICAS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-md border border-slate-200 border-b-4 border-b-[#16A34A] shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-[#16A34A] uppercase tracking-widest mb-1">
            🟢 {isEn ? "Origin: HelloCamp" : "Origem: HelloCamp Online"}
          </span>
          <span className="text-4xl font-black text-[#0F172A]">
            {countHelloCamp}
          </span>
        </div>

        <div className="bg-white p-6 rounded-md border border-slate-200 border-b-4 border-b-[#2563EB] shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest mb-1">
            ⚪ {isEn ? "Origin: External / Manual" : "Origem: Externos / Manuais"}
          </span>
          <span className="text-4xl font-black text-[#0F172A]">
            {countExternas}
          </span>
        </div>

        <div className="bg-white p-6 rounded-md border border-slate-200 border-b-4 border-b-[#F59E0B] shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest mb-2">
            🔍 {isEn ? "Status View" : "Filtro de Estado"}
          </span>
          <div className="flex gap-1.5">
            {[
              { id: "ativas", label: isEn ? "Active" : "Confirmadas" },
              { id: "pendentes", label: isEn ? "Abandoned" : "Abandonadas" },
              { id: "todas", label: isEn ? "All" : "Todas" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFiltroStatusTab(t.id as any)}
                className={`flex-1 py-2 px-2 rounded-md text-[10px] font-black uppercase tracking-wider cursor-pointer border-0 transition-colors ${
                  filtroStatusTab === t.id
                    ? "bg-[#0F172A] text-white"
                    : "bg-slate-200 text-[#0F172A] hover:bg-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS COM DROPDOWNS 100% CUSTOMIZADOS E POPOVER DE CALENDÁRIO */}
      <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm mb-8 flex flex-col lg:flex-row gap-4 relative z-20">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            {isEn ? "Search Name / Parent" : "Procurar Participante ou Encarregado"}
          </label>
          <input
            type="text"
            placeholder={
              isEn
                ? "Search child, parent, or email..."
                : "Pesquisar miúdo, encarregado ou e-mail..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
          />
        </div>

        {/* Dropdown Customizado de Campo */}
        <div className="flex-1 relative">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
            {isEn ? "Filter Camp" : "Filtrar por Campo"}
          </label>
          <div
            onClick={() => setIsCampoDropdownOpen(!isCampoDropdownOpen)}
            className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-xs font-bold text-[#0F172A] cursor-pointer flex justify-between items-center"
          >
            <span className="truncate">
              {filtroCampoId === "todos"
                ? isEn
                  ? "All Camps"
                  : "Todos os Campos"
                : campoAtivoFiltro?.nome || "Campo"}
            </span>
            <span className="text-slate-400 text-[10px] ml-2">▼</span>
          </div>

          {isCampoDropdownOpen && (
            <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-40 max-h-60 overflow-y-auto">
              <div
                onClick={() => {
                  setFiltroCampoId("todos");
                  setFiltroTurno("todos");
                  setIsCampoDropdownOpen(false);
                }}
                className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100"
              >
                {isEn ? "All Camps" : "Todos os Campos"}
              </div>
              {camposParceiro.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setFiltroCampoId(c.id);
                    setFiltroTurno("todos");
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

        {/* BOTÃO DO FILTRO DE PASSE / CALENDÁRIO */}
        {filtroCampoId !== "todos" && (
          <div className="flex-1 relative">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              {isEn ? "Filter by Pass / Date" : "Filtrar por Passe / Data"}
            </label>
            <div
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`w-full border rounded-md px-4 py-3 text-xs font-black cursor-pointer flex justify-between items-center transition-colors ${
                filtroTurno === "todos"
                  ? "bg-[#F8FAFC] border-slate-300 text-[#0F172A]"
                  : "bg-[#16A34A] border-[#16A34A] text-white"
              }`}
            >
              <span className="truncate">
                {filtroTurno === "todos"
                  ? isEn
                    ? "All Options"
                    : "Todas as Opções"
                  : limparNomeParaExibicao(filtroTurno)}
              </span>
              <span className="text-[10px] ml-2">▼</span>
            </div>

            {isFilterPanelOpen && (
              <>
                <div
                  className="fixed inset-0 z-[150] bg-slate-900/50 backdrop-blur-sm"
                  onClick={() => setIsFilterPanelOpen(false)}
                />
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[440px] bg-white rounded-md shadow-2xl z-[200] p-6 max-h-[85vh] overflow-y-auto border border-slate-300">
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200">
                    <span className="text-xs font-black text-[#0F172A] uppercase tracking-widest">
                      {isEn ? "Filter by Pass / Date" : "Filtrar por Passe / Data"}
                    </span>
                    <div className="flex gap-2">
                      {filtroTurno !== "todos" && (
                        <button
                          type="button"
                          onClick={() => {
                            setFiltroTurno("todos");
                            setIsFilterPanelOpen(false);
                          }}
                          className="text-[10px] font-black text-white bg-[#F43F5E] px-3 py-1.5 rounded-md cursor-pointer border-0"
                        >
                          Limpar &times;
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsFilterPanelOpen(false)}
                        className="text-[10px] font-black text-white bg-[#0F172A] px-3 py-1.5 rounded-md cursor-pointer border-0"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>

                  {pacotesFiltro.length > 0 && diasSoltosFiltro.length > 0 && (
                    <div className="flex bg-slate-100 p-1 rounded-md mb-5">
                      <button
                        type="button"
                        onClick={() => setFiltroModo("pacote")}
                        className={`flex-1 py-2.5 rounded-md text-xs font-black cursor-pointer border-0 transition-all ${
                          filtroModo === "pacote"
                            ? "bg-[#2563EB] text-white"
                            : "bg-transparent text-slate-600"
                        }`}
                      >
                        Semanas / Pacotes
                      </button>
                      <button
                        type="button"
                        onClick={() => setFiltroModo("dia_solto")}
                        className={`flex-1 py-2.5 rounded-md text-xs font-black cursor-pointer border-0 transition-all ${
                          filtroModo === "dia_solto"
                            ? "bg-[#16A34A] text-white"
                            : "bg-transparent text-slate-600"
                        }`}
                      >
                        Dias Soltos
                      </button>
                    </div>
                  )}

                  {filtroModo === "pacote" && (
                    <div className="flex flex-col gap-2.5">
                      {pacotesFiltro.map((pac: any, i: number) => {
                        const tituloPac = pac.titulo || pac.nome || `Pacote ${i + 1}`;
                        return (
                          <div
                            key={pac.id || i}
                            onClick={() => {
                              setFiltroTurno(tituloPac);
                              setIsFilterPanelOpen(false);
                            }}
                            className={`p-3.5 rounded-md border-2 cursor-pointer transition-all flex justify-between items-center ${
                              filtroTurno === tituloPac
                                ? "bg-emerald-50 border-[#16A34A]"
                                : "bg-white border-slate-200 hover:border-[#2563EB]"
                            }`}
                          >
                            <div>
                              <p className="text-xs font-black text-[#0F172A] m-0">
                                {tituloPac}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-1 mb-0 font-bold">
                                Variantes: {pac.variantes?.length || 0}
                              </p>
                            </div>
                            <span className="text-lg">🗓️</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {filtroModo === "dia_solto" && (
                    <div>
                      <div className="flex items-center justify-between mb-4 bg-[#F8FAFC] p-2 rounded-md border border-slate-200">
                        <button
                          type="button"
                          onClick={prevMonthFiltro}
                          className="w-9 h-9 bg-[#0F172A] text-white rounded-md font-black cursor-pointer border-0"
                        >
                          &larr;
                        </button>
                        <span className="text-xs font-black uppercase tracking-widest text-[#0F172A]">
                          {capitalize(
                            filtroMesAtual.toLocaleDateString(
                              isEn ? "en-US" : "pt-PT",
                              { month: "long", year: "numeric" }
                            )
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={nextMonthFiltro}
                          className="w-9 h-9 bg-[#0F172A] text-white rounded-md font-black cursor-pointer border-0"
                        >
                          &rarr;
                        </button>
                      </div>

                      <div className="grid grid-cols-5 gap-2">
                        {datasFiltroVisiveis.length === 0 ? (
                          <div className="col-span-5 text-center text-xs font-bold text-slate-400 py-6">
                            Nenhum dia configurado neste mês.
                          </div>
                        ) : (
                          datasFiltroVisiveis.map((data: string) => {
                            const isActive = filtroDiaSelecionado === data;
                            const dateObj = new Date(data);
                            return (
                              <div
                                key={data}
                                onClick={() => {
                                  setFiltroTurno(data);
                                  setFiltroDiaSelecionado(data);
                                  setIsFilterPanelOpen(false);
                                }}
                                className={`flex flex-col items-center justify-center py-2.5 rounded-md border-2 cursor-pointer transition-all ${
                                  isActive
                                    ? "bg-[#16A34A] border-[#16A34A] text-white"
                                    : "bg-white border-slate-200 text-[#0F172A] hover:border-[#16A34A]"
                                }`}
                              >
                                <span
                                  className={`text-[9px] font-black uppercase mb-0.5 ${
                                    isActive ? "text-white" : "text-slate-400"
                                  }`}
                                >
                                  {dateObj
                                    .toLocaleDateString("pt-PT", {
                                      weekday: "short",
                                    })
                                    .replace(".", "")}
                                </span>
                                <span className="text-base font-black leading-none">
                                  {dateObj.toLocaleDateString("pt-PT", {
                                    day: "2-digit",
                                  })}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* TABELA UNIFICADA DE INSCRIÇÕES */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Participante & Encarregado
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Campo / Passe Contratado
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Estado Clínico
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Origem / Pagamento
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reservasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-slate-400 font-bold text-sm"
                  >
                    Nenhum resultado encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                reservasFiltradas.map((item: any) => {
                  const isInativa =
                    item.status === "Abandonada" ||
                    item.status === "Cancelada" ||
                    item.status === "Reembolsado";
                  const isExterna = item.isExterna;

                  const alertaAlergia =
                    item.crianca?.restricoes_alimentares &&
                    item.crianca.restricoes_alimentares.length > 2 &&
                    !item.crianca.restricoes_alimentares
                      .toLowerCase()
                      .includes("nenhum");
                  const alertaDoenca =
                    item.crianca?.doencas_cronicas &&
                    item.crianca.doencas_cronicas.length > 2 &&
                    !item.crianca.doencas_cronicas
                      .toLowerCase()
                      .includes("nenhum") &&
                    !item.crianca.doencas_cronicas
                      .toLowerCase()
                      .includes("sem observ");
                  const temRisco = !isInativa && (alertaAlergia || alertaDoenca);
                  const temPedidoAlteracao = item.pedido_pendente != null;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#F8FAFC] transition-colors ${
                        isInativa ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-md flex items-center justify-center text-xs font-black text-white shrink-0 ${
                              isExterna ? "bg-[#2563EB]" : "bg-[#16A34A]"
                            }`}
                          >
                            {item.crianca?.nome
                              ? item.crianca.nome.charAt(0).toUpperCase()
                              : "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-[#0F172A] m-0 text-sm truncate">
                              {item.crianca?.nome || "N/D"}
                            </p>
                            <p className="text-[11px] text-slate-500 font-bold m-0 truncate mt-0.5">
                              👨‍👩‍👧 {item.pai?.nome} • 📞 {item.pai?.telefone}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-block bg-slate-100 text-[#0F172A] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-1">
                          {item.campo_nome}
                        </span>
                        <p className="font-bold text-slate-700 m-0 text-xs leading-tight">
                          {item.turno || "Passe Global"}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        {temRisco ? (
                          <span className="inline-flex items-center gap-1 bg-[#F43F5E] text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                            ⚠️ Alerta Clínico
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-[#16A34A] border border-emerald-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                            ✓ Sem Alerta
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {temPedidoAlteracao ? (
                          <span className="bg-[#F59E0B] text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-block mb-1">
                            📬 Pedido do Pai
                          </span>
                        ) : isExterna ? (
                          <span className="bg-[#2563EB] text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-block mb-1">
                            ⚪ Externo / Manual
                          </span>
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-white inline-block mb-1 ${
                              item.status === "Pago" ||
                              item.status === "Sinal Pago"
                                ? "bg-[#16A34A]"
                                : item.status === "Abandonada"
                                ? "bg-slate-500"
                                : "bg-[#F59E0B]"
                            }`}
                          >
                            🟢 HelloCamp • {item.status}
                          </span>
                        )}
                        <div className="text-sm font-black text-[#0F172A]">
                          {item.valor}€
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setReservaSelecionada(item)}
                          className={`px-4 py-2.5 rounded-md text-xs font-black uppercase tracking-widest transition-colors shadow-sm whitespace-nowrap cursor-pointer border-0 text-white ${
                            temPedidoAlteracao
                              ? "bg-[#F59E0B] hover:bg-amber-600"
                              : "bg-[#0F172A] hover:bg-[#2563EB]"
                          }`}
                        >
                          🩺 Abrir Ficha
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

      {/* ===================================================================== */}
      {/* MODAL MESTRE: ADICIONAR INSCRIÇÕES MANUAIS / IMPORTAR EXCEL CSV       */}
      {/* ===================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-md shadow-2xl flex flex-col overflow-hidden border border-slate-300">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#0F172A] text-white">
              <div>
                <h2 className="text-lg font-black m-0 tracking-tight">
                  Adicionar Inscrições Externas
                </h2>
                <p className="text-xs font-bold text-slate-300 mt-1 mb-0">
                  Centralize os clientes que reservaram diretamente consigo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setImportMode("selecao");
                }}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-800 text-white font-black cursor-pointer border-0"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F8FAFC]">
              {importMode === "selecao" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
                  <button
                    type="button"
                    onClick={() => setImportMode("manual")}
                    className="flex flex-col items-center justify-center gap-3 p-8 bg-white border-2 border-slate-200 rounded-md hover:border-[#16A34A] transition-all cursor-pointer"
                  >
                    <span className="text-4xl">✍️</span>
                    <span className="font-black text-[#0F172A] text-base">
                      Adicionar Manualmente
                    </span>
                    <span className="text-xs font-medium text-slate-500 text-center">
                      Selecionar Campo, Passe/Variante e preencher ficha do participante.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode("excel")}
                    className="flex flex-col items-center justify-center gap-3 p-8 bg-white border-2 border-slate-200 rounded-md hover:border-[#2563EB] transition-all cursor-pointer"
                  >
                    <span className="text-4xl">📊</span>
                    <span className="font-black text-[#0F172A] text-base">
                      Importar Excel / CSV
                    </span>
                    <span className="text-xs font-medium text-slate-500 text-center">
                      Fazer upload de um ficheiro CSV para importar inscrições em lote.
                    </span>
                  </button>
                </div>
              )}

              {importMode === "manual" && (
                <form
                  id="form-manual"
                  onSubmit={handleAddExterno}
                  className="flex flex-col gap-6"
                >
                  <div className="bg-white p-6 rounded-md border border-slate-200">
                    <h3 className="text-[11px] font-black text-[#16A34A] uppercase tracking-widest mb-4">
                      1. Escolha do Programa e Variante de Preço
                    </h3>
                    <div className="flex flex-col gap-4">
                      {/* Dropdown Customizado de Campo no Modal */}
                      <div className="relative">
                        <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">
                          Programa / Campo de Férias *
                        </label>
                        <div
                          onClick={() =>
                            setIsModalCampoDropdownOpen(
                              !isModalCampoDropdownOpen
                            )
                          }
                          className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-xs font-bold text-[#0F172A] cursor-pointer flex justify-between items-center"
                        >
                          <span>
                            {campoAtivoModal?.nome || "Selecione o Campo..."}
                          </span>
                          <span className="text-[10px] text-slate-400">▼</span>
                        </div>
                        {isModalCampoDropdownOpen && (
                          <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-40 max-h-56 overflow-y-auto">
                            {camposParceiro.map((c: any) => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setFormExterno({
                                    ...formExterno,
                                    campo_id: c.id,
                                    turno_nome: "",
                                    valor_pago: 0,
                                  });
                                  setDiaExterno("");
                                  setIsModalCampoDropdownOpen(false);
                                }}
                                className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                              >
                                {c.nome}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {formExterno.campo_id && (
                        <div className="bg-[#F8FAFC] p-4 border border-slate-200 rounded-md space-y-4">
                          {pacotesModal.length > 0 &&
                            diasSoltosModal.length > 0 && (
                              <div className="flex bg-slate-200 p-1 rounded-md">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalidadeExterna("pacote");
                                    setFormExterno((p) => ({
                                      ...p,
                                      turno_nome: "",
                                      valor_pago: 0,
                                    }));
                                  }}
                                  className={`flex-1 py-2.5 rounded-md text-xs font-black cursor-pointer border-0 ${
                                    modalidadeExterna === "pacote"
                                      ? "bg-[#2563EB] text-white"
                                      : "bg-transparent text-slate-700"
                                  }`}
                                >
                                  Programa / Pacote
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalidadeExterna("dia_solto");
                                    setFormExterno((p) => ({
                                      ...p,
                                      turno_nome: "",
                                      valor_pago: 0,
                                    }));
                                  }}
                                  className={`flex-1 py-2.5 rounded-md text-xs font-black cursor-pointer border-0 ${
                                    modalidadeExterna === "dia_solto"
                                      ? "bg-[#16A34A] text-white"
                                      : "bg-transparent text-slate-700"
                                  }`}
                                >
                                  Dias Soltos Avulso
                                </button>
                              </div>
                            )}

                          {modalidadeExterna === "pacote" &&
                            pacotesModal.length > 0 && (
                              <div className="space-y-3">
                                {pacotesModal.map((pac: any, idx: number) => {
                                  const tituloP =
                                    pac.titulo ||
                                    pac.nome ||
                                    `Pacote ${idx + 1}`;
                                  return (
                                    <div
                                      key={pac.id || idx}
                                      className="border border-slate-200 p-3.5 rounded-md bg-white"
                                    >
                                      <p className="text-xs font-black text-[#0F172A] mb-2.5 m-0">
                                        {tituloP}
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {pac.variantes?.map(
                                          (v: any, i: number) => {
                                            const isSelected =
                                              formExterno.turno_nome ===
                                              `${tituloP} (${v.nome})`;
                                            return (
                                              <div
                                                key={i}
                                                onClick={() =>
                                                  setTurnoEscolhido(tituloP, v)
                                                }
                                                className={`p-3 rounded-md border-2 cursor-pointer text-center transition-all ${
                                                  isSelected
                                                    ? "bg-[#16A34A] border-[#16A34A] text-white"
                                                    : "bg-[#F8FAFC] border-slate-200 text-[#0F172A] hover:border-[#16A34A]"
                                                }`}
                                              >
                                                <p className="text-xs m-0 font-bold">
                                                  {v.nome}
                                                </p>
                                                <p className="text-sm font-black mt-1 mb-0">
                                                  {v.preco}€
                                                </p>
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                          {modalidadeExterna === "dia_solto" &&
                            diasSoltosModal.length > 0 && (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between bg-white p-2 rounded-md border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={prevMonthModal}
                                    className="w-8 h-8 bg-[#0F172A] text-white rounded-md font-black cursor-pointer border-0"
                                  >
                                    &larr;
                                  </button>
                                  <span className="text-xs font-black uppercase tracking-widest text-[#0F172A]">
                                    {capitalize(
                                      modalMesAtual.toLocaleDateString(
                                        isEn ? "en-US" : "pt-PT",
                                        { month: "long", year: "numeric" }
                                      )
                                    )}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={nextMonthModal}
                                    className="w-8 h-8 bg-[#0F172A] text-white rounded-md font-black cursor-pointer border-0"
                                  >
                                    &rarr;
                                  </button>
                                </div>

                                <div className="grid grid-cols-5 gap-2">
                                  {datasModalVisiveis.map((data: string) => {
                                    const isActive = diaExterno === data;
                                    const dateObj = new Date(data);
                                    return (
                                      <div
                                        key={data}
                                        onClick={() => {
                                          setDiaExterno(data);
                                          setFormExterno((p) => ({
                                            ...p,
                                            turno_nome: "",
                                            valor_pago: 0,
                                          }));
                                        }}
                                        className={`flex flex-col items-center justify-center py-2.5 rounded-md cursor-pointer border-2 ${
                                          isActive
                                            ? "bg-[#16A34A] border-[#16A34A] text-white"
                                            : "bg-white border-slate-200 text-[#0F172A]"
                                        }`}
                                      >
                                        <span className="text-[9px] font-black uppercase">
                                          {dateObj
                                            .toLocaleDateString("pt-PT", {
                                              weekday: "short",
                                            })
                                            .replace(".", "")}
                                        </span>
                                        <span className="text-sm font-black">
                                          {dateObj.toLocaleDateString("pt-PT", {
                                            day: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {diaExterno &&
                                  diasSoltosModal.map(
                                    (pac: any, idx: number) => {
                                      const tituloD =
                                        pac.titulo ||
                                        pac.nome ||
                                        `Dia Solto ${idx + 1}`;
                                      return (
                                        <div
                                          key={pac.id || idx}
                                          className="border border-slate-200 p-3.5 rounded-md bg-white"
                                        >
                                          <p className="text-xs font-black mb-2 m-0">
                                            {tituloD}
                                          </p>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {pac.variantes?.map(
                                              (v: any, i: number) => (
                                                <div
                                                  key={i}
                                                  onClick={() =>
                                                    setTurnoEscolhido(
                                                      tituloD,
                                                      v
                                                    )
                                                  }
                                                  className="p-2.5 rounded-md border-2 border-slate-200 hover:border-[#16A34A] cursor-pointer text-center"
                                                >
                                                  <p className="text-xs font-bold m-0">
                                                    {v.nome}
                                                  </p>
                                                  <p className="text-sm font-black m-0">
                                                    {v.preco}€
                                                  </p>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                              </div>
                            )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase">
                            Designação do Turno / Passe *
                          </label>
                          <input
                            type="text"
                            required
                            value={formExterno.turno_nome}
                            onChange={(e) =>
                              setFormExterno({
                                ...formExterno,
                                turno_nome: e.target.value,
                              })
                            }
                            placeholder="Ex: Semana 1 (Julho)"
                            className="w-full p-3 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase">
                            Valor Cobrado (€) *
                          </label>
                          <input
                            type="number"
                            required
                            value={formExterno.valor_pago}
                            onChange={(e) =>
                              setFormExterno({
                                ...formExterno,
                                valor_pago: Number(e.target.value),
                              })
                            }
                            className="w-full p-3 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-black text-[#0F172A]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dados do Participante */}
                  <div className="bg-white p-6 rounded-md border border-slate-200">
                    <h3 className="text-[11px] font-black text-[#2563EB] uppercase tracking-widest mb-4">
                      2. Dados do Participante
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={formExterno.nome_crianca}
                          onChange={(e) =>
                            setFormExterno({
                              ...formExterno,
                              nome_crianca: e.target.value,
                            })
                          }
                          className="w-full p-3 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">
                          Idade (Anos) *
                        </label>
                        <input
                          type="number"
                          required
                          value={formExterno.idade}
                          onChange={(e) =>
                            setFormExterno({
                              ...formExterno,
                              idade: e.target.value,
                            })
                          }
                          className="w-full p-3 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-[#F43F5E] mb-1 uppercase">
                          Alergias Alimentares
                        </label>
                        <input
                          type="text"
                          value={formExterno.alergias}
                          onChange={(e) =>
                            setFormExterno({
                              ...formExterno,
                              alergias: e.target.value,
                            })
                          }
                          placeholder="Ex: Amendoins / Nenhuma"
                          className="w-full p-3 bg-rose-50 border border-rose-200 rounded-md text-xs font-bold text-[#0F172A]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-[#F43F5E] mb-1 uppercase">
                          Doenças / Medicação
                        </label>
                        <input
                          type="text"
                          value={formExterno.doencas}
                          onChange={(e) =>
                            setFormExterno({
                              ...formExterno,
                              doencas: e.target.value,
                            })
                          }
                          placeholder="Ex: Asma / Nenhuma"
                          className="w-full p-3 bg-rose-50 border border-rose-200 rounded-md text-xs font-bold text-[#0F172A]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados do Encarregado */}
                  <div className="bg-white p-6 rounded-md border border-slate-200">
                    <h3 className="text-[11px] font-black text-[#0F172A] uppercase tracking-widest mb-4">
                      3. Encarregado de Educação
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">
                          Nome do Responsável *
                        </label>
                        <input
                          type="text"
                          required
                          value={formExterno.nome_pai}
                          onChange={(e) =>
                            setFormExterno({
                              ...formExterno,
                              nome_pai: e.target.value,
                            })
                          }
                          className="w-full p-3 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">
                          Telemóvel *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formExterno.telefone_pai}
                          onChange={(e) =>
                            setFormExterno({
                              ...formExterno,
                              telefone_pai: e.target.value,
                            })
                          }
                          className="w-full p-3 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">
                          E-mail
                        </label>
                        <input
                          type="email"
                          value={formExterno.email_pai}
                          onChange={(e) =>
                            setFormExterno({
                              ...formExterno,
                              email_pai: e.target.value,
                            })
                          }
                          className="w-full p-3 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {importMode === "excel" && (
                <div className="flex flex-col gap-5">
                  <div className="bg-white border border-slate-200 p-6 rounded-md text-center">
                    <span className="text-3xl block mb-2">📝</span>
                    <h3 className="text-base font-black text-[#0F172A] mb-1">
                      1. Descarregue o Template CSV
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Preencha as linhas mantendo os cabeçalhos originais para importar em lote.
                    </p>
                    <button
                      type="button"
                      onClick={downloadTemplateCSV}
                      className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] rounded-md cursor-pointer border-0"
                    >
                      ⬇️ Download Template CSV
                    </button>
                  </div>

                  <div className="bg-white border-2 border-dashed border-slate-300 p-6 rounded-md text-center">
                    <h3 className="text-sm font-black text-[#0F172A] mb-3">
                      2. Carregue o Ficheiro CSV Preenchido
                    </h3>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e: any) =>
                        setCsvFile(e.target.files ? e.target.files[0] : null)
                      }
                      className="block w-full max-w-xs mx-auto text-xs text-slate-600"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center gap-3">
              {importMode !== "selecao" ? (
                <button
                  type="button"
                  onClick={() => setImportMode("selecao")}
                  className="px-4 py-2.5 text-xs font-black text-white bg-slate-600 rounded-md cursor-pointer border-0"
                >
                  &larr; Voltar
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setImportMode("selecao");
                  }}
                  className="px-5 py-2.5 font-black text-white bg-slate-600 rounded-md text-xs uppercase tracking-widest cursor-pointer border-0"
                >
                  Cancelar
                </button>

                {importMode === "manual" && (
                  <button
                    type="submit"
                    form="form-manual"
                    disabled={savingExterno || !formExterno.turno_nome}
                    className="px-6 py-2.5 font-black text-white bg-[#16A34A] hover:bg-green-700 rounded-md text-xs uppercase tracking-widest cursor-pointer border-0 disabled:opacity-50"
                  >
                    {savingExterno ? "A Guardar..." : "✓ Inserir Reserva"}
                  </button>
                )}

                {importMode === "excel" && (
                  <button
                    type="button"
                    onClick={handleImportCSV}
                    disabled={!csvFile || savingExterno}
                    className="px-6 py-2.5 font-black text-white bg-[#16A34A] hover:bg-green-700 rounded-md text-xs uppercase tracking-widest cursor-pointer border-0 disabled:opacity-50"
                  >
                    {savingExterno ? "A Importar..." : "✓ Processar CSV"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: VER FICHA CLÍNICA COMPLETA E CONTROLO DE UPSELLS / EXTRAS      */}
      {/* ===================================================================== */}
      {reservaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-md shadow-2xl flex flex-col overflow-hidden border border-slate-300">
            <div
              className={`p-6 text-white flex justify-between items-center border-b-4 border-[#F59E0B] ${
                reservaSelecionada.status === "Cancelada" ||
                reservaSelecionada.status === "Abandonada"
                  ? "bg-[#F43F5E]"
                  : "bg-[#0F172A]"
              }`}
            >
              <div>
                <span className="bg-[#16A34A] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block mb-1.5">
                  {reservaSelecionada.isExterna
                    ? "⚪ Inscrição Externa (Manual)"
                    : "🟢 Inscrição Online HelloCamp"}
                </span>
                <h2 className="m-0 text-xl md:text-2xl font-black tracking-tight">
                  👦 Ficha de Participante: {reservaSelecionada.crianca?.nome}
                </h2>
                <p className="m-0 text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-1">
                  REF: {reservaSelecionada.id} • {reservaSelecionada.campo_nome} (
                  {reservaSelecionada.turno})
                </p>
              </div>
              <button
                type="button"
                onClick={fecharModalReserva}
                className="w-9 h-9 flex items-center justify-center rounded-md bg-slate-800 text-white font-black cursor-pointer border-0"
              >
                ✕
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto bg-[#F8FAFC] flex flex-col gap-6">
              {/* CARTÃO DE CONTROLO FINANCEIRO DO PASSE & UPSELL */}
              <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 pb-3 border-b border-slate-100 gap-3">
                  <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-widest m-0">
                    💳 Controlo Financeiro do Passe
                  </h3>
                  {!reservaSelecionada.isExterna &&
                    reservaSelecionada.status !== "Cancelada" && (
                      <button
                        type="button"
                        onClick={() => setIsAjusteModalOpen(!isAjusteModalOpen)}
                        className="text-[10px] font-black uppercase tracking-widest bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-2 rounded-md cursor-pointer border-0"
                      >
                        + Cobrar Valor Adicional / Extra
                      </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#F8FAFC] p-4 rounded-md border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black m-0 mb-1">
                      Total Faturado
                    </p>
                    <p className="text-2xl font-black text-[#0F172A] m-0">
                      {reservaSelecionada.valor}€
                    </p>
                  </div>
                  <div className="bg-[#F8FAFC] p-4 rounded-md border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black m-0 mb-1">
                      Valor Pendente
                    </p>
                    <p className="text-2xl font-black text-[#F59E0B] m-0">
                      {reservaSelecionada.valor_em_falta || 0}€
                    </p>
                  </div>
                  <div className="bg-[#F8FAFC] p-4 rounded-md border border-slate-200 flex flex-col justify-center items-start">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black m-0 mb-1">
                      Estado Atual
                    </p>
                    <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-[#16A34A] text-white">
                      {reservaSelecionada.status}
                    </span>
                  </div>
                </div>

                {reservaSelecionada.pedido_pendente && (
                  <div className="mt-5 bg-amber-50 border-2 border-[#F59E0B] p-5 rounded-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-900 m-0 mb-1">
                        📬 Pedido de Alteração / Upgrade Solicitado pelo Pai:
                      </p>
                      <p className="text-sm font-black text-[#0F172A] m-0 italic">
                        &ldquo;{reservaSelecionada.pedido_pendente}&rdquo;
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAjusteForm({
                          motivo: reservaSelecionada.pedido_pendente,
                          valor: 25,
                        });
                        setIsAjusteModalOpen(true);
                      }}
                      className="text-xs font-black uppercase tracking-widest text-white bg-[#2563EB] hover:bg-blue-700 px-5 py-3 rounded-md cursor-pointer border-0 shrink-0"
                    >
                      Aprovar & Lançar Fatura Extra
                    </button>
                  </div>
                )}

                {isAjusteModalOpen && (
                  <form
                    onSubmit={handleSubmeterAjuste}
                    className="mt-5 pt-5 border-t border-slate-200"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">
                          Motivo do Ajuste (Ex: Transporte / Aula Extra) *
                        </label>
                        <input
                          type="text"
                          required
                          value={ajusteForm.motivo}
                          onChange={(e) =>
                            setAjusteForm({
                              ...ajusteForm,
                              motivo: e.target.value,
                            })
                          }
                          className="w-full p-3 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1 uppercase">
                          Valor Extra a Cobrar (€) *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={ajusteForm.valor}
                          onChange={(e) =>
                            setAjusteForm({
                              ...ajusteForm,
                              valor: Number(e.target.value),
                            })
                          }
                          className="w-full p-3 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-black text-[#2563EB]"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsAjusteModalOpen(false)}
                        className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-slate-600 rounded-md cursor-pointer border-0"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savingAjuste}
                        className="px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-[#16A34A] hover:bg-green-700 rounded-md cursor-pointer border-0"
                      >
                        {savingAjuste
                          ? "A Enviar..."
                          : "✓ Lançar Cobrança ao Pai"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* DADOS COMPLETOS DA CRIANÇA E FICHA MÉDICA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm space-y-3 text-xs">
                  <h3 className="text-[11px] font-black text-[#2563EB] uppercase tracking-widest m-0 pb-2 border-b border-slate-100">
                    👦 Identificação e Logística do Participante
                  </h3>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">Nome:</span>
                    <span className="font-black text-[#0F172A]">
                      {reservaSelecionada.crianca?.nome}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">
                      Data de Nascimento / Idade:
                    </span>
                    <span className="font-black text-[#0F172A]">
                      {reservaSelecionada.crianca?.data_nascimento}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">
                      Tipo Sanguíneo:
                    </span>
                    <span className="font-black text-[#0F172A]">
                      {reservaSelecionada.crianca?.tipo_sanguineo}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">
                      Tamanho T-Shirt:
                    </span>
                    <span className="font-black text-[#0F172A]">
                      {reservaSelecionada.crianca?.tamanho_tshirt}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">Sabe Nadar:</span>
                    <span className="font-black text-[#0F172A]">
                      {reservaSelecionada.crianca?.sabe_nadar}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-500">
                      Autorização de Imagem:
                    </span>
                    <span className="font-black text-[#0F172A]">
                      {String(
                        reservaSelecionada.crianca?.autorizacao_fotografia
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <span className="block text-[10px] font-black uppercase text-slate-400">
                      Encarregado de Educação & Recolha
                    </span>
                    <p className="m-0 font-bold">
                      👨‍👩‍👧 {reservaSelecionada.pai?.nome} (NIF:{" "}
                      {reservaSelecionada.pai?.nif})
                    </p>
                    <p className="m-0 font-bold text-[#2563EB]">
                      📞 {reservaSelecionada.pai?.telefone} | ✉️{" "}
                      {reservaSelecionada.pai?.email}
                    </p>
                    <p className="m-0 font-bold text-[#F43F5E]">
                      🚨 Emergência:{" "}
                      {reservaSelecionada.pai?.contacto_emergencia}
                    </p>
                  </div>
                </div>

                {/* PERFIL CLÍNICO E ALERTAS */}
                <div className="bg-white p-6 rounded-md border-2 border-rose-200 shadow-sm space-y-3">
                  <h3 className="text-[11px] font-black text-[#F43F5E] uppercase tracking-widest m-0 pb-2 border-b border-rose-100">
                    🏥 Perfil Clínico, Alergias e Medicação
                  </h3>
                  <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-md text-xs">
                    <strong className="block text-[10px] font-black uppercase tracking-widest text-[#F43F5E] mb-1">
                      Alergias / Restrições Alimentares:
                    </strong>
                    <span className="font-bold text-[#0F172A]">
                      {reservaSelecionada.crianca?.restricoes_alimentares ||
                        "Nenhuma"}
                    </span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-md text-xs">
                    <strong className="block text-[10px] font-black uppercase tracking-widest text-[#F43F5E] mb-1">
                      Doenças Crónicas / Condições Médicas:
                    </strong>
                    <span className="font-bold text-[#0F172A]">
                      {reservaSelecionada.crianca?.doencas_cronicas ||
                        "Sem observações"}
                    </span>
                  </div>
                  <div className="bg-[#F8FAFC] border border-slate-200 p-3.5 rounded-md text-xs">
                    <strong className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Medicação Regular / Fobias:
                    </strong>
                    <span className="font-bold text-[#0F172A]">
                      Medicação:{" "}
                      {reservaSelecionada.crianca?.medicacao_regular ||
                        "Nenhuma"}{" "}
                      | Fobias:{" "}
                      {reservaSelecionada.crianca?.fobias_medos || "Nenhuma"}
                    </span>
                  </div>
                </div>
              </div>

              {/* RESPOSTAS A PERGUNTAS CUSTOMIZADAS DO CAMPO */}
              {reservaSelecionada.respostasCustomizadas &&
                Object.keys(reservaSelecionada.respostasCustomizadas).length >
                  0 && (
                  <div className="bg-white border border-slate-200 p-6 rounded-md shadow-sm">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">
                      📋 Respostas aos Formulários Customizados do Campo
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(reservaSelecionada.respostasCustomizadas)
                        .filter(
                          ([p]) =>
                            ![
                              "origem",
                              "historico_ajustes",
                              "pedido_pai_pendente",
                              "nome_crianca",
                              "idade_crianca",
                              "alergias",
                              "doencas",
                            ].includes(p)
                        )
                        .map(([pergunta, resposta]: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-[#F8FAFC] p-3.5 rounded-md border border-slate-200"
                          >
                            <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                              {pergunta}
                            </span>
                            <span className="text-xs font-black text-[#0F172A]">
                              {typeof resposta === "object"
                                ? JSON.stringify(resposta)
                                : String(resposta)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
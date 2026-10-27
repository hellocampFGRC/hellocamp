"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function GestaoReservasParceiro({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [perfilParceiro, setPerfilParceiro] = useState<any>(null);

  // Dados Core
  const [camposParceiro, setCamposParceiro] = useState<any[]>([]);
  const [todasReservas, setTodasReservas] = useState<any[]>([]);

  // Filtros Customizados (Sem <select> nativos)
  const [filtroCampoId, setFiltroCampoId] = useState<string>("todos");
  const [filtroTurno, setFiltroTurno] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<
    "validas" | "pedidos_extra" | "todas" | "abandonadas"
  >("validas");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCampoDropdownOpen, setIsCampoDropdownOpen] = useState(false);
  const [isTurnoDropdownOpen, setIsTurnoDropdownOpen] = useState(false);

  // Modal de Detalhes da Ficha da Reserva + Controlo Financeiro Extra
  const [reservaSelecionada, setReservaSelecionada] = useState<any | null>(
    null
  );
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [savingAjuste, setSavingAjuste] = useState(false);
  const [ajusteForm, setAjusteForm] = useState({ valor: 0, motivo: "" });

  // Modal de Adicionar Inscrição Externa (Manual)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savingExterno, setSavingExterno] = useState(false);
  const [isModalCampoOpen, setIsModalCampoOpen] = useState(false);
  const [isModalTurnoOpen, setIsModalTurnoOpen] = useState(false);
  const [formExterno, setFormExterno] = useState({
    campo_id: "",
    turno_nome: "",
    valor_pago: 0,
    nome_crianca: "",
    idade: "",
    alergias: "",
    doencas: "",
    nome_pai: "",
    email_pai: "",
    telefone_pai: "",
  });

  const calcularIdade = (dataNasc?: string) => {
    if (!dataNasc || dataNasc === "N/A") return null;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    if (isNaN(nasc.getTime())) return null;
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return `${idade} ${isEn ? "yrs" : "anos"}`;
  };

  // ============================================================================
  // CARREGAMENTO PLANO E À PROVA DE FALHAS (NUNCA FALHA POR FOREIGN KEYS OU RLS)
  // ============================================================================
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const uid = session.user.id;
      setSessionUser(session.user);

      // 1. Perfil do Parceiro (para verificar estado do Contrato Global)
      const { data: perfilData } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      setPerfilParceiro(perfilData || null);

      // 2. Campos deste Parceiro
      const { data: camposData } = await supabase
        .from("campos")
        .select(
          "id, nome, nome_en, vagas_totais, pacotes, calendario_funcionamento, status_aprovacao"
        )
        .eq("organizador_id", uid);

      const listaCampos = camposData || [];
      setCamposParceiro(listaCampos);
      const idsMeusCampos = listaCampos.map((c: any) => c.id);

      // 3. Buscar Reservas tanto por organizador_id como por campo_id (Garante que NENHUMA reserva fica escondida!)
      let queryReservas = supabase
        .from("reservas")
        .select("*")
        .order("created_at", { ascending: false });

      if (idsMeusCampos.length > 0) {
        queryReservas = queryReservas.or(
          `organizador_id.eq.${uid},campo_id.in.(${idsMeusCampos.join(",")})`
        );
      } else {
        queryReservas = queryReservas.eq("organizador_id", uid);
      }

      const { data: reservasData, error: resError } = await queryReservas;

      if (resError) {
        console.error("Erro ao procurar reservas:", resError);
      }

      const listaReservasBruta = reservasData || [];

      // 4. Buscar Crianças, Pais e eventuais Campos em falta de forma PLANA e INDEPENDENTE
      const criancasIds = Array.from(
        new Set(listaReservasBruta.map((r: any) => r.crianca_id).filter(Boolean))
      );
      const clientesIds = Array.from(
        new Set(listaReservasBruta.map((r: any) => r.cliente_id).filter(Boolean))
      );
      const camposIdsReservas = Array.from(
        new Set(listaReservasBruta.map((r: any) => r.campo_id).filter(Boolean))
      );

      const [resCriancas, resPerfisPais, resCamposExtra] = await Promise.all([
        criancasIds.length > 0
          ? supabase.from("criancas").select("*").in("id", criancasIds)
          : Promise.resolve({ data: [] }),
        clientesIds.length > 0
          ? supabase
              .from("perfis")
              .select("id, nome_completo, email, telefone, nif, contacto_emergencia")
              .in("id", clientesIds)
          : Promise.resolve({ data: [] }),
        camposIdsReservas.length > 0
          ? supabase
              .from("campos")
              .select("id, nome, nome_en")
              .in("id", camposIdsReservas)
          : Promise.resolve({ data: [] }),
      ]);

      const mapaCriancas = new Map(
        (resCriancas.data || []).map((c: any) => [c.id, c])
      );
      const mapaPais = new Map(
        (resPerfisPais.data || []).map((p: any) => [p.id, p])
      );
      const mapaCampos = new Map(
        [...listaCampos, ...(resCamposExtra.data || [])].map((c: any) => [
          c.id,
          c,
        ])
      );

      // 5. Cruzamento seguro em memória
      const reservasFormatadas = listaReservasBruta.map((res: any) => {
        const campoRel = mapaCampos.get(res.campo_id);
        const criancaDb: any = mapaCriancas.get(res.crianca_id) || {};
        const paiDb: any = mapaPais.get(res.cliente_id) || {};
        const respCustom = res.respostas_customizadas || {};

        // Determinar se é uma tentativa de compra abandonada (>30 min em 'Pendente' sem pedido extra)
        const minutosPassados =
          (Date.now() - new Date(res.created_at).getTime()) / (1000 * 60);
        const rawStatus = res.status_pagamento || res.status || "Pendente";
        const temPedidoExtra = !!respCustom?.pedido_pai_pendente;

        let statusReal = rawStatus;
        if (
          rawStatus === "Pendente" &&
          minutosPassados > 30 &&
          !temPedidoExtra
        ) {
          statusReal = "Abandonada";
        }

        const idadeCalc =
          calcularIdade(criancaDb.data_nascimento) ||
          (respCustom.idade_crianca
            ? `${respCustom.idade_crianca} ${isEn ? "yrs" : "anos"}`
            : "N/D");

        return {
          id: res.id,
          created_at: res.created_at,
          campo_id: res.campo_id,
          campo_nome: campoRel
            ? isEn && campoRel.nome_en
              ? campoRel.nome_en
              : campoRel.nome
            : isEn
            ? "Camp Program"
            : "Programa HelloCamp",
          turno: res.turno_nome || "Turno Base",
          valor: Number(res.valor_total) || 0,
          valor_pago: Number(res.valor_pago) || 0,
          valor_em_falta: Number(res.valor_em_falta) || 0,
          valor_pendente_extra: Number(res.valor_pendente_extra) || 0,
          status: statusReal,
          raw_status: rawStatus,
          metodo_pagamento: res.metodo_pagamento || "Stripe",
          isExterna:
            rawStatus === "Externo" || res.cliente_id === session.user.id,
          crianca: {
            nome:
              criancaDb.nome ||
              respCustom.nome_crianca ||
              res.nome_encarregado ||
              "Participante",
            idade_formatada: idadeCalc,
            data_nascimento: criancaDb.data_nascimento || "N/A",
            sexo: criancaDb.sexo || "N/D",
            nif: criancaDb.nif || "N/D",
            tipo_sanguineo: criancaDb.tipo_sanguineo || "N/D",
            restricoes_alimentares:
              criancaDb.restricoes_alimentares ||
              respCustom.alergias ||
              "Nenhuma",
            doencas_cronicas:
              criancaDb.doencas_cronicas ||
              respCustom.doencas ||
              "Sem observações",
            medicacao_regular: criancaDb.medicacao_regular || "Nenhuma",
            limitacoes_fisicas: criancaDb.limitacoes_fisicas || "Nenhuma",
            sabe_nadar: criancaDb.sabe_nadar || "N/D",
            sabe_andar_bicicleta: criancaDb.sabe_andar_bicicleta || "N/D",
            tamanho_tshirt: criancaDb.tamanho_tshirt || "N/D",
          },
          pai: {
            nome:
              res.nome_encarregado ||
              paiDb.nome_completo ||
              "Encarregado de Educação",
            email: res.email_encarregado || paiDb.email || "N/D",
            telefone: res.telefone_encarregado || paiDb.telefone || "N/D",
            nif: res.nif_encarregado || paiDb.nif || "S/ NIF",
            contacto_emergencia:
              paiDb.contacto_emergencia ||
              res.telefone_encarregado ||
              paiDb.telefone ||
              "N/D",
          },
          extrasEscolhidos: res.extras_escolhidos || {},
          respostasCustomizadas: respCustom,
          pedido_pendente: respCustom?.pedido_pai_pendente || null,
        };
      });

      setTodasReservas(reservasFormatadas);
    } catch (err) {
      console.error("Erro geral ao carregar reservas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isEn]);

  // Turnos únicos para o filtro customizado
  const turnosDisponiveis = Array.from(
    new Set(
      todasReservas
        .filter((r) => filtroCampoId === "todos" || r.campo_id === filtroCampoId)
        .map((r) => r.turno)
        .filter(Boolean)
    )
  );

  // Filtragem Inteligente
  const reservasFiltradas = todasReservas.filter((r) => {
    if (filtroCampoId !== "todos" && r.campo_id !== filtroCampoId) return false;
    if (filtroTurno !== "todos" && r.turno !== filtroTurno) return false;

    if (filtroEstado === "pedidos_extra") {
      if (!r.pedido_pendente) return false;
    } else if (filtroEstado === "validas") {
      // Mostra todas as reservas pagas, sinais, externas OU que tenham um pedido extra pendente!
      const mostrarEmValidas =
        r.status === "Pago" ||
        r.status === "Sinal Pago" ||
        r.status === "Externo" ||
        r.status === "Aguardando Pagamento Extra" ||
        !!r.pedido_pendente;
      if (!mostrarEmValidas) return false;
    } else if (filtroEstado === "abandonadas") {
      if (
        r.status !== "Abandonada" &&
        r.status !== "Pendente" &&
        r.status !== "Reembolsado"
      )
        return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTexto =
        (r.crianca?.nome || "").toLowerCase().includes(q) ||
        (r.pai?.nome || "").toLowerCase().includes(q) ||
        (r.pai?.email || "").toLowerCase().includes(q) ||
        (r.campo_nome || "").toLowerCase().includes(q);
      if (!matchTexto) return false;
    }

    return true;
  });

  // Contadores de Topo (Alinhados a 100% com o Dashboard!)
  const totalConfirmadas = todasReservas.filter(
    (r) =>
      r.status === "Pago" ||
      r.status === "Sinal Pago" ||
      r.status === "Aguardando Pagamento Extra"
  ).length;
  const totalExternas = todasReservas.filter((r) => r.isExterna).length;
  const totalPedidosExtra = todasReservas.filter(
    (r) => !!r.pedido_pendente
  ).length;
  const totalAlertasMedicos = reservasFiltradas.filter(
    (r) =>
      (r.crianca.restricoes_alimentares &&
        r.crianca.restricoes_alimentares !== "Nenhuma") ||
      (r.crianca.doencas_cronicas &&
        r.crianca.doencas_cronicas !== "Sem observações" &&
        r.crianca.doencas_cronicas !== "Não")
  ).length;

  // ============================================================================
  // EXPORTAR LISTA DE PRESENÇAS E ALERGIAS PARA EXCEL (CSV)
  // ============================================================================
  const handleExportarCSV = () => {
    if (reservasFiltradas.length === 0) return;

    const cabecalhos = [
      "ID Reserva",
      "Data Inscricao",
      "Campo",
      "Turno / Semana",
      "Nome Participante",
      "Idade",
      "Alergias / Restricoes Alimentares",
      "Doencas / Medicacao",
      "Sabe Nadar",
      "Tamanho T-Shirt",
      "Encarregado de Educacao",
      "Email Pai",
      "Telefone / Emergencia",
      "NIF",
      "Valor Total (EUR)",
      "Estado Pagamento",
      "Pedido Extra Pendente",
    ];

    const linhas = reservasFiltradas.map((r) => [
      r.id.split("-")[0],
      new Date(r.created_at).toLocaleDateString("pt-PT"),
      `"${(r.campo_nome || "").replace(/"/g, '""')}"`,
      `"${(r.turno || "").replace(/"/g, '""')}"`,
      `"${(r.crianca.nome || "").replace(/"/g, '""')}"`,
      `"${r.crianca.idade_formatada}"`,
      `"${(r.crianca.restricoes_alimentares || "").replace(/"/g, '""')}"`,
      `"${(r.crianca.doencas_cronicas || "").replace(/"/g, '""')} | ${(
        r.crianca.medicacao_regular || ""
      ).replace(/"/g, '""')}"`,
      `"${r.crianca.sabe_nadar}"`,
      `"${r.crianca.tamanho_tshirt}"`,
      `"${(r.pai.nome || "").replace(/"/g, '""')}"`,
      `"${r.pai.email}"`,
      `"${r.pai.telefone}"`,
      `"${r.pai.nif}"`,
      r.valor.toFixed(2),
      `"${r.status}"`,
      `"${(r.pedido_pendente || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [cabecalhos.join(";"), ...linhas.map((e) => e.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Inscritos_HelloCamp_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============================================================================
  // APROVAR / COBRAR PEDIDO DE ALTERAÇÃO OU EXTRA DO PAI
  // ============================================================================
  const fecharModalReserva = () => {
    setReservaSelecionada(null);
    setIsAjusteModalOpen(false);
    setAjusteForm({ valor: 0, motivo: "" });
  };

  const handleSubmeterAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ajusteForm.motivo.trim() || ajusteForm.valor <= 0) {
      alert(
        isEn
          ? "Please enter a reason and an amount greater than 0€."
          : "Preencha a descrição do extra e um valor superior a 0€."
      );
      return;
    }

    setSavingAjuste(true);
    try {
      const novoAjuste = {
        data: new Date().toISOString(),
        motivo: ajusteForm.motivo,
        valor_pedido: Number(ajusteForm.valor),
      };
      const historicoAtualizado = [
        ...(reservaSelecionada.respostasCustomizadas?.historico_ajustes || []),
        novoAjuste,
      ];
      const novasRespostas = {
        ...reservaSelecionada.respostasCustomizadas,
        historico_ajustes: historicoAtualizado,
      };
      delete novasRespostas.pedido_pai_pendente;

      const novoValorTotal =
        Number(reservaSelecionada.valor) + Number(ajusteForm.valor);
      const novoValorEmFalta =
        Number(reservaSelecionada.valor_em_falta || 0) +
        Number(ajusteForm.valor);

      const { error } = await supabase
        .from("reservas")
        .update({
          status_pagamento: "Aguardando Pagamento Extra",
          valor_total: novoValorTotal,
          valor_em_falta: novoValorEmFalta,
          valor_pendente_extra: Number(ajusteForm.valor),
          respostas_customizadas: novasRespostas,
        })
        .eq("id", reservaSelecionada.id);

      if (error) throw error;

      alert(
        isEn
          ? "Extra payment request sent to the parent's dashboard!"
          : "Cobrança de extra lançada com sucesso! O encarregado de educação já pode pagar no seu portal."
      );
      fecharModalReserva();
      fetchDashboardData();
    } catch (err: any) {
      alert("Erro ao processar: " + err.message);
    } finally {
      setSavingAjuste(false);
    }
  };

  const handleMarcarPedidoResolvidoSemCusto = async () => {
    if (!reservaSelecionada) return;
    setSavingAjuste(true);
    try {
      const novasRespostas = { ...reservaSelecionada.respostasCustomizadas };
      delete novasRespostas.pedido_pai_pendente;

      const { error } = await supabase
        .from("reservas")
        .update({ respostas_customizadas: novasRespostas })
        .eq("id", reservaSelecionada.id);

      if (error) throw error;
      fecharModalReserva();
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingAjuste(false);
    }
  };

  // ============================================================================
  // ADICIONAR RESERVA EXTERNA MANUAL (1 A 1)
  // ============================================================================
  const handleAddExterno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formExterno.campo_id || !formExterno.nome_crianca.trim()) {
      alert(
        isEn
          ? "Select a camp and enter the participant's name."
          : "Selecione o campo e indique o nome do participante."
      );
      return;
    }
    setSavingExterno(true);
    try {
      const { error: errR } = await supabase.from("reservas").insert({
        organizador_id: sessionUser.id,
        cliente_id: sessionUser.id,
        campo_id: formExterno.campo_id,
        turno_nome: formExterno.turno_nome || "Inscrição Manual",
        valor_total: Number(formExterno.valor_pago) || 0,
        valor_pago: Number(formExterno.valor_pago) || 0,
        status_pagamento: "Externo",
        nome_encarregado: formExterno.nome_pai || "Registo Manual",
        email_encarregado: formExterno.email_pai || sessionUser.email,
        telefone_encarregado: formExterno.telefone_pai || "N/D",
        respostas_customizadas: {
          origem: "Inserção Manual pelo Organizador",
          nome_crianca: formExterno.nome_crianca,
          idade_crianca: formExterno.idade,
          alergias: formExterno.alergias || "Nenhuma",
          doencas: formExterno.doencas || "Sem observações",
        },
      });

      if (errR) throw errR;

      setIsAddModalOpen(false);
      setFormExterno({
        campo_id: "",
        turno_nome: "",
        valor_pago: 0,
        nome_crianca: "",
        idade: "",
        alergias: "",
        doencas: "",
        nome_pai: "",
        email_pai: "",
        telefone_pai: "",
      });
      fetchDashboardData();
    } catch (err: any) {
      alert("Erro ao inserir: " + err.message);
    } finally {
      setSavingExterno(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">
        {isEn
          ? "Loading Bookings & Medical Records..."
          : "A carregar Central de Reservas e Fichas Médicas..."}
      </div>
    );
  }

  const faltaAssinarContrato =
    !perfilParceiro?.contrato_dados ||
    (perfilParceiro?.status_contrato !== "Aprovado" &&
      !perfilParceiro?.parceiro_verificado);

  return (
    <div className="max-w-7xl mx-auto font-sans pb-20">
      {/* BANNER DE AVISO SE O PARCEIRO AINDA NÃO TIVER CONTRATO ASSINADO */}
      {faltaAssinarContrato && (
        <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-3xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-3xl">📝</span>
            <div>
              <h3 className="m-0 text-sm md:text-base font-black text-amber-950">
                {isEn
                  ? "Your Global Partnership Contract is not yet signed/validated"
                  : "O seu Contrato Global de Parceria ainda não se encontra assinado"}
              </h3>
              <p className="m-0 text-xs font-medium text-amber-800 mt-0.5">
                {isEn
                  ? "You can already view and manage existing bookings below, but please sign your Global Agreement to unlock full public visibility and automatic payouts."
                  : "Já pode consultar e gerir abaixo as suas reservas e pedidos extra, mas deverá assinar o seu Contrato Global para ativar os recebimentos automáticos."}
              </p>
            </div>
          </div>
          <Link
            href={`/${lang}/admin/contrato`}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest no-underline whitespace-nowrap shadow-sm"
          >
            {isEn ? "Sign Contract Now" : "Assinar Contrato"} &rarr;
          </Link>
        </div>
      )}

      {/* CABEÇALHO E BOTÕES DE AÇÃO */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#167524] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-2">
            {isEn ? "Operations & Logistics" : "Gestão Logística e Saúde"}
          </span>
          <h1 className="text-3xl font-black text-slate-900 m-0 tracking-tight">
            {isEn ? "Bookings Center" : "Central de Reservas e Inscritos"}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1 mb-0">
            {isEn
              ? "View participant health forms, dietary restrictions, emergency contacts, and approve extra requests."
              : "Consulte as fichas médicas das crianças, alergias, contactos dos pais e aprove pedidos de extras."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleExportarCSV}
            disabled={reservasFiltradas.length === 0}
            className="flex-1 md:flex-initial bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 border border-slate-300 font-black uppercase tracking-widest text-xs px-5 py-3.5 rounded-xl cursor-pointer shadow-sm transition-colors"
          >
            📥 {isEn ? "Export Excel (CSV)" : "Exportar Lista (Excel)"}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormExterno((prev) => ({
                ...prev,
                campo_id: camposParceiro[0]?.id || "",
              }));
              setIsAddModalOpen(true);
            }}
            className="flex-1 md:flex-initial bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs px-6 py-3.5 rounded-xl cursor-pointer shadow-md transition-colors"
          >
            + {isEn ? "Add Manual Booking" : "Inserir Inscrito Externo"}
          </button>
        </div>
      </div>

      {/* CARTÕES DE MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            {isEn ? "HelloCamp Bookings" : "Inscrições HelloCamp"}
          </span>
          <span className="text-3xl font-black text-[#167524]">
            {totalConfirmadas}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            {isEn ? "External / Manual" : "Inscrições Externas"}
          </span>
          <span className="text-3xl font-black text-slate-900">
            {totalExternas}
          </span>
        </div>

        <div
          onClick={() =>
            setFiltroEstado(
              filtroEstado === "pedidos_extra" ? "validas" : "pedidos_extra"
            )
          }
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer transition-all ${
            totalPedidosExtra > 0
              ? "bg-amber-50 border-amber-300"
              : "bg-white border-slate-200"
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 block mb-1">
            📬 {isEn ? "Pending Extra Requests" : "Pedidos de Extra Pendentes"}
          </span>
          <span className="text-3xl font-black text-amber-900">
            {totalPedidosExtra}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-500 block mb-1">
            ⚠️ {isEn ? "Medical / Allergy Alerts" : "Alertas de Saúde / Alergias"}
          </span>
          <span className="text-3xl font-black text-red-600">
            {totalAlertasMedicos}
          </span>
        </div>
      </div>

      {/* BARRA DE FILTROS COM DROPDOWNS 100% CUSTOMIZADOS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mb-6 space-y-4">
        {/* Abas de Estado */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
          {[
            {
              id: "validas",
              label: isEn
                ? `Active Bookings (${totalConfirmadas + totalExternas})`
                : `Inscrições Ativas (${totalConfirmadas + totalExternas})`,
            },
            {
              id: "pedidos_extra",
              label: isEn
                ? `📬 Extra Requests (${totalPedidosExtra})`
                : `📬 Com Pedido Extra (${totalPedidosExtra})`,
              highlight: totalPedidosExtra > 0,
            },
            {
              id: "todas",
              label: isEn
                ? `All Records (${todasReservas.length})`
                : `Todas (${todasReservas.length})`,
            },
            {
              id: "abandonadas",
              label: isEn
                ? "Unfinished / Refunded"
                : "Pendentes / Reembolsadas",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroEstado(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
                filtroEstado === tab.id
                  ? "bg-[#167524] text-white shadow-sm"
                  : tab.highlight
                  ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pesquisa + Dropdown Campo + Dropdown Turno */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              🔍 {isEn ? "Search Participant or Parent" : "Pesquisar Criança ou Pai"}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isEn ? "Name, email, camp..." : "Nome da criança, pai ou email..."
              }
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#167524]"
            />
          </div>

          {/* DROPDOWN CUSTOMIZADO DE CAMPO */}
          <div className="relative">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              🏕️ {isEn ? "Filter by Camp" : "Filtrar por Campo"}
            </label>
            <div
              onClick={() => setIsCampoDropdownOpen(!isCampoDropdownOpen)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 cursor-pointer flex items-center justify-between hover:border-[#167524]"
            >
              <span className="truncate">
                {filtroCampoId === "todos"
                  ? isEn
                    ? "All Camps"
                    : "Todos os Campos"
                  : camposParceiro.find((c) => c.id === filtroCampoId)?.nome ||
                    "Campo Selecionado"}
              </span>
              <span className="text-[10px] text-slate-400 ml-2">▼</span>
            </div>
            {isCampoDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCampoDropdownOpen(false)}
                />
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  <div
                    onClick={() => {
                      setFiltroCampoId("todos");
                      setFiltroTurno("todos");
                      setIsCampoDropdownOpen(false);
                    }}
                    className="p-3 text-xs font-black text-[#167524] hover:bg-emerald-50 cursor-pointer border-b border-slate-100"
                  >
                    {isEn ? "All Camps" : "Todos os Campos"}
                  </div>
                  {camposParceiro.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setFiltroCampoId(c.id);
                        setFiltroTurno("todos");
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

          {/* DROPDOWN CUSTOMIZADO DE TURNO / SEMANA */}
          <div className="relative">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              📅 {isEn ? "Filter by Turn / Week" : "Filtrar por Turno / Pacote"}
            </label>
            <div
              onClick={() => setIsTurnoDropdownOpen(!isTurnoDropdownOpen)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 cursor-pointer flex items-center justify-between hover:border-[#167524]"
            >
              <span className="truncate">
                {filtroTurno === "todos"
                  ? isEn
                    ? "All Turns / Weeks"
                    : "Todos os Turnos"
                  : filtroTurno}
              </span>
              <span className="text-[10px] text-slate-400 ml-2">▼</span>
            </div>
            {isTurnoDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsTurnoDropdownOpen(false)}
                />
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  <div
                    onClick={() => {
                      setFiltroTurno("todos");
                      setIsTurnoDropdownOpen(false);
                    }}
                    className="p-3 text-xs font-black text-[#167524] hover:bg-emerald-50 cursor-pointer border-b border-slate-100"
                  >
                    {isEn ? "All Turns / Weeks" : "Todos os Turnos"}
                  </div>
                  {turnosDisponiveis.map((t) => (
                    <div
                      key={t}
                      onClick={() => {
                        setFiltroTurno(t);
                        setIsTurnoDropdownOpen(false);
                      }}
                      className="p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TABELA DE INSCRITOS */}
      {reservasFiltradas.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <span className="text-5xl block mb-3">📋</span>
          <h3 className="text-lg font-black text-slate-900 m-0 mb-1">
            {isEn
              ? "No bookings found for this filter"
              : "Nenhuma inscrição encontrada para este filtro"}
          </h3>
          <p className="text-xs text-slate-500 font-medium m-0 mb-5">
            {todasReservas.length > 0
              ? isEn
                ? 'Click "All Records" above to see pending or unfinished bookings.'
                : 'Tem registos noutras abas. Clique em "Todas" acima para ver reservas pendentes ou histórico.'
              : isEn
              ? "When parents book your camps, participant records will appear here automatically."
              : "Assim que os encarregados de educação realizarem reservas, as fichas dos participantes aparecerão aqui."}
          </p>
          {todasReservas.length > 0 && filtroEstado !== "todas" && (
            <button
              type="button"
              onClick={() => {
                setFiltroEstado("todas");
                setFiltroCampoId("todos");
                setFiltroTurno("todos");
                setSearchQuery("");
              }}
              className="bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl cursor-pointer"
            >
              {isEn ? "Show All Bookings" : "Mostrar Todas as Reservas"} (
              {todasReservas.length})
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="p-4">
                    {isEn ? "Participant (Child)" : "Participante (Criança)"}
                  </th>
                  <th className="p-4">
                    {isEn ? "Camp & Turn" : "Programa / Turno"}
                  </th>
                  <th className="p-4">
                    {isEn ? "Health & Allergies" : "Saúde e Alergias"}
                  </th>
                  <th className="p-4">
                    {isEn ? "Parent / Guardian" : "Encarregado de Educação"}
                  </th>
                  <th className="p-4">
                    {isEn ? "Amount & Status" : "Valor e Estado"}
                  </th>
                  <th className="p-4 text-right">
                    {isEn ? "Actions" : "Ficha Completa"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {reservasFiltradas.map((res) => {
                  const temAlergia =
                    res.crianca.restricoes_alimentares &&
                    res.crianca.restricoes_alimentares !== "Nenhuma";
                  const temDoenca =
                    res.crianca.doencas_cronicas &&
                    res.crianca.doencas_cronicas !== "Sem observações" &&
                    res.crianca.doencas_cronicas !== "Não";

                  return (
                    <tr
                      key={res.id}
                      onClick={() => setReservaSelecionada(res)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        res.pedido_pendente ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-black text-slate-900 flex items-center gap-2">
                          <span>👦 {res.crianca.nome}</span>
                          {res.pedido_pendente && (
                            <span className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse">
                              📬 Pedido Extra!
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-bold mt-0.5">
                          🎂 {res.crianca.idade_formatada} • Ref: #
                          {res.id.split("-")[0]}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-800">
                          {res.campo_nome}
                        </div>
                        <div className="text-xs text-[#167524] font-bold mt-0.5">
                          {res.turno}
                        </div>
                      </td>

                      <td className="p-4">
                        {temAlergia || temDoenca ? (
                          <div className="inline-flex flex-col gap-1 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
                            <span className="text-[10px] font-black uppercase text-red-700">
                              ⚠️ Alerta Clínico
                            </span>
                            <span className="text-xs font-bold text-red-900 truncate max-w-[180px]">
                              {temAlergia
                                ? res.crianca.restricoes_alimentares
                                : res.crianca.doencas_cronicas}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                            ✓ Sem restrições
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-800">
                          {res.pai.nome}
                        </div>
                        <div className="text-xs text-slate-500">
                          📞 {res.pai.telefone}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-black text-slate-900">
                          {res.valor.toFixed(2)}€
                        </div>
                        <span
                          className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            res.status === "Pago" || res.status === "Sinal Pago"
                              ? "bg-emerald-100 text-[#167524]"
                              : res.status === "Aguardando Pagamento Extra"
                              ? "bg-amber-100 text-amber-900"
                              : res.status === "Externo"
                              ? "bg-blue-100 text-[#0E3A68]"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReservaSelecionada(res);
                          }}
                          className="bg-slate-900 hover:bg-[#167524] text-white font-black uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                        >
                          {res.pedido_pendente
                            ? isEn
                              ? "📬 Review Extra"
                              : "📬 Analisar Extra"
                            : isEn
                            ? "Open Record"
                            : "Abrir Ficha"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL DE FICHA COMPLETA DA CRIANÇA + APROVAÇÃO DE PEDIDO EXTRA      */}
      {/* =================================================================== */}
      {reservaSelecionada && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={fecharModalReserva}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#167524] bg-emerald-50 px-3 py-1 rounded-full">
                  {reservaSelecionada.campo_nome} • {reservaSelecionada.turno}
                </span>
                <h2 className="text-2xl font-black text-slate-900 m-0 mt-2">
                  👦 {reservaSelecionada.crianca.nome}
                </h2>
                <p className="text-xs font-bold text-slate-400 m-0 mt-1">
                  Reserva #{reservaSelecionada.id.split("-")[0]} •{" "}
                  {new Date(reservaSelecionada.created_at).toLocaleString(
                    "pt-PT"
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={fecharModalReserva}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* BLOCO DE PEDIDO DE ALTERAÇÃO / EXTRA PENDENTE DO PAI */}
            {reservaSelecionada.pedido_pendente && (
              <div className="my-6 bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <span className="text-xs font-black uppercase tracking-widest text-amber-900">
                    📬{" "}
                    {isEn
                      ? "Parent's Change / Extra Request:"
                      : "Pedido de Alteração / Extra Enviado pelo Pai:"}
                  </span>
                </div>
                <p className="text-sm font-bold text-amber-950 italic bg-white p-4 rounded-xl border border-amber-200 mb-4">
                  "{reservaSelecionada.pedido_pendente}"
                </p>

                {!isAjusteModalOpen ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAjusteForm({
                          valor: 25,
                          motivo: reservaSelecionada.pedido_pendente,
                        });
                        setIsAjusteModalOpen(true);
                      }}
                      className="bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs px-5 py-3 rounded-xl cursor-pointer shadow-sm"
                    >
                      💶{" "}
                      {isEn
                        ? "Approve & Send Extra Charge"
                        : "Aprovar e Lançar Cobrança Extra"}
                    </button>
                    <button
                      type="button"
                      onClick={handleMarcarPedidoResolvidoSemCusto}
                      disabled={savingAjuste}
                      className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-black uppercase tracking-widest text-xs px-4 py-3 rounded-xl cursor-pointer"
                    >
                      ✓{" "}
                      {isEn
                        ? "Approve Without Extra Cost"
                        : "Aprovar Sem Custo Adicional"}
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmeterAjuste}
                    className="bg-white p-4 rounded-xl border border-amber-200 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                          Descrição do Extra / Alteração *
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
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                          Valor a Cobrar (€) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          required
                          value={ajusteForm.valor}
                          onChange={(e) =>
                            setAjusteForm({
                              ...ajusteForm,
                              valor: Number(e.target.value),
                            })
                          }
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-[#167524]"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAjusteModalOpen(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-500 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savingAjuste}
                        className="bg-[#167524] text-white font-black uppercase tracking-widest text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                      >
                        {savingAjuste
                          ? "A enviar..."
                          : "Confirmar e Enviar para Pagamento"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* DADOS CLÍNICOS E LOGÍSTICOS DA CRIANÇA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 m-0 mb-2">
                  🏥 Ficha Médica e Participante
                </h3>
                <p className="text-xs m-0">
                  <strong>Data Nascimento / Idade:</strong>{" "}
                  {reservaSelecionada.crianca.data_nascimento} (
                  {reservaSelecionada.crianca.idade_formatada})
                </p>
                <p className="text-xs m-0">
                  <strong>Alergias / Alimentação:</strong>{" "}
                  <span className="text-red-600 font-bold">
                    {reservaSelecionada.crianca.restricoes_alimentares}
                  </span>
                </p>
                <p className="text-xs m-0">
                  <strong>Doenças Crónicas:</strong>{" "}
                  {reservaSelecionada.crianca.doencas_cronicas}
                </p>
                <p className="text-xs m-0">
                  <strong>Medicação Regular:</strong>{" "}
                  {reservaSelecionada.crianca.medicacao_regular}
                </p>
                <p className="text-xs m-0">
                  <strong>Sabe Nadar:</strong>{" "}
                  {reservaSelecionada.crianca.sabe_nadar} |{" "}
                  <strong>T-Shirt:</strong>{" "}
                  {reservaSelecionada.crianca.tamanho_tshirt}
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 m-0 mb-2">
                  👨‍👩‍👧 Contactos do Encarregado de Educação
                </h3>
                <p className="text-xs m-0">
                  <strong>Nome:</strong> {reservaSelecionada.pai.nome}
                </p>
                <p className="text-xs m-0">
                  <strong>E-mail:</strong> {reservaSelecionada.pai.email}
                </p>
                <p className="text-xs m-0">
                  <strong>Telefone:</strong> {reservaSelecionada.pai.telefone}
                </p>
                <p className="text-xs m-0">
                  <strong>Contacto Emergência:</strong>{" "}
                  {reservaSelecionada.pai.contacto_emergencia}
                </p>
                <p className="text-xs m-0">
                  <strong>NIF Faturação:</strong> {reservaSelecionada.pai.nif}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-xs font-bold text-slate-500">
                  Valor Total:{" "}
                </span>
                <span className="text-lg font-black text-[#167524]">
                  {reservaSelecionada.valor.toFixed(2)}€
                </span>
              </div>
              <div className="flex gap-2">
                {!reservaSelecionada.pedido_pendente && (
                  <button
                    type="button"
                    onClick={() => setIsAjusteModalOpen(!isAjusteModalOpen)}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-black uppercase tracking-widest text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                  >
                    + Lançar Extra / Ajuste Financeiro
                  </button>
                )}
                <button
                  type="button"
                  onClick={fecharModalReserva}
                  className="bg-slate-900 text-white font-black uppercase tracking-widest text-xs px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL DE INSERIR INSCRIÇÃO EXTERNA MANUAL (COM DROPDOWNS CUSTOM)    */}
      {/* =================================================================== */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-slate-900 m-0 mb-4">
              +{" "}
              {isEn
                ? "Add External Participant"
                : "Registar Inscrição Externa / Presencial"}
            </h3>
            <form onSubmit={handleAddExterno} className="space-y-4">
              {/* Dropdown Customizado de Campo */}
              <div className="relative">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Programa / Campo *
                </label>
                <div
                  onClick={() => setIsModalCampoOpen(!isModalCampoOpen)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 cursor-pointer flex justify-between items-center"
                >
                  <span>
                    {camposParceiro.find((c) => c.id === formExterno.campo_id)
                      ?.nome || "Selecionar Campo..."}
                  </span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </div>
                {isModalCampoOpen && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                    {camposParceiro.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setFormExterno({ ...formExterno, campo_id: c.id });
                          setIsModalCampoOpen(false);
                        }}
                        className="p-3 text-xs font-bold hover:bg-emerald-50 cursor-pointer"
                      >
                        {c.nome}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Turno / Semana *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Semana 1"
                    value={formExterno.turno_nome}
                    onChange={(e) =>
                      setFormExterno({
                        ...formExterno,
                        turno_nome: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Valor Pago (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formExterno.valor_pago}
                    onChange={(e) =>
                      setFormExterno({
                        ...formExterno,
                        valor_pago: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-[#167524]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Nome da Criança *
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
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Idade
                  </label>
                  <input
                    type="number"
                    value={formExterno.idade}
                    onChange={(e) =>
                      setFormExterno({ ...formExterno, idade: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Alergias / Observações Médicas
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nenhuma"
                  value={formExterno.alergias}
                  onChange={(e) =>
                    setFormExterno({ ...formExterno, alergias: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Nome do Pai/Mãe
                  </label>
                  <input
                    type="text"
                    value={formExterno.nome_pai}
                    onChange={(e) =>
                      setFormExterno({
                        ...formExterno,
                        nome_pai: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Telefone de Contacto
                  </label>
                  <input
                    type="text"
                    value={formExterno.telefone_pai}
                    onChange={(e) =>
                      setFormExterno({
                        ...formExterno,
                        telefone_pai: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingExterno}
                  className="bg-[#167524] text-white font-black uppercase tracking-widest text-xs px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  {savingExterno ? "..." : "Guardar Inscrição"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
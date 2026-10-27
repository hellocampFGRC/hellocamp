"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

const limparNomeParaExibicao = (nomeCru: string) => {
  if (!nomeCru) return "";
  return nomeCru.split("(")[0].split("- Dia")[0].split("- Day")[0].trim();
};

export default function GestaoReservasParceiro({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const capitalize = (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<any>(null);

  // Dados Core
  const [camposParceiro, setCamposParceiro] = useState<any[]>([]);
  const [todasReservas, setTodasReservas] = useState<any[]>([]);

  // Filtros
  const [filtroCampoId, setFiltroCampoId] = useState<string>("todos");
  const [filtroTurno, setFiltroTurno] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("ativas"); // 'ativas' | 'todas' | 'pendentes'
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filtroModo, setFiltroModo] = useState<"pacote" | "dia_solto">("pacote");
  const [filtroMesAtual, setFiltroMesAtual] = useState<Date>(new Date());
  const [filtroDiaSelecionado, setFiltroDiaSelecionado] = useState<string>("");

  // UI States (Modais)
  const [reservaSelecionada, setReservaSelecionada] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<"selecao" | "manual" | "excel">("selecao");
  const [savingExterno, setSavingExterno] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Estados do Modal de Inserção Externa
  const [modalidadeExterna, setModalidadeExterna] = useState<"pacote" | "dia_solto">("pacote");
  const [modalMesAtual, setModalMesAtual] = useState<Date>(new Date());
  const [diaExterno, setDiaExterno] = useState<string>("");
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

  // Estados de Gestão Financeira (Upsell/Ajuste)
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [savingAjuste, setSavingAjuste] = useState(false);
  const [ajusteForm, setAjusteForm] = useState({ valor: 0, motivo: "" });

  const customSelectStyle = {
    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 1rem center",
    backgroundSize: "0.75rem auto",
    appearance: "none" as const,
  };

  // Helper para gerar dias válidos a partir do calendário de funcionamento do campo
  const gerarDatasDoCalendario = (cal: any): string[] => {
    if (!cal || !cal.data_inicio || !cal.data_fim) return [];
    const datas: string[] = [];
    const inicio = new Date(cal.data_inicio);
    const fim = new Date(cal.data_fim);
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return [];

    const diasSemanaPermitidos: number[] = Array.isArray(cal.dias_semana)
      ? cal.dias_semana
      : [1, 2, 3, 4, 5];
    const diasFechados: string[] = Array.isArray(cal.dias_fechados) ? cal.dias_fechados : [];

    const curr = new Date(inicio);
    let safety = 0;
    while (curr <= fim && safety < 400) {
      safety++;
      const iso = curr.toISOString().split("T")[0];
      const diaSem = curr.getDay(); // 0 = Dom, 1 = Seg...
      if (diasSemanaPermitidos.includes(diaSem) && !diasFechados.includes(iso)) {
        datas.push(iso);
      }
      curr.setDate(curr.getDate() + 1);
    }
    return datas;
  };

  const calcularIdade = (dataNasc?: string) => {
    if (!dataNasc || dataNasc === "N/A") return null;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    if (isNaN(nasc.getTime())) return null;
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    setSessionUser(session.user);

    const { data: camposData } = await supabase
      .from("campos")
      .select("id, nome, nome_en, vagas_totais, pacotes, calendario_funcionamento")
      .eq("organizador_id", session.user.id);

    setCamposParceiro(camposData || []);

    // JOIN COMPLETO COM A TABELA CRIANCAS E PERFIS DO CLIENTE
    const { data: reservasData, error: resError } = await supabase
      .from("reservas")
      .select(
        `
        *,
        criancas (
          id, nome, nif, data_nascimento, sexo, tipo_sanguineo,
          restricoes_alimentares, doencas_cronicas, medicacao_regular,
          limitacoes_fisicas, sabe_nadar, sabe_andar_bicicleta,
          tamanho_tshirt, nivel_ingles, fobias_medos,
          perfil_comportamental, autorizacao_fotografia
        ),
        perfis:cliente_id (
          nome_completo, email, telefone, nif, contacto_emergencia
        )
      `
      )
      .eq("organizador_id", session.user.id)
      .order("created_at", { ascending: false });

    if (resError) {
      console.error("Erro ao buscar reservas:", resError);
      setLoading(false);
      return;
    }

    if (reservasData) {
      const reservasFormatadas = reservasData.map((res: any) => {
        const campoRelacionado = camposData?.find((c: any) => c.id === res.campo_id);
        const criancaDb = Array.isArray(res.criancas) ? res.criancas[0] : res.criancas;
        const paiDb = Array.isArray(res.perfis) ? res.perfis[0] : res.perfis;

        // Detetar se uma reserva 'Pendente' tem mais de 30 minutos (Carrinho Abandonado)
        const minutosPassados =
          (new Date().getTime() - new Date(res.created_at).getTime()) / (1000 * 60);
        let statusFinal = res.status_pagamento || "Pendente";
        if (statusFinal === "Pendente" && minutosPassados > 30) {
          statusFinal = "Abandonada";
        }

        const idadeCalc = calcularIdade(criancaDb?.data_nascimento);

        return {
          id: res.id,
          created_at: res.created_at,
          campo_id: res.campo_id,
          cliente_id: res.cliente_id,
          campo_nome: campoRelacionado
            ? isEn && campoRelacionado.nome_en
              ? campoRelacionado.nome_en
              : campoRelacionado.nome
            : "Campo Indefinido",
          turno: res.turno_nome || "Turno Base",
          valor: Number(res.valor_total) || 0,
          valor_pago: Number(res.valor_pago) || 0,
          valor_em_falta: Number(res.valor_em_falta) || 0,
          status: statusFinal,
          isExterna:
            res.status_pagamento === "Externo" || res.cliente_id === session.user.id,
          crianca: {
            nome:
              criancaDb?.nome ||
              res.respostas_customizadas?.nome_crianca ||
              "Participante",
            idade:
              idadeCalc !== null
                ? `${idadeCalc} anos`
                : res.respostas_customizadas?.idade_crianca
                ? `${res.respostas_customizadas.idade_crianca} anos`
                : "N/D",
            data_nascimento: criancaDb?.data_nascimento || "N/A",
            sexo: criancaDb?.sexo || "N/D",
            nif: criancaDb?.nif || "N/D",
            tipo_sanguineo: criancaDb?.tipo_sanguineo || "N/D",
            restricoes_alimentares:
              criancaDb?.restricoes_alimentares ||
              res.respostas_customizadas?.alergias ||
              "Nenhuma",
            doencas_cronicas:
              criancaDb?.doencas_cronicas ||
              res.respostas_customizadas?.doencas ||
              "Nenhuma",
            medicacao_regular: criancaDb?.medicacao_regular || "Nenhuma",
            limitacoes_fisicas: criancaDb?.limitacoes_fisicas || "Nenhuma",
            sabe_nadar: criancaDb?.sabe_nadar || "N/D",
            sabe_andar_bicicleta: criancaDb?.sabe_andar_bicicleta || "N/D",
            tamanho_tshirt: criancaDb?.tamanho_tshirt || "N/D",
            nivel_ingles: criancaDb?.nivel_ingles || "N/D",
            fobias_medos: criancaDb?.fobias_medos || "Nenhuma",
            perfil_comportamental: criancaDb?.perfil_comportamental || "N/D",
            autorizacao_fotografia:
              criancaDb?.autorizacao_fotografia || "Não especificado",
          },
          pai: {
            nome: res.nome_encarregado || paiDb?.nome_completo || "N/D",
            email: res.email_encarregado || paiDb?.email || "N/D",
            telefone: res.telefone_encarregado || paiDb?.telefone || "N/D",
            nif: res.nif_encarregado || paiDb?.nif || "S/ NIF",
            contacto_emergencia: paiDb?.contacto_emergencia || "N/D",
          },
          extrasEscolhidos: res.extras_escolhidos || {},
          respostasCustomizadas: res.respostas_customizadas || {},
          pedido_pendente: res.respostas_customizadas?.pedido_pai_pendente || null,
        };
      });
      setTodasReservas(reservasFormatadas);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isEn]);

  useEffect(() => {
    setFiltroTurno("todos");
    setFiltroDiaSelecionado("");
    setIsFilterPanelOpen(false);
  }, [filtroCampoId]);

  // Cálculos de Pacotes e Calendário para o Filtro Superior
  const campoFiltroObj = camposParceiro.find((c: any) => c.id === filtroCampoId);
  const todosPacotesFiltro: any[] = Array.isArray(campoFiltroObj?.pacotes)
    ? campoFiltroObj.pacotes
    : [];
  const pacotesFiltro = todosPacotesFiltro.filter((p: any) => p.tipo !== "dia");
  const diasSoltosFiltro = todosPacotesFiltro.filter((p: any) => p.tipo === "dia");
  const datasUnicasFiltro = gerarDatasDoCalendario(campoFiltroObj?.calendario_funcionamento);

  const nextMonthFiltro = () =>
    setFiltroMesAtual(new Date(filtroMesAtual.getFullYear(), filtroMesAtual.getMonth() + 1, 1));
  const prevMonthFiltro = () =>
    setFiltroMesAtual(new Date(filtroMesAtual.getFullYear(), filtroMesAtual.getMonth() - 1, 1));
  const datasFiltroVisiveis = datasUnicasFiltro.filter((d) => {
    const date = new Date(d);
    return (
      date.getMonth() === filtroMesAtual.getMonth() &&
      date.getFullYear() === filtroMesAtual.getFullYear()
    );
  });

  // Cálculos de Pacotes e Calendário para o Modal de Inserção Manual
  const campoModalObj = camposParceiro.find((c: any) => c.id === formExterno.campo_id);
  const todosPacotesModal: any[] = Array.isArray(campoModalObj?.pacotes)
    ? campoModalObj.pacotes
    : [];
  const pacotesModal = todosPacotesModal.filter((p: any) => p.tipo !== "dia");
  const diasSoltosModal = todosPacotesModal.filter((p: any) => p.tipo === "dia");
  const datasUnicasModal = gerarDatasDoCalendario(campoModalObj?.calendario_funcionamento);

  const nextMonthModal = () =>
    setModalMesAtual(new Date(modalMesAtual.getFullYear(), modalMesAtual.getMonth() + 1, 1));
  const prevMonthModal = () =>
    setModalMesAtual(new Date(modalMesAtual.getFullYear(), modalMesAtual.getMonth() - 1, 1));
  const datasModalVisiveis = datasUnicasModal.filter((d) => {
    const date = new Date(d);
    return (
      date.getMonth() === modalMesAtual.getMonth() &&
      date.getFullYear() === modalMesAtual.getFullYear()
    );
  });

  const setTurnoEscolhido = (pacoteTitulo: string, variante: any) => {
    const sufixoDia =
      modalidadeExterna === "dia_solto" && diaExterno ? ` - Dia ${diaExterno}` : "";
    const nomeCompletoTurno = `${pacoteTitulo} (${variante.nome})${sufixoDia}`;
    setFormExterno((prev) => ({
      ...prev,
      turno_nome: nomeCompletoTurno,
      valor_pago: Number(variante.preco) || 0,
    }));
  };

  // Filtragem de Reservas na Tabela
  let reservasFiltradas = [...todasReservas];

  if (filtroEstado === "ativas") {
    reservasFiltradas = reservasFiltradas.filter(
      (r: any) =>
        r.status === "Pago" ||
        r.status === "Sinal Pago" ||
        r.status === "Externo" ||
        r.pedido_pendente != null
    );
  } else if (filtroEstado === "pendentes") {
    reservasFiltradas = reservasFiltradas.filter(
      (r: any) =>
        r.status === "Pendente" ||
        r.status === "Abandonada" ||
        r.status === "Reembolsado" ||
        r.status === "Cancelada"
    );
  }

  if (filtroCampoId !== "todos") {
    reservasFiltradas = reservasFiltradas.filter((r: any) => r.campo_id === filtroCampoId);
  }
  if (filtroTurno !== "todos") {
    reservasFiltradas = reservasFiltradas.filter((r: any) => {
      const matchTurno =
        r.turno && r.turno.toLowerCase().includes(filtroTurno.toLowerCase());
      const matchDiaSolto =
        Array.isArray(r.extrasEscolhidos?.dias_soltos) &&
        r.extrasEscolhidos.dias_soltos.includes(filtroTurno);
      return matchTurno || matchDiaSolto;
    });
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    reservasFiltradas = reservasFiltradas.filter(
      (r: any) =>
        (r.crianca?.nome || "").toLowerCase().includes(q) ||
        (r.pai?.nome || "").toLowerCase().includes(q) ||
        (r.pai?.email || "").toLowerCase().includes(q)
    );
  }

  const validas = todasReservas.filter(
    (r: any) =>
      r.status === "Pago" || r.status === "Sinal Pago" || r.status === "Externo"
  );
  const countHelloCamp = validas.filter((r: any) => !r.isExterna).length;
  const countExternas = validas.filter((r: any) => r.isExterna).length;

  const fecharModalReserva = () => {
    setReservaSelecionada(null);
    setIsAjusteModalOpen(false);
    setAjusteForm({ valor: 0, motivo: "" });
  };

  // Submissão de Cobrança Adicional / Aprovação de Pedido do Pai
  const handleSubmeterAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaSelecionada) return;
    if (!ajusteForm.motivo.trim() || ajusteForm.valor <= 0) {
      return alert("Preencha o motivo e um valor superior a 0€.");
    }

    setSavingAjuste(true);
    try {
      const novoValorTotal = Number(reservaSelecionada.valor) + Number(ajusteForm.valor);
      const novoValorEmFalta =
        Number(reservaSelecionada.valor_em_falta || 0) + Number(ajusteForm.valor);

      const respostasAtuais = { ...(reservaSelecionada.respostasCustomizadas || {}) };
      const pedidoAnterior = respostasAtuais.pedido_pai_pendente;
      delete respostasAtuais.pedido_pai_pendente;

      const historicoAjustes = Array.isArray(respostasAtuais.historico_ajustes)
        ? respostasAtuais.historico_ajustes
        : [];
      historicoAjustes.push({
        data: new Date().toISOString(),
        motivo: ajusteForm.motivo.trim(),
        valor: Number(ajusteForm.valor),
        pedido_original: pedidoAnterior || null,
      });
      respostasAtuais.historico_ajustes = historicoAjustes;

      // Muda para 'Sinal Pago' se estava 'Pago' para ativar o botão de pagar remanescente no Dashboard do Pai!
      const novoStatus =
        reservaSelecionada.status === "Pago" ? "Sinal Pago" : reservaSelecionada.status;

      const { error: updateErr } = await supabase
        .from("reservas")
        .update({
          valor_total: novoValorTotal,
          valor_em_falta: novoValorEmFalta,
          status_pagamento: novoStatus,
          status: novoStatus,
          respostas_customizadas: respostasAtuais,
        })
        .eq("id", reservaSelecionada.id);

      if (updateErr) throw updateErr;

      // Envia mensagem automática para a Inbox do Pai a avisar que já pode pagar o extra
      if (reservaSelecionada.cliente_id && sessionUser?.id) {
        await supabase.from("mensagens").insert([
          {
            campo_id: reservaSelecionada.campo_id,
            sender_id: sessionUser.id,
            receiver_id: reservaSelecionada.cliente_id,
            texto: `💳 [Pedido Aprovado / Valor Adicional]\nFoi adicionado o extra "${ajusteForm.motivo.trim()}" (+${Number(
              ajusteForm.valor
            ).toFixed(
              2
            )}€) à inscrição de ${reservaSelecionada.crianca?.nome}.\n\nPode liquidar este valor pendente diretamente no seu Painel de Cliente em "As Minhas Reservas".`,
            lida: false,
          },
        ]);
      }

      alert(
        isEn
          ? "Extra charge added! The parent can now pay the balance in their dashboard."
          : "Valor adicional lançado com sucesso! O encarregado de educação já pode liquidar a diferença no seu Portal de Cliente."
      );
      fecharModalReserva();
      fetchDashboardData();
    } catch (err: any) {
      alert("Erro ao lançar ajuste: " + err.message);
    } finally {
      setSavingAjuste(false);
    }
  };

  const handleAddExterno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formExterno.turno_nome) {
      return alert("Por favor, selecione uma opção válida de pacote.");
    }
    setSavingExterno(true);

    try {
      const { error: errR } = await supabase.from("reservas").insert({
        organizador_id: sessionUser.id,
        cliente_id: sessionUser.id,
        campo_id: formExterno.campo_id,
        turno_nome: formExterno.turno_nome,
        valor_total: formExterno.valor_pago,
        valor_pago: formExterno.valor_pago,
        status_pagamento: "Externo",
        nome_encarregado: formExterno.nome_pai,
        email_encarregado: formExterno.email_pai,
        telefone_encarregado: formExterno.telefone_pai,
        respostas_customizadas: {
          origem: "Inserção Manual 1 a 1",
          nome_crianca: formExterno.nome_crianca,
          idade_crianca: formExterno.idade,
          alergias: formExterno.alergias || "Nenhuma",
          doencas: formExterno.doencas || "Nenhuma",
        },
      });

      if (errR) throw errR;

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
        email_pai: "",
        telefone_pai: "",
      });
      fetchDashboardData();
      alert("Inscrição externa adicionada com sucesso!");
    } catch (err: any) {
      alert("Erro ao inserir: " + err.message);
    }
    setSavingExterno(false);
  };

  const exportarCSV = () => {
    if (reservasFiltradas.length === 0) {
      alert(
        isEn
          ? "No bookings in the current view to export."
          : "Não existem inscrições na vista atual para exportar."
      );
      return;
    }

    let csv =
      "\ufeffOrigem;Estado;Data Reserva;Programa;Turno;Valor Total;Valor Pago;Em Falta;Nome Participante;Idade;Data Nascimento;NIF Criança;Alergias Alimentares;Doenças Crónicas;Medicação Regular;Sabe Nadar;Tamanho T-Shirt;Autorização Foto;Encarregado de Educação;NIF Pai;Telefone;Contacto Emergência;Email\n";

    reservasFiltradas.forEach((item: any) => {
      const origem = item.isExterna ? "Externa" : "HelloCamp";
      const dataReserva = item.created_at
        ? new Date(item.created_at).toLocaleDateString("pt-PT")
        : "N/D";
      const clean = (val: any) =>
        String(val || "N/D")
          .replace(/;/g, ",")
          .replace(/\n/g, " ")
          .replace(/"/g, "'");

      csv += `"${origem}";"${clean(item.status)}";"${dataReserva}";"${clean(
        item.campo_nome
      )}";"${clean(item.turno)}";"${item.valor}€";"${item.valor_pago}€";"${
        item.valor_em_falta
      }€";"${clean(item.crianca?.nome)}";"${clean(item.crianca?.idade)}";"${clean(
        item.crianca?.data_nascimento
      )}";"${clean(item.crianca?.nif)}";"${clean(
        item.crianca?.restricoes_alimentares
      )}";"${clean(item.crianca?.doencas_cronicas)}";"${clean(
        item.crianca?.medicacao_regular
      )}";"${clean(item.crianca?.sabe_nadar)}";"${clean(
        item.crianca?.tamanho_tshirt
      )}";"${clean(item.crianca?.autorizacao_fotografia)}";"${clean(
        item.pai?.nome
      )}";"${clean(item.pai?.nif)}";"${clean(item.pai?.telefone)}";"${clean(
        item.pai?.contacto_emergencia
      )}";"${clean(item.pai?.email)}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Inscritos_HelloCamp_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplateCSV = () => {
    const csv =
      "\ufeffNome_do_Campo_Exato;Nome_do_Turno_Exato;Valor_Pago;Nome_Crianca;Idade;Alergias;Doencas;Nome_Responsavel;Telefone;Email\n" +
      "Surf Camp Caparica;1a Semana Julho;150;Joao Silva;12;Nenhuma;Asma;Maria Silva;912345678;maria@email.com\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Template_Importacao_HelloCamp.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async () => {
    if (!csvFile) return alert("Selecione um ficheiro CSV primeiro.");
    setSavingExterno(true);

    try {
      const text = await csvFile.text();
      const linhas = text.split("\n").filter((line: string) => line.trim().length > 0);

      if (linhas.length < 2) throw new Error("Ficheiro vazio ou sem dados válidos.");

      let sucessoCount = 0;
      for (let i = 1; i < linhas.length; i++) {
        const colunas = linhas[i].split(";");
        if (colunas.length < 9) continue;

        const [
          nomeCampoCSV,
          nomeTurno,
          valorPago,
          nomeCrianca,
          idade,
          alergias,
          doencas,
          nomePai,
          telefone,
          email,
        ] = colunas.map((c: string) => c.trim().replace(/"/g, ""));

        const campoAlvo = camposParceiro.find(
          (c: any) => c.nome.toLowerCase() === nomeCampoCSV.toLowerCase()
        );
        if (!campoAlvo) continue;

        await supabase.from("reservas").insert({
          organizador_id: sessionUser.id,
          cliente_id: sessionUser.id,
          campo_id: campoAlvo.id,
          turno_nome: nomeTurno,
          valor_total: Number(valorPago) || 0,
          valor_pago: Number(valorPago) || 0,
          status_pagamento: "Externo",
          nome_encarregado: nomePai,
          email_encarregado: email || "",
          telefone_encarregado: telefone,
          respostas_customizadas: {
            origem: "Importação via Excel/CSV",
            nome_crianca: nomeCrianca,
            idade_crianca: idade,
            alergias: alergias || "Nenhuma",
            doencas: doencas || "Nenhuma",
          },
        });
        sucessoCount++;
      }

      setIsAddModalOpen(false);
      setImportMode("selecao");
      setCsvFile(null);
      fetchDashboardData();
      alert(`Importação concluída! ${sucessoCount} inscrições inseridas com sucesso.`);
    } catch (err: any) {
      alert("Erro ao processar ficheiro: " + err.message);
    }
    setSavingExterno(false);
  };

  if (loading) {
    return (
      <div className="p-20 text-center font-bold text-slate-500 animate-pulse">
        {isEn ? "Loading bookings & medical records..." : "A carregar reservas e fichas clínicas..."}
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 font-sans pb-24 relative">
      {/* HEADER & AÇÕES GLOBAIS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 m-0 tracking-tight">
            {isEn ? "Booking Operations" : "Central de Reservas"}
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-sm">
            {isEn
              ? "Manage HelloCamp bookings, participant health records, and manual entries."
              : "Gira inscrições da HelloCamp, fichas médicas completas e inscrições manuais num só local."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={exportarCSV}
            className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors text-xs uppercase tracking-widest text-center cursor-pointer"
          >
            📥 {isEn ? "Export List (Excel)" : "Exportar Lista (Excel)"}
          </button>
          <button
            onClick={() => {
              setImportMode("selecao");
              setIsAddModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#167524] text-white font-bold rounded-xl shadow-md hover:bg-[#115a1b] transition-all text-xs uppercase tracking-widest text-center cursor-pointer"
          >
            + {isEn ? "Add Manual Booking" : "Adicionar Inscrições"}
          </button>
        </div>
      </div>

      {/* MÉTRICAS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col justify-center border-b-4 border-b-[#167524] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#167524]/5 rounded-full flex items-center justify-center opacity-50 text-4xl">
            🟢
          </div>
          <span className="text-[10px] font-black text-[#167524] uppercase tracking-widest mb-2 relative z-10">
            {isEn ? "Source: HelloCamp (Paid)" : "Origem: HelloCamp (Confirmadas)"}
          </span>
          <div className="flex items-baseline justify-between relative z-10">
            <span className="text-5xl font-black text-slate-900">{countHelloCamp}</span>
          </div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col justify-center border-b-4 border-b-slate-400 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center opacity-50 text-4xl">
            ⚪
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10">
            {isEn ? "Source: External / Manual" : "Origem: Externos / Manuais"}
          </span>
          <div className="flex items-baseline justify-between relative z-10">
            <span className="text-5xl font-black text-slate-900">{countExternas}</span>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm mb-8 flex flex-col lg:flex-row gap-4 relative z-20">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
            {isEn ? "Search Name or Email" : "Procurar Nome ou Email"}
          </label>
          <input
            type="text"
            placeholder={
              isEn
                ? "Search child or parent name..."
                : "Pesquisar participante ou encarregado..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-medium outline-none focus:border-[#167524]"
          />
        </div>

        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
            {isEn ? "Filter by Camp" : "Filtrar Campo"}
          </label>
          <select
            value={filtroCampoId}
            onChange={(e) => {
              setFiltroCampoId(e.target.value);
              setFiltroTurno("todos");
            }}
            style={customSelectStyle}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm outline-none focus:border-[#167524] font-bold text-slate-700 cursor-pointer"
          >
            <option value="todos">{isEn ? "All Camps" : "Todos os Campos"}</option>
            {camposParceiro.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full lg:w-64">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
            {isEn ? "Booking Status" : "Estado da Reserva"}
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={customSelectStyle}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm outline-none focus:border-[#167524] font-bold text-slate-700 cursor-pointer"
          >
            <option value="ativas">
              {isEn ? "✓ Confirmed & Active" : "✓ Confirmadas e Ativas"}
            </option>
            <option value="todas">{isEn ? "All Records" : "Todas (Inclui Pendentes)"}</option>
            <option value="pendentes">
              {isEn ? "Abandoned / Cancelled" : "Abandonadas / Reembolsadas"}
            </option>
          </select>
        </div>

        {/* BOTÃO DO FILTRO DE CALENDÁRIO / TURNO */}
        {filtroCampoId !== "todos" && (
          <div className="flex-1 relative animate-in fade-in">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              {isEn ? "Filter by Pass / Date" : "Filtrar por Passe/Data"}
            </label>
            <div
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`w-full border rounded-xl px-5 py-3.5 text-sm font-bold cursor-pointer flex justify-between items-center transition-colors ${
                filtroTurno === "todos"
                  ? "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                  : "bg-[#167524]/10 border-[#167524] text-[#167524]"
              }`}
            >
              <span className="truncate">
                {filtroTurno === "todos"
                  ? isEn
                    ? "All Options"
                    : "Todas as Opções"
                  : limparNomeParaExibicao(filtroTurno)}
              </span>
              <span className="text-slate-400 text-[10px]">▼</span>
            </div>

            {isFilterPanelOpen && (
              <>
                <div
                  className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm"
                  onClick={() => setIsFilterPanelOpen(false)}
                ></div>
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[420px] bg-white rounded-[2rem] shadow-2xl z-[200] p-6 md:p-8 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
                      Filtrar por Passe
                    </span>
                    <div className="flex gap-2">
                      {filtroTurno !== "todos" && (
                        <button
                          onClick={() => {
                            setFiltroTurno("todos");
                            setIsFilterPanelOpen(false);
                          }}
                          className="text-[10px] font-black text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors"
                        >
                          Limpar &times;
                        </button>
                      )}
                      <button
                        onClick={() => setIsFilterPanelOpen(false)}
                        className="text-[10px] font-black text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>

                  {pacotesFiltro.length > 0 && diasSoltosFiltro.length > 0 && (
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
                      <button
                        onClick={() => setFiltroModo("pacote")}
                        className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                          filtroModo === "pacote"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        Semanas Completas
                      </button>
                      <button
                        onClick={() => setFiltroModo("dia_solto")}
                        className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                          filtroModo === "dia_solto"
                            ? "bg-white text-[#167524] shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        Dias Soltos
                      </button>
                    </div>
                  )}

                  {filtroModo === "pacote" && (
                    <div className="flex flex-col gap-3">
                      {pacotesFiltro.map((pac: any) => (
                        <div
                          key={pac.id}
                          onClick={() => {
                            setFiltroTurno(pac.titulo);
                            setIsFilterPanelOpen(false);
                          }}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                            filtroTurno === pac.titulo
                              ? "bg-[#167524]/10 border-[#167524]"
                              : "bg-white border-slate-200 hover:border-[#167524]/50"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-black text-slate-800 m-0">
                              {pac.titulo}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1 font-bold">
                              Variantes: {pac.variantes?.length || 0}
                            </p>
                          </div>
                          <span className="text-xl bg-slate-100 p-2.5 rounded-xl leading-none">
                            🗓️
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {filtroModo === "dia_solto" && (
                    <div>
                      <div className="flex items-center justify-between mb-5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                        <button
                          type="button"
                          onClick={prevMonthFiltro}
                          className="p-2 w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-400 hover:text-[#167524] transition-colors font-black"
                        >
                          &larr;
                        </button>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-700">
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
                          className="p-2 w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-400 hover:text-[#167524] transition-colors font-black"
                        >
                          &rarr;
                        </button>
                      </div>

                      <div className="grid grid-cols-5 gap-2 mb-2">
                        {datasFiltroVisiveis.length === 0 ? (
                          <div className="col-span-5 text-center text-xs font-bold text-slate-400 py-6">
                            Nenhum dia de campo neste mês.
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
                                className={`flex flex-col items-center justify-center py-3 rounded-2xl border-2 cursor-pointer transition-all ${
                                  isActive
                                    ? "bg-[#167524] border-[#167524] text-white shadow-md scale-105"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-[#167524]/50"
                                }`}
                              >
                                <span
                                  className={`text-[9px] font-black uppercase mb-1 ${
                                    isActive ? "text-white/80" : "text-slate-400"
                                  }`}
                                >
                                  {dateObj
                                    .toLocaleDateString("pt-PT", { weekday: "short" })
                                    .replace(".", "")}
                                </span>
                                <span className="text-lg font-black leading-none">
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

      {/* TABELA DE RESERVAS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Participante & Encarregado
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Campo / Passe Contratado
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Estado Clínico
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Origem / Pagamento
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-slate-400 font-bold text-sm"
                  >
                    Nenhum resultado encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                reservasFiltradas.map((item: any) => {
                  const isInativa =
                    item.status === "Abandonada" ||
                    item.status === "Cancelada" ||
                    item.status === "Reembolsado";
                  const isExterna = item.isExterna;

                  const txtAlergia = (item.crianca?.restricoes_alimentares || "").toLowerCase();
                  const txtDoenca = (item.crianca?.doencas_cronicas || "").toLowerCase();
                  const txtMedicacao = (item.crianca?.medicacao_regular || "").toLowerCase();

                  const alertaAlergia =
                    txtAlergia.length > 2 &&
                    !txtAlergia.includes("nenhum") &&
                    txtAlergia !== "não" &&
                    txtAlergia !== "nao";
                  const alertaDoenca =
                    txtDoenca.length > 2 &&
                    !txtDoenca.includes("nenhum") &&
                    !txtDoenca.includes("sem observ") &&
                    txtDoenca !== "não" &&
                    txtDoenca !== "nao";
                  const alertaMedicacao =
                    txtMedicacao.length > 2 &&
                    !txtMedicacao.includes("nenhum") &&
                    txtMedicacao !== "não" &&
                    txtMedicacao !== "nao";

                  const temRisco =
                    !isInativa && (alertaAlergia || alertaDoenca || alertaMedicacao);
                  const temPedidoAlteracao = item.pedido_pendente != null;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isInativa ? "opacity-50 grayscale" : ""
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                              isExterna
                                ? "bg-slate-100 text-slate-600"
                                : "bg-[#167524]/10 text-[#167524]"
                            }`}
                          >
                            {item.crianca?.nome ? item.crianca.nome.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-slate-900 m-0 text-sm truncate">
                                {item.crianca?.nome || "N/D"}
                              </p>
                              {item.crianca?.idade && item.crianca.idade !== "N/D" && (
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                  {item.crianca.idade}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium m-0 truncate mt-0.5">
                              👨‍👩‍👧 {item.pai?.nome} • 📞 {item.pai?.telefone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-[#167524] m-0 text-[11px] uppercase tracking-wider mb-1">
                          {item.campo_nome}
                        </p>
                        <p className="font-bold text-slate-800 m-0 text-xs leading-tight">
                          {item.turno || "Passe Global"}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        {temRisco ? (
                          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            ⚠️ Alerta Clínico
                          </span>
                        ) : (
                          <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md text-[10px] font-bold">
                            ✓ Sem restrições
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {temPedidoAlteracao ? (
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse">
                              📬 Pedido do Pai
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {item.valor}€
                            </span>
                          </div>
                        ) : isExterna ? (
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className="bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
                              ⚪ Externo / Manual
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {item.valor}€
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5 items-start">
                            <span
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                                item.status === "Pago" || item.status === "Sinal Pago"
                                  ? "bg-[#167524]/10 text-[#167524] border-[#167524]/20"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              🟢 HelloCamp • {item.status}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-900">
                                {item.valor}€
                              </span>
                              {item.valor_em_falta > 0 && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                  Falta: {item.valor_em_falta.toFixed(2)}€
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => setReservaSelecionada(item)}
                          className={`px-5 py-2.5 bg-white border rounded-xl text-xs font-bold transition-colors shadow-sm whitespace-nowrap cursor-pointer ${
                            temPedidoAlteracao
                              ? "border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white"
                              : "border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          Abrir Ficha
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

      {/* MODAL: ADICIONAR INSCRIÇÕES MANUAIS / EXCEL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-900 m-0 tracking-tight">
                  Adicionar Inscrições Externas
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1 mb-0">
                  Centralize os clientes que reservaram diretamente consigo (isento de comissão).
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setImportMode("selecao");
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white font-black transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              {importMode === "selecao" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full content-center py-8">
                  <button
                    onClick={() => setImportMode("manual")}
                    className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-slate-200 rounded-3xl hover:border-[#167524] hover:bg-[#167524]/5 transition-all group cursor-pointer bg-white"
                  >
                    <span className="text-5xl">✍️</span>
                    <span className="font-black text-slate-800 text-lg group-hover:text-[#167524]">
                      Adicionar Manualmente
                    </span>
                    <span className="text-xs font-medium text-slate-500 text-center leading-relaxed">
                      Selecionar Passes e Variantes de Preço configuradas individualmente.
                    </span>
                  </button>
                  <button
                    onClick={() => setImportMode("excel")}
                    className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-slate-200 rounded-3xl hover:border-slate-900 hover:bg-slate-50 transition-all group cursor-pointer bg-white"
                  >
                    <span className="text-5xl">📊</span>
                    <span className="font-black text-slate-800 text-lg group-hover:text-slate-900">
                      Importar Excel/CSV
                    </span>
                    <span className="text-xs font-medium text-slate-500 text-center leading-relaxed">
                      Fazer upload de um ficheiro CSV para importar inscrições em lote.
                    </span>
                  </button>
                </div>
              )}

              {importMode === "manual" && (
                <form
                  id="form-manual"
                  onSubmit={handleAddExterno}
                  className="flex flex-col gap-8"
                >
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <h3 className="text-[11px] font-black text-[#167524] uppercase tracking-widest mb-5">
                      1. Escolha do Programa e Variante de Preço
                    </h3>
                    <div className="flex flex-col gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase">
                          Programa/Campo de Férias
                        </label>
                        <select
                          required
                          value={formExterno.campo_id}
                          onChange={(e) => {
                            setFormExterno({
                              ...formExterno,
                              campo_id: e.target.value,
                              turno_nome: "",
                              valor_pago: 0,
                            });
                            setDiaExterno("");
                          }}
                          style={customSelectStyle}
                          className="w-full bg-white border border-slate-300 rounded-xl px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-[#167524] cursor-pointer shadow-sm"
                        >
                          <option value="">Selecione o Campo...</option>
                          {camposParceiro.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formExterno.campo_id && (
                        <div className="bg-white p-5 border border-slate-200 rounded-2xl animate-in fade-in space-y-5">
                          {pacotesModal.length > 0 && diasSoltosModal.length > 0 && (
                            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-4">
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
                                className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${
                                  modalidadeExterna === "pacote"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500"
                                }`}
                              >
                                Programa Inteiro (Pacote)
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
                                className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${
                                  modalidadeExterna === "dia_solto"
                                    ? "bg-white text-[#167524] shadow-sm"
                                    : "text-slate-500"
                                }`}
                              >
                                Dias Soltos Avulso
                              </button>
                            </div>
                          )}

                          {modalidadeExterna === "pacote" && pacotesModal.length > 0 && (
                            <div>
                              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                                Opções Semanais Disponíveis:
                              </span>
                              <div className="flex flex-col gap-3">
                                {pacotesModal.map((pac: any) => (
                                  <div
                                    key={pac.id}
                                    className="border border-slate-200 p-4 rounded-xl bg-slate-50/50"
                                  >
                                    <p className="text-xs font-black text-slate-800 mb-3">
                                      {pac.titulo}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {pac.variantes?.map((v: any, i: number) => {
                                        const isSelected =
                                          formExterno.turno_nome ===
                                          `${pac.titulo} (${v.nome})`;
                                        return (
                                          <div
                                            key={i}
                                            onClick={() => setTurnoEscolhido(pac.titulo, v)}
                                            className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                                              isSelected
                                                ? "bg-[#167524]/10 border-[#167524] text-[#167524]"
                                                : "bg-white border-slate-200 hover:border-[#167524]/50 text-slate-700"
                                            }`}
                                          >
                                            <p className="text-xs m-0 font-bold">{v.nome}</p>
                                            <p className="text-sm font-black mt-1">{v.preco}€</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {modalidadeExterna === "dia_solto" &&
                            diasSoltosModal.length > 0 && (
                              <div className="pt-2 border-t border-slate-100">
                                <span className="block text-[10px] font-black text-[#167524] uppercase tracking-widest mb-4">
                                  A. Clique no Dia Pretendido:
                                </span>

                                <div className="flex items-center justify-between mb-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                                  <button
                                    type="button"
                                    onClick={prevMonthModal}
                                    className="p-2 w-10 h-10 bg-white rounded-xl shadow-sm text-slate-400 hover:text-[#167524] transition-colors font-black"
                                  >
                                    &larr;
                                  </button>
                                  <span className="text-xs font-black uppercase tracking-widest text-slate-700">
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
                                    className="p-2 w-10 h-10 bg-white rounded-xl shadow-sm text-slate-400 hover:text-[#167524] transition-colors font-black"
                                  >
                                    &rarr;
                                  </button>
                                </div>

                                <div className="grid grid-cols-5 gap-2 mb-4">
                                  {datasModalVisiveis.length === 0 ? (
                                    <div className="col-span-5 text-center text-xs font-bold text-slate-400 py-6">
                                      Nenhum dia disponível neste mês.
                                    </div>
                                  ) : (
                                    datasModalVisiveis.map((data: string) => {
                                      const isActive = diaExterno === data;
                                      const dateObj = new Date(data);
                                      const diaSemana = dateObj
                                        .toLocaleDateString(isEn ? "en-GB" : "pt-PT", {
                                          weekday: "short",
                                        })
                                        .replace(".", "");
                                      const diaNumero = dateObj.toLocaleDateString(
                                        isEn ? "en-GB" : "pt-PT",
                                        { day: "2-digit" }
                                      );

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
                                          className={`flex flex-col items-center justify-center py-3 rounded-2xl cursor-pointer border-2 transition-all ${
                                            isActive
                                              ? "bg-[#167524] border-[#167524] text-white shadow-md scale-105"
                                              : "bg-slate-50 border-slate-200 text-slate-600 hover:border-[#167524]/50"
                                          }`}
                                        >
                                          <span
                                            className={`text-[9px] font-black uppercase mb-1 ${
                                              isActive ? "text-white/80" : "text-slate-400"
                                            }`}
                                          >
                                            {diaSemana}
                                          </span>
                                          <span className="text-base font-black leading-none">
                                            {diaNumero}
                                          </span>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>

                                {diaExterno && (
                                  <div className="border-t border-slate-200 pt-5 mt-5 animate-in fade-in">
                                    <span className="block text-[10px] font-black text-[#167524] uppercase tracking-widest mb-3">
                                      B. Escolha a Opção Diária:
                                    </span>
                                    <div className="flex flex-col gap-3">
                                      {diasSoltosModal.map((pac: any) => (
                                        <div
                                          key={pac.id}
                                          className="border border-slate-200 p-4 rounded-xl bg-slate-50/50"
                                        >
                                          <p className="text-xs font-black text-slate-800 mb-3">
                                            {pac.titulo}
                                          </p>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {pac.variantes?.map((v: any, i: number) => {
                                              const isSelected =
                                                formExterno.turno_nome.startsWith(
                                                  `${pac.titulo} (${v.nome})`
                                                );
                                              return (
                                                <div
                                                  key={i}
                                                  onClick={() =>
                                                    setTurnoEscolhido(pac.titulo, v)
                                                  }
                                                  className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                                                    isSelected
                                                      ? "bg-[#167524]/10 border-[#167524] text-[#167524]"
                                                      : "bg-white border-slate-200 hover:border-[#167524]/50 text-slate-700"
                                                  }`}
                                                >
                                                  <p className="text-xs m-0 font-bold">
                                                    {v.nome}
                                                  </p>
                                                  <p className="text-sm font-black mt-1">
                                                    {v.preco}€
                                                  </p>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                          {/* Fallback caso o campo ainda não tenha pacotes estruturados */}
                          {todosPacotesModal.length === 0 && (
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase">
                                Nome do Turno / Semana
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Ex: Semana 1 (Julho)"
                                value={formExterno.turno_nome}
                                onChange={(e) =>
                                  setFormExterno({
                                    ...formExterno,
                                    turno_nome: e.target.value,
                                  })
                                }
                                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#167524]"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="sm:col-span-2 mt-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase">
                          Confirmação: Valor Cobrado ao Cliente (€)
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
                          className="w-full p-4 bg-white border border-slate-300 rounded-xl text-base font-black text-slate-900 outline-none focus:border-[#167524] shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados do Participante */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5">
                      2. Dados do Participante
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase">
                          Nome Completo
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
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#167524]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase">
                          Idade (Anos)
                        </label>
                        <input
                          type="number"
                          required
                          value={formExterno.idade}
                          onChange={(e) =>
                            setFormExterno({ ...formExterno, idade: e.target.value })
                          }
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#167524]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-red-600 mb-2 uppercase">
                          Alergias Alimentares
                        </label>
                        <input
                          type="text"
                          value={formExterno.alergias}
                          onChange={(e) =>
                            setFormExterno({ ...formExterno, alergias: e.target.value })
                          }
                          placeholder="Ex: Amendoins, Lactose"
                          className="w-full p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-900 outline-none focus:border-red-500 placeholder-red-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-red-600 mb-2 uppercase">
                          Doenças / Medicação
                        </label>
                        <input
                          type="text"
                          value={formExterno.doencas}
                          onChange={(e) =>
                            setFormExterno({ ...formExterno, doencas: e.target.value })
                          }
                          placeholder="Ex: Asma, Bomba SOS"
                          className="w-full p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-900 outline-none focus:border-red-500 placeholder-red-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados do Pai */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5">
                      3. Encarregado de Educação
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase">
                          Nome do Responsável
                        </label>
                        <input
                          type="text"
                          required
                          value={formExterno.nome_pai}
                          onChange={(e) =>
                            setFormExterno({ ...formExterno, nome_pai: e.target.value })
                          }
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#167524]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase">
                          Telemóvel
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
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#167524]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formExterno.email_pai}
                          onChange={(e) =>
                            setFormExterno({ ...formExterno, email_pai: e.target.value })
                          }
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#167524]"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {importMode === "excel" && (
                <div className="flex flex-col gap-6 pt-4">
                  <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl text-center">
                    <span className="text-4xl block mb-4">📝</span>
                    <h3 className="text-lg font-black text-slate-900 mb-2">
                      Descarregue o Template CSV
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mb-6 max-w-sm mx-auto">
                      Mantenha os cabeçalhos intactos para a importação em lote funcionar
                      corretamente.
                    </p>
                    <button
                      onClick={downloadTemplateCSV}
                      className="px-6 py-3 bg-white border border-slate-300 text-slate-900 font-black uppercase tracking-widest text-[11px] rounded-xl shadow-sm hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      ⬇️ Download Template
                    </button>
                  </div>

                  <div className="bg-white border-2 border-dashed border-slate-300 p-8 rounded-3xl text-center hover:border-[#167524] transition-colors group">
                    <h3 className="text-base font-black text-slate-800 mb-4 group-hover:text-[#167524]">
                      Faça Upload do Ficheiro
                    </h3>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e: any) =>
                        setCsvFile(e.target.files ? e.target.files[0] : null)
                      }
                      className="block w-full max-w-xs mx-auto text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-colors cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
              {importMode !== "selecao" ? (
                <button
                  onClick={() => setImportMode("selecao")}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl transition-colors cursor-pointer bg-white"
                >
                  &larr; Voltar à Seleção
                </button>
              ) : (
                <div className="hidden sm:block"></div>
              )}

              <div className="flex w-full sm:w-auto gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setImportMode("selecao");
                  }}
                  className="flex-1 sm:flex-none px-6 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-sm cursor-pointer"
                >
                  Cancelar
                </button>

                {importMode === "manual" && (
                  <button
                    type="submit"
                    form="form-manual"
                    disabled={savingExterno || !formExterno.turno_nome}
                    className="flex-1 sm:flex-none px-8 py-3 font-black text-white bg-[#167524] rounded-xl hover:bg-[#115a1b] transition-all shadow-md text-sm disabled:opacity-50 uppercase tracking-widest cursor-pointer"
                  >
                    {savingExterno ? "A Guardar..." : "✓ Inserir Reserva"}
                  </button>
                )}

                {importMode === "excel" && (
                  <button
                    onClick={handleImportCSV}
                    disabled={!csvFile || savingExterno}
                    className="flex-1 sm:flex-none px-8 py-3 font-black text-white bg-[#167524] rounded-xl hover:bg-[#115a1b] transition-all shadow-md text-sm disabled:opacity-50 uppercase tracking-widest cursor-pointer"
                  >
                    {savingExterno ? "A Importar..." : "✓ Processar Excel"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER FICHA CLÍNICA DETALHADA E CONTROLO FINANCEIRO */}
      {reservaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div
              className={`p-6 md:p-8 text-white flex justify-between items-center ${
                reservaSelecionada.status === "Cancelada" ||
                reservaSelecionada.status === "Abandonada" ||
                reservaSelecionada.status === "Reembolsado"
                  ? "bg-red-600"
                  : "bg-[#167524]"
              }`}
            >
              <div>
                <h2 className="m-0 text-xl md:text-2xl font-black tracking-tight">
                  Ficha Completa do Participante
                </h2>
                <p className="m-0 text-white/80 text-xs font-bold mt-1">
                  {reservaSelecionada.campo_nome} • {reservaSelecionada.turno}
                </p>
              </div>
              <button
                onClick={fecharModalReserva}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white font-black transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto bg-slate-50 flex flex-col gap-6 md:gap-8">
              {/* CARTÃO GESTÃO FINANCEIRA */}
              <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-slate-100 gap-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest m-0">
                    💳 Controlo Financeiro do Passe
                  </h3>
                  {!reservaSelecionada.isExterna &&
                    reservaSelecionada.status !== "Cancelada" &&
                    reservaSelecionada.status !== "Reembolsado" && (
                      <button
                        onClick={() => setIsAjusteModalOpen(!isAjusteModalOpen)}
                        className="text-xs font-black uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl transition-colors border border-slate-200 w-full sm:w-auto cursor-pointer"
                      >
                        + Cobrar Valor Adicional / Extra
                      </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">
                      Valor Total
                    </p>
                    <p className="text-2xl font-black text-slate-900 m-0">
                      {reservaSelecionada.valor.toFixed(2)}€
                    </p>
                  </div>
                  <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] text-emerald-700 uppercase tracking-widest font-black mb-1">
                      Valor Já Pago
                    </p>
                    <p className="text-2xl font-black text-[#167524] m-0">
                      {reservaSelecionada.valor_pago.toFixed(2)}€
                    </p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">
                      Valor Pendente / Estado
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black text-amber-600">
                        {reservaSelecionada.valor_em_falta.toFixed(2)}€
                      </span>
                      <span
                        className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                          reservaSelecionada.status === "Pago" ||
                          reservaSelecionada.status === "Sinal Pago"
                            ? "bg-[#167524]/10 text-[#167524] border-[#167524]/20"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {reservaSelecionada.status}
                      </span>
                    </div>
                  </div>
                </div>

                {reservaSelecionada.pedido_pendente && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 p-5 md:p-6 rounded-2xl flex flex-col md:flex-row items-start gap-4">
                    <span className="text-3xl hidden md:block">📬</span>
                    <div className="flex-1 w-full">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 m-0 mb-1.5">
                        Pedido de Alteração / Extra enviado pelo Pai:
                      </p>
                      <p className="text-base font-bold text-blue-900 m-0 italic bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                        &ldquo;{reservaSelecionada.pedido_pendente}&rdquo;
                      </p>
                      <button
                        onClick={() => {
                          setAjusteForm({
                            motivo: reservaSelecionada.pedido_pendente,
                            valor: 0,
                          });
                          setIsAjusteModalOpen(true);
                        }}
                        className="mt-4 w-full md:w-auto text-xs font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        Aprovar e Lançar Cobrança Extra
                      </button>
                    </div>
                  </div>
                )}

                {isAjusteModalOpen && (
                  <form
                    onSubmit={handleSubmeterAjuste}
                    className="mt-8 pt-6 border-t border-slate-200 animate-in fade-in"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase">
                          Motivo do Ajuste (Ex: Transporte / Prolongamento / Alojamento)
                        </label>
                        <input
                          type="text"
                          required
                          value={ajusteForm.motivo}
                          onChange={(e) =>
                            setAjusteForm({ ...ajusteForm, motivo: e.target.value })
                          }
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-2 uppercase">
                          Valor Extra a Cobrar (€)
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          step="0.01"
                          value={ajusteForm.valor}
                          onChange={(e) =>
                            setAjusteForm({
                              ...ajusteForm,
                              valor: Number(e.target.value),
                            })
                          }
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-blue-700 outline-none focus:border-blue-500 text-right"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsAjusteModalOpen(false)}
                        className="w-full sm:w-auto px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savingAjuste}
                        className="w-full sm:w-auto px-8 py-3 text-xs font-black uppercase tracking-widest text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md transition-all cursor-pointer"
                      >
                        {savingAjuste ? "A Lançar..." : "Confirmar e Notificar Pai"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* DADOS DO PARTICIPANTE E PERFIL CLÍNICO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-200 shadow-sm">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5 pb-3 border-b border-slate-100">
                    👦 Identificação e Logística da Criança
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="font-bold text-slate-500 text-xs uppercase">
                        Nome Completo:
                      </span>
                      <span className="font-black text-slate-900">
                        {reservaSelecionada.crianca?.nome}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="font-bold text-slate-500 text-xs uppercase">
                        Data de Nascimento / Idade:
                      </span>
                      <span className="font-black text-slate-900">
                        {reservaSelecionada.crianca?.data_nascimento} (
                        {reservaSelecionada.crianca?.idade})
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="font-bold text-slate-500 text-xs uppercase">
                        Género / NIF:
                      </span>
                      <span className="font-bold text-slate-800">
                        {reservaSelecionada.crianca?.sexo} • NIF:{" "}
                        {reservaSelecionada.crianca?.nif}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="font-bold text-slate-500 text-xs uppercase">
                        Sabe Nadar / Bicicleta:
                      </span>
                      <span className="font-bold text-slate-800">
                        🏊 {reservaSelecionada.crianca?.sabe_nadar} | 🚲{" "}
                        {reservaSelecionada.crianca?.sabe_andar_bicicleta}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="font-bold text-slate-500 text-xs uppercase">
                        Tamanho T-Shirt / Inglês:
                      </span>
                      <span className="font-bold text-slate-800">
                        👕 {reservaSelecionada.crianca?.tamanho_tshirt} | 🇬🇧{" "}
                        {reservaSelecionada.crianca?.nivel_ingles}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="font-bold text-slate-500 text-xs uppercase">
                        Autorização Fotografia:
                      </span>
                      <span className="font-black text-slate-900">
                        📸 {reservaSelecionada.crianca?.autorizacao_fotografia}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border-2 border-red-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-red-50">
                    <h3 className="text-[11px] font-black text-red-500 uppercase tracking-widest m-0">
                      🏥 Ficha Médica e Alertas
                    </h3>
                    <span className="text-xs font-black bg-red-50 text-red-700 px-2.5 py-1 rounded-md border border-red-200">
                      🩸 Tipo: {reservaSelecionada.crianca?.tipo_sanguineo}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl text-sm font-medium text-red-900">
                      <strong className="block text-[10px] font-black uppercase tracking-widest text-red-800 mb-1">
                        Alergias Alimentares:
                      </strong>
                      {reservaSelecionada.crianca?.restricoes_alimentares || "Nenhuma"}
                    </div>
                    <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl text-sm font-medium text-red-900">
                      <strong className="block text-[10px] font-black uppercase tracking-widest text-red-800 mb-1">
                        Doenças Crónicas:
                      </strong>
                      {reservaSelecionada.crianca?.doencas_cronicas || "Nenhuma"}
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl text-sm font-medium text-amber-900">
                      <strong className="block text-[10px] font-black uppercase tracking-widest text-amber-800 mb-1">
                        Medicação Regular / Horários:
                      </strong>
                      {reservaSelecionada.crianca?.medicacao_regular || "Nenhuma"}
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-medium text-slate-700">
                      <strong>Limitações / Fobias:</strong>{" "}
                      {reservaSelecionada.crianca?.limitacoes_fisicas} |{" "}
                      {reservaSelecionada.crianca?.fobias_medos}
                    </div>
                  </div>
                </div>
              </div>

              {/* DADOS DO ENCARREGADO DE EDUCAÇÃO E EMERGÊNCIA */}
              <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5 pb-3 border-b border-slate-100">
                  👨‍👩‍👧 Contactos do Encarregado de Educação e Emergência
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Responsável
                    </span>
                    <span className="font-black text-slate-900">
                      {reservaSelecionada.pai?.nome}
                    </span>
                    <span className="block text-xs text-slate-500 mt-0.5">
                      NIF: {reservaSelecionada.pai?.nif}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Telefone Direto
                    </span>
                    <a
                      href={`tel:${reservaSelecionada.pai?.telefone}`}
                      className="font-black text-[#167524] hover:underline"
                    >
                      📞 {reservaSelecionada.pai?.telefone}
                    </a>
                  </div>
                  <div className="bg-red-50/60 p-4 rounded-xl border border-red-100">
                    <span className="block text-[10px] font-bold text-red-500 uppercase mb-1">
                      Contacto SOS Emergência
                    </span>
                    <span className="font-black text-red-900">
                      🚨 {reservaSelecionada.pai?.contacto_emergencia}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      E-mail
                    </span>
                    <a
                      href={`mailto:${reservaSelecionada.pai?.email}`}
                      className="font-bold text-slate-800 break-all hover:underline text-xs"
                    >
                      ✉️ {reservaSelecionada.pai?.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* RESPOSTAS CUSTOMIZADAS DO CAMPO */}
              {reservaSelecionada.respostasCustomizadas &&
                Object.keys(reservaSelecionada.respostasCustomizadas).length > 0 && (
                  <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[1.5rem] shadow-sm">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-5 pb-3 border-b border-slate-100">
                      📋 Respostas às Perguntas Específicas do Campo
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(reservaSelecionada.respostasCustomizadas)
                        .filter(
                          ([p]) =>
                            p !== "origem" &&
                            p !== "historico_ajustes" &&
                            p !== "pedido_pai_pendente" &&
                            p !== "nome_crianca" &&
                            p !== "idade_crianca" &&
                            p !== "alergias" &&
                            p !== "doencas"
                        )
                        .map(([pergunta, resposta]: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-slate-50 p-4 rounded-2xl border border-slate-200"
                          >
                            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              {pergunta}
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {String(resposta)}
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
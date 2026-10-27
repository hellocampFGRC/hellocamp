"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const DISTRITOS_PT = [
  "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra",
  "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre",
  "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"
];

const CERTIFICADOS_LISTA = [
  "Monitor de Campos de Férias (IPDJ)",
  "Primeiros Socorros / Suporte Básico",
  "Nadador Salvador",
  "Formação em Educação / Desporto",
  "Animação Sociocultural",
  "Fluência em Línguas Estrangeiras",
  "Necessidades Educativas Especiais",
];

export default function RecrutamentoParceirosPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  // --- NAVEGAÇÃO E SESSÃO ---
  const [activeTab, setActiveTab] = useState<
    "descobrir" | "guardados" | "mensagens"
  >("descobrir");
  const [loading, setLoading] = useState(true);
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [parceiroPerfil, setParceiroPerfil] = useState<any>(null);

  // --- ACESSO E TERMOS ---
  const [temAcesso, setTemAcesso] = useState(false);
  const [statusContrato, setStatusContrato] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [checkboxTermos, setCheckboxTermos] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);

  // --- DADOS DA BASE DE DADOS ---
  const [monitores, setMonitores] = useState<any[]>([]);
  const [guardadosIds, setGuardadosIds] = useState<string[]>([]);
  const [conversas, setConversas] = useState<any[]>([]);

  // --- FILTROS COM DROPDOWNS 100% CUSTOMIZADOS ---
  const [filtroDistrito, setFiltroDistrito] = useState("");
  const [filtroExperiencia, setFiltroExperiencia] = useState("");
  const [filtroCertificado, setFiltroCertificado] = useState("");

  const [isDistDropdownOpen, setIsDistDropdownOpen] = useState(false);
  const [isExpDropdownOpen, setIsExpDropdownOpen] = useState(false);
  const [isCertDropdownOpen, setIsCertDropdownOpen] = useState(false);

  // --- LIGHTBOX DO MONITOR E CHAT ---
  const [monitorSelecionado, setMonitorSelecionado] = useState<any>(null);
  const [conversaAtiva, setConversaAtiva] = useState<any>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [sendingMsg, setSendingEdit] = useState(false);

  // --- CALENDÁRIO MENSAL DA LIGHTBOX ---
  const [mesModalView, setMesModalView] = useState(new Date());
  const mesesNomes = isEn
    ? [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ]
    : [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
  const diasDaSemana = isEn
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const carregarDadosRecrutamento = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    setParceiroId(userId);

    const { data: perfilData } = await supabase
      .from("perfis")
      .select(
        "empresa_nome, termos_recrutamento_aceites, status_contrato, parceiro_verificado, contrato_dados"
      )
      .eq("id", userId)
      .single();
    setParceiroPerfil(perfilData);

    if (!perfilData?.termos_recrutamento_aceites) {
      setShowTermsModal(true);
    }

    const { data: camposData } = await supabase
      .from("campos")
      .select("status_aprovacao")
      .eq("organizador_id", userId);

    let acesso = false;
    let currentStatus = isEn ? "Not Started" : "Não Iniciado";

    // MELHORIA: Desbloqueia se tiver Contrato Global Aprovado OU se tiver algum Campo Aprovado
    const temContratoGlobalAprovado =
      perfilData?.status_contrato === "Aprovado" ||
      perfilData?.parceiro_verificado === true;

    const temCampoAprovado =
      camposData &&
      camposData.some((c) => {
        const st = (c.status_aprovacao || "").toLowerCase();
        return (
          st === "aprovado" ||
          st === "validado" ||
          st === "ativo" ||
          st === "active"
        );
      });

    if (temContratoGlobalAprovado || temCampoAprovado) {
      acesso = true;
      currentStatus = isEn ? "Validated" : "Validado";
    } else if (perfilData?.contrato_dados) {
      currentStatus =
        perfilData.status_contrato || (isEn ? "Under Review" : "Em Revisão");
    }

    setTemAcesso(acesso);
    setStatusContrato(currentStatus);

    const [
      { data: monitoresData },
      { data: favsData },
      { data: msgData },
    ] = await Promise.all([
      supabase
        .from("monitores")
        .select("*")
        .order("criado_at", { ascending: false }),
      supabase
        .from("monitores_favoritos")
        .select("monitor_id")
        .eq("parceiro_id", userId),
      supabase
        .from("mensagens_recrutamento")
        .select("*, monitores(nome_completo, fotografia_url, email, telefone)")
        .eq("parceiro_id", userId)
        .order("criado_at", { ascending: true }),
    ]);

    setMonitores(monitoresData || []);
    if (favsData) {
      setGuardadosIds(favsData.map((f) => f.monitor_id));
    }

    if (msgData) {
      const threadsMap: { [key: string]: any } = {};

      msgData.forEach((msg) => {
        const mId = msg.monitor_id;
        if (!threadsMap[mId]) {
          threadsMap[mId] = {
            monitor_id: mId,
            monitor_nome: msg.monitores?.nome_completo || "Monitor",
            monitor_email: msg.monitores?.email || "",
            monitor_telefone: msg.monitores?.telefone || "",
            fotografia_url: msg.monitores?.fotografia_url || "",
            vaga: isEn ? "Staff Position" : "Candidatura a Monitor",
            mensagens: [],
            ultima_mensagem: "",
            data: "",
            lida: true,
          };
        }
        threadsMap[mId].mensagens.push(msg);
        threadsMap[mId].ultima_mensagem = msg.mensagem;
        threadsMap[mId].data = new Date(msg.criado_at).toLocaleDateString(
          "pt-PT",
          { hour: "2-digit", minute: "2-digit" }
        );
        if (msg.remetente === "monitor" && !msg.lida) {
          threadsMap[mId].lida = false;
        }
      });

      const listaConversas = Object.values(threadsMap);
      setConversas(listaConversas);
      if (conversaAtiva) {
        setConversaAtiva(threadsMap[conversaAtiva.monitor_id] || null);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    carregarDadosRecrutamento();
  }, []);

  const handleAceitarTermos = async () => {
    if (!checkboxTermos || !parceiroId) return;
    setSavingTerms(true);

    const { error } = await supabase
      .from("perfis")
      .update({ termos_recrutamento_aceites: true })
      .eq("id", parceiroId);

    if (error) {
      alert("Erro ao gravar aceitação dos termos: " + error.message);
      setSavingTerms(false);
      return;
    }

    setShowTermsModal(false);
    setSavingTerms(false);
  };

  const toggleGuardar = async (e: React.MouseEvent, idMonitor: string) => {
    e.stopPropagation();
    if (!temAcesso) {
      setShowLockModal(true);
      return;
    }
    if (!parceiroId) return;

    if (guardadosIds.includes(idMonitor)) {
      await supabase
        .from("monitores_favoritos")
        .delete()
        .eq("parceiro_id", parceiroId)
        .eq("monitor_id", idMonitor);
      setGuardadosIds((prev) => prev.filter((id) => id !== idMonitor));
    } else {
      await supabase
        .from("monitores_favoritos")
        .insert([{ parceiro_id: parceiroId, monitor_id: idMonitor }]);
      setGuardadosIds((prev) => [...prev, idMonitor]);
    }
  };

  const marcarComoLidas = async (mId: string) => {
    if (!parceiroId) return;
    await supabase
      .from("mensagens_recrutamento")
      .update({ lida: true })
      .eq("parceiro_id", parceiroId)
      .eq("monitor_id", mId)
      .eq("remetente", "monitor");
  };

  const selecionarConversa = (conv: any) => {
    if (!temAcesso) {
      setShowLockModal(true);
      return;
    }
    setConversaAtiva(conv);
    marcarComoLidas(conv.monitor_id);
  };

  const iniciarConversaComMonitor = async (monitor: any) => {
    if (!temAcesso) {
      setShowLockModal(true);
      return;
    }
    if (!parceiroId) return;
    setMonitorSelecionado(null);

    const { data: existeThread } = await supabase
      .from("mensagens_recrutamento")
      .select("id")
      .eq("parceiro_id", parceiroId)
      .eq("monitor_id", monitor.id)
      .limit(1);

    if (!existeThread || existeThread.length === 0) {
      const msgInicial = isEn
        ? "Hello! We reviewed your profile on HelloCamp and would love to get in touch regarding a monitor position."
        : "Olá! Vimos o teu perfil na Bolsa de Monitores da HelloCamp e ficámos interessados em falar contigo sobre uma oportunidade na nossa equipa.";

      await supabase.from("mensagens_recrutamento").insert([
        {
          parceiro_id: parceiroId,
          monitor_id: monitor.id,
          remetente: "parceiro",
          mensagem: msgInicial,
        },
      ]);

      if (monitor.email) {
        fetch("/api/notificacoes/nova-mensagem-recrutamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinatarioEmail: monitor.email,
            nomeRemetente:
              parceiroPerfil?.empresa_nome || "Organizador HelloCamp",
            textoMensagem: msgInicial,
            tipoDestinatario: "monitor",
            lang,
          }),
        }).catch(() => {});
      }
    }

    await carregarDadosRecrutamento();
    setActiveTab("mensagens");
  };

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!temAcesso) {
      setShowLockModal(true);
      return;
    }
    if (!novaMensagem.trim() || !parceiroId || !conversaAtiva) return;
    setSendingEdit(true);

    const textoLimpo = novaMensagem.trim();
    const payloadMsg = {
      parceiro_id: parceiroId,
      monitor_id: conversaAtiva.monitor_id,
      remetente: "parceiro",
      mensagem: textoLimpo,
    };

    const { error } = await supabase
      .from("mensagens_recrutamento")
      .insert([payloadMsg]);

    if (error) {
      alert("Erro ao enviar mensagem: " + error.message);
      setSendingEdit(false);
      return;
    }

    try {
      await fetch("/api/notificacoes/nova-mensagem-recrutamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinatarioEmail: conversaAtiva.monitor_email,
          nomeRemetente:
            parceiroPerfil?.empresa_nome || "HelloCamp Parceiro",
          textoMensagem: textoLimpo,
          tipoDestinatario: "monitor",
          lang: lang,
        }),
      });
    } catch (err) {
      console.error("Erro no envio do email de alerta:", err);
    }

    setNovaMensagem("");
    setSendingEdit(false);
    carregarDadosRecrutamento();
  };

  const calcularIdade = (dataNascimento: string) => {
    if (!dataNascimento) return "N/D";
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    if (isNaN(nascimento.getTime())) return "N/D";
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
    return idade;
  };

  const monitoresFiltrados = monitores.filter((m) => {
    const matchDistrito =
      filtroDistrito === "" ||
      m.distrito_residencia === filtroDistrito ||
      (Array.isArray(m.locais_atuacao) &&
        m.locais_atuacao.some((l: string) =>
          l.toLowerCase().includes(filtroDistrito.toLowerCase())
        ));
    const matchExperiencia =
      filtroExperiencia === "" || m.experiencia_anos === filtroExperiencia;
    const matchCertificado =
      filtroCertificado === "" ||
      (Array.isArray(m.certificacoes) &&
        m.certificacoes.some((c: string) =>
          c.toLowerCase().includes(filtroCertificado.toLowerCase())
        ));
    return matchDistrito && matchExperiencia && matchCertificado;
  });

  const monitoresGuardados = monitores.filter((m) =>
    guardadosIds.includes(m.id)
  );

  // Grelha do Calendário da Lightbox do Monitor
  const renderCalendarioDisponibilidade = (diasDisponiveis: string[] = []) => {
    const ano = mesModalView.getFullYear();
    const mes = mesModalView.getMonth();
    const primeiroDiaMes = new Date(ano, mes, 1).getDay();
    const offsetSeg = primeiroDiaMes === 0 ? 6 : primeiroDiaMes - 1;
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

    const celulas = [];
    for (let i = 0; i < offsetSeg; i++) {
      celulas.push(<div key={`empty-${i}`} className="h-9" />);
    }
    for (let d = 1; d <= totalDiasMes; d++) {
      const isoDate = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
      const isDisp =
        Array.isArray(diasDisponiveis) && diasDisponiveis.includes(isoDate);
      celulas.push(
        <div
          key={isoDate}
          className={`h-9 rounded-lg flex items-center justify-center text-xs font-black ${
            isDisp
              ? "bg-[#167524] text-white shadow-sm"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {d}
        </div>
      );
    }
    return celulas;
  };

  const renderGrelhaMonitores = (lista: any[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="text-center py-20 text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">
          {isEn ? "Loading talent pool..." : "A carregar bolsa de talentos..."}
        </div>
      );
    }
    if (lista.length === 0) {
      return (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm w-full">
          <span className="text-4xl block mb-2">🔍</span>
          <h3 className="text-base font-black text-slate-900 mb-1">
            {isEn ? "No monitors found" : "Nenhum monitor encontrado"}
          </h3>
          <p className="text-xs text-slate-500 font-medium m-0">
            {emptyMessage}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
        {lista.map((monitor) => {
          const isGuardado = guardadosIds.includes(monitor.id);
          return (
            <div
              key={monitor.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group relative"
            >
              {!temAcesso && !showTermsModal && (
                <div
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[6px] cursor-pointer hover:bg-white/50 transition-colors"
                  onClick={() => setShowLockModal(true)}
                >
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl shadow-lg mb-3">
                    🔒
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-white px-4 py-2 rounded-full shadow-sm">
                    {isEn ? "Locked Profile" : "Perfil Oculto"}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={(e) => toggleGuardar(e, monitor.id)}
                className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center border text-lg transition-colors cursor-pointer ${
                  isGuardado
                    ? "bg-amber-100 text-amber-500 border-amber-200"
                    : "bg-white text-slate-300 border-slate-200 hover:text-amber-400"
                }`}
              >
                ★
              </button>

              <div
                className={`flex flex-col flex-1 ${
                  !temAcesso ? "select-none opacity-50" : ""
                }`}
              >
                <div className="p-6 pb-4 border-b border-slate-100 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                    {monitor.fotografia_url ? (
                      <img
                        src={monitor.fotografia_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">🧑‍🏫</span>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden pr-8 pt-1">
                    <h3 className="text-sm md:text-base font-black text-slate-900 leading-tight truncate m-0">
                      {!temAcesso
                        ? "Monitor Registado"
                        : monitor.nome_completo}
                    </h3>
                    <div className="text-[11px] font-bold text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                      <span>📍 {monitor.distrito_residencia || "Portugal"}</span>
                      <span>•</span>
                      <span>
                        {!temAcesso
                          ? "**"
                          : calcularIdade(monitor.data_nascimento)}{" "}
                        {isEn ? "yrs" : "anos"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {isEn ? "Experience" : "Experiência"}
                    </span>
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-md">
                      {monitor.experiencia_anos === "0"
                        ? isEn
                          ? "Beginner"
                          : "1.ª Experiência"
                        : `${monitor.experiencia_anos} ${
                            isEn ? "years" : "anos"
                          }`}
                    </span>
                  </div>

                  <div className="mb-6 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                      {isEn ? "Certificates" : "Certificações"}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {monitor.certificacoes?.length > 0 ? (
                        monitor.certificacoes.slice(0, 2).map((cert: string) => (
                          <span
                            key={cert}
                            className="px-2 py-1 bg-[#167524]/10 text-[#167524] text-[10px] font-bold uppercase tracking-wide rounded-md border border-[#167524]/20 truncate max-w-full"
                          >
                            {cert}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic font-medium">
                          {isEn ? "None listed" : "Sem certificado anexado"}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (temAcesso) {
                        setMonitorSelecionado(monitor);
                        setMesModalView(new Date());
                      } else {
                        setShowLockModal(true);
                      }
                    }}
                    className="w-full py-3.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#167524] transition-colors shadow-sm cursor-pointer"
                  >
                    {isEn ? "View Full Profile & CV" : "Ver Perfil e Disponibilidade"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const opcoesExperiencia = [
    { val: "", label: isEn ? "Any Experience" : "Qualquer Experiência" },
    { val: "0", label: isEn ? "Beginner (0 years)" : "Iniciante (1.ª vez)" },
    { val: "1-2", label: isEn ? "1 to 2 years" : "1 a 2 anos" },
    { val: "3-5", label: isEn ? "3 to 5 years" : "3 a 5 anos" },
    { val: "5+", label: isEn ? "+5 years (Senior)" : "+5 anos (Sénior)" },
  ];

  return (
    <div className="max-w-7xl mx-auto font-sans pb-16">
      {/* CABEÇALHO E ABAS */}
      <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#167524] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-2">
            {isEn ? "Talent Pool B2B" : "Bolsa de Monitores HelloCamp"}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 m-0 tracking-tight">
            {isEn
              ? "Staff & Monitor Recruitment"
              : "Recrutamento de Monitores"}
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 mb-0">
            {isEn
              ? "Find certified youth monitors, check their calendar availability, and contact them directly with 0% commission."
              : "Encontre monitores certificados, consulte os calendários de disponibilidade e contacte-os diretamente sem custos de intermediação."}
          </p>
        </div>

        {/* ABAS */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("descobrir")}
            className={`flex-1 lg:flex-initial px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
              activeTab === "descobrir"
                ? "bg-[#167524] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            🔍 {isEn ? "Discover" : "Descobrir"} ({monitoresFiltrados.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("guardados")}
            className={`flex-1 lg:flex-initial px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
              activeTab === "guardados"
                ? "bg-[#167524] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            ★ {isEn ? "Saved" : "Guardados"} ({guardadosIds.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mensagens")}
            className={`flex-1 lg:flex-initial px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
              activeTab === "mensagens"
                ? "bg-[#167524] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            💬 {isEn ? "Messages" : "Mensagens"} ({conversas.length})
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS COM DROPDOWNS 100% CUSTOMIZADOS (SEM <select> NATIVO!) */}
      {activeTab === "descobrir" && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. DROPDOWN DISTRITO */}
          <div className="relative">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              📍 {isEn ? "District / Region" : "Distrito / Região"}
            </label>
            <div
              onClick={() => setIsDistDropdownOpen(!isDistDropdownOpen)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 cursor-pointer flex items-center justify-between hover:border-[#167524]"
            >
              <span>
                {filtroDistrito ||
                  (isEn ? "All Districts" : "Todos os Distritos")}
              </span>
              <span className="text-[10px] text-slate-400">▼</span>
            </div>
            {isDistDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDistDropdownOpen(false)}
                />
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  <div
                    onClick={() => {
                      setFiltroDistrito("");
                      setIsDistDropdownOpen(false);
                    }}
                    className="p-3 text-xs font-black text-[#167524] hover:bg-emerald-50 cursor-pointer border-b border-slate-100"
                  >
                    {isEn ? "All Districts" : "Todos os Distritos"}
                  </div>
                  {DISTRITOS_PT.map((d) => (
                    <div
                      key={d}
                      onClick={() => {
                        setFiltroDistrito(d);
                        setIsDistDropdownOpen(false);
                      }}
                      className="p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 2. DROPDOWN EXPERIÊNCIA */}
          <div className="relative">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              ⏳ {isEn ? "Experience Level" : "Anos de Experiência"}
            </label>
            <div
              onClick={() => setIsExpDropdownOpen(!isExpDropdownOpen)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 cursor-pointer flex items-center justify-between hover:border-[#167524]"
            >
              <span>
                {
                  opcoesExperiencia.find((o) => o.val === filtroExperiencia)
                    ?.label
                }
              </span>
              <span className="text-[10px] text-slate-400">▼</span>
            </div>
            {isExpDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsExpDropdownOpen(false)}
                />
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {opcoesExperiencia.map((op) => (
                    <div
                      key={op.val}
                      onClick={() => {
                        setFiltroExperiencia(op.val);
                        setIsExpDropdownOpen(false);
                      }}
                      className="p-3 text-xs font-bold text-slate-700 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      {op.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 3. DROPDOWN CERTIFICAÇÕES */}
          <div className="relative">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              🎓 {isEn ? "Certification" : "Certificação / Curso"}
            </label>
            <div
              onClick={() => setIsCertDropdownOpen(!isCertDropdownOpen)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 cursor-pointer flex items-center justify-between hover:border-[#167524]"
            >
              <span className="truncate">
                {filtroCertificado ||
                  (isEn ? "All Certifications" : "Todas as Certificações")}
              </span>
              <span className="text-[10px] text-slate-400 ml-2">▼</span>
            </div>
            {isCertDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCertDropdownOpen(false)}
                />
                <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  <div
                    onClick={() => {
                      setFiltroCertificado("");
                      setIsCertDropdownOpen(false);
                    }}
                    className="p-3 text-xs font-black text-[#167524] hover:bg-emerald-50 cursor-pointer border-b border-slate-100"
                  >
                    {isEn ? "All Certifications" : "Todas as Certificações"}
                  </div>
                  {CERTIFICADOS_LISTA.map((cert) => (
                    <div
                      key={cert}
                      onClick={() => {
                        setFiltroCertificado(cert);
                        setIsCertDropdownOpen(false);
                      }}
                      className="p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      {cert}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO DAS ABAS */}
      {activeTab === "descobrir" &&
        renderGrelhaMonitores(
          monitoresFiltrados,
          isEn
            ? "Try clearing the district or certification filters."
            : "Tente limpar os filtros de distrito ou certificação acima."
        )}

      {activeTab === "guardados" &&
        renderGrelhaMonitores(
          monitoresGuardados,
          isEn
            ? "Click the star (★) on any monitor card to save them to your shortlist."
            : "Clique na estrela (★) no cartão de um monitor para o guardar nos seus favoritos."
        )}

      {activeTab === "mensagens" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[560px]">
          <div className="md:col-span-4 border-r border-slate-200 overflow-y-auto">
            {conversas.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-bold">
                {isEn
                  ? "No active recruitment chats yet."
                  : "Ainda não iniciou nenhuma conversa com candidatos."}
              </div>
            ) : (
              conversas.map((conv) => (
                <button
                  key={conv.monitor_id}
                  type="button"
                  onClick={() => selecionarConversa(conv)}
                  className={`w-full text-left p-4 border-b border-slate-100 flex items-center gap-3 cursor-pointer ${
                    conversaAtiva?.monitor_id === conv.monitor_id
                      ? "bg-emerald-50 border-l-4 border-l-[#167524]"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center font-black">
                    {conv.fotografia_url ? (
                      <img
                        src={conv.fotografia_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "🧑‍🏫"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-sm text-slate-900 truncate">
                        {conv.monitor_nome}
                      </span>
                      {!conv.lida && (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate m-0 mt-0.5">
                      {conv.ultima_mensagem}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="md:col-span-8 flex flex-col bg-slate-50/50">
            {conversaAtiva ? (
              <>
                <div className="bg-white p-4 px-6 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 m-0">
                      {conversaAtiva.monitor_nome}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {conversaAtiva.monitor_email}{" "}
                      {conversaAtiva.monitor_telefone
                        ? `• 📞 ${conversaAtiva.monitor_telefone}`
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {conversaAtiva.mensagens.map((m: any) => {
                    const souParceiro = m.remetente === "parceiro";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          souParceiro ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                            souParceiro
                              ? "bg-[#167524] text-white rounded-br-none"
                              : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                          }`}
                        >
                          {m.mensagem}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={handleEnviarMensagem}
                  className="bg-white p-4 border-t border-slate-200 flex gap-3"
                >
                  <input
                    type="text"
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    placeholder={
                      isEn
                        ? "Write a message to this candidate..."
                        : "Escreva uma mensagem para o candidato..."
                    }
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#167524]"
                  />
                  <button
                    type="submit"
                    disabled={sendingMsg || !novaMensagem.trim()}
                    className="bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs px-6 rounded-xl cursor-pointer"
                  >
                    {sendingMsg ? "..." : isEn ? "Send" : "Enviar"}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 font-bold text-sm">
                {isEn
                  ? "Select a candidate conversation on the left"
                  : "Selecione uma conversa à esquerda"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* LIGHTBOX / MODAL DE PERFIL COMPLETO DO MONITOR                      */}
      {/* =================================================================== */}
      {monitorSelecionado && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setMonitorSelecionado(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-3xl flex-shrink-0">
                  {monitorSelecionado.fotografia_url ? (
                    <img
                      src={monitorSelecionado.fotografia_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "🧑‍🏫"
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 m-0">
                    {monitorSelecionado.nome_completo}
                  </h2>
                  <p className="text-xs font-bold text-slate-500 m-0 mt-1">
                    📍 {monitorSelecionado.distrito_residencia} • 🎂{" "}
                    {calcularIdade(monitorSelecionado.data_nascimento)}{" "}
                    {isEn ? "years old" : "anos"}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs font-bold text-[#167524]">
                    {monitorSelecionado.email && (
                      <span>✉️ {monitorSelecionado.email}</span>
                    )}
                    {monitorSelecionado.telefone && (
                      <span>• 📞 {monitorSelecionado.telefone}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMonitorSelecionado(null)}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
              {/* Sobre e Certificações */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    {isEn ? "About & Experience" : "Apresentação e Experiência"}
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 m-0">
                    {monitorSelecionado.biografia ||
                      monitorSelecionado.sobre_mim ||
                      (isEn
                        ? "Motivated monitor available for summer camps and youth activities."
                        : "Monitor disponível para integrar equipas em campos de férias e atividades juvenis.")}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    {isEn ? "Certifications" : "Certificações e Competências"}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {monitorSelecionado.certificacoes?.map((c: string) => (
                      <span
                        key={c}
                        className="px-3 py-1.5 bg-emerald-50 text-[#167524] border border-emerald-200 rounded-xl text-xs font-bold"
                      >
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>

                {monitorSelecionado.curriculo_url && (
                  <div>
                    <a
                      href={monitorSelecionado.curriculo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs px-5 py-3 rounded-xl no-underline shadow-sm"
                    >
                      📄 {isEn ? "Download Resume (CV)" : "Abrir Currículo (PDF)"}
                    </a>
                  </div>
                )}
              </div>

              {/* Calendário Mensal de Disponibilidade */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() =>
                      setMesModalView(
                        new Date(
                          mesModalView.getFullYear(),
                          mesModalView.getMonth() - 1,
                          1
                        )
                      )
                    }
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black cursor-pointer"
                  >
                    &larr;
                  </button>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-900">
                    {mesesNomes[mesModalView.getMonth()]}{" "}
                    {mesModalView.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMesModalView(
                        new Date(
                          mesModalView.getFullYear(),
                          mesModalView.getMonth() + 1,
                          1
                        )
                      )
                    }
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black cursor-pointer"
                  >
                    &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {diasDaSemana.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] font-black text-slate-400 uppercase"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendarioDisponibilidade(
                    monitorSelecionado.dias_disponiveis || []
                  )}
                </div>
                <p className="text-[10px] font-bold text-[#167524] mt-3 mb-0 text-center">
                  🟩 {isEn ? "Green = Available Days" : "Verde = Dias Disponíveis"}
                </p>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => iniciarConversaComMonitor(monitorSelecionado)}
                className="bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl shadow-md cursor-pointer"
              >
                💬{" "}
                {isEn
                  ? "Send Direct Proposal"
                  : "Enviar Mensagem de Recrutamento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE BLOQUEIO (SE AINDA NÃO TIVER CONTRATO ASSINADO) */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl border border-slate-200">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              🔒
            </div>
            <h3 className="text-xl font-black text-slate-900 m-0 mb-2">
              {isEn
                ? "Verified Partners Only"
                : "Acesso Exclusivo a Parceiros Validados"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {isEn
                ? "To protect our monitors' personal data, you must sign your Global Partnership Agreement before unlocking full profiles and CVs."
                : "Por motivos de proteção de dados (RGPD), o acesso aos contactos, currículos e fotografias dos monitores requer que tenha o seu Contrato Global assinado."}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLockModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs cursor-pointer"
              >
                {isEn ? "Close" : "Fechar"}
              </button>
              <Link
                href={`/${lang}/admin/contrato`}
                className="flex-1 py-3 rounded-xl bg-[#167524] text-white font-black uppercase tracking-widest text-xs no-underline"
              >
                {isEn ? "Sign Contract" : "Assinar Contrato"}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ACEITAÇÃO DE TERMOS DE RECRUTAMENTO (RGPD E REGISTO CRIMINAL) */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 m-0 mb-3">
              🛡️{" "}
              {isEn
                ? "Staff Portal Terms & Legal Compliance"
                : "Termos de Utilização da Bolsa de Monitores"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {isEn
                ? "HelloCamp acts strictly as a directory. As the hiring entity, your organization is legally responsible for interviewing candidates, verifying original certificates, and requiring a clean Criminal Record Check for contact with minors before hiring."
                : "A HelloCamp atua estritamente como diretório tecnológico. Cabe exclusivamente à entidade organizadora entrevistar os candidatos, validar os certificados originais e exigir obrigatoriamente o Registo Criminal (para contacto com menores, nos termos da Lei n.º 113/2009) antes do início de funções."}
            </p>
            <label className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={checkboxTermos}
                onChange={(e) => setCheckboxTermos(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#167524]"
              />
              <span className="text-xs font-bold text-slate-800">
                {isEn
                  ? "I understand and accept the legal and GDPR responsibilities regarding candidate data."
                  : "Compreendo e aceito a responsabilidade legal pela verificação documental, registo criminal e tratamento confidencial dos dados (RGPD)."}
              </span>
            </label>
            <button
              type="button"
              disabled={!checkboxTermos || savingTerms}
              onClick={handleAceitarTermos}
              className="w-full py-4 bg-[#167524] disabled:bg-slate-300 text-white font-black uppercase tracking-widest text-xs rounded-xl cursor-pointer"
            >
              {savingTerms
                ? "..."
                : isEn
                ? "Accept & Enter Talent Pool"
                : "Aceitar e Aceder à Bolsa de Monitores"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
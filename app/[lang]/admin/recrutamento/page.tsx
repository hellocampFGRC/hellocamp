"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DISTRITOS_PT = [
  "Aveiro",
  "Beja",
  "Braga",
  "Bragança",
  "Castelo Branco",
  "Coimbra",
  "Évora",
  "Faro",
  "Guarda",
  "Leiria",
  "Lisboa",
  "Portalegre",
  "Porto",
  "Santarém",
  "Setúbal",
  "Viana do Castelo",
  "Vila Real",
  "Viseu",
  "Ilha da Madeira",
  "Ilha dos Açores",
];

const CERTIFICADOS_NOMES: Record<string, string> = {
  IPDJ: "Monitor IPDJ",
  Coordenador_IPDJ: "Coordenador IPDJ",
  Socorrismo: "Primeiros Socorros",
  Nadador: "Nadador Salvador",
  Professor: "Educação / Desporto",
  Surf_Nautica: "Surf & Náutica",
  Animacao: "Animação Sociocultural",
  Linguas: "Línguas Estrangeiras",
  Artes: "Artes / Música / Teatro",
  NEE: "Apoio NEE",
  Carta_Conducao: "Carta Condução",
  Registo_Criminal: "Registo Criminal Limpo",
};

export default function RecrutamentoParceiroPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [parceiroId, setParceiroId] = useState<string>("");
  const [parceiroPerfil, setParceiroPerfil] = useState<any>(null);

  // Controlo de Acesso e Termos Legais
  const [temAcesso, setTemAcesso] = useState(false);
  const [statusContrato, setStatusContrato] = useState("Pendente");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [checkboxTermos, setCheckboxTermos] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);

  // Abas: "explorar" | "guardados" | "mensagens"
  const [activeTab, setActiveTab] = useState<
    "explorar" | "guardados" | "mensagens"
  >("explorar");

  // Dados dos Monitores, Favoritos e Conversas
  const [monitores, setMonitores] = useState<any[]>([]);
  const [guardadosIds, setGuardadosIds] = useState<string[]>([]);
  const [conversas, setConversas] = useState<any[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<any>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Filtros Customizados (Zero <select> nativos!)
  const [pesquisa, setPesquisa] = useState("");
  const [filtroDistrito, setFiltroDistrito] = useState("todos");
  const [filtroCertificado, setFiltroCertificado] = useState("todos");
  const [filtroEpoca, setFiltroEpoca] = useState("todos");
  const [apenasMaiores18, setApenasMaiores18] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Modal de Perfil Completo do Monitor
  const [monitorSelecionado, setMonitorSelecionado] = useState<any>(null);

  const calcularIdade = (dataNasc: string) => {
    if (!dataNasc) return 21;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const carregarDadosRecrutamento = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/${lang}/login`);
      return;
    }

    const userId = session.user.id;
    setParceiroId(userId);

    const [
      { data: perfilData },
      { data: camposData },
      { data: monitoresData },
      { data: favsData },
      { data: msgData },
    ] = await Promise.all([
      supabase
        .from("perfis")
        .select(
          "empresa_nome, nome_empresa, nome, nome_completo, status_contrato, parceiro_verificado, termos_recrutamento_aceites"
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("campos")
        .select("status_aprovacao, ativo")
        .eq("organizador_id", userId),
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
        .select("*, monitores(nome_completo, fotografia_url, email, telefone, distrito_residencia)")
        .eq("parceiro_id", userId)
        .order("criado_at", { ascending: true }),
    ]);

    setParceiroPerfil(perfilData);

    if (perfilData && !perfilData.termos_recrutamento_aceites) {
      setShowTermsModal(true);
    }

    // Verifica se o parceiro tem contrato aprovado ou campo aprovado
    const isPerfilApproved =
      perfilData?.status_contrato === "Aprovado" ||
      perfilData?.parceiro_verificado === true;
    const isCampoApproved = (camposData || []).some((c: any) => {
      const st = (c.status_aprovacao || "").toLowerCase();
      return (
        c.ativo === true ||
        st === "aprovado" ||
        st === "validado" ||
        st === "ativo"
      );
    });

    const acesso = Boolean(isPerfilApproved || isCampoApproved);
    setTemAcesso(acesso);
    setStatusContrato(
      acesso
        ? isEn
          ? "Verified Partner"
          : "Parceiro Verificado"
        : perfilData?.status_contrato || "Pendente de Contrato"
    );

    setMonitores(monitoresData || []);
    setGuardadosIds((favsData || []).map((f: any) => f.monitor_id));

    if (msgData) {
      const threadsMap: Record<string, any> = {};
      msgData.forEach((msg: any) => {
        const mId = msg.monitor_id;
        if (!threadsMap[mId]) {
          threadsMap[mId] = {
            monitor_id: mId,
            monitor_nome: msg.monitores?.nome_completo || "Monitor",
            monitor_email: msg.monitores?.email || "",
            monitor_telefone: msg.monitores?.telefone || "",
            monitor_distrito: msg.monitores?.distrito_residencia || "",
            fotografia_url: msg.monitores?.fotografia_url || "",
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

      const listaThreads = Object.values(threadsMap);
      setConversas(listaThreads);
      if (conversaAtiva) {
        setConversaAtiva(threadsMap[conversaAtiva.monitor_id] || null);
      } else if (listaThreads.length > 0) {
        setConversaAtiva(listaThreads[0]);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    carregarDadosRecrutamento();
  }, [lang]);

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
    if (!parceiroId) return;

    if (guardadosIds.includes(idMonitor)) {
      setGuardadosIds(guardadosIds.filter((id) => id !== idMonitor));
      await supabase
        .from("monitores_favoritos")
        .delete()
        .eq("parceiro_id", parceiroId)
        .eq("monitor_id", idMonitor);
    } else {
      setGuardadosIds([...guardadosIds, idMonitor]);
      await supabase
        .from("monitores_favoritos")
        .insert([{ parceiro_id: parceiroId, monitor_id: idMonitor }]);
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
    setConversaAtiva({ ...conv, lida: true });
    setConversas((prev) =>
      prev.map((c) =>
        c.monitor_id === conv.monitor_id ? { ...c, lida: true } : c
      )
    );
    marcarComoLidas(conv.monitor_id);
  };

  const iniciarConversaComMonitor = async (monitor: any) => {
    if (!temAcesso) {
      setShowLockModal(true);
      return;
    }
    if (!parceiroId) return;

    const nomeEmp =
      parceiroPerfil?.empresa_nome ||
      parceiroPerfil?.nome_empresa ||
      parceiroPerfil?.nome ||
      "Organizador HelloCamp";

    const msgInicial = isEn
      ? `Hello ${monitor.nome_completo}! We reviewed your profile on the HelloCamp Staff Pool and would love to invite you for an interview at ${nomeEmp}.`
      : `Olá ${monitor.nome_completo}! Vimos o teu perfil e certificações na Bolsa de Monitores da HelloCamp e gostaríamos de te convidar para colaborar com a ${nomeEmp}. Tens disponibilidade para falarmos?`;

    setMonitorSelecionado(null);

    const { data: existeThread } = await supabase
      .from("mensagens_recrutamento")
      .select("id")
      .eq("parceiro_id", parceiroId)
      .eq("monitor_id", monitor.id)
      .limit(1);

    if (!existeThread || existeThread.length === 0) {
      await supabase.from("mensagens_recrutamento").insert([
        {
          parceiro_id: parceiroId,
          monitor_id: monitor.id,
          remetente: "parceiro",
          mensagem: msgInicial,
          lida: false,
        },
      ]);

      if (monitor.email) {
        await fetch("/api/notificacoes/nova-mensagem-recrutamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinatarioEmail: monitor.email,
            destinatarioNome: monitor.nome_completo,
            remetenteNome: nomeEmp,
            mensagemTexto: msgInicial,
            tipoDestinatario: "monitor",
            lang,
          }),
        }).catch(() => {});
      }
    }

    await carregarDadosRecrutamento();
    setActiveTab("mensagens");
  };

  const handleEnviarMensagemChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !conversaAtiva || !parceiroId) return;

    setSendingMsg(true);
    try {
      const txt = novaMensagem.trim();
      const { data: inserida, error } = await supabase
        .from("mensagens_recrutamento")
        .insert([
          {
            parceiro_id: parceiroId,
            monitor_id: conversaAtiva.monitor_id,
            remetente: "parceiro",
            mensagem: txt,
            lida: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const atualizada = {
        ...conversaAtiva,
        mensagens: [...conversaAtiva.mensagens, inserida],
        ultima_mensagem: txt,
      };
      setConversaAtiva(atualizada);
      setConversas((prev) =>
        prev.map((c) =>
          c.monitor_id === conversaAtiva.monitor_id ? atualizada : c
        )
      );
      setNovaMensagem("");

      if (conversaAtiva.monitor_email) {
        const nomeEmp =
          parceiroPerfil?.empresa_nome ||
          parceiroPerfil?.nome_empresa ||
          "Organizador HelloCamp";
        await fetch("/api/notificacoes/nova-mensagem-recrutamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinatarioEmail: conversaAtiva.monitor_email,
            destinatarioNome: conversaAtiva.monitor_nome,
            remetenteNome: nomeEmp,
            mensagemTexto: txt,
            tipoDestinatario: "monitor",
            lang,
          }),
        }).catch(() => {});
      }
    } catch (err: any) {
      alert("Erro ao enviar mensagem: " + err.message);
    } finally {
      setSendingMsg(false);
    }
  };

  // Filtragem Completa
  const filtrarLista = (baseList: any[]) =>
    baseList.filter((m: any) => {
      if (apenasMaiores18 && calcularIdade(m.data_nascimento) < 18)
        return false;

      if (filtroDistrito !== "todos") {
        const areas: string[] = Array.isArray(m.areas_atuacao)
          ? m.areas_atuacao
          : [];
        const aceitaNacional = areas.some(
          (a) =>
            a.toLowerCase().includes("todo o país") ||
            a.toLowerCase().includes("nationwide")
        );
        if (
          m.distrito_residencia !== filtroDistrito &&
          !areas.includes(filtroDistrito) &&
          !aceitaNacional
        ) {
          return false;
        }
      }

      if (filtroCertificado !== "todos") {
        const certs: string[] = Array.isArray(m.certificacoes)
          ? m.certificacoes
          : [];
        if (!certs.includes(filtroCertificado)) return false;
      }

      if (filtroEpoca !== "todos") {
        const epocas: string[] = Array.isArray(m.disponibilidade)
          ? m.disponibilidade
          : [];
        if (!epocas.includes(filtroEpoca)) return false;
      }

      if (pesquisa.trim() !== "") {
        const q = pesquisa.toLowerCase();
        const match = `${m.nome_completo || ""} ${m.bio || ""} ${
          m.outras_competencias || ""
        } ${m.distrito_residencia || ""}`
          .toLowerCase()
          .includes(q);
        if (!match) return false;
      }

      return true;
    });

  const monitoresExplorar = filtrarLista(monitores);
  const monitoresGuardados = filtrarLista(
    monitores.filter((m) => guardadosIds.includes(m.id))
  );
  const unreadThreadsCount = conversas.filter((c) => !c.lida).length;

  const renderGrelhaMonitores = (lista: any[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="text-center py-20 text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">
          {isEn ? "Loading talent pool..." : "A carregar talentos..."}
        </div>
      );
    }

    if (lista.length === 0) {
      return (
        <div className="bg-white p-12 rounded-md border border-slate-200 text-center shadow-sm">
          <span className="text-4xl block mb-2">🔍</span>
          <h3 className="text-base font-black text-[#0F172A] mb-1">
            {isEn ? "No monitors found" : "Nenhum monitor encontrado"}
          </h3>
          <p className="text-xs text-slate-500 font-bold m-0">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lista.map((m: any) => {
          const isGuardado = guardadosIds.includes(m.id);
          const idade = calcularIdade(m.data_nascimento);
          const certs: string[] = Array.isArray(m.certificacoes)
            ? m.certificacoes
            : [];
          const epocas: string[] = Array.isArray(m.disponibilidade)
            ? m.disponibilidade
            : [];
          const diasMarcados = Array.isArray(m.calendario_disponibilidade)
            ? m.calendario_disponibilidade.length
            : 0;

          return (
            <div
              key={m.id}
              onClick={() => setMonitorSelecionado(m)}
              className="bg-white rounded-md border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-md bg-[#2563EB] text-white flex items-center justify-center text-xl font-black overflow-hidden shrink-0">
                      {m.fotografia_url ? (
                        <img
                          src={m.fotografia_url}
                          alt={m.nome_completo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (m.nome_completo || "M").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-[#0F172A] m-0 truncate group-hover:text-[#2563EB] transition-colors">
                        {m.nome_completo || "Monitor"}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 m-0 mt-0.5">
                        📍 {m.distrito_residencia || "Portugal"} • {idade} anos
                      </p>
                      <span className="inline-block bg-amber-50 border border-amber-200 text-[#0F172A] text-[10px] font-black px-2 py-0.5 rounded-md mt-1">
                        ⭐ {m.experiencia_anos || 0}{" "}
                        {Number(m.experiencia_anos) === 1
                          ? "ano exp."
                          : "anos exp."}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => toggleGuardar(e, m.id)}
                    className={`w-9 h-9 rounded-md flex items-center justify-center text-sm cursor-pointer border-0 shrink-0 transition-colors ${
                      isGuardado
                        ? "bg-[#F43F5E] text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                    title="Guardar nos Favoritos"
                  >
                    ♥
                  </button>
                </div>

                {/* RESUMO DE FUNÇÃO / COMPETÊNCIAS */}
                {m.outras_competencias && (
                  <div className="bg-[#F8FAFC] p-2.5 rounded-md border border-slate-200 text-[11px] font-bold text-[#0F172A] mb-3 line-clamp-2">
                    🛠️ {m.outras_competencias}
                  </div>
                )}

                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                  {m.bio || "Disponível para integrar equipas de campos de férias."}
                </p>

                {/* CERTIFICAÇÕES */}
                {certs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {certs.map((cId) => (
                      <span
                        key={cId}
                        className="bg-[#16A34A] text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md"
                      >
                        ✓ {CERTIFICADOS_NOMES[cId] || cId}
                      </span>
                    ))}
                  </div>
                )}

                {/* ÉPOCAS E DIAS DISPONÍVEIS */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {epocas.map((ep) => (
                    <span
                      key={ep}
                      className="bg-[#F59E0B] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md"
                    >
                      ☀️ {ep}
                    </span>
                  ))}
                  {diasMarcados > 0 && (
                    <span className="bg-blue-50 text-[#2563EB] border border-blue-200 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                      📅 {diasMarcados} dias marcados
                    </span>
                  )}
                  {m.cv_url && (
                    <span className="bg-slate-800 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                      📄 CV PDF
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-md cursor-pointer border-0 transition-colors"
              >
                👁️ Ver Ficha Completa, CV & Contactar →
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto font-sans text-[#0F172A] pb-20 space-y-8">
      {/* CABEÇALHO E NAVEGAÇÃO POR ABAS */}
      <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
              🎓 {isEn ? "Talent Pool B2B" : "Bolsa Nacional de Monitores"}
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md text-white ${
                temAcesso ? "bg-[#2563EB]" : "bg-[#F59E0B]"
              }`}
            >
              {statusContrato}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-[#0F172A] m-0 tracking-tight">
            {isEn
              ? "Recruit Certified Monitors & Coordinators"
              : "Recrutamento de Monitores e Coordenadores"}
          </h1>
          <p className="text-slate-500 mt-1 mb-0 text-xs md:text-sm font-medium">
            {isEn
              ? "Filter candidates by district, IPDJ / First Aid certifications, availability calendar, and invite them directly."
              : "Filtre candidatos por distrito, certificações IPDJ/Socorrismo, calendário de disponibilidade, descarregue o CV e convide-os diretamente."}
          </p>
        </div>

        {/* ABAS DE NAVEGAÇÃO */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("explorar")}
            className={`px-4 py-3 rounded-md text-xs font-black uppercase tracking-widest cursor-pointer border-0 transition-colors ${
              activeTab === "explorar"
                ? "bg-[#2563EB] text-white"
                : "bg-slate-200 text-[#0F172A] hover:bg-slate-300"
            }`}
          >
            🔍 Explorar ({monitores.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("guardados")}
            className={`px-4 py-3 rounded-md text-xs font-black uppercase tracking-widest cursor-pointer border-0 transition-colors ${
              activeTab === "guardados"
                ? "bg-[#F43F5E] text-white"
                : "bg-slate-200 text-[#0F172A] hover:bg-slate-300"
            }`}
          >
            ♥ Guardados ({guardadosIds.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mensagens")}
            className={`px-4 py-3 rounded-md text-xs font-black uppercase tracking-widest cursor-pointer border-0 transition-colors flex items-center gap-2 ${
              activeTab === "mensagens"
                ? "bg-[#16A34A] text-white"
                : "bg-slate-200 text-[#0F172A] hover:bg-slate-300"
            }`}
          >
            <span>💬 Entrevistas ({conversas.length})</span>
            {unreadThreadsCount > 0 && (
              <span className="bg-[#F43F5E] text-white text-[10px] px-2 py-0.5 rounded-md">
                {unreadThreadsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS AVANÇADOS (APENAS NAS ABAS EXPLORAR E GUARDADOS) */}
      {activeTab !== "mensagens" && (
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pesquisa Livre */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                Pesquisar Nome / Especialidade
              </label>
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Ex: Surf, Inglês, Coordenador..."
                className="w-full py-3 px-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Dropdown Customizado Distrito */}
            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                Distrito / Zona de Atuação
              </label>
              <div
                onClick={() =>
                  setOpenDropdown(
                    openDropdown === "distrito" ? null : "distrito"
                  )
                }
                className="w-full py-3 px-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] cursor-pointer flex justify-between items-center"
              >
                <span className="truncate">
                  {filtroDistrito === "todos"
                    ? "Todos os Distritos"
                    : filtroDistrito}
                </span>
                <span className="text-[10px] text-slate-400">▼</span>
              </div>
              {openDropdown === "distrito" && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-30 max-h-60 overflow-y-auto">
                  <div
                    onClick={() => {
                      setFiltroDistrito("todos");
                      setOpenDropdown(null);
                    }}
                    className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100"
                  >
                    Todos os Distritos
                  </div>
                  {DISTRITOS_PT.map((d) => (
                    <div
                      key={d}
                      onClick={() => {
                        setFiltroDistrito(d);
                        setOpenDropdown(null);
                      }}
                      className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown Customizado Certificação */}
            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                Certificação / Diploma
              </label>
              <div
                onClick={() =>
                  setOpenDropdown(openDropdown === "cert" ? null : "cert")
                }
                className="w-full py-3 px-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] cursor-pointer flex justify-between items-center"
              >
                <span className="truncate">
                  {filtroCertificado === "todos"
                    ? "Todas as Certificações"
                    : CERTIFICADOS_NOMES[filtroCertificado] ||
                      filtroCertificado}
                </span>
                <span className="text-[10px] text-slate-400">▼</span>
              </div>
              {openDropdown === "cert" && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-30 max-h-60 overflow-y-auto">
                  <div
                    onClick={() => {
                      setFiltroCertificado("todos");
                      setOpenDropdown(null);
                    }}
                    className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100"
                  >
                    Todas as Certificações
                  </div>
                  {Object.entries(CERTIFICADOS_NOMES).map(([id, label]) => (
                    <div
                      key={id}
                      onClick={() => {
                        setFiltroCertificado(id);
                        setOpenDropdown(null);
                      }}
                      className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown Customizado Época */}
            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                Época de Férias
              </label>
              <div
                onClick={() =>
                  setOpenDropdown(openDropdown === "epoca" ? null : "epoca")
                }
                className="w-full py-3 px-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] cursor-pointer flex justify-between items-center"
              >
                <span>
                  {filtroEpoca === "todos" ? "Todas as Épocas" : filtroEpoca}
                </span>
                <span className="text-[10px] text-slate-400">▼</span>
              </div>
              {openDropdown === "epoca" && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-30">
                  {["todos", "Verão", "Páscoa", "Carnaval", "Natal", "Fins de Semana"].map(
                    (ep) => (
                      <div
                        key={ep}
                        onClick={() => {
                          setFiltroEpoca(ep);
                          setOpenDropdown(null);
                        }}
                        className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        {ep === "todos" ? "Todas as Épocas" : ep}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={apenasMaiores18}
                onChange={(e) => setApenasMaiores18(e.target.checked)}
                className="w-4 h-4 accent-[#16A34A]"
              />
              <span>Mostrar apenas candidatos maiores de 18 anos (+18)</span>
            </label>

            {(pesquisa ||
              filtroDistrito !== "todos" ||
              filtroCertificado !== "todos" ||
              filtroEpoca !== "todos" ||
              apenasMaiores18) && (
              <button
                type="button"
                onClick={() => {
                  setPesquisa("");
                  setFiltroDistrito("todos");
                  setFiltroCertificado("todos");
                  setFiltroEpoca("todos");
                  setApenasMaiores18(false);
                }}
                className="bg-[#F43F5E] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md cursor-pointer border-0"
              >
                Limpar Filtros ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA ATIVA */}
      {activeTab === "explorar" &&
        renderGrelhaMonitores(
          monitoresExplorar,
          "Experimente ajustar os filtros de distrito, época ou certificação acima."
        )}

      {activeTab === "guardados" &&
        renderGrelhaMonitores(
          monitoresGuardados,
          "Ainda não guardou nenhum monitor nos seus favoritos. Clique no ícone ♥ nos cartões da aba Explorar."
        )}

      {activeTab === "mensagens" && (
        <div className="bg-white rounded-md border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[540px] overflow-hidden">
          <div className="lg:col-span-4 border-r border-slate-200 bg-[#F8FAFC] overflow-y-auto max-h-[600px]">
            {conversas.length === 0 ? (
              <div className="p-10 text-center text-xs font-bold text-slate-400">
                Ainda não iniciou conversa com nenhum monitor. Abra um perfil na
                aba Explorar e clique em &ldquo;Convidar para Entrevista&rdquo;!
              </div>
            ) : (
              conversas.map((conv: any) => {
                const isSel = conversaAtiva?.monitor_id === conv.monitor_id;
                return (
                  <div
                    key={conv.monitor_id}
                    onClick={() => selecionarConversa(conv)}
                    className={`p-4 border-b border-slate-200 cursor-pointer transition-colors ${
                      isSel
                        ? "bg-[#2563EB] text-white"
                        : "bg-white hover:bg-slate-50 text-[#0F172A]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <strong className="text-xs font-black truncate">
                        🎓 {conv.monitor_nome}
                      </strong>
                      {!conv.lida && (
                        <span className="bg-[#F43F5E] text-white text-[9px] font-black px-2 py-0.5 rounded-md">
                          NOVA
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs m-0 truncate ${
                        isSel ? "text-blue-100" : "text-slate-500"
                      }`}
                    >
                      {conv.ultima_mensagem}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <div className="lg:col-span-8 flex flex-col justify-between bg-white">
            {!conversaAtiva ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <span className="text-4xl mb-3">💬</span>
                <h3 className="text-base font-black text-[#0F172A] m-0">
                  Selecione um candidato à esquerda
                </h3>
              </div>
            ) : (
              <>
                <div className="p-5 bg-[#0F172A] text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                  <div>
                    <span className="bg-[#16A34A] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md inline-block mb-1">
                      Candidato a Monitor
                    </span>
                    <h3 className="text-base font-black m-0">
                      {conversaAtiva.monitor_nome}
                    </h3>
                  </div>
                  <div className="text-xs font-bold text-slate-300 flex flex-wrap gap-3">
                    {conversaAtiva.monitor_email && (
                      <span>✉️ {conversaAtiva.monitor_email}</span>
                    )}
                    {conversaAtiva.monitor_telefone && (
                      <span>📞 {conversaAtiva.monitor_telefone}</span>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[420px] bg-[#F8FAFC]">
                  {conversaAtiva.mensagens.map((m: any, i: number) => {
                    const souEu = m.remetente === "parceiro";
                    return (
                      <div
                        key={m.id || i}
                        className={`p-4 rounded-md max-w-[82%] shadow-sm ${
                          souEu
                            ? "ml-auto bg-[#2563EB] text-white"
                            : "mr-auto bg-white border border-slate-200 text-[#0F172A]"
                        }`}
                      >
                        <p className="text-xs md:text-sm font-medium whitespace-pre-wrap leading-relaxed m-0">
                          {m.mensagem}
                        </p>
                        <span
                          className={`block text-[9px] mt-2 ${
                            souEu ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          {new Date(m.criado_at).toLocaleString("pt-PT")}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={handleEnviarMensagemChat}
                  className="p-4 bg-white border-t border-slate-200 flex gap-3"
                >
                  <input
                    type="text"
                    required
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    placeholder="Escreva a sua mensagem ou agende entrevista com o monitor..."
                    className="flex-1 py-3.5 px-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                  <button
                    type="submit"
                    disabled={sendingMsg}
                    className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-md cursor-pointer border-0 shrink-0"
                  >
                    {sendingMsg ? "..." : "Enviar →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE PERFIL COMPLETO DO MONITOR (COM CV, CALENDÁRIO E CONTACTO)   */}
      {/* ===================================================================== */}
      {monitorSelecionado && (
        <div
          className="fixed inset-0 bg-slate-900/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setMonitorSelecionado(null)}
        >
          <div
            className="bg-white w-full max-w-3xl max-h-[90vh] rounded-md overflow-hidden shadow-2xl border border-slate-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0F172A] text-white p-6 flex items-center justify-between border-b-4 border-[#F59E0B]">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-md bg-[#2563EB] text-white flex items-center justify-center text-2xl font-black overflow-hidden border-2 border-white shrink-0">
                  {monitorSelecionado.fotografia_url ? (
                    <img
                      src={monitorSelecionado.fotografia_url}
                      alt={monitorSelecionado.nome_completo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (monitorSelecionado.nome_completo || "M")
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>
                <div>
                  <span className="bg-[#16A34A] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md inline-block mb-1">
                    Ficha Completa do Monitor
                  </span>
                  <h2 className="text-xl font-black m-0">
                    {monitorSelecionado.nome_completo}
                  </h2>
                  <p className="text-xs text-slate-300 m-0 mt-0.5">
                    📍 Residência: {monitorSelecionado.distrito_residencia} •{" "}
                    {calcularIdade(monitorSelecionado.data_nascimento)} anos • ⭐{" "}
                    {monitorSelecionado.experiencia_anos || 0} anos de
                    experiência
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMonitorSelecionado(null)}
                className="w-9 h-9 bg-slate-800 text-white rounded-md font-black cursor-pointer border-0"
              >
                ✕
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-[#F8FAFC] space-y-6 text-xs">
              {/* CONTACTOS E DOCUMENTOS (SE TIVER ACESSO VALIDADO) */}
              <div className="bg-white p-5 rounded-md border border-slate-200">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#2563EB] m-0 mb-3">
                  📞 Contactos Diretos & Documentos Oficiais
                </h3>

                {temAcesso ? (
                  <div className="flex flex-wrap items-center gap-3">
                    {monitorSelecionado.email && (
                      <a
                        href={`mailto:${monitorSelecionado.email}`}
                        className="bg-blue-50 border border-blue-200 text-[#2563EB] font-black px-3.5 py-2 rounded-md no-underline"
                      >
                        ✉️ {monitorSelecionado.email}
                      </a>
                    )}
                    {monitorSelecionado.telefone && (
                      <a
                        href={`https://wa.me/${monitorSelecionado.telefone.replace(
                          /\D/g,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#16A34A] text-white font-black px-3.5 py-2 rounded-md no-underline"
                      >
                        💬 WhatsApp / Tel: {monitorSelecionado.telefone}
                      </a>
                    )}
                    {monitorSelecionado.cv_url && (
                      <a
                        href={monitorSelecionado.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#0F172A] hover:bg-slate-800 text-white font-black px-4 py-2 rounded-md no-underline"
                      >
                        📄 Descarregar Currículo (CV PDF) ↗
                      </a>
                    )}
                    {monitorSelecionado.autorizacao_parental_url && (
                      <a
                        href={monitorSelecionado.autorizacao_parental_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#F59E0B] text-white font-black px-4 py-2 rounded-md no-underline"
                      >
                        📝 Ver Autorização Parental ↗
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="font-bold text-amber-900">
                      🔒 Assine o seu Contrato Global de Parceria para
                      desbloquear o telefone direto, e-mail e download do CV
                      deste candidato.
                    </span>
                    <Link
                      href={`/${lang}/admin/contrato`}
                      className="bg-[#16A34A] text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-md no-underline shrink-0"
                    >
                      Assinar Contrato →
                    </Link>
                  </div>
                )}
              </div>

              {/* APRESENTAÇÃO, FUNÇÃO E COMPETÊNCIAS */}
              <div className="bg-white p-5 rounded-md border border-slate-200 space-y-3">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#16A34A] m-0">
                  🛠️ Apresentação, Função e Competências
                </h3>
                {monitorSelecionado.outras_competencias && (
                  <div className="p-3 bg-[#F8FAFC] rounded-md border border-slate-200 font-black text-[#0F172A]">
                    {monitorSelecionado.outras_competencias}
                  </div>
                )}
                <p className="text-slate-700 leading-relaxed whitespace-pre-line m-0">
                  {monitorSelecionado.bio || "Sem descrição adicional."}
                </p>
              </div>

              {/* CERTIFICAÇÕES E REGIÕES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-md border border-slate-200">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 m-0 mb-3">
                    🏅 Certificações Declaradas
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(monitorSelecionado.certificacoes) &&
                    monitorSelecionado.certificacoes.length > 0 ? (
                      monitorSelecionado.certificacoes.map((cId: string) => (
                        <span
                          key={cId}
                          className="bg-[#16A34A] text-white text-[10px] font-black px-2.5 py-1 rounded-md"
                        >
                          ✓ {CERTIFICADOS_NOMES[cId] || cId}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 font-bold">
                        Sem certificações específicas assinaladas
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-md border border-slate-200">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 m-0 mb-3">
                    📍 Zonas de Atuação Aceites
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(monitorSelecionado.areas_atuacao) &&
                    monitorSelecionado.areas_atuacao.length > 0 ? (
                      monitorSelecionado.areas_atuacao.map((reg: string) => (
                        <span
                          key={reg}
                          className="bg-[#2563EB] text-white text-[10px] font-black px-2.5 py-1 rounded-md"
                        >
                          📍 {reg}
                        </span>
                      ))
                    ) : (
                      <span className="font-bold">
                        {monitorSelecionado.distrito_residencia}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* DIAS DISPONÍVEIS NO CALENDÁRIO */}
              {Array.isArray(monitorSelecionado.calendario_disponibilidade) &&
                monitorSelecionado.calendario_disponibilidade.length > 0 && (
                  <div className="bg-white p-5 rounded-md border border-slate-200">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 m-0 mb-3">
                      📅 Datas Disponíveis Marcadas no Calendário (
                      {monitorSelecionado.calendario_disponibilidade.length}{" "}
                      dias)
                    </h4>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {monitorSelecionado.calendario_disponibilidade
                        .sort()
                        .map((dt: string) => (
                          <span
                            key={dt}
                            className="bg-[#F8FAFC] border border-slate-200 text-[#0F172A] text-[10px] font-bold px-2 py-1 rounded-md"
                          >
                            {dt}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="p-5 bg-white border-t border-slate-200 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={(e) => toggleGuardar(e, monitorSelecionado.id)}
                className={`px-5 py-3 rounded-md text-xs font-black uppercase tracking-widest cursor-pointer border-0 ${
                  guardadosIds.includes(monitorSelecionado.id)
                    ? "bg-[#F43F5E] text-white"
                    : "bg-slate-200 text-[#0F172A]"
                }`}
              >
                {guardadosIds.includes(monitorSelecionado.id)
                  ? "♥ Guardado nos Favoritos"
                  : "♡ Guardar Favorito"}
              </button>

              <button
                type="button"
                onClick={() => iniciarConversaComMonitor(monitorSelecionado)}
                className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest px-7 py-3.5 rounded-md cursor-pointer border-0 shadow-sm"
              >
                💬 Convidar para Entrevista / Iniciar Chat →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE BLOQUEIO PARA PARCEIROS SEM CONTRATO APROVADO */}
      {showLockModal && (
        <div className="fixed inset-0 bg-slate-900/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-md p-8 text-center shadow-2xl border border-slate-300">
            <span className="text-4xl block mb-3">🔒</span>
            <h3 className="text-lg font-black text-[#0F172A] m-0 mb-2">
              Acesso Exclusivo a Parceiros Verificados
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Para proteger a privacidade dos monitores, o contacto direto e o
              download de currículos requerem que o seu Contrato Global de
              Parceria esteja assinado.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowLockModal(false)}
                className="bg-slate-600 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-md cursor-pointer border-0"
              >
                Fechar
              </button>
              <Link
                href={`/${lang}/admin/contrato`}
                className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-md no-underline"
              >
                Assinar Contrato Agora →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TERMOS DE RESPONSABILIDADE DE RECRUTAMENTO */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-md p-6 md:p-8 shadow-2xl border border-slate-300 space-y-5">
            <span className="bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block">
              ⚖️ Termo Legal Obrigatório
            </span>
            <h3 className="text-xl font-black text-[#0F172A] m-0">
              Utilização da Bolsa Nacional de Monitores
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed m-0 text-justify">
              A HelloCamp disponibiliza gratuitamente este diretório para ligar
              monitores e entidades organizadoras. Ao prosseguir, a sua entidade
              reconhece que é a única responsável por entrevistar os candidatos,
              validar os diplomas originais, exigir o Registo Criminal para
              contacto com menores (Lei n.º 113/2009) e formalizar o vínculo e
              seguro aplicável.
            </p>
            <label className="flex items-start gap-3 cursor-pointer bg-[#F8FAFC] p-4 rounded-md border border-slate-200">
              <input
                type="checkbox"
                checked={checkboxTermos}
                onChange={(e) => setCheckboxTermos(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#16A34A]"
              />
              <span className="text-xs font-bold text-[#0F172A]">
                Compreendo e aceito os termos de responsabilidade de
                recrutamento.
              </span>
            </label>
            <button
              type="button"
              disabled={!checkboxTermos || savingTerms}
              onClick={handleAceitarTermos}
              className="w-full py-3.5 bg-[#16A34A] hover:bg-green-700 disabled:bg-slate-400 text-white font-black text-xs uppercase tracking-widest rounded-md cursor-pointer border-0"
            >
              {savingTerms ? "A gravar..." : "✓ Confirmar e Entrar na Bolsa"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
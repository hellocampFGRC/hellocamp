"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
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
];

const CERTIFICADOS_LISTA = [
  { id: "IPDJ", label: "Monitor de Campos de Férias (IPDJ)" },
  { id: "Socorrismo", label: "Primeiros Socorros / Suporte Básico" },
  { id: "Nadador", label: "Nadador Salvador" },
  { id: "Professor", label: "Formação em Educação / Desporto" },
  { id: "Animacao", label: "Animação Sociocultural" },
  { id: "Linguas", label: "Fluência em Línguas Estrangeiras" },
  { id: "Artes", label: "Artes Plásticas / Música / Teatro" },
  { id: "NEE", label: "Necessidades Educativas Especiais" },
];

export default function BolsaRecrutamentoAdminPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [parceiroPerfil, setParceiroPerfil] = useState<any>(null);
  const [termosAceites, setTermosAceites] = useState(false);
  const [acceptingTerms, setAcceptingTerms] = useState(false);

  const [monitores, setMonitores] = useState<any[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroDistrito, setFiltroDistrito] = useState("todos");
  const [filtroCertificado, setFiltroCertificado] = useState("todos");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Modal de Perfil Completo do Monitor e Chat de Recrutamento
  const [monitorSelecionado, setMonitorSelecionado] = useState<any>(null);
  const [mensagensChat, setMensagensChat] = useState<any[]>([]);
  const [textoConvite, setTextoConvite] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    const carregarBolsa = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${lang}/login`);
        return;
      }

      const uid = session.user.id;

      const [{ data: perfilData }, { data: monitoresData }] = await Promise.all(
        [
          supabase.from("perfis").select("*").eq("id", uid).maybeSingle(),
          supabase
            .from("monitores_perfis")
            .select("*")
            .eq("perfil_visivel", true)
            .order("updated_at", { ascending: false }),
        ]
      );

      if (perfilData) {
        setParceiroPerfil(perfilData);
        setTermosAceites(Boolean(perfilData.termos_recrutamento_aceites));
      }

      setMonitores(monitoresData || []);
      setLoading(false);
    };

    carregarBolsa();
  }, [lang, router]);

  const handleAceitarTermosRecrutamento = async () => {
    if (!parceiroPerfil?.id) return;
    setAcceptingTerms(true);
    try {
      await supabase
        .from("perfis")
        .update({ termos_recrutamento_aceites: true })
        .eq("id", parceiroPerfil.id);
      setTermosAceites(true);
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setAcceptingTerms(false);
    }
  };

  const abrirModalMonitor = async (mon: any) => {
    setMonitorSelecionado(mon);
    if (!parceiroPerfil?.id) return;

    const { data: msgs } = await supabase
      .from("mensagens_recrutamento")
      .select("*")
      .eq("parceiro_id", parceiroPerfil.id)
      .eq("monitor_id", mon.id)
      .order("created_at", { ascending: true });

    setMensagensChat(msgs || []);

    // Marca mensagens recebidas do monitor como lidas
    await supabase
      .from("mensagens_recrutamento")
      .update({ lida: true })
      .eq("parceiro_id", parceiroPerfil.id)
      .eq("monitor_id", mon.id)
      .eq("remetente", "monitor");
  };

  const handleEnviarPropostaMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoConvite.trim() || !monitorSelecionado || !parceiroPerfil) return;

    setSendingMsg(true);
    try {
      const msgTexto = textoConvite.trim();
      const { data: novaMsg, error } = await supabase
        .from("mensagens_recrutamento")
        .insert([
          {
            parceiro_id: parceiroPerfil.id,
            monitor_id: monitorSelecionado.id,
            remetente: "parceiro",
            mensagem: msgTexto,
            lida: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setMensagensChat((prev) => [...prev, novaMsg]);
      setTextoConvite("");

      // Dispara notificação por e-mail ao monitor
      await fetch("/api/notificacoes/nova-mensagem-recrutamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinatarioEmail: monitorSelecionado.email,
          destinatarioNome: monitorSelecionado.nome_completo,
          remetenteNome:
            parceiroPerfil.empresa_nome ||
            parceiroPerfil.nome_empresa ||
            parceiroPerfil.nome_completo ||
            "Organizador HelloCamp",
          mensagemTexto: msgTexto,
          tipoDestinatario: "monitor",
          lang,
        }),
      }).catch(() => {});
    } catch (err: any) {
      alert("Erro ao enviar mensagem: " + err.message);
    } finally {
      setSendingMsg(false);
    }
  };

  const monitoresFiltrados = monitores.filter((m: any) => {
    if (filtroDistrito !== "todos") {
      const atua = Array.isArray(m.areas_atuacao)
        ? m.areas_atuacao.join(" ")
        : "";
      if (
        m.distrito_residencia !== filtroDistrito &&
        !atua.includes(filtroDistrito) &&
        !atua.toLowerCase().includes("todo o país")
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

  if (loading) {
    return (
      <div className="p-12 text-center font-black text-xs uppercase tracking-widest text-slate-400 animate-pulse">
        {isEn
          ? "Loading Monitor Recruitment Pool..."
          : "A carregar Bolsa Nacional de Monitores..."}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto font-sans text-[#0F172A] pb-20 space-y-8">
      {/* CABEÇALHO */}
      <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="inline-block bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-2">
            {isEn ? "Talent Pool" : "Recrutamento & Equipas"}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#0F172A] m-0 tracking-tight">
            {isEn
              ? "Monitor & Staff Recruitment Pool"
              : "Bolsa Nacional de Monitores e Coordenadores"}
          </h1>
          <p className="text-slate-500 mt-1 mb-0 text-xs md:text-sm font-medium">
            {isEn
              ? "Find certified monitors, view availability calendars, download CVs, and send direct job invitations."
              : "Encontre monitores certificados, consulte calendários de disponibilidade, currículos e envie convites diretos."}
          </p>
        </div>

        <span className="bg-[#0F172A] text-white font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-md">
          🎓 {monitoresFiltrados.length}{" "}
          {isEn ? "Available Monitors" : "Monitores Disponíveis"}
        </span>
      </div>

      {/* TERMO DE RESPONSABILIDADE DE RECRUTAMENTO (SE AINDA NÃO ACEITE) */}
      {!termosAceites && (
        <div className="bg-[#0F172A] text-white p-6 md:p-8 rounded-md border-l-4 border-[#F59E0B] shadow-md space-y-4">
          <span className="bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block">
            ⚖️ Condições de Utilização da Bolsa de Monitores
          </span>
          <h2 className="text-lg font-black m-0">
            Termo de Responsabilidade de Recrutamento Direto
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed m-0">
            A Bolsa de Monitores HelloCamp é um diretório gratuito que aproxima
            candidatos e entidades organizadoras. Cabe exclusivamente à entidade
            organizadora verificar a autenticidade dos certificados, exigir o
            Registo Criminal para contacto com menores (Lei n.º 113/2009) e
            formalizar o respetivo vínculo contratual e seguro de trabalho.
          </p>
          <button
            type="button"
            disabled={acceptingTerms}
            onClick={handleAceitarTermosRecrutamento}
            className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-md cursor-pointer border-0"
          >
            {acceptingTerms
              ? "A ativar..."
              : "✓ Compreendo e Aceito — Desbloquear Contactos e CVs"}
          </button>
        </div>
      )}

      {/* BARRA DE FILTROS CUSTOMIZADOS */}
      <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
            Pesquisar por Nome ou Competência
          </label>
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Ex: Surf, Inglês, Primeiros Socorros..."
            className="w-full py-3 px-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
          />
        </div>

        {/* Dropdown Customizado de Distrito */}
        <div className="relative">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
            Distrito de Residência / Atuação
          </label>
          <div
            onClick={() =>
              setOpenDropdown(
                openDropdown === "distrito" ? null : "distrito"
              )
            }
            className="w-full py-3 px-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] cursor-pointer flex justify-between items-center"
          >
            <span>
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

        {/* Dropdown Customizado de Certificação */}
        <div className="relative">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
            Certificação / Especialidade
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
                : CERTIFICADOS_LISTA.find((c) => c.id === filtroCertificado)
                    ?.label || filtroCertificado}
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
              {CERTIFICADOS_LISTA.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setFiltroCertificado(c.id);
                    setOpenDropdown(null);
                  }}
                  className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                >
                  {c.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GRELHA DE MONITORES */}
      {monitoresFiltrados.length === 0 ? (
        <div className="bg-white p-12 rounded-md border border-slate-200 text-center">
          <div className="text-4xl mb-3">🎓</div>
          <h3 className="text-base font-black text-[#0F172A] mb-1">
            Nenhum monitor encontrado com estes filtros
          </h3>
          <p className="text-xs font-bold text-slate-500 m-0">
            Experimente limpar o filtro de distrito ou certificação.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monitoresFiltrados.map((mon: any) => {
            const certs: string[] = Array.isArray(mon.certificacoes)
              ? mon.certificacoes
              : [];

            return (
              <div
                key={mon.id}
                className="bg-white rounded-md border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-md bg-[#2563EB] text-white flex items-center justify-center text-xl font-black overflow-hidden shrink-0">
                      {mon.foto_url ? (
                        <img
                          src={mon.foto_url}
                          alt={mon.nome_completo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (mon.nome_completo || "M").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-[#0F172A] m-0 truncate">
                        {mon.nome_completo || "Monitor"}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 m-0 mt-0.5">
                        📍 {mon.distrito_residencia || "Portugal"} • ⭐{" "}
                        {mon.experiencia_anos || 0} anos exp.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                    {mon.bio || "Disponível para integrar equipas de campos de férias."}
                  </p>

                  {certs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {certs.slice(0, 4).map((cId) => (
                        <span
                          key={cId}
                          className="bg-[#F8FAFC] border border-slate-200 text-[#0F172A] text-[10px] font-black px-2.5 py-1 rounded-md"
                        >
                          ✓ {cId}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => abrirModalMonitor(mon)}
                  className="w-full py-3 bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest rounded-md cursor-pointer border-0 transition-colors"
                >
                  👁️ Ver Perfil, CV & Contactar →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETALHE DO MONITOR E CHAT DIRETO DE RECRUTAMENTO */}
      {monitorSelecionado && (
        <div
          className="fixed inset-0 bg-slate-900/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setMonitorSelecionado(null)}
        >
          <div
            className="bg-white w-full max-w-3xl max-h-[90vh] rounded-md overflow-hidden shadow-2xl border border-slate-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0F172A] text-white p-6 flex items-center justify-between border-b-4 border-[#16A34A]">
              <div>
                <span className="bg-[#F59E0B] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block mb-1">
                  Perfil de Candidato • Bolsa HelloCamp
                </span>
                <h2 className="text-xl font-black m-0">
                  {monitorSelecionado.nome_completo}
                </h2>
                <p className="text-xs text-slate-300 m-0 mt-1">
                  📍 {monitorSelecionado.distrito_residencia} •{" "}
                  {monitorSelecionado.experiencia_anos || 0} anos de experiência
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMonitorSelecionado(null)}
                className="w-9 h-9 bg-slate-800 text-white rounded-md font-black cursor-pointer border-0"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-[#F8FAFC] space-y-6 text-xs">
              <div className="bg-white p-5 rounded-md border border-slate-200 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#2563EB] m-0">
                  Apresentação & Competências
                </h3>
                <p className="text-slate-700 leading-relaxed m-0">
                  {monitorSelecionado.bio || "Sem biografia adicional."}
                </p>
                {monitorSelecionado.outras_competencias && (
                  <p className="font-bold text-[#0F172A] m-0">
                    🛠️ Outras Competências:{" "}
                    {monitorSelecionado.outras_competencias}
                  </p>
                )}

                {termosAceites ? (
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-3">
                    {monitorSelecionado.email && (
                      <span className="bg-blue-50 text-[#2563EB] font-black px-3 py-1.5 rounded-md">
                        ✉️ {monitorSelecionado.email}
                      </span>
                    )}
                    {monitorSelecionado.telefone && (
                      <span className="bg-emerald-50 text-[#16A34A] font-black px-3 py-1.5 rounded-md">
                        📞 {monitorSelecionado.telefone}
                      </span>
                    )}
                    {monitorSelecionado.cv_url && (
                      <a
                        href={monitorSelecionado.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#0F172A] text-white font-black px-4 py-1.5 rounded-md no-underline"
                      >
                        📄 Abrir Currículo (CV) ↗
                      </a>
                    )}
                    {monitorSelecionado.autorizacao_parental_url && (
                      <a
                        href={monitorSelecionado.autorizacao_parental_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#F59E0B] text-white font-black px-4 py-1.5 rounded-md no-underline"
                      >
                        📝 Ver Autorização Parental ↗
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md font-bold text-amber-900">
                    Aceite o Termo de Responsabilidade no topo da página para
                    visualizar o telefone direto, e-mail e CV deste candidato.
                  </div>
                )}
              </div>

              {/* CHAT DE RECRUTAMENTO COM O MONITOR */}
              <div className="bg-white p-5 rounded-md border border-slate-200 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#16A34A] m-0">
                  💬 Enviar Proposta / Mensagem Direta de Recrutamento
                </h3>

                <div className="max-h-52 overflow-y-auto space-y-2.5 bg-[#F8FAFC] p-4 rounded-md border border-slate-200">
                  {mensagensChat.length === 0 ? (
                    <p className="text-slate-400 font-bold text-center m-0 py-4">
                      Ainda não iniciou conversa com este candidato. Envie uma
                      proposta abaixo!
                    </p>
                  ) : (
                    mensagensChat.map((m: any) => {
                      const isEu = m.remetente === "parceiro";
                      return (
                        <div
                          key={m.id}
                          className={`p-3 rounded-md max-w-[85%] ${
                            isEu
                              ? "ml-auto bg-[#2563EB] text-white"
                              : "mr-auto bg-white border border-slate-200 text-[#0F172A]"
                          }`}
                        >
                          <p className="m-0 font-medium leading-relaxed">
                            {m.mensagem}
                          </p>
                          <span
                            className={`block text-[9px] mt-1 ${
                              isEu ? "text-blue-100" : "text-slate-400"
                            }`}
                          >
                            {new Date(m.created_at).toLocaleString("pt-PT")}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={handleEnviarPropostaMonitor}
                  className="flex gap-2.5"
                >
                  <input
                    type="text"
                    required
                    value={textoConvite}
                    onChange={(e) => setTextoConvite(e.target.value)}
                    placeholder="Escreva a sua proposta de trabalho ou agende uma entrevista..."
                    className="flex-1 py-3 px-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                  <button
                    type="submit"
                    disabled={sendingMsg}
                    className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-md cursor-pointer border-0 shrink-0"
                  >
                    {sendingMsg ? "..." : "Enviar →"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
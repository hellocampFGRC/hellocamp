"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

export default function InboxMonitorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [conversas, setConversas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversaAtiva, setConversaAtiva] = useState<any>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [monitorId, setMonitorId] = useState<string | null>(null);
  const [monitorPerfil, setMonitorPerfil] = useState<any>(null);
  const [sending, setSending] = useState(false);

  const carregarMensagensMonitor = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const mId = session.user.id;
    setMonitorId(mId);

    const { data: profile } = await supabase
      .from("monitores")
      .select("nome_completo")
      .eq("id", mId)
      .maybeSingle();
    setMonitorPerfil(profile);

    const { data: msgData } = await supabase
      .from("mensagens_recrutamento")
      .select("*")
      .eq("monitor_id", mId)
      .order("criado_at", { ascending: true });

    if (msgData && msgData.length > 0) {
      const parceirosIds = Array.from(
        new Set(msgData.map((m) => m.parceiro_id).filter(Boolean))
      );
      const { data: perfisParceiros } = await supabase
        .from("perfis")
        .select("id, empresa_nome, nome_completo, email")
        .in("id", parceirosIds);

      const mapaParceiros = new Map(
        (perfisParceiros || []).map((p) => [p.id, p])
      );

      const threadsMap: Record<string, any> = {};

      msgData.forEach((msg) => {
        const pId = msg.parceiro_id;
        const pObj: any = mapaParceiros.get(pId) || {};
        if (!threadsMap[pId]) {
          threadsMap[pId] = {
            parceiro_id: pId,
            parceiro_nome:
              pObj.empresa_nome ||
              pObj.nome_completo ||
              (isEn ? "Camp Organizer" : "Organizador de Campo"),
            parceiro_email: pObj.email || "",
            vaga: isEn ? "Camp Staff Position" : "Proposta de Recrutamento",
            mensagens: [],
            ultima_mensagem: "",
            data: "",
            lida: true,
          };
        }
        threadsMap[pId].mensagens.push(msg);
        threadsMap[pId].ultima_mensagem = msg.mensagem;
        threadsMap[pId].data = new Date(msg.criado_at).toLocaleDateString(
          "pt-PT",
          { hour: "2-digit", minute: "2-digit" }
        );
        if (msg.remetente === "parceiro" && !msg.lida) {
          threadsMap[pId].lida = false;
        }
      });

      const lista = Object.values(threadsMap);
      setConversas(lista);
      setConversaAtiva((prev: any) =>
        prev ? threadsMap[prev.parceiro_id] || null : lista[0] || null
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarMensagensMonitor();
  }, []);

  const marcarComoLidas = async (pId: string) => {
    if (!monitorId) return;
    await supabase
      .from("mensagens_recrutamento")
      .update({ lida: true })
      .eq("monitor_id", monitorId)
      .eq("parceiro_id", pId)
      .eq("remetente", "parceiro");
  };

  const selecionarConversa = (conv: any) => {
    setConversaAtiva(conv);
    marcarComoLidas(conv.parceiro_id);
  };

  const handleEnviarResposta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !monitorId || !conversaAtiva || sending) return;
    setSending(true);

    const textoLimpo = novaMensagem.trim();
    const { error } = await supabase.from("mensagens_recrutamento").insert([
      {
        parceiro_id: conversaAtiva.parceiro_id,
        monitor_id: monitorId,
        remetente: "monitor",
        mensagem: textoLimpo,
        lida: false,
      },
    ]);

    if (error) {
      alert(error.message);
      setSending(false);
      return;
    }

    if (conversaAtiva.parceiro_email) {
      fetch("/api/notificacoes/nova-mensagem-recrutamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinatarioEmail: conversaAtiva.parceiro_email,
          nomeRemetente: monitorPerfil?.nome_completo || "Candidato Monitor",
          textoMensagem: textoLimpo,
          tipoDestinatario: "parceiro",
          lang,
        }),
      }).catch(() => {});
    }

    setNovaMensagem("");
    setSending(false);
    carregarMensagensMonitor();
  };

  if (loading) {
    return (
      <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">
        {isEn
          ? "Loading your job offers..."
          : "A carregar os teus convites de recrutamento..."}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 m-0 tracking-tight">
          {isEn ? "Job Proposals & Messages" : "Propostas de Trabalho"}
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1 mb-0">
          {isEn
            ? "Reply directly to verified camp organizers interested in your profile."
            : "Responde diretamente às entidades organizadoras interessadas no teu perfil."}
        </p>
      </div>

      {conversas.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
          <span className="text-5xl block mb-4">📭</span>
          <h3 className="text-xl font-black text-slate-900 m-0 mb-2">
            {isEn ? "No job offers yet" : "Ainda não recebeste propostas"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto m-0">
            {isEn
              ? "Keep your calendar availability and photo updated in 'My Profile' to stand out to camp directors."
              : "Mantém o teu calendário de disponibilidade e a tua fotografia atualizados no separador 'O Meu Perfil' para te destacares nas pesquisas dos campos."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[580px]">
          <div className="md:col-span-4 border-r border-slate-200 overflow-y-auto">
            {conversas.map((conv) => (
              <button
                key={conv.parceiro_id}
                type="button"
                onClick={() => selecionarConversa(conv)}
                className={`w-full text-left p-4 border-b border-slate-100 flex items-center gap-3 cursor-pointer ${
                  conversaAtiva?.parceiro_id === conv.parceiro_id
                    ? "bg-blue-50 border-l-4 border-l-[#2563eb]"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center font-black">
                  🏕️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm text-slate-900 truncate">
                      {conv.parceiro_nome}
                    </span>
                    {!conv.lida && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#e2a41d]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate m-0 mt-0.5">
                    {conv.ultima_mensagem}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="md:col-span-8 flex flex-col bg-slate-50/50">
            {conversaAtiva ? (
              <>
                <div className="bg-white p-4 px-6 border-b border-slate-200">
                  <h3 className="text-base font-black text-slate-900 m-0">
                    {conversaAtiva.parceiro_nome}
                  </h3>
                  <span className="text-xs font-bold text-[#2563eb]">
                    {conversaAtiva.vaga}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {conversaAtiva.mensagens.map((m: any) => {
                    const souEu = m.remetente === "monitor";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          souEu ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
                            souEu
                              ? "bg-[#2563eb] text-white rounded-br-none"
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
                  onSubmit={handleEnviarResposta}
                  className="bg-white p-4 border-t border-slate-200 flex gap-3"
                >
                  <input
                    type="text"
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    placeholder={
                      isEn
                        ? "Reply to the camp organizer..."
                        : "Escreve a tua resposta ao organizador..."
                    }
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#2563eb]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !novaMensagem.trim()}
                    className="bg-[#2563eb] hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs px-6 rounded-xl cursor-pointer"
                  >
                    {sending ? "..." : isEn ? "Send" : "Enviar"}
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
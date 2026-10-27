"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function InboxParceiro({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [nomeOrganizador, setNomeOrganizador] = useState<string>("Parceiro HelloCamp");
  const [threads, setThreads] = useState<any[]>([]);
  const [threadAtiva, setThreadAtiva] = useState<any | null>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "nao_lidas">("todas");

  const mensagensEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCaixaDeEntrada();
    const channel = supabase
      .channel("chat_parceiro_geral")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens" },
        () => fetchCaixaDeEntrada()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCaixaDeEntrada = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;
    setPartnerId(uid);

    // 0. Nome do parceiro para usar no envio de e-mail ao Pai
    const { data: meuPerfil } = await supabase
      .from("perfis")
      .select("empresa_nome, nome_completo")
      .eq("id", uid)
      .single();
    if (meuPerfil) {
      setNomeOrganizador(
        meuPerfil.empresa_nome || meuPerfil.nome_completo || "Organizador HelloCamp"
      );
    }

    // 1. Campos deste organizador
    const { data: camposData } = await supabase
      .from("campos")
      .select("id, nome, nome_en")
      .eq("organizador_id", uid);
    const camposIds = camposData?.map((c) => c.id) || [];

    // 2. Reservas feitas nos campos deste organizador (para mostrar contexto na conversa)
    let reservasData: any[] = [];
    if (camposIds.length > 0) {
      const { data: resData } = await supabase
        .from("reservas")
        .select("*, criancas(id, nome, data_nascimento, restricoes_alimentares)")
        .in("campo_id", camposIds);
      reservasData = resData || [];
    }

    // 3. Todas as mensagens enviadas ou recebidas por este parceiro
    const { data: msgs } = await supabase
      .from("mensagens")
      .select(
        `
        *, 
        campos(id, nome, nome_en), 
        perfis_sender:perfis!mensagens_sender_id_fkey(id, nome_completo, email, telefone, contacto_emergencia), 
        perfis_receiver:perfis!mensagens_receiver_id_fkey(id, nome_completo, email, telefone, contacto_emergencia)
      `
      )
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order("created_at", { ascending: true });

    if (!msgs) {
      setLoading(false);
      return;
    }

    // 4. Agrupamento por (Pai/Cliente + Campo)
    const threadsMap: Record<string, any> = {};

    msgs.forEach((m: any) => {
      const campId = m.campo_id || "geral";
      const clientId = m.sender_id === uid ? m.receiver_id : m.sender_id;
      const clientProfile =
        m.sender_id === uid ? m.perfis_receiver : m.perfis_sender;
      const key = `${clientId}_${campId}`;

      if (!threadsMap[key]) {
        const inscricoesDestePai =
          reservasData.filter(
            (r) =>
              r.cliente_id === clientId &&
              (campId === "geral" || r.campo_id === campId)
          ) || [];

        threadsMap[key] = {
          chave: key,
          campo: m.campos || {
            id: m.campo_id,
            nome: isEn ? "General Inquiry" : "Questão Geral",
          },
          cliente_id: clientId,
          cliente_nome:
            clientProfile?.nome_completo ||
            clientProfile?.email?.split("@")[0] ||
            (isEn ? "Parent / Guardian" : "Encarregado de Educação"),
          cliente: clientProfile,
          reservas: inscricoesDestePai,
          mensagens: [],
          unread: 0,
          lastMsg: null,
        };
      }

      threadsMap[key].mensagens.push(m);
      threadsMap[key].lastMsg = m;
      if (!m.lida && m.receiver_id === uid) {
        threadsMap[key].unread++;
      }
    });

    const threadsArray = Object.values(threadsMap).sort(
      (a: any, b: any) =>
        new Date(b.lastMsg.created_at).getTime() -
        new Date(a.lastMsg.created_at).getTime()
    );

    setThreads(threadsArray);
    setThreadAtiva((prev: any) =>
      prev ? threadsMap[prev.chave] || null : threadsArray[0] || null
    );
    setLoading(false);
  };

  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadAtiva?.mensagens?.length]);

  const abrirConversa = async (thread: any) => {
    setThreadAtiva(thread);
    if (thread.unread > 0 && partnerId) {
      let query = supabase
        .from("mensagens")
        .update({ lida: true })
        .eq("sender_id", thread.cliente_id)
        .eq("receiver_id", partnerId)
        .eq("lida", false);

      if (thread.campo?.id) {
        query = query.eq("campo_id", thread.campo.id);
      }

      await query;
      fetchCaixaDeEntrada();
    }
  };

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !threadAtiva || !partnerId || sending) return;

    setSending(true);
    const msgTexto = novaMensagem.trim();
    setNovaMensagem("");

    const novaMsgVisual = {
      id: Date.now(),
      sender_id: partnerId,
      texto: msgTexto,
      created_at: new Date().toISOString(),
    };

    setThreadAtiva((prev: any) => ({
      ...prev,
      mensagens: [...prev.mensagens, novaMsgVisual],
    }));

    const { error } = await supabase.from("mensagens").insert([
      {
        campo_id: threadAtiva.campo?.id || null,
        sender_id: partnerId,
        receiver_id: threadAtiva.cliente_id,
        texto: msgTexto,
        lida: false,
      },
    ]);

    if (error) {
      alert(
        (isEn ? "Error sending message: " : "Erro ao enviar mensagem: ") +
          error.message
      );
      setSending(false);
      return;
    }

    // MELHORIA CRÍTICA: Envia também um E-mail para o Pai a avisar da resposta do Parceiro!
    const emailPai = threadAtiva.cliente?.email;
    const nomeCampo =
      isEn && threadAtiva.campo?.nome_en
        ? threadAtiva.campo.nome_en
        : threadAtiva.campo?.nome || "HelloCamp";

    if (emailPai) {
      fetch("/api/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeOrganizador,
          emailCliente: "info@hellocamp.pt",
          emailCampo: emailPai,
          nomeCampo: nomeCampo,
          mensagem: `${
            isEn
              ? `Reply from organizer ${nomeOrganizador} regarding "${nomeCampo}":`
              : `Resposta do organizador ${nomeOrganizador} sobre o programa "${nomeCampo}":`
          }\n\n"${msgTexto}"\n\n${
            isEn
              ? `View and reply in your Parent Portal: https://www.hellocamp.pt/${lang}/cliente/mensagens`
              : `Consulte e responda no seu Portal de Cliente: https://www.hellocamp.pt/${lang}/cliente/mensagens`
          }`,
        }),
      }).catch(() => {});
    }

    setSending(false);
    fetchCaixaDeEntrada();
  };

  const threadsFiltradas =
    filtro === "nao_lidas" ? threads.filter((t) => t.unread > 0) : threads;

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">
        {isEn ? "Loading Inbox..." : "A preparar Caixa de Entrada..."}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-sans h-[calc(100vh-130px)] min-h-[600px] flex flex-col">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 m-0 tracking-tight">
            {isEn ? "Parent Messages (Inbox)" : "Caixa de Entrada (Pais)"}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium m-0 mt-1">
            {isEn
              ? "Direct communication with parents. Your replies are also sent to their email."
              : "Comunique diretamente com os encarregados de educação. As suas respostas seguem também por e-mail."}
          </p>
        </div>

        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setFiltro("todas")}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest cursor-pointer transition-colors ${
              filtro === "todas"
                ? "bg-[#167524] text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {isEn ? "All" : "Todas"} ({threads.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltro("nao_lidas")}
            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest cursor-pointer transition-colors ${
              filtro === "nao_lidas"
                ? "bg-[#167524] text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {isEn ? "Unread" : "Não Lidas"} (
            {threads.filter((t) => t.unread > 0).length})
          </button>
        </div>
      </div>

      {threads.length === 0 ? (
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center p-12 text-center shadow-sm">
          <span className="text-5xl mb-4">📭</span>
          <h3 className="text-xl font-black text-slate-900 m-0 mb-2">
            {isEn ? "No messages yet" : "Ainda não tem mensagens"}
          </h3>
          <p className="text-sm text-slate-500 max-w-md m-0">
            {isEn
              ? "When parents ask questions on your camp pages or start a booking, their messages will appear here."
              : "Quando os pais enviarem dúvidas na página dos seus campos ou iniciarem uma reserva, as conversas aparecerão aqui."}
          </p>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* LISTA DE CONVERSAS (4 Colunas) */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto flex flex-col max-h-[240px] md:max-h-full">
            {threadsFiltradas.map((t) => {
              const isSelected = threadAtiva?.chave === t.chave;
              const nomeCampo =
                isEn && t.campo?.nome_en ? t.campo.nome_en : t.campo?.nome;

              return (
                <button
                  key={t.chave}
                  type="button"
                  onClick={() => abrirConversa(t)}
                  className={`w-full text-left p-4 border-b border-slate-100 transition-colors cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? "bg-emerald-50/70 border-l-4 border-l-[#167524]"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#167524]/10 text-[#167524] font-black text-sm flex items-center justify-center flex-shrink-0">
                    {t.cliente_nome.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-black text-sm text-slate-900 truncate">
                        {t.cliente_nome}
                      </span>
                      {t.unread > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          {t.unread}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-[#167524] uppercase tracking-wider truncate m-0 mb-1">
                      🏕️ {nomeCampo}
                    </p>
                    <p className="text-xs text-slate-500 truncate m-0">
                      {t.lastMsg?.texto}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ÁREA DE CHAT E DETALHES DO CLIENTE (8 Colunas) */}
          <div className="md:col-span-8 flex flex-col min-h-0 bg-slate-50/50">
            {threadAtiva ? (
              <>
                {/* CABEÇALHO DO CHAT COM CONTEXTO DO PAI */}
                <div className="bg-white p-4 px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-slate-900 m-0">
                        {threadAtiva.cliente_nome}
                      </h2>
                      {threadAtiva.reservas?.length > 0 ? (
                        <span className="bg-emerald-100 text-[#167524] text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                          ✓ {threadAtiva.reservas.length}{" "}
                          {isEn ? "Booking(s)" : "Reserva(s)"}
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                          {isEn ? "Potential Lead" : "Potencial Cliente"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">
                      {threadAtiva.cliente?.email || ""}{" "}
                      {threadAtiva.cliente?.telefone
                        ? `• 📞 ${threadAtiva.cliente.telefone}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {threadAtiva.cliente?.telefone && (
                      <a
                        href={`https://wa.me/${threadAtiva.cliente.telefone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-50 hover:bg-emerald-100 text-[#167524] border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-black no-underline transition-colors"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    {threadAtiva.reservas?.length > 0 && (
                      <Link
                        href={`/${lang}/admin/reservas`}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold no-underline transition-colors"
                      >
                        📋 {isEn ? "View Booking" : "Ver Reserva"}
                      </Link>
                    )}
                  </div>
                </div>

                {/* HISTÓRICO DE MENSAGENS */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {threadAtiva.mensagens.map((m: any) => {
                    const souEu = m.sender_id === partnerId;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          souEu ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                            souEu
                              ? "bg-[#167524] text-white rounded-br-none"
                              : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                          }`}
                        >
                          {m.texto}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 px-1">
                          {new Date(m.created_at).toLocaleString(
                            isEn ? "en-GB" : "pt-PT",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={mensagensEndRef} />
                </div>

                {/* CAIXA DE RESPOSTA */}
                <form
                  onSubmit={enviarMensagem}
                  className="bg-white p-4 border-t border-slate-200 flex gap-3 items-end"
                >
                  <textarea
                    rows={2}
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    placeholder={
                      isEn
                        ? "Write your reply here... (the parent will also receive an email notification)"
                        : "Escreva a sua resposta aqui... (o encarregado de educação também receberá alerta por e-mail)"
                    }
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-[#167524] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        enviarMensagem(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !novaMensagem.trim()}
                    className="bg-[#167524] hover:bg-[#115a1b] disabled:bg-slate-300 text-white font-black uppercase tracking-widest text-xs px-6 py-4 rounded-xl cursor-pointer transition-colors shadow-sm"
                  >
                    {sending
                      ? isEn
                        ? "Sending..."
                        : "A enviar..."
                      : isEn
                      ? "Send"
                      : "Enviar"}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 font-bold text-sm">
                {isEn
                  ? "Select a conversation on the left"
                  : "Selecione uma conversa à esquerda"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
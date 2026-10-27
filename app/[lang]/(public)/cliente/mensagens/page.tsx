"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function MensagensClientePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [userId, setUserId] = useState<string | null>(null);
  const [nomePai, setNomePai] = useState<string>("Encarregado de Educação");
  const [emailPai, setEmailPai] = useState<string>("");
  const [threads, setThreads] = useState<any[]>([]);
  const [threadAtiva, setThreadAtiva] = useState<any | null>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loading, setLoading] = useState(true);
  const mensagensEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCaixaDeEntrada();
    const channel = supabase
      .channel("chat_cliente_geral")
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
    setUserId(uid);
    setEmailPai(session.user.email || "");

    const { data: meuPerfil } = await supabase
      .from("perfis")
      .select("nome_completo")
      .eq("id", uid)
      .maybeSingle();
    if (meuPerfil?.nome_completo) setNomePai(meuPerfil.nome_completo);

    const [{ data: reservasData }, { data: msgs }] = await Promise.all([
      supabase
        .from("reservas")
        .select("*, criancas(*)")
        .eq("cliente_id", uid),
      supabase
        .from("mensagens")
        .select(
          "*, campos(id, nome, nome_en, organizador_id, local, imagem, preco)"
        )
        .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
        .order("created_at", { ascending: true }),
    ]);

    if (!msgs) {
      setLoading(false);
      return;
    }

    const threadsMap: Record<string, any> = {};

    msgs.forEach((m: any) => {
      const campId = m.campo_id || "geral";
      const campoObj = m.campos || {
        id: campId,
        nome: isEn ? "Camp Organizer" : "Organizador HelloCamp",
        organizador_id: m.sender_id === uid ? m.receiver_id : m.sender_id,
        local: "Portugal",
      };

      if (!threadsMap[campId]) {
        const reservasDoCampo =
          reservasData?.filter((r) => r.campo_id === campId) || [];

        threadsMap[campId] = {
          campo: campoObj,
          partner_id:
            campoObj.organizador_id ||
            (m.sender_id === uid ? m.receiver_id : m.sender_id),
          mensagens: [],
          reservas: reservasDoCampo,
          unread: 0,
          lastMsg: null,
        };
      }

      threadsMap[campId].mensagens.push(m);
      threadsMap[campId].lastMsg = m;
      if (!m.lida && m.receiver_id === uid) {
        threadsMap[campId].unread++;
      }
    });

    const threadsArray = Object.values(threadsMap).sort(
      (a: any, b: any) =>
        new Date(b.lastMsg.created_at).getTime() -
        new Date(a.lastMsg.created_at).getTime()
    );

    setThreads(threadsArray);
    setThreadAtiva((prev: any) =>
      prev ? threadsMap[prev.campo.id] || null : threadsArray[0] || null
    );
    setLoading(false);
  };

  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadAtiva?.mensagens?.length]);

  const abrirConversa = async (thread: any) => {
    setThreadAtiva(thread);
    if (thread.unread > 0 && userId) {
      await supabase
        .from("mensagens")
        .update({ lida: true })
        .eq("campo_id", thread.campo.id)
        .eq("receiver_id", userId)
        .eq("lida", false);
      fetchCaixaDeEntrada();
    }
  };

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !threadAtiva || !userId) return;

    const msgTexto = novaMensagem.trim();
    setNovaMensagem("");

    const novaMsgVisual = {
      id: Date.now(),
      sender_id: userId,
      texto: msgTexto,
      created_at: new Date().toISOString(),
    };

    setThreadAtiva((prev: any) => ({
      ...prev,
      mensagens: [...prev.mensagens, novaMsgVisual],
    }));

    await supabase.from("mensagens").insert([
      {
        campo_id:
          threadAtiva.campo.id === "geral" ? null : threadAtiva.campo.id,
        sender_id: userId,
        receiver_id: threadAtiva.partner_id,
        texto: msgTexto,
        lida: false,
      },
    ]);

    // Notifica também o parceiro por e-mail!
    if (threadAtiva.partner_id) {
      const { data: orgPerfil } = await supabase
        .from("perfis")
        .select("email")
        .eq("id", threadAtiva.partner_id)
        .maybeSingle();

      if (orgPerfil?.email) {
        fetch("/api/send-contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nomePai,
            emailCliente: emailPai || "info@hellocamp.pt",
            emailCampo: orgPerfil.email,
            nomeCampo: threadAtiva.campo.nome || "HelloCamp",
            mensagem: msgTexto,
          }),
        }).catch(() => {});
      }
    }

    fetchCaixaDeEntrada();
  };

  if (loading) {
    return (
      <div className="p-16 text-center font-bold text-slate-400 text-xs uppercase tracking-widest animate-pulse">
        {isEn ? "Loading Messages..." : "A carregar as suas conversas..."}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex h-[calc(100vh-200px)] min-h-[550px]">
      {/* BARRA LATERAL ESQUERDA: LISTA DE CHATS */}
      <div
        className={`w-full md:w-[340px] border-r border-slate-200 flex-col bg-slate-50/50 ${
          threadAtiva ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-6 border-b border-slate-200 bg-white">
          <h2 className="text-2xl font-black text-slate-900 m-0 tracking-tight">
            {isEn ? "Messages" : "Mensagens"}
          </h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold text-sm h-full flex flex-col items-center justify-center">
              <span className="text-5xl mb-4">📭</span>
              {isEn
                ? "No conversations started yet."
                : "Ainda não iniciou nenhuma conversa com organizadores."}
            </div>
          ) : (
            threads.map((t) => {
              const nomeCampo =
                isEn && t.campo.nome_en ? t.campo.nome_en : t.campo.nome;
              const isActive = threadAtiva?.campo.id === t.campo.id;
              return (
                <div
                  key={t.campo.id}
                  onClick={() => abrirConversa(t)}
                  className={`p-5 border-b border-slate-100 cursor-pointer transition-colors relative flex gap-4 ${
                    isActive
                      ? "bg-[#0E3A68] text-white"
                      : "hover:bg-slate-100/70"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-sm ${
                      isActive ? "bg-white/20" : "bg-slate-100"
                    }`}
                  >
                    ⛺
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4
                      className={`m-0 text-sm font-bold truncate mb-1 pr-4 ${
                        isActive ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {nomeCampo}
                    </h4>
                    <p
                      className={`m-0 text-xs truncate ${
                        isActive
                          ? "text-white/70"
                          : "text-slate-500 font-medium"
                      }`}
                    >
                      {t.lastMsg?.texto}
                    </p>
                  </div>
                  {t.unread > 0 && !isActive && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#e2a41d] rounded-full shadow-sm ring-2 ring-white"></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* JANELA CENTRAL: CHAT */}
      <div
        className={`flex-1 flex-col bg-slate-50/50 ${
          !threadAtiva ? "hidden md:flex" : "flex"
        }`}
      >
        {!threadAtiva ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-bold text-sm">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-3xl mb-4">
              💬
            </div>
            {isEn
              ? "Select a conversation"
              : "Selecione uma conversa ao lado para responder."}
          </div>
        ) : (
          <>
            <div className="p-4 md:p-6 border-b border-slate-200 bg-white flex items-center gap-4 shadow-sm z-10">
              <button
                type="button"
                onClick={() => setThreadAtiva(null)}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-black cursor-pointer"
              >
                &larr;
              </button>
              <h3 className="m-0 text-base md:text-lg font-black text-slate-900 truncate">
                {isEn && threadAtiva.campo.nome_en
                  ? threadAtiva.campo.nome_en
                  : threadAtiva.campo.nome}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
              {threadAtiva.mensagens.map((msg: any, i: number) => {
                const isMine = msg.sender_id === userId;
                return (
                  <div
                    key={msg.id || i}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[70%] p-4 md:p-5 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm whitespace-pre-wrap ${
                        isMine
                          ? "bg-[#0E3A68] text-white rounded-br-sm"
                          : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {msg.texto}
                      <div
                        className={`text-[10px] mt-2 text-right font-black uppercase tracking-wider ${
                          isMine ? "text-white/60" : "text-slate-400"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={mensagensEndRef} />
            </div>

            <form
              onSubmit={enviarMensagem}
              className="p-4 md:p-6 bg-white border-t border-slate-200 flex gap-3"
            >
              <input
                type="text"
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                placeholder={
                  isEn
                    ? "Type a message to the organizer..."
                    : "Escreva a sua mensagem para o organizador..."
                }
                className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold text-slate-800 focus:border-[#0E3A68] focus:bg-white"
              />
              <button
                type="submit"
                disabled={!novaMensagem.trim()}
                className="px-6 py-3.5 rounded-2xl bg-[#0E3A68] disabled:bg-slate-200 text-white font-black uppercase tracking-widest text-xs cursor-pointer transition-colors"
              >
                {isEn ? "Send" : "Enviar"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
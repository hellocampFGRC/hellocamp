"use client";

import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";
import Link from "next/link";

export default function ChatCliente({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [userId, setUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [threadAtiva, setThreadAtiva] = useState<any | null>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loading, setLoading] = useState(true);
  const mensagensEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCaixaDeEntrada();
    const channel = supabase.channel('chat_cliente_geral')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, () => fetchCaixaDeEntrada())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchCaixaDeEntrada = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;
    setUserId(uid);

    // 1. Vai buscar todas as reservas do cliente
    const { data: reservasData } = await supabase
      .from('reservas')
      .select('*, criancas(*)')
      .eq('cliente_id', uid);

    // 2. Vai buscar todas as mensagens enviadas/recebidas por este cliente
    const { data: msgs } = await supabase
      .from('mensagens')
      .select('*, campos(id, nome, nome_en, organizador_id, local, imagem, preco)')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: true });

    if (!msgs) { setLoading(false); return; }

    const threadsMap: any = {};
    
    msgs.forEach(m => {
      const campId = m.campo_id;
      if (!campId) return;

      if (!threadsMap[campId]) {
        // Agrupa as reservas do campo, mas não falha se não existirem
        const reservasDoCampo = reservasData?.filter(r => r.campo_id === campId) || [];

        threadsMap[campId] = {
          campo: m.campos,
          partner_id: m.campos.organizador_id,
          mensagens: [],
          reservas: reservasDoCampo,
          unread: 0,
          lastMsg: null
        };
      }
      
      threadsMap[campId].mensagens.push(m);
      threadsMap[campId].lastMsg = m;
      if (!m.lida && m.receiver_id === uid) threadsMap[campId].unread++;
    });

    const threadsArray = Object.values(threadsMap).sort((a: any, b: any) => 
      new Date(b.lastMsg.created_at).getTime() - new Date(a.lastMsg.created_at).getTime()
    );

    setThreads(threadsArray);
    setThreadAtiva((prev: any) => prev ? threadsMap[prev.campo.id] : null);
    setLoading(false);
  };

  useEffect(() => { mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [threadAtiva]);

  const abrirConversa = async (thread: any) => {
    setThreadAtiva(thread);
    if (thread.unread > 0) {
      await supabase.from("mensagens").update({ lida: true })
        .eq("campo_id", thread.campo.id)
        .eq("receiver_id", userId)
        .eq("lida", false);
      fetchCaixaDeEntrada();
    }
  };

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !threadAtiva || !userId) return;
    
    const msgTexto = novaMensagem;
    setNovaMensagem(""); 
    
    const novaMsgVisual = { id: Date.now(), sender_id: userId, texto: msgTexto, created_at: new Date().toISOString() };
    setThreadAtiva((prev: any) => ({ ...prev, mensagens: [...prev.mensagens, novaMsgVisual] }));

    await supabase.from("mensagens").insert([{ 
      campo_id: threadAtiva.campo.id, 
      sender_id: userId, 
      receiver_id: threadAtiva.partner_id, 
      texto: msgTexto,
      lida: false
    }]);
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">A carregar mensagens...</div>;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm font-sans max-w-[1400px] mx-auto mt-2">
      
      {/* BARRA LATERAL ESQUERDA: LISTA DE CHATS */}
      <div className={`w-full md:w-[340px] border-r border-slate-200 flex-col bg-slate-50/50 ${threadAtiva ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-200 bg-white">
          <h2 className="text-2xl font-black text-slate-900 m-0 tracking-tight">{isEn ? 'Inbox' : 'Mensagens'}</h2>
        </div>
        <div className="overflow-y-auto flex-1">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold text-sm h-full flex flex-col items-center justify-center opacity-70">
              <span className="text-5xl mb-4">📭</span>
              Nenhuma conversa iniciada.
            </div>
          ) : (
            threads.map(t => {
              const nomeCampo = isEn && t.campo.nome_en ? t.campo.nome_en : t.campo.nome;
              const isActive = threadAtiva?.campo.id === t.campo.id;
              return (
                <div key={t.campo.id} onClick={() => abrirConversa(t)} className={`p-5 border-b border-slate-100 cursor-pointer transition-colors relative flex gap-4 ${isActive ? 'bg-[#0E3A68] text-white' : 'hover:bg-slate-50'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-sm ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>⛺</div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className={`m-0 text-sm font-bold truncate mb-1 pr-4 ${isActive ? 'text-white' : 'text-slate-900'}`}>{nomeCampo}</h4>
                    <p className={`m-0 text-xs truncate ${isActive ? 'text-white/70' : 'text-slate-500 font-medium'}`}>{t.lastMsg.texto}</p>
                  </div>
                  {t.unread > 0 && !isActive && <div className="absolute right-5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#e2a41d] rounded-full shadow-sm ring-2 ring-white"></div>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* JANELA CENTRAL: CHAT */}
      <div className={`flex-1 flex-col bg-slate-50/50 ${!threadAtiva ? 'hidden md:flex' : 'flex'}`}>
        {!threadAtiva ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-bold text-sm opacity-60">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">💬</div>
            {isEn ? 'Select a conversation' : 'Selecione uma conversa ao lado para responder.'}
          </div>
        ) : (
          <>
            <div className="p-4 md:p-6 border-b border-slate-200 bg-white flex items-center gap-4 shadow-sm z-10">
              <button onClick={() => setThreadAtiva(null)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-black">&larr;</button>
              <h3 className="m-0 text-base md:text-lg font-black text-slate-900 truncate">
                {isEn && threadAtiva.campo.nome_en ? threadAtiva.campo.nome_en : threadAtiva.campo.nome}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
              {threadAtiva.mensagens.map((msg: any, i: number) => {
                const isMine = msg.sender_id === userId;
                return (
                  <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[85%] md:max-w-[70%] p-4 md:p-5 rounded-[1.5rem] text-[15px] font-medium leading-relaxed shadow-sm whitespace-pre-wrap ${isMine ? 'bg-[#0E3A68] text-white rounded-br-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}`}>
                      {msg.texto}
                      <div className={`text-[10px] mt-2 text-right font-black uppercase tracking-wider ${isMine ? 'text-white/50' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={mensagensEndRef} />
            </div>

            <form onSubmit={enviarMensagem} className="p-4 md:p-6 bg-white border-t border-slate-200 flex gap-3">
              <div className="flex-1 bg-slate-50 rounded-2xl flex items-center px-4 border border-slate-200 focus-within:border-[#0E3A68] focus-within:bg-white transition-colors shadow-inner">
                <input type="text" value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} placeholder={isEn ? "Type a message..." : "Escreva a sua mensagem para o organizador..."} className="flex-1 py-4 bg-transparent outline-none text-[15px] font-medium text-slate-800" />
              </div>
              <button type="submit" disabled={!novaMensagem.trim()} className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all shadow-md ${novaMensagem.trim() ? 'bg-[#0E3A68] text-white hover:bg-[#0b2b4d] hover:-translate-y-0.5' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
          </>
        )}
      </div>

      {/* ABA DIREITA: LOGÍSTICA DAS RESERVAS (Desktop) */}
      {threadAtiva && (
        <div className="hidden xl:flex w-[360px] border-l border-slate-200 flex-col bg-white p-6 overflow-y-auto">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{isEn ? 'Camp Details' : 'O Programa'}</h3>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm mb-8">
            <img src={threadAtiva.campo.imagem || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=300'} className="w-full h-32 object-cover rounded-xl mb-4" />
            <h4 className="font-black text-slate-900 text-base m-0 leading-tight">{isEn && threadAtiva.campo.nome_en ? threadAtiva.campo.nome_en : threadAtiva.campo.nome}</h4>
            <p className="text-xs text-slate-500 font-bold mt-2 mb-0">📍 {threadAtiva.campo.local}</p>
          </div>

          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            {isEn ? 'My Enrollments' : 'Inscrições Efetuadas'} ({threadAtiva.reservas.length})
          </h3>
          
          <div className="space-y-4 flex-1">
            {threadAtiva.reservas.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium bg-slate-50 p-6 rounded-2xl text-center border border-dashed border-slate-200">{isEn ? 'No active bookings yet.' : 'Ainda não existem inscrições formais da sua família neste campo.'}</p>
            ) : (
              threadAtiva.reservas.map((res: any) => (
                <div key={res.id} className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                    <span className="text-sm font-black text-slate-900">👦 {res.criancas?.nome}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm ${res.status_pagamento === 'Pago' || res.status_pagamento === 'Sinal Pago' ? 'bg-[#167524]/10 text-[#167524] border-[#167524]/20' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>{res.status_pagamento}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-600 m-0 leading-tight">🗓️ {res.turno_nome}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
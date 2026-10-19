"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

export default function InboxMonitorPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [conversas, setConversas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversaAtiva, setConversaAtiva] = useState<any>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [monitorId, setMonitorId] = useState<string | null>(null);
  const [monitorPerfil, setMonitorPerfil] = useState<any>(null);
  const [sending, setSending] = useState(false);

  const carregarMensagensMonitor = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const mId = session.user.id;
    setMonitorId(mId);

    const { data: profile } = await supabase.from('monitores').select('nome_completo').eq('id', mId).single();
    setMonitorPerfil(profile);

    const { data: msgData, error } = await supabase
      .from('mensagens_recrutamento')
      .select('*, perfis:parceiro_id(id, empresa_nome, email)')
      .eq('monitor_id', mId)
      .order('criado_at', { ascending: true });

    if (msgData && !error) {
      const threadsMap: { [key: string]: any } = {};

      msgData.forEach(msg => {
        const pId = msg.parceiro_id;
        if (!threadsMap[pId]) {
          threadsMap[pId] = {
            parceiro_id: pId,
            parceiro_nome: msg.perfis?.empresa_nome || (isEn ? "Summer Camp Organizer" : "Organizador de Campo"),
            parceiro_email: msg.perfis?.email || "",
            vaga: isEn ? "Camp Staff Position" : "Proposta de Recrutamento",
            mensagens: [],
            ultima_mensagem: "",
            data: "",
            lida: true
          };
        }
        threadsMap[pId].mensagens.push(msg);
        threadsMap[pId].ultima_mensagem = msg.mensagem;
        threadsMap[pId].data = new Date(msg.criado_at).toLocaleDateString('pt-PT', { hour: '2-digit', minute: '2-digit' });
        if (msg.remetente === 'parceiro' && !msg.lida) {
          threadsMap[pId].lida = false;
        }
      });

      setConversas(Object.values(threadsMap));
      if (conversaAtiva) setConversaAtiva(threadsMap[conversaAtiva.parceiro_id] || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarMensagensMonitor();
  }, [conversaAtiva?.parceiro_id]);

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !monitorId || !conversaAtiva) return;
    setSending(true);

    const payload = {
      monitor_id: monitorId,
      parceiro_id: conversaAtiva.parceiro_id,
      remetente: 'monitor',
      mensagem: novaMensagem.trim()
    };

    const { error } = await supabase.from('mensagens_recrutamento').insert([payload]);

    if (error) { alert("Erro ao submeter mensagem: " + error.message); setSending(false); return; }

    try {
      await fetch('/api/notificacoes/nova-mensagem-recrutamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarioEmail: conversaAtiva.parceiro_email,
          nomeRemetente: monitorPerfil?.nome_completo || "Candidato a Monitor",
          textoMensagem: novaMensagem.trim(),
          tipoDestinatario: 'parceiro',
          lang: lang
        })
      });
    } catch (err) { console.error("Falha ao processar email de aviso:", err); }

    setNovaMensagem("");
    setSending(false);
    carregarMensagensMonitor();
  };

  const marcarComoLidas = async (pId: string) => {
    if (!monitorId) return;
    await supabase.from('mensagens_recrutamento').update({ lida: true }).eq('monitor_id', monitorId).eq('parceiro_id', pId).eq('remetente', 'parceiro');
  };

  const selecionarConversa = (conv: any) => {
    setConversaAtiva(conv);
    marcarComoLidas(conv.parceiro_id);
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">A carregar os teus convites de emprego...</div>;

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm font-sans mt-2 md:mt-0">
      <div className="flex flex-1 overflow-hidden h-full">
        
        {/* Coluna Esquerda: Threads */}
        <div className={`w-full md:w-1/3 lg:w-[350px] border-r border-slate-100 bg-slate-50/50 overflow-y-auto ${conversaAtiva ? 'hidden md:block' : 'block'}`}>
          {conversas.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest h-full flex items-center justify-center opacity-70">
              {isEn ? "No invitations yet" : "Sem convites de recrutamento. Atualiza a tua disponibilidade no perfil!"}
            </div>
          ) : conversas.map(conv => (
            <button key={conv.parceiro_id} onClick={() => selecionarConversa(conv)} className={`w-full text-left p-5 border-b border-slate-100 flex flex-col bg-transparent hover:bg-white transition-colors ${conversaAtiva?.parceiro_id === conv.parceiro_id ? 'bg-white border-l-4 border-l-[#2563eb]' : ''}`}>
              <div className="flex justify-between items-center w-full mb-1">
                <span className="text-sm font-black text-slate-900 truncate pr-2">{conv.parceiro_nome}</span>
                <span className="text-[9px] font-bold text-slate-400 flex-shrink-0 uppercase tracking-widest">{conv.data}</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#2563eb] block mb-1 truncate">{conv.vaga}</span>
              <p className={`text-xs m-0 truncate w-full ${conv.lida ? 'text-slate-500 font-medium' : 'text-slate-950 font-black'}`}>{conv.ultima_mensagem}</p>
            </button>
          ))}
        </div>

        {/* Coluna Direita: Caixa de Conversa Aberta */}
        <div className={`w-full md:w-2/3 lg:flex-1 flex flex-col bg-white ${!conversaAtiva ? 'hidden md:flex' : 'flex'}`}>
          {!conversaAtiva ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8">
              <span className="text-4xl mb-4 opacity-50">💬</span>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isEn ? "Select a proposal to reply" : "Selecione uma proposta de trabalho para responder"}</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-4 shadow-sm z-10">
                <button onClick={() => setConversaAtiva(null)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-black mr-2">&larr;</button>
                <div className="w-10 h-10 bg-[#2563eb]/10 text-[#2563eb] font-black uppercase rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-sm">{conversaAtiva.parceiro_nome.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm md:text-base font-black text-slate-900 truncate">{conversaAtiva.parceiro_nome}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate mt-0.5">{conversaAtiva.vaga}</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
                <div className="text-center mb-6">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-200/50 px-3 py-1.5 rounded-full shadow-sm">
                    Início da Conversa com o Organizador
                  </span>
                </div>

                {conversaAtiva.mensagens.map((msg: any) => (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${msg.remetente === 'monitor' ? 'ml-auto items-end' : 'items-start'}`}>
                    <div className={`p-4 rounded-2xl text-[15px] font-medium leading-relaxed shadow-sm ${msg.remetente === 'monitor' ? 'bg-[#2563eb] text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                      {msg.mensagem}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 px-2 ${msg.remetente === 'monitor' ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                      {new Date(msg.criado_at).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleEnviarMensagem} className="p-4 md:p-6 border-t border-slate-100 flex gap-3 bg-white">
                <div className="flex-1 bg-slate-50 rounded-2xl flex items-center px-4 border border-slate-200 focus-within:border-[#2563eb] focus-within:bg-white transition-colors shadow-inner">
                  <input type="text" value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} placeholder={isEn ? "Type a reply..." : "Escreva uma resposta à entidade..."} className="flex-1 py-4 bg-transparent outline-none text-sm md:text-[15px] font-medium text-slate-800" />
                </div>
                <button type="submit" disabled={sending || !novaMensagem.trim()} className="w-14 h-14 flex items-center justify-center bg-[#2563eb] text-white rounded-2xl font-black transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
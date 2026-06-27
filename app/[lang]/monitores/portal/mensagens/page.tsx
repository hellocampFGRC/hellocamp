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

  // --- CARREGAR CONVERSAS REAIS DO MONITOR ---
  const carregarMensagensMonitor = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const mId = session.user.id;
    setMonitorId(mId);

    // Buscar o nome do monitor para o email de notificação
    const { data: profile } = await supabase.from('monitores').select('nome_completo').eq('id', mId).single();
    setMonitorPerfil(profile);

    // Puxar as mensagens e fazer o join do perfil corporativo do parceiro
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

      if (conversaAtiva) {
        setConversaAtiva(threadsMap[conversaAtiva.parceiro_id] || null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarMensagensMonitor();
  }, [conversaAtiva?.parceiro_id]);

  // --- SUBMETER RESPOSTA REAL + ALERTA EMAIL PARA O PARCEIRO ---
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

    if (error) {
      alert("Erro ao submeter mensagem: " + error.message);
      setSending(false);
      return;
    }

    // Disparar email real de alerta para o Diretor do Campo de Férias
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
    } catch (err) {
      console.error("Falha ao processar email de aviso:", err);
    }

    setNovaMensagem("");
    setSending(false);
    carregarMensagensMonitor();
  };

  const marcarComoLidas = async (pId: string) => {
    if (!monitorId) return;
    await supabase
      .from('mensagens_recrutamento')
      .update({ lida: true })
      .eq('monitor_id', monitorId)
      .eq('parceiro_id', pId)
      .eq('remetente', 'parceiro');
  };

  const selecionarConversa = (conv: any) => {
    setConversaAtiva(conv);
    marcarComoLidas(conv.parceiro_id);
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">A carregar mensagens...</div>;

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm font-sans">
      <div className="flex flex-1 overflow-hidden h-full">
        
        {/* Coluna Esquerda: Threads */}
        <div className={`w-full md:w-1/3 border-r border-slate-100 bg-slate-50 overflow-y-auto ${conversaAtiva ? 'hidden md:block' : 'block'}`}>
          {conversas.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{isEn ? "No invitations yet" : "Sem convites de recrutamento"}</div>
          ) : conversas.map(conv => (
            <button key={conv.parceiro_id} onClick={() => selecionarConversa(conv)} className={`w-full text-left p-4 border-b border-slate-100 flex flex-col bg-slate-50 hover:bg-white transition-colors ${conversaAtiva?.parceiro_id === conv.parceiro_id ? 'bg-white border-l-4 border-l-blue-600' : ''}`}>
              <div className="flex justify-between items-center w-full"><span className="text-xs font-black text-slate-900 truncate">{conv.parceiro_nome}</span><span className="text-[9px] font-bold text-slate-400 flex-shrink-0 ml-2">{conv.data}</span></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 block mt-0.5 truncate">{conv.vaga}</span>
              <p className={`text-xs mt-1 mb-0 truncate w-full ${conv.lida ? 'text-slate-500' : 'text-slate-950 font-black'}`}>{conv.ultima_mensagem}</p>
            </button>
          ))}
        </div>

        {/* Coluna Direita: Caixa de Conversa Aberta */}
        <div className={`w-full md:w-2/3 flex flex-col bg-white ${!conversaAtiva ? 'hidden md:flex' : 'flex'}`}>
          {!conversaAtiva ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8"><span className="text-3xl mb-2">💬</span><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isEn ? "Select a proposal to reply" : "Selecione uma proposta para responder"}</p></div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3"><button onClick={() => setConversaAtiva(null)} className="md:hidden text-slate-400 font-bold pr-2">&larr;</button><div className="text-xs font-black text-slate-900">{conversaAtiva.parceiro_nome}</div></div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                {conversaAtiva.mensagens.map((msg: any) => (
                  <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.remetente === 'monitor' ? 'ml-auto items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-xl text-sm font-medium ${msg.remetente === 'monitor' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>{msg.mensagem}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleEnviarMensagem} className="p-3 border-t border-slate-100 flex gap-2"><input type="text" value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} placeholder={isEn ? "Type a reply..." : "Escreva uma resposta..."} className="flex-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white" /><button type="submit" disabled={sending} className="bg-blue-600 text-white px-5 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">{isEn ? "Reply" : "Responder"}</button></form>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
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

  useEffect(() => {
    // Simulação de busca de conversas. Num cenário real, faria um join com a tabela de mensagens e perfis dos campos
    const fetchConversas = async () => {
      // Mock de conversas para o UI
      setTimeout(() => {
        setConversas([
          { id: 1, parceiro_nome: "Aventura Natura Lda.", campo_nome: "Surf Camp Porto", ultima_mensagem: "Olá! Vimos o teu perfil e tens a experiência que procuramos...", data: "10:45", lida: false },
          { id: 2, parceiro_nome: "TechKids Portugal", campo_nome: "Robotics Summer", ultima_mensagem: "Obrigado pela resposta. Podes enviar o teu CV?", data: "Ontem", lida: true }
        ]);
        setLoading(false);
      }, 800);
    };
    fetchConversas();
  }, []);

  const handleEnviarMensagem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;
    alert("Mensagem enviada com sucesso!");
    setNovaMensagem("");
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">A carregar mensagens...</div>;

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      
      {/* HEADER DA INBOX */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-black text-slate-900 m-0">
            {isEn ? "Messages & Invitations" : "Caixa de Entrada"}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {isEn ? "Talk directly with camps" : "Comunica diretamente com os campos"}
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* COLUNA ESQUERDA: LISTA DE CONVERSAS */}
        <div className={`w-full md:w-1/3 border-r border-slate-100 bg-white overflow-y-auto flex flex-col ${conversaAtiva ? 'hidden md:flex' : 'flex'}`}>
          {conversas.map(conv => (
            <button 
              key={conv.id} 
              onClick={() => setConversaAtiva(conv)}
              className={`w-full text-left p-4 border-b border-slate-50 transition-colors hover:bg-slate-50 ${conversaAtiva?.id === conv.id ? 'bg-blue-50/50' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-black truncate ${conv.lida ? 'text-slate-700' : 'text-slate-900'}`}>{conv.parceiro_nome}</span>
                <span className="text-[10px] font-bold text-slate-400 flex-shrink-0 ml-2">{conv.data}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block mb-1.5 truncate">{conv.campo_nome}</span>
              <p className={`text-xs m-0 truncate ${conv.lida ? 'text-slate-500 font-medium' : 'text-slate-900 font-bold'}`}>
                {conv.ultima_mensagem}
              </p>
            </button>
          ))}
        </div>

        {/* COLUNA DIREITA: CONVERSA ABERTA */}
        <div className={`w-full md:w-2/3 bg-slate-50 flex flex-col ${!conversaAtiva ? 'hidden md:flex' : 'flex'}`}>
          
          {!conversaAtiva ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <span className="text-4xl mb-4">💬</span>
              <p className="text-sm font-bold uppercase tracking-widest">{isEn ? "Select a conversation" : "Seleciona uma conversa"}</p>
            </div>
          ) : (
            <>
              {/* Header da Conversa Ativa */}
              <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center gap-4 flex-shrink-0 shadow-sm z-10">
                <button onClick={() => setConversaAtiva(null)} className="md:hidden text-2xl text-slate-400">&larr;</button>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg flex-shrink-0">🏕️</div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-black text-slate-900 truncate m-0">{conversaAtiva.parceiro_nome}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate m-0">{conversaAtiva.campo_nome}</p>
                </div>
              </div>

              {/* Histórico de Mensagens */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <div className="flex flex-col items-start max-w-[85%]">
                  <span className="text-[10px] font-bold text-slate-400 ml-3 mb-1">{conversaAtiva.parceiro_nome}</span>
                  <div className="bg-white border border-slate-200 text-slate-700 text-sm font-medium p-4 rounded-2xl rounded-tl-sm shadow-sm">
                    {conversaAtiva.ultima_mensagem}
                  </div>
                </div>

                <div className="flex flex-col items-end self-end max-w-[85%] ml-auto">
                  <span className="text-[10px] font-bold text-slate-400 mr-3 mb-1">{isEn ? "You" : "Tu"}</span>
                  <div className="bg-blue-600 text-white text-sm font-medium p-4 rounded-2xl rounded-tr-sm shadow-sm">
                    {isEn ? "Hi! Thanks for reaching out. Yes, I'm available." : "Olá! Muito obrigado pelo contacto. Sim, estou disponível para essas datas e adoro Surf."}
                  </div>
                </div>

              </div>

              {/* Caixa de Texto */}
              <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
                <form onSubmit={handleEnviarMensagem} className="flex gap-3">
                  <input 
                    type="text" 
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    placeholder={isEn ? "Write a message..." : "Escreve uma mensagem..."}
                    className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                  <button 
                    type="submit" 
                    className="bg-blue-600 text-white px-6 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-colors flex-shrink-0 shadow-sm"
                  >
                    {isEn ? "Send" : "Enviar"}
                  </button>
                </form>
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest mt-3">
                  {isEn ? "Never share passwords or bank details in the chat." : "Nunca partilhes palavras-passe ou dados bancários no chat."}
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
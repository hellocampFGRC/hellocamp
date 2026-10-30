"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function PartnerInboxPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [empresaNome, setEmpresaNome] = useState<string>("");
  const [conversas, setConversas] = useState<any[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<any>(null);
  const [respostaTexto, setRespostaTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [filtroAba, setFiltroAba] = useState<"todas" | "nao_lidas">("todas");

  const carregarMensagens = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/${lang}/login`);
      return;
    }

    const uid = session.user.id;
    setUserId(uid);

    const [{ data: meuPerfil }, { data: camposData }, { data: msgsData }, { data: perfisAll }] =
      await Promise.all([
        supabase
          .from("perfis")
          .select("empresa_nome, nome_empresa, nome, nome_completo")
          .eq("id", uid)
          .maybeSingle(),
        supabase.from("campos").select("id, nome").eq("organizador_id", uid),
        supabase
          .from("mensagens")
          .select("*")
          .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
          .order("created_at", { ascending: true }),
        supabase
          .from("perfis")
          .select("id, nome_completo, email, telefone"),
      ]);

    if (meuPerfil) {
      setEmpresaNome(
        meuPerfil.empresa_nome ||
          meuPerfil.nome_empresa ||
          meuPerfil.nome ||
          meuPerfil.nome_completo ||
          "Organizador"
      );
    }

    const mapCampos: Record<string, string> = {};
    (camposData || []).forEach((c: any) => {
      mapCampos[c.id] = c.nome;
    });

    const mapPerfis: Record<string, any> = {};
    (perfisAll || []).forEach((p: any) => {
      mapPerfis[p.id] = p;
    });

    // Agrupar mensagens por conversa: `${clientId}_${campoId}`
    const grupos: Record<string, any> = {};

    (msgsData || []).forEach((m: any) => {
      const outroId = m.sender_id === uid ? m.receiver_id : m.sender_id;
      if (!outroId) return;

      const cId = m.campo_id || "geral";
      const chave = `${outroId}_${cId}`;
      const outroPerfil = mapPerfis[outroId] || {};

      if (!grupos[chave]) {
        grupos[chave] = {
          chave,
          cliente_id: outroId,
          cliente_nome:
            outroPerfil.nome_completo ||
            outroPerfil.email ||
            (isEn ? "Parent / Client" : "Encarregado de Educação"),
          cliente_email: outroPerfil.email || "",
          cliente_telefone: outroPerfil.telefone || "",
          campo_id: m.campo_id,
          campo_nome: mapCampos[m.campo_id] || "Questão Geral",
          mensagens: [],
          nao_lidas: 0,
          ultima_data: m.created_at,
        };
      }

      grupos[chave].mensagens.push(m);
      grupos[chave].ultima_data = m.created_at;

      if (m.receiver_id === uid && m.lida === false) {
        grupos[chave].nao_lidas += 1;
      }
    });

    const listaOrdenada = Object.values(grupos).sort(
      (a: any, b: any) =>
        new Date(b.ultima_data).getTime() - new Date(a.ultima_data).getTime()
    );

    setConversas(listaOrdenada);
    if (listaOrdenada.length > 0 && !conversaAtiva) {
      selecionarConversa(listaOrdenada[0], uid);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarMensagens();
  }, [lang]);

  const selecionarConversa = async (conv: any, uidRef?: string) => {
    setConversaAtiva(conv);
    const targetUid = uidRef || userId;
    if (!targetUid || conv.nao_lidas === 0) return;

    // Marca como lidas na BD
    let query = supabase
      .from("mensagens")
      .update({ lida: true })
      .eq("receiver_id", targetUid)
      .eq("sender_id", conv.cliente_id)
      .eq("lida", false);

    if (conv.campo_id) {
      query = query.eq("campo_id", conv.campo_id);
    }

    await query;

    setConversas((prev) =>
      prev.map((c) =>
        c.chave === conv.chave ? { ...c, nao_lidas: 0 } : c
      )
    );
  };

  const handleEnviarResposta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respostaTexto.trim() || !conversaAtiva || !userId) return;

    setSending(true);
    try {
      const txt = respostaTexto.trim();
      const { data: novaMsg, error } = await supabase
        .from("mensagens")
        .insert([
          {
            campo_id: conversaAtiva.campo_id || null,
            sender_id: userId,
            receiver_id: conversaAtiva.cliente_id,
            texto: txt,
            lida: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const conversaAtualizada = {
        ...conversaAtiva,
        mensagens: [...conversaAtiva.mensagens, novaMsg],
        ultima_data: novaMsg.created_at,
      };

      setConversaAtiva(conversaAtualizada);
      setConversas((prev) =>
        prev.map((c) =>
          c.chave === conversaAtiva.chave ? conversaAtualizada : c
        )
      );
      setRespostaTexto("");
    } catch (err: any) {
      alert("Erro ao enviar mensagem: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const conversasVisiveis = conversas.filter((c: any) =>
    filtroAba === "nao_lidas" ? c.nao_lidas > 0 : true
  );

  if (loading) {
    return (
      <div className="p-12 text-center font-black text-xs uppercase tracking-widest text-slate-400 animate-pulse">
        {isEn ? "Loading Inbox..." : "A carregar Caixa de Mensagens..."}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto font-sans text-[#0F172A] pb-20">
      {/* CABEÇALHO */}
      <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <span className="inline-block bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-2">
            💬 {isEn ? "Direct Communication" : "Comunicação Direta com Pais"}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#0F172A] m-0 tracking-tight">
            {isEn ? "Partner Inbox & Inquiries" : "Caixa de Mensagens e Dúvidas"}
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFiltroAba("todas")}
            className={`px-4 py-2.5 rounded-md text-xs font-black uppercase tracking-widest cursor-pointer border-0 ${
              filtroAba === "todas"
                ? "bg-[#0F172A] text-white"
                : "bg-slate-200 text-[#0F172A]"
            }`}
          >
            {isEn ? "All" : "Todas"} ({conversas.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroAba("nao_lidas")}
            className={`px-4 py-2.5 rounded-md text-xs font-black uppercase tracking-widest cursor-pointer border-0 ${
              filtroAba === "nao_lidas"
                ? "bg-[#F43F5E] text-white"
                : "bg-slate-200 text-[#0F172A]"
            }`}
          >
            {isEn ? "Unread" : "Não Lidas"} (
            {conversas.filter((c) => c.nao_lidas > 0).length})
          </button>
        </div>
      </div>

      {/* LAYOUT DE CHAT (LISTA DE CONVERSAS + JANELA DE MENSAGENS) */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[560px] overflow-hidden">
        {/* COLUNA ESQUERDA: LISTA DE CONVERSAS */}
        <div className="lg:col-span-4 border-r border-slate-200 bg-[#F8FAFC] overflow-y-auto max-h-[620px]">
          {conversasVisiveis.length === 0 ? (
            <div className="p-10 text-center text-xs font-bold text-slate-400">
              {isEn ? "No messages found." : "Nenhuma conversa encontrada."}
            </div>
          ) : (
            conversasVisiveis.map((conv: any) => {
              const isSelected = conversaAtiva?.chave === conv.chave;
              const ultimaMsg =
                conv.mensagens[conv.mensagens.length - 1]?.texto || "";

              return (
                <div
                  key={conv.chave}
                  onClick={() => selecionarConversa(conv)}
                  className={`p-4 border-b border-slate-200 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#2563EB] text-white"
                      : "bg-white hover:bg-slate-50 text-[#0F172A]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <strong className="text-xs font-black truncate">
                      {conv.cliente_nome}
                    </strong>
                    {conv.nao_lidas > 0 && (
                      <span className="bg-[#F43F5E] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                        {conv.nao_lidas} nova(s)
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[10px] font-black uppercase tracking-wider mb-1.5 ${
                      isSelected ? "text-amber-300" : "text-[#2563EB]"
                    }`}
                  >
                    🏕️ {conv.campo_nome}
                  </div>
                  <p
                    className={`text-xs m-0 truncate ${
                      isSelected ? "text-blue-100" : "text-slate-500"
                    }`}
                  >
                    {ultimaMsg}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* COLUNA DIREITA: HISTÓRICO DE MENSAGENS E RESPOSTA */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white">
          {!conversaAtiva ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-base font-black text-[#0F172A] mb-1">
                {isEn
                  ? "Select a conversation"
                  : "Selecione uma conversa à esquerda"}
              </h3>
              <p className="text-xs font-bold text-slate-500 m-0">
                {isEn
                  ? "All questions and change requests from parents appear here."
                  : "Todas as dúvidas sobre os campos e pedidos dos pais aparecem aqui."}
              </p>
            </div>
          ) : (
            <>
              {/* TOPO DA CONVERSA ATIVA */}
              <div className="p-5 bg-[#0F172A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800">
                <div>
                  <span className="bg-[#F59E0B] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md inline-block mb-1">
                    🏕️ {conversaAtiva.campo_nome}
                  </span>
                  <h3 className="text-base font-black m-0">
                    {conversaAtiva.cliente_nome}
                  </h3>
                </div>
                <div className="text-xs font-bold text-slate-300">
                  {conversaAtiva.cliente_email && (
                    <span className="mr-3">✉️ {conversaAtiva.cliente_email}</span>
                  )}
                  {conversaAtiva.cliente_telefone && (
                    <span>📞 {conversaAtiva.cliente_telefone}</span>
                  )}
                </div>
              </div>

              {/* LISTA DE MENSAGENS */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[420px] bg-[#F8FAFC]">
                {conversaAtiva.mensagens.map((m: any) => {
                  const souEu = m.sender_id === userId;
                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-md max-w-[82%] shadow-sm ${
                        souEu
                          ? "ml-auto bg-[#2563EB] text-white"
                          : "mr-auto bg-white border border-slate-200 text-[#0F172A]"
                      }`}
                    >
                      <div className="text-[10px] font-black uppercase tracking-wider mb-1 opacity-80">
                        {souEu ? empresaNome : conversaAtiva.cliente_nome}
                      </div>
                      <p className="text-xs md:text-sm font-medium whitespace-pre-wrap leading-relaxed m-0">
                        {m.texto}
                      </p>
                      <span
                        className={`block text-[9px] mt-2 ${
                          souEu ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {new Date(m.created_at).toLocaleString("pt-PT")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CAIXA DE ENVIO DE RESPOSTA */}
              <form
                onSubmit={handleEnviarResposta}
                className="p-4 bg-white border-t border-slate-200 flex gap-3"
              >
                <input
                  type="text"
                  required
                  value={respostaTexto}
                  onChange={(e) => setRespostaTexto(e.target.value)}
                  placeholder={
                    isEn
                      ? "Write your reply to the parent..."
                      : "Escreva a sua resposta para o encarregado de educação..."
                  }
                  className="flex-1 py-3.5 px-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-md cursor-pointer border-0 shrink-0 shadow-sm"
                >
                  {sending
                    ? "..."
                    : isEn
                    ? "Send Reply →"
                    : "Enviar Resposta →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
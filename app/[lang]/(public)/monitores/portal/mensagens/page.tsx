"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MonitorMensagensRecrutamentoPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [monitorId, setMonitorId] = useState<string>("");
  const [monitorPerfil, setMonitorPerfil] = useState<any>(null);
  const [conversas, setConversas] = useState<any[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<any>(null);
  const [textoResposta, setTextoResposta] = useState("");
  const [sending, setSending] = useState(false);

  const carregarMensagensMonitor = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/${lang}/login`);
      return;
    }

    const mId = session.user.id;
    setMonitorId(mId);

    const [{ data: profile }, { data: msgData }] = await Promise.all([
      supabase
        .from("monitores")
        .select("nome_completo, fotografia_url")
        .eq("id", mId)
        .maybeSingle(),
      supabase
        .from("mensagens_recrutamento")
        .select("*, perfis:parceiro_id(id, empresa_nome, nome_empresa, nome, email, logotipo_url)")
        .eq("monitor_id", mId)
        .order("criado_at", { ascending: true }),
    ]);

    setMonitorPerfil(profile);

    if (msgData) {
      const threadsMap: Record<string, any> = {};

      msgData.forEach((msg: any) => {
        const pId = msg.parceiro_id;
        const nomeOrg =
          msg.perfis?.empresa_nome ||
          msg.perfis?.nome_empresa ||
          msg.perfis?.nome ||
          (isEn ? "Camp Organizer" : "Organizador de Campo");

        if (!threadsMap[pId]) {
          threadsMap[pId] = {
            parceiro_id: pId,
            parceiro_nome: nomeOrg,
            parceiro_email: msg.perfis?.email || "",
            parceiro_logo: msg.perfis?.logotipo_url || "",
            vaga: isEn ? "Camp Staff Opportunity" : "Proposta de Recrutamento",
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
      if (conversaAtiva) {
        setConversaAtiva(threadsMap[conversaAtiva.parceiro_id] || null);
      } else if (lista.length > 0) {
        selecionarConversa(lista[0], mId);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    carregarMensagensMonitor();
  }, [lang]);

  const marcarComoLidas = async (pId: string, uidRef?: string) => {
    const targetId = uidRef || monitorId;
    if (!targetId) return;
    await supabase
      .from("mensagens_recrutamento")
      .update({ lida: true })
      .eq("monitor_id", targetId)
      .eq("parceiro_id", pId)
      .eq("remetente", "parceiro");
  };

  const selecionarConversa = (conv: any, uidRef?: string) => {
    setConversaAtiva({ ...conv, lida: true });
    setConversas((prev) =>
      prev.map((c) =>
        c.parceiro_id === conv.parceiro_id ? { ...c, lida: true } : c
      )
    );
    marcarComoLidas(conv.parceiro_id, uidRef);
  };

  const handleEnviarResposta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoResposta.trim() || !conversaAtiva || !monitorId) return;

    setSending(true);
    try {
      const msgTxt = textoResposta.trim();
      const { data: nova, error } = await supabase
        .from("mensagens_recrutamento")
        .insert([
          {
            parceiro_id: conversaAtiva.parceiro_id,
            monitor_id: monitorId,
            remetente: "monitor",
            mensagem: msgTxt,
            lida: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const atualizada = {
        ...conversaAtiva,
        mensagens: [...conversaAtiva.mensagens, nova],
        ultima_mensagem: msgTxt,
      };
      setConversaAtiva(atualizada);
      setConversas((prev) =>
        prev.map((c) =>
          c.parceiro_id === conversaAtiva.parceiro_id ? atualizada : c
        )
      );
      setTextoResposta("");

      // Dispara e-mail de notificação ao Parceiro
      if (conversaAtiva.parceiro_email) {
        await fetch("/api/notificacoes/nova-mensagem-recrutamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destinatarioEmail: conversaAtiva.parceiro_email,
            destinatarioNome: conversaAtiva.parceiro_nome,
            remetenteNome: monitorPerfil?.nome_completo || "Monitor HelloCamp",
            mensagemTexto: msgTxt,
            tipoDestinatario: "parceiro",
            lang,
          }),
        }).catch(() => {});
      }
    } catch (err: any) {
      alert("Erro ao enviar resposta: " + err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest text-xs animate-pulse">
        {isEn
          ? "Loading your job invitations..."
          : "A carregar os teus convites de emprego..."}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] py-10 px-4 font-sans text-[#0F172A] pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* TOPO */}
        <div className="bg-[#0F172A] text-white p-6 md:p-8 rounded-md border-b-4 border-[#F59E0B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="bg-[#F59E0B] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md inline-block mb-1.5">
              💬 {isEn ? "Recruitment Inbox" : "Caixa de Convites de Trabalho"}
            </span>
            <h1 className="text-2xl font-black m-0">
              {isEn
                ? "Job Offers & Organizer Messages"
                : "Propostas e Mensagens de Organizadores"}
            </h1>
          </div>

          <Link
            href={`/${lang}/monitores/portal/perfil`}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-md no-underline shrink-0"
          >
            &larr; {isEn ? "Back to My Profile" : "Voltar ao Meu Perfil"}
          </Link>
        </div>

        {/* JANELA DE CHAT */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[540px] overflow-hidden">
          <div className="lg:col-span-4 border-r border-slate-200 bg-[#F8FAFC] overflow-y-auto max-h-[600px]">
            {conversas.length === 0 ? (
              <div className="p-10 text-center text-xs font-bold text-slate-400">
                {isEn
                  ? "No job invitations received yet. Keep your availability calendar updated!"
                  : "Ainda não recebeste propostas. Mantém o teu calendário e certificações atualizados no teu perfil!"}
              </div>
            ) : (
              conversas.map((conv: any) => {
                const isSel =
                  conversaAtiva?.parceiro_id === conv.parceiro_id;
                return (
                  <div
                    key={conv.parceiro_id}
                    onClick={() => selecionarConversa(conv)}
                    className={`p-4 border-b border-slate-200 cursor-pointer transition-colors ${
                      isSel
                        ? "bg-[#2563EB] text-white"
                        : "bg-white hover:bg-slate-50 text-[#0F172A]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <strong className="text-xs font-black truncate">
                        🏢 {conv.parceiro_nome}
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
                <span className="text-4xl mb-3">🏕️</span>
                <h3 className="text-base font-black text-[#0F172A] m-0 mb-1">
                  Seleciona uma proposta à esquerda
                </h3>
                <p className="text-xs text-slate-500 font-bold m-0">
                  Responde diretamente aos diretores dos campos de férias.
                </p>
              </div>
            ) : (
              <>
                <div className="p-5 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
                  <div>
                    <span className="bg-[#16A34A] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md inline-block mb-1">
                      Organizador Verificado HelloCamp
                    </span>
                    <h3 className="text-base font-black m-0">
                      🏢 {conversaAtiva.parceiro_nome}
                    </h3>
                  </div>
                  <Link
                    href={`/${lang}/parceiro/${conversaAtiva.parceiro_id}`}
                    target="_blank"
                    className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-md no-underline"
                  >
                    Ver Campos do Organizador ↗
                  </Link>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[420px] bg-[#F8FAFC]">
                  {conversaAtiva.mensagens.map((m: any, i: number) => {
                    const souEu = m.remetente === "monitor";
                    return (
                      <div
                        key={m.id || i}
                        className={`p-4 rounded-md max-w-[82%] shadow-sm ${
                          souEu
                            ? "ml-auto bg-[#16A34A] text-white"
                            : "mr-auto bg-white border border-slate-200 text-[#0F172A]"
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider mb-1 opacity-80">
                          {souEu
                            ? monitorPerfil?.nome_completo || "Eu"
                            : conversaAtiva.parceiro_nome}
                        </div>
                        <p className="text-xs md:text-sm font-medium whitespace-pre-wrap leading-relaxed m-0">
                          {m.mensagem}
                        </p>
                        <span
                          className={`block text-[9px] mt-2 ${
                            souEu ? "text-emerald-100" : "text-slate-400"
                          }`}
                        >
                          {new Date(m.criado_at).toLocaleString("pt-PT")}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={handleEnviarResposta}
                  className="p-4 bg-white border-t border-slate-200 flex gap-3"
                >
                  <input
                    type="text"
                    required
                    value={textoResposta}
                    onChange={(e) => setTextoResposta(e.target.value)}
                    placeholder="Escreve a tua resposta ao organizador..."
                    className="flex-1 py-3.5 px-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-md cursor-pointer border-0 shrink-0"
                  >
                    {sending ? "..." : "Responder →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
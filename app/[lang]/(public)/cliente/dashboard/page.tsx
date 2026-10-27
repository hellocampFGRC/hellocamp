"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DashboardCliente({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [loading, setLoading] = useState(true);
  const [loadingStripe, setLoadingStripe] = useState<string | null>(null);

  const [perfilPai, setPerfilPai] = useState<any>(null);
  const [dadosEmFalta, setDadosEmFalta] = useState<string[]>([]);
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [perfilForm, setPerfilForm] = useState({
    nome_completo: "",
    nif: "",
    telefone: "",
    contacto_emergencia: "",
    pessoas_autorizadas_recolha: "",
  });

  const [reservas, setReservas] = useState<any[]>([]);
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [sugestoesAzuis, setSugestoesAzuis] = useState<any[]>([]);

  const [reservaModal, setReservaModal] = useState<any>(null);
  const [cancelState, setCancelState] = useState({
    loading: false,
    confirm: false,
  });
  const [changeRequest, setChangeRequest] = useState({
    active: false,
    text: "",
    loading: false,
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareTitle, setShareTitle] = useState("");
  const [copied, setCopied] = useState(false);

  const verificarFaltas = (dados: any) => {
    const faltas = [];
    if (!dados?.nome_completo || dados.nome_completo.trim() === "")
      faltas.push(isEn ? "Full Name" : "Nome do Encarregado de Educação");
    if (!dados?.nif || dados.nif.trim() === "")
      faltas.push(isEn ? "Tax ID (NIF)" : "NIF (Para Faturação)");
    if (!dados?.telefone || dados.telefone.trim() === "")
      faltas.push(isEn ? "Phone Number" : "Número de Telemóvel");
    if (!dados?.contacto_emergencia || dados.contacto_emergencia.trim() === "")
      faltas.push(
        isEn ? "Emergency Contact" : "Contacto de Emergência Alternativo"
      );
    return faltas;
  };

  const fetchData = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    const [
      { data: perfilData },
      { data: reservasData },
      { data: camposData },
      { data: criancasData },
      { data: wishData },
    ] = await Promise.all([
      supabase.from("perfis").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("reservas")
        .select("*")
        .eq("cliente_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("campos")
        .select(
          "id, nome, nome_en, imagem, local, local_en, Distrito, organizador_id, preco, politica_cancelamento, programas_pdf"
        )
        .eq("status_aprovacao", "Aprovado")
        .eq("ativo", true),
      supabase.from("criancas").select("*").eq("cliente_id", userId),
      supabase
        .from("wishlists")
        .select("id, nome, token_partilha")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (perfilData) {
      setPerfilPai(perfilData);
      setPerfilForm({
        nome_completo: perfilData.nome_completo || "",
        nif: perfilData.nif || "",
        telefone: perfilData.telefone || "",
        contacto_emergencia: perfilData.contacto_emergencia || "",
        pessoas_autorizadas_recolha:
          perfilData.pessoas_autorizadas_recolha || "",
      });
      setDadosEmFalta(verificarFaltas(perfilData));
    }

    const camposCompradosIds: string[] = [];
    if (reservasData && reservasData.length > 0) {
      const idsDeCamposReservados = Array.from(
        new Set(reservasData.map((r) => r.campo_id).filter(Boolean))
      );

      const { data: todosCamposHistorico } = await supabase
        .from("campos")
        .select(
          "id, nome, nome_en, imagem, local, local_en, Distrito, organizador_id, preco, politica_cancelamento, programas_pdf, regras_termos, regras_termos_en"
        )
        .in("id", idsDeCamposReservados);

      const reservasCruzadas = reservasData
        .filter((res) => {
          // Esconde tentativas de checkout não concluídas há mais de 30 min
          const mins =
            (Date.now() - new Date(res.created_at).getTime()) / 60000;
          if (res.status_pagamento === "Pendente" && mins > 30) return false;
          return true;
        })
        .map((res) => {
          const campo =
            todosCamposHistorico?.find((c) => c.id === res.campo_id) || {};
          const crianca =
            criancasData?.find((cr) => cr.id === res.crianca_id) || {};
          camposCompradosIds.push(res.campo_id);
          return { ...res, campos: campo, criancas: crianca };
        });

      setReservas(reservasCruzadas);
    } else {
      setReservas([]);
    }

    if (camposData) {
      const recomendacoes = camposData
        .filter((c) => !camposCompradosIds.includes(c.id))
        .slice(0, 3);
      setSugestoesAzuis(recomendacoes);
    }

    setWishlists(wishData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [isEn]);

  const handleSavePerfilRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfilPai?.id) return;
    setSavingPerfil(true);
    try {
      const { error } = await supabase
        .from("perfis")
        .update(perfilForm)
        .eq("id", perfilPai.id);
      if (error) throw error;
      setIsPerfilModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPerfil(false);
    }
  };

  const handlePagarRestante = async (
    reserva: any,
    valorFaltaCobrar: number
  ) => {
    setLoadingStripe(reserva.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: orgData } = await supabase
        .from("perfis")
        .select("stripe_account_id")
        .eq("id", reserva.campos?.organizador_id)
        .maybeSingle();

      const res = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservasIds: [reserva.id],
          totalAmount: valorFaltaCobrar,
          userEmail: user?.email,
          lang: lang,
          campoNome:
            isEn && reserva.campos?.nome_en
              ? reserva.campos.nome_en
              : reserva.campos?.nome || "Programa HelloCamp",
          stripeAccountId: orgData?.stripe_account_id,
          tipoPagamento: "pagamento_final",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no processamento.");
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      alert("Erro ao iniciar pagamento: " + err.message);
      setLoadingStripe(null);
    }
  };

  const handleEnviarPedidoAlteracao = async (reserva: any) => {
    if (!changeRequest.text.trim()) {
      alert(
        isEn
          ? "Please describe your request."
          : "Por favor, descreva a alteração ou extra que pretende."
      );
      return;
    }

    setChangeRequest((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/inbox/send-change-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservaId: reserva.id,
          organizadorId:
            reserva.campos?.organizador_id || reserva.organizador_id,
          campoNome:
            isEn && reserva.campos?.nome_en
              ? reserva.campos.nome_en
              : reserva.campos?.nome || "Programa HelloCamp",
          mensagem: changeRequest.text.trim(),
          lang: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no envio do pedido.");

      alert(
        isEn
          ? "Change request sent! The organizer will review it shortly."
          : "Pedido enviado com sucesso! O organizador irá rever a sua solicitação e notificá-lo."
      );
      setChangeRequest({ active: false, text: "", loading: false });
      fecharReservaModal();
      fetchData();
    } catch (err: any) {
      alert(
        (isEn ? "Error sending request: " : "Erro ao enviar pedido: ") +
          err.message
      );
      setChangeRequest((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCancelarReserva = async (reserva: any) => {
    setCancelState({ ...cancelState, loading: true });
    try {
      const res = await fetch("/api/cancelar-reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservaId: reserva.id }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Erro ao cancelar a inscrição.");

      alert(
        isEn
          ? "Booking successfully cancelled. Any applicable refund has been issued."
          : "Inscrição cancelada com sucesso. O reembolso aplicável foi processado para o seu meio de pagamento."
      );
      fecharReservaModal();
      fetchData();
    } catch (err: any) {
      alert(err.message);
      setCancelState({ loading: false, confirm: false });
    }
  };

  const abrirModalPartilha = (token: string, nomeLista: string) => {
    const url = `${window.location.origin}/${lang}/lista/${token}`;
    setShareUrl(url);
    setShareTitle(nomeLista);
    setCopied(false);
    setIsShareModalOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const fecharReservaModal = () => {
    setReservaModal(null);
    setCancelState({ loading: false, confirm: false });
    setChangeRequest({ active: false, text: "", loading: false });
  };

  if (loading) {
    return (
      <div className="p-16 text-center font-bold text-slate-400 text-xs uppercase tracking-widest animate-pulse">
        {isEn ? "Loading your bookings..." : "A carregar as suas reservas..."}
      </div>
    );
  }

  return (
    <div className="font-sans space-y-10">
      {/* BANNER ALERTA: DADOS DE SEGURANÇA / EMERGÊNCIA EM FALTA */}
      {dadosEmFalta.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🛡️</span>
            <div>
              <h3 className="m-0 text-base font-black text-amber-950">
                {isEn
                  ? "Complete your Family Security Profile"
                  : "Complete os Dados de Segurança e Faturação"}
              </h3>
              <p className="m-0 text-xs font-bold text-amber-800 mt-1">
                {isEn ? "Missing details:" : "Dados em falta:"}{" "}
                <span className="underline">{dadosEmFalta.join(", ")}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPerfilModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest text-xs px-6 py-3.5 rounded-xl cursor-pointer whitespace-nowrap shadow-sm transition-colors"
          >
            {isEn ? "Complete Now" : "Preencher Agora"} &rarr;
          </button>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#0E3A68] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-2">
            {isEn ? "Family Area" : "Espaço da Família"}
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 m-0 tracking-tight">
            {isEn
              ? `Hello, ${perfilPai?.nome_completo?.split(" ")[0] || "Parent"}!`
              : `Olá, ${
                  perfilPai?.nome_completo?.split(" ")[0] || "Encarregado(a)"
                }!`}
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base font-medium mb-0">
            {isEn
              ? "Manage your children's camp bookings, payments, brochures, and reviews."
              : "Gira as inscrições dos seus filhos, pagamentos, brochuras e avaliações."}
          </p>
        </div>

        <Link
          href={`/${lang}/pesquisa`}
          className="bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest text-xs px-6 py-3.5 rounded-xl no-underline shadow-md transition-all"
        >
          + {isEn ? "Explore New Camps" : "Explorar Novos Campos"}
        </Link>
      </div>

      {/* SECÇÃO 1: AS MINHAS RESERVAS */}
      <section>
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-5">
          🎟️ {isEn ? "My Bookings & Enrollments" : "As Minhas Inscrições"} (
          {reservas.length})
        </h2>

        {reservas.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <span className="text-5xl block mb-4">🏕️</span>
            <h3 className="text-xl font-black text-slate-900 m-0 mb-2">
              {isEn
                ? "You have no active bookings yet"
                : "Ainda não tem reservas registadas"}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              {isEn
                ? "Discover verified summer camps, sports clinics, and language programs for your children."
                : "Descubra centenas de campos de férias, cursos de surf e programas internacionais verificados."}
            </p>
            <Link
              href={`/${lang}/pesquisa`}
              className="inline-block bg-[#e2a41d] hover:bg-[#d4991b] text-slate-900 font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl no-underline shadow-md"
            >
              {isEn ? "Find a Camp" : "Procurar Campos de Férias"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reservas.map((res) => {
              const nomeCampo =
                isEn && res.campos?.nome_en
                  ? res.campos.nome_en
                  : res.campos?.nome || "Programa HelloCamp";
              const nomeCrianca =
                res.criancas?.nome ||
                res.respostas_customizadas?.nome_crianca ||
                "Participante";
              const imgUrl = res.campos?.imagem?.startsWith("http")
                ? res.campos.imagem
                : "/og-image.jpg";

              // Calcula se há valor em falta (2ª Tranche de 50% OU Extra lançado pelo Parceiro!)
              const valorFaltaCobrar =
                Number(res.valor_em_falta) > 0
                  ? Number(res.valor_em_falta)
                  : Number(res.valor_pendente_extra) > 0
                  ? Number(res.valor_pendente_extra)
                  : res.status_pagamento === "Sinal Pago"
                  ? Number(res.valor_total) - Number(res.valor_pago)
                  : 0;

              const temPedidoPendente =
                !!res.respostas_customizadas?.pedido_pai_pendente;
              const isReembolsado = res.status_pagamento === "Reembolsado";

              return (
                <div
                  key={res.id}
                  className={`bg-white rounded-3xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col ${
                    valorFaltaCobrar > 0 && !isReembolsado
                      ? "border-amber-300"
                      : "border-slate-200"
                  }`}
                >
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={nomeCampo}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          isReembolsado
                            ? "bg-red-600 text-white"
                            : res.status_pagamento === "Pago"
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-400 text-slate-900"
                        }`}
                      >
                        {res.status_pagamento}
                      </span>
                    </div>
                    <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full">
                      Ref: #{res.id.split("-")[0]}
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      📍 {res.campos?.local || res.campos?.Distrito || "Portugal"}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 m-0 mb-2">
                      {nomeCampo}
                    </h3>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-4 space-y-1 text-xs">
                      <p className="m-0 font-bold text-slate-800">
                        👦 {isEn ? "Participant:" : "Participante:"}{" "}
                        <span className="text-[#0E3A68] font-black">
                          {nomeCrianca}
                        </span>
                      </p>
                      <p className="m-0 font-bold text-slate-600">
                        🗓️ {isEn ? "Turn / Package:" : "Turno / Pacote:"}{" "}
                        {res.turno_nome}
                      </p>
                      <p className="m-0 font-bold text-slate-600">
                        💶 {isEn ? "Total Value:" : "Valor Total:"}{" "}
                        <span className="font-black text-slate-900">
                          {Number(res.valor_total || 0).toFixed(2)}€
                        </span>
                      </p>
                    </div>

                    {/* ALERTA DE PAGAMENTO PENDENTE (2ª TRANCHE OU EXTRA APROVADO) */}
                    {valorFaltaCobrar > 0 && !isReembolsado && (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-4 flex items-center justify-between gap-3">
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-widest text-amber-800">
                            {res.status_pagamento ===
                            "Aguardando Pagamento Extra"
                              ? isEn
                                ? "Extra Approved by Organizer"
                                : "Extra Aprovado pelo Organizador"
                              : isEn
                              ? "Remaining 50% Balance"
                              : "2.ª Tranche Pendente (50%)"}
                          </span>
                          <span className="text-lg font-black text-amber-950">
                            {valorFaltaCobrar.toFixed(2)}€
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={loadingStripe === res.id}
                          onClick={() =>
                            handlePagarRestante(res, valorFaltaCobrar)
                          }
                          className="bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-[11px] px-5 py-3 rounded-xl cursor-pointer shadow-sm"
                        >
                          {loadingStripe === res.id
                            ? "..."
                            : isEn
                            ? "Pay Now"
                            : "Liquidar Agora"}
                        </button>
                      </div>
                    )}

                    {temPedidoPendente && (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl mb-4 text-xs font-bold text-blue-900">
                        ⏳{" "}
                        {isEn
                          ? "Change request sent to organizer:"
                          : "Pedido de alteração em análise pelo campo:"}{" "}
                        "{res.respostas_customizadas.pedido_pai_pendente}"
                      </div>
                    )}

                    <div className="mt-auto pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setReservaModal(res)}
                        className="flex-1 bg-slate-900 hover:bg-[#0E3A68] text-white font-black uppercase tracking-widest text-[11px] py-3 px-4 rounded-xl cursor-pointer transition-colors"
                      >
                        📋{" "}
                        {isEn
                          ? "Manage / Details"
                          : "Gerir Inscrição / Detalhes"}
                      </button>

                      {!isReembolsado && (
                        <Link
                          href={`/${lang}/cliente/avaliar/${res.id}`}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-black uppercase tracking-widest text-[11px] py-3 px-4 rounded-xl no-underline transition-colors flex items-center justify-center"
                        >
                          ★ {isEn ? "Review" : "Avaliar"}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECÇÃO 2: LISTAS PARTILHÁVEIS (WISHLISTS) */}
      {wishlists.length > 0 && (
        <section className="pt-6 border-t border-slate-200">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-4">
            ❤️ {isEn ? "My Shared Wishlists" : "As Minhas Listas de Favoritos"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {wishlists.map((w) => (
              <div
                key={w.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="m-0 text-sm font-black text-slate-900">
                    {w.nome}
                  </h4>
                  <Link
                    href={`/${lang}/lista/${w.token_partilha}`}
                    target="_blank"
                    className="text-[11px] font-bold text-[#0E3A68] hover:underline"
                  >
                    {isEn ? "View Public List ↗" : "Ver Lista Pública ↗"}
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => abrirModalPartilha(w.token_partilha, w.nome)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black px-3.5 py-2 rounded-xl cursor-pointer"
                >
                  🔗 {isEn ? "Share" : "Partilhar"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECÇÃO 3: SUGESTÕES PARA AS PRÓXIMAS FÉRIAS */}
      {sugestoesAzuis.length > 0 && (
        <section className="pt-6 border-t border-slate-200">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-5">
            ✨ {isEn ? "Recommended Programs" : "Sugestões para as Próximas Férias"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {sugestoesAzuis.map((c) => {
              const nome = isEn && c.nome_en ? c.nome_en : c.nome;
              return (
                <Link
                  key={c.id}
                  href={`/${lang}/campo/${c.id}`}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all no-underline text-inherit flex flex-col group"
                >
                  <div className="h-40 bg-slate-100 overflow-hidden">
                    <img
                      src={c.imagem || "/og-image.jpg"}
                      alt={nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        📍 {c.local || "Portugal"}
                      </span>
                      <h4 className="m-0 mt-1 text-base font-black text-slate-900">
                        {nome}
                      </h4>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-lg font-black text-[#0E3A68]">
                        {c.preco > 0 ? `${c.preco}€` : "--"}
                      </span>
                      <span className="text-xs font-black text-[#e2a41d]">
                        {isEn ? "Explore" : "Ver Datas"} &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* MODAL DE DETALHES DA RESERVA, BROCHURAS PDF, EXTRAS E CANCELAMENTO  */}
      {/* =================================================================== */}
      {reservaModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={fecharReservaModal}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0E3A68] bg-blue-50 px-3 py-1 rounded-full">
                  Reserva #{reservaModal.id.split("-")[0]}
                </span>
                <h2 className="text-2xl font-black text-slate-900 m-0 mt-2">
                  {isEn && reservaModal.campos?.nome_en
                    ? reservaModal.campos.nome_en
                    : reservaModal.campos?.nome}
                </h2>
                <p className="text-xs font-bold text-slate-500 m-0 mt-1">
                  👦 {reservaModal.criancas?.nome || "Participante"} • 🗓️{" "}
                  {reservaModal.turno_nome}
                </p>
              </div>
              <button
                type="button"
                onClick={fecharReservaModal}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-6">
              {/* BROCHURAS / PDF DO CAMPO (SE EXISTIREM) */}
              {Array.isArray(reservaModal.campos?.programas_pdf) &&
                reservaModal.campos.programas_pdf.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#167524] m-0 mb-2">
                      📄{" "}
                      {isEn
                        ? "Camp Documents & Schedule (PDF)"
                        : "Documentos e Horário do Campo (PDF)"}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {reservaModal.campos.programas_pdf.map(
                        (doc: any, i: number) => (
                          <a
                            key={i}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white border border-emerald-300 text-[#167524] text-xs font-black px-4 py-2 rounded-xl no-underline shadow-sm"
                          >
                            📥 {doc.nome || "Descarregar PDF"}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* POLÍTICA DE CANCELAMENTO ACORDADA */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <strong className="block text-slate-900 uppercase tracking-wider mb-1">
                  🛡️{" "}
                  {isEn
                    ? "Agreed Cancellation Policy:"
                    : "Política de Cancelamento deste Campo:"}
                </strong>
                <span className="text-slate-600 font-medium">
                  {reservaModal.campos?.politica_cancelamento ||
                    "Consulte os termos na página do programa."}
                </span>
              </div>

              {/* PEDIR ALTERAÇÃO OU ADICIONAR EXTRA */}
              {reservaModal.status_pagamento !== "Reembolsado" && (
                <div className="bg-blue-50/60 border border-blue-200 p-5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="m-0 text-sm font-black text-[#0E3A68]">
                        📝{" "}
                        {isEn
                          ? "Need to add an extra or change dates?"
                          : "Precisa de pedir uma alteração ou adicionar um extra?"}
                      </h4>
                      <p className="m-0 text-xs text-slate-600 mt-0.5">
                        {isEn
                          ? "Send a direct request to the camp organizer."
                          : "Envie o pedido diretamente ao organizador (ex: transporte, prolongamento, troca de semana)."}
                      </p>
                    </div>
                    {!changeRequest.active && (
                      <button
                        type="button"
                        onClick={() =>
                          setChangeRequest({
                            active: true,
                            text: "",
                            loading: false,
                          })
                        }
                        className="bg-[#0E3A68] text-white font-black uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-xl cursor-pointer whitespace-nowrap"
                      >
                        {isEn ? "Request Change" : "Pedir Alteração"}
                      </button>
                    )}
                  </div>

                  {changeRequest.active && (
                    <div className="mt-4 space-y-3">
                      <textarea
                        rows={3}
                        value={changeRequest.text}
                        onChange={(e) =>
                          setChangeRequest({
                            ...changeRequest,
                            text: e.target.value,
                          })
                        }
                        placeholder={
                          isEn
                            ? "Describe what you would like to add or change..."
                            : "Descreva aqui o extra que pretende adicionar ou a alteração necessária..."
                        }
                        className="w-full p-3.5 bg-white border border-blue-200 rounded-xl text-sm font-medium outline-none focus:border-[#0E3A68]"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setChangeRequest({
                              active: false,
                              text: "",
                              loading: false,
                            })
                          }
                          className="px-4 py-2 text-xs font-bold text-slate-500 cursor-pointer"
                        >
                          {isEn ? "Cancel" : "Cancelar"}
                        </button>
                        <button
                          type="button"
                          disabled={changeRequest.loading}
                          onClick={() =>
                            handleEnviarPedidoAlteracao(reservaModal)
                          }
                          className="bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                        >
                          {changeRequest.loading
                            ? "..."
                            : isEn
                            ? "Send Request"
                            : "Enviar Pedido ao Campo"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CANCELAMENTO E REEMBOLSO AUTOMÁTICO */}
              {reservaModal.status_pagamento !== "Reembolsado" && (
                <div className="border-t border-slate-100 pt-5">
                  {!cancelState.confirm ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCancelState({ loading: false, confirm: true })
                      }
                      className="text-xs font-black uppercase tracking-widest text-red-600 hover:underline cursor-pointer bg-transparent border-0 p-0"
                    >
                      ✕{" "}
                      {isEn
                        ? "Cancel Booking & Request Refund"
                        : "Cancelar Inscrição / Solicitar Reembolso"}
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
                      <p className="text-xs font-bold text-red-900 m-0 mb-3">
                        ⚠️{" "}
                        {isEn
                          ? "Are you sure you want to cancel this booking? Any refund will be automatically calculated according to the camp's cancellation policy."
                          : "Tem a certeza que pretende cancelar esta inscrição? O estorno será processado automaticamente de acordo com a política de cancelamento do campo."}
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setCancelState({ loading: false, confirm: false })
                          }
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          {isEn ? "Keep Booking" : "Manter Inscrição"}
                        </button>
                        <button
                          type="button"
                          disabled={cancelState.loading}
                          onClick={() => handleCancelarReserva(reservaModal)}
                          className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer"
                        >
                          {cancelState.loading
                            ? "..."
                            : isEn
                            ? "Confirm Cancellation"
                            : "Confirmar Cancelamento"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREENCHIMENTO RÁPIDO DE PERFIL */}
      {isPerfilModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsPerfilModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-slate-900 m-0 mb-4">
              🛡️{" "}
              {isEn
                ? "Family Security & Billing Details"
                : "Dados de Segurança e Faturação"}
            </h3>
            <form onSubmit={handleSavePerfilRapido} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={perfilForm.nome_completo}
                  onChange={(e) =>
                    setPerfilForm({
                      ...perfilForm,
                      nome_completo: e.target.value,
                    })
                  }
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Telemóvel *
                  </label>
                  <input
                    type="tel"
                    required
                    value={perfilForm.telefone}
                    onChange={(e) =>
                      setPerfilForm({ ...perfilForm, telefone: e.target.value })
                    }
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    NIF (Faturação) *
                  </label>
                  <input
                    type="text"
                    required
                    value={perfilForm.nif}
                    onChange={(e) =>
                      setPerfilForm({ ...perfilForm, nif: e.target.value })
                    }
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-red-700 mb-1">
                  Contacto de Emergência Alternativo (Nome e Telefone) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Avó Maria - 912 345 678"
                  value={perfilForm.contacto_emergencia}
                  onChange={(e) =>
                    setPerfilForm({
                      ...perfilForm,
                      contacto_emergencia: e.target.value,
                    })
                  }
                  className="w-full p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm font-bold"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPerfilModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPerfil}
                  className="bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  {savingPerfil ? "..." : "Guardar Dados"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARTILHA DE LISTA */}
      {isShareModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-slate-900 m-0 mb-2">
              🔗 {shareTitle}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isEn
                ? "Share this link with family or friends so they can see your saved camps:"
                : "Partilhe este link com outros pais ou familiares para verem os campos que guardou:"}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-[#0E3A68] text-white font-black text-xs px-4 rounded-xl cursor-pointer"
              >
                {copied ? "✓" : isEn ? "Copy" : "Copiar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
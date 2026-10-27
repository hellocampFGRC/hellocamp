"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DashboardMarketing({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const [metricas, setMetricas] = useState({
    totalReservas: 0,
    receitaBruta: 0,
    vezesGuardado: 0,
    camposAtivos: 0,
    camposPendentes: 0,
    mediaEstrelas: 0,
    pedidosPendentes: 0,
    mensagensNaoLidas: 0,
  });

  const [sugestoes, setSugestoes] = useState<any[]>([]);

  useEffect(() => {
    const fetchMarketingData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const uid = session.user.id;
      setUserId(uid);

      // 1. Busca Perfil (Inclui dados do CONTRATO GLOBAL e Modalidade)
      const { data: perfil } = await supabase
        .from("perfis")
        .select(
          "empresa_nome, nome_completo, stripe_account_id, contrato_dados, status_contrato, modalidade_reserva"
        )
        .eq("id", uid)
        .single();

      if (perfil) {
        if (perfil.empresa_nome && perfil.empresa_nome.trim() !== "") {
          setNomeEmpresa(perfil.empresa_nome);
        } else if (perfil.nome_completo && perfil.nome_completo.trim() !== "") {
          setNomeEmpresa(perfil.nome_completo.split(" ")[0]);
        } else {
          setNomeEmpresa(isEn ? "Organizer" : "Organizador");
        }
      } else {
        setNomeEmpresa(isEn ? "Organizer" : "Organizador");
      }

      // 2. Busca Campos do Parceiro
      const { data: campos } = await supabase
        .from("campos")
        .select(
          "id, nome, ativo, status_aprovacao, rating_score, total_reviews, galeria, programas_pdf, modalidade_reserva"
        )
        .eq("organizador_id", uid);

      const camposIds = campos?.map((c) => c.id) || [];

      let ativos = 0;
      let pendentes = 0;
      let somaEstrelas = 0;
      let totalComReviews = 0;
      const novasSugestoes: any[] = [];

      // ALERTA 1: CONTRATO GLOBAL EM FALTA OU PENDENTE
      if (!perfil?.contrato_dados) {
        novasSugestoes.push({
          tipo: "critical",
          icon: "📝",
          titulo: isEn ? "Global Contract Missing" : "Contrato Global em Falta",
          texto: isEn
            ? "You must sign the Global Partnership Agreement to publish your camps and recruit monitors."
            : "A sua conta encontra-se restrita. Precisa de assinar o Contrato Global de Parceria para publicar campos e aceder à bolsa de recrutamento.",
          link: `/${lang}/admin/contrato`,
          actionText: isEn ? "Sign Contract Now" : "Assinar Contrato Agora",
        });
      } else if (
        perfil?.status_contrato === "Pendente de Revisão" ||
        perfil?.status_contrato === "Pendente"
      ) {
        novasSugestoes.push({
          tipo: "info",
          icon: "⏳",
          titulo: isEn ? "Contract Under Review" : "Contrato em Revisão",
          texto: isEn
            ? "Your Global Contract is being reviewed by our legal team."
            : "O seu Contrato Global foi submetido com sucesso e encontra-se a ser analisado pela nossa equipa.",
          link: `/${lang}/admin/contrato`,
          actionText: isEn ? "View Document" : "Ver Documento",
        });
      }

      // ALERTA 2: STRIPE NÃO CONECTADO (Apenas se o parceiro usar Reserva Direta!)
      const usaReservaDireta =
        (perfil?.modalidade_reserva ||
          perfil?.contrato_dados?.modalidadeReserva ||
          "direta") === "direta" ||
        campos?.some((c) => (c.modalidade_reserva || "direta") === "direta");

      if (!perfil?.stripe_account_id && usaReservaDireta) {
        novasSugestoes.push({
          tipo: "critical",
          icon: "🚨",
          titulo: isEn
            ? "Bank Account Not Connected"
            : "Conta Bancária Não Conectada",
          texto: isEn
            ? "You must connect your Stripe account to receive automatic payouts from parents."
            : "Precisa de configurar a sua conta bancária via Stripe para receber automaticamente as inscrições pagas pelos pais.",
          link: `/${lang}/admin/faturacao`,
          actionText: isEn ? "Connect Now" : "Configurar Conta Agora",
        });
      }

      campos?.forEach((c) => {
        const status = (c.status_aprovacao || "").toLowerCase();
        if (
          status === "aprovado" ||
          status === "validado" ||
          status === "ativo" ||
          status === "active"
        ) {
          ativos++;
        } else {
          pendentes++;
        }

        if (c.rating_score > 0) {
          somaEstrelas += Number(c.rating_score);
          totalComReviews++;
        }

        if (!c.galeria || c.galeria.length === 0) {
          novasSugestoes.push({
            tipo: "warning",
            icon: "📸",
            titulo: isEn ? "Missing Photo Gallery" : "Galeria de Fotos Vazia",
            texto: isEn
              ? `Parents decide based on photos! Add a gallery to "${c.nome}".`
              : `Os pais decidem com os olhos! Adicione mais fotografias à galeria do campo "${c.nome}".`,
            link: `/${lang}/admin/campos/editar/${c.id}`,
            actionText: isEn ? "Add Photos" : "Adicionar Fotos",
          });
        }

        if (!c.programas_pdf || c.programas_pdf.length === 0) {
          novasSugestoes.push({
            tipo: "info",
            icon: "📄",
            titulo: isEn
              ? "No Itinerary PDF"
              : "Falta o Programa Detalhado (PDF)",
            texto: isEn
              ? `Attach a PDF schedule to "${c.nome}" to increase parent trust.`
              : `Anexe um PDF com o horário/itinerário no campo "${c.nome}" para aumentar a taxa de conversão.`,
            link: `/${lang}/admin/campos/editar/${c.id}`,
            actionText: isEn ? "Attach PDF" : "Anexar PDF",
          });
        }

        if (
          (!c.total_reviews || c.total_reviews === 0) &&
          (status === "aprovado" || status === "ativo")
        ) {
          novasSugestoes.push({
            tipo: "idea",
            icon: "⭐",
            campoId: c.id,
            campoNome: c.nome,
            titulo: isEn ? "Zero Reviews" : "Nenhuma Avaliação",
            texto: isEn
              ? `"${c.nome}" has no reviews yet. Share the direct link with past clients!`
              : `O campo "${c.nome}" ainda não tem avaliações. Partilhe o link com famílias de edições anteriores!`,
            link: `/${lang}/campo/${c.id}`,
            actionText: isEn ? "View Camp Page" : "Ver Página do Campo",
          });
        }
      });

      // 3. Busca de Reservas e Receita
      const { data: reservasDados } = await supabase
        .from("reservas")
        .select("status_pagamento, valor_total, respostas_customizadas")
        .eq("organizador_id", uid);

      let countReservas = 0;
      let volumeBruto = 0;
      let countPedidosUpsell = 0;

      reservasDados?.forEach((res) => {
        if (
          res.status_pagamento === "Pago" ||
          res.status_pagamento === "Sinal Pago"
        ) {
          countReservas++;
          volumeBruto += Number(res.valor_total) || 0;
        }
        if (
          res.respostas_customizadas &&
          res.respostas_customizadas.pedido_pai_pendente
        ) {
          countPedidosUpsell++;
        }
      });

      // 4. Busca Mensagens Não Lidas na Inbox
      const { count: unreadCount } = await supabase
        .from("mensagens")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", uid)
        .eq("lida", false);

      // 5. Busca Wishlists
      let vezesGuardadoTotal = 0;
      if (camposIds.length > 0) {
        const { count } = await supabase
          .from("wishlist_campos")
          .select("*", { count: "exact", head: true })
          .in("campo_id", camposIds);
        vezesGuardadoTotal = count || 0;
      }

      setMetricas({
        totalReservas: countReservas,
        receitaBruta: volumeBruto,
        vezesGuardado: vezesGuardadoTotal,
        camposAtivos: ativos,
        camposPendentes: pendentes,
        mediaEstrelas:
          totalComReviews > 0 ? somaEstrelas / totalComReviews : 0,
        pedidosPendentes: countPedidosUpsell,
        mensagensNaoLidas: unreadCount || 0,
      });

      const prioridade: Record<string, number> = {
        critical: 1,
        warning: 2,
        info: 3,
        idea: 4,
      };
      novasSugestoes.sort((a, b) => prioridade[a.tipo] - prioridade[b.tipo]);

      setSugestoes(novasSugestoes);
      setLoading(false);
    };

    fetchMarketingData();
  }, [lang, isEn]);

  const copiarConviteWhatsApp = (campoId: string, campoNome: string) => {
    const url = `https://www.hellocamp.pt/${lang}/campo/${campoId}`;
    const msg = isEn
      ? `Hello! We hope your child loved "${campoNome}"! 🏕️ You can check our upcoming dates and share your feedback on our official HelloCamp page here: ${url}`
      : `Olá! Esperamos que tenham adorado a experiência no "${campoNome}"! 🏕️ Podem consultar as nossas próximas datas e partilhar a vossa página oficial na HelloCamp aqui: ${url}`;
    navigator.clipboard.writeText(msg);
    setCopiadoId(campoId);
    setTimeout(() => setCopiadoId(null), 3000);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">
        {isEn
          ? "Loading your Partner Control Center..."
          : "A carregar o seu Painel de Controlo..."}
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto font-sans pb-16">
      {/* CABEÇALHO E ACÕES RÁPIDAS */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#167524] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-2">
            {isEn ? "Partner Portal B2B" : "Portal do Organizador B2B"}
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 m-0 tracking-tight">
            {isEn ? `Welcome, ${nomeEmpresa}` : `Olá, ${nomeEmpresa}`}
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm md:text-base font-medium">
            {isEn
              ? "Monitor your bookings, messages, and optimize your programs to convert more families."
              : "Acompanhe as suas inscrições, responda aos pais e otimize os seus programas."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {userId && (
            <Link
              href={`/${lang}/parceiro/${userId}`}
              target="_blank"
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest no-underline transition-colors"
            >
              <span>🌐</span> {isEn ? "Public Profile ↗" : "Ver Montra Pública ↗"}
            </Link>
          )}
          <Link
            href={`/${lang}/admin/contrato`}
            className="flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 border border-[#167524] text-[#167524] px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest no-underline transition-colors"
          >
            <span>📝</span> {isEn ? "Global Contract" : "Contrato Global"}
          </Link>
          <Link
            href={`/${lang}/admin/campos/novo`}
            className="flex items-center justify-center gap-2 bg-[#167524] hover:bg-[#115a1b] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest no-underline transition-all shadow-md"
          >
            <span>+</span> {isEn ? "Create Camp" : "Novo Campo"}
          </Link>
        </div>
      </div>

      {/* BANNER ALERTA 1: MENSAGENS NÃO LIDAS NA INBOX */}
      {metricas.mensagensNaoLidas > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl mb-6 flex items-center justify-between flex-wrap gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-3xl">💬</span>
            <div>
              <h3 className="m-0 text-base font-black text-blue-950">
                {isEn
                  ? `You have ${metricas.mensagensNaoLidas} unread message(s) from parents!`
                  : `Tem ${metricas.mensagensNaoLidas} mensagem(ns) por ler na sua Inbox!`}
              </h3>
              <p className="m-0 text-xs font-medium text-blue-800 mt-0.5">
                {isEn
                  ? "Fast replies significantly increase your booking conversion rate."
                  : "Responder rapidamente às dúvidas dos pais aumenta drasticamente a taxa de inscrição."}
              </p>
            </div>
          </div>
          <Link
            href={`/${lang}/admin/inbox`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest no-underline shadow-sm transition-colors"
          >
            {isEn ? "Open Inbox" : "Abrir Mensagens"} &rarr;
          </Link>
        </div>
      )}

      {/* BANNER ALERTA 2: PEDIDOS DE ALTERAÇÃO / EXTRAS PENDENTES */}
      {metricas.pedidosPendentes > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl mb-8 flex items-center justify-between flex-wrap gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-3xl animate-pulse">📬</span>
            <div>
              <h3 className="m-0 text-base font-black text-amber-950">
                {isEn
                  ? `You have ${metricas.pedidosPendentes} pending change request(s)!`
                  : `Tem ${metricas.pedidosPendentes} pedido(s) de alteração/extra pendente(s)!`}
              </h3>
              <p className="m-0 text-xs font-medium text-amber-800 mt-0.5">
                {isEn
                  ? "Parents are waiting for your review in the Bookings Center."
                  : "Os encarregados de educação solicitaram alterações ou novos extras nas reservas."}
              </p>
            </div>
          </div>
          <Link
            href={`/${lang}/admin/reservas`}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest no-underline shadow-sm transition-colors"
          >
            {isEn ? "Review Requests" : "Analisar Pedidos"} &rarr;
          </Link>
        </div>
      )}

      {/* GRELHA PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUNA ESQUERDA: MÉTRICAS E ATALHOS (7 Colunas) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <h2 className="text-sm font-black text-slate-900 m-0 uppercase tracking-widest">
            {isEn ? "Performance & Traction" : "Desempenho & Tração"}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* INSCRIÇÕES CONFIRMADAS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-50 text-[#167524] rounded-xl flex items-center justify-center text-lg">
                  🎫
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isEn ? "Bookings" : "Inscrições"}
                </span>
              </div>
              <span className="text-3xl font-black text-[#167524] block leading-none">
                {metricas.totalReservas}
              </span>
              <p className="mt-2 mb-0 text-xs text-slate-500 font-semibold">
                {isEn ? "Confirmed seats" : "Vagas confirmadas"}
              </p>
            </div>

            {/* VOLUME BRUTO */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-50 text-[#167524] rounded-xl flex items-center justify-center text-lg">
                  💶
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isEn ? "Gross Sales" : "Faturação"}
                </span>
              </div>
              <span className="text-3xl font-black text-slate-900 block leading-none">
                {metricas.receitaBruta.toFixed(0)}€
              </span>
              <p className="mt-2 mb-0 text-xs text-slate-500 font-semibold">
                {isEn ? "Total volume" : "Volume bruto gerado"}
              </p>
            </div>

            {/* CAMPOS ATIVOS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg">
                  🏕️
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isEn ? "Programs" : "Programas"}
                </span>
              </div>
              <span className="text-3xl font-black text-slate-900 block leading-none">
                {metricas.camposAtivos}
              </span>
              <p className="mt-2 mb-0 text-xs text-slate-500 font-semibold">
                {metricas.camposPendentes > 0
                  ? `${metricas.camposPendentes} ${isEn ? "pending" : "em revisão"}`
                  : isEn
                  ? "Active online"
                  : "Ativos online"}
              </p>
            </div>

            {/* WISHLISTS / FAVORITOS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center text-lg">
                  ❤️
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isEn ? "Wishlists" : "Favoritos"}
                </span>
              </div>
              <span className="text-3xl font-black text-slate-900 block leading-none">
                {metricas.vezesGuardado}
              </span>
              <p className="mt-2 mb-0 text-xs text-slate-500 font-semibold">
                {isEn ? "Saved by parents" : "Famílias interessadas"}
              </p>
            </div>

            {/* AVALIAÇÃO MÉDIA */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-lg">
                  ⭐
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isEn ? "Rating" : "Avaliação"}
                </span>
              </div>
              <span className="text-3xl font-black text-slate-900 block leading-none">
                {metricas.mediaEstrelas > 0
                  ? metricas.mediaEstrelas.toFixed(1)
                  : "-"}
              </span>
              <p className="mt-2 mb-0 text-xs text-slate-500 font-semibold">
                {isEn ? "Global score" : "Média de avaliações"}
              </p>
            </div>

            {/* MENSAGENS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-lg">
                  💬
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Inbox
                </span>
              </div>
              <span className="text-3xl font-black text-slate-900 block leading-none">
                {metricas.mensagensNaoLidas}
              </span>
              <p className="mt-2 mb-0 text-xs text-slate-500 font-semibold">
                {isEn ? "Unread messages" : "Mensagens por ler"}
              </p>
            </div>
          </div>

          {/* ATALHOS OPERACIONAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <Link
              href={`/${lang}/admin/reservas`}
              className="bg-white hover:border-[#167524] p-5 rounded-2xl border border-slate-200 shadow-sm no-underline transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">📋</span>
                <div>
                  <span className="block text-sm font-black text-slate-900 group-hover:text-[#167524]">
                    {isEn ? "Bookings & Health Forms" : "Reservas e Fichas Médicas"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {isEn
                      ? "Check allergies, ages & contacts"
                      : "Alergias, contactos e turmas"}
                  </span>
                </div>
              </div>
              <span className="text-[#167524] font-black">&rarr;</span>
            </Link>

            <Link
              href={`/${lang}/admin/faturacao`}
              className="bg-white hover:border-[#167524] p-5 rounded-2xl border border-slate-200 shadow-sm no-underline transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">💰</span>
                <div>
                  <span className="block text-sm font-black text-slate-900 group-hover:text-[#167524]">
                    {isEn ? "Billing & Stripe Payouts" : "Finanças e Faturação"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {isEn
                      ? "Bank account & net balance"
                      : "Conta Stripe e ganhos líquidos"}
                  </span>
                </div>
              </div>
              <span className="text-[#167524] font-black">&rarr;</span>
            </Link>

            <Link
              href={`/${lang}/admin/campos`}
              className="bg-white hover:border-[#167524] p-5 rounded-2xl border border-slate-200 shadow-sm no-underline transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">⛺</span>
                <div>
                  <span className="block text-sm font-black text-slate-900 group-hover:text-[#167524]">
                    {isEn ? "Manage My Camps" : "Gerir Os Meus Campos"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {isEn
                      ? "Edit dates, prices & packages"
                      : "Editar vagas, preços e datas"}
                  </span>
                </div>
              </div>
              <span className="text-[#167524] font-black">&rarr;</span>
            </Link>

            <Link
              href={`/${lang}/admin/recrutamento`}
              className="bg-white hover:border-[#167524] p-5 rounded-2xl border border-slate-200 shadow-sm no-underline transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">🎒</span>
                <div>
                  <span className="block text-sm font-black text-slate-900 group-hover:text-[#167524]">
                    {isEn ? "Staff Recruitment" : "Bolsa de Monitores"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {isEn
                      ? "Hire certified monitors"
                      : "Recrutar monitores certificados"}
                  </span>
                </div>
              </div>
              <span className="text-[#167524] font-black">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* COLUNA DIREITA: MOTOR DE OTIMIZAÇÃO (5 Colunas) */}
        <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-black text-slate-900 m-0 uppercase tracking-widest">
              {isEn ? "Optimization Engine" : "Motor de Otimização"}
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black ${
                sugestoes.length > 0
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-[#167524]"
              }`}
            >
              {sugestoes.length} {isEn ? "Tasks" : "Avisos"}
            </span>
          </div>

          {sugestoes.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <span className="text-5xl block mb-4">🏆</span>
              <h3 className="m-0 mb-2 text-base font-black text-slate-900">
                {isEn ? "All set!" : "Tudo 100% otimizado!"}
              </h3>
              <p className="m-0 text-xs text-slate-500 font-medium">
                {isEn
                  ? "Your account and camps follow all best practices."
                  : "A sua conta e os seus programas cumprem todas as boas práticas de conversão."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {sugestoes.map((sug, idx) => {
                let boxClasses = "bg-slate-50 border-slate-200 text-slate-900";
                if (sug.tipo === "critical")
                  boxClasses = "bg-red-50 border-red-200 text-red-900";
                if (sug.tipo === "warning")
                  boxClasses = "bg-amber-50 border-amber-200 text-amber-900";
                if (sug.tipo === "info")
                  boxClasses = "bg-blue-50 border-blue-200 text-blue-900";

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex gap-3.5 items-start ${boxClasses}`}
                  >
                    <div className="text-2xl leading-none mt-0.5">
                      {sug.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="m-0 mb-1 text-sm font-black">
                        {sug.titulo}
                      </h4>
                      <p className="m-0 mb-3 text-xs text-slate-600 leading-relaxed font-medium">
                        {sug.texto}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={sug.link}
                          className="text-xs font-black underline underline-offset-4 text-inherit"
                        >
                          {sug.actionText} &rarr;
                        </Link>
                        {sug.campoId && (
                          <button
                            type="button"
                            onClick={() =>
                              copiarConviteWhatsApp(sug.campoId, sug.campoNome)
                            }
                            className="text-[11px] font-black bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                          >
                            {copiadoId === sug.campoId
                              ? isEn
                                ? "✓ Copied!"
                                : "✓ Mensagem Copiada!"
                              : isEn
                              ? "📲 Copy WhatsApp Invite"
                              : "📲 Copiar Convite WhatsApp"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
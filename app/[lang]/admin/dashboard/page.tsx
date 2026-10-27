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

  // Estado para Editar a Montra Pública do Parceiro (Logótipo, Bio, Website, Ano Fundação)
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [brandForm, setBrandForm] = useState({
    empresa_nome: "",
    logotipo_url: "",
    biografia_empresa: "",
    website: "",
    ano_fundacao: "",
    telefone: "",
  });

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

  const fetchMarketingData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const uid = session.user.id;
    setUserId(uid);

    const { data: perfil } = await supabase
      .from("perfis")
      .select("*")
      .eq("id", uid)
      .single();

    if (perfil) {
      const empNome =
        perfil.empresa_nome?.trim() ||
        perfil.nome_completo?.split(" ")[0] ||
        (isEn ? "Organizer" : "Organizador");
      setNomeEmpresa(empNome);

      setBrandForm({
        empresa_nome: perfil.empresa_nome || "",
        logotipo_url: perfil.logotipo_url || "",
        biografia_empresa:
          perfil.biografia_empresa ||
          perfil.descricao ||
          perfil.contrato_dados?.biografia_empresa ||
          "",
        website: perfil.website || perfil.contrato_dados?.website || "",
        ano_fundacao:
          perfil.ano_fundacao || perfil.contrato_dados?.ano_fundacao || "",
        telefone: perfil.telefone || "",
      });
    }

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

    if (!perfil?.contrato_dados) {
      novasSugestoes.push({
        tipo: "critical",
        icon: "📝",
        titulo: isEn ? "Global Contract Missing" : "Contrato Global em Falta",
        texto: isEn
          ? "You must sign the Global Partnership Agreement to publish your camps and recruit monitors."
          : "Precisa de assinar o Contrato Global de Parceria para publicar campos e aceder à bolsa de recrutamento.",
        link: `/${lang}/admin/contrato`,
        actionText: isEn ? "Sign Contract Now" : "Assinar Contrato Agora",
      });
    }

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
          ? "Connect your Stripe account to receive automatic payouts from parents."
          : "Configure a sua conta bancária via Stripe para receber automaticamente as inscrições pagas pelos pais.",
        link: `/${lang}/admin/faturacao`,
        actionText: isEn ? "Connect Now" : "Configurar Conta Agora",
      });
    }

    // Alerta se faltar Logótipo ou Descrição Pública da Empresa
    if (!perfil?.logotipo_url || !(perfil?.biografia_empresa || perfil?.descricao)) {
      novasSugestoes.push({
        tipo: "info",
        icon: "🏢",
        openBrandModal: true,
        titulo: isEn
          ? "Complete Your Public Brand Profile"
          : "Adicione o seu Logótipo e Apresentação",
        texto: isEn
          ? "Add your company logo and description to build trust on your public organizer page."
          : "Adicione o logótipo e a descrição da sua organização para transmitir máxima confiança aos pais na sua página pública.",
        link: "#",
        actionText: isEn
          ? "Upload Logo & Bio"
          : "Configurar Logótipo e Descrição",
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
            ? `Add a photo gallery to "${c.nome}".`
            : `Adicione mais fotografias à galeria do campo "${c.nome}".`,
          link: `/${lang}/admin/campos/editar/${c.id}`,
          actionText: isEn ? "Add Photos" : "Adicionar Fotos",
        });
      }
    });

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

    const { count: unreadCount } = await supabase
      .from("mensagens")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", uid)
      .eq("lida", false);

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
      mediaEstrelas: totalComReviews > 0 ? somaEstrelas / totalComReviews : 0,
      pedidosPendentes: countPedidosUpsell,
      mensagensNaoLidas: unreadCount || 0,
    });

    setSugestoes(novasSugestoes);
    setLoading(false);
  };

  useEffect(() => {
    fetchMarketingData();
  }, [lang, isEn]);

  // Upload do Logótipo Oficial do Parceiro para o Supabase Storage
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !userId) return;
    setUploadingLogo(true);
    try {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop();
      const fileName = `logo_${userId}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("campos-imagens")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("campos-imagens").getPublicUrl(fileName);

      setBrandForm((prev) => ({ ...prev, logotipo_url: publicUrl }));
    } catch (err: any) {
      alert("Erro ao enviar logótipo: " + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveBrandProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSavingBrand(true);

    try {
      // Traduz a biografia da empresa automaticamente para Inglês
      let bioEn = brandForm.biografia_empresa;
      if (brandForm.biografia_empresa.trim()) {
        try {
          const res = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
              brandForm.biografia_empresa.substring(0, 480)
            )}&langpair=pt|en`
          );
          const d = await res.json();
          if (d?.responseData?.translatedText) {
            bioEn = d.responseData.translatedText;
          }
        } catch {}
      }

      // Guarda nas colunas de perfis (compatível com todas as páginas públicas)
      const { error } = await supabase
        .from("perfis")
        .update({
          empresa_nome: brandForm.empresa_nome,
          logotipo_url: brandForm.logotipo_url || null,
          biografia_empresa: brandForm.biografia_empresa || null,
          biografia_empresa_en: bioEn || null,
          descricao: brandForm.biografia_empresa || null,
          descricao_en: bioEn || null,
          website: brandForm.website || null,
          ano_fundacao: brandForm.ano_fundacao || null,
          telefone: brandForm.telefone || null,
        })
        .eq("id", userId);

      if (error) throw error;

      setNomeEmpresa(brandForm.empresa_nome || nomeEmpresa);
      setShowBrandModal(false);
      fetchMarketingData();
      alert(
        isEn
          ? "Public Organizer Profile updated successfully!"
          : "Montra Pública e Logótipo guardados com sucesso!"
      );
    } catch (err: any) {
      alert("Erro ao guardar perfil: " + err.message);
    } finally {
      setSavingBrand(false);
    }
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
      {/* CABEÇALHO E BOTÕES EXECUTIVOS RETOS (rounded-md) */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white p-6 border border-slate-200 rounded-md shadow-sm">
        <div className="flex items-center gap-4">
          {/* MINIATURA DO LOGÓTIPO CLICÁVEL */}
          <div
            onClick={() => setShowBrandModal(true)}
            title={
              isEn ? "Click to change Logo" : "Clique para alterar o Logótipo"
            }
            className="w-16 h-16 bg-slate-50 border border-slate-300 rounded-md flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#167524] flex-shrink-0 p-1.5"
          >
            {brandForm.logotipo_url ? (
              <img
                src={brandForm.logotipo_url}
                alt={nomeEmpresa}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-xs font-black text-slate-400 text-center leading-tight">
                + LOGO
              </span>
            )}
          </div>

          <div>
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#167524] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-sm mb-1.5">
              {isEn ? "Partner Portal B2B" : "Portal do Organizador B2B"}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 m-0 tracking-tight">
              {isEn ? `Welcome, ${nomeEmpresa}` : `Olá, ${nomeEmpresa}`}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowBrandModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-4 py-2.5 rounded-md font-black text-xs uppercase tracking-widest cursor-pointer transition-colors"
          >
            🏢 {isEn ? "Edit Logo & Bio" : "Logótipo e Perfil Público"}
          </button>

          {userId && (
            <Link
              href={`/${lang}/parceiro/${userId}`}
              target="_blank"
              className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-md font-black text-xs uppercase tracking-widest no-underline transition-colors"
            >
              🌐 {isEn ? "Public Page ↗" : "Ver Montra ↗"}
            </Link>
          )}

          <Link
            href={`/${lang}/admin/campos/novo`}
            className="flex items-center justify-center gap-1.5 bg-[#167524] hover:bg-[#115a1b] text-white px-5 py-2.5 rounded-md font-black text-xs uppercase tracking-widest no-underline transition-all shadow-sm"
          >
            + {isEn ? "Create Camp" : "Novo Campo"}
          </Link>
        </div>
      </div>

      {/* BANNERS DE ALERTA */}
      {metricas.mensagensNaoLidas > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-5 rounded-md mb-6 flex items-center justify-between flex-wrap gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-2xl">💬</span>
            <div>
              <h3 className="m-0 text-sm font-black text-blue-950">
                {isEn
                  ? `You have ${metricas.mensagensNaoLidas} unread message(s)!`
                  : `Tem ${metricas.mensagensNaoLidas} mensagem(ns) por ler na sua Inbox!`}
              </h3>
            </div>
          </div>
          <Link
            href={`/${lang}/admin/inbox`}
            className="bg-[#0E3A68] text-white px-5 py-2.5 rounded-md font-black text-xs uppercase tracking-widest no-underline"
          >
            {isEn ? "Open Inbox" : "Abrir Mensagens"} &rarr;
          </Link>
        </div>
      )}

      {metricas.pedidosPendentes > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-5 rounded-md mb-8 flex items-center justify-between flex-wrap gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-2xl">📬</span>
            <div>
              <h3 className="m-0 text-sm font-black text-amber-950">
                {isEn
                  ? `You have ${metricas.pedidosPendentes} pending extra request(s)!`
                  : `Tem ${metricas.pedidosPendentes} pedido(s) de alteração/extra pendente(s)!`}
              </h3>
            </div>
          </div>
          <Link
            href={`/${lang}/admin/reservas`}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-md font-black text-xs uppercase tracking-widest no-underline"
          >
            {isEn ? "Review Requests" : "Analisar Pedidos"} &rarr;
          </Link>
        </div>
      )}

      {/* GRELHA PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                🎫 {isEn ? "Bookings" : "Inscrições"}
              </span>
              <span className="text-3xl font-black text-[#167524] block">
                {metricas.totalReservas}
              </span>
            </div>

            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                💶 {isEn ? "Gross Sales" : "Volume Bruto"}
              </span>
              <span className="text-3xl font-black text-slate-900 block">
                {metricas.receitaBruta.toFixed(0)}€
              </span>
            </div>

            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                🏕️ {isEn ? "Programs" : "Programas Ativos"}
              </span>
              <span className="text-3xl font-black text-slate-900 block">
                {metricas.camposAtivos}
              </span>
            </div>

            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                ❤️ {isEn ? "Wishlists" : "Favoritos"}
              </span>
              <span className="text-3xl font-black text-slate-900 block">
                {metricas.vezesGuardado}
              </span>
            </div>

            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                ⭐ {isEn ? "Rating" : "Avaliação"}
              </span>
              <span className="text-3xl font-black text-slate-900 block">
                {metricas.mediaEstrelas > 0
                  ? metricas.mediaEstrelas.toFixed(1)
                  : "-"}
              </span>
            </div>

            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                💬 Inbox
              </span>
              <span className="text-3xl font-black text-slate-900 block">
                {metricas.mensagensNaoLidas}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href={`/${lang}/admin/reservas`}
              className="bg-white hover:border-[#167524] p-5 rounded-md border border-slate-200 shadow-sm no-underline flex items-center justify-between"
            >
              <span className="text-sm font-black text-slate-900">
                📋 {isEn ? "Bookings & Health Forms" : "Reservas e Fichas Médicas"}
              </span>
              <span className="text-[#167524] font-black">&rarr;</span>
            </Link>

            <Link
              href={`/${lang}/admin/faturacao`}
              className="bg-white hover:border-[#167524] p-5 rounded-md border border-slate-200 shadow-sm no-underline flex items-center justify-between"
            >
              <span className="text-sm font-black text-slate-900">
                💰 {isEn ? "Billing & Stripe" : "Finanças e Faturação"}
              </span>
              <span className="text-[#167524] font-black">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* MOTOR DE OTIMIZAÇÃO */}
        <div className="lg:col-span-5 bg-white p-6 rounded-md border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 m-0 uppercase tracking-widest">
              {isEn ? "Optimization Engine" : "Motor de Otimização"}
            </h2>
            <span className="px-2.5 py-0.5 rounded-sm text-xs font-black bg-slate-100 text-slate-700">
              {sugestoes.length}
            </span>
          </div>

          {sugestoes.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-md border border-dashed border-slate-300">
              <span className="text-4xl block mb-2">🏆</span>
              <h3 className="m-0 text-sm font-black text-slate-900">
                {isEn ? "All set!" : "Tudo 100% otimizado!"}
              </h3>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sugestoes.map((sug, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-md border border-slate-200 bg-slate-50 flex gap-3 items-start"
                >
                  <div className="text-xl">{sug.icon}</div>
                  <div className="flex-1">
                    <h4 className="m-0 mb-1 text-xs font-black text-slate-900 uppercase">
                      {sug.titulo}
                    </h4>
                    <p className="m-0 mb-2 text-xs text-slate-600">
                      {sug.texto}
                    </p>
                    {sug.openBrandModal ? (
                      <button
                        type="button"
                        onClick={() => setShowBrandModal(true)}
                        className="text-xs font-black text-[#167524] underline cursor-pointer bg-transparent border-0 p-0"
                      >
                        {sug.actionText} &rarr;
                      </button>
                    ) : (
                      <Link
                        href={sug.link}
                        className="text-xs font-black text-[#167524] underline"
                      >
                        {sug.actionText} &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL DE CONFIGURAÇÃO DO LOGÓTIPO E DESCRIÇÃO DA PÁGINA DO PARCEIRO   */}
      {/* ===================================================================== */}
      {showBrandModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowBrandModal(false)}
        >
          <div
            className="bg-white rounded-md max-w-2xl w-full p-6 md:p-8 border border-slate-300 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900 m-0">
                  🏢{" "}
                  {isEn
                    ? "Public Organizer Profile & Logo"
                    : "Configurar Logótipo e Montra Pública"}
                </h2>
                <p className="text-xs text-slate-500 m-0 mt-1">
                  {isEn
                    ? "This information is displayed on your public organizer page and camp listings."
                    : "Estes dados aparecem na sua página pública de organizador e junto aos seus campos."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBrandModal(false)}
                className="w-8 h-8 rounded-sm bg-slate-100 font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBrandProfile} className="space-y-5">
              {/* UPLOAD DO LOGÓTIPO */}
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 p-4 rounded-md border border-slate-200">
                <div className="w-24 h-24 bg-white border border-slate-300 rounded-md flex items-center justify-center overflow-hidden p-2 flex-shrink-0">
                  {brandForm.logotipo_url ? (
                    <img
                      src={brandForm.logotipo_url}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-2xl">🏢</span>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <label className="block text-xs font-black uppercase text-slate-800 mb-1">
                    {isEn ? "Company Logo" : "Logótipo da Organização"}
                  </label>
                  <p className="text-xs text-slate-500 m-0 mb-3">
                    {isEn
                      ? "PNG or JPG format. Displayed on your public page and camp cards."
                      : "Formato PNG ou JPG. Exibido na sua página pública e na ficha de todos os seus campos."}
                  </p>
                  <label className="inline-block bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-md cursor-pointer">
                    {uploadingLogo
                      ? isEn
                        ? "Uploading..."
                        : "A carregar..."
                      : isEn
                      ? "Upload New Logo"
                      : "Carregar Logótipo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogo}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {isEn
                      ? "Public Organization Name *"
                      : "Nome Público da Organização *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={brandForm.empresa_nome}
                    onChange={(e) =>
                      setBrandForm({
                        ...brandForm,
                        empresa_nome: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {isEn ? "Founded Year (Optional)" : "Ano de Fundação (Opcional)"}
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2015"
                    value={brandForm.ano_fundacao}
                    onChange={(e) =>
                      setBrandForm({
                        ...brandForm,
                        ano_fundacao: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Website (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={brandForm.website}
                    onChange={(e) =>
                      setBrandForm({ ...brandForm, website: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    {isEn ? "Public Phone" : "Telefone de Contacto"}
                  </label>
                  <input
                    type="text"
                    value={brandForm.telefone}
                    onChange={(e) =>
                      setBrandForm({ ...brandForm, telefone: e.target.value })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  {isEn
                    ? "About the Organization / Manifesto (Auto-translated to EN)"
                    : "Sobre a Organização / Apresentação aos Pais (Traduzido automaticamente para Inglês)"}
                </label>
                <textarea
                  rows={5}
                  value={brandForm.biografia_empresa}
                  onChange={(e) =>
                    setBrandForm({
                      ...brandForm,
                      biografia_empresa: e.target.value,
                    })
                  }
                  placeholder={
                    isEn
                      ? "Tell parents about your history, values, accredited monitors, and experience..."
                      : "Apresente a história da sua organização, missão, experiência da equipa e o que torna os vossos programas especiais..."
                  }
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-md text-sm font-medium leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  className="px-5 py-2.5 rounded-md border border-slate-300 bg-white text-xs font-bold cursor-pointer"
                >
                  {isEn ? "Cancel" : "Cancelar"}
                </button>
                <button
                  type="submit"
                  disabled={savingBrand}
                  className="bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs px-6 py-2.5 rounded-md cursor-pointer shadow-sm"
                >
                  {savingBrand
                    ? isEn
                      ? "Saving..."
                      : "A guardar..."
                    : isEn
                    ? "✓ Save Brand Profile"
                    : "✓ Guardar Logótipo e Apresentação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
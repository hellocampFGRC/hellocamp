"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";

export default function AdminDashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [nomeEmpresa, setNomeEmpresa] = useState<string>("");
  const [perfilCompleto, setPerfilCompleto] = useState<any>(null);
  const [contratoPdfUrl, setContratoPdfUrl] = useState<string | null>(null);
  const [downloadingContractPdf, setDownloadingContractPdf] = useState(false);

  // Estados para Configurar Montra Pública & Logótipo
  const [showPublicProfilePanel, setShowPublicProfilePanel] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [profileForm, setProfileForm] = useState({
    empresa_nome: "",
    logotipo_url: "",
    ano_fundacao: "",
    website: "",
    email_publico: "",
    telefone_publico: "",
    morada_sede: "",
    descricao: "",
    descricao_en: "",
  });

  const [metricas, setMetricas] = useState({
    totalReservas: 0,
    vezesGuardado: 0,
    camposAtivos: 0,
    camposPendentes: 0,
    mediaEstrelas: 0,
    pedidosPendentes: 0,
  });

  const [sugestoes, setSugestoes] = useState<any[]>([]);

  useEffect(() => {
    const fetchMarketingData = async () => {
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

      // 1. Busca Perfil Completo
      const { data: perfil } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (perfil) {
        setPerfilCompleto(perfil);
        const empName =
          perfil.empresa_nome ||
          perfil.nome_empresa ||
          perfil.nome ||
          perfil.nome_completo ||
          (isEn ? "Organizer" : "Organizador");
        setNomeEmpresa(empName);

        setProfileForm({
          empresa_nome: empName,
          logotipo_url: perfil.logotipo_url || "",
          ano_fundacao: perfil.ano_fundacao
            ? String(Math.trunc(Number(perfil.ano_fundacao)))
            : "",
          website: perfil.website || "",
          email_publico: perfil.email_publico || perfil.email || "",
          telefone_publico: perfil.telefone_publico || perfil.telefone || "",
          morada_sede: perfil.morada_sede || "",
          descricao:
            perfil.descricao ||
            perfil.biografia_empresa ||
            perfil.biografia ||
            "",
          descricao_en:
            perfil.descricao_en ||
            perfil.biografia_empresa_en ||
            perfil.biografia_en ||
            "",
        });
      }

      // 2. Busca Campos do Parceiro
      const { data: campos } = await supabase
        .from("campos")
        .select(
          "id, nome, status_aprovacao, ativo, rating_score, total_reviews, galeria, programas_pdf, contrato_parceiro_url"
        )
        .eq("organizador_id", uid);

      const camposIds = campos?.map((c: any) => c.id) || [];

      const campoComPdf = (campos || []).find(
        (c: any) =>
          c.contrato_parceiro_url &&
          String(c.contrato_parceiro_url).startsWith("http")
      );
      if (campoComPdf?.contrato_parceiro_url) {
        setContratoPdfUrl(campoComPdf.contrato_parceiro_url);
      }

      let ativos = 0;
      let pendentes = 0;
      let somaEstrelas = 0;
      let totalComReviews = 0;
      const novasSugestoes: any[] = [];

      const temContratoAssinado = Boolean(
        perfil?.status_contrato === "Aprovado" ||
          perfil?.contrato_dados?.assinaturaNome
      );

      // ALERTA: CONTRATO GLOBAL EM FALTA OU PENDENTE
      if (!temContratoAssinado) {
        novasSugestoes.push({
          tipo: "critical",
          icon: "📝",
          titulo: isEn ? "Global Contract Missing" : "Contrato Global em Falta",
          texto: isEn
            ? "You must sign the Global Partnership Agreement to publish your camps and receive bookings."
            : "Precisa de assinar o Contrato Global de Parceria para ativar e publicar os seus campos na plataforma.",
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
            ? "Your Global Contract is being reviewed by our team."
            : "O seu Contrato Global foi submetido e encontra-se em validação.",
          link: `/${lang}/admin/contrato`,
          actionText: isEn ? "View Contract" : "Ver Contrato",
        });
      }

      // ALERTA: STRIPE NÃO CONECTADO
      if (!perfil?.stripe_account_id) {
        novasSugestoes.push({
          tipo: "critical",
          icon: "🚨",
          titulo: isEn
            ? "Bank Account Not Connected"
            : "Conta Bancária Não Conectada",
          texto: isEn
            ? "Connect your bank account / IBAN in Finance to receive payouts from bookings."
            : "Configure o seu IBAN ou conta Stripe em Finanças para receber as transferências das inscrições.",
          link: `/${lang}/admin/faturacao`,
          actionText: isEn ? "Configure Finance" : "Configurar Conta Agora",
        });
      }

      campos?.forEach((c: any) => {
        const status = (c.status_aprovacao || "").toLowerCase();
        if (
          c.ativo === true ||
          status === "aprovado" ||
          status === "validado" ||
          status === "ativo"
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
              : `Os pais decidem pelas imagens! Adicione fotografias à galeria do campo "${c.nome}".`,
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
              : `Anexe um PDF com o horário/programa no campo "${c.nome}" para aumentar a confiança dos pais.`,
            link: `/${lang}/admin/campos/editar/${c.id}`,
            actionText: isEn ? "Attach PDF" : "Anexar PDF",
          });
        }
      });

      // 3. Busca de Reservas
      const { data: reservasDados } = await supabase
        .from("reservas")
        .select("status_pagamento, respostas_customizadas")
        .eq("organizador_id", uid);

      let countReservas = 0;
      let countPedidosUpsell = 0;

      reservasDados?.forEach((res: any) => {
        if (
          res.status_pagamento === "Pago" ||
          res.status_pagamento === "Sinal Pago"
        ) {
          countReservas++;
        }
        if (
          res.respostas_customizadas &&
          res.respostas_customizadas.pedido_pai_pendente
        ) {
          countPedidosUpsell++;
        }
      });

      // 4. Busca Wishlists
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
        vezesGuardado: vezesGuardadoTotal,
        camposAtivos: ativos,
        camposPendentes: pendentes,
        mediaEstrelas:
          totalComReviews > 0 ? somaEstrelas / totalComReviews : 0,
        pedidosPendentes: countPedidosUpsell,
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
  }, [lang, isEn, router]);

  // Upload do Logótipo da Empresa
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `logo_${userId}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("campos-imagens")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("campos-imagens")
        .getPublicUrl(fileName);

      if (publicUrlData?.publicUrl) {
        setProfileForm((prev) => ({
          ...prev,
          logotipo_url: publicUrlData.publicUrl,
        }));
      }
    } catch (err: any) {
      alert("Erro ao carregar logótipo: " + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Guardar Montra Pública
  const handleGuardarMontraPublica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSavingProfile(true);

    try {
      const { error } = await supabase
        .from("perfis")
        .update({
          empresa_nome: profileForm.empresa_nome,
          nome_empresa: profileForm.empresa_nome,
          nome: profileForm.empresa_nome,
          logotipo_url: profileForm.logotipo_url || null,
          ano_fundacao: profileForm.ano_fundacao
            ? Number(profileForm.ano_fundacao)
            : null,
          website: profileForm.website || null,
          email_publico: profileForm.email_publico || null,
          telefone_publico: profileForm.telefone_publico || null,
          morada_sede: profileForm.morada_sede || null,
          descricao: profileForm.descricao || null,
          biografia_empresa: profileForm.descricao || null,
          biografia: profileForm.descricao || null,
          descricao_en: profileForm.descricao_en || profileForm.descricao || null,
          biografia_empresa_en:
            profileForm.descricao_en || profileForm.descricao || null,
          biografia_en:
            profileForm.descricao_en || profileForm.descricao || null,
        })
        .eq("id", userId);

      if (error) throw error;

      setNomeEmpresa(profileForm.empresa_nome);
      alert(
        isEn
          ? "Public profile and logo updated successfully!"
          : "Montra pública e logótipo atualizados com sucesso!"
      );
      setShowPublicProfilePanel(false);
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

 // Gerar e Descarregar o Contrato Global Completo em PDF diretamente do Dashboard!
  const handleDescarregarContratoPdfDireto = () => {
    setDownloadingContractPdf(true);
    try {
      const cd = perfilCompleto?.contrato_dados || {};
      const taxaComissao = perfilCompleto?.taxa_comissao ?? cd.taxaComissao ?? 12;
      const baseComissao =
        perfilCompleto?.base_comissao || cd.baseComissao || "total";
      const dataIso =
        cd.dataSubmissao ||
        perfilCompleto?.created_at ||
        new Date().toISOString();
      const ipAssinatura = cd.ipAssinatura || "Registado no Servidor";

      const doc = new jsPDF({ format: "a4", unit: "mm" });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 36, "F");
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 36, pageWidth, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text("HelloCamp Portugal", 16, 16);
      doc.setFontSize(11);
      doc.setTextColor(245, 158, 11);
      doc.text(
        isEn
          ? "GLOBAL B2B PARTNERSHIP & INTERMEDIATION AGREEMENT"
          : "CONTRATO GLOBAL DE PARCERIA E INTERMEDIACAO B2B",
        16,
        25
      );

      let y = 48;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(
        isEn ? "1. CONTRACTING PARTIES" : "1. PARTES CONTRATANTES",
        16,
        y
      );
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const textoPartes = [
        `Primeira Outorgante: HelloCamp Portugal (www.hellocamp.pt | info@hellocamp.pt)`,
        `Segunda Outorgante (Parceiro): ${
          cd.empresaNome || nomeEmpresa
        } (NIF: ${cd.nif || perfilCompleto?.nif_empresa || "N/A"})`,
        `Morada Sede: ${cd.morada || perfilCompleto?.morada_sede || "N/A"} ${
          cd.codigoPostal || ""
        }`,
        `Representante / Contacto: ${
          cd.pessoaContacto || perfilCompleto?.nome_completo || nomeEmpresa
        } | E-mail: ${cd.emailContacto || perfilCompleto?.email || ""}`,
      ];
      textoPartes.forEach((line) => {
        doc.text(line, 16, y);
        y += 5.5;
      });

      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(
        isEn
          ? "2. COMMERCIAL & OPERATIONAL TERMS"
          : "2. CONDICOES COMERCIAIS E OPERACIONAIS",
        16,
        y
      );
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(
        `• Taxa de Comissao Acordada: ${taxaComissao}% (IVA incluido) | Base: ${baseComissao}`,
        16,
        y
      );
      y += 5.5;
      doc.text(
        `• Modalidade de Reserva: ${
          cd.modalidadeReserva || perfilCompleto?.modalidade_reserva || "direta"
        }`,
        16,
        y
      );
      y += 5.5;
      doc.text(
        `• Politica de Cancelamento: ${
          cd.politicaCancelamento ||
          "Moderada (Reembolso a 50% ate 15 dias antes)"
        }`,
        16,
        y
      );
      y += 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(
        isEn
          ? "3. DIGITAL SIGNATURES & CERTIFICATION"
          : "3. ASSINATURAS DIGITAIS VINCULATIVAS",
        16,
        y
      );
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(
        `Pela HelloCamp Portugal: Administracao HelloCamp Portugal (Validado HQ)`,
        16,
        y
      );
      y += 6;
      doc.text(
        `Pelo Parceiro Organizador: ${
          cd.assinaturaNome || perfilCompleto?.nome_completo || nomeEmpresa
        } (${cd.assinaturaCargo || "Representante Legal"})`,
        16,
        y
      );
      y += 6;
      doc.text(
        `Data de Assinatura: ${new Date(dataIso).toLocaleString(
          "pt-PT"
        )} | IP: ${ipAssinatura}`,
        16,
        y
      );

      doc.save(
        `Contrato_Global_HelloCamp_${(nomeEmpresa || "Parceiro").replace(
          /\s+/g,
          "_"
        )}.pdf`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingContractPdf(false);
    }
  };

  const temContrato = Boolean(
    perfilCompleto?.status_contrato === "Aprovado" ||
      perfilCompleto?.contrato_dados?.assinaturaNome ||
      contratoPdfUrl
  );

  if (loading) {
    return (
      <div className="p-12 text-center font-black text-xs uppercase tracking-widest text-slate-400 animate-pulse">
        {isEn ? "Loading Partner Dashboard..." : "A carregar o seu Painel..."}
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto font-sans text-[#0F172A] pb-20">
      {/* CABEÇALHO DO DASHBOARD */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
              {isEn ? "Partner Portal" : "Portal do Organizador"}
            </span>
            {temContrato ? (
              <span className="bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                ✓ {isEn ? "Contract Active" : "Contrato Global Ativo"}
              </span>
            ) : (
              <span className="bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                ⏳ {isEn ? "Contract Pending" : "Contrato Pendente"}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-[#0F172A] tracking-tight m-0">
            {isEn ? `Welcome, ${nomeEmpresa}` : `Olá, ${nomeEmpresa}`}
          </h1>
          <p className="text-slate-500 mt-1.5 mb-0 text-sm font-medium">
            {isEn
              ? "Manage your programs, public brand profile, bookings, and global contract."
              : "Gira os seus programas, montra pública da organização, inscrições e contrato global."}
          </p>
        </div>

        {/* BOTÕES DE AÇÃO NO TOPO (INCLUINDO VER CONTRATO / PDF QUANDO TEM CONTRATO!) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPublicProfilePanel(!showPublicProfilePanel)}
            className="bg-[#2563EB] hover:bg-blue-700 text-white px-4 py-3 rounded-md font-black text-xs uppercase tracking-widest cursor-pointer border-0 transition-colors shadow-sm"
          >
            🏢 {isEn ? "Public Profile & Logo" : "Montra & Logótipo"}
          </button>

          <Link
            href={`/${lang}/admin/contrato`}
            className="bg-[#F59E0B] hover:bg-amber-600 text-white px-4 py-3 rounded-md font-black text-xs uppercase tracking-widest no-underline transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>📝</span>
            <span>
              {temContrato
                ? isEn
                  ? "View Global Contract"
                  : "Ver Contrato Global"
                : isEn
                ? "Sign Global Contract"
                : "Assinar Contrato"}
            </span>
          </Link>

          {temContrato && (
            <button
              type="button"
              onClick={handleDescarregarContratoPdfDireto}
              disabled={downloadingContractPdf}
              className="bg-[#0F172A] hover:bg-slate-800 text-white px-4 py-3 rounded-md font-black text-xs uppercase tracking-widest cursor-pointer border-0 transition-colors shadow-sm flex items-center gap-1.5"
              title={
                isEn
                  ? "Download Signed Global Contract PDF"
                  : "Descarregar Contrato Global Assinado em PDF"
              }
            >
              <span>📥</span>
              <span>
                {downloadingContractPdf
                  ? "..."
                  : isEn
                  ? "Contract PDF"
                  : "Contrato PDF"}
              </span>
            </button>
          )}

          <Link
            href={`/${lang}/admin/campos/novo`}
            className="bg-[#16A34A] hover:bg-green-700 text-white px-5 py-3 rounded-md font-black text-xs uppercase tracking-widest no-underline transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>+</span>
            <span>{isEn ? "Create Camp" : "Novo Campo"}</span>
          </Link>
        </div>
      </div>

      {/* PAINEL EXPANSÍVEL: CONFIGURAR MONTRA PÚBLICA & LOGÓTIPO */}
      {showPublicProfilePanel && (
        <section className="mb-8 bg-white p-6 md:p-8 rounded-md border-2 border-[#2563EB] shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
            <div>
              <span className="inline-block bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-1.5">
                {isEn ? "Public Brand Showcase" : "Montra Pública da Marca"}
              </span>
              <h2 className="text-xl font-black text-[#0F172A] m-0">
                {isEn
                  ? "Configure Official Logo, Biography & Public Contacts"
                  : "Configurar Logótipo Oficial, Biografia e Contactos Públicos"}
              </h2>
            </div>

            {userId && (
              <Link
                href={`/${lang}/parceiro/${userId}?preview=admin`}
                target="_blank"
                className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-md no-underline shrink-0"
              >
                👁️ {isEn ? "Preview Public Page ↗" : "Ver Página Pública ↗"}
              </Link>
            )}
          </div>

          <form onSubmit={handleGuardarMontraPublica} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* UPLOAD DO LOGÓTIPO */}
              <div className="md:col-span-4 bg-[#F8FAFC] p-5 rounded-md border border-slate-200 text-center">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                  {isEn ? "Official Organization Logo" : "Logótipo Oficial"}
                </label>
                <div className="w-28 h-28 mx-auto bg-white border border-slate-300 rounded-md flex items-center justify-center p-2 mb-4 overflow-hidden">
                  {profileForm.logotipo_url ? (
                    <img
                      src={profileForm.logotipo_url}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-3xl">🏢</span>
                  )}
                </div>

                <label className="inline-block bg-[#2563EB] hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-md cursor-pointer">
                  {uploadingLogo
                    ? isEn
                      ? "Uploading..."
                      : "A carregar..."
                    : isEn
                    ? "📤 Upload Logo"
                    : "📤 Carregar Imagem"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                <div className="mt-3">
                  <input
                    type="url"
                    value={profileForm.logotipo_url}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        logotipo_url: e.target.value,
                      })
                    }
                    placeholder="Ou cole o URL direto do logótipo..."
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] outline-none"
                  />
                </div>
              </div>

              {/* DADOS PÚBLICOS E BIOGRAFIA */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    {isEn ? "Organization Name *" : "Nome Público da Organização *"}
                  </label>
                  <input
                    required
                    value={profileForm.empresa_nome}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        empresa_nome: e.target.value,
                      })
                    }
                    className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-sm font-bold text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    {isEn ? "Founded Year" : "Ano de Fundação"}
                  </label>
                  <input
                    type="number"
                    value={profileForm.ano_fundacao}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        ano_fundacao: e.target.value,
                      })
                    }
                    placeholder="Ex: 1998"
                    className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-sm font-bold text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    {isEn ? "Public Email" : "E-mail Público"}
                  </label>
                  <input
                    type="email"
                    value={profileForm.email_publico}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        email_publico: e.target.value,
                      })
                    }
                    className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-sm font-bold text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    {isEn ? "Public Phone" : "Telefone Público"}
                  </label>
                  <input
                    value={profileForm.telefone_publico}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        telefone_publico: e.target.value,
                      })
                    }
                    className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-sm font-bold text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Website
                  </label>
                  <input
                    value={profileForm.website}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        website: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-sm font-bold text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    {isEn ? "Headquarters / Location" : "Localização / Sede"}
                  </label>
                  <input
                    value={profileForm.morada_sede}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        morada_sede: e.target.value,
                      })
                    }
                    className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-sm font-bold text-[#0F172A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    {isEn
                      ? "Biography / Description (Portuguese)"
                      : "Biografia / Apresentação da Organização (Português)"}
                  </label>
                  <textarea
                    rows={3}
                    value={profileForm.descricao}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        descricao: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    {isEn
                      ? "Biography / Description (English)"
                      : "Biografia / Apresentação da Organização (Inglês)"}
                  </label>
                  <textarea
                    rows={3}
                    value={profileForm.descricao_en}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        descricao_en: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowPublicProfilePanel(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-md cursor-pointer border-0"
              >
                {isEn ? "Close" : "Fechar"}
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-md cursor-pointer border-0 shadow-sm"
              >
                {savingProfile
                  ? isEn
                    ? "Saving..."
                    : "A guardar..."
                  : isEn
                  ? "✓ Save Public Showcase"
                  : "✓ Guardar Montra Pública"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* CARTÃO DE ACESSO DIRETO AO CONTRATO GLOBAL E PDF (QUANDO O PARCEIRO TEM CONTRATO!) */}
      {temContrato && (
        <div className="mb-8 bg-[#0F172A] text-white p-6 rounded-md border-l-4 border-[#16A34A] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#16A34A] text-white rounded-md flex items-center justify-center text-2xl font-black shrink-0">
              📄
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#16A34A] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md">
                  {isEn ? "Signed & Verified" : "Assinado & Validado"}
                </span>
                <span className="text-xs font-bold text-slate-300">
                  •{" "}
                  {perfilCompleto?.taxa_comissao ?? 12}%{" "}
                  {isEn ? "Agreed Commission" : "Comissão Acordada"}
                </span>
              </div>
              <h3 className="text-base md:text-lg font-black text-white m-0">
                {isEn
                  ? "Global B2B Partnership Agreement"
                  : "Contrato Global de Parceria e Intermediação B2B"}
              </h3>
              <p className="text-xs text-slate-300 mt-1 mb-0">
                {isEn
                  ? "Your global agreement covers all your programs on HelloCamp. You can view the clauses or download the official PDF at any time."
                  : "O seu acordo global abrange todos os seus campos na HelloCamp. Pode consultar o documento ou descarregar o PDF oficial a qualquer momento."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href={`/${lang}/admin/contrato`}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-4 py-3 rounded-md no-underline transition-colors"
            >
              👁️ {isEn ? "View Contract" : "Ver Contrato"}
            </Link>
            <button
              type="button"
              onClick={handleDescarregarContratoPdfDireto}
              disabled={downloadingContractPdf}
              className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-md cursor-pointer border-0 transition-colors"
            >
              📥{" "}
              {downloadingContractPdf
                ? "..."
                : isEn
                ? "Download PDF"
                : "Descarregar PDF"}
            </button>
          </div>
        </div>
      )}

      {/* ALERTA DE PEDIDOS DE ALTERAÇÃO DE PAIS */}
      {metricas.pedidosPendentes > 0 && (
        <div className="bg-amber-50 border-2 border-[#F59E0B] p-6 rounded-md mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-3xl">📬</span>
            <div>
              <h3 className="m-0 text-base font-black text-[#0F172A]">
                {isEn
                  ? `You have ${metricas.pedidosPendentes} pending parent change request(s)!`
                  : `Tem ${metricas.pedidosPendentes} pedido(s) de alteração pendente(s)!`}
              </h3>
              <p className="m-0 mt-1 text-xs font-bold text-slate-600">
                {isEn
                  ? "Parents are waiting for your approval to add extras or adjust bookings."
                  : "Os encarregados de educação solicitaram alterações ou novos extras nas reservas."}
              </p>
            </div>
          </div>
          <Link
            href={`/${lang}/admin/reservas`}
            className="bg-[#F59E0B] hover:bg-amber-600 text-white px-5 py-3 rounded-md font-black text-xs uppercase tracking-widest no-underline shrink-0"
          >
            {isEn ? "Review Requests →" : "Analisar Pedidos →"}
          </Link>
        </div>
      )}

      {/* GRELHA PRINCIPAL: TRAÇÃO & MOTOR DE OTIMIZAÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUNA ESQUERDA: MÉTRICAS E ATALHOS */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#0F172A] m-0">
            {isEn ? "Traction & Performance" : "Tração & Desempenho"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 bg-[#16A34A] text-white rounded-md flex items-center justify-center text-lg font-black">
                  🎫
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isEn ? "Bookings" : "Inscrições"}
                </span>
              </div>
              <span className="text-3xl font-black text-[#16A34A] block">
                {metricas.totalReservas}
              </span>
              <p className="text-[11px] font-bold text-slate-500 mt-1 mb-0">
                {isEn ? "Confirmed registrations" : "Inscrições confirmadas"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 bg-[#F43F5E] text-white rounded-md flex items-center justify-center text-lg font-black">
                  ❤️
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isEn ? "Wishlists" : "Favoritos"}
                </span>
              </div>
              <span className="text-3xl font-black text-[#0F172A] block">
                {metricas.vezesGuardado}
              </span>
              <p className="text-[11px] font-bold text-slate-500 mt-1 mb-0">
                {isEn ? "Saved by families" : "Guardado por famílias"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="w-10 h-10 bg-[#F59E0B] text-white rounded-md flex items-center justify-center text-lg font-black">
                  ⭐
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {isEn ? "Rating" : "Avaliação"}
                </span>
              </div>
              <span className="text-3xl font-black text-[#0F172A] block">
                {metricas.mediaEstrelas > 0
                  ? metricas.mediaEstrelas.toFixed(1)
                  : "—"}
              </span>
              <p className="text-[11px] font-bold text-slate-500 mt-1 mb-0">
                {isEn ? "Global score" : "Média global de avaliações"}
              </p>
            </div>
          </div>

          {/* ATALHOS RÁPIDOS COM BOTÕES COLORIDOS E TEXTO BRANCO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href={`/${lang}/admin/campos`}
              className="bg-[#2563EB] hover:bg-blue-700 text-white p-5 rounded-md no-underline transition-colors shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-100 block mb-1">
                  {metricas.camposAtivos}{" "}
                  {isEn ? "Active" : "Ativos"} • {metricas.camposPendentes}{" "}
                  {isEn ? "Pending" : "Pendentes"}
                </span>
                <span className="text-base font-black block">
                  🏕️ {isEn ? "Manage My Camps" : "Gerir Os Meus Campos"}
                </span>
              </div>
              <span className="text-xl font-black">&rarr;</span>
            </Link>

            <Link
              href={`/${lang}/admin/reservas`}
              className="bg-[#16A34A] hover:bg-green-700 text-white p-5 rounded-md no-underline transition-colors shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100 block mb-1">
                  {isEn ? "Attendance & Health" : "Listas & Fichas Médicas"}
                </span>
                <span className="text-base font-black block">
                  📋 {isEn ? "Manage Logistics" : "Inscrições & Logística"}
                </span>
              </div>
              <span className="text-xl font-black">&rarr;</span>
            </Link>

            <Link
              href={`/${lang}/admin/faturacao`}
              className="bg-[#0F172A] hover:bg-slate-800 text-white p-5 rounded-md no-underline transition-colors shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 block mb-1">
                  {isEn ? "Payouts & IBAN" : "Pagamentos & IBAN"}
                </span>
                <span className="text-base font-black block">
                  💰 {isEn ? "Finance & Billing" : "Finanças e Faturação"}
                </span>
              </div>
              <span className="text-xl font-black">&rarr;</span>
            </Link>

            <Link
              href={`/${lang}/admin/inbox`}
              className="bg-[#F59E0B] hover:bg-amber-600 text-white p-5 rounded-md no-underline transition-colors shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-100 block mb-1">
                  {isEn ? "Direct Chat" : "Chat com Encarregados"}
                </span>
                <span className="text-base font-black block">
                  💬 {isEn ? "Parent Messages" : "Caixa de Mensagens"}
                </span>
              </div>
              <span className="text-xl font-black">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* COLUNA DIREITA: MOTOR DE OTIMIZAÇÃO */}
        <div className="lg:col-span-5 bg-white p-6 rounded-md border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#0F172A] m-0">
              {isEn ? "Optimization Engine" : "Motor de Otimização"}
            </h2>
            <span
              className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest text-white ${
                sugestoes.length > 0 ? "bg-[#F43F5E]" : "bg-[#16A34A]"
              }`}
            >
              {sugestoes.length} {isEn ? "Tasks" : "Avisos"}
            </span>
          </div>

          {sugestoes.length === 0 ? (
            <div className="text-center py-10 px-4 bg-[#F8FAFC] rounded-md border border-dashed border-slate-300">
              <span className="text-4xl block mb-3">🏆</span>
              <h3 className="text-base font-black text-[#0F172A] m-0 mb-1">
                {isEn ? "All set!" : "Tudo otimizado!"}
              </h3>
              <p className="text-xs font-bold text-slate-500 m-0">
                {isEn
                  ? "Your account, contract, and camps are fully configured."
                  : "A sua conta, contrato global e campos estão 100% configurados."}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {sugestoes.map((sug, idx) => {
                let badgeBg = "bg-[#2563EB]";
                if (sug.tipo === "critical") badgeBg = "bg-[#F43F5E]";
                else if (sug.tipo === "warning") badgeBg = "bg-[#F59E0B]";

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-md bg-[#F8FAFC] border border-slate-200 flex gap-3.5 items-start"
                  >
                    <div className="text-2xl shrink-0">{sug.icon}</div>
                    <div className="flex-1">
                      <h4 className="m-0 mb-1 text-xs font-black uppercase tracking-wider text-[#0F172A]">
                        {sug.titulo}
                      </h4>
                      <p className="m-0 mb-3 text-xs text-slate-600 leading-relaxed font-medium">
                        {sug.texto}
                      </p>
                      <Link
                        href={sug.link}
                        className={`inline-block ${badgeBg} text-white font-black text-[10px] uppercase tracking-widest px-3.5 py-2 rounded-md no-underline`}
                      >
                        {sug.actionText} &rarr;
                      </Link>
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
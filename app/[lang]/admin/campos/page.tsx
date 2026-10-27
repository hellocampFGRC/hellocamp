"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import jsPDF from "jspdf";

export default function MeusCampos({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = React.use(params);
  const isEn = lang === "en";

  const [campos, setCampos] = useState<any[]>([]);
  const [perfilBase, setPerfilBase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");

  // Estado para abrir o Modal de Visualização do Contrato Completo
  const [contratoModalCampo, setContratoModalCampo] = useState<any | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchMeusCampos = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const uid = session.user.id;

    const [{ data: perfil }, { data: camposData }] = await Promise.all([
      supabase.from("perfis").select("*").eq("id", uid).single(),
      supabase
        .from("campos")
        .select("*")
        .eq("organizador_id", uid)
        .order("created_at", { ascending: false }),
    ]);

    setPerfilBase(perfil || null);
    setCampos(camposData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMeusCampos();
  }, []);

  // ============================================================================
  // DUPLICAR CAMPO COM 1 CLIQUE
  // ============================================================================
  const handleDuplicarCampo = async (campoOrig: any) => {
    const confirmar = window.confirm(
      isEn
        ? `Duplicate "${campoOrig.nome}"? A new copy will be created so you can adjust dates or ages.`
        : `Deseja duplicar o campo "${campoOrig.nome}"? Será criada uma cópia pronta a editar.`
    );
    if (!confirmar) return;

    setDuplicatingId(campoOrig.id);
    try {
      const {
        id,
        created_at,
        rating_score,
        total_reviews,
        ...restoDados
      } = campoOrig;

      const copiaPayload = {
        ...restoDados,
        nome: `${campoOrig.nome} (Cópia)`,
        nome_en: campoOrig.nome_en ? `${campoOrig.nome_en} (Copy)` : null,
        rating_score: 0,
        total_reviews: 0,
      };

      const { error } = await supabase.from("campos").insert([copiaPayload]);
      if (error) throw error;

      await fetchMeusCampos();
    } catch (err: any) {
      alert(
        (isEn ? "Error duplicating camp: " : "Erro ao duplicar campo: ") +
          err.message
      );
    } finally {
      setDuplicatingId(null);
    }
  };

  // ============================================================================
  // PAUSAR / REATIVAR CAMPO NAS PESQUISAS
  // ============================================================================
  const handleToggleAtivo = async (campo: any) => {
    setTogglingId(campo.id);
    try {
      const novoEstado = !campo.ativo;
      const { error } = await supabase
        .from("campos")
        .update({ ativo: novoEstado })
        .eq("id", campo.id);
      if (error) throw error;

      setCampos((prev) =>
        prev.map((c) => (c.id === campo.id ? { ...c, ativo: novoEstado } : c))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  // ============================================================================
  // GERADOR DE PDF CORPORATIVO OFICIAL (IGUAL AO DA PÁGINA DE ASSINATURA)
  // ============================================================================
  const handleDownloadPDF = (campo: any) => {
    setDownloadingPdf(true);
    try {
      const dados = campo.contrato_dados || perfilBase?.contrato_dados || {};
      const taxaComissao =
        campo.taxa_comissao !== null && campo.taxa_comissao !== undefined
          ? campo.taxa_comissao
          : dados.taxaComissao || perfilBase?.taxa_comissao || 12;
      const baseComissao =
        dados.baseComissao ||
        campo.base_comissao ||
        perfilBase?.base_comissao ||
        "total";
      const modalidadeReserva =
        dados.modalidadeReserva || campo.modalidade_reserva || "direta";
      const linkExternoReserva =
        dados.linkExternoReserva || campo.link_externo_reserva || "";
      const tipoPagamento =
        dados.tipoPagamento || campo.tipo_pagamento || "100_total";
      const politicaCancelamento =
        dados.politicaCancelamento ||
        campo.politica_cancelamento ||
        "Moderada (Reembolso a 50% até 15 dias antes)";

      const timestamp =
        dados.dataSubmissao || campo.created_at || new Date().toISOString();
      const dataPropostaStr =
        dados.dataEnvio ||
        perfilBase?.created_at ||
        campo.created_at ||
        timestamp;
      const userIP = dados.ipAssinatura || "Registado no Servidor";
      const isPt = !isEn;

      const doc = new jsPDF({ format: "a4", unit: "mm" });
      const pageWidth = doc.internal.pageSize.getWidth();

      const blueBrand: [number, number, number] = [14, 58, 104];
      const goldBrand: [number, number, number] = [226, 164, 29];
      const greenBrand: [number, number, number] = [5, 150, 105];
      const slateDark: [number, number, number] = [30, 41, 59];
      const slateMuted: [number, number, number] = [100, 116, 139];

      doc.setFillColor(...blueBrand);
      doc.rect(0, 0, pageWidth, 38, "F");
      doc.setFillColor(...goldBrand);
      doc.rect(0, 38, pageWidth, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("Hello", pageWidth / 2 - 9, 15, { align: "right" });
      doc.setTextColor(...goldBrand);
      doc.text("Camp", pageWidth / 2 - 9, 15, { align: "left" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(
        isPt
          ? "ACORDO GLOBAL DE INTERMEDIAÇÃO E SERVIÇOS"
          : "GLOBAL INTERMEDIATION AND SERVICES AGREEMENT",
        pageWidth / 2,
        24,
        { align: "center" }
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(191, 219, 254);
      const dataEmissaoFormatada = new Date(timestamp).toLocaleDateString(
        isPt ? "pt-PT" : "en-GB",
        { year: "numeric", month: "long", day: "numeric" }
      );
      doc.text(
        isPt
          ? `Documento Oficial • Emitido em ${dataEmissaoFormatada}`
          : `Official Document • Issued on ${dataEmissaoFormatada}`,
        pageWidth / 2,
        31,
        { align: "center" }
      );

      let y = 48;

      doc.setTextColor(...blueBrand);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        isPt
          ? "ENQUADRAMENTO E PRINCÍPIOS DO ACORDO"
          : "EXECUTIVE SUMMARY & AGREEMENT PRINCIPLES",
        15,
        y
      );
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y + 2, pageWidth - 15, y + 2);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...slateDark);
      const introPontos = isPt
        ? "1. Objeto: Estabelece os termos aplicáveis à intermediação e promoção comercial das atividades do Parceiro na plataforma HelloCamp (válido até ao final do ano civil, com renovação automática).\n2. Divulgação: A HelloCamp disponibiliza a infraestrutura tecnológica; o Parceiro garante a veracidade e titularidade legal dos conteúdos, imagens e programas.\n3. Gestão de Reservas: A plataforma atua como canal facilitador, cabendo ao Parceiro a inteira responsabilidade pela execução do serviço e segurança perante o cliente final.\n4. Condições Financeiras: A remuneração incide exclusivamente sobre o sucesso da intermediação, conforme fixado na Secção 2 deste documento."
        : "1. Object: Establishes the terms applicable to the intermediation and commercial promotion of the Partner's activities on the HelloCamp platform (valid until the end of the calendar year, automatically renewed).\n2. Promotion: HelloCamp provides the technological infrastructure; the Partner guarantees the accuracy and legal ownership of all shared content, images, and programs.\n3. Booking Management: The platform acts as a facilitating channel, with the Partner bearing full responsibility for service execution and safety towards the final customer.\n4. Financial Conditions: Remuneration is based exclusively on successful intermediation, as set out in Section 2 of this document.";
      const splitIntro = doc.splitTextToSize(introPontos, pageWidth - 30);
      doc.text(splitIntro, 15, y);
      y += splitIntro.length * 3.8 + 6;

      doc.setTextColor(...blueBrand);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        isPt
          ? "1. IDENTIFICAÇÃO DAS PARTES CONTRATANTES"
          : "1. IDENTIFICATION OF THE CONTRACTING PARTIES",
        15,
        y
      );
      doc.line(15, y + 2, pageWidth - 15, y + 2);
      y += 5;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(15, y, 86, 36, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...blueBrand);
      doc.text(
        isPt ? "PRIMEIRA OUTORGANTE (Plataforma)" : "FIRST PARTY (Platform)",
        19,
        y + 6
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...slateDark);
      doc.text("Entidade: HelloCamp Portugal", 19, y + 12);
      doc.text("Website Oficial: www.hellocamp.pt", 19, y + 17);
      doc.text("E-mail Oficial: info@hellocamp.pt", 19, y + 22);
      doc.text(
        isPt
          ? "Papel: Intermediária Tecnológica e Comercial"
          : "Role: IT & Commercial Intermediary",
        19,
        y + 27
      );
      doc.text(
        isPt
          ? "Foro e Jurisdição: Comarca de Lisboa, Portugal"
          : "Jurisdiction: District of Lisbon, Portugal",
        19,
        y + 32
      );

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(109, y, 86, 36, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...blueBrand);
      doc.text(
        isPt ? "SEGUNDA OUTORGANTE (Parceiro)" : "SECOND PARTY (Partner)",
        113,
        y + 6
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...slateDark);
      doc.text(
        `${dados.empresaNome || perfilBase?.empresa_nome || campo.nome} (${
          dados.formaJuridica || "Entidade"
        })`.substring(0, 42),
        113,
        y + 12
      );
      doc.text(
        `NIF / Tax ID: ${dados.nif || perfilBase?.nif_empresa || "N/A"}`,
        113,
        y + 17
      );
      doc.text(
        `${dados.morada || "N/A"}, ${dados.codigoPostal || ""}`.substring(0, 42),
        113,
        y + 22
      );
      doc.text(
        `Resp: ${dados.pessoaContacto || perfilBase?.nome_completo || "N/A"} | Tel: ${
          dados.telefone || perfilBase?.telefone || "N/A"
        }`.substring(0, 42),
        113,
        y + 27
      );
      doc.text(
        `E-mail: ${dados.emailContacto || perfilBase?.email || "N/A"}`.substring(
          0,
          44
        ),
        113,
        y + 32
      );

      y += 43;

      doc.setTextColor(...blueBrand);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        isPt
          ? "2. CONDIÇÕES OPERACIONAIS E FINANCEIRAS ACORDADAS"
          : "2. AGREED OPERATIONAL AND FINANCIAL TERMS",
        15,
        y
      );
      doc.line(15, y + 2, pageWidth - 15, y + 2);
      y += 5;

      const boxHeight = dados.acordosComplementares ? 36 : 28;
      doc.setFillColor(240, 249, 255);
      doc.setDrawColor(186, 230, 253);
      doc.roundedRect(15, y, pageWidth - 30, boxHeight, 2, 2, "FD");

      const baseTexto =
        baseComissao === "apenas_programa"
          ? isPt
            ? "Apenas sobre Valor Base do Programa"
            : "Only on Program Base Value"
          : baseComissao === "sem_comissao"
          ? isPt
            ? "Isento (0%)"
            : "Exempt (0%)"
          : isPt
          ? "Sobre Valor Total (Programa + Extras)"
          : "On Total Value (Program + Extras)";

      const modTexto =
        modalidadeReserva === "direta"
          ? isPt
            ? "Reserva Direta no Checkout (HelloCamp)"
            : "Direct Checkout Booking (HelloCamp)"
          : modalidadeReserva === "email"
          ? isPt
            ? "Encaminhamento de Leads via E-mail"
            : "Lead Forwarding via Email"
          : isPt
          ? "Redirecionamento para Link Externo"
          : "Redirection to External Link";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...blueBrand);
      doc.text(
        isPt
          ? `Taxa de Comissão Fixada: ${taxaComissao}% (IVA incluído)`
          : `Fixed Commission Rate: ${taxaComissao}% (VAT included)`,
        19,
        y + 7
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...slateDark);
      doc.text(
        isPt
          ? `• Base de Incidência: ${baseTexto}`
          : `• Commission Base: ${baseTexto}`,
        19,
        y + 13
      );
      doc.text(
        isPt
          ? `• Modelo de Integração: ${modTexto}`
          : `• Integration Model: ${modTexto}`,
        19,
        y + 18
      );

      if (modalidadeReserva === "link_externo") {
        doc.text(
          isPt
            ? `• Link Oficial de Redirecionamento: ${linkExternoReserva}`
            : `• Official Redirect URL: ${linkExternoReserva}`,
          19,
          y + 23
        );
      } else {
        const pagTexto =
          tipoPagamento === "50_sinal"
            ? isPt
              ? "Sinal de 50% no ato + 50% antes do início"
              : "50% Deposit on booking + 50% before start"
            : isPt
            ? "100% cobrado no ato da reserva"
            : "100% charged upon booking";
        doc.text(
          isPt
            ? `• Fluxo de Pagamento (Stripe): ${pagTexto}  |  Política: ${politicaCancelamento}`
            : `• Payment Flow (Stripe): ${pagTexto}  |  Policy: ${politicaCancelamento}`,
          19,
          y + 23
        );
      }

      y += boxHeight + 7;

      doc.setTextColor(...blueBrand);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(
        isPt
          ? "3. CLÁUSULAS CONTRATUAIS GERAIS, RESPONSABILIDADE E FORO"
          : "3. GENERAL CONTRACTUAL CLAUSES, LIABILITY AND JURISDICTION",
        15,
        y
      );
      doc.line(15, y + 2, pageWidth - 15, y + 2);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...slateDark);

      const clausulas = isPt
        ? "A. Responsabilidade Civil e Seguros: A HelloCamp atua de forma estrita como plataforma informática de intermediação e motor de busca. A organização, gestão técnica, supervisão e segurança das atividades são da inteira e exclusiva responsabilidade da Segunda Outorgante (o Parceiro), que se obriga a manter válidos todos os seguros exigidos por lei (Responsabilidade Civil e Acidentes Pessoais) e as respetivas licenças de funcionamento, isentando a HelloCamp de qualquer litígio com os participantes decorrente da atividade.\n\nB. Proteção de Dados (RGPD): O Parceiro assume o papel de Responsável pelo Tratamento dos dados pessoais, médicos e restrições alimentares fornecidos pela HelloCamp no estrito cumprimento do Regulamento (UE) 2016/679 (RGPD).\n\nC. Impostos e Faturação: O Parceiro é o exclusivo responsável por determinar e cumprir as obrigações de cobrar, remeter ou incluir nos preços qualquer taxa de IVA sobre as vendas ao cliente final. A HelloCamp emite faturação exclusivamente referente à sua comissão de intermediação.\n\nD. Lei Aplicável e Foro Competente: O presente acordo rege-se pela Lei Portuguesa, sendo competente o foro da Comarca de Lisboa."
        : "A. Civil Liability & Insurance: HelloCamp acts strictly as an IT intermediation platform. The organization, technical management, supervision, and safety of the activities are the exclusive responsibility of the Partner, who is obliged to keep valid all insurance required by law.\n\nB. Data Protection (GDPR): The Partner commits to processing personal, medical, and dietary data in strict compliance with Regulation (EU) 2016/679 (GDPR).\n\nC. Taxes and Invoicing: The Partner is solely responsible for VAT and taxes regarding sales to the final customer. HelloCamp invoices strictly its intermediation commission.\n\nD. Governing Law and Jurisdiction: This agreement is governed by Portuguese Law, under the exclusive jurisdiction of the courts of Lisbon, Portugal.";

      const splitClausulas = doc.splitTextToSize(clausulas, pageWidth - 30);
      doc.text(splitClausulas, 15, y);
      y += splitClausulas.length * 3.6 + 8;

      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(15, y, pageWidth - 30, 38, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...blueBrand);
      doc.text(
        isPt
          ? "PELA PRIMEIRA OUTORGANTE (HELLOCAMP):"
          : "BY THE FIRST PARTY (HELLOCAMP):",
        20,
        y + 7
      );
      doc.setFont("times", "italic");
      doc.setFontSize(13);
      doc.setTextColor(...slateDark);
      doc.text("Administração HelloCamp Portugal", 20, y + 15);
      doc.setDrawColor(148, 163, 184);
      doc.line(20, y + 17, 95, y + 17);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...slateMuted);
      const dataPropostaFormatada = new Date(
        dataPropostaStr
      ).toLocaleDateString(isPt ? "pt-PT" : "en-GB");
      doc.text(
        isPt
          ? "Cargo: Direção Executiva & Parcerias B2B"
          : "Role: Executive Board & B2B Partnerships",
        20,
        y + 22
      );
      doc.text(
        isPt
          ? `Data: ${dataPropostaFormatada}`
          : `Date: ${dataPropostaFormatada}`,
        20,
        y + 27
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...greenBrand);
      doc.text(
        isPt
          ? "PELA SEGUNDA OUTORGANTE (PARCEIRO):"
          : "BY THE SECOND PARTY (PARTNER):",
        110,
        y + 7
      );
      doc.setFont("times", "italic");
      doc.setFontSize(13);
      doc.setTextColor(...slateDark);
      doc.text(
        `${
          dados.assinaturaNome ||
          dados.pessoaContacto ||
          perfilBase?.nome_completo ||
          "Assinado Digitalmente"
        }`.substring(0, 32),
        110,
        y + 15
      );
      doc.line(110, y + 17, pageWidth - 20, y + 17);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...slateMuted);
      doc.text(
        isPt
          ? `Cargo Legal: ${dados.assinaturaCargo || "Representante Legal"}`
          : `Legal Role: ${dados.assinaturaCargo || "Legal Representative"}`,
        110,
        y + 22
      );
      doc.text(
        isPt
          ? `Data e Hora: ${new Date(timestamp).toLocaleString("pt-PT")}`
          : `Timestamp: ${new Date(timestamp).toLocaleString("en-GB")}`,
        110,
        y + 27
      );
      doc.text(`IP: ${userIP} • ID: ${campo.id.slice(0, 8)}`, 110, y + 32);

      doc.save(
        `Contrato_HelloCamp_${(
          dados.empresaNome ||
          campo.nome ||
          "Parceiro"
        ).replace(/\s+/g, "_")}.pdf`
      );
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert(isEn ? "Error generating PDF." : "Erro ao gerar o PDF.");
    }
    setDownloadingPdf(false);
  };

  const camposFiltrados = campos.filter((c) =>
    `${c.nome || ""} ${c.local || ""} ${c.categoria || ""}`
      .toLowerCase()
      .includes(pesquisa.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">
        {isEn ? "Loading your camps..." : "A carregar os seus programas..."}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-sans pb-16">
      {/* CABEÇALHO */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 m-0 tracking-tight">
            {isEn ? "My Camps & Programs" : "Os Meus Campos e Programas"}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1 mb-0">
            {isEn
              ? "Create, duplicate, or edit your holiday programs, packages, and custom checkout questions."
              : "Crie, duplique ou edite os seus programas de férias, preços, pacotes e perguntas de inscrição."}
          </p>
        </div>

        <Link
          href={`/${lang}/admin/campos/novo`}
          className="bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs px-6 py-3.5 rounded-xl no-underline shadow-md transition-all"
        >
          + {isEn ? "Add New Camp" : "Criar Novo Campo"}
        </Link>
      </div>

      {/* BARRA DE PESQUISA RÁPIDA */}
      {campos.length > 0 && (
        <div className="mb-6">
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder={
              isEn
                ? "Filter by program name, city, or category..."
                : "Filtrar por nome do programa, localidade ou categoria..."
            }
            className="w-full md:w-96 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#167524] shadow-sm"
          />
        </div>
      )}

      {/* LISTA DE CAMPOS */}
      {camposFiltrados.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <span className="text-5xl block mb-4">🏕️</span>
          <h3 className="text-xl font-black text-slate-900 m-0 mb-2">
            {isEn ? "No programs found" : "Nenhum programa encontrado"}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {isEn
              ? "Start by creating your first camp program to showcase your activities to thousands of families."
              : "Comece por criar o seu primeiro programa de férias ou atividades para ficar visível nas pesquisas dos pais."}
          </p>
          <Link
            href={`/${lang}/admin/campos/novo`}
            className="inline-block bg-[#167524] text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl no-underline shadow-md"
          >
            + {isEn ? "Create First Camp" : "Criar Primeiro Campo"}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {camposFiltrados.map((campo) => {
            const status = (campo.status_aprovacao || "Pendente").toLowerCase();
            const isAprovado =
              status === "aprovado" ||
              status === "validado" ||
              status === "ativo";
            const imgUrl = campo.imagem?.startsWith("http")
              ? campo.imagem
              : "/og-image.jpg";

            let precoMin = Number(campo.preco) || 0;
            if (!precoMin && Array.isArray(campo.pacotes) && campo.pacotes.length > 0) {
              const precos = campo.pacotes.flatMap((p: any) =>
                Array.isArray(p.variantes)
                  ? p.variantes.map((v: any) => Number(v.preco) || 0).filter((v: number) => v > 0)
                  : []
              );
              if (precos.length > 0) precoMin = Math.min(...precos);
            }

            return (
              <div
                key={campo.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                {/* IMAGEM DE CAPA E BADGES */}
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url('${imgUrl}')` }}
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        isAprovado && campo.ativo
                          ? "bg-emerald-500 text-white"
                          : !campo.ativo
                          ? "bg-slate-700 text-white"
                          : "bg-amber-400 text-slate-900"
                      }`}
                    >
                      {!campo.ativo
                        ? isEn
                          ? "Paused"
                          : "Pausado"
                        : isAprovado
                        ? isEn
                          ? "Live"
                          : "Ativo Online"
                        : isEn
                        ? "Under Review"
                        : "Em Revisão"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDuplicarCampo(campo)}
                    disabled={duplicatingId === campo.id}
                    title={isEn ? "Duplicate Camp" : "Duplicar Campo"}
                    className="absolute top-3 right-3 bg-white/95 hover:bg-white text-slate-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer border border-slate-200"
                  >
                    {duplicatingId === campo.id
                      ? "..."
                      : isEn
                      ? "📋 Duplicate"
                      : "📋 Duplicar"}
                  </button>
                </div>

                {/* CORPO DO CARTÃO */}
                <div className="p-6 flex-1 flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    📍 {campo.Distrito || campo.local || "Portugal"} •{" "}
                    {campo.categoria || "Geral"}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 m-0 mb-2 line-clamp-2">
                    {campo.nome}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold mt-2 pt-3 border-t border-slate-100">
                    <span>
                      👶 {campo.idade || `${campo.idade_min || 6}-${campo.idade_max || 16} anos`}
                    </span>
                    <span className="text-base font-black text-[#167524]">
                      {precoMin > 0 ? `${precoMin}€` : "--"}
                    </span>
                  </div>

                  {/* BOTÕES DE AÇÃO */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/${lang}/admin/campos/editar/${campo.id}`}
                        className="bg-[#167524] hover:bg-[#115a1b] text-white text-center py-2.5 rounded-xl text-xs font-black uppercase tracking-widest no-underline transition-colors"
                      >
                        ✏️ {isEn ? "Edit" : "Editar"}
                      </Link>
                      <Link
                        href={`/${lang}/campo/${campo.id}`}
                        target="_blank"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-center py-2.5 rounded-xl text-xs font-black uppercase tracking-widest no-underline transition-colors"
                      >
                        👁️ {isEn ? "Preview ↗" : "Ver no Site ↗"}
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAtivo(campo)}
                        disabled={togglingId === campo.id}
                        className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-2 rounded-xl text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        {campo.ativo
                          ? isEn
                            ? "⏸ Pause Sales"
                            : "⏸ Pausar Vendas"
                          : isEn
                          ? "▶️ Resume Sales"
                          : "▶️ Ativar Vendas"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(campo)}
                        disabled={downloadingPdf}
                        className="bg-white hover:bg-slate-50 text-[#0E3A68] border border-slate-200 py-2 rounded-xl text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        📄 {isEn ? "Contract PDF" : "Contrato PDF"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
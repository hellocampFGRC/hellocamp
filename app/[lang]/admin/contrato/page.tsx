"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import jsPDF from "jspdf";

const FORMAS_JURIDICAS_PT = [
  "Sociedade por Quotas (Lda)",
  "Sociedade Unipessoal por Quotas",
  "Sociedade Anónima (S.A.)",
  "Associação Sem Fins Lucrativos",
  "Clube Desportivo / Federação",
  "Empresário em Nome Individual (ENI)",
  "Fundação / Cooperativa",
  "Entidade Pública / Autarquia",
];

const FORMAS_JURIDICAS_EN = [
  "Limited Liability Company (LLC / Ltd)",
  "Sole Proprietorship",
  "Public Limited Company (PLC / Corp)",
  "Non-Profit Association / NGO",
  "Sports Club / Federation",
  "Foundation / Cooperative",
  "Public Entity / Municipality",
];

export default function GestaoContratoGlobalPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const [contractLang, setContractLang] = useState<"pt" | "en">(
    lang === "en" ? "en" : "pt"
  );
  const isEn = contractLang === "en";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);

  const [perfil, setPerfil] = useState<any>(null);
  const [totalCampos, setTotalCampos] = useState(0);
  const [pdfExistenteUrl, setPdfExistenteUrl] = useState<string | null>(null);

  // Dropdown customizado de Forma Jurídica
  const [isFormaDropdownOpen, setIsFormaDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    empresaNome: "",
    nif: "",
    formaJuridica: "Sociedade por Quotas (Lda)",
    pessoaContacto: "",
    telefone: "",
    morada: "",
    codigoPostal: "",
    emailContacto: "",
    emailReservas: "",
    website: "",
    responsavelRGPD: "",
    modalidadeReserva: "direta",
    linkExternoReserva: "",
    tipoPagamento: "100_total",
    politicaCancelamento: "Flexível (Reembolso a 100% até 7 dias antes)",
    acordosComplementares: "",
    assinaturaNome: "",
    assinaturaCargo: "",
    concordaTermos: false,
    dataSubmissao: "",
    ipAssinatura: "",
  });

  useEffect(() => {
    const carregarContrato = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const uid = session.user.id;

      const [{ data: perfilData }, { data: camposData }] = await Promise.all([
        supabase.from("perfis").select("*").eq("id", uid).single(),
        supabase
          .from("campos")
          .select("id, contrato_parceiro_url")
          .eq("organizador_id", uid),
      ]);

      setPerfil(perfilData);
      setTotalCampos(camposData?.length || 0);

      const campoComPdf = camposData?.find((c) => c.contrato_parceiro_url);
      if (campoComPdf?.contrato_parceiro_url && campoComPdf.contrato_parceiro_url.startsWith("http")) {
        setPdfExistenteUrl(campoComPdf.contrato_parceiro_url);
      }

      if (perfilData) {
        const cd = perfilData.contrato_dados || {};
        const jaTemContrato = !!perfilData.contrato_dados?.assinaturaNome;
        setModoEdicao(!jaTemContrato);

        setForm({
          empresaNome:
            cd.empresaNome ||
            cd.nomeEmpresa ||
            perfilData.empresa_nome ||
            "",
          nif: cd.nif || perfilData.nif_empresa || "",
          formaJuridica:
            cd.formaJuridica || "Sociedade por Quotas (Lda)",
          pessoaContacto:
            cd.pessoaContacto || perfilData.nome_completo || "",
          telefone: cd.telefone || perfilData.telefone || "",
          morada: cd.morada || "",
          codigoPostal: cd.codigoPostal || "",
          emailContacto: cd.emailContacto || perfilData.email || "",
          emailReservas:
            cd.emailReservas || cd.emailContacto || perfilData.email || "",
          website: cd.website || "",
          responsavelRGPD:
            cd.responsavelRGPD ||
            cd.pessoaContacto ||
            perfilData.nome_completo ||
            "",
          modalidadeReserva:
            cd.modalidadeReserva ||
            perfilData.modalidade_reserva ||
            "direta",
          linkExternoReserva:
            cd.linkExternoReserva ||
            perfilData.link_externo_reserva ||
            "",
          tipoPagamento:
            cd.tipoPagamento || cd.tipo_pagamento || "100_total",
          politicaCancelamento:
            cd.politicaCancelamento ||
            cd.politica_cancelamento ||
            "Flexível (Reembolso a 100% até 7 dias antes)",
          acordosComplementares: cd.acordosComplementares || "",
          assinaturaNome:
            cd.assinaturaNome || perfilData.nome_completo || "",
          assinaturaCargo:
            cd.assinaturaCargo || "Representante Legal",
          concordaTermos: jaTemContrato,
          dataSubmissao:
            cd.dataSubmissao || perfilData.created_at || new Date().toISOString(),
          ipAssinatura: cd.ipAssinatura || "Registado no Servidor",
        });
      }

      setLoading(false);
    };

    carregarContrato();
  }, []);

  // ============================================================================
  // GERADOR DO PDF OFICIAL COMPLETO (IDÊNTICO AO DOCUMENTO LEGAL)
  // ============================================================================
  const gerarDocumentoPDF = (ipParaRegisto: string, dataIso: string) => {
    const isPt = contractLang === "pt";
    const taxaComissao =
      perfil?.taxa_comissao !== null && perfil?.taxa_comissao !== undefined
        ? perfil.taxa_comissao
        : 12;
    const baseComissao = perfil?.base_comissao || "total";

    const doc = new jsPDF({ format: "a4", unit: "mm" });
    const pageWidth = doc.internal.pageSize.getWidth();

    const blueBrand: [number, number, number] = [14, 58, 104]; // #0E3A68
    const goldBrand: [number, number, number] = [226, 164, 29]; // #e2a41d
    const greenBrand: [number, number, number] = [22, 117, 36]; // #167524
    const slateDark: [number, number, number] = [30, 41, 59];
    const slateMuted: [number, number, number] = [100, 116, 139];

    // 1. BANNER CORPORATIVO DE TOPO
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
        ? "ACORDO GLOBAL DE INTERMEDIAÇÃO E SERVIÇOS B2B"
        : "GLOBAL B2B INTERMEDIATION AND SERVICES AGREEMENT",
      pageWidth / 2,
      24,
      { align: "center" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(191, 219, 254);
    const dataEmissaoFormatada = new Date(dataIso).toLocaleDateString(
      isPt ? "pt-PT" : "en-GB",
      { year: "numeric", month: "long", day: "numeric" }
    );
    doc.text(
      isPt
        ? `Documento Jurídico Oficial • Emitido em ${dataEmissaoFormatada}`
        : `Official Legal Document • Issued on ${dataEmissaoFormatada}`,
      pageWidth / 2,
      31,
      { align: "center" }
    );

    let y = 48;

    // 2. ENQUADRAMENTO E PRINCÍPIOS DO ACORDO
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

    // 3. SECÇÃO 1: IDENTIFICAÇÃO DAS PARTES
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
      `${form.empresaNome || "Entidade Parceira"} (${
        form.formaJuridica || "Entidade"
      })`.substring(0, 42),
      113,
      y + 12
    );
    doc.text(`NIF / Tax ID: ${form.nif || "N/A"}`, 113, y + 17);
    doc.text(
      `${form.morada || "N/A"}, ${form.codigoPostal || ""}`.substring(0, 42),
      113,
      y + 22
    );
    doc.text(
      `Resp: ${form.pessoaContacto || "N/A"} | Tel: ${
        form.telefone || "N/A"
      }`.substring(0, 42),
      113,
      y + 27
    );
    doc.text(
      `E-mail: ${form.emailContacto || "N/A"} | RGPD: ${
        form.responsavelRGPD || form.pessoaContacto || "N/A"
      }`.substring(0, 44),
      113,
      y + 32
    );

    y += 43;

    // 4. SECÇÃO 2: CONDIÇÕES OPERACIONAIS E FINANCEIRAS (ANEXOS 1, 2, 3 E 4)
    doc.setTextColor(...blueBrand);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      isPt
        ? "2. CONDIÇÕES OPERACIONAIS E FINANCEIRAS ACORDADAS (ANEXOS 1 A 4)"
        : "2. AGREED OPERATIONAL AND FINANCIAL TERMS (ANNEXES 1 TO 4)",
      15,
      y
    );
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 5;

    const boxHeight = form.acordosComplementares ? 36 : 28;
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
      form.modalidadeReserva === "direta"
        ? isPt
          ? "Reserva Direta no Checkout (HelloCamp)"
          : "Direct Checkout Booking (HelloCamp)"
        : form.modalidadeReserva === "email"
        ? isPt
          ? "Comunicação por E-mail (Reserva Sob Consulta - 48h)"
          : "Email Communication (Booking Upon Request - 48h)"
        : isPt
        ? "Redirecionamento para Link Externo c/ Registo de Lead"
        : "Redirection to External Link w/ Lead Tracking";

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
        ? `• Anexo 1 (Modelo de Reserva): ${modTexto}`
        : `• Annex 1 (Booking Model): ${modTexto}`,
      19,
      y + 18
    );

    if (form.modalidadeReserva === "link_externo") {
      doc.text(
        isPt
          ? `• Link Oficial de Redirecionamento: ${form.linkExternoReserva}`
          : `• Official Redirect URL: ${form.linkExternoReserva}`,
        19,
        y + 23
      );
    } else {
      const pagTexto =
        form.tipoPagamento === "50_sinal"
          ? isPt
            ? "Sinal de 50% no ato + 50% antes do início"
            : "50% Deposit on booking + 50% before start"
          : isPt
          ? "100% cobrado no ato da reserva"
          : "100% charged upon booking";
      doc.text(
        isPt
          ? `• Anexo 2 e 3 (Stripe): ${pagTexto}  |  Política: ${form.politicaCancelamento}`
          : `• Annex 2 & 3 (Stripe): ${pagTexto}  |  Policy: ${form.politicaCancelamento}`,
        19,
        y + 23
      );
    }

    if (form.acordosComplementares) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(146, 64, 14);
      doc.text(
        isPt
          ? `• Anexo 4 (Acordos Extraordinários): "${form.acordosComplementares}"`
          : `• Annex 4 (Extraordinary Agreements): "${form.acordosComplementares}"`,
        19,
        y + 31
      );
    }

    y += boxHeight + 7;

    // 5. SECÇÃO 3: CLÁUSULAS CONTRATUAIS GERAIS (ARTIGOS 1 A 7)
    doc.setTextColor(...blueBrand);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      isPt
        ? "3. CLÁUSULAS CONTRATUAIS GERAIS, RESPONSABILIDADE E FORO (ARTIGOS 1.º A 7.º)"
        : "3. GENERAL CONTRACTUAL CLAUSES, LIABILITY AND JURISDICTION (ARTICLES 1 TO 7)",
      15,
      y
    );
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...slateDark);

    const clausulas = isPt
      ? "A. Responsabilidade Civil e Seguros (Art. 6.º): A HelloCamp atua de forma estrita como plataforma informática de intermediação e motor de busca. A organização, gestão técnica, supervisão e segurança das atividades são da inteira e exclusiva responsabilidade da Segunda Outorgante (o Parceiro), que se obriga a manter válidos todos os seguros exigidos por lei (Responsabilidade Civil e Acidentes Pessoais) e as respetivas licenças de funcionamento (Ex: RNAAT/RNAVT ou licenças camarárias), isentando a HelloCamp de qualquer litígio com os participantes decorrente da atividade.\n\nB. Proteção de Dados - RGPD: O Parceiro assume o papel de Responsável pelo Tratamento dos dados pessoais, médicos e restrições alimentares fornecidos pela HelloCamp no estrito cumprimento do Regulamento (UE) 2016/679 (RGPD), utilizando-os apenas para a execução do serviço contratado e eliminando-os assim que deixem de ser necessários.\n\nC. Impostos, Paridade e Faturação (Art. 2.º e 3.º): Os preços divulgados na HelloCamp não poderão exceder os preços praticados pelo Parceiro na venda direta. O Parceiro é o exclusivo responsável pela faturação ao cliente final. A HelloCamp emite faturação exclusivamente referente à sua comissão de intermediação.\n\nD. Convenção de Prova e Foro Competente (Art. 7.º): As partes reconhecem plena validade jurídica e força probatória aos registos informáticos desta assinatura eletrónica (IP, timestamp e identificação). O presente acordo rege-se pela Lei Portuguesa, sendo competente o foro da Comarca de Lisboa."
      : "A. Civil Liability & Insurance (Art. 6): HelloCamp acts strictly as an IT intermediation platform and search engine. The organization, technical management, supervision, and safety of the activities are the entire and exclusive responsibility of the Second Party (the Partner), who is obliged to keep valid all insurance required by law (Civil Liability and Personal Accidents) and operating licenses, exempting HelloCamp from any litigation with participants arising from the camp activity.\n\nB. Data Protection - GDPR: The Partner commits to processing the personal, medical, and dietary restriction data provided by HelloCamp in strict compliance with Regulation (EU) 2016/679 (GDPR), using them only for the execution of the contracted service and deleting them as soon as they are no longer necessary.\n\nC. Taxes, Price Parity & Invoicing (Art. 2 & 3): Prices listed on HelloCamp shall not exceed direct prices. The Partner is solely responsible for invoicing the final customer. HelloCamp invoices strictly its intermediation commission.\n\nD. Evidence Agreement & Jurisdiction (Art. 7): Both parties acknowledge full legal validity to the computer records of this electronic signature (IP, timestamp, and signatory). This agreement is governed by Portuguese Law under the exclusive jurisdiction of the courts of Lisbon.";

    const splitClausulas = doc.splitTextToSize(clausulas, pageWidth - 30);
    doc.text(splitClausulas, 15, y);
    y += splitClausulas.length * 3.55 + 5;

    // 6. BLOCO DE ASSINATURAS BILATERAIS
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(15, y, pageWidth - 30, 36, 2, 2, "FD");

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
    doc.text(
      isPt
        ? "Cargo: Direção Executiva & Parcerias B2B"
        : "Role: Executive Board & B2B Partnerships",
      20,
      y + 22
    );
    doc.text(
      isPt
        ? "Estado: Validado e Aprovado pela Sede (HQ)"
        : "Status: Validated & Approved by HQ",
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
        form.assinaturaNome || form.pessoaContacto || "Assinado Digitalmente"
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
        ? `Cargo Legal: ${form.assinaturaCargo || "Representante Legal"}`
        : `Legal Role: ${form.assinaturaCargo || "Legal Representative"}`,
      110,
      y + 22
    );
    doc.text(
      isPt
        ? `Data/Hora: ${new Date(dataIso).toLocaleString("pt-PT")} • IP: ${ipParaRegisto}`
        : `Timestamp: ${new Date(dataIso).toLocaleString("en-GB")} • IP: ${ipParaRegisto}`,
      110,
      y + 27
    );

    return doc;
  };

  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    try {
      const doc = gerarDocumentoPDF(
        form.ipAssinatura || "Registado no Servidor",
        form.dataSubmissao || new Date().toISOString()
      );
      doc.save(
        `Contrato_Global_HelloCamp_${(form.empresaNome || "Parceiro").replace(
          /\s+/g,
          "_"
        )}.pdf`
      );
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert(isEn ? "Error generating PDF." : "Erro ao gerar o PDF.");
    }
    setDownloadingPdf(false);
  };

  const handleSubmeterContratoGlobal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.modalidadeReserva) {
      alert(
        isEn
          ? "Please select a booking modality in Annex 1."
          : "Por favor, selecione a modalidade de reserva no Anexo 1."
      );
      return;
    }
    if (
      form.modalidadeReserva === "link_externo" &&
      !form.linkExternoReserva.trim()
    ) {
      alert(
        isEn
          ? "Please provide the external booking URL in Annex 1."
          : "Por favor, insira o link externo do formulário no Anexo 1."
      );
      return;
    }
    if (!form.assinaturaNome.trim() || !form.assinaturaCargo.trim() || !form.concordaTermos) {
      alert(
        isEn
          ? "Please complete the digital signature and accept the terms at the end of the contract."
          : "Por favor, preencha o nome, cargo e confirme a aceitação dos termos no final do contrato."
      );
      return;
    }

    setSaving(true);

    try {
      // 1. Capturar IP real para validade probatória (Artigo 7.º)
      let userIP = form.ipAssinatura || "Registado no Servidor";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        if (ipRes.ok) {
          const ipJson = await ipRes.json();
          if (ipJson.ip) userIP = ipJson.ip;
        }
      } catch {}

      const agoraIso = new Date().toISOString();

      // 2. Gerar o ficheiro PDF assinado
      const doc = gerarDocumentoPDF(userIP, agoraIso);
      const pdfBlob = doc.output("blob");
      const pdfFile = new File(
        [pdfBlob],
        `contrato_global_${perfil.id}.pdf`,
        { type: "application/pdf" }
      );

      const novoContratoDados = {
        ...perfil?.contrato_dados,
        ...form,
        nomeEmpresa: form.empresaNome,
        tipo_pagamento: form.tipoPagamento,
        politica_cancelamento: form.politicaCancelamento,
        taxaComissao: perfil?.taxa_comissao ?? 12,
        baseComissao: perfil?.base_comissao || "total",
        dataSubmissao: agoraIso,
        ipAssinatura: userIP,
      };

      const formData = new FormData();
      formData.append("id", perfil.id);
      formData.append("email", perfil.email || form.emailContacto);
      formData.append("lang", contractLang);
      formData.append("contratoDados", JSON.stringify(novoContratoDados));
      formData.append("pdf", pdfFile);

      const res = await fetch("/api/contratos/assinar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao submeter contrato.");

      setForm((prev) => ({
        ...prev,
        dataSubmissao: agoraIso,
        ipAssinatura: userIP,
      }));
      setPerfil((prev: any) => ({
        ...prev,
        status_contrato: "Aprovado",
        contrato_dados: novoContratoDados,
        modalidade_reserva: form.modalidadeReserva,
      }));
      if (data.url) setPdfExistenteUrl(data.url);
      setModoEdicao(false);

      alert(
        isEn
          ? "Global Intermediation Contract successfully signed and propagated to all your camps!"
          : "Contrato Global de Intermediação assinado e ativado com sucesso em todos os seus campos!"
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">
        {isEn
          ? "Loading Official Partnership Contract..."
          : "A carregar Documento Oficial do Contrato Global..."}
      </div>
    );
  }

  const jaAssinado =
    perfil?.status_contrato === "Aprovado" ||
    !!perfil?.contrato_dados?.assinaturaNome;
  const taxaExibida = perfil?.taxa_comissao ?? 12;
  const baseExibida = perfil?.base_comissao || "total";
  const dataFormatada = form.dataSubmissao
    ? new Date(form.dataSubmissao).toLocaleDateString(
        isEn ? "en-GB" : "pt-PT",
        { day: "2-digit", month: "long", year: "numeric" }
      )
    : new Date().toLocaleDateString(isEn ? "en-GB" : "pt-PT");

  const listaFormasJuridicas = isEn ? FORMAS_JURIDICAS_EN : FORMAS_JURIDICAS_PT;
  const inputContractClass =
    "w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#167524] focus:ring-2 focus:ring-[#167524]/15 transition-all disabled:bg-slate-100 disabled:text-slate-600 font-sans";

  return (
    <div className="max-w-5xl mx-auto font-sans pb-24">
      {/* BARRA DE CONTROLO SUPERIOR DO PORTAL */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                jaAssinado
                  ? "bg-emerald-100 text-[#167524] border border-emerald-200"
                  : "bg-amber-100 text-amber-900 border border-amber-200"
              }`}
            >
              {jaAssinado
                ? isEn
                  ? "✓ Signed & Validated Agreement"
                  : "✓ Acordo Global Assinado e Ativo"
                : isEn
                ? "⚠️ Pending Digital Signature"
                : "⚠️ Assinatura Digital Pendente"}
            </span>
            <span className="text-xs font-bold text-slate-400">
              • {totalCampos}{" "}
              {isEn
                ? "Program(s) Covered"
                : "Programa(s) Abrangido(s)"}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 m-0">
            {isEn
              ? "Global B2B Partnership Agreement"
              : "Acordo Global de Parceria e Intermediação"}
          </h1>
        </div>

        {/* BOTÕES DE IDIOMA DO CONTRATO, EDIÇÃO E DOWNLOAD PDF */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Seletor Customizado de Idioma do Contrato */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setContractLang("pt")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                contractLang === "pt"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🇵🇹 PT
            </button>
            <button
              type="button"
              onClick={() => setContractLang("en")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                contractLang === "en"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🇬🇧 EN
            </button>
          </div>

          {jaAssinado && (
            <button
              type="button"
              onClick={() => setModoEdicao(!modoEdicao)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-black uppercase tracking-widest text-[11px] px-4 py-3 rounded-xl cursor-pointer transition-colors"
            >
              {modoEdicao
                ? isEn
                  ? "👁️ View Mode"
                  : "👁️ Modo Leitura"
                : isEn
                ? "✏️ Update Terms"
                : "✏️ Atualizar Dados"}
            </button>
          )}

          {pdfExistenteUrl && (
            <a
              href={pdfExistenteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest text-[11px] px-4 py-3 rounded-xl no-underline shadow-sm transition-colors"
            >
              📥 {isEn ? "Archived PDF" : "PDF Arquivado"}
            </a>
          )}

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-[11px] px-5 py-3 rounded-xl cursor-pointer shadow-sm transition-colors"
          >
            📄{" "}
            {downloadingPdf
              ? "..."
              : isEn
              ? "Download Official PDF"
              : "Descarregar Contrato PDF"}
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* DOCUMENTO INTEGRAL DO CONTRATO (COM TODAS AS CLÁUSULAS E ANEXOS)      */}
      {/* ===================================================================== */}
      <form
        onSubmit={handleSubmeterContratoGlobal}
        className="bg-white shadow-xl border border-slate-200 p-6 sm:p-10 md:p-16 text-slate-900 leading-relaxed rounded-3xl font-serif"
      >
        {/* CABEÇALHO DO CONTRATO */}
        <div className="text-center mb-12 md:mb-16">
          <div className="text-3xl md:text-4xl font-black tracking-tighter mb-4 font-sans">
            <span className="text-[#0E3A68]">Hello</span>
            <span className="text-[#EBA914]">Camp</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold uppercase mb-2 tracking-widest border-b-2 border-slate-900 inline-block pb-2">
            {isEn
              ? "Global Intermediation Contract"
              : "Contrato Global de Intermediação"}
          </h2>
          <p className="text-sm md:text-base italic text-slate-600 mt-3">
            {isEn
              ? "A single agreement covering all your current and future activities on HelloCamp."
              : "Um único acordo que abrange todas as suas atividades presentes e futuras na plataforma HelloCamp."}
          </p>
        </div>

        {/* OS 4 PILARES DO ENQUADRAMENTO */}
        <div className="space-y-8 md:space-y-10 mb-12 font-sans">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">
              📝
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-1.5 m-0">
                {isEn
                  ? "1. Conclusion of the Contract"
                  : "1. Celebração do Contrato"}
              </h3>
              <p className="text-sm text-slate-600 text-justify leading-relaxed m-0">
                {isEn
                  ? "This contract regulates the promotion and intermediation of your offers through the HelloCamp platform, establishing the terms of collaboration between both parties. The agreement remains valid until the end of the current calendar year and is automatically renewed for successive periods, unless terminated by either party under the contractual terms."
                  : "Este contrato regula a divulgação e a intermediação das suas ofertas através da plataforma HelloCamp, estabelecendo os termos da colaboração entre ambas as partes. O acordo mantém-se válido até ao final do ano civil em curso, sendo automaticamente renovado por períodos sucessivos, salvo denúncia por qualquer uma das partes nos termos previstos contratualmente."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">
              🏖️
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-1.5 m-0">
                {isEn ? "2. Promotion of Offers" : "2. Divulgação das Ofertas"}
              </h3>
              <p className="text-sm text-slate-600 text-justify leading-relaxed m-0">
                {isEn
                  ? "After the contract is signed, HelloCamp collects and organizes the information regarding the activities provided by the partner, creating and publishing the respective offer pages on the platform. Concurrently, it promotes the programs through its digital channels and may request additional information whenever necessary to ensure the quality and currency of the content. Publication of offers will only occur after compliance with the applicable contractual conditions and validation of all necessary information."
                  : "Após a celebração do contrato, a HelloCamp procede à recolha e organização das informações relativas às atividades disponibilizadas pelo parceiro, criando e publicando as respetivas páginas de oferta na plataforma. Paralelamente, promove os programas através dos seus canais digitais e poderá solicitar informações adicionais sempre que tal se revele necessário para garantir a qualidade e atualização dos conteúdos. A publicação das ofertas apenas ocorrerá após o cumprimento das condições contratuais aplicáveis e da validação de toda a informação necessária."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">
              💻
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-1.5 m-0">
                {isEn
                  ? "3. Bookings through HelloCamp"
                  : "3. Reservas através da HelloCamp"}
              </h3>
              <p className="text-sm text-slate-600 text-justify leading-relaxed m-0">
                {isEn
                  ? "Activity bookings can be made directly through the HelloCamp platform. Whenever a booking is made, HelloCamp will communicate the client details, booking specifics, and all necessary information to the partner for proper management. In turn, the partner commits to keeping availability, prices, programs, and other relevant information permanently updated, ensuring data accuracy for clients."
                  : "As reservas das atividades poderão ser efetuadas diretamente através da plataforma HelloCamp. Sempre que uma reserva seja realizada, a HelloCamp comunicará ao parceiro os dados do cliente, os detalhes da reserva e todas as informações necessárias à adequada gestão da inscrição. Por sua vez, o parceiro compromete-se a manter permanentemente atualizadas a disponibilidade das atividades, os preços praticados, os programas oferecidos e quaisquer outras informações relevantes relacionadas com as suas ofertas, assegurando a exatidão dos dados apresentados aos clientes."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0E3A68] text-white rounded-2xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm font-black">
              €
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-1.5 m-0">
                {isEn
                  ? "4. Commission & Success Model"
                  : "4. Pagamento da Comissão"}
              </h3>
              <p className="text-sm text-slate-600 text-justify leading-relaxed m-0">
                {isEn
                  ? `HelloCamp charges an agreed commission of ${taxaExibida}% (VAT included) on each completed booking through the platform. The payment model may take different forms, such as direct checkout payment via Stripe, upon-request booking, or external lead redirection, as established in the Annexes of this partnership contract.`
                  : `A HelloCamp cobra uma comissão acordada de ${taxaExibida}% (IVA incluído) sobre cada reserva concluída através da plataforma. O modelo de pagamento poderá assumir diferentes formas, nomeadamente através de pagamento automático via Stripe Connect, reserva sob consulta ou redirecionamento de leads, de acordo com os termos estabelecidos nos Anexos deste contrato de parceria.`}
              </p>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200 w-full my-10"></div>

        {/* IDENTIFICAÇÃO DAS PARTES OUTORGANTES */}
        <div className="space-y-4 font-serif text-sm md:text-[15px]">
          <h2 className="text-lg md:text-xl font-bold text-center uppercase tracking-widest mb-6 font-sans text-slate-900">
            {isEn
              ? "Global Service Agreement"
              : "Acordo Global de Prestação de Serviços"}
          </h2>
          <p className="text-justify">
            {isEn
              ? 'Between HelloCamp Portugal, with official website at www.hellocamp.pt and contact via info@hellocamp.pt, hereinafter referred to as the "First Party"; and on the other side:'
              : 'Entre a HelloCamp Portugal, com website oficial em www.hellocamp.pt e contacto via info@hellocamp.pt, doravante designada por "Primeiro Outorgante"; e do outro lado:'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-6 mt-6 bg-slate-50 p-5 md:p-8 border border-slate-200 rounded-2xl font-sans">
            <div className="flex flex-col md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn
                  ? "Company Name (Billing) *"
                  : "Nome da Empresa / Entidade (Faturação) *"}
              </label>
              <input
                required
                disabled={!modoEdicao}
                type="text"
                className={inputContractClass}
                value={form.empresaNome}
                onChange={(e) =>
                  setForm({ ...form, empresaNome: e.target.value })
                }
                placeholder={isEn ? "Legal designation" : "Designação legal"}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "VAT / Tax ID Number *" : "NIF / NIPC *"}
              </label>
              <input
                required
                disabled={!modoEdicao}
                type="text"
                className={inputContractClass}
                value={form.nif}
                onChange={(e) => setForm({ ...form, nif: e.target.value })}
                placeholder={
                  isEn
                    ? "Tax Identification Number"
                    : "Número de Identificação Fiscal"
                }
              />
            </div>

            {/* DROPDOWN CUSTOMIZADO PARA FORMA JURÍDICA */}
            <div className="flex flex-col relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Legal Form *" : "Forma Jurídica *"}
              </label>
              <div
                onClick={() => {
                  if (modoEdicao) setIsFormaDropdownOpen(!isFormaDropdownOpen);
                }}
                className={`${inputContractClass} flex items-center justify-between ${
                  modoEdicao ? "cursor-pointer" : "cursor-default bg-slate-100"
                }`}
              >
                <span className="truncate">{form.formaJuridica}</span>
                {modoEdicao && (
                  <span className="text-[10px] text-slate-400 ml-2">▼</span>
                )}
              </div>
              {isFormaDropdownOpen && modoEdicao && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsFormaDropdownOpen(false)}
                  />
                  <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {listaFormasJuridicas.map((fj) => (
                      <div
                        key={fj}
                        onClick={() => {
                          setForm({ ...form, formaJuridica: fj });
                          setIsFormaDropdownOpen(false);
                        }}
                        className="p-3 hover:bg-emerald-50 text-xs font-bold text-slate-800 cursor-pointer border-b border-slate-50 last:border-0"
                      >
                        {fj}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Contact Person *" : "Pessoa de Contacto *"}
              </label>
              <input
                required
                disabled={!modoEdicao}
                type="text"
                className={inputContractClass}
                value={form.pessoaContacto}
                onChange={(e) =>
                  setForm({ ...form, pessoaContacto: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Phone Number *" : "Número de Telefone *"}
              </label>
              <input
                required
                disabled={!modoEdicao}
                type="text"
                className={inputContractClass}
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Billing Address *" : "Morada Fiscal *"}
              </label>
              <input
                required
                disabled={!modoEdicao}
                type="text"
                className={inputContractClass}
                value={form.morada}
                onChange={(e) => setForm({ ...form, morada: e.target.value })}
                placeholder={
                  isEn ? "Street, number, floor" : "Rua, número, andar"
                }
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Postal Code and City *" : "Código Postal e Cidade *"}
              </label>
              <input
                required
                disabled={!modoEdicao}
                type="text"
                className={inputContractClass}
                value={form.codigoPostal}
                onChange={(e) =>
                  setForm({ ...form, codigoPostal: e.target.value })
                }
                placeholder="0000-000 Localidade"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Commercial E-mail *" : "E-mail Comercial *"}
              </label>
              <input
                required
                disabled={!modoEdicao}
                type="email"
                className={inputContractClass}
                value={form.emailContacto}
                onChange={(e) =>
                  setForm({ ...form, emailContacto: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Booking Notification E-mail *" : "E-mail para Reservas *"}
              </label>
              <input
                required
                disabled={!modoEdicao}
                type="email"
                className={inputContractClass}
                value={form.emailReservas}
                onChange={(e) =>
                  setForm({ ...form, emailReservas: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Website (Optional)" : "Website (Opcional)"}
              </label>
              <input
                disabled={!modoEdicao}
                type="text"
                className={inputContractClass}
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn
                  ? "Data Protection Officer (GDPR) *"
                  : "Responsável de Proteção de Dados (RGPD) *"}
              </label>
              <input
                required
                disabled={!modoEdicao}
                type="text"
                className={inputContractClass}
                value={form.responsavelRGPD}
                onChange={(e) =>
                  setForm({ ...form, responsavelRGPD: e.target.value })
                }
              />
            </div>
          </div>

          <p className="mt-6 italic text-center">
            {isEn
              ? '- hereinafter referred to as the "Partner" -'
              : '- doravante designado por "Parceiro" -'}
          </p>

          <div className="text-center p-6 sm:p-8 mt-8 border-y-2 border-slate-200 bg-slate-50 rounded-2xl">
            <p className="font-bold text-base sm:text-lg mb-2">
              {isEn
                ? "This intermediation and commercial promotion contract applies to:"
                : "É celebrado o presente contrato de intermediação e divulgação comercial aplicável a:"}
            </p>
            <span className="block text-lg sm:text-2xl font-black text-[#167524] uppercase tracking-widest mt-3 font-sans">
              {isEn
                ? "All activities organized by"
                : "Todas as atividades organizadas por"}{" "}
              <br /> {form.empresaNome || "..."}
            </span>
            <span className="block text-xs sm:text-sm text-slate-500 mt-3 font-sans font-medium">
              {isEn
                ? `Agreed Commission Rate: ${taxaExibida}% (VAT included) • Base: ${
                    baseExibida === "apenas_programa"
                      ? "Base Program Only"
                      : "Total Booking Value"
                  }`
                : `Taxa de Comissão Acordada: ${taxaExibida}% (IVA incluído) • Incidência: ${
                    baseExibida === "apenas_programa"
                      ? "Apenas Programa Base"
                      : "Valor Total da Reserva"
                  }`}
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* CLÁUSULAS CONTRATUAIS INTEGRAIS (ARTIGOS 1.º AO 7.º)                */}
        {/* =================================================================== */}
        <div className="space-y-5 text-sm md:text-[15px] text-justify pt-10">
          <h3 className="font-black text-lg md:text-xl uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-8 font-sans">
            {isEn ? "Contractual Clauses" : "Cláusulas Contratuais"}
          </h3>

          <h4 className="font-bold text-slate-900 font-sans">
            {isEn ? "Article 1 – Commission" : "Artigo 1.º – Comissão"}
          </h4>
          <p>
            {isEn
              ? `The Partner commits to paying HelloCamp a commission of ${taxaExibida}% (VAT included) on each booking made through the platform, under the terms defined in this contract or a supplementary agreement.`
              : `O Parceiro compromete-se a pagar à HelloCamp uma comissão de ${taxaExibida}% (IVA incluído) sobre cada reserva efetuada através da plataforma, cujos termos e incidência encontram-se definidos no presente contrato e seus anexos.`}
          </p>
          <p>
            {isEn
              ? "The commission is calculated on the amount actually paid by the client for the booked activity, including additional services contracted through the platform."
              : "A comissão é calculada sobre o valor efetivamente faturado pelo Parceiro ao cliente relativamente à atividade reservada, incluindo serviços adicionais contratados através da plataforma ou através de leads geradas."}
          </p>
          <p>
            {isEn
              ? "The commission becomes due after the booking is confirmed by the Partner and the respective booking data is transmitted. The Partner must send the client the booking confirmation and ensure the provision of the contracted services."
              : "A comissão torna-se devida após a confirmação da reserva pelo Parceiro e a transmissão dos respetivos dados de reserva. O Parceiro deverá enviar ao cliente a confirmação da reserva e assegurar a prestação dos serviços contratados."}
          </p>
          <p className="mb-6">
            {isEn
              ? "If a booking cannot be fulfilled for justified reasons, the Partner must inform HelloCamp as soon as possible. In case of cancellation by the client, the conditions set out in Annex 3 – Booking Cancellation will apply."
              : "Caso uma reserva não possa ser realizada por motivos devidamente justificados, nomeadamente indisponibilidade da atividade ou não verificação das condições mínimas de realização, o Parceiro deverá informar a HelloCamp com a maior brevidade possível. Em caso de cancelamento por iniciativa do cliente ou desistência, aplicar-se-ão as condições previstas no Anexo 3 – Cancelamento de Reservas."}
          </p>

          <h4 className="font-bold text-slate-900 font-sans">
            {isEn
              ? "Article 2 – Payment Conditions"
              : "Artigo 2.º – Condições de Pagamento"}
          </h4>
          <p className="mb-6">
            {isEn
              ? "Commissions due to HelloCamp will be invoiced or automatically split via Stripe Connect according to the agreed payment model. The Partner commits to settling invoices within the stated deadlines. Agreed amounts include VAT or other applicable taxes."
              : "As comissões devidas à HelloCamp serão faturadas ou deduzidas automaticamente via Stripe Connect de acordo com o modelo de pagamento acordado entre as partes. O Parceiro compromete-se a liquidar eventuais faturas emitidas pela HelloCamp dentro dos prazos nelas indicados. Os valores acordados incluem IVA ou outros impostos legalmente aplicáveis."}
          </p>

          <h4 className="font-bold text-slate-900 font-sans">
            {isEn
              ? "Article 3 – Partner Obligations"
              : "Artigo 3.º – Obrigações do Parceiro"}
          </h4>
          <p>
            {isEn
              ? "The Partner commits to providing HelloCamp with all necessary information to promote activities, including descriptions, prices, availability, photos, and relevant content. The Partner guarantees they hold all necessary rights for the provided content, including copyrights and image rights."
              : "O Parceiro compromete-se a fornecer à HelloCamp todas as informações necessárias à divulgação das suas atividades, incluindo descrições, preços, disponibilidade, fotografias e demais conteúdos relevantes. O Parceiro garante que possui todos os direitos necessários sobre os conteúdos disponibilizados à HelloCamp, incluindo direitos de autor, direitos de imagem e demais autorizações legalmente exigidas."}
          </p>
          <p>
            {isEn
              ? "HelloCamp may use the content provided by the Partner for promotion and marketing on the platform and communication channels. Prices advertised on HelloCamp must not exceed prices practiced by the Partner for direct bookings."
              : "A HelloCamp poderá utilizar os conteúdos fornecidos pelo Parceiro para efeitos de promoção, comercialização e divulgação das atividades na plataforma e nos seus canais de comunicação. Os preços divulgados na plataforma HelloCamp não poderão ser superiores aos preços praticados pelo Parceiro para reservas diretas da mesma atividade."}
          </p>
          <p className="mb-6">
            {isEn
              ? "The Partner commits to immediately informing HelloCamp of any changes regarding activities, prices, or conditions, as well as any changes to their general terms and conditions."
              : "O Parceiro compromete-se a informar imediatamente a HelloCamp de quaisquer alterações relativas às suas atividades, incluindo preços, disponibilidade, programas, condições de participação ou alterações aos seus termos e condições gerais."}
          </p>

          <h4 className="font-bold text-slate-900 font-sans">
            {isEn
              ? "Article 4 – Duration and Renewal"
              : "Artigo 4.º – Duração e Renovação"}
          </h4>
          <p className="mb-6">
            {isEn
              ? "This contract is effective from the date of signature by both parties until the end of the calendar year. It automatically renews for successive one-year periods unless terminated in writing at least 30 days prior."
              : "O presente contrato produz efeitos a partir da data da sua assinatura por ambas as partes e mantém-se válido até ao final do respetivo ano civil. O contrato será automaticamente renovado por períodos sucessivos de um ano, salvo denúncia por qualquer das partes comunicada por escrito com uma antecedência mínima de 30 dias relativamente ao termo do período contratual em curso."}
          </p>

          <h4 className="font-bold text-slate-900 font-sans">
            {isEn
              ? "Article 5 – Severability Clause"
              : "Artigo 5.º – Cláusula de Separabilidade"}
          </h4>
          <p className="mb-6">
            {isEn
              ? "The invalidity of any provision of this contract shall not affect the validity of the remaining clauses, which shall remain in full force."
              : "A eventual invalidade, nulidade ou inaplicabilidade de qualquer disposição do presente contrato não prejudica a validade das restantes cláusulas, que permanecerão plenamente em vigor."}
          </p>

          <h4 className="font-bold text-slate-900 font-sans">
            {isEn
              ? "Article 6 – Limitation of Liability and Insurance"
              : "Artigo 6.º – Limitação de Responsabilidade e Seguros"}
          </h4>
          <p>
            {isEn
              ? "HelloCamp acts exclusively as an intermediary booking platform. HelloCamp assumes no civil, criminal, or contractual liability for any accidents, damages, incidents, or disputes that may occur during the activities, involving participants, monitors, or third parties."
              : "A HelloCamp atua exclusivamente como plataforma intermediária e motor de busca. A HelloCamp não assume qualquer responsabilidade civil, criminal ou contratual por eventuais acidentes, danos, incidentes ou disputas que ocorram durante a realização das atividades, envolvendo os participantes, monitores ou terceiros."}
          </p>
          <p className="mb-6">
            {isEn
              ? "The Partner is solely and exclusively responsible for the provision of services and the safety of the participants, guaranteeing that they hold all legally mandatory insurance (including civil liability and personal accident), licenses, and staff criminal record checks required to carry out their activity."
              : "O Parceiro é o único e exclusivo responsável pela prestação dos serviços e pela segurança dos participantes, garantindo que possui todos os seguros obrigatórios por lei (incluindo responsabilidade civil e acidentes pessoais), licenças, alvarás e verificação de registos criminais de monitores exigidos para o exercício da sua atividade."}
          </p>

          <h4 className="font-bold text-slate-900 font-sans">
            {isEn
              ? "Article 7 – Digital Signature and Evidence Agreement"
              : "Artigo 7.º – Validade da Assinatura e Convenção de Prova"}
          </h4>
          <p>
            {isEn
              ? "The parties expressly acknowledge the validity and binding force of the acceptance of this contract through electronic means (namely by typing the legal representative's name and checking the acceptance box on the web portal)."
              : "As partes reconhecem expressamente a validade e a força vinculativa da aceitação do presente contrato através de meios eletrónicos (designadamente a aposição do nome do representante legal e seleção da caixa de aceitação no portal web da HelloCamp)."}
          </p>
          <p className="mb-6">
            {isEn
              ? "Under the freedom of probatory stipulation, the parties agree that the computer records collected by HelloCamp (including IP address, session data, typed name, and timestamp) constitute fully valid and sufficient evidence to attest to the authorship, integrity, and irrevocable acceptance of these clauses. The Partner waives the right to invoke the nullity of the contract based on the absence of a handwritten signature or qualified electronic signature."
              : "Ao abrigo da liberdade de estipulação probatória, as partes convencionam que os registos informáticos recolhidos pela HelloCamp (incluindo o endereço IP, dados de sessão, nome digitado e timestamp) constituem meio de prova plenamente válido e suficiente para atestar a autoria, a integridade e a aceitação irrevogável das presentes cláusulas operacionais e financeiras, renunciando o Parceiro a invocar a nulidade ou ineficácia do contrato com fundamento na ausência de assinatura autógrafa ou de assinatura eletrónica qualificada."}
          </p>
        </div>

        <div className="h-px bg-slate-200 w-full my-10"></div>

        {/* =================================================================== */}
        {/* ANEXOS 1, 2, 3 E 4 COMPLETOS                                        */}
        {/* =================================================================== */}
        <div className="space-y-8 font-sans text-xs sm:text-sm text-slate-800">
          {/* ANEXO 1 */}
          <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border border-slate-200">
            <h3 className="font-black text-base sm:text-lg mb-3 text-slate-900 uppercase border-l-4 border-[#EBA914] pl-3">
              {isEn
                ? "Annex 1 – Booking Procedure & Integration"
                : "Anexo 1 – Procedimento de Reserva e Operação"}
            </h3>
            <p className="mb-5 text-slate-600">
              {isEn
                ? "Select the booking management modality applicable to your partnership."
                : "Selecione a modalidade de gestão de reservas aplicável à sua parceria com a HelloCamp."}
            </p>

            <div className="space-y-3">
              <label
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                  modoEdicao ? "cursor-pointer" : "cursor-default"
                } ${
                  form.modalidadeReserva === "direta"
                    ? "bg-white border-[#167524] shadow-sm"
                    : "border-transparent hover:bg-slate-100/70"
                }`}
              >
                <input
                  type="radio"
                  name="anexo1"
                  disabled={!modoEdicao}
                  required
                  value="direta"
                  checked={form.modalidadeReserva === "direta"}
                  onChange={(e) =>
                    setForm({ ...form, modalidadeReserva: e.target.value })
                  }
                  className="mt-1 w-4 h-4 accent-[#167524] flex-shrink-0"
                />
                <div>
                  <strong className="block text-slate-900 mb-1">
                    {isEn
                      ? "Direct Booking with Automatic Payment (Recommended)"
                      : "Reserva Direta no Checkout (Recomendado)"}
                  </strong>
                  <span className="text-slate-600 leading-relaxed block">
                    {isEn
                      ? "Bookings made through HelloCamp will be registered directly in the Partner's dashboard. HelloCamp is entitled to the agreed commission on each completed booking."
                      : "As reservas efetuadas através da plataforma HelloCamp serão registadas diretamente no painel do Parceiro. Nesta modalidade, a HelloCamp terá direito à comissão acordada sobre cada reserva concluída. O formulário de reserva recolhe todas as informações médicas e logísticas necessárias para a correta gestão das inscrições."}
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                  modoEdicao ? "cursor-pointer" : "cursor-default"
                } ${
                  form.modalidadeReserva === "email"
                    ? "bg-white border-[#167524] shadow-sm"
                    : "border-transparent hover:bg-slate-100/70"
                }`}
              >
                <input
                  type="radio"
                  name="anexo1"
                  disabled={!modoEdicao}
                  required
                  value="email"
                  checked={form.modalidadeReserva === "email"}
                  onChange={(e) =>
                    setForm({ ...form, modalidadeReserva: e.target.value })
                  }
                  className="mt-1 w-4 h-4 accent-[#167524] flex-shrink-0"
                />
                <div>
                  <strong className="block text-slate-900 mb-1">
                    {isEn
                      ? "Email Communication (Booking Upon Request)"
                      : "Comunicação por E-mail (Reserva Sob Consulta)"}
                  </strong>
                  <span className="text-slate-600 leading-relaxed block">
                    {isEn
                      ? "HelloCamp will send the Partner an email with all necessary booking details. The Partner has 2 business days to reject a booking. Without a response, it is considered accepted."
                      : "A HelloCamp enviará ao Parceiro, por correio eletrónico, todas as informações necessárias para a gestão da reserva, incluindo os dados do participante e do encarregado de educação. O Parceiro dispõe de 2 (dois) dias úteis para comunicar à HelloCamp a rejeição de uma reserva por motivo devidamente justificado. Na ausência de resposta dentro deste prazo, a reserva considerar-se-á aceite, sendo aplicável a comissão prevista no contrato."}
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                  modoEdicao ? "cursor-pointer" : "cursor-default"
                } ${
                  form.modalidadeReserva === "link_externo"
                    ? "bg-white border-[#167524] shadow-sm"
                    : "border-transparent hover:bg-slate-100/70"
                }`}
              >
                <input
                  type="radio"
                  name="anexo1"
                  disabled={!modoEdicao}
                  required
                  value="link_externo"
                  checked={form.modalidadeReserva === "link_externo"}
                  onChange={(e) =>
                    setForm({ ...form, modalidadeReserva: e.target.value })
                  }
                  className="mt-1 w-4 h-4 accent-[#167524] flex-shrink-0"
                />
                <div className="w-full">
                  <strong className="block text-slate-900 mb-1">
                    {isEn
                      ? "External Form or Link (e.g., Google Forms / Own Website)"
                      : "Formulário ou Link Externo (ex: Google Forms / Site Próprio)"}
                  </strong>
                  <span className="text-slate-600 leading-relaxed block mb-3">
                    {isEn
                      ? "Clients register their interest on HelloCamp and are redirected to the external link below to complete the booking. HelloCamp records the customer's name, email, and phone number (the lead) and emails this data to the Partner, with HelloCamp in CC to ensure transparency."
                      : "O tráfego gerado pela HelloCamp é redirecionado para um link externo. Para garantir transparência e evitar omissões, antes de reencaminhar o cliente, a HelloCamp recolhe a intenção de reserva (Lead: Nome, Email e Telefone do potencial cliente). Estes dados da Lead são enviados automaticamente para o Parceiro com conhecimento (em CC) à HelloCamp. O Parceiro compromete-se sob compromisso de honra a ser verdadeiro na comunicação mensal sobre quais destes clientes efetivamente finalizaram a inscrição do seu lado."}
                  </span>

                  {form.modalidadeReserva === "link_externo" && (
                    <div className="bg-slate-50 border border-slate-300 p-4 rounded-xl mt-2 w-full">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                        {isEn
                          ? "Insert External Link (URL) *"
                          : "Insira o Link Externo Oficial (URL) *"}
                      </label>
                      <input
                        type="url"
                        disabled={!modoEdicao}
                        required
                        placeholder="https://..."
                        className={inputContractClass}
                        value={form.linkExternoReserva}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            linkExternoReserva: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* ANEXOS 2 E 3 */}
          {form.modalidadeReserva !== "link_externo" && (
            <>
              <div className="bg-blue-50/70 p-5 md:p-6 rounded-2xl border border-blue-200">
                <h3 className="font-black text-base sm:text-lg mb-3 text-blue-950 uppercase border-l-4 border-blue-600 pl-3">
                  {isEn
                    ? "Annex 2 – Payment and Commission Split"
                    : "Anexo 2 – Pagamento e Comissão"}
                </h3>
                <p className="mb-5 text-blue-900 leading-relaxed">
                  {isEn
                    ? "The Partner authorizes HelloCamp to process payments via Stripe Connect. The agreed commission is automatically deducted upon transaction, and the remaining net balance is transferred directly to the Partner's connected bank account."
                    : "O Parceiro autoriza a HelloCamp a processar os pagamentos através da plataforma segura Stripe Connect. O valor da comissão acordada é deduzido automaticamente no ato da transação, sendo o montante líquido remanescente transferido diretamente para a conta bancária vinculada pelo Parceiro."}
                </p>

                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      modoEdicao ? "cursor-pointer" : "cursor-default"
                    } ${
                      form.tipoPagamento === "100_total"
                        ? "bg-white border-blue-600 shadow-sm"
                        : "border-transparent hover:bg-blue-100/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="anexo2"
                      disabled={!modoEdicao}
                      required
                      value="100_total"
                      checked={form.tipoPagamento === "100_total"}
                      onChange={(e) =>
                        setForm({ ...form, tipoPagamento: e.target.value })
                      }
                      className="mt-1 w-4 h-4 accent-blue-600 flex-shrink-0"
                    />
                    <div>
                      <strong className="block text-blue-950 mb-1">
                        {isEn
                          ? "100% Paid at Booking (Immediate Payment)"
                          : "100% Pago no Ato da Reserva (Pagamento Imediato)"}
                      </strong>
                      <span className="text-blue-800 leading-relaxed block">
                        {isEn
                          ? "The client pays the full program amount immediately to secure the spot."
                          : "O cliente liquida a totalidade do valor do programa no checkout para assegurar a vaga de imediato."}
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      modoEdicao ? "cursor-pointer" : "cursor-default"
                    } ${
                      form.tipoPagamento === "50_sinal"
                        ? "bg-white border-blue-600 shadow-sm"
                        : "border-transparent hover:bg-blue-100/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="anexo2"
                      disabled={!modoEdicao}
                      required
                      value="50_sinal"
                      checked={form.tipoPagamento === "50_sinal"}
                      onChange={(e) =>
                        setForm({ ...form, tipoPagamento: e.target.value })
                      }
                      className="mt-1 w-4 h-4 accent-blue-600 flex-shrink-0"
                    />
                    <div>
                      <strong className="block text-blue-950 mb-1">
                        {isEn
                          ? "50% Deposit Now + 50% One Week Before"
                          : "Sinal de 50% Agora + 50% 1 Semana Antes"}
                      </strong>
                      <span className="text-blue-800 leading-relaxed block">
                        {isEn
                          ? "The client pays a 50% deposit upon booking and settles the remaining 50% up to 7 days before the camp starts."
                          : "O encarregado de educação paga 50% no ato da inscrição e liquida os restantes 50% até 7 dias antes do início do programa."}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-amber-50/80 p-5 md:p-6 rounded-2xl border border-amber-200">
                <h3 className="font-black text-base sm:text-lg mb-3 text-amber-950 uppercase border-l-4 border-amber-500 pl-3">
                  {isEn
                    ? "Annex 3 – Cancellation and Refund Policy"
                    : "Anexo 3 – Política de Cancelamento e Reembolso"}
                </h3>
                <p className="mb-5 text-amber-900 leading-relaxed">
                  {isEn
                    ? "The selected option sets refund rules for parents. HelloCamp's commission adjusts proportionally to the amount retained."
                    : "A opção selecionada ditará as regras de reembolso para os pais na plataforma. A comissão devida à HelloCamp será sempre ajustada proporcionalmente ao montante que o Parceiro retiver do cliente em caso de desistência."}
                </p>

                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      modoEdicao ? "cursor-pointer" : "cursor-default"
                    } ${
                      form.politicaCancelamento.includes("Flexível")
                        ? "bg-white border-amber-500 shadow-sm"
                        : "border-transparent hover:bg-amber-100/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="anexo3"
                      disabled={!modoEdicao}
                      required
                      value="Flexível (Reembolso a 100% até 7 dias antes)"
                      checked={form.politicaCancelamento.includes("Flexível")}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          politicaCancelamento: e.target.value,
                        })
                      }
                      className="mt-1 w-4 h-4 accent-amber-600 flex-shrink-0"
                    />
                    <div>
                      <strong className="block text-amber-950 mb-1">
                        {isEn
                          ? "Flexible (100% refund up to 7 days prior)"
                          : "Flexível (Reembolso a 100% até 7 dias antes)"}
                      </strong>
                      <span className="text-amber-800 leading-relaxed block">
                        {isEn
                          ? "HelloCamp will not charge commission on bookings canceled at least 7 days before the start date. Full refund is issued to the parent."
                          : "A HelloCamp não cobrará qualquer comissão sobre reservas canceladas pelo cliente até 7 (sete) dias antes do início da atividade, sendo reembolsada a totalidade ao encarregado de educação. Cancelamentos após este prazo não conferem direito a reembolso."}
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      modoEdicao ? "cursor-pointer" : "cursor-default"
                    } ${
                      form.politicaCancelamento.includes("Moderada")
                        ? "bg-white border-amber-500 shadow-sm"
                        : "border-transparent hover:bg-amber-100/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="anexo3"
                      disabled={!modoEdicao}
                      required
                      value="Moderada (Reembolso a 50% até 15 dias antes)"
                      checked={form.politicaCancelamento.includes("Moderada")}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          politicaCancelamento: e.target.value,
                        })
                      }
                      className="mt-1 w-4 h-4 accent-amber-600 flex-shrink-0"
                    />
                    <div>
                      <strong className="block text-amber-950 mb-1">
                        {isEn
                          ? "Moderate (50% refund up to 15 days prior)"
                          : "Moderada (Reembolso a 50% até 15 dias antes)"}
                      </strong>
                      <span className="text-amber-800 leading-relaxed block">
                        {isEn
                          ? "If canceled up to 15 days prior, the client receives a 50% refund and HelloCamp's commission is reduced proportionally."
                          : "Em caso de cancelamento até 15 dias antes do início, o cliente recebe 50% do valor pago, sendo a comissão da HelloCamp reduzida proporcionalmente. Cancelamentos a menos de 15 dias não conferem direito a reembolso."}
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                      modoEdicao ? "cursor-pointer" : "cursor-default"
                    } ${
                      form.politicaCancelamento.includes("Estrita")
                        ? "bg-white border-amber-500 shadow-sm"
                        : "border-transparent hover:bg-amber-100/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="anexo3"
                      disabled={!modoEdicao}
                      required
                      value="Estrita (Sem reembolso após reserva)"
                      checked={form.politicaCancelamento.includes("Estrita")}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          politicaCancelamento: e.target.value,
                        })
                      }
                      className="mt-1 w-4 h-4 accent-amber-600 flex-shrink-0"
                    />
                    <div>
                      <strong className="block text-amber-950 mb-1">
                        {isEn
                          ? "Strict (No refunds after booking)"
                          : "Estrita (Sem reembolso após reserva)"}
                      </strong>
                      <span className="text-amber-800 leading-relaxed block">
                        {isEn
                          ? "Bookings are final and non-refundable. HelloCamp's commission is due in full as the Partner's revenue is guaranteed."
                          : "As reservas efetuadas são finais e não reembolsáveis em caso de cancelamento por iniciativa do cliente, ficando a receita do Parceiro garantida."}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* ANEXO 4 */}
          <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border border-slate-200">
            <h3 className="font-black text-base sm:text-lg mb-2 text-slate-900 uppercase border-l-4 border-slate-400 pl-3">
              {isEn
                ? "Annex 4 – Extraordinary Agreements"
                : "Anexo 4 – Acordos Extraordinários"}
            </h3>
            <p className="mb-3 text-slate-600 font-medium">
              {isEn
                ? "Supplementary clauses pre-agreed between the parties (optional):"
                : "Alterações ou condições especiais pré-acordadas ao contrato-modelo (opcional):"}
            </p>
            <textarea
              disabled={!modoEdicao}
              rows={3}
              value={form.acordosComplementares}
              onChange={(e) =>
                setForm({ ...form, acordosComplementares: e.target.value })
              }
              placeholder={
                isEn
                  ? "Insert pre-agreed exception clauses, or leave blank."
                  : "Insira cláusulas de exceção pré-acordadas com a equipa HelloCamp, ou deixe em branco."
              }
              className={inputContractClass}
            />
          </div>
        </div>

        {/* =================================================================== */}
        {/* BLOCO DE ASSINATURAS FINAIS                                         */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mt-12 pt-10 border-t-2 border-slate-900 font-sans">
          <div>
            <h4 className="font-black mb-4 uppercase tracking-wider text-slate-900 text-xs sm:text-sm">
              {isEn
                ? "For the First Party (HelloCamp)"
                : "Pela Primeira Outorgante (HelloCamp)"}
            </h4>
            <p className="font-serif text-xl italic text-slate-700 mb-2">
              Administração HelloCamp Portugal
            </p>
            <p className="text-xs font-bold text-slate-500 border-t border-slate-200 mt-4 pt-3">
              {isEn ? "Date:" : "Data:"} {dataFormatada} •{" "}
              <span className="text-[#167524]">
                {isEn ? "Validated by HQ" : "Validado pela Sede"}
              </span>
            </p>
          </div>

          <div>
            <h4 className="font-black mb-4 uppercase tracking-wider text-slate-900 text-xs sm:text-sm">
              {isEn
                ? "For the Second Party (The Partner)"
                : "Pela Segunda Outorgante (O Parceiro)"}
            </h4>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">
                  {isEn
                    ? "Digital Signature Name *"
                    : "Nome da Assinatura Digital *"}
                </label>
                <input
                  required
                  disabled={!modoEdicao}
                  type="text"
                  className="border-b-2 border-slate-900 bg-transparent outline-none py-2 text-lg sm:text-xl font-serif italic font-bold text-slate-900 focus:border-[#167524] transition-colors disabled:opacity-80"
                  value={form.assinaturaNome}
                  onChange={(e) =>
                    setForm({ ...form, assinaturaNome: e.target.value })
                  }
                  placeholder={
                    isEn ? "Signatory's full name" : "O seu nome completo"
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500">
                  {isEn ? "Legal Role / Position *" : "Cargo Legal *"}
                </label>
                <input
                  required
                  disabled={!modoEdicao}
                  type="text"
                  className="border-b border-slate-300 bg-transparent outline-none py-2 text-sm font-bold text-slate-800 focus:border-slate-900 transition-colors disabled:opacity-80"
                  value={form.assinaturaCargo}
                  onChange={(e) =>
                    setForm({ ...form, assinaturaCargo: e.target.value })
                  }
                  placeholder={
                    isEn
                      ? "Ex: Managing Partner / Director"
                      : "Ex: Sócio-Gerente / Diretor"
                  }
                />
              </div>

              <p className="text-xs font-bold text-slate-500 border-t border-slate-200 mt-4 pt-3">
                {isEn ? "Date:" : "Data:"} {dataFormatada}{" "}
                {form.ipAssinatura ? `• IP: ${form.ipAssinatura}` : ""}
              </p>
            </div>

            <div className="mt-6 bg-emerald-50/70 p-4 border border-emerald-200 rounded-xl">
              <label
                className={`flex items-start gap-3 ${
                  modoEdicao ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!modoEdicao}
                  required
                  checked={form.concordaTermos}
                  onChange={(e) =>
                    setForm({ ...form, concordaTermos: e.target.checked })
                  }
                  className="mt-1 w-5 h-5 accent-[#167524] flex-shrink-0"
                />
                <span className="text-xs text-slate-700 font-bold leading-relaxed">
                  {isEn
                    ? "I declare that I have read and accepted the Global Agreement terms and the Evidence Agreement in Article 7. I confirm I have the legal authority to bind the entity identified above through this digital signature."
                    : "Declaro ter lido e aceite os termos do Contrato Global e a convenção de prova do Artigo 7.º. Confirmo possuir poderes legais para vincular a entidade supra identificada através desta assinatura digital."}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* BOTÃO DE SUBMISSÃO QUANDO EM MODO DE ASSINATURA/EDIÇÃO */}
        {modoEdicao && (
          <div className="mt-10 pt-8 border-t border-slate-200 flex justify-end gap-4 font-sans">
            {jaAssinado && (
              <button
                type="button"
                onClick={() => setModoEdicao(false)}
                className="px-6 py-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-black uppercase tracking-widest text-xs cursor-pointer"
              >
                {isEn ? "Cancel" : "Cancelar"}
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="bg-[#167524] hover:bg-[#115a1b] disabled:bg-slate-400 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl shadow-lg cursor-pointer transition-all"
            >
              {saving
                ? isEn
                  ? "Signing & Activating Camps..."
                  : "A Assinar e Ativar Campos..."
                : isEn
                ? "✓ Sign & Activate Global Contract"
                : "✓ Assinar e Guardar Contrato Global"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import Link from "next/link";
import React from "react";

export default function AssinaturaContratoPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = use(params);
  const router = useRouter();
  
  // Controlo de Língua do Contrato (PT vs EN)
  const [contractLang, setContractLang] = useState<'pt' | 'en'>(lang === 'pt' ? 'pt' : 'en');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [campoNome, setCampoNome] = useState<string>("Vários Programas");
  const [jaAssinado, setJaAssinado] = useState(false);
  const [pdfGeradoUrl, setPdfGeradoUrl] = useState<string | null>(null);

  // Estados de Segurança (Gatekeeper)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [authError, setAuthError] = useState("");

  // Estados Editáveis do Parceiro (Fiscais e Pessoais)
  const [empresaNome, setEmpresaNome] = useState("");
  const [nif, setNif] = useState("");
  const [pessoaContacto, setPessoaContacto] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [formaJuridica, setFormaJuridica] = useState("");
  const [morada, setMorada] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [responsavelRGPD, setResponsavelRGPD] = useState("");
  
  // Estados de Assinatura e Password
  const [assinaturaNome, setAssinaturaNome] = useState("");
  const [assinaturaCargo, setAssinaturaCargo] = useState("");
  const [concordaTermos, setConcordaTermos] = useState(false);
  const [novaPassword, setNovaPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estados Operacionais e Financeiros
  const [taxaComissao, setTaxaComissao] = useState(12);
  const [baseComissao, setBaseComissao] = useState("total");
  const [modalidadeReserva, setModalidadeReserva] = useState("direta");
  const [linkExternoReserva, setLinkExternoReserva] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState("100_total");
  const [politicaCancelamento, setPoliticaCancelamento] = useState("Moderada (Reembolso a 50% até 15 dias antes)");
  const [acordosComplementares, setAcordosComplementares] = useState("");

  const labelClass = "text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block";
  const inputClassCustom = "border-b border-slate-400 outline-none bg-transparent px-1 py-1.5 text-base font-bold text-slate-900 placeholder:text-slate-300 w-full focus:border-black focus:bg-white transition-colors rounded-t-sm";
  const selectClass = "w-full py-2.5 px-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-slate-800 transition-all shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[position:right_1rem_center] bg-no-repeat";

  useEffect(() => {
    const fetchPerfil = async () => {
      const { data, error } = await supabase.from("perfis").select("*").eq("id", id).single();

      if (error || !data) {
        alert("Link inválido ou expirado.");
        router.push(`/${lang}`);
        return;
      }

      setPerfil(data);

      const { data: campoData } = await supabase.from("campos").select("nome, contrato_parceiro_url, created_at").eq("organizador_id", id);
      if (campoData && campoData.length > 0) {
        setCampoNome(campoData[0].nome);
        const campoComPdf = campoData.find(c => c.contrato_parceiro_url);
        if (campoComPdf && data.contrato_dados?.assinaturaNome) {
           setJaAssinado(true);
           setPdfGeradoUrl(campoComPdf.contrato_parceiro_url);
        }
      }

      const cd = data.contrato_dados || {};
      
      setEmpresaNome(data.empresa_nome || cd.empresaNome || "");
      setNif(data.nif_empresa || cd.nif || "");
      setPessoaContacto(data.nome_completo || cd.pessoaContacto || "");
      setEmailContacto(data.email || cd.emailContacto || "");
      setTelefone(data.telefone || cd.telefone || "");
      setFormaJuridica(cd.formaJuridica || "");
      setMorada(cd.morada || "");
      setCodigoPostal(cd.codigoPostal || "");
      setResponsavelRGPD(cd.responsavelRGPD || "");
      setAssinaturaNome(cd.assinaturaNome || "");
      setAssinaturaCargo(cd.assinaturaCargo || "");

      setTaxaComissao(data.taxa_comissao !== null && data.taxa_comissao !== undefined ? data.taxa_comissao : 12);
      setBaseComissao(cd.baseComissao || data.base_comissao || 'total');
      setModalidadeReserva(cd.modalidadeReserva || data.modalidade_reserva || 'direta');
      setLinkExternoReserva(cd.linkExternoReserva || data.link_externo_reserva || '');
      setTipoPagamento(cd.tipoPagamento || '100_total');
      setPoliticaCancelamento(cd.politicaCancelamento || 'Moderada (Reembolso a 50% até 15 dias antes)');
      setAcordosComplementares(cd.acordosComplementares || '');

      setLoading(false);
    };

    fetchPerfil();
  }, [id, lang, router]);

  const handleSecurityCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToVerify = inputEmail.trim().toLowerCase();
    const emailBd = perfil?.email?.trim().toLowerCase();
    const emailContactoBd = perfil?.contrato_dados?.emailContacto?.trim().toLowerCase();

    if (emailToVerify === emailBd || emailToVerify === emailContactoBd) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError(
        contractLang === 'pt' 
          ? "O E-mail inserido não corresponde aos registos confidenciais deste parceiro." 
          : "The entered E-mail does not match the confidential records for this partner."
      );
    }
  };

  // ============================================================================
  // GERADOR DE PDF CORPORATIVO COMPLETO (COM CORES DA MARCA E TODOS OS TEXTOS)
  // ============================================================================
  const gerarEGuardarPDF = async (userIP: string, timestamp: string, dataPropostaStr: string) => {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const isPt = contractLang === 'pt';

    // Paleta de Cores HelloCamp
    const blueBrand: [number, number, number] = [14, 58, 104];   // #0E3A68
    const goldBrand: [number, number, number] = [226, 164, 29];  // #e2a41d
    const greenBrand: [number, number, number] = [5, 150, 105];  // #059669
    const slateDark: [number, number, number] = [30, 41, 59];    // #1e293b
    const slateMuted: [number, number, number] = [100, 116, 139];// #64748b

    // 1. BANNER DE TOPO CORPORATIVO
    doc.setFillColor(...blueBrand);
    doc.rect(0, 0, pageWidth, 38, 'F');
    doc.setFillColor(...goldBrand);
    doc.rect(0, 38, pageWidth, 2, 'F');

    // Logótipo HelloCamp Bicolor Centrado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("Hello", pageWidth / 2 - 9, 15, { align: "right" });
    doc.setTextColor(...goldBrand);
    doc.text("Camp", pageWidth / 2 - 9, 15, { align: "left" });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(isPt ? "ACORDO GLOBAL DE INTERMEDIAÇÃO E SERVIÇOS" : "GLOBAL INTERMEDIATION AND SERVICES AGREEMENT", pageWidth / 2, 24, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(191, 219, 254);
    const dataEmissaoFormatada = new Date(timestamp).toLocaleDateString(isPt ? 'pt-PT' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(isPt ? `Documento Oficial • Emitido em ${dataEmissaoFormatada}` : `Official Document • Issued on ${dataEmissaoFormatada}`, pageWidth / 2, 31, { align: "center" });

    let y = 48;

    // 2. RESUMO EXECUTIVO DO ACORDO (OS 4 PONTOS DA PÁGINA)
    doc.setTextColor(...blueBrand);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(isPt ? "ENQUADRAMENTO E PRINCÍPIOS DO ACORDO" : "EXECUTIVE SUMMARY & AGREEMENT PRINCIPLES", 15, y);
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

    // 3. SECÇÃO 1: IDENTIFICAÇÃO DAS PARTES (CAIXAS LADO A LADO)
    doc.setTextColor(...blueBrand);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(isPt ? "1. IDENTIFICAÇÃO DAS PARTES CONTRATANTES" : "1. IDENTIFICATION OF THE CONTRACTING PARTIES", 15, y);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 5;

    // Caixa Esquerda - HelloCamp
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(15, y, 86, 36, 2, 2, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...blueBrand);
    doc.text(isPt ? "PRIMEIRA OUTORGANTE (Plataforma)" : "FIRST PARTY (Platform)", 19, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...slateDark);
    doc.text("Entidade: HelloCamp Portugal", 19, y + 12);
    doc.text("Website Oficial: www.hellocamp.pt", 19, y + 17);
    doc.text("E-mail Oficial: info@hellocamp.pt", 19, y + 22);
    doc.text(isPt ? "Papel: Intermediária Tecnológica e Comercial" : "Role: IT & Commercial Intermediary", 19, y + 27);
    doc.text(isPt ? "Foro e Jurisdição: Comarca de Lisboa, Portugal" : "Jurisdiction: District of Lisbon, Portugal", 19, y + 32);

    // Caixa Direita - Parceiro
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(109, y, 86, 36, 2, 2, 'FD');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...blueBrand);
    doc.text(isPt ? "SEGUNDA OUTORGANTE (Parceiro)" : "SECOND PARTY (Partner)", 113, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...slateDark);
    doc.text(`${empresaNome} (${formaJuridica})`.substring(0, 42), 113, y + 12);
    doc.text(`NIF / Tax ID: ${nif}`, 113, y + 17);
    doc.text(`${morada}, ${codigoPostal}`.substring(0, 42), 113, y + 22);
    doc.text(`Resp: ${pessoaContacto} | Tel: ${telefone}`.substring(0, 42), 113, y + 27);
    doc.text(`E-mail: ${emailContacto} | RGPD: ${responsavelRGPD || pessoaContacto}`.substring(0, 44), 113, y + 32);

    y += 43;

    // 4. SECÇÃO 2: TERMOS OPERACIONAIS E FINANCEIROS
    doc.setTextColor(...blueBrand);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(isPt ? "2. CONDIÇÕES OPERACIONAIS E FINANCEIRAS ACORDADAS" : "2. AGREED OPERATIONAL AND FINANCIAL TERMS", 15, y);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 5;

    const boxHeight = acordosComplementares ? 36 : 28;
    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(15, y, pageWidth - 30, boxHeight, 2, 2, 'FD');

    let baseTexto = baseComissao === "apenas_programa" 
      ? (isPt ? "Apenas sobre Valor Base do Programa" : "Only on Program Base Value") 
      : baseComissao === "sem_comissao" 
      ? (isPt ? "Isento (0%)" : "Exempt (0%)") 
      : (isPt ? "Sobre Valor Total (Programa + Extras)" : "On Total Value (Program + Extras)");

    let modTexto = modalidadeReserva === "direta" 
      ? (isPt ? "Reserva Direta no Checkout (HelloCamp)" : "Direct Checkout Booking (HelloCamp)") 
      : modalidadeReserva === "email" 
      ? (isPt ? "Encaminhamento de Leads via E-mail" : "Lead Forwarding via Email") 
      : (isPt ? "Redirecionamento para Link Externo" : "Redirection to External Link");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...blueBrand);
    doc.text(isPt ? `Taxa de Comissão Fixada: ${taxaComissao}% (IVA incluído)` : `Fixed Commission Rate: ${taxaComissao}% (VAT included)`, 19, y + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...slateDark);
    doc.text(isPt ? `• Base de Incidência: ${baseTexto}` : `• Commission Base: ${baseTexto}`, 19, y + 13);
    doc.text(isPt ? `• Modelo de Integração: ${modTexto}` : `• Integration Model: ${modTexto}`, 19, y + 18);

    if (modalidadeReserva === 'link_externo') {
      doc.text(isPt ? `• Link Oficial de Redirecionamento: ${linkExternoReserva}` : `• Official Redirect URL: ${linkExternoReserva}`, 19, y + 23);
    } else {
      const pagTexto = tipoPagamento === '50_sinal' 
        ? (isPt ? 'Sinal de 50% no ato + 50% antes do início' : '50% Deposit on booking + 50% before start') 
        : (isPt ? '100% cobrado no ato da reserva' : '100% charged upon booking');
      doc.text(isPt ? `• Fluxo de Pagamento (Stripe): ${pagTexto}  |  Política: ${politicaCancelamento}` : `• Payment Flow (Stripe): ${pagTexto}  |  Policy: ${politicaCancelamento}`, 19, y + 23);
    }

    if (acordosComplementares) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(146, 64, 14);
      doc.text(isPt ? `• Acordos Complementares: "${acordosComplementares}"` : `• Complementary Agreements: "${acordosComplementares}"`, 19, y + 31);
    }

    y += boxHeight + 7;

    // 5. SECÇÃO 3: CLÁUSULAS JURÍDICAS E RESPONSABILIDADE LEGAL (TEXTO INTEGRAL)
    doc.setTextColor(...blueBrand);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(isPt ? "3. CLÁUSULAS CONTRATUAIS GERAIS, RESPONSABILIDADE E FORO" : "3. GENERAL CONTRACTUAL CLAUSES, LIABILITY AND JURISDICTION", 15, y);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...slateDark);

    const clausulas = isPt
      ? "A. Responsabilidade Civil e Seguros: A HelloCamp atua de forma estrita como plataforma informática de intermediação e motor de busca. A organização, gestão técnica, supervisão e segurança das atividades são da inteira e exclusiva responsabilidade da Segunda Outorgante (o Parceiro), que se obriga a manter válidos todos os seguros exigidos por lei (Responsabilidade Civil e Acidentes Pessoais) e as respetivas licenças de funcionamento (Ex: RNAAT/RNAVT ou licenças camarárias), isentando a HelloCamp de qualquer litígio com os participantes decorrente da atividade.\n\nB. Proteção de Dados (RGPD): O Parceiro assume o papel de Responsável pelo Tratamento dos dados pessoais, médicos e restrições alimentares fornecidos pela HelloCamp no estrito cumprimento do Regulamento (UE) 2016/679 (RGPD), utilizando-os apenas para a execução do serviço contratado e eliminando-os assim que deixem de ser necessários.\n\nC. Impostos e Faturação: O Parceiro é o exclusivo responsável por determinar e cumprir as obrigações de cobrar, remeter ou incluir nos preços qualquer taxa de IVA, impostos de turismo ou rendimentos sobre as vendas ao cliente final. A HelloCamp emite faturação exclusivamente referente à sua comissão de intermediação.\n\nD. Lei Aplicável e Foro Competente: Independentemente da jurisdição ou país sede do Parceiro, o presente acordo e os Termos e Condições Gerais da plataforma regem-se pela Lei Portuguesa. Qualquer litígio emergente será submetido à competência exclusiva dos tribunais da Comarca de Lisboa (Portugal), com renúncia expressa a qualquer outro."
      : "A. Civil Liability & Insurance: HelloCamp acts strictly as an IT intermediation platform and search engine. The organization, technical management, supervision, and safety of the activities are the entire and exclusive responsibility of the Second Party (the Partner), who is obliged to keep valid all insurance required by law (Civil Liability and Personal Accidents) and operating licenses, exempting HelloCamp from any litigation with participants arising from the camp activity.\n\nB. Data Protection (GDPR): The Partner commits to processing the personal, medical, and dietary restriction data provided by HelloCamp in strict compliance with Regulation (EU) 2016/679 (GDPR), using them only for the execution of the contracted service and deleting them as soon as they are no longer necessary.\n\nC. Taxes and Invoicing: The Partner is solely responsible for determining and fulfilling the obligations to report, collect, remit, or include in the prices any VAT, tourist taxes, or income taxes regarding sales to the final customer. HelloCamp invoices strictly its intermediation commission.\n\nD. Governing Law and Jurisdiction: Regardless of the Partner's headquarters jurisdiction or country, this agreement and the platform's General Terms and Conditions are governed by Portuguese Law. Any dispute arising shall be submitted to the exclusive jurisdiction of the courts of the District of Lisbon (Portugal), with express waiver of any other.";

    const splitClausulas = doc.splitTextToSize(clausulas, pageWidth - 30);
    doc.text(splitClausulas, 15, y);
    y += splitClausulas.length * 3.6 + 6;

    // Declaração de Vinculação
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...greenBrand);
    const declText = isPt
      ? "DECLARAÇÃO DE ACEITAÇÃO: O Parceiro declara sob compromisso de honra que leu e aceita os Termos Operacionais e os Termos e Condições Gerais da HelloCamp, reconhecendo plena validade probatória a esta assinatura eletrónica."
      : "ACCEPTANCE DECLARATION: The Partner declares upon honor having read and accepted the Operational Terms and HelloCamp's General Terms and Conditions, acknowledging full legal validity to this electronic signature.";
    const splitDecl = doc.splitTextToSize(declText, pageWidth - 30);
    doc.text(splitDecl, 15, y);
    y += splitDecl.length * 3.5 + 4;

    // 6. BLOCO DE ASSINATURAS BILATERAIS (HELLO CAMP + PARCEIRO)
    doc.setFillColor(240, 253, 244); // Verde muito suave
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(15, y, pageWidth - 30, 38, 2, 2, 'FD');

    // Coluna 1: Assinatura HelloCamp
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...blueBrand);
    doc.text(isPt ? "PELA PRIMEIRA OUTORGANTE (HELLOCAMP):" : "BY THE FIRST PARTY (HELLOCAMP):", 20, y + 7);
    
    doc.setFont("times", "italic");
    doc.setFontSize(13);
    doc.setTextColor(...slateDark);
    doc.text("Administração HelloCamp Portugal", 20, y + 15);
    doc.setDrawColor(148, 163, 184);
    doc.line(20, y + 17, 95, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...slateMuted);
    const dataPropostaFormatada = new Date(dataPropostaStr).toLocaleDateString(isPt ? 'pt-PT' : 'en-GB');
    doc.text(isPt ? `Cargo: Direção Executiva & Parcerias B2B` : `Role: Executive Board & B2B Partnerships`, 20, y + 22);
    doc.text(isPt ? `Data de Proposta e Envio: ${dataPropostaFormatada}` : `Proposal & Sent Date: ${dataPropostaFormatada}`, 20, y + 27);
    doc.text(isPt ? `Estado: Validado e Aprovado pela Sede (HQ)` : `Status: Validated & Approved by HQ`, 20, y + 32);

    // Coluna 2: Assinatura Parceiro
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...greenBrand);
    doc.text(isPt ? "PELA SEGUNDA OUTORGANTE (PARCEIRO):" : "BY THE SECOND PARTY (PARTNER):", 110, y + 7);

    doc.setFont("times", "italic");
    doc.setFontSize(13);
    doc.setTextColor(...slateDark);
    doc.text(`${assinaturaNome}`.substring(0, 32), 110, y + 15);
    doc.line(110, y + 17, pageWidth - 20, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...slateMuted);
    doc.text(isPt ? `Cargo Legal: ${assinaturaCargo}` : `Legal Role: ${assinaturaCargo}`, 110, y + 22);
    doc.text(isPt ? `Data e Hora: ${new Date(timestamp).toLocaleString('pt-PT')}` : `Timestamp: ${new Date(timestamp).toLocaleString('en-GB')}`, 110, y + 27);
    doc.text(`IP Signatário: ${userIP} • ID: ${id.slice(0, 8)}`, 110, y + 32);

    return doc.output('blob');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concordaTermos) return alert(contractLang === 'pt' ? "Tem de aceitar os termos do contrato." : "You must accept the terms of the contract.");
    if (!assinaturaNome || !assinaturaCargo) return alert(contractLang === 'pt' ? "A assinatura digital é obrigatória." : "The digital signature is mandatory.");
    if (!empresaNome || !nif || !morada) return alert(contractLang === 'pt' ? "Dados Fiscais incompletos." : "Incomplete Fiscal Data.");
    if (novaPassword.length < 6) return alert(contractLang === 'pt' ? "A password deve ter pelo menos 6 caracteres." : "The password must be at least 6 characters long.");
    if (novaPassword !== confirmPassword) return alert(contractLang === 'pt' ? "As passwords não coincidem." : "The passwords do not match.");

    if (modalidadeReserva === 'link_externo' && !linkExternoReserva) {
      alert(contractLang === 'pt' ? "Por favor preencha o Link Externo Oficial." : "Please fill in the Official External Link.");
      return;
    }

    setSubmitting(true);

    let userIP = "Desconhecido";
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (res.ok) {
        const ipData = await res.json();
        userIP = ipData.ip;
      }
    } catch (err) { console.error("Não foi possível capturar o IP.", err); }

    const timestampAtual = new Date().toISOString();
    const dataPropostaOriginal = perfil?.created_at || perfil?.contrato_dados?.dataEnvio || timestampAtual;

    const contratoFinal = {
      empresaNome, nif, pessoaContacto, emailContacto, telefone,
      formaJuridica, morada, codigoPostal, responsavelRGPD,
      taxaComissao, modalidadeReserva, tipoPagamento, politicaCancelamento, linkExternoReserva, baseComissao,
      acordosComplementares, assinaturaNome, assinaturaCargo,
      dataEnvio: dataPropostaOriginal,
      dataSubmissao: timestampAtual, 
      ipAssinatura: userIP
    };

    try {
      const pdfBlob = await gerarEGuardarPDF(userIP, timestampAtual, dataPropostaOriginal);
      const pdfFile = new File([pdfBlob], `contrato.pdf`, { type: "application/pdf" });

      const formData = new FormData();
      formData.append('id', id);
      formData.append('email', inputEmail);
      formData.append('lang', contractLang);
      formData.append('contratoDados', JSON.stringify(contratoFinal));
      formData.append('password', novaPassword);
      formData.append('pdf', pdfFile);

      const response = await fetch('/api/contratos/assinar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ocorreu um erro ao processar a assinatura.");
      }

      if (result.loginReady) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: inputEmail,
          password: novaPassword,
        });

        if (!signInError) {
          router.push(`/${lang}/admin/dashboard`);
          return;
        }
      }

      setJaAssinado(true);
      setPdfGeradoUrl(result.url);
      
    } catch (err: any) {
      alert("Erro: " + err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest animate-pulse bg-slate-50">A carregar documento seguro... / Loading secure document...</div>;

  // ==========================================
  // VIEW 1: ECRÃ DE SEGURANÇA (GATEKEEPER)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-yellow-200">
        <div className="absolute top-6 right-6 flex bg-slate-200 p-1 rounded-lg border border-slate-300">
          <button onClick={() => setContractLang('pt')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${contractLang === 'pt' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>PT</button>
          <button onClick={() => setContractLang('en')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${contractLang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>EN</button>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-[#0E3A68] p-8 text-center relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[50px] opacity-30 -translate-y-1/2 translate-x-1/4"></div>
            <div className="text-2xl font-black tracking-tighter mb-4 font-sans relative z-10">
              <span className="text-white">Hello</span><span className="text-[#e2a41d]">Camp</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight relative z-10">
              {contractLang === 'pt' ? 'Verificação de Segurança' : 'Security Verification'}
            </h1>
          </div>
          
          <form onSubmit={handleSecurityCheck} className="p-8">
            <p className="text-sm font-medium text-slate-500 mb-6 text-center leading-relaxed">
              {contractLang === 'pt' 
                ? 'Para aceder a este documento confidencial e assinar o Acordo Operacional, introduza o e-mail de contacto registado na sua conta.' 
                : 'To access this confidential document and sign the Operational Agreement, please enter the contact e-mail registered in your account.'}
            </p>
            
            <div className="mb-6">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                {contractLang === 'pt' ? 'O seu E-mail' : 'Your E-mail'}
              </label>
              <input 
                type="email" 
                required 
                value={inputEmail}
                onChange={e => setInputEmail(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white transition-colors shadow-inner" 
                placeholder="email@empresa.com" 
              />
              {authError && <p className="text-xs font-bold text-red-600 mt-3 bg-red-50 p-3 rounded-lg border border-red-100">{authError}</p>}
            </div>

            <button type="submit" className="w-full py-4 text-sm uppercase tracking-widest font-black rounded-xl border-none text-white bg-[#0E3A68] hover:bg-[#0b2b4d] transition-all shadow-xl shadow-[#0E3A68]/30 hover:-translate-y-1 cursor-pointer">
              {contractLang === 'pt' ? 'Aceder ao Contrato' : 'Access Contract'}
            </button>
            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>🔒</span> {contractLang === 'pt' ? 'Acesso Restrito e Protegido' : 'Secure Restricted Access'}
            </div>
          </form>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 2: ECRÃ DE ASSINATURA / CONTRATO COMPLETO
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-900 selection:bg-yellow-200">
      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden relative">
        
        {/* CABEÇALHO DO CONTRATO COM TOGGLE DE LÍNGUA */}
        <div className="bg-[#0E3A68] p-10 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-4 right-6 z-20 flex bg-blue-900/50 p-1 rounded-lg border border-blue-400/30">
            <button type="button" onClick={() => setContractLang('pt')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${contractLang === 'pt' ? 'bg-white text-[#0E3A68]' : 'text-white hover:bg-blue-800'}`}>PT</button>
            <button type="button" onClick={() => setContractLang('en')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${contractLang === 'en' ? 'bg-white text-[#0E3A68]' : 'text-white hover:bg-blue-800'}`}>EN</button>
          </div>

          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-30 -translate-y-1/2 -translate-x-1/4"></div>
          
          <div className="text-3xl md:text-4xl font-black tracking-tighter mb-8 font-sans flex justify-center items-center relative z-10">
            <span className="text-white">Hello</span><span className="text-[#e2a41d]">Camp</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white m-0 tracking-tight relative z-10 border-b border-white/20 inline-block pb-3">
            {contractLang === 'pt' ? 'Acordo de Intermediação Global' : 'Global Intermediation Agreement'}
          </h1>
          <p className="text-blue-100 mt-4 font-medium relative z-10 max-w-lg mx-auto">
            {contractLang === 'pt' ? 'Valide os termos operacionais e preencha os seus dados fiscais para dar início à parceria comercial.' : 'Review the operational terms and fill in your legal details to initiate the commercial partnership.'}
          </p>
        </div>

        {jaAssinado ? (
          <div className="p-10 md:p-16 text-center font-serif">
             <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
             <h2 className="text-2xl font-black text-emerald-900 mb-2">{contractLang === 'pt' ? 'Contrato Válido e Assinado' : 'Contract Signed Successfully'}</h2>
             <p className="text-emerald-700 text-lg mb-8">{contractLang === 'pt' ? 'O seu perfil e os seus programas encontram-se agora ativos e visíveis para as famílias na plataforma HelloCamp.' : 'Your profile and programs are now active and visible to families on the HelloCamp platform.'}</p>
             {pdfGeradoUrl && (
               <a href={pdfGeradoUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black px-8 py-4 rounded-xl shadow-md transition-colors font-sans uppercase tracking-widest text-sm no-underline">
                 {contractLang === 'pt' ? 'Fazer Download do PDF Assinado' : 'Download Signed PDF'}
               </a>
             )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-12">

            {/* RESUMO EXECUTIVO VISUAL COMPLETO (4 PONTOS) */}
            <div className="space-y-8 md:space-y-12 mb-10 md:mb-16 font-sans">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">📝</div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2 flex items-center">
                    <span className="text-slate-400 mr-3 text-sm">1.</span>
                    {contractLang === 'pt' ? 'Objeto do Acordo' : 'Object of the Agreement'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed m-0">
                    {contractLang === 'pt' ? 'O presente acordo estabelece os termos e condições aplicáveis à intermediação e promoção comercial das atividades organizadas pelo Parceiro através da plataforma HelloCamp. O acordo mantém-se válido até ao final do ano civil em curso, sendo automaticamente renovado, salvo denúncia.' : 'This agreement establishes the terms and conditions applicable to the intermediation and commercial promotion of the activities organized by the Partner through the HelloCamp platform. The agreement remains valid until the end of the current calendar year, being automatically renewed unless terminated.'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 text-blue-600 border border-blue-100 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">🚀</div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2 flex items-center">
                    <span className="text-slate-400 mr-3 text-sm">2.</span>
                    {contractLang === 'pt' ? 'Obrigações e Divulgação' : 'Obligations and Promotion'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed m-0">
                    {contractLang === 'pt' ? 'A HelloCamp obriga-se a disponibilizar a infraestrutura tecnológica para a publicação das ofertas. O Parceiro garante a veracidade e a titularidade legal de todos os conteúdos, imagens e programas partilhados para promoção.' : 'HelloCamp undertakes to provide the technological infrastructure for publishing the offers. The Partner guarantees the accuracy and legal ownership of all content, images, and programs shared for promotion.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-50 text-amber-600 border border-amber-100 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">💻</div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2 flex items-center">
                    <span className="text-slate-400 mr-3 text-sm">3.</span>
                    {contractLang === 'pt' ? 'Gestão de Reservas' : 'Booking Management'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed m-0">
                    {contractLang === 'pt' ? 'A plataforma atua como canal facilitador, cabendo ao Parceiro a inteira responsabilidade pela execução do serviço, bem como a prestação de todas as garantias de segurança e conformidade legal perante o cliente final.' : 'The platform acts as a facilitating channel, with the Partner bearing full responsibility for the execution of the service, as well as providing all safety and legal compliance guarantees to the final customer.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">€</div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2 flex items-center">
                    <span className="text-slate-400 mr-3 text-sm">4.</span>
                    {contractLang === 'pt' ? 'Condições Financeiras' : 'Financial Conditions'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed m-0">
                    {contractLang === 'pt' ? 'A remuneração devida à HelloCamp incide exclusivamente sobre o sucesso da intermediação. Os detalhes operacionais e as modalidades de pagamento encontram-se fixados e editáveis no Anexo Financeiro do presente documento.' : 'The remuneration due to HelloCamp is based exclusively on the success of the intermediation. The operational details and payment methods are set out and editable in the Financial Annex of this document.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-300 w-full my-8 md:my-12"></div>

            {/* 1. IDENTIFICAÇÃO DAS PARTES (HELLO CAMP + PARCEIRO EDITÁVEL) */}
            <section className="mb-12">
              <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 tracking-tight">1. {contractLang === 'pt' ? 'Identificação das Partes e Dados Fiscais' : 'Identification of the Parties & Billing Data'}</h2>
              
              {/* Bloco Fixo da Primeira Outorgante (HelloCamp) */}
              <div className="bg-[#0E3A68]/5 p-5 rounded-2xl border border-[#0E3A68]/15 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0E3A68] block mb-1">
                    {contractLang === 'pt' ? 'Primeira Outorgante (Plataforma)' : 'First Party (Platform)'}
                  </span>
                  <p className="text-sm font-black text-slate-900 m-0">HelloCamp Portugal — Plataforma Digital de Intermediação</p>
                  <p className="text-xs font-medium text-slate-600 m-0 mt-0.5">Website: www.hellocamp.pt • E-mail: info@hellocamp.pt • Foro: Comarca de Lisboa</p>
                </div>
                <span className="bg-white text-[#0E3A68] border border-[#0E3A68]/20 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shrink-0">
                  ✓ Proponente Oficial
                </span>
              </div>

              {/* Bloco Editável da Segunda Outorgante (Parceiro) */}
              <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 shadow-inner font-sans">
                <div className="md:col-span-2">
                  <label className={labelClass}>{contractLang === 'pt' ? 'Segunda Outorgante: Entidade Organizadora / Nome Fiscal *' : 'Second Party: Organizing Entity / Legal Name *'}</label>
                  <input required value={empresaNome} onChange={e => setEmpresaNome(e.target.value)} className={inputClassCustom} placeholder={contractLang === 'pt' ? "Designação da sua entidade" : "Legal Entity Name"} />
                </div>

                <div>
                  <label className={labelClass}>{contractLang === 'pt' ? 'NIF (Tax ID) *' : 'Tax ID / VAT Number *'}</label>
                  <input required value={nif} onChange={e => setNif(e.target.value)} className={inputClassCustom} placeholder="Tax Identification Number" />
                </div>
                
                <div>
                  <label className={labelClass}>{contractLang === 'pt' ? 'Forma Jurídica *' : 'Legal Form / Company Type *'}</label>
                  <input required value={formaJuridica} onChange={e => setFormaJuridica(e.target.value)} className={inputClassCustom} placeholder={contractLang === 'pt' ? "Ex: Lda, Associação, LLC" : "LLC, Inc, Association"} />
                </div>
                
                <div className="md:col-span-2">
                  <label className={labelClass}>{contractLang === 'pt' ? 'Morada Fiscal Completa *' : 'Full Registered Address *'}</label>
                  <input required value={morada} onChange={e => setMorada(e.target.value)} className={inputClassCustom} placeholder={contractLang === 'pt' ? "Rua, Número, Cidade, País" : "Street, Number, City, Country"} />
                </div>

                <div>
                  <label className={labelClass}>{contractLang === 'pt' ? 'Código Postal *' : 'Zip / Postal Code *'}</label>
                  <input required value={codigoPostal} onChange={e => setCodigoPostal(e.target.value)} className={inputClassCustom} placeholder="0000-000" />
                </div>

                <div className="md:col-span-2 border-t border-gray-200 pt-6 mt-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{contractLang === 'pt' ? 'Contactos Operacionais' : 'Operational Contacts'}</p>
                </div>

                <div>
                  <label className={labelClass}>{contractLang === 'pt' ? 'Nome do Responsável *' : 'Manager Name *'}</label>
                  <input required value={pessoaContacto} onChange={e => setPessoaContacto(e.target.value)} className={inputClassCustom} placeholder={contractLang === 'pt' ? "Nome completo" : "Full Name"} />
                </div>
                
                <div>
                  <label className={labelClass}>{contractLang === 'pt' ? 'Telemóvel / Telefone *' : 'Phone Number *'}</label>
                  <input required value={telefone} onChange={e => setTelefone(e.target.value)} className={inputClassCustom} placeholder="+00 000000000" />
                </div>

                <div>
                  <label className={labelClass}>{contractLang === 'pt' ? 'E-mail Operacional *' : 'Operational Email *'}</label>
                  <input required type="email" value={emailContacto} onChange={e => setEmailContacto(e.target.value)} className={inputClassCustom} placeholder="email@company.com" />
                </div>

                <div>
                  <label className={labelClass}>{contractLang === 'pt' ? 'Encarregado RGPD / Proteção de Dados *' : 'Data Protection Officer (GDPR) *'}</label>
                  <input required value={responsavelRGPD} onChange={e => setResponsavelRGPD(e.target.value)} className={inputClassCustom} placeholder={contractLang === 'pt' ? "Nome da pessoa responsável pela privacidade" : "Name of Data Privacy Contact"} />
                </div>
              </div>
            </section>

            {/* 2. TERMOS OPERACIONAIS E FINANCEIROS */}
            <section className="mb-12">
              <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 tracking-tight">2. {contractLang === 'pt' ? 'Termos Operacionais e Financeiros' : 'Operational and Financial Terms'}</h2>
              <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 shadow-inner font-sans space-y-6">
                
                <div className="flex items-center justify-between bg-white p-4 md:p-6 rounded-xl border border-blue-200 shadow-sm">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">{contractLang === 'pt' ? 'Taxa de Comissão Fixada (Fee)' : 'Fixed Commission Rate (Fee)'}</span>
                  <span className="text-2xl font-black text-[#0E3A68] bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-100">
                    {taxaComissao}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>{contractLang === 'pt' ? 'Base de Incidência da Comissão' : 'Commission Base'}</label>
                    <select value={baseComissao} onChange={e => setBaseComissao(e.target.value)} className={selectClass}>
                      <option value="total">{contractLang === 'pt' ? 'Sobre Valor Total (Programa + Extras)' : 'On Total Value (Program + Extras)'}</option>
                      <option value="apenas_programa">{contractLang === 'pt' ? 'Apenas sobre Valor Base do Programa' : 'Only on Program Base Value'}</option>
                      <option value="sem_comissao">{contractLang === 'pt' ? 'Isento (0%)' : 'Exempt (0%)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>{contractLang === 'pt' ? 'Modelo de Integração' : 'Integration Model'}</label>
                    <select value={modalidadeReserva} onChange={e => setModalidadeReserva(e.target.value)} className={selectClass}>
                      <option value="direta">{contractLang === 'pt' ? 'Reserva Direta no Checkout (HelloCamp)' : 'Direct Checkout Booking (HelloCamp)'}</option>
                      <option value="email">{contractLang === 'pt' ? 'Encaminhamento de Leads via Email' : 'Lead Forwarding via Email'}</option>
                      <option value="link_externo">{contractLang === 'pt' ? 'Redirecionamento para Link Externo' : 'Redirection to External Link'}</option>
                    </select>
                  </div>

                  {modalidadeReserva === 'link_externo' ? (
                    <div className="md:col-span-2">
                      <label className={labelClass}>{contractLang === 'pt' ? 'Link Oficial para Redirecionamento *' : 'Official Redirect Link *'}</label>
                      <input 
                        type="url" 
                        required 
                        value={linkExternoReserva} 
                        onChange={e => setLinkExternoReserva(e.target.value)} 
                        className="w-full py-2.5 px-4 bg-white border border-slate-300 rounded-lg text-sm font-medium outline-none focus:border-[#0E3A68]" 
                        placeholder="https://..." 
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className={labelClass}>{contractLang === 'pt' ? 'Fluxo de Pagamento' : 'Payment Flow'}</label>
                        <select value={tipoPagamento} onChange={e => setTipoPagamento(e.target.value)} className={selectClass}>
                          <option value="100_total">{contractLang === 'pt' ? '100% cobrado no ato da reserva' : '100% charged upon booking'}</option>
                          <option value="50_sinal">{contractLang === 'pt' ? 'Sinal de 50% Agora + Restante Depois' : '50% Deposit Now + Remainder Later'}</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>{contractLang === 'pt' ? 'Política de Cancelamento' : 'Cancellation Policy'}</label>
                        <select value={politicaCancelamento} onChange={e => setPoliticaCancelamento(e.target.value)} className={selectClass}>
                          <option value="Flexível (Reembolso a 100% até 7 dias antes)">{contractLang === 'pt' ? 'Flexível (Reembolso a 100% até 7 dias antes)' : 'Flexible (100% refund up to 7 days before)'}</option>
                          <option value="Moderada (Reembolso a 50% até 15 dias antes)">{contractLang === 'pt' ? 'Moderada (Reembolso a 50% até 15 dias antes)' : 'Moderate (50% refund up to 15 days before)'}</option>
                          <option value="Estrita (Sem reembolso após reserva)">{contractLang === 'pt' ? 'Estrita (Sem reembolso após reserva)' : 'Strict (No refund after booking)'}</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {acordosComplementares && (
                  <div className="mt-4 bg-amber-50 p-6 rounded-xl border border-amber-200">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-amber-800 mb-2">{contractLang === 'pt' ? 'Acordos Complementares / Exceções Fixados' : 'Fixed Complementary Agreements / Exceptions'}</span>
                    <p className="text-sm font-medium text-amber-900 m-0 italic leading-relaxed">"{acordosComplementares}"</p>
                  </div>
                )}
              </div>
            </section>

            {/* 3. SÍNTESE JURÍDICA E LEI APLICÁVEL */}
            <section className="mb-12 font-sans">
              <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 tracking-tight">3. {contractLang === 'pt' ? 'Responsabilidade Legal e Foro' : 'Legal Liability and Jurisdiction'}</h2>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner space-y-4 text-xs text-slate-600 leading-relaxed text-justify">
                <p><strong>{contractLang === 'pt' ? 'A. Responsabilidade Civil e Seguros:' : 'A. Civil Liability & Insurance:'}</strong> {contractLang === 'pt' ? 'A HelloCamp atua de forma estrita como plataforma informática de intermediação e motor de busca. A organização, gestão técnica, supervisão e segurança das atividades são da inteira e exclusiva responsabilidade da Segunda Outorgante (o Parceiro), que se obriga a manter válidos todos os seguros exigidos por lei (Responsabilidade Civil e Acidentes Pessoais) e as respetivas licenças de funcionamento (Ex: RNAAT/RNAVT ou licenças camarárias), isentando a HelloCamp de qualquer litígio com os participantes decorrente da atividade.' : 'HelloCamp acts strictly as an IT intermediation platform and search engine. The organization, technical management, supervision, and safety of the activities are the entire and exclusive responsibility of the Second Party (the Partner), who is obliged to keep valid all insurance required by law (Civil Liability and Personal Accidents) and the respective operating licenses, exempting HelloCamp from any litigation with participants arising from the camp activity.'}</p>
                <p><strong>{contractLang === 'pt' ? 'B. Proteção de Dados (RGPD):' : 'B. Data Protection (GDPR):'}</strong> {contractLang === 'pt' ? 'O Parceiro assume o papel de Responsável pelo Tratamento dos dados pessoais, médicos e restrições alimentares fornecidos pela HelloCamp no estrito cumprimento do Regulamento (UE) 2016/679 (RGPD), utilizando-os apenas para a execução do serviço contratado e eliminando-os assim que deixem de ser necessários.' : 'The Partner commits to processing the personal, medical, and dietary restriction data provided by HelloCamp in strict compliance with Regulation (EU) 2016/679 (GDPR), using them only for the execution of the contracted service and deleting them as soon as they are no longer necessary.'}</p>
                <p><strong>{contractLang === 'pt' ? 'C. Impostos e Faturação:' : 'C. Taxes and Invoicing:'}</strong> {contractLang === 'pt' ? 'O Parceiro é o exclusivo responsável por determinar e cumprir as obrigações de cobrar, remeter ou incluir nos preços qualquer taxa de IVA, impostos de turismo ou rendimentos sobre as vendas ao cliente final.' : 'The Partner is solely responsible for determining and fulfilling the obligations to report, collect, remit, or include in the prices any VAT, tourist taxes, or income taxes regarding sales to the final customer.'}</p>
                <p className="font-bold text-slate-900"><strong>{contractLang === 'pt' ? 'D. Lei Aplicável e Foro Competente:' : 'D. Governing Law and Jurisdiction:'}</strong> {contractLang === 'pt' ? 'Independentemente da jurisdição ou país sede do Parceiro, o presente acordo rege-se e interpreta-se, para todos os efeitos, pela Lei Portuguesa. Qualquer litígio emergente da interpretação ou execução deste acordo será submetido à competência exclusiva dos tribunais da Comarca de Lisboa (Portugal), com renúncia expressa a qualquer outro.' : 'Regardless of the Partner’s headquarters jurisdiction or country, this agreement is governed and interpreted, for all purposes, by Portuguese Law. Any dispute arising from the interpretation or execution of this agreement shall be submitted to the exclusive jurisdiction of the courts of the District of Lisbon (Portugal), with express waiver of any other.'}</p>
              </div>
            </section>

            {/* 4. CONFIGURAÇÃO DE PASSWORD E ASSINATURA DIGITAL */}
            <section className="mb-8 font-sans">
              <div className="bg-[#059669]/5 border-2 border-[#059669]/20 rounded-[2rem] p-6 md:p-8">
                
                <h2 className="text-xl font-black text-emerald-900 mb-2 tracking-tight flex items-center gap-2"><span>🔑</span> {contractLang === 'pt' ? 'Crie a sua Palavra-Passe' : 'Create your Password'}</h2>
                <p className="text-xs font-medium text-emerald-700/80 mb-6">{contractLang === 'pt' ? 'Ao definir a sua palavra-passe e assinar, fará login automático no seu painel de gestão privado.' : 'By setting your password and signing, you will be automatically logged into your private dashboard.'}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 pb-10 border-b border-emerald-200/50">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-2">{contractLang === 'pt' ? 'Palavra-Passe *' : 'Password *'}</label>
                    <input required type="password" minLength={6} value={novaPassword} onChange={e => setNovaPassword(e.target.value)} className="w-full p-4 bg-white border border-emerald-200 rounded-xl text-sm font-bold text-emerald-900 outline-none focus:border-emerald-500 shadow-sm" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-2">{contractLang === 'pt' ? 'Confirmar Palavra-Passe *' : 'Confirm Password *'}</label>
                    <input required type="password" minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-4 bg-white border border-emerald-200 rounded-xl text-sm font-bold text-emerald-900 outline-none focus:border-emerald-500 shadow-sm" placeholder="••••••••" />
                  </div>
                </div>

                <h2 className="text-xl font-black text-emerald-900 mb-2 tracking-tight flex items-center gap-2"><span>✍️</span> {contractLang === 'pt' ? 'Assinatura Digital' : 'Digital Signature'}</h2>
                <p className="text-xs font-medium text-emerald-700/80 mb-6">{contractLang === 'pt' ? 'A assinatura deste documento tem validade legal probatória através da gravação de Timestamp e Endereço IP do signatário.' : 'The signature of this document has evidential legal validity through the recording of the signatory’s Timestamp and IP Address.'}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-2">{contractLang === 'pt' ? 'Nome do Signatário *' : 'Signatory Name *'}</label>
                    <input required value={assinaturaNome} onChange={e => setAssinaturaNome(e.target.value)} className="w-full p-4 bg-white border border-emerald-200 rounded-xl text-sm font-black text-emerald-900 outline-none focus:border-emerald-500 font-serif italic shadow-sm" placeholder={contractLang === 'pt' ? "O seu nome completo" : "Your full name"} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-2">{contractLang === 'pt' ? 'Cargo / Função Legal *' : 'Legal Role / Position *'}</label>
                    <input required value={assinaturaCargo} onChange={e => setAssinaturaCargo(e.target.value)} className="w-full p-4 bg-white border border-emerald-200 rounded-xl text-sm font-bold text-emerald-900 outline-none focus:border-emerald-500 shadow-sm" placeholder={contractLang === 'pt' ? "Ex: CEO / Diretor Geral" : "Ex: CEO / Managing Director"} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-emerald-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <label className="flex items-start gap-4 cursor-pointer group flex-1">
                    <input type="checkbox" required checked={concordaTermos} onChange={e => setConcordaTermos(e.target.checked)} className="mt-1 w-6 h-6 accent-emerald-600 cursor-pointer flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                      {contractLang === 'pt' 
                        ? 'Declaro sob compromisso de honra que sou o representante legal da entidade identificada. Aceito os Termos Operacionais descritos, os Termos e Condições gerais da plataforma, e autorizo a comercialização dos nossos programas através da HelloCamp. Renuncio expressamente a invocar a nulidade do documento por falta de assinatura autógrafa.' 
                        : 'I declare upon my honor that I am the legal representative of the identified entity. I accept the Operational Terms described, the platform’s general Terms and Conditions, and authorize the marketing of our programs through HelloCamp. I expressly waive the right to invoke the nullity of the document due to lack of a handwritten signature.'}
                    </span>
                  </label>
                  <Link href={`/${lang}/termos`} target="_blank" className="flex-shrink-0 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors shadow-sm no-underline">
                    {contractLang === 'pt' ? 'Ler Termos & Condições' : 'Read Terms & Conditions'}
                  </Link>
                </div>

              </div>
            </section>

            <button type="submit" disabled={submitting} className="w-full py-5 text-sm uppercase tracking-widest font-black rounded-2xl border-none text-white bg-[#0E3A68] hover:bg-[#0b2b4d] transition-all shadow-xl shadow-[#0E3A68]/30 hover:-translate-y-1 cursor-pointer disabled:opacity-50 font-sans">
              {submitting ? (contractLang === 'pt' ? 'A Processar Documento e Criar Conta...' : 'Processing Document & Creating Account...') : (contractLang === 'pt' ? 'Assinar Digitalmente e Aceder ao Painel' : 'Digitally Sign and Access Dashboard')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
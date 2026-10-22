"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 
import Link from "next/link";
import jsPDF from "jspdf";
import React from "react";

export default function MeusCampos({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = React.use(params);
  const isEn = lang === 'en';

  const [campos, setCampos] = useState<any[]>([]);
  const [perfilBase, setPerfilBase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estado para abrir o Modal de Visualização do Contrato Completo
  const [contratoModalCampo, setContratoModalCampo] = useState<any | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const fetchCampos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setLoading(false);

      const { data: perfilData } = await supabase
        .from('perfis')
        .select('taxa_comissao, base_comissao, contrato_dados, created_at')
        .eq('id', session.user.id)
        .single();
      
      setPerfilBase(perfilData || { taxa_comissao: 12 });

      const { data } = await supabase
        .from('campos')
        .select('*')
        .eq('organizador_id', session.user.id)
        .order('id', { ascending: false }); 
      
      setCampos(data || []);
      setLoading(false);
    };
    fetchCampos();
  }, []);

  // ============================================================================
  // GERADOR DE PDF CORPORATIVO OFICIAL (IGUAL AO DA PÁGINA DE ASSINATURA)
  // ============================================================================
  const handleDownloadPDF = (campo: any) => {
    setDownloadingPdf(true);
    try {
      const dados = campo.contrato_dados || perfilBase?.contrato_dados || {};
      const taxaComissao = campo.taxa_comissao !== null && campo.taxa_comissao !== undefined 
        ? campo.taxa_comissao 
        : (dados.taxaComissao || perfilBase?.taxa_comissao || 12);
      const baseComissao = dados.baseComissao || campo.base_comissao || perfilBase?.base_comissao || 'total';
      const modalidadeReserva = dados.modalidadeReserva || campo.modalidade_reserva || 'direta';
      const linkExternoReserva = dados.linkExternoReserva || campo.link_externo_reserva || '';
      const tipoPagamento = dados.tipoPagamento || campo.tipo_pagamento || '100_total';
      const politicaCancelamento = dados.politicaCancelamento || campo.politica_cancelamento || 'Moderada (Reembolso a 50% até 15 dias antes)';
      
      const timestamp = dados.dataSubmissao || campo.created_at || new Date().toISOString();
      const dataPropostaStr = dados.dataEnvio || perfilBase?.created_at || campo.created_at || timestamp;
      const userIP = dados.ipAssinatura || 'Registado no Servidor';
      const isPt = !isEn;

      const doc = new jsPDF({ format: 'a4', unit: 'mm' });
      const pageWidth = doc.internal.pageSize.getWidth();

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

      // 2. RESUMO EXECUTIVO DO ACORDO (OS 4 PONTOS)
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

      // 3. SECÇÃO 1: IDENTIFICAÇÃO DAS PARTES
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
      doc.text(`${dados.empresaNome || campo.nome} (${dados.formaJuridica || 'Entidade'})`.substring(0, 42), 113, y + 12);
      doc.text(`NIF / Tax ID: ${dados.nif || 'N/A'}`, 113, y + 17);
      doc.text(`${dados.morada || 'N/A'}, ${dados.codigoPostal || ''}`.substring(0, 42), 113, y + 22);
      doc.text(`Resp: ${dados.pessoaContacto || 'N/A'} | Tel: ${dados.telefone || 'N/A'}`.substring(0, 42), 113, y + 27);
      doc.text(`E-mail: ${dados.emailContacto || 'N/A'} | RGPD: ${dados.responsavelRGPD || dados.pessoaContacto || 'N/A'}`.substring(0, 44), 113, y + 32);

      y += 43;

      // 4. SECÇÃO 2: TERMOS OPERACIONAIS E FINANCEIROS
      doc.setTextColor(...blueBrand);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(isPt ? "2. CONDIÇÕES OPERACIONAIS E FINANCEIRAS ACORDADAS" : "2. AGREED OPERATIONAL AND FINANCIAL TERMS", 15, y);
      doc.line(15, y + 2, pageWidth - 15, y + 2);
      y += 5;

      const boxHeight = dados.acordosComplementares ? 36 : 28;
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

      if (dados.acordosComplementares) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(146, 64, 14);
        doc.text(isPt ? `• Acordos Complementares: "${dados.acordosComplementares}"` : `• Complementary Agreements: "${dados.acordosComplementares}"`, 19, y + 31);
      }

      y += boxHeight + 7;

      // 5. SECÇÃO 3: CLÁUSULAS CONTRATUAIS GERAIS
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
      doc.setFillColor(240, 253, 244);
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
      doc.text(`${dados.assinaturaNome || dados.pessoaContacto || 'Assinado Digitalmente'}`.substring(0, 32), 110, y + 15);
      doc.line(110, y + 17, pageWidth - 20, y + 17);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...slateMuted);
      doc.text(isPt ? `Cargo Legal: ${dados.assinaturaCargo || 'Representante Legal'}` : `Legal Role: ${dados.assinaturaCargo || 'Legal Representative'}`, 110, y + 22);
      doc.text(isPt ? `Data e Hora: ${new Date(timestamp).toLocaleString('pt-PT')}` : `Timestamp: ${new Date(timestamp).toLocaleString('en-GB')}`, 110, y + 27);
      doc.text(`IP Signatário: ${userIP} • ID: ${campo.id.slice(0, 8)}`, 110, y + 32);

      doc.save(`Contrato_HelloCamp_${(dados.empresaNome || campo.nome).replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert(isEn ? "Error generating PDF." : "Erro ao gerar o PDF.");
    }
    setDownloadingPdf(false);
  };

  // Variáveis calculadas para o Modal de Visualização
  const modalDados = contratoModalCampo?.contrato_dados || perfilBase?.contrato_dados || {};
  const modalTaxa = contratoModalCampo && contratoModalCampo.taxa_comissao !== null && contratoModalCampo.taxa_comissao !== undefined
    ? contratoModalCampo.taxa_comissao
    : (modalDados.taxaComissao || perfilBase?.taxa_comissao || 12);
  const modalBase = modalDados.baseComissao || contratoModalCampo?.base_comissao || perfilBase?.base_comissao || 'total';
  const modalModalidade = modalDados.modalidadeReserva || contratoModalCampo?.modalidade_reserva || 'direta';
  const modalLinkExterno = modalDados.linkExternoReserva || contratoModalCampo?.link_externo_reserva || '';
  const modalPagamento = modalDados.tipoPagamento || contratoModalCampo?.tipo_pagamento || '100_total';
  const modalCancelamento = modalDados.politicaCancelamento || contratoModalCampo?.politica_cancelamento || 'Moderada (Reembolso a 50% até 15 dias antes)';
  const timestampContrato = modalDados.dataSubmissao || contratoModalCampo?.created_at || new Date().toISOString();
  const dataPropostaHelloCamp = modalDados.dataEnvio || perfilBase?.created_at || contratoModalCampo?.created_at || timestampContrato;

  return (
    <div className="max-w-[1200px] mx-auto pb-10 font-sans">

      {/* ========================================================================= */}
      {/* MODAL DE LEITURA DO CONTRATO (COM AS CORES, LOGÓTIPO E TODOS OS TEXTOS)   */}
      {/* ========================================================================= */}
      {contratoModalCampo && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setContratoModalCampo(null)}
        >
          <div 
            className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden relative my-6 max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* CABEÇALHO CORPORATIVO AZUL & DOURADO (IGUAL AO DA PÁGINA DE ASSINATURA) */}
            <div className="bg-[#0E3A68] p-6 sm:p-10 text-center relative overflow-hidden shrink-0 border-b-4 border-[#e2a41d]">
              <button
                onClick={() => setContratoModalCampo(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-lg flex items-center justify-center cursor-pointer border-none transition-colors z-20"
                title={isEn ? "Close" : "Fechar"}
              >
                &times;
              </button>

              <div className="text-2xl sm:text-3xl font-black tracking-tighter mb-3 font-sans flex justify-center items-center relative z-10">
                <span className="text-white">Hello</span><span className="text-[#e2a41d]">Camp</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white m-0 tracking-tight relative z-10">
                {isEn ? 'Global Intermediation Agreement' : 'Acordo Global de Intermediação e Serviços'}
              </h2>
              <p className="text-blue-200 text-xs sm:text-sm mt-2 mb-0 font-medium">
                {isEn 
                  ? `Official Legal Copy • Signed on ${new Date(timestampContrato).toLocaleDateString('en-GB')}` 
                  : `Cópia Oficial Arquivada • Assinado em ${new Date(timestampContrato).toLocaleDateString('pt-PT')}`}
              </p>
            </div>

            {/* CORPO DO CONTRATO (SCROLLABLE & 100% READ-ONLY) */}
            <div className="p-6 sm:p-10 overflow-y-auto space-y-10 text-slate-800">

              {/* RESUMO EXECUTIVO VISUAL (OS 4 PONTOS DA PÁGINA DE ASSINATURA) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex gap-3.5 items-start">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-lg shrink-0 font-bold">📝</div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 m-0 mb-1">1. {isEn ? 'Object of Agreement' : 'Objeto do Acordo'}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed m-0 text-justify">
                      {isEn 
                        ? 'Establishes the terms applicable to the intermediation and commercial promotion of the Partner\'s activities through HelloCamp, valid until the end of the calendar year and automatically renewed.'
                        : 'Estabelece os termos aplicáveis à intermediação e promoção comercial das atividades organizadas pelo Parceiro através da plataforma HelloCamp, válido até ao final do ano civil com renovação automática.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center text-lg shrink-0 font-bold">🚀</div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 m-0 mb-1">2. {isEn ? 'Obligations & Promotion' : 'Obrigações e Divulgação'}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed m-0 text-justify">
                      {isEn 
                        ? 'HelloCamp provides the technological infrastructure for publishing offers. The Partner guarantees the accuracy and legal ownership of all shared content, images, and programs.'
                        : 'A HelloCamp disponibiliza a infraestrutura tecnológica para a publicação das ofertas. O Parceiro garante a veracidade e a titularidade legal de todos os conteúdos, imagens e programas partilhados.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-lg shrink-0 font-bold">💻</div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 m-0 mb-1">3. {isEn ? 'Booking Management' : 'Gestão de Reservas'}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed m-0 text-justify">
                      {isEn 
                        ? 'The platform acts as a facilitating channel, with the Partner bearing full responsibility for service execution, safety, and legal compliance towards the final customer.'
                        : 'A plataforma atua como canal facilitador, cabendo ao Parceiro a inteira responsabilidade pela execução do serviço, segurança e conformidade legal perante o cliente final.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-lg shrink-0 font-bold">€</div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 m-0 mb-1">4. {isEn ? 'Financial Conditions' : 'Condições Financeiras'}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed m-0 text-justify">
                      {isEn 
                        ? 'Remuneration due to HelloCamp is based exclusively on successful intermediation, according to the operational details fixed in Section 2 of this agreement.'
                        : 'A remuneração devida à HelloCamp incide exclusivamente sobre o sucesso da intermediação, conforme os detalhes operacionais fixados na Secção 2 deste acordo.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECÇÃO 1: IDENTIFICAÇÃO DAS PARTES (HELLO CAMP + PARCEIRO) */}
              <section>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0E3A68] border-b-2 border-slate-100 pb-2 mb-4">
                  1. {isEn ? 'Identification of the Contracting Parties' : 'Identificação das Partes Contratantes'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: HelloCamp */}
                  <div className="bg-[#0E3A68]/5 p-5 rounded-2xl border border-[#0E3A68]/15 space-y-2">
                    <span className="inline-block bg-[#0E3A68] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                      {isEn ? 'First Party (Platform)' : 'Primeira Outorgante (Plataforma)'}
                    </span>
                    <p className="text-base font-black text-slate-900 m-0 pt-1">HelloCamp Portugal</p>
                    <p className="text-xs text-slate-600 m-0"><strong>Website Oficial:</strong> www.hellocamp.pt</p>
                    <p className="text-xs text-slate-600 m-0"><strong>E-mail Oficial:</strong> info@hellocamp.pt</p>
                    <p className="text-xs text-slate-600 m-0"><strong>Objeto:</strong> Plataforma Digital de Intermediação e Reservas</p>
                    <p className="text-xs text-slate-600 m-0"><strong>Jurisdição e Foro:</strong> Comarca de Lisboa, Portugal</p>
                  </div>

                  {/* Card 2: Parceiro */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                    <span className="inline-block bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                      {isEn ? 'Second Party (Partner)' : 'Segunda Outorgante (Parceiro)'}
                    </span>
                    <p className="text-base font-black text-slate-900 m-0 pt-1">
                      {modalDados.empresaNome || contratoModalCampo.nome} {modalDados.formaJuridica ? `(${modalDados.formaJuridica})` : ''}
                    </p>
                    <p className="text-xs text-slate-600 m-0"><strong>NIF / Tax ID:</strong> {modalDados.nif || '—'}</p>
                    <p className="text-xs text-slate-600 m-0"><strong>Sede Fiscal:</strong> {modalDados.morada || '—'}{modalDados.codigoPostal ? `, ${modalDados.codigoPostal}` : ''}</p>
                    <p className="text-xs text-slate-600 m-0"><strong>Responsável:</strong> {modalDados.pessoaContacto || '—'} | <strong>Tel:</strong> {modalDados.telefone || '—'}</p>
                    <p className="text-xs text-slate-600 m-0"><strong>E-mail:</strong> {modalDados.emailContacto || '—'} | <strong>RGPD:</strong> {modalDados.responsavelRGPD || modalDados.pessoaContacto || '—'}</p>
                  </div>
                </div>
              </section>

              {/* SECÇÃO 2: TERMOS OPERACIONAIS E FINANCEIROS */}
              <section>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0E3A68] border-b-2 border-slate-100 pb-2 mb-4">
                  2. {isEn ? 'Operational and Financial Terms' : 'Termos Operacionais e Financeiros Acordados'}
                </h3>
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-5">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">
                      {isEn ? 'Fixed Commission Rate (VAT Included)' : 'Taxa de Comissão Fixada (IVA Incluído)'}
                    </span>
                    <span className="text-2xl font-black text-[#0E3A68] bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-200">
                      {modalTaxa}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        {isEn ? 'Commission Base' : 'Base de Incidência da Comissão'}
                      </span>
                      <p className="text-sm font-black text-slate-900 m-0">
                        {modalBase === 'apenas_programa' 
                          ? (isEn ? 'Only on Program Base Value' : 'Apenas sobre Valor Base do Programa')
                          : modalBase === 'sem_comissao'
                          ? (isEn ? 'Exempt (0%)' : 'Isento (0%)')
                          : (isEn ? 'On Total Value (Program + Extras)' : 'Sobre Valor Total (Programa + Extras)')}
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        {isEn ? 'Integration Model' : 'Modalidade de Integração'}
                      </span>
                      <p className="text-sm font-black text-slate-900 m-0">
                        {modalModalidade === 'direta' 
                          ? (isEn ? 'Direct Checkout Booking (HelloCamp)' : 'Reserva Direta no Checkout (HelloCamp)')
                          : modalModalidade === 'email'
                          ? (isEn ? 'Lead Forwarding via Email' : 'Encaminhamento de Leads via E-mail')
                          : (isEn ? 'Redirection to External Link' : 'Redirecionamento para Link Externo')}
                      </p>
                    </div>

                    {modalModalidade === 'link_externo' ? (
                      <div className="sm:col-span-2 bg-white p-4 rounded-xl border border-slate-200">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                          {isEn ? 'Official Redirect URL' : 'URL Oficial para Redirecionamento'}
                        </span>
                        <a href={modalLinkExterno} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#0E3A68] underline break-all">
                          {modalLinkExterno || '—'}
                        </a>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            {isEn ? 'Payment Flow (Stripe)' : 'Fluxo de Pagamento (Stripe)'}
                          </span>
                          <p className="text-sm font-black text-slate-900 m-0">
                            {modalPagamento === '50_sinal' 
                              ? (isEn ? '50% Deposit Now + Remainder Later' : 'Sinal de 50% no ato + Restante depois')
                              : (isEn ? '100% Charged Upon Booking' : '100% Cobrado no ato da reserva')}
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            {isEn ? 'Authorized Cancellation Policy' : 'Política de Cancelamento Autorizada'}
                          </span>
                          <p className="text-sm font-black text-slate-900 m-0">{modalCancelamento}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {modalDados.acordosComplementares && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-amber-800 mb-1">
                        {isEn ? 'Fixed Complementary Agreements' : 'Acordos Complementares / Exceções Fixados'}
                      </span>
                      <p className="text-xs font-medium text-amber-900 m-0 italic">"{modalDados.acordosComplementares}"</p>
                    </div>
                  )}
                </div>
              </section>

              {/* SECÇÃO 3: CLÁUSULAS JURÍDICAS COMPLETAS */}
              <section>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0E3A68] border-b-2 border-slate-100 pb-2 mb-4">
                  3. {isEn ? 'Legal Liability, GDPR and Jurisdiction' : 'Cláusulas Contratuais Gerais, Responsabilidade e Foro'}
                </h3>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3.5 text-xs text-slate-600 leading-relaxed text-justify">
                  <p className="m-0">
                    <strong>{isEn ? 'A. Civil Liability & Insurance:' : 'A. Responsabilidade Civil e Seguros:'}</strong>{' '}
                    {isEn 
                      ? 'HelloCamp acts strictly as an IT intermediation platform and search engine. The organization, technical management, supervision, and safety of the activities are the entire and exclusive responsibility of the Second Party (the Partner), who is obliged to keep valid all insurance required by law (Civil Liability and Personal Accidents) and the respective operating licenses, exempting HelloCamp from any litigation with participants arising from the camp activity.' 
                      : 'A HelloCamp atua de forma estrita como plataforma informática de intermediação e motor de busca. A organização, gestão técnica, supervisão e segurança das atividades são da inteira e exclusiva responsabilidade da Segunda Outorgante (o Parceiro), que se obriga a manter válidos todos os seguros exigidos por lei (Responsabilidade Civil e Acidentes Pessoais) e as respetivas licenças de funcionamento (Ex: RNAAT/RNAVT ou licenças camarárias), isentando a HelloCamp de qualquer litígio com os participantes decorrente da atividade.'}
                  </p>
                  <p className="m-0">
                    <strong>{isEn ? 'B. Data Protection (GDPR):' : 'B. Proteção de Dados (RGPD):'}</strong>{' '}
                    {isEn 
                      ? 'The Partner assumes the role of Data Controller for the personal, medical, and dietary restriction data provided by HelloCamp in strict compliance with Regulation (EU) 2016/679 (GDPR), using them only for the execution of the contracted service and deleting them as soon as they are no longer necessary.' 
                      : 'O Parceiro assume o papel de Responsável pelo Tratamento dos dados pessoais, médicos e restrições alimentares fornecidos pela HelloCamp no estrito cumprimento do Regulamento (UE) 2016/679 (RGPD), utilizando-os apenas para a execução do serviço contratado e eliminando-os assim que deixem de ser necessários.'}
                  </p>
                  <p className="m-0">
                    <strong>{isEn ? 'C. Taxes and Invoicing:' : 'C. Impostos e Faturação:'}</strong>{' '}
                    {isEn 
                      ? 'The Partner is solely responsible for determining and fulfilling the obligations to report, collect, remit, or include in the prices any VAT, tourist taxes, or income taxes regarding sales to the final customer.' 
                      : 'O Parceiro é o exclusivo responsável por determinar e cumprir as obrigações de cobrar, remeter ou incluir nos preços qualquer taxa de IVA, impostos de turismo ou rendimentos sobre as vendas ao cliente final.'}
                  </p>
                  <p className="m-0 text-slate-900 font-bold">
                    <strong>{isEn ? 'D. Governing Law and Jurisdiction:' : 'D. Lei Aplicável e Foro Competente:'}</strong>{' '}
                    {isEn 
                      ? 'Regardless of the Partner’s headquarters jurisdiction or country, this agreement is governed and interpreted, for all purposes, by Portuguese Law. Any dispute arising from the interpretation or execution of this agreement shall be submitted to the exclusive jurisdiction of the courts of the District of Lisbon (Portugal), with express waiver of any other.' 
                      : 'Independentemente da jurisdição ou país sede do Parceiro, o presente acordo rege-se e interpreta-se, para todos os efeitos, pela Lei Portuguesa. Qualquer litígio emergente da interpretação ou execução deste acordo será submetido à competência exclusiva dos tribunais da Comarca de Lisboa (Portugal), com renúncia expressa a qualquer outro.'}
                  </p>
                </div>
              </section>

              {/* SECÇÃO 4: DUPLA ASSINATURA DIGITAL (HELLO CAMP + PARCEIRO) */}
              <section>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0E3A68] border-b-2 border-slate-100 pb-2 mb-4">
                  4. {isEn ? 'Bilateral Digital Signatures & Certification' : 'Assinaturas Digitais Vinculativas (Acordo Bilateral)'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-emerald-50/60 border-2 border-emerald-200 rounded-2xl p-6">
                  
                  {/* Assinatura 1: Pela HelloCamp */}
                  <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="inline-block bg-[#0E3A68] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded mb-3">
                        {isEn ? 'By First Party (Proposer)' : 'Pela Primeira Outorgante (Proponente)'}
                      </span>
                      <p className="text-xl font-black text-[#0E3A68] font-serif italic m-0 border-b border-slate-200 pb-2">
                        Administração HelloCamp Portugal
                      </p>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1 mt-4 font-mono">
                      <div><strong>{isEn ? 'Role:' : 'Cargo:'}</strong> Direção Executiva & Parcerias B2B</div>
                      <div><strong>{isEn ? 'Proposal Sent Date:' : 'Data de Proposta e Envio:'}</strong> {new Date(dataPropostaHelloCamp).toLocaleDateString(!isEn ? 'pt-PT' : 'en-GB')}</div>
                      <div><strong>Status:</strong> Validado Oficialmente (HelloCamp HQ)</div>
                    </div>
                  </div>

                  {/* Assinatura 2: Pelo Parceiro */}
                  <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="inline-block bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded mb-3">
                        ✍️ {isEn ? 'By Second Party (Acceptor)' : 'Pela Segunda Outorgante (Parceiro)'}
                      </span>
                      <p className="text-xl font-black text-emerald-950 font-serif italic m-0 border-b border-slate-200 pb-2">
                        {modalDados.assinaturaNome || modalDados.pessoaContacto || 'Assinado Digitalmente'}
                      </p>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1 mt-4 font-mono">
                      <div><strong>{isEn ? 'Legal Role:' : 'Cargo Legal:'}</strong> {modalDados.assinaturaCargo || 'Representante Legal'}</div>
                      <div><strong>{isEn ? 'Signature Timestamp:' : 'Data/Hora da Assinatura:'}</strong> {new Date(timestampContrato).toLocaleString(!isEn ? 'pt-PT' : 'en-GB')}</div>
                      <div><strong>IP Signatário:</strong> {modalDados.ipAssinatura || 'Registado no Servidor'}</div>
                    </div>
                  </div>

                </div>
              </section>

            </div>

            {/* RODAPÉ DO MODAL COM BOTÃO DE DOWNLOAD DO PDF CORPORATIVO */}
            <div className="bg-slate-50 px-6 sm:px-10 py-5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <Link href={`/${lang}/termos`} target="_blank" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#0E3A68] no-underline">
                {isEn ? 'Read Platform General Terms & Conditions ↗' : 'Consultar Termos e Condições Gerais da Plataforma ↗'}
              </Link>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setContratoModalCampo(null)}
                  className="px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-widest cursor-pointer transition-colors"
                >
                  {isEn ? 'Close' : 'Fechar'}
                </button>
                <button
                  onClick={() => handleDownloadPDF(contratoModalCampo)}
                  disabled={downloadingPdf}
                  className="px-6 py-3 rounded-xl border-none bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black text-xs uppercase tracking-widest cursor-pointer shadow-md transition-colors flex items-center gap-2"
                >
                  📥 {downloadingPdf ? (isEn ? 'Generating PDF...' : 'A Gerar PDF...') : (isEn ? 'Download Official PDF' : 'Descarregar PDF Oficial')}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LISTAGEM PRINCIPAL DE CAMPOS DO PARCEIRO                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 m-0 tracking-tight">
            {isEn ? 'My Camps' : 'Os Meus Campos'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            {isEn ? 'Manage your holiday programs and availability.' : 'Gira os seus programas de férias e disponibilidade.'}
          </p>
        </div>

        <Link href={`/${lang}/admin/campos/novo`} className="w-full sm:w-auto bg-[#167524] hover:bg-[#115a1b] text-white px-6 py-3.5 rounded-xl font-bold text-sm text-center transition-colors shadow-sm no-underline uppercase tracking-widest">
          + {isEn ? 'Add New Camp' : 'Adicionar Novo'}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-bold">{isEn ? 'Loading your camps...' : 'A carregar os seus campos...'}</div>
      ) : campos.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
          <p className="text-slate-500 mb-4 text-base md:text-lg">{isEn ? 'You haven\'t added any camps yet.' : 'Ainda não tem nenhum campo registado.'}</p>
          <Link href={`/${lang}/admin/campos/novo`} className="text-[#167524] font-bold no-underline text-base hover:text-[#115a1b]">
            {isEn ? 'Create your first camp →' : 'Crie o seu primeiro campo →'}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {campos.map((campo) => {
            const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
            const localVisivel = isEn && campo.local_en ? campo.local_en : campo.local;
            const vagasVisivel = campo.vagas_totais || 0;
            const textoVagas = isEn ? 'spots' : 'vagas';

            let precoVisivel = campo.preco || 0;
            if (!precoVisivel && campo.pacotes && campo.pacotes.length > 0) {
              const todosPrecos = campo.pacotes.flatMap((p: any) => 
                p.variantes ? p.variantes.map((v: any) => v.preco) : []
              );
              if (todosPrecos.length > 0) {
                precoVisivel = Math.min(...todosPrecos);
              }
            }

            const isComissaoEspecifica = campo.taxa_comissao !== null && campo.taxa_comissao !== undefined;
            const taxaVisual = isComissaoEspecifica ? campo.taxa_comissao : (perfilBase?.taxa_comissao || 12);
            const temContrato = Boolean(campo.contrato_dados || perfilBase?.contrato_dados || campo.contrato_parceiro_url);

            return (
              <div key={campo.id} className="flex flex-col lg:flex-row justify-between lg:items-center gap-5 p-5 md:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">

                <div className="flex-1">
                  <h3 className="m-0 text-lg md:text-xl font-black text-slate-900 mb-3">{nomeVisivel}</h3>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <span className="text-xs md:text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">📍 {localVisivel}</span>
                    <span className="text-xs md:text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">👥 {vagasVisivel} {textoVagas}</span>
                    <span className="text-xs md:text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
                      💰 {isEn ? 'From ' : 'A partir de '}{precoVisivel > 0 ? `${precoVisivel}€` : '--'}
                    </span>

                    <span className={`text-xs font-bold px-3 py-1 rounded-md border ${isComissaoEspecifica ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {taxaVisual}% {isEn ? 'Fee' : 'Comissão'}
                    </span>

                    {campo.status_aprovacao === 'Aprovado' && (
                      <span className="text-xs font-bold px-3 py-1 rounded-md border bg-[#167524]/10 text-[#167524] border-[#167524]/20">
                        ✅ {isEn ? 'Verified' : 'Validado'}
                      </span>
                    )}
                    {campo.status_aprovacao === 'Pendente de Revisão' && (
                      <span className="text-xs font-bold px-3 py-1 rounded-md border bg-amber-50 text-amber-700 border-amber-200">
                        ⏳ {isEn ? 'Under Review' : 'Em Revisão'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap justify-end gap-3 mt-4 lg:mt-0 w-full lg:w-auto">

                  <a href={`/${lang}/campo/${campo.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-5 py-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest no-underline transition-colors cursor-pointer shadow-sm">
                    {isEn ? 'Preview' : 'Ver Online'}
                  </a>

                  {temContrato && (
                    <button 
                      onClick={() => setContratoModalCampo(campo)} 
                      className="flex items-center justify-center gap-1.5 px-5 py-3 bg-[#e2a41d] text-white hover:bg-[#d4991b] rounded-xl font-bold text-xs uppercase tracking-widest border-none transition-colors cursor-pointer shadow-sm"
                    >
                      📄 {isEn ? 'Contract PDF' : 'Contrato PDF'}
                    </button>
                  )}

                  <Link href={`/${lang}/admin/campos/editar/${campo.id}`} className="flex items-center justify-center px-6 py-3 bg-[#167524] text-white hover:bg-[#115a1b] rounded-xl font-bold text-xs uppercase tracking-widest no-underline transition-colors shadow-sm">
                    {isEn ? 'Edit Camp' : 'Editar Campo'}
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
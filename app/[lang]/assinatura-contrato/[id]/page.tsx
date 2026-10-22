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
  
  // Controlo de Língua do Contrato (Para parceiros Internacionais vs Nacionais)
  const [contractLang, setContractLang] = useState<'pt' | 'en'>(lang === 'pt' ? 'pt' : 'en');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [campoNome, setCampoNome] = useState<string>("Vários Programas");
  const [jaAssinado, setJaAssinado] = useState(false);
  const [pdfGeradoUrl, setPdfGeradoUrl] = useState<string | null>(null);

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
  
  const [assinaturaNome, setAssinaturaNome] = useState("");
  const [assinaturaCargo, setAssinaturaCargo] = useState("");
  const [concordaTermos, setConcordaTermos] = useState(false);

  // Campos Operacionais (HQ define comissão, Parceiro define o resto)
  const [taxaComissao, setTaxaComissao] = useState(12);
  const [baseComissao, setBaseComissao] = useState("total");
  const [modalidadeReserva, setModalidadeReserva] = useState("direta");
  const [linkExternoReserva, setLinkExternoReserva] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState("100_total");
  const [politicaCancelamento, setPoliticaCancelamento] = useState("Moderada (Reembolso a 50% até 15 dias antes)");
  const [acordosComplementares, setAcordosComplementares] = useState("");

  const labelClass = "text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block";
  const inputClassCustom = "border-b border-slate-300 outline-none bg-transparent px-1 py-1.5 text-base font-bold text-slate-900 placeholder:text-slate-300 w-full focus:border-black focus:bg-white transition-colors rounded-t-sm";
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

      const { data: campoData } = await supabase.from("campos").select("nome, contrato_parceiro_url").eq("organizador_id", id);
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

      // Comissão fixa gerida pela HQ
      setTaxaComissao(data.taxa_comissao !== null && data.taxa_comissao !== undefined ? data.taxa_comissao : 12);
      
      // Operações pré-preenchidas mas editáveis
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

  const gerarEGuardarPDF = async (userIP: string, timestamp: string) => {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(contractLang === 'pt' ? "CONTRATO GLOBAL DE INTERMEDIAÇÃO E SERVIÇOS" : "GLOBAL INTERMEDIATION AND SERVICES AGREEMENT", pageWidth / 2, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const dataAtualPT = new Date(timestamp).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });
    const dataAtualEN = new Date(timestamp).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(contractLang === 'pt' ? `Data de Emissão: ${dataAtualPT}` : `Issue Date: ${dataAtualEN}`, pageWidth / 2, 28, { align: "center" });
    doc.line(20, 35, pageWidth - 20, 35);

    // 1. DADOS DAS PARTES
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(contractLang === 'pt' ? "1. IDENTIFICAÇÃO DAS PARTES" : "1. IDENTIFICATION OF THE PARTIES", 20, 45);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (contractLang === 'pt') {
      doc.text(`PRIMEIRA OUTORGANTE (Plataforma): HelloCamp Portugal`, 20, 53);
      doc.text(`SEGUNDA OUTORGANTE (Organizador): ${empresaNome} (${formaJuridica})`, 20, 59);
      doc.text(`Sede: ${morada}, ${codigoPostal} | NIF: ${nif}`, 20, 65);
      doc.text(`Contacto: ${pessoaContacto} | E-mail: ${emailContacto} | Tel: ${telefone}`, 20, 71);
      doc.text(`Responsável de Dados (RGPD): ${responsavelRGPD || pessoaContacto}`, 20, 77);
    } else {
      doc.text(`FIRST PARTY (Platform): HelloCamp Portugal`, 20, 53);
      doc.text(`SECOND PARTY (Organizer): ${empresaNome} (${formaJuridica})`, 20, 59);
      doc.text(`Headquarters: ${morada}, ${codigoPostal} | Tax ID: ${nif}`, 20, 65);
      doc.text(`Contact: ${pessoaContacto} | E-mail: ${emailContacto} | Tel: ${telefone}`, 20, 71);
      doc.text(`Data Protection Officer (GDPR): ${responsavelRGPD || pessoaContacto}`, 20, 77);
    }

    // 2. TERMOS FINANCEIROS
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(contractLang === 'pt' ? "2. CONDIÇÕES FINANCEIRAS E OPERACIONAIS" : "2. FINANCIAL AND OPERATIONAL CONDITIONS", 20, 90);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    let basePT = baseComissao === "apenas_programa" ? "Apenas sobre Valor Base do Programa" : (baseComissao === "sem_comissao" ? "Isento (0%)" : "Sobre Valor Total (Programa + Extras)");
    let baseEN = baseComissao === "apenas_programa" ? "Only on Program Base Value" : (baseComissao === "sem_comissao" ? "Exempt (0%)" : "On Total Value (Program + Extras)");

    let modPT = modalidadeReserva === "direta" ? "Reserva Direta no Checkout" : (modalidadeReserva === "email" ? "Sob Consulta (Email)" : "Link Externo");
    let modEN = modalidadeReserva === "direta" ? "Direct Checkout Booking" : (modalidadeReserva === "email" ? "On Request (Email)" : "External Link");

    if (contractLang === 'pt') {
      doc.text(`• Taxa de Comissão Fixada: ${taxaComissao}% (IVA incluído à taxa legal)`, 25, 98);
      doc.text(`• Base de Incidência da Comissão: ${basePT}`, 25, 104);
      doc.text(`• Modalidade de Integração: ${modPT}`, 25, 110);
      if (modalidadeReserva === 'link_externo') {
        doc.text(`• URL Oficial para Redirecionamento: ${linkExternoReserva}`, 25, 116);
      } else {
        doc.text(`• Fluxo de Pagamento (Stripe): ${tipoPagamento === '50_sinal' ? '50% Sinal no ato da reserva / Restante depois' : '100% cobrado no ato da reserva'}`, 25, 116);
        doc.text(`• Política de Cancelamento Autorizada: ${politicaCancelamento}`, 25, 122);
      }
    } else {
      doc.text(`• Fixed Commission Rate: ${taxaComissao}% (VAT included)`, 25, 98);
      doc.text(`• Commission Base: ${baseEN}`, 25, 104);
      doc.text(`• Integration Model: ${modEN}`, 25, 110);
      if (modalidadeReserva === 'link_externo') {
        doc.text(`• Official Redirect URL: ${linkExternoReserva}`, 25, 116);
      } else {
        doc.text(`• Payment Flow (Stripe): ${tipoPagamento === '50_sinal' ? '50% Deposit on booking / Remainder later' : '100% collected on booking'}`, 25, 116);
        doc.text(`• Authorized Cancellation Policy: ${politicaCancelamento}`, 25, 122);
      }
    }

    // 3. CLÁUSULAS LEGAIS
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(contractLang === 'pt' ? "3. CLÁUSULAS CONTRATUAIS GERAIS" : "3. GENERAL CONTRACTUAL CLAUSES", 20, 135);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    let clausulasTexto = "";

    if (contractLang === 'pt') {
      clausulasTexto = 
        "3.1. Papel da HelloCamp: A HelloCamp atua exclusivamente como plataforma informática de intermediação. A HelloCamp não faz parte dos contratos celebrados diretamente entre o Parceiro e os Clientes, não sendo organizadora de pacotes de viagens nem seguradora.\n\n" +
        "3.2. Responsabilidade e Seguros: A organização, supervisão e segurança das atividades são da exclusiva responsabilidade do Parceiro. O Parceiro obriga-se a manter válidos todos os seguros exigidos por lei (Responsabilidade Civil e Acidentes Pessoais) e licenças de funcionamento, isentando a HelloCamp de qualquer litígio, acidente ou dano decorrente da atividade.\n\n" +
        "3.3. Impostos: O Parceiro é o único responsável por determinar, cobrar e remeter quaisquer impostos (IVA, impostos turísticos, rendimentos) aplicáveis às suas atividades e faturação aos clientes finais.\n\n" +
        "3.4. Tratamento de Dados (RGPD): O Parceiro compromete-se a tratar os dados pessoais, médicos e restrições alimentares transferidos através da HelloCamp no estrito cumprimento do Regulamento (UE) 2016/679 (RGPD), utilizando-os apenas para a execução do serviço contratado.\n\n" +
        "3.5. Lei Aplicável e Jurisdição: O presente acordo rege-se, para todos os efeitos legais, pela Lei Portuguesa. Fica expressamente convencionado que o foro competente para dirimir qualquer litígio será o da Comarca de Lisboa (Portugal), com renúncia expressa a qualquer outro fórum ou jurisdição internacional.";
    } else {
      clausulasTexto = 
        "3.1. HelloCamp's Role: HelloCamp acts strictly as an IT intermediation platform. HelloCamp is not a party to the contracts entered into directly between the Partner and the Clients, nor is it a travel package organizer or insurer.\n\n" +
        "3.2. Liability and Insurance: The organization, supervision, and safety of activities are the sole responsibility of the Partner. The Partner is obliged to keep valid all insurance required by law (Civil Liability and Personal Accidents) and operating licenses, exempting HelloCamp from any litigation, accident, or damage arising from the activity.\n\n" +
        "3.3. Taxes: The Partner is solely responsible for determining, collecting, and remitting any taxes (VAT, tourist taxes, income taxes) applicable to their activities and invoicing to end clients.\n\n" +
        "3.4. Data Protection (GDPR): The Partner commits to processing the personal, medical, and dietary data transferred via HelloCamp in strict compliance with Regulation (EU) 2016/679 (GDPR), using them only for the execution of the contracted service.\n\n" +
        "3.5. Governing Law and Jurisdiction: This agreement is governed, for all legal purposes, by Portuguese Law. It is expressly agreed that the competent forum to resolve any dispute will be the District of Lisbon (Portugal), with express waiver of any other international forum or jurisdiction.";
    }

    const splitClausulas = doc.splitTextToSize(clausulasTexto, pageWidth - 40);
    doc.text(splitClausulas, 20, 142);

    // 4. DECLARAÇÃO E ASSINATURAS
    let yPos = 210;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const declText = contractLang === 'pt' 
      ? "As partes reconhecem a força vinculativa da aceitação do presente contrato através de meios eletrónicos. O Parceiro declara ter lido e aceite as condições, renunciando a invocar a nulidade do documento com fundamento na ausência de assinatura autógrafa."
      : "The parties acknowledge the binding force of the acceptance of this agreement through electronic means. The Partner declares having read and accepted the conditions, waiving the right to invoke the nullity of the document based on the absence of a handwritten signature.";
    doc.text(doc.splitTextToSize(declText, pageWidth - 40), 20, yPos);

    yPos += 15;
    doc.line(20, yPos, 100, yPos);
    doc.text(contractLang === 'pt' ? `Assinado Digitalmente por:` : `Digitally Signed by:`, 20, yPos + 6);
    
    doc.setFontSize(12);
    doc.text(`${assinaturaNome} (${assinaturaCargo})`, 20, yPos + 12);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(contractLang === 'pt' ? `Data/Hora: ${new Date(timestamp).toLocaleString('pt-PT')}` : `Date/Time: ${new Date(timestamp).toLocaleString('en-US')}`, 20, yPos + 18);
    doc.text(`IP Address: ${userIP} (Secured via HelloCamp Cloud)`, 20, yPos + 23);

    return doc.output('blob');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concordaTermos) return alert(contractLang === 'pt' ? "Tem de aceitar os termos do contrato." : "You must accept the terms of the contract.");
    if (!assinaturaNome || !assinaturaCargo) return alert(contractLang === 'pt' ? "A assinatura digital é obrigatória." : "The digital signature is mandatory.");
    if (!empresaNome || !nif || !morada) return alert(contractLang === 'pt' ? "Dados Fiscais incompletos." : "Incomplete Fiscal Data.");

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

    const contratoFinal = {
      empresaNome, nif, pessoaContacto, emailContacto, telefone,
      formaJuridica, morada, codigoPostal, responsavelRGPD,
      modalidadeReserva, tipoPagamento, politicaCancelamento, linkExternoReserva, baseComissao,
      acordosComplementares, assinaturaNome, assinaturaCargo,
      dataSubmissao: timestampAtual, ipAssinatura: userIP
    };

    try {
      // 1. Atualizar Perfil e Contrato
      const { error: perfilErr } = await supabase.from('perfis').update({
        empresa_nome: empresaNome, nif_empresa: nif, nome_completo: pessoaContacto, telefone: telefone,
        status_contrato: 'Pendente de Revisão',
        contrato_dados: contratoFinal,
        modalidade_reserva: modalidadeReserva,
        link_externo_reserva: modalidadeReserva === 'link_externo' ? linkExternoReserva : null,
        base_comissao: baseComissao
      }).eq('id', id);
      if (perfilErr) throw perfilErr;

      // 2. Gerar PDF e Upload
      const pdfBlob = await gerarEGuardarPDF(userIP, timestampAtual);
      const fileName = `contrato_global_${id}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage.from('campos-documentos').upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('campos-documentos').getPublicUrl(fileName);
      const contratoUrl = publicUrlData.publicUrl;

      // 3. Atualizar Campos Vinculados
      await supabase.from('campos').update({ 
        status_aprovacao: 'Pendente de Revisão', 
        contrato_dados: contratoFinal,
        contrato_parceiro_url: contratoUrl,
        modalidade_reserva: modalidadeReserva,
        link_externo_reserva: modalidadeReserva === 'link_externo' ? linkExternoReserva : null,
        tipo_pagamento: modalidadeReserva !== 'link_externo' ? tipoPagamento : null,
        politica_cancelamento: modalidadeReserva !== 'link_externo' ? politicaCancelamento : null,
        base_comissao: baseComissao
      }).eq('organizador_id', id);
      
      try {
        await fetch('/api/notificacoes/status-contrato', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parceiroEmail: 'info@hellocamp.pt', nomeCampo: `CONTRATO ASSINADO: ${empresaNome}`, status: 'Para Revisão HQ', lang: 'pt' })
        });
      } catch (e) {}

      setJaAssinado(true);
      setPdfGeradoUrl(contratoUrl);
      alert(contractLang === 'pt' ? "Contrato assinado com sucesso! A nossa equipa irá agora validar o perfil e publicar os campos." : "Contract signed successfully! Our team will now validate the profile and publish your camps.");

    } catch (err: any) {
      alert("Erro crítico: " + err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest animate-pulse bg-slate-50">A carregar documento seguro... / Loading secure document...</div>;

  const dataAtual = new Date().toLocaleDateString(contractLang === 'pt' ? 'pt-PT' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-900 selection:bg-yellow-200">
      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden relative">
        
        {/* CABEÇALHO COM TOGGLE DE LÍNGUA */}
        <div className="bg-[#0E3A68] p-10 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-4 right-6 z-20 flex bg-blue-900/50 p-1 rounded-lg border border-blue-400/30">
            <button onClick={() => setContractLang('pt')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${contractLang === 'pt' ? 'bg-white text-[#0E3A68]' : 'text-white hover:bg-blue-800'}`}>PT</button>
            <button onClick={() => setContractLang('en')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${contractLang === 'en' ? 'bg-white text-[#0E3A68]' : 'text-white hover:bg-blue-800'}`}>EN</button>
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
             <p className="text-emerald-700 text-lg mb-8">{contractLang === 'pt' ? 'O seu perfil encontra-se agora sob revisão final pela equipa HelloCamp.' : 'Your profile is now under final review by the HelloCamp team.'}</p>
             {pdfGeradoUrl && (
               <a href={pdfGeradoUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black px-8 py-4 rounded-xl shadow-md transition-colors font-sans uppercase tracking-widest text-sm">
                 {contractLang === 'pt' ? 'Fazer Download do PDF Assinado' : 'Download Signed PDF'}
               </a>
             )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-12">

            {/* FASES EXPLICATIVAS VISUAIS (CORRIGIDO ALINHAMENTO DO NÚMERO E TÍTULO) */}
            <div className="space-y-8 md:space-y-12 mb-10 md:mb-16 font-sans">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">📝</div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2">
                    <span className="text-slate-400 mr-2">1.</span>
                    {contractLang === 'pt' ? 'Celebração do contrato' : 'Contract Execution'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
                    {contractLang === 'pt' ? 'Este contrato regula a divulgação e a intermediação das suas ofertas através da plataforma HelloCamp. O acordo mantém-se válido até ao final do ano civil em curso, sendo automaticamente renovado, salvo denúncia.' : 'This contract regulates the promotion and intermediation of your offers through the HelloCamp platform. The agreement remains valid until the end of the current calendar year, being automatically renewed unless terminated.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 text-blue-600 border border-blue-100 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">🏖️</div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2">
                    <span className="text-slate-400 mr-2">2.</span>
                    {contractLang === 'pt' ? 'Divulgação das ofertas' : 'Promotion of Offers'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
                    {contractLang === 'pt' ? 'A HelloCamp procede à recolha e organização das informações relativas às atividades disponibilizadas pelo parceiro. Promovemos os programas e partilhamos a sua marca de forma transparente.' : 'HelloCamp collects and organizes the information related to the activities provided by the partner. We promote the programs and share your brand transparently.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">€</div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2">
                    <span className="text-slate-400 mr-2">3.</span>
                    {contractLang === 'pt' ? 'Pagamento e Comissão' : 'Payment and Commission'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
                    {contractLang === 'pt' ? 'A HelloCamp cobra uma comissão sobre cada reserva concluída. O modelo de pagamento e as condições operacionais aplicáveis à sua conta estão definidos no Anexo Operacional abaixo, podendo ser ajustados por si.' : 'HelloCamp charges a commission on each completed booking. The payment model and operational conditions applicable to your account are defined in the Operational Annex below and can be adjusted by you.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-300 w-full my-8 md:my-12"></div>

            {/* 1. IDENTIFICAÇÃO DO PARCEIRO (EDITÁVEL) */}
            <section className="mb-12">
              <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 tracking-tight">1. {contractLang === 'pt' ? 'Dados de Faturação e Identificação' : 'Billing and Identification Data'}</h2>
              <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 shadow-inner font-sans">
                
                <div className="md:col-span-2">
                  <label className={labelClass}>{contractLang === 'pt' ? 'Entidade Organizadora / Nome Fiscal *' : 'Organizing Entity / Legal Name *'}</label>
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

            {/* 2. TERMOS OPERACIONAIS (COMISSÃO FIXA, RESTO EDITÁVEL) */}
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

            {/* 4. ASSINATURA DIGITAL E ACEITAÇÃO */}
            <section className="mb-8 font-sans">
              <div className="bg-[#059669]/5 border-2 border-[#059669]/20 rounded-[2rem] p-6 md:p-8">
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
                  <Link href={`/${lang}/termos`} target="_blank" className="flex-shrink-0 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors shadow-sm">
                    {contractLang === 'pt' ? 'Ler Termos & Condições' : 'Read Terms & Conditions'}
                  </Link>
                </div>

              </div>
            </section>

            <button type="submit" disabled={submitting} className="w-full py-5 text-sm uppercase tracking-widest font-black rounded-2xl border-none text-white bg-[#0E3A68] hover:bg-[#0b2b4d] transition-all shadow-xl shadow-[#0E3A68]/30 hover:-translate-y-1 cursor-pointer disabled:opacity-50 font-sans">
              {submitting ? (contractLang === 'pt' ? 'A Processar Documento Legal...' : 'Processing Legal Document...') : (contractLang === 'pt' ? 'Assinar Digitalmente Acordo' : 'Digitally Sign Agreement')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
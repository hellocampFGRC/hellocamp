"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
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

  // Campos Fixos (Definidos por HQ no Pre-Fill)
  const [taxaComissao, setTaxaComissao] = useState(12);
  const [baseComissao, setBaseComissao] = useState("total");
  const [modalidadeReserva, setModalidadeReserva] = useState("direta");
  const [linkExternoReserva, setLinkExternoReserva] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState("100_total");
  const [politicaCancelamento, setPoliticaCancelamento] = useState("");
  const [acordosComplementares, setAcordosComplementares] = useState("");

  const labelClass = "text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block";
  const inputClassCustom = "border-b border-gray-400 outline-none bg-transparent px-1 py-1.5 text-base font-bold text-slate-900 placeholder:text-gray-300 w-full focus:border-black focus:bg-white transition-colors rounded-t-sm";

  useEffect(() => {
    const fetchPerfil = async () => {
      // 1. Procurar o Perfil / Organizador
      const { data, error } = await supabase.from("perfis").select("*").eq("id", id).single();

      if (error || !data) {
        alert("Link inválido ou expirado.");
        router.push(`/${lang}`);
        return;
      }

      setPerfil(data);

      // 2. Procurar pelo menos um campo para dar contexto ao Parceiro
      const { data: campoData } = await supabase.from("campos").select("nome").eq("organizador_id", id).limit(1);
      if (campoData && campoData.length > 0) setCampoNome(campoData[0].nome);

      // 3. Pré-preencher os dados base que já tivermos do Perfil ou de um contrato prévio não assinado
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

      // 4. Carregar os Termos Fixos definidos pelo SuperAdmin HQ
      setTaxaComissao(data.taxa_comissao !== null ? data.taxa_comissao : 12);
      setBaseComissao(data.base_comissao || 'total');
      setModalidadeReserva(cd.modalidadeReserva || data.modalidade_reserva || 'direta');
      setLinkExternoReserva(cd.linkExternoReserva || data.link_externo_reserva || '');
      setTipoPagamento(cd.tipoPagamento || '100_total');
      setPoliticaCancelamento(cd.politicaCancelamento || 'Moderada (Reembolso a 50% até 15 dias antes)');
      setAcordosComplementares(cd.acordosComplementares || '');

      setLoading(false);
    };

    fetchPerfil();
  }, [id, lang, router]);

  // Função robusta de geração do PDF
  const gerarEGuardarPDF = async (userIP: string, timestamp: string) => {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Títulos e Datas
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(contractLang === 'pt' ? "CONTRATO GLOBAL DE INTERMEDIAÇÃO E SERVIÇOS" : "GLOBAL INTERMEDIATION AND SERVICES AGREEMENT", pageWidth / 2, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const dataAtualPT = new Date(timestamp).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });
    const dataAtualEN = new Date(timestamp).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(contractLang === 'pt' ? `Data de Emissão: ${dataAtualPT}` : `Issue Date: ${dataAtualEN}`, pageWidth / 2, 28, { align: "center" });
    doc.line(20, 35, pageWidth - 20, 35);

    // DADOS DAS PARTES
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(contractLang === 'pt' ? "1. IDENTIFICAÇÃO DAS PARTES" : "1. IDENTIFICATION OF THE PARTIES", 20, 45);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    if (contractLang === 'pt') {
      doc.text(`PRIMEIRA OUTORGANTE (Plataforma): HelloCamp Portugal`, 20, 55);
      doc.text(`SEGUNDA OUTORGANTE (Parceiro/Organizador): ${empresaNome} (${formaJuridica})`, 20, 62);
      doc.text(`Sede: ${morada}, ${codigoPostal} | NIF: ${nif}`, 20, 69);
      doc.text(`Contacto: ${pessoaContacto} | E-mail: ${emailContacto} | Tel: ${telefone}`, 20, 76);
      doc.text(`Encarregado Proteção de Dados (RGPD): ${responsavelRGPD || pessoaContacto}`, 20, 83);
    } else {
      doc.text(`FIRST PARTY (Platform): HelloCamp Portugal`, 20, 55);
      doc.text(`SECOND PARTY (Partner/Organizer): ${empresaNome} (${formaJuridica})`, 20, 62);
      doc.text(`Headquarters: ${morada}, ${codigoPostal} | Tax ID: ${nif}`, 20, 69);
      doc.text(`Contact: ${pessoaContacto} | E-mail: ${emailContacto} | Tel: ${telefone}`, 20, 76);
      doc.text(`Data Protection Officer (GDPR): ${responsavelRGPD || pessoaContacto}`, 20, 83);
    }

    // TERMOS FINANCEIROS
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(contractLang === 'pt' ? "2. CONDIÇÕES FINANCEIRAS E OPERACIONAIS" : "2. FINANCIAL AND OPERATIONAL CONDITIONS", 20, 100);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    let basePT = baseComissao === "apenas_programa" ? "Apenas sobre Valor Base do Programa" : (baseComissao === "sem_comissao" ? "Isento (0%)" : "Sobre Valor Total (Programa + Extras)");
    let baseEN = baseComissao === "apenas_programa" ? "Only on Program Base Value" : (baseComissao === "sem_comissao" ? "Exempt (0%)" : "On Total Value (Program + Extras)");

    let modPT = modalidadeReserva === "direta" ? "Reserva Direta no Checkout" : (modalidadeReserva === "email" ? "Sob Consulta (Email)" : "Link Externo");
    let modEN = modalidadeReserva === "direta" ? "Direct Checkout Booking" : (modalidadeReserva === "email" ? "On Request (Email)" : "External Link");

    if (contractLang === 'pt') {
      doc.text(`• Taxa de Comissão Fixada: ${taxaComissao}% (IVA incluído à taxa legal em vigor)`, 25, 110);
      doc.text(`• Base de Incidência da Comissão: ${basePT}`, 25, 117);
      doc.text(`• Modalidade de Integração: ${modPT}`, 25, 124);
      if (modalidadeReserva === 'link_externo') {
        doc.text(`• URL Oficial para Redirecionamento: ${linkExternoReserva}`, 25, 131);
        doc.text(`• Gestão de Pagamentos e Faturação: Independente e a cargo do Parceiro.`, 25, 138);
      } else {
        doc.text(`• Fluxo de Pagamento (Stripe): ${tipoPagamento === '50_sinal' ? '50% Sinal no ato da reserva / Restante depois' : '100% cobrado no ato da reserva'}`, 25, 131);
        doc.text(`• Política de Cancelamento Autorizada: ${politicaCancelamento}`, 25, 138);
      }
    } else {
      doc.text(`• Fixed Commission Rate: ${taxaComissao}% (VAT included at the current legal rate)`, 25, 110);
      doc.text(`• Commission Base: ${baseEN}`, 25, 117);
      doc.text(`• Integration Model: ${modEN}`, 25, 124);
      if (modalidadeReserva === 'link_externo') {
        doc.text(`• Official Redirect URL: ${linkExternoReserva}`, 25, 131);
        doc.text(`• Payment and Invoicing: Independently managed by the Partner.`, 25, 138);
      } else {
        doc.text(`• Payment Flow (Stripe): ${tipoPagamento === '50_sinal' ? '50% Deposit on booking / Remainder later' : '100% collected on booking'}`, 25, 131);
        doc.text(`• Authorized Cancellation Policy: ${politicaCancelamento}`, 25, 138);
      }
    }

    // CLÁUSULAS LEGAIS
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(contractLang === 'pt' ? "3. CLÁUSULAS CONTRATUAIS GERAIS (SÍNTESE LEGAL)" : "3. GENERAL CONTRACTUAL CLAUSES (LEGAL SUMMARY)", 20, 155);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let clausulasTexto = "";

    if (contractLang === 'pt') {
      clausulasTexto = "3.1. Responsabilidade Civil: A HelloCamp atua de forma estrita como plataforma informática de intermediação e motor de busca. A organização, gestão técnica, supervisão e segurança das atividades são da inteira e exclusiva responsabilidade da Segunda Outorgante (o Parceiro), que se obriga a manter válidos todos os seguros exigidos por lei (Responsabilidade Civil e Acidentes Pessoais) e as respetivas licenças de funcionamento (Ex: RNAAT/RNAVT ou licenças camarárias).\n\n3.2. Proteção de Dados (RGPD): O Parceiro compromete-se a tratar os dados pessoais, médicos e restrições alimentares fornecidos pela HelloCamp no estrito cumprimento do Regulamento (UE) 2016/679 (RGPD), utilizando-os apenas para a execução do serviço contratado pelo encarregado de educação e eliminando-os assim que deixem de ser estritamente necessários.\n\n3.3. Lei Aplicável e Jurisdição: Independentemente do país de origem ou da sede da Segunda Outorgante, o presente contrato rege-se, para todos os efeitos legais, pela Lei Portuguesa. Fica expressamente convencionado que o foro competente para dirimir qualquer litígio será o da Comarca de Lisboa, com renúncia expressa a qualquer outro.";
    } else {
      clausulasTexto = "3.1. Civil Liability: HelloCamp acts strictly as an intermediation IT platform and search engine. The organization, technical management, supervision, and safety of the activities are the entire and exclusive responsibility of the Second Party (the Partner), who is obliged to keep valid all insurance required by law (Civil Liability and Personal Accidents) and the respective operating licenses.\n\n3.2. Data Protection (GDPR): The Partner commits to processing the personal, medical, and dietary restriction data provided by HelloCamp in strict compliance with Regulation (EU) 2016/679 (GDPR), using them only for the execution of the service contracted by the guardian and deleting them as soon as they are no longer strictly necessary.\n\n3.3. Governing Law and Jurisdiction: Regardless of the country of origin or headquarters of the Second Party, this agreement is governed, for all legal purposes, by Portuguese Law. It is expressly agreed that the competent forum to resolve any dispute will be the District of Lisbon, with express waiver of any other.";
    }

    const splitClausulas = doc.splitTextToSize(clausulasTexto, pageWidth - 40);
    doc.text(splitClausulas, 20, 165);

    // DECLARAÇÃO E ASSINATURAS (No fim da página)
    let yPos = 240;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const declText = contractLang === 'pt' 
      ? "O Parceiro declara ter lido e aceite integralmente as condições, reconhecendo a validade desta assinatura eletrónica e renunciando a invocar a nulidade por ausência de assinatura autógrafa."
      : "The Partner declares having read and fully accepted the conditions, acknowledging the validity of this electronic signature and waiving the right to invoke nullity due to the absence of a handwritten signature.";
    doc.text(doc.splitTextToSize(declText, pageWidth - 40), 20, yPos);

    yPos += 15;
    doc.line(20, yPos, 100, yPos);
    doc.text(contractLang === 'pt' ? `Assinado Digitalmente por:` : `Digitally Signed by:`, 20, yPos + 7);
    doc.text(`${assinaturaNome} (${assinaturaCargo})`, 20, yPos + 14);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(contractLang === 'pt' ? `Data/Hora: ${new Date(timestamp).toLocaleString('pt-PT')}` : `Date/Time: ${new Date(timestamp).toLocaleString('en-US')}`, 20, yPos + 21);
    doc.text(`IP: ${userIP} (Secured via HelloCamp Server)`, 20, yPos + 27);

    return doc.output('blob');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concordaTermos) return alert(contractLang === 'pt' ? "Tem de aceitar os termos do contrato." : "You must accept the terms of the contract.");
    if (!assinaturaNome || !assinaturaCargo) return alert(contractLang === 'pt' ? "A assinatura digital é obrigatória." : "The digital signature is mandatory.");
    if (!empresaNome || !nif || !morada) return alert(contractLang === 'pt' ? "Dados Fiscais incompletos." : "Incomplete Fiscal Data.");

    setSubmitting(true);

    // Captura de IP para Validade Legal
    let userIP = "Desconhecido";
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (res.ok) {
        const ipData = await res.json();
        userIP = ipData.ip;
      }
    } catch (err) {
      console.error("Não foi possível capturar o IP.", err);
    }

    const timestampAtual = new Date().toISOString();

    const contratoFinal = {
      empresaNome, nif, pessoaContacto, emailContacto, telefone,
      formaJuridica, morada, codigoPostal, responsavelRGPD,
      modalidadeReserva, tipoPagamento, politicaCancelamento, linkExternoReserva,
      acordosComplementares, assinaturaNome, assinaturaCargo,
      dataSubmissao: timestampAtual, ipAssinatura: userIP
    };

    try {
      // 1. Atualizar Perfil e Contrato
      const { error: perfilErr } = await supabase.from('perfis').update({
        empresa_nome: empresaNome, nif_empresa: nif, nome_completo: pessoaContacto, telefone: telefone,
        status_contrato: 'Pendente de Revisão', // Volta para a HQ aprovar!
        contrato_dados: contratoFinal
      }).eq('id', id);
      if (perfilErr) throw perfilErr;

      // 2. Gerar PDF e Fazer Upload
      const pdfBlob = await gerarEGuardarPDF(userIP, timestampAtual);
      const fileName = `contrato_global_${id}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage.from('campos-documentos').upload(fileName, pdfBlob, { contentType: 'application/pdf' });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('campos-documentos').getPublicUrl(fileName);
      const contratoUrl = publicUrlData.publicUrl;

      // 3. Atualizar Todos os Campos Vinculados
      const { error: camposErr } = await supabase.from('campos').update({ 
        status_aprovacao: 'Pendente de Revisão', 
        contrato_dados: contratoFinal,
        contrato_parceiro_url: contratoUrl
      }).eq('organizador_id', id);
      if (camposErr) console.warn("Erro ao desativar os campos na plataforma (eles já devem estar pendentes): ", camposErr);
      
      // Notificar SuperAdmin
      try {
        await fetch('/api/notificacoes/status-contrato', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parceiroEmail: 'info@hellocamp.pt', nomeCampo: `CONTRATO ASSINADO POR: ${empresaNome}`, status: 'Para Revisão HQ', lang: 'pt' })
        });
      } catch (e) { console.error(e) }

      alert(contractLang === 'pt' ? "Contrato assinado com sucesso! A nossa equipa irá agora validar o perfil e publicar os campos." : "Contract signed successfully! Our team will now validate the profile and publish your camps.");
      router.push(`/${lang}`);

    } catch (err: any) {
      alert("Erro crítico: " + err.message);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">A carregar documento seguro... / Loading secure document...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden relative">
        
        {/* CABEÇALHO DO CONTRATO COM TOGGLE DE LÍNGUA */}
        <div className="bg-[#0E3A68] p-10 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-4 right-6 z-20 flex bg-blue-900/50 p-1 rounded-lg border border-blue-400/30">
            <button onClick={() => setContractLang('pt')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${contractLang === 'pt' ? 'bg-white text-[#0E3A68]' : 'text-white hover:bg-blue-800'}`}>PT</button>
            <button onClick={() => setContractLang('en')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${contractLang === 'en' ? 'bg-white text-[#0E3A68]' : 'text-white hover:bg-blue-800'}`}>EN</button>
          </div>

          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-30 -translate-y-1/2 -translate-x-1/4"></div>
          <h1 className="text-3xl md:text-4xl font-black text-white m-0 tracking-tight relative z-10 mt-4">
            {contractLang === 'pt' ? 'Acordo de Intermediação HelloCamp' : 'HelloCamp Intermediation Agreement'}
          </h1>
          <p className="text-blue-100 mt-3 font-medium relative z-10 max-w-lg mx-auto">
            {contractLang === 'pt' ? 'Valide os termos operacionais e preencha os seus dados fiscais para dar início à parceria comercial.' : 'Review the operational terms and fill in your legal details to initiate the commercial partnership.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-12">

          {/* 1. IDENTIFICAÇÃO DO PARCEIRO (EDITÁVEL) */}
          <section className="mb-12">
            <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 tracking-tight">1. {contractLang === 'pt' ? 'Dados de Faturação e Identificação' : 'Billing and Identification Data'}</h2>
            <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 shadow-inner">
              
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

          {/* 2. TERMOS OPERACIONAIS (FIXOS / READ-ONLY) */}
          <section className="mb-12">
            <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 tracking-tight">2. {contractLang === 'pt' ? 'Termos Operacionais e Financeiros' : 'Operational and Financial Terms'}</h2>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-inner">
              
              <div className="md:col-span-2 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">{contractLang === 'pt' ? 'Taxa de Comissão (Fee)' : 'Commission Rate (Fee)'}</span>
                <span className="text-xl font-black text-[#0E3A68] bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-100">
                  {taxaComissao}%
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{contractLang === 'pt' ? 'Base de Incidência' : 'Commission Base'}</span>
                <p className="text-sm font-bold text-slate-800 m-0">
                  {baseComissao === 'total' 
                    ? (contractLang === 'pt' ? 'Sobre o Valor Total (Programa + Extras)' : 'On Total Value (Program + Extras)') 
                    : baseComissao === 'apenas_programa' 
                      ? (contractLang === 'pt' ? 'Apenas sobre Valor Base do Programa' : 'Only on Program Base Value') 
                      : (contractLang === 'pt' ? 'Isento (0%)' : 'Exempt (0%)')}
                </p>
              </div>

              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{contractLang === 'pt' ? 'Modelo de Integração' : 'Integration Model'}</span>
                <p className="text-sm font-bold text-slate-800 m-0">
                  {modalidadeReserva === 'direta' 
                    ? (contractLang === 'pt' ? 'Reserva Direta no Checkout (HelloCamp)' : 'Direct Checkout Booking (HelloCamp)') 
                    : modalidadeReserva === 'email' 
                      ? (contractLang === 'pt' ? 'Encaminhamento de Leads via Email' : 'Lead Forwarding via Email') 
                      : (contractLang === 'pt' ? 'Redirecionamento para Link Externo' : 'Redirection to External Link')}
                </p>
              </div>

              {modalidadeReserva === 'link_externo' ? (
                <div className="md:col-span-2">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{contractLang === 'pt' ? 'Link Oficial para Redirecionamento' : 'Official Redirect Link'}</span>
                  <p className="text-sm font-bold text-blue-600 break-all m-0">
                    {linkExternoReserva}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {contractLang === 'pt' ? 'Gestão de pagamento e reservas é feita pela sua plataforma. Faturação de comissões feita via acerto mensal pelas leads fornecidas.' : 'Payment and booking management handled by your platform. Commission invoicing done via monthly settlement for leads provided.'}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{contractLang === 'pt' ? 'Fluxo de Pagamento' : 'Payment Flow'}</span>
                    <p className="text-sm font-bold text-slate-800 m-0">
                      {tipoPagamento === '100_total' 
                        ? (contractLang === 'pt' ? '100% cobrado no ato da reserva' : '100% charged upon booking') 
                        : (contractLang === 'pt' ? 'Sinal de 50% Agora + Restante Depois' : '50% Deposit Now + Remainder Later')}
                    </p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{contractLang === 'pt' ? 'Política de Cancelamento' : 'Cancellation Policy'}</span>
                    <p className="text-sm font-bold text-slate-800 m-0">
                      {politicaCancelamento || (contractLang === 'pt' ? 'Não definida' : 'Not defined')}
                    </p>
                  </div>
                </>
              )}
            </div>

            {acordosComplementares && (
              <div className="mt-4 bg-amber-50 p-6 rounded-2xl border border-amber-200">
                <span className="block text-[10px] font-black uppercase tracking-widest text-amber-800 mb-2">{contractLang === 'pt' ? 'Acordos Complementares / Exceções' : 'Complementary Agreements / Exceptions'}</span>
                <p className="text-sm font-medium text-amber-900 m-0 italic leading-relaxed">"{acordosComplementares}"</p>
              </div>
            )}
          </section>

          {/* 3. SÍNTESE JURÍDICA */}
          <section className="mb-12">
            <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 tracking-tight">3. {contractLang === 'pt' ? 'Responsabilidade Legal e Foro' : 'Legal Liability and Jurisdiction'}</h2>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner space-y-4 text-xs text-slate-600 leading-relaxed text-justify">
              <p><strong>{contractLang === 'pt' ? 'A. Responsabilidade Civil e Seguros:' : 'A. Civil Liability & Insurance:'}</strong> {contractLang === 'pt' ? 'A HelloCamp atua de forma estrita como plataforma informática de intermediação. A organização técnica, gestão e segurança das atividades são da inteira responsabilidade do Parceiro, que obrigatoriamente deterá os seguros de Responsabilidade Civil e Acidentes Pessoais legalmente exigíveis, isentando a HelloCamp de qualquer litígio com os participantes decorrente da atividade de campo.' : 'HelloCamp acts strictly as an IT intermediation platform. The technical organization, management, and safety of activities are the sole responsibility of the Partner, who must hold legally required Civil Liability and Personal Accident insurance, exempting HelloCamp from any litigation with participants arising from the camp activity.'}</p>
              <p><strong>{contractLang === 'pt' ? 'B. Proteção de Dados (RGPD):' : 'B. Data Protection (GDPR):'}</strong> {contractLang === 'pt' ? 'O Parceiro assume o papel de Responsável pelo Tratamento dos dados pessoais, médicos e restrições alimentares transferidos através da HelloCamp para a prossecução do serviço, assumindo integral cumprimento do Regulamento (UE) 2016/679.' : 'The Partner assumes the role of Data Controller for the personal, medical, and dietary data transferred via HelloCamp to provide the service, assuming full compliance with Regulation (EU) 2016/679.'}</p>
              <p className="font-bold text-slate-900"><strong>{contractLang === 'pt' ? 'C. Lei e Foro Competente:' : 'C. Governing Law and Jurisdiction:'}</strong> {contractLang === 'pt' ? 'Independentemente da jurisdição da sede do Parceiro, o presente acordo rege-se, para todos os efeitos, pela Lei Portuguesa. Qualquer litígio emergente da interpretação ou execução deste acordo será submetido à competência exclusiva dos tribunais da Comarca de Lisboa (Portugal).' : 'Regardless of the Partner’s headquarters jurisdiction, this agreement is governed, for all purposes, by Portuguese Law. Any dispute arising from the interpretation or execution of this agreement shall be submitted to the exclusive jurisdiction of the courts of the District of Lisbon (Portugal).'}</p>
            </div>
          </section>

          {/* 4. ASSINATURA DIGITAL */}
          <section className="mb-8">
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

              <div className="bg-white p-5 rounded-xl border border-emerald-100">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <input type="checkbox" required checked={concordaTermos} onChange={e => setConcordaTermos(e.target.checked)} className="mt-1 w-6 h-6 accent-emerald-600 cursor-pointer flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                    {contractLang === 'pt' 
                      ? 'Declaro sob compromisso de honra que sou o representante legal da entidade acima identificada. Aceito os Termos Operacionais aqui descritos, renuncio invocar a nulidade do documento por falta de assinatura autógrafa, e autorizo a comercialização dos nossos programas através da HelloCamp.' 
                      : 'I declare upon my honor that I am the legal representative of the entity identified above. I accept the Operational Terms described herein, waive the right to invoke the nullity of the document due to lack of handwritten signature, and authorize the marketing of our programs through HelloCamp.'}
                  </span>
                </label>
              </div>

            </div>
          </section>

          <button type="submit" disabled={submitting} className="w-full py-5 text-sm uppercase tracking-widest font-black rounded-2xl border-none text-white bg-[#0E3A68] hover:bg-[#0b2b4d] transition-all shadow-xl shadow-[#0E3A68]/30 hover:-translate-y-1 cursor-pointer disabled:opacity-50">
            {submitting ? (contractLang === 'pt' ? 'A Processar Documento Legal...' : 'Processing Legal Document...') : (contractLang === 'pt' ? 'Assinar Digitalmente Acordo' : 'Digitally Sign Agreement')}
          </button>
        </form>
      </div>
    </div>
  );
}
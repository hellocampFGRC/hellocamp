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
  
  const [contractLang, setContractLang] = useState<'pt' | 'en'>(lang === 'pt' ? 'pt' : 'en');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [campoNome, setCampoNome] = useState<string>("Vários Programas");
  const [jaAssinado, setJaAssinado] = useState(false);
  const [pdfGeradoUrl, setPdfGeradoUrl] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [authError, setAuthError] = useState("");

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

  // Novos campos para a password final da conta
  const [novaPassword, setNovaPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
      setAuthError(contractLang === 'pt' ? "O E-mail inserido não corresponde aos registos confidenciais deste parceiro." : "The entered E-mail does not match the confidential records for this partner.");
    }
  };

  const gerarEGuardarPDF = async (userIP: string, timestamp: string) => {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
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

    // 2. TERMOS FINANCEIROS
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
      doc.text(`• Taxa de Comissão Fixada: ${taxaComissao}% (IVA incluído à taxa legal)`, 25, 110);
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
      doc.text(`• Fixed Commission Rate: ${taxaComissao}% (VAT included)`, 25, 110);
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

    // 3. CLÁUSULAS LEGAIS
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(contractLang === 'pt' ? "3. CLÁUSULAS CONTRATUAIS GERAIS (SÍNTESE LEGAL)" : "3. GENERAL CONTRACTUAL CLAUSES (LEGAL SUMMARY)", 20, 155);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let clausulasTexto = "";

    if (contractLang === 'pt') {
      clausulasTexto = "3.1. Responsabilidade Civil: A HelloCamp atua de forma estrita como plataforma informática de intermediação e motor de busca. A organização, gestão técnica, supervisão e segurança das atividades são da inteira e exclusiva responsabilidade da Segunda Outorgante (o Parceiro), que se obriga a manter válidos todos os seguros exigidos por lei (Responsabilidade Civil e Acidentes Pessoais) e as respetivas licenças de funcionamento (Ex: RNAAT/RNAVT ou licenças camarárias).\n\n3.2. Proteção de Dados (RGPD): O Parceiro compromete-se a tratar os dados pessoais, médicos e restrições alimentares fornecidos pela HelloCamp no estrito cumprimento do Regulamento (UE) 2016/679 (RGPD), utilizando-os apenas para a execução do serviço contratado pelo encarregado de educação e eliminando-os assim que deixem de ser estritamente necessários.\n\n3.3. Lei Aplicável e Jurisdição: Independentemente do país de origem ou da sede da Segunda Outorgante, o presente contrato rege-se, para todos os efeitos legais, pela Lei Portuguesa. Fica expressamente convencionado que o foro competente para dirimir qualquer litígio será o da Comarca de Lisboa, com renúncia expressa a qualquer outro.";
    } else {
      clausulasTexto = "3.1. Civil Liability: HelloCamp acts strictly as an IT intermediation platform and search engine. The organization, technical management, supervision, and safety of the activities are the entire and exclusive responsibility of the Second Party (the Partner), who is obliged to keep valid all insurance required by law (Civil Liability and Personal Accidents) and the respective operating licenses.\n\n3.2. Data Protection (GDPR): The Partner commits to processing the personal, medical, and dietary restriction data provided by HelloCamp in strict compliance with Regulation (EU) 2016/679 (GDPR), using them only for the execution of the service contracted by the guardian and deleting them as soon as they are no longer strictly necessary.\n\n3.3. Governing Law and Jurisdiction: Regardless of the country of origin or headquarters of the Second Party, this agreement is governed, for all legal purposes, by Portuguese Law. It is expressly agreed that the competent forum to resolve any dispute will be the District of Lisbon, with express waiver of any other.";
    }

    const splitClausulas = doc.splitTextToSize(clausulasTexto, pageWidth - 40);
    doc.text(splitClausulas, 20, 165);

    // 4. DECLARAÇÃO E ASSINATURAS
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

    const contratoFinal = {
      empresaNome, nif, pessoaContacto, emailContacto, telefone,
      formaJuridica, morada, codigoPostal, responsavelRGPD,
      modalidadeReserva, tipoPagamento, politicaCancelamento, linkExternoReserva, baseComissao,
      acordosComplementares, assinaturaNome, assinaturaCargo,
      dataSubmissao: timestampAtual, ipAssinatura: userIP
    };

    try {
      const pdfBlob = await gerarEGuardarPDF(userIP, timestampAtual);
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

      // LOGIN AUTOMÁTICO SE TUDO CORRER BEM
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: inputEmail,
        password: novaPassword,
      });

      if (signInError) {
        // Se falhar o login, mas assinou com sucesso, redireciona para a página de login
        alert(contractLang === 'pt' ? "Contrato assinado! Redirecionando para login." : "Contract signed! Redirecting to login.");
        router.push(`/${lang}/admin/login`);
      } else {
        // Se fizer login com sucesso, atira direto para o Dashboard!
        router.push(`/${lang}/admin/dashboard`);
      }
      
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
  // VIEW 2: ECRÃ DE ASSINATURA / CONTRATO
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-900 selection:bg-yellow-200">
      <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden relative">
        
        {/* CABEÇALHO DO CONTRATO COM TOGGLE DE LÍNGUA */}
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
             <p className="text-emerald-700 text-lg mb-8">{contractLang === 'pt' ? 'O seu perfil e os seus programas encontram-se agora ativos e visíveis para as famílias na plataforma HelloCamp.' : 'Your profile and programs are now active and visible to families on the HelloCamp platform.'}</p>
             {pdfGeradoUrl && (
               <a href={pdfGeradoUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black px-8 py-4 rounded-xl shadow-md transition-colors font-sans uppercase tracking-widest text-sm">
                 {contractLang === 'pt' ? 'Fazer Download do PDF Assinado' : 'Download Signed PDF'}
               </a>
             )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-12">

            {/* RESUMO EXECUTIVO VISUAL */}
            <div className="space-y-8 md:space-y-12 mb-10 md:mb-16 font-sans">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">📝</div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2 flex items-center">
                    <span className="text-slate-400 mr-3 text-sm">1.</span>
                    {contractLang === 'pt' ? 'Objeto do Acordo' : 'Object of the Agreement'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
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
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
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
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
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
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
                    {contractLang === 'pt' ? 'A remuneração devida à HelloCamp incide exclusivamente sobre o sucesso da intermediação. Os detalhes operacionais e as modalidades de pagamento encontram-se fixados e editáveis no Anexo Financeiro do presente documento.' : 'The remuneration due to HelloCamp is based exclusively on the success of the intermediation. The operational details and payment methods are set out and editable in the Financial Annex of this document.'}
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

            {/* 2. TERMOS OPERACIONAIS */}
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

            {/* 4. CONFIGURAÇÃO DE PASSWORD E ASSINATURA */}
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
                  <Link href={`/${lang}/termos`} target="_blank" className="flex-shrink-0 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors shadow-sm">
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
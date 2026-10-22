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

  // Estado para controlar o Modal de Visualização do Contrato (Read-Only Formal)
  const [contratoModalCampo, setContratoModalCampo] = useState<any | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const fetchCampos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return setLoading(false);

      const { data: perfilData } = await supabase
        .from('perfis')
        .select('taxa_comissao, base_comissao, contrato_dados')
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

  // Função para descarregar o PDF (Usa o URL oficial do Storage ou gera na hora via jsPDF como fallback)
  const handleDownloadPDF = (campo: any) => {
    setDownloadingPdf(true);
    try {
      // 1. Se já existir o PDF oficial guardado no Supabase Storage, abre-o diretamente
      if (campo.contrato_parceiro_url) {
        window.open(campo.contrato_parceiro_url, '_blank');
        setDownloadingPdf(false);
        return;
      }

      // 2. Fallback: Gerar o PDF na hora com jsPDF caso seja um campo antigo sem URL guardado
      const dados = campo.contrato_dados || perfilBase?.contrato_dados || {};
      const taxaComissao = campo.taxa_comissao !== null && campo.taxa_comissao !== undefined 
        ? campo.taxa_comissao 
        : (perfilBase?.taxa_comissao || 12);
      
      const doc = new jsPDF({ format: 'a4', unit: 'mm' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const timestamp = dados.dataSubmissao || new Date().toISOString();
      const dataHelloCamp = campo.created_at || timestamp;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(!isEn ? "CONTRATO GLOBAL DE INTERMEDIAÇÃO E SERVIÇOS" : "GLOBAL INTERMEDIATION AND SERVICES AGREEMENT", pageWidth / 2, 20, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const dataFormatada = new Date(timestamp).toLocaleDateString(!isEn ? 'pt-PT' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(!isEn ? `Data de Emissão: ${dataFormatada}` : `Issue Date: ${dataFormatada}`, pageWidth / 2, 28, { align: "center" });
      doc.line(20, 35, pageWidth - 20, 35);

      // 1. DADOS DAS PARTES
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(!isEn ? "1. IDENTIFICAÇÃO DAS PARTES" : "1. IDENTIFICATION OF THE PARTIES", 20, 45);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      if (!isEn) {
        doc.text(`PRIMEIRA OUTORGANTE (Plataforma): HelloCamp Portugal`, 20, 55);
        doc.text(`SEGUNDA OUTORGANTE (Parceiro): ${dados.empresaNome || 'N/A'} (${dados.formaJuridica || 'N/A'})`, 20, 62);
        doc.text(`Sede: ${dados.morada || 'N/A'}, ${dados.codigoPostal || ''} | NIF: ${dados.nif || 'N/A'}`, 20, 69);
        doc.text(`Contacto: ${dados.pessoaContacto || 'N/A'} | E-mail: ${dados.emailContacto || 'N/A'} | Tel: ${dados.telefone || 'N/A'}`, 20, 76);
        doc.text(`Encarregado Proteção de Dados (RGPD): ${dados.responsavelRGPD || dados.pessoaContacto || 'N/A'}`, 20, 83);
      } else {
        doc.text(`FIRST PARTY (Platform): HelloCamp Portugal`, 20, 55);
        doc.text(`SECOND PARTY (Partner): ${dados.empresaNome || 'N/A'} (${dados.formaJuridica || 'N/A'})`, 20, 62);
        doc.text(`Headquarters: ${dados.morada || 'N/A'}, ${dados.codigoPostal || ''} | Tax ID: ${dados.nif || 'N/A'}`, 20, 69);
        doc.text(`Contact: ${dados.pessoaContacto || 'N/A'} | E-mail: ${dados.emailContacto || 'N/A'} | Tel: ${dados.telefone || 'N/A'}`, 20, 76);
        doc.text(`Data Protection Officer (GDPR): ${dados.responsavelRGPD || dados.pessoaContacto || 'N/A'}`, 20, 83);
      }

      // 2. TERMOS FINANCEIROS
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(!isEn ? "2. CONDIÇÕES FINANCEIRAS E OPERACIONAIS" : "2. FINANCIAL AND OPERATIONAL CONDITIONS", 20, 100);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const baseComissao = dados.baseComissao || campo.base_comissao || 'total';
      const modalidadeReserva = dados.modalidadeReserva || campo.modalidade_reserva || 'direta';
      const linkExternoReserva = dados.linkExternoReserva || campo.link_externo_reserva || '';
      const tipoPagamento = dados.tipoPagamento || campo.tipo_pagamento || '100_total';
      const politicaCancelamento = dados.politicaCancelamento || campo.politica_cancelamento || 'Moderada (Reembolso a 50% até 15 dias antes)';

      let basePT = baseComissao === "apenas_programa" ? "Apenas sobre Valor Base do Programa" : (baseComissao === "sem_comissao" ? "Isento (0%)" : "Sobre Valor Total (Programa + Extras)");
      let baseEN = baseComissao === "apenas_programa" ? "Only on Program Base Value" : (baseComissao === "sem_comissao" ? "Exempt (0%)" : "On Total Value (Program + Extras)");

      let modPT = modalidadeReserva === "direta" ? "Reserva Direta no Checkout" : (modalidadeReserva === "email" ? "Sob Consulta (Email)" : "Link Externo");
      let modEN = modalidadeReserva === "direta" ? "Direct Checkout Booking" : (modalidadeReserva === "email" ? "On Request (Email)" : "External Link");

      if (!isEn) {
        doc.text(`• Taxa de Comissão Fixada: ${taxaComissao}% (IVA incluído à taxa legal)`, 25, 110);
        doc.text(`• Base de Incidência da Comissão: ${basePT}`, 25, 117);
        doc.text(`• Modalidade de Integração: ${modPT}`, 25, 124);
        if (modalidadeReserva === 'link_externo') {
          doc.text(`• URL Oficial para Redirecionamento: ${linkExternoReserva}`, 25, 131);
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
        } else {
          doc.text(`• Payment Flow (Stripe): ${tipoPagamento === '50_sinal' ? '50% Deposit on booking / Remainder later' : '100% collected on booking'}`, 25, 131);
          doc.text(`• Authorized Cancellation Policy: ${politicaCancelamento}`, 25, 138);
        }
      }

      // 3. CLÁUSULAS LEGAIS
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(!isEn ? "3. CLÁUSULAS CONTRATUAIS GERAIS (SÍNTESE LEGAL)" : "3. GENERAL CONTRACTUAL CLAUSES (LEGAL SUMMARY)", 20, 155);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const clausulasTexto = !isEn
        ? "3.1. Responsabilidade Civil: A HelloCamp atua de forma estrita como plataforma informática de intermediação e motor de busca. A organização, gestão técnica, supervisão e segurança das atividades são da inteira e exclusiva responsabilidade da Segunda Outorgante (o Parceiro), que se obriga a manter válidos todos os seguros exigidos por lei (Responsabilidade Civil e Acidentes Pessoais) e as respetivas licenças de funcionamento.\n\n3.2. Proteção de Dados (RGPD): O Parceiro compromete-se a tratar os dados pessoais, médicos e restrições alimentares fornecidos pela HelloCamp no estrito cumprimento do Regulamento (UE) 2016/679 (RGPD), utilizando-os apenas para a execução do serviço contratado.\n\n3.3. Lei Aplicável e Jurisdição: Independentemente do país de origem ou da sede da Segunda Outorgante, o presente contrato rege-se pela Lei Portuguesa. Fica expressamente convencionado que o foro competente para dirimir qualquer litígio será o da Comarca de Lisboa, com renúncia expressa a qualquer outro."
        : "3.1. Civil Liability: HelloCamp acts strictly as an IT intermediation platform and search engine. The organization, technical management, supervision, and safety of the activities are the entire and exclusive responsibility of the Second Party (the Partner), who is obliged to keep valid all insurance required by law (Civil Liability and Personal Accidents).\n\n3.2. Data Protection (GDPR): The Partner commits to processing the personal, medical, and dietary restriction data provided by HelloCamp in strict compliance with Regulation (EU) 2016/679 (GDPR), using them only for the execution of the contracted service.\n\n3.3. Governing Law and Jurisdiction: Regardless of the country of origin or headquarters of the Second Party, this agreement is governed by Portuguese Law. The competent forum to resolve any dispute will be the District of Lisbon, with express waiver of any other.";

      doc.text(doc.splitTextToSize(clausulasTexto, pageWidth - 40), 20, 165);

      // 4. ASSINATURA (HELLO CAMP + PARCEIRO)
      let yPos = 230;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.line(20, yPos, pageWidth - 20, yPos);
      
      // HelloCamp
      doc.text(!isEn ? `Pela HelloCamp (Proponente):` : `By HelloCamp (Proposer):`, 20, yPos + 7);
      doc.text(`Administração HelloCamp Portugal`, 20, yPos + 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Data Envio: ${new Date(dataHelloCamp).toLocaleDateString(!isEn ? 'pt-PT' : 'en-GB')}`, 20, yPos + 21);
      
      // Parceiro
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(!isEn ? `Pelo Parceiro (Aceitante):` : `By Partner (Acceptor):`, pageWidth / 2, yPos + 7);
      doc.text(`${dados.assinaturaNome || 'N/A'} (${dados.assinaturaCargo || 'Legal Rep.'})`, pageWidth / 2, yPos + 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Data Assinatura: ${new Date(timestamp).toLocaleString(!isEn ? 'pt-PT' : 'en-GB')}`, pageWidth / 2, yPos + 21);
      doc.text(`IP Signatário: ${dados.ipAssinatura || 'Registado'} (Secured via HelloCamp Server)`, pageWidth / 2, yPos + 27);

      doc.save(`Contrato_HelloCamp_${(dados.empresaNome || campo.nome).replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert(isEn ? "Error downloading PDF." : "Erro ao descarregar o PDF.");
    }
    setDownloadingPdf(false);
  };

  // Dados ativos do campo selecionado para mostrar no Modal Formal
  const modalDados = contratoModalCampo?.contrato_dados || perfilBase?.contrato_dados || {};
  const modalTaxa = contratoModalCampo && contratoModalCampo.taxa_comissao !== null && contratoModalCampo.taxa_comissao !== undefined
    ? contratoModalCampo.taxa_comissao
    : (perfilBase?.taxa_comissao || 12);
  const modalBase = modalDados.baseComissao || contratoModalCampo?.base_comissao || 'total';
  const modalModalidade = modalDados.modalidadeReserva || contratoModalCampo?.modalidade_reserva || 'direta';
  const modalLinkExterno = modalDados.linkExternoReserva || contratoModalCampo?.link_externo_reserva || '';
  const modalPagamento = modalDados.tipoPagamento || contratoModalCampo?.tipo_pagamento || '100_total';
  const modalCancelamento = modalDados.politicaCancelamento || contratoModalCampo?.politica_cancelamento || 'Moderada (Reembolso a 50% até 15 dias antes)';
  
  const timestampContrato = modalDados.dataSubmissao || new Date().toISOString();
  const dataHelloCamp = contratoModalCampo?.created_at || timestampContrato;

  return (
    <div className="max-w-[1200px] mx-auto pb-10 font-sans">

      {/* ========================================================================= */}
      {/* MODAL DO CONTRATO ASSINADO (RÉPLICA FORMAL DO DOCUMENTO LEGAL)            */}
      {/* ========================================================================= */}
      {contratoModalCampo && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setContratoModalCampo(null)}
        >
          <div 
            className="bg-[#f0f0f0] w-full max-w-4xl rounded-xl shadow-2xl border border-slate-300 overflow-hidden relative my-8 max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* BARRA DE FERRAMENTAS DO PDF */}
            <div className="bg-slate-800 p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">📄</span>
                <h2 className="text-sm font-bold m-0 font-sans tracking-wide">
                  Contrato_HelloCamp_${(modalDados.empresaNome || contratoModalCampo.nome).replace(/\s+/g, '_')}.pdf
                </h2>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-center">
                <button
                  onClick={() => handleDownloadPDF(contratoModalCampo)}
                  disabled={downloadingPdf}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded shadow-sm transition-all cursor-pointer border-none flex items-center gap-2"
                >
                  📥 {downloadingPdf ? (isEn ? 'Opening...' : 'A abrir...') : (isEn ? 'Download PDF' : 'Descarregar PDF')}
                </button>
                <button
                  onClick={() => setContratoModalCampo(null)}
                  className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-white font-black text-lg flex items-center justify-center cursor-pointer border-none transition-colors"
                  title={isEn ? "Close" : "Fechar"}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* "FOLHA A4" - CORPO DO CONTRATO (FORMAL, SERIF) */}
            <div className="p-6 sm:p-10 overflow-y-auto flex justify-center bg-[#e5e7eb]">
              <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-10 sm:p-16 shadow-lg text-slate-900 font-serif leading-relaxed text-sm sm:text-[15px]">
                
                <div className="text-center mb-10">
                  <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider mb-2 border-b-2 border-slate-900 inline-block pb-2">
                    {isEn ? 'Global Intermediation Agreement' : 'Contrato Global de Intermediação e Serviços'}
                  </h1>
                  <p className="text-xs text-slate-500 font-sans m-0">
                    {isEn ? `Issue Date: ${new Date(timestampContrato).toLocaleDateString('en-GB')}` : `Data de Emissão: ${new Date(timestampContrato).toLocaleDateString('pt-PT')}`}
                  </p>
                </div>

                {/* 1. IDENTIFICAÇÃO DAS PARTES */}
                <h2 className="text-base font-bold uppercase mb-4 mt-8">{isEn ? '1. Identification of the Parties' : '1. Identificação das Partes'}</h2>
                <div className="mb-6 space-y-4">
                  <div>
                    <strong>{isEn ? 'FIRST PARTY (Platform):' : 'PRIMEIRA OUTORGANTE (Plataforma):'}</strong><br/>
                    HelloCamp Portugal
                  </div>
                  <div>
                    <strong>{isEn ? 'SECOND PARTY (Partner):' : 'SEGUNDA OUTORGANTE (Parceiro):'}</strong><br/>
                    {modalDados.empresaNome || '—'} ({modalDados.formaJuridica || '—'})<br/>
                    {isEn ? 'Headquarters:' : 'Sede:'} {modalDados.morada || '—'}, {modalDados.codigoPostal || ''} | NIF: {modalDados.nif || '—'}<br/>
                    {isEn ? 'Contact:' : 'Contacto:'} {modalDados.pessoaContacto || '—'} | E-mail: {modalDados.emailContacto || '—'} | Tel: {modalDados.telefone || '—'}<br/>
                    {isEn ? 'DPO (GDPR):' : 'Encarregado Proteção de Dados (RGPD):'} {modalDados.responsavelRGPD || modalDados.pessoaContacto || '—'}
                  </div>
                </div>

                {/* 2. CONDIÇÕES FINANCEIRAS */}
                <h2 className="text-base font-bold uppercase mb-4 mt-10">{isEn ? '2. Financial and Operational Conditions' : '2. Condições Financeiras e Operacionais'}</h2>
                <ul className="list-none p-0 space-y-2 mb-6">
                  <li><strong>• {isEn ? 'Fixed Commission Rate:' : 'Taxa de Comissão Fixada:'}</strong> {modalTaxa}% {isEn ? '(VAT included)' : '(IVA incluído)'}</li>
                  <li><strong>• {isEn ? 'Commission Base:' : 'Base de Incidência:'}</strong> {
                    modalBase === 'apenas_programa' ? (isEn ? 'Only on Program Base Value' : 'Apenas sobre Valor Base do Programa') : 
                    modalBase === 'sem_comissao' ? (isEn ? 'Exempt (0%)' : 'Isento (0%)') : 
                    (isEn ? 'On Total Value (Program + Extras)' : 'Sobre Valor Total (Programa + Extras)')
                  }</li>
                  <li><strong>• {isEn ? 'Integration Model:' : 'Modalidade de Integração:'}</strong> {
                    modalModalidade === 'direta' ? (isEn ? 'Direct Checkout Booking' : 'Reserva Direta no Checkout') : 
                    modalModalidade === 'email' ? (isEn ? 'Lead Forwarding' : 'Sob Consulta (Email)') : 
                    (isEn ? 'External Link' : 'Redirecionamento para Link Externo')
                  }</li>
                  
                  {modalModalidade === 'link_externo' ? (
                    <li><strong>• {isEn ? 'Redirect URL:' : 'URL Oficial de Redirecionamento:'}</strong> {modalLinkExterno || '—'}</li>
                  ) : (
                    <>
                      <li><strong>• {isEn ? 'Payment Flow (Stripe):' : 'Fluxo de Pagamento (Stripe):'}</strong> {
                        modalPagamento === '50_sinal' ? (isEn ? '50% Deposit Now + 50% Later' : 'Sinal de 50% no ato + Restante depois') : 
                        (isEn ? '100% Charged Upon Booking' : '100% Cobrado no ato da reserva')
                      }</li>
                      <li><strong>• {isEn ? 'Cancellation Policy:' : 'Política de Cancelamento Autorizada:'}</strong> {modalCancelamento}</li>
                    </>
                  )}
                  
                  {modalDados.acordosComplementares && (
                    <li className="mt-4 p-4 bg-slate-50 border border-slate-200">
                      <strong>• {isEn ? 'Complementary Agreements:' : 'Acordos Complementares / Exceções:'}</strong><br/>
                      <span className="italic">"{modalDados.acordosComplementares}"</span>
                    </li>
                  )}
                </ul>

                {/* 3. CLÁUSULAS LEGAIS */}
                <h2 className="text-base font-bold uppercase mb-4 mt-10">{isEn ? '3. General Contractual Clauses' : '3. Cláusulas Contratuais Gerais (Síntese Legal)'}</h2>
                <div className="space-y-4 mb-12 text-justify">
                  <p>
                    <strong>3.1. {isEn ? 'Civil Liability:' : 'Responsabilidade Civil:'}</strong> {isEn 
                      ? 'HelloCamp acts strictly as an IT intermediation platform and search engine. The organization, technical management, supervision, and safety of the activities are the entire and exclusive responsibility of the Second Party (the Partner), who is obliged to keep valid all insurance required by law (Civil Liability and Personal Accidents) and the respective operating licenses.' 
                      : 'A HelloCamp atua de forma estrita como plataforma informática de intermediação e motor de busca. A organização, gestão técnica, supervisão e segurança das atividades são da inteira e exclusiva responsabilidade da Segunda Outorgante (o Parceiro), que se obriga a manter válidos todos os seguros exigidos por lei (Responsabilidade Civil e Acidentes Pessoais) e as respetivas licenças de funcionamento.'}
                  </p>
                  <p>
                    <strong>3.2. {isEn ? 'Data Protection (GDPR):' : 'Proteção de Dados (RGPD):'}</strong> {isEn 
                      ? 'The Partner commits to processing the personal, medical, and dietary restriction data provided by HelloCamp in strict compliance with Regulation (EU) 2016/679 (GDPR), using them only for the execution of the service contracted by the guardian and deleting them as soon as they are no longer strictly necessary.' 
                      : 'O Parceiro compromete-se a tratar os dados pessoais, médicos e restrições alimentares fornecidos pela HelloCamp no estrito cumprimento do Regulamento (UE) 2016/679 (RGPD), utilizando-os apenas para a execução do serviço contratado pelo encarregado de educação e eliminando-os assim que deixem de ser estritamente necessários.'}
                  </p>
                  <p>
                    <strong>3.3. {isEn ? 'Governing Law and Jurisdiction:' : 'Lei Aplicável e Jurisdição:'}</strong> {isEn 
                      ? 'Regardless of the country of origin or headquarters of the Second Party, this agreement is governed, for all legal purposes, by Portuguese Law. It is expressly agreed that the competent forum to resolve any dispute will be the District of Lisbon, with express waiver of any other.' 
                      : 'Independentemente do país de origem ou da sede da Segunda Outorgante, o presente contrato rege-se, para todos os efeitos legais, pela Lei Portuguesa. Fica expressamente convencionado que o foro competente para dirimir qualquer litígio será o da Comarca de Lisboa, com renúncia expressa a qualquer outro.'}
                  </p>
                </div>

                {/* 4. ASSINATURAS LADO A LADO */}
                <div className="mt-16 pt-8 border-t-2 border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Assinatura HelloCamp */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-6">
                      {isEn ? 'By HelloCamp (Proposer):' : 'Pela HelloCamp (Proponente):'}
                    </h3>
                    <div className="font-serif text-xl italic text-slate-800 border-b border-slate-400 pb-2 mb-2 inline-block min-w-full">
                      Administração HelloCamp Portugal
                    </div>
                    <div className="text-xs text-slate-600 font-sans mt-2">
                      <p className="m-0"><strong>{isEn ? 'Date:' : 'Data Envio:'}</strong> {new Date(dataHelloCamp).toLocaleDateString(isEn ? 'en-GB' : 'pt-PT')}</p>
                    </div>
                  </div>

                  {/* Assinatura Parceiro */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-6">
                      {isEn ? 'By Partner (Acceptor):' : 'Pelo Parceiro (Aceitante):'}
                    </h3>
                    <div className="font-serif text-xl italic text-slate-800 border-b border-slate-400 pb-2 mb-2 inline-block min-w-full">
                      {modalDados.assinaturaNome || modalDados.pessoaContacto || '—'}
                    </div>
                    <div className="text-xs text-slate-600 font-sans mt-2 space-y-1">
                      <p className="m-0"><strong>{isEn ? 'Role:' : 'Cargo:'}</strong> {modalDados.assinaturaCargo || 'Representante Legal'}</p>
                      <p className="m-0"><strong>{isEn ? 'Date/Time:' : 'Data Assinatura:'}</strong> {new Date(timestampContrato).toLocaleString(isEn ? 'en-GB' : 'pt-PT')}</p>
                      <p className="m-0"><strong>IP Signatário:</strong> {modalDados.ipAssinatura || 'Registado'} <span className="text-[9px] text-slate-400">(Secured)</span></p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LISTAGEM PRINCIPAL DE CAMPOS                                              */}
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

                  {/* BOTÃO QUE ABRE O MODAL DE LEITURA DO CONTRATO FORMAL */}
                  {temContrato && (
                    <button 
                      onClick={() => setContratoModalCampo(campo)} 
                      className="flex items-center justify-center gap-1.5 px-5 py-3 bg-[#e2a41d] text-white hover:bg-[#d4991b] rounded-xl font-bold text-xs uppercase tracking-widest border-none transition-colors cursor-pointer shadow-sm"
                    >
                      📄 {isEn ? 'View Contract' : 'Ver Contrato'}
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
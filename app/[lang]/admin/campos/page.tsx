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

  // Estado para controlar o Modal de Visualização do Contrato (Read-Only)
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

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(!isEn ? "CONTRATO GLOBAL DE INTERMEDIAÇÃO E SERVIÇOS" : "GLOBAL INTERMEDIATION AND SERVICES AGREEMENT", pageWidth / 2, 20, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const dataFormatada = new Date(timestamp).toLocaleDateString(!isEn ? 'pt-PT' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(!isEn ? `Data de Assinatura: ${dataFormatada}` : `Signature Date: ${dataFormatada}`, pageWidth / 2, 28, { align: "center" });
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
      const politicaCancelamento = dados.politicaCancelamento || campo.politica_cancelamento || 'Moderada';

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
        ? "3.1. Responsabilidade Civil: A HelloCamp atua de forma estrita como plataforma informática de intermediação e motor de busca. A organização, gestão técnica, supervisão e segurança das atividades são da inteira e exclusiva responsabilidade da Segunda Outorgante (o Parceiro), que se obriga a manter válidos todos os seguros exigidos por lei (Responsabilidade Civil e Acidentes Pessoais) e as respetivas licenças de funcionamento.\n\n3.2. Proteção de Dados (RGPD): O Parceiro compromete-se a tratar os dados pessoais, médicos e restrições alimentares fornecidos pela HelloCamp no estrito cumprimento do Regulamento (UE) 2016/679 (RGPD), utilizando-os apenas para a execução do serviço contratado.\n\n3.3. Lei Aplicável e Jurisdição: O presente contrato rege-se pela Lei Portuguesa. O foro competente para dirimir qualquer litígio será o da Comarca de Lisboa, com renúncia expressa a qualquer outro."
        : "3.1. Civil Liability: HelloCamp acts strictly as an IT intermediation platform and search engine. The organization, technical management, supervision, and safety of the activities are the entire and exclusive responsibility of the Second Party (the Partner), who is obliged to keep valid all insurance required by law.\n\n3.2. Data Protection (GDPR): The Partner commits to processing the personal, medical, and dietary restriction data provided by HelloCamp in strict compliance with Regulation (EU) 2016/679 (GDPR).\n\n3.3. Governing Law and Jurisdiction: This agreement is governed by Portuguese Law. The competent forum to resolve any dispute will be the District of Lisbon.";

      doc.text(doc.splitTextToSize(clausulasTexto, pageWidth - 40), 20, 165);

      // 4. ASSINATURA
      let yPos = 240;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.line(20, yPos, 100, yPos);
      doc.text(!isEn ? `Assinado Digitalmente por:` : `Digitally Signed by:`, 20, yPos + 7);
      doc.text(`${dados.assinaturaNome || 'N/A'} (${dados.assinaturaCargo || 'Representante Legal'})`, 20, yPos + 14);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Data/Hora: ${new Date(timestamp).toLocaleString(!isEn ? 'pt-PT' : 'en-GB')}`, 20, yPos + 21);
      doc.text(`IP: ${dados.ipAssinatura || 'Registado'} (Secured via HelloCamp Server)`, 20, yPos + 27);

      doc.save(`Contrato_HelloCamp_${(dados.empresaNome || campo.nome).replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert(isEn ? "Error downloading PDF." : "Erro ao descarregar o PDF.");
    }
    setDownloadingPdf(false);
  };

  // Dados ativos do campo selecionado para mostrar no Modal
  const modalDados = contratoModalCampo?.contrato_dados || perfilBase?.contrato_dados || {};
  const modalTaxa = contratoModalCampo && contratoModalCampo.taxa_comissao !== null && contratoModalCampo.taxa_comissao !== undefined
    ? contratoModalCampo.taxa_comissao
    : (perfilBase?.taxa_comissao || 12);
  const modalBase = modalDados.baseComissao || contratoModalCampo?.base_comissao || 'total';
  const modalModalidade = modalDados.modalidadeReserva || contratoModalCampo?.modalidade_reserva || 'direta';
  const modalLinkExterno = modalDados.linkExternoReserva || contratoModalCampo?.link_externo_reserva || '';
  const modalPagamento = modalDados.tipoPagamento || contratoModalCampo?.tipo_pagamento || '100_total';
  const modalCancelamento = modalDados.politicaCancelamento || contratoModalCampo?.politica_cancelamento || 'Moderada';

  return (
    <div className="max-w-[1200px] mx-auto pb-10 font-sans">

      {/* ========================================================================= */}
      {/* MODAL DE VISUALIZAÇÃO DO CONTRATO ASSINADO (100% READ-ONLY)               */}
      {/* ========================================================================= */}
      {contratoModalCampo && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setContratoModalCampo(null)}
        >
          <div 
            className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden relative my-8 max-h-[92vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* CABEÇALHO DO MODAL FIXO */}
            <div className="bg-[#0E3A68] p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 shrink-0">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-xl font-black tracking-tighter">
                    <span className="text-white">Hello</span><span className="text-[#e2a41d]">Camp</span>
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                    ✓ {isEn ? 'Signed & Active' : 'Assinado & Válido'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black m-0 tracking-tight">
                  {isEn ? 'Global Intermediation Agreement' : 'Acordo de Intermediação Global'}
                </h2>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <button
                  onClick={() => handleDownloadPDF(contratoModalCampo)}
                  disabled={downloadingPdf}
                  className="bg-[#e2a41d] hover:bg-[#d4991b] text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl shadow-lg transition-all cursor-pointer border-none flex items-center gap-2"
                >
                  📥 {downloadingPdf ? (isEn ? 'Opening...' : 'A abrir...') : (isEn ? 'Download PDF' : 'Descarregar PDF')}
                </button>
                <button
                  onClick={() => setContratoModalCampo(null)}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-lg flex items-center justify-center cursor-pointer border-none transition-colors"
                  title={isEn ? "Close" : "Fechar"}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* CORPO DO CONTRATO (SCROLLABLE & READ-ONLY) */}
            <div className="p-6 sm:p-10 overflow-y-auto space-y-8 text-slate-800">

              {/* AVISO DE DOCUMENTO BLOQUEADO PARA EDIÇÃO */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔒</span>
                  <p className="text-xs font-bold text-slate-600 m-0">
                    {isEn 
                      ? 'This document is digitally signed and locked for editing. It serves as your official legal record.' 
                      : 'Este documento encontra-se assinado digitalmente e bloqueado para edição, servindo como arquivo legal oficial.'}
                  </p>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  ID: {contratoModalCampo.id.slice(0, 8)}
                </span>
              </div>

              {/* 1. DADOS DE FATURAÇÃO E IDENTIFICAÇÃO */}
              <section>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0E3A68] border-b border-slate-200 pb-2 mb-4">
                  1. {isEn ? 'Billing and Identification Data' : 'Dados de Faturação e Identificação'}
                </h3>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="sm:col-span-2">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {isEn ? 'Organizing Entity / Legal Name' : 'Entidade Organizadora / Nome Fiscal'}
                    </span>
                    <p className="text-sm font-black text-slate-900 m-0">{modalDados.empresaNome || '—'}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {isEn ? 'Tax ID (NIF/VAT)' : 'NIF / Tax ID'}
                    </span>
                    <p className="text-sm font-black text-slate-900 m-0">{modalDados.nif || '—'}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {isEn ? 'Legal Form' : 'Forma Jurídica'}
                    </span>
                    <p className="text-sm font-bold text-slate-800 m-0">{modalDados.formaJuridica || '—'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {isEn ? 'Registered Address' : 'Morada Fiscal Completa'}
                    </span>
                    <p className="text-sm font-bold text-slate-800 m-0">
                      {modalDados.morada || '—'}{modalDados.codigoPostal ? `, ${modalDados.codigoPostal}` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {isEn ? 'Manager / Contact Person' : 'Nome do Responsável'}
                    </span>
                    <p className="text-sm font-bold text-slate-800 m-0">{modalDados.pessoaContacto || '—'}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {isEn ? 'Operational Email' : 'E-mail Operacional'}
                    </span>
                    <p className="text-sm font-bold text-slate-800 m-0">{modalDados.emailContacto || '—'}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {isEn ? 'Phone Number' : 'Telefone'}
                    </span>
                    <p className="text-sm font-bold text-slate-800 m-0">{modalDados.telefone || '—'}</p>
                  </div>
                  <div className="sm:col-span-3 border-t border-slate-200/80 pt-4">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {isEn ? 'Data Protection Officer (GDPR)' : 'Encarregado de Proteção de Dados (RGPD)'}
                    </span>
                    <p className="text-sm font-bold text-slate-800 m-0">{modalDados.responsavelRGPD || modalDados.pessoaContacto || '—'}</p>
                  </div>
                </div>
              </section>

              {/* 2. CONDIÇÕES OPERACIONAIS E FINANCEIRAS */}
              <section>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0E3A68] border-b border-slate-200 pb-2 mb-4">
                  2. {isEn ? 'Operational and Financial Terms' : 'Termos Operacionais e Financeiros Acordados'}
                </h3>
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-6">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                    <div>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {isEn ? 'Agreed Commission Rate' : 'Taxa de Comissão Acordada'}
                      </span>
                      <p className="text-xs font-medium text-slate-500 m-0 mt-0.5">
                        {isEn ? 'Applied only on successful bookings' : 'Aplicada exclusivamente sobre reservas confirmadas'}
                      </p>
                    </div>
                    <span className="text-2xl font-black text-[#0E3A68] bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-200">
                      {modalTaxa}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                        {isEn ? 'Integration Model' : 'Modelo de Integração'}
                      </span>
                      <p className="text-sm font-black text-slate-900 m-0">
                        {modalModalidade === 'direta' 
                          ? (isEn ? 'Direct Checkout Booking (HelloCamp)' : 'Reserva Direta no Checkout (HelloCamp)')
                          : modalModalidade === 'email'
                          ? (isEn ? 'Lead Forwarding via Email' : 'Encaminhamento de Leads via E-mail')
                          : (isEn ? 'Redirection to External Link' : 'Redirecionamento para Link Externo Oficial')}
                      </p>
                    </div>

                    {modalModalidade === 'link_externo' ? (
                      <div className="sm:col-span-2 bg-white p-4 rounded-xl border border-slate-200">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                          {isEn ? 'Official Redirect URL' : 'Link Oficial para Redirecionamento'}
                        </span>
                        <a href={modalLinkExterno} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 underline break-all">
                          {modalLinkExterno || '—'}
                        </a>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            {isEn ? 'Payment Flow' : 'Fluxo de Pagamento'}
                          </span>
                          <p className="text-sm font-black text-slate-900 m-0">
                            {modalPagamento === '50_sinal' 
                              ? (isEn ? '50% Deposit Now + 50% Later' : 'Sinal de 50% no ato + 50% antes do início')
                              : (isEn ? '100% Charged Upon Booking' : '100% Cobrado no ato da reserva')}
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            {isEn ? 'Cancellation Policy' : 'Política de Cancelamento'}
                          </span>
                          <p className="text-sm font-black text-slate-900 m-0">{modalCancelamento}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {modalDados.acordosComplementares && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-amber-800 mb-1">
                        {isEn ? 'Complementary Agreements / Exceptions' : 'Acordos Complementares / Exceções Fixados'}
                      </span>
                      <p className="text-xs font-medium text-amber-900 m-0 italic">"{modalDados.acordosComplementares}"</p>
                    </div>
                  )}
                </div>
              </section>

              {/* 3. SÍNTESE JURÍDICA */}
              <section>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0E3A68] border-b border-slate-200 pb-2 mb-4">
                  3. {isEn ? 'Legal Liability and Jurisdiction' : 'Responsabilidade Legal e Foro'}
                </h3>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-600 leading-relaxed text-justify">
                  <p className="m-0">
                    <strong>{isEn ? 'A. Civil Liability & Insurance:' : 'A. Responsabilidade Civil e Seguros:'}</strong>{' '}
                    {isEn 
                      ? 'HelloCamp acts strictly as an IT intermediation platform and search engine. The organization, technical management, supervision, and safety of the activities are the entire and exclusive responsibility of the Partner, who is obliged to keep valid all insurance required by law (Civil Liability and Personal Accidents) and operating licenses.' 
                      : 'A HelloCamp atua de forma estrita como plataforma informática de intermediação e motor de busca. A organização, gestão técnica, supervisão e segurança das atividades são da inteira e exclusiva responsabilidade do Parceiro, que se obriga a manter válidos todos os seguros exigidos por lei (Responsabilidade Civil e Acidentes Pessoais) e respetivas licenças.'}
                  </p>
                  <p className="m-0">
                    <strong>{isEn ? 'B. Data Protection (GDPR):' : 'B. Proteção de Dados (RGPD):'}</strong>{' '}
                    {isEn 
                      ? 'The Partner assumes the role of Data Controller for the personal, medical, and dietary restriction data provided by HelloCamp in strict compliance with Regulation (EU) 2016/679 (GDPR), using them only for the execution of the contracted service.' 
                      : 'O Parceiro assume o papel de Responsável pelo Tratamento dos dados pessoais, médicos e restrições alimentares fornecidos pela HelloCamp no estrito cumprimento do Regulamento (UE) 2016/679 (RGPD), utilizando-os apenas para a execução do serviço contratado.'}
                  </p>
                  <p className="m-0">
                    <strong>{isEn ? 'C. Governing Law and Jurisdiction:' : 'C. Lei Aplicável e Foro Competente:'}</strong>{' '}
                    {isEn 
                      ? 'This agreement is governed by Portuguese Law. Any dispute arising from the interpretation or execution of this agreement shall be submitted to the exclusive jurisdiction of the courts of the District of Lisbon (Portugal).' 
                      : 'O presente acordo rege-se pela Lei Portuguesa. Qualquer litígio emergente da interpretação ou execução deste acordo será submetido à competência exclusiva dos tribunais da Comarca de Lisboa (Portugal).'}
                  </p>
                </div>
              </section>

              {/* 4. CERTIFICADO DE ASSINATURA DIGITAL */}
              <section>
                <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <span className="inline-block bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-3">
                      ✍️ {isEn ? 'Digital Signature Certificate' : 'Certificado de Assinatura Digital'}
                    </span>
                    <p className="text-lg font-black text-emerald-950 font-serif italic m-0">
                      {modalDados.assinaturaNome || modalDados.pessoaContacto || 'Assinado Digitalmente'}
                    </p>
                    <p className="text-xs font-bold text-emerald-800 m-0 mt-1">
                      {isEn ? 'Role / Position:' : 'Cargo / Função Legal:'} {modalDados.assinaturaCargo || 'Representante Legal'}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-emerald-200 text-xs font-mono text-slate-600 space-y-1 w-full md:w-auto">
                    <div><strong>{isEn ? 'Date/Time:' : 'Data/Hora:'}</strong> {modalDados.dataSubmissao ? new Date(modalDados.dataSubmissao).toLocaleString(!isEn ? 'pt-PT' : 'en-GB') : 'Validado'}</div>
                    <div><strong>IP Signatário:</strong> {modalDados.ipAssinatura || 'Registado no Servidor'}</div>
                    <div><strong>Status Legal:</strong> Vinculativo (Termos Aceites)</div>
                  </div>
                </div>
              </section>

            </div>

            {/* RODAPÉ DO MODAL */}
            <div className="bg-slate-50 px-6 sm:px-10 py-5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <Link href={`/${lang}/termos`} target="_blank" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#0E3A68] no-underline">
                {isEn ? 'View General Terms & Conditions ↗' : 'Consultar Termos e Condições Gerais ↗'}
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
                  📥 {isEn ? 'Download Signed PDF' : 'Descarregar PDF Assinado'}
                </button>
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

                  {/* BOTÃO QUE ABRE O MODAL DE LEITURA DO CONTRATO */}
                  {temContrato && (
                    <button 
                      onClick={() => setContratoModalCampo(campo)} 
                      className="flex items-center justify-center gap-1.5 px-5 py-3 bg-[#e2a41d] text-white hover:bg-[#d4991b] rounded-xl font-bold text-xs uppercase tracking-widest border-none transition-colors cursor-pointer shadow-sm"
                    >
                      📄 {isEn ? 'View Contract' : 'Contrato PDF'}
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
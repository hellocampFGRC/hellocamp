"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import React from "react";

export default function AssinaturaContratoPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = use(params);
  const router = useRouter();
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campo, setCampo] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);
  const [jaAssinado, setJaAssinado] = useState(false);

  // Estados do Formulário de Assinatura
  const [assinaturaNome, setAssinaturaNome] = useState("");
  const [assinaturaCargo, setAssinaturaCargo] = useState("");
  const [acordosComplementares, setAcordosComplementares] = useState("");
  const [concordaTermos, setConcordaTermos] = useState(false);

  useEffect(() => {
    const fetchDados = async () => {
      const { data: campoData, error: campoError } = await supabase.from('campos').select('*').eq('id', id).single();
      if (campoError || !campoData) {
        alert("Campo não encontrado ou link inválido.");
        return;
      }

      if (campoData.contrato_parceiro_url && campoData.status_aprovacao === 'Aprovado') {
        setJaAssinado(true);
      }

      setCampo(campoData);

      if (campoData.organizador_id) {
        const { data: perfilData } = await supabase.from('perfis').select('*').eq('id', campoData.organizador_id).single();
        setPerfil(perfilData);
      }

      setLoading(false);
    };

    fetchDados();
  }, [id]);

  const gerarEGuardarPDF = async () => {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Configurar Fonte e Tamanho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CONTRATO DE INTERMEDIAÇÃO E SERVIÇOS", pageWidth / 2, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const dataAtual = new Date().toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Data de Emissão: ${dataAtual}`, pageWidth / 2, 28, { align: "center" });

    doc.line(20, 35, pageWidth - 20, 35);

    // DADOS DAS PARTES
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. IDENTIFICAÇÃO DAS PARTES", 20, 45);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`PRIMEIRA OUTORGANTE (Plataforma): HelloCamp Portugal`, 20, 55);
    doc.text(`SEGUNDA OUTORGANTE (Organizador): ${perfil?.empresa_nome || 'N/A'}`, 20, 62);
    doc.text(`NIF: ${perfil?.nif_empresa || 'N/A'} | Email: ${perfil?.email || 'N/A'}`, 20, 69);
    doc.text(`Programa/Campo Associado: ${campo?.nome}`, 20, 76);

    // CONDIÇÕES FINANCEIRAS
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("2. CONDIÇÕES FINANCEIRAS E OPERACIONAIS", 20, 95);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const taxaAplicada = campo?.taxa_comissao !== null ? campo?.taxa_comissao : (perfil?.taxa_comissao || 12);
    let baseTexto = "Sobre Valor Total (Programa + Extras)";
    if (campo?.base_comissao === "apenas_programa") baseTexto = "Apenas sobre Valor Base do Programa";
    if (campo?.base_comissao === "sem_comissao") baseTexto = "Isento de Comissão (0%)";

    let modalidadeTexto = "Reserva Direta (Checkout)";
    if (campo?.modalidade_reserva === "email") modalidadeTexto = "Sob Consulta (Email)";
    if (campo?.modalidade_reserva === "link_externo") modalidadeTexto = "Link Externo (Sem gestão de pagamento na plataforma)";

    doc.text(`• Taxa de Comissão: ${taxaAplicada}%`, 25, 105);
    doc.text(`• Base de Incidência: ${baseTexto}`, 25, 112);
    doc.text(`• Modalidade de Reserva: ${modalidadeTexto}`, 25, 119);
    doc.text(`• Política de Pagamento: ${campo?.tipo_pagamento === '50_sinal' ? 'Sinal 50% / Restante 50%' : '100% no Ato da Reserva'}`, 25, 126);
    doc.text(`• Política de Cancelamento: ${campo?.politica_cancelamento || 'Moderada'}`, 25, 133);

    // ACORDOS COMPLEMENTARES
    if (acordosComplementares) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("3. ACORDOS COMPLEMENTARES E EXCEÇÕES", 20, 150);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const splitAcordos = doc.splitTextToSize(acordosComplementares, pageWidth - 40);
      doc.text(splitAcordos, 20, 160);
    }

    // DECLARAÇÃO DE ACEITAÇÃO
    const startAceitacao = acordosComplementares ? 200 : 160;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("4. DECLARAÇÃO DE ACEITAÇÃO", 20, startAceitacao);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const textoDeclaracao = `O Organizador declara ter lido, compreendido e aceite integralmente os Termos e Condições Gerais da HelloCamp, bem como as condições específicas financeiras e operacionais descritas neste documento referente à comercialização do programa "${campo?.nome}".`;
    doc.text(textoDeclaracao, 20, startAceitacao + 10, { maxWidth: pageWidth - 40 });

    // ASSINATURAS
    doc.line(20, startAceitacao + 35, 100, startAceitacao + 35); // Linha Assinatura
    doc.text(`Assinado Digitalmente por:`, 20, startAceitacao + 42);
    doc.setFont("helvetica", "bold");
    doc.text(`${assinaturaNome} (${assinaturaCargo})`, 20, startAceitacao + 49);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Data/Hora: ${new Date().toLocaleString('pt-PT')}`, 20, startAceitacao + 56);
    doc.text(`IP de Assinatura: Registado via Plataforma Segura HelloCamp`, 20, startAceitacao + 62);

    return doc.output('blob');
  };

  const handleSubmeterContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assinaturaNome || !assinaturaCargo || !concordaTermos) {
      alert("Por favor, preencha os dados da assinatura e aceite os termos.");
      return;
    }

    setSaving(true);
    try {
      // 1. Gerar e Guardar PDF
      const pdfBlob = await gerarEGuardarPDF();
      const fileName = `contrato_parceiro_${campo.id}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage.from('campos-documentos').upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true });
      if (uploadError) throw new Error("Erro ao guardar o contrato: " + uploadError.message);
      
      const { data: publicUrlData } = supabase.storage.from('campos-documentos').getPublicUrl(fileName);
      const contratoUrl = publicUrlData.publicUrl;

      // 2. Atualizar o Campo para Aprovado e anexar link do Contrato
      const { error: dbError } = await supabase.from('campos').update({
        contrato_parceiro_url: contratoUrl,
        status_aprovacao: 'Aprovado',
        ativo: true
      }).eq('id', campo.id);

      if (dbError) throw new Error("Erro ao validar contrato na base de dados: " + dbError.message);

      setJaAssinado(true);
      setCampo({ ...campo, contrato_parceiro_url: contratoUrl });
      alert("✅ Contrato assinado com sucesso! O programa já está Aprovado e Ativo.");

    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-200 py-12 px-4 flex items-center justify-center font-bold text-slate-500">A carregar contrato seguro...</div>;

  const dataAtual = new Date().toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });
  const taxaAplicada = campo?.taxa_comissao !== null ? campo?.taxa_comissao : (perfil?.taxa_comissao || 12);

  return (
    <main className="min-h-screen bg-slate-200 py-8 md:py-12 px-4 sm:px-6 font-sans text-black selection:bg-yellow-200">
      <div className="max-w-[900px] mx-auto">
        
        <div className="mb-8 md:mb-10 text-center">
          <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-sm">
            {isEn ? 'Secure Digital Signature' : 'Assinatura Digital Segura'}
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-6">
            {isEn ? 'Validate Program Contract' : 'Validação de Contrato do Programa'}
          </h1>
          <p className="text-sm md:text-base text-slate-600 font-medium mt-3 max-w-2xl mx-auto px-2">
            {isEn 
              ? 'Please review the financial and operational terms configured by HelloCamp for your program. Sign below to activate it on the platform.' 
              : `Por favor, reveja as condições financeiras, operacionais e os termos legais aplicáveis ao programa "${campo?.nome}". Assine no final do documento para o ativar oficialmente na plataforma.`}
          </p>
        </div>

        {jaAssinado ? (
          <div className="bg-white shadow-2xl p-10 md:p-16 text-center rounded-xl font-serif">
             <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
             <h2 className="text-2xl font-black text-emerald-900 mb-2">Contrato Válido e Assinado</h2>
             <p className="text-emerald-700 text-lg mb-8">O programa <strong>{campo?.nome}</strong> já se encontra Aprovado e ativo na plataforma.</p>
             <a href={campo?.contrato_parceiro_url} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-xl shadow-md transition-colors font-sans">
               Fazer Download do PDF Assinado
             </a>
          </div>
        ) : (
          <form onSubmit={handleSubmeterContrato} className="bg-white shadow-2xl p-5 sm:p-10 md:p-16 text-black leading-relaxed rounded-xl font-serif">
            
            {/* CABEÇALHO DO DOCUMENTO */}
            <div className="text-center mb-10 md:mb-16">
              <div className="text-3xl md:text-4xl font-black tracking-tighter mb-6 font-sans">
                <span className="text-black">Hello</span><span className="text-[#EBA914]">Camp</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold uppercase mb-2 tracking-widest border-b-2 border-black inline-block pb-2">
                {isEn ? 'Intermediation and Services Contract' : 'Contrato de Intermediação e Serviços'}
              </h1>
              <p className="text-sm md:text-base italic text-gray-600 mt-4">
                {isEn ? 'This agreement is exclusively applicable to the program described below.' : 'Este acordo é aplicável exclusivamente ao programa abaixo descrito, substituindo quaisquer condições gerais em vigor se aplicável.'}
              </p>
            </div>

            {/* DADOS DAS PARTES E INTRODUÇÃO */}
            <div className="space-y-4 font-serif text-sm md:text-[15px]">
              <p className="text-justify">
                {isEn 
                  ? 'Between HelloCamp, with website at www.hellocamp.pt and contact via info@hellocamp.pt, hereinafter referred to as the "First Party"; and on the other side:' 
                  : 'Entre a HelloCamp, com website em www.hellocamp.pt e contacto via info@hellocamp.pt, doravante designada por "Primeira Outorgante"; e do outro lado:'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mt-6 bg-gray-50 p-5 md:p-6 border border-gray-200 rounded-lg font-sans">
                <div className="flex flex-col md:col-span-2"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Entidade Organizadora</label><span className="font-bold text-base">{perfil?.empresa_nome || 'N/A'}</span></div>
                <div className="flex flex-col"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">NIF da Empresa</label><span className="font-bold text-base">{perfil?.nif_empresa || 'N/A'}</span></div>
                <div className="flex flex-col"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">E-mail de Contacto</label><span className="font-bold text-base">{perfil?.email || 'N/A'}</span></div>
                <div className="flex flex-col md:col-span-2 border-t border-gray-200 pt-4 mt-2"><label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Programa Abrangido (Objeto do Contrato)</label><span className="font-black text-lg text-emerald-800 uppercase">{campo?.nome}</span></div>
              </div>
            </div>

            <div className="h-px bg-gray-300 w-full my-8 md:my-12"></div>

            {/* INTRODUÇÃO VISUAL (Ícones) */}
            <div className="space-y-8 md:space-y-12 mb-10 md:mb-16 font-sans">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">📝</div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2">
                    {isEn ? '1. Conclusion of the Contract' : '1. Celebração do contrato'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
                    {isEn 
                      ? 'This contract regulates the promotion and intermediation of your offers through the HelloCamp platform. The agreement remains valid until the end of the current calendar year and is automatically renewed for successive periods.' 
                      : 'Este contrato regula a divulgação e a intermediação das suas ofertas através da plataforma HelloCamp, estabelecendo os termos da colaboração entre ambas as partes.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">🏖️</div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2">
                    {isEn ? '2. Promotion of Offers' : '2. Divulgação das ofertas'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
                    {isEn 
                      ? 'HelloCamp collects and organizes the information regarding the activities provided by the partner, creating and publishing the respective offer pages on the platform. It promotes the programs through its digital channels.' 
                      : 'A HelloCamp procede à recolha e organização das informações relativas às atividades disponibilizadas pelo parceiro, criando e publicando as respetivas páginas de oferta na plataforma. A publicação ocorrerá após validação.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">💻</div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2">
                    {isEn ? '3. Bookings through HelloCamp' : '3. Reservas através da HelloCamp'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
                    {isEn 
                      ? 'Activity bookings can be made directly through the platform. HelloCamp will communicate the client details to the partner. The partner commits to keeping availability and prices updated.' 
                      : 'Sempre que uma reserva seja realizada, a HelloCamp comunicará ao parceiro os dados do cliente, os detalhes da reserva e todas as informações necessárias à adequada gestão da inscrição.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-900 text-white border border-slate-700 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm">€</div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 mb-2">
                    {isEn ? '4. Commission Payment' : '4. Pagamento da Comissão'}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 text-justify leading-relaxed">
                    {isEn 
                      ? 'HelloCamp charges a commission on each completed booking through the platform. Specific conditions will be defined according to the terms established below.' 
                      : 'A HelloCamp cobra uma comissão sobre cada reserva concluída através da plataforma. As condições específicas aplicáveis ao seu programa encontram-se detalhadas nos Anexos Operacionais abaixo.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-300 w-full my-8 md:my-12"></div>

            {/* ARTIGOS E CLÁUSULAS CONTRATUAIS */}
            <div className="space-y-6 text-sm md:text-[15px] text-justify pt-4 md:pt-6">
              <h3 className="font-bold text-lg md:text-xl uppercase tracking-widest border-b border-black pb-2 mb-6 md:mb-8 font-sans">
                {isEn ? 'Contractual Clauses' : 'Cláusulas Contratuais Gerais'}
              </h3>
              
              <h4 className="font-bold">{isEn ? 'Article 1 – Commission' : 'Artigo 1.º – Comissão'}</h4>
              <p className="mb-4">
                {isEn 
                  ? 'The Partner commits to paying HelloCamp a commission (VAT included) on each booking made through the platform, under the terms defined in the Annexes below.' 
                  : 'O Parceiro compromete-se a pagar à HelloCamp uma comissão (IVA incluído) sobre cada reserva efetuada através da plataforma, nos termos definidos no Anexo 2 deste documento.'}
              </p>
              <p className="mb-4">
                {isEn 
                  ? 'The commission is calculated on the amount actually paid by the client for the booked activity, including additional services contracted through the platform.' 
                  : 'A comissão é calculada sobre o valor efetivamente pago pelo cliente relativamente à atividade reservada, incluindo serviços adicionais contratados através da plataforma.'}
              </p>
              <p className="mb-4">
                {isEn 
                  ? 'The commission becomes due after the booking is confirmed by the Partner and the respective booking data is transmitted.' 
                  : 'A comissão torna-se devida após a confirmação da reserva pelo Parceiro e a transmissão dos respetivos dados de reserva.'}
              </p>
              <p className="mb-4">
                {isEn 
                  ? 'The Partner must send the client the booking confirmation and ensure the provision of the contracted services.' 
                  : 'O Parceiro deverá enviar ao cliente a confirmação da reserva e assegurar a prestação dos serviços contratados.'}
              </p>
              <p className="mb-4">
                {isEn 
                  ? 'If a booking cannot be fulfilled for justified reasons, the Partner must inform HelloCamp as soon as possible.' 
                  : 'Caso uma reserva não possa ser realizada por motivos devidamente justificados, nomeadamente indisponibilidade da atividade ou não verificação das condições mínimas de realização, o Parceiro deverá informar a HelloCamp com a maior brevidade possível.'}
              </p>
              <p className="mb-8">
                {isEn 
                  ? 'In case of cancellation by the client, the conditions set out in Annex 3 – Booking Cancellation will apply.' 
                  : 'Em caso de cancelamento por iniciativa do cliente, aplicar-se-ão as condições previstas no Anexo 3 – Cancelamento de Reservas.'}
              </p>

              <h4 className="font-bold">{isEn ? 'Article 2 – Payment Conditions' : 'Artigo 2.º – Condições de Pagamento'}</h4>
              <p className="mb-8">
                {isEn 
                  ? 'Commissions due to HelloCamp will be invoiced according to the agreed payment model. The Partner commits to settling invoices within the stated deadlines. Agreed amounts include VAT or other applicable taxes.' 
                  : 'As comissões devidas à HelloCamp serão faturadas de acordo com o modelo de pagamento acordado entre as partes. O Parceiro compromete-se a liquidar as faturas emitidas pela HelloCamp dentro dos prazos nelas indicados. Os valores acordados incluem IVA ou outros impostos legalmente aplicáveis.'}
              </p>

              <h4 className="font-bold">{isEn ? 'Article 3 – Partner Obligations' : 'Artigo 3.º – Obrigações do Parceiro'}</h4>
              <p className="mb-4">{isEn ? 'The Partner commits to providing HelloCamp with all necessary information to promote activities, including descriptions, prices, availability, photos, and relevant content.' : 'O Parceiro compromete-se a fornecer à HelloCamp todas as informações necessárias à divulgação das suas atividades, incluindo descrições, preços, disponibilidade, fotografias e demais conteúdos relevantes.'}</p>
              <p className="mb-4">{isEn ? 'The Partner guarantees they hold all necessary rights for the provided content, including copyrights and image rights.' : 'O Parceiro garante que possui todos os direitos necessários sobre os conteúdos disponibilizados à HelloCamp, incluindo direitos de autor, direitos de imagem e demais autorizações legalmente exigidas.'}</p>
              <p className="mb-4">{isEn ? 'HelloCamp may use the content provided by the Partner for promotion and marketing on the platform and communication channels.' : 'A HelloCamp poderá utilizar os conteúdos fornecidos pelo Parceiro para efeitos de promoção, comercialização e divulgação das atividades na plataforma e nos seus canais de comunicação.'}</p>
              <p className="mb-4">{isEn ? 'Prices advertised on HelloCamp must not exceed prices practiced by the Partner for direct bookings.' : 'Os preços divulgados na plataforma HelloCamp não poderão ser superiores aos preços praticados pelo Parceiro para reservas diretas da mesma atividade.'}</p>
              <p className="mb-4">{isEn ? 'The Partner commits to immediately informing HelloCamp of any changes regarding activities, prices, or conditions.' : 'O Parceiro compromete-se a informar imediatamente a HelloCamp de quaisquer alterações relativas às suas atividades, incluindo preços, disponibilidade, programas, condições de participação ou outros elementos relevantes.'}</p>
              <p className="mb-8">{isEn ? 'The Partner must notify HelloCamp of any changes to their general terms and conditions.' : 'O Parceiro deverá comunicar à HelloCamp quaisquer alterações aos seus termos e condições gerais ou às condições aplicáveis às atividades disponibilizadas na plataforma.'}</p>

              <h4 className="font-bold">{isEn ? 'Article 4 – Duration and Renewal' : 'Artigo 4.º – Duração e Renovação'}</h4>
              <p className="mb-8">{isEn ? 'This contract is effective from the date of signature by both parties until the end of the calendar year. It automatically renews for successive one-year periods unless terminated in writing at least 30 days prior.' : 'O presente contrato produz efeitos a partir da data da sua assinatura por ambas as partes. O contrato mantém-se válido até ao final do respetivo ano civil. O contrato será automaticamente renovado por períodos sucessivos de um ano, salvo denúncia por qualquer das partes. A intenção de não renovação deverá ser comunicada por escrito com uma antecedência mínima de 30 dias relativamente ao termo do período contratual em curso.'}</p>

              <h4 className="font-bold">{isEn ? 'Article 5 – Severability Clause' : 'Artigo 5.º – Cláusula de Separabilidade'}</h4>
              <p className="mb-8">{isEn ? 'The invalidity of any provision of this contract shall not affect the validity of the remaining clauses.' : 'A eventual invalidade, nulidade ou inaplicabilidade de qualquer disposição do presente contrato não prejudica a validade das restantes cláusulas, que permanecerão plenamente em vigor.'}</p>

              <h4 className="font-bold">{isEn ? 'Article 6 – Amendments' : 'Artigo 6.º – Alterações e Acordos Complementares'}</h4>
              <p className="mb-8">{isEn ? 'Any amendments to this contract must be made in writing in Annex 4 to be effective.' : 'Quaisquer alterações ao presente contrato ou acordos complementares celebrados entre a HelloCamp e o Parceiro deverão ser efetuados por escrito, no anexo 4, para produzirem efeitos.'}</p>

              <h4 className="font-bold">{isEn ? 'Article 7 – Limitation of Liability and Insurance' : 'Artigo 7.º – Limitação de Responsabilidade e Seguros'}</h4>
              <p className="mb-4">
                {isEn 
                  ? 'HelloCamp acts exclusively as an intermediary booking platform. HelloCamp assumes no civil, criminal, or contractual liability for any accidents, damages, incidents, or disputes that may occur during the activities, involving participants, monitors, or third parties.' 
                  : 'A HelloCamp atua exclusivamente como plataforma intermediária de reservas. A HelloCamp não assume qualquer responsabilidade civil, criminal ou contratual por eventuais acidentes, danos, incidentes ou disputas que ocorram durante a realização das atividades, envolvendo os participantes, monitores ou terceiros.'}
              </p>
              <p className="mb-8">
                {isEn 
                  ? 'The Partner is solely and exclusively responsible for the provision of services and the safety of the participants, guaranteeing that they hold all legally mandatory insurance (including civil liability and personal accident), licenses, and certifications required to carry out their activity.' 
                  : 'O Parceiro é o único e exclusivo responsável pela prestação dos serviços e pela segurança dos participantes, garantindo que possui todos os seguros obrigatórios por lei (incluindo responsabilidade civil e acidentes pessoais), licenças e certificações exigidas para o exercício da sua atividade.'}
              </p>
            </div>

            <div className="h-px bg-gray-300 w-full my-8 md:my-12"></div>

            <h3 className="font-bold text-lg md:text-xl uppercase tracking-widest border-b border-black pb-2 mb-6 md:mb-8 font-sans">
              Condições e Anexos Operacionais Específicos
            </h3>

            {/* ANEXOS RESUMIDOS COM TEXTOS DE APOIO */}
            <div className="space-y-6 font-sans text-sm text-slate-800">
              
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h4 className="font-black text-base mb-3 text-black uppercase border-l-4 border-gray-400 pl-3">Anexo 1 – Procedimento de Reserva e Operação</h4>
                <div className="space-y-2">
                  <p><strong>Modalidade Definida:</strong> {campo?.modalidade_reserva === 'direta' ? 'Reserva Direta no Checkout com Pagamento Automático' : (campo?.modalidade_reserva === 'email' ? 'Comunicação por E-mail (Reserva Sob Consulta)' : 'Link Externo (Geração de Lead e Redirecionamento)')}</p>
                  
                  {campo?.modalidade_reserva === 'direta' && (
                    <p className="text-gray-600 mt-2">As reservas efetuadas através da plataforma HelloCamp serão registadas diretamente no sistema. A HelloCamp terá direito à comissão acordada sobre cada reserva concluída.</p>
                  )}
                  {campo?.modalidade_reserva === 'email' && (
                    <p className="text-gray-600 mt-2">A HelloCamp enviará ao Parceiro, por correio eletrónico, todas as informações necessárias. O Parceiro dispõe de 2 dias úteis para rejeitar; caso contrário a reserva é considerada aceite.</p>
                  )}
                  {campo?.modalidade_reserva === 'link_externo' && (
                    <p className="text-gray-600 mt-2">O tráfego é redirecionado para um link externo. A HelloCamp recolhe a intenção de reserva (Nome e Email). O Parceiro compromete-se a ser verdadeiro na comunicação mensal sobre as inscrições finalizadas do seu lado.</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                <h4 className="font-black text-base mb-3 text-blue-950 uppercase border-l-4 border-blue-600 pl-3">Anexo 2 – Pagamento e Comissão</h4>
                <div className="space-y-2">
                  <p><strong>Taxa de Comissão Fixada:</strong> <span className="font-black text-blue-700 text-lg">{taxaAplicada}%</span> (IVA incluído)</p>
                  <p><strong>Incidência da Comissão:</strong> {campo?.base_comissao === "apenas_programa" ? "Apenas sobre o Valor Base do Programa" : (campo?.base_comissao === "sem_comissao" ? "Isento (0%)" : "Sobre o Valor Total Faturado (Programa + Extras)")}</p>
                  <p><strong>Modelo de Pagamento (Cliente):</strong> {campo?.tipo_pagamento === '50_sinal' ? '50% de Sinal no ato da reserva, e restantes 50% 7 dias antes do programa.' : '100% cobrado de imediato no ato da reserva.'}</p>
                  <p className="text-blue-800 mt-2 text-xs">O Parceiro autoriza a HelloCamp a receber um depósito durante o processo de reserva (via Stripe). O valor retido corresponde, regra geral, à comissão devida à HelloCamp.</p>
                </div>
              </div>

              <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
                <h4 className="font-black text-base mb-3 text-amber-950 uppercase border-l-4 border-amber-500 pl-3">Anexo 3 – Política de Cancelamento</h4>
                <div className="space-y-2">
                  <p><strong>Política Aplicada:</strong> <span className="font-black">{campo?.politica_cancelamento || 'Moderada'}</span></p>
                  <p className="text-amber-800 mt-2 text-xs">
                    {campo?.politica_cancelamento?.includes('Flexível') 
                      ? 'A HelloCamp não cobrará comissão sobre reservas canceladas pelo cliente até 7 dias antes. Os montantes pagos deverão ser reembolsados a 100%.' 
                      : (campo?.politica_cancelamento?.includes('Moderada') 
                          ? 'Cancelamentos até 15 dias antes dão direito a reembolso de 50%. A comissão da HelloCamp é reduzida proporcionalmente.' 
                          : 'As reservas efetuadas são finais e não reembolsáveis. A comissão da HelloCamp é devida na sua totalidade.')}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200">
                <h4 className="font-black text-base mb-3 text-black uppercase border-l-4 border-black pl-3">Anexo 4 – Acordos Extraordinários</h4>
                <p className="mb-3 text-gray-700">Se existirem exceções negociadas a este contrato, estas serão gravadas no documento PDF assinado.</p>
                <textarea 
                  className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 outline-none focus:border-black transition-all text-sm" 
                  rows={2} 
                  value={acordosComplementares} 
                  onChange={e => setAcordosComplementares(e.target.value)}
                  placeholder="Insira as cláusulas de exceção acordadas, ou deixe em branco."
                ></textarea>
              </div>

            </div>

            <div className="h-px bg-gray-300 w-full my-8 md:my-12"></div>

            {/* ZONA DE ASSINATURAS FINAIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mt-8 font-sans">
              <div>
                <h4 className="font-black mb-4 sm:mb-6 uppercase tracking-wider text-black text-xs sm:text-sm">{isEn ? 'For HelloCamp' : 'Pela HelloCamp'}</h4>
                <p className="font-serif text-lg sm:text-xl italic text-gray-500 mb-2">{isEn ? 'HelloCamp Administration' : 'Administração HelloCamp'}</p>
                <p className="text-xs sm:text-sm font-medium border-t border-gray-200 mt-4 sm:mt-6 pt-3 sm:pt-4">{isEn ? 'Date:' : 'Data:'} {dataAtual}</p>
              </div>

              <div>
                <h4 className="font-black mb-4 sm:mb-6 uppercase tracking-wider text-black text-xs sm:text-sm">{isEn ? 'For the Partner' : 'Pelo Parceiro'}</h4>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] sm:text-xs font-bold uppercase mb-1 text-gray-500">{isEn ? 'Digital Signature Name *' : 'Nome da Assinatura Digital *'}</label>
                    <input required type="text" className="border-b-2 border-black bg-transparent outline-none py-2 text-lg sm:text-xl font-serif italic text-base focus:border-[#EBA914] transition-colors" value={assinaturaNome} onChange={e => setAssinaturaNome(e.target.value)} placeholder={isEn ? "Signatory's name" : "Nome de quem assina"} />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] sm:text-xs font-bold uppercase mb-1 text-gray-500">{isEn ? 'Role / Position *' : 'Cargo *'}</label>
                    <input required type="text" className="border-b border-gray-300 bg-transparent outline-none py-2 text-base focus:border-black transition-colors" value={assinaturaCargo} onChange={e => setAssinaturaCargo(e.target.value)} placeholder={isEn ? "Ex: Managing Partner" : "Ex: Sócio-Gerente"} />
                  </div>
                  <p className="text-xs sm:text-sm font-medium border-t border-gray-200 mt-4 sm:mt-6 pt-3 sm:pt-4">{isEn ? 'Date:' : 'Data:'} {dataAtual}</p>
                </div>

                <div className="mt-6 md:mt-8 bg-gray-50 p-4 border border-gray-200 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" required checked={concordaTermos} onChange={e => setConcordaTermos(e.target.checked)} className="mt-1 w-5 h-5 accent-black cursor-pointer flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed group-hover:text-black transition-colors">
                      {isEn 
                        ? 'I declare that I have read and accepted the Contractual terms. I confirm I have the legal authority to bind the entity through this digital signature.' 
                        : 'Declaro ter lido e aceite os Termos Operacionais apresentados e as Cláusulas do Contrato. Confirmo possuir poderes legais para vincular a entidade parceira identificada através desta assinatura digital.'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-12 md:pt-8 border-t border-slate-300 flex justify-end font-sans">
              <button type="submit" disabled={saving || !concordaTermos || !assinaturaNome || !assinaturaCargo} className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-black px-6 sm:px-10 py-4 sm:py-5 rounded-xl shadow-lg transition-transform hover:-translate-y-1 cursor-pointer w-full text-base sm:text-lg border border-emerald-400">
                {saving 
                  ? 'A Gerar Documento Criptografado...' 
                  : 'Assinar Digitalmente e Aprovar Programa'}
              </button>
            </div>

          </form>
        )}
      </div>
    </main>
  );
}
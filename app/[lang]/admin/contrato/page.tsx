"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function GestaoContratoGlobalPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const router = useRouter();
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [totalCampos, setTotalCampos] = useState(0);

  // ESTADO: "assinar" (ainda não tem contrato) vs "ver" (já assinou)
  const [modo, setModo] = useState<'assinar' | 'ver'>('assinar');
  const [submitting, setSubmitting] = useState(false);

  // Variáveis do Contrato (Para edição e visualização)
  const [form, setForm] = useState({
    nomeEmpresa: "",     
    nifEmpresa: "",      
    pessoaContacto: "",
    formaJuridica: "",
    morada: "",
    codigoPostal: "",
    telefone: "",
    emailContacto: "",
    emailReservas: "",
    website: "",
    responsavelRGPD: "",
    modalidadeReserva: "", 
    linkExternoReserva: "", 
    tipo_pagamento: "", 
    politica_cancelamento: "", 
    acordosComplementares: "",
    assinaturaNome: "",
    assinaturaCargo: "",
    concordaTermos: false,
    dataSubmissao: "",
    ipAssinatura: ""
  });

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${lang}/admin/login`); return; }

      const userId = session.user.id;

      const { data: perfilData, error: perfilErro } = await supabase.from('perfis').select('*').eq('id', userId).single();
      if (perfilErro || !perfilData) {
        alert("Acesso não autorizado ou perfil não encontrado.");
        router.push(`/${lang}/admin/dashboard`);
        return;
      }

      const { count } = await supabase.from('campos').select('*', { count: 'exact', head: true }).eq('organizador_id', userId);
      
      setPerfil(perfilData);
      setTotalCampos(count || 0);

      // Se já tem dados de contrato gravados, muda automaticamente para o modo de leitura
      if (perfilData.contrato_dados) {
        setModo('ver');
        const d = perfilData.contrato_dados;
        setForm({
          nomeEmpresa: d.empresaNome || perfilData.empresa_nome || "",
          nifEmpresa: d.nif || perfilData.nif_empresa || "",
          pessoaContacto: d.pessoaContacto || perfilData.nome_completo || "",
          formaJuridica: d.formaJuridica || "",
          morada: d.morada || "",
          codigoPostal: d.codigoPostal || "",
          telefone: d.telefone || perfilData.telefone || "",
          emailContacto: d.emailContacto || perfilData.email || "",
          emailReservas: d.emailReservas || "",
          website: d.website || "",
          responsavelRGPD: d.responsavelRGPD || "",
          modalidadeReserva: d.modalidadeReserva || perfilData.modalidade_reserva || "",
          linkExternoReserva: d.linkExternoReserva || perfilData.link_externo_reserva || "",
          tipo_pagamento: d.tipoPagamento || "",
          politica_cancelamento: d.politicaCancelamento || "",
          acordosComplementares: d.acordosComplementares || "",
          assinaturaNome: d.assinaturaNome || "",
          assinaturaCargo: d.assinaturaCargo || "",
          concordaTermos: true,
          dataSubmissao: d.dataSubmissao || "",
          ipAssinatura: d.ipAssinatura || ""
        });
      } else {
        // Modo Preenchimento
        setModo('assinar');
        setForm(prev => ({
          ...prev,
          nomeEmpresa: perfilData.empresa_nome || "",
          nifEmpresa: perfilData.nif_empresa || "",
          emailContacto: perfilData.email || "",
          telefone: perfilData.telefone || "",
          pessoaContacto: perfilData.nome_completo || "",
          modalidadeReserva: perfilData.modalidade_reserva || "",
          linkExternoReserva: perfilData.link_externo_reserva || "",
        }));
      }

      setLoading(false);
    };
    fetchDados();
  }, [lang, router]);

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modalidadeReserva) { alert("Por favor, selecione a modalidade de reserva no Anexo 1."); return; }
    if (form.modalidadeReserva === 'link_externo' && !form.linkExternoReserva) { alert("Por favor, insira o link externo do formulário de reserva no Anexo 1."); return; }
    if (form.modalidadeReserva !== 'link_externo' && (!form.tipo_pagamento || !form.politica_cancelamento)) { alert("Por favor, preencha as opções obrigatórias de pagamento e cancelamento nos anexos seguintes."); return; }
    if (!form.assinaturaNome || !form.assinaturaCargo || !form.concordaTermos) { alert("Por favor, preencha os dados da assinatura e confirme a aceitação dos termos no final do documento."); return; }

    setSubmitting(true);

    let userIP = "Desconhecido";
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (res.ok) {
        const ipData = await res.json();
        userIP = ipData.ip;
      }
    } catch (err) { console.error("Não foi possível capturar o IP."); }

    const payloadJSON = {
      pessoaContacto: form.pessoaContacto, formaJuridica: form.formaJuridica, morada: form.morada,
      codigoPostal: form.codigoPostal, telefone: form.telefone, emailContacto: form.emailContacto,
      emailReservas: form.emailReservas, website: form.website, responsavelRGPD: form.responsavelRGPD,
      modalidadeReserva: form.modalidadeReserva, linkExternoReserva: form.modalidadeReserva === 'link_externo' ? form.linkExternoReserva : "",
      tipoPagamento: form.modalidadeReserva !== 'link_externo' ? form.tipo_pagamento : "",
      politicaCancelamento: form.modalidadeReserva !== 'link_externo' ? form.politica_cancelamento : "",
      acordosComplementares: form.acordosComplementares, assinaturaNome: form.assinaturaNome,
      assinaturaCargo: form.assinaturaCargo, empresaNome: form.nomeEmpresa, nif: form.nifEmpresa,
      dataSubmissao: new Date().toISOString(), ipAssinatura: userIP
    };

    const { error: perfilError } = await supabase.from('perfis').update({
       empresa_nome: form.nomeEmpresa, nif_empresa: form.nifEmpresa, telefone: form.telefone,
       contrato_dados: payloadJSON, status_contrato: 'Pendente de Revisão',
       modalidade_reserva: form.modalidadeReserva, link_externo_reserva: form.modalidadeReserva === 'link_externo' ? form.linkExternoReserva : null
    }).eq('id', perfil.id);

    if (perfilError) { alert("Falha na gravação do perfil!"); setSubmitting(false); return; }

    const { error: camposError } = await supabase.from('campos').update({
      contrato_dados: payloadJSON, status_aprovacao: 'Pendente', modalidade_reserva: form.modalidadeReserva,
      link_externo_reserva: form.modalidadeReserva === 'link_externo' ? form.linkExternoReserva : null,
      tipo_pagamento: form.modalidadeReserva !== 'link_externo' ? form.tipo_pagamento : null,
      politica_cancelamento: form.modalidadeReserva !== 'link_externo' ? form.politica_cancelamento : null
    }).eq('organizador_id', perfil.id);

    if (camposError) { alert("Falha na atualização dos campos!"); setSubmitting(false); return; }

    alert("Contrato Global submetido com sucesso! A aguardar validação da equipa HelloCamp.");
    window.location.reload(); // Recarrega a página para entrar no modo de leitura (VerContrato)
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-500 animate-pulse">A carregar documentos legais...</div>;

  const dataAtual = new Date().toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });
  const dataSubmissaoExibicao = form.dataSubmissao ? new Date(form.dataSubmissao).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  
  const inputClass = "border-b border-slate-300 outline-none bg-transparent px-2 py-2 text-slate-800 placeholder:text-slate-300 w-full focus:border-[#167524] transition-colors";
  const inputClassCustom = "border-b-2 border-slate-900 outline-none bg-transparent px-2 py-2 text-base font-black text-slate-900 placeholder:text-slate-300 w-full focus:border-[#167524] transition-colors";

  const isVer = modo === 'ver';
  
  // Lógica Visual do Modo Leitura
  let statusColor = "bg-amber-100 text-amber-800 border-amber-200";
  const status = (perfil.status_contrato || 'Pendente').toLowerCase();
  if (status === 'validado' || status === 'aprovado' || status === 'ativo') statusColor = "bg-[#167524]/10 text-[#167524] border-[#167524]/20";

  let modalidadeNome = "";
  if (form.modalidadeReserva === 'direta') modalidadeNome = "✅ Reserva Direta com Pagamento Automático";
  else if (form.modalidadeReserva === 'email') modalidadeNome = "✅ Comunicação por E-mail (Reserva Sob Consulta)";
  else if (form.modalidadeReserva === 'link_externo') modalidadeNome = "✅ Formulário ou Link Externo (Redirecionamento)";

  const comissaoText = perfil.taxa_comissao !== null && perfil.taxa_comissao !== undefined ? perfil.taxa_comissao : 12;
  let baseComissaoText = "Sobre Valor Total (Programa + Extras)";
  if (perfil.base_comissao === "apenas_programa") baseComissaoText = "Apenas sobre Valor Base do Programa";
  if (perfil.base_comissao === "sem_comissao") baseComissaoText = "Isento de Comissão (0%)";

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 md:px-8 font-sans text-slate-900">
      <div className="max-w-[1000px] mx-auto">
        
        {/* BARRA DE FERRAMENTAS DE TOPO */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden">
          <Link href={`/${lang}/admin/dashboard`} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2">
            &larr; Voltar ao Painel
          </Link>
          
          {isVer && (
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest shadow-sm ${statusColor}`}>
                Estado: {perfil.status_contrato || 'Pendente'}
              </div>
              <button onClick={() => window.print()} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-md">
                🖨️ Imprimir PDF
              </button>
            </div>
          )}
        </div>

        <form id="contrato-form" onSubmit={handleSubmeter} className="bg-white shadow-xl border border-slate-200 p-8 md:p-16 rounded-[2rem] font-serif print:shadow-none print:p-0 print:border-none">
          
          {/* CABEÇALHO COM LOGO OFICIAL */}
          <div className="text-center mb-16">
            <div className="text-3xl md:text-4xl font-black tracking-tighter mb-8 font-sans flex justify-center items-center">
              <span className="text-[#0E3A68]">Hello</span><span className="text-[#e2a41d]">Camp</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold uppercase mb-2 tracking-widest border-b-2 border-slate-900 inline-block pb-2">
              Contrato Global de {isVer ? 'Intermediação' : 'Parceiro'}
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-3 font-sans uppercase tracking-widest">
              {isVer ? 'CÓPIA DO PARCEIRO (DOCUMENTO VINCULATIVO)' : 'Um acordo único para toda a sua operação.'}
            </p>
          </div>

          {/* AS 4 FASES EXPLICATIVAS (SÓ APARECE AO ASSINAR) */}
          {!isVer && (
            <div className="space-y-12 mb-16 font-sans">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">📝</div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900 mb-2">1. Celebração do contrato</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">Celebração do contrato de parceria com a HelloCamp. Este contrato regula a divulgação e a intermediação das suas ofertas através da plataforma HelloCamp. O acordo mantém-se válido até ao final do ano civil em curso, sendo automaticamente renovado, salvo denúncia.</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">🏖️</div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900 mb-2">2. Divulgação das ofertas</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">A HelloCamp procede à recolha e organização das informações relativas às atividades disponibilizadas pelo parceiro, criando as respetivas páginas na plataforma. Promovemos os programas e partilhamos a sua marca sem esconder os seus contactos.</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">💻</div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900 mb-2">3. Reservas Automáticas</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">As reservas poderão ser efetuadas diretamente através da HelloCamp. Sempre que uma reserva seja realizada, comunicaremos os dados clínicos, fichas médicas e detalhes do participante.</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">€</div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900 mb-2">4. Pagamento da Comissão</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">A HelloCamp cobra uma comissão sobre cada reserva concluída. O modelo de pagamento poderá assumir diferentes formas (direta, e-mail ou externa). As condições serão definidas de acordo com as escolhas nos Anexos Operacionais.</p>
                </div>
              </div>
            </div>
          )}

          {!isVer && <div className="h-0.5 bg-slate-900 w-full my-16"></div>}

          {/* DADOS DAS PARTES */}
          <div className="space-y-6 text-[14px] md:text-[15px] text-justify">
            {!isVer && <h2 className="text-2xl font-bold text-center uppercase tracking-widest mb-10">Preenchimento de Dados</h2>}

            <p className="mb-4 text-slate-800 font-bold">Entre:</p>
            <div className="ml-4 md:ml-8 mb-8 space-y-1 bg-slate-50 p-5 rounded-xl border border-slate-200 font-sans text-sm">
              <p className="font-black text-slate-900">HelloCamp Portugal</p>
              <p>Website: www.hellocamp.pt</p>
              <p>E-mail: info@hellocamp.pt</p>
            </div>

            <p className="mb-4 text-slate-800 font-bold">E</p>
            
            {/* DADOS DO PARCEIRO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 ml-4 md:ml-8 mb-8 bg-slate-50 p-6 md:p-8 border border-slate-200 font-sans text-sm shadow-sm rounded-2xl">
              <div className="flex flex-col md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Nome da Empresa (Faturação) *</label>
                {isVer ? <span className="font-black text-base text-slate-900">{form.nomeEmpresa}</span> : <input required type="text" className={inputClassCustom} value={form.nomeEmpresa} onChange={e => setForm({...form, nomeEmpresa: e.target.value})} placeholder="Designação legal" />}
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">NIF *</label>
                {isVer ? <span className="font-black text-base text-slate-900">{form.nifEmpresa}</span> : <input required type="text" className={inputClassCustom} value={form.nifEmpresa} onChange={e => setForm({...form, nifEmpresa: e.target.value})} placeholder="Ex: 500 000 000" />}
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Pessoa de Contacto *</label>
                {isVer ? <span className="font-black text-base text-slate-900">{form.pessoaContacto}</span> : <input required type="text" className={inputClass} value={form.pessoaContacto} onChange={e => setForm({...form, pessoaContacto: e.target.value})} placeholder="Nome completo" />}
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Forma Jurídica *</label>
                {isVer ? <span className="font-black text-base text-slate-900">{form.formaJuridica}</span> : <input required type="text" className={inputClass} value={form.formaJuridica} onChange={e => setForm({...form, formaJuridica: e.target.value})} placeholder="Ex: Lda, Associação" />}
              </div>
              <div className="flex flex-col md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Morada Sede Fiscal *</label>
                {isVer ? <span className="font-black text-base text-slate-900">{form.morada}</span> : <input required type="text" className={inputClass} value={form.morada} onChange={e => setForm({...form, morada: e.target.value})} placeholder="Morada completa" />}
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Código Postal e Localidade *</label>
                {isVer ? <span className="font-black text-base text-slate-900">{form.codigoPostal}</span> : <input required type="text" className={inputClass} value={form.codigoPostal} onChange={e => setForm({...form, codigoPostal: e.target.value})} placeholder="0000-000 Localidade" />}
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Número de Telefone *</label>
                {isVer ? <span className="font-black text-base text-slate-900">{form.telefone}</span> : <input required type="text" className={inputClass} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />}
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">E-mail Comercial *</label>
                {isVer ? <span className="font-black text-base text-slate-900">{form.emailContacto}</span> : <input required type="email" className={inputClass} value={form.emailContacto} onChange={e => setForm({...form, emailContacto: e.target.value})} />}
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">E-mail Exclusivo de Reservas *</label>
                {isVer ? <span className="font-black text-base text-slate-900">{form.emailReservas}</span> : <input required type="email" className={inputClass} value={form.emailReservas} onChange={e => setForm({...form, emailReservas: e.target.value})} />}
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Website</label>
                {isVer ? <span className="font-black text-base text-slate-900">{form.website || "N/A"}</span> : <input type="text" className={inputClass} value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="Opcional" />}
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Responsável RGPD *</label>
                {isVer ? <span className="font-black text-base text-slate-900">{form.responsavelRGPD}</span> : <input required type="text" className={inputClass} value={form.responsavelRGPD} onChange={e => setForm({...form, responsavelRGPD: e.target.value})} placeholder="Nome do gestor de dados" />}
              </div>
            </div>
            
            <div className="text-center p-6 md:p-8 border-y border-slate-200 bg-slate-50 rounded-2xl font-sans">
               <p className="font-bold text-lg mb-3 text-slate-600">É celebrado o presente contrato de intermediação e divulgação comercial aplicável a:</p>
               <span className="block text-xl md:text-2xl font-black text-[#167524] uppercase tracking-widest">
                  Todas as atividades organizadas por {form.nomeEmpresa || "a Vossa Entidade"}
               </span>
               {!isVer && (
                 <span className="block text-sm text-slate-500 mt-3 font-medium max-w-xl mx-auto">
                    Este contrato abrange todos os {totalCampos > 0 ? `${totalCampos} campo(s)` : 'campos'} de férias atuais e quaisquer futuros programas criados pelo parceiro na plataforma HelloCamp.
                 </span>
               )}
            </div>
          </div>

          <div className="space-y-6 text-[14px] md:text-[15px] text-justify pt-12">
            <h3 className="font-bold text-lg md:text-xl uppercase tracking-widest border-b border-slate-900 pb-2 mb-8 font-sans">Cláusulas Contratuais</h3>
            
            <h4 className="font-bold font-sans">Artigo 1.º – Comissão</h4>
            {isVer ? (
              <p className="mb-4">O Parceiro compromete-se a pagar à HelloCamp uma comissão de {comissaoText}% (IVA incluído) sobre cada reserva efetuada através da plataforma. Incidência: {baseComissaoText}.</p>
            ) : (
              <p className="mb-4">O Parceiro compromete-se a pagar à HelloCamp a comissão (IVA incluído) acordada sobre cada reserva efetuada através da plataforma, nos termos definidos no presente contrato ou no Painel Financeiro.</p>
            )}
            <p className="mb-4">A comissão é calculada sobre o valor efetivamente pago pelo cliente relativamente à atividade reservada, incluindo serviços adicionais contratados. A comissão torna-se devida após a confirmação da reserva pelo Parceiro e a transmissão dos respetivos dados.</p>
            <p className="mb-8">Caso uma reserva não possa ser realizada por motivos devidamente justificados, nomeadamente indisponibilidade da atividade, o Parceiro deverá informar a HelloCamp de imediato.</p>

            <h4 className="font-bold font-sans">Artigo 2.º – Condições de Pagamento e Faturação</h4>
            <p className="mb-8">As comissões devidas à HelloCamp serão faturadas de acordo com o modelo de pagamento acordado. O Parceiro compromete-se a liquidar as faturas emitidas pela HelloCamp dentro dos prazos nelas indicados.</p>

            <h4 className="font-bold font-sans">Artigo 3.º – Obrigações do Parceiro</h4>
            <p className="mb-4">O Parceiro compromete-se a fornecer à HelloCamp todas as informações necessárias à divulgação das suas atividades. Garante que possui todos os direitos sobre os conteúdos disponibilizados à HelloCamp (direitos de autor e de imagem).</p>
            <p className="mb-8">Os preços divulgados na plataforma HelloCamp não poderão ser superiores aos preços praticados pelo Parceiro para reservas diretas da mesma atividade.</p>

            <h4 className="font-bold font-sans">Artigo 4.º – Duração e Renovação</h4>
            <p className="mb-8">O presente contrato produz efeitos a partir da data da sua assinatura por ambas as partes e mantém-se válido até ao final do ano civil, sendo automaticamente renovado por períodos sucessivos de um ano.</p>

            <h4 className="font-bold font-sans">Artigo 5.º – Limitação de Responsabilidade e Seguros</h4>
            <p className="mb-4">A HelloCamp atua exclusivamente como plataforma intermediária. Não assume qualquer responsabilidade civil, criminal ou contratual por eventuais acidentes ou disputas durante as atividades.</p>
            <p className="mb-8">O Parceiro é o único e exclusivo responsável pela segurança dos participantes, garantindo que possui todos os seguros obrigatórios por lei, licenças e certificações exigidas para o exercício da sua atividade.</p>

            <h4 className="font-bold font-sans border-l-4 border-slate-900 pl-4 mt-10 py-1 bg-slate-50">Artigo 7.º – Validade da Assinatura e Convenção de Prova</h4>
            <p className="mb-4 bg-slate-50 p-4 rounded-r-xl">As partes reconhecem expressamente a validade e a força vinculativa da aceitação do presente contrato através de meios eletrónicos (designadamente a aposição do nome do representante legal no portal web da HelloCamp). Ao abrigo da liberdade de estipulação probatória, as partes convencionam que os registos informáticos recolhidos pela HelloCamp (incluindo o endereço IP e timestamp) constituem meio de prova plenamente válido, renunciando o Parceiro a invocar a nulidade do contrato com fundamento na ausência de assinatura autógrafa.</p>
          </div>

          <div className="h-px bg-slate-300 w-full my-12"></div>

          {/* ANEXOS E OPÇÕES DE OPERAÇÃO */}
          <div className="space-y-12 font-sans text-sm text-slate-800">
            
            {/* ANEXO 1 */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200">
              <h3 className="font-black text-base md:text-lg mb-5 text-slate-900 uppercase border-l-4 border-[#167524] pl-3">Anexo 1 – Procedimento de Reserva</h3>
              
              {isVer ? (
                <div className="p-5 bg-white border border-slate-300 rounded-xl shadow-sm">
                  <strong className="block text-slate-900 mb-1">{modalidadeNome}</strong>
                  {form.modalidadeReserva === 'link_externo' && form.linkExternoReserva && (
                    <p className="mt-3 text-slate-600 bg-slate-50 p-3 rounded-lg text-xs font-mono break-all border border-slate-200">
                      URL Oficial: {form.linkExternoReserva}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="mb-6 font-medium text-slate-500">Selecione a modalidade de gestão de reservas aplicável à sua parceria.</p>
                  
                  <label className={`flex items-start gap-4 cursor-pointer p-5 rounded-xl border-2 transition-colors ${form.modalidadeReserva === 'direta' ? 'bg-white border-[#167524] shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <input type="radio" name="anexo1" required value="direta" checked={form.modalidadeReserva === 'direta'} onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-5 h-5 accent-[#167524]" />
                    <div>
                      <strong className="block text-slate-900 mb-1.5 text-base">Reserva Direta no Checkout (Recomendado)</strong>
                      <span className="text-slate-600 leading-relaxed block text-xs">As reservas efetuadas através da plataforma HelloCamp serão registadas diretamente no sistema de reservas do Parceiro. O formulário recolherá todas as fichas médicas. O Parceiro compromete-se a manter as disponibilidades atualizadas.</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-4 cursor-pointer p-5 rounded-xl border-2 transition-colors ${form.modalidadeReserva === 'email' ? 'bg-white border-[#167524] shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <input type="radio" name="anexo1" required value="email" checked={form.modalidadeReserva === 'email'} onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-5 h-5 accent-[#167524]" />
                    <div>
                      <strong className="block text-slate-900 mb-1.5 text-base">Comunicação por E-mail (Sob Consulta)</strong>
                      <span className="text-slate-600 leading-relaxed block text-xs">A HelloCamp enviará por e-mail os dados do participante. O Parceiro dispõe de 2 dias úteis para comunicar a rejeição da reserva. Na ausência de resposta, a reserva considerar-se-á aceite e faturada.</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-4 cursor-pointer p-5 rounded-xl border-2 transition-colors ${form.modalidadeReserva === 'link_externo' ? 'bg-white border-[#167524] shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <input type="radio" name="anexo1" required value="link_externo" checked={form.modalidadeReserva === 'link_externo'} onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-5 h-5 accent-[#167524] flex-shrink-0" />
                    <div className="w-full">
                      <strong className="block text-slate-900 mb-1.5 text-base">Formulário Externo Próprio (Redirecionamento)</strong>
                      <span className="text-slate-600 leading-relaxed block mb-4 text-xs">O tráfego é redirecionado para o seu website. A HelloCamp recolhe apenas a Lead Inicial (Nome e Email). O Parceiro compromete-se sob compromisso de honra a ser verdadeiro na comunicação mensal de inscrições finalizadas.</span>
                      
                      {form.modalidadeReserva === 'link_externo' && (
                        <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl mt-4 w-full">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
                            Insira o Link Externo (URL) Principal *
                          </label>
                          <input 
                            type="url" 
                            required 
                            placeholder="https://meusite.com/inscricao" 
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm font-bold outline-none focus:border-[#167524] shadow-inner"
                            value={form.linkExternoReserva}
                            onChange={e => setForm({...form, linkExternoReserva: e.target.value})}
                          />
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* ANEXOS 2 E 3 CONDICIONAIS */}
            {form.modalidadeReserva !== 'link_externo' ? (
              <>
                <div className="bg-[#167524]/5 p-6 md:p-8 rounded-2xl border border-[#167524]/20">
                  <h3 className="font-black text-base md:text-lg mb-5 text-[#167524] uppercase border-l-4 border-[#167524] pl-3">Anexo 2 – Pagamento e comissão</h3>
                  
                  {isVer ? (
                    <div className="p-5 bg-white border border-[#167524]/40 rounded-xl shadow-sm">
                      <strong className="block text-[#167524] font-black">
                        {form.tipo_pagamento === '100_total' ? '✅ 100% Pago no Ato da Reserva (Imediato)' : '✅ Sinal de 50% Agora + 50% Antes'}
                      </strong>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="mb-5 text-sm text-[#167524]/80 font-medium">O Parceiro autoriza a HelloCamp a receber um depósito efetuado através da plataforma segura Stripe.</p>
                      
                      <label className={`flex items-start gap-4 cursor-pointer p-5 rounded-xl border-2 transition-colors ${form.tipo_pagamento === '100_total' ? 'bg-white border-[#167524] shadow-sm' : 'border-[#167524]/20 hover:border-[#167524]/50 bg-white/50'}`}>
                        <input type="radio" name="anexo2" required value="100_total" checked={form.tipo_pagamento === '100_total'} onChange={e => setForm({...form, tipo_pagamento: e.target.value})} className="mt-1 w-5 h-5 accent-[#167524]" />
                        <div>
                          <strong className="block text-slate-900 mb-1">100% Pago no Ato da Reserva (Pagamento Imediato)</strong>
                          <span className="text-slate-600 text-xs leading-relaxed block">O cliente liquida a totalidade do valor do programa para assegurar a vaga de imediato.</span>
                        </div>
                      </label>

                      <label className={`flex items-start gap-4 cursor-pointer p-5 rounded-xl border-2 transition-colors ${form.tipo_pagamento === '50_sinal' ? 'bg-white border-[#167524] shadow-sm' : 'border-[#167524]/20 hover:border-[#167524]/50 bg-white/50'}`}>
                        <input type="radio" name="anexo2" required value="50_sinal" checked={form.tipo_pagamento === '50_sinal'} onChange={e => setForm({...form, tipo_pagamento: e.target.value})} className="mt-1 w-5 h-5 accent-[#167524]" />
                        <div>
                          <strong className="block text-slate-900 mb-1">Sinal de 50% Agora + 50% 1 Semana Antes</strong>
                          <span className="text-slate-600 text-xs leading-relaxed block">A plataforma debitará automaticamente a segunda metade do cartão do cliente 7 dias antes.</span>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 p-6 md:p-8 rounded-2xl border border-amber-200">
                  <h3 className="font-black text-base md:text-lg mb-5 text-amber-900 uppercase border-l-4 border-amber-500 pl-3">Anexo 3 – Política de Cancelamento</h3>
                  
                  {isVer ? (
                    <div className="p-5 bg-white border border-amber-400 rounded-xl shadow-sm">
                      <strong className="block text-amber-900 font-black">✅ {form.politica_cancelamento}</strong>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="mb-5 text-sm text-amber-800 font-medium">A comissão da HelloCamp será sempre ajustada proporcionalmente ao montante que o Parceiro retiver.</p>
                      
                      <label className={`flex items-start gap-4 cursor-pointer p-5 rounded-xl border-2 transition-colors ${form.politica_cancelamento === 'Flexível (Reembolso a 100% até 7 dias antes)' ? 'bg-white border-amber-500 shadow-sm' : 'border-amber-200 hover:border-amber-300 bg-white/50'}`}>
                        <input type="radio" name="anexo3" required value="Flexível (Reembolso a 100% até 7 dias antes)" checked={form.politica_cancelamento === 'Flexível (Reembolso a 100% até 7 dias antes)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-5 h-5 accent-amber-600" />
                        <div>
                          <strong className="block text-slate-900 mb-1 text-sm">Flexível (Reembolso a 100% até 7 dias antes)</strong>
                        </div>
                      </label>

                      <label className={`flex items-start gap-4 cursor-pointer p-5 rounded-xl border-2 transition-colors ${form.politica_cancelamento === 'Moderada (Reembolso a 50% até 15 dias antes)' ? 'bg-white border-amber-500 shadow-sm' : 'border-amber-200 hover:border-amber-300 bg-white/50'}`}>
                        <input type="radio" name="anexo3" required value="Moderada (Reembolso a 50% até 15 dias antes)" checked={form.politica_cancelamento === 'Moderada (Reembolso a 50% até 15 dias antes)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-5 h-5 accent-amber-600" />
                        <div>
                          <strong className="block text-slate-900 mb-1 text-sm">Moderada (Reembolso a 50% até 15 dias antes)</strong>
                        </div>
                      </label>

                      <label className={`flex items-start gap-4 cursor-pointer p-5 rounded-xl border-2 transition-colors ${form.politica_cancelamento === 'Estrita (Sem reembolso após reserva)' ? 'bg-white border-amber-500 shadow-sm' : 'border-amber-200 hover:border-amber-300 bg-white/50'}`}>
                        <input type="radio" name="anexo3" required value="Estrita (Sem reembolso após reserva)" checked={form.politica_cancelamento === 'Estrita (Sem reembolso após reserva)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-5 h-5 accent-amber-600" />
                        <div>
                          <strong className="block text-slate-900 mb-1 text-sm">Estrita (Sem reembolso após reserva)</strong>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                 <h3 className="font-black text-lg mb-4 text-slate-600 uppercase border-l-4 border-slate-400 pl-3">Anexos 2 e 3 – Gestão Externa</h3>
                 <p className="text-slate-600 font-medium text-sm">As políticas financeiras e de cancelamento são geridas externamente no seu website/formulário. A comissão é faturada pela HelloCamp consoante as leads validadas mensalmente.</p>
              </div>
            )}

            {/* ANEXO 4 */}
            {(isVer && form.acordosComplementares) || !isVer ? (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-black text-lg mb-4 text-slate-900 uppercase border-l-4 border-slate-400 pl-3">Anexo 4 – Acordos Extraordinários</h3>
                {isVer ? (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl whitespace-pre-wrap font-medium text-sm text-slate-700">
                    {form.acordosComplementares}
                  </div>
                ) : (
                  <>
                    <p className="mb-4 text-sm text-slate-500 font-medium">Preencha apenas se acordou exceções contratuais (ex: isenções).</p>
                    <textarea 
                      className="w-full border border-slate-300 p-5 rounded-xl bg-slate-50 outline-none focus:border-[#167524] transition-all text-sm" 
                      rows={3} 
                      value={form.acordosComplementares} 
                      onChange={e => setForm({...form, acordosComplementares: e.target.value})}
                      placeholder="Insira as cláusulas de exceção pré-acordadas, ou deixe em branco."
                    ></textarea>
                  </>
                )}
              </div>
            ) : null}

          </div>

          {/* ZONA DE ASSINATURAS FINAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mt-16 pt-12 border-t-[3px] border-slate-900 font-sans">
            <div>
              <h4 className="font-black mb-6 uppercase tracking-widest text-slate-900 text-[11px]">Pela HelloCamp</h4>
              <p className="font-serif text-2xl italic text-slate-400 mb-2">Administração HelloCamp</p>
              <p className="text-sm font-bold text-slate-400 border-t border-slate-200 mt-8 pt-4 uppercase tracking-widest text-[10px]">Data: {isVer ? dataSubmissaoExibicao : dataAtual}</p>
            </div>

            <div>
              <h4 className="font-black mb-6 uppercase tracking-widest text-slate-900 text-[11px]">Pelo Parceiro</h4>
              
              {isVer ? (
                <>
                  <p className="font-serif text-3xl italic text-slate-900 mb-2">{form.assinaturaNome}</p>
                  <p className="text-sm font-black text-slate-500 mb-4">{form.assinaturaCargo}</p>
                  <p className="text-sm font-bold text-slate-400 border-t border-slate-200 mt-8 pt-4 uppercase tracking-widest text-[10px]">Submetido a: {dataSubmissaoExibicao}</p>
                  
                  <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-inner">
                     <p className="text-[10px] text-slate-400 font-mono font-bold mb-1 uppercase">Registo de Aceitação Legal</p>
                     <p className="text-[11px] text-slate-600 font-mono m-0">Endereço IP: {form.ipAssinatura || 'Registado pelo Servidor'}</p>
                     <div className="mt-3 inline-flex items-center gap-2 bg-[#167524]/10 text-[#167524] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-[#167524]/20">
                       <span>✓</span> Termos Aceites
                     </div>
                  </div>
                </>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Escreva o seu Nome *</label>
                    <input required type="text" className="border-b-2 border-slate-900 bg-transparent outline-none py-2 text-2xl font-serif italic text-slate-900 focus:border-[#167524] transition-colors" value={form.assinaturaNome} onChange={e => setForm({...form, assinaturaNome: e.target.value})} placeholder="A sua Assinatura" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Cargo *</label>
                    <input required type="text" className="border-b border-slate-300 bg-transparent outline-none py-2 font-bold text-slate-900 focus:border-[#167524] transition-colors" value={form.assinaturaCargo} onChange={e => setForm({...form, assinaturaCargo: e.target.value})} placeholder="Ex: Sócio-Gerente" />
                  </div>
                  <p className="text-sm font-bold text-slate-400 border-t border-slate-200 mt-8 pt-4 uppercase tracking-widest text-[10px]">Data: {dataAtual}</p>

                  <div className="mt-8 bg-slate-50 p-5 border border-slate-200 rounded-xl shadow-inner">
                    <label className="flex items-start gap-4 cursor-pointer group">
                      <input type="checkbox" required checked={form.concordaTermos} onChange={e => setForm({...form, concordaTermos: e.target.checked})} className="mt-1 w-5 h-5 accent-[#167524] cursor-pointer flex-shrink-0" />
                      <span className="text-[11px] text-slate-600 font-bold leading-relaxed group-hover:text-slate-900 transition-colors">
                        Declaro ter lido e aceite os termos do contrato global e a convenção de prova do Artigo 7.º. Confirmo possuir poderes legais para vincular a entidade supra identificada através desta assinatura digital.
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isVer && (
            <div className="pt-10 mt-16 border-t border-slate-200 flex justify-end font-sans">
              <button 
                type="submit" 
                disabled={submitting || !form.concordaTermos || !form.assinaturaNome || !form.assinaturaCargo} 
                className="bg-[#167524] hover:bg-[#115a1b] disabled:bg-slate-300 text-white font-black px-6 md:px-12 py-5 rounded-2xl shadow-lg shadow-[#167524]/20 transition-all hover:-translate-y-1 cursor-pointer w-full md:w-auto text-sm uppercase tracking-widest"
              >
                {submitting ? 'A Submeter Contrato Global...' : 'Assinar Digitalmente e Concluir'}
              </button>
            </div>
          )}

        </form>
      </div>
    </main>
  );
}
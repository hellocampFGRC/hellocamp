"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function AssinaturaContratoGlobalPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const router = useRouter();
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [totalCampos, setTotalCampos] = useState(0);

  // Variáveis do Contrato e Configurações da Base de Dados
  const [form, setForm] = useState({
    nomeEmpresa: "",     // Editável
    nifEmpresa: "",      // Editável
    pessoaContacto: "",
    formaJuridica: "",
    morada: "",
    codigoPostal: "",
    telefone: "",
    emailContacto: "",
    emailReservas: "",
    website: "",
    responsavelRGPD: "",
    modalidadeReserva: "", // Anexo 1
    linkExternoReserva: "", // Anexo 1
    tipo_pagamento: "", // Anexo 2
    politica_cancelamento: "", // Anexo 3
    acordosComplementares: "",
    assinaturaNome: "",
    assinaturaCargo: "",
    concordaTermos: false
  });

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${lang}/admin/login`); return; }

      const userId = session.user.id;

      // Buscar perfil da Empresa
      const { data: perfilData, error: perfilErro } = await supabase.from('perfis').select('*').eq('id', userId).single();
      if (perfilErro || !perfilData) {
        alert("Acesso não autorizado ou perfil não encontrado.");
        router.push(`/${lang}/admin/dashboard`);
        return;
      }

      // Contar quantos campos esta empresa já tem criados
      const { count } = await supabase.from('campos').select('*', { count: 'exact', head: true }).eq('organizador_id', userId);
      
      setPerfil(perfilData);
      setTotalCampos(count || 0);

      // Preencher o formulário com dados base do Perfil + Contrato Prévio (se existir)
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

      if (perfilData.contrato_dados) {
        const d = perfilData.contrato_dados;
        setForm(prev => ({
          ...prev,
          nomeEmpresa: d.empresaNome || prev.nomeEmpresa,
          nifEmpresa: d.nif || prev.nifEmpresa,
          pessoaContacto: d.pessoaContacto || prev.pessoaContacto,
          formaJuridica: d.formaJuridica || "",
          morada: d.morada || "",
          codigoPostal: d.codigoPostal || "",
          telefone: d.telefone || prev.telefone,
          emailContacto: d.emailContacto || prev.emailContacto,
          emailReservas: d.emailReservas || "",
          website: d.website || "",
          responsavelRGPD: d.responsavelRGPD || "",
          modalidadeReserva: d.modalidadeReserva || prev.modalidadeReserva,
          linkExternoReserva: d.linkExternoReserva || prev.linkExternoReserva,
          tipo_pagamento: d.tipoPagamento || "",
          politica_cancelamento: d.politicaCancelamento || "",
          acordosComplementares: d.acordosComplementares || "",
          assinaturaNome: d.assinaturaNome || "",
          assinaturaCargo: d.assinaturaCargo || "",
        }));
      }

      setLoading(false);
    };
    fetchDados();
  }, [lang, router]);

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modalidadeReserva) {
      alert("Por favor, selecione a modalidade de reserva no Anexo 1.");
      return;
    }

    if (form.modalidadeReserva === 'link_externo' && !form.linkExternoReserva) {
      alert("Por favor, insira o link externo do formulário de reserva no Anexo 1.");
      return;
    }

    if (form.modalidadeReserva !== 'link_externo' && (!form.tipo_pagamento || !form.politica_cancelamento)) {
       alert("Por favor, preencha as opções obrigatórias de pagamento e cancelamento nos anexos seguintes.");
       return;
    }

    if (!form.assinaturaNome || !form.assinaturaCargo || !form.concordaTermos) {
      alert("Por favor, preencha os dados da assinatura e confirme a aceitação dos termos no final do documento.");
      return;
    }

    setSubmitting(true);

    // 0. Capturar o IP do utilizador para prova legal
    let userIP = "Desconhecido";
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (res.ok) {
        const ipData = await res.json();
        userIP = ipData.ip;
      }
    } catch (err) {
      console.error("Não foi possível capturar o IP.");
    }

    const payloadJSON = {
      pessoaContacto: form.pessoaContacto,
      formaJuridica: form.formaJuridica,
      morada: form.morada,
      codigoPostal: form.codigoPostal,
      telefone: form.telefone,
      emailContacto: form.emailContacto,
      emailReservas: form.emailReservas,
      website: form.website,
      responsavelRGPD: form.responsavelRGPD,
      modalidadeReserva: form.modalidadeReserva,
      linkExternoReserva: form.modalidadeReserva === 'link_externo' ? form.linkExternoReserva : "",
      tipoPagamento: form.modalidadeReserva !== 'link_externo' ? form.tipo_pagamento : "",
      politicaCancelamento: form.modalidadeReserva !== 'link_externo' ? form.politica_cancelamento : "",
      acordosComplementares: form.acordosComplementares,
      assinaturaNome: form.assinaturaNome,
      assinaturaCargo: form.assinaturaCargo,
      empresaNome: form.nomeEmpresa,
      nif: form.nifEmpresa,
      dataSubmissao: new Date().toISOString(),
      ipAssinatura: userIP // IP GUARDADO AQUI PARA FINS DE PROVA
    };

    // 1. Atualizar o Perfil da Empresa
    const { error: perfilError } = await supabase
      .from('perfis')
      .update({
         empresa_nome: form.nomeEmpresa,
         nif_empresa: form.nifEmpresa,
         telefone: form.telefone,
         contrato_dados: payloadJSON,
         status_contrato: 'Pendente de Revisão',
         modalidade_reserva: form.modalidadeReserva,
         link_externo_reserva: form.modalidadeReserva === 'link_externo' ? form.linkExternoReserva : null
      })
      .eq('id', perfil.id);

    if (perfilError) {
      alert("Falha na gravação do perfil! Detalhes do erro: " + perfilError.message);
      console.error("Erro Perfil:", perfilError);
      setSubmitting(false);
      return;
    }

    // 2. Atualizar TODOS os campos existentes desta empresa
    const { error: camposError } = await supabase
      .from('campos')
      .update({
        contrato_dados: payloadJSON,
        status_aprovacao: 'Pendente',
        modalidade_reserva: form.modalidadeReserva,
        link_externo_reserva: form.modalidadeReserva === 'link_externo' ? form.linkExternoReserva : null,
        tipo_pagamento: form.modalidadeReserva !== 'link_externo' ? form.tipo_pagamento : null,
        politica_cancelamento: form.modalidadeReserva !== 'link_externo' ? form.politica_cancelamento : null
      })
      .eq('organizador_id', perfil.id);

    if (camposError) {
      alert("Perfil guardado, mas falhou na atualização dos campos! Erro: " + camposError.message);
      console.error("Erro Campos:", camposError);
      setSubmitting(false);
      return;
    }

    alert("Contrato Global submetido com sucesso! A aguardar validação da equipa HelloCamp.");
    router.push(`/${lang}/admin/dashboard`);
    setSubmitting(false);
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-500">A preparar o seu Contrato Global...</div>;

  const inputClass = "border-b border-gray-400 outline-none bg-transparent px-1 py-1.5 text-black placeholder:text-gray-400 w-full focus:border-black transition-colors";
  const inputClassCustom = "border-b-2 border-black outline-none bg-transparent px-1 py-1.5 text-base font-bold text-slate-900 placeholder:text-gray-400 w-full focus:border-[#EBA914] transition-colors rounded-t-sm";
  const dataAtual = new Date().toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main className="min-h-screen bg-slate-200 py-12 px-4 font-sans text-black selection:bg-yellow-200">
      <div className="max-w-[900px] mx-auto">
        
        {/* BARRA DE TOPO SIMPLIFICADA */}
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm">
          <Link href={`/${lang}/admin/dashboard`} className="text-sm font-bold text-slate-500 hover:text-black transition-colors flex items-center gap-2">
            &larr; Voltar ao Painel
          </Link>
        </div>

        <form id="contrato-form" onSubmit={handleSubmeter} className="bg-white shadow-2xl p-8 md:p-16 text-black leading-relaxed rounded-sm font-serif">
          
          <div className="text-center mb-16">
            <div className="text-4xl font-black tracking-tighter mb-8 font-sans">
              <span className="text-black">Hello</span><span className="text-[#EBA914]">Camp</span>
            </div>
            <h1 className="text-2xl font-bold uppercase mb-2 tracking-widest border-b-2 border-black inline-block pb-2">
              Contrato Global de Parceiro
            </h1>
            <p className="text-base italic text-gray-600 mt-4">
              Um único acordo que abrange toda a sua operação na plataforma HelloCamp.
            </p>
          </div>

          {/* AS 4 FASES EXPLICATIVAS */}
          <div className="space-y-12 mb-16 font-sans">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">📝</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">1. Celebração do contrato</h3>
                <p className="text-slate-600 text-justify leading-relaxed">Celebração do contrato de parceria com a HelloCamp. Este contrato regula a divulgação e a intermediação das suas ofertas através da plataforma HelloCamp, estabelecendo os termos da colaboração entre ambas as partes. O acordo mantém-se válido até ao final do ano civil em curso, sendo automaticamente renovado por períodos sucessivos, salvo denúncia por qualquer uma das partes nos termos previstos contratualmente.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">🏖️</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">2. Divulgação das ofertas</h3>
                <p className="text-slate-600 text-justify leading-relaxed">Após a celebração do contrato, a HelloCamp procede à recolha e organização das informações relativas às atividades disponibilizadas pelo parceiro, criando e publicando as respetivas páginas de oferta na plataforma. Paralelamente, promove os programas através dos seus canais digitais e poderá solicitar informações adicionais sempre que tal se revele necessário para garantir a qualidade e atualização dos conteúdos.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">💻</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">3. Reservas através da HelloCamp</h3>
                <p className="text-slate-600 text-justify leading-relaxed">As reservas das atividades poderão ser efetuadas diretamente através da plataforma HelloCamp. Sempre que uma reserva seja realizada, a HelloCamp comunicará ao parceiro os dados do cliente e os detalhes da reserva. O parceiro compromete-se a manter permanentemente atualizadas a disponibilidade das atividades e os preços praticados.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 bg-slate-900 text-white border border-slate-700 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">€</div>
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 mb-2">4. Pagamento da Comissão</h3>
                <p className="text-slate-600 text-justify leading-relaxed">A HelloCamp cobra uma comissão sobre cada reserva concluída através da plataforma. O modelo de pagamento poderá assumir diferentes formas (reserva direta, e-mail ou reencaminhamento externo). As condições específicas aplicáveis serão definidas de acordo com as escolhas nos Anexos Operacionais abaixo.</p>
              </div>
            </div>
          </div>

          <div className="h-0.5 bg-black w-full my-16"></div>

          <div className="space-y-6 text-[15px] text-justify">
            <h2 className="text-2xl font-bold text-center uppercase tracking-widest mb-10">Contrato Global de Intermediação</h2>

            <p className="mb-4">Entre:</p>
            <div className="ml-8 mb-8 space-y-1">
              <p><strong>HelloCamp</strong></p>
              <p>Website: www.hellocamp.pt</p>
              <p>E-mail: info@hellocamp.pt</p>
            </div>

            <p className="mb-4">E</p>
            
            {/* DADOS DE FATURAÇÃO DO PARCEIRO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 ml-8 mb-8 bg-gray-50 p-6 border border-gray-300 font-sans text-sm shadow-inner rounded-lg">
              <div className="flex flex-col md:col-span-2">
                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Nome da Empresa (Faturação / Entidade Organizadora) *</label>
                <input required type="text" className={inputClassCustom} value={form.nomeEmpresa} onChange={e => setForm({...form, nomeEmpresa: e.target.value})} placeholder="Designação legal da empresa" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">NIF *</label>
                <input required type="text" className={inputClassCustom} value={form.nifEmpresa} onChange={e => setForm({...form, nifEmpresa: e.target.value})} placeholder="Ex: 500 000 000" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Pessoa de Contacto *</label>
                <input required type="text" className={inputClass} value={form.pessoaContacto} onChange={e => setForm({...form, pessoaContacto: e.target.value})} placeholder="Nome completo" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Forma Jurídica *</label>
                <input required type="text" className={inputClass} value={form.formaJuridica} onChange={e => setForm({...form, formaJuridica: e.target.value})} placeholder="Ex: Lda, Unipessoal, Associação" />
              </div>
              <div className="flex flex-col md:col-span-2">
                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Morada Sede Fiscal *</label>
                <input required type="text" className={inputClass} value={form.morada} onChange={e => setForm({...form, morada: e.target.value})} placeholder="Rua, número, andar" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Código Postal e Cidade *</label>
                <input required type="text" className={inputClass} value={form.codigoPostal} onChange={e => setForm({...form, codigoPostal: e.target.value})} placeholder="0000-000 Localidade" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Número de Telefone *</label>
                <input required type="text" className={inputClass} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">E-mail de Contacto Geral *</label>
                <input required type="email" className={inputClass} value={form.emailContacto} onChange={e => setForm({...form, emailContacto: e.target.value})} />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">E-mail Exclusivo p/ Reservas *</label>
                <input required type="email" className={inputClass} value={form.emailReservas} onChange={e => setForm({...form, emailReservas: e.target.value})} />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Website</label>
                <input type="text" className={inputClass} value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="Opcional" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Responsável de Dados (RGPD) *</label>
                <input required type="text" className={inputClass} value={form.responsavelRGPD} onChange={e => setForm({...form, responsavelRGPD: e.target.value})} placeholder="Nome do responsável pela gestão de dados" />
              </div>
            </div>
            
            <p className="italic text-center mt-6 mb-8">- doravante designado por "Parceiro" -</p>
            
            <div className="text-center p-6 border-y-2 border-slate-200 bg-slate-50">
               <p className="font-bold text-lg mb-2">É celebrado o presente contrato de intermediação e divulgação comercial aplicável a:</p>
               <span className="block text-xl md:text-2xl font-black text-emerald-800 uppercase tracking-widest mt-4">
                  Todas as atividades organizadas por {form.nomeEmpresa || "..."}
               </span>
               <span className="block text-sm text-gray-500 mt-2 font-sans font-medium">
                  Este contrato abrange todos os {totalCampos > 0 ? `${totalCampos} campo(s)` : 'campos'} de férias atuais e quaisquer futuros programas criados pelo parceiro na plataforma HelloCamp.
               </span>
            </div>

          </div>

          <div className="space-y-6 text-[15px] text-justify pt-12">
            <h3 className="font-bold text-xl uppercase tracking-widest border-b border-black pb-2 mb-8">Cláusulas Contratuais</h3>
            
            <h4 className="font-bold">Artigo 1.º – Comissão</h4>
            <p className="mb-4">O Parceiro compromete-se a pagar à HelloCamp a comissão (IVA incluído) acordada individualmente com a equipa HelloCamp sobre cada reserva efetuada através da plataforma, nos termos definidos no presente contrato ou em acordo complementar celebrado entre as partes.</p>
            <p className="mb-4">A comissão é calculada sobre o valor efetivamente pago pelo cliente relativamente à atividade reservada, incluindo serviços adicionais contratados através da plataforma ou de leads encaminhadas.</p>
            <p className="mb-4">A comissão torna-se devida após a confirmação da reserva pelo Parceiro e a transmissão dos respetivos dados de reserva.</p>
            <p className="mb-4">Caso uma reserva não possa ser realizada por motivos devidamente justificados, nomeadamente indisponibilidade da atividade ou não verificação das condições mínimas de realização, o Parceiro deverá informar a HelloCamp com a maior brevidade possível.</p>
            <p className="mb-8">Em caso de cancelamento por iniciativa do cliente, aplicar-se-ão as condições previstas no Anexo 3 – Cancelamento de Reservas.</p>

            <h4 className="font-bold">Artigo 2.º – Condições de Pagamento e Faturação</h4>
            <p className="mb-8">As comissões devidas à HelloCamp serão faturadas de acordo com o modelo de pagamento acordado entre as partes. O Parceiro compromete-se a liquidar as faturas emitidas pela HelloCamp dentro dos prazos nelas indicados. Os valores acordados incluem IVA ou outros impostos legalmente aplicáveis.</p>

            <h4 className="font-bold">Artigo 3.º – Obrigações do Parceiro</h4>
            <p className="mb-4">O Parceiro compromete-se a fornecer à HelloCamp todas as informações necessárias à divulgação das suas atividades, incluindo descrições, preços, disponibilidade, fotografias e demais conteúdos relevantes.</p>
            <p className="mb-4">O Parceiro garante que possui todos os direitos necessários sobre os conteúdos disponibilizados à HelloCamp, incluindo direitos de autor, direitos de imagem e demais autorizações legalmente exigidas.</p>
            <p className="mb-4">Os preços divulgados na plataforma HelloCamp não poderão ser superiores aos preços praticados pelo Parceiro para reservas diretas da mesma atividade.</p>
            <p className="mb-4">O Parceiro compromete-se a informar imediatamente a HelloCamp de quaisquer alterações relativas às suas atividades, incluindo preços, disponibilidade e programas.</p>
            <p className="mb-8">O Parceiro deverá comunicar à HelloCamp quaisquer alterações aos seus termos e condições gerais ou às condições aplicáveis às atividades disponibilizadas na plataforma.</p>

            <h4 className="font-bold">Artigo 4.º – Duração e Renovação</h4>
            <p className="mb-8">O presente contrato produz efeitos a partir da data da sua assinatura por ambas as partes. O contrato mantém-se válido até ao final do respetivo ano civil. O contrato será automaticamente renovado por períodos sucessivos de um ano, salvo denúncia por qualquer das partes.</p>

            <h4 className="font-bold">Artigo 5.º – Limitação de Responsabilidade e Seguros</h4>
            <p className="mb-4">A HelloCamp atua exclusivamente como plataforma intermediária e motor de busca. A HelloCamp não assume qualquer responsabilidade civil, criminal ou contratual por eventuais acidentes, danos, incidentes ou disputas que ocorram durante a realização das atividades.</p>
            <p className="mb-8">O Parceiro é o único e exclusivo responsável pela prestação dos serviços e pela segurança dos participantes, garantindo que possui todos os seguros obrigatórios por lei, licenças e certificações exigidas para o exercício da sua atividade.</p>

            <h4 className="font-bold">Artigo 6.º – Acordos Complementares</h4>
            <p className="mb-8">Quaisquer alterações ao presente contrato ou acordos complementares celebrados entre a HelloCamp e o Parceiro deverão ser efetuados por escrito, no anexo 4, para produzirem efeitos.</p>

            <h4 className="font-bold text-[#EBA914]">Artigo 7.º – Validade da Assinatura e Convenção de Prova</h4>
            <p className="mb-4 text-[#EBA914]">As partes reconhecem expressamente a validade e a força vinculativa da aceitação do presente contrato através de meios eletrónicos (designadamente a aposição do nome do representante legal e seleção da caixa de aceitação no portal web da HelloCamp).</p>
            <p className="mb-8 text-[#EBA914]">Ao abrigo da liberdade de estipulação probatória, as partes convencionam que os registos informáticos recolhidos pela HelloCamp (incluindo o endereço IP, dados de sessão, nome digitado e timestamp) constituem meio de prova plenamente válido e suficiente para atestar a autoria, a integridade e a aceitação irrevogável das presentes cláusulas operacionais e financeiras, renunciando o Parceiro a invocar a nulidade ou ineficácia do contrato com fundamento na ausência de assinatura autógrafa ou de assinatura eletrónica qualificada (Chave Móvel Digital / Cartão de Cidadão).</p>
          </div>

          <div className="h-px bg-gray-300 w-full my-12"></div>

          {/* ANEXOS E OPÇÕES DE OPERAÇÃO */}
          <div className="space-y-12 font-sans text-sm text-slate-800">
            
            {/* ANEXO 1 - PROCEDIMENTO DE RESERVA */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="font-black text-lg mb-4 text-black uppercase border-l-4 border-[#EBA914] pl-3">Anexo 1 – Procedimento de Reserva</h3>
              <p className="mb-6">Selecione a modalidade de gestão de reservas aplicável à sua parceria global com a HelloCamp.</p>
              
              <div className="space-y-3">
                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.modalidadeReserva === 'direta' ? 'bg-white border-black shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                  <input type="radio" name="anexo1" required value="direta" checked={form.modalidadeReserva === 'direta'} onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-black" />
                  <div>
                    <strong className="block text-black mb-1">Reserva Direta no Checkout (Recomendado)</strong>
                    <span className="text-gray-600 leading-relaxed block">As reservas efetuadas através da plataforma HelloCamp serão registadas diretamente no sistema de reservas do Parceiro. Nesta modalidade, a HelloCamp terá direito à comissão acordada sobre cada reserva concluída. O formulário de reserva será configurado de acordo com as necessidades do Parceiro, recolhendo as informações necessárias para a correta gestão das inscrições.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.modalidadeReserva === 'email' ? 'bg-white border-black shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                  <input type="radio" name="anexo1" required value="email" checked={form.modalidadeReserva === 'email'} onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-black" />
                  <div>
                    <strong className="block text-black mb-1">Comunicação por E-mail (Reserva Sob Consulta)</strong>
                    <span className="text-gray-600 leading-relaxed block">A HelloCamp enviará ao Parceiro, por correio eletrónico, todas as informações necessárias para a gestão da reserva, incluindo os dados do participante, os dados do responsável pela reserva e os detalhes da atividade reservada. O Parceiro dispõe de 2 dias úteis para comunicar à HelloCamp a rejeição. Na ausência de resposta, a reserva considerar-se-á aceite.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.modalidadeReserva === 'link_externo' ? 'bg-white border-black shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                  <input type="radio" name="anexo1" required value="link_externo" checked={form.modalidadeReserva === 'link_externo'} onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-black flex-shrink-0" />
                  <div className="w-full">
                    <strong className="block text-black mb-1">Formulário ou Link Externo (ex: Google Forms)</strong>
                    <span className="text-gray-600 leading-relaxed block mb-4">O tráfego gerado pela HelloCamp é redirecionado para um link externo. Para garantir transparência, antes de reencaminhar o cliente, a HelloCamp recolhe a intenção de reserva (Lead: Nome e Email). Estes dados são enviados automaticamente para o Parceiro. O Parceiro compromete-se sob compromisso de honra a ser verdadeiro na comunicação mensal sobre quais destes clientes efetivamente finalizaram a inscrição e faturação do seu lado.</span>
                    
                    {form.modalidadeReserva === 'link_externo' && (
                      <div className="bg-gray-50 border border-gray-300 p-4 rounded-lg mt-2 w-full">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                          Insira o Link Externo (URL) Principal *
                        </label>
                        <input 
                          type="url" 
                          required 
                          placeholder="https://forms.gle/..." 
                          className="w-full border border-gray-300 rounded p-3 text-sm font-bold outline-none focus:border-black"
                          value={form.linkExternoReserva}
                          onChange={e => setForm({...form, linkExternoReserva: e.target.value})}
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* ANEXOS 2 E 3 CONDICIONAIS */}
            {form.modalidadeReserva !== 'link_externo' && (
              <>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="font-black text-lg mb-4 text-blue-950 uppercase border-l-4 border-blue-600 pl-3">Anexo 2 – Pagamento e comissão</h3>
                  <p className="mb-4 text-justify leading-relaxed text-blue-900">
                    O Parceiro autoriza a HelloCamp a receber um depósito durante o processo de reserva efetuado através da plataforma segura Stripe. O valor do depósito corresponde, regra geral, à comissão devida à HelloCamp pela reserva efetuada. O valor remanescente é pago diretamente ao Parceiro.
                  </p>
                  
                  <div className="space-y-3 mt-6">
                    <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.tipo_pagamento === '100_total' ? 'bg-white border-blue-600 shadow-sm' : 'border-transparent hover:bg-blue-100/50'}`}>
                      <input type="radio" name="anexo2" required value="100_total" checked={form.tipo_pagamento === '100_total'} onChange={e => setForm({...form, tipo_pagamento: e.target.value})} className="mt-1 w-4 h-4 accent-blue-600" />
                      <div>
                        <strong className="block text-blue-950 mb-1">100% Pago no Ato da Reserva (Pagamento Imediato)</strong>
                        <span className="text-blue-800 leading-relaxed block">O cliente liquida a totalidade do valor do programa para assegurar a vaga.</span>
                      </div>
                    </label>

                    <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.tipo_pagamento === '50_sinal' ? 'bg-white border-blue-600 shadow-sm' : 'border-transparent hover:bg-blue-100/50'}`}>
                      <input type="radio" name="anexo2" required value="50_sinal" checked={form.tipo_pagamento === '50_sinal'} onChange={e => setForm({...form, tipo_pagamento: e.target.value})} className="mt-1 w-4 h-4 accent-blue-600" />
                      <div>
                        <strong className="block text-blue-950 mb-1">Sinal de 50% Agora + 50% 1 Semana Antes</strong>
                        <span className="text-blue-800 leading-relaxed block">A plataforma debitará automaticamente a segunda metade do cartão do cliente 7 dias antes do início do programa.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                  <h3 className="font-black text-lg mb-4 text-amber-950 uppercase border-l-4 border-amber-500 pl-3">Anexo 3 – Política de Cancelamento e Reembolso</h3>
                  <p className="mb-6 text-amber-900 leading-relaxed">
                    A comissão devida à HelloCamp será sempre ajustada proporcionalmente ao montante que o Parceiro retiver do cliente em caso de desistência.
                  </p>
                  
                  <div className="space-y-3">
                    <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.politica_cancelamento === 'Flexível (Reembolso a 100% até 7 dias antes)' ? 'bg-white border-amber-500 shadow-sm' : 'border-transparent hover:bg-amber-100/50'}`}>
                      <input type="radio" name="anexo3" required value="Flexível (Reembolso a 100% até 7 dias antes)" checked={form.politica_cancelamento === 'Flexível (Reembolso a 100% até 7 dias antes)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                      <div>
                        <strong className="block text-amber-950 mb-1">Flexível (Reembolso a 100% até 7 dias antes)</strong>
                        <span className="text-amber-800 leading-relaxed block text-sm">
                          A HelloCamp não cobrará qualquer comissão sobre reservas canceladas pelo cliente. O Parceiro compromete-se a não aplicar quaisquer custos, desde que comunicado atempadamente.
                        </span>
                      </div>
                    </label>

                    <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.politica_cancelamento === 'Moderada (Reembolso a 50% até 15 dias antes)' ? 'bg-white border-amber-500 shadow-sm' : 'border-transparent hover:bg-amber-100/50'}`}>
                      <input type="radio" name="anexo3" required value="Moderada (Reembolso a 50% até 15 dias antes)" checked={form.politica_cancelamento === 'Moderada (Reembolso a 50% até 15 dias antes)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                      <div>
                        <strong className="block text-amber-950 mb-1">Moderada (Reembolso a 50% até 15 dias antes)</strong>
                        <span className="text-amber-800 leading-relaxed block text-sm">
                          Em caso de cancelamento até 15 dias antes, o cliente recebe 50% do valor. A comissão da HelloCamp será reduzida proporcionalmente.
                        </span>
                      </div>
                    </label>

                    <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg border transition-colors ${form.politica_cancelamento === 'Estrita (Sem reembolso após reserva)' ? 'bg-white border-amber-500 shadow-sm' : 'border-transparent hover:bg-amber-100/50'}`}>
                      <input type="radio" name="anexo3" required value="Estrita (Sem reembolso após reserva)" checked={form.politica_cancelamento === 'Estrita (Sem reembolso após reserva)'} onChange={e => setForm({...form, politica_cancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                      <div>
                        <strong className="block text-amber-950 mb-1">Estrita (Sem reembolso após reserva)</strong>
                        <span className="text-amber-800 leading-relaxed block text-sm">
                          As reservas efetuadas são finais e não reembolsáveis. A comissão da HelloCamp é devida na sua totalidade.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* ANEXO 4 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="font-black text-lg mb-4 text-black uppercase border-l-4 border-gray-400 pl-3">Anexo 4 – Acordos Extraordinários</h3>
              <p className="mb-3 text-gray-700 font-medium">Acordámos as seguintes alterações ao contrato-modelo:</p>
              <textarea 
                className="w-full border border-gray-300 p-4 rounded-lg bg-gray-50 outline-none focus:border-black transition-all" 
                rows={3} 
                value={form.acordosComplementares} 
                onChange={e => setForm({...form, acordosComplementares: e.target.value})}
                placeholder="Insira as cláusulas de exceção pré-acordadas, ou deixe em branco."
              ></textarea>
            </div>

          </div>

          {/* ZONA DE ASSINATURAS FINAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-16 pt-12 border-t-2 border-black font-sans">
            <div>
              <h4 className="font-black mb-6 uppercase tracking-wider text-black text-sm">Pela HelloCamp</h4>
              <p className="font-serif text-xl italic text-gray-500 mb-2">Administração HelloCamp</p>
              <p className="text-sm font-medium border-t border-gray-200 mt-6 pt-4">Data: {dataAtual}</p>
            </div>

            <div>
              <h4 className="font-black mb-6 uppercase tracking-wider text-black text-sm">Pelo Parceiro</h4>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase mb-1 text-gray-500">Escreva o seu Nome *</label>
                  <input required type="text" className="border-b-2 border-black bg-transparent outline-none py-2 text-xl font-serif italic focus:border-[#EBA914] transition-colors" value={form.assinaturaNome} onChange={e => setForm({...form, assinaturaNome: e.target.value})} placeholder="Nome de quem assina" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase mb-1 text-gray-500">Cargo *</label>
                  <input required type="text" className="border-b border-gray-300 bg-transparent outline-none py-2 focus:border-black transition-colors" value={form.assinaturaCargo} onChange={e => setForm({...form, assinaturaCargo: e.target.value})} placeholder="Ex: Sócio-Gerente" />
                </div>
                <p className="text-sm font-medium border-t border-gray-200 mt-6 pt-4">Data: {dataAtual}</p>
              </div>

              <div className="mt-8 bg-gray-50 p-4 border border-gray-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" required checked={form.concordaTermos} onChange={e => setForm({...form, concordaTermos: e.target.checked})} className="mt-1 w-5 h-5 accent-black cursor-pointer flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium leading-relaxed group-hover:text-black transition-colors">
                    Declaro ter lido e aceite os termos do contrato global e a convenção de prova do Artigo 7.º. Confirmo possuir poderes legais para vincular a entidade supra identificada através desta assinatura digital, abrangendo todas as atividades presentes e futuras na plataforma.
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-10 mt-12 border-t border-gray-300 flex justify-end font-sans">
            <button 
              type="submit" 
              disabled={submitting || !form.concordaTermos || !form.assinaturaNome || !form.assinaturaCargo} 
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-black px-6 sm:px-12 py-4 sm:py-5 rounded-xl shadow-lg transition-transform hover:-translate-y-1 cursor-pointer w-full text-base sm:text-lg border border-emerald-400"
            >
              {submitting ? 'A Submeter Contrato Global...' : 'Assinar Digitalmente e Concluir'}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}
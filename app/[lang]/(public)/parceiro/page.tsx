"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ParceiroLandingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [empresaNome, setEmpresaNome] = useState("");
  const [nif, setNif] = useState("");
  const [nomeContacto, setNomeContacto] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [website, setWebsite] = useState("");
  const [tipoParceria, setTipoParceria] = useState("concierge_total");
  const [detalhesCampos, setDetalhesCampos] = useState("");
  const [ficheiros, setFicheiros] = useState<FileList | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmeterConcierge = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro("");

    try {
      const urlsDocumentos: string[] = [];

      if (ficheiros && ficheiros.length > 0) {
        for (let i = 0; i < ficheiros.length; i++) {
          const file = ficheiros[i];
          const ext = file.name.split(".").pop();
          const fileName = `onboarding_${Date.now()}_${i}.${ext}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("documentos-parceiros")
            .upload(fileName, file);

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from("documentos-parceiros")
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              urlsDocumentos.push(publicUrlData.publicUrl);
            }
          }
        }
      }

      await fetch("/api/notificar-reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "onboarding_parceiro",
          parceiroEmail: "info@hellocamp.pt",
          campoNome: ` Adesão Parceiro: ${empresaNome}`,
          lang,
          lead: {
            nome: nomeContacto,
            email: email,
            telefone: telefone,
            empresa: empresaNome,
            nif: nif,
            website: website,
            modalidade: tipoParceria,
            mensagem: detalhesCampos,
            documentos: urlsDocumentos,
          },
        }),
      });

      setSucesso(true);
    } catch (err) {
      console.error(err);
      setErro(
        isEn
          ? "An error occurred while sending. Please try again or email info@hellocamp.pt."
          : "Ocorreu um erro ao enviar os dados. Tente novamente ou envie diretamente para info@hellocamp.pt."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      {/* 1. HERO VIBRANTE COM AS NOVAS CORES E FORMAS MODULARES */}
      <section className="relative overflow-hidden bg-[#2563EB] text-white pt-20 pb-28 md:pt-28 md:pb-36 px-4 md:px-8 border-b-8 border-[#F59E0B]">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#F59E0B] opacity-90 pointer-events-none hidden lg:block" />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 rounded-full bg-[#16A34A] opacity-90 pointer-events-none hidden lg:block" />
        <div className="absolute top-1/3 left-10 w-20 h-20 rounded-2xl bg-[#F43F5E] rotate-12 opacity-90 pointer-events-none hidden xl:block" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/30 rounded-md text-xs font-black uppercase tracking-widest text-white mb-8 backdrop-blur-md shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            {isEn ? "HelloCamp B2B Partner Network" : "Ecossistema de Parceiros HelloCamp"}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.08] text-white">
            {isEn
              ? "More bookings. Zero hassle. We set up everything for you."
              : "Mais inscrições. Zero trabalho. Nós criamos o perfil por si."}
          </h1>

          <p className="text-lg md:text-2xl text-blue-100 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
            {isEn
              ? "Promote your holiday camps to thousands of families in Portugal and Europe. Create your account yourself or send us your brochures and our team will build your entire store for free."
              : "Promova os seus campos de férias junto de milhares de famílias. Crie a sua conta autonomamente ou envie-nos os seus folhetos/PDFs abaixo e a nossa equipa configura toda a sua página gratuitamente."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#formulario-concierge"
              className="w-full sm:w-auto bg-[#F59E0B] hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs md:text-sm px-9 py-5 rounded-md shadow-xl transition-all hover:-translate-y-1 no-underline"
            >
              {isEn
                ? "Send Info & We Build It For You ↓"
                : "Enviar Documentos (Nós Criamos Por Si) ↓"}
            </a>
            <Link
              href={`/${lang}/registo`}
              className="w-full sm:w-auto bg-[#16A34A] hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs md:text-sm px-9 py-5 rounded-md shadow-xl transition-all hover:-translate-y-1 no-underline"
            >
              {isEn ? "Create Partner Account Myself" : "Criar Conta Autónoma"}
            </Link>
            <Link
              href={`/${lang}/login`}
              className="w-full sm:w-auto bg-[#0F172A] hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs md:text-sm px-8 py-5 rounded-md shadow-lg transition-all hover:-translate-y-1 no-underline"
            >
              {isEn ? "Partner Login" : "Entrar no Portal"}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. COMO FUNCIONA (2 OPÇÕES CLARAS PARA O PARCEIRO) */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 -mt-12 relative z-20 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 md:p-10 rounded-md border-t-8 border-t-[#F59E0B] border-x border-b border-slate-200 shadow-xl flex flex-col justify-between">
            <div>
              <span className="inline-block bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md mb-4">
                {isEn ? "Option 1 • Concierge Service (Most Popular)" : "Opção 1 • Serviço Chave-na-Mão (Mais Popular)"}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-[#0F172A] mb-3">
                {isEn
                  ? "No time? Send us your files and we do the rest."
                  : "Sem tempo? Envie-nos os documentos e nós tratamos de tudo."}
              </h2>
              <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed mb-6">
                {isEn
                  ? "Fill out the form below with your organization's details, attach your camp PDFs, price tables, or Word files, and our team will create your profile, upload photos, and configure all dates and packages."
                  : "Preencha o formulário rápido abaixo ou envie e-mail para info@hellocamp.pt com os seus folhetos PDF, preçários, fotografias e logótipo. A equipa da HelloCamp cria a sua página pública e configura todos os turnos e preços por si!"}
              </p>
            </div>
            <a
              href="#formulario-concierge"
              className="inline-flex items-center justify-center bg-[#F59E0B] hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs px-6 py-4 rounded-md no-underline transition-colors shadow-sm"
            >
              {isEn ? "Fill Quick Onboarding Form ↓" : "Preencher Formulário de Envio ↓"}
            </a>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-md border-t-8 border-t-[#16A34A] border-x border-b border-slate-200 shadow-xl flex flex-col justify-between">
            <div>
              <span className="inline-block bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md mb-4">
                {isEn ? "Option 2 • Self-Service Portal" : "Opção 2 • Gestão 100% Autónoma"}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-[#0F172A] mb-3">
                {isEn
                  ? "Full control in your Partner Dashboard."
                  : "Controlo total no seu Portal de Parceiro."}
              </h2>
              <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed mb-6">
                {isEn
                  ? "Register your account in 1 minute, access the B2B Dashboard, customize your brand showcase, publish camps, manage medical records, and recruit certified monitors from our Talent Pool."
                  : "Crie a sua conta em 1 minuto, aceda ao Portal B2B, personalize a sua montra com logótipo, publique campos a qualquer hora, exporte listas médicas em Excel e recrute monitores na nossa Bolsa de Talentos."}
              </p>
            </div>
            <Link
              href={`/${lang}/registo`}
              className="inline-flex items-center justify-center bg-[#16A34A] hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs px-6 py-4 rounded-md no-underline transition-colors shadow-sm"
            >
              {isEn ? "Create Partner Account →" : "Criar Conta de Parceiro Grátis →"}
            </Link>
          </div>
        </div>
      </section>

      {/* 3. BENEFÍCIOS DO ECOSSISTEMA B2B */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-20">
        <div className="text-center mb-14">
          <span className="text-xs font-black text-[#2563EB] uppercase tracking-widest block mb-2">
            {isEn ? "Why HelloCamp?" : "Vantagens Exclusivas"}
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#0F172A]">
            {isEn ? "Everything your camp needs to grow" : "Tudo o que o seu campo precisa para crescer"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-7 rounded-md border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-[#16A34A] text-white rounded-md flex items-center justify-center text-xl font-black mb-5">
              €0
            </div>
            <h3 className="text-lg font-black text-[#0F172A] mb-2">
              {isEn ? "Zero Fixed Costs" : "Zero Custos Fixos"}
            </h3>
            <p className="text-slate-600 text-sm font-medium leading-relaxed m-0">
              {isEn
                ? "No setup fees or monthly subscriptions. You only pay a commission on confirmed bookings or choose external redirection."
                : "Sem taxas de adesão nem mensalidades. Só existe comissão sobre reservas confirmadas ou modelo de redirecionamento externo."}
            </p>
          </div>

          <div className="bg-white p-7 rounded-md border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-[#2563EB] text-white rounded-md flex items-center justify-center text-xl font-black mb-5">
              🏢
            </div>
            <h3 className="text-lg font-black text-[#0F172A] mb-2">
              {isEn ? "Official Brand Showcase" : "Montra Oficial da Marca"}
            </h3>
            <p className="text-slate-600 text-sm font-medium leading-relaxed m-0">
              {isEn
                ? "Dedicated page with your logo, history, official website link, direct contacts, and verified badge."
                : "Página dedicada com o seu logótipo, história, link para o seu website oficial, contactos e selo de parceiro verificado."}
            </p>
          </div>

          <div className="bg-white p-7 rounded-md border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-[#F59E0B] text-white rounded-md flex items-center justify-center text-xl font-black mb-5">
              📋
            </div>
            <h3 className="text-lg font-black text-[#0F172A] mb-2">
              {isEn ? "Medical & Logistics CRM" : "Gestão Clínica e Logística"}
            </h3>
            <p className="text-slate-600 text-sm font-medium leading-relaxed m-0">
              {isEn
                ? "Automatic collection of allergies, chronic conditions, and emergency contacts, ready to export to Excel."
                : "Recolha automática de alergias, restrições alimentares, doenças e contactos de emergência, prontos a exportar em Excel."}
            </p>
          </div>

          <div className="bg-white p-7 rounded-md border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-[#F43F5E] text-white rounded-md flex items-center justify-center text-xl font-black mb-5">
              🎓
            </div>
            <h3 className="text-lg font-black text-[#0F172A] mb-2">
              {isEn ? "Monitors Talent Pool" : "Bolsa de Monitores"}
            </h3>
            <p className="text-slate-600 text-sm font-medium leading-relaxed m-0">
              {isEn
                ? "Free access to our database of monitors filtered by district, availability, and IPDJ/First Aid certificates."
                : "Acesso direto à nossa base de dados de monitores filtrados por distrito, datas disponíveis e certificado IPDJ/Socorrismo."}
            </p>
          </div>
        </div>
      </section>

      {/* 4. FORMULÁRIO COMPLETO DE SUBMISSÃO DE INFORMAÇÃO E DOCUMENTOS ("NÓS CRIAMOS POR SI") */}
      <section id="formulario-concierge" className="max-w-4xl mx-auto px-4 md:px-8 scroll-mt-24">
        <div className="bg-white rounded-md border-2 border-[#2563EB] shadow-2xl overflow-hidden">
          <div className="bg-[#2563EB] text-white p-8 md:p-10">
            <span className="inline-block bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-3">
              {isEn ? "Concierge Onboarding" : "Submissão Direta de Dados e Documentos"}
            </span>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight m-0 mb-2">
              {isEn
                ? "Send us your camp details — we set up everything for you!"
                : "Envie-nos os dados e documentos — nós preenchemos tudo por si!"}
            </h2>
            <p className="text-blue-100 text-sm md:text-base font-medium m-0">
              {isEn
                ? "Fill in the fields below and attach your brochures, PDFs, Word documents, or logos. Prefer email? Send directly to "
                : "Deixe aqui a informação da sua organização e anexe os seus folhetos PDF, tabelas de preços ou logótipo. Se preferir, também pode enviar diretamente por e-mail para "}
              <a href="mailto:info@hellocamp.pt" className="text-white font-black underline">
                info@hellocamp.pt
              </a>
              .
            </p>
          </div>

          <div className="p-8 md:p-10">
            {sucesso ? (
              <div className="bg-emerald-50 border-2 border-[#16A34A] rounded-md p-8 text-center">
                <div className="w-16 h-16 bg-[#16A34A] text-white rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-4">
                  ✓
                </div>
                <h3 className="text-2xl font-black text-[#0F172A] mb-2">
                  {isEn
                    ? "Information received successfully!"
                    : "Informação e documentos recebidos com sucesso!"}
                </h3>
                <p className="text-slate-600 font-medium text-sm md:text-base mb-6 max-w-xl mx-auto">
                  {isEn
                    ? "Our team is already setting up your partner profile and camp pages. We will send you your access credentials and preview link within 24 hours."
                    : "A nossa equipa já recebeu os seus dados e vai configurar o seu perfil de parceiro e os seus campos de férias. Entraremos em contacto consigo em menos de 24 horas com o link de pré-visualização e acessos!"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSucesso(false);
                    setDetalhesCampos("");
                    setFicheiros(null);
                  }}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-md border-0 cursor-pointer"
                >
                  {isEn ? "Send Another Document" : "Enviar Mais Informações"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmeterConcierge} className="space-y-6">
                {erro && (
                  <div className="p-4 bg-rose-50 border border-[#F43F5E] text-[#F43F5E] rounded-md text-xs font-bold">
                    {erro}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-600 mb-2">
                      {isEn ? "Organization / Brand Name *" : "Nome da Entidade / Marca *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={empresaNome}
                      onChange={(e) => setEmpresaNome(e.target.value)}
                      placeholder="Ex: Surf Camp Portugal"
                      className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-600 mb-2">
                      {isEn ? "Tax ID (NIF - Optional)" : "NIF da Entidade (Opcional)"}
                    </label>
                    <input
                      type="text"
                      value={nif}
                      onChange={(e) => setNif(e.target.value)}
                      placeholder="Ex: 510 000 000"
                      className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-600 mb-2">
                      {isEn ? "Contact Person *" : "Nome do Responsável *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={nomeContacto}
                      onChange={(e) => setNomeContacto(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-600 mb-2">
                      {isEn ? "Email Address *" : "E-mail Oficial *"}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="geral@oseucampo.pt"
                      className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-600 mb-2">
                      {isEn ? "Phone / WhatsApp *" : "Telemóvel / WhatsApp *"}
                    </label>
                    <input
                      type="tel"
                      required
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="+351 910 000 000"
                      className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-600 mb-2">
                      {isEn ? "Website or Instagram Link" : "Website ou Link do Instagram"}
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.oseucampo.pt"
                      className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-600 mb-2">
                    {isEn ? "How do you want to work with us?" : "Como prefere gerir as suas reservas?"}
                  </label>
                  <select
                    value={tipoParceria}
                    onChange={(e) => setTipoParceria(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] cursor-pointer"
                  >
                    <option value="concierge_total">
                      {isEn
                        ? "I want HelloCamp to build my profile and camps for me"
                        : "Quero que a HelloCamp crie o meu perfil e configure os campos por mim"}
                    </option>
                    <option value="reservas_diretas">
                      {isEn
                        ? "Direct Online Bookings on HelloCamp (Automatic Stripe Payouts)"
                        : "Reservas Diretas na HelloCamp (Pagamentos Automáticos)"}
                    </option>
                    <option value="leads_ou_link">
                      {isEn
                        ? "Receive Parent Leads by Email or Redirect to My Website"
                        : "Receber Contactos de Pais por E-mail ou Redirecionar para o Meu Site"}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-600 mb-2">
                    {isEn
                      ? "Camp Information, Dates, Prices, or Links (Paste anything here)"
                      : "Descrição da Entidade, Datas, Preços, Idades ou Notas (Pode colar todo o texto aqui)"}
                  </label>
                  <textarea
                    rows={5}
                    value={detalhesCampos}
                    onChange={(e) => setDetalhesCampos(e.target.value)}
                    placeholder={
                      isEn
                        ? "Paste your camp description, dates, age groups, prices, or links to Google Drive photos..."
                        : "Escreva ou cole aqui o resumo dos seus campos de férias (locais, idades, datas, preços, descontos de irmãos, links de fotos ou Google Drive)..."
                    }
                    className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md p-4 text-sm font-medium text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white leading-relaxed"
                  />
                </div>

                <div className="bg-amber-50/70 border-2 border-dashed border-[#F59E0B] rounded-md p-6">
                  <label className="block text-xs font-black uppercase tracking-widest text-[#0F172A] mb-2">
                    📎 {isEn ? "Attach Brochures, PDFs, Price Tables or Logo" : "Anexar Documentos (PDFs, Folhetos, Word, Excel ou Logótipo)"}
                  </label>
                  <p className="text-xs text-slate-600 font-medium mb-4">
                    {isEn
                      ? "Select one or multiple files from your computer so our team can extract all information."
                      : "Pode selecionar vários ficheiros (programa do campo, cartaz, regulamento ou logótipo) para a nossa equipa recolher toda a informação."}
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => setFicheiros(e.target.files)}
                    className="block w-full text-xs text-slate-700 font-bold file:mr-4 file:py-3 file:px-5 file:rounded-md file:border-0 file:text-xs file:font-black file:uppercase file:tracking-wider file:bg-[#F59E0B] file:text-white hover:file:bg-amber-600 cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-500">
                    🔒 {isEn ? "100% Free Setup • Reply within 24h" : "Configuração 100% Gratuita • Resposta em 24h"}
                  </span>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full sm:w-auto bg-[#16A34A] hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs px-10 py-5 rounded-md shadow-lg transition-all cursor-pointer border-0 disabled:opacity-50"
                  >
                    {enviando
                      ? isEn
                        ? "Uploading & Sending..."
                        : "A Enviar Dados e Documentos..."
                      : isEn
                      ? "Submit Information & Documents →"
                      : "Enviar Informação para a HelloCamp →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
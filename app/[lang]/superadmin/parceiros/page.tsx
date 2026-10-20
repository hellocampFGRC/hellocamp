"use client";

import React, { use } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ParceirosLandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 selection:bg-emerald-200">
      
      {/* ═══════════════════════════════════════════ */}
      {/* HERO SECTION B2B - VERDE CORPORATIVO        */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-28 pb-36 md:pt-40 md:pb-48 px-4 md:px-8 bg-[#167524] bg-gradient-to-br from-[#167524] via-[#10561a] to-[#06280b]">
        {/* Efeitos de Luz no Fundo */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-[#e2a41d]/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest text-emerald-100 mb-8 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#e2a41d] animate-pulse"></span>
            {isEn ? "HelloCamp for Organizers" : "Portal B2B de Organizadores"}
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1] text-white">
            {isEn ? "Fill your camps with families from all over Europe." : "Encha os seus programas com famílias de toda a Europa."}
          </h1>
          
          <p className="text-lg md:text-xl text-emerald-100/90 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
            {isEn 
              ? "Join the ultimate search engine and booking management platform for summer camps, language schools, and youth sports clinics. Zero setup fees." 
              : "Junte-se ao maior motor de busca e plataforma de gestão de reservas para campos de férias, escolas de línguas e academias desportivas. Sem custos de adesão."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href={`/${lang}/admin/registo`}
              className="w-full sm:w-auto bg-[#e2a41d] hover:bg-[#d4991b] text-[#06280b] font-black uppercase tracking-widest text-sm px-10 py-5 rounded-xl shadow-[0_0_40px_-10px_rgba(226,164,29,0.5)] transition-all hover:-translate-y-1 no-underline border border-[#e2a41d]"
            >
              {isEn ? "Create Partner Account" : "Registar Entidade Grátis"}
            </Link>
            <Link 
              href={`/${lang}/admin/login`}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm px-10 py-5 rounded-xl transition-all backdrop-blur-md no-underline hover:-translate-y-1"
            >
              {isEn ? "Access Dashboard" : "Entrar no Dashboard"}
            </Link>
          </div>
          
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs md:text-sm font-bold text-emerald-200">
            <div className="flex items-center gap-2"><span className="text-[#e2a41d]">✓</span> {isEn ? "No setup fees" : "Sem custos fixos"}</div>
            <div className="flex items-center gap-2"><span className="text-[#e2a41d]">✓</span> {isEn ? "Full transparency" : "Transparência total"}</div>
            <div className="flex items-center gap-2"><span className="text-[#e2a41d]">✓</span> {isEn ? "Secure payments" : "Pagamentos Seguros"}</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* STATS SECTION                               */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 -mt-12 relative z-20 hidden md:block">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 grid grid-cols-3 gap-8 text-center divide-x divide-slate-100">
          <div>
            <div className="text-4xl font-black text-slate-900 mb-1">+50.000</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isEn ? 'Monthly Searches' : 'Pesquisas Mensais'}</div>
          </div>
          <div>
            <div className="text-4xl font-black text-slate-900 mb-1">5</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isEn ? 'Supported Languages' : 'Idiomas Suportados'}</div>
          </div>
          <div>
            <div className="text-4xl font-black text-[#167524] mb-1">€0</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isEn ? 'Registration Cost' : 'Custo de Adesão'}</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* BENEFÍCIOS E PROPOSTA DE VALOR              */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-32">
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
            {isEn ? "Why partner with HelloCamp?" : "Porquê ser um Parceiro HelloCamp?"}
          </h2>
          <p className="text-slate-500 font-medium text-base md:text-lg max-w-2xl mx-auto">
            {isEn 
              ? "We don't just list your camps. We provide the technology to manage bookings, medical files, and international payments." 
              : "Não somos apenas uma montra. Fornecemos a tecnologia para gerir inscrições, fichas médicas, pagamentos e apoio ao cliente de forma centralizada."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          
          <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-emerald-50 text-[#167524] rounded-2xl flex items-center justify-center text-3xl mb-8 border border-emerald-100 shadow-inner">🌍</div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{isEn ? "Free Global Visibility" : "Visibilidade Global Gratuita"}</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              {isEn 
                ? "List your organization and all your programs completely free of charge. Your website, phone number, and brand are always visible. We believe in total transparency, not hiding behind paywalls." 
                : "Registe a sua entidade e todos os seus programas sem qualquer custo de adesão ou avença mensal. O seu website, e-mail e marca estão sempre visíveis. Acreditamos na transparência e no acesso direto à sua organização."}
            </p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-blue-100 shadow-inner">💻</div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{isEn ? "Smart Admin Dashboard" : "Software de Gestão Inteligente"}</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              {isEn 
                ? "Say goodbye to endless email threads and Excel sheets. Our platform automatically collects health records, dietary restrictions, and emergency contacts into a single dashboard for every booking." 
                : "Diga adeus a dezenas de e-mails, folhas de Excel confusas e comprovativos de transferência perdidos. A plataforma centraliza o controlo de vagas, fichas médicas e alergias num dashboard unificado."}
            </p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-amber-50 text-[#e2a41d] rounded-2xl flex items-center justify-center text-3xl mb-8 border border-amber-100 shadow-inner">💳</div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{isEn ? "Frictionless Payments" : "Pagamentos e Faturação"}</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              {isEn 
                ? "Parents can pay securely via Credit Card, Debit, or local methods. The funds are routed directly to your connected Stripe account. You can offer 100% upfront or 50% deposit payment plans." 
                : "Os pais pagam de forma 100% segura por MB WAY, Cartão de Crédito ou Débito. Os fundos são canalizados diretamente para a sua conta Stripe associada. Ofereça opções de pagamento a pronto ou reserva com sinal (50%)."}
            </p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-purple-100 shadow-inner">🤝</div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{isEn ? "Flexible Booking Models" : "Modelos Flexíveis à sua Medida"}</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              {isEn 
                ? "Choose how you want to receive clients: Direct Checkout via HelloCamp, Email inquiries only, or redirect traffic to your own external booking website. You are in full control." 
                : "Escolha como prefere trabalhar: Reserva Direta no nosso Checkout (com comissões reduzidas), Inscrição sob Consulta por E-mail, ou encaminhamento direto de tráfego para o seu Formulário/Link Externo."}
            </p>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* TRUST BANNER                                */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-slate-900 py-16 md:py-20 text-center px-4">
        <div className="max-w-4xl mx-auto">
          <span className="text-5xl block mb-6">🏕️</span>
          <h2 className="text-2xl md:text-4xl font-black text-white mb-6 leading-tight">
            {isEn 
              ? "From local surf schools to prestigious international academies like Studio Cambridge, the best organizers trust HelloCamp." 
              : "Desde escolas de surf locais até às mais prestigiadas academias internacionais como a Studio Cambridge, os melhores organizadores confiam na HelloCamp."}
          </h2>
          <p className="text-slate-400 font-medium text-base md:text-lg">
            {isEn ? "Join our network and start receiving qualified leads today." : "Junte-se à nossa rede e comece a receber inscrições de imediato."}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FAQ B2B                                     */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-20 md:py-32">
         <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">
              {isEn ? "Frequently Asked Questions" : "Perguntas Frequentes (B2B)"}
            </h2>
         </div>
         
         <div className="space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
               <h4 className="text-lg font-black text-slate-900 mb-3">{isEn ? "How much does it cost to list my camps?" : "Quanto custa ter os meus programas listados?"}</h4>
               <p className="text-slate-600 font-medium text-sm md:text-base leading-relaxed m-0">
                 {isEn 
                   ? "Creating a partner account and listing your programs is 100% free. We do not charge monthly fees or setup costs. We only charge a small, agreed-upon commission on successful bookings processed through our platform." 
                   : "A criação de conta e a listagem dos seus programas para gerar visibilidade é 100% gratuita. Não existem custos fixos nem avenças. Apenas aplicamos a nossa comissão sobre as reservas que forem efetivamente concluídas e pagas através do nosso motor de Checkout."}
               </p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
               <h4 className="text-lg font-black text-slate-900 mb-3">{isEn ? "Do you hide my contact information?" : "A plataforma oculta os contactos da minha empresa?"}</h4>
               <p className="text-slate-600 font-medium text-sm md:text-base leading-relaxed m-0">
                 {isEn 
                   ? "Never. Your brand is the protagonist. Your official website, email, and phone number are fully visible to parents. We prioritize transparency." 
                   : "Nunca. Ao contrário de outros diretórios, o seu logótipo, website oficial e contactos telefónicos estão sempre visíveis. A sua marca é a protagonista, se os pais quiserem tirar dúvidas diretamente consigo, são livres de o fazer."}
               </p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
               <h4 className="text-lg font-black text-slate-900 mb-3">{isEn ? "Is there an exclusivity contract?" : "Existe algum contrato de exclusividade?"}</h4>
               <p className="text-slate-600 font-medium text-sm md:text-base leading-relaxed m-0">
                 {isEn 
                   ? "No. You can continue to sell your programs on your website and other channels simultaneously. We simply act as an additional, high-performing sales channel." 
                   : "Não. Pode continuar a vender os seus programas no seu próprio site e noutros canais ao mesmo tempo. Nós funcionamos apenas como um canal de vendas extra, otimizado para o ajudar a escalar."}
               </p>
            </div>
         </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FINAL CTA                                   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-white border-t border-slate-200 py-24 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">
            {isEn ? "Ready to scale your enrollments?" : "Pronto para revolucionar as suas inscrições?"}
          </h2>
          <p className="text-slate-500 font-medium text-base md:text-lg mb-10">
            {isEn ? "Create your free partner account in less than 5 minutes." : "Crie a sua conta de organizador e tenha os seus primeiros programas online ainda hoje."}
          </p>
          <div className="flex justify-center">
            <Link 
              href={`/${lang}/admin/registo`}
              className="bg-[#167524] hover:bg-[#10561a] text-white font-black uppercase tracking-widest text-sm px-12 py-5 rounded-xl shadow-xl shadow-emerald-900/20 transition-all hover:-translate-y-1 no-underline"
            >
              {isEn ? "Create Partner Account" : "Começar Agora Gratuitamente"}
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
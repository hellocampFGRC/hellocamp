"use client";

import { use, useState } from "react";
import Link from "next/link";
import React from "react";
import { supabase } from "@/lib/supabase";

// ═══════════════════════════════════════════
// ÍCONES SVG INLINE
// ═══════════════════════════════════════════
const IconCreditCard = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconChart = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconScale = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
    <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </svg>
);

const IconArrowRight = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconSuccessCheck = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// ═══════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════
export default function SerParceiroPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === "en";
  
  const [websiteLink, setWebsiteLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Link dinâmico para quem prefere registar manualmente
  const REGISTO_URL = `/${lang}/registo?role=organizador`;

  // Submissão da "Magic Box"
  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('pedidos_onboarding')
        .insert([{ 
          website_link: websiteLink, 
          idioma: lang.toUpperCase() 
        }]);

      if (error) throw error;

      // Em vez de alert(), abrimos o nosso Modal personalizado
      setShowSuccessModal(true);
      setWebsiteLink("");
    } catch (err) {
      alert(isEn ? "Error sending link. Please try again." : "Erro ao enviar o link. Tente novamente.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-20 relative">

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL DE SUCESSO PERSONALIZADO              */}
      {/* ═══════════════════════════════════════════ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 max-w-lg w-full shadow-2xl relative text-center animate-in zoom-in-95 duration-300">
            
            <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-[#167524] mb-6 border border-emerald-100 shadow-inner">
              <IconSuccessCheck />
            </div>
            
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight">
              {isEn ? "Link Received Successfully! 🚀" : "Link Recebido com Sucesso! 🚀"}
            </h3>
            
            <p className="text-slate-600 font-medium leading-relaxed mb-6">
              {isEn 
                ? "Our Onboarding team is already reviewing your website. We will build and optimize your HelloCamp profile in less than 24 hours. Once it's ready, we'll send you the secure login details." 
                : "A nossa equipa de Onboarding já está a analisar o seu site. Vamos estruturar e otimizar o seu perfil na HelloCamp em menos de 24 horas. Assim que estiver pronto, enviaremos os dados de acesso seguro."}
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-sm font-medium text-slate-700">
              <p className="mb-2">{isEn ? "Have an urgent question or specific details to share?" : "Tem alguma questão urgente ou detalhes específicos a partilhar?"}</p>
              <div className="flex items-center justify-center gap-2">
                {isEn ? "Email us at:" : "Fale connosco:"} <a href="mailto:info@hellocamp.pt" className="text-[#0E3A68] font-black hover:underline">info@hellocamp.pt</a>
              </div>
            </div>

            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-[#167524] hover:bg-[#115a1b] text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-[#167524]/20"
            >
              {isEn ? "Close Window" : "Fechar Janela"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* HERO B2B - PREMIUM & MAGIC BOX                */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-white py-24 md:py-32 text-center relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="text-xs font-bold text-[#167524] bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 uppercase tracking-widest">
            {isEn ? "HelloCamp Partner Network" : "HelloCamp para Organizadores"}
          </span>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight mt-8 mb-6 leading-tight">
            {isEn
              ? "Fully Booked. Zero Effort."
              : "Lotação Esgotada. Zero Esforço."}
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed mb-12">
            {isEn
              ? "Don't waste time filling out forms. Paste your website link or send us your PDF, and our team will build your automated booking dashboard for free."
              : "Não perca tempo a preencher dezenas de formulários. Cole o link do seu site (ou envie o seu PDF) e a nossa equipa constrói o seu painel de inscrições gratuito em 24h."}
          </p>

          <div className="max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col sm:flex-row gap-2">
            <form onSubmit={handleMagicSubmit} className="flex-1 flex flex-col sm:flex-row gap-2 w-full">
              <input 
                type="text" 
                placeholder={isEn ? "Paste your camp's website link here..." : "Cole aqui o link do seu site..."}
                required
                value={websiteLink}
                onChange={(e) => setWebsiteLink(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-5 py-4 outline-none focus:bg-white focus:border-[#167524] focus:ring-2 focus:ring-[#167524]/20 transition-all font-medium placeholder:text-slate-400"
              />
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#167524] hover:bg-[#115a1b] text-white font-black px-8 py-4 rounded-xl transition-all whitespace-nowrap shadow-md shadow-[#167524]/20"
              >
                {isSubmitting ? "..." : (isEn ? "Do it for me" : "Criem o meu Perfil")}
              </button>
            </form>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm font-medium text-slate-500">
            <span>
              {isEn ? "Or prefer to do it yourself?" : "Prefere criar a conta manualmente?"} 
            </span>
            <Link href={REGISTO_URL} className="text-[#124072] hover:text-[#0a294b] font-bold underline decoration-[#124072]/30 hover:decoration-[#124072]">
              {isEn ? "Click here to register" : "Clique aqui para começar"}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 3 PILARES                                   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-24">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {isEn
              ? "Why digitize your operation with HelloCamp?"
              : "Porquê digitalizar a sua operação connosco?"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/30 flex flex-col hover:border-[#167524] transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-[#167524]/10 text-[#167524] flex items-center justify-center mb-8 shadow-inner border border-[#167524]/20">
              <IconCreditCard />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4">
              {isEn ? "Automated Payouts" : "Pagamentos Automáticos"}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              {isEn
                ? "Say goodbye to chasing bank transfers. Parents pay, and Stripe Connect splits the transaction instantly. Your net revenue is deposited directly."
                : "Esqueça a caça aos comprovativos de MBWay. Os pais pagam na plataforma e o seu dinheiro é depositado automaticamente na sua conta bancária."}
            </p>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/30 flex flex-col hover:border-[#124072] transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-[#124072]/10 text-[#124072] flex items-center justify-center mb-8 shadow-inner border border-[#124072]/20">
              <IconChart />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4">
              {isEn ? "Medical Forms & Rosters" : "Fichas Médicas Centralizadas"}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              {isEn
                ? "Centralize medical records and allergies. Export real-time operational spreadsheets for your on-ground staff with a single click."
                : "Substitua folhas de papel. Acompanhe em tempo real as alergias, fichas médicas e autorizações de recolha, exportando tudo para a sua equipa."}
            </p>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/30 flex flex-col hover:border-[#e2a41d] transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-[#e2a41d]/10 text-[#e2a41d] flex items-center justify-center mb-8 shadow-inner border border-[#e2a41d]/20">
              <IconScale />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4">
              {isEn ? "Zero Risk" : "Custo Fixo Zero"}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              {isEn
                ? "No setup fees, no monthly retainers. We strictly operate on a performance fee per successful booking."
                : "A criação do perfil é gratuita. Não cobramos anuidades nem mensalidades, retendo apenas uma taxa de performance quando uma reserva é confirmada."}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* COMO FUNCIONA — O MODELO "DO IT FOR ME"     */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-black tracking-tight">
              {isEn ? "How the White-Glove Onboarding works" : "Como funciona o Serviço Chave-na-Mão"}
            </h3>
            <p className="text-slate-400 text-base mt-3 font-medium">
              {isEn
                ? "You organize the camps. We handle the technology."
                : "Vocês focam-se nos participantes. Nós tratamos da tecnologia."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                n: "1",
                title: isEn ? "Send your data" : "Envie o Programa",
                desc: isEn
                  ? "Paste your website link or send your brochure to our team."
                  : "Cole o link do seu site acima ou responda aos nossos e-mails com as suas datas.",
              },
              {
                n: "2",
                title: isEn ? "We build it" : "Nós Construímos",
                desc: isEn
                  ? "Our team creates your Dashboard, uploads photos and sets pricing."
                  : "A nossa equipa estrutura os seus turnos, preços, lotação e imagens no sistema.",
              },
              {
                n: "3",
                title: isEn ? "You receive bookings" : "Comece a Faturar",
                desc: isEn
                  ? "You get the login keys and start receiving paid enrollments instantly."
                  : "Recebe as chaves de acesso e vê as vagas esgotarem com pagamentos seguros.",
              },
            ].map((step) => (
              <div key={step.n} className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                <div className="text-[#e2a41d] font-black text-5xl mb-4 opacity-50">0{step.n}</div>
                <h4 className="text-xl font-black mb-2">{step.title}</h4>
                <p className="text-sm text-slate-400 font-medium leading-relaxed m-0">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* CTA FINAL                                   */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-6">
          {isEn ? "Ready to join the European network?" : "Pronto para modernizar as suas inscrições?"}
        </h2>
        <p className="text-slate-500 text-base max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
          {isEn
            ? "Send an email to info@hellocamp.pt with your camp details, or click below to set up your account instantly."
            : "Envie-nos um e-mail para info@hellocamp.pt com a sua brochura, ou clique abaixo para abrir a sua conta imediatamente."}
        </p>
        <Link
          href={REGISTO_URL}
          className="inline-flex items-center gap-2 bg-[#167524] hover:bg-[#115a1b] text-white font-bold px-10 py-4 rounded-xl no-underline transition-colors shadow-lg shadow-[#167524]/20 text-lg"
        >
          {isEn ? "Open My Account" : "Quero Fazer o Registo Manual"}
          <IconArrowRight />
        </Link>
      </section>

    </main>
  );
}
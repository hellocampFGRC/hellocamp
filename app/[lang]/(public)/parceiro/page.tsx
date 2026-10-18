"use client";

import { use, useState } from "react";
import Link from "next/link";
import React from "react";
import { supabase } from "@/lib/supabase";

// ═══════════════════════════════════════════
// ÍCONES SVG INLINE
// ═══════════════════════════════════════════
const IconCreditCard = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconChart = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconScale = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconGlobe = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconSuccessCheck = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconArrowRight = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function SerParceiroPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === "en";
  
  const [websiteLink, setWebsiteLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const REGISTO_URL = `/${lang}/registo?role=organizador`;

  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteLink.trim()) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('pedidos_onboarding')
        .insert([{ website_link: websiteLink, idioma: lang.toUpperCase() }]);

      if (error) throw error;
      setShowSuccessModal(true);
      setWebsiteLink("");
    } catch (err) {
      alert(isEn ? "Error sending link. Please try again." : "Erro ao enviar o link. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">

      {/* MODAL DE SUCESSO */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 max-w-lg w-full shadow-2xl relative text-center">
            <div className="mx-auto w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6 border border-blue-100">
              <IconSuccessCheck />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight">
              {isEn ? "Link Received! 🚀" : "Link Recebido! 🚀"}
            </h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              {isEn 
                ? "Our team is reviewing your website. We will structure your HelloCamp dashboard and contact you within 24 hours with your secure login keys." 
                : "A nossa equipa já está a analisar o seu site. Vamos montar a sua secretaria digital e enviar-lhe as chaves de acesso em menos de 24 horas."}
            </p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-4 rounded-xl transition-all shadow-lg uppercase tracking-widest text-sm">
              {isEn ? "Got it" : "Compreendido"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* HERO SECTION - SAAS STYLE                     */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-white border-b border-slate-200 pt-20 pb-28 md:pt-32 md:pb-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              {isEn ? "B2B Partner Network" : "Para Organizadores de Campos"}
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
            {isEn ? "Fully Booked." : "Lotação Esgotada."} <br className="hidden md:block"/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#124072] to-[#e2a41d]">
              {isEn ? "Zero Admin Effort." : "Zero Burocracia."}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed mb-12">
            {isEn
              ? "Stop chasing bank transfers and paper medical forms. Join Europe's leading camp platform and let our automated dashboard handle your bookings."
              : "Esqueça a caça a transferências bancárias e os e-mails perdidos. Junte-se ao maior portal da Península Ibérica e digitalize os seus pagamentos e inscrições."}
          </p>

          {/* MAGIC BOX - WHITE GLOVE SERVICE */}
          <div className="max-w-2xl mx-auto bg-white p-3 rounded-2xl shadow-[0_20px_60px_rgb(0,0,0,0.08)] border border-slate-200">
            <div className="flex items-center gap-2 mb-3 px-2 text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#e2a41d] bg-amber-50 px-2 py-1 rounded">Magic Onboarding</span>
              <span className="text-xs font-bold text-slate-400">{isEn ? "Let us do the work for you." : "Nós criamos o perfil por si."}</span>
            </div>
            
            <form onSubmit={handleMagicSubmit} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="url" 
                placeholder={isEn ? "Paste your camp's website link here (https://...)" : "Cole aqui o link do seu site (https://...)"}
                required
                value={websiteLink}
                onChange={(e) => setWebsiteLink(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-5 py-4 outline-none focus:bg-white focus:border-[#124072] transition-colors font-medium placeholder:text-slate-400"
              />
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#124072] hover:bg-[#0a294b] text-white font-black px-8 py-4 rounded-xl transition-all whitespace-nowrap shadow-lg shadow-[#124072]/30 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
              >
                {isSubmitting ? "..." : (isEn ? "Build My Profile" : "Montar o meu Perfil")}
                {!isSubmitting && <IconArrowRight />}
              </button>
            </form>
          </div>

          <div className="mt-6">
            <Link href={REGISTO_URL} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors underline decoration-slate-300 underline-offset-4">
              {isEn ? "Or click here to register and build it manually" : "Ou clique aqui para criar a conta manualmente"}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* OS 4 PILARES DA PLATAFORMA                  */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {isEn ? "Your new digital secretary" : "A sua nova secretaria digital"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <IconCreditCard />,
              title: isEn ? "Automated Payouts" : "Pagamentos Automáticos",
              desc: isEn ? "Parents pay via Credit Card/MBWay. Stripe deposits the net value straight to your bank." : "Os pais pagam na plataforma (MBWay/Cartão). O valor líquido entra direto na sua conta.",
              color: "text-emerald-600 bg-emerald-50 border-emerald-100"
            },
            {
              icon: <IconChart />,
              title: isEn ? "Medical Records" : "Fichas Centralizadas",
              desc: isEn ? "Collect diet restrictions, allergies, and ID cards in one safe, exportable place." : "Alergias, restrições e fichas médicas armazenadas de forma segura e prontas a exportar.",
              color: "text-blue-600 bg-blue-50 border-blue-100"
            },
            {
              icon: <IconGlobe />,
              title: isEn ? "Global Audience" : "Alcance Internacional",
              desc: isEn ? "Don't depend solely on local marketing. Reach parents across Europe booking summer travels." : "Capte não só alunos locais, mas também famílias emigrantes e estrangeiras a planear o verão.",
              color: "text-purple-600 bg-purple-50 border-purple-100"
            },
            {
              icon: <IconScale />,
              title: isEn ? "Zero Fixed Costs" : "Sem Mensalidades",
              desc: isEn ? "Free to join. We only charge a small performance fee when we bring you a paid booking." : "Não há anuidades nem custos de servidor. Apenas retemos uma comissão justa por cada venda gerada.",
              color: "text-amber-600 bg-amber-50 border-amber-100"
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-shadow flex flex-col items-start">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-3 leading-tight">{feature.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SOCIAL PROOF & CTA FINAL                      */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-slate-900 text-white py-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-[40px] mb-6 block">🌍</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
            {isEn ? "Ready to fill your remaining spots?" : "Pronto para esgotar o seu campo de férias?"}
          </h2>
          <p className="text-slate-400 text-lg md:text-xl font-medium mb-10 leading-relaxed">
            {isEn 
              ? "Join hundreds of organizers who trust HelloCamp to manage their enrollments. Set up your profile manually in 5 minutes." 
              : "Junte-se às centenas de parceiros que confiam as suas inscrições à HelloCamp. Comece a receber marcações hoje."}
          </p>
          <Link
            href={REGISTO_URL}
            className="inline-flex items-center gap-3 bg-[#e2a41d] hover:bg-[#d4991b] text-white font-black px-10 py-5 rounded-2xl transition-all shadow-xl shadow-[#e2a41d]/20 uppercase tracking-widest text-sm"
          >
            {isEn ? "Open My Free Account" : "Abrir Conta de Organizador"}
            <IconArrowRight />
          </Link>
          <p className="mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {isEn ? "No credit card required to list." : "Criação de perfil 100% gratuita."}
          </p>
        </div>
      </section>

    </main>
  );
}
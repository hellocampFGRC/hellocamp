"use client";

import { useState, use, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import React from "react";

// ═══════════════════════════════════════════
// ÍCONES SVG INLINE (Clean & Corporativos)
// ═══════════════════════════════════════════
const IconSuccessCheck = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconLightning = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconShield = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconCard = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconGlobe = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconUpload = () => (
  <svg className="w-6 h-6 mb-2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// ═══════════════════════════════════════════
// FORMULÁRIO COM LÓGICA DE REGISTO E MAGIC BOX
// ═══════════════════════════════════════════
function RegistoForm({ lang }: { lang: string }) {
  const isEn = lang === 'en';
  const isEs = lang === 'es';
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialRole = searchParams.get('role') === 'organizador' ? 'organizador' : 'cliente';
  const [role, setRole] = useState<'cliente' | 'organizador'>(initialRole);
  const [partnerMode, setPartnerMode] = useState<'chave-na-mao' | 'manual'>('chave-na-mao');

  // Estados Form Manual
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados Magic Box (Chave-na-mão)
  const [websiteLink, setWebsiteLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 1. Lógica do Registo Manual
  const handleRegisto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payloadMetadata = role === 'cliente' 
      ? { nome_completo: nome, role: 'cliente' } 
      : { empresa_nome: nome, role: 'organizador' };

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password, options: { data: payloadMetadata }
    });

    if (authError || !authData.user) {
      setError(authError?.message || (isEn ? "Error creating account. Check your details." : isEs ? "Error al crear cuenta. Revise los datos." : "Erro ao criar conta. Verifique os dados."));
      setLoading(false);
      return;
    }

    const perfilData = { 
      id: authData.user.id, 
      email: email, 
      role: role,
      nome_completo: role === 'cliente' ? nome : null,
      empresa_nome: role === 'organizador' ? nome : null,
      parceiro_verificado: role === 'organizador' ? false : null 
    };

    await supabase.from('perfis').upsert(perfilData);
    fetch('/api/notificacoes/boas-vindas', { method: 'POST', body: JSON.stringify({ email, nome, role, lang }) }).catch(() => {});
    router.push(role === 'organizador' ? `/${lang}/admin/dashboard` : `/${lang}`);
  };

  // 2. Lógica da Magic Box (Link + Upload PDF)
  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!websiteLink && !file) {
      setError(isEn ? "Please provide a website link or upload a file." : isEs ? "Por favor, introduzca un enlace o suba un archivo." : "Por favor, insira um link ou faça upload de um ficheiro.");
      return;
    }

    setIsSubmittingLink(true);
    setError(null);

    try {
      let documento_url = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('onboarding_docs').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('onboarding_docs').getPublicUrl(fileName);
        documento_url = data.publicUrl;
      }

      const { error: dbError } = await supabase
        .from('pedidos_onboarding')
        .insert([{ website_link: websiteLink || null, documento_url: documento_url, idioma: lang.toUpperCase() }]);

      if (dbError) throw dbError;
      
      setShowSuccessModal(true);
      setWebsiteLink("");
      setFile(null);
    } catch (err) {
      setError(isEn ? "Error sending details. Try again." : isEs ? "Error al enviar los datos. Intente de nuevo." : "Erro ao enviar os dados. Tente novamente.");
    } finally {
      setIsSubmittingLink(false);
    }
  };

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
      
      {/* ═══════════════════════════════════════════ */}
      {/* MODAL DE SUCESSO (CHAVE-NA-MÃO)             */}
      {/* ═══════════════════════════════════════════ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 max-w-lg w-full shadow-2xl relative text-center">
            <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100">
              <IconSuccessCheck />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">
              {isEn ? "Information Received! 🚀" : isEs ? "¡Información Recibida! 🚀" : "Informação Recebida! 🚀"}
            </h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              {isEn 
                ? "Our team is reviewing your details. We will structure your HelloCamp profile to attract European students and email you the secure login keys within 24 hours." 
                : isEs
                ? "Nuestro equipo está revisando los datos. Configuraremos su perfil en HelloCamp para atraer alumnos europeos y le enviaremos las claves de acceso en menos de 24 horas."
                : "A nossa equipa já recebeu os dados. Vamos estruturar o seu painel de parceiro e enviaremos as chaves de acesso seguro para o seu e-mail em menos de 24 horas."}
            </p>
            <button 
              onClick={() => { setShowSuccessModal(false); router.push(`/${lang}`); }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-4 rounded-xl shadow-lg transition-colors uppercase tracking-widest text-sm"
            >
              {isEn ? "Return to Homepage" : isEs ? "Volver al Inicio" : "Voltar à Página Principal"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* COLUNA ESQUERDA: VANTAGENS (DINÂMICO)       */}
      {/* ═══════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col gap-8 order-2 lg:order-1">
        {role === 'cliente' ? (
          <div className="animate-in fade-in duration-500">
            <span className="text-xs font-black text-[#0E3A68] bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest mb-4 inline-block">
              {isEn ? "For Families" : isEs ? "Para Familias" : "Para Famílias"}
            </span>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              {isEn ? 'The best experiences for your children.' : isEs ? 'Las mejores experiencias para sus hijos.' : 'As melhores experiências, num clique.'}
            </h1>
            <p className="text-slate-500 font-medium mb-10 text-lg leading-relaxed">
              {isEn ? 'Create your free account, securely save medical details once, and book summer camps anywhere in Europe effortlessly.' : isEs ? 'Cree su cuenta gratuita, guarde los datos de salud de sus hijos y reserve campamentos en toda Europa sin burocracia.' : 'Diga adeus à burocracia. Crie a sua conta gratuita, guarde os dados dos seus filhos uma vez e reserve campos de férias em segundos.'}
            </p>
            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0E3A68] flex items-center justify-center flex-shrink-0 border border-blue-100">
                  <IconLightning />
                </div>
                <div>
                  <h3 className="text-slate-900 text-lg font-black mb-1">{isEn ? '1-Click Bookings' : isEs ? 'Reservas Rápidas' : 'Reservas Rápidas'}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{isEn ? 'Pay securely via Credit Card, MBWay or Bank Transfer.' : isEs ? 'Pague de forma segura mediante Tarjeta, MBWay o Transferencia.' : 'Pague comodamente e em segurança via MBWay, Cartão Bancário ou Transferência.'}</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0E3A68] flex items-center justify-center flex-shrink-0 border border-blue-100">
                  <IconShield />
                </div>
                <div>
                  <h3 className="text-slate-900 text-lg font-black mb-1">{isEn ? 'Centralized Profiles' : isEs ? 'Perfiles Centralizados' : 'Fichas Médicas Seguras'}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{isEn ? "Save dietary needs and emergency contacts once for all organizers." : isEs ? 'Guarde necesidades dietéticas y contactos de emergencia solo una vez.' : 'Preencha alergias e contactos de emergência apenas uma vez para todos os organizadores.'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest mb-4 inline-block">
              {isEn ? "For Organizers" : isEs ? "Para Organizadores" : "Para Parceiros B2B"}
            </span>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              {isEn ? 'Fully Booked.' : isEs ? 'Lleno Total.' : 'Lotação Esgotada.'}<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-[#124072]">
                {isEn ? 'Global Audience.' : isEs ? 'Audiencia Global.' : 'Zero Burocracia.'}
              </span>
            </h1>
            <p className="text-slate-500 font-medium mb-10 text-lg leading-relaxed">
              {isEn ? 'Stop depending solely on local marketing. Join Europe’s fastest growing booking platform and let our automated dashboard handle international payments and medical forms.' : isEs ? 'Atraiga a miles de alumnos portugueses y europeos. Únase al buscador de campamentos líder en el mercado Ibérico.' : 'Acabe com a caça aos comprovativos. O nosso sistema atrai alunos europeus e automatiza as suas inscrições.'}
            </p>
            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                  <IconGlobe />
                </div>
                <div>
                  <h3 className="text-slate-900 text-lg font-black mb-1">{isEn ? 'Reach European Families' : isEs ? 'Mercado Europeo' : 'Alcance Internacional'}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{isEn ? 'Expose your camp directly to thousands of parents in Portugal, Spain, and beyond.' : isEs ? 'Exponga su campamento a miles de familias que buscan destinos internacionales.' : 'Capte alunos portugueses e milhares de famílias estrangeiras a planear viagens.'}</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                  <IconCard />
                </div>
                <div>
                  <h3 className="text-slate-900 text-lg font-black mb-1">{isEn ? 'Zero Fixed Costs' : isEs ? 'Cero Costes Fijos' : 'Pagamentos e Fichas Médicas'}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{isEn ? 'Free listing. We only charge a small performance fee when a booking is confirmed.' : isEs ? 'Registro gratuito. Solo cobramos una pequeña comisión por inscripción confirmada.' : 'Receba os pagamentos via Stripe na sua conta bancária e exporte listagens operacionais.'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* COLUNA DIREITA: ZONA DE CONVERSÃO / REGISTO */}
      {/* ═══════════════════════════════════════════ */}
      <div className="w-full max-w-[420px] mx-auto order-1 lg:order-2">
        <div className="bg-white p-7 md:p-10 rounded-[2rem] shadow-[0_20px_60px_rgb(0,0,0,0.06)] border border-slate-100">
          
          {/* TAB SWITCHER */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8 border border-slate-200">
            <button 
              type="button" 
              onClick={() => setRole('cliente')} 
              className={`flex-1 py-3 rounded-lg text-xs font-black transition-all flex items-center justify-center uppercase tracking-wider
                ${role === 'cliente' ? 'bg-white text-[#0E3A68] shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {isEn ? 'Parent' : isEs ? 'Padres' : 'Encarregado'}
            </button>
            <button 
              type="button" 
              onClick={() => setRole('organizador')} 
              className={`flex-1 py-3 rounded-lg text-xs font-black transition-all flex items-center justify-center uppercase tracking-wider
                ${role === 'organizador' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {isEn ? 'Camp Director' : isEs ? 'Organizador' : 'Sou Campo'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold text-center border border-red-100">
              {error}
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA: CLIENTE (B2C)                                      */}
          {/* ========================================================= */}
          {role === 'cliente' && (
            <div className="animate-in fade-in duration-300">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isEn ? 'Create your account' : isEs ? 'Cree su cuenta' : 'Criar Conta Família'}
                </h2>
              </div>
              <form onSubmit={handleRegisto} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{isEn ? 'Full Name' : 'O seu Nome'}</label>
                  <input type="text" placeholder={isEn ? 'John Doe' : 'Ex: João Silva'} required onChange={e => setNome(e.target.value)} 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0E3A68] outline-none transition-all placeholder:text-slate-400" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                  <input type="email" placeholder="email@example.com" required onChange={e => setEmail(e.target.value)} 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0E3A68] outline-none transition-all placeholder:text-slate-400" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                  <input type="password" placeholder="Mín. 6 caracteres" minLength={6} required onChange={e => setPassword(e.target.value)} 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0E3A68] outline-none transition-all placeholder:text-slate-400" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 mt-2 rounded-xl font-black text-sm text-white bg-[#0E3A68] hover:bg-[#0a294b] transition-all shadow-lg shadow-[#0E3A68]/20 uppercase tracking-widest">
                  {loading ? '...' : (isEn ? 'Create Parent Account' : isEs ? 'Crear Cuenta' : 'Criar Conta')}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA: PARCEIRO B2B (MAGIC BOX + UPLOAD)                  */}
          {/* ========================================================= */}
          {role === 'organizador' && (
            <div className="animate-in fade-in duration-300">
              
              {/* TOGGLE MODO DE SERVIÇO */}
              <div className="flex bg-slate-100 p-1 rounded-lg mb-8 border border-slate-200">
                <button 
                  type="button" 
                  onClick={() => setPartnerMode('chave-na-mao')}
                  className={`flex-1 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${partnerMode === 'chave-na-mao' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {isEn ? 'White Glove (Rec.)' : isEs ? 'Automático (Rec.)' : 'Automático (Recomendado)'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setPartnerMode('manual')}
                  className={`flex-1 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${partnerMode === 'manual' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {isEn ? 'Manual Setup' : isEs ? 'Manual' : 'Manual'}
                </button>
              </div>

              {partnerMode === 'chave-na-mao' ? (
                // ZONA "MAGIC BOX" (Fricção Zero com PDF e URL)
                <div className="text-center animate-in slide-in-from-right-2">
                  <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{isEn ? 'Let us build it.' : isEs ? 'Lo hacemos por ti.' : 'Deixe o trabalho connosco.'}</h2>
                  <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                    {isEn ? 'Paste your website link or upload your brochure. We will structure your dashboard for free within 24h.' : isEs ? 'Danos el enlace de tu web o sube el folleto. Crearemos tu perfil optimizado gratis en 24h.' : 'Cole o seu site ou faça upload do PDF do seu programa. Nós montamos o seu painel grátis em 24h.'}
                  </p>
                  
                  <form onSubmit={handleMagicSubmit} className="flex flex-col gap-4">
                    <input 
                      type="url" 
                      placeholder={isEn ? "Website Link (https://...)" : "Link (Ex: https://oseucampo.pt)"} 
                      value={websiteLink}
                      onChange={e => setWebsiteLink(e.target.value)} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none transition-all placeholder:text-slate-400 text-center" 
                    />

                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink-0 mx-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isEn ? 'AND / OR' : 'E / OU'}</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                        <IconUpload />
                        <p className="text-xs font-bold text-slate-500 mt-2 group-hover:text-emerald-600 transition-colors">
                          {file ? file.name : (isEn ? "Click to upload Brochure (PDF/DOC)" : isEs ? "Sube tu folleto (PDF/DOC)" : "Clique para anexar Brochura (PDF)")}
                        </p>
                      </div>
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </label>

                    <button type="submit" disabled={isSubmittingLink} className="w-full py-4 mt-4 rounded-xl font-black text-sm text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-lg uppercase tracking-widest">
                      {isSubmittingLink ? '...' : (isEn ? 'Submit Details' : isEs ? 'Enviar Datos' : 'Submeter Informação')}
                    </button>
                  </form>
                </div>
              ) : (
                // ZONA DE REGISTO MANUAL (Tradicional B2B)
                <div className="animate-in slide-in-from-left-2">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isEn ? 'Partner Registration' : isEs ? 'Registro Entidad' : 'Registo de Entidade'}</h2>
                  </div>
                  <form onSubmit={handleRegisto} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{isEn ? 'Camp / Entity Name' : isEs ? 'Nombre Entidad' : 'Nome da Entidade'}</label>
                      <input type="text" placeholder={isEn ? 'Ex: London Soccer Academy' : 'Ex: Academia de Surf'} required onChange={e => setNome(e.target.value)} 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none transition-all placeholder:text-slate-400" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                      <input type="email" placeholder="admin@example.com" required onChange={e => setEmail(e.target.value)} 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none transition-all placeholder:text-slate-400" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                      <input type="password" placeholder="Mín. 6 caracteres" minLength={6} required onChange={e => setPassword(e.target.value)} 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none transition-all placeholder:text-slate-400" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4 mt-2 rounded-xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest">
                      {loading ? '...' : (isEn ? 'Create Partner Account' : isEs ? 'Crear Cuenta' : 'Criar Conta Parceiro')}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* FOOTER DO FORMULÁRIO (LOGIN) */}
          <div className="text-center mt-8 pt-6 border-t border-slate-100">
            <p className="text-[13px] font-medium text-slate-500">
              {isEn ? 'Already have an account?' : isEs ? '¿Ya tienes cuenta?' : 'Já tem uma conta?'} 
              <Link href={`/${lang}/login`} className="text-slate-900 font-black hover:underline ml-1">
                {isEn ? 'Log in here' : isEs ? 'Entrar' : 'Entre aqui'}
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* BACKGROUND DECORATIVO */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-50"></div>
    </div>
  );
}

// ═══════════════════════════════════════════
// CONTAINER PRINCIPAL
// ═══════════════════════════════════════════
export default function RegistoUnificado({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-12 font-sans bg-slate-50 relative overflow-hidden">
      <Suspense fallback={
        <div className="w-full flex justify-center py-20 text-slate-400 font-bold tracking-widest uppercase">
          A carregar...
        </div>
      }>
        <RegistoForm lang={lang} />
      </Suspense>
    </main>
  );
}
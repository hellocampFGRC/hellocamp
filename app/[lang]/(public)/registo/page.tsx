"use client";

import { useState, use, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import React from "react";

// ═══════════════════════════════════════════
// ÍCONE DE SUCESSO (MODAL CHAVE-NA-MÃO)
// ═══════════════════════════════════════════
const IconSuccessCheck = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// ═══════════════════════════════════════════
// FORMULÁRIO COM LÓGICA DE REGISTO E MAGIC BOX
// ═══════════════════════════════════════════
function RegistoForm({ lang }: { lang: string }) {
  const isEn = lang === 'en';
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Deteta a query no URL: ?role=organizador
  const initialRole = searchParams.get('role') === 'organizador' ? 'organizador' : 'cliente';
  const [role, setRole] = useState<'cliente' | 'organizador'>(initialRole);
  
  // MODO PARCEIRO: 'manual' (preenche o formulário) ou 'chave-na-mao' (manda o link)
  const [partnerMode, setPartnerMode] = useState<'manual' | 'chave-na-mao'>('chave-na-mao');

  // Estados Form Manual
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados Magic Box (Chave-na-mão)
  const [websiteLink, setWebsiteLink] = useState("");
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 1. Lógica do Registo Manual (Tradicional)
  const handleRegisto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payloadMetadata = role === 'cliente' 
      ? { nome_completo: nome, role: 'cliente' } 
      : { empresa_nome: nome, role: 'organizador' };

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, 
      password, 
      options: { data: payloadMetadata }
    });

    if (authError || !authData.user) {
      setError(authError?.message || (isEn ? "Error creating account." : "Erro ao criar conta. Verifique os dados."));
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

    fetch('/api/notificacoes/boas-vindas', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nome, role, lang })
    }).catch(() => {});

    router.push(role === 'organizador' ? `/${lang}/admin/dashboard` : `/${lang}`);
  };

  // 2. Lógica da Magic Box (Envio do Link)
  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLink(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('pedidos_onboarding')
        .insert([{ website_link: websiteLink, idioma: lang.toUpperCase() }]);

      if (error) throw error;
      setShowSuccessModal(true);
      setWebsiteLink("");
    } catch (err) {
      setError(isEn ? "Error sending link. Try again." : "Erro ao enviar o link. Tente novamente.");
    } finally {
      setIsSubmittingLink(false);
    }
  };

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
      
      {/* ═══════════════════════════════════════════ */}
      {/* MODAL DE SUCESSO (CHAVE-NA-MÃO)             */}
      {/* ═══════════════════════════════════════════ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 max-w-lg w-full shadow-2xl relative text-center">
            <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-[#167524] mb-6 border border-emerald-100">
              <IconSuccessCheck />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">
              {isEn ? "Link Received Successfully! " : "Link Recebido com Sucesso! "}
            </h3>
            <p className="text-slate-600 font-medium mb-6">
              {isEn 
                ? "Our team is reviewing your website and will build your HelloCamp profile in less than 24 hours. We will email you the login keys soon." 
                : "A nossa equipa vai otimizar e estruturar o seu perfil de reservas em menos de 24h. Enviaremos os dados de acesso seguro para o seu e-mail assim que estiver pronto."}
            </p>
            <button 
              onClick={() => { setShowSuccessModal(false); router.push(`/${lang}`); }}
              className="w-full bg-[#167524] hover:bg-[#115a1b] text-white font-bold px-8 py-4 rounded-xl shadow-lg"
            >
              {isEn ? "Return to Homepage" : "Voltar à Página Principal"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* COLUNA ESQUERDA: VANTAGENS HIPER-PERSUASIVAS*/}
      {/* ═══════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col gap-8 order-2 lg:order-1">
        {role === 'cliente' ? (
          <div className="animate-in fade-in duration-500">
            <span className="text-xs font-bold text-[#0E3A68] bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest mb-4 inline-block">
              {isEn ? "For Families" : "Para Famílias"}
            </span>
            <h1 className="text-3xl lg:text-5xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
              {isEn ? 'The best experiences for your children.' : 'As melhores experiências, num clique.'}
            </h1>
            <p className="text-slate-500 font-medium mb-8 text-lg leading-relaxed">
              {isEn ? 'Create your free account and book camps safely.' : 'Diga adeus à burocracia. Crie a sua conta gratuita, guarde os dados dos seus filhos e reserve campos de férias em segundos.'}
            </p>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0E3A68] flex items-center justify-center text-2xl flex-shrink-0 shadow-sm border border-blue-100">⚡</div>
                <div>
                  <h3 className="text-slate-900 font-black mb-1">{isEn ? '1-Click Bookings' : 'Reservas Rápidas'}</h3>
                  <p className="text-sm text-slate-500 font-medium">{isEn ? 'Pay securely via MBWay or Credit Card.' : 'Pague comodamente via MBWay ou Cartão Bancário.'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0E3A68] flex items-center justify-center text-2xl flex-shrink-0 shadow-sm border border-blue-100">🛡️</div>
                <div>
                  <h3 className="text-slate-900 font-black mb-1">{isEn ? 'Centralized Profiles' : 'Fichas Médicas Seguras'}</h3>
                  <p className="text-sm text-slate-500 font-medium">{isEn ? "Save allergies and emergency contacts once." : 'Preencha alergias e contactos de emergência apenas uma vez.'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <span className="text-xs font-bold text-[#167524] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest mb-4 inline-block">
              {isEn ? "For Organizers" : "Para Parceiros B2B"}
            </span>
            <h1 className="text-3xl lg:text-5xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
              {isEn ? 'Fully Booked. Zero Admin.' : 'Lotação Esgotada. Zero Esforço.'}
            </h1>
            <p className="text-slate-500 font-medium mb-8 text-lg leading-relaxed">
              {isEn ? 'Stop chasing payments and paperwork. Let HelloCamp automate your bookings completely for free.' : 'Acabe com a caça aos comprovativos. O nosso sistema automatiza inscrições e faturação para que se foque apenas nos participantes.'}
            </p>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#F3A61C] flex items-center justify-center text-2xl flex-shrink-0 shadow-sm border border-orange-100">💰</div>
                <div>
                  <h3 className="text-slate-900 font-black mb-1">{isEn ? 'Automated Payouts' : 'Pagamentos Diretos'}</h3>
                  <p className="text-sm text-slate-500 font-medium">{isEn ? 'Parents pay online. Money goes to your bank.' : 'Integração Stripe: o dinheiro das reservas entra direto na sua conta.'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#F3A61C] flex items-center justify-center text-2xl flex-shrink-0 shadow-sm border border-orange-100">📋</div>
                <div>
                  <h3 className="text-slate-900 font-black mb-1">{isEn ? 'Export Operational Data' : 'Gestão Operacional'}</h3>
                  <p className="text-sm text-slate-500 font-medium">{isEn ? 'Export rosters and dietary needs in one click.' : 'Exporte listagens de turmas, idades e restrições alimentares num clique.'}</p>
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
              className={`flex-1 py-3 rounded-lg text-[11px] tracking-widest font-black transition-all flex items-center justify-center gap-2 uppercase
                ${role === 'cliente' ? 'bg-[#0E3A68] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {isEn ? 'Parent' : 'Encarregado'}
            </button>
            <button 
              type="button" 
              onClick={() => setRole('organizador')} 
              className={`flex-1 py-3 rounded-lg text-[11px] tracking-widest font-black transition-all flex items-center justify-center gap-2 uppercase
                ${role === 'organizador' ? 'bg-[#167524] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {isEn ? 'Partner' : 'Sou Campo'}
            </button>
          </div>

          {/* MENSAGEM DE ERRO GERAL */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-bold text-center border border-red-100">
              {error}
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA: CLIENTE (NORMAL)                                   */}
          {/* ========================================================= */}
          {role === 'cliente' && (
            <div className="animate-in fade-in duration-300">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                  {isEn ? 'Create your account' : 'Criar Conta Família'}
                </h2>
              </div>
              <form onSubmit={handleRegisto} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    {isEn ? 'Full Name' : 'O seu Nome Completo'}
                  </label>
                  <input type="text" placeholder={isEn ? 'John Doe' : 'Ex: João Silva'} required onChange={e => setNome(e.target.value)} 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0E3A68] outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">E-mail</label>
                  <input type="email" placeholder="email@exemplo.com" required onChange={e => setEmail(e.target.value)} 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0E3A68] outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                  <input type="password" placeholder="Mínimo 6 caracteres" minLength={6} required onChange={e => setPassword(e.target.value)} 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0E3A68] outline-none transition-all" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-black text-sm text-white bg-[#0E3A68] hover:bg-[#0a294b] transition-colors mt-4">
                  {loading ? '...' : (isEn ? 'Create Parent Account' : 'Criar Conta de Encarregado')}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* VISTA: PARCEIRO B2B (COM OPÇÃO MAGIC BOX)                 */}
          {/* ========================================================= */}
          {role === 'organizador' && (
            <div className="animate-in fade-in duration-300">
              
              <div className="flex bg-orange-50/50 p-1 rounded-lg mb-6 border border-orange-100/50">
                <button 
                  type="button" 
                  onClick={() => setPartnerMode('chave-na-mao')}
                  className={`flex-1 py-2 rounded-md text-[10px] sm:text-xs font-bold transition-all ${partnerMode === 'chave-na-mao' ? 'bg-white text-[#F3A61C] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  🪄 {isEn ? 'Do It For Me' : 'Criem Por Mim (Recomendado)'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setPartnerMode('manual')}
                  className={`flex-1 py-2 rounded-md text-[10px] sm:text-xs font-bold transition-all ${partnerMode === 'manual' ? 'bg-white text-[#F3A61C] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {isEn ? 'Setup Manually' : 'Criar Manualmente'}
                </button>
              </div>

              {partnerMode === 'chave-na-mao' ? (
                // ZONA "MAGIC BOX" (Fricção Zero)
                <div className="text-center animate-in slide-in-from-right-2">
                  <h2 className="text-xl font-black text-slate-900 mb-2">{isEn ? 'Zero Effort Setup' : 'Deixe o trabalho connosco'}</h2>
                  <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                    {isEn ? 'Paste your website link below. Our team will build your dashboard for free in 24h.' : 'Não tem tempo para criar turnos e fazer upload de fotos? Cole o seu site abaixo e nós criamos a sua conta em 24h.'}
                  </p>
                  <form onSubmit={handleMagicSubmit} className="flex flex-col gap-4">
                    <input 
                      type="text" 
                      placeholder={isEn ? "www.yourcamp.com" : "Ex: www.oseucampo.pt"} 
                      required 
                      value={websiteLink}
                      onChange={e => setWebsiteLink(e.target.value)} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-medium focus:bg-white focus:border-[#F3A61C] outline-none transition-all" 
                    />
                    <button type="submit" disabled={isSubmittingLink} className="w-full py-4 rounded-xl font-black text-sm text-[#167524] bg-[#e2a41d] hover:bg-[#d4991b] transition-all shadow-md">
                      {isSubmittingLink ? '...' : (isEn ? 'Send Link & Create Profile' : 'Submeter Link para Criação')}
                    </button>
                  </form>
                  <p className="text-xs text-slate-400 font-medium mt-5">
                    {isEn ? "Have a PDF instead? Email it to info@hellocamp.pt" : "Prefere enviar um PDF? Envie para info@hellocamp.pt"}
                  </p>
                </div>
              ) : (
                // ZONA DE REGISTO MANUAL (Tradicional)
                <div className="animate-in slide-in-from-left-2">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{isEn ? 'Manual Registration' : 'Registo Manual da Entidade'}</h2>
                  </div>
                  <form onSubmit={handleRegisto} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{isEn ? 'Camp / Entity Name' : 'Nome do Campo / Entidade'}</label>
                      <input type="text" placeholder={isEn ? 'Surf School Cascais' : 'Ex: Academia de Surf Cascais'} required onChange={e => setNome(e.target.value)} 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#167524] outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">E-mail</label>
                      <input type="email" placeholder="email@exemplo.com" required onChange={e => setEmail(e.target.value)} 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#167524] outline-none transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                      <input type="password" placeholder="Mínimo 6 caracteres" minLength={6} required onChange={e => setPassword(e.target.value)} 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#167524] outline-none transition-all" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-black text-sm text-white bg-[#167524] hover:bg-[#115a1b] transition-colors mt-4">
                      {loading ? '...' : (isEn ? 'Create Partner Account' : 'Criar Conta de Parceiro')}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* FOOTER DO FORMULÁRIO (LOGIN) */}
          <div className="text-center mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-500">
              {isEn ? 'Already have an account?' : 'Já tem uma conta?'} 
              <Link href={`/${lang}/login`} className="text-slate-900 font-black hover:underline ml-1">
                {isEn ? 'Log in' : 'Entrar aqui'}
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// CONTAINER PRINCIPAL (COM SUSPENSE)
// ═══════════════════════════════════════════
export default function RegistoUnificado({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);

  return (
    <main className="min-h-[85vh] flex items-center justify-center p-4 md:p-12 font-sans bg-slate-50">
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
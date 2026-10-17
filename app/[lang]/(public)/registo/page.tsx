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
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconLightning = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconShield = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconCard = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconFileExport = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <polyline points="9 15 12 18 15 15" />
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
      setError(authError?.message || (isEn ? "Error creating account. Check your details." : "Erro ao criar conta. Verifique os dados."));
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
      setError(isEn ? "Please provide a website link or upload a file." : "Por favor, insira um link ou faça upload de um ficheiro.");
      return;
    }

    setIsSubmittingLink(true);
    setError(null);

    try {
      let documento_url = null;

      // Upload do Ficheiro (se existir)
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('onboarding_docs')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('onboarding_docs').getPublicUrl(fileName);
        documento_url = data.publicUrl;
      }

      // Gravar na Base de Dados
      const { error: dbError } = await supabase
        .from('pedidos_onboarding')
        .insert([{ 
          website_link: websiteLink || null, 
          documento_url: documento_url,
          idioma: lang.toUpperCase() 
        }]);

      if (dbError) throw dbError;
      
      setShowSuccessModal(true);
      setWebsiteLink("");
      setFile(null);
    } catch (err) {
      setError(isEn ? "Error sending details. Try again." : "Erro ao enviar os dados. Tente novamente.");
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
              {isEn ? "Information Received! 🚀" : "Informação Recebida! 🚀"}
            </h3>
            <p className="text-slate-600 font-medium mb-6">
              {isEn 
                ? "Our team is reviewing your details and will build your HelloCamp profile in less than 24 hours. We will email you the secure login keys soon." 
                : "A nossa equipa já recebeu os seus dados e vai estruturar o seu perfil em menos de 24h. Enviaremos os dados de acesso seguro para o seu e-mail assim que estiver pronto."}
            </p>
            <button 
              onClick={() => { setShowSuccessModal(false); router.push(`/${lang}`); }}
              className="w-full bg-[#167524] hover:bg-[#115a1b] text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-colors"
            >
              {isEn ? "Return to Homepage" : "Voltar à Página Principal"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* COLUNA ESQUERDA: VANTAGENS CORPORATIVAS     */}
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
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0E3A68] flex items-center justify-center flex-shrink-0 border border-blue-100">
                  <IconLightning />
                </div>
                <div>
                  <h3 className="text-slate-900 font-black mb-1">{isEn ? '1-Click Bookings' : 'Reservas Rápidas'}</h3>
                  <p className="text-sm text-slate-500 font-medium">{isEn ? 'Pay securely via MBWay or Credit Card.' : 'Pague comodamente via MBWay ou Cartão Bancário.'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0E3A68] flex items-center justify-center flex-shrink-0 border border-blue-100">
                  <IconShield />
                </div>
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
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#167524] flex items-center justify-center flex-shrink-0 border border-emerald-100">
                  <IconCard />
                </div>
                <div>
                  <h3 className="text-slate-900 font-black mb-1">{isEn ? 'Automated Payouts' : 'Pagamentos Diretos'}</h3>
                  <p className="text-sm text-slate-500 font-medium">{isEn ? 'Parents pay online. Money goes to your bank.' : 'Integração Stripe: o dinheiro das reservas entra direto na sua conta.'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#167524] flex items-center justify-center flex-shrink-0 border border-emerald-100">
                  <IconFileExport />
                </div>
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
              className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center uppercase tracking-wider
                ${role === 'cliente' ? 'bg-white text-[#0E3A68] shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {isEn ? 'Parent' : 'Encarregado'}
            </button>
            <button 
              type="button" 
              onClick={() => setRole('organizador')} 
              className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center uppercase tracking-wider
                ${role === 'organizador' ? 'bg-[#167524] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
                <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold text-sm text-white bg-[#0E3A68] hover:bg-[#0a294b] transition-colors mt-4">
                  {loading ? '...' : (isEn ? 'Create Parent Account' : 'Criar Conta de Encarregado')}
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
                  className={`flex-1 py-2.5 rounded-md text-[11px] font-bold transition-all ${partnerMode === 'chave-na-mao' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {isEn ? 'Do It For Me (Recommended)' : 'Criem Por Mim (Recomendado)'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setPartnerMode('manual')}
                  className={`flex-1 py-2.5 rounded-md text-[11px] font-bold transition-all ${partnerMode === 'manual' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {isEn ? 'Setup Manually' : 'Criar Manualmente'}
                </button>
              </div>

              {partnerMode === 'chave-na-mao' ? (
                // ZONA "MAGIC BOX" (Fricção Zero com PDF e URL)
                <div className="text-center animate-in slide-in-from-right-2">
                  <h2 className="text-xl font-black text-slate-900 mb-2">{isEn ? 'Zero Effort Setup' : 'Deixe o trabalho connosco'}</h2>
                  <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                    {isEn ? 'Send us your website link or PDF brochure. Our team will build your dashboard for free in 24h.' : 'Cole o seu site ou faça upload da sua brochura. Nós configuramos o seu painel de gestão em 24h.'}
                  </p>
                  
                  <form onSubmit={handleMagicSubmit} className="flex flex-col gap-4">
                    <input 
                      type="text" 
                      placeholder={isEn ? "Website link (e.g. www.yourcamp.com)" : "Link do website (Ex: www.oseucampo.pt)"} 
                      value={websiteLink}
                      onChange={e => setWebsiteLink(e.target.value)} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#167524] outline-none transition-all placeholder:text-slate-400" 
                    />

                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isEn ? 'AND / OR' : 'E / OU'}</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                        <IconUpload />
                        <p className="text-xs font-bold text-slate-600 mt-1">
                          {file ? file.name : (isEn ? "Click to upload PDF or DOC" : "Clique para anexar PDF ou DOC")}
                        </p>
                      </div>
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </label>

                    <button type="submit" disabled={isSubmittingLink} className="w-full py-4 mt-2 rounded-xl font-bold text-sm text-white bg-[#167524] hover:bg-[#115a1b] transition-all shadow-md">
                      {isSubmittingLink ? '...' : (isEn ? 'Submit Details' : 'Submeter Informação')}
                    </button>
                  </form>
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
                    <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold text-sm text-white bg-[#167524] hover:bg-[#115a1b] transition-colors mt-4">
                      {loading ? '...' : (isEn ? 'Create Partner Account' : 'Criar Conta de Parceiro')}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* FOOTER DO FORMULÁRIO (LOGIN) */}
          <div className="text-center mt-8 pt-6 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-500">
              {isEn ? 'Already have an account?' : 'Já tem uma conta?'} 
              <Link href={`/${lang}/login`} className="text-slate-900 font-bold hover:underline ml-1">
                {isEn ? 'Log in here' : 'Entre aqui'}
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
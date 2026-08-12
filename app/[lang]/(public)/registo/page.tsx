"use client";

import { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function RegistoUnificado({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [role, setRole] = useState<'cliente' | 'organizador'>('cliente');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(authError?.message || "Erro ao criar conta.");
      setLoading(false);
      return;
    }

    const perfilData = { 
      id: authData.user.id, email: email, role: role,
      nome_completo: role === 'cliente' ? nome : null,
      empresa_nome: role === 'organizador' ? nome : null,
      parceiro_verificado: role === 'organizador' ? false : null 
    };

    await supabase.from('perfis').upsert(perfilData);

    fetch('/api/notificacoes/boas-vindas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nome, role, lang })
    }).catch(() => {});
    
    router.push(role === 'organizador' ? `/${lang}/admin/dashboard` : `/${lang}`);
  };

  return (
    <main className="min-h-[85vh] flex items-center justify-center p-4 md:p-12 font-sans bg-slate-50">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        {/* COLUNA ESQUERDA: VANTAGENS DINÂMICAS */}
        <div className="hidden md:flex flex-col gap-8 order-2 lg:order-1">
          {role === 'cliente' ? (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight mb-4">
                {isEn ? 'The best experiences for your children.' : 'As melhores experiências para os seus filhos.'}
              </h1>
              <p className="text-slate-500 font-medium mb-8 text-lg">
                {isEn ? 'Create your free account and discover everything HelloCamp has to offer.' : 'Crie a sua conta gratuita e descubra tudo o que a HelloCamp tem para oferecer.'}
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">⚡</div>
                  <div>
                    <h3 className="text-slate-900 font-bold mb-1">{isEn ? 'Fast Bookings' : 'Reservas Rápidas'}</h3>
                    <p className="text-sm text-slate-500">{isEn ? 'Book and pay safely in seconds, without leaving the platform.' : 'Reserve e pague com segurança em segundos, sem sair da plataforma.'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl flex-shrink-0">👨‍👩‍👧‍👦</div>
                  <div>
                    <h3 className="text-slate-900 font-bold mb-1">{isEn ? 'Manage Participants' : 'Gestão de Participantes'}</h3>
                    <p className="text-sm text-slate-500">{isEn ? "Save your children's profiles to avoid filling out the same data every time." : 'Guarde os perfis dos seus filhos para não ter de preencher os mesmos dados sempre.'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xl flex-shrink-0">📑</div>
                  <div>
                    <h3 className="text-slate-900 font-bold mb-1">{isEn ? 'History & Receipts' : 'Histórico e Recibos'}</h3>
                    <p className="text-sm text-slate-500">{isEn ? 'Access your booking history and download invoices for tax deductions.' : 'Aceda ao seu histórico de reservas e descarregue faturas para o IRS facilmente.'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight mb-4">
                {isEn ? 'Boost your camp business.' : 'Potencie o seu negócio connosco.'}
              </h1>
              <p className="text-slate-500 font-medium mb-8 text-lg">
                {isEn ? 'Join the leading platform for holiday camps and activities in Portugal.' : 'Junte-se à plataforma líder de campos de férias e atividades em Portugal.'}
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xl flex-shrink-0">📊</div>
                  <div>
                    <h3 className="text-slate-900 font-bold mb-1">{isEn ? 'Management Dashboard' : 'Dashboard de Gestão'}</h3>
                    <p className="text-sm text-slate-500">{isEn ? 'Control dates, availability, and financial reports all in one place.' : 'Controle datas, vagas, inscrições e relatórios financeiros num só lugar.'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">🚀</div>
                  <div>
                    <h3 className="text-slate-900 font-bold mb-1">{isEn ? 'National Visibility' : 'Visibilidade Nacional'}</h3>
                    <p className="text-sm text-slate-500">{isEn ? 'Reach thousands of families looking for activities exactly like yours.' : 'Alcance milhares de famílias que procuram atividades exatamente como as suas.'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl flex-shrink-0">🔒</div>
                  <div>
                    <h3 className="text-slate-900 font-bold mb-1">{isEn ? 'Secure Payments' : 'Pagamentos Seguros'}</h3>
                    <p className="text-sm text-slate-500">{isEn ? 'Accept MBWay, Multibanco, and Cards with fully automated processing.' : 'Aceite MBWay, Multibanco e Cartões com processamento 100% automatizado.'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: FORMULÁRIO DE REGISTO */}
        <div className="w-full max-w-[420px] mx-auto order-1 lg:order-2">
          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                {isEn ? 'Create your account' : 'Criar Conta'}
              </h2>
            </div>

            {/* TOGGLE ROLES */}
            <div className="flex bg-slate-50 p-1 rounded-xl mb-8 border border-slate-100">
              <button type="button" onClick={() => setRole('cliente')} className={`flex-1 py-2.5 rounded-lg text-[11px] uppercase tracking-widest font-black transition-all ${role === 'cliente' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                {isEn ? 'Parent' : 'Encarregado'}
              </button>
              <button type="button" onClick={() => setRole('organizador')} className={`flex-1 py-2.5 rounded-lg text-[11px] uppercase tracking-widest font-black transition-all ${role === 'organizador' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                {isEn ? 'Partner' : 'Parceiro'}
              </button>
            </div>

            <form onSubmit={handleRegisto} className="flex flex-col gap-4">
              {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-xs font-bold text-center border border-red-100">{error}</div>}
              
              <input 
                type="text" 
                placeholder={role === 'cliente' ? (isEn ? 'Full Name' : 'O Seu Nome Completo') : (isEn ? 'Company / Camp Name' : 'Nome da Empresa / Entidade')} 
                required 
                onChange={e => setNome(e.target.value)} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400" 
              />
              <input 
                type="email" 
                placeholder="E-mail" 
                required 
                onChange={e => setEmail(e.target.value)} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400" 
              />
              <input 
                type="password" 
                placeholder="Password (min. 6)" 
                minLength={6} 
                required 
                onChange={e => setPassword(e.target.value)} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400" 
              />
              
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm transition-colors mt-2"
              >
                {loading ? '...' : (isEn ? 'Agree and continue' : 'Aceitar e Continuar')}
              </button>
            </form>

            <div className="text-center mt-6 pt-6 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-500">
                {isEn ? 'Already have an account?' : 'Já tem uma conta?'} 
                <Link href={`/${lang}/login`} className="text-slate-900 font-black hover:underline ml-1">
                  {isEn ? 'Log in' : 'Entrar'}
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
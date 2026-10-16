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

    // Metadata correta para o Auth
    const payloadMetadata = role === 'cliente' 
      ? { nome_completo: nome, role: 'cliente' } 
      : { empresa_nome: nome, role: 'organizador' };

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, 
      password, 
      options: { data: payloadMetadata }
    });

    if (authError || !authData.user) {
      setError(authError?.message || (isEn ? "Error creating account." : "Erro ao criar conta."));
      setLoading(false);
      return;
    }

    // Gravação robusta no Perfis
    const perfilData = { 
      id: authData.user.id, 
      email: email, 
      role: role,
      nome_completo: role === 'cliente' ? nome : null,
      empresa_nome: role === 'organizador' ? nome : null,
      parceiro_verificado: role === 'organizador' ? false : null 
    };

    await supabase.from('perfis').upsert(perfilData);

    // Chamada à API de Boas-vindas (Não bloqueia o redirecionamento)
    fetch('/api/notificacoes/boas-vindas', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nome, role, lang })
    }).catch(() => {});

    // Roteamento dinâmico e seguro
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
                {isEn ? 'Create your free account and discover everything HelloCamp has to offer.' : 'Crie a sua conta gratuita e reserve de forma rápida e segura.'}
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0E3A68] flex items-center justify-center text-xl flex-shrink-0">⚡</div>
                  <div>
                    <h3 className="text-slate-900 font-bold mb-1">{isEn ? 'Fast Bookings' : 'Reservas Rápidas'}</h3>
                    <p className="text-sm text-slate-500">{isEn ? 'Book and pay safely in seconds, without leaving the platform.' : 'Reserve e pague com segurança em segundos, sem sair da plataforma.'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0E3A68] flex items-center justify-center text-xl flex-shrink-0">👨‍👩‍👧‍👦</div>
                  <div>
                    <h3 className="text-slate-900 font-bold mb-1">{isEn ? 'Manage Participants' : 'Gestão de Participantes'}</h3>
                    <p className="text-sm text-slate-500">{isEn ? "Save your children's profiles to avoid filling out the same data every time." : 'Guarde os perfis dos seus filhos (idades, alergias) para não ter de repetir.'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight mb-4">
                {isEn ? 'Boost your camp business.' : 'Lotação Esgotada, Sem Intermediários.'}
              </h1>
              <p className="text-slate-500 font-medium mb-8 text-lg">
                {isEn ? 'Join the leading platform for holiday camps and activities in Portugal.' : 'Junte-se à plataforma líder de campos de férias e potencie o seu negócio.'}
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-[#F3A61C] flex items-center justify-center text-xl flex-shrink-0">📊</div>
                  <div>
                    <h3 className="text-slate-900 font-bold mb-1">{isEn ? 'Management Dashboard' : 'Dashboard de Gestão'}</h3>
                    <p className="text-sm text-slate-500">{isEn ? 'Control dates, availability, and financial reports all in one place.' : 'Controle vagas, reembolsos, lista de inscritos e fichas médicas num só lugar.'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-[#F3A61C] flex items-center justify-center text-xl flex-shrink-0">💬</div>
                  <div>
                    <h3 className="text-slate-900 font-bold mb-1">{isEn ? 'Direct Contact' : 'Contacto Direto'}</h3>
                    <p className="text-sm text-slate-500">{isEn ? 'Talk directly with parents. We do not hide your contacts.' : 'Fale diretamente com os pais. Não escondemos os seus contactos da marca.'}</p>
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

            {/* TOGGLE ROLES - OTIMIZADO PARA UX */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8 border border-slate-200">
              <button 
                type="button" 
                onClick={() => setRole('cliente')} 
                className={`flex-1 py-3 rounded-lg text-xs tracking-widest font-black transition-all flex items-center justify-center gap-2
                  ${role === 'cliente' ? 'bg-[#0E3A68] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                👤 {isEn ? 'Parent' : 'Sou Encarregado'}
              </button>
              
              <button 
                type="button" 
                onClick={() => setRole('organizador')} 
                className={`flex-1 py-3 rounded-lg text-xs tracking-widest font-black transition-all flex items-center justify-center gap-2
                  ${role === 'organizador' ? 'bg-[#F3A61C] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                🎪 {isEn ? 'Partner' : 'Sou Campo / Parceiro'}
              </button>
            </div>

            <form onSubmit={handleRegisto} className="flex flex-col gap-4">
              {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-xs font-bold text-center border border-red-100">{error}</div>}

              {/* INPUT NOME COM PLACEHOLDER ADAPTADO */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  {role === 'cliente' ? (isEn ? 'Parent Name' : 'Nome do Encarregado') : (isEn ? 'Camp / Entity Name' : 'Nome da Entidade Organizadora')}
                </label>
                <input 
                  type="text" 
                  placeholder={role === 'cliente' ? (isEn ? 'E.g., John Doe' : 'Ex: João Silva') : (isEn ? 'E.g., Surf School Cascais' : 'Ex: Academia de Surf Cascais')} 
                  required 
                  onChange={e => setNome(e.target.value)} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-[#0E3A68] focus:ring-1 focus:ring-[#0E3A68] transition-all placeholder:text-slate-400" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">E-mail</label>
                <input 
                  type="email" 
                  placeholder="email@exemplo.com" 
                  required 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-[#0E3A68] focus:ring-1 focus:ring-[#0E3A68] transition-all placeholder:text-slate-400" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                <input 
                  type="password" 
                  placeholder="Mínimo 6 caracteres" 
                  minLength={6} 
                  required 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-[#0E3A68] focus:ring-1 focus:ring-[#0E3A68] transition-all placeholder:text-slate-400" 
                />
              </div>

              {/* BOTÃO FINAL INEQUÍVOCO E COM CORES DINÂMICAS */}
              <button 
                type="submit" 
                disabled={loading} 
                className={`w-full py-4 rounded-xl font-bold text-sm text-white transition-colors mt-4 
                  ${role === 'cliente' 
                    ? 'bg-[#0E3A68] hover:bg-[#0a294b]' 
                    : 'bg-[#F3A61C] hover:bg-[#da9416]'}`}
              >
                {loading 
                  ? '...' 
                  : role === 'cliente' 
                    ? (isEn ? 'Create Parent Account' : 'Criar Conta de Encarregado') 
                    : (isEn ? 'Create Partner Account' : 'Criar Conta de Parceiro / Campo')}
              </button>
            </form>

            <div className="text-center mt-6 pt-6 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-500">
                {isEn ? 'Already have an account?' : 'Já tem uma conta?'} 
                <Link href={`/${lang}/login`} className="text-[#0E3A68] font-black hover:underline ml-1">
                  {isEn ? 'Log in' : 'Entrar aqui'}
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
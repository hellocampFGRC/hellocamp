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

    const payloadMetadata = role === 'cliente' ? { nome_completo: nome, role: 'cliente' } : { empresa_nome: nome, role: 'organizador' };

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
    <main className="min-h-[85vh] flex items-center justify-center p-4 font-sans bg-white">
      <div className="w-full max-w-[400px]">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            {isEn ? 'Join HelloCamp' : 'Junte-se à HelloCamp'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {isEn ? 'Select your profile type' : 'Selecione o seu tipo de perfil'}
          </p>
        </div>

        {/* TOGGLE ROLES */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
          <button type="button" onClick={() => setRole('cliente')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${role === 'cliente' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {isEn ? 'Parent' : 'Pai / Encarregado'}
          </button>
          <button type="button" onClick={() => setRole('organizador')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${role === 'organizador' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {isEn ? 'Partner' : 'Entidade Parceira'}
          </button>
        </div>

        <form onSubmit={handleRegisto} className="flex flex-col gap-4">
          {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-xs font-bold text-center">{error}</div>}
          
          <input type="text" placeholder={role === 'cliente' ? (isEn ? 'Full Name' : 'Nome Completo') : (isEn ? 'Company Name' : 'Nome da Entidade')} required onChange={e => setNome(e.target.value)} className="w-full p-4 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400" />
          <input type="email" placeholder="E-mail" required onChange={e => setEmail(e.target.value)} className="w-full p-4 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400" />
          <input type="password" placeholder="Password (min. 6)" minLength={6} required onChange={e => setPassword(e.target.value)} className="w-full p-4 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400" />
          
          <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm transition-colors mt-2">
            {loading ? '...' : (isEn ? 'Agree and continue' : 'Aceitar e Continuar')}
          </button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-600">
            {isEn ? 'Already have an account?' : 'Já tem uma conta?'} <Link href={`/${lang}/login`} className="text-slate-900 font-black hover:underline ml-1">{isEn ? 'Log in' : 'Entrar'}</Link>
          </p>
        </div>

      </div>
    </main>
  );
}
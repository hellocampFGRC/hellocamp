"use client";

import { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function LoginUnificado({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // FORÇAR LIMPEZA DE SESSÕES (Prevenção de Loop de Redirecionamento)
    await supabase.auth.signOut();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      setError(isEn ? "Invalid email or password." : "E-mail ou password incorretos.");
      setLoading(false);
      return;
    }

    // Identificar de forma inteligente a role para onde devemos enviar
    const { data: perfil } = await supabase.from('perfis').select('role, is_superadmin').eq('id', authData.user.id).single();
    
    if (perfil?.is_superadmin) {
        router.push(`/${lang}/superadmin/parceiros`);
        return;
    }

    if (perfil?.role === 'organizador') {
        router.push(`/${lang}/admin/dashboard`);
        return;
    }

    const redirectUrl = sessionStorage.getItem('redirect_after_login');
    if (redirectUrl) {
      sessionStorage.removeItem('redirect_after_login');
      router.push(redirectUrl);
    } else {
      router.push(`/${lang}/cliente/dashboard`);
    }
  };

  return (
    <main className="min-h-[85vh] bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-[420px] bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-200">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            {isEn ? 'Welcome back' : 'Bem-vindo de volta'}
          </h1>
          <p className="text-sm font-medium text-slate-500">
            {isEn ? 'Log in to manage your account.' : 'Entre para gerir a sua conta.'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          
          {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-xs font-bold text-center border border-red-100">{error}</div>}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail</label>
            <input type="email" required onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-colors" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest m-0">Password</label>
              <Link href={`/${lang}/recuperar-password`} className="text-[10px] font-bold text-emerald-600 hover:underline">
                {isEn ? 'Forgot password?' : 'Esqueceu-se?'}
              </Link>
            </div>
            <input type="password" required onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-colors" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-colors mt-2">
            {loading ? '...' : (isEn ? 'Log In' : 'Entrar na Conta')}
          </button>
        </form>

        <p className="text-center mt-6 text-sm font-medium text-slate-500">
          {isEn ? "Don't have an account?" : "Ainda não tem conta?"} <Link href={`/${lang}/registo`} className="text-emerald-600 font-bold hover:underline">{isEn ? 'Sign up' : 'Criar Conta'}</Link>
        </p>

      </div>
    </main>
  );
}
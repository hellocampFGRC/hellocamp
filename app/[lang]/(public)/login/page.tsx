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

    await supabase.auth.signOut();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      setError(isEn ? "Invalid email or password." : "E-mail ou password incorretos.");
      setLoading(false);
      return;
    }

    const { data: perfil } = await supabase.from('perfis').select('role, is_superadmin').eq('id', authData.user.id).single();
    
    if (perfil?.is_superadmin) return router.push(`/${lang}/superadmin/parceiros`);
    if (perfil?.role === 'organizador') return router.push(`/${lang}/admin/dashboard`);

    const redirectUrl = sessionStorage.getItem('redirect_after_login');
    if (redirectUrl) {
      sessionStorage.removeItem('redirect_after_login');
      router.push(redirectUrl);
    } else {
      router.push(`/${lang}/cliente/dashboard`);
    }
  };

  return (
    <main className="min-h-[85vh] flex items-center justify-center p-4 font-sans bg-white">
      <div className="w-full max-w-[400px]">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            {isEn ? 'Welcome to HelloCamp' : 'Bem-vindo à HelloCamp'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {isEn ? 'Please log in to continue.' : 'Inicie sessão para continuar.'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-xs font-bold text-center">{error}</div>}

          <div>
            <input type="email" placeholder="E-mail" required onChange={e => setEmail(e.target.value)} className="w-full p-4 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400" />
          </div>

          <div>
            <input type="password" placeholder="Password" required onChange={e => setPassword(e.target.value)} className="w-full p-4 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400" />
            <div className="text-right mt-2">
              <Link href={`/${lang}/recuperar-password`} className="text-xs font-bold text-slate-900 hover:underline">
                {isEn ? 'Forgot password?' : 'Esqueceu-se da password?'}
              </Link>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-sm transition-colors mt-2">
            {loading ? '...' : (isEn ? 'Continue' : 'Continuar')}
          </button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-600">
            {isEn ? "Don't have an account?" : "Ainda não tem conta?"} <Link href={`/${lang}/registo`} className="text-slate-900 font-black hover:underline ml-1">{isEn ? 'Sign up' : 'Registar-se'}</Link>
          </p>
        </div>

      </div>
    </main>
  );
}
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

  // Tipo de conta escolhida: "cliente" (Pais) ou "organizador" (Campos de Férias)
  const [role, setRole] = useState<'cliente' | 'organizador'>('cliente');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState(""); // Nome Completo ou Nome Empresa
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegisto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Criar Auth com a role escolhida
    const payloadMetadata = role === 'cliente' 
        ? { nome_completo: nome, role: 'cliente' } 
        : { empresa_nome: nome, role: 'organizador' };

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, 
      password,
      options: { data: payloadMetadata }
    });

    if (authError || !authData.user) {
      setError(authError?.message || "Erro desconhecido ao criar conta.");
      setLoading(false);
      return;
    }

    // 2. Gravar no perfil público com estrutura consistente para o TypeScript
    const perfilData = { 
      id: authData.user.id, 
      email: email, 
      role: role,
      nome_completo: role === 'cliente' ? nome : null,
      empresa_nome: role === 'organizador' ? nome : null,
      parceiro_verificado: role === 'organizador' ? false : null 
    };

    const { error: perfilError } = await supabase.from('perfis').upsert(perfilData);
    if (perfilError) console.error("Falha ao guardar perfil:", perfilError);

    // 3. Disparar o Email de Boas-Vindas adequado à Role
    fetch('/api/notificacoes/boas-vindas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nome, role, lang })
    }).catch(err => console.error("Email falhou:", err));
    
    // 4. Redirecionar
    if (role === 'organizador') {
        router.push(`/${lang}/admin/dashboard`);
    } else {
        router.push(`/${lang}`);
    }
  };

  return (
    <main className="min-h-[85vh] bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-[480px] bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-200">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            {isEn ? 'Create your account' : 'Criar uma conta'}
          </h1>
          <p className="text-sm font-medium text-slate-500">
            {isEn ? 'Select what best describes you' : 'Selecione a opção que melhor o descreve'}
          </p>
        </div>

        {/* TOGGLE AIRBNB STYLE */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
          <button 
            type="button" 
            onClick={() => setRole('cliente')} 
            className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${role === 'cliente' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {isEn ? 'I am a Parent' : 'Sou um Pai / Encarregado'}
          </button>
          <button 
            type="button" 
            onClick={() => setRole('organizador')} 
            className={`flex-1 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${role === 'organizador' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {isEn ? 'I am a Partner' : 'Sou Entidade Parceira'}
          </button>
        </div>

        <form onSubmit={handleRegisto} className="flex flex-col gap-4">
          {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-xs font-bold text-center border border-red-100">{error}</div>}
          
          <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  {role === 'cliente' ? (isEn ? 'Full Name' : 'O Seu Nome Completo') : (isEn ? 'Company / Camp Name' : 'Nome da Entidade / Empresa')}
              </label>
              <input type="text" required onChange={e => setNome(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-colors" />
          </div>

          <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail</label>
              <input type="email" required onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-colors" />
          </div>

          <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input type="password" minLength={6} required onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-colors" />
          </div>
          
          <button type="submit" disabled={loading} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-colors mt-2 text-white ${role === 'cliente' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
            {loading ? '...' : (isEn ? 'Create Account' : 'Registar Conta')}
          </button>
        </form>

        <p className="text-center mt-6 text-sm font-medium text-slate-500">
          {isEn ? 'Already have an account?' : 'Já tem uma conta?'} <Link href={`/${lang}/login`} className="text-emerald-600 font-bold hover:underline">{isEn ? 'Log in' : 'Entrar'}</Link>
        </p>
      </div>
    </main>
  );
}
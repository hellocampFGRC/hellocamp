"use client";

import React, { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginMonitorPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(isEn ? "Invalid email or password." : "Email ou palavra-passe incorretos.");
      setLoading(false);
    } else {
      router.push(`/${lang}/monitores/portal/perfil`);
    }
  };

  const inputClass = "w-full py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm";

  return (
    <main className="min-h-[calc(100vh-80px)] flex flex-col bg-slate-50">
      
      {/* Botão flutuante para voltar atrás */}
      <div className="w-full max-w-md mx-auto pt-8 px-4 relative z-10 text-left">
         <Link href={`/${lang}/monitores`} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm no-underline">
           &larr; {isEn ? "Back" : "Voltar Atrás"}
         </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              {isEn ? "Monitor Portal" : "Portal do Monitor"}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              {isEn ? "Log in to manage your staff profile." : "Inicie sessão para gerir a sua disponibilidade."}
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
            
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Email</label>
                <input 
                  type="email" 
                  required 
                  className={inputClass} 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="nome@email.com"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{isEn ? "Password" : "Palavra-Passe"}</label>
                <input 
                  type="password" 
                  required 
                  className={inputClass} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition-all mt-4 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? (isEn ? "Entering..." : "A entrar...") : (isEn ? "Sign In" : "Entrar no Portal")}
              </button>
            </form>
          </div>

          <div className="text-center mt-8 space-y-4">
            <p className="text-sm font-medium text-slate-500">
              {isEn ? "Want to work in summer camps?" : "Queres trabalhar em campos de férias?"} <br />
              <Link href={`/${lang}/monitores/registo`} className="text-blue-600 font-bold hover:underline">
                {isEn ? "Create your profile here" : "Cria o teu perfil aqui"}
              </Link>
            </p>
            <p className="text-xs text-slate-400">
              Ao entrar, aceitas os <Link href={`/${lang}/monitores/termos`} className="underline hover:text-slate-600">Termos e Condições</Link>.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
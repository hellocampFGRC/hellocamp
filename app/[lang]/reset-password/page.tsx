"use client";

import { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function ResetPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const router = useRouter();
  const isEn = lang === 'en';

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg(isEn ? "The password must be at least 6 characters long." : "A password deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(isEn ? "Passwords do not match." : "As passwords não coincidem.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      // Após definir a password com sucesso, reencaminha automaticamente após 3 segundos
      setTimeout(() => {
        router.push(`/${lang}/dashboard`); // Redireciona para o Painel do Pai
      }, 3000);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900 selection:bg-emerald-200">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        
        {/* LOGOTIPO */}
        <div className="text-center mb-8">
          <Link href={`/${lang}`} className="text-3xl font-black tracking-tighter hover:opacity-80 transition-opacity no-underline inline-block">
            <span className="text-slate-900">Hello</span><span className="text-[#EBA914]">Camp</span>
          </Link>
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              ✓
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              {isEn ? 'Password Updated!' : 'Password Definida!'}
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              {isEn 
                ? 'Your account is now fully secured. Redirecting you to your dashboard...' 
                : 'A sua conta está agora totalmente segura e pronta a usar. A redirecionar para o painel...'}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                {isEn ? 'Secure your Account' : 'Proteja a sua Conta'}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {isEn 
                  ? 'Define a secure password to manage your bookings and participants in the future.' 
                  : 'Defina uma password segura para poder gerir as suas inscrições e aceder aos dados dos participantes no futuro.'}
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold mb-6 text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  {isEn ? 'New Password' : 'Nova Password'}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  placeholder={isEn ? "Minimum 6 characters" : "Mínimo 6 caracteres"}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  {isEn ? 'Confirm Password' : 'Confirmar Password'}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                  placeholder={isEn ? "Repeat the password" : "Repita a password"}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-4 rounded-xl transition-all shadow-md mt-4 disabled:opacity-50"
              >
                {loading 
                  ? (isEn ? 'Saving...' : 'A guardar...') 
                  : (isEn ? 'Save Password' : 'Guardar Password')}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
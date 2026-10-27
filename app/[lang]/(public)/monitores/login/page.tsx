"use client";

import React, { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginMonitorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        throw new Error(
          isEn
            ? "Invalid email or password."
            : "E-mail ou palavra-passe incorretos."
        );
      }

      router.push(`/${lang}/monitores/portal/perfil`);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const inputClass =
    "w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#2563eb] focus:bg-white transition-colors";

  return (
    <main className="min-h-[calc(100vh-80px)] flex flex-col bg-slate-50 font-sans">
      <div className="w-full max-w-md mx-auto pt-8 px-4 relative z-10 text-left">
        <Link
          href={`/${lang}/monitores`}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm no-underline"
        >
          &larr; {isEn ? "Back" : "Voltar Atrás"}
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 pb-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
              {isEn ? "Monitor Portal" : "Portal do Monitor"}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              {isEn
                ? "Log in to manage your staff profile and job offers."
                : "Inicie sessão para gerir a sua disponibilidade e propostas."}
            </p>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-black uppercase tracking-widest rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                  Email
                </label>
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
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    {isEn ? "Password" : "Palavra-Passe"}
                  </label>
                  <Link
                    href={`/${lang}/recuperar-password`}
                    className="text-[10px] font-black text-[#2563eb] hover:underline"
                  >
                    {isEn ? "Forgot password?" : "Recuperar password"}
                  </Link>
                </div>
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
                className="w-full bg-[#2563eb] text-white font-black uppercase tracking-widest text-xs py-4 md:py-5 rounded-xl shadow-lg hover:bg-blue-700 transition-all mt-4 disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? isEn
                    ? "Entering..."
                    : "A entrar..."
                  : isEn
                  ? "Sign In"
                  : "Entrar no Portal"}
              </button>
            </form>
          </div>

          <div className="text-center mt-10 space-y-5">
            <p className="text-sm font-medium text-slate-500">
              {isEn
                ? "Want to work in summer camps?"
                : "Queres trabalhar em campos de férias?"}{" "}
              <br />
              <Link
                href={`/${lang}/monitores/registo`}
                className="text-[#2563eb] font-black hover:underline mt-1 inline-block"
              >
                {isEn
                  ? "Create your profile here"
                  : "Cria o teu perfil de monitor aqui"}
              </Link>
            </p>
            <p className="text-[10px] text-slate-400 font-bold">
              Ao entrar, aceitas os{" "}
              <Link
                href={`/${lang}/monitores/termos`}
                className="underline hover:text-slate-600"
              >
                Termos e Condições
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
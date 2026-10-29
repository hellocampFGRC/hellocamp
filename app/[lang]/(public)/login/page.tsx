"use client";

import React, { useState, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function LoginForm({ lang }: { lang: string }) {
  const isEn = lang === "en";
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "";

  const [modo, setModo] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [magicEnviado, setMagicEnviado] = useState(false);

  const handleLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      setErro(
        isEn
          ? "Invalid email or password. You can also use the Magic Link tab above."
          : "E-mail ou palavra-passe incorretos. Também pode entrar sem password usando o Link Mágico."
      );
      setLoading(false);
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
      return;
    }

    const { data: perfil } = await supabase
      .from("perfis")
      .select("role, tipo")
      .eq("id", data.user.id)
      .maybeSingle();

    const role = perfil?.role || perfil?.tipo || data.user.user_metadata?.role;
    if (role === "parceiro" || role === "admin" || role === "organizador") {
      router.push(`/${lang}/admin/dashboard`);
    } else {
      router.push(`/${lang}/cliente/dashboard`);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/${lang}/cliente/dashboard`,
      },
    });

    setLoading(false);
    if (error) {
      setErro(
        isEn
          ? "Could not send access link. Please verify your email."
          : "Não foi possível enviar o link de acesso. Verifique o seu e-mail."
      );
    } else {
      setMagicEnviado(true);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden">
      <div className="w-full h-2 flex">
        <div className="w-1/4 h-full bg-[#F59E0B]" />
        <div className="w-1/4 h-full bg-[#2563EB]" />
        <div className="w-1/4 h-full bg-[#16A34A]" />
        <div className="w-1/4 h-full bg-[#F43F5E]" />
      </div>

      <div className="p-8 md:p-10">
        <div className="text-center mb-8">
          <Link
            href={`/${lang}`}
            className="text-3xl font-black tracking-tight inline-flex items-center no-underline mb-3"
          >
            <span className="text-[#0F172A]">Hello</span>
            <span className="text-[#F59E0B]">Camp</span>
          </Link>
          <h1 className="text-2xl font-black text-[#0F172A] m-0">
            {isEn ? "Welcome back" : "Iniciar Sessão"}
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1">
            {isEn
              ? "Access your Family or Partner Portal"
              : "Aceda à sua Área de Família ou Portal de Parceiro"}
          </p>
        </div>

        {/* ALTERNADOR PASSWORD vs MAGIC LINK */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#F8FAFC] rounded-md border border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => {
              setModo("password");
              setErro("");
            }}
            className={`py-2.5 rounded-md text-xs font-black uppercase tracking-wider cursor-pointer border-0 transition-all ${
              modo === "password"
                ? "bg-[#2563EB] text-white shadow-sm"
                : "bg-transparent text-slate-600"
            }`}
          >
            🔑 {isEn ? "With Password" : "Com Password"}
          </button>
          <button
            type="button"
            onClick={() => {
              setModo("magic");
              setErro("");
            }}
            className={`py-2.5 rounded-md text-xs font-black uppercase tracking-wider cursor-pointer border-0 transition-all ${
              modo === "magic"
                ? "bg-[#F59E0B] text-white shadow-sm"
                : "bg-transparent text-slate-600"
            }`}
          >
            ✨ {isEn ? "Magic Link" : "Link por E-mail"}
          </button>
        </div>

        {erro && (
          <div className="mb-6 p-4 bg-rose-50 border border-[#F43F5E] text-[#F43F5E] rounded-md text-xs font-bold">
            {erro}
          </div>
        )}

        {modo === "password" ? (
          <form onSubmit={handleLoginPassword} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                {isEn ? "Email Address" : "E-mail"}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.com"
                className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {isEn ? "Password" : "Palavra-passe"}
                </label>
                <Link
                  href={`/${lang}/recuperar-password`}
                  className="text-[11px] font-black text-[#2563EB] hover:underline no-underline"
                >
                  {isEn ? "Forgot password?" : "Esqueceu a password?"}
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs py-4 rounded-md shadow-md transition-colors cursor-pointer border-0 disabled:opacity-50"
            >
              {loading
                ? isEn
                  ? "Signing in..."
                  : "A entrar..."
                : isEn
                ? "Sign In →"
                : "Entrar na Conta →"}
            </button>
          </form>
        ) : magicEnviado ? (
          <div className="bg-emerald-50 border border-[#16A34A] p-6 rounded-md text-center">
            <span className="text-3xl block mb-2">📬</span>
            <h3 className="text-base font-black text-[#0F172A] mb-1">
              {isEn ? "Check your inbox!" : "Verifique o seu e-mail!"}
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              {isEn
                ? `We sent an instant login link to ${email}. Click it to enter automatically.`
                : `Enviámos um link de acesso direto para ${email}. Basta clicar no link para entrar sem password.`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                {isEn ? "Your Email Address" : "O Seu E-mail"}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.com"
                className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#F59E0B] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F59E0B] hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-md shadow-md transition-colors cursor-pointer border-0 disabled:opacity-50"
            >
              {loading
                ? isEn
                  ? "Sending Link..."
                  : "A enviar link..."
                : isEn
                ? "Send Instant Login Link →"
                : "Receber Link de Acesso no E-mail →"}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs font-bold text-slate-500 m-0">
            {isEn ? "Don't have an account yet?" : "Ainda não tem conta?"}{" "}
            <Link
              href={`/${lang}/registo`}
              className="text-[#2563EB] font-black hover:underline no-underline"
            >
              {isEn ? "Create Free Account" : "Criar Conta Grátis"}
            </Link>
          </p>
          <p className="text-[11px] font-bold text-slate-400 m-0">
            {isEn ? "Are you a camp monitor?" : "É monitor de campos de férias?"}{" "}
            <Link
              href={`/${lang}/monitores/login`}
              className="text-[#16A34A] font-black hover:underline no-underline"
            >
              {isEn ? "Monitor Portal →" : "Portal de Monitores →"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-12 bg-[#F8FAFC] font-sans">
      <Suspense
        fallback={
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">
            A carregar...
          </div>
        }
      >
        <LoginForm lang={lang} />
      </Suspense>
    </main>
  );
}
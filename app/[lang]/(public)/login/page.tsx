"use client";

import React, { useState, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function LoginForm({ lang }: { lang: string }) {
  const isEn = lang === "en";
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo =
    searchParams.get("redirect") || searchParams.get("redirectTo") || "";

  const [modo, setModo] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [magicEnviado, setMagicEnviado] = useState(false);
  const [escolhaSuperAdmin, setEscolhaSuperAdmin] = useState(false);

  const redirecionarAposLogin = async (userId: string, userMetaRole?: string) => {
    if (redirectTo) {
      const cleanRedirect = redirectTo.startsWith("/")
        ? redirectTo
        : `/${lang}/${redirectTo}`;
      router.push(cleanRedirect);
      return;
    }

    const savedRedirect =
      typeof window !== "undefined"
        ? sessionStorage.getItem("redirect_after_login")
        : null;
    if (savedRedirect) {
      sessionStorage.removeItem("redirect_after_login");
      router.push(savedRedirect);
      return;
    }

    const { data: perfil } = await supabase
      .from("perfis")
      .select("role, is_superadmin")
      .eq("id", userId)
      .maybeSingle();

    if (perfil?.is_superadmin) {
      setEscolhaSuperAdmin(true);
      setLoading(false);
      return;
    }

    const role = perfil?.role || userMetaRole || "cliente";

    if (role === "organizador" || role === "parceiro" || role === "admin") {
      router.push(`/${lang}/admin/dashboard`);
    } else if (role === "monitor") {
      router.push(`/${lang}/monitores/portal/perfil`);
    } else {
      router.push(`/${lang}/cliente/dashboard`);
    }
  };

  const handleLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error || !data?.user) {
        setErro(
          isEn
            ? `Invalid email or password. Please check your credentials.`
            : `E-mail ou palavra-passe incorretos. Por favor, verifique os seus dados.`
        );
        setLoading(false);
        return;
      }

      await redirecionarAposLogin(
        data.user.id,
        data.user.user_metadata?.role
      );
    } catch (err: any) {
      setErro(
        err?.message ||
          (isEn ? "Error signing in." : "Ocorreu um erro ao iniciar sessão.")
      );
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "magic_link",
          email: cleanEmail,
          lang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || "Não foi possível enviar o link mágico."
        );
      }

      setMagicEnviado(true);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden">
      {/* BARRA DE CORES OFICIAIS HELLO CAMP */}
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
            {escolhaSuperAdmin
              ? isEn
                ? "Select Workspace"
                : "Escolha o Painel de Acesso"
              : isEn
              ? "Welcome back"
              : "Iniciar Sessão"}
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 mb-0">
            {escolhaSuperAdmin
              ? isEn
                ? "Your account has SuperAdmin and Partner privileges"
                : "A sua conta possui permissões de SuperAdmin HQ e de Parceiro Organizador"
              : isEn
              ? "Access your Family, Partner, or Monitor Portal"
              : "Aceda à sua Área de Família, Parceiro ou Monitor"}
          </p>
        </div>

        {escolhaSuperAdmin ? (
          <div className="space-y-4">
            <Link
              href={`/${lang}/superadmin/parceiros`}
              className="w-full bg-[#0F172A] hover:bg-slate-800 text-white p-5 rounded-md no-underline flex items-center justify-between shadow-md transition-colors border-l-4 border-[#F59E0B]"
            >
              <div>
                <span className="bg-[#F59E0B] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md inline-block mb-1">
                  SuperAdmin HQ
                </span>
                <div className="text-sm font-black text-white">
                  🛡️ Gestão Global da Plataforma (SuperAdmin)
                </div>
              </div>
              <span className="text-xl font-black text-white">&rarr;</span>
            </Link>

            <Link
              href={`/${lang}/admin/dashboard`}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white p-5 rounded-md no-underline flex items-center justify-between shadow-md transition-colors border-l-4 border-[#16A34A]"
            >
              <div>
                <span className="bg-[#16A34A] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md inline-block mb-1">
                  Portal B2B
                </span>
                <div className="text-sm font-black text-white">
                  🏕️ Painel de Parceiro Organizador (Meus Campos)
                </div>
              </div>
              <span className="text-xl font-black text-white">&rarr;</span>
            </Link>
          </div>
        ) : (
          <>
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
                    : "bg-transparent text-slate-600 hover:text-[#0F172A]"
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
                    : "bg-transparent text-slate-600 hover:text-[#0F172A]"
                }`}
              >
                ✨ {isEn ? "Magic Link" : "Link por E-mail"}
              </button>
            </div>

            {erro && (
              <div className="mb-6 p-4 bg-rose-50 border-2 border-[#F43F5E] text-[#F43F5E] rounded-md text-xs font-black leading-relaxed">
                ⚠️ {erro}
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
                    className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
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
                  <div className="relative">
                    <input
                      type={mostrarPass ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md pl-4 pr-16 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPass(!mostrarPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-slate-200 hover:bg-slate-300 text-[#0F172A] text-[10px] font-black uppercase px-2.5 py-1.5 rounded-md cursor-pointer border-0"
                    >
                      {mostrarPass
                        ? isEn
                          ? "Hide"
                          : "Ocultar"
                        : isEn
                        ? "Show"
                        : "Ver"}
                    </button>
                  </div>
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
              <div className="bg-emerald-50 border-2 border-[#16A34A] p-6 rounded-md text-center">
                <span className="text-3xl block mb-2">📬</span>
                <h3 className="text-base font-black text-[#0F172A] mb-1">
                  {isEn ? "Check your inbox!" : "Verifique o seu e-mail!"}
                </h3>
                <p className="text-xs text-slate-600 font-medium m-0">
                  {isEn
                    ? `We sent an instant login link via Resend to ${email}. Click it to enter automatically.`
                    : `Enviámos um link de acesso direto (via Resend) para ${email}. Basta clicar no botão do e-mail para entrar imediatamente!`}
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
                    className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3.5 text-sm font-bold text-[#0F172A] outline-none focus:border-[#F59E0B] focus:bg-white transition-colors"
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
            </div>
          </>
        )}
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
"use client";

import React, { useState, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function RegistoForm({ lang }: { lang: string }) {
  const isEn = lang === "en";
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipoInicial =
    searchParams.get("tipo") === "parceiro" ? "parceiro" : "cliente";

  const [tipoConta, setTipoConta] = useState<"cliente" | "parceiro">(
    tipoInicial
  );
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleRegisto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          nome_completo: nomeCompleto,
          empresa_nome: tipoConta === "parceiro" ? empresaNome : null,
          telefone,
          role: tipoConta,
        },
      },
    });

    if (error || !data.user) {
      setErro(
        error?.message ||
          (isEn
            ? "Could not create account. Please try again."
            : "Não foi possível criar a conta. Verifique os dados.")
      );
      setLoading(false);
      return;
    }

    await supabase.from("perfis").upsert({
      id: data.user.id,
      email: email.trim(),
      nome_completo: nomeCompleto,
      empresa_nome: tipoConta === "parceiro" ? empresaNome : null,
      telefone,
      role: tipoConta,
    });

    if (tipoConta === "parceiro") {
      router.push(`/${lang}/admin/dashboard`);
    } else {
      router.push(`/${lang}/cliente/dashboard`);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden">
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
            {isEn ? "Create your free account" : "Criar Conta Gratuita"}
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1">
            {isEn
              ? "Choose your profile type below"
              : "Selecione abaixo o seu tipo de perfil"}
          </p>
        </div>

        {/* SELETOR DE TIPO DE CONTA */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setTipoConta("cliente")}
            className={`p-3.5 rounded-md text-xs font-black uppercase tracking-wider cursor-pointer border transition-all ${
              tipoConta === "cliente"
                ? "bg-[#2563EB] border-[#2563EB] text-white shadow-md"
                : "bg-[#F8FAFC] border-slate-200 text-slate-600"
            }`}
          >
            👨‍👩‍👧 {isEn ? "Parent / Family" : "Pai / Família"}
          </button>
          <button
            type="button"
            onClick={() => setTipoConta("parceiro")}
            className={`p-3.5 rounded-md text-xs font-black uppercase tracking-wider cursor-pointer border transition-all ${
              tipoConta === "parceiro"
                ? "bg-[#16A34A] border-[#16A34A] text-white shadow-md"
                : "bg-[#F8FAFC] border-slate-200 text-slate-600"
            }`}
          >
            🏢 {isEn ? "Camp Organizer" : "Parceiro Organizador"}
          </button>
        </div>

        {erro && (
          <div className="mb-6 p-4 bg-rose-50 border border-[#F43F5E] text-[#F43F5E] rounded-md text-xs font-bold">
            {erro}
          </div>
        )}

        <form onSubmit={handleRegisto} className="space-y-4">
          {tipoConta === "parceiro" && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn
                  ? "Organization / Brand Name *"
                  : "Nome da Entidade / Marca *"}
              </label>
              <input
                type="text"
                required
                value={empresaNome}
                onChange={(e) => setEmpresaNome(e.target.value)}
                placeholder="Ex: Surf Academy Portugal"
                className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#16A34A] focus:bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
              {isEn ? "Your Full Name *" : "O Seu Nome Completo *"}
            </label>
            <input
              type="text"
              required
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="Ex: Maria Santos"
              className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Email *" : "E-mail *"}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.com"
                className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Phone *" : "Telemóvel *"}
              </label>
              <input
                type="tel"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="+351 910 000 000"
                className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
              {isEn
                ? "Password (min. 6 characters) *"
                : "Palavra-passe (mín. 6 caracteres) *"}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-black uppercase tracking-widest text-xs py-4 rounded-md shadow-md transition-colors cursor-pointer border-0 disabled:opacity-50 mt-2 ${
              tipoConta === "parceiro"
                ? "bg-[#16A34A] hover:bg-emerald-700"
                : "bg-[#F59E0B] hover:bg-amber-600"
            }`}
          >
            {loading
              ? isEn
                ? "Creating account..."
                : "A criar conta..."
              : tipoConta === "parceiro"
              ? isEn
                ? "Create Partner Account →"
                : "Criar Conta de Parceiro →"
              : isEn
              ? "Create Family Account →"
              : "Criar Conta de Família →"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs font-bold text-slate-500 m-0">
            {isEn ? "Already have an account?" : "Já tem conta na HelloCamp?"}{" "}
            <Link
              href={`/${lang}/login`}
              className="text-[#2563EB] font-black hover:underline no-underline"
            >
              {isEn ? "Sign In" : "Iniciar Sessão"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegistoUnificado({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-12 font-sans bg-[#F8FAFC] relative overflow-hidden">
      <Suspense
        fallback={
          <div className="w-full flex justify-center py-20 text-slate-400 font-bold tracking-widest uppercase">
            A carregar...
          </div>
        }
      >
        <RegistoForm lang={lang} />
      </Suspense>
    </main>
  );
}
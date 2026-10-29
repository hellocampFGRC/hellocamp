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
  const [modoParceiro, setModoParceiro] = useState<"autonomo" | "concierge">(
    "autonomo"
  );

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [notasCampos, setNotasCampos] = useState("");
  const [ficheiros, setFicheiros] = useState<FileList | null>(null);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [conciergeSucesso, setConciergeSucesso] = useState(false);

  const handleRegistoAutonomo = async (e: React.FormEvent) => {
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

  const handleEnviarConcierge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const urlsDocumentos: string[] = [];
      if (ficheiros && ficheiros.length > 0) {
        for (let i = 0; i < ficheiros.length; i++) {
          const file = ficheiros[i];
          const ext = file.name.split(".").pop();
          const fileName = `registo_concierge_${Date.now()}_${i}.${ext}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("documentos-parceiros")
            .upload(fileName, file);

          if (!uploadError && uploadData) {
            const { data: pub } = supabase.storage
              .from("documentos-parceiros")
              .getPublicUrl(fileName);
            if (pub?.publicUrl) urlsDocumentos.push(pub.publicUrl);
          }
        }
      }

      await fetch("/api/notificar-reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "onboarding_parceiro",
          parceiroEmail: "info@hellocamp.pt",
          campoNome: `Pedido de Criação de Conta & Campos: ${empresaNome}`,
          lang,
          lead: {
            nome: nomeCompleto,
            email: email.trim(),
            telefone,
            empresa: empresaNome,
            website,
            mensagem: notasCampos,
            documentos: urlsDocumentos,
          },
        }),
      });

      setConciergeSucesso(true);
    } catch (err) {
      setErro(
        isEn
          ? "Error sending documents. Please email info@hellocamp.pt."
          : "Erro ao enviar. Pode enviar diretamente para info@hellocamp.pt."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden">
      <div className="w-full h-2.5 flex">
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
              ? "Select your profile type below"
              : "Selecione abaixo o seu tipo de perfil"}
          </p>
        </div>

        {/* SELETOR FAMÍLIA vs PARCEIRO */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              setTipoConta("cliente");
              setErro("");
            }}
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
            onClick={() => {
              setTipoConta("parceiro");
              setErro("");
            }}
            className={`p-3.5 rounded-md text-xs font-black uppercase tracking-wider cursor-pointer border transition-all ${
              tipoConta === "parceiro"
                ? "bg-[#16A34A] border-[#16A34A] text-white shadow-md"
                : "bg-[#F8FAFC] border-slate-200 text-slate-600"
            }`}
          >
            🏢 {isEn ? "Camp Organizer" : "Parceiro Organizador"}
          </button>
        </div>

        {/* SE FOR PARCEIRO: PERMITE ESCOLHER ENTRE CRIAR SOZINHO OU ENVIAR DOCUMENTOS PARA A EQUIPA CRIAR */}
        {tipoConta === "parceiro" && (
          <div className="mb-6 bg-[#F8FAFC] p-3 rounded-md border border-slate-200">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 text-center">
              {isEn
                ? "How do you prefer to set up your camps?"
                : "Como prefere configurar os seus campos?"}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModoParceiro("autonomo")}
                className={`py-2.5 px-3 rounded-md text-[11px] font-black uppercase tracking-wider cursor-pointer border-0 transition-all ${
                  modoParceiro === "autonomo"
                    ? "bg-[#16A34A] text-white shadow-sm"
                    : "bg-white text-slate-600"
                }`}
              >
                ⚡ {isEn ? "Create Portal Myself" : "Criar Conta Autónoma"}
              </button>
              <button
                type="button"
                onClick={() => setModoParceiro("concierge")}
                className={`py-2.5 px-3 rounded-md text-[11px] font-black uppercase tracking-wider cursor-pointer border-0 transition-all ${
                  modoParceiro === "concierge"
                    ? "bg-[#F59E0B] text-white shadow-sm"
                    : "bg-white text-slate-600"
                }`}
              >
                📎{" "}
                {isEn
                  ? "Send Files (We Build It)"
                  : "Enviar Dados (Nós Criamos)"}
              </button>
            </div>
          </div>
        )}

        {erro && (
          <div className="mb-6 p-4 bg-rose-50 border border-[#F43F5E] text-[#F43F5E] rounded-md text-xs font-bold">
            {erro}
          </div>
        )}

        {tipoConta === "parceiro" && modoParceiro === "concierge" ? (
          conciergeSucesso ? (
            <div className="bg-emerald-50 border-2 border-[#16A34A] rounded-md p-6 text-center">
              <div className="w-12 h-12 bg-[#16A34A] text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-3">
                ✓
              </div>
              <h3 className="text-lg font-black text-[#0F172A] mb-2">
                {isEn
                  ? "Received! We are building your profile."
                  : "Recebido! Vamos criar o seu perfil e campos."}
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                {isEn
                  ? "Our team will configure your showcase and send your login credentials within 24 hours."
                  : "A nossa equipa vai configurar toda a sua página e enviar-lhe os dados de acesso em menos de 24 horas."}
              </p>
              <button
                type="button"
                onClick={() => setConciergeSucesso(false)}
                className="bg-[#2563EB] text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-md border-0 cursor-pointer"
              >
                {isEn ? "Send More Files" : "Enviar Mais Ficheiros"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleEnviarConcierge} className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-[#F59E0B] rounded-md text-xs font-bold text-[#0F172A]">
                💡{" "}
                {isEn
                  ? "Leave your details and attach your brochures/PDFs below. Our team will build your entire profile and camps for you!"
                  : "Preencha os dados abaixo e anexe os seus folhetos/PDFs ou links. A nossa equipa cria o seu perfil e todos os campos por si!"}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {isEn ? "Organization / Brand Name *" : "Nome da Entidade / Marca *"}
                </label>
                <input
                  type="text"
                  required
                  value={empresaNome}
                  onChange={(e) => setEmpresaNome(e.target.value)}
                  placeholder="Ex: Surf Academy Portugal"
                  className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    {isEn ? "Contact Name *" : "O Seu Nome *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="João Silva"
                    className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    {isEn ? "Phone *" : "Telemóvel *"}
                  </label>
                  <input
                    type="tel"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="+351 910 000 000"
                    className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    {isEn ? "Email *" : "E-mail *"}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="geral@campo.pt"
                    className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    {isEn ? "Website / Instagram" : "Website / Instagram"}
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#F59E0B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {isEn
                    ? "Camp Details, Dates, Prices or Notes"
                    : "Informação dos Campos, Datas, Preços ou Notas"}
                </label>
                <textarea
                  rows={4}
                  value={notasCampos}
                  onChange={(e) => setNotasCampos(e.target.value)}
                  placeholder={
                    isEn
                      ? "Paste your camp dates, prices, ages, or instructions..."
                      : "Cole aqui os detalhes dos seus campos (datas, preços, idades, descrição) para nós preenchermos tudo por si..."
                  }
                  className="w-full bg-[#F8FAFC] border border-slate-300 rounded-md p-3.5 text-sm font-medium text-[#0F172A] outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="bg-[#F8FAFC] border-2 border-dashed border-[#F59E0B] rounded-md p-4">
                <label className="block text-[11px] font-black uppercase tracking-widest text-[#0F172A] mb-1.5">
                  📎{" "}
                  {isEn
                    ? "Attach PDFs, Brochures, Word or Logo"
                    : "Anexar Documentos (PDFs, Folhetos, Preçários ou Logo)"}
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setFicheiros(e.target.files)}
                  className="block w-full text-xs text-slate-700 font-bold file:mr-3 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-black file:uppercase file:bg-[#F59E0B] file:text-white hover:file:bg-amber-600 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F59E0B] hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-md shadow-md transition-colors cursor-pointer border-0 disabled:opacity-50"
              >
                {loading
                  ? isEn
                    ? "Sending files..."
                    : "A enviar dados e documentos..."
                  : isEn
                  ? "Send to HelloCamp Team →"
                  : "Enviar para a HelloCamp Configurar Por Mim →"}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleRegistoAutonomo} className="space-y-4">
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
        )}

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
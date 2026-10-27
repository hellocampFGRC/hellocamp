"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function FormContactoCampo({
  campoId,
  organizadorId,
  nomeCampo,
  dict,
  isEn,
  lang,
}: any) {
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    apelido: "",
    email: "",
    telefone: "",
    idade: "",
    mensagem: "",
  });

  // Se o pai já estiver logado, pré-preenche os dados para facilitar!
  useEffect(() => {
    const prefillUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;
      setIsLogged(true);

      const { data: perfil } = await supabase
        .from("perfis")
        .select("nome_completo, email, telefone")
        .eq("id", session.user.id)
        .maybeSingle();

      const partesNome = (
        perfil?.nome_completo ||
        session.user.user_metadata?.nome_completo ||
        ""
      ).split(" ");
      setForm((prev) => ({
        ...prev,
        nome: partesNome[0] || "",
        apelido: partesNome.slice(1).join(" ") || "",
        email: perfil?.email || session.user.email || "",
        telefone: perfil?.telefone || "",
      }));
    };
    prefillUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("First_Name", form.nome);
      formData.append("Last_Name", form.apelido);
      formData.append("Email", form.email);
      formData.append("Phone", form.telefone);
      formData.append("Age", form.idade);
      formData.append("Message", form.mensagem);
      formData.append(
        "_subject",
        isEn
          ? `New Question regarding ${nomeCampo} - HelloCamp`
          : `Nova Dúvida sobre ${nomeCampo} - HelloCamp`
      );
      formData.append("campo_id", String(campoId || ""));
      formData.append("organizador_id", String(organizadorId || ""));
      formData.append("lang", lang || "pt");

      const res = await fetch("/api/enviar-duvida", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao enviar mensagem.");
      }

      setSucesso(true);
      setForm((prev) => ({ ...prev, mensagem: "" }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center">
        <span className="text-4xl block mb-3">✅</span>
        <h4 className="text-base font-black text-[#167524] m-0 mb-1">
          {isEn
            ? "Message Sent to Organizer!"
            : "Mensagem Enviada ao Organizador!"}
        </h4>
        <p className="text-xs text-slate-600 m-0 mb-4 leading-relaxed">
          {isEn
            ? "The camp organizer received your question and will reply to your email and in your HelloCamp Inbox."
            : "O organizador já recebeu a sua questão na Inbox e responderá para o seu e-mail e no seu Portal de Cliente."}
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setSucesso(false)}
            className="px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-[#167524] cursor-pointer"
          >
            {isEn ? "Send another question" : "Enviar outra questão"}
          </button>
          {isLogged && (
            <Link
              href={`/${lang}/cliente/mensagens`}
              className="px-5 py-2.5 bg-[#0E3A68] text-white rounded-xl text-xs font-black uppercase tracking-widest no-underline"
            >
              {isEn ? "Open My Inbox" : "Ver nas Minhas Mensagens"}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
            {isEn ? "First Name *" : "Primeiro Nome *"}
          </label>
          <input
            type="text"
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
            {isEn ? "Last Name" : "Apelido"}
          </label>
          <input
            type="text"
            value={form.apelido}
            onChange={(e) => setForm({ ...form, apelido: e.target.value })}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
            E-mail *
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
            {isEn ? "Phone *" : "Telemóvel *"}
          </label>
          <input
            type="tel"
            required
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
            {isEn ? "Child's Age" : "Idade do Participante"}
          </label>
          <input
            type="number"
            min="3"
            max="22"
            value={form.idade}
            onChange={(e) => setForm({ ...form, idade: e.target.value })}
            placeholder={isEn ? "e.g., 10" : "Ex: 10"}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
          {isEn ? "Your Question *" : "A sua Mensagem / Dúvida *"}
        </label>
        <textarea
          rows={4}
          required
          value={form.mensagem}
          onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
          placeholder={
            isEn
              ? "Write your question to the camp organizer..."
              : "Escreva aqui a sua dúvida sobre horários, vagas, alimentação ou atividades..."
          }
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-8 py-4 bg-[#0E3A68] hover:bg-[#0b2b4d] disabled:bg-slate-300 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-md cursor-pointer transition-all"
      >
        {loading
          ? isEn
            ? "Sending..."
            : "A enviar..."
          : isEn
          ? "Send Question to Organizer"
          : "Enviar Dúvida ao Organizador"}
      </button>
    </form>
  );
}
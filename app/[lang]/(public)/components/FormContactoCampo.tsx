"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function FormContactoCampo({ 
  campoId, 
  organizadorId, 
  nomeCampo, 
  dict, 
  isEn, 
  lang 
}: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const [form, setForm] = useState({
    nome: "", apelido: "", email: "", telefone: "", idade: "", mensagem: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Usamos FormData para corresponder ao que a tua API espera
      const formData = new FormData();
      formData.append('First_Name', form.nome);
      formData.append('Last_Name', form.apelido);
      formData.append('Email', form.email);
      formData.append('Phone', form.telefone);
      formData.append('Age', form.idade);
      formData.append('Message', form.mensagem);
      formData.append('campo_id', campoId);
      formData.append('organizador_id', organizadorId || '');
      formData.append('_subject', `Nova Questão: ${nomeCampo}`);
      formData.append('lang', lang);

      const response = await fetch('/api/enviar-duvida', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro no servidor");
      }

      setSucesso(true);
      
      // VERIFICAÇÃO DE SESSÃO: Só reencaminha se o utilizador estiver autenticado
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Encaminha para a nova rota correta da área de cliente
        setTimeout(() => {
          router.push(`/${lang}/cliente/mensagens`);
        }, 2500);
      }
      // Se não tiver sessão (session for nulo), o código não faz nada 
      // e o utilizador fica simplesmente a ver a mensagem de sucesso.

    } catch (err) {
      console.error(err);
      alert(isEn ? "Technical error. Try again later." : "Houve um erro técnico. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
        <span className="text-5xl mb-4 block">✅</span>
        <h4 className="text-xl font-black text-emerald-800 mb-2">
          {isEn ? 'Message Sent Successfully!' : 'Mensagem Enviada com Sucesso!'}
        </h4>
        <p className="text-emerald-700 font-medium">
          {isEn 
            ? 'The camp organizer will review your question. They will reply to your email shortly.' 
            : 'A sua mensagem foi enviada diretamente para o Organizador. Responderão para o seu e-mail o mais breve possível.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.nome}</label>
          <input type="text" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.apelido}</label>
          <input type="text" required value={form.apelido} onChange={e => setForm({...form, apelido: e.target.value})} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.email_encarregado}</label>
          <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.contacto_telefonico}</label>
          <input type="tel" required value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.idade_participante}</label>
        <input type="number" min="1" required value={form.idade} onChange={e => setForm({...form, idade: e.target.value})} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{dict.detalhe.mensagem}</label>
        <textarea rows={4} required value={form.mensagem} onChange={e => setForm({...form, mensagem: e.target.value})} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors resize-none"></textarea>
      </div>
      
      <button type="submit" disabled={loading} className="self-start px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm transition-colors shadow-sm cursor-pointer">
        {loading ? (isEn ? 'Sending...' : 'A enviar...') : dict.detalhe.enviar_mensagem}
      </button>
    </form>
  );
}
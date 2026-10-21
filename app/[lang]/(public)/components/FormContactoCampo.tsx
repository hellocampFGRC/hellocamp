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
      // 1. VERIFICAR SESSÃO DO UTILIZADOR PARA O SENDER_ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      // 2. PREPARAR O TEXTO DA MENSAGEM PARA A BASE DE DADOS
      // Agrupamos os dados de contacto no texto, já que a tabela não tem colunas para nome/email
      const textoMensagem = `Formulário de Contacto: ${nomeCampo}
Nome: ${form.nome} ${form.apelido}
Email: ${form.email}
Telefone: ${form.telefone}
Idade do Participante: ${form.idade}

Mensagem:
${form.mensagem}`;

      // 3. GUARDAR A MENSAGEM NA TABELA "mensagens" NO SUPABASE
      const { error: dbError } = await supabase.from('mensagens').insert([
        {
          campo_id: campoId || null,
          receiver_id: organizadorId || null,
          sender_id: userId,
          texto: textoMensagem,
          lida: false
        }
      ]);

      if (dbError) {
        console.error("Erro ao guardar na base de dados:", dbError);
        throw new Error("Erro a guardar mensagem na base de dados.");
      }

      // 4. ENVIAR O EMAIL VIA API
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
        throw new Error("Erro no servidor de email");
      }

      setSucesso(true);
      
      // 5. REENCAMINHAR SE TIVER SESSÃO
      if (session) {
        setTimeout(() => {
          router.push(`/${lang}/cliente/mensagens`);
        }, 2500);
      }

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
            : 'A sua mensagem foi guardada e enviada diretamente para o Organizador. Responderão para o seu e-mail o mais breve possível.'}
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
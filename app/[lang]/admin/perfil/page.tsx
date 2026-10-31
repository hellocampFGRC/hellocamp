"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPerfilPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const [form, setForm] = useState({
    empresa_nome: "",
    logotipo_url: "",
    ano_fundacao: "",
    website: "",
    email_publico: "",
    telefone_publico: "",
    morada_sede: "",
    descricao: "",
    descricao_en: "",
  });

  useEffect(() => {
    const fetchPerfil = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${lang}/login`);
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      const { data: perfil } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", uid)
        .single();

      if (perfil) {
        setForm({
          empresa_nome: perfil.empresa_nome || perfil.nome_empresa || perfil.nome || "",
          logotipo_url: perfil.logotipo_url || "",
          ano_fundacao: perfil.ano_fundacao ? String(perfil.ano_fundacao) : "",
          website: perfil.website || "",
          email_publico: perfil.email_publico || perfil.email || "",
          telefone_publico: perfil.telefone_publico || perfil.telefone || "",
          morada_sede: perfil.morada_sede || "",
          descricao: perfil.descricao || perfil.biografia_empresa || "",
          descricao_en: perfil.descricao_en || perfil.biografia_empresa_en || "",
        });
      }
      setLoading(false);
    };

    fetchPerfil();
  }, [lang, router]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `logo_${userId}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("campos-imagens")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("campos-imagens")
        .getPublicUrl(fileName);

      if (publicUrlData?.publicUrl) {
        setForm((prev) => ({ ...prev, logotipo_url: publicUrlData.publicUrl }));
      }
    } catch (err: any) {
      alert("Erro ao carregar logótipo: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("perfis")
        .update({
          empresa_nome: form.empresa_nome,
          nome_empresa: form.empresa_nome,
          logotipo_url: form.logotipo_url || null,
          ano_fundacao: form.ano_fundacao ? Number(form.ano_fundacao) : null,
          website: form.website || null,
          email_publico: form.email_publico || null,
          telefone_publico: form.telefone_publico || null,
          morada_sede: form.morada_sede || null,
          descricao: form.descricao || null,
          biografia_empresa: form.descricao || null,
          descricao_en: form.descricao_en || form.descricao || null,
          biografia_empresa_en: form.descricao_en || form.descricao || null,
        })
        .eq("id", userId);

      if (error) throw error;
      alert(isEn ? "Profile updated successfully!" : "Perfil e montra pública atualizados com sucesso!");
    } catch (err: any) {
      alert("Erro ao atualizar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-black text-xs uppercase tracking-widest text-slate-400 animate-pulse">
        {isEn ? "Loading profile..." : "A carregar perfil..."}
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto font-sans text-[#0F172A] pb-24 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/${lang}/admin/dashboard`} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#0F172A] no-underline">
          &larr; {isEn ? "Back to Dashboard" : "Voltar ao Dashboard"}
        </Link>
        {userId && (
          <Link href={`/${lang}/parceiro/${userId}`} target="_blank" className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-md no-underline">
            👁️ {isEn ? "View Public Showcase ↗" : "Ver Montra Pública ↗"}
          </Link>
        )}
      </div>

      <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm">
        <div className="mb-8 pb-6 border-b border-slate-100">
          <span className="bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block mb-2">
            {isEn ? "Partner Profile" : "Perfil e Marca"}
          </span>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight m-0">
            {isEn ? "Manage Organization Profile & Logo" : "Gerir Perfil, Logótipo e Montra Pública"}
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1 mb-0">
            {isEn ? "This information is displayed publicly to parents and schools on your HelloCamp showcase." : "Estes dados aparecem visíveis às famílias e escolas na sua página pública oficial."}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* LOGÓTIPO */}
            <div className="md:col-span-4 bg-[#F8FAFC] p-5 rounded-md border border-slate-200 text-center">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                {isEn ? "Official Logo" : "Logótipo Oficial"}
              </label>
              <div className="w-28 h-28 mx-auto bg-white border border-slate-300 rounded-md flex items-center justify-center p-2 mb-4 overflow-hidden shadow-inner">
                {form.logotipo_url ? (
                  <img src={form.logotipo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-3xl">🏢</span>
                )}
              </div>

              <label className="inline-block bg-[#2563EB] hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-md cursor-pointer">
                {uploading ? (isEn ? "Uploading..." : "A carregar...") : (isEn ? "📤 Upload Logo" : "📤 Carregar Imagem")}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>

            {/* CAMPOS DE TEXTO */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {isEn ? "Organization Name *" : "Nome da Organização / Marca *"}
                </label>
                <input
                  required
                  value={form.empresa_nome}
                  onChange={(e) => setForm({ ...form, empresa_nome: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-sm font-bold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {isEn ? "Founded Year" : "Ano de Fundação"}
                </label>
                <input
                  type="number"
                  value={form.ano_fundacao}
                  onChange={(e) => setForm({ ...form, ano_fundacao: e.target.value })}
                  placeholder="Ex: 2010"
                  className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-sm font-bold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Website
                </label>
                <input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-sm font-bold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {isEn ? "Public Email" : "E-mail Público"}
                </label>
                <input
                  type="email"
                  value={form.email_publico}
                  onChange={(e) => setForm({ ...form, email_publico: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-sm font-bold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {isEn ? "Public Phone" : "Telefone Público"}
                </label>
                <input
                  value={form.telefone_publico}
                  onChange={(e) => setForm({ ...form, telefone_publico: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-sm font-bold text-[#0F172A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {isEn ? "Headquarters Location" : "Localização / Sede"}
                </label>
                <input
                  value={form.morada_sede}
                  onChange={(e) => setForm({ ...form, morada_sede: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-[#F8FAFC] border border-slate-300 rounded-md text-sm font-bold text-[#0F172A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {isEn ? "Biography / Description (Portuguese)" : "Biografia / Descrição da Organização (Português)"}
                </label>
                <textarea
                  rows={4}
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {isEn ? "Biography / Description (English)" : "Biografia / Descrição da Organização (Inglês)"}
                </label>
                <textarea
                  rows={4}
                  value={form.descricao_en}
                  onChange={(e) => setForm({ ...form, descricao_en: e.target.value })}
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-md cursor-pointer border-0 shadow-md"
            >
              {saving ? (isEn ? "Saving..." : "A guardar...") : (isEn ? "✓ Save Profile" : "✓ Guardar Perfil e Montra")}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
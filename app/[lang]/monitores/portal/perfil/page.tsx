"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

export default function GestaoPerfilMonitorPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nome_completo: "",
    data_nascimento: "",
    telefone: "",
    email: "",
    distrito_residencia: "",
    experiencia_anos: "0",
    bio: "",
    fotografia_url: "",
    cv_url: ""
  });

  const [certificacoes, setCertificacoes] = useState<string[]>([]);
  const [disponibilidade, setDisponibilidade] = useState<string[]>([]);

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];
  
  const listaCertificados = [
    { id: "IPDJ", pt: "Monitor de Campos de Férias (IPDJ)", en: "Camp Monitor (IPDJ)" },
    { id: "Socorrismo", pt: "Primeiros Socorros", en: "First Aid" },
    { id: "Nadador", pt: "Nadador Salvador", en: "Lifeguard" },
    { id: "Professor", pt: "Formação em Educação / Desporto", en: "Education / Sports Degree" }
  ];

  const listaEpocas = [
    { id: "Pascoa", pt: "Férias da Páscoa", en: "Easter Break" },
    { id: "Verao", pt: "Férias de Verão", en: "Summer Holidays" },
    { id: "Natal", pt: "Férias de Natal", en: "Christmas Break" }
  ];

  useEffect(() => {
    const carregarPerfil = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('monitores')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data && !error) {
        setFormData({
          nome_completo: data.nome_completo || "",
          data_nascimento: data.data_nascimento || "",
          telefone: data.telefone || "",
          email: data.email || "",
          distrito_residencia: data.distrito_residencia || "",
          experiencia_anos: data.experiencia_anos || "0",
          bio: data.bio || "",
          fotografia_url: data.fotografia_url || "",
          cv_url: data.cv_url || ""
        });
        setCertificacoes(data.certificacoes || []);
        setDisponibilidade(data.disponibilidade || []);
      }
      setLoading(false);
    };

    carregarPerfil();
  }, []);

  const handleCheckboxChange = (id: string, tipo: "cert" | "disp") => {
    if (tipo === "cert") {
      setCertificacoes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else {
      setDisponibilidade(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
  };

  const handleAtualizarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload = {
      ...formData,
      certificacoes,
      disponibilidade
    };

    const { error } = await supabase
      .from("monitores")
      .update(payload)
      .eq('id', session.user.id);

    if (error) {
      alert(isEn ? "Error updating profile." : "Erro ao atualizar perfil: " + error.message);
    } else {
      alert(isEn ? "Profile updated successfully!" : "Perfil atualizado com sucesso!");
    }
    setSaving(false);
  };

  const labelClass = "text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block";
  const inputClass = "w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm";
  const selectClass = "w-full py-2.5 px-3 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 appearance-none cursor-pointer transition-all shadow-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_auto] bg-[position:right_1rem_center] bg-no-repeat";

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">A carregar perfil...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight m-0">
            {isEn ? "My Monitor Profile" : "O Meu Currículo"}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {isEn ? "Keep your availability and contacts up to date." : "Mantenha a sua disponibilidade atualizada para receber convites dos campos."}
          </p>
        </div>
        <button 
          onClick={handleAtualizarPerfil}
          disabled={saving}
          className="bg-blue-600 text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
        >
          {saving ? (isEn ? "Saving..." : "A guardar...") : (isEn ? "Save Changes" : "Guardar Alterações")}
        </button>
      </div>

      <form onSubmit={handleAtualizarPerfil} className="space-y-6">
        
        {/* Cartão 1: Foto e Pitch */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-blue-50 shadow-inner overflow-hidden flex items-center justify-center flex-shrink-0">
              {formData.fotografia_url ? (
                <img src={formData.fotografia_url} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🧑‍🏫</span>
              )}
            </div>
            <div className="w-full">
               <label className="text-[9px] font-black uppercase tracking-widest text-center text-slate-400 block mb-1">Link da Foto</label>
               <input type="url" className={`${inputClass} text-xs text-center`} value={formData.fotografia_url} onChange={e => setFormData({...formData, fotografia_url: e.target.value})} placeholder="https://..." />
            </div>
          </div>
          
          <div className="flex-1">
            <label className={labelClass}>{isEn ? "Short Bio / Presentation" : "Apresentação Breve (Bio)"}</label>
            <textarea 
              rows={4} 
              required 
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm resize-none" 
              value={formData.bio} 
              onChange={e => setFormData({...formData, bio: e.target.value})} 
              placeholder={isEn ? "Tell us about your experience..." : "O que te torna um excelente monitor para campos de férias?"} 
            />
          </div>
        </div>

        {/* Cartão 2: Dados Básicos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>{isEn ? "Full Name" : "Nome Completo"}</label>
            <input type="text" required className={inputClass} value={formData.nome_completo} onChange={e => setFormData({...formData, nome_completo: e.target.value})} />
          </div>
          <div>
            <label className={labelClass}>{isEn ? "Email Address" : "E-mail"}</label>
            <input type="email" required className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <label className={labelClass}>{isEn ? "Phone Number" : "Telefone"}</label>
            <input type="tel" required className={inputClass} value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
          </div>
          <div>
            <label className={labelClass}>{isEn ? "District" : "Distrito"}</label>
            <select required className={selectClass} value={formData.distrito_residencia} onChange={e => setFormData({...formData, distrito_residencia: e.target.value})}>
              <option value="">{isEn ? "Select..." : "Selecionar..."}</option>
              {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{isEn ? "Experience" : "Anos de Experiência"}</label>
            <select className={selectClass} value={formData.experiencia_anos} onChange={e => setFormData({...formData, experiencia_anos: e.target.value})}>
              <option value="0">{isEn ? "First Time" : "Nenhuma / Primeira vez"}</option>
              <option value="1-2">1-2 {isEn ? "years" : "anos"}</option>
              <option value="3-5">3-5 {isEn ? "years" : "anos"}</option>
              <option value="+5">+5 {isEn ? "years" : "anos"}</option>
            </select>
          </div>
        </div>

        {/* Cartão 3: Disponibilidade e Certificados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-4">{isEn ? "Availability" : "Disponibilidade Sazonal"}</h3>
            <div className="flex flex-col gap-3">
              {listaEpocas.map(e => (
                <label key={e.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors select-none ${disponibilidade.includes(e.id) ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <input type="checkbox" checked={disponibilidade.includes(e.id)} onChange={() => handleCheckboxChange(e.id, "disp")} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                  <span className="text-xs font-bold text-slate-700">{isEn ? e.en : e.pt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-4">{isEn ? "Certificates" : "Certificações"}</h3 >
            <div className="flex flex-col gap-3">
              {listaCertificados.map(c => (
                <label key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors select-none ${certificacoes.includes(c.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <input type="checkbox" checked={certificacoes.includes(c.id)} onChange={() => handleCheckboxChange(c.id, "cert")} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                  <span className="text-xs font-bold text-slate-700">{isEn ? c.en : c.pt}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

      </form>
    </div>
  );
}
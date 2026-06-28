"use client";

import React, { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegistoMonitorPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
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
    { id: "Socorrismo", pt: "Primeiros Socorros / Socorrismo", en: "First Aid" },
    { id: "Nadador", pt: "Nadador Salvador", en: "Lifeguard" },
    { id: "Professor", pt: "Formação em Educação / Desporto", en: "Education / Sports Degree" }
  ];

  const listaEpocas = [
    { id: "Pascoa", pt: "Férias da Páscoa", en: "Easter Break" },
    { id: "Verao", pt: "Férias de Verão (Época Alta)", en: "Summer Holidays" },
    { id: "Natal", pt: "Férias de Natal", en: "Christmas Break" }
  ];

  const handleCheckboxChange = (id: string, tipo: "cert" | "disp") => {
    if (tipo === "cert") {
      setCertificacoes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else {
      setDisponibilidade(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert(isEn ? "Please log in or create an account first." : "Por favor, inicie sessão ou crie uma conta primeiro.");
      router.push(`/${lang}/login?redirectTo=monitores/registo`);
      setSubmitting(false);
      return;
    }

    const payload = {
      id: session.user.id,
      ...formData,
      certificacoes,
      disponibilidade
    };

    const { error } = await supabase.from("monitores").insert([payload]);

    if (error) {
      alert(isEn ? "Error saving profile: " : "Erro ao guardar perfil: " + error.message);
      setSubmitting(false);
    } else {
      alert(isEn ? "Profile published successfully!" : "Perfil publicado com sucesso na Bolsa de Monitores!");
      router.push(`/${lang}/monitores/sucesso`);
    }
  };

  const labelClass = "text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block";
  const inputClass = "w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all shadow-sm";
  const selectClass = "w-full py-3 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 appearance-none cursor-pointer transition-all shadow-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_auto] bg-[position:right_1.25rem_center] bg-no-repeat";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 md:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden">
        
        {/* BANNER SUPERIOR */}
        <div className="bg-emerald-900 text-white p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-800/50 px-4 py-2 rounded-full border border-emerald-700/50">
            {isEn ? "Join our Network" : "Bolsa de Talentos HelloCamp"}
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-6 mb-3">
            {isEn ? "Promote Yourself as a Camp Monitor" : "Trabalha em Campos de Férias"}
          </h1>
          <p className="text-sm md:text-base text-emerald-100 font-medium m-0 leading-relaxed max-w-xl">
            {isEn 
              ? "Publish your availability, experience, and certificates so hundreds of verified camps can find and hire you directly." 
              : "Cria o teu perfil, define a tua disponibilidade e competências, e sê encontrado diretamente pelas centenas de entidades organizadoras que usam a nossa plataforma."}
          </p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
          
          {/* SECÇÃO 1: Identificação Basica */}
          <div>
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-5">
              {isEn ? "1. Personal Information" : "1. Informação Pessoal"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className={labelClass}>{isEn ? "Full Name" : "Nome Completo"}</label>
                <input type="text" required className={inputClass} value={formData.nome_completo} onChange={e => setFormData({...formData, nome_completo: e.target.value})} placeholder="Ex: João Silva Martins" />
              </div>
              <div>
                <label className={labelClass}>{isEn ? "Date of Birth" : "Data de Nascimento"}</label>
                <input type="date" required className={inputClass} value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>{isEn ? "Phone Number" : "Contacto Telefónico"}</label>
                <input type="tel" required className={inputClass} value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} placeholder="912 345 678" />
              </div>
              <div>
                <label className={labelClass}>{isEn ? "Email Address" : "E-mail de Contacto"}</label>
                <input type="email" required className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="joao.martins@email.com" />
              </div>
              <div className="relative">
                <label className={labelClass}>{isEn ? "District of Residence" : "Distrito de Residência"}</label>
                <select required className={selectClass} value={formData.distrito_residencia} onChange={e => setFormData({...formData, distrito_residencia: e.target.value})}>
                  <option value="">{isEn ? "Select..." : "Selecionar..."}</option>
                  {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* SECÇÃO 2: Experiência e Certificados */}
          <div>
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-5">
              {isEn ? "2. Qualifications & Experience" : "2. Qualificações e Experiência"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end mb-6">
              <div className="sm:col-span-1 relative">
                <label className={labelClass}>{isEn ? "Years of Experience" : "Anos de Experiência"}</label>
                <select className={selectClass} value={formData.experiencia_anos} onChange={e => setFormData({...formData, experiencia_anos: e.target.value})}>
                  <option value="0">{isEn ? "First Time / No experience" : "Nenhuma / Primeira vez"}</option>
                  <option value="1-2">1-2 {isEn ? "years" : "anos"}</option>
                  <option value="3-5">3-5 {isEn ? "years" : "anos"}</option>
                  <option value="+5">+5 {isEn ? "years" : "anos"}</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{isEn ? "Photo URL (Optional)" : "Hiperligação da tua Foto (Opcional)"}</label>
                <input type="url" className={inputClass} value={formData.fotografia_url} onChange={e => setFormData({...formData, fotografia_url: e.target.value})} placeholder="https://..." />
              </div>
            </div>

            {/* Checkboxes de Certificações */}
            <div className="mb-4">
              <label className={labelClass}>{isEn ? "Certificates & Training" : "Certificações e Formações Extra"}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {listaCertificados.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <input type="checkbox" checked={certificacoes.includes(c.id)} onChange={() => handleCheckboxChange(c.id, "cert")} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                    <span className="text-sm font-bold text-slate-700">{isEn ? c.en : c.pt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* SECÇÃO 3: Disponibilidade e Apresentação */}
          <div>
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-5">
              {isEn ? "3. Availability & Pitch" : "3. Disponibilidade e Apresentação"}
            </h3>
            
            <div className="mb-6">
              <label className={labelClass}>{isEn ? "When are you available to work?" : "Em que interrupções letivas podes trabalhar?"}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                {listaEpocas.map(e => (
                  <label key={e.id} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <input type="checkbox" checked={disponibilidade.includes(e.id)} onChange={() => handleCheckboxChange(e.id, "disp")} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                    <span className="text-sm font-bold text-slate-700">{isEn ? e.en : e.pt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>{isEn ? "Short Bio / Pitch" : "A tua Bio / Carta de Apresentação (O que os campos vão ler)"}</label>
              <textarea rows={4} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all shadow-sm resize-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder={isEn ? "Tell us about your experience with children, your skills, motivations..." : "Conta-nos um pouco sobre a tua experiência a liderar grupos de miúdos, os teus pontos fortes, hobbies úteis para campos, etc..."} />
            </div>
          </div>

          {/* BOTÃO SUBMIT */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button type="submit" disabled={submitting} className="w-full sm:w-auto bg-emerald-600 text-white font-black uppercase tracking-widest text-xs px-10 py-4 rounded-xl shadow-lg hover:bg-emerald-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none cursor-pointer">
              {submitting ? (isEn ? "Publishing..." : "A publicar...") : (isEn ? "Publish Profile" : "Publicar o meu Perfil")}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}
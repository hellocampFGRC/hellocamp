"use client";

import React, { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegistoMonitorPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string>("");

  const [formData, setFormData] = useState({
    nome_completo: "",
    data_nascimento: "",
    telefone: "",
    email: "",
    distrito_residencia: "",
    experiencia_anos: "0",
    bio: ""
  });

  const [certificacoes, setCertificacoes] = useState<string[]>([]);
  const [disponibilidade, setDisponibilidade] = useState<string[]>([]);
  const [areasAtuacao, setAreasAtuacao] = useState<string[]>([]);

  // Listas de Opções
  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];
  
  const opcoesAtuacao = [
    ...distritosPT,
    "Em todo o país (Com Alojamento / Deslocação)"
  ];

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

  // Lidar com Checkboxes Múltiplas (Certificados, Épocas e Zonas)
  const handleCheckboxChange = (id: string, tipo: "cert" | "disp" | "zona") => {
    if (tipo === "cert") {
      setCertificacoes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else if (tipo === "disp") {
      setDisponibilidade(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else if (tipo === "zona") {
      setAreasAtuacao(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
  };

  // Upload Nativo da Fotografia para o Supabase Storage
  const handleUploadFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingFoto(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Deve selecionar uma imagem.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Gera um nome único para o ficheiro
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload para o bucket "monitores-fotos" (CRIE ESTE BUCKET COMO PÚBLICO NO SUPABASE)
      const { error: uploadError } = await supabase.storage
        .from('monitores-fotos')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      // Obter o Link Público
      const { data: urlData } = supabase.storage
        .from('monitores-fotos')
        .getPublicUrl(filePath);

      setFotoUrl(urlData.publicUrl);
    } catch (error: any) {
      alert((isEn ? 'Error uploading photo: ' : 'Erro no upload da foto: ') + error.message);
    } finally {
      setUploadingFoto(false);
    }
  };

  // Submissão do Formulário Completo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (areasAtuacao.length === 0) {
      alert(isEn ? "Please select at least one work area." : "Por favor, selecione pelo menos uma zona de atuação.");
      setSubmitting(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert(isEn ? "Please log in or create an account first." : "Por favor, inicie sessão ou crie uma conta primeiro.");
      router.push(`/${lang}/monitores/login?redirectTo=monitores/registo`);
      setSubmitting(false);
      return;
    }

    const payload = {
      id: session.user.id,
      ...formData,
      fotografia_url: fotoUrl,
      certificacoes,
      disponibilidade,
      areas_atuacao: areasAtuacao
    };

    const { error } = await supabase.from("monitores").insert([payload]);

    if (error) {
      alert((isEn ? "Error saving profile: " : "Erro ao guardar perfil: ") + error.message);
      setSubmitting(false);
    } else {
      router.push(`/${lang}/monitores/portal/perfil`);
    }
  };

  const labelClass = "text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block";
  const inputClass = "w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-base font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm";
  const selectClass = "w-full py-3 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 appearance-none cursor-pointer transition-all shadow-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_auto] bg-[position:right_1.25rem_center] bg-no-repeat";

  return (
    <div className="w-full flex-1 bg-slate-50 text-slate-900 py-12 px-4 md:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden">
        
        {/* BANNER SUPERIOR */}
        <div className="bg-blue-900 text-white p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-blue-800/50 px-4 py-2 rounded-full border border-blue-700/50">
            {isEn ? "Join our Network" : "Bolsa de Talentos HelloCamp"}
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-6 mb-3">
            {isEn ? "Promote Yourself as a Camp Monitor" : "Trabalha em Campos de Férias"}
          </h1>
          <p className="text-sm md:text-base text-blue-100 font-medium m-0 leading-relaxed max-w-xl">
            {isEn 
              ? "Publish your availability, experience, and certificates so hundreds of verified camps can find and hire you directly." 
              : "Cria o teu perfil, define a tua disponibilidade e competências, e sê encontrado diretamente pelas centenas de entidades organizadoras que usam a nossa plataforma."}
          </p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
          
          {/* SECÇÃO 1: FOTO & IDENTIFICAÇÃO */}
          <div>
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-6">
              {isEn ? "1. Personal Profile" : "1. O teu Perfil Pessoal"}
            </h3>
            
            <div className="mb-8 flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-slate-100 shadow-sm overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🧑‍🏫</span>
                )}
                {uploadingFoto && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <label className="block text-sm font-black text-slate-900 mb-1">{isEn ? "Profile Picture" : "Fotografia de Rosto"}</label>
                <p className="text-xs text-slate-500 font-medium mb-3">{isEn ? "Camps prefer profiles with clear photos." : "Um perfil com uma boa fotografia transmite muito mais confiança."}</p>
                <div className="relative inline-block">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleUploadFoto} 
                    disabled={uploadingFoto}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button type="button" className="bg-white border border-slate-300 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors pointer-events-none">
                    {uploadingFoto ? (isEn ? "Uploading..." : "A carregar...") : (isEn ? "Choose from device" : "Escolher Imagem do Dispositivo")}
                  </button>
                </div>
              </div>
            </div>

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
              <div className="sm:col-span-2">
                <label className={labelClass}>{isEn ? "Email Address" : "E-mail de Contacto"}</label>
                <input type="email" required className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="joao.martins@email.com" />
              </div>
            </div>
          </div>

          {/* SECÇÃO 2: LOCALIZAÇÃO & ATUAÇÃO */}
          <div>
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-5">
              {isEn ? "2. Location & Work Areas" : "2. Zonas de Atuação"}
            </h3>
            
            <div className="mb-6 relative">
              <label className={labelClass}>{isEn ? "Where do you currently live?" : "Onde resides atualmente?"}</label>
              <select required className={selectClass} value={formData.distrito_residencia} onChange={e => setFormData({...formData, distrito_residencia: e.target.value})}>
                <option value="">{isEn ? "Select..." : "Selecionar..."}</option>
                {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
              <label className={labelClass}>{isEn ? "Where are you willing to work?" : "Em que zonas estás disponível para trabalhar?"}</label>
              <p className="text-xs text-slate-500 font-medium mb-4">{isEn ? "You can select multiple zones, including 'Nationwide if accommodation is provided'." : "Muitos campos procuram monitores de outras zonas e oferecem dormida. Podes selecionar várias opções."}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {opcoesAtuacao.map(zona => (
                  <label key={zona} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors select-none">
                    <input type="checkbox" checked={areasAtuacao.includes(zona)} onChange={() => handleCheckboxChange(zona, "zona")} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                    <span className="text-xs font-bold text-slate-700">{zona}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* SECÇÃO 3: EXPERIÊNCIA E DISPONIBILIDADE */}
          <div>
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-5">
              {isEn ? "3. Experience & Availability" : "3. Experiência e Competências"}
            </h3>
            
            <div className="mb-6 relative max-w-sm">
              <label className={labelClass}>{isEn ? "Years of Experience" : "Anos de Experiência na Área"}</label>
              <select className={selectClass} value={formData.experiencia_anos} onChange={e => setFormData({...formData, experiencia_anos: e.target.value})}>
                <option value="0">{isEn ? "First Time / No experience" : "Nenhuma / Primeira vez"}</option>
                <option value="1-2">1-2 {isEn ? "years" : "anos"}</option>
                <option value="3-5">3-5 {isEn ? "years" : "anos"}</option>
                <option value="+5">+5 {isEn ? "years" : "anos"}</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div>
                <label className={labelClass}>{isEn ? "Certificates" : "Certificações Adicionais"}</label>
                <div className="flex flex-col gap-3 mt-2">
                  {listaCertificados.map(c => (
                    <label key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors select-none">
                      <input type="checkbox" checked={certificacoes.includes(c.id)} onChange={() => handleCheckboxChange(c.id, "cert")} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                      <span className="text-xs font-bold text-slate-700">{isEn ? c.en : c.pt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>{isEn ? "Holiday Availability" : "Disponibilidade de Interrupções Letivas"}</label>
                <div className="flex flex-col gap-3 mt-2">
                  {listaEpocas.map(e => (
                    <label key={e.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors select-none">
                      <input type="checkbox" checked={disponibilidade.includes(e.id)} onChange={() => handleCheckboxChange(e.id, "disp")} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                      <span className="text-xs font-bold text-slate-700">{isEn ? e.en : e.pt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>{isEn ? "Short Bio / Pitch" : "A tua Bio / Carta de Apresentação"}</label>
              <p className="text-xs text-slate-500 font-medium mb-2">{isEn ? "Write a short paragraph about why you're a great fit." : "O que é que as empresas vão ler sobre ti? Quais são os teus pontos fortes e dinâmicas que gostas de organizar?"}</p>
              <textarea rows={5} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm resize-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder={isEn ? "Hi! I'm energetic and love working with kids..." : "Sou um jovem super dinâmico, pratico basquetebol federado e adoro organizar peddy-papers..."} />
            </div>
          </div>

          {/* BOTÃO SUBMIT */}
          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <button 
              type="submit" 
              disabled={submitting} 
              className="w-full sm:w-auto bg-blue-600 text-white font-black uppercase tracking-widest text-xs px-10 py-4 rounded-xl shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none cursor-pointer"
            >
              {submitting ? (isEn ? "Saving Profile..." : "A Guardar e Publicar...") : (isEn ? "Publish My Profile" : "Publicar o meu Perfil")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
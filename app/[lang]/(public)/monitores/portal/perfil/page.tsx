"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EditarPerfilMonitorPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  // --- ESTADOS DE CARREGAMENTO ---
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // --- FOTO E CV ---
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string>("");
  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvUrl, setCvUrl] = useState<string>("");
  const [cvFileName, setCvFileName] = useState<string>("");

  const [email, setEmail] = useState("");

  const [formData, setFormData] = useState({
    nome_completo: "",
    data_nascimento: "",
    telefone: "",
    distrito_residencia: "",
    experiencia_anos: "0",
    outras_competencias: "",
    bio: ""
  });

  const [certificacoes, setCertificacoes] = useState<string[]>([]);
  const [disponibilidadeEpocas, setDisponibilidadeEpocas] = useState<string[]>([]);
  const [areasAtuacao, setAreasAtuacao] = useState<string[]>([]);

  // --- ESTADOS DO CALENDÁRIO INTERATIVO ---
  const [dataVisualizada, setDataVisualizada] = useState(new Date());
  const [calendario, setCalendario] = useState<Record<string, 'Livre' | 'Ocupado'>>({});

  // --- BUSCAR DADOS DO PERFIL (PRE-FILL) ---
  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(`/${lang}/monitores/login`);
        return;
      }

      setEmail(session.user.email || "");

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
          distrito_residencia: data.distrito_residencia || "",
          experiencia_anos: data.experiencia_anos || "0",
          outras_competencias: data.outras_competencias || "",
          bio: data.bio || ""
        });
        setFotoUrl(data.fotografia_url || "");
        setCvUrl(data.cv_url || "");
        setCertificacoes(data.certificacoes || []);
        setDisponibilidadeEpocas(data.disponibilidade || []);
        setAreasAtuacao(data.areas_atuacao || []);
        setCalendario(data.calendario_disponibilidade || {});

        // Extrair o nome do ficheiro CV do URL se existir
        if (data.cv_url) {
          const urlParts = data.cv_url.split('/');
          setCvFileName(urlParts[urlParts.length - 1]);
        }
      }
      setLoadingData(false);
    };

    fetchProfileData();
  }, [lang, router]);

  // --- LISTAS DE DADOS ---
  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];
  
  const opcoesAtuacao = [
    ...distritosPT,
    isEn ? "Nationwide (With Accommodation)" : "Em todo o país (Com Alojamento / Deslocação)"
  ];

  const listaCertificados = [
    { id: "IPDJ", pt: "Monitor de Campos de Férias (IPDJ)", en: "Camp Monitor (IPDJ)" },
    { id: "Socorrismo", pt: "Primeiros Socorros / Suporte Básico", en: "First Aid / Basic Life Support" },
    { id: "Nadador", pt: "Nadador Salvador", en: "Lifeguard" },
    { id: "Professor", pt: "Formação em Educação / Desporto", en: "Education / Sports Degree" },
    { id: "Animacao", pt: "Animação Sociocultural", en: "Sociocultural Animation" },
    { id: "Linguas", pt: "Fluência em Línguas Estrangeiras", en: "Foreign Languages Fluency" },
    { id: "Artes", pt: "Artes Plásticas / Música / Teatro", en: "Arts / Music / Theater" },
    { id: "NEE", pt: "Experiência com Necessidades Educativas Especiais", en: "Special Needs Experience" }
  ];

  const listaEpocas = [
    { id: "Pascoa", pt: "Férias da Páscoa", en: "Easter Break" },
    { id: "Verao", pt: "Férias de Verão (Época Alta)", en: "Summer Holidays" },
    { id: "Natal", pt: "Férias de Natal", en: "Christmas Break" }
  ];

  const handleCheckboxChange = (id: string, tipo: "cert" | "disp" | "zona") => {
    if (tipo === "cert") {
      setCertificacoes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else if (tipo === "disp") {
      setDisponibilidadeEpocas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    } else if (tipo === "zona") {
      setAreasAtuacao(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }
  };

  // --- UPLOADS ---
  const handleUploadFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingFoto(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error(isEn ? 'Please select an image.' : 'Deve selecionar uma imagem.');

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('monitores-fotos').upload(fileName, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('monitores-fotos').getPublicUrl(fileName);
      setFotoUrl(urlData.publicUrl);
    } catch (error: any) {
      alert((isEn ? 'Error uploading photo: ' : 'Erro no upload da foto: ') + error.message);
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleUploadCV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingCV(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error(isEn ? 'No file selected.' : 'Nenhum ficheiro selecionado.');

      const file = event.target.files[0];
      if (!file.type.includes('pdf') && !file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
         throw new Error(isEn ? 'Only PDF or Word files are allowed.' : 'Apenas ficheiros PDF ou Word são permitidos.');
      }

      setCvFileName(file.name);
      const fileExt = file.name.split('.').pop();
      const fileName = `cv_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('monitores-cvs').upload(fileName, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('monitores-cvs').getPublicUrl(fileName);
      setCvUrl(urlData.publicUrl);
    } catch (error: any) {
      setCvFileName("");
      alert((isEn ? 'Error uploading CV: ' : 'Erro no upload do Currículo: ') + error.message);
    } finally {
      setUploadingCV(false);
    }
  };

  // --- CALENDÁRIO ---
  const mudarMes = (incremento: number) => {
    setDataVisualizada(prev => new Date(prev.getFullYear(), prev.getMonth() + incremento, 1));
  };

  const toggleDiaCalendario = (dataISO: string) => {
    setCalendario(prev => {
      const atual = prev[dataISO];
      if (!atual) return { ...prev, [dataISO]: 'Livre' };
      if (atual === 'Livre') return { ...prev, [dataISO]: 'Ocupado' };
      const novo = { ...prev };
      delete novo[dataISO];
      return novo;
    });
  };

  const renderDiasCalendario = () => {
    const ano = dataVisualizada.getFullYear();
    const mes = dataVisualizada.getMonth();
    
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const startDayIndex = primeiroDia === 0 ? 6 : primeiroDia - 1;

    const dias = [];
    
    for (let i = 0; i < startDayIndex; i++) {
      dias.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let i = 1; i <= diasNoMes; i++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const estadoDia = calendario[dataStr];
      
      let coresClasses = "bg-white border-slate-200 text-slate-700 hover:bg-slate-100";
      if (estadoDia === 'Livre') coresClasses = "bg-emerald-100 border-emerald-500 text-emerald-800 font-black shadow-inner";
      if (estadoDia === 'Ocupado') coresClasses = "bg-red-100 border-red-500 text-red-800 font-black opacity-80 line-through";

      dias.push(
        <button
          key={dataStr}
          type="button"
          onClick={() => toggleDiaCalendario(dataStr)}
          className={`h-10 w-full rounded-lg border text-sm transition-all duration-200 flex items-center justify-center cursor-pointer ${coresClasses}`}
        >
          {i}
        </button>
      );
    }
    return dias;
  };

  const mesesNomes = isEn 
    ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    : ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
  const diasDaSemana = isEn ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // --- SUBMISSÃO E ATUALIZAÇÃO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (areasAtuacao.length === 0) {
      alert(isEn ? "Please select at least one work area." : "Por favor, selecione pelo menos uma zona de atuação.");
      return;
    }

    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload = {
      id: session.user.id,
      email: email,
      nome_completo: formData.nome_completo,
      data_nascimento: formData.data_nascimento,
      telefone: formData.telefone,
      distrito_residencia: formData.distrito_residencia,
      experiencia_anos: formData.experiencia_anos,
      outras_competencias: formData.outras_competencias,
      bio: formData.bio,
      fotografia_url: fotoUrl,
      cv_url: cvUrl,
      certificacoes,
      disponibilidade: disponibilidadeEpocas,
      areas_atuacao: areasAtuacao,
      calendario_disponibilidade: calendario
    };

    // Atualiza a tabela Monitores (Upsert garante que se não houver cria, se houver atualiza)
    const { error: monitorError } = await supabase.from("monitores").upsert([payload]);

    // Atualiza também os dados na tabela perfis para sincronia
    await supabase.from("perfis").update({
      nome_completo: formData.nome_completo,
      telefone: formData.telefone
    }).eq('id', session.user.id);

    if (monitorError) {
      alert((isEn ? "Error updating profile: " : "Erro ao atualizar dados: ") + monitorError.message);
    } else {
      alert(isEn ? "Profile updated successfully!" : "Perfil atualizado com sucesso!");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setSubmitting(false);
  };

  const labelClass = "text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block";
  const inputClass = "w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm md:text-base font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm";
  const selectClass = "w-full py-3 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm md:text-base font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 appearance-none cursor-pointer transition-all shadow-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_auto] bg-[position:right_1.25rem_center] bg-no-repeat";

  if (loadingData) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold tracking-widest uppercase text-sm animate-pulse">
        {isEn ? "Loading profile data..." : "A carregar os teus dados..."}
      </div>
    );
  }

  return (
    <div className="w-full flex-1 bg-slate-50 text-slate-900 py-12 px-4 md:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden">
        
        {/* BANNER SUPERIOR */}
        <div className="bg-blue-900 text-white p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-blue-800/50 px-4 py-2 rounded-full border border-blue-700/50">
            {isEn ? "Monitor Portal" : "Portal do Monitor"}
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-6 mb-3">
            {isEn ? "Manage Your Profile" : "Gerir o teu Perfil"}
          </h1>
          <p className="text-sm md:text-base text-blue-100 font-medium m-0 leading-relaxed max-w-xl">
            {isEn 
              ? "Update your availability, upload a new photo, and keep your experience up to date to get more offers." 
              : "Atualiza a tua disponibilidade de calendário, altera a tua fotografia e mantém a tua experiência em dia para receberes mais propostas."}
          </p>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="p-6 md:p-12 space-y-10">
          
          {/* SECÇÃO 1: FOTO E CV & IDENTIFICAÇÃO BÁSICA */}
          <div>
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3 mb-6">
              {isEn ? "1. Personal Profile & Resume" : "1. Perfil Pessoal e CV"}
            </h3>
            
            <div className="mb-6 flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-slate-100 shadow-sm overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                {fotoUrl ? (
                  <img src={fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-slate-300">📸</span>
                )}
                {uploadingFoto && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <label className="block text-sm font-black text-slate-900 mb-1">{isEn ? "Profile Picture" : "Fotografia de Rosto"}</label>
                <p className="text-xs text-slate-500 font-medium mb-3">{isEn ? "Camps prefer profiles with clear photos." : "Um perfil com fotografia atrai 3x mais propostas de recrutamento."}</p>
                <div className="relative inline-block">
                  <input type="file" accept="image/*" onChange={handleUploadFoto} disabled={uploadingFoto} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <button type="button" className="bg-white border border-slate-300 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-colors pointer-events-none">
                    {uploadingFoto ? (isEn ? "Uploading..." : "A carregar...") : (isEn ? "Change Photo" : "Alterar Fotografia")}
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-8 flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0 relative">
                <span className="text-2xl text-slate-400">📄</span>
                {uploadingCV && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <label className="block text-sm font-black text-slate-900 mb-1">{isEn ? "Update your Resume (CV)" : "Atualizar Currículo (CV)"} <span className="text-slate-400 text-xs ml-1">(Opcional)</span></label>
                <p className="text-xs text-slate-500 font-medium mb-3">{isEn ? "PDF or Word files only. Only visible to verified camps." : "Apenas ficheiros PDF ou DOCX. Fica visível apenas para os organizadores."}</p>
                <div className="relative inline-block">
                  <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleUploadCV} disabled={uploadingCV} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <button type="button" className="bg-white border border-slate-300 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 transition-colors pointer-events-none">
                    {uploadingCV ? (isEn ? "Uploading..." : "A carregar...") : (cvFileName ? `✔️ ${cvFileName.substring(0, 15)}...` : (isEn ? "Upload Resume" : "Carregar Currículo"))}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className={labelClass}>{isEn ? "Full Name" : "Nome Completo"}</label>
                <input type="text" required className={inputClass} value={formData.nome_completo} onChange={e => setFormData({...formData, nome_completo: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>{isEn ? "Date of Birth" : "Data de Nascimento"}</label>
                <input type="date" required className={inputClass} value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>{isEn ? "Phone Number" : "Contacto Telefónico"}</label>
                <input type="tel" required className={inputClass} value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{isEn ? "Login Email (Cannot be changed here)" : "E-mail (Não editável)"}</label>
                <input type="email" disabled className={`${inputClass} opacity-60 cursor-not-allowed`} value={email} />
              </div>
            </div>
          </div>

          {/* SECÇÃO 2: LOCALIZAÇÃO & ATUAÇÃO */}
          <div>
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3 mb-6">
              {isEn ? "2. Location & Work Areas" : "2. Zonas de Atuação"}
            </h3>
            
            <div className="mb-6 relative">
              <label className={labelClass}>{isEn ? "Where do you currently live?" : "Onde resides atualmente?"}</label>
              <select required className={selectClass} value={formData.distrito_residencia} onChange={e => setFormData({...formData, distrito_residencia: e.target.value})}>
                <option value="">{isEn ? "Select..." : "Selecionar..."}</option>
                {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
              <label className={labelClass}>{isEn ? "Where are you willing to work?" : "Em que zonas estás disponível para trabalhar?"}</label>
              <p className="text-xs text-slate-500 font-medium mb-5">{isEn ? "You can select multiple zones." : "Muitos campos procuram monitores de outras zonas e oferecem dormida."}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {opcoesAtuacao.map(zona => (
                  <label key={zona} className={`flex items-start gap-3 p-3 bg-white border rounded-xl cursor-pointer hover:border-blue-300 transition-colors select-none ${areasAtuacao.includes(zona) ? 'border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'border-slate-200'}`}>
                    <input type="checkbox" checked={areasAtuacao.includes(zona)} onChange={() => handleCheckboxChange(zona, "zona")} className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer" />
                    <span className="text-xs font-bold text-slate-700 leading-tight">{zona}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* SECÇÃO 3: EXPERIÊNCIA E COMPETÊNCIAS */}
          <div>
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3 mb-6">
              {isEn ? "3. Experience & Skills" : "3. Experiência e Competências"}
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

            <div className="mb-6">
              <label className={labelClass}>{isEn ? "Certificates & Core Skills" : "Certificações e Habilidades Base"}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {listaCertificados.map(c => (
                  <label key={c.id} className={`flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer transition-colors select-none ${certificacoes.includes(c.id) ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="checkbox" checked={certificacoes.includes(c.id)} onChange={() => handleCheckboxChange(c.id, "cert")} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                    <span className="text-xs font-bold text-slate-700">{isEn ? c.en : c.pt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>{isEn ? "Other relevant skills (Optional)" : "Outras Competências / Talentos (Opcional)"}</label>
              <input type="text" className={inputClass} value={formData.outras_competencias} onChange={e => setFormData({...formData, outras_competencias: e.target.value})} />
            </div>
          </div>

          {/* SECÇÃO 4: DISPONIBILIDADE E PITCH */}
          <div>
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3 mb-6">
              {isEn ? "4. Availability & Pitch" : "4. Disponibilidade e Apresentação"}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <label className={labelClass}>{isEn ? "General Availability" : "Disponibilidade Geral"}</label>
                <p className="text-xs text-slate-500 font-medium mb-3">{isEn ? "Select the school holidays you are usually free." : "Selecione as interrupções letivas onde tem interesse em trabalhar."}</p>
                <div className="flex flex-col gap-3">
                  {listaEpocas.map(e => (
                    <label key={e.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors select-none">
                      <input type="checkbox" checked={disponibilidadeEpocas.includes(e.id)} onChange={() => handleCheckboxChange(e.id, "disp")} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                      <span className="text-sm font-bold text-slate-700">{isEn ? e.en : e.pt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>{isEn ? "Specific Calendar" : "Calendário Específico (Opcional)"}</label>
                <p className="text-xs text-slate-500 font-medium mb-3">{isEn ? "Click days to mark: Green (Available) or Red (Busy)." : "Clique nos dias para marcar: 1x Livre (Verde), 2x Ocupado (Vermelho)."}</p>
                
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm select-none">
                  <div className="flex justify-between items-center mb-4">
                    <button type="button" onClick={() => mudarMes(-1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 font-bold">&larr;</button>
                    <span className="text-sm font-black text-slate-800 uppercase tracking-widest">
                      {mesesNomes[dataVisualizada.getMonth()]} {dataVisualizada.getFullYear()}
                    </span>
                    <button type="button" onClick={() => mudarMes(1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 font-bold">&rarr;</button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                    {diasDaSemana.map(d => <span key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {renderDiasCalendario()}
                  </div>
                  <div className="mt-4 flex gap-4 justify-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                     <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-500 inline-block"></span> Livre</span>
                     <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-500 inline-block"></span> Ocupado</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>{isEn ? "Short Bio / Pitch" : "A tua Bio / Carta de Apresentação"}</label>
              <p className="text-xs text-slate-500 font-medium mb-2">{isEn ? "Write a short paragraph about why you're a great fit." : "O que é que as empresas vão ler sobre ti? Quais são os teus pontos fortes e dinâmicas que gostas de organizar?"}</p>
              <textarea rows={5} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm resize-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
            </div>
          </div>

          {/* BOTÃO SUBMIT */}
          <div className="pt-8 border-t border-slate-200 flex justify-end">
            <button 
              type="submit" 
              disabled={submitting} 
              className="w-full sm:w-auto bg-blue-600 text-white font-black uppercase tracking-widest text-xs px-10 py-4 rounded-xl shadow-lg hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none cursor-pointer"
            >
              {submitting ? (isEn ? "Saving Profile..." : "A Guardar...") : (isEn ? "Save Changes" : "Guardar Alterações")}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
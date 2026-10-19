"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";

export default function EditarPerfilMonitorPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  // --- ESTADOS DE CARREGAMENTO ---
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // --- FOTO E CV E AUTORIZAÇÃO ---
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string>("");
  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvUrl, setCvUrl] = useState<string>("");
  const [cvFileName, setCvFileName] = useState<string>("");

  const [uploadingAutorizacao, setUploadingAutorizacao] = useState(false);
  const [autorizacaoUrl, setAutorizacaoUrl] = useState<string>("");
  const [autorizacaoFileName, setAutorizacaoFileName] = useState<string>("");

  const [email, setEmail] = useState("");

  const [formData, setFormData] = useState({
    nome_completo: "", data_nascimento: "", telefone: "",
    distrito_residencia: "", experiencia_anos: "0", outras_competencias: "", bio: ""
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
      
      if (!session) { router.push(`/${lang}/monitores/login`); return; }

      setEmail(session.user.email || "");

      const { data, error } = await supabase.from('monitores').select('*').eq('id', session.user.id).single();

      if (data && !error) {
        setFormData({
          nome_completo: data.nome_completo || "", data_nascimento: data.data_nascimento || "",
          telefone: data.telefone || "", distrito_residencia: data.distrito_residencia || "",
          experiencia_anos: data.experiencia_anos || "0", outras_competencias: data.outras_competencias || "",
          bio: data.bio || ""
        });
        setFotoUrl(data.fotografia_url || "");
        setCvUrl(data.cv_url || "");
        setAutorizacaoUrl(data.autorizacao_pais_url || "");
        setCertificacoes(data.certificacoes || []);
        setDisponibilidadeEpocas(data.disponibilidade || []);
        setAreasAtuacao(data.areas_atuacao || []);
        setCalendario(data.calendario_disponibilidade || {});

        if (data.cv_url) { const urlParts = data.cv_url.split('/'); setCvFileName(urlParts[urlParts.length - 1]); }
        if (data.autorizacao_pais_url) { const urlParts = data.autorizacao_pais_url.split('/'); setAutorizacaoFileName(urlParts[urlParts.length - 1]); }
      }
      setLoadingData(false);
    };
    fetchProfileData();
  }, [lang, router]);

  // --- LISTAS DE DADOS ---
  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];
  const opcoesAtuacao = [...distritosPT, isEn ? "Nationwide (With Accommodation)" : "Em todo o país (Com Alojamento / Deslocação)"];
  
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
    if (tipo === "cert") setCertificacoes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    else if (tipo === "disp") setDisponibilidadeEpocas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    else if (tipo === "zona") setAreasAtuacao(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // --- LÓGICA MENORES DE IDADE ---
  const calcularIdade = (dataNascimento: string) => {
    if (!dataNascimento) return 18;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
    return idade;
  };
  const eMenor = calcularIdade(formData.data_nascimento) < 18;

  const gerarDocumentoAutorizacao = () => {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("AUTORIZAÇÃO DO ENCARREGADO DE EDUCAÇÃO PARA DIVULGAÇÃO", pageWidth / 2, 25, { align: "center" });
    doc.text("DE DADOS E IMAGEM DE MENOR", pageWidth / 2, 32, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    const textoBase = `Eu, _____________________________________________________, titular do Cartão de Cidadão n.º __________________________, na qualidade de Encarregado(a) de Educação de ${formData.nome_completo || "________________________________________________"}, nascido(a) em ${formData.data_nascimento ? new Date(formData.data_nascimento).toLocaleDateString('pt-PT') : "___/___/______"}, autorizo a divulgação dos seus dados e da sua imagem na plataforma HelloCamp, para efeitos exclusivos de divulgação do seu perfil e da sua disponibilidade para prestar serviços como monitor(a) em campos de férias e outras atividades de animação juvenil.\n\nA presente autorização abrange a publicação dos seguintes elementos:\nNome\nFotografia\nIdade e Localidade\nFormação e/ou experiência relevante\nCompetências, certificações e restantes informações fornecidas para a criação do perfil.\n\nDeclaro ter conhecimento de que a HelloCamp atua exclusivamente como plataforma de divulgação e aproximação entre candidatos e entidades organizadoras de campos de férias. O regime de isenção laboral para o trabalho de menores rege-se pelos termos definidos na lei portuguesa, cabendo a negociação do vínculo de prestação de serviços exclusivamente à entidade organizadora contratante.\n\nA presente autorização é prestada de forma livre, informada e voluntária, podendo ser revogada a qualquer momento mediante comunicação escrita à HelloCamp (info@hellocamp.pt), sem prejuízo da licitude do tratamento efetuado até à data da revogação.`;
    
    const splitTexto = doc.splitTextToSize(textoBase, pageWidth - 40);
    doc.text(splitTexto, 20, 50);

    const posY = 150;
    doc.text("Local: ___________________________", 20, posY);
    doc.text("Data: ____/____/________", 130, posY);
    
    doc.text("O(A) Encarregado(a) de Educação", 20, posY + 20);
    doc.text("Nome: ________________________________________________________", 20, posY + 30);
    doc.text("Assinatura: ___________________________________________________", 20, posY + 40);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Nota: Este documento deve ser impresso, assinado pelo Encarregado de Educação e submetido na", 20, posY + 60);
    doc.text("plataforma no perfil do monitor menor de idade.", 20, posY + 65);

    doc.save(`Autorizacao_Menor_${formData.nome_completo.replace(/\s+/g, '_') || 'HelloCamp'}.pdf`);
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
    } catch (error: any) { alert((isEn ? 'Error uploading photo: ' : 'Erro no upload da foto: ') + error.message); } finally { setUploadingFoto(false); }
  };

  const handleUploadCV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingCV(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error(isEn ? 'No file selected.' : 'Nenhum ficheiro selecionado.');

      const file = event.target.files[0];
      setCvFileName(file.name);
      const fileExt = file.name.split('.').pop();
      const fileName = `cv_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('monitores-cvs').upload(fileName, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('monitores-cvs').getPublicUrl(fileName);
      setCvUrl(urlData.publicUrl);
    } catch (error: any) { setCvFileName(""); alert((isEn ? 'Error uploading CV: ' : 'Erro no upload do Currículo: ') + error.message); } finally { setUploadingCV(false); }
  };

  const handleUploadAutorizacao = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAutorizacao(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Nenhum ficheiro selecionado.');

      const file = event.target.files[0];
      setAutorizacaoFileName(file.name);
      const fileExt = file.name.split('.').pop();
      const fileName = `auth_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('monitores-cvs').upload(fileName, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('monitores-cvs').getPublicUrl(fileName);
      setAutorizacaoUrl(urlData.publicUrl);
    } catch (error: any) { setAutorizacaoFileName(""); alert('Erro no upload da Autorização: ' + error.message); } finally { setUploadingAutorizacao(false); }
  };

  // --- CALENDÁRIO ---
  const mudarMes = (incremento: number) => setDataVisualizada(prev => new Date(prev.getFullYear(), prev.getMonth() + incremento, 1));
  const toggleDiaCalendario = (dataISO: string) => {
    setCalendario(prev => {
      const atual = prev[dataISO];
      if (!atual) return { ...prev, [dataISO]: 'Livre' };
      if (atual === 'Livre') return { ...prev, [dataISO]: 'Ocupado' };
      const novo = { ...prev }; delete novo[dataISO]; return novo;
    });
  };

  const renderDiasCalendario = () => {
    const ano = dataVisualizada.getFullYear(); const mes = dataVisualizada.getMonth();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const startDayIndex = primeiroDia === 0 ? 6 : primeiroDia - 1;

    const dias = [];
    for (let i = 0; i < startDayIndex; i++) dias.push(<div key={`empty-${i}`} className="p-2"></div>);

    for (let i = 1; i <= diasNoMes; i++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const estadoDia = calendario[dataStr];
      
      let coresClasses = "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-[#2563eb]/50";
      if (estadoDia === 'Livre') coresClasses = "bg-[#2563eb]/10 border-[#2563eb] text-[#2563eb] font-black shadow-inner";
      if (estadoDia === 'Ocupado') coresClasses = "bg-red-100 border-red-500 text-red-800 font-black opacity-80 line-through";

      dias.push(
        <button key={dataStr} type="button" onClick={() => toggleDiaCalendario(dataStr)} className={`h-12 w-full rounded-xl border text-base transition-all duration-200 flex items-center justify-center cursor-pointer ${coresClasses}`}>
          {i}
        </button>
      );
    }
    return dias;
  };

  const mesesNomes = isEn ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] : ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const diasDaSemana = isEn ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // --- SUBMISSÃO E ATUALIZAÇÃO ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (areasAtuacao.length === 0) return alert(isEn ? "Please select at least one work area." : "Por favor, selecione pelo menos uma zona de atuação.");
    if (eMenor && !autorizacaoUrl) return alert(isEn ? "As you are under 18, you must upload the Parent Authorization Document." : "Sendo menor de 18 anos, é obrigatório descarregar, assinar e fazer upload da Declaração de Autorização dos Pais.");

    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const payload = {
      id: session.user.id, email: email, nome_completo: formData.nome_completo, data_nascimento: formData.data_nascimento,
      telefone: formData.telefone, distrito_residencia: formData.distrito_residencia, experiencia_anos: formData.experiencia_anos,
      outras_competencias: formData.outras_competencias, bio: formData.bio, fotografia_url: fotoUrl, cv_url: cvUrl,
      autorizacao_pais_url: eMenor ? autorizacaoUrl : null, certificacoes, disponibilidade: disponibilidadeEpocas,
      areas_atuacao: areasAtuacao, calendario_disponibilidade: calendario
    };

    const { error: monitorError } = await supabase.from("monitores").upsert([payload]);
    await supabase.from("perfis").update({ nome_completo: formData.nome_completo, telefone: formData.telefone }).eq('id', session.user.id);

    if (monitorError) alert((isEn ? "Error updating profile: " : "Erro ao atualizar dados: ") + monitorError.message);
    else { alert(isEn ? "Profile updated successfully!" : "Perfil atualizado com sucesso!"); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    setSubmitting(false);
  };

  const labelClass = "text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1";
  const inputClass = "w-full py-3.5 px-5 bg-slate-50 border border-slate-200 rounded-xl text-sm md:text-base font-bold text-slate-900 outline-none focus:bg-white focus:border-[#2563eb] transition-all shadow-sm placeholder-slate-400";
  const selectClass = "w-full py-3.5 px-5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm md:text-base font-bold text-slate-900 outline-none focus:bg-white focus:border-[#2563eb] appearance-none cursor-pointer transition-all shadow-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232563eb%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_auto] bg-[position:right_1.25rem_center] bg-no-repeat";

  if (loadingData) return <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">{isEn ? "Loading profile data..." : "A preparar o teu currículo..."}</div>;

  return (
    <div className="w-full flex-1 font-sans pb-24 max-w-4xl mx-auto">
      
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-2">
          {isEn ? "Manage Your Profile" : "Gerir o teu Perfil"}
        </h1>
        <p className="text-sm md:text-base text-slate-500 font-medium m-0 leading-relaxed max-w-2xl">
          {isEn 
            ? "Update your availability, upload a new photo, and keep your experience up to date to get more offers." 
            : "Atualiza a tua disponibilidade de calendário, altera a tua fotografia e mantém a tua experiência em dia para não falhares nenhuma proposta de verão."}
        </p>
      </div>

      {eMenor && (
        <div className="mb-10 p-6 md:p-8 bg-amber-50 border-2 border-amber-200 rounded-[2rem] flex flex-col items-center text-center shadow-sm">
          <span className="text-4xl mb-4">⚠️</span>
          <h3 className="text-xl font-black text-amber-900 mb-2">Monitor Menor de 18 Anos</h3>
          <p className="text-amber-800 font-medium text-sm max-w-2xl leading-relaxed mb-8">
            Para ficares visível para as entidades organizadoras, e em conformidade com as regras laborais aplicáveis a menores, é estritamente obrigatório apresentares uma autorização assinada pelo teu Encarregado de Educação.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
            <button type="button" onClick={gerarDocumentoAutorizacao} className="flex-1 bg-white border-2 border-amber-300 hover:border-amber-400 hover:bg-amber-100 text-amber-900 font-black px-5 py-4 rounded-xl transition-colors text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
              1. Descarregar PDF
            </button>
            <div className="flex-1 relative inline-block">
              <input type="file" accept=".pdf,.jpeg,.jpg,.png" onChange={handleUploadAutorizacao} disabled={uploadingAutorizacao} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <button type="button" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black px-5 py-4 rounded-xl transition-colors text-xs uppercase tracking-widest flex items-center justify-center gap-2 pointer-events-none shadow-md">
                {uploadingAutorizacao ? "A carregar..." : (autorizacaoFileName ? `✔️ ${autorizacaoFileName.substring(0, 10)}...` : "2. Anexar Assinado")}
              </button>
            </div>
          </div>
          
          {autorizacaoUrl && (
            <a href={autorizacaoUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-4 py-2 rounded-lg no-underline">
              <span>✓</span> Autorização Validada
            </a>
          )}
        </div>
      )}

      {/* FORMULÁRIO */}
      <form onSubmit={handleSubmit} className="space-y-10">
        
        {/* SECÇÃO 1: FOTO E CV & IDENTIFICAÇÃO BÁSICA */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-4 mb-8 uppercase tracking-widest flex items-center gap-3">
            <span className="text-2xl">📸</span> {isEn ? "1. Profile & Resume" : "1. Perfil Pessoal e CV"}
          </h3>
          
          <div className="mb-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-slate-50 border-4 border-slate-100 shadow-sm overflow-hidden flex items-center justify-center flex-shrink-0 relative">
              {fotoUrl ? <img src={fotoUrl} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-4xl text-slate-300">👤</span>}
              {uploadingFoto && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><div className="w-6 h-6 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin"></div></div>}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <label className="block text-sm font-black text-slate-900 mb-1">{isEn ? "Profile Picture" : "Fotografia de Rosto"}</label>
              <p className="text-xs text-slate-500 font-medium mb-4">{isEn ? "Camps prefer profiles with clear photos." : "Um perfil com fotografia atrai 3x mais propostas de recrutamento."}</p>
              <div className="relative inline-block w-full sm:w-auto">
                <input type="file" accept="image/*" onChange={handleUploadFoto} disabled={uploadingFoto} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <button type="button" className="w-full sm:w-auto bg-slate-100 border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl shadow-sm hover:border-[#2563eb] hover:text-[#2563eb] hover:bg-blue-50 transition-colors pointer-events-none">
                  {uploadingFoto ? (isEn ? "Uploading..." : "A carregar...") : (isEn ? "Change Photo" : "Alterar Fotografia")}
                </button>
              </div>
            </div>
          </div>

          <div className="mb-10 flex flex-col sm:flex-row items-center gap-6 pt-8 border-t border-slate-100">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0 relative">
              <span className="text-3xl text-slate-400">📄</span>
              {uploadingCV && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><div className="w-5 h-5 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin"></div></div>}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <label className="block text-sm font-black text-slate-900 mb-1">{isEn ? "Update your Resume (CV)" : "Atualizar Currículo (CV)"} <span className="text-slate-400 text-[10px] uppercase tracking-widest ml-1">(Opcional)</span></label>
              <p className="text-xs text-slate-500 font-medium mb-4">{isEn ? "PDF or Word files only. Only visible to verified camps." : "Apenas ficheiros PDF ou DOCX. Fica visível apenas para os organizadores e enriquece o teu perfil."}</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3">
                <div className="relative inline-block w-full sm:w-auto">
                  <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleUploadCV} disabled={uploadingCV} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <button type="button" className="w-full sm:w-auto bg-slate-100 border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl shadow-sm hover:border-[#2563eb] hover:text-[#2563eb] hover:bg-blue-50 transition-colors pointer-events-none">
                    {uploadingCV ? (isEn ? "Uploading..." : "A carregar...") : (cvFileName ? `✔️ ${cvFileName.substring(0, 15)}...` : (isEn ? "Upload Resume" : "Substituir Currículo"))}
                  </button>
                </div>
                {cvUrl && (
                  <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto inline-flex justify-center items-center text-[10px] font-black uppercase tracking-widest text-[#2563eb] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-6 py-3.5 rounded-xl transition-colors no-underline">
                    {isEn ? "View Current CV" : "Ver CV Atual"}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-slate-100">
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
              <label className={labelClass}>{isEn ? "Login Email (Cannot be changed here)" : "E-mail de Login (Não editável)"}</label>
              <input type="email" disabled className={`${inputClass} opacity-50 cursor-not-allowed bg-slate-100`} value={email} />
            </div>
          </div>
        </div>

        {/* SECÇÃO 2: LOCALIZAÇÃO & ATUAÇÃO */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-4 mb-8 uppercase tracking-widest flex items-center gap-3">
            <span className="text-2xl">📍</span> {isEn ? "2. Location & Work Areas" : "2. Zonas de Atuação"}
          </h3>
          
          <div className="mb-8">
            <label className={labelClass}>{isEn ? "Where do you currently live?" : "Onde resides atualmente?"}</label>
            <select required className={selectClass} value={formData.distrito_residencia} onChange={e => setFormData({...formData, distrito_residencia: e.target.value})}>
              <option value="">{isEn ? "Select..." : "Selecionar o seu distrito..."}</option>
              {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="p-6 md:p-8 bg-slate-50 border border-slate-200 rounded-2xl">
            <label className={labelClass}>{isEn ? "Where are you willing to work?" : "Em que zonas estás disponível para trabalhar?"}</label>
            <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed max-w-2xl">{isEn ? "You can select multiple zones." : "Muitos campos procuram monitores fora da sua área de residência e garantem dormida ou cobrem as despesas de deslocação. Seleciona sem medo!"}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {opcoesAtuacao.map(zona => (
                <label key={zona} className={`flex items-start gap-3 p-4 bg-white border-2 rounded-xl cursor-pointer transition-all select-none ${areasAtuacao.includes(zona) ? 'border-[#2563eb] bg-blue-50/30 shadow-sm' : 'border-slate-200 hover:border-[#2563eb]/50'}`}>
                  <input type="checkbox" checked={areasAtuacao.includes(zona)} onChange={() => handleCheckboxChange(zona, "zona")} className="mt-0.5 w-4 h-4 accent-[#2563eb] cursor-pointer flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-800 leading-tight">{zona}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* SECÇÃO 3: EXPERIÊNCIA E COMPETÊNCIAS */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-4 mb-8 uppercase tracking-widest flex items-center gap-3">
            <span className="text-2xl">🏆</span> {isEn ? "3. Experience & Skills" : "3. Experiência e Competências"}
          </h3>
          
          <div className="mb-8">
            <label className={labelClass}>{isEn ? "Years of Experience" : "Anos de Experiência na Área"}</label>
            <select className={selectClass} value={formData.experiencia_anos} onChange={e => setFormData({...formData, experiencia_anos: e.target.value})}>
              <option value="0">{isEn ? "First Time / No experience" : "Nenhuma / Primeira vez a candidatar-me"}</option>
              <option value="1-2">1-2 {isEn ? "years" : "anos de experiência em campos"}</option>
              <option value="3-5">3-5 {isEn ? "years" : "anos de experiência em campos"}</option>
              <option value="+5">+5 {isEn ? "years" : "anos (Sénior/Coordenador)"}</option>
            </select>
          </div>

          <div className="mb-8">
            <label className={labelClass}>{isEn ? "Certificates & Core Skills" : "Certificações e Habilidades Base"}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-3">
              {listaCertificados.map(c => (
                <label key={c.id} className={`flex items-center gap-3 p-4 bg-white border-2 rounded-xl cursor-pointer transition-all select-none ${certificacoes.includes(c.id) ? 'border-[#2563eb] bg-blue-50/30 shadow-sm' : 'border-slate-200 hover:border-[#2563eb]/50 hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={certificacoes.includes(c.id)} onChange={() => handleCheckboxChange(c.id, "cert")} className="w-5 h-5 accent-[#2563eb] cursor-pointer flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-800">{isEn ? c.en : c.pt}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>{isEn ? "Other relevant skills (Optional)" : "Outras Competências / Talentos (Opcional)"}</label>
            <input type="text" className={inputClass} value={formData.outras_competencias} onChange={e => setFormData({...formData, outras_competencias: e.target.value})} placeholder={isEn ? "E.g. Yoga instructor, DJ, Photography..." : "Ex: Toco viola, Dou aulas de dança, Fotografia, Programação..."} />
          </div>
        </div>

        {/* SECÇÃO 4: DISPONIBILIDADE E PITCH */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-4 mb-8 uppercase tracking-widest flex items-center gap-3">
            <span className="text-2xl">📅</span> {isEn ? "4. Availability & Pitch" : "4. Disponibilidade e Apresentação"}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
            <div>
              <label className={labelClass}>{isEn ? "General Availability" : "Disponibilidade Sazonal Geral"}</label>
              <p className="text-xs text-slate-500 font-medium mb-4">{isEn ? "Select the school holidays you are usually free." : "Selecione as interrupções letivas principais onde tem interesse e disponibilidade para trabalhar com crianças."}</p>
              <div className="flex flex-col gap-3">
                {listaEpocas.map(e => (
                  <label key={e.id} className={`flex items-center gap-4 p-4 bg-white border-2 rounded-xl cursor-pointer transition-colors select-none ${disponibilidadeEpocas.includes(e.id) ? 'border-[#2563eb] bg-blue-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="checkbox" checked={disponibilidadeEpocas.includes(e.id)} onChange={() => handleCheckboxChange(e.id, "disp")} className="w-5 h-5 accent-[#2563eb] cursor-pointer flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-800">{isEn ? e.en : e.pt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>{isEn ? "Specific Calendar" : "Calendário Específico Diário (Opcional)"}</label>
              <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">{isEn ? "Click days to mark: Green (Available) or Red (Busy)." : "Este é o teu melhor trunfo. Clique nos dias para definir a tua agenda: 1x Livre (Verde), 2x Ocupado (Vermelho). Atualiza sempre que os teus planos mudarem."}</p>
              
              <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm select-none">
                <div className="flex justify-between items-center mb-6 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <button type="button" onClick={() => mudarMes(-1)} className="p-2 w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 font-black hover:bg-white hover:text-[#2563eb] transition-colors shadow-sm">&larr;</button>
                  <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    {mesesNomes[dataVisualizada.getMonth()]} {dataVisualizada.getFullYear()}
                  </span>
                  <button type="button" onClick={() => mudarMes(1)} className="p-2 w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 font-black hover:bg-white hover:text-[#2563eb] transition-colors shadow-sm">&rarr;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 md:gap-1.5 mb-2 text-center">
                  {diasDaSemana.map(d => <span key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1 md:gap-1.5">
                  {renderDiasCalendario()}
                </div>
                <div className="mt-6 pt-5 border-t border-slate-100 flex gap-5 justify-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                   <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-emerald-100 border-2 border-emerald-500 inline-block"></span> Livre</span>
                   <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-red-100 border-2 border-red-500 inline-block"></span> Ocupado</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>{isEn ? "Short Bio / Pitch" : "A tua Bio / Carta de Apresentação"}</label>
            <p className="text-xs text-slate-500 font-medium mb-3">{isEn ? "Write a short paragraph about why you're a great fit." : "Escreve na primeira pessoa. O que é que as empresas vão ler sobre ti? Quais são os teus pontos fortes e dinâmicas que gostas de organizar com as crianças?"}</p>
            <textarea rows={5} required className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm md:text-base font-medium text-slate-800 outline-none focus:bg-white focus:border-[#2563eb] transition-all shadow-sm resize-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
          </div>
        </div>

        {/* BOTÃO SUBMIT */}
        <div className="pt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={submitting || (eMenor && !autorizacaoUrl)} 
            className="w-full md:w-auto bg-[#2563eb] text-white font-black uppercase tracking-widest text-xs md:text-sm px-12 py-5 rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none cursor-pointer"
          >
            {submitting ? (isEn ? "Saving Profile..." : "A Guardar as Alterações...") : (isEn ? "Save Changes" : "Guardar Alterações do Perfil")}
          </button>
        </div>

      </form>
    </div>
  );
}
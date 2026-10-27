"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";

const DISTRITOS_PT = [
  "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra",
  "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre",
  "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"
];

const LISTA_CERTIFICADOS = [
  {
    id: "Monitor de Campos de Férias (IPDJ)",
    pt: "Monitor de Campos de Férias (IPDJ)",
    en: "Camp Monitor (IPDJ)",
  },
  {
    id: "Primeiros Socorros / Suporte Básico",
    pt: "Primeiros Socorros / Suporte Básico",
    en: "First Aid / Basic Life Support",
  },
  { id: "Nadador Salvador", pt: "Nadador Salvador", en: "Lifeguard" },
  {
    id: "Formação em Educação / Desporto",
    pt: "Formação em Educação / Desporto",
    en: "Education / Sports Degree",
  },
  {
    id: "Animação Sociocultural",
    pt: "Animação Sociocultural",
    en: "Sociocultural Animation",
  },
  {
    id: "Fluência em Línguas Estrangeiras",
    pt: "Fluência em Línguas Estrangeiras",
    en: "Foreign Languages Fluency",
  },
  {
    id: "Necessidades Educativas Especiais",
    pt: "Experiência com Necessidades Educativas Especiais",
    en: "Special Needs Experience",
  },
];

const LISTA_EPOCAS = [
  { id: "Pascoa", pt: "Férias da Páscoa", en: "Easter Break" },
  { id: "Verao", pt: "Férias de Verão (Época Alta)", en: "Summer Holidays" },
  { id: "Natal", pt: "Férias de Natal", en: "Christmas Break" },
];

export default function EditarPerfilMonitorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Foto, CV e Autorização Parental (para menores de 18)
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string>("");
  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvUrl, setCvUrl] = useState<string>("");
  const [cvFileName, setCvFileName] = useState<string>("");

  const [uploadingAutorizacao, setUploadingAutorizacao] = useState(false);
  const [autorizacaoUrl, setAutorizacaoUrl] = useState<string>("");
  const [autorizacaoFileName, setAutorizacaoFileName] = useState<string>("");

  const [formData, setFormData] = useState({
    nome_completo: "",
    data_nascimento: "",
    telefone: "",
    distrito_residencia: "Lisboa",
    experiencia_anos: "0",
    outras_competencias: "",
    bio: "",
  });

  const [certificacoes, setCertificacoes] = useState<string[]>([]);
  const [disponibilidadeEpocas, setDisponibilidadeEpocas] = useState<string[]>(
    []
  );
  const [areasAtuacao, setAreasAtuacao] = useState<string[]>([]);

  const [dataVisualizada, setDataVisualizada] = useState(new Date());
  const [calendario, setCalendario] = useState<Record<string, string>>({});

  const opcoesAtuacao = [
    ...DISTRITOS_PT,
    isEn
      ? "Nationwide (With Accommodation)"
      : "Em todo o país (Com Alojamento / Deslocação)",
  ];

  const mesesNomes = isEn
    ? [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ]
    : [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
  const diasDaSemana = isEn
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  useEffect(() => {
    const carregarDadosMonitor = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${lang}/monitores/login`);
        return;
      }

      const uid = session.user.id;
      setUserId(uid);
      setEmail(session.user.email || "");

      const { data } = await supabase
        .from("monitores")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (data) {
        setFormData({
          nome_completo: data.nome_completo || "",
          data_nascimento: data.data_nascimento || "",
          telefone: data.telefone || "",
          distrito_residencia: data.distrito_residencia || "Lisboa",
          experiencia_anos: data.experiencia_anos || "0",
          outras_competencias: data.outras_competencias || "",
          bio: data.bio || data.biografia || "",
        });
        setFotoUrl(data.fotografia_url || "");
        setCvUrl(data.cv_url || data.curriculo_url || "");
        setAutorizacaoUrl(data.autorizacao_parental_url || "");
        setCertificacoes(
          Array.isArray(data.certificacoes) ? data.certificacoes : []
        );
        setDisponibilidadeEpocas(
          Array.isArray(data.disponibilidade) ? data.disponibilidade : []
        );
        setAreasAtuacao(
          Array.isArray(data.areas_atuacao) ? data.areas_atuacao : []
        );
        setCalendario(data.calendario_disponibilidade || {});
      }

      setLoadingData(false);
    };

    carregarDadosMonitor();
  }, [lang, router]);

  // Verifica se o monitor é menor de 18 anos
  const calcularIdade = (dataNasc: string) => {
    if (!dataNasc) return 18;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    if (isNaN(nasc.getTime())) return 18;
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const eMenor = calcularIdade(formData.data_nascimento) < 18;

  const gerarDocumentoAutorizacao = () => {
    const doc = new jsPDF({ format: "a4", unit: "mm" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      "TERMO DE AUTORIZAÇÃO PARENTAL - BOLSA DE MONITORES HELLOCAMP",
      20,
      30
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const texto = `Eu, abaixo assinado(a), na qualidade de Encarregado(a) de Educação do(a) menor ${
      formData.nome_completo || "________________________________"
    }, nascido(a) a ${
      formData.data_nascimento || "__/__/____"
    }, autorizo a sua inscrição na Bolsa de Monitores da plataforma HelloCamp (www.hellocamp.pt) para efeitos de candidatura a funções de monitoria/apoio em campos de férias.\n\nData: ____/____/2026\n\nAssinatura do Encarregado de Educação:\n\n____________________________________________________\n(N.º Cartão de Cidadão: ________________________)`;
    const split = doc.splitTextToSize(texto, 170);
    doc.text(split, 20, 50);
    doc.save("Autorizacao_Parental_HelloCamp.pdf");
  };

  const handleUploadAutorizacao = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploadingAutorizacao(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      setAutorizacaoFileName(file.name);
      const ext = file.name.split(".").pop();
      const fileName = `aut_${userId}_${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("monitores-cvs")
        .upload(fileName, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("monitores-cvs")
        .getPublicUrl(fileName);
      setAutorizacaoUrl(urlData.publicUrl);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingAutorizacao(false);
    }
  };

  const handleUploadFoto = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploadingFoto(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `foto_${userId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("monitores-fotos")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("monitores-fotos")
        .getPublicUrl(fileName);
      setFotoUrl(urlData.publicUrl);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleUploadCV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingCV(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      setCvFileName(file.name);
      const fileExt = file.name.split(".").pop();
      const fileName = `cv_${userId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("monitores-cvs")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("monitores-cvs")
        .getPublicUrl(fileName);
      setCvUrl(urlData.publicUrl);
    } catch (error: any) {
      setCvFileName("");
      alert(error.message);
    } finally {
      setUploadingCV(false);
    }
  };

  const handleCheckboxChange = (id: string, tipo: "cert" | "disp" | "zona") => {
    if (tipo === "cert") {
      setCertificacoes((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else if (tipo === "disp") {
      setDisponibilidadeEpocas((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else if (tipo === "zona") {
      setAreasAtuacao((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const mudarMes = (incremento: number) =>
    setDataVisualizada(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + incremento, 1)
    );

  const toggleDiaCalendario = (dataISO: string) => {
    setCalendario((prev) => {
      const atual = prev[dataISO];
      if (!atual) return { ...prev, [dataISO]: "Livre" };
      if (atual === "Livre") return { ...prev, [dataISO]: "Ocupado" };
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
    for (let i = 0; i < startDayIndex; i++)
      dias.push(<div key={`empty-${i}`} className="p-2" />);

    for (let i = 1; i <= diasNoMes; i++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(
        i
      ).padStart(2, "0")}`;
      const estadoDia = calendario[dataStr];

      let coresClasses =
        "bg-white border-slate-200 text-slate-700 hover:bg-slate-100";
      if (estadoDia === "Livre")
        coresClasses =
          "bg-emerald-100 border-emerald-500 text-emerald-800 font-black shadow-inner";
      if (estadoDia === "Ocupado")
        coresClasses =
          "bg-red-100 border-red-500 text-red-800 font-black opacity-80 line-through";

      dias.push(
        <button
          key={dataStr}
          type="button"
          onClick={() => toggleDiaCalendario(dataStr)}
          className={`h-10 md:h-12 w-full rounded-xl border text-xs md:text-sm font-bold transition-all flex items-center justify-center cursor-pointer ${coresClasses}`}
        >
          {i}
        </button>
      );
    }
    return dias;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);

    try {
      const payload = {
        id: userId,
        email,
        nome_completo: formData.nome_completo,
        data_nascimento: formData.data_nascimento,
        telefone: formData.telefone,
        distrito_residencia: formData.distrito_residencia,
        experiencia_anos: formData.experiencia_anos,
        outras_competencias: formData.outras_competencias,
        bio: formData.bio,
        fotografia_url: fotoUrl,
        cv_url: cvUrl,
        autorizacao_parental_url: autorizacaoUrl || null,
        certificacoes,
        disponibilidade: disponibilidadeEpocas,
        areas_atuacao: areasAtuacao,
        calendario_disponibilidade: calendario,
      };

      const { error } = await supabase.from("monitores").upsert([payload]);
      if (error) throw error;

      alert(
        isEn
          ? "Profile updated successfully!"
          : "O teu perfil de monitor foi atualizado com sucesso!"
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">
        {isEn ? "Loading your profile..." : "A carregar o teu perfil..."}
      </div>
    );
  }

  const labelClass =
    "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1";
  const inputClass =
    "w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#2563eb] focus:bg-white transition-colors";

  const opcoesExp = [
    {
      val: "0",
      label: isEn
        ? "First Time / No experience"
        : "Nenhuma / Primeira vez a candidatar-me",
    },
    {
      val: "1-2",
      label: isEn ? "1-2 years" : "1-2 anos de experiência em campos",
    },
    {
      val: "3-5",
      label: isEn ? "3-5 years" : "3-5 anos de experiência em campos",
    },
    {
      val: "+5",
      label: isEn ? "+5 years (Senior)" : "+5 anos (Sénior/Coordenador)",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-2">
          {isEn ? "Manage Your Profile" : "Gerir o teu Perfil"}
        </h1>
        <p className="text-sm md:text-base text-slate-500 font-medium m-0 leading-relaxed max-w-2xl">
          {isEn
            ? "Update your availability, upload a new photo, and keep your experience up to date to get more offers."
            : "Atualiza a tua disponibilidade de calendário, altera a tua fotografia e mantém a tua experiência em dia para receberes mais propostas."}
        </p>
      </div>

      {eMenor && (
        <div className="mb-10 p-6 md:p-8 bg-amber-50 border-2 border-amber-200 rounded-[2rem] flex flex-col items-center text-center shadow-sm">
          <span className="text-4xl mb-4">⚠️</span>
          <h3 className="text-xl font-black text-amber-900 mb-2">
            Monitor Menor de 18 Anos
          </h3>
          <p className="text-amber-800 font-medium text-sm max-w-2xl leading-relaxed mb-6">
            Para ficares visível para as entidades organizadoras, é obrigatório
            anexares a autorização assinada pelo teu Encarregado de Educação.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
            <button
              type="button"
              onClick={gerarDocumentoAutorizacao}
              className="flex-1 bg-white border-2 border-amber-300 hover:bg-amber-100 text-amber-900 font-black px-5 py-4 rounded-xl text-xs uppercase tracking-widest cursor-pointer"
            >
              1. Descarregar Minuta PDF
            </button>
            <label className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black px-5 py-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center cursor-pointer shadow-md">
              {uploadingAutorizacao
                ? "A carregar..."
                : autorizacaoFileName
                ? `✔️ ${autorizacaoFileName.substring(0, 14)}...`
                : "2. Anexar Assinado"}
              <input
                type="file"
                accept=".pdf,.jpeg,.jpg,.png"
                onChange={handleUploadAutorizacao}
                disabled={uploadingAutorizacao}
                className="hidden"
              />
            </label>
          </div>

          {autorizacaoUrl && (
            <a
              href={autorizacaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-4 py-2 rounded-lg no-underline"
            >
              ✓ Ver Autorização Anexada
            </a>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* SECÇÃO 1: FOTO, CV & IDENTIFICAÇÃO */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-4 mb-8 uppercase tracking-widest flex items-center gap-3 m-0">
            <span className="text-2xl">📸</span>{" "}
            {isEn ? "1. Profile & Resume" : "1. Perfil Pessoal e CV"}
          </h3>

          <div className="mb-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-slate-50 border-4 border-slate-100 shadow-sm overflow-hidden flex items-center justify-center flex-shrink-0 relative">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl text-slate-300">👤</span>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <label className="block text-sm font-black text-slate-900 mb-1">
                {isEn ? "Profile Picture" : "Fotografia de Rosto"}
              </label>
              <p className="text-xs text-slate-500 font-medium mb-4">
                {isEn
                  ? "Camps prefer profiles with clear photos."
                  : "Um perfil com fotografia atrai 3x mais propostas de recrutamento."}
              </p>
              <label className="inline-block bg-slate-100 border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl shadow-sm hover:border-[#2563eb] hover:text-[#2563eb] cursor-pointer">
                {uploadingFoto
                  ? isEn
                    ? "Uploading..."
                    : "A carregar..."
                  : isEn
                  ? "Change Photo"
                  : "Alterar Fotografia"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadFoto}
                  disabled={uploadingFoto}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="mb-10 flex flex-col sm:flex-row items-center gap-6 pt-8 border-t border-slate-100">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0">
              <span className="text-3xl text-slate-400">📄</span>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <label className="block text-sm font-black text-slate-900 mb-1">
                {isEn ? "Update your Resume (CV)" : "Atualizar Currículo (CV)"}
              </label>
              <p className="text-xs text-slate-500 font-medium mb-4">
                {isEn
                  ? "PDF or Word files only. Only visible to verified camps."
                  : "Ficheiro PDF ou DOCX. Fica visível apenas para organizadores verificados."}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <label className="bg-slate-100 border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl cursor-pointer hover:border-[#2563eb]">
                  {uploadingCV
                    ? "..."
                    : cvFileName
                    ? `✔️ ${cvFileName.substring(0, 15)}...`
                    : isEn
                    ? "Upload Resume"
                    : "Substituir Currículo"}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleUploadCV}
                    disabled={uploadingCV}
                    className="hidden"
                  />
                </label>
                {cvUrl && (
                  <a
                    href={cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-black uppercase tracking-widest text-[#2563eb] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-6 py-3.5 rounded-xl no-underline"
                  >
                    {isEn ? "View Current CV" : "Ver CV Atual"}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-slate-100">
            <div className="sm:col-span-2">
              <label className={labelClass}>
                {isEn ? "Full Name" : "Nome Completo"}
              </label>
              <input
                type="text"
                required
                className={inputClass}
                value={formData.nome_completo}
                onChange={(e) =>
                  setFormData({ ...formData, nome_completo: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>
                {isEn ? "Date of Birth" : "Data de Nascimento"}
              </label>
              <input
                type="date"
                required
                className={inputClass}
                value={formData.data_nascimento}
                onChange={(e) =>
                  setFormData({ ...formData, data_nascimento: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>
                {isEn ? "Phone Number" : "Contacto Telefónico"}
              </label>
              <input
                type="tel"
                required
                className={inputClass}
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>
                {isEn ? "Login Email" : "E-mail de Login"}
              </label>
              <input
                type="email"
                disabled
                className={`${inputClass} opacity-50 cursor-not-allowed bg-slate-100`}
                value={email}
              />
            </div>
          </div>
        </div>

        {/* SECÇÃO 2: LOCALIZAÇÃO & ATUAÇÃO (COM DROPDOWN CUSTOMIZADO) */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-4 mb-8 uppercase tracking-widest flex items-center gap-3 m-0">
            <span className="text-2xl">📍</span>{" "}
            {isEn ? "2. Location & Work Areas" : "2. Zonas de Atuação"}
          </h3>

          <div className="mb-8 relative">
            <label className={labelClass}>
              {isEn
                ? "Where do you currently live?"
                : "Onde resides atualmente?"}
            </label>
            <div
              onClick={() =>
                setOpenDropdown(
                  openDropdown === "distrito" ? null : "distrito"
                )
              }
              className={`${inputClass} cursor-pointer flex justify-between items-center`}
            >
              <span>{formData.distrito_residencia}</span>
              <span className="text-[10px] text-slate-400">▼</span>
            </div>
            {openDropdown === "distrito" && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                {DISTRITOS_PT.map((d) => (
                  <div
                    key={d}
                    onClick={() => {
                      setFormData({ ...formData, distrito_residencia: d });
                      setOpenDropdown(null);
                    }}
                    className="p-3.5 text-xs font-bold hover:bg-blue-50 cursor-pointer"
                  >
                    {d}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 bg-slate-50 border border-slate-200 rounded-2xl">
            <label className={labelClass}>
              {isEn
                ? "Where are you willing to work?"
                : "Em que zonas estás disponível para trabalhar?"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {opcoesAtuacao.map((zona) => (
                <label
                  key={zona}
                  className={`flex items-start gap-3 p-4 bg-white border-2 rounded-xl cursor-pointer transition-all select-none ${
                    areasAtuacao.includes(zona)
                      ? "border-[#2563eb] bg-blue-50/30 shadow-sm"
                      : "border-slate-200 hover:border-[#2563eb]/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={areasAtuacao.includes(zona)}
                    onChange={() => handleCheckboxChange(zona, "zona")}
                    className="mt-0.5 w-4 h-4 accent-[#2563eb] cursor-pointer flex-shrink-0"
                  />
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {zona}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* SECÇÃO 3: EXPERIÊNCIA E COMPETÊNCIAS (COM DROPDOWN CUSTOMIZADO) */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-4 mb-8 uppercase tracking-widest flex items-center gap-3 m-0">
            <span className="text-2xl">🏆</span>{" "}
            {isEn ? "3. Experience & Skills" : "3. Experiência e Competências"}
          </h3>

          <div className="mb-8 relative">
            <label className={labelClass}>
              {isEn ? "Years of Experience" : "Anos de Experiência na Área"}
            </label>
            <div
              onClick={() =>
                setOpenDropdown(openDropdown === "exp" ? null : "exp")
              }
              className={`${inputClass} cursor-pointer flex justify-between items-center`}
            >
              <span>
                {
                  opcoesExp.find((o) => o.val === formData.experiencia_anos)
                    ?.label
                }
              </span>
              <span className="text-[10px] text-slate-400">▼</span>
            </div>
            {openDropdown === "exp" && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {opcoesExp.map((op) => (
                  <div
                    key={op.val}
                    onClick={() => {
                      setFormData({ ...formData, experiencia_anos: op.val });
                      setOpenDropdown(null);
                    }}
                    className="p-3.5 text-xs font-bold hover:bg-blue-50 cursor-pointer"
                  >
                    {op.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-8">
            <label className={labelClass}>
              {isEn
                ? "Certificates & Core Skills"
                : "Certificações e Habilidades Base"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {LISTA_CERTIFICADOS.map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 p-4 bg-white border-2 rounded-xl cursor-pointer transition-all select-none ${
                    certificacoes.includes(c.id)
                      ? "border-[#2563eb] bg-blue-50/30 shadow-sm"
                      : "border-slate-200 hover:border-[#2563eb]/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={certificacoes.includes(c.id)}
                    onChange={() => handleCheckboxChange(c.id, "cert")}
                    className="w-5 h-5 accent-[#2563eb] cursor-pointer flex-shrink-0"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {isEn ? c.en : c.pt}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              {isEn
                ? "Other relevant skills (Optional)"
                : "Outras Competências / Talentos (Opcional)"}
            </label>
            <input
              type="text"
              className={inputClass}
              value={formData.outras_competencias}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  outras_competencias: e.target.value,
                })
              }
              placeholder={
                isEn
                  ? "E.g. Yoga instructor, DJ, Photography..."
                  : "Ex: Toco viola, Dou aulas de dança, Fotografia, Programação..."
              }
            />
          </div>
        </div>

        {/* SECÇÃO 4: DISPONIBILIDADE E BIO */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-4 mb-8 uppercase tracking-widest flex items-center gap-3 m-0">
            <span className="text-2xl">📅</span>{" "}
            {isEn
              ? "4. Availability & Pitch"
              : "4. Disponibilidade e Apresentação"}
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
            <div>
              <label className={labelClass}>
                {isEn
                  ? "General Availability"
                  : "Disponibilidade Sazonal Geral"}
              </label>
              <div className="flex flex-col gap-3 mt-3">
                {LISTA_EPOCAS.map((e) => (
                  <label
                    key={e.id}
                    className={`flex items-center gap-4 p-4 bg-white border-2 rounded-xl cursor-pointer transition-colors select-none ${
                      disponibilidadeEpocas.includes(e.id)
                        ? "border-[#2563eb] bg-blue-50/30"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={disponibilidadeEpocas.includes(e.id)}
                      onChange={() => handleCheckboxChange(e.id, "disp")}
                      className="w-5 h-5 accent-[#2563eb] cursor-pointer flex-shrink-0"
                    />
                    <span className="text-sm font-bold text-slate-800">
                      {isEn ? e.en : e.pt}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>
                {isEn ? "Specific Calendar" : "Calendário Específico Diário"}
              </label>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm select-none mt-3">
                <div className="flex justify-between items-center mb-6 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => mudarMes(-1)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 font-black hover:bg-white cursor-pointer"
                  >
                    &larr;
                  </button>
                  <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    {mesesNomes[dataVisualizada.getMonth()]}{" "}
                    {dataVisualizada.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={() => mudarMes(1)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 font-black hover:bg-white cursor-pointer"
                  >
                    &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                  {diasDaSemana.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] font-black text-slate-400 uppercase"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderDiasCalendario()}
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 flex gap-5 justify-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 border-2 border-emerald-500 inline-block" />{" "}
                    Livre
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-100 border-2 border-red-500 inline-block" />{" "}
                    Ocupado
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              {isEn ? "Short Bio / Pitch" : "A tua Bio / Carta de Apresentação"}
            </label>
            <textarea
              rows={5}
              required
              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-[#2563eb] resize-none"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting || (eMenor && !autorizacaoUrl)}
            className="w-full md:w-auto bg-[#2563eb] text-white font-black uppercase tracking-widest text-xs md:text-sm px-12 py-5 rounded-2xl shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting
              ? isEn
                ? "Saving Profile..."
                : "A Guardar as Alterações..."
              : isEn
              ? "Save Changes"
              : "Guardar Alterações do Perfil"}
          </button>
        </div>
      </form>
    </div>
  );
}
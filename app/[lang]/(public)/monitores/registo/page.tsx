"use client";

import React, { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function RegistoMonitorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Foto e CV
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string>("");
  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvUrl, setCvUrl] = useState<string>("");
  const [cvFileName, setCvFileName] = useState<string>("");

  const [termosAceites, setTermosAceites] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

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
  const [disponibilidadeEpocas, setDisponibilidadeEpocas] = useState<string[]>([
    "Verao",
  ]);
  const [areasAtuacao, setAreasAtuacao] = useState<string[]>([]);

  // Calendário
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

  const handleUploadFoto = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploadingFoto(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `foto_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

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
      const fileName = `cv_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

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

  const mudarMes = (incremento: number) => {
    setDataVisualizada(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + incremento, 1)
    );
  };

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
    for (let i = 0; i < startDayIndex; i++) {
      dias.push(<div key={`empty-${i}`} className="p-2" />);
    }

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
          className={`h-10 md:h-11 w-full rounded-xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${coresClasses}`}
        >
          {i}
        </button>
      );
    }
    return dias;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termosAceites) {
      alert(
        isEn
          ? "You must accept the Terms and Conditions."
          : "Tem de aceitar os Termos e Condições para continuar."
      );
      return;
    }
    if (areasAtuacao.length === 0) {
      alert(
        isEn
          ? "Please select at least one work area."
          : "Por favor, selecione pelo menos uma zona de atuação."
      );
      return;
    }

    setSubmitting(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
        options: {
          data: {
            nome_completo: formData.nome_completo,
            telefone: formData.telefone,
            role: "monitor",
          },
        },
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || "Erro ao criar conta.");
      }

      const userId = authData.user.id;

      await supabase.from("perfis").upsert({
        id: userId,
        nome_completo: formData.nome_completo,
        telefone: formData.telefone,
        role: "monitor",
        email: authEmail.trim(),
      });

      // Extrai array de dias livres para compatibilidade total com a página de Recrutamento do Parceiro!
      const diasLivresArray = Object.entries(calendario)
        .filter(([_, estado]) => estado === "Livre")
        .map(([dt]) => dt);

      const payload: Record<string, any> = {
        id: userId,
        email: authEmail.trim(),
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
        calendario_disponibilidade: calendario,
      };

      const { error: monitorError } = await supabase
        .from("monitores")
        .upsert([payload]);

      if (monitorError) throw monitorError;

      router.push(`/${lang}/monitores/portal/perfil`);
    } catch (err: any) {
      alert(err.message);
      setSubmitting(false);
    }
  };

  const labelClass =
    "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1";
  const inputClass =
    "w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#2563eb] focus:bg-white transition-colors";

  const opcoesExp = [
    {
      val: "0",
      label: isEn
        ? "First Time / No experience"
        : "Nenhuma / Primeira experiência",
    },
    { val: "1-2", label: isEn ? "1-2 years" : "1 a 2 anos de experiência" },
    { val: "3-5", label: isEn ? "3-5 years" : "3 a 5 anos de experiência" },
    { val: "+5", label: isEn ? "+5 years (Senior)" : "+5 anos (Sénior)" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/${lang}/monitores`}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 mb-6 no-underline"
        >
          &larr; {isEn ? "Back" : "Voltar à Bolsa de Monitores"}
        </Link>

        <div className="mb-10">
          <span className="inline-block bg-blue-50 text-[#2563eb] border border-blue-200 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            100% Grátis • Sem Comissões
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 m-0 tracking-tight">
            {isEn ? "Create Monitor Profile" : "Criar Perfil de Monitor"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. CREDENCIAIS E DADOS PESSOAIS */}
          <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 m-0 pb-4 border-b border-slate-100">
              1. {isEn ? "Account & Personal Details" : "Conta e Dados Pessoais"}
            </h2>

            {/* Upload Foto e CV */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="w-16 h-16 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center text-2xl flex-shrink-0">
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "📸"
                  )}
                </div>
                <div className="flex-1">
                  <span className="block text-xs font-black text-slate-900 mb-1">
                    {isEn ? "Profile Photo" : "Fotografia de Rosto"}
                  </span>
                  <label className="inline-block bg-white border border-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl cursor-pointer hover:border-[#2563eb]">
                    {uploadingFoto
                      ? "..."
                      : isEn
                      ? "Upload Photo"
                      : "Escolher Foto"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadFoto}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl flex-shrink-0">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-black text-slate-900 mb-1 truncate">
                    {cvFileName ||
                      (isEn ? "Resume / CV (Optional)" : "Currículo PDF (Opcional)")}
                  </span>
                  <label className="inline-block bg-white border border-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl cursor-pointer hover:border-[#2563eb]">
                    {uploadingCV ? "..." : isEn ? "Upload CV" : "Anexar CV"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleUploadCV}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  {isEn ? "Full Name *" : "Nome Completo *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome_completo}
                  onChange={(e) =>
                    setFormData({ ...formData, nome_completo: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isEn ? "Date of Birth *" : "Data de Nascimento *"}
                </label>
                <input
                  type="date"
                  required
                  value={formData.data_nascimento}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      data_nascimento: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isEn ? "Phone *" : "Telemóvel *"}
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>E-mail (Login) *</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isEn ? "Password *" : "Palavra-Passe *"}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* 2. ZONAS DE ATUAÇÃO (COM DROPDOWN CUSTOMIZADO) */}
          <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 m-0 pb-4 border-b border-slate-100">
              2. {isEn ? "Location & Work Zones" : "Residência e Zonas de Atuação"}
            </h2>

            <div className="relative">
              <label className={labelClass}>
                {isEn ? "District of Residence *" : "Distrito de Residência *"}
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
                      className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {isEn
                  ? "Where are you available to work? *"
                  : "Em que distritos estás disponível para trabalhar? *"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
                {opcoesAtuacao.map((zona) => (
                  <label
                    key={zona}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-bold ${
                      areasAtuacao.includes(zona)
                        ? "border-[#2563eb] bg-blue-50 text-[#2563eb]"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={areasAtuacao.includes(zona)}
                      onChange={() => handleCheckboxChange(zona, "zona")}
                      className="accent-[#2563eb]"
                    />
                    <span className="truncate">{zona}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 3. EXPERIÊNCIA, CERTIFICAÇÕES E CALENDÁRIO */}
          <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 m-0 pb-4 border-b border-slate-100">
              3.{" "}
              {isEn
                ? "Experience, Certificates & Calendar"
                : "Experiência, Certificações e Calendário"}
            </h2>

            <div className="relative">
              <label className={labelClass}>
                {isEn ? "Years of Experience" : "Anos de Experiência"}
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

            <div>
              <label className={labelClass}>
                {isEn ? "Certifications" : "Certificações"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {LISTA_CERTIFICADOS.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer text-xs font-bold ${
                      certificacoes.includes(c.id)
                        ? "border-[#2563eb] bg-blue-50 text-[#2563eb]"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={certificacoes.includes(c.id)}
                      onChange={() => handleCheckboxChange(c.id, "cert")}
                      className="accent-[#2563eb]"
                    />
                    <span>{isEn ? c.en : c.pt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <label className={labelClass}>
                  {isEn ? "Holiday Availability" : "Épocas de Férias"}
                </label>
                <div className="space-y-2.5">
                  {LISTA_EPOCAS.map((ep) => (
                    <label
                      key={ep.id}
                      className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-xs font-bold"
                    >
                      <input
                        type="checkbox"
                        checked={disponibilidadeEpocas.includes(ep.id)}
                        onChange={() => handleCheckboxChange(ep.id, "disp")}
                        className="accent-[#2563eb]"
                      />
                      <span>{isEn ? ep.en : ep.pt}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-6">
                  <label className={labelClass}>
                    {isEn ? "Short Bio / Pitch *" : "Apresentação / Bio *"}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Fala sobre a tua motivação e experiência com crianças e jovens..."
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              {/* Calendário Interativo */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <button
                    type="button"
                    onClick={() => mudarMes(-1)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black cursor-pointer"
                  >
                    &larr;
                  </button>
                  <span className="text-xs font-black uppercase tracking-widest">
                    {mesesNomes[dataVisualizada.getMonth()]}{" "}
                    {dataVisualizada.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={() => mudarMes(1)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black cursor-pointer"
                  >
                    &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {diasDaSemana.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] font-black text-slate-400"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {renderDiasCalendario()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termosAceites}
                onChange={(e) => setTermosAceites(e.target.checked)}
                className="mt-1 w-5 h-5 accent-[#2563eb]"
              />
              <span className="text-xs font-bold text-slate-600">
                Li e aceito os{" "}
                <Link
                  href={`/${lang}/monitores/termos`}
                  target="_blank"
                  className="text-[#2563eb] underline"
                >
                  Termos de Utilização da Bolsa de Monitores
                </Link>{" "}
                e autorizo a partilha do meu perfil com organizadores verificados.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 py-4 bg-[#2563eb] hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg cursor-pointer"
            >
              {submitting
                ? "..."
                : isEn
                ? "Create Monitor Account"
                : "Concluir Registo de Monitor"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
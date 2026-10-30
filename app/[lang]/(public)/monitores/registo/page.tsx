"use client";

import React, { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";

const DISTRITOS_PT = [
  "Aveiro",
  "Beja",
  "Braga",
  "Bragança",
  "Castelo Branco",
  "Coimbra",
  "Évora",
  "Faro",
  "Guarda",
  "Leiria",
  "Lisboa",
  "Portalegre",
  "Porto",
  "Santarém",
  "Setúbal",
  "Viana do Castelo",
  "Vila Real",
  "Viseu",
  "Ilha da Madeira",
  "Ilha dos Açores",
];

const CARGOS_OPCOES = [
  "Monitor(a) de Campos de Férias",
  "Coordenador(a) Pedagógico(a) (IPDJ)",
  "Instrutor(a) Desportivo / Surf / Náutica",
  "Monitor(a) de Oficinas / Artes / Ciência",
  "Professor(a) de Línguas",
  "Monitor(a) de Apoio NEE (Necessidades Especiais)",
  "Socorrista / Nadador Salvador / Enfermagem",
  "Monitor(a) Estagiário / 1.ª Experiência",
];

const MODALIDADES_TRABALHO = [
  "Ambos (Diurno e Residencial c/ Dormida)",
  "Apenas Campos Diurnos (Externato)",
  "Apenas Campos Residenciais (Com Alojamento)",
];

const LINGUAS_OPCOES = [
  "Português",
  "Inglês",
  "Espanhol",
  "Francês",
  "Alemão",
  "Italiano",
];

const EPOCAS_OPCOES = [
  { id: "Verão", labelPt: "Férias de Verão (Jun - Set)", labelEn: "Summer Holidays (Jun - Sep)" },
  { id: "Páscoa", labelPt: "Férias da Páscoa", labelEn: "Easter Break" },
  { id: "Carnaval", labelPt: "Férias de Carnaval", labelEn: "Carnival Break" },
  { id: "Natal", labelPt: "Férias de Natal", labelEn: "Christmas Break" },
  { id: "Fins de Semana", labelPt: "Fins de Semana / Eventos", labelEn: "Weekends & Events" },
];

const LISTA_CERTIFICADOS = [
  { id: "IPDJ", pt: "Monitor de Campos de Férias (IPDJ)", en: "Camp Monitor (IPDJ)" },
  { id: "Coordenador_IPDJ", pt: "Coordenador de Campos de Férias (IPDJ)", en: "Camp Coordinator (IPDJ)" },
  { id: "Socorrismo", pt: "Primeiros Socorros / Suporte Básico de Vida", en: "First Aid / Basic Life Support" },
  { id: "Nadador", pt: "Nadador Salvador Certificado", en: "Certified Lifeguard" },
  { id: "Professor", pt: "Licenciatura em Educação / Desporto", en: "Education / Sports Degree" },
  { id: "Surf_Nautica", pt: "Treinador de Surf / Desportos Náuticos", en: "Surf / Watersports Coach" },
  { id: "Animacao", pt: "Técnico de Animação Sociocultural", en: "Sociocultural Animation" },
  { id: "Linguas", pt: "Certificação em Línguas Estrangeiras (C1/C2)", en: "Foreign Languages (C1/C2)" },
  { id: "Artes", pt: "Artes Plásticas / Música / Teatro / Dança", en: "Arts / Music / Theater / Dance" },
  { id: "NEE", pt: "Experiência com Necessidades Educativas Especiais", en: "Special Needs Experience (SEN)" },
  { id: "Carta_Conducao", pt: "Carta de Condução (Categoria B)", en: "Driver's License (Cat B)" },
  { id: "Registo_Criminal", pt: "Registo Criminal Limpo (Contacto c/ Menores)", en: "Clean Criminal Record (Minors)" },
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
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingAuth, setUploadingAuth] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Credenciais de Acesso
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Dados Pessoais e Profissionais Enriquecidos
  const [formData, setFormData] = useState({
    nome_completo: "",
    data_nascimento: "",
    telefone: "",
    distrito_residencia: "Lisboa",
    experiencia_anos: "1",
    cargo_preferido: "Monitor(a) de Campos de Férias",
    modalidade_preferida: "Ambos (Diurno e Residencial c/ Dormida)",
    tamanho_tshirt: "M",
    carta_conducao: "Não",
    outras_competencias: "",
    bio: "",
  });

  const [linguasFaladas, setLinguasFaladas] = useState<string[]>([
    "Português",
    "Inglês",
  ]);
  const [certificacoes, setCertificacoes] = useState<string[]>([]);
  const [disponibilidadeEpocas, setDisponibilidadeEpocas] = useState<string[]>([
    "Verão",
  ]);
  const [areasAtuacao, setAreasAtuacao] = useState<string[]>(["Lisboa"]);

  // Ficheiros
  const [fotoUrl, setFotoUrl] = useState<string>("");
  const [cvUrl, setCvUrl] = useState<string>("");
  const [autorizacaoParentalUrl, setAutorizacaoParentalUrl] =
    useState<string>("");

  // Calendário Interativo de Dias Disponíveis
  const [mesAtual, setMesAtual] = useState<Date>(new Date(2026, 6, 1)); // Julho 2026 por defeito
  const [calendario, setCalendario] = useState<string[]>([]);
  const [termosAceites, setTermosAceites] = useState(false);

  const opcoesAtuacao = [
    isEn
      ? "Nationwide (With Accommodation)"
      : "Em todo o país (Com Alojamento / Deslocação)",
    ...DISTRITOS_PT,
  ];

  // Cálculo de Idade para Verificar se tem 16 ou 17 anos (Menor de 18)
  const calcularIdade = (dataNasc: string) => {
    if (!dataNasc) return 20;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const idadeCalculada = calcularIdade(formData.data_nascimento);
  const isMenor = Boolean(
    formData.data_nascimento && idadeCalculada >= 15 && idadeCalculada < 18
  );

  // Gerar PDF de Minuta de Autorização Parental para Menores de 18 anos
  const gerarMinutaParentalPDF = () => {
    const doc = new jsPDF({ format: "a4", unit: "mm" });
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 32, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(
      "HELLOCAMP • DECLARACAO DE AUTORIZACAO PARENTAL",
      pageW / 2,
      18,
      { align: "center" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);

    const texto = `Eu, abaixo assinado(a), na qualidade de Encarregado(a) de Educacao legal do(a) jovem ${
      formData.nome_completo || "________________________________________"
    }, nascido(a) a ${
      formData.data_nascimento || "____/____/______"
    }, residente no distrito de ${
      formData.distrito_residencia
    }, declaro expressamente que autorizo a criacao do seu perfil na Bolsa de Monitores da plataforma HelloCamp (www.hellocamp.pt), bem como a partilha do seu perfil e curriculo com entidades organizadoras de campos de ferias certificadas para efeitos de recrutamento ou voluntariado juvenil.\n\nData: ____ / ____ / 2026\n\nNome do Encarregado de Educacao: __________________________________________________\n\nNumero de CC / BI: ________________________   Telemovel: ________________________\n\nAssinatura do Encarregado de Educacao:\n\n\n________________________________________________________________________`;

    const lines = doc.splitTextToSize(texto, pageW - 32);
    doc.text(lines, 16, 48);
    doc.save("Minuta_Autorizacao_Parental_HelloCamp.pdf");
  };

  // Upload de Ficheiros para o Supabase Storage
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: "foto" | "cv" | "auth"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (tipo === "foto") setUploadingFoto(true);
    if (tipo === "cv") setUploadingCv(true);
    if (tipo === "auth") setUploadingAuth(true);

    try {
      const ext = file.name.split(".").pop();
      const bucket = tipo === "foto" ? "campos-imagens" : "campos-documentos";
      const fileName = `monitor_${tipo}_${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        if (tipo === "foto") setFotoUrl(urlData.publicUrl);
        if (tipo === "cv") setCvUrl(urlData.publicUrl);
        if (tipo === "auth") setAutorizacaoParentalUrl(urlData.publicUrl);
      }
    } catch (err: any) {
      alert("Erro ao carregar ficheiro: " + err.message);
    } finally {
      if (tipo === "foto") setUploadingFoto(false);
      if (tipo === "cv") setUploadingCv(false);
      if (tipo === "auth") setUploadingAuth(false);
    }
  };

  const toggleItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    val: string
  ) => {
    if (list.includes(val)) {
      setList(list.filter((i) => i !== val));
    } else {
      setList([...list, val]);
    }
  };

  // Calendário Mensal Interativo
  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
  const diasDoMes: string[] = [];
  for (let d = 1; d <= totalDiasMes; d++) {
    const iso = new Date(ano, mes, d).toISOString().split("T")[0];
    diasDoMes.push(iso);
  }

  const selecionarMesInteiro = () => {
    const todosJaSelecionados = diasDoMes.every((d) => calendario.includes(d));
    if (todosJaSelecionados) {
      setCalendario(calendario.filter((d) => !diasDoMes.includes(d)));
    } else {
      setCalendario(Array.from(new Set([...calendario, ...diasDoMes])));
    }
  };

  const handleSubmeterRegisto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termosAceites) {
      alert(
        isEn
          ? "You must accept the Terms and Conditions."
          : "Tem de aceitar os Termos e Condições da Bolsa de Monitores para continuar."
      );
      return;
    }
    if (authPassword.length < 6) {
      alert(
        isEn
          ? "Password must be at least 6 characters."
          : "A palavra-passe deve ter pelo menos 6 caracteres."
      );
      return;
    }
    if (authPassword !== confirmPassword) {
      alert(
        isEn
          ? "Passwords do not match."
          : "As duas palavras-passe introduzidas não coincidem."
      );
      return;
    }
    if (areasAtuacao.length === 0) {
      alert(
        isEn
          ? "Please select at least one work region."
          : "Por favor, selecione pelo menos uma zona de atuação."
      );
      return;
    }

    setSubmitting(true);

    try {
      const cleanEmail = authEmail.trim().toLowerCase();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
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
        email: cleanEmail,
      });

      // Compilar resumo rico das competências adicionais para ficar 100% compatível com todas as colunas da tabela `monitores`
      const competenciasEnriquecidas = [
        `Cargo: ${formData.cargo_preferido}`,
        `Modalidade: ${formData.modalidade_preferida}`,
        `Línguas: ${linguasFaladas.join(", ")}`,
        `Carta Condução: ${formData.carta_conducao}`,
        `T-Shirt: ${formData.tamanho_tshirt}`,
        formData.outras_competencias
          ? `Especialidades: ${formData.outras_competencias}`
          : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const payload: any = {
        id: userId,
        email: cleanEmail,
        nome_completo: formData.nome_completo,
        data_nascimento: formData.data_nascimento,
        telefone: formData.telefone,
        distrito_residencia: formData.distrito_residencia,
        experiencia_anos: Number(formData.experiencia_anos) || 0,
        outras_competencias: competenciasEnriquecidas,
        bio: formData.bio,
        fotografia_url: fotoUrl || null,
        cv_url: cvUrl || null,
        autorizacao_parental_url: autorizacaoParentalUrl || null,
        certificacoes,
        disponibilidade: disponibilidadeEpocas,
        areas_atuacao: areasAtuacao,
        calendario_disponibilidade: calendario,
      };

      const { error: monitorError } = await supabase
        .from("monitores")
        .upsert([payload]);

      if (monitorError) {
        throw new Error(monitorError.message);
      }

      router.push(`/${lang}/monitores/portal/perfil`);
    } catch (err: any) {
      alert("Erro: " + err.message);
      setSubmitting(false);
    }
  };

  const labelClass =
    "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5";
  const inputClass =
    "w-full py-3 px-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-colors";

  return (
    <main className="min-h-screen bg-[#F8FAFC] py-12 px-4 font-sans text-[#0F172A] pb-24">
      <div className="max-w-4xl mx-auto">
        {/* TOPO */}
        <div className="bg-[#0F172A] text-white p-8 md:p-10 rounded-md border-b-4 border-[#F59E0B] mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div>
            <span className="bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md inline-block mb-2">
              🎓 {isEn ? "Free Monitor Registration" : "Inscrição Gratuita • Bolsa Nacional"}
            </span>
            <h1 className="text-2xl md:text-3xl font-black m-0">
              {isEn
                ? "Create Your Monitor / Coordinator Profile"
                : "Criar Perfil de Monitor / Coordenador"}
            </h1>
            <p className="text-xs text-slate-300 mt-1.5 mb-0">
              {isEn
                ? "Complete your profile so verified camp organizers can invite you directly."
                : "Preenche o teu currículo digital para receberes convites diretos dos campos de férias verificados."}
            </p>
          </div>
          <Link
            href={`/${lang}/monitores`}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-md no-underline shrink-0"
          >
            &larr; {isEn ? "Back" : "Voltar"}
          </Link>
        </div>

        <form onSubmit={handleSubmeterRegisto} className="space-y-8">
          {/* 1. DADOS DE ACESSO E IDENTIFICAÇÃO */}
          <section className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#2563EB] m-0 pb-3 border-b border-slate-100">
              1. {isEn ? "Account & Personal Identification" : "Credenciais de Acesso e Identificação"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  {isEn ? "Full Name *" : "Nome Completo *"}
                </label>
                <input
                  required
                  type="text"
                  value={formData.nome_completo}
                  onChange={(e) =>
                    setFormData({ ...formData, nome_completo: e.target.value })
                  }
                  placeholder="Ex: Diogo Abreu Oliveira"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isEn ? "Login E-mail *" : "E-mail de Login e Contacto *"}
                </label>
                <input
                  required
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="teu.email@exemplo.pt"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isEn ? "Mobile Phone / WhatsApp *" : "Telemóvel / WhatsApp *"}
                </label>
                <input
                  required
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
                  }
                  placeholder="+351 910 000 000"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isEn ? "Password (Min. 6 chars) *" : "Palavra-Passe (Mín. 6 caracteres) *"}
                </label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isEn ? "Confirm Password *" : "Confirmar Palavra-Passe *"}
                </label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isEn ? "Date of Birth *" : "Data de Nascimento *"}
                </label>
                <input
                  required
                  type="date"
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

              {/* Dropdown Customizado de Distrito de Residência */}
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
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-30 max-h-56 overflow-y-auto">
                    {DISTRITOS_PT.map((d) => (
                      <div
                        key={d}
                        onClick={() => {
                          setFormData({ ...formData, distrito_residencia: d });
                          setOpenDropdown(null);
                        }}
                        className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ALERTA E UPLOAD DE AUTORIZAÇÃO PARENTAL SE TIVER MENOS DE 18 ANOS */}
            {isMenor && (
              <div className="bg-amber-50 border-2 border-[#F59E0B] p-5 rounded-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="bg-[#F59E0B] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md inline-block mb-1">
                      ⚠️ Candidato Menor de 18 Anos ({idadeCalculada} anos)
                    </span>
                    <h4 className="text-sm font-black text-[#0F172A] m-0">
                      Autorização do Encarregado de Educação Obrigatória
                    </h4>
                    <p className="text-xs text-slate-600 m-0 mt-1">
                      Descarrega a minuta em PDF, pede ao teu encarregado de educação para assinar e anexa o ficheiro aqui.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={gerarMinutaParentalPDF}
                    className="bg-[#2563EB] hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-md cursor-pointer border-0 shrink-0"
                  >
                    📥 Descarregar Minuta PDF
                  </button>
                </div>

                <div className="pt-2">
                  <label className="inline-block bg-[#16A34A] hover:bg-green-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-md cursor-pointer">
                    {uploadingAuth
                      ? "A carregar..."
                      : autorizacaoParentalUrl
                      ? "✓ Autorização Carregada (Substituir)"
                      : "📤 Anexar Autorização Parental Assinada (PDF/Foto)"}
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleFileUpload(e, "auth")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </section>

          {/* 2. PERFIL PROFISSIONAL, FUNÇÃO, LÍNGUAS E CERTIFICAÇÕES */}
          <section className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#16A34A] m-0 pb-3 border-b border-slate-100">
              2. {isEn ? "Role, Experience, Languages & Certifications" : "Função, Experiência, Línguas e Certificações"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dropdown Customizado Cargo */}
              <div className="relative">
                <label className={labelClass}>
                  {isEn ? "Preferred Role *" : "Função / Cargo Principal *"}
                </label>
                <div
                  onClick={() =>
                    setOpenDropdown(openDropdown === "cargo" ? null : "cargo")
                  }
                  className={`${inputClass} cursor-pointer flex justify-between items-center`}
                >
                  <span className="truncate">{formData.cargo_preferido}</span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </div>
                {openDropdown === "cargo" && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-30 max-h-56 overflow-y-auto">
                    {CARGOS_OPCOES.map((cg) => (
                      <div
                        key={cg}
                        onClick={() => {
                          setFormData({ ...formData, cargo_preferido: cg });
                          setOpenDropdown(null);
                        }}
                        className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        {cg}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown Customizado Modalidade */}
              <div className="relative">
                <label className={labelClass}>
                  {isEn ? "Camp Regime Preference *" : "Modalidade de Campo Preferida *"}
                </label>
                <div
                  onClick={() =>
                    setOpenDropdown(openDropdown === "mod" ? null : "mod")
                  }
                  className={`${inputClass} cursor-pointer flex justify-between items-center`}
                >
                  <span className="truncate">
                    {formData.modalidade_preferida}
                  </span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </div>
                {openDropdown === "mod" && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-30">
                    {MODALIDADES_TRABALHO.map((m) => (
                      <div
                        key={m}
                        onClick={() => {
                          setFormData({ ...formData, modalidade_preferida: m });
                          setOpenDropdown(null);
                        }}
                        className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  {isEn ? "Years of Experience *" : "Anos de Experiência com Crianças/Jovens *"}
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  required
                  value={formData.experiencia_anos}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experiencia_anos: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Carta de Condução</label>
                  <div className="flex gap-1.5">
                    {["Sim", "Não"].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, carta_conducao: op })
                        }
                        className={`flex-1 py-3 rounded-md text-xs font-black cursor-pointer border-0 ${
                          formData.carta_conducao === op
                            ? "bg-[#2563EB] text-white"
                            : "bg-slate-200 text-[#0F172A]"
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>T-Shirt Staff</label>
                  <div className="flex gap-1">
                    {["XS", "S", "M", "L", "XL"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, tamanho_tshirt: t })
                        }
                        className={`flex-1 py-3 rounded-md text-[10px] font-black cursor-pointer border-0 ${
                          formData.tamanho_tshirt === t
                            ? "bg-[#0F172A] text-white"
                            : "bg-slate-200 text-[#0F172A]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* LÍNGUAS FALADAS */}
            <div>
              <label className={labelClass}>
                🗣️ {isEn ? "Languages Spoken" : "Línguas Faladas"}
              </label>
              <div className="flex flex-wrap gap-2">
                {LINGUAS_OPCOES.map((lng) => {
                  const active = linguasFaladas.includes(lng);
                  return (
                    <button
                      key={lng}
                      type="button"
                      onClick={() =>
                        toggleItem(linguasFaladas, setLinguasFaladas, lng)
                      }
                      className={`px-3.5 py-2 rounded-md text-xs font-black cursor-pointer border-0 transition-colors ${
                        active
                          ? "bg-[#2563EB] text-white"
                          : "bg-slate-200 text-[#0F172A] hover:bg-slate-300"
                      }`}
                    >
                      {active ? "✓ " : "+ "}
                      {lng}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CERTIFICAÇÕES E CURSOS */}
            <div>
              <label className={labelClass}>
                🏅 {isEn ? "Certifications & Qualifications" : "Certificações, Diplomas e Requisitos Legais"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LISTA_CERTIFICADOS.map((cert) => {
                  const active = certificacoes.includes(cert.id);
                  return (
                    <div
                      key={cert.id}
                      onClick={() =>
                        toggleItem(certificacoes, setCertificacoes, cert.id)
                      }
                      className={`p-3 rounded-md border-2 cursor-pointer flex items-center gap-3 text-xs font-bold transition-all ${
                        active
                          ? "bg-[#16A34A] border-[#16A34A] text-white"
                          : "bg-[#F8FAFC] border-slate-200 text-[#0F172A] hover:border-[#2563EB]"
                      }`}
                    >
                      <span className="font-black">
                        {active ? "✓" : "○"}
                      </span>
                      <span>{isEn ? cert.en : cert.pt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BIO E OUTRAS COMPETÊNCIAS */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelClass}>
                  {isEn
                    ? "Sports, Instruments or Specific Skills"
                    : "Desportos Praticados, Instrumentos ou Outras Competências"}
                </label>
                <input
                  type="text"
                  value={formData.outras_competencias}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      outras_competencias: e.target.value,
                    })
                  }
                  placeholder="Ex: Surf, Guitarra, Escalada, Teatro, Robótica, Futebol..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {isEn
                    ? "About Me / Past Camp Experience *"
                    : "Apresentação Pessoal & Experiência Anterior em Campos *"}
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Apresenta-te aos diretores de campo: em que campos ou atividades já participaste, que faixas etárias preferes acompanhar e o que te motiva..."
                  className={inputClass}
                />
              </div>
            </div>

            {/* UPLOADS DE FOTO E CURRÍCULO CV */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-[#F8FAFC] p-4 rounded-md border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <span className="block text-[10px] font-black uppercase text-slate-500">
                    📸 Fotografia de Perfil
                  </span>
                  <span className="text-xs font-bold text-[#0F172A]">
                    {fotoUrl ? "✓ Foto Carregada" : "Recomendado para destaque"}
                  </span>
                </div>
                <label className="bg-[#2563EB] hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-md cursor-pointer shrink-0">
                  {uploadingFoto ? "..." : "Carregar Foto"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "foto")}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="bg-[#F8FAFC] p-4 rounded-md border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <span className="block text-[10px] font-black uppercase text-slate-500">
                    📄 Currículo Vitae (PDF)
                  </span>
                  <span className="text-xs font-bold text-[#0F172A]">
                    {cvUrl ? "✓ CV Anexado" : "PDF até 10MB"}
                  </span>
                </div>
                <label className="bg-[#0F172A] hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-md cursor-pointer shrink-0">
                  {uploadingCv ? "..." : "Anexar CV PDF"}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e, "cv")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* 3. REGIÕES DE ATUAÇÃO E CALENDÁRIO INTERATIVO DE DISPONIBILIDADE */}
          <section className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#F59E0B] m-0 pb-3 border-b border-slate-100">
              3. {isEn ? "Regions & Availability Calendar" : "Zonas de Atuação, Épocas e Calendário de Disponibilidade"}
            </h2>

            {/* ÉPOCAS DO ANO */}
            <div>
              <label className={labelClass}>
                ☀️ {isEn ? "Available School Breaks" : "Épocas de Férias Disponíveis"}
              </label>
              <div className="flex flex-wrap gap-2">
                {EPOCAS_OPCOES.map((ep) => {
                  const active = disponibilidadeEpocas.includes(ep.id);
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() =>
                        toggleItem(
                          disponibilidadeEpocas,
                          setDisponibilidadeEpocas,
                          ep.id
                        )
                      }
                      className={`px-4 py-2.5 rounded-md text-xs font-black cursor-pointer border-0 transition-colors ${
                        active
                          ? "bg-[#F59E0B] text-white"
                          : "bg-slate-200 text-[#0F172A]"
                      }`}
                    >
                      {active ? "✓ " : "+ "}
                      {isEn ? ep.labelEn : ep.labelPt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ZONAS DE ATUAÇÃO */}
            <div>
              <label className={labelClass}>
                📍 {isEn ? "Where can you work? *" : "Em que distritos podes trabalhar? *"}
              </label>
              <div className="flex flex-wrap gap-2">
                {opcoesAtuacao.map((reg) => {
                  const active = areasAtuacao.includes(reg);
                  return (
                    <button
                      key={reg}
                      type="button"
                      onClick={() =>
                        toggleItem(areasAtuacao, setAreasAtuacao, reg)
                      }
                      className={`px-3.5 py-2 rounded-md text-xs font-black cursor-pointer border-0 transition-colors ${
                        active
                          ? "bg-[#16A34A] text-white"
                          : "bg-slate-200 text-[#0F172A] hover:bg-slate-300"
                      }`}
                    >
                      {active ? "✓ " : ""}
                      {reg}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CALENDÁRIO MENSAL INTERATIVO */}
            <div className="bg-[#F8FAFC] p-5 rounded-md border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-xs font-black uppercase text-[#0F172A] block">
                    📅 Calendário de Dias Disponíveis ({calendario.length} dias selecionados)
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Clica nos dias em que estás livre para trabalhar ou seleciona o mês inteiro.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={selecionarMesInteiro}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-md cursor-pointer border-0"
                >
                  ✓ Selecionar / Limpar Mês Inteiro
                </button>
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-md border border-slate-200 mb-3">
                <button
                  type="button"
                  onClick={() => setMesAtual(new Date(ano, mes - 1, 1))}
                  className="bg-[#0F172A] text-white px-3 py-1.5 rounded-md text-xs font-black cursor-pointer border-0"
                >
                  &larr;
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-[#0F172A]">
                  {mesAtual.toLocaleDateString(isEn ? "en-US" : "pt-PT", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => setMesAtual(new Date(ano, mes + 1, 1))}
                  className="bg-[#0F172A] text-white px-3 py-1.5 rounded-md text-xs font-black cursor-pointer border-0"
                >
                  &rarr;
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {diasDoMes.map((iso) => {
                  const isSel = calendario.includes(iso);
                  const dNum = iso.split("-")[2];
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() =>
                        toggleItem(calendario, setCalendario, iso)
                      }
                      className={`py-2.5 rounded-md text-xs font-black cursor-pointer border transition-colors ${
                        isSel
                          ? "bg-[#16A34A] border-[#16A34A] text-white"
                          : "bg-white border-slate-200 text-[#0F172A] hover:border-[#2563EB]"
                      }`}
                    >
                      {dNum}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 4. ACEITAÇÃO DOS TERMOS E SUBMISSÃO */}
          <section className="bg-[#0F172A] text-white p-6 md:p-8 rounded-md border-l-4 border-[#16A34A] space-y-5">
            <label className="flex items-start gap-3.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termosAceites}
                onChange={(e) => setTermosAceites(e.target.checked)}
                className="mt-1 w-5 h-5 accent-[#16A34A] shrink-0"
              />
              <span className="text-xs font-bold text-slate-200 leading-relaxed">
                Declaro que as informações e certificações indicadas são verdadeiras e autorizo a partilha do meu perfil e CV exclusivamente com entidades organizadoras de campos de férias verificadas na plataforma HelloCamp, de acordo com os{" "}
                <Link
                  href={`/${lang}/monitores/termos`}
                  target="_blank"
                  className="text-[#F59E0B] underline"
                >
                  Termos de Utilização da Bolsa de Monitores
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4.5 bg-[#16A34A] hover:bg-green-700 disabled:bg-slate-600 text-white font-black text-xs md:text-sm uppercase tracking-widest rounded-md cursor-pointer border-0 shadow-lg transition-colors"
            >
              {submitting
                ? "A Criar Perfil Profissional..."
                : "🚀 Concluir Registo e Entrar no Portal de Monitor →"}
            </button>
          </section>
        </form>
      </div>
    </main>
  );
}
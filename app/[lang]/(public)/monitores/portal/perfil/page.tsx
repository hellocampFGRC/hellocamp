"use client";

import React, { useEffect, useState, use } from "react";
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

const EPOCAS_OPCOES = [
  "Verão",
  "Páscoa",
  "Carnaval",
  "Natal",
  "Fins de Semana",
];

const LISTA_CERTIFICADOS = [
  { id: "IPDJ", pt: "Monitor de Campos de Férias (IPDJ)", en: "Camp Monitor (IPDJ)" },
  { id: "Coordenador_IPDJ", pt: "Coordenador de Campos de Férias (IPDJ)", en: "Camp Coordinator (IPDJ)" },
  { id: "Socorrismo", pt: "Primeiros Socorros / Suporte Básico de Vida", en: "First Aid / Basic Life Support" },
  { id: "Nadador", pt: "Nadador Salvador Certificado", en: "Certified Lifeguard" },
  { id: "Professor", pt: "Licenciatura em Educação / Desporto", en: "Education / Sports Degree" },
  { id: "Surf_Nautica", pt: "Treinador de Surf / Desportos Náuticos", en: "Surf / Watersports Coach" },
  { id: "Animacao", pt: "Técnico de Animação Sociocultural", en: "Sociocultural Animation" },
  { id: "Linguas", pt: "Fluência em Línguas Estrangeiras (C1/C2)", en: "Foreign Languages Fluency" },
  { id: "Artes", pt: "Artes Plásticas / Música / Teatro / Dança", en: "Arts / Music / Theater" },
  { id: "NEE", pt: "Necessidades Educativas Especiais (NEE)", en: "Special Needs Experience" },
  { id: "Carta_Conducao", pt: "Carta de Condução (Categoria B)", en: "Driver's License (Cat B)" },
  { id: "Registo_Criminal", pt: "Registo Criminal Limpo (Contacto c/ Menores)", en: "Clean Criminal Record" },
];

export default function PortalMonitorPerfilPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monitorId, setMonitorId] = useState<string>("");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingAuth, setUploadingAuth] = useState(false);

  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    data_nascimento: "",
    distrito_residencia: "Lisboa",
    experiencia_anos: "1",
    bio: "",
    outras_competencias: "",
    fotografia_url: "",
    cv_url: "",
    autorizacao_parental_url: "",
  });

  const [certificacoes, setCertificacoes] = useState<string[]>([]);
  const [disponibilidadeEpocas, setDisponibilidadeEpocas] = useState<string[]>(
    []
  );
  const [areasAtuacao, setAreasAtuacao] = useState<string[]>([]);
  const [calendario, setCalendario] = useState<string[]>([]);
  const [mesAtual, setMesAtual] = useState<Date>(new Date(2026, 6, 1));

  const opcoesAtuacao = [
    isEn
      ? "Nationwide (With Accommodation)"
      : "Em todo o país (Com Alojamento / Deslocação)",
    ...DISTRITOS_PT,
  ];

  useEffect(() => {
    const carregarPerfil = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${lang}/login`);
        return;
      }

      const uid = session.user.id;
      setMonitorId(uid);

      const [{ data: monData }, { count }] = await Promise.all([
        supabase.from("monitores").select("*").eq("id", uid).maybeSingle(),
        supabase
          .from("mensagens_recrutamento")
          .select("*", { count: "exact", head: true })
          .eq("monitor_id", uid)
          .eq("remetente", "parceiro")
          .eq("lida", false),
      ]);

      setUnreadCount(count || 0);

      if (monData) {
        setForm({
          nome_completo: monData.nome_completo || "",
          email: monData.email || session.user.email || "",
          telefone: monData.telefone || "",
          data_nascimento: monData.data_nascimento || "",
          distrito_residencia: monData.distrito_residencia || "Lisboa",
          experiencia_anos: String(monData.experiencia_anos ?? 1),
          bio: monData.bio || "",
          outras_competencias: monData.outras_competencias || "",
          fotografia_url: monData.fotografia_url || "",
          cv_url: monData.cv_url || "",
          autorizacao_parental_url: monData.autorizacao_parental_url || "",
        });
        setCertificacoes(
          Array.isArray(monData.certificacoes) ? monData.certificacoes : []
        );
        setDisponibilidadeEpocas(
          Array.isArray(monData.disponibilidade)
            ? monData.disponibilidade
            : ["Verão"]
        );
        setAreasAtuacao(
          Array.isArray(monData.areas_atuacao)
            ? monData.areas_atuacao
            : ["Lisboa"]
        );
        setCalendario(
          Array.isArray(monData.calendario_disponibilidade)
            ? monData.calendario_disponibilidade
            : []
        );
      } else {
        setForm((prev) => ({
          ...prev,
          email: session.user.email || "",
          nome_completo: session.user.user_metadata?.nome_completo || "",
          telefone: session.user.user_metadata?.telefone || "",
        }));
      }

      setLoading(false);
    };

    carregarPerfil();
  }, [lang, router]);

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

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: "foto" | "cv" | "auth"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !monitorId) return;

    if (tipo === "foto") setUploadingFoto(true);
    if (tipo === "cv") setUploadingCv(true);
    if (tipo === "auth") setUploadingAuth(true);

    try {
      const ext = file.name.split(".").pop();
      const bucket = tipo === "foto" ? "campos-imagens" : "campos-documentos";
      const fileName = `monitor_${monitorId}_${tipo}_${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        if (tipo === "foto")
          setForm((prev) => ({ ...prev, fotografia_url: urlData.publicUrl }));
        if (tipo === "cv")
          setForm((prev) => ({ ...prev, cv_url: urlData.publicUrl }));
        if (tipo === "auth")
          setForm((prev) => ({
            ...prev,
            autorizacao_parental_url: urlData.publicUrl,
          }));
      }
    } catch (err: any) {
      alert("Erro no upload: " + err.message);
    } finally {
      if (tipo === "foto") setUploadingFoto(false);
      if (tipo === "cv") setUploadingCv(false);
      if (tipo === "auth") setUploadingAuth(false);
    }
  };

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
      form.nome_completo || "________________________________________"
    }, nascido(a) a ${
      form.data_nascimento || "____/____/______"
    }, autorizo expressamente a disponibilizacao do seu perfil e curriculo na Bolsa de Monitores da HelloCamp (www.hellocamp.pt) para efeitos de recrutamento em campos de ferias certificados.\n\nData: ____ / ____ / 2026\n\nNome do Encarregado de Educacao: __________________________________________________\n\nAssinatura:\n\n________________________________________________________________________`;

    const lines = doc.splitTextToSize(texto, pageW - 32);
    doc.text(lines, 16, 48);
    doc.save("Autorizacao_Parental_HelloCamp.pdf");
  };

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monitorId) return;
    setSaving(true);

    try {
      const payload = {
        id: monitorId,
        email: form.email,
        nome_completo: form.nome_completo,
        telefone: form.telefone,
        data_nascimento: form.data_nascimento || null,
        distrito_residencia: form.distrito_residencia,
        experiencia_anos: Number(form.experiencia_anos) || 0,
        bio: form.bio,
        outras_competencias: form.outras_competencias,
        fotografia_url: form.fotografia_url || null,
        cv_url: form.cv_url || null,
        autorizacao_parental_url: form.autorizacao_parental_url || null,
        certificacoes,
        disponibilidade: disponibilidadeEpocas,
        areas_atuacao: areasAtuacao,
        calendario_disponibilidade: calendario,
      };

      const { error } = await supabase.from("monitores").upsert([payload]);
      if (error) throw error;

      alert(
        isEn
          ? "✓ Your monitor profile has been updated!"
          : "✓ O teu perfil de monitor foi atualizado com sucesso na Bolsa de Recrutamento!"
      );
    } catch (err: any) {
      alert("Erro ao guardar perfil: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Calendário
  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
  const diasDoMes: string[] = [];
  for (let d = 1; d <= totalDiasMes; d++) {
    diasDoMes.push(new Date(ano, mes, d).toISOString().split("T")[0]);
  }

  const selecionarMesInteiro = () => {
    const todosSel = diasDoMes.every((d) => calendario.includes(d));
    if (todosSel) {
      setCalendario(calendario.filter((d) => !diasDoMes.includes(d)));
    } else {
      setCalendario(Array.from(new Set([...calendario, ...diasDoMes])));
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center font-black text-xs uppercase tracking-widest text-slate-400 animate-pulse">
        {isEn ? "Loading Monitor Portal..." : "A carregar Portal do Monitor..."}
      </div>
    );
  }

  const labelClass =
    "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5";
  const inputClass =
    "w-full py-3 px-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-colors";

  return (
    <main className="min-h-screen bg-[#F8FAFC] py-10 px-4 font-sans text-[#0F172A] pb-24">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* BARRA DE NAVEGAÇÃO DO PORTAL DO MONITOR */}
        <div className="bg-[#0F172A] text-white p-6 md:p-8 rounded-md border-b-4 border-[#F59E0B] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-md bg-[#2563EB] text-white flex items-center justify-center text-2xl font-black overflow-hidden border-2 border-white shrink-0">
              {form.fotografia_url ? (
                <img
                  src={form.fotografia_url}
                  alt={form.nome_completo}
                  className="w-full h-full object-cover"
                />
              ) : (
                (form.nome_completo || "M").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <span className="bg-[#16A34A] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md inline-block mb-1">
                ✓ {isEn ? "Active in Talent Pool" : "Perfil Ativo na Bolsa de Recrutamento"}
              </span>
              <h1 className="text-xl md:text-2xl font-black m-0">
                {form.nome_completo || "Monitor HelloCamp"}
              </h1>
              <p className="text-xs text-slate-300 m-0 mt-0.5">
                📍 {form.distrito_residencia} • ⭐ {form.experiencia_anos} anos exp. •{" "}
                {certificacoes.length} certificações
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/${lang}/monitores/portal/perfil`}
              className="bg-[#2563EB] text-white font-black text-xs uppercase tracking-widest px-4 py-3 rounded-md no-underline"
            >
              👤 {isEn ? "My Profile & CV" : "O Meu Perfil & CV"}
            </Link>

            <Link
              href={`/${lang}/monitores/portal/mensagens`}
              className="bg-[#F59E0B] hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest px-4 py-3 rounded-md no-underline flex items-center gap-2"
            >
              <span>💬 {isEn ? "Job Invitations" : "Propostas de Emprego"}</span>
              {unreadCount > 0 && (
                <span className="bg-[#F43F5E] text-white text-[10px] px-2 py-0.5 rounded-md">
                  {unreadCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push(`/${lang}/login`);
              }}
              className="bg-[#F43F5E] hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest px-4 py-3 rounded-md cursor-pointer border-0"
            >
              {isEn ? "Exit" : "Sair"}
            </button>
          </div>
        </div>

        {/* FORMULÁRIO COMPLETO DO PERFIL DO MONITOR */}
        <form onSubmit={handleGuardarPerfil} className="space-y-8">
          {/* SECÇÃO 1: IDENTIFICAÇÃO E DOCUMENTOS (FOTO, CV, AUTORIZAÇÃO) */}
          <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#2563EB] m-0 pb-3 border-b border-slate-100">
              1. {isEn ? "Personal Details & Documents (CV / Photo)" : "Dados Pessoais, Fotografia e Currículo (CV)"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cartão Foto */}
              <div className="bg-[#F8FAFC] p-4 rounded-md border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    📸 Fotografia de Rosto
                  </span>
                  <p className="text-xs font-bold text-[#0F172A] m-0 mb-3">
                    {form.fotografia_url
                      ? "✓ Fotografia Configurada"
                      : "Adiciona uma foto profissional"}
                  </p>
                </div>
                <label className="bg-[#2563EB] hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-md cursor-pointer text-center">
                  {uploadingFoto ? "A carregar..." : "📤 Alterar Fotografia"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "foto")}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Cartão CV */}
              <div className="bg-[#F8FAFC] p-4 rounded-md border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    📄 Currículo Vitae (PDF)
                  </span>
                  {form.cv_url ? (
                    <a
                      href={form.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-black text-[#16A34A] hover:underline block mb-3"
                    >
                      ✓ Ver o meu CV atual ↗
                    </a>
                  ) : (
                    <p className="text-xs font-bold text-slate-500 m-0 mb-3">
                      Sem CV anexado
                    </p>
                  )}
                </div>
                <label className="bg-[#0F172A] hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-md cursor-pointer text-center">
                  {uploadingCv ? "A carregar..." : "📤 Carregar Novo CV (PDF)"}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e, "cv")}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Cartão Autorização Parental (Menores 18) */}
              <div className="bg-[#F8FAFC] p-4 rounded-md border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    📝 Autorização Parental (Se &lt;18 anos)
                  </span>
                  {form.autorizacao_parental_url ? (
                    <a
                      href={form.autorizacao_parental_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-black text-[#16A34A] hover:underline block mb-2"
                    >
                      ✓ Ver Autorização Assinada ↗
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={gerarMinutaParentalPDF}
                      className="text-[11px] font-black text-[#2563EB] hover:underline bg-transparent border-0 p-0 cursor-pointer mb-2 text-left"
                    >
                      📥 Gerar Minuta PDF para Assinar
                    </button>
                  )}
                </div>
                <label className="bg-[#F59E0B] hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-md cursor-pointer text-center">
                  {uploadingAuth ? "..." : "📤 Anexar Autorização"}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileUpload(e, "auth")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Nome Completo *</label>
                <input
                  required
                  type="text"
                  value={form.nome_completo}
                  onChange={(e) =>
                    setForm({ ...form, nome_completo: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Telemóvel / WhatsApp *</label>
                <input
                  required
                  type="tel"
                  value={form.telefone}
                  onChange={(e) =>
                    setForm({ ...form, telefone: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Data de Nascimento *</label>
                <input
                  required
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) =>
                    setForm({ ...form, data_nascimento: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              {/* Dropdown Customizado de Distrito */}
              <div className="relative">
                <label className={labelClass}>Distrito de Residência *</label>
                <div
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "distrito" ? null : "distrito"
                    )
                  }
                  className={`${inputClass} cursor-pointer flex justify-between items-center`}
                >
                  <span>{form.distrito_residencia}</span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </div>
                {openDropdown === "distrito" && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-30 max-h-56 overflow-y-auto">
                    {DISTRITOS_PT.map((d) => (
                      <div
                        key={d}
                        onClick={() => {
                          setForm({ ...form, distrito_residencia: d });
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

              <div>
                <label className={labelClass}>Anos de Experiência *</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  required
                  value={form.experiencia_anos}
                  onChange={(e) =>
                    setForm({ ...form, experiencia_anos: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Função, Línguas, Carta de Condução & Outras Competências
                </label>
                <input
                  type="text"
                  value={form.outras_competencias}
                  onChange={(e) =>
                    setForm({ ...form, outras_competencias: e.target.value })
                  }
                  placeholder="Ex: Coordenador | Inglês C1, Espanhol | Surf, Guitarra, Carta Condução..."
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className={labelClass}>
                  Apresentação Pessoal & Experiência em Campos de Férias *
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* SECÇÃO 2: CERTIFICAÇÕES */}
          <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#16A34A] m-0 pb-3 border-b border-slate-100">
              2. Certificações, Cursos e Requisitos Legais
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {LISTA_CERTIFICADOS.map((cert) => {
                const active = certificacoes.includes(cert.id);
                return (
                  <div
                    key={cert.id}
                    onClick={() =>
                      toggleItem(certificacoes, setCertificacoes, cert.id)
                    }
                    className={`p-3 rounded-md border-2 cursor-pointer flex items-center gap-2.5 text-xs font-bold transition-all ${
                      active
                        ? "bg-[#16A34A] border-[#16A34A] text-white"
                        : "bg-[#F8FAFC] border-slate-200 text-[#0F172A] hover:border-[#2563EB]"
                    }`}
                  >
                    <span className="font-black">{active ? "✓" : "○"}</span>
                    <span>{isEn ? cert.en : cert.pt}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECÇÃO 3: ZONAS, ÉPOCAS E CALENDÁRIO DE DISPONIBILIDADE */}
          <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#F59E0B] m-0 pb-3 border-b border-slate-100">
              3. Zonas de Atuação, Épocas e Calendário de Dias Disponíveis
            </h2>

            <div>
              <label className={labelClass}>Épocas de Férias Disponíveis</label>
              <div className="flex flex-wrap gap-2">
                {EPOCAS_OPCOES.map((ep) => {
                  const active = disponibilidadeEpocas.includes(ep);
                  return (
                    <button
                      key={ep}
                      type="button"
                      onClick={() =>
                        toggleItem(
                          disponibilidadeEpocas,
                          setDisponibilidadeEpocas,
                          ep
                        )
                      }
                      className={`px-4 py-2.5 rounded-md text-xs font-black cursor-pointer border-0 ${
                        active
                          ? "bg-[#F59E0B] text-white"
                          : "bg-slate-200 text-[#0F172A]"
                      }`}
                    >
                      {active ? "✓ " : "+ "}
                      {ep}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>Regiões Onde Podes Trabalhar</label>
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
                      className={`px-3.5 py-2 rounded-md text-xs font-black cursor-pointer border-0 ${
                        active
                          ? "bg-[#16A34A] text-white"
                          : "bg-slate-200 text-[#0F172A]"
                      }`}
                    >
                      {active ? "✓ " : ""}
                      {reg}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calendário */}
            <div className="bg-[#F8FAFC] p-5 rounded-md border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <span className="text-xs font-black uppercase text-[#0F172A]">
                  📅 Dias Disponíveis Marcados ({calendario.length} dias)
                </span>
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
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() =>
                        toggleItem(calendario, setCalendario, iso)
                      }
                      className={`py-2.5 rounded-md text-xs font-black cursor-pointer border ${
                        isSel
                          ? "bg-[#16A34A] border-[#16A34A] text-white"
                          : "bg-white border-slate-200 text-[#0F172A]"
                      }`}
                    >
                      {iso.split("-")[2]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-md cursor-pointer border-0 shadow-md"
              >
                {saving
                  ? "A Guardar Alterações..."
                  : "✓ Guardar Perfil e Disponibilidade"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
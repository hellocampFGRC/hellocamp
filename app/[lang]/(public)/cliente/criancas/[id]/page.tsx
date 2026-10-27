"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIAS_INTERESSE = [
  "Desporto",
  "Aventura & Natureza",
  "Tecnologia & Ciência",
  "Artes & Criatividade",
  "Línguas",
];

const DISTRITOS_PT = [
  "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra",
  "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre",
  "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"
];

export default function FichaCriancaPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = use(params);
  const router = useRouter();
  const isEn = lang === "en";
  const isModoCriacao = id === "novo";

  const [loading, setLoading] = useState(!isModoCriacao);
  const [saving, setSaving] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    data_nascimento: "",
    sexo: "Masculino",
    nif: "",
    tipo_sanguineo: "",
    restricoes_alimentares: "",
    doencas_cronicas: "",
    medicacao_regular: "",
    limitacoes_fisicas: "",
    sabe_nadar: "",
    sabe_andar_bicicleta: "",
    tamanho_tshirt: "",
    nivel_ingles: "",
    fobias_medos: "",
    perfil_comportamental: "",
    autorizacao_fotografia: "Sim",
    interesses: [] as string[],
    distrito_preferencial: "",
  });

  useEffect(() => {
    if (isModoCriacao) return;

    const carregarCrianca = async () => {
      const { data, error } = await supabase
        .from("criancas")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        router.push(`/${lang}/cliente/criancas`);
        return;
      }

      setFormData({
        nome: data.nome || "",
        data_nascimento: data.data_nascimento || "",
        sexo: data.sexo || "Masculino",
        nif: data.nif || "",
        tipo_sanguineo: data.tipo_sanguineo || "",
        restricoes_alimentares: data.restricoes_alimentares || "",
        doencas_cronicas: data.doencas_cronicas || "",
        medicacao_regular: data.medicacao_regular || "",
        limitacoes_fisicas: data.limitacoes_fisicas || "",
        sabe_nadar: data.sabe_nadar || "",
        sabe_andar_bicicleta: data.sabe_andar_bicicleta || "",
        tamanho_tshirt: data.tamanho_tshirt || "",
        nivel_ingles: data.nivel_ingles || "",
        fobias_medos: data.fobias_medos || "",
        perfil_comportamental: data.perfil_comportamental || "",
        autorizacao_fotografia: data.autorizacao_fotografia || "Sim",
        interesses: Array.isArray(data.interesses) ? data.interesses : [],
        distrito_preferencial: data.distrito_preferencial || "",
      });
      setLoading(false);
    };

    carregarCrianca();
  }, [id, isModoCriacao, lang, router]);

  const toggleInteresse = (cat: string) => {
    setFormData((prev) => {
      const jaTem = prev.interesses.includes(cat);
      return {
        ...prev,
        interesses: jaTem
          ? prev.interesses.filter((i) => i !== cat)
          : [...prev.interesses, cat],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");

      if (isModoCriacao) {
        const { error } = await supabase
          .from("criancas")
          .insert([{ ...formData, cliente_id: session.user.id }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("criancas")
          .update(formData)
          .eq("id", id);
        if (error) throw error;
      }

      router.push(`/${lang}/cliente/criancas`);
    } catch (err: any) {
      alert(err.message);
      setSaving(false);
    }
  };

  const handleApagar = async () => {
    if (
      !window.confirm(
        isEn
          ? "Are you sure you want to delete this profile?"
          : "Tem a certeza que deseja apagar o perfil do seu filho(a)?"
      )
    )
      return;
    await supabase.from("criancas").delete().eq("id", id);
    router.push(`/${lang}/cliente/criancas`);
  };

  if (loading) {
    return (
      <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">
        {isEn ? "Loading profile..." : "A preparar ficha..."}
      </div>
    );
  }

  const labelClass =
    "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1";
  const inputClass =
    "w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white transition-colors";

  // Helper para renderizar Dropdown Customizado (Zero <select> nativos)
  const renderCustomDropdown = (
    key: string,
    valorAtual: string,
    opcoes: { val: string; label: string }[],
    onSelect: (v: string) => void,
    extraClasses = "bg-slate-50 border-slate-200"
  ) => {
    const labelSelecionada =
      opcoes.find((o) => o.val === valorAtual)?.label ||
      valorAtual ||
      (isEn ? "Select..." : "Selecionar...");
    return (
      <div className="relative">
        <div
          onClick={() =>
            setOpenDropdown(openDropdown === key ? null : key)
          }
          className={`w-full p-4 border rounded-xl text-sm font-bold text-slate-900 cursor-pointer flex items-center justify-between ${extraClasses}`}
        >
          <span className="truncate">{labelSelecionada}</span>
          <span className="text-[10px] text-slate-400 ml-2">▼</span>
        </div>
        {openDropdown === key && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpenDropdown(null)}
            />
            <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
              {opcoes.map((op) => (
                <div
                  key={op.val}
                  onClick={() => {
                    onSelect(op.val);
                    setOpenDropdown(null);
                  }}
                  className="p-3.5 text-xs font-bold text-slate-800 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"
                >
                  {op.label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <Link
          href={`/${lang}/cliente/criancas`}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm no-underline"
        >
          &larr; {isEn ? "Back to list" : "Voltar à lista"}
        </Link>

        {!isModoCriacao && (
          <button
            type="button"
            onClick={handleApagar}
            className="text-red-500 hover:bg-red-50 border border-red-200 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
          >
            {isEn ? "Delete Profile" : "Apagar Perfil"}
          </button>
        )}
      </div>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 m-0 tracking-tight">
          {isModoCriacao
            ? isEn
              ? "New Participant"
              : "Novo Participante"
            : isEn
            ? "Edit Participant Profile"
            : "Ficha de Participante"}
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">
          {isEn
            ? "Keep this data updated to ensure maximum safety during the camps."
            : "Mantenha estes dados atualizados para acelerar as inscrições e garantir a máxima segurança."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        {/* BLOCO 1: IDENTIFICAÇÃO */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <span className="text-2xl bg-slate-100 w-10 h-10 flex items-center justify-center rounded-full">
              👦
            </span>
            <h2 className="text-base font-black text-slate-900 m-0 uppercase tracking-widest">
              1. {isEn ? "Basic Identification" : "Identificação Básica"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>
                {isEn ? "Full Name *" : "Nome Completo *"}
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                className={inputClass}
                placeholder="Nome do participante"
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
                  setFormData({ ...formData, data_nascimento: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {isEn ? "Gender *" : "Sexo *"}
              </label>
              {renderCustomDropdown(
                "sexo",
                formData.sexo,
                [
                  { val: "Masculino", label: isEn ? "Male" : "Masculino" },
                  { val: "Feminino", label: isEn ? "Female" : "Feminino" },
                  {
                    val: "Prefiro não dizer",
                    label: isEn ? "Prefer not to say" : "Prefiro não dizer",
                  },
                ],
                (val) => setFormData({ ...formData, sexo: val })
              )}
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>
                {isEn ? "Tax ID (NIF)" : "NIF da Criança"}
              </label>
              <input
                type="text"
                value={formData.nif}
                onChange={(e) =>
                  setFormData({ ...formData, nif: e.target.value })
                }
                className={inputClass}
                placeholder={
                  isEn
                    ? "Optional (For invoices)"
                    : "Opcional (Para emissão de faturas e deduções no IRS)"
                }
              />
            </div>
          </div>
        </div>

        {/* BLOCO 2: CLÍNICO E SEGURANÇA */}
        <div className="bg-red-50 p-6 md:p-8 rounded-[2rem] border border-red-100 shadow-sm">
          <div className="flex items-center gap-3 border-b border-red-200/50 pb-4 mb-6">
            <span className="text-2xl bg-white text-red-500 w-10 h-10 flex items-center justify-center rounded-full shadow-sm">
              🏥
            </span>
            <h2 className="text-base font-black text-red-900 m-0 uppercase tracking-widest">
              2. {isEn ? "Medical & Safety Profile" : "Perfil Clínico e Segurança"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="md:w-1/2">
              <label className={`${labelClass} !text-red-800`}>
                {isEn ? "Blood Type" : "Tipo Sanguíneo"}
              </label>
              {renderCustomDropdown(
                "sangue",
                formData.tipo_sanguineo,
                [
                  {
                    val: "",
                    label: isEn
                      ? "Unknown / Not declared"
                      : "Desconhecido / Não declarado",
                  },
                  { val: "A+", label: "A+" },
                  { val: "A-", label: "A-" },
                  { val: "B+", label: "B+" },
                  { val: "B-", label: "B-" },
                  { val: "AB+", label: "AB+" },
                  { val: "AB-", label: "AB-" },
                  { val: "O+", label: "O+" },
                  { val: "O-", label: "O-" },
                ],
                (val) => setFormData({ ...formData, tipo_sanguineo: val }),
                "bg-white border-red-200"
              )}
            </div>
            <div>
              <label className={`${labelClass} !text-red-800`}>
                {isEn
                  ? "Food Allergies or Dietary Restrictions"
                  : "Alergias ou Restrições Alimentares"}
              </label>
              <input
                type="text"
                value={formData.restricoes_alimentares}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    restricoes_alimentares: e.target.value,
                  })
                }
                placeholder={
                  isEn
                    ? "E.g.: Peanuts, Lactose intolerant, None..."
                    : "Ex: Amendoins, Intolerante à lactose, Celíaco, Nenhuma..."
                }
                className={`${inputClass} !border-red-200 !bg-white`}
              />
            </div>
            <div>
              <label className={`${labelClass} !text-red-800`}>
                {isEn
                  ? "Chronic Diseases or Conditions"
                  : "Doenças Crónicas ou Condições Médicas"}
              </label>
              <input
                type="text"
                value={formData.doencas_cronicas}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    doencas_cronicas: e.target.value,
                  })
                }
                placeholder={
                  isEn
                    ? "E.g.: Asthma, Diabetes, None..."
                    : "Ex: Asma, Diabetes, Nenhuma..."
                }
                className={`${inputClass} !border-red-200 !bg-white`}
              />
            </div>
            <div>
              <label className={`${labelClass} !text-red-800`}>
                {isEn ? "Regular Medication" : "Medicação Regular"}
              </label>
              <input
                type="text"
                value={formData.medicacao_regular}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    medicacao_regular: e.target.value,
                  })
                }
                placeholder={
                  isEn
                    ? "E.g.: Needs inhaler during sports..."
                    : "Ex: Toma anti-histamínico de manhã..."
                }
                className={`${inputClass} !border-red-200 !bg-white`}
              />
            </div>
            <div>
              <label className={`${labelClass} !text-red-800`}>
                {isEn ? "Physical Limitations" : "Limitações Físicas"}
              </label>
              <input
                type="text"
                value={formData.limitacoes_fisicas}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    limitacoes_fisicas: e.target.value,
                  })
                }
                className={`${inputClass} !border-red-200 !bg-white`}
              />
            </div>
          </div>
        </div>

        {/* BLOCO 3: COMPETÊNCIAS, LOGÍSTICA E SUGESTÕES MÁGICAS */}
        <div className="bg-blue-50 p-6 md:p-8 rounded-[2rem] border border-blue-100 shadow-sm">
          <div className="flex items-center gap-3 border-b border-blue-200/50 pb-4 mb-6">
            <span className="text-2xl bg-white text-blue-600 w-10 h-10 flex items-center justify-center rounded-full shadow-sm">
              🎒
            </span>
            <h2 className="text-base font-black text-blue-900 m-0 uppercase tracking-widest">
              3.{" "}
              {isEn
                ? "Skills, Logistics & Interests"
                : "Competências, Logística e Interesses"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`${labelClass} !text-blue-800`}>
                {isEn ? "Knows how to swim?" : "Sabe nadar?"}
              </label>
              {renderCustomDropdown(
                "nadar",
                formData.sabe_nadar,
                [
                  { val: "", label: isEn ? "Not answered" : "Não respondido" },
                  {
                    val: "Sim, perfeitamente",
                    label: isEn ? "Yes, perfectly" : "Sim, perfeitamente",
                  },
                  {
                    val: "O básico (com pé)",
                    label: isEn ? "Basics only" : "O básico (precisa de pé)",
                  },
                  { val: "Não", label: isEn ? "No" : "Não" },
                ],
                (val) => setFormData({ ...formData, sabe_nadar: val }),
                "bg-white border-blue-200"
              )}
            </div>

            <div>
              <label className={`${labelClass} !text-blue-800`}>
                {isEn ? "Rides a bicycle?" : "Sabe andar de bicicleta?"}
              </label>
              {renderCustomDropdown(
                "bici",
                formData.sabe_andar_bicicleta,
                [
                  { val: "", label: isEn ? "Not answered" : "Não respondido" },
                  { val: "Sim", label: isEn ? "Yes" : "Sim" },
                  {
                    val: "Sim, mas com rodinhas",
                    label: isEn
                      ? "Yes, with training wheels"
                      : "Sim, mas com rodinhas",
                  },
                  { val: "Não", label: isEn ? "No" : "Não" },
                ],
                (val) =>
                  setFormData({ ...formData, sabe_andar_bicicleta: val }),
                "bg-white border-blue-200"
              )}
            </div>

            <div>
              <label className={`${labelClass} !text-blue-800`}>
                {isEn ? "T-Shirt Size" : "Tamanho de T-Shirt"}
              </label>
              {renderCustomDropdown(
                "tshirt",
                formData.tamanho_tshirt,
                [
                  { val: "", label: isEn ? "Not answered" : "Não respondido" },
                  { val: "5-6 Anos", label: "5-6 Anos" },
                  { val: "7-8 Anos", label: "7-8 Anos" },
                  { val: "9-11 Anos", label: "9-11 Anos" },
                  { val: "12-14 Anos", label: "12-14 Anos" },
                  { val: "S Adulto", label: "S (Adulto)" },
                  { val: "M Adulto", label: "M (Adulto)" },
                  { val: "L Adulto", label: "L (Adulto)" },
                ],
                (val) => setFormData({ ...formData, tamanho_tshirt: val }),
                "bg-white border-blue-200"
              )}
            </div>

            <div>
              <label className={`${labelClass} !text-blue-800`}>
                {isEn ? "English Level" : "Nível de Inglês"}
              </label>
              {renderCustomDropdown(
                "ingles",
                formData.nivel_ingles,
                [
                  { val: "", label: isEn ? "Not answered" : "Não respondido" },
                  { val: "Nenhum", label: "Nenhum" },
                  { val: "Básico", label: "Básico" },
                  { val: "Intermédio", label: "Intermédio" },
                  { val: "Avançado / Fluente", label: "Avançado / Fluente" },
                ],
                (val) => setFormData({ ...formData, nivel_ingles: val }),
                "bg-white border-blue-200"
              )}
            </div>

            {/* INTERESSES E DISTRITO PARA ATIVAR AS SUGESTÕES MÁGICAS */}
            <div className="md:col-span-2 pt-4 border-t border-blue-200/50">
              <label className={`${labelClass} !text-blue-800`}>
                ✨{" "}
                {isEn
                  ? "Favorite Themes (For Magic Recommendations)"
                  : "Temas Favoritos (Para Sugestões Mágicas)"}
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS_INTERESSE.map((cat) => {
                  const ativo = formData.interesses.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleInteresse(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                        ativo
                          ? "bg-[#0E3A68] text-white shadow-sm"
                          : "bg-white text-slate-700 border border-blue-200"
                      }`}
                    >
                      {ativo ? "✓ " : "+ "}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={`${labelClass} !text-blue-800`}>
                📍 {isEn ? "Preferred District" : "Distrito Preferencial"}
              </label>
              {renderCustomDropdown(
                "distrito_pref",
                formData.distrito_preferencial,
                [
                  {
                    val: "",
                    label: isEn ? "Any District" : "Qualquer Distrito",
                  },
                  ...DISTRITOS_PT.map((d) => ({ val: d, label: d })),
                ],
                (val) =>
                  setFormData({ ...formData, distrito_preferencial: val }),
                "bg-white border-blue-200"
              )}
            </div>

            <div className="md:col-span-2 p-5 bg-white rounded-xl border border-blue-200 mt-2 shadow-sm">
              <label className="flex items-center gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autorizacao_fotografia === "Sim"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      autorizacao_fotografia: e.target.checked ? "Sim" : "Não",
                    })
                  }
                  className="w-6 h-6 accent-[#0E3A68] flex-shrink-0 cursor-pointer"
                />
                <span className="text-sm text-blue-900 font-bold leading-relaxed">
                  {isEn
                    ? "I authorize the capture of images/video for the camp’s internal updates to parents and marketing."
                    : "Autorizo a captação de imagem/vídeo exclusiva para atualizações aos pais e comunicação do campo."}
                </span>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full p-5 bg-[#0E3A68] text-white font-black uppercase tracking-widest rounded-[1.5rem] cursor-pointer text-base hover:bg-[#0b2b4d] transition-all shadow-xl disabled:opacity-50"
        >
          {saving
            ? isEn
              ? "Saving profile..."
              : "A guardar perfil..."
            : isEn
            ? "Save Participant Profile"
            : "Gravar Ficha de Participante"}
        </button>
      </form>
    </div>
  );
}
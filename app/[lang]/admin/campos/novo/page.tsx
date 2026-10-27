"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Variante {
  nome: string;
  nome_en?: string;
  preco: number;
  taxa_comissao?: number | null;
}

interface Pacote {
  id: string;
  titulo: string;
  titulo_en?: string;
  tipo: "semana" | "dia";
  quantidade: number;
  variantes: Variante[];
}

interface OpcaoAlojamento {
  id: string;
  nome: string;
  nome_en?: string;
  preco: number;
  tipo: "semana" | "dia" | "fixo";
  taxa_comissao: number;
}

interface Desconto {
  id: string;
  nome: string;
  nome_en?: string;
  percentagem: number;
  acumulavel: boolean;
}

interface PerguntaUI {
  id: string;
  tipo: "texto" | "escolha";
  titulo: string;
  opcoes: string;
}

interface GaleriaItem {
  id: string;
  file?: File;
  previewUrl: string;
  isCapa: boolean;
}

const CATEGORIAS = [
  { id: "Desporto", pt: "Desporto", en: "Sports", icon: "⚽" },
  { id: "Aventura & Natureza", pt: "Aventura & Natureza", en: "Adventure & Nature", icon: "🏕️" },
  { id: "Tecnologia & Ciência", pt: "Tecnologia & Ciência", en: "Tech & Science", icon: "🤖" },
  { id: "Artes & Criatividade", pt: "Artes & Criatividade", en: "Arts & Creativity", icon: "🎨" },
  { id: "Línguas", pt: "Línguas", en: "Languages", icon: "🗣️" },
];

const DISTRITOS_PT = [
  "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra",
  "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre",
  "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu",
  "Ilha da Madeira", "Ilha de São Miguel (Açores)"
];

const PAISES = [
  { pt: "Portugal", en: "Portugal" },
  { pt: "Espanha", en: "Spain" },
  { pt: "Reino Unido", en: "United Kingdom" },
  { pt: "França", en: "France" },
  { pt: "Alemanha", en: "Germany" },
  { pt: "Itália", en: "Italy" },
  { pt: "Malta", en: "Malta" },
  { pt: "Estados Unidos", en: "United States" },
];

const DIAS_SEMANA = [
  { id: 1, pt: "Seg", en: "Mon" },
  { id: 2, pt: "Ter", en: "Tue" },
  { id: 3, pt: "Qua", en: "Wed" },
  { id: 4, pt: "Qui", en: "Thu" },
  { id: 5, pt: "Sex", en: "Fri" },
  { id: 6, pt: "Sáb", en: "Sat" },
  { id: 0, pt: "Dom", en: "Sun" },
];

export default function NovoCampoParceiro({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");

  // Perfil Base do Organizador (Lido da Base de Dados para herdar Comissão e Contrato Global)
  const [perfilParceiro, setPerfilParceiro] = useState<{
    taxa_comissao: number;
    base_comissao: string;
    modalidade_reserva: string;
    link_externo_reserva: string | null;
    status_contrato: string | null;
    contrato_dados: any;
    contrato_global_url: string | null;
  }>({
    taxa_comissao: 12,
    base_comissao: "total",
    modalidade_reserva: "direta",
    link_externo_reserva: null,
    status_contrato: null,
    contrato_dados: null,
    contrato_global_url: null,
  });

  // Estados de Localização e Línguas
  const [pais, setPais] = useState("Portugal");
  const [linguas, setLinguas] = useState({
    pt: true,
    en: false,
    es: false,
    fr: false,
    de: false,
  });
  const [mapPreview, setMapPreview] = useState<{ lat: number; lon: number } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);

  // Dropdowns Customizados
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isPolDropdownOpen, setIsPolDropdownOpen] = useState(false);
  const [isSegDropdownOpen, setIsSegDropdownOpen] = useState(false);
  const [isTraDropdownOpen, setIsTraDropdownOpen] = useState(false);

  // Media (Fotos e PDFs)
  const [galeria, setGaleria] = useState<GaleriaItem[]>([]);
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [novoDiaFechado, setNovoDiaFechado] = useState("");

  // Estado Principal do Formulário
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "Desporto",
    Distrito: "Lisboa",
    local: "",
    idade_min: 6,
    idade_max: 16,
    vagas_totais: 30,
    politica_cancelamento: "Flexível (Reembolso a 100% até 7 dias antes)",
    tipo_pagamento: "100_total",
    descricao: "",
    regras_termos: "",
    racio_monitores: "1 monitor para cada 10 participantes",
    alimentacao: "Almoço e lanches incluídos",
    alojamento: "Atividades diurnas (Sem dormida)",
    seguro: "Seguro de Acidentes Pessoais e Responsabilidade Civil incluído",
    extra_seguro: 0,
    tipo_extra_seguro: "fixo",
    extra_transporte: 0,
    tipo_extra_transporte: "diario",
    taxa_matricula: 0,
    taxa_material: 0,
    calendario_funcionamento: {
      data_inicio: "",
      data_fim: "",
      dias_semana: [1, 2, 3, 4, 5] as number[],
      dias_fechados: [] as string[],
    },
    pacotes: [] as Pacote[],
    opcoes_alojamento: [] as OpcaoAlojamento[],
    descontos: [] as Desconto[],
    perguntasUI: [] as PerguntaUI[],
    regras_comissao: {
      modo: "padrao" as "padrao" | "personalizado",
      taxa_programa: 12,
      taxa_alojamento: 10,
      taxa_extras: 0,
    },
  });

  // Modais de Pacotes, Alojamento e Descontos
  const [isPacoteModalOpen, setIsPacoteModalOpen] = useState(false);
  const [novoPacote, setNovoPacote] = useState<Pacote>({
    id: "",
    titulo: "",
    tipo: "semana",
    quantidade: 1,
    variantes: [{ nome: "Preço Base", preco: 150, taxa_comissao: null }],
  });

  const [isAlojamentoModalOpen, setIsAlojamentoModalOpen] = useState(false);
  const [novoAlojamento, setNovoAlojamento] = useState<OpcaoAlojamento>({
    id: "",
    nome: "",
    preco: 0,
    tipo: "semana",
    taxa_comissao: 10,
  });

  const [isDescontoModalOpen, setIsDescontoModalOpen] = useState(false);
  const [novoDesconto, setNovoDesconto] = useState<Desconto>({
    id: "",
    nome: "",
    percentagem: 10,
    acumulavel: false,
  });

  // Carregar Perfil do Parceiro ao iniciar
  useEffect(() => {
    const carregarPerfil = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const [{ data: perfil }, { data: camposExistentes }] = await Promise.all([
        supabase
          .from("perfis")
          .select(
            "taxa_comissao, base_comissao, modalidade_reserva, link_externo_reserva, status_contrato, contrato_dados"
          )
          .eq("id", session.user.id)
          .single(),
        supabase
          .from("campos")
          .select("contrato_parceiro_url")
          .eq("organizador_id", session.user.id)
          .not("contrato_parceiro_url", "is", null)
          .limit(1),
      ]);

      const urlContratoGlobal =
        camposExistentes?.[0]?.contrato_parceiro_url || null;

      if (perfil) {
        const taxa = Number(perfil.taxa_comissao) || 12;
        setPerfilParceiro({
          taxa_comissao: taxa,
          base_comissao: perfil.base_comissao || "total",
          modalidade_reserva:
            perfil.modalidade_reserva ||
            perfil.contrato_dados?.modalidadeReserva ||
            "direta",
          link_externo_reserva:
            perfil.link_externo_reserva ||
            perfil.contrato_dados?.linkExternoReserva ||
            null,
          status_contrato: perfil.status_contrato || null,
          contrato_dados: perfil.contrato_dados || null,
          contrato_global_url: urlContratoGlobal,
        });

        setFormData((prev) => ({
          ...prev,
          politica_cancelamento:
            perfil.contrato_dados?.politicaCancelamento ||
            perfil.contrato_dados?.politica_cancelamento ||
            prev.politica_cancelamento,
          tipo_pagamento:
            perfil.contrato_dados?.tipoPagamento ||
            perfil.contrato_dados?.tipo_pagamento ||
            prev.tipo_pagamento,
          regras_comissao: {
            ...prev.regras_comissao,
            taxa_programa: taxa,
          },
        }));
      }
    };
    carregarPerfil();
  }, []);

  // Geocodificação da morada (OpenStreetMap Nominatim) para colocar o pino no Mapa Interativo
  const buscarNoMapaManual = async () => {
    if (!formData.local.trim()) return;
    try {
      const query = `${formData.local}, ${pais === "Portugal" && formData.Distrito ? formData.Distrito + ", " : ""}${pais}`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=4`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setAddressSuggestions(data);
        setMapPreview({
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        });
      }
    } catch (e) {
      console.error("Erro na geocodificação:", e);
    }
  };

  const handleLinguasChange = (key: keyof typeof linguas) => {
    setLinguas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getLinguasString = () => {
    const mapNomes: Record<string, string> = {
      pt: "Português",
      en: "Inglês",
      es: "Espanhol",
      fr: "Francês",
      de: "Alemão",
    };
    const ativas = Object.entries(linguas)
      .filter(([_, val]) => val)
      .map(([k]) => mapNomes[k]);
    return ativas.length > 0 ? ativas.join(", ") : "Português";
  };

  const getCatName = (catId: string) => {
    const found = CATEGORIAS.find((c) => c.id === catId);
    if (!found) return catId;
    return `${found.icon} ${isEn ? found.en : found.pt}`;
  };

  const handleSelectCategoria = (catId: string) => {
    setFormData((prev) => ({ ...prev, categoria: catId }));
    setIsCatDropdownOpen(false);
  };

  // Calendário
  const toggleDiaSemana = (diaId: number) => {
    setFormData((prev) => {
      const atual = prev.calendario_funcionamento.dias_semana;
      const novos = atual.includes(diaId)
        ? atual.filter((d) => d !== diaId)
        : [...atual, diaId];
      return {
        ...prev,
        calendario_funcionamento: {
          ...prev.calendario_funcionamento,
          dias_semana: novos,
        },
      };
    });
  };

  const adicionarDiaFechado = () => {
    if (!novoDiaFechado) return;
    if (!formData.calendario_funcionamento.dias_fechados.includes(novoDiaFechado)) {
      setFormData((prev) => ({
        ...prev,
        calendario_funcionamento: {
          ...prev.calendario_funcionamento,
          dias_fechados: [
            ...prev.calendario_funcionamento.dias_fechados,
            novoDiaFechado,
          ],
        },
      }));
    }
    setNovoDiaFechado("");
  };

  const removerDiaFechado = (dia: string) => {
    setFormData((prev) => ({
      ...prev,
      calendario_funcionamento: {
        ...prev.calendario_funcionamento,
        dias_fechados: prev.calendario_funcionamento.dias_fechados.filter(
          (d) => d !== dia
        ),
      },
    }));
  };

  // Gestão de Pacotes e Preços
  const adicionarVariante = () => {
    setNovoPacote((prev) => ({
      ...prev,
      variantes: [
        ...prev.variantes,
        { nome: "", preco: 0, taxa_comissao: null },
      ],
    }));
  };

  const atualizarVariante = (
    idx: number,
    campo: keyof Variante,
    valor: any
  ) => {
    setNovoPacote((prev) => {
      const novas = [...prev.variantes];
      novas[idx] = { ...novas[idx], [campo]: valor };
      return { ...prev, variantes: novas };
    });
  };

  const removerVariante = (idx: number) => {
    setNovoPacote((prev) => ({
      ...prev,
      variantes: prev.variantes.filter((_, i) => i !== idx),
    }));
  };

  const guardarPacote = () => {
    if (!novoPacote.titulo.trim()) {
      alert(
        isEn
          ? "Please enter a name for the package."
          : "Indique um nome para o pacote de inscrição."
      );
      return;
    }
    const variantesLimpas = novoPacote.variantes.filter(
      (v) => v.nome.trim() !== "" && Number(v.preco) >= 0
    );
    if (variantesLimpas.length === 0) {
      alert(
        isEn
          ? "Add at least one price option."
          : "Adicione pelo menos uma opção de preço válida."
      );
      return;
    }

    const pacoteFinal: Pacote = {
      ...novoPacote,
      id: novoPacote.id || `pac_${Date.now()}`,
      variantes: variantesLimpas,
    };

    setFormData((prev) => {
      const existe = prev.pacotes.some((p) => p.id === pacoteFinal.id);
      return {
        ...prev,
        pacotes: existe
          ? prev.pacotes.map((p) => (p.id === pacoteFinal.id ? pacoteFinal : p))
          : [...prev.pacotes, pacoteFinal],
      };
    });

    setNovoPacote({
      id: "",
      titulo: "",
      tipo: "semana",
      quantidade: 1,
      variantes: [{ nome: "Preço Base", preco: 150, taxa_comissao: null }],
    });
    setIsPacoteModalOpen(false);
  };

  const eliminarPacote = (idPac: string) => {
    setFormData((prev) => ({
      ...prev,
      pacotes: prev.pacotes.filter((p) => p.id !== idPac),
    }));
  };

  // Gestão de Alojamento Extra
  const guardarAlojamento = () => {
    if (!novoAlojamento.nome.trim()) return;
    const itemFinal: OpcaoAlojamento = {
      ...novoAlojamento,
      id: novoAlojamento.id || `aloj_${Date.now()}`,
    };
    setFormData((prev) => {
      const existe = prev.opcoes_alojamento.some((a) => a.id === itemFinal.id);
      return {
        ...prev,
        opcoes_alojamento: existe
          ? prev.opcoes_alojamento.map((a) =>
              a.id === itemFinal.id ? itemFinal : a
            )
          : [...prev.opcoes_alojamento, itemFinal],
      };
    });
    setIsAlojamentoModalOpen(false);
  };

  const eliminarAlojamento = (idAloj: string) => {
    setFormData((prev) => ({
      ...prev,
      opcoes_alojamento: prev.opcoes_alojamento.filter((a) => a.id !== idAloj),
    }));
  };

  // Gestão de Descontos
  const guardarDesconto = () => {
    if (!novoDesconto.nome.trim()) return;
    const itemFinal: Desconto = {
      ...novoDesconto,
      id: novoDesconto.id || `desc_${Date.now()}`,
    };
    setFormData((prev) => ({
      ...prev,
      descontos: [...prev.descontos, itemFinal],
    }));
    setNovoDesconto({ id: "", nome: "", percentagem: 10, acumulavel: false });
    setIsDescontoModalOpen(false);
  };

  const eliminarDesconto = (idDesc: string) => {
    setFormData((prev) => ({
      ...prev,
      descontos: prev.descontos.filter((d) => d.id !== idDesc),
    }));
  };

  // Gestão de Fotos e Documentos PDF
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    const novosItens: GaleriaItem[] = filesArray.map((file, idx) => ({
      id: `img_${Date.now()}_${idx}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isCapa: galeria.length === 0 && idx === 0,
    }));
    setGaleria((prev) => [...prev, ...novosItens]);
  };

  const setComoCapa = (idImg: string) => {
    setGaleria((prev) =>
      prev.map((img) => ({ ...img, isCapa: img.id === idImg }))
    );
  };

  const removerImagem = (idImg: string) => {
    setGaleria((prev) => {
      const filtrada = prev.filter((img) => img.id !== idImg);
      if (filtrada.length > 0 && !filtrada.some((i) => i.isCapa)) {
        filtrada[0].isCapa = true;
      }
      return filtrada;
    });
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setDocumentos((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removerNovoDoc = (idx: number) => {
    setDocumentos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Perguntas Customizadas no Checkout
  const adicionarPergunta = (tipo: "texto" | "escolha") => {
    setFormData((prev) => ({
      ...prev,
      perguntasUI: [
        ...prev.perguntasUI,
        { id: `perg_${Date.now()}`, tipo, titulo: "", opcoes: "" },
      ],
    }));
  };

  const atualizarPergunta = (
    idPerg: string,
    campo: keyof PerguntaUI,
    valor: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      perguntasUI: prev.perguntasUI.map((p) =>
        p.id === idPerg ? { ...p, [campo]: valor } : p
      ),
    }));
  };

  const removerPergunta = (idPerg: string) => {
    setFormData((prev) => ({
      ...prev,
      perguntasUI: prev.perguntasUI.filter((p) => p.id !== idPerg),
    }));
  };

  // Navegação entre Passos com Validação Intuitiva
  const nextStep = () => {
    if (step === 1) {
      if (!formData.nome.trim() || !formData.local.trim()) {
        alert(
          isEn
            ? "Please fill in the Camp Name and Location before continuing."
            : "Por favor, preencha o Nome do Campo e a Localização antes de avançar."
        );
        return;
      }
      if (!mapPreview) buscarNoMapaManual();
    }
    if (step === 2) {
      if (formData.pacotes.length === 0) {
        alert(
          isEn
            ? "Please add at least one Pricing Package in Step 2."
            : "Por favor, crie pelo menos 1 Pacote de Preços no Passo 2."
        );
        return;
      }
    }
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Tradução Automática Segura
  const traduzirParaIngles = async (texto: string) => {
    if (!texto || !texto.trim()) return "";
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          texto.substring(0, 480)
        )}&langpair=pt|en`
      );
      const data = await res.json();
      return data?.responseData?.translatedText || texto;
    } catch {
      return texto;
    }
  };

  // Gravar na Base de Dados
  const handleGravarCampo = async () => {
    if (!formData.nome.trim() || !formData.local.trim() || !formData.descricao.trim()) {
      alert(
        isEn
          ? "Please fill in the name, location, and program description."
          : "Preencha o nome, localização e descrição do programa."
      );
      return;
    }
    if (formData.pacotes.length === 0) {
      alert(
        isEn
          ? "Create at least 1 pricing package in Step 2."
          : "Crie pelo menos 1 pacote de preços no Passo 2."
      );
      return;
    }
    if (galeria.length === 0) {
      alert(
        isEn
          ? "Add at least 1 photo to your camp."
          : "Adicione pelo menos 1 fotografia ao campo."
      );
      return;
    }

    setSaving(true);
    setStatusText(isEn ? "Uploading photos & brochures..." : "A carregar fotografias e documentos...");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");

      // 1. Upload de Fotografias
      const uploadedUrls: string[] = [];
      let capaUrl = "";

      for (const img of galeria) {
        if (img.file) {
          const cleanName = img.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const fileName = `${session.user.id}_${Date.now()}_${cleanName}`;
          const { error: uploadError } = await supabase.storage
            .from("campos-imagens")
            .upload(fileName, img.file);
          if (uploadError)
            throw new Error(`Erro ao enviar fotografia: ${uploadError.message}`);

          const {
            data: { publicUrl },
          } = supabase.storage.from("campos-imagens").getPublicUrl(fileName);

          if (img.isCapa) {
            capaUrl = publicUrl;
          } else {
            uploadedUrls.push(publicUrl);
          }
        }
      }
      if (!capaUrl && uploadedUrls.length > 0) {
        capaUrl = uploadedUrls.shift()!;
      }

      // 2. Upload de Brochuras / Programas PDF
      const programasDocsFinais: { nome: string; url: string }[] = [];
      for (const doc of documentos) {
        const cleanDocName = doc.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileName = `${session.user.id}_${Date.now()}_${cleanDocName}`;
        const { error: docErr } = await supabase.storage
          .from("campos-documentos")
          .upload(fileName, doc);
        if (docErr) throw new Error(`Erro ao carregar PDF: ${docErr.message}`);
        const {
          data: { publicUrl },
        } = supabase.storage.from("campos-documentos").getPublicUrl(fileName);
        programasDocsFinais.push({ nome: doc.name, url: publicUrl });
      }

      // 3. Garantir coordenadas geográficas se ainda não tiverem sido obtidas
      let coordsFinais = mapPreview;
      if (!coordsFinais && formData.local.trim()) {
        try {
          const q = `${formData.local}, ${pais}`;
          const r = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
          );
          const d = await r.json();
          if (Array.isArray(d) && d.length > 0) {
            coordsFinais = { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon) };
          }
        } catch {}
      }

      setStatusText(
        isEn
          ? "Translating content to English (AI)..."
          : "A traduzir automaticamente para Inglês (IA)..."
      );

      const paisEn = PAISES.find((p) => p.pt === pais)?.en || pais;
      const linguasFinais = getLinguasString();

      const [
        nome_en,
        categoria_en,
        local_en,
        descricao_en,
        alimentacao_en,
        alojamento_en,
        seguro_en,
        regras_termos_en,
        politica_cancelamento_en,
      ] = await Promise.all([
        traduzirParaIngles(formData.nome),
        traduzirParaIngles(formData.categoria),
        traduzirParaIngles(formData.local),
        traduzirParaIngles(formData.descricao),
        traduzirParaIngles(formData.alimentacao),
        traduzirParaIngles(formData.alojamento),
        traduzirParaIngles(formData.seguro),
        traduzirParaIngles(formData.regras_termos),
        traduzirParaIngles(formData.politica_cancelamento),
      ]);

      setStatusText(
        isEn
          ? "Formatting packages & registration options..."
          : "A formatar pacotes de preços e perguntas..."
      );

      // 4. Traduzir Perguntas e Opções Múltiplas
      const perguntasPtLimpas = formData.perguntasUI.filter(
        (p) => p.titulo.trim() !== ""
      );
      const perguntasFormatadasPT: string[] = [];
      const perguntasFormatadasEN: string[] = [];

      for (const p of perguntasPtLimpas) {
        const titulo_en = await traduzirParaIngles(p.titulo.trim());
        if (p.tipo === "escolha") {
          const opcoesArray = p.opcoes
            .split(",")
            .map((o) => o.trim())
            .filter(Boolean);
          const opcoesArray_en = await Promise.all(
            opcoesArray.map((o) => traduzirParaIngles(o))
          );
          perguntasFormatadasPT.push(
            `ESCOLHA|${p.titulo.trim()}|${opcoesArray.join(", ")}`
          );
          perguntasFormatadasEN.push(
            `ESCOLHA|${titulo_en}|${opcoesArray_en.join(", ")}`
          );
        } else {
          perguntasFormatadasPT.push(`TEXTO|${p.titulo.trim()}`);
          perguntasFormatadasEN.push(`TEXTO|${titulo_en}`);
        }
      }

      // 5. Traduzir Pacotes e Variantes de Preço
      const pacotesFormatados = await Promise.all(
        formData.pacotes.map(async (pac) => {
          const titulo_en = await traduzirParaIngles(pac.titulo);
          const variantes_en = await Promise.all(
            pac.variantes.map(async (varis) => {
              const var_nome_en = await traduzirParaIngles(varis.nome);
              return { ...varis, nome_en: var_nome_en };
            })
          );
          return { ...pac, titulo_en, variantes: variantes_en };
        })
      );

      // 6. Traduzir Alojamento e Descontos
      const alojamentosFormatados = await Promise.all(
        formData.opcoes_alojamento.map(async (aloj) => {
          const nome_en = await traduzirParaIngles(aloj.nome);
          return { ...aloj, nome_en };
        })
      );

      const descontosFormatados = await Promise.all(
        formData.descontos.map(async (desc) => {
          const nome_en = await traduzirParaIngles(desc.nome);
          return { ...desc, nome_en };
        })
      );

      // 7. Calcular Preço Mínimo e Regras de Comissão
      const todosPrecos = pacotesFormatados
        .flatMap((p) => p.variantes.map((v) => Number(v.preco) || 0))
        .filter((p) => p > 0);
      const precoMinimo = todosPrecos.length > 0 ? Math.min(...todosPrecos) : 0;

      const isPersonalizado =
        formData.regras_comissao.modo === "personalizado";
      const taxaComissaoCampo = isPersonalizado
        ? formData.regras_comissao.taxa_programa
        : perfilParceiro.taxa_comissao;
      const baseComissaoCampo = isPersonalizado
        ? formData.regras_comissao.taxa_extras > 0
          ? "total"
          : "apenas_programa"
        : perfilParceiro.base_comissao;

      // Se o Parceiro já tem Contrato Global Aprovado, herda o contrato e fica logo Aprovado e Ativo!
      const parceiroJaValidado =
        perfilParceiro.status_contrato === "Aprovado" &&
        !!perfilParceiro.contrato_dados;
      const urlContratoHerdado =
        perfilParceiro.contrato_global_url ||
        (parceiroJaValidado ? "contrato_global_validado" : null);

      setStatusText(isEn ? "Saving camp..." : "A guardar na base de dados...");

      const { error } = await supabase.from("campos").insert({
        organizador_id: session.user.id,
        nome: formData.nome,
        nome_en,
        pais,
        pais_en: paisEn,
        Distrito: pais === "Portugal" ? formData.Distrito : null,
        Distrito_en: pais === "Portugal" ? formData.Distrito : null,
        local: formData.local,
        local_en,
        latitude: coordsFinais ? coordsFinais.lat : null,
        longitude: coordsFinais ? coordsFinais.lon : null,
        linguas_faladas: linguasFinais,
        linguas_faladas_en: linguasFinais,
        idade_min: formData.idade_min,
        idade_max: formData.idade_max,
        idade: `${formData.idade_min} aos ${formData.idade_max} anos`,
        idade_en: `${formData.idade_min} to ${formData.idade_max} years`,
        preco: precoMinimo,
        vagas_totais: formData.vagas_totais,
        categoria: formData.categoria,
        categoria_en,
        politica_cancelamento: formData.politica_cancelamento,
        politica_cancelamento_en,
        tipo_pagamento: formData.tipo_pagamento,
        descricao: formData.descricao,
        descricao_en,
        regras_termos: formData.regras_termos,
        regras_termos_en,
        imagem: capaUrl,
        galeria: uploadedUrls,
        programas_pdf: programasDocsFinais,
        perguntas_customizadas: perguntasFormatadasPT,
        perguntas_customizadas_en: perguntasFormatadasEN,
        calendario_funcionamento: formData.calendario_funcionamento,
        pacotes: pacotesFormatados,
        opcoes_alojamento: alojamentosFormatados,
        regras_comissao: formData.regras_comissao,
        taxa_comissao: taxaComissaoCampo,
        base_comissao: baseComissaoCampo,
        modalidade_reserva: perfilParceiro.modalidade_reserva,
        link_externo_reserva: perfilParceiro.link_externo_reserva,
        contrato_dados: perfilParceiro.contrato_dados,
        contrato_parceiro_url: urlContratoHerdado,
        descontos: descontosFormatados,
        status_aprovacao: parceiroJaValidado ? "Aprovado" : "Pendente",
        ativo: true,
        racio_monitores: formData.racio_monitores,
        racio_monitores_en: formData.racio_monitores,
        alimentacao: formData.alimentacao,
        alimentacao_en,
        alojamento: formData.alojamento,
        alojamento_en,
        seguro: formData.seguro,
        seguro_en,
        extra_seguro: formData.extra_seguro,
        tipo_extra_seguro: formData.tipo_extra_seguro,
        extra_transporte: formData.extra_transporte,
        tipo_extra_transporte: formData.tipo_extra_transporte,
        taxa_matricula: formData.taxa_matricula,
        taxa_material: formData.taxa_material,
      });

      if (error) throw error;

      alert(
        parceiroJaValidado
          ? isEn
            ? "Camp created and published live immediately!"
            : "Campo criado e publicado online com sucesso!"
          : isEn
          ? "Camp created successfully! Please sign your Global Agreement so it goes live."
          : "Campo criado com sucesso! Está pronto para validação."
      );
      router.push(`/${lang}/admin/campos`);
    } catch (err: any) {
      alert(
        (isEn ? "Error creating camp: " : "Erro ao criar campo: ") + err.message
      );
    } finally {
      setSaving(false);
      setStatusText("");
    }
  };

  const mapIframeUrl = mapPreview
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        mapPreview.lon - 0.01
      },${mapPreview.lat - 0.01},${mapPreview.lon + 0.01},${
        mapPreview.lat + 0.01
      }&layer=mapnik&marker=${mapPreview.lat},${mapPreview.lon}`
    : `https://maps.google.com/maps?q=${encodeURIComponent(
        `${formData.local}, ${pais}`
      )}&z=14&output=embed`;

  return (
    <div className="max-w-5xl mx-auto font-sans pb-20">
      {/* TOP LINK & HEADER */}
      <div className="mb-8">
        <Link
          href={`/${lang}/admin/campos`}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 no-underline mb-4"
        >
          &larr; {isEn ? "Back to My Camps" : "Voltar aos Meus Campos"}
        </Link>
        <h1 className="text-3xl font-black text-slate-900 m-0 tracking-tight">
          {isEn ? "Create New Camp" : "Configurar Novo Campo"}
        </h1>

        {/* BARRA DE PROGRESSO CLICÁVEL */}
        <div className="flex items-center gap-3 mt-6">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                if (num < step) setStep(num);
              }}
              className="flex-1 flex flex-col gap-2 text-left bg-transparent border-0 p-0 cursor-pointer"
            >
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  step >= num ? "bg-[#167524]" : "bg-slate-200"
                }`}
              />
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  step >= num ? "text-[#167524]" : "text-slate-400"
                }`}
              >
                {num === 1
                  ? isEn
                    ? "1. Basic Info & Location"
                    : "1. Dados Básicos e Localização"
                  : num === 2
                  ? isEn
                    ? "2. Dates, Prices & Accommodation"
                    : "2. Datas, Preços e Alojamento"
                  : isEn
                  ? "3. Photos, PDFs & Questions"
                  : "3. Fotos, Brochuras e Inscrição"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10 mb-8 relative">
        {/* ========================================== */}
        {/* PASSO 1: DADOS BÁSICOS, LOCAL E MAPA */}
        {/* ========================================== */}
        {step === 1 && (
          <div className="space-y-8">
            <h2 className="text-xl font-black text-slate-900 m-0 flex items-center gap-2">
              <span>🎯</span>{" "}
              {isEn ? "Program Details" : "Informações do Programa"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn ? "Camp / Program Name *" : "Nome do Campo / Programa *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isEn
                      ? "e.g., Caparica Summer Surf Camp"
                      : "Ex: Surf Camp de Verão Caparica"
                  }
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] focus:bg-white transition-colors"
                />
              </div>

              {/* CATEGORIA */}
              <div className="relative">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn ? "Main Category *" : "Categoria Temática *"}
                </label>
                <div
                  onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer flex justify-between items-center hover:border-[#167524]/50 transition-colors"
                >
                  <span>{getCatName(formData.categoria)}</span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </div>
                {isCatDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsCatDropdownOpen(false)}
                    />
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      {CATEGORIAS.map((cat) => (
                        <div
                          key={cat.id}
                          onClick={() => handleSelectCategoria(cat.id)}
                          className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer transition-colors flex items-center gap-2"
                        >
                          <span className="text-lg">{cat.icon}</span>{" "}
                          {isEn ? cat.en : cat.pt}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* POLÍTICA DE CANCELAMENTO */}
              <div className="relative">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn ? "Cancellation Policy" : "Política de Cancelamento"}
                </label>
                <div
                  onClick={() => setIsPolDropdownOpen(!isPolDropdownOpen)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer flex justify-between items-center hover:border-[#167524]/50 transition-colors"
                >
                  <span className="truncate">
                    {formData.politica_cancelamento}
                  </span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </div>
                {isPolDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsPolDropdownOpen(false)}
                    />
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      {[
                        "Flexível (Reembolso a 100% até 7 dias antes)",
                        "Moderada (Reembolso a 50% até 15 dias antes)",
                        "Estrita (Sem reembolso após reserva)",
                      ].map((pol, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              politica_cancelamento: pol,
                            });
                            setIsPolDropdownOpen(false);
                          }}
                          className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer transition-colors"
                        >
                          {pol}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* IDADES E LOTAÇÃO */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {isEn ? "Min Age" : "Idade Mín."}
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="25"
                    value={formData.idade_min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idade_min: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-[#167524] outline-none focus:border-[#167524] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {isEn ? "Max Age" : "Idade Máx."}
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="25"
                    value={formData.idade_max}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idade_max: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-[#167524] outline-none focus:border-[#167524] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn
                    ? "Max Capacity per Turn / Week"
                    : "Lotação Máxima por Semana / Turno"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.vagas_totais}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vagas_totais: Number(e.target.value),
                    })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] focus:bg-white"
                />
              </div>

              {/* LÍNGUAS FALADAS */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn
                    ? "Spoken Languages by Staff"
                    : "Línguas Faladas pelos Monitores"}
                </label>
                <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {[
                    { k: "pt", label: "🇵🇹 Português" },
                    { k: "en", label: "🇬🇧 Inglês" },
                    { k: "es", label: "🇪🇸 Espanhol" },
                    { k: "fr", label: "🇫🇷 Francês" },
                    { k: "de", label: "🇩🇪 Alemão" },
                  ].map((item) => (
                    <label
                      key={item.k}
                      className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={linguas[item.k as keyof typeof linguas]}
                        onChange={() =>
                          handleLinguasChange(item.k as keyof typeof linguas)
                        }
                        className="w-4 h-4 accent-[#167524]"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* LOCALIZAÇÃO COMPLETA (PAÍS, DISTRITO E MORADA COM GEOCODING) */}
              <div className="md:col-span-2 border-t border-slate-100 pt-8 mt-2">
                <h3 className="text-base font-black text-slate-900 m-0 mb-4">
                  📍 {isEn ? "Location & Interactive Map" : "Localização e Mapa"}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {isEn ? "Country *" : "País *"}
                    </label>
                    <select
                      value={pais}
                      onChange={(e) => {
                        setPais(e.target.value);
                        setMapPreview(null);
                      }}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524]"
                    >
                      {PAISES.map((p) => (
                        <option key={p.pt} value={p.pt}>
                          {isEn ? p.en : p.pt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {pais === "Portugal" && (
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Distrito *
                      </label>
                      <select
                        value={formData.Distrito}
                        onChange={(e) =>
                          setFormData({ ...formData, Distrito: e.target.value })
                        }
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524]"
                      >
                        {DISTRITOS_PT.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="relative mb-4">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {isEn
                      ? "Exact Address / Meeting Point *"
                      : "Morada ou Localização Específica *"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder={
                        isEn
                          ? "e.g., Praia de Carcavelos, Cascais"
                          : "Ex: Praia de Carcavelos, Cascais"
                      }
                      value={formData.local}
                      onChange={(e) => {
                        setFormData({ ...formData, local: e.target.value });
                        setMapPreview(null);
                      }}
                      onBlur={buscarNoMapaManual}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          buscarNoMapaManual();
                        }
                      }}
                      className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={buscarNoMapaManual}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest px-5 rounded-xl cursor-pointer transition-colors"
                    >
                      {isEn ? "Locate on Map" : "Localizar no Mapa"}
                    </button>
                  </div>

                  {addressSuggestions.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl mt-2 shadow-lg overflow-hidden">
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                        {isEn
                          ? "Click to confirm exact map coordinates:"
                          : "Clique na morada correta para cravar o pino no Mapa Interativo:"}
                      </div>
                      {addressSuggestions.map((sug, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setMapPreview({
                              lat: parseFloat(sug.lat),
                              lon: parseFloat(sug.lon),
                            });
                            setAddressSuggestions([]);
                          }}
                          className="p-3 cursor-pointer text-xs text-slate-700 hover:bg-emerald-50 border-b border-slate-100 last:border-0 font-bold"
                        >
                          📍 {sug.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full h-56 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center">
                  {!formData.local ? (
                    <span className="text-xs font-bold text-slate-400">
                      {isEn
                        ? "Map preview will appear once you enter the address..."
                        : "O mapa atualizará assim que escrever a morada..."}
                    </span>
                  ) : (
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={mapIframeUrl}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PASSO 2: PREÇOS, ALOJAMENTO EXTRA & REGRAS DE COMISSÃO */}
        {/* ========================================== */}
        {step === 2 && (
          <div className="space-y-10">
            {/* 1. CALENDÁRIO */}
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
                <span>📅</span>{" "}
                {isEn
                  ? "1. Operating Calendar *"
                  : "1. Calendário de Funcionamento *"}
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                {isEn
                  ? "Define the season start and end dates. Parents can only book within this period."
                  : "Defina o período de funcionamento. Os encarregados de educação só poderão reservar datas dentro deste intervalo."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    {isEn ? "Opening Date" : "Data de Início / Abertura"}
                  </label>
                  <input
                    type="date"
                    value={formData.calendario_funcionamento.data_inicio}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        calendario_funcionamento: {
                          ...formData.calendario_funcionamento,
                          data_inicio: e.target.value,
                        },
                      })
                    }
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-[#167524] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    {isEn ? "Closing Date" : "Data de Fim / Encerramento"}
                  </label>
                  <input
                    type="date"
                    value={formData.calendario_funcionamento.data_fim}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        calendario_funcionamento: {
                          ...formData.calendario_funcionamento,
                          data_fim: e.target.value,
                        },
                      })
                    }
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-[#167524] focus:bg-white"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn ? "Active Days of the Week" : "Dias da Semana Ativos"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((dia) => {
                    const isActive =
                      formData.calendario_funcionamento.dias_semana.includes(
                        dia.id
                      );
                    return (
                      <button
                        type="button"
                        key={dia.id}
                        onClick={() => toggleDiaSemana(dia.id)}
                        className={`w-12 h-12 rounded-xl text-xs font-black cursor-pointer transition-all ${
                          isActive
                            ? "bg-[#167524] text-white shadow-md"
                            : "bg-slate-50 text-slate-400 border border-slate-200 hover:border-[#167524]/50"
                        }`}
                      >
                        {isEn ? dia.en : dia.pt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DIAS DE ENCERRAMENTO (EXCEÇÕES) */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">
                  {isEn
                    ? "Closed Days (Holidays / Sold Out)"
                    : "Dias de Encerramento (Feriados / Esgotado)"}
                </label>
                <p className="text-xs text-amber-700 mb-3">
                  {isEn
                    ? "Block specific dates when the program is closed."
                    : "Adicione datas específicas em que o campo estará encerrado ou esgotado."}
                </p>

                <div className="flex gap-2 mb-3">
                  <input
                    type="date"
                    value={novoDiaFechado}
                    onChange={(e) => setNovoDiaFechado(e.target.value)}
                    className="flex-1 p-3 bg-white border border-amber-300 rounded-lg text-sm outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={adicionarDiaFechado}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 rounded-lg transition-colors text-xs cursor-pointer"
                  >
                    {isEn ? "Block Date" : "Bloquear Data"}
                  </button>
                </div>

                {formData.calendario_funcionamento.dias_fechados?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.calendario_funcionamento.dias_fechados.map(
                      (dia) => (
                        <div
                          key={dia}
                          className="flex items-center gap-2 bg-white border border-amber-300 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-bold"
                        >
                          <span className="line-through opacity-80">
                            {new Date(dia).toLocaleDateString("pt-PT")}
                          </span>
                          <button
                            type="button"
                            onClick={() => removerDiaFechado(dia)}
                            className="text-amber-500 hover:text-red-500 text-sm leading-none ml-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. PACOTES E PREÇOS DE INSCRIÇÃO */}
            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-start mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
                    <span>💶</span>{" "}
                    {isEn
                      ? "2. Pricing & Packages *"
                      : "2. Pacotes e Tabela de Preços *"}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-md m-0">
                    {isEn
                      ? "Create your pricing packages (e.g., 1 Week, 2 Weeks, Single Day) and add price options (e.g., Full Day vs Half Day)."
                      : "Crie os seus pacotes de inscrição (ex: 1 Semana, Quinzena, Dia Avulso) e defina os preços dentro de cada pacote."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNovoPacote({
                      id: "",
                      titulo: "",
                      tipo: "semana",
                      quantidade: 1,
                      variantes: [
                        { nome: "Preço Base", preco: 150, taxa_comissao: null },
                      ],
                    });
                    setIsPacoteModalOpen(true);
                  }}
                  className="bg-[#167524] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm hover:bg-[#115a1b] transition-colors whitespace-nowrap cursor-pointer"
                >
                  + {isEn ? "Add Pricing Package" : "Adicionar Preço / Pacote"}
                </button>
              </div>

              {formData.pacotes.length === 0 ? (
                <div className="text-center p-8 bg-[#167524]/5 border border-[#167524]/20 rounded-2xl">
                  <span className="text-3xl block mb-2 opacity-50">🏷️</span>
                  <p className="text-xs font-bold text-[#167524] m-0">
                    {isEn
                      ? "No pricing packages added yet. Click '+ Add Pricing Package' to set your prices."
                      : "Ainda não definiu nenhum pacote de preços. Clique em '+ Adicionar Preço / Pacote'."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.pacotes.map((pacote, idx) => (
                    <div
                      key={idx}
                      className="bg-white border-2 border-slate-100 rounded-2xl p-5 relative group hover:border-[#167524]/30 transition-colors shadow-sm"
                    >
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNovoPacote(pacote);
                            setIsPacoteModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs hover:bg-[#167524] hover:text-white transition-colors cursor-pointer"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarPacote(pacote.id)}
                          className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs hover:bg-red-100 cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="inline-block px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded mb-2">
                        {pacote.tipo === "semana"
                          ? `${pacote.quantidade} Semana(s)`
                          : `${pacote.quantidade} Dia(s)`}
                      </div>
                      <h3 className="text-base font-black text-slate-900 leading-tight mb-3 pr-16">
                        {pacote.titulo}
                      </h3>
                      <div className="space-y-1.5">
                        {pacote.variantes.map((v: Variante, i: number) => (
                          <div
                            key={i}
                            className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 gap-2"
                          >
                            <span className="text-[11px] font-bold text-slate-600 truncate">
                              {v.nome}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              {v.taxa_comissao !== null &&
                                v.taxa_comissao !== undefined && (
                                  <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                    {v.taxa_comissao}% Com.
                                  </span>
                                )}
                              <span className="text-sm font-black text-[#167524]">
                                {v.preco}€
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. OPÇÕES DE ALOJAMENTO EXTRA */}
            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-start mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
                    <span>🛏️</span>{" "}
                    {isEn
                      ? "3. Accommodation Options (Optional Extras)"
                      : "3. Opções de Alojamento (Extras no Checkout)"}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-lg m-0">
                    {isEn
                      ? "If accommodation is sold separately (e.g., Residence, Host Family), add the options here."
                      : "Caso o alojamento seja um suplemento opcional (ex: Residência, Host Family ou Acampamento), adicione as opções e respetivos preços."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNovoAlojamento({
                      id: "",
                      nome: "",
                      preco: 0,
                      tipo: "semana",
                      taxa_comissao: formData.regras_comissao.taxa_alojamento,
                    });
                    setIsAlojamentoModalOpen(true);
                  }}
                  className="bg-[#0E3A68] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm hover:bg-[#0b2b4d] transition-colors whitespace-nowrap cursor-pointer"
                >
                  + {isEn ? "Add Accommodation" : "Adicionar Alojamento"}
                </button>
              </div>

              {formData.opcoes_alojamento.length === 0 ? (
                <div className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs font-bold text-slate-400">
                  {isEn
                    ? "No extra accommodation options configured."
                    : "Sem opções de alojamento extra configuradas (aplicável a campos diurnos ou programas com alojamento já incluído no preço)."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.opcoes_alojamento.map((aloj) => (
                    <div
                      key={aloj.id}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-2xl"
                    >
                      <div className="pr-3">
                        <p className="text-xs font-black text-slate-900 m-0">
                          {aloj.nome}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-black text-[#167524]">
                            {aloj.preco}€ /{" "}
                            {aloj.tipo === "semana"
                              ? "semana"
                              : aloj.tipo === "dia"
                              ? "noite"
                              : "fixo"}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-widest bg-blue-100 text-[#0E3A68] px-2 py-0.5 rounded">
                            Comissão: {aloj.taxa_comissao}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setNovoAlojamento(aloj);
                            setIsAlojamentoModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center text-xs hover:bg-slate-900 hover:text-white cursor-pointer"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarAlojamento(aloj.id)}
                          className="w-8 h-8 rounded-full bg-red-50 text-red-500 font-bold flex items-center justify-center hover:bg-red-100 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. SUPLEMENTOS ADICIONAIS */}
            <div className="pt-8 border-t border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
                <span>🚌</span>{" "}
                {isEn
                  ? "4. Optional Supplements & Fees"
                  : "4. Suplementos Opcionais e Taxas (Seguro, Transporte e Inscrição)"}
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                {isEn
                  ? "Set optional insurance, transport/transfer prices, and registration fees."
                  : "Configure suplementos opcionais de seguro, transporte/transfer e taxas de inscrição (deixe 0€ se já estiver incluído)."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {isEn ? "Extra Insurance Price (€)" : "Preço do Seguro Opcional (€)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.extra_seguro}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        extra_seguro: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] mb-4"
                  />

                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {isEn ? "Billing Model" : "Modelo de Cobrança"}
                  </label>
                  <div
                    onClick={() => setIsSegDropdownOpen(!isSegDropdownOpen)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer flex justify-between items-center"
                  >
                    <span>
                      {formData.tipo_extra_seguro === "fixo"
                        ? "Taxa Fixa (Cobra 1x no total)"
                        : "Por Semana/Dia (Multiplica pela duração)"}
                    </span>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </div>
                  {isSegDropdownOpen && (
                    <div className="absolute top-[calc(100%-12px)] left-5 right-5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div
                        onClick={() => {
                          setFormData({ ...formData, tipo_extra_seguro: "fixo" });
                          setIsSegDropdownOpen(false);
                        }}
                        className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer"
                      >
                        Taxa Fixa (Cobra 1x no total)
                      </div>
                      <div
                        onClick={() => {
                          setFormData({
                            ...formData,
                            tipo_extra_seguro: "diario",
                          });
                          setIsSegDropdownOpen(false);
                        }}
                        className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer"
                      >
                        Por Semana/Dia (Multiplica pela duração)
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {isEn
                      ? "Transport / Airport Transfer Price (€)"
                      : "Preço do Transporte / Transfer (€)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.extra_transporte}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        extra_transporte: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] mb-4"
                  />

                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {isEn ? "Billing Model" : "Modelo de Cobrança"}
                  </label>
                  <div
                    onClick={() => setIsTraDropdownOpen(!isTraDropdownOpen)}
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer flex justify-between items-center"
                  >
                    <span>
                      {formData.tipo_extra_transporte === "diario"
                        ? "Por Semana/Dia (Multiplica pela duração)"
                        : "Taxa Fixa Ida/Volta (Cobra 1x no total)"}
                    </span>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </div>
                  {isTraDropdownOpen && (
                    <div className="absolute top-[calc(100%-12px)] left-5 right-5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div
                        onClick={() => {
                          setFormData({
                            ...formData,
                            tipo_extra_transporte: "diario",
                          });
                          setIsTraDropdownOpen(false);
                        }}
                        className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer"
                      >
                        Por Semana/Dia (Multiplica pela duração)
                      </div>
                      <div
                        onClick={() => {
                          setFormData({
                            ...formData,
                            tipo_extra_transporte: "fixo",
                          });
                          setIsTraDropdownOpen(false);
                        }}
                        className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer"
                      >
                        Taxa Fixa Ida/Volta (Cobra 1x no total)
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {isEn
                      ? "Registration Fee (€)"
                      : "Taxa de Matrícula / Inscrição Fixa (€)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.taxa_matricula}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        taxa_matricula: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524]"
                  />
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {isEn
                      ? "Materials / Equipment Fee (€)"
                      : "Taxa de Material / Equipamento (€)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.taxa_material}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        taxa_material: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524]"
                  />
                </div>
              </div>
            </div>

            {/* 5. REGRAS DE DESCONTO */}
            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
                    <span>✨</span>{" "}
                    {isEn ? "5. Automatic Discounts" : "5. Descontos (Irmãos / Semanas Extra)"}
                  </h2>
                  <p className="text-xs text-slate-500 m-0">
                    {isEn
                      ? "Create automatic discounts for siblings or multi-week bookings."
                      : "Crie regras de desconto automáticas para irmãos ou reservas de várias semanas."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDescontoModalOpen(true)}
                  className="bg-[#167524]/10 text-[#167524] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#167524]/20 transition-colors cursor-pointer"
                >
                  + {isEn ? "New Discount" : "Novo Desconto"}
                </button>
              </div>

              {formData.descontos.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">
                  {isEn ? "No discounts configured." : "Sem descontos configurados."}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.descontos.map((desc) => (
                    <div
                      key={desc.id}
                      className="flex items-center justify-between bg-white border-2 border-slate-100 p-4 rounded-2xl"
                    >
                      <div>
                        <p className="text-sm font-black text-slate-800 m-0">
                          {desc.nome}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 m-0">
                          {desc.percentagem}% •{" "}
                          {desc.acumulavel ? "Acumulável ✅" : "Não Acumulável 🚫"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarDesconto(desc.id)}
                        className="w-8 h-8 rounded-full bg-red-50 text-red-500 font-bold flex items-center justify-center hover:bg-red-100 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PASSO 3: DESCRIÇÃO, LOGÍSTICA, FOTOS, PDFs E PERGUNTAS */}
        {/* ========================================== */}
        {step === 3 && (
          <div className="space-y-10">
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <span>📸</span>{" "}
                {isEn
                  ? "1. Description, Logistics & Media"
                  : "1. Apresentação Editorial, Logística e Fotografias"}
              </h2>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn
                    ? "Full Program Description *"
                    : "Descrição Completa do Programa *"}
                </label>
                <textarea
                  rows={5}
                  placeholder={
                    isEn
                      ? "Describe the daily schedule, activities, and what participants will learn..."
                      : "Descreva as atividades, os horários e o que os participantes vão viver..."
                  }
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#167524] focus:bg-white resize-none leading-relaxed"
                />
              </div>

              {/* INFORMAÇÕES LOGÍSTICAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200 mt-6">
                <div className="sm:col-span-2 mb-1">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 m-0">
                    {isEn
                      ? "Key Logistics Info (Displayed on Camp Page)"
                      : "Informações Logísticas (Exibidas na Página do Campo)"}
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    {isEn ? "Monitor Ratio" : "Rácio de Monitores"}
                  </label>
                  <input
                    type="text"
                    value={formData.racio_monitores}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        racio_monitores: e.target.value,
                      })
                    }
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-sm outline-none focus:border-[#167524]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    {isEn ? "Meals Included" : "Regime de Alimentação"}
                  </label>
                  <input
                    type="text"
                    value={formData.alimentacao}
                    onChange={(e) =>
                      setFormData({ ...formData, alimentacao: e.target.value })
                    }
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-sm outline-none focus:border-[#167524]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    {isEn ? "Accommodation Info" : "Regime de Alojamento"}
                  </label>
                  <input
                    type="text"
                    value={formData.alojamento}
                    onChange={(e) =>
                      setFormData({ ...formData, alojamento: e.target.value })
                    }
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-sm outline-none focus:border-[#167524]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    {isEn ? "Insurance Coverage" : "Cobertura de Seguros"}
                  </label>
                  <input
                    type="text"
                    value={formData.seguro}
                    onChange={(e) =>
                      setFormData({ ...formData, seguro: e.target.value })
                    }
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-sm outline-none focus:border-[#167524]"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn
                    ? "Specific Rules & What to Bring"
                    : "Regras Específicas e O Que Levar"}
                </label>
                <textarea
                  rows={3}
                  placeholder={
                    isEn
                      ? "Clothing needed, check-in/out times, specific rules..."
                      : "Equipamento a levar, horários de entrega/recolha, regras específicas..."
                  }
                  value={formData.regras_termos}
                  onChange={(e) =>
                    setFormData({ ...formData, regras_termos: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#167524] focus:bg-white resize-none leading-relaxed"
                />
              </div>

              {/* GALERIA DE FOTOS */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-widest m-0">
                      {isEn ? "Photo Gallery *" : "Galeria de Fotografias *"}
                    </label>
                    <p className="text-[11px] text-slate-500 m-0 mt-1">
                      {isEn
                        ? "Upload photos. The image marked with ⭐ will be the main cover."
                        : "Adicione fotografias do campo. A foto marcada com ⭐ será a Foto de Capa."}
                    </p>
                  </div>
                  <label className="bg-[#167524] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer hover:bg-[#115a1b] transition-colors shadow-sm">
                    + {isEn ? "Add Photos" : "Adicionar Fotos"}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {galeria.length === 0 ? (
                  <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-xl">
                    <span className="text-slate-400 text-2xl mb-2 block">📷</span>
                    <span className="text-xs font-bold text-slate-500">
                      {isEn
                        ? "No photos uploaded yet."
                        : "Nenhuma fotografia adicionada."}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {galeria.map((img) => (
                      <div
                        key={img.id}
                        className={`relative rounded-xl overflow-hidden aspect-square border-4 transition-all group ${
                          img.isCapa
                            ? "border-[#167524] shadow-lg"
                            : "border-transparent"
                        }`}
                      >
                        <img
                          src={img.previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          {!img.isCapa && (
                            <button
                              type="button"
                              onClick={() => setComoCapa(img.id)}
                              className="bg-white text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
                            >
                              Definir Capa ⭐
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removerImagem(img.id)}
                            className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
                          >
                            Apagar 🗑️
                          </button>
                        </div>
                        {img.isCapa && (
                          <div className="absolute top-2 left-2 bg-[#167524] text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm">
                            Capa ⭐
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* UPLOAD DE BROCHURAS / PROGRAMA EM PDF */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-widest m-0">
                      📄{" "}
                      {isEn
                        ? "Program Brochure / Itinerary (PDF)"
                        : "Programa Detalhado / Brochura (PDF)"}
                    </label>
                    <p className="text-[11px] text-slate-500 m-0 mt-1">
                      {isEn
                        ? "Attach a PDF schedule or brochure for parents to download."
                        : "Anexe o horário ou brochura em PDF para aumentar a confiança dos encarregados de educação."}
                    </p>
                  </div>
                  <label className="bg-white border border-slate-300 text-slate-700 text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors shadow-sm">
                    + {isEn ? "Attach PDF" : "Anexar PDF"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      onChange={handleDocSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {documentos.length > 0 && (
                  <div className="space-y-2">
                    {documentos.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-white px-4 py-2.5 rounded-xl border border-slate-200"
                      >
                        <span className="text-xs font-bold text-slate-700 truncate">
                          📄 {doc.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removerNovoDoc(idx)}
                          className="text-red-500 font-black cursor-pointer ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. PERGUNTAS PERSONALIZADAS DE INSCRIÇÃO */}
            <div className="pt-8 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
                    <span>📋</span>{" "}
                    {isEn
                      ? "2. Custom Registration Questions"
                      : "2. Opções e Perguntas de Inscrição"}
                  </h2>
                  <p className="text-xs text-slate-500 m-0">
                    {isEn
                      ? "Health data, allergies, and emergency contacts are already requested automatically."
                      : "Os dados médicos, alergias e contactos de emergência já são recolhidos automaticamente. Adicione perguntas extra se precisar."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => adicionarPergunta("texto")}
                    className="text-[10px] font-black uppercase tracking-widest text-[#167524] bg-[#167524]/10 px-3 py-2.5 rounded-xl hover:bg-[#167524]/20 transition-colors cursor-pointer"
                  >
                    + {isEn ? "Open Question" : "Pergunta Aberta"}
                  </button>
                  <button
                    type="button"
                    onClick={() => adicionarPergunta("escolha")}
                    className="text-[10px] font-black uppercase tracking-widest text-white bg-[#167524] px-3 py-2.5 rounded-xl hover:bg-[#115a1b] transition-colors shadow-sm cursor-pointer"
                  >
                    + {isEn ? "Multiple Choice" : "Opção Múltipla"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {formData.perguntasUI.map((p) => (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl border shadow-sm relative ${
                      p.tipo === "escolha"
                        ? "bg-emerald-50/30 border-emerald-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => removerPergunta(p.id)}
                      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100 font-bold cursor-pointer"
                    >
                      ×
                    </button>

                    <div className="pr-10 mb-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest mb-3 ${
                          p.tipo === "escolha"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.tipo === "escolha"
                          ? "▼ Escolha Múltipla (Selecionada pelo Pai)"
                          : "📝 Pergunta Aberta (Respondida no Checkout)"}
                      </span>
                      <input
                        type="text"
                        placeholder={
                          p.tipo === "escolha"
                            ? "Ex: Qual o nível de experiência no desporto?"
                            : "Ex: Alguma observação sobre o transporte?"
                        }
                        value={p.titulo}
                        onChange={(e) =>
                          atualizarPergunta(p.id, "titulo", e.target.value)
                        }
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#167524]"
                      />
                    </div>

                    {p.tipo === "escolha" && (
                      <div className="bg-white p-4 rounded-xl border border-emerald-100">
                        <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1.5">
                          Opções Disponíveis (Separadas por vírgula)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Iniciado, Intermédio, Avançado"
                          value={p.opcoes}
                          onChange={(e) =>
                            atualizarPergunta(p.id, "opcoes", e.target.value)
                          }
                          className="w-full p-3 bg-slate-50 border border-emerald-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTÕES DE NAVEGAÇÃO ENTRE PASSOS */}
      <div className="flex justify-between items-center px-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="px-6 py-3 font-bold text-slate-600 hover:text-slate-900 bg-white rounded-xl shadow-sm border border-slate-200 cursor-pointer"
          >
            &larr; {isEn ? "Previous Step" : "Voltar atrás"}
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            className="bg-[#167524] text-white font-bold px-8 py-3.5 rounded-xl shadow-md hover:bg-[#115a1b] transition-all uppercase tracking-widest text-xs cursor-pointer"
          >
            {isEn ? "Next Step" : "Próximo Passo"} &rarr;
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGravarCampo}
            disabled={saving}
            className="bg-[#167524] text-white font-black px-10 py-4 rounded-xl shadow-lg hover:bg-[#115a1b] transition-all disabled:opacity-50 uppercase tracking-widest text-xs cursor-pointer"
          >
            {saving
              ? statusText || (isEn ? "Saving..." : "A Guardar...")
              : isEn
              ? "✓ Publish & Save Camp"
              : "✓ Finalizar e Guardar Campo"}
          </button>
        )}
      </div>

      {/* MODAL PACOTES DE PREÇOS */}
      {isPacoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-lg m-0">
                {novoPacote.id
                  ? isEn
                    ? "Edit Pricing Package"
                    : "Editar Pacote de Preços"
                  : isEn
                  ? "New Pricing Package"
                  : "Configurar Pacote de Preços"}
              </h3>
              <button
                type="button"
                onClick={() => setIsPacoteModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/70 text-slate-600 font-black cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  A. {isEn ? "Duration Format" : "Formato de Duração"}
                </label>
                <div className="flex bg-slate-100 p-1.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() =>
                      setNovoPacote({ ...novoPacote, tipo: "semana" })
                    }
                    className={`flex-1 py-3 rounded-lg text-xs font-black cursor-pointer transition-all ${
                      novoPacote.tipo === "semana"
                        ? "bg-white text-[#167524] shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    {isEn ? "Full Weeks" : "Semanas Completas"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNovoPacote({ ...novoPacote, tipo: "dia" })
                    }
                    className={`flex-1 py-3 rounded-lg text-xs font-black cursor-pointer transition-all ${
                      novoPacote.tipo === "dia"
                        ? "bg-white text-[#167524] shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    {isEn ? "Single Days / Pack of Days" : "Dias Avulso / Pack de Dias"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    B. {isEn ? "Package Name *" : "Nome do Pacote / Inscrição *"}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      isEn ? 'e.g., "1 Week Summer Camp"' : 'Ex: "Semana de Férias"'
                    }
                    value={novoPacote.titulo}
                    onChange={(e) =>
                      setNovoPacote({ ...novoPacote, titulo: e.target.value })
                    }
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#167524] bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    {isEn ? "Quantity" : "Duração"} (
                    {novoPacote.tipo === "semana" ? "Sem" : "Dias"})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={novoPacote.quantidade}
                    onChange={(e) =>
                      setNovoPacote({
                        ...novoPacote,
                        quantidade: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black text-[#167524] outline-none bg-slate-50 text-center"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-black text-slate-900 m-0">
                    C. {isEn ? "Price Options (€)" : "Opções de Preço (€)"}
                  </label>
                  <button
                    type="button"
                    onClick={adicionarVariante}
                    className="text-[10px] font-black uppercase tracking-widest text-[#167524] bg-[#167524]/10 px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    + {isEn ? "Add Price Option" : "Adicionar Opção de Preço"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {isEn
                    ? "If you have a single price for this package, keep 'Base Price'. If you have different prices (e.g., Full Day vs Morning Only), add multiple price options."
                    : "Se tiver apenas 1 preço para este pacote, mantenha 'Preço Base'. Se tiver diferentes modalidades de preço (ex: Dia Inteiro vs Só Manhã, ou Com Almoço vs Sem Almoço), adicione mais opções."}
                </p>

                <div className="flex flex-col gap-3">
                  {novoPacote.variantes.map((v, i) => (
                    <div
                      key={i}
                      className="flex gap-2 items-center bg-white border border-slate-200 p-2 rounded-xl"
                    >
                      <input
                        type="text"
                        placeholder="Ex: Preço Base / Dia Inteiro"
                        value={v.nome}
                        onChange={(e) =>
                          atualizarVariante(i, "nome", e.target.value)
                        }
                        className="flex-1 p-2 text-xs sm:text-sm font-bold outline-none bg-transparent"
                      />
                      <div className="w-28 flex items-center bg-slate-50 rounded-lg border border-slate-200 px-3">
                        <input
                          type="number"
                          min="0"
                          value={v.preco}
                          onChange={(e) =>
                            atualizarVariante(
                              i,
                              "preco",
                              Number(e.target.value)
                            )
                          }
                          className="w-full py-2 text-sm font-black text-[#167524] outline-none bg-transparent text-right"
                        />
                        <span className="text-xs font-black text-slate-400 ml-1">
                          €
                        </span>
                      </div>
                      {novoPacote.variantes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerVariante(i)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPacoteModalOpen(false)}
                className="px-5 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl text-sm cursor-pointer"
              >
                {isEn ? "Cancel" : "Cancelar"}
              </button>
              <button
                type="button"
                onClick={guardarPacote}
                className="px-6 py-2.5 font-black text-white bg-[#167524] rounded-xl text-sm shadow-md cursor-pointer"
              >
                ✓ {isEn ? "Save Price Package" : "Guardar Preço"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALOJAMENTO EXTRA */}
      {isAlojamentoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-lg m-0">
                {isEn ? "Accommodation Option" : "Opção de Alojamento"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAlojamentoModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  {isEn ? "Option Name *" : "Nome da Opção de Alojamento *"}
                </label>
                <input
                  type="text"
                  placeholder="Ex: Residência Quarto Duplo (Pensão Completa)"
                  value={novoAlojamento.nome}
                  onChange={(e) =>
                    setNovoAlojamento({
                      ...novoAlojamento,
                      nome: e.target.value,
                    })
                  }
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold outline-none bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    {isEn ? "Price (€) *" : "Preço (€) *"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={novoAlojamento.preco}
                    onChange={(e) =>
                      setNovoAlojamento({
                        ...novoAlojamento,
                        preco: Number(e.target.value),
                      })
                    }
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-black text-[#167524] outline-none bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    {isEn ? "Billing Unit" : "Unidade de Preço"}
                  </label>
                  <select
                    value={novoAlojamento.tipo}
                    onChange={(e) =>
                      setNovoAlojamento({
                        ...novoAlojamento,
                        tipo: e.target.value as "semana" | "dia" | "fixo",
                      })
                    }
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none bg-slate-50"
                  >
                    <option value="semana">Por Semana</option>
                    <option value="dia">Por Noite / Dia</option>
                    <option value="fixo">Valor Fixo Único</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAlojamentoModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold border border-slate-200 bg-white text-slate-600 text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarAlojamento}
                className="px-6 py-2.5 rounded-xl font-black bg-[#0E3A68] text-white text-sm shadow-md cursor-pointer"
              >
                ✓ Guardar Alojamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DESCONTOS */}
      {isDescontoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-lg m-0">
                {isEn ? "New Discount Rule" : "Nova Regra de Desconto"}
              </h3>
              <button
                type="button"
                onClick={() => setIsDescontoModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 bg-slate-50">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn ? "Discount Name" : "Nome do Desconto"}
                </label>
                <input
                  type="text"
                  value={novoDesconto.nome}
                  onChange={(e) =>
                    setNovoDesconto({ ...novoDesconto, nome: e.target.value })
                  }
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold outline-none bg-white"
                  placeholder="Ex: Desconto Irmãos (10%)"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn ? "Discount Percentage (%)" : "Percentagem de Desconto (%)"}
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={novoDesconto.percentagem}
                  onChange={(e) =>
                    setNovoDesconto({
                      ...novoDesconto,
                      percentagem: Number(e.target.value),
                    })
                  }
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-base font-black text-[#167524] outline-none bg-white"
                />
              </div>
              <div
                className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center cursor-pointer"
                onClick={() =>
                  setNovoDesconto({
                    ...novoDesconto,
                    acumulavel: !novoDesconto.acumulavel,
                  })
                }
              >
                <div>
                  <p className="m-0 font-black text-slate-900 text-sm">
                    {isEn ? "Combinable?" : "É Acumulável?"}
                  </p>
                  <p className="m-0 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {isEn
                      ? "Combines with other discounts"
                      : "Acumula com outros descontos"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={novoDesconto.acumulavel}
                  readOnly
                  className="w-5 h-5 accent-[#167524]"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDescontoModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold border border-slate-200 bg-white text-slate-600 text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarDesconto}
                className="px-6 py-2.5 rounded-xl font-black bg-[#167524] text-white text-sm shadow-md cursor-pointer"
              >
                ✓ Guardar Desconto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
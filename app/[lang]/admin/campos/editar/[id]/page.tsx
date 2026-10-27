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

export default function EditarCampoParceiro({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [organizador, setOrganizador] = useState<any>(null);

  const [perfilParceiro, setPerfilParceiro] = useState<{
    taxa_comissao: number;
    base_comissao: string;
    modalidade_reserva: string;
  }>({
    taxa_comissao: 12,
    base_comissao: "total",
    modalidade_reserva: "direta",
  });

  // Localização e Línguas
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

  // Media (Fotos e Documentos PDF)
  const [galeria, setGaleria] = useState<GaleriaItem[]>([]);
  const [documentosExistentes, setDocumentosExistentes] = useState<
    { nome: string; url: string }[]
  >([]);
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
    racio_monitores: "",
    alimentacao: "",
    alojamento: "",
    seguro: "",
    extra_seguro: 0,
    tipo_extra_seguro: "fixo",
    extra_transporte: 0,
    tipo_extra_transporte: "diario",
    taxa_matricula: 0,
    taxa_material: 0,
    status_aprovacao: "Pendente",
    contrato_parceiro_url: null as string | null,
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

  // Modais
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

  // ==========================================
  // CARREGAR DADOS EXISTENTES (CAMPO + PERFIL)
  // ==========================================
  useEffect(() => {
    const fetchCampo = async () => {
      const { data, error } = await supabase
        .from("campos")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("Erro ao carregar campo: " + (error?.message || "Não encontrado"));
        router.push(`/${lang}/admin/campos`);
        return;
      }

      if (data.organizador_id) {
        const { data: orgData } = await supabase
          .from("perfis")
          .select("*")
          .eq("id", data.organizador_id)
          .single();

        if (orgData) {
          setOrganizador(orgData);
          setPerfilParceiro({
            taxa_comissao: Number(orgData.taxa_comissao) || 12,
            base_comissao: orgData.base_comissao || "total",
            modalidade_reserva:
              orgData.modalidade_reserva ||
              orgData.contrato_dados?.modalidadeReserva ||
              data.modalidade_reserva ||
              "direta",
          });
        }
      }

      // Reconstruir País e Coordenadas
      setPais(data.pais || "Portugal");
      if (data.latitude && data.longitude) {
        setMapPreview({
          lat: Number(data.latitude),
          lon: Number(data.longitude),
        });
      }

      // Reconstruir Línguas Faladas
      const strLing = String(data.linguas_faladas || "Português").toLowerCase();
      setLinguas({
        pt: strLing.includes("portugu"),
        en: strLing.includes("ingl") || strLing.includes("engl"),
        es: strLing.includes("espanh") || strLing.includes("span"),
        fr: strLing.includes("franc") || strLing.includes("fren"),
        de: strLing.includes("alem") || strLing.includes("germ"),
      });

      // Reconstruir Galeria de Imagens (Sem duplicar a Foto de Capa!)
      const fotosIniciais: GaleriaItem[] = [];
      const urlsVistas = new Set<string>();

      if (data.imagem) {
        fotosIniciais.push({
          id: "img_capa_principal",
          previewUrl: data.imagem,
          isCapa: true,
        });
        urlsVistas.add(data.imagem);
      }

      if (Array.isArray(data.galeria)) {
        data.galeria.forEach((url: string, idx: number) => {
          if (url && !urlsVistas.has(url)) {
            fotosIniciais.push({
              id: `img_gal_${idx}`,
              previewUrl: url,
              isCapa: fotosIniciais.length === 0,
            });
            urlsVistas.add(url);
          }
        });
      }
      setGaleria(fotosIniciais);

      // Reconstruir PDFs Existentes
      if (Array.isArray(data.programas_pdf)) {
        setDocumentosExistentes(data.programas_pdf);
      }

      // Reconstruir Perguntas Customizadas
      const perguntasReconstruidas: PerguntaUI[] = [];
      if (Array.isArray(data.perguntas_customizadas)) {
        data.perguntas_customizadas.forEach((raw: string, i: number) => {
          if (raw.startsWith("ESCOLHA|")) {
            const partes = raw.split("|");
            perguntasReconstruidas.push({
              id: `perg_exist_${i}`,
              tipo: "escolha",
              titulo: partes[1] || "",
              opcoes: partes[2] || "",
            });
          } else if (raw.startsWith("TEXTO|")) {
            perguntasReconstruidas.push({
              id: `perg_exist_${i}`,
              tipo: "texto",
              titulo: raw.replace("TEXTO|", ""),
              opcoes: "",
            });
          } else {
            perguntasReconstruidas.push({
              id: `perg_exist_${i}`,
              tipo: "texto",
              titulo: raw,
              opcoes: "",
            });
          }
        });
      }

      setFormData({
        nome: data.nome || "",
        categoria: data.categoria || "Desporto",
        Distrito: data.Distrito || "Lisboa",
        local: data.local || "",
        idade_min: Number(data.idade_min) || 6,
        idade_max: Number(data.idade_max) || 16,
        vagas_totais: Number(data.vagas_totais) || 30,
        politica_cancelamento:
          data.politica_cancelamento ||
          "Flexível (Reembolso a 100% até 7 dias antes)",
        tipo_pagamento: data.tipo_pagamento || "100_total",
        descricao: data.descricao || "",
        regras_termos: data.regras_termos || "",
        racio_monitores: data.racio_monitores || "",
        alimentacao: data.alimentacao || "",
        alojamento: data.alojamento || "",
        seguro: data.seguro || "",
        extra_seguro: Number(data.extra_seguro) || 0,
        tipo_extra_seguro: data.tipo_extra_seguro || "fixo",
        extra_transporte: Number(data.extra_transporte) || 0,
        tipo_extra_transporte: data.tipo_extra_transporte || "diario",
        taxa_matricula: Number(data.taxa_matricula) || 0,
        taxa_material: Number(data.taxa_material) || 0,
        status_aprovacao: data.status_aprovacao || "Pendente",
        contrato_parceiro_url: data.contrato_parceiro_url || null,
        calendario_funcionamento: {
          data_inicio: data.calendario_funcionamento?.data_inicio || "",
          data_fim: data.calendario_funcionamento?.data_fim || "",
          dias_semana: Array.isArray(
            data.calendario_funcionamento?.dias_semana
          )
            ? data.calendario_funcionamento.dias_semana
            : [1, 2, 3, 4, 5],
          dias_fechados: Array.isArray(
            data.calendario_funcionamento?.dias_fechados
          )
            ? data.calendario_funcionamento.dias_fechados
            : [],
        },
        pacotes: Array.isArray(data.pacotes) ? data.pacotes : [],
        opcoes_alojamento: Array.isArray(data.opcoes_alojamento)
          ? data.opcoes_alojamento
          : [],
        descontos: Array.isArray(data.descontos) ? data.descontos : [],
        perguntasUI: perguntasReconstruidas,
        regras_comissao: data.regras_comissao || {
          modo: "padrao",
          taxa_programa: Number(data.taxa_comissao) || 12,
          taxa_alojamento: 10,
          taxa_extras: 0,
        },
      });

      setLoading(false);
    };

    fetchCampo();
  }, [id, lang, router]);

  // Geocodificação Manual
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

  // Pacotes e Preços
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
          ? "Please enter a package name."
          : "Indique um nome para o pacote de preços."
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

  // Alojamento
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

  // Descontos
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

  // Fotos e Documentos PDF
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

  const removeDocExistente = (idx: number) => {
    setDocumentosExistentes((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeNovoDoc = (idx: number) => {
    setDocumentos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Perguntas
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

  // Apagar Campo
  const handleApagarCampo = async () => {
    const confirmacao = window.confirm(
      isEn
        ? "ATTENTION: Are you sure you want to permanently delete this camp?"
        : "ATENÇÃO: Tem a certeza absoluta que pretende eliminar este campo? Esta ação é irreversível."
    );
    if (!confirmacao) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from("campos").delete().eq("id", id);
      if (error) throw error;
      router.push(`/${lang}/admin/campos`);
    } catch (err: any) {
      alert(err.message);
      setDeleting(false);
    }
  };

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

  // Guardar Alterações (Pode ser clicado em qualquer passo!)
  const handleGravarCampo = async () => {
    if (!formData.nome.trim() || !formData.local.trim() || !formData.descricao.trim()) {
      alert(
        isEn
          ? "Please fill in the name, location, and description."
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
          ? "Keep at least 1 photo in your gallery."
          : "Mantenha pelo menos 1 fotografia no campo."
      );
      return;
    }

    setSaving(true);
    setStatusText(isEn ? "Processing media..." : "A processar fotografias e PDFs...");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      // 1. Upload de Fotos Novas e Separação da Capa
      const uploadedUrls: string[] = [];
      let capaUrl = "";

      for (const img of galeria) {
        let finalUrl = img.previewUrl;
        if (img.file) {
          const cleanName = img.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const fileName = `${session.user.id}_${Date.now()}_${cleanName}`;
          const { error: uploadError } = await supabase.storage
            .from("campos-imagens")
            .upload(fileName, img.file);
          if (uploadError)
            throw new Error(`Erro ao enviar foto: ${uploadError.message}`);
          const {
            data: { publicUrl },
          } = supabase.storage.from("campos-imagens").getPublicUrl(fileName);
          finalUrl = publicUrl;
        }

        if (img.isCapa) {
          capaUrl = finalUrl;
        } else {
          uploadedUrls.push(finalUrl);
        }
      }
      if (!capaUrl && uploadedUrls.length > 0) {
        capaUrl = uploadedUrls.shift()!;
      }

      // 2. Upload de Novos PDFs
      const novosDocsUploaded: { nome: string; url: string }[] = [];
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
        novosDocsUploaded.push({ nome: doc.name, url: publicUrl });
      }
      const programasDocsFinais = [...documentosExistentes, ...novosDocsUploaded];

      // 3. Coordenadas geográficas
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
        isEn ? "Translating texts (AI)..." : "A sincronizar traduções (IA)..."
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

      const temContratoValido =
        !!formData.contrato_parceiro_url ||
        organizador?.status_contrato === "Aprovado";
      const statusFinal =
        formData.status_aprovacao === "Aprovado" || temContratoValido
          ? "Aprovado"
          : "Pendente";

      setStatusText(isEn ? "Saving changes..." : "A guardar alterações...");

      const { error } = await supabase
        .from("campos")
        .update({
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
          descontos: descontosFormatados,
          status_aprovacao: statusFinal,
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
        })
        .eq("id", id);

      if (error) throw error;

      alert(
        isEn
          ? "Camp updated successfully!"
          : "Alterações guardadas e publicadas com sucesso!"
      );
      router.push(`/${lang}/admin/campos`);
    } catch (err: any) {
      alert(
        (isEn ? "Error updating camp: " : "Erro ao atualizar campo: ") +
          err.message
      );
    } finally {
      setSaving(false);
      setStatusText("");
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">
        {isEn ? "Loading camp data..." : "A carregar dados do programa..."}
      </div>
    );
  }

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
      {/* HEADER COM ACÇÃO DE GUARDAR DIRETO E APAGAR */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <Link
            href={`/${lang}/admin/campos`}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 no-underline"
          >
            &larr; {isEn ? "Back to My Camps" : "Voltar aos Meus Campos"}
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleApagarCampo}
              disabled={deleting || saving}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black uppercase tracking-widest text-[11px] px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              🗑️ {deleting ? "..." : isEn ? "Delete Camp" : "Eliminar Campo"}
            </button>
            <button
              type="button"
              onClick={handleGravarCampo}
              disabled={saving}
              className="bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-colors"
            >
              {saving
                ? statusText || (isEn ? "Saving..." : "A Guardar...")
                : isEn
                ? "✓ Save Changes"
                : "✓ Guardar Alterações"}
            </button>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-slate-900 m-0 tracking-tight">
          {isEn ? `Edit: ${formData.nome}` : `Editar: ${formData.nome}`}
        </h1>

        {/* ABAS DE NAVEGAÇÃO LIVRE ENTRE OS 3 PASSOS */}
        <div className="flex items-center gap-3 mt-6">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setStep(num)}
              className="flex-1 flex flex-col gap-2 text-left bg-transparent border-0 p-0 cursor-pointer"
            >
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  step === num
                    ? "bg-[#167524]"
                    : step > num
                    ? "bg-emerald-300"
                    : "bg-slate-200"
                }`}
              />
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  step === num ? "text-[#167524]" : "text-slate-400"
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
        {/* PASSO 1: DADOS BÁSICOS E LOCALIZAÇÃO */}
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
                  {isEn ? "Camp Name *" : "Nome do Campo *"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] focus:bg-white"
                />
              </div>

              <div className="relative">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn ? "Category *" : "Categoria Temática *"}
                </label>
                <div
                  onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer flex justify-between items-center"
                >
                  <span>{getCatName(formData.categoria)}</span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </div>
                {isCatDropdownOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {CATEGORIAS.map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => handleSelectCategoria(cat.id)}
                        className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer flex items-center gap-2"
                      >
                        <span className="text-lg">{cat.icon}</span>{" "}
                        {isEn ? cat.en : cat.pt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn ? "Cancellation Policy" : "Política de Cancelamento"}
                </label>
                <div
                  onClick={() => setIsPolDropdownOpen(!isPolDropdownOpen)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer flex justify-between items-center"
                >
                  <span className="truncate">
                    {formData.politica_cancelamento}
                  </span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </div>
                {isPolDropdownOpen && (
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
                        className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer"
                      >
                        {pol}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {isEn ? "Min Age" : "Idade Mín."}
                  </label>
                  <input
                    type="number"
                    min="3"
                    value={formData.idade_min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idade_min: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-[#167524] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {isEn ? "Max Age" : "Idade Máx."}
                  </label>
                  <input
                    type="number"
                    min="3"
                    value={formData.idade_max}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idade_max: Number(e.target.value),
                      })
                    }
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-[#167524] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn ? "Max Capacity" : "Lotação Máxima"}
                </label>
                <input
                  type="number"
                  value={formData.vagas_totais}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vagas_totais: Number(e.target.value),
                    })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn ? "Spoken Languages" : "Línguas Faladas"}
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

              {/* LOCALIZAÇÃO E MAPA */}
              <div className="md:col-span-2 border-t border-slate-100 pt-8 mt-2">
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
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
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
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
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

                <div className="mb-4">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {isEn ? "Address / Location *" : "Morada ou Localização *"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
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
                      className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524]"
                    />
                    <button
                      type="button"
                      onClick={buscarNoMapaManual}
                      className="bg-slate-900 text-white font-black text-xs uppercase tracking-widest px-5 rounded-xl cursor-pointer"
                    >
                      {isEn ? "Locate" : "Localizar"}
                    </button>
                  </div>

                  {addressSuggestions.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl mt-2 shadow-lg overflow-hidden">
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

                <div className="w-full h-56 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={mapIframeUrl}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PASSO 2: CALENDÁRIO, PREÇOS E ALOJAMENTO */}
        {/* ========================================== */}
        {step === 2 && (
          <div className="space-y-10">
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span>📅</span>{" "}
                {isEn
                  ? "1. Operating Calendar *"
                  : "1. Calendário de Funcionamento *"}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    {isEn ? "Opening Date" : "Data de Início"}
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
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    {isEn ? "Closing Date" : "Data de Fim"}
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
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {isEn ? "Active Days" : "Dias da Semana Ativos"}
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
                            : "bg-slate-50 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isEn ? dia.en : dia.pt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2">
                  {isEn
                    ? "Closed Days (Exceptions)"
                    : "Dias de Encerramento (Exceções / Esgotado)"}
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="date"
                    value={novoDiaFechado}
                    onChange={(e) => setNovoDiaFechado(e.target.value)}
                    className="flex-1 p-3 bg-white border border-amber-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={adicionarDiaFechado}
                    className="bg-amber-600 text-white font-bold px-4 rounded-lg text-xs cursor-pointer"
                  >
                    Bloquear Data
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
                          <span className="line-through">
                            {new Date(dia).toLocaleDateString("pt-PT")}
                          </span>
                          <button
                            type="button"
                            onClick={() => removerDiaFechado(dia)}
                            className="text-red-500 font-black cursor-pointer"
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

            {/* 2. PACOTES E PREÇOS */}
            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-start mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
                    <span>💶</span>{" "}
                    {isEn
                      ? "2. Pricing & Packages *"
                      : "2. Pacotes e Tabela de Preços *"}
                  </h2>
                  <p className="text-xs text-slate-500 m-0">
                    {isEn
                      ? "Manage your packages and price options."
                      : "Gira os seus pacotes de inscrição e opções de preço."}
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
                  className="bg-[#167524] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm cursor-pointer"
                >
                  + {isEn ? "Add Pricing Package" : "Adicionar Preço / Pacote"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.pacotes.map((pacote, idx) => (
                  <div
                    key={idx}
                    className="bg-white border-2 border-slate-100 rounded-2xl p-5 relative shadow-sm"
                  >
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNovoPacote(pacote);
                          setIsPacoteModalOpen(true);
                        }}
                        className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs hover:bg-[#167524] hover:text-white cursor-pointer"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarPacote(pacote.id)}
                        className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xs cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="inline-block px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded mb-2">
                      {pacote.tipo === "semana"
                        ? `${pacote.quantidade} Semana(s)`
                        : `${pacote.quantidade} Dia(s)`}
                    </div>
                    <h3 className="text-base font-black text-slate-900 mb-3 pr-16">
                      {pacote.titulo}
                    </h3>
                    <div className="space-y-1.5">
                      {pacote.variantes.map((v: Variante, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100"
                        >
                          <span className="text-[11px] font-bold text-slate-600">
                            {v.nome}
                          </span>
                          <span className="text-sm font-black text-[#167524]">
                            {v.preco}€
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. OPÇÕES DE ALOJAMENTO EXTRA */}
            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-start mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
                    <span>🛏️</span>{" "}
                    {isEn
                      ? "3. Accommodation Options"
                      : "3. Opções de Alojamento (Extras no Checkout)"}
                  </h2>
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
                  className="bg-[#0E3A68] text-white font-bold text-xs px-5 py-3 rounded-xl cursor-pointer"
                >
                  + {isEn ? "Add Accommodation" : "Adicionar Alojamento"}
                </button>
              </div>

              {formData.opcoes_alojamento.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.opcoes_alojamento.map((aloj) => (
                    <div
                      key={aloj.id}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-2xl"
                    >
                      <div>
                        <p className="text-xs font-black text-slate-900 m-0">
                          {aloj.nome}
                        </p>
                        <span className="text-xs font-black text-[#167524]">
                          {aloj.preco}€ / {aloj.tipo}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setNovoAlojamento(aloj);
                            setIsAlojamentoModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-full bg-white border border-slate-200 text-xs cursor-pointer"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarAlojamento(aloj.id)}
                          className="w-8 h-8 rounded-full bg-red-50 text-red-500 font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. SUPLEMENTOS E DESCONTOS */}
            <div className="pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Preço Seguro Opcional (€)
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
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold mb-3"
                />
                <select
                  value={formData.tipo_extra_seguro}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo_extra_seguro: e.target.value,
                    })
                  }
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm"
                >
                  <option value="fixo">Taxa Fixa Única</option>
                  <option value="diario">Por Semana / Dia</option>
                </select>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Preço Transporte / Transfer (€)
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
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold mb-3"
                />
                <select
                  value={formData.tipo_extra_transporte}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo_extra_transporte: e.target.value,
                    })
                  }
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm"
                >
                  <option value="diario">Por Semana / Dia</option>
                  <option value="fixo">Taxa Fixa Ida/Volta</option>
                </select>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-slate-900 m-0">
                  ✨ {isEn ? "Discounts" : "Regras de Desconto"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDescontoModalOpen(true)}
                  className="bg-[#167524]/10 text-[#167524] font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                >
                  + {isEn ? "Add Discount" : "Novo Desconto"}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.descontos.map((desc) => (
                  <div
                    key={desc.id}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-2xl"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-800 m-0">
                        {desc.nome}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase m-0 mt-1">
                        {desc.percentagem}% •{" "}
                        {desc.acumulavel ? "Acumulável" : "Único"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarDesconto(desc.id)}
                      className="text-red-500 font-black cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PASSO 3: DESCRIÇÃO, FOTOS, PDFs E PERGUNTAS */}
        {/* ========================================== */}
        {step === 3 && (
          <div className="space-y-10">
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <span>📸</span>{" "}
                {isEn
                  ? "1. Description, Logistics & Media"
                  : "1. Apresentação Editorial, Fotografias e PDFs"}
              </h2>

              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {isEn ? "Full Description *" : "Descrição Completa *"}
              </label>
              <textarea
                rows={5}
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#167524] resize-none leading-relaxed"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 mt-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Rácio de Monitores
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
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Alimentação
                  </label>
                  <input
                    type="text"
                    value={formData.alimentacao}
                    onChange={(e) =>
                      setFormData({ ...formData, alimentacao: e.target.value })
                    }
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Alojamento
                  </label>
                  <input
                    type="text"
                    value={formData.alojamento}
                    onChange={(e) =>
                      setFormData({ ...formData, alojamento: e.target.value })
                    }
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                    Seguros
                  </label>
                  <input
                    type="text"
                    value={formData.seguro}
                    onChange={(e) =>
                      setFormData({ ...formData, seguro: e.target.value })
                    }
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-sm"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Regras e Termos Específicos
                </label>
                <textarea
                  rows={3}
                  value={formData.regras_termos}
                  onChange={(e) =>
                    setFormData({ ...formData, regras_termos: e.target.value })
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#167524]"
                />
              </div>

              {/* GALERIA DE FOTOS */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-widest m-0">
                      Galeria de Fotografias *
                    </label>
                    <p className="text-[11px] text-slate-500 m-0 mt-1">
                      Clique numa foto para a definir como Capa (⭐) ou remover.
                    </p>
                  </div>
                  <label className="bg-[#167524] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer">
                    + Adicionar Fotos
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {galeria.map((img) => (
                    <div
                      key={img.id}
                      className={`relative rounded-xl overflow-hidden aspect-square border-4 group ${
                        img.isCapa
                          ? "border-[#167524] shadow-lg"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={img.previewUrl}
                        alt="Camp"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        {!img.isCapa && (
                          <button
                            type="button"
                            onClick={() => setComoCapa(img.id)}
                            className="bg-white text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            Definir Capa ⭐
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removerImagem(img.id)}
                          className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          Apagar 🗑️
                        </button>
                      </div>
                      {img.isCapa && (
                        <div className="absolute top-2 left-2 bg-[#167524] text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                          Capa ⭐
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECÇÃO DE UPLOAD DE PDF / ITINERÁRIO (FALTAVA NO PORTAL DO PARCEIRO!) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-widest m-0">
                      📄{" "}
                      {isEn
                        ? "Program Brochure / Itinerary (PDF)"
                        : "Brochuras e Programa Detalhado (PDF)"}
                    </label>
                    <p className="text-[11px] text-slate-500 m-0 mt-1">
                      {isEn
                        ? "Available for parents to download on the camp page."
                        : "Disponíveis para os pais descarregarem na página do seu campo."}
                    </p>
                  </div>
                  <label className="bg-white border border-slate-300 text-slate-800 text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer hover:bg-slate-100">
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

                <div className="space-y-2">
                  {documentosExistentes.map((doc, idx) => (
                    <div
                      key={`exist-${idx}`}
                      className="flex justify-between items-center bg-white px-4 py-3 rounded-xl border border-slate-200"
                    >
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#0E3A68] hover:underline truncate"
                      >
                        📄 {doc.nome}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeDocExistente(idx)}
                        className="text-red-500 font-black cursor-pointer ml-3"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {documentos.map((doc, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="flex justify-between items-center bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200"
                    >
                      <span className="text-xs font-bold text-emerald-900 truncate">
                        📄 {doc.name} (Novo)
                      </span>
                      <button
                        type="button"
                        onClick={() => removeNovoDoc(idx)}
                        className="text-red-500 font-black cursor-pointer ml-3"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. PERGUNTAS PERSONALIZADAS */}
            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-black text-slate-900 m-0">
                    📋{" "}
                    {isEn
                      ? "2. Registration Questions"
                      : "2. Opções e Perguntas de Inscrição"}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => adicionarPergunta("texto")}
                    className="text-[10px] font-black uppercase tracking-widest text-[#167524] bg-[#167524]/10 px-3 py-2.5 rounded-xl cursor-pointer"
                  >
                    + Pergunta Aberta
                  </button>
                  <button
                    type="button"
                    onClick={() => adicionarPergunta("escolha")}
                    className="text-[10px] font-black uppercase tracking-widest text-white bg-[#167524] px-3 py-2.5 rounded-xl cursor-pointer"
                  >
                    + Opção Múltipla
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {formData.perguntasUI.map((p) => (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl border relative ${
                      p.tipo === "escolha"
                        ? "bg-emerald-50/30 border-emerald-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => removerPergunta(p.id)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-50 text-red-500 font-bold cursor-pointer"
                    >
                      ×
                    </button>
                    <div className="pr-10 mb-3">
                      <input
                        type="text"
                        value={p.titulo}
                        onChange={(e) =>
                          atualizarPergunta(p.id, "titulo", e.target.value)
                        }
                        placeholder="Título da pergunta ou opção..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                      />
                    </div>
                    {p.tipo === "escolha" && (
                      <input
                        type="text"
                        value={p.opcoes}
                        onChange={(e) =>
                          atualizarPergunta(p.id, "opcoes", e.target.value)
                        }
                        placeholder="Opções separadas por vírgula..."
                        className="w-full p-3 bg-white border border-emerald-200 rounded-xl text-sm font-bold"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTÕES INFERIORES */}
      <div className="flex justify-between items-center px-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="px-6 py-3 font-bold text-slate-600 bg-white rounded-xl border border-slate-200 cursor-pointer"
          >
            &larr; {isEn ? "Previous Step" : "Passo Anterior"}
          </button>
        ) : (
          <div />
        )}

        <div className="flex gap-3">
          {step < 3 && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="bg-slate-900 text-white font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-widest cursor-pointer"
            >
              {isEn ? "Next Step" : "Próximo Passo"} &rarr;
            </button>
          )}
          <button
            type="button"
            onClick={handleGravarCampo}
            disabled={saving}
            className="bg-[#167524] text-white font-black px-8 py-3.5 rounded-xl shadow-lg hover:bg-[#115a1b] disabled:opacity-50 uppercase tracking-widest text-xs cursor-pointer"
          >
            {saving
              ? statusText || (isEn ? "Saving..." : "A Guardar...")
              : isEn
              ? "✓ Save Changes"
              : "✓ Guardar Alterações"}
          </button>
        </div>
      </div>

      {/* MODAL PACOTES DE PREÇOS */}
      {isPacoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-lg m-0">
                {novoPacote.id
                  ? "Editar Pacote de Preços"
                  : "Novo Pacote de Preços"}
              </h3>
              <button
                type="button"
                onClick={() => setIsPacoteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-black cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              <div className="flex bg-slate-100 p-1.5 rounded-xl">
                <button
                  type="button"
                  onClick={() =>
                    setNovoPacote({ ...novoPacote, tipo: "semana" })
                  }
                  className={`flex-1 py-3 rounded-lg text-xs font-black cursor-pointer ${
                    novoPacote.tipo === "semana"
                      ? "bg-white text-[#167524] shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Semanas Completas
                </button>
                <button
                  type="button"
                  onClick={() => setNovoPacote({ ...novoPacote, tipo: "dia" })}
                  className={`flex-1 py-3 rounded-lg text-xs font-black cursor-pointer ${
                    novoPacote.tipo === "dia"
                      ? "bg-white text-[#167524] shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  Dias Avulso / Pack de Dias
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Nome do Pacote / Inscrição *
                  </label>
                  <input
                    type="text"
                    value={novoPacote.titulo}
                    onChange={(e) =>
                      setNovoPacote({ ...novoPacote, titulo: e.target.value })
                    }
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Duração ({novoPacote.tipo === "semana" ? "Sem" : "Dias"})
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
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black text-[#167524] bg-slate-50 text-center"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-black text-slate-900 m-0">
                    Opções de Preço (€)
                  </label>
                  <button
                    type="button"
                    onClick={adicionarVariante}
                    className="text-[10px] font-black uppercase tracking-widest text-[#167524] bg-[#167524]/10 px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    + Adicionar Opção de Preço
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {novoPacote.variantes.map((v, i) => (
                    <div
                      key={i}
                      className="flex gap-2 items-center bg-white border border-slate-200 p-2 rounded-xl"
                    >
                      <input
                        type="text"
                        placeholder="Ex: Preço Base / Com Almoço"
                        value={v.nome}
                        onChange={(e) =>
                          atualizarVariante(i, "nome", e.target.value)
                        }
                        className="flex-1 p-2 text-sm font-bold outline-none bg-transparent"
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
                          className="w-8 h-8 rounded-lg text-red-500 cursor-pointer"
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
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarPacote}
                className="px-6 py-2.5 font-black text-white bg-[#167524] rounded-xl text-sm cursor-pointer"
              >
                ✓ Guardar Preço
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
                Opção de Alojamento
              </h3>
              <button
                type="button"
                onClick={() => setIsAlojamentoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <input
                type="text"
                placeholder="Nome da opção de alojamento..."
                value={novoAlojamento.nome}
                onChange={(e) =>
                  setNovoAlojamento({ ...novoAlojamento, nome: e.target.value })
                }
                className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50"
              />
              <div className="grid grid-cols-2 gap-4">
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
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-black text-[#167524] bg-slate-50"
                />
                <select
                  value={novoAlojamento.tipo}
                  onChange={(e) =>
                    setNovoAlojamento({
                      ...novoAlojamento,
                      tipo: e.target.value as "semana" | "dia" | "fixo",
                    })
                  }
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold bg-slate-50"
                >
                  <option value="semana">Por Semana</option>
                  <option value="dia">Por Noite / Dia</option>
                  <option value="fixo">Valor Fixo</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAlojamentoModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold border border-slate-200 bg-white text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarAlojamento}
                className="px-6 py-2.5 rounded-xl font-black bg-[#0E3A68] text-white text-sm cursor-pointer"
              >
                ✓ Guardar
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
                Regra de Desconto
              </h3>
              <button
                type="button"
                onClick={() => setIsDescontoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4 bg-slate-50">
              <input
                type="text"
                placeholder="Ex: Desconto Irmãos"
                value={novoDesconto.nome}
                onChange={(e) =>
                  setNovoDesconto({ ...novoDesconto, nome: e.target.value })
                }
                className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold bg-white"
              />
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
                className="w-full p-3.5 border border-slate-200 rounded-xl text-base font-black text-[#167524] bg-white"
              />
              <label className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 cursor-pointer">
                <span className="text-sm font-black text-slate-900">
                  É Acumulável?
                </span>
                <input
                  type="checkbox"
                  checked={novoDesconto.acumulavel}
                  onChange={(e) =>
                    setNovoDesconto({
                      ...novoDesconto,
                      acumulavel: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-[#167524]"
                />
              </label>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDescontoModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold border border-slate-200 bg-white text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarDesconto}
                className="px-6 py-2.5 rounded-xl font-black bg-[#167524] text-white text-sm cursor-pointer"
              >
                ✓ Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
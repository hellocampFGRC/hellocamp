"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Variante {
  nome: string;
  nome_en?: string;
  preco: number;
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

interface ImagePreview {
  file?: File;
  preview: string;
  url: string;
  isMain: boolean;
}

const CATEGORIAS = [
  "Desporto",
  "Aventura & Natureza",
  "Tecnologia & Ciência",
  "Artes & Criatividade",
  "Línguas",
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
  { pt: "França", en: "France" },
  { pt: "Reino Unido", en: "United Kingdom" },
  { pt: "Alemanha", en: "Germany" },
  { pt: "Itália", en: "Italy" },
  { pt: "Estados Unidos", en: "United States" },
];

const DIAS_SEMANA = [
  { id: 1, pt: "Seg" },
  { id: 2, pt: "Ter" },
  { id: 3, pt: "Qua" },
  { id: 4, pt: "Qui" },
  { id: 5, pt: "Sex" },
  { id: 6, pt: "Sáb" },
  { id: 0, pt: "Dom" },
];

const sanitizeFileName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_");

export default function SuperAdminEditarOuCriarCampo({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const parceiroPreSelecionado = searchParams.get("parceiro") || "";

  const isNovo = id === "novo";

  const [loading, setLoading] = useState(!isNovo);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [parceirosLista, setParceirosLista] = useState<any[]>([]);
  const [organizadorId, setOrganizadorId] = useState<string>(
    parceiroPreSelecionado
  );
  const [statusContratoGlobal, setStatusContratoGlobal] = useState<
    string | null
  >(null);

  const [images, setImages] = useState<ImagePreview[]>([]);
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [documentosExistentes, setDocumentosExistentes] = useState<
    { nome: string; url: string }[]
  >([]);
  const [contratoFile, setContratoFile] = useState<File | null>(null);

  const [mapPreview, setMapPreview] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [pais, setPais] = useState("Portugal");
  const [linguas, setLinguas] = useState({
    pt: true,
    en: false,
    es: false,
    fr: false,
    de: false,
  });

  // Modais de Pacotes, Alojamento e Descontos
  const [isPacoteModalOpen, setIsPacoteModalOpen] = useState(false);
  const [novoPacote, setNovoPacote] = useState<Pacote>({
    id: "",
    titulo: "",
    tipo: "semana",
    quantidade: 1,
    variantes: [{ nome: "Preço Base", preco: 150 }],
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
  const [novoDiaFechado, setNovoDiaFechado] = useState("");

  const [formData, setFormData] = useState({
    nome: "",
    categoria: "Desporto",
    local: "",
    Distrito: "Lisboa",
    idade_min: 6,
    idade_max: 16,
    vagas_totais: 40,
    racio_monitores: "1 monitor para cada 10 participantes",
    alimentacao: "Almoço e lanches incluídos",
    alojamento: "Atividades diurnas (Sem dormida)",
    seguro: "Seguro de Acidentes Pessoais e Responsabilidade Civil Ativo",
    descricao: "",
    regras_termos: "",
    extra_seguro: 0,
    tipo_extra_seguro: "fixo",
    extra_transporte: 0,
    tipo_extra_transporte: "diario",
    taxa_matricula: 0,
    taxa_material: 0,
    taxa_comissao: "",
    base_comissao: "",
    contrato_parceiro_url: "aprovado_superadmin_hq",
    status_aprovacao: "Aprovado",
    modalidade_reserva: "direta",
    link_externo_reserva: "",
    tipo_pagamento: "100_total",
    politica_cancelamento: "Flexível (Reembolso a 100% até 7 dias antes)",
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
  });

  useEffect(() => {
    const carregarTudo = async () => {
      const { data: perfis } = await supabase
        .from("perfis")
        .select(
          "id, empresa_nome, nome_completo, email, status_contrato, taxa_comissao, base_comissao, modalidade_reserva, link_externo_reserva"
        )
        .eq("role", "organizador")
        .order("empresa_nome", { ascending: true });

      setParceirosLista(perfis || []);

      if (isNovo) {
        if (parceiroPreSelecionado && perfis) {
          const p = perfis.find((x) => x.id === parceiroPreSelecionado);
          if (p) {
            setStatusContratoGlobal(p.status_contrato);
            setFormData((prev) => ({
              ...prev,
              modalidade_reserva: p.modalidade_reserva || "direta",
              link_externo_reserva: p.link_externo_reserva || "",
            }));
          }
        }
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("campos")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("Campo não encontrado.");
        router.push(`/${lang}/superadmin/campos`);
        return;
      }

      setOrganizadorId(data.organizador_id || "");
      if (data.organizador_id && perfis) {
        const org = perfis.find((x) => x.id === data.organizador_id);
        setStatusContratoGlobal(org?.status_contrato || null);
      }

      setPais(data.pais || "Portugal");
      if (data.latitude && data.longitude) {
        setMapPreview({
          lat: Number(data.latitude),
          lon: Number(data.longitude),
        });
      }

      const strLing = String(data.linguas_faladas || "Português").toLowerCase();
      setLinguas({
        pt: strLing.includes("portugu"),
        en: strLing.includes("ingl") || strLing.includes("engl"),
        es: strLing.includes("espanh") || strLing.includes("span"),
        fr: strLing.includes("franc") || strLing.includes("fren"),
        de: strLing.includes("alem") || strLing.includes("germ"),
      });

      const imgs: ImagePreview[] = [];
      const vistas = new Set<string>();
      if (data.imagem) {
        imgs.push({ preview: data.imagem, url: data.imagem, isMain: true });
        vistas.add(data.imagem);
      }
      if (Array.isArray(data.galeria)) {
        data.galeria.forEach((u: string) => {
          if (u && !vistas.has(u)) {
            imgs.push({ preview: u, url: u, isMain: imgs.length === 0 });
            vistas.add(u);
          }
        });
      }
      setImages(imgs);

      if (Array.isArray(data.programas_pdf)) {
        setDocumentosExistentes(data.programas_pdf);
      }

      const pergReconstruidas: PerguntaUI[] = [];
      if (Array.isArray(data.perguntas_customizadas)) {
        data.perguntas_customizadas.forEach((raw: string, i: number) => {
          if (raw.startsWith("ESCOLHA|")) {
            const p = raw.split("|");
            pergReconstruidas.push({
              id: `p_${i}`,
              tipo: "escolha",
              titulo: p[1] || "",
              opcoes: p[2] || "",
            });
          } else {
            pergReconstruidas.push({
              id: `p_${i}`,
              tipo: "texto",
              titulo: raw.replace("TEXTO|", ""),
              opcoes: "",
            });
          }
        });
      }

      setFormData({
        nome: data.nome || "",
        categoria: data.categoria || "Desporto",
        local: data.local || "",
        Distrito: data.Distrito || "Lisboa",
        idade_min: Number(data.idade_min) || 6,
        idade_max: Number(data.idade_max) || 16,
        vagas_totais: Number(data.vagas_totais) || 30,
        racio_monitores: data.racio_monitores || "",
        alimentacao: data.alimentacao || "",
        alojamento: data.alojamento || "",
        seguro: data.seguro || "",
        descricao: data.descricao || "",
        regras_termos: data.regras_termos || "",
        extra_seguro: Number(data.extra_seguro) || 0,
        tipo_extra_seguro: data.tipo_extra_seguro || "fixo",
        extra_transporte: Number(data.extra_transporte) || 0,
        tipo_extra_transporte: data.tipo_extra_transporte || "diario",
        taxa_matricula: Number(data.taxa_matricula) || 0,
        taxa_material: Number(data.taxa_material) || 0,
        taxa_comissao:
          data.taxa_comissao !== null && data.taxa_comissao !== undefined
            ? String(data.taxa_comissao)
            : "",
        base_comissao: data.base_comissao || "",
        contrato_parceiro_url:
          data.contrato_parceiro_url || "aprovado_superadmin_hq",
        status_aprovacao: data.status_aprovacao || "Aprovado",
        modalidade_reserva: data.modalidade_reserva || "direta",
        link_externo_reserva: data.link_externo_reserva || "",
        tipo_pagamento: data.tipo_pagamento || "100_total",
        politica_cancelamento:
          data.politica_cancelamento ||
          "Flexível (Reembolso a 100% até 7 dias antes)",
        calendario_funcionamento: {
          data_inicio: data.calendario_funcionamento?.data_inicio || "",
          data_fim: data.calendario_funcionamento?.data_fim || "",
          dias_semana: Array.isArray(data.calendario_funcionamento?.dias_semana)
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
        perguntasUI: pergReconstruidas,
      });

      setLoading(false);
    };

    carregarTudo();
  }, [id, isNovo, lang, parceiroPreSelecionado, router]);

  const buscarNoMapaManual = async () => {
    if (!formData.local.trim()) return;
    try {
      const q = `${formData.local}, ${
        pais === "Portugal" && formData.Distrito ? formData.Distrito + ", " : ""
      }${pais}`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&limit=4`
      );
      const d = await res.json();
      if (Array.isArray(d) && d.length > 0) {
        setAddressSuggestions(d);
        setMapPreview({
          lat: parseFloat(d[0].lat),
          lon: parseFloat(d[0].lon),
        });
      }
    } catch {}
  };

  const handleLinguasChange = (k: keyof typeof linguas) =>
    setLinguas((prev) => ({ ...prev, [k]: !prev[k] }));

  const getLinguasString = () => {
    const mapNomes: Record<string, string> = {
      pt: "Português",
      en: "Inglês",
      es: "Espanhol",
      fr: "Francês",
      de: "Alemão",
    };
    const ativas = Object.entries(linguas)
      .filter(([_, v]) => v)
      .map(([k]) => mapNomes[k]);
    return ativas.length > 0 ? ativas.join(", ") : "Português";
  };

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
    setFormData((prev) => ({
      ...prev,
      calendario_funcionamento: {
        ...prev.calendario_funcionamento,
        dias_fechados: Array.from(
          new Set([
            ...prev.calendario_funcionamento.dias_fechados,
            novoDiaFechado,
          ])
        ),
      },
    }));
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
  const adicionarVariante = () =>
    setNovoPacote((prev) => ({
      ...prev,
      variantes: [...prev.variantes, { nome: "", preco: 0 }],
    }));

  const atualizarVariante = (i: number, campo: keyof Variante, val: any) => {
    setNovoPacote((prev) => {
      const n = [...prev.variantes];
      n[i] = { ...n[i], [campo]: val };
      return { ...prev, variantes: n };
    });
  };

  const removerVariante = (i: number) =>
    setNovoPacote((prev) => ({
      ...prev,
      variantes: prev.variantes.filter((_, idx) => idx !== i),
    }));

  const guardarPacote = () => {
    if (!novoPacote.titulo.trim()) return alert("Indique o nome do pacote.");
    const pacFinal: Pacote = {
      ...novoPacote,
      id: novoPacote.id || `pac_${Date.now()}`,
    };
    setFormData((prev) => {
      const existe = prev.pacotes.some((p) => p.id === pacFinal.id);
      return {
        ...prev,
        pacotes: existe
          ? prev.pacotes.map((p) => (p.id === pacFinal.id ? pacFinal : p))
          : [...prev.pacotes, pacFinal],
      };
    });
    setNovoPacote({
      id: "",
      titulo: "",
      tipo: "semana",
      quantidade: 1,
      variantes: [{ nome: "Preço Base", preco: 150 }],
    });
    setIsPacoteModalOpen(false);
  };

  const eliminarPacote = (idPac: string) =>
    setFormData((prev) => ({
      ...prev,
      pacotes: prev.pacotes.filter((p) => p.id !== idPac),
    }));

  const guardarDesconto = () => {
    if (!novoDesconto.nome.trim()) return;
    setFormData((prev) => ({
      ...prev,
      descontos: [
        ...prev.descontos,
        { ...novoDesconto, id: `desc_${Date.now()}` },
      ],
    }));
    setNovoDesconto({ id: "", nome: "", percentagem: 10, acumulavel: false });
    setIsDescontoModalOpen(false);
  };

  const eliminarDesconto = (idDesc: string) =>
    setFormData((prev) => ({
      ...prev,
      descontos: prev.descontos.filter((d) => d.id !== idDesc),
    }));

  // Imagens e PDFs
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const novas: ImagePreview[] = files.map((file, idx) => ({
      file,
      preview: URL.createObjectURL(file),
      url: "",
      isMain: images.length === 0 && idx === 0,
    }));
    setImages((prev) => [...prev, ...novas]);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const f = prev.filter((_, i) => i !== idx);
      if (f.length > 0 && !f.some((x) => x.isMain)) f[0].isMain = true;
      return f;
    });
  };

  const setMainImage = (idx: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isMain: i === idx })));
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setDocumentos((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeDocExistente = (idx: number) =>
    setDocumentosExistentes((prev) => prev.filter((_, i) => i !== idx));

  const removeNovoDoc = (idx: number) =>
    setDocumentos((prev) => prev.filter((_, i) => i !== idx));

  const handleContratoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContratoFile(e.target.files[0]);
    }
  };

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.local.trim()) {
      alert("Preencha o Nome do Campo e a Morada/Localização.");
      return;
    }
    if (images.length === 0) {
      alert("Adicione pelo menos 1 fotografia.");
      return;
    }

    setSaving(true);
    try {
      setStatusText("A carregar imagens e PDFs...");

      const uploadedImages = await Promise.all(
        images.map(async (img) => {
          if (!img.file) return { url: img.url || img.preview, isMain: img.isMain };
          const fileName = `${Date.now()}-${sanitizeFileName(img.file.name)}`;
          const { error } = await supabase.storage
            .from("campos-imagens")
            .upload(fileName, img.file);
          if (error) throw error;
          const { data: publicUrlData } = supabase.storage
            .from("campos-imagens")
            .getPublicUrl(fileName);
          return { url: publicUrlData.publicUrl, isMain: img.isMain };
        })
      );

      const mainImageUrl =
        uploadedImages.find((i) => i.isMain)?.url || uploadedImages[0]?.url;
      const galeriaUrls = uploadedImages
        .filter((i) => !i.isMain)
        .map((i) => i.url);

      const novosDocs = await Promise.all(
        documentos.map(async (doc) => {
          const fileName = `${Date.now()}-${sanitizeFileName(doc.name)}`;
          const { error } = await supabase.storage
            .from("campos-documentos")
            .upload(fileName, doc);
          if (error) throw error;
          const { data: publicUrlData } = supabase.storage
            .from("campos-documentos")
            .getPublicUrl(fileName);
          return { nome: doc.name, url: publicUrlData.publicUrl };
        })
      );
      const programasDocsFinais = [...documentosExistentes, ...novosDocs];

      let urlContratoFinal =
        formData.contrato_parceiro_url || "aprovado_superadmin_hq";
      if (contratoFile) {
        const fileContratoName = `contrato-${Date.now()}-${sanitizeFileName(
          contratoFile.name
        )}`;
        const { error: errContrato } = await supabase.storage
          .from("campos-documentos")
          .upload(fileContratoName, contratoFile);
        if (errContrato) throw errContrato;
        urlContratoFinal = supabase.storage
          .from("campos-documentos")
          .getPublicUrl(fileContratoName).data.publicUrl;
      }

      setStatusText("A traduzir textos para Inglês (IA)...");
      const linguasFinais = getLinguasString();
      const paisEn = PAISES.find((p) => p.pt === pais)?.en || pais;

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

      const descontosFormatados = await Promise.all(
        formData.descontos.map(async (desc) => {
          const nome_en = await traduzirParaIngles(desc.nome);
          return { ...desc, nome_en };
        })
      );

      const taxaFinal =
        formData.taxa_comissao === "" ? null : Number(formData.taxa_comissao);
      const baseFinal =
        formData.base_comissao === "" ? null : formData.base_comissao;

      let precoMinimo = 0;
      if (formData.pacotes.length > 0) {
        const todosPrecos = formData.pacotes
          .flatMap((p) => p.variantes.map((v) => Number(v.preco) || 0))
          .filter((p) => p > 0);
        if (todosPrecos.length > 0) precoMinimo = Math.min(...todosPrecos);
      }

      const payload = {
        organizador_id: organizadorId || null,
        nome: formData.nome,
        nome_en,
        categoria: formData.categoria,
        categoria_en,
        local: formData.local,
        local_en,
        Distrito: pais === "Portugal" ? formData.Distrito : null,
        Distrito_en: pais === "Portugal" ? formData.Distrito : null,
        idade_min: formData.idade_min,
        idade_max: formData.idade_max,
        idade: `${formData.idade_min} aos ${formData.idade_max} anos`,
        idade_en: `${formData.idade_min} to ${formData.idade_max} years`,
        vagas_totais: formData.vagas_totais,
        racio_monitores: formData.racio_monitores,
        racio_monitores_en: formData.racio_monitores,
        alimentacao: formData.alimentacao,
        alimentacao_en,
        alojamento: formData.alojamento,
        alojamento_en,
        seguro: formData.seguro,
        seguro_en,
        descricao: formData.descricao,
        descricao_en,
        regras_termos: formData.regras_termos,
        regras_termos_en,
        perguntas_customizadas: perguntasFormatadasPT,
        perguntas_customizadas_en: perguntasFormatadasEN,
        extra_seguro: formData.extra_seguro,
        tipo_extra_seguro: formData.tipo_extra_seguro,
        extra_transporte: formData.extra_transporte,
        tipo_extra_transporte: formData.tipo_extra_transporte,
        taxa_matricula: formData.taxa_matricula,
        taxa_material: formData.taxa_material,
        preco: precoMinimo,
        pais,
        pais_en: paisEn,
        linguas_faladas: linguasFinais,
        linguas_faladas_en: linguasFinais,
        latitude: mapPreview ? mapPreview.lat : null,
        longitude: mapPreview ? mapPreview.lon : null,
        calendario_funcionamento: formData.calendario_funcionamento,
        pacotes: pacotesFormatados,
        opcoes_alojamento: formData.opcoes_alojamento,
        descontos: descontosFormatados,
        imagem: mainImageUrl,
        galeria: galeriaUrls,
        programas_pdf: programasDocsFinais,
        taxa_comissao: taxaFinal,
        base_comissao: baseFinal,
        contrato_parceiro_url: urlContratoFinal,
        status_aprovacao: formData.status_aprovacao,
        modalidade_reserva: formData.modalidade_reserva,
        link_externo_reserva: formData.link_externo_reserva,
        tipo_pagamento: formData.tipo_pagamento,
        politica_cancelamento: formData.politica_cancelamento,
        politica_cancelamento_en,
        ativo: formData.status_aprovacao === "Aprovado",
      };

      if (isNovo) {
        const { error } = await supabase.from("campos").insert([payload]);
        if (error) throw error;
        alert("Novo Campo criado e publicado com sucesso pelo SuperAdmin!");
      } else {
        const { error } = await supabase
          .from("campos")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        alert("Campo atualizado e sincronizado com sucesso!");
      }

      router.push(`/${lang}/superadmin/campos`);
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setSaving(false);
      setStatusText("");
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">
        A carregar Master HQ...
      </div>
    );
  }

  const labelClass =
    "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5";
  const inputClass =
    "w-full p-3.5 bg-slate-50 border border-slate-300 rounded-md text-sm font-bold text-slate-900 outline-none focus:border-slate-900 focus:bg-white transition-colors";

  // Helper para Dropdown Customizado (Reto e Executivo)
  const renderDropdown = (
    key: string,
    valorAtual: string,
    opcoes: { val: string; label: string }[],
    onSelect: (v: string) => void
  ) => {
    const labelSel =
      opcoes.find((o) => o.val === valorAtual)?.label ||
      valorAtual ||
      "Selecionar...";
    return (
      <div className="relative">
        <div
          onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
          className="w-full p-3.5 bg-white border border-slate-300 rounded-md text-xs font-black text-slate-900 cursor-pointer flex justify-between items-center hover:border-slate-900"
        >
          <span className="truncate">{labelSel}</span>
          <span className="text-[10px] text-slate-400 ml-2">▼</span>
        </div>
        {openDropdown === key && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpenDropdown(null)}
            />
            <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-50 max-h-60 overflow-y-auto">
              {opcoes.map((op) => (
                <div
                  key={op.val}
                  onClick={() => {
                    onSelect(op.val);
                    setOpenDropdown(null);
                  }}
                  className="p-3 text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer border-b border-slate-100 last:border-0"
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
    <main className="max-w-5xl mx-auto font-sans pb-24">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/${lang}/superadmin/campos`}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-600 bg-white px-4 py-2.5 rounded-md border border-slate-300 hover:text-slate-900 no-underline"
        >
          &larr; Voltar ao Diretório Global
        </Link>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-md cursor-pointer shadow-sm"
        >
          {saving
            ? statusText || "A Guardar..."
            : isNovo
            ? "✓ Criar e Publicar Campo"
            : "✓ Guardar Alterações"}
        </button>
      </div>

      <h1 className="text-2xl md:text-3xl font-black mb-6 text-slate-900 tracking-tight">
        {isNovo
          ? "Criar Novo Campo (SuperAdmin HQ)"
          : `Editar Campo HQ: ${formData.nome}`}
      </h1>

      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. CONTROLO DE PARCEIRO, OPERAÇÃO E CONTRATO (HQ ONLY) */}
        <div className="bg-amber-50/60 p-6 border-2 border-amber-300 rounded-md shadow-sm space-y-6">
          <h2 className="text-base font-black text-amber-950 uppercase tracking-widest border-b border-amber-200 pb-3 m-0">
            ⚡ 1. Controlo Operacional, Parceiro e Comissões (HQ)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>
                Parceiro Proprietário (Ou Vazio p/ Listagem SEO)
              </label>
              {renderDropdown(
                "parceiro_hq",
                organizadorId,
                [
                  {
                    val: "",
                    label: "-- Sem Parceiro (Listagem SEO / Direta) --",
                  },
                  ...parceirosLista.map((p) => ({
                    val: p.id,
                    label: `${p.empresa_nome || p.nome_completo || "Parceiro"} (${
                      p.email
                    })`,
                  })),
                ],
                (val) => setOrganizadorId(val)
              )}
            </div>

            <div>
              <label className={labelClass}>Estado de Publicação Online</label>
              {renderDropdown(
                "status_hq",
                formData.status_aprovacao,
                [
                  {
                    val: "Aprovado",
                    label: "✓ Aprovado & Visível nas Pesquisas",
                  },
                  {
                    val: "Pendente de Revisão",
                    label: "⏳ Pendente (Oculto do Público)",
                  },
                  { val: "Rejeitado", label: "✕ Rejeitado / Inativo" },
                ],
                (val) => setFormData({ ...formData, status_aprovacao: val })
              )}
            </div>

            <div>
              <label className={labelClass}>Taxa de Comissão (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.taxa_comissao}
                onChange={(e) =>
                  setFormData({ ...formData, taxa_comissao: e.target.value })
                }
                className={inputClass}
                placeholder="Vazio = Taxa do Parceiro (12%)"
              />
            </div>

            <div>
              <label className={labelClass}>Base de Incidência</label>
              {renderDropdown(
                "base_hq",
                formData.base_comissao,
                [
                  { val: "", label: "-- Seguir Regra do Parceiro --" },
                  {
                    val: "total",
                    label: "Sobre Valor Total (Programa + Extras)",
                  },
                  {
                    val: "apenas_programa",
                    label: "Apenas sobre Programa Base",
                  },
                  { val: "sem_comissao", label: "Isento (0%)" },
                ],
                (val) => setFormData({ ...formData, base_comissao: val })
              )}
            </div>

            <div>
              <label className={labelClass}>Modalidade de Reserva</label>
              {renderDropdown(
                "mod_hq",
                formData.modalidade_reserva,
                [
                  { val: "direta", label: "Reserva Direta (Checkout Stripe)" },
                  { val: "email", label: "Sob Consulta (E-mail)" },
                  {
                    val: "link_externo",
                    label: "Redirecionamento Link Externo / Câmara",
                  },
                ],
                (val) => setFormData({ ...formData, modalidade_reserva: val })
              )}
            </div>

            <div>
              <label className={labelClass}>Fluxo de Pagamento</label>
              {renderDropdown(
                "pag_hq",
                formData.tipo_pagamento,
                [
                  { val: "100_total", label: "100% no Ato da Reserva" },
                  {
                    val: "50_sinal",
                    label: "Sinal 50% Agora + 50% 1 Semana Antes",
                  },
                ],
                (val) => setFormData({ ...formData, tipo_pagamento: val })
              )}
            </div>

            {formData.modalidade_reserva === "link_externo" && (
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  URL Externo Oficial de Inscrição *
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.link_externo_reserva}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      link_externo_reserva: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </div>

        {/* 2. DADOS BÁSICOS E LOCALIZAÇÃO */}
        <div className="bg-white p-6 border border-slate-200 rounded-md shadow-sm space-y-6">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-3 m-0">
            2. Dados Básicos e Localização Geográfica
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className={labelClass}>Nome do Campo / Programa *</label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Categoria Principal *</label>
              {renderDropdown(
                "cat_hq",
                formData.categoria,
                CATEGORIAS.map((c) => ({ val: c, label: c })),
                (val) => setFormData({ ...formData, categoria: val })
              )}
            </div>

            <div>
              <label className={labelClass}>Política de Cancelamento</label>
              {renderDropdown(
                "pol_hq",
                formData.politica_cancelamento,
                [
                  {
                    val: "Flexível (Reembolso a 100% até 7 dias antes)",
                    label: "Flexível (100% até 7 dias antes)",
                  },
                  {
                    val: "Moderada (Reembolso a 50% até 15 dias antes)",
                    label: "Moderada (50% até 15 dias antes)",
                  },
                  {
                    val: "Estrita (Sem reembolso após reserva)",
                    label: "Estrita (Sem reembolso)",
                  },
                ],
                (val) =>
                  setFormData({ ...formData, politica_cancelamento: val })
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 sm:col-span-2">
              <div>
                <label className={labelClass}>Idade Mín.</label>
                <input
                  type="number"
                  value={formData.idade_min}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      idade_min: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Idade Máx.</label>
                <input
                  type="number"
                  value={formData.idade_max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      idade_max: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Lotação / Vagas</label>
                <input
                  type="number"
                  value={formData.vagas_totais}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vagas_totais: Number(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>País *</label>
              {renderDropdown(
                "pais_hq",
                pais,
                PAISES.map((p) => ({ val: p.pt, label: p.pt })),
                (val) => {
                  setPais(val);
                  setMapPreview(null);
                }
              )}
            </div>

            {pais === "Portugal" && (
              <div>
                <label className={labelClass}>Distrito *</label>
                {renderDropdown(
                  "dist_hq",
                  formData.Distrito,
                  DISTRITOS_PT.map((d) => ({ val: d, label: d })),
                  (val) => setFormData({ ...formData, Distrito: val })
                )}
              </div>
            )}

            <div className="sm:col-span-2">
              <label className={labelClass}>
                Morada ou Localização Específica *
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
                  className={inputClass}
                  placeholder="Rua, Praia, Parque ou Localidade..."
                />
                <button
                  type="button"
                  onClick={buscarNoMapaManual}
                  className="bg-slate-900 text-white font-black uppercase text-xs px-5 rounded-md cursor-pointer whitespace-nowrap"
                >
                  Localizar Mapa
                </button>
              </div>
              {addressSuggestions.length > 0 && (
                <div className="bg-white border border-slate-300 rounded-md mt-1 shadow-lg overflow-hidden">
                  {addressSuggestions.map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setMapPreview({
                          lat: parseFloat(s.lat),
                          lon: parseFloat(s.lon),
                        });
                        setAddressSuggestions([]);
                      }}
                      className="p-2.5 text-xs font-bold hover:bg-slate-100 cursor-pointer border-b border-slate-100"
                    >
                      📍 {s.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. CALENDÁRIO E PACOTES DE PREÇOS */}
        <div className="bg-white p-6 border border-slate-200 rounded-md shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-widest m-0">
              3. Calendário e Tabela de Preços
            </h2>
            <button
              type="button"
              onClick={() => {
                setNovoPacote({
                  id: "",
                  titulo: "",
                  tipo: "semana",
                  quantidade: 1,
                  variantes: [{ nome: "Preço Base", preco: 150 }],
                });
                setIsPacoteModalOpen(true);
              }}
              className="bg-[#167524] text-white font-black uppercase tracking-widest text-xs px-4 py-2.5 rounded-md cursor-pointer"
            >
              + Adicionar Preço / Pacote
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Data de Início</label>
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
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Data de Fim</label>
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
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {DIAS_SEMANA.map((dia) => (
              <button
                type="button"
                key={dia.id}
                onClick={() => toggleDiaSemana(dia.id)}
                className={`px-4 py-2 rounded-md border text-xs font-black cursor-pointer ${
                  formData.calendario_funcionamento.dias_semana.includes(dia.id)
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-500 border-slate-300"
                }`}
              >
                {dia.pt}
              </button>
            ))}
          </div>

          {formData.pacotes.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-md text-center text-xs font-bold text-slate-500">
              Sem pacotes configurados. Clique em &quot;+ Adicionar Preço /
              Pacote&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formData.pacotes.map((pac, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-md flex justify-between items-start"
                >
                  <div>
                    <strong className="text-sm font-black text-slate-900 block">
                      {pac.titulo} ({pac.quantidade} {pac.tipo})
                    </strong>
                    <div className="text-xs font-bold text-[#167524] mt-1">
                      {pac.variantes
                        .map((v) => `${v.nome}: ${v.preco}€`)
                        .join(" | ")}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNovoPacote(pac);
                        setIsPacoteModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-sm text-xs font-bold cursor-pointer"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarPacote(pac.id)}
                      className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-600 rounded-sm text-xs font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. DESCRIÇÃO, LOGÍSTICA, FOTOS E PDFS */}
        <div className="bg-white p-6 border border-slate-200 rounded-md shadow-sm space-y-6">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-3 m-0">
            4. Descrição, Logística, Fotografias e Brochuras PDF
          </h2>

          <div>
            <label className={labelClass}>Descrição Completa *</label>
            <textarea
              rows={5}
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Rácio Monitores</label>
              <input
                type="text"
                value={formData.racio_monitores}
                onChange={(e) =>
                  setFormData({ ...formData, racio_monitores: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Alimentação</label>
              <input
                type="text"
                value={formData.alimentacao}
                onChange={(e) =>
                  setFormData({ ...formData, alimentacao: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Alojamento</label>
              <input
                type="text"
                value={formData.alojamento}
                onChange={(e) =>
                  setFormData({ ...formData, alojamento: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Seguros</label>
              <input
                type="text"
                value={formData.seguro}
                onChange={(e) =>
                  setFormData({ ...formData, seguro: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* UPLOAD DE FOTOS */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className={labelClass}>Galeria de Fotografias *</label>
              <label className="bg-slate-900 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-md cursor-pointer">
                + Carregar Fotografias
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative h-32 rounded-md overflow-hidden border-2 ${
                    img.isMain ? "border-[#167524]" : "border-slate-200"
                  }`}
                >
                  <img
                    src={img.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 bg-red-600 text-white w-6 h-6 rounded-sm font-black text-xs cursor-pointer"
                  >
                    ×
                  </button>
                  {!img.isMain ? (
                    <button
                      type="button"
                      onClick={() => setMainImage(idx)}
                      className="absolute bottom-1.5 left-1.5 right-1.5 bg-slate-900/80 text-white text-[10px] font-black uppercase py-1 rounded-sm cursor-pointer"
                    >
                      Definir Capa
                    </button>
                  ) : (
                    <span className="absolute bottom-1.5 left-1.5 bg-[#167524] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-sm">
                      Capa Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* UPLOAD DE PDF */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <label className={labelClass}>Brochuras / Horário (PDF)</label>
              <label className="bg-slate-100 border border-slate-300 text-slate-800 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-md cursor-pointer">
                + Anexar PDF
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
                  key={idx}
                  className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold"
                >
                  <span>📄 {doc.nome}</span>
                  <button
                    type="button"
                    onClick={() => removeDocExistente(idx)}
                    className="text-red-600 font-black cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
              {documentos.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-bold"
                >
                  <span>📄 {doc.name} (Novo)</span>
                  <button
                    type="button"
                    onClick={() => removeNovoDoc(idx)}
                    className="text-red-600 font-black cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs rounded-md shadow-md cursor-pointer"
        >
          {saving
            ? statusText || "A Guardar..."
            : isNovo
            ? "✓ Criar e Publicar Campo"
            : "✓ Guardar Alterações e Sincronizar"}
        </button>
      </form>

      {/* MODAL DE PREÇOS / PACOTES */}
      {isPacoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-md border border-slate-300 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-900 text-base m-0">
                Configurar Pacote de Preços
              </h3>
              <button
                type="button"
                onClick={() => setIsPacoteModalOpen(false)}
                className="w-7 h-7 rounded-sm bg-white border border-slate-300 font-black cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setNovoPacote({ ...novoPacote, tipo: "semana" })
                  }
                  className={`py-2.5 rounded-md font-black text-xs uppercase cursor-pointer border ${
                    novoPacote.tipo === "semana"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50 text-slate-600 border-slate-300"
                  }`}
                >
                  Semanas
                </button>
                <button
                  type="button"
                  onClick={() => setNovoPacote({ ...novoPacote, tipo: "dia" })}
                  className={`py-2.5 rounded-md font-black text-xs uppercase cursor-pointer border ${
                    novoPacote.tipo === "dia"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50 text-slate-600 border-slate-300"
                  }`}
                >
                  Dias Avulso
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={labelClass}>Nome do Pacote *</label>
                  <input
                    type="text"
                    value={novoPacote.titulo}
                    onChange={(e) =>
                      setNovoPacote({ ...novoPacote, titulo: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Ex: 1 Semana"
                  />
                </div>
                <div>
                  <label className={labelClass}>Quantidade</label>
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
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black uppercase text-slate-700">
                    Opções de Preço (€)
                  </span>
                  <button
                    type="button"
                    onClick={adicionarVariante}
                    className="text-[10px] font-black uppercase bg-emerald-50 text-[#167524] border border-emerald-200 px-3 py-1 rounded-sm cursor-pointer"
                  >
                    + Opção de Preço
                  </button>
                </div>
                <div className="space-y-2">
                  {novoPacote.variantes.map((v, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={v.nome}
                        onChange={(e) =>
                          atualizarVariante(i, "nome", e.target.value)
                        }
                        placeholder="Preço Base"
                        className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold"
                      />
                      <input
                        type="number"
                        min="0"
                        value={v.preco}
                        onChange={(e) =>
                          atualizarVariante(i, "preco", Number(e.target.value))
                        }
                        className="w-28 p-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-black text-[#167524]"
                      />
                      {novoPacote.variantes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerVariante(i)}
                          className="px-3 bg-red-50 text-red-600 border border-red-200 rounded-md font-black cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPacoteModalOpen(false)}
                className="px-4 py-2 rounded-md border border-slate-300 bg-white text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarPacote}
                className="px-6 py-2 rounded-md bg-[#167524] text-white text-xs font-black uppercase cursor-pointer"
              >
                Guardar Preço
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
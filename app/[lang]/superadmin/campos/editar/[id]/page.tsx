"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import imageCompression from 'browser-image-compression';
import React from "react";

// ==========================================
// 1. TIPAGEM E DADOS DE REFERÊNCIA
// ==========================================
type ImagePreview = { file?: File; url?: string; preview: string; isMain: boolean; };
interface Variante { nome: string; preco: number; }
interface Pacote { id: string; titulo: string; tipo: 'semana' | 'dia'; quantidade: number; variantes: Variante[]; }
interface Desconto { id: string; nome: string; percentagem: number; acumulavel: boolean; }

const FOTOS_PADRAO = [
  { url: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1200&auto=format&fit=crop", nome: "Surf" },
  { url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1200&auto=format&fit=crop", nome: "Tendas" },
  { url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop", nome: "Tech" },
  { url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1200&auto=format&fit=crop", nome: "Artes" },
  { url: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop", nome: "Desporto" },
  { url: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?q=80&w=1200&auto=format&fit=crop", nome: "Diversão" }
];

const DIAS_SEMANA = [
  { id: 1, pt: 'Seg' }, { id: 2, pt: 'Ter' }, { id: 3, pt: 'Qua' }, 
  { id: 4, pt: 'Qui' }, { id: 5, pt: 'Sex' }, { id: 6, pt: 'Sáb' }, { id: 0, pt: 'Dom' }
];

const sanitizeFileName = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-]/g, "_");

// ==========================================
// COMPONENTE PRINCIPAL SUPERADMIN HQ
// ==========================================
export default function SuperAdminEditarCampo({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const resolvedParams = use(params);
  const { lang, id } = resolvedParams;
  
  const router = useRouter();
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  
  // Imagens & Documentos
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [usarFotoPadrao, setUsarFotoPadrao] = useState(false);
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [documentosExistentes, setDocumentosExistentes] = useState<{nome: string, url: string}[]>([]);
  const [contratoFile, setContratoFile] = useState<File | null>(null);
  
  // Localização
  const [mapPreview, setMapPreview] = useState<{lat: number, lon: number} | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [pais, setPais] = useState("Portugal");
  const [linguas, setLinguas] = useState({ pt: false, en: false, es: false, fr: false, de: false });

  // Arrays Complexos (Totalmente Editáveis)
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [descontos, setDescontos] = useState<Desconto[]>([]);
  const [perguntas, setPerguntas] = useState<string[]>([]);

  // Estados dos Modais de Edição
  const [isPacoteModalOpen, setIsPacoteModalOpen] = useState(false);
  const [novoPacote, setNovoPacote] = useState<Pacote>({ id: "", titulo: "", tipo: "semana", quantidade: 1, variantes: [{ nome: "Bilhete Base", preco: 0 }] });

  const [isDescontoModalOpen, setIsDescontoModalOpen] = useState(false);
  const [novoDesconto, setNovoDesconto] = useState<Desconto>({ id: "", nome: "", percentagem: 10, acumulavel: false });

  // DADOS GERAIS
  const [formData, setFormData] = useState({
    nome: "", categoria: "", local: "", Distrito: "", 
    idade_min: 6, idade_max: 14, vagas_totais: 50,
    racio_monitores: "", alimentacao: "", alojamento: "", seguro: "", 
    descricao: "", regras_termos: "",
    
    // Extras Opcionais Financeiros
    extra_seguro: 0, tipo_extra_seguro: "fixo", 
    extra_transporte: 0, tipo_extra_transporte: "diario",
    
    // HQ Specifics
    taxa_comissao: "", base_comissao: "", contrato_parceiro_url: "",
    status_aprovacao: "Pendente de Revisão", 
    modalidade_reserva: "direta", link_externo_reserva: "",
    tipo_pagamento: "100_total", politica_cancelamento: "Moderada (Reembolso a 50% até 15 dias antes)",
    calendario_funcionamento: { data_inicio: "", data_fim: "", dias_semana: [1, 2, 3, 4, 5] }
  });

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];
  const paises = [{ pt: "Portugal", en: "Portugal" }, { pt: "Espanha", en: "Spain" }, { pt: "França", en: "France" }, { pt: "Reino Unido", en: "United Kingdom" }, { pt: "Brasil", en: "Brazil" }, { pt: "Estados Unidos", en: "United States" }, { pt: "Outro", en: "Other" }];

  // ==========================================
  // CARREGAR DADOS DO CAMPO
  // ==========================================
  useEffect(() => {
    const fetchCampo = async () => {
      const { data, error } = await supabase.from('campos').select('*').eq('id', id).single();
      if (data) {
        setFormData({ 
          nome: data.nome || "",
          categoria: data.categoria || "",
          local: data.local || "",
          Distrito: data.Distrito || "",
          idade_min: data.idade_min || 6,
          idade_max: data.idade_max || 14,
          vagas_totais: data.vagas_totais || 50,
          racio_monitores: data.racio_monitores || "",
          alimentacao: data.alimentacao || "",
          alojamento: data.alojamento || "",
          seguro: data.seguro || "",
          descricao: data.descricao || "",
          regras_termos: data.regras_termos || "",
          extra_seguro: data.extra_seguro || 0,
          tipo_extra_seguro: data.tipo_extra_seguro || 'fixo',
          extra_transporte: data.extra_transporte || 0,
          tipo_extra_transporte: data.tipo_extra_transporte || 'diario',
          taxa_comissao: data.taxa_comissao || '', 
          base_comissao: data.base_comissao || '', 
          contrato_parceiro_url: data.contrato_parceiro_url || '',
          modalidade_reserva: data.modalidade_reserva || 'direta',
          link_externo_reserva: data.link_externo_reserva || '',
          tipo_pagamento: data.tipo_pagamento || '100_total',
          politica_cancelamento: data.politica_cancelamento || 'Moderada (Reembolso a 50% até 15 dias antes)',
          calendario_funcionamento: data.calendario_funcionamento || { data_inicio: "", data_fim: "", dias_semana: [1, 2, 3, 4, 5] },
          status_aprovacao: data.status_aprovacao || 'Pendente de Revisão',
        });
        
        setPacotes(data.pacotes || []);
        setDescontos(data.descontos || []);
        setPerguntas(data.perguntas_customizadas || []);

        if (data.pais) setPais(data.pais);
        if (data.latitude && data.longitude) setMapPreview({ lat: data.latitude, lon: data.longitude });
        if (data.linguas_faladas) {
          setLinguas({ pt: data.linguas_faladas.includes("Português"), en: data.linguas_faladas.includes("Inglês"), es: data.linguas_faladas.includes("Espanhol"), fr: data.linguas_faladas.includes("Francês"), de: data.linguas_faladas.includes("Alemão") });
        }
        const loadedImages: ImagePreview[] = [];
        if (data.imagem) loadedImages.push({ url: data.imagem, preview: data.imagem, isMain: true });
        if (data.galeria && Array.isArray(data.galeria)) data.galeria.forEach((url: string) => loadedImages.push({ url, preview: url, isMain: false }));
        setImages(loadedImages);
        if (data.programas_pdf && Array.isArray(data.programas_pdf)) setDocumentosExistentes(data.programas_pdf);
      }
      setLoading(false);
    };
    fetchCampo();
  }, [id]);

  // ==========================================
  // HANDLERS LOCAIS (FOTOS E DOCS)
  // ==========================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file, index) => ({ file, preview: URL.createObjectURL(file), isMain: images.length === 0 && index === 0 }));
      setImages(prev => [...prev, ...newImages]);
      setUsarFotoPadrao(false);
    }
  };

  const selecionarFotoPadrao = (url: string) => { setImages([{ url, preview: url, isMain: true }]); setUsarFotoPadrao(true); };
  const removeImage = (indexToRemove: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, idx) => idx !== indexToRemove);
      if (prev[indexToRemove].isMain && newImages.length > 0) newImages[0].isMain = true;
      if (newImages.length === 0) setUsarFotoPadrao(false);
      return newImages;
    });
  };
  const setMainImage = (indexToMain: number) => setImages(prev => prev.map((img, idx) => ({ ...img, isMain: idx === indexToMain })));

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setDocumentos(prev => [...prev, ...Array.from(e.target.files as FileList)]); };
  const removeNovoDoc = (indexToRemove: number) => setDocumentos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  const removeDocExistente = (indexToRemove: number) => setDocumentosExistentes(prev => prev.filter((_, idx) => idx !== indexToRemove));

  const handleContratoSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) setContratoFile(e.target.files[0]); };

  const handleLinguasChange = (langKey: keyof typeof linguas) => setLinguas(prev => ({ ...prev, [langKey]: !prev[langKey] }));
  const getLinguasString = () => {
    const ativas = [];
    if (linguas.pt) ativas.push("Português"); if (linguas.en) ativas.push("Inglês"); if (linguas.es) ativas.push("Espanhol"); if (linguas.fr) ativas.push("Francês"); if (linguas.de) ativas.push("Alemão");
    return ativas.join(", ");
  };

  const toggleDiaSemana = (diaId: number) => {
    const dias = formData.calendario_funcionamento.dias_semana.includes(diaId)
      ? formData.calendario_funcionamento.dias_semana.filter((d: number) => d !== diaId)
      : [...formData.calendario_funcionamento.dias_semana, diaId].sort();
    setFormData({ ...formData, calendario_funcionamento: { ...formData.calendario_funcionamento, dias_semana: dias } });
  };

  // Perguntas Custom
  const addPergunta = () => setPerguntas([...perguntas, ""]);
  const removePergunta = (index: number) => setPerguntas(perguntas.filter((_, i) => i !== index));
  const updatePergunta = (index: number, value: string) => setPerguntas(perguntas.map((p, i) => i === index ? value : p));

  // ==========================================
  // HANDLERS: PACOTES (TOTALMENTE EDITÁVEIS HQ)
  // ==========================================
  const atualizarVariante = (index: number, campo: 'nome' | 'preco', valor: string | number) => {
    const novasVariantes = [...novoPacote.variantes];
    novasVariantes[index] = { ...novasVariantes[index], [campo]: valor } as Variante;
    setNovoPacote({ ...novoPacote, variantes: novasVariantes });
  };

  const adicionarVariante = () => {
    setNovoPacote(prev => ({ ...prev, variantes: [...prev.variantes, { nome: "", preco: 0 }] }));
  };

  const removerVariante = (index: number) => {
    setNovoPacote(prev => ({ ...prev, variantes: prev.variantes.filter((_, i) => i !== index) }));
  };

  const guardarPacote = () => {
    if (!novoPacote.titulo || novoPacote.variantes.length === 0) return alert("Preencha o título e pelo menos 1 preço.");
    const pacoteFinal: Pacote = { ...novoPacote, id: novoPacote.id || Math.random().toString(36).substring(2, 9) };
    const novosPacotes = novoPacote.id ? pacotes.map((p: Pacote) => p.id === novoPacote.id ? pacoteFinal : p) : [...pacotes, pacoteFinal];
    setPacotes(novosPacotes);
    setIsPacoteModalOpen(false);
    setNovoPacote({ id: "", titulo: "", tipo: "semana", quantidade: 1, variantes: [{ nome: "Bilhete Base", preco: 0 }] });
  };

  const eliminarPacote = (id: string) => {
    setPacotes(pacotes.filter(p => p.id !== id));
  };

  // ==========================================
  // HANDLERS: DESCONTOS (TOTALMENTE EDITÁVEIS HQ)
  // ==========================================
  const guardarDesconto = () => {
    if (!novoDesconto.nome || novoDesconto.percentagem <= 0) return alert("Preencha o nome e um valor superior a 0.");
    const descontoFinal = { ...novoDesconto, id: novoDesconto.id || Math.random().toString(36).substring(2, 9) };
    const novosDescontos = novoDesconto.id ? descontos.map((d: Desconto) => d.id === novoDesconto.id ? descontoFinal : d) : [...descontos, descontoFinal];
    setDescontos(novosDescontos);
    setIsDescontoModalOpen(false);
    setNovoDesconto({ id: "", nome: "", percentagem: 10, acumulavel: false });
  };

  const eliminarDesconto = (id: string) => {
    setDescontos(descontos.filter(d => d.id !== id));
  };

  // ==========================================
  // API GOOGLE MAPS E TRADUÇÕES
  // ==========================================
  const buscarNoMapaManual = async () => {
    if (formData.local.length < 3) return;
    try {
      const queryStr = pais === "Portugal" && formData.Distrito ? `${formData.local}, ${formData.Distrito}, ${pais}` : `${formData.local}, ${pais}`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}`);
      const data = await res.json();
      if (data && data.length > 0) setMapPreview({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
    } catch (e) { console.error(e); }
    setAddressSuggestions([]);
  };

  const traduzirParaIngles = async (texto: string) => {
    if (!texto) return "";
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=pt|en`);
      const data = await res.json();
      return data.responseData.translatedText;
    } catch (e) { return texto; }
  };

  // ==========================================
  // GUARDAR ALTERAÇÕES TOTAIS (HQ DB SYNC)
  // ==========================================
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (!mapPreview) { alert("Garanta que o mapa carregou."); setSaving(false); return; }
    if (images.length === 0) { alert("Adicione uma fotografia."); setSaving(false); return; }

    try {
      setStatusText("A processar media...");
      const uploadedImages = await Promise.all(images.map(async (img) => {
        if (!img.file) return { url: img.url, isMain: img.isMain };
        const compressedFile = await imageCompression(img.file, { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true });
        const fileName = `${Date.now()}-${sanitizeFileName(compressedFile.name)}`;
        const { error } = await supabase.storage.from('campos-imagens').upload(fileName, compressedFile);
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('campos-imagens').getPublicUrl(fileName);
        return { url: publicUrlData.publicUrl, isMain: img.isMain };
      }));

      const mainImageUrl = uploadedImages.find(i => i.isMain)?.url || uploadedImages[0]?.url;
      const galeriaUrls = uploadedImages.filter(i => !i.isMain).map(i => i.url);

      const novosDocs = await Promise.all(documentos.map(async (doc) => {
        const fileName = `${Date.now()}-${sanitizeFileName(doc.name)}`;
        const { error } = await supabase.storage.from('campos-documentos').upload(fileName, doc);
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('campos-documentos').getPublicUrl(fileName);
        return { nome: doc.name, url: publicUrlData.publicUrl };
      }));
      const programasDocsFinais = [...documentosExistentes, ...novosDocs];

      let urlContratoFinal = formData.contrato_parceiro_url;
      if (contratoFile) {
        const fileContratoName = `contrato-${Date.now()}-${sanitizeFileName(contratoFile.name)}`;
        const { error: errContrato } = await supabase.storage.from('campos-documentos').upload(fileContratoName, contratoFile);
        if (errContrato) throw errContrato;
        urlContratoFinal = supabase.storage.from('campos-documentos').getPublicUrl(fileContratoName).data.publicUrl;
      }

      setStatusText("A traduzir textos...");
      const linguasFinais = getLinguasString();

      const [
        nome_en, categoria_en, local_en, descricao_en,
        alimentacao_en, alojamento_en, seguro_en, Distrito_en, regras_termos_en
      ] = await Promise.all([
        traduzirParaIngles(formData.nome), traduzirParaIngles(formData.categoria), traduzirParaIngles(formData.local),
        traduzirParaIngles(formData.descricao), traduzirParaIngles(formData.alimentacao),
        traduzirParaIngles(formData.alojamento), traduzirParaIngles(formData.seguro), traduzirParaIngles(formData.Distrito),
        traduzirParaIngles(formData.regras_termos)
      ]);
      
      const formatarDataStr = (d: string) => d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) : '';
      const dataInic = formData.calendario_funcionamento.data_inicio;
      const dataFim = formData.calendario_funcionamento.data_fim;
      const textoDatas = dataInic && dataFim ? `${formatarDataStr(dataInic)} a ${formatarDataStr(dataFim)}` : '';
      const textoDatasEn = dataInic && dataFim ? `${formatarDataStr(dataInic)} to ${formatarDataStr(dataFim)}` : '';

      const taxaFinal = formData.taxa_comissao === '' ? null : Number(formData.taxa_comissao);
      const baseFinal = formData.base_comissao === '' ? null : formData.base_comissao;
      
      const perguntasLimpas = perguntas.filter(p => p.trim() !== "");

      // Preço Mínimo dinâmico a partir dos pacotes
      let precoMinimo = 0;
      if (pacotes && pacotes.length > 0) {
        const todosPrecos = pacotes.flatMap((p: Pacote) => p.variantes.map((v: Variante) => v.preco));
        if (todosPrecos.length > 0) precoMinimo = Math.min(...todosPrecos);
      }

      setStatusText("A guardar Quartel General...");
      const { error } = await supabase.from("campos").update({
        // Dados Base
        nome: formData.nome, nome_en, 
        categoria: formData.categoria, categoria_en, 
        local: formData.local, local_en, Distrito: formData.Distrito, Distrito_en,
        idade_min: formData.idade_min, idade_max: formData.idade_max, vagas_totais: formData.vagas_totais,
        
        // Logística e Infos
        racio_monitores: formData.racio_monitores, racio_monitores_en: formData.racio_monitores,
        alimentacao: formData.alimentacao, alimentacao_en, 
        alojamento: formData.alojamento, alojamento_en, 
        seguro: formData.seguro, seguro_en,
        descricao: formData.descricao, descricao_en, 
        regras_termos: formData.regras_termos, regras_termos_en,
        perguntas_customizadas: perguntasLimpas,

        // Extras Opcionais Financeiros
        extra_seguro: formData.extra_seguro, tipo_extra_seguro: formData.tipo_extra_seguro,
        extra_transporte: formData.extra_transporte, tipo_extra_transporte: formData.tipo_extra_transporte,
        
        // Arrays e Estruturas
        preco: precoMinimo, datas_disponiveis: textoDatas, datas_disponiveis_en: textoDatasEn, 
        pais, pais_en: isEn ? 'United Kingdom' : 'Reino Unido', 
        linguas_faladas: linguasFinais, linguas_faladas_en: linguasFinais,
        latitude: mapPreview.lat, longitude: mapPreview.lon, 
        descontos: descontos, pacotes: pacotes, calendario_funcionamento: formData.calendario_funcionamento,
        imagem: mainImageUrl, galeria: galeriaUrls, programas_pdf: programasDocsFinais, 

        // HQ e Operação
        taxa_comissao: taxaFinal, base_comissao: baseFinal, contrato_parceiro_url: urlContratoFinal,
        status_aprovacao: formData.status_aprovacao, modalidade_reserva: formData.modalidade_reserva,
        link_externo_reserva: formData.link_externo_reserva, tipo_pagamento: formData.tipo_pagamento,
        politica_cancelamento: formData.politica_cancelamento, ativo: formData.status_aprovacao === 'Aprovado'
      }).eq('id', id);

      if (error) throw error;
      alert("Campo atualizado com sucesso (Sincronizado com Nova Estrutura Partner).");
      router.push(`/${lang}/superadmin/campos`);
    } catch (error: any) { alert("Erro: " + error.message); } finally { setSaving(false); setStatusText(""); }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>A carregar Master HQ...</div>;

  const showContratoWarning = formData.status_aprovacao === 'Aprovado' && !formData.contrato_parceiro_url;

  return (
    <main style={{ maxWidth: '850px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      
      <Link href={`/${lang}/superadmin/campos`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#64748b', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
        &larr; Voltar ao Diretório Global
      </Link>

      <h1 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '2rem', color: '#0f172a' }}>
        Editar Campo Master: {formData.nome} 
        <span style={{ fontSize: '12px', backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', verticalAlign: 'middle', marginLeft: '0.5rem' }}>HQ Sync</span>
      </h1>

      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* ========================================== */}
        {/* 1. OPERAÇÃO E CONTRATO (HQ ONLY)           */}
        {/* ========================================== */}
        <div style={{ ...sectionStyle, border: '2px solid #fbbf24', backgroundColor: '#fffbeb' }}>
          <h2 style={sectionTitleStyle}>⚡ Operação e Contrato HelloCamp</h2>
          
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #fde68a' }}>
            <label style={labelStyle}>Status do Campo (Aprovação / Listagem)</label>
            <select value={formData.status_aprovacao} onChange={e => setFormData({...formData, status_aprovacao: e.target.value})} style={{...selectStyle, borderColor: formData.status_aprovacao === 'Aprovado' ? '#059669' : '#fbbf24', borderWidth: '2px'}}>
              <option value="Pendente de Revisão">Pendente (Invisível)</option>
              <option value="Aprovado">Aprovado & Validado (Fica Visível online)</option>
              <option value="Rejeitado">Rejeitado (Inativo)</option>
            </select>
            {showContratoWarning && (
              <p style={{ margin: '0.75rem 0 0 0', fontSize: '12px', color: '#dc2626', fontWeight: 'bold', backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '0.5rem' }}>
                ⚠️ Atenção: Colocou como Aprovado, mas não existe contrato anexado! Um campo deve idealmente ter contrato validado para estar ativo.
              </p>
            )}
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '11px', color: '#92400e' }}>
              * Apenas o estado "Aprovado" torna o campo ativo e pesquisável no motor de busca da HelloCamp.
            </p>
          </div>

          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Taxa de Comissão (%)</label>
              <input type="number" step="0.1" value={formData.taxa_comissao || ''} onChange={e => setFormData({...formData, taxa_comissao: e.target.value})} style={inputStyle} placeholder="Vazio = Regra do parceiro" />
            </div>
            <div>
              <label style={labelStyle}>Base de Incidência</label>
              <select value={formData.base_comissao || ''} onChange={e => setFormData({...formData, base_comissao: e.target.value})} style={selectStyle}>
                <option value="">-- Regra do Parceiro --</option>
                <option value="total">Sobre Valor Total (Programa + Extras)</option>
                <option value="apenas_programa">Apenas sobre Programa</option>
                <option value="sem_comissao">Isento (0%)</option>
              </select>
            </div>
            
            <div>
              <label style={labelStyle}>Anexo 1: Modalidade de Reserva</label>
              <select value={formData.modalidade_reserva} onChange={e => setFormData({...formData, modalidade_reserva: e.target.value})} style={selectStyle}>
                <option value="direta">Reserva Direta (Checkout)</option>
                <option value="email">Sob Consulta (E-mail)</option>
                <option value="link_externo">Link Externo / Google Forms</option>
              </select>
              {formData.modalidade_reserva === 'link_externo' && (
                 <input type="url" placeholder="URL do Formulário..." value={formData.link_externo_reserva || ''} onChange={e => setFormData({...formData, link_externo_reserva: e.target.value})} style={{...inputStyle, marginTop: '0.5rem', borderColor: '#3b82f6'}} />
              )}
            </div>

            <div>
              <label style={labelStyle}>Anexo 2: Pagamento</label>
              <select value={formData.tipo_pagamento} onChange={e => setFormData({...formData, tipo_pagamento: e.target.value})} style={selectStyle}>
                <option value="100_total">100% no Ato</option>
                <option value="50_sinal">Sinal 50%</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Anexo 3: Cancelamento</label>
              <select value={formData.politica_cancelamento} onChange={e => setFormData({...formData, politica_cancelamento: e.target.value})} style={selectStyle}>
                <option value="Flexível (Reembolso a 100% até 7 dias antes)">Flexível (100% a 7 dias)</option>
                <option value="Moderada (Reembolso a 50% até 15 dias antes)">Moderada (50% a 15 dias)</option>
                <option value="Estrita (Sem reembolso após reserva)">Estrita (Sem reembolso)</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #fde68a', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
              <label style={labelStyle}>Upload de Contrato de Parceiro Assinado (PDF)</label>
              {formData.contrato_parceiro_url && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', fontSize: '13px', fontWeight: 'bold' }}>
                  ✅ Contrato validado e anexado: <a href={formData.contrato_parceiro_url} target="_blank" rel="noopener noreferrer" style={{ color: '#b45309', textDecoration: 'underline' }}>Ver Documento</a>
                </div>
              )}
              <input type="file" accept=".pdf" onChange={handleContratoSelect} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px dashed #fbbf24' }} />
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 2. INFORMAÇÕES BÁSICAS                     */}
        {/* ========================================== */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>1. Informações Básicas</h2>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Nome do Campo</label><input type="text" required value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select required value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})} style={selectStyle}>
                <option value="">Selecione...</option><option value="Desporto">Desporto</option><option value="Aventura & Natureza">Aventura & Natureza</option><option value="Tecnologia & Ciência">Tecnologia & Ciência</option><option value="Artes & Criatividade">Artes & Criatividade</option><option value="Línguas">Línguas</option>
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label style={labelStyle}>Idade Min.</label><input type="number" required value={formData.idade_min} onChange={e => setFormData({...formData, idade_min: Number(e.target.value)})} style={inputStyle} /></div>
              <div><label style={labelStyle}>Idade Max.</label><input type="number" required value={formData.idade_max} onChange={e => setFormData({...formData, idade_max: Number(e.target.value)})} style={inputStyle} /></div>
            </div>

            <div><label style={labelStyle}>Vagas Máximas</label><input type="number" required value={formData.vagas_totais} onChange={e => setFormData({...formData, vagas_totais: Number(e.target.value)})} style={inputStyle} /></div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Línguas Faladas</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.pt} onChange={() => handleLinguasChange('pt')} /> PT</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.en} onChange={() => handleLinguasChange('en')} /> EN</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.es} onChange={() => handleLinguasChange('es')} /> ES</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.fr} onChange={() => handleLinguasChange('fr')} /> FR</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.de} onChange={() => handleLinguasChange('de')} /> DE</label>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 3. LOCALIZAÇÃO                             */}
        {/* ========================================== */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>2. Localização</h2>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>País</label>
              <select required value={pais} onChange={e => { setPais(e.target.value); setMapPreview(null); if (e.target.value !== "Portugal") setFormData({...formData, Distrito: ""}); }} style={selectStyle}>
                {paises.map(p => <option key={p.pt} value={p.pt}>{p.pt}</option>)}
              </select>
            </div>
            {pais === "Portugal" && (
              <div>
                <label style={labelStyle}>Distrito</label>
                <select required value={formData.Distrito || ''} onChange={e => { setFormData({...formData, Distrito: e.target.value}); setMapPreview(null); }} style={selectStyle}>
                  <option value="">Selecione...</option>{distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
              <label style={labelStyle}>Morada Específica (Pressione Enter para pesquisar)</label>
              <input type="text" required value={formData.local || ''} onChange={e => { setFormData({...formData, local: e.target.value}); setMapPreview(null); }} onBlur={buscarNoMapaManual} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); buscarNoMapaManual(); } }} style={inputStyle} />
              {addressSuggestions.length > 0 && !mapPreview && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '0.5rem', marginTop: '0.25rem', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                  {addressSuggestions.map((sugestao, index) => (
                    <div key={index} onClick={() => { setFormData({ ...formData, local: sugestao.display_name }); setMapPreview({ lat: parseFloat(sugestao.lat), lon: parseFloat(sugestao.lon) }); setAddressSuggestions([]); }} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: index !== addressSuggestions.length -1 ? '1px solid #f1f5f9' : 'none', fontSize: '13px', color: '#334155' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}>
                      {sugestao.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {mapPreview && (
            <div style={{ marginTop: '1.5rem', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <iframe width="100%" height="250" frameBorder="0" scrolling="no" src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapPreview.lon-0.005},${mapPreview.lat-0.005},${mapPreview.lon+0.005},${mapPreview.lat+0.005}&layer=mapnik&marker=${mapPreview.lat},${mapPreview.lon}`}></iframe>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* 4. MOTOR DE ESTRUTURA E PACOTES            */}
        {/* ========================================== */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>3. Calendário e Motor de Vendas</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Data Início do Campo</label>
              <input type="date" value={formData.calendario_funcionamento.data_inicio || ''} onChange={e => setFormData({ ...formData, calendario_funcionamento: { ...formData.calendario_funcionamento, data_inicio: e.target.value } })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data Fim do Campo</label>
              <input type="date" value={formData.calendario_funcionamento.data_fim || ''} onChange={e => setFormData({ ...formData, calendario_funcionamento: { ...formData.calendario_funcionamento, data_fim: e.target.value } })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={labelStyle}>Dias da Semana Operacionais</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {DIAS_SEMANA.map(dia => (
                <button type="button" key={dia.id} onClick={() => toggleDiaSemana(dia.id)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: formData.calendario_funcionamento.dias_semana.includes(dia.id) ? '#4f46e5' : '#f8fafc', color: formData.calendario_funcionamento.dias_semana.includes(dia.id) ? 'white' : '#64748b', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                  {dia.pt}
                </button>
              ))}
            </div>
          </div>

          {/* PACOTES EDITÁVEIS HQ */}
          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', margin: 0 }}>PACOTES CONFIGURADOS ({pacotes.length})</p>
              <button type="button" onClick={() => setIsPacoteModalOpen(true)} style={{ backgroundColor: '#0f172a', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                + Adicionar Pacote
              </button>
            </div>
            {pacotes.length === 0 ? <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Nenhum pacote definido.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pacotes.map((pac: any, idx: number) => (
                  <div key={idx} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ color: '#0f172a', fontSize: '14px' }}>{pac.titulo}</strong> <span style={{ color: '#64748b', fontSize: '12px' }}>({pac.tipo} - Qtd: {pac.quantidade})</span>
                      <div style={{ marginTop: '0.5rem', fontSize: '13px', color: '#059669', fontWeight: 'bold' }}>Variantes: {pac.variantes?.map((v: any) => `${v.nome}: ${v.preco}€`).join(' | ')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" onClick={() => { setNovoPacote(pac); setIsPacoteModalOpen(true); }} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Editar</button>
                      <button type="button" onClick={() => eliminarPacote(pac.id)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Apagar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DESCONTOS EDITÁVEIS HQ */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '2px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Códigos de Desconto</h2>
              <button type="button" onClick={() => setIsDescontoModalOpen(true)} style={{ backgroundColor: '#f0fdf4', color: '#059669', border: '1px solid #6ee7b7', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                + Adicionar Desconto
              </button>
            </div>
            {descontos.length === 0 ? <p style={{ fontSize: '12px', color: '#94a3b8' }}>Nenhum desconto configurado.</p> : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {descontos.map((desc, idx) => (
                  <div key={idx} style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px dashed #10b981', borderRadius: '0.5rem', width: '250px', position: 'relative' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '14px', color: '#065f46' }}>{desc.nome}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#047857' }}>{desc.percentagem}% | {desc.acumulavel ? 'Acumulável' : 'Não Acumulável'}</p>
                    <button type="button" onClick={() => eliminarDesconto(desc.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* 5. TEXTOS LOGÍSTICOS E EXTRAS              */}
        {/* ========================================== */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>4. Logística e Extras Opcionais</h2>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Rácio Monitores</label><input type="text" value={formData.racio_monitores || ''} onChange={e => setFormData({...formData, racio_monitores: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>Alimentação (Texto)</label><input type="text" value={formData.alimentacao || ''} onChange={e => setFormData({...formData, alimentacao: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>Alojamento (Texto)</label><input type="text" value={formData.alojamento || ''} onChange={e => setFormData({...formData, alojamento: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelStyle}>Seguro Geral (Texto)</label><input type="text" value={formData.seguro || ''} onChange={e => setFormData({...formData, seguro: e.target.value})} style={inputStyle} /></div>
            
            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', margin: '1rem 0', paddingTop: '1.5rem' }}>
              <label style={labelStyle}>Valores Extra (Opções Fora dos Pacotes)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                  <label style={{...labelStyle, color: '#0f172a'}}>Seguro Opcional (€)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="number" value={formData.extra_seguro || 0} onChange={e => setFormData({...formData, extra_seguro: Number(e.target.value)})} style={{...inputStyle, flex: 1}} />
                    <select value={formData.tipo_extra_seguro || 'fixo'} onChange={e => setFormData({...formData, tipo_extra_seguro: e.target.value})} style={{...selectStyle, flex: 1}}><option value="fixo">Taxa Fixa</option><option value="diario">Por Dia</option></select>
                  </div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                  <label style={{...labelStyle, color: '#0f172a'}}>Transporte Opcional (€)</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="number" value={formData.extra_transporte || 0} onChange={e => setFormData({...formData, extra_transporte: Number(e.target.value)})} style={{...inputStyle, flex: 1}} />
                    <select value={formData.tipo_extra_transporte || 'diario'} onChange={e => setFormData({...formData, tipo_extra_transporte: e.target.value})} style={{...selectStyle, flex: 1}}><option value="fixo">Taxa Fixa</option><option value="diario">Por Dia</option></select>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Descrição Completa</label><textarea rows={5} value={formData.descricao || ''} onChange={e => setFormData({...formData, descricao: e.target.value})} style={{...inputStyle, resize: 'vertical'}} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Regras e Termos (Campo)</label><textarea rows={4} value={formData.regras_termos || ''} onChange={e => setFormData({...formData, regras_termos: e.target.value})} style={{...inputStyle, resize: 'vertical'}} /></div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 6. GALERIA E PERGUNTAS                     */}
        {/* ========================================== */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>5. Media e Formulários</h2>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', cursor: 'pointer', backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '0.75rem' }}><span style={{ fontWeight: 'bold', color: '#64748b' }}>📸 Clique para enviar fotos...</span><input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', border: img.isMain ? '3px solid #059669' : '1px solid #e2e8f0', height: '120px' }}>
                  <img src={img.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: '5px', right: '5px', background: '#dc2626', color: 'white', borderRadius: '50%', width: '24px', height: '24px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                  {!img.isMain && <button type="button" onClick={() => setMainImage(idx)} style={{ position: 'absolute', bottom: '5px', left: '5px', right: '5px', background: 'rgba(15,23,42,0.85)', color: 'white', fontSize: '11px', padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Principal</button>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={labelStyle}>Perguntas Personalizadas ao Pai</label>
              <button type="button" onClick={addPergunta} style={{ backgroundColor: '#f1f5f9', color: '#059669', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>+ Pergunta</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {perguntas.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" value={p || ''} onChange={e => updatePergunta(i, e.target.value)} style={{...inputStyle, flex: 1}} placeholder="Pergunta a apresentar no checkout..." />
                  <button type="button" onClick={() => removePergunta(i)} style={{ width: '40px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                </div>
              ))}
            </div>
          </div>

          {/* DOCUMENTOS PDF DO CAMPO */}
          <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '2rem', marginTop: '2rem' }}>
            <label style={labelStyle}>Programa do Campo (PDF/Word para Clientes)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
              {documentosExistentes.map((doc, idx) => (
                <div key={`exist-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', width: '100%', fontSize: '13px' }}><span style={{ fontWeight: 'bold' }}>📄 {doc.nome} (Atual)</span><button type="button" onClick={() => removeDocExistente(idx)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button></div>
              ))}
              {documentos.map((doc, idx) => (
                <div key={`novo-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', width: '100%', fontSize: '13px' }}><span style={{ fontWeight: 'bold', color: '#059669' }}>📄 {doc.name} (Novo)</span><button type="button" onClick={() => removeNovoDoc(idx)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button></div>
              ))}
              <label style={{ padding: '0.75rem 1.5rem', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 'bold', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '14px' }}>+ Anexar Documento <input type="file" accept=".pdf,.doc,.docx" multiple onChange={handleDocSelect} style={{ display: 'none' }} /></label>
            </div>
          </div>

        </div>

        <button type="submit" disabled={saving} style={{ padding: '1.25rem', backgroundColor: '#0f172a', color: 'white', fontWeight: '900', borderRadius: '0.75rem', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1.125rem', marginTop: '1rem' }}>
          {saving ? statusText : 'Guardar Alterações e Sincronizar (HQ)'}
        </button>
      </form>

      {/* ========================================== */}
      {/* MODAL: PACOTES */}
      {/* ========================================== */}
      {isPacoteModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ fontWeight: '900', color: '#0f172a', fontSize: '1.125rem', margin: 0 }}>{novoPacote.id ? 'Editar Pacote (HQ)' : 'Novo Pacote (HQ)'}</h3>
              <button type="button" onClick={() => setIsPacoteModalOpen(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Tipo de Logística</label>
                <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.375rem', borderRadius: '0.75rem' }}>
                  <button type="button" onClick={() => setNovoPacote({...novoPacote, tipo: 'semana'})} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '13px', border: 'none', cursor: 'pointer', backgroundColor: novoPacote.tipo === 'semana' ? 'white' : 'transparent', color: novoPacote.tipo === 'semana' ? '#4f46e5' : '#64748b', boxShadow: novoPacote.tipo === 'semana' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>Semanas</button>
                  <button type="button" onClick={() => setNovoPacote({...novoPacote, tipo: 'dia'})} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '13px', border: 'none', cursor: 'pointer', backgroundColor: novoPacote.tipo === 'dia' ? 'white' : 'transparent', color: novoPacote.tipo === 'dia' ? '#4f46e5' : '#64748b', boxShadow: novoPacote.tipo === 'dia' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>Dias Individuais</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Nome do Passe</label>
                  <input type="text" value={novoPacote.titulo} onChange={e => setNovoPacote({...novoPacote, titulo: e.target.value})} style={inputStyle} placeholder="Ex: Pack 1 Semana" />
                </div>
                <div>
                  <label style={labelStyle}>Qtd ({novoPacote.tipo === 'semana' ? 'Sem' : 'Dias'})</label>
                  <input type="number" min="1" value={novoPacote.quantidade} onChange={e => setNovoPacote({...novoPacote, quantidade: Number(e.target.value)})} style={{...inputStyle, textAlign: 'center', color: '#4f46e5', fontWeight: 'black'}} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{...labelStyle, margin: 0}}>Variantes e Preços</label>
                  <button type="button" onClick={adicionarVariante} style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#4f46e5', backgroundColor: '#eef2ff', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>+ Variante</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {novoPacote.variantes.map((v, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '0.75rem' }}>
                      <input type="text" value={v.nome} onChange={e => atualizarVariante(i, 'nome', e.target.value)} placeholder="Nome (Ex: c/ Almoço)" style={{...inputStyle, flex: 2, padding: '0.5rem', fontSize: '13px'}} />
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '0.5rem', paddingRight: '0.5rem' }}>
                        <input type="number" min="0" value={v.preco} onChange={e => atualizarVariante(i, 'preco', Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: 'none', outline: 'none', textAlign: 'right', fontWeight: 'black', color: '#4f46e5', borderRadius: '0.5rem' }} />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8' }}>€</span>
                      </div>
                      {novoPacote.variantes.length > 1 && (
                        <button type="button" onClick={() => removerVariante(i)} style={{ width: '32px', height: '32px', borderRadius: '0.5rem', border: 'none', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: 'bold', cursor: 'pointer' }}>X</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setIsPacoteModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 'bold', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#64748b', cursor: 'pointer' }}>Cancelar</button>
              <button type="button" onClick={guardarPacote} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 'bold', border: 'none', backgroundColor: '#0f172a', color: 'white', cursor: 'pointer' }}>✓ Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DESCONTOS */}
      {isDescontoModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={{...modalContentStyle, maxWidth: '400px'}}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ fontWeight: '900', color: '#0f172a', fontSize: '1.125rem', margin: 0 }}>Novo Desconto (HQ)</h3>
              <button type="button" onClick={() => setIsDescontoModalOpen(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'white', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Nome do Desconto (Visível no Recibo)</label>
                <input type="text" value={novoDesconto.nome} onChange={e => setNovoDesconto({...novoDesconto, nome: e.target.value})} style={inputStyle} placeholder="Ex: Desconto Irmãos" />
              </div>
              <div>
                <label style={labelStyle}>Percentagem a Retirar (%)</label>
                <input type="number" min="1" max="100" value={novoDesconto.percentagem} onChange={e => setNovoDesconto({...novoDesconto, percentagem: Number(e.target.value)})} style={{...inputStyle, fontWeight: 'black', fontSize: '18px'}} />
              </div>
              <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setNovoDesconto({...novoDesconto, acumulavel: !novoDesconto.acumulavel})}>
                <div>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold', color: '#1e3a8a', fontSize: '13px' }}>É Acumulável?</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#3b82f6' }}>Soma a outros descontos no carrinho.</p>
                </div>
                <div style={{ width: '40px', height: '20px', borderRadius: '10px', backgroundColor: novoDesconto.acumulavel ? '#2563eb' : '#cbd5e1', position: 'relative', transition: 'background-color 0.2s' }}>
                  <div style={{ position: 'absolute', top: '2px', left: novoDesconto.acumulavel ? '22px' : '2px', width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', transition: 'left 0.2s' }}></div>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setIsDescontoModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 'bold', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#64748b', cursor: 'pointer' }}>Cancelar</button>
              <button type="button" onClick={guardarDesconto} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 'bold', border: 'none', backgroundColor: '#4f46e5', color: 'white', cursor: 'pointer' }}>✓ Guardar</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

// ESTILOS GERAIS
const sectionStyle = { backgroundColor: 'white', padding: '2.5rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' };
const sectionTitleStyle = { fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '2rem' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' };
const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const inputStyle = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '14px', fontWeight: '600', color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const };
const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' };
const checkboxLabelStyle = { display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '13px', color: '#334155', cursor: 'pointer', fontWeight: '700' };

// ESTILOS MODAIS
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' };
const modalContentStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '1.5rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' };
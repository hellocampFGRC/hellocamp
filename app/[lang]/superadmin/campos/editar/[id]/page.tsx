"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import imageCompression from 'browser-image-compression';
import React from "react";

type ImagePreview = { file?: File; url?: string; preview: string; isMain: boolean; };
interface Variante { nome: string; preco: number; }
interface Pacote { id: string; titulo: string; tipo: 'semana' | 'dia'; quantidade: number; variantes: Variante[]; }
interface Desconto { id: string; nome: string; percentagem: number; acumulavel: boolean; }

const DIAS_SEMANA = [
  { id: 1, pt: 'Seg' }, { id: 2, pt: 'Ter' }, { id: 3, pt: 'Qua' }, 
  { id: 4, pt: 'Qui' }, { id: 5, pt: 'Sex' }, { id: 6, pt: 'Sáb' }, { id: 0, pt: 'Dom' }
];

const sanitizeFileName = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-]/g, "_");

export default function SuperAdminEditarCampo({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const resolvedParams = use(params);
  const { lang, id } = resolvedParams;
  
  const router = useRouter();
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  
  const [organizadorId, setOrganizadorId] = useState<string | null>(null);
  const [statusContratoGlobal, setStatusContratoGlobal] = useState<string | null>(null);

  const [images, setImages] = useState<ImagePreview[]>([]);
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [documentosExistentes, setDocumentosExistentes] = useState<{nome: string, url: string}[]>([]);
  const [contratoFile, setContratoFile] = useState<File | null>(null);
  
  const [mapPreview, setMapPreview] = useState<{lat: number, lon: number} | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [pais, setPais] = useState("Portugal");
  const [linguas, setLinguas] = useState({ pt: false, en: false, es: false, fr: false, de: false });

  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [descontos, setDescontos] = useState<Desconto[]>([]);
  const [perguntas, setPerguntas] = useState<string[]>([]);

  const [isPacoteModalOpen, setIsPacoteModalOpen] = useState(false);
  const [novoPacote, setNovoPacote] = useState<Pacote>({ id: "", titulo: "", tipo: "semana", quantidade: 1, variantes: [{ nome: "Bilhete Base", preco: 0 }] });

  const [isDescontoModalOpen, setIsDescontoModalOpen] = useState(false);
  const [novoDesconto, setNovoDesconto] = useState<Desconto>({ id: "", nome: "", percentagem: 10, acumulavel: false });

  const [formData, setFormData] = useState({
    nome: "", categoria: "", local: "", Distrito: "", 
    idade_min: 6, idade_max: 14, vagas_totais: 50,
    racio_monitores: "", alimentacao: "", alojamento: "", seguro: "", 
    descricao: "", regras_termos: "",
    extra_seguro: 0, tipo_extra_seguro: "fixo", 
    extra_transporte: 0, tipo_extra_transporte: "diario",
    taxa_comissao: "", base_comissao: "", contrato_parceiro_url: "",
    status_aprovacao: "Pendente de Revisão", 
    modalidade_reserva: "direta", link_externo_reserva: "",
    tipo_pagamento: "100_total", politica_cancelamento: "Moderada (Reembolso a 50% até 15 dias antes)",
    calendario_funcionamento: { data_inicio: "", data_fim: "", dias_semana: [1, 2, 3, 4, 5] }
  });

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];
  const paises = [{ pt: "Portugal", en: "Portugal" }, { pt: "Espanha", en: "Spain" }, { pt: "França", en: "France" }, { pt: "Reino Unido", en: "United Kingdom" }, { pt: "Brasil", en: "Brazil" }, { pt: "Estados Unidos", en: "United States" }, { pt: "Outro", en: "Other" }];

  useEffect(() => {
    const fetchCampo = async () => {
      const { data, error } = await supabase.from('campos').select('*').eq('id', id).single();
      if (data) {
        setFormData({ 
          nome: data.nome || "", categoria: data.categoria || "", local: data.local || "", Distrito: data.Distrito || "",
          idade_min: data.idade_min || 6, idade_max: data.idade_max || 14, vagas_totais: data.vagas_totais || 50,
          racio_monitores: data.racio_monitores || "", alimentacao: data.alimentacao || "", alojamento: data.alojamento || "",
          seguro: data.seguro || "", descricao: data.descricao || "", regras_termos: data.regras_termos || "",
          extra_seguro: data.extra_seguro || 0, tipo_extra_seguro: data.tipo_extra_seguro || 'fixo',
          extra_transporte: data.extra_transporte || 0, tipo_extra_transporte: data.tipo_extra_transporte || 'diario',
          taxa_comissao: data.taxa_comissao || '', base_comissao: data.base_comissao || '', 
          contrato_parceiro_url: data.contrato_parceiro_url || '', modalidade_reserva: data.modalidade_reserva || 'direta',
          link_externo_reserva: data.link_externo_reserva || '', tipo_pagamento: data.tipo_pagamento || '100_total',
          politica_cancelamento: data.politica_cancelamento || 'Moderada (Reembolso a 50% até 15 dias antes)',
          calendario_funcionamento: data.calendario_funcionamento || { data_inicio: "", data_fim: "", dias_semana: [1, 2, 3, 4, 5] },
          status_aprovacao: data.status_aprovacao || 'Pendente de Revisão',
        });
        
        setOrganizadorId(data.organizador_id);
        
        if (data.organizador_id) {
          const { data: perfilData } = await supabase.from('perfis').select('status_contrato').eq('id', data.organizador_id).single();
          if (perfilData) setStatusContratoGlobal(perfilData.status_contrato);
        }

        setPacotes(data.pacotes || []); setDescontos(data.descontos || []); setPerguntas(data.perguntas_customizadas || []);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file, index) => ({ file, preview: URL.createObjectURL(file), isMain: images.length === 0 && index === 0 }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, idx) => idx !== indexToRemove);
      if (prev[indexToRemove].isMain && newImages.length > 0) newImages[0].isMain = true;
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

  const addPergunta = () => setPerguntas([...perguntas, ""]);
  const removePergunta = (index: number) => setPerguntas(perguntas.filter((_, i) => i !== index));
  const updatePergunta = (index: number, value: string) => setPerguntas(perguntas.map((p, i) => i === index ? value : p));

  const atualizarVariante = (index: number, campo: 'nome' | 'preco', valor: string | number) => {
    const novasVariantes = [...novoPacote.variantes];
    novasVariantes[index] = { ...novasVariantes[index], [campo]: valor } as Variante;
    setNovoPacote({ ...novoPacote, variantes: novasVariantes });
  };
  const adicionarVariante = () => setNovoPacote(prev => ({ ...prev, variantes: [...prev.variantes, { nome: "", preco: 0 }] }));
  const removerVariante = (index: number) => setNovoPacote(prev => ({ ...prev, variantes: prev.variantes.filter((_, i) => i !== index) }));

  const guardarPacote = () => {
    if (!novoPacote.titulo || novoPacote.variantes.length === 0) return alert("Preencha o título e pelo menos 1 preço.");
    const pacoteFinal: Pacote = { ...novoPacote, id: novoPacote.id || Math.random().toString(36).substring(2, 9) };
    const novosPacotes = novoPacote.id ? pacotes.map((p: Pacote) => p.id === novoPacote.id ? pacoteFinal : p) : [...pacotes, pacoteFinal];
    setPacotes(novosPacotes); setIsPacoteModalOpen(false);
    setNovoPacote({ id: "", titulo: "", tipo: "semana", quantidade: 1, variantes: [{ nome: "Bilhete Base", preco: 0 }] });
  };
  const eliminarPacote = (id: string) => setPacotes(pacotes.filter(p => p.id !== id));

  const guardarDesconto = () => {
    if (!novoDesconto.nome || novoDesconto.percentagem <= 0) return alert("Preencha o nome e um valor superior a 0.");
    const descontoFinal = { ...novoDesconto, id: novoDesconto.id || Math.random().toString(36).substring(2, 9) };
    const novosDescontos = novoDesconto.id ? descontos.map((d: Desconto) => d.id === novoDesconto.id ? descontoFinal : d) : [...descontos, descontoFinal];
    setDescontos(novosDescontos); setIsDescontoModalOpen(false);
    setNovoDesconto({ id: "", nome: "", percentagem: 10, acumulavel: false });
  };
  const eliminarDesconto = (id: string) => setDescontos(descontos.filter(d => d.id !== id));

  const buscarNoMapaManual = async () => {
    if (formData.local.length < 3) return;
    try {
      const queryStr = pais === "Portugal" && formData.Distrito ? `${formData.local}, ${formData.Distrito}, ${pais}` : `${formData.local}, ${pais}`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}`);
      const data = await res.json();
      if (data && data.length > 0) setMapPreview({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
      else setMapPreview(null);
    } catch (e) { setMapPreview(null); }
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    if (images.length === 0) { alert("Adicione pelo menos uma fotografia."); setSaving(false); return; }

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

      const taxaFinal = formData.taxa_comissao === '' ? null : Number(formData.taxa_comissao);
      const baseFinal = formData.base_comissao === '' ? null : formData.base_comissao;
      const perguntasLimpas = perguntas.filter(p => p.trim() !== "");

      let precoMinimo = 0;
      if (pacotes && pacotes.length > 0) {
        const todosPrecos = pacotes.flatMap((p: Pacote) => p.variantes.map((v: Variante) => v.preco));
        if (todosPrecos.length > 0) precoMinimo = Math.min(...todosPrecos);
      }

      setStatusText("A sincronizar com a Base de Dados...");

      const { error } = await supabase.from("campos").update({
        nome: formData.nome, nome_en, categoria: formData.categoria, categoria_en, local: formData.local, local_en, Distrito: formData.Distrito, Distrito_en,
        idade_min: formData.idade_min, idade_max: formData.idade_max, vagas_totais: formData.vagas_totais,
        racio_monitores: formData.racio_monitores, racio_monitores_en: formData.racio_monitores,
        alimentacao: formData.alimentacao, alimentacao_en, alojamento: formData.alojamento, alojamento_en, seguro: formData.seguro, seguro_en,
        descricao: formData.descricao, descricao_en, regras_termos: formData.regras_termos, regras_termos_en, perguntas_customizadas: perguntasLimpas,
        extra_seguro: formData.extra_seguro, tipo_extra_seguro: formData.tipo_extra_seguro,
        extra_transporte: formData.extra_transporte, tipo_extra_transporte: formData.tipo_extra_transporte,
        preco: precoMinimo, pais, pais_en: isEn ? 'United Kingdom' : 'Reino Unido', linguas_faladas: linguasFinais, linguas_faladas_en: linguasFinais,
        latitude: mapPreview ? mapPreview.lat : null, longitude: mapPreview ? mapPreview.lon : null, 
        descontos: descontos, pacotes: pacotes, calendario_funcionamento: formData.calendario_funcionamento,
        imagem: mainImageUrl, galeria: galeriaUrls, programas_pdf: programasDocsFinais, 
        taxa_comissao: taxaFinal, base_comissao: baseFinal, contrato_parceiro_url: urlContratoFinal,
        status_aprovacao: formData.status_aprovacao, modalidade_reserva: formData.modalidade_reserva,
        link_externo_reserva: formData.link_externo_reserva, tipo_pagamento: formData.tipo_pagamento,
        politica_cancelamento: formData.politica_cancelamento, ativo: formData.status_aprovacao === 'Aprovado'
      }).eq('id', id);

      if (error) throw error;

      if (organizadorId && formData.status_aprovacao !== 'Pendente de Revisão') {
         const { error: perfilErr } = await supabase.from('perfis').update({
             modalidade_reserva: formData.modalidade_reserva,
             link_externo_reserva: formData.modalidade_reserva === 'link_externo' ? formData.link_externo_reserva : null,
         }).eq('id', organizadorId);
         if (perfilErr) console.warn("Aviso Sincronia Perfil: ", perfilErr.message);
      }

      alert("Campo atualizado com sucesso (Sincronizado com Nova Estrutura Partner).");
      router.push(`/${lang}/superadmin/campos`);
    } catch (error: any) { alert("Erro: " + error.message); } finally { setSaving(false); setStatusText(""); }
  };

  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1";
  const inputClass = "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-colors shadow-sm placeholder-slate-400";
  const selectClass = "w-full p-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none appearance-none cursor-pointer focus:border-blue-600 focus:bg-white transition-colors shadow-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.8rem_auto] bg-[position:right_1rem_center] bg-no-repeat";
  const textareaClass = "w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-colors shadow-sm resize-y";

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">A carregar Master HQ...</div>;

  const showContratoWarning = formData.status_aprovacao === 'Aprovado' && !formData.contrato_parceiro_url && statusContratoGlobal !== 'Aprovado';

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8 font-sans pb-24">
      
      <Link href={`/${lang}/superadmin/campos`} className="inline-flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm hover:text-slate-900 transition-colors no-underline">
        &larr; Voltar ao Diretório Global
      </Link>

      <h1 className="text-2xl md:text-3xl font-black mb-8 text-slate-900 tracking-tight flex flex-wrap items-center gap-3">
        Editar Campo: {formData.nome} 
        <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm">HQ Sync</span>
      </h1>

      <form onSubmit={handleUpdate} className="flex flex-col gap-10">
        
        {/* ========================================== */}
        {/* 1. OPERAÇÃO E CONTRATO (HQ ONLY)           */}
        {/* ========================================== */}
        <div className="bg-amber-50/50 p-6 md:p-8 rounded-[2rem] border-2 border-amber-200 shadow-sm">
          <h2 className="text-lg font-black text-amber-900 border-b border-amber-200/50 pb-4 mb-6 flex items-center gap-3 tracking-tight">
            <span className="text-2xl">⚡</span> Operação e Contrato HelloCamp
          </h2>
          
          <div className="mb-6 p-5 bg-white rounded-2xl border border-amber-300 shadow-sm">
            <label className={labelClass}>Status do Campo (Aprovação / Listagem)</label>
            <select value={formData.status_aprovacao} onChange={e => setFormData({...formData, status_aprovacao: e.target.value})} className={`${selectClass} ${formData.status_aprovacao === 'Aprovado' ? '!border-emerald-500 !border-2' : '!border-amber-400 !border-2'}`}>
              <option value="Pendente de Revisão">Pendente (Invisível)</option>
              <option value="Aprovado">Aprovado & Validado (Fica Visível online)</option>
              <option value="Rejeitado">Rejeitado (Inativo)</option>
            </select>
            {showContratoWarning && (
              <p className="mt-3 text-[11px] text-red-700 font-bold bg-red-50 p-3 rounded-xl border border-red-200">
                ⚠️ Atenção: Colocou como Aprovado, mas não existe contrato individual anexado nem contrato global validado!
              </p>
            )}
            <p className="mt-2 text-[10px] font-bold text-amber-700 uppercase tracking-widest">
              Apenas o estado "Aprovado" torna o campo ativo e pesquisável no motor de busca.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Taxa de Comissão (%)</label>
              <input type="number" step="0.1" value={formData.taxa_comissao || ''} onChange={e => setFormData({...formData, taxa_comissao: e.target.value})} className={inputClass} placeholder="Vazio = Regra do parceiro" />
            </div>
            <div>
              <label className={labelClass}>Base de Incidência</label>
              <select value={formData.base_comissao || ''} onChange={e => setFormData({...formData, base_comissao: e.target.value})} className={selectClass}>
                <option value="">-- Regra do Parceiro --</option>
                <option value="total">Sobre Valor Total (Programa + Extras)</option>
                <option value="apenas_programa">Apenas sobre Programa</option>
                <option value="sem_comissao">Isento (0%)</option>
              </select>
            </div>
            
            <div>
              <label className={labelClass}>Anexo 1: Modalidade de Reserva</label>
              <select value={formData.modalidade_reserva} onChange={e => setFormData({...formData, modalidade_reserva: e.target.value})} className={selectClass}>
                <option value="direta">Reserva Direta (Checkout)</option>
                <option value="email">Sob Consulta (E-mail)</option>
                <option value="link_externo">Link Externo / Google Forms</option>
              </select>
              {formData.modalidade_reserva === 'link_externo' && (
                 <input type="url" placeholder="URL do Formulário Oficial..." value={formData.link_externo_reserva || ''} onChange={e => setFormData({...formData, link_externo_reserva: e.target.value})} className={`${inputClass} mt-3 !border-blue-400 focus:!border-blue-600 bg-blue-50/30`} />
              )}
            </div>

            <div>
              <label className={labelClass}>Anexo 2: Pagamento</label>
              <select value={formData.tipo_pagamento} onChange={e => setFormData({...formData, tipo_pagamento: e.target.value})} className={selectClass}>
                <option value="100_total">100% no Ato</option>
                <option value="50_sinal">Sinal 50% Agora + Restante 7 Dias Antes</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Anexo 3: Cancelamento</label>
              <select value={formData.politica_cancelamento} onChange={e => setFormData({...formData, politica_cancelamento: e.target.value})} className={selectClass}>
                <option value="Flexível (Reembolso a 100% até 7 dias antes)">Flexível (100% a 7 dias)</option>
                <option value="Moderada (Reembolso a 50% até 15 dias antes)">Moderada (50% a 15 dias)</option>
                <option value="Estrita (Sem reembolso após reserva)">Estrita (Sem reembolso)</option>
              </select>
            </div>

            <div className="sm:col-span-2 border-t border-amber-200/50 pt-6 mt-2">
              <label className={labelClass}>Upload de Contrato de Parceiro Assinado (PDF)</label>
              {formData.contrato_parceiro_url && (
                <div className="mb-4 p-3 bg-amber-100 rounded-xl text-xs font-black text-amber-900 border border-amber-200 flex items-center justify-between">
                  <span>✅ Contrato Específico anexado</span>
                  <a href={formData.contrato_parceiro_url} target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-950 underline">Ver Documento</a>
                </div>
              )}
              {statusContratoGlobal === 'Aprovado' && !formData.contrato_parceiro_url && (
                <div className="mb-4 p-4 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-800 border border-emerald-200 shadow-sm flex items-center gap-3">
                  <span className="text-xl">✅</span> Este programa está legalmente protegido e coberto pelo Contrato Global do Parceiro. Não precisa de anexar outro documento.
                </div>
              )}
              <input type="file" accept=".pdf" onChange={handleContratoSelect} className="w-full p-4 bg-white rounded-xl border border-dashed border-amber-300 font-bold text-slate-500 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 2. INFORMAÇÕES BÁSICAS                     */}
        {/* ========================================== */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 tracking-tight">1. Informações Básicas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2"><label className={labelClass}>Nome do Campo</label><input type="text" required value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Categoria</label>
              <select required value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})} className={selectClass}>
                <option value="">Selecione...</option><option value="Desporto">Desporto</option><option value="Aventura & Natureza">Aventura & Natureza</option><option value="Tecnologia & Ciência">Tecnologia & Ciência</option><option value="Artes & Criatividade">Artes & Criatividade</option><option value="Línguas">Línguas</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Idade Min.</label><input type="number" required value={formData.idade_min} onChange={e => setFormData({...formData, idade_min: Number(e.target.value)})} className={inputClass} /></div>
              <div><label className={labelClass}>Idade Max.</label><input type="number" required value={formData.idade_max} onChange={e => setFormData({...formData, idade_max: Number(e.target.value)})} className={inputClass} /></div>
            </div>

            <div><label className={labelClass}>Vagas Máximas</label><input type="number" required value={formData.vagas_totais} onChange={e => setFormData({...formData, vagas_totais: Number(e.target.value)})} className={inputClass} /></div>
            
            <div className="sm:col-span-2">
              <label className={labelClass}>Línguas Faladas</label>
              <div className="flex gap-4 flex-wrap mt-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={linguas.pt} onChange={() => handleLinguasChange('pt')} /> Português</label>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={linguas.en} onChange={() => handleLinguasChange('en')} /> Inglês</label>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={linguas.es} onChange={() => handleLinguasChange('es')} /> Espanhol</label>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={linguas.fr} onChange={() => handleLinguasChange('fr')} /> Francês</label>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={linguas.de} onChange={() => handleLinguasChange('de')} /> Alemão</label>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 3. LOCALIZAÇÃO                             */}
        {/* ========================================== */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 tracking-tight">2. Localização</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>País</label>
              <select required value={pais} onChange={e => { setPais(e.target.value); setMapPreview(null); if (e.target.value !== "Portugal") setFormData({...formData, Distrito: ""}); }} className={selectClass}>
                {paises.map(p => <option key={p.pt} value={p.pt}>{p.pt}</option>)}
              </select>
            </div>
            {pais === "Portugal" && (
              <div>
                <label className={labelClass}>Distrito</label>
                <select required value={formData.Distrito || ''} onChange={e => { setFormData({...formData, Distrito: e.target.value}); setMapPreview(null); }} className={selectClass}>
                  <option value="">Selecione...</option>{distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div className="sm:col-span-2 relative">
              <label className={labelClass}>Morada Específica (Pressione Enter para pesquisar no mapa)</label>
              <input type="text" required value={formData.local || ''} onChange={e => { setFormData({...formData, local: e.target.value}); setMapPreview(null); }} onBlur={buscarNoMapaManual} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); buscarNoMapaManual(); } }} className={inputClass} placeholder="Nome da rua, número, cidade..." />
              {addressSuggestions.length > 0 && !mapPreview && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1 z-20 shadow-xl max-h-[200px] overflow-y-auto">
                  {addressSuggestions.map((sugestao, index) => (
                    <div key={index} onClick={() => { setFormData({ ...formData, local: sugestao.display_name }); setMapPreview({ lat: parseFloat(sugestao.lat), lon: parseFloat(sugestao.lon) }); setAddressSuggestions([]); }} className="p-3 cursor-pointer text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0 font-medium">
                      {sugestao.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {mapPreview && (
            <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 h-[250px]">
              <iframe width="100%" height="100%" frameBorder="0" scrolling="no" src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapPreview.lon-0.005},${mapPreview.lat-0.005},${mapPreview.lon+0.005},${mapPreview.lat+0.005}&layer=mapnik&marker=${mapPreview.lat},${mapPreview.lon}`}></iframe>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* 4. MOTOR DE ESTRUTURA E PACOTES            */}
        {/* ========================================== */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 tracking-tight">3. Calendário e Motor de Vendas</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div>
              <label className={labelClass}>Data Início do Campo</label>
              <input type="date" value={formData.calendario_funcionamento.data_inicio || ''} onChange={e => setFormData({ ...formData, calendario_funcionamento: { ...formData.calendario_funcionamento, data_inicio: e.target.value } })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Data Fim do Campo</label>
              <input type="date" value={formData.calendario_funcionamento.data_fim || ''} onChange={e => setFormData({ ...formData, calendario_funcionamento: { ...formData.calendario_funcionamento, data_fim: e.target.value } })} className={inputClass} />
            </div>
          </div>

          <div className="mb-10">
            <label className={labelClass}>Dias da Semana Operacionais</label>
            <div className="flex flex-wrap gap-2 mt-3">
              {DIAS_SEMANA.map(dia => (
                <button type="button" key={dia.id} onClick={() => toggleDiaSemana(dia.id)} className={`px-4 py-2.5 rounded-xl border text-xs font-black transition-colors shadow-sm ${formData.calendario_funcionamento.dias_semana.includes(dia.id) ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                  {dia.pt}
                </button>
              ))}
            </div>
          </div>

          {/* PACOTES EDITÁVEIS HQ */}
          <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-200 mb-8 shadow-inner">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest m-0">Pacotes Configurados ({pacotes.length})</p>
              <button type="button" onClick={() => setIsPacoteModalOpen(true)} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm">
                + Adicionar Pacote
              </button>
            </div>
            {pacotes.length === 0 ? <p className="text-sm font-bold text-slate-400 italic bg-white p-6 rounded-xl border border-dashed border-slate-200 text-center">Nenhum pacote definido.</p> : (
              <div className="flex flex-col gap-4">
                {pacotes.map((pac: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <strong className="text-slate-900 text-base font-black">{pac.titulo}</strong> 
                      <span className="text-slate-500 text-[10px] uppercase tracking-widest ml-2 bg-slate-100 px-2 py-1 rounded-md">({pac.tipo} Qtd: {pac.quantidade})</span>
                      <div className="mt-3 text-xs text-emerald-600 font-bold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                        {pac.variantes?.map((v: any) => `${v.nome}: ${v.preco}€`).join(' | ')}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <button type="button" onClick={() => { setNovoPacote(pac); setIsPacoteModalOpen(true); }} className="flex-1 sm:flex-none px-4 py-2 bg-blue-50 text-blue-700 font-bold text-[10px] uppercase tracking-widest border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">Editar</button>
                      <button type="button" onClick={() => eliminarPacote(pac.id)} className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-700 font-bold text-[10px] uppercase tracking-widest border border-red-200 rounded-lg hover:bg-red-100 transition-colors">Apagar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DESCONTOS EDITÁVEIS HQ */}
          <div className="pt-8 border-t-2 border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-black text-slate-900 m-0 tracking-tight">Códigos de Desconto</h2>
              <button type="button" onClick={() => setIsDescontoModalOpen(true)} className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-xl font-bold transition-colors text-xs uppercase tracking-widest shadow-sm">
                + Adicionar Desconto
              </button>
            </div>
            {descontos.length === 0 ? <p className="text-sm font-bold text-slate-400 italic bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 text-center">Nenhum desconto configurado.</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {descontos.map((desc, idx) => (
                  <div key={idx} className="p-5 bg-emerald-50 border-2 border-emerald-200 rounded-xl relative shadow-sm hover:-translate-y-1 transition-transform">
                    <p className="m-0 mb-2 font-black text-sm text-emerald-900">{desc.nome}</p>
                    <p className="m-0 text-xs font-bold text-emerald-700 bg-white inline-block px-2 py-1 rounded-md border border-emerald-100">{desc.percentagem}% | {desc.acumulavel ? 'Acumulável' : 'Único'}</p>
                    <button type="button" onClick={() => eliminarDesconto(desc.id)} className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center bg-white text-red-500 rounded-full border border-red-100 hover:bg-red-50 font-black cursor-pointer shadow-sm text-xs">&times;</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* 5. TEXTOS LOGÍSTICOS E EXTRAS              */}
        {/* ========================================== */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 tracking-tight">4. Logística e Extras Opcionais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div><label className={labelClass}>Rácio Monitores</label><input type="text" value={formData.racio_monitores || ''} onChange={e => setFormData({...formData, racio_monitores: e.target.value})} className={inputClass} placeholder="Ex: 1 monitor para cada 10 jovens" /></div>
            <div><label className={labelClass}>Alimentação (Texto)</label><input type="text" value={formData.alimentacao || ''} onChange={e => setFormData({...formData, alimentacao: e.target.value})} className={inputClass} placeholder="Ex: Almoço e 2 lanches incluídos" /></div>
            <div><label className={labelClass}>Alojamento (Texto)</label><input type="text" value={formData.alojamento || ''} onChange={e => setFormData({...formData, alojamento: e.target.value})} className={inputClass} placeholder="Ex: Tendas partilhadas (4 px)" /></div>
            <div><label className={labelClass}>Seguro Geral (Texto)</label><input type="text" value={formData.seguro || ''} onChange={e => setFormData({...formData, seguro: e.target.value})} className={inputClass} placeholder="Ex: Seguro Acidentes Pessoais Ativo" /></div>
            
            <div className="sm:col-span-2 border-t border-slate-100 my-4 pt-8">
              <label className="block text-sm font-black text-slate-900 mb-4">Valores Extra (Suplementos no Checkout)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <label className={`${labelClass} !text-slate-700`}>Seguro Extra Opcional (€)</label>
                  <div className="flex gap-3 mt-3">
                    <input type="number" value={formData.extra_seguro || 0} onChange={e => setFormData({...formData, extra_seguro: Number(e.target.value)})} className={`${inputClass} flex-1 font-black text-blue-600`} />
                    <select value={formData.tipo_extra_seguro || 'fixo'} onChange={e => setFormData({...formData, tipo_extra_seguro: e.target.value})} className={`${selectClass} flex-1`}><option value="fixo">Taxa Fixa Única</option><option value="diario">Por Cada Dia</option></select>
                  </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <label className={`${labelClass} !text-slate-700`}>Transporte Opcional (€)</label>
                  <div className="flex gap-3 mt-3">
                    <input type="number" value={formData.extra_transporte || 0} onChange={e => setFormData({...formData, extra_transporte: Number(e.target.value)})} className={`${inputClass} flex-1 font-black text-blue-600`} />
                    <select value={formData.tipo_extra_transporte || 'diario'} onChange={e => setFormData({...formData, tipo_extra_transporte: e.target.value})} className={`${selectClass} flex-1`}><option value="fixo">Taxa Fixa Única</option><option value="diario">Por Cada Dia</option></select>
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 mt-4"><label className={labelClass}>Descrição Completa da Atividade</label><textarea rows={6} value={formData.descricao || ''} onChange={e => setFormData({...formData, descricao: e.target.value})} className={textareaClass} placeholder="Escreva um texto cativante sobre o que os jovens vão fazer..." /></div>
            <div className="sm:col-span-2"><label className={labelClass}>Regras e Termos (Anexados no Checkout)</label><textarea rows={4} value={formData.regras_termos || ''} onChange={e => setFormData({...formData, regras_termos: e.target.value})} className={textareaClass} placeholder="Regras de comportamento, vestuário necessário, etc." /></div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 6. GALERIA E PERGUNTAS                     */}
        {/* ========================================== */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 tracking-tight">5. Media e Formulários</h2>
          
          <div className="mb-10">
            <label className="flex items-center justify-center h-32 cursor-pointer bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl transition-colors group">
              <span className="font-black text-slate-500 group-hover:text-blue-600 uppercase tracking-widest text-xs flex flex-col items-center gap-2"><span className="text-3xl">📸</span> Clicar para anexar fotografias</span>
              <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
              {images.map((img, idx) => (
                <div key={idx} className={`relative rounded-2xl overflow-hidden h-32 shadow-sm ${img.isMain ? 'border-4 border-[#059669]' : 'border border-slate-200'}`}>
                  <img src={img.preview} className="w-full h-full object-cover" alt={`Preview ${idx}`} />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center border-2 border-white shadow-sm font-black cursor-pointer hover:bg-red-700 transition-colors">&times;</button>
                  {!img.isMain && <button type="button" onClick={() => setMainImage(idx)} className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest py-1.5 rounded-lg border border-white/20 hover:bg-slate-900 transition-colors cursor-pointer">Principal</button>}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-slate-100 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <label className="block text-sm font-black text-slate-900 mb-1">Perguntas Personalizadas ao Pai</label>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest m-0">Aparecem obrigatoriamente no momento do checkout.</p>
              </div>
              <button type="button" onClick={addPergunta} className="w-full sm:w-auto bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-colors">+ Adicionar Pergunta</button>
            </div>
            <div className="flex flex-col gap-4">
              {perguntas.map((p, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <input type="text" value={p || ''} onChange={e => updatePergunta(i, e.target.value)} className={`${inputClass} flex-1 shadow-sm`} placeholder="Escreva a pergunta... (Ex: Nível de Surf?)" />
                  <button type="button" onClick={() => removePergunta(i)} className="w-12 h-12 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl cursor-pointer font-black transition-colors shadow-sm">&times;</button>
                </div>
              ))}
            </div>
          </div>

          {/* DOCUMENTOS PDF DO CAMPO */}
          <div className="border-t-2 border-slate-100 pt-8 mt-10">
            <label className="block text-sm font-black text-slate-900 mb-1">Brochuras e PDF do Programa</label>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Disponíveis para os pais descarregarem na página do campo.</p>
            
            <div className="flex flex-col gap-4 items-start">
              {documentosExistentes.map((doc, idx) => (
                <div key={`exist-${idx}`} className="flex justify-between items-center bg-slate-50 px-5 py-3.5 rounded-xl border border-slate-200 w-full shadow-sm">
                  <span className="font-bold text-sm text-slate-700 truncate pr-4">📄 {doc.nome} <span className="text-[10px] bg-slate-200 px-2 py-1 rounded ml-2 uppercase tracking-widest">Atual</span></span>
                  <button type="button" onClick={() => removeDocExistente(idx)} className="text-red-500 hover:text-red-700 font-black text-xl transition-colors">&times;</button>
                </div>
              ))}
              {documentos.map((doc, idx) => (
                <div key={`novo-${idx}`} className="flex justify-between items-center bg-emerald-50 px-5 py-3.5 rounded-xl border border-emerald-200 w-full shadow-sm">
                  <span className="font-bold text-sm text-emerald-800 truncate pr-4">📄 {doc.name} <span className="text-[10px] bg-emerald-200 px-2 py-1 rounded ml-2 uppercase tracking-widest text-emerald-900">Novo</span></span>
                  <button type="button" onClick={() => removeNovoDoc(idx)} className="text-red-500 hover:text-red-700 font-black text-xl transition-colors">&times;</button>
                </div>
              ))}
              <label className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer transition-colors shadow-sm mt-2 inline-block">
                + Anexar Ficheiro (PDF, DOC) 
                <input type="file" accept=".pdf,.doc,.docx" multiple onChange={handleDocSelect} className="hidden" />
              </label>
            </div>
          </div>

        </div>

        <button type="submit" disabled={saving} className={`w-full py-5 text-sm uppercase tracking-widest font-black rounded-2xl shadow-xl transition-all ${saving ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 hover:-translate-y-1'}`}>
          {saving ? statusText : 'Guardar Alterações e Sincronizar'}
        </button>
      </form>

      {/* ========================================== */}
      {/* MODAL: PACOTES */}
      {/* ========================================== */}
      {isPacoteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="font-black text-slate-900 text-xl m-0 tracking-tight">{novoPacote.id ? 'Editar Pacote (HQ)' : 'Novo Pacote (HQ)'}</h3>
              <button type="button" onClick={() => setIsPacoteModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-black transition-colors">&times;</button>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-8 overflow-y-auto bg-slate-50">
              <div>
                <label className={labelClass}>Lógica de Reserva (Atenção ao Checkout)</label>
                <div className="flex gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm mt-2">
                  <button type="button" onClick={() => setNovoPacote({...novoPacote, tipo: 'semana'})} className={`flex-1 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${novoPacote.tipo === 'semana' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Semanas</button>
                  <button type="button" onClick={() => setNovoPacote({...novoPacote, tipo: 'dia'})} className={`flex-1 py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${novoPacote.tipo === 'dia' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Dias Soltos</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className={labelClass}>Nome do Passe / Pacote</label>
                  <input type="text" value={novoPacote.titulo} onChange={e => setNovoPacote({...novoPacote, titulo: e.target.value})} className={inputClass} placeholder="Ex: Pack Verão Total" />
                </div>
                <div>
                  <label className={labelClass}>Qtd ({novoPacote.tipo === 'semana' ? 'Sem' : 'Dias'})</label>
                  <input type="number" min="1" value={novoPacote.quantidade} onChange={e => setNovoPacote({...novoPacote, quantidade: Number(e.target.value)})} className={`${inputClass} text-center !text-blue-600 font-black`} />
                </div>
              </div>

              <div className="border-t-2 border-slate-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-black text-slate-900 m-0">Variantes e Preços Base</label>
                  <button type="button" onClick={adicionarVariante} className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors">+ Variante</button>
                </div>
                <div className="flex flex-col gap-3">
                  {novoPacote.variantes.map((v, i) => (
                    <div key={i} className="flex gap-3 items-center bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
                      <input type="text" value={v.nome} onChange={e => atualizarVariante(i, 'nome', e.target.value)} placeholder="Ex: C/ Dormida" className="flex-[2] px-4 py-3 bg-transparent border-none text-sm font-bold text-slate-700 outline-none" />
                      <div className="flex-[1] flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3">
                        <input type="number" min="0" value={v.preco} onChange={e => atualizarVariante(i, 'preco', Number(e.target.value))} className="w-full py-3 bg-transparent border-none text-right font-black text-blue-600 outline-none text-base" />
                        <span className="text-xs font-black text-slate-400 ml-1">€</span>
                      </div>
                      {novoPacote.variantes.length > 1 && (
                        <button type="button" onClick={() => removerVariante(i)} className="w-12 h-[46px] rounded-lg border-none bg-red-50 text-red-500 hover:bg-red-100 font-black cursor-pointer transition-colors">&times;</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-slate-200 bg-white flex justify-end gap-3 flex-shrink-0">
              <button type="button" onClick={() => setIsPacoteModalOpen(false)} className="px-6 py-3 rounded-xl font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors text-sm shadow-sm">Cancelar</button>
              <button type="button" onClick={guardarPacote} className="px-8 py-3 rounded-xl font-black border-none bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-colors text-sm">Guardar Pacote</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DESCONTOS */}
      {isDescontoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="font-black text-slate-900 text-xl m-0 tracking-tight">Novo Desconto (HQ)</h3>
              <button type="button" onClick={() => setIsDescontoModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-black transition-colors">&times;</button>
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-6 bg-slate-50">
              <div>
                <label className={labelClass}>Nome do Desconto (Visível no Carrinho)</label>
                <input type="text" value={novoDesconto.nome} onChange={e => setNovoDesconto({...novoDesconto, nome: e.target.value})} className={inputClass} placeholder="Ex: Desconto Irmãos" />
              </div>
              <div>
                <label className={labelClass}>Percentagem a Retirar (%)</label>
                <input type="number" min="1" max="100" value={novoDesconto.percentagem} onChange={e => setNovoDesconto({...novoDesconto, percentagem: Number(e.target.value)})} className={`${inputClass} !font-black !text-xl !text-emerald-600`} />
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center cursor-pointer hover:border-blue-300 transition-colors" onClick={() => setNovoDesconto({...novoDesconto, acumulavel: !novoDesconto.acumulavel})}>
                <div>
                  <p className="m-0 mb-1 font-black text-slate-900 text-sm">É Acumulável?</p>
                  <p className="m-0 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Soma com outros códigos no carrinho.</p>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${novoDesconto.acumulavel ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${novoDesconto.acumulavel ? 'left-7' : 'left-1'}`}></div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-slate-200 bg-white flex justify-end gap-3 flex-shrink-0">
              <button type="button" onClick={() => setIsDescontoModalOpen(false)} className="px-6 py-3 rounded-xl font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors text-sm shadow-sm">Cancelar</button>
              <button type="button" onClick={guardarDesconto} className="px-8 py-3 rounded-xl font-black border-none bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-colors text-sm">Validar Desconto</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
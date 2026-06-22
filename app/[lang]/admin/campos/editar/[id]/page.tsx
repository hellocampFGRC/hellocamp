"use client";

import { useState, useEffect, useRef, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import imageCompression from 'browser-image-compression';
import Link from "next/link";
import React from "react";

// --- TIPAGENS ---
type ImagePreview = { file?: File; url?: string; preview: string; isMain: boolean; };
type OpcaoVenda = { id: number; tipo_venda: string; horario: string; preco: number; };
type BlocoDatas = { id: number; nome: string; data_inicio: string; data_fim: string; vagas: number; excluir_fins_semana: boolean; opcoes: OpcaoVenda[]; };

// --- CONSTANTES ---
const FOTOS_PADRAO = [
  { url: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1200&auto=format&fit=crop", nome: "Surf / Aquáticos" },
  { url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1200&auto=format&fit=crop", nome: "Acampamento" },
  { url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop", nome: "Tecnologia" },
  { url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1200&auto=format&fit=crop", nome: "Artes / Pintura" },
  { url: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop", nome: "Desporto" },
  { url: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?q=80&w=1200&auto=format&fit=crop", nome: "Diversão" },
  { url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1200&auto=format&fit=crop", nome: "Inglês / Londres" }
];

const PERGUNTAS_SUGERIDAS: Record<string, string[]> = {
  "Desporto": ["Qual o nível de experiência do participante na modalidade?", "É federado nalgum clube?", "Qual o peso e altura? (Para preparação de equipamentos)", "Traz equipamento próprio ou precisa de alugar?"],
  "Aventura & Natureza": ["A criança tem experiência prévia a dormir em tendas?", "Tem saco de cama e esteira próprios?", "Existe algum fobia relevante? (ex: escuro, alturas)"],
  "Tecnologia & Ciência": ["Qual o nível de conhecimentos de informática da criança?", "Vai trazer equipamento próprio (Portátil/Tablet)?", "Qual o sistema operativo que utiliza habitualmente?"],
  "Artes & Criatividade": ["Toca algum instrumento musical? Se sim, qual?", "Tem experiência prévia com teatro ou dança?", "Traz os seus próprios materiais de expressão plástica?"],
  "Línguas": ["O participante já estudou este idioma antes?", "Se sim, qual o nível de proficiência atual estimado?", "Fez algum exame oficial recentemente?"]
};

const PERGUNTAS_GERAIS = ["Autoriza saída sozinha?", "Outra pessoa vai recolher?"];

const sanitizeFileName = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-]/g, "_");

export default function EditarCampo({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const resolvedParams = use(params);
  const { lang, id } = resolvedParams;
  
  const router = useRouter();
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  
  const isFirstRender = useRef(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
  
  // Imagens & Docs
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [usarFotoPadrao, setUsarFotoPadrao] = useState(false);
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [documentosExistentes, setDocumentosExistentes] = useState<{nome: string, url: string}[]>([]);
  
  // Localização
  const [mapPreview, setMapPreview] = useState<{lat: number, lon: number} | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [pais, setPais] = useState("Portugal");

  // Detalhes Conceptuais
  const [linguas, setLinguas] = useState({ pt: false, en: false, es: false, fr: false, de: false });
  const [faixasSelecionadas, setFaixasSelecionadas] = useState({ ca6_9: false, ca10_13: false, ca14_17: false, outra: false });
  const [idadeManual, setIdadeManual] = useState("");
  const [perguntasCustomizadas, setPerguntasCustomizadas] = useState<string[]>([]);

  // Motor de Blocos (Novo)
  const [blocos, setBlocos] = useState<BlocoDatas[]>([]);

  const [formData, setFormData] = useState({
    nome: "", categoria: "", local: "", Distrito: "", racio_monitores: "", duracao_dias: 7,
    alimentacao: "Não tem", alojamento: "Não tem", seguro: "Incluído no Preço", 
    politica_cancelamento: "Moderada (Reembolso a 50% até 15 dias antes)",
    tipo_pagamento: "100_total",
    descricao: "", regras_termos: "",
    extra_alimentacao: 0, tipo_cobranca_alimentacao: "Por Turno", extra_alojamento: 0, tipo_cobranca_alojamento: "Por Turno",
    extra_prolongamento: 0, tipo_cobranca_prolongamento: "Por Turno", extra_transporte: 0, tipo_cobranca_transporte: "Por Turno",
    imagem: "", galeria: [] as string[]
  });

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];
  const paises = [{ pt: "Portugal", en: "Portugal" }, { pt: "Espanha", en: "Spain" }, { pt: "Outro", en: "Other" }];

  // ==========================================
  // FETCH INICIAL E RECONSTRUÇÃO DE BLOCOS
  // ==========================================
  useEffect(() => {
    const fetchCampo = async () => {
      const { data, error } = await supabase.from('campos').select('*').eq('id', id).single();
      if (data) {
        setFormData({
          ...data,
          politica_cancelamento: data.politica_cancelamento || "Moderada (Reembolso a 50% até 15 dias antes)",
          tipo_pagamento: data.tipo_pagamento || "100_total",
          imagem: data.imagem || "",
          galeria: data.galeria || []
        });
        
        if (data.idade) {
          const idadesGuardadas = data.idade.split(",").map((s: string) => s.trim());
          const c6_9 = idadesGuardadas.includes("6-9 anos");
          const c10_13 = idadesGuardadas.includes("10-13 anos");
          const c14_17 = idadesGuardadas.includes("14-17 anos");
          const padroes = ["6-9 anos", "10-13 anos", "14-17 anos"];
          const customizadas = idadesGuardadas.filter((s: string) => !padroes.includes(s));
          
          setFaixasSelecionadas({ ca6_9: c6_9, ca10_13: c10_13, ca14_17: c14_17, outra: customizadas.length > 0 });
          if (customizadas.length > 0) setIdadeManual(customizadas.join(", "));
        }

        // --- ENGENHARIA REVERSA: RECONSTRUIR OS BLOCOS A PARTIR DA LISTA PLANA ---
        if (data.turnos && data.turnos.length > 0) {
          const blocosReconstruidos = reconstruirBlocosDaBaseDeDados(data.turnos);
          setBlocos(blocosReconstruidos);
        } else {
          // Fallback se estiver vazio
          setBlocos([{ id: Date.now(), nome: "", data_inicio: "", data_fim: "", vagas: 20, excluir_fins_semana: true, opcoes: [{ id: Date.now() + 1, tipo_venda: "pacote", horario: "Dia Completo", preco: 0 }] }]);
        }

        if (data.perguntas_customizadas) setPerguntasCustomizadas(data.perguntas_customizadas);
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

  // Função Auxiliar para empacotar a BD de volta no Formulário
  const reconstruirBlocosDaBaseDeDados = (turnosPlano: any[]) => {
    const mapaBlocos = new Map<string, BlocoDatas>();
    let counterId = 1;

    turnosPlano.forEach(t => {
      // Nome base sem sufixos
      const nomeBase = t.nome.split('(')[0].split('- Dia')[0].split('- Day')[0].trim();
      
      let horarioEncontrado = "Dia Completo";
      if (t.nome.includes("Manhã") || t.nome.includes("Morning")) horarioEncontrado = "Só Manhã";
      else if (t.nome.includes("Tarde") || t.nome.includes("Afternoon")) horarioEncontrado = "Só Tarde";

      const isDiaSolto = t.nome.includes("- Dia ") || t.nome.includes("- Day ");
      const tipoVenda = isDiaSolto ? "dias_soltos" : "pacote";

      if (!mapaBlocos.has(nomeBase)) {
        mapaBlocos.set(nomeBase, {
          id: counterId++,
          nome: nomeBase,
          data_inicio: t.data_inicio,
          data_fim: t.data_fim,
          vagas: Number(t.vagas) || 20,
          excluir_fins_semana: true, // Assumimos true por defeito
          opcoes: []
        });
      }

      const bloco = mapaBlocos.get(nomeBase)!;
      
      // Expande as datas do bloco se encontrar extremos maiores
      if (t.data_inicio < bloco.data_inicio) bloco.data_inicio = t.data_inicio;
      if (t.data_fim > bloco.data_fim) bloco.data_fim = t.data_fim;

      // Adiciona a Opção se não existir
      const opcaoExiste = bloco.opcoes.find(o => o.tipo_venda === tipoVenda && o.horario === horarioEncontrado);
      if (!opcaoExiste) {
        bloco.opcoes.push({
          id: counterId++,
          tipo_venda: tipoVenda,
          horario: horarioEncontrado,
          preco: Number(t.preco) || 0
        });
      }
    });

    return Array.from(mapaBlocos.values());
  };

  // ==========================================
  // HANDLERS (FOTOS, MAPA, LÍNGUAS, ETC)
  // ==========================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file, index) => ({ file, preview: URL.createObjectURL(file), isMain: images.length === 0 && index === 0 }));
      setImages(prev => [...prev, ...newImages]); setUsarFotoPadrao(false);
    }
  };
  const selecionarFotoPadrao = (url: string) => { setImages([{ url, preview: url, isMain: true }]); setUsarFotoPadrao(true); };
  const removeImage = (indexToRemove: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, idx) => idx !== indexToRemove);
      if (prev[indexToRemove]?.isMain && newImages.length > 0) newImages[0].isMain = true;
      if (newImages.length === 0) setUsarFotoPadrao(false);
      return newImages;
    });
  };
  const setMainImage = (indexToMain: number) => setImages(prev => prev.map((img, idx) => ({ ...img, isMain: idx === indexToMain })));
  
  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setDocumentos(prev => [...prev, ...Array.from(e.target.files as FileList)]); };
  const removeNovoDoc = (indexToRemove: number) => setDocumentos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  const removeDocExistente = (indexToRemove: number) => setDocumentosExistentes(prev => prev.filter((_, idx) => idx !== indexToRemove));

  const handleLinguasChange = (langKey: keyof typeof linguas) => setLinguas(prev => ({ ...prev, [langKey]: !prev[langKey] }));
  const getLinguasString = () => Object.entries(linguas).filter(([_, v]) => v).map(([k]) => k.toUpperCase()).join(", ");
  const handleFaixasChange = (key: keyof typeof faixasSelecionadas) => { setFaixasSelecionadas(prev => ({ ...prev, [key]: !prev[key] })); };
  
  const construirStringIdades = () => {
    const lista = [];
    if (faixasSelecionadas.ca6_9) lista.push("6-9 anos");
    if (faixasSelecionadas.ca10_13) lista.push("10-13 anos");
    if (faixasSelecionadas.ca14_17) lista.push("14-17 anos");
    if (faixasSelecionadas.outra && idadeManual.trim()) lista.push(idadeManual.trim());
    return lista.join(", ");
  };

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

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (formData.local.length > 4 && !mapPreview) {
        try {
          const queryStr = pais === "Portugal" && formData.Distrito ? `${formData.local}, ${formData.Distrito}, ${pais}` : `${formData.local}, ${pais}`;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=5`);
          const data = await res.json();
          setAddressSuggestions(data || []);
        } catch (e) { console.error(e); }
      } else { setAddressSuggestions([]); }
    }, 600);
    return () => clearTimeout(delayDebounce);
  }, [formData.local, formData.Distrito, pais]);

  // ==========================================
  // HANDLERS MOTOR DE BLOCOS
  // ==========================================
  const handleAddBloco = () => setBlocos([...blocos, { id: Date.now(), nome: "", data_inicio: "", data_fim: "", vagas: 20, excluir_fins_semana: true, opcoes: [{ id: Date.now() + 1, tipo_venda: "pacote", horario: "Dia Completo", preco: 0 }] }]);
  const handleRemoveBloco = (idBloco: number) => setBlocos(blocos.filter(b => b.id !== idBloco));
  const handleBlocoChange = (idBloco: number, field: keyof BlocoDatas, value: any) => setBlocos(blocos.map(b => b.id === idBloco ? { ...b, [field]: value } : b));
  const handleAddOpcao = (idBloco: number) => setBlocos(blocos.map(b => b.id === idBloco ? { ...b, opcoes: [...b.opcoes, { id: Date.now(), tipo_venda: "pacote", horario: "Dia Completo", preco: 0 }] } : b));
  const handleRemoveOpcao = (idBloco: number, idOpcao: number) => setBlocos(blocos.map(b => b.id === idBloco ? { ...b, opcoes: b.opcoes.filter(o => o.id !== idOpcao) } : b));
  const handleOpcaoChange = (idBloco: number, idOpcao: number, field: keyof OpcaoVenda, value: any) => setBlocos(blocos.map(b => b.id === idBloco ? { ...b, opcoes: b.opcoes.map(o => o.id === idOpcao ? { ...o, [field]: value } : o) } : b));

  // ==========================================
  // HANDLERS PERGUNTAS
  // ==========================================
  const handleAddPergunta = () => setPerguntasCustomizadas([...perguntasCustomizadas, ""]);
  const handleRemovePergunta = (index: number) => setPerguntasCustomizadas(perguntasCustomizadas.filter((_, i) => i !== index));
  const handlePerguntaChange = (index: number, val: string) => {
    const novas = [...perguntasCustomizadas]; novas[index] = val; setPerguntasCustomizadas(novas);
  };
  const adicionarPerguntaSugerida = (pergunta: string) => { 
    if (!perguntasCustomizadas.includes(pergunta)) setPerguntasCustomizadas([...perguntasCustomizadas, pergunta]); 
  };
  const sugestoesAtuais = formData.categoria ? PERGUNTAS_SUGERIDAS[formData.categoria as keyof typeof PERGUNTAS_SUGERIDAS] || [] : [];

  // ==========================================
  // SUBMIT (AUTO-SAVE E MANUAL)
  // ==========================================
  const handleUpdate = async (e?: React.FormEvent, isAutoSave = false) => {
    if (e) e.preventDefault();
    
    const stringIdadesCompleta = construirStringIdades();

    if (!mapPreview || images.length === 0 || !stringIdadesCompleta) {
      if (!isAutoSave) {
        if (!mapPreview) alert(isEn ? "Ensure the map is loaded." : "Garanta que o mapa carregou.");
        else if (images.length === 0) alert(isEn ? "Select a photo." : "Adicione uma fotografia.");
        else alert(isEn ? "Select or enter an age range." : "Selecione ou digite uma faixa etária.");
      } else { setAutoSaveStatus('error'); }
      return;
    }

    // Validação Blocos
    for (const b of blocos) {
      if (b.opcoes.length === 0) { 
        if (!isAutoSave) alert(`Adicione opções de compra ao bloco "${b.nome}".`);
        return; 
      }
    }

    if (!isAutoSave) setSaving(true);
    else setAutoSaveStatus('saving');

    try {
      // 1. Imagens e Documentos
      let mainImageUrl: string = formData.imagem;
      let galeriaUrls: string[] = formData.galeria || [];

      if (!isAutoSave) {
        setStatusText(isEn ? "Processing images..." : "A processar fotografias...");
        const uploadedImages = await Promise.all(images.map(async (img) => {
          if (!img.file) return { url: img.url || "", isMain: img.isMain };
          const compressedFile = await imageCompression(img.file, { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true });
          const fileName = `${Date.now()}-${sanitizeFileName(compressedFile.name)}`;
          const { error } = await supabase.storage.from('campos-imagens').upload(fileName, compressedFile);
          if (error) throw error;
          const { data: publicUrlData } = supabase.storage.from('campos-imagens').getPublicUrl(fileName);
          return { url: publicUrlData.publicUrl, isMain: img.isMain };
        }));

        mainImageUrl = uploadedImages.find(i => i.isMain)?.url || uploadedImages[0]?.url || "";
        galeriaUrls = uploadedImages.filter(i => !i.isMain).map(i => i.url || "").filter(url => url !== "");
      }

      const novosDocs = await Promise.all(documentos.map(async (doc) => {
        const fileName = `${Date.now()}-${sanitizeFileName(doc.name)}`;
        const { error } = await supabase.storage.from('campos-documentos').upload(fileName, doc);
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('campos-documentos').getPublicUrl(fileName);
        return { nome: doc.name, url: publicUrlData.publicUrl };
      }));

      const programasDocsFinais = [...documentosExistentes, ...novosDocs];
      if (novosDocs.length > 0) { setDocumentosExistentes(programasDocsFinais); setDocumentos([]); }

      // 2. Motor Gerador de Turnos (Matriz BD)
      const turnosFinaisPT: any[] = [];
      const turnosFinaisEN: any[] = [];
      let precoMaisBaixo = Infinity;

      blocos.forEach(bloco => {
        bloco.opcoes.forEach(opcao => {
          if (opcao.preco <= 0) return;

          let horarioEN = opcao.horario;
          if (opcao.horario === "Dia Completo") horarioEN = "Full Day";
          if (opcao.horario === "Só Manhã") horarioEN = "Morning Only";
          if (opcao.horario === "Só Tarde") horarioEN = "Afternoon Only";

          if (opcao.tipo_venda === "pacote") {
            turnosFinaisPT.push({ nome: `${bloco.nome} (${opcao.horario})`, data_inicio: bloco.data_inicio, data_fim: bloco.data_fim, preco: opcao.preco, vagas: bloco.vagas });
            turnosFinaisEN.push({ nome: `${bloco.nome} (${horarioEN})`, data_inicio: bloco.data_inicio, data_fim: bloco.data_fim, preco: opcao.preco, vagas: bloco.vagas });
            if (opcao.preco < precoMaisBaixo) precoMaisBaixo = opcao.preco;
          } 
          else if (opcao.tipo_venda === "dias_soltos") {
            const currentDate = new Date(bloco.data_inicio + "T12:00:00Z");
            const endDate = new Date(bloco.data_fim + "T12:00:00Z");

            while (currentDate <= endDate) {
              const dayOfWeek = currentDate.getUTCDay(); 
              if (bloco.excluir_fins_semana && (dayOfWeek === 0 || dayOfWeek === 6)) {
                currentDate.setUTCDate(currentDate.getUTCDate() + 1); continue;
              }

              const dateString = currentDate.toISOString().split('T')[0];
              const [, mm, dd] = dateString.split('-');
              
              turnosFinaisPT.push({ nome: `${bloco.nome} - Dia ${dd}/${mm} (${opcao.horario})`, data_inicio: dateString, data_fim: dateString, preco: opcao.preco, vagas: bloco.vagas });
              turnosFinaisEN.push({ nome: `${bloco.nome} - Day ${dd}/${mm} (${horarioEN})`, data_inicio: dateString, data_fim: dateString, preco: opcao.preco, vagas: bloco.vagas });
              
              if (opcao.preco < precoMaisBaixo) precoMaisBaixo = opcao.preco;
              currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
          }
        });
      });

      if (precoMaisBaixo === Infinity || precoMaisBaixo === 0) precoMaisBaixo = blocos[0]?.opcoes[0]?.preco || 0;

      // 3. Atualização BD
      const linguasFinais = getLinguasString();
      const perguntasValidas = perguntasCustomizadas.filter(p => p.trim() !== "");

      const formatarDataStr = (d: string) => d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) : '';
      const textoDatas = blocos.map(b => `${formatarDataStr(b.data_inicio)} a ${formatarDataStr(b.data_fim)}`).join(", ");
      const totalVagasCalculado = blocos.reduce((acc, curr) => acc + (Number(curr.vagas) || 0), 0);

      const formPayload: Record<string, any> = { ...formData };
      delete formPayload.contrato_parceiro_url; // Remover chaves extras desnecessárias

      const { error } = await supabase.from("campos").update({
        ...formPayload,
        idade: stringIdadesCompleta,
        vagas_totais: totalVagasCalculado,
        preco: precoMaisBaixo,                      
        datas_disponiveis: textoDatas, datas_disponiveis_en: textoDatas,     
        pais, pais_en: pais, 
        linguas_faladas: linguasFinais, linguas_faladas_en: linguasFinais,
        imagem: mainImageUrl, galeria: galeriaUrls,
        programas_pdf: programasDocsFinais, 
        latitude: mapPreview.lat, longitude: mapPreview.lon,
        turnos: turnosFinaisPT, turnos_en: turnosFinaisEN, 
        perguntas_customizadas: perguntasValidas, perguntas_customizadas_en: perguntasValidas
      }).eq('id', id);

      if (error) throw error;
      
      if (!isAutoSave) {
        fetch(`/api/translate-camp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
        alert(isEn ? "Camp updated successfully!" : "Campo atualizado com sucesso!");
        router.push(`/${lang}/admin/campos`);
      } else { 
        setAutoSaveStatus('saved'); 
      }
    } catch (error: any) { 
      if (!isAutoSave) alert("Erro: " + error.message); 
      else setAutoSaveStatus('error');
    } finally { 
      if (!isAutoSave) { setSaving(false); setStatusText(""); }
    }
  };

  useEffect(() => {
    if (loading) return; 
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setAutoSaveStatus('pending');
    const timer = setTimeout(() => { handleUpdate(undefined, true); }, 5000);
    return () => clearTimeout(timer);
  }, [formData.nome, formData.categoria, formData.local, formData.Distrito, formData.descricao, formData.regras_termos, blocos, linguas, faixasSelecionadas, mapPreview, pais, idadeManual, perguntasCustomizadas, formData.tipo_pagamento]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>{isEn ? 'Loading...' : 'A carregar dados do campo...'}</div>;

  return (
    <main style={{ maxWidth: '850px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href={`/${lang}/admin/campos`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
          &larr; Voltar
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {autoSaveStatus === 'pending' && <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f59e0b' }}>✎ Alterações por guardar...</span>}
          {autoSaveStatus === 'saving' && <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#3b82f6' }}>⏳ A gravar automaticamente...</span>}
          {autoSaveStatus === 'saved' && <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>✓ Guardado</span>}
          {autoSaveStatus === 'error' && <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ef4444' }}>⚠ Erro ao gravar</span>}
          <a href={`/${lang}/campo/${id}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0f172a', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '999px', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            Ver Online
          </a>
        </div>
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '2rem', color: '#0f172a' }}>Editar Campo</h1>

      <form onSubmit={(e) => handleUpdate(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* 1. INFO BÁSICA */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>1. Conceito e Apresentação</h2>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Nome do Campo</label>
              <input type="text" required value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Categoria Principal</label>
              <select required value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})} style={selectStyle}>
                <option value="">Selecione...</option><option value="Desporto">Desporto</option><option value="Aventura & Natureza">Aventura & Natureza</option><option value="Tecnologia & Ciência">Tecnologia & Ciência</option><option value="Artes & Criatividade">Artes & Criatividade</option><option value="Línguas">Línguas</option>
              </select>
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Público Alvo (Faixas Etárias)</label>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.5rem', marginBottom: '1rem' }}>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={faixasSelecionadas.ca6_9} onChange={() => handleFaixasChange('ca6_9')} /> 6-9 anos</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={faixasSelecionadas.ca10_13} onChange={() => handleFaixasChange('ca10_13')} /> 10-13 anos</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={faixasSelecionadas.ca14_17} onChange={() => handleFaixasChange('ca14_17')} /> 14-17 anos</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={faixasSelecionadas.outra} onChange={() => handleFaixasChange('outra')} /> Outra</label>
              </div>
              {faixasSelecionadas.outra && (
                <input type="text" required={faixasSelecionadas.outra} value={idadeManual} onChange={e => setIdadeManual(e.target.value)} placeholder="Ex: 8-15 anos" style={{...inputStyle, maxWidth: '300px'}} />
              )}
            </div>

            <div style={{ gridColumn: '1 / -1', height: '1px', backgroundColor: '#e2e8f0', margin: '1rem 0' }}></div>

            <div>
              <label style={labelStyle}>País</label>
              <select required value={pais} onChange={e => { setPais(e.target.value); setMapPreview(null); if(e.target.value !== "Portugal") setFormData({...formData, Distrito: ""}); }} style={selectStyle}>
                {paises.map(p => <option key={p.pt} value={p.pt}>{p.pt}</option>)}
              </select>
            </div>
            {pais === "Portugal" && (
              <div>
                <label style={labelStyle}>Distrito</label>
                <select required value={formData.Distrito || ''} onChange={e => { setFormData({...formData, Distrito: e.target.value}); setMapPreview(null); }} style={selectStyle}>
                  <option value="">Selecione...</option>
                  {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
              <label style={labelStyle}>Morada Específica (Prima Enter para Validar)</label>
              <input type="text" required value={formData.local || ''} onChange={e => { setFormData({...formData, local: e.target.value}); setMapPreview(null); }} onBlur={buscarNoMapaManual} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); buscarNoMapaManual(); } }} style={inputStyle} />
              
              {addressSuggestions.length > 0 && !mapPreview && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '0.5rem', marginTop: '0.25rem', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                  {addressSuggestions.map((sugestao, index) => (
                    <div key={index} onClick={() => { setFormData({ ...formData, local: sugestao.display_name }); setMapPreview({ lat: parseFloat(sugestao.lat), lon: parseFloat(sugestao.lon) }); setAddressSuggestions([]); }} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: index !== addressSuggestions.length -1 ? '1px solid #f1f5f9' : 'none', fontSize: '13px', color: '#334155' }}>
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

        {/* 2. MOTOR DE BLOCOS E OPÇÕES */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={sectionTitleStyle}>2. Calendário e Bilhetes</h2>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '-1.5rem' }}>Edite os blocos de datas e as modalidades de venda.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Duração Base Global (Dias)</label>
              <input type="number" required value={formData.duracao_dias || 0} onChange={e => setFormData({...formData, duracao_dias: Number(e.target.value)})} style={inputStyle} />
            </div>
          </div>

          {blocos.map((bloco) => (
            <div key={bloco.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>📅 Configuração de Datas</h3>
                {blocos.length > 1 && (
                  <button type="button" onClick={() => handleRemoveBloco(bloco.id)} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Excluir Bloco</button>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: '1 1 200px' }}><label style={labelStyle}>Nome do Bloco</label><input type="text" required value={bloco.nome} onChange={e => handleBlocoChange(bloco.id, 'nome', e.target.value)} style={inputStyle} /></div>
                <div style={{ flex: '1 1 120px' }}><label style={labelStyle}>Data Início</label><input type="date" required value={bloco.data_inicio} onChange={e => handleBlocoChange(bloco.id, 'data_inicio', e.target.value)} style={inputStyle} /></div>
                <div style={{ flex: '1 1 120px' }}><label style={labelStyle}>Data Fim</label><input type="date" required value={bloco.data_fim} onChange={e => handleBlocoChange(bloco.id, 'data_fim', e.target.value)} style={inputStyle} /></div>
                <div style={{ width: '90px' }}><label style={labelStyle}>Vagas</label><input type="number" required value={bloco.vagas} onChange={e => handleBlocoChange(bloco.id, 'vagas', Number(e.target.value))} style={inputStyle} /></div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={checkboxLabelStyle}>
                  <input type="checkbox" checked={bloco.excluir_fins_semana} onChange={e => handleBlocoChange(bloco.id, 'excluir_fins_semana', e.target.checked)} />
                  Ocultar Sábados e Domingos neste bloco
                </label>
              </div>

              <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎟️ Vagas à Venda nestas Datas</span>
                </div>
                
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {bloco.opcoes.map((opcao) => (
                    <div key={opcao.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ flex: '1 1 200px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '6px' }}>O QUE VAI VENDER?</label>
                        <select value={opcao.tipo_venda} onChange={e => handleOpcaoChange(bloco.id, opcao.id, 'tipo_venda', e.target.value)} style={{ ...selectStyle, padding: '0.75rem 1rem' }}>
                          <option value="pacote">O período todo completo (Pacote)</option>
                          <option value="dias_soltos">Dias isolados / Avulso</option>
                        </select>
                      </div>
                      <div style={{ flex: '1 1 150px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '6px' }}>HORÁRIO DO BILHETE</label>
                        <select value={opcao.horario} onChange={e => handleOpcaoChange(bloco.id, opcao.id, 'horario', e.target.value)} style={{ ...selectStyle, padding: '0.75rem 1rem' }}>
                          <option value="Dia Completo">Dia Completo</option>
                          <option value="Só Manhã">Só Manhã</option>
                          <option value="Só Tarde">Só Tarde</option>
                        </select>
                      </div>
                      <div style={{ width: '130px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '6px' }}>{opcao.tipo_venda === 'pacote' ? 'PREÇO TOTAL (€)' : 'PREÇO/DIA (€)'}</label>
                        <input type="number" required value={opcao.preco} onChange={e => handleOpcaoChange(bloco.id, opcao.id, 'preco', Number(e.target.value))} style={{ ...inputStyle, padding: '0.75rem 1rem' }} />
                      </div>
                      {bloco.opcoes.length > 1 && (
                        <button type="button" onClick={() => handleRemoveOpcao(bloco.id, opcao.id)} style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                      )}
                    </div>
                  ))}
                  
                  <button type="button" onClick={() => handleAddOpcao(bloco.id)} style={{ alignSelf: 'flex-start', padding: '0.75rem 1.25rem', backgroundColor: '#ecfdf5', color: '#059669', border: '1px dashed #a7f3d0', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                    + Adicionar nova Modalidade
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button type="button" onClick={handleAddBloco} style={{ width: '100%', padding: '1.25rem', backgroundColor: '#f1f5f9', color: '#0f172a', border: '2px dashed #cbd5e1', borderRadius: '0.75rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' }}>
            + Adicionar Novo Bloco de Datas
          </button>
        </div>

        {/* 3. LOGÍSTICA & DESCRIÇÃO */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>3. Logística e Programa</h2>
          
          <div style={{ gridColumn: '1 / -1', backgroundColor: '#eff6ff', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #bfdbfe', marginBottom: '2rem' }}>
            <label style={{...labelStyle, color: '#1e3a8a'}}>Condição de Pagamento Exigida</label>
            <select required value={formData.tipo_pagamento || ''} onChange={e => setFormData({...formData, tipo_pagamento: e.target.value})} style={{...selectStyle, width: '100%', borderColor: '#93c5fd'}}>
              <option value="100_total">100% Pago no Ato da Reserva (Tradicional)</option>
              <option value="50_sinal">Sinal de 50% Agora + 50% 1 Semana Antes</option>
            </select>
          </div>

          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Política de Cancelamento</label>
              <select required value={formData.politica_cancelamento || ''} onChange={e => setFormData({...formData, politica_cancelamento: e.target.value})} style={selectStyle}>
                <option value="Flexível (Reembolso a 100% até 7 dias antes)">Flexível (Reembolso a 100% até 7 dias antes)</option>
                <option value="Moderada (Reembolso a 50% até 15 dias antes)">Moderada (Reembolso a 50% até 15 dias antes)</option>
                <option value="Estrita (Sem reembolso após reserva)">Estrita (Sem reembolso após reserva)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Línguas Faladas</label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.pt} onChange={() => handleLinguasChange('pt')} /> PT</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.en} onChange={() => handleLinguasChange('en')} /> EN</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.es} onChange={() => handleLinguasChange('es')} /> ES</label>
              </div>
            </div>
            
            <div><label style={labelStyle}>Alimentação</label><select value={formData.alimentacao || ''} onChange={e => setFormData({...formData, alimentacao: e.target.value})} style={selectStyle}><option value="Incluído no Preço">Incluído</option><option value="Opcional (Pago à parte)">Opcional</option><option value="Não tem">Não tem</option></select></div>
            <div><label style={labelStyle}>Alojamento</label><select value={formData.alojamento || ''} onChange={e => setFormData({...formData, alojamento: e.target.value})} style={selectStyle}><option value="Incluído no Preço">Incluído</option><option value="Opcional (Pago à parte)">Opcional</option><option value="Não tem">Não tem</option></select></div>
            <div><label style={labelStyle}>Seguro</label><select value={formData.seguro || ''} onChange={e => setFormData({...formData, seguro: e.target.value})} style={selectStyle}><option value="Incluído no Preço">Incluído</option><option value="Pago à parte no local">Pago no local</option></select></div>
            <div><label style={labelStyle}>Rácio Monitores</label><input type="text" value={formData.racio_monitores || ''} onChange={e => setFormData({...formData, racio_monitores: e.target.value})} style={inputStyle} /></div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Descrição Completa do Programa</label>
              <textarea rows={6} required value={formData.descricao || ''} onChange={e => setFormData({...formData, descricao: e.target.value})} style={{...inputStyle, resize: 'vertical'}} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <label style={labelStyle}>Regras e Termos Específicos</label>
              <textarea rows={3} value={formData.regras_termos || ''} onChange={e => setFormData({...formData, regras_termos: e.target.value})} style={{...inputStyle, resize: 'vertical'}} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
              <label style={labelStyle}>Documentos Anexados</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                {documentosExistentes.map((doc, idx) => (
                  <div key={`exist-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', width: '100%', fontSize: '13px' }}>
                    <span style={{ fontWeight: 'bold', color: '#0f172a' }}>📄 {doc.nome}</span>
                    <button type="button" onClick={() => removeDocExistente(idx)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                  </div>
                ))}
                {documentos.map((doc, idx) => (
                  <div key={`novo-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ecfdf5', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #a7f3d0', width: '100%', fontSize: '13px' }}>
                    <span style={{ fontWeight: 'bold', color: '#059669' }}>📄 {doc.name} (Novo)</span>
                    <button type="button" onClick={() => removeNovoDoc(idx)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                  </div>
                ))}
                <label style={{ padding: '0.75rem 1.5rem', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 'bold', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '14px' }}>
                  + Adicionar Documento
                  <input type="file" accept=".pdf,.doc,.docx" multiple onChange={handleDocSelect} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 4. UPSELLS E FORMULÁRIO */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>4. Upsells e Checkout</h2>
          
          <div style={gridStyle}>
            {['alimentacao', 'alojamento', 'prolongamento', 'transporte'].map(extra => (
              <div key={extra} style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <label style={labelStyle}>{extra.charAt(0).toUpperCase() + extra.slice(1)} (Custo Extra)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="number" value={(formData as any)[`extra_${extra}`] || 0} onChange={e => setFormData({...formData, [`extra_${extra}`]: Number(e.target.value)})} style={{...inputStyle, flex: 1}} />
                  <select value={(formData as any)[`tipo_cobranca_${extra}`] || ''} onChange={e => setFormData({...formData, [`tipo_cobranca_${extra}`]: e.target.value})} style={{...selectStyle, flex: 1}}>
                    <option value="Por Turno">Por Pacote</option><option value="Por Dia">Por Dia</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <label style={{...labelStyle, color: '#0f172a', fontSize: '15px'}}>Perguntas no Checkout</label>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0.25rem 0 0 0' }}>Adicione as perguntas que deseja fazer aos pais durante a reserva.</p>
              </div>
              <button type="button" onClick={handleAddPergunta} style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>+ Pergunta Livre</button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {sugestoesAtuais.map((pergunta, idx) => (
                <button key={`cat-${idx}`} type="button" onClick={() => adicionarPerguntaSugerida(pergunta)} style={{ padding: '0.5rem 0.875rem', backgroundColor: perguntasCustomizadas.includes(pergunta) ? '#f1f5f9' : '#f0fdf4', color: perguntasCustomizadas.includes(pergunta) ? '#94a3b8' : '#059669', border: `1px solid ${perguntasCustomizadas.includes(pergunta) ? '#e2e8f0' : '#a7f3d0'}`, borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', cursor: perguntasCustomizadas.includes(pergunta) ? 'default' : 'pointer' }}>+ {pergunta}</button>
              ))}
              {PERGUNTAS_GERAIS.map((pergunta, idx) => (
                <button key={`geral-${idx}`} type="button" onClick={() => adicionarPerguntaSugerida(pergunta)} style={{ padding: '0.5rem 0.875rem', backgroundColor: perguntasCustomizadas.includes(pergunta) ? '#f1f5f9' : '#f8fafc', color: perguntasCustomizadas.includes(pergunta) ? '#94a3b8' : '#475569', border: `1px solid ${perguntasCustomizadas.includes(pergunta) ? '#e2e8f0' : '#cbd5e1'}`, borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', cursor: perguntasCustomizadas.includes(pergunta) ? 'default' : 'pointer' }}>+ {pergunta}</button>
              ))}
            </div>
            
            {perguntasCustomizadas.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                {perguntasCustomizadas.map((pergunta, index) => (
                  <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '28px', height: '28px', backgroundColor: '#0f172a', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px', flexShrink: 0 }}>{index + 1}</div>
                    <input type="text" value={pergunta} onChange={e => handlePerguntaChange(index, e.target.value)} style={inputStyle} required />
                    <button type="button" onClick={() => handleRemovePergunta(index)} style={{ padding: '0.875rem', color: '#dc2626', background: '#fee2e2', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>X</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. GALERIA */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>5. Imagem e Galeria</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Opção A: Escolher Imagem Sem Direitos</p>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {FOTOS_PADRAO.map((foto, idx) => (
                <div key={idx} onClick={() => selecionarFotoPadrao(foto.url)} style={{ minWidth: '130px', height: '90px', borderRadius: '0.5rem', overflow: 'hidden', border: images[0]?.url === foto.url ? '3px solid #059669' : '1px solid #cbd5e1', cursor: 'pointer', position: 'relative' }}>
                  <img src={foto.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {images[0]?.url === foto.url && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5, 150, 105, 0.2)' }} />}
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 'bold', margin: '2rem 0', fontSize: '12px' }}>OU</div>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', cursor: 'pointer', backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '0.75rem', transition: 'background-color 0.2s' }}>
            <span style={{ fontWeight: 'bold', color: '#64748b', fontSize: '15px' }}>📸 Clique para enviar fotos da sua galeria...</span>
            <input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
          </label>

          {images.length > 0 && !usarFotoPadrao && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', border: img.isMain ? '3px solid #059669' : '1px solid #e2e8f0', height: '120px' }}>
                  <img src={img.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: '5px', right: '5px', background: '#dc2626', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                  {!img.isMain && (
                    <button type="button" onClick={() => setMainImage(idx)} style={{ position: 'absolute', bottom: '5px', left: '5px', right: '5px', background: 'rgba(15,23,42,0.85)', color: 'white', fontSize: '11px', padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Tornar Principal</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} style={{ padding: '1.25rem', backgroundColor: '#059669', color: 'white', fontWeight: '900', borderRadius: '0.75rem', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1.125rem', transition: 'transform 0.1s', boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.3)' }}>
          {saving ? statusText : '✓ Guardar Alterações e Fechar'}
        </button>
      </form>
    </main>
  );
}

// Estilos Otimizados
const sectionStyle = { backgroundColor: 'white', padding: '3rem', borderRadius: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)' };
const sectionTitleStyle = { fontSize: '1.35rem', fontWeight: '900', color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '1.25rem', marginBottom: '2rem' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '0.6rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const inputStyle = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s' };
const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' };
const checkboxLabelStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px', color: '#334155', cursor: 'pointer', fontWeight: '700' };
"use client";

import { useState, useRef, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React from "react";

// ==========================================
// 1. TIPAGEM TYPESCRIPT (STRICT MODE)
// ==========================================
interface Variante { nome: string; preco: number; }
interface Pacote { id: string; titulo: string; tipo: 'semana' | 'dia'; quantidade: number; variantes: Variante[]; }
interface Desconto { id: string; nome: string; percentagem: number; acumulavel: boolean; }
interface GaleriaUpload { id: string; file?: File; previewUrl: string; isCapa: boolean; }

const DIAS_SEMANA = [
  { id: 1, pt: 'Seg', en: 'Mon' }, { id: 2, pt: 'Ter', en: 'Tue' },
  { id: 3, pt: 'Qua', en: 'Wed' }, { id: 4, pt: 'Qui', en: 'Thu' },
  { id: 5, pt: 'Sex', en: 'Fri' }, { id: 6, pt: 'Sáb', en: 'Sat' },
  { id: 0, pt: 'Dom', en: 'Sun' }
];

const CATEGORIAS = [
  { id: 'Desporto', icon: '⚽', pt: 'Desporto Geral', en: 'Sports' },
  { id: 'Surf', icon: '🏄', pt: 'Surf / Desportos Aquáticos', en: 'Surf & Water Sports' },
  { id: 'Robotica', icon: '🤖', pt: 'Tecnologia & Robótica', en: 'Tech & Robotics' },
  { id: 'Aventura', icon: '⛺', pt: 'Natureza & Aventura', en: 'Nature & Adventure' },
  { id: 'Artes', icon: '🎨', pt: 'Artes & Teatro', en: 'Arts & Theater' },
  { id: 'Linguas', icon: '🇬🇧', pt: 'Línguas', en: 'Languages' },
];

export default function NovoCampoParceiro({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Dropdowns Customizados States
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isPolDropdownOpen, setIsPolDropdownOpen] = useState(false);

  // ==========================================
  // 2. ESTADO DO FORMULÁRIO COMPLETO
  // ==========================================
  const [formData, setFormData] = useState({
    nome: "", local: "", idade_min: 6, idade_max: 14, vagas_totais: 50,
    categoria: "", politica_cancelamento: "Flexível (100% até 7 dias)",
    calendario_funcionamento: { data_inicio: "", data_fim: "", dias_semana: [1, 2, 3, 4, 5] },
    pacotes: [] as Pacote[],
    descontos: [] as Desconto[],
    descricao: "", 
    perguntas: [] as string[],
    
    // NOVOS CAMPOS: TEXTOS DESCRITIVOS LOGÍSTICOS
    racio_monitores: "",
    alimentacao: "",
    alojamento: "",
    seguro: "",

    // NOVOS CAMPOS: VALORES FINANCEIROS EXTRAS
    extra_alimentacao: 0,
    extra_alojamento: 0,
    extra_prolongamento: 0,
    extra_transporte: 0
  });

  const [galeria, setGaleria] = useState<GaleriaUpload[]>([]);
  const mapIframeUrl = formData.local ? `https://maps.google.com/maps?q=${encodeURIComponent(formData.local)}&t=&z=13&ie=UTF8&iwloc=&output=embed` : "";

  // Estados Modal Pacotes
  const [isPacoteModalOpen, setIsPacoteModalOpen] = useState(false);
  const [novoPacote, setNovoPacote] = useState<Pacote>({ id: "", titulo: "", tipo: "semana", quantidade: 1, variantes: [{ nome: "Bilhete Base", preco: 0 }] });

  // Estados Modal Descontos
  const [isDescontoModalOpen, setIsDescontoModalOpen] = useState(false);
  const [novoDesconto, setNovoDesconto] = useState<Desconto>({ id: "", nome: "", percentagem: 10, acumulavel: false });

  // ==========================================
  // HANDLERS: CATEGORIAS & PERGUNTAS DINÂMICAS
  // ==========================================
  const handleSelectCategoria = (catId: string) => {
    setFormData(prev => {
      let novasPerguntas = [...prev.perguntas];
      if (catId === 'Surf' && !novasPerguntas.includes("O participante sabe nadar de forma autónoma?")) {
        novasPerguntas.push("O participante sabe nadar de forma autónoma?");
      }
      if (catId === 'Robotica' && !novasPerguntas.includes("Qual o nível de experiência com computadores/programação?")) {
        novasPerguntas.push("Qual o nível de experiência com computadores/programação?");
      }
      return { ...prev, categoria: catId, perguntas: novasPerguntas };
    });
    setIsCatDropdownOpen(false);
  };

  // ==========================================
  // HANDLERS: GALERIA E UPLOADS LOCAIS
  // ==========================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const novasImagens: GaleriaUpload[] = files.map((file, index) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      isCapa: galeria.length === 0 && index === 0
    }));

    setGaleria(prev => [...prev, ...novasImagens]);
  };

  const setComoCapa = (id: string) => {
    setGaleria(galeria.map(img => ({ ...img, isCapa: img.id === id })));
  };

  const removerImagem = (id: string) => {
    const novaGaleria = galeria.filter(img => img.id !== id);
    if (novaGaleria.length > 0 && !novaGaleria.some(img => img.isCapa)) {
      novaGaleria[0].isCapa = true;
    }
    setGaleria(novaGaleria);
  };

  // ==========================================
  // HANDLERS: MOTOR DE PREÇOS
  // ==========================================
  const toggleDiaSemana = (diaId: number) => {
    const dias = formData.calendario_funcionamento.dias_semana.includes(diaId)
      ? formData.calendario_funcionamento.dias_semana.filter((d: number) => d !== diaId)
      : [...formData.calendario_funcionamento.dias_semana, diaId].sort();
    setFormData({ ...formData, calendario_funcionamento: { ...formData.calendario_funcionamento, dias_semana: dias } });
  };

  const atualizarVariante = (index: number, campo: 'nome' | 'preco', valor: string | number) => {
    const novasVariantes = [...novoPacote.variantes];
    novasVariantes[index] = { ...novasVariantes[index], [campo]: valor } as Variante;
    setNovoPacote({ ...novoPacote, variantes: novasVariantes });
  };

  const guardarPacote = () => {
    if (!novoPacote.titulo || novoPacote.variantes.length === 0) return alert("Preencha o título e pelo menos 1 preço.");
    const pacoteFinal: Pacote = { ...novoPacote, id: novoPacote.id || Math.random().toString(36).substring(2, 9) };
    const novosPacotes = novoPacote.id ? formData.pacotes.map((p: Pacote) => p.id === novoPacote.id ? pacoteFinal : p) : [...formData.pacotes, pacoteFinal];
    setFormData({ ...formData, pacotes: novosPacotes });
    setIsPacoteModalOpen(false);
    setNovoPacote({ id: "", titulo: "", tipo: "semana", quantidade: 1, variantes: [{ nome: "Bilhete Base", preco: 0 }] });
  };

  // ==========================================
  // HANDLERS: DESCONTOS MÚLTIPLOS
  // ==========================================
  const guardarDesconto = () => {
    if (!novoDesconto.nome || novoDesconto.percentagem <= 0) return alert("Preencha o nome e um valor superior a 0.");
    const descontoFinal = { ...novoDesconto, id: novoDesconto.id || Math.random().toString(36).substring(2, 9) };
    const novosDescontos = novoDesconto.id ? formData.descontos.map((d: Desconto) => d.id === novoDesconto.id ? descontoFinal : d) : [...formData.descontos, descontoFinal];
    setFormData({ ...formData, descontos: novosDescontos });
    setIsDescontoModalOpen(false);
    setNovoDesconto({ id: "", nome: "", percentagem: 10, acumulavel: false });
  };

  const adicionarVariante = () => {
    setNovoPacote(prev => ({ ...prev, variantes: [...prev.variantes, { nome: "", preco: 0 }] }));
  };

  const removerVariante = (index: number) => {
    setNovoPacote(prev => ({ ...prev, variantes: prev.variantes.filter((_, i) => i !== index) }));
  };

  const eliminarPacote = (id: string) => {
    setFormData(prev => ({ ...prev, pacotes: prev.pacotes.filter(p => p.id !== id) }));
  };

  const addPergunta = () => {
    setFormData(prev => ({ ...prev, perguntas: [...prev.perguntas, ""] }));
  };

  const removePergunta = (index: number) => {
    setFormData(prev => ({ ...prev, perguntas: prev.perguntas.filter((_, i) => i !== index) }));
  };

  const updatePergunta = (index: number, value: string) => {
    setFormData(prev => ({ ...prev, perguntas: prev.perguntas.map((p, i) => i === index ? value : p) }));
  };

  // ==========================================
  // GUARDA FINAL NA BASE DE DADOS
  // ==========================================
  const handleGravarCampo = async () => {
    if (!formData.nome || !formData.local || !formData.descricao) return alert("Preencha o nome, local e descrição.");
    if (formData.pacotes.length === 0) return alert("Crie pelo menos 1 pacote de preços no Passo 2.");
    if (galeria.length === 0) return alert("Adicione pelo menos 1 fotografia ao campo.");

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const uploadedUrls: string[] = [];
      let capaUrl = "";

      for (const img of galeria) {
        if (img.file) {
          const fileExt = img.file.name.split('.').pop();
          const fileName = `${session.user.id}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('campos-imagens')
            .upload(fileName, img.file);

          if (uploadError) throw new Error(`Erro ao enviar foto: ${uploadError.message}`);
          
          const { data: { publicUrl } } = supabase.storage.from('campos-imagens').getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
          if (img.isCapa) capaUrl = publicUrl;
        }
      }

      if (!capaUrl && uploadedUrls.length > 0) capaUrl = uploadedUrls[0];

      const perguntasLimpas = formData.perguntas.filter(p => p.trim() !== "");

      // Gravação unificada com todas as chaves operacionais e financeiras
      const { error } = await supabase.from('campos').insert({
        organizador_id: session.user.id,
        nome: formData.nome,
        nome_en: formData.nome, 
        local: formData.local,
        local_en: formData.local, 
        idade_min: formData.idade_min,
        idade_max: formData.idade_max,
        vagas_totais: formData.vagas_totais,
        categoria: formData.categoria,
        politica_cancelamento: formData.politica_cancelamento,
        descricao: formData.descricao,
        imagem: capaUrl,
        galeria: uploadedUrls,
        perguntas_customizadas: perguntasLimpas,
        calendario_funcionamento: formData.calendario_funcionamento,
        pacotes: formData.pacotes,
        descontos: formData.descontos,
        status_aprovacao: 'Pendente',
        
        // ENVIO DOS NOVOS CAMPOS DESCRITIVOS LOGÍSTICOS
        racio_monitores: formData.racio_monitores,
        racio_monitores_en: formData.racio_monitores,
        alimentacao: formData.alimentacao,
        alimentacao_en: formData.alimentacao,
        alojamento: formData.alojamento,
        alojamento_en: formData.alojamento,
        seguro: formData.seguro,
        seguro_en: formData.seguro,

        // ENVIO DOS NOVOS CAMPOS FINANCEIROS EXTRAS
        extra_alimentacao: formData.extra_alimentacao,
        extra_alojamento: formData.extra_alojamento,
        extra_prolongamento: formData.extra_prolongamento,
        extra_transporte: formData.extra_transporte
      });

      if (error) throw error;

      alert(isEn ? "Camp created successfully! It's under review." : "Campo criado com sucesso! Foi enviado para revisão.");
      router.push(`/${lang}/admin/campos`);

    } catch (err: any) {
      alert("Erro ao criar campo: " + err.message);
    }
    setSaving(false);
  };

  const nextStep = () => {
    if (step === 1 && (!formData.nome || !formData.local || !formData.categoria)) return alert("Preencha os campos obrigatórios (*) antes de avançar.");
    if (step === 2 && (!formData.calendario_funcionamento.data_inicio || !formData.calendario_funcionamento.data_fim)) return alert("Defina o calendário global do campo.");
    setStep(step + 1); window.scrollTo(0, 0);
  };
  const prevStep = () => { setStep(step - 1); window.scrollTo(0, 0); };

  const getCatName = (id: string) => {
    const cat = CATEGORIAS.find(c => c.id === id);
    return cat ? (isEn ? `${cat.icon} ${cat.en}` : `${cat.icon} ${cat.pt}`) : (isEn ? 'Select Category' : 'Escolha a Categoria');
  };

  return (
    <div className="max-w-[1000px] mx-auto p-4 md:p-8 font-sans pb-24">
      
      {/* HEADER & PROGRESS BAR */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 m-0 tracking-tight">{isEn ? 'Create New Camp' : 'Configurar Novo Campo'}</h1>
        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex-1 flex flex-col gap-2">
              <div className={`h-2.5 rounded-full transition-all duration-500 ${step >= num ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= num ? 'text-indigo-700' : 'text-slate-400'}`}>
                {num === 1 ? '1. Básicos' : num === 2 ? '2. Preços' : '3. Visual'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10 mb-8 relative overflow-hidden transition-all duration-300">
        
        {/* ========================================== */}
        {/* PASSO 1: DADOS BÁSICOS, LOCAL E MAPA */}
        {/* ========================================== */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2"><span>🎯</span> {isEn ? 'Basic Details' : 'Informações do Programa'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Campo *</label>
                <input type="text" required placeholder="Ex: Surf Camp de Verão Caparica" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
              </div>
              
              <div className="relative">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Categoria Temática *</label>
                <div onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer flex justify-between items-center hover:border-indigo-300 transition-colors">
                  <span>{getCatName(formData.categoria)}</span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </div>
                {isCatDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCatDropdownOpen(false)}></div>
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {CATEGORIAS.map(cat => (
                        <div key={cat.id} onClick={() => handleSelectCategoria(cat.id)} className="p-3.5 hover:bg-indigo-50 text-sm font-bold text-slate-700 cursor-pointer transition-colors flex items-center gap-2">
                          <span className="text-lg">{cat.icon}</span> {isEn ? cat.en : cat.pt}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Política de Cancelamento</label>
                <div onClick={() => setIsPolDropdownOpen(!isPolDropdownOpen)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer flex justify-between items-center hover:border-indigo-300 transition-colors">
                  <span className="truncate">{formData.politica_cancelamento}</span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </div>
                {isPolDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsPolDropdownOpen(false)}></div>
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {["Flexível (100% até 7 dias)", "Moderada (50% até 15 dias)", "Estrita (Sem reembolso)"].map((pol, i) => (
                        <div key={i} onClick={() => { setFormData({...formData, politica_cancelamento: pol}); setIsPolDropdownOpen(false); }} className="p-3.5 hover:bg-indigo-50 text-sm font-bold text-slate-700 cursor-pointer transition-colors">
                          {pol}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Idade Min.</label>
                  <input type="number" min="3" value={formData.idade_min} onChange={e => setFormData({...formData, idade_min: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-indigo-700 outline-none focus:border-indigo-500 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Idade Max.</label>
                  <input type="number" min="3" value={formData.idade_max} onChange={e => setFormData({...formData, idade_max: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-indigo-700 outline-none focus:border-indigo-500 focus:bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Lotação Máxima Geral</label>
                <input type="number" placeholder="Ex: 50" value={formData.vagas_totais} onChange={e => setFormData({...formData, vagas_totais: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white" />
              </div>

              <div className="md:col-span-2 border-t border-slate-100 pt-8 mt-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Localização (Morada Completa) *</label>
                <input type="text" required placeholder="Ex: Praia da Caparica, Rua X, Setúbal" value={formData.local} onChange={e => setFormData({...formData, local: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors mb-4" />
                
                <div className="w-full h-48 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center">
                  {!formData.local ? (
                    <span className="text-sm font-bold text-slate-400">O mapa atualizará quando escrever a morada...</span>
                  ) : (
                    <iframe 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      loading="lazy" 
                      allowFullScreen 
                      src={mapIframeUrl}
                    ></iframe>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PASSO 2: O MOTOR DE PREÇOS E EXTRAS FINANCEIROS */}
        {/* ========================================== */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">
            
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2"><span>📅</span> {isEn ? 'Operation Calendar' : '1. Calendário de Portas Abertas'} *</h2>
              <p className="text-xs text-slate-500 mb-6">{isEn ? 'When does the camp run?' : 'Defina os limites globais do campo. O pai só poderá escolher datas dentro deste período.'}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data de Abertura</label>
                  <input type="date" value={formData.calendario_funcionamento.data_inicio} onChange={e => setFormData({...formData, calendario_funcionamento: {...formData.calendario_funcionamento, data_inicio: e.target.value}})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data de Encerramento</label>
                  <input type="date" value={formData.calendario_funcionamento.data_fim} onChange={e => setFormData({...formData, calendario_funcionamento: {...formData.calendario_funcionamento, data_fim: e.target.value}})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dias da Semana Ativos</label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map(dia => {
                    const isActive = formData.calendario_funcionamento.dias_semana.includes(dia.id);
                    return (
                      <button type="button" key={dia.id} onClick={() => toggleDiaSemana(dia.id)} className={`w-12 h-12 rounded-xl text-xs font-black transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:border-indigo-300'}`}>
                        {isEn ? dia.en : dia.pt}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2"><span>🎟️</span> {isEn ? 'Packages / Passes' : '2. Pacotes e Preços'} *</h2>
                  <p className="text-xs text-slate-500 max-w-sm">{isEn ? 'Create the packages parents will buy.' : 'Crie os Passes que o pai pode comprar no checkout.'}</p>
                </div>
                <button type="button" onClick={() => setIsPacoteModalOpen(true)} className="bg-slate-900 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm hover:bg-indigo-600 transition-colors whitespace-nowrap">
                  + {isEn ? 'Add Package' : 'Novo Pacote'}
                </button>
              </div>

              {formData.pacotes.length === 0 ? (
                <div className="text-center p-8 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <span className="text-3xl block mb-2 opacity-50">🏷️</span>
                  <p className="text-xs font-bold text-blue-800 m-0">A sua montra está vazia. Adicione o seu primeiro passe de venda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.pacotes.map((pacote, idx) => (
                    <div key={idx} className="bg-white border-2 border-slate-100 rounded-2xl p-5 relative group hover:border-indigo-200 transition-colors shadow-sm">
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => { setNovoPacote(pacote); setIsPacoteModalOpen(true); }} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs hover:bg-blue-100">✏️</button>
                        <button type="button" onClick={() => eliminarPacote(pacote.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs hover:bg-red-100">🗑️</button>
                      </div>
                      <div className="inline-block px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded mb-2">
                        {pacote.tipo === 'semana' ? `${pacote.quantidade} Semana(s)` : `${pacote.quantidade} Dia(s)`}
                      </div>
                      <h3 className="text-base font-black text-slate-900 leading-tight mb-3">{pacote.titulo}</h3>
                      <div className="space-y-1.5">
                        {pacote.variantes.map((v: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                            <span className="text-[11px] font-bold text-slate-600">{v.nome}</span>
                            <span className="text-sm font-black text-indigo-700">{v.preco}€</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* INTEGRADO: NOVO APURAMENTO DE EXTRAS FINANCEIROS NUMÉRICOS */}
            <div className="pt-8 border-t border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2"><span>💰</span> {isEn ? 'Optional Financial Extras' : '3. Valores Extras Opcionais'}</h2>
              <p className="text-xs text-slate-500 mb-6">{isEn ? 'Set prices for optional services charged per child.' : 'Defina os preços numéricos para serviços opcionais faturados por criança. Se um serviço já estiver incluído ou não existir, deixe a 0.'}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Suplemento de Alimentação Extra (€ / por dia)</label>
                  <input type="number" min="0" value={formData.extra_alimentacao} onChange={e => setFormData({...formData, extra_alimentacao: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Suplemento de Dormida / Alojamento Extra (€ / por noite)</label>
                  <input type="number" min="0" value={formData.extra_alojamento} onChange={e => setFormData({...formData, extra_alojamento: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Suplemento de Prolongamento Horário Extra (€ / por dia)</label>
                  <input type="number" min="0" value={formData.extra_prolongamento} onChange={e => setFormData({...formData, extra_prolongamento: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Suplemento de Transporte / Autocarro Extra (€ / por dia)</label>
                  <input type="number" min="0" value={formData.extra_transporte} onChange={e => setFormData({...formData, extra_transporte: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2"><span>✨</span> {isEn ? 'Discounts' : '4. Regras de Desconto'}</h2>
                  <p className="text-xs text-slate-500">{isEn ? 'Create automated cart discounts.' : 'Crie as regras de negócio para quem compra em volume ou traz irmãos.'}</p>
                </div>
                <button type="button" onClick={() => setIsDescontoModalOpen(true)} className="bg-indigo-50 text-indigo-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition-colors">
                  + Novo Desconto
                </button>
              </div>

              {formData.descontos.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">Não configurou nenhum desconto.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.descontos.map((desc) => (
                    <div key={desc.id} className="flex items-center justify-between bg-white border-2 border-slate-100 p-4 rounded-2xl group">
                       <div>
                         <p className="text-sm font-black text-slate-800 m-0">{desc.nome}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                           {desc.percentagem}% • {desc.acumulavel ? 'Acumulável ✅' : 'Não Acumulável 🚫'}
                         </p>
                       </div>
                       <button type="button" onClick={() => setFormData({...formData, descontos: formData.descontos.filter(d => d.id !== desc.id)})} className="w-8 h-8 rounded-full bg-red-50 text-red-500 font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* PASSO 3: DESCRIÇÃO, LOGÍSTICA E GALERIA */}
        {/* ========================================== */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            
            <div className="mb-10 space-y-6">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><span>📸</span> {isEn ? 'Media & Forms' : '1. Apresentação Editorial e Logística'}</h2>
              
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição Longa do Programa *</label>
                <textarea rows={5} placeholder="Descreva as atividades, os horários, e o que as crianças vão aprender..." value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white resize-none leading-relaxed transition-colors" />
              </div>

              {/* INTEGRADO: NOVOS INPUTS DE TEXTOS DESCRITIVOS LOGÍSTICOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                <div className="sm:col-span-2 mb-2">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 m-0">Textos Informativos Importantes (Logística)</p>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Rácio de Monitores (Texto)</label>
                  <input type="text" placeholder='Ex: "1 monitor para 6 crianças"' value={formData.racio_monitores} onChange={e => setFormData({...formData, racio_monitores: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Regime de Alimentação (Texto)</label>
                  <input type="text" placeholder='Ex: "Almoço e lanches incluídos"' value={formData.alimentacao} onChange={e => setFormData({...formData, alimentacao: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Regime de Alojamento / Dormida (Texto)</label>
                  <input type="text" placeholder='Ex: "Regime Diurno (sem dormida)"' value={formData.alojamento} onChange={e => setFormData({...formData, alojamento: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Cobertura de Seguros (Texto)</label>
                  <input type="text" placeholder='Ex: "Seguro Acidentes Pessoais incluído"' value={formData.seguro} onChange={e => setFormData({...formData, seguro: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest m-0">Galeria de Fotografias *</label>
                    <p className="text-[10px] text-slate-500 m-0 mt-1">Adicione fotos do campo. A imagem com ⭐ será a Capa.</p>
                  </div>
                  <label className="bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm">
                    + Escolher Ficheiros
                    <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                {galeria.length === 0 ? (
                  <div className="text-center p-8 border-2 border-dashed border-slate-300 rounded-xl">
                    <span className="text-slate-400 text-2xl mb-2 block">📷</span>
                    <span className="text-xs font-bold text-slate-500">Nenhuma fotografia adicionada.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {galeria.map((img) => (
                      <div key={img.id} className={`relative rounded-xl overflow-hidden aspect-square border-4 transition-all group ${img.isCapa ? 'border-indigo-500 shadow-lg' : 'border-transparent'}`}>
                        <img src={img.previewUrl} className="w-full h-full object-cover" />
                        
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          {!img.isCapa && (
                            <button type="button" onClick={() => setComoCapa(img.id)} className="bg-white text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm">
                              Definir Capa ⭐
                            </button>
                          )}
                          <button type="button" onClick={() => removerImagem(img.id)} className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm">
                            Apagar 🗑️
                          </button>
                        </div>

                        {img.isCapa && (
                          <div className="absolute top-2 left-2 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm">
                            Capa ⭐
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2"><span>📋</span> {isEn ? 'Custom Forms' : '2. Perguntas aos Pais'}</h2>
                  <p className="text-[10px] text-slate-500 m-0 mt-1 max-w-sm">NIF, Alergias e Doenças já são recolhidos. Adicione perguntas específicas se necessário.</p>
                </div>
                <button type="button" onClick={addPergunta} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition-colors">
                  + Pergunta
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.perguntas.map((pergunta, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" placeholder="Ex: Qual o tamanho da T-Shirt do Participante?" value={pergunta} onChange={e => updatePergunta(i, e.target.value)} className="flex-1 p-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-sm" />
                    <button type="button" onClick={() => removePergunta(i)} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 font-bold transition-colors">×</button>
                  </div>
                ))}
                {formData.perguntas.length === 0 && (
                   <div className="p-6 bg-slate-50 rounded-xl text-xs font-bold text-slate-400 text-center border border-dashed border-slate-200">Não exige informações adicionais aos pais no checkout.</div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* BOTÕES DE NAVEGAÇÃO BASE */}
      <div className="flex justify-between items-center px-2 relative z-10">
        {step > 1 ? (
          <button onClick={prevStep} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white rounded-xl shadow-sm border border-slate-200">← Voltar atrás</button>
        ) : <div></div>}

        {step < 3 ? (
          <button onClick={nextStep} className="bg-slate-900 text-white font-bold px-8 py-3.5 rounded-xl shadow-md hover:bg-indigo-600 hover:shadow-indigo-500/30 transition-all">Próximo Passo →</button>
        ) : (
          <button onClick={handleGravarCampo} disabled={saving} className="bg-emerald-600 text-white font-black px-10 py-4 rounded-xl shadow-lg hover:bg-emerald-700 hover:shadow-emerald-500/30 transition-all disabled:opacity-50">
            {saving ? 'A Fazer Upload...' : '✓ Finalizar Criação do Campo'}
          </button>
        )}
      </div>

      {/* MODAL PACOTES */}
      {isPacoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-lg m-0">{novoPacote.id ? 'Editar Pacote' : 'Construir Pacote de Venda'}</h3>
              <button type="button" onClick={() => setIsPacoteModalOpen(false)} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white font-bold flex items-center justify-center">×</button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">A. Formato Logístico (O que o pai escolhe no calendário?)</label>
                <div className="flex bg-slate-100 p-1.5 rounded-xl">
                  <button type="button" onClick={() => setNovoPacote({...novoPacote, tipo: 'semana'})} className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${novoPacote.tipo === 'semana' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Semanas Completas</button>
                  <button type="button" onClick={() => setNovoPacote({...novoPacote, tipo: 'dia'})} className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${novoPacote.tipo === 'dia' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Dias Individuais Avulso</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">B. Título (Nome do Passe)</label>
                  <input type="text" placeholder='Ex: "Pack de 2 Semanas"' value={novoPacote.titulo} onChange={e => setNovoPacote({...novoPacote, titulo: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Qtd de {novoPacote.tipo === 'semana' ? 'Semanas' : 'Dias'}</label>
                  <input type="number" min="1" value={novoPacote.quantidade} onChange={e => setNovoPacote({...novoPacote, quantidade: Number(e.target.value)})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black text-indigo-700 outline-none focus:border-indigo-500 bg-slate-50 text-center" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest m-0">C. Variantes e Preços</label>
                  <button type="button" onClick={adicionarVariante} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">+ Variante</button>
                </div>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  Tem preços diferentes para este passe (ex: <i>Com Almoço vs Sem Almoço</i>)? Crie variantes. Se tiver apenas 1 preço fixo, deixe apenas o <b>Bilhete Base</b>.
                </p>
                <div className="flex flex-col gap-2.5">
                  {novoPacote.variantes.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center bg-white border border-slate-200 p-2 rounded-xl group hover:border-indigo-300 transition-colors">
                      <input type="text" placeholder="Nome (Ex: Pack c/ Almoço)" value={v.nome} onChange={e => atualizarVariante(i, 'nome', e.target.value)} className="flex-1 p-2 text-sm font-bold outline-none bg-transparent placeholder-slate-300" />
                      <div className="w-32 flex items-center bg-slate-50 rounded-lg border border-slate-100 px-2 focus-within:border-indigo-500 focus-within:bg-white transition-colors">
                        <input type="number" min="0" placeholder="0" value={v.preco} onChange={e => atualizarVariante(i, 'preco', Number(e.target.value))} className="w-full py-2.5 text-sm font-black text-indigo-700 outline-none bg-transparent text-right" />
                        <span className="text-xs font-black text-slate-400 ml-1">€</span>
                      </div>
                      {novoPacote.variantes.length > 1 && (
                        <button type="button" onClick={() => removerVariante(i)} className="w-10 h-10 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsPacoteModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-800 rounded-xl transition-colors text-sm bg-white border border-slate-200 shadow-sm">Cancelar</button>
              <button type="button" onClick={guardarPacote} className="px-6 py-2.5 font-bold text-white bg-slate-900 rounded-xl hover:bg-indigo-600 shadow-md text-sm transition-colors">✓ Adicionar à Montra</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DESCONTOS */}
      {isDescontoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-lg m-0">Nova Regra de Desconto</h3>
              <button type="button" onClick={() => setIsDescontoModalOpen(false)} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white font-bold flex items-center justify-center">×</button>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Desconto (Visível no Checkout)</label>
                <input type="text" placeholder='Ex: "Desconto Sócio Clube"' value={novoDesconto.nome} onChange={e => setNovoDesconto({...novoDesconto, nome: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 bg-slate-50" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Percentagem a Retirar</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-colors">
                    <input type="number" min="1" max="100" value={novoDesconto.percentagem} onChange={e => setNovoDesconto({...novoDesconto, percentagem: Number(e.target.value)})} className="w-full p-3.5 text-base font-black outline-none bg-transparent" />
                    <span className="bg-slate-100 text-slate-400 px-4 py-3.5 text-sm font-black border-l border-slate-200">%</span>
                  </div>
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between cursor-pointer" onClick={() => setNovoDesconto({...novoDesconto, acumulavel: !novoDesconto.acumulavel})}>
                <div>
                  <p className="text-xs font-black text-indigo-900 mb-0.5">É Acumulável?</p>
                  <p className="text-[10px] text-indigo-700 font-bold m-0 leading-tight max-w-[200px]">Se ativo, este desconto soma-se a outros descontos no carrinho.</p>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${novoDesconto.acumulavel ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${novoDesconto.acumulavel ? 'translate-x-5' : ''}`}></div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsDescontoModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-800 rounded-xl transition-colors text-sm bg-white border border-slate-200 shadow-sm">Cancelar</button>
              <button type="button" onClick={guardarDesconto} className="px-6 py-2.5 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md text-sm transition-colors">Gravar Regra</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
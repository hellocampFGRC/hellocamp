"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React from "react";

// ==========================================
// 1. TIPAGEM TYPESCRIPT (STRICT MODE)
// ==========================================
interface Variante { nome: string; preco: number; nome_en?: string; }
interface Pacote { id: string; titulo: string; tipo: 'semana' | 'dia'; quantidade: number; variantes: Variante[]; titulo_en?: string; }
interface Desconto { id: string; nome: string; percentagem: number; acumulavel: boolean; nome_en?: string; }
interface GaleriaUpload { id: string; file?: File; previewUrl: string; isCapa: boolean; }
interface PerguntaUI { id: string; tipo: 'texto' | 'escolha'; titulo: string; opcoes: string; }

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

export default function EditarCampoParceiro({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusText, setStatusText] = useState("");

  const [organizador, setOrganizador] = useState<any>(null);

  // Dropdowns Customizados States
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isPolDropdownOpen, setIsPolDropdownOpen] = useState(false);
  const [isSegDropdownOpen, setIsSegDropdownOpen] = useState(false);
  const [isTraDropdownOpen, setIsTraDropdownOpen] = useState(false);

  // Estado temporário para o input de Dias Fechados
  const [novoDiaFechado, setNovoDiaFechado] = useState("");

  // ==========================================
  // 2. ESTADO DO FORMULÁRIO COMPLETO
  // ==========================================
  const [formData, setFormData] = useState({
    nome: "", local: "", idade_min: 6, idade_max: 14, vagas_totais: 50,
    categoria: "", politica_cancelamento: "Flexível (100% até 7 dias)",
    calendario_funcionamento: { 
      data_inicio: "", 
      data_fim: "", 
      dias_semana: [1, 2, 3, 4, 5],
      dias_fechados: [] as string[] 
    },
    pacotes: [] as Pacote[],
    descontos: [] as Desconto[],
    descricao: "", 
    regras_termos: "",
    perguntasUI: [] as PerguntaUI[], 

    racio_monitores: "", alimentacao: "", alojamento: "", seguro: "",
    extra_seguro: 0, tipo_extra_seguro: "fixo",
    extra_transporte: 0, tipo_extra_transporte: "diario",

    status_aprovacao: "Pendente",
    contrato_parceiro_url: ""
  });

  const [galeria, setGaleria] = useState<GaleriaUpload[]>([]);
  const [mapIframeUrl, setMapIframeUrl] = useState("");

  // Estados Modal Pacotes
  const [isPacoteModalOpen, setIsPacoteModalOpen] = useState(false);
  const [novoPacote, setNovoPacote] = useState<Pacote>({ id: "", titulo: "", tipo: "semana", quantidade: 1, variantes: [{ nome: "Bilhete Base", preco: 0 }] });

  // Estados Modal Descontos
  const [isDescontoModalOpen, setIsDescontoModalOpen] = useState(false);
  const [novoDesconto, setNovoDesconto] = useState<Desconto>({ id: "", nome: "", percentagem: 10, acumulavel: false });

  // ==========================================
  // 3. CARREGAR DADOS EXISTENTES
  // ==========================================
  useEffect(() => {
    const fetchCampo = async () => {
      const { data, error } = await supabase.from('campos').select('*').eq('id', id).single();
      if (error) {
        alert("Erro ao carregar campo: " + error.message);
        router.push(`/${lang}/admin/campos`);
        return;
      }
      if (data) {
        if (data.organizador_id) {
          const { data: orgData } = await supabase.from('perfis').select('*').eq('id', data.organizador_id).single();
          setOrganizador(orgData);
        }

        // PARSE DAS PERGUNTAS E OPÇÕES DA BASE DE DADOS
        const parsedPerguntas: PerguntaUI[] = (data.perguntas_customizadas || []).map((p: string) => {
          if (p.startsWith('ESCOLHA|')) {
            const parts = p.split('|');
            return { id: Math.random().toString(), tipo: 'escolha', titulo: parts[1] || '', opcoes: parts[2] || '' };
          } else if (p.startsWith('TEXTO|')) {
            return { id: Math.random().toString(), tipo: 'texto', titulo: p.split('|')[1] || '', opcoes: '' };
          } else {
            return { id: Math.random().toString(), tipo: 'texto', titulo: p, opcoes: '' };
          }
        });

        setFormData({
          nome: data.nome || "",
          local: data.local || "",
          idade_min: data.idade_min || 6,
          idade_max: data.idade_max || 14,
          vagas_totais: data.vagas_totais || 50,
          categoria: data.categoria || "",
          politica_cancelamento: data.politica_cancelamento || "Flexível (100% até 7 dias)",
          calendario_funcionamento: {
            data_inicio: data.calendario_funcionamento?.data_inicio || "",
            data_fim: data.calendario_funcionamento?.data_fim || "",
            dias_semana: data.calendario_funcionamento?.dias_semana || [1,2,3,4,5],
            dias_fechados: data.calendario_funcionamento?.dias_fechados || [] 
          },
          pacotes: data.pacotes || [],
          descontos: data.descontos || [],
          descricao: data.descricao || "",
          regras_termos: data.regras_termos || "",
          perguntasUI: parsedPerguntas,
          racio_monitores: data.racio_monitores || "",
          alimentacao: data.alimentacao || "",
          alojamento: data.alojamento || "",
          seguro: data.seguro || "",
          extra_seguro: data.extra_seguro || 0,
          tipo_extra_seguro: data.tipo_extra_seguro || "fixo",
          extra_transporte: data.extra_transporte || 0,
          tipo_extra_transporte: data.tipo_extra_transporte || "diario",
          status_aprovacao: data.status_aprovacao || "Pendente",
          contrato_parceiro_url: data.contrato_parceiro_url || ""
        });

        const loadedImages: GaleriaUpload[] = [];
        if (data.imagem) {
          loadedImages.push({ id: Math.random().toString(36).substring(2, 9), previewUrl: data.imagem, isCapa: true });
        }
        if (data.galeria && Array.isArray(data.galeria)) {
          data.galeria.forEach((url: string) => {
            loadedImages.push({ id: Math.random().toString(36).substring(2, 9), previewUrl: url, isCapa: false });
          });
        }
        if (loadedImages.length > 0 && !loadedImages.some(img => img.isCapa)) {
          loadedImages[0].isCapa = true;
        }
        setGaleria(loadedImages);

        if (data.local) {
          setMapIframeUrl(`https://maps.google.com/maps?q=${encodeURIComponent(data.local)}&t=&z=13&ie=UTF8&iwloc=&output=embed`);
        }
      }
      setLoading(false);
    };
    fetchCampo();
  }, [id, lang, router]);

  // ==========================================
  // 4. HANDLERS E FUNÇÕES DE MANIPULAÇÃO
  // ==========================================
  const handleApagarCampo = async () => {
    const confirmacao = window.confirm(
      isEn 
        ? "ATTENTION: Are you absolutely sure you want to delete this camp? This action is irreversible." 
        : "ATENÇÃO: Tem a certeza absoluta que pretende apagar este campo? Esta ação é irreversível e o programa deixará de aparecer nas pesquisas."
    );
    if (!confirmacao) return;

    setDeleting(true);
    const { error } = await supabase.from('campos').delete().eq('id', id);

    if (error) {
      alert((isEn ? "Error deleting camp. There might be bookings associated with it. Contact support. Details: " : "Erro ao apagar. Podem existir reservas associadas a este campo que impedem a sua eliminação por questões financeiras. Contacte o suporte. Detalhe: ") + error.message);
      setDeleting(false);
    } else {
      alert(isEn ? "Camp deleted successfully." : "Campo apagado com sucesso.");
      router.push(`/${lang}/admin/campos`);
    }
  };

  const handleSelectCategoria = (catId: string) => {
    setFormData(prev => {
      let novasPerguntas = [...prev.perguntasUI];
      if (catId === 'Surf' && !novasPerguntas.some(p => p.titulo === "O participante sabe nadar de forma autónoma?")) {
        novasPerguntas.push({ id: Math.random().toString(), tipo: 'texto', titulo: "O participante sabe nadar de forma autónoma?", opcoes: "" });
      }
      return { ...prev, categoria: catId, perguntasUI: novasPerguntas };
    });
    setIsCatDropdownOpen(false);
  };

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

  const setComoCapa = (id: string) => setGaleria(galeria.map(img => ({ ...img, isCapa: img.id === id })));

  const removerImagem = (id: string) => {
    const novaGaleria = galeria.filter(img => img.id !== id);
    if (novaGaleria.length > 0 && !novaGaleria.some(img => img.isCapa)) novaGaleria[0].isCapa = true;
    setGaleria(novaGaleria);
  };

  const toggleDiaSemana = (diaId: number) => {
    const dias = formData.calendario_funcionamento.dias_semana.includes(diaId)
      ? formData.calendario_funcionamento.dias_semana.filter((d: number) => d !== diaId)
      : [...formData.calendario_funcionamento.dias_semana, diaId].sort();
    setFormData({ ...formData, calendario_funcionamento: { ...formData.calendario_funcionamento, dias_semana: dias } });
  };

  // LÓGICA DIAS FECHADOS
  const adicionarDiaFechado = () => {
    if (!novoDiaFechado) return;
    const diasAtuais = formData.calendario_funcionamento.dias_fechados || [];
    if (!diasAtuais.includes(novoDiaFechado)) {
      setFormData({
        ...formData,
        calendario_funcionamento: {
          ...formData.calendario_funcionamento,
          dias_fechados: [...diasAtuais, novoDiaFechado].sort()
        }
      });
    }
    setNovoDiaFechado("");
  };

  const removerDiaFechado = (diaParaRemover: string) => {
    const diasAtuais = formData.calendario_funcionamento.dias_fechados || [];
    setFormData({
      ...formData,
      calendario_funcionamento: {
        ...formData.calendario_funcionamento,
        dias_fechados: diasAtuais.filter(d => d !== diaParaRemover)
      }
    });
  };

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
    const novosPacotes = novoPacote.id ? formData.pacotes.map((p: Pacote) => p.id === novoPacote.id ? pacoteFinal : p) : [...formData.pacotes, pacoteFinal];
    setFormData({ ...formData, pacotes: novosPacotes });
    setIsPacoteModalOpen(false);
    setNovoPacote({ id: "", titulo: "", tipo: "semana", quantidade: 1, variantes: [{ nome: "Bilhete Base", preco: 0 }] });
  };

  const eliminarPacote = (id: string) => setFormData(prev => ({ ...prev, pacotes: prev.pacotes.filter(p => p.id !== id) }));

  const guardarDesconto = () => {
    if (!novoDesconto.nome || novoDesconto.percentagem <= 0) return alert("Preencha o nome e um valor superior a 0.");
    const descontoFinal = { ...novoDesconto, id: novoDesconto.id || Math.random().toString(36).substring(2, 9) };
    const novosDescontos = novoDesconto.id ? formData.descontos.map((d: Desconto) => d.id === novoDesconto.id ? descontoFinal : d) : [...formData.descontos, descontoFinal];
    setFormData({ ...formData, descontos: novosDescontos });
    setIsDescontoModalOpen(false);
    setNovoDesconto({ id: "", nome: "", percentagem: 10, acumulavel: false });
  };

  const eliminarDesconto = (id: string) => setFormData(prev => ({ ...prev, descontos: prev.descontos.filter(d => d.id !== id) }));

  // HANDLERS DO NOVO CONSTRUTOR DE FORMULÁRIO (OPÇÕES DE ESCOLHA)
  const adicionarPergunta = (tipo: 'texto' | 'escolha') => {
    setFormData(prev => ({ ...prev, perguntasUI: [...prev.perguntasUI, { id: Math.random().toString(), tipo, titulo: "", opcoes: "" }] }));
  };
  const removerPergunta = (id: string) => setFormData(prev => ({ ...prev, perguntasUI: prev.perguntasUI.filter(p => p.id !== id) }));
  const atualizarPergunta = (id: string, campo: 'titulo' | 'opcoes', valor: string) => {
    setFormData(prev => ({ ...prev, perguntasUI: prev.perguntasUI.map(p => p.id === id ? { ...p, [campo]: valor } : p) }));
  };

  // ==========================================
  // FUNÇÃO DE TRADUÇÃO AUTOMÁTICA
  // ==========================================
  const traduzirParaIngles = async (texto: string) => {
    if (!texto) return "";
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=pt|en`);
      const data = await res.json();
      return data.responseData.translatedText;
    } catch (e) { return texto; }
  };

  // ==========================================
  // 5. GUARDAR ALTERAÇÕES (UPDATE)
  // ==========================================
  const handleGravarCampo = async () => {
    if (!formData.nome || !formData.local || !formData.descricao) return alert("Preencha o nome, local e descrição.");
    if (formData.pacotes.length === 0) return alert("Crie pelo menos 1 pacote de preços no Passo 2.");
    if (galeria.length === 0) return alert("Adicione pelo menos 1 fotografia ao campo.");

    setSaving(true);
    setStatusText("A processar imagens...");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const uploadedUrls: string[] = [];
      let capaUrl = "";

      // Upload de Imagens
      for (const img of galeria) {
        if (img.file) {
          const fileExt = img.file.name.split('.').pop();
          const fileName = `${session.user.id}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage.from('campos-imagens').upload(fileName, img.file);
          if (uploadError) throw new Error(`Erro ao enviar foto: ${uploadError.message}`);

          const { data: { publicUrl } } = supabase.storage.from('campos-imagens').getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
          if (img.isCapa) capaUrl = publicUrl;
        } else {
          uploadedUrls.push(img.previewUrl);
          if (img.isCapa) capaUrl = img.previewUrl;
        }
      }

      if (!capaUrl && uploadedUrls.length > 0) capaUrl = uploadedUrls[0];

      setStatusText("A traduzir textos globais (IA)...");

      // Tradução Estática Principal
      const [
        nome_en, categoria_en, local_en, descricao_en,
        alimentacao_en, alojamento_en, seguro_en, regras_termos_en, politica_cancelamento_en
      ] = await Promise.all([
        traduzirParaIngles(formData.nome), traduzirParaIngles(formData.categoria), traduzirParaIngles(formData.local),
        traduzirParaIngles(formData.descricao), traduzirParaIngles(formData.alimentacao),
        traduzirParaIngles(formData.alojamento), traduzirParaIngles(formData.seguro), 
        traduzirParaIngles(formData.regras_termos), traduzirParaIngles(formData.politica_cancelamento)
      ]);

      setStatusText("A traduzir pacotes e formulários (IA)...");

      // Tradução Dinâmica das Perguntas e Opções Múltiplas Customizadas
      const perguntasPtLimpas = formData.perguntasUI.filter(p => p.titulo.trim() !== "");
      const perguntasFormatadasPT: string[] = [];
      const perguntasFormatadasEN: string[] = [];

      for (const p of perguntasPtLimpas) {
        const titulo_en = await traduzirParaIngles(p.titulo.trim());
        
        if (p.tipo === 'escolha') {
          const opcoesArray = p.opcoes.split(',').map(o => o.trim());
          const opcoesArray_en = await Promise.all(opcoesArray.map(o => traduzirParaIngles(o)));
          
          perguntasFormatadasPT.push(`ESCOLHA|${p.titulo.trim()}|${p.opcoes.trim()}`);
          perguntasFormatadasEN.push(`ESCOLHA|${titulo_en}|${opcoesArray_en.join(',')}`);
        } else {
          perguntasFormatadasPT.push(`TEXTO|${p.titulo.trim()}`);
          perguntasFormatadasEN.push(`TEXTO|${titulo_en}`);
        }
      }

      // Tradução Pacotes e Variantes
      const pacotesFormatados = await Promise.all(formData.pacotes.map(async (pac) => {
        const titulo_en = await traduzirParaIngles(pac.titulo);
        const variantes_en = await Promise.all(pac.variantes.map(async (varis) => {
          const var_nome_en = await traduzirParaIngles(varis.nome);
          return { ...varis, nome_en: var_nome_en };
        }));
        return { ...pac, titulo_en, variantes: variantes_en };
      }));

      // Tradução Descontos
      const descontosFormatados = await Promise.all(formData.descontos.map(async (desc) => {
        const nome_en = await traduzirParaIngles(desc.nome);
        return { ...desc, nome_en };
      }));

      setStatusText("A guardar dados...");

      // Lógica de Bypass de Aprovação
      const temContratoValido = !!formData.contrato_parceiro_url || organizador?.status_contrato === 'Aprovado';
      const statusFinal = (formData.status_aprovacao === 'Aprovado' && temContratoValido) ? 'Aprovado' : 'Pendente';

      const { error } = await supabase.from('campos').update({
        nome: formData.nome,
        nome_en: nome_en,
        local: formData.local,
        local_en: local_en,
        idade_min: formData.idade_min,
        idade_max: formData.idade_max,
        vagas_totais: formData.vagas_totais,
        categoria: formData.categoria,
        categoria_en: categoria_en,
        politica_cancelamento: formData.politica_cancelamento,
        politica_cancelamento_en: politica_cancelamento_en,
        descricao: formData.descricao,
        descricao_en: descricao_en,
        regras_termos: formData.regras_termos,
        regras_termos_en: regras_termos_en,
        imagem: capaUrl,
        galeria: uploadedUrls,
        
        perguntas_customizadas: perguntasFormatadasPT,
        perguntas_customizadas_en: perguntasFormatadasEN,
        
        calendario_funcionamento: formData.calendario_funcionamento,
        pacotes: pacotesFormatados,
        descontos: descontosFormatados,
        
        status_aprovacao: statusFinal, 

        racio_monitores: formData.racio_monitores,
        racio_monitores_en: formData.racio_monitores,
        alimentacao: formData.alimentacao,
        alimentacao_en: alimentacao_en,
        alojamento: formData.alojamento,
        alojamento_en: alojamento_en,
        seguro: formData.seguro,
        seguro_en: seguro_en,

        extra_seguro: formData.extra_seguro,
        tipo_extra_seguro: formData.tipo_extra_seguro,
        extra_transporte: formData.extra_transporte,
        tipo_extra_transporte: formData.tipo_extra_transporte
      }).eq('id', id);

      if (error) throw error;

      alert(statusFinal === 'Aprovado' 
        ? (isEn ? "Camp updated and live immediately!" : "Campo atualizado com sucesso!")
        : (isEn ? "Camp updated! It's under review." : "Campo atualizado com sucesso! Foi enviado para revisão."));
        
      router.push(`/${lang}/admin/campos`);

    } catch (err: any) {
      alert("Erro ao atualizar campo: " + err.message);
    } finally {
      setSaving(false);
      setStatusText("");
    }
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

  if (loading) {
    return <div className="text-center p-8 text-slate-500 font-bold">A carregar dados do campo...</div>;
  }

  // ==========================================
  // 6. RENDER DA PÁGINA
  // ==========================================
  return (
    <div className="max-w-[1000px] mx-auto p-4 md:p-8 font-sans pb-24">

      {/* HEADER & PROGRESS BAR */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="w-full sm:w-auto flex-1">
          <h1 className="text-3xl font-black text-slate-900 m-0 tracking-tight">{isEn ? 'Edit Camp' : 'Editar Campo'}</h1>
          <div className="flex items-center gap-2 mt-6 max-w-md">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex-1 flex flex-col gap-2">
                <div className={`h-2.5 rounded-full transition-all duration-500 ${step >= num ? 'bg-[#167524]' : 'bg-slate-200'}`}></div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${step >= num ? 'text-[#167524]' : 'text-slate-400'}`}>
                  {num === 1 ? '1. Básicos' : num === 2 ? '2. Preços' : '3. Visual e Opções'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleApagarCampo} 
          disabled={deleting}
          className="bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm whitespace-nowrap disabled:opacity-50"
        >
          {deleting ? 'A apagar...' : '🗑️ Apagar Campo'}
        </button>
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
                <input type="text" required placeholder="Ex: Surf Camp de Verão Caparica" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] focus:bg-white transition-colors" />
              </div>

              {/* DROPDOWN CUSTOMIZADO: CATEGORIA */}
              <div className="relative">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Categoria Temática *</label>
                <div onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer flex justify-between items-center hover:border-[#167524]/50 transition-colors">
                  <span>{getCatName(formData.categoria)}</span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </div>
                {isCatDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCatDropdownOpen(false)}></div>
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {CATEGORIAS.map(cat => (
                        <div key={cat.id} onClick={() => handleSelectCategoria(cat.id)} className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer transition-colors flex items-center gap-2">
                          <span className="text-lg">{cat.icon}</span> {isEn ? cat.en : cat.pt}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* DROPDOWN CUSTOMIZADO: POLÍTICA CANCELAMENTO */}
              <div className="relative">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Política de Cancelamento</label>
                <div onClick={() => setIsPolDropdownOpen(!isPolDropdownOpen)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer flex justify-between items-center hover:border-[#167524]/50 transition-colors">
                  <span className="truncate">{formData.politica_cancelamento}</span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </div>
                {isPolDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsPolDropdownOpen(false)}></div>
                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {["Flexível (100% até 7 dias)", "Moderada (50% até 15 dias)", "Estrita (Sem reembolso)"].map((pol, i) => (
                        <div key={i} onClick={() => { setFormData({...formData, politica_cancelamento: pol}); setIsPolDropdownOpen(false); }} className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer transition-colors">
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
                  <input type="number" min="3" value={formData.idade_min} onChange={e => setFormData({...formData, idade_min: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-[#167524] outline-none focus:border-[#167524] focus:bg-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Idade Max.</label>
                  <input type="number" min="3" value={formData.idade_max} onChange={e => setFormData({...formData, idade_max: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-[#167524] outline-none focus:border-[#167524] focus:bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Lotação Máxima Geral</label>
                <input type="number" placeholder="Ex: 50" value={formData.vagas_totais} onChange={e => setFormData({...formData, vagas_totais: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] focus:bg-white" />
              </div>

              <div className="md:col-span-2 border-t border-slate-100 pt-8 mt-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Localização (Morada Completa) *</label>
                <input type="text" required placeholder="Ex: Praia da Caparica, Rua X, Setúbal" value={formData.local} onChange={e => {
                  setFormData({...formData, local: e.target.value});
                  setMapIframeUrl(`https://maps.google.com/maps?q=${encodeURIComponent(e.target.value)}&t=&z=13&ie=UTF8&iwloc=&output=embed`);
                }} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] focus:bg-white transition-colors mb-4" />

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
        {/* PASSO 2: O MOTOR DE PREÇOS INTELIGENTE */}
        {/* ========================================== */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">

            <div>
              <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2"><span>📅</span> {isEn ? 'Operation Calendar' : '1. Calendário de Portas Abertas'} *</h2>
              <p className="text-xs text-slate-500 mb-6">{isEn ? 'When does the camp run?' : 'Defina os limites globais do campo. O pai só poderá escolher datas dentro deste período.'}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data de Abertura</label>
                  <input type="date" value={formData.calendario_funcionamento.data_inicio} onChange={e => setFormData({...formData, calendario_funcionamento: {...formData.calendario_funcionamento, data_inicio: e.target.value}})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-[#167524] focus:bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data de Encerramento</label>
                  <input type="date" value={formData.calendario_funcionamento.data_fim} onChange={e => setFormData({...formData, calendario_funcionamento: {...formData.calendario_funcionamento, data_fim: e.target.value}})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-[#167524] focus:bg-white" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dias da Semana Ativos</label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map(dia => {
                    const isActive = formData.calendario_funcionamento.dias_semana.includes(dia.id);
                    return (
                      <button type="button" key={dia.id} onClick={() => toggleDiaSemana(dia.id)} className={`w-12 h-12 rounded-xl text-xs font-black transition-all ${isActive ? 'bg-[#167524] text-white shadow-md shadow-[#167524]/30' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:border-[#167524]/50'}`}>
                        {isEn ? dia.en : dia.pt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* DIAS DE ENCERRAMENTO (EXCEÇÕES) */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <label className="block text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2">
                  Dias de Encerramento (Exceções / Esgotado)
                </label>
                <p className="text-xs text-amber-700 mb-4">Adicione datas específicas (ex: feriados) em que o campo estará fechado. Estes dias não aparecerão disponíveis para reserva nas pesquisas.</p>

                <div className="flex gap-2 mb-4">
                  <input 
                    type="date" 
                    value={novoDiaFechado} 
                    onChange={e => setNovoDiaFechado(e.target.value)} 
                    className="flex-1 p-3 bg-white border border-amber-300 rounded-lg text-sm outline-none focus:border-amber-500" 
                  />
                  <button 
                    type="button" 
                    onClick={adicionarDiaFechado} 
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 rounded-lg transition-colors text-xs"
                  >
                    Bloquear Dia
                  </button>
                </div>

                {formData.calendario_funcionamento.dias_fechados?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.calendario_funcionamento.dias_fechados.map(dia => (
                      <div key={dia} className="flex items-center gap-2 bg-white border border-amber-300 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-bold">
                        <span className="line-through opacity-80">{new Date(dia).toLocaleDateString('pt-PT')}</span>
                        <button type="button" onClick={() => removerDiaFechado(dia)} className="text-amber-500 hover:text-red-500 text-sm leading-none ml-1">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2"><span>🎟️</span> {isEn ? 'Packages / Passes' : '2. Pacotes e Preços'} *</h2>
                  <p className="text-xs text-slate-500 max-w-sm">{isEn ? 'Create the packages parents will buy.' : 'Crie os Passes que o pai pode comprar no checkout.'}</p>
                </div>
                <button type="button" onClick={() => setIsPacoteModalOpen(true)} className="bg-[#167524] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm hover:bg-[#115a1b] transition-colors whitespace-nowrap">
                  + {isEn ? 'Add Package' : 'Novo Pacote'}
                </button>
              </div>

              {formData.pacotes.length === 0 ? (
                <div className="text-center p-8 bg-[#167524]/5 border border-[#167524]/20 rounded-2xl">
                  <span className="text-3xl block mb-2 opacity-50">🏷️</span>
                  <p className="text-xs font-bold text-[#167524] m-0">A sua montra está vazia. Adicione o seu primeiro passe de venda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.pacotes.map((pacote, idx) => (
                    <div key={idx} className="bg-white border-2 border-slate-100 rounded-2xl p-5 relative group hover:border-[#167524]/30 transition-colors shadow-sm">
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => { setNovoPacote(pacote); setIsPacoteModalOpen(true); }} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs hover:bg-[#167524] hover:text-white transition-colors">✏️</button>
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
                            <span className="text-sm font-black text-[#167524]">{v.preco}€</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EXTRAS FINANCEIROS: APENAS SEGURO E TRANSPORTE (Custom Dropdowns) */}
            <div className="pt-8 border-t border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2"><span>💰</span> {isEn ? 'Optional Extras' : '3. Configurar Extras Opcionais'}</h2>
              <p className="text-xs text-slate-500 mb-6">A alimentação e o alojamento já são mapeados em variantes. Aqui configura apenas os suplementos isolados.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* EXTRA CUSTOMIZADO: SEGURO */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor do Seguro (€)</label>
                  <input type="number" min="0" value={formData.extra_seguro} onChange={e => setFormData({...formData, extra_seguro: Number(e.target.value)})} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] mb-4" />

                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Modelo de Cobrança</label>
                  <div onClick={() => setIsSegDropdownOpen(!isSegDropdownOpen)} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer flex justify-between items-center hover:border-[#167524]/50 transition-colors">
                    <span>{formData.tipo_extra_seguro === 'fixo' ? 'Taxa Fixa (Cobra 1x no total)' : 'Por Dia (Multiplica pelos dias)'}</span>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </div>
                  {isSegDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSegDropdownOpen(false)}></div>
                      <div className="absolute top-[calc(100%-12px)] left-5 right-5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div onClick={() => { setFormData({...formData, tipo_extra_seguro: 'fixo'}); setIsSegDropdownOpen(false); }} className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer transition-colors">
                          Taxa Fixa (Cobra 1x no total)
                        </div>
                        <div onClick={() => { setFormData({...formData, tipo_extra_seguro: 'diario'}); setIsSegDropdownOpen(false); }} className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer transition-colors">
                          Por Dia (Multiplica pelos dias)
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* EXTRA CUSTOMIZADO: TRANSPORTE */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor do Transporte (€)</label>
                  <input type="number" min="0" value={formData.extra_transporte} onChange={e => setFormData({...formData, extra_transporte: Number(e.target.value)})} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] mb-4" />

                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Modelo de Cobrança</label>
                  <div onClick={() => setIsTraDropdownOpen(!isTraDropdownOpen)} className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 cursor-pointer flex justify-between items-center hover:border-[#167524]/50 transition-colors">
                    <span>{formData.tipo_extra_transporte === 'diario' ? 'Por Dia (Multiplica pelos dias)' : 'Taxa Fixa (Cobra 1x no total)'}</span>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </div>
                  {isTraDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsTraDropdownOpen(false)}></div>
                      <div className="absolute top-[calc(100%-12px)] left-5 right-5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div onClick={() => { setFormData({...formData, tipo_extra_transporte: 'diario'}); setIsTraDropdownOpen(false); }} className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer transition-colors">
                          Por Dia (Multiplica pelos dias)
                        </div>
                        <div onClick={() => { setFormData({...formData, tipo_extra_transporte: 'fixo'}); setIsTraDropdownOpen(false); }} className="p-3.5 hover:bg-[#167524]/5 text-sm font-bold text-slate-700 cursor-pointer transition-colors">
                          Taxa Fixa (Cobra 1x no total)
                        </div>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>

            {/* REGRAS DE DESCONTO */}
            <div className="pt-8 border-t border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2"><span>✨</span> {isEn ? 'Discounts' : '4. Regras de Desconto'}</h2>
                  <p className="text-xs text-slate-500">{isEn ? 'Create automated cart discounts.' : 'Crie as regras de negócio para quem compra em volume ou traz irmãos.'}</p>
                </div>
                <button type="button" onClick={() => setIsDescontoModalOpen(true)} className="bg-[#167524]/10 text-[#167524] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#167524]/20 transition-colors">
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
                      <button type="button" onClick={() => eliminarDesconto(desc.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* PASSO 3: DESCRIÇÃO, LOGÍSTICA E FORMULÁRIOS DINÂMICOS */}
        {/* ========================================== */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">

            <div>
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><span>📸</span> {isEn ? 'Media & Description' : '1. Apresentação Editorial e Logística'}</h2>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição Longa do Programa *</label>
                <textarea rows={5} placeholder="Descreva as atividades, os horários, e o que as crianças vão aprender..." value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#167524] focus:bg-white resize-none leading-relaxed transition-colors" />
              </div>

              {/* INPUTS DE TEXTOS DESCRITIVOS LOGÍSTICOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200 mt-6">
                <div className="sm:col-span-2 mb-2">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 m-0">Textos Informativos Importantes (Logística)</p>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Rácio de Monitores (Texto)</label>
                  <input type="text" placeholder='Ex: "1 monitor para 6 crianças"' value={formData.racio_monitores} onChange={e => setFormData({...formData, racio_monitores: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Regime de Alimentação (Texto)</label>
                  <input type="text" placeholder='Ex: "Almoço e lanches incluídos"' value={formData.alimentacao} onChange={e => setFormData({...formData, alimentacao: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Regime de Alojamento / Dormida (Texto)</label>
                  <input type="text" placeholder='Ex: "Regime Diurno (sem dormida)"' value={formData.alojamento} onChange={e => setFormData({...formData, alojamento: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Cobertura de Seguros (Texto)</label>
                  <input type="text" placeholder='Ex: "Seguro Acidentes Pessoais incluído"' value={formData.seguro} onChange={e => setFormData({...formData, seguro: e.target.value})} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#167524] transition-colors" />
                </div>
              </div>

              {/* REGRAS E TERMOS */}
              <div className="mt-6">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Regras e Termos Específicos do Campo</label>
                <textarea rows={4} placeholder="Regras de comportamento, vestuário necessário, etc. Este texto será mostrado no checkout." value={formData.regras_termos} onChange={e => setFormData({...formData, regras_termos: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#167524] focus:bg-white resize-none leading-relaxed transition-colors" />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest m-0">Galeria de Fotografias *</label>
                    <p className="text-[10px] text-slate-500 m-0 mt-1">Adicione fotos do campo. A imagem com ⭐ será a Capa.</p>
                  </div>
                  <label className="bg-[#167524] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer hover:bg-[#115a1b] transition-colors shadow-sm">
                    + Adicionar Fotos
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
                      <div key={img.id} className={`relative rounded-xl overflow-hidden aspect-square border-4 transition-all group ${img.isCapa ? 'border-[#167524] shadow-lg' : 'border-transparent'}`}>
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
                          <div className="absolute top-2 left-2 bg-[#167524] text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm">
                            Capa ⭐
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ========================================== */}
            {/* O NOVO CONSTRUTOR DE FORMULÁRIOS           */}
            {/* ========================================== */}
            <div className="pt-8 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2"><span>📋</span> {isEn ? 'Registration Form & Options' : '2. Opções e Perguntas de Inscrição'}</h2>
                  <p className="text-[10px] text-slate-500 m-0 mt-1 max-w-sm leading-relaxed">
                    Crie perguntas abertas ou opções de escolha múltipla (ex: Língua da Manhã, Modalidade, etc.). <b>As opções de escolha vão aparecer na página principal para cada participante selecionar!</b>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => adicionarPergunta('texto')} className="text-[10px] font-black uppercase tracking-widest text-[#167524] bg-[#167524]/10 px-3 py-2.5 rounded-xl hover:bg-[#167524]/20 transition-colors whitespace-nowrap">
                    + Pergunta Aberta
                  </button>
                  <button type="button" onClick={() => adicionarPergunta('escolha')} className="text-[10px] font-black uppercase tracking-widest text-white bg-[#167524] px-3 py-2.5 rounded-xl hover:bg-[#115a1b] transition-colors whitespace-nowrap shadow-sm">
                    + Opção Múltipla
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {formData.perguntasUI.map((p) => (
                  <div key={p.id} className={`p-5 rounded-2xl border shadow-sm relative transition-all ${p.tipo === 'escolha' ? 'bg-emerald-50/30 border-emerald-200' : 'bg-white border-slate-200'}`}>
                    <button type="button" onClick={() => removerPergunta(p.id)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100 font-bold transition-colors">×</button>
                    
                    <div className="pr-10 mb-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest mb-3 ${p.tipo === 'escolha' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {p.tipo === 'escolha' ? '▼ Opção de Escolha (Mostrada na Página)' : '📝 Pergunta Aberta (Respondida no Checkout)'}
                      </span>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{p.tipo === 'escolha' ? 'Título da Opção' : 'A sua Pergunta'}</label>
                      <input 
                        type="text" 
                        placeholder={p.tipo === 'escolha' ? "Ex: Que modalidade prefere de manhã?" : "Ex: Qual o tamanho da t-shirt?"}
                        value={p.titulo} 
                        onChange={e => atualizarPergunta(p.id, 'titulo', e.target.value)} 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#167524] shadow-sm" 
                      />
                    </div>

                    {p.tipo === 'escolha' && (
                      <div className="bg-white p-4 rounded-xl border border-emerald-100">
                        <label className="block text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-1.5">Opções Disponíveis (Separadas por vírgula)</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Inglês, Espanhol, Francês"
                          value={p.opcoes} 
                          onChange={e => atualizarPergunta(p.id, 'opcoes', e.target.value)} 
                          className="w-full p-3 bg-slate-50 border border-emerald-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-emerald-500" 
                        />
                        <p className="text-[10px] text-emerald-600 font-bold mt-2 m-0">O pai verá um menu dropdown com estas opções exatas para selecionar para cada filho.</p>
                      </div>
                    )}
                  </div>
                ))}
                
                {formData.perguntasUI.length === 0 && (
                  <div className="p-8 bg-slate-50 rounded-2xl text-xs font-bold text-slate-400 text-center border border-dashed border-slate-200">
                    O seu formulário base (Nome, Idade, Restrições Alimentares e Doenças) já está incluído nativamente.<br/>Adicione opções extra aqui, caso necessite.
                  </div>
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
          <button onClick={nextStep} className="bg-[#167524] text-white font-bold px-8 py-3.5 rounded-xl shadow-md hover:bg-[#115a1b] hover:shadow-[#167524]/30 transition-all uppercase tracking-widest text-sm">Próximo Passo →</button>
        ) : (
          <button onClick={handleGravarCampo} disabled={saving} className="bg-[#167524] text-white font-black px-10 py-4 rounded-xl shadow-lg hover:bg-[#115a1b] hover:shadow-[#167524]/30 transition-all disabled:opacity-50 uppercase tracking-widest">
            {saving ? statusText || 'A Guardar...' : '✓ Finalizar & Guardar'}
          </button>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAIS DE SUPORTE */}
      {/* ========================================== */}

      {/* MODAL PACOTES */}
      {isPacoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-lg m-0">{novoPacote.id ? 'Editar Pacote' : 'Construir Pacote de Venda'}</h3>
              <button type="button" onClick={() => setIsPacoteModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-black transition-colors">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">A. Formato Logístico</label>
                <div className="flex bg-slate-100 p-1.5 rounded-xl">
                  <button type="button" onClick={() => setNovoPacote({...novoPacote, tipo: 'semana'})} className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${novoPacote.tipo === 'semana' ? 'bg-white text-[#167524] shadow-sm border border-[#167524]/20' : 'text-slate-500 hover:text-slate-700'}`}>Semanas Completas</button>
                  <button type="button" onClick={() => setNovoPacote({...novoPacote, tipo: 'dia'})} className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${novoPacote.tipo === 'dia' ? 'bg-white text-[#167524] shadow-sm border border-[#167524]/20' : 'text-slate-500 hover:text-slate-700'}`}>Dias Individuais Avulso</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">B. Título (Nome do Passe)</label>
                  <input type="text" placeholder='Ex: "Pack de 2 Semanas"' value={novoPacote.titulo} onChange={e => setNovoPacote({...novoPacote, titulo: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#167524] bg-slate-50" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Qtd de {novoPacote.tipo === 'semana' ? 'Semanas' : 'Dias'}</label>
                  <input type="number" min="1" value={novoPacote.quantidade} onChange={e => setNovoPacote({...novoPacote, quantidade: Number(e.target.value)})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-black text-[#167524] outline-none focus:border-[#167524] bg-slate-50 text-center" />
                </div>
              </div>

              <div className="border-t-2 border-slate-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-black text-slate-900 m-0">C. Variantes e Preços</label>
                  <button type="button" onClick={adicionarVariante} className="text-[10px] font-black uppercase tracking-widest text-[#167524] bg-[#167524]/10 hover:bg-[#167524]/20 px-3 py-1.5 rounded-lg transition-colors">+ Variante</button>
                </div>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  Tem preços diferentes para este passe (ex: <i>Com Almoço vs Sem Almoço</i>)? Crie variantes. Se tiver apenas 1 preço fixo, deixe apenas o <b>Bilhete Base</b>.
                </p>
                <div className="flex flex-col gap-3">
                  {novoPacote.variantes.map((v, i) => (
                    <div key={i} className="flex gap-2 items-center bg-white border border-slate-200 p-2 rounded-xl group hover:border-[#167524]/50 transition-colors">
                      <input type="text" placeholder="Nome (Ex: Pack c/ Almoço)" value={v.nome} onChange={e => atualizarVariante(i, 'nome', e.target.value)} className="flex-1 p-2 text-sm font-bold outline-none bg-transparent placeholder-slate-300" />
                      <div className="w-32 flex items-center bg-slate-50 rounded-lg border border-slate-100 px-2 focus-within:border-[#167524] focus-within:bg-white transition-colors">
                        <input type="number" min="0" placeholder="0" value={v.preco} onChange={e => atualizarVariante(i, 'preco', Number(e.target.value))} className="w-full py-2.5 text-sm font-black text-[#167524] outline-none bg-transparent text-right" />
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
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
              <button type="button" onClick={() => setIsPacoteModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-800 rounded-xl transition-colors text-sm bg-white border border-slate-200 shadow-sm">Cancelar</button>
              <button type="button" onClick={guardarPacote} className="px-6 py-2.5 font-bold text-white bg-[#167524] rounded-xl hover:bg-[#115a1b] shadow-md text-sm transition-colors">✓ Guardar Pacote</button>
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
              <button type="button" onClick={() => setIsDescontoModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white font-bold transition-colors">×</button>
            </div>
            <div className="p-6 flex flex-col gap-6 bg-slate-50">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Desconto (Visível no Carrinho)</label>
                <input type="text" value={novoDesconto.nome} onChange={e => setNovoDesconto({...novoDesconto, nome: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#167524] bg-white shadow-sm" placeholder="Ex: Desconto Irmãos" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Percentagem a Retirar (%)</label>
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#167524] transition-colors shadow-sm">
                    <input type="number" min="1" max="100" value={novoDesconto.percentagem} onChange={e => setNovoDesconto({...novoDesconto, percentagem: Number(e.target.value)})} className="w-full p-3.5 text-base font-black outline-none bg-transparent" />
                    <span className="bg-slate-100 text-slate-400 px-4 py-3.5 text-sm font-black border-l border-slate-200">%</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center cursor-pointer hover:border-[#167524]/50 transition-colors" onClick={() => setNovoDesconto({...novoDesconto, acumulavel: !novoDesconto.acumulavel})}>
                <div>
                  <p className="m-0 mb-1 font-black text-slate-900 text-sm">É Acumulável?</p>
                  <p className="m-0 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Soma com outros códigos no carrinho.</p>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${novoDesconto.acumulavel ? 'bg-[#167524]' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${novoDesconto.acumulavel ? 'left-7' : 'left-1'}`}></div>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-slate-200 bg-white flex justify-end gap-3 flex-shrink-0">
              <button type="button" onClick={() => setIsDescontoModalOpen(false)} className="px-6 py-3 rounded-xl font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors text-sm shadow-sm">Cancelar</button>
              <button type="button" onClick={guardarDesconto} className="px-8 py-3 rounded-xl font-black border-none bg-[#167524] text-white hover:bg-[#115a1b] shadow-md transition-colors text-sm">Validar Desconto</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
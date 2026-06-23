"use client";

import { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import React from "react";

// ==========================================
// 1. TIPAGEM TYPESCRIPT (STRICT MODE)
// ==========================================
interface Variante {
  nome: string;
  preco: number;
}

interface Pacote {
  id: string;
  titulo: string;
  tipo: 'semana' | 'dia';
  quantidade: number;
  variantes: Variante[];
}

const DIAS_SEMANA = [
  { id: 1, pt: 'Seg', en: 'Mon' }, { id: 2, pt: 'Ter', en: 'Tue' },
  { id: 3, pt: 'Qua', en: 'Wed' }, { id: 4, pt: 'Qui', en: 'Thu' },
  { id: 5, pt: 'Sex', en: 'Fri' }, { id: 6, pt: 'Sáb', en: 'Sat' },
  { id: 0, pt: 'Dom', en: 'Sun' }
];

export default function NovoCampoParceiro({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  // Estado Central do Assistente Multi-Passo
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // ==========================================
  // 2. ESTADO DO FORMULÁRIO COMPLETO
  // ==========================================
  const [formData, setFormData] = useState({
    // Passo 1: Básicos
    nome: "", 
    local: "", 
    idade_min: 6, 
    idade_max: 14, 
    vagas_totais: 50,
    politica_cancelamento: "Flexível (100% até 7 dias)",
    
    // Passo 2: Motor Financeiro
    calendario_funcionamento: { data_inicio: "", data_fim: "", dias_semana: [1, 2, 3, 4, 5] },
    pacotes: [] as Pacote[],
    descontos: { irmaos_ativo: false, irmaos_percentagem: 10 },
    
    // Passo 3: Multimédia e Perguntas
    descricao: "", 
    imagem: "", 
    galeria: [""] as string[], 
    perguntas: [""] as string[]
  });

  // Estados para o Modal de Criação de Pacotes (Passo 2)
  const [isPacoteModalOpen, setIsPacoteModalOpen] = useState(false);
  const [novoPacote, setNovoPacote] = useState<Pacote>({
    id: "", titulo: "", tipo: "semana", quantidade: 1, variantes: [{ nome: "Bilhete Base", preco: 0 }]
  });

  // ==========================================
  // 3. HANDLERS DO PASSO 2 (PREÇOS)
  // ==========================================
  const toggleDiaSemana = (diaId: number) => {
    const dias = formData.calendario_funcionamento.dias_semana.includes(diaId)
      ? formData.calendario_funcionamento.dias_semana.filter((d: number) => d !== diaId)
      : [...formData.calendario_funcionamento.dias_semana, diaId].sort();
    setFormData({ ...formData, calendario_funcionamento: { ...formData.calendario_funcionamento, dias_semana: dias } });
  };

  const adicionarVariante = () => {
    setNovoPacote(prev => ({
      ...prev,
      variantes: [...prev.variantes, { nome: "", preco: 0 }]
    }));
  };

  const atualizarVariante = (index: number, campo: 'nome' | 'preco', valor: string | number) => {
    const novasVariantes = [...novoPacote.variantes];
    novasVariantes[index] = { ...novasVariantes[index], [campo]: valor } as Variante;
    setNovoPacote({ ...novoPacote, variantes: novasVariantes });
  };

  const removerVariante = (index: number) => {
    const novasVariantes = novoPacote.variantes.filter((_, i) => i !== index);
    setNovoPacote({ ...novoPacote, variantes: novasVariantes });
  };

  const guardarPacote = () => {
    if (!novoPacote.titulo || novoPacote.variantes.length === 0) return alert("Preencha o título e pelo menos 1 preço.");
    const pacoteFinal: Pacote = { ...novoPacote, id: novoPacote.id || Math.random().toString(36).substring(2, 9) };
    
    const novosPacotes = novoPacote.id 
      ? formData.pacotes.map((p: Pacote) => p.id === novoPacote.id ? pacoteFinal : p)
      : [...formData.pacotes, pacoteFinal];

    setFormData({ ...formData, pacotes: novosPacotes });
    setIsPacoteModalOpen(false);
    setNovoPacote({ id: "", titulo: "", tipo: "semana", quantidade: 1, variantes: [{ nome: "Bilhete Base", preco: 0 }] });
  };

  const eliminarPacote = (id: string) => {
    setFormData({ ...formData, pacotes: formData.pacotes.filter((p: Pacote) => p.id !== id) });
  };

  // ==========================================
  // 4. HANDLERS DO PASSO 3 (MULTIMÉDIA)
  // ==========================================
  const addGaleriaItem = () => setFormData({ ...formData, galeria: [...formData.galeria, ""] });
  const updateGaleriaItem = (index: number, val: string) => {
    const nova = [...formData.galeria];
    nova[index] = val;
    setFormData({ ...formData, galeria: nova });
  };
  const removeGaleriaItem = (index: number) => setFormData({ ...formData, galeria: formData.galeria.filter((_, i) => i !== index) });

  const addPergunta = () => setFormData({ ...formData, perguntas: [...formData.perguntas, ""] });
  const updatePergunta = (index: number, val: string) => {
    const nova = [...formData.perguntas];
    nova[index] = val;
    setFormData({ ...formData, perguntas: nova });
  };
  const removePergunta = (index: number) => setFormData({ ...formData, perguntas: formData.perguntas.filter((_, i) => i !== index) });


  // ==========================================
  // 5. GUARDA FINAL NA BASE DE DADOS
  // ==========================================
  const handleGravarCampo = async () => {
    if (!formData.nome || !formData.local || !formData.descricao) return alert("Preencha o nome, local e descrição.");
    if (formData.pacotes.length === 0) return alert("Crie pelo menos 1 pacote de preços no Passo 2.");

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      // Limpar arrays vazios antes de enviar
      const galeriaLimpa = formData.galeria.filter(g => g.trim() !== "");
      const perguntasLimpas = formData.perguntas.filter(p => p.trim() !== "");

      const { error } = await supabase.from('campos').insert({
        organizador_id: session.user.id,
        nome: formData.nome,
        nome_en: formData.nome, 
        local: formData.local,
        local_en: formData.local, 
        idade_min: formData.idade_min,
        idade_max: formData.idade_max,
        vagas_totais: formData.vagas_totais,
        politica_cancelamento: formData.politica_cancelamento,
        descricao: formData.descricao,
        imagem: formData.imagem,
        galeria: galeriaLimpa,
        perguntas_customizadas: perguntasLimpas,
        calendario_funcionamento: formData.calendario_funcionamento,
        pacotes: formData.pacotes,
        descontos: formData.descontos,
        status_aprovacao: 'Pendente'
      });

      if (error) throw error;

      alert(isEn ? "Camp created successfully! It's under review." : "Campo criado com sucesso! Foi enviado para revisão.");
      router.push(`/${lang}/admin/campos`);

    } catch (err: any) {
      alert("Erro ao criar campo: " + err.message);
    }
    setSaving(false);
  };

  // ==========================================
  // NAVEGAÇÃO DO ASSISTENTE
  // ==========================================
  const nextStep = () => {
    if (step === 1 && (!formData.nome || !formData.local)) return alert("Preencha os campos obrigatórios (*) antes de avançar.");
    if (step === 2 && (!formData.calendario_funcionamento.data_inicio || !formData.calendario_funcionamento.data_fim)) return alert("Defina o calendário de funcionamento global do campo no Passo 2.");
    setStep(step + 1);
    window.scrollTo(0, 0);
  };
  const prevStep = () => { setStep(step - 1); window.scrollTo(0, 0); };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans pb-24">
      
      {/* HEADER & PROGRESS BAR */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 m-0 tracking-tight">{isEn ? 'Create New Camp' : 'Configurar Novo Campo'}</h1>
        
        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex-1 flex flex-col gap-2">
              <div className={`h-2.5 rounded-full transition-all duration-500 ${step >= num ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= num ? 'text-indigo-700' : 'text-slate-400'}`}>
                {num === 1 ? '1. Básicos' : num === 2 ? '2. Preços e Datas' : '3. Detalhes'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 mb-8 relative overflow-hidden transition-all duration-300">
        
        {/* PASSO 1: DADOS BÁSICOS E POLÍTICA */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><span>🎯</span> {isEn ? 'Basic Details' : 'Informações do Programa'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome do Campo *</label>
                <input type="text" required placeholder="Ex: Surf Camp de Verão Caparica" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Localização Exata *</label>
                <input type="text" required placeholder="Ex: Praia da Costa da Caparica, Setúbal" value={formData.local} onChange={e => setFormData({...formData, local: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500" />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Idades (Mín - Máx)</label>
                <div className="flex items-center gap-3">
                  <input type="number" min="3" max="18" value={formData.idade_min} onChange={e => setFormData({...formData, idade_min: Number(e.target.value)})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-indigo-700 outline-none focus:border-indigo-500" />
                  <span className="font-bold text-slate-300">-</span>
                  <input type="number" min="3" max="18" value={formData.idade_max} onChange={e => setFormData({...formData, idade_max: Number(e.target.value)})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-center text-indigo-700 outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Lotação Máxima Geral</label>
                <input type="number" placeholder="Ex: 50" value={formData.vagas_totais} onChange={e => setFormData({...formData, vagas_totais: Number(e.target.value)})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500" />
              </div>

              <div className="md:col-span-2 mt-2">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Política de Cancelamento para os Pais</label>
                <select value={formData.politica_cancelamento} onChange={e => setFormData({...formData, politica_cancelamento: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer">
                  <option value="Flexível (100% até 7 dias)">Flexível (Reembolso a 100% até 7 dias do início)</option>
                  <option value="Moderada (50% até 15 dias)">Moderada (Reembolso a 50% até 15 dias do início)</option>
                  <option value="Estrita (Sem reembolso)">Estrita (Sem direito a reembolso)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 2: O MOTOR DE PREÇOS INTELIGENTE */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            
            {/* Bloco 2.1: Calendário */}
            <div className="mb-10">
              <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2"><span>📅</span> {isEn ? 'Operation Calendar' : 'Calendário de Portas Abertas'} *</h2>
              <p className="text-xs text-slate-500 mb-6">{isEn ? 'When does the camp start and end?' : 'Defina os limites globais do campo. O pai só poderá escolher datas que caiam dentro deste período.'}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data de Abertura</label>
                  <input type="date" value={formData.calendario_funcionamento.data_inicio} onChange={e => setFormData({...formData, calendario_funcionamento: {...formData.calendario_funcionamento, data_inicio: e.target.value}})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data de Encerramento</label>
                  <input type="date" value={formData.calendario_funcionamento.data_fim} onChange={e => setFormData({...formData, calendario_funcionamento: {...formData.calendario_funcionamento, data_fim: e.target.value}})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dias da Semana Ativos</label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map(dia => {
                    const isActive = formData.calendario_funcionamento.dias_semana.includes(dia.id);
                    return (
                      <button type="button" key={dia.id} onClick={() => toggleDiaSemana(dia.id)} className={`w-11 h-11 rounded-lg text-xs font-black transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-300'}`}>
                        {isEn ? dia.en : dia.pt}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Bloco 2.2: Construtor de Pacotes */}
            <div className="mb-10 pt-8 border-t border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2"><span>🎟️</span> {isEn ? 'Packages / Passes' : 'Pacotes e Preços'} *</h2>
                  <p className="text-xs text-slate-500 max-w-sm">{isEn ? 'Create the packages parents will buy.' : 'Crie os Passes que o pai pode comprar. Ex: "Passe 1 Semana", "Pack 10 Dias".'}</p>
                </div>
                <button type="button" onClick={() => setIsPacoteModalOpen(true)} className="bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:bg-indigo-600 transition-colors whitespace-nowrap">
                  + {isEn ? 'Add Package' : 'Novo Pacote'}
                </button>
              </div>

              {formData.pacotes.length === 0 ? (
                <div className="text-center p-8 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <span className="text-3xl block mb-2 opacity-50">🏷️</span>
                  <p className="text-xs font-bold text-blue-800 m-0">Tem de criar pelo menos uma opção de preço para os pais comprarem.</p>
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
                        {pacote.variantes.map((v, i) => (
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

            {/* Bloco 2.3: Descontos */}
            <div className="pt-8 border-t border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2"><span>✨</span> {isEn ? 'Automated Discounts' : 'Descontos Automáticos'}</h2>
              <p className="text-xs text-slate-500 mb-6">{isEn ? 'Apply discounts at checkout.' : 'Ofereça benefícios a quem inscreve vários filhos na sua entidade.'}</p>

              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-lg">
                <div className="flex-1">
                  <h4 className="text-sm font-black text-slate-800">{isEn ? 'Sibling Discount' : 'Desconto de Irmãos'}</h4>
                  <p className="text-[10px] text-slate-500 m-0 mt-0.5 leading-tight">{isEn ? 'Automatic on 2nd child.' : 'Aplicado automaticamente na 2ª criança.'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {formData.descontos.irmaos_ativo && (
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden h-9 w-20">
                      <input type="number" value={formData.descontos.irmaos_percentagem} onChange={e => setFormData({...formData, descontos: {...formData.descontos, irmaos_percentagem: Number(e.target.value)}})} className="w-12 p-1 text-sm font-black text-center outline-none text-indigo-700" />
                      <span className="bg-slate-100 text-slate-500 px-2 py-1 text-xs font-black h-full flex items-center">%</span>
                    </div>
                  )}
                  <div onClick={() => setFormData({...formData, descontos: {...formData.descontos, irmaos_ativo: !formData.descontos.irmaos_ativo}})} className={`w-10 h-5 rounded-full cursor-pointer relative transition-colors ${formData.descontos.irmaos_ativo ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formData.descontos.irmaos_ativo ? 'translate-x-5' : ''}`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 3: DESCRIÇÃO, GALERIA E PERGUNTAS */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><span>📸</span> {isEn ? 'Media & Forms' : 'Detalhes e Formulários'}</h2>
            
            <div className="space-y-8">
              {/* Descrição e Capa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição Longa *</label>
                  <textarea rows={5} placeholder="Descreva as atividades, os horários, e o que as crianças vão aprender..." value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 resize-none leading-relaxed" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Imagem Principal (Capa)</label>
                  <input type="text" placeholder="URL da Imagem de Capa (Ex: https://...)" value={formData.imagem} onChange={e => setFormData({...formData, imagem: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
                  {formData.imagem && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 h-32 relative w-48">
                      <img src={formData.imagem} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Galeria Múltipla */}
              <div className="border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest m-0">Galeria de Fotos Adicional</label>
                  <button type="button" onClick={addGaleriaItem} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100">+ Foto</button>
                </div>
                <div className="space-y-3">
                  {formData.galeria.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" placeholder="URL da foto..." value={url} onChange={e => updateGaleriaItem(i, e.target.value)} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500" />
                      <button type="button" onClick={() => removeGaleriaItem(i)} className="w-11 h-11 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 font-bold">&times;</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulário do Organizador (Perguntas) */}
              <div className="border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest m-0">Formulário Adicional aos Pais</label>
                    <p className="text-[10px] text-slate-500 m-0 mt-1">NIF, Alergias e Doenças já são recolhidos pela HelloCamp. Precisa de saber mais alguma coisa?</p>
                  </div>
                  <button type="button" onClick={addPergunta} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100">+ Pergunta</button>
                </div>
                <div className="space-y-3">
                  {formData.perguntas.map((pergunta, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" placeholder="Ex: Qual o tamanho de T-Shirt do Participante?" value={pergunta} onChange={e => updatePergunta(i, e.target.value)} className="flex-1 p-3 bg-white border border-emerald-200 rounded-xl text-sm outline-none focus:border-emerald-500" />
                      <button type="button" onClick={() => removePergunta(i)} className="w-11 h-11 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 font-bold">&times;</button>
                    </div>
                  ))}
                  {formData.perguntas.length === 0 && (
                     <div className="p-4 bg-slate-50 rounded-xl text-xs font-bold text-slate-400 text-center border border-dashed border-slate-200">Não exige informações adicionais.</div>
                  )}
                </div>
              </div>

            </div>

            <div className="mt-10 bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-center">
              <h3 className="text-indigo-900 font-black mb-1">Pronto para lançar? 🚀</h3>
              <p className="text-xs text-indigo-700 m-0">O campo será enviado para a nossa equipa de curadoria e ficará ativo após revisão.</p>
            </div>
          </div>
        )}

      </div>

      {/* BOTÕES DE NAVEGAÇÃO BASE */}
      <div className="flex justify-between items-center px-2">
        {step > 1 ? (
          <button onClick={prevStep} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition-colors">&larr; Voltar atrás</button>
        ) : <div></div>}

        {step < 3 ? (
          <button onClick={nextStep} className="bg-slate-900 text-white font-bold px-8 py-3.5 rounded-xl shadow-md hover:bg-indigo-600 hover:shadow-indigo-500/30 transition-all">Próximo Passo &rarr;</button>
        ) : (
          <button onClick={handleGravarCampo} disabled={saving} className="bg-emerald-600 text-white font-black px-10 py-4 rounded-xl shadow-lg hover:bg-emerald-700 hover:shadow-emerald-500/30 transition-all disabled:opacity-50">
            {saving ? 'A Processar...' : '✓ Submeter para Aprovação'}
          </button>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL: CONSTRUTOR DE PACOTES (SOBREPOSTO) */}
      {/* ========================================== */}
      {isPacoteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-lg m-0">{novoPacote.id ? 'Editar Pacote' : 'Construir Pacote de Venda'}</h3>
              <button type="button" onClick={() => setIsPacoteModalOpen(false)} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-900 hover:text-white font-bold flex items-center justify-center">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">A. Formato Logístico (O que o pai escolhe no calendário?)</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setNovoPacote({...novoPacote, tipo: 'semana'})} className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase transition-all ${novoPacote.tipo === 'semana' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Blocos de Semanas</button>
                  <button type="button" onClick={() => setNovoPacote({...novoPacote, tipo: 'dia'})} className={`flex-1 py-2.5 rounded-lg text-[11px] font-black uppercase transition-all ${novoPacote.tipo === 'dia' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Dias Individuais Avulso</button>
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
                      <input type="text" placeholder="Nome (Ex: Pack c/ Almoço)" value={v.nome} onChange={e => atualizarVariante(i, 'nome', e.target.value)} className="flex-1 p-2 text-xs font-bold outline-none bg-transparent placeholder-slate-300" />
                      <div className="w-28 flex items-center bg-slate-50 rounded-lg border border-slate-100 px-2 transition-colors focus-within:border-indigo-500 focus-within:bg-white">
                        <input type="number" min="0" placeholder="0" value={v.preco} onChange={e => atualizarVariante(i, 'preco', Number(e.target.value))} className="w-full py-2 text-sm font-black text-indigo-700 outline-none bg-transparent text-right" />
                        <span className="text-xs font-black text-slate-400 ml-1">€</span>
                      </div>
                      {novoPacote.variantes.length > 1 && (
                        <button type="button" onClick={() => removerVariante(i)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-50 group-hover:opacity-100">&times;</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsPacoteModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-800 rounded-xl transition-colors text-sm">Cancelar</button>
              <button type="button" onClick={guardarPacote} className="px-6 py-2.5 font-bold text-white bg-slate-900 rounded-xl hover:bg-indigo-600 shadow-md text-sm transition-colors">✓ Adicionar à Montra</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
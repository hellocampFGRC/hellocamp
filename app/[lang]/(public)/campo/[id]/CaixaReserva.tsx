"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ==========================================
// 1. TIPAGEM E CONTEXTO GLOBAL DE RESERVA
// ==========================================
interface Variante { nome: string; preco: number; }
interface Pacote { id: string; titulo: string; tipo: 'semana' | 'dia'; quantidade: number; variantes: Variante[]; }

const ReservaContext = createContext<any>(null);

// ==========================================
// 2. PROVEDOR DE ESTADO (MANTÉM TUDO SINCRONIZADO)
// ==========================================
export function ReservaProvider({ children, campo, lang }: { children: React.ReactNode, campo: any, lang: string }) {
  const router = useRouter();
  const isEn = lang === 'en';

  // Ler do "contrato_dados" do campo
  const contratoData = campo?.contrato_dados || {};
  const modalidadeReserva = contratoData.modalidadeReserva || campo?.modalidade_reserva || 'direta';
  const isEmailMode = modalidadeReserva === 'email';
  const isExternalLinkMode = modalidadeReserva === 'link_externo';
  const externalLinkUrl = contratoData.linkExternoReserva || campo?.link_externo_reserva || '';

  const pacotes: Pacote[] = campo.pacotes || [];
  const calendario = campo.calendario_funcionamento || { data_inicio: "", data_fim: "", dias_semana: [1, 2, 3, 4, 5] };

  const [pacoteSelecionado, setPacoteSelecionado] = useState<Pacote | null>(null);
  const [varianteSelecionada, setVarianteSelecionada] = useState<Variante | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [mesAtual, setMesAtual] = useState<Date>(new Date());
  const [datasDisponiveis, setDatasDisponiveis] = useState<string[]>([]);

  const [extraSeguro, setExtraSeguro] = useState(false);
  const [extraTransporte, setExtraTransporte] = useState(false);

  // Estados para o Modal de Lead (Link Externo)
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ nome: "", email: "", telefone: "" });
  const [submittingLead, setSubmittingLead] = useState(false);

  // Inicializar calendário e pacote base
  useEffect(() => {
    if (calendario.data_inicio && calendario.data_fim) {
      const start = new Date(calendario.data_inicio);
      const end = new Date(calendario.data_fim);
      const permitidos = calendario.dias_semana || [1, 2, 3, 4, 5];
      const diasGerados: string[] = [];
      let curr = new Date(start);
      while (curr <= end) {
        if (permitidos.includes(curr.getDay())) diasGerados.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }
      setDatasDisponiveis(diasGerados);
      if (diasGerados.length > 0) setMesAtual(new Date(diasGerados[0]));
    }
  }, [calendario.data_inicio, calendario.data_fim, calendario.dias_semana]);

  useEffect(() => {
    if (pacotes.length > 0 && !pacoteSelecionado) {
      const primeiro = pacotes[0];
      setPacoteSelecionado(primeiro);
      if (primeiro.variantes.length > 0) setVarianteSelecionada(primeiro.variantes[0]);
    }
  }, [pacotes, pacoteSelecionado]);

  // ==========================================
  // LÓGICA DE CALENDÁRIO (SEMANAS INTERCALADAS)
  // ==========================================
  const getSemanasSelecionadas = () => {
    if (!pacoteSelecionado || pacoteSelecionado.tipo !== 'semana') return [];
    
    const semanas = new Set<string>();
    diasSelecionados.forEach(dataStr => {
      const dateObj = new Date(dataStr);
      const dayOfWeek = dateObj.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startMonday = new Date(dateObj);
      startMonday.setDate(dateObj.getDate() - diffToMonday);
      semanas.add(startMonday.toISOString().split('T')[0]);
    });
    return Array.from(semanas);
  };

  const handleDiaClick = (data: string) => {
    if (!pacoteSelecionado) return;

    if (pacoteSelecionado.tipo === 'dia') {
      const limiteDias = pacoteSelecionado.quantidade || 1;
      if (diasSelecionados.includes(data)) {
         setDiasSelecionados(prev => prev.filter(d => d !== data));
      } else {
         if (diasSelecionados.length >= limiteDias) return;
         setDiasSelecionados(prev => [...prev, data]);
      }

    } else {
      const limiteSemanas = pacoteSelecionado.quantidade || 1;
      const semanasAtuais = getSemanasSelecionadas();

      const dateObj = new Date(data);
      const dayOfWeek = dateObj.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startMonday = new Date(dateObj);
      startMonday.setDate(dateObj.getDate() - diffToMonday);
      
      const startMondayStr = startMonday.toISOString().split('T')[0];
      const endSunday = new Date(startMonday);
      endSunday.setDate(startMonday.getDate() + 6);

      const diasDestaSemana = datasDisponiveis.filter(d => {
         const dDate = new Date(d);
         return dDate >= startMonday && dDate <= endSunday;
      });

      if (semanasAtuais.includes(startMondayStr)) {
         setDiasSelecionados(prev => prev.filter(d => !diasDestaSemana.includes(d)));
      } else {
         if (semanasAtuais.length >= limiteSemanas) return;
         setDiasSelecionados(prev => [...prev, ...diasDestaSemana]);
      }
    }
  };

  // Cálculos Financeiros
  const precoBase = varianteSelecionada?.preco || 0;
  const quantPacote = pacoteSelecionado?.quantidade || 1;
  const multiplicadorPrecoBase = pacoteSelecionado?.tipo === 'dia' ? (diasSelecionados.length / quantPacote) : (getSemanasSelecionadas().length / quantPacote);
  
  const totalDiasExtras = diasSelecionados.length;
  
  const valSeguro = campo.extra_seguro || 0;
  const tipoSeguro = campo.tipo_extra_seguro || 'fixo';
  let custoSeguro = valSeguro > 0 ? (tipoSeguro === 'diario' ? (valSeguro * totalDiasExtras) : valSeguro) : 0;
  
  const valTransporte = campo.extra_transporte || 0;
  const tipoTransporte = campo.tipo_extra_transporte || 'diario';
  let custoTransporte = valTransporte > 0 ? (tipoTransporte === 'diario' ? (valTransporte * totalDiasExtras) : valTransporte) : 0;

  let totalExtras = 0;
  if (extraSeguro) totalExtras += custoSeguro;
  if (extraTransporte) totalExtras += custoTransporte;

  const escolhasCompletas = pacoteSelecionado?.tipo === 'dia' 
    ? (diasSelecionados.length === quantPacote) 
    : (getSemanasSelecionadas().length === quantPacote);

  const precoTotal = ((precoBase) + totalExtras) * quantidade;

  const vagasTotais = campo.vagas_totais;
  const isEsgotado = vagasTotais !== null && vagasTotais <= 0;
  const bloqueioData = !escolhasCompletas;
  const disabledReserva = !pacoteSelecionado || !varianteSelecionada || precoBase === 0 || isEsgotado || bloqueioData;

  const handleReservar = () => {
    if (disabledReserva) return;
    
    // Se a opção for ir para o Link Externo, abrimos o Modal da Lead em vez de ir para o Checkout
    if (isExternalLinkMode) {
      if (!externalLinkUrl) {
         alert(isEn ? "The partner hasn't set up the external link yet." : "O parceiro ainda não configurou o link externo. Tente mais tarde.");
         return;
      }
      setShowLeadModal(true);
      return;
    }

    const params = new URLSearchParams();
    params.set("quantidade_criancas", quantidade.toString());
    params.set("turno", JSON.stringify({
      id: pacoteSelecionado?.id,
      nome: `${pacoteSelecionado?.titulo} (${varianteSelecionada?.nome})`,
      dias_soltos: diasSelecionados,
      preco: varianteSelecionada?.preco,
      tipo: pacoteSelecionado?.tipo,
      quantidade: totalDiasExtras
    }));
    if (extraSeguro) params.set("ext_seguro", "true");
    if (extraTransporte) params.set("ext_transporte", "true");
    if (isEmailMode) params.set("modo", "email");
    router.push(`/${lang}/checkout/${campo.id}?${params.toString()}`);
  };

  // Envio do formulário da Lead (Quando vai para link externo)
  const submitExternalLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.nome || !leadForm.email || !leadForm.telefone) return;
    
    setSubmittingLead(true);

    try {
      // 1. Guardar a Lead na Tabela Supabase para efeitos de Tracking de Comissão (auditoria)
      await supabase.from('leads_externas').insert([{
         campo_id: campo.id,
         organizador_id: campo.organizador_id,
         nome_cliente: leadForm.nome,
         email_cliente: leadForm.email,
         telefone_cliente: leadForm.telefone,
         turno_interesse: pacoteSelecionado?.titulo || '',
         preco_estimado: precoTotal
      }]);

      // 2. Chamar a API de email para enviar o alerta ao Parceiro (c/ HelloCamp em CC)
      await fetch('/api/notificar-reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lead: leadForm,
          campoNome: campo.nome,
          parceiroEmail: contratoData.emailReservas || 'info@hellocamp.pt',
          lang
        })
      });

      // 3. Redirecionar para o Formulário do Parceiro
      window.open(externalLinkUrl, '_blank'); // Abre noutra aba
      setShowLeadModal(false);

    } catch (error) {
      console.error(error);
      // Mesmo com erro de gravação, deixamos o cliente avançar para o parceiro não perder a venda.
      window.open(externalLinkUrl, '_blank');
      setShowLeadModal(false);
    } finally {
      setSubmittingLead(false);
    }
  };

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const nextMonth = () => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
  const prevMonth = () => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  
  const gerarGrelhaMes = () => {
    const year = mesAtual.getFullYear();
    const month = mesAtual.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = lastDay.getDate();
    
    const grelha = [];
    let currentRow = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentRow.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      const d = String(currentDate.getDate()).padStart(2, '0');
      const dateString = `${y}-${m}-${d}`;
      
      currentRow.push({
        dia: i,
        dataCompleta: dateString,
        disponivel: datasDisponiveis.includes(dateString)
      });
      
      if (currentRow.length === 7) {
        grelha.push(currentRow);
        currentRow = [];
      }
    }
    
    if (currentRow.length > 0) {
      while (currentRow.length < 7) {
        currentRow.push(null);
      }
      grelha.push(currentRow);
    }
    
    return grelha;
  };

  const grelhaDias = gerarGrelhaMes();
  const nomesDiasCurto = isEn ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <ReservaContext.Provider value={{
      isEn, campo, pacotes, pacoteSelecionado, setPacoteSelecionado,
      varianteSelecionada, setVarianteSelecionada, quantidade, setQuantidade,
      diasSelecionados, setDiasSelecionados, mesAtual, nextMonth, prevMonth, handleDiaClick,
      extraSeguro, setExtraSeguro, valSeguro, custoSeguro,
      extraTransporte, setExtraTransporte, valTransporte, custoTransporte,
      precoTotal, precoBase, isEsgotado, disabledReserva, handleReservar, 
      isEmailMode, isExternalLinkMode, externalLinkUrl, capitalize,
      getSemanasSelecionadas, grelhaDias, nomesDiasCurto, escolhasCompletas,
      showLeadModal, setShowLeadModal, leadForm, setLeadForm, submitExternalLead, submittingLead
    }}>
      {children}
    </ReservaContext.Provider>
  );
}

// ==========================================
// 3. COMPONENTE: ZONA INTERATIVA (COLUNA ESQUERDA)
// ==========================================
export function SeletorOpcoes() {
  const ctx = useContext(ReservaContext);
  if (!ctx || ctx.pacotes.length === 0) return null;

  const limiteExigido = ctx.pacoteSelecionado?.quantidade || 1;
  const escolhasFeitas = ctx.pacoteSelecionado?.tipo === 'dia' 
    ? ctx.diasSelecionados.length 
    : ctx.getSemanasSelecionadas().length;

  const getSubtituloCalendario = () => {
    if (!ctx.pacoteSelecionado) return '';
    if (escolhasFeitas === limiteExigido) {
      return <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">✓ {ctx.isEn ? 'All selected!' : 'Completo!'}</span>;
    }
    return (
      <span className="text-[#EBA914] font-bold bg-amber-50 px-2 py-1 rounded">
         {ctx.isEn ? `Select ${limiteExigido - escolhasFeitas} more ${ctx.pacoteSelecionado?.tipo}(s)` : `Falta selecionar ${limiteExigido - escolhasFeitas} ${ctx.pacoteSelecionado?.tipo}(s)`}
      </span>
    );
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 relative z-10" id="reserva">
      <h2 className="text-xl font-black text-slate-900 mb-6 pb-4 border-b border-slate-50">
        {ctx.isEn ? 'Configure your Booking' : 'Configurar Inscrição'}
      </h2>

      {/* 1. PACOTE */}
      <div className="mb-8">
        <label className="flex items-center gap-2 text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">
          <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
          {ctx.isEn ? 'Select Package' : 'Escolha o Programa'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ctx.pacotes.map((pac: any) => {
            const isActive = ctx.pacoteSelecionado?.id === pac.id;
            return (
              <div key={pac.id} onClick={() => { 
                  ctx.setPacoteSelecionado(pac); 
                  ctx.setDiasSelecionados([]);
                  if (pac.variantes && pac.variantes.length > 0) ctx.setVarianteSelecionada(pac.variantes[0]);
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${isActive ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
              >
                <div>
                  <span className={`block text-sm font-black ${isActive ? 'text-emerald-900' : 'text-slate-900'}`}>{pac.titulo}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {pac.tipo === 'semana' ? `${pac.quantidade} Semana(s)` : `${pac.quantidade} Dia(s)`}
                  </span>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                  {isActive && <span className="text-white text-[8px]">✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CALENDÁRIO EM GRELHA REAL */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <label className="flex items-center gap-2 text-[11px] font-black text-slate-900 uppercase tracking-widest m-0">
            <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
            {ctx.pacoteSelecionado?.tipo === 'dia' ? (ctx.isEn ? 'Select Days' : 'Selecione as Datas') : (ctx.isEn ? 'Select Week(s)' : 'Selecione a(s) Semana(s)')}
          </label>
          <div className="text-[10px]">{getSubtituloCalendario()}</div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={ctx.prevMonth} className="p-2 w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-400 hover:text-emerald-600 font-bold border border-slate-200 shadow-sm">&larr;</button>
            <span className="text-xs font-black uppercase tracking-widest text-slate-700">
              {ctx.capitalize(ctx.mesAtual.toLocaleDateString(ctx.isEn ? 'en-US' : 'pt-PT', { month: 'long', year: 'numeric' }))}
            </span>
            <button type="button" onClick={ctx.nextMonth} className="p-2 w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-400 hover:text-emerald-600 font-bold border border-slate-200 shadow-sm">&rarr;</button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
             {ctx.nomesDiasCurto.map((dia: string, idx: number) => (
               <div key={idx} className="text-center text-[9px] font-black uppercase tracking-widest text-slate-400">{dia}</div>
             ))}
          </div>

          <div className="flex flex-col gap-1">
            {ctx.grelhaDias.map((semana: any[], rowIdx: number) => (
              <div key={rowIdx} className="grid grid-cols-7 gap-1">
                 {semana.map((diaInfo, colIdx) => {
                   if (!diaInfo) return <div key={colIdx} className="w-full aspect-square"></div>;
                   
                   const { dia, dataCompleta, disponivel } = diaInfo;
                   const isSelected = ctx.diasSelecionados.includes(dataCompleta);
                   
                   let buttonClasses = "w-full aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all ";
                   
                   if (!disponivel) {
                     buttonClasses += "bg-slate-100/50 text-slate-300 cursor-not-allowed";
                   } else if (isSelected) {
                     buttonClasses += "bg-emerald-600 text-white shadow-sm border border-emerald-700";
                   } else {
                     buttonClasses += "bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 cursor-pointer hover:bg-emerald-50";
                   }

                   return (
                     <button 
                       key={colIdx} 
                       type="button" 
                       disabled={!disponivel}
                       onClick={() => ctx.handleDiaClick(dataCompleta)}
                       className={buttonClasses}
                     >
                       {dia}
                     </button>
                   );
                 })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. VARIANTE DE PREÇO */}
      {ctx.pacoteSelecionado && (ctx.pacoteSelecionado?.variantes?.length || 0) > 1 && (
        <div className="mb-8">
          <label className="flex items-center gap-2 text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">
            <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
            {ctx.isEn ? 'Food / Sleepover Options' : 'Opções (Alimentação / Dormida)'}
          </label>
          <div className="flex flex-wrap gap-2">
            {ctx.pacoteSelecionado.variantes.map((varia: Variante) => (
              <button key={varia.nome} onClick={() => ctx.setVarianteSelecionada(varia)} 
                className={`flex-1 px-4 py-3 rounded-xl text-xs font-black border-2 transition-all flex justify-between items-center ${ctx.varianteSelecionada?.nome === varia.nome ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}>
                <span>{varia.nome}</span>
                <span className={ctx.varianteSelecionada?.nome === varia.nome ? 'text-emerald-600' : 'text-slate-400'}>{varia.preco}€</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. EXTRAS */}
      {(!ctx.isEsgotado && (ctx.valSeguro > 0 || ctx.valTransporte > 0)) && (
        <div className="mb-8">
          <label className="flex items-center gap-2 text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">
            <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{((ctx.pacoteSelecionado?.variantes?.length || 0) > 1) ? '4' : '3'}</span>
            {ctx.isEn ? 'Optional Extras' : 'Extras Opcionais'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ctx.valSeguro > 0 && (
               <div onClick={() => ctx.setExtraSeguro(!ctx.extraSeguro)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${ctx.extraSeguro ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                 <div className="flex items-center gap-2">
                   <span className="text-lg">🛡️</span>
                   <div>
                     <span className={`block text-xs font-black ${ctx.extraSeguro ? 'text-emerald-900' : 'text-slate-700'}`}>{ctx.isEn ? 'Insurance' : 'Seguro Extra'}</span>
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">+{ctx.custoSeguro}€</span>
                   </div>
                 </div>
                 <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${ctx.extraSeguro ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                    {ctx.extraSeguro && <span className="text-white text-[8px]">✓</span>}
                 </div>
               </div>
            )}
            {ctx.valTransporte > 0 && (
               <div onClick={() => ctx.setExtraTransporte(!ctx.extraTransporte)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${ctx.extraTransporte ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                 <div className="flex items-center gap-2">
                   <span className="text-lg">🚌</span>
                   <div>
                     <span className={`block text-xs font-black ${ctx.extraTransporte ? 'text-emerald-900' : 'text-slate-700'}`}>{ctx.isEn ? 'Transport' : 'Transporte'}</span>
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">+{ctx.custoTransporte}€</span>
                   </div>
                 </div>
                 <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${ctx.extraTransporte ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                    {ctx.extraTransporte && <span className="text-white text-[8px]">✓</span>}
                 </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* 5. QUANTIDADE */}
      <div>
        <label className="flex items-center gap-2 text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">
          <span className="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
            {(((ctx.pacoteSelecionado?.variantes?.length || 0) > 1) && (ctx.valSeguro > 0 || ctx.valTransporte > 0)) ? '5' : '4'}
          </span>
          {ctx.isEn ? 'Number of Children' : 'Número de Participantes'}
        </label>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 w-max">
          <button type="button" onClick={() => ctx.setQuantidade((q: number) => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-white text-slate-600 font-black shadow-sm hover:bg-slate-100 transition-colors">-</button>
          <span className="text-base font-black text-slate-900 w-8 text-center">{ctx.quantidade}</span>
          <button type="button" onClick={() => ctx.setQuantidade((q: number) => Math.min(ctx.campo.vagas_totais || 99, q + 1))} className="w-8 h-8 rounded-lg bg-white text-slate-600 font-black shadow-sm hover:bg-slate-100 transition-colors">+</button>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// 4. COMPONENTE: CAIXA DE RESUMO E MODAL DA LEAD
// ==========================================
export function CaixaResumo() {
  const ctx = useContext(ReservaContext);
  if (!ctx) return null;

  // Lógica para decidir o texto do botão consoante o tipo de contrato
  let textoBotao = ctx.isEn ? 'Book & Pay Now' : 'Reservar Vaga Agora'; // Padrão: Direta
  if (ctx.isEmailMode) textoBotao = ctx.isEn ? 'Request Booking' : 'Reservar c/ Entidade';
  if (ctx.isExternalLinkMode) textoBotao = ctx.isEn ? 'Go to Official Form' : 'Ir para Formulário Oficial';

  return (
    <>
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl w-full relative">
        <h3 className="text-lg font-black text-slate-900 mb-6 border-b border-slate-50 pb-4">
          {ctx.isEn ? 'Booking Summary' : 'Resumo da Reserva'}
        </h3>

        {ctx.pacotes.length === 0 ? (
          <div className="text-center text-sm font-bold text-slate-400 py-4">🗓️ {ctx.isEn ? 'No packages available' : 'Nenhum pacote disponível'}</div>
        ) : (
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{ctx.isEn ? 'Package' : 'Programa'}</p>
                <p className="text-sm font-bold text-slate-900 m-0">{ctx.pacoteSelecionado?.titulo || '--'}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{ctx.isEn ? 'Dates' : 'Datas'}</p>
                <p className="text-sm font-bold text-slate-900 m-0">
                  {ctx.escolhasCompletas 
                    ? `${ctx.pacoteSelecionado?.quantidade} ${ctx.pacoteSelecionado?.tipo}(s) Selecionadas` 
                    : <span className="text-[#EBA914] text-xs">Aguardando Seleção...</span>}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{ctx.isEn ? 'Variant' : 'Variante'}</p>
                <p className="text-sm font-bold text-slate-900 m-0">{ctx.varianteSelecionada?.nome || '--'}</p>
              </div>
              <span className="text-sm font-black text-slate-900">{ctx.precoBase > 0 ? `${ctx.precoBase}€` : ''}</span>
            </div>

            {(ctx.extraSeguro || ctx.extraTransporte) && (
               <div className="border-t border-slate-100 pt-4 mt-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{ctx.isEn ? 'Extras' : 'Suplementos Extras'}</p>
                 {ctx.extraSeguro && (
                   <div className="flex justify-between items-center mb-1">
                     <span className="text-xs font-bold text-slate-600">🛡️ Seguro</span>
                     <span className="text-xs font-black text-slate-900">+{ctx.custoSeguro}€</span>
                   </div>
                 )}
                 {ctx.extraTransporte && (
                   <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-slate-600">🚌 Transporte</span>
                     <span className="text-xs font-black text-slate-900">+{ctx.custoTransporte}€</span>
                   </div>
                 )}
               </div>
            )}

            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ctx.isEn ? 'Participants' : 'Participantes'}</span>
              <span className="text-sm font-black text-slate-900">x{ctx.quantidade}</span>
            </div>
          </div>
        )}

        {/* TOTAL */}
        <div className="bg-slate-50 p-5 rounded-2xl mb-6 flex justify-between items-center border border-slate-200 border-dashed">
          <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Total</span>
          <span className="text-3xl font-black text-emerald-600">
             {ctx.escolhasCompletas ? `${ctx.precoTotal}€` : '--'}
          </span>
        </div>

        {/* BOTÃO PRINCIPAL */}
        {ctx.isEsgotado ? (
          <button disabled className="w-full py-4 rounded-xl bg-slate-200 text-slate-500 font-black uppercase tracking-widest">Esgotado</button>
        ) : (
          <button
            onClick={ctx.handleReservar}
            disabled={ctx.disabledReserva}
            className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              ctx.disabledReserva
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#EBA914] hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:-translate-y-1'
            }`}
          >
            {textoBotao}
          </button>
        )}

        {!ctx.disabledReserva && (
          <div className="text-center mt-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
              {ctx.isExternalLinkMode ? '🔗 Redirecionamento Seguro' : '🔒 Pagamento Seguro'}
            </span>
          </div>
        )}
      </div>

      {/* MODAL DE RECOLHA DE LEAD (Apenas para Modalidade Externa) */}
      {ctx.showLeadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative">
            <button onClick={() => ctx.setShowLeadModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 font-black">&times;</button>
            
            <div className="p-8">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl mb-4">🚀</div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Quase lá!</h2>
              <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
                {ctx.isEn 
                  ? "You will be redirected to the partner's official form. Please leave your contact details so the organizer knows you came from HelloCamp." 
                  : "Vai ser reencaminhado para o formulário oficial do parceiro. Indique o seu contacto rápido para que a organização saiba que vem através da HelloCamp e lhe possa dar seguimento."}
              </p>

              <form onSubmit={ctx.submitExternalLead} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">{ctx.isEn ? 'Parent / Guardian Name' : 'Nome do Encarregado'}</label>
                  <input required type="text" value={ctx.leadForm.nome} onChange={e => ctx.setLeadForm({...ctx.leadForm, nome: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder={ctx.isEn ? "John Doe" : "Ex: Rui Silva"} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">{ctx.isEn ? 'E-mail Address' : 'E-mail'}</label>
                  <input required type="email" value={ctx.leadForm.email} onChange={e => ctx.setLeadForm({...ctx.leadForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="email@exemplo.pt" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">{ctx.isEn ? 'Phone Number' : 'Telefone'}</label>
                  <input required type="tel" value={ctx.leadForm.telefone} onChange={e => ctx.setLeadForm({...ctx.leadForm, telefone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="912 345 678" />
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={ctx.submittingLead} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                    {ctx.submittingLead ? (ctx.isEn ? 'Redirecting...' : 'A redirecionar...') : (ctx.isEn ? 'Continue to Official Form' : 'Avançar para o Formulário')}
                    <span className="text-lg leading-none">&rarr;</span>
                  </button>
                  <p className="text-center text-[10px] font-medium text-slate-400 mt-4">Ao avançar, aceita os Termos e a Política de Privacidade da HelloCamp.</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
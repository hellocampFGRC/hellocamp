"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Variante { nome: string; preco: number; }
interface Pacote { id: string; titulo: string; tipo: 'semana' | 'dia'; quantidade: number; variantes: Variante[]; }

const ReservaContext = createContext<any>(null);

export function ReservaProvider({ children, campo, lang }: { children: React.ReactNode, campo: any, lang: string }) {
  const router = useRouter();
  const isEn = lang === 'en';

  const contratoData = campo?.contrato_dados || {};
  const modalidadeReserva = contratoData.modalidadeReserva || campo?.modalidade_reserva || 'direta';
  const isEmailMode = modalidadeReserva === 'email';
  const isExternalLinkMode = modalidadeReserva === 'link_externo';
  const externalLinkUrl = contratoData.linkExternoReserva || campo?.link_externo_reserva || '';

  const pacotes: Pacote[] = campo.pacotes || [];
  const calendario = campo.calendario_funcionamento || { data_inicio: "", data_fim: "", dias_semana: [1, 2, 3, 4, 5], dias_fechados: [] };

  const [pacoteSelecionado, setPacoteSelecionado] = useState<Pacote | null>(null);
  const [varianteSelecionada, setVarianteSelecionada] = useState<Variante | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [mesAtual, setMesAtual] = useState<Date>(new Date());
  const [datasDisponiveis, setDatasDisponiveis] = useState<string[]>([]);

  const [extraSeguro, setExtraSeguro] = useState(false);
  const [extraTransporte, setExtraTransporte] = useState(false);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ nome: "", email: "", telefone: "" });
  const [submittingLead, setSubmittingLead] = useState(false);

  const getTodayISO = () => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
  };
  const todayISO = getTodayISO();

  useEffect(() => {
    if (calendario.data_inicio && calendario.data_fim) {
      const start = new Date(calendario.data_inicio);
      const end = new Date(calendario.data_fim);
      const permitidos = calendario.dias_semana || [1, 2, 3, 4, 5];
      const fechados = calendario.dias_fechados || [];
      const diasGerados: string[] = [];
      let curr = new Date(start);

      while (curr <= end) {
        const dateStr = curr.toISOString().split('T')[0];
        if (permitidos.includes(curr.getDay()) && !fechados.includes(dateStr) && dateStr >= todayISO) {
          diasGerados.push(dateStr);
        }
        curr.setDate(curr.getDate() + 1);
      }
      setDatasDisponiveis(diasGerados);

      if (diasGerados.length > 0) {
        setMesAtual(new Date(diasGerados[0]));
      } else if (calendario.data_inicio > todayISO) {
        setMesAtual(new Date(calendario.data_inicio));
      }
    }
  }, [calendario.data_inicio, calendario.data_fim, calendario.dias_semana, calendario.dias_fechados, todayISO]);

  useEffect(() => {
    if (pacotes.length > 0 && !pacoteSelecionado) {
      const primeiro = pacotes[0];
      setPacoteSelecionado(primeiro);
      if (primeiro.variantes.length > 0) setVarianteSelecionada(primeiro.variantes[0]);
    }
  }, [pacotes, pacoteSelecionado]);

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

  const quantPacote = pacoteSelecionado?.quantidade || 1;
  const isDiaAvulsoFlexivel = pacoteSelecionado?.tipo === 'dia' && quantPacote === 1;
  const isPackDiasFixo = pacoteSelecionado?.tipo === 'dia' && quantPacote > 1;

  const handleDiaClick = (data: string) => {
    if (!pacoteSelecionado) return;
    if (data < todayISO) return;

    if (pacoteSelecionado.tipo === 'dia') {
      if (diasSelecionados.includes(data)) {
        setDiasSelecionados(prev => prev.filter(d => d !== data));
      } else {
        if (isPackDiasFixo && diasSelecionados.length >= quantPacote) return;
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

      if (diasDestaSemana.length === 0) return;

      if (semanasAtuais.includes(startMondayStr)) {
        setDiasSelecionados(prev => prev.filter(d => !diasDestaSemana.includes(d)));
      } else {
        if (semanasAtuais.length >= limiteSemanas) return;
        setDiasSelecionados(prev => [...prev, ...diasDestaSemana]);
      }
    }
  };

  const trocarPacote = (pac: Pacote) => {
    setPacoteSelecionado(pac);
    setDiasSelecionados([]);
    setExtraSeguro(false);
    setExtraTransporte(false);
    if (pac.variantes && pac.variantes.length > 0) setVarianteSelecionada(pac.variantes[0]);
  };

  const precoBase = varianteSelecionada?.preco || 0;

  let multiplicadorPrecoBase = 1;
  if (isDiaAvulsoFlexivel) {
    multiplicadorPrecoBase = Math.max(1, diasSelecionados.length);
  }

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

  const escolhasCompletas = isDiaAvulsoFlexivel
    ? diasSelecionados.length > 0
    : (pacoteSelecionado?.tipo === 'dia'
        ? diasSelecionados.length === quantPacote
        : getSemanasSelecionadas().length === quantPacote);

  const precoTotal = (precoBase * (diasSelecionados.length === 0 ? 1 : multiplicadorPrecoBase)) * quantidade + totalExtras;

  const vagasTotais = campo.vagas_totais;
  const isEsgotado = vagasTotais !== null && vagasTotais <= 0;
  const bloqueioData = !escolhasCompletas;
  const disabledReserva = !pacoteSelecionado || !varianteSelecionada || precoBase === 0 || isEsgotado || bloqueioData;

  const nomeProgramaCompleto = `${pacoteSelecionado?.titulo || ''} ${((pacoteSelecionado?.variantes?.length || 0) > 1 && varianteSelecionada) ? `(${varianteSelecionada.nome})` : ''}`.trim();

  const handleReservar = () => {
    if (disabledReserva) return;

    if (isExternalLinkMode) {
      if (!externalLinkUrl) {
        alert(isEn ? "The partner hasn't set up the external link yet." : "O parceiro ainda não configurou o link externo.");
        return;
      }
      setShowLeadModal(true);
      return;
    }

    const params = new URLSearchParams();
    params.set("quantidade_criancas", quantidade.toString());
    params.set("turno", JSON.stringify({
      id: pacoteSelecionado?.id,
      nome: nomeProgramaCompleto,
      dias_soltos: diasSelecionados,
      preco: varianteSelecionada?.preco,
      tipo: pacoteSelecionado?.tipo,
      quantidade: totalDiasExtras,
      multiplicador: isDiaAvulsoFlexivel ? diasSelecionados.length : 1
    }));
    if (extraSeguro) params.set("ext_seguro", "true");
    if (extraTransporte) params.set("ext_transporte", "true");
    if (isEmailMode) params.set("modo", "email");
    router.push(`/${lang}/checkout/${campo.id}?${params.toString()}`);
  };

  const submitExternalLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.nome || !leadForm.email || !leadForm.telefone) return;
    if (!externalLinkUrl) return;

    setSubmittingLead(true);
    const newWindow = window.open('about:blank', '_blank');

    try {
      await supabase.from('leads_externas').insert([{
        campo_id: campo.id,
        organizador_id: campo.organizador_id,
        nome_cliente: leadForm.nome,
        email_cliente: leadForm.email,
        telefone_cliente: leadForm.telefone,
        turno_interesse: nomeProgramaCompleto,
        preco_estimado: precoTotal
      }]);

      fetch('/api/notificar-reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: leadForm, campoNome: campo.nome, parceiroEmail: contratoData.emailReservas || 'info@hellocamp.pt', lang })
      }).catch(() => {});

      if (newWindow) { newWindow.location.href = externalLinkUrl; } else { window.location.href = externalLinkUrl; }
      setShowLeadModal(false);
    } catch (error) {
      if (newWindow) newWindow.close();
      window.location.href = externalLinkUrl;
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

    const grelha: any[][] = [];
    let currentRow: any[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) { currentRow.push(null); }

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      const d = String(currentDate.getDate()).padStart(2, '0');
      const dateString = `${y}-${m}-${d}`;

      const isPast = dateString < todayISO;
      const isAvailableDay = datasDisponiveis.includes(dateString);

      currentRow.push({ dia: i, dataCompleta: dateString, isPast: isPast, disponivel: !isPast && isAvailableDay });

      if (currentRow.length === 7) {
        grelha.push(currentRow);
        currentRow = [];
      }
    }

    if (currentRow.length > 0) {
      while (currentRow.length < 7) { currentRow.push(null); }
      grelha.push(currentRow);
    }
    return grelha;
  };

  const grelhaDias = gerarGrelhaMes();
  const nomesDiasCurto = isEn ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <ReservaContext.Provider value={{
      isEn, campo, pacotes, pacoteSelecionado, setPacoteSelecionado: trocarPacote,
      varianteSelecionada, setVarianteSelecionada, quantidade, setQuantidade,
      diasSelecionados, setDiasSelecionados, mesAtual, nextMonth, prevMonth, handleDiaClick,
      extraSeguro, setExtraSeguro, valSeguro, custoSeguro,
      extraTransporte, setExtraTransporte, valTransporte, custoTransporte,
      precoTotal, precoBase, isEsgotado, disabledReserva, handleReservar,
      isEmailMode, isExternalLinkMode, externalLinkUrl, capitalize,
      getSemanasSelecionadas, grelhaDias, nomesDiasCurto, escolhasCompletas,
      showLeadModal, setShowLeadModal, leadForm, setLeadForm, submitExternalLead, submittingLead,
      isDiaAvulsoFlexivel, multiplicadorPrecoBase, isPackDiasFixo, quantPacote, nomeProgramaCompleto
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

  const escolhasFeitas = ctx.pacoteSelecionado?.tipo === 'dia'
    ? ctx.diasSelecionados.length
    : ctx.getSemanasSelecionadas().length;

  const getSubtituloCalendario = () => {
    if (!ctx.pacoteSelecionado) return '';

    if (ctx.isDiaAvulsoFlexivel) {
      if (ctx.diasSelecionados.length > 0) {
        return <span className="text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">{ctx.diasSelecionados.length} {ctx.isEn ? 'Days selected' : 'Dia(s) selecionado(s)'}</span>;
      }
      return <span className="text-slate-600 font-bold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{ctx.isEn ? 'Select your dates' : 'Selecione os dias'}</span>;
    }

    if (escolhasFeitas === ctx.quantPacote) {
      return <span className="text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">✓ {ctx.isEn ? 'All selected!' : 'Completo!'}</span>;
    }
    return (
      <span className="text-slate-600 font-bold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
        {ctx.isEn ? `Select ${ctx.quantPacote - escolhasFeitas} more ${ctx.pacoteSelecionado?.tipo}(s)` : `Falta selecionar ${ctx.quantPacote - escolhasFeitas} ${ctx.pacoteSelecionado?.tipo}(s)`}
      </span>
    );
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 relative z-10" id="reserva">
      <h2 className="text-2xl font-black text-slate-900 mb-8 pb-5 border-b border-slate-100">
        {ctx.isEn ? 'Configure your Booking' : 'Configurar Inscrição'}
      </h2>

      {/* 1. PACOTE */}
      <div className="mb-10">
        <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest mb-5">
          <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">1</span>
          {ctx.isEn ? 'Select Package' : 'Escolha o Programa'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ctx.pacotes.map((pac: any) => {
            const isActive = ctx.pacoteSelecionado?.id === pac.id;
            return (
              <div key={pac.id} onClick={() => ctx.setPacoteSelecionado(pac)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${isActive ? 'bg-blue-50/50 border-blue-600 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300'}`}
              >
                <div>
                  <span className={`block text-base font-black mb-1 ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>{pac.titulo}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    {pac.tipo === 'semana' ? `${pac.quantidade} Semana(s)` : `${pac.quantidade} Dia(s)`}
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                  {isActive && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CALENDÁRIO */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
          <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest m-0">
            <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">2</span>
            {ctx.pacoteSelecionado?.tipo === 'dia' ? (ctx.isEn ? 'Select Days' : 'Selecione as Datas') : (ctx.isEn ? 'Select Week(s)' : 'Selecione a(s) Semana(s)')}
          </label>
          <div className="text-[10px]">{getSubtituloCalendario()}</div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <button type="button" onClick={ctx.prevMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-black border border-slate-200 transition-colors">&larr;</button>
            <span className="text-sm font-black uppercase tracking-widest text-slate-900">
              {ctx.capitalize(ctx.mesAtual.toLocaleDateString(ctx.isEn ? 'en-US' : 'pt-PT', { month: 'long', year: 'numeric' }))}
            </span>
            <button type="button" onClick={ctx.nextMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-black border border-slate-200 transition-colors">&rarr;</button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-3">
            {ctx.nomesDiasCurto.map((dia: string, idx: number) => (
              <div key={idx} className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">{dia}</div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {ctx.grelhaDias.map((semana: any[], rowIdx: number) => (
              <div key={rowIdx} className="grid grid-cols-7 gap-2">
                {semana.map((diaInfo, colIdx) => {
                  if (!diaInfo) return <div key={colIdx} className="w-full aspect-square"></div>;

                  const { dia, dataCompleta, disponivel, isPast } = diaInfo;
                  const isSelected = ctx.diasSelecionados.includes(dataCompleta);

                  let buttonClasses = "w-full aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all ";

                  if (isPast) {
                    buttonClasses += "bg-slate-50 text-slate-300 cursor-not-allowed opacity-50 border border-slate-100";
                  } else if (!disponivel) {
                    buttonClasses += "bg-slate-50 text-red-300 cursor-not-allowed border border-slate-100 line-through decoration-red-200";
                  } else if (isSelected) {
                    buttonClasses += "bg-blue-600 text-white shadow-md border border-blue-700 font-black scale-105";
                  } else {
                    buttonClasses += "bg-white text-slate-700 border border-slate-200 hover:border-slate-400 cursor-pointer hover:bg-slate-50";
                  }

                  return (
                    <button
                      key={colIdx}
                      type="button"
                      disabled={!disponivel || isPast}
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
        <div className="mb-10">
          <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest mb-5">
            <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">3</span>
            {ctx.isEn ? 'Food / Sleepover Options' : 'Opções (Alimentação / Dormida)'}
          </label>
          <div className="flex flex-col gap-3">
            {ctx.pacoteSelecionado.variantes.map((varia: Variante) => (
              <button key={varia.nome} onClick={() => ctx.setVarianteSelecionada(varia)}
                className={`w-full px-6 py-4 rounded-2xl text-sm font-black border-2 transition-all flex justify-between items-center ${ctx.varianteSelecionada?.nome === varia.nome ? 'bg-blue-50/50 border-blue-600 text-blue-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                <span>{varia.nome}</span>
                <span className={ctx.varianteSelecionada?.nome === varia.nome ? 'text-blue-600' : 'text-slate-400'}>{varia.preco}€</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. EXTRAS */}
      {(!ctx.isEsgotado && (ctx.valSeguro > 0 || ctx.valTransporte > 0)) && (
        <div className="mb-10">
          <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest mb-5">
            <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">{((ctx.pacoteSelecionado?.variantes?.length || 0) > 1) ? '4' : '3'}</span>
            {ctx.isEn ? 'Optional Extras' : 'Extras Opcionais'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ctx.valSeguro > 0 && (
              <div onClick={() => ctx.setExtraSeguro(!ctx.extraSeguro)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${ctx.extraSeguro ? 'bg-blue-50/50 border-blue-600 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <span className={`block text-sm font-black mb-1 ${ctx.extraSeguro ? 'text-blue-900' : 'text-slate-700'}`}>{ctx.isEn ? 'Insurance' : 'Seguro Extra'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+{ctx.custoSeguro}€</span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${ctx.extraSeguro ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                  {ctx.extraSeguro && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>
              </div>
            )}
            {ctx.valTransporte > 0 && (
              <div onClick={() => ctx.setExtraTransporte(!ctx.extraTransporte)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${ctx.extraTransporte ? 'bg-blue-50/50 border-blue-600 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚌</span>
                  <div>
                    <span className={`block text-sm font-black mb-1 ${ctx.extraTransporte ? 'text-blue-900' : 'text-slate-700'}`}>{ctx.isEn ? 'Transport' : 'Transporte'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+{ctx.custoTransporte}€</span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${ctx.extraTransporte ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                  {ctx.extraTransporte && <span className="text-white text-[10px] font-bold">✓</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. QUANTIDADE */}
      <div>
        <label className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest mb-5">
          <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">
            {(((ctx.pacoteSelecionado?.variantes?.length || 0) > 1) && (ctx.valSeguro > 0 || ctx.valTransporte > 0)) ? '5' : '4'}
          </span>
          {ctx.isEn ? 'Number of Participants' : 'Número de Participantes'}
        </label>
        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-2 w-max shadow-sm">
          <button type="button" onClick={() => ctx.setQuantidade((q: number) => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-100 font-black transition-colors">-</button>
          <span className="text-lg font-black text-slate-900 w-10 text-center">{ctx.quantidade}</span>
          <button type="button" onClick={() => ctx.setQuantidade((q: number) => Math.min(ctx.campo.vagas_totais || 99, q + 1))} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-100 font-black transition-colors">+</button>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// 4. COMPONENTE: CAIXA DE RESUMO LATERAL
// ==========================================
export function CaixaResumo() {
  const ctx = useContext(ReservaContext);
  if (!ctx) return null;

  let textoBotao = ctx.isEn ? 'Book & Pay Now' : 'Reservar Vaga Agora';
  if (ctx.isEmailMode) textoBotao = ctx.isEn ? 'Request Booking' : 'Pedir Reserva ao Campo';
  if (ctx.isExternalLinkMode) textoBotao = ctx.isEn ? 'Go to Official Form' : 'Ir para Formulário Oficial';

  const baseCalculado = ctx.precoBase * (ctx.diasSelecionados.length === 0 ? 1 : ctx.multiplicadorPrecoBase);

  return (
    <>
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-[0_20px_60px_rgb(0,0,0,0.06)] w-full relative">
        <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-5">
          {ctx.isEn ? 'Booking Summary' : 'Resumo da Reserva'}
        </h3>

        {ctx.pacotes.length === 0 ? (
          <div className="text-center text-sm font-bold text-slate-400 py-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            🗓️ {ctx.isEn ? 'No packages available' : 'Nenhum pacote disponível'}
          </div>
        ) : (
          <div className="flex flex-col gap-5 mb-8">

            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{ctx.isEn ? 'Selected Program' : 'Programa Selecionado'}</p>
                <p className="text-sm font-black text-slate-900 m-0 leading-tight">
                  {ctx.pacoteSelecionado?.titulo || '--'}
                </p>
                {((ctx.pacoteSelecionado?.variantes?.length || 0) > 1) && (
                  <p className="text-[10px] font-black text-blue-700 mt-2 mb-0 bg-blue-50 border border-blue-100 inline-block px-2.5 py-1 rounded-md uppercase tracking-widest">
                    {ctx.varianteSelecionada?.nome}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{ctx.isEn ? 'Base Price' : 'Valor Base'}</p>
                <span className="text-base font-black text-slate-900">{baseCalculado > 0 ? `${baseCalculado}€` : '--'}</span>
              </div>
            </div>

            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{ctx.isEn ? 'Dates' : 'Datas'}</p>
                <p className="text-sm font-bold text-slate-900 m-0">
                  {ctx.escolhasCompletas
                    ? (ctx.isDiaAvulsoFlexivel
                        ? `${ctx.diasSelecionados.length} Dia(s) Solto(s)`
                        : `${ctx.pacoteSelecionado?.quantidade} ${ctx.pacoteSelecionado?.tipo}(s) Selecionadas`)
                    : <span className="text-[#e2a41d] font-bold text-xs bg-amber-50 px-2 py-1 rounded-md border border-amber-100">Aguardando Seleção...</span>}
                </p>
              </div>
            </div>

            {(ctx.extraSeguro || ctx.extraTransporte) && (
              <div className="border-b border-slate-100 pb-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{ctx.isEn ? 'Extras' : 'Suplementos Extras'}</p>
                {ctx.extraSeguro && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><span className="text-sm">🛡️</span> Seguro</span>
                    <span className="text-xs font-black text-slate-900">+{ctx.custoSeguro}€</span>
                  </div>
                )}
                {ctx.extraTransporte && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><span className="text-sm">🚌</span> Transporte</span>
                    <span className="text-xs font-black text-slate-900">+{ctx.custoTransporte}€</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ctx.isEn ? 'Participants' : 'Participantes'}</span>
              <span className="text-base font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">x{ctx.quantidade}</span>
            </div>
          </div>
        )}

        {/* TOTAL BOX */}
        <div className="bg-slate-900 p-6 rounded-2xl mb-6 flex justify-between items-center shadow-lg">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total</span>
          <span className="text-4xl font-black text-white">
            {ctx.escolhasCompletas ? `${ctx.precoTotal}€` : '--'}
          </span>
        </div>

        {/* BOTÃO PRINCIPAL (CORRIGIDO: LARANJA COM TEXTO BRANCO) */}
        {ctx.isEsgotado ? (
          <button disabled className="w-full py-5 rounded-xl bg-slate-100 text-slate-400 font-black uppercase tracking-widest border border-slate-200">Esgotado</button>
        ) : (
          <button
            onClick={ctx.handleReservar}
            disabled={ctx.disabledReserva}
            className={`w-full py-5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
              ctx.disabledReserva
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-[#e2a41d] hover:bg-[#d4991b] text-white shadow-lg shadow-[#e2a41d]/30 hover:-translate-y-1'
            }`}
          >
            {textoBotao}
          </button>
        )}

        {!ctx.disabledReserva && (
          <div className="text-center mt-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              {ctx.isExternalLinkMode ? '🔗 Redirecionamento Seguro' : '🔒 Pagamento Seguro Garantido'}
            </span>
          </div>
        )}
      </div>

      {/* MODAL DE LEAD EXTERNO */}
      {ctx.showLeadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden relative">
            <button onClick={() => ctx.setShowLeadModal(false)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 hover:text-slate-900 font-black transition-colors">&times;</button>

            <div className="p-8 md:p-10">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-6 border border-blue-100">🚀</div>
              <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Quase lá!</h2>
              <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
                {ctx.isEn
                  ? "You will be redirected to the partner's official form. Leave your contact details so the organizer knows you came from HelloCamp."
                  : "Vai ser reencaminhado para o formulário oficial do parceiro. Indique o seu contacto para que a organização saiba que vem através da HelloCamp e lhe dê prioridade."}
              </p>

              <form onSubmit={ctx.submitExternalLead} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{ctx.isEn ? 'Parent / Guardian Name' : 'Nome do Encarregado'}</label>
                  <input required type="text" value={ctx.leadForm.nome} onChange={e => ctx.setLeadForm({...ctx.leadForm, nome: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder:text-slate-400" placeholder={ctx.isEn ? "John Doe" : "Ex: Rui Silva"} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{ctx.isEn ? 'E-mail Address' : 'E-mail'}</label>
                  <input required type="email" value={ctx.leadForm.email} onChange={e => ctx.setLeadForm({...ctx.leadForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder:text-slate-400" placeholder="email@exemplo.pt" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{ctx.isEn ? 'Phone Number' : 'Telefone'}</label>
                  <input required type="tel" value={ctx.leadForm.telefone} onChange={e => ctx.setLeadForm({...ctx.leadForm, telefone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-5 py-4 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder:text-slate-400" placeholder="912 345 678" />
                </div>

                <div className="pt-6">
                  <button type="submit" disabled={ctx.submittingLead} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-4 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3">
                    {ctx.submittingLead ? (ctx.isEn ? 'Redirecting...' : 'A redirecionar...') : (ctx.isEn ? 'Continue to Official Form' : 'Avançar para o Formulário')}
                    <span className="text-lg leading-none">&rarr;</span>
                  </button>
                  <p className="text-center text-[10px] font-bold text-slate-400 mt-5 uppercase tracking-widest">Ao avançar, aceita a Política de Privacidade.</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
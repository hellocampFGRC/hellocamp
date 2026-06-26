"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

  const modalidadeReserva = campo?.contrato_dados?.modalidadeReserva || 'direta';
  const isEmailMode = modalidadeReserva === 'email';

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
  }, [calendario]);

  useEffect(() => {
    if (pacotes.length > 0 && !pacoteSelecionado) {
      const primeiro = pacotes[0];
      setPacoteSelecionado(primeiro);
      if (primeiro.variantes.length > 0) setVarianteSelecionada(primeiro.variantes[0]);
    }
  }, [pacotes]);

  // Lógica do Calendário
  const handleDiaClick = (data: string) => {
    if (!pacoteSelecionado) return;
    if (pacoteSelecionado.tipo === 'dia') {
      setDiasSelecionados(prev => prev.includes(data) ? prev.filter(d => d !== data) : [...prev, data]);
    } else {
      if (diasSelecionados.includes(data)) return setDiasSelecionados([]);
      const dateObj = new Date(data);
      const dayOfWeek = dateObj.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startMonday = new Date(dateObj);
      startMonday.setDate(dateObj.getDate() - diffToMonday);
      
      const semanas = pacoteSelecionado.quantidade || 1;
      const endDay = new Date(startMonday);
      endDay.setDate(startMonday.getDate() + (7 * semanas) - 1);

      const diasDaSemana = datasDisponiveis.filter(d => {
         const dDate = new Date(d);
         return dDate >= startMonday && dDate <= endDay;
      });
      setDiasSelecionados(diasDaSemana);
    }
  };

  // Cálculos Financeiros
  const precoBase = varianteSelecionada?.preco || 0;
  const totalDias = pacoteSelecionado?.tipo === 'dia' ? diasSelecionados.length : (pacoteSelecionado?.quantidade || 1);
  
  const valSeguro = campo.extra_seguro || 0;
  const tipoSeguro = campo.tipo_extra_seguro || 'fixo';
  let custoSeguro = valSeguro > 0 ? (tipoSeguro === 'diario' ? (valSeguro * totalDias) : valSeguro) : 0;
  
  const valTransporte = campo.extra_transporte || 0;
  const tipoTransporte = campo.tipo_extra_transporte || 'diario';
  let custoTransporte = valTransporte > 0 ? (tipoTransporte === 'diario' ? (valTransporte * totalDias) : valTransporte) : 0;

  let totalExtras = 0;
  if (extraSeguro) totalExtras += custoSeguro;
  if (extraTransporte) totalExtras += custoTransporte;

  const multiplicadorPrecoBase = pacoteSelecionado?.tipo === 'dia' ? diasSelecionados.length : 1;
  const precoTotal = ((precoBase * multiplicadorPrecoBase) + totalExtras) * quantidade;

  const vagasTotais = campo.vagas_totais;
  const isEsgotado = vagasTotais !== null && vagasTotais <= 0;
  const bloqueioData = diasSelecionados.length === 0;
  const disabledReserva = !pacoteSelecionado || !varianteSelecionada || precoBase === 0 || isEsgotado || bloqueioData;

  const handleReservar = () => {
    if (disabledReserva) return;
    const params = new URLSearchParams();
    params.set("quantidade_criancas", quantidade.toString());
    params.set("turno", JSON.stringify({
      id: pacoteSelecionado.id,
      nome: `${pacoteSelecionado.titulo} (${varianteSelecionada.nome})`,
      dias_soltos: diasSelecionados,
      preco: varianteSelecionada.preco,
      tipo: pacoteSelecionado.tipo,
      quantidade: totalDias
    }));
    if (extraSeguro) params.set("ext_seguro", "true");
    if (extraTransporte) params.set("ext_transporte", "true");
    if (isEmailMode) params.set("modo", "email");
    router.push(`/${lang}/checkout/${campo.id}?${params.toString()}`);
  };

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const nextMonth = () => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
  const prevMonth = () => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  const datasVisiveis = datasDisponiveis.filter(d => {
    const date = new Date(d);
    return date.getMonth() === mesAtual.getMonth() && date.getFullYear() === mesAtual.getFullYear();
  });

  return (
    <ReservaContext.Provider value={{
      isEn, campo, pacotes, pacoteSelecionado, setPacoteSelecionado,
      varianteSelecionada, setVarianteSelecionada, quantidade, setQuantidade,
      diasSelecionados, setDiasSelecionados, mesAtual, datasVisiveis, nextMonth, prevMonth, handleDiaClick,
      extraSeguro, setExtraSeguro, valSeguro, custoSeguro,
      extraTransporte, setExtraTransporte, valTransporte, custoTransporte,
      precoTotal, precoBase, isEsgotado, disabledReserva, handleReservar, isEmailMode, capitalize
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

  return (
    <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 relative z-10" id="reserva">
      <h2 className="text-2xl font-black text-slate-900 mb-8 pb-4 border-b border-slate-50">
        {ctx.isEn ? 'Configure your Booking' : 'Configurar Inscrição'}
      </h2>

      {/* 1. PACOTE */}
      <div className="mb-8">
        <label className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
          <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
          {ctx.isEn ? 'Select Package' : 'Escolha o Programa'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ctx.pacotes.map((pac: any) => {
            const isActive = ctx.pacoteSelecionado?.id === pac.id;
            return (
              <div key={pac.id} onClick={() => { 
                  ctx.setPacoteSelecionado(pac); 
                  ctx.setDiasSelecionados([]);
                  if (pac.variantes.length > 0) ctx.setVarianteSelecionada(pac.variantes[0]);
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${isActive ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
              >
                <div>
                  <span className={`block text-base font-black ${isActive ? 'text-emerald-900' : 'text-slate-900'}`}>{pac.titulo}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {pac.tipo === 'semana' ? `${pac.quantidade} Semanas` : `${pac.quantidade} Dias`}
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                  {isActive && <span className="text-white text-[10px]">✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CALENDÁRIO */}
      <div className="mb-8">
        <label className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
          <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
          {ctx.pacoteSelecionado?.tipo === 'dia' ? (ctx.isEn ? 'Select Days' : 'Selecione as Datas') : (ctx.isEn ? 'Select Week' : 'Selecione a Semana')}
        </label>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={ctx.prevMonth} className="p-2 text-slate-400 hover:text-emerald-600 font-bold">&larr;</button>
            <span className="text-sm font-black uppercase tracking-widest text-slate-700">
              {ctx.capitalize(ctx.mesAtual.toLocaleDateString(ctx.isEn ? 'en-US' : 'pt-PT', { month: 'long', year: 'numeric' }))}
            </span>
            <button type="button" onClick={ctx.nextMonth} className="p-2 text-slate-400 hover:text-emerald-600 font-bold">&rarr;</button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {ctx.datasVisiveis.map((data: string) => {
              const isActive = ctx.diasSelecionados.includes(data);
              const dateObj = new Date(data);
              return (
                <button key={data} type="button" onClick={() => ctx.handleDiaClick(data)} 
                  className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all ${isActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-md z-10' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>{dateObj.toLocaleDateString(ctx.isEn ? 'en-GB' : 'pt-PT', { weekday: 'short' }).replace('.','')}</span>
                  <span className="text-lg font-black leading-none mt-1">{dateObj.getDate()}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 3. VARIANTE DE PREÇO */}
      {ctx.pacoteSelecionado && ctx.pacoteSelecionado.variantes.length > 1 && (
        <div className="mb-8">
          <label className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
            <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
            {ctx.isEn ? 'Food / Sleepover Options' : 'Opções (Alimentação / Dormida)'}
          </label>
          <div className="flex flex-wrap gap-3">
            {ctx.pacoteSelecionado.variantes.map((varia: Variante) => (
              <button key={varia.nome} onClick={() => ctx.setVarianteSelecionada(varia)} 
                className={`flex-1 px-5 py-4 rounded-xl text-sm font-black border-2 transition-all flex justify-between items-center ${ctx.varianteSelecionada?.nome === varia.nome ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}>
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
          <label className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
            <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">{ctx.pacoteSelecionado?.variantes.length > 1 ? '4' : '3'}</span>
            {ctx.isEn ? 'Optional Extras' : 'Extras Opcionais'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ctx.valSeguro > 0 && (
               <div onClick={() => ctx.setExtraSeguro(!ctx.extraSeguro)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${ctx.extraSeguro ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                 <div className="flex items-center gap-3">
                   <span className="text-xl">🛡️</span>
                   <div>
                     <span className={`block text-sm font-black ${ctx.extraSeguro ? 'text-emerald-900' : 'text-slate-700'}`}>{ctx.isEn ? 'Insurance' : 'Seguro Extra'}</span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+{ctx.custoSeguro}€</span>
                   </div>
                 </div>
                 <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${ctx.extraSeguro ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                    {ctx.extraSeguro && <span className="text-white text-[10px]">✓</span>}
                 </div>
               </div>
            )}
            {ctx.valTransporte > 0 && (
               <div onClick={() => ctx.setExtraTransporte(!ctx.extraTransporte)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${ctx.extraTransporte ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                 <div className="flex items-center gap-3">
                   <span className="text-xl">🚌</span>
                   <div>
                     <span className={`block text-sm font-black ${ctx.extraTransporte ? 'text-emerald-900' : 'text-slate-700'}`}>{ctx.isEn ? 'Transport' : 'Transporte'}</span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+{ctx.custoTransporte}€</span>
                   </div>
                 </div>
                 <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${ctx.extraTransporte ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                    {ctx.extraTransporte && <span className="text-white text-[10px]">✓</span>}
                 </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* 5. QUANTIDADE */}
      <div>
        <label className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
          <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
            {(ctx.pacoteSelecionado?.variantes.length > 1 && (ctx.valSeguro > 0 || ctx.valTransporte > 0)) ? '5' : '4'}
          </span>
          {ctx.isEn ? 'Number of Children' : 'Número de Participantes'}
        </label>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 w-max">
          <button type="button" onClick={() => ctx.setQuantidade((q: number) => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl bg-white text-slate-600 font-black shadow-sm hover:bg-slate-100 transition-colors">-</button>
          <span className="text-xl font-black text-slate-900 w-12 text-center">{ctx.quantidade}</span>
          <button type="button" onClick={() => ctx.setQuantidade((q: number) => Math.min(ctx.campo.vagas_totais || 99, q + 1))} className="w-10 h-10 rounded-xl bg-white text-slate-600 font-black shadow-sm hover:bg-slate-100 transition-colors">+</button>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// 4. COMPONENTE: CAIXA DE RESUMO (BARRA LATERAL)
// ==========================================
export function CaixaResumo() {
  const ctx = useContext(ReservaContext);
  if (!ctx) return null;

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl w-full relative">
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
                {ctx.diasSelecionados.length > 0 ? `${ctx.diasSelecionados.length} dia(s) selecionados` : <span className="text-red-500 text-xs">Falta selecionar</span>}
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
        <span className="text-3xl font-black text-emerald-600">{ctx.precoTotal > 0 ? `${ctx.precoTotal}€` : '--'}</span>
      </div>

      {/* BOTÃO */}
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
          {ctx.isEmailMode
            ? (ctx.isEn ? 'Request Booking' : 'Reservar c/ Entidade')
            : (ctx.isEn ? 'Book & Pay Now' : 'Reservar Vaga Agora')}
        </button>
      )}

      {!ctx.disabledReserva && (
        <div className="text-center mt-3">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
            🔒 Pagamento Seguro
          </span>
        </div>
      )}
    </div>
  );
}
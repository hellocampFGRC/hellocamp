"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";

// ==========================================
// TIPAGEM
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

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function CaixaReserva({ campo, lang, dict }: { campo: any, lang: string, dict: any }) {
  const router = useRouter();
  const isEn = lang === 'en';

  const modalidadeReserva = campo?.contrato_dados?.modalidadeReserva || 'direta';
  const isEmailMode = modalidadeReserva === 'email';

  // Dados vindos da base de dados
  const pacotes: Pacote[] = campo.pacotes || [];
  const calendario = campo.calendario_funcionamento || { data_inicio: "", data_fim: "", dias_semana: [1, 2, 3, 4, 5] };

  // Estados de Seleção
  const [pacoteSelecionado, setPacoteSelecionado] = useState<Pacote | null>(null);
  const [varianteSelecionada, setVarianteSelecionada] = useState<Variante | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  
  // Estado para múltiplos dias selecionados (apenas para tipo 'dia')
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [mesAtual, setMesAtual] = useState<Date>(new Date());
  const [datasDisponiveis, setDatasDisponiveis] = useState<string[]>([]);

  // Extras
  const [extraAlimentacao, setExtraAlimentacao] = useState(false);
  const [extraAlojamento, setExtraAlojamento] = useState(false);
  const [extraProlongamento, setExtraProlongamento] = useState(false);
  const [extraTransporte, setExtraTransporte] = useState(false);

  // Inicialização: Gerar calendário de dias permitidos
  useEffect(() => {
    if (calendario.data_inicio && calendario.data_fim) {
      const start = new Date(calendario.data_inicio);
      const end = new Date(calendario.data_fim);
      const permitidos = calendario.dias_semana || [1, 2, 3, 4, 5];
      const diasGerados: string[] = [];
      
      let curr = new Date(start);
      while (curr <= end) {
        if (permitidos.includes(curr.getDay())) {
          diasGerados.push(curr.toISOString().split('T')[0]);
        }
        curr.setDate(curr.getDate() + 1);
      }
      setDatasDisponiveis(diasGerados);
      if (diasGerados.length > 0) setMesAtual(new Date(diasGerados[0]));
    }
  }, [calendario.data_inicio, calendario.data_fim, calendario.dias_semana]);

  // Selecionar pacote inicial
  useEffect(() => {
    if (pacotes.length > 0) {
      const primeiro = pacotes[0];
      setPacoteSelecionado(primeiro);
      if (primeiro.variantes.length > 0) {
        setVarianteSelecionada(primeiro.variantes[0]);
      }
    }
  }, [pacotes]);

  // Toggle de dias (Seleção múltipla)
  const toggleDia = (data: string) => {
    setDiasSelecionados(prev => 
      prev.includes(data) ? prev.filter(d => d !== data) : [...prev, data]
    );
  };

  // Cálculo de Preços
  const precoBase = varianteSelecionada?.preco || 0;
  const totalDias = pacoteSelecionado?.tipo === 'dia' ? diasSelecionados.length : (pacoteSelecionado?.quantidade || 1);
  const noitesDormida = Math.max(1, totalDias - 1);

  const valAlimentacao = campo.extra_alimentacao || 0;
  const valAlojamento = campo.extra_alojamento || 0;
  const valProlongamento = campo.extra_prolongamento || 0;
  const valTransporte = campo.extra_transporte || 0;

  let totalExtras = 0;
  if (extraAlimentacao) totalExtras += (valAlimentacao * totalDias);
  if (extraAlojamento) totalExtras += (valAlojamento * noitesDormida);
  if (extraProlongamento) totalExtras += (valProlongamento * totalDias);
  if (extraTransporte) totalExtras += (valTransporte * totalDias);

  const precoTotal = ((precoBase * (pacoteSelecionado?.tipo === 'dia' ? diasSelecionados.length : 1)) + totalExtras) * quantidade;

  // Lotação
  const vagasTotais = campo.vagas_totais || 0;
  const isEsgotado = vagasTotais <= 0;
  const mostrarEscassez = vagasTotais > 0 && vagasTotais <= 3;

  // Checkout Handler
  const handleReservar = () => {
    if (!pacoteSelecionado || !varianteSelecionada) return;

    const params = new URLSearchParams();
    params.set("quantidade_criancas", quantidade.toString());
    params.set("turno", JSON.stringify({
      id: pacoteSelecionado.id,
      nome: `${pacoteSelecionado.titulo} (${varianteSelecionada.nome})`,
      dias_soltos: diasSelecionados, // Array de datas
      preco: varianteSelecionada.preco,
      tipo: pacoteSelecionado.tipo,
      quantidade: totalDias
    }));
    
    if (extraAlimentacao) params.set("ext_alimentacao", "true");
    if (extraAlojamento) params.set("ext_alojamento", "true");
    if (extraProlongamento) params.set("ext_prolongamento", "true");
    if (extraTransporte) params.set("ext_transporte", "true");
    if (isEmailMode) params.set("modo", "email");

    router.push(`/${lang}/checkout/${campo.id}?${params.toString()}`);
  };

  const bloqueioDiaSolto = pacoteSelecionado?.tipo === 'dia' && diasSelecionados.length === 0;
  const disabledReserva = !pacoteSelecionado || !varianteSelecionada || precoBase === 0 || isEsgotado || bloqueioDiaSolto;

  // Calendário UI Helpers
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const nextMonth = () => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
  const prevMonth = () => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  const datasVisiveis = datasDisponiveis.filter(d => {
    const date = new Date(d);
    return date.getMonth() === mesAtual.getMonth() && date.getFullYear() === mesAtual.getFullYear();
  });

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 w-full relative">
      
      {/* PREÇO */}
      <div className="mb-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isEn ? 'Price per unit' : 'Preço por unidade'}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-900 leading-none">{precoBase}€</span>
        </div>
      </div>

      {pacotes.length === 0 ? (
        <div className="w-full p-4 mb-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-bold text-slate-400">
          🗓️ {isEn ? 'No packages available' : 'Nenhum pacote disponível'}
        </div>
      ) : (
        <>
          {/* SELEÇÃO DE PACOTE */}
          <div className="mb-6">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
              {isEn ? 'Select Package' : 'Escolha o Programa'}
            </label>
            <div className="flex flex-col gap-3">
              {pacotes.map((pac) => {
                const isActive = pacoteSelecionado?.id === pac.id;
                return (
                  <div key={pac.id} onClick={() => { setPacoteSelecionado(pac); setDiasSelecionados([]); }} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${isActive ? 'bg-slate-900 border-slate-900 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-black ${isActive ? 'text-white' : 'text-slate-900'}`}>{pac.titulo}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {pac.tipo === 'semana' ? `${pac.quantidade} Semanas` : `${pac.quantidade} Dias`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CALENDÁRIO DIAS SOLTOS */}
          {pacoteSelecionado?.tipo === 'dia' && datasDisponiveis.length > 0 && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2">
              <label className="block text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-3">
                {isEn ? 'Choose dates' : 'Escolha os dias'}
              </label>
              
              <div className="flex items-center justify-between mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                <button type="button" onClick={prevMonth} className="p-2 text-slate-400 hover:text-indigo-600 font-bold">&larr;</button>
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                  {capitalize(mesAtual.toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { month: 'long', year: 'numeric' }))}
                </span>
                <button type="button" onClick={nextMonth} className="p-2 text-slate-400 hover:text-indigo-600 font-bold">&rarr;</button>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {datasVisiveis.map(data => {
                  const isActive = diasSelecionados.includes(data);
                  const dateObj = new Date(data);
                  return (
                    <button key={data} type="button" onClick={() => toggleDia(data)} className={`flex flex-col items-center justify-center py-2 rounded-lg border-2 transition-all ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-105' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400'}`}>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{dateObj.toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { weekday: 'short' }).replace('.','')}</span>
                      <span className="text-sm font-black leading-none mt-1">{dateObj.toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { day: '2-digit' })}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* VARIANTE */}
          {pacoteSelecionado && pacoteSelecionado.variantes.length > 1 && (
            <div className="mb-6">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">{isEn ? 'Choose Option' : 'Escolha a Variante'}</label>
              <div className="flex flex-wrap gap-2">
                {pacoteSelecionado.variantes.map((varia) => (
                  <button key={varia.nome} onClick={() => setVarianteSelecionada(varia)} className={`px-4 py-2.5 rounded-xl text-xs font-black border ${varianteSelecionada?.nome === varia.nome ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                    {varia.nome} ({varia.preco}€)
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* EXTRAS */}
      {!isEsgotado && (
        <div className="mb-6 border-t border-slate-100 pt-6">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">{isEn ? 'Extras' : 'Extras'}</p>
          <div className="flex flex-col gap-2">
            {valAlimentacao > 0 && <ExtraCheckbox icon="🍎" label={isEn ? 'Meals' : 'Alimentação'} price={valAlimentacao * totalDias} active={extraAlimentacao} onChange={() => setExtraAlimentacao(!extraAlimentacao)} />}
            {valAlojamento > 0 && <ExtraCheckbox icon="🏕️" label={isEn ? 'Sleepover' : 'Dormida'} price={valAlojamento * noitesDormida} active={extraAlojamento} onChange={() => setExtraAlojamento(!extraAlojamento)} />}
            {valProlongamento > 0 && <ExtraCheckbox icon="⏰" label={isEn ? 'Extended Hours' : 'Horário Extra'} price={valProlongamento * totalDias} active={extraProlongamento} onChange={() => setExtraProlongamento(!extraProlongamento)} />}
            {valTransporte > 0 && <ExtraCheckbox icon="🚌" label={isEn ? 'Transport' : 'Transporte'} price={valTransporte * totalDias} active={extraTransporte} onChange={() => setExtraTransporte(!extraTransporte)} />}
          </div>
        </div>
      )}

      {/* TOTAL */}
      {!isEsgotado && (
        <div className="bg-slate-50 p-5 rounded-2xl mb-6 flex justify-between items-center border border-slate-200">
          <span className="text-sm font-black text-slate-900 uppercase">Total</span>
          <span className="text-2xl font-black text-emerald-600">{precoTotal}€</span>
        </div>
      )}

      {/* BOTÃO */}
      {isEsgotado ? (
        <button disabled className="w-full py-4 rounded-xl bg-slate-200 text-slate-500 font-black uppercase">Esgotado</button>
      ) : (
        <button onClick={handleReservar} disabled={disabledReserva} className={`w-full py-4 rounded-xl text-sm font-black uppercase transition-all ${disabledReserva ? 'bg-slate-200 text-slate-400' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
          {isEmailMode ? (isEn ? 'Request Booking' : 'Reservar c/ Entidade') : (isEn ? 'Book Now' : 'Reservar Vaga')}
        </button>
      )}

      <div className="flex flex-col gap-2 mt-5 pt-5 border-t border-slate-100">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <span>🛡️</span>
          {isEn ? (campo.politica_cancelamento_en || 'Flexible Cancelation*') : (campo.politica_cancelamento || 'Cancelamento Moderado*')}
        </div>
      </div>
    </div>
  );
}

function ExtraCheckbox({ icon, label, price, active, onChange }: any) {
  return (
    <label className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={active} onChange={onChange} className="accent-emerald-600" />
        <span className="text-xs font-bold text-slate-700">{icon} {label}</span>
      </div>
      <span className="text-xs font-black text-emerald-600">+{price}€</span>
    </label>
  );
}
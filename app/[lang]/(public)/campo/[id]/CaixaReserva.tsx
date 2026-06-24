"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";

// ==========================================
// TIPAGEM DE DADOS
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
// COMPONENTE CAIXA DE RESERVA
// ==========================================
export default function CaixaReserva({ campo, lang, dict }: { campo: any, lang: string, dict: any }) {
  const router = useRouter();
  const isEn = lang === 'en';

  // Configuração da Modalidade
  const modalidadeReserva = campo?.contrato_dados?.modalidadeReserva || 'direta';
  const isEmailMode = modalidadeReserva === 'email';

  // Dados vindos da base de dados
  const pacotes: Pacote[] = campo.pacotes || [];
  const calendario = campo.calendario_funcionamento || { data_inicio: "", data_fim: "", dias_semana: [1, 2, 3, 4, 5] };

  // Estados de Seleção
  const [pacoteSelecionado, setPacoteSelecionado] = useState<Pacote | null>(null);
  const [varianteSelecionada, setVarianteSelecionada] = useState<Variante | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  
  // Estado para múltiplos dias selecionados
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [mesAtual, setMesAtual] = useState<Date>(new Date());
  const [datasDisponiveis, setDatasDisponiveis] = useState<string[]>([]);

  // Estados de Extras
  const [extraAlimentacao, setExtraAlimentacao] = useState(false);
  const [extraAlojamento, setExtraAlojamento] = useState(false);
  const [extraProlongamento, setExtraProlongamento] = useState(false);
  const [extraTransporte, setExtraTransporte] = useState(false);

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
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

  // Selecionar o primeiro pacote automaticamente
  useEffect(() => {
    if (pacotes.length > 0) {
      const primeiro = pacotes[0];
      setPacoteSelecionado(primeiro);
      if (primeiro.variantes.length > 0) {
        setVarianteSelecionada(primeiro.variantes[0]);
      }
    }
  }, [pacotes]);

  // ==========================================
  // LÓGICA DO CALENDÁRIO (DIAS OU SEMANAS)
  // ==========================================
  const handleDiaClick = (data: string) => {
    if (!pacoteSelecionado) return;

    if (pacoteSelecionado.tipo === 'dia') {
      // Modalidade "Dias Soltos": Adiciona ou remove o dia clicado
      setDiasSelecionados(prev => 
        prev.includes(data) 
          ? prev.filter(d => d !== data) 
          : [...prev, data]
      );
    } else if (pacoteSelecionado.tipo === 'semana') {
      // Modalidade "Semana": Seleciona a semana inteira (ou N semanas)
      if (diasSelecionados.includes(data)) {
        // Se clicar num dia já selecionado, limpa a seleção toda
        setDiasSelecionados([]);
        return;
      }

      const dateObj = new Date(data);
      const dayOfWeek = dateObj.getDay();
      
      // Descobrir a Segunda-feira da semana do dia clicado
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startMonday = new Date(dateObj);
      startMonday.setDate(dateObj.getDate() - diffToMonday);

      // Descobrir o Domingo de fecho (multiplicado pelo número de semanas do pacote)
      const semanas = pacoteSelecionado.quantidade || 1;
      const endDay = new Date(startMonday);
      endDay.setDate(startMonday.getDate() + (7 * semanas) - 1);

      // Filtrar todas as datas disponíveis que caem neste intervalo
      const diasDaSemana = datasDisponiveis.filter(d => {
         const dDate = new Date(d);
         return dDate >= startMonday && dDate <= endDay;
      });

      setDiasSelecionados(diasDaSemana);
    }
  };

  // ==========================================
  // CÁLCULO DE PREÇOS
  // ==========================================
  const precoBase = varianteSelecionada?.preco || 0;
  
  // Dias para efeitos de cálculo de Extras:
  // Se for Dia Solto, usa os dias selecionados. Se for Semana, usa a QTD do Pacote (Ex: 1) para multiplicar o Extra Global.
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

  // Multiplicador Base para o Preço do Programa (Semana cobra 1x o valor. Dia Solto cobra Nx o valor).
  const multiplicadorPrecoBase = pacoteSelecionado?.tipo === 'dia' ? diasSelecionados.length : 1;
  const precoTotal = ((precoBase * multiplicadorPrecoBase) + totalExtras) * quantidade;

  // Verificação de Lotação
  const vagasTotais = campo.vagas_totais || 0;
  const isEsgotado = vagasTotais <= 0;
  const mostrarEscassez = vagasTotais > 0 && vagasTotais <= 3;

  // ==========================================
  // SUBMISSÃO PARA CHECKOUT
  // ==========================================
  const handleReservar = () => {
    if (!pacoteSelecionado || !varianteSelecionada) return;

    const params = new URLSearchParams();
    params.set("quantidade_criancas", quantidade.toString());
    params.set("turno", JSON.stringify({
      id: pacoteSelecionado.id,
      nome: `${pacoteSelecionado.titulo} (${varianteSelecionada.nome})`,
      dias_soltos: diasSelecionados, // As datas exatas seguem para a BD e Email do Parceiro
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

  // Bloqueios
  const bloqueioData = diasSelecionados.length === 0;
  const disabledReserva = !pacoteSelecionado || !varianteSelecionada || precoBase === 0 || isEsgotado || bloqueioData;

  // Helpers UI
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  const nextMonth = () => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
  const prevMonth = () => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  
  const datasVisiveis = datasDisponiveis.filter(d => {
    const date = new Date(d);
    return date.getMonth() === mesAtual.getMonth() && date.getFullYear() === mesAtual.getFullYear();
  });

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl w-full relative">
      
      {/* CABEÇALHO DE PREÇO */}
      <div className="mb-6">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{isEn ? 'Price per child' : 'Preço por criança'}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-900 leading-none">{precoBase}€</span>
          <span className="text-sm font-bold text-slate-500">/ {isEn ? 'child' : 'criança'}</span>
        </div>
      </div>

      {pacotes.length === 0 ? (
        <div className="w-full p-4 mb-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-bold text-slate-400">
          🗓️ {isEn ? 'No packages available' : 'Nenhum pacote disponível'}
        </div>
      ) : (
        <>
          {/* SELEÇÃO DO PACOTE */}
          <div className="mb-6">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
              {isEn ? 'Select Package' : 'Escolha o Programa'}
            </label>
            <div className="flex flex-col gap-3">
              {pacotes.map((pac) => {
                const isActive = pacoteSelecionado?.id === pac.id;
                return (
                  <div
                    key={pac.id}
                    onClick={() => { setPacoteSelecionado(pac); setDiasSelecionados([]); }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isActive ? 'bg-slate-900 border-slate-900 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-black ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {pac.titulo}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {pac.tipo === 'semana' ? `${pac.quantidade} Semanas` : `${pac.quantidade} Dias`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CALENDÁRIO VISUAL (ATUALIZADO PARA VERDE) */}
          {pacoteSelecionado && datasDisponiveis.length > 0 && (
            <div className="mb-6 animate-in fade-in">
              <label className="block text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-3">
                {pacoteSelecionado.tipo === 'dia' ? (isEn ? 'Select your Days' : 'Selecione os Dias') : (isEn ? 'Select your Week' : 'Selecione a Semana')}
              </label>
              
              <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <button type="button" onClick={prevMonth} className="p-2 text-slate-400 hover:text-emerald-600 font-bold">&larr;</button>
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                  {capitalize(mesAtual.toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { month: 'long', year: 'numeric' }))}
                </span>
                <button type="button" onClick={nextMonth} className="p-2 text-slate-400 hover:text-emerald-600 font-bold">&rarr;</button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {datasVisiveis.map(data => {
                  const isActive = diasSelecionados.includes(data);
                  const dateObj = new Date(data);
                  return (
                    <button 
                      key={data} 
                      type="button" 
                      onClick={() => handleDiaClick(data)} 
                      className={`flex flex-col items-center justify-center py-2.5 rounded-xl border-2 transition-all ${
                        isActive 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md scale-105 z-10' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400'
                      }`}
                    >
                      <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>{dateObj.toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { weekday: 'short' }).replace('.','')}</span>
                      <span className="text-lg font-black leading-none mt-1">{dateObj.getDate()}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* VARIANTE DE PREÇO */}
          {pacoteSelecionado && pacoteSelecionado.variantes.length > 1 && (
            <div className="mb-6">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
                {isEn ? 'Choose Option' : 'Escolha a Variante'}
              </label>
              <div className="flex flex-wrap gap-2">
                {pacoteSelecionado.variantes.map((varia) => (
                  <button 
                    key={varia.nome} 
                    onClick={() => setVarianteSelecionada(varia)} 
                    className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all ${
                      varianteSelecionada?.nome === varia.nome 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
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
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
            {isEn ? 'Optional Extras' : 'Extras Opcionais'}
          </p>
          <div className="flex flex-col gap-2">
            {valAlimentacao > 0 && <ExtraCheckbox icon="🍎" label={isEn ? 'Meals' : 'Alimentação'} price={valAlimentacao * totalDias} active={extraAlimentacao} onChange={() => setExtraAlimentacao(!extraAlimentacao)} />}
            {valAlojamento > 0 && <ExtraCheckbox icon="🏕️" label={isEn ? 'Sleepover' : 'Dormida'} price={valAlojamento * noitesDormida} active={extraAlojamento} onChange={() => setExtraAlojamento(!extraAlojamento)} />}
            {valProlongamento > 0 && <ExtraCheckbox icon="⏰" label={isEn ? 'Extended Hours' : 'Horário Extra'} price={valProlongamento * totalDias} active={extraProlongamento} onChange={() => setExtraProlongamento(!extraProlongamento)} />}
            {valTransporte > 0 && <ExtraCheckbox icon="🚌" label={isEn ? 'Transport' : 'Transporte'} price={valTransporte * totalDias} active={extraTransporte} onChange={() => setExtraTransporte(!extraTransporte)} />}
          </div>
        </div>
      )}

      {/* QUANTIDADE E TOTAL */}
      {!isEsgotado && (
        <>
          <div className="mb-6 border-t border-slate-100 pt-6 flex items-center justify-between">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">
              {isEn ? 'Children' : 'Crianças'}
            </label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button type="button" onClick={() => setQuantidade(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-white text-slate-600 font-black shadow-sm hover:bg-slate-100 transition-colors">-</button>
              <span className="text-lg font-black text-slate-900 w-6 text-center">{quantidade}</span>
              <button type="button" onClick={() => setQuantidade(q => Math.min(vagasTotais || 99, q + 1))} className="w-8 h-8 rounded-lg bg-white text-slate-600 font-black shadow-sm hover:bg-slate-100 transition-colors">+</button>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl mb-6 flex justify-between items-center border border-slate-200 border-dashed">
            <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Total</span>
            <span className="text-2xl font-black text-emerald-600">{precoTotal > 0 ? `${precoTotal}€` : '--'}</span>
          </div>
        </>
      )}

      {mostrarEscassez && (
        <p className="text-center text-xs font-black text-red-500 mb-3 animate-pulse bg-red-50 py-2 rounded-lg border border-red-100">
          🔥 {isEn ? `Only ${vagasTotais} spots left!` : `Apenas ${vagasTotais} vagas restantes!`}
        </p>
      )}

      {/* BOTÃO RESERVAR */}
      {isEsgotado ? (
        <button disabled className="w-full py-4 rounded-xl bg-slate-200 text-slate-500 font-black uppercase tracking-widest">Esgotado</button>
      ) : (
        <button
          onClick={handleReservar}
          disabled={disabledReserva}
          className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
            disabledReserva
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-[#EBA914] hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:-translate-y-1'
          }`}
        >
          {isEmailMode
            ? (isEn ? 'Request Booking' : 'Reservar c/ Entidade')
            : (isEn ? 'Book & Pay Now' : 'Reservar Vaga Agora')}
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

// ==========================================
// SUB-COMPONENTE: CHECKBOX EXTRAS
// ==========================================
function ExtraCheckbox({ icon, label, price, active, onChange }: any) {
  return (
    <label className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={active} onChange={onChange} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
        <span className={`text-xs ${active ? 'font-black text-emerald-900' : 'font-bold text-slate-600'}`}>{icon} {label}</span>
      </div>
      <span className={`text-xs font-black ${active ? 'text-emerald-600' : 'text-slate-400'}`}>+{price}€</span>
    </label>
  );
}
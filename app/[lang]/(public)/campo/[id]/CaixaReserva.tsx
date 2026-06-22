"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";

export default function CaixaReserva({ campo, lang, dict }: { campo: any, lang: string, dict: any }) {
  const router = useRouter();
  const isEn = lang === 'en';

  const modalidadeReserva = campo?.contrato_dados?.modalidadeReserva || 'direta';
  const isEmailMode = modalidadeReserva === 'email';

  // 1. CARREGAMENTO DOS TURNOS MATRIZ GERADOS
  const turnos = isEn && campo.turnos_en && campo.turnos_en.length > 0 ? campo.turnos_en : (campo.turnos || []);
  const temTurnos = turnos.length > 0;

  // 2. ESTADOS DO NOVO MOTOR DE RESERVAS
  const [modalidade, setModalidade] = useState<"pacote" | "dia_solto">("pacote");
  const [pacoteSelecionado, setPacoteSelecionado] = useState<any>(null);
  const [diaSelecionado, setDiaSelecionado] = useState<string>("");
  const [horarioDiaSelecionado, setHorarioDiaSelecionado] = useState<any>(null);
  
  const [quantidade, setQuantidade] = useState(1);

  // Extras
  const [extraAlimentacao, setExtraAlimentacao] = useState(false);
  const [extraAlojamento, setExtraAlojamento] = useState(false);
  const [extraProlongamento, setExtraProlongamento] = useState(false);
  const [extraTransporte, setExtraTransporte] = useState(false);

  // 3. SEPARAÇÃO DAS OPÇÕES
  // O motor gerador criou nomes como "1ª Semana Julho (Pacote) - Dia Completo" ou "1ª Semana Julho - Dia 01/07 (Só Manhã)"
  const pacotesDisponiveis = turnos.filter((t: any) => t.nome.includes("(Pacote)") || t.nome.includes("(Package)"));
  const diasSoltosDisponiveis = turnos.filter((t: any) => t.nome.includes("- Dia ") || t.nome.includes("- Day "));

  // Agrupar dias soltos por Data Única
  const datasUnicasDiasSoltos = Array.from(new Set(diasSoltosDisponiveis.map((t: any) => t.data_inicio))).sort();

  // 4. EFEITOS DE SELEÇÃO AUTOMÁTICA
  useEffect(() => {
    if (pacotesDisponiveis.length > 0) setPacoteSelecionado(pacotesDisponiveis[0]);
    if (datasUnicasDiasSoltos.length > 0) setDiaSelecionado(datasUnicasDiasSoltos[0] as string);
  }, [turnos]);

  // Quando muda o dia, auto-selecionar o primeiro horário disponível desse dia
  useEffect(() => {
    if (diaSelecionado && modalidade === "dia_solto") {
      const horariosDesteDia = diasSoltosDisponiveis.filter((t: any) => t.data_inicio === diaSelecionado);
      if (horariosDesteDia.length > 0) setHorarioDiaSelecionado(horariosDesteDia[0]);
    }
  }, [diaSelecionado, modalidade]);

  // 5. CÁLCULO DE PREÇOS
  const valAlimentacao = campo.extra_alimentacao || 0;
  const valAlojamento = campo.extra_alojamento || 0;
  const valProlongamento = campo.extra_prolongamento || 0;
  const valTransporte = campo.extra_transporte || 0;

  let precoBase = 0;
  let diasParaCalculo = 1; // Default
  let turnoParaCheckout = null;

  if (temTurnos) {
    if (modalidade === "pacote" && pacoteSelecionado) {
      precoBase = Number(pacoteSelecionado.preco);
      turnoParaCheckout = pacoteSelecionado;
      
      // Cálculo aproximado de dias para o pacote (para multiplicar extras)
      const start = new Date(pacoteSelecionado.data_inicio);
      const end = new Date(pacoteSelecionado.data_fim);
      diasParaCalculo = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    } 
    else if (modalidade === "dia_solto" && horarioDiaSelecionado) {
      precoBase = Number(horarioDiaSelecionado.preco);
      turnoParaCheckout = horarioDiaSelecionado;
      diasParaCalculo = 1; // Um dia solto é sempre 1 dia
    }
  } else {
    precoBase = Number(campo.preco) || 0;
    diasParaCalculo = campo.duracao_dias || 5;
  }

  const noitesDormida = Math.max(1, diasParaCalculo - 1);
  let totalExtras = 0;
  if (extraAlimentacao) totalExtras += (valAlimentacao * diasParaCalculo);
  if (extraAlojamento) totalExtras += (valAlojamento * noitesDormida);
  if (extraProlongamento) totalExtras += (valProlongamento * diasParaCalculo);
  if (extraTransporte) totalExtras += (valTransporte * diasParaCalculo);

  const precoTotal = (precoBase + totalExtras) * quantidade;

  // 6. FORMATAÇÕES
  const formatarDataExibicao = (dStr: string) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { weekday: 'short', day: '2-digit', month: 'short' });
  };
  
  const limparNomeParaExibicao = (nomeCru: string) => {
    // Tira os sufixos logísticos "(Pacote) - Dia Completo" para ficar bonito
    return nomeCru.split('(')[0].split('- Dia')[0].trim();
  };

  const getHorarioTag = (nome: string) => {
    if (nome.includes("Completo") || nome.includes("Full")) return { tag: isEn ? "Full Day" : "Dia Completo", icon: "🌅" };
    if (nome.includes("Manhã") || nome.includes("Morning")) return { tag: isEn ? "Morning" : "Manhã", icon: "🥞" };
    if (nome.includes("Tarde") || nome.includes("Afternoon")) return { tag: isEn ? "Afternoon" : "Tarde", icon: "🥪" };
    return { tag: "Geral", icon: "🎟️" };
  };

  // 7. SUBMETER
  const handleReservar = () => {
    if (!turnoParaCheckout) return;

    const params = new URLSearchParams();
    params.set("quantidade_criancas", quantidade.toString());
    params.set("turno", JSON.stringify(turnoParaCheckout));
    params.set("dias_inscritos", diasParaCalculo.toString()); // Enviar "1" para dias soltos, ou os dias totais para pacote
    
    if (extraAlimentacao) params.set("ext_alimentacao", "true");
    if (extraAlojamento) params.set("ext_alojamento", "true");
    if (extraProlongamento) params.set("ext_prolongamento", "true");
    if (extraTransporte) params.set("ext_transporte", "true");
    if (isEmailMode) params.set("modo", "email");

    router.push(`/${lang}/checkout/${campo.id}?${params.toString()}`);
  };

  const vagasTurno = turnoParaCheckout ? Number(turnoParaCheckout.vagas) : 0;
  const isEsgotado = turnoParaCheckout && vagasTurno <= 0;
  const mostrarEscassez = turnoParaCheckout && vagasTurno > 0 && vagasTurno <= 3;
  const disabledReserva = !temTurnos || precoBase === 0 || isEsgotado || !turnoParaCheckout;

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-8 w-full">
      
      {/* 1. PREÇO DE DESTAQUE */}
      <div className="mb-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          {modalidade === 'pacote' ? (isEn ? 'Package Price' : 'Preço Pacote Inteiro') : (isEn ? 'Daily Rate' : 'Preço por Dia')}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-900 leading-none">{precoBase}€</span>
          <span className="text-sm font-bold text-slate-500">/ {isEn ? 'child' : 'criança'}</span>
        </div>
      </div>

      {!temTurnos ? (
         <div className="w-full p-4 mb-6 bg-slate-100 border border-slate-200 rounded-xl text-center text-sm font-bold text-slate-400">
           🗓️ {isEn ? 'Dates to be defined' : 'Datas a definir pela organização'}
         </div>
      ) : (
        <>
          {/* 2. ESCOLHA DE MODALIDADE DE COMPRA */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
            <button 
              onClick={() => setModalidade('pacote')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${modalidade === 'pacote' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {isEn ? 'Full Package' : 'Programa Inteiro'}
            </button>
            
            {diasSoltosDisponiveis.length > 0 && (
              <button 
                onClick={() => setModalidade('dia_solto')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${modalidade === 'dia_solto' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {isEn ? 'Single Days' : 'Dias Soltos'}
              </button>
            )}
          </div>

          {/* 3A. FLUXO: PACOTE COMPLETO */}
          {modalidade === "pacote" && pacotesDisponiveis.length > 0 && (
            <div className="mb-6 animate-in fade-in slide-in-from-left-2 duration-300">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">{isEn ? 'Select Program / Dates' : 'Escolha o Programa/Datas'}</label>
              <div className="flex flex-col gap-3">
                {pacotesDisponiveis.map((pac: any) => {
                  const isActive = pacoteSelecionado?.id === pac.id;
                  const isFull = Number(pac.vagas) <= 0;
                  const tagInfo = getHorarioTag(pac.nome);

                  return (
                    <div 
                      key={pac.id} 
                      onClick={() => !isFull && setPacoteSelecionado(pac)}
                      className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${isFull ? 'bg-slate-50 border-slate-200 opacity-50 grayscale' : (isActive ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 hover:border-slate-300')}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-sm font-black ${isActive ? 'text-white' : 'text-slate-900'}`}>
                          {limparNomeParaExibicao(pac.nome)}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {tagInfo.icon} {tagInfo.tag}
                        </span>
                      </div>
                      
                      <div className={`text-xs font-bold ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                        🗓️ {formatarDataExibicao(pac.data_inicio)} &rarr; {formatarDataExibicao(pac.data_fim)}
                      </div>

                      {isFull && <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]"><span className="bg-red-600 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded shadow-sm">{isEn ? 'SOLD OUT' : 'ESGOTADO'}</span></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3B. FLUXO: DIAS SOLTOS */}
          {modalidade === "dia_solto" && diasSoltosDisponiveis.length > 0 && (
            <div className="mb-6 animate-in fade-in slide-in-from-right-2 duration-300 bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100">
              
              <label className="block text-xs font-black text-emerald-800 uppercase tracking-widest mb-3">{isEn ? '1. Select the Date' : '1. Escolha o Dia Específico'}</label>
              
              <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar snap-x">
                {datasUnicasDiasSoltos.map((data: any) => {
                  const isActive = diaSelecionado === data;
                  const dateObj = new Date(data);
                  const diaSemana = dateObj.toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { weekday: 'short' });
                  const diaNumero = dateObj.toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { day: '2-digit' });

                  return (
                    <div 
                      key={data} 
                      onClick={() => setDiaSelecionado(data)}
                      className={`snap-center flex-shrink-0 w-16 h-[72px] flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all border-2 ${isActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-emerald-100 text-slate-600 hover:border-emerald-300'}`}
                    >
                      <span className={`text-[10px] font-black uppercase ${isActive ? 'text-emerald-100' : 'text-emerald-600/70'}`}>{diaSemana}</span>
                      <span className="text-xl font-black">{diaNumero}</span>
                    </div>
                  );
                })}
              </div>

              {diaSelecionado && (
                <div className="mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="block text-xs font-black text-emerald-800 uppercase tracking-widest mb-3">{isEn ? '2. Select the Schedule' : '2. Escolha o Horário'}</label>
                  <div className="flex flex-col gap-2">
                    {diasSoltosDisponiveis.filter((t: any) => t.data_inicio === diaSelecionado).map((horario: any) => {
                      const isActive = horarioDiaSelecionado?.id === horario.id;
                      const isFull = Number(horario.vagas) <= 0;
                      const tagInfo = getHorarioTag(horario.nome);

                      return (
                        <div 
                          key={horario.id} 
                          onClick={() => !isFull && setHorarioDiaSelecionado(horario)}
                          className={`relative flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer ${isFull ? 'bg-slate-50 border-slate-200 opacity-50 grayscale' : (isActive ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm' : 'bg-white border-emerald-200 hover:border-emerald-300')}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{tagInfo.icon}</span>
                            <span className={`text-sm font-black ${isActive ? 'text-white' : 'text-emerald-950'}`}>{tagInfo.tag}</span>
                          </div>
                          <span className={`text-sm font-black ${isActive ? 'text-emerald-200' : 'text-emerald-700'}`}>{horario.preco}€</span>
                          
                          {isFull && <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]"><span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">{isEn ? 'SOLD OUT' : 'ESGOTADO'}</span></div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 4. EXTRAS OPCIONAIS */}
      {!isEsgotado && (valAlimentacao > 0 || valAlojamento > 0 || valProlongamento > 0 || valTransporte > 0) && (
        <div className="mb-6 border-t border-slate-100 pt-6">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">{isEn ? 'Optional Extras' : 'Extras Opcionais'}</p>
          <div className="flex flex-col gap-3">
            {valAlimentacao > 0 && <ExtraCheckbox icon="🍎" label={isEn ? 'Meals' : 'Alimentação'} price={valAlimentacao * diasParaCalculo} active={extraAlimentacao} onChange={() => setExtraAlimentacao(!extraAlimentacao)} />}
            {valAlojamento > 0 && <ExtraCheckbox icon="🏕️" label={isEn ? 'Sleepover' : 'Dormida'} price={valAlojamento * noitesDormida} active={extraAlojamento} onChange={() => setExtraAlojamento(!extraAlojamento)} />}
            {valProlongamento > 0 && <ExtraCheckbox icon="⏰" label={isEn ? 'Extended Hours' : 'Horário Extra'} price={valProlongamento * diasParaCalculo} active={extraProlongamento} onChange={() => setExtraProlongamento(!extraProlongamento)} />}
            {valTransporte > 0 && <ExtraCheckbox icon="🚌" label={isEn ? 'Transport' : 'Transporte'} price={valTransporte * diasParaCalculo} active={extraTransporte} onChange={() => setExtraTransporte(!extraTransporte)} />}
          </div>
        </div>
      )}

      {/* 5. QUANTIDADE */}
      {!isEsgotado && (
        <div className="mb-8 border-t border-slate-100 pt-6">
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">{isEn ? 'Number of Children' : 'Quantidade de Crianças'}</label>
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); setQuantidade(q => Math.max(1, q - 1)); }} 
              className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-black text-lg hover:bg-slate-100 transition-colors shadow-sm flex items-center justify-center"
            >-</button>
            <span className="text-2xl font-black text-slate-900 w-8 text-center">{quantidade}</span>
            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); setQuantidade(q => Math.min(vagasTurno || 99, q + 1)); }} 
              className="w-10 h-10 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-black text-lg hover:bg-slate-100 transition-colors shadow-sm flex items-center justify-center"
            >+</button>
          </div>
        </div>
      )}

      {/* 6. TOTAL E BOTÃO RESERVA */}
      {!isEsgotado && turnoParaCheckout && (
        <div className="bg-slate-50 p-6 rounded-2xl mb-6 flex justify-between items-center border border-slate-100 shadow-inner">
          <span className="text-lg font-black text-slate-900">Total</span>
          <span className="text-3xl font-black text-emerald-600">{precoTotal}€</span>
        </div>
      )}

      {mostrarEscassez && (
        <p className="text-center text-sm font-black text-red-500 mb-3 animate-pulse">
          🔥 {isEn ? `Only ${vagasTurno} spots left in this schedule!` : `Apenas ${vagasTurno} vagas restantes neste horário!`}
        </p>
      )}

      {isEsgotado ? (
        <a href={`mailto:info@hellocamp.pt?subject=${encodeURIComponent(isEn ? 'Waitlist: ' : 'Lista de Espera: ')}${encodeURIComponent(campo.nome)} (${encodeURIComponent(turnoParaCheckout?.nome || '')})`} className="block w-full py-4 rounded-xl text-lg font-black text-center transition-all bg-slate-900 text-white hover:bg-slate-800 shadow-lg no-underline">
          {isEn ? 'Join Waitlist' : 'Juntar à Lista de Espera'}
        </a>
      ) : (
        <button type="button" onClick={handleReservar} disabled={disabledReserva} className={`w-full py-4 rounded-xl text-lg font-black transition-all ${disabledReserva ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#EBA914] hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:-translate-y-1'}`}>
          {isEmailMode ? (isEn ? 'Request to Book' : 'Reservar e Enviar E-mail') : (isEn ? 'Book & Pay Now' : 'Reservar e Pagar Agora')}
        </button>
      )}

      {/* SELOS DE CONFIANÇA & POLÍTICA DE CANCELAMENTO */}
      <div className="flex flex-col items-center justify-center gap-3 mt-5 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
          <span className="text-base leading-none">🛡️</span> 
          {isEn ? (campo.politica_cancelamento_en || 'Flexible Cancelation*') : (campo.politica_cancelamento || 'Cancelamento Moderado*')}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {isEmailMode ? (
            <><span className="text-base leading-none">✉️</span> {isEn ? 'Payment managed by organizer' : 'Pagamento a combinar com a entidade'}</>
          ) : (
            <><span className="text-base leading-none">🔒</span> {isEn ? 'Secure Payment via Stripe' : 'Pagamento Seguro via Stripe'}</>
          )}
        </div>
      </div>

    </div>
  );
}

function ExtraCheckbox({ icon, label, price, active, onChange }: { icon: string, label: string, price: number, active: boolean, onChange: () => void }) {
  return (
    <label className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border-2 ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={active} onChange={onChange} className="w-5 h-5 accent-emerald-600 cursor-pointer rounded" />
        <span className={`text-sm ${active ? 'font-black text-emerald-900' : 'font-bold text-slate-600'}`}>{icon} {label}</span>
      </div>
      <span className={`text-sm font-black ${active ? 'text-emerald-600' : 'text-slate-400'}`}>+{price}€</span>
    </label>
  );
}
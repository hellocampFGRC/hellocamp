"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";

export default function CaixaReserva({ campo, lang, dict }: { campo: any, lang: string, dict: any }) {
  const router = useRouter();
  const isEn = lang === 'en';

  const modalidadeReserva = campo?.contrato_dados?.modalidadeReserva || 'direta';
  const isEmailMode = modalidadeReserva === 'email';

  // 1. CARREGAR E SEPARAR TURNOS
  const turnos = isEn && campo.turnos_en && campo.turnos_en.length > 0 ? campo.turnos_en : (campo.turnos || []);
  const temTurnos = turnos.length > 0;

  const pacotesDisponiveis = turnos.filter((t: any) => !t.nome.includes("- Dia ") && !t.nome.includes("- Day "));
  const diasSoltosDisponiveis = turnos.filter((t: any) => t.nome.includes("- Dia ") || t.nome.includes("- Day "));

  // 2. ESTADOS
  const defaultMod = pacotesDisponiveis.length > 0 ? "pacote" : "dia_solto";
  const [modalidade, setModalidade] = useState<"pacote" | "dia_solto">(defaultMod);
  const [pacoteSelecionado, setPacoteSelecionado] = useState<any>(null);
  
  // Para Dias Soltos
  const [diaSelecionado, setDiaSelecionado] = useState<string>("");
  const [horarioDiaSelecionado, setHorarioDiaSelecionado] = useState<any>(null);
  
  const [quantidade, setQuantidade] = useState(1);
  const [extraAlimentacao, setExtraAlimentacao] = useState(false);
  const [extraAlojamento, setExtraAlojamento] = useState(false);
  const [extraProlongamento, setExtraProlongamento] = useState(false);
  const [extraTransporte, setExtraTransporte] = useState(false);

  // Garante que o estado acompanha a disponibilidade real
  useEffect(() => {
    if (pacotesDisponiveis.length === 0 && diasSoltosDisponiveis.length > 0) setModalidade("dia_solto");
    if (pacotesDisponiveis.length > 0 && diasSoltosDisponiveis.length === 0) setModalidade("pacote");
    
    if (pacotesDisponiveis.length > 0 && !pacoteSelecionado) setPacoteSelecionado(pacotesDisponiveis[0]);
  }, [turnos]);

  // Obter dias únicos disponíveis para construir o "Mini-Calendário"
  const datasUnicasDiasSoltos = Array.from(new Set(diasSoltosDisponiveis.map((t: any) => t.data_inicio))).sort();

  useEffect(() => {
    if (datasUnicasDiasSoltos.length > 0 && !diaSelecionado) setDiaSelecionado(datasUnicasDiasSoltos[0] as string);
  }, [datasUnicasDiasSoltos]);

  // Auto-selecionar o primeiro horário quando clica num dia
  useEffect(() => {
    if (diaSelecionado && modalidade === "dia_solto") {
      const horariosDesteDia = diasSoltosDisponiveis.filter((t: any) => t.data_inicio === diaSelecionado);
      if (horariosDesteDia.length > 0) setHorarioDiaSelecionado(horariosDesteDia[0]);
    }
  }, [diaSelecionado, modalidade, diasSoltosDisponiveis]);

  // 3. CÁLCULO DE PREÇOS
  const valAlimentacao = campo.extra_alimentacao || 0;
  const valAlojamento = campo.extra_alojamento || 0;
  const valProlongamento = campo.extra_prolongamento || 0;
  const valTransporte = campo.extra_transporte || 0;

  let precoBase = 0;
  let diasParaCalculo = 1;
  let turnoParaCheckout = null;

  if (temTurnos) {
    if (modalidade === "pacote" && pacoteSelecionado) {
      precoBase = Number(pacoteSelecionado.preco);
      turnoParaCheckout = pacoteSelecionado;
      const start = new Date(pacoteSelecionado.data_inicio);
      const end = new Date(pacoteSelecionado.data_fim);
      diasParaCalculo = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    } 
    else if (modalidade === "dia_solto" && horarioDiaSelecionado) {
      precoBase = Number(horarioDiaSelecionado.preco);
      turnoParaCheckout = horarioDiaSelecionado;
      diasParaCalculo = 1; 
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

  // 4. HELPERS VISUAIS
  const formatarDataExibicao = (dStr: string) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { weekday: 'short', day: '2-digit', month: 'short' });
  };
  
  const limparNomeParaExibicao = (nomeCru: string) => nomeCru.split('(')[0].split('- Dia')[0].split('- Day')[0].trim();

  const getHorarioTag = (nome: string) => {
    if (nome.includes("Completo") || nome.includes("Full")) return { tag: isEn ? "Full Day" : "Dia Completo", icon: "🌅" };
    if (nome.includes("Manhã") || nome.includes("Morning")) return { tag: isEn ? "Morning" : "Manhã", icon: "🥞" };
    if (nome.includes("Tarde") || nome.includes("Afternoon")) return { tag: isEn ? "Afternoon" : "Tarde", icon: "🥪" };
    return { tag: isEn ? "Program" : "Programa", icon: "🎟️" };
  };

  // 5. SUBMETER
  const handleReservar = () => {
    if (!turnoParaCheckout) return;

    const params = new URLSearchParams();
    params.set("quantidade_criancas", quantidade.toString());
    params.set("turno", JSON.stringify(turnoParaCheckout));
    params.set("dias_inscritos", diasParaCalculo.toString());
    
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
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 w-full relative">
      
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
         <div className="w-full p-4 mb-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-bold text-slate-400">
           🗓️ {isEn ? 'Dates to be defined' : 'Datas a definir pela organização'}
         </div>
      ) : (
        <>
          {/* ABAS INTELIGENTES (Esconde se não houver opção) */}
          {(pacotesDisponiveis.length > 0 && diasSoltosDisponiveis.length > 0) && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button onClick={() => setModalidade('pacote')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${modalidade === 'pacote' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {isEn ? 'Full Package' : 'Programa Inteiro'}
              </button>
              <button onClick={() => setModalidade('dia_solto')} className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${modalidade === 'dia_solto' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-700'}`}>
                {isEn ? 'Single Days' : 'Dias Soltos'}
              </button>
            </div>
          )}

          {/* FLUXO 1: PACOTES (SEMANAS) */}
          {modalidade === "pacote" && pacotesDisponiveis.length > 0 && (
            <div className="mb-6 animate-in fade-in duration-300">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">{isEn ? 'Select Dates & Schedule' : 'Escolha a Semana e Horário'}</label>
              <div className="flex flex-col gap-3">
                {pacotesDisponiveis.map((pac: any) => {
                  const isActive = pacoteSelecionado?.id === pac.id;
                  const isFull = Number(pac.vagas) <= 0;
                  const tagInfo = getHorarioTag(pac.nome);

                  return (
                    <div 
                      key={pac.id} 
                      onClick={() => !isFull && setPacoteSelecionado(pac)}
                      className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${isFull ? 'bg-slate-50 border-slate-200 opacity-50 grayscale' : (isActive ? 'bg-slate-900 border-slate-900 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300')}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-sm font-black ${isActive ? 'text-white' : 'text-slate-900'}`}>{limparNomeParaExibicao(pac.nome)}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {tagInfo.icon} {tagInfo.tag}
                        </span>
                      </div>
                      <div className={`text-[11px] font-bold ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                        🗓️ {formatarDataExibicao(pac.data_inicio)} &rarr; {formatarDataExibicao(pac.data_fim)}
                      </div>
                      {isFull && <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-xl"><span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm">{isEn ? 'SOLD OUT' : 'ESGOTADO'}</span></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FLUXO 2: MINI-CALENDÁRIO (DIAS SOLTOS) */}
          {modalidade === "dia_solto" && diasSoltosDisponiveis.length > 0 && (
            <div className="mb-6 animate-in fade-in duration-300 bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
              
              {/* Grelha de Calendário */}
              <label className="block text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-3">{isEn ? '1. Pick a Date' : '1. Escolha o Dia Específico'}</label>
              
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 mb-5">
                {datasUnicasDiasSoltos.map((data: any) => {
                  const isActive = diaSelecionado === data;
                  const dateObj = new Date(data);
                  const diaSemana = dateObj.toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { weekday: 'short' }).replace('.', '');
                  const diaNumero = dateObj.toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { day: '2-digit' });

                  return (
                    <div 
                      key={data} 
                      onClick={() => setDiaSelecionado(data)}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl cursor-pointer transition-all border ${isActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-md scale-105' : 'bg-white border-emerald-100 text-slate-600 hover:border-emerald-300'}`}
                    >
                      <span className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>{diaSemana}</span>
                      <span className={`text-base font-black leading-none ${isActive ? 'text-white' : 'text-slate-700'}`}>{diaNumero}</span>
                    </div>
                  );
                })}
              </div>

              {/* Botões de Horário para o dia selecionado */}
              {diaSelecionado && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 border-t border-emerald-100 pt-4">
                  <label className="block text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-3">{isEn ? '2. Select the Schedule' : '2. Qual é o Horário?'}</label>
                  <div className="flex flex-col gap-2.5">
                    {diasSoltosDisponiveis.filter((t: any) => t.data_inicio === diaSelecionado).map((horario: any) => {
                      const isActive = horarioDiaSelecionado?.id === horario.id;
                      const isFull = Number(horario.vagas) <= 0;
                      const tagInfo = getHorarioTag(horario.nome);

                      return (
                        <div 
                          key={horario.id} 
                          onClick={() => !isFull && setHorarioDiaSelecionado(horario)}
                          className={`relative flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer ${isFull ? 'bg-slate-50 border-slate-200 opacity-50 grayscale' : (isActive ? 'bg-emerald-700 border-emerald-700 text-white shadow-md' : 'bg-white border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50')}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl bg-white/20 p-1.5 rounded-lg leading-none">{tagInfo.icon}</span>
                            <span className={`text-sm font-black ${isActive ? 'text-white' : 'text-emerald-950'}`}>{tagInfo.tag}</span>
                          </div>
                          <span className={`text-sm font-black ${isActive ? 'text-emerald-100' : 'text-emerald-700'}`}>{horario.preco}€</span>
                          
                          {isFull && <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-lg"><span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">{isEn ? 'SOLD OUT' : 'ESGOTADO'}</span></div>}
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

      {/* EXTRAS */}
      {!isEsgotado && (valAlimentacao > 0 || valAlojamento > 0 || valProlongamento > 0 || valTransporte > 0) && (
        <div className="mb-6 border-t border-slate-100 pt-6">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">{isEn ? 'Optional Extras' : 'Extras Opcionais'}</p>
          <div className="flex flex-col gap-2">
            {valAlimentacao > 0 && <ExtraCheckbox icon="🍎" label={isEn ? 'Meals' : 'Alimentação'} price={valAlimentacao * diasParaCalculo} active={extraAlimentacao} onChange={() => setExtraAlimentacao(!extraAlimentacao)} />}
            {valAlojamento > 0 && <ExtraCheckbox icon="🏕️" label={isEn ? 'Sleepover' : 'Dormida'} price={valAlojamento * noitesDormida} active={extraAlojamento} onChange={() => setExtraAlojamento(!extraAlojamento)} />}
            {valProlongamento > 0 && <ExtraCheckbox icon="⏰" label={isEn ? 'Extended Hours' : 'Horário Extra'} price={valProlongamento * diasParaCalculo} active={extraProlongamento} onChange={() => setExtraProlongamento(!extraProlongamento)} />}
            {valTransporte > 0 && <ExtraCheckbox icon="🚌" label={isEn ? 'Transport' : 'Transporte'} price={valTransporte * diasParaCalculo} active={extraTransporte} onChange={() => setExtraTransporte(!extraTransporte)} />}
          </div>
        </div>
      )}

      {/* QUANTIDADE E TOTAL */}
      {!isEsgotado && (
        <>
          <div className="mb-6 border-t border-slate-100 pt-6 flex items-center justify-between">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">{isEn ? 'Children' : 'Crianças'}</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button type="button" onClick={(e) => { e.preventDefault(); setQuantidade(q => Math.max(1, q - 1)); }} className="w-8 h-8 rounded-lg bg-white text-slate-600 font-black shadow-sm">-</button>
              <span className="text-lg font-black text-slate-900 w-6 text-center">{quantidade}</span>
              <button type="button" onClick={(e) => { e.preventDefault(); setQuantidade(q => Math.min(vagasTurno || 99, q + 1)); }} className="w-8 h-8 rounded-lg bg-white text-slate-600 font-black shadow-sm">+</button>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl mb-6 flex justify-between items-center border border-slate-200 border-dashed">
            <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Total</span>
            <span className="text-2xl font-black text-emerald-600">{precoTotal}€</span>
          </div>
        </>
      )}

      {mostrarEscassez && (
        <p className="text-center text-xs font-black text-red-500 mb-3 animate-pulse bg-red-50 py-2 rounded-lg">
          🔥 {isEn ? `Only ${vagasTurno} spots left!` : `Apenas ${vagasTurno} vagas restantes!`}
        </p>
      )}

      {/* BOTÃO RESERVAR */}
      {isEsgotado ? (
        <a href={`mailto:info@hellocamp.pt?subject=${encodeURIComponent(isEn ? 'Waitlist: ' : 'Lista de Espera: ')}${encodeURIComponent(campo.nome)}`} className="block w-full py-4 rounded-xl text-sm font-black text-center transition-all bg-slate-900 text-white hover:bg-slate-800 shadow-lg no-underline uppercase tracking-widest">
          {isEn ? 'Join Waitlist' : 'Lista de Espera'}
        </a>
      ) : (
        <button type="button" onClick={handleReservar} disabled={disabledReserva} className={`w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${disabledReserva ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#EBA914] hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:-translate-y-1'}`}>
          {isEmailMode ? (isEn ? 'Request Booking' : 'Reservar c/ Entidade') : (isEn ? 'Book & Pay Now' : 'Reservar Vaga Agora')}
        </button>
      )}

      <div className="flex flex-col gap-2 mt-5 pt-5 border-t border-slate-100">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <span>🛡️</span> {isEn ? (campo.politica_cancelamento_en || 'Flexible Cancelation*') : (campo.politica_cancelamento || 'Cancelamento Moderado*')}
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {isEmailMode ? (
            <><span>✉️</span> {isEn ? 'Payment offline' : 'Pagamento externo'}</>
          ) : (
            <><span>🔒</span> {isEn ? 'Secure Stripe Payment' : 'Pagamento Seguro'}</>
          )}
        </div>
      </div>

    </div>
  );
}

function ExtraCheckbox({ icon, label, price, active, onChange }: { icon: string, label: string, price: number, active: boolean, onChange: () => void }) {
  return (
    <label className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={active} onChange={onChange} className="w-4 h-4 accent-emerald-600 cursor-pointer rounded" />
        <span className={`text-xs ${active ? 'font-black text-emerald-900' : 'font-bold text-slate-600'}`}>{icon} {label}</span>
      </div>
      <span className={`text-xs font-black ${active ? 'text-emerald-600' : 'text-slate-400'}`}>+{price}€</span>
    </label>
  );
}
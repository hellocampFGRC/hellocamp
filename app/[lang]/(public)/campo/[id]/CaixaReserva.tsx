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

export default function CaixaReserva({ campo, lang, dict }: { campo: any, lang: string, dict: any }) {
  const router = useRouter();
  const isEn = lang === 'en';

  const modalidadeReserva = campo?.contrato_dados?.modalidadeReserva || 'direta';
  const isEmailMode = modalidadeReserva === 'email';

  // Dados da nova estrutura
  const pacotes: Pacote[] = campo.pacotes || [];
  const calendario = campo.calendario_funcionamento || { data_inicio: "", data_fim: "", dias_semana: [] };

  // Estado para seleção
  const [pacoteSelecionado, setPacoteSelecionado] = useState<Pacote | null>(null);
  const [varianteSelecionada, setVarianteSelecionada] = useState<Variante | null>(null);
  const [quantidade, setQuantidade] = useState(1);

  // Extras (mantidos)
  const [extraAlimentacao, setExtraAlimentacao] = useState(false);
  const [extraAlojamento, setExtraAlojamento] = useState(false);
  const [extraProlongamento, setExtraProlongamento] = useState(false);
  const [extraTransporte, setExtraTransporte] = useState(false);

  // Inicialização: selecionar o primeiro pacote e a primeira variante
  useEffect(() => {
    if (pacotes.length > 0) {
      const primeiro = pacotes[0];
      setPacoteSelecionado(primeiro);
      if (primeiro.variantes.length > 0) {
        setVarianteSelecionada(primeiro.variantes[0]);
      }
    }
  }, [pacotes]);

  // Quando o pacote muda, selecionar a primeira variante
  useEffect(() => {
    if (pacoteSelecionado && pacoteSelecionado.variantes.length > 0) {
      setVarianteSelecionada(pacoteSelecionado.variantes[0]);
    }
  }, [pacoteSelecionado]);

  // Cálculo de preços
  const precoBase = varianteSelecionada?.preco || 0;
  const diasParaCalculo = pacoteSelecionado?.quantidade || 1;
  const noitesDormida = Math.max(1, diasParaCalculo - 1);

  // Extras
  const valAlimentacao = campo.extra_alimentacao || 0;
  const valAlojamento = campo.extra_alojamento || 0;
  const valProlongamento = campo.extra_prolongamento || 0;
  const valTransporte = campo.extra_transporte || 0;

  let totalExtras = 0;
  if (extraAlimentacao) totalExtras += (valAlimentacao * diasParaCalculo);
  if (extraAlojamento) totalExtras += (valAlojamento * noitesDormida);
  if (extraProlongamento) totalExtras += (valProlongamento * diasParaCalculo);
  if (extraTransporte) totalExtras += (valTransporte * diasParaCalculo);

  const precoTotal = (precoBase + totalExtras) * quantidade;

  // Verificar se há vagas (assumimos que o campo tem vagas totais, mas podemos verificar por pacote se houver)
  const vagasTotais = campo.vagas_totais || 0;
  const isEsgotado = vagasTotais <= 0;
  const mostrarEscassez = vagasTotais > 0 && vagasTotais <= 3;

  // Preparar dados para o checkout
  const construirTurnoParaCheckout = () => {
    if (!pacoteSelecionado || !varianteSelecionada) return null;

    // Nome composto: título do pacote + variante
    const nomeTurno = `${pacoteSelecionado.titulo} (${varianteSelecionada.nome})`;
    // Usamos as datas do calendário global (se existirem)
    const dataInicio = calendario.data_inicio || new Date().toISOString().split('T')[0];
    const dataFim = calendario.data_fim || dataInicio;

    return {
      id: pacoteSelecionado.id,
      nome: nomeTurno,
      data_inicio: dataInicio,
      data_fim: dataFim,
      preco: varianteSelecionada.preco,
      vagas: vagasTotais, // ou poderíamos ter vagas por pacote
      tipo: pacoteSelecionado.tipo,
      quantidade: pacoteSelecionado.quantidade
    };
  };

  const turnoParaCheckout = construirTurnoParaCheckout();

  // Submeter
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

  const disabledReserva = !pacoteSelecionado || !varianteSelecionada || precoBase === 0 || isEsgotado || !turnoParaCheckout;

  // Formatar datas
  const formatarDataExibicao = (dStr: string) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const periodoTexto = calendario.data_inicio && calendario.data_fim
    ? `${formatarDataExibicao(calendario.data_inicio)} - ${formatarDataExibicao(calendario.data_fim)}`
    : (isEn ? 'Dates to be defined' : 'Datas a definir');

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 w-full relative">
      
      {/* Cabeçalho com preço */}
      <div className="mb-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          {isEn ? 'Price per child' : 'Preço por criança'}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-900 leading-none">{precoBase}€</span>
          <span className="text-sm font-bold text-slate-500">/ {isEn ? 'child' : 'criança'}</span>
        </div>
        <p className="text-xs font-bold text-slate-400 mt-1">{periodoTexto}</p>
      </div>

      {pacotes.length === 0 ? (
        <div className="w-full p-4 mb-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-bold text-slate-400">
          🗓️ {isEn ? 'No packages available' : 'Nenhum pacote disponível'}
        </div>
      ) : (
        <>
          {/* Seleção do Pacote */}
          <div className="mb-6">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
              {isEn ? 'Select Package' : 'Escolha o Pacote'}
            </label>
            <div className="flex flex-col gap-3">
              {pacotes.map((pac) => {
                const isActive = pacoteSelecionado?.id === pac.id;
                const isFull = isEsgotado; // ou podemos ter vagas por pacote

                return (
                  <div
                    key={pac.id}
                    onClick={() => !isFull && setPacoteSelecionado(pac)}
                    className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${
                      isFull
                        ? 'bg-slate-50 border-slate-200 opacity-50 grayscale'
                        : isActive
                        ? 'bg-slate-900 border-slate-900 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-black ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {pac.titulo}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {pac.tipo === 'semana' ? `${pac.quantidade} ${isEn ? 'Weeks' : 'Semanas'}` : `${pac.quantidade} ${isEn ? 'Days' : 'Dias'}`}
                      </span>
                    </div>
                    {isFull && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-xl">
                        <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm">
                          {isEn ? 'SOLD OUT' : 'ESGOTADO'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seleção da Variante (se houver mais de uma) */}
          {pacoteSelecionado && pacoteSelecionado.variantes.length > 1 && (
            <div className="mb-6">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
                {isEn ? 'Choose Option' : 'Escolha a Opção'}
              </label>
              <div className="flex flex-wrap gap-2">
                {pacoteSelecionado.variantes.map((varia) => {
                  const isActive = varianteSelecionada?.nome === varia.nome;
                  return (
                    <button
                      key={varia.nome}
                      onClick={() => setVarianteSelecionada(varia)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border flex items-center gap-2 ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <span>{varia.nome}</span>
                      <span className={`text-[10px] ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {varia.preco}€
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Exibir preço da variante selecionada */}
          {varianteSelecionada && (
            <div className="mb-4 text-sm font-bold text-slate-700">
              {isEn ? 'Selected option' : 'Opção selecionada'}: {varianteSelecionada.nome} – {varianteSelecionada.preco}€
            </div>
          )}
        </>
      )}

      {/* EXTRAS */}
      {!isEsgotado && (valAlimentacao > 0 || valAlojamento > 0 || valProlongamento > 0 || valTransporte > 0) && (
        <div className="mb-6 border-t border-slate-100 pt-6">
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
            {isEn ? 'Optional Extras' : 'Extras Opcionais'}
          </p>
          <div className="flex flex-col gap-2">
            {valAlimentacao > 0 && (
              <ExtraCheckbox
                icon="🍎"
                label={isEn ? 'Meals' : 'Alimentação'}
                price={valAlimentacao * diasParaCalculo}
                active={extraAlimentacao}
                onChange={() => setExtraAlimentacao(!extraAlimentacao)}
              />
            )}
            {valAlojamento > 0 && (
              <ExtraCheckbox
                icon="🏕️"
                label={isEn ? 'Sleepover' : 'Dormida'}
                price={valAlojamento * noitesDormida}
                active={extraAlojamento}
                onChange={() => setExtraAlojamento(!extraAlojamento)}
              />
            )}
            {valProlongamento > 0 && (
              <ExtraCheckbox
                icon="⏰"
                label={isEn ? 'Extended Hours' : 'Horário Extra'}
                price={valProlongamento * diasParaCalculo}
                active={extraProlongamento}
                onChange={() => setExtraProlongamento(!extraProlongamento)}
              />
            )}
            {valTransporte > 0 && (
              <ExtraCheckbox
                icon="🚌"
                label={isEn ? 'Transport' : 'Transporte'}
                price={valTransporte * diasParaCalculo}
                active={extraTransporte}
                onChange={() => setExtraTransporte(!extraTransporte)}
              />
            )}
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
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setQuantidade(q => Math.max(1, q - 1)); }}
                className="w-8 h-8 rounded-lg bg-white text-slate-600 font-black shadow-sm"
              >
                -
              </button>
              <span className="text-lg font-black text-slate-900 w-6 text-center">{quantidade}</span>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setQuantidade(q => Math.min(vagasTotais || 99, q + 1)); }}
                className="w-8 h-8 rounded-lg bg-white text-slate-600 font-black shadow-sm"
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl mb-6 flex justify-between items-center border border-slate-200 border-dashed">
            <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Total</span>
            <span className="text-2xl font-black text-emerald-600">
              {precoTotal > 0 ? `${precoTotal}€` : '--'}
            </span>
          </div>
        </>
      )}

      {mostrarEscassez && (
        <p className="text-center text-xs font-black text-red-500 mb-3 animate-pulse bg-red-50 py-2 rounded-lg">
          🔥 {isEn ? `Only ${vagasTotais} spots left!` : `Apenas ${vagasTotais} vagas restantes!`}
        </p>
      )}

      {/* BOTÃO RESERVAR */}
      {isEsgotado ? (
        <a
          href={`mailto:info@hellocamp.pt?subject=${encodeURIComponent(isEn ? 'Waitlist: ' : 'Lista de Espera: ')}${encodeURIComponent(campo.nome)}`}
          className="block w-full py-4 rounded-xl text-sm font-black text-center transition-all bg-slate-900 text-white hover:bg-slate-800 shadow-lg no-underline uppercase tracking-widest"
        >
          {isEn ? 'Join Waitlist' : 'Lista de Espera'}
        </a>
      ) : (
        <button
          type="button"
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
          {isEn
            ? (campo.politica_cancelamento_en || 'Flexible Cancelation*')
            : (campo.politica_cancelamento || 'Cancelamento Moderado*')}
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

// Componente auxiliar para extras
function ExtraCheckbox({ icon, label, price, active, onChange }: { icon: string, label: string, price: number, active: boolean, onChange: () => void }) {
  return (
    <label
      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
        active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={active} onChange={onChange} className="w-4 h-4 accent-emerald-600 cursor-pointer rounded" />
        <span className={`text-xs ${active ? 'font-black text-emerald-900' : 'font-bold text-slate-600'}`}>
          {icon} {label}
        </span>
      </div>
      <span className={`text-xs font-black ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
        +{price}€
      </span>
    </label>
  );
}
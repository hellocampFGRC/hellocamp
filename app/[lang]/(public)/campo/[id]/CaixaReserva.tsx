"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";

export default function CaixaReserva({ campo, lang, dict }: { campo: any, lang: string, dict: any }) {
  const router = useRouter();
  const isEn = lang === 'en';

  const [quantidade, setQuantidade] = useState(1);
  
  // 1. Extrair turnos
  const turnos = isEn && campo.turnos_en && campo.turnos_en.length > 0 ? campo.turnos_en : (campo.turnos || []);
  const temTurnos = turnos.length > 0;
  
  const [turnoIndex, setTurnoIndex] = useState(0);
  const turnoSelecionado = temTurnos ? turnos[turnoIndex] : null;

  // Estado para escolher quantos dias (se o turno permitir)
  const [diasEscolhidos, setDiasEscolhidos] = useState<number | 'full'>('full');

  // Resetar a escolha dos dias sempre que muda de turno
  useEffect(() => {
    setDiasEscolhidos('full');
  }, [turnoIndex]);

  // 2. Extras
  const [extraAlimentacao, setExtraAlimentacao] = useState(false);
  const [extraAlojamento, setExtraAlojamento] = useState(false);
  const [extraProlongamento, setExtraProlongamento] = useState(false);
  const [extraTransporte, setExtraTransporte] = useState(false);

  const valAlimentacao = campo.extra_alimentacao || 0;
  const valAlojamento = campo.extra_alojamento || 0;
  const valProlongamento = campo.extra_prolongamento || 0;
  const valTransporte = campo.extra_transporte || 0;

  // 3. Cálculos Complexos
  let precoBase = 0;
  let diasParaCalculo = 5;

  if (turnoSelecionado) {
    const diasBaseTurno = Number(turnoSelecionado.dias) || campo.duracao_dias || 5;
    if (turnoSelecionado.permite_dias && diasEscolhidos !== 'full') {
      precoBase = Number(turnoSelecionado.preco_dia) * diasEscolhidos;
      diasParaCalculo = diasEscolhidos;
    } else {
      precoBase = Number(turnoSelecionado.preco);
      diasParaCalculo = diasBaseTurno;
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

  // 4. Formatar Data
  const formatarData = (dStr: string) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { day: '2-digit', month: '2-digit' });
  };

  const handleReservar = () => {
    const params = new URLSearchParams();
    params.set("quantidade_criancas", quantidade.toString());
    
    if (temTurnos) {
      // Passar o turno na língua original sempre para faturação
      params.set("turno", JSON.stringify(campo.turnos[turnoIndex]));
    }
    
    params.set("dias_inscritos", diasEscolhidos.toString());
    
    if (extraAlimentacao) params.set("ext_alimentacao", "true");
    if (extraAlojamento) params.set("ext_alojamento", "true");
    if (extraProlongamento) params.set("ext_prolongamento", "true");
    if (extraTransporte) params.set("ext_transporte", "true");

    router.push(`/${lang}/checkout/${campo.id}?${params.toString()}`);
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '1.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', position: 'sticky', top: '2rem' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
          {isEn ? 'Starting from' : 'A partir de'}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
          <span style={{ fontSize: '3rem', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>{precoBase}€</span>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>/ {isEn ? 'child' : 'criança'}</span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={labelStyle}>{isEn ? 'Select Shift' : 'Selecione o Turno'}</label>
        {temTurnos ? (
          <select value={turnoIndex} onChange={(e) => setTurnoIndex(Number(e.target.value))} style={selectStyle}>
            {turnos.map((t: any, i: number) => (
              <option key={i} value={i}>{t.nome} ({formatarData(t.data_inicio)} - {formatarData(t.data_fim)})</option>
            ))}
          </select>
        ) : (
          <div style={{ ...selectStyle, backgroundColor: '#f1f5f9', color: '#94a3b8' } as React.CSSProperties}>{isEn ? 'Dates to be defined' : 'Datas a definir'}</div>
        )}
      </div>

      {turnoSelecionado?.permite_dias && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: '0.75rem' }}>
          <label style={{...labelStyle, color: '#047857'}}>{isEn ? 'Select Duration' : 'Duração da Inscrição'}</label>
          <select value={diasEscolhidos} onChange={(e) => setDiasEscolhidos(e.target.value === 'full' ? 'full' : Number(e.target.value))} style={{...selectStyle, borderColor: '#a7f3d0'}}>
            <option value="full">{isEn ? 'Full Shift' : 'Turno Completo'} ({turnoSelecionado.preco}€)</option>
            {Array.from({ length: Number(turnoSelecionado.dias) || campo.duracao_dias || 5 }).map((_, i) => {
              const dias = i + 1;
              if (dias === (Number(turnoSelecionado.dias) || campo.duracao_dias || 5)) return null; // Esconde o dia igual ao turno completo
              return (
                <option key={dias} value={dias}>
                  {dias} {isEn ? (dias === 1 ? 'Day' : 'Days') : (dias === 1 ? 'Dia' : 'Dias')} ({Number(turnoSelecionado.preco_dia) * dias}€)
                </option>
              );
            })}
          </select>
        </div>
      )}

      {(valAlimentacao > 0 || valAlojamento > 0 || valProlongamento > 0 || valTransporte > 0) && (
        <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
          <p style={labelStyle}>{isEn ? 'Optional Extras' : 'Extras Opcionais'}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {valAlimentacao > 0 && <label style={checkboxStyle(extraAlimentacao)}><div style={{display:'flex', gap:'0.5rem'}}><input type="checkbox" checked={extraAlimentacao} onChange={e => setExtraAlimentacao(e.target.checked)} style={checkInputStyle} /><span style={{fontWeight: extraAlimentacao ? 'bold':'normal'}}>🍎 {isEn ? 'Meals' : 'Alimentação'}</span></div><span style={{fontWeight:'bold', color:'#059669'}}>+{(valAlimentacao * diasParaCalculo)}€</span></label>}
            {valAlojamento > 0 && <label style={checkboxStyle(extraAlojamento)}><div style={{display:'flex', gap:'0.5rem'}}><input type="checkbox" checked={extraAlojamento} onChange={e => setExtraAlojamento(e.target.checked)} style={checkInputStyle} /><span style={{fontWeight: extraAlojamento ? 'bold':'normal'}}>🏕️ {isEn ? 'Sleepover' : 'Dormida'}</span></div><span style={{fontWeight:'bold', color:'#059669'}}>+{(valAlojamento * noitesDormida)}€</span></label>}
            {valProlongamento > 0 && <label style={checkboxStyle(extraProlongamento)}><div style={{display:'flex', gap:'0.5rem'}}><input type="checkbox" checked={extraProlongamento} onChange={e => setExtraProlongamento(e.target.checked)} style={checkInputStyle} /><span style={{fontWeight: extraProlongamento ? 'bold':'normal'}}>⏰ {isEn ? 'Extended Hours' : 'Horário Extra'}</span></div><span style={{fontWeight:'bold', color:'#059669'}}>+{(valProlongamento * diasParaCalculo)}€</span></label>}
            {valTransporte > 0 && <label style={checkboxStyle(extraTransporte)}><div style={{display:'flex', gap:'0.5rem'}}><input type="checkbox" checked={extraTransporte} onChange={e => setExtraTransporte(e.target.checked)} style={checkInputStyle} /><span style={{fontWeight: extraTransporte ? 'bold':'normal'}}>🚌 {isEn ? 'Transport' : 'Transporte'}</span></div><span style={{fontWeight:'bold', color:'#059669'}}>+{(valTransporte * diasParaCalculo)}€</span></label>}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
        <label style={labelStyle}>{isEn ? 'Number of Children' : 'Quantidade de Crianças'}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={() => setQuantidade(q => Math.max(1, q - 1))} style={qtdBtnStyle}>-</button>
          <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', width: '30px', textAlign: 'center' }}>{quantidade}</span>
          <button onClick={() => setQuantidade(q => q + 1)} style={qtdBtnStyle}>+</button>
        </div>
      </div>

      <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: '1.125rem', fontWeight: '800', color: '#0f172a' }}>Total</span>
        <span style={{ fontSize: '2rem', fontWeight: '900', color: '#059669' }}>{precoTotal}€</span>
      </div>

      <button onClick={handleReservar} disabled={!temTurnos || precoBase === 0} style={btnReservaStyle(!temTurnos || precoBase === 0)}>
        {isEn ? 'Book Spot Now' : 'Reservar Vaga Agora'}
      </button>
      
      {(!temTurnos || precoBase === 0) && (
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#dc2626', marginTop: '1rem', fontWeight: 'bold' }}>
          {isEn ? 'No shifts defined yet.' : 'Reserva indisponível. Turnos não definidos.'}
        </p>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase' as const, marginBottom: '0.5rem' };
const selectStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '13px', fontWeight: '600', color: '#0f172a', outline: 'none', appearance: 'none' as const, cursor: 'pointer', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' };
const qtdBtnStyle = { width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#334155', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const checkboxStyle = (active: boolean) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#334155', cursor: 'pointer', padding: '0.75rem', border: active ? '2px solid #059669' : '1px solid #e2e8f0', borderRadius: '0.5rem', backgroundColor: active ? '#ecfdf5' : 'transparent', transition: 'all 0.2s' });
const checkInputStyle = { accentColor: '#059669', width: '16px', height: '16px', cursor: 'pointer' };
const btnReservaStyle = (disabled: boolean) => ({ width: '100%', padding: '1.25rem', backgroundColor: disabled ? '#cbd5e1' : '#de5d25', color: 'white', fontSize: '1.125rem', fontWeight: '900', borderRadius: '1rem', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: disabled ? 'none' : '0 8px 20px -6px rgba(222,93,37,0.4)' });
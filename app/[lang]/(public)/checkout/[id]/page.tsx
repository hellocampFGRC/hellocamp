"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import React from "react";

const IconCreditCard = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconShield = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconBus = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 6v6" />
    <path d="M15 6v6" />
    <path d="M2 12h19.6" />
    <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
    <circle cx="7" cy="18" r="2" />
    <path d="M9 18h5" />
    <circle cx="16" cy="18" r="2" />
  </svg>
);

const calcularIdade = (dataNasc: string) => {
  if (!dataNasc) return 0;
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
};

export default function CheckoutPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEn = lang === 'en';

  const [campo, setCampo] = useState<any>(null);
  const [organizador, setOrganizador] = useState<any>(null);
  const [criancas, setCriancas] = useState<any[]>([]);
  const [reservasExistentes, setReservasExistentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [processingStripe, setProcessingStripe] = useState(false);

  // ==========================================
  // PARÂMETROS DO URL (ALINHADOS COM CaixaReserva)
  // ==========================================
  const quantidade = parseInt(searchParams.get("quantidade_criancas") || "1");

  // A CaixaReserva envia apenas estes dois extras:
  const extSeguro = searchParams.get("ext_seguro") === "true";
  const extTransporte = searchParams.get("ext_transporte") === "true";

  // Extrair informações dinâmicas enviadas pela CaixaReserva
  let turnoSelecionado: any = null;
  try {
    const turnoParam = searchParams.get("turno");
    if (turnoParam) turnoSelecionado = JSON.parse(turnoParam);
  } catch (e) {
    console.error("Erro a parsear turno:", e);
  }

  // ==========================================
  // CÁLCULOS DINÂMICOS (IGUAIS AOS DA CaixaReserva)
  // ==========================================
  const isDiaSolto = turnoSelecionado?.tipo === 'dia';
  const numDiasSoltos = turnoSelecionado?.dias_soltos?.length || 1;
  const multiplicador = Number(turnoSelecionado?.multiplicador) || (isDiaSolto ? numDiasSoltos : 1);
  const precoBaseTurno = Number(turnoSelecionado?.preco) || Number(campo?.preco) || 0;

  // Total de dias para cálculo dos extras (diário)
  const totalDiasExtras = Number(turnoSelecionado?.quantidade) || 1;

  // Cálculo dos extras — MESMA LÓGICA da CaixaReserva
  const valSeguroUnit = Number(campo?.extra_seguro) || 0;
  const tipoSeguro = campo?.tipo_extra_seguro || 'fixo';
  const custoSeguroUnit = extSeguro
    ? (tipoSeguro === 'diario' ? valSeguroUnit * totalDiasExtras : valSeguroUnit)
    : 0;

  const valTransporteUnit = Number(campo?.extra_transporte) || 0;
  const tipoTransporte = campo?.tipo_extra_transporte || 'diario';
  const custoTransporteUnit = extTransporte
    ? (tipoTransporte === 'diario' ? valTransporteUnit * totalDiasExtras : valTransporteUnit)
    : 0;

  const totalExtrasPorCrianca = custoSeguroUnit + custoTransporteUnit;
  const precoBaseUnitario = precoBaseTurno * multiplicador;
  const precoFinalTotal = (precoBaseUnitario + totalExtrasPorCrianca) * quantidade;

  const isPagamentoFracionado = campo?.tipo_pagamento === '50_sinal';
  const valorACobrarAgora = isPagamentoFracionado ? (precoFinalTotal / 2) : precoFinalTotal;
  const valorPendente = isPagamentoFracionado ? (precoFinalTotal / 2) : 0;

  // ==========================================
  // ESTADOS DO FORMULÁRIO
  // ==========================================
  const [selecoesCriancas, setSelecoesCriancas] = useState<string[]>(Array(quantidade).fill(""));
  const [respostasCustomizadas, setRespostasCustomizadas] = useState<Record<number, Record<string, string>>>({});

  const [isGuest, setIsGuest] = useState(false);
  const [guestData, setGuestData] = useState({ nome: "", email: "", telefone: "" });
  const [concordaTermos, setConcordaTermos] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [indexToAssign, setIndexToAssign] = useState<number | null>(null);
  const [savingChild, setSavingChild] = useState(false);

  const [newChild, setNewChild] = useState({
    nome: '', nif: '', data_nascimento: '', sexo: '',
    restricoes_alimentares: '', tipo_sanguineo: '', doencas_cronicas: '',
    medicacao_regular: '', limitacoes_fisicas: '', sabe_nadar: '',
    sabe_andar_bicicleta: '', tamanho_tshirt: ''
  });

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      const { data: campoData } = await supabase.from("campos").select("*").eq("id", id).single();
      if (!campoData) {
        router.push(`/${lang}`);
        return;
      }
      setCampo(campoData);

      const { data: orgData } = await supabase.from("perfis").select("*").eq("id", campoData.organizador_id).single();
      setOrganizador(orgData);

      if (session) {
        setUser(session.user);
        const { data: criancasData } = await supabase
          .from("criancas")
          .select("*")
          .eq("cliente_id", session.user.id)
          .order('created_at', { ascending: false });
        setCriancas(criancasData || []);

        const { data: reservasData } = await supabase
          .from("reservas")
          .select("crianca_id, turno_nome")
          .eq("cliente_id", session.user.id)
          .eq("campo_id", id);
        setReservasExistentes(reservasData || []);
      } else {
        setIsGuest(true);
      }

      setLoading(false);
    };

    fetchDados();
  }, [id, lang, router]);

  const openNewChildModal = (index: number) => {
    setNewChild({
      nome: '', nif: '', data_nascimento: '', sexo: '',
      restricoes_alimentares: '', tipo_sanguineo: '', doencas_cronicas: '',
      medicacao_regular: '', limitacoes_fisicas: '', sabe_nadar: '',
      sabe_andar_bicicleta: '', tamanho_tshirt: ''
    });
    setIndexToAssign(index);
    setShowModal(true);
  };

  const handleSaveNewChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingChild(true);

    if (isGuest) {
      const fakeId = "guest_" + Date.now();
      const novoMembro = { id: fakeId, ...newChild, isGuestChild: true };
      setCriancas(prev => [novoMembro, ...prev]);

      const novasSelecoes = [...selecoesCriancas];
      novasSelecoes[indexToAssign as number] = fakeId;
      setSelecoesCriancas(novasSelecoes);
      setShowModal(false);
      setSavingChild(false);
      return;
    }

    const { data, error } = await supabase.from('criancas').insert({
      cliente_id: user.id,
      ...newChild
    }).select().single();

    if (error) {
      alert((isEn ? "Error adding: " : "Erro ao adicionar: ") + error.message);
    } else if (data && indexToAssign !== null) {
      setCriancas(prev => [data, ...prev]);
      const novasSelecoes = [...selecoesCriancas];
      novasSelecoes[indexToAssign] = data.id;
      setSelecoesCriancas(novasSelecoes);
      setShowModal(false);
    }
    setSavingChild(false);
  };

  const handleUpdateLocalCrianca = (idDaCrianca: string, campoTabela: string, valor: string) => {
    setCriancas(prev => prev.map(c => c.id === idDaCrianca ? { ...c, [campoTabela]: valor } : c));
  };

  const handleSaveDBCrianca = async (idDaCrianca: string, campoTabela: string, valor: string) => {
    if (isGuest) return;
    if (idDaCrianca.startsWith("guest_")) return;
    await supabase.from('criancas').update({ [campoTabela]: valor }).eq('id', idDaCrianca);
  };

  const handleRespostaCustomizada = (participantIndex: number, pergunta: string, resposta: string) => {
    setRespostasCustomizadas(prev => ({
      ...prev,
      [participantIndex]: {
        ...(prev[participantIndex] || {}),
        [pergunta]: resposta
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!concordaTermos) {
      alert(isEn ? "You must accept the Terms and Conditions to proceed." : "Tem de aceitar os Termos e Condições para avançar.");
      return;
    }

    if (selecoesCriancas.some(c => c === "")) {
      alert(isEn ? "Please select a child for each participant slot." : "Por favor, selecione um participante válido para todas as vagas.");
      return;
    }

    if (isGuest && (!guestData.nome || !guestData.email || !guestData.telefone)) {
      alert(isEn ? "Please fill in your contact details." : "Por favor, preencha os seus dados de contacto.");
      return;
    }

    setProcessingStripe(true);

    try {
      const criancasParaEnviar = selecoesCriancas.map(id => criancas.find(c => c.id === id));

      const payloadCheckout = {
        totalAmount: precoFinalTotal,
        userEmail: isGuest ? guestData.email : user.email,
        lang: lang,
        campoNome: campo.nome,
        stripeAccountId: organizador?.stripe_account_id,
        tipoPagamento: campo?.tipo_pagamento,
        campoId: campo.id,

        isGuest: isGuest,
        guestData: isGuest ? guestData : null,
        criancas: criancasParaEnviar,

        reservaSpecs: {
          turno_nome: turnoSelecionado?.nome || 'Programa Base',
          extras_escolhidos: {
            ext_seguro: extSeguro,
            ext_transporte: extTransporte,
            dias_inscritos: totalDiasExtras,
            dias_soltos: turnoSelecionado?.dias_soltos || []
          },
          respostas_customizadas: respostasCustomizadas,
          quantidade_reservas: quantidade,
          valor_por_reserva: precoFinalTotal / quantidade
        }
      };

      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadCheckout)
      });

      if (!res.ok) {
        const textError = await res.text();
        throw new Error((isEn ? "Server error " : "Erro Servidor ") + "(HTTP " + res.status + "): " + textError);
      }

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(isEn ? "Stripe error: no valid payment link in response." : "Erro na Stripe: A resposta não continha um link de pagamento válido.");
      }

    } catch (error: any) {
      alert(error.message);
      setProcessingStripe(false);
    }
  };

  if (loading || !campo) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />
          <span className="font-bold text-slate-500 text-sm">
            {isEn ? 'Preparing secure checkout...' : 'A preparar a sua reserva de forma segura...'}
          </span>
        </div>
      </div>
    );
  }

  const temPerguntasCustomizadas = campo?.perguntas_customizadas && campo.perguntas_customizadas.length > 0;

  return (
    <main className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20 pt-12 relative">

      {processingStripe && (
        <div className="fixed inset-0 bg-white/95 z-[100] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-6" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            {isEn ? 'Securing your spot...' : 'A garantir a sua vaga...'}
          </h2>
          <p className="text-slate-500">{isEn ? 'Please wait.' : 'Por favor, aguarde.'}</p>
        </div>
      )}

      {/* MODAL NOVO PARTICIPANTE */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-[650px] rounded-3xl p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 text-xl font-black cursor-pointer"
            >
              ×
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-6">
              {isEn ? 'Add New Participant' : 'Adicionar Novo Participante'}
            </h3>

            <form onSubmit={handleSaveNewChild} className="flex flex-col gap-5">
              <div>
                <label className={labelClass}>{isEn ? 'Full Name' : 'Nome Completo'} *</label>
                <input type="text" required value={newChild.nome} onChange={e => setNewChild({ ...newChild, nome: e.target.value })} className={inputClass} />
              </div>

              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className={labelClass}>{isEn ? 'Date of Birth' : 'Data Nasc.'} *</label>
                  <input type="date" required value={newChild.data_nascimento} onChange={e => setNewChild({ ...newChild, data_nascimento: e.target.value })} className={inputClass} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className={labelClass}>{isEn ? 'Gender' : 'Sexo'} *</label>
                  <select required value={newChild.sexo} onChange={e => setNewChild({ ...newChild, sexo: e.target.value })} className={selectClass}>
                    <option value="">{isEn ? 'Select...' : 'Selecione...'}</option>
                    <option value="Masculino">{isEn ? 'Male' : 'Masculino'}</option>
                    <option value="Feminino">{isEn ? 'Female' : 'Feminino'}</option>
                    <option value="Prefiro não dizer">{isEn ? 'Prefer not to say' : 'Prefiro não dizer'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>{isEn ? 'Allergies / Restrictions' : 'Alergias / Restrições'}</label>
                <textarea rows={2} value={newChild.restricoes_alimentares} onChange={e => setNewChild({ ...newChild, restricoes_alimentares: e.target.value })} className={`${inputClass} resize-y`} placeholder={isEn ? "None" : "Nenhuma"} />
              </div>

              <button
                type="submit"
                disabled={savingChild}
                className="mt-2 w-full p-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl border-none cursor-pointer disabled:opacity-60"
              >
                {savingChild ? (isEn ? 'Saving...' : 'A guardar...') : (isEn ? 'Save Participant' : 'Guardar Participante')}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-6 flex flex-wrap gap-12 items-start">

        <div className="flex-[1_1_60%] min-w-[320px] flex flex-col gap-8">

          {/* HEADER GUEST */}
          {isGuest && (
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-base font-black text-amber-800 m-0 mb-1">
                  {isEn ? 'Checking out as Guest' : 'A reservar como Convidado'}
                </h3>
                <p className="text-[13px] text-amber-700 m-0">
                  {isEn ? 'Already have an account?' : 'Já tem conta criada?'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('redirect_after_login', window.location.href);
                  router.push(`/${lang}/login`);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer border-none"
              >
                {isEn ? 'Login to speed up' : 'Fazer Login e acelerar'}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">

            {/* DADOS PARENTE (GUEST) */}
            {isGuest && (
              <section className="bg-white p-10 rounded-3xl shadow-sm">
                <h2 className="text-xl font-extrabold m-0 mb-6">
                  {isEn ? 'Your Details (Parent/Guardian)' : 'Os Seus Dados (Encarregado)'}
                </h2>
                <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div>
                    <label className={labelClass}>{isEn ? 'Full Name' : 'Nome Completo'} *</label>
                    <input type="text" required value={guestData.nome} onChange={e => setGuestData({ ...guestData, nome: e.target.value })} className={inputClass} placeholder={isEn ? "John Doe" : "Ex: Rui Silva"} />
                  </div>
                  <div>
                    <label className={labelClass}>{isEn ? 'Email Address' : 'E-mail'} *</label>
                    <input type="email" required value={guestData.email} onChange={e => setGuestData({ ...guestData, email: e.target.value })} className={inputClass} placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <label className={labelClass}>{isEn ? 'Phone Number' : 'Telefone'} *</label>
                    <input type="tel" required value={guestData.telefone} onChange={e => setGuestData({ ...guestData, telefone: e.target.value })} className={inputClass} placeholder="912 345 678" />
                  </div>
                </div>
              </section>
            )}

            {/* PARTICIPANTES */}
            <section className="bg-white p-10 rounded-3xl shadow-sm">
              <h2 className="text-xl font-extrabold m-0 mb-6">
                {isEn ? 'Participants' : 'Participantes'}
              </h2>

              {Array.from({ length: quantidade }).map((_, i) => {
                const childId = selecoesCriancas[i];
                const childInfo = criancas.find(c => c.id === childId);

                return (
                  <div
                    key={i}
                    className={i !== quantidade - 1 ? "mb-10 pb-10 border-b border-dashed border-slate-200" : ""}
                  >
                    <label className="block text-xs font-bold text-emerald-600 mb-2 uppercase">
                      {isEn ? `Participant ${i + 1}` : `Participante ${i + 1}`}
                    </label>

                    <div className="flex gap-4 items-center">
                      <select
                        required
                        value={childId}
                        onChange={(e) => {
                          const novas = [...selecoesCriancas];
                          novas[i] = e.target.value;
                          setSelecoesCriancas(novas);
                        }}
                        className={`${selectClass} flex-1`}
                      >
                        <option value="">{isEn ? 'Choose a child...' : 'Escolha um participante...'}</option>
                        {criancas.map(c => {
                          const idade = calcularIdade(c.data_nascimento);
                          const idadeForaLimite = (campo.idade_min && idade < campo.idade_min) || (campo.idade_max && idade > campo.idade_max);
                          const jaInscritoNesteTurno = reservasExistentes.some(r => r.crianca_id === c.id && r.turno_nome === (turnoSelecionado?.nome || 'Programa Base'));
                          const jaSelecionadoNesteForm = selecoesCriancas.includes(c.id) && selecoesCriancas[i] !== c.id;

                          const isDisabled = idadeForaLimite || jaInscritoNesteTurno || jaSelecionadoNesteForm;

                          let aviso = "";
                          if (idadeForaLimite) aviso = isEn ? `(Age not allowed: ${idade} yrs)` : `(Idade não permitida: ${idade} anos)`;
                          else if (jaInscritoNesteTurno) aviso = isEn ? "(Already registered)" : "(Já inscrito neste turno)";
                          else if (jaSelecionadoNesteForm) aviso = isEn ? "(Selected in this order)" : "(Selecionado nesta compra)";

                          return (
                            <option key={c.id} value={c.id} disabled={isDisabled}>
                              {c.nome} {aviso}
                            </option>
                          );
                        })}
                      </select>

                      <button
                        type="button"
                        onClick={() => openNewChildModal(i)}
                        className="px-5 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl border border-emerald-200 cursor-pointer whitespace-nowrap"
                      >
                        + {isEn ? 'New' : 'Novo'}
                      </button>
                    </div>

                    {childInfo && (
                      <div className="mt-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-5">
                          <h4 className="text-[13px] font-extrabold text-slate-900 uppercase">
                            {isEn ? 'Verify Details & Safety' : 'Verificar Detalhes de Segurança'}
                          </h4>
                        </div>

                        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label className={labelClass}>{isEn ? 'Full Name' : 'Nome Completo'}</label>
                            <input type="text" required value={childInfo.nome || ''} onChange={e => handleUpdateLocalCrianca(childId, 'nome', e.target.value)} onBlur={e => handleSaveDBCrianca(childId, 'nome', e.target.value)} className={inputClass} />
                          </div>

                          <div>
                            <label className={labelClass}>{isEn ? 'Date of Birth' : 'Data Nascimento'}</label>
                            <input type="date" required value={childInfo.data_nascimento || ''} onChange={e => handleUpdateLocalCrianca(childId, 'data_nascimento', e.target.value)} onBlur={e => handleSaveDBCrianca(childId, 'data_nascimento', e.target.value)} className={inputClass} />
                          </div>

                          <div>
                            <label className={labelClass}>{isEn ? 'Gender' : 'Sexo'}</label>
                            <select value={childInfo.sexo || ''} onChange={e => { handleUpdateLocalCrianca(childId, 'sexo', e.target.value); handleSaveDBCrianca(childId, 'sexo', e.target.value); }} className={selectClass}>
                              <option value="Masculino">{isEn ? 'Male' : 'Masculino'}</option>
                              <option value="Feminino">{isEn ? 'Female' : 'Feminino'}</option>
                              <option value="Prefiro não dizer">{isEn ? 'Prefer not to say' : 'Prefiro não dizer'}</option>
                            </select>
                          </div>

                          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #cbd5e1', paddingTop: '1rem', marginTop: '0.5rem' }}>
                            <label className={`${labelClass} !text-red-700`}>
                              {isEn ? 'Medical Profile (Allergies & Conditions)' : 'Perfil Médico (Alergias e Condições)'}
                            </label>
                          </div>

                          <div style={{ gridColumn: '1 / -1' }}>
                            <label className={labelClass}>{isEn ? 'Food Allergies / Restrictions' : 'Alergias Alimentares'}</label>
                            <input type="text" value={childInfo.restricoes_alimentares || ''} onChange={e => handleUpdateLocalCrianca(childId, 'restricoes_alimentares', e.target.value)} onBlur={e => handleSaveDBCrianca(childId, 'restricoes_alimentares', e.target.value)} className={inputClass} placeholder={isEn ? "None" : "Nenhuma"} />
                          </div>

                          <div style={{ gridColumn: '1 / -1' }}>
                            <label className={labelClass}>{isEn ? 'Chronic Diseases / Medication' : 'Doenças Crónicas ou Medicação Regular'}</label>
                            <input type="text" value={childInfo.doencas_cronicas || ''} onChange={e => handleUpdateLocalCrianca(childId, 'doencas_cronicas', e.target.value)} onBlur={e => handleSaveDBCrianca(childId, 'doencas_cronicas', e.target.value)} className={inputClass} placeholder={isEn ? "None" : "Nenhuma"} />
                          </div>
                        </div>
                      </div>
                    )}

                    {childInfo && temPerguntasCustomizadas && (
                      <div className="mt-6 bg-blue-50 p-6 rounded-2xl border border-blue-200">
                        <h4 className="text-[13px] font-extrabold text-blue-800 uppercase mb-5">
                          {isEn ? 'Specific Questions for this Camp' : 'Perguntas Específicas do Programa'}
                        </h4>

                        <div className="grid gap-5">
                          {campo.perguntas_customizadas.map((perguntaOriginal: string, pIdx: number) => {
                            const perguntaVisivel = isEn && campo.perguntas_customizadas_en && campo.perguntas_customizadas_en[pIdx]
                              ? campo.perguntas_customizadas_en[pIdx]
                              : perguntaOriginal;
                            return (
                              <div key={pIdx}>
                                <label className={`${labelClass} !text-blue-900`}>{perguntaVisivel} *</label>
                                <input
                                  type="text"
                                  required
                                  value={respostasCustomizadas[i]?.[perguntaOriginal] || ''}
                                  onChange={e => handleRespostaCustomizada(i, perguntaOriginal, e.target.value)}
                                  className={`${inputClass} !border-blue-300 !bg-white`}
                                  placeholder={isEn ? 'Your answer...' : 'A sua resposta...'}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>

            {/* PAGAMENTO E TERMOS */}
            <section className="bg-white p-10 rounded-3xl shadow-sm">
              <h2 className="text-xl font-extrabold mb-6">
                {isEn ? 'Secure Payment & Terms' : 'Pagamento Seguro e Termos'}
              </h2>

              {isPagamentoFracionado ? (
                <div className="p-6 bg-blue-50 border border-blue-300 rounded-2xl mb-6">
                  <p className="font-black text-blue-900 mb-2 m-0">
                    {isEn ? 'Payment Plan (50% Deposit)' : 'Facilidade de Pagamento (Sinal de 50%)'}
                  </p>
                  <p className="text-sm text-blue-800 m-0 leading-relaxed">
                    {isEn
                      ? `To secure your spot today, you only pay a deposit of ${valorACobrarAgora.toFixed(2)}€. The remaining balance (${valorPendente.toFixed(2)}€) will be automatically charged 1 week before the camp starts.`
                      : `Para garantir a sua vaga hoje, paga apenas um sinal de ${valorACobrarAgora.toFixed(2)}€. O valor remanescente (${valorPendente.toFixed(2)}€) será cobrado automaticamente 1 semana antes do início do programa.`}
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-2xl mb-6">
                  <p className="font-black text-emerald-900 mb-2 m-0">
                    {isEn ? 'Full Payment' : 'Pagamento a Pronto (100%)'}
                  </p>
                  <p className="text-sm text-emerald-800 m-0 leading-relaxed">
                    {isEn
                      ? `This camp requires full payment upfront to secure your spot. The total amount is ${valorACobrarAgora.toFixed(2)}€.`
                      : `Este programa requer o pagamento da totalidade no ato da reserva. O valor a pagar agora é de ${valorACobrarAgora.toFixed(2)}€.`}
                  </p>
                </div>
              )}

              <div className="p-6 bg-slate-50 border border-slate-300 rounded-2xl flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                    <IconCreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 m-0 mb-0.5">Stripe Checkout</p>
                    <p className="text-[13px] text-slate-500 m-0">
                      {isEn ? 'Pay 100% securely via MB WAY, Credit or Debit Card.' : 'Pague de forma 100% segura através de MB WAY, Cartão de Crédito ou Débito.'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-center font-bold text-slate-900">
                  <span className="italic text-blue-800">MB WAY</span>
                  <span className="italic text-slate-900 font-black">VISA</span>
                </div>
              </div>

              <div className="mt-8 p-4 border border-dashed border-slate-300 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={concordaTermos}
                    onChange={e => setConcordaTermos(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-slate-900 cursor-pointer"
                  />
                  <span className="text-[13px] text-slate-600 leading-relaxed">
                    {isEn ? (
                      <>
                        I declare that I am of legal age and have read and accept HelloCamp's{' '}
                        <Link href={`/${lang}/termos`} target="_blank" className="text-emerald-600 font-bold underline">
                          Terms & Conditions
                        </Link>
                        . {isGuest && "By continuing, a secure account will be automatically generated to manage this booking."}
                      </>
                    ) : (
                      <>
                        Declaro que sou maior de idade, e confirmo ter lido e aceite os{' '}
                        <Link href={`/${lang}/termos`} target="_blank" className="text-emerald-600 font-bold underline">
                          Termos e Condições
                        </Link>{' '}
                        da plataforma. {isGuest && "Ao prosseguir, será criada automaticamente uma conta segura associada ao seu email para poder gerir esta reserva."}
                      </>
                    )}
                  </span>
                </label>
              </div>

            </section>

            <button
              type="submit"
              disabled={processingStripe || !concordaTermos}
              className={`w-full p-5 bg-slate-900 text-white text-lg font-black rounded-2xl border-none transition-all ${
                processingStripe || !concordaTermos
                  ? 'cursor-not-allowed opacity-70'
                  : 'cursor-pointer shadow-lg shadow-slate-900/30 hover:-translate-y-0.5'
              }`}
            >
              {isEn ? `Confirm and Pay ${valorACobrarAgora.toFixed(2)}€` : `Confirmar e Pagar ${valorACobrarAgora.toFixed(2)}€`} {isPagamentoFracionado ? (isEn ? '(Deposit)' : '(Sinal)') : ''}
            </button>
          </form>
        </div>

        {/* SIDEBAR RESUMO */}
        <aside className="flex-[1_1_30%] min-w-[320px] sticky top-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm">
            <h3 className="text-lg font-black mb-6 border-b-2 border-slate-100 pb-4">
              {isEn ? 'Booking Summary' : 'Resumo da Reserva'}
            </h3>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase">
                  {isEn ? 'Program' : 'Programa'}
                </span>
                <p className="text-[15px] font-extrabold text-slate-900 m-0">
                  {turnoSelecionado?.nome || campo?.nome}
                </p>
              </div>

              {turnoSelecionado?.dias_soltos?.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase">
                    {isEn ? 'Selected Dates' : 'Datas Selecionadas'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {turnoSelecionado.dias_soltos.map((d: string) => (
                      <span key={d} className="bg-slate-100 text-slate-700 text-[11px] px-2 py-1 rounded-md font-bold">
                        {new Date(d).toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { day: '2-digit', month: 'short' })}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs text-slate-500 font-bold uppercase">
                  {isEn ? 'Duration' : 'Duração'}
                </span>
                <p className="text-sm font-semibold text-slate-700 m-0">
                  {totalDiasExtras} {totalDiasExtras === 1
                    ? (turnoSelecionado?.tipo === 'semana' ? (isEn ? 'Week' : 'Semana') : (isEn ? 'Day' : 'Dia'))
                    : (turnoSelecionado?.tipo === 'semana' ? (isEn ? 'Weeks' : 'Semanas') : (isEn ? 'Days' : 'Dias'))}
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-bold uppercase">
                  {isEn ? `Base Price (x${quantidade})` : `Preço Base (x${quantidade})`}
                </span>
                <p className="text-sm font-semibold text-slate-700 m-0">
                  {(precoBaseUnitario * quantidade).toFixed(2)}€
                </p>
              </div>

              {(extSeguro || extTransporte) && (
                <div>
                  <span className="text-xs text-emerald-600 font-bold uppercase">
                    {isEn ? '+ Selected Extras' : '+ Extras Selecionados'}
                  </span>
                  <div className="flex flex-col gap-1 mt-1.5">
                    {extSeguro && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <IconShield className="w-3.5 h-3.5 text-emerald-500" />
                          {isEn ? 'Insurance' : 'Seguro'}
                        </span>
                        <span className="font-bold text-slate-800">
                          {(custoSeguroUnit * quantidade).toFixed(2)}€
                        </span>
                      </div>
                    )}
                    {extTransporte && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <IconBus className="w-3.5 h-3.5 text-emerald-500" />
                          {isEn ? 'Transport' : 'Transporte'}
                        </span>
                        <span className="font-bold text-slate-800">
                          {(custoTransporteUnit * quantidade).toFixed(2)}€
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t-2 border-dashed border-slate-200 pt-6 flex justify-between items-center">
              <span className="text-base font-bold text-slate-900">
                {isEn ? 'Total Cost' : 'Custo Total'}
              </span>
              <span className="text-lg font-black text-slate-900">
                {precoFinalTotal.toFixed(2)}€
              </span>
            </div>

            <div className="flex justify-between items-center mt-4 bg-emerald-50 p-3 px-4 rounded-lg border border-emerald-200">
              <span className="text-sm font-bold text-emerald-900">
                {isEn ? 'To Pay Now' : 'A Pagar Agora'}
              </span>
              <span className="text-2xl font-black text-emerald-600">
                {valorACobrarAgora.toFixed(2)}€
              </span>
            </div>

            {isPagamentoFracionado && (
              <div className="flex justify-between items-center mt-2 p-2 px-4">
                <span className="text-sm font-bold text-slate-500">
                  {isEn ? 'Pending Balance' : 'Faltará Pagar'}
                </span>
                <span className="text-xl font-extrabold text-amber-500">
                  {valorPendente.toFixed(2)}€
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mt-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <IconShield className="w-3.5 h-3.5" />
              {isEn ? 'Secure Payment' : 'Pagamento Seguro'}
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}

// ==========================================
// ESTILOS TAILWIND REUTILIZÁVEIS
// ==========================================
const labelClass = "block text-[11px] font-extrabold text-slate-500 uppercase mb-1.5";
const inputClass = "w-full p-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors";
const selectClass = "p-3 pr-10 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold text-slate-900 outline-none appearance-none cursor-pointer focus:border-emerald-500 transition-colors";
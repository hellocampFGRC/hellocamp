"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import React from "react";

// ==========================================
// FUNÇÕES AUXILIARES E ÍCONES
// ==========================================
const IconShield = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconCreditCard = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconExternalLink = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

const calcularIdade = (dataNasc: string) => {
  if (!dataNasc) return 0;
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
};

// ==========================================
// COMPONENTE PRINCIPAL DE CHECKOUT
// ==========================================
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
  const [processingState, setProcessingState] = useState(false);

  // ==========================================
  // PARÂMETROS DO URL E CÁLCULOS
  // ==========================================
  const quantidade = parseInt(searchParams.get("quantidade_criancas") || "1");
  const extSeguro = searchParams.get("ext_seguro") === "true";
  const extTransporte = searchParams.get("ext_transporte") === "true";

  let turnoSelecionado: any = null;
  let opcoesParticipantesUrl: any = {};
  
  try {
    const turnoParam = searchParams.get("turno");
    if (turnoParam) turnoSelecionado = JSON.parse(turnoParam);
    
    const opcoesParam = searchParams.get("opcoes_participantes");
    if (opcoesParam) opcoesParticipantesUrl = JSON.parse(opcoesParam);
  } catch (e) { 
    console.error("Erro a parsear parametros URL:", e); 
  }

  const isDiaSolto = turnoSelecionado?.tipo === 'dia';
  const numDiasSoltos = turnoSelecionado?.dias_soltos?.length || 1;
  const multiplicador = Number(turnoSelecionado?.multiplicador) || (isDiaSolto ? numDiasSoltos : 1);
  const precoBaseTurno = Number(turnoSelecionado?.preco) || Number(campo?.preco) || 0;

  const totalDiasExtras = Number(turnoSelecionado?.quantidade) || 1;

  const valSeguroUnit = Number(campo?.extra_seguro) || 0;
  const tipoSeguro = campo?.tipo_extra_seguro || 'fixo';
  const custoSeguroUnit = extSeguro ? (tipoSeguro === 'diario' ? valSeguroUnit * totalDiasExtras : valSeguroUnit) : 0;

  const valTransporteUnit = Number(campo?.extra_transporte) || 0;
  const tipoTransporte = campo?.tipo_extra_transporte || 'diario';
  const custoTransporteUnit = extTransporte ? (tipoTransporte === 'diario' ? valTransporteUnit * totalDiasExtras : valTransporteUnit) : 0;

  const totalExtrasPorCrianca = custoSeguroUnit + custoTransporteUnit;
  const precoBaseUnitario = precoBaseTurno * multiplicador;
  const precoFinalTotal = (precoBaseUnitario + totalExtrasPorCrianca) * quantidade;

  const isPagamentoFracionado = campo?.tipo_pagamento === '50_sinal';
  const valorACobrarAgora = isPagamentoFracionado ? (precoFinalTotal / 2) : precoFinalTotal;
  const valorPendente = isPagamentoFracionado ? (precoFinalTotal / 2) : 0;

  // ==========================================
  // ESTADOS DO FORMULÁRIO E CRIANÇAS
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

  // ==========================================
  // BUSCAR DADOS (ON MOUNT)
  // ==========================================
  useEffect(() => {
    const fetchDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      const { data: campoData } = await supabase.from("campos").select("*").eq("id", id).single();
      if (!campoData) { router.push(`/${lang}`); return; }
      setCampo(campoData);

      const { data: orgData } = await supabase.from("perfis").select("*").eq("id", campoData.organizador_id).single();
      setOrganizador(orgData);

      if (session) {
        setUser(session.user);
        
        // Se a modalidade não for externa, carregamos as crianças do utilizador para ele escolher
        if (campoData.modalidade_reserva !== 'link_externo') {
          const { data: criancasData } = await supabase.from("criancas").select("*").eq("cliente_id", session.user.id).order('created_at', { ascending: false });
          setCriancas(criancasData || []);

          const { data: reservasData } = await supabase.from("reservas").select("crianca_id, turno_nome").eq("cliente_id", session.user.id).eq("campo_id", id);
          setReservasExistentes(reservasData || []);
        } else {
          // Se for link externo e ele estiver com login, pré-preenche os dados de contacto
          const { data: perfilData } = await supabase.from('perfis').select('nome_completo, email, telefone').eq('id', session.user.id).single();
          if (perfilData) {
             setGuestData({ nome: perfilData.nome_completo || '', email: perfilData.email || '', telefone: perfilData.telefone || '' });
          }
        }
      } else {
        setIsGuest(true);
      }
      setLoading(false);
    };

    fetchDados();
  }, [id, lang, router]);

  // ==========================================
  // LÓGICA DE CRIANÇAS (APENAS PARA RESERVA DIRETA)
  // ==========================================
  const openNewChildModal = (index: number) => {
    setNewChild({
      nome: '', nif: '', data_nascimento: '', sexo: '', restricoes_alimentares: '', tipo_sanguineo: '', doencas_cronicas: '',
      medicacao_regular: '', limitacoes_fisicas: '', sabe_nadar: '', sabe_andar_bicicleta: '', tamanho_tshirt: ''
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
      setShowModal(false); setSavingChild(false);
      return;
    }

    const { data, error } = await supabase.from('criancas').insert({ cliente_id: user.id, ...newChild }).select().single();
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

  // ==========================================
  // SUBMISSÃO & CHECKOUT (HÍBRIDO)
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concordaTermos) return alert(isEn ? "You must accept the Terms and Conditions to proceed." : "Tem de aceitar os Termos e Condições para avançar.");
    
    const isExterna = campo.modalidade_reserva === 'link_externo';

    if (!isExterna && selecoesCriancas.some(c => c === "")) return alert(isEn ? "Please select a child for each participant slot." : "Por favor, selecione um participante válido para todas as vagas.");
    
    // Tanto externo como guest direto precisam de dados preenchidos
    if (!guestData.nome || !guestData.email || !guestData.telefone) {
      if (isExterna || isGuest) return alert(isEn ? "Please fill in your contact details." : "Por favor, preencha os seus dados de contacto.");
    }

    setProcessingState(true);

    try {
      if (isExterna) {
        // FLUXO DE REDIRECIONAMENTO EXTERNO (Sem pagamentos, apenas gera Lead)
        const payloadLead = {
          nome_cliente: guestData.nome,
          email_cliente: guestData.email,
          telefone_cliente: guestData.telefone,
          lang: lang,
          campoId: campo.id,
          campoNome: campo.nome,
          organizadorEmail: organizador?.email,
          organizadorNome: organizador?.empresa_nome,
          turnoInteresse: turnoSelecionado?.nome || 'Geral',
          precoEstimado: precoFinalTotal,
          linkExterno: campo.link_externo_reserva
        };

        const res = await fetch('/api/gerar-lead-externa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadLead)
        });

        if (!res.ok) throw new Error(isEn ? "Error generating redirection." : "Erro ao gerar redirecionamento.");
        const data = await res.json();
        
        // Redireciona o utilizador para o site do parceiro
        window.location.href = data.url;

      } else {
        // FLUXO NORMAL STRIPE CHECKOUT
        const criancasParaEnviar = selecoesCriancas.map((id, index) => {
          const c = criancas.find(cr => cr.id === id);
          return {
            ...c,
            escolhas_multiplas_url: opcoesParticipantesUrl[index + 1] || {}
          };
        });

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
            opcoes_participantes_url: opcoesParticipantesUrl, 
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
        if (data.url) window.location.href = data.url;
        else throw new Error(data.error || (isEn ? "Stripe error: no valid payment link." : "Erro na Stripe: Nenhum link válido."));
      }

    } catch (error: any) {
      alert(error.message);
      setProcessingState(false);
    }
  };

  const labelClass = "block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2";
  const inputClass = "w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white transition-colors shadow-sm";
  const selectClass = "w-full p-4 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 outline-none appearance-none cursor-pointer focus:border-[#0E3A68] transition-colors shadow-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.8rem_auto] bg-[position:right_1.25rem_center] bg-no-repeat";

  if (loading || !campo) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-bold text-slate-400 text-[10px] uppercase tracking-widest animate-pulse">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#0E3A68] animate-spin mb-4" />
        {isEn ? 'Preparing secure checkout...' : 'A preparar a sua reserva segura...'}
      </div>
    );
  }

  const isExterna = campo.modalidade_reserva === 'link_externo';
  const perguntasDeTexto = (campo?.perguntas_customizadas || []).filter((p: string) => p.startsWith('TEXTO|') || !p.startsWith('ESCOLHA|'));

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 pt-8 md:pt-12 relative">

      {/* OVERLAY DE REDIRECIONAMENTO */}
      {processingState && (
        <div className="fixed inset-0 bg-white/95 z-[100] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-[#0E3A68] rounded-full animate-spin mb-6 shadow-sm" />
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
            {isEn ? 'Securing your spot...' : 'A processar o seu pedido...'}
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            {isExterna 
              ? (isEn ? 'Redirecting to the official organizer site...' : 'A redirecionar para a plataforma oficial do organizador...')
              : (isEn ? 'Please wait. Redirecting to Stripe.' : 'Por favor, aguarde o redirecionamento para o pagamento seguro.')}
          </p>
        </div>
      )}

      {/* MODAL NOVO PARTICIPANTE (SÓ APARECE SE NÃO FOR EXTERNO) */}
      {showModal && !isExterna && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 md:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 font-black cursor-pointer transition-colors">&times;</button>
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">{isEn ? 'Add Participant' : 'Novo Participante'}</h3>

            <form onSubmit={handleSaveNewChild} className="flex flex-col gap-6">
              <div>
                <label className={labelClass}>{isEn ? 'Full Name' : 'Nome Completo'} *</label>
                <input type="text" required value={newChild.nome} onChange={e => setNewChild({ ...newChild, nome: e.target.value })} className={inputClass} placeholder="Ex: Martim Sousa" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>{isEn ? 'Date of Birth' : 'Data Nasc.'} *</label>
                  <input type="date" required value={newChild.data_nascimento} onChange={e => setNewChild({ ...newChild, data_nascimento: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{isEn ? 'Gender' : 'Sexo'} *</label>
                  <select required value={newChild.sexo} onChange={e => setNewChild({ ...newChild, sexo: e.target.value })} className={selectClass}>
                    <option value="">Selecione...</option><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option><option value="Prefiro não dizer">Prefiro não dizer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>{isEn ? 'Allergies / Restrictions' : 'Alergias / Restrições Médicas'}</label>
                <textarea rows={2} value={newChild.restricoes_alimentares} onChange={e => setNewChild({ ...newChild, restricoes_alimentares: e.target.value })} className={`${inputClass} resize-none`} placeholder={isEn ? "None" : "Nenhuma (Opcional)"} />
              </div>

              <button type="submit" disabled={savingChild} className="mt-2 w-full py-4 bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg hover:-translate-y-0.5 transition-all">
                {savingChild ? (isEn ? 'Saving...' : 'A guardar...') : (isEn ? 'Save Participant' : 'Guardar Participante')}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

        {/* ========================================== */}
        {/* COLUNA ESQUERDA - DADOS DO CLIENTE         */}
        {/* ========================================== */}
        <div className="flex-[1_1_60%] min-w-[320px] w-full flex flex-col gap-8">

          {/* HEADER INFORMATIVO */}
          {!isExterna && isGuest && (
            <div className="bg-amber-50 p-6 md:p-8 rounded-[2rem] border border-amber-200 flex justify-between items-center flex-wrap gap-4 shadow-sm">
              <div>
                <h3 className="text-base font-black text-amber-900 m-0 mb-1">{isEn ? 'Checking out as Guest' : 'A reservar como Convidado'}</h3>
                <p className="text-[13px] font-bold text-amber-700 m-0">{isEn ? 'Already have an account?' : 'Já tem conta criada?'}</p>
              </div>
              <button type="button" onClick={() => { sessionStorage.setItem('redirect_after_login', window.location.href); router.push(`/${lang}/login`); }} className="w-full sm:w-auto px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest rounded-xl text-[10px] shadow-md transition-all hover:-translate-y-0.5">
                {isEn ? 'Login to speed up' : 'Fazer Login e acelerar'}
              </button>
            </div>
          )}

          {isExterna && (
            <div className="bg-blue-50 p-6 md:p-8 rounded-[2rem] border border-blue-200 flex items-start gap-4 shadow-sm">
              <IconExternalLink className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-black text-blue-900 m-0 mb-2">{isEn ? 'External Registration' : 'Inscrição Externa Oficial'}</h3>
                <p className="text-sm font-medium text-blue-800 m-0 leading-relaxed">
                  {isEn 
                    ? 'This program uses its own registration portal. Please enter your contact details below so we can notify the partner, and we will securely redirect you to their official platform to complete the process.'
                    : 'Este programa utiliza um portal próprio de inscrições. Introduza os seus dados de contacto rápidos para notificarmos o parceiro e redirecioná-lo-emos com segurança para a plataforma oficial do organizador.'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">

            {/* DADOS PARENTE (GUEST OU EXTERNO SEMPRE PRECISA) */}
            {(isGuest || isExterna) && (
              <section className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 m-0 mb-8 border-b border-slate-100 pb-4 tracking-tight">{isEn ? 'Your Contact Details' : 'Os Seus Dados de Contacto'}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2"><label className={labelClass}>{isEn ? 'Full Name' : 'Nome Completo'} *</label><input type="text" required value={guestData.nome} onChange={e => setGuestData({ ...guestData, nome: e.target.value })} className={inputClass} /></div>
                  <div><label className={labelClass}>{isEn ? 'Email Address' : 'E-mail'} *</label><input type="email" required value={guestData.email} onChange={e => setGuestData({ ...guestData, email: e.target.value })} className={inputClass} /></div>
                  <div><label className={labelClass}>{isEn ? 'Phone Number' : 'Telefone'} *</label><input type="tel" required value={guestData.telefone} onChange={e => setGuestData({ ...guestData, telefone: e.target.value })} className={inputClass} /></div>
                </div>
              </section>
            )}

            {/* PARTICIPANTES E ESCOLHAS (ESCONDIDO SE FOR EXTERNO) */}
            {!isExterna && (
              <section className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 m-0 mb-8 border-b border-slate-100 pb-4 tracking-tight">{isEn ? 'Participants' : 'Participantes'}</h2>

                {Array.from({ length: quantidade }).map((_, i) => {
                  const childId = selecoesCriancas[i];
                  const childInfo = criancas.find(c => c.id === childId);
                  const participantNumber = i + 1;
                  const escolhasUrlLocais = opcoesParticipantesUrl[participantNumber]; 

                  return (
                    <div key={i} className={i !== quantidade - 1 ? "mb-10 pb-10 border-b-2 border-dashed border-slate-100" : ""}>
                      <label className="block text-[11px] font-black text-[#0E3A68] mb-3 uppercase tracking-widest ml-1">{isEn ? `Participant ${participantNumber}` : `Participante ${participantNumber}`}</label>

                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <select required value={childId} onChange={(e) => { const novas = [...selecoesCriancas]; novas[i] = e.target.value; setSelecoesCriancas(novas); }} className={`${selectClass} flex-1`}>
                          <option value="">{isEn ? 'Choose a child...' : 'Escolha um participante...'}</option>
                          {criancas.map(c => {
                            const idade = calcularIdade(c.data_nascimento);
                            const idadeForaLimite = (campo.idade_min && idade < campo.idade_min) || (campo.idade_max && idade > campo.idade_max);
                            const jaInscrito = reservasExistentes.some(r => r.crianca_id === c.id && r.turno_nome === (turnoSelecionado?.nome || 'Programa Base'));
                            const jaSelec = selecoesCriancas.includes(c.id) && selecoesCriancas[i] !== c.id;
                            const isDisabled = idadeForaLimite || jaInscrito || jaSelec;
                            
                            let aviso = "";
                            if (idadeForaLimite) aviso = isEn ? `(Age not allowed: ${idade} yrs)` : `(Idade não permitida: ${idade} anos)`;
                            else if (jaInscrito) aviso = isEn ? "(Already registered)" : "(Já inscrito neste turno)";
                            else if (jaSelec) aviso = isEn ? "(Selected in this order)" : "(Selecionado nesta compra)";

                            return <option key={c.id} value={c.id} disabled={isDisabled}>{c.nome} {aviso}</option>;
                          })}
                        </select>
                        <button type="button" onClick={() => openNewChildModal(i)} className="w-full sm:w-auto px-6 py-4 bg-blue-50 hover:bg-blue-100 text-[#0E3A68] font-black uppercase tracking-widest text-[10px] rounded-xl border border-blue-200 transition-colors shadow-sm">+ {isEn ? 'New' : 'Novo'}</button>
                      </div>

                      {childInfo && (
                        <div className="mt-6 bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 shadow-inner">
                          <div className="flex justify-between items-center mb-6"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest m-0">{isEn ? 'Verify Details' : 'Confirmar Identificação'}</h4></div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="sm:col-span-2"><label className={labelClass}>{isEn ? 'Full Name' : 'Nome Completo'}</label><input type="text" required value={childInfo.nome || ''} onChange={e => handleUpdateLocalCrianca(childId, 'nome', e.target.value)} onBlur={e => handleSaveDBCrianca(childId, 'nome', e.target.value)} className={inputClass} /></div>
                            <div><label className={labelClass}>{isEn ? 'Date of Birth' : 'Data Nascimento'}</label><input type="date" required value={childInfo.data_nascimento || ''} onChange={e => handleUpdateLocalCrianca(childId, 'data_nascimento', e.target.value)} onBlur={e => handleSaveDBCrianca(childId, 'data_nascimento', e.target.value)} className={inputClass} /></div>
                            <div><label className={labelClass}>{isEn ? 'Gender' : 'Sexo'}</label>
                              <select value={childInfo.sexo || ''} onChange={e => { handleUpdateLocalCrianca(childId, 'sexo', e.target.value); handleSaveDBCrianca(childId, 'sexo', e.target.value); }} className={selectClass}>
                                <option value="Masculino">Masculino</option><option value="Feminino">Feminino</option><option value="Prefiro não dizer">Prefiro não dizer</option>
                              </select>
                            </div>

                            <div className="sm:col-span-2 border-t border-slate-200 pt-6 mt-2"><label className={`${labelClass} !text-red-700`}>{isEn ? 'Medical Alerts' : 'Alertas Clínicos'}</label></div>
                            <div className="sm:col-span-2"><label className={`${labelClass} !text-red-700`}>{isEn ? 'Allergies / Restrictions' : 'Alergias Alimentares'}</label><input type="text" value={childInfo.restricoes_alimentares || ''} onChange={e => handleUpdateLocalCrianca(childId, 'restricoes_alimentares', e.target.value)} onBlur={e => handleSaveDBCrianca(childId, 'restricoes_alimentares', e.target.value)} className={`${inputClass} !border-red-200 focus:!border-red-500`} placeholder={isEn ? "None" : "Nenhuma"} /></div>
                            <div className="sm:col-span-2"><label className={`${labelClass} !text-red-700`}>{isEn ? 'Chronic Diseases' : 'Doenças Crónicas ou Medicação'}</label><input type="text" value={childInfo.doencas_cronicas || ''} onChange={e => handleUpdateLocalCrianca(childId, 'doencas_cronicas', e.target.value)} onBlur={e => handleSaveDBCrianca(childId, 'doencas_cronicas', e.target.value)} className={`${inputClass} !border-red-200 focus:!border-red-500`} placeholder={isEn ? "None" : "Nenhuma"} /></div>
                          </div>
                        </div>
                      )}

                      {/* OPÇÕES MÚLTIPLAS */}
                      {childInfo && escolhasUrlLocais && Object.keys(escolhasUrlLocais).length > 0 && (
                        <div className="mt-4 bg-emerald-50 p-6 rounded-2xl border border-emerald-200 shadow-sm flex flex-col gap-3">
                          <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest m-0">✓ Opções de Programa</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            {Object.entries(escolhasUrlLocais).map(([perg, resp]: any) => (
                              <div key={perg} className="bg-white p-4 border border-emerald-100 rounded-xl shadow-sm">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 m-0 mb-1">{perg}</p>
                                <p className="text-sm font-black text-emerald-700 m-0">{resp}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* PERGUNTAS TEXTO LIVRE */}
                      {childInfo && perguntasDeTexto.length > 0 && (
                        <div className="mt-4 bg-blue-50 p-6 md:p-8 rounded-2xl border border-blue-200 shadow-sm">
                          <h4 className="text-[10px] font-black text-[#0E3A68] uppercase tracking-widest mb-5">{isEn ? 'Specific Questions' : 'Perguntas do Organizador'}</h4>
                          <div className="grid gap-6">
                            {perguntasDeTexto.map((pOriginal: string, pIdx: number) => {
                              const pTituloPt = pOriginal.startsWith('TEXTO|') ? pOriginal.split('|')[1] : pOriginal;
                              const originalIndex = campo.perguntas_customizadas.indexOf(pOriginal);
                              const pEnRaw = campo.perguntas_customizadas_en?.[originalIndex];
                              const pTituloEn = pEnRaw ? (pEnRaw.startsWith('TEXTO|') ? pEnRaw.split('|')[1] : pEnRaw) : pTituloPt;
                              const pVisivel = isEn ? pTituloEn : pTituloPt;

                              return (
                                <div key={pIdx}>
                                  <label className={`${labelClass} !text-[#0E3A68] mb-2 block`}>{pVisivel} *</label>
                                  <input
                                    type="text" required 
                                    value={respostasCustomizadas[i]?.[pTituloPt] || ''}
                                    onChange={e => setRespostasCustomizadas(prev => ({...prev, [i]: {...(prev[i]||{}), [pTituloPt]: e.target.value}}))}
                                    className={`${inputClass} !border-blue-200 focus:!border-[#0E3A68]`} 
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
            )}

            {/* PAGAMENTO E TERMOS (STRIPE OU EXTERNO) */}
            <section className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
              
              {!isExterna ? (
                <>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 m-0 mb-6 border-b border-slate-100 pb-4 tracking-tight">{isEn ? 'Secure Payment' : 'Pagamento Seguro'}</h2>

                  {isPagamentoFracionado ? (
                    <div className="p-6 md:p-8 bg-blue-50 border border-blue-200 rounded-2xl mb-6 shadow-inner">
                      <p className="font-black text-[#0E3A68] mb-2 m-0 text-base">{isEn ? 'Payment Plan (50% Deposit)' : 'Facilidade de Pagamento (Sinal de 50%)'}</p>
                      <p className="text-sm font-medium text-blue-800 m-0 leading-relaxed">{isEn ? `Pay only ${valorACobrarAgora.toFixed(2)}€ today. The balance is charged 1 week prior.` : `Garanta a vaga pagando apenas um sinal de ${valorACobrarAgora.toFixed(2)}€. O remanescente (${valorPendente.toFixed(2)}€) é debitado automaticamente 1 semana antes do programa.`}</p>
                    </div>
                  ) : (
                    <div className="p-6 md:p-8 bg-[#059669]/10 border border-[#059669]/20 rounded-2xl mb-6 shadow-inner">
                      <p className="font-black text-[#059669] mb-2 m-0 text-base">{isEn ? 'Full Payment' : 'Pagamento a Pronto (100%)'}</p>
                      <p className="text-sm font-medium text-[#059669]/80 m-0 leading-relaxed">{isEn ? `Full payment of ${valorACobrarAgora.toFixed(2)}€ is required today.` : `O campo exige o pagamento total (${valorACobrarAgora.toFixed(2)}€) para garantir e bloquear a vaga no sistema imediatamente.`}</p>
                    </div>
                  )}

                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between flex-wrap gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md flex-shrink-0">
                        <IconCreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 m-0 mb-1">Stripe Checkout</p>
                        <p className="text-xs font-bold text-slate-500 m-0">
                          {isEn ? 'Pay securely via Card.' : 'MB WAY, Cartão de Crédito ou Débito.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center font-black text-slate-900 text-sm opacity-80">
                      <span className="italic text-[#0E3A68]">MB WAY</span> 
                      <span>VISA</span> 
                      <span>MASTERCARD</span>
                    </div>
                  </div>
                </>
              ) : (
                <h2 className="text-xl md:text-2xl font-black text-slate-900 m-0 mb-6 border-b border-slate-100 pb-4 tracking-tight">{isEn ? 'Terms & Redirection' : 'Termos & Redirecionamento'}</h2>
              )}

              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <input type="checkbox" required checked={concordaTermos} onChange={e => setConcordaTermos(e.target.checked)} className="mt-1 w-6 h-6 accent-[#0E3A68] cursor-pointer flex-shrink-0" />
                  <span className="text-xs md:text-sm font-bold text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                    {isEn ? (
                      <>I declare that I am of legal age and accept HelloCamp's <Link className="text-[#0E3A68] font-black underline" href={`/${lang}/termos`} target="_blank">Terms & Conditions</Link>. {isGuest && !isExterna && " A secure account will be generated for you."}</>
                    ) : (
                      <>Declaro que sou maior de idade e aceito os <Link className="text-[#0E3A68] font-black underline" href={`/${lang}/termos`} target="_blank">Termos e Condições</Link> da plataforma. {isGuest && !isExterna && "Ao prosseguir, será gerada uma conta segura associada ao seu email."}</>
                    )}
                  </span>
                </label>
              </div>
            </section>

            {/* BOTÃO DE CONFIRMAÇÃO */}
            <div className="pt-4">
              <button type="submit" disabled={processingState || !concordaTermos} className={`w-full py-5 px-6 text-sm uppercase tracking-widest font-black rounded-2xl border-none transition-all flex items-center justify-center gap-3 ${processingState || !concordaTermos ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : (isExterna ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 hover:-translate-y-1' : 'bg-[#e2a41d] hover:bg-[#d4991b] text-white shadow-xl shadow-[#e2a41d]/30 hover:-translate-y-1')} cursor-pointer`}>
                {isExterna ? (
                  <>
                    {isEn ? 'Proceed to External Booking' : 'Avançar para Inscrição Externa'}
                    <IconExternalLink className="w-5 h-5" />
                  </>
                ) : (
                  isEn ? `Pay ${valorACobrarAgora.toFixed(2)}€` : `Confirmar e Pagar ${valorACobrarAgora.toFixed(2)}€`
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ========================================== */}
        {/* SIDEBAR DIREITA - RESUMO DE COMPRA         */}
        {/* ========================================== */}
        <aside className="flex-[1_1_35%] min-w-[320px] w-full lg:sticky lg:top-8">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <h3 className="text-lg font-black mb-6 border-b border-slate-100 pb-5 uppercase tracking-widest text-slate-900">{isEn ? 'Booking Summary' : 'Resumo de Compra'}</h3>

            <div className="flex flex-col gap-6 mb-8">
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{isEn ? 'Program' : 'Programa'}</span>
                <p className="text-sm font-black text-slate-900 m-0 leading-tight">{turnoSelecionado?.nome || campo?.nome}</p>
              </div>

              {turnoSelecionado?.dias_soltos?.length > 0 && (
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{isEn ? 'Selected Dates' : 'Datas Selecionadas'}</span>
                  <div className="flex flex-wrap gap-2">
                    {turnoSelecionado.dias_soltos.map((d: string) => (
                      <span key={d} className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-md shadow-sm">
                        {new Date(d).toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { day: '2-digit', month: 'short' })}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center border-b border-slate-100 pb-5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isEn ? `Base Price (x${quantidade})` : `Preço Base (x${quantidade})`}</span>
                <span className="text-base font-black text-slate-900">{(precoBaseUnitario * quantidade).toFixed(2)}€</span>
              </div>

              {(extSeguro || extTransporte) && !isExterna && (
                <div className="border-b border-slate-100 pb-5">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{isEn ? 'Extras' : 'Suplementos Extras'}</span>
                  <div className="flex flex-col gap-2">
                    {extSeguro && <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-600 flex items-center gap-2">🛡️ {isEn ? 'Insurance' : 'Seguro'}</span><span className="font-black text-slate-900">{(custoSeguroUnit * quantidade).toFixed(2)}€</span></div>}
                    {extTransporte && <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-600 flex items-center gap-2">🚌 {isEn ? 'Transport' : 'Transporte'}</span><span className="font-black text-slate-900">{(custoTransporteUnit * quantidade).toFixed(2)}€</span></div>}
                  </div>
                </div>
              )}

              {/* TAG INFORMATIVA DE OPÇÕES EXTRA */}
              {(Object.keys(opcoesParticipantesUrl).length > 0 || Object.keys(respostasCustomizadas).length > 0) && !isExterna && (
                <div className="mt-2 text-[9px] font-bold text-emerald-600 uppercase tracking-widest text-right">
                  ✓ Personalização Confirmada
                </div>
              )}
            </div>

            <div className={`p-6 rounded-2xl mb-4 flex justify-between items-center shadow-lg ${isExterna ? 'bg-blue-600 shadow-blue-600/20' : 'bg-[#0E3A68] shadow-[#0E3A68]/20'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{isEn ? 'Estimated Total' : 'Total Estimado'}</span>
              <span className="text-3xl font-black text-white">{precoFinalTotal.toFixed(2)}€</span>
            </div>

            {!isExterna ? (
              <>
                <div className="flex justify-between items-center bg-[#059669]/10 border border-[#059669]/20 p-5 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#059669]">{isEn ? 'To Pay Now' : 'A Pagar Agora'}</span>
                  <span className="text-2xl font-black text-[#059669]">{valorACobrarAgora.toFixed(2)}€</span>
                </div>

                {isPagamentoFracionado && (
                  <div className="flex justify-between items-center mt-4 p-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isEn ? 'Pending Balance' : 'Faltará Pagar'}</span>
                    <span className="text-lg font-black text-[#e2a41d]">{valorPendente.toFixed(2)}€</span>
                  </div>
                )}
                
                <div className="flex items-center justify-center gap-2 mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <IconShield className="w-3.5 h-3.5"/> {isEn ? '100% Secure Payment' : 'Pagamento 100% Seguro'}
                </div>
              </>
            ) : (
              <div className="text-center mt-6">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-relaxed">
                  {isEn ? 'Payment handled externally by the organizer.' : 'Gestão e pagamento efetuados na plataforma oficial do parceiro.'}
                </p>
              </div>
            )}
          </div>
        </aside>

      </div>
    </main>
  );
}
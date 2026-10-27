"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEn = lang === "en";

  const [campo, setCampo] = useState<any>(null);
  const [organizador, setOrganizador] = useState<any>(null);
  const [criancas, setCriancas] = useState<any[]>([]);
  const [reservasExistentes, setReservasExistentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [processingState, setProcessingState] = useState(false);

  // Estados de Formulário
  const [guestData, setGuestData] = useState({
    nome: "",
    email: "",
    telefone: "",
    nif: "",
    contacto_emergencia: "",
  });
  const [selecoesCriancas, setSelecoesCriancas] = useState<string[]>([""]);
  const [respostasCustomizadas, setRespostasCustomizadas] = useState<
    Record<number, Record<string, string>>
  >({});
  const [concordaTermos, setConcordaTermos] = useState(false);

  // Dropdowns Customizados (Zero <select> nativos)
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);

  // Modal Novo Participante no Checkout
  const [showModal, setShowModal] = useState(false);
  const [savingChild, setSavingChild] = useState(false);
  const [indexToAssign, setIndexToAssign] = useState(0);
  const [newChild, setNewChild] = useState({
    nome: "",
    nif: "",
    data_nascimento: "",
    sexo: "Masculino",
    restricoes_alimentares: "",
    doencas_cronicas: "",
  });

  // Parâmetros do URL
  const quantidade = Math.max(
    1,
    parseInt(searchParams.get("quantidade_criancas") || "1", 10)
  );
  const extSeguro = searchParams.get("ext_seguro") === "true";
  const extTransporte = searchParams.get("ext_transporte") === "true";

  let turnoSelecionado: any = null;
  try {
    const rawTurno = searchParams.get("turno");
    if (rawTurno) turnoSelecionado = JSON.parse(rawTurno);
  } catch {}

  let opcoesParticipantesUrl: Record<number, Record<string, string>> = {};
  try {
    const rawOpcoes = searchParams.get("opcoes_participantes");
    if (rawOpcoes) opcoesParticipantesUrl = JSON.parse(rawOpcoes);
  } catch {}

  useEffect(() => {
    setSelecoesCriancas(Array(quantidade).fill(""));
  }, [quantidade]);

  useEffect(() => {
    const carregarCheckout = async () => {
      const { data: campoData } = await supabase
        .from("campos")
        .select("*")
        .eq("id", id)
        .single();

      if (!campoData) {
        router.push(`/${lang}/pesquisa`);
        return;
      }
      setCampo(campoData);

      if (campoData.organizador_id) {
        const { data: orgData } = await supabase
          .from("perfis")
          .select("id, email, empresa_nome, stripe_account_id")
          .eq("id", campoData.organizador_id)
          .maybeSingle();
        setOrganizador(orgData);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setIsGuest(false);

        const [{ data: perfilPai }, { data: criancasDb }, { data: resDb }] =
          await Promise.all([
            supabase
              .from("perfis")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle(),
            supabase
              .from("criancas")
              .select("*")
              .eq("cliente_id", session.user.id),
            supabase
              .from("reservas")
              .select("crianca_id, turno_nome, status_pagamento")
              .eq("campo_id", id)
              .in("status_pagamento", ["Pago", "Sinal Pago"]),
          ]);

        if (perfilPai) {
          setGuestData({
            nome: perfilPai.nome_completo || "",
            email: perfilPai.email || session.user.email || "",
            telefone: perfilPai.telefone || "",
            nif: perfilPai.nif || "",
            contacto_emergencia: perfilPai.contacto_emergencia || "",
          });
        }
        const listaCriancas = criancasDb || [];
        setCriancas(listaCriancas);
        setReservasExistentes(resDb || []);

        if (listaCriancas.length > 0 && quantidade === 1) {
          setSelecoesCriancas([listaCriancas[0].id]);
        }
      } else {
        setIsGuest(true);
      }

      setLoading(false);
    };

    carregarCheckout();
  }, [id, lang, router, quantidade]);

  const calcularIdadeNum = (dataNasc: string) => {
    if (!dataNasc) return 10;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const openNewChildModal = (index: number) => {
    setNewChild({
      nome: "",
      nif: "",
      data_nascimento: "",
      sexo: "Masculino",
      restricoes_alimentares: "",
      doencas_cronicas: "",
    });
    setIndexToAssign(index);
    setShowModal(true);
  };

  const handleSaveNewChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingChild(true);
    try {
      if (isGuest) {
        const guestChild = {
          ...newChild,
          id: `guest_${Date.now()}`,
          isGuestChild: true,
        };
        setCriancas((prev) => [...prev, guestChild]);
        setSelecoesCriancas((prev) => {
          const novas = [...prev];
          novas[indexToAssign] = guestChild.id;
          return novas;
        });
      } else {
        const { data: created, error } = await supabase
          .from("criancas")
          .insert([{ ...newChild, cliente_id: user.id }])
          .select()
          .single();
        if (error) throw error;
        setCriancas((prev) => [...prev, created]);
        setSelecoesCriancas((prev) => {
          const novas = [...prev];
          novas[indexToAssign] = created.id;
          return novas;
        });
      }
      setShowModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingChild(false);
    }
  };

  const handleUpdateLocalCrianca = (
    idDaCrianca: string,
    campoTabela: string,
    valor: string
  ) => {
    setCriancas((prev) =>
      prev.map((c) =>
        c.id === idDaCrianca ? { ...c, [campoTabela]: valor } : c
      )
    );
  };

  const handleSaveDBCrianca = async (
    idDaCrianca: string,
    campoTabela: string,
    valor: string
  ) => {
    if (isGuest || idDaCrianca.startsWith("guest_")) return;
    await supabase
      .from("criancas")
      .update({ [campoTabela]: valor })
      .eq("id", idDaCrianca);
  };

  if (loading || !campo) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-bold text-slate-400 text-xs uppercase tracking-widest animate-pulse">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#0E3A68] animate-spin mb-4" />
        {isEn
          ? "Preparing secure checkout..."
          : "A preparar a sua reserva segura..."}
      </div>
    );
  }

  const isExterna = campo.modalidade_reserva === "link_externo";
  const perguntasDeTexto = (campo?.perguntas_customizadas || []).filter(
    (p: string) => p.startsWith("TEXTO|") || !p.startsWith("ESCOLHA|")
  );

  // Cálculos Financeiros
  const multiplicador = Number(turnoSelecionado?.multiplicador) || 1;
  const totalDiasExtras = Number(turnoSelecionado?.quantidade) || 1;
  const precoBaseUnitario =
    (Number(turnoSelecionado?.preco) || Number(campo.preco) || 0) *
    multiplicador;

  const custoSeguroUnit = extSeguro
    ? campo.tipo_extra_seguro === "diario"
      ? Number(campo.extra_seguro || 0) * totalDiasExtras
      : Number(campo.extra_seguro || 0)
    : 0;

  const custoTransporteUnit = extTransporte
    ? campo.tipo_extra_transporte === "diario"
      ? Number(campo.extra_transporte || 0) * totalDiasExtras
      : Number(campo.extra_transporte || 0)
    : 0;

  const precoFinalTotal =
    (precoBaseUnitario + custoSeguroUnit + custoTransporteUnit) * quantidade;

  const isPagamentoFracionado = campo.tipo_pagamento === "50_sinal";
  const valorACobrarAgora = isPagamentoFracionado
    ? precoFinalTotal / 2
    : precoFinalTotal;
  const valorPendente = isPagamentoFracionado
    ? precoFinalTotal - valorACobrarAgora
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concordaTermos) {
      alert(
        isEn
          ? "You must accept the Terms and Conditions to proceed."
          : "Tem de aceitar os Termos e Condições para avançar."
      );
      return;
    }

    if (!isExterna && selecoesCriancas.some((c) => c === "")) {
      alert(
        isEn
          ? "Please select or create a participant for each spot."
          : "Por favor, selecione ou adicione um participante para cada vaga."
      );
      return;
    }

    if (
      (isGuest || isExterna) &&
      (!guestData.nome.trim() ||
        !guestData.email.trim() ||
        !guestData.telefone.trim())
    ) {
      alert(
        isEn
          ? "Please fill in your contact details."
          : "Por favor, preencha os seus dados de contacto."
      );
      return;
    }

    setProcessingState(true);

    try {
      if (isExterna) {
        // Grava a Lead diretamente e notifica o parceiro por e-mail
        await supabase.from("leads_externas").insert([
          {
            campo_id: campo.id,
            organizador_id: campo.organizador_id,
            nome_cliente: guestData.nome,
            email_cliente: guestData.email,
            telefone_cliente: guestData.telefone,
            turno_interesse: turnoSelecionado?.nome || "Geral",
            preco_estimado: precoFinalTotal,
          },
        ]);

        await fetch("/api/notificar-reserva", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead: {
              nome: guestData.nome,
              email: guestData.email,
              telefone: guestData.telefone,
            },
            campoNome: campo.nome,
            parceiroEmail: organizador?.email || "info@hellocamp.pt",
            lang,
          }),
        }).catch(() => {});

        window.location.href = campo.link_externo_reserva;
      } else {
        const criancasParaEnviar = selecoesCriancas.map((cId, index) => {
          const c = criancas.find((cr) => cr.id === cId);
          return {
            ...c,
            escolhas_multiplas_url: opcoesParticipantesUrl[index + 1] || {},
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
            turno_nome: turnoSelecionado?.nome || "Programa Base",
            extras_escolhidos: {
              ext_seguro: extSeguro,
              ext_transporte: extTransporte,
              dias_inscritos: totalDiasExtras,
              dias_soltos: turnoSelecionado?.dias_soltos || [],
            },
            respostas_customizadas: respostasCustomizadas,
            opcoes_participantes_url: opcoesParticipantesUrl,
            quantidade_reservas: quantidade,
            valor_por_reserva: precoFinalTotal / quantidade,
          },
        };

        const res = await fetch("/api/stripe-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadCheckout),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao iniciar checkout.");
        if (data.url) window.location.href = data.url;
      }
    } catch (error: any) {
      alert(error.message);
      setProcessingState(false);
    }
  };

  const labelClass =
    "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1";
  const inputClass =
    "w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white transition-colors";

  return (
    <main className="min-h-screen bg-slate-50 py-10 font-sans">
      {processingState && (
        <div className="fixed inset-0 bg-white/95 z-[100] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-[#0E3A68] rounded-full animate-spin mb-6" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            {isEn ? "Securing your spot..." : "A processar a sua inscrição..."}
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            {isEn
              ? "Please wait while we redirect you to secure payment."
              : "Por favor, aguarde o redirecionamento para o pagamento seguro Stripe."}
          </p>
        </div>
      )}

      {/* MODAL NOVO PARTICIPANTE */}
      {showModal && !isExterna && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-black cursor-pointer"
            >
              &times;
            </button>
            <h3 className="text-2xl font-black text-slate-900 mb-6">
              {isEn ? "Add Participant" : "Novo Participante"}
            </h3>

            <form onSubmit={handleSaveNewChild} className="space-y-4">
              <div>
                <label className={labelClass}>
                  {isEn ? "Full Name *" : "Nome Completo *"}
                </label>
                <input
                  type="text"
                  required
                  value={newChild.nome}
                  onChange={(e) =>
                    setNewChild({ ...newChild, nome: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Ex: Martim Sousa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {isEn ? "Date of Birth *" : "Data Nasc. *"}
                  </label>
                  <input
                    type="date"
                    required
                    value={newChild.data_nascimento}
                    onChange={(e) =>
                      setNewChild({
                        ...newChild,
                        data_nascimento: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div className="relative">
                  <label className={labelClass}>
                    {isEn ? "Gender *" : "Sexo *"}
                  </label>
                  <div
                    onClick={() =>
                      setOpenDropdownKey(
                        openDropdownKey === "modal_sexo" ? null : "modal_sexo"
                      )
                    }
                    className={`${inputClass} cursor-pointer flex justify-between items-center`}
                  >
                    <span>{newChild.sexo}</span>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </div>
                  {openDropdownKey === "modal_sexo" && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      {["Masculino", "Feminino", "Prefiro não dizer"].map(
                        (s) => (
                          <div
                            key={s}
                            onClick={() => {
                              setNewChild({ ...newChild, sexo: s });
                              setOpenDropdownKey(null);
                            }}
                            className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer"
                          >
                            {s}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  {isEn
                    ? "Allergies / Medical Restrictions"
                    : "Alergias / Restrições Médicas"}
                </label>
                <input
                  type="text"
                  value={newChild.restricoes_alimentares}
                  onChange={(e) =>
                    setNewChild({
                      ...newChild,
                      restricoes_alimentares: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder={isEn ? "None" : "Nenhuma (Opcional)"}
                />
              </div>

              <button
                type="submit"
                disabled={savingChild}
                className="w-full py-4 bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg cursor-pointer"
              >
                {savingChild
                  ? "..."
                  : isEn
                  ? "Save Participant"
                  : "Guardar Participante"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex flex-col lg:flex-row gap-8 items-start">
        {/* COLUNA ESQUERDA */}
        <div className="flex-[1_1_60%] w-full space-y-8">
          {!isExterna && isGuest && (
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-200 flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-base font-black text-amber-900 m-0 mb-1">
                  {isEn ? "Checking out as Guest" : "A reservar como Convidado"}
                </h3>
                <p className="text-xs font-bold text-amber-700 m-0">
                  {isEn
                    ? "Already have a HelloCamp account?"
                    : "Já tem conta na HelloCamp?"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem(
                    "redirect_after_login",
                    window.location.href
                  );
                  router.push(`/${lang}/login`);
                }}
                className="px-6 py-3 bg-amber-600 text-white font-black uppercase tracking-widest rounded-xl text-[10px] cursor-pointer"
              >
                {isEn ? "Login to speed up" : "Fazer Login"}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {(isGuest || isExterna) && (
              <section className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 m-0 mb-6 pb-4 border-b border-slate-100">
                  {isEn
                    ? "Parent / Guardian Contact Details"
                    : "Dados do Encarregado de Educação"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      {isEn ? "Full Name *" : "Nome Completo *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={guestData.nome}
                      onChange={(e) =>
                        setGuestData({ ...guestData, nome: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>E-mail *</label>
                    <input
                      type="email"
                      required
                      value={guestData.email}
                      onChange={(e) =>
                        setGuestData({ ...guestData, email: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      {isEn ? "Phone *" : "Telemóvel *"}
                    </label>
                    <input
                      type="tel"
                      required
                      value={guestData.telefone}
                      onChange={(e) =>
                        setGuestData({ ...guestData, telefone: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </section>
            )}

            {!isExterna && (
              <section className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 m-0 mb-6 pb-4 border-b border-slate-100">
                  {isEn ? "Participants" : "Participantes"}
                </h2>

                {Array.from({ length: quantidade }).map((_, i) => {
                  const childId = selecoesCriancas[i];
                  const childInfo = criancas.find((c) => c.id === childId);
                  const participantNumber = i + 1;
                  const escolhasUrlLocais =
                    opcoesParticipantesUrl[participantNumber];
                  const ddKey = `child_select_${i}`;

                  return (
                    <div
                      key={i}
                      className={
                        i !== quantidade - 1
                          ? "mb-10 pb-10 border-b border-slate-100"
                          : ""
                      }
                    >
                      <label className="block text-xs font-black text-[#0E3A68] mb-3 uppercase tracking-widest">
                        {isEn
                          ? `Participant ${participantNumber}`
                          : `Participante ${participantNumber}`}
                      </label>

                      {/* DROPDOWN CUSTOMIZADO DE SELEÇÃO DE CRIANÇA */}
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="relative flex-1">
                          <div
                            onClick={() =>
                              setOpenDropdownKey(
                                openDropdownKey === ddKey ? null : ddKey
                              )
                            }
                            className={`${inputClass} cursor-pointer flex justify-between items-center`}
                          >
                            <span>
                              {childInfo
                                ? `👦 ${childInfo.nome}`
                                : isEn
                                ? "Select a participant..."
                                : "Escolher participante..."}
                            </span>
                            <span className="text-[10px] text-slate-400">▼</span>
                          </div>
                          {openDropdownKey === ddKey && (
                            <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                              {criancas.length === 0 ? (
                                <div className="p-3.5 text-xs text-slate-400 font-bold">
                                  Clique em "+ Novo" ao lado para adicionar.
                                </div>
                              ) : (
                                criancas.map((c) => {
                                  const idade = calcularIdadeNum(
                                    c.data_nascimento
                                  );
                                  const jaSelec =
                                    selecoesCriancas.includes(c.id) &&
                                    selecoesCriancas[i] !== c.id;
                                  return (
                                    <div
                                      key={c.id}
                                      onClick={() => {
                                        if (jaSelec) return;
                                        const novas = [...selecoesCriancas];
                                        novas[i] = c.id;
                                        setSelecoesCriancas(novas);
                                        setOpenDropdownKey(null);
                                      }}
                                      className={`p-3.5 text-xs font-bold border-b border-slate-50 last:border-0 ${
                                        jaSelec
                                          ? "opacity-40 cursor-not-allowed"
                                          : "hover:bg-blue-50 cursor-pointer text-slate-800"
                                      }`}
                                    >
                                      👦 {c.nome} ({idade} anos)
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => openNewChildModal(i)}
                          className="px-6 py-4 bg-blue-50 hover:bg-blue-100 text-[#0E3A68] font-black uppercase tracking-widest text-xs rounded-xl border border-blue-200 cursor-pointer"
                        >
                          + {isEn ? "New Child" : "Adicionar Novo"}
                        </button>
                      </div>

                      {childInfo && (
                        <div className="mt-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>
                              {isEn ? "Allergies" : "Alergias Alimentares"}
                            </label>
                            <input
                              type="text"
                              value={childInfo.restricoes_alimentares || ""}
                              onChange={(e) =>
                                handleUpdateLocalCrianca(
                                  childId,
                                  "restricoes_alimentares",
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                handleSaveDBCrianca(
                                  childId,
                                  "restricoes_alimentares",
                                  e.target.value
                                )
                              }
                              placeholder="Nenhuma"
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>
                              {isEn
                                ? "Medical Conditions / Medication"
                                : "Condições Médicas / Medicação"}
                            </label>
                            <input
                              type="text"
                              value={childInfo.doencas_cronicas || ""}
                              onChange={(e) =>
                                handleUpdateLocalCrianca(
                                  childId,
                                  "doencas_cronicas",
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                handleSaveDBCrianca(
                                  childId,
                                  "doencas_cronicas",
                                  e.target.value
                                )
                              }
                              placeholder="Nenhuma"
                              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            />
                          </div>
                        </div>
                      )}

                      {childInfo &&
                        escolhasUrlLocais &&
                        Object.keys(escolhasUrlLocais).length > 0 && (
                          <div className="mt-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(escolhasUrlLocais).map(
                              ([perg, resp]: any) => (
                                <div
                                  key={perg}
                                  className="bg-white p-3 rounded-xl border border-emerald-100"
                                >
                                  <span className="block text-[9px] font-black uppercase text-slate-400">
                                    {perg}
                                  </span>
                                  <span className="text-xs font-black text-emerald-800">
                                    {resp}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}

                      {childInfo && perguntasDeTexto.length > 0 && (
                        <div className="mt-4 bg-blue-50 p-5 rounded-2xl border border-blue-200 space-y-4">
                          {perguntasDeTexto.map(
                            (pOriginal: string, pIdx: number) => {
                              const pTituloPt = pOriginal.startsWith("TEXTO|")
                                ? pOriginal.split("|")[1]
                                : pOriginal;
                              return (
                                <div key={pIdx}>
                                  <label className="block text-[10px] font-black uppercase text-[#0E3A68] mb-1.5">
                                    {pTituloPt} *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={
                                      respostasCustomizadas[i]?.[pTituloPt] ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      setRespostasCustomizadas((prev) => ({
                                        ...prev,
                                        [i]: {
                                          ...(prev[i] || {}),
                                          [pTituloPt]: e.target.value,
                                        },
                                      }))
                                    }
                                    className="w-full p-3.5 bg-white border border-blue-200 rounded-xl text-xs font-bold"
                                  />
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            <section className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={concordaTermos}
                  onChange={(e) => setConcordaTermos(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-[#0E3A68] cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-600 leading-relaxed">
                  {isEn ? (
                    <>
                      I accept HelloCamp&apos;s{" "}
                      <Link
                        className="text-[#0E3A68] underline"
                        href={`/${lang}/termos`}
                        target="_blank"
                      >
                        Terms & Conditions
                      </Link>{" "}
                      and the camp&apos;s cancellation policy.
                    </>
                  ) : (
                    <>
                      Declaro que sou maior de idade e aceito os{" "}
                      <Link
                        className="text-[#0E3A68] underline"
                        href={`/${lang}/termos`}
                        target="_blank"
                      >
                        Termos e Condições
                      </Link>{" "}
                      e a política de cancelamento do programa.
                    </>
                  )}
                </span>
              </label>

              <button
                type="submit"
                disabled={processingState || !concordaTermos}
                className="w-full mt-6 py-5 px-6 text-sm uppercase tracking-widest font-black rounded-2xl bg-[#e2a41d] hover:bg-[#d4991b] disabled:bg-slate-200 text-slate-900 shadow-xl cursor-pointer transition-all"
              >
                {isExterna
                  ? isEn
                    ? "Proceed to Official External Form ↗"
                    : "Avançar para Formulário Oficial ↗"
                  : isEn
                  ? `Confirm & Pay ${valorACobrarAgora.toFixed(2)}€`
                  : `Confirmar e Pagar ${valorACobrarAgora.toFixed(2)}€`}
              </button>
            </section>
          </form>
        </div>

        {/* SIDEBAR DIREITA - RESUMO */}
        <aside className="flex-[1_1_35%] w-full lg:sticky lg:top-24">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <h3 className="text-base font-black mb-6 border-b border-slate-100 pb-4 uppercase tracking-widest text-slate-900">
              {isEn ? "Booking Summary" : "Resumo da Inscrição"}
            </h3>

            <div className="space-y-4 mb-6 text-xs">
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                  {isEn ? "Program" : "Programa"}
                </span>
                <p className="text-sm font-black text-slate-900 m-0">
                  {turnoSelecionado?.nome || campo?.nome}
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-500">
                  {isEn
                    ? `Base Price (x${quantidade})`
                    : `Preço Base (x${quantidade})`}
                </span>
                <span className="font-black text-slate-900">
                  {(precoBaseUnitario * quantidade).toFixed(2)}€
                </span>
              </div>

              {extSeguro && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500">🛡️ Seguro</span>
                  <span className="font-black text-slate-900">
                    {(custoSeguroUnit * quantidade).toFixed(2)}€
                  </span>
                </div>
              )}

              {extTransporte && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-500">
                    🚌 Transporte
                  </span>
                  <span className="font-black text-slate-900">
                    {(custoTransporteUnit * quantidade).toFixed(2)}€
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-[#0E3A68] text-white flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isEn ? "Total Value" : "Valor Total"}
              </span>
              <span className="text-2xl font-black">
                {precoFinalTotal.toFixed(2)}€
              </span>
            </div>

            {!isExterna && (
              <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#167524]">
                  {isEn ? "To Pay Now" : "A Pagar Agora"}
                </span>
                <span className="text-xl font-black text-[#167524]">
                  {valorACobrarAgora.toFixed(2)}€
                </span>
              </div>
            )}

            {isPagamentoFracionado && !isExterna && (
              <p className="text-[11px] font-bold text-slate-500 text-center mt-3 mb-0">
                Restantes {valorPendente.toFixed(2)}€ pagos até 1 semana antes
                no Portal de Cliente.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
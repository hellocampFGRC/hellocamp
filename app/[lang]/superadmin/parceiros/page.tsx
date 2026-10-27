"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const STATUS_OPCOES = [
  "Sem Contrato",
  "Preparação HQ",
  "Pendente de Revisão",
  "Aprovado",
  "Rejeitado",
];

const MODALIDADES_OPCOES = [
  { id: "direta", label: "Reserva Direta no Checkout (Stripe)" },
  { id: "email", label: "Reserva Sob Consulta (E-mail)" },
  { id: "link_externo", label: "Redirecionamento Link Externo" },
];

export default function GestaoParceirosHQ({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);

  const [parceiros, setParceiros] = useState<any[]>([]);
  const [camposCountMap, setCamposCountMap] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");

  // Modal de Criação / Edição
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: "",
    nome_completo: "",
    email: "",
    password: "",
    empresa_nome: "",
    nif_empresa: "",
    telefone: "",
    taxa_comissao: "12",
    base_comissao: "total",
    modalidade_reserva: "direta",
    status_contrato: "Preparação HQ",
  });

  // Modal de Partilha de Credenciais e Link de Onboarding
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeData, setWelcomeData] = useState({
    id: "",
    nome: "",
    email: "",
    password: "",
    empresa: "",
  });

  // Modal para Definir Nova Password Manualmente
  const [resetModalParceiro, setResetModalParceiro] = useState<any>(null);
  const [novaPassManual, setNovaPassManual] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const fetchParceiros = async () => {
    setLoading(true);
    const [{ data, error }, { data: camposData }] = await Promise.all([
      supabase
        .from("perfis")
        .select(
          "id, empresa_nome, nome_completo, nif_empresa, email, telefone, status_contrato, taxa_comissao, base_comissao, modalidade_reserva, created_at"
        )
        .eq("role", "organizador")
        .order("created_at", { ascending: false }),
      supabase.from("campos").select("id, organizador_id"),
    ]);

    if (error) {
      alert("Erro ao ler a base de dados: " + error.message);
    } else {
      setParceiros(data || []);
    }

    const counts: Record<string, number> = {};
    (camposData || []).forEach((c: any) => {
      if (c.organizador_id) {
        counts[c.organizador_id] = (counts[c.organizador_id] || 0) + 1;
      }
    });
    setCamposCountMap(counts);
    setLoading(false);
  };

  useEffect(() => {
    fetchParceiros();
  }, []);

  const abrirModalNovo = () => {
    const randomPass = Math.random().toString(36).slice(-6) + "Hc26!";
    setForm({
      id: "",
      nome_completo: "",
      email: "",
      password: randomPass,
      empresa_nome: "",
      nif_empresa: "",
      telefone: "",
      taxa_comissao: "12",
      base_comissao: "total",
      modalidade_reserva: "direta",
      status_contrato: "Preparação HQ",
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const abrirModalEditar = (p: any) => {
    setForm({
      id: p.id,
      nome_completo: p.nome_completo || "",
      email: p.email || "",
      password: "",
      empresa_nome: p.empresa_nome || "",
      nif_empresa: p.nif_empresa || "",
      telefone: p.telefone || "",
      taxa_comissao: (p.taxa_comissao ?? 12).toString(),
      base_comissao: p.base_comissao || "total",
      modalidade_reserva: p.modalidade_reserva || "direta",
      status_contrato: p.status_contrato || "Sem Contrato",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || (!isEditing && !form.password)) {
      alert("Preencha o E-mail e a Password temporária.");
      return;
    }

    setSaving(true);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("perfis")
          .update({
            nome_completo: form.nome_completo || null,
            empresa_nome: form.empresa_nome || null,
            nif_empresa: form.nif_empresa || null,
            telefone: form.telefone || null,
            taxa_comissao: parseFloat(form.taxa_comissao) || 12,
            base_comissao: form.base_comissao,
            modalidade_reserva: form.modalidade_reserva,
            status_contrato: form.status_contrato,
            parceiro_verificado: form.status_contrato === "Aprovado",
          })
          .eq("id", form.id);

        if (error) throw error;

        // Propaga a comissão e modalidade para os campos deste parceiro
        await supabase
          .from("campos")
          .update({
            taxa_comissao: parseFloat(form.taxa_comissao) || 12,
            base_comissao: form.base_comissao,
            modalidade_reserva: form.modalidade_reserva,
          })
          .eq("organizador_id", form.id);

        alert("Parceiro atualizado com sucesso!");
        setShowModal(false);
        fetchParceiros();
      } else {
        // CRIAÇÃO SEGURA VIA API ADMIN (NÃO TERMINA A SESSÃO DO SUPERADMIN!)
        const res = await fetch("/api/notificar-reserva/admin/criar-parceiro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            email: form.email,
            password: form.password,
            nome_completo: form.nome_completo,
            empresa_nome: form.empresa_nome,
            nif_empresa: form.nif_empresa,
            telefone: form.telefone,
            taxa_comissao: parseFloat(form.taxa_comissao) || 12,
            base_comissao: form.base_comissao,
            modalidade_reserva: form.modalidade_reserva,
            status_contrato: form.status_contrato,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao criar parceiro.");

        setShowModal(false);
        setWelcomeData({
          id: data.user?.id || "",
          nome: form.nome_completo || form.empresa_nome || "Parceiro",
          email: form.email.trim().toLowerCase(),
          password: form.password,
          empresa: form.empresa_nome || form.nome_completo || "Parceiro",
        });
        setShowWelcomeModal(true);
        fetchParceiros();
      }
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Envia E-mail de Recuperação OU Define Nova Password Diretamente
  const handleEnviarEmailRecuperacao = async (email: string) => {
    if (!window.confirm(`Enviar link de recuperação por e-mail para ${email}?`))
      return;

    // CORRIGIDO: Aponta para a rota real /atualizar-password
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://www.hellocamp.pt/${lang}/atualizar-password`,
    });

    if (error) alert("Erro ao enviar e-mail: " + error.message);
    else alert("E-mail de recuperação enviado com sucesso para o parceiro!");
  };

  const handleDefinirPasswordDireta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalParceiro || novaPassManual.length < 6) return;
    setSavingPass(true);
    try {
      const res = await fetch("/api/notificar-reserva/admin/criar-parceiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          id: resetModalParceiro.id,
          password: novaPassManual,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar password.");

      // Abre o modal de boas-vindas com a nova password pronta a copiar/enviar por WhatsApp!
      setWelcomeData({
        id: resetModalParceiro.id,
        nome:
          resetModalParceiro.nome_completo ||
          resetModalParceiro.empresa_nome ||
          "Parceiro",
        email: resetModalParceiro.email,
        password: novaPassManual,
        empresa:
          resetModalParceiro.empresa_nome ||
          resetModalParceiro.nome_completo ||
          "Parceiro",
      });
      setResetModalParceiro(null);
      setNovaPassManual("");
      setShowWelcomeModal(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPass(false);
    }
  };

  // CORRIGIDO: Links 100% válidos (/login e /assinatura-contrato/[id])
  const linkOnboardingDireto = welcomeData.id
    ? `https://www.hellocamp.pt/${lang}/assinatura-contrato/${welcomeData.id}`
    : `https://www.hellocamp.pt/${lang}/login`;

  const textoMensagem = `Olá ${
    welcomeData.nome.split(" ")[0]
  }! 🎉\n\nA conta de Parceiro Organizador da ${
    welcomeData.empresa
  } na plataforma HelloCamp já está criada e pré-configurada.\n\nTem duas formas simples de aceder:\n\n1️⃣ ACESSO DIRETO AO PAINEL:\n🔗 Link de Login: https://www.hellocamp.pt/${lang}/login\n✉️ E-mail: ${
    welcomeData.email
  }\n🔑 Password Temporária: ${
    welcomeData.password
  }\n\n2️⃣ FORMALIZAR ACORDO E DEFINIR A SUA PRÓPRIA PASSWORD:\n📄 Link Direto do Contrato: ${linkOnboardingDireto}\n\nQualquer dúvida, estamos inteiramente à disposição!\nEquipa HelloCamp`;

  const parceirosFiltrados = parceiros.filter((p) =>
    `${p.empresa_nome || ""} ${p.nome_completo || ""} ${p.email || ""} ${
      p.nif_empresa || ""
    }`
      .toLowerCase()
      .includes(pesquisa.toLowerCase())
  );

  const labelClass =
    "text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1 block";
  const inputClass =
    "w-full py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-colors";

  return (
    <div className="max-w-7xl mx-auto font-sans pb-20">
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight m-0">
            Gestão de Parceiros B2B
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 mb-0">
            Criação Manual de Contas, Passwords e Taxas de Comissão
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar empresa, email ou NIF..."
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-slate-900 min-w-[240px]"
          />
          <button
            type="button"
            onClick={abrirModalNovo}
            className="bg-[#167524] hover:bg-[#115a1b] text-white px-6 py-3.5 rounded-xl text-xs uppercase tracking-widest font-black shadow-lg cursor-pointer transition-colors"
          >
            + Criar Nova Entidade
          </button>
        </div>
      </div>

      {/* TABELA DE PARCEIROS */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[900px] border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Empresa / NIF
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Contacto & Login
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Campos
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Contrato / Comissão
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                Ações de Conta & Acesso
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse"
                >
                  A carregar parceiros...
                </td>
              </tr>
            ) : parceirosFiltrados.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-12 text-center text-slate-400 font-bold text-sm"
                >
                  Nenhum parceiro organizador encontrado.
                </td>
              </tr>
            ) : (
              parceirosFiltrados.map((p) => {
                let statusLabel = p.status_contrato || "Sem Contrato";
                let statusColor =
                  "bg-slate-100 text-slate-600 border-slate-200";
                if (p.status_contrato === "Aprovado") {
                  statusColor =
                    "bg-emerald-100 text-emerald-800 border-emerald-200";
                } else if (
                  p.status_contrato === "Pendente de Revisão" ||
                  p.status_contrato === "Pendente" ||
                  p.status_contrato === "Preparação HQ"
                ) {
                  statusColor = "bg-amber-100 text-amber-800 border-amber-200";
                } else if (p.status_contrato === "Rejeitado") {
                  statusColor = "bg-red-100 text-red-800 border-red-200";
                }

                const numCampos = camposCountMap[p.id] || 0;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-black text-sm text-slate-900">
                        {p.empresa_nome || (
                          <span className="text-slate-400 italic">
                            Por definir
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {p.nif_empresa ? `NIF: ${p.nif_empresa}` : "Sem NIF"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">
                        {p.nome_completo || "Sem Nome"}
                      </div>
                      <div className="text-xs font-bold text-blue-600 mt-0.5 break-all">
                        {p.email}
                      </div>
                      {p.telefone && (
                        <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                          📞 {p.telefone}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/${lang}/superadmin/campos?parceiro=${p.id}`}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs px-3 py-1.5 rounded-xl no-underline transition-colors"
                      >
                        🏕️ {numCampos} {numCampos === 1 ? "Campo" : "Campos"}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                        <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {p.taxa_comissao ?? 12}% •{" "}
                          {p.modalidade_reserva || "direta"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => abrirModalEditar(p)}
                          className="bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black hover:bg-slate-50 cursor-pointer"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const suggested =
                              Math.random().toString(36).slice(-6) + "Hc26!";
                            setNovaPassManual(suggested);
                            setResetModalParceiro(p);
                          }}
                          className="bg-emerald-50 border border-emerald-200 text-[#167524] px-3.5 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black hover:bg-emerald-100 cursor-pointer"
                          title="Definir uma nova password temporária e gerar mensagem de acesso"
                        >
                          🔑 Definir Pass / Convite
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEnviarEmailRecuperacao(p.email)}
                          className="bg-blue-50 border border-blue-200 text-blue-700 px-3.5 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black hover:bg-blue-100 cursor-pointer"
                          title="Disparar e-mail automático de redefinição de password"
                        >
                          ✉️ Email Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CRIAR / EDITAR PARCEIRO (COM DROPDOWNS 100% CUSTOMIZADOS) */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-black text-slate-900 m-0">
                {isEditing
                  ? "Editar Parceiro Organizador"
                  : "Criar Nova Conta de Parceiro"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-black cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
              <form
                id="partner-form"
                onSubmit={handleSubmeter}
                className="space-y-6"
              >
                {/* 1. CREDENCIAIS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
                    1. Credenciais de Acesso
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>
                        Nome do Responsável *
                      </label>
                      <input
                        required
                        className={inputClass}
                        value={form.nome_completo}
                        onChange={(e) =>
                          setForm({ ...form, nome_completo: e.target.value })
                        }
                        placeholder="Ex: João Silva"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>E-mail de Login *</label>
                      <input
                        type="email"
                        required
                        disabled={isEditing}
                        className={`${inputClass} ${
                          isEditing
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : ""
                        }`}
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        placeholder="geral@empresa.pt"
                      />
                    </div>
                    {!isEditing && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>
                          Password Temporária Inicial *
                        </label>
                        <input
                          required
                          minLength={6}
                          className={inputClass}
                          value={form.password}
                          onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                          }
                        />
                        <p className="text-[10px] font-bold text-slate-400 mt-1.5 mb-0">
                          O parceiro poderá entrar diretamente com esta password
                          ou definir uma nova ao assinar o contrato.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. GESTÃO COMERCIAL (DROPDOWNS CUSTOMIZADOS) */}
                <div className="bg-amber-50/60 p-6 rounded-2xl border border-amber-200 shadow-sm">
                  <h3 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-4 border-b border-amber-200/60 pb-2">
                    2. Condições Comerciais Padrão
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>
                        Taxa de Comissão Base (%) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        className={inputClass}
                        value={form.taxa_comissao}
                        onChange={(e) =>
                          setForm({ ...form, taxa_comissao: e.target.value })
                        }
                      />
                    </div>

                    {/* Dropdown Customizado de Status */}
                    <div className="relative">
                      <label className={labelClass}>
                        Status do Contrato B2B *
                      </label>
                      <div
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === "status" ? null : "status"
                          )
                        }
                        className={`${inputClass} bg-white cursor-pointer flex justify-between items-center`}
                      >
                        <span>{form.status_contrato}</span>
                        <span className="text-[10px] text-slate-400">▼</span>
                      </div>
                      {openDropdown === "status" && (
                        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                          {STATUS_OPCOES.map((st) => (
                            <div
                              key={st}
                              onClick={() => {
                                setForm({ ...form, status_contrato: st });
                                setOpenDropdown(null);
                              }}
                              className="p-3 text-xs font-bold hover:bg-amber-50 cursor-pointer border-b border-slate-50 last:border-0"
                            >
                              {st}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dropdown Customizado de Modalidade */}
                    <div className="md:col-span-2 relative">
                      <label className={labelClass}>
                        Modalidade de Reserva Padrão
                      </label>
                      <div
                        onClick={() =>
                          setOpenDropdown(openDropdown === "mod" ? null : "mod")
                        }
                        className={`${inputClass} bg-white cursor-pointer flex justify-between items-center`}
                      >
                        <span>
                          {
                            MODALIDADES_OPCOES.find(
                              (m) => m.id === form.modalidade_reserva
                            )?.label
                          }
                        </span>
                        <span className="text-[10px] text-slate-400">▼</span>
                      </div>
                      {openDropdown === "mod" && (
                        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                          {MODALIDADES_OPCOES.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => {
                                setForm({ ...form, modalidade_reserva: m.id });
                                setOpenDropdown(null);
                              }}
                              className="p-3 text-xs font-bold hover:bg-amber-50 cursor-pointer border-b border-slate-50 last:border-0"
                            >
                              {m.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. DADOS FISCAIS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
                    3. Dados da Entidade
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        Nome da Empresa / Organização
                      </label>
                      <input
                        className={inputClass}
                        value={form.empresa_nome}
                        onChange={(e) =>
                          setForm({ ...form, empresa_nome: e.target.value })
                        }
                        placeholder="Ex: Surf Academy Lda"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>NIF / NIPC</label>
                      <input
                        className={inputClass}
                        value={form.nif_empresa}
                        onChange={(e) =>
                          setForm({ ...form, nif_empresa: e.target.value })
                        }
                        placeholder="500000000"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Telefone</label>
                      <input
                        className={inputClass}
                        value={form.telefone}
                        onChange={(e) =>
                          setForm({ ...form, telefone: e.target.value })
                        }
                        placeholder="+351 910 000 000"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="bg-white border border-slate-300 text-slate-700 font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-widest cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="partner-form"
                disabled={saving}
                className="bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black px-8 py-3 rounded-xl text-xs uppercase tracking-widest shadow-lg cursor-pointer"
              >
                {saving
                  ? "A guardar..."
                  : isEditing
                  ? "Guardar Alterações"
                  : "Criar Conta de Parceiro"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEFINIR NOVA PASSWORD MANUALMENTE */}
      {resetModalParceiro && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setResetModalParceiro(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-slate-900 m-0 mb-2">
              🔑 Definir Password e Gerar Convite
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Defina uma password temporária para{" "}
              <strong>{resetModalParceiro.email}</strong>. No passo seguinte
              poderá copiar a mensagem completa com os links de acesso.
            </p>
            <form onSubmit={handleDefinirPasswordDireta} className="space-y-4">
              <div>
                <label className={labelClass}>Nova Password Temporária *</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={novaPassManual}
                  onChange={(e) => setNovaPassManual(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalParceiro(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPass}
                  className="bg-[#167524] text-white font-black uppercase tracking-widest text-xs px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  {savingPass ? "A atualizar..." : "Atualizar & Gerar Convite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SUCESSO & PARTILHA DE CREDENCIAIS */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-[#167524] p-6 text-center text-white">
              <span className="text-4xl block mb-2">🎉</span>
              <h2 className="text-2xl font-black m-0">
                Credenciais Prontas a Enviar!
              </h2>
              <p className="text-emerald-100 text-xs mt-1 mb-0">
                Envie a mensagem abaixo ao parceiro{" "}
                <strong>{welcomeData.empresa}</strong> por WhatsApp ou E-mail.
              </p>
            </div>

            <div className="p-6 md:p-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <textarea
                  readOnly
                  className="w-full h-56 bg-transparent border-none resize-none text-xs font-mono text-slate-800 outline-none leading-relaxed"
                  value={textoMensagem}
                />
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(textoMensagem);
                    alert("Mensagem copiada com sucesso!");
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl cursor-pointer"
                >
                  📋 Copiar Mensagem
                </button>
                <a
                  href={`mailto:${
                    welcomeData.email
                  }?subject=${encodeURIComponent(
                    "Credenciais de Acesso - Portal de Parceiros HelloCamp"
                  )}&body=${encodeURIComponent(textoMensagem)}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl text-center no-underline flex items-center justify-center"
                >
                  ✉️ Enviar por E-mail
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    textoMensagem
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl text-center no-underline flex items-center justify-center"
                >
                  💬 Enviar WhatsApp
                </a>
              </div>
            </div>

            <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={() => setShowWelcomeModal(false)}
                className="text-slate-500 hover:text-slate-900 text-xs font-black uppercase tracking-widest underline cursor-pointer bg-transparent border-0"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
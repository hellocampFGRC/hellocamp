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
  const [camposByParceiro, setCamposByParceiro] = useState<
    Record<string, any[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");

  // Modal de Criação / Edição de Parceiro
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

  // Modal de Pré-Visualização e Edição de E-mail / Convite Completo
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [activeEmailTab, setActiveEmailTab] = useState<"edit" | "preview">(
    "preview"
  );
  const [sendingEmail, setSendingEmail] = useState(false);
  const [welcomeData, setWelcomeData] = useState<{
    id: string;
    nome: string;
    email: string;
    password: string;
    empresa: string;
    taxa_comissao: number;
    campos: any[];
  }>({
    id: "",
    nome: "",
    email: "",
    password: "",
    empresa: "",
    taxa_comissao: 12,
    campos: [],
  });

  const [emailAssunto, setEmailAssunto] = useState("");
  const [emailCorpoEditavel, setEmailCorpoEditavel] = useState("");

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
          "id, empresa_nome, nome_empresa, nome, nome_completo, nif_empresa, email, telefone, status_contrato, taxa_comissao, base_comissao, modalidade_reserva, created_at"
        )
        .eq("role", "organizador")
        .order("created_at", { ascending: false }),
      supabase
        .from("campos")
        .select("id, nome, categoria, local, Distrito, preco, ativo, status_aprovacao, organizador_id")
        .order("created_at", { ascending: true }),
    ]);

    if (error) {
      alert("Erro ao ler a base de dados: " + error.message);
    } else {
      setParceiros(data || []);
    }

    const grouped: Record<string, any[]> = {};
    (camposData || []).forEach((c: any) => {
      if (c.organizador_id) {
        if (!grouped[c.organizador_id]) grouped[c.organizador_id] = [];
        grouped[c.organizador_id].push(c);
      }
    });
    setCamposByParceiro(grouped);
    setLoading(false);
  };

  useEffect(() => {
    fetchParceiros();
  }, []);

  // Constrói o texto e assunto padrão sempre que abrimos o Modal de Convite/Pré-Visualização
  const prepararModalConvite = (
    parceiroObj: any,
    passwordTemp?: string
  ) => {
    const id = parceiroObj.id || "";
    const empresa =
      parceiroObj.empresa_nome ||
      parceiroObj.nome_empresa ||
      parceiroObj.nome ||
      parceiroObj.nome_completo ||
      "Parceiro";
    const nomeResp =
      parceiroObj.nome_completo || empresa;
    const primeiroNome = nomeResp.split(" ")[0];
    const emailDestino = (parceiroObj.email || "").trim().toLowerCase();
    const passVisivel =
      passwordTemp || "HelloCamp2026! (ou defina a sua ao assinar o contrato)";
    const listaCampos = camposByParceiro[id] || [];
    const linkContrato = id
      ? `https://www.hellocamp.pt/${lang}/assinatura-contrato/${id}`
      : `https://www.hellocamp.pt/${lang}/login`;
    const linkMontra = id
      ? `https://www.hellocamp.pt/${lang}/parceiro/${id}?preview=admin`
      : `https://www.hellocamp.pt/${lang}`;

    const linhasCampos =
      listaCampos.length > 0
        ? listaCampos
            .map(
              (c, idx) =>
                `   ${idx + 1}. 🏕️ ${c.nome}\n      🔗 Pré-visualizar Página (Visão Admin): https://www.hellocamp.pt/${lang}/campo/${c.id}?preview=admin`
            )
            .join("\n\n")
        : `   • Os seus programas encontram-se prontos a configurar no seu Painel de Organizador.`;

    const assuntoPadrao = `🎉 Bem-vindo à HelloCamp! Perfil e Programas de ${empresa} Prontos para Revisão`;

    const corpoPadrao = `Olá ${primeiroNome},

É com enorme gosto que informamos que o perfil oficial de organizador da ${empresa} e os respetivos campos/programas já foram criados e pré-configurados pela nossa equipa na plataforma HelloCamp!

Para que tudo fique publicado e ativo para as famílias e escolas, basta concluir dois passos rápidos:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ PRÉ-VISUALIZAR O SEU PERFIL E CAMPOS (VISÃO PRIVADA DE ADMIN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Antes mesmo de os campos ficarem visíveis ao público geral, pode rever como ficaram estruturados através destes links exclusivos de pré-visualização:

🏢 Montra Pública da Organização:
${linkMontra}

🏕️ Programas Configurados (${listaCampos.length}):
${linhasCampos}

*(Nota: Caso pretenda ajustar algum detalhe, fotografia, preço ou texto, poderá fazê-lo a qualquer momento no seu Painel de Controlo).*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2️⃣ ASSINAR O CONTRATO DIGITAL E DEFINIR A SUA PASSWORD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Para ativar os seus campos na plataforma, aceda ao link abaixo para rever e assinar digitalmente o Contrato Global de Parceria e definir no final a sua própria password definitiva:

📄 Link Direto do Contrato & Ativação:
${linkContrato}

Em alternativa, se preferir entrar diretamente no seu Painel de Organizador agora mesmo:
🔗 Link de Login: https://www.hellocamp.pt/${lang}/login
✉️ E-mail de Acesso: ${emailDestino}
🔑 Password Temporária: ${passVisivel}

Estamos inteiramente ao dispor para ajudar em qualquer questão!

Com os melhores cumprimentos,
Equipa HelloCamp
🌐 www.hellocamp.pt`;

    setWelcomeData({
      id,
      nome: nomeResp,
      email: emailDestino,
      password: passVisivel,
      empresa,
      taxa_comissao: parceiroObj.taxa_comissao ?? 12,
      campos: listaCampos,
    });
    setEmailAssunto(assuntoPadrao);
    setEmailCorpoEditavel(corpoPadrao);
    setActiveEmailTab("preview");
    setShowWelcomeModal(true);
  };

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
      empresa_nome: p.empresa_nome || p.nome_empresa || p.nome || "",
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
            nome_empresa: form.empresa_nome || null,
            nome: form.empresa_nome || null,
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
        await fetchParceiros();

        prepararModalConvite(
          {
            id: data.user?.id || "",
            nome_completo: form.nome_completo,
            empresa_nome: form.empresa_nome,
            email: form.email,
            taxa_comissao: parseFloat(form.taxa_comissao) || 12,
          },
          form.password
        );
      }
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarEmailRecuperacao = async (email: string) => {
    if (!window.confirm(`Enviar link de recuperação por e-mail para ${email}?`))
      return;

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

      const pTarget = resetModalParceiro;
      const passEscolhida = novaPassManual;
      setResetModalParceiro(null);
      setNovaPassManual("");

      prepararModalConvite(pTarget, passEscolhida);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPass(false);
    }
  };

  // Disparo direto de E-mail via API Resend com confirmação
  const handleDispararEmailAPI = async () => {
    if (!welcomeData.email) {
      alert("Este parceiro não tem um endereço de e-mail válido.");
      return;
    }

    setSendingEmail(true);
    try {
      const res = await fetch("/api/notificar-reserva/admin/criar-parceiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_onboarding_email",
          email: welcomeData.email,
          assunto: emailAssunto,
          texto: emailCorpoEditavel,
          empresa: welcomeData.empresa,
          nome: welcomeData.nome,
          parceiroId: welcomeData.id,
          campos: welcomeData.campos,
          lang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ||
            "Não foi possível disparar via API. Pode usar o botão 'Abrir no Cliente de E-mail'."
        );
      }

      alert(
        `✅ E-mail enviado com sucesso para ${welcomeData.email}!`
      );
    } catch (err: any) {
      alert("Aviso API: " + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const parceirosFiltrados = parceiros.filter((p) =>
    `${p.empresa_nome || ""} ${p.nome_empresa || ""} ${p.nome || ""} ${
      p.nome_completo || ""
    } ${p.email || ""} ${p.nif_empresa || ""}`
      .toLowerCase()
      .includes(pesquisa.toLowerCase())
  );

  const labelClass =
    "text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block";
  const inputClass =
    "w-full py-3 px-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-colors";

  return (
    <div className="max-w-7xl mx-auto font-sans text-[#0F172A] pb-20">
      {/* HEADER EXECUTIVO HELLO CAMP */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-md border border-slate-200 shadow-sm">
        <div>
          <span className="inline-block bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-2">
            SuperAdmin HQ • B2B
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#0F172A] tracking-tight m-0">
            Gestão de Parceiros & Onboarding
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 mb-0">
            Contas, Comissões, Pré-Visualização de Campos e Envio de Convites
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar empresa, responsável, email..."
            className="bg-[#F8FAFC] border border-slate-300 rounded-md px-4 py-3 text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB] min-w-[250px]"
          />
          <button
            type="button"
            onClick={abrirModalNovo}
            className="bg-[#16A34A] hover:bg-green-700 text-white px-6 py-3 rounded-md text-xs uppercase tracking-widest font-black shadow-sm cursor-pointer transition-colors border-0"
          >
            + Criar Nova Entidade
          </button>
        </div>
      </div>

      {/* TABELA DE PARCEIROS (CANTOS RETOS rounded-md) */}
      <div className="bg-white border border-slate-200 rounded-md overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[980px] border-collapse">
          <thead className="bg-[#F8FAFC] border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Empresa / NIF
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Contacto & Login
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Campos & Preview
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Contrato / Comissão
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                Ações de Conta & Convite
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
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
                const statusLabel = p.status_contrato || "Sem Contrato";
                let statusBadgeClass = "bg-slate-600 text-white";
                if (p.status_contrato === "Aprovado") {
                  statusBadgeClass = "bg-[#16A34A] text-white";
                } else if (
                  p.status_contrato === "Pendente de Revisão" ||
                  p.status_contrato === "Pendente" ||
                  p.status_contrato === "Preparação HQ"
                ) {
                  statusBadgeClass = "bg-[#F59E0B] text-white";
                } else if (p.status_contrato === "Rejeitado") {
                  statusBadgeClass = "bg-[#F43F5E] text-white";
                }

                const listaCamposParceiro = camposByParceiro[p.id] || [];
                const numCampos = listaCamposParceiro.length;
                const nomeEmp =
                  p.empresa_nome || p.nome_empresa || p.nome || null;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-black text-sm text-[#0F172A]">
                        {nomeEmp || (
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
                      <div className="text-sm font-bold text-[#0F172A]">
                        {p.nome_completo || nomeEmp || "Sem Nome"}
                      </div>
                      <div className="text-xs font-bold text-[#2563EB] mt-0.5 break-all">
                        {p.email}
                      </div>
                      {p.telefone && (
                        <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                          📞 {p.telefone}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <Link
                          href={`/${lang}/superadmin/campos?parceiro=${p.id}`}
                          className="inline-flex items-center gap-1.5 bg-[#0F172A] hover:bg-[#2563EB] text-white font-black text-[11px] px-3 py-1.5 rounded-md no-underline transition-colors"
                        >
                          🏕️ {numCampos} {numCampos === 1 ? "Campo" : "Campos"}
                        </Link>
                        {numCampos > 0 && (
                          <Link
                            href={`/${lang}/campo/${listaCamposParceiro[0].id}?preview=admin`}
                            target="_blank"
                            className="text-[10px] font-black text-[#2563EB] hover:underline no-underline"
                          >
                            👁️ Ver 1.º Campo (Admin) ↗
                          </Link>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${statusBadgeClass}`}
                        >
                          {statusLabel}
                        </span>
                        <span className="text-[10px] font-black text-[#0F172A] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                          {p.taxa_comissao ?? 12}% •{" "}
                          {p.modalidade_reserva || "direta"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => prepararModalConvite(p)}
                          className="bg-[#F59E0B] hover:bg-amber-600 text-white px-3.5 py-2 rounded-md text-[10px] uppercase tracking-widest font-black cursor-pointer transition-colors border-0 shadow-sm"
                          title="Pré-visualizar, editar e enviar E-mail Completo com os Campos e Contrato"
                        >
                          📧 Convite & Preview E-mail
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const suggested =
                              Math.random().toString(36).slice(-6) + "Hc26!";
                            setNovaPassManual(suggested);
                            setResetModalParceiro(p);
                          }}
                          className="bg-[#16A34A] hover:bg-green-700 text-white px-3.5 py-2 rounded-md text-[10px] uppercase tracking-widest font-black cursor-pointer transition-colors border-0 shadow-sm"
                          title="Definir uma nova password temporária e abrir pré-visualização do convite"
                        >
                          🔑 Definir Pass
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirModalEditar(p)}
                          className="bg-[#2563EB] hover:bg-blue-700 text-white px-3.5 py-2 rounded-md text-[10px] uppercase tracking-widest font-black cursor-pointer transition-colors border-0 shadow-sm"
                        >
                          ✏️ Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEnviarEmailRecuperacao(p.email)}
                          className="bg-[#0F172A] hover:bg-slate-800 text-white px-3 py-2 rounded-md text-[10px] uppercase tracking-widest font-black cursor-pointer transition-colors border-0"
                          title="Disparar link automático de redefinição de password"
                        >
                          🔄 Reset Link
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

      {/* ===================================================================== */}
      {/* MODAL CRIAR / EDITAR PARCEIRO (CANTOS RETOS rounded-md)               */}
      {/* ===================================================================== */}
      {showModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full max-w-3xl max-h-[90vh] rounded-md flex flex-col overflow-hidden shadow-2xl border border-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-[#0F172A] text-white">
              <h2 className="text-lg font-black m-0">
                {isEditing
                  ? "✏️ Editar Parceiro Organizador"
                  : "🏢 Criar Nova Conta de Parceiro"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-md bg-slate-800 text-white font-black cursor-pointer border-0"
              >
                ✕
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-[#F8FAFC]">
              <form
                id="partner-form"
                onSubmit={handleSubmeter}
                className="space-y-6"
              >
                {/* 1. CREDENCIAIS */}
                <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
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
                        placeholder="Ex: Marta Cruz Machado"
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
                        <p className="text-[10px] font-bold text-slate-500 mt-1.5 mb-0">
                          O parceiro poderá entrar diretamente com esta password
                          ou definir uma nova ao assinar o contrato.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. GESTÃO COMERCIAL */}
                <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
                    2. Condições Comerciais Padrão (Por defeito: 12%)
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
                        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-50 overflow-hidden">
                          {STATUS_OPCOES.map((st) => (
                            <div
                              key={st}
                              onClick={() => {
                                setForm({ ...form, status_contrato: st });
                                setOpenDropdown(null);
                              }}
                              className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
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
                        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-50 overflow-hidden">
                          {MODALIDADES_OPCOES.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => {
                                setForm({ ...form, modalidade_reserva: m.id });
                                setOpenDropdown(null);
                              }}
                              className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
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
                <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
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
                        placeholder="Ex: Museu das Comunicações"
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
                        placeholder="+351 210 000 000"
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
                className="bg-slate-600 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-md text-xs uppercase tracking-widest cursor-pointer border-0"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="partner-form"
                disabled={saving}
                className="bg-[#2563EB] hover:bg-blue-700 text-white font-black px-8 py-3 rounded-md text-xs uppercase tracking-widest shadow-sm cursor-pointer border-0"
              >
                {saving
                  ? "A guardar..."
                  : isEditing
                  ? "Guardar Alterações"
                  : "Criar Conta & Abrir Convite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DEFINIR NOVA PASSWORD MANUALMENTE                               */}
      {/* ===================================================================== */}
      {resetModalParceiro && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setResetModalParceiro(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-md p-6 md:p-8 shadow-2xl border border-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-[#0F172A] m-0 mb-2">
              🔑 Definir Password e Rever E-mail de Convite
            </h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Defina uma password temporária para{" "}
              <strong>{resetModalParceiro.email}</strong>. Ao confirmar, abrirá
              a janela de pré-visualização e edição do e-mail com os links de
              visão admin dos campos.
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
                  className="px-4 py-2.5 rounded-md bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer border-0"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPass}
                  className="bg-[#16A34A] hover:bg-green-700 text-white font-black uppercase tracking-widest text-xs px-6 py-2.5 rounded-md cursor-pointer border-0"
                >
                  {savingPass
                    ? "A atualizar..."
                    : "Guardar & Pré-Visualizar E-mail →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE PRÉ-VISUALIZAÇÃO, EDIÇÃO E ENVIO DE E-MAIL DE ONBOARDING     */}
      {/* ===================================================================== */}
      {showWelcomeModal && (
        <div
          className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setShowWelcomeModal(false)}
        >
          <div
            className="bg-white w-full max-w-4xl max-h-[92vh] rounded-md flex flex-col overflow-hidden shadow-2xl border border-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABEÇALHO DO MODAL */}
            <div className="bg-[#0F172A] px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white border-b border-slate-800">
              <div>
                <span className="inline-block bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-1.5">
                  Onboarding B2B • {welcomeData.campos.length}{" "}
                  {welcomeData.campos.length === 1
                    ? "Campo Configurado"
                    : "Campos Configurados"}
                </span>
                <h2 className="text-xl font-black m-0">
                  📧 Rever & Enviar E-mail de Convite — {welcomeData.empresa}
                </h2>
                <p className="text-slate-300 text-xs mt-1 mb-0">
                  Destinatário:{" "}
                  <strong className="text-white">{welcomeData.email}</strong> •
                  Pode editar o texto ou pré-visualizar o aspeto final antes de
                  enviar.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveEmailTab("preview")}
                  className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest cursor-pointer border-0 transition-colors ${
                    activeEmailTab === "preview"
                      ? "bg-[#2563EB] text-white"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  👁️ Pré-Visualizar E-mail
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEmailTab("edit")}
                  className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest cursor-pointer border-0 transition-colors ${
                    activeEmailTab === "edit"
                      ? "bg-[#F59E0B] text-white"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  ✏️ Editar Texto
                </button>
              </div>
            </div>

            {/* CORPO DO MODAL: PRÉ-VISUALIZAÇÃO OU EDIÇÃO */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-[#F8FAFC]">
              {/* CAMPO ASSUNTO SEMPRE VISÍVEL E EDITÁVEL */}
              <div className="mb-4">
                <label className={labelClass}>
                  Assunto do E-mail (Editável)
                </label>
                <input
                  type="text"
                  value={emailAssunto}
                  onChange={(e) => setEmailAssunto(e.target.value)}
                  className="w-full py-3 px-4 bg-white border border-slate-300 rounded-md text-sm font-black text-[#0F172A] outline-none focus:border-[#2563EB]"
                />
              </div>

              {activeEmailTab === "edit" ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelClass}>
                      Corpo da Mensagem (100% Editável)
                    </label>
                    <span className="text-[10px] font-bold text-[#2563EB]">
                      As alterações feitas aqui refletem-se imediatamente na
                      pré-visualização e no envio!
                    </span>
                  </div>
                  <textarea
                    value={emailCorpoEditavel}
                    onChange={(e) => setEmailCorpoEditavel(e.target.value)}
                    rows={16}
                    className="w-full p-4 bg-white border border-slate-300 rounded-md text-xs font-mono text-[#0F172A] outline-none focus:border-[#2563EB] leading-relaxed resize-y"
                  />
                </div>
              ) : (
                /* PRÉ-VISUALIZAÇÃO RICA DO E-MAIL + LINKS DIRETOS CLICÁVEIS */
                <div className="bg-white border border-slate-300 rounded-md overflow-hidden shadow-sm">
                  <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-black text-slate-500 uppercase text-[10px] mr-2">
                        Para:
                      </span>
                      <span className="font-bold text-[#0F172A]">
                        {welcomeData.nome} &lt;{welcomeData.email}&gt;
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveEmailTab("edit")}
                      className="bg-[#F59E0B] hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md cursor-pointer border-0"
                    >
                      ✏️ Editar Texto do E-mail
                    </button>
                  </div>

                  {/* SIMULAÇÃO DO TEMPLATE HTML EXECUTIVO HELLO CAMP */}
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="bg-[#0F172A] text-white p-6 rounded-md flex items-center justify-between">
                      <div>
                        <span className="bg-[#F59E0B] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block mb-2">
                          Portal de Parceiros HelloCamp
                        </span>
                        <h3 className="text-xl font-black m-0">
                          {welcomeData.empresa}
                        </h3>
                      </div>
                      <span className="text-3xl">🏕️</span>
                    </div>

                    {/* TEXTO FORMATADO (RESPEITA QUALQUER EDIÇÃO FEITA NO SEPARADOR EDITAR) */}
                    <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-medium bg-[#F8FAFC] p-5 rounded-md border border-slate-200">
                      {emailCorpoEditavel}
                    </div>

                    {/* CARTÕES DE TESTE RÁPIDO DOS LINKS DE VISÃO ADMIN */}
                    <div className="border-t border-slate-200 pt-5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 m-0 mb-3">
                        🔍 Testar Links de Visão Admin Incluídos no E-mail (Mesmo
                        com Campos Inativos/Pendentes):
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {welcomeData.id && (
                          <a
                            href={`/${lang}/parceiro/${welcomeData.id}?preview=admin`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-black text-[#2563EB] no-underline flex items-center justify-between"
                          >
                            <span>🏢 Ver Montra Pública do Parceiro</span>
                            <span>↗</span>
                          </a>
                        )}
                        {welcomeData.id && (
                          <a
                            href={`/${lang}/assinatura-contrato/${welcomeData.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md text-xs font-black text-amber-900 no-underline flex items-center justify-between"
                          >
                            <span>📄 Ver Página de Assinatura de Contrato</span>
                            <span>↗</span>
                          </a>
                        )}
                        {welcomeData.campos.map((c: any) => (
                          <a
                            key={c.id}
                            href={`/${lang}/campo/${c.id}?preview=admin`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md text-xs font-black text-[#16A34A] no-underline flex items-center justify-between"
                          >
                            <span className="truncate pr-2">
                              🏕️ {c.nome}
                            </span>
                            <span className="flex-shrink-0">Ver Admin ↗</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BARRA DE AÇÕES DE CONFIRMAÇÃO E ENVIO */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowWelcomeModal(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-[10px] px-5 py-3.5 rounded-md cursor-pointer border-0"
              >
                Fechar Janela
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Assunto: ${emailAssunto}\n\n${emailCorpoEditavel}`
                    );
                    alert("Assunto e mensagem copiados para a área de transferência!");
                  }}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] px-5 py-3.5 rounded-md cursor-pointer border-0"
                >
                  📋 Copiar Texto
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    emailCorpoEditavel
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#16A34A] hover:bg-green-700 text-white font-black uppercase tracking-widest text-[10px] px-5 py-3.5 rounded-md no-underline inline-flex items-center justify-center"
                >
                  💬 Enviar WhatsApp
                </a>

                <a
                  href={`mailto:${
                    welcomeData.email
                  }?subject=${encodeURIComponent(
                    emailAssunto
                  )}&body=${encodeURIComponent(emailCorpoEditavel)}`}
                  className="bg-[#F59E0B] hover:bg-amber-600 text-white font-black uppercase tracking-widest text-[10px] px-5 py-3.5 rounded-md no-underline inline-flex items-center justify-center"
                >
                  ✉️ Abrir no App de E-mail
                </a>

                <button
                  type="button"
                  disabled={sendingEmail}
                  onClick={handleDispararEmailAPI}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3.5 rounded-md cursor-pointer border-0 shadow-md"
                >
                  {sendingEmail
                    ? "A enviar E-mail..."
                    : "🚀 Confirmar & Enviar E-mail Agora"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
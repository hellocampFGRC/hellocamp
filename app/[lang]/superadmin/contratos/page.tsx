"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

export default function GestaoContratosHQ({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);

  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalPerfil, setModalPerfil] = useState<any>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("Todos");

  // Edição de Termos Pré-Acordados pelo HQ
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editComissao, setEditComissao] = useState<number>(12);
  const [editBaseComissao, setEditBaseComissao] = useState<string>("total");
  const [savingEdit, setSavingEdit] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Partilha de Link Único de Assinatura
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchContratos = async () => {
    setLoading(true);
    const { data: perfisData, error: perfisError } = await supabase
      .from("perfis")
      .select(
        "id, empresa_nome, nome_completo, nif_empresa, email, telefone, contrato_dados, status_contrato, modalidade_reserva, link_externo_reserva, created_at, taxa_comissao, base_comissao"
      )
      .eq("role", "organizador")
      .order("created_at", { ascending: false });

    if (perfisError) {
      alert("Erro ao ler a base de dados: " + perfisError.message);
      setLoading(false);
      return;
    }

    const { data: camposData } = await supabase
      .from("campos")
      .select("organizador_id, contrato_parceiro_url")
      .not("contrato_parceiro_url", "is", null);

    const organizadores = (perfisData || []).map((perfil) => {
      const camposDoPerfil = (camposData || []).filter(
        (c) => c.organizador_id === perfil.id
      );
      return {
        ...perfil,
        campos: camposDoPerfil,
      };
    });

    setContratos(organizadores);
    setLoading(false);
  };

  useEffect(() => {
    fetchContratos();
  }, []);

  const abrirModal = (perfil: any) => {
    setModalPerfil(perfil);
    const cd = perfil.contrato_dados || {};
    setEditForm({
      empresaNome: cd.empresaNome || perfil.empresa_nome || "",
      nif: cd.nif || perfil.nif_empresa || "",
      pessoaContacto: cd.pessoaContacto || perfil.nome_completo || "",
      emailContacto: cd.emailContacto || perfil.email || "",
      telefone: cd.telefone || perfil.telefone || "",
      modalidadeReserva:
        perfil.modalidade_reserva || cd.modalidadeReserva || "direta",
      linkExternoReserva:
        perfil.link_externo_reserva || cd.linkExternoReserva || "",
      tipoPagamento: cd.tipoPagamento || "100_total",
      politicaCancelamento:
        cd.politicaCancelamento ||
        "Flexível (Reembolso a 100% até 7 dias antes)",
      acordosComplementares: cd.acordosComplementares || "",
    });
    setEditComissao(perfil.taxa_comissao ?? 12);
    setEditBaseComissao(perfil.base_comissao || "total");
    setIsEditing(false);
  };

  const handleGuardarEdicao = async () => {
    if (!modalPerfil) return;
    setSavingEdit(true);

    const novoJsonContrato = {
      ...(modalPerfil.contrato_dados || {}),
      ...editForm,
      taxaComissao: editComissao,
      baseComissao: editBaseComissao,
      dataEnvio: new Date().toISOString(),
    };

    const { error: perfilError } = await supabase
      .from("perfis")
      .update({
        empresa_nome: editForm.empresaNome || modalPerfil.empresa_nome,
        nif_empresa: editForm.nif || modalPerfil.nif_empresa,
        contrato_dados: novoJsonContrato,
        taxa_comissao: editComissao,
        base_comissao: editBaseComissao,
        modalidade_reserva: editForm.modalidadeReserva,
        link_externo_reserva:
          editForm.modalidadeReserva === "link_externo"
            ? editForm.linkExternoReserva
            : null,
      })
      .eq("id", modalPerfil.id);

    if (perfilError) {
      alert("Erro: " + perfilError.message);
      setSavingEdit(false);
      return;
    }

    await supabase
      .from("campos")
      .update({
        contrato_dados: novoJsonContrato,
        taxa_comissao: editComissao,
        base_comissao: editBaseComissao,
        modalidade_reserva: editForm.modalidadeReserva,
        link_externo_reserva:
          editForm.modalidadeReserva === "link_externo"
            ? editForm.linkExternoReserva
            : null,
        tipo_pagamento:
          editForm.modalidadeReserva !== "link_externo"
            ? editForm.tipoPagamento
            : null,
        politica_cancelamento:
          editForm.modalidadeReserva !== "link_externo"
            ? editForm.politicaCancelamento
            : null,
      })
      .eq("organizador_id", modalPerfil.id);

    alert(
      "Termos operacionais pré-configurados com sucesso! Pode agora gerar o Link de Assinatura e enviar ao Parceiro."
    );
    setModalPerfil({
      ...modalPerfil,
      contrato_dados: novoJsonContrato,
      taxa_comissao: editComissao,
      base_comissao: editBaseComissao,
      modalidade_reserva: editForm.modalidadeReserva,
      link_externo_reserva: editForm.linkExternoReserva,
    });
    setIsEditing(false);
    setSavingEdit(false);
    fetchContratos();
  };

  const gerarLinkAssinatura = () => {
    if (!modalPerfil) return;
    const url = `https://www.hellocamp.pt/${lang}/assinatura-contrato/${modalPerfil.id}`;
    setShareUrl(url);
    setCopied(false);
    setShowShareModal(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleAcaoContrato = async (id: string, novoStatus: string) => {
    const isApproved = novoStatus === "Aprovado";

    const { error: perfilError } = await supabase
      .from("perfis")
      .update({
        status_contrato: novoStatus,
        parceiro_verificado: isApproved,
      })
      .eq("id", id);

    if (perfilError) {
      alert("Erro ao atualizar parceiro: " + perfilError.message);
      return;
    }

    await supabase
      .from("campos")
      .update({
        status_aprovacao: novoStatus,
        ativo: isApproved,
      })
      .eq("organizador_id", id);

    // CORRIGIDO: Chama a rota real /api/admin/aprovar-contrato!
    try {
      const dados = modalPerfil?.contrato_dados || {};
      const emailDestino = dados.emailContacto || modalPerfil?.email;
      if (emailDestino) {
        await fetch("/api/admin/aprovar-contrato", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parceiroEmail: emailDestino,
            nomeCampo:
              modalPerfil?.empresa_nome || "Acordo Global de Parceria B2B",
            status: novoStatus,
            lang: lang,
          }),
        });
      }
    } catch (err) {
      console.error(err);
    }

    alert(`Sucesso! O Parceiro está agora com estado: ${novoStatus}.`);
    setModalPerfil((prev: any) => ({ ...prev, status_contrato: novoStatus }));
    fetchContratos();
  };

  let pdfGlobalUrl = null;
  if (modalPerfil?.campos && Array.isArray(modalPerfil.campos)) {
    const campoComPdf = modalPerfil.campos.find(
      (c: any) =>
        c.contrato_parceiro_url && c.contrato_parceiro_url.startsWith("http")
    );
    if (campoComPdf) pdfGlobalUrl = campoComPdf.contrato_parceiro_url;
  }

  const contratosFiltrados = contratos.filter((c) => {
    if (filtroStatus === "Todos") return true;
    if (filtroStatus === "Assinados")
      return !!c.contrato_dados?.assinaturaNome;
    if (filtroStatus === "Sem Assinatura")
      return !c.contrato_dados?.assinaturaNome;
    return c.status_contrato === filtroStatus;
  });

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">
        A carregar Contratos Globais de Parceiros...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-sans pb-16">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight m-0">
            Gestão de Contratos Globais B2B
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 mb-0">
            Pré-Configuração de Comissões, Envio de Links de Assinatura e
            Validação
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Todos", "Assinados", "Sem Assinatura", "Aprovado"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFiltroStatus(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
                filtroStatus === tab
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[850px] border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Parceiro / NIF
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Assinatura Digital
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Comissão / Modelo
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Estado
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                Ação HQ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contratosFiltrados.map((c) => {
              const assinado = !!c.contrato_dados?.assinaturaNome;
              return (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-4">
                    <div className="font-black text-sm text-slate-900">
                      {c.empresa_nome || c.nome_completo || "Parceiro"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {c.email} {c.nif_empresa ? `• NIF: ${c.nif_empresa}` : ""}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {assinado ? (
                      <div>
                        <span className="text-xs font-black text-[#167524]">
                          ✍️ {c.contrato_dados.assinaturaNome}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          IP: {c.contrato_dados.ipAssinatura || "Registado"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                        Aguarda Assinatura
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-slate-800">
                      {c.taxa_comissao ?? 12}% ({c.base_comissao || "total"})
                    </span>
                    <div className="text-[11px] font-bold text-slate-500">
                      Modo: {c.modalidade_reserva || "direta"}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        c.status_contrato === "Aprovado"
                          ? "bg-emerald-100 text-[#167524]"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {c.status_contrato || "Pendente"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => abrirModal(c)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-xl cursor-pointer"
                    >
                      Gerir Contrato & Link
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DE GESTÃO DO CONTRATO E DISPARO DE LINK */}
      {modalPerfil && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setModalPerfil(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start pb-5 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 m-0">
                  {modalPerfil.empresa_nome ||
                    modalPerfil.nome_completo ||
                    "Parceiro"}
                </h2>
                <p className="text-xs font-bold text-slate-500 m-0 mt-1">
                  E-mail Oficial (Gatekeeper):{" "}
                  <strong className="text-blue-600">{modalPerfil.email}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalPerfil(null)}
                className="w-8 h-8 rounded-full bg-slate-100 font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* BARRA DE ACÕES RÁPIDAS */}
            <div className="flex flex-wrap gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={gerarLinkAssinatura}
                className="bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest text-xs px-5 py-3 rounded-xl cursor-pointer shadow-sm"
              >
                🔗 Gerar Link de Assinatura & Password
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white border border-slate-300 text-slate-800 font-black uppercase tracking-widest text-xs px-4 py-3 rounded-xl cursor-pointer"
              >
                {isEditing
                  ? "Cancelar Edição"
                  : "✏️ Pré-Configurar Comissão e Termos"}
              </button>

              {pdfGlobalUrl && (
                <a
                  href={pdfGlobalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-50 border border-emerald-200 text-[#167524] font-black uppercase tracking-widest text-xs px-4 py-3 rounded-xl no-underline flex items-center"
                >
                  📥 Abrir PDF Assinado
                </a>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 bg-amber-50/50 p-5 rounded-2xl border border-amber-200 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Taxa de Comissão (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editComissao}
                      onChange={(e) => setEditComissao(Number(e.target.value))}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-[#167524]"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Base de Incidência
                    </label>
                    <div
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === "base" ? null : "base"
                        )
                      }
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black cursor-pointer flex justify-between items-center"
                    >
                      <span>
                        {editBaseComissao === "apenas_programa"
                          ? "Apenas sobre Programa Base"
                          : editBaseComissao === "sem_comissao"
                          ? "Isento (0%)"
                          : "Sobre Valor Total (Programa + Extras)"}
                      </span>
                      <span>▼</span>
                    </div>
                    {openDropdown === "base" && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                        {[
                          {
                            id: "total",
                            label: "Sobre Valor Total (Programa + Extras)",
                          },
                          {
                            id: "apenas_programa",
                            label: "Apenas sobre Programa Base",
                          },
                          { id: "sem_comissao", label: "Isento (0%)" },
                        ].map((b) => (
                          <div
                            key={b.id}
                            onClick={() => {
                              setEditBaseComissao(b.id);
                              setOpenDropdown(null);
                            }}
                            className="p-3 text-xs font-bold hover:bg-amber-50 cursor-pointer"
                          >
                            {b.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Acordos Complementares (Anexo 4)
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.acordosComplementares || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        acordosComplementares: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={handleGuardarEdicao}
                  className="bg-[#167524] text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl cursor-pointer"
                >
                  {savingEdit
                    ? "A guardar..."
                    : "✓ Gravar Termos Pré-Definidos"}
                </button>
              </div>
            ) : null}

            {/* BOTÕES DE APROVAÇÃO / REJEIÇÃO JURÍDICA */}
            <div className="pt-5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-bold text-slate-500">
                Estado Atual:{" "}
                <strong className="text-slate-900">
                  {modalPerfil.status_contrato || "Pendente"}
                </strong>
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleAcaoContrato(modalPerfil.id, "Rejeitado")
                  }
                  className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-black uppercase tracking-widest text-xs px-5 py-3 rounded-xl cursor-pointer"
                >
                  ✕ Rejeitar e Notificar
                </button>
                <button
                  type="button"
                  onClick={() => handleAcaoContrato(modalPerfil.id, "Aprovado")}
                  className="bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl cursor-pointer shadow-md"
                >
                  ✓ Aprovar Contrato & Ativar Campos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARTILHA DO LINK DE ASSINATURA */}
      {showShareModal && modalPerfil && (
        <div
          className="fixed inset-0 bg-slate-900/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-slate-900 m-0 mb-2">
              🔗 Link de Onboarding & Assinatura
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Ao abrir este link, o parceiro introduz o seu e-mail (
              <strong>{modalPerfil.email}</strong>) para desbloquear o
              documento, <strong>define a sua própria password</strong> e assina
              digitalmente o contrato:
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="bg-[#0E3A68] text-white font-black uppercase text-xs px-5 rounded-xl cursor-pointer"
              >
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-xs font-black uppercase text-slate-500 cursor-pointer bg-transparent border-0"
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
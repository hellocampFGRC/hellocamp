"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import jsPDF from "jspdf";

export default function GestaoContratoGlobalPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [totalCampos, setTotalCampos] = useState(0);
  const [pdfExistenteUrl, setPdfExistenteUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    empresaNome: "",
    nif: "",
    formaJuridica: "Lda / Sociedade por Quotas",
    pessoaContacto: "",
    telefone: "",
    morada: "",
    codigoPostal: "",
    emailContacto: "",
    emailReservas: "",
    responsavelRGPD: "",
    modalidadeReserva: "direta",
    linkExternoReserva: "",
    tipoPagamento: "100_total",
    politicaCancelamento: "Flexível (Reembolso a 100% até 7 dias antes)",
    acordosComplementares: "",
    assinaturaNome: "",
    assinaturaCargo: "",
    concordaTermos: false,
  });

  useEffect(() => {
    const carregarContrato = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const uid = session.user.id;

      const [{ data: perfilData }, { data: camposData }] = await Promise.all([
        supabase.from("perfis").select("*").eq("id", uid).single(),
        supabase
          .from("campos")
          .select("id, contrato_parceiro_url")
          .eq("organizador_id", uid),
      ]);

      setPerfil(perfilData);
      setTotalCampos(camposData?.length || 0);

      const campoComPdf = camposData?.find((c) => c.contrato_parceiro_url);
      if (campoComPdf?.contrato_parceiro_url) {
        setPdfExistenteUrl(campoComPdf.contrato_parceiro_url);
      }

      if (perfilData) {
        const cd = perfilData.contrato_dados || {};
        setForm({
          empresaNome:
            cd.empresaNome ||
            cd.nomeEmpresa ||
            perfilData.empresa_nome ||
            "",
          nif: cd.nif || perfilData.nif_empresa || "",
          formaJuridica: cd.formaJuridica || "Sociedade por Quotas (Lda)",
          pessoaContacto:
            cd.pessoaContacto || perfilData.nome_completo || "",
          telefone: cd.telefone || perfilData.telefone || "",
          morada: cd.morada || "",
          codigoPostal: cd.codigoPostal || "",
          emailContacto: cd.emailContacto || perfilData.email || "",
          emailReservas:
            cd.emailReservas || cd.emailContacto || perfilData.email || "",
          responsavelRGPD:
            cd.responsavelRGPD ||
            cd.pessoaContacto ||
            perfilData.nome_completo ||
            "",
          modalidadeReserva:
            cd.modalidadeReserva ||
            perfilData.modalidade_reserva ||
            "direta",
          linkExternoReserva:
            cd.linkExternoReserva ||
            perfilData.link_externo_reserva ||
            "",
          tipoPagamento: cd.tipoPagamento || cd.tipo_pagamento || "100_total",
          politicaCancelamento:
            cd.politicaCancelamento ||
            cd.politica_cancelamento ||
            "Flexível (Reembolso a 100% até 7 dias antes)",
          acordosComplementares: cd.acordosComplementares || "",
          assinaturaNome:
            cd.assinaturaNome || perfilData.nome_completo || "",
          assinaturaCargo: cd.assinaturaCargo || "Representante Legal",
          concordaTermos: !!perfilData.contrato_dados,
        });
      }

      setLoading(false);
    };

    carregarContrato();
  }, []);

  const gerarPdfBlob = () => {
    const isPt = !isEn;
    const doc = new jsPDF({ format: "a4", unit: "mm" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const taxaComissao = perfil?.taxa_comissao ?? 12;
    const baseComissao = perfil?.base_comissao || "total";
    const timestamp =
      perfil?.contrato_dados?.dataSubmissao || new Date().toISOString();

    const blueBrand: [number, number, number] = [14, 58, 104];
    const goldBrand: [number, number, number] = [226, 164, 29];
    const greenBrand: [number, number, number] = [5, 150, 105];
    const slateDark: [number, number, number] = [30, 41, 59];

    doc.setFillColor(...blueBrand);
    doc.rect(0, 0, pageWidth, 38, "F");
    doc.setFillColor(...goldBrand);
    doc.rect(0, 38, pageWidth, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("Hello", pageWidth / 2 - 9, 15, { align: "right" });
    doc.setTextColor(...goldBrand);
    doc.text("Camp", pageWidth / 2 - 9, 15, { align: "left" });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(
      isPt
        ? "ACORDO GLOBAL DE INTERMEDIAÇÃO E SERVIÇOS"
        : "GLOBAL INTERMEDIATION AND SERVICES AGREEMENT",
      pageWidth / 2,
      24,
      { align: "center" }
    );

    let y = 48;
    doc.setTextColor(...blueBrand);
    doc.setFontSize(10);
    doc.text(
      isPt
        ? "1. IDENTIFICAÇÃO DO PARCEIRO ORGANIZADOR"
        : "1. PARTNER IDENTIFICATION",
      15,
      y
    );
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...slateDark);
    doc.text(`Empresa: ${form.empresaNome} (${form.formaJuridica})`, 15, y);
    doc.text(`NIF: ${form.nif} | Contacto: ${form.pessoaContacto} (${form.telefone})`, 15, y + 5);
    doc.text(`Morada: ${form.morada}, ${form.codigoPostal}`, 15, y + 10);
    doc.text(`E-mail Oficial: ${form.emailContacto} | RGPD: ${form.responsavelRGPD}`, 15, y + 15);

    y += 26;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...blueBrand);
    doc.text(
      isPt
        ? "2. CONDIÇÕES OPERACIONAIS E COMISSIONAMENTO"
        : "2. OPERATIONAL & COMMISSION TERMS",
      15,
      y
    );
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...slateDark);
    doc.text(`• Taxa de Comissão Acordada: ${taxaComissao}% (IVA incluído) | Base: ${baseComissao}`, 15, y);
    doc.text(`• Modalidade de Reserva: ${form.modalidadeReserva}`, 15, y + 5);
    if (form.modalidadeReserva === "link_externo") {
      doc.text(`• Link Externo: ${form.linkExternoReserva}`, 15, y + 10);
    } else {
      doc.text(
        `• Regra de Pagamento: ${form.tipoPagamento} | Política: ${form.politicaCancelamento}`,
        15,
        y + 10
      );
    }

    y += 22;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...greenBrand);
    doc.text(
      `Assinado digitalmente por: ${form.assinaturaNome} (${form.assinaturaCargo}) em ${new Date(
        timestamp
      ).toLocaleString("pt-PT")}`,
      15,
      y
    );

    return doc;
  };

  const handleDownloadPdf = () => {
    setDownloadingPdf(true);
    try {
      const doc = gerarPdfBlob();
      doc.save(
        `Contrato_Global_HelloCamp_${(form.empresaNome || "Parceiro").replace(
          /\s+/g,
          "_"
        )}.pdf`
      );
    } catch (e) {
      console.error(e);
    }
    setDownloadingPdf(false);
  };

  const handleGuardarEAssinar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.concordaTermos) {
      alert(
        isEn
          ? "Please accept the contractual terms."
          : "Por favor, confirme a aceitação dos termos contratuais."
      );
      return;
    }

    setSaving(true);
    try {
      const doc = gerarPdfBlob();
      const pdfBlob = doc.output("blob");
      const pdfFile = new File([pdfBlob], `contrato_${perfil.id}.pdf`, {
        type: "application/pdf",
      });

      const novoContratoDados = {
        ...perfil?.contrato_dados,
        ...form,
        taxaComissao: perfil?.taxa_comissao ?? 12,
        baseComissao: perfil?.base_comissao || "total",
        dataSubmissao: new Date().toISOString(),
      };

      const formData = new FormData();
      formData.append("id", perfil.id);
      formData.append("email", perfil.email);
      formData.append("lang", lang);
      formData.append("contratoDados", JSON.stringify(novoContratoDados));
      formData.append("pdf", pdfFile);

      const res = await fetch("/api/contratos/assinar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao guardar contrato.");

      setPerfil((prev: any) => ({
        ...prev,
        status_contrato: "Aprovado",
        contrato_dados: novoContratoDados,
        modalidade_reserva: form.modalidadeReserva,
      }));
      if (data.url) setPdfExistenteUrl(data.url);

      alert(
        isEn
          ? "Global Agreement updated and signed successfully!"
          : "Acordo Global atualizado e assinado com sucesso!"
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">
        {isEn ? "Loading Global Agreement..." : "A carregar o seu Acordo Global..."}
      </div>
    );
  }

  const jaAssinado =
    perfil?.status_contrato === "Aprovado" || !!perfil?.contrato_dados;

  return (
    <div className="max-w-5xl mx-auto font-sans pb-16">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span
            className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 ${
              jaAssinado
                ? "bg-emerald-50 text-[#167524] border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {jaAssinado
              ? isEn
                ? "✓ Active & Signed Agreement"
                : "✓ Contrato Global Ativo e Assinado"
              : isEn
              ? "⚠️ Signature Pending"
              : "⚠️ Assinatura Pendente"}
          </span>
          <h1 className="text-3xl font-black text-slate-900 m-0 tracking-tight">
            {isEn ? "Global Partnership Agreement" : "Contrato Global de Parceria B2B"}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1 mb-0">
            {isEn
              ? `This single agreement covers all ${totalCampos} program(s) associated with your organizer account.`
              : `Este acordo único abrange todos os ${totalCampos} programa(s) associados à sua conta de organizador.`}
          </p>
        </div>

        <div className="flex gap-3">
          {pdfExistenteUrl && (
            <a
              href={pdfExistenteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest text-xs px-5 py-3 rounded-xl no-underline shadow-sm transition-colors"
            >
              📥 {isEn ? "View Signed PDF" : "Abrir PDF Arquivado"}
            </a>
          )}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-black uppercase tracking-widest text-xs px-5 py-3 rounded-xl cursor-pointer shadow-sm transition-colors"
          >
            📄 {isEn ? "Generate PDF Copy" : "Descarregar Cópia PDF"}
          </button>
        </div>
      </div>

      {/* RESUMO DA TAXA ACORDADA */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#167524] block mb-1">
            {isEn ? "Agreed Commission Rate" : "Taxa de Comissão Acordada"}
          </span>
          <span className="text-3xl font-black text-[#167524]">
            {perfil?.taxa_comissao ?? 12}%
          </span>
          <span className="block text-xs text-slate-500 mt-1 font-medium">
            {isEn ? "VAT included (Success fee only)" : "IVA incluído (Apenas sobre vendas)"}
          </span>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            {isEn ? "Commission Base" : "Base de Incidência"}
          </span>
          <span className="text-base font-black text-slate-900 block mt-1">
            {perfil?.base_comissao === "apenas_programa"
              ? isEn
                ? "Base Program Only"
                : "Apenas Valor Base do Programa"
              : isEn
              ? "Total Booking Value"
              : "Sobre o Valor Total da Reserva"}
          </span>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            {isEn ? "Covered Programs" : "Programas Abrangidos"}
          </span>
          <span className="text-base font-black text-slate-900 block mt-1">
            {totalCampos} {isEn ? "Camps / Activities" : "Campos / Atividades"}
          </span>
          <Link
            href={`/${lang}/admin/campos`}
            className="text-xs font-bold text-[#167524] underline mt-1 inline-block"
          >
            {isEn ? "View my camps" : "Ver os meus campos"} &rarr;
          </Link>
        </div>
      </div>

      {/* FORMULÁRIO DE DADOS CONTRATUAIS E OPERACIONAIS */}
      <form
        onSubmit={handleGuardarEAssinar}
        className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8"
      >
        <div>
          <h2 className="text-lg font-black text-slate-900 m-0 mb-4 pb-3 border-b border-slate-100">
            1. {isEn ? "Legal & Billing Identification" : "Identificação Legal e Faturação"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Company / Legal Name *" : "Nome da Empresa / Entidade *"}
              </label>
              <input
                type="text"
                required
                value={form.empresaNome}
                onChange={(e) => setForm({ ...form, empresaNome: e.target.value })}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#167524]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Tax ID (NIF / VAT) *" : "NIF / NIPC *"}
              </label>
              <input
                type="text"
                required
                value={form.nif}
                onChange={(e) => setForm({ ...form, nif: e.target.value })}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#167524]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Contact Person *" : "Pessoa de Contacto *"}
              </label>
              <input
                type="text"
                required
                value={form.pessoaContacto}
                onChange={(e) =>
                  setForm({ ...form, pessoaContacto: e.target.value })
                }
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#167524]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Phone *" : "Telefone *"}
              </label>
              <input
                type="text"
                required
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#167524]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "Billing Address *" : "Morada Fiscal Completa *"}
              </label>
              <input
                type="text"
                required
                value={form.morada}
                onChange={(e) => setForm({ ...form, morada: e.target.value })}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#167524]"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-900 m-0 mb-4 pb-3 border-b border-slate-100">
            2. {isEn ? "Booking & Operational Model" : "Modelo de Reserva e Operação"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              {
                id: "direta",
                titulo: isEn ? "Direct Checkout" : "Reserva Direta (Stripe)",
                desc: isEn
                  ? "Automatic online payment & instant confirmation."
                  : "Pagamento automático online e gestão integrada.",
              },
              {
                id: "email",
                titulo: isEn ? "Upon Request (Email)" : "Reserva Sob Consulta",
                desc: isEn
                  ? "Receive booking requests by email."
                  : "Receba pedidos de reserva e confirme em 48h.",
              },
              {
                id: "link_externo",
                titulo: isEn ? "External Form Link" : "Link Externo Próprio",
                desc: isEn
                  ? "Redirect parents to your own form."
                  : "Redirecione os pais para o seu formulário.",
              },
            ].map((mod) => (
              <label
                key={mod.id}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-1 ${
                  form.modalidadeReserva === mod.id
                    ? "bg-emerald-50/70 border-[#167524] shadow-sm"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="modalidadeReserva"
                    value={mod.id}
                    checked={form.modalidadeReserva === mod.id}
                    onChange={(e) =>
                      setForm({ ...form, modalidadeReserva: e.target.value })
                    }
                    className="accent-[#167524]"
                  />
                  <span className="font-black text-sm text-slate-900">
                    {mod.titulo}
                  </span>
                </div>
                <span className="text-xs text-slate-500 pl-6">{mod.desc}</span>
              </label>
            ))}
          </div>

          {form.modalidadeReserva === "link_externo" ? (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                {isEn ? "External Booking URL *" : "URL do Formulário Externo *"}
              </label>
              <input
                type="url"
                required
                placeholder="https://..."
                value={form.linkExternoReserva}
                onChange={(e) =>
                  setForm({ ...form, linkExternoReserva: e.target.value })
                }
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#167524]"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                  {isEn ? "Payment Rule" : "Regra de Cobrança no Checkout"}
                </label>
                <select
                  value={form.tipoPagamento}
                  onChange={(e) =>
                    setForm({ ...form, tipoPagamento: e.target.value })
                  }
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#167524]"
                >
                  <option value="100_total">
                    {isEn ? "100% Paid on Booking" : "100% Pago no Ato da Reserva"}
                  </option>
                  <option value="50_sinal">
                    {isEn
                      ? "50% Deposit + 50% Later"
                      : "50% Sinal + 50% 1 Semana Antes"}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                  {isEn ? "Cancellation Policy" : "Política de Cancelamento Padrão"}
                </label>
                <select
                  value={form.politicaCancelamento}
                  onChange={(e) =>
                    setForm({ ...form, politicaCancelamento: e.target.value })
                  }
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#167524]"
                >
                  <option value="Flexível (Reembolso a 100% até 7 dias antes)">
                    {isEn
                      ? "Flexible (100% up to 7 days prior)"
                      : "Flexível (Reembolso a 100% até 7 dias antes)"}
                  </option>
                  <option value="Moderada (Reembolso a 50% até 15 dias antes)">
                    {isEn
                      ? "Moderate (50% up to 15 days prior)"
                      : "Moderada (Reembolso a 50% até 15 dias antes)"}
                  </option>
                  <option value="Estrita (Sem reembolso após reserva)">
                    {isEn
                      ? "Strict (No refund after booking)"
                      : "Estrita (Sem reembolso após reserva)"}
                  </option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ASSINATURA DIGITAL */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 m-0 mb-4">
            3. {isEn ? "Digital Signature" : "Assinatura Digital do Representante"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                {isEn ? "Signatory Full Name *" : "Nome do Signatário *"}
              </label>
              <input
                type="text"
                required
                value={form.assinaturaNome}
                onChange={(e) =>
                  setForm({ ...form, assinaturaNome: e.target.value })
                }
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-serif italic font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                {isEn ? "Legal Role *" : "Cargo Legal *"}
              </label>
              <input
                type="text"
                required
                value={form.assinaturaCargo}
                onChange={(e) =>
                  setForm({ ...form, assinaturaCargo: e.target.value })
                }
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer mt-4">
            <input
              type="checkbox"
              required
              checked={form.concordaTermos}
              onChange={(e) =>
                setForm({ ...form, concordaTermos: e.target.checked })
              }
              className="mt-1 w-4 h-4 accent-[#167524]"
            />
            <span className="text-xs text-slate-600 font-medium leading-relaxed">
              {isEn
                ? "I confirm that I have read and accept the Global Partnership Agreement terms and have legal authority to bind the organization."
                : "Declaro que li e aceito os termos do Contrato Global de Intermediação HelloCamp e confirmo possuir poderes legais para vincular a entidade."}
            </span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#167524] hover:bg-[#115a1b] disabled:bg-slate-400 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl cursor-pointer shadow-md transition-all"
          >
            {saving
              ? isEn
                ? "Saving & Propagating..."
                : "A guardar e atualizar campos..."
              : isEn
              ? "Save & Sign Global Agreement"
              : "Guardar e Assinar Acordo Global"}
          </button>
        </div>
      </form>
    </div>
  );
}
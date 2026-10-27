"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import Link from "next/link";

export default function AssinaturaContratoPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = use(params);
  const router = useRouter();

  const [contractLang, setContractLang] = useState<"pt" | "en">(
    lang === "en" ? "en" : "pt"
  );
  const isPt = contractLang === "pt";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [jaAssinado, setJaAssinado] = useState(false);
  const [pdfGeradoUrl, setPdfGeradoUrl] = useState<string | null>(null);

  // Gatekeeper de Segurança por E-mail
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [authError, setAuthError] = useState("");

  // Dados do Contrato e Password escolhida pelo Parceiro
  const [empresaNome, setEmpresaNome] = useState("");
  const [nif, setNif] = useState("");
  const [formaJuridica, setFormaJuridica] = useState(
    "Sociedade por Quotas (Lda)"
  );
  const [pessoaContacto, setPessoaContacto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [morada, setMorada] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [responsavelRGPD, setResponsavelRGPD] = useState("");

  const [taxaComissao, setTaxaComissao] = useState(12);
  const [baseComissao, setBaseComissao] = useState("total");
  const [modalidadeReserva, setModalidadeReserva] = useState("direta");
  const [linkExternoReserva, setLinkExternoReserva] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState("100_total");
  const [politicaCancelamento, setPoliticaCancelamento] = useState(
    "Flexível (Reembolso a 100% até 7 dias antes)"
  );
  const [acordosComplementares, setAcordosComplementares] = useState("");

  const [assinaturaNome, setAssinaturaNome] = useState("");
  const [assinaturaCargo, setAssinaturaCargo] = useState("Representante Legal");
  const [concordaTermos, setConcordaTermos] = useState(false);
  const [novaPassword, setNovaPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const fetchParceiro = async () => {
      const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setPerfil(data);
      const cd = data.contrato_dados || {};
      setEmpresaNome(cd.empresaNome || data.empresa_nome || "");
      setNif(cd.nif || data.nif_empresa || "");
      setFormaJuridica(cd.formaJuridica || "Sociedade por Quotas (Lda)");
      setPessoaContacto(cd.pessoaContacto || data.nome_completo || "");
      setTelefone(cd.telefone || data.telefone || "");
      setEmailContacto(cd.emailContacto || data.email || "");
      setMorada(cd.morada || "");
      setCodigoPostal(cd.codigoPostal || "");
      setResponsavelRGPD(
        cd.responsavelRGPD || cd.pessoaContacto || data.nome_completo || ""
      );

      setTaxaComissao(
        data.taxa_comissao !== null && data.taxa_comissao !== undefined
          ? Number(data.taxa_comissao)
          : Number(cd.taxaComissao || 12)
      );
      setBaseComissao(data.base_comissao || cd.baseComissao || "total");
      setModalidadeReserva(
        data.modalidade_reserva || cd.modalidadeReserva || "direta"
      );
      setLinkExternoReserva(
        data.link_externo_reserva || cd.linkExternoReserva || ""
      );
      setTipoPagamento(cd.tipoPagamento || "100_total");
      setPoliticaCancelamento(
        cd.politicaCancelamento ||
          "Flexível (Reembolso a 100% até 7 dias antes)"
      );
      setAcordosComplementares(cd.acordosComplementares || "");
      setAssinaturaNome(cd.assinaturaNome || data.nome_completo || "");
      setAssinaturaCargo(cd.assinaturaCargo || "Representante Legal");

      setLoading(false);
    };

    fetchParceiro();
  }, [id]);

  const handleSecurityCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToVerify = inputEmail.trim().toLowerCase();
    const emailBd = perfil?.email?.trim().toLowerCase();
    const emailContactoBd = perfil?.contrato_dados?.emailContacto
      ?.trim()
      .toLowerCase();

    if (emailToVerify === emailBd || emailToVerify === emailContactoBd) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError(
        isPt
          ? "O e-mail introduzido não corresponde ao registo oficial deste convite."
          : "The entered email does not match the official record for this partner."
      );
    }
  };

  const gerarEGuardarPDF = async (
    userIP: string,
    timestamp: string
  ): Promise<Blob> => {
    const doc = new jsPDF({ format: "a4", unit: "mm" });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(14, 58, 104);
    doc.rect(0, 0, pageWidth, 35, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("HelloCamp - Acordo Global B2B", pageWidth / 2, 18, {
      align: "center",
    });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(`Parceiro: ${empresaNome} (NIF: ${nif})`, 15, 48);
    doc.text(
      `Representante: ${pessoaContacto} | E-mail: ${emailContacto} | Tel: ${telefone}`,
      15,
      55
    );
    doc.text(`Morada: ${morada}, ${codigoPostal}`, 15, 62);
    doc.text(
      `Comissão Acordada: ${taxaComissao}% (IVA incl.) | Base: ${baseComissao} | Modalidade: ${modalidadeReserva}`,
      15,
      72
    );
    doc.text(
      `Assinado Digitalmente por: ${assinaturaNome} (${assinaturaCargo})`,
      15,
      86
    );
    doc.text(
      `Data/Hora: ${new Date(timestamp).toLocaleString("pt-PT")} | IP: ${userIP}`,
      15,
      93
    );

    return doc.output("blob");
  };

  const handleSubmitAssinatura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaPassword.length < 6) {
      alert(
        isPt
          ? "Defina uma password com pelo menos 6 caracteres para aceder ao seu painel."
          : "Please set a password with at least 6 characters."
      );
      return;
    }
    if (novaPassword !== confirmPassword) {
      alert(
        isPt ? "As passwords não coincidem." : "Passwords do not match."
      );
      return;
    }
    if (modalidadeReserva === "link_externo" && !linkExternoReserva.trim()) {
      alert(
        isPt
          ? "Por favor preencha o Link Externo Oficial."
          : "Please fill in the Official External Link."
      );
      return;
    }

    setSubmitting(true);

    let userIP = "Registado";
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (res.ok) {
        const ipData = await res.json();
        userIP = ipData.ip;
      }
    } catch {}

    const timestampAtual = new Date().toISOString();
    const dataPropostaOriginal =
      perfil?.created_at ||
      perfil?.contrato_dados?.dataEnvio ||
      timestampAtual;

    const contratoFinal = {
      empresaNome,
      nif,
      pessoaContacto,
      emailContacto,
      telefone,
      formaJuridica,
      morada,
      codigoPostal,
      responsavelRGPD,
      taxaComissao,
      modalidadeReserva,
      tipoPagamento,
      politicaCancelamento,
      linkExternoReserva,
      baseComissao,
      acordosComplementares,
      assinaturaNome,
      assinaturaCargo,
      dataEnvio: dataPropostaOriginal,
      dataSubmissao: timestampAtual,
      ipAssinatura: userIP,
    };

    try {
      const pdfBlob = await gerarEGuardarPDF(userIP, timestampAtual);
      const pdfFile = new File([pdfBlob], `contrato.pdf`, {
        type: "application/pdf",
      });

      const formData = new FormData();
      formData.append("id", id);
      formData.append("email", inputEmail.trim());
      formData.append("lang", contractLang);
      formData.append("contratoDados", JSON.stringify(contratoFinal));
      formData.append("password", novaPassword);
      formData.append("pdf", pdfFile);

      const response = await fetch("/api/contratos/assinar", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || "Ocorreu um erro ao processar a assinatura."
        );
      }

      if (result.loginReady) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: inputEmail.trim(),
          password: novaPassword,
        });

        if (!signInError) {
          router.push(`/${lang}/admin/dashboard`);
          return;
        }
      }

      setJaAssinado(true);
      setPdfGeradoUrl(result.url);
    } catch (err: any) {
      alert("Erro: " + err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xs uppercase tracking-widest">
        A carregar Acordo Operacional...
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-2">
          Documento Não Encontrado
        </h1>
        <Link
          href={`/${lang}/login`}
          className="bg-[#0E3A68] text-white font-black uppercase text-xs px-6 py-3 rounded-md no-underline"
        >
          Ir para Login
        </Link>
      </div>
    );
  }

  // ECRÃ 1: GATEKEEPER DE VERIFICAÇÃO DE E-MAIL
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white max-w-md w-full p-8 border border-slate-300 rounded-md shadow-lg">
          <div className="text-center mb-6">
            <div className="text-2xl font-black tracking-tight mb-2">
              <span className="text-[#0E3A68]">Hello</span>
              <span className="text-[#e2a41d]">Camp</span>
            </div>
            <span className="inline-block bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">
              Documento Confidencial B2B
            </span>
            <h1 className="text-xl font-black text-slate-900 mt-4 mb-1">
              {perfil.empresa_nome || "Parceiro Organizador"}
            </h1>
            <p className="text-xs text-slate-500">
              Por motivos de segurança, introduza o seu e-mail profissional para
              desbloquear o seu Acordo Global e definir a sua password.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-md">
              {authError}
            </div>
          )}

          <form onSubmit={handleSecurityCheck} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                E-mail Oficial do Parceiro *
              </label>
              <input
                type="email"
                required
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="nome@empresa.pt"
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-md text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest text-xs rounded-md cursor-pointer"
            >
              Desbloquear Acordo & Definir Acesso
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (jaAssinado) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white max-w-lg w-full p-8 border border-slate-300 rounded-md shadow-lg text-center">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-[#167524] rounded-md flex items-center justify-center text-2xl mx-auto mb-4 font-black">
            ✓
          </div>
          <h1 className="text-2xl font-black text-slate-900 m-0 mb-2">
            Contrato Assinado e Conta Ativa!
          </h1>
          <p className="text-xs text-slate-600 mb-6">
            O seu acordo operacional foi formalizado e os seus campos estão
            ativos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {pdfGeradoUrl && (
              <a
                href={pdfGeradoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-slate-100 border border-slate-300 text-slate-800 font-black uppercase text-xs rounded-md no-underline"
              >
                📥 Descarregar PDF
              </a>
            )}
            <Link
              href={`/${lang}/login`}
              className="px-6 py-3 bg-[#167524] text-white font-black uppercase text-xs rounded-md no-underline"
            >
              Entrar no Portal do Parceiro &rarr;
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const inputClass =
    "w-full p-3 bg-white border border-slate-300 rounded-md text-sm font-bold text-slate-900 outline-none focus:border-[#167524]";

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 rounded-md shadow-lg p-6 md:p-12">
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <div className="text-2xl font-black tracking-tight">
              <span className="text-[#0E3A68]">Hello</span>
              <span className="text-[#e2a41d]">Camp</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 m-0 mt-1">
              Acordo Global de Parceria & Ativação de Conta
            </h1>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => setContractLang("pt")}
              className={`px-3 py-1.5 rounded-sm text-xs font-black cursor-pointer ${
                contractLang === "pt"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              PT
            </button>
            <button
              type="button"
              onClick={() => setContractLang("en")}
              className={`px-3 py-1.5 rounded-sm text-xs font-black cursor-pointer ${
                contractLang === "en"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmitAssinatura} className="space-y-8">
          {/* 1. DADOS FISCAIS */}
          <div className="bg-slate-50 p-6 rounded-md border border-slate-200 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 m-0">
              1. Identificação da Entidade Parceira
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Empresa / Entidade *
                </label>
                <input
                  required
                  value={empresaNome}
                  onChange={(e) => setEmpresaNome(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  NIF / Tax ID *
                </label>
                <input
                  required
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Pessoa de Contacto *
                </label>
                <input
                  required
                  value={pessoaContacto}
                  onChange={(e) => setPessoaContacto(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Telefone *
                </label>
                <input
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Morada Fiscal *
                </label>
                <input
                  required
                  value={morada}
                  onChange={(e) => setMorada(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Código Postal e Localidade *
                </label>
                <input
                  required
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* 2. CONDIÇÕES COMERCIAIS E MODELO */}
          <div className="bg-emerald-50/60 p-6 rounded-md border border-emerald-200 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#167524] m-0">
              2. Condições Operacionais Acordadas ({taxaComissao}% IVA incl.)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "direta", label: "Reserva Direta (Stripe)" },
                { id: "email", label: "Sob Consulta (E-mail)" },
                { id: "link_externo", label: "Link Externo Próprio" },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`p-3.5 rounded-md border cursor-pointer flex items-center gap-2 text-xs font-black ${
                    modalidadeReserva === m.id
                      ? "bg-white border-[#167524] text-[#167524]"
                      : "bg-white/60 border-slate-200 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="mod"
                    value={m.id}
                    checked={modalidadeReserva === m.id}
                    onChange={(e) => setModalidadeReserva(e.target.value)}
                    className="accent-[#167524]"
                  />
                  {m.label}
                </label>
              ))}
            </div>
            {modalidadeReserva === "link_externo" && (
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  URL do Formulário Externo *
                </label>
                <input
                  type="url"
                  required
                  value={linkExternoReserva}
                  onChange={(e) => setLinkExternoReserva(e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {/* 3. DEFINIR PASSWORD DE ACESSO AO PORTAL */}
          <div className="bg-blue-50/60 p-6 rounded-md border border-blue-200 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#0E3A68] m-0">
              3. Defina a sua Password de Acesso ao Portal B2B
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Nova Palavra-Passe (Mín. 6 caracteres) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={novaPassword}
                  onChange={(e) => setNovaPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Confirmar Palavra-Passe *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* 4. ASSINATURA DIGITAL */}
          <div className="bg-slate-50 p-6 rounded-md border border-slate-200 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 m-0">
              4. Assinatura Digital do Representante Legal
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Nome Completo do Signatário *
                </label>
                <input
                  required
                  value={assinaturaNome}
                  onChange={(e) => setAssinaturaNome(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Cargo Legal *
                </label>
                <input
                  required
                  value={assinaturaCargo}
                  onChange={(e) => setAssinaturaCargo(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                required
                checked={concordaTermos}
                onChange={(e) => setConcordaTermos(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#167524]"
              />
              <span className="text-xs font-bold text-slate-700 leading-relaxed">
                Declaro que li e aceito os Termos e Cláusulas do Acordo Global
                HelloCamp e confirmo possuir poderes legais para vincular a
                entidade supra identificada.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs rounded-md shadow-md cursor-pointer"
          >
            {submitting
              ? "A Assinar e Ativar Conta..."
              : "✓ Assinar Contrato & Entrar no Painel B2B"}
          </button>
        </form>
      </div>
    </main>
  );
}
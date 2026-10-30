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
  const [camposParceiro, setCamposParceiro] = useState<any[]>([]);
  const [jaAssinado, setJaAssinado] = useState(false);
  const [pdfGeradoUrl, setPdfGeradoUrl] = useState<string | null>(null);

  // Estados do Formulário Contratual Completo
  const [empresaNome, setEmpresaNome] = useState("");
  const [nif, setNif] = useState("");
  const [formaJuridica, setFormaJuridica] = useState("");
  const [morada, setMorada] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [pessoaContacto, setPessoaContacto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [emailReservas, setEmailReservas] = useState("");
  const [website, setWebsite] = useState("");
  const [responsavelRGPD, setResponsavelRGPD] = useState("");

  // Condições Comerciais e Anexos Operacionais
  const [taxaComissao, setTaxaComissao] = useState<number>(12);
  const [baseComissao, setBaseComissao] = useState<string>("total");
  const [modalidadeReserva, setModalidadeReserva] = useState<string>("direta");
  const [linkExternoReserva, setLinkExternoReserva] = useState<string>("");
  const [tipoPagamento, setTipoPagamento] = useState<string>("100_total");
  const [politicaCancelamento, setPoliticaCancelamento] = useState<string>(
    "Moderada (Reembolso a 50% até 15 dias antes)"
  );
  const [acordosComplementares, setAcordosComplementares] =
    useState<string>("");

  // Password e Assinatura Digital
  const [novaPassword, setNovaPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [assinaturaNome, setAssinaturaNome] = useState("");
  const [assinaturaCargo, setAssinaturaCargo] = useState("");
  const [concordaTermos, setConcordaTermos] = useState(false);

  // Dropdown customizado para Base de Comissão
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const carregarDadosContrato = async () => {
      setLoading(true);
      const [{ data: perfilData }, { data: camposData }] = await Promise.all([
        supabase.from("perfis").select("*").eq("id", id).single(),
        supabase
          .from("campos")
          .select("id, nome, nome_en, categoria, local, preco, taxa_comissao, base_comissao, contrato_parceiro_url")
          .eq("organizador_id", id)
          .order("created_at", { ascending: true }),
      ]);

      if (perfilData) {
        setPerfil(perfilData);
        const d = perfilData.contrato_dados || {};

        const emp =
          d.empresaNome ||
          perfilData.empresa_nome ||
          perfilData.nome_empresa ||
          perfilData.nome ||
          "";
        const resp = d.pessoaContacto || perfilData.nome_completo || "";
        const mail = d.emailContacto || perfilData.email || "";

        setEmpresaNome(emp);
        setNif(d.nif || (perfilData.nif_empresa ? String(perfilData.nif_empresa) : ""));
        setFormaJuridica(d.formaJuridica || "Sociedade por Quotas (Lda)");
        setMorada(d.morada || perfilData.morada_sede || "");
        setCodigoPostal(d.codigoPostal || "");
        setPessoaContacto(resp);
        setTelefone(d.telefone || perfilData.telefone || "");
        setEmailContacto(mail);
        setEmailReservas(d.emailReservas || perfilData.email_publico || mail);
        setWebsite(d.website || perfilData.website || "");
        setResponsavelRGPD(d.responsavelRGPD || resp);

        setTaxaComissao(
          perfilData.taxa_comissao !== null &&
            perfilData.taxa_comissao !== undefined
            ? Number(perfilData.taxa_comissao)
            : Number(d.taxaComissao) || 12
        );
        setBaseComissao(
          perfilData.base_comissao || d.baseComissao || "total"
        );
        setModalidadeReserva(
          d.modalidadeReserva || perfilData.modalidade_reserva || "direta"
        );
        setLinkExternoReserva(
          d.linkExternoReserva || perfilData.link_externo_reserva || ""
        );
        setTipoPagamento(d.tipoPagamento || "100_total");
        setPoliticaCancelamento(
          d.politicaCancelamento ||
            "Moderada (Reembolso a 50% até 15 dias antes)"
        );
        setAcordosComplementares(d.acordosComplementares || "");

        if (
          perfilData.status_contrato === "Aprovado" &&
          d.assinaturaNome
        ) {
          setJaAssinado(true);
          setAssinaturaNome(d.assinaturaNome);
          setAssinaturaCargo(d.assinaturaCargo || "");
        }
      }

      if (camposData) {
        setCamposParceiro(camposData);
        const comPdf = camposData.find((c: any) => c.contrato_parceiro_url);
        if (comPdf?.contrato_parceiro_url) {
          setPdfGeradoUrl(comPdf.contrato_parceiro_url);
        }
      }

      setLoading(false);
    };

    carregarDadosContrato();
  }, [id]);

  // Gerador de PDF Completo com Todas as Cláusulas e Anexos
  const gerarPdfContratoCompleto = (
    dadosFinais: any,
    ipCapturado: string,
    dataIso: string
  ): Blob => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 16;
    const maxW = pageW - margin * 2;
    let y = 20;

    const checkPageBreak = (needed = 18) => {
      if (y + needed > pageH - 18) {
        doc.addPage();
        y = 20;
      }
    };

    const writeTitle = (text: string) => {
      checkPageBreak(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(text, margin, y);
      y += 6;
    };

    const writeParagraph = (text: string, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(9.2);
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(text, maxW);
      lines.forEach((line: string) => {
        checkPageBreak(6);
        doc.text(line, margin, y);
        y += 4.6;
      });
      y += 2;
    };

    // Cabeçalho Oficial
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 34, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("HelloCamp Portugal", margin, 15);
    doc.setFontSize(11);
    doc.setTextColor(245, 158, 11);
    doc.text(
      "CONTRATO GLOBAL DE PARCERIA, DIVULGACAO E INTERMEDIACAO DE RESERVAS",
      margin,
      24
    );

    y = 44;

    writeTitle("1. IDENTIFICACAO DAS PARTES CONTRATANTES");
    writeParagraph(
      "PRIMEIRA OUTORGANTE (PLATAFORMA): HelloCamp Portugal (www.hellocamp.pt | info@hellocamp.pt), plataforma digital de divulgacao e intermediacao de campos de ferias, cursos e programas educativos/desportivos, com foro na Comarca de Lisboa, Portugal."
    );
    writeParagraph(
      `SEGUNDA OUTORGANTE (PARCEIRO ORGANIZADOR): ${dadosFinais.empresaNome} (${dadosFinais.formaJuridica}), NIF / Tax ID: ${dadosFinais.nif}, com sede fiscal em ${dadosFinais.morada}, ${dadosFinais.codigoPostal}, neste ato representada por ${dadosFinais.pessoaContacto} (Tel: ${dadosFinais.telefone} | E-mail Comercial: ${dadosFinais.emailContacto} | E-mail Reservas: ${dadosFinais.emailReservas} | Responsavel RGPD: ${dadosFinais.responsavelRGPD}).`
    );

    writeTitle("2. PROGRAMAS ABRANGIDOS PELO ACORDO GLOBAL");
    const nomesProgramas =
      camposParceiro.length > 0
        ? camposParceiro.map((c, idx) => `${idx + 1}. ${c.nome}`).join(" | ")
        : "Todos os programas presentes e futuros registados pelo Parceiro na plataforma HelloCamp.";
    writeParagraph(
      `O presente contrato abrange todas as atividades organizadas pela Segunda Outorgante (${camposParceiro.length} programas atualmente configurados): ${nomesProgramas}`
    );

    writeTitle("3. CLAUSULAS CONTRATUAIS GERAIS");
    writeParagraph(
      `Artigo 1.º (Comissao e Incidencia): O Parceiro compromete-se a pagar a HelloCamp uma comissao de ${dadosFinais.taxaComissao}% (IVA incluido) sobre cada reserva efetuada atraves da plataforma (Base de incidencia: ${dadosFinais.baseComissao}). A comissao incide sobre o valor efetivamente pago pelo cliente relativamente a atividade reservada. Caso uma reserva nao possa ser realizada por indisponibilidade devidamente justificada, o Parceiro devera informar a HelloCamp de imediato.`
    );
    writeParagraph(
      "Artigo 2.º (Condicoes de Pagamento e Faturacao): As comissoes devidas a HelloCamp serao faturadas ou deduzidas automaticamente de acordo com o modelo de pagamento acordado no Anexo 1 e Anexo 2. O Parceiro compromete-se a liquidar eventuais faturas emitidas pela HelloCamp dentro dos prazos nelas indicados."
    );
    writeParagraph(
      "Artigo 3.º (Obrigacoes do Parceiro e Paridade de Precos): O Parceiro compromete-se a fornecer informacoes verdadeiras e atualizadas sobre as suas atividades e garante possuir todos os direitos de autor e imagem sobre fotografias, logotipos e textos disponibilizados. Os precos divulgados na HelloCamp nao poderao ser superiores aos precos praticados diretamente pelo Parceiro para a mesma atividade."
    );
    writeParagraph(
      "Artigo 4.º (Duracao e Renovacao): O presente contrato produz efeitos a partir da data da sua assinatura digital e mantem-se valido ate ao final do ano civil em curso, sendo automaticamente renovado por periodos sucessivos de um ano, salvo denuncia por qualquer das partes."
    );
    writeParagraph(
      "Artigo 5.º (Limitacao de Responsabilidade e Seguros Obrigatorios): A HelloCamp atua exclusivamente como plataforma intermediaria tecnologica, nao assumindo responsabilidade civil, criminal ou contratual pela execucao das atividades. O Parceiro e o unico e exclusivo responsavel pela seguranca dos participantes, garantindo possuir todos os seguros obrigatorios por lei (Acidentes Pessoais e Responsabilidade Civil), licencas e certificacoes exigidas."
    );
    writeParagraph(
      "Artigo 6.º (Protecao de Dados Pessoais - RGPD e Faturacao ao Cliente): O Parceiro assume a qualidade de Responsavel pelo Tratamento dos dados pessoais, clinicos e alimentares dos participantes transmitidos pela HelloCamp ao abrigo do Regulamento (UE) 2016/679 (RGPD), utilizando-os exclusivamente para a execucao do campo de ferias. O Parceiro e igualmente responsavel pela emissao do recibo/fatura final ao cliente nos termos fiscais aplicaveis."
    );
    writeParagraph(
      "Artigo 7.º (Lei Aplicavel, Foro e Convencao de Prova Digital): O presente acordo rege-se pela Lei Portuguesa, sendo competente o foro da Comarca de Lisboa. As partes reconhecem expressamente a forca vinculativa da assinatura eletronica aposta neste documento, convencionando que o registo informatico de Endereco IP e Timestamp constitui prova plena, renunciando o Parceiro a invocar a nulidade por ausencia de assinatura autografa."
    );

    writeTitle("4. ANEXOS OPERACIONAIS SELECIONADOS");
    writeParagraph(
      `ANEXO 1 (Procedimento de Reserva): Modalidade "${dadosFinais.modalidadeReserva}"${
        dadosFinais.modalidadeReserva === "link_externo"
          ? ` (URL Externo: ${dadosFinais.linkExternoReserva})`
          : ""
      }.`
    );
    writeParagraph(
      `ANEXO 2 (Fluxo de Pagamento Stripe): "${
        dadosFinais.tipoPagamento === "50_sinal"
          ? "Sinal de 50% no ato da reserva + 50% restantes antes do inicio"
          : "100% pago no ato da reserva"
      }".`
    );
    writeParagraph(
      `ANEXO 3 (Politica de Cancelamento e Reembolsos): "${dadosFinais.politicaCancelamento}". A comissao da HelloCamp ajusta-se proporcionalmente ao montante retido pelo Parceiro.`
    );
    if (dadosFinais.acordosComplementares) {
      writeParagraph(
        `ANEXO 4 (Acordos Extraordinarios / Excecoes): ${dadosFinais.acordosComplementares}`
      );
    }

    writeTitle("5. ASSINATURAS DIGITAIS VINCULATIVAS");
    writeParagraph(
      `PELA PRIMEIRA OUTORGANTE (HELLOCAMP PORTUGAL): Administracao HelloCamp Portugal | Validado Digitalmente em ${new Date(
        dataIso
      ).toLocaleDateString("pt-PT")}.`,
      true
    );
    writeParagraph(
      `PELA SEGUNDA OUTORGANTE (PARCEIRO): Assinado digitalmente por "${
        dadosFinais.assinaturaNome
      }" na qualidade de "${
        dadosFinais.assinaturaCargo
      }" em ${new Date(dataIso).toLocaleString(
        "pt-PT"
      )} | Endereco IP Registado: ${ipCapturado}.`,
      true
    );

    return doc.output("blob");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concordaTermos)
      return alert(
        isPt
          ? "Por favor, confirme que leu e aceita todas as cláusulas e anexos do contrato."
          : "Please confirm that you have read and accept all contract clauses and annexes."
      );
    if (!assinaturaNome.trim() || !assinaturaCargo.trim())
      return alert(
        isPt
          ? "Por favor, preencha o seu Nome Completo e Cargo na secção de Assinatura Digital."
          : "Please enter your Full Name and Legal Role in the Digital Signature section."
      );
    if (!empresaNome.trim() || !nif.trim() || !morada.trim())
      return alert(
        isPt
          ? "Por favor, complete os dados fiscais obrigatórios (Nome da Entidade, NIF e Morada)."
          : "Please complete the mandatory billing details (Entity Name, Tax ID, and Address)."
      );
    if (novaPassword.length < 6)
      return alert(
        isPt
          ? "A sua nova palavra-passe deve ter pelo menos 6 caracteres."
          : "Your new password must be at least 6 characters long."
      );
    if (novaPassword !== confirmPassword)
      return alert(
        isPt
          ? "As palavras-passe introduzidas não coincidem."
          : "The passwords entered do not match."
      );

    setSubmitting(true);

    try {
      // 1. Capturar IP para prova jurídica (Artigo 7.º)
      let userIP = "Registado no Servidor";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        if (ipRes.ok) {
          const ipJson = await ipRes.json();
          userIP = ipJson.ip || userIP;
        }
      } catch {
        // Fallback silencioso
      }

      const dataIso = new Date().toISOString();

      const contratoDadosPayload = {
        empresaNome: empresaNome.trim(),
        nif: nif.trim(),
        formaJuridica: formaJuridica.trim(),
        morada: morada.trim(),
        codigoPostal: codigoPostal.trim(),
        pessoaContacto: pessoaContacto.trim(),
        telefone: telefone.trim(),
        emailContacto: emailContacto.trim().toLowerCase(),
        emailReservas: (emailReservas || emailContacto).trim().toLowerCase(),
        website: website.trim(),
        responsavelRGPD: (responsavelRGPD || pessoaContacto).trim(),
        taxaComissao,
        baseComissao,
        modalidadeReserva,
        linkExternoReserva:
          modalidadeReserva === "link_externo" ? linkExternoReserva.trim() : "",
        tipoPagamento,
        politicaCancelamento,
        acordosComplementares: acordosComplementares.trim(),
        assinaturaNome: assinaturaNome.trim(),
        assinaturaCargo: assinaturaCargo.trim(),
        dataEnvio:
          perfil?.contrato_dados?.dataEnvio ||
          perfil?.created_at ||
          dataIso,
        dataSubmissao: dataIso,
        ipAssinatura: userIP,
      };

      // 2. Gerar PDF Oficial
      const pdfBlob = gerarPdfContratoCompleto(
        contratoDadosPayload,
        userIP,
        dataIso
      );
      const pdfFile = new File(
        [pdfBlob],
        `contrato_global_${id}_${Date.now()}.pdf`,
        { type: "application/pdf" }
      );

      // 3. Enviar para a API oficial /api/contratos/assinar
      const formData = new FormData();
      formData.append("id", id);
      formData.append("emailAcesso", emailContacto.trim().toLowerCase());
      formData.append("passwordNova", novaPassword);
      formData.append("contratoDados", JSON.stringify(contratoDadosPayload));
      formData.append("lang", contractLang);
      formData.append("pdf", pdfFile);

      const res = await fetch("/api/contratos/assinar", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(
          resData.error || "Erro ao processar a assinatura do contrato."
        );
      }

      if (resData.url) {
        setPdfGeradoUrl(resData.url);
      }

      // 4. Login automático no Supabase Auth com a nova password definida pelo parceiro
      await supabase.auth.signInWithPassword({
        email: emailContacto.trim().toLowerCase(),
        password: novaPassword,
      });

      setJaAssinado(true);
      alert(
        isPt
          ? "🎉 Contrato Global assinado com sucesso! Os seus programas estão agora ativos e a sua palavra-passe foi configurada."
          : "🎉 Global Agreement signed successfully! Your programs are now active and your password has been set."
      );
      router.push(`/${lang}/admin/dashboard`);
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass =
    "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5";
  const inputClass =
    "w-full py-3 px-4 bg-white border border-slate-300 rounded-md text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] transition-colors";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8 font-sans">
        <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm text-center">
          <div className="text-3xl mb-3 animate-bounce">📄</div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 m-0">
            {isPt
              ? "A carregar Contrato Global de Parceria e Programas..."
              : "Loading Global Partnership Agreement & Programs..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] py-10 px-4 font-sans text-[#0F172A]">
      <div className="max-w-5xl mx-auto bg-white rounded-md shadow-xl border border-slate-200 overflow-hidden">
        {/* CABEÇALHO EXECUTIVO COM SELETOR DE IDIOMA */}
        <div className="bg-[#0F172A] p-8 md:p-12 text-center relative border-b-4 border-[#F59E0B]">
          <div className="flex justify-between items-center mb-6">
            <Link
              href={`/${lang}/parceiro/${id}?preview=admin`}
              target="_blank"
              className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-md no-underline transition-colors"
            >
              👁️ {isPt ? "Ver Montra Pública" : "Preview Public Profile"} ↗
            </Link>

            <div className="flex bg-slate-800 p-1 rounded-md border border-slate-700">
              <button
                type="button"
                onClick={() => setContractLang("pt")}
                className={`px-3 py-1.5 text-xs font-black rounded-md cursor-pointer border-0 transition-colors ${
                  isPt
                    ? "bg-[#F59E0B] text-white"
                    : "bg-transparent text-slate-300 hover:text-white"
                }`}
              >
                🇵🇹 PT
              </button>
              <button
                type="button"
                onClick={() => setContractLang("en")}
                className={`px-3 py-1.5 text-xs font-black rounded-md cursor-pointer border-0 transition-colors ${
                  !isPt
                    ? "bg-[#F59E0B] text-white"
                    : "bg-transparent text-slate-300 hover:text-white"
                }`}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>

          <div className="text-3xl md:text-4xl font-black tracking-tight mb-4 flex justify-center items-center">
            <span className="text-white">Hello</span>
            <span className="text-[#F59E0B]">Camp</span>
          </div>

          <h1 className="text-xl md:text-3xl font-black text-white uppercase tracking-wide m-0">
            {isPt
              ? "Contrato Global de Parceria, Divulgação e Intermediação"
              : "Global Partnership, Promotion and Intermediation Agreement"}
          </h1>
          <p className="text-slate-300 text-xs md:text-sm font-bold mt-3 max-w-2xl mx-auto mb-0">
            {isPt
              ? "Documento contratual completo aplicável a toda a operação e programas da sua entidade na plataforma HelloCamp."
              : "Complete legal agreement governing all programs and operations of your organization on the HelloCamp platform."}
          </p>
        </div>

        {jaAssinado ? (
          <div className="p-10 md:p-16 text-center">
            <div className="w-20 h-20 bg-[#16A34A] text-white rounded-md flex items-center justify-center text-4xl mx-auto mb-6 shadow-md">
              ✓
            </div>
            <h2 className="text-2xl font-black text-[#0F172A] mb-2">
              {isPt
                ? "Contrato Global Assinado e Ativo!"
                : "Global Contract Signed and Active!"}
            </h2>
            <p className="text-slate-600 text-sm md:text-base max-w-xl mx-auto mb-8">
              {isPt
                ? `O acordo da entidade ${empresaNome} já se encontra assinado digitalmente por ${assinaturaNome} (${assinaturaCargo}) e todos os seus ${camposParceiro.length} programas estão ativos.`
                : `The agreement for ${empresaNome} is digitally signed by ${assinaturaNome} (${assinaturaCargo}) and all ${camposParceiro.length} programs are active.`}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {pdfGeradoUrl && (
                <a
                  href={pdfGeradoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-black px-6 py-4 rounded-md text-xs uppercase tracking-widest no-underline shadow-sm"
                >
                  📥 {isPt ? "Descarregar Contrato PDF" : "Download Signed PDF"}
                </a>
              )}
              <Link
                href={`/${lang}/admin/dashboard`}
                className="bg-[#16A34A] hover:bg-green-700 text-white font-black px-6 py-4 rounded-md text-xs uppercase tracking-widest no-underline shadow-sm"
              >
                🚀 {isPt ? "Ir para o Painel de Gestão" : "Go to Partner Dashboard"}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 md:p-12 space-y-12">
            {/* ================================================================= */}
            {/* SECÇÃO 0: ENQUADRAMENTO E AS 4 FASES OPERACIONAIS                 */}
            {/* ================================================================= */}
            <section>
              <div className="flex items-center justify-between border-b-2 border-[#0F172A] pb-3 mb-6">
                <h2 className="text-base md:text-lg font-black uppercase tracking-widest text-[#0F172A] m-0">
                  {isPt
                    ? "I. Enquadramento Geral da Parceria (4 Pilares)"
                    : "I. General Partnership Framework (4 Pillars)"}
                </h2>
                <span className="bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                  {isPt ? "Leitura Obrigatória" : "Mandatory Reading"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#F8FAFC] p-5 rounded-md border border-slate-200 flex gap-4 items-start">
                  <div className="w-11 h-11 bg-[#16A34A] text-white rounded-md flex items-center justify-center text-xl shrink-0 font-black">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-[#0F172A] m-0 mb-1.5">
                      {isPt
                        ? "Celebração e Renovação do Acordo"
                        : "Execution & Renewal of Agreement"}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed m-0 text-justify">
                      {isPt
                        ? "Este contrato regula a divulgação comercial e a intermediação das suas ofertas (campos de férias, cursos, ateliers e estadias) através da plataforma HelloCamp. O acordo mantém-se válido até ao final do ano civil em curso, sendo automaticamente renovado por períodos anuais, salvo denúncia prévia por qualquer das partes."
                        : "This contract governs the commercial promotion and intermediation of your offers (holiday camps, courses, workshops, and stays) through the HelloCamp platform. It remains valid until the end of the current calendar year and renews automatically each year unless terminated."}
                    </p>
                  </div>
                </div>

                <div className="bg-[#F8FAFC] p-5 rounded-md border border-slate-200 flex gap-4 items-start">
                  <div className="w-11 h-11 bg-[#2563EB] text-white rounded-md flex items-center justify-center text-xl shrink-0 font-black">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-[#0F172A] m-0 mb-1.5">
                      {isPt
                        ? "Divulgação Transparente da Sua Marca"
                        : "Transparent Brand Promotion"}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed m-0 text-justify">
                      {isPt
                        ? "A HelloCamp organiza e publica as páginas dos seus programas em Português e Inglês, dando total destaque ao seu logótipo, história e contactos oficiais. O Parceiro tem controlo permanente no seu painel para editar preços, vagas, fotografias e turnos."
                        : "HelloCamp structures and publishes your program pages in Portuguese and English, highlighting your official logo, story, and contacts. You retain full control in your dashboard to update prices, spots, photos, and schedules at any time."}
                    </p>
                  </div>
                </div>

                <div className="bg-[#F8FAFC] p-5 rounded-md border border-slate-200 flex gap-4 items-start">
                  <div className="w-11 h-11 bg-[#F59E0B] text-white rounded-md flex items-center justify-center text-xl shrink-0 font-black">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-[#0F172A] m-0 mb-1.5">
                      {isPt
                        ? "Gestão de Reservas e Fichas Médicas"
                        : "Booking Management & Medical Forms"}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed m-0 text-justify">
                      {isPt
                        ? "Consoante a modalidade escolhida no Anexo 1, as reservas podem ser concluídas diretamente no checkout seguro (com recolha automática de ficha médica, alergias, contactos de emergência e dados de faturação do encarregado de educação), por consulta via e-mail ou por redirecionamento externo."
                        : "Depending on the model selected in Annex 1, bookings can be completed directly via secure checkout (automatically collecting medical forms, allergies, emergency contacts, and parent billing details), by email inquiry, or via external link redirection."}
                    </p>
                  </div>
                </div>

                <div className="bg-[#F8FAFC] p-5 rounded-md border border-slate-200 flex gap-4 items-start">
                  <div className="w-11 h-11 bg-[#0F172A] text-white rounded-md flex items-center justify-center text-xl shrink-0 font-black">
                    4
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-[#0F172A] m-0 mb-1.5">
                      {isPt
                        ? "Modelo 100% ao Sucesso (Comissão)"
                        : "100% Success-Based Commission"}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed m-0 text-justify">
                      {isPt
                        ? "Não existem taxas de adesão nem mensalidades fixas. A HelloCamp aufere apenas a comissão acordada sobre cada inscrição efetivamente concretizada através da plataforma, ajustada proporcionalmente em caso de cancelamento parcial."
                        : "There are no setup fees or fixed monthly charges. HelloCamp only earns the agreed commission on confirmed bookings generated through the platform, proportionally adjusted in the event of partial cancellation."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECÇÃO II: PROGRAMAS PRÉ-CONFIGURADOS ABRANGIDOS PELO CONTRATO    */}
            {/* ================================================================= */}
            <section className="bg-blue-50/60 border border-blue-200 rounded-md p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <span className="inline-block bg-[#2563EB] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-1">
                    {isPt ? "Âmbito Operacional" : "Operational Scope"}
                  </span>
                  <h3 className="text-base font-black text-[#0F172A] m-0">
                    {isPt
                      ? `II. Programas e Campos Abrangidos por Este Contrato (${camposParceiro.length})`
                      : `II. Programs & Camps Covered by This Agreement (${camposParceiro.length})`}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-600">
                  {isPt
                    ? "Clique em qualquer programa para pré-visualizar a página (Visão Admin)"
                    : "Click any program to preview its page (Admin View)"}
                </span>
              </div>

              {camposParceiro.length === 0 ? (
                <p className="text-xs font-bold text-slate-600 m-0">
                  {isPt
                    ? "Este contrato abrange todos os programas que vierem a ser criados pela sua entidade na plataforma HelloCamp."
                    : "This agreement covers all programs created by your organization on the HelloCamp platform."}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {camposParceiro.map((c, idx) => (
                    <div
                      key={c.id}
                      className="bg-white p-3.5 rounded-md border border-slate-200 flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-black text-[#0F172A] truncate">
                          {idx + 1}. { !isPt && c.nome_en ? c.nome_en : c.nome }
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                          📍 {c.local} • 💰 {isPt ? "Desde" : "From"} {c.preco}€ •{" "}
                          {c.taxa_comissao ?? taxaComissao}%{" "}
                          {isPt ? "Comissão" : "Fee"}
                        </div>
                      </div>
                      <Link
                        href={`/${lang}/campo/${c.id}?preview=admin`}
                        target="_blank"
                        className="bg-[#2563EB] hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-md no-underline shrink-0"
                      >
                        👁️ {isPt ? "Ver Página" : "Preview"} ↗
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ================================================================= */}
            {/* SECÇÃO III: IDENTIFICAÇÃO DAS PARTES CONTRATANTES                 */}
            {/* ================================================================= */}
            <section>
              <h2 className="text-base md:text-lg font-black uppercase tracking-widest text-[#0F172A] border-b-2 border-[#0F172A] pb-3 mb-6">
                {isPt
                  ? "III. Identificação das Partes Contratantes"
                  : "III. Identification of the Contracting Parties"}
              </h2>

              {/* PRIMEIRA OUTORGANTE */}
              <div className="bg-[#0F172A] text-white p-5 rounded-md mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="bg-[#F59E0B] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block mb-1.5">
                    {isPt
                      ? "Primeira Outorgante (Plataforma)"
                      : "First Party (Platform)"}
                  </span>
                  <p className="text-base font-black m-0">
                    HelloCamp Portugal — Plataforma Digital de Campos de Férias e Atividades Juvenis
                  </p>
                  <p className="text-xs text-slate-300 m-0 mt-1">
                    Website: www.hellocamp.pt • E-mail Oficial: info@hellocamp.pt • Jurisdição: Comarca de Lisboa, Portugal
                  </p>
                </div>
                <span className="bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md shrink-0">
                  ✓ {isPt ? "Proponente Oficial" : "Official Proposer"}
                </span>
              </div>

              {/* SEGUNDA OUTORGANTE (FORMULÁRIO COMPLETO DO PARCEIRO) */}
              <div className="bg-[#F8FAFC] p-6 md:p-8 rounded-md border border-slate-300">
                <div className="mb-5">
                  <span className="bg-[#2563EB] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block mb-1">
                    {isPt
                      ? "Segunda Outorgante (Parceiro Organizador)"
                      : "Second Party (Partner Organizer)"}
                  </span>
                  <p className="text-xs font-bold text-slate-600 m-0 mt-1">
                    {isPt
                      ? "Confirme ou complete abaixo os dados societários, fiscais e operacionais da sua organização:"
                      : "Confirm or complete your organization's legal, billing, and operational details below:"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      {isPt
                        ? "Nome da Entidade / Designação Social (Faturação) *"
                        : "Legal Entity / Company Name (Billing) *"}
                    </label>
                    <input
                      required
                      value={empresaNome}
                      onChange={(e) => setEmpresaNome(e.target.value)}
                      className={inputClass}
                      placeholder={
                        isPt
                          ? "Ex: Fundação Portuguesa das Comunicações"
                          : "Ex: Legal Company Name Ltd"
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isPt
                        ? "NIF / NIPC / Tax ID *"
                        : "Tax ID / VAT Registration Number *"}
                    </label>
                    <input
                      required
                      value={nif}
                      onChange={(e) => setNif(e.target.value)}
                      className={inputClass}
                      placeholder="Ex: 500 000 000"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isPt ? "Forma Jurídica *" : "Legal Form / Entity Type *"}
                    </label>
                    <input
                      required
                      value={formaJuridica}
                      onChange={(e) => setFormaJuridica(e.target.value)}
                      className={inputClass}
                      placeholder={
                        isPt
                          ? "Ex: Sociedade por Quotas (Lda), Fundação, Associação"
                          : "Ex: Ltd, PLC, Foundation, Association"
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      {isPt
                        ? "Morada Completa da Sede Fiscal *"
                        : "Full Registered Office Address *"}
                    </label>
                    <input
                      required
                      value={morada}
                      onChange={(e) => setMorada(e.target.value)}
                      className={inputClass}
                      placeholder={
                        isPt
                          ? "Rua, Número, Andar, Localidade"
                          : "Street, Number, City, Country"
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isPt
                        ? "Código Postal e Cidade *"
                        : "Postal / Zip Code & City *"}
                    </label>
                    <input
                      required
                      value={codigoPostal}
                      onChange={(e) => setCodigoPostal(e.target.value)}
                      className={inputClass}
                      placeholder="Ex: 1200-225 Lisboa"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isPt ? "Website Oficial" : "Official Website"}
                    </label>
                    <input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isPt
                        ? "Pessoa de Contacto / Representante *"
                        : "Primary Contact Person *"}
                    </label>
                    <input
                      required
                      value={pessoaContacto}
                      onChange={(e) => setPessoaContacto(e.target.value)}
                      className={inputClass}
                      placeholder={isPt ? "Nome Completo" : "Full Name"}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isPt
                        ? "Telefone / Telemóvel de Contacto *"
                        : "Contact Phone Number *"}
                    </label>
                    <input
                      required
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className={inputClass}
                      placeholder="+351 210 000 000"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isPt
                        ? "E-mail Comercial e de Login *"
                        : "Commercial & Login Email *"}
                    </label>
                    <input
                      required
                      type="email"
                      value={emailContacto}
                      onChange={(e) => setEmailContacto(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      {isPt
                        ? "E-mail para Receção de Reservas *"
                        : "Bookings Notification Email *"}
                    </label>
                    <input
                      required
                      type="email"
                      value={emailReservas}
                      onChange={(e) => setEmailReservas(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      {isPt
                        ? "Responsável pela Proteção de Dados (RGPD) *"
                        : "Data Protection Officer / GDPR Contact *"}
                    </label>
                    <input
                      required
                      value={responsavelRGPD}
                      onChange={(e) => setResponsavelRGPD(e.target.value)}
                      className={inputClass}
                      placeholder={
                        isPt
                          ? "Nome do responsável pelo tratamento de dados dos participantes"
                          : "Name of person responsible for participant data privacy"
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECÇÃO IV: CLÁUSULAS CONTRATUAIS INTEGRAIS (SEM OMISSÕES!)        */}
            {/* ================================================================= */}
            <section>
              <h2 className="text-base md:text-lg font-black uppercase tracking-widest text-[#0F172A] border-b-2 border-[#0F172A] pb-3 mb-6">
                {isPt
                  ? "IV. Cláusulas Contratuais Gerais (Texto Integral)"
                  : "IV. Full Contractual Clauses (Unabridged Legal Text)"}
              </h2>

              <div className="bg-white border border-slate-300 rounded-md p-6 md:p-8 space-y-6 text-xs md:text-sm text-slate-700 leading-relaxed text-justify shadow-inner">
                <div>
                  <h4 className="font-black text-[#0F172A] uppercase text-xs md:text-sm m-0 mb-2">
                    {isPt
                      ? "Artigo 1.º — Objeto e Âmbito do Contrato Global"
                      : "Article 1 — Object and Scope of the Global Agreement"}
                  </h4>
                  <p className="m-0">
                    {isPt
                      ? `1. Pelo presente contrato, a Primeira Outorgante (HelloCamp Portugal) obriga-se a promover, divulgar e intermediar comercialmente, através da sua plataforma digital (www.hellocamp.pt), os campos de férias, cursos, oficinas, estadias e demais programas juvenis ou familiares organizados pela Segunda Outorgante (${empresaNome || "o Parceiro"}). 2. Este contrato tem natureza de acordo-quadro global, abrangendo todos os programas atualmente configurados na conta do Parceiro bem como quaisquer novos turnos, vagas ou programas que o Parceiro venha a adicionar futuramente na plataforma.`
                      : `1. Under this agreement, the First Party (HelloCamp Portugal) undertakes to promote, publish, and commercially intermediate, through its digital platform (www.hellocamp.pt), the holiday camps, courses, workshops, stays, and youth or family programs organized by the Second Party (${empresaNome || "the Partner"}). 2. This agreement acts as a master global contract covering all programs currently configured in the Partner's account as well as any future sessions or camps added by the Partner.`}
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-[#0F172A] uppercase text-xs md:text-sm m-0 mb-2">
                    {isPt
                      ? "Artigo 2.º — Taxa de Comissão e Base de Incidência"
                      : "Article 2 — Commission Rate and Calculation Base"}
                  </h4>
                  <p className="m-0 mb-2">
                    {isPt
                      ? `1. Como contrapartida pelos serviços de promoção tecnológica, captação de clientes e intermediação de reservas, o Parceiro compromete-se a pagar à HelloCamp uma comissão base de ${taxaComissao}% (IVA incluído à taxa legal em vigor) sobre cada reserva efetuada e confirmada através da plataforma, salvo se uma taxa específica distinta tiver sido acordada individualmente para determinado programa.`
                      : `1. In consideration for the technological promotion, customer acquisition, and booking intermediation services, the Partner agrees to pay HelloCamp a base commission of ${taxaComissao}% (VAT included) on each confirmed booking made through the platform, unless a specific custom rate has been agreed upon for a particular program.`}
                  </p>
                  <p className="m-0 mb-2">
                    {isPt
                      ? `2. A comissão é calculada sobre o valor efetivamente pago pelo cliente final relativamente à atividade reservada (${
                          baseComissao === "apenas_programa"
                            ? "incidindo apenas sobre o valor base do programa"
                            : "incidindo sobre o valor total da reserva, incluindo pacotes e serviços adicionais contratados"
                        }).`
                      : `2. The commission is calculated on the amount effectively paid by the final customer for the booked activity (${
                          baseComissao === "apenas_programa"
                            ? "applying solely to the base program tuition"
                            : "applying to the total booking amount, including selected packages and add-ons"
                        }).`}
                  </p>
                  <p className="m-0">
                    {isPt
                      ? "3. A comissão torna-se devida após a confirmação da reserva e transmissão dos respetivos dados de inscrição ao Parceiro. Caso uma reserva não possa ser realizada por motivos devidamente justificados pelo Parceiro (nomeadamente indisponibilidade superveniente de vagas comunicada de imediato), nenhuma comissão será cobrada sobre essa inscrição."
                      : "3. Commission becomes due upon booking confirmation and transmission of participant details to the Partner. If a booking cannot be fulfilled due to justified unavailability immediately communicated by the Partner, no commission shall be charged."}
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-[#0F172A] uppercase text-xs md:text-sm m-0 mb-2">
                    {isPt
                      ? "Artigo 3.º — Condições de Pagamento, Liquidação e Faturação"
                      : "Article 3 — Payment Terms, Settlement and Invoicing"}
                  </h4>
                  <p className="m-0">
                    {isPt
                      ? "1. Nas reservas processadas através do checkout direto da plataforma (via Stripe), o montante líquido correspondente ao Parceiro (valor pago pelo cliente deduzido da comissão da HelloCamp) é transferido para a conta bancária/Stripe do Parceiro de acordo com o calendário de liquidação financeira. 2. Nas modalidades de Reserva Sob Consulta por E-mail ou Redirecionamento para Link Externo, a HelloCamp emitirá fatura mensal referente às inscrições concretizadas, comprometendo-se o Parceiro a liquidar as faturas emitidas dentro do prazo de 15 (quinze) dias a contar da sua emissão."
                      : "1. For bookings processed through the platform's direct checkout (via Stripe), the net amount due to the Partner (customer payment minus HelloCamp's commission) is transferred to the Partner's bank/Stripe account according to the settlement schedule. 2. For Email Inquiry or External Link Redirection models, HelloCamp shall issue a monthly invoice for confirmed registrations, payable by the Partner within 15 (fifteen) days of issue."}
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-[#0F172A] uppercase text-xs md:text-sm m-0 mb-2">
                    {isPt
                      ? "Artigo 4.º — Obrigações do Parceiro, Direitos de Imagem e Paridade Tarifária"
                      : "Article 4 — Partner Obligations, Image Rights and Price Parity"}
                  </h4>
                  <p className="m-0 mb-2">
                    {isPt
                      ? "1. O Parceiro compromete-se a fornecer à HelloCamp informações rigorosas, completas e atualizadas sobre os seus programas (horários, idades, preços, condições de alojamento, alimentação, rácio de monitores e regras específicas), mantendo a disponibilidade de vagas atualizada no seu Painel de Organizador."
                      : "1. The Partner undertakes to provide HelloCamp with accurate, complete, and up-to-date information regarding its programs (schedules, ages, prices, accommodation, meals, monitor ratios, and specific rules), keeping spot availability updated in the Organizer Dashboard."}
                  </p>
                  <p className="m-0">
                    {isPt
                      ? "2. O Parceiro declara e garante que detém todos os direitos de propriedade intelectual, direitos de autor e autorizações de imagem sobre os logótipos, fotografias, vídeos e textos disponibilizados à HelloCamp para promoção dos programas. 3. Os preços divulgados na plataforma HelloCamp não poderão ser superiores aos preços de tabela praticados diretamente pelo Parceiro ao público geral para a mesma atividade e condições."
                      : "2. The Partner warrants that it holds all intellectual property, copyright, and image permissions for all logos, photos, videos, and texts provided to HelloCamp. 3. Prices published on HelloCamp shall not exceed the standard public prices charged directly by the Partner for the same program and conditions."}
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-[#0F172A] uppercase text-xs md:text-sm m-0 mb-2">
                    {isPt
                      ? "Artigo 5.º — Duração, Renovação Automática e Denúncia"
                      : "Article 5 — Term, Automatic Renewal and Termination"}
                  </h4>
                  <p className="m-0">
                    {isPt
                      ? "1. O presente contrato produz efeitos imediatos a partir da data da sua assinatura digital por ambas as partes e mantém-se válido até ao final do ano civil em curso, sendo automaticamente renovado por períodos sucessivos de 1 (um) ano civil. 2. Qualquer das partes poderá denunciar ou resolver o presente contrato a todo o tempo, mediante comunicação escrita por e-mail com antecedência mínima de 15 (quinze) dias, sem prejuízo do integral cumprimento e honra de todas as reservas já confirmadas e pagas por clientes até à data de produção de efeitos da cessação."
                      : "1. This agreement takes effect immediately upon digital signature by both parties and remains valid until the end of the current calendar year, automatically renewing for successive 1 (one) year periods. 2. Either party may terminate this agreement by written email notice with at least 15 (fifteen) days' notice, without prejudice to honoring all bookings already confirmed by customers prior to termination."}
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-[#0F172A] uppercase text-xs md:text-sm m-0 mb-2">
                    {isPt
                      ? "Artigo 6.º — Limitação de Responsabilidade Civil, Licenças e Seguros Obrigatórios"
                      : "Article 6 — Civil Liability Limitation, Licenses and Mandatory Insurance"}
                  </h4>
                  <p className="m-0">
                    {isPt
                      ? "1. A HelloCamp atua estritamente como plataforma tecnológica de divulgação e intermediação de reservas, não organizando nem executando diretamente as atividades. 2. O Parceiro é o único e exclusivo responsável pela direção técnica, supervisão pedagógica, higiene, alimentação e segurança física e moral dos participantes durante a realização das atividades. 3. O Parceiro declara e garante possuir todas as licenças legais exigidas para o exercício da sua atividade (designadamente registo IPDJ de Campos de Férias, RNAAT/RNAVT ou acreditação equivalente no país de operação), bem como apólices válidas de Seguro de Acidentes Pessoais para os participantes e Seguro de Responsabilidade Civil, isentando a HelloCamp de qualquer responsabilidade civil, contraordenacional ou criminal decorrente da execução do programa."
                      : "1. HelloCamp acts strictly as a technological promotion and booking intermediation platform and does not directly execute the camp activities. 2. The Partner bears sole and exclusive responsibility for technical direction, pedagogical supervision, facilities, meals, and participant safety during the programs. 3. The Partner warrants that it holds all mandatory operating licenses and valid Personal Accident and Civil Liability Insurance policies required by law, holding HelloCamp harmless from any claims arising from program execution."}
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-[#0F172A] uppercase text-xs md:text-sm m-0 mb-2">
                    {isPt
                      ? "Artigo 7.º — Proteção de Dados Pessoais (RGPD) e Confidencialidade Médica"
                      : "Article 7 — Personal Data Protection (GDPR) and Medical Confidentiality"}
                  </h4>
                  <p className="m-0">
                    {isPt
                      ? "1. Para efeitos do Regulamento Geral sobre a Proteção de Dados — Regulamento (UE) 2016/679 (RGPD), o Parceiro assume a qualidade de Responsável pelo Tratamento relativamente aos dados pessoais dos encarregados de educação e aos dados especiais/sensíveis dos menores (alergias, restrições alimentares, condições médicas, medicação e autorizações de recolha) que lhe sejam transmitidos pela HelloCamp para efeitos de inscrição. 2. O Parceiro obriga-se a guardar rigoroso sigilo profissional sobre tais dados, a restringir o seu acesso apenas à equipa técnica/médica estritamente necessária à segurança da criança, a não os utilizar para fins distintos da execução do programa contratado e a proceder à sua eliminação nos prazos legais."
                      : "1. Under Regulation (EU) 2016/679 (GDPR), the Partner acts as an independent Data Controller regarding parent personal data and minor sensitive health data (allergies, dietary needs, medical conditions, medication, and pickup authorizations) transmitted by HelloCamp for booking fulfillment. 2. The Partner undertakes to maintain strict confidentiality, restrict access solely to authorized staff, use the data exclusively for executing the booked program, and delete it in accordance with legal retention periods."}
                  </p>
                </div>

                <div>
                  <h4 className="font-black text-[#0F172A] uppercase text-xs md:text-sm m-0 mb-2">
                    {isPt
                      ? "Artigo 8.º — Impostos e Faturação ao Cliente Final"
                      : "Article 8 — Taxes and Final Customer Invoicing"}
                  </h4>
                  <p className="m-0">
                    {isPt
                      ? "O Parceiro, enquanto prestador direto do serviço educativo/desportivo ou turístico, é o único responsável por determinar, liquidar e emitir ao cliente final (encarregado de educação ou participante) a respetiva fatura ou recibo pelo valor do programa adquirido, incluindo ou isentando o IVA nos termos do Código do IVA ou legislação fiscal aplicável na sua jurisdição."
                      : "As the direct provider of the educational, sports, or accommodation service, the Partner is solely responsible for issuing the final invoice or receipt to the customer for the purchased program and complying with all applicable VAT or local tax regulations."}
                  </p>
                </div>

                <div className="bg-[#F8FAFC] p-4 rounded-md border-l-4 border-[#0F172A]">
                  <h4 className="font-black text-[#0F172A] uppercase text-xs md:text-sm m-0 mb-2">
                    {isPt
                      ? "Artigo 9.º — Lei Aplicável, Foro Competente e Convenção de Prova Eletrónica"
                      : "Article 9 — Governing Law, Jurisdiction and Electronic Evidence Convention"}
                  </h4>
                  <p className="m-0">
                    {isPt
                      ? "1. O presente contrato rege-se e interpreta-se, para todos os efeitos, pela Lei Portuguesa, sendo competente para dirimir qualquer litígio emergente da sua interpretação ou execução o foro da Comarca de Lisboa (Portugal), com expressa renúncia a qualquer outro. 2. Ao abrigo do Regulamento (UE) n.º 910/2014 (eIDAS) e da liberdade de estipulação probatória, as partes reconhecem expressamente a validade e a plena força vinculativa da aceitação eletrónica deste contrato mediante a aposição do nome e cargo do representante legal no portal da HelloCamp, convencionando que os registos informáticos recolhidos (incluindo o Endereço IP, data/hora UTC e PDF gerado) constituem meio de prova bastante, renunciando o Parceiro a invocar a nulidade do contrato com fundamento na ausência de assinatura manuscrita."
                      : "1. This agreement is governed by Portuguese Law, and any dispute shall be submitted to the exclusive jurisdiction of the Courts of Lisbon (Portugal). 2. Pursuant to Regulation (EU) No 910/2014 (eIDAS), the parties expressly recognize the binding legal validity of the electronic signature affixed to this contract via the HelloCamp portal, agreeing that the recorded IP address, UTC timestamp, and generated PDF constitute full legal proof."}
                  </p>
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECÇÃO V: ANEXOS OPERACIONAIS COMPLETOS (1, 2, 3 E 4)             */}
            {/* ================================================================= */}
            <section className="space-y-8">
              <h2 className="text-base md:text-lg font-black uppercase tracking-widest text-[#0F172A] border-b-2 border-[#0F172A] pb-3 m-0">
                {isPt
                  ? "V. Anexos Operacionais e Condições Financeiras"
                  : "V. Operational Annexes & Financial Terms"}
              </h2>

              {/* RESUMO DA TAXA E BASE DE COMISSÃO (DROPDOWN CUSTOMIZADO SEM SELECT NATIVO) */}
              <div className="bg-blue-50/70 p-6 rounded-md border border-blue-200 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-md border border-blue-200 shadow-sm">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#2563EB] block mb-1">
                      {isPt
                        ? "Condição Comercial Acordada"
                        : "Agreed Commercial Rate"}
                    </span>
                    <h4 className="text-base font-black text-[#0F172A] m-0">
                      {isPt
                        ? "Taxa de Comissão Base da Parceria (IVA Incluído)"
                        : "Partnership Base Commission Rate (VAT Included)"}
                    </h4>
                  </div>
                  <span className="text-2xl font-black text-white bg-[#2563EB] px-5 py-2 rounded-md">
                    {taxaComissao}%
                  </span>
                </div>

                {/* Dropdown Customizado de Base de Incidência */}
                <div className="relative">
                  <label className={labelClass}>
                    {isPt
                      ? "Base de Incidência da Comissão"
                      : "Commission Calculation Base"}
                  </label>
                  <div
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === "baseComissao" ? null : "baseComissao"
                      )
                    }
                    className={`${inputClass} cursor-pointer flex justify-between items-center`}
                  >
                    <span>
                      {baseComissao === "apenas_programa"
                        ? isPt
                          ? "Apenas sobre o Valor Base do Programa"
                          : "Only on Base Program Value"
                        : isPt
                        ? "Sobre o Valor Total da Reserva (Programa + Extras)"
                        : "On Total Booking Value (Program + Add-ons)"}
                    </span>
                    <span className="text-xs text-slate-400">▼</span>
                  </div>
                  {openDropdown === "baseComissao" && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-30 overflow-hidden">
                      <div
                        onClick={() => {
                          setBaseComissao("total");
                          setOpenDropdown(null);
                        }}
                        className="p-3.5 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-100"
                      >
                        {isPt
                          ? "Sobre o Valor Total da Reserva (Programa + Extras)"
                          : "On Total Booking Value (Program + Add-ons)"}
                      </div>
                      <div
                        onClick={() => {
                          setBaseComissao("apenas_programa");
                          setOpenDropdown(null);
                        }}
                        className="p-3.5 text-xs font-bold hover:bg-blue-50 cursor-pointer"
                      >
                        {isPt
                          ? "Apenas sobre o Valor Base do Programa"
                          : "Only on Base Program Value"}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ANEXO 1: PROCEDIMENTO DE RESERVA */}
              <div className="bg-[#F8FAFC] p-6 md:p-8 rounded-md border border-slate-300">
                <h3 className="font-black text-sm md:text-base mb-2 text-[#0F172A] uppercase border-l-4 border-[#16A34A] pl-3">
                  {isPt
                    ? "Anexo 1 — Procedimento e Modalidade de Reserva"
                    : "Annex 1 — Booking Procedure & Integration Model"}
                </h3>
                <p className="text-xs text-slate-600 mb-5 font-medium">
                  {isPt
                    ? "Selecione a modalidade de receção e confirmação de inscrições aplicável aos seus programas:"
                    : "Select the booking reception and confirmation procedure applicable to your programs:"}
                </p>

                <div className="space-y-4">
                  <label
                    className={`flex items-start gap-4 cursor-pointer p-5 rounded-md border-2 transition-colors ${
                      modalidadeReserva === "direta"
                        ? "bg-white border-[#16A34A] shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="anexo1"
                      value="direta"
                      checked={modalidadeReserva === "direta"}
                      onChange={() => setModalidadeReserva("direta")}
                      className="mt-1 w-5 h-5 accent-[#16A34A]"
                    />
                    <div>
                      <strong className="block text-[#0F172A] mb-1 text-sm">
                        {isPt
                          ? "1. Reserva Direta no Checkout da HelloCamp (Recomendado)"
                          : "1. Direct Checkout Booking on HelloCamp (Recommended)"}
                      </strong>
                      <span className="text-slate-600 leading-relaxed block text-xs">
                        {isPt
                          ? "As inscrições efetuadas através da plataforma HelloCamp ficam confirmadas de imediato mediante pagamento seguro via Stripe. O formulário de checkout recolhe automaticamente os dados completos da criança, ficha médica, alergias, contactos de emergência e NIF para faturação, disponibilizando tudo em tempo real no seu Painel de Organizador."
                          : "Bookings made on HelloCamp are confirmed immediately upon secure Stripe payment. The checkout form automatically collects full child details, medical forms, allergies, emergency contacts, and billing NIF, making everything available in real time in your Organizer Dashboard."}
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-4 cursor-pointer p-5 rounded-md border-2 transition-colors ${
                      modalidadeReserva === "email"
                        ? "bg-white border-[#16A34A] shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="anexo1"
                      value="email"
                      checked={modalidadeReserva === "email"}
                      onChange={() => setModalidadeReserva("email")}
                      className="mt-1 w-5 h-5 accent-[#16A34A]"
                    />
                    <div>
                      <strong className="block text-[#0F172A] mb-1 text-sm">
                        {isPt
                          ? "2. Comunicação por E-mail (Reserva Sob Consulta)"
                          : "2. Email Communication (Booking On Request)"}
                      </strong>
                      <span className="text-slate-600 leading-relaxed block text-xs">
                        {isPt
                          ? "A HelloCamp envia por e-mail os dados completos do participante e do encarregado de educação. O Parceiro dispõe de 2 (dois) dias úteis para validar a disponibilidade ou comunicar eventual rejeição por falta de vagas. Na ausência de objeção nesse prazo, a reserva considera-se aceite."
                          : "HelloCamp forwards the participant and parent details by email. The Partner has 2 (two) business days to confirm availability or report a rejection due to lack of spots. In the absence of objection within this period, the booking is deemed accepted."}
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-4 cursor-pointer p-5 rounded-md border-2 transition-colors ${
                      modalidadeReserva === "link_externo"
                        ? "bg-white border-[#16A34A] shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="anexo1"
                      value="link_externo"
                      checked={modalidadeReserva === "link_externo"}
                      onChange={() => setModalidadeReserva("link_externo")}
                      className="mt-1 w-5 h-5 accent-[#16A34A] shrink-0"
                    />
                    <div className="w-full">
                      <strong className="block text-[#0F172A] mb-1 text-sm">
                        {isPt
                          ? "3. Formulário Externo Próprio (Redirecionamento)"
                          : "3. Own External Booking Form (Redirection)"}
                      </strong>
                      <span className="text-slate-600 leading-relaxed block text-xs">
                        {isPt
                          ? "O cliente preenche a identificação inicial na HelloCamp (registo de Lead) e é redirecionado automaticamente para o website/formulário oficial do Parceiro para concluir a inscrição. O Parceiro compromete-se sob compromisso de honra a confirmar mensalmente as leads que converteram em inscrição."
                          : "The customer completes initial identification on HelloCamp (Lead registration) and is redirected to the Partner's official website/form to finish booking. The Partner agrees in good faith to confirm converted leads monthly."}
                      </span>

                      {modalidadeReserva === "link_externo" && (
                        <div className="mt-4 bg-[#F8FAFC] p-4 rounded-md border border-slate-300">
                          <label className={labelClass}>
                            {isPt
                              ? "URL Oficial do Seu Formulário de Inscrição *"
                              : "Official URL of Your Registration Form *"}
                          </label>
                          <input
                            type="url"
                            required
                            value={linkExternoReserva}
                            onChange={(e) =>
                              setLinkExternoReserva(e.target.value)
                            }
                            className={inputClass}
                            placeholder="https://..."
                          />
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* ANEXOS 2 E 3 (QUANDO NÃO É LINK EXTERNO) */}
              {modalidadeReserva !== "link_externo" && (
                <>
                  {/* ANEXO 2: MODALIDADE DE PAGAMENTO */}
                  <div className="bg-emerald-50/60 p-6 md:p-8 rounded-md border border-emerald-200">
                    <h3 className="font-black text-sm md:text-base mb-2 text-[#0F172A] uppercase border-l-4 border-[#16A34A] pl-3">
                      {isPt
                        ? "Anexo 2 — Fluxo de Cobrança ao Cliente (Stripe)"
                        : "Annex 2 — Customer Payment Flow (Stripe)"}
                    </h3>
                    <p className="text-xs text-slate-600 mb-5 font-medium">
                      {isPt
                        ? "O Parceiro autoriza a HelloCamp a processar os pagamentos dos clientes através da infraestrutura segura Stripe segundo a opção selecionada:"
                        : "The Partner authorizes HelloCamp to process customer payments via Stripe according to the selected option:"}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label
                        className={`flex items-start gap-3.5 cursor-pointer p-5 rounded-md border-2 transition-colors ${
                          tipoPagamento === "100_total"
                            ? "bg-white border-[#16A34A] shadow-sm"
                            : "bg-white/70 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="anexo2"
                          value="100_total"
                          checked={tipoPagamento === "100_total"}
                          onChange={() => setTipoPagamento("100_total")}
                          className="mt-1 w-5 h-5 accent-[#16A34A]"
                        />
                        <div>
                          <strong className="block text-[#0F172A] mb-1 text-sm">
                            {isPt
                              ? "100% Pago no Ato da Reserva"
                              : "100% Paid Upon Booking"}
                          </strong>
                          <span className="text-slate-600 text-xs leading-relaxed block">
                            {isPt
                              ? "O encarregado de educação liquida a totalidade (100%) do valor do programa no momento da inscrição para garantir a vaga de imediato."
                              : "The customer pays 100% of the program fee at the time of booking to secure the spot immediately."}
                          </span>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3.5 cursor-pointer p-5 rounded-md border-2 transition-colors ${
                          tipoPagamento === "50_sinal"
                            ? "bg-white border-[#16A34A] shadow-sm"
                            : "bg-white/70 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="anexo2"
                          value="50_sinal"
                          checked={tipoPagamento === "50_sinal"}
                          onChange={() => setTipoPagamento("50_sinal")}
                          className="mt-1 w-5 h-5 accent-[#16A34A]"
                        />
                        <div>
                          <strong className="block text-[#0F172A] mb-1 text-sm">
                            {isPt
                              ? "Sinal de 50% na Reserva + 50% Antes do Início"
                              : "50% Deposit Now + 50% Before Start"}
                          </strong>
                          <span className="text-slate-600 text-xs leading-relaxed block">
                            {isPt
                              ? "Permite aos pais reservar pagando 50% de sinal no ato da inscrição e liquidar os restantes 50% na Área de Cliente até 7 dias antes do início do turno."
                              : "Allows parents to book by paying a 50% deposit upfront and settling the remaining 50% in their Customer Portal up to 7 days before the camp starts."}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* ANEXO 3: POLÍTICA DE CANCELAMENTO */}
                  <div className="bg-amber-50/70 p-6 md:p-8 rounded-md border border-amber-200">
                    <h3 className="font-black text-sm md:text-base mb-2 text-[#0F172A] uppercase border-l-4 border-[#F59E0B] pl-3">
                      {isPt
                        ? "Anexo 3 — Política de Cancelamento e Reembolsos ao Cliente"
                        : "Annex 3 — Customer Cancellation & Refund Policy"}
                    </h3>
                    <p className="text-xs text-slate-600 mb-5 font-medium">
                      {isPt
                        ? "Selecione a política padrão de cancelamento aplicável às inscrições (a comissão da HelloCamp será sempre ajustada proporcionalmente ao montante que o Parceiro retiver):"
                        : "Select the default cancellation policy applicable to bookings (HelloCamp's commission is always proportionally adjusted to the amount retained by the Partner):"}
                    </p>

                    <div className="space-y-3">
                      {[
                        {
                          val: "Flexível (Reembolso a 100% até 7 dias antes)",
                          titlePt: "Política Flexível — Reembolso de 100% até 7 dias antes do início",
                          descPt:
                            "Se o encarregado de educação cancelar até 7 dias antes do início do campo, recebe reembolso de 100%. Cancelamentos com menos de 7 dias não têm direito a reembolso.",
                          titleEn: "Flexible Policy — 100% Refund up to 7 days before start",
                          descEn:
                            "If the customer cancels up to 7 days before the camp start date, they receive a 100% refund. Cancellations within 7 days are non-refundable.",
                        },
                        {
                          val: "Moderada (Reembolso a 50% até 15 dias antes)",
                          titlePt: "Política Moderada — Reembolso de 50% até 15 dias antes do início",
                          descPt:
                            "Se o encarregado de educação cancelar até 15 dias antes do início do campo, recebe reembolso de 50% (o Parceiro retém 50%). Cancelamentos com menos de 15 dias não têm reembolso.",
                          titleEn: "Moderate Policy — 50% Refund up to 15 days before start",
                          descEn:
                            "If the customer cancels up to 15 days before the camp start date, they receive a 50% refund (Partner retains 50%). Cancellations within 15 days are non-refundable.",
                        },
                        {
                          val: "Estrita (Sem reembolso após reserva)",
                          titlePt: "Política Estrita — Sem reembolso após confirmação da reserva",
                          descPt:
                            "Após a confirmação da inscrição, o valor pago não é reembolsável em caso de desistência do cliente (salvo acordo direto com o Parceiro para mudança de turno).",
                          titleEn: "Strict Policy — Non-refundable after booking confirmation",
                          descEn:
                            "Once confirmed, bookings are non-refundable in case of customer cancellation (unless directly agreed with the Partner to reschedule).",
                        },
                      ].map((opt) => (
                        <label
                          key={opt.val}
                          className={`flex items-start gap-3.5 cursor-pointer p-4 rounded-md border-2 transition-colors ${
                            politicaCancelamento === opt.val
                              ? "bg-white border-[#F59E0B] shadow-sm"
                              : "bg-white/70 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="anexo3"
                            value={opt.val}
                            checked={politicaCancelamento === opt.val}
                            onChange={() => setPoliticaCancelamento(opt.val)}
                            className="mt-1 w-5 h-5 accent-[#F59E0B]"
                          />
                          <div>
                            <strong className="block text-[#0F172A] text-sm mb-0.5">
                              {isPt ? opt.titlePt : opt.titleEn}
                            </strong>
                            <span className="text-xs text-slate-600 block leading-relaxed">
                              {isPt ? opt.descPt : opt.descEn}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ANEXO 4: ACORDOS COMPLEMENTARES / EXCEÇÕES */}
              <div className="bg-white p-6 md:p-8 rounded-md border border-slate-300">
                <h3 className="font-black text-sm md:text-base mb-2 text-[#0F172A] uppercase border-l-4 border-[#2563EB] pl-3">
                  {isPt
                    ? "Anexo 4 — Acordos Complementares ou Observações Específicas (Opcional)"
                    : "Annex 4 — Complementary Agreements or Specific Notes (Optional)"}
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  {isPt
                    ? "Caso tenha acordado alguma condição específica com a equipa HelloCamp (ex: comissões diferenciadas para alojamento vs curso, regras de grupos escolares ou notas de faturação), registe-a ou confirme-a abaixo:"
                    : "If you have agreed on any specific condition with the HelloCamp team (e.g., tiered commission for accommodation vs tuition, school group rules, or billing notes), enter or confirm it below:"}
                </p>
                <textarea
                  rows={3}
                  value={acordosComplementares}
                  onChange={(e) => setAcordosComplementares(e.target.value)}
                  className="w-full p-4 bg-[#F8FAFC] border border-slate-300 rounded-md text-xs font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
                  placeholder={
                    isPt
                      ? "Deixe em branco caso se apliquem integralmente as condições padrão acima."
                      : "Leave blank if the standard terms above apply in full."
                  }
                />
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECÇÃO VI: DEFINIÇÃO DE PASSWORD E ASSINATURA DIGITAL VINCULATIVA */}
            {/* ================================================================= */}
            <section className="bg-[#0F172A] text-white p-6 md:p-10 rounded-md border-2 border-[#16A34A] space-y-8">
              <div>
                <span className="bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md inline-block mb-2">
                  {isPt ? "Passo Final • Ativação" : "Final Step • Activation"}
                </span>
                <h2 className="text-xl md:text-2xl font-black m-0">
                  {isPt
                    ? "VI. Defina a Sua Password e Assine Digitalmente o Contrato"
                    : "VI. Set Your Password & Digitally Sign the Agreement"}
                </h2>
                <p className="text-xs text-slate-300 mt-1 mb-0">
                  {isPt
                    ? "Ao concluir este passo, o seu contrato em PDF é arquivado, os seus programas ficam ativos na plataforma e entrará automaticamente no seu Painel de Organizador."
                    : "Upon completing this step, your signed PDF contract is archived, your programs become active on the platform, and you will be logged directly into your Organizer Dashboard."}
                </p>
              </div>

              {/* 1. DEFINIR NOVA PASSWORD */}
              <div className="bg-slate-800/80 p-6 rounded-md border border-slate-700">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#F59E0B] mt-0 mb-4">
                  🔑{" "}
                  {isPt
                    ? "1. Definir Palavra-Passe Definitiva do Seu Painel de Parceiro"
                    : "1. Set Permanent Password for Your Partner Dashboard"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1.5">
                      {isPt
                        ? "Nova Palavra-Passe (Mín. 6 caracteres) *"
                        : "New Password (Min. 6 characters) *"}
                    </label>
                    <input
                      required
                      type="password"
                      minLength={6}
                      value={novaPassword}
                      onChange={(e) => setNovaPassword(e.target.value)}
                      className="w-full py-3 px-4 bg-white border border-slate-300 rounded-md text-sm font-black text-[#0F172A] outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1.5">
                      {isPt
                        ? "Confirmar Palavra-Passe *"
                        : "Confirm Password *"}
                    </label>
                    <input
                      required
                      type="password"
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full py-3 px-4 bg-white border border-slate-300 rounded-md text-sm font-black text-[#0F172A] outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* 2. ASSINATURA DIGITAL */}
              <div className="bg-slate-800/80 p-6 rounded-md border border-slate-700">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#16A34A] mt-0 mb-4">
                  ✍️{" "}
                  {isPt
                    ? "2. Assinatura Digital do Representante Legal (Artigo 9.º)"
                    : "2. Legal Representative Digital Signature (Article 9)"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1.5">
                      {isPt
                        ? "Nome Completo do Signatário *"
                        : "Full Name of Signatory *"}
                    </label>
                    <input
                      required
                      value={assinaturaNome}
                      onChange={(e) => setAssinaturaNome(e.target.value)}
                      className="w-full py-3 px-4 bg-white border border-slate-300 rounded-md text-base font-serif italic font-black text-[#0F172A] outline-none"
                      placeholder={
                        isPt ? "Escreva o seu nome completo" : "Type your full name"
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1.5">
                      {isPt
                        ? "Cargo / Qualidade em que Assina *"
                        : "Legal Role / Title *"}
                    </label>
                    <input
                      required
                      value={assinaturaCargo}
                      onChange={(e) => setAssinaturaCargo(e.target.value)}
                      className="w-full py-3 px-4 bg-white border border-slate-300 rounded-md text-sm font-bold text-[#0F172A] outline-none"
                      placeholder={
                        isPt
                          ? "Ex: Diretora / Sócio-Gerente / Presidente"
                          : "Ex: Director / CEO / Managing Partner"
                      }
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3.5 cursor-pointer bg-slate-900 p-4 rounded-md border border-slate-700">
                  <input
                    type="checkbox"
                    required
                    checked={concordaTermos}
                    onChange={(e) => setConcordaTermos(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-[#16A34A] shrink-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-200 leading-relaxed">
                    {isPt
                      ? "Declaro sob compromisso de honra ter lido e aceite integralmente todas as Cláusulas Contratuais (Artigos 1.º a 9.º) e os Anexos Operacionais (Anexos 1 a 4) do presente Contrato Global de Parceria, confirmando possuir poderes legais para vincular a entidade identificada e reconhecendo plena validade probatória à presente assinatura eletrónica."
                      : "I hereby declare that I have read and accept in full all Contractual Clauses (Articles 1 to 9) and Operational Annexes (Annexes 1 to 4) of this Global Partnership Agreement, confirming that I hold legal authority to bind the identified organization and recognizing the full legal validity of this electronic signature."}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-[#16A34A] hover:bg-green-700 disabled:bg-slate-600 text-white font-black text-sm uppercase tracking-widest rounded-md border-0 shadow-lg cursor-pointer transition-colors"
              >
                {submitting
                  ? isPt
                    ? "A Gerar Contrato PDF e Ativar Programas..."
                    : "Generating Signed PDF & Activating Programs..."
                  : isPt
                  ? "✍️ Assinar Digitalmente, Ativar Campos e Entrar no Painel →"
                  : "✍️ Digitally Sign, Activate Programs & Enter Dashboard →"}
              </button>
            </section>
          </form>
        )}
      </div>
    </main>
  );
}
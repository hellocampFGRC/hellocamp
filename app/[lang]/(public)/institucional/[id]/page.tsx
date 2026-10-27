"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoPartilha from "../../components/BotaoPartilha";

const FALLBACK_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Crect fill='%231e293b' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='48' font-weight='bold' fill='%23475569' text-anchor='middle' dy='.3em'%3EHelloCamp%3C/text%3E%3C/svg%3E";

export default function DetalheIniciativaPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = use(params);
  const isEn = lang === "en";

  const [loading, setLoading] = useState(true);
  const [iniciativa, setIniciativa] = useState<any>(null);
  const [mostrarTodosLocais, setMostrarTodosLocais] = useState(false);
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    nomePai: "",
    emailPai: "",
    telefonePai: "",
    subprogramaId: "",
    mensagem: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroForm, setErroForm] = useState("");

  useEffect(() => {
    const fetchDetalhes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("institucional_iniciativas")
        .select(
          `
          id, titulo, entidade_organizadora, descricao_html, imagem_capa_url, logotipo_url,
          distrito, concelho, idade_min_global, idade_max_global, data_inicio_global, data_fim_global, link_oficial,
          subprogramas:institucional_subprogramas(id, nome, categoria, idade_min, idade_max, data_inicio, data_fim, localizacao_resumo, telefone_contato, email_contato),
          locais:institucional_locais(id, nome, freguesia, imagem_url)
        `
        )
        .eq("id", id)
        .single();

      if (!error && data) setIniciativa(data);
      setLoading(false);
    };

    fetchDetalhes();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm("");

    if (
      !form.nomePai.trim() ||
      !form.emailPai.trim() ||
      !form.telefonePai.trim()
    ) {
      setErroForm(
        isEn
          ? "Please fill in all required contact fields."
          : "Por favor, preencha o seu nome, e-mail e telemóvel."
      );
      return;
    }

    setSubmitting(true);
    try {
      const turnoInteresse =
        form.subprogramaId || form.mensagem || "Inscrição Geral Autárquica";

      const { error: dbError } = await supabase.from("leads_externas").insert([
        {
          campo_id: iniciativa.id,
          nome_cliente: form.nomePai,
          email_cliente: form.emailPai,
          telefone_cliente: form.telefonePai,
          turno_interesse: turnoInteresse,
          preco_estimado: 0,
          detalhes_extra: `INSTITUCIONAL (${iniciativa.entidade_organizadora}) | Obs: ${
            form.mensagem || "(sem observações)"
          }`,
        },
      ]);
      if (dbError) throw dbError;

      // CORRIGIDO: Envia 'lead' no formato exato { nome, email, telefone } esperado pela API!
      await fetch("/api/notificar-reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "institucional",
          lead: {
            nome: form.nomePai,
            email: form.emailPai,
            telefone: form.telefonePai,
          },
          campoNome: `${iniciativa.titulo} (${iniciativa.entidade_organizadora})`,
          parceiroEmail: "info@hellocamp.pt",
          lang,
        }),
      }).catch(() => {});

      setSucesso(true);
    } catch (error) {
      console.error(error);
      setErroForm(
        isEn
          ? "Error sending request. Please try again."
          : "Erro ao enviar pedido. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xs uppercase tracking-widest animate-pulse">
        {isEn ? "Loading Municipal Initiative..." : "A carregar programa municipal..."}
      </div>
    );
  }

  if (!iniciativa) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="text-5xl">🏛️</span>
        <h2 className="text-2xl font-black text-slate-800">
          {isEn ? "Initiative not found." : "Iniciativa não encontrada."}
        </h2>
        <Link
          href={`/${lang}/institucional`}
          className="font-bold text-[#0E3A68] underline"
        >
          &larr; {isEn ? "Back to programs" : "Voltar às autarquias"}
        </Link>
      </div>
    );
  }

  const locaisVisiveis = mostrarTodosLocais
    ? iniciativa.locais
    : (iniciativa.locais || []).slice(0, 4);

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* HERO */}
      <div className="relative h-[38vh] min-h-[320px] bg-slate-900 overflow-hidden">
        <img
          src={iniciativa.imagem_capa_url || FALLBACK_COVER}
          alt={iniciativa.titulo}
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        <div className="absolute bottom-8 left-0 right-0 max-w-6xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl p-2 shadow-lg flex items-center justify-center flex-shrink-0">
              {iniciativa.logotipo_url ? (
                <img
                  src={iniciativa.logotipo_url}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-2xl">🏛️</span>
              )}
            </div>
            <div className="text-white">
              <span className="text-[10px] font-black uppercase tracking-widest bg-[#e2a41d] text-slate-900 px-3 py-1 rounded-full">
                {iniciativa.entidade_organizadora}
              </span>
              <h1 className="text-2xl md:text-4xl font-black m-0 mt-2 tracking-tight">
                {iniciativa.titulo}
              </h1>
              <p className="text-xs text-slate-200 font-bold m-0 mt-1">
                📍 {iniciativa.concelho || iniciativa.distrito} • 👶{" "}
                {iniciativa.idade_min_global || 6} -{" "}
                {iniciativa.idade_max_global || 16}{" "}
                {isEn ? "years" : "anos"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BotaoPartilha
              url={`https://www.hellocamp.pt/${lang}/institucional/${iniciativa.id}`}
              titulo={iniciativa.titulo}
              isEn={isEn}
            />
            {iniciativa.link_oficial && (
              <a
                href={iniciativa.link_oficial}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-slate-900 font-black uppercase tracking-widest text-xs px-5 py-3 rounded-xl no-underline shadow-md"
              >
                {isEn ? "Official Website ↗" : "Portal Oficial da Autarquia ↗"}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          {/* SOBRE A INICIATIVA */}
          <section
            id="visao-geral"
            className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <h2 className="text-xl font-black text-slate-900 m-0 mb-4">
              {isEn ? "About the Municipal Program" : "Sobre o Programa Municipal"}
            </h2>
            {iniciativa.descricao_html ? (
              <div
                className="text-sm text-slate-600 leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{ __html: iniciativa.descricao_html }}
              />
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed m-0">
                Programa oficial de ocupação de tempos livres promovido por{" "}
                <strong>{iniciativa.entidade_organizadora}</strong>.
              </p>
            )}
          </section>

          {/* SUBPROGRAMAS */}
          {iniciativa.subprogramas?.length > 0 && (
            <section
              id="programas"
              className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm"
            >
              <h2 className="text-xl font-black text-slate-900 m-0 mb-5">
                📋{" "}
                {isEn
                  ? "Available Turns & Sub-programs"
                  : "Modalidades e Turnos Disponíveis"}
              </h2>
              <div className="space-y-3">
                {iniciativa.subprogramas.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#167524] bg-emerald-50 px-2.5 py-0.5 rounded">
                        {sub.categoria || "Municipal"}
                      </span>
                      <h4 className="m-0 mt-1 text-base font-black text-slate-900">
                        {sub.nome}
                      </h4>
                      <p className="m-0 mt-1 text-xs font-bold text-slate-500">
                        👶 {sub.idade_min || 6}-{sub.idade_max || 16} anos{" "}
                        {sub.localizacao_resumo
                          ? `• 📍 ${sub.localizacao_resumo}`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm({ ...form, subprogramaId: sub.nome });
                        document
                          .getElementById("inscricoes")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="bg-[#0E3A68] text-white font-black uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-xl cursor-pointer whitespace-nowrap"
                    >
                      {isEn ? "Select" : "Selecionar"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* LOCAIS / ESCOLAS */}
          {iniciativa.locais?.length > 0 && (
            <section
              id="locais"
              className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm"
            >
              <h2 className="text-xl font-black text-slate-900 m-0 mb-5">
                📍 {isEn ? "Activity Locations" : "Polos e Locais de Realização"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {locaisVisiveis.map((loc: any) => (
                  <div
                    key={loc.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50"
                  >
                    <h4 className="m-0 text-sm font-black text-slate-900">
                      {loc.nome}
                    </h4>
                    {loc.freguesia && (
                      <p className="m-0 mt-1 text-xs text-slate-500 font-bold">
                        Freguesia: {loc.freguesia}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {iniciativa.locais.length > 4 && (
                <button
                  type="button"
                  onClick={() => setMostrarTodosLocais(!mostrarTodosLocais)}
                  className="mt-4 text-xs font-black text-[#0E3A68] underline cursor-pointer bg-transparent border-0"
                >
                  {mostrarTodosLocais
                    ? isEn
                      ? "Show less"
                      : "Mostrar menos"
                    : isEn
                    ? `Show all ${iniciativa.locais.length} locations`
                    : `Ver todos os ${iniciativa.locais.length} locais`}
                </button>
              )}
            </section>
          )}
        </div>

        {/* FORMULÁRIO DE PEDIDO DE INFORMAÇÃO / INSCRIÇÃO */}
        <aside
          id="inscricoes"
          className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-md lg:sticky lg:top-24"
        >
          <h3 className="text-xl font-black text-slate-900 m-0 mb-2">
            {isEn
              ? "Information & Registration Help"
              : "Pedido de Apoio / Inscrição"}
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-6">
            {isEn
              ? "Leave your details to receive the registration dates and requirements for this municipal program."
              : "Receba os prazos de inscrição, documentação necessária ou esclareça dúvidas sobre este programa autárquico."}
          </p>

          {sucesso ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center">
              <span className="text-4xl block mb-2">✅</span>
              <h4 className="text-base font-black text-[#167524] m-0 mb-1">
                {isEn ? "Request Registered!" : "Pedido Registado com Sucesso!"}
              </h4>
              <p className="text-xs text-slate-600 m-0 mb-4">
                {isEn
                  ? "We have logged your interest and will notify you with all details."
                  : "Registámos o seu interesse. Caso as inscrições já estejam abertas no portal da autarquia, pode também aceder diretamente abaixo."}
              </p>
              {iniciativa.link_oficial && (
                <a
                  href={iniciativa.link_oficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl no-underline"
                >
                  Abrir Site da Autarquia ↗
                </a>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {erroForm && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                  {erroForm}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  {isEn ? "Parent / Guardian Name *" : "Nome do Encarregado *"}
                </label>
                <input
                  type="text"
                  required
                  value={form.nomePai}
                  onChange={(e) =>
                    setForm({ ...form, nomePai: e.target.value })
                  }
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#0E3A68]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  required
                  value={form.emailPai}
                  onChange={(e) =>
                    setForm({ ...form, emailPai: e.target.value })
                  }
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#0E3A68]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  {isEn ? "Phone *" : "Telemóvel *"}
                </label>
                <input
                  type="tel"
                  required
                  value={form.telefonePai}
                  onChange={(e) =>
                    setForm({ ...form, telefonePai: e.target.value })
                  }
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#0E3A68]"
                />
              </div>

              {/* DROPDOWN CUSTOMIZADO DE SUBPROGRAMA */}
              {iniciativa.subprogramas?.length > 0 && (
                <div className="relative">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    {isEn ? "Program of Interest" : "Programa de Interesse"}
                  </label>
                  <div
                    onClick={() => setIsSubDropdownOpen(!isSubDropdownOpen)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 cursor-pointer flex justify-between items-center"
                  >
                    <span className="truncate">
                      {form.subprogramaId ||
                        (isEn ? "Select program..." : "Escolher modalidade...")}
                    </span>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </div>
                  {isSubDropdownOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                      {iniciativa.subprogramas.map((s: any) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setForm({ ...form, subprogramaId: s.nome });
                            setIsSubDropdownOpen(false);
                          }}
                          className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer"
                        >
                          {s.nome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  {isEn ? "Child's Age & Notes" : "Idade da Criança / Questão"}
                </label>
                <textarea
                  rows={3}
                  value={form.mensagem}
                  onChange={(e) =>
                    setForm({ ...form, mensagem: e.target.value })
                  }
                  placeholder={
                    isEn
                      ? "E.g.: Looking for July dates for a 9-year-old..."
                      : "Ex: Procuro vagas para julho para criança de 9 anos..."
                  }
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#0E3A68] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                {submitting
                  ? "..."
                  : isEn
                  ? "Submit Request"
                  : "Receber Informações de Inscrição"}
              </button>
            </form>
          )}
        </aside>
      </div>
    </main>
  );
}
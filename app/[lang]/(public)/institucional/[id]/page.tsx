"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoPartilha from "../../components/BotaoPartilha";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&q=80&w=1200";

export default function DetalheIniciativaPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = use(params);
  const isEn = lang === "en";

  const [loading, setLoading] = useState(true);
  const [iniciativa, setIniciativa] = useState<any>(null);
  const [outrasAutarquias, setOutrasAutarquias] = useState<any[]>([]);

  useEffect(() => {
    const fetchDetalhes = async () => {
      setLoading(true);
      try {
        // 1. Busca via API Server-Side (contorna qualquer bloqueio de RLS e não faz joins inexistentes!)
        let itemEncontrado = null;
        const res = await fetch(
          `/api/institucional?id=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const json = await res.json();
          if (json.data) itemEncontrado = json.data;
        }

        // 2. Fallback direto ao Supabase sem joins que partam a query
        if (!itemEncontrado) {
          const { data } = await supabase
            .from("institucional_iniciativas")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (data) itemEncontrado = data;
        }

        setIniciativa(itemEncontrado);

        // 3. Carregar outras iniciativas do mesmo distrito para SEO interno
        const resLista = await fetch("/api/institucional", {
          cache: "no-store",
        });
        if (resLista.ok) {
          const jsonLista = await resLista.json();
          const todas = jsonLista.data || [];
          setOutrasAutarquias(
            todas.filter((x: any) => x.id !== id).slice(0, 3)
          );
        }
      } catch (err) {
        console.error("Erro ao carregar detalhes da autarquia:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetalhes();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xs uppercase tracking-widest animate-pulse">
        {isEn
          ? "Loading Municipal Program..."
          : "A carregar informações da autarquia..."}
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
          className="bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-md no-underline"
        >
          &larr; {isEn ? "Back to directory" : "Voltar a todas as Autarquias"}
        </Link>
      </div>
    );
  }

  const datasLimpaLista = (iniciativa.datas_encontradas || "")
    .split("|")
    .map((s: string) => s.trim())
    .filter((s: string) => s && !s.includes("2017"));

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* BARRA DE TOPO EXECUTIVA */}
      <div className="bg-[#0E3A68] text-white py-12 px-4 md:px-6 border-b border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-200 mb-6">
            <Link
              href={`/${lang}/institucional`}
              className="hover:text-white no-underline text-blue-200"
            >
              {isEn ? "Municipalities" : "Autarquias"}
            </Link>
            <span>/</span>
            <Link
              href={`/${lang}/institucional/distrito/${encodeURIComponent(
                (iniciativa.distrito || "Portugal")
                  .toLowerCase()
                  .replace(/\s+/g, "-")
              )}`}
              className="hover:text-white no-underline text-blue-200"
            >
              {iniciativa.distrito}
            </Link>
            <span>/</span>
            <span className="text-white truncate">{iniciativa.concelho}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-block bg-[#e2a41d] text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm mb-3">
                🏛️ {iniciativa.entidade_organizadora}
              </span>
              <h1 className="text-2xl md:text-4xl font-black m-0 tracking-tight leading-tight">
                {iniciativa.titulo}
              </h1>
              <p className="text-xs text-blue-100 font-bold m-0 mt-3">
                📍 Concelho: {iniciativa.concelho || iniciativa.distrito} (
                {iniciativa.distrito}) • 👶 Idades:{" "}
                {iniciativa.idade_min_global || 6} aos{" "}
                {iniciativa.idade_max_global || 16} anos
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
                  className="bg-[#e2a41d] hover:bg-[#d4991b] text-slate-950 font-black uppercase tracking-widest text-xs px-6 py-3.5 rounded-md no-underline shadow-md whitespace-nowrap"
                >
                  {isEn
                    ? "Visit Municipality Portal ↗"
                    : "Abrir Site da Câmara / Junta ↗"}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUNA ESQUERDA: DESCRIÇÃO E DATAS */}
        <div className="lg:col-span-7 space-y-6">
          {iniciativa.imagem_capa_url && (
            <div className="bg-white p-3 rounded-md border border-slate-200 shadow-sm">
              <img
                src={iniciativa.imagem_capa_url}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_COVER;
                }}
                alt={iniciativa.titulo}
                className="w-full max-h-80 object-cover rounded-sm"
              />
            </div>
          )}

          <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-widest m-0 mb-4 pb-3 border-b border-slate-100">
              {isEn
                ? "About this Municipal Program"
                : "Sobre o Programa Autárquico"}
            </h2>
            {iniciativa.descricao_html ? (
              <div
                className="text-sm text-slate-700 leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{ __html: iniciativa.descricao_html }}
              />
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed m-0">
                Iniciativa municipal promovida por{" "}
                <strong>{iniciativa.entidade_organizadora}</strong> para apoio
                às famílias durante as férias escolares.
              </p>
            )}
          </div>

          {datasLimpaLista.length > 0 && (
            <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest m-0 mb-3">
                📅{" "}
                {isEn
                  ? "Dates & Periods Mentioned"
                  : "Datas e Períodos Identificados"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {datasLimpaLista.map((dt: string, i: number) => (
                  <span
                    key={i}
                    className="bg-emerald-50 border border-emerald-200 text-[#167524] text-xs font-black px-3.5 py-2 rounded-sm"
                  >
                    🗓️ {dt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: ACESSO DIRETO À CÂMARA / JUNTA E CONTACTOS OFICIAIS */}
        <aside className="lg:col-span-5 bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-md space-y-6">
          <div>
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#167524] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-sm mb-2">
              Inscrição Direta na Autarquia
            </span>
            <h3 className="text-xl font-black text-slate-900 m-0">
              {isEn
                ? "Official Registration & Contacts"
                : "Portal Oficial e Contactos da Autarquia"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-0 leading-relaxed">
              {isEn
                ? "This is a public municipal program. Registrations are handled directly on the municipality's website or parish office."
                : "Este é um programa público promovido pela autarquia. As inscrições são realizadas diretamente nos canais oficiais abaixo:"}
            </p>
          </div>

          {/* BOTÕES DE REDIRECIONAMENTO DIRETO PARA O SITE DA CÂMARA / FORMULÁRIO */}
          <div className="space-y-3">
            {iniciativa.link_inscricao_extraido && (
              <a
                href={iniciativa.link_inscricao_extraido}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs py-4 px-5 rounded-md no-underline shadow-sm transition-colors"
              >
                📝{" "}
                {isEn
                  ? "Open Registration Form / Notice ↗"
                  : "Abrir Ficha / Portal de Inscrição ↗"}
              </a>
            )}

            {iniciativa.link_oficial && (
              <a
                href={iniciativa.link_oficial}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest text-xs py-4 px-5 rounded-md no-underline shadow-sm transition-colors"
              >
                🏛️{" "}
                {isEn
                  ? "Visit Official Municipality Page ↗"
                  : "Ver Página Oficial da Autarquia ↗"}
              </a>
            )}
          </div>

          {/* CONTACTOS DIRETOS DA CÂMARA / JUNTA */}
          <div className="bg-slate-50 p-5 rounded-md border border-slate-200 space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 m-0">
              Contactos Diretos da Entidade
            </h4>

            <p className="text-xs font-bold text-slate-800 m-0">
              🏛️ {iniciativa.entidade_organizadora}
            </p>

            {iniciativa.telefone_contato && (
              <p className="text-xs font-bold text-slate-700 m-0">
                📞 Telefone:{" "}
                <a
                  href={`tel:${iniciativa.telefone_contato}`}
                  className="text-[#0E3A68] underline"
                >
                  {iniciativa.telefone_contato}
                </a>
              </p>
            )}

            {iniciativa.email_contato && (
              <p className="text-xs font-bold text-slate-700 m-0 break-all">
                ✉️ E-mail:{" "}
                <a
                  href={`mailto:${iniciativa.email_contato.toLowerCase()}`}
                  className="text-[#0E3A68] underline"
                >
                  {iniciativa.email_contato.toLowerCase()}
                </a>
              </p>
            )}
          </div>

          {/* CTA PARA VER CAMPOS PRIVADOS COM VAGAS IMEDIATAS NO MESMO DISTRITO */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-600 m-0 mb-3">
              {isEn
                ? `Looking for private camps with instant online booking in ${iniciativa.distrito}?`
                : `Procura outros campos de férias privados com vagas imediatas em ${iniciativa.distrito}?`}
            </p>
            <Link
              href={`/${lang}/distrito/${encodeURIComponent(
                iniciativa.distrito || "Lisboa"
              )}`}
              className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-black uppercase tracking-widest text-[11px] py-3 rounded-md no-underline transition-colors"
            >
              🏕️ Ver Campos de Férias em {iniciativa.distrito} &rarr;
            </Link>
          </div>
        </aside>
      </div>

      {/* OUTRAS AUTARQUIAS PARA CROSS-LINKING SEO */}
      {outrasAutarquias.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 md:px-6 pt-14">
          <h3 className="text-base font-black text-slate-900 uppercase tracking-widest mb-4">
            Outras Iniciativas Municipais em Destaque
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {outrasAutarquias.map((o) => (
              <Link
                key={o.id}
                href={`/${lang}/institucional/${o.id}`}
                className="bg-white p-4 rounded-md border border-slate-200 hover:border-[#0E3A68] no-underline text-inherit shadow-sm"
              >
                <span className="text-[10px] font-black uppercase text-[#0E3A68] block mb-1">
                  📍 {o.concelho || o.distrito}
                </span>
                <h4 className="text-sm font-black text-slate-900 m-0 line-clamp-2">
                  {o.titulo}
                </h4>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
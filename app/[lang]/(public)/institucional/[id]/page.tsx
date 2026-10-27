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

  useEffect(() => {
    const fetchDetalhes = async () => {
      setLoading(true);

      // 1. Tenta procurar na tabela institucional_iniciativas
      const { data: dataIni } = await supabase
        .from("institucional_iniciativas")
        .select(
          `
          *,
          subprogramas:institucional_subprogramas(*),
          locais:institucional_locais(*)
        `
        )
        .eq("id", id)
        .maybeSingle();

      if (dataIni) {
        setIniciativa(dataIni);
        setLoading(false);
        return;
      }

      // 2. Fallback: Procura na tabela programas_institucionais
      const { data: dataProg } = await supabase
        .from("programas_institucionais")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (dataProg) {
        setIniciativa({
          id: dataProg.id,
          titulo: dataProg.titulo || dataProg.nome || "Programa Municipal",
          entidade_organizadora:
            dataProg.entidade_organizadora ||
            dataProg.entidade ||
            dataProg.autarquia ||
            "Câmara Municipal / Junta",
          descricao_html: dataProg.descricao_html || dataProg.descricao || "",
          imagem_capa_url:
            dataProg.imagem_capa_url ||
            dataProg.imagem_url ||
            dataProg.imagem ||
            FALLBACK_COVER,
          logotipo_url: dataProg.logotipo_url || null,
          distrito: dataProg.distrito || dataProg.Distrito || "Portugal",
          concelho: dataProg.concelho || dataProg.local || "",
          idade_min_global: dataProg.idade_min_global || dataProg.idade_min || 6,
          idade_max_global:
            dataProg.idade_max_global || dataProg.idade_max || 16,
          link_oficial:
            dataProg.link_oficial || dataProg.url_oficial || dataProg.link || null,
          subprogramas: [],
          locais: [],
        });
      }

      setLoading(false);
    };

    fetchDetalhes();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xs uppercase tracking-widest animate-pulse">
        {isEn
          ? "Loading Municipal Initiative..."
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
          className="bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs px-5 py-3 rounded-md no-underline"
        >
          &larr; {isEn ? "Back to directory" : "Voltar às Autarquias"}
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      <div className="bg-[#0E3A68] text-white py-12 px-4 md:px-6 border-b border-slate-800">
        <div className="max-w-5xl mx-auto">
          <Link
            href={`/${lang}/institucional`}
            className="text-xs font-black uppercase tracking-widest text-blue-200 hover:text-white no-underline inline-block mb-6"
          >
            &larr;{" "}
            {isEn
              ? "Back to Municipalities"
              : "Voltar ao Diretório de Autarquias"}
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-block bg-[#e2a41d] text-slate-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-sm mb-3">
                🏛️ {iniciativa.entidade_organizadora}
              </span>
              <h1 className="text-2xl md:text-4xl font-black m-0 tracking-tight">
                {iniciativa.titulo}
              </h1>
              <p className="text-xs text-blue-100 font-bold m-0 mt-2">
                📍 {iniciativa.concelho || iniciativa.distrito} • 👶{" "}
                {iniciativa.idade_min_global || 6} -{" "}
                {iniciativa.idade_max_global || 16}{" "}
                {isEn ? "years" : "anos"}
              </p>
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
                  className="bg-[#e2a41d] hover:bg-[#d4991b] text-slate-950 font-black uppercase tracking-widest text-xs px-6 py-3.5 rounded-md no-underline shadow-md whitespace-nowrap"
                >
                  {isEn
                    ? "Go to Municipality Website ↗"
                    : "Ver no Site da Câmara / Junta ↗"}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest m-0 mb-4 pb-3 border-b border-slate-100">
              {isEn ? "Program Information" : "Informações sobre a Iniciativa"}
            </h2>
            {iniciativa.descricao_html ? (
              <div
                className="text-sm text-slate-700 leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{ __html: iniciativa.descricao_html }}
              />
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed m-0">
                Este programa de férias e ocupação de tempos livres é organizado
                diretamente por{" "}
                <strong>{iniciativa.entidade_organizadora}</strong>. Para
                consultar o regulamento atualizado, escalões e submeter a
                inscrição, aceda ao website oficial da autarquia.
              </p>
            )}
          </div>

          {iniciativa.subprogramas?.length > 0 && (
            <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest m-0 mb-4 pb-3 border-b border-slate-100">
                Turnos e Subprogramas
              </h2>
              <div className="space-y-3">
                {iniciativa.subprogramas.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-4 bg-slate-50 rounded-md border border-slate-200"
                  >
                    <h4 className="m-0 text-sm font-black text-slate-900">
                      {sub.nome}
                    </h4>
                    <p className="m-0 mt-1 text-xs font-bold text-slate-500">
                      👶 {sub.idade_min || 6}-{sub.idade_max || 16} anos{" "}
                      {sub.localizacao_resumo
                        ? `• 📍 ${sub.localizacao_resumo}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 bg-white p-6 rounded-md border border-slate-200 shadow-sm space-y-4">
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#0E3A68] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-sm">
            Informação Pública
          </span>
          <h3 className="text-base font-black text-slate-900 m-0">
            Como funcionam as inscrições municipais?
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed m-0">
            Os programas autárquicos são geridos diretamente pelos serviços de
            educação/juventude da respetiva Câmara Municipal ou Junta de
            Freguesia.
          </p>

          {iniciativa.link_oficial ? (
            <a
              href={iniciativa.link_oficial}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-md no-underline shadow-sm"
            >
              Aceder ao Site Oficial da Autarquia ↗
            </a>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-600">
              Consulte diretamente os serviços da{" "}
              <strong>{iniciativa.entidade_organizadora}</strong> para conhecer
              as datas de abertura das inscrições presenciais ou online.
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
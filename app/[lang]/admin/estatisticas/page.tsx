"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function EstatisticasParceiroPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [ordenacao, setOrdenacao] = useState<"views" | "reservas" | "receita">(
    "views"
  );
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  const [totais, setTotais] = useState({
    visualizacoes: 0,
    camposAtivos: 0,
    favoritos: 0,
    reservasConfirmadas: 0,
    receitaBruta: 0,
    taxaConversaoMedia: 0,
  });

  useEffect(() => {
    async function fetchEstatisticas() {
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const uid = session.user.id;

        // 1. Obter os campos do organizador (CORRIGIDO: Usa diretamente session.user.id e colunas reais)
        const { data: campos } = await supabase
          .from("campos")
          .select(
            "id, nome, nome_en, ativo, status_aprovacao, rating_score, total_reviews"
          )
          .eq("organizador_id", uid);

        if (!campos || campos.length === 0) {
          setLoading(false);
          return;
        }

        const camposIds = campos.map((c) => c.id);

        // 2. Buscar em paralelo: Visualizações Mensais, Favoritos (Wishlists) e Reservas
        const [
          { data: viewsData },
          { data: favsData },
          { data: reservasData },
        ] = await Promise.all([
          supabase
            .from("campo_estatisticas_mensais")
            .select("campo_id, visualizacoes, mes_ano")
            .in("campo_id", camposIds),
          supabase
            .from("wishlist_campos")
            .select("campo_id")
            .in("campo_id", camposIds),
          supabase
            .from("reservas")
            .select("campo_id, status_pagamento, valor_total")
            .eq("organizador_id", uid),
        ]);

        // 3. Agregar todas as métricas por Campo
        let totalViewsGlobais = 0;
        let totalFavsGlobais = 0;
        let totalReservasGlobais = 0;
        let totalReceitaGlobal = 0;
        let countAtivos = 0;

        const camposComEstatisticas = campos.map((campo) => {
          const st = (campo.status_aprovacao || "").toLowerCase();
          const isOnline =
            campo.ativo &&
            (st === "aprovado" || st === "validado" || st === "ativo");
          if (isOnline) countAtivos++;

          // Visualizações
          const viewsDesteCampo =
            viewsData
              ?.filter((v) => v.campo_id === campo.id)
              .reduce((acc, curr) => acc + (Number(curr.visualizacoes) || 0), 0) ||
            0;

          // Favoritos
          const favsDesteCampo =
            favsData?.filter((f) => f.campo_id === campo.id).length || 0;

          // Reservas Confirmadas e Receita
          const reservasDesteCampo =
            reservasData?.filter(
              (r) =>
                r.campo_id === campo.id &&
                (r.status_pagamento === "Pago" ||
                  r.status_pagamento === "Sinal Pago")
            ) || [];

          const numReservas = reservasDesteCampo.length;
          const receitaCampo = reservasDesteCampo.reduce(
            (acc, curr) => acc + (Number(curr.valor_total) || 0),
            0
          );

          const taxaConversao =
            viewsDesteCampo > 0 ? (numReservas / viewsDesteCampo) * 100 : 0;

          totalViewsGlobais += viewsDesteCampo;
          totalFavsGlobais += favsDesteCampo;
          totalReservasGlobais += numReservas;
          totalReceitaGlobal += receitaCampo;

          return {
            ...campo,
            isOnline,
            nomeDisplay: isEn && campo.nome_en ? campo.nome_en : campo.nome,
            totalViews: viewsDesteCampo,
            totalFavs: favsDesteCampo,
            totalReservas: numReservas,
            receita: receitaCampo,
            conversao: taxaConversao,
          };
        });

        const conversaoGlobal =
          totalViewsGlobais > 0
            ? (totalReservasGlobais / totalViewsGlobais) * 100
            : 0;

        setStats(camposComEstatisticas);
        setTotais({
          visualizacoes: totalViewsGlobais,
          camposAtivos: countAtivos,
          favoritos: totalFavsGlobais,
          reservasConfirmadas: totalReservasGlobais,
          receitaBruta: totalReceitaGlobal,
          taxaConversaoMedia: conversaoGlobal,
        });
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEstatisticas();
  }, [isEn]);

  const statsOrdenados = [...stats].sort((a, b) => {
    if (ordenacao === "reservas") return b.totalReservas - a.totalReservas;
    if (ordenacao === "receita") return b.receita - a.receita;
    return b.totalViews - a.totalViews;
  });

  const maxViews = Math.max(...stats.map((s) => s.totalViews), 1);

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-9 w-9 border-4 border-slate-200 border-t-[#167524]"></div>
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
          {isEn ? "Calculating Analytics..." : "A calcular métricas de tráfego..."}
        </span>
      </div>
    );
  }

  const opcoesOrdenacao = [
    {
      id: "views",
      label: isEn ? "Most Viewed" : "Mais Visualizados",
    },
    {
      id: "reservas",
      label: isEn ? "Most Bookings" : "Mais Inscrições",
    },
    {
      id: "receita",
      label: isEn ? "Highest Revenue" : "Maior Faturação",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full font-sans pb-16">
      {/* CABEÇALHO */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#167524] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-2">
            {isEn ? "Real-Time Intelligence" : "Métricas em Tempo Real"}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 m-0 tracking-tight">
            {isEn ? "Performance & Analytics" : "Desempenho e Estatísticas"}
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 mb-0">
            {isEn
              ? "Track how many families are viewing, saving, and booking your camps on HelloCamp."
              : "Acompanhe quantas famílias estão a visualizar, guardar nos favoritos e inscrever-se nos seus programas."}
          </p>
        </div>

        {/* DROPDOWN CUSTOMIZADO DE ORDENAÇÃO */}
        <div className="relative min-w-[220px]">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
            {isEn ? "Sort Programs By" : "Ordenar Programas Por"}
          </label>
          <div
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 cursor-pointer flex items-center justify-between shadow-sm hover:border-[#167524]"
          >
            <span>
              {opcoesOrdenacao.find((o) => o.id === ordenacao)?.label}
            </span>
            <span className="text-[10px] text-slate-400 ml-2">▼</span>
          </div>
          {isSortDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSortDropdownOpen(false)}
              />
              <div className="absolute top-[calc(100%+6px)] right-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {opcoesOrdenacao.map((op) => (
                  <div
                    key={op.id}
                    onClick={() => {
                      setOrdenacao(op.id as any);
                      setIsSortDropdownOpen(false);
                    }}
                    className={`p-3 text-xs font-bold cursor-pointer transition-colors ${
                      ordenacao === op.id
                        ? "bg-emerald-50 text-[#167524] font-black"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {op.label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CARTÕES DE RESUMO GLOBAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {/* Visualizações */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-[#167524] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
            👁️
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest m-0 mb-1">
              {isEn ? "Total Camp Views" : "Visualizações Totais"}
            </p>
            <h2 className="text-3xl font-black text-slate-900 m-0">
              {totais.visualizacoes.toLocaleString("pt-PT")}
            </h2>
          </div>
        </div>

        {/* Favoritos */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
            ❤️
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest m-0 mb-1">
              {isEn ? "Saved in Wishlists" : "Guardado em Favoritos"}
            </p>
            <h2 className="text-3xl font-black text-slate-900 m-0">
              {totais.favoritos.toLocaleString("pt-PT")}
            </h2>
          </div>
        </div>

        {/* Reservas Confirmadas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 text-[#0E3A68] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
            🎫
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest m-0 mb-1">
              {isEn ? "Confirmed Bookings" : "Inscrições Confirmadas"}
            </p>
            <h2 className="text-3xl font-black text-[#167524] m-0">
              {totais.reservasConfirmadas}
            </h2>
          </div>
        </div>

        {/* Taxa de Conversão / Receita */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-[#e2a41d] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
            📈
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest m-0 mb-1">
              {isEn ? "Conversion Rate" : "Taxa de Conversão"}
            </p>
            <h2 className="text-3xl font-black text-slate-900 m-0">
              {totais.taxaConversaoMedia.toFixed(1)}%
            </h2>
          </div>
        </div>
      </div>

      {/* TABELA E GRÁFICO DE BARRAS DE PERFORMANCE POR CAMPO */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 m-0">
            {isEn
              ? "Detailed Funnel by Program"
              : "Funil de Desempenho por Programa"}
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {totais.camposAtivos} {isEn ? "Active Online" : "Ativos Online"}
          </span>
        </div>

        {statsOrdenados.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-4xl block mb-3">📊</span>
            <p className="text-slate-600 font-bold text-sm m-0 mb-4">
              {isEn
                ? "You do not have any camps created yet."
                : "Ainda não tem campos criados para registar estatísticas."}
            </p>
            <Link
              href={`/${lang}/admin/campos/novo`}
              className="inline-block bg-[#167524] text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl no-underline"
            >
              + {isEn ? "Create First Camp" : "Criar Primeiro Campo"}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50/30">
                  <th className="px-6 py-4 font-black">
                    {isEn ? "Program Name" : "Nome do Programa"}
                  </th>
                  <th className="px-6 py-4 font-black">
                    {isEn ? "Status" : "Estado"}
                  </th>
                  <th className="px-6 py-4 font-black text-center">
                    {isEn ? "Views" : "Visualizações"}
                  </th>
                  <th className="px-6 py-4 font-black text-center">
                    {isEn ? "Wishlists" : "Favoritos"}
                  </th>
                  <th className="px-6 py-4 font-black text-center">
                    {isEn ? "Bookings" : "Inscrições"}
                  </th>
                  <th className="px-6 py-4 font-black text-right">
                    {isEn ? "Gross Revenue" : "Volume Bruto"}
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {statsOrdenados.map((campo) => {
                  const pctBarra = Math.round(
                    (campo.totalViews / maxViews) * 100
                  );
                  return (
                    <tr
                      key={campo.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-5 min-w-[240px]">
                        <Link
                          href={`/${lang}/campo/${campo.id}`}
                          target="_blank"
                          className="font-black text-slate-900 hover:text-[#167524] no-underline block mb-1.5"
                        >
                          {campo.nomeDisplay} ↗
                        </Link>
                        {/* Barra visual de tráfego relativo */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden max-w-[180px]">
                          <div
                            className="bg-[#167524] h-full rounded-full"
                            style={{ width: `${Math.max(pctBarra, 4)}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {campo.isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#167524] border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#167524]"></span>
                            {isEn ? "Online" : "Online"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            {isEn ? "Paused / Review" : "Pausado / Revisão"}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5 text-center font-black text-slate-900">
                        <span className="bg-slate-100 px-3 py-1 rounded-lg">
                          {campo.totalViews}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-center font-black text-red-500">
                        {campo.totalFavs > 0 ? `❤️ ${campo.totalFavs}` : "0"}
                      </td>

                      <td className="px-6 py-5 text-center font-black text-[#167524]">
                        {campo.totalReservas > 0 ? (
                          <span className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                            {campo.totalReservas}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      <td className="px-6 py-5 text-right font-black text-slate-900">
                        {campo.receita > 0 ? `${campo.receita.toFixed(2)}€` : "0.00€"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
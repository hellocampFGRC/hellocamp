"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EstatisticasParceiroPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [campos, setCampos] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [wishlistsCountMap, setWishlistsCountMap] = useState<
    Record<string, number>
  >({});
  const [taxaBaseParceiro, setTaxaBaseParceiro] = useState<number>(12);

  useEffect(() => {
    const carregarEstatisticas = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${lang}/login`);
        return;
      }

      const uid = session.user.id;

      const [{ data: perfilData }, { data: camposData }, { data: reservasData }] =
        await Promise.all([
          supabase
            .from("perfis")
            .select("taxa_comissao")
            .eq("id", uid)
            .maybeSingle(),
          supabase
            .from("campos")
            .select("*")
            .eq("organizador_id", uid)
            .order("created_at", { ascending: false }),
          supabase
            .from("reservas")
            .select("*, criancas(*)")
            .eq("organizador_id", uid),
        ]);

      if (perfilData?.taxa_comissao) {
        setTaxaBaseParceiro(Number(perfilData.taxa_comissao));
      }

      const listaCampos = camposData || [];
      setCampos(listaCampos);
      setReservas(reservasData || []);

      const camposIds = listaCampos.map((c: any) => c.id);
      if (camposIds.length > 0) {
        const [{ data: wishData }, { data: revData }] = await Promise.all([
          supabase
            .from("wishlist_campos")
            .select("campo_id")
            .in("campo_id", camposIds),
          supabase
            .from("reviews")
            .select("*")
            .in("campo_id", camposIds)
            .order("created_at", { ascending: false }),
        ]);

        const counts: Record<string, number> = {};
        (wishData || []).forEach((w: any) => {
          counts[w.campo_id] = (counts[w.campo_id] || 0) + 1;
        });
        setWishlistsCountMap(counts);
        setReviews(revData || []);
      }

      setLoading(false);
    };

    carregarEstatisticas();
  }, [lang, router]);

  if (loading) {
    return (
      <div className="p-12 text-center font-black text-xs uppercase tracking-widest text-slate-400 animate-pulse">
        {isEn
          ? "Loading Analytics & Performance..."
          : "A calcular estatísticas, ocupação e métricas..."}
      </div>
    );
  }

  const reservasConfirmadas = reservas.filter(
    (r: any) =>
      r.status_pagamento === "Pago" ||
      r.status_pagamento === "Sinal Pago" ||
      r.status_pagamento === "Externo"
  );

  const totalInscritos = reservasConfirmadas.length;
  const totalVagasOferecidas = campos.reduce(
    (acc, c: any) => acc + (Number(c.vagas_totais) || 0),
    0
  );
  const taxaOcupacaoGlobal =
    totalVagasOferecidas > 0
      ? Math.min(100, Math.round((totalInscritos / totalVagasOferecidas) * 100))
      : 0;

  const receitaBrutaTotal = reservasConfirmadas.reduce(
    (acc, r: any) =>
      acc + (Number(r.valor_pago) || Number(r.valor_total) || 0),
    0
  );
  const ticketMedio =
    totalInscritos > 0 ? receitaBrutaTotal / totalInscritos : 0;

  const totalWishlists = Object.values(wishlistsCountMap).reduce(
    (a, b) => a + b,
    0
  );

  const countOnline = reservasConfirmadas.filter(
    (r: any) => r.status_pagamento !== "Externo"
  ).length;
  const countExterno = reservasConfirmadas.filter(
    (r: any) => r.status_pagamento === "Externo"
  ).length;

  return (
    <div className="max-w-6xl mx-auto font-sans text-[#0F172A] pb-20 space-y-8">
      {/* CABEÇALHO */}
      <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="inline-block bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-2">
            {isEn ? "Business Intelligence" : "Inteligência e Métricas B2B"}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#0F172A] m-0 tracking-tight">
            {isEn
              ? "Performance, Occupancy & Analytics"
              : "Estatísticas, Taxa de Ocupação e Desempenho"}
          </h1>
          <p className="text-slate-500 mt-1 mb-0 text-xs md:text-sm font-medium">
            {isEn
              ? "Analyze spot occupancy, average ticket size, wishlist saves, and parent reviews across your programs."
              : "Analise a ocupação de vagas, ticket médio, favoritos das famílias e avaliações de cada campo."}
          </p>
        </div>

        <Link
          href={`/${lang}/admin/reservas`}
          className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-md no-underline shrink-0 shadow-sm"
        >
          📋 {isEn ? "View All Bookings" : "Ver Inscrições"}
        </Link>
      </div>

      {/* KPIs GLOBAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-md border border-slate-200 border-b-4 border-b-[#16A34A] shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            {isEn ? "Global Occupancy" : "Taxa de Ocupação Global"}
          </span>
          <span className="text-3xl font-black text-[#16A34A] block">
            {taxaOcupacaoGlobal}%
          </span>
          <span className="text-[11px] font-bold text-slate-500 mt-1 block">
            {totalInscritos} / {totalVagasOferecidas}{" "}
            {isEn ? "spots filled" : "vagas preenchidas"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-md border border-slate-200 border-b-4 border-b-[#2563EB] shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            {isEn ? "Average Ticket" : "Ticket Médio por Inscrição"}
          </span>
          <span className="text-3xl font-black text-[#2563EB] block">
            {ticketMedio.toFixed(0)}€
          </span>
          <span className="text-[11px] font-bold text-slate-500 mt-1 block">
            Volume total: {receitaBrutaTotal.toFixed(0)}€
          </span>
        </div>

        <div className="bg-white p-5 rounded-md border border-slate-200 border-b-4 border-b-[#F43F5E] shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            {isEn ? "Saved in Wishlists" : "Guardado em Favoritos"}
          </span>
          <span className="text-3xl font-black text-[#F43F5E] block">
            {totalWishlists}
          </span>
          <span className="text-[11px] font-bold text-slate-500 mt-1 block">
            Famílias com interesse ativo
          </span>
        </div>

        <div className="bg-white p-5 rounded-md border border-slate-200 border-b-4 border-b-[#F59E0B] shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
            {isEn ? "Channel Split" : "Origem das Inscrições"}
          </span>
          <span className="text-2xl font-black text-[#0F172A] block">
            {countOnline} Online • {countExterno} Ext.
          </span>
          <span className="text-[11px] font-bold text-slate-500 mt-1 block">
            HelloCamp vs Registo Manual
          </span>
        </div>
      </div>

      {/* DESEMPENHO INDIVIDUAL POR CAMPO */}
      <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm">
        <h2 className="text-base font-black uppercase tracking-widest text-[#0F172A] m-0 mb-6 pb-3 border-b border-slate-100">
          🏕️ {isEn ? "Performance Breakdown by Program" : "Desempenho e Ocupação por Campo"}
        </h2>

        {campos.length === 0 ? (
          <p className="text-xs font-bold text-slate-400 m-0">
            Ainda não existem campos criados.
          </p>
        ) : (
          <div className="space-y-5">
            {campos.map((c: any) => {
              const resCampo = reservasConfirmadas.filter(
                (r: any) => r.campo_id === c.id
              );
              const inscritosCampo = resCampo.length;
              const vagasTotais = Number(c.vagas_totais) || 50;
              const pctOcupacao = Math.min(
                100,
                Math.round((inscritosCampo / vagasTotais) * 100)
              );
              const faturacaoCampo = resCampo.reduce(
                (acc, r: any) =>
                  acc + (Number(r.valor_pago) || Number(r.valor_total) || 0),
                0
              );
              const favs = wishlistsCountMap[c.id] || 0;

              return (
                <div
                  key={c.id}
                  className="p-5 bg-[#F8FAFC] rounded-md border border-slate-200 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="bg-[#2563EB] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mr-2">
                        {c.categoria || "Campo"}
                      </span>
                      <strong className="text-sm font-black text-[#0F172A]">
                        {c.nome}
                      </strong>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-black">
                      <span className="text-[#16A34A]">
                        💰 {faturacaoCampo.toFixed(0)}€
                      </span>
                      <span className="text-[#F43F5E]">❤️ {favs} favs</span>
                      <span className="text-[#0F172A]">
                        👥 {inscritosCampo}/{vagasTotais} vagas ({pctOcupacao}%)
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso de Ocupação */}
                  <div className="w-full h-3 bg-slate-200 rounded-md overflow-hidden">
                    <div
                      className="h-full bg-[#16A34A] transition-all duration-500"
                      style={{ width: `${pctOcupacao}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ÚLTIMAS AVALIAÇÕES DOS PAIS (REVIEWS) */}
      <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm">
        <h2 className="text-base font-black uppercase tracking-widest text-[#0F172A] m-0 mb-6 pb-3 border-b border-slate-100">
          ⭐ {isEn ? "Parent Reviews & Feedback" : "Avaliações e Testemunhos dos Pais"} (
          {reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <div className="p-8 text-center bg-[#F8FAFC] rounded-md border border-dashed border-slate-300">
            <p className="text-xs font-bold text-slate-500 m-0">
              {isEn
                ? "No reviews submitted yet. Share your public camp links with past families!"
                : "Ainda não existem avaliações publicadas. Partilhe a página dos seus campos com as famílias participantes!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev: any) => {
              const campoObj = campos.find((c: any) => c.id === rev.campo_id);
              return (
                <div
                  key={rev.id}
                  className="p-4 bg-[#F8FAFC] rounded-md border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-xs font-black text-[#0F172A]">
                      {rev.autor_nome || "Encarregado de Educação"}
                    </strong>
                    <span className="bg-[#F59E0B] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                      ★ {rev.rating || 5} / 5
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic m-0 mb-2">
                    &ldquo;{rev.comentario}&rdquo;
                  </p>
                  <span className="text-[10px] font-bold text-[#2563EB]">
                    🏕️ {campoObj?.nome || "Campo"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
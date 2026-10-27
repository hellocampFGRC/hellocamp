"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../../components/BotaoFavorito";

export default function FavoritosCliente({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [wishlists, setWishlists] = useState<any[]>([]);
  const [listaAtivaId, setListaAtivaId] = useState<string>("todas");
  const [camposFavoritos, setCamposFavoritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const carregarFavoritos = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    // 1. Buscar todas as wishlists do utilizador
    const { data: wishData } = await supabase
      .from("wishlists")
      .select("id, nome, token_partilha")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    const listas = wishData || [];
    setWishlists(listas);

    if (listas.length === 0) {
      setCamposFavoritos([]);
      setLoading(false);
      return;
    }

    const listasIds = listas.map((l) => l.id);

    // 2. Buscar as ligações wishlist_campos
    const { data: relacoes } = await supabase
      .from("wishlist_campos")
      .select("wishlist_id, campo_id")
      .in("wishlist_id", listasIds);

    if (!relacoes || relacoes.length === 0) {
      setCamposFavoritos([]);
      setLoading(false);
      return;
    }

    const camposIds = Array.from(
      new Set(relacoes.map((r) => r.campo_id).filter(Boolean))
    );

    // 3. Buscar os dados completos dos campos
    const { data: camposData } = await supabase
      .from("campos")
      .select("*")
      .in("id", camposIds);

    const camposComListas = (camposData || []).map((c) => {
      const listasOndeEsta = relacoes
        .filter((r) => r.campo_id === c.id)
        .map((r) => r.wishlist_id);

      let precoMin = Number(c.preco) || 0;
      if (!precoMin && Array.isArray(c.pacotes) && c.pacotes.length > 0) {
        const precos = c.pacotes.flatMap((p: any) =>
          Array.isArray(p.variantes)
            ? p.variantes
                .map((v: any) => Number(v.preco) || 0)
                .filter((v: number) => v > 0)
            : []
        );
        if (precos.length > 0) precoMin = Math.min(...precos);
      }

      return {
        ...c,
        precoCalc: precoMin,
        listasIds: listasOndeEsta,
      };
    });

    setCamposFavoritos(camposComListas);
    setLoading(false);
  };

  useEffect(() => {
    carregarFavoritos();
  }, []);

  const partilharLista = async (token: string) => {
    const url = `${window.location.origin}/${lang}/lista/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2500);
    } catch {}
  };

  const camposExibidos =
    listaAtivaId === "todas"
      ? camposFavoritos
      : camposFavoritos.filter((c) => c.listasIds?.includes(listaAtivaId));

  if (loading) {
    return (
      <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">
        {isEn
          ? "Loading your wishlist..."
          : "A carregar os seus favoritos..."}
      </div>
    );
  }

  const listaSelecionadaObj = wishlists.find((w) => w.id === listaAtivaId);

  return (
    <div className="max-w-[1200px] mx-auto pb-20 font-sans">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 m-0 tracking-tight">
            {isEn ? "My Wishlists" : "Os Meus Favoritos"}
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base font-medium mb-0">
            {isEn
              ? "Holiday programs saved to review and share with family and friends."
              : "Programas de férias guardados para analisar e partilhar em família."}
          </p>
        </div>

        {listaSelecionadaObj?.token_partilha && (
          <button
            type="button"
            onClick={() => partilharLista(listaSelecionadaObj.token_partilha)}
            className="bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest text-xs px-5 py-3 rounded-xl cursor-pointer shadow-sm transition-colors"
          >
            {copiedToken === listaSelecionadaObj.token_partilha
              ? isEn
                ? "✓ Link Copied!"
                : "✓ Link de Partilha Copiado!"
              : isEn
              ? "🔗 Share This List"
              : "🔗 Partilhar Esta Lista"}
          </button>
        )}
      </div>

      {/* BARRA DE LISTAS (ABAS) */}
      {wishlists.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            type="button"
            onClick={() => setListaAtivaId("todas")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
              listaAtivaId === "todas"
                ? "bg-[#0E3A68] text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {isEn ? "All Saved" : "Todos os Guardados"} ({camposFavoritos.length})
          </button>

          {wishlists.map((w) => (
            <div key={w.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setListaAtivaId(w.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${
                  listaAtivaId === w.id
                    ? "bg-[#0E3A68] text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                ❤️ {w.nome}
              </button>
            </div>
          ))}
        </div>
      )}

      {camposExibidos.length === 0 ? (
        <div className="text-center p-16 md:p-24 bg-white border border-dashed border-slate-300 rounded-[2rem] shadow-sm">
          <span className="text-5xl block mb-6 opacity-50">❤️</span>
          <p className="text-slate-500 text-base md:text-lg mb-8 font-medium">
            {isEn
              ? "Your wishlist is currently empty."
              : "Ainda não adicionou nenhum programa aos seus favoritos."}
          </p>
          <Link
            href={`/${lang}/pesquisa`}
            className="inline-block bg-[#0E3A68] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:bg-[#0b2b4d] transition-all no-underline"
          >
            {isEn ? "Explore Camps" : "Explorar Programas"}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {camposExibidos.map((campo) => {
            const nomeVisivel =
              isEn && campo.nome_en ? campo.nome_en : campo.nome;
            const localVisivel =
              isEn && campo.local_en
                ? campo.local_en
                : campo.Distrito || campo.local;

            return (
              <div
                key={campo.id}
                className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden flex flex-col relative shadow-sm hover:shadow-lg hover:border-[#0E3A68]/30 transition-all duration-300 group"
              >
                <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md rounded-full shadow-sm">
                  <BotaoFavorito campoId={campo.id} />
                </div>

                <Link
                  href={`/${lang}/campo/${campo.id}`}
                  className="no-underline text-inherit flex flex-col flex-1"
                >
                  <div className="h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={campo.imagem || "/og-image.jpg"}
                      alt={nomeVisivel}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <span className="text-[10px] font-black text-[#e2a41d] uppercase tracking-widest bg-[#e2a41d]/10 px-3 py-1 rounded-md self-start">
                      {campo.categoria || "Geral"}
                    </span>
                    <h3 className="mt-3 mb-2 text-lg font-black text-slate-900 leading-tight group-hover:text-[#0E3A68] transition-colors line-clamp-2">
                      {nomeVisivel}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 m-0">
                      📍 {localVisivel}
                    </p>

                    <div className="mt-auto pt-5 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md">
                        {campo.idade}
                      </span>
                      <span className="text-xl font-black text-[#0E3A68]">
                        {campo.precoCalc > 0
                          ? `${campo.precoCalc}€`
                          : isEn
                          ? "Upon Request"
                          : "Sob Consulta"}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
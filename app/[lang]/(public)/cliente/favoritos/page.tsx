"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../../components/BotaoFavorito";
import React from "react";

export default function FavoritosCliente({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [camposFavoritos, setCamposFavoritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarFavoritos = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data: favRows, error: favErr } = await supabase
      .from("favoritos")
      .select("campo_id")
      .eq("user_id", session.user.id);

    if (favErr) {
      console.error("Erro ao carregar favoritos:", favErr);
      setLoading(false);
      return;
    }

    if (favRows && favRows.length > 0) {
      const listaIds = favRows.map(f => f.campo_id);

      // Proteção Supabase: Se a lista estiver vazia, o `.in()` falha.
      if (listaIds.length > 0) {
        const { data: camposData } = await supabase
          .from("campos")
          .select("*")
          .in("id", listaIds)
          .eq("ativo", true); // Só mostra se ainda estiver ativo!

        setCamposFavoritos(camposData || []);
      }
    } else {
      setCamposFavoritos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarFavoritos();
  }, []);

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">{isEn ? 'Loading your wishlist...' : 'A carregar os seus favoritos...'}</div>;

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-10 pb-20 font-sans">
      
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 m-0 tracking-tight">
          {isEn ? 'My Wishlist' : 'Os Meus Favoritos'}
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">
          {isEn ? 'Holiday programs saved for later review.' : 'Programas de férias guardados para analisar em família.'}
        </p>
      </div>

      {camposFavoritos.length === 0 ? (
        <div className="text-center p-16 md:p-24 bg-white border border-dashed border-slate-300 rounded-[2rem] shadow-sm">
          <span className="text-5xl block mb-6 opacity-50">❤️</span>
          <p className="text-slate-500 text-base md:text-lg mb-8 font-medium">
            {isEn ? 'Your wishlist is currently empty.' : 'Ainda não adicionou nenhuma colónia aos seus favoritos.'}
          </p>
          <Link href={`/${lang}/pesquisa`} className="inline-block bg-[#0E3A68] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:bg-[#0b2b4d] hover:-translate-y-0.5 transition-all no-underline">
            {isEn ? 'Explore Camps' : 'Explorar Programas'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {camposFavoritos.map((campo) => {
            const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
            const localVisivel = isEn && campo.local_en ? campo.local_en : campo.local;

            return (
              <div 
                key={campo.id} 
                className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden flex flex-col relative shadow-sm hover:shadow-lg hover:border-[#0E3A68]/30 transition-all duration-300 group"
              >
                <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-md rounded-full shadow-sm">
                  <BotaoFavorito campoId={campo.id} />
                </div>

                <Link href={`/${lang}/campo/${campo.id}`} className="no-underline text-inherit flex flex-col flex-1">
                  <div className="h-44 w-full overflow-hidden bg-slate-100">
                    <img src={campo.imagem || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=600'} alt={nomeVisivel} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <span className="text-[10px] font-black text-[#e2a41d] uppercase tracking-widest bg-[#e2a41d]/10 px-3 py-1 rounded-md self-start">{campo.categoria || 'Geral'}</span>
                    <h3 className="mt-3 mb-2 text-lg font-black text-slate-900 leading-tight group-hover:text-[#0E3A68] transition-colors line-clamp-2">{nomeVisivel}</h3>
                    <p className="text-xs font-bold text-slate-500 m-0">📍 {localVisivel}</p>
                    
                    <div className="mt-auto pt-5 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{campo.idade}</span>
                      <span className="text-xl font-black text-[#0E3A68]">{campo.preco === 0 ? 'Sob Consulta' : `${campo.preco}€`}</span>
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
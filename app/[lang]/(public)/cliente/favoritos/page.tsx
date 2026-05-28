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

    if (favRows && favRows.length > 0 && !favErr) {
      const listaIds = favRows.map(f => f.campo_id);

      const { data: camposData } = await supabase
        .from("campos")
        .select("*")
        .in("id", listaIds);

      setCamposFavoritos(camposData || []);
    } else {
      setCamposFavoritos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarFavoritos();
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>{isEn ? 'Loading your wishlist...' : 'A carregar os seus favoritos...'}</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
          {isEn ? 'My Wishlist' : 'Os Meus Favoritos'}
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>
          {isEn ? 'Holiday programs saved for later review.' : 'Programas de férias guardados para análise ou inscrição posterior.'}
        </p>
      </div>

      {camposFavoritos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'white', border: '2px dashed #cbd5e1', borderRadius: '1.5rem' }}>
          <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '1.5rem' }}>
            {isEn ? 'Your wishlist is currently empty.' : 'Ainda não adicionou nenhuma colónia aos seus favoritos.'}
          </p>
          <Link href={`/${lang}`} style={{ display: 'inline-block', backgroundColor: '#0f172a', color: 'white', padding: '0.875rem 1.75rem', borderRadius: '0.75rem', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' }}>
            {isEn ? 'Explore Camps' : 'Explorar Programas'}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {camposFavoritos.map((campo) => {
            const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
            const localVisivel = isEn && campo.local_en ? campo.local_en : campo.local;

            return (
              <div 
                key={campo.id} 
                style={{ backgroundColor: 'white', borderRadius: '1.25rem', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}
              >
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
                  <BotaoFavorito campoId={campo.id} />
                </div>

                <Link href={`/${lang}/campo/${campo.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ height: '160px', width: '100%', overflow: 'hidden' }}>
                    <img src={campo.imagem} alt={nomeVisivel} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#059669', textTransform: 'uppercase' }}>{campo.categoria}</span>
                    <h3 style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>{nomeVisivel}</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>📍 {localVisivel}</p>
                    
                    <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{campo.idade}</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#059669' }}>{campo.preco}€</span>
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
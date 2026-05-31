import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import React from "react";

// 1. CHEF SEO PARA A WISHLIST
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ lang: string; token: string }> 
}): Promise<Metadata> {
  const { token } = await params;
  const { data: lista } = await supabase.from('wishlists').select('nome').eq('token_partilha', token).single();
  
  if (!lista) return { title: 'Lista Partilhada | HelloCamp' };
  return { 
    title: `${lista.nome} | HelloCamp`,
    description: 'Explore esta seleção de campos de férias na HelloCamp.'
  };
}

export default async function ListaPartilhada({ 
  params 
}: { 
  params: Promise<{ lang: string; token: string }> 
}) {
  const { lang, token } = await params;
  const isEn = lang === 'en';

  // Busca a wishlist e os campos lá dentro (através da tabela relacional wishlist_campos)
  const { data: lista } = await supabase
    .from("wishlists")
    .select(`
      nome, 
      created_at,
      wishlist_campos (
        campos ( * )
      )
    `)
    .eq("token_partilha", token)
    .single();

  if (!lista) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans p-6 text-center">
        <h1 className="text-3xl font-black text-slate-900">{isEn ? 'List not found' : 'Lista não encontrada'}</h1>
        <p className="text-slate-500 mt-2 mb-6">{isEn ? 'This link might be broken or private.' : 'Este link pode estar quebrado ou a lista é privada.'}</p>
        <Link href={`/${lang}`} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
          {isEn ? 'Go to HelloCamp' : 'Ir para a HelloCamp'}
        </Link>
      </div>
    );
  }

  // Limpa o array aninhado de campos
  const camposDaLista = lista.wishlist_campos
    .map((wc: any) => wc.campos)
    .filter((campo: any) => campo !== null); // Remove eventuais nulos se um campo foi apagado da DB

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* HEADER DA WISHLIST */}
      <section className="bg-white border-b border-slate-200 pt-16 pb-12 px-4 md:px-6 mb-8 text-center">
        <div className="max-w-[800px] mx-auto">
          <span className="inline-block bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            {isEn ? 'Shared Wishlist' : 'Lista Partilhada'}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">{lista.nome}</h1>
          <p className="text-sm font-bold text-slate-400">
            {camposDaLista.length} {isEn ? 'saved programs' : 'programas guardados'}
          </p>
        </div>
      </section>

      {/* GRID DE CAMPOS GUARDADOS */}
      <section className="max-w-[1100px] mx-auto px-4 md:px-6">
        {camposDaLista.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-lg text-slate-500 font-bold">{isEn ? 'This list is currently empty.' : 'Esta lista ainda não tem campos guardados.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {camposDaLista.map((campo: any) => {
              const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const localVisivel = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
              const precoVisivel = campo.preco || (campo.turnos && campo.turnos.length > 0 ? campo.turnos[0].preco : 0);

              return (
                <div key={campo.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 relative shadow-sm hover:shadow-xl transition-all duration-300">
                  <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">Explorar</span></Link>

                  <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    <img src={campo.imagem} alt={nomeVisivel} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase text-white rounded-full z-0">
                      {campo.categoria}
                    </div>
                  </div>

                  <div className="flex flex-col p-5 flex-1 pointer-events-none">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">📍 {localVisivel}</span>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">{nomeVisivel}</h3>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                      <p className="text-xl font-black text-emerald-600 m-0">{precoVisivel}€</p>
                      <span className="text-sm font-bold text-[#EBA914] transition-transform group-hover:translate-x-1">{isEn ? 'Explore' : 'Explorar'} &rarr;</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CALL TO ACTION PARA OS AVÓS / AMIGOS */}
      <section className="max-w-[600px] mx-auto mt-20 text-center px-4">
        <p className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">{isEn ? 'Powered by' : 'Uma funcionalidade'}</p>
        <Link href={`/${lang}`} className="inline-block text-2xl font-black text-slate-900 hover:text-emerald-600 transition-colors no-underline tracking-tight">
          HelloCamp
        </Link>
      </section>

    </main>
  );
}
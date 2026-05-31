"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import React from "react";
import SugestoesMagicas from "../../components/SugestoesMagicas"; // Confirme se o caminho (import) está correto para si

export default function DashboardCliente({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [reservas, setReservas] = useState<any[]>([]);
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [primeiraCriancaId, setPrimeiraCriancaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Buscar Reservas
      const { data: reservasData } = await supabase
        .from('reservas')
        .select(`*, campos ( id, nome, nome_en, imagem, local, local_en ), criancas ( nome )`)
        .eq('user_id', session.user.id) // ATENÇÃO: No código original estava 'cliente_id'. Mudei para 'user_id' que é o padrão da Supabase. Se na sua DB se chamar cliente_id, altere de volta!
        .order('created_at', { ascending: false });
      setReservas(reservasData || []);

      // 2. Buscar Wishlists e contar os campos
      const { data: wishData } = await supabase
        .from('wishlists')
        .select(`id, nome, token_partilha, wishlist_campos(count)`)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setWishlists(wishData || []);

      // 3. Buscar uma Criança para as Sugestões Mágicas
      const { data: criancasData } = await supabase.from('criancas').select('id').eq('user_id', session.user.id).limit(1);
      if (criancasData && criancasData.length > 0) {
        setPrimeiraCriancaId(criancasData[0].id);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const copiarLinkPartilha = (token: string) => {
    const url = `${window.location.origin}/${lang}/lista/${token}`;
    navigator.clipboard.writeText(url);
    alert(isEn ? "Link copied to clipboard!" : "Link copiado para a área de transferência!");
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-bold">{isEn ? 'Loading your dashboard...' : 'A carregar o seu resumo...'}</div>;

  return (
    <div className="max-w-[1000px] mx-auto p-4 font-sans">
      
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 m-0 tracking-tight">
          {isEn ? 'Upcoming Camps' : 'Próximos Campos'}
        </h1>
        <p className="text-slate-500 mt-2 text-base font-medium">
          {isEn ? 'View your active programs and child schedules.' : 'Consulte os programas ativos e as inscrições dos seus filhos.'}
        </p>
      </div>

      {/* MÓDULO INTELIGENTE: SUGESTÕES MÁGICAS */}
      {primeiraCriancaId && (
        <SugestoesMagicas criancaId={primeiraCriancaId} lang={lang} />
      )}

      {/* SECÇÃO 1: RESERVAS */}
      {reservas.length === 0 ? (
        <div className="text-center p-12 sm:p-20 bg-white border-2 border-dashed border-slate-300 rounded-3xl mb-12">
          <p className="text-slate-500 text-lg mb-6 font-medium">
            {isEn ? 'No camp enrollments found yet.' : 'Ainda não inscreveu nenhum participante em programas de férias.'}
          </p>
          <Link href={`/${lang}/pesquisa`} className="inline-block bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-sm hover:bg-slate-800 transition-colors">
            {isEn ? 'Browse Camps' : 'Encontrar Programas'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {reservas.map((reserva) => {
            const campo = reserva.campos;
            const nomeCampo = isEn && campo?.nome_en ? campo.nome_en : campo?.nome;
            const localCampo = isEn && campo?.local_en ? campo.local_en : campo?.local;

            return (
              <Link 
                key={reserva.id} 
                href={`/${lang}/campo/${campo?.id}`}
                className="group flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                  <img src={campo?.imagem || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=600'} alt={nomeCampo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-[10px] font-black tracking-widest uppercase shadow-sm">
                    {reserva.turno_nome || 'Turno'}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-black text-slate-900 m-0 leading-tight">{nomeCampo}</h3>
                  <p className="text-sm font-bold text-slate-500 mt-2 mb-6">📍 {localCampo}</p>
                  
                  <div className="border-t border-slate-100 pt-5 mt-auto flex justify-between items-end">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{isEn ? 'PARTICIPANT' : 'PARTICIPANTE'}</span>
                      <span className="text-sm font-bold text-slate-700">👦 {reserva.criancas?.nome}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">TOTAL</span>
                      <span className="text-lg font-black text-emerald-600 leading-none">{reserva.valor_total}€</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* SECÇÃO 2: WISHLISTS (Ideias para o Verão) */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 mb-6">{isEn ? 'Your Wishlists' : 'As Suas Listas de Férias'}</h2>
        
        {wishlists.length === 0 ? (
          <p className="text-slate-500 font-medium text-sm">{isEn ? 'You have no saved lists yet. Tap the heart on any camp to create one!' : 'Ainda não tem listas. Clique no coração em qualquer campo para começar!'}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {wishlists.map((lista) => {
              // Hack da Supabase para ler o count de uma foreign key
              const totalCampos = lista.wishlist_campos?.[0]?.count || 0;
              
              return (
                <div key={lista.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-40 relative group">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg mb-1">{lista.nome}</h3>
                    <p className="text-sm font-bold text-slate-500">{totalCampos} {isEn ? 'saved camps' : 'campos guardados'}</p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <Link href={`/${lang}/lista/${lista.token_partilha}`} className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
                      {isEn ? 'View list' : 'Ver lista'} &rarr;
                    </Link>
                    
                    {/* Botão Copiar Link Partilhável */}
                    <button 
                      onClick={() => copiarLinkPartilha(lista.token_partilha)}
                      title="Copiar Link para Partilhar"
                      className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
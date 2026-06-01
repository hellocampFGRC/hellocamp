"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

interface BotaoFavoritoProps {
  campoId: string | number;
}

export default function BotaoFavorito({ campoId }: BotaoFavoritoProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [listasAtivas, setListasAtivas] = useState<string[]>([]); // Guarda os IDs das listas onde este campo já está
  const [novaListaNome, setNovaListaNome] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verificarFavorito = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      // Verifica em que listas este campo se encontra
      const { data, error } = await supabase
        .from("wishlist_campos")
        .select("wishlist_id, wishlists!inner(user_id)")
        .eq("campo_id", campoId)
        .eq("wishlists.user_id", session.user.id);

      if (!error && data && data.length > 0) {
        setIsFavorited(true);
        setListasAtivas(data.map(d => d.wishlist_id));
      } else {
        setIsFavorited(false);
        setListasAtivas([]);
      }
    };
    
    verificarFavorito();
  }, [campoId]);

  const abrirModal = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      alert("Por favor, inicie sessão para guardar este campo.");
      return;
    }

    setLoading(true);
    setIsModalOpen(true);
    
    // Buscar as listas existentes do utilizador
    const { data, error } = await supabase
      .from("wishlists")
      .select("id, nome")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar listas:", error);
    }
      
    setWishlists(data || []);
    setLoading(false);
  };

  const toggleLista = async (wishlistId: string) => {
    setLoading(true);
    const isAlreadyInList = listasAtivas.includes(wishlistId);

    if (isAlreadyInList) {
      // REMOVER da lista
      const { error } = await supabase.from("wishlist_campos").delete().eq("wishlist_id", wishlistId).eq("campo_id", campoId);
      if (!error) {
        const novasListas = listasAtivas.filter(id => id !== wishlistId);
        setListasAtivas(novasListas);
        setIsFavorited(novasListas.length > 0);
      }
    } else {
      // ADICIONAR à lista
      const { error } = await supabase.from("wishlist_campos").insert({ wishlist_id: wishlistId, campo_id: campoId });
      if (!error) {
        const novasListas = [...listasAtivas, wishlistId];
        setListasAtivas(novasListas);
        setIsFavorited(true);
      }
    }
    
    setLoading(false);
  };

  const criarEGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaListaNome.trim() || !userId) return;
    
    setLoading(true);

    const { data: novaWishlist, error: errorWishlist } = await supabase
      .from("wishlists")
      .insert({ user_id: userId, nome: novaListaNome, is_publica: true })
      .select()
      .single();

    if (errorWishlist) {
      alert("Erro ao criar a lista: " + errorWishlist.message);
      setLoading(false);
      return;
    }

    if (novaWishlist) {
      const { error: errorCampo } = await supabase.from("wishlist_campos").insert({ wishlist_id: novaWishlist.id, campo_id: campoId });
        
      if (!errorCampo) {
        setWishlists([novaWishlist, ...wishlists]); // Atualiza as opções visuais
        setListasAtivas([...listasAtivas, novaWishlist.id]);
        setIsFavorited(true);
        setNovaListaNome("");
      }
    }
    
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={abrirModal}
        className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:scale-110 transition-transform outline-none z-20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorited ? "#ef4444" : "none"} stroke={isFavorited ? "#ef4444" : "#64748b"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 transition-colors">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      </button>

      {/* MODAL DE WISHLISTS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsModalOpen(false); }}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-lg">Guardar na lista</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 max-h-60 overflow-y-auto flex flex-col gap-2">
              {loading && wishlists.length === 0 ? (
                <div className="text-center text-sm font-bold text-slate-400 py-4">A processar...</div>
              ) : wishlists.length === 0 ? (
                <p className="text-sm text-slate-500 font-medium py-2">Ainda não tem listas criadas.</p>
              ) : (
                wishlists.map(w => {
                  const isInList = listasAtivas.includes(w.id);
                  return (
                    <button 
                      key={w.id} 
                      onClick={() => toggleLista(w.id)} 
                      disabled={loading} 
                      className={`w-full text-left p-4 rounded-xl border transition-colors font-bold text-sm flex justify-between items-center group disabled:opacity-50 ${isInList ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700'}`}
                    >
                      {w.nome}
                      {isInList ? (
                        <span className="text-emerald-500 font-black">✓</span>
                      ) : (
                        <span className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">+</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <form onSubmit={criarEGuardar} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nome da nova lista..." 
                  value={novaListaNome} 
                  onChange={e => setNovaListaNome(e.target.value)}
                  className="flex-1 p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 bg-white" 
                  required
                />
                <button type="submit" disabled={loading} className="bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-opacity">
                  Criar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
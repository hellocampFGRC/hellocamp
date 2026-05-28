"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

interface BotaoFavoritoProps {
  campoId: number;
}

export default function BotaoFavorito({ campoId }: BotaoFavoritoProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verificarFavorito = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setChecking(false);
        return;
      }
      
      setUserId(session.user.id);

      // Verifica se o registo já existe na tabela de favoritos
      const { data, error } = await supabase
        .from("favoritos")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("campo_id", campoId)
        .maybeSingle();

      if (data && !error) {
        setIsFavorited(true);
      }
      setChecking(false);
    };

    verificarFavorito();
  }, [campoId]);

  const toggleFavorito = async (e: React.MouseEvent) => {
    e.preventDefault(); // Impede a navegação se o botão estiver dentro de um Link
    if (checking) return;

    if (!userId) {
      alert("Por favor, inicie sessão para adicionar este campo aos seus favoritos.");
      return;
    }

    if (isFavorited) {
      // Remove dos favoritos
      setIsFavorited(false);
      await supabase
        .from("favoritos")
        .delete()
        .eq("user_id", userId)
        .eq("campo_id", campoId);
    } else {
      // Adiciona aos favoritos
      setIsFavorited(true);
      await supabase
        .from("favoritos")
        .insert({ user_id: userId, campo_id: campoId });
    }
  };

  if (checking) return <div style={{ width: '40px', height: '40px' }} />;

  return (
    <button
      onClick={toggleFavorito}
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        transition: "transform 0.2s, background-color 0.2s",
        outline: "none"
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isFavorited ? "#ef4444" : "none"}
        stroke={isFavorited ? "#ef4444" : "#64748b"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: "20px", height: "20px", transition: "fill 0.2s" }}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
}
"use client";

import React, { useState, useEffect } from "react";

export default function BotaoPartilhaArtigo({ title, layout = 'icon' }: { title: string, layout?: 'icon' | 'button' }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        console.log("Erro a partilhar", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copiado para a área de transferência!");
    }
  };

  if (layout === 'button') {
    return (
      <button onClick={handleShare} className="bg-emerald-50 text-emerald-700 font-bold px-6 py-3 rounded-xl hover:bg-emerald-100 transition-colors text-sm flex items-center gap-2">
        <span>🔗</span> Partilhar Artigo
      </button>
    );
  }

  return (
    <button onClick={handleShare} className="hover:text-emerald-600 transition-colors flex items-center gap-1" title="Partilhar Artigo">
      🔗 <span className="underline underline-offset-4">Partilhar</span>
    </button>
  );
}
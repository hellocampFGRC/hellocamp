"use client";

import React, { useState, useEffect } from "react";

// Ícones minimalistas e elegantes
const IconShare = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const IconCheck = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function BotaoPartilhaArtigo({
  title,
  isEn = false,
  layout = 'icon'
}: {
  title: string;
  isEn?: boolean;
  layout?: 'icon' | 'button';
}) {
  const [url, setUrl] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(window.location.href);
    }
  }, []);

  const handleShare = async () => {
    if (!url) return;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // Cancelado pelo utilizador — ignoramos silenciosamente
        console.log("Partilha cancelada");
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      } catch {
        // Fallback antigo para browsers restritivos
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }
    }
  };

  if (layout === 'button') {
    return (
      <button
        type="button"
        onClick={handleShare}
        className="bg-slate-900 text-white font-black px-6 py-3.5 rounded-xl hover:bg-slate-800 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-slate-900/10 uppercase tracking-widest"
      >
        {copiado ? (
          <>
            <IconCheck className="w-4 h-4 text-emerald-400" />
            {isEn ? 'Link Copied!' : 'Link Copiado!'}
          </>
        ) : (
          <>
            <IconShare className="w-4 h-4" />
            {isEn ? 'Share Article' : 'Partilhar Artigo'}
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 cursor-pointer font-bold uppercase tracking-widest text-[10px] bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
      title={isEn ? 'Share Article' : 'Partilhar Artigo'}
    >
      {copiado ? (
        <>
          <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-emerald-700">
            {isEn ? 'Copied!' : 'Copiado!'}
          </span>
        </>
      ) : (
        <>
          <IconShare className="w-3.5 h-3.5" />
          <span>
            {isEn ? 'Share' : 'Partilhar'}
          </span>
        </>
      )}
    </button>
  );
}
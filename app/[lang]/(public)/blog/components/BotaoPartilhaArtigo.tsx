"use client";

import React, { useState, useEffect } from "react";

const IconShare = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IconCopy = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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
        // Utilizador cancelou — não é erro
        console.log("Partilha cancelada pelo utilizador");
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      } catch {
        // Fallback antigo
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
        className="bg-emerald-50 text-emerald-700 font-bold px-6 py-3 rounded-xl hover:bg-emerald-100 transition-colors text-sm flex items-center gap-2 cursor-pointer border border-emerald-100"
      >
        {copiado ? (
          <>
            <IconCheck className="w-4 h-4" />
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
      className="hover:text-emerald-600 transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
      title={isEn ? 'Share Article' : 'Partilhar Artigo'}
    >
      {copiado ? (
        <>
          <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="underline underline-offset-4 text-emerald-600">
            {isEn ? 'Copied!' : 'Copiado!'}
          </span>
        </>
      ) : (
        <>
          <IconShare className="w-3.5 h-3.5" />
          <span className="underline underline-offset-4">
            {isEn ? 'Share' : 'Partilhar'}
          </span>
        </>
      )}
    </button>
  );
}
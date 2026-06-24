"use client";

import { useState } from "react";

interface DescricaoExpansivelProps {
  texto: string;
  isEn: boolean;
}

export default function DescricaoExpansivel({ texto, isEn }: DescricaoExpansivelProps) {
  const [expandido, setExpandido] = useState(false);
  
  // Limite de caracteres antes de cortar
  const LIMITE = 300;

  if (!texto) return null;

  const precisaDeCorte = texto.length > LIMITE;
  const textoVisivel = expandido ? texto : texto.slice(0, LIMITE);

  return (
    <div>
      <p className="leading-relaxed text-slate-600 text-base whitespace-pre-wrap font-medium mb-0">
        {textoVisivel}
        {!expandido && precisaDeCorte && <span className="text-slate-400">...</span>}
      </p>
      
      {precisaDeCorte && (
        <button 
          onClick={() => setExpandido(!expandido)}
          className="mt-4 text-emerald-600 font-bold text-sm hover:text-emerald-700 hover:underline underline-offset-4 transition-all"
        >
          {expandido 
            ? (isEn ? 'Read less ↑' : 'Ler menos ↑') 
            : (isEn ? 'Read more ↓' : 'Ler mais ↓')}
        </button>
      )}
    </div>
  );
}
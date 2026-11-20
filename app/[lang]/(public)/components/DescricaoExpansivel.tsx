"use client";

import React, { useState } from "react";

interface DescricaoExpansivelProps {
  texto?: string | null;
  isEn?: boolean;
  linhasIniciais?: number;
}

// Renderiza **negrito** manual e destaca rótulos antes de ":" (ex: "08h30: Acolhimento")
function renderInlineBold(text: string, autoBoldPrefix = false) {
  let content = text;

  // Se for item de lista e não tiver ** manual, coloca em negrito o prefixo até ":"
  if (autoBoldPrefix && !content.includes("**")) {
    const colonIdx = content.indexOf(":");
    if (colonIdx > 0 && colonIdx <= 55) {
      const prefixo = content.slice(0, colonIdx + 1);
      const resto = content.slice(colonIdx + 1);
      return (
        <>
          <strong className="font-black text-[#0F172A]">{prefixo}</strong>
          {resto}
        </>
      );
    }
  }

  // Suporte a **texto em negrito**
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-black text-[#0F172A]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 110) return false;
  // Ex: "1. ELEMENTOS-CHAVE DO PROGRAMA:" ou "2. HORÁRIO GERAL DIÁRIO (...):"
  if (/^\d+\.\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]{3,}/.test(trimmed)) return true;
  // Linhas totalmente em maiúsculas (com números/pontuação) terminadas em ":"
  if (
    trimmed.endsWith(":") &&
    trimmed === trimmed.toUpperCase() &&
    /[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]{3,}/.test(trimmed)
  ) {
    return true;
  }
  return false;
}

function isPromoLine(line: string): boolean {
  const upper = line.trim().toUpperCase();
  return (
    line.trim().startsWith("🔥") ||
    upper.startsWith("CAMPANHA EARLY BIRD") ||
    upper.startsWith("EARLY BIRD CAMPAIGN") ||
    upper.startsWith("PROMOÇÃO") ||
    upper.startsWith("DESCONTO EARLY BIRD")
  );
}

export default function DescricaoExpansivel({
  texto,
  isEn = false,
}: DescricaoExpansivelProps) {
  const [expandido, setExpandido] = useState(false);

  if (!texto || !texto.trim()) {
    return (
      <p className="text-slate-500 text-sm italic m-0">
        {isEn
          ? "No detailed description available."
          : "Sem descrição detalhada disponível."}
      </p>
    );
  }

  const linhas = texto.split("\n");
  const isTextoLongo = texto.length > 650 || linhas.length > 10;

  return (
    <div className="relative">
      <div
        className={`space-y-2.5 text-[15px] text-slate-700 leading-relaxed transition-all ${
          !expandido && isTextoLongo
            ? "max-h-[420px] overflow-hidden relative"
            : ""
        }`}
      >
        {linhas.map((rawLine, idx) => {
          const line = rawLine.trim();

          if (!line) {
            return <div key={idx} className="h-1.5" />;
          }

          // 1. Banner de Campanha / Early Bird
          if (isPromoLine(line)) {
            return (
              <div
                key={idx}
                className="bg-amber-50 border-l-4 border-[#F59E0B] px-4 py-3.5 rounded-r-md text-amber-950 font-bold text-sm text-justify shadow-xs my-2"
              >
                {renderInlineBold(line, true)}
              </div>
            );
          }

          // 2. Títulos / Secções Numeradas
          if (isHeadingLine(line)) {
            return (
              <h3
                key={idx}
                className="text-sm md:text-[15px] font-black text-[#0F172A] uppercase tracking-wide pt-3 pb-1 border-b border-slate-100 m-0"
              >
                {line.replace(/\*\*/g, "")}
              </h3>
            );
          }

          // 3. Itens de Lista (•, -, *)
          if (/^[•\-*▪■]\s+/.test(line)) {
            const cleanItem = line.replace(/^[•\-*▪■]\s+/, "");
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 pl-1 text-justify"
              >
                <span className="text-[#16A34A] font-black mt-0.5 select-none">
                  •
                </span>
                <p className="m-0 flex-1 text-slate-700 leading-relaxed">
                  {renderInlineBold(cleanItem, true)}
                </p>
              </div>
            );
          }

          // 4. Parágrafo Normal (Justificado + suporte a negrito)
          return (
            <p
              key={idx}
              className="m-0 text-slate-700 text-justify leading-relaxed font-medium"
            >
              {renderInlineBold(line, false)}
            </p>
          );
        })}

        {!expandido && isTextoLongo && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
        )}
      </div>

      {isTextoLongo && (
        <button
          type="button"
          onClick={() => setExpandido((prev) => !prev)}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#2563EB] hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-md border-0 cursor-pointer transition-colors"
        >
          {expandido
            ? isEn
              ? "Show less ↑"
              : "Mostrar menos ↑"
            : isEn
            ? "Read full program ↓"
            : "Ler programa completo ↓"}
        </button>
      )}
    </div>
  );
}
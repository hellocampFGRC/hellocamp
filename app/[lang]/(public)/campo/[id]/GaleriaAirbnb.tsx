"use client";

import React, { useState, useEffect, useCallback } from "react";

interface GaleriaAirbnbProps {
  capa: string;
  galeria: string[];
  nomeCampo: string;
  isEn?: boolean;
}

export default function GaleriaAirbnb({
  capa,
  galeria,
  nomeCampo,
  isEn = false,
}: GaleriaAirbnbProps) {
  const todasFotos = React.useMemo(() => {
    const lista: string[] = [];
    if (capa) lista.push(capa);
    (galeria || []).forEach((url) => {
      if (url && !lista.includes(url)) lista.push(url);
    });
    return lista;
  }, [capa, galeria]);

  const [showGridModal, setShowGridModal] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const total = todasFotos.length;

  const nextFoto = useCallback(() => {
    setLightboxIdx((prev) =>
      prev === null ? null : (prev + 1) % todasFotos.length
    );
  }, [todasFotos.length]);

  const prevFoto = useCallback(() => {
    setLightboxIdx((prev) =>
      prev === null ? null : (prev - 1 + todasFotos.length) % todasFotos.length
    );
  }, [todasFotos.length]);

  // Navegação por teclado (Esc, Setas) e bloqueio de scroll quando modal está aberto
  useEffect(() => {
    const isModalOpen = showGridModal || lightboxIdx !== null;
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIdx !== null) setLightboxIdx(null);
        else setShowGridModal(false);
      } else if (lightboxIdx !== null && e.key === "ArrowRight") {
        nextFoto();
      } else if (lightboxIdx !== null && e.key === "ArrowLeft") {
        prevFoto();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [showGridModal, lightboxIdx, nextFoto, prevFoto]);

  if (total === 0) return null;

  return (
    <>
      {/* ================================================================= */}
      {/* MOSAICO COMPACTO ESTILO AIRBNB NO TOPO                            */}
      {/* ================================================================= */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        {total >= 5 ? (
          /* 5+ FOTOS: 1 Principal à esquerda + grelha 2x2 à direita */
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 h-[250px] sm:h-[320px] md:h-[380px] bg-white">
            <button
              type="button"
              onClick={() => setLightboxIdx(0)}
              className="md:col-span-2 md:row-span-2 relative w-full h-full overflow-hidden p-0 border-0 cursor-pointer group bg-slate-900"
            >
              <img
                src={todasFotos[0]}
                alt={nomeCampo}
                className="w-full h-full object-cover object-center group-hover:brightness-90 transition-all duration-300"
              />
            </button>

            {todasFotos.slice(1, 5).map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightboxIdx(i + 1)}
                className="hidden md:block relative w-full h-full overflow-hidden p-0 border-0 cursor-pointer group bg-slate-900"
              >
                <img
                  src={url}
                  alt={`${nomeCampo} ${i + 2}`}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:brightness-90 transition-all duration-300"
                />
              </button>
            ))}
          </div>
        ) : total >= 3 ? (
          /* 3 a 4 FOTOS: 1 Principal (2/3) + 2 empilhadas à direita (1/3) */
          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-2 h-[250px] sm:h-[310px] md:h-[360px] bg-white">
            <button
              type="button"
              onClick={() => setLightboxIdx(0)}
              className="md:col-span-2 md:row-span-2 relative w-full h-full overflow-hidden p-0 border-0 cursor-pointer group bg-slate-900"
            >
              <img
                src={todasFotos[0]}
                alt={nomeCampo}
                className="w-full h-full object-cover object-center group-hover:brightness-90 transition-all duration-300"
              />
            </button>

            {todasFotos.slice(1, 3).map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightboxIdx(i + 1)}
                className="hidden md:block relative w-full h-full overflow-hidden p-0 border-0 cursor-pointer group bg-slate-900"
              >
                <img
                  src={url}
                  alt={`${nomeCampo} ${i + 2}`}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:brightness-90 transition-all duration-300"
                />
              </button>
            ))}
          </div>
        ) : total === 2 ? (
          /* 2 FOTOS: Lado a lado equilibradas */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[250px] sm:h-[310px] md:h-[350px] bg-white">
            {todasFotos.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightboxIdx(i)}
                className={`${
                  i === 1 ? "hidden md:block" : "block"
                } relative w-full h-full overflow-hidden p-0 border-0 cursor-pointer group bg-slate-900`}
              >
                <img
                  src={url}
                  alt={`${nomeCampo} ${i + 1}`}
                  className="w-full h-full object-cover object-center group-hover:brightness-90 transition-all duration-300"
                />
              </button>
            ))}
          </div>
        ) : (
          /* 1 FOTO: Centrada com fundo ambiente suave, zero corte */
          <button
            type="button"
            onClick={() => setLightboxIdx(0)}
            className="relative w-full h-[260px] sm:h-[330px] md:h-[380px] overflow-hidden p-0 border-0 cursor-pointer bg-slate-900 flex items-center justify-center group"
          >
            <img
              src={todasFotos[0]}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110 pointer-events-none"
            />
            <img
              src={todasFotos[0]}
              alt={nomeCampo}
              className="relative z-10 max-w-full max-h-full object-contain group-hover:scale-[1.01] transition-transform duration-300"
            />
          </button>
        )}

        {/* BOTÃO FLUTUANTE ESTILO AIRBNB ("Mostrar todas as fotos") */}
        {total > 1 && (
          <button
            type="button"
            onClick={() => setShowGridModal(true)}
            className="absolute bottom-3.5 right-3.5 z-20 bg-white/95 hover:bg-white text-[#0F172A] border border-slate-300 shadow-md px-4 py-2 rounded-lg text-xs font-black tracking-tight flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M1 1h4v4H1V1zm5 0h4v4H6V1zm5 0h4v4h-4V1zM1 6h4v4H1V6zm5 0h4v4H6V6zm5 0h4v4h-4V6zM1 11h4v4H1v-4zm5 0h4v4H6v-4zm5 0h4v4h-4v-4z" />
            </svg>
            <span>
              {isEn
                ? `Show all ${total} photos`
                : `Mostrar todas as ${total} fotos`}
            </span>
          </button>
        )}
      </div>

      {/* ================================================================= */}
      {/* MODAL 1: GALERIA COMPLETA ORGANIZADA (TODAS AS FOTOS)             */}
      {/* ================================================================= */}
      {showGridModal && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-fadeIn">
          {/* Header Fixo do Modal */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowGridModal(false)}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-lg border-0 cursor-pointer transition-colors"
            >
              &larr; {isEn ? "Back" : "Voltar"}
            </button>
            <span className="text-xs md:text-sm font-black text-slate-900 truncate max-w-[55%]">
              {nomeCampo} ({total} {isEn ? "photos" : "fotos"})
            </span>
            <button
              type="button"
              onClick={() => setShowGridModal(false)}
              aria-label="Close"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm border-0 cursor-pointer flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Grelha Elegante Estilo Airbnb (alterna 1 larga + 2 lado a lado) */}
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {todasFotos.map((url, idx) => {
                const isDestaque = idx % 3 === 0;
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setLightboxIdx(idx)}
                    className={`${
                      isDestaque ? "sm:col-span-2 aspect-[16/10]" : "aspect-[4/3]"
                    } relative w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 p-0 cursor-pointer group`}
                  >
                    <img
                      src={url}
                      alt={`${nomeCampo} ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:brightness-95 transition-all duration-300"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: LIGHTBOX EM ECRÃ INTEIRO (FOTO INTEIRA SEM CORTES!)      */}
      {/* ================================================================= */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Topo do Lightbox */}
          <div
            className="px-4 md:px-8 py-4 flex items-center justify-between text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs font-black tracking-widest uppercase text-slate-300">
              {lightboxIdx + 1} / {total}
            </span>
            <button
              type="button"
              onClick={() => setLightboxIdx(null)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border-0 cursor-pointer transition-colors"
            >
              ✕ {isEn ? "Close" : "Fechar"}
            </button>
          </div>

          {/* Imagem Principal (object-contain = 0% de corte) */}
          <div
            className="flex-1 relative flex items-center justify-center px-4 md:px-16 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {total > 1 && (
              <button
                type="button"
                onClick={prevFoto}
                aria-label="Previous"
                className="absolute left-3 md:left-6 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white text-lg font-black border-0 cursor-pointer flex items-center justify-center transition-colors"
              >
                ‹
              </button>
            )}

            <img
              src={todasFotos[lightboxIdx]}
              alt={`${nomeCampo} ${lightboxIdx + 1}`}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl select-none"
            />

            {total > 1 && (
              <button
                type="button"
                onClick={nextFoto}
                aria-label="Next"
                className="absolute right-3 md:right-6 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white text-lg font-black border-0 cursor-pointer flex items-center justify-center transition-colors"
              >
                ›
              </button>
            )}
          </div>

          {/* Barra de Miniaturas no Fundo */}
          {total > 1 && (
            <div
              className="px-4 py-4 flex items-center justify-center gap-2 overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {todasFotos.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setLightboxIdx(i)}
                  className={`w-14 h-10 rounded-md overflow-hidden p-0 border-2 cursor-pointer shrink-0 transition-all ${
                    i === lightboxIdx
                      ? "border-white opacity-100 scale-105"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
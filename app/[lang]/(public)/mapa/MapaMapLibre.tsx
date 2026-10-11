"use client";

import { useEffect, useRef, useMemo } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ═══════════════════════════════════════════
// TIPAGEM
// ═══════════════════════════════════════════
interface Campo {
  id: string | number;
  nome: string;
  nome_en?: string;
  imagem?: string;
  categoria?: string;
  categoria_en?: string;
  preco?: number;
  latitude: number;
  longitude: number;
}

interface MapaMapLibreProps {
  campos: any[];
  lang: string;
}

// ═══════════════════════════════════════════
// FALLBACK DE IMAGEM (para popups sem foto)
// ═══════════════════════════════════════════
const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect fill='%23e2e8f0' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' font-weight='bold' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3EHelloCamp%3C/text%3E%3C/svg%3E";

// ═══════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════
export default function MapaMapLibre({ campos, lang }: MapaMapLibreProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const isEn = lang === "en";

  // ═══════════════════════════════════════════
  // 1) MEMOIZAR a limpeza das coordenadas
  //    Só recalculado se `campos` mudar de referência.
  //    Evita trabalho no render.
  // ═══════════════════════════════════════════
  const camposValidos = useMemo<Campo[]>(() => {
    return (campos || [])
      .filter(
        (c) =>
          c.latitude != null &&
          c.longitude != null &&
          !isNaN(Number(c.latitude)) &&
          !isNaN(Number(c.longitude))
      )
      .map((c) => ({
        id: c.id,
        nome: isEn && c.nome_en ? c.nome_en : c.nome,
        imagem: c.imagem,
        categoria: isEn && c.categoria_en ? c.categoria_en : c.categoria,
        preco: Number(c.preco) || 0,
        latitude: Number(c.latitude),
        longitude: Number(c.longitude),
      }));
  }, [campos, isEn]);

  // ═══════════════════════════════════════════
  // 2) CRIAR MAPA — apenas UMA vez
  //    (dependency array vazio = não recria)
  // ═══════════════════════════════════════════
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const instance = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [-8.2245, 39.3999], // Centro de Portugal
      zoom: 6,
      minZoom: 4,
      maxZoom: 18,
      attributionControl: { compact: true },
      // ⚡ Zero fade = tiles instantâneos (menos CPU)
      fadeDuration: 0,
    });

    // ⚡ Performance: desativar rotação (não é usada num site de listagem)
    instance.dragRotate.disable();
    instance.touchZoomRotate.disableRotation();
    instance.keyboard.disableRotation();

    map.current = instance;

    // ⚡ Controls mínimos
    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    // Cleanup ao desmontar
    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);

  // ═══════════════════════════════════════════
  // 3) ADICIONAR PINS — só quando `camposValidos` muda
  //    Popup construída em DOM nativo (mais leve que React)
  // ═══════════════════════════════════════════
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    // Se o mapa ainda está a carregar, espera
    const setupMarkers = () => {
      // ─────────────────────────────────────
      // Limpar markers antigos (se existirem)
      // ─────────────────────────────────────
      const existingMarkers = (instance as any)._hcMarkers as
        | maplibregl.Marker[]
        | undefined;
      if (existingMarkers) {
        existingMarkers.forEach((m) => m.remove());
      }
      (instance as any)._hcMarkers = [];

      // ─────────────────────────────────────
      // Adicionar markers novos
      // ─────────────────────────────────────
      const newMarkers: maplibregl.Marker[] = [];

      camposValidos.forEach((c) => {
        // Marker padrão do MapLibre (SVG interno — não precisa de imagem externa)
        const marker = new maplibregl.Marker({
          color: "#059669",
          anchor: "bottom",
        })
          .setLngLat([c.longitude, c.latitude])
          .setPopup(
            new maplibregl.Popup({
              offset: 25,
              closeButton: false,
              maxWidth: "280px",
              className: "hc-popup",
            }).setHTML(
              // ⚡ HTML puro — sem JSX, sem portal, sem overhead React
              `
              <div class="hc-popup-card">
                <div class="hc-popup-img-wrap">
                  <img
                    src="${c.imagem || FALLBACK_IMG}"
                    alt="${escapeHtml(c.nome)}"
                    class="hc-popup-img"
                    loading="lazy"
                    onerror="this.src='${FALLBACK_IMG}'"
                  />
                  ${c.categoria ? `<span class="hc-popup-badge">${escapeHtml(c.categoria)}</span>` : ""}
                </div>
                <div class="hc-popup-body">
                  <h3 class="hc-popup-title">${escapeHtml(c.nome)}</h3>
                  ${
                    c.preco != null && c.preco > 0
                      ? `<p class="hc-popup-price">${c.preco}€</p>`
                      : ""
                  }
                  <a href="/${lang}/campo/${c.id}" class="hc-popup-cta">
                    ${isEn ? "View Details" : "Ver Detalhes"}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </a>
                </div>
              </div>
              `
            )
          )
          .addTo(instance);

        newMarkers.push(marker);
      });

      (instance as any)._hcMarkers = newMarkers;

      // ─────────────────────────────────────
      // Auto-fit aos pins
      // ─────────────────────────────────────
      if (camposValidos.length > 0) {
        // Se for apenas 1 campo, centra com zoom confortável
        if (camposValidos.length === 1) {
          instance.flyTo({
            center: [camposValidos[0].longitude, camposValidos[0].latitude],
            zoom: 12,
            duration: 800,
          });
        } else {
          // Vários: calcula bounds e faz fit
          const bounds = new maplibregl.LngLatBounds();
          camposValidos.forEach((c) =>
            bounds.extend([c.longitude, c.latitude])
          );
          instance.fitBounds(bounds, {
            padding: { top: 80, bottom: 80, left: 80, right: 80 },
            duration: 800,
            maxZoom: 12,
          });
        }
      }
    };

    // ⚡ Se o style ainda está a carregar, espera pelo evento `load`
    if (instance.isStyleLoaded()) {
      setupMarkers();
    } else {
      instance.once("load", setupMarkers);
    }
  }, [camposValidos, lang, isEn]);

  // ═══════════════════════════════════════════
  // RENDER — apenas o container. Zero lógica aqui.
  // Depois do primeiro render, o React deixa de tocar neste componente.
  // ═══════════════════════════════════════════
  return (
    <>
      {/* ⚡ CSS embutido — define o estilo das popups.
          Não usa Tailwind porque as popups vivem fora da árvore React. */}
      <style jsx global>{`
        .hc-popup .maplibregl-popup-content {
          padding: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
          font-family: inherit;
        }
        .hc-popup .maplibregl-popup-tip {
          border-top-color: white;
        }
        .hc-popup-card {
          width: 260px;
          background: white;
        }
        .hc-popup-img-wrap {
          position: relative;
          width: 100%;
          height: 130px;
          overflow: hidden;
          background: #e2e8f0;
        }
        .hc-popup-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .hc-popup-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          color: #0f172a;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .hc-popup-body {
          padding: 14px 16px 16px;
        }
        .hc-popup-title {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hc-popup-price {
          margin: 6px 0 0 0;
          font-size: 18px;
          font-weight: 900;
          color: #059669;
        }
        .hc-popup-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 12px;
          padding: 10px;
          background: #0f172a;
          color: white;
          font-size: 12px;
          font-weight: 800;
          border-radius: 10px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: background 0.15s ease;
        }
        .hc-popup-cta:hover {
          background: #059669;
        }
      `}</style>

      {/* ⚡ O container do mapa. Nada mais. */}
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ position: "absolute", inset: 0 }}
      />
    </>
  );
}

// ═══════════════════════════════════════════
// HELPER — escapa HTML para prevenir XSS
// ═══════════════════════════════════════════
function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
"use client";

import { useEffect, useRef, useMemo } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ═══════════════════════════════════════════════════════════
// WORKER DO MAPLIBRE
// ═══════════════════════════════════════════════════════════
if (typeof window !== "undefined") {
  try {
    // @ts-ignore
    if (typeof (maplibregl as any).setWorkerUrl === "function") {
      (maplibregl as any).setWorkerUrl(
        "https://cdn.jsdelivr.net/npm/maplibre-gl@5.0.1/dist/maplibre-gl-csp-worker.js"
      );
    }
  } catch (e) {
    console.warn("[MAPA] setWorkerUrl falhou:", e);
  }
}

interface Campo {
  id: string | number;
  nome: string;
  imagem?: string;
  categoria?: string;
  preco?: number;
  latitude: number;
  longitude: number;
}

interface MapaMapLibreProps {
  campos: any[];
  lang: string;
}

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect fill='%23f1f5f9' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' font-weight='bold' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3EHelloCamp%3C/text%3E%3C/svg%3E";

// ═══════════════════════════════════════════════════════════
// ESTILO OPENSTREETMAP (100% Grátis, Rápido e com Zoom à Rua)
// ═══════════════════════════════════════════════════════════
const osmRasterStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

export default function MapaMapLibre({ campos, lang }: MapaMapLibreProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const isEn = lang === "en";

  const camposValidos = useMemo<Campo[]>(() => {
    const lista = campos || [];
    return lista
      .map((c): Campo | null => {
        const lat = Number(c.latitude);
        const lng = Number(c.longitude);
        if (
          c.latitude == null || c.longitude == null ||
          c.latitude === "" || c.longitude === "" ||
          isNaN(lat) || isNaN(lng) ||
          lat === 0 || lng === 0
        ) return null;

        return {
          id: c.id,
          nome: isEn && c.nome_en ? c.nome_en : c.nome,
          imagem: c.imagem,
          categoria: isEn && c.categoria_en ? c.categoria_en : c.categoria,
          preco: Number(c.preco) || 0,
          latitude: lat,
          longitude: lng,
        };
      })
      .filter((c): c is Campo => c !== null);
  }, [campos, isEn]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const instance = new maplibregl.Map({
      container: mapContainer.current,
      style: osmRasterStyle,
      center: [-8.2245, 39.3999],
      zoom: 6,
      minZoom: 4,
      maxZoom: 19,
      attributionControl: { compact: true },
    });

    instance.dragRotate.disable();
    instance.touchZoomRotate.disableRotation();
    instance.keyboard.disableRotation();

    map.current = instance;

    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    const resizeObserver = new ResizeObserver(() => instance.resize());
    if (mapContainer.current) resizeObserver.observe(mapContainer.current);
    const raf = requestAnimationFrame(() => instance.resize());

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    const setupMarkers = () => {
      const existing = (instance as any)._hcMarkers as maplibregl.Marker[] | undefined;
      if (existing) existing.forEach((m) => m.remove());
      (instance as any)._hcMarkers = [];

      if (camposValidos.length === 0) return;

      const newMarkers: maplibregl.Marker[] = [];

      camposValidos.forEach((c) => {
        const el = document.createElement("div");
        el.className = "hc-marker-container";
        
        // Z-Index dinâmico para garantir que o hover fica por cima dos outros pinos
        el.addEventListener('mouseenter', () => { el.style.zIndex = "999"; });
        el.addEventListener('mouseleave', () => { el.style.zIndex = ""; });

        // Pino Gota com Laranja HelloCamp (#e2a41d)
        el.innerHTML = `
          <div class="hc-pin-svg">
            <svg viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#e2a41d" stroke="#ffffff" stroke-width="1.5"/>
            </svg>
          </div>

          <!-- Ponte invisível para o rato não perder o hover entre o pino e o card -->
          <div class="hc-hover-bridge"></div>

          <!-- O Card do Campo (Pop-up via CSS Hover) -->
          <div class="hc-hover-popup">
            <div class="hc-popup-img-wrap">
              <img src="${c.imagem || FALLBACK_IMG}" alt="${escapeHtml(c.nome)}" class="hc-popup-img" loading="lazy" onerror="this.src='${FALLBACK_IMG}'"/>
              ${c.categoria ? `<span class="hc-popup-badge">${escapeHtml(c.categoria)}</span>` : ""}
            </div>
            <div class="hc-popup-body">
              <h3 class="hc-popup-title">${escapeHtml(c.nome)}</h3>
              <div class="hc-popup-footer">
                ${c.preco != null && c.preco > 0 ? `
                  <div>
                    <span class="hc-popup-from">${isEn ? 'From' : 'Desde'}</span>
                    <p class="hc-popup-price">${c.preco}€</p>
                  </div>
                ` : '<div></div>'}
                <a href="/${lang}/campo/${c.id}" class="hc-popup-cta">
                  ${isEn ? "View Dates" : "Ver Datas"}
                </a>
              </div>
            </div>
          </div>
        `;

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([c.longitude, c.latitude])
          .addTo(instance);

        newMarkers.push(marker);
      });

      (instance as any)._hcMarkers = newMarkers;

      if (camposValidos.length === 1) {
        instance.flyTo({ center: [camposValidos[0].longitude, camposValidos[0].latitude], zoom: 11, duration: 800 });
      } else {
        const bounds = new maplibregl.LngLatBounds();
        camposValidos.forEach((c) => bounds.extend([c.longitude, c.latitude]));
        instance.fitBounds(bounds, { padding: 80, duration: 800, maxZoom: 12 });
      }
    };

    setupMarkers();
    instance.once("load", setupMarkers);
  }, [camposValidos, lang, isEn]);

  return (
    <>
      <style>{`
        /* O Contentor Geral do Pino */
        .hc-marker-container { 
          position: relative; 
          width: 36px; height: 36px; 
          display: flex; justify-content: center; align-items: flex-end; 
          cursor: pointer;
        }

        /* O SVG do Pino em si (Sombra ajustada para laranja) */
        .hc-pin-svg {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          filter: drop-shadow(0px 4px 6px rgba(226, 164, 29, 0.4));
        }

        .hc-marker-container:hover .hc-pin-svg {
          transform: scale(1.15) translateY(-2px);
        }

        /* Ponte invisível para o Hover não quebrar */
        .hc-hover-bridge {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 20px;
          background: transparent;
        }

        /* O Card (Popup) que aparece por cima */
        .hc-hover-popup {
          position: absolute;
          bottom: 44px; /* Fica logo acima do pino */
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          width: 260px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px -5px rgba(0,0,0,0.2);
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none; /* Para não bloquear cliques até estar visível */
          overflow: hidden;
          border: 1px solid #f1f5f9;
        }

        /* A Magia do Hover: Mostrar o Card */
        .hc-marker-container:hover .hc-hover-popup {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
          pointer-events: auto; /* Permite clicar no botão "Ver Datas" */
        }

        /* Design do Interior do Card */
        .hc-popup-img-wrap { position: relative; width: 100%; height: 140px; background: #f8fafc; }
        .hc-popup-img { width: 100%; height: 100%; object-fit: cover; display: block; margin: 0; }
        .hc-popup-badge {
          position: absolute; top: 12px; left: 12px;
          background: rgba(255,255,255,0.95); backdrop-filter: blur(4px);
          color: #0f172a; font-size: 9px; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.08em;
          padding: 6px 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .hc-popup-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        
        .hc-popup-title {
          margin: 0; font-size: 15px; font-weight: 900; color: #0f172a; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-align: left;
        }
        
        .hc-popup-footer {
          display: flex; justify-content: space-between; align-items: flex-end;
          margin-top: 4px; padding-top: 12px; border-top: 1px solid #f1f5f9;
        }

        .hc-popup-from {
          display: block; font-size: 9px; font-weight: 800; color: #94a3b8; 
          text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;
        }

        .hc-popup-price { margin: 0; font-size: 20px; font-weight: 900; color: #e2a41d; text-align: left; line-height: 1;}
        
        .hc-popup-cta {
          background: #0f172a; color: white;
          font-size: 11px; font-weight: 900; padding: 10px 16px;
          border-radius: 10px; text-decoration: none;
          text-transform: uppercase; letter-spacing: 0.05em; transition: background 0.15s ease;
        }
        
        .hc-popup-cta:hover { background: #1e293b; }
      `}</style>
      <div ref={mapContainer} className="w-full h-full bg-[#f1f5f9]" style={{ minHeight: "400px" }} />
    </>
  );
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
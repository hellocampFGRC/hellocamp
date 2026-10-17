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
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect fill='%23f8fafc' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' font-weight='bold' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3EHelloCamp%3C/text%3E%3C/svg%3E";

// ═══════════════════════════════════════════════════════════
// ESTILO RASTER "VOYAGER" (Grátis, Estável e Sem API Keys)
// ═══════════════════════════════════════════════════════════
const cartoRasterStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'carto-voyager': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }
  },
  layers: [
    {
      id: 'carto-voyager-layer',
      type: 'raster',
      source: 'carto-voyager',
      minzoom: 0,
      maxzoom: 20
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
      // Passamos o objeto que criámos em vez de um link bloqueado
      style: cartoRasterStyle,
      center: [-8.2245, 39.3999],
      zoom: 6,
      minZoom: 4,
      maxZoom: 20,
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
        el.className = "hc-marker";
        el.innerHTML = `
          <div class="hc-marker-pin">
            <svg viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
              <path d="M3 20h18L14 4l-3 6-2-2-6 12z"/>
            </svg>
          </div>
        `;

        const popup = new maplibregl.Popup({
          offset: 32,
          closeButton: false,
          maxWidth: "280px",
          className: "hc-popup",
        }).setHTML(
          `
          <div class="hc-popup-card">
            <div class="hc-popup-img-wrap">
              <img src="${c.imagem || FALLBACK_IMG}" alt="${escapeHtml(c.nome)}" class="hc-popup-img" loading="lazy" onerror="this.src='${FALLBACK_IMG}'"/>
              ${c.categoria ? `<span class="hc-popup-badge">${escapeHtml(c.categoria)}</span>` : ""}
            </div>
            <div class="hc-popup-body">
              <h3 class="hc-popup-title">${escapeHtml(c.nome)}</h3>
              ${c.preco != null && c.preco > 0 ? `<p class="hc-popup-price">${c.preco}€</p>` : ""}
              <a href="/${lang}/campo/${c.id}" class="hc-popup-cta">
                ${isEn ? "View Details" : "Ver Detalhes"}
              </a>
            </div>
          </div>
          `
        );

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([c.longitude, c.latitude])
          .setPopup(popup)
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
        .hc-marker { width: 36px; height: 36px; cursor: pointer; box-sizing: content-box; line-height: 0; font-size: 0; }
        .hc-marker-pin {
          width: 36px; height: 36px;
          background: #e2a41d;
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          box-shadow: 0 8px 16px rgba(226, 164, 29, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1);
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        .hc-marker-pin > svg { transform: rotate(45deg); display: block; }
        .hc-marker:hover .hc-marker-pin {
          transform: rotate(-45deg) scale(1.15);
          background: #d4991b;
          box-shadow: 0 12px 24px rgba(226, 164, 29, 0.5), 0 4px 8px rgba(0, 0, 0, 0.2);
          z-index: 50;
        }

        .hc-popup .maplibregl-popup-content {
          padding: 0; border-radius: 20px; overflow: hidden;
          box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.2);
          font-family: inherit; border: 1px solid #f1f5f9;
        }
        .hc-popup .maplibregl-popup-tip { border-top-color: white; }
        .hc-popup-card { width: 280px; background: white; box-sizing: border-box; }
        .hc-popup-img-wrap { position: relative; width: 100%; height: 160px; overflow: hidden; background: #f8fafc; }
        .hc-popup-img { width: 100%; height: 100%; object-fit: cover; display: block; margin: 0; }
        .hc-popup-badge {
          position: absolute; top: 12px; left: 12px;
          background: rgba(255,255,255,0.95); backdrop-filter: blur(4px);
          color: #0f172a; font-size: 9px; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.08em;
          padding: 6px 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .hc-popup-body { padding: 20px; }
        .hc-popup-title {
          margin: 0; font-size: 16px; font-weight: 900; color: #0f172a; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-align: left;
        }
        .hc-popup-price { margin: 8px 0 0 0; font-size: 20px; font-weight: 900; color: #e2a41d; text-align: left; }
        .hc-popup-cta {
          display: flex; align-items: center; justify-content: center; width: 100%;
          margin-top: 16px; padding: 12px; background: #0f172a; color: white;
          font-size: 12px; font-weight: 900; border-radius: 12px; text-decoration: none;
          text-transform: uppercase; letter-spacing: 0.05em; transition: background 0.15s ease;
        }
        .hc-popup-cta:hover { background: #1e293b; }
      `}</style>
      <div ref={mapContainer} className="w-full h-full bg-slate-100" style={{ minHeight: "400px" }} />
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
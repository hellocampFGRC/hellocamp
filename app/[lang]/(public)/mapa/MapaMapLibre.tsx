"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect fill='%23e2e8f0' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' font-weight='bold' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3EHelloCamp%3C/text%3E%3C/svg%3E";

export default function MapaMapLibre({ campos, lang }: MapaMapLibreProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const isEn = lang === "en";

  // ═══════════════════════════════════════════
  // DEBUG VISUAL: quantos campos têm coordenadas?
  // ═══════════════════════════════════════════
  const [debugInfo, setDebugInfo] = useState({
    total: 0,
    validos: 0,
    semLat: 0,
    semLng: 0,
  });

  // ═══════════════════════════════════════════
  // Filtrar e validar coordenadas (client-side)
  // ═══════════════════════════════════════════
  const camposValidos = useMemo<Campo[]>(() => {
    const lista = campos || [];

    let validos = 0;
    let semLat = 0;
    let semLng = 0;

    const limpos = lista
      .map((c): Campo | null => {
        const lat = Number(c.latitude);
        const lng = Number(c.longitude);

        if (c.latitude == null || c.latitude === "") {
          semLat++;
          return null;
        }
        if (c.longitude == null || c.longitude === "") {
          semLng++;
          return null;
        }
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
          return null;
        }

        validos++;
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

    setDebugInfo({ total: lista.length, validos, semLat, semLng });

    if (typeof window !== "undefined") {
      console.log("[MAPA DEBUG]", {
        recebidos: lista.length,
        validos,
        semLatitude: semLat,
        semLongitude: semLng,
        primeiroValido: limpos[0] || null,
      });
    }

    return limpos;
  }, [campos, isEn]);

  // ═══════════════════════════════════════════
  // Criar mapa — só UMA vez
  // ═══════════════════════════════════════════
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const instance = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [-8.2245, 39.3999],
      zoom: 6,
      minZoom: 4,
      maxZoom: 18,
      attributionControl: { compact: true },
      fadeDuration: 0,
    });

    instance.dragRotate.disable();
    instance.touchZoomRotate.disableRotation();
    instance.keyboard.disableRotation();

    map.current = instance;

    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);

  // ═══════════════════════════════════════════
  // Adicionar pins — só quando camposValidos muda
  // ═══════════════════════════════════════════
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    const setupMarkers = () => {
      // Limpar markers antigos
      const existing = (instance as any)._hcMarkers as
        | maplibregl.Marker[]
        | undefined;
      if (existing) existing.forEach((m) => m.remove());
      (instance as any)._hcMarkers = [];

      if (camposValidos.length === 0) {
        console.warn("[MAPA] 0 campos válidos — nenhum pin para adicionar.");
        return;
      }

      console.log(
        `[MAPA] A adicionar ${camposValidos.length} pins ao mapa...`
      );

      const newMarkers: maplibregl.Marker[] = [];

      camposValidos.forEach((c) => {
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
                  ${
                    c.categoria
                      ? `<span class="hc-popup-badge">${escapeHtml(c.categoria)}</span>`
                      : ""
                  }
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

      // Auto-fit
      if (camposValidos.length === 1) {
        instance.flyTo({
          center: [camposValidos[0].longitude, camposValidos[0].latitude],
          zoom: 12,
          duration: 800,
        });
      } else {
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
    };

    if (instance.isStyleLoaded()) {
      setupMarkers();
    } else {
      instance.once("load", setupMarkers);
    }
  }, [camposValidos, lang, isEn]);

  return (
    <>
      <style>{`
        .hc-popup .maplibregl-popup-content {
          padding: 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
          font-family: inherit;
        }
        .hc-popup .maplibregl-popup-tip { border-top-color: white; }
        .hc-popup-card { width: 260px; background: white; }
        .hc-popup-img-wrap {
          position: relative; width: 100%; height: 130px;
          overflow: hidden; background: #e2e8f0;
        }
        .hc-popup-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hc-popup-badge {
          position: absolute; top: 10px; left: 10px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(4px);
          color: #0f172a; font-size: 9px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.08em;
          padding: 4px 8px; border-radius: 6px;
        }
        .hc-popup-body { padding: 14px 16px 16px; }
        .hc-popup-title {
          margin: 0; font-size: 14px; font-weight: 800;
          color: #0f172a; line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hc-popup-price {
          margin: 6px 0 0 0; font-size: 18px;
          font-weight: 900; color: #059669;
        }
        .hc-popup-cta {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-top: 12px; padding: 10px;
          background: #0f172a; color: white;
          font-size: 12px; font-weight: 800;
          border-radius: 10px; text-decoration: none;
          text-transform: uppercase; letter-spacing: 0.05em;
          transition: background 0.15s ease;
        }
        .hc-popup-cta:hover { background: #059669; }
      `}</style>

      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ position: "absolute", inset: 0 }}
      />

      {/* ═══════════════════════════════════════════ */}
      {/* DEBUG VISUAL — remover quando estiver OK    */}
      {/* ═══════════════════════════════════════════ */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 px-4 py-3 text-xs font-mono text-slate-700 pointer-events-none">
        <div className="font-bold text-slate-900 mb-1">DEBUG MAPA</div>
        <div>Recebidos: <strong>{debugInfo.total}</strong></div>
        <div>Válidos (com lat/lng): <strong className="text-emerald-600">{debugInfo.validos}</strong></div>
        <div>Sem latitude: <strong className="text-amber-600">{debugInfo.semLat}</strong></div>
        <div>Sem longitude: <strong className="text-amber-600">{debugInfo.semLng}</strong></div>
      </div>
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
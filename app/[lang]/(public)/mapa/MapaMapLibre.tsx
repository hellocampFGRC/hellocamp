"use client";

import { useEffect, useRef, useMemo } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ═══════════════════════════════════════════════════════════
// 🔧 FIX CRÍTICO: Worker URL do MapLibre
// O Next.js serve o worker como HTML (404) por defeito.
// Apontamos para o CDN antes de criar qualquer mapa.
// (Este bloco corre em module-load, antes de qualquer useEffect)
// ═══════════════════════════════════════════════════════════
if (typeof window !== "undefined") {
  // @ts-ignore — workerUrl é válido na MapLibre v3/v4
  maplibregl.workerUrl =
    "https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl-csp-worker.js";
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
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect fill='%23e2e8f0' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' font-weight='bold' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3EHelloCamp%3C/text%3E%3C/svg%3E";

export default function MapaMapLibre({ campos, lang }: MapaMapLibreProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const isEn = lang === "en";

  // ─────────────────────────────────────────
  // Coordenadas válidas
  // ─────────────────────────────────────────
  const camposValidos = useMemo<Campo[]>(() => {
    const lista = campos || [];
    return lista
      .map((c): Campo | null => {
        const lat = Number(c.latitude);
        const lng = Number(c.longitude);
        if (
          c.latitude == null ||
          c.longitude == null ||
          c.latitude === "" ||
          c.longitude === "" ||
          isNaN(lat) ||
          isNaN(lng) ||
          lat === 0 ||
          lng === 0
        ) {
          return null;
        }
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

  // ─────────────────────────────────────────
  // Criar mapa — uma vez só
  // ─────────────────────────────────────────
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
    });

    instance.dragRotate.disable();
    instance.touchZoomRotate.disableRotation();
    instance.keyboard.disableRotation();

    map.current = instance;

    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    instance.on("error", (e: any) => {
      console.error("[MAPA ERRO]", e?.error?.message || e);
    });

    // Resize quando o container muda de tamanho (bug comum do SSR)
    const resizeObserver = new ResizeObserver(() => instance.resize());
    if (mapContainer.current) resizeObserver.observe(mapContainer.current);

    // Resize imediato após o primeiro paint
    const raf = requestAnimationFrame(() => instance.resize());

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      instance.remove();
      map.current = null;
    };
  }, []);

  // ─────────────────────────────────────────
  // Adicionar pins — NÃO esperar pelo `load`
  // ═════════════════════════════════════════
  // ⚡ CORREÇÃO: markers são DOM puro e podem ser adicionados
  // imediatamente, mesmo antes do style carregar.
  // Esperar pelo `load` é o que está a impedir os pins de aparecer.
  // ─────────────────────────────────────────
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
        console.warn("[MAPA] 0 campos válidos.");
        return;
      }

      console.log(
        `[MAPA] A adicionar ${camposValidos.length} pins ao mapa...`
      );

      const newMarkers: maplibregl.Marker[] = [];

      camposValidos.forEach((c) => {
        const el = document.createElement("div");
        el.className = "hc-marker";
        el.setAttribute("aria-label", c.nome);
        el.innerHTML = `
          <div class="hc-marker-pin">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
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
                (c.preco ?? 0) > 0
                  ? `<p class="hc-popup-price">${c.preco ?? 0}€</p>`
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
        );

        const marker = new maplibregl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([c.longitude, c.latitude])
          .setPopup(popup)
          .addTo(instance);

        newMarkers.push(marker);
      });

      (instance as any)._hcMarkers = newMarkers;

      // Auto-fit
      if (camposValidos.length === 1) {
        instance.flyTo({
          center: [camposValidos[0].longitude, camposValidos[0].latitude],
          zoom: 11,
          duration: 800,
        });
      } else {
        const bounds = new maplibregl.LngLatBounds();
        camposValidos.forEach((c) =>
          bounds.extend([c.longitude, c.latitude])
        );
        instance.fitBounds(bounds, {
          padding: { top: 100, bottom: 100, left: 100, right: 100 },
          duration: 800,
          maxZoom: 11,
        });
      }
    };

    // ⚡ CORREÇÃO: chamar IMEDIATAMENTE, sem esperar pelo `load`
    setupMarkers();

    // Se por acaso o style ainda não carregou e o load dispara mais tarde,
    // volta a chamar (idempotente — limpa os antigos primeiro)
    instance.once("load", setupMarkers);
  }, [camposValidos, lang, isEn]);

  return (
    <>
      <style>{`
        .hc-marker {
          width: 32px; height: 32px; cursor: pointer;
          box-sizing: content-box; line-height: 0; font-size: 0;
        }
        .hc-marker-pin {
          width: 32px; height: 32px;
          background: #059669;
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4), 0 2px 4px rgba(0, 0, 0, 0.15);
          transform: rotate(-45deg);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hc-marker-pin > svg { transform: rotate(45deg); display: block; }
        .hc-marker:hover .hc-marker-pin {
          transform: rotate(-45deg) scale(1.15);
          box-shadow: 0 8px 20px rgba(5, 150, 105, 0.55), 0 3px 6px rgba(0, 0, 0, 0.2);
        }

        .hc-popup .maplibregl-popup-content {
          padding: 0; border-radius: 16px; overflow: hidden;
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
          font-family: inherit;
        }
        .hc-popup .maplibregl-popup-tip { border-top-color: white; }
        .hc-popup-card { width: 260px; background: white; box-sizing: border-box; }
        .hc-popup-img-wrap {
          position: relative; width: 100%; height: 130px;
          overflow: hidden; background: #e2e8f0;
        }
        .hc-popup-img {
          width: 100%; height: 100%; object-fit: cover; display: block; margin: 0;
        }
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
          text-align: left;
        }
        .hc-popup-price {
          margin: 6px 0 0 0; font-size: 18px;
          font-weight: 900; color: #059669;
          text-align: left;
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
        style={{ minHeight: "400px" }}
      />
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
"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";

// Correção vital para os ícones padrão do Leaflet no Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapaLeaflet({ campos }: { campos: any[] }) {
  // Centro por defeito (Centro de Portugal)
  const defaultCenter: [number, number] = [39.3999, -8.2245];
  const defaultZoom = 6;

  // Filtrar apenas campos que tenham coordenadas válidas inseridas na Base de Dados
  const camposComCoordenadas = campos.filter(
    (c) => c.latitude != null && c.longitude != null
  );

  return (
    <>
      {/* CSS embutido para remover o padding padrão do Leaflet e manter os cantos redondos impecáveis */}
      <style>{`
        .leaflet-popup-content-wrapper { padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15); }
        .leaflet-popup-content { margin: 0; width: 240px !important; }
        .leaflet-container a.leaflet-popup-close-button { color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5); top: 8px; right: 8px; }
      `}</style>

      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        {/* Estilo Visual do Mapa (CartoDB Positron - Muito clean e moderno) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {camposComCoordenadas.map((campo) => (
          <Marker 
            key={campo.id} 
            position={[campo.latitude, campo.longitude]}
          >
            {/* Removemos o "style" daqui para resolver o erro do TypeScript */}
            <Popup closeButton={false}>
              <div style={{ width: '100%', fontFamily: 'sans-serif' }}>
                <img 
                  src={campo.imagem} 
                  alt={campo.nome} 
                  style={{ width: '100%', height: '130px', objectFit: 'cover' }} 
                />
                <div style={{ padding: '16px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {campo.categoria}
                  </span>
                  <h3 style={{ margin: '4px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a', lineHeight: '1.2' }}>
                    {campo.nome}
                  </h3>
                  <p style={{ margin: 0, marginTop: '8px', fontSize: '18px', fontWeight: '900', color: '#de5d25' }}>
                    {campo.preco}€
                  </p>
                  <Link 
                    href={`/campo/${campo.id}`} 
                    style={{ display: 'block', marginTop: '16px', backgroundColor: '#f1f5f9', textAlign: 'center', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', color: '#334155', textDecoration: 'none' }}
                  >
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
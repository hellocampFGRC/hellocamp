"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';

export default function MapaWrapper({ campos, lang }: { campos: any[], lang: string }) {
  const [mounted, setMounted] = useState(false);
  const isEn = lang === 'en';

  useEffect(() => {
    setMounted(true);
  }, []);

  const camposValidos = useMemo(() => {
    const lista = campos || [];
    return lista
      .map((c, index) => {
        // MICRO-DESVIO: Espalha os marcadores que partilhem a exata mesma morada (ex: Studio Cambridge)
        const lat = Number(c.latitude) + (index * 0.00015);
        const lng = Number(c.longitude) + (index * 0.00015);

        if (!c.latitude || !c.longitude || isNaN(lat) || isNaN(lng)) return null;

        return { ...c, lat_offset: lat, lng_offset: lng };
      })
      .filter(c => c !== null);
  }, [campos]);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">
        A carregar mapa...
      </div>
    );
  }

  // Ícone Perfeito: Cravado no mapa pela ponta inferior (iconAnchor: [16, 38])
  const createCustomIcon = () => {
    return L.divIcon({
      className: 'bg-transparent border-0',
      html: `
        <div style="
          position: relative;
          width: 32px; height: 32px; 
          background-color: white; 
          border: 3px solid #eab308; 
          border-radius: 50%; 
          display: flex; justify-content: center; align-items: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        ">
          <!-- Ponto central decorativo -->
          <div style="width: 10px; height: 10px; background: #eab308; border-radius: 50%;"></div>
          <!-- Bico do pino a apontar para baixo -->
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0; 
            height: 0; 
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid #eab308;
          "></div>
        </div>
      `,
      iconSize: [32, 40],       // Largura 32px, Altura total 40px (32 + bico)
      iconAnchor: [16, 40],     // A âncora é EXATAMENTE o meio (16) e a base do bico (40). Isto impede que mexa com o zoom!
      popupAnchor: [0, -42],    // O popup abre logo acima do pino
    });
  };

  return (
    <MapContainer 
      center={[46.0, 2.0]} // Focado na Europa Ocidental
      zoom={5} 
      style={{ height: "100%", width: "100%", zIndex: 10 }}
    >
      {/* MAPA TERRAIN ESTILO WATERCOLOR */}
      <TileLayer
        url="https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.jpg"
        attribution='Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL.'
        subdomains='abcd'
      />
      
      {camposValidos.map((campo: any) => {
        const titulo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
        const mainImage = campo.imagem || '/og-image.jpg';

        return (
          <Marker 
            key={campo.id} 
            position={[campo.lat_offset, campo.lng_offset]} 
            icon={createCustomIcon()}
          >
            <Popup className="rounded-xl overflow-hidden min-w-[200px] border-0 shadow-xl">
               <div className="flex flex-col gap-2 -m-1">
                  <div className="w-full h-24 bg-cover bg-center rounded-t-lg" style={{ backgroundImage: `url('${mainImage}')` }} />
                  <div className="p-3">
                    <h3 className="font-black text-sm text-slate-900 m-0 leading-tight mb-2 line-clamp-2">{titulo}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#eab308] mb-3">
                      {isEn ? 'From' : 'Desde'} €{campo.preco}
                    </p>
                    <Link href={`/${lang}/campo/${campo.id}`} className="block text-center bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg hover:bg-slate-800 transition-colors no-underline">
                      {isEn ? 'View Program' : 'Ver Programa'}
                    </Link>
                  </div>
               </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
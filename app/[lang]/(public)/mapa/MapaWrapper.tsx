"use client";

import dynamic from "next/dynamic";

const MapaMapLibre = dynamic(() => import("./MapaMapLibre"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          A carregar mapa...
        </span>
      </div>
    </div>
  ),
});

export default function MapaWrapper({
  campos,
  lang,
}: {
  campos: any[];
  lang: string;
}) {
  return <MapaMapLibre campos={campos} lang={lang} />;
}
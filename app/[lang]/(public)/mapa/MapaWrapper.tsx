"use client";

import dynamic from "next/dynamic";

// Como este ficheiro tem "use client" no topo, o Next.js já permite o ssr: false
const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), { ssr: false });

export default function MapaWrapper({ campos }: { campos: any[] }) {
  return <MapaLeaflet campos={campos} />;
}
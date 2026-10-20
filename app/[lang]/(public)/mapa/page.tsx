import { supabase } from "@/lib/supabase";
import Link from "next/link";
import MapaWrapper from "./MapaWrapper";
import { getDictionary } from "@/lib/getDictionary";
import { unstable_cache } from "next/cache";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Mapa de Campos de Férias | HelloCamp",
  description: "Explore no mapa interativo todos os campos de férias em Portugal e no Mundo. Filtre por categoria e idade.",
};

// ═══════════════════════════════════════════
// CACHE DE DADOS (24 HORAS) - ZERO EGRESS
// ═══════════════════════════════════════════
const getCamposMapaCache = unstable_cache(
  async () => {
    const { data } = await supabase
      .from("campos")
      .select("id, nome, nome_en, categoria, categoria_en, idade, idade_en, linguas_faladas, preco, imagem, latitude, longitude")
      .eq("ativo", true)
      .not("contrato_parceiro_url", "is", null);
    return data || [];
  },
  ['cache-mapa-campos-v2'],
  { revalidate: 0 } // 24h
);

export default async function PaginaMapa({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "pt" | "en");
  const sp = await searchParams;
  const isEn = lang === "en";

  const categoria = sp?.categoria || "";
  const idade = sp?.idade || "";
  const lingua = sp?.lingua || "";

  // 1. CARREGAR DADOS DA CACHE (Ultra-Rápido)
  const todosOsCampos = await getCamposMapaCache();

  const categoriasMap = new Map<string, string>();
  const idadesMap = new Map<string, string>();
  const linguasMap = new Set<string>();

  todosOsCampos.forEach((c: any) => {
    if (c.categoria?.trim()) categoriasMap.set(c.categoria.trim(), c.categoria_en?.trim() || c.categoria.trim());
    if (c.idade?.trim()) idadesMap.set(c.idade.trim(), c.idade_en?.trim() || c.idade.trim());
    if (c.linguas_faladas?.trim()) linguasMap.add(c.linguas_faladas.trim());
  });

  const categoriasOpcoes = Array.from(categoriasMap.entries()).map(([pt, en]) => ({ valor: pt, label: isEn ? en : pt }));
  const idadesOpcoes = Array.from(idadesMap.entries()).map(([pt, en]) => ({ valor: pt, label: isEn ? en : pt }));
  const linguasUnicas = Array.from(linguasMap).sort();

  // 2. FILTRAGEM INSTANTÂNEA NA RAM
  let camposExibidos = todosOsCampos;

  if (categoria) camposExibidos = camposExibidos.filter(c => c.categoria === categoria);
  if (idade) camposExibidos = camposExibidos.filter(c => c.idade === idade);
  if (lingua) camposExibidos = camposExibidos.filter(c => (c.linguas_faladas || '').includes(lingua));

  const temFiltrosAtivos = !!(categoria || idade || lingua);

  return (
    <main className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-slate-50 font-sans overflow-hidden">

      {/* BARRA LATERAL (SIDEBAR DE FILTROS) */}
      <aside className="w-full md:w-[380px] bg-white border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto p-6 md:p-8 flex flex-col flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 max-h-[45vh] md:max-h-full">

        <Link
          href={`/${lang}`}
          className="hidden md:inline-flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-slate-400 no-underline hover:text-slate-900 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg w-max"
        >
          &larr; {dict.mapa.voltar}
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {dict.mapa.filtros}
          </h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            {camposExibidos.length} {dict.mapa.encontrados}
          </span>
        </div>

        <form action={`/${lang}/mapa`} method="GET" className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{dict.mapa.categoria}</label>
            <select name="categoria" defaultValue={categoria} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-900 cursor-pointer transition-colors">
              <option value="">{dict.mapa.todas}</option>
              {categoriasOpcoes.map((cat) => <option key={cat.valor} value={cat.valor}>{cat.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{dict.mapa.idade}</label>
            <select name="idade" defaultValue={idade} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-900 cursor-pointer transition-colors">
              <option value="">{dict.mapa.qualquer_idade}</option>
              {idadesOpcoes.map((id) => <option key={id.valor} value={id.valor}>{id.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{dict.mapa.linguas}</label>
            <select name="lingua" defaultValue={lingua} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-900 cursor-pointer transition-colors">
              <option value="">{dict.mapa.qualquer_lingua}</option>
              {linguasUnicas.map((lin) => <option key={lin} value={lin}>{lin}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button type="submit" className="w-full bg-[#167524] hover:bg-[#115a1b] text-white font-black py-4 rounded-xl text-sm transition-all shadow-md">
              {dict.mapa.atualizar}
            </button>
            {temFiltrosAtivos && (
              <Link href={`/${lang}/mapa`} className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-widest text-center transition-colors">
                {dict.mapa.limpar}
              </Link>
            )}
          </div>
        </form>
      </aside>

      {/* ÁREA DO MAPA */}
      <section className="flex-1 relative min-h-[55vh] md:min-h-0 bg-slate-200">
        <MapaWrapper campos={camposExibidos || []} lang={lang} />
      </section>
    </main>
  );
}
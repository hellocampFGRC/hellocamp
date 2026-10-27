import { supabase } from "@/lib/supabase";
import { getDictionary } from "@/lib/getDictionary";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Metadata } from "next";
import MapaWrapper from "./MapaWrapper";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isEn = lang === "en";

  const title = isEn
    ? "Interactive Summer Camps Map | HelloCamp"
    : "Mapa Interativo de Campos de Férias | HelloCamp";

  const description = isEn
    ? "Explore all holiday camps, sports clinics, and youth activities in Portugal and Europe on our interactive map. Filter by category, age, and spoken languages."
    : "Explore no mapa interativo todos os campos de férias em Portugal e na Europa. Filtre por categoria, faixa etária e línguas faladas.";

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.hellocamp.pt/${lang}/mapa`,
      languages: {
        "pt-PT": "https://www.hellocamp.pt/pt/mapa",
        "en-US": "https://www.hellocamp.pt/en/mapa",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.hellocamp.pt/${lang}/mapa`,
      siteName: "HelloCamp",
      type: "website",
    },
  };
}

// ═══════════════════════════════════════════
// CACHE DE DADOS (24 HORAS) - ZERO EGRESS
// ═══════════════════════════════════════════
const getCamposMapaCache = unstable_cache(
  async () => {
    const { data } = await supabase
      .from("campos")
      .select(
        "id, nome, nome_en, categoria, categoria_en, idade, idade_en, linguas_faladas, preco, pacotes, imagem, latitude, longitude"
      )
      .eq("ativo", true)
      .not("contrato_parceiro_url", "is", null);
    return data || [];
  },
  ["cache-mapa-campos-v3"],
  { revalidate: 86400 }
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

  // 1. CARREGAR DADOS DA CACHE
  const todosOsCamposRaw = await getCamposMapaCache();

  // Garante que se o campo tiver preço base 0 mas tiver pacotes, calcula o preço mínimo para mostrar no pino do mapa
  const todosOsCampos = todosOsCamposRaw.map((c: any) => {
    let precoCalc = Number(c.preco) || 0;
    if (!precoCalc && Array.isArray(c.pacotes) && c.pacotes.length > 0) {
      const todosPrecos = c.pacotes.flatMap((p: any) =>
        Array.isArray(p.variantes) ? p.variantes.map((v: any) => Number(v.preco) || 0).filter((v: number) => v > 0) : []
      );
      if (todosPrecos.length > 0) precoCalc = Math.min(...todosPrecos);
    }
    return { ...c, preco: precoCalc };
  });

  // Extrair opções únicas para os selects de filtro
  const categoriasMap = new Map<string, string>();
  const idadesMap = new Map<string, string>();
  const linguasSet = new Set<string>();

  todosOsCampos.forEach((c: any) => {
    if (c.categoria?.trim()) {
      categoriasMap.set(c.categoria.trim(), c.categoria_en?.trim() || c.categoria.trim());
    }
    if (c.idade?.trim()) {
      idadesMap.set(c.idade.trim(), c.idade_en?.trim() || c.idade.trim());
    }
    if (c.linguas_faladas) {
      String(c.linguas_faladas)
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean)
        .forEach((l) => linguasSet.add(l));
    }
  });

  const categoriasOpcoes = Array.from(categoriasMap.entries()).map(([pt, en]) => ({
    valor: pt,
    label: isEn ? en : pt,
  }));
  const idadesOpcoes = Array.from(idadesMap.entries()).map(([pt, en]) => ({
    valor: pt,
    label: isEn ? en : pt,
  }));
  const linguasUnicas = Array.from(linguasSet).sort();

  // 2. FILTRAGEM INSTANTÂNEA NA RAM
  let camposExibidos = todosOsCampos;

  if (categoria) camposExibidos = camposExibidos.filter((c: any) => c.categoria === categoria);
  if (idade) camposExibidos = camposExibidos.filter((c: any) => c.idade === idade);
  if (lingua) {
    camposExibidos = camposExibidos.filter((c: any) =>
      String(c.linguas_faladas || "").toLowerCase().includes(lingua.toLowerCase())
    );
  }

  const temFiltrosAtivos = !!(categoria || idade || lingua);

  return (
    <main className="flex flex-col md:flex-row h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] bg-slate-50 font-sans overflow-hidden">
      {/* BARRA LATERAL (SIDEBAR DE FILTROS) */}
      <aside className="w-full md:w-[380px] bg-white border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto p-6 md:p-8 flex flex-col flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 max-h-[45vh] md:max-h-full">
        <Link
          href={`/${lang}`}
          className="hidden md:inline-flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-slate-400 no-underline hover:text-slate-900 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg w-max"
        >
          &larr; {dict.mapa.voltar}
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight m-0">
            {dict.mapa.filtros}
          </h1>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            {camposExibidos.length} {dict.mapa.encontrados}
          </span>
        </div>

        <form action={`/${lang}/mapa`} method="GET" className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              {dict.mapa.categoria}
            </label>
            <select
              name="categoria"
              defaultValue={categoria}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-900 cursor-pointer transition-colors"
            >
              <option value="">{dict.mapa.todas}</option>
              {categoriasOpcoes.map((cat) => (
                <option key={cat.valor} value={cat.valor}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              {dict.mapa.idade}
            </label>
            <select
              name="idade"
              defaultValue={idade}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-900 cursor-pointer transition-colors"
            >
              <option value="">{dict.mapa.qualquer_idade}</option>
              {idadesOpcoes.map((id) => (
                <option key={id.valor} value={id.valor}>
                  {id.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              {dict.mapa.linguas}
            </label>
            <select
              name="lingua"
              defaultValue={lingua}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-900 cursor-pointer transition-colors"
            >
              <option value="">{dict.mapa.qualquer_lingua}</option>
              {linguasUnicas.map((lin) => (
                <option key={lin} value={lin}>
                  {lin}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button
              type="submit"
              className="w-full bg-[#167524] hover:bg-[#115a1b] text-white font-black py-4 rounded-xl text-sm transition-all shadow-md cursor-pointer"
            >
              {dict.mapa.atualizar}
            </button>
            {temFiltrosAtivos && (
              <Link
                href={`/${lang}/mapa`}
                className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-widest text-center transition-colors no-underline"
              >
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
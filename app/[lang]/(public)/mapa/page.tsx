import { supabase } from "@/lib/supabase";
import Link from "next/link";
import MapaWrapper from "../../../../components/mapa/MapaWrapper";
import { getDictionary } from "@/lib/getDictionary";

export const metadata = {
  title: "Mapa de Campos de Férias em Portugal | HelloCamp",
  description:
    "Explore no mapa interativo todos os campos de férias verificados em Portugal. Filtre por categoria, idade e idioma.",
};

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

  // ═══════════════════════════════════════════
  // Query dos campos filtrados
  // ═══════════════════════════════════════════
  let query = supabase
    .from("campos")
    .select(
      "id, nome, nome_en, imagem, categoria, categoria_en, preco, latitude, longitude"
    )
    .not("contrato_parceiro_url", "is", null)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (categoria) query = query.eq("categoria", categoria);
  if (idade) query = query.eq("idade", idade);
  if (lingua) query = query.ilike("linguas_faladas", `%${lingua}%`);

  const { data: campos } = await query;

  // ═══════════════════════════════════════════
  // Opções de filtros (dinâmicas)
  // ═══════════════════════════════════════════
  const { data: todosFiltros } = await supabase
    .from("campos")
    .select("categoria, categoria_en, idade, idade_en, linguas_faladas")
    .not("contrato_parceiro_url", "is", null);

  const categoriasMap = new Map<string, string>();
  const idadesMap = new Map<string, string>();
  const linguasMap = new Set<string>();

  if (todosFiltros) {
    todosFiltros.forEach((c: any) => {
      if (c.categoria && c.categoria.trim())
        categoriasMap.set(
          c.categoria.trim(),
          c.categoria_en?.trim() || c.categoria.trim()
        );
      if (c.idade && c.idade.trim())
        idadesMap.set(c.idade.trim(), c.idade_en?.trim() || c.idade.trim());
      if (c.linguas_faladas && c.linguas_faladas.trim())
        linguasMap.add(c.linguas_faladas.trim());
    });
  }

  const categoriasOpcoes = Array.from(categoriasMap.entries()).map(
    ([pt, en]) => ({ valor: pt, label: isEn ? en : pt })
  );
  const idadesOpcoes = Array.from(idadesMap.entries()).map(([pt, en]) => ({
    valor: pt,
    label: isEn ? en : pt,
  }));
  const linguasUnicas = Array.from(linguasMap).sort();

  const temFiltrosAtivos = !!(categoria || idade || lingua);

  return (
    <main className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-slate-50 font-sans overflow-hidden">

      {/* ═══════════════════════════════════════════ */}
      {/* SIDEBAR DE FILTROS                          */}
      {/* ═══════════════════════════════════════════ */}
      <aside className="w-full md:w-[340px] bg-white border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto p-5 md:p-6 flex flex-col flex-shrink-0 shadow-sm z-10 max-h-[45vh] md:max-h-full">

        <Link
          href={`/${lang}`}
          className="hidden md:inline-flex items-center gap-1 mb-6 text-xs font-bold text-slate-500 no-underline hover:text-emerald-600 transition-colors"
        >
          &larr; {dict.mapa.voltar}
        </Link>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-slate-900">
            {dict.mapa.filtros}
          </h2>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            {campos?.length || 0} {dict.mapa.encontrados}
          </span>
        </div>

        <form
          action={`/${lang}/mapa`}
          method="GET"
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                {dict.mapa.categoria}
              </label>
              <select
                name="categoria"
                defaultValue={categoria}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">{dict.mapa.todas}</option>
                {categoriasOpcoes.map((cat) => (
                  <option key={cat.valor} value={cat.valor}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                {dict.mapa.idade}
              </label>
              <select
                name="idade"
                defaultValue={idade}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">{dict.mapa.qualquer_idade}</option>
                {idadesOpcoes.map((id) => (
                  <option key={id.valor} value={id.valor}>
                    {id.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                {dict.mapa.linguas}
              </label>
              <select
                name="lingua"
                defaultValue={lingua}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">{dict.mapa.qualquer_lingua}</option>
                {linguasUnicas.map((lin) => (
                  <option key={lin} value={lin}>
                    {lin}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
            >
              {dict.mapa.atualizar}
            </button>
            {temFiltrosAtivos && (
              <Link
                href={`/${lang}/mapa`}
                className="text-sm text-red-500 hover:text-red-700 font-bold whitespace-nowrap transition-colors"
              >
                {dict.mapa.limpar}
              </Link>
            )}
          </div>
        </form>

        {/* Nota útil no fundo da sidebar (desktop) */}
        <div className="mt-6 pt-5 border-t border-slate-100 hidden md:block">
          <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
            {isEn
              ? "Click on any pin to see the camp details and start your booking."
              : "Clique num pin para ver os detalhes do campo e iniciar a sua reserva."}
          </p>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════ */}
      {/* MAPA                                        */}
      {/* ═══════════════════════════════════════════ */}
      <section className="flex-1 relative min-h-[55vh] md:min-h-0">
        <MapaWrapper campos={campos || []} lang={lang} />
      </section>
    </main>
  );
}
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Metadata } from "next";
import BotaoFavorito from "../components/BotaoFavorito";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isEn = lang === "en";

  return {
    title: isEn
      ? "Search Holiday Camps & Youth Programs | HelloCamp"
      : "Pesquisar Campos de Férias e Programas | HelloCamp",
    description: isEn
      ? "Filter and compare verified summer camps by sport, age, location, and date."
      : "Filtre e compare campos de férias verificados por desporto, idade, distrito, país e datas.",
  };
}

const normalize = (str: string) =>
  (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default async function PesquisaPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { lang } = await params;
  const sp = await searchParams;
  const isEn = lang === "en";

  const qParam = sp?.q || "";
  const paisParam = sp?.pais || "";
  const distritoParam = sp?.distrito || "";
  const categoriaParam = sp?.categoria || "";
  const idadeParam = sp?.idade || "";
  const dataParam = sp?.data || "";
  const ordemParam = sp?.ordem || "relevancia";

  const { data: todosCampos } = await supabase
    .from("campos")
    .select("*")
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  const listaBruta = todosCampos || [];

  const resultados = listaBruta.filter((c: any) => {
    if (qParam) {
      const qNorm = normalize(qParam);
      const texto = normalize(
        `${c.nome || ""} ${c.nome_en || ""} ${c.categoria || ""} ${
          c.Distrito || ""
        } ${c.local || ""} ${c.descricao || ""}`
      );
      if (!texto.includes(qNorm)) return false;
    }

    if (paisParam) {
      const paisCampo = normalize(c.pais || "Portugal");
      if (!paisCampo.includes(normalize(paisParam))) return false;
    }

    if (distritoParam) {
      const locCampo = normalize(`${c.Distrito || ""} ${c.local || ""}`);
      if (!locCampo.includes(normalize(distritoParam))) return false;
    }

    if (categoriaParam) {
      const catNorm = normalize(categoriaParam);
      const catCampo = normalize(`${c.categoria || ""} ${c.categoria_en || ""}`);
      if (
        !catCampo.includes(catNorm) &&
        !(catNorm.includes("desporto") && catCampo.includes("futebol")) &&
        !(catNorm.includes("linguas") && catCampo.includes("ingles"))
      ) {
        return false;
      }
    }

    if (idadeParam) {
      const matchRange = idadeParam.match(/(\d+)\D+(\d+)/);
      const matchCampo = (c.idade || "").match(/(\d+)\D+(\d+)/);
      if (matchRange && matchCampo) {
        const minFiltro = parseInt(matchRange[1], 10);
        const maxFiltro = parseInt(matchRange[2], 10);
        const minCampo = parseInt(matchCampo[1], 10);
        const maxCampo = parseInt(matchCampo[2], 10);
        if (maxCampo < minFiltro || minCampo > maxFiltro) return false;
      }
    }

    if (dataParam) {
      const dataText = JSON.stringify(c.pacotes || "") + (c.datas || "");
      if (dataText.length > 5 && !dataText.includes(dataParam.slice(0, 7))) {
        return false;
      }
    }

    return true;
  });

  const obterPrecoMinimo = (campo: any) => {
    let p = Number(campo.preco) || 0;
    let pacotesArray = [];
    if (typeof campo.pacotes === "string") {
      try {
        pacotesArray = JSON.parse(campo.pacotes);
      } catch {
        pacotesArray = [];
      }
    } else if (Array.isArray(campo.pacotes)) {
      pacotesArray = campo.pacotes;
    }
    if (!p && pacotesArray.length > 0) {
      const precos = pacotesArray
        .flatMap((pac: any) =>
          Array.isArray(pac.variantes)
            ? pac.variantes.map((v: any) => Number(v.preco) || 0)
            : []
        )
        .filter((val: number) => val > 0);
      if (precos.length > 0) p = Math.min(...precos);
    }
    return p;
  };

  if (ordemParam === "preco_asc") {
    resultados.sort((a, b) => obterPrecoMinimo(a) - obterPrecoMinimo(b));
  } else if (ordemParam === "preco_desc") {
    resultados.sort((a, b) => obterPrecoMinimo(b) - obterPrecoMinimo(a));
  }

  const distritosPT = [
    "Aveiro",
    "Beja",
    "Braga",
    "Bragança",
    "Castelo Branco",
    "Coimbra",
    "Évora",
    "Faro",
    "Guarda",
    "Leiria",
    "Lisboa",
    "Portalegre",
    "Porto",
    "Santarém",
    "Setúbal",
    "Viana do Castelo",
    "Vila Real",
    "Viseu",
  ];

  const temFiltros =
    qParam ||
    paisParam ||
    distritoParam ||
    categoriaParam ||
    idadeParam ||
    dataParam;

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      {/* HEADER DA PESQUISA */}
      <section className="bg-[#2563EB] text-white pt-12 pb-16 px-4 md:px-8 border-b-4 border-[#F59E0B]">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="inline-block bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-3">
              {isEn ? "Directory & Booking" : "Diretório Oficial"}
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white m-0">
              {isEn ? "Explore Holiday Camps" : "Explorar Campos de Férias"}
            </h1>
            <p className="text-blue-100 text-sm md:text-base font-medium mt-2 mb-0">
              {isEn
                ? "Compare verified programs, dates, and prices in one place."
                : "Compare programas verificados, datas e preços num só lugar."}
            </p>
          </div>

          <Link
            href={`/${lang}/mapa`}
            className="bg-[#F59E0B] hover:bg-amber-600 text-white px-6 py-3.5 rounded-md text-xs font-black uppercase tracking-widest no-underline transition-all shadow-md flex items-center justify-center gap-2 w-fit"
          >
            <span>🗺️</span>{" "}
            {isEn ? "Open Interactive Map" : "Ver no Mapa Interativo"}
          </Link>
        </div>
      </section>

      {/* BARRA DE FILTROS */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8 -mt-8 relative z-20 mb-10">
        <form
          action={`/${lang}/pesquisa`}
          method="GET"
          className="bg-white p-6 rounded-md shadow-xl border border-slate-200 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {isEn ? "Keyword" : "Pesquisa Livre"}
              </label>
              <input
                type="text"
                name="q"
                defaultValue={qParam}
                placeholder={
                  isEn
                    ? "Surf, Football, Robotics, Lisbon..."
                    : "Surf, Futebol, Robótica, Lisboa..."
                }
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md px-4 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {isEn ? "District" : "Distrito"}
              </label>
              <select
                name="distrito"
                defaultValue={distritoParam}
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md px-3 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value="">
                  {isEn ? "All Districts" : "Todos os Distritos"}
                </option>
                {distritosPT.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {isEn ? "Category" : "Categoria"}
              </label>
              <select
                name="categoria"
                defaultValue={categoriaParam}
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md px-3 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value="">
                  {isEn ? "All Categories" : "Todas as Categorias"}
                </option>
                <option value="Desporto">{isEn ? "Sports" : "Desporto"}</option>
                <option value="Surf">Surf & Náutica</option>
                <option value="Aventura & Natureza">
                  {isEn ? "Adventure & Nature" : "Aventura & Natureza"}
                </option>
                <option value="Tecnologia & Ciência">
                  {isEn ? "Tech & Science" : "Tecnologia & Ciência"}
                </option>
                <option value="Artes & Criatividade">
                  {isEn ? "Arts & Creativity" : "Artes & Criatividade"}
                </option>
                <option value="Línguas">{isEn ? "Languages" : "Línguas"}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {isEn ? "Age Group" : "Faixa Etária"}
              </label>
              <select
                name="idade"
                defaultValue={idadeParam}
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md px-3 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] cursor-pointer"
              >
                <option value="">
                  {isEn ? "All Ages" : "Todas as Idades"}
                </option>
                <option value="3-6">3 - 6 {isEn ? "years" : "anos"}</option>
                <option value="7-12">7 - 12 {isEn ? "years" : "anos"}</option>
                <option value="13-18">13 - 18 {isEn ? "years" : "anos"}</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full bg-[#F59E0B] hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs py-3.5 px-4 rounded-md transition-colors cursor-pointer border-0 shadow-sm"
              >
                {isEn ? "Filter Results" : "Filtrar Campos"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-500">
                {resultados.length}{" "}
                {isEn ? "programs found" : "programas encontrados"}
              </span>
              {temFiltros && (
                <Link
                  href={`/${lang}/pesquisa`}
                  className="bg-[#F43F5E] hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md no-underline"
                >
                  ✕ {isEn ? "Clear Filters" : "Limpar Filtros"}
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {isEn ? "Sort by:" : "Ordenar:"}
              </label>
              <select
                name="ordem"
                defaultValue={ordemParam}
                className="bg-[#F8FAFC] border border-slate-200 rounded-md px-3 py-1.5 text-xs font-bold text-[#0F172A] outline-none"
              >
                <option value="relevancia">
                  {isEn ? "Featured" : "Relevância"}
                </option>
                <option value="preco_asc">
                  {isEn ? "Price: Low to High" : "Preço: Mais Baixo"}
                </option>
                <option value="preco_desc">
                  {isEn ? "Price: High to Low" : "Preço: Mais Alto"}
                </option>
              </select>
            </div>
          </div>
        </form>
      </section>

      {/* GRELHA DE RESULTADOS */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8">
        {resultados.length === 0 ? (
          <div className="bg-white rounded-md border border-slate-200 p-12 text-center shadow-sm max-w-xl mx-auto">
            <span className="text-5xl block mb-4">🏕️</span>
            <h2 className="text-2xl font-black text-[#0F172A] mb-2">
              {isEn
                ? "No camps match your exact filters"
                : "Nenhum campo encontrado com estes filtros"}
            </h2>
            <p className="text-slate-500 text-sm font-medium mb-6">
              {isEn
                ? "Try clearing some filters or exploring all active programs."
                : "Experimente limpar os filtros selecionados para ver todos os programas ativos."}
            </p>
            <Link
              href={`/${lang}/pesquisa`}
              className="inline-block bg-[#2563EB] hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-md no-underline shadow-sm"
            >
              {isEn ? "Show All Camps" : "Ver Todos os Campos"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resultados.map((campo: any) => {
              const nome = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const cat =
                isEn && campo.categoria_en
                  ? campo.categoria_en
                  : campo.categoria;
              const local =
                isEn && campo.local_en
                  ? campo.local_en
                  : campo.Distrito || campo.local || "Portugal";
              const preco = obterPrecoMinimo(campo);
              const imgUrl = campo.imagem?.startsWith("http")
                ? campo.imagem
                : "/og-image.jpg";

              return (
                <div
                  key={campo.id}
                  className="group flex flex-col bg-white border border-slate-200 rounded-md shadow-sm hover:shadow-xl hover:border-[#2563EB] transition-all duration-300 hover:-translate-y-1 overflow-hidden relative"
                >
                  <Link
                    href={`/${lang}/campo/${campo.id}`}
                    className="absolute inset-0 z-10"
                  >
                    <span className="sr-only">Ver {nome}</span>
                  </Link>

                  <div className="absolute top-4 right-4 z-20">
                    <BotaoFavorito campoId={campo.id} />
                  </div>

                  <div className="relative h-60 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={nome}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-[#2563EB] text-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md shadow-sm">
                      {cat}
                    </div>
                  </div>

                  <div className="flex flex-col p-6 flex-1 pointer-events-none">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      <span>📍 {local}</span>
                      {campo.idade && <span>• 👶 {campo.idade}</span>}
                    </div>

                    <h3 className="text-xl font-black text-[#0F172A] leading-tight mb-4 line-clamp-2">
                      {nome}
                    </h3>

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                          {isEn ? "From" : "Desde"}
                        </span>
                        <span className="text-2xl font-black text-[#2563EB]">
                          {preco > 0 ? `${preco}€` : "Sob Consulta"}
                        </span>
                      </div>
                      <span className="bg-[#0F172A] group-hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-md text-xs font-black uppercase tracking-widest transition-colors shadow-sm">
                        {isEn ? "View Dates" : "Ver Detalhes"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
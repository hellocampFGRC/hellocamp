import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Metadata } from "next";
import BotaoFavorito from "../../(public)/components/BotaoFavorito";

export const dynamic = "force-dynamic";

const getCamposCacheados = unstable_cache(
  async () => {
    const { data } = await supabase
      .from("campos")
      .select("*")
      .eq("ativo", true)
      .not("contrato_parceiro_url", "is", null)
      .order("nome");
    return data || [];
  },
  ["cache-pesquisa-campos"],
  { revalidate: 86400 }
);

// Função de normalização que remove acentos e caracteres especiais para comparação infalível
function normalizeStr(str?: string | null): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Filtra campos com inteligência semântica (ex: "ingles" -> "linguas"/"ingles", "algarve" -> "faro"/"algarve")
function filtrarCamposPorRotaProgramatica(todosOsCampos: any[], categoriaSlug: string, localizacaoSlug: string) {
  const catNorm = normalizeStr(decodeURIComponent(categoriaSlug).replace(/-/g, " "));
  const locNorm = normalizeStr(decodeURIComponent(localizacaoSlug).replace(/-/g, " "));

  // Sinónimos de categorias para garantir que "ingles", "surf", "futebol" encontram resultados
  const termosCat = [catNorm];
  if (catNorm === "ingles" || catNorm === "english" || catNorm === "linguas") {
    termosCat.push("linguas", "languages", "ingles", "english", "idiomas");
  }
  if (catNorm === "desportos" || catNorm === "sports") {
    termosCat.push("desporto", "sports");
  }

  // Sinónimos geográficos (ex: Algarve -> Distrito de Faro)
  const termosLoc = [locNorm];
  if (locNorm === "algarve") termosLoc.push("faro", "algarve", "portimao", "lagos", "albufeira", "loulé", "loule", "tavira");
  if (locNorm === "reino unido" || locNorm === "uk" || locNorm === "united kingdom") {
    termosLoc.push("reino unido", "united kingdom", "uk", "inglaterra", "londres", "london");
  }
  if (locNorm === "espanha" || locNorm === "spain") {
    termosLoc.push("espanha", "spain", "madrid", "barcelona", "valencia");
  }

  return todosOsCampos.filter((c) => {
    const textoCategoriaECampo = normalizeStr(
      `${c.categoria || ""} ${c.categoria_en || ""} ${c.nome || ""} ${c.nome_en || ""} ${c.descricao || ""} ${c.descricao_en || ""}`
    );
    const textoLocalizacao = normalizeStr(
      `${c.Distrito || ""} ${c.distrito || ""} ${c.local || ""} ${c.local_en || ""} ${c.pais || ""} ${c.pais_en || ""}`
    );

    const matchCat = termosCat.some((t) => textoCategoriaECampo.includes(t));
    const matchLoc = termosLoc.some((t) => textoLocalizacao.includes(t));

    return matchCat && matchLoc;
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; categoria: string; localizacao: string }>;
}): Promise<Metadata> {
  const { lang, categoria, localizacao } = await params;
  const isEn = lang === "en";

  const catFormatada = decodeURIComponent(categoria)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const localFormatado = decodeURIComponent(localizacao)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const todosOsCampos = await getCamposCacheados();
  const camposFiltrados = filtrarCamposPorRotaProgramatica(todosOsCampos, categoria, localizacao);
  const count = camposFiltrados.length;

  const metaTitle = isEn
    ? `Best ${catFormatada} Camps in ${localFormatado} (${new Date().getFullYear()}) | HelloCamp`
    : `Campos de Férias de ${catFormatada} em ${localFormatado} (${new Date().getFullYear()}) | HelloCamp`;

  const metaDescription = isEn
    ? `Compare and book ${count > 0 ? count : "the best"} verified ${catFormatada.toLowerCase()} camps and youth programs in ${localFormatado}. Direct booking, verified organizers, and parent reviews on HelloCamp.`
    : `Compare e reserve ${count > 0 ? count : "os melhores"} campos de férias e programas de ${catFormatada.toLowerCase()} em ${localFormatado}. Inscrições seguras, parceiros verificados e avaliações reais na HelloCamp.`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: `https://www.hellocamp.pt/${lang}/${categoria}/${localizacao}`,
      languages: {
        "pt-PT": `https://www.hellocamp.pt/pt/${categoria}/${localizacao}`,
        "en-US": `https://www.hellocamp.pt/en/${categoria}/${localizacao}`,
      },
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: `https://www.hellocamp.pt/${lang}/${categoria}/${localizacao}`,
      siteName: "HelloCamp",
      type: "website",
    },
  };
}

export default async function CategoriaLocalizacaoPage({
  params,
}: {
  params: Promise<{ lang: string; categoria: string; localizacao: string }>;
}) {
  const { lang, categoria, localizacao } = await params;
  const isEn = lang === "en";

  const catFormatada = decodeURIComponent(categoria)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const localFormatado = decodeURIComponent(localizacao)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const todosOsCampos = await getCamposCacheados();
  const camposFiltrados = filtrarCamposPorRotaProgramatica(todosOsCampos, categoria, localizacao);

  const baseUrl = "https://www.hellocamp.pt";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isEn ? "Home" : "Início",
        item: `${baseUrl}/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: catFormatada,
        item: `${baseUrl}/${lang}/pesquisa?q=${encodeURIComponent(catFormatada)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${catFormatada} - ${localFormatado}`,
        item: `${baseUrl}/${lang}/${categoria}/${localizacao}`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* HERO SEO PROGRAMÁTICO */}
      <section className="bg-white border-b border-slate-200 pt-10 pb-12 px-4 md:px-6 shadow-sm">
        <div className="max-w-[1100px] mx-auto">
          <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-6 tracking-widest uppercase">
            <Link href={`/${lang}`} className="hover:text-[#0E3A68] transition-colors no-underline">
              {isEn ? "Home" : "Início"}
            </Link>
            <span>/</span>
            <Link href={`/${lang}/pesquisa`} className="hover:text-[#0E3A68] transition-colors no-underline">
              {isEn ? "Camps" : "Campos"}
            </Link>
            <span>/</span>
            <span className="text-slate-900">
              {catFormatada} • {localFormatado}
            </span>
          </nav>

          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#167524] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg mb-4">
            {isEn ? "Curated Selection" : "Seleção Especializada HelloCamp"}
          </span>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 capitalize">
            {isEn
              ? `${catFormatada} Camps in ${localFormatado}`
              : `Campos de Férias de ${catFormatada} em ${localFormatado}`}
          </h1>

          <p className="text-base md:text-lg text-slate-500 font-medium max-w-3xl leading-relaxed">
            {isEn
              ? `Discover verified ${catFormatada.toLowerCase()} programs and summer camps in ${localFormatado}. Compare dates, age groups, and book directly with complete peace of mind.`
              : `Descubra os melhores programas e campos de férias de ${catFormatada.toLowerCase()} em ${localFormatado}. Compare datas, idades e reserve diretamente com garantia de segurança.`}
          </p>
        </div>
      </section>

      {/* LISTAGEM DE RESULTADOS */}
      <section className="max-w-[1100px] mx-auto px-4 py-12 md:py-16">
        {camposFiltrados.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-[2rem] border border-slate-200 shadow-sm max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl border border-slate-100 mb-2">
              🏕️
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {isEn
                ? `No exact matches for ${catFormatada} in ${localFormatado} right now`
                : `Ainda não temos campos exatos de ${catFormatada} em ${localFormatado}`}
            </h2>
            <p className="text-slate-500 font-medium text-sm md:text-base">
              {isEn
                ? "We are constantly onboarding new partners. Explore all available programs in our main directory below."
                : "Estamos a integrar novos parceiros todas as semanas. Explore abaixo todos os programas ativos no nosso diretório."}
            </p>
            <Link
              href={`/${lang}/pesquisa`}
              className="mt-4 bg-[#0E3A68] text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl hover:bg-[#0b2b4d] transition-colors shadow-lg no-underline"
            >
              {isEn ? "Explore All Camps" : "Explorar Todos os Campos"}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                {camposFiltrados.length} {isEn ? "programs available" : "programas disponíveis"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {camposFiltrados.map((campo: any) => {
                const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
                const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
                const localCampo = isEn && campo.local_en ? campo.local_en : campo.Distrito || campo.local;

                let precoVisivel = campo.preco || 0;
                if (!precoVisivel && campo.pacotes?.length > 0) {
                  const todosPrecos = campo.pacotes.flatMap(
                    (p: any) => p.variantes?.map((v: any) => v.preco) || []
                  );
                  if (todosPrecos.length > 0) precoVisivel = Math.min(...todosPrecos);
                }

                const imgUrl = campo.imagem?.startsWith("http") ? campo.imagem : "/og-image.jpg";

                return (
                  <div
                    key={campo.id}
                    className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-slate-200 relative shadow-sm hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1"
                  >
                    <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10">
                      <span className="sr-only">Explorar {nomeCampo}</span>
                    </Link>
                    <div className="absolute top-4 right-4 z-20">
                      <BotaoFavorito campoId={campo.id} />
                    </div>

                    <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                      <div
                        className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url('${imgUrl}')` }}
                      />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#0E3A68] rounded-lg z-0 shadow-sm">
                        {catCampo}
                      </div>
                    </div>

                    <div className="flex flex-col p-6 flex-1 pointer-events-none">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        <svg className="w-3 h-3 text-[#e2a41d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {localCampo}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 line-clamp-2">
                        {nomeCampo}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium mb-6">
                        {isEn ? "Ages:" : "Idades:"}{" "}
                        <span className="text-slate-900 font-bold">{campo.idade}</span>
                      </p>

                      <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                            {isEn ? "From" : "A partir de"}
                          </p>
                          <p className="text-2xl font-black text-[#0E3A68] m-0">
                            {precoVisivel > 0 ? `${precoVisivel}€` : "--"}
                          </p>
                        </div>
                        <span className="bg-slate-100 text-[#0E3A68] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors group-hover:bg-[#0E3A68] group-hover:text-white shadow-sm">
                          {isEn ? "View Dates" : "Ver Datas"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
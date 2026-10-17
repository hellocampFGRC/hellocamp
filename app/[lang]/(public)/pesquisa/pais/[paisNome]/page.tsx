import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../../../components/BotaoFavorito";
import Image from "next/image";
import { unstable_cache } from "next/cache";

export const dynamic = 'force-dynamic'; // Porque usa searchParams, mas a BD está em cache

const escapeOr = (str: string) => str.replace(/[,()]/g, ' ').trim();

// ==========================================
// CACHE DE DADOS (24 HORAS) - ZERO EGRESS
// ==========================================
const getPaisCache = unstable_cache(
  async (nomePais: string) => {
    const { data } = await supabase.from('paises').select('*').ilike('nome', nomePais).single();
    return data;
  },
  ['cache-pais-detalhe'],
  { revalidate: 86400 } // 24h
);

const getCamposPorPaisCache = unstable_cache(
  async (nomePais: string) => {
    const { data } = await supabase
      .from("campos")
      .select("*")
      .not('contrato_parceiro_url', 'is', null)
      .or(`pais.ilike.%${nomePais}%,pais_en.ilike.%${nomePais}%`)
      .order('id', { ascending: false });
    return data || [];
  },
  ['cache-campos-pais'],
  { revalidate: 86400 } // 24h
);

// ==========================================
// 1. SEO METADATA
// ==========================================
export async function generateMetadata({
  params
}: {
  params: Promise<{ lang: string; paisNome: string }>
}): Promise<Metadata> {
  const { lang, paisNome } = await params;
  const isEn = lang === 'en';
  const nomeLimpo = decodeURIComponent(paisNome).replace(/[%_]/g, '');

  const pais = await getPaisCache(nomeLimpo);

  if (!pais) {
    return { title: isEn ? `Camps in ${nomeLimpo} | HelloCamp` : `Campos em ${nomeLimpo} | HelloCamp` };
  }

  const title = isEn
    ? (pais.seo_titulo_en || `Summer Camps in ${pais.nome_en || pais.nome} | HelloCamp`)
    : (pais.seo_titulo || `Campos de Férias em ${pais.nome} | HelloCamp`);

  const description = isEn ? pais.seo_descricao_en : pais.seo_descricao;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description || '',
    }
  };
}

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================
export default async function PesquisaPorPais({
  params,
  searchParams
}: {
  params: Promise<{ lang: string; paisNome: string }>;
  searchParams?: Promise<{ [key: string]: string | undefined }>
}) {
  const { lang, paisNome } = await params;
  const sp = await searchParams;
  const isEn = lang === 'en';

  const nomePaisInicial = decodeURIComponent(paisNome).replace(/[%_]/g, '');

  const categoriaParam = sp?.categoria || "";
  const distritoParam = sp?.distrito || "";
  const idadeParam = sp?.idade || "";
  const dataParam = sp?.data || "";

  const mostrarDistritos = nomePaisInicial === "Portugal";

  // Buscar DADOS EM CACHE (24h)
  const dadosPais = await getPaisCache(nomePaisInicial);
  const todosOsCamposDoPais = await getCamposPorPaisCache(nomePaisInicial);

  // FILTRAGEM INSTANTÂNEA EM MEMÓRIA (Server-Side)
  let resultados = todosOsCamposDoPais;

  if (categoriaParam) {
    resultados = resultados.filter(c => c.categoria === categoriaParam);
  }
  if (distritoParam && mostrarDistritos) {
    resultados = resultados.filter(c => (c.Distrito || '').toLowerCase().includes(escapeOr(distritoParam).toLowerCase()));
  }
  if (idadeParam) {
    resultados = resultados.filter(c => c.idade === idadeParam);
  }
  if (dataParam) {
    resultados = resultados.filter(c => {
      if (!c.data_inicio) return false;
      return new Date(c.data_inicio) >= new Date(dataParam);
    });
  }

  const nomePaisApresentar = isEn && dadosPais?.nome_en ? dadosPais.nome_en : nomePaisInicial;

  const descricaoPadrao = isEn
    ? `Explore premium holiday camps in ${nomePaisApresentar}. From thrilling outdoor adventures and intensive sports clubs to creative arts and language classes, discover handpicked programs.`
    : `Explore os melhores campos de férias em ${nomePaisApresentar}. Desde aventuras ao ar livre e atividades desportivas até programas de artes e línguas, descubra opções premium desenhadas para experiências inesquecíveis.`;

  const descPaisFinal = isEn
    ? (dadosPais?.seo_descricao_en || descricaoPadrao)
    : (dadosPais?.seo_descricao || descricaoPadrao);

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];

  const baseUrl = "https://www.hellocamp.pt";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isEn ? "Home" : "Início", "item": `${baseUrl}/${lang}` },
      { "@type": "ListItem", "position": 2, "name": isEn ? "Countries" : "Países", "item": `${baseUrl}/${lang}/pesquisa` },
      { "@type": "ListItem", "position": 3, "name": nomePaisApresentar, "item": `${baseUrl}/${lang}/pesquisa/pais/${encodeURIComponent(nomePaisInicial)}` }
    ]
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* 1. CABEÇALHO EDITORIAL */}
      <section className="bg-white pt-10 pb-8 px-4 md:px-6 border-b border-slate-200 shadow-sm relative z-20">
        <div className="max-w-[1100px] mx-auto">
          <nav className="flex items-center gap-2 text-xs font-black text-slate-400 mb-6 tracking-widest uppercase">
            <Link href={`/${lang}`} className="hover:text-slate-900 transition-colors">{isEn ? 'Home' : 'Início'}</Link>
            <span>/</span>
            <Link href={`/${lang}/pesquisa`} className="hover:text-slate-900 transition-colors">{isEn ? 'Countries' : 'Países'}</Link>
            <span>/</span>
            <span className="text-slate-900">{nomePaisApresentar}</span>
          </nav>

          <div className="max-w-3xl">
            <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 bg-slate-100 w-max px-3 py-1.5 rounded-lg border border-slate-200">
              {isEn ? 'Destination Guide' : 'Guia de Destino'}
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight capitalize">
              {isEn ? `Camps in ${nomePaisApresentar}` : `Campos em ${nomePaisApresentar}`}
            </h1>
            <p className="text-base md:text-lg text-slate-500 leading-relaxed font-medium">
              {descPaisFinal}
            </p>
          </div>
        </div>
      </section>

      {/* 2. BARRA DE FILTROS */}
      <section className="bg-white border-b border-slate-200 py-4 px-4 md:px-6 sticky top-[72px] md:top-[80px] z-30 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="max-w-[1100px] mx-auto">
          <form action={`/${lang}/pesquisa/pais/${encodeURIComponent(nomePaisInicial)}`} method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-center">

            <select name="categoria" defaultValue={categoriaParam} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer focus:border-slate-900 focus:bg-white transition-colors">
              <option value="">{isEn ? 'All Categories' : 'Todas as Categorias'}</option>
              <option value="Desporto">{isEn ? 'Sports' : 'Desporto'}</option>
              <option value="Aventura & Natureza">{isEn ? 'Adventure' : 'Aventura & Natureza'}</option>
              <option value="Tecnologia & Ciência">{isEn ? 'Tech' : 'Tecnologia & Ciência'}</option>
              <option value="Artes & Criatividade">{isEn ? 'Arts' : 'Artes & Criatividade'}</option>
              <option value="Línguas">{isEn ? 'Languages' : 'Línguas'}</option>
            </select>

            {mostrarDistritos && (
              <select name="distrito" defaultValue={distritoParam} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer focus:border-slate-900 focus:bg-white transition-colors">
                <option value="">{isEn ? 'All Districts' : 'Todos os Distritos'}</option>
                {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}

            <select name="idade" defaultValue={idadeParam} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer focus:border-slate-900 focus:bg-white transition-colors">
              <option value="">{isEn ? 'All Ages' : 'Todas as Idades'}</option>
              <option value="6-9 anos">6-9 {isEn ? 'years' : 'anos'}</option>
              <option value="10-13 anos">10-13 {isEn ? 'years' : 'anos'}</option>
              <option value="14-17 anos">14-17 {isEn ? 'years' : 'anos'}</option>
            </select>

            <input
              type="date"
              name="data"
              defaultValue={dataParam}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer focus:border-slate-900 focus:bg-white transition-colors"
            />

            <button type="submit" className="w-full p-3 bg-[#e2a41d] hover:bg-[#d4991b] text-white rounded-xl text-sm font-black transition-colors shadow-sm uppercase tracking-widest">
              {isEn ? 'Update' : 'Atualizar'}
            </button>

            {(categoriaParam || distritoParam || idadeParam || dataParam) && (
              <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(nomePaisInicial)}`} className="text-xs font-bold text-red-500 hover:text-red-600 text-center sm:text-left transition-colors lg:col-span-5 uppercase tracking-widest bg-red-50 w-max px-3 py-1.5 rounded-lg border border-red-100">
                ✕ {isEn ? 'Clear filters' : 'Limpar filtros'}
              </Link>
            )}
          </form>
        </div>
      </section>

      {/* 3. RESULTADOS DA PESQUISA */}
      <section className="max-w-[1100px] mx-auto px-4 py-12 md:py-16">
        {!resultados || resultados.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-[2rem] border border-slate-200 shadow-sm max-w-2xl mx-auto flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl border border-slate-100 mb-2">🏕️</div>
            <h3 className="text-2xl font-black text-slate-900">{isEn ? 'No camps found' : 'Nenhum programa encontrado'}</h3>
            <p className="text-base text-slate-500 font-medium">
              {isEn ? 'Try adjusting your filters or dates.' : 'Não encontrámos resultados exatos. Tente remover o filtro da data ou pesquisar noutra categoria.'}
            </p>
            <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(nomePaisInicial)}`} className="mt-4 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg">
              {isEn ? 'Clear all filters' : 'Ver todos os programas'}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                {resultados.length} {isEn ? 'experiences found' : 'experiências encontradas'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {resultados.map((campo) => {
                const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
                const localVisivel = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);

                let precoVisivel = campo.preco || 0;
                if (!precoVisivel && campo.pacotes && campo.pacotes.length > 0) {
                  const todosPrecos = campo.pacotes.flatMap((p: any) =>
                    p.variantes ? p.variantes.map((v: any) => v.preco) : []
                  );
                  if (todosPrecos.length > 0) precoVisivel = Math.min(...todosPrecos);
                }

                return (
                  <div key={campo.id} className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-slate-200 relative shadow-sm hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
                    <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">Explorar {nomeVisivel}</span></Link>
                    <div className="absolute top-4 right-4 z-20"><BotaoFavorito campoId={campo.id} /></div>

                    {/* IMAGEM NATIVA OTIMIZADA PARA LAZY LOADING */}
                    <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                      <img 
                        src={campo.imagem || '/og-image.jpg'} 
                        alt={nomeVisivel} 
                        loading="lazy" 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-900 rounded-lg z-0 shadow-sm">
                        {campo.categoria}
                      </div>
                    </div>

                    <div className="flex flex-col p-6 flex-1 pointer-events-none">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        {localVisivel}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 line-clamp-2">{nomeVisivel}</h3>
                      <p className="text-sm text-slate-500 font-medium mb-6">
                        {isEn ? 'Ages:' : 'Idades:'} <span className="text-slate-900 font-bold">{campo.idade}</span>
                      </p>

                      <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{isEn ? 'From' : 'A partir de'}</p>
                          <p className="text-2xl font-black text-slate-900 m-0">{precoVisivel > 0 ? `${precoVisivel}€` : '--'}</p>
                        </div>
                        <span className="bg-slate-100 text-slate-900 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors group-hover:bg-[#e2a41d] group-hover:text-white shadow-sm">
                          {isEn ? 'View Dates' : 'Ver Datas'}
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

      {/* 4. CROSS-LINKING (REDE DE LINKS SEO) */}
      <section className="bg-white border-t border-slate-200 py-20 px-4 md:px-6">
        <div className="max-w-[1100px] mx-auto text-center md:text-left">
          <h3 className="text-2xl font-black text-slate-900 mb-8">{isEn ? `Explore more in ${nomePaisApresentar}` : `Explore mais em ${nomePaisApresentar}`}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(nomePaisInicial)}?categoria=Desporto`} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-900 transition-colors text-base font-black text-slate-800 no-underline flex items-center justify-between group shadow-sm hover:shadow-lg">
              <span className="flex items-center gap-3">⚽ {isEn ? `Sports Camps` : `Campos de Desporto`}</span>
              <span className="text-slate-400 group-hover:text-slate-900 transition-colors">&rarr;</span>
            </Link>
            <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(nomePaisInicial)}?categoria=Línguas`} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-900 transition-colors text-base font-black text-slate-800 no-underline flex items-center justify-between group shadow-sm hover:shadow-lg">
              <span className="flex items-center gap-3">🗣️ {isEn ? `Language Camps` : `Campos de Línguas`}</span>
              <span className="text-slate-400 group-hover:text-slate-900 transition-colors">&rarr;</span>
            </Link>
            <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(nomePaisInicial)}?categoria=Aventura & Natureza`} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-900 transition-colors text-base font-black text-slate-800 no-underline flex items-center justify-between group shadow-sm hover:shadow-lg">
              <span className="flex items-center gap-3">🏕️ {isEn ? `Adventure Camps` : `Campos de Aventura`}</span>
              <span className="text-slate-400 group-hover:text-slate-900 transition-colors">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
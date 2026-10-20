import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../../(public)/components/BotaoFavorito";
import { unstable_cache } from "next/cache";

export const dynamic = 'force-dynamic';

const getCamposCacheados = unstable_cache(
  async () => {
    const { data } = await supabase
      .from("campos")
      .select("*")
      .not("contrato_parceiro_url", "is", null)
      .order("nome");
    return data || [];
  },
  ['cache-pesquisa-campos'],
  { revalidate: 86400 }
);

export async function generateMetadata({ params }: { params: Promise<{ lang: string, categoria: string, localizacao: string }> }) {
  const { lang, categoria, localizacao } = await params;
  
  const catFormatada = decodeURIComponent(categoria).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const localFormatado = decodeURIComponent(localizacao).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  const isEn = lang === 'en';

  const todosOsCampos = await getCamposCacheados();
  const camposFiltrados = todosOsCampos.filter(c => {
    const matchCat = (c.categoria || '').toLowerCase().includes(catFormatada.toLowerCase()) || (c.categoria_en || '').toLowerCase().includes(catFormatada.toLowerCase());
    const matchLoc = (c.Distrito || c.local || c.pais || c.pais_en || '').toLowerCase().includes(localFormatado.toLowerCase());
    return matchCat && matchLoc;
  });

  const count = camposFiltrados.length;
  
  const metaTitle = isEn 
    ? `Best ${catFormatada} Camps in ${localFormatado} | HelloCamp` 
    : `Campos de Férias de ${catFormatada} em ${localFormatado} | HelloCamp`;
    
  const metaDescription = count > 0
    ? (isEn 
        ? `Compare the top ${count} ${catFormatada} camps in ${localFormatado}. View dates, prices, and reviews. Book safely with no commission on HelloCamp.`
        : `Compare os ${count} melhores campos de férias de ${catFormatada} em ${localFormatado}. Veja preços, fotos e datas. Reserve sem comissões na HelloCamp.`)
    : (isEn
        ? `Discover the best ${catFormatada} camps in ${localFormatado}. Find dates and prices for international summer experiences on HelloCamp.`
        : `Descubra os melhores campos de férias de ${catFormatada} em ${localFormatado}. Compare preços e reserve experiências de verão na HelloCamp.`);

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: `https://www.hellocamp.pt/${lang}/${categoria}/${localizacao}`
    }
  };
}

export default async function CategoriaLocalizacaoPage({ params }: { params: Promise<{ lang: string, categoria: string, localizacao: string }> }) {
  const { lang, categoria, localizacao } = await params;
  const isEn = lang === 'en';

  const catFormatada = decodeURIComponent(categoria).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const localFormatado = decodeURIComponent(localizacao).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const todosOsCampos = await getCamposCacheados();
  
  const resultados = todosOsCampos.filter(c => {
    const matchCat = (c.categoria || '').toLowerCase().includes(catFormatada.toLowerCase()) || (c.categoria_en || '').toLowerCase().includes(catFormatada.toLowerCase());
    const matchLoc = (c.Distrito || c.local || c.pais || c.pais_en || c.local_en || '').toLowerCase().includes(localFormatado.toLowerCase());
    return matchCat && matchLoc;
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      
      <section className="bg-white border-b border-slate-200 pt-8 pb-10 px-4 md:px-6 shadow-sm">
        <div className="max-w-[1100px] mx-auto">
          <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-6 tracking-widest uppercase">
            <Link href={`/${lang}`} className="hover:text-[#0E3A68] transition-colors">{isEn ? 'Home' : 'Início'}</Link>
            <span>/</span>
            <Link href={`/${lang}/pesquisa`} className="hover:text-[#0E3A68] transition-colors">{isEn ? 'Search' : 'Pesquisa'}</Link>
            <span>/</span>
            <span className="text-slate-900">{catFormatada}</span>
            <span>/</span>
            <span className="text-slate-900">{localFormatado}</span>
          </nav>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {isEn ? `${catFormatada} Camps in ${localFormatado}` : `Campos de Férias de ${catFormatada} em ${localFormatado}`}
          </h1>
          <p className="mt-3 text-slate-500 font-medium">
            {resultados.length > 0 
              ? (isEn ? `Showing ${resultados.length} available programs.` : `A mostrar ${resultados.length} programas disponíveis.`)
              : (isEn ? `No specific programs found at the moment.` : `Sem programas abertos no momento.`)}
          </p>
        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-4 py-12 md:py-16">
        {resultados.length === 0 ? (
          <div className="flex flex-col gap-16">
            <div className="text-center p-12 bg-white rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center gap-4 max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-4xl border border-amber-100 mb-2">
                🗺️
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {isEn ? `No exact matches for ${catFormatada} in ${localFormatado}` : `Ainda não temos campos exatos de ${catFormatada} em ${localFormatado}`}
              </h3>
              <p className="text-base text-slate-500 font-medium">
                {isEn 
                  ? 'We are constantly adding new partners. Meanwhile, check out these amazing alternatives that other families are booking right now.' 
                  : 'Estamos a adicionar parceiros todos os dias. Entretanto, veja estas alternativas incríveis que outras famílias estão a reservar.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full sm:w-auto">
                <Link href={`/${lang}/pesquisa?categoria=${encodeURIComponent(catFormatada)}`} className="bg-[#e2a41d] text-white font-black px-8 py-4 rounded-xl hover:bg-[#d4991b] transition-all shadow-lg uppercase tracking-widest text-xs flex-1 text-center">
                  {isEn ? `Search Anywhere` : `Procurar Noutros Locais`}
                </Link>
                <Link href={`/${lang}/pesquisa`} className="bg-[#0E3A68] text-white font-black px-8 py-4 rounded-xl hover:bg-[#0b2b4d] transition-all shadow-lg uppercase tracking-widest text-xs flex-1 text-center border border-[#0E3A68]">
                  {isEn ? 'View All Camps' : 'Ver Todos os Campos'}
                </Link>
              </div>
            </div>

            {/* Alternativas Recomendadas */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                  {isEn ? 'Recommended Alternatives' : 'Alternativas Recomendadas'}
                </h4>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {todosOsCampos.slice(0, 3).map((campo) => {
                  const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
                  const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
                  const localC = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
                  let precoVisivel = campo.preco || 0;
                  if (!precoVisivel && campo.pacotes?.length > 0) {
                    const todosPrecos = campo.pacotes.flatMap((p: any) => p.variantes?.map((v: any) => v.preco) || []);
                    if (todosPrecos.length > 0) precoVisivel = Math.min(...todosPrecos);
                  }

                  const imgUrl = campo.imagem?.startsWith('http') ? campo.imagem : '/og-image.jpg';

                  return (
                    <div key={campo.id} className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-slate-200 relative shadow-sm hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
                      <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">Explorar {nomeCampo}</span></Link>
                      <div className="absolute top-4 right-4 z-20"><BotaoFavorito campoId={campo.id} /></div>
                      <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                        <div 
                          className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                          style={{ backgroundImage: `url('${imgUrl}')` }}
                        />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#0E3A68] rounded-lg z-0">{catCampo}</div>
                      </div>
                      <div className="flex flex-col p-6 flex-1 pointer-events-none">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                          <svg className="w-3 h-3 text-[#e2a41d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          {localC}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 line-clamp-2">{nomeCampo}</h3>
                        <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{isEn ? 'From' : 'Desde'}</p>
                            <p className="text-2xl font-black text-[#0E3A68] m-0">{precoVisivel > 0 ? `${precoVisivel}€` : '--'}</p>
                          </div>
                          <span className="bg-slate-100 text-slate-900 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors group-hover:bg-[#0E3A68] group-hover:text-white shadow-sm">
                            {isEn ? 'View Dates' : 'Ver Datas'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {resultados.map((campo) => {
              const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
              const localCampo = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
              const idadeCampo = isEn && campo.idade_en ? campo.idade_en : campo.idade;

              let precoVisivel = campo.preco || 0;
              if (!precoVisivel && campo.pacotes?.length > 0) {
                const todosPrecos = campo.pacotes.flatMap((p: any) => p.variantes?.map((v: any) => v.preco) || []);
                if (todosPrecos.length > 0) precoVisivel = Math.min(...todosPrecos);
              }

              const imgUrl = campo.imagem?.startsWith('http') ? campo.imagem : '/og-image.jpg';

              return (
                <div key={campo.id} className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-slate-200 relative shadow-sm hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
                  <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">Explorar {nomeCampo}</span></Link>
                  <div className="absolute top-4 right-4 z-20"><BotaoFavorito campoId={campo.id} /></div>
                  
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
                      <svg className="w-3 h-3 text-[#e2a41d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      {localCampo}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 line-clamp-2">{nomeCampo}</h3>
                    <p className="text-sm text-slate-500 font-medium mb-6">{isEn ? 'Ages:' : 'Idades:'} <span className="text-slate-900 font-bold">{idadeCampo}</span></p>
                    
                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{isEn ? 'From' : 'Desde'}</p>
                        <p className="text-2xl font-black text-[#0E3A68] m-0">{precoVisivel > 0 ? `${precoVisivel}€` : '--'}</p>
                      </div>
                      <span className="bg-slate-100 text-slate-900 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors group-hover:bg-[#0E3A68] group-hover:text-white shadow-sm">
                        {isEn ? 'View Dates' : 'Ver Datas'}
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
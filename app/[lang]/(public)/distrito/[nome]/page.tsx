import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../../components/BotaoFavorito";
import Image from "next/image";
import { unstable_cache } from "next/cache";

export const dynamic = 'force-dynamic';

const escapeOr = (str: string) => str.replace(/[,()]/g, ' ').trim();

// ARRAY DE IMAGENS DE FALLBACK
const IMAGENS_DISTRITOS: Record<string, string> = {
  "Lisboa": "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&q=80&w=1200",
  "Porto": "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=1200",
  "Faro": "https://images.unsplash.com/photo-1533556019545-21d7b322a46c?auto=format&fit=crop&q=80&w=1200",
  "Braga": "https://images.unsplash.com/photo-1563806229-37330eb02d33?auto=format&fit=crop&q=80&w=1200",
  "Setúbal": "https://images.unsplash.com/photo-1590500139707-1b0dff17be6c?auto=format&fit=crop&q=80&w=1200",
  "Aveiro": "https://images.unsplash.com/photo-1627392683050-8b63e9f4eb8d?auto=format&fit=crop&q=80&w=1200",
  "Coimbra": "https://images.unsplash.com/photo-1562947230-0eb5343d9229?auto=format&fit=crop&q=80&w=1200",
  "Leiria": "https://images.unsplash.com/photo-1551221156-f56f2f9c572a?auto=format&fit=crop&q=80&w=1200",
};

const IMAGEM_GENERICA = "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=1200";

// ==========================================
// CACHE DE DADOS (24 HORAS) - ZERO EGRESS
// ==========================================
const getDistritoCache = unstable_cache(
  async (nomeLimpo: string) => {
    const { data } = await supabase.from('distritos').select('*').ilike('nome', nomeLimpo).single();
    return data;
  },
  ['cache-distrito-detalhe'],
  { revalidate: 86400 } // 24h
);

const getCamposNoDistritoCache = unstable_cache(
  async (nomeLimpo: string) => {
    const { data } = await supabase
      .from('campos')
      .select('*')
      .not('contrato_parceiro_url', 'is', null)
      .or(`Distrito.ilike.%${nomeLimpo}%,local.ilike.%${nomeLimpo}%`)
      .order('id', { ascending: false });
    return data || [];
  },
  ['cache-campos-distrito'],
  { revalidate: 86400 } // 24h
);

// ==========================================
// 1. SEO METADATA
// ==========================================
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ lang: string; nome: string }> 
}): Promise<Metadata> {
  const { lang, nome } = await params;
  const isEn = lang === 'en';
  const nomeLimpo = decodeURIComponent(nome).replace(/[%_]/g, '');

  const distrito = await getDistritoCache(nomeLimpo);

  if (!distrito) {
    return { title: isEn ? 'District Not Found | HelloCamp' : 'Distrito Não Encontrado | HelloCamp' };
  }

  const title = isEn 
    ? (distrito.seo_titulo_en || `Summer Camps in ${distrito.nome_en || distrito.nome} | HelloCamp`) 
    : (distrito.seo_titulo || `Campos de Férias em ${distrito.nome} | HelloCamp`);
    
  const description = isEn ? distrito.seo_descricao_en : distrito.seo_descricao;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description || '',
      images: [
        {
          url: distrito.imagem_capa || IMAGENS_DISTRITOS[distrito.nome] || IMAGEM_GENERICA,
          width: 1200,
          height: 630,
        }
      ]
    }
  };
}

// ==========================================
// 2. COMPONENTE PRINCIPAL
// ==========================================
export default async function PaginaDoDistrito({ 
  params 
}: { 
  params: Promise<{ lang: string; nome: string }> 
}) {
  const { lang, nome } = await params;
  const isEn = lang === 'en';
  
  const nomeLimpo = decodeURIComponent(nome).replace(/[%_]/g, '');
  
  // Buscar DADOS EM CACHE (24h)
  const distrito = await getDistritoCache(nomeLimpo);
  const camposNoDistrito = await getCamposNoDistritoCache(nomeLimpo);

  if (!distrito) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center font-sans px-4">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm border border-slate-200 mb-6">🕵️‍♂️</div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {isEn ? 'District not found' : 'Não foi possível encontrar este distrito'}
        </h1>
        <Link href={`/${lang}`} className="mt-6 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-md">
          &larr; {isEn ? 'Back to home' : 'Voltar à página inicial'}
        </Link>
      </div>
    );
  }

  const nomeDistrito = isEn && distrito.nome_en ? distrito.nome_en : distrito.nome;
  
  const descDistritoLonga = isEn 
    ? (distrito.seo_descricao_en || distrito.descricao_curta_en || `Explore the best summer camps and holiday programs in ${nomeDistrito}.`) 
    : (distrito.seo_descricao || distrito.descricao_curta || `Explore os melhores campos de férias e programas extracurriculares em ${nomeDistrito}.`);

  const imagemCapaFinal = distrito.imagem_capa && distrito.imagem_capa.trim() !== "" 
    ? distrito.imagem_capa 
    : (IMAGENS_DISTRITOS[distrito.nome] || IMAGEM_GENERICA);

  // SCHEMA MARKUP PARA BREADCRUMBS
  const baseUrl = "https://www.hellocamp.pt";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isEn ? "Home" : "Início", "item": `${baseUrl}/${lang}` },
      { "@type": "ListItem", "position": 2, "name": "Portugal", "item": `${baseUrl}/${lang}/pesquisa/pais/Portugal` },
      { "@type": "ListItem", "position": 3, "name": nomeDistrito, "item": `${baseUrl}/${lang}/distrito/${encodeURIComponent(nomeLimpo)}` }
    ]
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      
      {/* SCRIPT SEO INVISÍVEL */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* 2. HEADER HERO DO DISTRITO */}
      <section className="bg-white border-b border-slate-200 pt-10 pb-12 px-4 md:px-6 shadow-sm relative z-20">
        <div className="max-w-[1100px] mx-auto">
          
          {/* BREADCRUMBS VISUAIS */}
          <nav className="flex items-center gap-2 text-xs font-black text-slate-400 mb-6 tracking-widest uppercase">
            <Link href={`/${lang}`} className="hover:text-slate-900 transition-colors">{isEn ? 'Home' : 'Início'}</Link>
            <span>/</span>
            <Link href={`/${lang}/pesquisa/pais/Portugal`} className="hover:text-slate-900 transition-colors">Portugal</Link>
            <span>/</span>
            <span className="text-slate-900">{nomeDistrito}</span>
          </nav>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="max-w-2xl">
              <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 bg-slate-100 w-max px-3 py-1.5 rounded-lg border border-slate-200">
                {isEn ? 'Destination Guide' : 'Guia de Destino'}
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight capitalize">
                {isEn ? `Camps in ${nomeDistrito}` : `Campos em ${nomeDistrito}`}
              </h1>
              <p className="text-base md:text-lg text-slate-500 leading-relaxed font-medium">
                {descDistritoLonga}
              </p>
            </div>
            
            <div className="w-full md:w-72 h-48 md:h-72 rounded-[2rem] overflow-hidden flex-shrink-0 shadow-lg relative hidden sm:block">
              <Image 
                src={imagemCapaFinal} 
                alt={nomeDistrito} 
                fill
                priority
                className="object-cover" 
                sizes="(max-width: 768px) 100vw, 300px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. LISTAGEM DE CAMPOS NO DISTRITO */}
      <section className="max-w-[1100px] mx-auto px-4 py-12 md:py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {isEn ? 'Available Programs' : 'Programas Disponíveis'}
            </h2>
            <p className="mt-2 text-slate-500 text-sm md:text-base font-medium">
              {isEn ? 'Explore the options we selected for' : 'Explore as opções que selecionámos para'}
              <span className="capitalize font-bold text-slate-700"> {nomeDistrito}</span>.
            </p>
          </div>
          <span className="hidden sm:inline-block text-sm font-bold text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            {camposNoDistrito.length} {isEn ? 'found' : 'encontrados'}
          </span>
        </div>
        
        {!camposNoDistrito || camposNoDistrito.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-[2rem] border border-slate-200 shadow-sm max-w-2xl mx-auto flex flex-col items-center gap-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl border border-slate-100 mb-2">🏕️</div>
            <p className="text-lg text-slate-500 font-bold">
              {isEn ? 'There are no camps available for this district yet.' : 'Ainda não existem campos disponíveis para este distrito.'}
            </p>
            <Link href={`/${lang}/pesquisa`} className="mt-4 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg">
              {isEn ? 'Search all regions' : 'Ver todas as regiões'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {camposNoDistrito.map((campo: any, index: number) => {
              const campoId = campo.id !== undefined && campo.id !== null ? campo.id : (index + 1);
              const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
              const localCampo = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
              
              let precoVisivel = campo.preco || 0;
              if (!precoVisivel && campo.pacotes && campo.pacotes.length > 0) {
                const todosPrecos = campo.pacotes.flatMap((p: any) =>
                  p.variantes ? p.variantes.map((v: any) => v.preco) : []
                );
                if (todosPrecos.length > 0) precoVisivel = Math.min(...todosPrecos);
              }

              return (
                <div key={campoId} className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-slate-200 relative shadow-sm hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
                  
                  <Link href={`/${lang}/campo/${campoId}`} className="absolute inset-0 z-10">
                    <span className="sr-only">Explorar {nomeCampo}</span>
                  </Link>

                  <div className="absolute top-4 right-4 z-20">
                    <BotaoFavorito campoId={campoId} />
                  </div>

                  {/* NEXT/IMAGE LAZY LOADING */}
                  <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                    <Image 
                      src={campo.imagem || '/og-image.jpg'} 
                      alt={nomeCampo} 
                      fill
                      loading="lazy"
                      className="object-cover transition-transform duration-700 group-hover:scale-105" 
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-900 rounded-lg z-0 shadow-sm">
                      {catCampo}
                    </div>
                  </div>
                  
                  <div className="flex flex-col p-6 flex-1 pointer-events-none">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      {localCampo}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 line-clamp-2">{nomeCampo}</h3>
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
        )}
      </section>

      {/* 4. CROSS-LINKING SEO */}
      <section className="bg-white border-t border-slate-200 py-20 px-4 md:px-6">
         <div className="max-w-[1100px] mx-auto text-center md:text-left">
            <h3 className="text-2xl font-black text-slate-900 mb-8 capitalize">
              {isEn ? `Explore more in ${nomeDistrito}` : `Explore mais em ${nomeDistrito}`}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href={`/${lang}/pesquisa?distrito=${encodeURIComponent(distrito.nome)}&categoria=Desporto`} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-900 transition-colors text-base font-black text-slate-800 no-underline flex items-center justify-between group shadow-sm hover:shadow-lg">
                <span className="flex items-center gap-3">⚽ {isEn ? `Sports Camps` : `Campos de Desporto`}</span>
                <span className="text-slate-400 group-hover:text-slate-900 transition-colors">&rarr;</span>
              </Link>
              <Link href={`/${lang}/pesquisa?distrito=${encodeURIComponent(distrito.nome)}&categoria=Línguas`} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-900 transition-colors text-base font-black text-slate-800 no-underline flex items-center justify-between group shadow-sm hover:shadow-lg">
                <span className="flex items-center gap-3">🗣️ {isEn ? `Language Camps` : `Campos de Línguas`}</span>
                <span className="text-slate-400 group-hover:text-slate-900 transition-colors">&rarr;</span>
              </Link>
              <Link href={`/${lang}/pesquisa?distrito=${encodeURIComponent(distrito.nome)}&categoria=Aventura & Natureza`} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-900 transition-colors text-base font-black text-slate-800 no-underline flex items-center justify-between group shadow-sm hover:shadow-lg">
                <span className="flex items-center gap-3">🏕️ {isEn ? `Adventure Camps` : `Campos de Aventura`}</span>
                <span className="text-slate-400 group-hover:text-slate-900 transition-colors">&rarr;</span>
              </Link>
            </div>
         </div>
      </section>

    </main>
  );
}
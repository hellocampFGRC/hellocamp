import Link from "next/link";
import React from "react";
import { supabase } from "@/lib/supabase";

// ==========================================
// ÍCONES SVG INLINE
// ==========================================
const IconBook = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IconArrowRight = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconTent = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20h18L14 4l-3 6-2-2-6 12z" />
    <line x1="7" y1="14" x2="17" y2="14" />
  </svg>
);

const FALLBACK_BLOG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Crect fill='%23e2e8f0' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='40' font-weight='bold' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3EHelloCamp%3C/text%3E%3C/svg%3E";

export default async function GuiaPaisPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const isEn = lang === 'en';

  // Buscar 7 artigos (1 destaque + 6 na grelha)
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, titulo, titulo_en, resumo, resumo_en, imagem_url, categoria, categoria_en, slug, created_at')
    .in('destinatario', ['pais', 'ambos'])
    .eq('publicado', true)
    .order('created_at', { ascending: false })
    .limit(7);

  const formatarData = (dStr: string) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const featuredPost = posts && posts.length > 0 ? posts[0] : null;
  const regularPosts = posts && posts.length > 1 ? posts.slice(1) : [];

  return (
    <main className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-20">

      {/* HERO */}
      <section className="bg-emerald-900 text-white py-20 md:py-28 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="text-xs font-black text-emerald-100 uppercase tracking-widest bg-emerald-800/50 px-4 py-2 rounded-full border border-emerald-700/50 shadow-sm inline-flex items-center gap-2">
            <IconBook className="w-4 h-4" />
            {isEn ? 'Official Parent Resources' : 'Recursos para Encarregados de Educação'}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-8 mb-6 leading-tight">
            {isEn ? 'Empowering families for unforgettable summers' : 'Informação e planeamento para férias inesquecíveis'}
          </h1>
          <p className="text-lg text-emerald-100/90 font-medium max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? 'Expert articles, guides, and tips on psychology, safety, and camp logistics to help you make the best decisions for your children.'
              : 'Artigos, guias e conselhos de especialistas em psicologia, segurança e logística para o ajudar a tomar as melhores decisões para o desenvolvimento dos seus filhos.'}
          </p>
        </div>
      </section>

      {/* BLOG */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 relative z-20 -mt-12">

        {/* ARTIGO EM DESTAQUE */}
        {featuredPost && (
          <div className="mb-16">
            <Link
              href={`/${lang}/blog/${featuredPost.slug}`}
              className="group block bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden transition-transform duration-500 hover:-translate-y-2 no-underline"
            >
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-3/5 h-72 md:h-auto relative overflow-hidden bg-slate-100">
                  <img
                    src={featuredPost.imagem_url || FALLBACK_BLOG}
                    onError={(e) => { e.currentTarget.src = FALLBACK_BLOG; }}
                    alt={isEn && featuredPost.titulo_en ? featuredPost.titulo_en : featuredPost.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {(isEn && featuredPost.categoria_en ? featuredPost.categoria_en : featuredPost.categoria) && (
                    <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-emerald-700 shadow-lg">
                      {isEn && featuredPost.categoria_en ? featuredPost.categoria_en : featuredPost.categoria}
                    </div>
                  )}
                </div>
                <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                    {formatarData(featuredPost.created_at)}
                  </p>
                  <h2 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight mb-6 group-hover:text-emerald-600 transition-colors">
                    {isEn && featuredPost.titulo_en ? featuredPost.titulo_en : featuredPost.titulo}
                  </h2>
                  <p className="text-slate-500 text-base leading-relaxed mb-8 line-clamp-4">
                    {isEn && featuredPost.resumo_en ? featuredPost.resumo_en : featuredPost.resumo}
                  </p>
                  <div className="mt-auto flex items-center gap-3 text-emerald-600 font-black text-sm uppercase tracking-widest">
                    <span>{isEn ? 'Read Featured Article' : 'Ler Artigo de Destaque'}</span>
                    <span className="group-hover:translate-x-2 transition-transform"><IconArrowRight /></span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* GRELHA DE ARTIGOS */}
        {regularPosts.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {isEn ? 'More Parent Guides' : 'Mais Guias e Artigos'}
              </h3>
              <Link href={`/${lang}/blog`} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1">
                {isEn ? 'View all' : 'Ver todos'} <IconArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post) => {
                const titulo = isEn && post.titulo_en ? post.titulo_en : post.titulo;
                const resumo = isEn && post.resumo_en ? post.resumo_en : post.resumo;
                const categoria = isEn && post.categoria_en ? post.categoria_en : post.categoria;

                return (
                  <Link
                    key={post.id}
                    href={`/${lang}/blog/${post.slug}`}
                    className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 overflow-hidden flex flex-col no-underline hover:-translate-y-1"
                  >
                    <div className="relative w-full h-56 bg-slate-100 overflow-hidden">
                      <img
                        src={post.imagem_url || FALLBACK_BLOG}
                        onError={(e) => { e.currentTarget.src = FALLBACK_BLOG; }}
                        alt={titulo}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {categoria && (
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-800 shadow-sm">
                          {categoria}
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        {formatarData(post.created_at)}
                      </p>
                      <h4 className="text-xl font-black text-slate-900 leading-tight mb-3 group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {titulo}
                      </h4>
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6 font-medium">
                        {resumo}
                      </p>
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                        <span>{isEn ? 'Read article' : 'Ler artigo'}</span>
                        <span className="group-hover:translate-x-1 transition-transform"><IconArrowRight className="w-3.5 h-3.5" /></span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* CTA FINAL */}
      <section className="bg-slate-900 py-20 text-center text-white mx-4 rounded-[2rem] shadow-2xl relative overflow-hidden mt-10">
        <div className="absolute inset-0 bg-emerald-900/20 bg-cover bg-center pointer-events-none"></div>
        <div className="max-w-2xl mx-auto px-4 relative z-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <IconTent />
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
            {isEn ? 'Inspired for their next adventure?' : 'Inspirado para a próxima aventura?'}
          </h2>
          <p className="text-slate-300 text-base mb-10 font-medium leading-relaxed">
            {isEn
              ? 'Now that you have all the information, explore our directory of verified and secure camps across the country.'
              : 'Agora que já tem todas as informações e conselhos de especialistas, explore o nosso diretório de campos de férias verificados e seguros de norte a sul do país.'}
          </p>
          <Link
            href={`/${lang}/pesquisa`}
            className="inline-block bg-white text-slate-900 font-black px-10 py-4 rounded-xl no-underline hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-lg text-lg"
          >
            {isEn ? 'Explore Verified Camps' : 'Explorar Campos Verificados'}
          </Link>
        </div>
      </section>

    </main>
  );
}
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const IconNews = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" />
    <path d="M15 18h-5" />
    <path d="M10 6h8v4h-8V6Z" />
  </svg>
);

const IconArrowRight = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const FALLBACK_BLOG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Crect fill='%23e2e8f0' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='40' font-weight='bold' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3EHelloCamp%3C/text%3E%3C/svg%3E";

export default function BlogHubPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [audiencia, setAudiencia] = useState<'pais' | 'parceiros'>('pais');
  const [todosPosts, setTodosPosts] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Tudo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, titulo, titulo_en, resumo, resumo_en, imagem_url, categoria, categoria_en, slug, destinatario, created_at')
        .eq('publicado', true)
        .order('created_at', { ascending: false });

      if (data) setTodosPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    const postsDestaAudiencia = todosPosts.filter(p => p.destinatario === audiencia || p.destinatario === 'ambos');

    const cats = new Set<string>();
    postsDestaAudiencia.forEach(p => {
      const cat = isEn && p.categoria_en ? p.categoria_en : p.categoria;
      if (cat) cats.add(cat);
    });
    setCategorias(['Tudo', ...Array.from(cats)]);
    setCategoriaAtiva('Tudo');
  }, [audiencia, todosPosts, isEn]);

  const formatarData = (dStr: string) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const postsFiltrados = todosPosts.filter(p => {
    if (p.destinatario !== audiencia && p.destinatario !== 'ambos') return false;
    if (categoriaAtiva !== 'Tudo') {
      const cat = isEn && p.categoria_en ? p.categoria_en : p.categoria;
      if (cat !== categoriaAtiva) return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-20">

      {/* HEADER */}
      <section className="bg-emerald-900 text-white py-16 md:py-24 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            {isEn ? 'HelloCamp Resource Hub' : 'Centro de Recursos HelloCamp'}
          </h1>
          <p className="text-emerald-100/90 text-lg font-medium">
            {isEn ? 'Articles, tips, and guides for families, partners, and monitors.' : 'Artigos, dicas e guias para famílias, parceiros e monitores.'}
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-8 py-10 -mt-8 relative z-20">

        {/* TOGGLE AUDIÊNCIA */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white p-1.5 rounded-2xl shadow-md border border-slate-200">
            <button
              type="button"
              onClick={() => setAudiencia('pais')}
              className={`px-8 py-3 rounded-xl text-xs sm:text-sm font-black tracking-widest uppercase transition-all cursor-pointer ${audiencia === 'pais' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {isEn ? 'For Families' : 'Para Famílias'}
            </button>
            <button
              type="button"
              onClick={() => setAudiencia('parceiros')}
              className={`px-8 py-3 rounded-xl text-xs sm:text-sm font-black tracking-widest uppercase transition-all cursor-pointer ${audiencia === 'parceiros' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {isEn ? 'For Partners & Staff' : 'Para Parceiros e Monitores'}
            </button>
          </div>
        </div>

        {/* CATEGORIAS */}
        {!loading && categorias.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto justify-center">
            {categorias.map(cat => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  categoriaAtiva === cat
                    ? (audiencia === 'pais' ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'bg-slate-100 border-slate-900 text-slate-900')
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {cat === 'Tudo' ? (isEn ? 'All Articles' : 'Todos os Artigos') : cat}
              </button>
            ))}
          </div>
        )}

        {/* GRELHA */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-56 bg-slate-200" />
                <div className="p-8 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : postsFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <IconNews className="w-8 h-8" />
            </div>
            <p className="text-slate-500 font-bold">
              {isEn ? 'No articles found in this section.' : 'Nenhum artigo encontrado nesta secção.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {postsFiltrados.map((post) => {
              const titulo = isEn && post.titulo_en ? post.titulo_en : post.titulo;
              const resumo = isEn && post.resumo_en ? post.resumo_en : post.resumo;
              const categoria = isEn && post.categoria_en ? post.categoria_en : post.categoria;
              const isPartner = audiencia === 'parceiros';

              return (
                <Link
                  key={post.id}
                  href={`/${lang}/blog/${post.slug}`}
                  className="group bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col no-underline hover:-translate-y-2"
                >
                  <div className="relative w-full h-56 bg-slate-100 overflow-hidden">
                    <img
                      src={post.imagem_url || FALLBACK_BLOG}
                      onError={(e) => { e.currentTarget.src = FALLBACK_BLOG; }}
                      alt={titulo}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    {categoria && (
                      <div className={`absolute top-4 left-4 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${isPartner ? 'bg-slate-900/90 text-white' : 'bg-white/95 text-slate-800'}`}>
                        {categoria}
                      </div>
                    )}
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      {formatarData(post.created_at)}
                    </p>
                    <h3 className={`text-xl font-black text-slate-900 leading-tight mb-3 transition-colors line-clamp-3 ${isPartner ? 'group-hover:text-blue-600' : 'group-hover:text-emerald-600'}`}>
                      {titulo}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-3 mb-6">
                      {resumo}
                    </p>
                    <div className={`mt-auto pt-4 border-t border-slate-100 flex items-center gap-2 font-black text-xs uppercase tracking-widest ${isPartner ? 'text-slate-900' : 'text-emerald-600'}`}>
                      <span>{isEn ? 'Read article' : 'Ler artigo completo'}</span>
                      <span className="group-hover:translate-x-2 transition-transform"><IconArrowRight /></span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
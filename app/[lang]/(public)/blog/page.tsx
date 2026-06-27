"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BlogPaisPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [posts, setPosts] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Tudo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, titulo, titulo_en, resumo, resumo_en, imagem_url, categoria, categoria_en, slug, created_at')
        .in('destinatario', ['pais', 'ambos'])
        .eq('publicado', true)
        .order('created_at', { ascending: false });

      if (data) {
        setPosts(data);
        
        // Extrair categorias únicas para os filtros
        const cats = new Set<string>();
        data.forEach(p => {
          const cat = isEn && p.categoria_en ? p.categoria_en : p.categoria;
          if (cat) cats.add(cat);
        });
        setCategorias(['Tudo', ...Array.from(cats)]);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [isEn]);

  const formatarData = (dStr: string) => {
    return new Date(dStr).toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Filtrar posts com base na categoria clicada
  const postsFiltrados = categoriaAtiva === 'Tudo' 
    ? posts 
    : posts.filter(p => {
        const cat = isEn && p.categoria_en ? p.categoria_en : p.categoria;
        return cat === categoriaAtiva;
      });

  return (
    <main className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-20">
      
      {/* HEADER */}
      <section className="bg-emerald-900 text-white py-16 md:py-24 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            {isEn ? 'Parent Resource Hub' : 'Blog e Recursos para Pais'}
          </h1>
          <p className="text-emerald-100/90 text-lg font-medium">
            {isEn ? 'Articles, tips, and guides to make the most of camp seasons.' : 'Artigos, dicas e guias para aproveitar ao máximo a época de férias dos mais novos.'}
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-8 py-10 -mt-8 relative z-20">
        
        {/* FILTROS DE CATEGORIA */}
        {!loading && categorias.length > 1 && (
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-2 mb-10 overflow-x-auto justify-center">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                  categoriaAtiva === cat 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'bg-transparent text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat === 'Tudo' ? (isEn ? 'All Articles' : 'Todos os Artigos') : cat}
              </button>
            ))}
          </div>
        )}

        {/* GRELHA DE POSTS */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold">A carregar artigos...</div>
        ) : postsFiltrados.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-bold">Nenhum artigo encontrado nesta categoria.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {postsFiltrados.map((post) => {
              const titulo = isEn && post.titulo_en ? post.titulo_en : post.titulo;
              const resumo = isEn && post.resumo_en ? post.resumo_en : post.resumo;
              const categoria = isEn && post.categoria_en ? post.categoria_en : post.categoria;

              return (
                <Link key={post.id} href={`/${lang}/blog/${post.slug}`} className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col no-underline hover:-translate-y-1">
                  <div className="relative w-full h-56 bg-slate-100 overflow-hidden">
                    {post.imagem_url ? (
                      <img src={post.imagem_url} alt={titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl opacity-50">📝</div>
                    )}
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
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-3 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {titulo}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6">
                      {resumo}
                    </p>
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-2 text-emerald-600 font-bold text-sm">
                      <span>{isEn ? 'Read article' : 'Ler artigo completo'}</span>
                      <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
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
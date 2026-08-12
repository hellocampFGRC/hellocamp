"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BlogHubPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  // Toggle Principal de Audiência: Famílias vs Parceiros
  const [audiencia, setAudiencia] = useState<'pais' | 'parceiros'>('pais');
  
  const [todosPosts, setTodosPosts] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Tudo');
  const [loading, setLoading] = useState(true);

  // Vai buscar TODOS os posts ativos de uma só vez
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, titulo, titulo_en, resumo, resumo_en, imagem_url, categoria, categoria_en, slug, destinatario, created_at')
        .eq('publicado', true)
        .order('created_at', { ascending: false });

      if (data) {
        setTodosPosts(data);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  // Sempre que a "audiência" muda, recalcula as categorias disponíveis para essa aba
  useEffect(() => {
    const postsDestaAudiencia = todosPosts.filter(p => p.destinatario === audiencia || p.destinatario === 'ambos');
    
    const cats = new Set<string>();
    postsDestaAudiencia.forEach(p => {
      const cat = isEn && p.categoria_en ? p.categoria_en : p.categoria;
      if (cat) cats.add(cat);
    });
    setCategorias(['Tudo', ...Array.from(cats)]);
    setCategoriaAtiva('Tudo'); // Reset da categoria ao mudar de aba
  }, [audiencia, todosPosts, isEn]);

  const formatarData = (dStr: string) => {
    return new Date(dStr).toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Filtragem final para o que é apresentado na grelha
  const postsFiltrados = todosPosts.filter(p => {
    // 1. Filtrar pela audiência selecionada
    if (p.destinatario !== audiencia && p.destinatario !== 'ambos') return false;
    
    // 2. Filtrar pela categoria ativa
    if (categoriaAtiva !== 'Tudo') {
       const cat = isEn && p.categoria_en ? p.categoria_en : p.categoria;
       if (cat !== categoriaAtiva) return false;
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-20">
      
      {/* HEADER DO BLOG */}
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
        
        {/* 1. TOGGLE DE AUDIÊNCIA (O Segredo para juntar tudo) */}
        <div className="flex justify-center mb-8">
           <div className="flex bg-white p-1.5 rounded-2xl shadow-md border border-slate-200">
             <button 
               onClick={() => setAudiencia('pais')} 
               className={`px-8 py-3 rounded-xl text-xs sm:text-sm font-black tracking-widest uppercase transition-all ${audiencia === 'pais' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
             >
               {isEn ? 'For Families' : 'Para Famílias'}
             </button>
             <button 
               onClick={() => setAudiencia('parceiros')} 
               className={`px-8 py-3 rounded-xl text-xs sm:text-sm font-black tracking-widest uppercase transition-all ${audiencia === 'parceiros' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
             >
               {isEn ? 'For Partners & Staff' : 'Para Parceiros e Monitores'}
             </button>
           </div>
        </div>

        {/* 2. FILTROS DE CATEGORIA DINÂMICOS */}
        {!loading && categorias.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto justify-center">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
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

        {/* 3. GRELHA DE POSTS */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold animate-pulse">A carregar artigos...</div>
        ) : postsFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-4xl block mb-4">📰</span>
            <p className="text-slate-500 font-bold">{isEn ? 'No articles found in this section.' : 'Nenhum artigo encontrado nesta secção.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {postsFiltrados.map((post) => {
              const titulo = isEn && post.titulo_en ? post.titulo_en : post.titulo;
              const resumo = isEn && post.resumo_en ? post.resumo_en : post.resumo;
              const categoria = isEn && post.categoria_en ? post.categoria_en : post.categoria;
              const isPartner = audiencia === 'parceiros';

              return (
                <Link key={post.id} href={`/${lang}/blog/${post.slug}`} className="group bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col no-underline hover:-translate-y-2">
                  <div className="relative w-full h-56 bg-slate-100 overflow-hidden">
                    {post.imagem_url ? (
                      <img src={post.imagem_url} alt={titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">📝</div>
                    )}
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
                      <span className="group-hover:translate-x-2 transition-transform">&rarr;</span>
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
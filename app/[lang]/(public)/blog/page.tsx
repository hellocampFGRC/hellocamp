"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Ícone limpo para "Vazio"
const IconNews = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <path d="M18 14h-8" />
    <path d="M15 18h-5" />
    <path d="M10 6h8v4h-8V6Z" />
  </svg>
);

const IconArrowRight = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// Fallback substituído por uma imagem de alta qualidade de crianças felizes na natureza
const FALLBACK_BLOG = "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200";

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
    return new Date(dStr).toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
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
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">

      {/* ═══════════════════════════════════════════ */}
      {/* HEADER EDITORIAL                            */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-slate-900 text-white pt-24 pb-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="inline-block text-[10px] font-black tracking-widest text-[#e2a41d] bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full uppercase mb-6">
            {isEn ? 'Editorial & Guides' : 'Editorial & Guias'}
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            {isEn ? 'HelloCamp ' : 'Recursos '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              {isEn ? 'Journal' : 'HelloCamp'}
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            {isEn ? 'Expert articles, tips, and guides to help you plan the perfect summer experience.' : 'Artigos, dicas de especialistas e guias para o ajudar a planear a experiência de verão perfeita.'}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* NAVEGAÇÃO E FILTROS                         */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-10 -mt-16 relative z-20">

        {/* TOGGLE AUDIÊNCIA */}
        <div className="flex justify-center mb-10">
          <div className="flex bg-white p-1.5 rounded-2xl shadow-xl shadow-black/5 border border-slate-200">
            <button
              type="button"
              onClick={() => setAudiencia('pais')}
              className={`px-8 py-3.5 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all ${audiencia === 'pais' ? 'bg-[#0E3A68] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              {isEn ? 'For Families' : 'Para Famílias'}
            </button>
            <button
              type="button"
              onClick={() => setAudiencia('parceiros')}
              className={`px-8 py-3.5 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all ${audiencia === 'parceiros' ? 'bg-[#167524] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              {isEn ? 'For Organizers' : 'Para Organizadores'}
            </button>
          </div>
        </div>

        {/* CATEGORIAS */}
        {!loading && categorias.length > 1 && (
          <div className="flex flex-wrap gap-3 mb-12 justify-center">
            {categorias.map(cat => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-5 py-2.5 rounded-full text-[11px] font-black tracking-wider uppercase transition-all border shadow-sm ${
                  categoriaAtiva === cat
                    ? (audiencia === 'pais' ? 'bg-[#0E3A68] border-[#0E3A68] text-white' : 'bg-[#167524] border-[#167524] text-white')
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {cat === 'Tudo' ? (isEn ? 'All Articles' : 'Todos os Artigos') : cat}
              </button>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* GRELHA DE ARTIGOS                           */}
        {/* ═══════════════════════════════════════════ */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden animate-pulse">
                <div className="h-60 bg-slate-200" />
                <div className="p-8 space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-8 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : postsFiltrados.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2rem] border border-slate-200 shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
              <IconNews className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              {isEn ? 'No articles yet' : 'Sem artigos publicados'}
            </h3>
            <p className="text-slate-500 font-medium">
              {isEn ? 'We are working on new content for this section.' : 'A nossa equipa editorial está a preparar conteúdo para esta secção.'}
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
                  className="group bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-[0_20px_60px_rgb(0,0,0,0.06)] transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1"
                >
                  <div className="relative w-full h-60 bg-slate-100 overflow-hidden">
                    <img
                      src={post.imagem_url || FALLBACK_BLOG}
                      onError={(e) => { e.currentTarget.src = FALLBACK_BLOG; }}
                      alt={titulo}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {categoria && (
                      <div className={`absolute top-4 left-4 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${isPartner ? 'bg-slate-900/90 text-white' : 'bg-white/95 text-[#0E3A68]'}`}>
                        {categoria}
                      </div>
                    )}
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      {formatarData(post.created_at)}
                    </p>
                    <h3 className={`text-xl font-black text-slate-900 leading-tight mb-3 transition-colors line-clamp-3 ${isPartner ? 'group-hover:text-[#167524]' : 'group-hover:text-[#0E3A68]'}`}>
                      {titulo}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-3 mb-8">
                      {resumo}
                    </p>
                    <div className={`mt-auto pt-5 border-t border-slate-100 flex items-center justify-between font-black text-[10px] uppercase tracking-widest ${isPartner ? 'text-[#167524]' : 'text-[#0E3A68]'}`}>
                      <span>{isEn ? 'Read Full Article' : 'Ler Artigo Completo'}</span>
                      <span className="bg-slate-50 p-2 rounded-full group-hover:bg-slate-100 transition-colors">
                        <IconArrowRight />
                      </span>
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
import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoPartilhaArtigo from "../components/BotaoPartilhaArtigo"; // Ajustar se necessário
import { notFound } from "next/navigation";

// Fallback de alta qualidade
const FALLBACK_COVER = "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  const isEn = lang === 'en';

  const { data: post } = await supabase.from('blog_posts').select('*').eq('slug', slug).single();

  if (!post) return { title: 'Blog | HelloCamp' };

  const title = (isEn && post.titulo_en ? post.titulo_en : post.titulo) + ' | HelloCamp';
  const description = isEn && post.resumo_en ? post.resumo_en : post.resumo;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.created_at,
      images: [{ url: post.imagem_url || FALLBACK_COVER, width: 1200, height: 630 }]
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const isEn = lang === 'en';

  const { data: post } = await supabase.from('blog_posts').select('*').eq('slug', slug).single();

  if (!post) {
    notFound();
  }

  const titulo = isEn && post.titulo_en ? post.titulo_en : post.titulo;
  const conteudo = isEn && post.conteudo_en ? post.conteudo_en : post.conteudo;
  const categoria = isEn && post.categoria_en ? post.categoria_en : post.categoria;

  const dataPublicacao = new Date(post.created_at).toLocaleDateString(isEn ? 'en-US' : 'pt-PT', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": titulo,
    "image": post.imagem_url || FALLBACK_COVER,
    "datePublished": post.created_at,
    "author": { "@type": "Organization", "name": "HelloCamp" }
  };

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      {/* ═══════════════════════════════════════════ */}
      {/* CABEÇALHO DO ARTIGO                         */}
      {/* ═══════════════════════════════════════════ */}
      <header className="max-w-4xl mx-auto px-4 md:px-6 pt-16 pb-12 text-center">
        <Link
          href={`/${lang}/blog`}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-5 py-2.5 rounded-full mb-10 transition-colors border border-slate-200 shadow-sm"
        >
          &larr; {isEn ? 'Back to Journal' : 'Voltar aos Guias'}
        </Link>

        {categoria && (
          <div className="mb-4 text-[11px] font-black text-[#0E3A68] uppercase tracking-widest bg-blue-50 border border-blue-100 px-3 py-1 rounded-md inline-block">
            {categoria}
          </div>
        )}

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-8 text-slate-900">
          {titulo}
        </h1>

        <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest flex-wrap">
          <span>{dataPublicacao}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-400">{isEn ? 'HelloCamp Editorial' : 'Redação HelloCamp'}</span>
        </div>
      </header>

      {/* ═══════════════════════════════════════════ */}
      {/* IMAGEM DE CAPA                              */}
      {/* ═══════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 mb-16">
        <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 bg-slate-100">
          <img
            src={post.imagem_url || FALLBACK_COVER}
            onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
            alt={titulo}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* CORPO DO ARTIGO (TYPOGRAPHY TAILWIND PRO)   */}
      {/* ═══════════════════════════════════════════ */}
      <article className="
        max-w-3xl mx-auto px-4 md:px-6
        prose prose-slate prose-lg md:prose-xl w-full
        prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900
        prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6
        prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-4
        prose-p:text-slate-600 prose-p:leading-relaxed prose-p:mb-8
        prose-a:text-[#0E3A68] prose-a:font-bold prose-a:no-underline hover:prose-a:underline
        prose-strong:font-black prose-strong:text-slate-900
        prose-li:text-slate-600 prose-li:marker:text-[#0E3A68]
        prose-img:rounded-3xl prose-img:shadow-xl prose-img:border prose-img:border-slate-100
      ">
        <div dangerouslySetInnerHTML={{ __html: conteudo }} />
      </article>

      {/* ═══════════════════════════════════════════ */}
      {/* BOTTOM CROSS-SELLING (CONVERSÃO SEO)        */}
      {/* ═══════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-20 pt-16 border-t border-slate-200">
        <div className="bg-[#0E3A68] rounded-[2.5rem] p-10 md:p-14 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-800 to-[#0E3A68] pointer-events-none" />
          
          <div className="relative z-10">
            <span className="text-4xl mb-6 block">🏕️</span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
              {isEn ? 'Ready for the next adventure?' : 'Pronto para a próxima aventura?'}
            </h2>
            <p className="text-blue-100 text-lg font-medium mb-10 max-w-xl mx-auto">
              {isEn 
                ? `Don't wait until it's fully booked. Discover the best ${categoria || ''} summer camps on HelloCamp.` 
                : `Não espere que esgote. Compare, escolha e reserve de forma segura na maior plataforma ibérica.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={`/${lang}/pesquisa${categoria ? `?categoria=${encodeURIComponent(categoria)}` : ''}`} 
                className="bg-[#e2a41d] hover:bg-[#d4991b] text-slate-900 font-black px-10 py-5 rounded-2xl transition-all shadow-xl shadow-[#e2a41d]/20 uppercase tracking-widest text-sm"
              >
                {isEn ? 'Search Camps Now' : 'Pesquisar Campos Agora'}
              </Link>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
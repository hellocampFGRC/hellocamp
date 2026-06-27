import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoPartilhaArtigo from "../components/BotaoPartilhaArtigo"; // Componente Client para partilha
import { notFound } from "next/navigation";

// ==========================================
// METADATA (SEO DINÂMICO PARA O GOOGLE)
// ==========================================
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
      images: [{ url: post.imagem_url || '/og-blog.jpg', width: 1200, height: 630 }] 
    }
  };
}

// ==========================================
// COMPONENTE PRINCIPAL (SERVER COMPONENT)
// ==========================================
export default async function BlogPostPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const isEn = lang === 'en';

  const { data: post } = await supabase.from('blog_posts').select('*').eq('slug', slug).single();

  if (!post) {
    notFound(); // Redireciona para página 404 automática do Next.js
  }

  const titulo = isEn && post.titulo_en ? post.titulo_en : post.titulo;
  const conteudo = isEn && post.conteudo_en ? post.conteudo_en : post.conteudo;
  const categoria = isEn && post.categoria_en ? post.categoria_en : post.categoria;

  const dataPublicacao = new Date(post.created_at).toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });

  // Schema JSON-LD para Artigos (SEO Extremo)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": titulo,
    "image": post.imagem_url,
    "datePublished": post.created_at,
    "author": {
      "@type": "Organization",
      "name": "HelloCamp"
    }
  };

  return (
    <main className="min-h-screen bg-white font-sans antialiased text-slate-900 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      {/* CABEÇALHO DO ARTIGO */}
      <header className="max-w-4xl mx-auto px-4 md:px-8 pt-12 pb-8 text-center">
        <Link href={`/${lang}/blog`} className="inline-block text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full mb-8 transition-colors">
          &larr; {isEn ? 'Back to Blog' : 'Voltar ao Blog'}
        </Link>
        
        {categoria && (
          <div className="mb-4 text-xs font-black text-slate-400 uppercase tracking-widest">
            {categoria}
          </div>
        )}
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
          {titulo}
        </h1>
        
        <div className="flex items-center justify-center gap-4 text-sm font-bold text-slate-500">
          <span>{dataPublicacao}</span>
          <span>•</span>
          <BotaoPartilhaArtigo title={titulo} />
        </div>
      </header>

      {/* IMAGEM DE CAPA */}
      {post.imagem_url && (
        <div className="max-w-5xl mx-auto px-4 md:px-8 mb-16">
          <div className="w-full aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl">
            <img src={post.imagem_url} alt={titulo} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* CORPO DO ARTIGO */}
      <article className="max-w-3xl mx-auto px-4 md:px-8 prose prose-lg prose-slate prose-headings:font-black prose-a:text-emerald-600 hover:prose-a:text-emerald-700">
        {/* Renderiza o HTML do conteúdo. Assumindo que o editor guarda HTML. */}
        <div dangerouslySetInnerHTML={{ __html: conteudo }} />
      </article>

      {/* FOOTER DO ARTIGO (Partilha final) */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-900 m-0">{isEn ? 'Did you find this helpful?' : 'Achou este artigo útil?'}</p>
          <p className="text-xs text-slate-500 m-0">{isEn ? 'Share it with other parents.' : 'Partilhe com outros encarregados de educação.'}</p>
        </div>
        <BotaoPartilhaArtigo title={titulo} layout="button" />
      </div>

    </main>
  );
}
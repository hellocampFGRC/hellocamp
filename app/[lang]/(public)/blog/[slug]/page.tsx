import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoPartilhaArtigo from "../components/BotaoPartilhaArtigo";
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
    notFound();
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
        <Link href={`/${lang}/blog`} className="inline-block text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-5 py-2.5 rounded-full mb-8 transition-colors border border-emerald-100 shadow-sm">
          &larr; {isEn ? 'Back to Blog' : 'Voltar ao Blog'}
        </Link>
        
        {categoria && (
          <div className="mb-5 text-xs font-black text-slate-400 uppercase tracking-widest">
            {categoria}
          </div>
        )}
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-8">
          {titulo}
        </h1>
        
        <div className="flex items-center justify-center gap-4 text-sm font-bold text-slate-500">
          <span className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">{dataPublicacao}</span>
          <span>•</span>
          <BotaoPartilhaArtigo title={titulo} />
        </div>
      </header>

      {/* IMAGEM DE CAPA */}
      {post.imagem_url && (
        <div className="max-w-5xl mx-auto px-4 md:px-8 mb-16">
          <div className="w-full aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
            <img src={post.imagem_url} alt={titulo} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* CORPO DO ARTIGO - ESTILIZAÇÃO FORÇADA E TEXTO JUSTIFICADO */}
      <article className="
        max-w-3xl mx-auto px-4 md:px-8 
        text-slate-600 font-medium text-[1.05rem] md:text-lg leading-relaxed text-justify
        
        /* Títulos H2 (Ex: 1. Avaliar a Idade...) */
        [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:mt-16 [&_h2]:mb-6 [&_h2]:leading-tight [&_h2]:text-left
        
        /* Títulos H3 (Ex: Perguntas Frequentes) */
        [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:font-black [&_h3]:text-slate-900 [&_h3]:mt-14 [&_h3]:mb-6 [&_h3]:pb-4 [&_h3]:border-b [&_h3]:border-slate-100 [&_h3]:text-left
        
        /* Parágrafos Base */
        [&_p]:mb-6 [&_p]:leading-loose
        
        /* Bolds Normais */
        [&_strong]:font-black [&_strong]:text-slate-900
        
        /* Listas (Ex: Checklists e Bullet points) */
        [&_ul]:list-none [&_ul]:pl-0 [&_ul]:mb-8 [&_ul]:space-y-6 [&_ul]:text-left
        [&_li]:relative [&_li]:pl-8
        [&_li::before]:content-[''] [&_li::before]:absolute [&_li::before]:left-0 [&_li::before]:top-3 [&_li::before]:w-2 [&_li::before]:h-2 [&_li::before]:bg-emerald-500 [&_li::before]:rounded-full
        
        /* Magia para FAQs (Perguntas) */
        [&_p>strong:first-child]:block 
        [&_p>strong:first-child]:text-lg 
        [&_p>strong:first-child]:md:text-xl 
        [&_p>strong:first-child]:mt-10 
        [&_p>strong:first-child]:mb-3 
        [&_p>strong:first-child]:text-slate-900
        [&_p>strong:first-child]:leading-snug
        [&_p>strong:first-child]:text-left
      ">
        <div dangerouslySetInnerHTML={{ __html: conteudo }} />
      </article>

      {/* FOOTER DO ARTIGO (Partilha final) */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 mt-20 pt-10 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/50 rounded-3xl p-8">
        <div>
          <p className="text-base font-black text-slate-900 m-0 mb-1">{isEn ? 'Did you find this helpful?' : 'Achou este artigo útil?'}</p>
          <p className="text-sm font-medium text-slate-500 m-0">{isEn ? 'Share it with other parents.' : 'Partilhe com outros encarregados de educação para os ajudar no planeamento.'}</p>
        </div>
        <BotaoPartilhaArtigo title={titulo} layout="button" />
      </div>

    </main>
  );
}
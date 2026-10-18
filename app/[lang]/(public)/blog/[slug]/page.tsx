import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoPartilhaArtigo from "../components/BotaoPartilhaArtigo";
import { notFound } from "next/navigation";

const FALLBACK_COVER = "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200";

// ═══════════════════════════════════════════
// METADADOS SEO (BLINDADO)
// ═══════════════════════════════════════════
export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  const isEn = lang === 'en';

  try {
    const { data: post } = await supabase
      .from('blog_posts')
      .select('titulo, titulo_en, resumo, resumo_en, imagem_url, created_at')
      .eq('slug', decodeURIComponent(slug))
      .limit(1)
      .maybeSingle();

    if (!post) return { title: 'Blog | HelloCamp' };

    const title = (isEn && post.titulo_en ? post.titulo_en : (post.titulo || 'Blog')) + ' | HelloCamp';
    const description = isEn && post.resumo_en ? post.resumo_en : (post.resumo || '');

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: post.created_at || new Date().toISOString(),
        images: [{ url: post.imagem_url || FALLBACK_COVER, width: 1200, height: 630 }]
      }
    };
  } catch (error) {
    return { title: 'Blog | HelloCamp' };
  }
}

// ═══════════════════════════════════════════
// PÁGINA PRINCIPAL DO ARTIGO
// ═══════════════════════════════════════════
export default async function BlogPostPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const isEn = lang === 'en';

  let post = null;

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', decodeURIComponent(slug))
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    post = data;
  } catch (error) {
    console.error("Erro interno ao carregar o artigo:", error);
  }

  // Se não encontrar o artigo (slug inválido), ativa o 404 corretamente
  if (!post) {
    notFound();
  }

  // Fallbacks de Segurança para Textos Nulos
  const titulo = isEn && post.titulo_en ? post.titulo_en : (post.titulo || 'Artigo sem título');
  const conteudo = isEn && post.conteudo_en ? post.conteudo_en : (post.conteudo || '<p>Conteúdo em atualização...</p>');
  const categoria = isEn && post.categoria_en ? post.categoria_en : (post.categoria || '');

  // Proteção da Data (Impede o crash se a data na BD for inválida)
  let dataPublicacao = '';
  try {
    if (post.created_at) {
      const d = new Date(post.created_at);
      dataPublicacao = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
  } catch (e) {
    dataPublicacao = 'Recente';
  }

  // Schema SEO protegido contra quebras de React
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": titulo,
    "image": post.imagem_url || FALLBACK_COVER,
    "datePublished": post.created_at || new Date().toISOString(),
    "author": { "@type": "Organization", "name": "HelloCamp" }
  };
  const schemaString = JSON.stringify(articleSchema).replace(/</g, '\\u003c');

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaString }} />

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
          {dataPublicacao && <span>{dataPublicacao}</span>}
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
      {/* RODAPÉ DO ARTIGO / PARTILHA                 */}
      {/* ═══════════════════════════════════════════ */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 mt-16 pb-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 border border-slate-100 rounded-3xl p-8">
          <div>
            <p className="text-base font-black text-slate-900 mb-1">
              {isEn ? 'Did you find this helpful?' : 'Achou este artigo útil?'}
            </p>
            <p className="text-sm font-medium text-slate-500 m-0">
              {isEn ? 'Share it with your network.' : 'Partilhe o guia para ajudar outras famílias ou parceiros.'}
            </p>
          </div>
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
             {/* RECUPERADO: layout="button" para evitar o crash do teu componente local */}
             <BotaoPartilhaArtigo title={titulo} isEn={isEn} layout="button" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* BOTTOM CROSS-SELLING (CONVERSÃO SEO)        */}
      {/* ═══════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-10 pt-16 border-t border-slate-200">
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
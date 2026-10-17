import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { ReservaProvider, SeletorOpcoes, CaixaResumo } from "./CaixaReserva";
import BotaoFavorito from "../../components/BotaoFavorito";
import BotaoPartilha from "../../components/BotaoPartilha";
import { getDictionary } from "@/lib/getDictionary";
import FormContactoCampo from "../../components/FormContactoCampo";
import DescricaoExpansivel from "../../components/DescricaoExpansivel";
import { unstable_cache } from "next/cache";

// ==========================================
// CACHE GLOBAL DA PÁGINA DE DESTINO (24 HORAS)
// ==========================================
export const revalidate = 86400; // Mantém a página ultrarrápida na Edge Vercel

// Cache dos queries Supabase para Server Components
const getCampoCached = unstable_cache(
  async (id: string) => {
    const { data } = await supabase.from('campos').select('*').eq('id', id).single();
    return data;
  },
  ['cache-campo-detalhe'],
  { revalidate: 86400 }
);

const getReviewsCached = unstable_cache(
  async (id: string) => {
    const { data } = await supabase.from("reviews").select("*").eq("campo_id", id).order('created_at', { ascending: false });
    return data || [];
  },
  ['cache-campo-reviews'],
  { revalidate: 86400 }
);

// ==========================================
// METADATA (SEO & OpenGraph)
// ==========================================
export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  const isEn = lang === 'en';

  const campo = await getCampoCached(id);

  if (!campo) return { title: 'Camp | HelloCamp' };

  const title = (isEn && campo.nome_en ? campo.nome_en : campo.nome) + ' | HelloCamp';
  const descRaw = isEn && campo.descricao_en ? campo.descricao_en : campo.descricao;
  const description = descRaw ? descRaw.substring(0, 155) + '...' : '';

  return {
    title, description,
    openGraph: { title, description, images: [{ url: campo.imagem || '/og-image.jpg', width: 1200, height: 630 }] }
  };
}

// ==========================================
// COMPONENTE PRINCIPAL (SERVER COMPONENT)
// ==========================================
export default async function DetalhesDoCampo({ params }: { params: Promise<{ lang: string; id: string }>; }) {
  const { lang, id } = await params;

  const dict = await getDictionary(lang as "pt" | "en");
  const isEn = lang === 'en';

  const campo = await getCampoCached(id);
  const reviews = await getReviewsCached(id);

  if (!campo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-6 text-4xl">🕵️‍♂️</div>
        <h1 className="text-3xl font-black text-slate-900">{isEn ? 'Camp not found' : 'Campo não encontrado'}</h1>
        <Link href={`/${lang}/pesquisa`} className="mt-6 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-slate-800 transition-colors">
          {dict.detalhe.voltar_pesquisa}
        </Link>
      </div>
    );
  }

  let parceiroInfo = null;
  if (campo.organizador_id) {
    const { data: organizador } = await supabase.from("perfis").select("nome_empresa, logotipo_url, parceiro_verificado").eq("id", campo.organizador_id).single();
    parceiroInfo = organizador;
  }

  const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
  const descCampo = isEn && campo.descricao_en ? campo.descricao_en : campo.descricao;
  const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
  const localCampo = isEn && campo.local_en ? campo.local_en : (isEn && campo.Distrito_en ? campo.Distrito_en : (campo.Distrito || campo.distrito || campo.local));
  const racioCampo = isEn && campo.racio_monitores_en ? campo.racio_monitores_en : campo.racio_monitores;
  const alimentacaoCampo = isEn && campo.alimentacao_en ? campo.alimentacao_en : campo.alimentacao;
  const alojamentoCampo = isEn && campo.alojamento_en ? campo.alojamento_en : campo.alojamento;
  const seguroCampo = isEn && campo.seguro_en ? campo.seguro_en : campo.seguro;
  const regrasCampo = isEn && campo.regras_termos_en ? campo.regras_termos_en : campo.regras_termos;

  const paisReal = campo.pais || "Portugal";
  const paisVisivel = isEn && campo.pais_en ? campo.pais_en : paisReal;

  const scoreAvaliacoes = campo.rating_score || 0;
  const totalAvaliacoes = campo.total_reviews || 0;

  const baseUrl = "https://www.hellocamp.pt";
  const campoUrlCompleto = `${baseUrl}/${lang}/campo/${campo.id}`;

  const calendario = campo.calendario_funcionamento || { data_inicio: "", data_fim: "", dias_semana: [] };
  const todayISO = new Date().toISOString().split('T')[0];
  const dataMaisCedo = calendario.data_inicio || campo.data_inicio || todayISO;

  let precoMinimo = campo.preco || 0;
  if (campo.pacotes && campo.pacotes.length > 0 && !precoMinimo) {
    const todosPrecos = campo.pacotes.flatMap((p: any) => p.variantes ? p.variantes.map((v: any) => v.preco) : []);
    if (todosPrecos.length > 0) precoMinimo = Math.min(...todosPrecos);
  }

  // ==========================================
  // SCHEMAS JSON-LD
  // ==========================================
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": nomeCampo,
    "description": descCampo ? descCampo.substring(0, 155) : '',
    "image": campo.imagem,
    "startDate": dataMaisCedo,
    ...(calendario.data_fim && { "endDate": calendario.data_fim }),
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": localCampo,
      "address": { "@type": "PostalAddress", "addressLocality": localCampo, "addressCountry": paisReal }
    },
    "offers": {
      "@type": "Offer",
      "price": precoMinimo,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "validFrom": todayISO
    },
    ...(totalAvaliacoes > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": scoreAvaliacoes,
        "reviewCount": totalAvaliacoes
      }
    }),
    "organizer": {
      "@type": "Organization",
      "name": parceiroInfo?.nome_empresa || "HelloCamp Partner"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isEn ? "Home" : "Início", "item": `${baseUrl}/${lang}` },
      { "@type": "ListItem", "position": 2, "name": paisVisivel, "item": `${baseUrl}/${lang}/pesquisa/pais/${encodeURIComponent(paisReal)}` },
      { "@type": "ListItem", "position": 3, "name": localCampo, "item": `${baseUrl}/${lang}/distrito/${encodeURIComponent(campo.Distrito || localCampo)}` },
      { "@type": "ListItem", "position": 4, "name": nomeCampo, "item": campoUrlCompleto }
    ]
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }} />

      {/* HERO SECTION COM LCP PRIORITÁRIO */}
      <div className="relative w-full h-[400px] md:h-[500px] bg-slate-900 overflow-hidden">
        <Image 
          src={campo.imagem || '/og-image.jpg'} 
          alt={nomeCampo} 
          fill
          priority
          className="object-cover opacity-90"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent"></div>

        <div className="absolute top-6 left-6 z-30 hidden sm:block">
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-700 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-white/20 tracking-wider uppercase">
            <Link href={`/${lang}`} className="hover:text-slate-900 transition-colors">{isEn ? 'Home' : 'Início'}</Link>
            <span className="text-slate-400">/</span>
            <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(paisReal)}`} className="hover:text-slate-900 transition-colors">{paisVisivel}</Link>
            <span className="text-slate-400">/</span>
            <Link href={`/${lang}/distrito/${encodeURIComponent(campo.Distrito || localCampo)}`} className="hover:text-slate-900 transition-colors">{localCampo}</Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-400 max-w-[120px] sm:max-w-[150px] truncate" title={nomeCampo}>{nomeCampo}</span>
          </nav>
        </div>

        <div className="absolute top-6 left-4 z-30 sm:hidden">
          <Link href={`/${lang}/distrito/${encodeURIComponent(campo.Distrito || localCampo)}`} className="inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-sm px-4 py-2.5 text-xs font-bold text-slate-700 shadow-md border border-white/20 uppercase tracking-wider">
            &larr; {localCampo}
          </Link>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto pt-8 pb-10 px-4 md:px-6">

        <ReservaProvider campo={campo} lang={lang}>
          <div className="flex flex-col lg:flex-row gap-8 items-start w-full">

            {/* COLUNA ESQUERDA */}
            <div className="flex-1 w-full flex flex-col gap-6">

              {/* CABEÇALHO DO CAMPO */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 relative z-40">
                <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
                  <BotaoPartilha url={campoUrlCompleto} titulo={nomeCampo} isEn={isEn} />
                  <BotaoFavorito campoId={campo.id} />
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4 pr-20">
                  <span className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-700 uppercase tracking-widest">{catCampo}</span>
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    {localCampo}
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4 tracking-tight">{nomeCampo}</h1>

                <div className="flex items-center gap-3">
                  <span className="text-slate-900 bg-amber-100 px-2 py-1 rounded-md text-sm font-black">★ {scoreAvaliacoes > 0 ? scoreAvaliacoes.toFixed(1) : 'Novo'}</span>
                  <span className="text-slate-500 text-xs font-bold">
                    ({totalAvaliacoes} {isEn ? 'reviews' : 'avaliações'})
                  </span>
                </div>
              </div>

              {/* DESCRIÇÃO E PERFIL DO ORGANIZADOR */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 relative z-10">
                <h2 className="text-xl font-black text-slate-900 mb-4">{dict.detalhe.sobre_programa}</h2>
                <div className="text-sm">
                  <DescricaoExpansivel texto={descCampo} isEn={isEn} />
                </div>

                {campo.organizador_id && parceiroInfo && (
                  <Link href={`/${lang}/parceiro/${campo.organizador_id}`} className="mt-8 flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors no-underline group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                        {parceiroInfo.logotipo_url ? (
                          <img src={parceiroInfo.logotipo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-400 text-lg">🏢</span>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest m-0 mb-0.5">{isEn ? 'Organized by' : 'Organizado por'}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-black text-slate-900 m-0 group-hover:text-blue-600 transition-colors">
                            {parceiroInfo.nome_empresa || 'Parceiro HelloCamp'}
                          </p>
                          {parceiroInfo.parceiro_verificado && (
                            <span className="bg-blue-100 text-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px]" title="Parceiro Verificado">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-slate-400 font-bold group-hover:text-blue-600 transition-colors">&rarr;</span>
                  </Link>
                )}
              </div>

              {/* INFORMAÇÕES LOGÍSTICAS IMPORTANTES */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 relative z-10">
                <h2 className="text-xl font-black text-slate-900 mb-6">{dict.detalhe.informacoes_importantes}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start sm:items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex-col sm:flex-row">
                    <span className="text-2xl">👥</span>
                    <div><h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">{dict.detalhe.racio_monitores}</h4><p className="text-sm font-black text-slate-800 m-0 leading-tight">{racioCampo || dict.detalhe.sob_consulta}</p></div>
                  </div>
                  <div className="flex items-start sm:items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex-col sm:flex-row">
                    <span className="text-2xl">🍎</span>
                    <div><h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">{dict.detalhe.alimentacao}</h4><p className="text-sm font-black text-slate-800 m-0 leading-tight">{alimentacaoCampo || dict.detalhe.sob_consulta}</p></div>
                  </div>
                  <div className="flex items-start sm:items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex-col sm:flex-row">
                    <span className="text-2xl">🏕️</span>
                    <div><h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">{dict.detalhe.alojamento}</h4><p className="text-sm font-black text-slate-800 m-0 leading-tight">{alojamentoCampo || dict.detalhe.nao_inclui_dormida}</p></div>
                  </div>
                  <div className="flex items-start sm:items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex-col sm:flex-row">
                    <span className="text-2xl">🛡️</span>
                    <div><h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">{dict.detalhe.seguros}</h4><p className="text-sm font-black text-slate-800 m-0 leading-tight">{seguroCampo || dict.detalhe.sob_consulta}</p></div>
                  </div>
                </div>
              </div>

              {/* MOTOR DE RESERVA INTERATIVO */}
              <SeletorOpcoes />

              {/* REGRAS E TERMOS ESPECÍFICOS */}
              {regrasCampo && (
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 relative z-10">
                  <h2 className="text-xl font-black text-slate-900 mb-4">{isEn ? 'Specific Rules & Terms' : 'Regras e Termos'}</h2>
                  <p className="leading-relaxed text-slate-600 text-sm whitespace-pre-wrap font-medium m-0 bg-slate-50 p-6 rounded-2xl border border-slate-100">{regrasCampo}</p>
                </div>
              )}

              {/* SECÇÃO DE AVALIAÇÕES */}
              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 relative z-10">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 m-0">{isEn ? 'Reviews' : 'Avaliações'}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 bg-amber-100 px-2 py-1 rounded-md text-sm font-black">★ {scoreAvaliacoes > 0 ? scoreAvaliacoes.toFixed(1) : 'Novo'}</span>
                  </div>
                </div>

                {!reviews || reviews.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 font-bold text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                    {isEn ? 'No reviews for this camp yet. Be the first!' : 'Ainda não há avaliações. Seja o primeiro a deixar opinião após o campo!'}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {reviews.map((rev: any) => (
                      <div key={rev.id} className="flex flex-col gap-2 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-600 text-sm flex-shrink-0">
                            {rev.nome_pai ? rev.nome_pai.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <p className="font-black text-sm text-slate-900 m-0">{rev.nome_pai || 'Anónimo'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0">{new Date(rev.created_at).toLocaleDateString(isEn ? 'en-US' : 'pt-PT')}</p>
                          </div>
                        </div>
                        <div className="text-[#EBA914] text-xs">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                        <p className="text-sm text-slate-600 m-0 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{rev.comentario}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* GALERIA */}
              {campo.galeria && Array.isArray(campo.galeria) && campo.galeria.length > 0 && (
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 relative z-10">
                  <h2 className="text-xl font-black text-slate-900 mb-6">{isEn ? 'Photo Gallery' : 'Mais Fotografias'}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {campo.galeria.map((imgUrl: string, idx: number) => (
                      <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                        <img
                          src={imgUrl}
                          alt={`${nomeCampo} Foto ${idx + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FORMULÁRIO DE CONTACTO */}
              <div id="duvidas" className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 relative z-10 scroll-mt-24">
                <h3 className="text-xl font-black text-slate-900 mb-2">{dict.detalhe.duvidas_titulo}</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">{dict.detalhe.duvidas_sub}</p>

                <FormContactoCampo
                  campoId={campo.id}
                  organizadorId={campo.organizador_id}
                  nomeCampo={nomeCampo}
                  dict={dict}
                  isEn={isEn}
                  lang={lang}
                />
              </div>

            </div>

            {/* BARRA LATERAL COM O RESUMO FIXO */}
            <div className="w-full lg:w-[380px] flex-shrink-0 lg:sticky lg:top-8 relative z-30">
              <CaixaResumo />
            </div>
          </div>
        </ReservaProvider>
      </div>
    </main>
  );
}
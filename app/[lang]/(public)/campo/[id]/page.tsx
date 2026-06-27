import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
// Importamos o Provedor, o Seletor e a Caixa de Resumo!
import { ReservaProvider, SeletorOpcoes, CaixaResumo } from "./CaixaReserva";
import BotaoFavorito from "../../components/BotaoFavorito";
import BotaoPartilha from "../../components/BotaoPartilha";
import { getDictionary } from "@/lib/getDictionary";
import FormContactoCampo from "../../components/FormContactoCampo";
import DescricaoExpansivel from "../../components/DescricaoExpansivel";

// ==========================================
// METADATA (SEO & OpenGraph)
// ==========================================
export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  const isEn = lang === 'en';

  const { data: campo } = await supabase.from('campos').select('nome, nome_en, descricao, descricao_en, imagem').eq('id', id).single();

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

  const { data: campo } = await supabase.from("campos").select("*").eq("id", id).single();
  const { data: reviews } = await supabase.from("reviews").select("*").eq("campo_id", id).order('created_at', { ascending: false });

  if (!campo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
        <h1 className="text-3xl font-black text-slate-900">{isEn ? 'Camp not found' : 'Campo não encontrado'} 🕵️‍♂️</h1>
        <Link href={`/${lang}`} className="mt-6 font-bold text-emerald-600 hover:text-emerald-700">&larr; {dict.detalhe.voltar_pesquisa}</Link>
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
  const dataMaisCedo = calendario.data_inicio || "2026-07-01";

  // Lógica inteligente para JSON-LD SEO Price
  let precoMinimo = campo.preco || 0;
  if (campo.pacotes && campo.pacotes.length > 0 && !precoMinimo) {
    const todosPrecos = campo.pacotes.flatMap((p: any) => p.variantes.map((v: any) => v.preco));
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
      "validFrom": new Date().toISOString().split('T')[0]
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

      {/* HERO SECTION */}
      <div className="relative w-full h-[400px] md:h-[500px] bg-slate-900 overflow-hidden">
        <img src={campo.imagem} alt={nomeCampo} className="w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent"></div>

        <div className="absolute top-6 left-6 z-30 hidden sm:block">
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-700 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-white/20 tracking-wider uppercase">
            <Link href={`/${lang}`} className="hover:text-emerald-600 transition-colors">{isEn ? 'Home' : 'Início'}</Link>
            <span className="text-slate-400">/</span>
            <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(paisReal)}`} className="hover:text-emerald-600 transition-colors">{paisVisivel}</Link>
            <span className="text-slate-400">/</span>
            <Link href={`/${lang}/distrito/${encodeURIComponent(campo.Distrito || localCampo)}`} className="hover:text-emerald-600 transition-colors">{localCampo}</Link>
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
        
        {/* ========================================== */}
        {/* O ENVOLTÓRIO DA LÓGICA DE RESERVA */}
        {/* ========================================== */}
        <ReservaProvider campo={campo} lang={lang}>
          <div className="flex flex-col lg:flex-row gap-8 items-start w-full">

            {/* COLUNA ESQUERDA: INFORMAÇÃO E ZONA INTERATIVA */}
            <div className="flex-1 w-full flex flex-col gap-6">

              {/* CABEÇALHO DO CAMPO */}
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 relative z-40">
                <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
                  <BotaoPartilha url={campoUrlCompleto} titulo={nomeCampo} isEn={isEn} />
                  <BotaoFavorito campoId={campo.id} />
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4 pr-20">
                  <span className="rounded-md bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-widest">{catCampo}</span>
                  <span className="text-[11px] font-bold text-slate-500">📍 {localCampo}</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-3">{nomeCampo}</h1>

                <div className="flex items-center gap-3">
                  <span className="text-[#EBA914] text-sm font-black">★ {scoreAvaliacoes > 0 ? scoreAvaliacoes.toFixed(1) : 'Novo'}</span>
                  <span className="text-slate-400 text-xs font-bold underline decoration-slate-300 underline-offset-2">
                    ({totalAvaliacoes} {isEn ? 'reviews' : 'avaliações'})
                  </span>
                </div>
              </div>

              {/* DESCRIÇÃO E PERFIL DO ORGANIZADOR */}
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 relative z-10">
                <h2 className="text-lg font-black text-slate-900 mb-3">{dict.detalhe.sobre_programa}</h2>
                <div className="text-sm">
                  <DescricaoExpansivel texto={descCampo} isEn={isEn} />
                </div>

                {campo.organizador_id && parceiroInfo && (
                  <Link href={`/${lang}/parceiro/${campo.organizador_id}`} className="mt-6 flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors no-underline group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                        {parceiroInfo.logotipo_url ? (
                          <img src={parceiroInfo.logotipo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-400 text-sm">🏢</span>
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest m-0">{isEn ? 'Organized by' : 'Organizado por'}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-black text-slate-900 m-0 group-hover:text-emerald-600 transition-colors">
                            {parceiroInfo.nome_empresa || 'Parceiro HelloCamp'}
                          </p>
                          {parceiroInfo.parceiro_verificado && (
                            <span className="text-emerald-500 text-[10px]" title="Parceiro Verificado">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-slate-400 text-xs font-bold">&rarr;</span>
                  </Link>
                )}
              </div>

              {/* INFORMAÇÕES LOGÍSTICAS IMPORTANTES */}
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 relative z-10">
                <h2 className="text-lg font-black text-slate-900 mb-5">{dict.detalhe.informacoes_importantes}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xl">👥</span>
                    <div><h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">{dict.detalhe.racio_monitores}</h4><p className="text-xs font-black text-slate-700 m-0 leading-tight">{racioCampo || dict.detalhe.sob_consulta}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xl">🍎</span>
                    <div><h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">{dict.detalhe.alimentacao}</h4><p className="text-xs font-black text-slate-700 m-0 leading-tight">{alimentacaoCampo || dict.detalhe.sob_consulta}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xl">🏕️</span>
                    <div><h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">{dict.detalhe.alojamento}</h4><p className="text-xs font-black text-slate-700 m-0 leading-tight">{alojamentoCampo || dict.detalhe.nao_inclui_dormida}</p></div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xl">🛡️</span>
                    <div><h4 className="font-bold text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">{dict.detalhe.seguros}</h4><p className="text-xs font-black text-slate-700 m-0 leading-tight">{seguroCampo || dict.detalhe.sob_consulta}</p></div>
                  </div>
                </div>
              </div>

              {/* ========================================== */}
              {/* O NOVO MOTOR DE RESERVA INTERATIVO AQUI */}
              {/* ========================================== */}
              <SeletorOpcoes />

              {/* REGRAS E TERMOS ESPECÍFICOS */}
              {regrasCampo && (
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 relative z-10">
                  <h2 className="text-lg font-black text-slate-900 mb-3">{isEn ? 'Specific Rules & Terms' : 'Regras e Termos'}</h2>
                  <p className="leading-relaxed text-slate-600 text-xs whitespace-pre-wrap font-medium mb-0">{regrasCampo}</p>
                </div>
              )}

              {/* SECÇÃO DE AVALIAÇÕES */}
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 relative z-10">
                <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-3">
                  <h2 className="text-lg font-black text-slate-900 m-0">{isEn ? 'Reviews' : 'Avaliações'}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[#EBA914] text-sm font-black">★ {scoreAvaliacoes > 0 ? scoreAvaliacoes.toFixed(1) : 'Novo'}</span>
                  </div>
                </div>

                {!reviews || reviews.length === 0 ? (
                  <div className="text-center py-4 text-slate-400 font-bold text-xs">
                    {isEn ? 'No reviews for this camp yet. Be the first!' : 'Ainda não há avaliações. Seja o primeiro a deixar opinião após o campo!'}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {reviews.map((rev: any) => (
                      <div key={rev.id} className="flex flex-col gap-1 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-600 text-xs flex-shrink-0">
                            {rev.nome_pai ? rev.nome_pai.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <p className="font-black text-xs text-slate-900 m-0">{rev.nome_pai || 'Anónimo'}</p>
                            <p className="text-[10px] font-bold text-slate-400 m-0">{new Date(rev.created_at).toLocaleDateString(isEn ? 'en-US' : 'pt-PT')}</p>
                          </div>
                        </div>
                        <div className="text-[#EBA914] text-[10px]">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                        <p className="text-xs text-slate-600 m-0 font-medium leading-relaxed">{rev.comentario}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FORMULÁRIO DE CONTACTO */}
              <div id="duvidas" className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 relative z-10 scroll-mt-24">
                <h3 className="text-lg font-black text-slate-900 mb-1">{dict.detalhe.duvidas_titulo}</h3>
                <p className="text-xs text-slate-500 font-medium mb-5">{dict.detalhe.duvidas_sub}</p>

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

            {/* ========================================== */}
            {/* BARRA LATERAL COM O RESUMO FIXO */}
            {/* ========================================== */}
            <div className="w-full lg:w-[380px] flex-shrink-0 lg:sticky lg:top-8 relative z-30">
              <CaixaResumo />
            </div>
          </div>
        </ReservaProvider>
      </div>
    </main>
  );
}
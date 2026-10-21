import { supabase } from "../../../lib/supabase";
import Link from "next/link";
import { getDictionary } from "../../../lib/getDictionary";
import BotaoFavorito from "./components/BotaoFavorito";

// ==========================================
// CONFIGURAÇÃO DE CACHE DE ELITE (Vercel ISR)
// ==========================================
export const revalidate = 1; // 24 horas

const PAISES_DESTAQUE = [
  { nome: "Portugal", nome_en: "Portugal", imagem: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=800", desc: "Aventura e Sol", desc_en: "Adventure and Sun" },
  { nome: "Espanha", nome_en: "Spain", imagem: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&q=80&w=800", desc: "Cultura e Diversão", desc_en: "Culture and Fun" },
  { nome: "Reino Unido", nome_en: "United Kingdom", imagem: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800", desc: "Inglês Nativo", desc_en: "Native English" },
  { nome: "França", nome_en: "France", imagem: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&q=80&w=800", desc: "Arte e História", desc_en: "Art and History" },
  { nome: "Alemanha", nome_en: "Germany", imagem: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&q=80&w=800", desc: "Inovação e Natureza", desc_en: "Innovation & Nature" },
  { nome: "Estados Unidos", nome_en: "United States", imagem: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&q=80&w=800", desc: "A Grande Aventura", desc_en: "The Great Adventure" }
];

const DISTRITOS_DESTAQUE = [
  { nome: "Lisboa", nome_en: "Lisbon", imagem: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&q=80&w=800", desc: "Capital Vibrante", desc_en: "Vibrant Capital" },
  { nome: "Porto", nome_en: "Porto", imagem: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=800", desc: "A Magia do Norte", desc_en: "Northern Magic" },
  { nome: "Faro", nome_en: "Faro", imagem: "https://images.unsplash.com/photo-1533556019545-21d7b322a46c?auto=format&fit=crop&q=80&w=800", desc: "Praias do Algarve", desc_en: "Algarve Beaches" },
  { nome: "Braga", nome_en: "Braga", imagem: "https://images.unsplash.com/photo-1563806229-37330eb02d33?auto=format&fit=crop&q=80&w=800", desc: "Cidade Jovem", desc_en: "Youth City" }
];

const TRADUCOES_PAISES: Record<string, string> = {
  "Portugal": "Portugal", "Espanha": "Spain", "França": "France", "Reino Unido": "United Kingdom",
  "Alemanha": "Germany", "Itália": "Italy", "Estados Unidos": "United States"
};

// ═══════════════════════════════════════════
// AS ROTAS PROGRAMÁTICAS "ISECA" PARA O GOOGLE
// ═══════════════════════════════════════════
const LINKS_SEO_PROGRAMATICOS = [
  { pt: "Surf no Algarve", en: "Surf in Algarve", url: "surf/algarve" },
  { pt: "Futebol em Madrid", en: "Football in Madrid", url: "futebol/madrid" },
  { pt: "Inglês no Reino Unido", en: "English in the UK", url: "ingles/reino-unido" },
  { pt: "Desportos em Lisboa", en: "Sports in Lisbon", url: "desporto/lisboa" },
  { pt: "Tecnologia no Porto", en: "Tech in Porto", url: "tecnologia/porto" },
  { pt: "Aventura em Espanha", en: "Adventure in Spain", url: "aventura/espanha" },
];

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "pt" | "en");
  const isEn = lang === 'en';

  const todayISO = new Date().toISOString().split('T')[0];

  const [resCampos, resInst, resFiltros] = await Promise.all([
    supabase.from('campos').select('*').not('contrato_parceiro_url', 'is', null).limit(6).order('created_at', { ascending: false }),
    supabase.from('programas_institucionais').select('*').eq('is_active', true).limit(3).order('created_at', { ascending: false }),
    supabase.from('campos').select('categoria, categoria_en, idade, idade_en, Distrito, Distrito_en, pais, pais_en').not('contrato_parceiro_url', 'is', null)
  ]);

  const camposDeFerias = resCampos.data || [];
  const camposInstitucionais = resInst.data || [];
  const camposFiltros = resFiltros.data || [];

  const categoriasMap = new Map<string, string>();
  const idadesMap = new Map<string, string>();
  const distritosMap = new Map<string, string>();
  const paisesMap = new Map<string, string>();

  camposFiltros.forEach(c => {
    if (c.categoria?.trim()) categoriasMap.set(c.categoria.trim(), c.categoria_en?.trim() || c.categoria.trim());
    if (c.idade?.trim()) idadesMap.set(c.idade.trim(), c.idade_en?.trim() || c.idade.trim());
    if (c.Distrito?.trim()) distritosMap.set(c.Distrito.trim(), c.Distrito_en?.trim() || c.Distrito.trim());
    if (c.pais?.trim()) paisesMap.set(c.pais.trim(), c.pais_en?.trim() || c.pais.trim());
  });

  const categoriasOpcoes = Array.from(categoriasMap.entries()).map(([pt, en]) => ({ valor: pt, label: isEn ? en : pt }));
  const idadesOpcoes = Array.from(idadesMap.entries()).map(([pt, en]) => ({ valor: pt, label: isEn ? en : pt }));
  const distritosOpcoes = Array.from(distritosMap.entries()).map(([pt, en]) => ({ valor: pt, label: isEn ? en : pt }));
  const paisesOpcoes = Array.from(paisesMap.entries()).map(([pt, en]) => ({ valor: pt, label: isEn ? (en || TRADUCOES_PAISES[pt] || pt) : pt }));

  const distritosAtivosCards = DISTRITOS_DESTAQUE.filter(d => distritosMap.has(d.nome));
  const paisesAtivosCards = PAISES_DESTAQUE.filter(p => paisesMap.has(p.nome));

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* HERO SECTION */}
      <section className="relative min-h-[85vh] w-full flex flex-col items-center justify-center pt-16 pb-32">
        <div className="absolute inset-0 z-0 bg-slate-900 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=2000" 
            alt="Crianças no campo de férias" 
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-slate-50/10"></div>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6 flex flex-col items-center mt-8">
          <div className="text-center mb-10 md:mb-14 w-full">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight drop-shadow-lg">
              {dict.home.titulo}
            </h1>
            <p className="mt-4 md:mt-6 text-lg md:text-2xl font-medium text-slate-200 tracking-wide leading-relaxed max-w-3xl mx-auto drop-shadow-md">
              {dict.home.subtitulo}
            </p>
          </div>

          <div id="pesquisa" className="relative w-full bg-white rounded-3xl shadow-2xl p-6 md:p-10 border border-slate-100 scroll-mt-24">
            <form action={`/${lang}/pesquisa`} method="GET" className="relative pb-10 md:pb-4 mt-2">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-black text-slate-900 uppercase tracking-widest hidden sm:block">
                  {isEn ? 'Find your next adventure' : 'Encontre a próxima aventura'}
                </span>
                <Link href={`/${lang}/mapa`} className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 hover:text-slate-900 px-4 py-2 rounded-lg text-xs font-bold no-underline hover:bg-slate-200 transition-colors ml-auto shadow-sm">
                  <span>🗺️</span> {dict.home.ver_mapa}
                </Link>
              </div>

              <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-lg">🔍</span>
                </div>
                <input
                  type="text"
                  name="q"
                  placeholder={isEn ? "What are you looking for? (e.g. Surf in Ericeira, Tech Camp...)" : "O que procura? (ex: Ténis no Porto, Surf na Caparica...)"}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-base font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{isEn ? 'Country' : 'País'}</label>
                  <select name="pais" className="w-full appearance-none rounded-xl bg-slate-50 px-4 py-3.5 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-slate-900 cursor-pointer transition-all">
                    <option value="">{isEn ? 'All Countries' : 'Todos'}</option>
                    {paisesOpcoes.map((p) => <option key={p.valor} value={p.valor}>{p.label}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{dict.home.distrito}</label>
                  <select name="distrito" className="w-full appearance-none rounded-xl bg-slate-50 px-4 py-3.5 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-slate-900 cursor-pointer transition-all">
                    <option value="">{dict.home.todos_distritos}</option>
                    {distritosOpcoes.map((d) => <option key={d.valor} value={d.valor}>{d.label}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{dict.home.categoria}</label>
                  <select name="categoria" className="w-full appearance-none rounded-xl bg-slate-50 px-4 py-3.5 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-slate-900 cursor-pointer transition-all">
                    <option value="">{dict.home.todas_categorias}</option>
                    {categoriasOpcoes.map((cat) => <option key={cat.valor} value={cat.valor}>{cat.label}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{dict.home.faixa_etaria}</label>
                  <select name="idade" className="w-full appearance-none rounded-xl bg-slate-50 px-4 py-3.5 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-slate-900 cursor-pointer transition-all">
                    <option value="">{dict.home.todas_idades}</option>
                    {idadesOpcoes.map((faixa) => <option key={faixa.valor} value={faixa.valor}>{faixa.label}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{isEn ? 'Start Date' : 'Data de Início'}</label>
                  <input
                    type="date"
                    name="data"
                    min={todayISO}
                    className="w-full appearance-none rounded-xl bg-slate-50 px-4 py-3 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-slate-900 cursor-pointer transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-center mt-8 md:absolute md:-bottom-[4rem] md:left-1/2 md:-translate-x-1/2">
                <button type="submit" className="group w-full md:w-64 bg-[#e2a41d] hover:bg-[#d4991b] rounded-xl md:rounded-full flex items-center justify-center gap-3 py-4 md:py-5 shadow-xl shadow-[#e2a41d]/40 transition-all hover:-translate-y-1">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <span className="text-white text-sm font-black uppercase tracking-widest">{dict.home.pesquisar}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* DESTAQUES B2C */}
      {camposDeFerias && camposDeFerias.length > 0 && (
        <section className="bg-white py-20 md:py-32 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{dict.home.destaques_titulo}</h2>
                <p className="mt-2 text-base text-slate-500 font-medium">{dict.home.destaques_subtitulo}</p>
              </div>
              <Link href={`/${lang}/pesquisa`} className="text-slate-600 font-black hover:text-slate-900 transition-colors whitespace-nowrap">
                {isEn ? 'View all programs' : 'Ver todos os programas'} &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {camposDeFerias.map((campo, index) => {
                const campoId = campo.id ?? index + 1;
                const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
                const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
                const localCampo = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
                
                let precoVisivel = campo.preco || 0;
                if (!precoVisivel && campo.pacotes?.length > 0) {
                  const todosPrecos = campo.pacotes.flatMap((p: any) => p.variantes?.map((v: any) => v.preco) || []);
                  if (todosPrecos.length > 0) precoVisivel = Math.min(...todosPrecos);
                }

                return (
                  <div key={campoId} className="group flex flex-col bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                    <div className="relative h-60 w-full bg-slate-100 overflow-hidden">
                      <Link href={`/${lang}/campo/${campoId}`} className="absolute inset-0 z-10">
                        <span className="sr-only">Ver {nomeCampo}</span>
                      </Link>
                      <img 
                        src={campo.imagem || '/og-image.jpg'} 
                        alt={nomeCampo} 
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-900 rounded-lg z-0">
                        {catCampo}
                      </div>
                      <div className="absolute top-4 right-4 z-20">
                        <BotaoFavorito campoId={campoId} />
                      </div>
                    </div>
                    
                    <div className="flex flex-col p-6 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        {localCampo}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 line-clamp-2">{nomeCampo}</h3>
                      
                      <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{isEn ? 'Prices from' : 'Preços desde'}</p>
                          <p className="text-2xl font-black text-slate-900 m-0">{precoVisivel > 0 ? `${precoVisivel}€` : '--'}</p>
                        </div>
                        <Link href={`/${lang}/campo/${campoId}`} className="bg-slate-900 text-white group-hover:bg-slate-800 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-md">
                          {isEn ? 'View Dates' : 'Ver Datas'}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* NAVEGAÇÃO POR DISTRITOS E PAÍSES */}
      {distritosAtivosCards.length > 0 && (
        <section className="bg-slate-50 py-20 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{dict.home.descubra_regiao_titulo}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {distritosAtivosCards.map((distrito) => {
                const nomeDistrito = isEn ? distrito.nome_en : distrito.nome;
                return (
                  <Link href={`/${lang}/distrito/${encodeURIComponent(distrito.nome)}`} key={distrito.nome} className="group relative block h-[180px] w-full overflow-hidden rounded-2xl bg-slate-900">
                    <img 
                      src={distrito.imagem} 
                      alt={nomeDistrito} 
                      loading="lazy" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-80" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-lg">{nomeDistrito}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* PAÍSES */}
      {paisesAtivosCards.length > 0 && (
        <section className="bg-white py-20 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{isEn ? 'Discover by Country' : 'Descubra por País'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paisesAtivosCards.map((pais) => {
                const nomePais = isEn ? pais.nome_en : pais.nome;
                return (
                  <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(pais.nome)}`} key={pais.nome} className="group relative block h-[220px] w-full overflow-hidden rounded-2xl bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <img 
                      src={pais.imagem} 
                      alt={nomePais} 
                      loading="lazy" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-80" 
                    />
                    <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                      <h3 className="text-2xl font-black text-white tracking-tight">{nomePais}</h3>
                      <p className="mt-1 text-sm font-bold text-[#EBA914]">{isEn ? pais.desc_en : pais.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* BLOCO SEO PROGRAMÁTICO (PESQUISAS POPULARES)*/}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-slate-50 py-16 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 text-center">
            {isEn ? 'Popular Searches' : 'Pesquisas Frequentes'}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {LINKS_SEO_PROGRAMATICOS.map((link) => (
              <Link 
                key={link.url} 
                href={`/${lang}/${link.url}`} 
                className="bg-white border border-slate-200 hover:border-emerald-600 text-slate-600 hover:text-emerald-700 text-xs font-bold px-4 py-2 rounded-full transition-colors"
              >
                {isEn ? link.en : link.pt}
              </Link>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
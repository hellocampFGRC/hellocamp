import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Metadata } from "next";
import { getDictionary } from "@/lib/getDictionary";
import BotaoFavorito from "./components/BotaoFavorito";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isEn = lang === "en";

  return {
    title: isEn
      ? "HelloCamp | Find the Best Summer Camps & Youth Programs"
      : "HelloCamp | Os Melhores Campos de Férias",
    description: isEn
      ? "Discover and book unforgettable holiday camps, sports programs, and creative workshops for children and teens."
      : "Explora, aprende e cresce num só lugar. Encontra os melhores campos de férias, colónias desportivas e atividades para os teus filhos.",
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isEn = lang === "en";
  const dict = await getDictionary(lang as "pt" | "en");

  const todayISO = new Date().toISOString().split("T")[0];

  // 1. Buscar todos os campos ativos e aprovados para verificar quais distritos e países têm atividade real
  const { data: todosCamposAtivos } = await supabase
    .from("campos")
    .select("id, nome, categoria, categoria_en, Distrito, local, pais, pais_en, preco, imagem, pacotes, ativo, status_aprovacao")
    .eq("ativo", true);

  const camposValidos = todosCamposAtivos || [];

  // 2. Extrair dinamicamente quais distritos e países têm campos ativos no momento
  const distritosComCampos = new Set(
    camposValidos.map((c: any) => (c.Distrito || c.local || "").toLowerCase().trim()).filter(Boolean)
  );

  const paisesComCampos = new Set(
    camposValidos.map((c: any) => (c.pais || "portugal").toLowerCase().trim()).filter(Boolean)
  );

  // Filtrar apenas os 6 primeiros para o destaque principal
  const camposDeFerias = camposValidos.slice(0, 6);

  const paisesOpcoes = [
    { valor: "Portugal", label: "Portugal" },
    { valor: "Espanha", label: "Espanha" },
    { valor: "Reino Unido", label: "Reino Unido" },
  ];

  const distritosOpcoes = [
    { valor: "Lisboa", label: "Lisboa" },
    { valor: "Porto", label: "Porto" },
    { valor: "Faro", label: "Faro (Algarve)" },
    { valor: "Coimbra", label: "Coimbra" },
    { valor: "Braga", label: "Braga" },
    { valor: "Setúbal", label: "Setúbal" },
  ];

  const categoriasOpcoes = [
    { valor: "Desporto", label: isEn ? "Sports" : "Desporto" },
    { valor: "Aventura & Natureza", label: isEn ? "Adventure & Nature" : "Aventura & Natureza" },
    { valor: "Surf", label: "Surf & Náutica" },
    { valor: "Tecnologia & Ciência", label: isEn ? "Tech & Science" : "Tecnologia & Ciência" },
    { valor: "Artes & Criatividade", label: isEn ? "Arts & Creativity" : "Artes & Criatividade" },
    { valor: "Línguas", label: isEn ? "Languages" : "Línguas" },
  ];

  const idadesOpcoes = [
    { valor: "3-6", label: isEn ? "3 to 6 years" : "3 a 6 anos" },
    { valor: "7-12", label: isEn ? "7 to 12 years" : "7 a 12 anos" },
    { valor: "13-18", label: isEn ? "13 to 18 years" : "13 a 18 anos" },
  ];

  // Listas base de distritos/regiões
  const todosDistritosCards = [
    { nome: "Lisboa", nome_en: "Lisbon", imagem: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&q=80&w=1200" },
    { nome: "Porto", nome_en: "Porto", imagem: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=1200" },
    { nome: "Faro", nome_en: "Faro", imagem: "https://images.unsplash.com/photo-1533556019545-21d7b322a46c?auto=format&fit=crop&q=80&w=1200" },
    { nome: "Braga", nome_en: "Braga", imagem: "https://images.unsplash.com/photo-1563806229-37330eb02d33?auto=format&fit=crop&q=80&w=1200" },
  ];

  // Filtrar APENAS distritos que têm campos ativos neste momento
  const distritosAtivosCards = todosDistritosCards.filter(d => 
    distritosComCampos.has(d.nome.toLowerCase().trim())
  );

  // Listas base de países
  const todosPaisesCards = [
    { nome: "Portugal", nome_en: "Portugal", imagem: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=800", desc: "Aventura e Sol", desc_en: "Adventure and Sun" },
    { nome: "Espanha", nome_en: "Spain", imagem: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&q=80&w=800", desc: "Cultura e Diversão", desc_en: "Culture and Fun" },
    { nome: "Reino Unido", nome_en: "United Kingdom", imagem: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800", desc: "Inglês Nativo", desc_en: "Native English" },
  ];

  // Filtrar APENAS países que têm campos ativos neste momento
  const paisesAtivosCards = todosPaisesCards.filter(p => 
    paisesComCampos.has(p.nome.toLowerCase().trim())
  );

  const LINKS_SEO_PROGRAMATICOS = [
    { url: "pesquisa?categoria=Surf", pt: "Campos de Surf em Portugal", en: "Surf Camps in Portugal" },
    { url: "pesquisa?categoria=Futebol", pt: "Campos de Futebol", en: "Football Camps" },
    { url: "pesquisa?distrito=Lisboa", pt: "Campos de Férias em Lisboa", en: "Summer Camps in Lisbon" },
    { url: "pesquisa?distrito=Porto", pt: "Campos de Férias no Porto", en: "Summer Camps in Porto" },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      
      {/* HERO SECTION COM IMAGEM DE CAPA GRANDE */}
      <section className="relative min-h-[85vh] w-full flex flex-col items-center justify-center pt-16 pb-32">
        <div className="absolute inset-0 z-0 bg-[#0F172A] overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=2000" 
            alt="Crianças no campo de férias" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/60 via-transparent to-[#F8FAFC]/20"></div>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6 flex flex-col items-center mt-8">
          
          <div className="text-center mb-10 md:mb-14 w-full">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-md text-xs font-black uppercase tracking-widest text-[#F59E0B] mb-6 backdrop-blur-md shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-pulse" />
              {isEn ? "More than a holiday camp" : "Mais que um campo de férias"}[cite: 1]
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight drop-shadow-lg">
              {isEn ? "Camps that create great stories." : "Campos que criam grandes histórias."}[cite: 2]
            </h1>
            <p className="mt-4 md:mt-6 text-lg md:text-2xl font-medium text-slate-200 tracking-wide leading-relaxed max-w-3xl mx-auto drop-shadow-md">
              {isEn ? "Explore, learn, and grow in one place." : "Explora, aprende e cresce num só lugar."}[cite: 2]
            </p>
          </div>

          {/* CAIXA DE PESQUISA AVANÇADA */}
          <div id="pesquisa" className="relative w-full bg-white rounded-md shadow-2xl p-6 md:p-10 border border-slate-100 scroll-mt-24">
            <form action={`/${lang}/pesquisa`} method="GET" className="relative pb-10 md:pb-4 mt-2">
              <div className="flex justify-between items-end mb-4">
                <span className="text-xs font-black text-[#0F172A] uppercase tracking-widest hidden sm:block">
                  {isEn ? 'Find your next adventure' : 'Encontra a próxima aventura'}
                </span>
                
                <Link 
                  href={`/${lang}/mapa`} 
                  className="inline-flex items-center gap-2 bg-[#F8FAFC] text-[#2563EB] hover:bg-blue-50 px-4 py-2 rounded-md text-xs font-black no-underline transition-colors ml-auto shadow-sm border border-slate-200"
                >
                  <span>🗺️</span> {isEn ? "Interactive Map" : "Ver no Mapa"}
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
                  className="w-full pl-12 pr-4 py-4 rounded-md bg-[#F8FAFC] border border-slate-200 text-[#0F172A] text-base font-bold outline-none focus:bg-white focus:border-[#2563EB] transition-all placeholder:text-slate-400 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isEn ? 'Country' : 'País'}</label>
                  <select name="pais" className="w-full appearance-none rounded-md bg-[#F8FAFC] px-4 py-3.5 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-[#2563EB] cursor-pointer transition-all shadow-sm">
                    <option value="">{isEn ? 'All Countries' : 'Todos'}</option>
                    {paisesOpcoes.map((p) => <option key={p.valor} value={p.valor}>{p.label}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isEn ? "District" : "Distrito"}</label>
                  <select name="distrito" className="w-full appearance-none rounded-md bg-[#F8FAFC] px-4 py-3.5 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-[#2563EB] cursor-pointer transition-all shadow-sm">
                    <option value="">{isEn ? "All Districts" : "Todos os Distritos"}</option>
                    {distritosOpcoes.map((d) => <option key={d.valor} value={d.valor}>{d.label}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isEn ? "Category" : "Categoria"}</label>
                  <select name="categoria" className="w-full appearance-none rounded-md bg-[#F8FAFC] px-4 py-3.5 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-[#2563EB] cursor-pointer transition-all shadow-sm">
                    <option value="">{isEn ? "All Categories" : "Todas as Categorias"}</option>
                    {categoriasOpcoes.map((cat) => <option key={cat.valor} value={cat.valor}>{cat.label}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isEn ? "Ages" : "Faixa Etária"}</label>
                  <select name="idade" className="w-full appearance-none rounded-md bg-[#F8FAFC] px-4 py-3.5 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-[#2563EB] cursor-pointer transition-all shadow-sm">
                    <option value="">{isEn ? "All Ages" : "Todas as Idades"}</option>
                    {idadesOpcoes.map((faixa) => <option key={faixa.valor} value={faixa.valor}>{faixa.label}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{isEn ? 'Start Date' : 'Data de Início'}</label>
                  <input
                    type="date"
                    name="data"
                    min={todayISO}
                    className="w-full appearance-none rounded-md bg-[#F8FAFC] px-4 py-3 text-slate-700 text-sm font-bold outline-none border border-slate-200 focus:bg-white focus:border-[#2563EB] cursor-pointer transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex justify-center mt-8 md:absolute md:-bottom-[4rem] md:left-1/2 md:-translate-x-1/2">
                <button type="submit" className="group w-full md:w-64 bg-[#F59E0B] hover:bg-amber-500 rounded-md flex items-center justify-center gap-3 py-4 md:py-5 shadow-xl shadow-amber-500/30 transition-all hover:-translate-y-1 cursor-pointer border-0">
                  <svg className="w-5 h-5 text-[#0F172A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <span className="text-[#0F172A] text-xs font-black uppercase tracking-widest">{isEn ? "Search Camps" : "Pesquisar Campos"}</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </section>

      {/* DESTAQUES B2C */}
      {camposDeFerias && camposDeFerias.length > 0 && (
        <section className="bg-white py-20 md:py-32 border-t border-slate-200/80">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
              <div>
                <span className="text-xs font-black text-[#2563EB] uppercase tracking-widest block mb-2">
                  {isEn ? "Handpicked for you" : "Seleção em Destaque"}
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight">{isEn ? "Featured Camps" : "Próximos Campos de Férias"}</h2>
              </div>
              <Link href={`/${lang}/pesquisa`} className="text-sm font-black text-[#2563EB] hover:underline flex items-center gap-1 no-underline">
                {isEn ? 'View all programs' : 'Ver todos os campos'} &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {camposDeFerias.map((campo: any, index: number) => {
                const campoId = campo.id ?? index + 1;
                const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
                const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
                const localCampo = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
                
                let precoVisivel = campo.preco || 0;
                let pacotesArray = [];
                if (typeof campo.pacotes === 'string') {
                  try { pacotesArray = JSON.parse(campo.pacotes); } catch(e) { pacotesArray = []; }
                } else if (Array.isArray(campo.pacotes)) {
                  pacotesArray = campo.pacotes;
                }

                if (!precoVisivel && pacotesArray.length > 0) {
                  const todosPrecos = pacotesArray.flatMap((p: any) => p.variantes?.map((v: any) => Number(v.preco) || 0) || []);
                  if (todosPrecos.length > 0) precoVisivel = Math.min(...todosPrecos);
                }

                const imgUrl = campo.imagem?.startsWith('http') ? campo.imagem : '/og-image.jpg';

                return (
                  <div key={campoId} className="group flex flex-col bg-white border border-slate-200/80 rounded-md shadow-sm hover:shadow-xl hover:border-[#2563EB] transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
                    <Link href={`/${lang}/campo/${campoId}`} className="absolute inset-0 z-10">
                      <span className="sr-only">Ver {nomeCampo}</span>
                    </Link>
                    
                    <div className="absolute top-4 right-4 z-20">
                      <BotaoFavorito campoId={campoId} />
                    </div>

                    <div className="relative h-60 w-full bg-slate-100 overflow-hidden">
                      <img 
                        src={imgUrl} 
                        alt={nomeCampo} 
                        loading="lazy" 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#0F172A] rounded-md shadow-sm z-0">
                        {catCampo}
                      </div>
                    </div>
                    
                    <div className="flex flex-col p-6 flex-1 pointer-events-none">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                        <span>📍 {localCampo}</span>
                      </div>
                      <h3 className="text-xl font-black text-[#0F172A] leading-tight mb-4 line-clamp-2">{nomeCampo}</h3>
                      
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{isEn ? 'Prices from' : 'Desde'}</p>
                          <p className="text-2xl font-black text-[#2563EB] m-0">{precoVisivel > 0 ? `${precoVisivel}€` : 'Sob Consulta'}</p>
                        </div>
                        <span className="bg-[#0F172A] group-hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-md text-xs font-black uppercase tracking-widest transition-colors shadow-sm">
                          {isEn ? 'View Dates' : 'Ver Detalhes'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* NAVEGAÇÃO POR DISTRITOS E REGIÕES (APENAS COM CAMPOS ATIVOS) */}
      {distritosAtivosCards.length > 0 && (
        <section className="bg-white py-20 border-t border-slate-200/80">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-black text-[#2563EB] uppercase tracking-widest block mb-2">
                {isEn ? "Explore by region" : "Explorar por Região"}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight">{isEn ? "Discover by District" : "Descubra os Melhores Destinos"}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {distritosAtivosCards.map((distrito) => {
                const nomeDistrito = isEn ? distrito.nome_en : distrito.nome;
                return (
                  <Link href={`/${lang}/distrito/${encodeURIComponent(distrito.nome)}`} key={distrito.nome} className="group relative block h-[220px] w-full overflow-hidden rounded-md bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 no-underline">
                    <img 
                      src={distrito.imagem} 
                      alt={nomeDistrito} 
                      loading="lazy" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-90" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-6 bg-gradient-to-t from-black/60 to-transparent">
                      <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md">{nomeDistrito}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* PAÍSES (APENAS COM CAMPOS ATIVOS) */}
      {paisesAtivosCards.length > 0 && (
        <section className="bg-[#F8FAFC] py-20 border-t border-slate-200/80">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-black text-[#16A34A] uppercase tracking-widest block mb-2">
                {isEn ? "International Programs" : "Programas Internacionais"}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight">{isEn ? 'Discover by Country' : 'Descubra por País'}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {paisesAtivosCards.map((pais) => {
                const nomePais = isEn ? pais.nome_en : pais.nome;
                return (
                  <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(pais.nome)}`} key={pais.nome} className="group relative block h-[240px] w-full overflow-hidden rounded-md bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline">
                    <img 
                      src={pais.imagem} 
                      alt={nomePais} 
                      loading="lazy" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-90" 
                    />
                    <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                      <h3 className="text-2xl font-black text-white tracking-tight">{nomePais}</h3>
                      <p className="mt-1 text-sm font-bold text-[#F59E0B]">{isEn ? pais.desc_en : pais.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* BLOCO SEO PROGRAMÁTICO */}
      <section className="bg-white py-16 border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 text-center">
            {isEn ? 'Popular Searches' : 'Pesquisas Frequentes'}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {LINKS_SEO_PROGRAMATICOS.map((link) => (
              <Link 
                key={link.url} 
                href={`/${lang}/${link.url}`} 
                className="bg-[#F8FAFC] border border-slate-200 hover:border-[#2563EB] text-slate-600 hover:text-[#2563EB] text-xs font-bold px-5 py-2.5 rounded-md transition-colors no-underline"
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
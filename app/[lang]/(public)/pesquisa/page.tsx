import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../components/BotaoFavorito";
import { unstable_cache } from "next/cache";

export const dynamic = 'force-dynamic';

const escapeOr = (str: string) => str.replace(/[,()]/g, ' ').trim();

// ═══════════════════════════════════════════
// CACHE DE DADOS (24 HORAS) - ZERO EGRESS
// ═══════════════════════════════════════════
const getCamposCacheados = unstable_cache(
  async () => {
    const { data } = await supabase
      .from("campos")
      .select("*")
      .not("contrato_parceiro_url", "is", null)
      .order("nome");
    return data || [];
  },
  ['cache-pesquisa-campos'],
  { revalidate: 86400 } // 24 horas
);

// ==========================================
// COMPONENTE SERVIDOR DE ALTA PERFORMANCE
// ==========================================
export default async function PaginaPesquisa({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { lang } = await params;
  const isEn = lang === 'en';
  const resolvedSearchParams = await searchParams;

  const qParam = (resolvedSearchParams.q as string) || "";
  const catParam = (resolvedSearchParams.categoria as string) || "";
  const distParam = (resolvedSearchParams.distrito as string) || "";
  const idadeParam = (resolvedSearchParams.idade as string) || "";
  const paisParam = (resolvedSearchParams.pais as string) || "";
  const dataParam = (resolvedSearchParams.data as string) || "";

  const mostrarDistritos = paisParam === "" || paisParam === "Portugal";
  const filtrosAtivos = !!(qParam || catParam || distParam || idadeParam || paisParam || dataParam);

  const todosOsCampos = await getCamposCacheados();

  const catSet = new Set<string>();
  const idadeSet = new Set<string>();
  
  todosOsCampos.forEach(c => {
    if (c.categoria?.trim()) catSet.add(c.categoria.trim());
    if (c.idade?.trim()) idadeSet.add(c.idade.trim());
  });
  
  const categoriasDisponiveis = Array.from(catSet).sort();
  const idadesDisponiveis = Array.from(idadeSet).sort();

  let resultados = todosOsCampos;

  if (qParam) {
    const termos = escapeOr(qParam).toLowerCase().split(/\s+/).filter(Boolean);
    resultados = resultados.filter(campo => {
      const textoBuscavel = `${campo.nome || ''} ${campo.descricao || ''} ${campo.categoria || ''} ${campo.local || ''} ${campo.Distrito || ''} ${campo.nome_en || ''} ${campo.descricao_en || ''}`.toLowerCase();
      return termos.every(termo => textoBuscavel.includes(termo));
    });
  }

  if (catParam) {
    resultados = resultados.filter(c => c.categoria === catParam);
  }
  
  if (distParam && mostrarDistritos) {
    resultados = resultados.filter(c => (c.Distrito || '').toLowerCase().includes(escapeOr(distParam).toLowerCase()));
  }
  
  if (idadeParam) {
    resultados = resultados.filter(c => c.idade === idadeParam);
  }
  
  if (paisParam) {
    resultados = resultados.filter(c => {
      const p1 = (c.pais || '').toLowerCase();
      const p2 = (c.pais_en || '').toLowerCase();
      const termo = escapeOr(paisParam).toLowerCase();
      return p1.includes(termo) || p2.includes(termo);
    });
  }
  
  if (dataParam) {
    resultados = resultados.filter(c => {
      if (!c.data_inicio) return false;
      return new Date(c.data_inicio) >= new Date(dataParam);
    });
  }

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];
  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* BARRA DE PESQUISA SUPERIOR */}
      <section className="bg-white border-b border-slate-200 pt-8 pb-10 px-4 md:px-6 shadow-sm">
        <div className="max-w-[1100px] mx-auto">
          <nav className="flex items-center gap-2 text-xs font-black text-slate-400 mb-6 tracking-widest uppercase">
            <Link href={`/${lang}`} className="hover:text-[#0E3A68] transition-colors">{isEn ? 'Home' : 'Início'}</Link>
            <span>/</span>
            <span className="text-slate-900">{isEn ? 'Search' : 'Pesquisa'}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 tracking-tight">
            {filtrosAtivos ? (isEn ? 'Search Results' : 'Resultados da Pesquisa') : (isEn ? 'Explore All Camps' : 'Explorar Todos os Campos')}
          </h1>

          <form method="GET" action={`/${lang}/pesquisa`} className="flex flex-col gap-5">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <input
                type="text"
                name="q"
                defaultValue={qParam}
                placeholder={isEn ? "Search by name, sport, or location (e.g., Surf in Porto)..." : "Pesquise por nome, desporto ou local (ex: Surf no Porto)..."}
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-base font-medium text-slate-900 outline-none focus:border-[#0E3A68] focus:ring-4 focus:ring-[#0E3A68]/10 transition-all shadow-[0_4px_20px_rgb(0,0,0,0.03)] placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? 'Country' : 'País'}</label>
                <select name="pais" defaultValue={paisParam} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0E3A68] cursor-pointer">
                  <option value="">{isEn ? 'All Countries' : 'Todos'}</option>
                  <option value="Portugal">Portugal</option>
                  <option value="Espanha">{isEn ? 'Spain' : 'Espanha'}</option>
                  <option value="Reino Unido">{isEn ? 'UK' : 'Reino Unido'}</option>
                  <option value="França">{isEn ? 'France' : 'França'}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? 'Category' : 'Categoria'}</label>
                <select name="categoria" defaultValue={catParam} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0E3A68] cursor-pointer">
                  <option value="">{isEn ? 'All Categories' : 'Todas'}</option>
                  {categoriasDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {mostrarDistritos && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Distrito</label>
                  <select name="distrito" defaultValue={distParam} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0E3A68] cursor-pointer">
                    <option value="">{isEn ? 'All Districts' : 'Todos'}</option>
                    {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? 'Age Group' : 'Idade'}</label>
                <select name="idade" defaultValue={idadeParam} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0E3A68] cursor-pointer">
                  <option value="">{isEn ? 'All Ages' : 'Todas'}</option>
                  {idadesDisponiveis.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{isEn ? 'Start Date' : 'Data Início'}</label>
                <input
                  type="date"
                  name="data"
                  defaultValue={dataParam}
                  min={todayISO}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#0E3A68] cursor-pointer"
                />
              </div>

              <button type="submit" className="w-full py-3.5 bg-[#e2a41d] hover:bg-[#d4991b] text-[#0E3A68] font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-md mt-auto">
                {isEn ? 'Search' : 'Pesquisar'}
              </button>
            </div>

            {filtrosAtivos && (
              <div className="text-right mt-2">
                <Link href={`/${lang}/pesquisa`} className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 inline-block">
                  ✕ {isEn ? 'Clear filters' : 'Limpar filtros'}
                </Link>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* GRID DE RESULTADOS OTIMIZADA PARA CONVERSÃO */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-[1100px] mx-auto px-4 py-12 md:py-16">
        {(!resultados || resultados.length === 0) ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center gap-4 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl border border-slate-100 mb-2">🏕️</div>
            <h3 className="text-2xl font-black text-slate-900">{isEn ? 'No camps found' : 'Nenhum programa encontrado'}</h3>
            <p className="text-base text-slate-500 font-medium">
              {isEn ? 'Try adjusting your filters, selecting a different date, or searching for something more generic.' : 'Não encontrámos resultados exatos. Tente remover o filtro da data ou pesquisar de forma mais genérica (Ex: Futebol).'}
            </p>
            <Link href={`/${lang}/pesquisa`} className="mt-4 bg-[#0E3A68] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#0b2b4d] transition-colors shadow-lg">
              {isEn ? 'Clear all filters' : 'Ver todos os programas'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {resultados.map((campo) => {
              const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
              const localCampo = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
              const idadeCampo = isEn && campo.idade_en ? campo.idade_en : campo.idade;

              let precoVisivel = campo.preco || 0;
              if (!precoVisivel && campo.pacotes?.length > 0) {
                const todosPrecos = campo.pacotes.flatMap((p: any) => p.variantes?.map((v: any) => v.preco) || []);
                if (todosPrecos.length > 0) precoVisivel = Math.min(...todosPrecos);
              }

              return (
                <div key={campo.id} className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-slate-200 relative shadow-sm hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
                  <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">Explorar {nomeCampo}</span></Link>
                  <div className="absolute top-4 right-4 z-20"><BotaoFavorito campoId={campo.id} /></div>
                  
                  {/* IMAGEM COM FALLBACK AUTOMÁTICO */}
                  <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                    <img 
                      src={campo.imagem || '/og-image.jpg'} 
                      alt={nomeCampo} 
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = '/og-image.jpg' }}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#0E3A68] rounded-lg z-0 shadow-sm">
                      {catCampo}
                    </div>
                  </div>

                  <div className="flex flex-col p-6 flex-1 pointer-events-none">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      <svg className="w-3 h-3 text-[#e2a41d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      {localCampo}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 line-clamp-2">{nomeCampo}</h3>
                    <p className="text-sm text-slate-500 font-medium mb-6">{isEn ? 'Ages:' : 'Idades:'} <span className="text-slate-900 font-bold">{idadeCampo}</span></p>
                    
                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{isEn ? 'From' : 'A partir de'}</p>
                        <p className="text-2xl font-black text-[#0E3A68] m-0">{precoVisivel > 0 ? `${precoVisivel}€` : '--'}</p>
                      </div>
                      <span className="bg-slate-100 text-[#0E3A68] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors group-hover:bg-[#0E3A68] group-hover:text-white shadow-sm">
                        {isEn ? 'View Dates' : 'Ver Datas'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
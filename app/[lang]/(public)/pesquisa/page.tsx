"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../components/BotaoFavorito";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import React from "react";

export default function PaginaPesquisa({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // CAPTURAR OS PARÂMETROS DO URL
  const qParam = searchParams.get("q") || "";
  const catParam = searchParams.get("categoria") || "";
  const distParam = searchParams.get("distrito") || "";
  const idadeParam = searchParams.get("idade") || "";
  const paisParam = searchParams.get("pais") || "";

  // ESTADOS DO UI
  const [qUI, setQUI] = useState(qParam);
  const [catUI, setCatUI] = useState(catParam);
  const [distUI, setDistUI] = useState(distParam);
  const [idadeUI, setIdadeUI] = useState(idadeParam);
  const [paisUI, setPaisUI] = useState(paisParam);
  
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mostrarDistritos = paisUI === "" || paisUI === "Portugal";
  const filtrosAtivos = qParam || catParam || distParam || idadeParam || paisParam;

  useEffect(() => {
    // Sincronizar UI com os parâmetros da URL
    setQUI(qParam);
    setCatUI(catParam);
    setDistUI(distParam);
    setIdadeUI(idadeParam);
    setPaisUI(paisParam);

    const fetchResultados = async () => {
      setLoading(true);
      let query = supabase.from("campos").select("*").not("contrato_parceiro_url", "is", null);

      if (qParam) {
        const termos = qParam.trim().split(/\s+/);
        const orConditions = termos.map(termo => 
          `nome.ilike.%${termo}%,descricao.ilike.%${termo}%,categoria.ilike.%${termo}%,local.ilike.%${termo}%,Distrito.ilike.%${termo}%,nome_en.ilike.%${termo}%,descricao_en.ilike.%${termo}%`
        ).join(',');
        query = query.or(orConditions);
      }

      if (catParam) query = query.eq("categoria", catParam);
      if (distParam && (paisParam === "" || paisParam === "Portugal")) query = query.ilike("Distrito", `%${distParam}%`);
      if (idadeParam) query = query.eq("idade", idadeParam);
      if (paisParam) query = query.or(`pais.ilike.%${paisParam}%,pais_en.ilike.%${paisParam}%`);

      const { data } = await query.order("nome");
      setResultados(data || []);
      setLoading(false);
    };
    
    fetchResultados();
  }, [qParam, catParam, distParam, idadeParam, paisParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (qUI) params.set("q", qUI);
    if (catUI) params.set("categoria", catUI);
    if (distUI && mostrarDistritos) params.set("distrito", distUI);
    if (idadeUI) params.set("idade", idadeUI);
    if (paisUI) params.set("pais", paisUI);
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setQUI("");
    setCatUI("");
    setDistUI("");
    setIdadeUI("");
    setPaisUI("");
    router.push(pathname);
  };

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];

  const baseUrl = "https://www.hellocamp.pt";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": isEn ? "Home" : "Início", "item": `${baseUrl}/${lang}` },
      { "@type": "ListItem", "position": 2, "name": isEn ? "Search" : "Pesquisa", "item": `${baseUrl}/${lang}/pesquisa` }
    ]
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* HEADER DA PESQUISA COM ESTILO REFINADO */}
      <section className="bg-white border-b border-slate-200 py-8 px-4 md:px-8 shadow-sm">
        <div className="max-w-6xl mx-auto">
          
          <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-6 tracking-widest uppercase">
            <Link href={`/${lang}`} className="hover:text-emerald-600 transition-colors">{isEn ? 'Home' : 'Início'}</Link>
            <span>/</span>
            <span className="text-slate-600">{isEn ? 'Search Directory' : 'Diretório de Pesquisa'}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 tracking-tight">
            {filtrosAtivos ? (isEn ? 'Search Results' : 'Resultados da Pesquisa') : (isEn ? 'Explore All Camps' : 'Explorar Campos')}
          </h1>
          
          {/* FORMULÁRIO DE FILTROS APRIMORADO */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 text-lg">🔍</span>
              </div>
              <input 
                type="text" 
                value={qUI}
                onChange={(e) => setQUI(e.target.value)}
                placeholder={isEn ? "Search by name, sport, or location (e.g., Surf in Porto)..." : "Pesquise por nome, desporto ou local (ex: Surf no Porto)..."} 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-medium text-slate-700 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-center">
              
              <div className="relative">
                <select value={paisUI} onChange={(e) => setPaisUI(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 appearance-none cursor-pointer transition-all shadow-sm">
                  <option value="">🌍 {isEn ? 'All Countries' : 'Todos os Países'}</option>
                  <option value="Portugal">🇵🇹 Portugal</option>
                  <option value="Espanha">🇪🇸 {isEn ? 'Spain' : 'Espanha'}</option>
                  <option value="Reino Unido">🇬🇧 {isEn ? 'UK' : 'Reino Unido'}</option>
                  <option value="França">🇫🇷 {isEn ? 'France' : 'França'}</option>
                  <option value="Suíça">🇨🇭 {isEn ? 'Switzerland' : 'Suíça'}</option>
                  <option value="Itália">🇮🇹 {isEn ? 'Italy' : 'Itália'}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">▼</div>
              </div>

              <div className="relative">
                <select value={catUI} onChange={(e) => setCatUI(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 appearance-none cursor-pointer transition-all shadow-sm">
                  <option value="">🎯 {isEn ? 'All Categories' : 'Todas as Categorias'}</option>
                  <option value="Desporto">{isEn ? 'Sports' : 'Desporto'}</option>
                  <option value="Aventura & Natureza">{isEn ? 'Adventure' : 'Aventura & Natureza'}</option>
                  <option value="Tecnologia & Ciência">{isEn ? 'Tech' : 'Tecnologia & Ciência'}</option>
                  <option value="Artes & Criatividade">{isEn ? 'Arts' : 'Artes & Criatividade'}</option>
                  <option value="Línguas">{isEn ? 'Languages' : 'Línguas'}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">▼</div>
              </div>

              {mostrarDistritos && (
                <div className="relative">
                  <select value={distUI} onChange={(e) => setDistUI(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 appearance-none cursor-pointer transition-all shadow-sm">
                    <option value="">📍 {isEn ? 'All Districts' : 'Todos os Distritos'}</option>
                    {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">▼</div>
                </div>
              )}

              <div className="relative">
                <select value={idadeUI} onChange={(e) => setIdadeUI(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 appearance-none cursor-pointer transition-all shadow-sm">
                  <option value="">🧒 {isEn ? 'All Ages' : 'Todas as Idades'}</option>
                  <option value="6-9 anos">6-9 {isEn ? 'years' : 'anos'}</option>
                  <option value="10-13 anos">10-13 {isEn ? 'years' : 'anos'}</option>
                  <option value="14-17 anos">14-17 {isEn ? 'years' : 'anos'}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">▼</div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-slate-800 hover:-translate-y-0.5 transition-all shadow-md cursor-pointer h-full">
                {isEn ? 'Search' : 'Pesquisar'}
              </button>
              
              {filtrosAtivos && (
                <button type="button" onClick={clearFilters} className="w-full py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all h-full">
                  {isEn ? 'Clear' : 'Limpar'}
                </button>
              )}
            </div>
          </form>

        </div>
      </section>

      {/* RESULTADOS */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
             <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{isEn ? 'Loading...' : 'A pesquisar...'}</p>
           </div>
        ) : (!resultados || resultados.length === 0) ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center gap-6 max-w-2xl mx-auto">
            <span className="text-5xl">🏕️</span>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{isEn ? 'No camps found' : 'Nenhum campo encontrado'}</h3>
            <p className="text-base text-slate-500 font-medium leading-relaxed">
              {isEn ? 'Try adjusting your filters, selecting different dates, or searching for something else to see more results.' : 'Não encontrámos resultados para esta combinação exata. Tente pesquisar por uma palavra genérica ou limpe alguns filtros.'}
            </p>
            <button onClick={clearFilters} className="mt-2 bg-emerald-50 text-emerald-600 font-black px-6 py-3 rounded-xl hover:bg-emerald-100 transition-colors text-sm uppercase tracking-widest">
              {isEn ? 'Clear filters' : 'Limpar todos os filtros'}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {resultados.length} {resultados.length === 1 ? (isEn ? 'result found' : 'resultado encontrado') : (isEn ? 'results found' : 'resultados encontrados')}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {resultados.map((campo: any) => {
                const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
                const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
                const localCampo = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
                const idadeCampo = isEn && campo.idade_en ? campo.idade_en : campo.idade;

                let precoVisivel = campo.preco || 0;
                if (!precoVisivel && campo.pacotes && campo.pacotes.length > 0) {
                  const todosPrecos = campo.pacotes.flatMap((p: any) => 
                    p.variantes ? p.variantes.map((v: any) => v.preco) : []
                  );
                  if (todosPrecos.length > 0) {
                    precoVisivel = Math.min(...todosPrecos);
                  }
                }

                return (
                  <div key={campo.id} className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-200 relative shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
                    <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">Explorar {nomeCampo}</span></Link>
                    <div className="absolute top-4 right-4 z-20"><BotaoFavorito campoId={campo.id} /></div>

                    <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                      <img src={campo.imagem} alt={nomeCampo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-800 rounded-lg shadow-sm z-0">
                        {catCampo}
                      </div>
                    </div>

                    <div className="flex flex-col p-6 flex-1 pointer-events-none">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">📍 {localCampo}</span>
                      <h3 className="text-xl font-black text-slate-900 leading-tight mb-3 group-hover:text-emerald-600 transition-colors">{nomeCampo}</h3>
                      <p className="text-xs text-slate-500 font-medium mb-6 bg-slate-50 px-3 py-1.5 rounded-lg w-max border border-slate-100">
                         {isEn ? 'Ages:' : 'Idades:'} <span className="font-bold text-slate-700 ml-1">{idadeCampo}</span>
                      </p>
                      
                      <div className="mt-auto pt-4 flex items-end justify-between border-t border-slate-100">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{isEn ? 'Starting from' : 'A partir de'}</p>
                          <p className="text-2xl font-black text-emerald-600 leading-none">{precoVisivel > 0 ? `${precoVisivel}€` : '--'}</p>
                        </div>
                        <span className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center font-bold transition-transform group-hover:scale-110 group-hover:bg-[#EBA914] group-hover:text-white shadow-sm">&rarr;</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
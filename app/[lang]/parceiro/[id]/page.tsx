import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../../(public)/components/BotaoFavorito";
import { getDictionary } from "@/lib/getDictionary";
import { unstable_cache } from "next/cache";

export const dynamic = 'force-dynamic';

const getPerfilCache = unstable_cache(
  async (id: string) => {
    const { data } = await supabase.from('perfis').select('*').eq('id', id).single();
    return data;
  },
  ['cache-perfil-parceiro'],
  { revalidate: 86400 }
);

const getCamposDoParceiroCache = unstable_cache(
  async (organizadorId: string) => {
    const { data } = await supabase
      .from("campos")
      .select("*")
      .eq('organizador_id', organizadorId)
      .eq('ativo', true)
      .order('nome');
    return data || [];
  },
  ['cache-campos-parceiro'],
  { revalidate: 86400 }
);

export async function generateMetadata({
  params
}: {
  params: Promise<{ lang: string; id: string }>
}): Promise<Metadata> {
  const { lang, id } = await params;
  const isEn = lang === 'en';

  const parceiro = await getPerfilCache(id);

  if (!parceiro) {
    return { title: 'Parceiro não encontrado | HelloCamp' };
  }

  const nome = parceiro.empresa_nome || parceiro.nome_empresa || parceiro.nome_completo || 'Parceiro HelloCamp';
  const descricao = isEn ? parceiro.descricao_en : parceiro.descricao;
  const descCurta = descricao ? descricao.substring(0, 155) + '...' : `Explore os campos de férias organizados por ${nome}.`;

  return {
    title: `${nome} | HelloCamp`,
    description: descCurta,
    openGraph: {
      title: `${nome} | HelloCamp`,
      description: descCurta,
      images: parceiro.logotipo_url ? [parceiro.logotipo_url] : [],
    }
  };
}

export default async function PaginaParceiro({
  params
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang as "pt" | "en");
  const isEn = lang === 'en';

  const parceiro = await getPerfilCache(id);
  
  if (!parceiro) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-6 text-4xl">🏢</div>
        <h1 className="text-3xl font-black text-slate-900">{isEn ? 'Partner not found' : 'Organizador não encontrado'}</h1>
        <Link href={`/${lang}/pesquisa`} className="mt-6 bg-[#0E3A68] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0b2b4d] transition-colors shadow-md">
          {isEn ? 'Back to Search' : 'Voltar à Pesquisa'}
        </Link>
      </div>
    );
  }

  const campos = await getCamposDoParceiroCache(id);
  
  const nomeSeguro = parceiro.empresa_nome || parceiro.nome_empresa || parceiro.nome_completo || 'Parceiro HelloCamp';
  const descricao = isEn && parceiro.descricao_en ? parceiro.descricao_en : parceiro.descricao;

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 pt-10">
      
      {/* 1. CABEÇALHO DO PERFIL */}
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 mb-12">
        <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-8 tracking-widest uppercase">
          <Link href={`/${lang}`} className="hover:text-[#0E3A68] transition-colors">{isEn ? 'Home' : 'Início'}</Link>
          <span>/</span>
          <span className="text-slate-900">{nomeSeguro}</span>
        </nav>

        <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 md:gap-12 items-start">
          
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-slate-50 border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex-shrink-0 flex items-center justify-center p-6 mx-auto md:mx-0 overflow-hidden relative">
            {parceiro.logotipo_url ? (
               <img src={parceiro.logotipo_url} alt={nomeSeguro} className="w-full h-full object-contain" />
            ) : (
               <span className="text-5xl">🏢</span>
            )}
            {parceiro.parceiro_verificado && (
              <div className="absolute bottom-4 right-4 bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm" title={isEn ? "Verified Partner" : "Parceiro Verificado"}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3 border border-slate-200">
              {isEn ? 'Official Organizer' : 'Organizador Oficial'}
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
              {nomeSeguro}
            </h1>
            
            {descricao && (
              <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed max-w-3xl mb-6">
                {descricao}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-auto">
              {parceiro.website && (
                <a href={parceiro.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 transition-colors">
                  🌐 {isEn ? 'Visit Website' : 'Visitar Website'}
                </a>
              )}
              {parceiro.email_publico && (
                <a href={`mailto:${parceiro.email_publico}`} className="flex items-center gap-2 text-xs font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 transition-colors">
                  ✉️ {parceiro.email_publico}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. LISTAGEM DE CAMPOS DO PARCEIRO */}
      <div className="max-w-[1100px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900">
            {isEn ? `Camps by ${nomeSeguro}` : `Programas de ${nomeSeguro}`}
          </h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            {campos.length} {isEn ? 'Programs' : 'Programas'}
          </span>
        </div>

        {campos.length === 0 ? (
           <div className="bg-white border border-slate-200 border-dashed rounded-[2rem] p-12 text-center shadow-sm">
             <span className="text-4xl block mb-4">📭</span>
             <p className="text-slate-500 font-bold text-sm">{isEn ? 'No active programs at the moment.' : 'Este organizador não tem campos ativos no momento.'}</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {campos.map((campo) => {
              const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
              const localCampo = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
              
              let precoVisivel = campo.preco || 0;
              if (!precoVisivel && campo.pacotes?.length > 0) {
                const precos = campo.pacotes.flatMap((p: any) => p.variantes?.map((v: any) => v.preco) || []);
                if (precos.length > 0) precoVisivel = Math.min(...precos);
              }

              const imgUrl = campo.imagem?.startsWith('http') ? campo.imagem : '/og-image.jpg';

              return (
                <div key={campo.id} className="group flex flex-col bg-white rounded-[2rem] overflow-hidden border border-slate-200 relative shadow-sm hover:shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
                  <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">Ver {nomeCampo}</span></Link>
                  <div className="absolute top-4 right-4 z-20"><BotaoFavorito campoId={campo.id} /></div>
                  
                  <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    <div className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${imgUrl}')` }} />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#0E3A68] rounded-lg shadow-sm">
                      {catCampo}
                    </div>
                  </div>

                  <div className="flex flex-col p-6 flex-1 pointer-events-none">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      <svg className="w-3 h-3 text-[#e2a41d]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      {localCampo}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 line-clamp-2">{nomeCampo}</h3>
                    
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
      </div>
    </main>
  );
}
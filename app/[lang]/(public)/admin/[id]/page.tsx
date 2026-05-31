import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../../components/BotaoFavorito";

// 1. CHEF SEO PARA A PÁGINA DO ORGANIZADOR
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ lang: string; id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  const { data: organizador } = await supabase.from('perfis').select('nome_empresa').eq('id', id).single();
  
  if (!organizador) return { title: 'Organizador | HelloCamp' };
  return { title: `${organizador.nome_empresa || 'Parceiro'} | HelloCamp` };
}

export default async function PerfilOrganizador({ 
  params 
}: { 
  params: Promise<{ lang: string; id: string }> 
}) {
  const { lang, id } = await params;
  const isEn = lang === 'en';

  // 2. Busca dos Dados do Parceiro e os Seus Campos
  const { data: organizador } = await supabase.from("perfis").select("*").eq("id", id).single();
  const { data: campos } = await supabase.from("campos").select("*").eq("organizador_id", id).not('contrato_parceiro_url', 'is', null).order('created_at', { ascending: false });

  if (!organizador) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans">
        <h1 className="text-3xl font-black text-slate-900">{isEn ? 'Partner not found' : 'Parceiro não encontrado'}</h1>
        <Link href={`/${lang}`} className="mt-6 font-bold text-emerald-600">&larr; {isEn ? 'Back to home' : 'Voltar ao Início'}</Link>
      </div>
    );
  }

  const biografia = isEn && organizador.biografia_empresa_en ? organizador.biografia_empresa_en : organizador.biografia_empresa;
  const nomeEmpresa = organizador.nome_empresa || "Organizador HelloCamp";

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* 1. CABEÇALHO DO PERFIL (O "Host") */}
      <section className="bg-slate-900 pt-20 pb-24 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-[900px] mx-auto relative z-10 text-center flex flex-col items-center">
          
          <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full p-2 shadow-2xl mb-6 flex items-center justify-center overflow-hidden border-4 border-slate-800">
            {organizador.logotipo_url ? (
              <img src={organizador.logotipo_url} alt={nomeEmpresa} className="w-full h-full object-contain rounded-full" />
            ) : (
              <span className="text-5xl font-black text-slate-300">{nomeEmpresa.charAt(0)}</span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">{nomeEmpresa}</h1>
          
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {organizador.parceiro_verificado && (
              <span className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-bold">
                ✓ {isEn ? 'Verified Partner' : 'Parceiro Verificado'}
              </span>
            )}
            {organizador.ano_fundacao && (
              <span className="flex items-center gap-1.5 bg-slate-800 text-slate-300 px-4 py-1.5 rounded-full text-sm font-bold">
                🏛️ {isEn ? 'Since' : 'Desde'} {organizador.ano_fundacao}
              </span>
            )}
          </div>

          {biografia && (
            <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl font-medium">
              "{biografia}"
            </p>
          )}

        </div>
      </section>

      {/* 2. OS CAMPOS DO ORGANIZADOR */}
      <section className="max-w-[1100px] mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12">
          
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <h2 className="text-2xl font-black text-slate-900">{isEn ? 'Programs by this Organizer' : 'Programas deste Organizador'}</h2>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-bold">{campos?.length || 0} {isEn ? 'Camps' : 'Campos'}</span>
          </div>

          {!campos || campos.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-bold">{isEn ? 'No active programs at the moment.' : 'Nenhum programa ativo no momento.'}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {campos.map((campo) => {
                const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
                const localVisivel = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
                const precoVisivel = campo.preco || (campo.turnos && campo.turnos.length > 0 ? campo.turnos[0].preco : 0);

                return (
                  <div key={campo.id} className="group flex flex-col bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 relative hover:shadow-lg transition-all duration-300">
                    <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">Explorar</span></Link>
                    <div className="absolute top-3 right-3 z-20"><BotaoFavorito campoId={campo.id} /></div>

                    <div className="relative h-48 w-full overflow-hidden bg-slate-200">
                      <img src={campo.imagem} alt={nomeVisivel} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-3 left-3 bg-emerald-600 px-3 py-1 text-xs font-bold uppercase text-white rounded-full z-0">
                        {campo.categoria}
                      </div>
                    </div>

                    <div className="flex flex-col p-5 flex-1 pointer-events-none bg-white">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">📍 {localVisivel}</span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight mb-2">{nomeVisivel}</h3>
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                        <p className="text-xl font-black text-emerald-600 m-0">{precoVisivel}€</p>
                        <span className="text-sm font-bold text-[#EBA914] transition-transform group-hover:translate-x-1">{isEn ? 'Explore' : 'Explorar'} &rarr;</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

    </main>
  );
}
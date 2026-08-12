import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function InstitucionalIndexPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const isEn = lang === 'en';
  
  // Vamos buscar todos os programas de juntas/câmaras que estão ativos
  const { data: programas } = await supabase
    .from('programas_institucionais')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      
      {/* Banner Principal */}
      <div className="bg-slate-900 border-b-4 border-emerald-600 py-16 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
          {isEn ? 'Public Programs & Municipalities' : 'Programas de Câmaras e Juntas'}
        </h1>
        <p className="text-slate-300 font-medium max-w-2xl mx-auto">
          {isEn 
            ? 'Official initiatives supported by local government and public entities.' 
            : 'Iniciativas oficiais de tempos livres promovidas por Juntas de Freguesia e Municípios.'}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-12">
        {!programas || programas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-5xl block mb-4">🏛️</span>
            <p className="text-slate-500 font-bold text-lg">
              {isEn ? 'No public programs active at the moment.' : 'Nenhum programa institucional ativo de momento.'}
            </p>
            <p className="text-slate-400 text-sm mt-2">
              {isEn ? 'Please check back later.' : 'Volte a consultar esta página mais perto das interrupções letivas.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programas.map(campo => (
               <div key={campo.id} className="group relative flex flex-col bg-white overflow-hidden border-2 border-emerald-100 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  
                  <Link href={`/${lang}/institucional/${campo.id}`} className="absolute inset-0 z-10">
                    <span className="sr-only">Explorar {campo.nome}</span>
                  </Link>

                  <div className="relative h-56 w-full overflow-hidden bg-emerald-900">
                    <img src={campo.imagem_capa_url || '/og-image.jpg'} alt={campo.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80" />
                    <div className="absolute top-4 left-4 bg-emerald-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white rounded-full z-0 flex items-center gap-1.5">
                      <span>🏛️</span> {isEn ? 'Public Entity' : 'Entidade Pública'}
                    </div>
                  </div>
                  
                  <div className="flex flex-col p-6 flex-1 pointer-events-none">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">📍 {campo.localizacao}</span>
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{campo.nome}</h3>
                    <p className="text-sm font-bold text-emerald-700 mb-6">{campo.entidade_organizadora}</p>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{isEn ? 'Status' : 'Estado'}</p>
                        <p className="text-sm font-black text-slate-900 m-0">{isEn ? 'Registrations Open' : 'Inscrições Abertas'}</p>
                      </div>
                      <span className="text-sm font-black uppercase tracking-wider text-emerald-600 transition-transform group-hover:translate-x-1">
                        {isEn ? 'Explore' : 'Explorar'} &rarr;
                      </span>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
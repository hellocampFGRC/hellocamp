import { supabase } from "../../../lib/supabase";
import Link from "next/link";
import { getDictionary } from "../../../lib/getDictionary";
import BotaoFavorito from "./components/BotaoFavorito";

const PAISES_DESTAQUE = [
  { nome: "Portugal", nome_en: "Portugal", imagem: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=1000&auto=format&fit=crop", desc: "Aventura e Sol", desc_en: "Adventure and Sun" },
  { nome: "Espanha", nome_en: "Spain", imagem: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?q=80&w=1000&auto=format&fit=crop", desc: "Cultura e Diversão", desc_en: "Culture and Fun" },
  { nome: "Reino Unido", nome_en: "United Kingdom", imagem: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1000&auto=format&fit=crop", desc: "Inglês Nativo", desc_en: "Native English" },
  { nome: "França", nome_en: "France", imagem: "https://images.unsplash.com/photo-1502602898657-3e9076006e00?q=80&w=1000&auto=format&fit=crop", desc: "Arte e História", desc_en: "Art and History" }
];

// Dicionário de segurança para garantir a tradução no filtro caso falte na BD
const TRADUCOES_PAISES: Record<string, string> = {
  "Portugal": "Portugal",
  "Espanha": "Spain",
  "França": "France",
  "Reino Unido": "United Kingdom",
  "Brasil": "Brazil",
  "Estados Unidos": "United States"
};

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "pt" | "en");
  const isEn = lang === 'en';

  // FILTRO APLICADO: Só campos com contrato
  const { data: camposDeFerias } = await supabase.from('campos').select('*').not('contrato_parceiro_url', 'is', null).limit(3).order('created_at', { ascending: false });
  const { data: todosOsDistritos } = await supabase.from('distritos').select('id, nome, nome_en, imagem_capa, descricao_curta, descricao_curta_en');

  // FILTRO APLICADO: Filtros só mostram opções de campos legalmente ativos
  const { data: camposFiltros } = await supabase.from('campos').select('categoria, categoria_en, idade, idade_en, Distrito, Distrito_en, pais, pais_en').not('contrato_parceiro_url', 'is', null);
  
  const categoriasMap = new Map();
  const idadesMap = new Map();
  const distritosMap = new Map();
  const paisesMap = new Map();

  if (camposFiltros) {
    camposFiltros.forEach(c => {
      if (c.categoria && c.categoria.trim()) categoriasMap.set(c.categoria.trim(), c.categoria_en?.trim() || c.categoria.trim());
      if (c.idade && c.idade.trim()) idadesMap.set(c.idade.trim(), c.idade_en?.trim() || c.idade.trim());
      if (c.Distrito && c.Distrito.trim()) distritosMap.set(c.Distrito.trim(), c.Distrito_en?.trim() || c.Distrito.trim());
      if (c.pais && c.pais.trim()) paisesMap.set(c.pais.trim(), c.pais_en?.trim() || c.pais.trim());
    });
  }

  const categoriasOpcoes = Array.from(categoriasMap.entries()).map(([pt, en]) => ({ valor: pt, label: isEn ? en : pt }));
  const idadesOpcoes = Array.from(idadesMap.entries()).map(([pt, en]) => ({ valor: pt, label: isEn ? en : pt }));
  const distritosOpcoes = Array.from(distritosMap.entries()).map(([pt, en]) => ({ valor: pt, label: isEn ? en : pt }));
  
  const paisesOpcoes = Array.from(paisesMap.entries()).map(([pt, en]) => {
    const labelTraduzida = isEn ? (en || TRADUCOES_PAISES[pt] || pt) : pt;
    return { valor: pt, label: labelTraduzida };
  });

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900">
      
      <section style={{ position: 'relative', height: '75vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2000&auto=format&fit=crop" alt="Crianças felizes num campo de férias" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}></div>
        </div>
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 1.5rem', textAlign: 'center', margin: '0 auto' }}>
          <h1 className="text-5xl font-extrabold tracking-tight text-white md:text-7xl">{dict.home.titulo}</h1>
          <p className="mt-8 max-w-2xl text-xl font-medium text-gray-100 md:text-2xl tracking-wide leading-relaxed">
            {dict.home.subtitulo}
          </p>
        </div>
      </section>

      <section id="pesquisa" style={{ position: 'relative', paddingTop: '5rem', paddingBottom: '5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', scrollMarginTop: '80px' }}>
        <div style={{ margin: '0 auto', maxWidth: '1000px', padding: '0 1.5rem' }}>
          <div className="text-center mb-8">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2">{dict.home.filtros_inteligentes}</p>
            <h2 className="text-3xl font-extrabold text-gray-900 md:text-4xl tracking-tight">{dict.home.encontre_campo}</h2>
            <p className="mt-3 text-[14px] text-gray-500 max-w-xl mx-auto leading-relaxed">{dict.home.descricao_filtros}</p>
          </div>

          <div style={{ position: 'relative', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.03)', padding: '2.5rem 2rem 3.5rem 2rem', maxWidth: '950px', margin: '0 auto', marginBottom: '2rem' }}>
            <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', zIndex: 20 }}>
              <Link href={`/${lang}/mapa`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f0fdf4', color: '#047857', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none', border: '1px solid #d1fae5', transition: 'all 0.3s' }}>
                <span>📍</span> {dict.home.ver_mapa}
              </Link>
            </div>

            <form action={`/${lang}/pesquisa`} method="GET" style={{ position: 'static', marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', width: '100%' }}>
                
                <div>
                  <label htmlFor="categoria" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#111827', marginBottom: '0.4rem' }}>{dict.home.categoria}</label>
                  <div style={{ position: 'relative' }}>
                    <select id="categoria" name="categoria" style={{ width: '100%', appearance: 'none', borderRadius: '10px', backgroundColor: '#f4f5f8', padding: '0.875rem 1rem', color: '#374151', fontSize: '13px', fontWeight: '500', border: 'none', outline: 'none', cursor: 'pointer' }}>
                      <option value="">{dict.home.todas_categorias}</option>
                      {categoriasOpcoes.map((cat: any) => <option key={cat.valor} value={cat.valor}>{cat.label}</option>)}
                    </select>
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg></div>
                  </div>
                </div>

                <div>
                  <label htmlFor="pais" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#111827', marginBottom: '0.4rem' }}>{isEn ? 'Country' : 'País'}</label>
                  <div style={{ position: 'relative' }}>
                    <select id="pais" name="pais" style={{ width: '100%', appearance: 'none', borderRadius: '10px', backgroundColor: '#f4f5f8', padding: '0.875rem 1rem', color: '#374151', fontSize: '13px', fontWeight: '500', border: 'none', outline: 'none', cursor: 'pointer' }}>
                      <option value="">{isEn ? 'All Countries' : 'Todos os Países'}</option>
                      {paisesOpcoes.map((p: any) => <option key={p.valor} value={p.valor}>{p.label}</option>)}
                    </select>
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg></div>
                  </div>
                </div>

                <div>
                  <label htmlFor="distrito" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#111827', marginBottom: '0.4rem' }}>{dict.home.distrito}</label>
                  <div style={{ position: 'relative' }}>
                    <select id="distrito" name="distrito" style={{ width: '100%', appearance: 'none', borderRadius: '10px', backgroundColor: '#f4f5f8', padding: '0.875rem 1rem', color: '#374151', fontSize: '13px', fontWeight: '500', border: 'none', outline: 'none', cursor: 'pointer' }}>
                      <option value="">{dict.home.todos_distritos}</option>
                      {distritosOpcoes.map((d: any) => <option key={d.valor} value={d.valor}>{d.label}</option>)}
                    </select>
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg></div>
                  </div>
                </div>

                <div>
                  <label htmlFor="idade" style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#111827', marginBottom: '0.4rem' }}>{dict.home.faixa_etaria}</label>
                  <div style={{ position: 'relative' }}>
                    <select id="idade" name="idade" style={{ width: '100%', appearance: 'none', borderRadius: '10px', backgroundColor: '#f4f5f8', padding: '0.875rem 1rem', color: '#374151', fontSize: '13px', fontWeight: '500', border: 'none', outline: 'none', cursor: 'pointer' }}>
                      <option value="">{dict.home.todas_idades}</option>
                      {idadesOpcoes.map((faixa: any) => <option key={faixa.valor} value={faixa.valor}>{faixa.label}</option>)}
                    </select>
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg></div>
                  </div>
                </div>

              </div>

              <button type="submit" className="group hover:scale-105 transition-transform duration-300" style={{ position: 'absolute', bottom: '-45px', left: '50%', transform: 'translateX(-50%)', width: '90px', height: '90px', backgroundColor: '#de5d25', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px -5px rgba(222, 93, 37, 0.4)', border: '5px solid #f8fafc', cursor: 'pointer', zIndex: 20 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <span style={{ color: 'white', fontSize: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{dict.home.pesquisar}</span>
              </button>

            </form>
          </div>
        </div>
      </section>

      <section style={{ margin: '0 auto', maxWidth: '1280px', padding: '5rem 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h2 className="text-3xl font-extrabold text-emerald-900 md:text-4xl tracking-tight">{dict.home.descubra_regiao_titulo}</h2>
          <p className="mt-3 text-base text-emerald-700 max-w-2xl mx-auto">{dict.home.descubra_regiao_sub}</p>
        </div>
        {!todosOsDistritos || todosOsDistritos.length === 0 ? (
          <div className="mt-8 text-center bg-gray-50 py-12 px-6 rounded-2xl border border-gray-100 text-sm text-gray-500">{dict.home.nenhum_distrito}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {todosOsDistritos.map((distrito) => {
              const nomeDistrito = isEn && distrito.nome_en ? distrito.nome_en : distrito.nome;
              const descDistrito = isEn && distrito.descricao_curta_en ? distrito.descricao_curta_en : distrito.descricao_curta;

              return (
                <Link href={`/${lang}/pesquisa?distrito=${distrito.nome}`} key={distrito.id} className="group transition-transform duration-300 hover:-translate-y-1" style={{ position: 'relative', display: 'block', height: '320px', width: '100%', overflow: 'hidden', backgroundColor: 'white', borderRadius: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                  <img src={distrito.imagem_capa} alt={nomeDistrito} className="transition-transform duration-1000 group-hover:scale-110" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 70%)' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '1.5rem' }}>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight">{nomeDistrito}</h3>
                    <p className="mt-1 text-sm font-medium tracking-wider text-amber-300">{descDistrito}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ backgroundColor: '#f8fafc', paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div style={{ margin: '0 auto', maxWidth: '1280px', padding: '0 1.5rem' }}>
          <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 className="text-3xl font-extrabold text-emerald-900 md:text-4xl tracking-tight">{isEn ? 'Discover by Country' : 'Descubra por País'}</h2>
            <p className="mt-3 text-base text-emerald-700 max-w-2xl mx-auto">{isEn ? 'International camps and global experiences' : 'Campos internacionais e experiências globais'}</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {PAISES_DESTAQUE.map((pais) => {
              const nomePais = isEn ? pais.nome_en : pais.nome;
              const descPais = isEn ? pais.desc_en : pais.desc;
              
              return (
                <Link href={`/${lang}/pesquisa/pais/${encodeURIComponent(pais.nome)}`} key={pais.nome} className="group transition-transform duration-300 hover:-translate-y-1" style={{ position: 'relative', display: 'block', height: '280px', width: '100%', overflow: 'hidden', backgroundColor: 'white', borderRadius: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                  <img src={pais.imagem} alt={nomePais} className="transition-transform duration-1000 group-hover:scale-110" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 70%)' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '1.5rem' }}>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight">{nomePais}</h3>
                    <p className="mt-1 text-sm font-medium tracking-wider text-amber-300">{descPais}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* DESTAQUES GERAIS COM A ESTRUTURA BLINDADA PARA TELEMÓVEIS */}
      <section style={{ backgroundColor: 'white', paddingTop: '5rem', paddingBottom: '5rem', borderTop: '1px solid #f3f4f6' }}>
        <div style={{ margin: '0 auto', maxWidth: '1280px', padding: '0 1.5rem' }}>
          <div style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 className="text-3xl font-extrabold text-emerald-900 md:text-4xl tracking-tight">{dict.home.destaques_titulo}</h2>
            <p className="mt-3 text-base text-emerald-700 max-w-2xl mx-auto">{dict.home.destaques_subtitulo}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {camposDeFerias?.map((campo: any, index: number) => {
              const campoId = campo.id !== undefined && campo.id !== null ? campo.id : index + 1;
              const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
              const localCampo = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.distrito || campo.local);
              const idadeCampo = isEn && campo.idade_en ? campo.idade_en : campo.idade;
              const precoVisivel = campo.preco || (campo.turnos && campo.turnos.length > 0 ? campo.turnos[0].preco : 0);

              return (
                <div key={campoId} className="group relative flex flex-col bg-white overflow-hidden border border-gray-100 transition-transform duration-300 hover:-translate-y-1" style={{ borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                  
                  {/* LINK INVISÍVEL COBRE O CARTÃO INTEIRO (Resolve o bug nos telemóveis) */}
                  <Link href={`/${lang}/campo/${campoId}`} className="absolute inset-0 z-10">
                    <span className="sr-only">{dict.home.explorar} {nomeCampo}</span>
                  </Link>

                  {/* BOTÃO FAVORITO SOBREPÕE O LINK PARA SER CLICÁVEL */}
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 20 }}>
                    <BotaoFavorito campoId={campoId} />
                  </div>

                  <div style={{ position: 'relative', height: '250px', width: '100%', overflow: 'hidden' }}>
                    <img src={campo.imagem} alt={nomeCampo} className="transition-transform duration-700 group-hover:scale-105" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', backgroundColor: '#059669', padding: '0.25rem 0.75rem', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'white', borderRadius: '9999px', zIndex: 5 }}>{catCampo}</div>
                  </div>
                  
                  {/* CONTEÚDO DO CARTÃO */}
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', flex: 1, pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">📍 {localCampo}</span>
                    </div>
                    <h3 className="mt-2 text-xl font-extrabold text-gray-900 leading-snug">{nomeCampo}</h3>
                    <p className="mt-1 text-sm text-gray-500">{dict.home.faixa_etaria_label} {idadeCampo}</p>
                    <div style={{ marginTop: 'auto', paddingTop: '1.25rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: '1px solid #f8fafc' }}>
                      <p className="text-2xl font-black text-emerald-600 tracking-tight">{precoVisivel}€</p>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-500 transition-transform group-hover:translate-x-1 inline-block">{dict.home.explorar} &rarr;</span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
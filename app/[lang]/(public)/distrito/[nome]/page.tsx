import { supabase } from "../../../../../lib/supabase";
import Link from "next/link";
import { getDictionary } from "../../../../../lib/getDictionary";
import BotaoFavorito from "../../components/BotaoFavorito";

export default async function PaginaDoDistrito({ 
  params 
}: { 
  params: Promise<{ lang: string; nome: string }> 
}) {
  const { lang, nome } = await params;
  const dict = await getDictionary(lang as "pt" | "en");
  const isEn = lang === 'en';
  
  const nomeLimpo = decodeURIComponent(nome);
  
  const { data: distrito } = await supabase
    .from('distritos')
    .select('*')
    .ilike('nome', nomeLimpo) 
    .single();

  // FILTRO APLICADO: Só campos com contrato assinado
  const { data: camposNoDistrito } = await supabase
    .from('campos')
    .select('*')
    .not('contrato_parceiro_url', 'is', null)
    .or(`Distrito.ilike.%${nomeLimpo}%,local.ilike.%${nomeLimpo}%`); 

  if (!distrito) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#064e3b' }}>
          {isEn ? 'District not found' : 'Não foi possível encontrar este distrito'} 🕵️‍♂️
        </h1>
        <Link href={`/${lang}`} style={{ marginTop: '1rem', fontWeight: 'bold', color: '#059669' }}>
          {isEn ? 'Back to home' : 'Voltar à página inicial'}
        </Link>
      </div>
    );
  }

  const nomeDistrito = isEn && distrito.nome_en ? distrito.nome_en : distrito.nome;
  const descDistrito = isEn && distrito.descricao_curta_en ? distrito.descricao_curta_en : distrito.descricao_curta;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#111827', paddingBottom: '5rem' }}>
      
      {/* HEADER HERO DO DISTRITO */}
      <div style={{ position: 'relative', width: '100%', height: '350px', backgroundColor: '#111827', overflow: 'hidden' }}>
        <img src={distrito.imagem_capa} alt={nomeDistrito} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)' }}></div>

        <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 30 }}>
          <Link href={`/${lang}`} style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', color: '#111', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textDecoration: 'none' }}>
            &larr; {isEn ? 'Back to home' : 'Voltar à página inicial'}
          </Link>
        </div>

        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 1.5rem', zIndex: 10, textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: 'white', textTransform: 'capitalize', letterSpacing: '-0.02em' }}>{nomeDistrito}</h1>
          <p style={{ marginTop: '1rem', fontSize: '1.125rem', fontWeight: '500', color: '#fcd34d', maxWidth: '42rem' }}>{descDistrito}</p>
        </div>
      </div>

      {/* LISTAGEM DE CAMPOS NO DISTRITO */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#064e3b' }}>
            {isEn ? 'Available Camps' : 'Campos Disponíveis'}
          </h2>
          <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '15px' }}>
            {isEn ? 'Explore the options we selected for the district of' : 'Explore as opções que selecionámos para o distrito de'}
            <span style={{ textTransform: 'capitalize', fontWeight: '600', color: '#334155' }}> {nomeDistrito}</span>.
          </p>
        </div>
        
        {!camposNoDistrito || camposNoDistrito.length === 0 ? (
          <div style={{ marginTop: '2rem', textAlign: 'center', backgroundColor: 'white', padding: '4rem 1.5rem', borderRadius: '1.5rem', border: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '1.125rem', color: '#64748b', fontWeight: '500' }}>
              {isEn ? 'There are no camps available for this district yet.' : 'Ainda não existem campos disponíveis para este distrito.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {camposNoDistrito.map((campo: any, index: number) => {
              const campoId = campo.id !== undefined && campo.id !== null ? campo.id : (index + 1);
              const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
              const localCampo = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);
              const precoVisivel = campo.preco || (campo.turnos && campo.turnos.length > 0 ? campo.turnos[0].preco : 0);

              return (
                <div key={campoId} className="group" style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', overflow: 'hidden', border: '1px solid #f1f5f9', borderRadius: '1.5rem', position: 'relative', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
                  
                  {/* LINK INVISÍVEL COBRE O CARTÃO INTEIRO (Resolve o clique nos telemóveis) */}
                  <Link href={`/${lang}/campo/${campoId}`} style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                    <span className="sr-only">Explorar {nomeCampo}</span>
                  </Link>

                  {/* BOTÃO DO CORAÇÃO FLUTUANTE (Nível acima do link para poder ser clicado) */}
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 20 }}>
                    <BotaoFavorito campoId={campoId} />
                  </div>

                  <div style={{ position: 'relative', height: '250px', width: '100%', overflow: 'hidden' }}>
                    <img src={campo.imagem} alt={nomeCampo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', backgroundColor: '#059669', padding: '0.35rem 0.85rem', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: 'white', borderRadius: '9999px', zIndex: 5 }}>
                      {catCampo}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', flex: 1, pointerEvents: 'none' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#047857', textTransform: 'uppercase' }}>
                      📍 {localCampo}
                    </span>
                    <h3 style={{ marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>{nomeCampo}</h3>
                    <p style={{ marginTop: '0.25rem', fontSize: '14px', color: '#64748b' }}>
                      {isEn ? 'Age Group:' : 'Faixa Etária:'} {campo.idade}
                    </p>
                    
                    <div style={{ marginTop: 'auto', paddingTop: '1.25rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9' }}>
                      <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#059669', margin: 0 }}>{precoVisivel}€</p>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f59e0b' }}>
                        {isEn ? 'Explore' : 'Explorar'} &rarr;
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
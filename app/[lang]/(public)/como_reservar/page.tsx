import Link from "next/link";

export default async function ComoReservar({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const isEn = lang === 'en';

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '5rem' }}>
      <div style={{ backgroundColor: '#0f172a', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white' }}>
          {isEn ? 'How to Book' : 'Como Reservar'}
        </h1>
        <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '1.125rem' }}>
          {isEn ? 'Three simple steps for an epic camp.' : 'Três passos simples para um campo épico.'}
        </p>
      </div>
      
      <div style={{ maxWidth: '800px', margin: '-3rem auto 0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', padding: '3rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', color: '#334155', lineHeight: '1.8' }}>
          
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0 }}>1</div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                {isEn ? 'Search and Filter' : 'Pesquise e Filtre'}
              </h3>
              <p>
                {isEn 
                  ? 'Use our advanced search engine or interactive map to find camps near you, filtering by age, dates, and your child\'s favorite categories.'
                  : 'Utilize o nosso motor de busca avançado ou o mapa interativo para encontrar campos perto de si, filtrando por idades, datas e categorias favoritas do seu filho.'
                }
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0 }}>2</div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                {isEn ? 'Choose the Session' : 'Escolha o Turno'}
              </h3>
              <p>
                {isEn 
                  ? 'On the camp page, analyze the program, accommodation, and meals. Select the desired session and the number of children you wish to register.'
                  : 'Na página do campo, analise o programa, o alojamento e a alimentação. Selecione o turno pretendido e a quantidade de crianças que deseja inscrever.'
                }
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0 }}>3</div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                {isEn ? 'Secure Booking' : 'Reserva Segura'}
              </h3>
              <p>
                {isEn 
                  ? 'Proceed to secure checkout. You will immediately receive a confirmation email with all the details and direct contact for the camp coordinating team.'
                  : 'Avance para o checkout seguro. Receberá imediatamente um email de confirmação com todos os detalhes e o contacto direto da equipa coordenadora do campo.'
                }
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href={`/${lang}/pesquisa`} style={{ color: '#059669', fontWeight: 'bold', textDecoration: 'none' }}>
              &larr; {isEn ? 'Start searching' : 'Começar a pesquisar'}
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
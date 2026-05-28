import Link from "next/link";

export default async function Cookies({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '5rem' }}>
      <div style={{ backgroundColor: '#0f172a', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white' }}>{lang === 'en' ? 'Cookie Policy' : 'Política de Cookies'}</h1>
      </div>
      
      <div style={{ maxWidth: '800px', margin: '-3rem auto 0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', padding: '3rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', color: '#334155', lineHeight: '1.8' }}>
          <p>{lang === 'en' ? 'We use cookies to ensure you get the best experience on our website.' : 'Utilizamos cookies para garantir que lhe proporcionamos a melhor experiência no nosso website.'}</p>
          
          <h3 style={{ fontWeight: '800', color: '#0f172a', marginTop: '2rem' }}>{lang === 'en' ? 'What are cookies?' : 'O que são cookies?'}</h3>
          <p>{lang === 'en' ? 'Cookies are small text files saved on your computer or mobile device when you visit our website. They help the site remember your actions and preferences (such as language or the districts you searched) over a period of time.' : 'Cookies são pequenos ficheiros de texto guardados no seu computador ou dispositivo móvel quando visita o nosso website. Ajudam o site a memorizar as suas ações e preferências (como o idioma ou os distritos que pesquisou) durante um período de tempo.'}</p>

          <h3 style={{ fontWeight: '800', color: '#0f172a', marginTop: '2rem' }}>{lang === 'en' ? 'How do we use them?' : 'Como os utilizamos?'}</h3>
          <p>{lang === 'en' ? 'We use essential cookies for the booking engine and secure navigation, and anonymous analytical cookies to understand how the site is used, in order to improve our services.' : 'Utilizamos cookies essenciais para o funcionamento do motor de reservas e navegação segura, e cookies analíticos anónimos para compreender como o site é utilizado, de modo a melhorarmos os nossos serviços.'}</p>
          
          <Link href={`/${lang}`} style={{ display: 'block', marginTop: '2rem', color: '#059669', fontWeight: 'bold', textDecoration: 'none' }}>&larr; {lang === 'en' ? 'Back to Home' : 'Voltar à Página Inicial'}</Link>
        </div>
      </div>
    </main>
  );
}
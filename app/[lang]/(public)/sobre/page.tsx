import Link from "next/link";

export default async function SobreNos({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '5rem' }}>
      <div style={{ backgroundColor: '#0f172a', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white' }}>{lang === 'en' ? 'About HelloCamp' : 'Sobre o HelloCamp'}</h1>
        <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '1.125rem' }}>{lang === 'en' ? 'Our mission is to create unforgettable memories.' : 'A nossa missão é criar memórias inesquecíveis.'}</p>
      </div>
      
      <div style={{ maxWidth: '800px', margin: '-3rem auto 0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', padding: '3rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', color: '#334155', lineHeight: '1.8' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>{lang === 'en' ? 'Who We Are' : 'Quem Somos'}</h2>
          <p style={{ marginBottom: '2rem' }}>{lang === 'en' ? 'HelloCamp was born from a simple need: to make life easier for parents when finding, comparing, and booking the best summer camps in Portugal. We know that school holidays are a logistical challenge, and our goal is to turn that concern into an opportunity for growth for children.' : 'O HelloCamp nasceu de uma necessidade simples: facilitar a vida aos pais na hora de encontrar, comparar e reservar os melhores campos de férias em Portugal. Sabemos que as férias escolares são um desafio logístico, e o nosso objetivo é transformar essa preocupação numa oportunidade de crescimento para as crianças.'}</p>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>{lang === 'en' ? 'Our Vision' : 'A Nossa Visão'}</h2>
          <p style={{ marginBottom: '2rem' }}>{lang === 'en' ? 'We believe every child has a talent to discover. Whether in robotics, surfing, theater, or nature, we work daily to bring together the most qualified and safe partners on our platform.' : 'Acreditamos que cada criança tem um talento por descobrir. Seja na robótica, no surf, no teatro ou na natureza, trabalhamos diariamente para reunir na nossa plataforma os parceiros mais qualificados e seguros do mercado.'}</p>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href={`/${lang}/pesquisa`} style={{ display: 'inline-block', backgroundColor: '#de5d25', color: 'white', fontWeight: 'bold', padding: '1rem 2rem', borderRadius: '999px', textDecoration: 'none' }}>{lang === 'en' ? 'Explore Camps' : 'Explorar Campos de Férias'}</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
export default async function Parceiro({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '5rem' }}>
      <div style={{ backgroundColor: '#0f172a', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white' }}>{lang === 'en' ? 'Join HelloCamp' : 'Junte-se ao HelloCamp'}</h1>
        <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '1.125rem' }}>{lang === 'en' ? 'Increase your bookings and simplify management.' : 'Aumente as suas reservas e simplifique a gestão.'}</p>
      </div>
      
      <div style={{ maxWidth: '800px', margin: '-3rem auto 0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', padding: '3rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', color: '#334155', lineHeight: '1.8' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>{lang === 'en' ? 'Why become a partner?' : 'Porquê tornar-se parceiro?'}</h2>
          <p style={{ marginBottom: '2rem' }}>{lang === 'en' ? 'HelloCamp is more than a directory. It is a platform that puts your summer camp in front of thousands of parents actively looking for school break solutions. By joining us, you gain premium visibility and access to simplified booking tools.' : 'O HelloCamp é mais do que um diretório. É uma plataforma que coloca o seu campo de férias à frente de milhares de pais que procuram ativamente soluções para as pausas escolares. Ao juntar-se a nós, ganha visibilidade premium e acesso a ferramentas simplificadas de reserva.'}</p>
          
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '2rem', color: '#475569' }}>
            <li>{lang === 'en' ? 'Visibility focused on your target audience.' : 'Visibilidade focada no seu público-alvo.'}</li>
            <li>{lang === 'en' ? 'Secure payment and booking processing.' : 'Processamento seguro de pagamentos e reservas.'}</li>
            <li>{lang === 'en' ? 'Dedicated technical support.' : 'Suporte técnico dedicado.'}</li>
            <li>{lang === 'en' ? 'Autonomy to manage sessions, spots, and prices.' : 'Autonomia para gerir turnos, vagas e preços.'}</li>
          </ul>

          <div style={{ backgroundColor: '#fff7ed', padding: '2rem', borderRadius: '1rem', border: '1px solid #ffedd5', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#9a3412', marginBottom: '1rem' }}>{lang === 'en' ? 'Ready to start?' : 'Pronto para começar?'}</h3>
            <p style={{ color: '#c2410c', marginBottom: '1.5rem', fontSize: '14px' }}>{lang === 'en' ? 'Send us an email with your company details and we will contact you within 24 hours.' : 'Envie-nos um email com os dados da sua empresa e entraremos em contacto em 24 horas.'}</p>
            <a href="mailto:info@hellocamp.pt" style={{ display: 'inline-block', backgroundColor: '#de5d25', color: 'white', fontWeight: 'bold', padding: '1rem 2rem', borderRadius: '999px', textDecoration: 'none' }}>info@hellocamp.pt</a>
          </div>
        </div>
      </div>
    </main>
  );
}
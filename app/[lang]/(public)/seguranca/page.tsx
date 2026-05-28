export default async function Seguranca({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '5rem' }}>
      <div style={{ backgroundColor: '#0f172a', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white' }}>{lang === 'en' ? 'Safety Guide' : 'Guia de Segurança'}</h1>
        <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '1.125rem' }}>{lang === 'en' ? 'Our absolute priority.' : 'A nossa prioridade absoluta.'}</p>
      </div>
      
      <div style={{ maxWidth: '800px', margin: '-3rem auto 0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', padding: '3rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', color: '#334155', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '2rem' }}>{lang === 'en' ? 'We understand that trust is the most important factor when it comes to your children. At HelloCamp, we apply a rigorous selection process before accepting any partner on our platform.' : 'Entendemos que a confiança é o fator mais importante quando se trata dos seus filhos. No HelloCamp, aplicamos um rigoroso processo de seleção antes de aceitarmos qualquer parceiro na plataforma.'}</p>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
              <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>🛡️ {lang === 'en' ? 'Verified Partners' : 'Parceiros Verificados'}</strong>
              {lang === 'en' ? 'We only work with legal entities, registered and with a proven track record in organizing children\'s events.' : 'Apenas trabalhamos com entidades legais, registadas e com historial comprovado na organização de eventos infantis.'}
            </li>
            <li style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
              <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>📝 {lang === 'en' ? 'Mandatory Insurance' : 'Seguros Obrigatórios'}</strong>
              {lang === 'en' ? 'We require all organizers to provide active civil liability and personal accident insurance policies.' : 'Exigimos a todos os organizadores a apresentação de apólices de seguro de responsabilidade civil e acidentes pessoais ativas.'}
            </li>
            <li style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #f1f5f9' }}>
              <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>👥 {lang === 'en' ? 'Monitor/Child Ratio' : 'Rácio Monitor/Criança'}</strong>
              {lang === 'en' ? 'We ensure that information about supervision ratios is transparent on all booking pages.' : 'Asseguramos que as informações sobre rácios de supervisão são transparentes em todas as páginas de reserva.'}
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
import Link from "next/link";

export default async function SucessoPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const numeroReserva = `HC-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '4rem 3rem', borderRadius: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        
        <div style={{ width: '80px', height: '80px', backgroundColor: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto' }}>
          <svg style={{ width: '40px', height: '40px', color: '#059669' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#111827', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          {lang === 'en' ? 'Booking Confirmed!' : 'Reserva Confirmada!'}
        </h1>
        
        <p style={{ fontSize: '1.125rem', color: '#4b5563', marginBottom: '2rem', lineHeight: '1.6' }}>
          {lang === 'en' ? 'Your payment has been processed successfully and your spots are officially secured.' : 'O seu pagamento foi processado com sucesso e as vagas estão oficialmente garantidas.'}
        </p>

        <div style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '1rem', marginBottom: '3rem' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            {lang === 'en' ? 'Booking Number' : 'Número da Reserva'}
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#111827', fontFamily: 'monospace' }}>
            {numeroReserva}
          </p>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '3rem', fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
          <h3 style={{ fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>{lang === 'en' ? 'What next?' : 'E agora?'}</h3>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>{lang === 'en' ? 'We have sent the payment receipt to your email.' : 'Enviámos o comprovativo de pagamento para o seu e-mail.'}</li>
            <li>{lang === 'en' ? 'In the same email, you will find direct contacts to the camp team.' : 'No mesmo e-mail, encontra os contactos diretos da equipa do campo.'}</li>
            <li>{lang === 'en' ? 'The organizing entity will contact you shortly with final logistical details.' : 'A entidade organizadora irá entrar em contacto consigo brevemente com os detalhes logísticos finais.'}</li>
          </ul>
        </div>

        <Link href={`/${lang}`} style={{ display: 'inline-block', backgroundColor: '#0f172a', color: 'white', fontSize: '1rem', fontWeight: 'bold', padding: '1rem 2.5rem', borderRadius: '999px', textDecoration: 'none', transition: 'transform 0.2s' }}>
          {lang === 'en' ? 'Back to Home' : 'Voltar à Página Inicial'}
        </Link>
      </div>
    </main>
  );
}
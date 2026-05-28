import Link from "next/link";

interface FooterProps {
  dict: any;
  lang: string;
}

export default function Footer({ dict, lang }: FooterProps) {
  return (
    <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', padding: '5rem 1.5rem 2rem 1.5rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', borderBottom: '1px solid #1e293b', paddingBottom: '4rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white', marginBottom: '1rem', letterSpacing: '-0.02em' }}>HelloCamp</h4>
            <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {dict.footer.descricao}
            </p>
            <a href="mailto:info@hellocamp.pt" style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981', textDecoration: 'none' }}>info@hellocamp.pt</a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>{dict.footer.coluna_categorias}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '14px' }}>
              <li><Link href={`/${lang}/pesquisa?categoria=Desporto`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{dict.footer.cat_desporto}</Link></li>
              <li><Link href={`/${lang}/pesquisa?categoria=Aventura`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{dict.footer.cat_aventura}</Link></li>
              <li><Link href={`/${lang}/pesquisa?categoria=Tecnologia`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{dict.footer.cat_tecnologia}</Link></li>
              <li><Link href={`/${lang}/pesquisa?categoria=Artes`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{dict.footer.cat_artes}</Link></li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>{dict.footer.coluna_informacao}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '14px' }}>
              <li><Link href={`/${lang}/sobre`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{dict.footer.info_sobre}</Link></li>
              <li><Link href={`/${lang}/como_reservar`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{dict.footer.info_reservar}</Link></li>
              <li><Link href={`/${lang}/seguranca`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{dict.footer.info_seguranca}</Link></li>
              <li><Link href={`/${lang}/parceiro`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{dict.footer.info_parceiro}</Link></li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>{dict.footer.coluna_legal}</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '14px' }}>
              <li><Link href={`/${lang}/termos`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{dict.footer.legal_termos}</Link></li>
              <li><Link href={`/${lang}/privacidade`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{dict.footer.legal_privacidade}</Link></li>
              <li><Link href={`/${lang}/cookies`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{dict.footer.legal_cookies}</Link></li>
              <li><a href="https://www.livroreclamacoes.pt/" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>{dict.footer.legal_reclamacoes}</a></li>
            </ul>
          </div>

        </div>

        <div style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', fontSize: '12px' }}>
          <p>© {new Date().getFullYear()} {dict.footer.direitos}</p>
        </div>

      </div>
    </footer>
  );
}
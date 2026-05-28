import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthButton from "./AuthButton";

export default function Header({ dict, lang }: { dict: any, lang: string }) {
  return (
    <header style={{ 
      backgroundColor: 'white', 
      borderBottom: '1px solid #f1f5f9', 
      position: 'sticky', 
      top: 0, 
      zIndex: 50,
      width: '100%',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: '1rem 1.5rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap', 
        gap: '1rem' 
      }}>
        
        {/* LADO ESQUERDO: LOGOTIPO */}
        <Link href={`/${lang}`} style={{ 
          fontSize: '1.5rem', 
          fontWeight: '900', 
          color: '#0f172a', 
          textDecoration: 'none',
          letterSpacing: '-0.02em'
        }}>
          HelloCamp
        </Link>
        
        {/* LADO DIREITO: COMPONENTES DE CONTROLO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          <LanguageSwitcher lang={lang} />

          {/* Linha separadora estrutural */}
          <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }}></div>

          <AuthButton lang={lang} dict={dict} />
          
        </div>
      </div>
    </header>
  );
}
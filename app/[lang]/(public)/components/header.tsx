import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthButton from "./AuthButton";

export default function Header({ dict, lang }: { dict: any, lang: string }) {
  return (
    <header style={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.98)', 
      backdropFilter: 'blur(8px)',
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
        flexWrap: 'wrap', /* Permite que o conteúdo vá para a linha de baixo em telemóveis */
        gap: '1rem' 
      }}>
        
        {/* LADO ESQUERDO: LOGOTIPO */}
        <Link href={`/${lang}`} style={{ 
          fontSize: '1.5rem', 
          fontWeight: '900', 
          color: '#0f172a', 
          textDecoration: 'none',
          letterSpacing: '-0.02em',
          flexShrink: 0
        }}>
          HelloCamp
        </Link>
        
        {/* LADO DIREITO: COMPONENTES DE CONTROLO */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          justifyContent: 'flex-end',
          flex: '1 1 auto',
          overflowX: 'auto', /* Se o ecrã for muito pequeno (iPhone SE), permite deslizar os botões em vez de partir o site */
          scrollbarWidth: 'none', /* Esconde a barra de scroll */
          paddingBottom: '2px'
        }}>
          
          <LanguageSwitcher lang={lang} />

          <AuthButton lang={lang} dict={dict} />
          
        </div>
      </div>
    </header>
  );
}
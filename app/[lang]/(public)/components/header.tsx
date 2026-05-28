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
      boxSizing: 'border-box',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap', /* Permite a quebra de linha no telemóvel se faltar espaço */
        gap: '0.75rem'
      }}>
        
        {/* LADO ESQUERDO: LOGOTIPO */}
        <Link href={`/${lang}`} style={{
          fontSize: '1.5rem',
          fontWeight: '900',
          color: '#0f172a',
          textDecoration: 'none',
          letterSpacing: '-0.02em',
          marginRight: '2rem', /* BARREIRA FÍSICA: Garante que nunca se cola ao "PT" */
          flexShrink: 0 /* Impede que o logo seja encolhido */
        }}>
          HelloCamp
        </Link>
        
        {/* LADO DIREITO: COMPONENTES DE CONTROLO */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flex: '1 1 auto', /* Permite ocupar o resto do espaço disponível */
          justifyContent: 'flex-end', /* Encosta tudo à direita no PC */
          overflowX: 'auto', /* Cria scroll horizontal apenas NOS BOTÕES no telemóvel */
          whiteSpace: 'nowrap', /* Impede a quebra a meio das palavras dos botões */
          paddingBottom: '0.25rem', /* Espaço extra para o dedo e sombras */
          WebkitOverflowScrolling: 'touch' /* Scroll fluído no iPhone */
        }}>
          
          {/* Idioma */}
          <div style={{ flexShrink: 0 }}>
            <LanguageSwitcher lang={lang} />
          </div>

          {/* Separador vertical */}
          <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0', flexShrink: 0 }}></div>

          {/* Botões de Conta / Parceiro */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <AuthButton lang={lang} dict={dict} />
          </div>
          
        </div>
      </div>
    </header>
  );
}
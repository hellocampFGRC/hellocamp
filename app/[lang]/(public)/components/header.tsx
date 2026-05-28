import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthButton from "./AuthButton";

export default function Header({ dict, lang }: { dict: any, lang: string }) {
  return (
    <header className="py-4 px-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-50">
      
      {/* LADO ESQUERDO: LOGOTIPO */}
      <Link href={`/${lang}`} className="text-2xl font-extrabold tracking-tight text-gray-950 no-underline">
        HelloCamp
      </Link>
      
      {/* LADO DIREITO: COMPONENTES DE CONTROLO */}
      <div className="flex items-center gap-6">
        
        {/* Seletor de Idiomas */}
        <LanguageSwitcher lang={lang} />

        {/* Linha separadora estrutural */}
        <div className="h-5 w-px bg-gray-200"></div>

        {/* O AuthButton agora gere internamente o link de parceiro e os botões de login */}
        <AuthButton lang={lang} dict={dict} />
        
      </div>
    </header>
  );
}
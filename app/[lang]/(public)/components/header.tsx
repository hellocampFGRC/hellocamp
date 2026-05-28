import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthButton from "./AuthButton";

export default function Header({ dict, lang }: { dict: any, lang: string }) {
  return (
    <header className="py-3 px-4 md:py-4 md:px-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-50">
      
      {/* LADO ESQUERDO: LOGOTIPO */}
      <Link href={`/${lang}`} className="text-xl md:text-2xl font-extrabold tracking-tight text-gray-950 no-underline">
        HelloCamp
      </Link>
      
      {/* LADO DIREITO: COMPONENTES DE CONTROLO */}
      <div className="flex items-center gap-3 md:gap-6">
        
        {/* Seletor de Idiomas */}
        <LanguageSwitcher lang={lang} />

        {/* Linha separadora estrutural (escondida no telemóvel para poupar espaço) */}
        <div className="h-5 w-px bg-gray-200 hidden md:block"></div>

        {/* O AuthButton agora gere internamente o link de parceiro e os botões de login */}
        <AuthButton lang={lang} dict={dict} />
        
      </div>
    </header>
  );
}
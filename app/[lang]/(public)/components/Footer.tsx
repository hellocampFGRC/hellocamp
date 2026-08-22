"use client";

import Link from "next/link";

interface FooterProps {
  dict: any;
  lang: string;
}

export default function Footer({ dict, lang }: FooterProps) {
  return (
    <footer className="bg-[#124072] text-blue-100/70 pt-0 pb-8 font-sans mt-auto">
      
      {/* BARRA DE CORES IDENTIDADE VISUAL (Verde B2B | Amarelo Universal | Azul Monitores) */}
      <div className="w-full h-1.5 flex">
        <div className="w-1/3 h-full bg-[#167524]"></div>
        <div className="w-1/3 h-full bg-[#e2a41d]"></div>
        <div className="w-1/3 h-full bg-[#124072] brightness-125"></div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 md:px-8 pt-16">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-white/10 pb-16">
          
          {/* LOGO E CONTACTOS */}
          <div className="flex flex-col">
            <h4 className="text-2xl font-black mb-4 tracking-tight flex items-center">
               <span className="text-white">Hello</span>
               <span className="text-[#e2a41d]">Camp</span>
            </h4>
            <p className="text-sm leading-relaxed mb-6 font-medium text-blue-100/80">
              {dict.footer.descricao}
            </p>
            <a href="mailto:info@hellocamp.pt" className="text-sm font-bold text-[#e2a41d] hover:text-white transition-colors">
              info@hellocamp.pt
            </a>
          </div>

          {/* COLUNA 1: CATEGORIAS */}
          <div className="flex flex-col">
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6">
              {dict.footer.coluna_categorias}
            </h4>
            <ul className="flex flex-col gap-3 text-sm font-medium">
              <li><Link href={`/${lang}/pesquisa?categoria=Desporto`} className="hover:text-white transition-colors">{dict.footer.cat_desporto}</Link></li>
              <li><Link href={`/${lang}/pesquisa?categoria=Aventura`} className="hover:text-white transition-colors">{dict.footer.cat_aventura}</Link></li>
              <li><Link href={`/${lang}/pesquisa?categoria=Tecnologia`} className="hover:text-white transition-colors">{dict.footer.cat_tecnologia}</Link></li>
              <li><Link href={`/${lang}/pesquisa?categoria=Artes`} className="hover:text-white transition-colors">{dict.footer.cat_artes}</Link></li>
            </ul>
          </div>

          {/* COLUNA 2: INFORMAÇÃO */}
          <div className="flex flex-col">
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6">
              {dict.footer.coluna_informacao}
            </h4>
            <ul className="flex flex-col gap-3 text-sm font-medium">
              <li><Link href={`/${lang}/sobre`} className="hover:text-white transition-colors">{dict.footer.info_sobre}</Link></li>
              <li><Link href={`/${lang}/como_reservar`} className="hover:text-white transition-colors">{dict.footer.info_reservar}</Link></li>
              <li><Link href={`/${lang}/seguranca`} className="hover:text-white transition-colors">{dict.footer.info_seguranca}</Link></li>
              <li><Link href={`/${lang}/parceiro`} className="text-[#e2a41d] font-bold hover:text-white transition-colors">{dict.footer.info_parceiro}</Link></li>
            </ul>
          </div>

          {/* COLUNA 3: LEGAL */}
          <div className="flex flex-col">
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6">
              {dict.footer.coluna_legal}
            </h4>
            <ul className="flex flex-col gap-3 text-sm font-medium">
              <li><Link href={`/${lang}/termos`} className="hover:text-white transition-colors">{dict.footer.legal_termos}</Link></li>
              <li><Link href={`/${lang}/privacidade`} className="hover:text-white transition-colors">{dict.footer.legal_privacidade}</Link></li>
              <li><Link href={`/${lang}/cookies`} className="hover:text-white transition-colors">{dict.footer.legal_cookies}</Link></li>
              <li><a href="https://www.livroreclamacoes.pt/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{dict.footer.legal_reclamacoes}</a></li>
            </ul>
          </div>

        </div>

        {/* COPYRIGHT E SELOS */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium">
          <p>© {new Date().getFullYear()} HelloCamp. {dict.footer.direitos}</p>
          <div className="flex items-center gap-4 opacity-50">
            {/* Espaço reservado para eventuais selos de segurança ou métodos de pagamento no futuro */}
            <span>🔒 Plataforma Segura</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
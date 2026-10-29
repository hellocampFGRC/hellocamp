import React from "react";
import Link from "next/link";

export interface FooterProps {
  dict?: any;
  lang: string;
}

export default function Footer({ dict, lang }: FooterProps) {
  const isEn = lang === "en";

  return (
    <footer className="bg-white border-t border-slate-200/80 mt-20 font-sans text-[#0F172A]">
      {/* BARRA MODULAR DA NOVA IDENTIDADE (4 CORES OFICIAIS) */}
      <div className="w-full h-2.5 flex">
        <div className="w-1/4 h-full bg-[#F59E0B]"></div>
        <div className="w-1/4 h-full bg-[#2563EB]"></div>
        <div className="w-1/4 h-full bg-[#16A34A]"></div>
        <div className="w-1/4 h-full bg-[#F43F5E]"></div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-slate-100">
          
          {/* COLUNA 1: MARCA & SISTEMA MODULAR */}
          <div className="flex flex-col">
            <Link
              href={`/${lang}`}
              className="text-3xl font-black mb-4 tracking-tight flex items-center no-underline"
            >
              <span className="text-[#0F172A]">Hello</span>
              <span className="text-[#F59E0B]">Camp</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 font-medium text-slate-500">
              {dict?.footer?.descricao ||
                (isEn
                  ? "Camps that create great stories. Explore, learn, and grow in one place."
                  : "Campos que criam grandes histórias. Explora, aprende e cresce num só lugar.")}
            </p>
            
            {/* Formas Modulares da Identidade */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-4 h-4 rounded-full bg-[#F59E0B] inline-block"></span>
              <span className="w-4 h-4 rounded-md bg-[#2563EB] inline-block"></span>
              <span className="w-4 h-4 rounded-full bg-[#16A34A] inline-block"></span>
              <span className="w-4 h-4 rounded-md bg-[#F43F5E] inline-block"></span>
            </div>

            <a
              href="mailto:info@hellocamp.pt"
              className="text-sm font-bold text-[#2563EB] hover:text-[#F59E0B] transition-colors no-underline"
            >
              info@hellocamp.pt
            </a>
          </div>

          {/* COLUNA 2: EXPLORAR / CATEGORIAS */}
          <div className="flex flex-col">
            <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-widest mb-6">
              {isEn ? "Explore" : "Explorar"}
            </h4>
            <ul className="flex flex-col gap-3.5 text-sm font-bold text-slate-500 list-none p-0 m-0">
              <li>
                <Link
                  href={`/${lang}/pesquisa?categoria=Desporto`}
                  className="hover:text-[#16A34A] transition-colors no-underline flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                  {isEn ? "Sports & Football" : "Desporto & Futebol"}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/pesquisa?categoria=Surf`}
                  className="hover:text-[#F59E0B] transition-colors no-underline flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                  {isEn ? "Surf & Water" : "Surf & Náutica"}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/pesquisa?categoria=Aventura`}
                  className="hover:text-[#2563EB] transition-colors no-underline flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                  {isEn ? "Adventure & Nature" : "Aventura & Natureza"}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/pesquisa?categoria=Artes`}
                  className="hover:text-[#F43F5E] transition-colors no-underline flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#F43F5E]"></span>
                  {isEn ? "Arts & Creative" : "Artes & Criatividade"}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/mapa`}
                  className="hover:text-[#0F172A] transition-colors no-underline pt-1 inline-block text-xs uppercase tracking-wider font-black text-[#2563EB]"
                >
                  {isEn ? "View Interactive Map →" : "Ver Mapa Interativo →"}
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUNA 3: ECOSSISTEMA HELLOCAMP */}
          <div className="flex flex-col">
            <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-widest mb-6">
              {isEn ? "Ecosystem" : "Ecossistema"}
            </h4>
            <ul className="flex flex-col gap-3.5 text-sm font-bold text-slate-500 list-none p-0 m-0">
              <li>
                <Link
                  href={`/${lang}/sobre`}
                  className="hover:text-[#2563EB] transition-colors no-underline"
                >
                  {isEn ? "About Us" : "Sobre Nós"}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/institucional`}
                  className="hover:text-[#2563EB] transition-colors no-underline"
                >
                  {isEn ? "Municipalities & Schools" : "Autarquias e Escolas"}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/monitores`}
                  className="hover:text-[#2563EB] transition-colors no-underline"
                >
                  {isEn ? "Monitors Talent Pool" : "Bolsa de Monitores"}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/guia-pais`}
                  className="hover:text-[#2563EB] transition-colors no-underline"
                >
                  {isEn ? "Parents Guide" : "Guia de Pais"}
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  href={`/${lang}/parceiro`}
                  className="inline-flex items-center justify-center bg-[#F59E0B] hover:bg-[#d97706] text-[#0F172A] px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-sm no-underline"
                >
                  {isEn ? "Become a Partner →" : "Seja Nosso Parceiro →"}
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUNA 4: SEGURANÇA & LEGAL */}
          <div className="flex flex-col">
            <h4 className="text-xs font-black text-[#0F172A] uppercase tracking-widest mb-6">
              {isEn ? "Legal & Trust" : "Legal e Segurança"}
            </h4>
            <ul className="flex flex-col gap-3.5 text-sm font-bold text-slate-500 list-none p-0 m-0">
              <li>
                <Link
                  href={`/${lang}/seguranca`}
                  className="hover:text-[#16A34A] transition-colors no-underline"
                >
                  {isEn ? "Safety Guide" : "Guia de Segurança"}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/termos`}
                  className="hover:text-[#2563EB] transition-colors no-underline"
                >
                  {isEn ? "Terms & Conditions" : "Termos e Condições"}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/privacidade`}
                  className="hover:text-[#2563EB] transition-colors no-underline"
                >
                  {isEn ? "Privacy Policy" : "Política de Privacidade"}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/cookies`}
                  className="hover:text-[#2563EB] transition-colors no-underline"
                >
                  {isEn ? "Cookies Policy" : "Política de Cookies"}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <p className="m-0">
            © {new Date().getFullYear()} HelloCamp Portugal.{" "}
            {isEn ? "All rights reserved." : "Todos os direitos reservados."}
          </p>
          <p className="m-0 text-slate-400">
            {isEn
              ? "Bold. Simple. Modular."
              : "Mais que um campo de férias."}
          </p>
        </div>
      </div>
    </footer>
  );
}
"use client";

import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthButton from "./AuthButton";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header({ dict, lang }: { dict: any, lang: string }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isEn = lang === 'en';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}`);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 font-sans shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 py-3 md:px-8">
        <div className="flex items-center justify-between">

          {/* 1. LOGOTIPO */}
          <Link href={`/${lang}`} className="text-xl md:text-2xl font-extrabold tracking-tight flex-shrink-0">
            <span className="text-slate-900">Hello</span>
            <span className="text-[#EBA914]">Camp</span>
          </Link>

          {/* 2. NAVEGAÇÃO CENTRALIZADA (1 LINHA, CLEAN) */}
          <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 flex-1">
            <div className="relative group py-2">
              <button className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors bg-transparent border-none cursor-pointer">
                {isEn ? 'Camps' : 'Campos'}
                <span className="text-[10px] text-slate-400 group-hover:rotate-180 transition-transform">▼</span>
              </button>
              
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl p-2 hidden flex-col z-50 group-hover:flex">
                <Link href={`/${lang}/pesquisa?categoria=Aventura %26 Natureza`} className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg">Aventura & Natureza</Link>
                <Link href={`/${lang}/pesquisa?categoria=Desporto`} className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg">Desporto</Link>
                <Link href={`/${lang}/pesquisa?categoria=Artes %26 Criatividade`} className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg">Artes & Criatividade</Link>
              </div>
            </div>

            <div className="relative group py-2">
              <button className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors bg-transparent border-none cursor-pointer">
                {isEn ? 'Locations' : 'Locais'}
                <span className="text-[10px] text-slate-400 group-hover:rotate-180 transition-transform">▼</span>
              </button>
              
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl p-2 hidden flex-col z-50 group-hover:flex">
                <Link href={`/${lang}/distrito/Lisboa`} className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg">Lisboa</Link>
                <Link href={`/${lang}/distrito/Porto`} className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg">Porto</Link>
              </div>
            </div>

            <Link href={`/${lang}/institucional`} className="text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors">
              {isEn ? 'Public Camps' : 'Câmaras e Juntas'}
            </Link>

            <Link href={`/${lang}/guia-pais`} className="text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors">
              {isEn ? 'Parents Guide' : 'Guia Pais'}
            </Link>

            <Link href={`/${lang}/parceiro`} className="text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors">
              {isEn ? 'Partners' : 'Parceiros'}
            </Link>

            <Link href={`/${lang}/monitores`} className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {isEn ? 'Monitors' : 'Sou Monitor'}
            </Link>
          </nav>

          {/* 3. SISTEMA DE AUTENTICAÇÃO (MINIMALISTA) */}
          <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
            <LanguageSwitcher lang={lang} />
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <AuthButton lang={lang} dict={dict} />
              {session && (
                <button onClick={handleLogout} className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-2 transition-colors">
                  {isEn ? 'Logout' : 'Sair'}
                </button>
              )}
            </div>
          </div>

          {/* 4. BOTÃO HAMBURGER INTERATIVO (MOBILE) */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher lang={lang} />
            {session && (
              <button onClick={handleLogout} className="text-[10px] font-bold text-slate-500 uppercase">
                {isEn ? 'Logout' : 'Sair'}
              </button>
            )}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-8 h-8 flex items-center justify-center text-slate-700 text-xl font-bold ml-1">
              {isMobileMenuOpen ? '✕' : '≡'}
            </button>
          </div>
        </div>

        {/* MENU MOBILE */}
        {isMobileMenuOpen && (
          <div className="w-full flex flex-col bg-white border-t border-slate-100 mt-3 pt-2 pb-4 gap-1 lg:hidden">
            <Link href={`/${lang}/institucional`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700">Câmaras e Juntas</Link>
            <Link href={`/${lang}/guia-pais`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700">Guia Pais</Link>
            <Link href={`/${lang}/parceiro`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700">Parceiros</Link>
            <Link href={`/${lang}/monitores`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700">Sou Monitor</Link>
            <div className="px-4 pt-3 border-t border-slate-50 mt-2" onClickCapture={() => setIsMobileMenuOpen(false)}>
              <AuthButton lang={lang} dict={dict} />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
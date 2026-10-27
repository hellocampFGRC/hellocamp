"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthButton from "./AuthButton";
import LanguageSwitcher from "./LanguageSwitcher";

interface HeaderProps {
  dict: any;
  lang: string;
}

export default function Header({ dict, lang }: HeaderProps) {
  const isEn = lang === "en";
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuAberto(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setMenuAberto(false);
    if (termoPesquisa.trim()) {
      router.push(`/${lang}/pesquisa?q=${encodeURIComponent(termoPesquisa.trim())}`);
    } else {
      router.push(`/${lang}/pesquisa`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 font-sans">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
          
          {/* ESQUERDA: LOGO + NAVEGAÇÃO DESKTOP */}
          <div className="flex items-center gap-8">
            <Link href={`/${lang}`} className="text-2xl font-black tracking-tight flex items-center no-underline">
              <span className="text-[#0E3A68]">Hello</span>
              <span className="text-[#e2a41d]">Camp</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-6 text-sm font-bold text-slate-600">
              <Link href={`/${lang}/pesquisa`} className="hover:text-[#0E3A68] transition-colors no-underline">
                {isEn ? "Explore Camps" : "Explorar Campos"}
              </Link>
              <Link href={`/${lang}/mapa`} className="hover:text-[#0E3A68] transition-colors no-underline flex items-center gap-1.5">
                <span>🗺️</span> {isEn ? "Interactive Map" : "Mapa"}
              </Link>
              <Link href={`/${lang}/institucional`} className="hover:text-[#0E3A68] transition-colors no-underline">
                {isEn ? "Municipalities & Schools" : "Câmaras e Juntas"}
              </Link>
              <Link href={`/${lang}/monitores`} className="hover:text-[#2563eb] transition-colors no-underline">
                {isEn ? "Staff Portal" : "Bolsa de Monitores"}
              </Link>
              <Link href={`/${lang}/guia-pais`} className="hover:text-[#0E3A68] transition-colors no-underline">
                {isEn ? "Parents Guide" : "Guia de Pais"}
              </Link>
              <Link href={`/${lang}/blog`} className="hover:text-[#0E3A68] transition-colors no-underline">
                Blog
              </Link>
            </nav>
          </div>

          {/* DIREITA: PESQUISA RÁPIDA + PARCEIROS + IDIOMA + AUTH */}
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 text-slate-500 px-3.5 py-2 rounded-full text-xs font-bold transition-colors border border-slate-200 cursor-pointer"
              title={isEn ? "Quick Search (⌘K)" : "Pesquisa Rápida (⌘K)"}
            >
              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span className="hidden xl:inline">{isEn ? "Search..." : "Pesquisar..."}</span>
              <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400 font-sans">⌘K</kbd>
            </button>

            {/* LINK PARCEIROS DESKTOP (Singular /parceiro) */}
            <Link
              href={`/${lang}/parceiro`}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#167524] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-full transition-colors no-underline"
            >
              {isEn ? "For Organizers" : "Parceiros"}
            </Link>

            <div className="hidden sm:block">
              <LanguageSwitcher lang={lang} />
            </div>

            <AuthButton dict={dict} lang={lang} />

            {/* BOTÃO HAMBURGER MOBILE */}
            <button
              onClick={() => setMenuAberto(!menuAberto)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Menu"
            >
              {menuAberto ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* DRAWER MENU MOBILE */}
        {menuAberto && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-6 py-6 shadow-xl flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleQuickSearch} className="relative w-full mb-2">
              <input
                type="text"
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                placeholder={isEn ? "Search camps, sports, cities..." : "Pesquisar campos, desportos, locais..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68]"
              />
              <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-[#0E3A68]">
                🔍
              </button>
            </form>

            <Link
              href={`/${lang}/pesquisa`}
              onClick={() => setMenuAberto(false)}
              className="text-base font-black text-slate-800 py-2 border-b border-slate-100 no-underline"
            >
              🏕️ {isEn ? "Explore All Camps" : "Explorar Campos"}
            </Link>
            <Link
              href={`/${lang}/mapa`}
              onClick={() => setMenuAberto(false)}
              className="text-base font-black text-slate-800 py-2 border-b border-slate-100 no-underline"
            >
              🗺️ {isEn ? "Interactive Map" : "Mapa Interativo"}
            </Link>
            <Link
              href={`/${lang}/institucional`}
              onClick={() => setMenuAberto(false)}
              className="text-base font-black text-slate-800 py-2 border-b border-slate-100 no-underline"
            >
              🏛️ {isEn ? "Municipalities & Schools" : "Câmaras e Juntas"}
            </Link>
            <Link
              href={`/${lang}/monitores`}
              onClick={() => setMenuAberto(false)}
              className="text-base font-black text-[#2563eb] py-2 border-b border-slate-100 no-underline"
            >
              🎒 {isEn ? "Staff & Monitors Portal" : "Bolsa de Monitores"}
            </Link>
            <Link
              href={`/${lang}/guia-pais`}
              onClick={() => setMenuAberto(false)}
              className="text-base font-black text-slate-800 py-2 border-b border-slate-100 no-underline"
            >
              👨‍👩‍👧 {isEn ? "Parents Guide" : "Guia de Pais"}
            </Link>
            <Link
              href={`/${lang}/blog`}
              onClick={() => setMenuAberto(false)}
              className="text-base font-black text-slate-800 py-2 border-b border-slate-100 no-underline"
            >
              📰 Blog
            </Link>

            {/* CORRIGIDO: Aponta para /${lang}/parceiro em vez de /${lang}/ser-parceiro (que dava 404) */}
            <Link
              href={`/${lang}/parceiro`}
              onClick={() => setMenuAberto(false)}
              className="mt-2 w-full text-center bg-[#167524] text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-xl no-underline shadow-md"
            >
              {isEn ? "Become a Partner (B2B)" : "Ser Parceiro Organizador"}
            </Link>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {isEn ? "Language" : "Idioma"}
              </span>
              <LanguageSwitcher lang={lang} />
            </div>
          </div>
        )}
      </header>

      {/* MODAL DE PESQUISA RÁPIDA (⌘K) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {isEn ? "Quick Search" : "Pesquisa Rápida"}
              </span>
              <button
                onClick={() => setSearchOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ESC ✕
              </button>
            </div>
            <form onSubmit={handleQuickSearch} className="flex gap-2">
              <input
                type="text"
                autoFocus
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                placeholder={isEn ? "Type a sport, city, or camp name..." : "Escreva um desporto, cidade ou nome do campo..."}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white"
              />
              <button
                type="submit"
                className="bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest text-xs px-6 py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                {isEn ? "Go" : "Ir"}
              </button>
            </form>
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full mb-1">
                {isEn ? "Popular Searches:" : "Pesquisas Populares:"}
              </span>
              {[
                { label: "Surf", url: `/${lang}/pesquisa?q=Surf` },
                { label: isEn ? "Sports" : "Desporto", url: `/${lang}/pesquisa?categoria=Desporto` },
                { label: "Lisboa", url: `/${lang}/distrito/Lisboa` },
                { label: "Porto", url: `/${lang}/distrito/Porto` },
                { label: isEn ? "Languages" : "Línguas", url: `/${lang}/pesquisa?categoria=${encodeURIComponent("Línguas")}` },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.url}
                  onClick={() => setSearchOpen(false)}
                  className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-[#0E3A68] hover:text-white px-3 py-1.5 rounded-lg transition-colors no-underline"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
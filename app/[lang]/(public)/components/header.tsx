"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import AuthButton from "./AuthButton";
import LanguageSwitcher from "./LanguageSwitcher";

interface HeaderProps {
  dict: any;
  lang: string;
}

export default function Header({ dict, lang }: HeaderProps) {
  const isEn = lang === "en";
  const router = useRouter();
  const pathname = usePathname();

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
      router.push(
        `/${lang}/pesquisa?q=${encodeURIComponent(termoPesquisa.trim())}`
      );
    } else {
      router.push(`/${lang}/pesquisa`);
    }
  };

  const navLinks = [
    {
      href: `/${lang}/pesquisa`,
      label: isEn ? "Explore Camps" : "Explorar Campos",
      active: pathname.includes("/pesquisa"),
    },
    {
      href: `/${lang}/institucional`,
      label: isEn ? "Municipalities" : "Autarquias",
      active: pathname.includes("/institucional"),
    },
    {
      href: `/${lang}/monitores`,
      label: isEn ? "Monitors" : "Monitores",
      active: pathname.includes("/monitores"),
    },
    {
      href: `/${lang}/guia-pais`,
      label: isEn ? "Parents Guide" : "Guia de Pais",
      active: pathname.includes("/guia-pais"),
    },
    {
      href: `/${lang}/blog`,
      label: "Blog",
      active: pathname.includes("/blog"),
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 font-sans">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 h-16 md:h-[74px] flex items-center justify-between gap-4">
          {/* ESQUERDA: LOGÓTIPO */}
          <Link
            href={`/${lang}`}
            className="text-2xl font-black tracking-tight flex items-center no-underline flex-shrink-0"
          >
            <span className="text-[#0E3A68]">Hello</span>
            <span className="text-[#e2a41d]">Camp</span>
          </Link>

          {/* CENTRO: NAVEGAÇÃO DESKTOP (SEMPRE EM LINHA ÚNICA, SEM QUEBRAS) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap no-underline transition-colors ${
                  item.active
                    ? "text-[#0E3A68] bg-slate-100 font-black"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* DIREITA: PESQUISA + PARCEIROS + IDIOMA + CONTA */}
          <div className="flex items-center gap-2.5 md:gap-3.5 flex-shrink-0">
            {/* Botão Lupa Minimalista */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-colors border border-slate-200/80 cursor-pointer"
              title={isEn ? "Quick Search (⌘K)" : "Pesquisa Rápida (⌘K)"}
              aria-label="Pesquisar"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* Botão Parceiros B2B */}
            <Link
              href={`/${lang}/parceiro`}
              className="hidden md:inline-flex items-center text-[11px] font-black uppercase tracking-wider text-[#167524] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-full transition-colors no-underline whitespace-nowrap"
            >
              {isEn ? "Partners" : "Parceiros"}
            </Link>

            <div className="hidden sm:block h-4 w-px bg-slate-200" />

            <div className="hidden sm:block">
              <LanguageSwitcher lang={lang} />
            </div>

            <AuthButton dict={dict} lang={lang} />

            {/* Botão Menu Mobile */}
            <button
              type="button"
              onClick={() => setMenuAberto(!menuAberto)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Menu"
            >
              {menuAberto ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* DRAWER MENU MOBILE */}
        {menuAberto && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-6 py-6 shadow-xl flex flex-col gap-3">
            <form onSubmit={handleQuickSearch} className="relative w-full mb-2">
              <input
                type="text"
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                placeholder={
                  isEn
                    ? "Search camps, sports, cities..."
                    : "Pesquisar campos, desportos, locais..."
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68]"
              />
              <button
                type="submit"
                className="absolute right-3 top-2.5 text-slate-400 hover:text-[#0E3A68] bg-transparent border-0 cursor-pointer"
              >
                🔍
              </button>
            </form>

            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuAberto(false)}
                className="text-sm font-black text-slate-800 py-2.5 border-b border-slate-100 no-underline"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href={`/${lang}/parceiro`}
              onClick={() => setMenuAberto(false)}
              className="mt-2 w-full text-center bg-[#167524] text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-xl no-underline shadow-md"
            >
              {isEn ? "For Organizers (B2B)" : "Área de Parceiros (B2B)"}
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
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {isEn ? "Quick Search" : "Pesquisa Rápida"}
              </span>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer bg-transparent border-0"
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
                placeholder={
                  isEn
                    ? "Type a sport, city, or camp name..."
                    : "Escreva um desporto, cidade ou nome do campo..."
                }
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white"
              />
              <button
                type="submit"
                className="bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest text-xs px-6 py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                {isEn ? "Search" : "Ir"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
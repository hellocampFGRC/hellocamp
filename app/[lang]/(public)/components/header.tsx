"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import AuthButton from "./AuthButton";
import LanguageSwitcher from "./LanguageSwitcher";

export interface HeaderProps {
  dict?: any;
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
      active: pathname?.includes("/pesquisa"),
    },
    {
      href: `/${lang}/institucional`,
      label: isEn ? "Municipalities" : "Autarquias",
      active: pathname?.includes("/institucional"),
    },
    {
      href: `/${lang}/monitores`,
      label: isEn ? "Monitors" : "Monitores",
      active: pathname?.includes("/monitores"),
    },
    {
      href: `/${lang}/guia-pais`,
      label: isEn ? "Parents Guide" : "Guia de Pais",
      active: pathname?.includes("/guia-pais"),
    },
    {
      href: `/${lang}/blog`,
      label: "Blog",
      active: pathname?.includes("/blog"),
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 font-sans">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 h-16 md:h-[74px] flex items-center justify-between gap-4">
          {/* ESQUERDA: LOGÓTIPO NOVA IDENTIDADE */}
          <Link
            href={`/${lang}`}
            className="text-2xl md:text-[26px] font-black tracking-tight flex items-center no-underline flex-shrink-0"
          >
            <span className="text-[#0F172A]">Hello</span>
            <span className="text-[#F59E0B]">Camp</span>
          </Link>

          {/* CENTRO: NAVEGAÇÃO DESKTOP */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap no-underline transition-all ${
                  item.active
                    ? "text-[#2563EB] bg-blue-50 font-black"
                    : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-100"
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
              className="w-9 h-9 rounded-full bg-[#F8FAFC] hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-colors border border-slate-200 cursor-pointer"
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

            {/* Botão Parceiros B2B - Destaque Amarelo Solar / Verde Natureza */}
            <Link
              href={`/${lang}/parceiro`}
              className="hidden md:inline-flex items-center text-[11px] font-black uppercase tracking-wider text-[#0F172A] bg-[#F59E0B] hover:bg-[#d97706] px-4 py-2 rounded-full transition-all no-underline whitespace-nowrap shadow-sm"
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
              className="lg:hidden p-2 rounded-xl text-[#0F172A] hover:bg-slate-100 transition-colors cursor-pointer"
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
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB]"
              />
              <button
                type="submit"
                className="absolute right-3 top-2.5 text-slate-400 hover:text-[#2563EB] bg-transparent border-0 cursor-pointer"
              >
                🔍
              </button>
            </form>

            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuAberto(false)}
                className="text-sm font-black text-[#0F172A] py-2.5 border-b border-slate-100 no-underline"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href={`/${lang}/parceiro`}
              onClick={() => setMenuAberto(false)}
              className="mt-2 w-full text-center bg-[#F59E0B] text-[#0F172A] font-black uppercase tracking-widest text-xs py-3.5 rounded-full no-underline shadow-md"
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
          className="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 p-6"
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
                className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-xl px-4 py-3.5 text-base font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white"
              />
              <button
                type="submit"
                className="bg-[#2563EB] hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs px-6 py-3.5 rounded-xl transition-colors cursor-pointer"
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
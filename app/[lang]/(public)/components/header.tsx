"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthButton from "./AuthButton";

// ═══════════════════════════════════════════
// ÍCONES SVG
// ═══════════════════════════════════════════
const IconSearch = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconHeart = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconMenu = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconClose = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconChevron = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconArrowRight = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// ═══════════════════════════════════════════
// DROPDOWN ACESSÍVEL
// ═══════════════════════════════════════════
function Dropdown({
  label,
  children,
  align = "center",
}: {
  label: string;
  children: React.ReactNode;
  align?: "center" | "left";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const alignClass = align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-[#e2a41d] transition-colors bg-transparent border-none cursor-pointer py-2"
      >
        {label}
        <IconChevron className={`w-3 h-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className={`absolute ${alignClass} mt-1 w-60 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-900/10 p-2 z-50 flex flex-col`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// ITEM DE DROPDOWN
// ═══════════════════════════════════════════
function DropdownItem({
  href,
  icon,
  title,
  subtitle,
  onClick,
}: {
  href: string;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors no-underline"
    >
      {icon && (
        <span className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-white border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
          {icon}
        </span>
      )}
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-bold text-slate-800 leading-tight">{title}</span>
        {subtitle && (
          <span className="text-[11px] font-medium text-slate-400 mt-0.5 leading-tight">{subtitle}</span>
        )}
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════
// HEADER PRINCIPAL
// ═══════════════════════════════════════════
export default function Header({ dict, lang }: { dict: any; lang: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const isEn = lang === "en";

  const [session, setSession] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fecha menu mobile ao mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  // Bloqueia scroll quando drawer está aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Atalho ⌘K / Ctrl+K abre pesquisa
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Foca input ao abrir
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}`);
    router.refresh();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    setIsSearchOpen(false);
    router.push(`/${lang}/pesquisa?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      {/* ═══════ HEADER STICKY ═══════ */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 font-sans shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">

            {/* LOGO */}
            <Link
              href={`/${lang}`}
              className="text-xl md:text-2xl font-extrabold tracking-tight flex-shrink-0"
            >
              <span className="text-[#124072]">Hello</span>
              <span className="text-[#e2a41d]">Camp</span>
            </Link>

            {/* NAV DESKTOP */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">

              {/* DROPDOWN: CAMPOS */}
              <Dropdown label={isEn ? "Camps" : "Campos"}>
                <DropdownItem
                  href={`/${lang}/pesquisa?categoria=Aventura %26 Natureza`}
                  title={isEn ? "Adventure & Nature" : "Aventura & Natureza"}
                  subtitle={isEn ? "Outdoor experiences" : "Experiências ao ar livre"}
                />
                <DropdownItem
                  href={`/${lang}/pesquisa?categoria=Desporto`}
                  title={isEn ? "Sports" : "Desporto"}
                  subtitle={isEn ? "From football to surf" : "Do futebol ao surf"}
                />
                <DropdownItem
                  href={`/${lang}/pesquisa?categoria=Tecnologia %26 Ciência`}
                  title={isEn ? "Tech & Science" : "Tecnologia & Ciência"}
                  subtitle={isEn ? "Coding, robotics & more" : "Programação, robótica e mais"}
                />
                <DropdownItem
                  href={`/${lang}/pesquisa?categoria=Artes %26 Criatividade`}
                  title={isEn ? "Arts & Creativity" : "Artes & Criatividade"}
                  subtitle={isEn ? "Music, theatre, visual arts" : "Música, teatro, artes visuais"}
                />
                <DropdownItem
                  href={`/${lang}/pesquisa?categoria=Línguas`}
                  title={isEn ? "Languages" : "Línguas"}
                  subtitle={isEn ? "English, Spanish & more" : "Inglês, Espanhol e mais"}
                />
                <div className="h-px bg-slate-100 my-1" />
                <Link
                  href={`/${lang}/pesquisa`}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-black text-[#e2a41d] hover:bg-amber-50 transition-colors no-underline"
                >
                  {isEn ? "See all camps" : "Ver todos os campos"}
                  <IconArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Dropdown>

              {/* DROPDOWN: LOCAIS */}
              <Dropdown label={isEn ? "Locations" : "Locais"}>
                <DropdownItem
                  href={`/${lang}/distrito/Lisboa`}
                  title="Lisboa"
                  subtitle={isEn ? "Capital region" : "Região da capital"}
                />
                <DropdownItem href={`/${lang}/distrito/Porto`} title="Porto" />
                <DropdownItem href={`/${lang}/distrito/Faro`} title="Faro" subtitle="Algarve" />
                <DropdownItem href={`/${lang}/distrito/Coimbra`} title="Coimbra" />
                <DropdownItem href={`/${lang}/distrito/Braga`} title="Braga" />
                <div className="h-px bg-slate-100 my-1" />
                <Link
                  href={`/${lang}/mapa`}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-black text-[#167524] hover:bg-emerald-50 transition-colors no-underline"
                >
                  {isEn ? "Open interactive map" : "Abrir mapa interativo"}
                  <IconArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Dropdown>

              <Link
                href={`/${lang}/institucional`}
                className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-[#167524] transition-colors"
              >
                {isEn ? "Public Camps" : "Câmaras e Juntas"}
              </Link>

              <Link
                href={`/${lang}/guia-pais`}
                className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-[#e2a41d] transition-colors"
              >
                {isEn ? "Parents Guide" : "Guia Pais"}
              </Link>

              <Link
                href={`/${lang}/parceiro`}
                className="px-3 py-2 text-sm font-bold text-slate-700 hover:text-[#167524] transition-colors"
              >
                {isEn ? "Partners" : "Parceiros"}
              </Link>
            </nav>

            {/* AÇÕES DESKTOP */}
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">

              {/* BOTÃO PESQUISA */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label={isEn ? "Search" : "Pesquisar"}
                className="group flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <IconSearch className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-500 pr-6">
                  {isEn ? "Search..." : "Pesquisar..."}
                </span>
                <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-500">
                  ⌘K
                </kbd>
              </button>

              {/* FAVORITOS */}
              <Link
                href={`/${lang}/favoritos`}
                aria-label={isEn ? "Wishlist" : "Favoritos"}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-600 hover:text-rose-500"
              >
                <IconHeart />
              </Link>

              <LanguageSwitcher lang={lang} />

              <div className="w-px h-5 bg-slate-200" />

              <AuthButton lang={lang} dict={dict} />

              {session && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 px-2 py-1.5 transition-colors cursor-pointer"
                >
                  {isEn ? "Logout" : "Sair"}
                </button>
              )}
            </div>

            {/* AÇÕES MOBILE */}
            <div className="flex items-center gap-1 lg:hidden">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label={isEn ? "Search" : "Pesquisar"}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <IconSearch />
              </button>
              <Link
                href={`/${lang}/favoritos`}
                aria-label={isEn ? "Wishlist" : "Favoritos"}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <IconHeart />
              </Link>
              <LanguageSwitcher lang={lang} />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label={isEn ? "Open menu" : "Abrir menu"}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <IconMenu />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════ OVERLAY DE PESQUISA ═══════ */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-24 md:pt-32 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSearchOpen(false);
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
              <IconSearch className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  isEn
                    ? "Search camps, sports, cities..."
                    : "Pesquisar campos, desportos, cidades..."
                }
                className="flex-1 bg-transparent text-base md:text-lg font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
                aria-label="Close"
              >
                <IconClose className="w-4 h-4" />
              </button>
            </form>

            <div className="px-6 py-4 bg-slate-50/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                {isEn ? "Popular searches" : "Pesquisas populares"}
              </p>
              <div className="flex flex-wrap gap-2">
                {(isEn
                  ? ["Surf", "Football", "Lisbon", "English", "Robotics"]
                  : ["Surf", "Futebol", "Lisboa", "Inglês", "Robótica"]
                ).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      router.push(`/${lang}/pesquisa?q=${encodeURIComponent(tag)}`);
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:border-[#e2a41d] hover:text-[#e2a41d] transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DRAWER MOBILE ═══════ */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMobileMenuOpen(false);
          }}
        >
          <div className="absolute top-0 right-0 w-full max-w-sm h-full bg-white shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <span className="text-lg font-black">
                <span className="text-[#124072]">Hello</span>
                <span className="text-[#e2a41d]">Camp</span>
              </span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <IconClose />
              </button>
            </div>

            <div className="flex-1 px-3 py-4">
              <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {isEn ? "Explore" : "Explorar"}
              </p>
              <Link href={`/${lang}/pesquisa`} className="block px-3 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50">🔍 {isEn ? "All Camps" : "Todos os Campos"}</Link>
              <Link href={`/${lang}/mapa`} className="block px-3 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50">{isEn ? "Map View" : "Ver no Mapa"}</Link>
              <Link href={`/${lang}/favoritos`} className="block px-3 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50">{isEn ? "My Wishlist" : "Meus Favoritos"}</Link>

              <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-2">
                {isEn ? "Categories" : "Categorias"}
              </p>
              <Link href={`/${lang}/pesquisa?categoria=Desporto`} className="block px-3 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50">{isEn ? "Sports" : "Desporto"}</Link>
              <Link href={`/${lang}/pesquisa?categoria=Aventura %26 Natureza`} className="block px-3 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50">{isEn ? "Adventure" : "Aventura"}</Link>
              <Link href={`/${lang}/pesquisa?categoria=Línguas`} className="block px-3 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50">{isEn ? "Languages" : "Línguas"}</Link>

              <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-2">
                {isEn ? "HelloCamp" : "A HelloCamp"}
              </p>
              <Link href={`/${lang}/institucional`} className="block px-3 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50">{isEn ? "Public Camps" : "Câmaras e Juntas"}</Link>
              <Link href={`/${lang}/guia-pais`} className="block px-3 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50">{isEn ? "Parents Guide" : "Guia Pais"}</Link>
              <Link href={`/${lang}/ser-parceiro`} className="block px-3 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50">{isEn ? "Become a Partner" : "Ser Parceiro"}</Link>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0">
              <AuthButton lang={lang} dict={dict} />
              {session && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full mt-3 text-xs font-bold text-slate-500 hover:text-slate-900 py-2 cursor-pointer"
                >
                  {isEn ? "Logout" : "Terminar sessão"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
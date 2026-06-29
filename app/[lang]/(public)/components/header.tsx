"use client";

import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthButton from "./AuthButton";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header({ dict, lang }: { dict: any, lang: string }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [session, setSession] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isEn = lang === 'en';
  // Verifica se estamos na secção dos Monitores (para adaptar o UI do Header)
  const isMonitorZone = pathname.includes('/monitores');

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
    if (isMonitorZone) {
       router.push(`/${lang}/monitores`);
    } else {
       router.push(`/${lang}`);
    }
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 font-sans box-border shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 py-2 md:py-4 md:px-8">
        <div className="flex items-center justify-between">

          {/* 1. LOGOTIPO */}
          <Link href={`/${lang}`} className="text-xl md:text-2xl font-extrabold tracking-tight no-underline flex-shrink-0">
            <span className="text-gray-900">Hello</span>
            <span className="text-[#EBA914]">Camp</span>
            {isMonitorZone && <span className="ml-1.5 text-xs font-black uppercase tracking-widest text-blue-600 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded-full hidden sm:inline-block">Staff</span>}
          </Link>

          {/* 2. NAVEGAÇÃO CENTRALIZADA (DESKTOP) */}
          <nav className="hidden md:flex items-center justify-center gap-8 flex-1">
            
            {/* Se estiver na zona de Monitores, mostra apenas links relevantes para eles */}
            {isMonitorZone ? (
              <>
                <Link href={`/${lang}/monitores`} className="text-[15px] font-bold text-gray-700 hover:text-blue-600 no-underline py-2">
                  {isEn ? 'Home' : 'Início'}
                </Link>
                <Link href={`/${lang}/monitores/registo`} className="text-[15px] font-bold text-gray-700 hover:text-blue-600 no-underline py-2">
                  {isEn ? 'Register' : 'Criar Perfil'}
                </Link>
                <Link href={`/${lang}`} className="text-[15px] font-bold text-slate-400 hover:text-slate-600 no-underline py-2 ml-8 text-xs border-l border-slate-200 pl-8">
                  &larr; {isEn ? 'Return to Camps' : 'Voltar aos Campos'}
                </Link>
              </>
            ) : (
              /* MENU NORMAL (PAIS E PARCEIROS) */
              <>
                {/* HOVER DROPDOWN: CAMPOS POR TEMA */}
                <div className="relative group py-2">
                  <button className="flex items-center gap-1 text-[15px] font-bold text-gray-700 hover:text-emerald-600 bg-transparent border-none cursor-pointer">
                    {isEn ? 'Camps' : 'Campos'}
                    <span className="text-[9px] text-gray-400 transition-transform duration-200 group-hover:rotate-180">▼</span>
                  </button>
                  
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl p-2 hidden flex-col z-50 group-hover:flex animate-in fade-in duration-150">
                    <Link href={`/${lang}/pesquisa?categoria=Aventura %26 Natureza`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2"><span>🌲</span> {isEn ? 'Adventure & Nature' : 'Aventura & Natureza'}</Link>
                    <Link href={`/${lang}/pesquisa?categoria=Desporto`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2"><span>⚽</span> {isEn ? 'Sports' : 'Desporto'}</Link>
                    <Link href={`/${lang}/pesquisa?categoria=Desportos Náuticos`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2"><span>🏄‍♂️</span> {isEn ? 'Water Sports' : 'Desportos Náuticos'}</Link>
                    <Link href={`/${lang}/pesquisa?categoria=Artes %26 Criatividade`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2"><span>🎨</span> {isEn ? 'Arts & Creativity' : 'Artes & Criatividade'}</Link>
                    <Link href={`/${lang}/pesquisa?categoria=Tecnologia %26 Robótica`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2"><span>💻</span> {isEn ? 'Tech & Robotics' : 'Tecnologia & Robótica'}</Link>
                    <Link href={`/${lang}/pesquisa?categoria=Línguas`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2"><span>🗣️</span> {isEn ? 'Languages' : 'Línguas'}</Link>
                    <Link href={`/${lang}/pesquisa?categoria=Multiatividades`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline flex items-center gap-2"><span>🤹</span> {isEn ? 'Multi-activities' : 'Multiatividades'}</Link>
                  </div>
                </div>

                {/* HOVER DROPDOWN: LOCAIS / DISTRITOS */}
                <div className="relative group py-2">
                  <button className="flex items-center gap-1 text-[15px] font-bold text-gray-700 hover:text-emerald-600 bg-transparent border-none cursor-pointer">
                    {isEn ? 'Locations' : 'Locais'}
                    <span className="text-[9px] text-gray-400 transition-transform duration-200 group-hover:rotate-180">▼</span>
                  </button>
                  
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl p-2 hidden flex-col z-50 group-hover:flex animate-in fade-in duration-150">
                    <Link href={`/${lang}/distrito/Lisboa`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline">Lisboa</Link>
                    <Link href={`/${lang}/distrito/Porto`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline">Porto</Link>
                    <Link href={`/${lang}/distrito/Faro`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline">Faro</Link>
                    <Link href={`/${lang}/distrito/Aveiro`} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg no-underline">Aveiro</Link>
                  </div>
                </div>

                <Link href={`/${lang}/guia-pais`} className="text-[15px] font-bold text-gray-700 hover:text-emerald-600 no-underline py-2">{isEn ? 'Parents Guide' : 'Guia Pais'}</Link>
                <Link href={`/${lang}/parceiro`} className="text-[15px] font-bold text-gray-700 hover:text-emerald-600 no-underline py-2">{isEn ? 'Partners' : 'Parceiros'}</Link>
                <Link href={`/${lang}/monitores`} className="text-[15px] font-bold text-blue-600 hover:text-blue-800 no-underline py-2 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>{isEn ? 'Staff / Monitors' : 'Sou Monitor'}</Link>
              </>
            )}
          </nav>

          {/* 3. SISTEMA DE AUTENTICAÇÃO (DESKTOP) */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <LanguageSwitcher lang={lang} />
            <div className="w-px h-5 bg-gray-200"></div>
            <div className="flex items-center gap-3">
              
              {/* Botão de Auth: Diferente se for Monitor */}
              {isMonitorZone ? (
                session ? (
                  <Link href={`/${lang}/monitores/portal/perfil`} className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors no-underline">
                    {isEn ? 'My Profile' : 'O Meu Perfil'}
                  </Link>
                ) : (
                  <Link href={`/${lang}/monitores/login`} className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors no-underline">
                    {isEn ? 'Login' : 'Entrar'}
                  </Link>
                )
              ) : (
                <AuthButton lang={lang} dict={dict} />
              )}
              
              {session && (
                <button onClick={handleLogout} className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-colors border border-red-100 cursor-pointer">
                  {isEn ? 'Logout' : 'Sair'}
                </button>
              )}
            </div>
          </div>

          {/* 4. BOTÃO HAMBURGER INTERATIVO (MOBILE) */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher lang={lang} />
            {session && (
              <button onClick={handleLogout} className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1.5 rounded-lg border border-red-100 uppercase transition-colors">
                {isEn ? 'Logout' : 'Sair'}
              </button>
            )}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-lg font-bold ml-1 cursor-pointer"
            >
              {isMobileMenuOpen ? '✕' : '≡'}
            </button>
          </div>

        </div>

        {/* MENU LATERAL EXPANSÍVEL COMPACTO (MOBILE) */}
        {isMobileMenuOpen && (
          <div className="w-full flex flex-col bg-white border-t border-slate-100 mt-2 pt-1 pb-2 gap-0.5 md:hidden">
            
            {isMonitorZone ? (
              <>
                <Link href={`/${lang}/monitores`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">{isEn ? 'Home' : 'Início'}</Link>
                <Link href={`/${lang}/monitores/registo`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">{isEn ? 'Register' : 'Criar Perfil'}</Link>
                
                <div className="px-3 pt-2" onClickCapture={() => setIsMobileMenuOpen(false)}>
                  <Link href={`/${lang}/monitores/login`} className="block w-full text-center text-sm font-bold text-white bg-blue-600 py-2.5 rounded-lg no-underline">
                    {session ? (isEn ? 'My Profile' : 'O Meu Perfil') : (isEn ? 'Login' : 'Entrar')}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="px-3 py-1 text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">{isEn ? 'Categories' : 'Categorias'}</div>
                <Link href={`/${lang}/pesquisa?categoria=Aventura %26 Natureza`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-1.5 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">🌲 Aventura & Natureza</Link>
                <Link href={`/${lang}/pesquisa?categoria=Desporto`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-1.5 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">⚽ Desporto</Link>
                <Link href={`/${lang}/pesquisa?categoria=Desportos Náuticos`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-1.5 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">🏄‍♂️ Desportos Náuticos</Link>
                <Link href={`/${lang}/pesquisa?categoria=Artes %26 Criatividade`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-1.5 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">🎨 Artes & Criatividade</Link>
                <Link href={`/${lang}/pesquisa?categoria=Tecnologia %26 Robótica`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-1.5 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">💻 Tecnologia & Robótica</Link>
                <Link href={`/${lang}/pesquisa?categoria=Línguas`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-1.5 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">🗣️ Línguas</Link>
                <Link href={`/${lang}/pesquisa?categoria=Multiatividades`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-1.5 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">🤹 Multiatividades</Link>
                
                <div className="px-3 py-1 text-[9px] font-black text-slate-400 uppercase tracking-wider mt-2">{isEn ? 'Locations' : 'Destinos'}</div>
                <Link href={`/${lang}/distrito/Lisboa`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-1.5 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">Lisboa</Link>
                <Link href={`/${lang}/distrito/Porto`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-1.5 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">Porto</Link>
                <Link href={`/${lang}/distrito/Faro`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-1.5 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">Faro</Link>
                
                <div className="h-px bg-slate-100 my-1 mx-3"></div>
                
                <Link href={`/${lang}/guia-pais`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-1.5 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">Guia Pais</Link>
                <Link href={`/${lang}/parceiro`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-1.5 text-sm font-bold text-slate-700 no-underline hover:bg-slate-50">Parceiros</Link>
                <Link href={`/${lang}/monitores`} onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-1.5 text-sm font-bold text-blue-600 no-underline hover:bg-blue-50 bg-blue-50/30">Sou Monitor</Link>
                
                <div className="px-3 pt-2" onClickCapture={() => setIsMobileMenuOpen(false)}>
                  <AuthButton lang={lang} dict={dict} />
                </div>
              </>
            )}

          </div>
        )}

      </div>
    </header>
  );
}
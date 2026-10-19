"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function ClienteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const isEn = lang === 'en';
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${lang}/login`);
      } else {
        setUser(session?.user || null);
      }
      setLoading(false);
    };
    checkUser();
  }, [router, lang]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}`);
  };

  const getLangUrl = (targetLang: string) => {
    return pathname.replace(`/${lang}`, `/${targetLang}`);
  };

  if (loading) return <div className="min-h-[80vh] bg-slate-50" />;

  return (
    <div className="flex flex-col md:flex-row bg-slate-50 font-sans min-h-[calc(100vh-80px)]">
      
      {/* MENU DE NAVEGAÇÃO: Azul Seguro HelloCamp B2C */}
      <aside className="w-full md:w-[260px] bg-[#0E3A68] text-white border-b md:border-b-0 md:border-r border-transparent flex flex-col flex-shrink-0 z-10 shadow-md md:shadow-none">
        
        {/* Título: Visível apenas no Desktop para poupar espaço no mobile */}
        <div className="p-5 md:p-6 border-b border-white/10 hidden md:block">
          <h2 className="text-xl font-black m-0 text-white tracking-tight flex items-center gap-1">
            <span className="text-white">Hello</span><span className="text-[#e2a41d]">Camp</span>
          </h2>
          <p className="text-[11px] text-blue-200 font-bold mt-1.5 uppercase tracking-widest">
            {isEn ? 'Parent Portal' : 'Portal da Família'}
          </p>
        </div>
        
        {/* Links: Scroll horizontal no mobile, Vertical no desktop */}
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 p-3 md:p-6 no-scrollbar scroll-smooth items-center md:items-stretch">
          <NavLink href={`/${lang}/cliente/dashboard`} active={pathname.includes('/dashboard')} icon="📅" text={isEn ? 'Upcoming Camps' : 'Próximos Campos'} />
          <NavLink href={`/${lang}/cliente/mensagens`} active={pathname.includes('/mensagens')} icon="💬" text={isEn ? 'Messages' : 'Mensagens'} />
          <NavLink href={`/${lang}/cliente/criancas`} active={pathname.includes('/criancas')} icon="👦" text={isEn ? 'My Children' : 'Os Meus Filhos'} />
          <NavLink href={`/${lang}/cliente/favoritos`} active={pathname.includes('/favoritos')} icon="❤️" text={isEn ? 'Wishlist' : 'Os Meus Favoritos'} />
          <NavLink href={`/${lang}/cliente/perfil`} active={pathname.includes('/perfil')} icon="🛡️" text={isEn ? 'Profile & Security' : 'Perfil e Segurança'} />
          
          <div className="hidden md:block border-t border-white/10 my-2 pt-4" />
          
          <NavLink href={`/${lang}/pesquisa`} active={false} icon="🔍" text={isEn ? 'Explore Camps' : 'Pesquisar Campos'} className="md:mt-auto" />
          
          {/* Botão Logout Mobile */}
          <button onClick={handleLogout} className="md:hidden flex-shrink-0 flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-bold text-red-100 bg-red-900/30 border border-red-900/50 hover:bg-red-900/50 ml-2 transition-colors">
            {isEn ? 'Logout' : 'Sair'}
          </button>
        </nav>

        {/* Info Utilizador & Logout versão Desktop */}
        <div className="p-6 border-t border-white/10 hidden md:block mt-auto">
          <p className="text-[11px] font-bold text-blue-200 mb-4 break-all opacity-70">
            {user?.email}
          </p>
          <button onClick={handleLogout} className="w-full p-3 bg-transparent border border-white/20 text-white rounded-xl cursor-pointer font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors">
            {isEn ? 'Logout' : 'Terminar Sessão'}
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        {/* Header Superior Mobile & Desktop (Apenas Línguas e Apoio) */}
        <header className="bg-white px-4 md:px-8 py-3 md:py-4 border-b border-slate-200 flex justify-end items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex gap-2 text-sm font-bold">
              <Link href={getLangUrl('pt')} className={`${lang === 'pt' ? 'text-slate-900' : 'text-slate-400'} no-underline`}>PT</Link>
              <span className="text-slate-200">|</span>
              <Link href={getLangUrl('en')} className={`${lang === 'en' ? 'text-slate-900' : 'text-slate-400'} no-underline`}>EN</Link>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 overflow-y-auto w-full h-full box-border">
          {children}
        </div>
      </main>

    </div>
  );
}

// Componente auxiliar B2C
function NavLink({ href, active, icon, text, className = "" }: { href: string, active: boolean, icon: string, text: string, className?: string }) {
  return (
    <Link 
      href={href} 
      className={`
        flex items-center gap-2 px-5 py-2.5 md:py-3.5 rounded-full md:rounded-xl text-sm whitespace-nowrap transition-colors flex-shrink-0
        ${active ? 'bg-white/20 text-white font-bold shadow-sm' : 'text-blue-100 font-medium hover:bg-white/10 hover:text-white'}
        ${className}
      `}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span>{text}</span>
    </Link>
  );
}
"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function PortalMonitorLayout({
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
        // Se não estiver logado, manda para o login principal
        router.push(`/${lang}/login?redirectTo=monitores/portal/perfil`);
        return;
      }

      // Verifica se o utilizador já tem perfil de monitor criado
      const { data: monitor } = await supabase
        .from('monitores')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (!monitor) {
        // Se está logado mas ainda não criou o perfil de monitor, manda para o registo
        router.push(`/${lang}/monitores/registo`);
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkUser();
  }, [router, lang]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}`);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-slate-50 font-sans">
      
      {/* SIDEBAR DO MONITOR (Tema Azul/Branco) */}
      <aside className="w-full md:w-[260px] bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col flex-shrink-0 z-10">
        
        {/* Título Desktop */}
        <div className="p-6 border-b border-slate-100 hidden md:block">
          <h2 className="text-lg font-black m-0 text-slate-900">
            Portal do <span className="text-blue-600">Monitor</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Bolsa de Talentos</p>
        </div>
        
        {/* Navegação Responsiva */}
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 p-3 md:p-6 no-scrollbar scroll-smooth items-center md:items-stretch">
          <NavLink href={`/${lang}/monitores/portal/perfil`} active={pathname.includes('/perfil')} icon="🧑‍🏫" text={isEn ? 'My Profile' : 'O Meu Perfil'} />
          
          {/* NOVA ABA: Caixa de Mensagens */}
          <NavLink href={`/${lang}/monitores/portal/mensagens`} active={pathname.includes('/mensagens')} icon="💬" text={isEn ? 'Messages' : 'Mensagens'} />
          
          <NavLink href={`/${lang}/pesquisa`} active={false} icon="🏕️" text={isEn ? 'Explore Camps' : 'Explorar Campos'} />
          
          <div className="hidden md:block border-t border-slate-100 my-2 pt-4" />
          
          {/* Botão Sair Mobile */}
          <button onClick={handleLogout} className="md:hidden flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold text-red-500 bg-red-50 border border-red-100 ml-2 transition-colors">
            Sair
          </button>
        </nav>

        {/* Rodapé Desktop */}
        <div className="p-6 border-t border-slate-100 hidden md:block mt-auto bg-slate-50/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 truncate">{user?.email}</p>
          <button onClick={handleLogout} className="w-full p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-100 hover:text-red-600 transition-colors shadow-sm">
            {isEn ? 'Logout' : 'Terminar Sessão'}
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full box-border">
        {children}
      </main>

    </div>
  );
}

// Subcomponente de Navegação
function NavLink({ href, active, icon, text }: { href: string, active: boolean, icon: string, text: string }) {
  return (
    <Link 
      href={href} 
      className={`
        flex items-center gap-2.5 px-4 py-2.5 md:py-3 rounded-full md:rounded-xl text-sm whitespace-nowrap transition-all flex-shrink-0
        ${active ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-sm' : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900 border border-transparent'}
      `}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span>{text}</span>
    </Link>
  );
}
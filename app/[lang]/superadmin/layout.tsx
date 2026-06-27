"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function SuperAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${lang}/login`);
        return;
      }

      const { data: perfil } = await supabase
        .from('perfis')
        .select('is_superadmin')
        .eq('id', session.user.id)
        .single();
      
      if (!perfil?.is_superadmin) {
        alert("Acesso Negado. Esta área é restrita à administração da HelloCamp.");
        router.push(`/${lang}`);
        return;
      }
      
      setLoading(false);
    };
    checkSuperAdmin();
  }, [router, lang]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}`);
  };

  if (loading) return <div className="min-h-screen bg-gray-900" />;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans">
      
      {/* SIDEBAR SUPERADMIN (Tema Escuro HQ) */}
      <aside className="w-full md:w-[280px] bg-gray-900 text-white flex flex-col flex-shrink-0 shadow-md md:shadow-none z-10">
        
        {/* Título: Oculto no mobile para poupar espaço */}
        <div className="p-5 md:p-6 border-b border-gray-800 hidden md:block">
          <h2 className="text-xl font-black m-0">
            HelloCamp <span className="text-amber-400">HQ</span>
          </h2>
          <p className="text-xs text-gray-400 mt-2 font-bold">Direção & Gestão Geral</p>
        </div>
        
        {/* Navegação: Scroll horizontal no mobile, vertical no PC */}
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 p-3 md:p-6 no-scrollbar scroll-smooth items-center md:items-stretch">
          <NavLink href={`/${lang}/superadmin/parceiros`} active={pathname.includes('/parceiros')} text="🤝 Gestão de Parceiros" />
          <NavLink href={`/${lang}/superadmin/contratos`} active={pathname.includes('/contratos')} text="📋 Contratos Recebidos" />
          <NavLink href={`/${lang}/superadmin/campos`} active={pathname.includes('/campos')} text="🏕️ Todos os Campos" />
          <NavLink href={`/${lang}/superadmin/faturacao`} active={pathname.includes('/faturacao')} text="💰 Faturação Global" />
          <NavLink href={`/${lang}/superadmin/emails`} active={pathname.includes('/emails')} text="📧 Email Marketing" />
          
          {/* Botão de Sair no mobile */}
          <button onClick={handleLogout} className="md:hidden flex-shrink-0 flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold text-red-400 bg-gray-800 border border-gray-700 hover:bg-gray-700 ml-2 transition-colors">
            Sair
          </button>
        </nav>

        {/* Rodapé da Sidebar exclusivo para PC */}
        <div className="p-6 border-t border-gray-800 hidden md:block mt-auto">
          <button onClick={handleLogout} className="w-full p-3 bg-transparent border border-gray-700 text-white rounded-lg cursor-pointer font-bold text-sm hover:bg-gray-800 transition-colors">
            Sair da Administração
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DO SUPERADMIN */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        
        {/* Header Superior Mobile (Opcional, para manter a consistência) */}
        <header className="md:hidden bg-white px-4 py-3 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-sm font-black text-slate-900 m-0">
            HelloCamp <span className="text-amber-500">HQ</span>
          </h2>
          <Link href={`/${lang}`} className="text-xs font-bold text-emerald-600 no-underline">
            Ver Site ↗
          </Link>
        </header>

        {/* Conteúdo da Página */}
        <div className="p-4 md:p-8 overflow-y-auto w-full box-border">
          {children}
        </div>
      </main>

    </div>
  );
}

// Subcomponente de navegação do SuperAdmin
function NavLink({ href, active, text }: { href: string, active: boolean, text: string }) {
  return (
    <Link 
      href={href} 
      className={`
        px-5 py-2.5 md:py-3 rounded-full md:rounded-xl text-sm whitespace-nowrap transition-all flex-shrink-0
        ${active ? 'bg-gray-800 text-white font-bold' : 'text-gray-400 font-semibold hover:bg-gray-800 hover:text-white'}
      `}
    >
      {text}
    </Link>
  );
}
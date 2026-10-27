"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

function NavLink({
  href,
  active,
  icon,
  text,
  badge,
}: {
  href: string;
  active: boolean;
  icon: string;
  text: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest no-underline transition-all whitespace-nowrap ${
        active
          ? "bg-[#2563eb] text-white shadow-md"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className="text-base">{icon}</span>
        <span>{text}</span>
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-[#e2a41d] text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full ml-2">
          {badge}
        </span>
      )}
    </Link>
  );
}

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
  const isEn = lang === "en";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const verifyMonitor = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${lang}/monitores/login`);
        return;
      }

      setUser(session.user);

      const { count } = await supabase
        .from("mensagens_recrutamento")
        .select("*", { count: "exact", head: true })
        .eq("monitor_id", session.user.id)
        .eq("remetente", "parceiro")
        .eq("lida", false);

      setUnreadCount(count || 0);
      setLoading(false);
    };

    verifyMonitor();
  }, [router, lang, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}`);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-[#2563eb] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row w-full bg-slate-50 font-sans min-h-screen">
      <aside className="w-full md:w-[280px] bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col flex-shrink-0 z-20 shadow-sm md:shadow-none">
        <div className="p-6 md:p-8 border-b border-slate-100 hidden md:block">
          <h2 className="text-xl font-black m-0 text-slate-900 tracking-tight">
            Portal do <span className="text-[#2563eb]">Monitor</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 mb-0">
            Bolsa de Talentos
          </p>
        </div>

        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 p-3 md:p-6 no-scrollbar items-center md:items-stretch">
          <NavLink
            href={`/${lang}/monitores/portal/perfil`}
            active={pathname.includes("/perfil")}
            icon="🧑‍🏫"
            text={isEn ? "My Profile" : "O Meu Perfil"}
          />
          <NavLink
            href={`/${lang}/monitores/portal/mensagens`}
            active={pathname.includes("/mensagens")}
            icon="💬"
            text={isEn ? "Job Offers" : "Propostas"}
            badge={unreadCount}
          />
          <NavLink
            href={`/${lang}/pesquisa`}
            active={false}
            icon="🏕️"
            text={isEn ? "Explore Camps" : "Explorar Campos"}
          />

          <button
            type="button"
            onClick={handleLogout}
            className="md:hidden flex-shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-red-500 bg-red-50 border border-red-100 ml-2 cursor-pointer"
          >
            {isEn ? "Logout" : "Sair"}
          </button>
        </nav>

        <div className="p-6 border-t border-slate-100 hidden md:block mt-auto bg-slate-50/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 truncate">
            {user?.email}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full p-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm cursor-pointer"
          >
            {isEn ? "Logout" : "Terminar Sessão"}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 w-full box-border overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
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
}: {
  href: string;
  active: boolean;
  icon: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-3 rounded-xl text-xs uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-3 no-underline flex-shrink-0 ${
        active
          ? "bg-[#e2a41d] text-slate-950 font-black shadow-md"
          : "text-slate-400 font-bold hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="text-base">{icon}</span>
      <span>{text}</span>
    </Link>
  );
}

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
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const checkSuperAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${lang}/login`);
        return;
      }

      setUserEmail(session.user.email || "");
      setLoading(false);
    };

    checkSuperAdmin();
  }, [lang, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}/login`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">
        A carregar HelloCamp Master HQ...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 font-sans">
      {/* SIDEBAR ESCURA HQ */}
      <aside className="w-full md:w-[260px] bg-slate-950 text-white flex flex-col flex-shrink-0 z-20 shadow-xl">
        <div className="p-6 border-b border-slate-800 hidden md:block">
          <h2 className="text-2xl font-black m-0 tracking-tight flex items-center">
            <span className="text-white">Hello</span>
            <span className="text-[#e2a41d]">Camp</span>
          </h2>
          <span className="inline-block text-[10px] font-black text-[#e2a41d] bg-[#e2a41d]/10 border border-[#e2a41d]/20 px-2.5 py-0.5 rounded-md mt-2 uppercase tracking-widest">
            SuperAdmin HQ
          </span>
        </div>

        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 p-3 md:p-5 no-scrollbar items-center md:items-stretch">
          <NavLink
            href={`/${lang}/superadmin/parceiros`}
            active={pathname.includes("/parceiros")}
            icon="🏢"
            text="Parceiros B2B"
          />
          <NavLink
            href={`/${lang}/superadmin/contratos`}
            active={pathname.includes("/contratos")}
            icon="📝"
            text="Contratos Globais"
          />
          <NavLink
            href={`/${lang}/superadmin/campos`}
            active={pathname.includes("/campos")}
            icon="🏕️"
            text="Campos & Comissões"
          />
          <NavLink
            href={`/${lang}/superadmin/faturacao`}
            active={pathname.includes("/faturacao")}
            icon="💶"
            text="Tesouraria & Reembolsos"
          />
          <NavLink
            href={`/${lang}/superadmin/emails`}
            active={pathname.includes("/emails")}
            icon="📧"
            text="Email Broadcast"
          />

          <button
            type="button"
            onClick={handleLogout}
            className="md:hidden flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-black uppercase bg-red-500/20 text-red-300 border border-red-500/30 cursor-pointer"
          >
            Sair
          </button>
        </nav>

        <div className="p-5 border-t border-slate-800 hidden md:block mt-auto">
          <p className="text-[11px] font-bold text-slate-400 mb-3 truncate">
            {userEmail}
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/${lang}`}
              target="_blank"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-center rounded-xl text-xs font-bold no-underline border border-slate-800"
            >
              Ver Site Público ↗
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-900/50 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-colors"
            >
              Terminar Sessão
            </button>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full box-border">
        {children}
      </main>
    </div>
  );
}
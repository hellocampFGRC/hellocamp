"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

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
  const isEn = lang === "en";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${lang}/login`);
        return;
      }

      setUser(session.user);

      const { count } = await supabase
        .from("mensagens")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", session.user.id)
        .eq("lida", false);

      setUnreadMsgs(count || 0);
      setLoading(false);
    };

    checkSession();
  }, [lang, router, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}`);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xs uppercase tracking-widest animate-pulse">
        {isEn ? "Loading Family Portal..." : "A carregar Portal da Família..."}
      </div>
    );
  }

  const navItems = [
    {
      href: `/${lang}/cliente/dashboard`,
      active: pathname.includes("/dashboard"),
      icon: "🏕️",
      label: isEn ? "My Bookings" : "As Minhas Reservas",
    },
    {
      href: `/${lang}/cliente/criancas`,
      active: pathname.includes("/criancas"),
      icon: "👦",
      label: isEn ? "My Children" : "Os Meus Filhos",
    },
    {
      href: `/${lang}/cliente/mensagens`,
      active: pathname.includes("/mensagens"),
      icon: "💬",
      label: isEn ? "Messages" : "Mensagens",
      badge: unreadMsgs,
    },
    {
      href: `/${lang}/cliente/favoritos`,
      active: pathname.includes("/favoritos"),
      icon: "❤️",
      label: isEn ? "Wishlists" : "Favoritos",
    },
    {
      href: `/${lang}/cliente/perfil`,
      active: pathname.includes("/perfil"),
      icon: "🛡️",
      label: isEn ? "Profile & Security" : "Perfil e Segurança",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* SUB-NAVEGAÇÃO DO PORTAL DOS PAIS */}
      <div className="bg-white border-b border-slate-200 sticky top-16 md:top-20 z-30 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-3">
          <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap no-underline transition-all ${
                  item.active
                    ? "bg-[#0E3A68] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-[#e2a41d] text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 cursor-pointer whitespace-nowrap transition-colors"
          >
            {isEn ? "Logout" : "Sair"}
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA PÁGINA */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-8 pb-20">
        {children}
      </div>
    </div>
  );
}
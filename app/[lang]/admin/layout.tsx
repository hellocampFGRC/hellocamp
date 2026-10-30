"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPartnerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const pathname = usePathname();
  const router = useRouter();

  const [empresaNome, setEmpresaNome] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [statusContrato, setStatusContrato] = useState<string>("Pendente");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadPartnerInfo = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${lang}/login`);
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      const [{ data: perfil }, { count }] = await Promise.all([
        supabase
          .from("perfis")
          .select("empresa_nome, nome_empresa, nome, nome_completo, status_contrato")
          .eq("id", uid)
          .maybeSingle(),
        supabase
          .from("mensagens")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", uid)
          .eq("lida", false),
      ]);

      if (perfil) {
        setEmpresaNome(
          perfil.empresa_nome ||
            perfil.nome_empresa ||
            perfil.nome ||
            perfil.nome_completo ||
            (isEn ? "Partner" : "Parceiro")
        );
        setStatusContrato(perfil.status_contrato || "Pendente");
      }
      setUnreadCount(count || 0);
    };

    loadPartnerInfo();
  }, [lang, isEn, pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}/login`);
  };

  const navLinks = [
    {
      href: `/${lang}/admin/dashboard`,
      label: isEn ? "Dashboard" : "Painel Geral",
      icon: "📊",
    },
    {
      href: `/${lang}/admin/campos`,
      label: isEn ? "My Camps" : "Os Meus Campos",
      icon: "🏕️",
    },
    {
      href: `/${lang}/admin/reservas`,
      label: isEn ? "Bookings & Kids" : "Inscrições & Fichas",
      icon: "📋",
    },
    {
      href: `/${lang}/admin/inbox`,
      label: isEn ? "Messages" : "Mensagens",
      icon: "💬",
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      href: `/${lang}/admin/faturacao`,
      label: isEn ? "Finance & Stripe" : "Finanças & Stripe",
      icon: "💰",
    },
    {
      href: `/${lang}/admin/contrato`,
      label: isEn ? "Global Contract" : "Contrato Global",
      icon: "📝",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] flex flex-col md:flex-row">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-[#0F172A] text-white flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* LOGO HELLO CAMP */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <Link
              href={`/${lang}`}
              className="text-2xl font-black tracking-tight no-underline flex items-center"
            >
              <span className="text-white">Hello</span>
              <span className="text-[#F59E0B]">Camp</span>
              <span className="ml-2 bg-[#2563EB] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                B2B
              </span>
            </Link>
          </div>

          {/* INFO DA ENTIDADE */}
          <div className="p-5 border-b border-slate-800 bg-slate-900/60">
            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
              {isEn ? "Organizer Account" : "Entidade Organizadora"}
            </span>
            <div className="font-black text-sm text-white truncate">
              {empresaNome || "..."}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md text-white ${
                  statusContrato === "Aprovado"
                    ? "bg-[#16A34A]"
                    : "bg-[#F59E0B]"
                }`}
              >
                {statusContrato === "Aprovado"
                  ? isEn
                    ? "✓ Verified"
                    : "✓ Verificado"
                  : isEn
                  ? "⏳ Pending"
                  : "⏳ Pendente"}
              </span>
              {userId && (
                <Link
                  href={`/${lang}/parceiro/${userId}?preview=admin`}
                  target="_blank"
                  className="text-[10px] font-black text-[#F59E0B] hover:underline no-underline"
                >
                  {isEn ? "Public Page ↗" : "Ver Montra ↗"}
                </Link>
              )}
            </div>
          </div>

          {/* NAVEGAÇÃO PRINCIPAL */}
          <nav className="p-4 space-y-1.5">
            {navLinks.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== `/${lang}/admin/dashboard` &&
                  pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-md text-xs font-black uppercase tracking-wider no-underline transition-colors ${
                    isActive
                      ? "bg-[#2563EB] text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="bg-[#F43F5E] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RODAPÉ DA SIDEBAR */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href={`/${lang}/admin/campos/novo`}
            className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest py-3 px-4 rounded-md no-underline transition-colors shadow-sm"
          >
            <span>+</span>
            <span>{isEn ? "New Camp" : "Criar Novo Campo"}</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-[#F43F5E] hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest py-2.5 px-4 rounded-md cursor-pointer border-0 transition-colors"
          >
            {isEn ? "Sign Out" : "Terminar Sessão"}
          </button>
        </div>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden bg-[#0F172A] text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <Link
          href={`/${lang}/admin/dashboard`}
          className="text-xl font-black tracking-tight no-underline flex items-center"
        >
          <span className="text-white">Hello</span>
          <span className="text-[#F59E0B]">Camp</span>
          <span className="ml-2 bg-[#2563EB] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
            B2B
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-[#2563EB] text-white px-3 py-2 rounded-md text-xs font-black uppercase tracking-widest border-0 cursor-pointer"
        >
          {mobileMenuOpen ? "✕" : "☰ Menu"}
        </button>
      </header>

      {/* MENU MOBILE EXPANDIDO */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0F172A] text-white px-4 pt-2 pb-6 border-b border-slate-800 space-y-2 z-30">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-md text-xs font-black uppercase tracking-wider no-underline ${
                  isActive
                    ? "bg-[#2563EB] text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {item.badge && (
                  <span className="bg-[#F43F5E] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2 flex gap-2">
            <Link
              href={`/${lang}/admin/campos/novo`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center bg-[#16A34A] text-white font-black text-xs uppercase tracking-widest py-3 rounded-md no-underline"
            >
              + {isEn ? "New Camp" : "Novo Campo"}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-[#F43F5E] text-white font-black text-xs uppercase tracking-widest px-4 py-3 rounded-md border-0 cursor-pointer"
            >
              {isEn ? "Exit" : "Sair"}
            </button>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
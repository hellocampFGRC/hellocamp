"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SupportedLang = "pt" | "en" | "es" | "fr" | "de";

const SUPPORTED_LANGS: SupportedLang[] = ["pt", "en", "es", "fr", "de"];

const TRANSLATIONS: Record<
  SupportedLang,
  {
    partnerFallback: string;
    dashboard: string;
    profile: string;
    camps: string;
    bookings: string;
    messages: string;
    finance: string;
    contract: string;
    organizerAccount: string;
    verified: string;
    pending: string;
    publicPage: string;
    newCamp: string;
    newCampMobile: string;
    signOut: string;
    exit: string;
    languageLabel: string;
  }
> = {
  pt: {
    partnerFallback: "Parceiro",
    dashboard: "Painel Geral",
    profile: "Perfil & Montra",
    camps: "Os Meus Campos",
    bookings: "Inscrições & Fichas",
    messages: "Mensagens",
    finance: "Finanças & Stripe",
    contract: "Contrato Global",
    organizerAccount: "Entidade Organizadora",
    verified: "✓ Verificado",
    pending: "⏳ Pendente",
    publicPage: "Ver Montra ↗",
    newCamp: "Criar Novo Campo",
    newCampMobile: "Novo Campo",
    signOut: "Terminar Sessão",
    exit: "Sair",
    languageLabel: "Idioma do Portal",
  },
  en: {
    partnerFallback: "Partner",
    dashboard: "Dashboard",
    profile: "Profile & Showcase",
    camps: "My Camps",
    bookings: "Bookings & Kids",
    messages: "Messages",
    finance: "Finance & Stripe",
    contract: "Global Contract",
    organizerAccount: "Organizer Account",
    verified: "✓ Verified",
    pending: "⏳ Pending",
    publicPage: "Public Page ↗",
    newCamp: "New Camp",
    newCampMobile: "New Camp",
    signOut: "Sign Out",
    exit: "Exit",
    languageLabel: "Portal Language",
  },
  es: {
    partnerFallback: "Socio",
    dashboard: "Panel General",
    profile: "Perfil y Escaparate",
    camps: "Mis Campamentos",
    bookings: "Reservas y Fichas",
    messages: "Mensajes",
    finance: "Finanzas y Stripe",
    contract: "Contrato Global",
    organizerAccount: "Entidad Organizadora",
    verified: "✓ Verificado",
    pending: "⏳ Pendiente",
    publicPage: "Ver Página ↗",
    newCamp: "Crear Campamento",
    newCampMobile: "Nuevo",
    signOut: "Cerrar Sesión",
    exit: "Salir",
    languageLabel: "Idioma del Portal",
  },
  fr: {
    partnerFallback: "Partenaire",
    dashboard: "Tableau de Bord",
    profile: "Profil & Vitrine",
    camps: "Mes Camps",
    bookings: "Inscriptions & Fiches",
    messages: "Messages",
    finance: "Finances & Stripe",
    contract: "Contrat Global",
    organizerAccount: "Compte Organisateur",
    verified: "✓ Vérifié",
    pending: "⏳ En attente",
    publicPage: "Page Publique ↗",
    newCamp: "Nouveau Camp",
    newCampMobile: "Nouveau",
    signOut: "Déconnexion",
    exit: "Quitter",
    languageLabel: "Langue du Portail",
  },
  de: {
    partnerFallback: "Partner",
    dashboard: "Übersicht",
    profile: "Profil & Schaufenster",
    camps: "Meine Camps",
    bookings: "Buchungen & Teilnehmer",
    messages: "Nachrichten",
    finance: "Finanzen & Stripe",
    contract: "Globaler Vertrag",
    organizerAccount: "Veranstalterkonto",
    verified: "✓ Verifiziert",
    pending: "⏳ Ausstehend",
    publicPage: "Öffentliche Seite ↗",
    newCamp: "Neues Camp",
    newCampMobile: "Neu",
    signOut: "Abmelden",
    exit: "Beenden",
    languageLabel: "Portalsprache",
  },
};

// Mapeia o texto gravado na BD ("Português, Inglês...") para códigos suportados
function detectLangFromCampStrings(linguasArray: string[]): SupportedLang | null {
  const joined = linguasArray.join(" ").toLowerCase();
  if (joined.includes("portugu")) return "pt";
  if (joined.includes("espanh") || joined.includes("span")) return "es";
  if (joined.includes("franc") || joined.includes("fren")) return "fr";
  if (joined.includes("alem") || joined.includes("germ")) return "de";
  if (joined.includes("ingl") || joined.includes("engl")) return "en";
  return null;
}

export default function AdminPartnerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const pathname = usePathname();
  const router = useRouter();

  // Normaliza o idioma: se não for pt, es, fr, de ou en -> força 'en'
  const normalizedLang: SupportedLang = SUPPORTED_LANGS.includes(
    lang?.toLowerCase() as SupportedLang
  )
    ? (lang.toLowerCase() as SupportedLang)
    : "en";

  const t = TRANSLATIONS[normalizedLang] || TRANSLATIONS.en;

  const [empresaNome, setEmpresaNome] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [statusContrato, setStatusContrato] = useState<string>("Pendente");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Troca de idioma mantendo a rota atual
  const handleLanguageSwitch = (targetLang: SupportedLang) => {
    if (!pathname) {
      router.push(`/${targetLang}/admin/dashboard`);
      return;
    }
    const segments = pathname.split("/");
    segments[1] = targetLang;
    router.push(segments.join("/"));
  };

  useEffect(() => {
    const loadPartnerInfo = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${normalizedLang}/login`);
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      const [{ data: perfil }, { count }, { data: camposParceiro }] =
        await Promise.all([
          supabase
            .from("perfis")
            .select(
              "empresa_nome, nome_empresa, nome, nome_completo, status_contrato"
            )
            .eq("id", uid)
            .maybeSingle(),
          supabase
            .from("mensagens")
            .select("*", { count: "exact", head: true })
            .eq("receiver_id", uid)
            .eq("lida", false),
          supabase
            .from("campos")
            .select("linguas_faladas")
            .eq("organizador_id", uid),
        ]);

      if (perfil) {
        setEmpresaNome(
          perfil.empresa_nome ||
            perfil.nome_empresa ||
            perfil.nome ||
            perfil.nome_completo ||
            t.partnerFallback
        );
        setStatusContrato(perfil.status_contrato || "Pendente");
      }
      setUnreadCount(count || 0);

      // Se a URL vier num idioma não suportado (ex: /it/admin ou /nl/admin),
      // tenta detetar pelos campos do parceiro ou redireciona para /en/
      if (!SUPPORTED_LANGS.includes(lang?.toLowerCase() as SupportedLang)) {
        const linguasCampos = (camposParceiro || [])
          .map((c) => c.linguas_faladas)
          .filter(Boolean);
        const detected = detectLangFromCampStrings(linguasCampos) || "en";
        handleLanguageSwitch(detected);
      }
    };

    loadPartnerInfo();
  }, [lang, normalizedLang, pathname, router, t.partnerFallback]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${normalizedLang}/login`);
  };

  const navLinks = [
    {
      href: `/${normalizedLang}/admin/dashboard`,
      label: t.dashboard,
      icon: "📊",
    },
    {
      href: `/${normalizedLang}/admin/perfil`,
      label: t.profile,
      icon: "🏢",
    },
    {
      href: `/${normalizedLang}/admin/campos`,
      label: t.camps,
      icon: "🏕️",
    },
    {
      href: `/${normalizedLang}/admin/reservas`,
      label: t.bookings,
      icon: "📋",
    },
    {
      href: `/${normalizedLang}/admin/inbox`,
      label: t.messages,
      icon: "💬",
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      href: `/${normalizedLang}/admin/faturacao`,
      label: t.finance,
      icon: "💰",
    },
    {
      href: `/${normalizedLang}/admin/contrato`,
      label: t.contract,
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
              href={`/${normalizedLang}`}
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
              {t.organizerAccount}
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
                {statusContrato === "Aprovado" ? t.verified : t.pending}
              </span>
              {userId && (
                <Link
                  href={`/${normalizedLang}/parceiro/${userId}?preview=admin`}
                  target="_blank"
                  className="text-[10px] font-black text-[#F59E0B] hover:underline no-underline"
                >
                  {t.publicPage}
                </Link>
              )}
            </div>
          </div>

          {/* NAVEGAÇÃO PRINCIPAL */}
          <nav className="p-4 space-y-1.5">
            {navLinks.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== `/${normalizedLang}/admin/dashboard` &&
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
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* SELETOR DE IDIOMA (PT / EN / ES / FR / DE) */}
          <div className="bg-slate-900/80 p-2.5 rounded-md border border-slate-800">
            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 text-center">
              🌐 {t.languageLabel}
            </span>
            <div className="grid grid-cols-5 gap-1">
              {SUPPORTED_LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLanguageSwitch(code)}
                  className={`py-1.5 rounded text-[10px] font-black uppercase cursor-pointer border-0 transition-colors ${
                    normalizedLang === code
                      ? "bg-[#2563EB] text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <Link
            href={`/${normalizedLang}/admin/campos/novo`}
            className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest py-3 px-4 rounded-md no-underline transition-colors shadow-sm"
          >
            <span>+</span>
            <span>{t.newCamp}</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-[#F43F5E] hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest py-2.5 px-4 rounded-md cursor-pointer border-0 transition-colors"
          >
            {t.signOut}
          </button>
        </div>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden bg-[#0F172A] text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <Link
          href={`/${normalizedLang}/admin/dashboard`}
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

          {/* SELETOR DE IDIOMA MOBILE */}
          <div className="pt-2">
            <div className="grid grid-cols-5 gap-1.5 bg-slate-900 p-2 rounded-md">
              {SUPPORTED_LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLanguageSwitch(code);
                  }}
                  className={`py-2 rounded text-xs font-black uppercase cursor-pointer border-0 ${
                    normalizedLang === code
                      ? "bg-[#2563EB] text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <Link
              href={`/${normalizedLang}/admin/campos/novo`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center bg-[#16A34A] text-white font-black text-xs uppercase tracking-widest py-3 rounded-md no-underline"
            >
              + {t.newCampMobile}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-[#F43F5E] text-white font-black text-xs uppercase tracking-widest px-4 py-3 rounded-md border-0 cursor-pointer"
            >
              {t.exit}
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
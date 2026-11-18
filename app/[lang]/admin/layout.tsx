"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SupportedLang = "pt" | "en" | "es" | "fr" | "de";

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
    menu: string;
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
    menu: "☰ Menu",
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
    menu: "☰ Menu",
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
    newCampMobile: "Nuevo Camp",
    signOut: "Cerrar Sesión",
    exit: "Salir",
    menu: "☰ Menú",
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
    newCamp: "Créer un Camp",
    newCampMobile: "Nouveau Camp",
    signOut: "Déconnexion",
    exit: "Quitter",
    menu: "☰ Menu",
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
    newCamp: "Neues Camp erstellen",
    newCampMobile: "Neues Camp",
    signOut: "Abmelden",
    exit: "Beenden",
    menu: "☰ Menü",
  },
};

function mapTextToSupportedLang(raw?: string | null): SupportedLang | null {
  if (!raw) return null;
  const val = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (!val) return null;

  // Códigos exatos (ex: "pt", "pt-pt", "es", "fr", "de", "en")
  if (val === "pt" || val.startsWith("pt-") || val.startsWith("pt_")) return "pt";
  if (val === "es" || val.startsWith("es-") || val.startsWith("es_")) return "es";
  if (val === "fr" || val.startsWith("fr-") || val.startsWith("fr_")) return "fr";
  if (val === "de" || val.startsWith("de-") || val.startsWith("de_")) return "de";
  if (val === "en" || val.startsWith("en-") || val.startsWith("en_")) return "en";

  // Nomes de idiomas ou países
  if (
    val.includes("portugu") ||
    val.includes("portugal") ||
    val.includes("brasil") ||
    val.includes("brazil")
  ) {
    return "pt";
  }
  if (
    val.includes("espanh") ||
    val.includes("espanol") ||
    val.includes("spanish") ||
    val.includes("spain") ||
    val.includes("espana") ||
    val.includes("mexico") ||
    val.includes("argentina") ||
    val.includes("colombia")
  ) {
    return "es";
  }
  if (
    val.includes("franc") ||
    val.includes("french") ||
    val.includes("france") ||
    val.includes("belgica") ||
    val.includes("belgium")
  ) {
    return "fr";
  }
  if (
    val.includes("alem") ||
    val.includes("deutsch") ||
    val.includes("german") ||
    val.includes("germany") ||
    val.includes("austria") ||
    val.includes("osterreich")
  ) {
    return "de";
  }
  if (
    val.includes("ingl") ||
    val.includes("engl") ||
    val.includes("uk") ||
    val.includes("united kingdom") ||
    val.includes("reino unido") ||
    val.includes("usa") ||
    val.includes("estados unidos") ||
    val.includes("united states") ||
    val.includes("irlanda") ||
    val.includes("ireland") ||
    val.includes("south africa") ||
    val.includes("africa do sul")
  ) {
    return "en";
  }

  return null;
}

function detectPartnerLang(perfil: any, campos: any[]): SupportedLang {
  // 1. Prioridade: campo de idioma explícito no perfil
  const fromPerfilIdioma = mapTextToSupportedLang(
    perfil?.idioma || perfil?.lingua || perfil?.language
  );
  if (fromPerfilIdioma) return fromPerfilIdioma;

  // 2. País definido no perfil
  const fromPerfilPais = mapTextToSupportedLang(
    perfil?.pais || perfil?.pais_empresa || perfil?.country
  );
  if (fromPerfilPais) return fromPerfilPais;

  // 3. País ou idiomas falados nos campos do parceiro
  if (Array.isArray(campos) && campos.length > 0) {
    for (const campo of campos) {
      const fromCampoPais = mapTextToSupportedLang(campo?.pais);
      if (fromCampoPais) return fromCampoPais;
    }
    for (const campo of campos) {
      const fromCampoLinguas = mapTextToSupportedLang(campo?.linguas_faladas);
      if (fromCampoLinguas) return fromCampoLinguas;
    }
  }

  // 4. Tudo o que não for pt, es, fr ou de mostra em Inglês
  return "en";
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

  // Valor inicial temporário até o perfil carregar; depois assume automaticamente o idioma do parceiro
  const [portalLang, setPortalLang] = useState<SupportedLang>(() => {
    return mapTextToSupportedLang(lang) || "en";
  });

  const [empresaNome, setEmpresaNome] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [statusContrato, setStatusContrato] = useState<string>("Pendente");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = TRANSLATIONS[portalLang] || TRANSLATIONS.en;

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

      const [{ data: perfil }, { count }, { data: camposParceiro }] =
        await Promise.all([
          supabase.from("perfis").select("*").eq("id", uid).maybeSingle(),
          supabase
            .from("mensagens")
            .select("*", { count: "exact", head: true })
            .eq("receiver_id", uid)
            .eq("lida", false),
          supabase
            .from("campos")
            .select("pais, linguas_faladas")
            .eq("organizador_id", uid),
        ]);

      const detectedLang = detectPartnerLang(perfil, camposParceiro || []);
      setPortalLang(detectedLang);

      if (perfil) {
        setEmpresaNome(
          perfil.empresa_nome ||
            perfil.nome_empresa ||
            perfil.nome ||
            perfil.nome_completo ||
            TRANSLATIONS[detectedLang].partnerFallback
        );
        setStatusContrato(perfil.status_contrato || "Pendente");
      }
      setUnreadCount(count || 0);
    };

    loadPartnerInfo();
  }, [lang, pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}/login`);
  };

  const navLinks = [
    {
      href: `/${lang}/admin/dashboard`,
      label: t.dashboard,
      icon: "📊",
    },
    {
      href: `/${lang}/admin/perfil`,
      label: t.profile,
      icon: "🏢",
    },
    {
      href: `/${lang}/admin/campos`,
      label: t.camps,
      icon: "🏕️",
    },
    {
      href: `/${lang}/admin/reservas`,
      label: t.bookings,
      icon: "📋",
    },
    {
      href: `/${lang}/admin/inbox`,
      label: t.messages,
      icon: "💬",
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      href: `/${lang}/admin/faturacao`,
      label: t.finance,
      icon: "💰",
    },
    {
      href: `/${lang}/admin/contrato`,
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
                  href={`/${lang}/parceiro/${userId}?preview=admin`}
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
          {mobileMenuOpen ? "✕" : t.menu}
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
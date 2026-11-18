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

function normalizeStr(raw?: unknown): string {
  if (!raw) return "";
  return String(raw)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Mapeia um país explícito para um dos 5 idiomas (tudo o resto devolve "en")
function mapCountryToLang(rawCountry?: string | null): SupportedLang {
  const c = normalizeStr(rawCountry);

  if (/\b(portugal|brasil|brazil)\b/i.test(c)) return "pt";
  if (/\b(espanha|espana|spain|mexico|argentina|colombia|chile|peru|uruguai|uruguay)\b/i.test(c)) {
    return "es";
  }
  if (/\b(franca|france|belgica|belgium|luxemburgo|luxembourg)\b/i.test(c)) {
    return "fr";
  }
  if (/\b(alemanha|germany|deutschland|austria|osterreich)\b/i.test(c)) {
    return "de";
  }

  // Qualquer outro país (Reino Unido, EUA, África do Sul, Itália, Malta, etc.) -> Inglês
  return "en";
}

// Mapeia morada, cidade, distrito ou domínio de e-mail caso o país não esteja preenchido
function mapLocationOrEmailToLang(texto: string, email: string): SupportedLang | null {
  const t = normalizeStr(texto);
  const e = normalizeStr(email);

  if (
    /\b(portugal|lisboa|lisbon|porto|faro|algarve|coimbra|braga|santarem|setubal|aveiro|leiria|evora|beja|viseu|guarda|vila real|viana do castelo|braganca|castelo branco|portalegre|madeira|acores|cascais|sintra|oeiras|almada|amadora|matosinhos|anadia|brasil|brazil)\b/i.test(
      t
    ) ||
    e.endsWith(".pt") ||
    e.endsWith(".br")
  ) {
    return "pt";
  }

  if (
    /\b(espanha|espana|spain|madrid|barcelona|valencia|sevilla|sevilha|malaga|bilbao|alicante|galiza|galicia|vigo|salamanca|andalucia|catalunya|lanzarote|tenerife|canarias|ibiza|mallorca|marbella)\b/i.test(
      t
    ) ||
    e.endsWith(".es")
  ) {
    return "es";
  }

  if (
    /\b(franca|france|paris|lyon|marseille|toulouse|nice|bordeaux|lille|nantes|strasbourg|geneve|lausanne|bruxelas|brussels|bruxelles)\b/i.test(
      t
    ) ||
    e.endsWith(".fr")
  ) {
    return "fr";
  }

  if (
    /\b(alemanha|germany|deutschland|berlin|munich|munchen|hamburg|frankfurt|koln|cologne|stuttgart|dusseldorf|austria|osterreich|vienna|wien|zurich|basel|bern)\b/i.test(
      t
    ) ||
    e.endsWith(".de") ||
    e.endsWith(".at")
  ) {
    return "de";
  }

  return null;
}

function detectPartnerLang(perfil: any, campos: any[]): SupportedLang {
  // 1. Prioridade máxima: coluna `pais` / `pais_en` dos campos do parceiro
  if (Array.isArray(campos) && campos.length > 0) {
    const campoComPais = campos.find((c) => c?.pais || c?.pais_en);
    if (campoComPais) {
      return mapCountryToLang(campoComPais.pais || campoComPais.pais_en);
    }

    // Se os campos não tiverem país preenchido, tenta pelo Distrito / local
    const locaisTexto = campos
      .map((c) => `${c?.local || ""} ${c?.Distrito || ""}`)
      .join(" ");
    const fromLocais = mapLocationOrEmailToLang(locaisTexto, "");
    if (fromLocais) return fromLocais;
  }

  // 2. Fallback pelo perfil do parceiro (morada_sede e extensão de email)
  const moradaPerfil = perfil?.morada_sede || "";
  const emailPerfil = perfil?.email_publico || perfil?.email || "";
  const fromPerfil = mapLocationOrEmailToLang(moradaPerfil, emailPerfil);
  if (fromPerfil) return fromPerfil;

  // 3. Tudo o resto (outros países ou sem localização definida) -> Inglês
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

  // Estado inicial provisório até o perfil/campos carregarem
  const [portalLang, setPortalLang] = useState<SupportedLang>(() => {
    const urlLang = normalizeStr(lang);
    if (
      urlLang === "pt" ||
      urlLang === "es" ||
      urlLang === "fr" ||
      urlLang === "de" ||
      urlLang === "en"
    ) {
      return urlLang;
    }
    return "en";
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
            .select('pais, pais_en, local, "Distrito"')
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
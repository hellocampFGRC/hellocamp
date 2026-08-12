"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AuthButton({ lang }: { lang: string; dict: any }) {
  const isEn = lang === 'en';
  
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || 'cliente');
      }
      setLoading(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || 'cliente');
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  if (loading) {
    return <div className="w-24 h-10 bg-gray-50 rounded-lg animate-pulse"></div>;
  }

  // CASE 1: Utilizador é um PARCEIRO / ORGANIZADOR (Dashboard Cinza/Escuro)
  if (user && role === 'organizador') {
    return (
      <Link href={`/${lang}/admin/dashboard`} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold text-sm no-underline transition whitespace-nowrap">
        {isEn ? 'Partner Dashboard' : 'Painel de Parceiro'}
      </Link>
    );
  }

  // CASE 2: Utilizador é um MONITOR (Portal Azul)
  if (user && role === 'monitor') {
    return (
      <Link href={`/${lang}/monitores/portal/perfil`} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm no-underline transition whitespace-nowrap">
        {isEn ? 'Monitor Portal' : 'Portal do Monitor'}
      </Link>
    );
  }

  // CASE 3: Utilizador é um PAI / CLIENTE (Portal dos Pais Verde)
  if (user) {
    return (
      <Link href={`/${lang}/cliente/dashboard`} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm no-underline transition whitespace-nowrap">
        {isEn ? 'Parent Dashboard' : 'Portal dos Pais'}
      </Link>
    );
  }

  // CASE 4: Sem Sessão -> Botões de Entrada Clean
  return (
    <div className="flex items-center gap-4">
      <Link href={`/${lang}/login`} className="text-sm font-bold text-slate-700 hover:text-emerald-700 no-underline transition whitespace-nowrap hidden sm:block">
        {isEn ? 'Log in' : 'Entrar'}
      </Link>
      <Link href={`/${lang}/registo`} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm no-underline transition whitespace-nowrap">
        {isEn ? 'Sign Up' : 'Registar'}
      </Link>
    </div>
  );
}
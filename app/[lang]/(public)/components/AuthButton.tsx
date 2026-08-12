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
    return <div className="w-20 h-8 bg-slate-50 rounded-lg animate-pulse"></div>;
  }

  if (user) {
    const dashboardLink = role === 'organizador' ? 'admin/dashboard' : (role === 'monitor' ? 'monitores/portal/perfil' : 'cliente/dashboard');
    return (
      <Link href={`/${lang}/${dashboardLink}`} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-colors">
        {isEn ? 'Dashboard' : 'Painel'}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/${lang}/login`} className="text-sm font-bold text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-full transition-colors hidden sm:block">
        {isEn ? 'Log in' : 'Entrar'}
      </Link>
      <Link href={`/${lang}/registo`} className="bg-[#EBA914] hover:bg-amber-500 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-colors shadow-sm">
        {isEn ? 'Sign up' : 'Registar'}
      </Link>
    </div>
  );
}
"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function UnsubscribeContent({ lang }: { lang: string }) {
  const isEn = lang === "en";
  const searchParams = useSearchParams();
  const leadId = searchParams.get("id");
  const emailParam = searchParams.get("email");

  const [emailInput, setEmailInput] = useState(emailParam || "");
  const [loading, setLoading] = useState(false);
  const [concluido, setConcluido] = useState(false);

  const processarRemocao = async (idToRemove?: string | null, emailToRemove?: string | null) => {
    setLoading(true);
    try {
      // 1. Se vier de um e-mail B2B Outreach (?id=...)
      if (idToRemove) {
        const { data: lead } = await supabase
          .from("leads_externas")
          .select("email_cliente")
          .eq("id", idToRemove)
          .maybeSingle();

        await supabase
          .from("leads_externas")
          .update({ unsubscribed: true })
          .eq("id", idToRemove);

        if (lead?.email_cliente) {
          await supabase
            .from("unsubscribes")
            .upsert([{ email: lead.email_cliente.toLowerCase().trim() }]);
        }
      }

      // 2. Se vier de um Broadcast (?email=...) ou input manual
      if (emailToRemove && emailToRemove.trim()) {
        const cleanEmail = emailToRemove.toLowerCase().trim();
        await supabase.from("unsubscribes").upsert([{ email: cleanEmail }]);
        await supabase
          .from("leads_externas")
          .update({ unsubscribed: true })
          .ilike("email_cliente", cleanEmail);
      }

      setConcluido(true);
    } catch (e) {
      console.error(e);
      setConcluido(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId || emailParam) {
      processarRemocao(leadId, emailParam);
    }
  }, [leadId, emailParam]);

  return (
    <div className="bg-white max-w-md w-full p-8 border border-slate-200 rounded-md shadow-sm text-center">
      <div className="text-2xl font-black tracking-tight mb-6">
        <span className="text-[#0E3A68]">Hello</span>
        <span className="text-[#e2a41d]">Camp</span>
      </div>

      {concluido ? (
        <>
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-[#167524] rounded-md flex items-center justify-center text-xl mx-auto mb-4 font-black">
            ✓
          </div>
          <h1 className="text-xl font-black text-slate-900 m-0 mb-2">
            {isEn ? "Successfully Unsubscribed" : "Subscrição Cancelada"}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            {isEn
              ? "Your email address has been removed from our mailing list. You will no longer receive marketing communications."
              : "O seu endereço de e-mail foi removido da nossa lista de comunicações comerciais."}
          </p>
          <Link
            href={`/${lang}`}
            className="inline-block bg-slate-900 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-md no-underline"
          >
            {isEn ? "Back to Website" : "Voltar ao Site"}
          </Link>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            processarRemocao(leadId, emailInput);
          }}
          className="space-y-4"
        >
          <h1 className="text-xl font-black text-slate-900 m-0">
            {isEn ? "Unsubscribe from Emails" : "Remover E-mail da Lista"}
          </h1>
          <p className="text-xs text-slate-500">
            {isEn
              ? "Confirm your email address below to stop receiving communications:"
              : "Confirme o seu endereço de e-mail abaixo para deixar de receber comunicações:"}
          </p>
          <input
            type="email"
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="nome@empresa.pt"
            className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-md text-sm font-bold text-slate-900 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-md cursor-pointer"
          >
            {loading
              ? "..."
              : isEn
              ? "Confirm Unsubscribe"
              : "Confirmar Remoção"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function UnsubscribePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <Suspense fallback={<div className="text-xs font-bold">...</div>}>
        <UnsubscribeContent lang={lang} />
      </Suspense>
    </main>
  );
}
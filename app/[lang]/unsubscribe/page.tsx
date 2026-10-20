"use client";

import { useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import React, { use } from "react";

function UnsubscribeContent({ lang }: { lang: string }) {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const isEn = lang === 'en';
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleUnsubscribe = async () => {
    if (!id) return;
    setStatus('loading');
    
    const { error } = await supabase.rpc('remover_lead_email', { p_id: id });
    
    if (error) {
      setStatus('error');
    } else {
      setStatus('success');
    }
  };

  if (!id) return <div className="text-center p-10 font-bold text-slate-500">ID não encontrado.</div>;

  return (
      <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 text-center font-sans">
        {status === 'success' ? (
            <>
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">✓</div>
              <h1 className="text-2xl font-black text-slate-900 mb-3">{isEn ? 'Unsubscribed Successfully' : 'Removido com Sucesso'}</h1>
              <p className="text-sm font-medium text-slate-500">{isEn ? 'You will no longer receive our partnership emails.' : 'O seu e-mail foi removido e já não receberá as nossas comunicações de parceria.'}</p>
            </>
        ) : (
            <>
              <div className="w-20 h-20 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">📬</div>
              <h1 className="text-2xl font-black text-slate-900 mb-3">{isEn ? 'Unsubscribe from HelloCamp' : 'Remover o meu E-mail'}</h1>
              <p className="text-sm font-medium text-slate-500 mb-8">{isEn ? 'Are you sure you want to stop receiving our emails?' : 'Tem a certeza que deseja deixar de receber os nossos e-mails de prospeção e parceria?'}</p>
              
              {status === 'error' && (
                <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl mb-6">Erro ao remover. Tente novamente.</p>
              )}

              <button 
                onClick={handleUnsubscribe} 
                disabled={status === 'loading'}
                className="w-full bg-slate-900 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-md hover:-translate-y-0.5"
              >
                {status === 'loading' ? (isEn ? 'Processing...' : 'A processar...') : (isEn ? 'Confirm Unsubscribe' : 'Confirmar Remoção')}
              </button>
            </>
        )}
      </div>
  );
}

export default function UnsubscribePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <Suspense fallback={<div className="text-center p-20 font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">A preparar página...</div>}>
        <UnsubscribeContent lang={lang} />
      </Suspense>
    </div>
  );
}
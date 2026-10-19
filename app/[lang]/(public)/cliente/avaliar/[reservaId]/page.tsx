"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function PaginaAvaliacao({ params }: { params: Promise<{ lang: string; reservaId: string }> }) {
  const { lang, reservaId } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [reserva, setReserva] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submetendo, setSubmetendo] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    const fetchReserva = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/${lang}/login`);
        return;
      }

      // Verifica se a reserva existe e pertence a este pai
      const { data, error } = await supabase
        .from("reservas")
        .select(`id, campo_id, criancas(nome), campos(nome, nome_en)`)
        .eq("id", reservaId)
        .eq("cliente_id", session.user.id)
        .single();

      if (error || !data) {
        setErro(isEn ? "Reservation not found." : "Reserva não encontrada.");
        setLoading(false);
        return;
      }

      // Verifica se já avaliou
      const { data: reviewExistente } = await supabase
        .from("reviews")
        .select("id")
        .eq("campo_id", data.campo_id)
        .eq("user_id", session.user.id)
        .single();

      if (reviewExistente) {
        setSucesso(true); 
      } else {
        setReserva(data);
      }
      
      setLoading(false);
    };
    fetchReserva();
  }, [reservaId, lang, router]);

  const submeterAvaliacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmetendo(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !reserva) return;

    // 1. Inserir a Review
    await supabase.from("reviews").insert([{
      campo_id: reserva.campo_id,
      user_id: session.user.id,
      rating: rating,
      comentario: comentario,
      nome_pai: session.user.user_metadata?.full_name || "Anónimo"
    }]);

    // 2. Recalcular a Média do Campo
    const { data: todasReviews } = await supabase.from("reviews").select("rating").eq("campo_id", reserva.campo_id);
    if (todasReviews) {
      const total = todasReviews.length;
      const soma = todasReviews.reduce((acc, curr) => acc + curr.rating, 0);
      const media = soma / total;

      await supabase.from("campos").update({
        rating_score: media,
        total_reviews: total
      }).eq("id", reserva.campo_id);
    }

    setSucesso(true);
    setSubmetendo(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 animate-pulse">{isEn ? 'Loading...' : 'A verificar dados...'}</div>;
  if (erro) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-red-500">{erro}</div>;

  if (sucesso) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-10 md:p-14 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 text-center max-w-md w-full animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner border border-emerald-100">
            ✓
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">{isEn ? 'Thank you!' : 'Muito Obrigado!'}</h1>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">{isEn ? 'Your review helps other parents make the best decision for their children.' : 'A sua avaliação foi submetida e vai ajudar outros pais a tomar a melhor decisão no próximo verão.'}</p>
          <Link href={`/${lang}/cliente/dashboard`} className="px-8 py-4 bg-[#0E3A68] text-white text-[11px] font-black uppercase tracking-widest rounded-xl block w-full no-underline hover:bg-[#0b2b4d] transition-all shadow-md hover:-translate-y-1">
            {isEn ? 'Back to Dashboard' : 'Voltar ao Meu Dashboard'}
          </Link>
        </div>
      </main>
    );
  }

  const nomeCampo = isEn && reserva.campos.nome_en ? reserva.campos.nome_en : reserva.campos.nome;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 max-w-xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="text-center mb-10">
          <span className="text-[10px] font-black text-[#e2a41d] uppercase tracking-widest bg-[#e2a41d]/10 px-4 py-1.5 rounded-full">{isEn ? 'Rate your experience' : 'Avalie a experiência'}</span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-6 mb-2 tracking-tight">{nomeCampo}</h1>
          <p className="text-slate-500 font-medium text-sm">{isEn ? 'Participant:' : 'Participante:'} <span className="text-slate-900 font-black">{reserva.criancas.nome}</span></p>
        </div>

        <form onSubmit={submeterAvaliacao} className="flex flex-col gap-10">
          
          {/* SISTEMA DE ESTRELAS INTERATIVO */}
          <div className="flex flex-col items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{isEn ? 'Overall Rating' : 'Classificação Geral'}</label>
            <div className="flex gap-2 md:gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  type="button" 
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-5xl md:text-6xl transition-transform hover:scale-110 focus:outline-none leading-none"
                  style={{ color: star <= (hoverRating || rating) ? '#e2a41d' : '#e2e8f0', textShadow: star <= (hoverRating || rating) ? '0 4px 10px rgba(226, 164, 29, 0.3)' : 'none' }}
                >
                  ★
                </button>
              ))}
            </div>
            {rating === 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-[#e2a41d] mt-2 animate-pulse">{isEn ? 'Select a rating to continue' : 'Clique nas estrelas para pontuar'}</p>}
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{isEn ? 'Write a review (Optional)' : 'Escreva um comentário (Opcional)'}</label>
            <textarea 
              value={comentario} 
              onChange={e => setComentario(e.target.value)} 
              placeholder={isEn ? "How was the experience? What did your child like the most?" : "Como correu a experiência? A equipa de monitores foi simpática? O que o seu filho gostou mais?"}
              className="w-full p-5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white resize-none h-36 transition-colors shadow-inner"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={rating === 0 || submetendo} 
            className={`w-full py-4 rounded-xl text-sm uppercase tracking-widest font-black transition-all ${rating === 0 || submetendo ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-[#0E3A68] text-white shadow-xl shadow-[#0E3A68]/20 hover:bg-[#0b2b4d] hover:-translate-y-1 cursor-pointer'}`}
          >
            {submetendo ? (isEn ? 'Submitting...' : 'A enviar avaliação...') : (isEn ? 'Submit Review' : 'Enviar Avaliação')}
          </button>

        </form>
      </div>
    </main>
  );
}
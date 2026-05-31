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
        .eq("user_id", session.user.id)
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
        setSucesso(true); // Já avaliou, mostra logo a mensagem de sucesso
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

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">{isEn ? 'Loading...' : 'A carregar...'}</div>;
  if (erro) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-red-500">{erro}</div>;

  if (sucesso) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">{isEn ? 'Thank you!' : 'Obrigado!'}</h1>
          <p className="text-slate-500 mb-8">{isEn ? 'Your review helps other parents make the best decision.' : 'A sua avaliação ajuda outros pais a tomar a melhor decisão.'}</p>
          <Link href={`/${lang}/cliente/mensagens`} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl block w-full no-underline hover:bg-slate-800 transition-colors">
            {isEn ? 'Back to Dashboard' : 'Voltar ao Dashboard'}
          </Link>
        </div>
      </main>
    );
  }

  const nomeCampo = isEn && reserva.campos.nome_en ? reserva.campos.nome_en : reserva.campos.nome;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 max-w-xl w-full">
        
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{isEn ? 'Rate your experience' : 'Avalie a experiência'}</span>
          <h1 className="text-3xl font-black text-slate-900 mt-2 mb-1">{nomeCampo}</h1>
          <p className="text-slate-500 font-medium text-sm">{isEn ? 'Participant:' : 'Participante:'} <span className="text-slate-800 font-bold">{reserva.criancas.nome}</span></p>
        </div>

        <form onSubmit={submeterAvaliacao} className="flex flex-col gap-8">
          
          {/* SISTEMA DE ESTRELAS INTERATIVO */}
          <div className="flex flex-col items-center gap-3">
            <label className="text-sm font-bold text-slate-900">{isEn ? 'Overall Rating' : 'Classificação Geral'}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  type="button" 
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-5xl transition-transform hover:scale-110 focus:outline-none"
                  style={{ color: star <= (hoverRating || rating) ? '#EBA914' : '#e2e8f0' }}
                >
                  ★
                </button>
              ))}
            </div>
            {rating === 0 && <p className="text-xs text-amber-600 font-bold mt-2">{isEn ? 'Select a rating to continue' : 'Selecione uma pontuação para avançar'}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{isEn ? 'Write a review (Optional)' : 'Escreva um comentário (Opcional)'}</label>
            <textarea 
              value={comentario} 
              onChange={e => setComentario(e.target.value)} 
              placeholder={isEn ? "How was the experience? What did your child like the most?" : "Como correu a experiência? O que o seu filho gostou mais?"}
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:border-emerald-500 resize-none h-32"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={rating === 0 || submetendo} 
            className={`w-full py-4 rounded-xl text-lg font-black transition-all ${rating === 0 || submetendo ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#EBA914] hover:bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:-translate-y-1'}`}
          >
            {submetendo ? (isEn ? 'Submitting...' : 'A enviar...') : (isEn ? 'Submit Review' : 'Enviar Avaliação')}
          </button>

        </form>
      </div>
    </main>
  );
}
"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AvaliarExperienciaPage({
  params,
}: {
  params: Promise<{ lang: string; reservaId: string }>;
}) {
  const { lang, reservaId } = use(params);
  const isEn = lang === "en";

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [reserva, setReserva] = useState<any>(null);
  const [nomePai, setNomePai] = useState("Encarregado de Educação");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [submetendo, setSubmetendo] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    const carregarReserva = async () => {
      const { data: resData, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("id", reservaId)
        .maybeSingle();

      if (error || !resData) {
        setErro(
          isEn ? "Booking not found." : "Reserva não encontrada para avaliação."
        );
        setLoading(false);
        return;
      }

      const [{ data: campoData }, { data: criancaData }, { data: perfilData }] =
        await Promise.all([
          supabase
            .from("campos")
            .select("id, nome, nome_en")
            .eq("id", resData.campo_id)
            .maybeSingle(),
          supabase
            .from("criancas")
            .select("nome")
            .eq("id", resData.crianca_id)
            .maybeSingle(),
          supabase
            .from("perfis")
            .select("nome_completo")
            .eq("id", resData.cliente_id)
            .maybeSingle(),
        ]);

      setNomePai(
        resData.nome_encarregado ||
          perfilData?.nome_completo ||
          "Encarregado de Educação"
      );
      setReserva({
        ...resData,
        campos: campoData || { id: resData.campo_id, nome: "Programa HelloCamp" },
        criancas: criancaData || { nome: "Participante" },
      });
      setLoading(false);
    };

    carregarReserva();
  }, [reservaId, isEn]);

  const submeterAvaliacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !reserva) return;
    setSubmetendo(true);

    try {
      const { error } = await supabase.from("reviews").insert([
        {
          campo_id: reserva.campo_id,
          reserva_id: reserva.id,
          nome_pai: nomePai,
          rating: rating,
          comentario: comentario.trim(),
        },
      ]);
      if (error) throw error;

      // Recalcula e atualiza automaticamente o rating_score e total_reviews do campo!
      const { data: todasReviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("campo_id", reserva.campo_id);

      if (todasReviews && todasReviews.length > 0) {
        const total = todasReviews.length;
        const soma = todasReviews.reduce(
          (acc, curr) => acc + (Number(curr.rating) || 0),
          0
        );
        const media = Number((soma / total).toFixed(2));

        await supabase
          .from("campos")
          .update({ rating_score: media, total_reviews: total })
          .eq("id", reserva.campo_id);
      }

      setSucesso(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmetendo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-bold text-slate-400 animate-pulse">
        {isEn ? "Loading..." : "A verificar dados..."}
      </div>
    );
  }
  if (erro) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-black text-red-500">
        {erro}
      </div>
    );
  }

  if (sucesso) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-10 md:p-14 rounded-[2rem] shadow-xl border border-slate-100 text-center max-w-md w-full">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 border border-emerald-100">
            ✓
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
            {isEn ? "Thank you!" : "Muito Obrigado!"}
          </h1>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">
            {isEn
              ? "Your review helps other parents make the best decision for their children."
              : "A sua avaliação foi publicada e vai ajudar outras famílias na escolha do campo ideal."}
          </p>
          <Link
            href={`/${lang}/cliente/dashboard`}
            className="px-8 py-4 bg-[#0E3A68] text-white text-xs font-black uppercase tracking-widest rounded-xl block w-full no-underline hover:bg-[#0b2b4d] transition-all shadow-md"
          >
            {isEn ? "Back to Dashboard" : "Voltar às Minhas Reservas"}
          </Link>
        </div>
      </main>
    );
  }

  const nomeCampo =
    isEn && reserva.campos?.nome_en
      ? reserva.campos.nome_en
      : reserva.campos?.nome;

  return (
    <main className="flex items-center justify-center py-10 px-4 font-sans">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-slate-200 max-w-xl w-full">
        <div className="text-center mb-10">
          <span className="text-[10px] font-black text-[#e2a41d] uppercase tracking-widest bg-[#e2a41d]/10 px-4 py-1.5 rounded-full">
            {isEn ? "Rate your experience" : "Avalie a experiência"}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-6 mb-2 tracking-tight">
            {nomeCampo}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            {isEn ? "Participant:" : "Participante:"}{" "}
            <span className="text-slate-900 font-black">
              {reserva.criancas?.nome}
            </span>
          </p>
        </div>

        <form onSubmit={submeterAvaliacao} className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {isEn ? "Overall Rating" : "Classificação Geral"}
            </label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-5xl transition-transform hover:scale-110 bg-transparent border-0 cursor-pointer leading-none"
                  style={{
                    color:
                      star <= (hoverRating || rating) ? "#e2a41d" : "#e2e8f0",
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              {isEn
                ? "Write a review (Optional)"
                : "Escreva um comentário sobre o campo (Opcional)"}
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder={
                isEn
                  ? "How was the experience? What did your child like the most?"
                  : "Como correu a experiência? A equipa de monitores foi atenciosa? O que o seu filho mais gostou?"
              }
              className="w-full p-5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white resize-none h-36"
            />
          </div>

          <button
            type="submit"
            disabled={rating === 0 || submetendo}
            className="w-full py-4 rounded-xl text-xs uppercase tracking-widest font-black bg-[#0E3A68] disabled:bg-slate-200 text-white shadow-lg cursor-pointer transition-all"
          >
            {submetendo
              ? isEn
                ? "Submitting..."
                : "A enviar avaliação..."
              : isEn
              ? "Submit Review"
              : "Publicar Avaliação"}
          </button>
        </form>
      </div>
    </main>
  );
}
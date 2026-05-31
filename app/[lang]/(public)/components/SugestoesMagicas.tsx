"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoFavorito from "../components/BotaoFavorito";

export default function SugestoesMagicas({ criancaId, lang }: { criancaId: string, lang: string }) {
  const isEn = lang === 'en';
  
  const [crianca, setCrianca] = useState<any>(null);
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSugestoes = async () => {
      setLoading(true);

      // 1. Vai buscar o perfil da criança
      const { data: perfilCrianca } = await supabase
        .from('criancas')
        .select('*')
        .eq('id', criancaId)
        .single();

      if (!perfilCrianca) {
        setLoading(false);
        return;
      }

      setCrianca(perfilCrianca);

      // Calcula a idade
      const hoje = new Date();
      const nascimento = new Date(perfilCrianca.data_nascimento);
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const m = hoje.getMonth() - nascimento.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }

      // 2. Procura campos mágicos (com base nos interesses ou distrito)
      let query = supabase.from('campos').select('*').not('contrato_parceiro_url', 'is', null);

      // Se a criança tiver interesses definidos (ex: ['Desporto', 'Artes & Criatividade'])
      if (perfilCrianca.interesses && perfilCrianca.interesses.length > 0) {
        query = query.in('categoria', perfilCrianca.interesses);
      }
      
      // Se tiver distrito preferencial
      if (perfilCrianca.distrito_preferencial) {
        query = query.ilike('Distrito', `%${perfilCrianca.distrito_preferencial}%`);
      }

      // Limita a 3 sugestões premium
      const { data: camposSugeridos } = await query.limit(3);
      setSugestoes(camposSugeridos || []);
      setLoading(false);
    };

    fetchSugestoes();
  }, [criancaId]);

  if (loading) return <div className="animate-pulse bg-slate-100 h-64 rounded-3xl w-full"></div>;
  if (!crianca || sugestoes.length === 0) return null; // Esconde se não houver magia possível ainda

  // Calcula idade novamente para o texto
  const idade = Math.floor((new Date().getTime() - new Date(crianca.data_nascimento).getTime()) / 31557600000);
  const interessePrincipal = crianca.interesses && crianca.interesses.length > 0 ? crianca.interesses[0] : '';

  // Texto Inteligente
  const textoMagico = isEn 
    ? `We noticed that ${crianca.nome} is turning ${idade} and loves ${interessePrincipal || 'adventure'}. Here are some perfect matches in ${crianca.distrito_preferencial || 'Portugal'}:`
    : `Vimos que o/a ${crianca.nome} tem ${idade} anos e adora ${interessePrincipal || 'aventura'}. Aqui estão sugestões perfeitas em ${crianca.distrito_preferencial || 'Portugal'}:`;

  return (
    <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-8 md:p-10 rounded-3xl shadow-xl relative overflow-hidden mb-12">
      {/* Decoração de fundo */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 text-emerald-500/10 text-9xl">✨</div>
      
      <div className="relative z-10 mb-8">
        <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block shadow-md">
          {isEn ? 'Magic Suggestions' : 'Sugestões Mágicas'}
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight max-w-2xl">
          {textoMagico}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
        {sugestoes.map((campo) => {
          const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
          const localVisivel = isEn && campo.local_en ? campo.local_en : (campo.Distrito || campo.local);

          return (
            <div key={campo.id} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col relative">
              <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10"><span className="sr-only">Ver {nomeVisivel}</span></Link>
              <div className="absolute top-3 right-3 z-20"><BotaoFavorito campoId={campo.id} /></div>

              <div className="h-40 w-full overflow-hidden relative">
                <img src={campo.imagem} alt={nomeVisivel} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">📍 {localVisivel}</span>
                <h3 className="text-base font-black text-slate-900 leading-tight mb-2">{nomeVisivel}</h3>
                <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-lg font-black text-emerald-600">{campo.preco}€</span>
                  <span className="text-xs font-bold text-[#EBA914]">{isEn ? 'Explore' : 'Explorar'} &rarr;</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
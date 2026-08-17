"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoPartilha from "../../components/BotaoPartilha";

// Helper para traduzir a categoria num ícone e cor visual (Design Premium)
const getCategoryStyle = (categoria: string) => {
  const cat = categoria?.toLowerCase() || '';
  if (cat.includes('ciência')) return { icon: '🔬', color: 'text-teal-600', bg: 'bg-teal-50' };
  if (cat.includes('desporto') || cat.includes('ativa')) return { icon: '⚽', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (cat.includes('natureza')) return { icon: '🍃', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  if (cat.includes('arte') || cat.includes('criativ')) return { icon: '🎭', color: 'text-purple-600', bg: 'bg-purple-50' };
  if (cat.includes('surf') || cat.includes('mar')) return { icon: '🌊', color: 'text-pink-600', bg: 'bg-pink-50' };
  if (cat.includes('aventura')) return { icon: '⛺', color: 'text-emerald-700', bg: 'bg-emerald-50' };
  return { icon: '⛵', color: 'text-emerald-600', bg: 'bg-emerald-50' };
};

const formatarData = (dataStr: string) => {
  if (!dataStr) return '';
  return new Date(dataStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function DetalheIniciativaPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [iniciativa, setIniciativa] = useState<any>(null);

  // Estados do Formulário (O form é genérico e envia e-mail para a HelloCamp/Câmara)
  const [form, setForm] = useState({ nomePai: "", emailPai: "", telefonePai: "", subprogramaId: "", mensagem: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    const fetchDetalhes = async () => {
      setLoading(true);
      // OTIMIZAÇÃO MAXIMA: Foreign Key Joins diretos + Campos Exatos. 1 Único Request.
      const { data, error } = await supabase
        .from('institucional_iniciativas')
        .select(`
          id, titulo, entidade_organizadora, descricao_html, imagem_capa_url, logotipo_url, distrito, concelho, idade_min_global, idade_max_global, data_inicio_global, data_fim_global, link_oficial,
          subprogramas:institucional_subprogramas(id, nome, categoria, idade_min, idade_max, data_inicio, data_fim, localizacao_resumo, telefone_contato, email_contato),
          locais:institucional_locais(id, nome, freguesia, imagem_url)
        `)
        .eq('id', id)
        .single();
      
      if (data) setIniciativa(data);
      if (error) console.error("Erro ao carregar detalhes:", error);
      setLoading(false);
    };
    fetchDetalhes();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // O teu tracking original
      const { error: dbError } = await supabase.from('leads_externas').insert([{
        campo_id: iniciativa.id,
        nome_cliente: form.nomePai,
        email_cliente: form.emailPai,
        telefone_cliente: form.telefonePai,
        turno_interesse: form.subprogramaId, // Gravamos o ID do Subprograma que escolheu
        preco_estimado: 0,
        detalhes_extra: `INSTITUCIONAL | Obs: ${form.mensagem}`
      }]);
      if (dbError) throw dbError;

      // Chama a tua API para envio de emails
      await fetch('/api/notificar-reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'institucional', lead: form, campoNome: iniciativa.titulo,
          parceiroEmail: 'info@hellocamp.pt', lang
        })
      });
      setSucesso(true);
    } catch (error: any) {
      alert("Erro ao enviar pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400 animate-pulse">A carregar detalhes oficiais...</div>;
  if (!iniciativa) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-2xl text-slate-800">Iniciativa não encontrada.</div>;

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      
      {/* 1. HERO BANNER */}
      <div className="relative h-[60vh] min-h-[450px] w-full bg-slate-900 flex items-end pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img loading="lazy" src={iniciativa.imagem_capa_url || '/og-image.jpg'} alt="Capa" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 w-full">
          <Link href={`/${lang}/institucional`} className="text-white/70 hover:text-white text-sm font-bold flex items-center gap-2 mb-6 transition-colors">
            &larr; {isEn ? 'Back to results' : 'Voltar aos resultados'}
          </Link>
          
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 max-w-4xl drop-shadow-md">
            {iniciativa.titulo}
          </h1>
          <p className="text-slate-200 text-lg md:text-xl font-medium max-w-2xl mb-8 line-clamp-2">
            {isEn ? 'Official leisure program promoted by ' : 'Programa oficial de ocupação de tempos livres promovido por '}
            <strong className="text-white">{iniciativa.entidade_organizadora}</strong>.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 text-white font-bold text-sm mb-4">
            <span className="flex items-center gap-2 border border-white/20 rounded-lg px-4 py-2 bg-slate-900/40 backdrop-blur-md">
              👶 {iniciativa.idade_min_global || 6} - {iniciativa.idade_max_global || 16} anos
            </span>
            <span className="flex items-center gap-2 border border-white/20 rounded-lg px-4 py-2 bg-slate-900/40 backdrop-blur-md">
              🗓️ {formatarData(iniciativa.data_inicio_global)} a {formatarData(iniciativa.data_fim_global)}
            </span>
            <span className="flex items-center gap-2 border border-white/20 rounded-lg px-4 py-2 bg-slate-900/40 backdrop-blur-md">
              📍 {iniciativa.concelho}, {iniciativa.distrito}
            </span>
          </div>
        </div>
      </div>

      {/* 2. MENU NAVEGAÇÃO STICKY */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 hidden md:block shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          {['Visão Geral', 'Programas Disponíveis', 'Locais', 'Inscrições'].map((tab, i) => (
            <div key={i} className={`py-4 text-sm font-bold cursor-pointer border-b-2 transition-colors ${i === 0 ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              {tab}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-10 px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-10 items-start w-full">
          
          {/* COLUNA ESQUERDA: CONTEÚDO */}
          <div className="flex-1 w-full flex flex-col gap-12">
            
            {/* Secção: Sobre o Programa (Descrição + Destaques) */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 m-0">{isEn ? 'About the Program' : 'Sobre o Programa'}</h2>
                <BotaoPartilha url={`https://www.hellocamp.pt/${lang}/institucional/${iniciativa.id}`} titulo={iniciativa.titulo} isEn={isEn} />
              </div>
              <div 
                className="text-slate-600 leading-relaxed text-base [&_p]:mb-4"
                dangerouslySetInnerHTML={{ __html: iniciativa.descricao_html || '<p>Informação oficial detalhada será disponibilizada em breve.</p>' }}
              />
              
              {/* Destaques visuais tipo "Cascais" */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                 <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm hover:border-emerald-200 transition-colors">
                   <span className="text-4xl block mb-3 text-emerald-500">🏃</span>
                   <p className="text-sm font-bold text-slate-700 leading-tight">Diversão & Aprendizagem</p>
                 </div>
                 <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm hover:border-emerald-200 transition-colors">
                   <span className="text-4xl block mb-3 text-emerald-500">🌳</span>
                   <p className="text-sm font-bold text-slate-700 leading-tight">Atividades ao Ar Livre</p>
                 </div>
                 <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm hover:border-emerald-200 transition-colors">
                   <span className="text-4xl block mb-3 text-emerald-500">🛡️</span>
                   <p className="text-sm font-bold text-slate-700 leading-tight">Segurança Total</p>
                 </div>
                 <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm hover:border-emerald-200 transition-colors">
                   <span className="text-4xl block mb-3 text-emerald-500">🤝</span>
                   <p className="text-sm font-bold text-slate-700 leading-tight">Inclusão & Bem-estar</p>
                 </div>
              </div>
            </section>

            {/* Secção: Subprogramas (A grelha de cartões internos) */}
            {iniciativa.subprogramas && iniciativa.subprogramas.length > 0 && (
              <section>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6">{isEn ? 'Available Subprograms' : 'Programas Disponíveis'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {iniciativa.subprogramas.map((sub: any) => {
                    const style = getCategoryStyle(sub.categoria);
                    return (
                      <div key={sub.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${style.bg} ${style.color}`}>
                            {style.icon}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900 leading-tight">{sub.nome}</h3>
                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{sub.categoria || 'Geral'}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="text-slate-400 w-5">🗓️</span> {formatarData(sub.data_inicio)} a {formatarData(sub.data_fim)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="text-slate-400 w-5">👶</span> {sub.idade_min || 6} - {sub.idade_max || 16} anos
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 line-clamp-1">
                            <span className="text-slate-400 w-5">📍</span> {sub.localizacao_resumo || 'Vários locais'}
                          </div>
                          {(sub.telefone_contato || sub.email_contato) && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 border-t border-slate-100 pt-2 mt-2">
                               <span className="text-slate-400 w-5">📞</span> <span className="text-xs font-medium">{sub.telefone_contato} • {sub.email_contato}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Secção: Locais (Pavilhões, Escolas) */}
            {iniciativa.locais && iniciativa.locais.length > 0 && (
              <section>
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 m-0">{isEn ? 'Locations' : 'Locais de Realização'}</h2>
                  <span className="text-sm font-bold text-emerald-600 cursor-pointer hover:underline">{isEn ? 'View all' : 'Ver todos os locais'}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {iniciativa.locais.map((local: any) => (
                    <div key={local.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                      <div className="h-32 bg-slate-100 w-full overflow-hidden">
                        <img loading="lazy" src={local.imagem_url || '/placeholder-local.jpg'} alt={local.nome} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </div>
                      <div className="p-4">
                        <h4 className="font-black text-slate-900 text-sm mb-1 leading-tight">{local.nome}</h4>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><span className="text-emerald-500">📍</span> {local.freguesia}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Informação Legal */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
              <span className="text-2xl text-blue-500 mt-1">ℹ️</span>
              <div>
                <h4 className="font-black text-blue-900 mb-1">Inscrição Oficial</h4>
                <p className="text-sm font-medium text-blue-800 leading-relaxed">
                  A inscrição nestes programas da {iniciativa.entidade_organizadora} é da total responsabilidade do Município/Junta. Utilize o formulário para registar interesse ou aceda ao link oficial para validar todas as normas de participação.
                </p>
                {iniciativa.link_oficial && (
                  <a href={iniciativa.link_oficial} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm font-bold text-blue-700 hover:text-blue-900 underline underline-offset-2">
                    Aceder ao Portal Oficial do Município &rarr;
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA: STICKY BOX & FORMULÁRIO */}
          <div className="w-full lg:w-[400px] flex-shrink-0 lg:sticky lg:top-24 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-lg text-slate-900 mb-5">Destaques Oficiais</h3>
              <ul className="space-y-4 text-sm font-medium text-slate-700">
                <li className="flex gap-3 items-start"><span className="text-emerald-500 text-lg leading-none">✓</span> Atividades desportivas, culturais e ambientais</li>
                <li className="flex gap-3 items-start"><span className="text-emerald-500 text-lg leading-none">✓</span> Monitores qualificados pelo IPDJ</li>
                <li className="flex gap-3 items-start"><span className="text-emerald-500 text-lg leading-none">✓</span> Seguro de acidentes pessoais incluído</li>
                <li className="flex gap-3 items-start"><span className="text-emerald-500 text-lg leading-none">✓</span> Transporte em alguns programas</li>
              </ul>
            </div>

            <div className="bg-emerald-700 p-6 md:p-8 rounded-2xl shadow-xl text-white">
              <h3 className="text-2xl font-black mb-3">Pronto para a inscrição?</h3>
              <p className="text-emerald-100 text-sm font-medium mb-6 leading-relaxed">
                Registe o seu interesse para os <strong>{iniciativa.titulo}</strong>. A entidade será notificada.
              </p>
              
              {sucesso ? (
                <div className="bg-white text-emerald-900 rounded-xl p-5 text-center shadow-inner">
                  <div className="text-3xl mb-2">✅</div>
                  <div className="font-black text-lg mb-1">Pedido Registado!</div>
                  <div className="text-xs font-medium text-slate-600">A entidade entrará em contacto consigo em breve.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input required type="text" placeholder="Nome Completo do Encarregado" value={form.nomePai} onChange={e => setForm({...form, nomePai: e.target.value})} className="w-full bg-white/10 border border-white/20 px-4 py-3.5 rounded-xl text-sm outline-none placeholder:text-white/60 focus:bg-white/20 font-medium" />
                  <div className="grid grid-cols-2 gap-3">
                    <input required type="email" placeholder="E-mail" value={form.emailPai} onChange={e => setForm({...form, emailPai: e.target.value})} className="w-full bg-white/10 border border-white/20 px-4 py-3.5 rounded-xl text-sm outline-none placeholder:text-white/60 focus:bg-white/20 font-medium" />
                    <input required type="tel" placeholder="Telefone" value={form.telefonePai} onChange={e => setForm({...form, telefonePai: e.target.value})} className="w-full bg-white/10 border border-white/20 px-4 py-3.5 rounded-xl text-sm outline-none placeholder:text-white/60 focus:bg-white/20 font-medium" />
                  </div>
                  
                  {iniciativa.subprogramas && iniciativa.subprogramas.length > 0 ? (
                    <select required value={form.subprogramaId} onChange={e => setForm({...form, subprogramaId: e.target.value})} className="w-full bg-white/10 border border-white/20 px-4 py-3.5 rounded-xl text-sm outline-none text-white focus:bg-emerald-800 cursor-pointer font-medium [&>option]:text-slate-900">
                      <option value="" disabled className="text-slate-400">Qual o programa pretendido?</option>
                      {iniciativa.subprogramas.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.nome} ({s.idade_min}-{s.idade_max} anos)</option>
                      ))}
                    </select>
                  ) : (
                    <input required type="text" placeholder="Qual o programa pretendido?" value={form.mensagem} onChange={e => setForm({...form, mensagem: e.target.value})} className="w-full bg-white/10 border border-white/20 px-4 py-3.5 rounded-xl text-sm outline-none placeholder:text-white/60 focus:bg-white/20 font-medium" />
                  )}

                  <button type="submit" disabled={submitting} className="w-full bg-white text-emerald-900 hover:bg-slate-100 font-black px-6 py-4 rounded-xl transition-transform shadow-md mt-4 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                    {submitting ? 'A Processar...' : 'Quero Inscrever o Meu Filho'}
                  </button>
                  <p className="text-center text-[10px] text-emerald-200 mt-3 font-medium">Saiba mais sobre o processo de inscrição &rarr;</p>
                </form>
              )}
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}
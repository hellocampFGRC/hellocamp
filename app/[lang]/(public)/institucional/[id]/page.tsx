"use client";

import React, { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoPartilha from "../../components/BotaoPartilha";

// ==========================================
// PÁGINA DINÂMICA: CÂMARAS E JUNTAS DE FREGUESIA
// Lê exclusivamente da tabela "programas_institucionais"
// ==========================================
export default function ProgramaInstitucionalPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [programa, setPrograma] = useState<any>(null);

  // Estados do Formulário de Inscrição / Tracking
  const [form, setForm] = useState({
    nomePai: "",
    emailPai: "",
    telefonePai: "",
    nomeCrianca: "",
    idadeCrianca: "",
    turno: "",
    mensagem: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    const fetchInstitucional = async () => {
      const { data, error } = await supabase.from('programas_institucionais').select('*').eq('id', id).single();
      
      if (data) {
        setPrograma(data);
        // Pre-selecionar o primeiro turno se a lista JSONB existir
        if (data.turnos_disponiveis && data.turnos_disponiveis.length > 0) {
          setForm(prev => ({ ...prev, turno: data.turnos_disponiveis[0] }));
        }
      }
      setLoading(false);
    };
    fetchInstitucional();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. GRAVAR NA BASE DE DADOS (O vosso Tracking para Faturação)
      const { error: dbError } = await supabase.from('leads_externas').insert([{
        campo_id: programa.id, // O ID agora é do Institucional
        nome_cliente: form.nomePai,
        email_cliente: form.emailPai,
        telefone_cliente: form.telefonePai,
        turno_interesse: form.turno,
        preco_estimado: 0, // Institucional
        detalhes_extra: `INSTITUCIONAL | Participante: ${form.nomeCrianca} (${form.idadeCrianca} anos) | Obs: ${form.mensagem}`
      }]);

      if (dbError) throw dbError;

      // 2. DISPARAR EMAIL PARA A CÂMARA/JUNTA COM A HELLOCAMP EM CC
      await fetch('/api/notificar-reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'institucional',
          lead: form,
          campoNome: programa.nome,
          parceiroEmail: programa.email_rececao_inscricoes || 'info@hellocamp.pt',
          lang
        })
      });

      setSucesso(true);
    } catch (error: any) {
      alert(isEn ? "Error submitting your request. Please try again." : "Erro ao enviar pedido. Tente novamente.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-sm animate-pulse bg-slate-50">A carregar programa institucional...</div>;
  }

  if (!programa || !programa.is_active) {
    return <div className="min-h-screen flex items-center justify-center font-black text-2xl text-slate-800 bg-slate-50">Programa não encontrado ou inativo.</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      
      {/* HEADER INSTITUCIONAL (Oficial e Limpo) */}
      <div className="bg-slate-900 border-b-4 border-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {programa.imagem_capa_url && <img src={programa.imagem_capa_url} alt="Capa" className="w-full h-full object-cover blur-sm" />}
        </div>
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative z-10 flex flex-col items-center text-center">
          <div className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md mb-6 shadow-sm">
            {isEn ? 'Public & Institutional Program' : 'Programa Institucional Público'}
          </div>
          
          {programa.logotipo_entidade_url && (
            <div className="w-20 h-20 bg-white rounded-2xl p-2 mb-6 shadow-lg">
              <img src={programa.logotipo_entidade_url} alt="Logo Entidade" className="w-full h-full object-contain" />
            </div>
          )}
          
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 max-w-4xl">
            {programa.nome}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-300 font-bold text-sm">
            <span className="flex items-center gap-1.5">📍 {programa.localizacao} {programa.distrito ? `(${programa.distrito})` : ''}</span>
            <span className="flex items-center gap-1.5">🏛️ {programa.entidade_organizadora}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          
          {/* COLUNA ESQUERDA: CONTEÚDO EDITORIAL */}
          <div className="flex-1 w-full flex flex-col gap-8">
            
            {/* DESCRIÇÃO RICH TEXT */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-xl font-black text-slate-900 m-0">
                  {isEn ? 'Program Details' : 'Detalhes do Programa'}
                </h2>
                <BotaoPartilha url={`https://www.hellocamp.pt/${lang}/institucional/${programa.id}`} titulo={programa.nome} isEn={isEn} />
              </div>

              {/* Renderiza diretamente o HTML formatado da Base de Dados */}
              <div 
                className="text-slate-700 leading-relaxed text-sm md:text-base [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_strong]:text-slate-900"
                dangerouslySetInnerHTML={{ __html: programa.descricao_html || '<p>Informação indisponível.</p>' }}
              />

              {programa.link_panfleto_oficial && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <a 
                    href={programa.link_panfleto_oficial} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition-colors"
                  >
                    📄 {isEn ? 'View Official Flyer / Rules' : 'Ver Panfleto Oficial / Regulamento'}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: FORMULÁRIO DE INSCRIÇÃO DIRETA (TRACKING) */}
          <div className="w-full lg:w-[420px] flex-shrink-0 lg:sticky lg:top-8 relative z-30">
            <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-slate-900 shadow-2xl relative overflow-hidden">
              
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-600"></div>

              <h3 className="text-2xl font-black text-slate-900 mb-2">
                {isEn ? 'Pre-Registration' : 'Pedido de Inscrição'}
              </h3>
              <p className="text-xs font-medium text-slate-500 mb-6 leading-relaxed">
                {isEn 
                  ? "Fill out the form below. Your request will be sent directly to the organizing entity for validation and payment instructions." 
                  : `Preencha os dados abaixo. O seu pedido será enviado diretamente para os serviços de ${programa.entidade_organizadora}, que o contactarão para validação e pagamento.`}
              </p>

              {sucesso ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
                  <h4 className="text-lg font-black text-emerald-900 mb-2">Pedido Enviado!</h4>
                  <p className="text-sm font-medium text-emerald-700 leading-relaxed">
                    A entidade organizadora recebeu os seus dados através da HelloCamp e entrará em contacto consigo em breve.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* DADOS DO ENCARREGADO */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1 mb-2">Dados do Encarregado</h4>
                    <div>
                      <input required type="text" placeholder={isEn ? "Full Name" : "Nome Completo do Pai/Mãe"} value={form.nomePai} onChange={e => setForm({...form, nomePai: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-slate-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input required type="email" placeholder="E-mail" value={form.emailPai} onChange={e => setForm({...form, emailPai: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-slate-500" />
                      <input required type="tel" placeholder="Telefone" value={form.telefonePai} onChange={e => setForm({...form, telefonePai: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-slate-500" />
                    </div>
                  </div>

                  {/* DADOS DO PARTICIPANTE */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1 mb-2">Dados do Participante</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <input required type="text" placeholder={isEn ? "Child's Name" : "Nome da Criança"} value={form.nomeCrianca} onChange={e => setForm({...form, nomeCrianca: e.target.value})} className="col-span-2 w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-slate-500" />
                      <input required type="number" placeholder="Idade" min="3" max="18" value={form.idadeCrianca} onChange={e => setForm({...form, idadeCrianca: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-slate-500 text-center" />
                    </div>
                  </div>

                  {/* TURNO E OBSERVAÇÕES */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1 mb-2">Programa / Turno</h4>
                    
                    {programa.turnos_disponiveis && programa.turnos_disponiveis.length > 0 ? (
                      <select required value={form.turno} onChange={e => setForm({...form, turno: e.target.value})} className="w-full bg-white border border-slate-300 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-slate-500 cursor-pointer shadow-sm">
                        <option value="" disabled>{isEn ? 'Select a shift/program...' : 'Selecione o Turno/Data...'}</option>
                        {programa.turnos_disponiveis.map((turnoStr: string, idx: number) => (
                          <option key={idx} value={turnoStr}>{turnoStr}</option>
                        ))}
                      </select>
                    ) : (
                      <input required type="text" placeholder={isEn ? "Which shift/dates do you want?" : "Qual o turno/datas que pretende?"} value={form.turno} onChange={e => setForm({...form, turno: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-slate-500" />
                    )}

                    <textarea rows={3} placeholder={isEn ? "Additional notes or questions..." : "Observações ou dúvidas..."} value={form.mensagem} onChange={e => setForm({...form, mensagem: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-slate-500 resize-none"></textarea>
                  </div>

                  <div className="pt-4">
                    <button type="submit" disabled={submitting} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-4 rounded-xl transition-all shadow-md disabled:opacity-50 uppercase tracking-widest text-xs">
                      {submitting ? (isEn ? 'Sending Request...' : 'A Enviar Pedido...') : (isEn ? 'Submit Request' : 'Enviar Pedido Oficial')}
                    </button>
                    <p className="text-center text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
                      🔒 Plataforma Segura HelloCamp
                    </p>
                  </div>

                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
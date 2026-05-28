import { supabase } from "../../../../../lib/supabase";
import Link from "next/link";
import CaixaReserva from "./CaixaReserva";
import BotaoFavorito from "../../components/BotaoFavorito";
import { getDictionary } from "../../../../../lib/getDictionary";

export default async function DetalhesDoCampo({ 
  params 
}: { 
  params: Promise<{ lang: string; id: string }> 
}) {
  const { lang, id } = await params;
  const dict = await getDictionary(lang as "pt" | "en");
  const isEn = lang === 'en';

  const { data: campo } = await supabase.from("campos").select("*").eq("id", id).single();

  if (!campo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center font-sans">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEn ? 'Camp not found' : 'Campo não encontrado'} 🕵️‍♂️
        </h1>
        <Link href={`/${lang}`} className="mt-4 font-semibold text-sky-600 hover:underline">
          &larr; {dict.detalhe.voltar_pesquisa}
        </Link>
      </div>
    );
  }

  const nomeCampo = isEn && campo.nome_en ? campo.nome_en : campo.nome;
  const descCampo = isEn && campo.descricao_en ? campo.descricao_en : campo.descricao;
  const catCampo = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
  const localCampo = isEn && campo.local_en ? campo.local_en : (isEn && campo.Distrito_en ? campo.Distrito_en : (campo.Distrito || campo.distrito || campo.local));
  const racioCampo = isEn && campo.racio_monitores_en ? campo.racio_monitores_en : campo.racio_monitores;
  const alimentacaoCampo = isEn && campo.alimentacao_en ? campo.alimentacao_en : campo.alimentacao;
  const alojamentoCampo = isEn && campo.alojamento_en ? campo.alojamento_en : campo.alojamento;
  const seguroCampo = isEn && campo.seguro_en ? campo.seguro_en : campo.seguro;
  const regrasCampo = isEn && campo.regras_termos_en ? campo.regras_termos_en : campo.regras_termos;

  const formatarDataExtenso = (dStr: string) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    return d.toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { day: 'numeric', month: 'long' });
  };

  return (
    <main className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">

      <div style={{ position: 'relative', width: '100%', height: '580px', backgroundColor: '#111827', overflow: 'hidden' }}>
        <img src={campo.imagem} alt={nomeCampo} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 100%)' }}></div>

        <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 30 }}>
          <Link href={`/${lang}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '9999px', backgroundColor: '#ffffff', padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)', textDecoration: 'none' }}>
            <svg style={{ width: '1rem', height: '1rem', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            {dict.detalhe.voltar_pesquisa}
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', paddingTop: '2.5rem', paddingBottom: '2.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', alignItems: 'flex-start', width: '100%' }}>
          
          <div style={{ flex: '1 1 60%', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-sky-50 px-4 py-1.5 text-xs font-bold text-sky-700 uppercase tracking-widest border border-sky-100">{catCampo}</span>
                  <span className="text-sm font-bold text-gray-400">📍 {localCampo}</span>
                </div>
                {/* BOTÃO DO CORAÇÃO */}
                <div>
                  <BotaoFavorito campoId={campo.id} />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">{nomeCampo}</h1>
            </div>

            {/* DESCRIÇÃO DO PROGRAMA */}
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-50 pb-3">{dict.detalhe.sobre_programa}</h2>
              <p className="leading-relaxed text-gray-500 text-base whitespace-pre-wrap">{descCampo}</p>
            </div>

            {/* DOCUMENTOS EM DESTAQUE LOGO APÓS A DESCRIÇÃO */}
            {campo.programas_pdf && campo.programas_pdf.length > 0 && (
              <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-50 pb-3">{isEn ? 'Camp Documents' : 'Documentos do Programa'}</h2>
                <div className="flex flex-col gap-3">
                  {campo.programas_pdf.map((doc: any, idx: number) => (
                    <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200" style={{ textDecoration: 'none' }}>
                      <span className="font-bold text-gray-700 text-sm">📄 {doc.nome}</span>
                      <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">{isEn ? 'Download' : 'Descarregar'} &darr;</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* REGRAS E TERMOS */}
            {regrasCampo && (
              <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-50 pb-3">{isEn ? 'Specific Rules & Terms' : 'Regras e Termos Específicos'}</h2>
                <p className="leading-relaxed text-gray-500 text-sm whitespace-pre-wrap">{regrasCampo}</p>
              </div>
            )}

            {/* DATAS E DISPONIBILIDADE (COM VAGAS POR TURNO) */}
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">{dict.detalhe.datas_disponibilidade}</h2>
              <div className="bg-sky-50/50 rounded-2xl p-5 border border-sky-100">
                {campo.turnos && campo.turnos.length > 0 ? (
                  <ul style={{ display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none' }}>
                    {campo.turnos.map((t: any, idx: number) => (
                      <li key={idx} style={{ paddingBottom: idx !== campo.turnos.length - 1 ? '1rem' : '0', marginBottom: idx !== campo.turnos.length - 1 ? '1rem' : '0', borderBottom: idx !== campo.turnos.length - 1 ? '1px solid #e0f2fe' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151', fontSize: '15px', fontWeight: 600 }}>
                          <span style={{ color: '#0ea5e9', fontSize: '1.5rem', lineHeight: 1 }}>•</span>
                          <span>{t.nome}: <span style={{ fontWeight: 'normal' }}>{formatarDataExtenso(t.data_inicio)} {isEn ? 'to' : 'a'} {formatarDataExtenso(t.data_fim)}</span></span>
                        </div>
                        <div style={{ marginLeft: '1.75rem', marginTop: '0.35rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>
                            👥 Vagas: {t.vagas || 'N/A'}
                          </span>
                          {t.permite_dias && (
                            <span style={{ fontSize: '13px', color: '#059669', fontWeight: 'bold' }}>
                              ↳ {isEn ? 'Available per day' : 'Também disponível por dias soltos'} ({t.preco_dia}€ / {isEn ? 'day' : 'dia'})
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 font-medium text-sm whitespace-pre-wrap">{campo.datas_disponiveis || dict.detalhe.definir_atualizacoes}</p>
                )}
              </div>
            </div>

            {/* INFORMAÇÕES IMPORTANTES */}
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{dict.detalhe.informacoes_importantes}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-2xl">👥</span>
                  <div><h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1">{dict.detalhe.racio_monitores}</h4><p className="text-sm font-semibold text-gray-700">{racioCampo || dict.detalhe.sob_consulta}</p></div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-2xl">🍎</span>
                  <div><h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1">{dict.detalhe.alimentacao}</h4><p className="text-sm font-semibold text-gray-700">{alimentacaoCampo || dict.detalhe.sob_consulta}</p></div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-2xl">🏕️</span>
                  <div><h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1">{dict.detalhe.alojamento}</h4><p className="text-sm font-semibold text-gray-700">{alojamentoCampo || dict.detalhe.nao_inclui_dormida}</p></div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-2xl">🛡️</span>
                  <div><h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1">{dict.detalhe.seguros}</h4><p className="text-sm font-semibold text-gray-700">{seguroCampo || dict.detalhe.sob_consulta}</p></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{dict.detalhe.duvidas_titulo}</h3>
              <p className="text-sm text-gray-400 mb-8">{dict.detalhe.duvidas_sub}</p>
              
              <form action="https://formsubmit.co/info@hellocamp.com" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_subject" value={`${isEn ? 'Question regarding HelloCamp:' : 'Dúvida sobre o campo HelloCamp:'} ${nomeCampo}`} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={labelStyle}>{dict.detalhe.nome}</label>
                    <input type="text" name={isEn ? 'First_Name' : 'Nome'} style={inputStyle} required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={labelStyle}>{dict.detalhe.apelido}</label>
                    <input type="text" name={isEn ? 'Last_Name' : 'Apelido'} style={inputStyle} required />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={labelStyle}>{dict.detalhe.email_encarregado}</label>
                    <input type="email" name="Email" style={inputStyle} required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={labelStyle}>{dict.detalhe.contacto_telefonico}</label>
                    <input type="tel" name={isEn ? 'Phone' : 'Telefone'} style={inputStyle} required />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={labelStyle}>{dict.detalhe.idade_participante}</label>
                  <input type="number" name={isEn ? 'Age' : 'Idade'} min="1" style={inputStyle} required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={labelStyle}>{dict.detalhe.mensagem}</label>
                  <textarea name={isEn ? 'Message' : 'Mensagem'} rows={4} style={{ ...inputStyle, resize: 'none' } as React.CSSProperties} required></textarea>
                </div>
                
                <button type="submit" className="w-full sm:w-auto bg-gray-900 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-gray-800 transition-colors text-sm shadow-sm" style={{ alignSelf: 'flex-start' }}>
                  {dict.detalhe.enviar_mensagem}
                </button>
              </form>
            </div>
          </div>

          <div style={{ flex: '1 1 30%', minWidth: '320px', position: 'sticky', top: '2rem' }}>
            <CaixaReserva campo={campo} lang={lang} dict={dict} />
          </div>
        </div>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' };
const inputStyle: React.CSSProperties = { borderRadius: '1rem', border: '1px solid #d1d5db', backgroundColor: 'rgba(249,250,251,0.8)', padding: '0.875rem 1.25rem', fontSize: '0.875rem', color: '#1f2937', outline: 'none', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', width: '100%', boxSizing: 'border-box' };
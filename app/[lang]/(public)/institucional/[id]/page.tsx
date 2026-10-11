"use client";

import React, { useState, useEffect, use, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import BotaoPartilha from "../../components/BotaoPartilha";

// ==========================================
// FALLBACK DE IMAGEM
// ==========================================
const FALLBACK_COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Crect fill='%231e293b' width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='48' font-weight='bold' fill='%23475569' text-anchor='middle' dy='.3em'%3EHelloCamp%3C/text%3E%3C/svg%3E";

const FALLBACK_LOCAL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23e2e8f0' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' font-weight='bold' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3ELocal%3C/text%3E%3C/svg%3E";

// ==========================================
// ÍCONES SVG INLINE (zero emojis)
// ==========================================
const IconArrowLeft = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconArrowRight = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconCheck = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconInfo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconUsers = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconCalendar = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconMapPin = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconPhone = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconShield = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconHandshake = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 17l-1.5 1.5a2.12 2.12 0 0 1-3 0l-3-3a2.12 2.12 0 0 1 0-3L6.5 9.5" />
    <path d="M13 7l1.5-1.5a2.12 2.12 0 0 1 3 0l3 3a2.12 2.12 0 0 1 0 3L17.5 14.5" />
    <path d="M8 12l4-4" />
    <path d="M12 12l4 4" />
  </svg>
);

const IconRun = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13" cy="4" r="2" />
    <path d="M4 22l3-6 4-2-1-5 5 3 3-1" />
    <path d="M8 16l-2 6" />
    <path d="M14 10l2 5 4 2" />
  </svg>
);

const IconLeaf = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6" />
  </svg>
);

// Categoria → ícone SVG + cor
const getCategoryStyle = (categoria: string) => {
  const cat = categoria?.toLowerCase() || '';
  if (cat.includes('ciência') || cat.includes('tecnolog')) return { icon: 'science', color: 'text-teal-600', bg: 'bg-teal-50' };
  if (cat.includes('desporto') || cat.includes('ativa')) return { icon: 'sport', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (cat.includes('natureza') || cat.includes('ambiente')) return { icon: 'nature', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  if (cat.includes('arte') || cat.includes('criativ')) return { icon: 'art', color: 'text-purple-600', bg: 'bg-purple-50' };
  if (cat.includes('surf') || cat.includes('mar')) return { icon: 'wave', color: 'text-pink-600', bg: 'bg-pink-50' };
  if (cat.includes('aventura')) return { icon: 'adventure', color: 'text-emerald-700', bg: 'bg-emerald-50' };
  return { icon: 'default', color: 'text-emerald-600', bg: 'bg-emerald-50' };
};

const CategoryIcon = ({ type, className = "w-7 h-7" }: { type: string; className?: string }) => {
  switch (type) {
    case 'science':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-10V3" />
          <line x1="7" y1="3" x2="17" y2="3" />
          <path d="M6.5 14h11" />
        </svg>
      );
    case 'sport':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a15 15 0 0 1 0 20" />
          <path d="M12 2a15 15 0 0 0 0 20" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      );
    case 'nature':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6" />
        </svg>
      );
    case 'art':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
      );
    case 'wave':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12c1.5-2 3-2 4.5 0S9.5 14 11 12s3-2 4.5 0 3 2 4.5 0" />
          <path d="M2 18c1.5-2 3-2 4.5 0S9.5 20 11 18s3-2 4.5 0 3 2 4.5 0" />
        </svg>
      );
    case 'adventure':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 20h18L14 4l-3 6-2-2-6 12z" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
  }
};

const formatarData = (dataStr: string) => {
  if (!dataStr) return '';
  try {
    return new Date(dataStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

const getInitials = (name: string) => {
  if (!name) return 'HC';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function DetalheIniciativaPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [iniciativa, setIniciativa] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('visao-geral');
  const [mostrarTodosLocais, setMostrarTodosLocais] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Form
  const [form, setForm] = useState({ nomePai: "", emailPai: "", telefonePai: "", subprogramaId: "", mensagem: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroForm, setErroForm] = useState("");

  // Carregar dados
  useEffect(() => {
    const fetchDetalhes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('institucional_iniciativas')
        .select(`
          id, titulo, entidade_organizadora, descricao_html, imagem_capa_url, logotipo_url, distrito, concelho, idade_min_global, idade_max_global, data_inicio_global, data_fim_global, link_oficial,
          subprogramas:institucional_subprogramas(id, nome, categoria, idade_min, idade_max, data_inicio, data_fim, localizacao_resumo, telefone_contato, email_contato),
          locais:institucional_locais(id, nome, freguesia, imagem_url)
        `)
        .eq('id', id)
        .single();

      if (error) console.error("Erro ao carregar detalhes:", error);
      if (data) setIniciativa(data);
      setLoading(false);
    };
    fetchDetalhes();
  }, [id]);

  // ==========================================
  // NAVEGAÇÃO POR TABS (Intersection Observer)
  // ==========================================
  useEffect(() => {
    if (!iniciativa || typeof window === 'undefined') return;

    const tabIds = ['visao-geral'];
    if (iniciativa.subprogramas?.length > 0) tabIds.push('programas');
    if (iniciativa.locais?.length > 0) tabIds.push('locais');
    tabIds.push('inscricoes');

    // Cleanup anterior
    if (observerRef.current) observerRef.current.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
    );

    tabIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    observerRef.current = observer;

    return () => observer.disconnect();
  }, [iniciativa]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const stickyOffset = 90;
    const top = el.getBoundingClientRect().top + window.scrollY - stickyOffset;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveTab(sectionId);
  };

  // ==========================================
  // SUBMIT DO FORMULÁRIO
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm("");

    if (!form.nomePai.trim() || !form.emailPai.trim() || !form.telefonePai.trim()) {
      setErroForm(isEn ? "Please fill in all required fields." : "Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (!form.subprogramaId && !form.mensagem.trim()) {
      setErroForm(isEn ? "Please select a program or describe what you want." : "Escolha um programa ou descreva o que pretende.");
      return;
    }

    setSubmitting(true);
    try {
      const turnoInteresse = form.subprogramaId || form.mensagem || 'Inscrição Geral';
      const { error: dbError } = await supabase.from('leads_externas').insert([{
        campo_id: iniciativa.id,
        nome_cliente: form.nomePai,
        email_cliente: form.emailPai,
        telefone_cliente: form.telefonePai,
        turno_interesse: turnoInteresse,
        preco_estimado: 0,
        detalhes_extra: `INSTITUCIONAL | Obs: ${form.mensagem || '(sem observações)'}`
      }]);
      if (dbError) throw dbError;

      // Notificação (best-effort)
      fetch('/api/notificar-reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'institucional',
          lead: form,
          campoNome: iniciativa.titulo,
          parceiroEmail: 'info@hellocamp.pt',
          lang
        })
      }).catch(err => console.error('Erro a notificar:', err));

      setSucesso(true);
    } catch (error) {
      console.error(error);
      setErroForm(isEn ? "Error sending request. Please try again." : "Erro ao enviar pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // LOADING / NOT FOUND
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />
          <span className="font-bold text-slate-400 text-sm">
            {isEn ? 'Loading official details...' : 'A carregar detalhes oficiais...'}
          </span>
        </div>
      </div>
    );
  }

  if (!iniciativa) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <IconInfo className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">
          {isEn ? 'Initiative not found.' : 'Iniciativa não encontrada.'}
        </h2>
        <Link href={`/${lang}/institucional`} className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-2">
          <IconArrowLeft className="w-4 h-4" />
          {isEn ? 'Back to programs' : 'Voltar aos programas'}
        </Link>
      </div>
    );
  }

  // ==========================================
  // TABS VISÍVEIS
  // ==========================================
  const tabs: { id: string; label: string }[] = [
    { id: 'visao-geral', label: isEn ? 'Overview' : 'Visão Geral' },
    ...(iniciativa.subprogramas?.length > 0 ? [{ id: 'programas', label: isEn ? 'Available Programs' : 'Programas Disponíveis' }] : []),
    ...(iniciativa.locais?.length > 0 ? [{ id: 'locais', label: isEn ? 'Locations' : 'Locais' }] : []),
    { id: 'inscricoes', label: isEn ? 'Enrollment' : 'Inscrições' },
  ];

  const locaisVisiveis = mostrarTodosLocais ? iniciativa.locais : (iniciativa.locais || []).slice(0, 4);

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">

      {/* 1. HERO BANNER */}
      <div className="relative h-[60vh] min-h-[450px] w-full bg-slate-900 flex items-end pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={iniciativa.imagem_capa_url || FALLBACK_COVER}
            onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
            alt={iniciativa.titulo}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 w-full">
          <Link
            href={`/${lang}/institucional`}
            className="text-white/70 hover:text-white text-sm font-bold inline-flex items-center gap-2 mb-6 transition-colors"
          >
            <IconArrowLeft className="w-4 h-4" />
            {isEn ? 'Back to results' : 'Voltar aos resultados'}
          </Link>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 max-w-4xl drop-shadow-md">
            {iniciativa.titulo}
          </h1>
          <p className="text-slate-200 text-lg md:text-xl font-medium max-w-2xl mb-8 line-clamp-2">
            {isEn ? 'Official leisure program promoted by ' : 'Programa oficial de ocupação de tempos livres promovido por '}
            <strong className="text-white">{iniciativa.entidade_organizadora || (isEn ? 'the Municipality' : 'o Município')}</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-white font-bold text-sm mb-4">
            <span className="inline-flex items-center gap-2 border border-white/20 rounded-lg px-4 py-2 bg-slate-900/40 backdrop-blur-md">
              <IconUsers className="w-4 h-4" />
              {iniciativa.idade_min_global || 6} - {iniciativa.idade_max_global || 16} {isEn ? 'years' : 'anos'}
            </span>
            {(iniciativa.data_inicio_global || iniciativa.data_fim_global) && (
              <span className="inline-flex items-center gap-2 border border-white/20 rounded-lg px-4 py-2 bg-slate-900/40 backdrop-blur-md">
                <IconCalendar className="w-4 h-4" />
                {formatarData(iniciativa.data_inicio_global)} {iniciativa.data_fim_global && `- ${formatarData(iniciativa.data_fim_global)}`}
              </span>
            )}
            {(iniciativa.concelho || iniciativa.distrito) && (
              <span className="inline-flex items-center gap-2 border border-white/20 rounded-lg px-4 py-2 bg-slate-900/40 backdrop-blur-md">
                <IconMapPin className="w-4 h-4" />
                {[iniciativa.concelho, iniciativa.distrito].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. MENU NAVEGAÇÃO STICKY — AGORA 100% FUNCIONAL */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex gap-6 md:gap-8 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => scrollToSection(tab.id)}
                className={`py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-10 px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-10 items-start w-full">

          {/* COLUNA ESQUERDA: CONTEÚDO */}
          <div className="flex-1 w-full flex flex-col gap-12">

            {/* SECÇÃO: Sobre o Programa */}
            <section id="visao-geral" className="scroll-mt-24">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 m-0">
                  {isEn ? 'About the Program' : 'Sobre o Programa'}
                </h2>
                <BotaoPartilha
                  url={`https://www.hellocamp.pt/${lang}/institucional/${iniciativa.id}`}
                  titulo={iniciativa.titulo}
                  isEn={isEn}
                />
              </div>
              <div
                className="text-slate-600 leading-relaxed text-base [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
                dangerouslySetInnerHTML={{
                  __html: iniciativa.descricao_html || `<p>${isEn ? 'Detailed official information will be available soon.' : 'Informação oficial detalhada será disponibilizada em breve.'}</p>`
                }}
              />

              {/* Destaques visuais (SEM EMOJIS) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm hover:border-emerald-200 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <IconRun />
                  </div>
                  <p className="text-sm font-bold text-slate-700 leading-tight">
                    {isEn ? 'Fun & Learning' : 'Diversão & Aprendizagem'}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm hover:border-emerald-200 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <IconLeaf />
                  </div>
                  <p className="text-sm font-bold text-slate-700 leading-tight">
                    {isEn ? 'Outdoor Activities' : 'Atividades ao Ar Livre'}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm hover:border-emerald-200 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <IconShield />
                  </div>
                  <p className="text-sm font-bold text-slate-700 leading-tight">
                    {isEn ? 'Full Safety' : 'Segurança Total'}
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm hover:border-emerald-200 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <IconHandshake />
                  </div>
                  <p className="text-sm font-bold text-slate-700 leading-tight">
                    {isEn ? 'Inclusion & Well-being' : 'Inclusão & Bem-estar'}
                  </p>
                </div>
              </div>
            </section>

            {/* SECÇÃO: Subprogramas */}
            {iniciativa.subprogramas && iniciativa.subprogramas.length > 0 && (
              <section id="programas" className="scroll-mt-24">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6">
                  {isEn ? 'Available Subprograms' : 'Programas Disponíveis'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {iniciativa.subprogramas.map((sub: any) => {
                    const style = getCategoryStyle(sub.categoria);
                    return (
                      <div key={sub.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg} ${style.color}`}>
                            <CategoryIcon type={style.icon} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900 leading-tight">{sub.nome}</h3>
                            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                              {sub.categoria || (isEn ? 'General' : 'Geral')}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {(sub.data_inicio || sub.data_fim) && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span className="text-slate-400 w-5 flex-shrink-0"><IconCalendar className="w-4 h-4" /></span>
                              {formatarData(sub.data_inicio)} {sub.data_fim && `- ${formatarData(sub.data_fim)}`}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="text-slate-400 w-5 flex-shrink-0"><IconUsers className="w-4 h-4" /></span>
                            {sub.idade_min || 6} - {sub.idade_max || 16} {isEn ? 'years' : 'anos'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 line-clamp-1">
                            <span className="text-slate-400 w-5 flex-shrink-0"><IconMapPin className="w-4 h-4" /></span>
                            {sub.localizacao_resumo || (isEn ? 'Multiple locations' : 'Vários locais')}
                          </div>
                          {(sub.telefone_contato || sub.email_contato) && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 border-t border-slate-100 pt-2 mt-2">
                              <span className="text-slate-400 w-5 flex-shrink-0"><IconPhone className="w-4 h-4" /></span>
                              <span className="text-xs font-medium">
                                {[sub.telefone_contato, sub.email_contato].filter(Boolean).join(' • ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECÇÃO: Locais */}
            {iniciativa.locais && iniciativa.locais.length > 0 && (
              <section id="locais" className="scroll-mt-24">
                <div className="flex justify-between items-end mb-6 flex-wrap gap-3">
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 m-0">
                    {isEn ? 'Locations' : 'Locais de Realização'}
                  </h2>
                  {iniciativa.locais.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setMostrarTodosLocais(!mostrarTodosLocais)}
                      className="text-sm font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2 cursor-pointer"
                    >
                      {mostrarTodosLocais
                        ? (isEn ? 'Show less' : 'Ver menos')
                        : (isEn ? `Show all (${iniciativa.locais.length})` : `Ver todos (${iniciativa.locais.length})`)}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {locaisVisiveis.map((local: any) => (
                    <div key={local.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                      <div className="h-32 bg-slate-100 w-full overflow-hidden">
                        <img
                          loading="lazy"
                          src={local.imagem_url || FALLBACK_LOCAL}
                          onError={(e) => { e.currentTarget.src = FALLBACK_LOCAL; }}
                          alt={local.nome}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-black text-slate-900 text-sm mb-1 leading-tight">{local.nome}</h4>
                        {local.freguesia && (
                          <p className="text-xs text-slate-500 font-medium inline-flex items-center gap-1">
                            <span className="text-emerald-500"><IconMapPin className="w-3 h-3" /></span>
                            {local.freguesia}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* AVISO LEGAL */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
              <span className="text-blue-500 mt-1 flex-shrink-0"><IconInfo className="w-6 h-6" /></span>
              <div>
                <h4 className="font-black text-blue-900 mb-1">
                  {isEn ? 'Official Enrollment' : 'Inscrição Oficial'}
                </h4>
                <p className="text-sm font-medium text-blue-800 leading-relaxed">
                  {isEn
                    ? `Enrollment in these programs by ${iniciativa.entidade_organizadora || 'the Municipality'} is entirely the responsibility of the Municipality/Parish Council. Use the form to register your interest or access the official link to validate all participation rules.`
                    : `A inscrição nestes programas da ${iniciativa.entidade_organizadora || 'Câmara/Junta'} é da total responsabilidade do Município/Junta. Utilize o formulário para registar interesse ou aceda ao link oficial para validar todas as normas de participação.`}
                </p>
                {iniciativa.link_oficial && (
                  <a
                    href={iniciativa.link_oficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-sm font-bold text-blue-700 hover:text-blue-900 underline underline-offset-2"
                  >
                    {isEn ? 'Open Official Portal' : 'Aceder ao Portal Oficial do Município'}
                    <IconArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA: STICKY BOX & FORMULÁRIO */}
          <div id="inscricoes" className="w-full lg:w-[400px] flex-shrink-0 lg:sticky lg:top-24 space-y-6 scroll-mt-24">

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-lg text-slate-900 mb-5">
                {isEn ? 'Official Highlights' : 'Destaques Oficiais'}
              </h3>
              <ul className="space-y-4 text-sm font-medium text-slate-700">
                {[
                  isEn ? 'Sports, cultural and environmental activities' : 'Atividades desportivas, culturais e ambientais',
                  isEn ? 'Monitors certified by IPDJ' : 'Monitores qualificados pelo IPDJ',
                  isEn ? 'Personal accident insurance included' : 'Seguro de acidentes pessoais incluído',
                  isEn ? 'Transport available in some programs' : 'Transporte em alguns programas',
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5"><IconCheck className="w-4 h-4" /></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-emerald-700 p-6 md:p-8 rounded-2xl shadow-xl text-white">
              <h3 className="text-2xl font-black mb-3">
                {isEn ? 'Ready to enroll?' : 'Pronto para a inscrição?'}
              </h3>
              <p className="text-emerald-100 text-sm font-medium mb-6 leading-relaxed">
                {isEn ? 'Register your interest for ' : 'Registe o seu interesse para '}
                <strong>{iniciativa.titulo}</strong>. {isEn ? 'The entity will be notified.' : 'A entidade será notificada.'}
              </p>

              {sucesso ? (
                <div className="bg-white text-emerald-900 rounded-xl p-5 text-center shadow-inner">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <IconCheck className="w-6 h-6" />
                  </div>
                  <div className="font-black text-lg mb-1">
                    {isEn ? 'Request Registered!' : 'Pedido Registado!'}
                  </div>
                  <div className="text-xs font-medium text-slate-600">
                    {isEn ? 'The entity will contact you shortly.' : 'A entidade entrará em contacto consigo em breve.'}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    required
                    type="text"
                    placeholder={isEn ? "Parent/Guardian Full Name" : "Nome Completo do Encarregado"}
                    value={form.nomePai}
                    onChange={e => setForm({ ...form, nomePai: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 px-4 py-3.5 rounded-xl text-sm outline-none placeholder:text-white/60 focus:bg-white/20 font-medium"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      type="email"
                      placeholder={isEn ? "Email" : "E-mail"}
                      value={form.emailPai}
                      onChange={e => setForm({ ...form, emailPai: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 px-4 py-3.5 rounded-xl text-sm outline-none placeholder:text-white/60 focus:bg-white/20 font-medium"
                    />
                    <input
                      required
                      type="tel"
                      placeholder={isEn ? "Phone" : "Telefone"}
                      value={form.telefonePai}
                      onChange={e => setForm({ ...form, telefonePai: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 px-4 py-3.5 rounded-xl text-sm outline-none placeholder:text-white/60 focus:bg-white/20 font-medium"
                    />
                  </div>

                  {iniciativa.subprogramas && iniciativa.subprogramas.length > 0 ? (
                    <select
                      required
                      value={form.subprogramaId}
                      onChange={e => setForm({ ...form, subprogramaId: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 px-4 py-3.5 rounded-xl text-sm outline-none text-white focus:bg-emerald-800 cursor-pointer font-medium [&>option]:text-slate-900"
                    >
                      <option value="" disabled>{isEn ? 'Which program?' : 'Qual o programa pretendido?'}</option>
                      {iniciativa.subprogramas.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.nome} ({s.idade_min || 6}-{s.idade_max || 16} {isEn ? 'y' : 'a'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      required
                      type="text"
                      placeholder={isEn ? "Which program?" : "Qual o programa pretendido?"}
                      value={form.mensagem}
                      onChange={e => setForm({ ...form, mensagem: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 px-4 py-3.5 rounded-xl text-sm outline-none placeholder:text-white/60 focus:bg-white/20 font-medium"
                    />
                  )}

                  <textarea
                    rows={2}
                    placeholder={isEn ? "Observations (optional)" : "Observações (opcional)"}
                    value={form.mensagem}
                    onChange={e => setForm({ ...form, mensagem: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl text-sm outline-none placeholder:text-white/60 focus:bg-white/20 font-medium resize-none"
                  />

                  {erroForm && (
                    <div className="bg-red-500/20 border border-red-400/40 text-white text-xs font-bold px-3 py-2 rounded-lg">
                      {erroForm}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-white text-emerald-900 hover:bg-slate-100 font-black px-6 py-4 rounded-xl transition-transform shadow-md mt-4 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting
                      ? (isEn ? 'Processing...' : 'A Processar...')
                      : (isEn ? 'Enroll My Child' : 'Quero Inscrever o Meu Filho')}
                  </button>
                  <p className="text-center text-[10px] text-emerald-200 mt-3 font-medium">
                    {isEn ? 'Learn more about the enrollment process' : 'Saiba mais sobre o processo de inscrição'}
                  </p>
                </form>
              )}
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}
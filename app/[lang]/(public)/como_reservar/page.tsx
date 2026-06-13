"use client";

import { use } from "react";
import Link from "next/link";
import React from "react";

export default function GuiaPaisPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  return (
    <main className="min-h-screen bg-white font-sans antialiased text-slate-900">
      
      {/* SEÇÃO HERO */}
      <section className="bg-slate-50 border-b border-slate-100 py-16 md:py-24 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full">
            {isEn ? 'Official Parent Guide' : 'Manual do Encarregado de Educação'}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mt-4 mb-6">
            {isEn ? 'How to Choose and Prepare for a Camp' : 'Como Escolher e Preparar um Campo de Férias'}
          </h1>
          <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            {isEn 
              ? 'Everything you need to know about safety, timings, and logistics for your child year-round experience.' 
              : 'Tudo o que precisa de saber sobre segurança, planeamento e logística para as interrupções letivas do seu filho durante todo o ano.'}
          </p>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* BLOCO 1: COMO ESCOLHER */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold mb-6">🎯</div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
              {isEn ? '1. Matrix of Choice' : '1. Como Escolher o Formato Ideal'}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              {isEn 
                ? 'Understand the difference between formats and themes to align with your child profile.' 
                : 'Identificar o formato correto depende do perfil de autonomia da criança e dos objetivos da família:'}
            </p>
            <div className="space-y-4 mt-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-sm text-slate-900 mb-1">{isEn ? 'Residential Camps' : 'Campos Residenciais (Com Alojamento)'}</h4>
                <p className="text-xs text-slate-500 leading-normal">{isEn ? 'Ideal for older children to develop full independence, spending nights at the venue.' : 'Ideais para desenvolver a independência plena. Os participantes pernoitam no local durante o turno.'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-bold text-sm text-slate-900 mb-1">{isEn ? 'Day Camps' : 'Campos Não-Residenciais (Diurnos)'}</h4>
                <p className="text-xs text-slate-500 leading-normal">{isEn ? 'Perfect for younger kids or first-time experiences. Actvities happen during the day, nights at home.' : 'Excelentes para primeiras experiências. Atividades concentradas no período diurno, com regresso a casa ao fim do dia.'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 2: TIMINGS E CALENDÁRIO */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold mb-6">📅</div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
              {isEn ? '2. Timings & Booking Windows' : '2. Planeamento e Épocas'}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {isEn 
                ? 'Camps run during all major school breaks. Planning ahead guarantees lower rates and vacancies.' 
                : 'A HelloCamp disponibiliza programas durante todas as interrupções do calendário escolar. Antecipar a reserva garante melhores tarifas:'}
            </p>
            <div className="border-l-2 border-emerald-500 pl-4 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900">{isEn ? 'Easter & Christmas' : 'Páscoa & Natal'}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{isEn ? 'Short 1-week camps focused on dynamic workshops, sports, and language learning.' : 'Programas curtos de 3 a 5 dias, muito focados em dinâmicas criativas, línguas e desporto de pavilhão/mar.'}</p>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">{isEn ? 'Summer Breaks' : 'Férias de Verão (Grandes Campos)'}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{isEn ? 'The peak season. Registrations open early in the year for major outdoor and surf camps.' : 'A época mais forte. As reservas abrem logo no início do ano para garantir vagas nos turnos de natureza e surf.'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 3: SEGURANÇA E REQUISITOS */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm md:col-span-2">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-bold mb-6">🛡️</div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
            {isEn ? '3. Safety, Licensing and Medical Profiles' : '3. Segurança e Protocolos de Saúde'}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            {isEn 
              ? 'All organizers undergo strict documentary evaluation. We take legal and health compliance seriously.' 
              : 'A segurança das crianças é o pilar inegociável da HelloCamp. Todas as entidades registadas passam por uma auditoria documental rigorosa antes de ficarem visíveis:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 mb-2">IPDJ</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? 'Camps must be registered and authorized by the Portuguese Youth and Sports Institute.' : 'Garantia de que os programas estão registados e autorizados pelo Instituto Português do Desporto e Juventude.'}</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 mb-2">{isEn ? 'Monitor Ratio' : 'Rácio de Monitores'}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? 'Organizers must guarantee safe ratios (usually 1 monitor per 6 to 10 participants).' : 'Seguimos a diretriz de rácios seguros: equipas multidisciplinares com uma média de 1 monitor para cada 6 a 10 miúdos.'}</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 mb-2">{isEn ? 'Digital Medical File' : 'Ficha Clínica Digital'}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? 'Details on allergies, diet, or regular medication are synchronized instantly with monitor rosters.' : 'Os dados clínicos inseridos no vosso perfil são enviados de forma encriptada e automática para as listagens logísticas dos monitores.'}</p>
            </div>
          </div>
        </div>

        {/* BLOCO 4: CHECKLIST DE PREPARAÇÃO */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm md:col-span-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold mb-6">🎒</div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            {isEn ? '4. Final Preparation Checklist' : '4. O que Levar na Mochila'}
          </h2>
          <p className="text-slate-500 text-sm font-medium mb-6">
            {isEn ? 'A practical breakdown to ensure nothing gets left behind.' : 'Uma checklist genérica adaptada a qualquer altura do ano para garantir o conforto da criança:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm font-bold text-slate-700">
            <ul className="list-none p-0 m-0 space-y-3">
              <li className="flex items-center gap-3"><span className="text-emerald-500">✓</span> {isEn ? 'Identification Documents & Health Card' : 'Cartão de Cidadão ou Passaporte válido'}</li>
              <li className="flex items-center gap-3"><span className="text-emerald-500">✓</span> {isEn ? 'Comfortable clothing labeled with child name' : 'Roupa confortável identificada com o nome do miúdo'}</li>
              <li className="flex items-center gap-3"><span className="text-emerald-500">✓</span> {isEn ? 'Thermal water bottle and sunscreen' : 'Garrafa de água térmica reutilizável e Protetor Solar'}</li>
            </ul>
            <ul className="list-none p-0 m-0 space-y-3">
              <li className="flex items-center gap-3"><span className="text-emerald-500">✓</span> {isEn ? 'Comfortable shoes already broken in' : 'Calçado desportivo confortável (já usado para evitar bolhas)'}</li>
              <li className="flex items-center gap-3"><span className="text-emerald-500">✓</span> {isEn ? 'Regular medication clearly detailed with prescriptions' : 'Medicação regular devidamente embalada com receita médica'}</li>
              <li className="flex items-center gap-3"><span className="text-emerald-500">✓</span> {isEn ? 'Cap or winter beanie (depending on season)' : 'Boné ou gorro de inverno (consoante a época do ano)'}</li>
            </ul>
          </div>
        </div>

      </section>

      {/* CTA FINAL */}
      <section className="bg-slate-900 py-16 text-center text-white rounded-t-[3rem]">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-4">{isEn ? 'Ready to book?' : 'Pronto para encontrar o campo ideal?'}</h2>
          <p className="text-slate-400 text-sm mb-8">{isEn ? 'Browse through verified available spots right now.' : 'Explore o nosso mapa e diretório e garanta a vaga do seu filho de forma 100% segura.'}</p>
          <Link href={`/${lang}/pesquisa`} className="inline-block bg-[#EBA914] text-white font-bold px-8 py-3.5 rounded-xl no-underline hover:bg-amber-500 transition-colors shadow-lg shadow-amber-500/10">
            {isEn ? 'Find Programs' : 'Explorar Diretório'}
          </Link>
        </div>
      </section>

    </main>
  );
}
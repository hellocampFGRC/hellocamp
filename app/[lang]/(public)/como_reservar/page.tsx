"use client";

import { use } from "react";
import Link from "next/link";
import React from "react";

export default function GuiaPaisPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  return (
    <main className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-20">
      
      {/* SEÇÃO HERO - Com cor e profundidade para quebrar a monotonia */}
      <section className="bg-emerald-900 text-white py-20 md:py-28 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="text-xs font-bold text-emerald-100 uppercase tracking-widest bg-emerald-800/50 px-4 py-2 rounded-full border border-emerald-700/50 shadow-sm">
            {isEn ? 'Official Parent Guide' : 'Guia Oficial do Encarregado de Educação'}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mt-6 mb-6">
            {isEn ? 'How to Choose and Prepare for a Camp' : 'Como Escolher e Preparar o Campo de Férias Ideal'}
          </h1>
          <p className="text-lg text-emerald-100/90 font-medium max-w-2xl mx-auto leading-relaxed">
            {isEn 
              ? 'Everything you need to know about safety, planning, and logistics for an unforgettable experience all year round.' 
              : 'Tudo o que necessita de saber sobre segurança, planeamento e logística para garantir uma experiência inesquecível ao longo de todo o ano.'}
          </p>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL - Grelha com cartões flutuantes */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-20 -mt-12">
        
        {/* BLOCO 1: COMO ESCOLHER */}
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-6 shadow-inner border border-blue-100">🧭</div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
            {isEn ? '1. Identifying the Right Format' : '1. A Escolha do Formato Ideal'}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
            {isEn 
              ? 'Choosing the right format depends on your child\'s autonomy and your family\'s goals:' 
              : 'A seleção do programa mais adequado depende do grau de autonomia da criança ou jovem e dos objetivos da família:'}
          </p>
          <div className="space-y-4 mt-auto">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
              <h4 className="font-bold text-sm text-slate-900 mb-1">{isEn ? 'Residential Camps' : 'Campos Residenciais (Com Pernoita)'}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? 'Ideal for fostering full independence. Participants stay at the venue overnight.' : 'Excelentes para promover a independência plena. Os participantes pernoitam nas instalações do parceiro durante todo o turno.'}</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
              <h4 className="font-bold text-sm text-slate-900 mb-1">{isEn ? 'Day Camps' : 'Campos Não-Residenciais (Diurnos)'}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? 'Perfect for first-timers. Activities run during the day, returning home at night.' : 'A opção indicada para primeiras experiências. As dinâmicas decorrem no período diurno, com regresso a casa ao final do dia.'}</p>
            </div>
          </div>
        </div>

        {/* BLOCO 2: TIMINGS E CALENDÁRIO */}
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-6 shadow-inner border border-amber-100">📅</div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
            {isEn ? '2. Planning & Seasons' : '2. Planeamento e Épocas do Ano'}
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
            {isEn 
              ? 'HelloCamp aggregates programs for all school breaks. Booking in advance ensures availability:' 
              : 'A plataforma HelloCamp agrega programas para todas as interrupções letivas. Antecipar a reserva assegura a sua vaga:'}
          </p>
          <div className="border-l-4 border-amber-400 pl-5 space-y-6 mt-auto">
            <div>
              <h4 className="font-bold text-sm text-slate-900">{isEn ? 'Easter & Christmas Holidays' : 'Férias de Páscoa e Natal'}</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{isEn ? 'Short 3-5 day programs focused on dynamic workshops, indoor sports, and arts.' : 'Programas de curta duração (3 a 5 dias), focados em oficinas criativas, aprendizagem de línguas e desportos *indoor*.'}</p>
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">{isEn ? 'Summer Breaks' : 'Férias de Verão (Época Alta)'}</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{isEn ? 'The peak season. Registrations typically open early in the year for major outdoor camps.' : 'A época de maior procura. Aconselhamos a reserva no primeiro trimestre do ano, especialmente para modalidades muito requisitadas como Surf e Natureza.'}</p>
            </div>
          </div>
        </div>

        {/* BLOCO 3: SEGURANÇA E REQUISITOS */}
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 md:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shadow-inner border border-emerald-100">🛡️</div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight m-0">
              {isEn ? '3. Safety, Licensing & Well-being' : '3. Segurança, Licenciamento e Bem-Estar'}
            </h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-8 font-medium max-w-3xl">
            {isEn 
              ? 'Child safety is our non-negotiable pillar. All registered entities undergo a strict documentary audit.' 
              : 'A segurança dos participantes é o pilar inegociável da HelloCamp. Todas as entidades organizadoras parceiras são submetidas a uma auditoria documental exigente:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
              <h4 className="font-bold text-sm text-slate-900 mb-2">{isEn ? 'IPDJ Certification' : 'Certificação IPDJ'}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? 'Programs must be officially registered and authorized by the National Youth and Sports Institute.' : 'Garantimos que os programas promovidos cumprem o registo legal obrigatório junto do Instituto Português do Desporto e Juventude.'}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
              <h4 className="font-bold text-sm text-slate-900 mb-2">{isEn ? 'Supervision Ratios' : 'Rácio de Supervisão'}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? 'Strict adherence to safe supervision ratios, typically 1 qualified monitor for every 6 to 10 participants.' : 'Exigência de equipas qualificadas, respeitando uma média de supervisão rigorosa (habitualmente 1 monitor para cada 6 a 10 participantes).'}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
              <h4 className="font-bold text-sm text-slate-900 mb-2">{isEn ? 'Digital Medical Records' : 'Ficha Clínica Encriptada'}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{isEn ? 'Crucial data regarding allergies or medications is synchronized securely with camp coordinators.' : 'As informações sobre alergias, restrições ou medicação são transmitidas de forma segura e direta às equipas de coordenação no terreno.'}</p>
            </div>
          </div>
        </div>

        {/* BLOCO 4: CHECKLIST DE PREPARAÇÃO */}
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 md:col-span-2 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 text-9xl opacity-[0.03] pointer-events-none">🎒</div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl shadow-inner border border-purple-100">🎒</div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight m-0">
              {isEn ? '4. What to Pack (Checklist)' : '4. O que Levar na Mochila (Checklist)'}
            </h2>
          </div>
          <p className="text-slate-600 text-sm font-medium mb-8 relative z-10">
            {isEn ? 'A universal checklist adaptable to any season to ensure your child\'s comfort:' : 'Uma lista de verificação essencial, adaptável a qualquer época do ano, para assegurar o conforto do participante:'}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12 text-sm font-semibold text-slate-700 relative z-10">
            <div className="flex items-start gap-3">
              <span className="text-emerald-500 text-lg leading-none mt-0.5">✓</span> 
              <span className="leading-snug">{isEn ? 'Valid Identification Document (Citizen Card or Passport)' : 'Documento de Identificação válido (Cartão de Cidadão/Passaporte)'}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-500 text-lg leading-none mt-0.5">✓</span> 
              <span className="leading-snug">{isEn ? 'Comfortable, broken-in footwear (to prevent blisters)' : 'Calçado desportivo e confortável (já utilizado, para evitar bolhas)'}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-500 text-lg leading-none mt-0.5">✓</span> 
              <span className="leading-snug">{isEn ? 'Comfortable clothing clearly labeled with the participant\'s name' : 'Vestuário confortável, devidamente identificado com o nome do participante'}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-500 text-lg leading-none mt-0.5">✓</span> 
              <span className="leading-snug">{isEn ? 'Regular medication properly packed with medical prescription' : 'Medicação regular devidamente embalada e acompanhada de prescrição médica'}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-500 text-lg leading-none mt-0.5">✓</span> 
              <span className="leading-snug">{isEn ? 'Reusable thermal water bottle & high-protection sunscreen' : 'Garrafa de água térmica (reutilizável) e Protetor Solar de elevada proteção'}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-emerald-500 text-lg leading-none mt-0.5">✓</span> 
              <span className="leading-snug">{isEn ? 'Hat or winter beanie (depending on the season)' : 'Chapéu/Boné ou gorro térmico (ajustado à condição climática)'}</span>
            </div>
          </div>
        </div>

      </section>

      {/* CTA FINAL */}
      <section className="bg-slate-900 py-20 text-center text-white mx-4 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1000')] opacity-10 bg-cover bg-center pointer-events-none"></div>
        <div className="max-w-2xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">{isEn ? 'Ready to book?' : 'Pronto para encontrar o programa ideal?'}</h2>
          <p className="text-slate-300 text-base mb-10 font-medium">{isEn ? 'Browse through verified available spots securely and conveniently.' : 'Navegue pelo nosso diretório e assegure a inscrição de forma 100% digital e segura.'}</p>
          <Link href={`/${lang}/pesquisa`} className="inline-block bg-[#EBA914] text-white font-bold px-10 py-4 rounded-xl no-underline hover:bg-amber-500 transition-colors shadow-xl shadow-amber-500/20 text-lg">
            {isEn ? 'Explore Directory' : 'Explorar Diretório'}
          </Link>
        </div>
      </section>

    </main>
  );
}
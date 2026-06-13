"use client";

import { use } from "react";
import Link from "next/link";
import React from "react";

export default function SerParceiroPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  return (
    <main className="min-h-screen bg-white font-sans antialiased text-slate-900">
      
      {/* SEÇÃO HERO B2B */}
      <section className="bg-slate-900 text-white py-20 md:py-28 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="text-xs font-bold text-[#EBA914] bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 uppercase tracking-widest">
            {isEn ? 'HelloCamp B2B Platform' : 'HelloCamp para Organizadores'}
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-6 mb-6 leading-tight">
            {isEn ? 'Maximize Bookings. Simplify Operations.' : 'Aumente as Inscrições. Automatize a Logística.'}
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed mb-10">
            {isEn 
              ? 'The ultimate tool for holiday camp organizers. Zero fixed costs. Total control.' 
              : 'A plataforma definitiva para entidades e organizadores de campos de férias. Sem custos fixos, anuidades ou burocracias.'}
          </p>
          <Link href={`/${lang}/admin/registo`} className="inline-block bg-[#EBA914] text-white font-bold px-8 py-4 rounded-xl no-underline hover:bg-amber-500 transition-all transform hover:scale-105 shadow-xl shadow-amber-500/10 text-base">
            {isEn ? 'Create Partner Account' : 'Registar Minha Entidade'}
          </Link>
        </div>
      </section>

      {/* OS 3 PILARES DO VALOR B2B */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {isEn ? 'Why list your programs on HelloCamp?' : 'Porquê digitalizar a sua operação connosco?'}
          </h2>
          <p className="text-slate-500 text-base mt-2 max-w-2xl mx-auto font-medium">
            {isEn ? 'We built an infrastructure to solve financial, marketing and nominal tracking bottlenecks.' : 'Desenhámos uma infraestrutura robusta para eliminar as dores de tesouraria, marketing e controlo de monitores.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* PILAR 1: STRIPE CONNECT */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold mb-6">💰</div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              {isEn ? 'Automated Stripe Payouts' : 'Divisão de Valores Segura'}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {isEn 
                ? 'No waiting periods. Parents pay and Stripe Connect splits the transaction automatically. Your net earnings drop straight into your bank account.' 
                : 'Não retemos o seu capital. Através da integração segura com a Stripe Connect, o encarregado paga e o split é feito na hora: a comissão HelloCamp fica retida e o seu ganho cai direto no seu banco.'}
            </p>
          </div>

          {/* PILAR 2: CENTRAL LOGÍSTICA */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold mb-6">📋</div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              {isEn ? 'Instant Nominal Exports' : 'Ficha de Monitores Automática'}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {isEn 
                ? 'Forget manual spreadsheets. Track dietary restrictions, allergies, and medical notes. Export everything to structured Excel/CSV files with a single click.' 
                : 'Elimine as folhas de papel e o Excel confuso. Controle alergias, restrições alimentares, autorizações de recolha e respostas customizadas. Exporte a listagem nominal para CSV com um clique.'}
            </p>
          </div>

          {/* PILAR 3: CUSTO ZERO DE RISCO */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold mb-6">🛡️</div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              {isEn ? 'Zero Fixed Fees. Pure Success Fee.' : 'Risco Zero. Modelo à Performance'}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {isEn 
                ? 'No monthly retainers, no listing fees, no hidden setup costs. We only win when you sell. Our commission is applied directly per booking.' 
                : 'Não cobramos mensalidades, anuidades ou custos de configuração. O registo da entidade e dos programas é 100% gratuito. Operamos exclusivamente sob uma taxa por vaga vendida.'}
            </p>
          </div>

        </div>
      </section>

      {/* SEÇÃO CONTRATO E TRANSPARÊNCIA */}
      <section className="bg-slate-50 border-t border-b border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-black text-slate-900 mb-4">{isEn ? 'Full Compliance & Control' : 'Total Controlo Comercial'}</h3>
          <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-2xl mx-auto mb-6">
            {isEn 
              ? 'Our SuperAdmin HQ panel can override individual camp commission rules. Everything is transparent and logged directly into your private partner portal.' 
              : 'O nosso painel central permite flexibilidade total. Pode gerir regras de comissionamento gerais ou específicas por campo (ex: incidência sobre valor total ou apenas programa base), tudo visível no seu portal.'}
          </p>
        </div>
      </section>

      {/* CTA INFERIOR */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
          {isEn ? 'Ready to grow your organization?' : 'Pronto para expandir a sua faturação?'}
        </h2>
        <p className="text-slate-500 text-sm max-w-xl mx-auto mb-8 font-medium">
          {isEn 
            ? 'Takes less than 5 minutes to create your account and start listing your camp vacancies.' 
            : 'Demora menos de 5 minutos a criar o seu acesso. Comece a receber inscrições automatizadas para turnos durante todo o ano.'}
        </p>
        <Link href={`/${lang}/admin/registo`} className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3.5 rounded-xl no-underline transition-colors shadow-md">
          {isEn ? 'Get Started Now' : 'Começar Agora'}
        </Link>
      </section>

    </main>
  );
}
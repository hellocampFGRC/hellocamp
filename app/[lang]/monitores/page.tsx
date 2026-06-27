"use client";

import React, { use } from "react";
import Link from "next/link";
import Image from "next/image";

export default function MonitoresLandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative bg-blue-900 text-white overflow-hidden py-20 md:py-32 px-4 md:px-8">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block px-4 py-1.5 bg-blue-800/50 border border-blue-400/30 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest text-blue-200 mb-6">
            {isEn ? "HelloCamp Staff Network" : "Bolsa de Talentos HelloCamp"}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight">
            {isEn ? "Work in the best Summer Camps in Portugal." : "Trabalha nos melhores campos de férias de Portugal."}
          </h1>
          <p className="text-base md:text-xl text-blue-100 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
            {isEn 
              ? "Create your profile for free, set your availability, and let hundreds of verified camps contact you directly with job offers." 
              : "Cria o teu perfil grátis, define a tua disponibilidade e recebe propostas de trabalho diretas de centenas de entidades organizadoras verificadas."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href={`/${lang}/monitores/registo`}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-8 py-4 rounded-full shadow-lg transition-transform hover:-translate-y-1 no-underline"
            >
              {isEn ? "Create Free Profile" : "Criar Perfil Grátis"}
            </Link>
            <Link 
              href={`/${lang}/monitores/login`}
              className="w-full sm:w-auto bg-blue-800/50 hover:bg-blue-800 border border-blue-400/30 text-white font-bold px-8 py-4 rounded-full transition-colors no-underline"
            >
              {isEn ? "Log in to Portal" : "Entrar no Portal"}
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">
            {isEn ? "How does it work?" : "Como funciona?"}
          </h2>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">
            {isEn ? "Skip the endless job applications. Put yourself on the map and let the camps come to you." : "Esquece as candidaturas infinitas. Coloca o teu perfil no mapa e deixa que as entidades venham ter contigo."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">✍️</div>
            <h3 className="text-xl font-black text-slate-900 mb-3">{isEn ? "1. Create your Profile" : "1. Cria o teu Perfil"}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {isEn ? "Fill in your experience, upload your photo, and list your certificates (like First Aid or Lifeguard)." : "Preenche a tua experiência, junta uma boa carta de apresentação e assinala as tuas certificações (ex: IPDJ, Socorrismo)."}
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">📅</div>
            <h3 className="text-xl font-black text-slate-900 mb-3">{isEn ? "2. Set Availability" : "2. Define a Disponibilidade"}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {isEn ? "Tell us when you want to work: Easter, Summer, or Christmas holidays. Update it anytime." : "Indica quando tens tempo livre para trabalhar: Férias da Páscoa, Verão ou Natal. Podes atualizar a qualquer momento."}
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">💬</div>
            <h3 className="text-xl font-black text-slate-900 mb-3">{isEn ? "3. Get Hired" : "3. Recebe Propostas"}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              {isEn ? "Verified camp organizers search our database and will contact you directly via chat or phone." : "Os parceiros organizadores pesquisam na nossa base de dados e contactam-te diretamente pelo chat ou telemóvel."}
            </p>
          </div>

        </div>
      </section>

      {/* WHY JOIN US (Benefícios) */}
      <section className="bg-white border-y border-slate-200 py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-6">
              {isEn ? "Why join HelloCamp's network?" : "Porquê pertencer à rede HelloCamp?"}
            </h2>
            
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">✓</div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">{isEn ? "100% Free Forever" : "100% Gratuito"}</h4>
                  <p className="text-sm text-slate-500">{isEn ? "We do not charge any fees or take cuts from your salary." : "Não cobramos qualquer taxa de inscrição nem ficamos com comissões do teu ordenado."}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">🛡️</div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">{isEn ? "Verified Companies Only" : "Empresas Verificadas"}</h4>
                  <p className="text-sm text-slate-500">{isEn ? "Your profile is only visible to officially registered and validated camps." : "O teu perfil só fica visível para entidades legalmente constituídas e validadas pela nossa equipa."}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-1">🚀</div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">{isEn ? "Boost your CV" : "Ganha Experiência"}</h4>
                  <p className="text-sm text-slate-500">{isEn ? "The fastest way to build your resume and gain real leadership experience." : "A forma mais rápida de enriqueceres o teu currículo e ganhares experiência em liderança e gestão de grupos."}</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-[3rem] p-8 md:p-12 border border-blue-100 text-center">
            <h3 className="text-xl font-black text-blue-900 mb-4">{isEn ? "Ready for an epic summer?" : "Pronto para um verão épico?"}</h3>
            <p className="text-blue-700 font-medium mb-8">
              {isEn ? "Join hundreds of monitors who already found their dream summer job through our platform." : "Junta-te às centenas de jovens que já encontraram trabalho através da nossa bolsa."}
            </p>
            <Link 
              href={`/${lang}/monitores/registo`}
              className="inline-block w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-sm px-8 py-4 rounded-xl shadow-lg transition-colors no-underline"
            >
              {isEn ? "Sign Up Now" : "Inscrever-me Agora"}
            </Link>
          </div>

        </div>
      </section>

    </main>
  );
}
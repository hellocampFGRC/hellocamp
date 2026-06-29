"use client";

import React, { use } from "react";
import Link from "next/link";
import Image from "next/image";

export default function MonitoresLandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 selection:bg-blue-200">
      
      {/* HERO SECTION - Redesenhado com gradientes mais modernos */}
      <section className="relative overflow-hidden pt-24 pb-32 md:pt-36 md:pb-40 px-4 md:px-8 border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 -z-20"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[100px] -z-10 mix-blend-screen pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-blue-200 mb-8 backdrop-blur-sm shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {isEn ? "HelloCamp Staff Network" : "A Maior Bolsa de Talentos"}
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 leading-[1.1] text-white">
            {isEn ? "Work in the best Summer Camps in Portugal." : "O teu próximo verão épico começa aqui."}
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            {isEn 
              ? "Create your profile for free, set your availability, and let hundreds of verified camps contact you directly with job offers." 
              : "Cria o teu perfil grátis, define a tua disponibilidade e recebe propostas de trabalho diretas de centenas de empresas organizadoras verificadas."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href={`/${lang}/monitores/registo`}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm px-10 py-5 rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1 no-underline border border-blue-500"
            >
              {isEn ? "Create Free Profile" : "Criar Perfil Grátis"}
            </Link>
            <Link 
              href={`/${lang}/monitores/login`}
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm px-10 py-5 rounded-xl transition-all backdrop-blur-sm no-underline hover:-translate-y-1"
            >
              {isEn ? "Log in to Portal" : "Entrar no Portal"}
            </Link>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-6 text-sm font-bold text-slate-400">
            <div className="flex items-center gap-2"><span>✓</span> 100% Grátis</div>
            <div className="flex items-center gap-2"><span>✓</span> Sem Comissões</div>
            <div className="flex items-center gap-2"><span>✓</span> Seguro</div>
          </div>
        </div>
      </section>

      {/* STATS SECTION (Opcional: Pode manter estático ou ligar à DB no futuro) */}
      <section className="max-w-5xl mx-auto px-4 -mt-12 relative z-20 hidden md:block">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 grid grid-cols-3 gap-8 text-center divide-x divide-slate-100">
          <div>
            <div className="text-3xl font-black text-slate-900 mb-1">+100</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Empresas Parceiras</div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 mb-1">Portugal</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atuação Nacional</div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-600 mb-1">€0</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Custo para Monitores</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Redesenhado */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-24">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
            {isEn ? "How it works" : "Como funciona?"}
          </h2>
          <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
            {isEn ? "Skip the endless job applications. Put yourself on the map and let the camps come to you." : "Esquece o envio infinito de currículos. Coloca o teu perfil no radar e deixa que as entidades venham ter contigo."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
          {/* Linha conectora de fundo (só Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-10"></div>

          <div className="relative group">
            <div className="w-24 h-24 bg-white border-4 border-slate-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-8 shadow-sm group-hover:scale-110 group-hover:border-blue-100 transition-all duration-300">
              ✍️
            </div>
            <div className="text-center px-4">
              <h3 className="text-xl font-black text-slate-900 mb-3">{isEn ? "1. Create your Profile" : "1. Cria o teu Perfil"}</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                {isEn ? "Fill in your experience, upload a clear photo, and list your certificates (like First Aid or IPDJ)." : "Preenche a tua experiência, adiciona uma boa fotografia e destaca as tuas certificações (ex: IPDJ, Socorrismo)."}
              </p>
            </div>
          </div>

          <div className="relative group mt-8 md:mt-0">
            <div className="w-24 h-24 bg-white border-4 border-slate-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-8 shadow-sm group-hover:scale-110 group-hover:border-emerald-100 transition-all duration-300">
              📅
            </div>
            <div className="text-center px-4">
              <h3 className="text-xl font-black text-slate-900 mb-3">{isEn ? "2. Set Availability" : "2. Define a Disponibilidade"}</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                {isEn ? "Tell us exactly when you want to work: Easter, Summer, or Christmas holidays. Update it anytime." : "Indica no calendário quando tens tempo livre para trabalhar. Podes atualizar as tuas datas a qualquer momento no portal."}
              </p>
            </div>
          </div>

          <div className="relative group mt-8 md:mt-0">
            <div className="w-24 h-24 bg-slate-900 border-4 border-slate-100 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-8 shadow-md group-hover:scale-110 group-hover:border-slate-300 transition-all duration-300">
              💬
            </div>
            <div className="text-center px-4">
              <h3 className="text-xl font-black text-slate-900 mb-3">{isEn ? "3. Get Hired" : "3. Recebe Propostas"}</h3>
              <p className="text-slate-500 leading-relaxed font-medium">
                {isEn ? "Verified camp organizers search our database and will contact you directly via chat or phone." : "Os parceiros organizadores pesquisam na nossa base, encontram o teu perfil e contactam-te diretamente com ofertas."}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* WHY JOIN US - Design Split Screen */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* Esquerda: Benefícios */}
            <div className="p-8 md:p-16 lg:p-24 flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-10">
                {isEn ? "Why join HelloCamp?" : "Porquê escolher a HelloCamp?"}
              </h2>
              
              <ul className="space-y-10">
                <li className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 text-xl shadow-sm border border-blue-100">€</div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 mb-1">{isEn ? "100% Free Forever" : "100% Gratuito"}</h4>
                    <p className="text-slate-500 font-medium leading-relaxed">{isEn ? "We do not charge any fees to create an account, nor do we take cuts from your salary. What you agree with the camp is yours." : "Não cobramos qualquer taxa de inscrição nem ficamos com comissões do teu ordenado. O valor que negociares com o parceiro é inteiramente teu."}</p>
                  </div>
                </li>
                <li className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 text-xl shadow-sm border border-emerald-100">🛡️</div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 mb-1">{isEn ? "Verified Companies Only" : "Segurança Garantida"}</h4>
                    <p className="text-slate-500 font-medium leading-relaxed">{isEn ? "Your profile and contact information are only visible to officially registered and validated camp organizations." : "Os teus dados pessoais e fotografia só ficam visíveis para empresas e entidades legalmente constituídas e validadas pela nossa equipa."}</p>
                  </div>
                </li>
                <li className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0 text-xl shadow-sm border border-amber-100">🚀</div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 mb-1">{isEn ? "Boost your CV" : "Ganha Experiência Real"}</h4>
                    <p className="text-slate-500 font-medium leading-relaxed">{isEn ? "The fastest way to build your resume, meet new people, and gain real leadership experience." : "A forma mais rápida de enriqueceres o teu currículo, conheceres pessoas de todo o país e ganhares experiência em liderança de grupos."}</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Direita: CTA Visual */}
            <div className="bg-slate-900 p-8 md:p-16 lg:p-24 flex flex-col justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1526976663112-001538a0020f?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-luminosity"></div>
              
              <div className="relative z-10">
                <span className="text-4xl block mb-6">🏕️</span>
                <h3 className="text-3xl font-black text-white mb-6 leading-tight">
                  {isEn ? "Ready for an epic summer?" : "Pronto para ter o melhor verão da tua vida?"}
                </h3>
                <p className="text-slate-300 font-medium mb-10 text-lg">
                  {isEn ? "Join hundreds of monitors who already found their dream summer job through our platform." : "Junta-te às centenas de jovens que já criaram perfil e encontraram trabalho através da nossa bolsa."}
                </p>
                <Link 
                  href={`/${lang}/monitores/registo`}
                  className="inline-block w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black uppercase tracking-widest text-sm px-10 py-5 rounded-xl shadow-lg transition-all hover:-translate-y-1 no-underline"
                >
                  {isEn ? "Sign Up Now" : "Criar Perfil Agora"}
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ / DÚVIDAS (Nova Secção para credibilidade) */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-24">
         <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4">{isEn ? "Frequently Asked Questions" : "Perguntas Frequentes"}</h2>
         </div>
         
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h4 className="text-lg font-black text-slate-900 mb-2">{isEn ? "Do I need to be certified to register?" : "Preciso de ter algum curso para me inscrever?"}</h4>
               <p className="text-slate-600 font-medium text-sm leading-relaxed">{isEn ? "No. While certificates like IPDJ or First Aid help, many camps hire enthusiastic beginners for support roles." : "Não é obrigatório. Embora cursos como o do IPDJ ou de Primeiros Socorros destaquem o teu perfil, muitos campos contratam monitores em regime de primeira experiência ou para funções de apoio."}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h4 className="text-lg font-black text-slate-900 mb-2">{isEn ? "Who will see my profile?" : "Quem consegue ver os meus dados?"}</h4>
               <p className="text-slate-600 font-medium text-sm leading-relaxed">{isEn ? "Only verified camp organizers with an active Partnership Agreement with HelloCamp have access to the Talent Pool." : "Apenas Organizadores e Empresas de Campos de Férias com conta verificada e contrato ativo com a HelloCamp conseguem aceder à Bolsa de Monitores."}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h4 className="text-lg font-black text-slate-900 mb-2">{isEn ? "How do I get paid?" : "Como recebo o meu ordenado?"}</h4>
               <p className="text-slate-600 font-medium text-sm leading-relaxed">{isEn ? "HelloCamp does not handle monitor payments. You will negotiate your salary and contract directly with the camp organizer who hires you." : "A HelloCamp é apenas a plataforma de ligação. O teu contrato, condições e ordenado são discutidos e pagos diretamente pela entidade que te recrutar, sem qualquer intervenção nossa."}</p>
            </div>
         </div>
      </section>

    </main>
  );
}
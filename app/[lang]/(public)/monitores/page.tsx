import Link from "next/link";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isEn = lang === "en";

  return {
    title: isEn
      ? "Monitors Talent Pool | Work at Summer Camps | HelloCamp"
      : "Bolsa de Monitores | Trabalhar em Campos de Férias | HelloCamp",
    description: isEn
      ? "Create your free monitor profile, set your availability, and receive job offers directly from verified summer camps in Portugal."
      : "Cria o teu perfil gratuito de monitor, define a tua disponibilidade e recebe propostas de trabalho diretas de campos de férias verificados.",
  };
}

export default async function MonitoresLandingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isEn = lang === "en";

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40 px-4 md:px-8 bg-[#2563EB] border-b-8 border-[#F59E0B]">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#F59E0B] rounded-full opacity-90 pointer-events-none hidden lg:block" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[#16A34A] rounded-full opacity-90 pointer-events-none hidden lg:block" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/30 rounded-md text-[10px] md:text-xs font-black uppercase tracking-widest text-white mb-8 backdrop-blur-md shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            {isEn ? "HelloCamp Staff Network" : "A Maior Bolsa de Talentos"}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1] text-white">
            {isEn
              ? "Work in the best Summer Camps in Portugal."
              : "O teu próximo verão épico começa aqui."}
          </h1>

          <p className="text-lg md:text-xl text-blue-100 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? "Create your profile for free, set your availability, and let hundreds of verified camps contact you directly with job offers."
              : "Cria o teu perfil grátis, define a tua disponibilidade e recebe propostas de trabalho diretas de centenas de empresas organizadoras verificadas."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={`/${lang}/monitores/registo`}
              className="w-full sm:w-auto bg-[#F59E0B] hover:bg-amber-600 text-white font-black uppercase tracking-widest text-sm px-10 py-5 rounded-md shadow-xl transition-all hover:-translate-y-1 no-underline"
            >
              {isEn ? "Create Free Profile" : "Criar Perfil Grátis"}
            </Link>
            <Link
              href={`/${lang}/monitores/login`}
              className="w-full sm:w-auto bg-[#0F172A] hover:bg-slate-800 text-white font-black uppercase tracking-widest text-sm px-10 py-5 rounded-md transition-all shadow-lg no-underline hover:-translate-y-1"
            >
              {isEn ? "Log in to Portal" : "Entrar no Portal"}
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs md:text-sm font-black text-white">
            <div className="flex items-center gap-2">
              <span className="bg-[#16A34A] text-white w-5 h-5 rounded-full inline-flex items-center justify-center text-xs">✓</span>
              100% Grátis
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-[#16A34A] text-white w-5 h-5 rounded-full inline-flex items-center justify-center text-xs">✓</span>
              Sem Comissões
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-[#16A34A] text-white w-5 h-5 rounded-full inline-flex items-center justify-center text-xs">✓</span>
              Acesso Restrito a Parceiros Verificados
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="max-w-5xl mx-auto px-4 -mt-12 relative z-20 hidden md:block">
        <div className="bg-white rounded-md shadow-xl border border-slate-200 p-8 grid grid-cols-3 gap-8 text-center divide-x divide-slate-100">
          <div>
            <div className="text-4xl font-black text-[#0F172A] mb-1">+100</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {isEn ? "Partner Organizations" : "Empresas Parceiras"}
            </div>
          </div>
          <div>
            <div className="text-4xl font-black text-[#2563EB] mb-1">Portugal</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {isEn ? "Nationwide Coverage" : "Atuação Nacional"}
            </div>
          </div>
          <div>
            <div className="text-4xl font-black text-[#16A34A] mb-1">€0</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {isEn ? "Cost for Monitors" : "Custo para Monitores"}
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-20 md:py-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#0F172A] mb-4">
            {isEn ? "How it works" : "Como funciona?"}
          </h2>
          <p className="text-slate-500 font-medium text-base md:text-lg max-w-2xl mx-auto">
            {isEn
              ? "Skip the endless job applications. Put yourself on the map and let the camps come to you."
              : "Esquece o envio infinito de currículos. Coloca o teu perfil no radar e deixa que as entidades venham ter contigo."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-[#F59E0B] text-white rounded-md flex items-center justify-center text-2xl font-black mx-auto mb-6">
              1
            </div>
            <h3 className="text-xl font-black text-[#0F172A] mb-3">
              {isEn ? "Create your Profile" : "Cria o teu Perfil"}
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium text-sm">
              {isEn
                ? "Fill in your experience, upload a clear photo, and list your certificates (like First Aid or IPDJ)."
                : "Preenche a tua experiência, adiciona uma fotografia, o teu CV e destaca as tuas certificações (IPDJ, Socorrismo, Desporto)."}
            </p>
          </div>

          <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-[#2563EB] text-white rounded-md flex items-center justify-center text-2xl font-black mx-auto mb-6">
              2
            </div>
            <h3 className="text-xl font-black text-[#0F172A] mb-3">
              {isEn ? "Set Availability" : "Define a Disponibilidade"}
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium text-sm">
              {isEn
                ? "Select on the calendar the exact weeks or days you are free to work during Easter, Summer, or Christmas."
                : "Indica no calendário interativo os dias em que tens disponibilidade para trabalhar. Podes atualizar a qualquer momento."}
            </p>
          </div>

          <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-[#16A34A] text-white rounded-md flex items-center justify-center text-2xl font-black mx-auto mb-6">
              3
            </div>
            <h3 className="text-xl font-black text-[#0F172A] mb-3">
              {isEn ? "Get Hired Directly" : "Recebe Propostas Diretas"}
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium text-sm">
              {isEn
                ? "Verified camp organizers search our database by district and contact you directly via phone, WhatsApp, or email."
                : "Os organizadores de campos pesquisam na nossa bolsa pelo teu distrito e contactam-te diretamente por telemóvel ou e-mail."}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
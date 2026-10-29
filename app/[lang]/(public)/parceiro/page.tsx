import Link from "next/link";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isEn = lang === "en";

  return {
    title: isEn
      ? "Become a Partner | HelloCamp Organizers"
      : "Seja Parceiro | Área de Organizadores HelloCamp",
    description: isEn
      ? "Join HelloCamp as an organizer. Promote your camps, connect with families, and grow your business with zero fixed costs."
      : "Junte-se à HelloCamp como parceiro organizador. Promova os seus campos de férias e aumente as suas reservas.",
  };
}

export default async function ParceiroLandingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isEn = lang === "en";

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      
      {/* HERO PARCEIROS */}
      <section className="bg-[#0F172A] text-white pt-24 pb-36 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#16A34A]/20 rounded-md blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#F59E0B]/20 rounded-md blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-md text-xs font-black uppercase tracking-widest text-emerald-300 mb-8 backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" />
            {isEn ? "HelloCamp B2B Network" : "Rede de Parceiros B2B"}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
            {isEn
              ? "Grow your camp bookings with HelloCamp."
              : "Preencha as vagas do seu campo com a HelloCamp."}
          </h1>

          <p className="text-lg md:text-xl text-slate-300 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? "Connect directly with thousands of families looking for certified holiday camps, sports programs, and creative workshops."
              : "Aceda a milhares de famílias à procura de campos de férias, programas desportivos e atividades inesquecíveis para os filhos."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={`/${lang}/registo`}
              className="w-full sm:w-auto bg-[#F59E0B] hover:bg-amber-500 text-[#0F172A] font-black uppercase tracking-widest text-sm px-10 py-5 rounded-md shadow-xl transition-all hover:scale-105 no-underline"
            >
              {isEn ? "Join as Partner for Free" : "Criar Conta de Parceiro Grátis"}
            </Link>
            <Link
              href={`/${lang}/login`}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm px-10 py-5 rounded-md transition-all backdrop-blur-md no-underline"
            >
              {isEn ? "Partner Login" : "Entrar no Portal"}
            </Link>
          </div>
        </div>
      </section>

      {/* VANTAGENS B2B */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-[#0F172A] mb-4">
            {isEn ? "Why list with us?" : "Porquê aderir à HelloCamp?"}
          </h2>
          <p className="text-slate-500 font-medium text-base md:text-lg max-w-2xl mx-auto">
            {isEn
              ? "Designed to save you time and maximize your program's reach."
              : "Construído para simplificar a gestão das inscrições e potenciar a visibilidade da sua marca."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm flex flex-col">
            <div className="w-14 h-14 bg-emerald-50 text-[#16A34A] rounded-md flex items-center justify-center text-2xl font-black mb-6 border border-emerald-100">
              ✓
            </div>
            <h3 className="text-xl font-black text-[#0F172A] mb-3">
              {isEn ? "Zero Fixed Costs" : "Sem Custos Fixos"}
            </h3>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
              {isEn
                ? "Listing your camps is 100% free. We only charge a small, transparent commission on successful bookings."
                : "Publicar os seus programas é totalmente gratuito. Só cobramos uma comissão transparente por inscrição confirmada."}
            </p>
          </div>

          <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm flex flex-col">
            <div className="w-14 h-14 bg-blue-50 text-[#2563EB] rounded-md flex items-center justify-center text-2xl font-black mb-6 border border-blue-100">
              🛡️
            </div>
            <h3 className="text-xl font-black text-[#0F172A] mb-3">
              {isEn ? "Verified Brand Profile" : "Montra de Marca Exclusiva"}
            </h3>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
              {isEn
                ? "Your logo, official website, and direct contacts remain 100% visible to prospective families."
                : "O seu logótipo oficial, website e contactos diretos ficam 100% visíveis para reforçar a credibilidade da sua marca."}
            </p>
          </div>

          <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm flex flex-col">
            <div className="w-14 h-14 bg-amber-50 text-[#F59E0B] rounded-md flex items-center justify-center text-2xl font-black mb-6 border border-amber-100">
              ⚡
            </div>
            <h3 className="text-xl font-black text-[#0F172A] mb-3">
              {isEn ? "Smart Dashboard" : "Gestão Automatizada"}
            </h3>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
              {isEn
                ? "Manage participants, medical alerts, and dietary requirements in one centralized digital dashboard."
                : "Centralize inscrições, alertas de saúde e restrições alimentares num painel digital simples e seguro."}
            </p>
          </div>
        </div>
      </section>

    </main>
  );
}
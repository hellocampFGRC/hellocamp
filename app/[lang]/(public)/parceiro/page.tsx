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
      <section className="bg-[#0F172A] text-white pt-24 pb-36 px-4 md:px-8 relative overflow-hidden border-b-4 border-[#F59E0B]">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#16A34A] rounded-md text-xs font-black uppercase tracking-widest text-white mb-8 shadow-sm">
            <span>🏕️</span>
            {isEn ? "HelloCamp B2B Network" : "Rede de Parceiros B2B"}
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-[1.1] text-white">
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
              className="w-full sm:w-auto bg-[#F59E0B] hover:bg-amber-600 text-white font-black uppercase tracking-widest text-sm px-10 py-5 rounded-md shadow-xl transition-all no-underline"
            >
              {isEn
                ? "Join as Partner for Free"
                : "Criar Conta de Parceiro Grátis"}
            </Link>
            <Link
              href={`/${lang}/login`}
              className="w-full sm:w-auto bg-[#2563EB] hover:bg-blue-700 text-white font-black uppercase tracking-widest text-sm px-10 py-5 rounded-md shadow-xl transition-all no-underline"
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
            <div className="w-14 h-14 bg-[#16A34A] text-white rounded-md flex items-center justify-center text-2xl font-black mb-6">
              ✓
            </div>
            <h3 className="text-xl font-black text-[#0F172A] mb-3">
              {isEn ? "Zero Fixed Costs" : "Sem Custos Fixos"}
            </h3>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium m-0">
              {isEn
                ? "Listing your camps is 100% free. We only charge a small, transparent commission on successful bookings."
                : "Publicar os seus programas é totalmente gratuito. Só cobramos uma comissão transparente por inscrição confirmada."}
            </p>
          </div>

          <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm flex flex-col">
            <div className="w-14 h-14 bg-[#2563EB] text-white rounded-md flex items-center justify-center text-2xl font-black mb-6">
              🛡️
            </div>
            <h3 className="text-xl font-black text-[#0F172A] mb-3">
              {isEn ? "Verified Brand Profile" : "Montra de Marca Exclusiva"}
            </h3>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium m-0">
              {isEn
                ? "Your logo, official website, and direct contacts remain 100% visible to prospective families."
                : "O seu logótipo oficial, website e contactos diretos ficam 100% visíveis para reforçar a credibilidade da sua marca."}
            </p>
          </div>

          <div className="bg-white p-8 rounded-md border border-slate-200 shadow-sm flex flex-col">
            <div className="w-14 h-14 bg-[#F59E0B] text-white rounded-md flex items-center justify-center text-2xl font-black mb-6">
              ⚡
            </div>
            <h3 className="text-xl font-black text-[#0F172A] mb-3">
              {isEn ? "Smart Dashboard" : "Gestão Automatizada"}
            </h3>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium m-0">
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
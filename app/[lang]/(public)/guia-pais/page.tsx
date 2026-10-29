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
      ? "Parents Guide | How to Book & Prepare | HelloCamp"
      : "Guia de Pais | Como Reservar e Preparar as Férias | HelloCamp",
    description: isEn
      ? "Everything parents need to know about booking summer camps, flexible payments, safety standards, and packing checklists."
      : "Tudo o que os pais precisam de saber sobre como escolher e reservar campos de férias, pagamentos faseados, segurança e lista do que levar.",
  };
}

export default async function GuiaPaisPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isEn = lang === "en";

  const passos = [
    {
      num: "01",
      cor: "bg-[#F59E0B]",
      titulo: isEn ? "Explore & Compare" : "Explorar e Comparar",
      desc: isEn
        ? "Filter programs by district, age, category (Surf, Football, Robotics, Languages), or use our interactive map to find camps near you."
        : "Filtre programas por distrito, faixa etária, categoria (Surf, Futebol, Robótica, Línguas) ou utilize o nosso mapa interativo para encontrar campos perto de si.",
    },
    {
      num: "02",
      cor: "bg-[#2563EB]",
      titulo: isEn ? "Choose Dates & Extras" : "Escolher Turnos e Variantes",
      desc: isEn
        ? "Select full weeks or individual days, add optional accommodation or meals, and enjoy automatic sibling or multi-week discounts."
        : "Escolha semanas completas ou dias avulso, selecione opções com ou sem alojamento/alimentação e beneficie de descontos automáticos de irmãos.",
    },
    {
      num: "03",
      cor: "bg-[#16A34A]",
      titulo: isEn
        ? "Digital Medical & Safety Form"
        : "Ficha Clínica Digital Única",
      desc: isEn
        ? "Fill in food allergies, chronic conditions, and emergency contacts once. The organizer receives everything automatically."
        : "Preencha alergias alimentares, medicação e contactos de emergência num único local seguro. O organizador recebe os alertas clínicos automaticamente.",
    },
    {
      num: "04",
      cor: "bg-[#F43F5E]",
      titulo: isEn
        ? "Flexible Payment (30% Deposit)"
        : "Pagamento Seguro (Sinal de 30%)",
      desc: isEn
        ? "For eligible camps, secure your spot today by paying only a 30% deposit and settle the remaining 70% later in your Family Portal."
        : "Nos campos elegíveis, garanta já a vaga pagando apenas 30% de sinal no ato da inscrição e liquide os restantes 70% mais tarde no seu Portal da Família.",
    },
  ];

  const checklist = [
    isEn ? "Reusable water bottle with child's name" : "Garrafa de água reutilizável identificada com o nome",
    isEn ? "Sunscreen (SPF 50+) and cap/hat" : "Protetor solar (FPS 50+) e chapéu/boné",
    isEn ? "Comfortable sportswear and extra t-shirt" : "Roupa desportiva confortável e muda de roupa extra",
    isEn ? "Swimsuit, towel, and flip-flops (water activities)" : "Fato de banho, toalha e chinelos (para atividades aquáticas)",
    isEn ? "Personal medication labeled with dosage instructions" : "Medicação habitual identificada com indicação da toma",
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      {/* HERO GUIA DE PAIS */}
      <section className="bg-[#2563EB] text-white pt-20 pb-28 px-4 md:px-8 border-b-8 border-[#F59E0B] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#F59E0B] rounded-full opacity-90 pointer-events-none hidden lg:block" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-md mb-6">
            👨‍👩‍👧‍👦 {isEn ? "HelloCamp Family Guide" : "Guia Oficial para as Famílias"}
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            {isEn
              ? "How to choose and book the perfect camp with confidence."
              : "Como escolher e reservar o campo de férias ideal com total segurança."}
          </h1>
          <p className="text-blue-100 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed mb-10">
            {isEn
              ? "Everything you need to know about safety validations, split payments, medical records, and preparing your kids for an unforgettable summer."
              : "Tudo o que precisa de saber sobre validação de organizadores, pagamento faseado, fichas médicas e preparação das crianças."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${lang}/pesquisa`}
              className="bg-[#F59E0B] hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-md no-underline shadow-lg transition-all"
            >
              {isEn ? "Explore Available Camps →" : "Explorar Campos Disponíveis →"}
            </Link>
            <Link
              href={`/${lang}/seguranca`}
              className="bg-[#16A34A] hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-md no-underline shadow-lg transition-all"
            >
              {isEn ? "Safety Standards" : "Normas de Segurança"}
            </Link>
          </div>
        </div>
      </section>

      {/* 4 PASSOS SIMPLES */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center mb-14">
          <span className="text-xs font-black text-[#2563EB] uppercase tracking-widest block mb-2">
            {isEn ? "Step by Step" : "Passo a Passo"}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight">
            {isEn ? "How booking on HelloCamp works" : "Como funciona a reserva na HelloCamp"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {passos.map((p) => (
            <div
              key={p.num}
              className="bg-white p-7 rounded-md border border-slate-200 shadow-sm flex flex-col"
            >
              <div
                className={`w-12 h-12 ${p.cor} text-white rounded-md flex items-center justify-center text-base font-black mb-5`}
              >
                {p.num}
              </div>
              <h3 className="text-lg font-black text-[#0F172A] mb-3">
                {p.titulo}
              </h3>
              <p className="text-slate-600 text-sm font-medium leading-relaxed m-0">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CHECKLIST & GARANTIAS */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 md:p-10 rounded-md border border-slate-200 shadow-sm">
          <span className="inline-block bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-4">
            🎒 {isEn ? "Packing Checklist" : "Lista Prática"}
          </span>
          <h3 className="text-2xl font-black text-[#0F172A] mb-4">
            {isEn ? "What to pack in the backpack?" : "O que levar na mochila do campo?"}
          </h3>
          <ul className="space-y-3.5 p-0 m-0 list-none">
            {checklist.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-[#F8FAFC] p-3.5 rounded-md border border-slate-100"
              >
                <span className="w-6 h-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-xs font-black shrink-0">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#0F172A] text-white p-8 md:p-10 rounded-md shadow-xl flex flex-col justify-between">
          <div>
            <span className="inline-block bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-4">
              🛡️ {isEn ? "Family Portal" : "Portal da Família"}
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
              {isEn
                ? "Manage all your children's bookings in one place."
                : "Gira todas as inscrições dos seus filhos num único painel."}
            </h3>
            <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed mb-6">
              {isEn
                ? "In your Customer Area you can download payment receipts, update allergy notes, request extra days, or pay the second installment with 1 click."
                : "Na sua Área de Cliente pode consultar faturas, atualizar dados médicos dos seus filhos, pedir dias extra ao organizador ou liquidar a 2.ª prestação com 1 clique."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${lang}/login`}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs px-6 py-4 rounded-md no-underline"
            >
              {isEn ? "Access Family Portal" : "Entrar na Área de Família"}
            </Link>
            <Link
              href={`/${lang}/pesquisa`}
              className="bg-[#F59E0B] hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs px-6 py-4 rounded-md no-underline"
            >
              {isEn ? "Find a Camp" : "Procurar Campo"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
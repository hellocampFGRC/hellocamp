import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Metadata } from "next";
import BotaoFavorito from "./components/BotaoFavorito";

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
      ? "HelloCamp | Find the Best Summer Camps & Youth Programs"
      : "HelloCamp | Mais que um campo de férias",
    description: isEn
      ? "Discover and book unforgettable holiday camps, sports programs, and creative workshops for children and teens."
      : "Explora, aprende e cresce num só lugar. Encontra os melhores campos de férias e atividades para os teus filhos.",
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isEn = lang === "en";

  const { data: camposDestaque } = await supabase
    .from("campos")
    .select("*")
    .eq("ativo", true)
    .limit(6);

  const campos = camposDestaque || [];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A]">
      
      {/* 1. HERO SECTION (Bold, Simple & Modular) */}
      <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-40 px-4 md:px-8 bg-white border-b border-slate-200">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#F59E0B]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#2563EB]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[1280px] mx-auto text-center relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs font-black uppercase tracking-widest text-slate-700 mb-8 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block animate-pulse" />
            {isEn ? "More than a holiday camp" : "Mais que um campo de férias"}[cite: 1]
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1] text-[#0F172A]">
            {isEn ? "Camps that create " : "Campos que criam "}
            <span className="text-[#2563EB] underline decoration-[#F59E0B] decoration-wavy decoration-2">
              {isEn ? "great stories." : "grandes histórias."}[cite: 2]
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? "Explore, learn, and grow in one place. Find the safest and most exciting programs for children and teens."
              : "Explora, aprende e cresce num só lugar. Encontra os melhores campos de férias, desportos e aventuras para os teus filhos."}[cite: 2]
          </p>

          <div className="max-w-2xl mx-auto bg-white p-3 rounded-4xl shadow-xl border border-slate-200 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center px-4 py-3 bg-[#F8FAFC] rounded-2xl border border-slate-200">
              <span className="text-slate-400 mr-3">🔍</span>
              <input
                type="text"
                placeholder={
                  isEn
                    ? "Search sports, surf, cities..."
                    : "Pesquisa surf, futebol, Lisboa..."
                }
                className="w-full bg-transparent text-sm font-bold text-[#0F172A] outline-none placeholder:text-slate-400"
              />
            </div>
            <Link
              href={`/${lang}/pesquisa`}
              className="bg-[#F59E0B] hover:bg-amber-500 text-[#0F172A] font-black uppercase tracking-widest text-xs px-8 py-4 rounded-2xl transition-all shadow-md flex items-center justify-center no-underline"
            >
              {isEn ? "Explore Now" : "Explorar Campos"}
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {[
              { nome: "Desporto", cor: "bg-blue-50 text-[#2563EB] border-blue-200" },
              { nome: "Aventura", cor: "bg-emerald-50 text-[#16A34A] border-emerald-200" },
              { nome: "Surf", cor: "bg-amber-50 text-amber-700 border-amber-200" },
              { nome: "Artes", cor: "bg-rose-50 text-[#F43F5E] border-rose-200" },
            ].map((cat) => (
              <Link
                key={cat.nome}
                href={`/${lang}/pesquisa?categoria=${cat.nome}`}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all no-underline hover:scale-105 shadow-sm ${cat.cor}`}
              >
                {cat.nome}
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* 2. SECÇÃO DE CAMPOS EM DESTAQUE */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-20 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-black text-[#2563EB] uppercase tracking-widest block mb-2">
              {isEn ? "Handpicked for you" : "Seleção em Destaque"}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight">
              {isEn ? "Upcoming Camps & Programs" : "Próximos Campos de Férias"}
            </h2>
          </div>
          <Link
            href={`/${lang}/pesquisa`}
            className="mt-4 md:mt-0 text-sm font-black text-[#2563EB] hover:underline flex items-center gap-1 no-underline"
          >
            {isEn ? "View all camps →" : "Ver todos os campos →"}
          </Link>
        </div>

        {campos.length === 0 ? (
          <div className="bg-white rounded-4xl border border-slate-200 p-12 text-center shadow-sm">
            <span className="text-4xl block mb-3">🏕️</span>
            <h3 className="text-lg font-black text-[#0F172A]">
              {isEn ? "No camps available right now" : "Não há campos disponíveis de momento"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {isEn ? "Check back soon for new seasons." : "Volte brevemente para descobrir novos programas."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campos.map((campo: any) => {
              const nome = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const cat = isEn && campo.categoria_en ? campo.categoria_en : campo.categoria;
              const local = campo.Distrito || campo.local || "Portugal";
              const img = campo.imagem?.startsWith("http") ? campo.imagem : "/og-image.jpg";
              const preco = campo.preco || 0;

              return (
                <div
                  key={campo.id}
                  className="group flex flex-col bg-white rounded-4xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-[#2563EB] transition-all relative"
                >
                  <Link href={`/${lang}/campo/${campo.id}`} className="absolute inset-0 z-10">
                    <span className="sr-only">Ver {nome}</span>
                  </Link>

                  <div className="absolute top-4 right-4 z-20">
                    <BotaoFavorito campoId={campo.id} />
                  </div>

                  <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                    <img
                      src={img}
                      alt={nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-[#0F172A] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      {cat}
                    </div>
                  </div>

                  <div className="flex flex-col p-6 flex-1 pointer-events-none">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      <span>📍 {local}</span>
                      {campo.idade && <span>• 👶 {campo.idade}</span>}
                    </div>

                    <h3 className="text-xl font-black text-[#0F172A] mb-4 line-clamp-2 leading-snug">
                      {nome}
                    </h3>

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          {isEn ? "From" : "Desde"}
                        </span>
                        <span className="text-2xl font-black text-[#2563EB]">
                          {preco > 0 ? `${preco}€` : "Sob Consulta"}
                        </span>
                      </div>
                      <span className="bg-[#0F172A] group-hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-colors shadow-sm">
                        {isEn ? "View Camp" : "Ver Detalhes"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. BANNER B2B / PARCEIROS */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8 py-12 w-full">
        <div className="bg-[#0F172A] rounded-5xl p-8 md:p-16 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F59E0B]/20 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 max-w-xl">
            <span className="bg-[#F59E0B] text-[#0F172A] px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-4">
              {isEn ? "For Organizers" : "Área de Parceiros"}[cite: 2]
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              {isEn ? "Are you a camp organizer?" : "É organizador de campos?"}
            </h2>
            <p className="text-slate-300 font-medium text-base md:text-lg leading-relaxed">
              {isEn
                ? "Join HelloCamp to showcase your programs to thousands of families and manage bookings effortlessly."
                : "Junte-se à HelloCamp para promover os seus programas a milhares de famílias e gerir inscrições sem complicações."}
            </p>
          </div>

          <div className="relative z-10 flex-shrink-0">
            <Link
              href={`/${lang}/parceiro`}
              className="bg-[#F59E0B] hover:bg-amber-500 text-[#0F172A] font-black uppercase tracking-widest text-xs px-8 py-5 rounded-full transition-all shadow-lg inline-block no-underline hover:scale-105"
            >
              {isEn ? "Become a Partner →" : "Seja Nosso Parceiro →"}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
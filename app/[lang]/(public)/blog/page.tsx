"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const FALLBACK_BLOG =
  "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=1000";

const ARTIGOS_B2B_GARANTIDOS = [
  {
    id: "b2b-1",
    slug: "como-esgotar-vagas-campo-de-ferias",
    audiencia: "parceiros",
    categoria: "Crescimento & Vendas",
    categoria_en: "Growth & Sales",
    created_at: "2026-03-15T10:00:00Z",
    imagem_url:
      "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=1000",
    titulo: "Como esgotar as vagas do seu Campo de Férias mais cedo este verão",
    titulo_en: "How to sell out your Summer Camp spots earlier this season",
    resumo:
      "Descubra como estruturar pacotes com sinal de 30%, descontos automáticos de irmãos e fotografias de alta conversão na sua montra HelloCamp.",
    resumo_en:
      "Learn how to structure packages with a 30% deposit, automatic sibling discounts, and high-converting photography on your HelloCamp showcase.",
    link_direto: "/parceiro",
  },
  {
    id: "b2b-2",
    slug: "gestao-fichas-medicas-alergias-campos-ferias",
    audiencia: "parceiros",
    categoria: "Operações & Segurança",
    categoria_en: "Operations & Safety",
    created_at: "2026-03-22T10:00:00Z",
    imagem_url:
      "https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&q=80&w=1000",
    titulo: "Adeus às folhas de Excel soltas: Gestão digital de alergias e fichas médicas",
    titulo_en: "Goodbye messy spreadsheets: Digital management of allergies and medical forms",
    resumo:
      "Como automatizar a recolha de restrições alimentares, medicação e contactos de emergência no ato da inscrição e exportar tudo em 1 clique.",
    resumo_en:
      "How to automate the collection of dietary restrictions, medication, and emergency contacts at checkout and export everything in 1 click.",
    link_direto: "/parceiro",
  },
  {
    id: "b2b-3",
    slug: "recrutar-monitores-certificados-ipdj",
    audiencia: "parceiros",
    categoria: "Recrutamento & Staff",
    categoria_en: "Recruitment & Staff",
    created_at: "2026-04-02T10:00:00Z",
    imagem_url:
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=1000",
    titulo: "Guia prático para recrutar Monitores Certificados (IPDJ e Socorrismo)",
    titulo_en: "Practical guide to recruiting Certified Camp Monitors (IPDJ & First Aid)",
    resumo:
      "Utilize a Bolsa de Talentos HelloCamp para filtrar candidatos pelo seu distrito, semanas de disponibilidade e certificações oficiais.",
    resumo_en:
      "Use the HelloCamp Talent Pool to filter candidates by your district, availability weeks, and official certifications.",
    link_direto: "/monitores",
  },
];

export default function BlogIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [audiencia, setAudiencia] = useState<"pais" | "parceiros">("pais");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Tudo");

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("publicado", true)
        .order("created_at", { ascending: false });

      const bdPosts = data || [];
      const temParceirosNaBD = bdPosts.some((p) => p.audiencia === "parceiros");

      if (!temParceirosNaBD) {
        setPosts([...bdPosts, ...ARTIGOS_B2B_GARANTIDOS]);
      } else {
        setPosts(bdPosts);
      }
      setLoading(false);
    }
    loadPosts();
  }, []);

  const postsDaAudiencia = posts.filter((p) =>
    audiencia === "parceiros"
      ? p.audiencia === "parceiros"
      : p.audiencia !== "parceiros"
  );

  const categorias = [
    "Tudo",
    ...Array.from(
      new Set(
        postsDaAudiencia
          .map((p) => (isEn && p.categoria_en ? p.categoria_en : p.categoria))
          .filter(Boolean)
      )
    ),
  ];

  const postsFiltrados = postsDaAudiencia.filter((p) => {
    if (categoriaAtiva === "Tudo") return true;
    const cat = isEn && p.categoria_en ? p.categoria_en : p.categoria;
    return cat === categoriaAtiva;
  });

  const formatarData = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(isEn ? "en-GB" : "pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      {/* HERO VIBRANTE COM O MESMO DESIGN DA PÁGINA PARCEIROS */}
      <section className="relative overflow-hidden bg-[#2563EB] text-white pt-20 pb-28 md:pt-24 md:pb-32 px-4 md:px-8 border-b-8 border-[#F59E0B]">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#F59E0B] opacity-90 pointer-events-none hidden lg:block" />
        <div className="absolute bottom-[-60px] left-[-60px] w-72 h-72 rounded-full bg-[#16A34A] opacity-90 pointer-events-none hidden lg:block" />
        <div className="absolute top-1/3 left-10 w-20 h-20 rounded-2xl bg-[#F43F5E] rotate-12 opacity-90 pointer-events-none hidden xl:block" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 border border-white/30 rounded-md text-xs font-black uppercase tracking-widest text-white mb-6 backdrop-blur-md shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            {isEn ? "HelloCamp Editorial & Guides" : "Revista & Guias HelloCamp"}
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-5 leading-tight text-white">
            {isEn
              ? "Stories, Tips & Camp Guides"
              : "Dicas, Guias e Histórias de Verão"}
          </h1>
          <p className="text-blue-100 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? "Practical articles for families choosing the best summer camp and strategies for partner organizers."
              : "Artigos práticos para famílias escolherem o campo ideal e estratégias de gestão para entidades organizadoras."}
          </p>
        </div>
      </section>

      {/* SELETOR DE AUDIÊNCIA E CATEGORIAS */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-10 -mt-14 relative z-20">
        <div className="flex justify-center mb-10">
          <div className="flex bg-white p-2 rounded-md shadow-xl border border-slate-200 gap-2">
            <button
              type="button"
              onClick={() => {
                setAudiencia("pais");
                setCategoriaAtiva("Tudo");
              }}
              className={`px-7 py-4 rounded-md text-xs font-black tracking-widest uppercase transition-all cursor-pointer border-0 ${
                audiencia === "pais"
                  ? "bg-[#F59E0B] text-white shadow-md"
                  : "bg-transparent text-slate-600 hover:bg-slate-100"
              }`}
            >
              👨‍👩‍👧 {isEn ? "For Families" : "Para Famílias"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAudiencia("parceiros");
                setCategoriaAtiva("Tudo");
              }}
              className={`px-7 py-4 rounded-md text-xs font-black tracking-widest uppercase transition-all cursor-pointer border-0 ${
                audiencia === "parceiros"
                  ? "bg-[#16A34A] text-white shadow-md"
                  : "bg-transparent text-slate-600 hover:bg-slate-100"
              }`}
            >
              🏢 {isEn ? "For Organizers" : "Para Organizadores"}
            </button>
          </div>
        </div>

        {/* FILTRO DE CATEGORIAS */}
        {!loading && categorias.length > 1 && (
          <div className="flex flex-wrap gap-3 mb-12 justify-center">
            {categorias.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-5 py-2.5 rounded-md text-xs font-black tracking-wider uppercase transition-all border shadow-sm cursor-pointer ${
                  categoriaAtiva === cat
                    ? audiencia === "pais"
                      ? "bg-[#2563EB] border-[#2563EB] text-white"
                      : "bg-[#16A34A] border-[#16A34A] text-white"
                    : "bg-white border-slate-200 text-slate-700 hover:border-[#2563EB]"
                }`}
              >
                {cat === "Tudo"
                  ? isEn
                    ? "All Articles"
                    : "Todos os Artigos"
                  : cat}
              </button>
            ))}
          </div>
        )}

        {/* GRELHA DE ARTIGOS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-md border border-slate-200 overflow-hidden animate-pulse"
              >
                <div className="h-60 bg-slate-200" />
                <div className="p-8 space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-8 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {postsFiltrados.map((post) => {
              const titulo =
                isEn && post.titulo_en ? post.titulo_en : post.titulo;
              const resumo =
                isEn && post.resumo_en ? post.resumo_en : post.resumo;
              const categoria =
                isEn && post.categoria_en ? post.categoria_en : post.categoria;
              const isPartner = audiencia === "parceiros";
              const destinoHref = post.link_direto
                ? `/${lang}${post.link_direto}`
                : `/${lang}/blog/${post.slug}`;

              return (
                <Link
                  key={post.id}
                  href={destinoHref}
                  className="group bg-white rounded-md border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#2563EB] transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1 no-underline"
                >
                  <div className="relative w-full h-60 bg-slate-100 overflow-hidden">
                    <img
                      src={post.imagem_url || FALLBACK_BLOG}
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_BLOG;
                      }}
                      alt={titulo}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {categoria && (
                      <div
                        className={`absolute top-4 left-4 px-3.5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest text-white shadow-sm ${
                          isPartner ? "bg-[#16A34A]" : "bg-[#2563EB]"
                        }`}
                      >
                        {categoria}
                      </div>
                    )}
                  </div>
                  <div className="p-7 flex flex-col flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {formatarData(post.created_at)}
                    </p>
                    <h3 className="text-xl font-black text-[#0F172A] leading-tight mb-3 line-clamp-3 group-hover:text-[#2563EB] transition-colors">
                      {titulo}
                    </h3>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed line-clamp-3 mb-6">
                      {resumo}
                    </p>
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span
                        className={`px-5 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest text-white shadow-sm ${
                          isPartner ? "bg-[#16A34A]" : "bg-[#F59E0B]"
                        }`}
                      >
                        {isEn ? "Read Guide →" : "Ler Guia →"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
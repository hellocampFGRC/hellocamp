"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const FALLBACK_BLOG =
  "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=1000";

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

      setPosts(data || []);
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
      {/* HEADER EDITORIAL */}
      <section className="bg-[#0F172A] text-white pt-20 pb-28 text-center relative overflow-hidden border-b-8 border-[#F59E0B]">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="inline-block text-[10px] font-black tracking-widest text-white bg-[#F59E0B] px-3.5 py-1.5 rounded-md uppercase mb-6">
            {isEn ? "Editorial & Guides" : "Editorial & Guias"}
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight text-white">
            {isEn ? "HelloCamp Journal" : "Recursos & Blog HelloCamp"}
          </h1>
          <p className="text-slate-300 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? "Expert articles, tips, and guides to help you plan the perfect summer experience."
              : "Artigos, dicas de especialistas e guias práticos para famílias e organizadores de campos de férias."}
          </p>
        </div>
      </section>

      {/* NAVEGAÇÃO E FILTROS */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-10 -mt-14 relative z-20">
        <div className="flex justify-center mb-10">
          <div className="flex bg-white p-1.5 rounded-md shadow-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAudiencia("pais");
                setCategoriaAtiva("Tudo");
              }}
              className={`px-8 py-3.5 rounded-md text-xs font-black tracking-widest uppercase transition-all cursor-pointer border-0 ${
                audiencia === "pais"
                  ? "bg-[#2563EB] text-white shadow-md"
                  : "bg-transparent text-slate-600 hover:text-[#0F172A]"
              }`}
            >
              {isEn ? "For Families" : "Para Famílias"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAudiencia("parceiros");
                setCategoriaAtiva("Tudo");
              }}
              className={`px-8 py-3.5 rounded-md text-xs font-black tracking-widest uppercase transition-all cursor-pointer border-0 ${
                audiencia === "parceiros"
                  ? "bg-[#16A34A] text-white shadow-md"
                  : "bg-transparent text-slate-600 hover:text-[#0F172A]"
              }`}
            >
              {isEn ? "For Organizers" : "Para Organizadores"}
            </button>
          </div>
        </div>

        {/* CATEGORIAS */}
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
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
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
        ) : postsFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-md border border-slate-200 shadow-sm max-w-2xl mx-auto">
            <h3 className="text-2xl font-black text-[#0F172A] mb-2">
              {isEn ? "No articles published yet" : "Sem artigos publicados"}
            </h3>
            <p className="text-slate-500 font-medium">
              {isEn
                ? "We are preparing new guides for this section."
                : "A nossa equipa editorial está a preparar novos conteúdos para esta secção."}
            </p>
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

              return (
                <Link
                  key={post.id}
                  href={`/${lang}/blog/${post.slug}`}
                  className="group bg-white rounded-md border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1 no-underline"
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
                        className={`absolute top-4 left-4 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest text-white shadow-sm ${
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
                        className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest text-white ${
                          isPartner ? "bg-[#16A34A]" : "bg-[#2563EB]"
                        }`}
                      >
                        {isEn ? "Read Article →" : "Ler Artigo →"}
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
"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MeusCamposAdminPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [campos, setCampos] = useState<any[]>([]);
  const [perfilBase, setPerfilBase] = useState<any>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const fetchMeusCampos = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push(`/${lang}/login`);
      return;
    }

    const uid = session.user.id;

    const [{ data: perfilData }, { data: camposData }] = await Promise.all([
      supabase
        .from("perfis")
        .select("id, taxa_comissao, base_comissao, status_contrato")
        .eq("id", uid)
        .maybeSingle(),
      supabase
        .from("campos")
        .select("*")
        .eq("organizador_id", uid)
        .order("created_at", { ascending: false }),
    ]);

    setPerfilBase(perfilData || null);
    setCampos(camposData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMeusCampos();
  }, [lang]);

  // Função para Duplicar Programa (poupa tempo ao parceiro para criar turnos de Páscoa/Verão)
  const handleDuplicarCampo = async (campoOriginal: any) => {
    setDuplicatingId(campoOriginal.id);
    try {
      const {
        id: _ignoreId,
        created_at: _ignoreCreated,
        rating_score: _ignoreRating,
        total_reviews: _ignoreReviews,
        ...restoDados
      } = campoOriginal;

      const copiaPayload = {
        ...restoDados,
        nome: `${campoOriginal.nome} (Cópia)`,
        nome_en: campoOriginal.nome_en
          ? `${campoOriginal.nome_en} (Copy)`
          : `${campoOriginal.nome} (Copy)`,
        ativo: false,
        status_aprovacao: "Pendente de Revisão",
      };

      const { error } = await supabase.from("campos").insert([copiaPayload]);
      if (error) throw error;

      await fetchMeusCampos();
    } catch (err: any) {
      alert("Erro ao duplicar campo: " + err.message);
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto font-sans text-[#0F172A] pb-20">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <span className="inline-block bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-2">
            {isEn ? "Program Management" : "Gestão de Programas"}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#0F172A] m-0 tracking-tight">
            {isEn ? "My Camps & Programs" : "Os Meus Campos e Programas"}
          </h1>
          <p className="text-slate-500 mt-1 mb-0 text-xs md:text-sm font-medium">
            {isEn
              ? "Manage your holiday camps, prices, spots, and schedules."
              : "Gira os seus programas de férias, preços, pacotes, galerias e disponibilidade."}
          </p>
        </div>

        <Link
          href={`/${lang}/admin/campos/novo`}
          className="w-full sm:w-auto bg-[#16A34A] hover:bg-green-700 text-white px-6 py-3.5 rounded-md font-black text-xs text-center transition-colors shadow-sm no-underline uppercase tracking-widest shrink-0"
        >
          + {isEn ? "Add New Camp" : "Adicionar Novo Campo"}
        </Link>
      </div>

      {/* LISTA DE CAMPOS */}
      {loading ? (
        <div className="text-center py-14 text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">
          {isEn ? "Loading your camps..." : "A carregar os seus campos..."}
        </div>
      ) : campos.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border-2 border-dashed border-slate-300 rounded-md">
          <div className="text-4xl mb-3">🏕️</div>
          <p className="text-slate-600 font-bold mb-5 text-sm md:text-base">
            {isEn
              ? "You haven't added any camps yet."
              : "Ainda não tem nenhum campo registado."}
          </p>
          <Link
            href={`/${lang}/admin/campos/novo`}
            className="inline-block bg-[#16A34A] hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-md no-underline shadow-sm"
          >
            {isEn
              ? "Create your first camp →"
              : "Criar o meu primeiro campo →"}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {campos.map((campo: any) => {
            const nomeVisivel =
              isEn && campo.nome_en ? campo.nome_en : campo.nome;
            const localVisivel =
              isEn && campo.local_en ? campo.local_en : campo.local;
            const vagasVisivel = campo.vagas_totais || 0;
            const textoVagas = isEn ? "spots" : "vagas";

            let precoVisivel = Number(campo.preco) || 0;
            if (
              !precoVisivel &&
              Array.isArray(campo.pacotes) &&
              campo.pacotes.length > 0
            ) {
              const todosPrecos = campo.pacotes.flatMap((p: any) =>
                Array.isArray(p.variantes)
                  ? p.variantes.map((v: any) => Number(v.preco) || 0)
                  : []
              );
              const validos = todosPrecos.filter((n: number) => n > 0);
              if (validos.length > 0) {
                precoVisivel = Math.min(...validos);
              }
            }

            const isComissaoEspecifica =
              campo.taxa_comissao !== null &&
              campo.taxa_comissao !== undefined;
            const taxaVisual = isComissaoEspecifica
              ? campo.taxa_comissao
              : perfilBase?.taxa_comissao ?? 12;

            const isAtivo =
              campo.ativo === true && campo.status_aprovacao === "Aprovado";

            return (
              <div
                key={campo.id}
                className="flex flex-col lg:flex-row justify-between lg:items-center gap-5 p-6 bg-white rounded-md border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                      {isEn && campo.categoria_en
                        ? campo.categoria_en
                        : campo.categoria || "Campo"}
                    </span>

                    {isAtivo ? (
                      <span className="bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                        ✓ {isEn ? "Published & Active" : "Publicado & Ativo"}
                      </span>
                    ) : (
                      <span className="bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                        ⏳{" "}
                        {campo.status_aprovacao ||
                          (isEn ? "Under Review" : "Pendente de Revisão")}
                      </span>
                    )}

                    <span className="bg-[#0F172A] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                      {taxaVisual}% {isEn ? "Fee" : "Comissão"}
                    </span>
                  </div>

                  <h3 className="m-0 text-lg md:text-xl font-black text-[#0F172A] mb-3">
                    {nomeVisivel}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#0F172A] bg-[#F8FAFC] border border-slate-200 px-3 py-1.5 rounded-md">
                      📍 {localVisivel}
                    </span>
                    <span className="text-xs font-bold text-[#0F172A] bg-[#F8FAFC] border border-slate-200 px-3 py-1.5 rounded-md">
                      👥 {vagasVisivel} {textoVagas}
                    </span>
                    <span className="text-xs font-bold text-[#0F172A] bg-[#F8FAFC] border border-slate-200 px-3 py-1.5 rounded-md">
                      💰 {isEn ? "From " : "Desde "}
                      {precoVisivel > 0 ? `${precoVisivel}€` : "--"}
                    </span>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO DO CAMPO (SEM O BOTÃO DE CONTRATO AQUI!) */}
                <div className="flex flex-col sm:flex-row flex-wrap justify-end gap-2.5 mt-4 lg:mt-0 w-full lg:w-auto">
                  <Link
                    href={
                      isAtivo
                        ? `/${lang}/campo/${campo.id}`
                        : `/${lang}/campo/${campo.id}?preview=admin`
                    }
                    target="_blank"
                    className="flex items-center justify-center gap-1.5 px-4 py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md font-black text-xs uppercase tracking-widest no-underline transition-colors shadow-sm"
                  >
                    👁️ {isEn ? "Preview Page" : "Ver Página"} ↗
                  </Link>

                  <button
                    type="button"
                    disabled={duplicatingId === campo.id}
                    onClick={() => handleDuplicarCampo(campo)}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 bg-[#F59E0B] hover:bg-amber-600 text-white rounded-md font-black text-xs uppercase tracking-widest cursor-pointer border-0 transition-colors shadow-sm"
                  >
                    📋{" "}
                    {duplicatingId === campo.id
                      ? "..."
                      : isEn
                      ? "Duplicate"
                      : "Duplicar"}
                  </button>

                  <Link
                    href={`/${lang}/admin/campos/editar/${campo.id}`}
                    className="flex items-center justify-center px-5 py-3 bg-[#16A34A] hover:bg-green-700 text-white rounded-md font-black text-xs uppercase tracking-widest no-underline transition-colors shadow-sm"
                  >
                    ✏️ {isEn ? "Edit Camp" : "Editar Campo"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
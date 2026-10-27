"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function GestaoCamposHQ({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const searchParams = useSearchParams();
  const parceiroUrlParam = searchParams.get("parceiro") || "todos";

  const [campos, setCampos] = useState<any[]>([]);
  const [parceirosLista, setParceirosLista] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroParceiroId, setFiltroParceiroId] =
    useState<string>(parceiroUrlParam);
  const [isParceiroDropdownOpen, setIsParceiroDropdownOpen] = useState(false);

  // Modal de Ajuste Rápido de Parceiro e Comissão
  const [showModal, setShowModal] = useState(false);
  const [campoEmEdicao, setCampoEmEdicao] = useState<any>(null);
  const [openModalDropdown, setOpenModalDropdown] = useState<string | null>(
    null
  );

  const fetchCamposGerais = async () => {
    setLoading(true);
    const [{ data: camposData }, { data: perfisData }] = await Promise.all([
      supabase
        .from("campos")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("perfis")
        .select(
          "id, empresa_nome, nome_completo, email, taxa_comissao, base_comissao, status_contrato"
        )
        .eq("role", "organizador")
        .order("empresa_nome", { ascending: true }),
    ]);

    setParceirosLista(perfisData || []);

    const camposComPerfis = (camposData || []).map((campo) => {
      const organizador = perfisData?.find(
        (p) => p.id === campo.organizador_id
      );

      let precoMinimo = Number(campo.preco) || 0;
      let pacotesArray = [];
      if (typeof campo.pacotes === "string") {
        try {
          pacotesArray = JSON.parse(campo.pacotes);
        } catch {
          pacotesArray = [];
        }
      } else if (Array.isArray(campo.pacotes)) {
        pacotesArray = campo.pacotes;
      }

      if (pacotesArray.length > 0 && !precoMinimo) {
        const todosPrecos = pacotesArray.flatMap((p: any) =>
          (Array.isArray(p.variantes) ? p.variantes : [])
            .map((v: any) => Number(v.preco) || 0)
            .filter((v: number) => v > 0)
        );
        if (todosPrecos.length > 0) precoMinimo = Math.min(...todosPrecos);
      }

      return {
        ...campo,
        precoCalculado: precoMinimo,
        perfis: organizador || {
          empresa_nome: "Listagem SEO / Sem Parceiro",
          email: "",
          status_contrato: null,
        },
      };
    });

    setCampos(camposComPerfis);
    setLoading(false);
  };

  useEffect(() => {
    fetchCamposGerais();
  }, []);

  const handleToggleAprovacaoRapida = async (campo: any) => {
    const novoStatus =
      campo.status_aprovacao === "Aprovado" ? "Pendente" : "Aprovado";
    const { error } = await supabase
      .from("campos")
      .update({
        status_aprovacao: novoStatus,
        ativo: novoStatus === "Aprovado",
        contrato_parceiro_url:
          campo.contrato_parceiro_url || "aprovado_superadmin_hq",
      })
      .eq("id", campo.id);

    if (!error) fetchCamposGerais();
    else alert(error.message);
  };

  const handleApagarCampo = async (id: string, nomeCampo: string) => {
    if (
      !window.confirm(
        `Tem a certeza que deseja apagar o campo "${nomeCampo}" permanentemente?`
      )
    )
      return;
    const { error } = await supabase.from("campos").delete().eq("id", id);
    if (!error) {
      fetchCamposGerais();
    } else {
      alert("Erro ao apagar: " + error.message);
    }
  };

  const handleSalvarComissaoEParceiro = async (e: React.FormEvent) => {
    e.preventDefault();
    const taxa =
      campoEmEdicao.taxa_comissao === "" || campoEmEdicao.taxa_comissao === null
        ? null
        : Number(campoEmEdicao.taxa_comissao);
    const base =
      campoEmEdicao.base_comissao === "" ? null : campoEmEdicao.base_comissao;

    const { error } = await supabase
      .from("campos")
      .update({
        organizador_id: campoEmEdicao.organizador_id || null,
        taxa_comissao: taxa,
        base_comissao: base,
      })
      .eq("id", campoEmEdicao.id);

    if (!error) {
      alert("Configurações do campo atualizadas com sucesso!");
      setShowModal(false);
      fetchCamposGerais();
    } else {
      alert("Erro: " + error.message);
    }
  };

  const camposFiltrados = campos.filter((c) => {
    if (
      filtroParceiroId !== "todos" &&
      c.organizador_id !== filtroParceiroId
    )
      return false;
    if (pesquisa.trim()) {
      const q = pesquisa.toLowerCase();
      return (
        (c.nome || "").toLowerCase().includes(q) ||
        (c.perfis?.empresa_nome || "").toLowerCase().includes(q) ||
        (c.local || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">
        A carregar todos os programas do Marketplace...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-sans pb-20">
      {/* CABEÇALHO EXECUTIVO COM BOTÃO DE ADICIONAR NOVO CAMPO */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-white p-6 border border-slate-200 rounded-md shadow-sm">
        <div>
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#0E3A68] bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-sm mb-2">
            SuperAdmin Master HQ
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight m-0">
            Gestão Global de Campos & Comissões
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 mb-0">
            {camposFiltrados.length} Programas Registados • Crie novos campos em
            nome de qualquer parceiro ou para SEO.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar campo, local ou parceiro..."
            className="bg-slate-50 border border-slate-300 rounded-md px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-slate-900 focus:bg-white min-w-[220px]"
          />

          {/* DROPDOWN CUSTOMIZADO DE FILTRO POR PARCEIRO */}
          <div className="relative min-w-[230px]">
            <div
              onClick={() => setIsParceiroDropdownOpen(!isParceiroDropdownOpen)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-black text-slate-800 cursor-pointer flex justify-between items-center hover:border-slate-900"
            >
              <span className="truncate">
                {filtroParceiroId === "todos"
                  ? "🏢 Todos os Parceiros"
                  : parceirosLista.find((p) => p.id === filtroParceiroId)
                      ?.empresa_nome || "Parceiro Selecionado"}
              </span>
              <span className="text-[10px] ml-2">▼</span>
            </div>
            {isParceiroDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsParceiroDropdownOpen(false)}
                />
                <div className="absolute top-[calc(100%+4px)] right-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-50 max-h-60 overflow-y-auto">
                  <div
                    onClick={() => {
                      setFiltroParceiroId("todos");
                      setIsParceiroDropdownOpen(false);
                    }}
                    className="p-3 text-xs font-black text-[#167524] hover:bg-emerald-50 cursor-pointer border-b border-slate-100"
                  >
                    Todos os Parceiros
                  </div>
                  {parceirosLista.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setFiltroParceiroId(p.id);
                        setIsParceiroDropdownOpen(false);
                      }}
                      className="p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                    >
                      {p.empresa_nome || p.nome_completo || p.email}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* BOTÃO ADICIONAR NOVO CAMPO NO SUPERADMIN */}
          <Link
            href={`/${lang}/superadmin/campos/editar/novo${
              filtroParceiroId !== "todos"
                ? `?parceiro=${filtroParceiroId}`
                : ""
            }`}
            className="bg-[#167524] hover:bg-[#115a1b] text-white font-black uppercase tracking-widest text-xs px-5 py-2.5 rounded-md no-underline shadow-sm transition-colors whitespace-nowrap"
          >
            + Adicionar Novo Campo
          </Link>
        </div>
      </div>

      {/* TABELA DE CAMPOS */}
      <div className="bg-white border border-slate-200 rounded-md overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[900px] border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Programa / Localização
              </th>
              <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Parceiro Organizador
              </th>
              <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Preço Base / Taxa
              </th>
              <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Estado de Publicação
              </th>
              <th className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                Ações SuperAdmin
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {camposFiltrados.map((c) => {
              const isAprovado = c.status_aprovacao === "Aprovado";
              const taxaEfetiva =
                c.taxa_comissao !== null && c.taxa_comissao !== undefined
                  ? c.taxa_comissao
                  : c.perfis?.taxa_comissao ?? 12;

              return (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-4">
                    <Link
                      href={`/${lang}/campo/${c.id}`}
                      target="_blank"
                      className="font-black text-sm text-slate-900 hover:text-[#0E3A68] no-underline block"
                    >
                      {c.nome} ↗
                    </Link>
                    <span className="text-xs text-slate-500 font-medium">
                      📍 {c.Distrito || c.local} • {c.categoria}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-bold text-sm text-slate-800">
                      {c.perfis?.empresa_nome ||
                        c.perfis?.nome_completo ||
                        "Listagem Direta / Sem Parceiro"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {c.perfis?.email}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-black text-sm text-slate-900">
                      {c.precoCalculado > 0 ? `${c.precoCalculado}€` : "--"}
                    </div>
                    <span className="text-[10px] font-black text-[#167524] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                      {taxaEfetiva}% Comissão
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => handleToggleAprovacaoRapida(c)}
                      className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest cursor-pointer border ${
                        isAprovado && c.ativo
                          ? "bg-emerald-50 text-[#167524] border-emerald-300"
                          : "bg-amber-50 text-amber-900 border-amber-300"
                      }`}
                    >
                      {isAprovado && c.ativo
                        ? "✓ Online (Ativo)"
                        : "⏳ Oculto (Clicar p/ Ativar)"}
                    </button>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCampoEmEdicao({
                            id: c.id,
                            nome: c.nome,
                            organizador_id: c.organizador_id || "",
                            taxa_comissao:
                              c.taxa_comissao !== null &&
                              c.taxa_comissao !== undefined
                                ? c.taxa_comissao
                                : "",
                            base_comissao: c.base_comissao || "",
                          });
                          setShowModal(true);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-black uppercase tracking-widest text-[10px] px-3 py-2 rounded-md cursor-pointer"
                      >
                        ⚙️ Parceiro / Taxa
                      </button>

                      <Link
                        href={`/${lang}/superadmin/campos/editar/${c.id}`}
                        className="bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-md no-underline flex items-center"
                      >
                        ✏️ Editar Campo
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleApagarCampo(c.id, c.nome)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-black text-xs px-3 py-2 rounded-md cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DE ATRIBUIÇÃO DE PARCEIRO E COMISSÃO ESPECÍFICA */}
      {showModal && campoEmEdicao && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-md max-w-md w-full p-6 border border-slate-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-slate-900 m-0 mb-4 pb-3 border-b border-slate-200">
              ⚙️ Configurar: {campoEmEdicao.nome}
            </h3>
            <form
              onSubmit={handleSalvarComissaoEParceiro}
              className="space-y-4"
            >
              <div className="relative">
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Parceiro Proprietário do Campo
                </label>
                <div
                  onClick={() =>
                    setOpenModalDropdown(
                      openModalDropdown === "org" ? null : "org"
                    )
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md text-xs font-black cursor-pointer flex justify-between items-center"
                >
                  <span className="truncate">
                    {parceirosLista.find(
                      (p) => p.id === campoEmEdicao.organizador_id
                    )?.empresa_nome ||
                      parceirosLista.find(
                        (p) => p.id === campoEmEdicao.organizador_id
                      )?.email ||
                      "Sem Parceiro (Listagem Direta / SEO)"}
                  </span>
                  <span>▼</span>
                </div>
                {openModalDropdown === "org" && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-300 rounded-md shadow-xl z-50 max-h-52 overflow-y-auto">
                    <div
                      onClick={() => {
                        setCampoEmEdicao({
                          ...campoEmEdicao,
                          organizador_id: "",
                        });
                        setOpenModalDropdown(null);
                      }}
                      className="p-3 text-xs font-black text-slate-500 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                    >
                      -- Sem Parceiro (Listagem Direta / SEO) --
                    </div>
                    {parceirosLista.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setCampoEmEdicao({
                            ...campoEmEdicao,
                            organizador_id: p.id,
                          });
                          setOpenModalDropdown(null);
                        }}
                        className="p-3 text-xs font-bold hover:bg-blue-50 cursor-pointer border-b border-slate-50"
                      >
                        {p.empresa_nome || p.nome_completo} ({p.email})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Taxa de Comissão Específica (%) (Vazio = Herdar do Parceiro)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 12"
                  value={campoEmEdicao.taxa_comissao}
                  onChange={(e) =>
                    setCampoEmEdicao({
                      ...campoEmEdicao,
                      taxa_comissao: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md text-sm font-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-md border border-slate-300 bg-white text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#167524] text-white font-black uppercase tracking-widest text-xs px-6 py-2.5 rounded-md cursor-pointer"
                >
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
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

  // Modal de Ajuste de Comissão e Atribuição de Parceiro
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
          empresa_nome: "Sem Parceiro Associado",
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
      <div className="p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">
        A carregar todos os programas do Marketplace...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto font-sans pb-20">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight m-0">
            Moderação de Campos & Comissões
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 mb-0">
            {camposFiltrados.length} Programas Registados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar campo ou parceiro..."
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none min-w-[220px]"
          />

          {/* DROPDOWN CUSTOMIZADO DE FILTRO POR PARCEIRO */}
          <div className="relative min-w-[240px]">
            <div
              onClick={() => setIsParceiroDropdownOpen(!isParceiroDropdownOpen)}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 cursor-pointer flex justify-between items-center"
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
                <div className="absolute top-[calc(100%+4px)] right-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
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
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[900px] border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Programa / Local
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Parceiro Organizador
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Preço / Comissão
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Estado Online
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                Ações SuperAdmin
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {camposFiltrados.map((c) => {
              const isAprovado = c.status_aprovacao === "Aprovado";
              const taxaEfetiva =
                c.taxa_comissao !== null && c.taxa_comissao !== undefined
                  ? c.taxa_comissao
                  : c.perfis?.taxa_comissao ?? 12;

              return (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-4">
                    <Link
                      href={`/${lang}/campo/${c.id}`}
                      target="_blank"
                      className="font-black text-sm text-slate-900 hover:text-blue-600 no-underline block"
                    >
                      {c.nome} ↗
                    </Link>
                    <span className="text-xs text-slate-500">
                      📍 {c.Distrito || c.local} • {c.categoria}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-bold text-sm text-slate-800">
                      {c.perfis?.empresa_nome ||
                        c.perfis?.nome_completo ||
                        "Sem Parceiro"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {c.perfis?.email}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-black text-sm text-slate-900">
                      {c.precoCalculado > 0 ? `${c.precoCalculado}€` : "--"}
                    </div>
                    <span className="text-[10px] font-black text-[#167524] bg-emerald-50 px-2 py-0.5 rounded">
                      {taxaEfetiva}% Fee
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleToggleAprovacaoRapida(c)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer border ${
                        isAprovado && c.ativo
                          ? "bg-emerald-100 text-[#167524] border-emerald-200"
                          : "bg-amber-100 text-amber-900 border-amber-200"
                      }`}
                    >
                      {isAprovado && c.ativo
                        ? "✓ Aprovado Online"
                        : "⏳ Pendente (Clicar p/ Ativar)"}
                    </button>
                  </td>

                  <td className="px-6 py-4 text-right">
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
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-black uppercase tracking-widest text-[10px] px-3.5 py-2 rounded-xl cursor-pointer"
                      >
                        ⚙️ Parceiro / Fee
                      </button>

                      <Link
                        href={`/${lang}/superadmin/campos/editar/${c.id}`}
                        className="bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-xl no-underline flex items-center"
                      >
                        ✏️ Editar Tudo
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleApagarCampo(c.id, c.nome)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs px-3 py-2 rounded-xl cursor-pointer"
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
            className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-slate-900 m-0 mb-4">
              ⚙️ Configurar: {campoEmEdicao.nome}
            </h3>
            <form
              onSubmit={handleSalvarComissaoEParceiro}
              className="space-y-4"
            >
              {/* Dropdown Customizado de Parceiro */}
              <div className="relative">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Parceiro Proprietário do Campo
                </label>
                <div
                  onClick={() =>
                    setOpenModalDropdown(
                      openModalDropdown === "org" ? null : "org"
                    )
                  }
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black cursor-pointer flex justify-between items-center"
                >
                  <span className="truncate">
                    {parceirosLista.find(
                      (p) => p.id === campoEmEdicao.organizador_id
                    )?.empresa_nome ||
                      parceirosLista.find(
                        (p) => p.id === campoEmEdicao.organizador_id
                      )?.email ||
                      "Selecionar Parceiro..."}
                  </span>
                  <span>▼</span>
                </div>
                {openModalDropdown === "org" && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
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
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Taxa de Comissão Específica (%) (Vazio = Herdar do Parceiro)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 15"
                  value={campoEmEdicao.taxa_comissao}
                  onChange={(e) =>
                    setCampoEmEdicao({
                      ...campoEmEdicao,
                      taxa_comissao: e.target.value,
                    })
                  }
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#167524] text-white font-black uppercase tracking-widest text-xs px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
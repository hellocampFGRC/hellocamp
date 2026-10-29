"use client";

import React, { useState, useEffect, useRef, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BotaoFavorito from "../components/BotaoFavorito";

const normalize = (str: string) =>
  (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

interface OptionItem {
  value: string;
  label: string;
}

function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  options: OptionItem[];
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  return (
    <div ref={ref} className="relative w-full">
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full bg-[#F8FAFC] border ${
          open ? "border-[#2563EB] bg-white" : "border-slate-200"
        } rounded-md px-3.5 py-3 text-left text-sm font-bold text-[#0F172A] flex items-center justify-between transition-all cursor-pointer shadow-sm hover:border-[#2563EB]`}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ml-2 ${
            open ? "rotate-180 text-[#2563EB]" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-md shadow-2xl max-h-64 overflow-y-auto py-1">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between cursor-pointer border-0 transition-colors ${
                  active
                    ? "bg-[#2563EB] text-white font-black"
                    : "bg-white text-[#0F172A] hover:bg-slate-100"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {active && <span>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PesquisaConteudo({ lang }: { lang: string }) {
  const isEn = lang === "en";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [todosCampos, setTodosCampos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [distrito, setDistrito] = useState(searchParams.get("distrito") || "");
  const [categoria, setCategoria] = useState(searchParams.get("categoria") || "");
  const [idade, setIdade] = useState(searchParams.get("idade") || "");
  const [dataInicio, setDataInicio] = useState(searchParams.get("data") || "");
  const [ordem, setOrdem] = useState(searchParams.get("ordem") || "relevancia");

  useEffect(() => {
    setQ(searchParams.get("q") || "");
    setDistrito(searchParams.get("distrito") || "");
    setCategoria(searchParams.get("categoria") || "");
    setIdade(searchParams.get("idade") || "");
    setDataInicio(searchParams.get("data") || "");
    setOrdem(searchParams.get("ordem") || "relevancia");
  }, [searchParams]);

  useEffect(() => {
    async function carregarCampos() {
      setLoading(true);
      const { data } = await supabase
        .from("campos")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      setTodosCampos(data || []);
      setLoading(false);
    }
    carregarCampos();
  }, []);

  const distritosOpcoes: OptionItem[] = [
    { value: "", label: isEn ? "All Districts" : "Todos os Distritos" },
    ...[
      "Aveiro",
      "Beja",
      "Braga",
      "Bragança",
      "Castelo Branco",
      "Coimbra",
      "Évora",
      "Faro",
      "Guarda",
      "Leiria",
      "Lisboa",
      "Portalegre",
      "Porto",
      "Santarém",
      "Setúbal",
      "Viana do Castelo",
      "Vila Real",
      "Viseu",
    ].map((d) => ({ value: d, label: d })),
  ];

  const categoriasOpcoes: OptionItem[] = [
    { value: "", label: isEn ? "All Categories" : "Todas as Categorias" },
    { value: "Desporto", label: isEn ? "Sports & Football" : "Desporto & Futebol" },
    { value: "Surf", label: "Surf & Náutica" },
    { value: "Aventura & Natureza", label: isEn ? "Adventure & Nature" : "Aventura & Natureza" },
    { value: "Tecnologia & Ciência", label: isEn ? "Tech & Science" : "Tecnologia & Ciência" },
    { value: "Artes & Criatividade", label: isEn ? "Arts & Creativity" : "Artes & Criatividade" },
    { value: "Línguas", label: isEn ? "Languages" : "Línguas" },
  ];

  const idadesOpcoes: OptionItem[] = [
    { value: "", label: isEn ? "All Ages" : "Todas as Idades" },
    { value: "3-6", label: isEn ? "3 to 6 years" : "3 a 6 anos" },
    { value: "7-12", label: isEn ? "7 to 12 years" : "7 a 12 anos" },
    { value: "13-18", label: isEn ? "13 to 18 years" : "13 a 18 anos" },
  ];

  const ordemOpcoes: OptionItem[] = [
    { value: "relevancia", label: isEn ? "Featured" : "Relevância" },
    { value: "preco_asc", label: isEn ? "Price: Low to High" : "Preço: Mais Baixo" },
    { value: "preco_desc", label: isEn ? "Price: High to Low" : "Preço: Mais Alto" },
  ];

  const obterPrecoMinimo = (campo: any) => {
    let p = Number(campo.preco) || 0;
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
    if (!p && pacotesArray.length > 0) {
      const precos = pacotesArray
        .flatMap((pac: any) =>
          Array.isArray(pac.variantes)
            ? pac.variantes.map((v: any) => Number(v.preco) || 0)
            : []
        )
        .filter((val: number) => val > 0);
      if (precos.length > 0) p = Math.min(...precos);
    }
    return p;
  };

  const resultados = todosCampos
    .filter((c: any) => {
      if (q) {
        const qNorm = normalize(q);
        const texto = normalize(
          `${c.nome || ""} ${c.nome_en || ""} ${c.categoria || ""} ${
            c.Distrito || ""
          } ${c.local || ""} ${c.descricao || ""}`
        );
        if (!texto.includes(qNorm)) return false;
      }

      if (distrito) {
        const locCampo = normalize(`${c.Distrito || ""} ${c.local || ""}`);
        if (!locCampo.includes(normalize(distrito))) return false;
      }

      if (categoria) {
        const catNorm = normalize(categoria);
        const catCampo = normalize(
          `${c.categoria || ""} ${c.categoria_en || ""}`
        );
        if (
          !catCampo.includes(catNorm) &&
          !(catNorm.includes("desporto") && catCampo.includes("futebol")) &&
          !(catNorm.includes("linguas") && catCampo.includes("ingles"))
        ) {
          return false;
        }
      }

      if (idade) {
        const matchRange = idade.match(/(\d+)\D+(\d+)/);
        const matchCampo = (c.idade || "").match(/(\d+)\D+(\d+)/);
        if (matchRange && matchCampo) {
          const minFiltro = parseInt(matchRange[1], 10);
          const maxFiltro = parseInt(matchRange[2], 10);
          const minCampo = parseInt(matchCampo[1], 10);
          const maxCampo = parseInt(matchCampo[2], 10);
          if (maxCampo < minFiltro || minCampo > maxFiltro) return false;
        }
      }

      if (dataInicio) {
        const dataText = JSON.stringify(c.pacotes || "") + (c.datas || "");
        if (dataText.length > 5 && !dataText.includes(dataInicio.slice(0, 7))) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (ordem === "preco_asc") return obterPrecoMinimo(a) - obterPrecoMinimo(b);
      if (ordem === "preco_desc") return obterPrecoMinimo(b) - obterPrecoMinimo(a);
      return 0;
    });

  const limparFiltros = () => {
    setQ("");
    setDistrito("");
    setCategoria("");
    setIdade("");
    setDataInicio("");
    setOrdem("relevancia");
    router.push(`/${lang}/pesquisa`);
  };

  const temFiltros = q || distrito || categoria || idade || dataInicio;

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      {/* HEADER DA PESQUISA */}
      <section className="bg-[#2563EB] text-white pt-14 pb-20 px-4 md:px-8 border-b-8 border-[#F59E0B] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#F59E0B] rounded-full opacity-90 pointer-events-none hidden lg:block" />
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <span className="inline-block bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-md mb-3">
              {isEn ? "Directory & Booking" : "Diretório Oficial HelloCamp"}
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white m-0">
              {isEn ? "Explore Holiday Camps" : "Explorar Campos de Férias"}
            </h1>
            <p className="text-blue-100 text-sm md:text-base font-medium mt-2 mb-0">
              {isEn
                ? "Compare verified programs, dates, and prices in one place."
                : "Compare programas verificados, datas e preços num só lugar."}
            </p>
          </div>

          <Link
            href={`/${lang}/mapa`}
            className="bg-[#F59E0B] hover:bg-amber-600 text-white px-6 py-4 rounded-md text-xs font-black uppercase tracking-widest no-underline transition-all shadow-lg flex items-center justify-center gap-2 w-fit"
          >
            <span>🗺️</span>{" "}
            {isEn ? "Open Interactive Map" : "Ver no Mapa Interativo"}
          </Link>
        </div>
      </section>

      {/* BARRA DE FILTROS COM DROPDOWNS 100% CUSTOMIZADOS */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8 -mt-10 relative z-30 mb-10">
        <div className="bg-white p-6 rounded-md shadow-xl border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {isEn ? "Keyword" : "Pesquisa Livre"}
              </label>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  isEn
                    ? "Surf, Football, Robotics, Lisbon..."
                    : "Surf, Futebol, Robótica, Lisboa..."
                }
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-md px-4 py-3 text-sm font-bold text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white shadow-sm"
              />
            </div>

            <div className="md:col-span-3">
              <CustomDropdown
                label={isEn ? "District" : "Distrito"}
                value={distrito}
                options={distritosOpcoes}
                onChange={setDistrito}
                placeholder={isEn ? "All Districts" : "Todos os Distritos"}
              />
            </div>

            <div className="md:col-span-3">
              <CustomDropdown
                label={isEn ? "Category" : "Categoria"}
                value={categoria}
                options={categoriasOpcoes}
                onChange={setCategoria}
                placeholder={isEn ? "All Categories" : "Todas as Categorias"}
              />
            </div>

            <div className="md:col-span-2">
              <CustomDropdown
                label={isEn ? "Age Group" : "Faixa Etária"}
                value={idade}
                options={idadesOpcoes}
                onChange={setIdade}
                placeholder={isEn ? "All Ages" : "Todas as Idades"}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="bg-[#2563EB] text-white text-xs font-black px-3.5 py-1.5 rounded-md">
                {resultados.length}{" "}
                {isEn ? "programs found" : "programas encontrados"}
              </span>
              {temFiltros && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="bg-[#F43F5E] hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-md border-0 cursor-pointer"
                >
                  ✕ {isEn ? "Clear Filters" : "Limpar Filtros"}
                </button>
              )}
            </div>

            <div className="w-60">
              <CustomDropdown
                label={isEn ? "Sort by" : "Ordenar por"}
                value={ordem}
                options={ordemOpcoes}
                onChange={setOrdem}
                placeholder={isEn ? "Featured" : "Relevância"}
              />
            </div>
          </div>
        </div>
      </section>

      {/* GRELHA DE RESULTADOS */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white rounded-md border border-slate-200 h-96 animate-pulse"
              />
            ))}
          </div>
        ) : resultados.length === 0 ? (
          <div className="bg-white rounded-md border border-slate-200 p-12 text-center shadow-sm max-w-xl mx-auto">
            <span className="text-5xl block mb-4">🏕️</span>
            <h2 className="text-2xl font-black text-[#0F172A] mb-2">
              {isEn
                ? "No camps match your exact filters"
                : "Nenhum campo encontrado com estes filtros"}
            </h2>
            <p className="text-slate-500 text-sm font-medium mb-6">
              {isEn
                ? "Try clearing some filters or exploring all active programs."
                : "Experimente limpar os filtros selecionados para ver todos os programas ativos."}
            </p>
            <button
              type="button"
              onClick={limparFiltros}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-md border-0 cursor-pointer shadow-sm"
            >
              {isEn ? "Show All Camps" : "Ver Todos os Campos"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resultados.map((campo: any) => {
              const nome = isEn && campo.nome_en ? campo.nome_en : campo.nome;
              const cat =
                isEn && campo.categoria_en
                  ? campo.categoria_en
                  : campo.categoria;
              const local =
                isEn && campo.local_en
                  ? campo.local_en
                  : campo.Distrito || campo.local || "Portugal";
              const preco = obterPrecoMinimo(campo);
              const imgUrl = campo.imagem?.startsWith("http")
                ? campo.imagem
                : "/og-image.jpg";

              return (
                <div
                  key={campo.id}
                  className="group flex flex-col bg-white border border-slate-200 rounded-md shadow-sm hover:shadow-xl hover:border-[#2563EB] transition-all duration-300 hover:-translate-y-1 overflow-hidden relative"
                >
                  <Link
                    href={`/${lang}/campo/${campo.id}`}
                    className="absolute inset-0 z-10"
                  >
                    <span className="sr-only">Ver {nome}</span>
                  </Link>

                  <div className="absolute top-4 right-4 z-20">
                    <BotaoFavorito campoId={campo.id} />
                  </div>

                  <div className="relative h-60 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={nome}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-[#2563EB] text-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md shadow-sm">
                      {cat}
                    </div>
                  </div>

                  <div className="flex flex-col p-6 flex-1 pointer-events-none">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      <span>📍 {local}</span>
                      {campo.idade && <span>• 👶 {campo.idade}</span>}
                    </div>

                    <h3 className="text-xl font-black text-[#0F172A] leading-tight mb-4 line-clamp-2">
                      {nome}
                    </h3>

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                          {isEn ? "From" : "Desde"}
                        </span>
                        <span className="text-2xl font-black text-[#2563EB]">
                          {preco > 0 ? `${preco}€` : "Sob Consulta"}
                        </span>
                      </div>
                      <span className="bg-[#0F172A] group-hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-md text-xs font-black uppercase tracking-widest transition-colors shadow-sm">
                        {isEn ? "View Dates" : "Ver Detalhes"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default function PesquisaPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-xs font-black uppercase tracking-widest text-slate-400">
          A carregar campos...
        </div>
      }
    >
      <PesquisaConteudo lang={lang} />
    </Suspense>
  );
}
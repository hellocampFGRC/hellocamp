import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Metadata } from "next";
import BotaoFavorito from "../../(public)/components/BotaoFavorito";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  const { lang, id } = await params;
  const isEn = lang === "en";

  const { data: parceiro } = await supabase
    .from("perfis")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!parceiro) {
    return { title: "Organizador | HelloCamp" };
  }

  const nome =
    parceiro.empresa_nome ||
    parceiro.nome_empresa ||
    parceiro.nome_completo ||
    "Parceiro HelloCamp";
  const bioRaw = isEn
    ? parceiro.descricao_en ||
      parceiro.biografia_empresa_en ||
      parceiro.descricao ||
      parceiro.biografia_empresa
    : parceiro.descricao || parceiro.biografia_empresa;
  const descCurta = bioRaw
    ? bioRaw.substring(0, 155) + "..."
    : isEn
    ? `Explore all verified holiday camps and youth activities organized by ${nome} on HelloCamp.`
    : `Descubra todos os campos de férias e atividades juvenis organizados por ${nome} na HelloCamp.`;

  return {
    title: `${nome} | ${isEn ? "Official Organizer" : "Organizador Oficial"} | HelloCamp`,
    description: descCurta,
    openGraph: {
      title: `${nome} | HelloCamp`,
      description: descCurta,
      images: parceiro.logotipo_url ? [parceiro.logotipo_url] : [],
    },
  };
}

export default async function PaginaParceiroPublica({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const isEn = lang === "en";

  const [{ data: parceiro }, { data: camposData }] = await Promise.all([
    supabase.from("perfis").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("campos")
      .select("*")
      .eq("organizador_id", id)
      .eq("ativo", true)
      .order("created_at", { ascending: false }),
  ]);

  if (!parceiro) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
        <div className="w-20 h-20 bg-white rounded-md flex items-center justify-center shadow-sm border border-slate-200 mb-6 text-4xl">
          🏢
        </div>
        <h1 className="text-3xl font-black text-slate-900 m-0 mb-2">
          {isEn ? "Partner not found" : "Organizador não encontrado"}
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          {isEn
            ? "The profile you are looking for may have been moved."
            : "O perfil que procura pode ter sido movido ou atualizado."}
        </p>
        <Link
          href={`/${lang}/pesquisa`}
          className="bg-[#0E3A68] text-white px-6 py-3.5 rounded-md font-black uppercase tracking-widest text-xs hover:bg-[#0b2b4d] transition-colors no-underline shadow-sm"
        >
          {isEn ? "Explore All Camps" : "Explorar Todos os Campos"}
        </Link>
      </div>
    );
  }

  const campos = camposData || [];
  const nomeEmpresa =
    parceiro.empresa_nome ||
    parceiro.nome_empresa ||
    parceiro.nome_completo ||
    "Organizador HelloCamp";

  const biografia = isEn
    ? parceiro.descricao_en ||
      parceiro.biografia_empresa_en ||
      parceiro.descricao ||
      parceiro.biografia_empresa ||
      parceiro.contrato_dados?.biografia_empresa
    : parceiro.descricao ||
      parceiro.biografia_empresa ||
      parceiro.contrato_dados?.biografia_empresa;

  const websiteOficial =
    parceiro.website || parceiro.contrato_dados?.website || null;
  const emailPublico =
    parceiro.email_publico ||
    parceiro.contrato_dados?.emailContacto ||
    parceiro.email ||
    null;
  const telefonePublico =
    parceiro.telefone_publico ||
    parceiro.telefone ||
    parceiro.contrato_dados?.telefone ||
    null;
  const anoFundacao =
    parceiro.ano_fundacao || parceiro.contrato_dados?.ano_fundacao || null;

  const cidadesAtuacao = Array.from(
    new Set(
      campos
        .map((c: any) => c.Distrito || c.local)
        .filter(Boolean)
    )
  );

  // Calcular média global de estrelas do parceiro
  const camposComReview = campos.filter((c: any) => Number(c.rating_score) > 0);
  const mediaGlobalParceiro =
    camposComReview.length > 0
      ? camposComReview.reduce(
          (acc: number, curr: any) => acc + Number(curr.rating_score),
          0
        ) / camposComReview.length
      : 0;

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: nomeEmpresa,
    description:
      biografia ||
      "Entidade organizadora de campos de férias e atividades juvenis na HelloCamp.",
    url: `https://www.hellocamp.pt/${lang}/parceiro/${id}`,
    logo: parceiro.logotipo_url || "",
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      {/* 1. BANNER CORPORATIVO DO PARCEIRO (DESIGN EXECUTIVO RETO rounded-md) */}
      <section className="bg-[#0E3A68] text-white pt-10 pb-14 px-4 md:px-6 border-b border-slate-800">
        <div className="max-w-[1150px] mx-auto">
          <nav className="flex items-center gap-2 text-[10px] font-black text-blue-200 mb-8 tracking-widest uppercase">
            <Link
              href={`/${lang}`}
              className="hover:text-white transition-colors no-underline text-blue-200"
            >
              {isEn ? "Home" : "Início"}
            </Link>
            <span>/</span>
            <Link
              href={`/${lang}/pesquisa`}
              className="hover:text-white transition-colors no-underline text-blue-200"
            >
              {isEn ? "Organizers" : "Organizadores"}
            </Link>
            <span>/</span>
            <span className="text-white">{nomeEmpresa}</span>
          </nav>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
            {/* CAIXA DO LOGÓTIPO OFICIAL */}
            <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-md p-3 shadow-xl border-2 border-white/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {parceiro.logotipo_url ? (
                <img
                  src={parceiro.logotipo_url}
                  alt={nomeEmpresa}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-5xl font-black text-[#0E3A68]">
                  {nomeEmpresa.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* INFORMAÇÃO DE TOPO */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-[#e2a41d] text-slate-950 px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest">
                  {isEn ? "Official Organizer" : "Organizador Oficial"}
                </span>

                {(parceiro.parceiro_verificado ||
                  parceiro.status_contrato === "Aprovado") && (
                  <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest">
                    ✓ {isEn ? "Verified Entity" : "Entidade Verificada"}
                  </span>
                )}

                {anoFundacao && (
                  <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest">
                    🏛️ {isEn ? `Est. ${anoFundacao}` : `Desde ${anoFundacao}`}
                  </span>
                )}

                {mediaGlobalParceiro > 0 && (
                  <span className="bg-amber-400/20 border border-amber-300/40 text-amber-200 px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest">
                    ★ {mediaGlobalParceiro.toFixed(1)}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-white m-0 tracking-tight leading-tight">
                {nomeEmpresa}
              </h1>

              {cidadesAtuacao.length > 0 && (
                <p className="text-xs font-bold text-blue-100 mt-2 mb-0">
                  📍 {isEn ? "Active in:" : "Regiões de Atuação:"}{" "}
                  {cidadesAtuacao.join(" • ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORPO DIVIDIDO: SIDEBAR SOBRE A ENTIDADE + GRELHA DE PROGRAMAS */}
      <section className="max-w-[1150px] mx-auto px-4 md:px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUNA ESQUERDA: SOBRE A ENTIDADE & CONTACTOS (4 Colunas) */}
        <aside className="lg:col-span-4 bg-white rounded-md border border-slate-200 p-6 shadow-sm space-y-6 lg:sticky lg:top-24">
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest m-0 mb-3 pb-2 border-b border-slate-100">
              {isEn ? "About the Organization" : "Sobre a Organização"}
            </h2>
            {biografia ? (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium m-0">
                {biografia}
              </p>
            ) : (
              <p className="text-sm text-slate-500 leading-relaxed m-0">
                {isEn
                  ? `${nomeEmpresa} is an official youth activity and holiday camp organizer on the HelloCamp network.`
                  : `A ${nomeEmpresa} é uma entidade organizadora de campos de férias e atividades juvenis parceira da rede HelloCamp.`}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest m-0">
              {isEn ? "Information & Contacts" : "Informações e Contactos"}
            </h3>

            <div className="flex items-center gap-2.5 text-slate-700 font-bold">
              <span>🏕️</span>
              <span>
                {campos.length}{" "}
                {isEn ? "Active Program(s)" : "Programa(s) Ativo(s)"}
              </span>
            </div>

            {websiteOficial && (
              <div className="flex items-center gap-2.5">
                <span>🌐</span>
                <a
                  href={
                    websiteOficial.startsWith("http")
                      ? websiteOficial
                      : `https://${websiteOficial}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0E3A68] font-black hover:underline truncate"
                >
                  {isEn ? "Official Website ↗" : "Visitar Website Oficial ↗"}
                </a>
              </div>
            )}

            {emailPublico && (
              <div className="flex items-center gap-2.5">
                <span>✉️</span>
                <a
                  href={`mailto:${emailPublico}`}
                  className="text-slate-700 font-bold hover:text-[#0E3A68] truncate"
                >
                  {emailPublico}
                </a>
              </div>
            )}

            {telefonePublico && (
              <div className="flex items-center gap-2.5">
                <span>📞</span>
                <a
                  href={`tel:${telefonePublico}`}
                  className="text-slate-700 font-bold hover:text-[#0E3A68]"
                >
                  {telefonePublico}
                </a>
              </div>
            )}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md">
            <span className="block text-[10px] font-black uppercase tracking-widest text-[#167524] mb-1">
              🛡️ {isEn ? "HelloCamp Guarantee" : "Garantia HelloCamp"}
            </span>
            <p className="text-xs text-slate-600 m-0 leading-relaxed font-medium">
              {isEn
                ? "Verified organizer identity and direct communication through our platform."
                : "Identidade de organizador validada e reservas protegidas através da nossa plataforma."}
            </p>
          </div>
        </aside>

        {/* COLUNA DIREITA: PROGRAMAS DO PARCEIRO (8 Colunas) */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
            <h2 className="text-xl font-black text-slate-900 m-0">
              {isEn
                ? `Programs by ${nomeEmpresa}`
                : `Programas e Campos de ${nomeEmpresa}`}
            </h2>
            <span className="text-xs font-black text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-sm">
              {campos.length} {isEn ? "Available" : "Disponíveis"}
            </span>
          </div>

          {campos.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-md p-12 text-center shadow-sm">
              <span className="text-4xl block mb-3">🏕️</span>
              <h3 className="text-base font-black text-slate-900 m-0 mb-1">
                {isEn
                  ? "No active programs at the moment"
                  : "Sem programas ativos de momento"}
              </h3>
              <p className="text-xs text-slate-500 m-0">
                {isEn
                  ? "New dates and seasons will be published soon."
                  : "As próximas datas e temporadas serão publicadas em breve."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {campos.map((campo: any) => {
                const nomeCampo =
                  isEn && campo.nome_en ? campo.nome_en : campo.nome;
                const catCampo =
                  isEn && campo.categoria_en
                    ? campo.categoria_en
                    : campo.categoria;
                const localCampo =
                  isEn && campo.local_en
                    ? campo.local_en
                    : campo.Distrito || campo.local;

                let precoVisivel = Number(campo.preco) || 0;
                if (!precoVisivel && Array.isArray(campo.pacotes) && campo.pacotes.length > 0) {
                  const precos = campo.pacotes.flatMap((p: any) =>
                    Array.isArray(p.variantes)
                      ? p.variantes
                          .map((v: any) => Number(v.preco) || 0)
                          .filter((v: number) => v > 0)
                      : []
                  );
                  if (precos.length > 0) precoVisivel = Math.min(...precos);
                }

                const imgUrl = campo.imagem?.startsWith("http")
                  ? campo.imagem
                  : "/og-image.jpg";

                return (
                  <div
                    key={campo.id}
                    className="group flex flex-col bg-white rounded-md overflow-hidden border border-slate-200 relative shadow-sm hover:border-[#0E3A68] transition-all"
                  >
                    <Link
                      href={`/${lang}/campo/${campo.id}`}
                      className="absolute inset-0 z-10"
                    >
                      <span className="sr-only">Ver {nomeCampo}</span>
                    </Link>
                    <div className="absolute top-3 right-3 z-20">
                      <BotaoFavorito campoId={campo.id} />
                    </div>

                    <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                      <img
                        src={imgUrl}
                        alt={nomeCampo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-slate-950/90 text-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm">
                        {catCampo}
                      </div>
                    </div>

                    <div className="flex flex-col p-5 flex-1 pointer-events-none">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        📍 {localCampo}{" "}
                        {campo.idade ? `• 👶 ${campo.idade}` : ""}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 leading-snug mb-4 line-clamp-2">
                        {nomeCampo}
                      </h3>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 m-0">
                            {isEn ? "From" : "Desde"}
                          </p>
                          <p className="text-2xl font-black text-[#0E3A68] m-0">
                            {precoVisivel > 0 ? `${precoVisivel}€` : "--"}
                          </p>
                        </div>
                        <span className="bg-slate-900 group-hover:bg-[#0E3A68] text-white px-4 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors">
                          {isEn ? "View Dates" : "Ver Datas"} &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
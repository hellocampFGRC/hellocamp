import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Metadata } from "next";
import BotaoFavorito from "../../(public)/components/BotaoFavorito";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const nome =
    parceiro?.empresa_nome ||
    parceiro?.nome_empresa ||
    parceiro?.nome ||
    parceiro?.nome_completo ||
    "Parceiro HelloCamp";
  const desc =
    (isEn &&
      (parceiro?.descricao_en ||
        parceiro?.biografia_empresa_en ||
        parceiro?.biografia_en)) ||
    parceiro?.descricao ||
    parceiro?.biografia_empresa ||
    parceiro?.biografia ||
    (isEn
      ? "Official HelloCamp Organizer"
      : "Organizador Oficial HelloCamp");

  return {
    title: `${nome} | HelloCamp`,
    description: desc,
    openGraph: {
      title: `${nome} | HelloCamp`,
      description: desc,
      images: parceiro?.logotipo_url ? [parceiro.logotipo_url] : [],
    },
  };
}

export default async function PaginaParceiroPublica({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; id: string }>;
  searchParams?: Promise<{ preview?: string }>;
}) {
  const { lang, id } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const isPreviewAdmin = resolvedSearch?.preview === "admin";
  const isEn = lang === "en";

  // 1. Buscar dados do Parceiro
  const { data: parceiro } = await supabase
    .from("perfis")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!parceiro) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-white rounded-md flex items-center justify-center shadow-sm border border-slate-200 mb-6 text-3xl">
          🏢
        </div>
        <h1 className="text-2xl font-black text-[#0F172A] mb-2">
          {isEn ? "Partner not found" : "Organizador não encontrado"}
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          {isEn
            ? "This profile might have been removed or is unavailable."
            : "Este perfil pode ter sido removido ou encontra-se indisponível."}
        </p>
        <Link
          href={`/${lang}/pesquisa`}
          className="bg-[#2563EB] hover:bg-blue-700 text-white px-6 py-3 rounded-md font-black text-xs uppercase tracking-widest no-underline shadow-sm"
        >
          {isEn ? "Back to Search" : "Voltar à Pesquisa"}
        </Link>
      </main>
    );
  }

  // 2. Buscar TODOS os campos deste parceiro (Ativos + Pendentes para garantir que aparecem sempre!)
  const { data: todosCamposData } = await supabase
    .from("campos")
    .select("*")
    .eq("organizador_id", id)
    .order("created_at", { ascending: true });

  const todosCampos: any[] = todosCamposData || [];
  const camposAtivos: any[] = todosCampos.filter(
    (c: any) => c.ativo === true
  );

  // Se estiver em modo preview=admin OU se o parceiro ainda tiver os campos em fase de ativação, mostra TODOS os campos criados!
  const camposParaMostrar: any[] =
    isPreviewAdmin || camposAtivos.length === 0 ? todosCampos : camposAtivos;

  const nomeSeguro =
    parceiro.empresa_nome ||
    parceiro.nome_empresa ||
    parceiro.nome ||
    parceiro.nome_completo ||
    "Parceiro HelloCamp";

  const descricao =
    (isEn
      ? parceiro.descricao_en ||
        parceiro.biografia_empresa_en ||
        parceiro.biografia_en
      : null) ||
    parceiro.descricao ||
    parceiro.biografia_empresa ||
    parceiro.biografia ||
    (isEn
      ? `${nomeSeguro} is a partner organization on HelloCamp offering specialized holiday camps and educational youth programs.`
      : `A ${nomeSeguro} é uma entidade organizadora parceira na plataforma HelloCamp, dedicada à realização de campos de férias, cursos e atividades educativas e desportivas.`);

  const regioesList: string[] = Array.isArray(parceiro.regioes)
    ? parceiro.regioes
    : Array.from(
        new Set(
          todosCampos
            .map((c: any) =>
              isEn && c.Distrito_en
                ? String(c.Distrito_en)
                : String(c.Distrito || c.pais || "")
            )
            .filter(Boolean)
        )
      );

  const camposComRating: any[] = todosCampos.filter(
    (c: any) => Number(c.rating_score) > 0
  );
  const mediaRating =
    camposComRating.length > 0
      ? (
          camposComRating.reduce(
            (acc: number, c: any) => acc + Number(c.rating_score),
            0
          ) / camposComRating.length
        ).toFixed(1)
      : null;

  const isVerificado =
    parceiro.parceiro_verificado === true ||
    parceiro.status_contrato === "Aprovado";

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      {/* BARRA DE AVISO DE PRÉ-VISUALIZAÇÃO ADMIN / ONBOARDING */}
      {(isPreviewAdmin || !isVerificado) && (
        <div className="bg-[#0F172A] border-b-2 border-[#F59E0B] text-white py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                {isEn
                  ? "Admin / Partner Preview"
                  : "Modo Visão de Parceiro / Admin"}
              </span>
              <span className="font-bold text-slate-200">
                {isEn
                  ? `Showing all ${camposParaMostrar.length} configured programs for ${nomeSeguro}.`
                  : `A exibir todos os ${camposParaMostrar.length} programas configurados para ${nomeSeguro}.`}
              </span>
            </div>
            {!isVerificado && (
              <Link
                href={`/${lang}/assinatura-contrato/${id}`}
                className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-md no-underline shrink-0"
              >
                ✍️{" "}
                {isEn
                  ? "Review & Sign Contract to Publish"
                  : "Rever & Assinar Contrato para Ativar"}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* HERO INSTITUCIONAL DO PARCEIRO */}
      <section className="bg-[#2563EB] text-white py-12 md:py-16 border-b-4 border-[#F59E0B] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="mb-6">
            <Link
              href={`/${lang}/pesquisa`}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white bg-white/15 hover:bg-white/25 px-3.5 py-2 rounded-md no-underline transition-colors"
            >
              &larr; {isEn ? "Explore All Camps" : "Explorar Todos os Campos"}
            </Link>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
            {/* LOGÓTIPO DO PARCEIRO */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-md p-3 flex items-center justify-center shadow-lg border-2 border-white shrink-0 overflow-hidden">
              {parceiro.logotipo_url ? (
                <img
                  src={parceiro.logotipo_url}
                  alt={nomeSeguro}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-4xl font-black text-[#2563EB]">
                  {nomeSeguro.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* TÍTULO, BADGES E METADADOS */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {isVerificado ? (
                  <span className="bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                    ✓ {isEn ? "Verified Partner" : "Organizador Verificado"}
                  </span>
                ) : (
                  <span className="bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                    ⏳ {isEn ? "Profile Configured" : "Perfil Configurado"}
                  </span>
                )}

                {parceiro.ano_fundacao && (
                  <span className="bg-[#0F172A]/40 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                    🏛️{" "}
                    {isEn
                      ? `Since ${Math.trunc(Number(parceiro.ano_fundacao))}`
                      : `Desde ${Math.trunc(Number(parceiro.ano_fundacao))}`}
                  </span>
                )}

                <span className="bg-white/15 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                  🏕️ {camposParaMostrar.length}{" "}
                  {camposParaMostrar.length === 1
                    ? isEn
                      ? "Program"
                      : "Programa"
                    : isEn
                    ? "Programs"
                    : "Programas"}
                </span>

                {mediaRating && (
                  <span className="bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                    ⭐ {mediaRating} / 5.0
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight m-0">
                {nomeSeguro}
              </h1>

              {parceiro.morada_sede && (
                <p className="text-blue-100 text-xs md:text-sm font-bold mt-2 mb-0">
                  📍 {parceiro.morada_sede}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL: SOBRE A ORGANIZAÇÃO + GRELHA DE TODOS OS CAMPOS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-14">
          {/* COLUNA ESQUERDA: BIOGRAFIA / SOBRE */}
          <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm">
            <span className="inline-block bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-3">
              {isEn ? "About the Organizer" : "Sobre a Entidade Organizadora"}
            </span>
            <h2 className="text-xl md:text-2xl font-black text-[#0F172A] mt-0 mb-4">
              {isEn ? `Get to know ${nomeSeguro}` : `Conheça a ${nomeSeguro}`}
            </h2>
            <div className="text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-line font-medium">
              {descricao}
            </div>

            {regioesList.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  {isEn ? "Operating Regions" : "Regiões onde atua"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {regioesList.map((reg: string, i: number) => (
                    <span
                      key={i}
                      className="bg-[#F8FAFC] border border-slate-200 text-[#0F172A] text-xs font-bold px-3 py-1.5 rounded-md"
                    >
                      📍 {reg}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: CONTACTOS E DADOS OFICIAIS */}
          <div className="lg:col-span-4 bg-white p-6 md:p-8 rounded-md border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="inline-block bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-3">
                {isEn ? "Official Information" : "Informação e Contactos"}
              </span>
              <h3 className="text-lg font-black text-[#0F172A] mt-0 mb-4">
                {isEn ? "Direct Details" : "Dados da Organização"}
              </h3>

              <div className="space-y-3.5 text-xs">
                {(parceiro.email_publico || parceiro.email) && (
                  <div className="p-3 bg-[#F8FAFC] rounded-md border border-slate-200">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      E-mail
                    </span>
                    <a
                      href={`mailto:${parceiro.email_publico || parceiro.email}`}
                      className="font-black text-[#2563EB] hover:underline break-all no-underline"
                    >
                      ✉️ {parceiro.email_publico || parceiro.email}
                    </a>
                  </div>
                )}

                {(parceiro.telefone_publico || parceiro.telefone) && (
                  <div className="p-3 bg-[#F8FAFC] rounded-md border border-slate-200">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      {isEn ? "Phone" : "Telefone / WhatsApp"}
                    </span>
                    <a
                      href={`tel:${
                        parceiro.telefone_publico || parceiro.telefone
                      }`}
                      className="font-black text-[#0F172A] hover:text-[#2563EB] no-underline"
                    >
                      📞 {parceiro.telefone_publico || parceiro.telefone}
                    </a>
                  </div>
                )}

                {parceiro.website && (
                  <div className="p-3 bg-[#F8FAFC] rounded-md border border-slate-200">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Website Oficial
                    </span>
                    <a
                      href={parceiro.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-black text-[#2563EB] hover:underline break-all no-underline"
                    >
                      🌐 {parceiro.website} ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md">
                <p className="text-[11px] font-bold text-emerald-900 m-0 leading-relaxed">
                  🛡️{" "}
                  {isEn
                    ? "Bookings processed through HelloCamp benefit from direct support and verified terms."
                    : "As inscrições realizadas na HelloCamp contam com apoio direto à família e condições verificadas."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LISTAGEM COMPLETA DE TODOS OS CAMPOS DO PARCEIRO */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="inline-block bg-[#16A34A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md mb-2">
                {isEn ? "Official Catalog" : "Catálogo de Programas"}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-[#0F172A] m-0">
                {isEn
                  ? `All Programs by ${nomeSeguro} (${camposParaMostrar.length})`
                  : `Todos os Campos e Programas de ${nomeSeguro} (${camposParaMostrar.length})`}
              </h2>
            </div>
          </div>

          {camposParaMostrar.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-md p-12 text-center shadow-sm">
              <div className="text-4xl mb-3">🏕️</div>
              <h3 className="text-lg font-black text-[#0F172A] mb-1">
                {isEn
                  ? "No programs registered yet"
                  : "Ainda não existem programas registados para este organizador"}
              </h3>
              <p className="text-xs text-slate-500 font-bold mb-6">
                {isEn
                  ? "New programs are being prepared and will be available soon."
                  : "Os novos turnos e programas estão a ser preparados pela equipa."}
              </p>
              <Link
                href={`/${lang}/pesquisa`}
                className="inline-block bg-[#2563EB] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-md no-underline"
              >
                {isEn ? "Explore Other Camps" : "Explorar Outros Campos"}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {camposParaMostrar.map((campo: any) => {
                const titulo =
                  isEn && campo.nome_en ? campo.nome_en : campo.nome;
                const cat =
                  isEn && campo.categoria_en
                    ? campo.categoria_en
                    : campo.categoria;
                const localizacao =
                  isEn && campo.local_en ? campo.local_en : campo.local;
                const faixaEtaria =
                  (isEn && campo.idade_en ? campo.idade_en : campo.idade) ||
                  `${campo.idade_min || 6} - ${campo.idade_max || 17} ${
                    isEn ? "yrs" : "anos"
                  }`;

                let precoMin = Number(campo.preco) || 0;
                if (
                  (!precoMin || precoMin <= 0) &&
                  Array.isArray(campo.pacotes) &&
                  campo.pacotes.length > 0
                ) {
                  const precosVariantes = campo.pacotes.flatMap((p: any) =>
                    Array.isArray(p.variantes)
                      ? p.variantes.map((v: any) => Number(v.preco) || 0)
                      : []
                  );
                  const validos = precosVariantes.filter((n: number) => n > 0);
                  if (validos.length > 0) precoMin = Math.min(...validos);
                }

                const imgCapa =
                  campo.imagem ||
                  (Array.isArray(campo.galeria) && campo.galeria[0]) ||
                  "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=1000";

                const hrefCampo =
                  campo.ativo === true && !isPreviewAdmin
                    ? `/${lang}/campo/${campo.id}`
                    : `/${lang}/campo/${campo.id}?preview=admin`;

                return (
                  <div
                    key={campo.id}
                    className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative h-52 bg-slate-100 overflow-hidden">
                        <img
                          src={imgCapa}
                          alt={titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="bg-[#2563EB] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                            {cat}
                          </span>
                          {campo.ativo !== true && (
                            <span className="bg-[#F59E0B] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                              👁️ {isEn ? "Preview Mode" : "Em Validação"}
                            </span>
                          )}
                        </div>
                        <div className="absolute top-3 right-3">
                          <BotaoFavorito campoId={campo.id} />
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-2">
                          <span>📍 {localizacao}</span>
                          <span>•</span>
                          <span>👦 {faixaEtaria}</span>
                        </div>

                        <h3 className="text-base font-black text-[#0F172A] m-0 mb-2 line-clamp-2">
                          {titulo}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-3 m-0 leading-relaxed">
                          {isEn && campo.descricao_en
                            ? campo.descricao_en
                            : campo.descricao}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-4 bg-[#F8FAFC] border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">
                          {isEn ? "Starting from" : "Desde"}
                        </span>
                        <span className="text-lg font-black text-[#0F172A]">
                          {precoMin > 0
                            ? `${precoMin}€`
                            : isEn
                            ? "On request"
                            : "Sob consulta"}
                        </span>
                      </div>

                      <Link
                        href={hrefCampo}
                        className="bg-[#16A34A] hover:bg-green-700 text-white font-black text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-md no-underline transition-colors shadow-sm"
                      >
                        {isEn ? "View Program →" : "Ver Programa →"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
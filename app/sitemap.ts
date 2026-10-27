import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.hellocamp.pt";
  const idiomas = ["pt", "en"];
  const agora = new Date();

  // 1. Páginas Estáticas Principais (Apenas rotas que existem!)
  const rotasEstaticas = [
    "",
    "/pesquisa",
    "/mapa",
    "/parceiro",
    "/monitores",
    "/institucional",
    "/guia-pais",
    "/blog",
    "/sobre",
    "/seguranca",
    "/termos",
    "/privacidade",
    "/cookies",
  ];

  const urlsEstaticas: MetadataRoute.Sitemap = [];
  for (const lang of idiomas) {
    for (const rota of rotasEstaticas) {
      urlsEstaticas.push({
        url: `${baseUrl}/${lang}${rota}`,
        lastModified: agora,
        changeFrequency: rota === "" || rota === "/pesquisa" ? "daily" : "weekly",
        priority: rota === "" ? 1.0 : rota === "/pesquisa" || rota === "/parceiro" ? 0.9 : 0.7,
      });
    }
  }

  // 2. Rotas Programáticas SEO ("Isca" Google)
  const rotasProgramaticas = [
    "surf/algarve",
    "futebol/madrid",
    "ingles/reino-unido",
    "desporto/lisboa",
    "tecnologia/porto",
    "aventura/espanha",
  ];

  const urlsProgramaticas: MetadataRoute.Sitemap = [];
  for (const lang of idiomas) {
    for (const slug of rotasProgramaticas) {
      urlsProgramaticas.push({
        url: `${baseUrl}/${lang}/${slug}`,
        lastModified: agora,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }
  }

  // 3. Distritos e Países Principais
  const distritos = ["Lisboa", "Porto", "Faro", "Braga", "Setúbal", "Coimbra", "Aveiro", "Leiria", "Viana do Castelo"];
  const paises = ["Portugal", "Espanha", "Reino Unido", "França"];

  const urlsGeograficas: MetadataRoute.Sitemap = [];
  for (const lang of idiomas) {
    for (const d of distritos) {
      urlsGeograficas.push({
        url: `${baseUrl}/${lang}/distrito/${encodeURIComponent(d)}`,
        lastModified: agora,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const p of paises) {
      urlsGeograficas.push({
        url: `${baseUrl}/${lang}/pesquisa/pais/${encodeURIComponent(p)}`,
        lastModified: agora,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  // 4. Campos Dinâmicos, Perfis de Parceiros e Artigos do Blog
  const [{ data: campos }, { data: posts }] = await Promise.all([
    supabase
      .from("campos")
      .select("id, organizador_id, created_at")
      .eq("ativo", true)
      .not("contrato_parceiro_url", "is", null),
    supabase
      .from("blog_posts")
      .select("slug, created_at")
      .eq("publicado", true),
  ]);

  const urlsCampos: MetadataRoute.Sitemap = [];
  const organizadoresIds = new Set<string>();

  if (campos) {
    for (const campo of campos) {
      if (campo.organizador_id) organizadoresIds.add(campo.organizador_id);
      for (const lang of idiomas) {
        urlsCampos.push({
          url: `${baseUrl}/${lang}/campo/${campo.id}`,
          lastModified: campo.created_at ? new Date(campo.created_at) : agora,
          changeFrequency: "weekly",
          priority: 0.9,
        });
      }
    }
  }

  const urlsParceiros: MetadataRoute.Sitemap = [];
  organizadoresIds.forEach((orgId) => {
    for (const lang of idiomas) {
      urlsParceiros.push({
        url: `${baseUrl}/${lang}/parceiro/${orgId}`,
        lastModified: agora,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  });

  const urlsBlog: MetadataRoute.Sitemap = [];
  if (posts) {
    for (const post of posts) {
      if (!post.slug) continue;
      for (const lang of idiomas) {
        urlsBlog.push({
          url: `${baseUrl}/${lang}/blog/${encodeURIComponent(post.slug)}`,
          lastModified: post.created_at ? new Date(post.created_at) : agora,
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  }

  return [
    ...urlsEstaticas,
    ...urlsProgramaticas,
    ...urlsGeograficas,
    ...urlsCampos,
    ...urlsParceiros,
    ...urlsBlog,
  ];
}
import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export const revalidate = 3600; // Atualiza o sitemap automaticamente a cada 1 hora

const BASE_URL = "https://www.hellocamp.pt";

function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Queries em paralelo com os nomes EXATOS das colunas na BD
  const [
    { data: campos },
    { data: parceiros },
    { data: iniciativas },
    { data: blogPosts },
  ] = await Promise.all([
    supabase
      .from("campos")
      .select('id, created_at, categoria, "Distrito", local, pais')
      .eq("ativo", true),
    supabase
      .from("perfis")
      .select("id, created_at")
      .eq("role", "organizador"),
    supabase
      .from("institucional_iniciativas")
      .select("id, slug, distrito, concelho, created_at")
      .eq("is_active", true),
    supabase
      .from("blog_posts")
      .select("slug, created_at")
      .eq("publicado", true),
  ]);

  const langs = ["pt", "en"] as const;
  const now = new Date();
  const urlMap = new Map<string, MetadataRoute.Sitemap[number]>();

  const addUrl = (entry: MetadataRoute.Sitemap[number]) => {
    if (!urlMap.has(entry.url)) {
      urlMap.set(entry.url, entry);
    }
  };

  // 1. Páginas Estáticas Principais
  const rotasEstaticas = [
    { path: "", freq: "daily" as const, prio: 1.0 },
    { path: "/pesquisa", freq: "daily" as const, prio: 0.9 },
    { path: "/institucional", freq: "daily" as const, prio: 0.9 },
    { path: "/mapa", freq: "weekly" as const, prio: 0.8 },
    { path: "/blog", freq: "weekly" as const, prio: 0.8 },
    { path: "/guia-pais", freq: "monthly" as const, prio: 0.75 },
    { path: "/seguranca", freq: "monthly" as const, prio: 0.75 },
    { path: "/como_reservar", freq: "monthly" as const, prio: 0.75 },
    { path: "/sobre", freq: "monthly" as const, prio: 0.7 },
    { path: "/parceiro", freq: "monthly" as const, prio: 0.8 },
    { path: "/monitores", freq: "weekly" as const, prio: 0.75 },
  ];

  for (const lang of langs) {
    for (const rota of rotasEstaticas) {
      addUrl({
        url: `${BASE_URL}/${lang}${rota.path}`,
        lastModified: now,
        changeFrequency: rota.freq,
        priority: rota.prio,
      });
    }
  }

  // 2. Páginas Dedicadas de Temporadas (/[lang]/verao, /natal, /pascoa, /carnaval)
  const temporadas = ["verao", "natal", "pascoa", "carnaval"];
  for (const lang of langs) {
    for (const temp of temporadas) {
      addUrl({
        url: `${BASE_URL}/${lang}/${temp}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
  }

  // 3. Páginas Individuais de cada Campo Privado Ativo
  if (campos && campos.length > 0) {
    for (const campo of campos) {
      const lastMod = campo.created_at ? new Date(campo.created_at) : now;
      for (const lang of langs) {
        addUrl({
          url: `${BASE_URL}/${lang}/campo/${campo.id}`,
          lastModified: lastMod,
          changeFrequency: "weekly",
          priority: 0.9,
        });
      }
    }
  }

  // 4. Páginas de Montra Pública de Parceiros Organizadores
  if (parceiros && parceiros.length > 0) {
    for (const p of parceiros) {
      const lastMod = p.created_at ? new Date(p.created_at) : now;
      for (const lang of langs) {
        addUrl({
          url: `${BASE_URL}/${lang}/parceiro/${p.id}`,
          lastModified: lastMod,
          changeFrequency: "monthly",
          priority: 0.75,
        });
      }
    }
  }

  // 5. Páginas de Autarquias (Slugs Limpos) + Páginas de Autarquias por Distrito
  const distritosInstSet = new Set<string>();
  const concelhosInstSet = new Set<string>();

  if (iniciativas && iniciativas.length > 0) {
    for (const item of iniciativas) {
      const slugFinal = item.slug || item.id;
      const lastMod = item.created_at ? new Date(item.created_at) : now;

      if (item.distrito) distritosInstSet.add(item.distrito.trim());
      if (item.concelho) concelhosInstSet.add(slugify(item.concelho));

      for (const lang of langs) {
        addUrl({
          url: `${BASE_URL}/${lang}/institucional/${slugFinal}`,
          lastModified: lastMod,
          changeFrequency: "weekly",
          priority: lang === "pt" ? 0.85 : 0.7,
        });
      }
    }
  }

  // Diretórios de Autarquias por Distrito + Páginas de Distrito Privadas
  const distritosUnicos = Array.from(distritosInstSet);
  for (const distrito of distritosUnicos) {
    const distSlug = slugify(distrito);
    if (!distSlug) continue;

    for (const lang of langs) {
      addUrl({
        url: `${BASE_URL}/${lang}/institucional/distrito/${distSlug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
      addUrl({
        url: `${BASE_URL}/${lang}/distrito/${encodeURIComponent(distrito)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  // 6. Artigos do Blog Publicados
  if (blogPosts && blogPosts.length > 0) {
    for (const post of blogPosts) {
      if (!post.slug) continue;
      const lastMod = post.created_at ? new Date(post.created_at) : now;
      for (const lang of langs) {
        addUrl({
          url: `${BASE_URL}/${lang}/blog/${post.slug}`,
          lastModified: lastMod,
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  }

  // 7. Páginas Programáticas de SEO (/[lang]/[categoria]/[localizacao])
  const categoriasSEO = [
    "campos-de-ferias",
    "verao",
    "natal",
    "pascoa",
    "carnaval",
    "aventura",
    "surf",
    "desporto",
    "futebol",
    "linguas",
    "ingles",
    "tecnologia",
    "artes",
    "natureza",
  ];

  const localizacoesSet = new Set<string>([
    "portugal",
    "lisboa",
    "porto",
    "cascais",
    "oeiras",
    "sintra",
    "loures",
    "almada",
    "anadia",
    "algarve",
    "faro",
    "coimbra",
    "braga",
    "setubal",
    "aveiro",
    "leiria",
    "viseu",
    "santarem",
    "evora",
    "espanha",
    "reino-unido",
    "malta",
  ]);

  if (campos && campos.length > 0) {
    campos.forEach((c) => {
      if (c.Distrito) localizacoesSet.add(slugify(c.Distrito));
      if (c.local) {
        const cidadePrincipal = c.local.split(",")[0].split("-")[0].trim();
        if (cidadePrincipal.length > 2) {
          localizacoesSet.add(slugify(cidadePrincipal));
        }
      }
      if (c.pais) localizacoesSet.add(slugify(c.pais));
    });
  }

  // Inclui também todos os concelhos e distritos das Autarquias ativas
  distritosUnicos.forEach((d) => {
    const s = slugify(d);
    if (s) localizacoesSet.add(s);
  });
  concelhosInstSet.forEach((c) => {
    if (c && c.length > 2) localizacoesSet.add(c);
  });

  const localizacoesSEO = Array.from(localizacoesSet);

  for (const lang of langs) {
    for (const cat of categoriasSEO) {
      for (const loc of localizacoesSEO) {
        addUrl({
          url: `${BASE_URL}/${lang}/${cat}/${loc}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority:
            cat === "campos-de-ferias" || cat === "verao" || cat === "aventura"
              ? 0.85
              : 0.75,
        });
      }
    }
  }

  return Array.from(urlMap.values());
}
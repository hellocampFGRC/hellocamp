import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE_URL = "https://www.hellocamp.pt";

function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: campos } = await supabase
    .from("campos")
    .select("id, updated_at, categoria, Distrito, local, Pais")
    .eq("ativo", true);

  const { data: parceiros } = await supabase
    .from("perfis")
    .select("id, created_at")
    .eq("role", "organizador");

  const langs = ["pt", "en"];
  const urls: MetadataRoute.Sitemap = [];

  // 1. Páginas Estáticas Principais
  const rotasEstaticas = [
    "",
    "/pesquisa",
    "/mapa",
    "/guia-pais",
    "/seguranca",
    "/como_reservar",
    "/sobre",
    "/parceiro",
    "/monitores",
    "/institucional",
  ];

  for (const lang of langs) {
    for (const rota of rotasEstaticas) {
      urls.push({
        url: `${BASE_URL}/${lang}${rota}`,
        lastModified: new Date(),
        changeFrequency: rota === "" || rota === "/pesquisa" ? "daily" : "weekly",
        priority: rota === "" ? 1.0 : 0.8,
      });
    }
  }

  // 2. Páginas Individuais de cada Campo Ativo
  if (campos && campos.length > 0) {
    for (const campo of campos) {
      for (const lang of langs) {
        urls.push({
          url: `${BASE_URL}/${lang}/campo/${campo.id}`,
          lastModified: campo.updated_at ? new Date(campo.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.9,
        });
      }
    }
  }

  // 3. Páginas de Perfil de Parceiros / Organizadores
  if (parceiros && parceiros.length > 0) {
    for (const p of parceiros) {
      for (const lang of langs) {
        urls.push({
          url: `${BASE_URL}/${lang}/organizador/${p.id}`,
          lastModified: p.created_at ? new Date(p.created_at) : new Date(),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  }

  // 4. Páginas Programáticas de SEO (Categorias, Épocas e Localidades como Anadia, Cascais, etc.)
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
    "anadia",
    "sintra",
    "algarve",
    "faro",
    "coimbra",
    "braga",
    "setubal",
    "aveiro",
    "espanha",
    "reino-unido",
  ]);

  if (campos && campos.length > 0) {
    campos.forEach((c) => {
      if (c.Distrito) localizacoesSet.add(slugify(c.Distrito));
      if (c.local) {
        // Extrai o concelho/cidade principal (ex: "Anadia, Aveiro" -> "anadia")
        const cidadePrincipal = c.local.split(",")[0].split("-")[0].trim();
        if (cidadePrincipal.length > 2) {
          localizacoesSet.add(slugify(cidadePrincipal));
        }
      }
      if (c.Pais) localizacoesSet.add(slugify(c.Pais));
    });
  }

  const localizacoesSEO = Array.from(localizacoesSet);

  // Gera todas as combinações de alta intenção de pesquisa: /[lang]/[categoria]/[localizacao]
  for (const lang of langs) {
    for (const cat of categoriasSEO) {
      for (const loc of localizacoesSEO) {
        urls.push({
          url: `${BASE_URL}/${lang}/${cat}/${loc}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: cat === "campos-de-ferias" || cat === "verao" || cat === "aventura" ? 0.85 : 0.75,
        });
      }
    }
  }

  return urls;
}
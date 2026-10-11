import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // regenera a cada 1h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.hellocamp.pt';
  const langs = ['pt', 'en'] as const;

  const alt = (path: string) => ({
    languages: {
      pt: `${baseUrl}/pt${path}`,
      en: `${baseUrl}/en${path}`,
      'x-default': `${baseUrl}/pt${path}`,
    },
  });

  const now = new Date();

  // ═══════════════════════════════════════════
  // 1. PÁGINAS ESTÁTICAS
  // ═══════════════════════════════════════════
  const staticPaths = [
    { path: '', priority: 1.0, freq: 'daily' as const },
    { path: '/pesquisa', priority: 0.95, freq: 'daily' as const },
    { path: '/mapa', priority: 0.85, freq: 'weekly' as const },
    { path: '/institucional', priority: 0.85, freq: 'weekly' as const },
    { path: '/blog', priority: 0.8, freq: 'weekly' as const },
    { path: '/guia-pais', priority: 0.8, freq: 'weekly' as const },
    { path: '/ser-parceiro', priority: 0.75, freq: 'monthly' as const },
    { path: '/sobre', priority: 0.7, freq: 'monthly' as const },
    { path: '/como-funciona', priority: 0.7, freq: 'monthly' as const },
    { path: '/seguranca', priority: 0.6, freq: 'monthly' as const },
    { path: '/termos', priority: 0.4, freq: 'yearly' as const },
    { path: '/privacidade', priority: 0.4, freq: 'yearly' as const },
    { path: '/cookies', priority: 0.3, freq: 'yearly' as const },
  ];

  const staticUrls: MetadataRoute.Sitemap = langs.flatMap((lang) =>
    staticPaths.map((p) => ({
      url: `${baseUrl}/${lang}${p.path}`,
      lastModified: now,
      changeFrequency: p.freq,
      priority: p.priority,
      alternates: alt(p.path),
    }))
  );

  // ═══════════════════════════════════════════
  // 2. CAMPOS DE FÉRIAS
  // ═══════════════════════════════════════════
  const { data: campos } = await supabase
    .from('campos')
    .select('id, updated_at')
    .not('contrato_parceiro_url', 'is', null);

  const camposUrls: MetadataRoute.Sitemap = (campos || []).flatMap((c) => {
    const path = `/campo/${c.id}`;
    const lastMod = c.updated_at ? new Date(c.updated_at) : now;
    return langs.map((lang) => ({
      url: `${baseUrl}/${lang}${path}`,
      lastModified: lastMod,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
      alternates: alt(path),
    }));
  });

  // ═══════════════════════════════════════════
  // 3. PAÍSES (Guias de destino)
  // ═══════════════════════════════════════════
  const { data: paises } = await supabase.from('paises').select('nome, updated_at');

  const paisesUrls: MetadataRoute.Sitemap = (paises || []).flatMap((p) => {
    const path = `/pesquisa/pais/${encodeURIComponent(p.nome)}`;
    const lastMod = p.updated_at ? new Date(p.updated_at) : now;
    return langs.map((lang) => ({
      url: `${baseUrl}/${lang}${path}`,
      lastModified: lastMod,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: alt(path),
    }));
  });

  // ═══════════════════════════════════════════
  // 4. DISTRITOS (Guias de destino)
  // ═══════════════════════════════════════════
  const { data: distritos } = await supabase.from('distritos').select('nome, updated_at');

  const distritosUrls: MetadataRoute.Sitemap = (distritos || []).flatMap((d) => {
    const path = `/distrito/${encodeURIComponent(d.nome)}`;
    const lastMod = d.updated_at ? new Date(d.updated_at) : now;
    return langs.map((lang) => ({
      url: `${baseUrl}/${lang}${path}`,
      lastModified: lastMod,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: alt(path),
    }));
  });

  // ═══════════════════════════════════════════
  // 5. BLOG POSTS
  // ═══════════════════════════════════════════
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, created_at')
    .eq('publicado', true);

  const blogUrls: MetadataRoute.Sitemap = (posts || []).flatMap((p) => {
    const path = `/blog/${p.slug}`;
    const lastMod = new Date(p.updated_at || p.created_at || now);
    return langs.map((lang) => ({
      url: `${baseUrl}/${lang}${path}`,
      lastModified: lastMod,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
      alternates: alt(path),
    }));
  });

  // ═══════════════════════════════════════════
  // 6. INSTITUCIONAL — INICIATIVAS
  // ═══════════════════════════════════════════
  const { data: iniciativas } = await supabase
    .from('institucional_iniciativas')
    .select('id, updated_at')
    .eq('is_active', true);

  const iniciativasUrls: MetadataRoute.Sitemap = (iniciativas || []).flatMap((i) => {
    const path = `/institucional/${i.id}`;
    const lastMod = i.updated_at ? new Date(i.updated_at) : now;
    return langs.map((lang) => ({
      url: `${baseUrl}/${lang}${path}`,
      lastModified: lastMod,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
      alternates: alt(path),
    }));
  });

  // ═══════════════════════════════════════════
  // 7. INSTITUCIONAL — DISTRITOS
  // ═══════════════════════════════════════════
  const distritosInstitucional = new Set<string>();
  (iniciativas || []).forEach((i: any) => {
    // como o select anterior não trouxe distrito, assumimos slug só se existir
  });

  // Re-query só com distrito
  const { data: instDistritos } = await supabase
    .from('institucional_iniciativas')
    .select('distrito')
    .eq('is_active', true);

  (instDistritos || []).forEach((i: any) => {
    if (i.distrito && i.distrito.trim()) distritosInstitucional.add(i.distrito.trim());
  });

  const instDistritosUrls: MetadataRoute.Sitemap = Array.from(distritosInstitucional).flatMap((d) => {
    const slug = d.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    const path = `/institucional/distrito/${slug}`;
    return langs.map((lang) => ({
      url: `${baseUrl}/${lang}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: alt(path),
    }));
  });

  // ═══════════════════════════════════════════
  // RESULTADO FINAL
  // ═══════════════════════════════════════════
  return [
    ...staticUrls,
    ...camposUrls,
    ...paisesUrls,
    ...distritosUrls,
    ...blogUrls,
    ...iniciativasUrls,
    ...instDistritosUrls,
  ];
}
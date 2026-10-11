import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.hellocamp.pt';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/checkout/',
          '/_next/',
          '/pt/checkout/',
          '/en/checkout/',
          '/pt/admin/',
          '/en/admin/',
        ],
      },
      {
        // Bloqueia bots de IA agressivos (opcional)
        userAgent: ['GPTBot', 'CCBot', 'ClaudeBot', 'Google-Extended'],
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["pt", "en"];
const defaultLocale = "pt";

// MUDANÇA AQUI: Alterado de "export function middleware" para "export default function proxy"
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verifica se o URL já tem um idioma (ex: /pt/pesquisa ou /en/sobre)
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Se não tiver (ex: /pesquisa), redireciona para o idioma padrão (/pt/pesquisa)
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

// A configuração mantém-se igual
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
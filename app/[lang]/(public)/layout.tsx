import type { Metadata } from "next";
import { getDictionary } from "@/lib/getDictionary";
import Header from "./components/header";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isEn = lang === "en";

  return {
    metadataBase: new URL("https://www.hellocamp.pt"),
    title: {
      template: "%s | HelloCamp",
      default: isEn
        ? "HelloCamp | Find the Best Summer Camps in Portugal & Europe"
        : "HelloCamp | Os Melhores Campos de Férias em Portugal e na Europa",
    },
    description: isEn
      ? "Discover and book the best holiday camps, sports programs, and creative workshops for children and teens in Portugal and Europe."
      : "Descubra e reserve de forma segura os melhores campos de férias, colónias desportivas e workshops criativos para crianças e jovens em Portugal e na Europa.",
    alternates: {
      canonical: `https://www.hellocamp.pt/${lang}`,
      languages: {
        "pt-PT": "https://www.hellocamp.pt/pt",
        "en-US": "https://www.hellocamp.pt/en",
      },
    },
    openGraph: {
      title: "HelloCamp",
      description: isEn
        ? "The easiest way to find and book holiday camps."
        : "A forma mais fácil de procurar e reservar campos de férias.",
      url: `https://www.hellocamp.pt/${lang}`,
      siteName: "HelloCamp",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
        },
      ],
      locale: isEn ? "en_US" : "pt_PT",
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as "pt" | "en");

  return (
    <div className="flex flex-col min-h-screen">
      <Header dict={dict} lang={lang} />

      <main className="flex-grow flex flex-col w-full">{children}</main>

      <Footer dict={dict} lang={lang} />

      <Analytics />
      <SpeedInsights />
    </div>
  );
}
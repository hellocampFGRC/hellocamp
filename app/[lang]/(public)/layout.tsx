import { Metadata } from 'next';
import Header from "./components/header"; // Ajuste o caminho conforme o seu projeto
import Footer from "./components/Footer"; // Ajuste o caminho conforme o seu projeto
import { getDictionary } from "../../../lib/getDictionary";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Lógica dinâmica de SEO (Aplica-se a todas as rotas dentro da pasta public)
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isEn = lang === 'en';

  return {
    title: {
      template: '%s | HelloCamp', 
      default: isEn ? 'HelloCamp | Find the Best Summer Camps' : 'HelloCamp | Os Melhores Campos de Férias',
    },
    description: isEn 
      ? 'Discover and book the best holiday camps, sports programs, and creative workshops for children and teens in Portugal and Europe.'
      : 'Descubra e reserve de forma segura os melhores campos de férias, colónias desportivas e workshops criativos para crianças e jovens em Portugal e na Europa.',
    openGraph: {
      title: 'HelloCamp',
      description: isEn ? 'The easiest way to find and book holiday camps.' : 'A forma mais fácil de procurar e reservar campos de férias.',
      url: 'https://www.hellocamp.pt',
      siteName: 'HelloCamp',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
        }
      ],
      locale: isEn ? 'en_US' : 'pt_PT',
      type: 'website',
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
    // min-h-screen + flex-col garante que o layout cobre o ecrã todo
    <div className="flex flex-col min-h-screen">
      
      <Header dict={dict} lang={lang} />

      {/* flex-grow flex flex-col garante que o conteúdo interior (como o portal) estica devidamente */}
      <main className="flex-grow flex flex-col w-full">
        {children}
      </main>
      
      <Footer dict={dict} lang={lang} />
      
      {/* Ferramentas analíticas da Vercel ativadas */}
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
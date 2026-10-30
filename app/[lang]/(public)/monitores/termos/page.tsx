import Link from "next/link";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const isEn = lang === "en";
  return {
    title: isEn
      ? "Terms of Use: Monitor Portal | HelloCamp"
      : "Termos de Utilização da Bolsa de Monitores | HelloCamp",
  };
}

export default async function TermosMonitoresPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isEn = lang === "en";

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      <header className="bg-[#0F172A] text-white py-14 px-4 text-center border-b-4 border-[#F59E0B]">
        <span className="text-[10px] font-black uppercase tracking-widest text-white bg-[#2563EB] px-3.5 py-1.5 rounded-md mb-4 inline-block">
          {isEn ? "Legal & Privacy" : "Enquadramento Legal e Privacidade RGPD"}
        </span>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3 text-white">
          {isEn
            ? "Terms of Use: Monitor Portal"
            : "Termos de Utilização da Bolsa de Monitores"}
        </h1>
        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest m-0">
          {isEn ? "Updated: 2026" : "Atualizado: 2026"}
        </p>
      </header>

      <article className="max-w-3xl mx-auto px-6 md:px-12 py-10 mt-10 bg-white rounded-md border border-slate-200 shadow-sm text-slate-700 text-sm md:text-base leading-relaxed space-y-6 text-justify">
        <p className="font-bold text-[#0F172A]">
          {isEn
            ? "By registering on the HelloCamp Staff Portal, the Monitor agrees to the following terms governing the relationship between the Monitor, HelloCamp, and the Camp Organizers."
            : "Ao registar-se na Bolsa de Monitores da HelloCamp, o Monitor concorda inequivocamente com os presentes termos, que regem a relação entre o Monitor, a HelloCamp (Plataforma Diretório) e as entidades organizadoras de Campos de Férias."}
        </p>

        <h2 className="text-lg font-black text-[#0F172A] border-b border-slate-200 pb-2">
          1. Inexistência de Vínculo Laboral
        </h2>
        <p>
          A HelloCamp atua exclusiva e estritamente como um diretório digital gratuito de aproximação entre candidatos e organizadores. Não existe qualquer vínculo laboral, contrato de prestação de serviços ou relação de agenciamento entre a HelloCamp e os monitores inscritos. A HelloCamp não define remunerações nem cobra qualquer comissão sobre os valores auferidos pelo monitor.
        </p>

        <h2 className="text-lg font-black text-[#0F172A] border-b border-slate-200 pb-2">
          2. Veracidade dos Dados e Certificações
        </h2>
        <p>
          O Monitor é o único e exclusivo responsável por garantir que toda a informação submetida no seu perfil (idade, experiência, identificação e certificações como IPDJ, Primeiros Socorros ou Nadador Salvador) é verdadeira e válida.
        </p>

        <h2 className="text-lg font-black text-[#0F172A] border-b border-slate-200 pb-2">
          3. Obrigações Legais da Entidade Recrutadora (Registo Criminal — Lei n.º 113/2009)
        </h2>
        <p>
          Cabe única e exclusivamente à entidade organizadora que contrata o monitor conduzir as entrevistas, validar presencialmente os diplomas originais e exigir obrigatoriamente o Certificado de Registo Criminal para exercício de funções que envolvam contacto regular com menores (Lei n.º 113/2009), bem como assegurar os seguros de acidentes de trabalho legalmente exigidos.
        </p>

        <h2 className="text-lg font-black text-[#0F172A] border-b border-slate-200 pb-2">
          4. Privacidade, CV, Fotografia e Consentimento RGPD
        </h2>
        <p>
          Ao criar perfil na HelloCamp, o Monitor autoriza a partilha do seu nome, contactos, fotografia, calendário de disponibilidade e Currículo Vitae (CV) exclusivamente com Parceiros Organizadores registados na plataforma para efeitos de recrutamento. O perfil encontra-se oculto do público geral e pode ser editado ou eliminado a qualquer momento pelo Monitor.
        </p>
      </article>

      <div className="max-w-3xl mx-auto px-4 mt-8 text-center">
        <Link
          href={`/${lang}/monitores/registo`}
          className="inline-block bg-[#16A34A] hover:bg-green-700 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-md shadow-sm no-underline"
        >
          {isEn ? "← Back to Registration" : "← Voltar ao Registo de Monitor"}
        </Link>
      </div>
    </main>
  );
}
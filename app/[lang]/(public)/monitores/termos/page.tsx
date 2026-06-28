"use client";

import React, { use } from "react";
import Link from "next/link";

export default function TermosMonitorPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  return (
    <main className="min-h-screen bg-white font-sans antialiased text-slate-900 pb-24">
      
      {/* CABEÇALHO */}
      <header className="max-w-3xl mx-auto px-4 md:px-8 pt-16 pb-10 text-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full mb-6 inline-block border border-blue-100">
          {isEn ? "Legal & Privacy" : "Legal e Privacidade"}
        </span>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-6">
          {isEn ? "Terms of Use: Staff Portal" : "Termos de Utilização da Bolsa de Monitores"}
        </h1>
        <p className="text-sm font-medium text-slate-500">
          {isEn ? "Last updated: January 2026" : "Última atualização: Junho 2026"}
        </p>
      </header>

      {/* CORPO DOS TERMOS */}
      <article className="
        max-w-3xl mx-auto px-4 md:px-8 
        text-slate-600 font-medium text-base leading-relaxed text-justify
        
        [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:leading-tight [&_h2]:text-left
        [&_p]:mb-6 [&_p]:leading-loose
        [&_strong]:font-black [&_strong]:text-slate-900
        [&_ul]:list-none [&_ul]:pl-0 [&_ul]:mb-8 [&_ul]:space-y-4 [&_ul]:text-left
        [&_li]:relative [&_li]:pl-6 [&_li]:text-justify
        [&_li::before]:content-[''] [&_li::before]:absolute [&_li::before]:left-0 [&_li::before]:top-2.5 [&_li::before]:w-1.5 [&_li::before]:h-1.5 [&_li::before]:bg-blue-500 [&_li::before]:rounded-full
      ">
        
        <p>
          {isEn 
            ? "By registering on the HelloCamp Staff Portal, you agree to the following terms, which govern the relationship between you (the Monitor), HelloCamp (the Intermediary), and the organizing entities (the Camps)." 
            : "Ao registar-se na Bolsa de Monitores da HelloCamp, o utilizador concorda com os presentes termos, que regem a relação entre si (o Monitor), a HelloCamp (a Plataforma Intermediária) e as entidades organizadoras (os Campos de Férias)."}
        </p>

        <h2>{isEn ? "1. The Role of HelloCamp (Intermediary Platform)" : "1. O Papel da HelloCamp (Plataforma Intermediária)"}</h2>
        <p>
          {isEn 
            ? "HelloCamp operates strictly as a technological bridge. We provide a space where camps can find available staff. HelloCamp is NOT an employment agency, recruiter, or employer." 
            : "A HelloCamp atua exclusivamente como uma plataforma tecnológica de facilitação (ponte). Disponibilizamos um diretório online onde os campos de férias podem pesquisar e contactar jovens disponíveis. A HelloCamp NÃO é uma agência de emprego, agência de recrutamento, nem atua como entidade patronal sob nenhuma circunstância."}
        </p>
        <ul>
          <li>{isEn ? "We do not interview, vet, or background check the monitors." : "Não realizamos entrevistas nem validações presenciais dos utilizadores."}</li>
          <li>{isEn ? "We do not define salaries, contracts, or working conditions." : "Não definimos horários, remunerações, contratos ou condições de trabalho."}</li>
          <li>{isEn ? "We do not take a commission or fee from the monitor's salary." : "Não cobramos qualquer comissão ou taxa sobre a remuneração auferida pelo monitor."}</li>
        </ul>

        <h2>{isEn ? "2. Monitor's Responsibilities & Truthfulness" : "2. Responsabilidade e Veracidade do Monitor"}</h2>
        <p>
          {isEn 
            ? "As a user of this portal, you are strictly responsible for ensuring that all information provided (age, experience, certificates) is 100% accurate and truthful." 
            : "O utilizador é inteira e estritamente responsável por garantir que toda a informação fornecida no seu perfil (idade, experiência, habilitações e certificados) é 100% verdadeira e exata."}
        </p>
        <p>
          {isEn 
            ? "Falsifying certificates (such as First Aid or Lifeguard) or misrepresenting your age may lead to immediate account termination and potential legal consequences if accidents occur during a camp." 
            : "A falsificação de certificados (como Socorrismo, IPDJ ou Nadador Salvador) ou a adulteração da data de nascimento resultará no cancelamento imediato da conta e poderá acarretar severas consequências criminais caso ocorram incidentes durante a prestação do serviço."}
        </p>

        <h2>{isEn ? "3. Camp Organizer's Responsibilities (Validation)" : "3. Responsabilidade Exclusiva da Entidade Organizadora"}</h2>
        <p>
          {isEn 
            ? "HelloCamp does not guarantee the quality or legality of the monitors. It is the absolute responsibility of the Camp Organizer to:" 
            : "A HelloCamp não afiança a qualidade, idoneidade ou legalidade dos monitores. É da exclusiva responsabilidade da Entidade Organizadora do Campo de Férias:"}
        </p>
        <ul>
          <li>{isEn ? "Conduct formal job interviews." : "Realizar as respetivas entrevistas de seleção e recrutamento."}</li>
          <li>{isEn ? "Verify original certificates and documents." : "Validar a autenticidade de todos os certificados submetidos na plataforma."}</li>
          <li><strong>{isEn ? "Require a Clean Criminal Record." : "Exigir o Registo Criminal obrigatório."}</strong> {isEn ? "By law, anyone working with minors must provide a clean criminal record before starting." : "Nos termos da Lei Portuguesa, a entidade organizadora tem a obrigação inegável de solicitar e verificar o Registo Criminal (com a menção para o contacto com menores) de todos os monitores antes do início de qualquer atividade."}</li>
        </ul>

        <h2>{isEn ? "4. Limitation of Liability" : "4. Isenção Absoluta de Responsabilidade"}</h2>
        <p>
          {isEn 
            ? "HelloCamp, its founders, and employees shall not be held liable for any disputes, unpaid wages, accidents, unfulfilled contracts, or legal infractions occurring between monitors and camps." 
            : "A HelloCamp, os seus fundadores e colaboradores não se responsabilizam, sob nenhuma circunstância, por litígios, falhas de pagamento, acidentes de trabalho, incumprimento de contratos laborais, ou infrações legais (incluindo falhas na verificação do Registo Criminal) que ocorram entre os monitores e as entidades parceiras."}
        </p>
        <p>
          {isEn 
            ? "Any legal or labor conflict must be resolved directly between the hired monitor and the hiring camp entity." 
            : "Qualquer conflito de natureza laboral, cível ou criminal deverá ser resolvido direta e exclusivamente entre o monitor contratado e a entidade organizadora."}
        </p>

      </article>

      <div className="max-w-3xl mx-auto px-4 md:px-8 mt-16 text-center">
        <Link href={`/${lang}/monitores/registo`} className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-8 py-3 rounded-full transition-colors no-underline">
          {isEn ? "Return to Registration" : "Voltar ao Registo"}
        </Link>
      </div>

    </main>
  );
}
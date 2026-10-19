"use client";

import React, { use } from "react";
import Link from "next/link";

export default function TermosMonitorPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  return (
    <main className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-24">
      
      {/* CABEÇALHO */}
      <header className="max-w-3xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-12 text-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#2563eb] bg-blue-50 px-4 py-2 rounded-full mb-6 inline-block border border-blue-100 shadow-sm">
          {isEn ? "Legal & Privacy" : "Legal e Privacidade"}
        </span>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-6 text-slate-900">
          {isEn ? "Terms of Use: Monitor Portal" : "Termos de Utilização da Bolsa de Monitores"}
        </h1>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          {isEn ? "Last updated: June 2026" : "Última atualização: Junho 2026"}
        </p>
      </header>

      {/* CORPO DOS TERMOS */}
      <article className="
        max-w-3xl mx-auto px-4 md:px-12 py-10 bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50
        text-slate-600 font-medium text-base leading-relaxed text-justify
        
        [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:mt-12 [&_h2]:mb-5 [&_h2]:leading-tight [&_h2]:text-left [&_h2]:border-b [&_h2]:border-slate-100 [&_h2]:pb-3
        [&_p]:mb-6 [&_p]:leading-loose
        [&_strong]:font-black [&_strong]:text-slate-900
        [&_ul]:list-none [&_ul]:pl-0 [&_ul]:mb-8 [&_ul]:space-y-4 [&_ul]:text-left
        [&_li]:relative [&_li]:pl-6 [&_li]:text-justify [&_li]:text-sm [&_li]:md:text-base
        [&_li::before]:content-[''] [&_li::before]:absolute [&_li::before]:left-0 [&_li::before]:top-2.5 [&_li::before]:w-2 [&_li::before]:h-2 [&_li::before]:bg-[#2563eb] [&_li::before]:rounded-full
      ">
        
        <p className="text-lg text-slate-800 font-bold mb-10">
          {isEn 
            ? "By registering on the HelloCamp Staff Portal, the Monitor agrees to the following terms, which govern the relationship between the Monitor, HelloCamp (the Intermediary Platform), and the organizing entities (Camps/Schools)." 
            : "Ao registar-se na Bolsa de Monitores da HelloCamp, o Monitor concorda inequivocamente com os presentes termos, que regem a relação entre o Monitor, a HelloCamp (Plataforma Intermediária) e as entidades organizadoras (Campos de Férias, Escolas e Empresas de Animação)."}
        </p>

        <h2>{isEn ? "1. Inexistence of an Employment Relationship" : "1. Inexistência de Vínculo Laboral"}</h2>
        <p>
          {isEn 
            ? "HelloCamp operates strictly as a digital directory and advertising space. The platform simply allows monitors to publish their profiles so that external organizations can contact them." 
            : "A HelloCamp atua exclusiva e estritamente como um diretório digital e espaço de publicitação. A plataforma serve unicamente para que os monitores se registem e publicitem o seu perfil, disponibilidade e competências, permitindo que entidades organizadoras externas os contactem para eventuais propostas de recrutamento."}
        </p>
        <p>
          <strong className="text-[#2563eb]">
          {isEn 
            ? "There is absolutely NO employment contract, service agreement, or agency relationship between HelloCamp and the monitors." 
            : "Não existe, sob nenhuma perspetiva ou circunstância, qualquer vínculo laboral, contrato de prestação de serviços, parceria formal ou relação de agenciamento entre a plataforma HelloCamp e os monitores inscritos, nem se encontra vinculada por qualquer coletivo de trabalho."}
          </strong>
        </p>
        <ul className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <li>{isEn ? "HelloCamp is NOT an employer, HR agency, or recruiter." : "A HelloCamp NÃO é uma entidade patronal, agência de recursos humanos, nem empresa de recrutamento."}</li>
          <li>{isEn ? "HelloCamp does not dictate salaries, work schedules, or conditions." : "A HelloCamp não define remunerações, não estabelece horários, e não interfere nos contratos de trabalho."}</li>
          <li>{isEn ? "HelloCamp does not charge commissions on the monitor's earnings." : "A HelloCamp não cobra qualquer taxa ou comissão sobre os valores eventualmente auferidos pelo monitor junto das entidades organizadoras."}</li>
        </ul>

        <h2>{isEn ? "2. Truthfulness of Information" : "2. Veracidade dos Dados e Responsabilidade"}</h2>
        <p>
          {isEn 
            ? "The Monitor is strictly and exclusively responsible for ensuring that all data provided (including age, experience, and certificates) is entirely accurate." 
            : "O Monitor é o único e exclusivo responsável por garantir e atestar que toda a informação submetida no seu perfil (idade, experiência, identificação e certificações) é absolutamente verdadeira e legalmente válida."}
        </p>
        <p className="bg-red-50 text-red-900 p-5 rounded-2xl border border-red-200 text-sm font-bold">
          {isEn 
            ? "Any falsification of documents, specifically First Aid, Lifeguard, or IPDJ certificates, will result in immediate account termination and potential legal prosecution." 
            : "A inserção de dados falsos, bem como a falsificação ou adulteração de documentos e certificações (tais como certificados do IPDJ, Socorrismo ou Nadador Salvador), resultará na eliminação imediata da conta do monitor e no direito da HelloCamp em reportar o incidente às autoridades criminais competentes."}
        </p>

        <h2>{isEn ? "3. Validation and Recruitment" : "3. Verificação de Dados e Recrutamento"}</h2>
        <p>
          {isEn 
            ? "HelloCamp does NOT verify, validate, or background check the documents or profiles submitted by monitors. The entire hiring and vetting process is external to HelloCamp." 
            : "A HelloCamp NÃO verifica, NÃO valida, e NÃO garante a autenticidade dos documentos, identidades ou certificados inseridos pelos monitores. O processo de seleção e recrutamento é inteiramente alheio à HelloCamp."}
        </p>
        <p>
          {isEn 
            ? "It is the sole legal responsibility of the Camp Organizer to:" 
            : "Cabe única e exclusivamente à entidade organizadora (quem tenciona contratar o monitor) a obrigação legal inalienável de:"}
        </p>
        <ul className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <li>{isEn ? "Conduct all job interviews and capability assessments." : "Conduzir as respetivas entrevistas e avaliações de competências físicas e psicológicas."}</li>
          <li>{isEn ? "Examine and validate all original certificates and professional licenses." : "Exigir e validar presencialmente todos os certificados, diplomas e licenças profissionais do monitor."}</li>
          <li><strong>{isEn ? "Require the Criminal Record check." : "Exigir o Registo Criminal."}</strong> {isEn ? "In compliance with the law, the hiring entity must verify the monitor's clean criminal record (for contact with minors) before any work begins." : "Em estrito cumprimento da lei portuguesa, é a entidade organizadora que tem a obrigação de solicitar, recolher e analisar o Registo Criminal do monitor (com a menção obrigatória para o contacto com menores) antes do início de qualquer atividade em campo."}</li>
        </ul>

        <h2>{isEn ? "4. Absolute Exemption of Liability" : "4. Isenção Absoluta de Responsabilidade da HelloCamp"}</h2>
        <p>
          {isEn 
            ? "HelloCamp, its founders, and administrators shall not be held liable, under any legal theory, for conflicts arising between monitors and hiring camps." 
            : "A plataforma HelloCamp, a sua empresa detentora, os seus fundadores e administradores isentam-se, de forma absoluta e incondicional, de qualquer responsabilidade civil, criminal ou laboral decorrente das interações e contratos firmados entre os monitores e as entidades organizadoras."}
        </p>
        <p>
          {isEn 
            ? "Any issue regarding unpaid wages, workplace accidents, contract breaches, or legal infractions must be resolved directly between the Monitor and the Camp Organizer." 
            : "A HelloCamp não se responsabiliza por litígios, falhas no pagamento de honorários, acidentes de trabalho, assédio, incumprimento de funções, ou falhas na verificação legal de documentos por parte dos campos. Todo e qualquer conflito deverá ser resolvido direta e exclusivamente entre o Monitor e a Entidade Contratante externa."}
        </p>

        <h2>{isEn ? "5. Personal Data, Photos, CV and GDPR Consent" : "5. Privacidade, Fotografias, CV e Consentimento RGPD"}</h2>
        <p>
          {isEn 
            ? "By creating a profile on HelloCamp, the Monitor expressly and unequivocally consents to the collection, storage, and processing of their personal data (including Full Name, Age, Contact Details, CV, and Photograph)." 
            : "Ao criar um perfil na HelloCamp, o Monitor consente expressa e inequivocamente a recolha, armazenamento e processamento dos seus dados pessoais primários (incluindo Nome, Idade, Contactos Telefónicos, Currículo Vitae e Fotografia de Rosto)."}
        </p>
        <p>
          {isEn 
            ? "The Monitor authorizes HelloCamp to share and display this information, including the uploaded Resume/CV and profile picture, exclusively to validated Partners (Camp Organizers) registered on the platform, solely for recruitment purposes." 
            : "O Monitor autoriza expressamente a HelloCamp a partilhar e exibir de forma proativa esta informação a Parceiros Validados (Organizadores de Campos) registados na plataforma, com o propósito único e exclusivo de promover e agilizar o seu recrutamento."}
        </p>
        <ul className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <li>{isEn ? "The profile is strictly hidden from the general public and parents." : "O perfil do Monitor é estritamente oculto do público em geral, motores de busca externos (Google), clientes ou pais. O acesso à base de dados é restrito a empresas parceiras ativas."}</li>
          <li>{isEn ? "HelloCamp cannot be held responsible for the misuse, download, or distribution of your CV or photo by third-party organizers once they have legally accessed the database." : "A HelloCamp declina qualquer responsabilidade pelo uso indevido, download ou distribuição do seu CV ou Fotografia por parte das entidades organizadoras terceiras, após estas acederem legitimamente à plataforma."}</li>
          <li>{isEn ? "The Monitor retains the right to delete their account, CV, and photo at any time, ceasing future data sharing." : "O Monitor detém o direito inalienável a ser esquecido, podendo eliminar a sua conta, currículo e fotografia da plataforma a qualquer momento através do painel de definições do seu portal, cessando imediatamente a partilha futura de dados."}</li>
        </ul>

      </article>

      <div className="max-w-3xl mx-auto px-4 md:px-8 mt-12 text-center">
        <Link href={`/${lang}/monitores/registo`} className="inline-block bg-slate-900 hover:bg-[#2563eb] text-white font-black uppercase tracking-widest text-xs px-10 py-4 rounded-xl shadow-lg transition-all hover:-translate-y-1 no-underline">
          {isEn ? "Return to Registration" : "Voltar e Concluir Registo"}
        </Link>
      </div>

    </main>
  );
}
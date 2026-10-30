import React, { use } from "react";
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
    description: isEn
      ? "Legal terms, privacy policy, and GDPR rules governing the HelloCamp Staff Pool for Monitors and Camp Organizers."
      : "Termos legais, isenção de responsabilidade e regras de privacidade RGPD aplicáveis à Bolsa Nacional de Monitores da HelloCamp.",
  };
}

export default function TermosMonitoresPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const isEn = lang === "en";

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24 selection:bg-[#F59E0B]/20">
      {/* CABEÇALHO CORPORATIVO HELLO CAMP */}
      <header className="bg-[#0F172A] text-white pt-16 pb-24 px-4 md:px-8 text-center border-b-4 border-[#F59E0B] relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-white bg-[#2563EB] px-3.5 py-1.5 rounded-md shadow-sm">
              ⚖️ {isEn ? "Legal & Privacy" : "Enquadramento Legal & Privacidade RGPD"}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white bg-[#16A34A] px-3.5 py-1.5 rounded-md shadow-sm">
              🎓 {isEn ? "Monitor Talent Pool" : "Bolsa Nacional de Monitores"}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4 text-white m-0">
            {isEn
              ? "Terms of Use: Monitor Portal"
              : "Termos de Utilização da Bolsa de Monitores"}
          </h1>

          <p className="text-xs md:text-sm font-bold text-slate-300 uppercase tracking-widest m-0">
            {isEn
              ? "Official Legal Document • Last updated: 2026"
              : "Documento Jurídico Oficial • Última atualização: 2026"}
          </p>
        </div>
      </header>

      {/* CORPO INTEGRAL DOS TERMOS (SEM OMISSÕES) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 relative z-20">
        <article className="bg-white rounded-md border border-slate-200 shadow-xl p-6 sm:p-10 md:p-14 text-slate-700 font-medium text-sm md:text-base leading-relaxed text-justify space-y-10">
          {/* INTRODUÇÃO VINCULATIVA */}
          <div className="bg-[#F8FAFC] p-6 rounded-md border-l-4 border-[#2563EB]">
            <p className="text-base md:text-lg text-[#0F172A] font-black m-0 leading-relaxed">
              {isEn
                ? "By registering on the HelloCamp Staff Portal, the Monitor agrees to the following terms, which govern the relationship between the Monitor, HelloCamp (the Intermediary Platform), and the organizing entities (Camps, Schools, and Youth Activity Providers)."
                : "Ao registar-se na Bolsa de Monitores da HelloCamp, o Monitor concorda inequivocamente com os presentes termos, que regem a relação entre o Monitor, a HelloCamp (Plataforma Intermediária) e as entidades organizadoras (Campos de Férias, Escolas e Empresas de Animação)."}
            </p>
          </div>

          {/* 1. INEXISTÊNCIA DE VÍNCULO LABORAL */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-3">
              <span className="w-8 h-8 bg-[#2563EB] text-white rounded-md flex items-center justify-center font-black text-xs shrink-0">
                1
              </span>
              <h2 className="text-lg md:text-xl font-black text-[#0F172A] m-0 uppercase tracking-wide">
                {isEn
                  ? "1. Inexistence of an Employment Relationship"
                  : "1. Inexistência de Vínculo Laboral"}
              </h2>
            </div>

            <p className="m-0">
              {isEn
                ? "HelloCamp operates strictly as a digital directory and advertising space. The platform simply allows monitors to publish their profiles, availability, and skills so that external organizations can contact them for potential recruitment."
                : "A HelloCamp atua exclusiva e estritamente como um diretório digital e espaço de publicitação. A plataforma serve unicamente para que os monitores se registem e publicitem o seu perfil, disponibilidade e competências, permitindo que entidades organizadoras externas os contactem para eventuais propostas de recrutamento."}
            </p>

            <div className="bg-blue-50/80 border border-blue-200 p-5 rounded-md">
              <p className="font-black text-[#2563EB] m-0 text-sm md:text-base">
                {isEn
                  ? "There is absolutely NO employment contract, service agreement, formal partnership, or agency relationship between HelloCamp and the registered monitors, nor is HelloCamp bound by any collective labor agreement."
                  : "Não existe, sob nenhuma perspetiva ou circunstância, qualquer vínculo laboral, contrato de prestação de serviços, parceria formal ou relação de agenciamento entre a plataforma HelloCamp e os monitores inscritos, nem se encontra vinculada por qualquer instrumento de regulamentação coletiva de trabalho."}
              </p>
            </div>

            <ul className="bg-[#F8FAFC] p-6 rounded-md border border-slate-200 space-y-3 list-none m-0">
              <li className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 bg-[#2563EB] rounded-sm mt-2 shrink-0" />
                <span>
                  {isEn
                    ? "HelloCamp is NOT an employer, temporary work agency, HR consultancy, or recruitment company."
                    : "A HelloCamp NÃO é uma entidade patronal, empresa de trabalho temporário, agência de recursos humanos, nem empresa de recrutamento."}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 bg-[#2563EB] rounded-sm mt-2 shrink-0" />
                <span>
                  {isEn
                    ? "HelloCamp does not dictate salaries, stipends, work schedules, accommodation rules, or employment conditions."
                    : "A HelloCamp não define remunerações, bolsas, não estabelece horários, e não interfere nos contratos de trabalho ou de prestação de serviços."}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 bg-[#2563EB] rounded-sm mt-2 shrink-0" />
                <span>
                  {isEn
                    ? "HelloCamp does not charge any fee or commission on the monitor's earnings received from the organizing entities."
                    : "A HelloCamp não cobra qualquer taxa ou comissão sobre os valores eventualmente auferidos pelo monitor junto das entidades organizadoras."}
                </span>
              </li>
            </ul>
          </section>

          {/* 2. VERACIDADE DOS DADOS E RESPONSABILIDADE */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-3">
              <span className="w-8 h-8 bg-[#F43F5E] text-white rounded-md flex items-center justify-center font-black text-xs shrink-0">
                2
              </span>
              <h2 className="text-lg md:text-xl font-black text-[#0F172A] m-0 uppercase tracking-wide">
                {isEn
                  ? "2. Truthfulness of Information & Certificates"
                  : "2. Veracidade dos Dados e Responsabilidade"}
              </h2>
            </div>

            <p className="m-0">
              {isEn
                ? "The Monitor is strictly and exclusively responsible for ensuring and attesting that all data submitted in their profile (including age, experience, identification, CV, and certifications) is entirely accurate and legally valid."
                : "O Monitor é o único e exclusivo responsável por garantir e atestar que toda a informação submetida no seu perfil (idade, experiência, identificação, Currículo Vitae e certificações) é absolutamente verdadeira e legalmente válida."}
            </p>

            <div className="bg-rose-50 text-rose-950 p-5 rounded-md border-2 border-[#F43F5E] text-sm font-black">
              ⚠️{" "}
              {isEn
                ? "Any insertion of false data, as well as the falsification or alteration of documents and certifications (such as IPDJ Monitor/Coordinator diplomas, First Aid, or Lifeguard certificates), will result in immediate account termination and HelloCamp's right to report the incident to the competent criminal authorities."
                : "A inserção de dados falsos, bem como a falsificação ou adulteração de documentos e certificações (tais como certificados do IPDJ de Monitor ou Coordenador, Socorrismo ou Nadador Salvador), resultará na eliminação imediata da conta do monitor e no direito da HelloCamp em reportar o incidente às autoridades criminais competentes."}
            </div>
          </section>

          {/* 3. VERIFICAÇÃO DE DADOS, RECRUTAMENTO E REGISTO CRIMINAL */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-3">
              <span className="w-8 h-8 bg-[#16A34A] text-white rounded-md flex items-center justify-center font-black text-xs shrink-0">
                3
              </span>
              <h2 className="text-lg md:text-xl font-black text-[#0F172A] m-0 uppercase tracking-wide">
                {isEn
                  ? "3. Vetting, Recruitment & Criminal Record Check"
                  : "3. Verificação de Dados, Recrutamento e Registo Criminal"}
              </h2>
            </div>

            <p className="m-0">
              {isEn
                ? "HelloCamp does NOT verify, validate, or guarantee the authenticity of the documents, identities, or certificates uploaded by monitors. The entire selection, interviewing, and hiring process is completely external to HelloCamp."
                : "A HelloCamp NÃO verifica, NÃO valida, e NÃO garante a autenticidade dos documentos, identidades ou certificados inseridos pelos monitores. O processo de seleção, entrevista e recrutamento é inteiramente externo e alheio à HelloCamp."}
            </p>

            <p className="m-0 font-bold text-[#0F172A]">
              {isEn
                ? "It is the sole and inalienable legal responsibility of the Camp Organizer (the hiring entity) to:"
                : "Cabe única e exclusivamente à entidade organizadora (quem tenciona contratar ou integrar o monitor) a obrigação legal inalienável de:"}
            </p>

            <ul className="bg-[#F8FAFC] p-6 rounded-md border border-slate-200 space-y-3.5 list-none m-0">
              <li className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 bg-[#16A34A] rounded-sm mt-2 shrink-0" />
                <span>
                  {isEn
                    ? "Conduct all job interviews and physical, pedagogical, and psychological capability assessments."
                    : "Conduzir as respetivas entrevistas e avaliações de competências técnicas, pedagógicas, físicas e psicológicas."}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 bg-[#16A34A] rounded-sm mt-2 shrink-0" />
                <span>
                  {isEn
                    ? "Examine and validate in person all original certificates, diplomas, and professional licenses of the monitor."
                    : "Exigir e validar presencialmente todos os certificados originais, diplomas e cédulas profissionais do monitor."}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 bg-[#16A34A] rounded-sm mt-2 shrink-0" />
                <span>
                  <strong className="text-[#0F172A]">
                    {isEn
                      ? "Require the Mandatory Criminal Record Check (Lei n.º 113/2009):"
                      : "Exigir obrigatoriamente o Certificado de Registo Criminal (Lei n.º 113/2009):"}
                  </strong>{" "}
                  {isEn
                    ? "In strict compliance with Portuguese law, the hiring entity is legally obligated to request, collect, and verify the monitor's clean Criminal Record (specifically issued for activities involving regular contact with minors) before any work in camp begins."
                    : "Em estrito cumprimento da legislação portuguesa (Lei n.º 113/2009), é a entidade organizadora que tem a obrigação legal de solicitar, recolher e analisar o Registo Criminal atualizado do monitor (com a finalidade expressa de exercício de funções que envolvam contacto regular com menores) antes do início de qualquer atividade em campo."}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 bg-[#16A34A] rounded-sm mt-2 shrink-0" />
                <span>
                  {isEn
                    ? "Ensure valid Work Accident Insurance and Civil Liability coverage for all recruited staff members."
                    : "Assegurar a celebração do respetivo contrato e a inclusão do monitor nas apólices obrigatórias de Seguro de Acidentes de Trabalho / Pessoais e Responsabilidade Civil."}
                </span>
              </li>
            </ul>
          </section>

          {/* 4. ISENÇÃO ABSOLUTA DE RESPONSABILIDADE DA HELLOCAMP */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-3">
              <span className="w-8 h-8 bg-[#F59E0B] text-white rounded-md flex items-center justify-center font-black text-xs shrink-0">
                4
              </span>
              <h2 className="text-lg md:text-xl font-black text-[#0F172A] m-0 uppercase tracking-wide">
                {isEn
                  ? "4. Absolute Exemption of Liability"
                  : "4. Isenção Absoluta de Responsabilidade da HelloCamp"}
              </h2>
            </div>

            <p className="m-0">
              {isEn
                ? "The HelloCamp platform, its parent company, founders, and administrators are unconditionally exempt from any civil, criminal, administrative, or labor liability arising from interactions and agreements signed between monitors and organizing entities."
                : "A plataforma HelloCamp, a sua empresa detentora, os seus fundadores e administradores isentam-se, de forma absoluta e incondicional, de qualquer responsabilidade civil, criminal, contraordenacional ou laboral decorrente das interações e contratos firmados entre os monitores e as entidades organizadoras."}
            </p>

            <p className="m-0">
              {isEn
                ? "HelloCamp is not responsible for disputes, non-payment of fees or wages, workplace accidents, harassment, breach of duties, or failures in legal document verification by the camps. Any conflict must be resolved directly and exclusively between the Monitor and the external Contracting Entity."
                : "A HelloCamp não se responsabiliza por litígios, falhas no pagamento de honorários ou remunerações, acidentes de trabalho, assédio, incumprimento de funções, ou falhas na verificação legal de documentos por parte dos campos. Todo e qualquer conflito deverá ser resolvido direta e exclusivamente entre o Monitor e a Entidade Contratante externa."}
            </p>
          </section>

          {/* 5. PRIVACIDADE, FOTOGRAFIAS, CV E CONSENTIMENTO RGPD */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-3">
              <span className="w-8 h-8 bg-[#0F172A] text-white rounded-md flex items-center justify-center font-black text-xs shrink-0">
                5
              </span>
              <h2 className="text-lg md:text-xl font-black text-[#0F172A] m-0 uppercase tracking-wide">
                {isEn
                  ? "5. Personal Data, Photos, CV and GDPR Consent"
                  : "5. Privacidade, Fotografias, CV e Consentimento RGPD"}
              </h2>
            </div>

            <p className="m-0">
              {isEn
                ? "By creating a profile on HelloCamp, the Monitor expressly and unequivocally consents to the collection, storage, and processing of their primary personal data (including Full Name, Date of Birth, Phone & Email Contacts, Availability Calendar, Curriculum Vitae, and Profile Photograph) in accordance with Regulation (EU) 2016/679 (GDPR)."
                : "Ao criar um perfil na HelloCamp, o Monitor consente expressa e inequivocamente a recolha, armazenamento e processamento dos seus dados pessoais primários (incluindo Nome Completo, Data de Nascimento, Contactos Telefónicos e de E-mail, Calendário de Disponibilidade, Currículo Vitae e Fotografia de Rosto), ao abrigo do Regulamento (UE) 2016/679 (RGPD)."}
            </p>

            <p className="m-0">
              {isEn
                ? "The Monitor expressly authorizes HelloCamp to share and display this information, including the uploaded Resume/CV and profile picture, exclusively to Verified Partners (Camp Organizers) registered on the platform, with the sole purpose of promoting and facilitating their recruitment."
                : "O Monitor autoriza expressamente a HelloCamp a partilhar e exibir de forma proativa esta informação — incluindo o CV e a fotografia submetidos — a Parceiros Validados (Organizadores de Campos) registados na plataforma, com o propósito único e exclusivo de promover e agilizar o seu recrutamento."}
            </p>

            <ul className="bg-[#F8FAFC] p-6 rounded-md border border-slate-200 space-y-3 list-none m-0">
              <li className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 bg-[#0F172A] rounded-sm mt-2 shrink-0" />
                <span>
                  {isEn
                    ? "The Monitor's profile is strictly hidden from the general public, external search engines (Google), customers, or parents. Access to the talent database is restricted to active partner organizations."
                    : "O perfil do Monitor é estritamente oculto do público em geral, motores de busca externos (Google), clientes ou pais. O acesso à base de dados de recrutamento é restrito a empresas parceiras registadas."}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 bg-[#0F172A] rounded-sm mt-2 shrink-0" />
                <span>
                  {isEn
                    ? "HelloCamp declines any responsibility for the misuse, download, or external distribution of your CV or Photograph by third-party organizing entities once they have legitimately accessed the platform."
                    : "A HelloCamp declina qualquer responsabilidade pelo uso indevido, download ou distribuição externa do seu CV ou Fotografia por parte das entidades organizadoras terceiras, após estas acederem legitimamente à plataforma."}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 bg-[#0F172A] rounded-sm mt-2 shrink-0" />
                <span>
                  {isEn
                    ? "The Monitor retains the inalienable right to be forgotten and may edit or delete their account, resume, and photograph from the platform at any time through their Monitor Portal settings, immediately ceasing future data sharing."
                    : "O Monitor detém o direito inalienável à retificação e ao esquecimento, podendo editar ou eliminar a sua conta, currículo e fotografia da plataforma a qualquer momento através do seu Portal de Monitor, cessando imediatamente a partilha futura de dados."}
                </span>
              </li>
            </ul>
          </section>

          {/* 6. CANDIDATOS MENORES DE 18 ANOS E AUTORIZAÇÃO PARENTAL */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-3">
              <span className="w-8 h-8 bg-[#F59E0B] text-white rounded-md flex items-center justify-center font-black text-xs shrink-0">
                6
              </span>
              <h2 className="text-lg md:text-xl font-black text-[#0F172A] m-0 uppercase tracking-wide">
                {isEn
                  ? "6. Underage Candidates (16 & 17 Years Old) & Parental Consent"
                  : "6. Candidatos Menores de 18 Anos (16 e 17 Anos) e Autorização Parental"}
              </h2>
            </div>

            <p className="m-0">
              {isEn
                ? "Candidates aged 16 or 17 who wish to register on the HelloCamp Staff Pool as trainee monitors or youth volunteers must mandatory attach a Parental Authorization Declaration signed by their legal guardian (a PDF template is provided free of charge during registration)."
                : "Os candidatos com 16 ou 17 anos que pretendam inscrever-se na Bolsa de Monitores como monitores estagiários, monitores auxiliares ou voluntários juvenis devem obrigatoriamente anexar no seu perfil a Declaração de Autorização Parental assinada pelo seu Encarregado de Educação (cuja minuta oficial em PDF é disponibilizada gratuitamente no formulário de registo)."}
            </p>
          </section>
        </article>

        {/* BOTÕES DE NAVEGAÇÃO NO RODAPÉ */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={`/${lang}/monitores/registo`}
            className="w-full sm:w-auto text-center bg-[#16A34A] hover:bg-green-700 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-md shadow-md transition-colors no-underline"
          >
            {isEn
              ? "← Return to Monitor Registration"
              : "← Voltar e Concluir Registo de Monitor"}
          </Link>

          <Link
            href={`/${lang}/monitores`}
            className="w-full sm:w-auto text-center bg-[#0F172A] hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-md shadow-md transition-colors no-underline"
          >
            {isEn
              ? "Back to Staff Pool Landing Page"
              : "Ir para a Página da Bolsa de Monitores"}
          </Link>
        </div>
      </div>
    </main>
  );
}
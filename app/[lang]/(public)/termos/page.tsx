import Link from "next/link";
import React from "react";

export default async function Termos({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  
  // Lógica: Se não for explicitamente Português, o Inglês atua como idioma Global (Default)
  const isPt = lang === 'pt';

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-24">
      
      {/* HEADER CORPORATIVO HELLOCAMP */}
      <div className="bg-[#0E3A68] pt-20 pb-32 px-6 text-center relative overflow-hidden">
        {/* Efeito visual de fundo */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 150%, rgba(226, 164, 29, 0.15) 0%, transparent 50%)' }}></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-3xl md:text-4xl font-black tracking-tighter mb-6 flex justify-center items-center">
            <span className="text-white">Hello</span><span className="text-[#e2a41d]">Camp</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white m-0 tracking-tight leading-tight">
            {!isPt ? 'Terms of Service & Conditions' : 'Termos de Serviço e Condições Gerais'}
          </h1>
          <p className="mt-6 text-blue-200 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            {!isPt 
              ? 'Comprehensive legal regulations for the use of the HelloCamp intermediation platform by Parents, Organizing Partners, and Institutional Entities worldwide.' 
              : 'Regulamento jurídico global aplicável à utilização da plataforma de intermediação HelloCamp por Pais, Parceiros Organizadores e Entidades Institucionais.'}
          </p>
        </div>
      </div>
      
      {/* CONTEÚDO PRINCIPAL (LEGAL) COM MARGENS CORRIGIDAS */}
      <div className="max-w-[1000px] mx-auto -mt-20 px-4 sm:px-6 relative z-10">
        <div className="bg-white rounded-[2rem] p-8 sm:p-12 md:p-16 shadow-2xl text-slate-700 leading-loose text-[15px]">
          
          <p className="mb-10 font-bold text-base md:text-lg text-[#0E3A68] text-justify leading-relaxed">
            {!isPt 
              ? 'HelloCamp is a digital intermediation platform dedicated to the promotion, discovery, and booking of summer camps, after-school programs, residential programs, sports, educational, and cultural activities for children and young adults, promoted by independent organizing partners.'
              : 'A HelloCamp é uma plataforma digital de intermediação dedicada à divulgação, descoberta e reserva de campos de férias, ATL, programas residenciais, atividades desportivas, educativas e culturais para crianças e jovens, promovidas por parceiros organizadores independentes.'
            }
          </p>

          {/* 1. ACEITAÇÃO E ÂMBITO */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '1. Acceptance and Scope' : '1. Aceitação e Âmbito'}
          </h3>
          <p className="mb-8 text-justify">
            {!isPt 
              ? 'By accessing, registering an account, or using the HelloCamp platform (including websites, mobile applications, and APIs), you conclude a legally binding contract with HelloCamp Portugal. These Terms apply to all users: "Guests/Parents" (individuals booking programs), "Partners/Hosts" (entities providing programs), and "Institutional Clients" (Municipalities, Schools, or Government Bodies). If you do not agree to these Terms, you may not use the HelloCamp Platform.' 
              : 'Ao aceder, registar uma conta ou utilizar a plataforma HelloCamp (incluindo websites, aplicações móveis e APIs), celebra um contrato legalmente vinculativo com a HelloCamp Portugal. Estes Termos aplicam-se a todos os utilizadores: "Hóspedes/Pais" (indivíduos que reservam), "Parceiros/Anfitriões" (entidades que fornecem os programas) e "Clientes Institucionais" (Câmaras Municipais, Escolas ou Juntas de Freguesia). Se não concordar com estes Termos, não deverá utilizar a Plataforma.'
            }
          </p>

          {/* 2. O PAPEL DA HELLOCAMP */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '2. HelloCamp\'s Role and Independence' : '2. Papel da HelloCamp e Isenção de Diretivas de Viagem'}
          </h3>
          <p className="mb-4 text-justify">
            {!isPt 
              ? 'HelloCamp operates an online marketplace that allows Partners to publish and offer services (camps, after-school activities, sports) and Users to search and book them. HelloCamp does not own, control, manage, or organize any of the listings or services.' 
              : 'A HelloCamp opera um mercado digital (marketplace) que permite aos Parceiros publicar e oferecer serviços (campos de férias, ATL, desporto) e aos Utilizadores pesquisar e reservar os mesmos. A HelloCamp não detém, controla, gere ou organiza qualquer um dos serviços anunciados.'
            }
          </p>
          <p className="mb-8 text-justify font-bold bg-slate-50 p-5 rounded-xl border border-slate-200 text-slate-800">
            {!isPt 
              ? 'Exclusion of Tour Operator Liability: HelloCamp acts strictly as an IT provider and commercial intermediary. We are not a party to the contracts concluded directly between Users and Partners. HelloCamp is not a travel agency, does not sell "Package Travel" or "Linked Travel Arrangements" within the meaning of Directive (EU) 2015/2302, and is not an insurer.' 
              : 'Exclusão de Responsabilidade de Operador Turístico: A HelloCamp atua estritamente como fornecedora de TI e intermediária comercial. Não somos parte dos contratos celebrados diretamente entre Utilizadores e Parceiros. A HelloCamp não é uma agência de viagens, não comercializa "Viagens Organizadas" nem "Serviços de Viagem Conexos" na aceção da Diretiva (UE) 2015/2302, e não é uma seguradora.'
            }
          </p>

          {/* 3. TERMOS PARA PAIS / UTILIZADORES */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '3. Terms for Users (Parents and Guardians)' : '3. Termos para Utilizadores (Pais e Encarregados de Educação)'}
          </h3>
          <ul className="list-disc pl-6 mb-8 space-y-4 text-justify">
            <li>
              <strong className="text-slate-900">{!isPt ? 'Accuracy of Information:' : 'Exatidão das Informações:'}</strong> 
              {!isPt 
                ? ' You are entirely responsible for the accuracy of the data provided during booking, especially medical data, allergies, psychological conditions, and dietary restrictions of the minor. HelloCamp and the Partner disclaim any liability for incidents arising from omissions or false information.' 
                : ' É inteiramente responsável pela exatidão dos dados fornecidos na reserva, em particular dados clínicos, alergias, condições psicológicas e restrições alimentares do menor. A HelloCamp e o Parceiro isentam-se de qualquer responsabilidade por incidentes decorrentes de omissões ou informações falsas.'}
            </li>
            <li>
              <strong className="text-slate-900">{!isPt ? 'Assumption of Risk:' : 'Assunção de Risco:'}</strong> 
              {!isPt 
                ? ' You acknowledge that many activities (sports, outdoor camps, nature exploration) carry inherent risks of illness, bodily injury, or property damage. You freely and willfully assume those risks by booking.' 
                : ' Reconhece que as atividades (desportos, campos ao ar livre) acarretam riscos inerentes de lesões corporais, doenças ou danos materiais. Ao reservar, assume livre e voluntariamente esses riscos em nome do menor.'}
            </li>
            <li>
              <strong className="text-slate-900">{!isPt ? 'Supervision and Delegation:' : 'Delegação de Guarda:'}</strong> 
              {!isPt 
                ? ' During the execution of the program, the custody and supervision of the minor are temporarily delegated to the Partner organizing the activity, subject to the Partner\'s internal rules.' 
                : ' Durante a execução do programa, a guarda e supervisão do menor são temporariamente delegadas à entidade Parceira organizadora, ficando sujeitas ao regulamento interno da mesma.'}
            </li>
          </ul>

          {/* 4. TERMOS PARA PARCEIROS ORGANIZADORES */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '4. Terms for Partners and Organizers' : '4. Termos para Parceiros e Organizadores'}
          </h3>
          <p className="mb-4 text-justify font-bold text-slate-800">
            {!isPt ? 'By listing a program on HelloCamp, the Partner legally warrants and obliges to:' : 'Ao anunciar um programa na HelloCamp, o Parceiro garante legalmente e obriga-se a:'}
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-4 text-justify">
            <li>
              <strong className="text-slate-900">{!isPt ? 'Legal Compliance & Licensing:' : 'Licenciamento e Cumprimento Legal:'}</strong> 
              {!isPt 
                ? ' Possess all permits, licenses, and authorizations required by their local/national government to operate youth programs (e.g., RNAAT/RNAVT in Portugal, DGS guidelines, or equivalent international bodies).' 
                : ' Possuir todos os alvarás, licenças e autorizações exigidas pelos governos locais/nacionais para operar atividades para jovens (ex: registos RNAAT/RNAVT, alvarás camarários, IPDJ).'}
            </li>
            <li>
              <strong className="text-slate-900">{!isPt ? 'Staff Vetting & Background Checks:' : 'Verificação de Staff e Registos Criminais:'}</strong> 
              {!isPt 
                ? ' The Partner is exclusively responsible for screening their employees, instructors, and volunteers, ensuring they possess clean criminal records and are legally cleared to work with minors.' 
                : ' O Parceiro é exclusivamente responsável pelo escrutínio dos seus funcionários, monitores e voluntários, garantindo obrigatoriamente a recolha de registos criminais limpos (Registo Criminal para contacto com menores) exigidos por lei.'}
            </li>
            <li>
              <strong className="text-slate-900">{!isPt ? 'Mandatory Insurance:' : 'Seguros Obrigatórios:'}</strong> 
              {!isPt 
                ? ' Maintain, at their own expense, comprehensive Civil Liability Insurance and Personal Accident Insurance covering all participants.' 
                : ' Manter, a expensas próprias, Seguros de Responsabilidade Civil e Seguros de Acidentes Pessoais ativos e com coberturas adequadas para todos os participantes.'}
            </li>
            <li>
              <strong className="text-slate-900">{!isPt ? 'Price Parity:' : 'Paridade de Preços:'}</strong> 
              {!isPt 
                ? ' The prices listed on HelloCamp may not be higher than the prices offered directly by the Partner on their own website.' 
                : ' Os preços divulgados na HelloCamp não poderão ser superiores aos preços praticados diretamente pelo Parceiro no seu próprio website ou canais diretos.'}
            </li>
          </ul>

          {/* 5. ENTIDADES INSTITUCIONAIS */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '5. Municipalities, Schools, and Institutional Entities' : '5. Câmaras, Juntas de Freguesia e Escolas (B2G/B2B)'}
          </h3>
          <p className="mb-8 text-justify">
            {!isPt 
              ? 'When a Municipality (Câmara Municipal), Parish Council (Junta de Freguesia), School, or Corporation uses the Platform either to promote their own public camps or to purchase bulk spots for their constituents/students, the representative warrants they have the legal authority to bind said public or private entity to these Terms. Institutional entities offering camps assume all Partner obligations outlined in Section 4.' 
              : 'Sempre que uma Câmara Municipal, Junta de Freguesia, Escola ou Empresa utilizar a Plataforma, quer para promover os seus campos públicos, quer para adquirir vagas em lote para munícipes/alunos, o representante garante possuir plenos poderes legais para vincular a referida entidade pública ou privada a estes Termos. Entidades públicas que organizem campos assumem todas as obrigações de Parceiro descritas na Secção 4.'
            }
          </p>

          {/* 6. RESERVAS, PAGAMENTOS E CANCELAMENTOS */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '6. Bookings, Payments, and Cancellations' : '6. Reservas, Pagamentos e Cancelamentos'}
          </h3>
          <p className="mb-4 text-justify">
            <strong className="text-slate-900">{!isPt ? 'Payment Processing:' : 'Processamento Financeiro:'}</strong>{' '}
            {!isPt 
              ? 'Payments are processed securely via third-party providers (e.g., Stripe). HelloCamp is authorized by the Partner to collect payments on their behalf. HelloCamp deducts its service fee and transfers the remainder to the Partner according to the Operational Agreement.' 
              : 'Os pagamentos são processados de forma segura através de parceiros financeiros certificados (ex: Stripe). A HelloCamp está mandatada pelo Parceiro para cobrar pagamentos em seu nome, retendo a sua comissão de serviço e transferindo o remanescente.'
            }
          </p>
          <p className="mb-8 text-justify">
            <strong className="text-slate-900">{!isPt ? 'Cancellations and Refunds:' : 'Cancelamentos e Reembolsos:'}</strong>{' '}
            {!isPt 
              ? 'Refund eligibility is determined exclusively by the Cancellation Policy defined by the Partner on the specific listing (Flexible, Moderate, or Strict). HelloCamp\'s service fees may be non-refundable. In cases of Force Majeure (pandemics, natural disasters), exceptional refund policies may apply.' 
              : 'A elegibilidade para reembolso é determinada exclusivamente pela Política de Cancelamento definida pelo Parceiro no respetivo anúncio (Flexível, Moderada ou Estrita). As taxas de serviço da HelloCamp podem ser não reembolsáveis. Em casos de Força Maior (pandemias, catástrofes), podem aplicar-se políticas de reembolso excecionais.'
            }
          </p>

          {/* 7. IMPOSTOS */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '7. Taxes and Invoicing' : '7. Impostos e Faturação'}
          </h3>
          <p className="mb-8 text-justify">
            {!isPt 
              ? 'The Partner is strictly responsible for determining, collecting, and remitting to the competent tax authorities all applicable taxes (VAT, Income Tax, Tourist Taxes) related to the sale of their programs. HelloCamp only issues invoices to the Partner regarding the intermediation commission charged.' 
              : 'O Parceiro é estrita e exclusivamente responsável por determinar, faturar aos clientes, cobrar e remeter às autoridades fiscais competentes todos os impostos aplicáveis (IVA, IRC, IRS, Taxas Turísticas) referentes à venda dos seus programas. A HelloCamp emite faturas apenas ao Parceiro, referentes à comissão de intermediação.'
            }
          </p>

          {/* 8. PROPRIEDADE INTELECTUAL */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '8. Content and Intellectual Property' : '8. Conteúdos e Propriedade Intelectual'}
          </h3>
          <p className="mb-8 text-justify">
            {!isPt 
              ? 'By uploading photos, logos, or descriptions, the Partner grants HelloCamp a worldwide, royalty-free license to use, display, and translate such content for promotional purposes. All HelloCamp platform code, design, algorithms, and trademarks are the exclusive property of HelloCamp and may not be copied, reverse-engineered, or scraped.' 
              : 'Ao submeter fotos, logótipos ou descrições, o Parceiro concede à HelloCamp uma licença mundial e isenta de royalties para utilizar, exibir e traduzir esse conteúdo para fins promocionais. Todo o código, design, algoritmos e marcas da plataforma são propriedade exclusiva da HelloCamp, sendo estritamente proibida a sua cópia, engenharia reversa ou extração de dados (scraping).'
            }
          </p>

          {/* 9. LIMITAÇÃO DE RESP. E INDEMNIZAÇÃO */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '9. Limitation of Liability and Indemnification' : '9. Limitação de Responsabilidade e Indemnização'}
          </h3>
          <p className="mb-4 text-justify">
            <strong className="text-slate-900">{!isPt ? '9.1. Liability Cap:' : '9.1. Teto de Responsabilidade:'}</strong>{' '}
            {!isPt 
              ? 'To the maximum extent permitted by law, HelloCamp\'s liability for any claim shall not exceed the total service fees collected by HelloCamp related to the specific booking giving rise to the liability.' 
              : 'Na extensão máxima permitida por lei, a responsabilidade agregada da HelloCamp por qualquer reclamação nunca excederá o valor total das comissões de serviço cobradas pela HelloCamp referentes à reserva específica que originou o litígio.'
            }
          </p>
          <p className="mb-8 text-justify">
            <strong className="text-slate-900">{!isPt ? '9.2. Indemnification:' : '9.2. Obrigação de Indemnizar (Hold Harmless):'}</strong>{' '}
            {!isPt 
              ? 'The Partner agrees to release, defend, indemnify, and hold HelloCamp harmless from any claims, liabilities, damages, and expenses (including reasonable legal fees) arising out of the Partner\'s operation of the camps, bodily injuries to participants, or breach of any laws or third-party rights.' 
              : 'O Parceiro concorda em isentar, defender, indemnizar e proteger a HelloCamp contra quaisquer reclamações, responsabilidades, danos e despesas (incluindo honorários de advogados) resultantes da operação dos campos, lesões corporais de participantes, falhas de segurança ou violação de leis por parte do Parceiro.'
            }
          </p>

          {/* 10. RGPD */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '10. Data Protection (GDPR)' : '10. Proteção de Dados (RGPD)'}
          </h3>
          <p className="mb-8 text-justify">
            {!isPt 
              ? 'HelloCamp collects and processes data in accordance with the (EU) 2016/679 General Data Protection Regulation. When a booking is made, necessary personal data is transferred to the Partner. The Partner acts as an independent Data Controller upon receipt and is legally bound to process this data solely for the execution of the service, keeping it secure and deleting it when no longer required.' 
              : 'A HelloCamp processa dados em conformidade com o Regulamento Geral de Proteção de Dados (UE) 2016/679. Numa reserva, os dados pessoais necessários são transferidos para o Parceiro. O Parceiro atua como Responsável pelo Tratamento independente após a receção, obrigando-se a processar os dados apenas para a execução do serviço, mantendo-os seguros e eliminando-os quando deixarem de ser necessários.'
            }
          </p>

          {/* 11. LEI APLICÁVEL E FORO */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '11. Governing Law and Jurisdiction' : '11. Lei Aplicável e Foro Competente (Jurisdição Internacional)'}
          </h3>
          <p className="mb-8 text-justify">
            {!isPt 
              ? 'These Terms are governed by and construed in accordance with Portuguese Law, without regard to conflict of law provisions. Regardless of the User\'s or Partner\'s country of residence (including the US, UK, EU, or Brazil), both parties agree to submit to the exclusive jurisdiction of the District Courts of Lisbon, Portugal (Comarca de Lisboa), except where mandatory local consumer protection laws prohibit such selection for consumer contracts.' 
              : 'Os presentes Termos regem-se e são interpretados de acordo com a Lei Portuguesa. Independentemente do país de residência do Utilizador ou do Parceiro (incluindo EUA, Reino Unido, UE ou Brasil), todas as partes concordam em submeter-se à jurisdição exclusiva dos tribunais da Comarca de Lisboa (Portugal), exceto quando leis locais imperativas de proteção do consumidor proíbam tal convenção de foro para contratos de consumo.'
            }
          </p>

          {/* CAIXA DE CONTACTO FINAL */}
          <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 mt-12">
            <p className="text-[15px] m-0 text-slate-700 leading-relaxed text-center sm:text-left">
              <strong className="text-slate-900 block mb-2">{!isPt ? 'Modifications and Contact:' : 'Modificações aos Termos e Contacto:'}</strong>
              {!isPt 
                ? 'HelloCamp reserves the right to modify these Terms at any time. Material changes will be communicated 30 days in advance. Continued use constitutes acceptance. For any legal inquiries contact us at:' 
                : 'A HelloCamp reserva-se o direito de modificar estes Termos a qualquer momento. Alterações substanciais serão comunicadas com 30 dias de antecedência. A utilização continuada constitui aceitação. Para assuntos jurídicos, contacte:'
              }{' '}
              <a href="mailto:info@hellocamp.pt" className="text-[#0E3A68] font-black hover:underline block sm:inline mt-2 sm:mt-0">info@hellocamp.pt</a>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
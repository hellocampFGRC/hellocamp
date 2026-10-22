import Link from "next/link";
import React from "react";

export default async function Termos({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const isEn = lang === 'en';

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '5rem' }}>
      
      {/* HEADER CORPORATIVO HELLOCAMP */}
      <div style={{ backgroundColor: '#0E3A68', padding: '5rem 1.5rem 6rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 50% 150%, rgba(226, 164, 29, 0.15) 0%, transparent 50%)' }}></div>
        
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.05em', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ color: 'white' }}>Hello</span><span style={{ color: '#e2a41d' }}>Camp</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', margin: 0, letterSpacing: 'tight' }}>
            {isEn ? 'Terms of Service & Conditions' : 'Termos de Serviço e Condições Gerais'}
          </h1>
          <p style={{ marginTop: '1rem', color: '#bfdbfe', fontSize: '1rem', fontWeight: '500', maxWidth: '700px', margin: '1rem auto 0 auto', lineHeight: '1.6' }}>
            {isEn 
              ? 'Comprehensive legal regulations for the use of the HelloCamp intermediation platform by Parents, Organizing Partners, and Institutional Entities worldwide.' 
              : 'Regulamento jurídico global aplicável à utilização da plataforma de intermediação HelloCamp por Pais, Parceiros Organizadores e Entidades Institucionais.'}
          </p>
        </div>
      </div>
      
      {/* CONTEÚDO PRINCIPAL (LEGAL) */}
      <div style={{ maxWidth: '1000px', margin: '-3rem auto 0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', padding: '3rem md:5rem', boxShadow: '0 20px 40px -10px rgba(14, 58, 104, 0.08)', color: '#334155', lineHeight: '1.8', fontSize: '15px' }}>
          
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.5rem', borderRadius: '1rem', marginBottom: '3rem' }}>
            <p style={{ margin: 0, fontWeight: '700', color: '#166534', fontSize: '14px' }}>
              {isEn 
                ? 'ATTENTION: Section 10 of these Terms contains a Limitation of Liability clause and an Indemnification agreement. Section 12 contains a Governing Law and Jurisdiction clause that applies to all claims brought against HelloCamp globally. Please read these documents carefully.'
                : 'ATENÇÃO: A Secção 10 destes Termos inclui uma cláusula de Limitação de Responsabilidade e um acordo de Indemnização. A Secção 12 contém uma cláusula de Lei Aplicável e Jurisdição aplicável a todas as reclamações contra a HelloCamp a nível global. Leia atentamente.'}
            </p>
          </div>

          {/* 1. ACEITAÇÃO E ÂMBITO */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0E3A68', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {isEn ? '1. Acceptance and Scope' : '1. Aceitação e Âmbito'}
          </h3>
          <p style={{ marginBottom: '2.5rem', textAlign: 'justify' }}>
            {isEn 
              ? 'By accessing, registering an account, or using the HelloCamp platform (including websites, mobile applications, and APIs), you conclude a legally binding contract with HelloCamp Portugal. These Terms apply to all users: "Guests/Parents" (individuals booking programs), "Partners/Hosts" (entities providing programs), and "Institutional Clients" (Municipalities, Schools, or Government Bodies). If you do not agree to these Terms, you may not use the HelloCamp Platform.' 
              : 'Ao aceder, registar uma conta ou utilizar a plataforma HelloCamp (incluindo websites, aplicações móveis e APIs), celebra um contrato legalmente vinculativo com a HelloCamp Portugal. Estes Termos aplicam-se a todos os utilizadores: "Hóspedes/Pais" (indivíduos que reservam), "Parceiros/Anfitriões" (entidades que fornecem os programas) e "Clientes Institucionais" (Câmaras Municipais, Escolas ou Juntas de Freguesia). Se não concordar com estes Termos, não deverá utilizar a Plataforma.'
            }
          </p>

          {/* 2. O PAPEL DA HELLOCAMP */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0E3A68', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {isEn ? '2. HelloCamp\'s Role and Independence' : '2. Papel da HelloCamp e Isenção de Diretivas de Viagem'}
          </h3>
          <p style={{ marginBottom: '1rem', textAlign: 'justify' }}>
            {isEn 
              ? 'HelloCamp operates an online marketplace that allows Partners to publish and offer services (camps, after-school activities, sports) and Users to search and book them. HelloCamp does not own, control, manage, or organize any of the listings or services.' 
              : 'A HelloCamp opera um mercado digital (marketplace) que permite aos Parceiros publicar e oferecer serviços (campos de férias, ATL, desporto) e aos Utilizadores pesquisar e reservar os mesmos. A HelloCamp não detém, controla, gere ou organiza qualquer um dos serviços anunciados.'
            }
          </p>
          <p style={{ marginBottom: '2.5rem', textAlign: 'justify', fontWeight: '600' }}>
            {isEn 
              ? 'Exclusion of Tour Operator Liability: HelloCamp acts strictly as an IT provider and commercial intermediary. We are not a party to the contracts concluded directly between Users and Partners. HelloCamp is not a travel agency, does not sell "Package Travel" or "Linked Travel Arrangements" within the meaning of Directive (EU) 2015/2302, and is not an insurer.' 
              : 'Exclusão de Responsabilidade de Operador Turístico: A HelloCamp atua estritamente como fornecedora de TI e intermediária comercial. Não somos parte dos contratos celebrados diretamente entre Utilizadores e Parceiros. A HelloCamp não é uma agência de viagens, não comercializa "Viagens Organizadas" nem "Serviços de Viagem Conexos" na aceção da Diretiva (UE) 2015/2302, e não é uma seguradora.'
            }
          </p>

          {/* 3. TERMOS PARA PAIS / UTILIZADORES */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0E3A68', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {isEn ? '3. Terms for Users (Parents and Guardians)' : '3. Termos para Utilizadores (Pais e Encarregados de Educação)'}
          </h3>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '2.5rem' }}>
            <li style={{ marginBottom: '0.5rem', textAlign: 'justify' }}>
              <strong>{isEn ? 'Accuracy of Information:' : 'Exatidão das Informações:'}</strong> 
              {isEn 
                ? ' You are entirely responsible for the accuracy of the data provided during booking, especially medical data, allergies, psychological conditions, and dietary restrictions of the minor. HelloCamp and the Partner disclaim any liability for incidents arising from omissions or false information.' 
                : ' É inteiramente responsável pela exatidão dos dados fornecidos na reserva, em particular dados clínicos, alergias, condições psicológicas e restrições alimentares do menor. A HelloCamp e o Parceiro isentam-se de qualquer responsabilidade por incidentes decorrentes de omissões ou informações falsas.'}
            </li>
            <li style={{ marginBottom: '0.5rem', textAlign: 'justify' }}>
              <strong>{isEn ? 'Assumption of Risk:' : 'Assunção de Risco:'}</strong> 
              {isEn 
                ? ' You acknowledge that many activities (sports, outdoor camps, nature exploration) carry inherent risks of illness, bodily injury, or property damage. You freely and willfully assume those risks by booking.' 
                : ' Reconhece que as atividades (desportos, campos ao ar livre) acarretam riscos inerentes de lesões corporais, doenças ou danos materiais. Ao reservar, assume livre e voluntariamente esses riscos em nome do menor.'}
            </li>
            <li style={{ textAlign: 'justify' }}>
              <strong>{isEn ? 'Supervision and Delegation:' : 'Delegação de Guarda:'}</strong> 
              {isEn 
                ? ' During the execution of the program, the custody and supervision of the minor are temporarily delegated to the Partner organizing the activity, subject to the Partner\'s internal rules.' 
                : ' Durante a execução do programa, a guarda e supervisão do menor são temporariamente delegadas à entidade Parceira organizadora, ficando sujeitas ao regulamento interno da mesma.'}
            </li>
          </ul>

          {/* 4. TERMOS PARA PARCEIROS ORGANIZADORES */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0E3A68', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {isEn ? '4. Terms for Partners and Organizers' : '4. Termos para Parceiros e Organizadores'}
          </h3>
          <p style={{ marginBottom: '1rem', textAlign: 'justify' }}>
            {isEn ? 'By listing a program on HelloCamp, the Partner legally warrants and obliges to:' : 'Ao anunciar um programa na HelloCamp, o Parceiro garante legalmente e obriga-se a:'}
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '2.5rem' }}>
            <li style={{ marginBottom: '0.5rem', textAlign: 'justify' }}>
              <strong>{isEn ? 'Legal Compliance & Licensing:' : 'Licenciamento e Cumprimento Legal:'}</strong> 
              {isEn 
                ? ' Possess all permits, licenses, and authorizations required by their local/national government to operate youth programs (e.g., RNAAT/RNAVT in Portugal, DGS guidelines, or equivalent international bodies).' 
                : ' Possuir todos os alvarás, licenças e autorizações exigidas pelos governos locais/nacionais para operar atividades para jovens (ex: registos RNAAT/RNAVT, alvarás camarários, IPDJ).'}
            </li>
            <li style={{ marginBottom: '0.5rem', textAlign: 'justify' }}>
              <strong>{isEn ? 'Staff Vetting & Background Checks:' : 'Verificação de Staff e Registos Criminais:'}</strong> 
              {isEn 
                ? ' The Partner is exclusively responsible for screening their employees, instructors, and volunteers, ensuring they possess clean criminal records and are legally cleared to work with minors.' 
                : ' O Parceiro é exclusivamente responsável pelo escrutínio dos seus funcionários, monitores e voluntários, garantindo obrigatoriamente a recolha de registos criminais limpos (Registo Criminal para contacto com menores) exigidos por lei.'}
            </li>
            <li style={{ marginBottom: '0.5rem', textAlign: 'justify' }}>
              <strong>{isEn ? 'Mandatory Insurance:' : 'Seguros Obrigatórios:'}</strong> 
              {isEn 
                ? ' Maintain, at their own expense, comprehensive Civil Liability Insurance and Personal Accident Insurance covering all participants.' 
                : ' Manter, a expensas próprias, Seguros de Responsabilidade Civil e Seguros de Acidentes Pessoais ativos e com coberturas adequadas para todos os participantes.'}
            </li>
            <li style={{ textAlign: 'justify' }}>
              <strong>{isEn ? 'Price Parity:' : 'Paridade de Preços:'}</strong> 
              {isEn 
                ? ' The prices listed on HelloCamp may not be higher than the prices offered directly by the Partner on their own website.' 
                : ' Os preços divulgados na HelloCamp não poderão ser superiores aos preços praticados diretamente pelo Parceiro no seu próprio website ou canais diretos.'}
            </li>
          </ul>

          {/* 5. ENTIDADES INSTITUCIONAIS */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0E3A68', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {isEn ? '5. Municipalities, Schools, and Institutional Entities' : '5. Câmaras, Juntas de Freguesia e Escolas (B2G/B2B)'}
          </h3>
          <p style={{ marginBottom: '2.5rem', textAlign: 'justify' }}>
            {isEn 
              ? 'When a Municipality (Câmara Municipal), Parish Council (Junta de Freguesia), School, or Corporation uses the Platform either to promote their own public camps or to purchase bulk spots for their constituents/students, the representative warrants they have the legal authority to bind said public or private entity to these Terms. Institutional entities offering camps assume all Partner obligations outlined in Section 4.' 
              : 'Sempre que uma Câmara Municipal, Junta de Freguesia, Escola ou Empresa utilizar a Plataforma, quer para promover os seus campos públicos, quer para adquirir vagas em lote para munícipes/alunos, o representante garante possuir plenos poderes legais para vincular a referida entidade pública ou privada a estes Termos. Entidades públicas que organizem campos assumem todas as obrigações de Parceiro descritas na Secção 4.'
            }
          </p>

          {/* 6. RESERVAS, PAGAMENTOS E CANCELAMENTOS */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0E3A68', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {isEn ? '6. Bookings, Payments, and Cancellations' : '6. Reservas, Pagamentos e Cancelamentos'}
          </h3>
          <p style={{ marginBottom: '1.5rem', textAlign: 'justify' }}>
            <strong>{isEn ? 'Payment Processing:' : 'Processamento Financeiro:'}</strong>{' '}
            {isEn 
              ? 'Payments are processed securely via third-party providers (e.g., Stripe). HelloCamp is authorized by the Partner to collect payments on their behalf. HelloCamp deducts its service fee and transfers the remainder to the Partner according to the Operational Agreement.' 
              : 'Os pagamentos são processados de forma segura através de parceiros financeiros certificados (ex: Stripe). A HelloCamp está mandatada pelo Parceiro para cobrar pagamentos em seu nome, retendo a sua comissão de serviço e transferindo o remanescente.'
            }
          </p>
          <p style={{ marginBottom: '2.5rem', textAlign: 'justify' }}>
            <strong>{isEn ? 'Cancellations and Refunds:' : 'Cancelamentos e Reembolsos:'}</strong>{' '}
            {isEn 
              ? 'Refund eligibility is determined exclusively by the Cancellation Policy defined by the Partner on the specific listing (Flexible, Moderate, or Strict). HelloCamp\'s service fees may be non-refundable. In cases of Force Majeure (pandemics, natural disasters), exceptional refund policies may apply.' 
              : 'A elegibilidade para reembolso é determinada exclusivamente pela Política de Cancelamento definida pelo Parceiro no respetivo anúncio (Flexível, Moderada ou Estrita). As taxas de serviço da HelloCamp podem ser não reembolsáveis. Em casos de Força Maior (pandemias, catástrofes), podem aplicar-se políticas de reembolso excecionais.'
            }
          </p>

          {/* 7. IMPOSTOS */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0E3A68', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {isEn ? '7. Taxes and Invoicing' : '7. Impostos e Faturação'}
          </h3>
          <p style={{ marginBottom: '2.5rem', textAlign: 'justify' }}>
            {isEn 
              ? 'The Partner is strictly responsible for determining, collecting, and remitting to the competent tax authorities all applicable taxes (VAT, Income Tax, Tourist Taxes) related to the sale of their programs. HelloCamp only issues invoices to the Partner regarding the intermediation commission charged.' 
              : 'O Parceiro é estrita e exclusivamente responsável por determinar, faturar aos clientes, cobrar e remeter às autoridades fiscais competentes todos os impostos aplicáveis (IVA, IRC, IRS, Taxas Turísticas) referentes à venda dos seus programas. A HelloCamp emite faturas apenas ao Parceiro, referentes à comissão de intermediação.'
            }
          </p>

          {/* 8. PROPRIEDADE INTELECTUAL */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0E3A68', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {isEn ? '8. Content and Intellectual Property' : '8. Conteúdos e Propriedade Intelectual'}
          </h3>
          <p style={{ marginBottom: '2.5rem', textAlign: 'justify' }}>
            {isEn 
              ? 'By uploading photos, logos, or descriptions, the Partner grants HelloCamp a worldwide, royalty-free license to use, display, and translate such content for promotional purposes. All HelloCamp platform code, design, algorithms, and trademarks are the exclusive property of HelloCamp and may not be copied, reverse-engineered, or scraped.' 
              : 'Ao submeter fotos, logótipos ou descrições, o Parceiro concede à HelloCamp uma licença mundial e isenta de royalties para utilizar, exibir e traduzir esse conteúdo para fins promocionais. Todo o código, design, algoritmos e marcas da plataforma são propriedade exclusiva da HelloCamp, sendo estritamente proibida a sua cópia, engenharia reversa ou extração de dados (scraping).'
            }
          </p>

          {/* 9. LIMITAÇÃO DE RESP. E INDEMNIZAÇÃO */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0E3A68', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {isEn ? '9. Limitation of Liability and Indemnification' : '9. Limitação de Responsabilidade e Indemnização'}
          </h3>
          <p style={{ marginBottom: '1rem', textAlign: 'justify' }}>
            {isEn 
              ? '9.1. Liability Cap: To the maximum extent permitted by law, HelloCamp\'s liability for any claim shall not exceed the total service fees collected by HelloCamp related to the specific booking giving rise to the liability.' 
              : '9.1. Teto de Responsabilidade: Na extensão máxima permitida por lei, a responsabilidade agregada da HelloCamp por qualquer reclamação nunca excederá o valor total das comissões de serviço cobradas pela HelloCamp referentes à reserva específica que originou o litígio.'
            }
          </p>
          <p style={{ marginBottom: '2.5rem', textAlign: 'justify' }}>
            {isEn 
              ? '9.2. Indemnification: The Partner agrees to release, defend, indemnify, and hold HelloCamp harmless from any claims, liabilities, damages, and expenses (including reasonable legal fees) arising out of the Partner\'s operation of the camps, bodily injuries to participants, or breach of any laws or third-party rights.' 
              : '9.2. Obrigação de Indemnizar (Hold Harmless): O Parceiro concorda em isentar, defender, indemnizar e proteger a HelloCamp contra quaisquer reclamações, responsabilidades, danos e despesas (incluindo honorários de advogados) resultantes da operação dos campos, lesões corporais de participantes, falhas de segurança ou violação de leis por parte do Parceiro.'
            }
          </p>

          {/* 10. RGPD */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0E3A68', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {isEn ? '10. Data Protection (GDPR)' : '10. Proteção de Dados (RGPD)'}
          </h3>
          <p style={{ marginBottom: '2.5rem', textAlign: 'justify' }}>
            {isEn 
              ? 'HelloCamp collects and processes data in accordance with the (EU) 2016/679 General Data Protection Regulation. When a booking is made, necessary personal data is transferred to the Partner. The Partner acts as an independent Data Controller upon receipt and is legally bound to process this data solely for the execution of the service, keeping it secure and deleting it when no longer required.' 
              : 'A HelloCamp processa dados em conformidade com o Regulamento Geral de Proteção de Dados (UE) 2016/679. Numa reserva, os dados pessoais necessários são transferidos para o Parceiro. O Parceiro atua como Responsável pelo Tratamento independente após a receção, obrigando-se a processar os dados apenas para a execução do serviço, mantendo-os seguros e eliminando-os quando deixarem de ser necessários.'
            }
          </p>

          {/* 11. LEI APLICÁVEL E FORO */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0E3A68', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {isEn ? '11. Governing Law and Jurisdiction' : '11. Lei Aplicável e Foro Competente (Jurisdição Internacional)'}
          </h3>
          <p style={{ marginBottom: '3rem', textAlign: 'justify' }}>
            {isEn 
              ? 'These Terms are governed by and construed in accordance with Portuguese Law, without regard to conflict of law provisions. Regardless of the User\'s or Partner\'s country of residence (including the US, UK, EU, or Brazil), both parties agree to submit to the exclusive jurisdiction of the District Courts of Lisbon, Portugal (Comarca de Lisboa), except where mandatory local consumer protection laws prohibit such selection for consumer contracts.' 
              : 'Os presentes Termos regem-se e são interpretados de acordo com a Lei Portuguesa. Independentemente do país de residência do Utilizador ou do Parceiro (incluindo EUA, Reino Unido, UE ou Brasil), todas as partes concordam em submeter-se à jurisdição exclusiva dos tribunais da Comarca de Lisboa (Portugal), exceto quando leis locais imperativas de proteção do consumidor proíbam tal convenção de foro para contratos de consumo.'
            }
          </p>

          <div style={{ backgroundColor: '#f0fdf4', padding: '2rem', borderRadius: '1rem', border: '1px solid #bbf7d0', marginTop: '2rem' }}>
            <p style={{ fontSize: '14px', margin: 0, color: '#166534', lineHeight: '1.6' }}>
              <strong>{isEn ? 'Modifications and Contact:' : 'Modificações aos Termos e Contacto:'}</strong><br/>
              {isEn 
                ? 'HelloCamp reserves the right to modify these Terms at any time. Material changes will be communicated 30 days in advance. Continued use constitutes acceptance. For any legal inquiries:' 
                : 'A HelloCamp reserva-se o direito de modificar estes Termos a qualquer momento. Alterações substanciais serão comunicadas com 30 dias de antecedência. A utilização continuada constitui aceitação. Para assuntos jurídicos:'
              }{' '}
              <a href="mailto:info@hellocamp.pt" style={{ color: '#059669', fontWeight: '900', textDecoration: 'underline' }}>info@hellocamp.pt</a>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
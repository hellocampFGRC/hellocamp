import Link from "next/link";

export default async function Privacidade({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const isEn = lang === 'en';

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '5rem' }}>
      
      {/* HEADER PAGE */}
      <div style={{ backgroundColor: '#0f172a', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white' }}>
          {isEn ? 'Privacy Policy' : 'Política de Privacidade'}
        </h1>
        <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '1.125rem' }}>
          {isEn ? 'Last updated: May 2026' : 'Última atualização: Maio de 2026'}
        </p>
      </div>
      
      {/* CONTEÚDO PRINCIPAL LOCK */}
      <div style={{ maxWidth: '900px', margin: '-3rem auto 0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', padding: '4rem 3rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', color: '#334155', lineHeight: '1.8', fontSize: '15px' }}>
          
          <p style={{ marginBottom: '2rem' }}>
            {isEn 
              ? 'Within the scope of the use of the HelloCamp platform, personal data of its users, partners, and participants may be collected and processed. This Privacy Policy is intended to inform clearly and transparently what personal data is collected, for what purposes it is used, how long it is stored, and what the data subject rights are.'
              : 'No âmbito da utilização da plataforma HelloCamp, poderão ser recolhidos e tratados dados pessoais dos seus utilizadores, parceiros e participantes. A presente Política de Privacidade destina-se a informar de forma clara e transparente quais os dados pessoais recolhidos, para que finalidades são utilizados, durante quanto tempo são conservados e quais os direitos dos titulares dos dados.'
            }
          </p>

          <p style={{ marginBottom: '3rem' }}>
            {isEn 
              ? 'This Policy applies to data processing carried out through the HelloCamp website, mobile applications, contact forms, bookings and financial transactions made on the platform, social media, and any other associated services.'
              : 'Esta Política aplica-se ao tratamento de dados realizado através do website da HelloCamp, aplicações móveis, formulários de contacto, reservas e transações financeiras efetuadas na plataforma, redes sociais e quaisquer outros serviços associados.'
            }
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>1. {isEn ? 'About HelloCamp' : 'Sobre o HelloCamp'}</h3>
          <p style={{ marginBottom: '1.5rem' }}>{isEn ? 'HelloCamp is a digital platform dedicated to the promotion, discovery, and booking of summer camps, after-school programs, residential and non-residential programs, sports, educational, cultural activities, and experiences for children and young people.' : 'A HelloCamp é uma plataforma digital dedicada à divulgação, descoberta e reserva de campos de férias, ATL, programas residenciais e não residenciais, atividades desportivas, experiências educativas e culturais, e programas infantis e juvenis.'}</p>
          <p style={{ marginBottom: '3rem' }}>{isEn ? 'HelloCamp acts as an active intermediary platform between users and partner organizers, centralizing the registration process and payment collection. For any clarification:' : 'A HelloCamp atua enquanto plataforma intermediária ativa entre utilizadores e organizadores parceiros, centralizando o processo de inscrição e a cobrança de pagamentos. Para qualquer esclarecimento:'} <a href="mailto:info@hellocamp.pt" style={{ color: '#059669', fontWeight: 'bold' }}>info@hellocamp.pt</a></p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>2. {isEn ? 'Data Controller' : 'Responsável pelo Tratamento'}</h3>
          <p style={{ marginBottom: '3rem' }}>
            {isEn ? 'The controller for personal data collected through the HelloCamp platform is HelloCamp.' : 'O responsável pelo tratamento dos dados pessoais recolhidos através da plataforma HelloCamp é a HelloCamp.'}<br />
            📩 <a href="mailto:info@hellocamp.pt" style={{ color: '#059669', fontWeight: 'bold' }}>info@hellocamp.pt</a><br />
            🌐 www.hellocamp.pt
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>3. {isEn ? 'Purposes of Data Processing' : 'Finalidades do Tratamento dos Dados'}</h3>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li><strong>{isEn ? 'Booking and Collection Management:' : 'Gestão de Reservas e Cobranças:'}</strong> {isEn ? 'Data processing necessary to handle booking requests, registrations, and financial transaction settlement.' : 'Tratamento de dados necessários para processar pedidos de reserva, inscrições e a liquidação financeira das transações.'}</li>
            <li><strong>{isEn ? 'Customer Support:' : 'Apoio ao Cliente:'}</strong> {isEn ? 'To respond to contact requests, provide technical support, and answer questions about transactions or refunds.' : 'Para responder a pedidos de contacto, prestar suporte técnico e esclarecer dúvidas sobre transações ou reembolsos.'}</li>
            <li><strong>{isEn ? 'Communication and Marketing:' : 'Comunicação e Marketing:'}</strong> {isEn ? 'Sending newsletters and promotional campaigns about new spots or holiday programs.' : 'Envio de newsletters e campanhas promocionais sobre novas vagas ou programas de férias.'}</li>
            <li><strong>{isEn ? 'Platform Improvement:' : 'Melhoria da Plataforma:'}</strong> {isEn ? 'Statistical analysis of traffic, technical optimization, and checkout flow security.' : 'Análise estatística de tráfego, otimização técnica e segurança dos fluxos de checkout.'}</li>
          </ul>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>4. {isEn ? 'Legal Basis' : 'Fundamento Jurídico'}</h3>
          <p style={{ marginBottom: '3rem' }}>{isEn ? 'Processing is based on the execution of the booking contract, user consent, compliance with legal obligations, and HelloCamp\'s legitimate interest in optimizing service security.' : 'O tratamento baseia-se na execução do contrato relativo à reserva e intermediação de pagamento, no consentimento do utilizador, no cumprimento de obrigações legais e no interesse legítimo da HelloCamp em otimizar a segurança do serviço.'}</p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>5. {isEn ? 'Data Shared with Third Parties' : 'Dados Partilhados com Terceiros'}</h3>
          <p style={{ marginBottom: '1.5rem' }}><strong>{isEn ? 'Organizers:' : 'Organizadores:'}</strong> {isEn ? 'Participant and guardian identification data are shared with the organizer responsible for the activity for logistical and operational safety purposes.' : 'Os dados de identificação do participante e do encarregado de educação são partilhados com o organizador responsável pela atividade para fins logísticos e de segurança operacional.'}</p>
          <p style={{ marginBottom: '3rem' }}><strong>{isEn ? 'Financial Entities:' : 'Entidades Financeiras:'}</strong> {isEn ? 'Strictly financial data are transmitted securely and encrypted to technology providers and payment platform partners responsible for processing the collection.' : 'Os dados estritamente financeiros são transmitidos de forma segura e cifrada a prestadores de serviços tecnológicos e plataformas de pagamento parceiras encarregues de processar a cobrança.'}</p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>6. {isEn ? 'International Transfers' : 'Transferência Internacional'}</h3>
          <p style={{ marginBottom: '3rem' }}>{isEn ? 'HelloCamp may use providers or payment gateways located outside the European Economic Area, always ensuring the adoption of legally required measures (security certifications and encryption) for the protection of personal and financial data.' : 'A HelloCamp poderá recorrer a fornecedores ou gateways de pagamento localizados fora do Espaço Económico Europeu, assegurando sempre a adoção das medidas legalmente exigidas para a proteção dos dados pessoais e financeiros.'}</p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>7. {isEn ? 'Data Retention' : 'Conservação dos Dados'}</h3>
          <p style={{ marginBottom: '3rem' }}>{isEn ? 'Data will be kept for the period necessary to provide services, while a contractual relationship exists, or during legally required deadlines. After this period, they will be deleted or anonymized.' : 'Os dados serão conservados durante o período necessário à prestação dos serviços, enquanto existir relação contratual ou durante os prazos legais obrigatórios. Após este período, serão eliminados ou anonimizados.'}</p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>8. {isEn ? 'Data Subject Rights' : 'Direitos dos Titulares'}</h3>
          <p style={{ marginBottom: '3rem' }}>{isEn ? 'You have the right to access your data, request rectification, deletion, limitation, or opposition to processing, as well as portability and withdrawal of consent, by contacting info@hellocamp.pt.' : 'Tem o direito de aceder aos seus dados, solicitar a retificação, apagamento, limitação ou oposição ao tratamento, bem como a portabilidade e a retirada do consentimento, contactando info@hellocamp.pt.'}</p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>9. {isEn ? 'Complaints and Authorities' : 'Reclamações e Autoridades'}</h3>
          <p style={{ marginBottom: '3rem' }}>{isEn ? 'You may file a complaint with the competent authority. In Portugal: National Data Protection Commission (CNPD) - www.cnpd.pt.' : 'Pode apresentar reclamação junto da autoridade competente. Em Portugal: Comissão Nacional de Proteção de Dados (CNPD) - www.cnpd.pt.'}</p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>10. {isEn ? 'Cookies and Advanced Security' : 'Cookies e Segurança Avançada'}</h3>
          <p style={{ marginBottom: '3rem' }}>{isEn ? 'We use cookies to ensure shopping cart persistence and secure payment processing. We adopt rigorous technical measures (such as SSL protocols) to protect the integrity of your data against loss or unauthorized access during booking settlement.' : 'Utilizamos cookies para assegurar a persistência do carrinho de compras e o processamento seguro de pagamentos. Adotamos rigorosas medidas técnicas (como protocolos SSL) para proteger a integridade dos seus dados contra perdas ou acessos não autorizados durante a liquidação de reservas.'}</p>

          <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', marginTop: '2rem' }}>
            <p style={{ fontSize: '14px', margin: 0 }}><strong>{isEn ? 'Policy Changes:' : 'Alterações à Política:'}</strong> {isEn ? 'We reserve the right to update this policy. Changes take effect upon publication. For any questions or exercise of rights:' : 'Reservamo-nos o direito de atualizar esta política. As alterações entram em vigor após publicação. Para qualquer questão ou exercício de direitos:'} <a href="mailto:info@hellocamp.com" style={{ color: '#059669', fontWeight: 'bold' }}>info@hellocamp.com</a></p>
          </div>

        </div>
      </div>
    </main>
  );
}
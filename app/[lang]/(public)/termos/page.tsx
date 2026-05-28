import Link from "next/link";

export default async function Termos({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '5rem' }}>
      
      {/* HEADER PAGE */}
      <div style={{ backgroundColor: '#0f172a', padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white' }}>
          {lang === 'en' ? 'Terms & Conditions' : 'Termos e Condições'}
        </h1>
        <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '1.125rem' }}>
          {lang === 'en' ? 'Platform usage regulations' : 'Regulamento de utilização da plataforma'}
        </p>
      </div>
      
      {/* CONTEÚDO PRINCIPAL LOCK */}
      <div style={{ maxWidth: '900px', margin: '-3rem auto 0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1.5rem', padding: '4rem 3rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', color: '#334155', lineHeight: '1.8', fontSize: '15px' }}>
          
          <p style={{ marginBottom: '3rem' }}>
            {lang === 'en' 
              ? 'HelloCamp is a digital platform dedicated to the promotion, discovery, and booking of summer camps, after-school programs, residential and non-residential programs, sports, educational, cultural activities, and experiences for children and young people, promoted by its organizing partners. HelloCamp acts as an intermediary platform.'
              : 'A HelloCamp é uma plataforma digital dedicada à divulgação, descoberta e reserva de campos de férias, ATL, programas residenciais e não residenciais, atividades desportivas, educativas, culturais e experiências para crianças e jovens, promovidas pelos seus parceiros organizadores. A HelloCamp atua enquanto plataforma intermediária.'
            }
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
            {lang === 'en' ? '1. Acceptance of Terms' : '1. Aceitação dos Termos'}
          </h3>
          <p style={{ marginBottom: '1.5rem' }}>
            {lang === 'en' 
              ? 'Use of the platform (browsing, searching, booking submission, and contact) constitutes full acceptance of these Terms and Conditions.' 
              : 'A utilização da plataforma (navegação, pesquisa, submissão de reservas e contacto) constitui aceitação integral dos presentes Termos e Condições.'
            }
          </p>
          <p style={{ marginBottom: '3rem' }}>
            {lang === 'en' 
              ? 'The user declares that they are of legal age and have the legal capacity to enter into contracts, are not prohibited from using the services, and provides truthful information.' 
              : 'O utilizador declara que possui idade legal e capacidade jurídica para celebrar contratos, não se encontra impedido de utilizar os serviços e fornece informações verdadeiras.'
            }
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
            {lang === 'en' ? '2. Contracting Parties' : '2. Partes Contratantes'}
          </h3>
          <p style={{ marginBottom: '3rem' }}>
            {lang === 'en' 
              ? 'The contract regarding participation in the programs is entered into directly between the person making the booking and the responsible organizing entity. HelloCamp acts exclusively as a technological and commercial intermediary for the promotion and centralized management of bookings.' 
              : 'O contrato relativo à participação nos programas é celebrado diretamente entre a pessoa que efetua a reserva e a entidade organizadora responsável. A HelloCamp atua exclusivamente enquanto intermediária tecnológica e comercial de divulgação e gestão centralizada de reservas.'
            }
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
            {lang === 'en' ? '3. Contract Conclusion' : '3. Celebração do Contrato'}
          </h3>
          <p style={{ marginBottom: '3rem' }}>
            {lang === 'en' 
              ? 'After submission, the request is forwarded to the organizer, who validates availability and confirms the booking. HelloCamp does not guarantee permanent availability, as spots are dynamically managed by partners and may be limited.' 
              : 'Após a submissão, o pedido é encaminhado ao organizador, que valida a disponibilidade e confirma a reserva. A HelloCamp não garante disponibilidade permanente, visto que as vagas são geridas dinamicamente pelos parceiros e podem ser limitadas.'
            }
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
            {lang === 'en' ? '4. Services Provided by HelloCamp' : '4. Serviços Prestados pela HelloCamp'}
          </h3>
          <p style={{ marginBottom: '3rem' }}>
            {lang === 'en' 
              ? 'HelloCamp provides search, centralized booking management, secure payment processing, and active mediation. We do not directly organize the programs, nor do we include additional insurance, unless expressly stated otherwise.' 
              : 'A HelloCamp disponibiliza pesquisa, gestão centralizada de reservas, processamento seguro de pagamentos e mediação ativa. Não organizamos diretamente os programas, nem incluímos seguros adicionais, salvo indicação expressa em contrário.'
            }
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
            {lang === 'en' ? '5. Organizer Terms' : '5. Termos do Organizador'}
          </h3>
          <p style={{ marginBottom: '3rem' }}>
            {lang === 'en' 
              ? 'The specific Terms and Conditions of each organizer apply (internal rules, schedules, insurance, requirements). The organizer is exclusively responsible for the application and compliance of these operational conditions with the client.' 
              : 'Aplicam-se igualmente os Termos e Condições específicos de cada organizador (regras internas, horários, seguros, requisitos). O organizador é exclusivamente responsável pela aplicação e cumprimento destas condições operacionais junto do cliente.'
            }
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
            {lang === 'en' ? '6. Booking Flow and Payments' : '6. Fluxo de Reservas e Pagamentos'}
          </h3>
          <p style={{ marginBottom: '1.5rem' }}>
            <strong>{lang === 'en' ? 'Payment Centralization:' : 'Centralização de Pagamentos:'}</strong>{' '}
            {lang === 'en' 
              ? 'All payments for activities booked through the platform are made directly to HelloCamp, using the secure payment solutions provided on the website. HelloCamp receives the amounts in the name and on behalf of the partner organizer, subsequently proceeding to transfer the funds to the respective organizer, minus the agreed service commission.' 
              : 'Todos os pagamentos relativos às atividades reservadas através da plataforma são efetuados diretamente à HelloCamp, utilizando as soluções de pagamento seguro disponibilizadas no website. A HelloCamp recebe os montantes em nome e por conta do organizador parceiro, procedendo posteriormente ao repasse dos fundos para o respetivo organizador, deduzida a comissão de serviço acordada.'
            }
          </p>
          <p style={{ marginBottom: '3rem' }}>
            {lang === 'en' 
              ? 'The final invoicing regarding the camp service is the exclusive responsibility of the partner organizing entity. If the organizer presents changes to the initially submitted conditions, a new booking proposal will be communicated, the acceptance of which will depend on the client\'s express confirmation.' 
              : 'A faturação final relativa à prestação do serviço do campo de férias é da exclusiva responsabilidade da entidade organizadora parceira. Caso o organizador apresente alterações às condições inicialmente submetidas, será comunicada uma nova proposta de reserva, cuja aceitação dependerá da confirmação expressa do cliente.'
            }
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
            {lang === 'en' ? '7. Data Protection' : '7. Proteção de Dados'}
          </h3>
          <p style={{ marginBottom: '3rem' }}>
            {lang === 'en' 
              ? 'We guarantee data protection under the GDPR. Collected data processes bookings, validates financial transactions, and is transmitted to the partner organizer only within the scope strictly necessary for carrying out the activity.' 
              : 'Garantimos a proteção dos dados nos termos do RGPD. Os dados recolhidos processam reservas, validam transações financeiras e são transmitidos ao organizador parceiro apenas no âmbito estritamente necessário para a realização da atividade.'
            }
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
            {lang === 'en' ? '8. Cancellations, Changes, and Refunds' : '8. Cancelamentos, Alterações e Reembolsos'}
          </h3>
          <p style={{ marginBottom: '1.5rem' }}>
            {lang === 'en' 
              ? 'Cancellations, booking changes, and refund requests are strictly subject to the conditions and deadlines defined in each partner organizer\'s individual policy.' 
              : 'Os cancelamentos, alterações de reserva e pedidos de reembolso encontram-se estritamente sujeitos às condições e prazos definidos na política individual de cada organizador parceiro.'
            }
          </p>
          <p style={{ marginBottom: '3rem' }}>
            <strong>{lang === 'en' ? 'Refund Processing:' : 'Processamento de Reembolsos:'}</strong>{' '}
            {lang === 'en' 
              ? 'Whenever a cancellation results in a right to a full or partial refund according to the organizer\'s rules, the respective financial reversal will be executed directly by HelloCamp through the original payment method used by the client. HelloCamp reserves the right to apply administrative or booking processing fees when applicable.' 
              : 'Sempre que um cancelamento resulte num direito a reembolso total ou parcial segundo as regras do organizador, o respetivo estorno financeiro será executado diretamente pela HelloCamp através do meio de pagamento original utilizado pelo cliente. A HelloCamp reserva-se o direito de aplicar taxas administrativas ou de processamento de reserva quando aplicável.'
            }
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
            {lang === 'en' ? '9. Services Outside the Country' : '9. Serviços Fora do País'}
          </h3>
          <p style={{ marginBottom: '3rem' }}>
            {lang === 'en' 
              ? 'For programs outside Portugal, the participant is responsible for complying with the destination country\'s rules (visas, passports, mandatory insurance, and health requirements).' 
              : 'Para programas fora de Portugal, o participante é responsável pelo cumprimento das regras do país de destino (vistos, passaportes, seguros obrigatórios e requisitos sanitários).'
            }
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
            {lang === 'en' ? '10. Liability and Failures' : '10. Responsabilidade e Falhas'}
          </h3>
          <p style={{ marginBottom: '3rem' }}>
            {lang === 'en' 
              ? 'HelloCamp acts exclusively as an intermediary and payment facilitating entity, and is not responsible for the operational execution, quality, accidents, or incidents that occur during the programs. Any operational complaint must be directed to the organizer. HelloCamp can only be held liable in cases of willful misconduct or gross negligence in managing the platform and payments.' 
              : 'A HelloCamp atua exclusivamente enquanto intermediária e entidade facilitadora de pagamentos, não sendo responsável pela execução operacional, qualidade, acidentes ou incidentes ocorridos durante os programas. Qualquer reclamação operacional deve ser dirigida ao organizador. A HelloCamp apenas poderá ser responsabilizada em casos de dolo ou negligência grave na gestão da plataforma e dos pagamentos.'
            }
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
            {lang === 'en' ? '11. Intellectual Property' : '11. Propriedade Intelectual'}
          </h3>
          <p style={{ marginBottom: '3rem' }}>
            {lang === 'en' 
              ? 'All HelloCamp content (logos, texts, brands, design, and code) is protected by intellectual property rights and may not be used or reproduced without express written authorization.' 
              : 'Todos os conteúdos da HelloCamp (logótipos, textos, marcas, design e código) estão protegidos por direitos de propriedade intelectual e não podem ser utilizados ou reproduzidos sem autorização expressa por escrito.'
            }
          </p>

          <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', marginTop: '2rem' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>
              <strong>{lang === 'en' ? 'Authorization and Changes:' : 'Autorização e Alterações:'}</strong>{' '}
              {lang === 'en' 
                ? 'By making a booking, you declare that you are of legal age or have legal authorization from the guardians. We reserve the right to update these Terms at any time. For any clarification:' 
                : 'Ao efetuar uma reserva, declara ser maior de idade ou possuir autorização legal dos encarregados de educação. Reservamo-nos o direito de alterar estes Termos a qualquer momento. Para qualquer esclarecimento:'
              }{' '}
              <a href="mailto:info@hellocamp.com" style={{ color: '#059669', fontWeight: 'bold' }}>info@hellocamp.com</a>
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
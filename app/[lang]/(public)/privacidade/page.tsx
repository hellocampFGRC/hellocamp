import Link from "next/link";
import React from "react";

export default async function Privacidade({ params }: { params: Promise<{ lang: string }> }) {
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
            {!isPt ? 'Privacy Policy' : 'Política de Privacidade e Dados'}
          </h1>
          <p className="mt-6 text-blue-200 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            {!isPt 
              ? 'Learn how we collect, protect, and process the personal information of parents, partners, and minors on our platform.' 
              : 'Saiba como recolhemos, protegemos e tratamos as informações pessoais de pais, parceiros e menores na nossa plataforma.'}
          </p>
        </div>
      </div>
      
      {/* CONTEÚDO PRINCIPAL (LEGAL) */}
      <div className="max-w-[1000px] mx-auto -mt-20 px-4 sm:px-6 relative z-10">
        <div className="bg-white rounded-[2rem] p-8 sm:p-12 md:p-16 shadow-2xl text-slate-700 leading-loose text-[15px]">
          
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl mb-12">
            <p className="m-0 font-bold text-[#0E3A68] text-sm md:text-base leading-relaxed text-justify">
              {!isPt 
                ? 'Within the scope of using the HelloCamp platform (discovery and booking of youth programs), we collect and process personal data of users, organizing partners, and participants. This Privacy Policy is intended to inform you transparently about what personal data is collected, the purposes of its processing, how long it is stored, and your data subject rights.'
                : 'No âmbito da utilização da plataforma HelloCamp (descoberta e reserva de programas infantojuvenis), recolhemos e tratamos dados pessoais de utilizadores, parceiros organizadores e participantes. A presente Política de Privacidade destina-se a informá-lo de forma transparente sobre quais os dados pessoais recolhidos, as finalidades do seu tratamento, o tempo de conservação e os seus direitos.'
              }
            </p>
          </div>

          {/* 1. RESPONSÁVEL PELO TRATAMENTO */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2">
            {!isPt ? '1. Data Controller' : '1. Responsável pelo Tratamento'}
          </h3>
          <p className="mb-8 text-justify">
            {!isPt 
              ? 'HelloCamp Portugal acts as the Data Controller regarding the operation of the website, user accounts, and payment processing. However, regarding the operational execution of the booked activity, the respective Organizing Partner assumes the role of an independent Data Controller for the information securely forwarded to them by HelloCamp.' 
              : 'A HelloCamp Portugal atua como Responsável pelo Tratamento no que diz respeito à operação do website, gestão de contas de utilizador e processamento de pagamentos. No entanto, no que concerne à execução operacional da atividade reservada, o respetivo Parceiro Organizador assume o papel de Responsável pelo Tratamento independente sobre as informações que lhe são reencaminhadas de forma segura pela HelloCamp.'}
          </p>

          {/* 2. DADOS RECOLHIDOS */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '2. Personal Data We Collect' : '2. Dados Pessoais que Recolhemos'}
          </h3>
          <p className="mb-4 text-justify font-bold text-slate-900">
            {!isPt ? 'When making a booking or interacting with our platform, we may collect:' : 'Ao efetuar uma reserva ou interagir com a nossa plataforma, podemos recolher:'}
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-4 text-justify">
            <li>
              <strong className="text-slate-900">{!isPt ? 'Account and Booking Data:' : 'Dados de Conta e Reserva:'}</strong> 
              {!isPt 
                ? ' Name, email address, telephone number, and payment information (processed securely by encrypted payment gateways).' 
                : ' Nome, endereço de e-mail, contacto telefónico e informações de pagamento (processadas de forma segura e cifrada por plataformas financeiras parceiras).'}
            </li>
            <li>
              <strong className="text-slate-900">{!isPt ? 'Minor / Participant Data:' : 'Dados de Menores / Participantes:'}</strong> 
              {!isPt 
                ? ' Full name, date of birth, and sensitive data strictly necessary for the child\'s safety during the camp (e.g., medical conditions, dietary restrictions, or allergies), provided voluntarily by the legal guardian.' 
                : ' Nome completo, data de nascimento e dados sensíveis estritamente necessários para a segurança da criança durante o campo de férias (ex: condições clínicas, restrições alimentares ou alergias), fornecidos voluntariamente pelo encarregado de educação.'}
            </li>
            <li>
              <strong className="text-slate-900">{!isPt ? 'Device and Browsing Data:' : 'Dados de Dispositivo e Navegação:'}</strong> 
              {!isPt 
                ? ' IP addresses, browser types, language settings, and interaction logs with the platform to prevent fraud and improve the user experience.' 
                : ' Endereços IP, tipo de navegador, idioma preferido e registos de interação com a plataforma, para efeitos de prevenção de fraude e melhoria da experiência de utilização.'}
            </li>
          </ul>

          {/* 3. FINALIDADES DO TRATAMENTO */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '3. Purposes and Legal Basis for Processing' : '3. Finalidades e Fundamentos do Tratamento'}
          </h3>
          <p className="mb-4 text-justify">
            {!isPt 
              ? 'Your data is processed based on the execution of a contract, compliance with legal obligations, and legitimate interests. We use your data to:' 
              : 'O tratamento dos seus dados baseia-se na execução do contrato de reserva, no cumprimento de obrigações legais e nos nossos interesses legítimos. Utilizamos os dados para:'}
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-4 text-justify">
            <li><strong>{!isPt ? 'Booking Management:' : 'Gestão de Reservas:'}</strong> {!isPt ? 'To validate transactions, process payments, and confirm spots with the Partner.' : 'Para validar as transações, processar pagamentos e confirmar a vaga junto do Parceiro.'}</li>
            <li><strong>{!isPt ? 'Logistics and Safety:' : 'Logística e Segurança Operacional:'}</strong> {!isPt ? 'To safely transmit the participant\'s dietary and medical requirements to the camp organizers.' : 'Para transmitir de forma segura os requisitos médicos e alimentares do participante ao organizador do campo.'}</li>
            <li><strong>{!isPt ? 'Customer Support:' : 'Apoio ao Cliente e Resolução de Litígios:'}</strong> {!isPt ? 'To assist in modifications, cancellations, refunds, and mediate communication between parents and camps.' : 'Para auxiliar em modificações, cancelamentos, reembolsos e mediar a comunicação entre pais e organizadores.'}</li>
            <li><strong>{!isPt ? 'Fraud Prevention:' : 'Prevenção de Fraude:'}</strong> {!isPt ? 'To monitor suspicious activities and protect the integrity of the platform.' : 'Para monitorizar atividades suspeitas e proteger a integridade financeira e tecnológica da plataforma.'}</li>
          </ul>

          {/* 4. PARTILHA COM TERCEIROS */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '4. Data Sharing with Third Parties' : '4. Partilha de Dados com Terceiros'}
          </h3>
          <p className="mb-4 text-justify font-bold text-slate-800">
            {!isPt ? 'HelloCamp does not sell personal data. Data is shared strictly to fulfill our services:' : 'A HelloCamp não vende dados pessoais. A partilha ocorre estritamente para a prestação dos nossos serviços:'}
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-4 text-justify">
            <li>
              <strong className="text-slate-900">{!isPt ? 'Organizing Partners:' : 'Parceiros Organizadores:'}</strong> 
              {!isPt 
                ? ' To complete your booking, we transmit the participant\'s and guardian\'s identification, along with chosen extras and health alerts, to the entity hosting the camp.' 
                : ' Para finalizar a sua reserva, transmitimos a identificação do participante e do encarregado de educação, bem como os extras escolhidos e os alertas de saúde, à entidade que irá executar a atividade.'}
            </li>
            <li>
              <strong className="text-slate-900">{!isPt ? 'Payment Providers:' : 'Prestadores de Pagamentos Financeiros:'}</strong> 
              {!isPt 
                ? ' Strictly financial data is managed and processed securely by certified third-party providers (e.g., Stripe) to execute credit card charges and refunds.' 
                : ' Os dados estritamente financeiros são geridos e processados de forma segura e cifrada por prestadores terceiros certificados (ex: Stripe) para a execução de cobranças e reembolsos.'}
            </li>
            <li>
              <strong className="text-slate-900">{!isPt ? 'Legal Authorities:' : 'Autoridades Competentes:'}</strong> 
              {!isPt 
                ? ' We may disclose personal data to law enforcement or tax authorities when legally compelled or to protect our legitimate interests.' 
                : ' Poderemos divulgar dados pessoais às autoridades policiais ou fiscais quando legalmente exigido ou para defender os nossos interesses legítimos.'}
            </li>
          </ul>

          {/* 5. PROTEÇÃO DE MENORES */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '5. Processing of Minors\' Data' : '5. Tratamento de Dados Pessoais de Menores'}
          </h3>
          <p className="mb-8 text-justify">
            {!isPt 
              ? 'HelloCamp services are intended for adults (parents, guardians, or organizers). We only collect and process personal data of minors (under 18) when provided directly and voluntarily by their parents or legal guardians within the context of booking a youth activity. This sensitive data is retained only as long as necessary for the execution of the program.' 
              : 'Os serviços da HelloCamp destinam-se a adultos (pais, encarregados de educação ou organizadores). Apenas recolhemos e tratamos dados pessoais de menores de 18 anos quando fornecidos de forma direta e voluntária pelos seus pais ou representantes legais, no contexto da inscrição numa atividade infantojuvenil. Estes dados sensíveis são conservados apenas durante o tempo estritamente necessário para a execução e segurança do programa.'
            }
          </p>

          {/* 6. CONSERVAÇÃO E SEGURANÇA */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '6. Data Retention and Security' : '6. Conservação e Segurança da Informação'}
          </h3>
          <p className="mb-4 text-justify">
            {!isPt 
              ? 'We implement robust technical and organizational security measures (e.g., SSL encryption, access restrictions, and secure data rooms) to protect your data against unauthorized access.' 
              : 'Implementamos medidas técnicas e organizativas de segurança rigorosas (ex: encriptação SSL, restrições lógicas de acesso e firewalls) para proteger os seus dados contra perdas ou acessos não autorizados.'}
          </p>
          <p className="mb-8 text-justify">
            {!isPt 
              ? 'Personal data will be kept for the period strictly necessary to fulfill the purposes described, unless a longer retention period is required by applicable law (e.g., tax and accounting obligations).' 
              : 'Os dados pessoais serão conservados pelo período estritamente necessário à prossecução das finalidades descritas, salvo se um prazo de conservação mais longo for imposto por obrigações legais e regulamentares (ex: obrigações fiscais e contabilísticas).'}
          </p>

          {/* 7. DIREITOS DOS TITULARES */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '7. Your Data Subject Rights (GDPR)' : '7. Direitos dos Titulares dos Dados (RGPD)'}
          </h3>
          <p className="mb-4 text-justify font-bold text-slate-800">
            {!isPt ? 'Under the GDPR, you have the right to:' : 'Ao abrigo do RGPD, tem o direito de:'}
          </p>
          <ul className="list-disc pl-6 mb-8 space-y-2 text-justify">
            <li>{!isPt ? 'Access your personal data held by us.' : 'Aceder aos seus dados pessoais armazenados pela HelloCamp.'}</li>
            <li>{!isPt ? 'Request the correction or update of inaccurate information.' : 'Solicitar a retificação de informações imprecisas ou desatualizadas.'}</li>
            <li>{!isPt ? 'Request the erasure of your data ("Right to be Forgotten"), where legally applicable.' : 'Solicitar o apagamento dos seus dados ("Direito ao Esquecimento"), quando legalmente aplicável.'}</li>
            <li>{!isPt ? 'Restrict or object to the processing of your data, particularly for direct marketing purposes.' : 'Limitar ou opor-se ao processamento dos seus dados, especialmente para fins de marketing direto.'}</li>
          </ul>

          {/* 8. COOKIES E TRANSFERÊNCIAS */}
          <h3 className="text-lg md:text-xl font-black text-[#0E3A68] mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mt-12">
            {!isPt ? '8. Cookies and International Transfers' : '8. Cookies e Transferências Internacionais'}
          </h3>
          <p className="mb-8 text-justify">
            {!isPt 
              ? 'We use cookies (technical and analytical) to ensure shopping cart persistence, secure payment processing, and traffic analysis. Furthermore, we may use global service providers located outside the European Economic Area (EEA), always ensuring the implementation of Standard Contractual Clauses (SCCs) to protect your data internationally.' 
              : 'Utilizamos cookies (técnicos e analíticos) para assegurar a persistência de contas e pesquisas, o processamento seguro de pagamentos e a análise de tráfego. Adicionalmente, podemos utilizar prestadores de serviços globais localizados fora do Espaço Económico Europeu (EEE), assegurando sempre a implementação de Cláusulas Contratuais-Tipo (CCT) para proteger os seus dados a nível internacional.'}
          </p>

          {/* CAIXA DE CONTACTO FINAL */}
          <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 mt-12">
            <p className="text-[15px] m-0 text-slate-700 leading-relaxed text-center sm:text-left">
              <strong className="text-slate-900 block mb-2">{!isPt ? 'Contact and Complaints:' : 'Contacto e Reclamações:'}</strong>
              {!isPt 
                ? 'To exercise your privacy rights, please contact our Data Protection Office at ' 
                : 'Para exercer os seus direitos de privacidade, contacte a nossa equipa de Proteção de Dados através de '
              }
              <a href="mailto:info@hellocamp.pt" className="text-[#059669] font-black hover:underline">info@hellocamp.pt</a>. 
              {!isPt 
                ? ' You also have the right to lodge a complaint with your national supervisory authority (e.g., CNPD in Portugal).' 
                : ' Tem ainda o direito de apresentar uma reclamação junto da autoridade de controlo competente (em Portugal, a Comissão Nacional de Proteção de Dados - CNPD).'
              }
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
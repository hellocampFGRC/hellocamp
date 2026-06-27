"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function GestaoContratosHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalContrato, setModalContrato] = useState<any>(null);
  
  const [filtroStatus, setFiltroStatus] = useState<string>('Pendente de Revisão');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editComissao, setEditComissao] = useState<number>(12);
  const [savingEdit, setSavingEdit] = useState(false);

  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block";
  const inputClass = "w-full py-1.5 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:border-gray-800 transition-all shadow-sm";
  const selectClass = "w-full py-1.5 px-3 pr-8 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:border-gray-800 transition-all shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[position:right_1rem_center] bg-no-repeat";
  const textareaClass = "w-full p-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800 transition-all shadow-sm resize-y";

  const fetchContratos = async () => {
    const { data } = await supabase
      .from('campos')
      .select('id, nome, contrato_dados, status_aprovacao, taxa_comissao, ativo, organizador_id')
      .order('id', { ascending: false });
      
    setContratos(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchContratos(); }, []);

  const abrirModal = (contrato: any) => {
    setModalContrato(contrato);
    setEditForm(contrato.contrato_dados || {});
    setEditComissao(contrato.taxa_comissao || 12);
    setIsEditing(false);
  };

  const handleAcaoContrato = async (id: string, novoStatus: string) => {
    const isApproved = novoStatus === 'Aprovado';
    
    const updatePayload: any = { 
      status_aprovacao: novoStatus,
      ativo: isApproved 
    };

    if (isApproved) {
      updatePayload.contrato_parceiro_url = `https://hellocamp.pt/contratos/aprovado_${id}.pdf`;
    } else {
      updatePayload.contrato_parceiro_url = null;
    }

    const { error } = await supabase.from('campos').update(updatePayload).eq('id', id);

    if (error) {
      alert("Erro ao atualizar base de dados: " + error.message);
    } else {
      
      if (modalContrato?.organizador_id) {
        await supabase
          .from('perfis')
          .update({ parceiro_verificado: isApproved })
          .eq('id', modalContrato.organizador_id);
      }

      try {
        const dados = modalContrato?.contrato_dados || {};
        await fetch('/api/notificacoes/status-contrato', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            parceiroEmail: dados.emailContacto, 
            nomeCampo: modalContrato?.nome,
            status: novoStatus,
            lang: lang
          })
        });
      } catch (err) {
        console.error("Erro ao notificar parceiro da alteração de estado:", err);
      }

      alert(`Sucesso! Contrato alterado para ${novoStatus}. O campo está agora ${isApproved ? 'ATIVO' : 'OCULTO'}.`);
      setModalContrato((prev: any) => ({ ...prev, status_aprovacao: novoStatus, ativo: isApproved }));
      fetchContratos();
    }
  };

  const handleGuardarEdicao = async () => {
    setSavingEdit(true);
    
    const { error } = await supabase
      .from('campos')
      .update({ 
        contrato_dados: editForm,
        taxa_comissao: editComissao 
      })
      .eq('id', modalContrato.id);

    if (error) {
      alert("Erro ao guardar edição: " + error.message);
      setSavingEdit(false);
      return;
    }

    try {
      await fetch('/api/notificacoes/contrato-editado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          parceiroEmail: editForm.emailContacto, 
          nomeCampo: modalContrato?.nome,
          status: 'Editado',
          lang: lang
        })
      });
    } catch (err) {
      console.error("Erro ao notificar parceiro da edição:", err);
    }

    alert("Contrato editado com sucesso! Cópia atualizada enviada ao parceiro.");
    
    setModalContrato({ ...modalContrato, contrato_dados: editForm, taxa_comissao: editComissao });
    setIsEditing(false);
    setSavingEdit(false);
    fetchContratos();
  };

  const handleImprimirPDF = () => {
    if (!modalContrato || !modalContrato.contrato_dados) return;
    const dados = modalContrato.contrato_dados;
    const comissaoText = modalContrato.taxa_comissao || 12;
    const dataContrato = dados.dataSubmissao ? new Date(dados.dataSubmissao).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/D';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("O seu navegador bloqueou a abertura da janela (Pop-up). Por favor, permita para gerar o PDF.");
      return;
    }

    let anexo1Text = dados.modalidadeReserva === 'direta' 
      ? "<strong>Reserva Direta com Pagamento Automático (Recomendado):</strong> As reservas efetuadas através da plataforma HelloCamp serão registadas diretamente no sistema de reservas do Parceiro. Nesta modalidade, a HelloCamp terá direito à comissão acordada sobre cada reserva concluída. O formulário de reserva será configurado de acordo com as necessidades do Parceiro, recolhendo as informações necessárias para a correta gestão das inscrições. O Parceiro compromete-se a manter atualizadas as disponibilidades, preços e demais informações relevantes das atividades disponibilizadas através da plataforma."
      : "<strong>Comunicação por E-mail (Reserva Sob Consulta):</strong> A HelloCamp enviará ao Parceiro, por correio eletrónico, todas as informações necessárias para a gestão da reserva, incluindo os dados do participante, os dados do responsável pela reserva e os detalhes da atividade reservada. O Parceiro dispõe de 2 (dois) dias úteis para comunicar à HelloCamp a rejeição de uma reserva por motivo devidamente justificado. Na ausência de resposta dentro deste prazo, a reserva considerar-se-á aceite, sendo aplicável a comissão prevista no contrato.";

    let anexo2Text = dados.tipoPagamento === '100_total'
      ? "<strong>100% Pago no Ato da Reserva (Pagamento Imediato):</strong> O cliente liquida a totalidade do valor do programa para assegurar a vaga de imediato."
      : "<strong>Sinal de 50% Agora + 50% 1 Semana Antes:</strong> A plataforma debitará automaticamente a segunda metade do cartão do cliente 7 dias antes do início do programa.";

    let anexo3Text = "";
    if (dados.politicaCancelamento?.includes('Flexível')) {
      anexo3Text = "<strong>Flexível (Reembolso a 100% até 7 dias antes):</strong> A HelloCamp não cobrará qualquer comissão sobre reservas canceladas pelo cliente. O Parceiro compromete-se a não aplicar quaisquer custos de cancelamento ao cliente, desde que o pedido seja comunicado até 7 (sete) dias antes do início da atividade. Os montantes pagos deverão ser reembolsados no prazo máximo de 30 dias. Cancelamentos após este prazo não conferem direito a reembolso, sendo a comissão integral devida à HelloCamp.";
    } else if (dados.politicaCancelamento?.includes('Moderada')) {
      anexo3Text = "<strong>Moderada (Reembolso a 50% até 15 dias antes):</strong> A comissão da HelloCamp é considerada devida após a confirmação. Em caso de cancelamento até 15 dias antes do início, o cliente recebe 50% do valor pago. Nestas situações, a comissão da HelloCamp será reduzida proporcionalmente ao valor efetivamente retido pelo Parceiro a título de cancelamento. Cancelamentos após este prazo não conferem direito a reembolso.";
    } else {
      anexo3Text = "<strong>Estrita (Sem reembolso após reserva):</strong> As reservas efetuadas são finais e não reembolsáveis em caso de cancelamento por iniciativa do cliente. A comissão da HelloCamp é devida na sua totalidade independentemente de o cliente comparecer ou não à atividade, uma vez que a receita do Parceiro fica inteiramente garantida.";
    }

    const html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <title>Contrato Intermediação - ${dados.empresaNome || modalContrato.nome}</title>
        <style>
          body { font-family: "Times New Roman", Times, serif; color: #000; max-width: 850px; margin: 0 auto; padding: 40px 30px; line-height: 1.5; font-size: 14px; text-align: justify; }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, sans-serif; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 10px; display: inline-block; }
          .header p { font-size: 12px; font-family: Arial, sans-serif; color: #555; margin-top: 5px; }
          
          h2 { font-size: 16px; text-align: center; text-transform: uppercase; font-family: Arial, sans-serif; margin-top: 30px; margin-bottom: 15px; }
          h3 { font-size: 14px; font-weight: bold; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; }
          
          .party-block { background-color: #f9f9f9; border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 4px; }
          .party-block p { margin: 5px 0; }
          
          .clause { margin-bottom: 15px; }
          .clause-title { font-weight: bold; }
          
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; border-top: 2px solid #000; padding-top: 30px; }
          .sig-box { width: 45%; }
          .sig-title { font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
          .sig-name { font-size: 22px; font-style: italic; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px; display: inline-block; min-width: 100%; }
          .sig-details { font-size: 12px; font-family: Arial, sans-serif; }
          
          .stamp { font-size: 10px; font-family: monospace; color: #666; margin-top: 15px; padding: 10px; border: 1px dashed #ccc; background: #fafafa; }
          
          @media print { 
            body { padding: 0; max-width: 100%; } 
            .print-btn { display: none; } 
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="print-btn" style="text-align: center; margin-bottom: 30px;">
          <button onclick="window.print()" style="padding: 10px 25px; background: #000; color: #fff; font-weight: bold; border: none; cursor: pointer; font-size: 16px;">Imprimir Contrato Jurídico</button>
        </div>

        <div class="header">
          <h1>Contrato de Intermediação – HelloCamp</h1>
          <p>Acordo de Prestação de Serviços</p>
        </div>

        <p>Entre a <strong>HelloCamp</strong>, com website em www.hellocamp.pt e contacto via info@hellocamp.pt, doravante designada por "Primeiro Outorgante"; e do outro lado:</p>
        
        <div class="party-block">
          <p><strong>Nome da Empresa (Faturação):</strong> ${dados.empresaNome}</p>
          <p><strong>NIF:</strong> ${dados.nif}</p>
          <p><strong>Forma Jurídica:</strong> ${dados.formaJuridica}</p>
          <p><strong>Morada Fiscal:</strong> ${dados.morada}, ${dados.codigoPostal}</p>
          <p><strong>Pessoa de Contacto:</strong> ${dados.pessoaContacto}</p>
          <p><strong>Telefone:</strong> ${dados.telefone}</p>
          <p><strong>E-mail Comercial:</strong> ${dados.emailContacto}</p>
          <p><strong>E-mail para Reservas:</strong> ${dados.emailReservas}</p>
          <p><strong>Responsável de Dados (RGPD):</strong> ${dados.responsavelRGPD}</p>
          <p><strong>Website:</strong> ${dados.website || 'N/A'}</p>
        </div>

        <p style="text-align: center; font-style: italic;">- doravante designado por "Parceiro" -</p>

        <p>É celebrado o presente contrato de intermediação e divulgação comercial aplicável, mas não limitado, ao programa/campo de férias com a designação: <strong>"${modalContrato.nome}"</strong>.</p>

        <h2>Cláusulas Contratuais</h2>

        <div class="clause">
          <span class="clause-title">Artigo 1.º – Comissão</span><br>
          O Parceiro compromete-se a pagar à HelloCamp uma comissão de <strong>${comissaoText}% (iva não incluído)</strong> sobre cada reserva efetuada através da plataforma, nos termos definidos no presente contrato ou em acordo complementar celebrado entre as partes. A comissão é calculada sobre o valor efetivamente pago pelo cliente relativamente à atividade reservada, incluindo serviços adicionais contratados. A comissão torna-se devida após a confirmação da reserva. O Parceiro deverá enviar ao cliente a confirmação da reserva e assegurar a prestação dos serviços contratados. Caso uma reserva não possa ser realizada por motivos justificados, o Parceiro deverá informar a HelloCamp com a maior brevidade possível.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 2.º – Condições de Pagamento</span><br>
          As comissões devidas à HelloCamp serão faturadas de acordo com o modelo de pagamento acordado. O Parceiro compromete-se a liquidar as faturas emitidas pela HelloCamp dentro dos prazos nelas indicados. Os valores acordados não incluem IVA ou outros impostos legalmente aplicáveis.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 3.º – Obrigações do Parceiro</span><br>
          O Parceiro compromete-se a fornecer à HelloCamp todas as informações necessárias à divulgação das suas atividades. O Parceiro garante que possui todos os direitos necessários sobre os conteúdos disponibilizados (direitos de autor e de imagem). A HelloCamp poderá utilizar os conteúdos fornecidos para promoção. Os preços divulgados na plataforma não poderão ser superiores aos preços praticados pelo Parceiro para reservas diretas. O Parceiro compromete-se a informar imediatamente a HelloCamp de alterações de atividades, preços ou condições.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 4.º – Duração e Renovação</span><br>
          O presente contrato produz efeitos a partir da data da sua assinatura por ambas as partes e mantém-se válido até ao final do respetivo ano civil. O contrato será automaticamente renovado por períodos sucessivos de um ano, salvo denúncia por qualquer das partes com aviso prévio de 30 dias.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 5.º e 6.º – Separabilidade e Alterações</span><br>
          A eventual invalidade de qualquer disposição não prejudica a validade das restantes cláusulas. Quaisquer alterações a este contrato deverão constar no Anexo 4 para produzirem efeitos.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 7.º – Limitação de Responsabilidade e Seguros</span><br>
          A HelloCamp atua exclusivamente como plataforma intermediária de reservas e não assume qualquer responsabilidade civil, criminal ou contratual por eventuais acidentes, danos ou disputas. O Parceiro é o único e exclusivo responsável pela prestação dos serviços e pela segurança dos participantes, garantindo que possui todos os seguros obrigatórios por lei (incluindo responsabilidade civil e acidentes pessoais), licenças e certificações exigidas para o exercício da sua atividade.
        </div>

        <div class="page-break"></div>

        <h2>Anexos e Condições Operacionais Acordadas</h2>

        <div class="clause">
          <span class="clause-title">Anexo 1 – Procedimento de Reserva Acordado</span><br>
          ${anexo1Text}
        </div>

        <div class="clause">
          <span class="clause-title">Anexo 2 – Pagamento e Comissão</span><br>
          O Parceiro autoriza a HelloCamp a receber um depósito durante o processo de reserva efetuado através da plataforma Stripe. O valor do depósito corresponde, regra geral, à comissão devida à HelloCamp pela reserva efetuada, acrescida de IVA. Modalidade escolhida: <br>
          ${anexo2Text}
        </div>

        <div class="clause">
          <span class="clause-title">Anexo 3 – Política de Cancelamento e Reembolso</span><br>
          A opção selecionada ditará as regras de reembolso para os pais na plataforma. A comissão devida à HelloCamp será sempre ajustada proporcionalmente ao montante que o Parceiro retiver do cliente em caso de desistência. Modalidade escolhida: <br>
          ${anexo3Text}
        </div>

        <div class="clause">
          <span class="clause-title">Anexo 4 – Acordos Extraordinários</span><br>
          O Parceiro declarou e a HelloCamp validou as seguintes alterações ou exceções ao contrato-modelo:<br>
          <i>${dados.acordosComplementares || 'Nenhuma cláusula de exceção preenchida pelo parceiro. O contrato-modelo aplica-se na sua totalidade.'}</i>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-title">Pela HelloCamp</div>
            <div class="sig-name" style="font-family: 'Times New Roman', serif;">Administração HelloCamp</div>
            <div class="sig-details">Data: ${dataContrato}</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">Pelo Parceiro</div>
            <div class="sig-name">${dados.assinaturaNome}</div>
            <div class="sig-details">Cargo: ${dados.assinaturaCargo}</div>
            <div class="sig-details">Data da Assinatura: ${dataContrato}</div>
            
            <div class="stamp">
              <strong>Declaração de Vinculação Aceite:</strong> "Declaro ter lido e aceite os termos. Confirmo possuir poderes legais para vincular a entidade supra identificada através desta assinatura digital."<br><br>
              <strong>Registo Digital:</strong><br>
              IP/Método: ${dados.ipAssinatura}<br>
              Timestamp: ${dados.dataSubmissao}<br>
              ID Contrato Sistema: ${modalContrato.id}
            </div>
          </div>
        </div>

      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const tabs = ['Pendente de Revisão', 'Aprovado', 'Rejeitado', 'Todos'];
  const contratosFiltrados = contratos.filter(c => filtroStatus === 'Todos' || c.status_aprovacao === filtroStatus);

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold animate-pulse">A carregar contratos...</div>;

  return (
    <div className="max-w-7xl mx-auto font-sans">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight m-0">Gestão de Contratos</h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Plataforma B2B HelloCamp</p>
        </div>
      </div>

      {/* TABS COMPACTAS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => {
          const count = contratos.filter(c => tab === 'Todos' ? true : c.status_aprovacao === tab).length;
          return (
            <button 
              key={tab} onClick={() => setFiltroStatus(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${filtroStatus === tab ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
            >
              {tab} <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${filtroStatus === tab ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* TABELA COMPACTA */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Campo</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Entidade</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Estado</th>
              <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contratosFiltrados.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-bold text-sm">Sem contratos nesta categoria.</td></tr>
            ) : contratosFiltrados.map(c => {
              const dados = c.contrato_dados || {};
              let statusColor = "bg-gray-100 text-gray-600";
              if (c.status_aprovacao === 'Aprovado') statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
              if (c.status_aprovacao === 'Rejeitado') statusColor = "bg-red-100 text-red-800 border-red-200";
              if (c.status_aprovacao === 'Pendente de Revisão') statusColor = "bg-amber-100 text-amber-800 border-amber-200";

              return (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-sm text-gray-900 truncate max-w-[250px]">{c.nome}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {c.id.substring(0,8)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{dados.empresaNome || 'N/D'}</div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{dados.nif || '---'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${statusColor}`}>
                      {c.status_aprovacao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => abrirModal(c)} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm">
                      Detalhes
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL COMPACTO E ELEGANTE */}
      {modalContrato && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            
            {/* CABEÇALHO */}
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  {modalContrato.nome}
                  {isEditing && <span className="bg-amber-400 text-amber-950 text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded-md">Edição</span>}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleImprimirPDF} className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-white px-3 py-1.5 rounded-lg border border-gray-200 transition-colors shadow-sm mr-2 hidden sm:block">
                  PDF Formal
                </button>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
                    Editar
                  </button>
                )}
                <button onClick={() => setModalContrato(null)} className="text-gray-400 hover:text-gray-900 bg-white border border-gray-200 w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors">&times;</button>
              </div>
            </div>
            
            {/* CORPO DO MODAL (Grelha mais apertada) */}
            <div className="p-5 overflow-y-auto flex-1 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* COLUNA ESQUERDA: Dados Entidade */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Dados Fiscais & Contactos</span>
                    {isEditing ? (
                      <div className="space-y-3">
                        <div><label className={labelClass}>Empresa</label><input className={inputClass} value={editForm.empresaNome || ''} onChange={e => setEditForm({...editForm, empresaNome: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className={labelClass}>NIF</label><input className={inputClass} value={editForm.nif || ''} onChange={e => setEditForm({...editForm, nif: e.target.value})} /></div>
                          <div><label className={labelClass}>Telefone</label><input className={inputClass} value={editForm.telefone || ''} onChange={e => setEditForm({...editForm, telefone: e.target.value})} /></div>
                        </div>
                        <div><label className={labelClass}>E-mail Reservas</label><input className={inputClass} value={editForm.emailReservas || ''} onChange={e => setEditForm({...editForm, emailReservas: e.target.value})} /></div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-gray-100 pb-1"><strong className="text-gray-600">Empresa</strong><span className="font-medium text-right ml-4">{modalContrato.contrato_dados?.empresaNome}</span></div>
                        <div className="flex justify-between border-b border-gray-100 pb-1"><strong className="text-gray-600">NIF</strong><span className="font-mono text-gray-500 text-right ml-4">{modalContrato.contrato_dados?.nif}</span></div>
                        <div className="flex justify-between border-b border-gray-100 pb-1"><strong className="text-gray-600">Contacto</strong><span className="font-medium text-right ml-4">{modalContrato.contrato_dados?.pessoaContacto} ({modalContrato.contrato_dados?.telefone})</span></div>
                        <div className="flex justify-between border-b border-gray-100 pb-1"><strong className="text-gray-600">E-mail Reservas</strong><span className="font-bold text-emerald-600 text-right ml-4 break-all">{modalContrato.contrato_dados?.emailReservas}</span></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Assinatura */}
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                    <span className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Assinatura Digital</span>
                    <p className="font-serif text-xl font-black italic text-emerald-950 mb-1">{modalContrato.contrato_dados?.assinaturaNome}</p>
                    <p className="text-[10px] text-emerald-800 font-mono m-0">Timestamp: {modalContrato.contrato_dados?.dataSubmissao ? new Date(modalContrato.contrato_dados?.dataSubmissao).toLocaleString('pt-PT') : 'N/D'}</p>
                  </div>
                </div>

                {/* COLUNA DIREITA: Condições Financeiras */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <span className="block text-[10px] font-black text-blue-800 uppercase tracking-widest mb-3">Condições Operacionais</span>
                  
                  <div className="space-y-3">
                    <div className={`${isEditing ? 'bg-white p-3 rounded-lg border border-blue-200' : 'flex justify-between items-center border-b border-blue-200/50 pb-2'}`}>
                      <strong className={`${isEditing ? labelClass : 'text-xs text-blue-900'}`}>Comissão Base (%)</strong>
                      {isEditing ? (
                        <input type="number" step="0.1" className={inputClass} value={editComissao} onChange={e => setEditComissao(Number(e.target.value))} />
                      ) : (
                        <span className="text-lg font-black text-blue-700">{modalContrato.taxa_comissao || 12}%</span>
                      )}
                    </div>

                    <div className={`${isEditing ? 'bg-white p-3 rounded-lg border border-blue-200 mt-2 space-y-3' : 'space-y-2 text-xs'}`}>
                      {isEditing ? (
                        <>
                          <div><label className={labelClass}>Reserva</label><select className={selectClass} value={editForm.modalidadeReserva || ''} onChange={e => setEditForm({...editForm, modalidadeReserva: e.target.value})}><option value="direta">Direta</option><option value="email">Sob Consulta</option></select></div>
                          <div><label className={labelClass}>Pagamento</label><select className={selectClass} value={editForm.tipoPagamento || ''} onChange={e => setEditForm({...editForm, tipoPagamento: e.target.value})}><option value="100_total">100% no Ato</option><option value="50_sinal">Sinal 50%</option></select></div>
                          <div><label className={labelClass}>Cancelamento</label><select className={selectClass} value={editForm.politicaCancelamento || ''} onChange={e => setEditForm({...editForm, politicaCancelamento: e.target.value})}><option value="Flexível (Reembolso a 100% até 7 dias antes)">Flexível (7 dias)</option><option value="Moderada (Reembolso a 50% até 15 dias antes)">Moderada (15 dias)</option><option value="Estrita (Sem reembolso após reserva)">Estrita</option></select></div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between pb-1"><strong className="text-blue-900">Modelo</strong><span className="font-bold text-blue-800 text-right">{modalContrato.contrato_dados?.modalidadeReserva === 'direta' ? 'Reserva Direta' : 'Sob Consulta'}</span></div>
                          <div className="flex justify-between pb-1"><strong className="text-blue-900">Pagamento</strong><span className="font-bold text-blue-800 text-right">{modalContrato.contrato_dados?.tipoPagamento === '100_total' ? '100% Imediato' : 'Sinal 50%'}</span></div>
                          <div className="pt-1"><strong className="block text-blue-900 mb-1">Pol. Cancelamento:</strong><p className="text-[10px] text-blue-800 leading-tight bg-white p-2 rounded border border-blue-100 m-0">{modalContrato.contrato_dados?.politicaCancelamento}</p></div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bloco de Acordos Complementares (Se aplicável) - Só visível à direita */}
                {isEditing && (
                   <div className="bg-white p-4 rounded-lg border border-blue-100 col-span-1 lg:col-span-2">
                     <label className={labelClass}>Acordos Complementares / Exceções:</label>
                     <textarea 
                       className={textareaClass} 
                       rows={3} 
                       value={editForm.acordosComplementares || ''} 
                       onChange={e => setEditForm({...editForm, acordosComplementares: e.target.value})}
                       placeholder="Nenhuma cláusula de exceção definida."
                     />
                   </div>
                )}
              </div>
            </div>

            {/* RODAPÉ E ACÕES */}
            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-3 justify-between items-center flex-shrink-0">
              <div>
                {!isEditing && modalContrato.status_aprovacao !== 'Pendente de Revisão' && (
                  <button onClick={() => handleAcaoContrato(modalContrato.id, 'Pendente de Revisão')} className="text-xs font-bold text-gray-500 hover:text-gray-800 underline">Reverter p/ Pendente</button>
                )}
              </div>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="bg-white border border-gray-300 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs hover:bg-gray-100 transition-colors">Cancelar</button>
                    <button onClick={handleGuardarEdicao} disabled={savingEdit} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">Guardar</button>
                  </>
                ) : (
                  <>
                    {modalContrato.status_aprovacao !== 'Rejeitado' && (
                      <button onClick={() => handleAcaoContrato(modalContrato.id, 'Rejeitado')} className="bg-white border border-red-200 text-red-600 font-bold px-4 py-2 rounded-lg text-xs hover:bg-red-50 transition-colors">Rejeitar</button>
                    )}
                    {modalContrato.status_aprovacao !== 'Aprovado' && (
                      <button onClick={() => handleAcaoContrato(modalContrato.id, 'Aprovado')} className="bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm hover:bg-emerald-700 transition-colors">Aprovar Parceiro</button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
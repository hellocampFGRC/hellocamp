"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function GestaoContratosHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalPerfil, setModalPerfil] = useState<any>(null);
  
  const [filtroStatus, setFiltroStatus] = useState<string>('Pendente de Revisão');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editComissao, setEditComissao] = useState<number>(12);
  const [editBaseComissao, setEditBaseComissao] = useState<string>('total');
  const [savingEdit, setSavingEdit] = useState(false);

  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block";
  const inputClass = "w-full py-1.5 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:border-gray-800 transition-all shadow-sm";
  const selectClass = "w-full py-1.5 px-3 pr-8 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:border-gray-800 transition-all shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[position:right_1rem_center] bg-no-repeat";
  const textareaClass = "w-full p-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:border-gray-800 focus:ring-1 focus:ring-gray-800 transition-all shadow-sm resize-y";

  const fetchContratos = async () => {
    // ⚠️ ALTERAÇÃO: Lê estritamente os utilizadores com a role 'organizador'
    const { data, error } = await supabase
      .from('perfis')
      .select('id, empresa_nome, nif_empresa, email, telefone, contrato_dados, status_contrato, modalidade_reserva, link_externo_reserva, created_at, taxa_comissao, base_comissao')
      .eq('role', 'organizador')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Erro ao ler perfis:", error);
      alert("Erro ao ler a base de dados: " + error.message);
    }

    const organizadores = data || [];
    setContratos(organizadores);
    
    // Se não existirem parceiros pendentes de aprovação real (que já assinaram), mostra todos
    if (organizadores.length > 0 && !organizadores.some(c => c.status_contrato === 'Pendente de Revisão' && c.contrato_dados)) {
      setFiltroStatus('Todos');
    }
    setLoading(false);
  };

  useEffect(() => { fetchContratos(); }, []);

  const abrirModal = (perfil: any) => {
    setModalPerfil(perfil);
    const dadosContrato = perfil.contrato_dados || {};
    
    setEditForm({
      ...dadosContrato,
      modalidadeReserva: perfil.modalidade_reserva || dadosContrato.modalidadeReserva || 'direta',
      linkExternoReserva: perfil.link_externo_reserva || dadosContrato.linkExternoReserva || '',
      tipoPagamento: dadosContrato.tipoPagamento || '100_total',
      politicaCancelamento: dadosContrato.politicaCancelamento || 'Moderada (Reembolso a 50% até 15 dias antes)'
    });
    setEditComissao(perfil.taxa_comissao !== null && perfil.taxa_comissao !== undefined ? perfil.taxa_comissao : 12);
    setEditBaseComissao(perfil.base_comissao || 'total');
    setIsEditing(false);
  };

  const handleAcaoContrato = async (id: string, novoStatus: string) => {
    const isApproved = novoStatus === 'Aprovado';
    
    const { data: updatedPerfil, error: perfilError } = await supabase
      .from('perfis')
      .update({ 
        status_contrato: novoStatus,
        parceiro_verificado: isApproved 
      })
      .eq('id', id)
      .select();

    if (perfilError) {
      alert("Erro ao atualizar parceiro: " + perfilError.message);
      return;
    }
    
    if (!updatedPerfil || updatedPerfil.length === 0) {
       alert("Erro RLS: Não tem permissão de Superadmin para alterar este perfil. Fale com a equipa técnica para ativar as políticas SQL.");
       return;
    }

    const { error: camposError } = await supabase
      .from('campos')
      .update({
        status_aprovacao: novoStatus,
        ativo: isApproved,
        contrato_parceiro_url: isApproved ? `https://hellocamp.pt/contratos/global_${id}.pdf` : null
      })
      .eq('organizador_id', id);

    if (camposError) {
      alert("Parceiro atualizado, mas erro ao propagar para os campos: " + camposError.message);
    } else {
      try {
        const dados = modalPerfil?.contrato_dados || {};
        if (dados.emailContacto || modalPerfil?.email) {
          await fetch('/api/notificacoes/status-contrato', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              parceiroEmail: dados.emailContacto || modalPerfil?.email, 
              nomeCampo: "Contrato Global B2B",
              status: novoStatus,
              lang: lang
            })
          });
        }
      } catch (err) {
        console.error("Erro ao notificar parceiro da alteração de estado:", err);
      }
      alert(`Sucesso! O Parceiro está agora ${novoStatus}. Todos os campos associados foram atualizados.`);
      setModalPerfil((prev: any) => ({ ...prev, status_contrato: novoStatus }));
      fetchContratos();
    }
  };

  const handleGuardarEdicao = async () => {
    setSavingEdit(true);
    const novoJsonContrato = { ...modalPerfil.contrato_dados, ...editForm };

    const { data: updatedPerfil, error: perfilError } = await supabase
      .from('perfis')
      .update({
         contrato_dados: novoJsonContrato,
         taxa_comissao: editComissao,
         base_comissao: editBaseComissao,
         modalidade_reserva: editForm.modalidadeReserva,
         link_externo_reserva: editForm.modalidadeReserva === 'link_externo' ? editForm.linkExternoReserva : null
      })
      .eq('id', modalPerfil.id)
      .select();

    if (perfilError) {
      alert("Erro ao guardar edição no parceiro: " + perfilError.message);
      setSavingEdit(false);
      return;
    }
    
    if (!updatedPerfil || updatedPerfil.length === 0) {
       alert("Erro RLS: Não tem permissão para editar este perfil.");
       setSavingEdit(false);
       return;
    }

    await supabase
      .from('campos')
      .update({ 
        contrato_dados: novoJsonContrato,
        taxa_comissao: editComissao,
        base_comissao: editBaseComissao,
        modalidade_reserva: editForm.modalidadeReserva,
        link_externo_reserva: editForm.modalidadeReserva === 'link_externo' ? editForm.linkExternoReserva : null,
        tipo_pagamento: editForm.modalidadeReserva !== 'link_externo' ? editForm.tipoPagamento : null,
        politica_cancelamento: editForm.modalidadeReserva !== 'link_externo' ? editForm.politicaCancelamento : null
      })
      .eq('organizador_id', modalPerfil.id);

    try {
      const emailAvisar = editForm.emailContacto || modalPerfil?.email;
      if (emailAvisar) {
        await fetch('/api/notificacoes/contrato-editado', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            parceiroEmail: emailAvisar, 
            nomeCampo: "Contrato Global B2B",
            status: 'Editado',
            lang: lang
          })
        });
      }
    } catch (err) {
      console.error("Erro ao notificar parceiro da edição:", err);
    }

    alert("Dados atualizados com sucesso e propagados para os respetivos campos!");
    setModalPerfil({ ...modalPerfil, contrato_dados: novoJsonContrato, taxa_comissao: editComissao, base_comissao: editBaseComissao, modalidade_reserva: editForm.modalidadeReserva, link_externo_reserva: editForm.linkExternoReserva });
    setIsEditing(false);
    setSavingEdit(false);
    fetchContratos();
  };

  const handleImprimirPDF = () => {
    if (!modalPerfil || !modalPerfil.contrato_dados) {
      alert("Este parceiro ainda não preencheu/assinou o contrato, não é possível gerar PDF.");
      return;
    }
    
    const dados = modalPerfil.contrato_dados;
    const comissaoText = modalPerfil.taxa_comissao !== null && modalPerfil.taxa_comissao !== undefined ? modalPerfil.taxa_comissao : 12;
    
    let baseComissaoText = "Sobre Valor Total (Programa + Extras)";
    if (modalPerfil.base_comissao === "apenas_programa") baseComissaoText = "Apenas sobre Valor Base do Programa";
    if (modalPerfil.base_comissao === "sem_comissao") baseComissaoText = "Isento de Comissão (0%)";

    const dataContrato = dados.dataSubmissao ? new Date(dados.dataSubmissao).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('pt-PT');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("O seu navegador bloqueou a abertura da janela (Pop-up). Por favor, permita para gerar o PDF.");
      return;
    }

    let anexo1Text = "";
    if (dados.modalidadeReserva === 'direta') {
        anexo1Text = "<strong>Reserva Direta no Checkout (Recomendado):</strong> As reservas efetuadas através da plataforma HelloCamp serão registadas diretamente no sistema de reservas do Parceiro. Nesta modalidade, a HelloCamp terá direito à comissão acordada sobre cada reserva concluída. O formulário de reserva será configurado de acordo com as necessidades do Parceiro, recolhendo as informações necessárias para a correta gestão das inscrições. O Parceiro compromete-se a manter atualizadas as disponibilidades, preços e demais informações relevantes das atividades disponibilizadas através da plataforma.";
    } else if (dados.modalidadeReserva === 'email') {
        anexo1Text = "<strong>Comunicação por E-mail (Reserva Sob Consulta):</strong> A HelloCamp enviará ao Parceiro, por correio eletrónico, todas as informações necessárias para a gestão da reserva, incluindo os dados do participante, os dados do responsável pela reserva e os detalhes da atividade reservada. O Parceiro dispõe de 2 (dois) dias úteis para comunicar à HelloCamp a rejeição de uma reserva por motivo devidamente justificado. Na ausência de resposta dentro deste prazo, a reserva considerar-se-á aceite, sendo aplicável a comissão prevista no contrato.";
    } else if (dados.modalidadeReserva === 'link_externo') {
        anexo1Text = `<strong>Formulário ou Link Externo:</strong> O tráfego gerado pela HelloCamp é redirecionado para um link externo. Para garantir transparência e evitar omissões, antes de reencaminhar o cliente, a HelloCamp recolhe a intenção de reserva (Lead: Nome, Email e Telefone do potencial cliente). Estes dados da "Lead" são enviados automaticamente para o Parceiro com conhecimento (em CC) à HelloCamp. O Parceiro compromete-se sob compromisso de honra a ser verdadeiro na comunicação mensal sobre quais destes clientes efetivamente finalizaram a inscrição do seu lado.<br/><br/>URL Oficial: <span style="font-family: monospace; color: blue;">${dados.linkExternoReserva || 'N/A'}</span>`;
    }

    let anexo2Text = "";
    let anexo3Text = "";

    if (dados.modalidadeReserva !== 'link_externo') {
        anexo2Text = dados.tipoPagamento === '100_total'
          ? "<strong>100% Pago no Ato da Reserva (Pagamento Imediato):</strong> O cliente liquida a totalidade do valor do programa para assegurar a vaga de imediato."
          : "<strong>Sinal de 50% Agora + 50% 1 Semana Antes:</strong> A plataforma debitará automaticamente a segunda metade do cartão do cliente 7 dias antes do início do programa.";

        if (dados.politicaCancelamento?.includes('Flexível')) {
          anexo3Text = "<strong>Flexível (Reembolso a 100% até 7 dias antes):</strong> A HelloCamp não cobrará qualquer comissão sobre reservas canceladas pelo cliente. O Parceiro compromete-se a não aplicar quaisquer custos de cancelamento ao cliente, desde que o pedido seja comunicado até 7 (sete) dias antes do início da atividade. Os montantes pagos deverão ser reembolsados no prazo máximo de 30 dias. Cancelamentos após este prazo não conferem direito a reembolso, sendo a comissão integral devida à HelloCamp.";
        } else if (dados.politicaCancelamento?.includes('Moderada')) {
          anexo3Text = "<strong>Moderada (Reembolso a 50% até 15 dias antes):</strong> A comissão da HelloCamp é considerada devida após a confirmação. Em caso de cancelamento até 15 dias antes do início, o cliente recebe 50% do valor pago. Nestas situações, a comissão da HelloCamp será reduzida proporcionalmente ao valor efetivamente retido pelo Parceiro a título de cancelamento. Cancelamentos após este prazo não conferem direito a reembolso.";
        } else {
          anexo3Text = "<strong>Estrita (Sem reembolso após reserva):</strong> As reservas efetuadas são finais e não reembolsáveis em caso de cancelamento por iniciativa do cliente. A comissão da HelloCamp é devida na sua totalidade independentemente de o cliente comparecer ou não à atividade, uma vez que a receita do Parceiro fica inteiramente garantida.";
        }
    } else {
        anexo2Text = "<strong>Gestão Independente:</strong> O Parceiro fará a cobrança e faturação de forma independente, fora da plataforma HelloCamp. A comissão acordada será devida pelas intenções de reserva (leads) encaminhadas através da plataforma e convertidas em clientes efetivos pelo Parceiro, conforme apuramento mensal efetuado entre as partes.";
        anexo3Text = "<strong>Política Externa:</strong> As opções selecionadas ditarão as regras de reembolso para os pais na plataforma externa. A comissão devida à HelloCamp será sempre ajustada proporcionalmente ao montante que o Parceiro retiver do cliente em caso de desistência.";
    }

    const html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <title>Contrato Global de Intermediação e Serviços - ${dados.empresaNome || modalPerfil.empresa_nome}</title>
        <style>
          body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #000; max-width: 850px; margin: 0 auto; padding: 40px 30px; line-height: 1.6; font-size: 13px; text-align: justify; }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; font-weight: 900; border-bottom: 2px solid #000; padding-bottom: 10px; display: inline-block; }
          .header p { font-size: 13px; color: #555; margin-top: 10px; font-style: italic; }
          
          h2 { font-size: 16px; text-transform: uppercase; font-weight: 900; margin-top: 40px; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 5px; }
          h3 { font-size: 14px; font-weight: bold; margin-top: 25px; margin-bottom: 10px; }
          
          .party-block { display: flex; justify-content: space-between; gap: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 30px; border-radius: 8px; }
          .party-box { width: 48%; }
          .party-box p { margin: 5px 0; }
          
          .clause { margin-bottom: 20px; }
          .clause-title { font-weight: bold; }
          
          .annex-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 20px; border-radius: 6px; }
          .annex-title { font-weight: 900; text-transform: uppercase; margin-bottom: 10px; font-size: 13px; border-left: 3px solid #000; padding-left: 10px; }
          
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; border-top: 2px solid #000; padding-top: 30px; }
          .sig-box { width: 45%; }
          .sig-title { font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
          .sig-name { font-size: 20px; font-family: "Times New Roman", Times, serif; font-style: italic; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px; display: inline-block; min-width: 100%; }
          .sig-details { font-size: 12px; }
          
          .stamp { font-size: 10px; font-family: monospace; color: #475569; margin-top: 20px; padding: 15px; border: 1px dashed #cbd5e1; background: #f1f5f9; border-radius: 6px; }
          
          @media print { 
            body { padding: 0; max-width: 100%; } 
            .print-btn { display: none; } 
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="print-btn" style="text-align: center; margin-bottom: 30px;">
          <button onclick="window.print()" style="padding: 12px 30px; background: #0f172a; color: #fff; font-weight: bold; border: none; cursor: pointer; font-size: 16px; border-radius: 8px;">🖨️ Guardar PDF / Imprimir Contrato Completo</button>
        </div>

        <div class="header">
          <h1>Contrato Global de Intermediação e Serviços</h1>
          <p>Este acordo é aplicável a todas as atividades presentes e futuras na plataforma HelloCamp.</p>
        </div>
        
        <div class="party-block">
          <div class="party-box">
             <h3 style="margin-top: 0; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Primeira Outorgante</h3>
             <p><strong>HelloCamp Portugal</strong></p>
             <p>Website: www.hellocamp.pt</p>
             <p>E-mail: info@hellocamp.pt</p>
          </div>
          <div class="party-box">
             <h3 style="margin-top: 0; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Segunda Outorgante (Parceiro)</h3>
             <p><strong>${dados.empresaNome || modalPerfil.empresa_nome}</strong></p>
             <p><strong>NIF:</strong> ${dados.nif || modalPerfil.nif_empresa}</p>
             <p><strong>Pessoa de Contacto:</strong> ${dados.pessoaContacto || 'N/A'} (${dados.telefone || modalPerfil.telefone})</p>
             <p><strong>E-mail:</strong> ${dados.emailContacto || modalPerfil.email}</p>
          </div>
        </div>

        <h2>Cláusulas Contratuais Gerais</h2>

        <div class="clause">
          <span class="clause-title">Artigo 1.º – Comissão:</span> O Parceiro compromete-se a pagar à HelloCamp uma comissão (IVA incluído) sobre cada reserva efetuada através da plataforma, nos termos definidos no Anexo 2 deste documento. A comissão é calculada sobre o valor efetivamente pago pelo cliente relativamente à atividade reservada, incluindo serviços adicionais contratados através da plataforma ou de leads encaminhadas. Em caso de cancelamento por iniciativa do cliente ou desistência, aplicar-se-ão as condições previstas no Anexo 3.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 2.º – Condições de Pagamento e Obrigações do Parceiro:</span> As comissões devidas à HelloCamp serão faturadas de acordo com o modelo de pagamento acordado. O Parceiro compromete-se a liquidar as faturas emitidas pela HelloCamp dentro dos prazos nelas indicados. O Parceiro compromete-se a fornecer à HelloCamp todas as informações necessárias à divulgação das suas atividades e garante que possui todos os direitos necessários sobre os conteúdos disponibilizados. Os preços divulgados na plataforma HelloCamp não poderão ser superiores aos preços praticados pelo Parceiro para reservas diretas da mesma atividade.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 3.º – Limitação de Responsabilidade e Seguros:</span> A HelloCamp atua exclusivamente como plataforma intermediária e motor de busca. A HelloCamp não assume qualquer responsabilidade civil, criminal ou contratual por eventuais acidentes, danos, incidentes ou disputas que ocorram durante a realização das atividades. O Parceiro é o único e exclusivo responsável pela prestação dos serviços e pela segurança dos participantes, garantindo que possui todos os seguros obrigatórios por lei (incluindo responsabilidade civil e acidentes pessoais), licenças e certificações exigidas para o exercício da sua atividade.
        </div>
        
        <div class="clause">
          <span class="clause-title">Artigo 4.º – Duração e Renovação:</span> O presente contrato produz efeitos a partir da data da sua assinatura por ambas as partes. O contrato mantém-se válido até ao final do respetivo ano civil. O contrato será automaticamente renovado por períodos sucessivos de um ano, salvo denúncia por qualquer das partes.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 5.º – Validade da Assinatura e Convenção de Prova:</span> As partes reconhecem expressamente a validade e a força vinculativa da aceitação do presente contrato através de meios eletrónicos. Ao abrigo da liberdade de estipulação probatória, as partes convencionam que os registos informáticos recolhidos pela HelloCamp (incluindo o endereço IP, dados de sessão, nome digitado e timestamp) constituem meio de prova plenamente válido e suficiente para atestar a autoria, a integridade e a aceitação irrevogável das presentes cláusulas operacionais e financeiras, renunciando o Parceiro a invocar a nulidade ou ineficácia do contrato com fundamento na ausência de assinatura autógrafa ou de assinatura eletrónica qualificada (Chave Móvel Digital / Cartão de Cidadão).
        </div>

        <div class="page-break"></div>

        <h2>Condições e Anexos Operacionais Específicos</h2>

        <div class="annex-box">
          <div class="annex-title">Anexo 1 – Procedimento de Reserva e Operação</div>
          ${anexo1Text}
        </div>

        <div class="annex-box">
          <div class="annex-title">Anexo 2 – Faturação e Comissão</div>
          <p style="margin-top:0;"><strong>Taxa de Comissão:</strong> ${comissaoText}% (IVA incluído)</p>
          <p><strong>Base de Incidência:</strong> ${baseComissaoText}</p>
          <p style="margin-bottom:0;">${anexo2Text}</p>
        </div>

        <div class="annex-box">
          <div class="annex-title">Anexo 3 – Política de Cancelamento e Reembolso</div>
          ${anexo3Text}
        </div>

        <div class="annex-box">
          <div class="annex-title">Anexo 4 – Acordos Extraordinários</div>
          <i>${dados.acordosComplementares || 'Nenhuma cláusula de exceção definida. O contrato-modelo aplica-se na sua totalidade sem alterações complementares pré-acordadas.'}</i>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-title">Pela HelloCamp</div>
            <div class="sig-name">Administração HelloCamp</div>
            <div class="sig-details">Data: ${dataContrato}</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">Pelo Parceiro</div>
            <div class="sig-name">${dados.assinaturaNome || '____________________'}</div>
            <div class="sig-details">Cargo: ${dados.assinaturaCargo || '____________________'}</div>
            <div class="sig-details">Data da Assinatura: ${dataContrato}</div>
            
            <div class="stamp">
              <strong>Registo de Aceitação Legal e Digital</strong><br><br>
              "Declaro ter lido e aceite os Termos Operacionais apresentados e as Cláusulas do Contrato. Confirmo possuir poderes legais para vincular a entidade parceira identificada a todas as atividades na plataforma através desta assinatura digital legalmente vinculativa."<br><br>
              <strong>Plataforma Segura HelloCamp</strong><br>
              Endereço IP de Assinatura: ${dados.ipAssinatura || 'Registado pelo Servidor'}<br>
              Timestamp: ${dados.dataSubmissao || new Date().toISOString()}<br>
              ID Perfil: ${modalPerfil.id}
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

  // TABS Atualizadas: Em vez de ler 'Pendente de Revisão', vai ler o status visual
  const tabs = ['Por Assinar', 'Pendentes de Revisão', 'Aprovado', 'Rejeitado', 'Todos'];
  
  const contratosFiltrados = contratos.filter(c => {
    // Lógica para determinar o status real do parceiro
    let statusReal = c.status_contrato;
    if (!c.contrato_dados) {
      statusReal = 'Por Assinar'; // Se não há contrato preenchido
    } else if (!statusReal || statusReal === 'Pendente') {
      statusReal = 'Pendentes de Revisão';
    }

    if (filtroStatus === 'Todos') return true;
    if (filtroStatus === 'Por Assinar') return statusReal === 'Por Assinar';
    if (filtroStatus === 'Pendentes de Revisão') return statusReal === 'Pendente de Revisão' || statusReal === 'Pendentes de Revisão';
    return c.status_contrato === filtroStatus && c.contrato_dados;
  });

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold animate-pulse">A carregar Contratos Globais de Parceiros...</div>;

  return (
    <div className="max-w-7xl mx-auto font-sans pb-16">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight m-0">Gestão de Contratos de Parceiros</h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Quartel General HelloCamp</p>
        </div>
      </div>

      {/* TABS COMPACTAS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => {
          const count = contratos.filter(c => {
            let statusReal = c.status_contrato;
            if (!c.contrato_dados) statusReal = 'Por Assinar';
            else if (!statusReal || statusReal === 'Pendente') statusReal = 'Pendentes de Revisão';
            
            if (tab === 'Todos') return true;
            if (tab === 'Por Assinar') return statusReal === 'Por Assinar';
            if (tab === 'Pendentes de Revisão') return statusReal === 'Pendente de Revisão' || statusReal === 'Pendentes de Revisão';
            return c.status_contrato === tab && c.contrato_dados;
          }).length;

          return (
            <button 
              key={tab} onClick={() => setFiltroStatus(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${filtroStatus === tab ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {tab} <span className={`ml-1.5 px-2 py-0.5 rounded-md text-[10px] ${filtroStatus === tab ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* TABELA DE CONTRATOS GLOBAIS */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Entidade Jurídica</th>
              <th className="px-4 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Contacto / E-mail</th>
              <th className="px-4 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Operação</th>
              <th className="px-4 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status Geral</th>
              <th className="px-4 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contratosFiltrados.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-bold text-sm">Sem contratos encontrados nesta categoria.</td></tr>
            ) : contratosFiltrados.map(c => {
              const dados = c.contrato_dados || {};
              const temContrato = !!c.contrato_dados;
              
              let statusColor = "bg-gray-100 text-gray-600 border-gray-200";
              let statusLabel = "Por Assinar";
              
              if (temContrato) {
                statusLabel = c.status_contrato || 'Pendente de Revisão';
                if (c.status_contrato === 'Aprovado') statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                else if (c.status_contrato === 'Rejeitado') statusColor = "bg-red-100 text-red-800 border-red-200";
                else statusColor = "bg-amber-100 text-amber-800 border-amber-200";
              }

              return (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-black text-sm text-gray-900 truncate max-w-[200px]">{dados.empresaNome || c.empresa_nome || 'N/D'}</div>
                    <div className="text-[10px] font-medium text-gray-500 mt-0.5">NIF: {dados.nif || c.nif_empresa || '---'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{dados.pessoaContacto || c.nome_completo || 'N/A'}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">{dados.emailContacto || c.email}</div>
                  </td>
                  <td className="px-4 py-3">
                     <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 uppercase tracking-wider">
                       {c.modalidade_reserva === 'link_externo' ? 'Externo' : (c.modalidade_reserva === 'email' ? 'Sob Consulta' : (c.modalidade_reserva === 'direta' ? 'Checkout' : 'N/D'))}
                     </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md border shadow-sm ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => abrirModal(c)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm">
                      {temContrato ? 'Rever Contrato' : 'Ver Dados Base'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL COMPACTO E ELEGANTE */}
      {modalPerfil && (
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-gray-200">
            
            {/* CABEÇALHO */}
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-white flex-shrink-0">
              <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 m-0 leading-none">
                  {modalPerfil.contrato_dados?.empresaNome || modalPerfil.empresa_nome}
                  {isEditing && <span className="bg-amber-400 text-amber-950 text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-md ml-2">Modo Edição</span>}
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 m-0">Contrato Global de Parceiro</p>
              </div>
              <div className="flex items-center gap-2">
                {modalPerfil.contrato_dados && (
                  <button onClick={handleImprimirPDF} className="text-xs font-bold text-gray-700 hover:text-black bg-gray-100 px-4 py-2 rounded-lg transition-colors shadow-sm mr-2 hidden sm:block border border-gray-200">
                    Gerar PDF
                  </button>
                )}
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 transition-colors">
                    Editar Termos
                  </button>
                )}
                <button onClick={() => setModalPerfil(null)} className="text-gray-400 hover:text-gray-900 bg-white border border-gray-200 w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-colors">&times;</button>
              </div>
            </div>
            
            {/* CORPO DO MODAL */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {!modalPerfil.contrato_dados && !isEditing ? (
                 <div className="bg-amber-50 border border-amber-200 p-8 rounded-xl text-center">
                    <h3 className="text-amber-900 font-black text-lg mb-2">Parceiro ainda não assinou o contrato</h3>
                    <p className="text-amber-800 text-sm">Este parceiro criou conta mas ainda não preencheu o Acordo Global de Intermediação. Pode editar os termos operacionais antecipadamente clicando em "Editar Termos" acima.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* COLUNA ESQUERDA: Dados Entidade */}
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Dados Fiscais & Contactos</span>
                      {isEditing ? (
                        <div className="space-y-3">
                          <div><label className={labelClass}>Empresa</label><input className={inputClass} value={editForm.empresaNome || ''} onChange={e => setEditForm({...editForm, empresaNome: e.target.value})} /></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className={labelClass}>NIF</label><input className={inputClass} value={editForm.nif || ''} onChange={e => setEditForm({...editForm, nif: e.target.value})} /></div>
                            <div><label className={labelClass}>Telefone</label><input className={inputClass} value={editForm.telefone || ''} onChange={e => setEditForm({...editForm, telefone: e.target.value})} /></div>
                          </div>
                          <div><label className={labelClass}>E-mail Reservas</label><input className={inputClass} value={editForm.emailReservas || ''} onChange={e => setEditForm({...editForm, emailReservas: e.target.value})} /></div>
                        </div>
                      ) : (
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100"><strong className="text-gray-500">Empresa</strong><span className="font-black text-gray-900 text-right ml-4 text-sm">{modalPerfil.contrato_dados?.empresaNome}</span></div>
                          <div className="flex justify-between items-center"><strong className="text-gray-500">NIF</strong><span className="font-mono font-bold text-gray-800 text-right ml-4">{modalPerfil.contrato_dados?.nif}</span></div>
                          <div className="flex justify-between items-center"><strong className="text-gray-500">Contacto Pessoal</strong><span className="font-medium text-gray-800 text-right ml-4">{modalPerfil.contrato_dados?.pessoaContacto} <br/><span className="text-gray-400 font-bold">{modalPerfil.contrato_dados?.telefone}</span></span></div>
                          <div className="flex justify-between items-center"><strong className="text-gray-500">E-mail Operacional</strong><span className="font-bold text-blue-600 text-right ml-4 break-all">{modalPerfil.contrato_dados?.emailReservas || modalPerfil.contrato_dados?.emailContacto || modalPerfil.email}</span></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Assinatura */}
                    {modalPerfil.contrato_dados && (
                      <div className="bg-white border-2 border-emerald-100 p-5 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 text-emerald-50 text-7xl font-serif italic">A</div>
                        <span className="relative block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Assinatura Digital</span>
                        <p className="relative font-serif text-2xl font-black italic text-emerald-950 mb-1">{modalPerfil.contrato_dados?.assinaturaNome}</p>
                        <p className="relative text-xs text-emerald-700 font-bold mb-3">{modalPerfil.contrato_dados?.assinaturaCargo}</p>
                        <p className="relative text-[9px] text-gray-400 font-mono m-0 uppercase tracking-widest">Registado a: {modalPerfil.contrato_dados?.dataSubmissao ? new Date(modalPerfil.contrato_dados?.dataSubmissao).toLocaleString('pt-PT') : 'N/D'}</p>
                      </div>
                    )}
                  </div>

                  {/* COLUNA DIREITA: Condições Financeiras */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Condições Operacionais Acordadas</span>
                    
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg ${isEditing ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-100 flex justify-between items-center'}`}>
                        <strong className={`${isEditing ? labelClass : 'text-xs text-gray-600 uppercase tracking-widest'}`}>Taxa de Comissão (%)</strong>
                        {isEditing ? (
                          <input type="number" step="0.1" className={`${inputClass} font-black text-blue-700 text-lg`} value={editComissao} onChange={e => setEditComissao(Number(e.target.value))} />
                        ) : (
                          <span className="text-xl font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-md border border-blue-100">{modalPerfil.taxa_comissao !== null && modalPerfil.taxa_comissao !== undefined ? modalPerfil.taxa_comissao : 12}%</span>
                        )}
                      </div>
                      
                      {isEditing && (
                        <div className="pt-1">
                           <label className={labelClass}>Base de Incidência</label>
                           <select className={selectClass} value={editBaseComissao} onChange={e => setEditBaseComissao(e.target.value)}>
                             <option value="total">Valor Total (Programa + Extras)</option>
                             <option value="apenas_programa">Apenas sobre o Programa</option>
                             <option value="sem_comissao">Isento (0%)</option>
                           </select>
                        </div>
                      )}

                      <div className={`${isEditing ? 'bg-white p-3 rounded-lg border border-blue-200 mt-2 space-y-3' : 'space-y-3 text-xs pt-2'}`}>
                        {isEditing ? (
                          <>
                            <div>
                              <label className={labelClass}>Modelo de Reserva (Anexo 1)</label>
                              <select className={selectClass} value={editForm.modalidadeReserva || ''} onChange={e => setEditForm({...editForm, modalidadeReserva: e.target.value})}>
                                <option value="direta">Direta / Checkout</option>
                                <option value="email">Sob Consulta (E-mail)</option>
                                <option value="link_externo">Link Externo</option>
                              </select>
                            </div>
                            {editForm.modalidadeReserva === 'link_externo' && (
                              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-1 block">URL do Parceiro</label>
                                <input type="url" className="w-full py-1.5 px-3 bg-white border border-amber-300 rounded text-sm outline-none" value={editForm.linkExternoReserva || ''} onChange={e => setEditForm({...editForm, linkExternoReserva: e.target.value})} placeholder="https://..." />
                              </div>
                            )}
                            {editForm.modalidadeReserva !== 'link_externo' && (
                              <>
                                <div><label className={labelClass}>Fluxo de Pagamento (Anexo 2)</label><select className={selectClass} value={editForm.tipoPagamento || ''} onChange={e => setEditForm({...editForm, tipoPagamento: e.target.value})}><option value="100_total">100% no Ato da Reserva</option><option value="50_sinal">Sinal 50% Agora + Restante Depois</option></select></div>
                                <div><label className={labelClass}>Política de Cancelamento (Anexo 3)</label><select className={selectClass} value={editForm.politicaCancelamento || ''} onChange={e => setEditForm({...editForm, politicaCancelamento: e.target.value})}><option value="Flexível (Reembolso a 100% até 7 dias antes)">Flexível (100% até 7 dias)</option><option value="Moderada (Reembolso a 50% até 15 dias antes)">Moderada (50% até 15 dias)</option><option value="Estrita (Sem reembolso após reserva)">Estrita (Sem Reembolso)</option></select></div>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                              <strong className="text-gray-500 uppercase tracking-wider text-[10px]">Modelo</strong>
                              <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">
                                {modalPerfil.contrato_dados?.modalidadeReserva === 'direta' ? 'Reserva Direta no Checkout' : 
                                 modalPerfil.contrato_dados?.modalidadeReserva === 'link_externo' ? 'Encaminhamento Link Externo' : 'Comunicação por Email'}
                              </span>
                            </div>
                            
                            {modalPerfil.contrato_dados?.modalidadeReserva === 'link_externo' ? (
                              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mt-2">
                                 <strong className="block text-amber-800 text-[10px] uppercase tracking-widest mb-1">URL Oficial de Inscrição</strong>
                                 <a href={modalPerfil.contrato_dados?.linkExternoReserva || modalPerfil.link_externo_reserva} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline break-all">
                                    {modalPerfil.contrato_dados?.linkExternoReserva || modalPerfil.link_externo_reserva}
                                 </a>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2 mt-2">
                                  <strong className="text-gray-500 uppercase tracking-wider text-[10px]">Pagamento</strong>
                                  <span className="font-bold text-gray-900 text-right">{modalPerfil.contrato_dados?.tipoPagamento === '100_total' ? '100% Imediato' : 'Sinal de 50%'}</span>
                                </div>
                                <div className="pt-2">
                                  <strong className="block text-gray-500 uppercase tracking-wider text-[10px] mb-1">Pol. Cancelamento Acordada:</strong>
                                  <p className="text-xs text-gray-700 leading-tight bg-gray-50 p-2 rounded-md border border-gray-100 m-0 font-medium">
                                    {modalPerfil.contrato_dados?.politicaCancelamento || 'Não definida'}
                                  </p>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bloco de Acordos Complementares */}
                  {(isEditing || editForm.acordosComplementares) && (
                     <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm col-span-1 lg:col-span-2">
                       <label className={`${labelClass} text-gray-900`}>Acordos Extraordinários (Anexo 4)</label>
                       {isEditing ? (
                         <textarea 
                           className={`${textareaClass} mt-2`} 
                           rows={3} 
                           value={editForm.acordosComplementares || ''} 
                           onChange={e => setEditForm({...editForm, acordosComplementares: e.target.value})}
                           placeholder="Insira as cláusulas de exceção acordadas com o parceiro."
                         />
                       ) : (
                         <p className="text-sm text-gray-700 italic bg-amber-50 p-3 rounded-lg border border-amber-100 m-0 mt-2">
                           "{editForm.acordosComplementares}"
                         </p>
                       )}
                     </div>
                  )}
                </div>
              )}
            </div>

            {/* RODAPÉ E ACÕES */}
            <div className="px-6 py-5 border-t border-gray-200 bg-white flex flex-wrap gap-3 justify-between items-center flex-shrink-0">
              <div>
                {!isEditing && modalPerfil.status_contrato !== 'Pendente de Revisão' && modalPerfil.contrato_dados && (
                  <button onClick={() => handleAcaoContrato(modalPerfil.id, 'Pendente de Revisão')} className="text-xs font-bold text-gray-400 hover:text-gray-800 underline">Desfazer Aprovação (Reverter)</button>
                )}
              </div>
              
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="bg-white border border-gray-300 text-gray-700 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
                    <button onClick={handleGuardarEdicao} disabled={savingEdit} className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors">Guardar Modificações</button>
                  </>
                ) : (
                  <>
                    {modalPerfil.contrato_dados && modalPerfil.status_contrato !== 'Rejeitado' && (
                      <button onClick={() => handleAcaoContrato(modalPerfil.id, 'Rejeitado')} className="bg-white border border-red-200 text-red-600 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-red-50 transition-colors">Rejeitar Parceiro</button>
                    )}
                    {modalPerfil.contrato_dados && modalPerfil.status_contrato !== 'Aprovado' && (
                      <button onClick={() => handleAcaoContrato(modalPerfil.id, 'Aprovado')} className="bg-emerald-600 text-white font-black px-6 py-2.5 rounded-xl text-sm shadow-md hover:bg-emerald-700 transition-colors tracking-wide">Validar e Aprovar Parceiro</button>
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
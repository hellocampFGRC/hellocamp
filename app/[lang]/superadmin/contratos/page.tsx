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
    // Agora lemos a tabela PERFIS para ver os Contratos Globais de cada parceiro
    const { data, error } = await supabase
      .from('perfis')
      .select('id, empresa_nome, nif_empresa, email, telefone, contrato_dados, status_contrato, modalidade_reserva, link_externo_reserva, created_at, taxa_comissao, base_comissao')
      .not('contrato_dados', 'is', null)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Erro ao ler perfis:", error);
      alert("Erro ao ler a base de dados: " + error.message);
    }

    setContratos(data || []);
    
    // Se não existir nenhum contrato pendente, muda o filtro para "Todos"
    if (data && data.length > 0 && !data.some(c => c.status_contrato === 'Pendente de Revisão')) {
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
    
    // 1. Atualizar o Perfil do Parceiro
    const { error: perfilError } = await supabase
      .from('perfis')
      .update({ 
        status_contrato: novoStatus,
        parceiro_verificado: isApproved 
      })
      .eq('id', id);

    if (perfilError) {
      alert("Erro ao atualizar parceiro: " + perfilError.message);
      return;
    }

    // 2. Propagar a decisão em cascata para TODOS os campos deste parceiro
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
    
    const novoJsonContrato = {
      ...modalPerfil.contrato_dados,
      ...editForm,
    };

    // 1. Atualizar no Perfil (Fonte da Verdade Global)
    const { error: perfilError } = await supabase
      .from('perfis')
      .update({
         contrato_dados: novoJsonContrato,
         taxa_comissao: editComissao,
         base_comissao: editBaseComissao,
         modalidade_reserva: editForm.modalidadeReserva,
         link_externo_reserva: editForm.modalidadeReserva === 'link_externo' ? editForm.linkExternoReserva : null
      })
      .eq('id', modalPerfil.id);

    if (perfilError) {
      alert("Erro ao guardar edição no parceiro: " + perfilError.message);
      setSavingEdit(false);
      return;
    }

    // 2. Propagar atualizações operacionais (Comissão, Reserva, Pagamento) para os campos do parceiro
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
      await fetch('/api/notificacoes/contrato-editado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          parceiroEmail: editForm.emailContacto || modalPerfil?.email, 
          nomeCampo: "Contrato Global B2B",
          status: 'Editado',
          lang: lang
        })
      });
    } catch (err) {
      console.error("Erro ao notificar parceiro da edição:", err);
    }

    alert("Contrato Global editado com sucesso e propagado para os respetivos campos!");
    
    setModalPerfil({ ...modalPerfil, contrato_dados: novoJsonContrato, taxa_comissao: editComissao, base_comissao: editBaseComissao, modalidade_reserva: editForm.modalidadeReserva, link_externo_reserva: editForm.linkExternoReserva });
    setIsEditing(false);
    setSavingEdit(false);
    fetchContratos();
  };

  const handleImprimirPDF = () => {
    if (!modalPerfil || !modalPerfil.contrato_dados) return;
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
        anexo1Text = "<strong>Reserva Direta com Pagamento Automático (Recomendado):</strong> As reservas efetuadas através da plataforma HelloCamp serão registadas diretamente no sistema de reservas do Parceiro. Nesta modalidade, a HelloCamp terá direito à comissão acordada sobre cada reserva concluída.";
    } else if (dados.modalidadeReserva === 'email') {
        anexo1Text = "<strong>Comunicação por E-mail (Reserva Sob Consulta):</strong> A HelloCamp enviará ao Parceiro, por correio eletrónico, todas as informações necessárias para a gestão da reserva. O Parceiro dispõe de 2 (dois) dias úteis para comunicar à HelloCamp a rejeição. Na ausência de resposta dentro deste prazo, a reserva considerar-se-á aceite.";
    } else if (dados.modalidadeReserva === 'link_externo') {
        anexo1Text = `<strong>Formulário ou Link Externo:</strong> O tráfego gerado pela HelloCamp é redirecionado para um link externo. Para garantir transparência, a HelloCamp recolhe a intenção de reserva (Nome e Email). Estes dados da "Lead" são enviados para o Parceiro. O Parceiro compromete-se a ser verdadeiro na comunicação mensal sobre quais destes clientes efetivamente finalizaram a inscrição do seu lado.<br/><br/>URL Oficial: <span style="font-family: monospace; color: blue;">${dados.linkExternoReserva || 'N/A'}</span>`;
    }

    let anexo2Text = "";
    let anexo3Text = "";

    if (dados.modalidadeReserva !== 'link_externo') {
        anexo2Text = dados.tipoPagamento === '100_total'
          ? "<strong>100% Pago no Ato da Reserva (Pagamento Imediato):</strong> O cliente liquida a totalidade do valor do programa para assegurar a vaga de imediato."
          : "<strong>Sinal de 50% Agora + 50% 1 Semana Antes:</strong> A plataforma debitará automaticamente a segunda metade do cartão do cliente 7 dias antes do início do programa.";

        if (dados.politicaCancelamento?.includes('Flexível')) {
          anexo3Text = "<strong>Flexível (Reembolso a 100% até 7 dias antes):</strong> A HelloCamp não cobrará comissão sobre reservas canceladas pelo cliente até 7 dias antes. Os montantes pagos deverão ser reembolsados a 100%.";
        } else if (dados.politicaCancelamento?.includes('Moderada')) {
          anexo3Text = "<strong>Moderada (Reembolso a 50% até 15 dias antes):</strong> Em caso de cancelamento até 15 dias antes do início, o cliente recebe 50% do valor pago. Nestas situações, a comissão da HelloCamp será reduzida proporcionalmente.";
        } else {
          anexo3Text = "<strong>Estrita (Sem reembolso após reserva):</strong> As reservas efetuadas são finais e não reembolsáveis. A comissão da HelloCamp é devida na sua totalidade, uma vez que a receita do Parceiro fica inteiramente garantida.";
        }
    } else {
        anexo2Text = "<strong>Gestão Independente:</strong> Sendo uma reserva por link externo, o Parceiro fará a cobrança de forma independente fora da plataforma HelloCamp. A comissão acordada será devida pelas intenções de reserva (leads) convertidas em clientes efetivos pelo Parceiro.";
        anexo3Text = "<strong>Política Externa:</strong> As políticas de cancelamento e reembolso ficam sujeitas aos Termos e Condições praticados externamente pelo Parceiro no seu formulário de inscrição.";
    }

    const html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <title>Contrato Global Oficial - ${dados.empresaNome || modalPerfil.empresa_nome}</title>
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
          <button onclick="window.print()" style="padding: 10px 25px; background: #000; color: #fff; font-weight: bold; border: none; cursor: pointer; font-size: 16px;">Imprimir Contrato Global</button>
        </div>

        <div class="header">
          <h1>Contrato Global de Intermediação e Serviços</h1>
          <p>Plataforma HelloCamp Portugal</p>
        </div>

        <p>Entre a <strong>HelloCamp</strong>, com website em www.hellocamp.pt e contacto via info@hellocamp.pt, doravante designada por "Primeira Outorgante"; e do outro lado:</p>
        
        <div class="party-block">
          <p><strong>Nome da Empresa (Entidade Organizadora):</strong> ${dados.empresaNome || modalPerfil.empresa_nome}</p>
          <p><strong>NIF:</strong> ${dados.nif || modalPerfil.nif_empresa}</p>
          <p><strong>Forma Jurídica:</strong> ${dados.formaJuridica || 'N/A'}</p>
          <p><strong>Morada Fiscal:</strong> ${dados.morada || 'N/A'}, ${dados.codigoPostal || 'N/A'}</p>
          <p><strong>Pessoa de Contacto:</strong> ${dados.pessoaContacto || 'N/A'}</p>
          <p><strong>Telefone:</strong> ${dados.telefone || modalPerfil.telefone}</p>
          <p><strong>E-mail Comercial:</strong> ${dados.emailContacto || modalPerfil.email}</p>
        </div>

        <p style="text-align: center; font-style: italic;">- doravante designado por "Parceiro" -</p>

        <p>É celebrado o presente contrato global aplicável a <strong>todas as atividades e campos de férias organizados pelo Parceiro na plataforma HelloCamp</strong>.</p>

        <h2>Cláusulas Contratuais Gerais</h2>

        <div class="clause">
          <span class="clause-title">Artigo 1.º – Comissão</span><br>
          O Parceiro compromete-se a pagar à HelloCamp uma comissão de <strong>${comissaoText}% (IVA incluído)</strong> sobre cada reserva efetuada através da plataforma. Incidência: <strong>${baseComissaoText}</strong>. A comissão é calculada sobre o valor faturado.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 2.º – Obrigações do Parceiro</span><br>
          O Parceiro compromete-se a fornecer à HelloCamp todas as informações necessárias à divulgação das suas atividades. O Parceiro garante que possui todos os direitos necessários sobre os conteúdos. Os preços divulgados na plataforma não poderão ser superiores aos preços praticados pelo Parceiro para reservas diretas.
        </div>

        <div class="clause">
          <span class="clause-title">Artigo 3.º – Limitação de Responsabilidade e Seguros</span><br>
          A HelloCamp atua exclusivamente como plataforma intermediária. O Parceiro é o único e exclusivo responsável pela prestação dos serviços e pela segurança dos participantes, garantindo que possui todos os seguros obrigatórios por lei.
        </div>

        <div class="page-break"></div>

        <h2>Anexos e Condições Operacionais Específicas</h2>

        <div class="clause">
          <span class="clause-title">Anexo 1 – Procedimento de Reserva e Operação</span><br>
          ${anexo1Text}
        </div>

        <div class="clause">
          <span class="clause-title">Anexo 2 – Faturação e Comissão</span><br>
          ${anexo2Text}
        </div>

        <div class="clause">
          <span class="clause-title">Anexo 3 – Política de Cancelamento e Reembolso</span><br>
          ${anexo3Text}
        </div>

        <div class="clause">
          <span class="clause-title">Anexo 4 – Acordos Extraordinários</span><br>
          Se existirem exceções negociadas a este contrato, estas estão refletidas abaixo:<br>
          <i>${dados.acordosComplementares || 'Nenhuma cláusula de exceção definida. O contrato-modelo aplica-se na sua totalidade.'}</i>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-title">Pela HelloCamp</div>
            <div class="sig-name" style="font-family: 'Times New Roman', serif;">Administração HelloCamp</div>
            <div class="sig-details">Data: ${dataContrato}</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">Pelo Parceiro</div>
            <div class="sig-name">${dados.assinaturaNome || '____________________'}</div>
            <div class="sig-details">Cargo: ${dados.assinaturaCargo || '____________________'}</div>
            <div class="sig-details">Data da Assinatura: ${dataContrato}</div>
            
            <div class="stamp">
              <strong>Declaração de Vinculação:</strong> "Declaro ter lido e aceite os termos do contrato e anexos. Confirmo possuir poderes legais para vincular a entidade a todas as atividades presentes e futuras."<br><br>
              <strong>Registo de Assinatura:</strong><br>
              Plataforma Segura HelloCamp<br>
              Timestamp: ${dados.dataSubmissao || new Date().toISOString()}<br>
              ID Perfil Sistema: ${modalPerfil.id}
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
  
  const contratosFiltrados = contratos.filter(c => {
    if (filtroStatus === 'Todos') return true;
    return c.status_contrato === filtroStatus;
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
            if (tab === 'Todos') return true;
            return c.status_contrato === tab;
          }).length;

          return (
            <button 
              key={tab} onClick={() => setFiltroStatus(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${filtroStatus === tab ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {tab === 'Pendente de Revisão' ? 'Pendentes' : tab} <span className={`ml-1.5 px-2 py-0.5 rounded-md text-[10px] ${filtroStatus === tab ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
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
              let statusColor = "bg-gray-100 text-gray-600";
              if (c.status_contrato === 'Aprovado') statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
              if (c.status_contrato === 'Rejeitado') statusColor = "bg-red-100 text-red-800 border-red-200";
              if (c.status_contrato === 'Pendente de Revisão' || !c.status_contrato) statusColor = "bg-amber-100 text-amber-800 border-amber-200";

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
                       {c.modalidade_reserva === 'link_externo' ? 'Externo' : (c.modalidade_reserva === 'email' ? 'Sob Consulta' : 'Checkout')}
                     </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-md border shadow-sm ${statusColor}`}>
                      {c.status_contrato || 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => abrirModal(c)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm">
                      Rever Contrato
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
                <button onClick={handleImprimirPDF} className="text-xs font-bold text-gray-700 hover:text-black bg-gray-100 px-4 py-2 rounded-lg transition-colors shadow-sm mr-2 hidden sm:block border border-gray-200">
                  Gerar PDF
                </button>
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
                  <div className="bg-white border-2 border-emerald-100 p-5 rounded-xl shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-emerald-50 text-7xl font-serif italic">A</div>
                    <span className="relative block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Assinatura Digital</span>
                    <p className="relative font-serif text-2xl font-black italic text-emerald-950 mb-1">{modalPerfil.contrato_dados?.assinaturaNome}</p>
                    <p className="relative text-xs text-emerald-700 font-bold mb-3">{modalPerfil.contrato_dados?.assinaturaCargo}</p>
                    <p className="relative text-[9px] text-gray-400 font-mono m-0 uppercase tracking-widest">Registado a: {modalPerfil.contrato_dados?.dataSubmissao ? new Date(modalPerfil.contrato_dados?.dataSubmissao).toLocaleString('pt-PT') : 'N/D'}</p>
                  </div>
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
            </div>

            {/* RODAPÉ E ACÕES */}
            <div className="px-6 py-5 border-t border-gray-200 bg-white flex flex-wrap gap-3 justify-between items-center flex-shrink-0">
              <div>
                {!isEditing && modalPerfil.status_contrato !== 'Pendente de Revisão' && (
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
                    {modalPerfil.status_contrato !== 'Rejeitado' && (
                      <button onClick={() => handleAcaoContrato(modalPerfil.id, 'Rejeitado')} className="bg-white border border-red-200 text-red-600 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-red-50 transition-colors">Rejeitar Parceiro</button>
                    )}
                    {modalPerfil.status_contrato !== 'Aprovado' && (
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
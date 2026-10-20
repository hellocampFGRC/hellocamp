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

  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block";
  const inputClass = "w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:border-slate-800 transition-all shadow-sm";
  const selectClass = "w-full py-2 px-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:border-slate-800 transition-all shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[position:right_1rem_center] bg-no-repeat";
  const textareaClass = "w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:border-slate-800 transition-all shadow-sm resize-y";

  const fetchContratos = async () => {
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
      .update({ status_contrato: novoStatus, parceiro_verificado: isApproved })
      .eq('id', id)
      .select();

    if (perfilError) return alert("Erro ao atualizar parceiro: " + perfilError.message);
    if (!updatedPerfil || updatedPerfil.length === 0) return alert("Erro RLS: Não tem permissão para alterar este perfil.");

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
            body: JSON.stringify({ parceiroEmail: dados.emailContacto || modalPerfil?.email, nomeCampo: "Contrato Global B2B", status: novoStatus, lang: lang })
          });
        }
      } catch (err) { console.error(err); }
      alert(`Sucesso! O Parceiro está agora ${novoStatus}.`);
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

    if (perfilError) { alert("Erro: " + perfilError.message); setSavingEdit(false); return; }
    if (!updatedPerfil || updatedPerfil.length === 0) { alert("Erro RLS."); setSavingEdit(false); return; }

    await supabase.from('campos').update({ 
        contrato_dados: novoJsonContrato, taxa_comissao: editComissao, base_comissao: editBaseComissao,
        modalidade_reserva: editForm.modalidadeReserva,
        link_externo_reserva: editForm.modalidadeReserva === 'link_externo' ? editForm.linkExternoReserva : null,
        tipo_pagamento: editForm.modalidadeReserva !== 'link_externo' ? editForm.tipoPagamento : null,
        politica_cancelamento: editForm.modalidadeReserva !== 'link_externo' ? editForm.politicaCancelamento : null
      }).eq('organizador_id', modalPerfil.id);

    try {
      const emailAvisar = editForm.emailContacto || modalPerfil?.email;
      if (emailAvisar) {
        await fetch('/api/notificacoes/contrato-editado', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parceiroEmail: emailAvisar, nomeCampo: "Contrato Global B2B", status: 'Editado', lang: lang }) });
      }
    } catch (err) { console.error(err); }

    alert("Dados atualizados com sucesso e propagados!");
    setModalPerfil({ ...modalPerfil, contrato_dados: novoJsonContrato, taxa_comissao: editComissao, base_comissao: editBaseComissao, modalidade_reserva: editForm.modalidadeReserva, link_externo_reserva: editForm.linkExternoReserva });
    setIsEditing(false);
    setSavingEdit(false);
    fetchContratos();
  };

  const handleImprimirPDF = () => {
    if (!modalPerfil || !modalPerfil.contrato_dados) return alert("Este parceiro ainda não preencheu/assinou o contrato.");
    const dados = modalPerfil.contrato_dados;
    const comissaoText = modalPerfil.taxa_comissao !== null && modalPerfil.taxa_comissao !== undefined ? modalPerfil.taxa_comissao : 12;
    
    let baseComissaoText = "Sobre Valor Total (Programa + Extras)";
    if (modalPerfil.base_comissao === "apenas_programa") baseComissaoText = "Apenas sobre Valor Base do Programa";
    if (modalPerfil.base_comissao === "sem_comissao") baseComissaoText = "Isento de Comissão (0%)";

    const dataContrato = dados.dataSubmissao ? new Date(dados.dataSubmissao).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('pt-PT');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Bloqueador de Pop-ups ativado.");

    let anexo1Text = "";
    if (dados.modalidadeReserva === 'direta') {
        anexo1Text = "<strong>Reserva Direta no Checkout (Recomendado):</strong> As reservas efetuadas através da plataforma HelloCamp serão registadas diretamente no sistema de reservas do Parceiro. Nesta modalidade, a HelloCamp terá direito à comissão acordada sobre cada reserva concluída.";
    } else if (dados.modalidadeReserva === 'email') {
        anexo1Text = "<strong>Comunicação por E-mail (Reserva Sob Consulta):</strong> A HelloCamp enviará ao Parceiro, por correio eletrónico, todas as informações necessárias para a gestão da reserva. O Parceiro dispõe de 2 dias úteis para rejeitar, caso contrário considera-se aceite.";
    } else if (dados.modalidadeReserva === 'link_externo') {
        anexo1Text = `<strong>Link Externo:</strong> O tráfego gerado pela HelloCamp é redirecionado para um link externo oficial do Parceiro. A HelloCamp recolhe a intenção de reserva (Lead) e envia ao parceiro. <br/><br/>URL: <span style="font-family: monospace; color: blue;">${dados.linkExternoReserva || 'N/A'}</span>`;
    }

    let anexo2Text = "";
    let anexo3Text = "";

    if (dados.modalidadeReserva !== 'link_externo') {
        anexo2Text = dados.tipoPagamento === '100_total'
          ? "<strong>100% Pago no Ato da Reserva:</strong> O cliente liquida a totalidade do valor para assegurar a vaga de imediato."
          : "<strong>Sinal de 50% Agora + 50% 1 Semana Antes:</strong> A plataforma debitará a segunda metade do cartão do cliente 7 dias antes do programa.";

        if (dados.politicaCancelamento?.includes('Flexível')) {
          anexo3Text = "<strong>Flexível (Reembolso a 100% até 7 dias antes):</strong> Reembolso garantido até 7 dias.";
        } else if (dados.politicaCancelamento?.includes('Moderada')) {
          anexo3Text = "<strong>Moderada (Reembolso a 50% até 15 dias antes):</strong> Cancelamentos até 15 dias têm 50% de reembolso.";
        } else {
          anexo3Text = "<strong>Estrita:</strong> Sem reembolso após reserva efetuada.";
        }
    } else {
        anexo2Text = "<strong>Gestão Independente:</strong> O Parceiro fará a cobrança fora da plataforma HelloCamp.";
        anexo3Text = "<strong>Política Externa:</strong> Regras e gestão aplicadas no portal do parceiro.";
    }

    const html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <title>Contrato Global - ${dados.empresaNome || modalPerfil.empresa_nome}</title>
        <style>
          body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #000; max-width: 850px; margin: 0 auto; padding: 40px 30px; line-height: 1.6; font-size: 13px; text-align: justify; }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; font-weight: 900; border-bottom: 2px solid #000; padding-bottom: 10px; }
          h2 { font-size: 16px; text-transform: uppercase; font-weight: 900; margin-top: 40px; margin-bottom: 15px; border-bottom: 1px solid #000; }
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
          @media print { .print-btn { display: none; } .page-break { page-break-before: always; } }
        </style>
      </head>
      <body>
        <div class="print-btn" style="text-align: center; margin-bottom: 30px;">
          <button onclick="window.print()" style="padding: 12px 30px; background: #0f172a; color: #fff; font-weight: bold; border: none; cursor: pointer; border-radius: 8px;">🖨️ Imprimir PDF</button>
        </div>

        <div class="header"><h1>Contrato Global de Intermediação e Serviços</h1></div>
        
        <div class="party-block">
          <div class="party-box"><h3 style="margin-top: 0; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Primeira Outorgante</h3><p><strong>HelloCamp Portugal</strong></p><p>Website: www.hellocamp.pt</p></div>
          <div class="party-box"><h3 style="margin-top: 0; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Segunda Outorgante (Parceiro)</h3><p><strong>${dados.empresaNome || modalPerfil.empresa_nome}</strong></p><p><strong>NIF:</strong> ${dados.nif || modalPerfil.nif_empresa}</p><p><strong>E-mail:</strong> ${dados.emailContacto || modalPerfil.email}</p></div>
        </div>

        <h2>Cláusulas Contratuais Gerais</h2>
        <div class="clause"><span class="clause-title">Artigo 1.º – Comissão:</span> O Parceiro compromete-se a pagar à HelloCamp uma comissão (IVA incluído) sobre cada reserva efetuada.</div>
        <div class="clause"><span class="clause-title">Artigo 2.º – Limitação de Responsabilidade:</span> A HelloCamp atua exclusivamente como plataforma intermediária. O Parceiro é o exclusivo responsável pela prestação dos serviços e segurança.</div>

        <div class="page-break"></div>
        <h2>Anexos Operacionais Específicos</h2>

        <div class="annex-box"><div class="annex-title">Anexo 1 – Procedimento de Reserva</div>${anexo1Text}</div>
        <div class="annex-box"><div class="annex-title">Anexo 2 – Faturação e Comissão</div><p><strong>Taxa:</strong> ${comissaoText}%</p><p><strong>Base:</strong> ${baseComissaoText}</p><p>${anexo2Text}</p></div>
        <div class="annex-box"><div class="annex-title">Anexo 3 – Política de Cancelamento</div>${anexo3Text}</div>

        <div class="signatures">
          <div class="sig-box"><div class="sig-title">Pela HelloCamp</div><div class="sig-name">Administração HelloCamp</div><div class="sig-details">Data: ${dataContrato}</div></div>
          <div class="sig-box"><div class="sig-title">Pelo Parceiro</div><div class="sig-name">${dados.assinaturaNome || '______________'}</div><div class="sig-details">Cargo: ${dados.assinaturaCargo || '______________'}</div>
            <div class="stamp"><strong>Registo Digital</strong><br>Timestamp: ${dados.dataSubmissao || new Date().toISOString()}<br>ID Perfil: ${modalPerfil.id}</div>
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const tabs = ['Por Assinar', 'Pendentes de Revisão', 'Aprovado', 'Rejeitado', 'Todos'];
  const contratosFiltrados = contratos.filter(c => {
    let statusReal = c.status_contrato;
    if (!c.contrato_dados) statusReal = 'Por Assinar';
    else if (!statusReal || statusReal === 'Pendente') statusReal = 'Pendentes de Revisão';

    if (filtroStatus === 'Todos') return true;
    if (filtroStatus === 'Por Assinar') return statusReal === 'Por Assinar';
    if (filtroStatus === 'Pendentes de Revisão') return statusReal === 'Pendente de Revisão' || statusReal === 'Pendentes de Revisão';
    return c.status_contrato === filtroStatus && c.contrato_dados;
  });

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">A carregar Contratos Globais de Parceiros...</div>;

  return (
    <div className="max-w-7xl mx-auto font-sans pb-16 px-4 md:px-0">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight m-0">Gestão de Contratos de Parceiros</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Quartel General HelloCamp</p>
        </div>
      </div>

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
            <button key={tab} onClick={() => setFiltroStatus(tab)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filtroStatus === tab ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {tab} <span className={`ml-1.5 px-2 py-0.5 rounded-lg text-[10px] ${filtroStatus === tab ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-[1.5rem] overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entidade Jurídica</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contacto / E-mail</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operação</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status Geral</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contratosFiltrados.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold text-sm">Sem contratos encontrados nesta categoria.</td></tr>
            ) : contratosFiltrados.map(c => {
              const dados = c.contrato_dados || {};
              const temContrato = !!c.contrato_dados;
              
              let statusColor = "bg-slate-100 text-slate-600 border-slate-200";
              let statusLabel = "Por Assinar";
              
              if (temContrato) {
                statusLabel = c.status_contrato || 'Pendente de Revisão';
                if (c.status_contrato === 'Aprovado') statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                else if (c.status_contrato === 'Rejeitado') statusColor = "bg-red-100 text-red-800 border-red-200";
                else statusColor = "bg-amber-100 text-amber-800 border-amber-200";
              }

              return (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-black text-sm text-slate-900 truncate max-w-[200px]">{dados.empresaNome || c.empresa_nome || 'N/D'}</div>
                    <div className="text-[10px] font-medium text-slate-500 mt-1">NIF: {dados.nif || c.nif_empresa || '---'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{dados.pessoaContacto || c.nome_completo || 'N/A'}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">{dados.emailContacto || c.email}</div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">
                       {c.modalidade_reserva === 'link_externo' ? 'Externo' : (c.modalidade_reserva === 'email' ? 'Sob Consulta' : (c.modalidade_reserva === 'direta' ? 'Checkout' : 'N/D'))}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border shadow-sm ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => abrirModal(c)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm">
                      {temContrato ? 'Rever Contrato' : 'Ver Dados Base'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalPerfil && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            
            <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white flex-shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 m-0 leading-none">
                  {modalPerfil.contrato_dados?.empresaNome || modalPerfil.empresa_nome}
                  {isEditing && <span className="bg-amber-400 text-amber-950 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-lg ml-3">Modo Edição</span>}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 m-0">Contrato Global de Parceiro</p>
              </div>
              <div className="flex items-center gap-3">
                {modalPerfil.contrato_dados && (
                  <button onClick={handleImprimirPDF} className="text-xs font-bold text-slate-700 hover:text-black bg-slate-100 px-5 py-2.5 rounded-xl transition-colors shadow-sm hidden sm:block border border-slate-200">
                    Gerar PDF
                  </button>
                )}
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-5 py-2.5 rounded-xl border border-blue-200 transition-colors shadow-sm">
                    Editar Termos
                  </button>
                )}
                <button onClick={() => setModalPerfil(null)} className="text-slate-400 hover:text-slate-900 bg-white border border-slate-200 w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors shadow-sm">&times;</button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50/50">
              {!modalPerfil.contrato_dados && !isEditing ? (
                 <div className="bg-amber-50 border border-amber-200 p-8 rounded-2xl text-center shadow-sm">
                    <h3 className="text-amber-900 font-black text-lg mb-2">Parceiro ainda não assinou o contrato</h3>
                    <p className="text-amber-800 text-sm font-medium">Este parceiro criou conta mas ainda não preencheu o Acordo Global de Intermediação. Pode editar os termos operacionais antecipadamente clicando em "Editar Termos" acima.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3">Dados Fiscais & Contactos</span>
                      {isEditing ? (
                        <div className="space-y-4">
                          <div><label className={labelClass}>Empresa</label><input className={inputClass} value={editForm.empresaNome || ''} onChange={e => setEditForm({...editForm, empresaNome: e.target.value})} /></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelClass}>NIF</label><input className={inputClass} value={editForm.nif || ''} onChange={e => setEditForm({...editForm, nif: e.target.value})} /></div>
                            <div><label className={labelClass}>Telefone</label><input className={inputClass} value={editForm.telefone || ''} onChange={e => setEditForm({...editForm, telefone: e.target.value})} /></div>
                          </div>
                          <div><label className={labelClass}>E-mail Reservas</label><input className={inputClass} value={editForm.emailReservas || ''} onChange={e => setEditForm({...editForm, emailReservas: e.target.value})} /></div>
                        </div>
                      ) : (
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100"><strong className="text-slate-500 text-xs">Empresa</strong><span className="font-black text-slate-900 text-right ml-4 text-base">{modalPerfil.contrato_dados?.empresaNome}</span></div>
                          <div className="flex justify-between items-center px-1"><strong className="text-slate-500 text-xs">NIF</strong><span className="font-mono font-bold text-slate-800 text-right ml-4">{modalPerfil.contrato_dados?.nif}</span></div>
                          <div className="flex justify-between items-center px-1"><strong className="text-slate-500 text-xs">Contacto Pessoal</strong><span className="font-medium text-slate-800 text-right ml-4">{modalPerfil.contrato_dados?.pessoaContacto} <br/><span className="text-slate-400 font-bold">{modalPerfil.contrato_dados?.telefone}</span></span></div>
                          <div className="flex justify-between items-center px-1"><strong className="text-slate-500 text-xs">E-mail Operacional</strong><span className="font-bold text-blue-600 text-right ml-4 break-all">{modalPerfil.contrato_dados?.emailReservas || modalPerfil.contrato_dados?.emailContacto || modalPerfil.email}</span></div>
                        </div>
                      )}
                    </div>
                    
                    {modalPerfil.contrato_dados && (
                      <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                        <span className="relative block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Assinatura Digital Segura</span>
                        <p className="relative font-serif text-3xl font-black italic text-emerald-900 mb-1">{modalPerfil.contrato_dados?.assinaturaNome}</p>
                        <p className="relative text-sm text-emerald-700 font-bold mb-4">{modalPerfil.contrato_dados?.assinaturaCargo}</p>
                        <p className="relative text-[10px] text-emerald-600/70 font-mono m-0 uppercase tracking-widest bg-emerald-100/50 inline-block px-3 py-1.5 rounded-md border border-emerald-200">Timestamp: {modalPerfil.contrato_dados?.dataSubmissao ? new Date(modalPerfil.contrato_dados?.dataSubmissao).toLocaleString('pt-PT') : 'N/D'}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-5 border-b border-slate-100 pb-3">Condições Operacionais Acordadas</span>
                    
                    <div className="space-y-5">
                      <div className={`p-5 rounded-xl ${isEditing ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 border border-slate-100 flex justify-between items-center'}`}>
                        <strong className={`${isEditing ? labelClass : 'text-xs text-slate-600 uppercase tracking-widest'}`}>Taxa de Comissão (%)</strong>
                        {isEditing ? (
                          <input type="number" step="0.1" className={`${inputClass} font-black text-blue-700 text-xl`} value={editComissao} onChange={e => setEditComissao(Number(e.target.value))} />
                        ) : (
                          <span className="text-2xl font-black text-blue-700 bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-100">{modalPerfil.taxa_comissao !== null && modalPerfil.taxa_comissao !== undefined ? modalPerfil.taxa_comissao : 12}%</span>
                        )}
                      </div>
                      
                      {isEditing && (
                        <div className="pt-2">
                           <label className={labelClass}>Base de Incidência</label>
                           <select className={selectClass} value={editBaseComissao} onChange={e => setEditBaseComissao(e.target.value)}>
                             <option value="total">Valor Total (Programa + Extras)</option>
                             <option value="apenas_programa">Apenas sobre o Programa</option>
                             <option value="sem_comissao">Isento (0%)</option>
                           </select>
                        </div>
                      )}

                      <div className={`${isEditing ? 'bg-white p-5 rounded-xl border border-blue-200 mt-4 space-y-4' : 'space-y-4 text-sm pt-2'}`}>
                        {isEditing ? (
                          <>
                            <div>
                              <label className={labelClass}>Modelo de Reserva (Anexo 1)</label>
                              <select className={selectClass} value={editForm.modalidadeReserva || ''} onChange={e => setEditForm({...editForm, modalidadeReserva: e.target.value})}>
                                <option value="direta">Reserva Direta (Checkout)</option>
                                <option value="email">Sob Consulta (E-mail)</option>
                                <option value="link_externo">Link Externo / Forms</option>
                              </select>
                            </div>
                            {editForm.modalidadeReserva === 'link_externo' && (
                              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-2 block">URL do Parceiro</label>
                                <input type="url" className="w-full py-2.5 px-4 bg-white border border-amber-300 rounded-lg text-sm font-medium outline-none focus:border-amber-500" value={editForm.linkExternoReserva || ''} onChange={e => setEditForm({...editForm, linkExternoReserva: e.target.value})} placeholder="https://..." />
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
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                              <strong className="text-slate-500 uppercase tracking-widest text-[10px]">Modelo</strong>
                              <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg text-xs border border-slate-200">
                                {modalPerfil.contrato_dados?.modalidadeReserva === 'direta' ? 'Reserva Direta no Checkout' : 
                                 modalPerfil.contrato_dados?.modalidadeReserva === 'link_externo' ? 'Link Externo' : 'Comunicação por Email'}
                              </span>
                            </div>
                            
                            {modalPerfil.contrato_dados?.modalidadeReserva === 'link_externo' ? (
                              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mt-4 shadow-sm">
                                 <strong className="block text-amber-900 text-[10px] uppercase tracking-widest mb-2">URL Oficial de Inscrição</strong>
                                 <a href={modalPerfil.contrato_dados?.linkExternoReserva || modalPerfil.link_externo_reserva} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline break-all text-xs bg-white px-3 py-2 rounded-lg border border-amber-100 block">
                                    {modalPerfil.contrato_dados?.linkExternoReserva || modalPerfil.link_externo_reserva}
                                 </a>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mt-4">
                                  <strong className="text-slate-500 uppercase tracking-widest text-[10px]">Pagamento</strong>
                                  <span className="font-bold text-slate-900 text-right">{modalPerfil.contrato_dados?.tipoPagamento === '100_total' ? '100% Imediato' : 'Sinal de 50%'}</span>
                                </div>
                                <div className="pt-4">
                                  <strong className="block text-slate-500 uppercase tracking-widest text-[10px] mb-2">Pol. Cancelamento Acordada:</strong>
                                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 m-0 font-medium">
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

                  {(isEditing || editForm.acordosComplementares) && (
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
                       <label className={`${labelClass} text-slate-900 mb-3`}>Acordos Extraordinários (Anexo 4)</label>
                       {isEditing ? (
                         <textarea 
                           className={`${textareaClass}`} 
                           rows={3} 
                           value={editForm.acordosComplementares || ''} 
                           onChange={e => setEditForm({...editForm, acordosComplementares: e.target.value})}
                           placeholder="Insira as cláusulas de exceção acordadas com o parceiro."
                         />
                       ) : (
                         <p className="text-sm text-slate-700 italic bg-amber-50 p-4 rounded-xl border border-amber-200 m-0 font-medium leading-relaxed">
                           "{editForm.acordosComplementares}"
                         </p>
                       )}
                     </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-8 py-5 border-t border-slate-200 bg-white flex flex-wrap gap-4 justify-between items-center flex-shrink-0">
              <div>
                {!isEditing && modalPerfil.status_contrato !== 'Pendente de Revisão' && modalPerfil.contrato_dados && (
                  <button onClick={() => handleAcaoContrato(modalPerfil.id, 'Pendente de Revisão')} className="text-xs font-bold text-slate-400 hover:text-slate-800 underline">Desfazer Aprovação (Reverter)</button>
                )}
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)} className="flex-1 sm:flex-none bg-white border border-slate-300 text-slate-700 font-bold px-6 py-3 rounded-xl text-sm hover:bg-slate-50 transition-colors shadow-sm">Cancelar</button>
                    <button onClick={handleGuardarEdicao} disabled={savingEdit} className="flex-1 sm:flex-none bg-blue-600 text-white font-black px-8 py-3 rounded-xl text-sm shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">Guardar Modificações</button>
                  </>
                ) : (
                  <>
                    {modalPerfil.contrato_dados && modalPerfil.status_contrato !== 'Rejeitado' && (
                      <button onClick={() => handleAcaoContrato(modalPerfil.id, 'Rejeitado')} className="bg-white border border-red-200 text-red-600 font-bold px-6 py-3 rounded-xl text-sm hover:bg-red-50 transition-colors shadow-sm">Rejeitar</button>
                    )}
                    {modalPerfil.contrato_dados && modalPerfil.status_contrato !== 'Aprovado' && (
                      <button onClick={() => handleAcaoContrato(modalPerfil.id, 'Aprovado')} className="bg-emerald-600 text-white font-black uppercase tracking-widest px-8 py-3 rounded-xl text-xs shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-colors">Validar e Aprovar Parceiro</button>
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
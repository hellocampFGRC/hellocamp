"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function GestaoContratosHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalContrato, setModalContrato] = useState<any>(null);
  
  // Estados para Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editComissao, setEditComissao] = useState<number>(12); // Novo estado para a comissão
  const [savingEdit, setSavingEdit] = useState(false);

  // CLASSES DE ESTILO PARA O MODO DE EDIÇÃO
  const labelClass = "text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block";
  const inputClass = "w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm";
  const selectClass = "w-full p-2.5 pr-8 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7rem_auto] bg-[position:right_1rem_center] bg-no-repeat";
  const textareaClass = "w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all shadow-sm resize-y";

  const fetchContratos = async () => {
    // Adicionada a taxa_comissao ao select da BD
    const { data } = await supabase
      .from('campos')
      .select('id, nome, contrato_dados, status_aprovacao, taxa_comissao')
      .eq('status_aprovacao', 'Pendente de Revisão')
      .order('id', { ascending: false });
      
    setContratos(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchContratos(); }, []);

  const abrirModal = (contrato: any) => {
    setModalContrato(contrato);
    setEditForm(contrato.contrato_dados || {});
    setEditComissao(contrato.taxa_comissao || 12); // Extrai a comissão ou define 12 por defeito
    setIsEditing(false);
  };

  const handleAcaoContrato = async (id: string, novoStatus: string) => {
    const isApproved = novoStatus === 'Aprovado';
    
    const updatePayload: any = { status_aprovacao: novoStatus };
    if (isApproved) {
      updatePayload.contrato_parceiro_url = `https://hellocamp.pt/contratos/aprovado_${id}.pdf`;
    }

    const { error } = await supabase.from('campos').update(updatePayload).eq('id', id);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      alert(`Contrato ${novoStatus} com sucesso!`);
      setModalContrato(null);
      fetchContratos();
    }
  };

  const handleGuardarEdicao = async () => {
    setSavingEdit(true);
    
    // Atualiza JSON do contrato E a coluna da comissão na BD
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
          emailParceiro: editForm.emailContacto, 
          nomeParceiro: editForm.pessoaContacto,
          empresa: editForm.empresaNome,
          dadosAtualizados: editForm 
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

  if (loading) return <div className="p-12 text-center text-slate-500">A carregar contratos pendentes...</div>;

  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-black mb-2 text-slate-900">Validação de Contratos</h1>
      <p className="text-slate-500 mb-8">Reveja, edite e aprove os acordos de intermediação submetidos pelos parceiros.</p>

      {contratos.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center text-slate-500 font-bold">
          Não existem contratos pendentes de revisão.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Campo</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Entidade</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Comissão</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Data</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map(c => {
                const dados = c.contrato_dados || {};
                return (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{c.nome}</td>
                    <td className="p-4 text-sm text-slate-600">{dados.empresaNome || 'N/D'}</td>
                    <td className="p-4 text-sm font-bold text-emerald-600">{c.taxa_comissao || 12}%</td>
                    <td className="p-4 text-sm text-slate-600">{dados.dataSubmissao ? new Date(dados.dataSubmissao).toLocaleDateString('pt-PT') : 'N/D'}</td>
                    <td className="p-4">
                      <button onClick={() => abrirModal(c)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm">
                        Rever Documento
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE REVISÃO DO CONTRATO COMPLETO */}
      {modalContrato && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  {modalContrato.nome}
                  {isEditing && <span className="bg-[#EBA914] text-white text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full shadow-sm">Modo de Edição</span>}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">ID do Campo: {modalContrato.id}</p>
              </div>
              <div className="flex items-center gap-4">
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
                    ✏️ Editar Contrato
                  </button>
                )}
                <button onClick={() => setModalContrato(null)} className="text-3xl font-bold text-slate-400 hover:text-slate-900 leading-none">&times;</button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* BLOCO 1: INFORMAÇÃO CORPORATIVA E CONTACTOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner">
                  <span className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Dados Fiscais da Entidade</span>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div><label className={labelClass}>Empresa</label><input className={inputClass} value={editForm.empresaNome || ''} onChange={e => setEditForm({...editForm, empresaNome: e.target.value})} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>Forma Jurídica</label><input className={inputClass} value={editForm.formaJuridica || ''} onChange={e => setEditForm({...editForm, formaJuridica: e.target.value})} /></div>
                        <div><label className={labelClass}>NIF</label><input className={inputClass} value={editForm.nif || ''} onChange={e => setEditForm({...editForm, nif: e.target.value})} /></div>
                      </div>
                      <div><label className={labelClass}>Morada</label><input className={inputClass} value={editForm.morada || ''} onChange={e => setEditForm({...editForm, morada: e.target.value})} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelClass}>Cód. Postal</label><input className={inputClass} value={editForm.codigoPostal || ''} onChange={e => setEditForm({...editForm, codigoPostal: e.target.value})} /></div>
                        <div><label className={labelClass}>Website</label><input className={inputClass} value={editForm.website || ''} onChange={e => setEditForm({...editForm, website: e.target.value})} /></div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <p><strong className="text-slate-800">Empresa:</strong> {modalContrato.contrato_dados?.empresaNome}</p>
                      <p><strong className="text-slate-800">Forma Jurídica:</strong> {modalContrato.contrato_dados?.formaJuridica}</p>
                      <p><strong className="text-slate-800">NIF:</strong> <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded">{modalContrato.contrato_dados?.nif}</span></p>
                      <p><strong className="text-slate-800">Morada:</strong> {modalContrato.contrato_dados?.morada}, {modalContrato.contrato_dados?.codigoPostal}</p>
                      <p><strong className="text-slate-800">Website:</strong> {modalContrato.contrato_dados?.website ? <a href={modalContrato.contrato_dados.website} target="_blank" className="text-blue-600 underline">{modalContrato.contrato_dados.website}</a> : 'N/A'}</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-inner">
                  <span className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Pontos de Contacto</span>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div><label className={labelClass}>Responsável</label><input className={inputClass} value={editForm.pessoaContacto || ''} onChange={e => setEditForm({...editForm, pessoaContacto: e.target.value})} /></div>
                      <div><label className={labelClass}>Telefone</label><input className={inputClass} value={editForm.telefone || ''} onChange={e => setEditForm({...editForm, telefone: e.target.value})} /></div>
                      <div><label className={labelClass}>E-mail Comercial</label><input className={inputClass} value={editForm.emailContacto || ''} onChange={e => setEditForm({...editForm, emailContacto: e.target.value})} /></div>
                      <div><label className={labelClass}>E-mail de Reservas</label><input className={inputClass} value={editForm.emailReservas || ''} onChange={e => setEditForm({...editForm, emailReservas: e.target.value})} /></div>
                      <div><label className={labelClass}>DPO (RGPD)</label><input className={inputClass} value={editForm.responsavelRGPD || ''} onChange={e => setEditForm({...editForm, responsavelRGPD: e.target.value})} /></div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <p><strong className="text-slate-800">Responsável:</strong> {modalContrato.contrato_dados?.pessoaContacto}</p>
                      <p><strong className="text-slate-800">Telefone:</strong> {modalContrato.contrato_dados?.telefone}</p>
                      <p><strong className="text-slate-800">E-mail Comercial:</strong> {modalContrato.contrato_dados?.emailContacto}</p>
                      <p><strong className="text-slate-800">E-mail de Reservas:</strong> <span className="font-bold text-amber-600">{modalContrato.contrato_dados?.emailReservas}</span></p>
                      <p><strong className="text-slate-800">DPO (RGPD):</strong> {modalContrato.contrato_dados?.responsavelRGPD}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* BLOCO 2: CONDIÇÕES DO SERVIÇO (ANEXOS) & COMISSÃO */}
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 relative">
                <span className="block text-xs font-black text-blue-800 uppercase tracking-widest mb-4 border-b border-blue-200 pb-2">Condições Operacionais & Comissão</span>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  {/* CAMPO DA COMISSÃO EM DESTAQUE */}
                  <div className={`${isEditing ? 'bg-amber-100 p-3 rounded-lg border border-amber-300 shadow-sm' : ''}`}>
                    {isEditing ? (
                      <>
                        <label className={`${labelClass} text-amber-900`}>Comissão Base (%)</label>
                        <div className="relative">
                          <input type="number" step="0.1" className={inputClass} value={editComissao} onChange={e => setEditComissao(Number(e.target.value))} />
                          <span className="absolute right-8 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <strong className="block text-blue-900 mb-1">Comissão Base</strong>
                        <p className="text-emerald-700 font-black text-lg bg-white border border-emerald-200 p-1.5 px-3 rounded shadow-sm inline-block">{modalContrato.taxa_comissao || 12}%</p>
                      </>
                    )}
                  </div>

                  {/* RESTANTES ANEXOS */}
                  {isEditing ? (
                    <>
                      <div>
                        <label className={labelClass}>Modelo de Reserva</label>
                        <select className={selectClass} value={editForm.modalidadeReserva || ''} onChange={e => setEditForm({...editForm, modalidadeReserva: e.target.value})}>
                          <option value="direta">Reserva Direta (Automático)</option>
                          <option value="email">Sob Consulta (E-mail)</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Modelo de Pagamento</label>
                        <select className={selectClass} value={editForm.tipoPagamento || ''} onChange={e => setEditForm({...editForm, tipoPagamento: e.target.value})}>
                          <option value="100_total">100% no Ato da Reserva</option>
                          <option value="50_sinal">Sinal de 50% + Restante</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Pol. Cancelamento</label>
                        <select className={selectClass} value={editForm.politicaCancelamento || ''} onChange={e => setEditForm({...editForm, politicaCancelamento: e.target.value})}>
                          <option value="Flexível (Reembolso a 100% até 7 dias antes)">Flexível (100% até 7 dias)</option>
                          <option value="Moderada (Reembolso a 50% até 15 dias antes)">Moderada (50% até 15 dias)</option>
                          <option value="Estrita (Sem reembolso após reserva)">Estrita (Sem reembolso)</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <strong className="block text-blue-900 mb-1">Modelo de Reserva</strong>
                        <p className="text-blue-700 bg-white border border-blue-100 p-2 rounded">{modalContrato.contrato_dados?.modalidadeReserva === 'direta' ? 'Reserva Direta' : 'Sob Consulta (E-mail)'}</p>
                      </div>
                      <div>
                        <strong className="block text-blue-900 mb-1">Modelo Pagamento</strong>
                        <p className="text-blue-700 bg-white border border-blue-100 p-2 rounded">{modalContrato.contrato_dados?.tipoPagamento === '100_total' ? '100% Ato da Reserva' : 'Sinal de 50%'}</p>
                      </div>
                      <div>
                        <strong className="block text-blue-900 mb-1">Pol. Cancelamento</strong>
                        <p className="text-blue-700 bg-white border border-blue-100 p-2 rounded leading-tight text-[11px] font-medium">{modalContrato.contrato_dados?.politicaCancelamento}</p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="mt-5 bg-white p-4 rounded-lg border border-blue-100">
                  <strong className="block text-blue-900 text-[10px] font-bold uppercase tracking-widest mb-2">Acordos Complementares / Exceções:</strong>
                  {isEditing ? (
                    <textarea 
                      className={textareaClass} 
                      rows={3} 
                      value={editForm.acordosComplementares || ''} 
                      onChange={e => setEditForm({...editForm, acordosComplementares: e.target.value})}
                      placeholder="Nenhuma cláusula de exceção definida."
                    />
                  ) : (
                    <p className="text-blue-800 text-sm italic">{modalContrato.contrato_dados?.acordosComplementares || 'Nenhuma cláusula de exceção preenchida pelo parceiro.'}</p>
                  )}
                </div>
              </div>

              {/* BLOCO 3: ASSINATURA */}
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="block text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Assinatura Digital de Vinculação</span>
                  <p className="font-serif text-2xl font-black italic text-emerald-950 mb-1">{modalContrato.contrato_dados?.assinaturaNome}</p>
                  <p className="text-sm text-emerald-800"><strong>Cargo Declarado:</strong> {modalContrato.contrato_dados?.assinaturaCargo}</p>
                </div>
                <div className="text-left md:text-right bg-white p-3 rounded-lg border border-emerald-100 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1"><strong>Submetido a:</strong> {new Date(modalContrato.contrato_dados?.dataSubmissao).toLocaleString('pt-PT')}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Via: {modalContrato.contrato_dados?.ipAssinatura}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-4 justify-end items-center">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="bg-white border border-slate-300 text-slate-600 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleGuardarEdicao} disabled={savingEdit} className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-500 transition-transform hover:-translate-y-0.5 shadow-lg disabled:bg-slate-400 disabled:transform-none">
                    {savingEdit ? 'A Guardar...' : 'Guardar Alterações e Notificar Parceiro'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleAcaoContrato(modalContrato.id, 'Rejeitado')} className="bg-white border border-red-200 text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition-colors">
                    Rejeitar Parceiro
                  </button>
                  <button onClick={() => handleAcaoContrato(modalContrato.id, 'Aprovado')} className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-emerald-500 transition-transform hover:-translate-y-0.5 shadow-lg">
                    Validar e Aprovar Contrato
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";
import Link from "next/link";

export default function GestaoParceirosHQ({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal de Criação / Edição
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Dados do Formulário (Com Comissões e Status)
  const [form, setForm] = useState({
    id: "",
    nome_completo: "",
    email: "",
    password: "", // Apenas na criação
    empresa_nome: "",
    nif_empresa: "",
    telefone: "",
    taxa_comissao: "12", // 12% por defeito
    status_contrato: "Sem Contrato"
  });

  // Modal de Sucesso / Partilha
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeData, setWelcomeData] = useState({ nome: "", email: "", password: "", empresa: "" });

  const labelClass = "text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1 block";
  const inputClass = "w-full py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-colors shadow-sm placeholder:text-slate-400";
  const selectClass = "w-full py-3.5 px-4 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none appearance-none cursor-pointer focus:border-blue-600 focus:bg-white transition-colors shadow-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.8rem_auto] bg-[position:right_1rem_center] bg-no-repeat";

  const fetchParceiros = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfis')
      .select('id, empresa_nome, nome_completo, nif_empresa, email, telefone, status_contrato, taxa_comissao, created_at')
      .eq('role', 'organizador')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Erro ao ler parceiros:", error);
      alert("Erro ao ler a base de dados: " + error.message);
    } else {
      setParceiros(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchParceiros(); }, []);

  const abrirModalNovo = () => {
    // Gerar uma password segura aleatória por defeito
    const randomPass = Math.random().toString(36).slice(-8) + "Hk!";
    setForm({ 
      id: "", nome_completo: "", email: "", password: randomPass, 
      empresa_nome: "", nif_empresa: "", telefone: "", 
      taxa_comissao: "12", status_contrato: "Sem Contrato" 
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const abrirModalEditar = (p: any) => {
    setForm({
      id: p.id,
      nome_completo: p.nome_completo || "",
      email: p.email || "",
      password: "", // Não editamos password aqui
      empresa_nome: p.empresa_nome || "",
      nif_empresa: p.nif_empresa || "",
      telefone: p.telefone || "",
      taxa_comissao: p.taxa_comissao?.toString() || "12",
      status_contrato: p.status_contrato || "Sem Contrato"
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome_completo || !form.email || (!isEditing && !form.password)) {
      alert("Preencha os campos obrigatórios (Nome, Email e Password).");
      return;
    }

    setSaving(true);

    if (isEditing) {
      // ATUALIZAR PARCEIRO EXISTENTE
      const { error } = await supabase
        .from('perfis')
        .update({
          nome_completo: form.nome_completo,
          empresa_nome: form.empresa_nome || null,
          nif_empresa: form.nif_empresa || null,
          telefone: form.telefone || null,
          taxa_comissao: parseFloat(form.taxa_comissao) || 12,
          status_contrato: form.status_contrato
        })
        .eq('id', form.id);

      if (error) alert("Erro ao atualizar: " + error.message);
      else {
        alert("Parceiro atualizado com sucesso!");
        setShowModal(false);
        fetchParceiros();
      }
    } else {
      // CRIAR NOVO PARCEIRO (Auth + Perfil)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nome_completo: form.nome_completo,
            empresa_nome: form.empresa_nome || null,
            nif_empresa: form.nif_empresa || null,
            telefone: form.telefone || null,
            role: 'organizador',
            taxa_comissao: parseFloat(form.taxa_comissao) || 12,
            status_contrato: form.status_contrato
          }
        }
      });

      if (authError) {
        alert("Erro ao criar credenciais: " + authError.message);
      } else if (authData.user) {
        // Garantir gravação dos campos customizados
        await supabase.from('perfis').update({ 
            taxa_comissao: parseFloat(form.taxa_comissao) || 12,
            status_contrato: form.status_contrato 
        }).eq('id', authData.user.id);

        setShowModal(false);
        setWelcomeData({ nome: form.nome_completo, email: form.email, password: form.password, empresa: form.empresa_nome });
        setShowWelcomeModal(true);
        fetchParceiros();
      }
    }
    setSaving(false);
  };

  const handleRecuperarPassword = async (email: string) => {
    if (!window.confirm(`Enviar link de recuperação de password para ${email}?`)) return;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${lang}/admin/redefinir-password`,
    });

    if (error) alert("Erro ao enviar e-mail: " + error.message);
    else alert("E-mail de recuperação enviado com sucesso para o parceiro!");
  };

  const textoMensagem = `Olá ${welcomeData.nome.split(' ')[0]}! 🎉\n\nA sua conta de Parceiro Organizador na plataforma HelloCamp foi criada com sucesso.\n\nPara aceder ao painel de controlo, completar informações e rever o Acordo de Intermediação, utilize os seguintes dados temporários:\n\n🔗 Link de Acesso: https://hellocamp.pt/${lang}/admin/login\n✉️ E-mail: ${welcomeData.email}\n🔑 Password: ${welcomeData.password}\n\nRecomendamos que altere a password no seu perfil assim que entrar.\n\nQualquer dúvida, estamos à disposição!\nEquipa HelloCamp`;

  return (
    <div className="max-w-7xl mx-auto font-sans pb-16 px-4 md:px-0">
      
      {/* HEADER DA PÁGINA */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight m-0">Gestão de Parceiros</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Criação de Contas B2B e Acessos</p>
        </div>
        <button onClick={abrirModalNovo} className="bg-emerald-600 text-white px-6 py-3.5 rounded-xl text-xs uppercase tracking-widest font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
          <span>+</span> Criar Nova Entidade
        </button>
      </div>

      {/* TABELA DE PARCEIROS */}
      <div className="bg-white border border-slate-200 rounded-[1.5rem] overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Empresa / NIF</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contacto Responsável</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status / Fee</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações de Conta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">A carregar parceiros...</td></tr>
            ) : parceiros.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold text-sm">Nenhum parceiro organizador registado.</td></tr>
            ) : parceiros.map(p => {
              
              let statusLabel = "Sem Contrato";
              let statusColor = "bg-slate-100 text-slate-600 border-slate-200";
              if (p.status_contrato === 'Aprovado') { statusLabel = "Aprovado"; statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200"; }
              else if (p.status_contrato === 'Pendente de Revisão' || p.status_contrato === 'Pendente') { statusLabel = "Pendente"; statusColor = "bg-amber-100 text-amber-800 border-amber-200"; }
              else if (p.status_contrato === 'Rejeitado') { statusLabel = "Rejeitado"; statusColor = "bg-red-100 text-red-800 border-red-200"; }

              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-black text-sm text-slate-900">{p.empresa_nome || <span className="text-slate-400 italic">Por definir</span>}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">{p.nif_empresa ? `NIF: ${p.nif_empresa}` : 'NIF não preenchido'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800">{p.nome_completo || 'Sem Nome'}</div>
                    <div className="text-[10px] font-bold text-blue-600 mt-1 break-all">{p.email}</div>
                    {p.telefone && <div className="text-[10px] font-bold text-slate-500 mt-0.5">📞 {p.telefone}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm ${statusColor}`}>
                        {statusLabel}
                      </span>
                      <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                        {p.taxa_comissao || 12}% Fee
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button onClick={() => abrirModalEditar(p)} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black hover:bg-slate-50 transition-colors shadow-sm">
                        Editar Info
                      </button>
                      <button onClick={() => handleRecuperarPassword(p.email)} className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black hover:bg-blue-100 transition-colors shadow-sm">
                        Reset Pass
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL CRIAR/EDITAR PARCEIRO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[2rem] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
              <h2 className="text-xl font-black text-slate-900 m-0 tracking-tight">
                {isEditing ? 'Editar Parceiro' : 'Criar Conta de Parceiro'}
              </h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 flex items-center justify-center font-black transition-colors">&times;</button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
              <form id="partner-form" onSubmit={handleSubmeter} className="space-y-8">
                
                {/* CREDENCIAIS E ACESSO */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-5 border-b border-slate-100 pb-3">1. Credenciais de Acesso</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Nome do Responsável *</label>
                      <input required className={inputClass} value={form.nome_completo} onChange={e => setForm({...form, nome_completo: e.target.value})} placeholder="Ex: João Silva" />
                    </div>
                    <div>
                      <label className={labelClass}>E-mail de Login *</label>
                      <input type="email" required disabled={isEditing} className={`${inputClass} ${isEditing ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : ''}`} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="geral@empresa.pt" />
                    </div>
                    {!isEditing && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>Password Temporária *</label>
                        <input required minLength={6} className={inputClass} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-1">O parceiro poderá alterar a password no dashboard.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* GESTÃO COMERCIAL B2B */}
                <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200 shadow-sm">
                  <h3 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-5 border-b border-amber-200/50 pb-3">2. Gestão Comercial (Uso Interno)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Taxa de Comissão Base (%) *</label>
                      <div className="relative">
                        <input type="number" step="0.1" required className={inputClass} value={form.taxa_comissao} onChange={e => setForm({...form, taxa_comissao: e.target.value})} />
                        <span className="absolute right-4 top-3.5 text-slate-400 font-black">%</span>
                      </div>
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mt-2 ml-1">Aplicada transversalmente aos campos.</p>
                    </div>
                    <div>
                      <label className={labelClass}>Status do Contrato B2B *</label>
                      <select required className={selectClass} value={form.status_contrato} onChange={e => setForm({...form, status_contrato: e.target.value})}>
                        <option value="Sem Contrato">Sem Contrato</option>
                        <option value="Pendente de Revisão">Pendente de Revisão</option>
                        <option value="Aprovado">Aprovado (Permite Publicar Campos)</option>
                        <option value="Rejeitado">Bloqueado / Rejeitado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* DADOS FISCAIS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5 border-b border-slate-100 pb-3 flex justify-between items-center">
                    3. Informações Fiscais <span className="text-[9px] bg-slate-100 px-2 py-1 rounded text-slate-400">Opcional</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Entidade / Empresa</label>
                      <input className={inputClass} value={form.empresa_nome} onChange={e => setForm({...form, empresa_nome: e.target.value})} placeholder="Ex: Surf Camp Lda" />
                    </div>
                    <div>
                      <label className={labelClass}>NIF</label>
                      <input className={inputClass} value={form.nif_empresa} onChange={e => setForm({...form, nif_empresa: e.target.value})} placeholder="Ex: 500000000" />
                    </div>
                    <div>
                      <label className={labelClass}>Telefone / Telemóvel</label>
                      <input className={inputClass} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} placeholder="Ex: +351 910 000 000" />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="px-8 py-5 border-t border-slate-200 bg-white flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setShowModal(false)} className="bg-white border border-slate-300 text-slate-700 font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">Cancelar</button>
              <button type="submit" form="partner-form" disabled={saving} className="bg-[#0E3A68] text-white font-black px-8 py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-[#0E3A68]/30 hover:bg-[#0b2b4d] disabled:opacity-50 transition-all hover:-translate-y-0.5">
                {saving ? 'A processar...' : isEditing ? 'Gravar Alterações' : 'Criar Parceiro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUCESSO - PARTILHA ONBOARDING */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] flex flex-col overflow-hidden shadow-2xl">
            
            <div className="bg-emerald-500 p-8 text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400 rounded-full blur-2xl opacity-50"></div>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-emerald-700/20 relative z-10">🎉</div>
              <h2 className="text-2xl font-black text-white m-0 tracking-tight relative z-10">Conta Criada com Sucesso!</h2>
              <p className="text-emerald-50 text-sm mt-2 font-medium relative z-10">O parceiro <strong>{welcomeData.empresa || welcomeData.nome}</strong> já pode aceder ao portal.</p>
            </div>
            
            <div className="p-8">
              <p className="text-sm font-bold text-slate-700 mb-4 text-center">
                Envie as credenciais ao parceiro para que ele inicie o Onboarding:
              </p>
              
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner">
                <textarea 
                  readOnly 
                  className="w-full h-48 bg-transparent border-none resize-none text-sm font-medium text-slate-700 outline-none leading-relaxed" 
                  value={textoMensagem}
                />
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => { navigator.clipboard.writeText(textoMensagem); alert("Mensagem copiada para a área de transferência!"); }} 
                  className="flex-1 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-4 py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  📋 Copiar Texto
                </button>
                <a 
                  href={`mailto:${welcomeData.email}?subject=${encodeURIComponent('Acesso ao Portal de Parceiros HelloCamp')}&body=${encodeURIComponent(textoMensagem)}`}
                  className="flex-1 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] px-4 py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-center decoration-transparent"
                >
                  ✉️ E-mail
                </a>
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(textoMensagem)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 bg-[#25D366] text-white font-black uppercase tracking-widest text-[10px] px-4 py-4 rounded-xl shadow-lg hover:bg-[#20bd5a] transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-center decoration-transparent"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 text-center">
              <button onClick={() => setShowWelcomeModal(false)} className="text-slate-500 hover:text-slate-900 text-xs font-black uppercase tracking-widest underline transition-colors">Fechar e voltar à gestão</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
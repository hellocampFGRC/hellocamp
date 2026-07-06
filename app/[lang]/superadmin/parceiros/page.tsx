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
  
  // Dados do Formulário
  const [form, setForm] = useState({
    id: "",
    nome_completo: "",
    email: "",
    password: "", // Apenas na criação
    empresa_nome: "",
    nif_empresa: "",
    telefone: ""
  });

  // Modal de Sucesso / Partilha
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeData, setWelcomeData] = useState({ nome: "", email: "", password: "", empresa: "" });

  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block";
  const inputClass = "w-full py-2 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:border-gray-800 transition-all shadow-sm";

  const fetchParceiros = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfis')
      .select('id, empresa_nome, nome_completo, nif_empresa, email, telefone, status_contrato, created_at')
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
    setForm({ id: "", nome_completo: "", email: "", password: randomPass, empresa_nome: "", nif_empresa: "", telefone: "" });
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
      telefone: p.telefone || ""
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
          telefone: form.telefone || null
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
            role: 'organizador'
          }
        }
      });

      if (authError) {
        alert("Erro ao criar credenciais: " + authError.message);
      } else if (authData.user) {
        // Sucesso!
        setShowModal(false);
        setWelcomeData({
          nome: form.nome_completo,
          email: form.email,
          password: form.password,
          empresa: form.empresa_nome
        });
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

  // Texto gerado automaticamente para enviar por E-mail ou WhatsApp
  const textoMensagem = `Olá ${welcomeData.nome.split(' ')[0]}! 🎉\n\nA tua conta de parceiro na plataforma HelloCamp já foi criada com sucesso.\n\nPara acederes ao teu painel de controlo, completares as tuas informações e reveres o teu Contrato Global, utiliza os seguintes dados temporários:\n\n🔗 Link de Acesso: https://hellocamp.pt/${lang}/admin/login\n✉️ E-mail: ${welcomeData.email}\n🔑 Password: ${welcomeData.password}\n\nRecomendamos que alteres a password no teu perfil assim que entrares.\n\nQualquer dúvida, estamos por aqui!\nEquipa HelloCamp`;

  return (
    <div className="max-w-7xl mx-auto font-sans pb-16">
      
      {/* HEADER DA PÁGINA */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight m-0">Gestão de Parceiros</h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Criação de Contas B2B e Acessos</p>
        </div>
        <button onClick={abrirModalNovo} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-md hover:bg-emerald-700 transition-colors flex items-center gap-2">
          <span>+</span> Criar Novo Parceiro
        </button>
      </div>

      {/* TABELA DE PARCEIROS */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Empresa / NIF</th>
              <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Contacto Responsável</th>
              <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status B2B</th>
              <th className="px-5 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Ações de Conta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-bold text-sm animate-pulse">A carregar parceiros...</td></tr>
            ) : parceiros.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-bold text-sm">Nenhum parceiro organizador registado.</td></tr>
            ) : parceiros.map(p => {
              
              let statusLabel = "Sem Contrato";
              let statusColor = "bg-gray-100 text-gray-600 border-gray-200";
              if (p.status_contrato === 'Aprovado') { statusLabel = "Aprovado"; statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200"; }
              else if (p.status_contrato === 'Pendente de Revisão' || p.status_contrato === 'Pendente') { statusLabel = "Pendente"; statusColor = "bg-amber-100 text-amber-800 border-amber-200"; }
              else if (p.status_contrato === 'Rejeitado') { statusLabel = "Rejeitado"; statusColor = "bg-red-100 text-red-800 border-red-200"; }

              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-black text-sm text-gray-900">{p.empresa_nome || <span className="text-gray-400 italic">Por definir</span>}</div>
                    <div className="text-[10px] font-mono text-gray-500 mt-1">{p.nif_empresa ? `NIF: ${p.nif_empresa}` : 'NIF não preenchido'}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-bold text-gray-800">{p.nome_completo || 'Sem Nome'}</div>
                    <div className="text-[10px] font-medium text-blue-600 mt-1 break-all">{p.email}</div>
                    {p.telefone && <div className="text-[10px] font-bold text-gray-500 mt-0.5">📞 {p.telefone}</div>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button onClick={() => abrirModalEditar(p)} className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-gray-50 transition-colors shadow-sm">
                        Editar Info
                      </button>
                      <button onClick={() => handleRecuperarPassword(p.email)} className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-colors shadow-sm">
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
        <div className="fixed inset-0 bg-gray-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
              <h2 className="text-lg font-black text-gray-900 m-0 uppercase tracking-wide">
                {isEditing ? 'Editar Informações do Parceiro' : 'Criar Nova Conta de Parceiro'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900 text-2xl font-bold">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="partner-form" onSubmit={handleSubmeter} className="space-y-6">
                
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <h3 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-4 border-b border-blue-100 pb-2">Credenciais de Acesso (Obrigatório)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Nome do Responsável *</label>
                      <input required className={inputClass} value={form.nome_completo} onChange={e => setForm({...form, nome_completo: e.target.value})} placeholder="Ex: João Silva" />
                    </div>
                    <div>
                      <label className={labelClass}>E-mail de Login *</label>
                      <input type="email" required disabled={isEditing} className={`${inputClass} ${isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="geral@empresa.pt" />
                    </div>
                    {!isEditing && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>Password Temporária *</label>
                        <input required minLength={6} className={inputClass} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                        <p className="text-[10px] text-gray-500 mt-1">O parceiro poderá alterar esta password depois de fazer login.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                     <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest m-0">Informações Fiscais e Empresa</h3>
                     <span className="text-[10px] font-bold text-gray-400 uppercase">Opcional</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Nome da Empresa / Marca</label>
                      <input className={inputClass} value={form.empresa_nome} onChange={e => setForm({...form, empresa_nome: e.target.value})} placeholder="Ex: Surf Camp Lda" />
                    </div>
                    <div>
                      <label className={labelClass}>NIF da Empresa</label>
                      <input className={inputClass} value={form.nif_empresa} onChange={e => setForm({...form, nif_empresa: e.target.value})} placeholder="Ex: 500000000" />
                    </div>
                    <div>
                      <label className={labelClass}>Telefone / Telemóvel</label>
                      <input className={inputClass} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} placeholder="Ex: +351 910 000 000" />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-3 text-center">O parceiro poderá preencher ou retificar estes dados quando assinar o Contrato Global no portal dele.</p>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setShowModal(false)} className="bg-white border border-gray-300 text-gray-700 font-bold px-5 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors">Cancelar</button>
              <button type="submit" form="partner-form" disabled={saving} className="bg-gray-900 text-white font-black px-6 py-2 rounded-lg text-sm shadow-md hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {saving ? 'A guardar...' : isEditing ? 'Guardar Alterações' : 'Criar Conta de Parceiro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUCESSO - MENSAGEM */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-gray-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-emerald-500 p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">🎉</div>
              <h2 className="text-xl font-black text-white m-0">Conta Criada com Sucesso!</h2>
              <p className="text-emerald-100 text-sm mt-1">O parceiro {welcomeData.empresa || welcomeData.nome} já tem acesso.</p>
            </div>
            
            <div className="p-6">
              <p className="text-sm font-bold text-gray-700 mb-3 text-center">
                Envie as credenciais ao parceiro para que ele possa entrar na plataforma:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                <textarea 
                  readOnly 
                  className="w-full h-48 bg-transparent border-none resize-none text-sm text-gray-700 outline-none leading-relaxed" 
                  value={textoMensagem}
                />
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(textoMensagem);
                    alert("Mensagem copiada para a área de transferência!");
                  }} 
                  className="flex-1 bg-gray-900 text-white font-black px-4 py-3 rounded-xl shadow-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  📋 Copiar Texto
                </button>
                <a 
                  href={`mailto:${welcomeData.email}?subject=${encodeURIComponent('Acesso ao Portal de Parceiros HelloCamp')}&body=${encodeURIComponent(textoMensagem)}`}
                  className="flex-1 bg-blue-600 text-white font-black px-4 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-center decoration-transparent"
                >
                  ✉️ E-mail
                </a>
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(textoMensagem)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#25D366] text-white font-black px-4 py-3 rounded-xl shadow-md hover:bg-[#20bd5a] transition-colors flex items-center justify-center gap-2 text-center decoration-transparent"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
              <button onClick={() => setShowWelcomeModal(false)} className="text-gray-500 hover:text-gray-900 text-sm font-bold underline">Fechar e voltar à gestão</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
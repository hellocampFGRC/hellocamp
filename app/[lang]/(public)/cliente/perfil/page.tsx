"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

export default function PerfilPaiPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);

  useEffect(() => {
    const carregarPerfil = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase.from('perfis').select('*').eq('id', session.user.id).single();
      if (data) setPerfil(data);
      setLoading(false);
    };
    carregarPerfil();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session && perfil) {
      const { error } = await supabase.from('perfis').update({
        nome_completo: perfil.nome_completo,
        telefone: perfil.telefone,
        nif: perfil.nif,
        contacto_emergencia: perfil.contacto_emergencia,
        pessoas_autorizadas_recolha: perfil.pessoas_autorizadas_recolha
      }).eq('id', session.user.id);
      
      if (error) alert((isEn ? "Save error: " : "Erro ao guardar: ") + error.message);
      else alert(isEn ? "Profile updated successfully!" : "Os seus dados foram atualizados com sucesso!");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">{isEn ? 'Loading profile...' : 'A carregar o seu perfil...'}</div>;

  return (
    <main className="max-w-[850px] mx-auto font-sans pb-24">
      
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 m-0 tracking-tight">
          {isEn ? 'Profile & Security' : 'O Meu Perfil e Segurança'}
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">
          {isEn ? 'Manage your contact details and authorized pickup persons.' : 'Gira os seus contactos e defina quem está autorizado a recolher os seus educandos no final do dia.'}
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-8">
        
        {/* DADOS PESSOAIS */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <h2 className="text-base font-black text-slate-900 mb-6 pb-4 border-b border-slate-100 flex items-center gap-3 uppercase tracking-widest">
            <span className="text-2xl">👤</span> {isEn ? 'Personal Details' : 'Os Seus Dados'}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{isEn ? 'Full Name' : 'Nome Completo'}</label>
              <input type="text" value={perfil?.nome_completo || ''} onChange={e => setPerfil({...perfil, nome_completo: e.target.value})} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white transition-colors" />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{isEn ? 'Email (Login)' : 'E-mail (Login e Notificações)'}</label>
              <input type="email" value={perfil?.email || ''} disabled className="w-full p-4 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed outline-none" />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{isEn ? 'Phone Number' : 'Telefone / Telemóvel'}</label>
              <input type="tel" value={perfil?.telefone || ''} onChange={e => setPerfil({...perfil, telefone: e.target.value})} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white transition-colors" />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{isEn ? 'Tax ID (Billing)' : 'NIF (Faturação IRS)'}</label>
              <input type="text" value={perfil?.nif || ''} onChange={e => setPerfil({...perfil, nif: e.target.value})} placeholder={isEn ? "For receipt issuance" : "Para emissão de faturas"} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#0E3A68] focus:bg-white transition-colors" />
            </div>
          </div>
        </div>

        {/* SEGURANÇA E RECOLHA */}
        <div className="bg-red-50 p-6 md:p-8 rounded-[2rem] border border-red-100 shadow-sm">
          <h2 className="text-base font-black text-red-800 mb-6 pb-4 border-b border-red-200/50 flex items-center gap-3 uppercase tracking-widest">
            <span className="text-2xl bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-sm">🛡️</span> 
            {isEn ? 'Security & Emergency' : 'Segurança e Recolha'}
          </h2>
          
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-[11px] font-black text-red-800 uppercase tracking-widest mb-1.5 ml-1">{isEn ? 'Emergency Contact (Name & Phone)' : 'Contacto de Emergência Alternativo'} *</label>
              <p className="text-xs font-bold text-red-600 mb-3 ml-1">{isEn ? 'Who should we call if we cannot reach you?' : 'A quem deve o campo ligar num cenário de SOS caso não consigam contactar o encarregado de educação principal?'}</p>
              <input type="text" value={perfil?.contacto_emergencia || ''} onChange={e => setPerfil({...perfil, contacto_emergencia: e.target.value})} required placeholder={isEn ? "E.g.: Grandma Mary - 912 345 678" : "Ex: Avó Maria - 912 345 678"} className="w-full p-4 bg-white border border-red-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-red-500 transition-colors shadow-sm" />
            </div>

            <div className="border-t border-red-200/50 pt-6">
              <label className="block text-[11px] font-black text-red-800 uppercase tracking-widest mb-1.5 ml-1">{isEn ? 'Authorized Pickup Persons' : 'Pessoas Autorizadas na Recolha'} *</label>
              <p className="text-xs font-bold text-red-600 mb-3 ml-1 leading-relaxed">{isEn ? 'List names and ID numbers. For security reasons, camps may require identification on site.' : 'Liste os Nomes e números de Cartão de Cidadão das pessoas autorizadas. Por motivos de segurança e rapto parental, os campos podem exigir identificação no local e recusar a entrega da criança a pessoas não listadas nesta caixa.'}</p>
              <textarea 
                rows={4} 
                value={perfil?.pessoas_autorizadas_recolha || ''} 
                onChange={e => setPerfil({...perfil, pessoas_autorizadas_recolha: e.target.value})} 
                required 
                placeholder={isEn ? "E.g.: John Doe (Father) - ID: 12345678" : "Ex: João Silva (Pai) - CC: 12345678, Avó Margarida - CC: 87654321"} 
                className="w-full p-4 bg-white border border-red-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-red-500 transition-colors shadow-sm resize-none"
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving} 
          className="mt-4 p-5 bg-[#0E3A68] hover:bg-[#0b2b4d] text-white font-black uppercase tracking-widest rounded-2xl border-none cursor-pointer text-sm shadow-xl shadow-[#0E3A68]/30 transition-all hover:-translate-y-1 disabled:opacity-50"
        >
          {saving ? (isEn ? 'Saving data...' : 'A guardar...') : (isEn ? 'Save Profile' : 'Gravar Alterações e Segurança')}
        </button>
      </form>
    </main>
  );
}
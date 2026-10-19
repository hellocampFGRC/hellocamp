"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

const selectClass = "w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#0E3A68] focus:bg-white appearance-none cursor-pointer transition-colors shadow-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.8rem_auto] bg-[position:right_1rem_center] bg-no-repeat";
const inputClass = "w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#0E3A68] focus:bg-white transition-colors shadow-sm placeholder-slate-400";
const labelClass = "block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2";

export default function EditarCrianca({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const isModoCriacao = id === 'novo';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({ 
    nome: '', nif: '', data_nascimento: '', sexo: '', tipo_sanguineo: '',
    restricoes_alimentares: '', doencas_cronicas: '', medicacao_regular: '', limitacoes_fisicas: '',
    sabe_nadar: '', sabe_andar_bicicleta: '', tamanho_tshirt: '',
    autorizacao_fotografia: '', nivel_ingles: '', fobias_medos: '', perfil_comportamental: ''
  });

  useEffect(() => {
    const fetchCrianca = async () => {
      if (isModoCriacao) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.from('criancas').select('*').eq('id', id).single();
      if (data) {
        setFormData({ 
          nome: data.nome || '', nif: data.nif || '', data_nascimento: data.data_nascimento || '',
          sexo: data.sexo || '', tipo_sanguineo: data.tipo_sanguineo || '',
          restricoes_alimentares: data.restricoes_alimentares || '', doencas_cronicas: data.doencas_cronicas || '',
          medicacao_regular: data.medicacao_regular || '', limitacoes_fisicas: data.limitacoes_fisicas || '',
          sabe_nadar: data.sabe_nadar || '', sabe_andar_bicicleta: data.sabe_andar_bicicleta || '',
          tamanho_tshirt: data.tamanho_tshirt || '', autorizacao_fotografia: data.autorizacao_fotografia || '',
          nivel_ingles: data.nivel_ingles || '', fobias_medos: data.fobias_medos || '',
          perfil_comportamental: data.perfil_comportamental || ''
        });
      }
      setLoading(false);
    };
    fetchCrianca();
  }, [id, isModoCriacao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");

      if (isModoCriacao) {
        const { error } = await supabase.from('criancas').insert({ cliente_id: session.user.id, ...formData });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('criancas').update(formData).eq('id', id);
        if (error) throw error;
      }

      alert(isEn ? 'Profile saved successfully!' : 'Perfil guardado com sucesso!');
      router.push(`/${lang}/cliente/criancas`);
    } catch (err: any) { alert('Erro ao guardar: ' + err.message); } 
    finally { setSaving(false); }
  };

  const handleApagar = async () => {
    if (!window.confirm(isEn ? 'Are you sure you want to delete this profile?' : 'Tem a certeza que deseja apagar o perfil do seu filho(a)? O histórico poderá ser perdido.')) return;
    await supabase.from('criancas').delete().eq('id', id);
    router.push(`/${lang}/cliente/criancas`);
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest text-xs animate-pulse">{isEn ? 'Loading profile...' : 'A preparar ficha...'}</div>;

  return (
    <div className="max-w-[850px] mx-auto pb-24 font-sans">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <Link href={`/${lang}/cliente/criancas`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors bg-white px-5 py-2.5 rounded-full border border-slate-200 shadow-sm no-underline">
          &larr; {isEn ? 'Back to list' : 'Voltar à lista'}
        </Link>
        
        {!isModoCriacao && (
          <button type="button" onClick={handleApagar} className="text-red-500 hover:bg-red-50 border border-red-200 hover:border-red-300 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer w-full sm:w-auto">
            {isEn ? 'Delete Profile' : 'Apagar Perfil'}
          </button>
        )}
      </div>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 m-0 tracking-tight">
          {isModoCriacao ? (isEn ? 'New Participant' : 'Novo Participante') : (isEn ? 'Edit Profile' : 'Ficha de Participante')}
        </h1>
        <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">
          {isEn ? 'Keep this data updated to ensure maximum safety during the camps.' : 'Mantenha estes dados atualizados para garantir a máxima segurança dos organizadores.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        
        {/* BLOCO 1: IDENTIFICAÇÃO */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <span className="text-2xl bg-slate-100 w-10 h-10 flex items-center justify-center rounded-full">👦</span>
            <h2 className="text-base font-black text-slate-900 m-0 uppercase tracking-widest">
              1. {isEn ? 'Basic Identification' : 'Identificação Básica'}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>{isEn ? 'Full Name' : 'Nome Completo'} <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className={inputClass} placeholder="Nome do participante" />
            </div>
            <div>
              <label className={labelClass}>{isEn ? 'Date of Birth' : 'Data de Nascimento'} <span className="text-red-500">*</span></label>
              <input type="date" required value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{isEn ? 'Gender' : 'Sexo'} <span className="text-red-500">*</span></label>
              <select required value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} className={selectClass}>
                <option value="">Selecione...</option>
                <option value="Masculino">{isEn ? 'Male' : 'Masculino'}</option>
                <option value="Feminino">{isEn ? 'Female' : 'Feminino'}</option>
                <option value="Prefiro não dizer">{isEn ? 'Prefer not to say' : 'Prefiro não dizer'}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>{isEn ? 'Tax ID (NIF)' : 'NIF da Criança'}</label>
              <input type="text" value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} className={inputClass} placeholder={isEn ? "Optional (For invoices)" : "Opcional (Para emissão de faturas e deduções no IRS)"} />
            </div>
          </div>
        </div>

        {/* BLOCO 2: CLÍNICO */}
        <div className="bg-red-50 p-6 md:p-8 rounded-[2rem] border border-red-100 shadow-sm">
          <div className="flex items-center gap-3 border-b border-red-200/50 pb-4 mb-6">
            <span className="text-2xl bg-white text-red-500 w-10 h-10 flex items-center justify-center rounded-full shadow-sm">🏥</span>
            <h2 className="text-base font-black text-red-900 m-0 uppercase tracking-widest">
              2. {isEn ? 'Medical & Safety Profile' : 'Perfil Clínico e Segurança'}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="md:w-1/2">
              <label className={`${labelClass} !text-red-800`}>{isEn ? 'Blood Type' : 'Tipo Sanguíneo'}</label>
              <select value={formData.tipo_sanguineo} onChange={e => setFormData({...formData, tipo_sanguineo: e.target.value})} className={`${selectClass} !border-red-200 !bg-white focus:!border-red-500`}>
                <option value="">{isEn ? 'Unknown / Not declared' : 'Desconhecido / Não declarado'}</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className={`${labelClass} !text-red-800`}>{isEn ? 'Food Allergies or Dietary Restrictions' : 'Alergias ou Restrições Alimentares'}</label>
              <input type="text" value={formData.restricoes_alimentares} onChange={e => setFormData({...formData, restricoes_alimentares: e.target.value})} placeholder={isEn ? 'E.g.: Peanuts, Lactose intolerant, Vegan...' : 'Ex: Amendoins, Intolerante à lactose, Celíaco, Nenhuma...'} className={`${inputClass} !border-red-200 !bg-white focus:!border-red-500`} />
            </div>
            <div>
              <label className={`${labelClass} !text-red-800`}>{isEn ? 'Chronic Diseases or Conditions' : 'Doenças Crónicas ou Condições Médicas'}</label>
              <input type="text" value={formData.doencas_cronicas} onChange={e => setFormData({...formData, doencas_cronicas: e.target.value})} placeholder={isEn ? 'E.g.: Asthma, Diabetes, Heart condition...' : 'Ex: Asma, Diabetes, Nenhuma...'} className={`${inputClass} !border-red-200 !bg-white focus:!border-red-500`} />
            </div>
            <div>
              <label className={`${labelClass} !text-red-800`}>{isEn ? 'Regular Medication' : 'Medicação Regular'}</label>
              <input type="text" value={formData.medicacao_regular} onChange={e => setFormData({...formData, medicacao_regular: e.target.value})} placeholder={isEn ? 'E.g.: Needs inhaler during sports...' : 'Ex: Toma anti-histamínico de manhã...'} className={`${inputClass} !border-red-200 !bg-white focus:!border-red-500`} />
            </div>
            <div>
              <label className={`${labelClass} !text-red-800`}>{isEn ? 'Physical Limitations' : 'Limitações Físicas'}</label>
              <input type="text" value={formData.limitacoes_fisicas} onChange={e => setFormData({...formData, limitacoes_fisicas: e.target.value})} placeholder={isEn ? 'E.g.: Cannot do high-impact sports...' : 'Ex: Não pode fazer desportos de alto impacto...'} className={`${inputClass} !border-red-200 !bg-white focus:!border-red-500`} />
            </div>
          </div>
        </div>

        {/* BLOCO 3: LOGÍSTICA */}
        <div className="bg-blue-50 p-6 md:p-8 rounded-[2rem] border border-blue-100 shadow-sm">
          <div className="flex items-center gap-3 border-b border-blue-200/50 pb-4 mb-6">
            <span className="text-2xl bg-white text-blue-600 w-10 h-10 flex items-center justify-center rounded-full shadow-sm">🎒</span>
            <h2 className="text-base font-black text-blue-900 m-0 uppercase tracking-widest">
              3. {isEn ? 'Skills & Logistics' : 'Competências e Logística'}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`${labelClass} !text-blue-800`}>{isEn ? 'Knows how to swim?' : 'Sabe nadar?'}</label>
              <select value={formData.sabe_nadar} onChange={e => setFormData({...formData, sabe_nadar: e.target.value})} className={`${selectClass} !border-blue-200 !bg-white focus:!border-blue-500`}>
                <option value="">{isEn ? 'Not answered' : 'Não respondido'}</option>
                <option value="Sim, perfeitamente">{isEn ? 'Yes, perfectly' : 'Sim, perfeitamente'}</option>
                <option value="O básico (com pé)">{isEn ? 'Basics only' : 'O básico (precisa de pé)'}</option>
                <option value="Não">{isEn ? 'No' : 'Não'}</option>
              </select>
            </div>

            <div>
              <label className={`${labelClass} !text-blue-800`}>{isEn ? 'Rides a bicycle?' : 'Sabe andar de bicicleta?'}</label>
              <select value={formData.sabe_andar_bicicleta} onChange={e => setFormData({...formData, sabe_andar_bicicleta: e.target.value})} className={`${selectClass} !border-blue-200 !bg-white focus:!border-blue-500`}>
                <option value="">{isEn ? 'Not answered' : 'Não respondido'}</option>
                <option value="Sim">{isEn ? 'Yes' : 'Sim'}</option>
                <option value="Sim, mas com rodinhas">{isEn ? 'Yes, with training wheels' : 'Sim, mas com rodinhas'}</option>
                <option value="Não">{isEn ? 'No' : 'Não'}</option>
              </select>
            </div>

            <div>
              <label className={`${labelClass} !text-blue-800`}>{isEn ? 'T-Shirt Size (For gifts)' : 'Tamanho de T-Shirt (Brindes)'}</label>
              <select value={formData.tamanho_tshirt} onChange={e => setFormData({...formData, tamanho_tshirt: e.target.value})} className={`${selectClass} !border-blue-200 !bg-white focus:!border-blue-500`}>
                <option value="">{isEn ? 'Not answered' : 'Não respondido'}</option>
                <option value="5-6 Anos">5-6 Anos</option>
                <option value="7-8 Anos">7-8 Anos</option>
                <option value="9-11 Anos">9-11 Anos</option>
                <option value="12-14 Anos">12-14 Anos</option>
                <option value="S Adulto">S (Adulto)</option>
                <option value="M Adulto">M (Adulto)</option>
                <option value="L Adulto">L (Adulto)</option>
              </select>
            </div>

            <div>
              <label className={`${labelClass} !text-blue-800`}>{isEn ? 'English Level' : 'Nível de Inglês'}</label>
              <select value={formData.nivel_ingles} onChange={e => setFormData({...formData, nivel_ingles: e.target.value})} className={`${selectClass} !border-blue-200 !bg-white focus:!border-blue-500`}>
                <option value="">{isEn ? 'Not answered' : 'Não respondido'}</option>
                <option value="Nenhum">Nenhum</option>
                <option value="Básico">Básico</option>
                <option value="Intermédio">Intermédio</option>
                <option value="Avançado / Fluente">Avançado / Fluente</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={`${labelClass} !text-blue-800`}>{isEn ? 'Fears or Phobias' : 'Fobias ou Medos Conhecidos'}</label>
              <input type="text" value={formData.fobias_medos} onChange={e => setFormData({...formData, fobias_medos: e.target.value})} placeholder={isEn ? 'E.g.: Fear of dogs, heights, darkness...' : 'Ex: Medo de alturas, água funda, escuro...'} className={`${inputClass} !border-blue-200 !bg-white focus:!border-blue-500`} />
            </div>

            <div className="md:col-span-2">
              <label className={`${labelClass} !text-blue-800`}>{isEn ? 'Personality Traits' : 'Perfil Comportamental / Personalidade'}</label>
              <input type="text" value={formData.perfil_comportamental} onChange={e => setFormData({...formData, perfil_comportamental: e.target.value})} placeholder={isEn ? 'E.g.: Very shy, energetic, natural leader...' : 'Ex: Criança tímida, muito ativa, necessita de rotinas...'} className={`${inputClass} !border-blue-200 !bg-white focus:!border-blue-500`} />
            </div>

            <div className="md:col-span-2 p-5 bg-white rounded-xl border border-blue-200 mt-2 shadow-sm">
              <label className="flex items-center gap-4 cursor-pointer group">
                <input type="checkbox" checked={formData.autorizacao_fotografia === 'Sim'} onChange={e => setFormData({...formData, autorizacao_fotografia: e.target.checked ? 'Sim' : 'Não'})} className="w-6 h-6 accent-[#0E3A68] flex-shrink-0 cursor-pointer" />
                <span className="text-sm text-blue-900 font-bold group-hover:text-[#0E3A68] transition-colors leading-relaxed">
                  {isEn ? 'I authorize the capture of images/video for the camp’s internal updates and marketing.' : 'Autorizo a captação de imagem/vídeo exclusiva para atualizações de segurança aos pais e marketing do campo.'}
                </span>
              </label>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving} 
          className="w-full mt-4 p-5 bg-[#0E3A68] text-white font-black uppercase tracking-widest rounded-[1.5rem] border-none cursor-pointer text-base hover:bg-[#0b2b4d] transition-all shadow-xl shadow-[#0E3A68]/30 disabled:opacity-50 hover:-translate-y-1"
        >
          {saving ? (isEn ? 'Saving profile...' : 'A guardar perfil...') : (isEn ? 'Save Security Profile' : 'Gravar Ficha de Participante')}
        </button>
      </form>
    </div>
  );
}
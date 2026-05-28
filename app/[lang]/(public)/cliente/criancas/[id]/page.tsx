"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function EditarCrianca({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ nome: '', nif: '', restricoes_alimentares: '', data_nascimento: '', sexo: '' });

  useEffect(() => {
    const fetchCrianca = async () => {
      const { data } = await supabase.from('criancas').select('*').eq('id', id).single();
      if (data) {
        setFormData({ 
          nome: data.nome || '', 
          nif: data.nif || '', 
          restricoes_alimentares: data.restricoes_alimentares || '',
          data_nascimento: data.data_nascimento || '',
          sexo: data.sexo || ''
        });
      }
      setLoading(false);
    };
    fetchCrianca();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('criancas').update(formData).eq('id', id);
    if (!error) {
      alert(isEn ? 'Saved successfully!' : 'Guardado com sucesso!');
      router.push(`/${lang}/cliente/criancas`);
    } else {
      alert('Erro: ' + error.message);
      setSaving(false);
    }
  };

  const handleApagar = async () => {
    if (!window.confirm(isEn ? 'Are you sure you want to delete this profile?' : 'Tem a certeza que deseja apagar o perfil do seu filho(a)?')) return;
    await supabase.from('criancas').delete().eq('id', id);
    router.push(`/${lang}/cliente/criancas`);
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>A carregar perfil...</div>;

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      <Link href={`/${lang}/cliente/criancas`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#64748b', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
        &larr; {isEn ? 'Back to list' : 'Voltar à lista'}
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>{isEn ? 'Edit Profile' : 'Editar Perfil'}</h1>
        <button type="button" onClick={handleApagar} style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #fecaca', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
          {isEn ? 'Delete Profile' : 'Apagar Perfil'}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <label style={labelStyle}>{isEn ? 'Full Name' : 'Nome Completo'} *</label>
          <input type="text" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <label style={labelStyle}>{isEn ? 'Date of Birth' : 'Data de Nascimento'} *</label>
            <input type="date" required value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>{isEn ? 'Gender' : 'Sexo'} *</label>
            <select required value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})} style={selectStyle}>
              <option value="">Selecione...</option>
              <option value="Masculino">{isEn ? 'Male' : 'Masculino'}</option>
              <option value="Feminino">{isEn ? 'Female' : 'Feminino'}</option>
              <option value="Prefiro não dizer">{isEn ? 'Prefer not to say' : 'Prefiro não dizer'}</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>{isEn ? 'NIF' : 'NIF da Criança'}</label>
          <input type="text" value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} style={inputStyle} placeholder="Opcional" />
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
          <label style={labelStyle}>
            {isEn ? 'Medical or Dietary Restrictions' : 'Alergias ou Restrições Alimentares'}
          </label>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.75rem' }}>
            {isEn ? 'List any allergies, medications, or specific care needed.' : 'Mencione alergias, toma de medicamentos ou cuidados específicos.'}
          </p>
          <textarea rows={3} value={formData.restricoes_alimentares} onChange={e => setFormData({...formData, restricoes_alimentares: e.target.value})} placeholder={isEn ? 'None' : 'Nenhuma'} style={{...inputStyle, resize: 'vertical'}} />
        </div>

        <button type="submit" disabled={saving} style={{ marginTop: '1rem', width: '100%', padding: '1.25rem', backgroundColor: '#0f172a', color: 'white', fontWeight: '900', borderRadius: '1rem', border: 'none', cursor: 'pointer', fontSize: '1.125rem', transition: 'transform 0.1s' }}>
          {saving ? 'A guardar...' : (isEn ? 'Save Changes' : 'Guardar Alterações')}
        </button>
      </form>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase' as const, marginBottom: '0.5rem' };
const inputStyle = { width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const };
const selectStyle = { width: '100%', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', appearance: 'none' as const, cursor: 'pointer', backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' };
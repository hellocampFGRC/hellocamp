"use client";

import { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AtualizarPassword({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);

  const handleAtualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);

    // Atualiza a password do utilizador (o Supabase já validou o token do URL no background)
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setMensagem({ tipo: 'erro', texto: error.message });
    } else {
      setMensagem({ 
        tipo: 'sucesso', 
        texto: isEn ? "Password updated successfully!" : "Password atualizada com sucesso!" 
      });
      // Após 2 segundos, envia o utilizador de volta para o login
      setTimeout(() => {
        router.push(`/${lang}/login`);
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'white', padding: '3rem 2.5rem', borderRadius: '1.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            {isEn ? 'Update Password' : 'Atualizar Password'}
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            {isEn ? 'Enter your new password below.' : 'Insira a sua nova password abaixo.'}
          </p>
        </div>

        {mensagem && (
          <div style={{ padding: '1rem', borderRadius: '0.5rem', fontSize: '13px', textAlign: 'center', fontWeight: 'bold', marginBottom: '1.5rem', backgroundColor: mensagem.tipo === 'sucesso' ? '#ecfdf5' : '#fef2f2', color: mensagem.tipo === 'sucesso' ? '#065f46' : '#dc2626', border: `1px solid ${mensagem.tipo === 'sucesso' ? '#a7f3d0' : '#fecaca'}` }}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleAtualizar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}>{isEn ? 'New Password' : 'Nova Password'}</label>
            <input type="password" minLength={6} required onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? '...' : (isEn ? 'Save New Password' : 'Gravar Nova Password')}
          </button>
        </form>

      </div>
    </main>
  );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const inputStyle = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s' };
const btnStyle = { width: '100%', padding: '1rem', backgroundColor: '#0f172a', color: 'white', fontSize: '1rem', fontWeight: '900', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', transition: 'transform 0.1s', marginTop: '0.5rem' };
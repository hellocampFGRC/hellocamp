"use client";

import { useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function RecuperarPassword({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);

  const handleRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);

    // O Supabase envia o email e redireciona o utilizador para a página de atualizar password
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${lang}/atualizar-password`,
    });

    if (error) {
      setMensagem({ tipo: 'erro', texto: error.message });
    } else {
      setMensagem({ 
        tipo: 'sucesso', 
        texto: isEn 
          ? "If this email is registered, you will receive a reset link shortly." 
          : "Se este e-mail estiver registado, receberá um link de recuperação em breve." 
      });
    }
    setLoading(false);
  };

  return (
    <main style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: 'white', padding: '3rem 2.5rem', borderRadius: '1.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', margin: '0 0 0.5rem 0' }}>
            {isEn ? 'Recover Password' : 'Recuperar Password'}
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            {isEn ? 'Enter your email to receive a reset link.' : 'Insira o seu e-mail para receber um link de recuperação.'}
          </p>
        </div>

        {mensagem && (
          <div style={{ padding: '1rem', borderRadius: '0.5rem', fontSize: '13px', textAlign: 'center', fontWeight: 'bold', marginBottom: '1.5rem', backgroundColor: mensagem.tipo === 'sucesso' ? '#ecfdf5' : '#fef2f2', color: mensagem.tipo === 'sucesso' ? '#065f46' : '#dc2626', border: `1px solid ${mensagem.tipo === 'sucesso' ? '#a7f3d0' : '#fecaca'}` }}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleRecuperacao} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}>E-mail</label>
            <input type="email" required onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="exemplo@email.com" />
          </div>

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? '...' : (isEn ? 'Send Reset Link' : 'Enviar Link de Recuperação')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link href={`/${lang}/login`} style={{ fontSize: '13px', color: '#059669', fontWeight: 'bold', textDecoration: 'none' }}>
            &larr; {isEn ? 'Back to login' : 'Voltar ao login'}
          </Link>
        </div>

      </div>
    </main>
  );
}

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const inputStyle = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.2s' };
const btnStyle = { width: '100%', padding: '1rem', backgroundColor: '#0f172a', color: 'white', fontSize: '1rem', fontWeight: '900', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', transition: 'transform 0.1s', marginTop: '0.5rem' };
"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function ListaCriancas({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  const router = useRouter();

  const [criancas, setCriancas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCriancas = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase.from('criancas').select('*').eq('cliente_id', session.user.id).order('created_at', { ascending: false });
      setCriancas(data || []);
      setLoading(false);
    };
    fetchCriancas();
  }, []);

  const handleCriarNovaCrianca = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase.from('criancas').insert({ cliente_id: session.user.id, nome: 'Novo Participante' }).select().single();
    if (data) router.push(`/${lang}/cliente/criancas/${data.id}`);
  };

  const calcularIdade = (dataNasc: string) => {
    if (!dataNasc) return null;
    const diff = Date.now() - new Date(dataNasc).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
            {isEn ? 'My Children' : 'Os Meus Filhos'}
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>
            {isEn ? 'Manage participant profiles for faster bookings.' : 'Gira os perfis dos participantes para reservas mais rápidas.'}
          </p>
        </div>
        
        <button onClick={handleCriarNovaCrianca} style={{ backgroundColor: '#059669', color: 'white', padding: '0.875rem 1.5rem', borderRadius: '0.75rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)' }}>
          + {isEn ? 'Add Child' : 'Adicionar Filho(a)'}
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#64748b', fontWeight: 'bold', textAlign: 'center', padding: '3rem' }}>{isEn ? 'Loading...' : 'A carregar perfis...'}</p>
      ) : criancas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'white', border: '2px dashed #cbd5e1', borderRadius: '1.5rem' }}>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '1.125rem' }}>{isEn ? 'No children profiles found.' : 'Ainda não adicionou nenhum filho(a).'}</p>
          <button onClick={handleCriarNovaCrianca} style={{ color: '#059669', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.125rem' }}>
            {isEn ? 'Create profile now →' : 'Criar perfil agora →'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {criancas.map(c => {
            const idade = calcularIdade(c.data_nascimento);
            
            return (
              <Link key={c.id} href={`/${lang}/cliente/criancas/${c.id}`} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', lineHeight: 1.2 }}>{c.nome}</h3>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {idade !== null && (
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>
                      🎂 {idade} {isEn ? 'years' : 'anos'}
                    </span>
                  )}
                  {c.sexo && (
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>
                      👤 {c.sexo}
                    </span>
                  )}
                  {c.nif && (
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold' }}>
                      📑 NIF {c.nif}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                  {c.restricoes_alimentares ? (
                    <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '0.75rem', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⚠️ {isEn ? 'Restrictions:' : 'Alergias:'} <span style={{ fontWeight: 'normal' }}>{c.restricoes_alimentares}</span>
                    </div>
                  ) : (
                    <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #d1fae5', color: '#047857', borderRadius: '0.75rem', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ✅ {isEn ? 'No health restrictions' : 'Sem restrições de saúde'}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
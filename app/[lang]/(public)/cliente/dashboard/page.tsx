"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import React from "react";

export default function DashboardCliente({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservas = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('reservas')
        .select(`
          *,
          campos ( id, nome, nome_en, imagem, local, local_en ),
          criancas ( nome )
        `)
        .eq('cliente_id', session.user.id)
        .order('created_at', { ascending: false });

      setReservas(data || []);
      setLoading(false);
    };

    fetchReservas();
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>{isEn ? 'Loading your dashboard...' : 'A carregar o seu resumo...'}</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
          {isEn ? 'Upcoming Camps' : 'Próximos Campos'}
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>
          {isEn ? 'View your active programs and child schedules.' : 'Consulte os programas ativos e as inscrições dos seus filhos.'}
        </p>
      </div>

      {reservas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', backgroundColor: 'white', border: '2px dashed #cbd5e1', borderRadius: '1.5rem' }}>
          <p style={{ color: '#64748b', fontSize: '1.125rem', marginBottom: '1.5rem' }}>
            {isEn ? 'No camp enrollments found yet.' : 'Ainda não inscreveu nenhum participante em programas de férias.'}
          </p>
          <Link href={`/${lang}/pesquisa`} style={{ display: 'inline-block', backgroundColor: '#0f172a', color: 'white', padding: '0.875rem 1.75rem', borderRadius: '0.75rem', fontWeight: 'bold', textDecoration: 'none' }}>
            {isEn ? 'Browse Camps' : 'Encontrar Programas'}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {reservas.map((reserva) => {
            const campo = reserva.campos;
            const nomeCampo = isEn && campo?.nome_en ? campo.nome_en : campo?.nome;
            const localCampo = isEn && campo?.local_en ? campo.local_en : campo?.local;

            return (
              <Link 
                key={reserva.id} 
                href={`/${lang}/campo/${campo?.id}`}
                style={{ backgroundColor: 'white', borderRadius: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                }}
              >
                <div style={{ height: '160px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                  <img src={campo?.imagem || 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=600'} alt={nomeCampo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(15,23,42,0.85)', padding: '0.35rem 0.75rem', borderRadius: '999px', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>
                    {reserva.turno_nome}
                  </div>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>{nomeCampo}</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '0.25rem', marginBottom: '1.25rem' }}>📍 {localCampo}</p>
                  
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>{isEn ? 'PARTICIPANT' : 'PARTICIPANTE'}</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>👦 {reserva.criancas?.nome}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>TOTAL</span>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: '#059669' }}>{reserva.valor_total}€</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
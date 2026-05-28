"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "../../../../lib/supabase";

export default function DashboardParceiro({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';
  
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState({
    totalReservas: 0,
    totalReceita: 0,
    totalCriancas: 0
  });

  useEffect(() => {
    const fetchMetricas = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Buscar as reservas deste organizador
      const { data: reservas } = await supabase
        .from('reservas')
        .select('valor_total, quantidade_criancas')
        .eq('organizador_id', session.user.id);

      if (reservas) {
        const receita = reservas.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
        const criancas = reservas.reduce((acc, curr) => acc + Number(curr.quantidade_criancas || 0), 0);
        
        setMetricas({
          totalReservas: reservas.length,
          totalReceita: receita,
          totalCriancas: criancas
        });
      }
      setLoading(false);
    };

    fetchMetricas();
  }, []);

  if (loading) return <div>A carregar o seu painel...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', marginBottom: '0.5rem' }}>
        {isEn ? 'Overview' : 'Resumo de Desempenho'}
      </h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        {isEn ? 'Monitor your camps and bookings in real-time.' : 'Acompanhe as inscrições dos seus campos de férias em tempo real.'}
      </p>

      {/* CARDS DE MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {isEn ? 'Total Revenue' : 'Receita Total'}
          </p>
          <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#059669', margin: 0 }}>
            {metricas.totalReceita}€
          </h3>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {isEn ? 'Registered Children' : 'Crianças Inscritas'}
          </p>
          <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
            {metricas.totalCriancas}
          </h3>
        </div>

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {isEn ? 'Active Bookings' : 'Reservas Ativas'}
          </p>
          <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
            {metricas.totalReservas}
          </h3>
        </div>

      </div>

      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
          {isEn ? 'Getting Started' : 'Primeiros Passos'}
        </h3>
        <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6' }}>
          {isEn 
            ? 'Welcome to the HelloCamp partner network. Navigate to "My Camps" to add your first program and configure available spots, dates, and optional extras.' 
            : 'Bem-vindo à rede de parceiros HelloCamp. Navegue até "Os Meus Campos" na barra lateral para adicionar o seu primeiro programa e configurar as vagas, datas e extras opcionais.'}
        </p>
      </div>

    </div>
  );
}
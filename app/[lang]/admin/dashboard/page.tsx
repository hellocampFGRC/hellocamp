"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import React from "react";

export default function DashboardMarketing({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  
  const [metricas, setMetricas] = useState({
    totalReservas: 0,
    vezesGuardado: 0, 
    camposAtivos: 0,
    camposPendentes: 0,
    mediaEstrelas: 0,
    pedidosPendentes: 0 
  });

  const [sugestoes, setSugestoes] = useState<any[]>([]);

  useEffect(() => {
    const fetchMarketingData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const userId = session.user.id;

      // 1. Busca Perfil (Agora inclui os dados do CONTRATO GLOBAL)
      const { data: perfil } = await supabase.from('perfis').select('empresa_nome, nome_completo, stripe_account_id, contrato_dados, status_contrato').eq('id', userId).single();
      
      if (perfil) {
        if (perfil.empresa_nome && perfil.empresa_nome.trim() !== "") {
          setNomeEmpresa(perfil.empresa_nome);
        } else if (perfil.nome_completo && perfil.nome_completo.trim() !== "") {
          setNomeEmpresa(perfil.nome_completo.split(' ')[0]);
        } else {
          setNomeEmpresa(isEn ? "Organizer" : "Organizador");
        }
      } else {
        setNomeEmpresa(isEn ? "Organizer" : "Organizador");
      }

      // 2. Busca Campos do Parceiro (Atualizado para ler o status_aprovacao)
      const { data: campos } = await supabase.from('campos').select('id, nome, status_aprovacao, rating_score, total_reviews, galeria, programas_pdf').eq('organizador_id', userId);
      const camposIds = campos?.map(c => c.id) || [];
      
      let ativos = 0;
      let pendentes = 0;
      let somaEstrelas = 0;
      let totalComReviews = 0;
      const novasSugestoes: any[] = [];

      // ALERTA: CONTRATO GLOBAL EM FALTA OU PENDENTE
      if (!perfil?.contrato_dados) {
        novasSugestoes.push({ 
          tipo: 'critical', 
          icon: '📝', 
          titulo: isEn ? 'Global Contract Missing' : 'Contrato Global em Falta',
          texto: isEn ? `You must sign the Global Partnership Agreement to publish your camps and recruit monitors.` : `A sua conta encontra-se restrita. Precisa de assinar o Contrato Global de Parceria para publicar campos e aceder à bolsa de recrutamento.`, 
          link: `/${lang}/admin/contrato`,
          actionText: isEn ? 'Sign Contract Now' : 'Assinar Contrato Agora'
        });
      } else if (perfil?.status_contrato === 'Pendente de Revisão' || perfil?.status_contrato === 'Pendente') {
        novasSugestoes.push({ 
          tipo: 'info', 
          icon: '⏳', 
          titulo: isEn ? 'Contract Under Review' : 'Contrato em Revisão',
          texto: isEn ? `Your Global Contract is being reviewed by our legal team.` : `O seu Contrato Global foi submetido com sucesso e encontra-se a ser analisado pela nossa equipa.`, 
          link: `/${lang}/admin/contrato`,
          actionText: isEn ? 'View Document' : 'Ver Documento'
        });
      }

      // ALERTA: STRIPE NÃO CONECTADO
      if (!perfil?.stripe_account_id) {
        novasSugestoes.push({ 
          tipo: 'critical', 
          icon: '🚨', 
          titulo: isEn ? 'Bank Account Not Connected' : 'Conta Bancária Não Conectada',
          texto: isEn ? `You must connect your Stripe account to receive payments from parents.` : `Precisa de configurar a sua conta bancária via Stripe. Enquanto não o fizer, não poderá receber o dinheiro das inscrições.`, 
          link: `/${lang}/admin/faturacao`,
          actionText: isEn ? 'Connect Now' : 'Configurar Conta Agora'
        });
      }

      campos?.forEach(c => {
        // Lógica de campos ativos vs pendentes
        const status = (c.status_aprovacao || '').toLowerCase();
        if (status === 'aprovado' || status === 'validado' || status === 'ativo' || status === 'active') {
          ativos++;
        } else {
          pendentes++;
        }

        if (c.rating_score > 0) {
          somaEstrelas += c.rating_score;
          totalComReviews++;
        }
        
        if (!c.galeria || c.galeria.length === 0) {
          novasSugestoes.push({ 
            tipo: 'warning', 
            icon: '📸', 
            titulo: isEn ? 'Missing Gallery' : 'Galeria de Fotos Vazia',
            texto: isEn ? `Parents decide based on photos! Add a gallery to "${c.nome}".` : `Os pais compram com os olhos! Adicione fotografias à galeria do campo "${c.nome}".`, 
            link: `/${lang}/admin/campos/editar/${c.id}`,
            actionText: isEn ? 'Add Photos' : 'Adicionar Fotos'
          });
        }

        if (!c.programas_pdf || c.programas_pdf.length === 0) {
          novasSugestoes.push({ 
            tipo: 'info', 
            icon: '📄', 
            titulo: isEn ? 'No Itinerary PDF' : 'Falta o Programa Detalhado (PDF)',
            texto: isEn ? `Attach a PDF schedule to "${c.nome}" to increase trust.` : `Anexe um PDF com o itinerário no campo "${c.nome}" para aumentar a confiança dos pais.`, 
            link: `/${lang}/admin/campos/editar/${c.id}`,
            actionText: isEn ? 'Attach PDF' : 'Anexar PDF'
          });
        }

        if (c.total_reviews === 0 && (status === 'aprovado' || status === 'ativo')) {
          novasSugestoes.push({ 
            tipo: 'idea', 
            icon: '⭐', 
            titulo: isEn ? 'Zero Reviews' : 'Nenhuma Avaliação',
            texto: isEn ? `"${c.nome}" has no reviews. Share the link with past clients!` : `O campo "${c.nome}" não tem avaliações. Partilhe o link com clientes antigos para ganhar tração!`, 
            link: `/${lang}/campo/${c.id}`,
            actionText: isEn ? 'Get Link' : 'Obter Link'
          });
        }
      });

      // 3. Busca de Reservas: Obter status e respostas para calcular a Faturação e os Upsells Pendentes
      const { data: reservasDados } = await supabase
        .from('reservas')
        .select('status_pagamento, respostas_customizadas')
        .eq('organizador_id', userId);

      let countReservas = 0;
      let countPedidosUpsell = 0;

      reservasDados?.forEach(res => {
        if (res.status_pagamento === 'Pago' || res.status_pagamento === 'Sinal Pago') {
          countReservas++;
        }
        if (res.respostas_customizadas && res.respostas_customizadas.pedido_pai_pendente) {
          countPedidosUpsell++;
        }
      });

      // 4. Busca Wishlists 
      let vezesGuardadoTotal = 0;
      if (camposIds.length > 0) {
        const { count } = await supabase.from('wishlist_campos').select('*', { count: 'exact', head: true }).in('campo_id', camposIds);
        vezesGuardadoTotal = count || 0;
      }

      setMetricas({
        totalReservas: countReservas,
        vezesGuardado: vezesGuardadoTotal,
        camposAtivos: ativos,
        camposPendentes: pendentes,
        mediaEstrelas: totalComReviews > 0 ? (somaEstrelas / totalComReviews) : 0,
        pedidosPendentes: countPedidosUpsell 
      });

      const prioridade: Record<string, number> = { 'critical': 1, 'warning': 2, 'info': 3, 'idea': 4 };
      novasSugestoes.sort((a, b) => prioridade[a.tipo] - prioridade[b.tipo]);

      setSugestoes(novasSugestoes);
      setLoading(false);
    };

    fetchMarketingData();
  }, [isEn, lang]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>{isEn ? 'Loading marketing data...' : 'A carregar motor de otimização...'}</div>;

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', padding: '2rem 1.5rem', paddingBottom: '4rem' }}>
      
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            {isEn ? `Welcome, ${nomeEmpresa}` : `Olá, ${nomeEmpresa} 👋`}
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px', fontWeight: '500' }}>
            {isEn ? 'Monitor your marketing traction and optimize your camps to sell more.' : 'Acompanhe a sua tração e descubra como otimizar os seus campos para vender mais.'}
          </p>
        </div>
        
        {/* BOTÕES DE ACÃO (NOVO: LINK PARA O CONTRATO) */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href={`/${lang}/admin/contrato`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', transition: 'background-color 0.2s' }}>
            <span>📝</span> {isEn ? 'Global Contract' : 'Contrato Global'}
          </Link>
          <Link href={`/${lang}/admin/campos/novo`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0f172a', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}>
            <span>+</span> {isEn ? 'Create Camp' : 'Novo Campo'}
          </Link>
        </div>
      </div>

      {metricas.pedidosPendentes > 0 && (
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.5rem', borderRadius: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ fontSize: '2.5rem', animation: 'pulse 2s infinite' }}>📬</span>
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', fontWeight: '900', color: '#1e3a8a' }}>
                {isEn ? `You have ${metricas.pedidosPendentes} pending change request(s)!` : `Tem ${metricas.pedidosPendentes} pedido(s) de alteração pendente(s)!`}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#1e40af', fontWeight: '500' }}>
                {isEn ? 'Parents are waiting for your approval to add extras.' : 'Os encarregados de educação solicitaram novos extras. Aprove para lhes enviar o pagamento.'}
              </p>
            </div>
          </div>
          <Link href={`/${lang}/admin/reservas`} style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.875rem 1.5rem', borderRadius: '0.75rem', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)', transition: 'background-color 0.2s' }}>
            {isEn ? 'Review Requests' : 'Analisar Pedidos'} &rarr;
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isEn ? 'Traction & Marketing' : 'Tração & Marketing'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '3rem', height: '3rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>❤️</div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isEn ? 'Wishlists' : 'Favoritos'}</span>
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', display: 'block', lineHeight: 1 }}>{metricas.vezesGuardado}</span>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{isEn ? 'Times your camps were saved.' : 'Vezes que guardaram os seus campos.'}</p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '3rem', height: '3rem', backgroundColor: '#fefce8', color: '#eab308', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⭐</div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isEn ? 'Global Rating' : 'Avaliação'}</span>
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: '900', color: '#0f172a', display: 'block', lineHeight: 1 }}>{metricas.mediaEstrelas > 0 ? metricas.mediaEstrelas.toFixed(1) : '-'}</span>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{isEn ? 'Average score.' : 'Média das reviews recebidas.'}</p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '3rem', height: '3rem', backgroundColor: '#f0fdf4', color: '#10b981', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎫</div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isEn ? 'Total Confirmed Bookings' : 'Total de Inscrições Validadas'}</span>
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: '900', color: '#10b981', display: 'block', lineHeight: 1 }}>{metricas.totalReservas}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Link href={`/${lang}/admin/reservas`} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', textDecoration: 'none', transition: 'border-color 0.2s' }}>
              <span style={{ fontSize: '1.5rem' }}>📋</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{isEn ? 'Manage Logistics' : 'Gestão de Logística'} &rarr;</span>
            </Link>
            <Link href={`/${lang}/admin/faturacao`} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', textDecoration: 'none', transition: 'border-color 0.2s' }}>
              <span style={{ fontSize: '1.5rem' }}>💰</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{isEn ? 'Finance & Billing' : 'Finanças e Faturação'} &rarr;</span>
            </Link>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(15,23,42,0.05)' }}>
          <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isEn ? 'Optimization Engine' : 'Motor de Otimização'}
            </h2>
            <span style={{ backgroundColor: sugestoes.length > 0 ? '#fef2f2' : '#f0fdf4', color: sugestoes.length > 0 ? '#ef4444' : '#10b981', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '12px', fontWeight: '900' }}>
              {sugestoes.length} {isEn ? 'Tasks' : 'Avisos'}
            </span>
          </div>

          {sugestoes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px dashed #cbd5e1' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🏆</span>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                {isEn ? 'All set!' : 'Tudo perfeito!'}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                {isEn ? 'Your account and camps are fully optimized.' : 'A sua conta bancária está ligada e os seus contratos estão em dia.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sugestoes.map((sug, idx) => {
                let bgColor = '#f8fafc', borderColor = '#e2e8f0', titleColor = '#0f172a';
                if (sug.tipo === 'critical') { bgColor = '#fef2f2'; borderColor = '#fecaca'; titleColor = '#991b1b'; }
                if (sug.tipo === 'warning') { bgColor = '#fffbeb'; borderColor = '#fde68a'; titleColor = '#92400e'; }
                if (sug.tipo === 'info') { bgColor = '#eff6ff'; borderColor = '#bfdbfe'; titleColor = '#1e40af'; }

                return (
                  <div key={idx} style={{ padding: '1.25rem', borderRadius: '1rem', backgroundColor: bgColor, border: `1px solid ${borderColor}`, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>{sug.icon}</div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '14px', fontWeight: '800', color: titleColor }}>{sug.titulo}</h4>
                      <p style={{ margin: '0 0 1rem 0', fontSize: '13px', color: '#475569', lineHeight: 1.4 }}>{sug.texto}</p>
                      <Link href={sug.link} style={{ display: 'inline-block', fontSize: '12px', fontWeight: '900', color: titleColor, textDecoration: 'underline', textUnderlineOffset: '4px' }}>
                        {sug.actionText} &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
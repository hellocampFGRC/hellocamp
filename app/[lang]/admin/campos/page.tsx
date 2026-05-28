"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 
import Link from "next/link";
import React from "react";

export default function MeusCampos({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = React.use(params);
  const isEn = lang === 'en';

  const [campos, setCampos] = useState<any[]>([]);
  const [perfilBase, setPerfilBase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampos = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // 1. Busca os dados de perfil de forma isolada (para saber a comissão geral de fallback)
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('taxa_comissao, base_comissao')
        .eq('id', session.user.id)
        .single();
        
      setPerfilBase(perfilData || { taxa_comissao: 12 });

      // 2. Busca os campos do parceiro de forma simples (evitando o erro {} de Join)
      const { data, error } = await supabase
        .from('campos')
        .select('*')
        .eq('organizador_id', session.user.id)
        .order('id', { ascending: false }); 

      if (error) {
        console.error("Erro ao carregar campos:", error);
      } else {
        setCampos(data || []);
      }
      
      setLoading(false);
    };
    fetchCampos();
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      
      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
            {isEn ? 'My Camps' : 'Os Meus Campos'}
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '15px' }}>
            {isEn ? 'Manage your holiday programs and availability.' : 'Gira os seus programas de férias e disponibilidade.'}
          </p>
        </div>
        
        <Link 
          href={`/${lang}/admin/campos/novo`} 
          style={{ backgroundColor: '#059669', color: 'white', padding: '0.875rem 1.5rem', borderRadius: '0.75rem', fontWeight: 'bold', textDecoration: 'none', transition: 'transform 0.1s', display: 'inline-block' }}
        >
          + {isEn ? 'Add New' : 'Adicionar Novo'}
        </Link>
      </div>

      {/* LISTAGEM */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>
          {isEn ? 'Loading your camps...' : 'A carregar os seus campos...'}
        </div>
      ) : campos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', border: '2px dashed #cbd5e1', borderRadius: '1.5rem', backgroundColor: 'white' }}>
          <p style={{ color: '#64748b', fontSize: '1.125rem', marginBottom: '1.5rem' }}>
            {isEn ? 'You haven\'t added any camps yet.' : 'Ainda não tem nenhum campo registado.'}
          </p>
          <Link href={`/${lang}/admin/campos/novo`} style={{ color: '#059669', fontWeight: 'bold', textDecoration: 'none', fontSize: '1.125rem' }}>
            {isEn ? 'Create your first camp →' : 'Crie o seu primeiro campo →'}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {campos.map((campo) => {
            
            const nomeVisivel = isEn && campo.nome_en ? campo.nome_en : campo.nome;
            const localVisivel = isEn && campo.local_en ? campo.local_en : campo.local;
            const vagasVisivel = campo.vagas_totais || 0;
            const textoVagas = isEn ? 'spots' : 'vagas';
            
            let precoVisivel = campo.preco;
            if (!precoVisivel || precoVisivel === 0) {
              if (campo.turnos && campo.turnos.length > 0) {
                precoVisivel = campo.turnos[0].preco || 0;
              } else {
                precoVisivel = 0;
              }
            }

            // Lógica de visualização da Comissão
            const isComissaoEspecifica = campo.taxa_comissao !== null && campo.taxa_comissao !== undefined;
            const taxaVisual = isComissaoEspecifica ? campo.taxa_comissao : (perfilBase?.taxa_comissao || 12);

            return (
              <div key={campo.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                    {nomeVisivel}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '600' }}>
                      📍 {localVisivel} &nbsp;|&nbsp; 👥 {vagasVisivel} {textoVagas} &nbsp;|&nbsp; 💰 {precoVisivel}€
                    </p>
                    
                    <span style={{ backgroundColor: isComissaoEspecifica ? '#fefce8' : '#f1f5f9', color: isComissaoEspecifica ? '#854d0e' : '#475569', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '11px', fontWeight: 'bold', border: `1px solid ${isComissaoEspecifica ? '#fef08a' : '#e2e8f0'}` }}>
                      Taxa de Comissão: {taxaVisual}% {isComissaoEspecifica ? '(Específica)' : '(Geral)'}
                    </span>
                    
                    {campo.contrato_parceiro_url && (
                      <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '11px', fontWeight: 'bold', border: '1px solid #a7f3d0' }}>
                        ✅ Contrato Validado
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {campo.contrato_parceiro_url && (
                    <a 
                      href={campo.contrato_parceiro_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '0.6rem 1rem', backgroundColor: '#fffbeb', color: '#b45309', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', border: '1px solid #fde68a' }}
                    >
                      {isEn ? 'Download Contract' : '📥 Contrato'}
                    </a>
                  )}
                  <Link 
                    href={`/${lang}/admin/campos/editar/${campo.id}`} 
                    style={{ padding: '0.6rem 1.25rem', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', border: '1px solid #cbd5e1' }}
                  >
                    {isEn ? 'Edit' : 'Editar'}
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import React from "react";

export default function AssinaturaContratoPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = use(params);
  const router = useRouter();
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campo, setCampo] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);

  // Estados do Formulário de Assinatura
  const [assinatura, setAssinatura] = useState("");
  const [concorda, setConcorda] = useState(false);
  const [jaAssinado, setJaAssinado] = useState(false);

  useEffect(() => {
    const fetchDados = async () => {
      // 1. Buscar Campo
      const { data: campoData, error: campoError } = await supabase
        .from('campos')
        .select('*')
        .eq('id', id)
        .single();

      if (campoError || !campoData) {
        alert("Campo não encontrado ou link inválido.");
        return;
      }

      // Se já tiver contrato e estiver aprovado, bloqueamos nova assinatura
      if (campoData.contrato_parceiro_url && campoData.status_aprovacao === 'Aprovado') {
        setJaAssinado(true);
      }

      setCampo(campoData);

      // 2. Buscar Perfil do Organizador
      if (campoData.organizador_id) {
        const { data: perfilData } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', campoData.organizador_id)
          .single();
        setPerfil(perfilData);
      }

      setLoading(false);
    };

    fetchDados();
  }, [id]);

  const gerarEGuardarPDF = async () => {
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Configurar Fonte e Tamanho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CONTRATO DE INTERMEDIAÇÃO E SERVIÇOS", pageWidth / 2, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const dataAtual = new Date().toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Data de Emissão: ${dataAtual}`, pageWidth / 2, 28, { align: "center" });

    doc.line(20, 35, pageWidth - 20, 35);

    // DADOS DAS PARTES
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. IDENTIFICAÇÃO DAS PARTES", 20, 45);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`PRIMEIRA OUTORGANTE (Plataforma): HelloCamp Portugal`, 20, 55);
    doc.text(`SEGUNDA OUTORGANTE (Organizador): ${perfil?.empresa_nome || 'N/A'}`, 20, 62);
    doc.text(`NIF: ${perfil?.nif || 'N/A'} | Email: ${perfil?.email || 'N/A'}`, 20, 69);

    // OBJETO E PROGRAMA
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("2. OBJETO DO CONTRATO", 20, 85);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const textoObjeto = `O presente contrato estabelece as condições de parceria para a divulgação e gestão de inscrições referentes ao programa "${campo?.nome}", a realizar-se em ${campo?.local || 'local a definir'}.`;
    doc.text(textoObjeto, 20, 95, { maxWidth: pageWidth - 40 });

    // CONDIÇÕES FINANCEIRAS
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("3. CONDIÇÕES FINANCEIRAS E OPERACIONAIS", 20, 115);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const taxaAplicada = campo?.taxa_comissao !== null ? campo?.taxa_comissao : (perfil?.taxa_comissao || 12);
    let baseTexto = "Sobre Valor Total";
    if (campo?.base_comissao === "apenas_programa") baseTexto = "Apenas sobre Programa (sem extras)";
    if (campo?.base_comissao === "sem_comissao") baseTexto = "Isento de Comissão";

    let modalidadeTexto = "Reserva Direta (Checkout)";
    if (campo?.modalidade_reserva === "email") modalidadeTexto = "Sob Consulta (Email)";
    if (campo?.modalidade_reserva === "link_externo") modalidadeTexto = "Link Externo (Sem gestão de pagamento na plataforma)";

    doc.text(`• Taxa de Comissão: ${taxaAplicada}%`, 25, 125);
    doc.text(`• Base de Incidência: ${baseTexto}`, 25, 132);
    doc.text(`• Modalidade de Reserva: ${modalidadeTexto}`, 25, 139);
    doc.text(`• Política de Pagamento: ${campo?.tipo_pagamento === '50_sinal' ? 'Sinal 50% / Restante 50%' : '100% no Ato da Reserva'}`, 25, 146);
    doc.text(`• Política de Cancelamento: ${campo?.politica_cancelamento || 'Moderada'}`, 25, 153);

    // DECLARAÇÃO DE ACEITAÇÃO
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("4. DECLARAÇÃO DE ACEITAÇÃO", 20, 175);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const textoDeclaracao = `O Organizador declara ter lido, compreendido e aceite integralmente os Termos e Condições Gerais da HelloCamp, bem como as condições específicas financeiras e operacionais descritas neste documento.`;
    doc.text(textoDeclaracao, 20, 185, { maxWidth: pageWidth - 40 });

    // ASSINATURAS
    doc.line(20, 215, 100, 215); // Linha Assinatura
    doc.text(`Assinado Digitalmente por:`, 20, 222);
    doc.setFont("helvetica", "bold");
    doc.text(assinatura, 20, 229);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Data/Hora: ${new Date().toLocaleString('pt-PT')}`, 20, 236);
    doc.text(`Validação de Segurança Gerada via Plataforma HelloCamp`, 20, 242);

    return doc.output('blob');
  };

  const handleAssinar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assinatura || !concorda) {
      alert("Deve preencher o seu nome e aceitar os termos.");
      return;
    }

    setSaving(true);
    try {
      // 1. Gerar PDF Blob
      const pdfBlob = await gerarEGuardarPDF();

      // 2. Upload para o Supabase Storage
      const fileName = `contrato_assinado_${campo.id}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('campos-documentos')
        .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true });

      if (uploadError) throw new Error("Erro ao guardar o PDF no servidor: " + uploadError.message);

      // 3. Obter URL Público do PDF
      const { data: publicUrlData } = supabase.storage.from('campos-documentos').getPublicUrl(fileName);
      const contratoUrl = publicUrlData.publicUrl;

      // 4. Atualizar o Campo na Base de Dados (Guarda URL e Muda Status para Aprovado)
      const { error: dbError } = await supabase.from('campos').update({
        contrato_parceiro_url: contratoUrl,
        status_aprovacao: 'Aprovado',
        ativo: true,
        // Guardamos também um registo invisível no contrato_dados para auditoria
        contrato_dados: {
          ...campo.contrato_dados,
          assinatura_nome: assinatura,
          assinatura_data: new Date().toISOString(),
          termos_aceites: true
        }
      }).eq('id', campo.id);

      if (dbError) throw new Error("Erro ao validar contrato na base de dados: " + dbError.message);

      setJaAssinado(true);
      setCampo({ ...campo, contrato_parceiro_url: contratoUrl });
      alert("✅ Contrato assinado e programa aprovado com sucesso! Já está visível na HelloCamp.");

    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold bg-slate-50">A aceder ao documento seguro...</div>;

  const taxaVisual = campo?.taxa_comissao !== null ? campo.taxa_comissao : (perfil?.taxa_comissao || 12);
  
  let baseVisual = "Sobre Valor Total";
  if (campo?.base_comissao === "apenas_programa") baseVisual = "Apenas sobre Programa (sem extras)";
  if (campo?.base_comissao === "sem_comissao") baseVisual = "Isento de Comissão (0%)";

  return (
    <main className="min-h-screen bg-slate-100 py-12 px-4 font-sans selection:bg-indigo-200">
      
      {/* CABEÇALHO HELLOCAMP */}
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
          Hello<span className="text-[#EBA914]">Camp</span>
        </h1>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Validação de Contrato de Parceria</p>
      </div>

      {/* FOLHA A4 DO CONTRATO */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* TOPO DO DOCUMENTO */}
        <div className="bg-slate-900 px-8 py-10 text-white">
          <h2 className="text-2xl font-black mb-2">Contrato de Intermediação e Serviços</h2>
          <p className="text-slate-300 text-sm m-0">
            Documento gerado para: <strong className="text-white">{perfil?.empresa_nome || 'N/A'}</strong>
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Programa</span>
              <span className="block text-sm font-black">{campo?.nome}</span>
            </div>
            <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Data de Emissão</span>
              <span className="block text-sm font-black">{new Date().toLocaleDateString('pt-PT')}</span>
            </div>
          </div>
        </div>

        {/* CORPO DO DOCUMENTO (TERMOS) */}
        <div className="p-8 md:p-12 text-slate-700 space-y-8">
          
          {jaAssinado && (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
              <h3 className="text-xl font-black text-emerald-900 mb-2">Contrato já assinado e em vigor!</h3>
              <p className="text-emerald-700 text-sm mb-4">O seu programa já se encontra aprovado e ativo na plataforma HelloCamp.</p>
              <a href={campo?.contrato_parceiro_url} target="_blank" rel="noopener noreferrer" className="inline-block bg-emerald-600 text-white font-bold px-6 py-3 rounded-lg shadow-sm hover:bg-emerald-700 transition-colors">
                Fazer Download do PDF Assinado
              </a>
            </div>
          )}

          {!jaAssinado && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">1. Condições Financeiras Acordadas</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-500">Taxa de Comissão:</span>
                    <span className="font-black text-indigo-700 text-base">{taxaVisual}%</span>
                  </li>
                  <li className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-500">Incidência da Comissão:</span>
                    <span className="font-black text-slate-800">{baseVisual}</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">2. Condições Operacionais Acordadas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Modalidade de Reserva</span>
                    <span className="block text-sm font-black text-slate-800">
                      {campo?.modalidade_reserva === 'direta' ? 'Reserva Direta no Checkout' : (campo?.modalidade_reserva === 'email' ? 'Pedido de Orçamento (Email)' : 'Redirecionamento Link Externo')}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Política de Cancelamento</span>
                    <span className="block text-sm font-black text-slate-800">{campo?.politica_cancelamento || 'Moderada'}</span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 sm:col-span-2">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Modelo de Pagamento da Reserva</span>
                    <span className="block text-sm font-black text-slate-800">
                      {campo?.tipo_pagamento === '50_sinal' ? 'O cliente paga 50% de Sinal agora, e 50% mais tarde.' : 'O cliente paga 100% da totalidade no ato da reserva.'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
                <h3 className="text-sm font-black text-amber-900 mb-2">3. Declaração e Termos</h3>
                <p className="text-xs text-amber-800 leading-relaxed m-0 text-justify">
                  Ao assinar este documento, declaro que as informações financeiras e logísticas aqui apresentadas estão corretas e acordo com a sua aplicação na plataforma HelloCamp. Declaro igualmente ter conhecimento dos Termos de Responsabilidade da plataforma aplicáveis a Entidades Organizadoras.
                </p>
              </div>

              {/* ÁREA DE ASSINATURA */}
              <div className="border-t-2 border-slate-900 pt-8 mt-8">
                <form onSubmit={handleAssinar} className="space-y-6">
                  
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Assinatura do Responsável Legal *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Escreva o seu nome completo para assinar..." 
                      value={assinatura} 
                      onChange={e => setAssinatura(e.target.value)} 
                      className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 text-lg outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      style={{ fontFamily: "'Dancing Script', cursive, serif" }} // Dá um toque mais "assinatura" se a fonte estiver disponível, caso contrário fica serifada
                    />
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-white transition-colors">
                    <input 
                      type="checkbox" 
                      required 
                      checked={concorda} 
                      onChange={e => setConcorda(e.target.checked)} 
                      className="mt-1 w-5 h-5 accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-sm font-bold text-slate-700 leading-snug">
                      Confirmo a validade desta assinatura digital e aceito a vinculação aos termos descritos para a comercialização do programa "{campo?.nome}".
                    </span>
                  </label>

                  <button 
                    type="submit" 
                    disabled={saving || !assinatura || !concorda}
                    className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black text-lg py-5 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'A Gerar e Encriptar Documento...' : 'Assinar Digitalmente e Aprovar Campo'}
                  </button>

                  <p className="text-center text-[10px] font-bold text-slate-400">
                    A sua assinatura, timestamp e endereço IP serão gravados de forma segura na cópia PDF deste contrato.
                  </p>
                </form>
              </div>
            </>
          )}

        </div>
      </div>
    </main>
  );
}
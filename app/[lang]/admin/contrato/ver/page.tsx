"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function VerContratoGlobalPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const router = useRouter();
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [dadosContrato, setDadosContrato] = useState<any>(null);

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${lang}/admin/login`); return; }

      const { data: perfilData } = await supabase.from('perfis').select('*').eq('id', session.user.id).single();

      if (!perfilData || !perfilData.contrato_dados) {
        alert(isEn ? "No signed contract found." : "Ainda não assinou o contrato global.");
        router.push(`/${lang}/admin/contrato`);
        return;
      }

      setPerfil(perfilData);
      setDadosContrato(perfilData.contrato_dados);
      setLoading(false);
    };
    fetchDados();
  }, [lang, router]);

  if (loading) return <div className="p-20 text-center font-bold text-slate-500">A carregar documento legal...</div>;

  const dataSubmissao = new Date(dadosContrato.dataSubmissao).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Cores do Badge de Status
  let statusColor = "bg-amber-100 text-amber-800 border-amber-200";
  const status = (perfil.status_contrato || 'Pendente').toLowerCase();
  if (status === 'validado' || status === 'aprovado' || status === 'ativo') {
    statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
  }

  // Helper para o nome da modalidade do Anexo 1
  let modalidadeNome = "";
  if (dadosContrato.modalidadeReserva === 'direta') modalidadeNome = "✅ Reserva Direta com Pagamento Automático";
  else if (dadosContrato.modalidadeReserva === 'email') modalidadeNome = "✅ Comunicação por E-mail (Reserva Sob Consulta)";
  else if (dadosContrato.modalidadeReserva === 'link_externo') modalidadeNome = "✅ Formulário ou Link Externo (Redirecionamento)";

  return (
    <main className="min-h-screen bg-slate-200 py-12 px-4 font-sans text-black selection:bg-yellow-200">
      <div className="max-w-[900px] mx-auto">
        
        {/* BARRA DE FERRAMENTAS (NÃO APARECE NA IMPRESSÃO) */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm print:hidden">
          <Link href={`/${lang}/admin/dashboard`} className="text-sm font-bold text-slate-500 hover:text-black transition-colors">
            &larr; Voltar ao Painel
          </Link>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-1.5 rounded-lg border text-xs font-black uppercase tracking-widest ${statusColor}`}>
              Estado: {perfil.status_contrato || 'Pendente'}
            </div>
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-5 py-2 rounded-lg font-bold hover:bg-slate-800 transition-all shadow-md text-sm">
              🖨️ Guardar PDF / Imprimir
            </button>
          </div>
        </div>

        {/* DOCUMENTO DO CONTRATO */}
        <div className="bg-white shadow-2xl p-8 md:p-16 text-black leading-relaxed rounded-sm font-serif print:shadow-none print:p-0">
          
          <div className="text-center mb-16">
            <div className="text-4xl font-black tracking-tighter mb-8 font-sans">
              <span className="text-black">Hello</span><span className="text-[#EBA914]">Camp</span>
            </div>
            <h1 className="text-2xl font-bold uppercase mb-2 tracking-widest border-b-2 border-black inline-block pb-2">
              Contrato Global de Intermediação
            </h1>
            <p className="text-sm font-bold text-gray-500 mt-2 font-sans uppercase tracking-widest">
              CÓPIA DO PARCEIRO
            </p>
          </div>

          <div className="space-y-6 text-[15px] text-justify">
            <p className="mb-4">Entre:</p>
            <div className="ml-8 mb-8 space-y-1">
              <p><strong>HelloCamp Portugal</strong></p>
              <p>Website: www.hellocamp.pt</p>
              <p>E-mail: info@hellocamp.pt</p>
            </div>

            <p className="mb-4">E</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 ml-8 mb-8 bg-gray-50 p-6 border border-gray-300 font-sans text-sm">
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">Pessoa de Contacto</span><span className="font-bold text-base">{dadosContrato.pessoaContacto}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">Nome da Empresa</span><span className="font-bold text-base">{dadosContrato.empresaNome}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">Forma Jurídica</span><span className="font-bold text-base">{dadosContrato.formaJuridica}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">NIF</span><span className="font-bold text-base">{dadosContrato.nif}</span></div>
              <div className="md:col-span-2"><span className="block text-xs text-gray-500 uppercase font-bold mb-1">Morada Sede</span><span className="font-bold text-base">{dadosContrato.morada}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">Código Postal e Cidade</span><span className="font-bold text-base">{dadosContrato.codigoPostal}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">Número de Telefone</span><span className="font-bold text-base">{dadosContrato.telefone}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">E-mail de Contacto Geral</span><span className="font-bold text-base">{dadosContrato.emailContacto}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">E-mail Exclusivo p/ Reservas</span><span className="font-bold text-base">{dadosContrato.emailReservas}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">Website</span><span className="font-bold text-base">{dadosContrato.website || "N/A"}</span></div>
              <div><span className="block text-xs text-gray-500 uppercase font-bold mb-1">Responsável RGPD</span><span className="font-bold text-base">{dadosContrato.responsavelRGPD}</span></div>
            </div>
            
            <p className="italic text-center mt-6 mb-8">- doravante designado por "Parceiro" -</p>
            
            <div className="text-center p-6 border-y-2 border-slate-200 bg-slate-50">
               <p className="font-bold text-lg mb-2">É celebrado o presente contrato de intermediação e divulgação comercial aplicável a:</p>
               <span className="block text-xl font-black text-emerald-800 uppercase tracking-widest mt-4">
                  Todas as atividades organizadas por {dadosContrato.empresaNome}
               </span>
            </div>
          </div>

          <div className="space-y-6 text-[15px] text-justify pt-12">
            <h3 className="font-bold text-xl uppercase tracking-widest border-b border-black pb-2 mb-8">Cláusulas Contratuais Base</h3>
            <p className="mb-4"><strong>Artigo 1.º – Comissão:</strong> O Parceiro compromete-se a pagar à HelloCamp uma comissão de 12% (IVA incluído) sobre cada reserva efetuada através da plataforma. A comissão é calculada sobre o valor efetivamente pago pelo cliente.</p>
            <p className="mb-4"><strong>Artigo 2.º – Condições de Pagamento:</strong> As comissões devidas à HelloCamp serão faturadas de acordo com o modelo de pagamento acordado. O Parceiro compromete-se a liquidar as faturas emitidas dentro dos prazos nelas indicados.</p>
            <p className="mb-4"><strong>Artigo 3.º – Obrigações do Parceiro:</strong> O Parceiro compromete-se a manter as informações atualizadas, garantir a realização das atividades e não praticar preços superiores aos oferecidos nos seus canais diretos.</p>
            <p className="mb-8"><strong>Artigo 4.º – Duração e Renovação:</strong> O presente contrato produz efeitos a partir da data da sua assinatura. O contrato mantém-se válido até ao final do ano civil, renovando-se automaticamente por períodos de um ano.</p>
          </div>

          <div className="h-px bg-gray-300 w-full my-12"></div>

          {/* ANEXOS PREENCHIDOS */}
          <div className="space-y-12 font-sans text-sm text-slate-800">
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="font-black text-lg mb-4 text-black uppercase border-l-4 border-[#EBA914] pl-3">Anexo 1 – Procedimento de Reserva Acordado</h3>
              <div className="p-4 bg-white border border-black rounded-lg shadow-sm">
                <strong className="block text-black mb-1">{modalidadeNome}</strong>
                {dadosContrato.modalidadeReserva === 'link_externo' && dadosContrato.linkExternoReserva && (
                  <p className="mt-2 text-gray-600 bg-gray-50 p-2 rounded text-xs font-mono break-all border border-gray-200">
                    URL: {dadosContrato.linkExternoReserva}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h3 className="font-black text-lg mb-4 text-blue-950 uppercase border-l-4 border-blue-600 pl-3">Anexo 2 – Pagamento e comissão Acordado</h3>
              <div className="p-4 bg-white border border-blue-600 rounded-lg shadow-sm">
                <strong className="block text-blue-950 mb-1">
                  {dadosContrato.tipoPagamento === '100_total' ? '✅ 100% Pago no Ato da Reserva (Pagamento Imediato)' : '✅ Sinal de 50% Agora + 50% 1 Semana Antes'}
                </strong>
              </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
              <h3 className="font-black text-lg mb-4 text-amber-950 uppercase border-l-4 border-amber-500 pl-3">Anexo 3 – Política de Cancelamento Acordada</h3>
              <div className="p-4 bg-white border border-amber-500 rounded-lg shadow-sm">
                <strong className="block text-amber-950 mb-1">
                  ✅ {dadosContrato.politicaCancelamento}
                </strong>
              </div>
            </div>

            {dadosContrato.acordosComplementares && (
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-black text-lg mb-4 text-black uppercase border-l-4 border-gray-400 pl-3">Anexo 4 – Acordos Extraordinários</h3>
                <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg whitespace-pre-wrap font-medium">
                  {dadosContrato.acordosComplementares}
                </div>
              </div>
            )}
          </div>

          {/* ASSINATURAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-16 pt-12 border-t-2 border-black font-sans">
            <div>
              <h4 className="font-black mb-6 uppercase tracking-wider text-black text-sm">Pela HelloCamp</h4>
              <p className="font-serif text-xl italic text-gray-500 mb-2">Administração HelloCamp</p>
              <p className="text-sm font-medium border-t border-gray-200 mt-6 pt-4">Assinado digitalmente</p>
            </div>

            <div>
              <h4 className="font-black mb-6 uppercase tracking-wider text-black text-sm">Pelo Parceiro</h4>
              <p className="font-serif text-2xl italic text-black mb-1">{dadosContrato.assinaturaNome}</p>
              <p className="text-sm font-bold text-gray-500 mb-4">{dadosContrato.assinaturaCargo}</p>
              <p className="text-sm font-medium border-t border-gray-200 mt-6 pt-4">Data de submissão: {dataSubmissao}</p>
              <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded text-xs font-bold border border-emerald-200">
                <span>✓</span> Aceitou Termos e Condições
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
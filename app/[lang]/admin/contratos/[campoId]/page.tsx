"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";

export default function AssinaturaContratoPage({ params }: { params: Promise<{ lang: string, campoId: string }> }) {
  const { lang, campoId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [campo, setCampo] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);

  // Variáveis do Contrato
  const [form, setForm] = useState({
    pessoaContacto: "",
    formaJuridica: "",
    morada: "",
    codigoPostal: "",
    telefone: "",
    emailContacto: "",
    emailReservas: "",
    website: "",
    responsavelRGPD: "",
    modalidadeReserva: "", // 'email' ou 'direta'
    modalidadeCancelamento: "", // 'gratuito' ou 'reduzida'
    acordosComplementares: "",
    assinaturaNome: "",
    assinaturaCargo: "",
    concordaTermos: false
  });

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push(`/${lang}/admin/login`); return; }

      const { data: campoData } = await supabase.from('campos').select('*').eq('id', campoId).eq('organizador_id', session.user.id).single();
      const { data: perfilData } = await supabase.from('perfis').select('*').eq('id', session.user.id).single();

      if (!campoData || !perfilData) {
        alert("Acesso não autorizado.");
        router.push(`/${lang}/admin/dashboard`);
        return;
      }

      setCampo(campoData);
      setPerfil(perfilData);
      setLoading(false);
    };
    fetchDados();
  }, [campoId, lang, router]);

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modalidadeReserva || !form.modalidadeCancelamento) {
      alert("Por favor, selecione as opções nos Anexos 1 e 3 no final do documento.");
      return;
    }

    setSubmitting(true);

    const payload = {
      ...form,
      empresaNome: perfil.empresa_nome,
      nif: perfil.nif_empresa,
      campoNome: campo.nome,
      dataSubmissao: new Date().toISOString()
    };

    const { error } = await supabase
      .from('campos')
      .update({
        contrato_dados: payload,
        status_aprovacao: 'Pendente de Revisão'
      })
      .eq('id', campoId);

    if (error) {
      alert("Erro ao submeter: " + error.message);
    } else {
      alert("Contrato submetido com sucesso! A aguardar aprovação da equipa HelloCamp.");
      router.push(`/${lang}/admin/dashboard`);
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-500">A processar documento legal...</div>;

  const inputClass = "border-b border-black outline-none bg-transparent px-1 font-bold text-black min-w-[250px] placeholder:font-normal placeholder:text-gray-400";
  const dataAtual = new Date().toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main className="min-h-screen bg-slate-200 py-12 px-4 font-sans text-black selection:bg-yellow-200">
      <div className="max-w-4xl mx-auto">
        
        {/* BARRA DE TOPO */}
        <div className="mb-6 flex justify-between items-center">
          <Link href={`/${lang}/admin/dashboard`} className="text-sm font-bold text-slate-500 hover:text-black transition-colors">&larr; Voltar ao Painel</Link>
          <button onClick={handleSubmeter} disabled={submitting || !form.concordaTermos} className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg">
            {submitting ? 'A submeter...' : 'Assinar e Submeter Contrato'}
          </button>
        </div>

        {/* O DOCUMENTO "PAPEL" */}
        <form id="contrato-form" onSubmit={handleSubmeter} className="bg-white shadow-2xl p-8 md:p-16 text-black leading-relaxed space-y-8 rounded-sm">
          
          {/* LOGOTIPO E CABEÇALHO */}
          <div className="text-center mb-12">
            <div className="text-3xl font-extrabold tracking-tight mb-8">
              <span className="text-black">Hello</span><span className="text-[#EBA914]">Camp</span>
            </div>
            <h1 className="text-2xl font-bold uppercase mb-2 tracking-widest border-b border-black inline-block pb-2">Contrato de Intermediação Comercial</h1>
            <p className="text-sm italic text-gray-600 mt-4">O seu contrato de parceria com a HelloCamp, explicado de forma simples, transparente e objetiva.</p>
          </div>

          {/* INFOGRAFIA DOS 4 PASSOS (Substitui a Imagem do Word) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center my-12 bg-gray-50 p-6 border border-gray-200 rounded-xl">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center text-2xl shadow-sm mb-3">📝</div>
              <h4 className="font-bold text-sm">1. Contrato Concluído</h4>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center text-2xl shadow-sm mb-3">🏖️</div>
              <h4 className="font-bold text-sm">2. Promoção das Férias</h4>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center text-2xl shadow-sm mb-3">💻</div>
              <h4 className="font-bold text-sm">3. Inscrições Geradas</h4>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#EBA914] text-white rounded-full flex items-center justify-center text-2xl shadow-sm mb-3">€</div>
              <h4 className="font-bold text-sm">4. Repasse e Pagamento</h4>
            </div>
          </div>

          {/* INTRODUÇÃO EXPLICATIVA */}
          <div className="space-y-6 text-sm text-justify">
            <p>Parabéns! Está prestes a formalizar um contrato de parceria com a HelloCamp. Este documento regula a divulgação, promoção e intermediação das suas ofertas através da nossa plataforma digital, estabelecendo os termos de colaboração entre ambas as partes.</p>
            <p>Após a celebração deste contrato, a HelloCamp procederá à recolha, otimização e publicação das informações relativas às atividades disponibilizadas pelo Parceiro. Paralelamente, promoveremos os seus programas através dos nossos canais digitais, garantindo a sua exposição a milhares de famílias.</p>
            <p>As reservas poderão ser efetuadas pelos clientes de acordo com a modalidade que o Parceiro selecionar no Anexo 1 (Reserva Direta ou Comunicação por E-mail). Em contrapartida pela intermediação comercial e tecnológica, a HelloCamp processará a cobrança de uma comissão sobre cada inscrição validada.</p>
          </div>

          <div className="h-px bg-gray-300 w-full my-12"></div>

          {/* IDENTIFICAÇÃO DAS PARTES */}
          <div className="space-y-4 font-serif text-[15px]">
            <h2 className="text-xl font-bold text-center uppercase tracking-widest mb-8">Acordo de Prestação de Serviços</h2>

            <p>Entre a <strong>HelloCamp</strong>, com website em www.hellocamp.pt e contacto via info@hellocamp.pt, doravante designada por "Primeiro Outorgante"; e do outro lado:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mt-8 bg-gray-50 p-8 border border-gray-200 rounded-lg">
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Nome da Empresa</label><input required type="text" className={inputClass} value={perfil.empresa_nome || ""} readOnly /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">NIF</label><input required type="text" className={inputClass} value={perfil.nif_empresa || ""} readOnly /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Forma Jurídica</label><input required type="text" className={inputClass} value={form.formaJuridica} onChange={e => setForm({...form, formaJuridica: e.target.value})} placeholder="Ex: Lda, Associação..." /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Responsável / Contacto</label><input required type="text" className={inputClass} value={form.pessoaContacto} onChange={e => setForm({...form, pessoaContacto: e.target.value})} placeholder="Nome completo" /></div>
              <div className="flex flex-col md:col-span-2"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Morada Fiscal</label><input required type="text" className={inputClass} value={form.morada} onChange={e => setForm({...form, morada: e.target.value})} placeholder="Rua, número, porta" /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Código Postal e Cidade</label><input required type="text" className={inputClass} value={form.codigoPostal} onChange={e => setForm({...form, codigoPostal: e.target.value})} placeholder="0000-000 Cidade" /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Número de Telefone</label><input required type="text" className={inputClass} value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">E-mail Comercial</label><input required type="email" className={inputClass} value={form.emailContacto} onChange={e => setForm({...form, emailContacto: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">E-mail para Reservas</label><input required type="email" className={inputClass} value={form.emailReservas} onChange={e => setForm({...form, emailReservas: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Website (Opcional)</label><input type="text" className={inputClass} value={form.website} onChange={e => setForm({...form, website: e.target.value})} /></div>
              <div className="flex flex-col"><label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Responsável de Dados (RGPD)</label><input required type="text" className={inputClass} value={form.responsavelRGPD} onChange={e => setForm({...form, responsavelRGPD: e.target.value})} /></div>
            </div>
            
            <p className="mt-6 italic">- doravante designado por "Parceiro" ou "Segundo Outorgante" -</p>
            <p className="font-bold mt-4 text-justify">É celebrado livremente e de boa-fé o presente contrato de intermediação e divulgação comercial aplicável ao programa / campo de férias denominado: <span className="underline decoration-2 underline-offset-4 decoration-[#EBA914]">{campo.nome}</span>.</p>
          </div>

          {/* CLÁUSULAS CONTRATUAIS */}
          <div className="space-y-8 font-serif text-[15px] text-justify pt-8">
            <h3 className="font-bold text-xl uppercase tracking-widest border-b border-black pb-2 mb-6">Cláusulas Contratuais</h3>
            
            <div>
              <h4 className="font-bold mb-2">Artigo 1.º – Objeto e Comissão</h4>
              <p className="mb-2">1. O Parceiro compromete-se a remunerar o Primeiro Outorgante com uma comissão de prestação de serviços fixada em <strong>12% (IVA não incluído)</strong> sobre cada reserva efetivada através da plataforma HelloCamp.</p>
              <p className="mb-2">2. A base de incidência da comissão recai sobre o valor total efetivamente pago pelo cliente final relativamente à atividade reservada, incluindo eventuais serviços logísticos adicionais contratados pelo cliente através do portal.</p>
              <p className="mb-2">3. O Parceiro compromete-se a enviar ao cliente a devida confirmação de inscrição e a assegurar o cumprimento integral e zeloso da prestação dos serviços contratados pela família.</p>
              <p>4. Em caso de cancelamento da reserva por iniciativa do cliente, aplicar-se-ão estritamente as condições previstas no Anexo 3 deste documento.</p>
            </div>

            <div>
              <h4 className="font-bold mb-2">Artigo 2.º – Processamento e Condições de Pagamento</h4>
              <p className="mb-2">1. Caso o Parceiro opte pela modalidade de "Reserva Direta", os pagamentos serão processados de forma segura através da infraestrutura financeira <strong>Stripe Connect</strong>.</p>
              <p>2. Na referida modalidade, o valor da comissão devida à HelloCamp é automaticamente retido no ato do pagamento, sendo o montante remanescente (lucro líquido) transferido diretamente para a conta bancária ou IBAN associado pelo Parceiro na plataforma, isentando as partes de faturação manual morosa.</p>
            </div>

            <div>
              <h4 className="font-bold mb-2">Artigo 3.º – Obrigações e Responsabilidades do Parceiro</h4>
              <p className="mb-2">1. O Parceiro declara, sob compromisso de honra, que possui todos os seguros de responsabilidade civil e acidentes pessoais legalmente exigidos, bem como o licenciamento do IPDJ válido para a execução das atividades propostas.</p>
              <p className="mb-2">2. O Parceiro garante deter a titularidade ou autorização sobre todos os direitos de imagem e conteúdos textuais fornecidos à HelloCamp para efeitos de divulgação comercial.</p>
              <p className="mb-2">3. O Parceiro obriga-se a praticar na plataforma HelloCamp preços de paridade comercial, não podendo estes ser superiores aos preços divulgados nos canais diretos do próprio Parceiro.</p>
              <p>4. O Parceiro assume inteira e exclusiva responsabilidade civil, criminal e operacional sobre a salvaguarda e bem-estar dos participantes durante o decurso dos turnos.</p>
            </div>

            <div>
              <h4 className="font-bold mb-2">Artigo 4.º – Duração, Renovação e Denúncia</h4>
              <p>O presente contrato entra em vigor na data da sua assinatura eletrónica. O seu término coincide com o último dia do ano civil em curso, renovando-se automaticamente por sucessivos períodos de um ano. A intenção de rescisão deverá ser comunicada por escrito, por qualquer uma das partes, com uma antecedência mínima de 30 dias face ao seu termo.</p>
            </div>
          </div>

          <div className="h-px bg-gray-300 w-full my-12"></div>

          {/* ANEXOS (A PREENCHER PELO PARCEIRO) */}
          <div className="space-y-10 font-sans">
            
            <div className="bg-blue-50 p-8 rounded-xl border border-blue-100">
              <h3 className="font-black text-lg mb-2 text-blue-900 uppercase">Anexo 1 – Modalidade de Inscrição e Reserva</h3>
              <p className="text-sm mb-6 text-blue-800">Selecione o procedimento logístico que melhor se adapta à sua operação.</p>
              
              <div className="space-y-4">
                <label className="flex items-start gap-4 cursor-pointer bg-white p-4 rounded-lg border border-blue-200 hover:border-blue-400 transition-colors">
                  <input type="radio" name="anexo1" required value="direta" onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-blue-600" />
                  <div>
                    <span className="font-bold text-slate-900 block mb-1">Reserva Direta com Pagamento Automático (Recomendado)</span>
                    <span className="text-sm text-slate-600 leading-relaxed block">As reservas são processadas em tempo real. O encarregado de educação paga de imediato via Stripe, garantindo a vaga. O Parceiro acede a todos os dados do participante (fichas clínicas, autorizações) de forma organizada no Dashboard.</span>
                  </div>
                </label>

                <label className="flex items-start gap-4 cursor-pointer bg-white p-4 rounded-lg border border-blue-200 hover:border-blue-400 transition-colors">
                  <input type="radio" name="anexo1" required value="email" onChange={e => setForm({...form, modalidadeReserva: e.target.value})} className="mt-1 w-4 h-4 accent-blue-600" />
                  <div>
                    <span className="font-bold text-slate-900 block mb-1">Comunicação por E-mail (Reserva Sob Consulta)</span>
                    <span className="text-sm text-slate-600 leading-relaxed block">O cliente não paga no imediato. A HelloCamp recolhe os dados do cliente e envia-lhe um e-mail com a intenção de reserva. O Parceiro analisa, valida e contacta a família para prosseguir com o pagamento de forma externa.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-amber-50 p-8 rounded-xl border border-amber-100">
              <h3 className="font-black text-lg mb-2 text-amber-900 uppercase">Anexo 3 – Política de Cancelamento</h3>
              <p className="text-sm mb-6 text-amber-800">Defina as regras aplicáveis caso o encarregado de educação pretenda cancelar a reserva.</p>
              
              <div className="space-y-4">
                <label className="flex items-start gap-4 cursor-pointer bg-white p-4 rounded-lg border border-amber-200 hover:border-amber-400 transition-colors">
                  <input type="radio" name="anexo3" required value="gratuito" onChange={e => setForm({...form, modalidadeCancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <span className="font-bold text-slate-900 block mb-1">Cancelamento Gratuito (Sem Comissão)</span>
                    <span className="text-sm text-slate-600 leading-relaxed block">Se a reserva for cancelada até 12 dias antes do início do programa, a HelloCamp isenta o parceiro de qualquer comissão. O Parceiro compromete-se a reembolsar o cliente na totalidade no prazo máximo de 30 dias.</span>
                  </div>
                </label>

                <label className="flex items-start gap-4 cursor-pointer bg-white p-4 rounded-lg border border-amber-200 hover:border-amber-400 transition-colors">
                  <input type="radio" name="anexo3" required value="reduzida" onChange={e => setForm({...form, modalidadeCancelamento: e.target.value})} className="mt-1 w-4 h-4 accent-amber-600" />
                  <div>
                    <span className="font-bold text-slate-900 block mb-1">Aplicação dos Termos do Parceiro (Comissão Reduzida)</span>
                    <span className="text-sm text-slate-600 leading-relaxed block">Aplicam-se os termos de cancelamento do próprio Parceiro. A comissão da HelloCamp será recalculada e aplicada apenas de forma proporcional ao valor que o Parceiro efetivamente reteve do cliente a título de penalização.</span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2 uppercase">Anexo 4 – Acordos Extraordinários</h3>
              <p className="text-sm mb-2 text-gray-600">Registe abaixo caso existam adendas pré-acordadas com a equipa HelloCamp (ex: Taxa de comissão diferente da padrão). Caso não existam, deixe em branco.</p>
              <textarea 
                className="w-full border border-gray-300 p-4 rounded-lg bg-gray-50 outline-none focus:border-black" 
                rows={3} 
                value={form.acordosComplementares} 
                onChange={e => setForm({...form, acordosComplementares: e.target.value})}
              ></textarea>
            </div>

          </div>

          {/* ÁREA DE ASSINATURAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16 pt-12 border-t-4 border-black font-sans bg-gray-50 p-8 rounded-xl">
            <div>
              <h4 className="font-black mb-6 uppercase tracking-wider text-gray-500 text-sm">Pela HelloCamp</h4>
              <p className="font-serif italic text-2xl text-gray-400 mb-4">Administração HelloCamp</p>
              <p className="text-sm font-bold text-gray-600">Data e Hora do Sistema: <br/><span className="font-normal">{dataAtual}</span></p>
            </div>

            <div>
              <h4 className="font-black mb-6 uppercase tracking-wider text-gray-500 text-sm">Pelo Parceiro Organizador</h4>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase mb-1">Escreva o seu Nome (Assinatura Digital) *</label>
                  <input required type="text" className="border-b-2 border-black bg-transparent outline-none py-2 text-xl font-serif italic" value={form.assinaturaNome} onChange={e => setForm({...form, assinaturaNome: e.target.value})} placeholder="O seu nome completo" />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase mb-1">Indique o seu Cargo *</label>
                  <input required type="text" className="border-b border-gray-400 bg-transparent outline-none py-1" value={form.assinaturaCargo} onChange={e => setForm({...form, assinaturaCargo: e.target.value})} placeholder="Ex: Sócio-Gerente" />
                </div>
                <p className="text-sm font-bold text-gray-600 pt-2">Data e Hora do Sistema: <br/><span className="font-normal">{dataAtual}</span></p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-300">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" required checked={form.concordaTermos} onChange={e => setForm({...form, concordaTermos: e.target.checked})} className="mt-1 w-5 h-5 accent-black cursor-pointer" />
                  <span className="text-sm text-gray-700 font-medium leading-relaxed group-hover:text-black transition-colors">
                    Declaro, sob compromisso de honra, que possuo poderes legais e estatutários para vincular a entidade supra identificada através da presente assinatura digital.
                  </span>
                </label>
              </div>
            </div>
          </div>

        </form>
      </div>
    </main>
  );
}
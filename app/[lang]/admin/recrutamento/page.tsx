"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

export default function RecrutamentoParceirosPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  // --- ESTADOS GERAIS E NAVEGAÇÃO ---
  const [activeTab, setActiveTab] = useState<"descobrir" | "guardados" | "mensagens">("descobrir");
  const [loading, setLoading] = useState(true);

  // --- ESTADOS: TALENTOS (DESCOBRIR & GUARDADOS) ---
  const [monitores, setMonitores] = useState<any[]>([]);
  const [filtroDistrito, setFiltroDistrito] = useState("");
  const [filtroExperiencia, setFiltroExperiencia] = useState("");
  const [monitorSelecionado, setMonitorSelecionado] = useState<any>(null);
  const [guardadosIds, setGuardadosIds] = useState<string[]>([]); // Na vida real, viria de uma tabela 'monitores_favoritos'

  // --- ESTADOS: MENSAGENS (INBOX RECRUTAMENTO) ---
  const [conversas, setConversas] = useState<any[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<any>(null);
  const [novaMensagem, setNovaMensagem] = useState("");

  useEffect(() => {
    const fetchDados = async () => {
      // 1. Buscar monitores na Base de Dados
      const { data: monitoresData } = await supabase
        .from('monitores')
        .select('*')
        .order('criado_at', { ascending: false });
        
      setMonitores(monitoresData || []);

      // 2. Simular busca de conversas de recrutamento
      setTimeout(() => {
        setConversas([
          { id: 1, monitor_nome: "Ana Beatriz", vaga: "Monitora Surf - Verão", ultima_mensagem: "Sim, estou disponível de 15 de Julho a 15 de Agosto.", data: "10:45", lida: false, foto: "" },
          { id: 2, monitor_nome: "Tiago Silva", vaga: "Coordenador - Páscoa", ultima_mensagem: "Envio o meu certificado do IPDJ em anexo.", data: "Ontem", lida: true, foto: "" }
        ]);
        setLoading(false);
      }, 500);
    };

    fetchDados();
  }, []);

  // --- LÓGICA AUXILIAR ---
  const calcularIdade = (dataNascimento: string) => {
    if (!dataNascimento) return "N/D";
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const toggleGuardar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setGuardadosIds(prev => 
      prev.includes(id) ? prev.filter(guardadoId => guardadoId !== id) : [...prev, id]
    );
  };

  const handleEnviarMensagem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;
    alert("Mensagem enviada com sucesso!");
    setNovaMensagem("");
  };

  // --- FILTRAGEM ---
  const monitoresFiltrados = monitores.filter(m => {
    const matchDistrito = filtroDistrito === "" || m.distrito_residencia === filtroDistrito;
    const matchExperiencia = filtroExperiencia === "" || m.experiencia_anos === filtroExperiencia;
    return matchDistrito && matchExperiencia;
  });

  const monitoresGuardados = monitores.filter(m => guardadosIds.includes(m.id));

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];
  const selectClass = "w-full py-2 px-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-all shadow-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.6rem_auto] bg-[position:right_0.75rem_center] bg-no-repeat";

  // --- COMPONENTE GRELHA DE MONITORES (Reutilizável para Descobrir e Guardados) ---
  const renderGrelhaMonitores = (lista: any[], emptyMessage: string) => {
    if (loading) {
      return <div className="text-center py-20 text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">{isEn ? "Loading talent pool..." : "A carregar talentos..."}</div>;
    }
    
    if (lista.length === 0) {
      return (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
          <span className="text-4xl block mb-4">🔍</span>
          <h3 className="text-lg font-black text-slate-900 mb-2">{isEn ? "No monitors found" : "Nenhum monitor encontrado"}</h3>
          <p className="text-sm text-slate-500 font-medium">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {lista.map(monitor => {
          const isGuardado = guardadosIds.includes(monitor.id);
          return (
            <div key={monitor.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group relative">
              
              <button 
                onClick={(e) => toggleGuardar(e, monitor.id)} 
                className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm border ${isGuardado ? 'bg-amber-100 text-amber-500 border-amber-200' : 'bg-white text-slate-300 border-slate-200 hover:text-amber-400'}`}
              >
                ★
              </button>

              <div className="p-5 pb-3 border-b border-slate-100 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {monitor.fotografia_url ? <img src={monitor.fotografia_url} alt={monitor.nome_completo} className="w-full h-full object-cover" /> : <span className="text-lg">🧑‍🏫</span>}
                </div>
                <div className="flex-1 overflow-hidden pr-6">
                  <h3 className="text-sm font-black text-slate-900 leading-tight truncate group-hover:text-emerald-600 transition-colors">{monitor.nome_completo}</h3>
                  <div className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                    <span>📍 {monitor.distrito_residencia}</span>
                    <span className="text-slate-300">•</span>
                    <span>{calcularIdade(monitor.data_nascimento)} {isEn ? "yrs" : "anos"}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">{isEn ? "Experience" : "Experiência"}</span>
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">{monitor.experiencia_anos === "0" ? (isEn ? "Beginner" : "Iniciante") : `${monitor.experiencia_anos} ${isEn ? "years" : "anos"}`}</span>
                </div>
                <div className="mb-5 flex-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">{isEn ? "Certificates" : "Certificações"}</span>
                  <div className="flex flex-wrap gap-1">
                    {monitor.certificacoes && monitor.certificacoes.length > 0 ? (
                      monitor.certificacoes.slice(0, 2).map((cert: string) => (
                        <span key={cert} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider rounded border border-emerald-100 truncate max-w-full">{cert}</span>
                      ))
                    ) : <span className="text-[10px] text-slate-400 italic font-medium">Nenhuma registada</span>}
                  </div>
                </div>
                <button onClick={() => setMonitorSelecionado(monitor)} className="w-full py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-600 transition-colors shadow-sm">
                  {isEn ? "View Profile" : "Ver Perfil"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)]">
      
      {/* CABEÇALHO & TABS */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight m-0 mb-1">
          {isEn ? "Staff Recruitment" : "Recrutamento de Equipa"}
        </h1>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
          {isEn ? "Find, save, and contact monitors" : "Pesquisa, Shortlist e Contacto Direto"}
        </p>

        {/* NAVEGAÇÃO DAS TABS */}
        <div className="flex gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab("descobrir")}
            className={`px-5 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${activeTab === "descobrir" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"}`}
          >
            🔍 {isEn ? "Discover" : "Descobrir"}
          </button>
          <button 
            onClick={() => setActiveTab("guardados")}
            className={`px-5 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${activeTab === "guardados" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"}`}
          >
            ⭐ {isEn ? "Shortlist" : "Guardados"} 
            {guardadosIds.length > 0 && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px]">{guardadosIds.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab("mensagens")}
            className={`px-5 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${activeTab === "mensagens" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"}`}
          >
            💬 {isEn ? "Messages" : "Mensagens"}
            {conversas.filter(c => !c.lida).length > 0 && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px]">{conversas.filter(c => !c.lida).length}</span>}
          </button>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO (Scrollável) */}
      <div className="flex-1 overflow-y-auto pb-10">
        
        {/* TAB 1: DESCOBRIR */}
        {activeTab === "descobrir" && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <select className={selectClass} value={filtroDistrito} onChange={e => setFiltroDistrito(e.target.value)}>
                  <option value="">📍 {isEn ? "All Districts" : "Todos os Distritos"}</option>
                  {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <select className={selectClass} value={filtroExperiencia} onChange={e => setFiltroExperiencia(e.target.value)}>
                  <option value="">⭐ {isEn ? "Any Experience" : "Qualquer Experiência"}</option>
                  <option value="0">{isEn ? "First Time" : "Nenhuma / Primeira vez"}</option>
                  <option value="1-2">1-2 {isEn ? "years" : "anos"}</option>
                  <option value="3-5">3-5 {isEn ? "years" : "anos"}</option>
                  <option value="+5">+5 {isEn ? "years" : "anos"}</option>
                </select>
              </div>
            </div>
            {renderGrelhaMonitores(monitoresFiltrados, isEn ? "Try adjusting your filters to see more results." : "Tente ajustar os filtros para encontrar a equipa ideal.")}
          </div>
        )}

        {/* TAB 2: GUARDADOS */}
        {activeTab === "guardados" && (
          <div className="animate-in fade-in duration-300">
             {renderGrelhaMonitores(monitoresGuardados, isEn ? "You haven't saved any profiles yet. Click the star icon on a monitor's card to shortlist them." : "Ainda não guardou nenhum monitor. Clique na estrela no cartão de um jovem para adicioná-lo a esta lista.")}
          </div>
        )}

        {/* TAB 3: MENSAGENS (INBOX DO PARCEIRO) */}
        {activeTab === "mensagens" && (
          <div className="animate-in fade-in duration-300 h-full min-h-[500px] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex flex-1 overflow-hidden h-full">
              
              {/* Coluna Esquerda: Lista */}
              <div className={`w-full md:w-1/3 border-r border-slate-100 bg-slate-50 overflow-y-auto flex flex-col ${conversaAtiva ? 'hidden md:flex' : 'flex'}`}>
                {conversas.map(conv => (
                  <button 
                    key={conv.id} 
                    onClick={() => setConversaAtiva(conv)}
                    className={`w-full text-left p-4 border-b border-slate-100 transition-colors hover:bg-white ${conversaAtiva?.id === conv.id ? 'bg-white shadow-[inset_4px_0_0_#10b981]' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-black truncate ${conv.lida ? 'text-slate-700' : 'text-slate-900'}`}>{conv.monitor_nome}</span>
                      <span className="text-[9px] font-bold text-slate-400 flex-shrink-0 ml-2">{conv.data}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block mb-1.5 truncate">{conv.vaga}</span>
                    <p className={`text-xs m-0 truncate ${conv.lida ? 'text-slate-500 font-medium' : 'text-slate-900 font-bold'}`}>
                      {conv.ultima_mensagem}
                    </p>
                  </button>
                ))}
              </div>

              {/* Coluna Direita: Conversa */}
              <div className={`w-full md:w-2/3 bg-white flex flex-col ${!conversaAtiva ? 'hidden md:flex' : 'flex'}`}>
                {!conversaAtiva ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8">
                    <span className="text-4xl mb-4">💬</span>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{isEn ? "Select a conversation" : "Selecione um candidato para conversar"}</p>
                  </div>
                ) : (
                  <>
                    {/* Header Chat */}
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50 flex-shrink-0">
                      <button onClick={() => setConversaAtiva(null)} className="md:hidden text-slate-400 hover:text-slate-700 p-1">&larr;</button>
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm flex-shrink-0">🧑‍🏫</div>
                      <div className="overflow-hidden">
                        <h3 className="text-sm font-black text-slate-900 m-0 truncate">{conversaAtiva.monitor_nome}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0 truncate">{conversaAtiva.vaga}</p>
                      </div>
                      <button className="ml-auto text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100">
                        {isEn ? "View Profile" : "Ver Perfil"}
                      </button>
                    </div>

                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
                      <div className="flex flex-col items-end self-end max-w-[85%] ml-auto">
                        <span className="text-[9px] font-bold text-slate-400 mr-2 mb-1">{isEn ? "You (Partner)" : "O seu Campo"}</span>
                        <div className="bg-slate-900 text-white text-sm font-medium p-3 rounded-2xl rounded-tr-sm shadow-sm">
                          {isEn ? "Hello! Are you available to join our camp in August?" : "Olá! Estamos a recrutar monitores para os nossos campos de Agosto em Faro. Tens disponibilidade e interesse em saber mais?"}
                        </div>
                      </div>
                      <div className="flex flex-col items-start max-w-[85%]">
                        <span className="text-[9px] font-bold text-slate-400 ml-2 mb-1">{conversaAtiva.monitor_nome}</span>
                        <div className="bg-white border border-slate-200 text-slate-700 text-sm font-medium p-3 rounded-2xl rounded-tl-sm shadow-sm">
                          {conversaAtiva.ultima_mensagem}
                        </div>
                      </div>
                    </div>

                    {/* Input Chat */}
                    <div className="p-3 bg-white border-t border-slate-100 flex-shrink-0">
                      <form onSubmit={handleEnviarMensagem} className="flex gap-2">
                        <input 
                          type="text" value={novaMensagem} onChange={(e) => setNovaMensagem(e.target.value)}
                          placeholder={isEn ? "Type a message..." : "Escreva uma mensagem..."}
                          className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:border-emerald-500"
                        />
                        <button type="submit" className="bg-slate-900 text-white px-5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-sm">
                          {isEn ? "Send" : "Enviar"}
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL DO PERFIL COMPLETO (Global) */}
      {monitorSelecionado && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                  {monitorSelecionado.fotografia_url ? <img src={monitorSelecionado.fotografia_url} alt={monitorSelecionado.nome_completo} className="w-full h-full object-cover" /> : <span className="text-xl">🧑‍🏫</span>}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 m-0">{monitorSelecionado.nome_completo}</h2>
                  <p className="text-xs font-bold text-slate-500 mt-1">📍 {monitorSelecionado.distrito_residencia} • {calcularIdade(monitorSelecionado.data_nascimento)} {isEn ? "years old" : "anos"}</p>
                </div>
              </div>

              <button onClick={() => setMonitorSelecionado(null)} className="w-8 h-8 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full flex items-center justify-center font-bold transition-colors relative z-10">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-6">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{isEn ? "Pitch / Presentation" : "Carta de Apresentação"}</h4>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-700 leading-relaxed m-0 font-medium whitespace-pre-wrap">
                    {monitorSelecionado.bio || (isEn ? "No bio provided." : "O monitor não preencheu a biografia.")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{isEn ? "Certificates" : "Certificações"}</h4>
                  <div className="flex flex-col gap-2">
                    {monitorSelecionado.certificacoes && monitorSelecionado.certificacoes.length > 0 ? (
                      monitorSelecionado.certificacoes.map((cert: string) => (
                        <div key={cert} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-emerald-100 shadow-sm">
                          <span className="text-emerald-500 text-xs">✓</span>
                          <span className="text-xs font-bold text-slate-700">{cert}</span>
                        </div>
                      ))
                    ) : <p className="text-xs font-medium text-slate-500 italic m-0">Nenhuma registada.</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{isEn ? "Availability" : "Disponibilidade"}</h4>
                  <div className="flex flex-wrap gap-2">
                    {monitorSelecionado.disponibilidade && monitorSelecionado.disponibilidade.length > 0 ? (
                      monitorSelecionado.disponibilidade.map((disp: string) => (
                        <span key={disp} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">📅 {disp}</span>
                      ))
                    ) : <p className="text-xs font-medium text-slate-500 italic m-0">Não especificada.</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-200 bg-white flex-shrink-0 flex flex-col sm:flex-row gap-3">
               <button 
                  onClick={() => { setMonitorSelecionado(null); setActiveTab("mensagens"); }}
                  className="flex-1 bg-emerald-600 text-white flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm"
               >
                 <span>💬</span> {isEn ? "Start Chat" : "Iniciar Conversa (Chat)"}
               </button>
               <a 
                 href={`tel:${monitorSelecionado.telefone}`}
                 className="flex-1 bg-white border border-slate-200 text-slate-800 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all no-underline"
               >
                 <span>📞</span> Ligar ({monitorSelecionado.telefone})
               </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
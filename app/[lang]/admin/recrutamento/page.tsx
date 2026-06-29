"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link"; // IMPORTANTE: Adicionado o import do Link

export default function RecrutamentoParceirosPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  // --- NAVEGAÇÃO E SESSÃO ---
  const [activeTab, setActiveTab] = useState<"descobrir" | "guardados" | "mensagens">("descobrir");
  const [loading, setLoading] = useState(true);
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [parceiroPerfil, setParceiroPerfil] = useState<any>(null);

  // --- CONTROLO DE ACESSO (PAYWALL / CONTRATO) ---
  const [statusContrato, setStatusContrato] = useState<string>("Não Iniciado");
  const [temAcesso, setTemAcesso] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);

  // --- DATA STATES ---
  const [monitores, setMonitores] = useState<any[]>([]);
  const [guardadosIds, setGuardadosIds] = useState<string[]>([]);
  const [conversas, setConversas] = useState<any[]>([]);
  
  // --- FILTROS & SELEÇÃO ---
  const [filtroDistrito, setFiltroDistrito] = useState("");
  const [filtroExperiencia, setFiltroExperiencia] = useState("");
  const [monitorSelecionado, setMonitorSelecionado] = useState<any>(null);
  const [conversaAtiva, setConversaAtiva] = useState<any>(null);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [sendingMsg, setSendingEdit] = useState(false);

  // --- ESTADO DO CALENDÁRIO DA LIGHTBOX ---
  const [mesModalView, setMesModalView] = useState(new Date());

  const mesesNomes = isEn 
    ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    : ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
  const diasDaSemana = isEn ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // --- CARREGAMENTO INICIAL DOS DADOS REAIS ---
  const carregarDadosRecrutamento = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const userId = session.user.id;
    setParceiroId(userId);

    // 1. Obter Perfil do Parceiro
    const { data: perfilData } = await supabase.from('perfis').select('empresa_nome').eq('id', userId).single();
    setParceiroPerfil(perfilData);

    // 2. VERIFICAR STATUS DO CONTRATO NA TABELA 'campos'
    const { data: camposData } = await supabase.from('campos').select('status_aprovacao').eq('organizador_id', userId);
    
    let acesso = false;
    let currentStatus = isEn ? "Not Started" : "Não Iniciado";

    if (camposData && camposData.length > 0) {
      // Verifica se existe algum campo validado
      const isApproved = camposData.some(c => {
         const st = (c.status_aprovacao || '').toLowerCase();
         return st === 'aprovado' || st === 'validado' || st === 'ativo' || st === 'active';
      });
      
      if (isApproved) {
         acesso = true;
         currentStatus = isEn ? "Validated" : "Validado";
      } else {
         currentStatus = camposData[0].status_aprovacao || (isEn ? "Pending" : "Pendente");
      }
    }
    
    setTemAcesso(acesso);
    setStatusContrato(currentStatus);

    // 3. Carregar Monitores e Guardados
    const { data: monitoresData } = await supabase.from('monitores').select('*').order('criado_at', { ascending: false });
    setMonitores(monitoresData || []);

    const { data: favsData } = await supabase.from('monitores_favoritos').select('monitor_id').eq('parceiro_id', userId);
    if (favsData) {
      setGuardadosIds(favsData.map(f => f.monitor_id));
    }

    // 4. Carregar Histórico de Mensagens
    const { data: msgData } = await supabase
      .from('mensagens_recrutamento')
      .select('*, monitores(nome_completo, fotografia_url, email)')
      .eq('parceiro_id', userId)
      .order('criado_at', { ascending: true });

    if (msgData) {
      const threadsMap: { [key: string]: any } = {};
      
      msgData.forEach(msg => {
        const mId = msg.monitor_id;
        if (!threadsMap[mId]) {
          threadsMap[mId] = {
            monitor_id: mId,
            monitor_nome: msg.monitores?.nome_completo || "Monitor",
            monitor_email: msg.monitores?.email || "",
            fotografia_url: msg.monitores?.fotografia_url || "",
            vaga: isEn ? "Staff Position" : "Candidatura a Monitor",
            mensagens: [],
            ultima_mensagem: "",
            data: "",
            lida: true
          };
        }
        threadsMap[mId].mensagens.push(msg);
        threadsMap[mId].ultima_mensagem = msg.mensagem;
        threadsMap[mId].data = new Date(msg.criado_at).toLocaleDateString('pt-PT', {hour: '2-digit', minute:'2-digit'});
        if (msg.remetente === 'monitor' && !msg.lida) {
          threadsMap[mId].lida = false;
        }
      });

      setConversas(Object.values(threadsMap));
      if (conversaAtiva) setConversaAtiva(threadsMap[conversaAtiva.monitor_id] || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarDadosRecrutamento();
  }, [conversaAtiva?.monitor_id]);

  // --- LÓGICA DE FAVORITOS E MENSAGENS ---
  const toggleGuardar = async (e: React.MouseEvent, idMonitor: string) => {
    e.stopPropagation();
    if (!temAcesso) {
      setShowLockModal(true);
      return;
    }

    if (!parceiroId) return;

    if (guardadosIds.includes(idMonitor)) {
      await supabase.from('monitores_favoritos').delete().eq('parceiro_id', parceiroId).eq('monitor_id', idMonitor);
      setGuardadosIds(prev => prev.filter(id => id !== idMonitor));
    } else {
      await supabase.from('monitores_favoritos').insert([{ parceiro_id: parceiroId, monitor_id: idMonitor }]);
      setGuardadosIds(prev => [...prev, idMonitor]);
    }
  };

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!temAcesso) {
      setShowLockModal(true);
      return;
    }
    if (!novaMensagem.trim() || !parceiroId || !conversaAtiva) return;
    setSendingEdit(true);

    const payloadMsg = {
      parceiro_id: parceiroId,
      monitor_id: conversaAtiva.monitor_id,
      remetente: 'parceiro',
      mensagem: novaMensagem.trim()
    };

    const { error } = await supabase.from('mensagens_recrutamento').insert([payloadMsg]);

    if (error) {
      alert("Erro ao enviar mensagem: " + error.message);
      setSendingEdit(false);
      return;
    }

    try {
      await fetch('/api/notificacoes/nova-mensagem-recrutamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinatarioEmail: conversaAtiva.monitor_email,
          nomeRemetente: parceiroPerfil?.empresa_nome || "HelloCamp Parceiro",
          textoMensagem: novaMensagem.trim(),
          tipoDestinatario: 'monitor',
          lang: lang
        })
      });
    } catch (err) {
      console.error("Erro no envio do email de alerta:", err);
    }

    setNovaMensagem("");
    setSendingEdit(false);
    carregarDadosRecrutamento();
  };

  const marcarComoLidas = async (mId: string) => {
    if (!parceiroId) return;
    await supabase.from('mensagens_recrutamento').update({ lida: true }).eq('parceiro_id', parceiroId).eq('monitor_id', mId).eq('remetente', 'monitor');
  };

  const selecionarConversa = (conv: any) => {
    if (!temAcesso) {
      setShowLockModal(true);
      return;
    }
    setConversaAtiva(conv);
    marcarComoLidas(conv.monitor_id);
  };

  const iniciarConversaComMonitor = async (monitor: any) => {
    if (!temAcesso) {
      setShowLockModal(true);
      return;
    }
    if (!parceiroId) return;
    setMonitorSelecionado(null);
    
    const { data: existeThread } = await supabase.from('mensagens_recrutamento').select('id').eq('parceiro_id', parceiroId).eq('monitor_id', monitor.id).limit(1);

    if (!existeThread || existeThread.length === 0) {
      await supabase.from('mensagens_recrutamento').insert([{
        parceiro_id: parceiroId,
        monitor_id: monitor.id,
        remetente: 'parceiro',
        mensagem: isEn ? "Hello! We reviewed your profile on HelloCamp." : "Olá! Vimos o teu perfil na Bolsa de Monitores da HelloCamp e ficámos interessados."
      }]);
    }

    await carregarDadosRecrutamento();
    setActiveTab("mensagens");
    
    setTimeout(() => {
      const threadCriada = conversas.find(c => c.monitor_id === monitor.id);
      if (threadCriada) setConversaAtiva(threadCriada);
    }, 400);
  };

  const calcularIdade = (dataNascimento: string) => {
    if (!dataNascimento) return "N/D";
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--;
    return idade;
  };

  const monitoresFiltrados = monitores.filter(m => {
    const matchDistrito = filtroDistrito === "" || m.distrito_residencia === filtroDistrito;
    const matchExperiencia = filtroExperiencia === "" || m.experiencia_anos === filtroExperiencia;
    return matchDistrito && matchExperiencia;
  });

  const monitoresGuardados = monitores.filter(m => guardadosIds.includes(m.id));
  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];
  const selectClass = "w-full py-2 px-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-all shadow-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.6rem_auto] bg-[position:right_0.75rem_center] bg-no-repeat";

  // --- LÓGICA DO CALENDÁRIO DA LIGHTBOX ---
  const mudarMesModal = (incremento: number) => {
    setMesModalView(prev => new Date(prev.getFullYear(), prev.getMonth() + incremento, 1));
  };

  const renderDiasCalendarioModal = (calendarioData: Record<string, string>) => {
    const ano = mesModalView.getFullYear();
    const mes = mesModalView.getMonth();
    
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const startDayIndex = primeiroDia === 0 ? 6 : primeiroDia - 1;

    const dias = [];
    
    for (let i = 0; i < startDayIndex; i++) {
      dias.push(<div key={`empty-${i}`} className="p-1"></div>);
    }

    for (let i = 1; i <= diasNoMes; i++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const estadoDia = calendarioData?.[dataStr];
      
      let coresClasses = "bg-white border-slate-100 text-slate-300"; 
      if (estadoDia === 'Livre') coresClasses = "bg-emerald-100 border-emerald-500 text-emerald-800 font-black shadow-inner";
      if (estadoDia === 'Ocupado') coresClasses = "bg-red-100 border-red-500 text-red-800 font-black opacity-80 line-through";

      dias.push(
        <div key={dataStr} className={`h-8 w-full rounded border text-[11px] flex items-center justify-center ${coresClasses}`}>
          {i}
        </div>
      );
    }
    return dias;
  };

  // --- GRELHA DE MONITORES COM EFEITO BLUR E LOCK ---
  const renderGrelhaMonitores = (lista: any[], emptyMessage: string) => {
    if (loading) return <div className="text-center py-20 text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">{isEn ? "Loading talent pool..." : "A carregar talentos..."}</div>;
    if (lista.length === 0) return <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm w-full"><span className="text-4xl block mb-2">🔍</span><h3 className="text-sm font-black text-slate-900 mb-1">{isEn ? "No monitors found" : "Nenhum monitor encontrado"}</h3><p className="text-xs text-slate-500 font-medium">{emptyMessage}</p></div>;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
        {lista.map(monitor => {
          const isGuardado = guardadosIds.includes(monitor.id);
          return (
            <div key={monitor.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-300 flex flex-col group relative">
              
              {/* PAYWALL / OVERLAY BLUR SE NÃO TIVER ACESSO */}
              {!temAcesso && (
                <div 
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[6px] cursor-pointer hover:bg-white/50 transition-colors"
                  onClick={() => setShowLockModal(true)}
                >
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center text-lg shadow-lg mb-2">🔒</div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 bg-white px-3 py-1 rounded-full shadow-sm">{isEn ? "Locked Profile" : "Perfil Oculto"}</span>
                </div>
              )}

              <button onClick={(e) => toggleGuardar(e, monitor.id)} className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${isGuardado ? 'bg-amber-100 text-amber-500 border-amber-200' : 'bg-white text-slate-300 border-slate-200 hover:text-amber-400'}`}>★</button>
              
              {/* O conteúdo do card fica ligeiramente transparente e "unselectable" se não houver acesso */}
              <div className={`flex flex-col flex-1 ${!temAcesso ? 'select-none opacity-50' : ''}`}>
                <div className="p-5 pb-3 border-b border-slate-100 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 border overflow-hidden flex-shrink-0 flex items-center justify-center">{monitor.fotografia_url ? <img src={monitor.fotografia_url} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">🧑‍🏫</span>}</div>
                  <div className="flex-1 overflow-hidden pr-6">
                    <h3 className="text-sm font-black text-slate-900 leading-tight truncate transition-colors">{!temAcesso ? "Monitor Registado" : monitor.nome_completo}</h3>
                    <div className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1 truncate"><span>📍 {monitor.distrito_residencia}</span><span>•</span><span>{!temAcesso ? "**" : calcularIdade(monitor.data_nascimento)} {isEn ? "yrs" : "anos"}</span></div>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-3"><span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">{isEn ? "Experience" : "Experiência"}</span><span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">{monitor.experiencia_anos === "0" ? (isEn ? "Beginner" : "Iniciante") : `${monitor.experiencia_anos} ${isEn ? "years" : "anos"}`}</span></div>
                  <div className="mb-5 flex-1"><span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">{isEn ? "Certificates" : "Certificações"}</span><div className="flex flex-wrap gap-1">{monitor.certificacoes?.slice(0,2).map((cert: string) => (<span key={cert} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase rounded border border-emerald-100 truncate max-w-full">{cert}</span>)) || <span className="text-[10px] text-slate-400 italic">Nenhuma</span>}</div></div>
                  <button onClick={() => { if(temAcesso) { setMonitorSelecionado(monitor); setMesModalView(new Date()); } else { setShowLockModal(true); } }} className="w-full py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-600 transition-colors shadow-sm">{isEn ? "View Profile" : "Ver Perfil"}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] font-sans">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight m-0 mb-1">{isEn ? "Staff Recruitment" : "Recrutamento de Equipa"}</h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">{isEn ? "Find, save, and contact monitors" : "Pesquisa, Shortlist e Contacto Direto"}</p>
        <div className="flex gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab("descobrir")} className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors border-b-2 ${activeTab === "descobrir" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-400"}`}>{isEn ? "Discover" : "Descobrir"}</button>
          <button onClick={() => setActiveTab("guardados")} className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors border-b-2 ${activeTab === "guardados" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-400"}`}>{isEn ? "Shortlist" : "Guardados"} {guardadosIds.length > 0 && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold">{guardadosIds.length}</span>}</button>
          <button onClick={() => setActiveTab("mensagens")} className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors border-b-2 ${activeTab === "mensagens" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-400"}`}>{isEn ? "Messages" : "Mensagens"} {conversas.filter(c => !c.lida).length > 0 && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">{conversas.filter(c => !c.lida).length}</span>}</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 relative">
        {/* TABS DE CONTEÚDO */}
        {activeTab === "descobrir" && (
          <div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4 flex gap-3"><div className="flex-1"><select className={selectClass} value={filtroDistrito} onChange={e => setFiltroDistrito(e.target.value)}><option value="">📍 {isEn ? "All Districts" : "Todos os Distritos"}</option>{distritosPT.map(d => <option key={d} value={d}>{d}</option>)}</select></div><div className="flex-1"><select className={selectClass} value={filtroExperiencia} onChange={e => setFiltroExperiencia(e.target.value)}><option value="">⭐ {isEn ? "Any Experience" : "Qualquer Experiência"}</option><option value="0">{isEn ? "First Time" : "Nenhuma / Primeira vez"}</option><option value="1-2">1-2 {isEn ? "years" : "anos"}</option><option value="3-5">3-5 {isEn ? "years" : "anos"}</option><option value="+5">+5 {isEn ? "years" : "anos"}</option></select></div></div>
            {renderGrelhaMonitores(monitoresFiltrados, isEn ? "Try adjusting your filters to see more results." : "Tente ajustar os filtros para encontrar a equipa ideal.")}
          </div>
        )}

        {activeTab === "guardados" && <div>{renderGrelhaMonitores(monitoresGuardados, isEn ? "No saved profiles." : "Ainda não guardou nenhum monitor nesta lista.")}</div>}

        {activeTab === "mensagens" && (
          <div className="h-full min-h-[400px] flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
            
            {/* BLOQUEIO ESPECÍFICO NA INBOX SE NÃO TIVER ACESSO */}
            {!temAcesso && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm p-6 text-center">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center text-2xl shadow-lg mb-4">🔒</div>
                <h2 className="text-xl font-black text-slate-900 mb-2">{isEn ? "Inbox Locked" : "Mensagens Bloqueadas"}</h2>
                <p className="text-sm font-medium text-slate-500 max-w-sm mb-6">{isEn ? "You need an active contract to send and receive messages from monitors." : "Apenas parceiros com contrato validado e ativo podem enviar propostas e conversar diretamente com os monitores da bolsa."}</p>
                <Link href={`/${lang}/admin/contrato`} className="bg-emerald-600 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl shadow-md hover:bg-emerald-700 transition-colors no-underline">
                  {isEn ? "Sign Global Contract" : "Assinar Contrato Global"}
                </Link>
              </div>
            )}

            <div className={`w-full md:w-1/3 border-r border-slate-100 bg-slate-50 overflow-y-auto ${conversaAtiva ? 'hidden md:block' : 'block'} ${!temAcesso ? 'opacity-30 pointer-events-none' : ''}`}>
              {conversas.map(conv => (
                <button key={conv.monitor_id} onClick={() => selecionarConversa(conv)} className={`w-full text-left p-4 border-b border-slate-100 flex flex-col bg-slate-50 hover:bg-white transition-colors ${conversaAtiva?.monitor_id === conv.monitor_id ? 'bg-white border-l-4 border-l-emerald-500' : ''}`}>
                  <div className="flex justify-between items-center w-full"><span className="text-xs font-black text-slate-900 truncate">{conv.monitor_nome}</span><span className="text-[9px] font-bold text-slate-400 flex-shrink-0 ml-2">{conv.data}</span></div>
                  <p className={`text-xs mt-1 mb-0 truncate w-full ${conv.lida ? 'text-slate-500' : 'text-slate-950 font-black'}`}>{conv.ultima_mensagem}</p>
                </button>
              ))}
            </div>
            <div className={`w-full md:w-2/3 flex flex-col bg-white ${!conversaAtiva ? 'hidden md:flex' : 'flex'} ${!temAcesso ? 'opacity-30 pointer-events-none' : ''}`}>
              {!conversaAtiva ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8"><span className="text-3xl mb-2">💬</span><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isEn ? "Select a candidate to chat" : "Selecione um candidato para falar"}</p></div>
              ) : (
                <>
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between"><button onClick={() => setConversaAtiva(null)} className="md:hidden text-slate-400 font-bold pr-2">&larr;</button><div className="text-xs font-black text-slate-900">{conversaAtiva.monitor_nome}</div></div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                    {conversaAtiva.mensagens.map((msg: any) => (
                      <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.remetente === 'parceiro' ? 'ml-auto items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-xl text-sm font-medium ${msg.remetente === 'parceiro' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>{msg.mensagem}</div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleEnviarMensagem} className="p-3 border-t border-slate-100 flex gap-2"><input type="text" value={novaMensagem} onChange={e => setNovaMensagem(e.target.value)} placeholder={isEn ? "Type a message..." : "Escreva uma mensagem..."} className="flex-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white" /><button type="submit" disabled={sendingMsg} className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">{isEn ? "Send" : "Enviar"}</button></form>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE BLOQUEIO DE CONTRATO (FREEMIUM / PAYWALL) */}
      {showLockModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl flex flex-col overflow-hidden shadow-2xl p-8 text-center relative">
            <button onClick={() => setShowLockModal(false)} className="absolute top-4 right-5 text-slate-400 hover:text-slate-900 font-bold text-2xl transition-colors leading-none bg-transparent border-none cursor-pointer">&times;</button>
            
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
              📄
            </div>
            
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              {isEn ? "Contract Validation Required" : "Acesso Restrito"}
            </h2>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              {isEn 
                ? "To access the full talent pool, view photos, and contact monitors, your partnership contract with HelloCamp must be signed and validated."
                : "Para aceder aos perfis completos, ver fotografias e contactar a bolsa de monitores, o seu contrato de parceria com a HelloCamp necessita de estar assinado e validado."}
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left flex items-center justify-between">
               <div>
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{isEn ? "Contract Status" : "Estado do seu Contrato"}</span>
                  <span className={`text-sm font-black uppercase tracking-widest ${statusContrato.toLowerCase() === 'pendente' ? 'text-amber-500' : 'text-slate-700'}`}>
                    {statusContrato}
                  </span>
               </div>
               <div className={`w-3 h-3 rounded-full ${statusContrato.toLowerCase() === 'pendente' ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'}`}></div>
            </div>

            <Link href={`/${lang}/admin/contrato`} className="block w-full bg-slate-900 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md no-underline">
              {isEn ? "Sign Contract Now" : "Assinar Contrato Agora"}
            </Link>
          </div>
        </div>
      )}

      {/* MODAL / LIGHTBOX DE PERFIL COMPLETO (SÓ APARECE SE TIVER ACESSO) */}
      {monitorSelecionado && temAcesso && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
               <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{isEn ? "Candidate Dossier" : "Dossier do Candidato"}</div>
               <button onClick={() => setMonitorSelecionado(null)} className="text-slate-400 hover:text-slate-900 font-bold text-2xl transition-colors leading-none bg-transparent border-none cursor-pointer">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Coluna Esquerda */}
                  <div className="lg:col-span-1 flex flex-col gap-6">
                     <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
                        <div className="w-32 h-32 mx-auto rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden mb-4">
                           {monitorSelecionado.fotografia_url ? <img src={monitorSelecionado.fotografia_url} alt="Foto" className="w-full h-full object-cover" /> : <span className="text-4xl mt-8 block">🧑‍🏫</span>}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-1">{monitorSelecionado.nome_completo}</h2>
                        <p className="text-sm font-bold text-slate-500 mb-0">{calcularIdade(monitorSelecionado.data_nascimento)} {isEn ? "years old" : "anos"}</p>
                        
                        <div className="mt-5 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                           <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{isEn ? "Residency" : "Residência Base"}</span>
                           <span className="text-sm font-bold text-slate-800">📍 {monitorSelecionado.distrito_residencia}</span>
                        </div>
                     </div>

                     <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-3">
                        <span className="block text-[10px] text-center font-black uppercase tracking-widest text-slate-400 mb-2">{isEn ? "Direct Contact" : "Contacto Direto"}</span>
                        <button onClick={() => iniciarConversaComMonitor(monitorSelecionado)} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer">
                          💬 {isEn ? "Start Chat" : "Iniciar Chat"}
                        </button>
                        <a href={`tel:${monitorSelecionado.telefone}`} className="w-full bg-white border border-slate-200 text-slate-800 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-center hover:bg-slate-50 transition-all no-underline flex items-center justify-center gap-2">
                          📞 {isEn ? "Call Monitor" : "Ligar (Telefone)"}
                        </a>
                     </div>
                  </div>

                  {/* Coluna Direita */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                     
                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">{isEn ? "Presentation / Bio" : "Carta de Apresentação"}</h4>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium m-0 whitespace-pre-wrap">{monitorSelecionado.bio || "Sem carta de apresentação."}</p>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">{isEn ? "Experience" : "Experiência"}</h4>
                           <span className="text-xl font-black text-slate-900">{monitorSelecionado.experiencia_anos === "0" ? (isEn ? "Beginner" : "Iniciante") : `${monitorSelecionado.experiencia_anos} ${isEn ? "years" : "anos"}`}</span>
                        </div>
                        
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">{isEn ? "Willing to Work in" : "Disponível para Zonas"}</h4>
                           <div className="flex flex-wrap gap-1.5">
                              {monitorSelecionado.areas_atuacao?.length > 0 ? monitorSelecionado.areas_atuacao.map((z:string) => <span key={z} className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-bold">{z}</span>) : <span className="text-xs text-slate-400">Não definidas</span>}
                           </div>
                        </div>
                     </div>

                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">{isEn ? "Core Certificates" : "Certificados Base"}</h4>
                        <div className="flex flex-wrap gap-2 mb-5">
                           {monitorSelecionado.certificacoes?.length > 0 ? monitorSelecionado.certificacoes.map((c:string) => <span key={c} className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"><span className="text-emerald-500">✓</span>{c}</span>) : <span className="text-xs text-slate-400">Nenhum</span>}
                        </div>

                        {monitorSelecionado.outras_competencias && (
                           <>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 border-t border-slate-100 pt-4">{isEn ? "Other Skills" : "Outras Competências"}</h4>
                              <p className="text-sm font-bold text-slate-800 m-0">{monitorSelecionado.outras_competencias}</p>
                           </>
                        )}
                     </div>

                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">{isEn ? "Seasonal Availability" : "Disponibilidade Sazonal"}</h4>
                        <div className="flex flex-wrap gap-2 mb-5">
                           {monitorSelecionado.disponibilidade?.length > 0 ? monitorSelecionado.disponibilidade.map((d:string) => <span key={d} className="bg-blue-50 text-blue-800 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold">📅 {d}</span>) : <span className="text-xs text-slate-400">Não especificada</span>}
                        </div>
                        
                        {monitorSelecionado.calendario_disponibilidade && Object.keys(monitorSelecionado.calendario_disponibilidade).length > 0 && (
                           <div className="border-t border-slate-100 pt-5">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">{isEn ? "Specific Calendar" : "Calendário Específico"}</h4>
                              
                              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm select-none max-w-sm">
                                 <div className="flex justify-between items-center mb-3">
                                   <button type="button" onClick={() => mudarMesModal(-1)} className="p-1 hover:bg-slate-100 rounded text-slate-500 font-bold">&larr;</button>
                                   <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
                                     {mesesNomes[mesModalView.getMonth()]} {mesModalView.getFullYear()}
                                   </span>
                                   <button type="button" onClick={() => mudarMesModal(1)} className="p-1 hover:bg-slate-100 rounded text-slate-500 font-bold">&rarr;</button>
                                 </div>
                                 
                                 <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                                   {diasDaSemana.map(d => <span key={d} className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{d}</span>)}
                                 </div>
                                 
                                 <div className="grid grid-cols-7 gap-1">
                                   {renderDiasCalendarioModal(monitorSelecionado.calendario_disponibilidade)}
                                 </div>
                                 
                                 <div className="mt-3 flex gap-3 justify-center text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-100 border border-emerald-500 inline-block"></span> Livre</span>
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-500 inline-block"></span> Ocupado</span>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>

                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
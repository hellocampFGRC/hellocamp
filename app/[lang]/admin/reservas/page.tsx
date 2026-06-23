"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

// Estilo unificado para os Dropdowns em todo o site
const customSelectStyle = {
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 1rem center',
  backgroundSize: '1.2em'
};

export default function GestaoReservasParceiro({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<any>(null);
  
  // Dados Core
  const [camposParceiro, setCamposParceiro] = useState<any[]>([]);
  const [todasReservas, setTodasReservas] = useState<any[]>([]);
  
  // Filtros
  const [filtroCampoId, setFiltroCampoId] = useState<string>('todos');
  const [filtroTurno, setFiltroTurno] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState("");
  
  // UI States (Modais)
  const [reservaSelecionada, setReservaSelecionada] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'selecao' | 'manual' | 'excel'>('selecao');
  
  const [savingExterno, setSavingExterno] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Form de Reserva Externa (1 a 1)
  const [formExterno, setFormExterno] = useState({
    campo_id: "", turno_nome: "", valor_pago: 0,
    nome_crianca: "", idade: "", alergias: "", doencas: "",
    nome_pai: "", email_pai: "", telefone_pai: ""
  });

  // Estados Inteligentes para o Mini-Calendário no Modal
  const [modalidadeExterna, setModalidadeExterna] = useState<'pacote' | 'dia_solto'>('pacote');
  const [diaExterno, setDiaExterno] = useState<string>('');

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setSessionUser(session.user);

    // 1. Busca Campos
    const { data: camposData } = await supabase.from('campos').select('id, nome, nome_en, vagas_totais, turnos').eq('organizador_id', session.user.id);
    setCamposParceiro(camposData || []);

    // 2. Busca Reservas e cruza com Crianças/Pais
    const { data: reservasData } = await supabase.from('reservas').select('*, criancas(*), perfis(*)').eq('organizador_id', session.user.id).order('created_at', { ascending: false });
    
    if (reservasData) {
      const reservasFormatadas = reservasData.map(res => {
        const isExterna = res.cliente_id === session.user.id || res.status_pagamento === 'Externo';
        let statusFinal = res.status_pagamento || 'Pendente';
        if (isExterna) statusFinal = 'Externo';
        if (statusFinal === 'Reembolsado') statusFinal = 'Cancelada';

        const campoRelacionado = camposData?.find(c => c.id === res.campo_id);

        return {
          id: res.id,
          campo_id: res.campo_id,
          campo_nome: campoRelacionado ? (isEn && campoRelacionado.nome_en ? campoRelacionado.nome_en : campoRelacionado.nome) : 'Desconhecido',
          turno: res.turno_nome,
          valor: Number(res.valor_total) || 0,
          data: res.created_at,
          status: statusFinal,
          isExterna: isExterna,
          crianca: res.criancas || { nome: res.respostas_customizadas?.nome_crianca_externo || 'N/D' },
          pai: {
            nome: res.nome_encarregado || res.perfis?.nome_completo || 'N/D',
            email: res.email_encarregado || res.perfis?.email || 'N/D',
            telefone: res.telefone_encarregado || res.perfis?.telefone || 'N/D',
            emergencia: res.perfis?.contacto_emergencia || res.telefone_encarregado || 'N/D'
          },
          respostasCustomizadas: res.respostas_customizadas || {}
        };
      });
      setTodasReservas(reservasFormatadas);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDashboardData(); }, [isEn]);

  // ==========================================
  // FILTRAGEM INTELIGENTE
  // ==========================================
  let reservasFiltradas = [...todasReservas];
  
  if (filtroCampoId !== 'todos') reservasFiltradas = reservasFiltradas.filter(r => r.campo_id === filtroCampoId);
  if (filtroTurno !== 'todos') reservasFiltradas = reservasFiltradas.filter(r => r.turno === filtroTurno);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    reservasFiltradas = reservasFiltradas.filter(r => 
      (r.crianca?.nome || '').toLowerCase().includes(q) || 
      (r.pai?.nome || '').toLowerCase().includes(q)
    );
  }

  const turnosDoCampoFiltro = filtroCampoId === 'todos' ? [] : camposParceiro.find(c => c.id === filtroCampoId)?.turnos || [];

  // ==========================================
  // MÉTRICAS DO DASHBOARD
  // ==========================================
  const validas = reservasFiltradas.filter(r => r.status !== 'Cancelada' && r.status !== 'Abandonada');
  const countHelloCamp = validas.filter(r => !r.isExterna).length;
  const countExternas = validas.filter(r => r.isExterna).length;
  const faturaçãoHelloCamp = validas.filter(r => !r.isExterna).reduce((acc, curr) => acc + curr.valor, 0);
  const faturaçãoExterna = validas.filter(r => r.isExterna).reduce((acc, curr) => acc + curr.valor, 0);

  // ==========================================
  // LÓGICA DO MINI-CALENDÁRIO (MODAL)
  // ==========================================
  const campoSelecionadoModal = camposParceiro.find(c => c.id === formExterno.campo_id);
  const turnosModal = campoSelecionadoModal?.turnos || [];
  const pacotesModal = turnosModal.filter((t: any) => !t.nome.includes("- Dia ") && !t.nome.includes("- Day "));
  const diasSoltosModal = turnosModal.filter((t: any) => t.nome.includes("- Dia ") || t.nome.includes("- Day "));
  const datasUnicasModal = Array.from(new Set(diasSoltosModal.map((t: any) => t.data_inicio))).sort() as string[];

  useEffect(() => {
    if (pacotesModal.length === 0 && diasSoltosModal.length > 0) setModalidadeExterna("dia_solto");
    if (pacotesModal.length > 0 && diasSoltosModal.length === 0) setModalidadeExterna("pacote");
    if (datasUnicasModal.length > 0 && !diaExterno) setDiaExterno(datasUnicasModal[0]);
  }, [formExterno.campo_id]);

  const setTurnoEscolhido = (turno: any) => {
    setFormExterno(prev => ({ ...prev, turno_nome: turno.nome, valor_pago: Number(turno.preco) }));
  };

  const getHorarioInfo = (nome: string) => {
    if (nome.includes("Completo") || nome.includes("Full")) return { tag: isEn ? "Full Day" : "Dia Completo", icon: "🌅" };
    if (nome.includes("Manhã") || nome.includes("Morning")) return { tag: isEn ? "Morning" : "Só Manhã", icon: "🥞" };
    if (nome.includes("Tarde") || nome.includes("Afternoon")) return { tag: isEn ? "Afternoon" : "Só Tarde", icon: "🥪" };
    return { tag: "Geral", icon: "🎟️" };
  };

  const formatarDataExibicao = (dStr: string) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { weekday: 'short', day: '2-digit', month: 'short' });
  };
  const limparNomeParaExibicao = (nomeCru: string) => nomeCru.split('(')[0].split('- Dia')[0].split('- Day')[0].trim();

  // ==========================================
  // INSERIR RESERVA EXTERNA (MANUAL 1 A 1)
  // ==========================================
  const handleAddExterno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formExterno.turno_nome) return alert("Por favor, selecione um turno ou dia no calendário.");
    
    setSavingExterno(true);

    try {
      const anoNasc = new Date().getFullYear() - (Number(formExterno.idade) || 10);
      const dataNascAprox = `${anoNasc}-01-01`;

      const { data: crianca, error: errC } = await supabase.from('criancas').insert({
        cliente_id: sessionUser.id, nome: formExterno.nome_crianca, data_nascimento: dataNascAprox,
        restricoes_alimentares: formExterno.alergias || 'Nenhuma', doencas_cronicas: formExterno.doencas || 'Nenhuma'
      }).select('id').single();

      if (errC) throw errC;

      const { error: errR } = await supabase.from('reservas').insert({
        organizador_id: sessionUser.id, cliente_id: sessionUser.id, crianca_id: crianca.id,
        campo_id: formExterno.campo_id, turno_nome: formExterno.turno_nome, valor_total: formExterno.valor_pago,
        status_pagamento: 'Externo', nome_encarregado: formExterno.nome_pai, email_encarregado: formExterno.email_pai,
        telefone_encarregado: formExterno.telefone_pai, respostas_customizadas: { origem: "Inserção Manual 1 a 1" }
      });

      if (errR) throw errR;

      setIsAddModalOpen(false);
      setImportMode('selecao');
      setFormExterno({ campo_id: "", turno_nome: "", valor_pago: 0, nome_crianca: "", idade: "", alergias: "", doencas: "", nome_pai: "", email_pai: "", telefone_pai: "" });
      fetchDashboardData();
      alert("Inscrição externa adicionada com sucesso!");

    } catch (err: any) { alert("Erro ao inserir: " + err.message); }
    setSavingExterno(false);
  };

  // ==========================================
  // IMPORTAR / EXPORTAR EXCEL
  // ==========================================
  const downloadTemplateCSV = () => {
    const csv = "\ufeffNome_do_Campo_Exato;Nome_do_Turno_Exato;Valor_Pago;Nome_Crianca;Idade;Alergias;Doencas;Nome_Responsavel;Telefone;Email\n" +
                "Surf Camp Caparica;1a Semana Julho;150;Joao Silva;12;Nenhuma;Asma;Maria Silva;912345678;maria@email.com\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Template_Importacao_HelloCamp.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleImportCSV = async () => {
    if (!csvFile) return alert("Selecione um ficheiro CSV primeiro.");
    setSavingExterno(true);

    try {
      const text = await csvFile.text();
      const linhas = text.split('\n').filter(line => line.trim().length > 0);
      
      if (linhas.length < 2) throw new Error("Ficheiro vazio ou sem dados válidos.");

      let sucessoCount = 0;
      for (let i = 1; i < linhas.length; i++) {
        const colunas = linhas[i].split(';');
        if (colunas.length < 9) continue;

        const [nomeCampoCSV, nomeTurno, valorPago, nomeCrianca, idade, alergias, doencas, nomePai, telefone, email] = colunas.map(c => c.trim().replace(/"/g, ''));

        const campoAlvo = camposParceiro.find(c => c.nome.toLowerCase() === nomeCampoCSV.toLowerCase());
        if (!campoAlvo) continue;

        const anoNasc = new Date().getFullYear() - (Number(idade) || 10);
        const dataNascAprox = `${anoNasc}-01-01`;

        const { data: crianca } = await supabase.from('criancas').insert({
          cliente_id: sessionUser.id, nome: nomeCrianca, data_nascimento: dataNascAprox,
          restricoes_alimentares: alergias || 'Nenhuma', doencas_cronicas: doencas || 'Nenhuma'
        }).select('id').single();

        if (crianca) {
          await supabase.from('reservas').insert({
            organizador_id: sessionUser.id, cliente_id: sessionUser.id, crianca_id: crianca.id,
            campo_id: campoAlvo.id, turno_nome: nomeTurno, valor_total: Number(valorPago) || 0,
            status_pagamento: 'Externo', nome_encarregado: nomePai, email_encarregado: email || "",
            telefone_encarregado: telefone, respostas_customizadas: { origem: "Importação via Excel/CSV" }
          });
          sucessoCount++;
        }
      }

      setIsAddModalOpen(false);
      setImportMode('selecao');
      setCsvFile(null);
      fetchDashboardData();
      alert(`Importação concluída! ${sucessoCount} inscrições inseridas com sucesso.`);

    } catch (err: any) { alert("Erro ao processar ficheiro: " + err.message); }
    setSavingExterno(false);
  };

  const exportarCSV = () => {
    if (validas.length === 0) { alert("Não existem inscrições ativas para exportar."); return; }

    let csv = "\ufeffOrigem;Data Reserva;Programa;Turno;Valor Pago;Nome Participante;Alergias;Doenças;Encarregado de Educação;Telefone;Email\n";
    validas.forEach(item => {
      const origem = item.isExterna ? "Externa" : "HelloCamp";
      const dataReserva = new Date(item.data).toLocaleDateString('pt-PT');
      const alergias = (item.crianca?.restricoes_alimentares || "Nenhuma").replace(/;/g, ",").replace(/\n/g, " ");
      const doencas = (item.crianca?.doencas_cronicas || "Nenhuma").replace(/;/g, ",").replace(/\n/g, " ");
      
      csv += `"${origem}";"${dataReserva}";"${item.campo_nome}";"${item.turno}";"${item.valor}€";"${item.crianca?.nome || ""}";"${alergias}";"${doencas}";"${item.pai?.nome || ""}";"${item.pai?.telefone || ""}";"${item.pai?.email || ""}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Exportacao_Global_HelloCamp.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-500 animate-pulse">A carregar o seu Dashboard...</div>;

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 font-sans pb-24">
      
      {/* HEADER & ACÕES GLOBAIS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 m-0 tracking-tight">{isEn ? 'Booking Operations' : 'Central de Reservas'}</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">{isEn ? 'Manage Hellocamp and manual bookings in one place.' : 'Gira inscrições da HelloCamp e centralize os seus clientes externos.'}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={exportarCSV} className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors text-sm">
            📥 Exportar Lista (Excel)
          </button>
          <button onClick={() => { setImportMode('selecao'); setIsAddModalOpen(true); }} className="flex-1 md:flex-none px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-orange-600 transition-colors text-sm">
            + Adicionar Inscrições
          </button>
        </div>
      </div>

      {/* MÉTRICAS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Lotação Preenchida</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900">{validas.length}</span>
            <span className="text-sm font-bold text-slate-500">participantes</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center border-b-4 border-b-emerald-500 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center opacity-50 text-3xl">🟢</div>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 relative z-10">Origem: HelloCamp</span>
          <div className="flex items-baseline justify-between relative z-10">
            <span className="text-4xl font-black text-slate-900">{countHelloCamp}</span>
            <span className="text-sm font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">+{faturaçãoHelloCamp}€</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center border-b-4 border-b-orange-500 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center opacity-50 text-3xl">🟠</div>
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 relative z-10">Origem: Externos</span>
          <div className="flex items-baseline justify-between relative z-10">
            <span className="text-4xl font-black text-slate-900">{countExternas}</span>
            <span className="text-sm font-black text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-md">+{faturaçãoExterna}€</span>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS COM DROPDOWNS CUSTOMIZADOS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Procurar Nome</label>
          <input type="text" placeholder="Pesquisar miúdo ou encarregado..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-slate-400" />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Filtrar Campo</label>
          <select value={filtroCampoId} onChange={e => { setFiltroCampoId(e.target.value); setFiltroTurno('todos'); }} style={customSelectStyle} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 font-bold text-slate-700 cursor-pointer">
            <option value="todos">Todos os Campos</option>
            {camposParceiro.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        {filtroCampoId !== 'todos' && (
          <div className="flex-1 animate-in fade-in">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Filtrar Data/Turno</label>
            <select value={filtroTurno} onChange={e => setFiltroTurno(e.target.value)} style={customSelectStyle} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 font-bold text-slate-700 cursor-pointer">
              <option value="todos">Todas as Datas</option>
              {turnosDoCampoFiltro.map((t: any, i: number) => <option key={i} value={t.nome}>{t.nome}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* TABELA UNIFICADA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Participante</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Programa e Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado Clínico</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Origem / Pagamento</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservasFiltradas.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold text-sm">Nenhum resultado encontrado.</td></tr>
              ) : (
                reservasFiltradas.map((item, idx) => {
                  const isInativa = item.status === 'Abandonada' || item.status === 'Cancelada';
                  const isExterna = item.isExterna;
                  
                  const alertaAlergia = item.crianca?.restricoes_alimentares && item.crianca.restricoes_alimentares.length > 8 && !item.crianca.restricoes_alimentares.toLowerCase().includes('nenhum');
                  const alertaDoenca = item.crianca?.doencas_cronicas && item.crianca.doencas_cronicas.length > 8 && !item.crianca.doencas_cronicas.toLowerCase().includes('nenhum');
                  const temRisco = !isInativa && (alertaAlergia || alertaDoenca);

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isInativa ? 'opacity-50 grayscale' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${isExterna ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {item.crianca?.nome ? item.crianca.nome.charAt(0) : '?'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 m-0 text-sm">{item.crianca?.nome || 'N/D'}</p>
                            <p className="text-[11px] text-slate-500 font-medium m-0 truncate max-w-[150px]">{item.pai?.nome}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 m-0 text-xs">{item.campo_nome}</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">{item.turno}</p>
                      </td>
                      <td className="px-6 py-4">
                        {temRisco ? (
                           <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">
                             ⚠️ Alerta Ativo
                           </span>
                        ) : (
                           <span className="text-slate-300 text-xs font-bold">- Ok -</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isExterna ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm">
                              🟠 Externo / Manual
                            </span>
                            <span className="text-xs font-black text-slate-900">{item.valor}€</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border shadow-sm ${item.status === 'Pago' || item.status === 'Sinal Pago' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                              🟢 HelloCamp • {item.status}
                            </span>
                            <span className="text-xs font-black text-slate-900">{item.valor}€</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setReservaSelecionada(item)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-900 hover:text-white transition-colors shadow-sm">
                          Abrir Ficha
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL MESTRE: ADICIONAR INSCRIÇÕES (SELEÇÃO DE MODO) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-900 m-0">Adicionar Inscrições Externas</h2>
                <p className="text-xs font-bold text-slate-500 mt-1 mb-0">Centralize os clientes que reservaram por fora da plataforma.</p>
              </div>
              <button onClick={() => { setIsAddModalOpen(false); setImportMode('selecao'); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 font-bold">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {importMode === 'selecao' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => setImportMode('manual')} className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-slate-200 rounded-2xl hover:border-orange-500 hover:bg-orange-50 transition-all group">
                    <span className="text-4xl">✍️</span>
                    <span className="font-black text-slate-800 group-hover:text-orange-700">Adicionar Manualmente</span>
                    <span className="text-xs font-medium text-slate-500 text-center">Preencher um formulário rápido (ideal para 1 a 1).</span>
                  </button>
                  <button onClick={() => setImportMode('excel')} className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
                    <span className="text-4xl">📊</span>
                    <span className="font-black text-slate-800 group-hover:text-emerald-700">Importar Excel/CSV</span>
                    <span className="text-xs font-medium text-slate-500 text-center">Fazer upload de um ficheiro (ideal para muitas reservas).</span>
                  </button>
                </div>
              )}

              {/* MODO: MANUAL 1 a 1 */}
              {importMode === 'manual' && (
                <form id="form-manual" onSubmit={handleAddExterno} className="flex flex-col gap-6">
                  {/* Onde vai o miúdo? (COM MINI-CALENDÁRIO) */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">1. Destino e Horário</h3>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">Para qual Campo?</label>
                        <select required value={formExterno.campo_id} onChange={e => { setFormExterno({...formExterno, campo_id: e.target.value, turno_nome: ""}); setDiaExterno(""); }} style={customSelectStyle} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-orange-500 cursor-pointer">
                          <option value="">Selecione o Campo...</option>
                          {camposParceiro.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>

                      {formExterno.campo_id && (
                        <div className="bg-white p-4 border border-slate-200 rounded-xl animate-in fade-in">
                          {/* Tabs Inteligentes */}
                          {(pacotesModal.length > 0 && diasSoltosModal.length > 0) && (
                            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                              <button type="button" onClick={() => setModalidadeExterna('pacote')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${modalidadeExterna === 'pacote' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Programa Inteiro</button>
                              <button type="button" onClick={() => setModalidadeExterna('dia_solto')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${modalidadeExterna === 'dia_solto' ? 'bg-white text-orange-700 shadow-sm border border-orange-100' : 'text-slate-500'}`}>Dias Soltos</button>
                            </div>
                          )}

                          {/* Se for Pacote Completo */}
                          {modalidadeExterna === 'pacote' && pacotesModal.length > 0 && (
                            <div className="flex flex-col gap-2">
                              {pacotesModal.map((pac: any) => {
                                const isActive = formExterno.turno_nome === pac.nome;
                                const tagInfo = getHorarioInfo(pac.nome);
                                return (
                                  <div key={pac.id} onClick={() => setTurnoEscolhido(pac)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${isActive ? 'bg-orange-50 border-orange-500' : 'border-slate-100 hover:border-orange-200'}`}>
                                    <div>
                                      <p className={`text-sm font-black m-0 ${isActive ? 'text-orange-900' : 'text-slate-800'}`}>{limparNomeParaExibicao(pac.nome)}</p>
                                      <p className="text-[10px] text-slate-500 m-0 mt-0.5">{tagInfo.icon} {tagInfo.tag}</p>
                                    </div>
                                    <span className={`text-sm font-black ${isActive ? 'text-orange-700' : 'text-slate-400'}`}>{pac.preco}€</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Se for Dias Soltos (Mini-Calendário) */}
                          {modalidadeExterna === 'dia_solto' && diasSoltosModal.length > 0 && (
                            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                              <label className="block text-[10px] font-black text-orange-800 uppercase tracking-widest mb-2">A. Escolher o Dia</label>
                              <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 mb-4">
                                {datasUnicasModal.map((data: string) => {
                                  const isActive = diaExterno === data;
                                  const dateObj = new Date(data);
                                  const diaSemana = dateObj.toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { weekday: 'short' }).replace('.', '');
                                  const diaNumero = dateObj.toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { day: '2-digit' });

                                  return (
                                    <div key={data} onClick={() => { setDiaExterno(data); setFormExterno(p => ({...p, turno_nome: "", valor_pago: 0})); }} className={`flex flex-col items-center justify-center py-1.5 rounded-lg cursor-pointer border ${isActive ? 'bg-orange-600 border-orange-600 text-white shadow-sm' : 'bg-white border-orange-200 text-slate-600 hover:border-orange-400'}`}>
                                      <span className="text-[8px] font-black uppercase">{diaSemana}</span>
                                      <span className="text-sm font-black">{diaNumero}</span>
                                    </div>
                                  )
                                })}
                              </div>

                              {diaExterno && (
                                <div className="border-t border-orange-200/50 pt-3">
                                  <label className="block text-[10px] font-black text-orange-800 uppercase tracking-widest mb-2">B. Escolher o Horário</label>
                                  <div className="flex flex-col gap-2">
                                    {diasSoltosModal.filter((t:any) => t.data_inicio === diaExterno).map((horario: any) => {
                                      const isActive = formExterno.turno_nome === horario.nome;
                                      const tagInfo = getHorarioInfo(horario.nome);
                                      return (
                                        <div key={horario.id} onClick={() => setTurnoEscolhido(horario)} className={`flex items-center justify-between p-2.5 rounded-lg border-2 cursor-pointer transition-all ${isActive ? 'bg-orange-700 border-orange-700 text-white' : 'bg-white border-orange-200 hover:border-orange-400'}`}>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm">{tagInfo.icon}</span>
                                            <span className={`text-xs font-black ${isActive ? 'text-white' : 'text-slate-800'}`}>{tagInfo.tag}</span>
                                          </div>
                                          <span className={`text-xs font-black ${isActive ? 'text-orange-200' : 'text-orange-700'}`}>{horario.preco}€</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      )}
                      
                      <div className="sm:col-span-2 mt-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">Confirmação: Valor Cobrado ao Cliente (€)</label>
                        <input type="number" required value={formExterno.valor_pago} onChange={e => setFormExterno({...formExterno, valor_pago: Number(e.target.value)})} className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* Dados do Miúdo */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">2. Dados do Participante</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">Nome Completo</label>
                        <input type="text" required value={formExterno.nome_crianca} onChange={e => setFormExterno({...formExterno, nome_crianca: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">Idade (Anos)</label>
                        <input type="number" required value={formExterno.idade} onChange={e => setFormExterno({...formExterno, idade: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-red-600 mb-1.5 uppercase">Alergias Alimentares</label>
                        <input type="text" value={formExterno.alergias} onChange={e => setFormExterno({...formExterno, alergias: e.target.value})} placeholder="Ex: Amendoins" className="w-full p-3 bg-red-50 border border-red-200 rounded-xl text-sm outline-none focus:border-red-400" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-red-600 mb-1.5 uppercase">Doenças / Medicação</label>
                        <input type="text" value={formExterno.doencas} onChange={e => setFormExterno({...formExterno, doencas: e.target.value})} placeholder="Ex: Asma" className="w-full p-3 bg-red-50 border border-red-200 rounded-xl text-sm outline-none focus:border-red-400" />
                      </div>
                    </div>
                  </div>

                  {/* Dados do Pai */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">3. Encarregado de Educação</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">Nome do Responsável</label>
                        <input type="text" required value={formExterno.nome_pai} onChange={e => setFormExterno({...formExterno, nome_pai: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">Telemóvel</label>
                        <input type="tel" required value={formExterno.telefone_pai} onChange={e => setFormExterno({...formExterno, telefone_pai: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">Email</label>
                        <input type="email" value={formExterno.email_pai} onChange={e => setFormExterno({...formExterno, email_pai: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* MODO: IMPORTAR EXCEL */}
              {importMode === 'excel' && (
                <div className="flex flex-col gap-6">
                  <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl">
                    <h3 className="text-sm font-black text-blue-900 mb-2">1. Descarregue o Template</h3>
                    <p className="text-xs text-blue-700 mb-4">Para o sistema conseguir ler os seus dados, tem de usar o nosso formato exato. O nome do Campo e Turno têm de ser escritos exatamente como estão na HelloCamp.</p>
                    <button onClick={downloadTemplateCSV} className="px-4 py-2 bg-white border border-blue-300 text-blue-800 font-bold rounded-lg shadow-sm hover:bg-blue-100 text-xs">
                      ⬇️ Download Mockup CSV
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                    <h3 className="text-sm font-black text-slate-800 mb-2">2. Faça Upload do Ficheiro</h3>
                    <p className="text-xs text-slate-500 mb-4">Aceitamos ficheiros .CSV guardados a partir do Excel.</p>
                    <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer" />
                  </div>
                </div>
              )}
            </div>

            {/* BOTÕES DO MODAL */}
            <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center">
              {importMode !== 'selecao' ? (
                <button onClick={() => setImportMode('selecao')} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800">&larr; Voltar</button>
              ) : <div></div>}
              
              <div className="flex gap-3">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setImportMode('selecao'); }} className="px-6 py-2.5 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-sm">Cancelar</button>
                
                {importMode === 'manual' && (
                  <button type="submit" form="form-manual" disabled={savingExterno || !formExterno.turno_nome} className="px-8 py-2.5 font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors shadow-md text-sm disabled:opacity-50">
                    {savingExterno ? 'A Guardar...' : '✓ Inserir Reserva'}
                  </button>
                )}

                {importMode === 'excel' && (
                  <button onClick={handleImportCSV} disabled={!csvFile || savingExterno} className="px-8 py-2.5 font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-md text-sm disabled:opacity-50">
                    {savingExterno ? 'A Importar...' : '✓ Processar Excel'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: VER FICHA CLÍNICA */}
      {reservaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className={`p-6 text-white flex justify-between items-center ${reservaSelecionada.status === 'Cancelada' || reservaSelecionada.status === 'Abandonada' ? 'bg-red-600' : 'bg-slate-900'}`}>
              <div>
                <h2 className="m-0 text-2xl font-black">Ficha de Participante</h2>
                <p className="m-0 text-slate-300 text-xs font-mono mt-1">REF: {reservaSelecionada.id}</p>
              </div>
              <button onClick={() => setReservaSelecionada(null)} className="text-white opacity-60 hover:opacity-100 text-3xl font-light">&times;</button>
            </div>

            <div className="p-8 overflow-y-auto bg-slate-50 flex flex-col gap-6">
              
              {/* Top Banner Origin */}
              {reservaSelecionada.isExterna ? (
                <div className="bg-orange-100 text-orange-800 p-3 rounded-xl border border-orange-200 text-xs font-black uppercase tracking-widest text-center shadow-sm">
                  🟠 Reserva Inserida Manualmente (Externa)
                </div>
              ) : (
                <div className="bg-emerald-100 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs font-black uppercase tracking-widest text-center shadow-sm">
                  🟢 Reserva Oficial HelloCamp • Pagamento: {reservaSelecionada.status}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">👦 Identificação</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="font-bold text-slate-500">Nome:</span> <span className="font-black text-slate-900">{reservaSelecionada.crianca?.nome}</span></div>
                    <div className="flex justify-between"><span className="font-bold text-slate-500">Nascimento:</span> <span className="font-black text-slate-900">{reservaSelecionada.crianca?.data_nascimento || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="font-bold text-slate-500">Género:</span> <span className="font-black text-slate-900">{reservaSelecionada.crianca?.sexo || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="font-bold text-slate-500">T-Shirt:</span> <span className="font-black text-slate-900">{reservaSelecionada.crianca?.tamanho_tshirt || 'N/A'}</span></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border-2 border-red-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full flex items-start justify-end p-2 text-xl">🏥</div>
                  <h3 className="text-sm font-black text-red-400 uppercase tracking-widest mb-4 pb-2 border-b border-red-50">Perfil Clínico e Alertas</h3>
                  
                  <div className="mb-4 bg-red-50 p-3 rounded-xl border border-red-100">
                    <span className="block text-[10px] font-black text-red-500 uppercase mb-1">Alergias Alimentares</span>
                    <span className="text-sm font-black text-red-900">{reservaSelecionada.crianca?.restricoes_alimentares || 'Não preenchido'}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase mb-0.5">Doenças Crónicas</span>
                      <p className="m-0 text-sm font-bold text-slate-700">{reservaSelecionada.crianca?.doencas_cronicas || 'Nenhuma declarada'}</p>
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase mb-0.5">Medicação Regular</span>
                      <p className="m-0 text-sm font-bold text-slate-700">{reservaSelecionada.crianca?.medicacao_regular || 'Nenhuma'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {reservaSelecionada.respostasCustomizadas && Object.keys(reservaSelecionada.respostasCustomizadas).length > 0 && (
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm">
                   <h3 className="text-sm font-black text-blue-800 uppercase tracking-widest mb-4 pb-2 border-b border-blue-200/50">📋 Respostas Específicas do Campo</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {Object.entries(reservaSelecionada.respostasCustomizadas).map(([pergunta, resposta]: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-blue-50">
                          <span className="block text-[10px] font-bold text-blue-500 mb-1">{pergunta}</span>
                          <span className="text-sm font-black text-slate-800">{resposta}</span>
                        </div>
                     ))}
                   </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">🛡️ Contactos e Recolha</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="font-bold text-slate-500">Responsável:</span> <span className="font-black text-slate-900">{reservaSelecionada.pai?.nome}</span></div>
                    <div className="flex justify-between"><span className="font-bold text-slate-500">Telefone:</span> <span className="font-black text-slate-900">{reservaSelecionada.pai?.telefone}</span></div>
                    <div className="flex justify-between"><span className="font-bold text-slate-500">Email:</span> <span className="font-black text-slate-900">{reservaSelecionada.pai?.email}</span></div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
                      <span className="block text-[10px] font-black text-amber-600 uppercase mb-1">Telefone de Emergência</span>
                      <span className="text-sm font-black text-amber-900">{reservaSelecionada.pai?.emergencia}</span>
                    </div>
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
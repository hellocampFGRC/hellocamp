"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import React from "react";

// Estilo unificado para os Dropdowns da plataforma
const customSelectStyle = {
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 1rem center',
  backgroundSize: '1.2em'
};

// ==========================================
// FUNÇÕES AUXILIARES GLOBAIS
// ==========================================
const limparNomeParaExibicao = (nomeCru: string) => {
  if (!nomeCru) return "";
  return nomeCru.split('(')[0].split('- Dia')[0].split('- Day')[0].trim();
};

const getHorarioInfo = (nome: string, isEn: boolean) => {
  if (nome.includes("Completo") || nome.includes("Full")) return { tag: isEn ? "Full Day" : "Dia Completo", icon: "🌅" };
  if (nome.includes("Manhã") || nome.includes("Morning")) return { tag: isEn ? "Morning" : "Só Manhã", icon: "🥞" };
  if (nome.includes("Tarde") || nome.includes("Afternoon")) return { tag: isEn ? "Afternoon" : "Só Tarde", icon: "🥪" };
  return { tag: "Geral", icon: "🎟️" };
};

export default function GestaoReservasParceiro({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const formatarDataExibicao = (dStr: string) => {
    if (!dStr) return '';
    return new Date(dStr).toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<any>(null);
  
  // Dados Core
  const [camposParceiro, setCamposParceiro] = useState<any[]>([]);
  const [todasReservas, setTodasReservas] = useState<any[]>([]);
  
  // Filtros Globais da Tabela
  const [filtroCampoId, setFiltroCampoId] = useState<string>('todos');
  const [filtroTurno, setFiltroTurno] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estados do Novo Popover de Filtro
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filtroModo, setFiltroModo] = useState<'pacote' | 'dia_solto'>('pacote');
  const [filtroDiaSelecionado, setFiltroDiaSelecionado] = useState<string>('');
  
  // NOVO: Navegação de Meses no Filtro
  const [filtroMesAtual, setFiltroMesAtual] = useState<Date>(new Date());

  // UI States (Modais)
  const [reservaSelecionada, setReservaSelecionada] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'selecao' | 'manual' | 'excel'>('selecao');
  
  const [savingExterno, setSavingExterno] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Estados de Gestão Financeira (Upsell/Ajuste)
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [savingAjuste, setSavingAjuste] = useState(false);
  const [ajusteForm, setAjusteForm] = useState({ valor: 0, motivo: "" });

  // Form de Reserva Externa (1 a 1)
  const [formExterno, setFormExterno] = useState({
    campo_id: "", turno_nome: "", valor_pago: 0,
    nome_crianca: "", idade: "", alergias: "", doencas: "",
    nome_pai: "", email_pai: "", telefone_pai: ""
  });

  // Estados do Mini-Calendário no Modal (Adicionar)
  const [modalidadeExterna, setModalidadeExterna] = useState<'pacote' | 'dia_solto'>('pacote');
  const [diaExterno, setDiaExterno] = useState<string>('');
  
  // NOVO: Navegação de Meses no Modal de Inserção
  const [modalMesAtual, setModalMesAtual] = useState<Date>(new Date());

  // ==========================================
  // FETCH DE DADOS (BASE DE DADOS) - VERSÃO SIMPLIFICADA SEM JOIN
  // ==========================================
  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setSessionUser(session.user);

    // 1. Busca Campos
    const { data: camposData } = await supabase
      .from('campos')
      .select('id, nome, nome_en, vagas_totais')
      .eq('organizador_id', session.user.id);
    
    setCamposParceiro(camposData || []);

    // 2. BUSCA DE RESERVAS SIMPLIFICADA (Sem JOINs para evitar falhas)
    // Buscamos apenas os dados da tabela reservas puramente
    const { data: reservasData, error: resError } = await supabase
      .from('reservas')
      .select('*') 
      .eq('organizador_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (resError) {
      console.error("Erro ao buscar reservas:", resError);
      setLoading(false);
      return;
    }

    console.log("Total de reservas encontradas:", reservasData?.length);

    if (reservasData) {
      // 3. Mapeamento manual para garantir que não perdemos dados
      const reservasFormatadas = reservasData.map((res: any) => {
        const campoRelacionado = camposData?.find((c: any) => c.id === res.campo_id);
        
        return {
          id: res.id,
          campo_id: res.campo_id,
          campo_nome: campoRelacionado ? (isEn && campoRelacionado.nome_en ? campoRelacionado.nome_en : campoRelacionado.nome) : 'Campo Indefinido',
          turno: res.turno_nome || 'Turno Base',
          valor: Number(res.valor_total) || 0,
          valor_pago: Number(res.valor_pago) || 0,
          status: res.status_pagamento || 'Pendente',
          isExterna: res.status_pagamento === 'Externo' || res.cliente_id === session.user.id,
          crianca: { nome: res.nome_encarregado || 'Participante' }, // Simplificado para garantir que não é nulo
          pai: {
            nome: res.nome_encarregado || 'N/D',
            email: res.email_encarregado || 'N/D',
            telefone: res.telefone_encarregado || 'N/D'
          },
          respostasCustomizadas: res.respostas_customizadas || {},
          pedido_pendente: res.respostas_customizadas?.pedido_pai_pendente || null
        };
      });
      setTodasReservas(reservasFormatadas);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDashboardData(); }, [isEn]);

  useEffect(() => {
    setFiltroTurno('todos');
    setFiltroDiaSelecionado('');
    setIsFilterPanelOpen(false);
  }, [filtroCampoId]);

  // ==========================================
  // FILTRAGEM INTELIGENTE DA TABELA
  // ==========================================
  let reservasFiltradas = [...todasReservas];
  
  if (filtroCampoId !== 'todos') reservasFiltradas = reservasFiltradas.filter((r: any) => r.campo_id === filtroCampoId);
  if (filtroTurno !== 'todos') {
    reservasFiltradas = reservasFiltradas.filter((r: any) => 
      r.turno && r.turno.toLowerCase().includes(filtroTurno.toLowerCase())
    );
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    reservasFiltradas = reservasFiltradas.filter((r: any) => 
      (r.crianca?.nome || '').toLowerCase().includes(q) || 
      (r.pai?.nome || '').toLowerCase().includes(q)
    );
  }

  // Prepara pacotes para o filtro
  const campoSelecionadoFiltro = camposParceiro.find((c: any) => c.id === filtroCampoId);
  const pacotesDoCampo = campoSelecionadoFiltro?.pacotes || [];
  const pacotesFiltro = pacotesDoCampo.filter((p: any) => p.tipo === 'semana');
  const diasSoltosFiltro = pacotesDoCampo.filter((p: any) => p.tipo === 'dia');

  const [datasCalendarioGlobal, setDatasCalendarioGlobal] = useState<string[]>([]);
  
  useEffect(() => {
    if (campoSelecionadoFiltro?.calendario_funcionamento?.data_inicio && campoSelecionadoFiltro?.calendario_funcionamento?.data_fim) {
      const inicio = new Date(campoSelecionadoFiltro.calendario_funcionamento.data_inicio);
      const fim = new Date(campoSelecionadoFiltro.calendario_funcionamento.data_fim);
      const diasPermitidos = campoSelecionadoFiltro.calendario_funcionamento.dias_semana || [1,2,3,4,5];
      const listaDias: string[] = [];

      let dataAtual = new Date(inicio);
      while (dataAtual <= fim) {
        if (diasPermitidos.includes(dataAtual.getDay())) {
          listaDias.push(dataAtual.toISOString().split('T')[0]);
        }
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
      setDatasCalendarioGlobal(listaDias);
      if (listaDias.length > 0) setFiltroMesAtual(new Date(listaDias[0]));
    } else {
      setDatasCalendarioGlobal([]);
    }
  }, [filtroCampoId, campoSelecionadoFiltro]);

  // Lógica de Paginação do Mês - Filtro
  const nextMonthFiltro = () => setFiltroMesAtual(new Date(filtroMesAtual.getFullYear(), filtroMesAtual.getMonth() + 1, 1));
  const prevMonthFiltro = () => setFiltroMesAtual(new Date(filtroMesAtual.getFullYear(), filtroMesAtual.getMonth() - 1, 1));
  const datasFiltroVisiveis = datasCalendarioGlobal.filter(d => {
    const date = new Date(d);
    return date.getMonth() === filtroMesAtual.getMonth() && date.getFullYear() === filtroMesAtual.getFullYear();
  });

  const validas = reservasFiltradas.filter((r: any) => r.status !== 'Cancelada' && r.status !== 'Abandonada');
  const countHelloCamp = validas.filter((r: any) => !r.isExterna).length;
  const countExternas = validas.filter((r: any) => r.isExterna).length;
  const faturaçãoHelloCamp = validas.filter((r: any) => !r.isExterna).reduce((acc: number, curr: any) => acc + curr.valor, 0);
  const faturaçãoExterna = validas.filter((r: any) => r.isExterna).reduce((acc: number, curr: any) => acc + curr.valor, 0);

  // ==========================================
  // LÓGICA DO MODAL ADICIONAR E FATURAÇÃO
  // ==========================================
  const fecharModalReserva = () => {
    setReservaSelecionada(null);
    setIsAjusteModalOpen(false);
    setAjusteForm({ valor: 0, motivo: "" });
  };

  const handleSubmeterAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ajusteForm.motivo || ajusteForm.valor <= 0) return alert("Preencha o motivo e um valor superior a 0.");
    
    setSavingAjuste(true);
    try {
      const novoAjuste = { data: new Date().toISOString(), motivo: ajusteForm.motivo, valor_pedido: ajusteForm.valor };
      const historicoAtualizado = [...(reservaSelecionada.historico_ajustes || []), novoAjuste];
      const novasRespostas = { ...reservaSelecionada.respostasCustomizadas, historico_ajustes: historicoAtualizado };
      delete novasRespostas.pedido_pai_pendente;

      const { error } = await supabase.from('reservas').update({
        status_pagamento: 'Aguardando Pagamento Extra',
        valor_pendente_extra: ajusteForm.valor,
        respostas_customizadas: novasRespostas
      }).eq('id', reservaSelecionada.id);

      if (error) throw error;

      alert(isEn ? "Payment request sent to the parent!" : "Pedido de pagamento enviado com sucesso!");
      fecharModalReserva();
      fetchDashboardData();
    } catch (err: any) { alert("Erro ao processar: " + err.message); }
    setSavingAjuste(false);
  };

  // ==========================================
  // INSERÇÃO MANUAL DE RESERVA (1 A 1)
  // ==========================================
  const campoSelecionadoModal = camposParceiro.find((c: any) => c.id === formExterno.campo_id);
  const pacotesModal = campoSelecionadoModal?.pacotes?.filter((p: any) => p.tipo === 'semana') || [];
  const diasSoltosModal = campoSelecionadoModal?.pacotes?.filter((p: any) => p.tipo === 'dia') || [];
  const datasUnicasModal = Array.from(new Set(diasSoltosModal.map((t: any) => t.data_inicio))).sort() as string[];

  useEffect(() => {
    if (pacotesModal.length === 0 && diasSoltosModal.length > 0) setModalidadeExterna("dia_solto");
    if (pacotesModal.length > 0 && diasSoltosModal.length === 0) setModalidadeExterna("pacote");
    if (datasUnicasModal.length > 0) {
      setDiaExterno(datasUnicasModal[0]);
      setModalMesAtual(new Date(datasUnicasModal[0]));
    }
  }, [formExterno.campo_id]);

  // Lógica de Paginação do Mês - Modal de Inserção
  const nextMonthModal = () => setModalMesAtual(new Date(modalMesAtual.getFullYear(), modalMesAtual.getMonth() + 1, 1));
  const prevMonthModal = () => setModalMesAtual(new Date(modalMesAtual.getFullYear(), modalMesAtual.getMonth() - 1, 1));
  const datasModalVisiveis = datasUnicasModal.filter(d => {
    const date = new Date(d);
    return date.getMonth() === modalMesAtual.getMonth() && date.getFullYear() === modalMesAtual.getFullYear();
  });

  const setTurnoEscolhido = (pacoteTitulo: string, variante: any) => {
    const nomeCompletoTurno = `${pacoteTitulo} (${variante.nome})`;
    setFormExterno(prev => ({ ...prev, turno_nome: nomeCompletoTurno, valor_pago: Number(variante.preco) }));
  };

  const handleAddExterno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formExterno.turno_nome) return alert("Por favor, selecione uma opção válida de pacote.");
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
        valor_pago: formExterno.valor_pago, status_pagamento: 'Externo', nome_encarregado: formExterno.nome_pai, 
        email_encarregado: formExterno.email_pai, telefone_encarregado: formExterno.telefone_pai, 
        respostas_customizadas: { origem: "Inserção Manual 1 a 1" }
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
  // FUNÇÕES DE EXCEL E CSV
  // ==========================================
  const exportarCSV = () => {
    if (validas.length === 0) { 
      alert(isEn ? "No active bookings to export." : "Não existem inscrições ativas para exportar."); 
      return; 
    }

    let csv = "\ufeffOrigem;Data Reserva;Programa;Turno;Valor Pago;Nome Participante;Alergias;Doenças;Encarregado de Educação;Telefone;Email\n";
    validas.forEach((item: any) => {
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
      const linhas = text.split('\n').filter((line: string) => line.trim().length > 0);
      
      if (linhas.length < 2) throw new Error("Ficheiro vazio ou sem dados válidos.");

      let sucessoCount = 0;
      for (let i = 1; i < linhas.length; i++) {
        const colunas = linhas[i].split(';');
        if (colunas.length < 9) continue;

        const [nomeCampoCSV, nomeTurno, valorPago, nomeCrianca, idade, alergias, doencas, nomePai, telefone, email] = colunas.map((c: string) => c.trim().replace(/"/g, ''));

        const campoAlvo = camposParceiro.find((c: any) => c.nome.toLowerCase() === nomeCampoCSV.toLowerCase());
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

  if (loading) return <div className="p-20 text-center font-bold text-slate-500 animate-pulse">A carregar o seu Dashboard...</div>;

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 font-sans pb-24 relative">
      
      {/* HEADER & ACÕES GLOBAIS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 m-0 tracking-tight">{isEn ? 'Booking Operations' : 'Central de Reservas'}</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">{isEn ? 'Manage Hellocamp and manual bookings in one place.' : 'Gira inscrições da HelloCamp e veja os pacotes contratados pelos pais.'}</p>
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
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 relative z-10">Origem: Permanentes/Externos</span>
          <div className="flex items-baseline justify-between relative z-10">
            <span className="text-4xl font-black text-slate-900">{countExternas}</span>
            <span className="text-sm font-black text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-md">+{faturaçãoExterna}€</span>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS COM POPOVER */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 relative z-20">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Procurar Nome</label>
          <input type="text" placeholder="Pesquisar miúdo ou encarregado..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-slate-400" />
        </div>
        
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Filtrar Campo</label>
          <select value={filtroCampoId} onChange={e => { setFiltroCampoId(e.target.value); setFiltroTurno('todos'); }} style={customSelectStyle} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 font-bold text-slate-700 cursor-pointer">
            <option value="todos">Todos os Campos</option>
            {camposParceiro.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        {/* BOTÃO DO FILTRO FIXO (FIXED) DE CALENDÁRIO */}
        {filtroCampoId !== 'todos' && (
          <div className="flex-1 relative animate-in fade-in">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Filtrar por Passe/Data</label>
            <div 
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm font-bold cursor-pointer flex justify-between items-center transition-colors ${filtroTurno === 'todos' ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300' : 'bg-emerald-50 border-emerald-500 text-emerald-900'}`}
            >
              <span className="truncate">{filtroTurno === 'todos' ? 'Todas as Opções' : limparNomeParaExibicao(filtroTurno)}</span>
              <span className="text-slate-400 text-[10px]">▼</span>
            </div>

            {isFilterPanelOpen && (
              <>
                <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsFilterPanelOpen(false)}></div>
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[420px] bg-white rounded-3xl shadow-2xl z-[200] p-6 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
                  
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Filtrar por Passe</span>
                    <div className="flex gap-2">
                      {filtroTurno !== 'todos' && (
                        <button onClick={() => { setFiltroTurno('todos'); setIsFilterPanelOpen(false); }} className="text-[10px] font-black text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-xl transition-colors">Limpar &times;</button>
                      )}
                      <button onClick={() => setIsFilterPanelOpen(false)} className="text-[10px] font-black text-slate-400 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-colors">Fechar</button>
                    </div>
                  </div>

                  {/* Alternador de Modo de Filtro */}
                  {(pacotesFiltro.length > 0 && diasSoltosFiltro.length > 0) && (
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-5">
                      <button onClick={() => setFiltroModo('pacote')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${filtroModo === 'pacote' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Semanas Completas</button>
                      <button onClick={() => setFiltroModo('dia_solto')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${filtroModo === 'dia_solto' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>Dias Soltos</button>
                    </div>
                  )}

                  {/* Lista de Passes Semanais */}
                  {filtroModo === 'pacote' && (
                    <div className="flex flex-col gap-2">
                      {pacotesFiltro.map((pac: any) => (
                        <div key={pac.id} onClick={() => { setFiltroTurno(pac.titulo); setIsFilterPanelOpen(false); }} className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${filtroTurno === pac.titulo ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                          <div>
                            <p className="text-sm font-black text-slate-800 m-0">{pac.titulo}</p>
                            <p className="text-[11px] text-slate-400 mt-1 font-bold">Variantes: {pac.variantes?.length || 0}</p>
                          </div>
                          <span className="text-xl bg-slate-100 p-2 rounded-xl leading-none">🗓️</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Calendário Global com Navegação */}
                  {filtroModo === 'dia_solto' && (
                    <div>
                      <div className="flex items-center justify-between mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <button type="button" onClick={prevMonthFiltro} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors font-bold">&larr;</button>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                          {capitalize(filtroMesAtual.toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { month: 'long', year: 'numeric' }))}
                        </span>
                        <button type="button" onClick={nextMonthFiltro} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors font-bold">&rarr;</button>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 mb-2 p-3 rounded-2xl">
                        {datasFiltroVisiveis.length === 0 ? (
                          <div className="col-span-5 text-center text-xs font-bold text-slate-400 py-4">Nenhum dia de campo neste mês.</div>
                        ) : (
                          datasFiltroVisiveis.map((data: string) => {
                            const isActive = filtroDiaSelecionado === data;
                            const dateObj = new Date(data);
                            return (
                              <div key={data} onClick={() => { setFiltroTurno(data); setFiltroDiaSelecionado(data); setIsFilterPanelOpen(false); }} className={`flex flex-col items-center justify-center py-2.5 rounded-xl border-2 cursor-pointer transition-all ${isActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-md scale-105' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400'}`}>
                                <span className={`text-[8px] font-black uppercase mb-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>{dateObj.toLocaleDateString('pt-PT', {weekday: 'short'}).replace('.','')}</span>
                                <span className="text-base font-black leading-none">{dateObj.toLocaleDateString('pt-PT', {day: '2-digit'})}</span>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* TABELA UNIFICADA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Participante</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Passe / Variante Contratada</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado Clínico</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Origem / Pagamento</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservasFiltradas.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold text-sm">Nenhum resultado encontrado.</td></tr>
              ) : (
                reservasFiltradas.map((item: any) => {
                  const isInativa = item.status === 'Abandonada' || item.status === 'Cancelada';
                  const isExterna = item.isExterna;
                  
                  const alertaAlergia = item.crianca?.restricoes_alimentares && item.crianca.restricoes_alimentares.length > 8 && !item.crianca.restricoes_alimentares.toLowerCase().includes('nenhum');
                  const alertaDoenca = item.crianca?.doencas_cronicas && item.crianca.doencas_cronicas.length > 8 && !item.crianca.doencas_cronicas.toLowerCase().includes('nenhum');
                  const temRisco = !isInativa && (alertaAlergia || alertaDoenca);
                  const temPedidoAlteracao = item.pedido_pendente != null;

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
                        <p className="font-bold text-slate-800 m-0 text-xs">{item.turno || 'Passe Global'}</p>
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
                        {temPedidoAlteracao ? (
                           <div className="flex flex-col gap-1 items-start">
                             <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse">
                               📬 Pedido do Pai
                             </span>
                           </div>
                        ) : isExterna ? (
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
                        <button onClick={() => setReservaSelecionada(item)} className={`px-4 py-2 bg-white border rounded-lg text-xs font-bold transition-colors shadow-sm ${temPedidoAlteracao ? 'border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white'}`}>
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

      {/* MODAL MESTRE: ADICIONAR INSCRIÇÕES MANUAIS COM MODELO DE PASSES E CALENDÁRIO MENSAIS */}
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
                    <span className="text-xs font-medium text-slate-500 text-center">Selecionar Passes e Variantes de Preço configuradas.</span>
                  </button>
                  <button onClick={() => setImportMode('excel')} className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group">
                    <span className="text-4xl">📊</span>
                    <span className="font-black text-slate-800 group-hover:text-emerald-700">Importar Excel/CSV</span>
                    <span className="text-xs font-medium text-slate-500 text-center">Fazer upload de um ficheiro em lote.</span>
                  </button>
                </div>
              )}

              {importMode === 'manual' && (
                <form id="form-manual" onSubmit={handleAddExterno} className="flex flex-col gap-6">
                  
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">1. Escolha do Programa e Variante de Preço</h3>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">Programa/Campo de Férias</label>
                        <select required value={formExterno.campo_id} onChange={e => { setFormExterno({...formExterno, campo_id: e.target.value, turno_nome: "", valor_pago: 0}); setDiaExterno(""); }} style={customSelectStyle} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-orange-500 cursor-pointer">
                          <option value="">Selecione o Campo...</option>
                          {camposParceiro.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>

                      {formExterno.campo_id && (
                        <div className="bg-white p-4 border border-slate-200 rounded-2xl animate-in fade-in space-y-4">
                          {/* Listagem Dinâmica Baseada nos Novos Passes */}
                          {(pacotesModal.length > 0 && diasSoltosModal.length > 0) && (
                            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                              <button type="button" onClick={() => { setModalidadeExterna('pacote'); setFormExterno(p => ({...p, turno_nome: "", valor_pago: 0})); }} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${modalidadeExterna === 'pacote' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                                Programa Inteiro (Pacote)
                              </button>
                              <button type="button" onClick={() => { setModalidadeExterna('dia_solto'); setFormExterno(p => ({...p, turno_nome: "", valor_pago: 0})); }} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${modalidadeExterna === 'dia_solto' ? 'bg-white text-orange-700 shadow-sm border border-orange-100' : 'text-slate-500'}`}>
                                Dias Soltos Avulso
                              </button>
                            </div>
                          )}

                          {modalidadeExterna === 'pacote' && pacotesModal.length > 0 && (
                            <div>
                              <span className="block text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-2">Opções Semanais Disponíveis:</span>
                              <div className="flex flex-col gap-2">
                                {pacotesModal.map((pac: any) => (
                                  <div key={pac.id} className="border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                                    <p className="text-xs font-black text-slate-800 mb-2">{pac.titulo}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {pac.variantes?.map((v: any, i: number) => {
                                        const isSelected = formExterno.turno_nome === `${pac.titulo} (${v.nome})`;
                                        return (
                                          <div key={i} onClick={() => setTurnoEscolhido(pac.titulo, v)} className={`p-2 rounded-lg border-2 cursor-pointer text-center transition-all ${isSelected ? 'bg-orange-50 border-orange-500 font-bold text-orange-900' : 'bg-white border-slate-200 hover:border-orange-200 text-slate-700'}`}>
                                            <p className="text-[11px] m-0 font-bold">{v.nome}</p>
                                            <p className="text-xs font-black text-indigo-700 mt-0.5">{v.preco}€</p>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* NOVO CALENDÁRIO COM MESES (MODAL DE INSERÇÃO) */}
                          {modalidadeExterna === 'dia_solto' && diasSoltosModal.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                              <span className="block text-[10px] font-black text-orange-800 uppercase tracking-widest mb-3">A. Clique no Dia Pretendido:</span>
                              
                              <div className="flex items-center justify-between mb-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <button type="button" onClick={prevMonthModal} className="p-2 text-slate-400 hover:text-orange-600 transition-colors font-bold">&larr;</button>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                                  {capitalize(modalMesAtual.toLocaleDateString(isEn ? 'en-US' : 'pt-PT', { month: 'long', year: 'numeric' }))}
                                </span>
                                <button type="button" onClick={nextMonthModal} className="p-2 text-slate-400 hover:text-orange-600 transition-colors font-bold">&rarr;</button>
                              </div>

                              <div className="grid grid-cols-5 gap-1.5 mb-4">
                                {datasModalVisiveis.length === 0 ? (
                                  <div className="col-span-5 text-center text-xs font-bold text-slate-400 py-4">Nenhum dia disponível para venda avulso neste mês.</div>
                                ) : (
                                  datasModalVisiveis.map((data: string) => {
                                    const isActive = diaExterno === data;
                                    const dateObj = new Date(data);
                                    const diaSemana = dateObj.toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { weekday: 'short' }).replace('.', '');
                                    const diaNumero = dateObj.toLocaleDateString(isEn ? 'en-GB' : 'pt-PT', { day: '2-digit' });

                                    return (
                                      <div key={data} onClick={() => { setDiaExterno(data); setFormExterno(p => ({...p, turno_nome: "", valor_pago: 0})); }} className={`flex flex-col items-center justify-center py-2 rounded-lg cursor-pointer border-2 transition-all ${isActive ? 'bg-orange-600 border-orange-600 text-white shadow-sm scale-105' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-orange-400'}`}>
                                        <span className={`text-[8px] font-black uppercase ${isActive ? 'text-orange-100' : 'text-slate-400'}`}>{diaSemana}</span>
                                        <span className="text-sm font-black">{diaNumero}</span>
                                      </div>
                                    )
                                  })
                                )}
                              </div>

                              {diaExterno && (
                                <div className="border-t border-orange-200/50 pt-3 animate-in fade-in">
                                  <span className="block text-[10px] font-black text-orange-800 uppercase tracking-widest mb-2">B. Escolha a Opção Diária:</span>
                                  <div className="flex flex-col gap-2">
                                    {diasSoltosModal.map((pac: any) => (
                                      <div key={pac.id} className="border border-slate-200 p-3 rounded-xl bg-slate-50/50">
                                        <p className="text-xs font-black text-slate-800 mb-2">{pac.titulo}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {pac.variantes?.map((v: any, i: number) => {
                                            const isSelected = formExterno.turno_nome === `${pac.titulo} (${v.nome})`;
                                            return (
                                              <div key={i} onClick={() => setTurnoEscolhido(pac.titulo, v)} className={`p-2 rounded-lg border-2 cursor-pointer text-center transition-all ${isSelected ? 'bg-orange-50 border-orange-500 font-bold text-orange-900' : 'bg-white border-slate-200 hover:border-orange-200 text-slate-700'}`}>
                                                <p className="text-[11px] m-0 font-bold">{v.nome}</p>
                                                <p className="text-xs font-black text-indigo-700 mt-0.5">{v.preco}€</p>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    ))}
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

              {importMode === 'excel' && (
                <div className="flex flex-col gap-6">
                  <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl">
                    <h3 className="text-sm font-black text-blue-900 mb-2">1. Descarregue o Template</h3>
                    <p className="text-xs text-blue-700 mb-4">Mantenha os cabeçalhos intactos para a importação em lote.</p>
                    <button onClick={downloadTemplateCSV} className="px-4 py-2 bg-white border border-blue-300 text-blue-800 font-bold rounded-lg shadow-sm hover:bg-blue-100 text-xs">
                      ⬇️ Download Template CSV
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                    <h3 className="text-sm font-black text-slate-800 mb-2">2. Faça Upload do Ficheiro</h3>
                    <input type="file" accept=".csv" onChange={(e: any) => setCsvFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0" />
                  </div>
                </div>
              )}
            </div>

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

      {/* MODAL: VER FICHA CLÍNICA DETALHADA E UPSALES */}
      {reservaSelecionada && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className={`p-6 text-white flex justify-between items-center ${reservaSelecionada.status === 'Cancelada' || reservaSelecionada.status === 'Abandonada' ? 'bg-red-600' : 'bg-slate-900'}`}>
              <div>
                <h2 className="m-0 text-2xl font-black">Ficha de Participante</h2>
                <p className="m-0 text-slate-300 text-xs font-mono mt-1">REF: {reservaSelecionada.id}</p>
              </div>
              <button onClick={fecharModalReserva} className="text-white opacity-60 hover:opacity-100 text-3xl font-light">&times;</button>
            </div>

            <div className="p-8 overflow-y-auto bg-slate-50 flex flex-col gap-6">
              
              {reservaSelecionada.isExterna ? (
                <div className="bg-orange-100 text-orange-800 p-3 rounded-xl border border-orange-200 text-xs font-black uppercase tracking-widest text-center shadow-sm">
                  <b>🟠 Inscrição Externa (Manual)</b>
                </div>
              ) : (
                <div className="bg-emerald-100 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs font-black uppercase tracking-widest text-center shadow-sm">
                  <b>🟢 Inscrição Online HelloCamp</b>
                </div>
              )}

              {/* CARTÃO GESTÃO FINANCEIRA */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest m-0">💳 Controlo Financeiro do Passe</h3>
                  {(!reservaSelecionada.isExterna && reservaSelecionada.status !== 'Cancelada') && (
                    <button onClick={() => setIsAjusteModalOpen(!isAjusteModalOpen)} className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-200">
                      + Cobrar Valor Adicional
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-bold mb-1">Total Faturado</p>
                    <p className="text-2xl font-black text-slate-900 m-0">{reservaSelecionada.valor}€</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${reservaSelecionada.status === 'Pago' || reservaSelecionada.status === 'Sinal Pago' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                      Estado: {reservaSelecionada.status}
                    </span>
                  </div>
                </div>

                {reservaSelecionada.pedido_pendente && (
                  <div className="mt-5 bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
                    <span className="text-2xl">📬</span>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 m-0 mb-1">Pedido de Upgrade do Pai:</p>
                      <p className="text-sm font-bold text-blue-900 m-0 italic">"{reservaSelecionada.pedido_pendente}"</p>
                      <button onClick={() => setIsAjusteModalOpen(true)} className="mt-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                        Aprovar e Lançar Fatura Extra
                      </button>
                    </div>
                  </div>
                )}

                {isAjusteModalOpen && (
                  <form onSubmit={handleSubmeterAjuste} className="mt-6 pt-5 border-t border-slate-100 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">Motivo do Ajuste (Ex: Upgrade para Variante Alimentação)</label>
                        <input type="text" required value={ajusteForm.motivo} onChange={e => setAjusteForm({...ajusteForm, motivo: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase">Preço a Cobrar Extra (€)</label>
                        <input type="number" required min="1" value={ajusteForm.valor} onChange={e => setAjusteForm({...ajusteForm, valor: Number(e.target.value)})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setIsAjusteModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg">Cancelar</button>
                      <button type="submit" disabled={savingAjuste} className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Enviar Pedido</button>
                    </div>
                  </form>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">👦 Identificação</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="font-bold text-slate-500">Nome:</span> <span className="font-black text-slate-900">{reservaSelecionada.crianca?.nome}</span></div>
                    <div className="flex justify-between"><span className="font-bold text-slate-500">Nascimento:</span> <span className="font-black text-slate-900">{reservaSelecionada.crianca?.data_nascimento || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="font-bold text-slate-500">Género:</span> <span className="font-black text-slate-900">{reservaSelecionada.crianca?.sexo || 'N/A'}</span></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border-2 border-red-100 shadow-sm relative overflow-hidden">
                  <h3 className="text-sm font-black text-red-400 uppercase tracking-widest mb-4 pb-2 border-b border-red-50">Perfil Clínico</h3>
                  <div className="mb-2 bg-red-50 p-2.5 rounded-lg text-xs font-bold text-red-900">
                    Alergias: {reservaSelecionada.crianca?.restricoes_alimentares || 'Nenhuma'}
                  </div>
                  <div className="bg-red-50 p-2.5 rounded-lg text-xs font-bold text-red-900">
                    Doenças: {reservaSelecionada.crianca?.doencas_cronicas || 'Nenhuma'}
                  </div>
                </div>
              </div>

              {reservaSelecionada.respostasCustomizadas && Object.keys(reservaSelecionada.respostasCustomizadas).length > 0 && (
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm">
                   <h3 className="text-sm font-black text-blue-800 uppercase tracking-widest mb-4 pb-2 border-b border-blue-200/50">📋 Respostas Específicas das Perguntas Customizadas</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {Object.entries(reservaSelecionada.respostasCustomizadas)
                        .filter(([p]) => p !== 'origem' && p !== 'historico_ajustes' && p !== 'pedido_pai_pendente')
                        .map(([pergunta, resposta]: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-blue-50">
                          <span className="block text-[10px] font-bold text-blue-500 mb-1">{pergunta}</span>
                          <span className="text-sm font-black text-slate-800">{resposta}</span>
                        </div>
                     ))}
                   </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
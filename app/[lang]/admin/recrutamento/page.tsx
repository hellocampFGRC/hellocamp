"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

export default function RecrutamentoParceirosPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const isEn = lang === 'en';

  const [monitores, setMonitores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filtroDistrito, setFiltroDistrito] = useState("");
  const [filtroExperiencia, setFiltroExperiencia] = useState("");
  
  // Modal de Detalhes
  const [monitorSelecionado, setMonitorSelecionado] = useState<any>(null);

  useEffect(() => {
    const fetchMonitores = async () => {
      const { data } = await supabase
        .from('monitores')
        .select('*')
        .order('criado_at', { ascending: false });
        
      setMonitores(data || []);
      setLoading(false);
    };

    fetchMonitores();
  }, []);

  // Calcular Idade a partir da data de nascimento
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

  // Filtragem local
  const monitoresFiltrados = monitores.filter(m => {
    const matchDistrito = filtroDistrito === "" || m.distrito_residencia === filtroDistrito;
    const matchExperiencia = filtroExperiencia === "" || m.experiencia_anos === filtroExperiencia;
    return matchDistrito && matchExperiencia;
  });

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];

  const selectClass = "w-full py-2.5 px-4 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-all shadow-sm bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.75rem_auto] bg-[position:right_1rem_center] bg-no-repeat";

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* CABEÇALHO */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight m-0">
          {isEn ? "Staff Recruitment" : "Bolsa de Monitores"}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-2 max-w-2xl leading-relaxed">
          {isEn 
            ? "Find and recruit the best monitors and animators for your upcoming camps. Filter by location, experience, and certificates." 
            : "Encontre e recrute a equipa ideal para os seus campos de férias. Explore jovens disponíveis, valide as suas certificações e entre em contacto diretamente."}
        </p>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
            {isEn ? "Filter by District" : "Filtrar por Distrito"}
          </label>
          <select className={selectClass} value={filtroDistrito} onChange={e => setFiltroDistrito(e.target.value)}>
            <option value="">{isEn ? "All Locations" : "Todos os Distritos"}</option>
            {distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
            {isEn ? "Experience Level" : "Nível de Experiência"}
          </label>
          <select className={selectClass} value={filtroExperiencia} onChange={e => setFiltroExperiencia(e.target.value)}>
            <option value="">{isEn ? "Any Experience" : "Qualquer Experiência"}</option>
            <option value="0">{isEn ? "First Time" : "Nenhuma / Primeira vez"}</option>
            <option value="1-2">1-2 {isEn ? "years" : "anos"}</option>
            <option value="3-5">3-5 {isEn ? "years" : "anos"}</option>
            <option value="+5">+5 {isEn ? "years" : "anos"}</option>
          </select>
        </div>
      </div>

      {/* GRELHA DE RESULTADOS */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">
          {isEn ? "Loading talent pool..." : "A carregar talentos..."}
        </div>
      ) : monitoresFiltrados.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
          <span className="text-5xl block mb-4">🔍</span>
          <h3 className="text-lg font-black text-slate-900 mb-2">{isEn ? "No monitors found" : "Nenhum monitor encontrado"}</h3>
          <p className="text-sm text-slate-500 font-medium">
            {isEn ? "Try adjusting your filters to see more results." : "Tente ajustar os filtros para encontrar a equipa ideal."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {monitoresFiltrados.map(monitor => (
            <div key={monitor.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
              
              {/* Cabeçalho do Cartão */}
              <div className="p-6 pb-4 border-b border-slate-100 flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-white shadow-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {monitor.fotografia_url ? (
                    <img src={monitor.fotografia_url} alt={monitor.nome_completo} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🧑‍🏫</span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-base font-black text-slate-900 leading-tight truncate group-hover:text-emerald-600 transition-colors">
                    {monitor.nome_completo}
                  </h3>
                  <div className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                    <span>📍 {monitor.distrito_residencia}</span>
                    <span className="text-slate-300">•</span>
                    <span>{calcularIdade(monitor.data_nascimento)} {isEn ? "yrs" : "anos"}</span>
                  </div>
                </div>
              </div>

              {/* Corpo do Cartão */}
              <div className="p-6 flex-1 flex flex-col">
                
                <div className="mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    {isEn ? "Experience" : "Experiência"}
                  </span>
                  <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md">
                    {monitor.experiencia_anos === "0" ? (isEn ? "Beginner" : "Iniciante") : `${monitor.experiencia_anos} ${isEn ? "years" : "anos"}`}
                  </span>
                </div>

                <div className="mb-6 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                    {isEn ? "Top Certificates" : "Certificações Chave"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {monitor.certificacoes && monitor.certificacoes.length > 0 ? (
                      monitor.certificacoes.slice(0, 2).map((cert: string) => (
                        <span key={cert} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-100 truncate max-w-full">
                          {cert}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic font-medium">{isEn ? "None specified" : "Nenhuma registada"}</span>
                    )}
                    {monitor.certificacoes && monitor.certificacoes.length > 2 && (
                      <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-md border border-slate-200">
                        +{monitor.certificacoes.length - 2}
                      </span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setMonitorSelecionado(monitor)}
                  className="w-full py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-colors shadow-sm"
                >
                  {isEn ? "View Profile" : "Ver Perfil Completo"}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL DO PERFIL COMPLETO */}
      {monitorSelecionado && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2rem] flex flex-col overflow-hidden shadow-2xl">
            
            {/* CABEÇALHO DO MODAL */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                  {monitorSelecionado.fotografia_url ? (
                    <img src={monitorSelecionado.fotografia_url} alt={monitorSelecionado.nome_completo} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🧑‍🏫</span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 m-0">{monitorSelecionado.nome_completo}</h2>
                  <p className="text-xs font-bold text-slate-500 mt-1">📍 {monitorSelecionado.distrito_residencia} • {calcularIdade(monitorSelecionado.data_nascimento)} {isEn ? "years old" : "anos"}</p>
                </div>
              </div>

              <button onClick={() => setMonitorSelecionado(null)} className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full flex items-center justify-center font-bold transition-colors relative z-10">&times;</button>
            </div>

            {/* CORPO DO PERFIL */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-50/50 space-y-8">
              
              {/* Pitch / Bio */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">{isEn ? "Pitch / Presentation" : "Carta de Apresentação"}</h4>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-sm text-slate-700 leading-relaxed m-0 font-medium whitespace-pre-wrap">
                    {monitorSelecionado.bio || (isEn ? "No bio provided." : "O monitor não preencheu a biografia.")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Certificações */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">{isEn ? "Certificates" : "Certificações"}</h4>
                  <div className="flex flex-col gap-2">
                    {monitorSelecionado.certificacoes && monitorSelecionado.certificacoes.length > 0 ? (
                      monitorSelecionado.certificacoes.map((cert: string) => (
                        <div key={cert} className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-emerald-100 shadow-sm">
                          <span className="text-emerald-500">✓</span>
                          <span className="text-xs font-bold text-slate-700">{cert}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-medium text-slate-500 italic m-0">Nenhuma registada.</p>
                    )}
                  </div>
                </div>

                {/* Disponibilidade */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">{isEn ? "Availability" : "Disponibilidade"}</h4>
                  <div className="flex flex-wrap gap-2">
                    {monitorSelecionado.disponibilidade && monitorSelecionado.disponibilidade.length > 0 ? (
                      monitorSelecionado.disponibilidade.map((disp: string) => (
                        <span key={disp} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                          📅 {disp}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs font-medium text-slate-500 italic m-0">Não especificada.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* RODAPÉ (Contactos Diretos) */}
            <div className="p-6 border-t border-slate-200 bg-white flex-shrink-0">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest text-center mb-4">
                {isEn ? "Contact this Monitor" : "Contactar Monitor"}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <a 
                  href={`mailto:${monitorSelecionado.email}?subject=Contacto via HelloCamp - Proposta de Equipa`}
                  className="flex-1 bg-slate-900 text-white flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md no-underline"
                >
                  <span>✉️</span> {isEn ? "Send Email" : "Enviar Email"}
                </a>
                <a 
                  href={`tel:${monitorSelecionado.telefone}`}
                  className="flex-1 bg-white border-2 border-slate-200 text-slate-800 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all no-underline"
                >
                  <span>📞</span> Ligar ({monitorSelecionado.telefone})
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
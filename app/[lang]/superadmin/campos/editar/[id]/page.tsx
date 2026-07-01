"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import imageCompression from 'browser-image-compression';
import React from "react";

type ImagePreview = { file?: File; url?: string; preview: string; isMain: boolean; };

const FOTOS_PADRAO = [
  { url: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1200&auto=format&fit=crop", nome: "Surf" },
  { url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1200&auto=format&fit=crop", nome: "Tendas" },
  { url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop", nome: "Tech" },
  { url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1200&auto=format&fit=crop", nome: "Artes" },
  { url: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop", nome: "Desporto" },
  { url: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?q=80&w=1200&auto=format&fit=crop", nome: "Diversão" }
];

const sanitizeFileName = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-]/g, "_");

export default function SuperAdminEditarCampo({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const resolvedParams = use(params);
  const { lang, id } = resolvedParams;
  
  const router = useRouter();
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [usarFotoPadrao, setUsarFotoPadrao] = useState(false);
  
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [documentosExistentes, setDocumentosExistentes] = useState<{nome: string, url: string}[]>([]);
  
  const [contratoFile, setContratoFile] = useState<File | null>(null);
  
  const [mapPreview, setMapPreview] = useState<{lat: number, lon: number} | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);

  const [pais, setPais] = useState("Portugal");
  const [linguas, setLinguas] = useState({ pt: false, en: false, es: false, fr: false, de: false });

  // TURNOS
  const [turnos, setTurnos] = useState([{ nome: "", data_inicio: "", data_fim: "", preco: 0, permite_dias: false, preco_dia: 0, vagas: 20 }]);
  // DESCONTOS FLEXIVEIS
  const [descontos, setDescontos] = useState([{ nome: "", valor: 0, tipo: "percentagem" }]);

  const [formData, setFormData] = useState({
    nome: "", categoria: "", idade: "", local: "", Distrito: "", racio_monitores: "", duracao_dias: 7,
    alimentacao: "Não tem", alojamento: "Não tem", seguro: "Incluído no Preço", descricao: "", regras_termos: "",
    extra_alimentacao: 0, tipo_cobranca_alimentacao: "Por Turno", extra_alojamento: 0, tipo_cobranca_alojamento: "Por Turno",
    extra_prolongamento: 0, tipo_cobranca_prolongamento: "Por Turno", extra_transporte: 0, tipo_cobranca_transporte: "Por Turno",
    taxa_comissao: "", base_comissao: "", contrato_parceiro_url: ""
  });

  const distritosPT = ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu"];
  const paises = [{ pt: "Portugal", en: "Portugal" }, { pt: "Espanha", en: "Spain" }, { pt: "França", en: "France" }, { pt: "Reino Unido", en: "United Kingdom" }, { pt: "Brasil", en: "Brazil" }, { pt: "Estados Unidos", en: "United States" }, { pt: "Outro", en: "Other" }];

  useEffect(() => {
    const fetchCampo = async () => {
      const { data, error } = await supabase.from('campos').select('*').eq('id', id).single();
      if (data) {
        setFormData({ ...data, taxa_comissao: data.taxa_comissao || '', base_comissao: data.base_comissao || '', contrato_parceiro_url: data.contrato_parceiro_url || '' });
        
        if (data.turnos) {
          const turnosMapeados = data.turnos.map((t: any) => ({ ...t, vagas: t.vagas || data.vagas_totais || 20 }));
          setTurnos(turnosMapeados);
        }
        if (data.descontos) {
          setDescontos(data.descontos.length > 0 ? data.descontos : [{ nome: "", valor: 0, tipo: "percentagem" }]);
        }

        if (data.pais) setPais(data.pais);
        if (data.latitude && data.longitude) setMapPreview({ lat: data.latitude, lon: data.longitude });
        if (data.linguas_faladas) {
          setLinguas({ pt: data.linguas_faladas.includes("Português"), en: data.linguas_faladas.includes("Inglês"), es: data.linguas_faladas.includes("Espanhol"), fr: data.linguas_faladas.includes("Francês"), de: data.linguas_faladas.includes("Alemão") });
        }
        const loadedImages: ImagePreview[] = [];
        if (data.imagem) loadedImages.push({ url: data.imagem, preview: data.imagem, isMain: true });
        if (data.galeria && Array.isArray(data.galeria)) data.galeria.forEach((url: string) => loadedImages.push({ url, preview: url, isMain: false }));
        setImages(loadedImages);
        if (data.programas_pdf && Array.isArray(data.programas_pdf)) setDocumentosExistentes(data.programas_pdf);
      }
      setLoading(false);
    };
    fetchCampo();
  }, [id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file, index) => ({ file, preview: URL.createObjectURL(file), isMain: images.length === 0 && index === 0 }));
      setImages(prev => [...prev, ...newImages]);
      setUsarFotoPadrao(false);
    }
  };

  const selecionarFotoPadrao = (url: string) => { setImages([{ url, preview: url, isMain: true }]); setUsarFotoPadrao(true); };
  const removeImage = (indexToRemove: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, idx) => idx !== indexToRemove);
      if (prev[indexToRemove].isMain && newImages.length > 0) newImages[0].isMain = true;
      if (newImages.length === 0) setUsarFotoPadrao(false);
      return newImages;
    });
  };
  const setMainImage = (indexToMain: number) => setImages(prev => prev.map((img, idx) => ({ ...img, isMain: idx === indexToMain })));

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setDocumentos(prev => [...prev, ...Array.from(e.target.files as FileList)]); };
  const removeNovoDoc = (indexToRemove: number) => setDocumentos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  const removeDocExistente = (indexToRemove: number) => setDocumentosExistentes(prev => prev.filter((_, idx) => idx !== indexToRemove));

  const handleContratoSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) setContratoFile(e.target.files[0]); };

  const handleLinguasChange = (langKey: keyof typeof linguas) => setLinguas(prev => ({ ...prev, [langKey]: !prev[langKey] }));
  const getLinguasString = () => {
    const ativas = [];
    if (linguas.pt) ativas.push("Português"); if (linguas.en) ativas.push("Inglês"); if (linguas.es) ativas.push("Espanhol"); if (linguas.fr) ativas.push("Francês"); if (linguas.de) ativas.push("Alemão");
    return ativas.join(", ");
  };

  // TURNOS
  const handleAddTurno = () => setTurnos([...turnos, { nome: "", data_inicio: "", data_fim: "", preco: 0, permite_dias: false, preco_dia: 0, vagas: 20 }]);
  const handleRemoveTurno = (index: number) => setTurnos(turnos.filter((_, i) => i !== index));
  const handleTurnoChange = (index: number, field: string, value: string | number | boolean) => {
    const novosTurnos = [...turnos]; novosTurnos[index] = { ...novosTurnos[index], [field]: value }; setTurnos(novosTurnos);
  };

  // DESCONTOS
  const handleAddDesconto = () => setDescontos([...descontos, { nome: "", valor: 0, tipo: "percentagem" }]);
  const handleRemoveDesconto = (index: number) => setDescontos(descontos.filter((_, i) => i !== index));
  const handleDescontoChange = (index: number, field: string, value: string | number) => {
    const d = [...descontos]; d[index] = { ...d[index], [field]: value }; setDescontos(d);
  };

  const buscarNoMapaManual = async () => {
    if (formData.local.length < 3) return;
    try {
      const queryStr = pais === "Portugal" && formData.Distrito ? `${formData.local}, ${formData.Distrito}, ${pais}` : `${formData.local}, ${pais}`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}`);
      const data = await res.json();
      if (data && data.length > 0) setMapPreview({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
    } catch (e) { console.error(e); }
    setAddressSuggestions([]);
  };

  const traduzirParaIngles = async (texto: string) => {
    if (!texto) return "";
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=pt|en`);
      const data = await res.json();
      return data.responseData.translatedText;
    } catch (e) { return texto; }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (!mapPreview) { alert("Garanta que o mapa carregou."); setSaving(false); return; }
    if (images.length === 0) { alert("Adicione uma fotografia."); setSaving(false); return; }

    try {
      setStatusText("A processar fotografias...");
      const uploadedImages = await Promise.all(images.map(async (img) => {
        if (!img.file) return { url: img.url, isMain: img.isMain };
        const compressedFile = await imageCompression(img.file, { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true });
        const fileName = `${Date.now()}-${sanitizeFileName(compressedFile.name)}`;
        const { error } = await supabase.storage.from('campos-imagens').upload(fileName, compressedFile);
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('campos-imagens').getPublicUrl(fileName);
        return { url: publicUrlData.publicUrl, isMain: img.isMain };
      }));

      const mainImageUrl = uploadedImages.find(i => i.isMain)?.url || uploadedImages[0]?.url;
      const galeriaUrls = uploadedImages.filter(i => !i.isMain).map(i => i.url);

      setStatusText("A processar documentos de programa...");
      const novosDocs = await Promise.all(documentos.map(async (doc) => {
        const fileName = `${Date.now()}-${sanitizeFileName(doc.name)}`;
        const { error } = await supabase.storage.from('campos-documentos').upload(fileName, doc);
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('campos-documentos').getPublicUrl(fileName);
        return { nome: doc.name, url: publicUrlData.publicUrl };
      }));

      const programasDocsFinais = [...documentosExistentes, ...novosDocs];

      setStatusText("A processar Contrato Parceiro...");
      let urlContratoFinal = formData.contrato_parceiro_url;
      if (contratoFile) {
        const fileContratoName = `contrato-${Date.now()}-${sanitizeFileName(contratoFile.name)}`;
        const { error: errContrato } = await supabase.storage.from('campos-documentos').upload(fileContratoName, contratoFile);
        if (errContrato) throw errContrato;
        urlContratoFinal = supabase.storage.from('campos-documentos').getPublicUrl(fileContratoName).data.publicUrl;
      }

      setStatusText("A traduzir dados...");
      const linguasFinais = getLinguasString();

      const [
        nome_en, categoria_en, local_en, idade_en, descricao_en,
        alimentacao_en, alojamento_en, seguro_en, Distrito_en, regras_termos_en
      ] = await Promise.all([
        traduzirParaIngles(formData.nome), traduzirParaIngles(formData.categoria), traduzirParaIngles(formData.local),
        traduzirParaIngles(formData.idade), traduzirParaIngles(formData.descricao), traduzirParaIngles(formData.alimentacao),
        traduzirParaIngles(formData.alojamento), traduzirParaIngles(formData.seguro), traduzirParaIngles(formData.Distrito),
        traduzirParaIngles(formData.regras_termos)
      ]);

      const turnos_en = await Promise.all(turnos.map(async (t) => ({ ...t, nome: await traduzirParaIngles(t.nome) })));
      
      const precos = turnos.map(t => Number(t.preco)).filter(p => !isNaN(p) && p > 0);
      const precoMinimo = precos.length > 0 ? Math.min(...precos) : 0;
      
      const formatarDataStr = (d: string) => d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }) : '';
      const textoDatas = turnos.map(t => `${formatarDataStr(t.data_inicio)} a ${formatarDataStr(t.data_fim)}`).join(", ");
      const textoDatasEn = turnos.map(t => `${formatarDataStr(t.data_inicio)} to ${formatarDataStr(t.data_fim)}`).join(", ");
      const totalVagasCalculado = turnos.reduce((acc, curr) => acc + (Number(curr.vagas) || 0), 0);

      const descontosLimpos = descontos.filter(d => d.nome.trim() !== "" && Number(d.valor) > 0);

      const taxaFinal = formData.taxa_comissao === '' ? null : Number(formData.taxa_comissao);
      const baseFinal = formData.base_comissao === '' ? null : formData.base_comissao;

      setStatusText("A guardar alterações no Quartel General...");
      const { error } = await supabase.from("campos").update({
        nome: formData.nome, categoria: formData.categoria, idade: formData.idade, local: formData.local, Distrito: formData.Distrito,
        vagas_totais: totalVagasCalculado, racio_monitores: formData.racio_monitores, duracao_dias: formData.duracao_dias,
        alimentacao: formData.alimentacao, alojamento: formData.alojamento, seguro: formData.seguro,
        descricao: formData.descricao, regras_termos: formData.regras_termos,
        extra_alimentacao: formData.extra_alimentacao, extra_alojamento: formData.extra_alojamento,
        extra_prolongamento: formData.extra_prolongamento, extra_transporte: formData.extra_transporte,
        preco: precoMinimo, datas_disponiveis: textoDatas, datas_disponiveis_en: textoDatasEn, pais, pais_en: isEn ? 'United Kingdom' : 'Reino Unido', 
        linguas_faladas: linguasFinais, linguas_faladas_en: linguasFinais,
        imagem: mainImageUrl, galeria: galeriaUrls, programas_pdf: programasDocsFinais, regras_termos_en,
        latitude: mapPreview.lat, longitude: mapPreview.lon, turnos, turnos_en, descontos: descontosLimpos,
        nome_en, categoria_en, local_en, idade_en, descricao_en, alimentacao_en, alojamento_en, seguro_en, Distrito_en,
        taxa_comissao: taxaFinal, base_comissao: baseFinal, contrato_parceiro_url: urlContratoFinal
      }).eq('id', id);

      if (error) throw error;
      alert("Campo atualizado com sucesso (Modo SuperAdmin).");
      router.push(`/${lang}/superadmin/campos`);
    } catch (error: any) { alert("Erro: " + error.message); } finally { setSaving(false); setStatusText(""); }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>A carregar dados do campo (Modo HQ)...</div>;

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      
      <Link href={`/${lang}/superadmin/campos`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#64748b', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
        &larr; Voltar ao Diretório Global
      </Link>

      <h1 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '2rem', color: '#0f172a' }}>
        Editar Campo: {formData.nome} <span style={{ fontSize: '12px', backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', verticalAlign: 'middle', marginLeft: '0.5rem' }}>SuperAdmin HQ</span>
      </h1>

      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* REGRAS DE COMISSÃO E CONTRATO (HQ) */}
        <div style={{ ...sectionStyle, border: '2px solid #fbbf24', backgroundColor: '#fffbeb' }}>
          <h2 style={sectionTitleStyle}>⚡ Comissão & Contrato HelloCamp</h2>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Taxa Específica do Campo (%)</label>
              <input type="number" step="0.1" value={formData.taxa_comissao} onChange={e => setFormData({...formData, taxa_comissao: e.target.value})} style={inputStyle} placeholder="Vazio = Usa regra do parceiro" />
            </div>
            <div>
              <label style={labelStyle}>Base de Incidência</label>
              <select value={formData.base_comissao} onChange={e => setFormData({...formData, base_comissao: e.target.value})} style={selectStyle}>
                <option value="">-- Regra Geral do Parceiro --</option>
                <option value="total">Sobre Valor Total (Programa + Extras)</option>
                <option value="apenas_programa">Apenas sobre Programa</option>
                <option value="sem_comissao">Isento (0%)</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #fde68a', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
              <label style={labelStyle}>Upload de Contrato de Parceiro Assinado (PDF)</label>
              {formData.contrato_parceiro_url && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', fontSize: '13px', fontWeight: 'bold' }}>
                  ✅ Contrato anexado: <a href={formData.contrato_parceiro_url} target="_blank" rel="noopener noreferrer" style={{ color: '#b45309' }}>Ver Documento</a>
                </div>
              )}
              <input type="file" accept=".pdf" onChange={handleContratoSelect} style={{ width: '100%', padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px dashed #fbbf24' }} />
              <p style={{ fontSize: '12px', color: '#b45309', marginTop: '0.5rem' }}>* Ao anexar o contrato que o campo paga à HelloCamp, este ficará disponível para download no painel do parceiro.</p>
            </div>
          </div>
        </div>

        {/* RESTANTES SECÇÕES - IGUAL AO PARCEIRO */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>1. Informações Básicas</h2>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Nome do Campo</label><input type="text" required value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value})} style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select required value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})} style={selectStyle}>
                <option value="">Selecione...</option><option value="Desporto">Desporto</option><option value="Aventura & Natureza">Aventura & Natureza</option><option value="Tecnologia & Ciência">Tecnologia & Ciência</option><option value="Artes & Criatividade">Artes & Criatividade</option><option value="Línguas">Línguas</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Faixa Etária</label>
              <select required value={formData.idade || ''} onChange={e => setFormData({...formData, idade: e.target.value})} style={selectStyle}>
                <option value="">Selecione...</option><option value="6-9 anos">6-9 anos</option><option value="10-13 anos">10-13 anos</option><option value="14-17 anos">14-17 anos</option><option value="Todas as idades">Todas as idades</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Línguas Faladas</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.pt} onChange={() => handleLinguasChange('pt')} /> PT</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.en} onChange={() => handleLinguasChange('en')} /> EN</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.es} onChange={() => handleLinguasChange('es')} /> ES</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.fr} onChange={() => handleLinguasChange('fr')} /> FR</label>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={linguas.de} onChange={() => handleLinguasChange('de')} /> DE</label>
              </div>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>2. Localização</h2>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>País</label>
              <select required value={pais} onChange={e => { setPais(e.target.value); setMapPreview(null); if (e.target.value !== "Portugal") setFormData({...formData, Distrito: ""}); }} style={selectStyle}>
                {paises.map(p => <option key={p.pt} value={p.pt}>{p.pt}</option>)}
              </select>
            </div>
            {pais === "Portugal" && (
              <div>
                <label style={labelStyle}>Distrito</label>
                <select required value={formData.Distrito || ''} onChange={e => { setFormData({...formData, Distrito: e.target.value}); setMapPreview(null); }} style={selectStyle}>
                  <option value="">Selecione...</option>{distritosPT.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
              <label style={labelStyle}>Morada Específica (Pressione Enter para pesquisar)</label>
              <input type="text" required value={formData.local || ''} onChange={e => { setFormData({...formData, local: e.target.value}); setMapPreview(null); }} onBlur={buscarNoMapaManual} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); buscarNoMapaManual(); } }} style={inputStyle} />
              {addressSuggestions.length > 0 && !mapPreview && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '0.5rem', marginTop: '0.25rem', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                  {addressSuggestions.map((sugestao, index) => (
                    <div key={index} onClick={() => { setFormData({ ...formData, local: sugestao.display_name }); setMapPreview({ lat: parseFloat(sugestao.lat), lon: parseFloat(sugestao.lon) }); setAddressSuggestions([]); }} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: index !== addressSuggestions.length -1 ? '1px solid #f1f5f9' : 'none', fontSize: '13px', color: '#334155' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}>
                      {sugestao.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {mapPreview && (
            <div style={{ marginTop: '1.5rem', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <iframe width="100%" height="250" frameBorder="0" scrolling="no" src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapPreview.lon-0.005},${mapPreview.lat-0.005},${mapPreview.lon+0.005},${mapPreview.lat+0.005}&layer=mapnik&marker=${mapPreview.lat},${mapPreview.lon}`}></iframe>
            </div>
          )}
        </div>

        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>3. Turnos e Vagas</h2>
            <button type="button" onClick={handleAddTurno} style={{ backgroundColor: '#f1f5f9', color: '#059669', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>+ Adicionar Turno</button>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Duração Base Global (em Dias)</label>
            <input type="number" required value={formData.duracao_dias || 0} onChange={e => setFormData({...formData, duracao_dias: Number(e.target.value)})} style={{...inputStyle, maxWidth: '200px'}} />
          </div>
          {turnos.map((turno, index) => (
            <div key={index} style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ flex: '1 1 180px' }}><label style={labelStyle}>Nome do Turno</label><input type="text" required value={turno.nome || ''} onChange={e => handleTurnoChange(index, 'nome', e.target.value)} style={inputStyle} /></div>
                <div style={{ flex: '1 1 110px' }}><label style={labelStyle}>Início</label><input type="date" required value={turno.data_inicio || ''} onChange={e => handleTurnoChange(index, 'data_inicio', e.target.value)} style={inputStyle} /></div>
                <div style={{ flex: '1 1 110px' }}><label style={labelStyle}>Fim</label><input type="date" required value={turno.data_fim || ''} onChange={e => handleTurnoChange(index, 'data_fim', e.target.value)} style={inputStyle} /></div>
                <div style={{ width: '90px' }}><label style={labelStyle}>Vagas</label><input type="number" required value={turno.vagas || 0} onChange={e => handleTurnoChange(index, 'vagas', Number(e.target.value))} style={inputStyle} /></div>
                <div style={{ width: '100px' }}><label style={labelStyle}>Preço (€)</label><input type="number" required value={turno.preco || 0} onChange={e => handleTurnoChange(index, 'preco', Number(e.target.value))} style={inputStyle} /></div>
                {turnos.length > 1 && <button type="button" onClick={() => handleRemoveTurno(index)} style={{ padding: '0.875rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>X</button>}
              </div>
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <label style={checkboxLabelStyle}><input type="checkbox" checked={turno.permite_dias || false} onChange={e => handleTurnoChange(index, 'permite_dias', e.target.checked)} /> Permitir inscrição em dias isolados?</label>
                {turno.permite_dias && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Preço por Dia (€):</label>
                    <input type="number" required={turno.permite_dias} value={turno.preco_dia || 0} onChange={e => handleTurnoChange(index, 'preco_dia', Number(e.target.value))} style={{ ...inputStyle, width: '100px', padding: '0.5rem' }} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* DESCONTOS GERAIS */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '2px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Códigos de Desconto (Opcional)</h2>
              <button type="button" onClick={handleAddDesconto} style={{ backgroundColor: '#f1f5f9', color: '#059669', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>+ Adicionar Desconto</button>
            </div>
            
            {descontos.map((desc, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
                <div style={{ flex: '1 1 200px' }}><label style={labelStyle}>Nome / Título (ex: Early Bird)</label><input type="text" value={desc.nome} onChange={e => handleDescontoChange(idx, 'nome', e.target.value)} style={inputStyle} placeholder="Nome do Desconto" /></div>
                <div style={{ width: '120px' }}><label style={labelStyle}>Valor</label><input type="number" value={desc.valor} onChange={e => handleDescontoChange(idx, 'valor', Number(e.target.value))} style={inputStyle} /></div>
                <div style={{ width: '150px' }}><label style={labelStyle}>Tipo</label><select value={desc.tipo} onChange={e => handleDescontoChange(idx, 'tipo', e.target.value)} style={selectStyle}><option value="percentagem">Percentagem (%)</option><option value="fixo">Fixo (€)</option></select></div>
                <button type="button" onClick={() => handleRemoveDesconto(idx)} style={{ padding: '0.875rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Remover</button>
              </div>
            ))}
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>4. Programa e Condições</h2>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Alimentação</label><select value={formData.alimentacao || ''} onChange={e => setFormData({...formData, alimentacao: e.target.value})} style={selectStyle}><option value="Incluído no Preço">Incluído no Preço</option><option value="Opcional (Pago à parte)">Opcional</option><option value="Não tem">Não tem</option></select></div>
            <div><label style={labelStyle}>Alojamento</label><select value={formData.alojamento || ''} onChange={e => setFormData({...formData, alojamento: e.target.value})} style={selectStyle}><option value="Incluído no Preço">Incluído no Preço</option><option value="Opcional (Pago à parte)">Opcional</option><option value="Não tem">Não tem</option></select></div>
            <div><label style={labelStyle}>Seguro</label><select value={formData.seguro || ''} onChange={e => setFormData({...formData, seguro: e.target.value})} style={selectStyle}><option value="Incluído no Preço">Incluído</option><option value="Pago à parte no local">Pago no local</option></select></div>
            <div><label style={labelStyle}>Rácio Monitores</label><input type="text" value={formData.racio_monitores || ''} onChange={e => setFormData({...formData, racio_monitores: e.target.value})} style={inputStyle} /></div>
            
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Descrição Completa</label><textarea rows={5} required value={formData.descricao || ''} onChange={e => setFormData({...formData, descricao: e.target.value})} style={{...inputStyle, resize: 'vertical'}} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Regras e Termos</label><textarea rows={4} value={formData.regras_termos || ''} onChange={e => setFormData({...formData, regras_termos: e.target.value})} style={{...inputStyle, resize: 'vertical'}} /></div>

            {/* DOCUMENTOS */}
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
              <label style={labelStyle}>Programa do Campo (PDF/Word)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                {documentosExistentes.map((doc, idx) => (
                  <div key={`exist-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', width: '100%', fontSize: '13px' }}><span style={{ fontWeight: 'bold' }}>📄 {doc.nome} (Atual)</span><button type="button" onClick={() => removeDocExistente(idx)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button></div>
                ))}
                {documentos.map((doc, idx) => (
                  <div key={`novo-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', width: '100%', fontSize: '13px' }}><span style={{ fontWeight: 'bold', color: '#059669' }}>📄 {doc.name} (Novo)</span><button type="button" onClick={() => removeNovoDoc(idx)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button></div>
                ))}
                <label style={{ padding: '0.75rem 1.5rem', backgroundColor: '#e2e8f0', color: '#334155', fontWeight: 'bold', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '14px' }}>+ Anexar Documento <input type="file" accept=".pdf,.doc,.docx" multiple onChange={handleDocSelect} style={{ display: 'none' }} /></label>
              </div>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}><h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>5. Custos Opcionais Extras (€)</h2></div>
          <div style={gridStyle}>
            {['alimentacao', 'alojamento', 'prolongamento', 'transporte'].map(extra => (
              <div key={extra} style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                <label style={labelStyle}>{extra.charAt(0).toUpperCase() + extra.slice(1)} Extra</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="number" value={(formData as any)[`extra_${extra}`] || 0} onChange={e => setFormData({...formData, [`extra_${extra}`]: Number(e.target.value)})} style={{...inputStyle, flex: 1}} />
                  <select value={(formData as any)[`tipo_cobranca_${extra}`] || ''} onChange={e => setFormData({...formData, [`tipo_cobranca_${extra}`]: e.target.value})} style={{...selectStyle, flex: 1}}><option value="Por Turno">Por Turno</option><option value="Por Dia">Por Dia</option></select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>6. Galeria</h2>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Opção A: Escolher Padrão</p>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {FOTOS_PADRAO.map((foto, idx) => (
                <div key={idx} onClick={() => selecionarFotoPadrao(foto.url)} style={{ minWidth: '120px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden', border: images[0]?.url === foto.url ? '3px solid #059669' : '1px solid #cbd5e1', cursor: 'pointer', position: 'relative' }}>
                  <img src={foto.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {images[0]?.url === foto.url && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 150, 105, 0.2)' }} />}
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 'bold', margin: '1.5rem 0', fontSize: '12px' }}>OU</div>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', cursor: 'pointer', backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '0.75rem' }}><span style={{ fontWeight: 'bold', color: '#64748b' }}>📸 Clique para enviar fotos...</span><input type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ display: 'none' }} /></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            {images.map((img, idx) => (
              <div key={idx} style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', border: img.isMain ? '3px solid #059669' : '1px solid #e2e8f0', height: '120px' }}>
                <img src={img.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: '5px', right: '5px', background: '#dc2626', color: 'white', borderRadius: '50%', width: '24px', height: '24px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                {!img.isMain && <button type="button" onClick={() => setMainImage(idx)} style={{ position: 'absolute', bottom: '5px', left: '5px', right: '5px', background: 'rgba(15,23,42,0.85)', color: 'white', fontSize: '11px', padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Principal</button>}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} style={{ padding: '1.25rem', backgroundColor: '#0f172a', color: 'white', fontWeight: '900', borderRadius: '0.75rem', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1.125rem' }}>
          {saving ? statusText : 'Guardar Alterações (HQ)'}
        </button>
      </form>
    </main>
  );
}

// ESTILOS GERAIS
const sectionStyle = { backgroundColor: 'white', padding: '2.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const sectionTitleStyle = { fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '2rem' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' };
const inputStyle = { width: '100%', padding: '0.875rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '15px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' as const };
const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' };
const checkboxLabelStyle = { display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '14px', color: '#334155', cursor: 'pointer', fontWeight: '600' };
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Utilize a service role key no .env para garantir permissões de escrita

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function traduzir(texto: string): Promise<string> {
  if (!texto) return "";
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=pt|en`);
    const data = await res.json();
    return data.responseData.translatedText || texto;
  } catch (e) {
    return texto;
  }
}

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID do campo em falta" }, { status: 400 });

    // 1. Procura os dados originais em Português
    const { data: campo, error: fetchError } = await supabase.from("campos").select("*").eq("id", id).single();
    if (fetchError || !campo) return NextResponse.json({ error: "Campo não encontrado" }, { status: 404 });

    // 2. Executa as traduções em segundo plano no servidor
    const [
      nome_en, categoria_en, local_en, idade_en, descricao_en,
      alimentacao_en, alojamento_en, seguro_en, Distrito_en, regras_termos_en, politica_cancelamento_en
    ] = await Promise.all([
      traduzir(campo.nome), traduzir(campo.categoria), traduzir(campo.local),
      traduzir(campo.idade), traduzir(campo.descricao), traduzir(campo.alimentacao),
      traduzir(campo.alojamento), traduzir(campo.seguro), traduzir(campo.Distrito),
      traduzir(campo.regras_termos), traduzir(campo.politica_cancelamento)
    ]);

    // Tradução dos turnos
    let turnos_en = [];
    if (campo.turnos && Array.isArray(campo.turnos)) {
      turnos_en = await Promise.all(campo.turnos.map(async (t: any) => ({
        ...t,
        nome: await traduzir(t.nome)
      })));
    }

    // Tradução das perguntas customizadas
    let perguntasCustomizadasEn = [];
    if (campo.perguntas_customizadas && Array.isArray(campo.perguntas_customizadas)) {
      perguntasCustomizadasEn = await Promise.all(campo.perguntas_customizadas.map(async (p: string) => await traduzir(p)));
    }

    const textoDatasEn = campo.datas_disponiveis ? campo.datas_disponiveis.replace(/ a /g, " to ") : "";

    // 3. Atualiza as colunas de inglês na base de dados
    await supabase.from("campos").update({
      nome_en, categoria_en, local_en, idade_en, descricao_en,
      alimentacao_en, alojamento_en, seguro_en, Distrito_en,
      regras_termos_en, politica_cancelamento_en, turnos_en,
      perguntas_customizadas_en: perguntasCustomizadasEn,
      datas_disponiveis_en: textoDatasEn,
      pais_en: campo.pais === "Portugal" ? "Portugal" : "International"
    }).eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
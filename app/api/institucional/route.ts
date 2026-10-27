import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Usa a Service Role Key para ignorar qualquer bloqueio de RLS na tabela institucional_iniciativas
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const distrito = searchParams.get("distrito");

    // 1. Se pedir uma iniciativa específica por ID
    if (id) {
      const { data, error } = await supabaseAdmin
        .from("institucional_iniciativas")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return NextResponse.json({ data });
    }

    // 2. Lista todas as iniciativas ativas
    let query = supabaseAdmin
      .from("institucional_iniciativas")
      .select("*")
      .order("distrito", { ascending: true })
      .order("concelho", { ascending: true });

    if (distrito) {
      query = query.ilike("distrito", `%${distrito}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const ativas = (data || []).filter((item: any) => item.is_active !== false);
    return NextResponse.json({ data: ativas });
  } catch (err: any) {
    console.error("Erro na API /api/institucional:", err);
    return NextResponse.json(
      { error: err.message, data: [] },
      { status: 500 }
    );
  }
}
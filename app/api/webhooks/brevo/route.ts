import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Opcional: Verificação de Segurança
    const tokenHeader = req.headers.get("auth-token");
    const secret = process.env.BREVO_WEBHOOK_SECRET;

    if (secret && tokenHeader !== secret) {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

    const payload = await req.json();

    // 2. Extrair dados da Brevo
    const eventType = payload.event; 
    // Na Brevo, tags vêm como array. A primeira (index 0) é o broadcastId que injetamos na rota de envio.
    const broadcastId = payload.tags && payload.tags.length > 0 ? payload.tags[0] : null;

    if (!broadcastId) {
      return NextResponse.json({ message: "Evento ignorado: Tag não encontrada." }, { status: 200 });
    }

    // 3. Mapear os eventos para as colunas
    let updateField = '';
    if (eventType === 'delivered') updateField = 'total_entregues';
    else if (eventType === 'opened' || eventType === 'unique_opened') updateField = 'total_abertos';
    else if (eventType === 'click') updateField = 'total_cliques';
    else if (['bounced', 'hardBounced', 'softBounced', 'spam', 'invalid', 'blocked', 'deferred'].includes(eventType)) {
      updateField = 'total_falhas';
    }

    // 4. Atualizar a base de dados
    if (updateField) {
      const { data: campanha, error: fetchError } = await supabaseAdmin
        .from('email_broadcasts')
        .select(updateField)
        .eq('id', broadcastId)
        .single();

      if (!fetchError && campanha) {
        const valorAtual = (campanha as Record<string, any>)?.[updateField] || 0;
        
        await supabaseAdmin
          .from('email_broadcasts')
          .update({ [updateField]: valorAtual + 1 })
          .eq('id', broadcastId);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err: any) {
    console.error("Erro no Webhook da Brevo:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
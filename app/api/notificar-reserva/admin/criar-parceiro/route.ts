import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Faltam variáveis SUPABASE_SERVICE_ROLE_KEY no servidor." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. CRIAR NOVO PARCEIRO
    if (action === "create") {
      const {
        email,
        password,
        nome_completo,
        empresa_nome,
        nif_empresa,
        telefone,
        taxa_comissao,
        base_comissao,
        modalidade_reserva,
        status_contrato,
      } = body;

      const cleanEmail = email.trim().toLowerCase();

      const { data: userData, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: {
            nome_completo,
            empresa_nome,
            role: "organizador",
          },
        });

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 400 }
        );
      }

      const userId = userData.user.id;

      const { error: perfilError } = await supabaseAdmin.from("perfis").upsert({
        id: userId,
        email: cleanEmail,
        email_publico: cleanEmail,
        nome_completo: nome_completo || empresa_nome || "Parceiro",
        empresa_nome: empresa_nome || nome_completo || "Parceiro",
        nome_empresa: empresa_nome || nome_completo || "Parceiro",
        nome: empresa_nome || nome_completo || "Parceiro",
        nif_empresa: nif_empresa || null,
        telefone: telefone || null,
        telefone_publico: telefone || null,
        role: "organizador",
        taxa_comissao: Number(taxa_comissao) || 12,
        base_comissao: base_comissao || "total",
        modalidade_reserva: modalidade_reserva || "direta",
        status_contrato: status_contrato || "Preparação HQ",
        parceiro_verificado: status_contrato === "Aprovado",
        verificado: status_contrato === "Aprovado",
      });

      if (perfilError) {
        return NextResponse.json(
          { error: perfilError.message },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, user: userData.user });
    }

    // 2. REDEFINIR PASSWORD MANUALMENTE
    if (action === "reset_password") {
      const { id, password } = body;
      const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    // 3. ENVIAR E-MAIL DE ONBOARDING COM PRÉ-VISUALIZAÇÃO DOS CAMPOS E CONTRATO
    if (action === "send_onboarding_email") {
      const { email, assunto, texto, empresa, parceiroId, campos = [], lang = "pt" } = body;
      const resendKey = process.env.RESEND_API_KEY;

      if (!resendKey) {
        return NextResponse.json(
          {
            error:
              "A variável RESEND_API_KEY não está configurada. Utilize o botão 'Abrir no App de E-mail' ou 'Enviar WhatsApp'.",
          },
          { status: 400 }
        );
      }

      const linkContrato = parceiroId
        ? `https://www.hellocamp.pt/${lang}/assinatura-contrato/${parceiroId}`
        : `https://www.hellocamp.pt/${lang}/login`;

      const botoesCamposHtml = Array.isArray(campos) && campos.length > 0
        ? `<div style="margin-top: 20px; padding: 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px;">
            <p style="margin: 0 0 12px 0; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: #0F172A;">
              🏕️ Acesso Direto aos Seus Programas (Modo Visão Admin):
            </p>
            ${campos
              .map(
                (c: any) =>
                  `<div style="margin-bottom: 8px;">
                    <a href="https://www.hellocamp.pt/${lang}/campo/${c.id}?preview=admin" target="_blank" style="display: inline-block; background: #2563EB; color: #FFFFFF; text-decoration: none; font-size: 12px; font-weight: 800; padding: 8px 14px; border-radius: 6px;">
                      👁️ Ver Campo: ${c.nome} &rarr;
                    </a>
                  </div>`
              )
              .join("")}
          </div>`
        : "";

      const htmlFormatado = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden; color: #0F172A;">
          <div style="background: #0F172A; padding: 24px 28px; color: #FFFFFF;">
            <span style="display: inline-block; background: #F59E0B; color: #FFFFFF; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 10px; border-radius: 4px; margin-bottom: 8px;">
              Portal de Parceiros HelloCamp
            </span>
            <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #FFFFFF;">
              ${empresa || "Parceiro Oficial HelloCamp"}
            </h1>
          </div>

          <div style="padding: 28px;">
            <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.65; color: #1E293B;">${texto}</div>

            ${botoesCamposHtml}

            <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #E2E8F0; text-align: center;">
              <a href="${linkContrato}" target="_blank" style="display: inline-block; background: #16A34A; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; padding: 14px 28px; border-radius: 6px;">
                ✍️ Rever Contrato & Definir Password
              </a>
            </div>
          </div>

          <div style="background: #F8FAFC; padding: 16px 28px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B; text-align: center;">
            HelloCamp Portugal • Plataforma Oficial de Campos de Férias e Atividades Juvenis • <a href="https://www.hellocamp.pt" style="color: #2563EB; text-decoration: none; font-weight: 700;">www.hellocamp.pt</a>
          </div>
        </div>
      `;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "HelloCamp Parceiros <parceiros@hellocamp.pt>",
          to: [email],
          subject: assunto,
          html: htmlFormatado,
          text: texto,
        }),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        return NextResponse.json(
          { error: resendData?.message || "Erro ao enviar via Resend." },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, id: resendData.id });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
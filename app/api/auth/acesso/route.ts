import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, newPassword, lang = "pt" } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Falta SUPABASE_SERVICE_ROLE_KEY no ficheiro .env.local." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) {
      return NextResponse.json(
        { error: "Por favor, introduza um endereço de e-mail válido." },
        { status: 400 }
      );
    }

    // 1. Procurar se o utilizador existe na tabela perfis e em auth.users
    const { data: perfil } = await supabaseAdmin
      .from("perfis")
      .select("id, nome_completo, empresa_nome, role, is_superadmin")
      .ilike("email", cleanEmail)
      .maybeSingle();

    const { data: listUsersData } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    const authUser = listUsersData?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    // =========================================================================
    // AÇÃO 1: ENVIAR MAGIC LINK INSTANTÂNEO VIA RESEND (OU GERAR LINK DE ACESSO)
    // =========================================================================
    if (action === "magic_link") {
      // Se o perfil existir na tabela `perfis` mas ainda não existir em `auth.users`, cria-o oficialmente!
      if (!authUser && perfil) {
        await supabaseAdmin.auth.admin.createUser({
          id: perfil.id,
          email: cleanEmail,
          password: "HelloCamp2026!",
          email_confirm: true,
          user_metadata: {
            nome_completo: perfil.nome_completo || perfil.empresa_nome || "",
            role: perfil.role || "cliente",
          },
        });
      }

      const origin =
        req.headers.get("origin") || "https://www.hellocamp.pt";

      let destinoFinal = `${origin}/${lang}/cliente/dashboard`;
      if (perfil?.is_superadmin) {
        destinoFinal = `${origin}/${lang}/superadmin/parceiros`;
      } else if (perfil?.role === "organizador") {
        destinoFinal = `${origin}/${lang}/admin/dashboard`;
      } else if (perfil?.role === "monitor") {
        destinoFinal = `${origin}/${lang}/monitores/portal/perfil`;
      }

      const { data: linkData, error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email: cleanEmail,
          options: {
            redirectTo: destinoFinal,
          },
        });

      if (linkError || !linkData?.properties?.action_link) {
        return NextResponse.json(
          {
            error:
              linkError?.message ||
              "Não foi possível gerar o link mágico para este e-mail.",
          },
          { status: 400 }
        );
      }

      const magicUrl = linkData.properties.action_link;

      // Enviar via Resend para chegar em 1 segundo!
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: "HelloCamp Acesso <info@hellocamp.pt>",
          to: cleanEmail,
          subject:
            lang === "en"
              ? "✨ Your Instant Login Link - HelloCamp"
              : "✨ O Seu Link de Acesso Direto - HelloCamp",
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
              <div style="background: #0F172A; padding: 24px; text-align: center; border-bottom: 4px solid #F59E0B;">
                <span style="font-size: 26px; font-weight: 900; color: #ffffff;">Hello</span><span style="font-size: 26px; font-weight: 900; color: #F59E0B;">Camp</span>
              </div>
              <div style="padding: 32px 24px; color: #0F172A; line-height: 1.6;">
                <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 900;">
                  ${
                    lang === "en"
                      ? "Instant Access to Your Account"
                      : "Acesso Direto à Sua Conta HelloCamp"
                  }
                </h2>
                <p style="font-size: 14px; color: #475569; margin: 0 0 24px 0;">
                  ${
                    lang === "en"
                      ? "Click the button below to sign in immediately without typing a password:"
                      : "Clique no botão abaixo para entrar imediatamente na sua conta sem precisar de palavra-passe:"
                  }
                </p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${magicUrl}" style="display: inline-block; background: #2563EB; color: #ffffff; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; padding: 16px 32px; border-radius: 6px; text-decoration: none;">
                    ${
                      lang === "en"
                        ? "Sign In Now →"
                        : "Entrar na Minha Conta Agora →"
                    }
                  </a>
                </div>
                <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; word-break: break-all;">
                  Link direto: ${magicUrl}
                </p>
              </div>
            </div>
          `,
        });
      }

      return NextResponse.json({
        success: true,
        sentViaResend: Boolean(resendApiKey),
      });
    }

    // =========================================================================
    // AÇÃO 2: REPARAR E SINCRONIZAR CONTA / PASSWORD PELA API OFICIAL DO SUPABASE
    // =========================================================================
    if (action === "sync_repair_account") {
      const passToSet =
        newPassword && newPassword.length >= 6
          ? newPassword.trim()
          : "HelloCamp2026!";

      if (authUser) {
        // Atualiza oficialmente via GoTrue Admin API (cria o hash bcrypt nativo e repara identidades!)
        const { error: updErr } =
          await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            email: cleanEmail,
            password: passToSet,
            email_confirm: true,
            user_metadata: {
              ...authUser.user_metadata,
              role: perfil?.role || authUser.user_metadata?.role || "organizador",
            },
          });

        if (updErr) {
          return NextResponse.json({ error: updErr.message }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          userId: authUser.id,
          message: "Conta sincronizada oficialmente na API Auth do Supabase.",
        });
      } else if (perfil) {
        // O perfil existia em `public.perfis` mas não tinha utilizador em `auth.users`!
        const { data: created, error: createErr } =
          await supabaseAdmin.auth.admin.createUser({
            id: perfil.id,
            email: cleanEmail,
            password: passToSet,
            email_confirm: true,
            user_metadata: {
              nome_completo:
                perfil.nome_completo || perfil.empresa_nome || "Utilizador",
              role: perfil.role || "organizador",
            },
          });

        if (createErr) {
          return NextResponse.json(
            { error: createErr.message },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          userId: created.user?.id,
          message: "Conta criada e sincronizada com o perfil existente.",
        });
      } else {
        return NextResponse.json(
          {
            error:
              "Não foi encontrada nenhuma conta registada com este endereço de e-mail.",
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
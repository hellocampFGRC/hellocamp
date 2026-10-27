import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      action = "create",
      id,
      email,
      password,
      nome_completo,
      empresa_nome,
      nif_empresa,
      telefone,
      taxa_comissao = 12,
      base_comissao = "total",
      modalidade_reserva = "direta",
      status_contrato = "Sem Contrato",
    } = body;

    // AÇÃO 1: DEFINIR NOVA PASSWORD DIRETAMENTE PELO SUPERADMIN
    if (action === "reset_password") {
      if (!id || !password || password.length < 6) {
        return NextResponse.json(
          { error: "ID e nova password (mín. 6 caracteres) são obrigatórios." },
          { status: 400 }
        );
      }

      const { error: updateAuthErr } =
        await supabaseAdmin.auth.admin.updateUserById(id, {
          password: password,
          email_confirm: true,
        });

      if (updateAuthErr) throw updateAuthErr;
      return NextResponse.json({ success: true });
    }

    // AÇÃO 2: CRIAR NOVO PARCEIRO MANUALMENTE (SEM TERMINAR SESSÃO DO SUPERADMIN)
    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e password são obrigatórios." },
        { status: 400 }
      );
    }

    const emailLimpo = email.trim().toLowerCase();

    // 1. Cria a conta no sistema de Autenticação com email_confirm: true
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: emailLimpo,
        password: password,
        email_confirm: true,
        user_metadata: {
          nome_completo: nome_completo || empresa_nome || "Organizador",
          empresa_nome: empresa_nome || null,
          role: "organizador",
        },
      });

    if (authError) throw authError;

    // 2. Cria/Atualiza o perfil completo na tabela 'perfis'
    if (authData.user) {
      const { error: perfilErr } = await supabaseAdmin.from("perfis").upsert({
        id: authData.user.id,
        email: emailLimpo,
        role: "organizador",
        nome_completo: nome_completo || null,
        empresa_nome: empresa_nome || null,
        nif_empresa: nif_empresa || null,
        telefone: telefone || null,
        taxa_comissao: Number(taxa_comissao) || 12,
        base_comissao: base_comissao || "total",
        modalidade_reserva: modalidade_reserva || "direta",
        status_contrato: status_contrato || "Sem Contrato",
        parceiro_verificado: status_contrato === "Aprovado",
      });

      if (perfilErr) throw perfilErr;
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error: any) {
    console.error("Erro na API criar-parceiro:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
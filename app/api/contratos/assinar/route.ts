import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Configuração SUPABASE_SERVICE_ROLE_KEY em falta no servidor." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const formData = await req.formData();
    const id = (formData.get("id") as string | null)?.trim() || "";
    const emailFromForm =
      ((formData.get("emailAcesso") || formData.get("email")) as string | null)?.trim() || "";
    const passwordNova = (formData.get("passwordNova") as string | null) || "";
    const contratoDadosStr = (formData.get("contratoDados") as string | null) || "";
    const lang = ((formData.get("lang") as string | null) || "pt").toLowerCase();
    const pdfFile = formData.get("pdf") as File | null;

    // 1. Verificar exatamente que parâmetro possa estar em falta
    const faltam: string[] = [];
    if (!id) faltam.push("ID do Parceiro");
    if (!contratoDadosStr) faltam.push("Dados do Contrato");
    if (!pdfFile) faltam.push("Ficheiro PDF do Contrato");

    if (faltam.length > 0) {
      return NextResponse.json(
        {
          error: `Dados incompletos submetidos no formulário. Em falta: ${faltam.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const contratoDados = JSON.parse(contratoDadosStr);

    // 2. Carregar o perfil na base de dados
    const { data: perfil, error: fetchError } = await supabaseAdmin
      .from("perfis")
      .select("email, email_publico, contrato_dados, taxa_comissao, base_comissao")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !perfil) {
      return NextResponse.json(
        { error: "Perfil de parceiro não encontrado na base de dados." },
        { status: 404 }
      );
    }

    // Determinar o e-mail final com fallback seguro
    const emailFinal = (
      contratoDados.emailContacto ||
      emailFromForm ||
      perfil.email ||
      perfil.email_publico ||
      ""
    )
      .trim()
      .toLowerCase();

    if (!emailFinal) {
      return NextResponse.json(
        { error: "Falta indicar o E-mail Comercial / Login no formulário." },
        { status: 400 }
      );
    }

    // 3. Se foi definida uma nova password (fluxo de Onboarding), atualiza ou cria o utilizador em auth.users
    let loginReady = false;
    if (passwordNova && passwordNova.length >= 6) {
      const { error: updateErr } =
        await supabaseAdmin.auth.admin.updateUserById(id, {
          email: emailFinal,
          password: passwordNova,
          email_confirm: true,
          user_metadata: {
            role: "organizador",
            empresa_nome:
              contratoDados.empresaNome || contratoDados.nomeEmpresa || "",
          },
        });

      if (!updateErr) {
        loginReady = true;
      } else {
        const { error: createErr } =
          await supabaseAdmin.auth.admin.createUser({
            id,
            email: emailFinal,
            password: passwordNova,
            email_confirm: true,
            user_metadata: {
              role: "organizador",
              empresa_nome:
                contratoDados.empresaNome || contratoDados.nomeEmpresa || "",
            },
          });

        if (!createErr) {
          loginReady = true;
        } else {
          // Fallback via RPC se existir
          const { error: rpcError } = await supabaseAdmin.rpc(
            "admin_set_partner_password",
            {
              target_user_id: id,
              new_password: passwordNova,
              target_email: emailFinal,
            }
          );
          if (!rpcError) loginReady = true;
        }
      }
    }

    // 4. Upload do Documento PDF assinado para o Storage
    const fileName = `contrato_global_${id}_${Date.now()}.pdf`;
    const arrayBuffer = await pdfFile!.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let contratoUrl = `https://www.hellocamp.pt/${lang}/assinatura-contrato/${id}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("campos-documentos")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (!uploadError) {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from("campos-documentos")
        .getPublicUrl(fileName);
      if (publicUrlData?.publicUrl) {
        contratoUrl = publicUrlData.publicUrl;
      }
    } else {
      console.warn(
        "Aviso Storage campos-documentos:",
        uploadError.message
      );
    }

    const nomeEmpresaFinal =
      contratoDados.empresaNome ||
      contratoDados.nomeEmpresa ||
      "Parceiro HelloCamp";
    const taxaFinal =
      contratoDados.taxaComissao ?? perfil.taxa_comissao ?? 12;
    const baseFinal =
      contratoDados.baseComissao || perfil.base_comissao || "total";

    // 5. Atualizar a Tabela 'perfis' com Aprovação e Dados Fiscais Completos
    const { error: updatePerfilError } = await supabaseAdmin
      .from("perfis")
      .update({
        email: emailFinal,
        email_publico: contratoDados.emailReservas || emailFinal,
        role: "organizador",
        empresa_nome: nomeEmpresaFinal,
        nome_empresa: nomeEmpresaFinal,
        nome: nomeEmpresaFinal,
        nif_empresa: contratoDados.nif || null,
        nome_completo:
          contratoDados.pessoaContacto ||
          contratoDados.assinaturaNome ||
          nomeEmpresaFinal,
        telefone: contratoDados.telefone || null,
        telefone_publico: contratoDados.telefone || null,
        morada_sede: contratoDados.morada || null,
        website: contratoDados.website || null,
        status_contrato: "Aprovado",
        parceiro_verificado: true,
        verificado: true,
        contrato_dados: contratoDados,
        taxa_comissao: taxaFinal,
        base_comissao: baseFinal,
        modalidade_reserva: contratoDados.modalidadeReserva || "direta",
        link_externo_reserva:
          contratoDados.modalidadeReserva === "link_externo"
            ? contratoDados.linkExternoReserva
            : null,
      })
      .eq("id", id);

    if (updatePerfilError) {
      throw new Error(
        `Erro ao atualizar perfil: ${updatePerfilError.message}`
      );
    }

    // 6. Ativar todos os campos associados ao organizador
    await supabaseAdmin
      .from("campos")
      .update({
        status_aprovacao: "Aprovado",
        ativo: true,
        contrato_dados: contratoDados,
        contrato_parceiro_url: contratoUrl,
        taxa_comissao: taxaFinal,
        base_comissao: baseFinal,
        modalidade_reserva: contratoDados.modalidadeReserva || "direta",
        link_externo_reserva:
          contratoDados.modalidadeReserva === "link_externo"
            ? contratoDados.linkExternoReserva
            : null,
        tipo_pagamento:
          contratoDados.modalidadeReserva !== "link_externo"
            ? contratoDados.tipoPagamento ||
              contratoDados.tipo_pagamento ||
              "100_total"
            : null,
        politica_cancelamento:
          contratoDados.modalidadeReserva !== "link_externo"
            ? contratoDados.politicaCancelamento ||
              contratoDados.politica_cancelamento ||
              "Moderada (Reembolso a 50% até 15 dias antes)"
            : null,
      })
      .eq("organizador_id", id);

    return NextResponse.json({
      success: true,
      url: contratoUrl,
      loginReady,
    });
  } catch (error: any) {
    console.error("Erro na API Assinar Contrato:", error.message);
    return NextResponse.json(
      { error: error.message || "Erro interno ao assinar contrato." },
      { status: 500 }
    );
  }
}
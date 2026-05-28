import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Usamos a chave secreta para ter poderes absolutos na Base de Dados
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, password, empresa_nome } = await req.json();
    
    // 1. Cria a conta no sistema de Autenticação
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Valida o email automaticamente
    });

    if (authError) throw authError;

    // 2. Atualiza o perfil criado com o nome da empresa
    if (authData.user) {
       await supabaseAdmin.from('perfis').update({ 
         empresa_nome: empresa_nome 
       }).eq('id', authData.user.id);
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
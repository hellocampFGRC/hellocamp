import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Opcional, se precisar de ir buscar mais dados à BD

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // 1. Extrair os dados recebidos do Checkout
    const { emailPai, organizadorId, campoNome, criancas, turno, total, dias } = data;

    // Se precisar de ir buscar o e-mail real do organizador de forma segura ao Supabase Admin
    // const { data: orgAuth } = await supabaseAdmin.auth.admin.getUserById(organizadorId);
    // const emailCampo = orgAuth.user.email;
    const emailCampo = 'email-do-parceiro@exemplo.com'; // Exemplo
    const emailHelloCamp = 'info@hellocamp.pt';

    // 2. Lógica de Envio de E-mail (Exemplo genérico)
    // Aqui entra o código do Mailgun / Resend / SendGrid
    console.log(`A enviar e-mails de confirmação da reserva do campo ${campoNome}`);
    console.log(`Para o Pai: ${emailPai}`);
    console.log(`Para o Parceiro: ${emailCampo}`);
    console.log(`Para a Admin: ${emailHelloCamp}`);

    // Exemplo de payload para o Mailgun ou outra API:
    /*
    await fetch('https://api.mailgun.net/v3/SUA-URL/messages', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${btoa(`api:SUA-CHAVE-API`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            from: 'HelloCamp <reservas@hellocamp.pt>',
            to: `${emailPai}, ${emailCampo}, ${emailHelloCamp}`,
            subject: `Nova Reserva Confirmada: ${campoNome}`,
            text: `Uma nova reserva foi feita!\nCrianças: ${criancas}\nTurno: ${turno} (${dias} dias)\nTotal: ${total}€`
        })
    });
    */

    return NextResponse.json({ success: true, message: 'Emails disparados com sucesso' });
  } catch (error: any) {
    console.error('Erro ao enviar e-mails:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
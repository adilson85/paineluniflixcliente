import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || '';

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type',
      },
    });
  }

  try {
    const { paymentId } = await req.json();

    console.log('🔍 Consultando pagamento:', paymentId);

    // Consultar pagamento no Mercado Pago
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const payment = await mpResponse.json();

    console.log('📥 Resposta do Mercado Pago:', JSON.stringify(payment, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentId,
        status: payment.status,
        status_detail: payment.status_detail,
        date_approved: payment.date_approved,
        transaction_amount: payment.transaction_amount,
        full_response: payment,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

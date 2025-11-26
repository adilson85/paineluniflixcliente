import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log('🚀 Iniciando create-payment-preference');

    // ============================
    // 1) Supabase Admin Client
    // ============================
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // ============================
    // 2) Body da requisição
    // ============================
    const body = await req.json();
    console.log('📦 Body recebido:', {
      hasTransactionId: !!body.transactionId,
      hasUserId: !!body.userId,
      amount: body.amount,
      paymentMethod: body.paymentMethod
    });

    const { transactionId, userId, amount, description, paymentMethod, metadata } = body;

    if (!transactionId || !userId || !amount || !description) {
      throw new Error('Parâmetros obrigatórios faltando');
    }

    // ============================
    // 3) Token Mercado Pago
    // ============================
    const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoAccessToken) {
      throw new Error('Token do Mercado Pago não configurado (MERCADO_PAGO_ACCESS_TOKEN)');
    }

    // ============================
    // 4) Dados do usuário
    // ============================
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('full_name, email, phone')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
    }

    // ============================
    // 5) URLs de retorno (FRONT)
    // ============================
    // URL pública do painel do cliente
    const baseUrl = Deno.env.get('CLIENT_URL') ?? 'https://unflix-painelcliente.netlify.app';

    const backUrls = {
      success: `${baseUrl}/payment-success?transaction_id=${transactionId}`,
      failure: `${baseUrl}/payment-failure?transaction_id=${transactionId}`,
      pending: `${baseUrl}/payment-success?transaction_id=${transactionId}`
    };

    // ============================
    // 6) URL do webhook (Edge Function)
    // ============================
    const projectRef = Deno.env.get('SUPABASE_PROJECT_REF') ?? 'uilmijiiaqkhstoaifpj';
    const functionsBaseUrl = `https://${projectRef}.functions.supabase.co`;

    // ============================
    // 7) Monta preferenceData
    // ============================
    const preferenceData: any = {
      items: [
        {
          id: transactionId,
          title: description,
          description: description,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amount
        }
      ],
      payer: {
        name: user?.full_name || '',
        email: user?.email || '',
        phone: {
          number: user?.phone || ''
        }
      },
      back_urls: backUrls,
      auto_return: 'approved',
      external_reference: transactionId,
      notification_url: `${functionsBaseUrl}/mercadopago-webhook`,
      metadata: {
        transaction_id: transactionId,
        user_id: userId,
        payment_method: paymentMethod,
        ...metadata
      },
      payment_methods: {
        excluded_payment_types: [] as { id: string }[],
        installments: paymentMethod === 'credit_card' ? 12 : 1
      }
    };

    // ============================
    // 8) Regras por método de pagamento
    // ============================
    if (paymentMethod === 'pix') {
      preferenceData.payment_methods.excluded_payment_types = [
        { id: 'credit_card' },
        { id: 'debit_card' },
        { id: 'ticket' }
      ];
    } else if (paymentMethod === 'credit_card') {
      preferenceData.payment_methods.excluded_payment_types = [
        { id: 'ticket' }
      ];
    } else if (paymentMethod === 'boleto') {
      preferenceData.payment_methods.excluded_payment_types = [
        { id: 'credit_card' },
        { id: 'debit_card' }
      ];
    }

    console.log('📦 Criando preferência no Mercado Pago:', {
      transactionId,
      amount,
      paymentMethod,
      backUrls
    });

    // ============================
    // 9) Chamada à API do Mercado Pago
    // ============================
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mercadoPagoAccessToken}`
      },
      body: JSON.stringify(preferenceData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro do Mercado Pago - Status:', response.status);
      console.error('❌ Erro do Mercado Pago - Resposta completa:', errorText);
      
      let parsed = null;
      try {
        parsed = JSON.parse(errorText);
        console.error('❌ Erro do Mercado Pago (JSON):', JSON.stringify(parsed, null, 2));
      } catch {
        console.error('❌ Erro do Mercado Pago (texto):', errorText);
      }
      
      // Monta mensagem de erro detalhada
      let mpMessage = 'Erro desconhecido no Mercado Pago';
      if (parsed) {
        if (parsed.message) {
          mpMessage = parsed.message;
        } else if (parsed.error) {
          mpMessage = parsed.error;
        }
        
        // Adiciona detalhes de cause se existir
        if (parsed.cause && Array.isArray(parsed.cause)) {
          const causes = parsed.cause.map((c: any) => c.description || c.message || c.code).filter(Boolean);
          if (causes.length > 0) {
            mpMessage += `: ${causes.join(', ')}`;
          }
        }
      } else {
        mpMessage = errorText.substring(0, 200);
      }
      
      // Retorna erro com detalhes completos
      return new Response(
        JSON.stringify({
          success: false,
          error: `Mercado Pago: ${mpMessage}`,
          mp_status: response.status,
          mp_response: parsed || errorText.substring(0, 500)
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 400
        }
      );
    }

    const preference = await response.json();
    console.log('✅ Preferência criada com sucesso:', {
      id: preference.id,
      has_init_point: !!preference.init_point,
      has_sandbox_init_point: !!preference.sandbox_init_point
    });

    // ============================
    // 10) Resposta OK p/ o front
    // ============================
    return new Response(
      JSON.stringify({
        success: true,
        preference: {
          id: preference.id,
          init_point: preference.init_point,
          sandbox_init_point: preference.sandbox_init_point
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro na Edge Function:', error);
    const message = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});

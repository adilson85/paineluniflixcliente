/**
 * Edge Function do Supabase para criar preferências de pagamento no Mercado Pago
 *
 * Esta função protege o Access Token do Mercado Pago, mantendo-o apenas no backend.
 * Também valida os dados antes de criar a preferência.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:3050';

// Extrai o project-ref do SUPABASE_URL (ex: https://xxxxx.supabase.co -> xxxxx)
function getProjectRef(): string {
  const projectRef = Deno.env.get('SUPABASE_PROJECT_REF');
  if (projectRef) {
    return projectRef;
  }
  
  // Tenta extrair da URL
  const match = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (match && match[1]) {
    return match[1];
  }
  
  throw new Error('Não foi possível determinar o SUPABASE_PROJECT_REF');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreatePreferenceRequest {
  transactionId: string;
  userId: string;
  amount: number;
  description: string;
  paymentMethod: 'pix' | 'credit_card' | 'boleto';
  metadata?: Record<string, any>;
}

serve(async (req) => {
  // VERSÃO 24 - Deploy em 26/11/2025
  console.log('🚀 Edge Function v24 chamada:', {
    method: req.method,
    url: req.url,
    hasAuth: !!req.headers.get('Authorization'),
    timestamp: new Date().toISOString(),
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verifica variáveis de ambiente
    console.log('🔍 Verificando variáveis de ambiente...');
    console.log('   MERCADOPAGO_ACCESS_TOKEN:', !!MERCADOPAGO_ACCESS_TOKEN ? '✅ Configurado' : '❌ Não configurado');
    console.log('   SUPABASE_URL:', !!SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado');
    console.log('   SUPABASE_ANON_KEY:', !!SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não configurado');
    
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token do Mercado Pago não configurado. Configure em Settings > Edge Functions > Secrets' 
        }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Variáveis do Supabase não configuradas');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração do servidor incompleta' }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Valida método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Método não permitido' }),
        { 
          status: 405, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Extrai token de autenticação do header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token de autenticação não fornecido' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Cria cliente Supabase com o token do usuário
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verifica autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Não autenticado' }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Lê e valida o corpo da requisição
    let body: CreatePreferenceRequest;
    try {
      body = await req.json();
      console.log('📥 Requisição recebida:', {
        hasTransactionId: !!body.transactionId,
        hasUserId: !!body.userId,
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        description: body.description,
      });
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Corpo da requisição inválido' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Validação: Parâmetros obrigatórios
    const missingParams: string[] = [];
    if (!body.transactionId) missingParams.push('transactionId');
    if (!body.userId) missingParams.push('userId');
    if (!body.amount) missingParams.push('amount');
    if (!body.description) missingParams.push('description');
    if (!body.paymentMethod) missingParams.push('paymentMethod');
    
    if (missingParams.length > 0) {
      console.error('❌ Parâmetros obrigatórios faltando:', missingParams);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Parâmetros obrigatórios faltando: ${missingParams.join(', ')}` 
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Validação: paymentMethod válido
    const validPaymentMethods = ['pix', 'credit_card', 'boleto'];
    if (!validPaymentMethods.includes(body.paymentMethod)) {
      console.error('❌ Método de pagamento inválido:', body.paymentMethod);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Método de pagamento inválido. Deve ser um de: ${validPaymentMethods.join(', ')}` 
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Validação: Verifica se o userId corresponde ao usuário autenticado
    if (body.userId !== user.id) {
      console.error('❌ Tentativa de criar pagamento para outro usuário');
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { 
          status: 403, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Validação: Valores mínimos e máximos
    if (body.amount < 1 || body.amount > 10000) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valor inválido. Deve estar entre R$ 1,00 e R$ 10.000,00' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Validação: Verifica se a transação existe e pertence ao usuário
    console.log('🔍 Buscando transação:', {
      transactionId: body.transactionId,
      userId: user.id,
    });
    
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('id, user_id, amount, status, metadata')
      .eq('id', body.transactionId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (transactionError) {
      console.error('❌ Erro ao buscar transação:', transactionError);
      console.error('   Código:', transactionError.code);
      console.error('   Mensagem:', transactionError.message);
      console.error('   Detalhes:', transactionError.details);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao buscar transação: ${transactionError.message || 'Transação não encontrada'}` 
        }),
        { 
          status: 404, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    if (!transaction) {
      console.error('❌ Transação não encontrada');
      return new Response(
        JSON.stringify({ success: false, error: 'Transação não encontrada ou já processada' }),
        { 
          status: 404, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    console.log('✅ Transação encontrada:', {
      id: transaction.id,
      amount: transaction.amount,
      status: transaction.status,
    });

    // Validação: Verifica se o valor da transação corresponde ao solicitado
    if (Math.abs(transaction.amount - body.amount) > 0.01) {
      console.error('❌ Valor da transação não corresponde:', {
        expected: transaction.amount,
        received: body.amount,
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Valor da transação não corresponde' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Busca dados do usuário para o payer
    console.log('👤 Buscando dados do usuário...');
    let userData = null;
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data, error: userError } = await supabaseAdmin
        .from('users')
        .select('full_name, email, phone')
        .eq('id', body.userId)
        .single();
      
      if (userError) {
        console.warn('⚠️ Erro ao buscar dados do usuário com service role:', userError);
      } else {
        userData = data;
        console.log('✅ Dados do usuário encontrados:', { 
          hasName: !!userData?.full_name, 
          hasEmail: !!userData?.email,
          hasPhone: !!userData?.phone 
        });
      }
    } else {
      // Tenta buscar com o cliente autenticado
      const { data, error: userError } = await supabase
        .from('users')
        .select('full_name, email, phone')
        .eq('id', body.userId)
        .single();
      
      if (userError) {
        console.warn('⚠️ Erro ao buscar dados do usuário:', userError);
      } else {
        userData = data;
      }
    }

    // URLs de retorno
    const successUrl = `${FRONTEND_URL}/payment/success?transaction_id=${body.transactionId}`;
    const failureUrl = `${FRONTEND_URL}/payment/failure?transaction_id=${body.transactionId}`;
    const pendingUrl = `${FRONTEND_URL}/payment/pending?transaction_id=${body.transactionId}`;

    // URL correta para webhook (Edge Function)
    let projectRef: string;
    try {
      projectRef = getProjectRef();
    } catch (error) {
      console.error('❌ Erro ao obter project-ref:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro na configuração do servidor' }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    const functionsBaseUrl = `https://${projectRef}.functions.supabase.co`;
    console.log('🔗 Webhook URL:', `${functionsBaseUrl}/mercadopago-webhook`);

    // Configuração de métodos de pagamento
    const paymentMethodsConfig: any = {
      excluded_payment_types: [] as { id: string }[],
      installments: body.paymentMethod === 'credit_card' ? 12 : 1,
    };

    if (body.paymentMethod === 'pix') {
      paymentMethodsConfig.excluded_payment_types = [
        { id: 'credit_card' },
        { id: 'debit_card' },
        { id: 'ticket' },
      ];
      paymentMethodsConfig.default_payment_method_id = 'pix';
    } else if (body.paymentMethod === 'credit_card') {
      paymentMethodsConfig.excluded_payment_types = [
        { id: 'ticket' },
      ];
    } else if (body.paymentMethod === 'boleto') {
      paymentMethodsConfig.excluded_payment_types = [
        { id: 'credit_card' },
        { id: 'debit_card' },
      ];
    }

    // Valida email do payer - Mercado Pago requer email válido
    const payerEmail = userData?.email || user.email || '';
    const payerName = userData?.full_name || user.email?.split('@')[0] || 'Cliente';
    
    console.log('📧 Dados do payer:', {
      email: payerEmail,
      name: payerName,
      hasPhone: !!(userData?.phone),
    });
    
    if (!payerEmail || !payerEmail.includes('@')) {
      console.error('❌ Email do payer inválido ou ausente:', payerEmail);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email do usuário é obrigatório para criar pagamento' 
        }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Constrói a preferência - estrutura simplificada conforme documentação do Mercado Pago
    const preferenceData: any = {
      items: [
        {
          id: body.transactionId,
          title: body.description.substring(0, 256), // Mercado Pago limita título a 256 chars
          quantity: 1,
          unit_price: body.amount,
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: payerEmail,
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: 'approved',
      external_reference: body.transactionId,
      notification_url: `${functionsBaseUrl}/mercadopago-webhook`,
    };
    
    // Adiciona nome do payer se disponível
    if (payerName) {
      preferenceData.payer.name = payerName;
    }
    
    // Adiciona metadata
    preferenceData.metadata = {
      transaction_id: body.transactionId,
      user_id: body.userId,
      payment_method: body.paymentMethod,
      ...body.metadata,
    };
    
    // Adiciona configuração de métodos de pagamento apenas se necessário
    if (paymentMethodsConfig.excluded_payment_types.length > 0) {
      preferenceData.payment_methods = paymentMethodsConfig;
    }

    console.log('📦 Criando preferência no Mercado Pago...');
    console.log('🔑 Token configurado:', !!MERCADOPAGO_ACCESS_TOKEN);
    console.log('🔑 Token (primeiros 20 chars):', MERCADOPAGO_ACCESS_TOKEN.substring(0, 20) + '...');
    console.log('📋 Dados da preferência completos:', JSON.stringify(preferenceData, null, 2));

    // Cria a preferência no Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceData),
    });
    
    console.log('📡 Resposta do Mercado Pago:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro do Mercado Pago - Status:', response.status);
      console.error('❌ Erro do Mercado Pago - Status Text:', response.statusText);
      console.error('❌ Erro do Mercado Pago - Tamanho da resposta:', errorText.length);
      console.error('❌ Erro do Mercado Pago - Primeiros 500 chars:', errorText.substring(0, 500));
      console.error('❌ Erro do Mercado Pago - Texto completo:', errorText);
      
      let errorMessage = 'Erro ao criar preferência de pagamento';
      let errorDetails = '';
      
      // Verifica se é HTML (erro de autenticação geralmente retorna HTML)
      if (errorText.trim().startsWith('<') || errorText.trim().startsWith('<!')) {
        errorMessage = `Mercado Pago retornou HTML (possível erro de autenticação). Status: ${response.status}`;
        console.error('❌ Mercado Pago retornou HTML - possível token inválido');
      } else if (errorText.trim() === '') {
        errorMessage = `Mercado Pago retornou resposta vazia. Status: ${response.status}`;
        console.error('❌ Mercado Pago retornou resposta vazia');
      } else {
        try {
          const errorJson = JSON.parse(errorText);
          console.error('❌ Erro do Mercado Pago (JSON):', JSON.stringify(errorJson, null, 2));
          
          // Mercado Pago retorna erros em diferentes formatos
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
          
          // Captura detalhes adicionais
          if (errorJson.cause && Array.isArray(errorJson.cause)) {
            errorDetails = errorJson.cause.map((c: any) => c.description || c.message || JSON.stringify(c)).join('; ');
          } else if (errorJson.error_description) {
            errorDetails = errorJson.error_description;
          }
          
          if (errorDetails) {
            errorMessage = `${errorMessage}: ${errorDetails}`;
          }
        } catch (parseErr) {
          console.error('❌ Não foi possível fazer parse do JSON:', parseErr);
          errorMessage = `Mercado Pago erro ${response.status}: ${errorText.substring(0, 200)}`;
        }
      }
      
      console.error('❌ Mensagem de erro final:', errorMessage);
      console.error('❌ Dados enviados ao Mercado Pago:', JSON.stringify(preferenceData, null, 2));
      
      // Retorna o erro com detalhes
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          mercadopago_status: response.status,
          debug_response_length: errorText.length,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const preferenceResponse = await response.json();
    console.log('✅ Preferência criada com sucesso:', {
      id: preferenceResponse.id,
      has_init_point: !!preferenceResponse.init_point,
      has_sandbox_init_point: !!preferenceResponse.sandbox_init_point,
    });

    // Atualiza a transação com o ID da preferência
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        metadata: {
          ...transaction.metadata,
          mercado_pago_preference_id: preferenceResponse.id,
        },
      })
      .eq('id', body.transactionId);

    if (updateError) {
      console.error('⚠️ Erro ao atualizar transação com preference_id:', updateError);
      // Não falha a operação, apenas loga o erro
    }

    return new Response(
      JSON.stringify({
        success: true,
        preference: {
          id: preferenceResponse.id,
          init_point: preferenceResponse.init_point,
          sandbox_init_point: preferenceResponse.sandbox_init_point,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Erro ao processar requisição:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

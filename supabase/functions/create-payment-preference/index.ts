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

// URL do frontend - DEVE ser uma URL pública HTTPS para o Mercado Pago aceitar
// O Mercado Pago não aceita localhost como back_url quando auto_return está ativo
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://unflix-painelcliente.netlify.app';

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

    // URLs de retorno - Mercado Pago requer URLs públicas HTTPS para auto_return
    console.log('🌐 FRONTEND_URL configurada:', FRONTEND_URL);
    
    // Valida se a URL é válida para o Mercado Pago (deve ser HTTPS, não localhost)
    if (FRONTEND_URL.includes('localhost') || FRONTEND_URL.startsWith('http://')) {
      console.warn('⚠️ FRONTEND_URL não é uma URL pública HTTPS. Mercado Pago pode rejeitar.');
      console.warn('   URL atual:', FRONTEND_URL);
      console.warn('   Configure FRONTEND_URL com uma URL HTTPS pública no Supabase Secrets');
    }
    
    const successUrl = `${FRONTEND_URL}/payment/success?transaction_id=${body.transactionId}`;
    const failureUrl = `${FRONTEND_URL}/payment/failure?transaction_id=${body.transactionId}`;
    const pendingUrl = `${FRONTEND_URL}/payment/pending?transaction_id=${body.transactionId}`;
    
    console.log('📍 URLs de retorno:', {
      success: successUrl,
      failure: failureUrl,
      pending: pendingUrl,
    });

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

    // Dados do payer
    const payerEmail = userData?.email || user.email || 'test_user@testuser.com';
    
    console.log('📧 Email do payer:', payerEmail);

    // Constrói a preferência - estrutura MÍNIMA conforme documentação oficial do Mercado Pago
    // https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post
    const preferenceData: any = {
      // OBRIGATÓRIO: items com title, quantity e unit_price
      items: [
        {
          title: body.description.substring(0, 256),
          quantity: 1,
          unit_price: Number(body.amount),
          currency_id: 'BRL',
        },
      ],
      // RECOMENDADO: payer com email
      payer: {
        email: payerEmail,
      },
      // OPCIONAL: back_urls - URLs de retorno após pagamento
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      // OPCIONAL: auto_return - redireciona automaticamente após pagamento aprovado
      auto_return: 'approved',
      // OPCIONAL: external_reference - referência externa para identificar a transação
      external_reference: body.transactionId,
    };
    
    console.log('📋 Preferência a ser enviada:', JSON.stringify(preferenceData, null, 2));

    console.log('📦 Criando preferência no Mercado Pago...');
    console.log('🔑 Token (primeiros 30 chars):', MERCADOPAGO_ACCESS_TOKEN.substring(0, 30) + '...');
    console.log('🌐 URL da API:', 'https://api.mercadopago.com/checkout/preferences');

    // Cria a preferência no Mercado Pago
    // Endpoint: POST https://api.mercadopago.com/checkout/preferences
    // Documentação: https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post
    let mpResponse: Response;
    let mpResponseText: string;
    
    try {
      mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(preferenceData),
      });
      
      mpResponseText = await mpResponse.text();
      
      console.log('📡 Resposta do Mercado Pago - Status:', mpResponse.status);
      console.log('📡 Resposta do Mercado Pago - Body:', mpResponseText);
      
    } catch (fetchError: any) {
      console.error('❌ Erro de rede ao chamar Mercado Pago:', fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro de conexão com Mercado Pago: ${fetchError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!mpResponse.ok) {
      console.error('❌ Mercado Pago retornou erro:', mpResponse.status);
      console.error('❌ Resposta completa:', mpResponseText);
      
      // Tenta parsear o erro como JSON
      let errorMessage = `Mercado Pago erro ${mpResponse.status}`;
      try {
        const errorJson = JSON.parse(mpResponseText);
        console.error('❌ Erro JSON:', JSON.stringify(errorJson, null, 2));
        
        // Formatos de erro do Mercado Pago
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
        if (errorJson.cause && Array.isArray(errorJson.cause)) {
          const causes = errorJson.cause.map((c: any) => c.description || c.message || c.code).filter(Boolean);
          if (causes.length > 0) {
            errorMessage += `: ${causes.join(', ')}`;
          }
        }
      } catch {
        // Não é JSON, usa o texto direto
        errorMessage = mpResponseText.substring(0, 300) || `Erro ${mpResponse.status}`;
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          mp_status: mpResponse.status,
          mp_response: mpResponseText.substring(0, 500),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Parseia a resposta de sucesso
    let preferenceResponse: any;
    try {
      preferenceResponse = JSON.parse(mpResponseText);
    } catch {
      console.error('❌ Erro ao parsear resposta de sucesso:', mpResponseText);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Resposta inválida do Mercado Pago',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Preferência criada com sucesso:', {
      id: preferenceResponse.id,
      init_point: preferenceResponse.init_point,
      sandbox_init_point: preferenceResponse.sandbox_init_point,
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

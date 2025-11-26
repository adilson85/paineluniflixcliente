/**
 * Serviço de integração com Mercado Pago
 *
 * SEGURO: Criação de preferências via Supabase Edge Function
 * O Access Token do Mercado Pago permanece protegido no backend
 */

import { supabase } from './supabase';

export interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
}

export interface CreatePreferenceParams {
  transactionId: string;
  userId: string;
  amount: number;
  description: string;
  paymentMethod: 'pix' | 'credit_card' | 'boleto';
  metadata?: Record<string, any>;
}

/**
 * Cria uma preferência de pagamento no Mercado Pago
 * via Supabase Edge Function (seguro)
 */
export async function createMercadoPagoPreference(
  params: CreatePreferenceParams
): Promise<MercadoPagoPreference> {

  if (import.meta.env.DEV) {
    console.log('📦 Criando preferência de pagamento via Edge Function:', {
      transactionId: params.transactionId,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
    });
  }

  // Obtém o token de autenticação do usuário
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Usuário não autenticado');
  }

  // Chama a Edge Function para criar a preferência
  // Usa fetch diretamente para capturar a resposta completa em caso de erro
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const functionUrl = `${supabaseUrl}/functions/v1/create-payment-preference`;
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify(params),
    });

    let responseData: any;
    try {
      const text = await response.text();
      responseData = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta:', parseError);
      responseData = {};
    }
    
    if (!response.ok) {
      console.error('❌ Erro HTTP:', response.status, response.statusText);
      console.error('❌ Resposta da Edge Function (completa):', JSON.stringify(responseData, null, 2));
      console.error('❌ URL chamada:', functionUrl);
      console.error('❌ Parâmetros enviados:', JSON.stringify(params, null, 2));
      
      const errorMessage = responseData?.error || responseData?.message || responseData?.success === false ? responseData.error : `Erro ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // Verifica se a resposta é válida
    if (!responseData) {
      console.error('❌ Nenhum dado retornado pela Edge Function');
      throw new Error('Nenhum dado retornado pela Edge Function');
    }

    if (!responseData.success) {
      console.error('❌ Resposta de erro da Edge Function:', responseData);
      const errorMessage = responseData.error || 'Erro ao criar preferência de pagamento';
      throw new Error(errorMessage);
    }

    if (!responseData.preference) {
      console.error('❌ Resposta inválida da Edge Function (sem preference):', responseData);
      throw new Error(responseData.error || 'Resposta inválida da Edge Function');
    }

    // Usa responseData como data
    const data = responseData;

    if (import.meta.env.DEV) {
      console.log('✅ Preferência criada com sucesso:', {
        id: data.preference.id,
        has_init_point: !!data.preference.init_point,
        has_sandbox_init_point: !!data.preference.sandbox_init_point,
      });
    }

    return {
      id: data.preference.id,
      init_point: data.preference.init_point,
      sandbox_init_point: data.preference.sandbox_init_point,
    };
  } catch (error: any) {
    console.error('❌ Erro ao chamar Edge Function:', error);
    
    // Se já é um Error, apenas relança
    if (error instanceof Error) {
      throw error;
    }
    
    // Caso contrário, cria um novo Error
    throw new Error(error?.message || 'Erro ao criar preferência de pagamento');
  }
}

/**
 * Verifica o status de um pagamento
 * Consulta diretamente a tabela transactions (seguro, com RLS)
 */
export async function checkPaymentStatus(transactionId: string): Promise<any> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (error) {
    console.error('❌ Erro ao verificar status:', error);
    throw new Error('Erro ao verificar status do pagamento');
  }

  return data;
}


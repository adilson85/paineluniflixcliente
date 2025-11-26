/**
 * Edge Function do Supabase para receber webhooks do Mercado Pago
 * 
 * Esta função:
 * 1. Recebe notificações de pagamento do Mercado Pago
 * 2. Valida a assinatura (opcional, mas recomendado)
 * 3. Atualiza o status da transação no banco
 * 4. Atualiza a assinatura do usuário se o pagamento for aprovado
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface MercadoPagoWebhook {
  type: string;
  data: {
    id: string;
  };
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Verifica se as variáveis de ambiente estão configuradas
    if (!MERCADOPAGO_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Variáveis de ambiente não configuradas');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Cria cliente Supabase com service role (bypassa RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Lê o body da requisição
    const body: MercadoPagoWebhook = await req.json();
    console.log('📥 Webhook recebido:', JSON.stringify(body, null, 2));

    // Mercado Pago envia diferentes tipos de notificações
    // https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
    if (body.type === 'payment') {
      const paymentId = body.data.id;

      // Busca informações do pagamento no Mercado Pago
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          },
        }
      );

      if (!paymentResponse.ok) {
        throw new Error(`Erro ao buscar pagamento: ${paymentResponse.statusText}`);
      }

      const payment = await paymentResponse.json();
      console.log('💳 Pagamento:', {
        id: payment.id,
        status: payment.status,
        external_reference: payment.external_reference,
        transaction_amount: payment.transaction_amount,
      });

      // external_reference contém o transaction_id do nosso banco
      const transactionId = payment.external_reference;
      if (!transactionId) {
        console.warn('⚠️ Pagamento sem external_reference');
        return new Response(
          JSON.stringify({ error: 'Pagamento sem referência externa' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Mapeia status do Mercado Pago para nosso sistema
      const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled'> = {
        pending: 'pending',
        approved: 'completed',
        authorized: 'completed',
        in_process: 'pending',
        in_mediation: 'pending',
        rejected: 'failed',
        cancelled: 'cancelled',
        refunded: 'cancelled',
        charged_back: 'failed',
      };

      const newStatus = statusMap[payment.status] || 'pending';

      // IDEMPOTÊNCIA: Busca transação atual ANTES de atualizar
      const { data: existingTransaction, error: fetchError } = await supabase
        .from('transactions')
        .select('id, status, user_id, metadata, amount, description')
        .eq('id', transactionId)
        .single();

      if (fetchError || !existingTransaction) {
        console.error('❌ Transação não encontrada:', transactionId);
        return new Response(
          JSON.stringify({ error: 'Transação não encontrada' }),
          { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }

      const previousStatus = existingTransaction.status;
      console.log('🔄 Status da transação:', previousStatus, '->', newStatus);

      // Atualiza a transação no banco
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: newStatus,
          metadata: {
            ...payment,
            mercado_pago_id: payment.id,
            mercado_pago_status: payment.status,
            updated_at: new Date().toISOString(),
          },
        })
        .eq('id', transactionId);

      if (updateError) {
        console.error('❌ Erro ao atualizar transação:', updateError);
        throw updateError;
      }

      console.log('✅ Transação atualizada:', transactionId, '->', newStatus);

      // IDEMPOTÊNCIA: Só processa se pagamento mudou para 'completed' (não estava completed antes)
      if (newStatus === 'completed' && previousStatus !== 'completed') {
        const transaction = existingTransaction;
          const userId = transaction.user_id;
          const metadata = transaction.metadata || {};
          const durationDays = metadata.duration_days || 30;

          // Busca dados do usuário
          const { data: user } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', userId)
            .single();

          const userName = user?.full_name || 'Cliente';

          // Busca as assinaturas ativas do usuário
          const { data: subscriptions, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('id, expiration_date, panel_name')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

          if (subscriptionError) {
            console.error('❌ Erro ao buscar assinaturas:', subscriptionError);
          } else if (subscriptions && subscriptions.length > 0) {
            // Calcula nova data de expiração e atualiza todas as assinaturas
            const quantidadePontos = subscriptions.length;

            for (const subscription of subscriptions) {
              // Se a assinatura já expirou, soma a partir de hoje
              // Se ainda está ativa, soma a partir da data de expiração
              const hoje = new Date();
              const dataExpiracao = subscription.expiration_date
                ? new Date(subscription.expiration_date)
                : hoje;

              const currentExpiration = dataExpiracao > hoje ? dataExpiracao : hoje;
              const newExpiration = new Date(currentExpiration);
              newExpiration.setDate(newExpiration.getDate() + durationDays);

              // Atualiza a assinatura
              const { error: updateSubError } = await supabase
                .from('subscriptions')
                .update({
                  expiration_date: newExpiration.toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', subscription.id);

              if (updateSubError) {
                console.error('❌ Erro ao atualizar assinatura:', updateSubError);
              } else {
                console.log('✅ Assinatura atualizada:', subscription.id, '->', newExpiration);
              }
            }

            // Registrar entrada no caixa
            const hoje = new Date().toLocaleDateString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).split('/').reverse().join('-');

            const { error: caixaError } = await supabase
              .from('caixa_movimentacoes')
              .insert({
                data: hoje,
                historico: `Pagamento Online - ${userName} (${transaction.description || 'Recarga'})`,
                entrada: transaction.amount,
                saida: 0,
              });

            if (caixaError) {
              console.error('❌ Erro ao registrar no caixa:', caixaError);
            } else {
              console.log('✅ Entrada registrada no caixa:', transaction.amount);
            }

            // Registrar créditos vendidos
            const quantidadeCreditos = quantidadePontos * (metadata.duration_months || Math.ceil(durationDays / 30));
            const painelPrincipal = subscriptions[0]?.panel_name || null;

            const { error: creditosError } = await supabase
              .from('creditos_vendidos')
              .insert({
                data: hoje,
                historico: `Pagamento Online - ${userName} (${quantidadePontos} ponto${quantidadePontos > 1 ? 's' : ''})`,
                painel: painelPrincipal,
                quantidade_creditos: quantidadeCreditos,
              });

            if (creditosError) {
              console.error('❌ Erro ao registrar créditos vendidos:', creditosError);
            } else {
              console.log('✅ Créditos vendidos registrados:', quantidadeCreditos);
            }
          }
        }
      } else if (newStatus === 'completed' && previousStatus === 'completed') {
        console.log('ℹ️ Pagamento já processado anteriormente (idempotente). Não altera assinatura novamente.');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          transaction_id: transactionId,
          status: newStatus 
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Se não for um evento de pagamento, retorna sucesso mas não faz nada
    console.log('ℹ️ Tipo de evento não processado:', body.type);
    return new Response(
      JSON.stringify({ success: true, message: 'Evento não processado' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Erro no webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao processar webhook' 
      }),
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










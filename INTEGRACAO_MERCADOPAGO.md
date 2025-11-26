# 💳 Integração com Mercado Pago

Este documento explica como configurar e usar a integração com o Mercado Pago para processar pagamentos.

## 📋 Pré-requisitos

1. Conta no Mercado Pago (https://www.mercadopago.com.br/)
2. Acesso às credenciais de API (Access Token)
3. Supabase configurado com Edge Functions

## 🔧 Configuração

### 1. Obter Credenciais do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Crie uma aplicação ou use uma existente
3. Copie o **Access Token** (teste ou produção)

### 2. Configurar Variáveis de Ambiente

#### Frontend (`.env.local`)

```env
# Mercado Pago - Credenciais de Teste
VITE_MERCADOPAGO_ACCESS_TOKEN=TEST-224356275466649-111119-abfa19c521ad7061f1cd5b522de97208-491992674
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-e5710a90-0c6c-41bb-8259-d63c9e211d12
```

**Nota:** As credenciais de teste já estão configuradas no projeto. Para produção, substitua por credenciais reais.

#### Supabase Edge Function

Configure as seguintes variáveis de ambiente no Supabase:

```bash
# Via CLI do Supabase
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx

# Ou via Dashboard do Supabase
# Settings > Edge Functions > Environment Variables
```

### 3. Deploy da Edge Function

```bash
# Instale o Supabase CLI se ainda não tiver
npm install -g supabase

# Faça login
supabase login

# Link seu projeto
supabase link --project-ref seu-project-ref

# Deploy da função
supabase functions deploy mercadopago-webhook
```

### 4. Configurar Webhook no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app/{seu-app-id}/webhooks
2. Adicione a URL do webhook:
   ```
   https://seu-project-ref.supabase.co/functions/v1/mercadopago-webhook
   ```
3. Selecione os eventos:
   - `payment`
   - `merchant_order` (opcional)

## 🔄 Fluxo de Pagamento

### 1. Cliente inicia pagamento

1. Cliente seleciona período de recarga e método de pagamento
2. Sistema cria transação com status `pending`
3. Sistema cria preferência de pagamento no Mercado Pago
4. Cliente é redirecionado para página de pagamento do Mercado Pago

### 2. Cliente completa pagamento

1. Cliente paga no Mercado Pago
2. Mercado Pago envia webhook para Edge Function
3. Edge Function:
   - Busca informações do pagamento
   - Atualiza status da transação (`pending` → `completed`/`failed`)
   - Se aprovado, atualiza data de expiração da assinatura

### 3. Cliente retorna ao site

1. Cliente é redirecionado para `/payment/success` ou `/payment/failure`
2. Frontend pode verificar status da transação
3. Dashboard é atualizado automaticamente

## 📊 Status de Pagamento

O sistema mapeia os status do Mercado Pago da seguinte forma:

| Mercado Pago | Sistema | Descrição |
|--------------|---------|-----------|
| `pending` | `pending` | Aguardando pagamento |
| `approved` | `completed` | Pagamento aprovado |
| `authorized` | `completed` | Pagamento autorizado |
| `in_process` | `pending` | Em processamento |
| `in_mediation` | `pending` | Em mediação |
| `rejected` | `failed` | Pagamento rejeitado |
| `cancelled` | `cancelled` | Pagamento cancelado |
| `refunded` | `cancelled` | Pagamento reembolsado |
| `charged_back` | `failed` | Chargeback |

## 🔒 Segurança

### ⚠️ IMPORTANTE

**NUNCA exponha o Access Token do Mercado Pago no frontend em produção!**

A implementação atual usa o Access Token no frontend apenas para desenvolvimento/testes. Em produção:

1. **Crie uma Edge Function** para criar preferências de pagamento
2. **Mova a lógica** de `createMercadoPagoPreference` para o backend
3. **Remova** `VITE_MERCADOPAGO_ACCESS_TOKEN` do `.env.local`
4. **Use** apenas o Access Token no backend (Edge Function)

### Exemplo de Edge Function para criar preferências

```typescript
// supabase/functions/create-payment-preference/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { transactionId, amount, description, paymentMethod } = await req.json();
  
  // Cria preferência usando Access Token do servidor
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')}`,
    },
    body: JSON.stringify({ /* ... */ }),
  });
  
  return new Response(JSON.stringify(await response.json()));
});
```

## 🧪 Teste

### Modo Sandbox

1. Use o Access Token de **teste** do Mercado Pago
2. Use cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards
3. Para PIX, use o QR Code gerado (não é possível pagar realmente em sandbox)

### Cartões de Teste

- **Aprovado**: `5031 4332 1540 6351` (CVV: 123, Vencimento: 11/25)
- **Recusado**: `5031 4332 1540 6351` (CVV: 123, Vencimento: 11/25)

## 📝 Estrutura de Dados

### Tabela `transactions`

A tabela `transactions` armazena:

- `id`: ID da transação (usado como `external_reference` no Mercado Pago)
- `status`: Status do pagamento (`pending`, `completed`, `failed`, `cancelled`)
- `metadata`: Dados adicionais:
  ```json
  {
    "period": "monthly",
    "duration_days": 30,
    "mercado_pago_preference_id": "1234567890-abc-def-ghi",
    "mercado_pago_id": "1234567890",
    "mercado_pago_status": "approved"
  }
  ```

## 🐛 Troubleshooting

### Webhook não está sendo recebido

1. Verifique se a URL do webhook está correta no painel do Mercado Pago
2. Verifique os logs da Edge Function no Supabase
3. Use o simulador de webhooks do Mercado Pago para testar

### Pagamento não atualiza status

1. Verifique se o `external_reference` está sendo enviado corretamente
2. Verifique os logs da Edge Function
3. Verifique se a transação existe no banco com o ID correto

### Erro "Access Token inválido"

1. Verifique se o token está correto
2. Verifique se está usando o token de teste em desenvolvimento
3. Verifique se o token não expirou

## 📚 Referências

- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [API de Preferências](https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)


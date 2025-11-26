# 🚀 Deploy das Edge Functions do Supabase

## Pré-requisitos

1. **Supabase CLI instalado**
   ```bash
   npm install -g supabase
   ```

2. **Login no Supabase**
   ```bash
   supabase login
   ```

3. **Link com seu projeto**
   ```bash
   supabase link --project-ref seu-project-ref
   ```

   Você encontra o `project-ref` na URL do seu projeto:
   `https://supabase.com/dashboard/project/SEU-PROJECT-REF`

---

## 📦 Edge Functions Disponíveis

### 1. `mercadopago-webhook`
- **Propósito**: Receber notificações de pagamento do Mercado Pago
- **Trigger**: Webhook do Mercado Pago quando status de pagamento muda
- **Ações**:
  - Atualiza status da transação
  - Estende data de expiração da assinatura quando pagamento aprovado
  - Concede entradas no sorteio mensal

### 2. `create-payment-preference`
- **Propósito**: Criar preferências de pagamento de forma segura
- **Trigger**: Chamada do frontend quando usuário inicia pagamento
- **Ações**:
  - Valida usuário autenticado
  - Valida valores e transação
  - Cria preferência no Mercado Pago
  - Retorna URL de pagamento

---

## ⚙️ Configuração de Variáveis de Ambiente

### Passo 1: Configurar Secrets no Supabase

Acesse o painel do Supabase: **Settings > Edge Functions > Secrets**

Adicione os seguintes secrets:

```bash
# Access Token do Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxx-xxxxxx-xxxxx

# URL do Frontend (para redirect após pagamento)
FRONTEND_URL=https://seu-dominio.com  # ou http://localhost:5173 para dev
```

### Passo 2: Configurar via CLI (alternativa)

```bash
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxx-xxxxxx-xxxxx
supabase secrets set FRONTEND_URL=https://seu-dominio.com
```

---

## 🚀 Deploy das Functions

### Deploy Todas as Functions

```bash
cd "E:\Programas em desevolvimento\uniflix Adm\Cliente Uniflix"
supabase functions deploy
```

### Deploy Individual

```bash
# Deploy apenas webhook
supabase functions deploy mercadopago-webhook

# Deploy apenas create-payment-preference
supabase functions deploy create-payment-preference
```

---

## 🔗 Configuração do Webhook no Mercado Pago

### Passo 1: Obter URL da Edge Function

Após deploy, a URL será:
```
https://SEU-PROJECT-REF.supabase.co/functions/v1/mercadopago-webhook
```

### Passo 2: Configurar no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em **Webhooks**
4. Adicione a URL:
   ```
   https://SEU-PROJECT-REF.supabase.co/functions/v1/mercadopago-webhook
   ```
5. Selecione eventos:
   - ✅ `payment` - Pagamentos

### Passo 3: Testar Webhook

Use o simulador do Mercado Pago ou faça um pagamento teste:

```bash
# Ver logs da function
supabase functions logs mercadopago-webhook --tail
```

---

## 🧪 Testando Localmente

### Iniciar Supabase Local

```bash
supabase start
```

### Servir Functions Localmente

```bash
# Terminal 1 - Servir function
supabase functions serve mercadopago-webhook --env-file .env.local

# Terminal 2 - Servir outra function
supabase functions serve create-payment-preference --env-file .env.local
```

### Criar arquivo `.env.local` para testes

```bash
# .env.local
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxx-xxxxxx-xxxxx
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=sua-anon-key-local
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-local
```

### Testar com cURL

```bash
# Teste create-payment-preference
curl -X POST http://localhost:54321/functions/v1/create-payment-preference \
  -H "Authorization: Bearer SEU-ACCESS-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "uuid-da-transacao",
    "userId": "uuid-do-usuario",
    "amount": 29.90,
    "description": "Teste Recarga",
    "paymentMethod": "pix"
  }'

# Teste webhook (simular notificação do Mercado Pago)
curl -X POST http://localhost:54321/functions/v1/mercadopago-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "data": {
      "id": "1234567890"
    }
  }'
```

---

## 📊 Monitoramento

### Ver Logs em Produção

```bash
# Logs em tempo real
supabase functions logs mercadopago-webhook --tail

# Logs das últimas 100 linhas
supabase functions logs create-payment-preference --limit 100
```

### Métricas no Dashboard

Acesse: **Supabase Dashboard > Edge Functions > sua-function**

Você verá:
- Número de invocações
- Tempo de execução
- Taxa de erro
- Logs detalhados

---

## 🛡️ Segurança

### ✅ Implementado

- **Autenticação**: Verifica token JWT do usuário
- **Autorização**: Valida que usuário só acessa seus próprios dados
- **Validação de Valores**: Previne valores inválidos (< R$1 ou > R$10.000)
- **RLS Policies**: Garante isolamento de dados no banco
- **Service Role**: Webhook usa Service Role para bypass seguro do RLS

### ⚠️ Recomendações Adicionais

1. **Rate Limiting**: Configure no Supabase (dashboard > Edge Functions)
2. **Webhook Signature**: Valide assinatura do Mercado Pago (opcional mas recomendado)
3. **Logs de Auditoria**: Implemente logging detalhado para investigações

---

## 🐛 Troubleshooting

### Erro: "MERCADOPAGO_ACCESS_TOKEN não configurada"

**Solução**: Configure o secret no Supabase
```bash
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=seu-token
```

### Erro: "Não autenticado"

**Causa**: Token JWT não foi enviado ou expirou

**Solução**: Verifique que o frontend está enviando o header:
```typescript
Authorization: Bearer ${session.access_token}
```

### Erro: "Transação não encontrada"

**Causa**: Transação não existe ou já foi processada

**Solução**: Verifique que a transação foi criada com `status='pending'` antes de chamar a function

### Webhook não está sendo chamado

**Causas possíveis**:
1. URL incorreta no Mercado Pago
2. Mercado Pago não consegue acessar a URL (firewall?)
3. Function retornou erro (status != 200)

**Debug**:
```bash
# Verificar logs
supabase functions logs mercadopago-webhook --tail

# Testar manualmente
curl -X POST https://SEU-PROJECT.supabase.co/functions/v1/mercadopago-webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"123"}}'
```

---

## 📝 Checklist de Deploy

Antes de fazer deploy em produção:

- [ ] Secrets configurados no Supabase
- [ ] Edge Functions deployed
- [ ] Webhook configurado no Mercado Pago
- [ ] RLS Policies aplicadas (rodar migration)
- [ ] Testado pagamento completo (criar transação → pagar → verificar aprovação)
- [ ] Logs monitorados por 24h
- [ ] Frontend atualizado (removido VITE_MERCADOPAGO_ACCESS_TOKEN do .env)
- [ ] Documentação atualizada

---

## 🔄 Atualização de Functions

Quando modificar o código de uma function:

```bash
# 1. Testar localmente
supabase functions serve nome-da-function --env-file .env.local

# 2. Deploy
supabase functions deploy nome-da-function

# 3. Verificar logs
supabase functions logs nome-da-function --tail

# 4. Testar em produção
```

---

## 📚 Recursos Úteis

- [Documentação Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Documentação Webhooks Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Deno Deploy (runtime das Edge Functions)](https://deno.com/deploy/docs)

---

**Última atualização**: 16/11/2025
**Versão**: 1.0.0

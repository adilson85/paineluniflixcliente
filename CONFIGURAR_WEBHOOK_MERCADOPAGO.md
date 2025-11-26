# 🔗 Configurar Webhook no Mercado Pago

## 📍 Situação Atual

Você está usando **Supabase local** (`http://localhost:54328`), então o webhook precisa de uma URL pública para funcionar.

## 🎯 Opções para Configurar o Webhook

### Opção 1: Usar ngrok (Recomendado para Desenvolvimento)

O ngrok expõe seu localhost através de uma URL pública temporária.

#### Passos:

1. **Instale o ngrok:**
   ```bash
   # Windows (via Chocolatey)
   choco install ngrok
   
   # Ou baixe de: https://ngrok.com/download
   ```

2. **Inicie o ngrok apontando para o Supabase local:**
   ```bash
   ngrok http 54328
   ```

3. **Copie a URL gerada** (exemplo: `https://abc123.ngrok.io`)

4. **Configure no Mercado Pago:**
   - No painel do Mercado Pago, na seção **Webhooks**
   - Adicione a URL:
     ```
     https://abc123.ngrok.io/functions/v1/mercadopago-webhook
     ```
   - Selecione o evento: **`payment`**
   - Salve

5. **Importante:** A URL do ngrok muda a cada vez que você reinicia. Você precisará atualizar no Mercado Pago.

---

### Opção 2: Deploy da Edge Function (Para Produção)

Quando estiver pronto para produção, faça o deploy da Edge Function no Supabase Cloud.

#### Passos:

1. **Crie um projeto no Supabase Cloud:**
   - Acesse: https://supabase.com
   - Crie um novo projeto

2. **Faça deploy da Edge Function:**
   ```bash
   # Instale o Supabase CLI
   npm install -g supabase
   
   # Faça login
   supabase login
   
   # Link seu projeto
   supabase link --project-ref seu-project-ref
   
   # Deploy da função
   supabase functions deploy mercadopago-webhook
   ```

3. **Configure as variáveis de ambiente no Supabase:**
   - Acesse: Dashboard do Supabase > Settings > Edge Functions
   - Adicione:
     - `MERCADOPAGO_ACCESS_TOKEN`: Seu Access Token
     - `SUPABASE_URL`: URL do seu projeto Supabase
     - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key do Supabase

4. **Configure no Mercado Pago:**
   - URL do webhook:
     ```
     https://seu-project-ref.supabase.co/functions/v1/mercadopago-webhook
     ```
   - Evento: **`payment`**

---

## 🔧 Configuração no Painel do Mercado Pago

### Passo a Passo:

1. **Acesse o painel:**
   - https://www.mercadopago.com.br/developers/panel

2. **Vá para a seção Webhooks:**
   - No menu lateral, clique em **"NOTIFICAÇÕES"**
   - Clique em **"Webhooks"**

3. **Adicione a URL:**
   - Clique em **"Adicionar URL"** ou **"Criar webhook"**
   - Cole a URL do webhook (ngrok ou Supabase Cloud)
   - Exemplo: `https://abc123.ngrok.io/functions/v1/mercadopago-webhook`

4. **Selecione os eventos:**
   - ✅ **`payment`** (obrigatório)
   - ⚠️ **`merchant_order`** (opcional)

5. **Salve a configuração**

---

## ✅ Como Verificar se Está Funcionando

### 1. Teste Manual (ngrok):

```bash
# Em outro terminal, teste o webhook
curl -X POST https://sua-url-ngrok.io/functions/v1/mercadopago-webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"123456"}}'
```

### 2. Verificar Logs:

- **Supabase local:** Verifique os logs do Docker
- **Supabase Cloud:** Dashboard > Edge Functions > Logs

### 3. Testar Pagamento:

1. Faça um pagamento de teste
2. Verifique se a transação foi atualizada no banco
3. Verifique os logs do webhook

---

## ⚠️ Importante para Desenvolvimento Local

**Sem webhook configurado:**
- ✅ Os pagamentos ainda funcionam
- ✅ O usuário é redirecionado corretamente
- ❌ O status da transação **NÃO** é atualizado automaticamente
- ❌ A assinatura **NÃO** é atualizada automaticamente

**Solução temporária:**
- Você pode atualizar manualmente o status da transação no banco
- Ou usar o ngrok para testar o webhook em desenvolvimento

---

## 🚀 Para Produção

Quando for para produção:

1. ✅ Use Supabase Cloud (não local)
2. ✅ Faça deploy da Edge Function
3. ✅ Configure o webhook com a URL do Supabase Cloud
4. ✅ Use credenciais de **produção** do Mercado Pago (não TEST-)

---

## 📝 Resumo Rápido

**Para testar AGORA (desenvolvimento):**
```bash
# Terminal 1: Inicie o ngrok
ngrok http 54328

# Copie a URL (ex: https://abc123.ngrok.io)
# Configure no Mercado Pago: https://abc123.ngrok.io/functions/v1/mercadopago-webhook
```

**Para produção:**
- Deploy no Supabase Cloud
- URL: `https://seu-project.supabase.co/functions/v1/mercadopago-webhook`










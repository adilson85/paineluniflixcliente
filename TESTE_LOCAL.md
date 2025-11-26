# 🧪 Teste Local - Uniflix Cliente

## ✅ Status Atual

### Já Aplicado no Ambiente Local:
- ✅ **RLS Policies** - 33 policies de segurança aplicadas
- ✅ **Código das Edge Functions** criado em `supabase/functions/`
- ✅ **Frontend atualizado** para usar Edge Functions
- ✅ **Supabase Local rodando** na porta 54328

### Pendente:
- ⏳ Deploy das Edge Functions (requer Deno ou Supabase CLI)

---

## 🔧 Opções para Testar Localmente

### Opção 1: Testar Sem Edge Functions (Mock)

Para testar a UI e validações sem o sistema de pagamento completo:

1. **Criar transações manualmente no banco:**
   ```sql
   -- Conectar ao banco local
   docker exec -it supabase_db_uniflix-adm psql -U postgres -d postgres

   -- Criar uma transação de teste
   INSERT INTO transactions (user_id, type, amount, payment_method, status, description)
   VALUES (
     'uuid-do-usuario',
     'recharge',
     29.90,
     'pix',
     'pending',
     'Teste de recarga'
   );
   ```

2. **Simular aprovação de pagamento:**
   ```sql
   -- Atualizar status manualmente (simula webhook)
   UPDATE transactions
   SET status = 'completed',
       metadata = jsonb_build_object('test', true)
   WHERE id = 'uuid-da-transacao';

   -- Estender assinatura manualmente
   UPDATE subscriptions
   SET expiration_date = expiration_date + INTERVAL '30 days'
   WHERE user_id = 'uuid-do-usuario';
   ```

---

### Opção 2: Instalar Deno e Servir Edge Functions Localmente

#### Passo 1: Instalar Deno

**Windows (PowerShell como Admin):**
```powershell
irm https://deno.land/install.ps1 | iex
```

**Ou via Scoop:**
```bash
scoop install deno
```

#### Passo 2: Servir Edge Functions

```bash
cd "E:\Programas em desevolvimento\uniflix Adm\Cliente Uniflix"

# Criar arquivo .env.local para as functions
cat > supabase/functions/.env.local << EOF
MERCADOPAGO_ACCESS_TOKEN=TEST-seu-token-de-teste
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=http://127.0.0.1:54328
SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
EOF

# Servir a função de criar preferência
deno run --allow-all --watch supabase/functions/create-payment-preference/index.ts
```

#### Passo 3: Configurar Frontend para Usar Função Local

No arquivo `.env`:
```bash
# Apontar para função local (porta padrão do Deno: 8000)
VITE_SUPABASE_URL=http://127.0.0.1:8000
```

---

### Opção 3: Usar Supabase CLI com npx

#### Passo 1: Criar config.toml

```bash
cd "E:\Programas em desevolvimento\uniflix Adm\Cliente Uniflix"

# Inicializar configuração Supabase
cat > supabase/config.toml << 'EOF'
[api]
port = 54328
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public"]
max_rows = 1000

[db]
port = 54329
shadow_port = 54333
major_version = 15

[studio]
port = 54330

[functions]
enabled = true
verify_jwt = false
EOF
```

#### Passo 2: Servir Functions com npx

```bash
# Instalar e usar Supabase CLI via npx
npx supabase functions serve --env-file supabase/functions/.env.local
```

Isso iniciará um servidor local para as Edge Functions na porta padrão (54321).

---

## 🧪 Testes Recomendados

### 1. Testar RLS Policies

**Teste:** Usuário não pode alterar status de transação

```javascript
// No console do browser (após login como cliente)
const { data: session } = await supabase.auth.getSession();
console.log('User ID:', session.session.user.id);

// Tentar criar transação como outro usuário (deve falhar)
const { error } = await supabase
  .from('transactions')
  .insert({
    user_id: 'outro-user-id',  // ❌ Deve falhar
    type: 'recharge',
    amount: 100,
    status: 'pending'
  });

console.log('Erro esperado:', error); // Deve retornar erro de permissão
```

**Teste:** Usuário não pode modificar `expiration_date`

```javascript
// Tentar atualizar data de expiração (deve falhar)
const { error } = await supabase
  .from('subscriptions')
  .update({ expiration_date: '2099-12-31' })  // ❌ Deve falhar
  .eq('user_id', session.session.user.id);

console.log('Erro esperado:', error);
```

### 2. Testar Validações no Frontend

```javascript
// Testar validação de valores
// Abrir página de recarga e tentar valor inválido
// Deve mostrar erro client-side antes de enviar
```

### 3. Testar Queries Otimizadas

```sql
-- Verificar que queries não usam SELECT *
-- Conectar ao banco
docker exec -it supabase_db_uniflix-adm psql -U postgres -d postgres

-- Ver queries ativas (durante uso do app)
SELECT query FROM pg_stat_activity WHERE state = 'active';
```

---

## 🔍 Verificar RLS Policies Aplicadas

```sql
-- Listar todas as policies criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('transactions', 'subscriptions', 'users', 'referrals')
ORDER BY tablename, policyname;
```

**Esperado:** 33 policies

---

## 📊 Dashboard do Supabase Local

Acesse: **http://localhost:54330**

**Credenciais padrão:**
- Não requer autenticação em local

**Funcionalidades:**
- Ver tabelas e dados
- Executar queries SQL
- Monitorar logs
- Ver policies aplicadas

---

## 🐛 Troubleshooting

### Erro: "Function not found"

**Causa:** Edge Functions não estão sendo servidas

**Solução:** Use uma das opções acima (Mock, Deno, ou npx supabase)

### Erro: "RLS policy violation"

**Causa:** Policy está bloqueando operação (comportamento esperado!)

**Solução:**
- Se for teste de segurança: ✅ Funciona corretamente
- Se for operação legítima: Verificar se usuário está autenticado e tentando acessar seus próprios dados

### Transação não atualiza automaticamente

**Causa:** Webhook não configurado (normal em local)

**Solução:** Atualizar manualmente via SQL (ver Opção 1)

---

## 🚀 Próximo Passo: Deploy em Staging/Produção

Quando estiver pronto para deploy real:

1. Criar projeto no Supabase Cloud (https://supabase.com)
2. Seguir guia: [DEPLOY_EDGE_FUNCTIONS.md](./DEPLOY_EDGE_FUNCTIONS.md)
3. Configurar webhook no Mercado Pago
4. Atualizar `.env` com URLs de produção

---

## 📝 Checklist de Testes Locais

Antes de fazer deploy em produção, testar:

- [ ] Login/Logout funciona
- [ ] Usuário vê apenas suas próprias transações
- [ ] Usuário NÃO pode alterar status de transação
- [ ] Usuário NÃO pode alterar data de expiração
- [ ] Admin pode ver todos os usuários
- [ ] Admin pode criar/editar assinaturas
- [ ] Dashboard carrega sem erros
- [ ] Performance: queries não demoram >500ms

---

**Última atualização:** 16/11/2025
**Ambiente:** Local (Docker + Supabase)

# 📊 ESTRUTURA DO BANCO DE DADOS - CLIENTE UNIFLIX

Este documento mapeia a estrutura do banco de dados Supabase conforme esperado pelo projeto Cliente Uniflix, baseado no arquivo `database.types.ts` e no uso no código.

---

## 🗄️ TABELAS

### 1. **profiles** (Perfis de Usuários)

**Campos:**
- `id` (string, PK, UUID) - ID do usuário (mesmo do auth.users)
- `full_name` (string, NOT NULL) - Nome completo
- `phone` (string, nullable) - Telefone
- `referral_code` (string, NOT NULL, UNIQUE) - Código único de indicação
- `referred_by` (string, nullable, FK -> profiles.id) - ID de quem indicou
- `total_commission` (number, default: 0) - Total de comissões ganhas
- `created_at` (timestamp) - Data de criação
- `updated_at` (timestamp) - Data de atualização

**Relacionamentos:**
- Um usuário pode ter um referrer (`referred_by`)
- Um usuário pode ter múltiplos referrals (através da tabela `referrals`)

**Funções RPC necessárias:**
- `generate_referral_code()` - Gera código único de indicação

**Uso no código:**
- `src/contexts/AuthContext.tsx:54` - Criação de perfil no cadastro
- `src/pages/Dashboard.tsx:26` - Busca perfil do usuário
- `src/pages/Dashboard.tsx:50` - Busca perfis dos indicados

---

### 2. **subscription_plans** (Planos de Assinatura)

**Campos:**
- `id` (string, PK, UUID)
- `name` (string, NOT NULL) - Nome do plano
- `description` (string, nullable) - Descrição
- `plan_type` (enum, NOT NULL) - Tipo: `'ponto_unico' | 'ponto_duplo' | 'ponto_triplo'`
- `simultaneous_logins` (number) - Número de logins simultâneos
- `app_logins` (jsonb) - Configurações de login por app
- `active` (boolean) - Se o plano está ativo
- `created_at` (timestamp)

**Relacionamentos:**
- Um plano pode ter múltiplas assinaturas (`user_subscriptions`)

**Uso no código:**
- `src/pages/Dashboard.tsx:35` - Join com `user_subscriptions` para buscar plano

---

### 3. **recharge_prices** (Preços de Recarga)

**Campos:**
- `id` (string, PK, UUID)
- `plan_type` (enum, NOT NULL) - Tipo: `'ponto_unico' | 'ponto_duplo' | 'ponto_triplo'`
- `period` (enum, NOT NULL) - Período: `'monthly' | 'quarterly' | 'semi_annual' | 'annual'`
- `period_label` (string, NOT NULL) - Label exibido (ex: "Mensal", "Trimestral")
- `duration_days` (number, NOT NULL) - Duração em dias
- `price` (number, NOT NULL) - Preço em reais
- `created_at` (timestamp)

**Uso no código:**
- `src/components/Dashboard/PaymentCard.tsx:38` - Busca preços por `plan_type`

---

### 4. **user_subscriptions** (Assinaturas dos Usuários)

**Campos:**
- `id` (string, PK, UUID)
- `user_id` (string, NOT NULL, FK -> profiles.id)
- `plan_id` (string, NOT NULL, FK -> subscription_plans.id)
- `status` (enum, NOT NULL) - Status: `'active' | 'expired' | 'cancelled'`
- `app_username` (string, NOT NULL) - Username do app de streaming
- `app_password` (string, NOT NULL) - Senha do app (⚠️ armazenada em plain text)
- `expiration_date` (timestamp, nullable) - Data de expiração
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relacionamentos:**
- `user_id` -> `profiles.id`
- `plan_id` -> `subscription_plans.id`

**Uso no código:**
- `src/pages/Dashboard.tsx:32` - Busca assinatura ativa do usuário
- `src/components/Dashboard/SubscriptionCard.tsx` - Exibe dados da assinatura

**⚠️ Problema de Segurança:**
- `app_password` está em plain text (deveria ser criptografada)

---

### 5. **transactions** (Transações/Pagamentos)

**Campos:**
- `id` (string, PK, UUID)
- `user_id` (string, NOT NULL, FK -> profiles.id)
- `type` (enum, NOT NULL) - Tipo: `'subscription' | 'recharge' | 'commission_payout'`
- `amount` (number, NOT NULL) - Valor em reais
- `payment_method` (enum, nullable) - Método: `'pix' | 'credit_card' | 'debit_card' | null`
- `status` (enum, NOT NULL) - Status: `'pending' | 'completed' | 'failed'`
- `description` (string, nullable) - Descrição da transação
- `metadata` (jsonb) - Dados adicionais (ex: `period`, `duration_days`)
- `created_at` (timestamp)

**Relacionamentos:**
- `user_id` -> `profiles.id`

**Uso no código:**
- `src/components/Dashboard/PaymentCard.tsx:59` - Cria transação de recarga
- `src/pages/Dashboard.tsx:56` - Busca transações dos indicados
- `src/pages/Dashboard.tsx:73` - Busca histórico de transações do usuário
- `src/components/Dashboard/TransactionsCard.tsx` - Exibe histórico

**🚨 VULNERABILIDADE CRÍTICA:**
- Frontend define `status: 'completed'` diretamente (linha 64 do PaymentCard.tsx)
- Deveria ser `'pending'` e atualizado via webhook do gateway de pagamento

---

### 6. **referrals** (Indicações)

**Campos:**
- `id` (string, PK, UUID)
- `referrer_id` (string, NOT NULL, FK -> profiles.id) - Quem indicou
- `referred_id` (string, NOT NULL, FK -> profiles.id) - Quem foi indicado
- `total_commission_earned` (number, default: 0) - Total de comissão ganha
- `last_commission_date` (timestamp, nullable) - Data da última comissão
- `created_at` (timestamp)

**Relacionamentos:**
- `referrer_id` -> `profiles.id` (quem indicou)
- `referred_id` -> `profiles.id` (quem foi indicado)

**Uso no código:**
- `src/contexts/AuthContext.tsx:63` - Cria referral no cadastro
- `src/pages/Dashboard.tsx:42` - Busca referrals do usuário
- `src/components/Dashboard/ReferralCard.tsx` - Exibe programa de indicações

**⚠️ Problema de Performance:**
- Loop N+1 no Dashboard.tsx (linhas 48-70) - carrega perfis e transações um por um
- Deveria usar join único

---

### 7. **raffles** (Sorteios Mensais)

**Campos:**
- `id` (string, PK, UUID)
- `month` (string, NOT NULL) - Mês no formato 'YYYY-MM-01' (primeiro dia do mês)
- `prize_amount` (number) - Valor do prêmio em reais
- `winner_id` (string, nullable, FK -> profiles.id) - ID do ganhador
- `winning_number` (number, nullable) - Número da sorte vencedor
- `draw_date` (timestamp, nullable) - Data do sorteio
- `status` (enum) - Status: `'active' | 'drawn' | 'paid'`
- `created_at` (timestamp)

**Relacionamentos:**
- `winner_id` -> `profiles.id`

**Uso no código:**
- `src/pages/Dashboard.tsx:84` - Busca sorteio do mês atual
- `src/components/Dashboard/RaffleCard.tsx` - Exibe sorteio

---

### 8. **raffle_entries** (Participações no Sorteio)

**Campos:**
- `id` (string, PK, UUID)
- `raffle_id` (string, NOT NULL, FK -> raffles.id)
- `user_id` (string, NOT NULL, FK -> profiles.id)
- `lucky_number` (number, NOT NULL) - Número da sorte
- `reason` (enum, NOT NULL) - Motivo: `'payment' | 'referral'`
- `created_at` (timestamp)

**Relacionamentos:**
- `raffle_id` -> `raffles.id`
- `user_id` -> `profiles.id`

**Uso no código:**
- `src/pages/Dashboard.tsx:92` - Busca participações do usuário no sorteio
- `src/components/Dashboard/RaffleCard.tsx` - Exibe números da sorte do usuário

---

## 🔗 RELACIONAMENTOS ENTRE TABELAS

```
profiles (1) ──< referrals >── (N) profiles
  │
  ├──< user_subscriptions (N)
  │      └──> subscription_plans (1)
  │
  ├──< transactions (N)
  │
  ├──< raffle_entries (N)
  │      └──> raffles (1)
  │
  └──> profiles (1) [referred_by]

recharge_prices ──> (sem FK, relacionado por plan_type)
```

---

## 🔧 FUNÇÕES RPC NECESSÁRIAS

### `generate_referral_code()`
**Descrição:** Gera um código único de indicação

**Retorno:** `string` - Código gerado

**Uso:**
- `src/contexts/AuthContext.tsx:41` - Chamado no cadastro de novo usuário

**Implementação esperada:**
```sql
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
BEGIN
  LOOP
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_code);
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔐 ROW LEVEL SECURITY (RLS)

**Importante:** O projeto assume que RLS está configurado no Supabase. As políticas devem permitir:

1. **profiles:**
   - SELECT: Usuário pode ver apenas seu próprio perfil
   - UPDATE: Usuário pode atualizar apenas seu próprio perfil
   - INSERT: Apenas durante cadastro (via trigger ou função)

2. **user_subscriptions:**
   - SELECT: Usuário pode ver apenas suas próprias assinaturas
   - UPDATE: Bloqueado para usuários (apenas admin)

3. **transactions:**
   - SELECT: Usuário pode ver apenas suas próprias transações
   - INSERT: Usuário pode criar transações (mas não atualizar status)
   - UPDATE: Bloqueado para usuários (apenas admin ou webhook)

4. **referrals:**
   - SELECT: Usuário pode ver apenas referrals onde é referrer
   - INSERT: Apenas durante cadastro

5. **raffles:**
   - SELECT: Todos podem ver sorteios ativos
   - UPDATE: Apenas admin

6. **raffle_entries:**
   - SELECT: Usuário pode ver apenas suas próprias participações
   - INSERT: Apenas via trigger/função

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. **Vulnerabilidade de Segurança - Status de Pagamento**
- **Local:** `src/components/Dashboard/PaymentCard.tsx:64`
- **Problema:** Frontend define `status: 'completed'` diretamente
- **Solução:** Criar transação com `status: 'pending'` e atualizar via webhook

### 2. **Senha de App em Plain Text**
- **Tabela:** `user_subscriptions.app_password`
- **Problema:** Armazenada sem criptografia
- **Solução:** Criptografar com `pgcrypto` (AES-256)

### 3. **Performance - N+1 Queries**
- **Local:** `src/pages/Dashboard.tsx:48-70`
- **Problema:** Loop carregando referrals um por um
- **Solução:** Usar join único com `.select()`

### 4. **Falta de Validação de Variáveis de Ambiente**
- **Local:** `src/lib/supabase.ts:4-5`
- **Problema:** Não valida se variáveis existem
- **Solução:** Adicionar validação

---

## 📋 CHECKLIST DE ADAPTAÇÃO

Ao adaptar o projeto para o banco existente, verificar:

- [ ] Todas as 8 tabelas existem com os campos corretos
- [ ] Tipos ENUM estão corretos (`plan_type`, `status`, `type`, etc.)
- [ ] Foreign Keys estão configuradas
- [ ] Função RPC `generate_referral_code()` existe
- [ ] RLS está configurado corretamente
- [ ] Triggers para atualizar `updated_at` existem
- [ ] Índices nas colunas de busca (referral_code, user_id, etc.)
- [ ] Valores padrão estão corretos (total_commission, status, etc.)

---

## 🔄 ALTERAÇÕES MÍNIMAS NECESSÁRIAS

Para evitar conflitos com o painel admin, as alterações devem ser **mínimas**:

1. **Apenas adicionar campos se não existirem** (não remover campos existentes)
2. **Criar funções RPC se não existirem** (não modificar existentes)
3. **Adicionar políticas RLS** (não remover políticas do admin)
4. **Criar índices** (não afeta funcionalidade existente)
5. **Não modificar estrutura de tabelas existentes** (apenas adicionar campos opcionais se necessário)

---

**Documento gerado em:** 2025-01-27
**Baseado em:** `src/lib/database.types.ts` e análise do código












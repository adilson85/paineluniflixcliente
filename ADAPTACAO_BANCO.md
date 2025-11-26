# 🔧 GUIA DE ADAPTAÇÃO DO PROJETO AO BANCO DE DADOS

Este guia explica como adaptar o projeto Cliente Uniflix para funcionar com o banco de dados existente (usado pelo painel admin).

---

## 🎯 ESTRATÉGIA DE ADAPTAÇÃO

Ao invés de modificar o banco (que pode quebrar o admin), vamos **adaptar o código** para funcionar com a estrutura existente.

---

## 📋 PASSO 1: VERIFICAR ESTRUTURA ATUAL

Execute no Supabase SQL Editor:

```sql
-- Listar todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Para cada tabela, verificar campos:
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'NOME_DA_TABELA'
ORDER BY ordinal_position;
```

**Tabelas que o projeto precisa:**
- `profiles` (ou similar)
- `subscription_plans` (ou similar)
- `recharge_prices` (ou similar)
- `user_subscriptions` (ou similar)
- `transactions` (ou similar)
- `referrals` (ou similar)
- `raffles` (ou similar)
- `raffle_entries` (ou similar)

---

## 📋 PASSO 2: MAPEAR DIFERENÇAS

Crie um arquivo `src/lib/db-config.ts` com o mapeamento:

```typescript
export const DB_CONFIG = {
  // Nomes das tabelas (se diferentes)
  tables: {
    profiles: 'profiles', // ou 'users', 'user_profiles', etc.
    subscription_plans: 'subscription_plans',
    // ... mapear todas
  },
  
  // Campos que podem ter nomes diferentes
  fields: {
    profiles: {
      full_name: 'name', // se o banco usa 'name' ao invés de 'full_name'
      // ... outros campos
    },
    // ... outras tabelas
  },
};
```

---

## 📋 PASSO 3: ADAPTAR CÓDIGO

### 3.1. Usar o Adaptador de Banco

O arquivo `src/lib/db-adapter.ts` foi criado para ajudar. Use-o assim:

```typescript
import { adaptiveSelect, generateReferralCode } from './lib/db-adapter';

// Ao invés de:
const { data } = await supabase.from('profiles').select('full_name, phone');

// Use:
const { data } = await adaptiveSelect('profiles', ['full_name', 'phone']);
```

### 3.2. Tornar Campos Opcionais

Se um campo não existir no banco, torne-o opcional no código:

```typescript
// Antes:
const fullName = profile.full_name;

// Depois:
const fullName = profile.full_name || profile.name || 'Sem nome';
```

### 3.3. Tratar Funções RPC Ausentes

Se `generate_referral_code()` não existir, o adaptador gera localmente:

```typescript
// Já está adaptado em AuthContext.tsx
const referralCode = await generateReferralCode();
```

---

## 📋 PASSO 4: ADAPTAÇÕES ESPECÍFICAS

### 4.1. Tabela `profiles`

**Se não existir:**
- Criar view ou usar tabela de usuários existente
- Ou criar tabela apenas se não existir (migração condicional)

**Se campos forem diferentes:**
- `full_name` → pode ser `name`, `nome`, `fullName`
- `referral_code` → pode não existir (gerar no código)
- `referred_by` → pode não existir (sistema de indicação opcional)

### 4.2. Tabela `transactions`

**Se não existir:**
- Pode ser `payments`, `pagamentos`, `orders`
- Adaptar queries para usar nome correto

**Se campos forem diferentes:**
- `payment_method` → pode ser `method`, `metodo_pagamento`
- `status` → pode ser `payment_status`, `estado`

### 4.3. Função `generate_referral_code()`

**Se não existir:**
- O adaptador já gera código localmente
- Ou criar função no banco (não afeta admin)

---

## 📋 PASSO 5: TESTAR ADAPTAÇÕES

1. **Testar cada funcionalidade:**
   - [ ] Login/Cadastro
   - [ ] Visualizar perfil
   - [ ] Ver assinatura
   - [ ] Fazer recarga
   - [ ] Ver indicações
   - [ ] Ver transações
   - [ ] Ver sorteio

2. **Verificar erros no console:**
   - Campos não encontrados
   - Tabelas não encontradas
   - Tipos incompatíveis

3. **Ajustar conforme necessário**

---

## 🔧 EXEMPLOS DE ADAPTAÇÃO

### Exemplo 1: Campo com nome diferente

```typescript
// Antes (database.types.ts espera 'full_name')
const name = profile.full_name;

// Depois (adapta se necessário)
const name = profile.full_name || profile.name || profile.nome || 'Sem nome';
```

### Exemplo 2: Tabela com nome diferente

```typescript
// Antes
const { data } = await supabase.from('transactions').select('*');

// Depois
const tableName = DB_CONFIG.tables.transactions || 'transactions';
const { data } = await supabase.from(tableName).select('*');
```

### Exemplo 3: Campo opcional que não existe

```typescript
// Antes
const phone = profile.phone;

// Depois
const phone = profile.phone || profile.telefone || null;
```

---

## ⚠️ PRECAUÇÕES

1. **Não modificar tabelas existentes** - apenas ler/inserir
2. **Não remover campos** - apenas adaptar leitura
3. **Testar com dados reais** - não apenas estrutura vazia
4. **Verificar RLS** - políticas podem bloquear acesso
5. **Backup antes de mudanças** - sempre fazer backup

---

## 📝 CHECKLIST DE ADAPTAÇÃO

- [ ] Verificar estrutura atual do banco
- [ ] Mapear diferenças de nomes de tabelas
- [ ] Mapear diferenças de nomes de campos
- [ ] Adaptar `database.types.ts` se necessário
- [ ] Usar `db-adapter.ts` nas queries
- [ ] Tornar campos opcionais onde necessário
- [ ] Testar todas as funcionalidades
- [ ] Documentar diferenças encontradas
- [ ] Criar fallbacks para campos ausentes

---

## 🚀 PRÓXIMOS PASSOS

1. Execute as queries de verificação no Supabase
2. Compare com `ESTRUTURA_BANCO_DADOS.md`
3. Crie `src/lib/db-config.ts` com mapeamentos
4. Adapte os arquivos principais usando o adaptador
5. Teste cada funcionalidade

---

**Lembre-se:** O objetivo é fazer o código funcionar com o banco existente, não modificar o banco!












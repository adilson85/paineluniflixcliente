# 🔍 COMO VERIFICAR A ESTRUTURA DO BANCO DE DADOS

Este guia ajuda a verificar se o banco de dados Supabase está compatível com o projeto Cliente Uniflix.

---

## 📋 MÉTODO 1: Via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Database** > **Tables**
4. Verifique se todas as 8 tabelas existem:
   - `profiles`
   - `subscription_plans`
   - `recharge_prices`
   - `user_subscriptions`
   - `transactions`
   - `referrals`
   - `raffles`
   - `raffle_entries`

5. Para cada tabela, verifique os campos conforme `ESTRUTURA_BANCO_DADOS.md`

---

## 📋 MÉTODO 2: Via SQL Editor no Supabase

Execute estas queries para verificar a estrutura:

### Verificar todas as tabelas:
```sql
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Verificar campos de uma tabela específica:
```sql
-- Exemplo: verificar tabela profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

### Verificar funções RPC:
```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';
```

### Verificar se generate_referral_code existe:
```sql
SELECT EXISTS (
  SELECT 1 
  FROM pg_proc 
  WHERE proname = 'generate_referral_code'
) AS function_exists;
```

### Verificar índices:
```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Verificar Foreign Keys:
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

---

## 📋 MÉTODO 3: Via Código TypeScript (Temporário)

Crie um arquivo temporário para verificar:

```typescript
// verificar-banco.ts (temporário)
import { supabase } from './src/lib/supabase';

async function verificarBanco() {
  console.log('🔍 Verificando estrutura do banco...\n');

  // Verificar tabelas
  const tabelas = ['profiles', 'subscription_plans', 'recharge_prices', 
                   'user_subscriptions', 'transactions', 'referrals', 
                   'raffles', 'raffle_entries'];

  for (const tabela of tabelas) {
    const { data, error } = await supabase
      .from(tabela)
      .select('*')
      .limit(0);
    
    if (error) {
      console.log(`❌ ${tabela}: ERRO - ${error.message}`);
    } else {
      console.log(`✅ ${tabela}: OK`);
    }
  }

  // Verificar função RPC
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('generate_referral_code');

  if (rpcError) {
    console.log(`\n❌ generate_referral_code(): ERRO - ${rpcError.message}`);
  } else {
    console.log(`\n✅ generate_referral_code(): OK - Retornou: ${rpcData}`);
  }
}

verificarBanco();
```

Execute com: `npx tsx verificar-banco.ts`

---

## 📋 MÉTODO 4: Comparar com database.types.ts

O arquivo `src/lib/database.types.ts` contém a estrutura esperada. Compare:

1. **Campos obrigatórios** (NOT NULL) devem existir
2. **Tipos ENUM** devem corresponder
3. **Relacionamentos** (FK) devem estar configurados

---

## ⚠️ CHECKLIST DE COMPATIBILIDADE

Marque conforme verificar:

### Tabelas:
- [ ] `profiles` - Existe e tem todos os campos
- [ ] `subscription_plans` - Existe e tem todos os campos
- [ ] `recharge_prices` - Existe e tem todos os campos
- [ ] `user_subscriptions` - Existe e tem todos os campos
- [ ] `transactions` - Existe e tem todos os campos
- [ ] `referrals` - Existe e tem todos os campos
- [ ] `raffles` - Existe e tem todos os campos
- [ ] `raffle_entries` - Existe e tem todos os campos

### Funções:
- [ ] `generate_referral_code()` - Existe e funciona

### Índices (opcional, mas recomendado):
- [ ] `idx_profiles_referral_code` - Para busca rápida
- [ ] `idx_referrals_referrer_id` - Para listar indicados
- [ ] `idx_transactions_user_id_created_at` - Para histórico

### RLS (Row Level Security):
- [ ] Políticas configuradas para `profiles`
- [ ] Políticas configuradas para `user_subscriptions`
- [ ] Políticas configuradas para `transactions`
- [ ] Políticas configuradas para `referrals`
- [ ] Políticas configuradas para `raffles`
- [ ] Políticas configuradas para `raffle_entries`

---

## 🔧 SE ALGO ESTIVER FALTANDO

1. **Tabela não existe:** Criar conforme `ESTRUTURA_BANCO_DADOS.md`
2. **Campo não existe:** Adicionar com `ALTER TABLE` (se compatível com admin)
3. **Função não existe:** Executar `supabase/migrations/001_verificar_estrutura.sql`
4. **Índice não existe:** Executar script de migração
5. **RLS não configurado:** Configurar políticas sem afetar admin

---

## 📝 NOTAS IMPORTANTES

- ⚠️ **NÃO REMOVER** campos existentes que o admin usa
- ⚠️ **NÃO MODIFICAR** estrutura de tabelas existentes
- ✅ **APENAS ADICIONAR** o que está faltando
- ✅ **VERIFICAR** se campos opcionais podem ser NULL
- ✅ **TESTAR** após cada alteração

---

**Próximo passo:** Após verificar, adapte o código se necessário ou execute as migrações faltantes.












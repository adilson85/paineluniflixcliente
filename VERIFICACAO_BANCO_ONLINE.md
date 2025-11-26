# 🔍 Verificação do Banco de Dados Online

## ❌ Campos Faltantes na Tabela `testes_liberados`

O código do projeto espera os seguintes campos que **NÃO existem** no schema fornecido:

### Campos Necessários:
1. **`email`** (text, nullable)
   - Usado em: `src/pages/Dashboard.tsx`, `src/pages/ReferralSignUp.tsx`
   - Necessário para buscar usuários e verificar assinantes

2. **`dispositivo`** (text, nullable)
   - Usado em: `src/pages/ReferralSignUp.tsx`
   - Armazena o dispositivo selecionado para teste

3. **`referral_code`** (text, nullable)
   - Usado em: `src/pages/Dashboard.tsx`, `src/pages/ReferralSignUp.tsx`
   - Armazena o código de indicação usado na solicitação

## ✅ Campos que Estão Corretos

- `users` - ✅ Todos os campos necessários existem
- `subscriptions` - ✅ Todos os campos necessários existem
- `subscription_plans` - ✅ Todos os campos necessários existem
- `recharge_options` - ✅ Todos os campos necessários existem (usa `duration_months`)
- `transactions` - ✅ Todos os campos necessários existem
- `referrals` - ✅ Todos os campos necessários existem

## 🔧 Como Corrigir

### Opção 1: Executar a Migração SQL

Execute o arquivo `supabase/migrations/20250117_add_testes_liberados_fields.sql` no Supabase SQL Editor:

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo de migração
4. Execute

### Opção 2: Adicionar Manualmente

Execute estes comandos SQL no Supabase SQL Editor:

```sql
-- Adiciona campo email
ALTER TABLE public.testes_liberados 
ADD COLUMN IF NOT EXISTS email text;

-- Adiciona campo dispositivo
ALTER TABLE public.testes_liberados 
ADD COLUMN IF NOT EXISTS dispositivo text;

-- Adiciona campo referral_code
ALTER TABLE public.testes_liberados 
ADD COLUMN IF NOT EXISTS referral_code text;

-- Adiciona campo anotacoes na tabela users (se ainda não existir)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS anotacoes text;
```

## 📋 Verificação Pós-Correção

Após aplicar as migrações, verifique se os campos foram criados:

```sql
-- Verifica colunas da tabela testes_liberados
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'testes_liberados'
ORDER BY ordinal_position;

-- Verifica se anotacoes existe em users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name = 'anotacoes';
```

## ⚠️ Importante

- Os campos `email`, `dispositivo` e `referral_code` são **nullable** (podem ser NULL)
- Dados existentes na tabela `testes_liberados` não serão afetados
- O campo `anotacoes` em `users` já deveria existir se a migração `20250117_add_anotacoes_field.sql` foi aplicada



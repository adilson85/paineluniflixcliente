-- ============================================
-- VERIFICAÇÃO: Constraint UNIQUE em referral_code
-- ============================================
-- Execute este SQL no SQL Editor do Supabase para verificar

-- Verifica se a constraint existe
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'users'
  AND conname LIKE '%referral_code%';

-- Resultado esperado:
-- constraint_name: users_referral_code_unique
-- constraint_type: u (UNIQUE)
-- constraint_definition: UNIQUE (referral_code)

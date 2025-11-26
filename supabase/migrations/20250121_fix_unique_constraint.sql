-- ============================================
-- FIX: Adiciona constraint UNIQUE (versão simplificada)
-- ============================================

-- Remove constraint se existir (caso tenha sido criada com erro)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_referral_code_unique;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_referral_code_key;

-- Adiciona constraint UNIQUE de forma simples e direta
ALTER TABLE users ADD CONSTRAINT users_referral_code_unique UNIQUE (referral_code);

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Constraint UNIQUE adicionada em users.referral_code';
END $$;

-- ============================================
-- ADICIONA CONSTRAINT UNIQUE em referral_code
-- ============================================
-- Garante que não existam códigos de indicação duplicados
-- a nível de banco de dados

-- Primeiro, verifica se há códigos duplicados existentes
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT referral_code, COUNT(*) as count
    FROM users
    WHERE referral_code IS NOT NULL
    GROUP BY referral_code
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE NOTICE '⚠️ Atenção: Existem % códigos duplicados!', duplicate_count;
    RAISE NOTICE 'Execute a query abaixo para identificá-los:';
    RAISE NOTICE 'SELECT referral_code, COUNT(*) as count FROM users WHERE referral_code IS NOT NULL GROUP BY referral_code HAVING COUNT(*) > 1;';
    RAISE EXCEPTION 'Corrija os códigos duplicados antes de adicionar a constraint UNIQUE';
  ELSE
    RAISE NOTICE '✅ Nenhum código duplicado encontrado. Prosseguindo...';
  END IF;
END $$;

-- Adiciona a constraint UNIQUE (apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_referral_code_unique'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_referral_code_unique UNIQUE (referral_code);

    RAISE NOTICE '✅ Constraint UNIQUE adicionada com sucesso em users.referral_code';
  ELSE
    RAISE NOTICE 'ℹ️ Constraint users_referral_code_unique já existe';
  END IF;
END $$;

-- Comentário para documentação
COMMENT ON CONSTRAINT users_referral_code_unique ON users IS 'Garante que cada código de indicação seja único no sistema';

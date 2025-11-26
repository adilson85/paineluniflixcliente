-- ============================================
-- FIX: Corrige função generate_referral_code
-- ============================================
-- Problema: A função estava verificando a tabela 'profiles'
-- mas a tabela real é 'users'
-- Solução: Atualizar a função para usar 'users'

-- Remove a função antiga
DROP FUNCTION IF EXISTS generate_referral_code();

-- Cria a função corrigida
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  exists_check BOOLEAN;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Incrementa contador de tentativas
    attempt_count := attempt_count + 1;

    -- Segurança: evita loop infinito
    IF attempt_count > max_attempts THEN
      RAISE EXCEPTION 'Não foi possível gerar código único após % tentativas', max_attempts;
    END IF;

    -- Gera código de 8 caracteres alfanuméricos
    new_code := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || NOW()::TEXT || RANDOM()::TEXT || attempt_count::TEXT)
        FROM 1 FOR 8
      )
    );

    -- Verifica se já existe na tabela USERS (não profiles!)
    SELECT EXISTS(
      SELECT 1 FROM users WHERE referral_code = new_code
    ) INTO exists_check;

    -- Se não existe, retorna o código
    EXIT WHEN NOT exists_check;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário atualizado
COMMENT ON FUNCTION generate_referral_code() IS 'Gera código único de indicação de 8 caracteres (verifica na tabela users)';

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Função generate_referral_code() atualizada com sucesso!';
END $$;

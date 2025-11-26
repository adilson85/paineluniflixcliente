-- Adiciona campos faltantes na tabela testes_liberados
-- Esses campos são usados pelo código do cliente Uniflix

-- Adiciona campo email (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'testes_liberados' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.testes_liberados 
    ADD COLUMN email text;
  END IF;
END $$;

-- Adiciona campo dispositivo (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'testes_liberados' 
    AND column_name = 'dispositivo'
  ) THEN
    ALTER TABLE public.testes_liberados 
    ADD COLUMN dispositivo text;
  END IF;
END $$;

-- Adiciona campo referral_code (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'testes_liberados' 
    AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE public.testes_liberados 
    ADD COLUMN referral_code text;
  END IF;
END $$;

-- Adiciona campo anotacoes na tabela users (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'anotacoes'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN anotacoes text;
  END IF;
END $$;

-- Comentários para documentação
COMMENT ON COLUMN public.testes_liberados.email IS 'Email do solicitante do teste';
COMMENT ON COLUMN public.testes_liberados.dispositivo IS 'Dispositivo selecionado para o teste';
COMMENT ON COLUMN public.testes_liberados.referral_code IS 'Código de indicação usado na solicitação';
COMMENT ON COLUMN public.users.anotacoes IS 'Campo para anotações internas (não visível no frontend)';



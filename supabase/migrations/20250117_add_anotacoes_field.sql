-- ============================================================
-- Adicionar campo de anotações na tabela users
-- Campo para uso interno (não aparece no frontend do cliente)
-- ============================================================

-- Adiciona o campo anotacoes (TEXT) na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS anotacoes TEXT;

-- Comentário explicativo
COMMENT ON COLUMN users.anotacoes IS 'Campo de anotações internas para uso administrativo. Não é exibido no frontend do cliente.';






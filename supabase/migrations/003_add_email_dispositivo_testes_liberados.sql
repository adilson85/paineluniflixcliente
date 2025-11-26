-- Adiciona colunas email e dispositivo na tabela testes_liberados

-- Adiciona coluna email
ALTER TABLE testes_liberados 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Adiciona coluna dispositivo (para armazenar o dispositivo selecionado separadamente)
ALTER TABLE testes_liberados 
ADD COLUMN IF NOT EXISTS dispositivo TEXT;

-- Adiciona coluna referral_code (para rastrear qual código de indicação foi usado)
ALTER TABLE testes_liberados 
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);

-- Comentários
COMMENT ON COLUMN testes_liberados.email IS 'E-mail do solicitante para envio de convite ao painel de indicação';
COMMENT ON COLUMN testes_liberados.dispositivo IS 'Dispositivo selecionado no formulário (ex: TV Smart Samsung)';
COMMENT ON COLUMN testes_liberados.referral_code IS 'Código de indicação usado no link';

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_testes_liberados_email ON testes_liberados(email);
CREATE INDEX IF NOT EXISTS idx_testes_liberados_referral_code ON testes_liberados(referral_code);










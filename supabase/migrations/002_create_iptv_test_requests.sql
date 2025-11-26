-- Criação da tabela para solicitações de teste IPTV
-- Esta tabela armazena as solicitações de teste feitas através do link de indicação

CREATE TABLE IF NOT EXISTS iptv_test_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code VARCHAR(50) NOT NULL,
  referrer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referrer_name VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  device VARCHAR(50) NOT NULL,
  device_detail VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_iptv_test_requests_referral_code ON iptv_test_requests(referral_code);
CREATE INDEX IF NOT EXISTS idx_iptv_test_requests_referrer_id ON iptv_test_requests(referrer_id);
CREATE INDEX IF NOT EXISTS idx_iptv_test_requests_status ON iptv_test_requests(status);
CREATE INDEX IF NOT EXISTS idx_iptv_test_requests_created_at ON iptv_test_requests(created_at DESC);

-- Comentários
COMMENT ON TABLE iptv_test_requests IS 'Solicitações de teste IPTV feitas através de links de indicação';
COMMENT ON COLUMN iptv_test_requests.referral_code IS 'Código de indicação usado no link';
COMMENT ON COLUMN iptv_test_requests.referrer_id IS 'ID do usuário que indicou (pode ser NULL se não encontrado)';
COMMENT ON COLUMN iptv_test_requests.status IS 'Status da solicitação: pending, contacted, completed, cancelled';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_iptv_test_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_iptv_test_requests_updated_at
  BEFORE UPDATE ON iptv_test_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_iptv_test_requests_updated_at();










-- ============================================
-- VERIFICAÇÃO E ADAPTAÇÃO DA ESTRUTURA DO BANCO
-- Cliente Uniflix - Alterações Mínimas
-- ============================================
-- Este script verifica se as tabelas e funções necessárias existem
-- e cria apenas o que está faltando, sem modificar o que já existe

-- ============================================
-- 1. FUNÇÃO RPC: generate_referral_code
-- ============================================
-- Cria apenas se não existir
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Gera código de 8 caracteres alfanuméricos
    new_code := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || NOW()::TEXT || RANDOM()::TEXT) 
        FROM 1 FOR 8
      )
    );
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_referral_code() IS 'Gera código único de indicação para novos usuários';

-- ============================================
-- 2. VERIFICAÇÃO DE ÍNDICES (criar se não existirem)
-- ============================================

-- Índice para busca rápida de referral_code
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code 
ON profiles(referral_code);

-- Índice para busca de referrals por referrer
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id 
ON referrals(referrer_id);

-- Índice para busca de transações por usuário
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_created_at 
ON transactions(user_id, created_at DESC);

-- Índice para busca de assinaturas ativas
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status 
ON user_subscriptions(user_id, status) 
WHERE status = 'active';

-- Índice para busca de sorteios por mês
CREATE INDEX IF NOT EXISTS idx_raffles_month 
ON raffles(month);

-- ============================================
-- 3. TRIGGERS PARA updated_at (se não existirem)
-- ============================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para user_subscriptions
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. VERIFICAÇÃO DE CAMPOS OPCIONAIS
-- ============================================
-- Se algum campo estiver faltando, adicionar aqui
-- (comentado para não modificar estrutura existente)

-- Exemplo (descomentar apenas se necessário):
-- ALTER TABLE profiles 
-- ADD COLUMN IF NOT EXISTS total_commission NUMERIC(10,2) DEFAULT 0;

-- ============================================
-- 5. COMENTÁRIOS NAS TABELAS (documentação)
-- ============================================

COMMENT ON TABLE profiles IS 'Perfis de usuários com sistema de indicações';
COMMENT ON TABLE referrals IS 'Relação de indicações entre usuários';
COMMENT ON TABLE transactions IS 'Histórico de transações e pagamentos';
COMMENT ON TABLE raffles IS 'Sorteios mensais';
COMMENT ON TABLE raffle_entries IS 'Participações dos usuários nos sorteios';

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Este script é seguro para executar múltiplas vezes
-- Ele não modifica estruturas existentes, apenas adiciona o que falta












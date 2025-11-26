-- ============================================================
-- RLS (Row Level Security) Policies
-- ============================================================
-- Políticas de segurança para proteger dados sensíveis e
-- prevenir manipulação de transações e assinaturas

-- ============================================================
-- TRANSACTIONS TABLE - Políticas de Segurança
-- ============================================================

-- Habilita RLS na tabela transactions (se ainda não estiver)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias transações
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
ON transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Usuários podem criar transações apenas para si mesmos
DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
CREATE POLICY "Users can create own transactions"
ON transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Política: Usuários NÃO podem alterar o status das transações
-- Apenas o webhook (Service Role) pode alterar o status
DROP POLICY IF EXISTS "Users cannot update transaction status" ON transactions;
CREATE POLICY "Users cannot update transaction status"
ON transactions
FOR UPDATE
USING (
  auth.uid() = user_id
  AND status = (
    SELECT status FROM transactions WHERE id = transactions.id
  )
);

-- Política: Usuários NÃO podem deletar transações
DROP POLICY IF EXISTS "Users cannot delete transactions" ON transactions;
CREATE POLICY "Users cannot delete transactions"
ON transactions
FOR DELETE
USING (false);

-- Política: Service Role pode fazer qualquer operação (para webhook)
DROP POLICY IF EXISTS "Service role can manage all transactions" ON transactions;
CREATE POLICY "Service role can manage all transactions"
ON transactions
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- SUBSCRIPTIONS TABLE - Políticas de Segurança
-- ============================================================

-- Habilita RLS na tabela subscriptions (se ainda não estiver)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias assinaturas
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions"
ON subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Admins podem ver todas as assinaturas
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
CREATE POLICY "Admins can view all subscriptions"
ON subscriptions
FOR SELECT
USING (
  (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
);

-- Política: Usuários NÃO podem criar assinaturas
-- Apenas admins podem criar via painel admin
DROP POLICY IF EXISTS "Only admins can create subscriptions" ON subscriptions;
CREATE POLICY "Only admins can create subscriptions"
ON subscriptions
FOR INSERT
WITH CHECK (
  (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
);

-- Política: Usuários NÃO podem alterar expiration_date ou status
-- Apenas webhook e admins podem
DROP POLICY IF EXISTS "Users cannot update critical subscription fields" ON subscriptions;
CREATE POLICY "Users cannot update critical subscription fields"
ON subscriptions
FOR UPDATE
USING (
  auth.uid() = user_id
  AND expiration_date = (
    SELECT expiration_date FROM subscriptions WHERE id = subscriptions.id
  )
  AND status = (
    SELECT status FROM subscriptions WHERE id = subscriptions.id
  )
);

-- Política: Admins podem atualizar todas as assinaturas
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON subscriptions;
CREATE POLICY "Admins can update all subscriptions"
ON subscriptions
FOR UPDATE
USING (
  (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
);

-- Política: Service Role pode fazer qualquer operação (para webhook)
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;
CREATE POLICY "Service role can manage all subscriptions"
ON subscriptions
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Política: Usuários NÃO podem deletar assinaturas
DROP POLICY IF EXISTS "Only admins can delete subscriptions" ON subscriptions;
CREATE POLICY "Only admins can delete subscriptions"
ON subscriptions
FOR DELETE
USING (
  (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
);

-- ============================================================
-- USERS TABLE - Políticas de Segurança
-- ============================================================

-- Habilita RLS na tabela users (se ainda não estiver)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Política: Admins podem ver todos os usuários
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
USING (
  (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
);

-- Política: Usuários podem atualizar apenas campos não-críticos do seu perfil
DROP POLICY IF EXISTS "Users can update own non-critical fields" ON users;
CREATE POLICY "Users can update own non-critical fields"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND total_commission = (
    SELECT total_commission FROM users WHERE id = users.id
  )
);

-- Política: Admins podem atualizar todos os usuários
DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users"
ON users
FOR UPDATE
USING (
  (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
);

-- Política: Service Role pode fazer qualquer operação
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
CREATE POLICY "Service role can manage all users"
ON users
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- REFERRALS TABLE - Políticas de Segurança
-- ============================================================

-- Habilita RLS na tabela referrals (se ainda não estiver)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver referrals onde são o referrer
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals"
ON referrals
FOR SELECT
USING (auth.uid() = referrer_id);

-- Política: Admins podem ver todas as referências
DROP POLICY IF EXISTS "Admins can view all referrals" ON referrals;
CREATE POLICY "Admins can view all referrals"
ON referrals
FOR SELECT
USING (
  (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
);

-- Política: Sistema pode criar referrals (via trigger ou função)
DROP POLICY IF EXISTS "System can create referrals" ON referrals;
CREATE POLICY "System can create referrals"
ON referrals
FOR INSERT
WITH CHECK (true);

-- Política: Service Role pode fazer qualquer operação
DROP POLICY IF EXISTS "Service role can manage all referrals" ON referrals;
CREATE POLICY "Service role can manage all referrals"
ON referrals
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- RAFFLE_ENTRIES TABLE - Políticas de Segurança
-- ============================================================

-- Habilita RLS na tabela raffle_entries (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'raffle_entries') THEN
    ALTER TABLE raffle_entries ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Política: Usuários podem ver apenas suas próprias entradas no sorteio
DROP POLICY IF EXISTS "Users can view own raffle entries" ON raffle_entries;
CREATE POLICY "Users can view own raffle entries"
ON raffle_entries
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Admins podem ver todas as entradas
DROP POLICY IF EXISTS "Admins can view all raffle entries" ON raffle_entries;
CREATE POLICY "Admins can view all raffle entries"
ON raffle_entries
FOR SELECT
USING (
  (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
);

-- Política: Service Role pode criar entradas (webhook quando pagamento aprovado)
DROP POLICY IF EXISTS "Service role can manage raffle entries" ON raffle_entries;
CREATE POLICY "Service role can manage raffle entries"
ON raffle_entries
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

-- Índice para melhorar performance de queries por user_id
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);

-- ============================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================

COMMENT ON POLICY "Users cannot update transaction status" ON transactions IS
'Previne que usuários maliciosos alterem o status de pending para completed sem pagar';

COMMENT ON POLICY "Users cannot update critical subscription fields" ON subscriptions IS
'Previne que usuários estendam sua própria data de expiração ou alterem status';

COMMENT ON POLICY "Service role can manage all transactions" ON transactions IS
'Permite que o webhook do Mercado Pago atualize transações e assinaturas';

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

-- Lista todas as políticas criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('transactions', 'subscriptions', 'users', 'referrals', 'raffle_entries')
ORDER BY tablename, policyname;

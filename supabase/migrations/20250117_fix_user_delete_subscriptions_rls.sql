-- ============================================================
-- CORREÇÃO: Permitir usuários deletarem suas próprias subscriptions
-- Remove todas as políticas conflitantes e cria uma política limpa
-- ============================================================

-- Remove TODAS as políticas de DELETE existentes para evitar conflitos
DROP POLICY IF EXISTS "Only admins can delete subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can delete all subscriptions" ON subscriptions;

-- Nova política: Usuários podem deletar suas próprias subscriptions
-- Verifica se auth.uid() = user_id (o usuário só pode deletar suas próprias subscriptions)
CREATE POLICY "Users can delete own subscriptions"
ON subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Política para admins (mantém funcionalidade admin)
CREATE POLICY "Admins can delete all subscriptions"
ON subscriptions
FOR DELETE
USING (
  (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
);

-- Política para service_role (webhook)
CREATE POLICY "Service role can delete all subscriptions"
ON subscriptions
FOR DELETE
USING (auth.jwt()->>'role' = 'service_role');

-- Verificar se RLS está habilitado
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;






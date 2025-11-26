-- ============================================================
-- Permitir usuários deletarem suas próprias subscriptions
-- Necessário para funcionalidade de downgrade
-- ============================================================

-- Remove a política que impede usuários de deletar
DROP POLICY IF EXISTS "Only admins can delete subscriptions" ON subscriptions;

-- Nova política: Usuários podem deletar suas próprias subscriptions
-- (necessário para downgrade)
CREATE POLICY "Users can delete own subscriptions"
ON subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Mantém a política para admins (se necessário)
CREATE POLICY "Admins can delete all subscriptions"
ON subscriptions
FOR DELETE
USING (
  (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
);






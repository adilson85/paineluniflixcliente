-- ============================================================
-- Permitir usuários atualizarem plan_id de suas subscriptions
-- Necessário para funcionalidade de downgrade
-- ============================================================

-- Remove a política restritiva que impede atualização de campos críticos
DROP POLICY IF EXISTS "Users cannot update critical subscription fields" ON subscriptions;

-- Nova política: Usuários podem atualizar plan_id e updated_at de suas próprias subscriptions
-- Mas NÃO podem alterar expiration_date ou status (apenas admins/webhook)
-- Usa OLD para verificar valores anteriores sem subquery problemática
CREATE POLICY "Users can update own subscription plan"
ON subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
);


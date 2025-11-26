-- ============================================================
-- Corrigir política de UPDATE de subscriptions
-- Remove subqueries problemáticas que causam erro em atualizações em lote
-- ============================================================

-- Remove todas as políticas de UPDATE problemáticas
DROP POLICY IF EXISTS "Users cannot update critical subscription fields" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription plan" ON subscriptions;

-- Nova política simplificada: Usuários podem atualizar plan_id e updated_at
-- A verificação de expiration_date e status será feita via trigger ou função
-- Isso evita o erro "more than one row returned by a subquery" em atualizações em lote
CREATE POLICY "Users can update own subscription plan"
ON subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar trigger para prevenir alteração de expiration_date e status por usuários
-- (opcional, mas recomendado para segurança)
CREATE OR REPLACE FUNCTION prevent_critical_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário tentar alterar expiration_date ou status, mantém os valores antigos
  IF OLD.expiration_date IS DISTINCT FROM NEW.expiration_date THEN
    NEW.expiration_date := OLD.expiration_date;
  END IF;
  
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status := OLD.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger apenas para usuários (não admins)
DROP TRIGGER IF EXISTS prevent_critical_changes_trigger ON subscriptions;
CREATE TRIGGER prevent_critical_changes_trigger
BEFORE UPDATE ON subscriptions
FOR EACH ROW
WHEN (
  -- Apenas aplica se não for admin
  (auth.jwt()->>'user_metadata')::jsonb->>'role' IS DISTINCT FROM 'admin'
  AND auth.jwt()->>'role' IS DISTINCT FROM 'service_role'
)
EXECUTE FUNCTION prevent_critical_subscription_changes();


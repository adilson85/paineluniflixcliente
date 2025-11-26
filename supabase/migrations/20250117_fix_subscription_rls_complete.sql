-- ============================================================
-- CORREÇÃO COMPLETA: Políticas RLS para subscriptions
-- Remove todas as políticas conflitantes e cria uma solução limpa
-- ============================================================

-- Remove TODAS as políticas de UPDATE existentes para evitar conflitos
DROP POLICY IF EXISTS "Users cannot update critical subscription fields" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription plan" ON subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON subscriptions;

-- Remove trigger se existir
DROP TRIGGER IF EXISTS prevent_critical_changes_trigger ON subscriptions;
DROP FUNCTION IF EXISTS prevent_critical_subscription_changes();

-- Nova política simples para UPDATE: Usuários podem atualizar suas próprias subscriptions
-- Mas apenas os campos plan_id e updated_at (proteção via trigger)
CREATE POLICY "Users can update own subscription plan"
ON subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para admins (mantém funcionalidade admin)
CREATE POLICY "Admins can update all subscriptions"
ON subscriptions
FOR UPDATE
USING (
  (auth.jwt()->>'user_metadata')::jsonb->>'role' = 'admin'
);

-- Trigger para proteger expiration_date e status de alterações por usuários
CREATE OR REPLACE FUNCTION prevent_critical_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Se não for admin ou service_role, impede alteração de campos críticos
  IF (auth.jwt()->>'user_metadata')::jsonb->>'role' IS DISTINCT FROM 'admin'
     AND auth.jwt()->>'role' IS DISTINCT FROM 'service_role' THEN
    
    -- Mantém expiration_date original se tentar alterar
    IF OLD.expiration_date IS DISTINCT FROM NEW.expiration_date THEN
      NEW.expiration_date := OLD.expiration_date;
    END IF;
    
    -- Mantém status original se tentar alterar
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      NEW.status := OLD.status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger
CREATE TRIGGER prevent_critical_changes_trigger
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION prevent_critical_subscription_changes();






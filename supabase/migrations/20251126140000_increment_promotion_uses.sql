-- Função para incrementar contador de usos de promoção
CREATE OR REPLACE FUNCTION increment_promotion_uses(promotion_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promotions
  SET current_uses = COALESCE(current_uses, 0) + 1,
      updated_at = now()
  WHERE id = promotion_id;
END;
$$;

-- Comentário
COMMENT ON FUNCTION increment_promotion_uses IS 'Incrementa o contador de usos de uma promoção quando um pagamento é aprovado';

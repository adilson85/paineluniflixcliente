-- Função para incrementar contador de usos de promoção individual
CREATE OR REPLACE FUNCTION increment_promotion_user_uses(p_promotion_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promotion_users
  SET uses_count = COALESCE(uses_count, 0) + 1,
      updated_at = now()
  WHERE promotion_id = p_promotion_id
    AND user_id = p_user_id;
END;
$$;

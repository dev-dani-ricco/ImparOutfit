ALTER TABLE users
  ADD COLUMN IF NOT EXISTS wardrobe_plan TEXT NOT NULL DEFAULT 'FREE';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'users_wardrobe_plan_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_wardrobe_plan_check
      CHECK (wardrobe_plan IN ('FREE', 'PLUS', 'PREMIUM'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS wardrobe_upgrade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_plan TEXT NOT NULL CHECK (from_plan IN ('FREE', 'PLUS', 'PREMIUM')),
  requested_plan TEXT NOT NULL CHECK (requested_plan IN ('PLUS', 'PREMIUM')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wardrobe_upgrade_requests_user
  ON wardrobe_upgrade_requests(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_pending_wardrobe_upgrade
  ON wardrobe_upgrade_requests(user_id, requested_plan)
  WHERE status = 'PENDING';

CREATE OR REPLACE FUNCTION enforce_wardrobe_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  capacity_limit INTEGER;
  current_usage INTEGER;
BEGIN
  IF NEW.owner_type <> 'WARDROBE' THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.owner_user_id::text, 0));

  SELECT CASE wardrobe_plan
           WHEN 'PREMIUM' THEN 500
           WHEN 'PLUS' THEN 150
           ELSE 50
         END
    INTO capacity_limit
    FROM users
   WHERE id = NEW.owner_user_id;

  SELECT COUNT(*)::int
    INTO current_usage
    FROM items
   WHERE owner_user_id = NEW.owner_user_id
     AND owner_type = 'WARDROBE';

  IF current_usage >= capacity_limit THEN
    RAISE EXCEPTION 'Limite de peças do armário atingido'
      USING ERRCODE = 'P0001',
            HINT = 'Solicite um upgrade de capacidade antes de cadastrar outra peça.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_wardrobe_capacity ON items;
CREATE TRIGGER trg_enforce_wardrobe_capacity
BEFORE INSERT ON items
FOR EACH ROW
EXECUTE FUNCTION enforce_wardrobe_capacity();

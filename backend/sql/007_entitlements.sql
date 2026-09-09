CREATE TABLE plans (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, is_default BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX plans_one_default ON plans(is_default) WHERE is_default;
INSERT INTO plans(id,name,is_default) VALUES ('FREE','Acesso inicial',true),('PLUS','Plus legado',false),('PREMIUM','Premium legado',false);
INSERT INTO capabilities(code,description) VALUES ('wardrobe.capacity','Limite de itens possuídos por entitlement');
CREATE TABLE plan_limits (
 plan_id TEXT NOT NULL REFERENCES plans(id), capability_code TEXT NOT NULL REFERENCES capabilities(code),
 limit_value INT CHECK(limit_value>=0), PRIMARY KEY(plan_id,capability_code), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- NULL: no configured quantity limit in this POC. No billing or paid grant implied.
INSERT INTO plan_limits SELECT id,'wardrobe.capacity',NULL FROM plans;
CREATE TABLE person_entitlements (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES persons(id),
 plan_id TEXT NOT NULL REFERENCES plans(id), source TEXT NOT NULL,
 granted_by_person_id UUID REFERENCES persons(id), revoked_at TIMESTAMPTZ, expires_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX entitlements_person ON person_entitlements(person_id) WHERE revoked_at IS NULL;
INSERT INTO person_entitlements(person_id,plan_id,source)
 SELECT a.person_id,u.wardrobe_plan::text,'LEGACY_MIGRATION' FROM accounts a JOIN users u ON u.id=a.id;
CREATE FUNCTION effective_wardrobe_limit(subject UUID) RETURNS INT LANGUAGE sql STABLE AS $$
 SELECT CASE WHEN count(*)=0 OR bool_or(l.limit_value IS NULL) THEN NULL ELSE max(l.limit_value) END
 FROM person_entitlements e JOIN plan_limits l ON l.plan_id=e.plan_id AND l.capability_code='wardrobe.capacity'
 WHERE e.person_id=subject AND e.revoked_at IS NULL AND (e.expires_at IS NULL OR e.expires_at>now())
$$;
CREATE OR REPLACE FUNCTION enforce_owned_capacity() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE capacity_limit INT; current_usage INT;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.person_id::text,0));
 capacity_limit := effective_wardrobe_limit(NEW.person_id);
 IF capacity_limit IS NOT NULL THEN
  SELECT count(*) INTO current_usage FROM wardrobe_items WHERE person_id=NEW.person_id AND id<>NEW.id;
  IF current_usage>=capacity_limit THEN RAISE EXCEPTION 'Wardrobe capacity exceeded' USING ERRCODE='P0001'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER plans_updated BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER plan_limits_updated BEFORE UPDATE ON plan_limits FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Additive bridge: users remains the legacy account/profile adapter, never the authority.
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE accounts (
  id UUID PRIMARY KEY REFERENCES users(id), person_id UUID NOT NULL UNIQUE REFERENCES persons(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISABLED')),
  token_version INT NOT NULL DEFAULT 0 CHECK (token_version >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES persons(id),
  kind TEXT NOT NULL CHECK (kind IN ('EMAIL','PHONE','EXTERNAL')), value TEXT NOT NULL,
  verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(kind,value)
);
CREATE INDEX identifiers_person_idx ON identifiers(person_id);
-- Reject ambiguous legacy case variants; never merge identities implicitly.
CREATE UNIQUE INDEX users_email_normalized_idx ON users(lower(trim(email)));
INSERT INTO persons(id,display_name,created_at) SELECT id,name,created_at FROM users;
INSERT INTO accounts(id,person_id,created_at) SELECT id,id,created_at FROM users;
INSERT INTO identifiers(person_id,kind,value) SELECT id,'EMAIL',lower(trim(email)) FROM users;
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL,
  created_by_person_id UUID NOT NULL REFERENCES persons(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES persons(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED')),
  created_by_person_id UUID NOT NULL REFERENCES persons(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(person_id,organization_id)
);
CREATE INDEX memberships_org_idx ON memberships(organization_id,status);
CREATE TABLE capabilities (code TEXT PRIMARY KEY, description TEXT NOT NULL);
INSERT INTO capabilities(code,description) VALUES
 ('store.read','Ler contexto comercial'), ('store.update','Editar organização comercial'),
 ('catalog.write','Editar catálogo'), ('marketing.write','Editar vitrines e campanhas'),
 ('analytics.read','Consultar métricas agregadas'), ('members.manage','Gerir membros e concessões');
CREATE TABLE capability_bundles (code TEXT PRIMARY KEY);
INSERT INTO capability_bundles VALUES ('OWNER'),('ADMIN'),('MANAGER'),('CATALOG_EDITOR'),('MARKETING'),('VIEWER');
CREATE TABLE bundle_capabilities (
  bundle_code TEXT NOT NULL REFERENCES capability_bundles(code), capability_code TEXT NOT NULL REFERENCES capabilities(code),
  PRIMARY KEY(bundle_code,capability_code)
);
INSERT INTO bundle_capabilities SELECT b.code,c.code FROM capability_bundles b CROSS JOIN capabilities c WHERE b.code IN ('OWNER','ADMIN');
INSERT INTO bundle_capabilities VALUES
 ('MANAGER','store.read'),('MANAGER','catalog.write'),('MANAGER','marketing.write'),('MANAGER','analytics.read'),
 ('CATALOG_EDITOR','store.read'),('CATALOG_EDITOR','catalog.write'),
 ('MARKETING','store.read'),('MARKETING','marketing.write'),('MARKETING','analytics.read'),('VIEWER','store.read');
CREATE TABLE grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), membership_id UUID NOT NULL REFERENCES memberships(id),
  capability_code TEXT NOT NULL REFERENCES capabilities(code), resource_id UUID,
  granted_by_person_id UUID NOT NULL REFERENCES persons(id), source_bundle TEXT REFERENCES capability_bundles(code),
  expires_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX grants_active_context_idx ON grants(membership_id,capability_code) WHERE resource_id IS NULL AND revoked_at IS NULL;
CREATE UNIQUE INDEX grants_active_resource_idx ON grants(membership_id,capability_code,resource_id) WHERE resource_id IS NOT NULL AND revoked_at IS NULL;
ALTER TABLE stores ADD COLUMN organization_id UUID UNIQUE REFERENCES organizations(id);
ALTER TABLE stores DROP CONSTRAINT stores_owner_user_id_key;
INSERT INTO organizations(id,name,created_by_person_id,created_at) SELECT id,store_name,owner_user_id,created_at FROM stores;
UPDATE stores SET organization_id=id;
ALTER TABLE stores ALTER COLUMN organization_id SET NOT NULL;
INSERT INTO memberships(person_id,organization_id,created_by_person_id) SELECT owner_user_id,organization_id,owner_user_id FROM stores;
INSERT INTO grants(membership_id,capability_code,granted_by_person_id,source_bundle)
 SELECT m.id,b.capability_code,m.person_id,'OWNER' FROM memberships m CROSS JOIN bundle_capabilities b WHERE b.bundle_code='OWNER';
CREATE TABLE store_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES persons(id), name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  organization_id UUID REFERENCES organizations(id), reviewed_by_person_id UUID REFERENCES persons(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX store_requests_person_idx ON store_requests(person_id,created_at DESC);
INSERT INTO customer_profiles(user_id) SELECT id FROM users ON CONFLICT DO NOTHING;

CREATE FUNCTION touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER persons_updated BEFORE UPDATE ON persons FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER accounts_updated BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER memberships_updated BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER store_requests_updated BEFORE UPDATE ON store_requests FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

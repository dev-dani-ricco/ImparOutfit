CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES persons(id),
  organization_id UUID REFERENCES organizations(id), purpose TEXT NOT NULL CHECK (purpose IN ('PROFILE','WARDROBE','CATALOG')),
  storage_key TEXT NOT NULL UNIQUE, mime TEXT NOT NULL CHECK (mime='image/webp'), bytes INT NOT NULL CHECK (bytes BETWEEN 1 AND 5242880),
  sha256 TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'READY' CHECK (status IN ('READY','DELETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((purpose='CATALOG' AND organization_id IS NOT NULL) OR (purpose IN ('PROFILE','WARDROBE') AND organization_id IS NULL))
);
CREATE INDEX media_person_idx ON media_assets(person_id,created_at DESC);
CREATE INDEX media_org_idx ON media_assets(organization_id);
ALTER TABLE customer_profiles ADD COLUMN photo_media_id UUID REFERENCES media_assets(id);
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), store_id UUID NOT NULL REFERENCES stores(id),
  created_by_person_id UUID NOT NULL REFERENCES persons(id), name TEXT NOT NULL, category TEXT NOT NULL,
  color TEXT, sizes TEXT[] NOT NULL DEFAULT '{}', price NUMERIC(10,2) CHECK(price>=0), purchase_link TEXT,
  legacy_image_urls TEXT[] NOT NULL DEFAULT '{}', legacy_item_id UUID UNIQUE REFERENCES items(id),
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK(status IN ('PUBLISHED','ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(id,store_id)
);
CREATE INDEX products_store_idx ON products(store_id,created_at DESC);
INSERT INTO products(id,store_id,created_by_person_id,name,category,color,sizes,price,purchase_link,legacy_image_urls,legacy_item_id,created_at)
 SELECT i.id,i.store_id,s.owner_user_id,i.name,i.category,i.color,COALESCE(i.sizes,'{}'),i.price,i.purchase_link,COALESCE(i.image_urls,'{}'),i.id,i.created_at
 FROM items i JOIN stores s ON s.id=i.store_id WHERE i.owner_type='STORE';
CREATE TABLE product_media (
  product_id UUID NOT NULL REFERENCES products(id), media_id UUID NOT NULL UNIQUE REFERENCES media_assets(id), PRIMARY KEY(product_id,media_id)
);
CREATE TABLE ownership_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES persons(id),
  source TEXT NOT NULL CHECK (source IN ('MANUAL_CATALOG','REAL_CAPTURE','VERIFIED_PURCHASE','VALIDATED_IMPORT')),
  recorded_by_person_id UUID NOT NULL REFERENCES persons(id), attested_at TIMESTAMPTZ NOT NULL,
  evidence_media_id UUID REFERENCES media_assets(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(source<>'REAL_CAPTURE' OR evidence_media_id IS NOT NULL), UNIQUE(id,person_id)
);
CREATE INDEX ownership_person_idx ON ownership_events(person_id,created_at DESC);
CREATE TABLE wardrobe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES persons(id),
  ownership_event_id UUID NOT NULL UNIQUE, kind TEXT NOT NULL DEFAULT 'OWNED_ITEM' CHECK(kind='OWNED_ITEM'),
  name TEXT NOT NULL, category TEXT NOT NULL, color TEXT, sizes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(ownership_event_id,person_id) REFERENCES ownership_events(id,person_id), UNIQUE(id,person_id)
);
CREATE INDEX wardrobe_person_idx ON wardrobe_items(person_id,created_at DESC);
CREATE TABLE wardrobe_media (
  wardrobe_item_id UUID NOT NULL REFERENCES wardrobe_items(id), media_id UUID NOT NULL UNIQUE REFERENCES media_assets(id), PRIMARY KEY(wardrobe_item_id,media_id)
);
CREATE TABLE commercial_saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES persons(id), product_id UUID NOT NULL REFERENCES products(id),
  kind TEXT NOT NULL DEFAULT 'COMMERCIAL_PREVIEW' CHECK(kind IN ('COMMERCIAL_PREVIEW','SPONSORED_PREVIEW')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(person_id,product_id)
);
CREATE INDEX commercial_saved_product_idx ON commercial_saved_items(product_id);
INSERT INTO commercial_saved_items(person_id,product_id)
 SELECT s.user_id,s.source_item_id FROM item_saves s JOIN products p ON p.id=s.source_item_id WHERE s.user_id IS NOT NULL
 ON CONFLICT DO NOTHING;
-- Preserve uncertain legacy cataloguing and copies as review records, never assert ownership.
CREATE TABLE legacy_item_reviews (
  legacy_item_id UUID PRIMARY KEY REFERENCES items(id), person_id UUID NOT NULL REFERENCES persons(id),
  reason TEXT NOT NULL CHECK(reason IN ('COMMERCIAL_COPY','UNVERIFIED_CATALOG')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO legacy_item_reviews(legacy_item_id,person_id,reason)
 SELECT id,owner_user_id,CASE WHEN source_item_id IS NOT NULL OR source_store_id IS NOT NULL OR metadata->>'copiedFromStore'='true' THEN 'COMMERCIAL_COPY' ELSE 'UNVERIFIED_CATALOG' END
 FROM items WHERE owner_type='WARDROBE';
CREATE INDEX legacy_reviews_person_idx ON legacy_item_reviews(person_id);
INSERT INTO commercial_saved_items(person_id,product_id)
 SELECT i.owner_user_id,p.id FROM items i JOIN products p ON p.id=i.source_item_id WHERE i.owner_type='WARDROBE' ON CONFLICT DO NOTHING;

ALTER TABLE looks ADD COLUMN person_id UUID REFERENCES persons(id);
UPDATE looks SET person_id=user_id;
ALTER TABLE looks ALTER COLUMN person_id SET NOT NULL;
ALTER TABLE looks ALTER COLUMN is_public SET DEFAULT false;
UPDATE looks SET is_public=false;
ALTER TABLE looks ADD CONSTRAINT looks_private CHECK (is_public=false);
ALTER TABLE looks ADD CONSTRAINT looks_person_unique UNIQUE(id,person_id);
CREATE TABLE look_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), look_id UUID NOT NULL, person_id UUID NOT NULL,
  version INT NOT NULL CHECK(version>0), created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(look_id,person_id) REFERENCES looks(id,person_id), UNIQUE(look_id,version), UNIQUE(id,person_id)
);
CREATE TABLE look_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), look_version_id UUID NOT NULL, person_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('OWNED_ITEM','COMMERCIAL_PREVIEW','SPONSORED_PREVIEW')),
  wardrobe_item_id UUID, product_id UUID REFERENCES products(id), position INT NOT NULL CHECK(position>=0),
  FOREIGN KEY(look_version_id,person_id) REFERENCES look_versions(id,person_id),
  FOREIGN KEY(wardrobe_item_id,person_id) REFERENCES wardrobe_items(id,person_id),
  UNIQUE(look_version_id,position),
  CHECK((kind='OWNED_ITEM' AND wardrobe_item_id IS NOT NULL AND product_id IS NULL) OR
        (kind IN ('COMMERCIAL_PREVIEW','SPONSORED_PREVIEW') AND product_id IS NOT NULL AND wardrobe_item_id IS NULL))
);
CREATE INDEX looks_person_idx ON looks(person_id,created_at DESC);
CREATE INDEX look_items_product_idx ON look_items(product_id);
CREATE TABLE showcase_products (
  showcase_id UUID NOT NULL REFERENCES showcases(id), product_id UUID NOT NULL, store_id UUID NOT NULL,
  PRIMARY KEY(showcase_id,product_id), FOREIGN KEY(product_id,store_id) REFERENCES products(id,store_id)
);
ALTER TABLE showcases ADD CONSTRAINT showcase_store_unique UNIQUE(id,store_id);
ALTER TABLE showcase_products ADD FOREIGN KEY(showcase_id,store_id) REFERENCES showcases(id,store_id);
INSERT INTO showcase_products(showcase_id,product_id,store_id)
 SELECT s.id,p.id,s.store_id FROM showcases s JOIN products p ON p.id=ANY(s.item_ids) AND p.store_id=s.store_id ON CONFLICT DO NOTHING;

CREATE FUNCTION enforce_owned_capacity() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE capacity_limit INT; current_usage INT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.person_id::text,0));
  SELECT CASE u.wardrobe_plan WHEN 'PREMIUM' THEN 500 WHEN 'PLUS' THEN 150 ELSE 50 END INTO capacity_limit
   FROM accounts a JOIN users u ON u.id=a.id WHERE a.person_id=NEW.person_id;
  SELECT count(*) INTO current_usage FROM wardrobe_items WHERE person_id=NEW.person_id AND id<>NEW.id;
  IF current_usage >= capacity_limit THEN RAISE EXCEPTION 'Wardrobe capacity exceeded' USING ERRCODE='P0001'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wardrobe_capacity BEFORE INSERT OR UPDATE OF person_id ON wardrobe_items FOR EACH ROW EXECUTE FUNCTION enforce_owned_capacity();
CREATE TRIGGER wardrobe_updated BEFORE UPDATE ON wardrobe_items FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER media_updated BEFORE UPDATE ON media_assets FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Privacy invariants also hold for future writers using this schema.
CREATE FUNCTION enforce_media_relation() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE media media_assets; owner_id UUID; org_id UUID;
BEGIN
  IF TG_TABLE_NAME='customer_profiles' THEN
    IF NEW.photo_media_id IS NULL THEN RETURN NEW; END IF;
    SELECT * INTO media FROM media_assets WHERE id=NEW.photo_media_id;
    SELECT person_id INTO owner_id FROM accounts WHERE id=NEW.user_id;
    IF media.purpose IS DISTINCT FROM 'PROFILE' OR media.person_id IS DISTINCT FROM owner_id THEN
      RAISE EXCEPTION 'Invalid profile media ownership' USING ERRCODE='23514'; END IF;
  ELSIF TG_TABLE_NAME='ownership_events' THEN
    IF NEW.evidence_media_id IS NULL THEN RETURN NEW; END IF;
    SELECT * INTO media FROM media_assets WHERE id=NEW.evidence_media_id;
    IF media.purpose IS DISTINCT FROM 'WARDROBE' OR media.person_id IS DISTINCT FROM NEW.person_id THEN
      RAISE EXCEPTION 'Invalid ownership evidence' USING ERRCODE='23514'; END IF;
  ELSIF TG_TABLE_NAME='wardrobe_media' THEN
    SELECT * INTO media FROM media_assets WHERE id=NEW.media_id;
    SELECT person_id INTO owner_id FROM wardrobe_items WHERE id=NEW.wardrobe_item_id;
    IF media.purpose IS DISTINCT FROM 'WARDROBE' OR media.person_id IS DISTINCT FROM owner_id THEN
      RAISE EXCEPTION 'Invalid wardrobe media ownership' USING ERRCODE='23514'; END IF;
  ELSE
    SELECT * INTO media FROM media_assets WHERE id=NEW.media_id;
    SELECT s.organization_id INTO org_id FROM products p JOIN stores s ON s.id=p.store_id WHERE p.id=NEW.product_id;
    IF media.purpose IS DISTINCT FROM 'CATALOG' OR media.organization_id IS DISTINCT FROM org_id THEN
      RAISE EXCEPTION 'Invalid catalog media ownership' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profile_media_owner BEFORE INSERT OR UPDATE ON customer_profiles FOR EACH ROW EXECUTE FUNCTION enforce_media_relation();
CREATE TRIGGER wardrobe_media_owner BEFORE INSERT OR UPDATE ON wardrobe_media FOR EACH ROW EXECUTE FUNCTION enforce_media_relation();
CREATE TRIGGER product_media_owner BEFORE INSERT OR UPDATE ON product_media FOR EACH ROW EXECUTE FUNCTION enforce_media_relation();
CREATE TRIGGER evidence_media_owner BEFORE INSERT OR UPDATE ON ownership_events FOR EACH ROW EXECUTE FUNCTION enforce_media_relation();

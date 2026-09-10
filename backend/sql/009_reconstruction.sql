CREATE TABLE reconstruction_jobs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES persons(id),
 wardrobe_item_id UUID, product_id UUID REFERENCES products(id), organization_id UUID REFERENCES organizations(id),
 category TEXT NOT NULL CHECK(category IN ('TOP','PANTS','DRESS','FOOTWEAR','BAG','ACCESSORY')),
 state TEXT NOT NULL DEFAULT 'CAPTURED' CHECK(state IN ('CAPTURED','VALIDATING','QUEUED','PROCESSING','QUALITY_CHECK','READY','NEEDS_MORE_INPUT','FAILED')),
 pipeline_version TEXT NOT NULL, technique TEXT NOT NULL,
 attempt INT NOT NULL DEFAULT 0, input_revision INT NOT NULL DEFAULT 0, recapture_count INT NOT NULL DEFAULT 0,
 capture_metadata JSONB NOT NULL DEFAULT '{}', metrics JSONB NOT NULL DEFAULT '{}',
 quality JSONB NOT NULL DEFAULT '{}', dimension_reference JSONB, placement JSONB,
 error_code TEXT, guidance JSONB NOT NULL DEFAULT '[]',
 lease_until TIMESTAMPTZ, started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 FOREIGN KEY(wardrobe_item_id,person_id) REFERENCES wardrobe_items(id,person_id),
 CHECK((wardrobe_item_id IS NOT NULL AND product_id IS NULL AND organization_id IS NULL) OR
       (wardrobe_item_id IS NULL AND product_id IS NOT NULL AND organization_id IS NOT NULL)),
 UNIQUE(id,person_id)
);
CREATE INDEX reconstruction_queue ON reconstruction_jobs(state,created_at);
CREATE INDEX reconstruction_person ON reconstruction_jobs(person_id,created_at DESC);
CREATE TABLE reconstruction_inputs (
 job_id UUID NOT NULL, person_id UUID NOT NULL, media_id UUID NOT NULL REFERENCES media_assets(id),
 azimuth INT NOT NULL CHECK(azimuth>=0 AND azimuth<360), elevation TEXT NOT NULL CHECK(elevation IN ('LOW','MID','HIGH')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(job_id,media_id),
 FOREIGN KEY(job_id,person_id) REFERENCES reconstruction_jobs(id,person_id)
);
CREATE TABLE reconstruction_outputs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), job_id UUID NOT NULL, person_id UUID NOT NULL,
 storage_key TEXT NOT NULL UNIQUE, mime TEXT NOT NULL CHECK(mime='model/gltf-binary'),
 bytes INT NOT NULL CHECK(bytes BETWEEN 1 AND 67108864), sha256 TEXT NOT NULL,
 lifecycle TEXT NOT NULL DEFAULT 'DERIVED' CHECK(lifecycle IN ('SOURCE','DERIVED','REGENERABLE','PRESERVE')),
 metadata JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 FOREIGN KEY(job_id,person_id) REFERENCES reconstruction_jobs(id,person_id)
);
CREATE INDEX reconstruction_output_job ON reconstruction_outputs(job_id);
CREATE TABLE reconstruction_events (
 id BIGSERIAL PRIMARY KEY, job_id UUID NOT NULL REFERENCES reconstruction_jobs(id),
 actor_person_id UUID REFERENCES persons(id), from_state TEXT, to_state TEXT NOT NULL,
 code TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reconstruction_events_job ON reconstruction_events(job_id,id);
CREATE TRIGGER reconstruction_updated BEFORE UPDATE ON reconstruction_jobs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE FUNCTION enforce_capture_media() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE media media_assets; job reconstruction_jobs;
BEGIN
 SELECT * INTO media FROM media_assets WHERE id=NEW.media_id;
 SELECT * INTO job FROM reconstruction_jobs WHERE id=NEW.job_id;
 IF media.person_id IS DISTINCT FROM NEW.person_id OR media.status IS DISTINCT FROM 'READY'
 OR media.organization_id IS DISTINCT FROM job.organization_id
 OR media.purpose IS DISTINCT FROM (CASE WHEN job.product_id IS NULL THEN 'WARDROBE' ELSE 'CATALOG' END) THEN
 RAISE EXCEPTION 'Invalid capture media ownership' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER capture_media_owner BEFORE INSERT OR UPDATE ON reconstruction_inputs FOR EACH ROW EXECUTE FUNCTION enforce_capture_media();

CREATE TABLE capture_sessions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES persons(id),
 wardrobe_item_id UUID, product_id UUID REFERENCES products(id), category TEXT NOT NULL CHECK(category IN ('TOP','PANTS','DRESS','FOOTWEAR','BAG','ACCESSORY')),
 protocol_version TEXT NOT NULL, expected_shots JSONB NOT NULL, received_shots JSONB NOT NULL DEFAULT '[]',
 validation_status TEXT NOT NULL DEFAULT 'CAPTURED' CHECK(validation_status IN ('CAPTURED','VALIDATING','READY_FOR_RECONSTRUCTION','NEEDS_MORE_INPUT','FAILED')),
 validation JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 FOREIGN KEY(wardrobe_item_id,person_id) REFERENCES wardrobe_items(id,person_id),
 CHECK((wardrobe_item_id IS NOT NULL AND product_id IS NULL) OR (wardrobe_item_id IS NULL AND product_id IS NOT NULL))
);
CREATE INDEX capture_sessions_person ON capture_sessions(person_id,created_at DESC);
CREATE TRIGGER capture_sessions_updated BEFORE UPDATE ON capture_sessions FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
ALTER TABLE reconstruction_jobs ADD COLUMN capture_session_id UUID REFERENCES capture_sessions(id);
CREATE INDEX reconstruction_session ON reconstruction_jobs(capture_session_id);
CREATE TABLE reconstruction_attempts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), job_id UUID NOT NULL REFERENCES reconstruction_jobs(id), sequence INT NOT NULL,
 input_revision INT NOT NULL, pipeline_version TEXT NOT NULL, state TEXT NOT NULL, metrics JSONB NOT NULL DEFAULT '{}', quality JSONB NOT NULL DEFAULT '{}',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), completed_at TIMESTAMPTZ, UNIQUE(job_id,sequence)
);
CREATE TABLE asset_versions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), person_id UUID NOT NULL REFERENCES persons(id), reconstruction_output_id UUID NOT NULL REFERENCES reconstruction_outputs(id),
 version INT NOT NULL, asset_type TEXT NOT NULL CHECK(asset_type IN ('RECONSTRUCTION_GLB','AVATAR_GLB')), provenance JSONB NOT NULL, quality JSONB NOT NULL DEFAULT '{}',
 lifecycle TEXT NOT NULL CHECK(lifecycle IN ('SOURCE','DERIVED','REGENERABLE','PRESERVE')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(reconstruction_output_id), UNIQUE(person_id,asset_type,version)
);

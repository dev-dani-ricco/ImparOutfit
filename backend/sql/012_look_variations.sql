CREATE TABLE look_variations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_person_id UUID NOT NULL REFERENCES persons(id),
 source_look_id UUID NOT NULL REFERENCES looks(id), source_look_version_id UUID NOT NULL REFERENCES look_versions(id),
 resulting_look_id UUID NOT NULL REFERENCES looks(id), name TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(source_look_id<>resulting_look_id), UNIQUE(resulting_look_id)
);
CREATE INDEX look_variations_owner ON look_variations(owner_person_id,created_at DESC);
CREATE INDEX look_variations_source ON look_variations(source_look_id,source_look_version_id);

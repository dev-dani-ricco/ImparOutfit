CREATE TABLE contexts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_person_id UUID NOT NULL REFERENCES persons(id),
 occasion TEXT,
 starts_at TIMESTAMPTZ,
 location_text TEXT,
 climate_reference TEXT,
 formality TEXT,
 objective TEXT,
 notes TEXT,
 provenance TEXT NOT NULL DEFAULT 'USER_DECLARED' CHECK(provenance IN ('USER_DECLARED','IMAGE_INFERRED','SYSTEM_ESTIMATED','MERCHANT_DECLARED','EXPERT_VALIDATED')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(id,owner_person_id)
);
CREATE INDEX contexts_owner_created_at ON contexts(owner_person_id,created_at DESC);
CREATE INDEX contexts_owner_starts_at ON contexts(owner_person_id,starts_at DESC) WHERE starts_at IS NOT NULL;

CREATE TABLE look_contexts (
 look_id UUID NOT NULL,
 context_id UUID NOT NULL,
 owner_person_id UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(look_id,context_id),
 FOREIGN KEY(look_id,owner_person_id) REFERENCES looks(id,person_id) ON DELETE CASCADE,
 FOREIGN KEY(context_id,owner_person_id) REFERENCES contexts(id,owner_person_id) ON DELETE CASCADE
);
CREATE INDEX look_contexts_context ON look_contexts(context_id,owner_person_id);
CREATE INDEX look_contexts_owner_created_at ON look_contexts(owner_person_id,created_at DESC);

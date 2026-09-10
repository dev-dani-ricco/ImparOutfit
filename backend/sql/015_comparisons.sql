CREATE TABLE comparisons (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_person_id UUID NOT NULL REFERENCES persons(id),
 name TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(id,owner_person_id)
);
CREATE INDEX comparisons_owner_created_at ON comparisons(owner_person_id,created_at DESC);

CREATE TABLE comparison_looks (
 comparison_id UUID NOT NULL,
 look_id UUID NOT NULL,
 owner_person_id UUID NOT NULL REFERENCES persons(id),
 position INT NOT NULL CHECK(position>=0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(comparison_id,look_id),
 UNIQUE(comparison_id,position),
 FOREIGN KEY(comparison_id,owner_person_id) REFERENCES comparisons(id,owner_person_id) ON DELETE CASCADE,
 FOREIGN KEY(look_id,owner_person_id) REFERENCES looks(id,person_id) ON DELETE CASCADE
);
CREATE INDEX comparison_looks_look ON comparison_looks(look_id,owner_person_id);
CREATE INDEX comparison_looks_owner_created_at ON comparison_looks(owner_person_id,created_at DESC);

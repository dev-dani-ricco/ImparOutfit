CREATE TABLE collections (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_person_id UUID NOT NULL REFERENCES persons(id),
 name TEXT NOT NULL CHECK(length(btrim(name))>0),
 description TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(id,owner_person_id)
);
CREATE INDEX collections_owner_created_at ON collections(owner_person_id,created_at DESC);

CREATE TABLE collection_looks (
 collection_id UUID NOT NULL,
 look_id UUID NOT NULL,
 owner_person_id UUID NOT NULL REFERENCES persons(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(collection_id,look_id),
 FOREIGN KEY(collection_id,owner_person_id) REFERENCES collections(id,owner_person_id) ON DELETE CASCADE,
 FOREIGN KEY(look_id,owner_person_id) REFERENCES looks(id,person_id) ON DELETE CASCADE
);
CREATE INDEX collection_looks_look ON collection_looks(look_id,owner_person_id);
CREATE INDEX collection_looks_owner_created_at ON collection_looks(owner_person_id,created_at DESC);

CREATE TABLE impar_analyses (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_person_id UUID NOT NULL REFERENCES persons(id),
 look_id UUID NOT NULL,
 look_version_id UUID NOT NULL,
 context_id UUID NOT NULL,
 status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','COMPLETED')),
 origin TEXT NOT NULL CHECK(origin IN ('SYSTEM','EXPERT')),
 methodology_version_ref TEXT CHECK(methodology_version_ref IS NULL OR length(btrim(methodology_version_ref))>0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 FOREIGN KEY(look_id,owner_person_id) REFERENCES looks(id,person_id) ON DELETE CASCADE,
 FOREIGN KEY(look_version_id,look_id,owner_person_id) REFERENCES look_versions(id,look_id,person_id),
 FOREIGN KEY(context_id,owner_person_id) REFERENCES contexts(id,owner_person_id)
);
CREATE INDEX impar_analyses_owner_created_at ON impar_analyses(owner_person_id,created_at DESC);
CREATE INDEX impar_analyses_look_version ON impar_analyses(look_version_id,owner_person_id);
CREATE INDEX impar_analyses_context ON impar_analyses(context_id,owner_person_id);

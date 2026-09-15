INSERT INTO capabilities(code,description) VALUES
 ('impar.methodology.manage','Governar Registry institucional de metodologia'),
 ('impar.analysis.methodology.assign','Atribuir metodologia publicada a ÍMPAR Analysis') ON CONFLICT DO NOTHING;

CREATE TABLE methodologies (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 key TEXT NOT NULL UNIQUE CHECK(length(btrim(key))>0),
 technical_name TEXT NOT NULL CHECK(length(btrim(technical_name))>0),
 status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','RETIRED')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE methodology_versions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), methodology_id UUID NOT NULL REFERENCES methodologies(id),
 version INT NOT NULL CHECK(version>0), status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PUBLISHED','RETIRED')),
 content_ref TEXT NOT NULL CHECK(length(btrim(content_ref))>0), content_hash TEXT CHECK(content_hash IS NULL OR content_hash ~ '^[0-9a-f]{64}$'),
 created_by_principal_id UUID NOT NULL REFERENCES principals(id), published_by_principal_id UUID REFERENCES principals(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), published_at TIMESTAMPTZ,
 UNIQUE(methodology_id,version), CHECK((status='PUBLISHED' AND published_by_principal_id IS NOT NULL AND published_at IS NOT NULL) OR status<>'PUBLISHED')
);
ALTER TABLE impar_analyses ADD COLUMN methodology_version_id UUID REFERENCES methodology_versions(id);

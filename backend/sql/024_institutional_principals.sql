CREATE TABLE principals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_type TEXT NOT NULL CHECK(principal_type IN ('HUMAN')),
  person_id UUID UNIQUE REFERENCES persons(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','DISABLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(principal_type <> 'HUMAN' OR person_id IS NOT NULL)
);
CREATE UNIQUE INDEX principals_human_person_unique ON principals(person_id) WHERE principal_type='HUMAN';
INSERT INTO principals(principal_type,person_id)
  SELECT 'HUMAN',id FROM persons ON CONFLICT(person_id) DO NOTHING;

ALTER TABLE impar_analysis_results
  ADD COLUMN created_by_principal_id UUID REFERENCES principals(id),
  ADD COLUMN finalized_by_principal_id UUID REFERENCES principals(id);
ALTER TABLE impar_analyses
  ADD COLUMN completed_by_principal_id UUID REFERENCES principals(id);

UPDATE impar_analysis_results r SET created_by_principal_id=p.id
  FROM principals p WHERE p.person_id=r.created_by_person_id AND p.principal_type='HUMAN';
UPDATE impar_analysis_results r SET finalized_by_principal_id=p.id
  FROM principals p WHERE p.person_id=r.finalized_by_person_id AND p.principal_type='HUMAN';
UPDATE impar_analyses a SET completed_by_principal_id=p.id
  FROM principals p WHERE p.person_id=a.completed_by_person_id AND p.principal_type='HUMAN';

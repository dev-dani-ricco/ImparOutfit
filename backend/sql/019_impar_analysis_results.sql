ALTER TABLE impar_analyses ADD CONSTRAINT impar_analyses_id_owner_unique UNIQUE(id,owner_person_id);

CREATE TABLE impar_analysis_results (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 analysis_id UUID NOT NULL,
 owner_person_id UUID NOT NULL REFERENCES persons(id),
 result_version INT NOT NULL CHECK(result_version>0),
 status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','FINAL')),
 payload JSONB NOT NULL DEFAULT '{}',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(analysis_id,result_version),
 FOREIGN KEY(analysis_id,owner_person_id) REFERENCES impar_analyses(id,owner_person_id) ON DELETE CASCADE
);
CREATE INDEX impar_analysis_results_owner_created_at ON impar_analysis_results(owner_person_id,created_at DESC);
CREATE INDEX impar_analysis_results_analysis_version ON impar_analysis_results(analysis_id,result_version DESC);

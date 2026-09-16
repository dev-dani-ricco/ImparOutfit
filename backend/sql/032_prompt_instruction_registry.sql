CREATE TABLE prompt_definitions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 task TEXT NOT NULL UNIQUE CHECK(task='IMPAR_ANALYSIS'),
 created_by_principal_id UUID REFERENCES principals(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE prompt_versions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 prompt_definition_id UUID NOT NULL REFERENCES prompt_definitions(id),
 version INT NOT NULL CHECK(version>0),
 status TEXT NOT NULL CHECK(status IN ('DRAFT','PUBLISHED','RETIRED')),
 content_hash CHAR(64) NOT NULL CHECK(content_hash ~ '^[0-9a-f]{64}$'),
 private_content_ref TEXT NOT NULL,
 created_by_principal_id UUID REFERENCES principals(id),
 published_by_principal_id UUID REFERENCES principals(id), published_at TIMESTAMPTZ,
 retired_by_principal_id UUID REFERENCES principals(id), retired_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(prompt_definition_id,version)
);
CREATE UNIQUE INDEX prompt_versions_one_published ON prompt_versions(prompt_definition_id) WHERE status='PUBLISHED';
ALTER TABLE impar_analysis_jobs ADD COLUMN prompt_version_id UUID REFERENCES prompt_versions(id);
ALTER TABLE ai_executions ADD COLUMN prompt_version_id UUID REFERENCES prompt_versions(id);
CREATE INDEX impar_analysis_jobs_prompt_version ON impar_analysis_jobs(prompt_version_id);

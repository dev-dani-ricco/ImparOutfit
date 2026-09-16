CREATE TABLE ai_policies (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task TEXT NOT NULL UNIQUE CHECK(task='IMPAR_ANALYSIS'),
 created_by_principal_id UUID REFERENCES principals(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE ai_policy_versions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ai_policy_id UUID NOT NULL REFERENCES ai_policies(id), version INT NOT NULL CHECK(version>0),
 status TEXT NOT NULL CHECK(status IN ('DRAFT','PUBLISHED','RETIRED')), provider_identifier TEXT NOT NULL, model_identifier TEXT NOT NULL,
 timeout_ms INT NOT NULL CHECK(timeout_ms>0 AND timeout_ms<=120000), parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_by_principal_id UUID REFERENCES principals(id), published_by_principal_id UUID REFERENCES principals(id), published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(ai_policy_id,version)
);
CREATE UNIQUE INDEX ai_policy_versions_one_published ON ai_policy_versions(ai_policy_id) WHERE status='PUBLISHED';
ALTER TABLE impar_analysis_jobs ADD COLUMN ai_policy_version_id UUID REFERENCES ai_policy_versions(id);
CREATE TABLE ai_executions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task TEXT NOT NULL CHECK(task='IMPAR_ANALYSIS'), ai_policy_version_id UUID NOT NULL REFERENCES ai_policy_versions(id),
 requester_principal_id UUID REFERENCES principals(id), owner_person_id UUID REFERENCES persons(id), consumer_type TEXT NOT NULL, consumer_id UUID NOT NULL,
 provider_identifier TEXT NOT NULL, model_identifier TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('SUCCEEDED','FAILED')),
 input_tokens INT, output_tokens INT, total_tokens INT, latency_ms INT, correlation_id TEXT, failure_code TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), finished_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(input_tokens IS NULL OR input_tokens>=0), CHECK(output_tokens IS NULL OR output_tokens>=0), CHECK(total_tokens IS NULL OR total_tokens>=0), CHECK(latency_ms IS NULL OR latency_ms>=0)
);
CREATE INDEX ai_executions_consumer ON ai_executions(consumer_type,consumer_id,created_at DESC);

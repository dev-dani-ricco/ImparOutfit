CREATE TABLE impar_analysis_jobs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 analysis_id UUID NOT NULL,
 owner_person_id UUID NOT NULL REFERENCES persons(id),
 requested_by_principal_id UUID NOT NULL REFERENCES principals(id),
 look_version_id UUID NOT NULL,
 context_id UUID NOT NULL,
 methodology_version_id UUID NOT NULL REFERENCES methodology_versions(id),
 state TEXT NOT NULL DEFAULT 'QUEUED' CHECK(state IN ('QUEUED','PROCESSING','SUCCEEDED','FAILED','CANCELLED')),
 attempt INT NOT NULL DEFAULT 0 CHECK(attempt>=0),
 idempotency_key TEXT NOT NULL CHECK(char_length(idempotency_key) BETWEEN 1 AND 128),
 envelope_fingerprint CHAR(64) NOT NULL CHECK(envelope_fingerprint ~ '^[0-9a-f]{64}$'),
 result_id UUID,
 error_code TEXT,
 lease_until TIMESTAMPTZ,
 started_at TIMESTAMPTZ,
 completed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 FOREIGN KEY(analysis_id,owner_person_id) REFERENCES impar_analyses(id,owner_person_id),
 FOREIGN KEY(look_version_id) REFERENCES look_versions(id),
 FOREIGN KEY(context_id,owner_person_id) REFERENCES contexts(id,owner_person_id),
 FOREIGN KEY(result_id,analysis_id,owner_person_id) REFERENCES impar_analysis_results(id,analysis_id,owner_person_id),
 UNIQUE(owner_person_id,idempotency_key)
);
CREATE INDEX impar_analysis_jobs_queue ON impar_analysis_jobs(state,created_at);
CREATE INDEX impar_analysis_jobs_analysis ON impar_analysis_jobs(analysis_id,owner_person_id,created_at DESC);
CREATE TRIGGER impar_analysis_jobs_updated BEFORE UPDATE ON impar_analysis_jobs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE impar_analysis_job_knowledge (
 job_id UUID NOT NULL REFERENCES impar_analysis_jobs(id) ON DELETE CASCADE,
 authorized_knowledge_version_id UUID NOT NULL REFERENCES authorized_knowledge_versions(id),
 PRIMARY KEY(job_id,authorized_knowledge_version_id)
);

CREATE TABLE impar_analysis_attempts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 job_id UUID NOT NULL REFERENCES impar_analysis_jobs(id) ON DELETE CASCADE,
 sequence INT NOT NULL CHECK(sequence>0),
 state TEXT NOT NULL CHECK(state IN ('PROCESSING','SUCCEEDED','FAILED')),
 error_code TEXT,
 started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 completed_at TIMESTAMPTZ,
 UNIQUE(job_id,sequence)
);

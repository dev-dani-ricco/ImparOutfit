CREATE TABLE impar_analysis_requests (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 analysis_id UUID NOT NULL UNIQUE,
 owner_person_id UUID NOT NULL REFERENCES persons(id),
 requested_by_principal_id UUID NOT NULL REFERENCES principals(id),
 state TEXT NOT NULL DEFAULT 'REQUESTED' CHECK(state IN ('REQUESTED','ENQUEUED','FAILED','CANCELLED')),
 accepted_by_principal_id UUID REFERENCES principals(id),
 job_id UUID REFERENCES impar_analysis_jobs(id),
 error_code TEXT,
 idempotency_key TEXT NOT NULL CHECK(char_length(idempotency_key) BETWEEN 1 AND 128),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 FOREIGN KEY(analysis_id,owner_person_id) REFERENCES impar_analyses(id,owner_person_id),
 UNIQUE(owner_person_id,idempotency_key)
);
CREATE INDEX impar_analysis_requests_queue ON impar_analysis_requests(state,created_at);
CREATE INDEX impar_analysis_requests_owner ON impar_analysis_requests(owner_person_id,created_at DESC);
CREATE TRIGGER impar_analysis_requests_updated BEFORE UPDATE ON impar_analysis_requests FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE reconstruction_jobs
  ADD COLUMN requested_by_principal_id UUID REFERENCES principals(id);

CREATE INDEX reconstruction_jobs_requester ON reconstruction_jobs(requested_by_principal_id,created_at DESC)
  WHERE requested_by_principal_id IS NOT NULL;

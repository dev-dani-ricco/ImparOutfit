ALTER TABLE reconstruction_jobs DROP CONSTRAINT reconstruction_jobs_state_check;
ALTER TABLE reconstruction_jobs ADD CONSTRAINT reconstruction_jobs_state_check
  CHECK(state IN ('CAPTURED','VALIDATING','QUEUED','PROCESSING','QUALITY_CHECK','READY','NEEDS_MORE_INPUT','FAILED','CANCELLED'));

ALTER TABLE reconstruction_jobs
  ADD COLUMN idempotency_key TEXT,
  ADD COLUMN idempotency_fingerprint CHAR(64),
  ADD CONSTRAINT reconstruction_jobs_idempotency_pair CHECK (
    (idempotency_key IS NULL AND idempotency_fingerprint IS NULL)
    OR (
      idempotency_key IS NOT NULL
      AND char_length(idempotency_key) BETWEEN 1 AND 128
      AND idempotency_fingerprint ~ '^[0-9a-f]{64}$'
    )
  );

CREATE UNIQUE INDEX reconstruction_jobs_person_idempotency_key
  ON reconstruction_jobs(person_id,idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS avatar_provider_identities (
  person_id uuid NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  provider text NOT NULL,
  external_user_id varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (person_id, provider),
  CONSTRAINT avatar_provider_identities_provider_chk
    CHECK (provider IN ('AVATURN')),
  CONSTRAINT avatar_provider_identities_external_user_chk
    CHECK (external_user_id ~ '^[A-Za-z0-9_-]{1,100}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS avatar_provider_identities_provider_external_uidx
  ON avatar_provider_identities(provider, external_user_id);

COMMENT ON TABLE avatar_provider_identities IS
  'Pseudonymous mapping between an IMPAR Outfit person and an external avatar provider identity. No photos or provider tokens are stored here.';

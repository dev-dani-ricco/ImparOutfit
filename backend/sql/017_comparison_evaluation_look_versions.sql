ALTER TABLE look_versions ADD CONSTRAINT look_versions_id_look_owner_unique UNIQUE(id,look_id,person_id);

ALTER TABLE comparison_evaluation_results ADD COLUMN look_version_id UUID;
ALTER TABLE comparison_evaluation_results ADD CONSTRAINT comparison_evaluation_results_look_version_required
  CHECK(look_version_id IS NOT NULL) NOT VALID;
ALTER TABLE comparison_evaluation_results ADD CONSTRAINT comparison_evaluation_results_look_version_owner
  FOREIGN KEY(look_version_id,look_id,owner_person_id) REFERENCES look_versions(id,look_id,person_id);

CREATE INDEX comparison_evaluation_results_look_version
  ON comparison_evaluation_results(look_version_id,owner_person_id);

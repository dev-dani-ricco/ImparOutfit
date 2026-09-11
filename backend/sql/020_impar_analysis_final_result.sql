ALTER TABLE impar_analysis_results
  ADD CONSTRAINT impar_analysis_results_id_analysis_owner_unique UNIQUE(id,analysis_id,owner_person_id);

ALTER TABLE impar_analyses ADD COLUMN final_result_id UUID;

ALTER TABLE impar_analyses
  ADD CONSTRAINT impar_analyses_final_result_same_analysis_owner_fk
  FOREIGN KEY(final_result_id,id,owner_person_id)
  REFERENCES impar_analysis_results(id,analysis_id,owner_person_id);

CREATE INDEX impar_analyses_final_result_id ON impar_analyses(final_result_id)
  WHERE final_result_id IS NOT NULL;

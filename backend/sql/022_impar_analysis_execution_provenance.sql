ALTER TABLE impar_analysis_results
  ADD COLUMN created_by_person_id UUID REFERENCES persons(id),
  ADD COLUMN finalized_by_person_id UUID REFERENCES persons(id);

ALTER TABLE impar_analyses
  ADD COLUMN completed_by_person_id UUID REFERENCES persons(id);

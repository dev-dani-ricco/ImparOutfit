ALTER TABLE impar_analyses ALTER COLUMN origin DROP NOT NULL;

ALTER TABLE impar_analysis_results
  ADD COLUMN result_schema_version INT,
  ADD CONSTRAINT impar_analysis_results_schema_version_check
    CHECK(result_schema_version IS NULL OR result_schema_version > 0);

ALTER TABLE impar_analyses
  ADD CONSTRAINT impar_analyses_status_final_result_check
    CHECK(
      (status='DRAFT' AND final_result_id IS NULL) OR
      (status='COMPLETED' AND final_result_id IS NOT NULL)
    );

ALTER TABLE ai_executions ADD COLUMN retrieval_strategy TEXT;
ALTER TABLE ai_executions ADD COLUMN retrieval_version TEXT;
ALTER TABLE ai_executions ADD COLUMN authorized_knowledge_version_ids JSONB;
ALTER TABLE ai_executions ADD COLUMN selected_knowledge_units JSONB;
ALTER TABLE ai_executions ADD COLUMN retrieval_unit_count INT CHECK(retrieval_unit_count IS NULL OR retrieval_unit_count>=0);

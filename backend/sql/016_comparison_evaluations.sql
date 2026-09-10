ALTER TABLE comparison_looks ADD CONSTRAINT comparison_looks_owner_unique UNIQUE(comparison_id,look_id,owner_person_id);

CREATE TABLE comparison_evaluations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 comparison_id UUID NOT NULL,
 owner_person_id UUID NOT NULL REFERENCES persons(id),
 context_id UUID,
 origin TEXT NOT NULL CHECK(origin IN ('USER','SYSTEM')),
 status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','COMPLETED')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(id,owner_person_id),
 UNIQUE(id,comparison_id,owner_person_id),
 FOREIGN KEY(comparison_id,owner_person_id) REFERENCES comparisons(id,owner_person_id) ON DELETE CASCADE,
 FOREIGN KEY(context_id,owner_person_id) REFERENCES contexts(id,owner_person_id)
);
CREATE INDEX comparison_evaluations_owner_created_at ON comparison_evaluations(owner_person_id,created_at DESC);
CREATE INDEX comparison_evaluations_comparison_created_at ON comparison_evaluations(comparison_id,created_at DESC);

CREATE TABLE comparison_evaluation_criteria (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 evaluation_id UUID NOT NULL,
 owner_person_id UUID NOT NULL REFERENCES persons(id),
 criterion_key TEXT NOT NULL CHECK(length(btrim(criterion_key))>0),
 criterion_label TEXT,
 position INT NOT NULL CHECK(position>=0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(id,owner_person_id),
 UNIQUE(evaluation_id,position),
 UNIQUE(evaluation_id,id,owner_person_id),
 FOREIGN KEY(evaluation_id,owner_person_id) REFERENCES comparison_evaluations(id,owner_person_id) ON DELETE CASCADE
);
CREATE INDEX comparison_evaluation_criteria_owner_created_at ON comparison_evaluation_criteria(owner_person_id,created_at DESC);

CREATE TABLE comparison_evaluation_results (
 evaluation_id UUID NOT NULL,
 comparison_id UUID NOT NULL,
 look_id UUID NOT NULL,
 criterion_id UUID NOT NULL,
 owner_person_id UUID NOT NULL REFERENCES persons(id),
 value TEXT,
 note TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(evaluation_id,look_id,criterion_id),
 FOREIGN KEY(evaluation_id,comparison_id,owner_person_id) REFERENCES comparison_evaluations(id,comparison_id,owner_person_id) ON DELETE CASCADE,
 FOREIGN KEY(evaluation_id,criterion_id,owner_person_id) REFERENCES comparison_evaluation_criteria(evaluation_id,id,owner_person_id) ON DELETE CASCADE,
 FOREIGN KEY(comparison_id,look_id,owner_person_id) REFERENCES comparison_looks(comparison_id,look_id,owner_person_id) ON DELETE CASCADE
);
CREATE INDEX comparison_evaluation_results_look ON comparison_evaluation_results(look_id,owner_person_id);
CREATE INDEX comparison_evaluation_results_owner_created_at ON comparison_evaluation_results(owner_person_id,created_at DESC);

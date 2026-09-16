# Private Prompt / Instruction Registry

The Prompt Registry governs operational AI instructions without storing their
content in this repository or exposing it through public APIs.

`PromptDefinition` is the stable institutional identity for the sole current
task, `IMPAR_ANALYSIS`. `PromptVersion` is an immutable historical version with
an opaque private-content reference, SHA-256 content hash, lifecycle and real
Principal provenance. It contains no instruction text.

Versions move from DRAFT to PUBLISHED to RETIRED. New AnalysisJobs select only
the published version. A Job snapshots its exact version in its idempotency
fingerprint; retries may execute that historical PUBLISHED or RETIRED snapshot,
never an implicit latest version. Legacy Jobs without a snapshot are not
backfilled and fail honestly.

At execution, the AI Gateway loads the exact PromptVersion and calls the
private Prompt Content Resolver. Production has no configured resolver and
fails with `PROMPT_NOT_AVAILABLE`; an empty or invalid resolution fails with
`INVALID_PROMPT_CONTENT`. Synthetic resolver doubles are explicit test-only
injection. The provider receives only the execution envelope it needs.

AIExecution records the PromptVersion identifier only. It stores no prompt
content, opaque reference, credentials, CoT, raw request, private Knowledge or
provider response. Neither Job nor Result DTOs expose private prompt material.

Prompt is not Methodology, Authorized Knowledge, AI Policy or Agent:
Methodology is the institutional method; Knowledge is authorized content; Policy
controls provider/model/timeout; Prompt is the versioned operating instruction;
Agent remains future architecture and is not implemented here. This registry
does not implement RAG, embeddings, a provider, an Agent Registry, a frontend
or administrative CRUD.

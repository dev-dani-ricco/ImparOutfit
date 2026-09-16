# AI Gateway Foundation

`AnalysisJob` calls the internal AI Gateway with an exact PolicyVersion. The
Gateway selects the policy-controlled provider, model and timeout, invokes a
Provider Adapter, returns a normalized technical result and records an
`AIExecution` provenance record.

Task is not Agent or Prompt; Agent is not Model. `AIExecution` is neither an
AnalysisJob nor an AnalysisResult. It has no retry, recovery, cancel, lease or
Attempt lifecycle: those remain owned by AnalysisJob.

Policies use DRAFT, PUBLISHED and RETIRED versions. New jobs select the single
PUBLISHED version. A job snapshots its exact PolicyVersion; retirement prevents
new selection but permits a legitimately anchored historical retry. V1→V2 never
rewrites J1; a later J2 selects V2.

Production has no configured provider and fails honestly with
`PROVIDER_UNAVAILABLE`. Deterministic adapters are test-only injection.
Timeout and invalid provider responses become sanitized `PROVIDER_TIMEOUT` and
`INVALID_PROVIDER_RESPONSE`. Provider/model/timeout are server-controlled.

AIExecution stores safe task, policy, provider/model, requester/owner,
consumer reference, usage and latency. It stores no prompt, CoT, credentials,
private Knowledge, private refs or raw provider response. The Gateway performs
no RAG or retrieval; authorized Knowledge references are prepared by Analysis.

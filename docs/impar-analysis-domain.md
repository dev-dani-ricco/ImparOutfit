# ÍMPAR Analysis domain

An ÍMPAR Analysis is private data owned by one Person. `owner_person_id` answers who owns the data; it does not grant institutional execution authority.

## Lifecycle and authority

An Analysis is created as `DRAFT`. It has explicit historical references to a LookVersion and Context. A caller may request their own Analysis, but cannot provide `origin` or `methodologyVersionRef`; both are nullable until a future institutional flow assigns an opaque reference. Historical `SYSTEM` or `EXPERT` origins and historical methodology references remain readable as stored.

Creating, finalizing, and completing Results require private ownership plus the active institutional capability `impar.analysis.execute`. Capability does not alter ownership, and origin does not grant authority.

Execution provenance records the authenticated Person that created a Result, first finalized it, and first completed its Analysis. Owner is not necessarily executor. Origin is neither authorization nor actor.

## Results and historical interpretation

An AnalysisResult has two independent versions:

- `resultVersion` is the ordered historical generation within an Analysis.
- `resultSchemaVersion` identifies the structural payload contract. New API Results use server-controlled version `1`; legacy Results retain `null` when their schema version is unknown.

The v1 payload is a JSON object. Arrays, null, and sensitive execution internals are rejected. The technical contract contains no methodology, recommendation, ranking, or private reasoning.

A `DRAFT` Result can become `FINAL` once. A FINAL Result is historical and immutable through the API; a new output requires a new Result and `resultVersion`.

## Official result and completed history

`finalResultId` is the explicit official Result selected at completion. A FINAL Result is not automatically official, and the latest Result is not automatically official. Multiple FINAL Results may exist while `finalResultId` continues to identify a prior explicit choice.

The database requires a DRAFT Analysis to have no `final_result_id`, and a COMPLETED Analysis to have one. Completion changes state and anchors the explicit FINAL Result atomically. A COMPLETED Analysis is historical and immutable through the API; there is no reopen or semantic edit route.

## Historical Context

Contexts are effectively immutable in the current API: the domain exposes creation and private reads/linking only, with no update or deletion route. Therefore an Analysis keeps the semantic Context it was created against. A future semantic change must create a new Context rather than mutate an existing one.

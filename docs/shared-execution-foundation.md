# Shared Execution Foundation

`backend/src/execution/primitives.js` contém apenas mecanismos técnicos já
comprovados em Reconstruction e ÍMPAR Analysis:

- transação com commit/rollback;
- SHA-256 do JSON de envelope cuja ordem é definida pelo domínio;
- validação de `Idempotency-Key`;
- predicado de budget de retry por attempt.

As primitives não conhecem tabelas, owners, Principals, capabilities, Jobs,
Attempts, Results, workers, lease SQL ou state machines. Cada domínio preserva
seu namespace de idempotência, transação de criação, autorização, constraints,
claim condicional, duração de lease, failure codes e persistência de retry e
recovery.

Reconstruction continua responsável por CaptureSession, mídia, GLB, outputs,
AssetVersion, Quality Gate e inspeção. Analysis continua responsável por
LookVersion, Context, MethodologyVersion, Authorized Knowledge, executor
determinístico, AnalysisResult e finalização explícita.

Um terceiro consumidor pode reutilizar estas primitives pontualmente, após
provar equivalência de comportamento. Ele não herda schema, Job, Attempt,
Result, snapshot, worker ou estado de qualquer outro domínio.

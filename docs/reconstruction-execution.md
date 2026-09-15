# Reconstruction execution lifecycle

## Lifecycle

Uma requisição autenticada cria uma `CaptureSession` e um `reconstruction_job`.
O owner permanece uma `Person`; o `requested_by_principal_id` registra o
Principal humano autenticado que solicitou a operação. Requester não é owner e
não é worker.

`Idempotency-Key`, quando fornecida, é escopada pela Person e combinada com um
fingerprint SHA-256 do pedido sanitizado. A repetição compatível retorna o mesmo
Job e a mesma CaptureSession; uma chave reutilizada para outro pedido retorna
conflito. A chave e o fingerprint não são expostos pela API.

Após inputs e validação, o Job entra em `QUEUED`. O worker local faz claim
atômico, cria ou atualiza a `ReconstructionAttempt` correspondente e move o Job
para `PROCESSING` com lease. O worker atual não possui Principal técnico:
executor desconhecido permanece desconhecido.

Sucesso ou falha continuam no pipeline de domínio. `reconstruction_outputs` é
o resultado técnico privado; o quality gate e a inspeção permanecem obrigatórios
antes de produzir o artefato consumível em `asset_versions`. Retry e recovery
nunca promovem output nem ignoram processing, quality gate ou inspeção.

## Retry, recovery e cancelamento

Um Job `FAILED` pode ser reenfileirado por seu owner. `attempt` é a única fonte
de verdade para o orçamento; `RECONSTRUCTION_MAX_RETRIES` é configurável e usa
o padrão conservador atual quando ausente. Cada novo claim aumenta a sequência;
tentativas anteriores permanecem históricas.

Lease expirada encerra a tentativa em andamento com código sanitizado
`WORKER_LEASE_EXPIRED`. Se houver orçamento, o Job retorna a `QUEUED`; caso
contrário, fica `FAILED`. `QUEUED` pode ser cancelado. `CANCELLED` é idempotente;
`PROCESSING` não é cancelado artificialmente enquanto não houver interrupção
cooperativa segura.

## Limites arquiteturais

ReconstructionJob é execução do domínio Reconstruction e ReconstructionAttempt
é sua tentativa técnica. Não existe `ExecutionJob` genérico, `ExecutionAttempt`
genérico ou Machine Principal. Infraestrutura compartilhada só deve ser extraída
quando houver um segundo consumidor real que comprove abstrações comuns.

AI Gateway, execução LLM, RAG e execução de Agents permanecem **não
implementados**.

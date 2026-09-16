# Governed ÍMPAR Analysis execution

## Limites do domínio

`impar_analyses` é o registro de negócio privado. `impar_analysis_jobs` é a
execução técnica assíncrona desse registro; um não substitui o outro. Cada Job
preserva o owner (`owner_person_id`), o Principal humano solicitante
(`requested_by_principal_id`) e o envelope exato: Analysis, LookVersion,
Context, MethodologyVersion e as AuthorizedKnowledgeVersions vinculadas.

Person é owner dos dados. Principal é requester institucional autenticado. O
worker local não recebe Principal artificial: requester não é executor e
executor técnico permanece desconhecido.

## Enqueue e privacidade

O enqueue exige que a Analysis seja privada da Person, esteja `DRAFT` e que o
Principal tenha `impar.analysis.execute`. Acesso a Analysis de outra Person é
ocultado como `404`, inclusive leitura, retry e cancelamento. A execução nunca
seleciona versões `latest`: MethodologyVersion e Knowledge são snapshots
explícitos no momento do enqueue.

`Idempotency-Key` é escopada pelo owner e protegida por fingerprint SHA-256 do
envelope sanitizado. Replays compatíveis convergem no mesmo Job; envelope
incompatível retorna conflito. Chave, fingerprint, lease, referências privadas
e conteúdo de Knowledge não aparecem no DTO público.

## Worker e resultado

O worker local reivindica `QUEUED` com transição condicional atômica,
incrementa a sequência e cria `impar_analysis_attempts`. A lease protege o
processamento; dois workers não obtêm o mesmo Job. O resolvedor de Knowledge
é injetável em testes. Em produção, provider privado ausente falha honestamente
com código sanitizado `SERVICE_UNAVAILABLE`; não produz análise vazia.

O executor determinístico somente valida o envelope autorizado e cria um
`impar_analysis_results` **DRAFT** técnico, sem conteúdo privado resolvido. A
criação do Result e o vínculo `job.result_id`/`SUCCEEDED` ocorrem na mesma
transação. Portanto `AnalysisJob SUCCEEDED` não é `AnalysisResult FINAL`.

O worker não finaliza Result, não seleciona `final_result_id` e não completa a
Analysis. Result FINAL também não completa Analysis: a conclusão institucional
usa o fluxo explícito existente e um `resultId` escolhido.

## Falha, retry, recovery e cancelamento

Falhas fecham a Attempt e o Job sem stack, SQL, prompt ou Knowledge content.
`IMPAR_ANALYSIS_MAX_RETRIES` é o único orçamento de retry; `attempt` é sua
fonte de verdade. Retry de `FAILED` retorna `QUEUED`, preserva o snapshot e
cria nova Attempt apenas no próximo claim.

Uma lease expirada fecha a Attempt com `WORKER_LEASE_EXPIRED`; com orçamento o
Job é reenfileirado, sem orçamento permanece `FAILED`. O recovery usa locking
e guarda condicional portátil. `QUEUED` pode ir para `CANCELLED`; repetir é
idempotente. `PROCESSING` retorna conflito enquanto não houver interrupção
cooperativa segura.

## Estado atual

AI **não implementada**. LLM **não implementado**. RAG **não implementado**.
Agents **não implementados**. Machine Principal **não implementado**. Não existe
ExecutionJob, ExecutionAttempt ou Shared Execution Engine genérico. Uma extração compartilhada só será avaliada
após comparar este segundo consumidor real com Reconstruction.

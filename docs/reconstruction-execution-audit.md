# Auditoria de execução da Reconstruction

## Pipeline encontrado

O fluxo privado é `POST /reconstruction/jobs` → `CaptureSession` e
`reconstruction_jobs` → upload de inputs → `submit` → worker local →
`reconstruction_outputs` → inspeção/quality gate → `asset_versions`.

`backend/src/controllers/reconstructionController.js` cria e opera o recurso
privado. `backend/src/reconstruction/service.js` aplica autorização, transições
e claim. `backend/src/reconstruction/worker.js` executa o adaptador local,
persiste output ou falha e recupera leases vencidos. As bases são
`backend/sql/009_reconstruction.sql` e `010_capture_sessions.sql`, evoluídas
pelas migrations de hardening posteriores.

## Estado persistente e tentativa

`reconstruction_jobs` é a fila persistente do domínio, não uma plataforma de
jobs genérica. `reconstruction_attempts` é a tentativa técnica histórica da
Reconstruction; não foi substituída por uma entidade paralela.

O claim pesquisa filas com `FOR UPDATE SKIP LOCKED` e confirma posse com
`UPDATE ... WHERE state='QUEUED' RETURNING`. A segunda condição é necessária
para exclusão também no harness PGlite. O job claimed recebe `lease_until`.

Antes do hardening, a recuperação de lease apenas marcava o job como falho. O
hardening encerra a tentativa com `WORKER_LEASE_EXPIRED` e só reenfileira dentro
do orçamento de retry. A recuperação usa `FOR UPDATE SKIP LOCKED` e uma guarda
condicional sobre o lease para impedir dupla recuperação.

## Riscos tratados e decisão

Foram tratados duplicação por retry HTTP, retry concorrente, lease órfão,
cancelamento enganoso e dupla posse lógica do worker. Outputs, quality gate e
AssetVersion continuam exclusivamente no domínio Reconstruction.

A decisão é **EVOLUIR** o mecanismo existente. Criar `ExecutionJob` ou
`ExecutionAttempt` genérico duplicaria estados, tentativas e resultados que já
possuem significado próprio no pipeline 3D.

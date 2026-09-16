# Execution patterns: Reconstruction and ÍMPAR Analysis

Esta comparação descreve implementações existentes. O ciclo 4G extraiu somente
primitives técnicas sem schema, Job, Attempt, worker ou estado de negócio.

| Aspecto | Classificação | Evidência factual |
| --- | --- | --- |
| Transação, SHA-256 de envelope, key validation e retry predicate | SHARED PRIMITIVE | `execution/primitives.js` preserva comportamento sem conhecer domínio. |
| Person owner e Principal requester | DOMAIN-SPECIFIC | Ambos preservam a separação, mas autorização e colunas continuam nos domínios. |
| Estados de Job, claim condicional e lease | NOT EXTRACTED | UPDATE/Attempt/eventos e durações são específicos, embora a exclusão seja equivalente. |
| Idempotência escopada pelo owner | NOT EXTRACTED | Primitive trata key/hash; lock, tabela, namespace e replay continuam específicos. |
| Attempts, sequência, retry, recovery e cancelamento | NOT EXTRACTED | A decisão por budget é compartilhada; persistência e transições são de domínio. |
| Falha sanitizada, privacidade e DTO seguro | SHARED CANDIDATE | Ambos ocultam dados cross-owner e não expõem detalhes operacionais privados. |
| Resultado técnico | DOMAIN-SPECIFIC | Reconstruction produz `reconstruction_outputs` e depois `asset_versions`; Analysis produz `impar_analysis_results` DRAFT. |
| Quality Gate e inspeção | DOMAIN-SPECIFIC | Obrigatórios somente no pipeline Reconstruction. |
| MethodologyVersion e Authorized Knowledge snapshot | DOMAIN-SPECIFIC | Obrigatórios somente na execução institucional de Analysis. |
| Capability | DOMAIN-SPECIFIC | Analysis exige `impar.analysis.execute`; Reconstruction conserva sua própria autoridade de domínio. |
| Worker | DOMAIN-SPECIFIC | Reconstruction chama pipeline 3D; Analysis valida envelope determinístico, sem IA. |

Os candidatos compartilhados não exigem schemas idênticos. Não existe Shared
Execution Engine. Um terceiro consumidor pode compor apenas as primitives de
que precisar, sem herdar Job, Attempt, Result, snapshot, worker ou state machine.

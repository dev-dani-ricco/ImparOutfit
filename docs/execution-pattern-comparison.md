# Execution patterns: Reconstruction and ÍMPAR Analysis

Esta comparação descreve implementações existentes; não introduz schema ou
código compartilhado.

| Aspecto | Classificação | Evidência factual |
| --- | --- | --- |
| Person owner e Principal requester | SHARED CANDIDATE | Ambos preservam owner privado e requester humano separados. |
| Estados de Job, claim condicional e lease | SHARED CANDIDATE | Ambos usam QUEUED/PROCESSING e transição condicional para exclusão de worker. |
| Idempotência escopada pelo owner | SHARED CANDIDATE | Ambos usam chave e fingerprint sanitizado, com unicidade de banco. |
| Attempts, sequência, retry, recovery e cancelamento | SHARED CANDIDATE | Ambos mantêm histórico técnico, orçamento por attempt e cancelamento honesto de QUEUED. |
| Falha sanitizada, privacidade e DTO seguro | SHARED CANDIDATE | Ambos ocultam dados cross-owner e não expõem detalhes operacionais privados. |
| Resultado técnico | DOMAIN-SPECIFIC | Reconstruction produz `reconstruction_outputs` e depois `asset_versions`; Analysis produz `impar_analysis_results` DRAFT. |
| Quality Gate e inspeção | DOMAIN-SPECIFIC | Obrigatórios somente no pipeline Reconstruction. |
| MethodologyVersion e Authorized Knowledge snapshot | DOMAIN-SPECIFIC | Obrigatórios somente na execução institucional de Analysis. |
| Capability | DOMAIN-SPECIFIC | Analysis exige `impar.analysis.execute`; Reconstruction conserva sua própria autoridade de domínio. |
| Worker | DOMAIN-SPECIFIC | Reconstruction chama pipeline 3D; Analysis valida envelope determinístico, sem IA. |

Os candidatos compartilhados são padrões comprovados, não exigência de schemas
idênticos. Nenhuma extração para Shared Execution foi feita. A decisão só pode
ser tomada em ciclo posterior, com base nesta comparação e em novos consumidores
reais.

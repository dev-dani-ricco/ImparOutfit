# Caminho de produção 3D

| Estágio | Solução atual | Limitação | Próximo gatilho |
| --- | --- | --- | --- |
| Captura | Fotos multivista autenticadas | Sem validação visual em tempo real | Dados de recaptura mostrarem baixa cobertura/foco recorrente |
| Fila | PostgreSQL + worker iniciado manualmente | Um job por invocação, sem agendamento durável | Uso simultâneo ou jobs pendentes recorrentes |
| Reconstrução | COLMAP CPU + OpenCV SGBM local | CPU antiga, superfície parcial e sem textura PBR | Um fluxo real exceder prazo ou falhar por densidade |
| Storage | Volume privado local | Sem redundância e sem sync entre máquinas | Primeiro teste remoto, backup ou dispositivo adicional |
| Quality | Métricas + inspeção humana | Thresholds globais da POC | Amostra por categoria suficiente para calibração |
| Avatar | GLB genérico de referência | Não é avatar corporal personalizado | Após uma peça real READY e requisitos de medidas aprovados |

Produção proposta: mobile faz upload autorizado para storage privado; API cria job e publica em fila durável; worker CPU/GPU isolado lê somente o manifest autorizado; worker grava asset privado e métricas; quality gate atualiza o job; cliente sincroniza metadados e baixa o GLB por API autorizada. Mensagens de fila devem conter IDs, nunca fotos, URLs públicas, medidas ou conteúdo de captura. Logs devem permitir somente IDs, versão, estados, duração e códigos de falha.

Uma evolução GPU requer benchmark com capturas reais, revisão de licença/distribuição e worker isolado. Ela não está aprovada por existir uma possibilidade técnica: o gatilho é evidência de que CPU não satisfaz qualidade ou prazo acordado.

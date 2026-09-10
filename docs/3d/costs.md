# Custos e gatilhos — CICLO 2

| Item | Solução atual | Custo incremental atual | Limitação | Evolução e gatilho |
| --- | --- | ---: | --- | --- |
| Reconstrução | CPU local, COLMAP/OpenCV | R$0 | Hardware i5-2400 sem CUDA; processamento limitado | Worker GPU após benchmark real demonstrar prazo/qualidade insuficientes; custo depende do provedor e volume medido |
| Fila | PostgreSQL e comando manual | R$0 | Sem execução contínua | Fila/worker durável quando houver concorrência ou backlog |
| Storage | Diretório privado local | R$0 incremental | Sem redundância/backup remoto | Object storage privado quando houver sync, retenção ou recuperação exigida |
| Renderer | Expo/Three já presente | R$0 | Avatar genérico; sem física | Development Build/custom native somente se o renderer atual bloquear uma composição real validada |

Nenhum serviço pago, GPU cloud, object storage ou novo custo recorrente foi contratado neste ciclo. Não há estimativa responsável de custo futuro sem volume de fotos, duração de jobs, tamanho de GLBs, retenção e taxa de recaptura observados em experimentos físicos.

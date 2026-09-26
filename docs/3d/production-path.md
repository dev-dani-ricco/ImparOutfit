# Caminho de produção 3D

| Estágio | Solução atual | Limitação | Próximo gatilho |
| --- | --- | --- | --- |
| Avatar | Base MakeHuman/MPFB2 CC0 paramétrica + Avatar Studio | Não é scan biométrico | Validar presets, performance e persistência conectada |
| Cabelo | 4 meshes 3D CC0 modulares | Biblioteca inicial | Ampliar estilos após QA visual/licença |
| Captura de roupa | Fotos multivista autenticadas | Sem validação visual em tempo real | Dados de recaptura mostrarem baixa cobertura/foco recorrente |
| Fila | PostgreSQL + worker iniciado manualmente | Um job por invocação | Uso simultâneo ou jobs pendentes recorrentes |
| Reconstrução | COLMAP CPU + OpenCV SGBM local | CPU antiga, superfície parcial e sem PBR robusto | Fluxo real exceder prazo ou falhar por densidade |
| Storage | Volume privado local | Sem redundância/sync entre máquinas | Primeiro teste remoto ou dispositivo adicional |
| Quality | Métricas + inspeção humana | Thresholds globais da POC | Amostra por categoria suficiente para calibração |
| Fit V1 | Escala física de referência + adaptação proporcional por categoria/medidas | Sem skin transfer, colisão ou tecido | Primeiro conjunto real de peças READY por categoria |
| Fit V2 | A VALIDAR | Landmarks/cage/rig/occlusion | Evidência de que Fit V1 é insuficiente para decisão visual |
| Cloth | Não implementado | Alto custo técnico/GPU | Só adotar após caso de negócio e benchmark |

Produção proposta: mobile envia mídia autorizada para storage privado; API cria job e publica em fila durável; worker isolado processa somente manifest autorizado; output GLB e métricas passam pelo quality gate; o app compõe a peça no avatar paramétrico usando medidas da pessoa.

Mensagens de fila devem conter IDs, nunca fotos, URLs públicas ou medidas. Logs devem registrar IDs, versão, estados, duração e códigos de falha, sem conteúdo pessoal.

Uma evolução GPU ou provedor externo de avatar só deve ser adotada após benchmark, revisão de licença, privacidade, SLA, custo e lock-in. A existência da tecnologia não é, por si, justificativa de arquitetura.

# Protocolos de captura

`category → protocol → expected shots → validation rules` é configurado em `backend/src/reconstruction/policy.json`. TOP usa `TOP_CAPTURE_V1`: 36 posições recomendadas, três alturas e passos de 30°. O mínimo técnico atual para enfileirar continua configurado no quality pipeline; quando falha, a sessão retorna somente posições ausentes para recaptura. PANTS, DRESS, FOOTWEAR, BAG e ACCESSORY têm contratos configurados, mas permanecem `NOT_RUN`.

# Matriz de experimentos — CICLO 2

| Família | Técnica planejada | Protocolo mínimo | Estado | Evidência pública sanitizada |
| --- | --- | --- | --- | --- |
| Top/camiseta | SfM + SGBM CPU | 36 fotos, três alturas, suporte imóvel | NOT_RUN | Nenhuma captura física fornecida |
| Calça | SfM + SGBM CPU | 36 fotos, frente/costas/laterais, suporte imóvel | NOT_RUN | Nenhuma captura física fornecida |
| Vestido | SfM + SGBM CPU | 36 fotos, evitar movimento do tecido | NOT_RUN | Nenhuma captura física fornecida |
| Calçado | SfM + SGBM CPU | 36 fotos, textura e sola visíveis | NOT_RUN | Nenhuma captura física fornecida |
| Bolsa | SfM + SGBM CPU | 36 fotos, alças e interior quando relevante | NOT_RUN | Nenhuma captura física fornecida |
| Acessório pequeno | SfM + SGBM CPU | 36 fotos, macro estável e fundo contrastante | NOT_RUN | Nenhuma captura física fornecida |

O controle de renderer usa geometria sintética e é registrado somente como teste de integração: não representa peça física nem contribui para taxa de sucesso por família. Uma execução real deve substituir cada `NOT_RUN` por `READY`, `NEEDS_MORE_INPUT` ou `FAILED`, com causa e métricas sanitizadas.

O [controle sintético de 2026-09-10](control-20260910.md) executou a etapa SfM e terminou em `NEEDS_MORE_INPUT` por cobertura insuficiente; ele confirma o comportamento do gate, não a reconstrução de uma peça.

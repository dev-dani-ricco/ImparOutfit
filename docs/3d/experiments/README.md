# Experimentos 3D privados

Capturas, manifests com caminhos de imagem, GLBs, screenshots e resultados brutos pertencem a `private/` ignorado pelo Git. Este diretório contém somente protocolo, schema de registro e resultado sanitizado. `NOT_RUN` significa que não houve captura física fornecida; não significa falha nem sucesso.

Para um experimento real, crie manifest privado com `source: REAL_PHYSICAL_CAPTURE`, categoria, fotos relativas, azimute e elevação. Execute:

```sh
python tools/reconstruction/run_experiment.py --manifest private/experiments/<id>/input.json --output private/experiments/<id>/output
```

O runner exige proveniência explícita, recalcula hashes, rejeita cobertura insuficiente e grava um `experiment.json` privado. Registre: contagem de fotos, fundo, luz, hardware, técnica, duração, geometria, cor/textura, escala, resultado, correções e causa provável. Nunca copie fotos, medidas identificáveis, caminhos ou hashes de capturas pessoais para este Git.

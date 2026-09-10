# Assets, tentativas e retenção

`CaptureSession → ReconstructionJob → ReconstructionAttempt → ReconstructionOutput → AssetVersion`. Cada tentativa guarda revisão de inputs e versão de pipeline; cada saída GLB cria uma versão de asset, sem sobrescrever a anterior. SOURCE, DERIVED, REGENERABLE e PRESERVE continuam privados. Não há remoção automática; retenção, regeneração, exclusão explícita e exceções legais serão configuradas antes de produção.

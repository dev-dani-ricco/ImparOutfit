# ADR 002 — reconstrução local por CPU

Decisão experimental em 2026-09-09: COLMAP/PyCOLMAP para SfM e poses reais; testar
estéreo retificado OpenCV SGBM para superfície derivada das imagens em CPU. Exportar
GLB com cores por vértice, sem afirmar textura PBR ou superfície fechada. Nenhuma
geometria generativa/genérica substitui falha da captura. Gate conserva falhas.

| Alternativa | Geometria/cor/escala | Hardware, automação e maturidade | Licença/custo/decisão |
| --- | --- | --- | --- |
| COLMAP + OpenMVS | SfM, MVS denso, mesh e textura; escala requer referência | CLI madura; denso CPU possível; instalação OpenMVS nativa não disponível localmente | COLMAP BSD; OpenMVS AGPL e dependências exigem revisão de distribuição. Sem custo de licença; alternativa de evolução em worker isolado. |
| COLMAP + OpenCV SGBM | Triangulação real de pares; superfícies parciais, sobreposições e oclusões são riscos; cor amostrada das fotos | Executável Python CPU, limitado a resoluções/pares modestos; integração POC própria precisa validação | BSD/Apache e dependências permissivas; zero serviço contratado. Escolha experimental para observar gargalos. |
| Meshroom/AliceVision | Pipeline SfM/denso/textura; sem escala automática confiável | Fluxo visual/CLI; denso tradicional depende CUDA; draft não equivale à qualidade densa | MPL2 e dependências; sem compra, inadequado ao hardware atual para caminho denso principal. |
| NeRF/3D Gaussian Splatting | Síntese de vistas não garante mesh, dimensões ou composição física | Treino/render GPU e conversão adicional; identidade geométrica precisa validação | Licença por implementação/modelo; custo GPU futuro. Não selecionado para substituir malha da peça. |
| Reconstrução generativa de imagem única | Pode inventar costas, detalhes, textura e escala | Priors úteis como hipótese, insuficientes como prova da peça capturada | Pesos/licenças/VRAM variáveis; rejeitada como evidência principal desta POC. |

Fontes primárias consultadas:
- https://colmap.github.io/faq.html (SIFT CPU; dense PatchMatch requer CUDA).
- https://github.com/cdcseacave/openMVS e COPYRIGHT.md (etapas e licenças).
- https://github.com/alicevision/Meshroom (arquitetura e requisitos).
- https://docs.opencv.org/4.13.0/d2/d85/classcv_1_1StereoSGBM.html (algoritmo e consumo de memória).
- https://docs.opencv.org/4.13.0/d9/d0c/group__calib3d.html (retificação/reprojeção).

Escala não nasce do SfM: usar referência dimensional declarada e dois pontos sobre a
malha, com provenance. Nenhuma precisão inferida sem validação. Capturar objeto parado,
câmera em volta, sobreposição, exposição estável; roupas deformáveis precisam suporte.
Sem cloud paga, sem upload de dados a serviços de IA, sem troca de tecnologia do app.

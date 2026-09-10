# Estado 3D anterior à POC — CICLO 2

| Capacidade/arquivo | Classe | Evidência e limite |
| --- | --- | --- |
| BodyAvatar3D.native.js | EXPERIMENTAL | Three.js via @react-three/fiber/native e expo-gl; WebGL no native. Canvas, luzes, câmera perspectiva e geometria reais. |
| assets/models/michelle.glb | REAL (geometria), DEMO (identidade) | glTF 2, 3.276.888 bytes, 1 mesh, 16.340 vértices, 28.106 triângulos, 1 skin, 65 joints, 1 material, 4 imagens; TPose e SambaDance. Modelo genérico preexistente. |
| Rig | EXPERIMENTAL | Joints Mixamo (hips/spine/head/arms/hands/legs/feet). Nenhum anchor de roupa validado; animações embutidas não usadas pelo componente. |
| Personalização native | EXPERIMENTAL | Morphs gerados por funções gaussianas e medidas declaradas; sem calibração antropométrica. Altura geométrica base ~1,6644 unidades; renderer normaliza a 4,15 unidades de cena. Não prova centímetros. |
| Pessoa/avatar | DEMO | Profile isolado por Person no demo e API; foto facial é cartão de referência 2D, não reconstrução facial. Sem asset corporal próprio por pessoa. |
| BodyAvatar3D.js (web) | FAKE/LEGACY | Views planas com transform perspective/rotateY; sem malha/WebGL. |
| Model3DPreview.js | FAKE/LEGACY | Animated.Image gira por rotateY; não reconstrói nem carrega malha. |
| ItemFormScreen.js | DEMO | Até quatro fotos em estado local; metadata model3d sem job/worker/proveniência. Quantidade de ângulos não valida um asset. |
| Composição/fit/physics | FAKE/LEGACY (alegações) | Não existe mesh reconstruída de roupa sobre avatar, solver físico, colisão, escala física validada ou comparação 3D real. |

Stack preservada: Expo 54.0.36, RN 0.81.5, React 19.1, Three 0.185.1,
R3F 9.7.0, expo-gl 16.0.10, three-stdlib 2.36.1, expo-image-picker 17.0.11.
Extensão native seleciona renderer diferente do web. Development Client já existe;
esta auditoria não encontrou evidência que justifique substituir a stack.

GPU identificada no registro: NVIDIA GeForce GT 220. PyCOLMAP 4.2.0 instalado em
ambiente isolado informa has_cuda=False. CPU i5-2400, quatro threads, ~8 GiB RAM.
Uma malha genérica renderizada não é evidência de reconstrução da pessoa ou da peça.
***

# IMPAR Outfit — 3D V4 Role Review — 2026-09-28

## PO / Project Lead
Objective: make the 3D proposition commercially credible without presenting a proxy as a real scan.

Accepted product layers:
- parametric professional avatar for every user;
- optional photo-realistic avatar provider route;
- instant garment proxy for immediate interaction;
- private reconstructed garment GLB as the authoritative real-garment geometry after quality gate.

Acceptance:
- body, face, hair and height are editable;
- customer can understand what is parametric versus photo-realistic;
- proxy garment and reconstructed garment are visually and semantically distinct.

## Tech Lead / Architecture
Stable contracts:
- avatarSpec is provider-independent;
- profile stores versioned avatar configuration;
- provider session creation is server-side;
- garment reconstruction remains independent from the instant proxy renderer;
- private GLB output is loaded only through authenticated reconstruction output.

No framework rewrite was introduced.

## UX / Product Design
Implemented:
- task-aware camera: full body / face close-up / hair close-up;
- additional anatomy controls;
- explicit premium photo-realistic route inside Avatar Studio;
- explicit labels for tailored proxy vs quality-gated private GLB;
- garment material response by fabric class.

Next visual cycle:
- real-device visual QA on multiple skin tones and face/body extremes;
- refine lighting/background after device screenshots;
- expand curated hair library only with approved provenance.

## Mobile
Implemented:
- MakeHuman/MPFB parametric body runtime;
- 306 body morph targets available in the active GLB;
- modular hair;
- six self-contained garment GLB proxy categories;
- authenticated private garment GLB renderer;
- Expo SDK 57 bundle includes all current 3D assets.

## Backend / Data
Implemented:
- pseudonymous provider identity mapping;
- Avaturn user/session adapter;
- provider token remains server-side;
- provider session route is in OpenAPI;
- READY reconstruction jobs remain the only path that upgrades a garment from proxy to private reconstructed geometry.

## 3D / Reconstruction
Implemented:
- body controls: presentation, visual weight, muscle, shoulders, chest, waist, hips, belly, arms, arm length, thighs, calves, glutes, leg length;
- face controls: face shape/width, jaw, chin length/projection, cheek volume, forehead, nose bridge/width/length/projection, eye size/spacing/height, mouth width, lip fullness;
- appearance: skin tone, eye color, hair style/color;
- garment fabric classes: RIGID, STRUCTURED, KNIT, FLUID;
- Blender-generated TI Broker garment proxy pipeline.

Authoritative real garment path:
capture -> validation -> reconstruction worker -> quality check -> READY -> private GLB.

## Security / Privacy
Implemented:
- Avaturn token excluded from client config;
- provider identity is pseudonymous;
- provider session must be HTTPS;
- provider session hostname must match configured allow-list suffix;
- private garment GLB requires authenticated output route;
- unknown human assets remain prohibited from production;
- proxy assets have explicit provenance and cannot masquerade as reconstruction.

## QA / Release
PASS:
- frontend tests: 24/24;
- Expo Doctor: 21/21;
- Android bundle: PASS;
- six garment GLBs: valid GLB 2.0, self-contained;
- avatar provider unit tests: 3/3;
- OpenAPI route coverage: PASS;
- core backend foundation assertions: 75 functional assertions passed before a known PGlite/Node teardown RuntimeError after suite completion.

Known environment issue:
- current Node/PGlite combination can emit an asynchronous Aborted() teardown error after all foundation assertions complete. This is not treated as a product pass; it remains a QA/toolchain issue to isolate before production release.

External dependency:
- AVATURN_API_TOKEN is not configured in the current backend environment. The route and UI are implemented, but a real provider session cannot be validated until a paid Avaturn API project/token is connected.

## Release decision
Approved for stakeholder preview of:
- parametric avatar V4;
- advanced editing controls;
- professional garment proxy GLBs;
- clear real-vs-proxy garment separation.

Not approved to claim:
- biometric likeness;
- exact body scanning;
- precise size recommendation;
- physical cloth simulation;
- live Avaturn generation before provider credentials are configured and E2E tested.

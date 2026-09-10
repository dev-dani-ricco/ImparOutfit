# UNIVERSO ÍMPAR

Fundação contextual e Showcase Expo. Person é a identidade principal; uma pessoa pode ter
armário pessoal e memberships em lojas simultaneamente. Produtos comerciais salvos são
referências, sem aquisição automática de posse.

- Backend: Express, PostgreSQL, JWT revogável, autorização por capabilities e storage privado.
- Frontend: Expo 54/React Native; demonstração isolada por identidade e uma superfície de leitura da API.
- [Arquitetura](docs/architecture.md), [ERD](docs/data-model.md), [OpenAPI](docs/openapi.yaml).
- [Migrations](docs/migrations.md), [uploads](docs/upload-policy.md), [IP](docs/ip-classification.md).
- [Baseline](docs/repository-baseline.md), [auditoria histórica](docs/current-state-audit.md), [CICLO 1](docs/cycle1-validation.md).

## Backend local

Copie backend/.env.example para backend/.env e configure banco PostgreSQL e JWT_SECRET aleatório
com pelo menos 32 bytes. Exemplos não devem ser usados como credenciais de produção.

```sh
cd backend
npm ci
npm run migrate
npm test
npm run dev
```

Schema legado sem ledger exige backup/revisão e `npm run migrate:adopt`.
Não reaplique SQL manualmente. Swagger: http://localhost:4000/api-docs.
Mídia fica em MEDIA_ROOT privado; a leitura pessoal exige Bearer token.

Principais contratos: /api/auth/me, /api/wardrobe/items, /api/products, /api/commercial-saves,
/api/looks, /api/profile, /api/stores/{storeId}/memberships e /api/reconstruction/jobs.
O endpoint copy-to-wardrobe retorna 410; use POST /api/products/{id}/save.
Catalogação exige ownershipSource e ownershipAttested; só REAL_CAPTURE e MANUAL_CATALOG
estão expostos, sem integração de compra.

## Frontend e Showcase

```sh
cd frontend
npm ci
npm test
npm start
```

demoMode=true em app.json abre a Showcase fictícia, independente da API. Estado por pessoa,
sem reaproveitar a antiga chave global. Veja o [roteiro](docs/presentation-guide.md).
demoMode=false exige apiUrl correto e apresenta leitura real de perfil, armário, saves,
Looks, contexto comercial e a captura experimental de uma peça para reconstrução. A captura
e a saída GLB são privadas por pessoa; o frontend só permite composição após inspeção e
quality gate. Veja o [estado 3D](docs/3d/current-state.md) e a
[decisão técnica](docs/adr/002-local-reconstruction.md).

Bundles locais: `npx expo export --platform android --output-dir .expo-demo-check/android`
e `npx expo export --platform web --output-dir .expo-demo-check/web`.
Android export não é APK/AAB assinado nem validação em dispositivo.
A renderização do avatar genérico e a reconstrução local por CPU são experimentais: não há
fitting, simulação de tecido, escala automática ou alegação de precisão física. O worker é
executado explicitamente com `npm run reconstruction:worker` e requer o ambiente Python
isolado descrito em `tools/reconstruction/requirements.txt`.

## Infraestrutura

Compose: `docker compose --env-file .env.server -f compose.server.yml up --build -d`.
O runner aplica migrations antes de iniciar API. Volume legado exige adoção explícita.
PostgreSQL/Redis ficam na rede privada; mídia usa volume privado, API em 127.0.0.1:4000.
VPS: backend/deploy/hostinger-vps.sh; revisar ambiente, backup, TLS e MEDIA_ROOT antes de executar.
Não houve deploy, merge em main ou push neste ciclo.

# IMPAROutfit

Aplicativo mobile de guarda-roupa inteligente com marketplace social para vitrines de lojistas e marcas.

## Estrutura
- `backend/`: API REST Node.js + Express, JWT, RBAC, PostgreSQL, Redis e Cloudinary.
- `frontend/`: React Native + Expo com telas de cadastro, login, feed, lojas, armário, painel lojista e vitrines.
- `docs/`: OpenAPI e documentação de arquitetura/escala.

## Perfis obrigatórios
1. `PERSON`: pessoa física que gerencia guarda-roupa, monta looks e copia peças de vitrines.
2. `STORE`: lojista/marca com perfil comercial, catálogo, vitrines temáticas e métricas.

## Backend
```bash
cd backend
cp .env.example .env
npm install
psql "$DATABASE_URL" -f sql/001_schema.sql
npm run dev
```

Endpoints principais:
- `POST /api/auth/register`: cadastro escolhendo `PERSON` ou `STORE`.
- `POST /api/auth/login`: autenticação JWT.
- `GET /api/stores/me`: painel do lojista.
- `POST /api/stores/items`: cria peças de catálogo da loja.
- `POST /api/items/:id/copy-to-wardrobe`: copia uma peça de lojista para o guarda-roupa de usuário comum.
- `GET /api/feed`: feed social mesclado.
- `POST /api/showcases`: cria vitrine temática.

Swagger: `http://localhost:4000/api-docs`.

## Frontend
```bash
cd frontend
npm install
npm start
```

Configure `frontend/app.json` ou variáveis Expo para apontar `extra.apiUrl` para a API publicada.

## Deploy Hostinger
Para VPS/Cloud:
```bash
cd /workspace/ImparOutfit
APP_DIR=/var/www/imparoutfit DATABASE_URL=postgres://... PORT=4000 backend/deploy/hostinger-vps.sh
```
Depois configure Nginx com proxy reverso para a porta da API e publique o app Expo usando EAS Build para Play Store e App Store.

## Publicação mobile
1. Criar contas Apple Developer e Google Play Console.
2. Configurar `android.package` e `ios.bundleIdentifier` em `frontend/app.json`.
3. Rodar builds com EAS (`eas build -p android`, `eas build -p ios`).
4. Submeter os binários nas lojas.

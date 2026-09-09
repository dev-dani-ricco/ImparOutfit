# UNIVERSO ÍMPAR — Baseline do repositório

Registro do CICLO 0, iniciado em 08/09/2026 às 20:44 (America/Sao_Paulo). Este documento descreve o estado **anterior às alterações de proteção desta auditoria**. A análise funcional e os critérios do próximo ciclo estão em [current-state-audit.md](current-state-audit.md).

## Autoridade e escopo

O Prompt Mestre e as Diretrizes Complementares fornecidos na sessão prevalecem sobre README, documentação e comportamento legado. O escopo autorizado deste ciclo é preservação, segurança, baseline e auditoria; a reconstrução ampla permanece fora desta entrega. Nenhum texto proprietário de prompts/metodologia foi incorporado a estes documentos.

| Campo | Estado inicial confirmado |
| --- | --- |
| Repositório oficial | https://github.com/dev-dani-ricco/ImparOutfit |
| Visibilidade | Público; confirmado pela API do GitHub em 08/09/2026 |
| Remote `origin`, fetch e push | `https://github.com/dev-dani-ricco/ImparOutfit.git` |
| Worktree | `C:\Users\NewBio Digital\ImparOutfit` |
| Branch inicial do CICLO 0 | `techlead/universo-impar-foundation` |
| Branch antes da preparação, conforme sessão | `main`; a branch de trabalho já havia sido criada antes deste ciclo |
| Commit-base / HEAD inicial | `a907518ec596864cb10b38f571f79002466374aa` |
| Assunto do commit | `Merge pull request #3 from server/docker-stack` |
| `origin/main` após fetch | `a907518ec596864cb10b38f571f79002466374aa` |
| Branch padrão remota | `main` |
| Divergência `HEAD...origin/main` | 0 commits exclusivos locais / 0 exclusivos remotos |
| Commits locais não enviados no início | Nenhum; a branch de trabalho ainda não existe no remoto |
| Upstream da branch de trabalho | Não configurado |
| Worktrees Git | Um único worktree, no caminho acima |
| Clone raso | Não |
| Referências históricas acessíveis | 12 commits, 103 blobs distintos antes desta entrega |
| Index inicial | Nenhuma alteração staged |
| Arquivos rastreados | 64 |
| Alterações locais preexistentes | 31 entradas modificadas no `git status` |
| Arquivos novos preexistentes | 65 arquivos untracked, contados individualmente |
| Fim de linha | `core.autocrlf=true`; Git emite avisos LF → CRLF |

O `git diff --stat` apresenta 30 arquivos com diferenças textuais, 5.475 inserções e 9.773 remoções; `backend/package-lock.json` aparece modificado no status, mas sem diferença textual no diff. Portanto, a contagem 31 do status não deve ser confundida com 30 arquivos de diff textual. A grande alteração do lockfile frontend já existia antes da auditoria.

## Remoto e divergências entre branches

`git fetch origin` concluiu com sucesso. Uma consulta posterior `git ls-remote --heads origin` teve bloqueio de rede no sandbox; a repetição autorizada confirmou os mesmos SHAs diretamente no GitHub.

| Referência remota | SHA inicial | Relação com a base |
| --- | --- | --- |
| `origin/main` | `a907518ec596864cb10b38f571f79002466374aa` | Igual ao HEAD local |
| `origin/server/cloudflare-tunnel` | `7cce672a559668a1fcc5d1a0784e571c3f53e815` | Um commit à frente da base |
| `origin/server/docker-stack` | `1e8fbb477305ae7c647b017926a11640e741a90e` | Já incorporada à main |
| `origin/demo-ajustes-local` | `cbb6ef167ea8b9d962adee0b874c130b253e27b7` | Já incorporada à main |
| `origin/codex/organizar-codigo-em-pastas-backend,-frontend-e-docs` | `c228ab6c76df5d51cd108fdafc6430945049a608` | Já incorporada à main |

O commit de Tunnel altera `compose.server.yml`, `docs/server-wsl.md` e `server.env.example`. O Compose também tem alterações locais preexistentes, logo uma integração futura exige comparação de três versões. Não houve merge ou cherry-pick: a auditoria não depende dessa integração e a base oficial `origin/main` não diverge do HEAD inicial.

## Preservação antes de editar

Foi criada uma cópia local fora do repositório:

```text
%TEMP%\universo-impar-cycle0-a47ac2eacd6c446c8412f0400f47dd94\
  worktree/                 129 arquivos, incluindo tracked e untracked
  manifest.json             caminho, tamanho e SHA-256 de cada arquivo
  repository.bundle         todas as referências Git locais e remotas acessíveis
  refs-before.txt           referências iniciais
  status-before.txt         status completo, sem agrupar diretórios untracked
  changes-before.patch      diff binário em relação ao HEAD
  staged-before.patch       vazio, pois o index inicial estava limpo
  scan-results.json         candidatos classificados por caminho/regra/linha
  gitleaks-history.json      relatório redigido do scanner
  gitleaks-worktree.json     relatório redigido do scanner
  build-android/            exportação local para verificação
  build-web/                exportação local para verificação
```

A cópia de fontes/configuração contém 24.921.084 bytes. Todos os arquivos copiados foram comparados por SHA-256; `git bundle verify` passou. Dependências `node_modules`, caches `.expo`/`.expo-demo-check`, saídas `dist`/`web-build` e cobertura não foram duplicados, e continuam nos locais originais. O diretório `.git` foi preservado no local; seu histórico acessível também está no bundle. Não foram encontrados arquivos ignorados adicionais fora dos diretórios de dependências/cache inspecionados.

| Artefato | SHA-256 |
| --- | --- |
| `repository.bundle` | `f189403a86d228c3b420e5959a2f41fbf73a9c5150b44ca101d97ab87e5cc143` |
| `manifest.json` | `7987d688d0ea1175dad58fa6be72a3af1fb5e0b6e11c46c40613120660e94e21` |

Esta cópia temporária não é backup permanente nem criptografado: depende da retenção e das permissões do perfil local. Deve ser mantida em armazenamento privado se houver necessidade de retenção prolongada. Bundle e patches não devem ser publicados, pois também preservam material candidato a IP e histórico.

Para recuperação, primeiro verificar os hashes e abrir o bundle em **outro diretório vazio**; conferir o `manifest.json` e copiar seletivamente o conteúdo de `worktree/`. Não aplicar patches ou sobrescrever o worktree ativo automaticamente. O bundle sozinho não contém arquivos untracked nem alterações não commitadas.

## Trabalho local que precisa continuar preservado

| Grupo | Alterações preexistentes |
| --- | --- |
| Backend | Controllers de autenticação, itens e feed; middleware de erros; rotas; utilitário HTTP; lockfile; script de deploy |
| Novos arquivos backend | SQL `002_wardrobe_plans.sql` e `003_customer_profile.sql`; configuração e service de planos; controllers de perfil e armário; três testes em `wardrobePlans.test.js` |
| Frontend | Configurações Expo/npm, dependências e lockfile, autenticação/demo, fixtures, navegação e 12 telas existentes |
| Novos arquivos frontend | Metro config, componentes de avatar web/native e anúncio, configuração de planos, telas Dani/campanhas/planos |
| Assets novos | 7 PNGs, 40 JPGs em `assets/demo/distinct`, `assets/models/michelle.glb` e seu README |
| Documentação/infra | README, OpenAPI, Compose; novos guias de apresentação e roadmap |

O inventário exato de todos os caminhos está no snapshot. Os testes e bundles deste ciclo usam o **worktree completo com essas alterações**, e não comprovam que um clone limpo do commit-base tenha as mesmas funcionalidades. Parte essencial da implementação atual ainda não está versionada.

## Diretórios, tecnologias e configurações

| Área | Tecnologia detectada / função | Configurações relevantes |
| --- | --- | --- |
| `backend/` | Node.js, JavaScript ESM, Express 4, SQL parametrizado via `pg`, Joi, bcryptjs, JWT, Multer, Helmet/CORS/rate limit | `package.json`, `package-lock.json`, `.env.example`, `src/server.js` |
| `backend/sql/` | PostgreSQL, schema inicial e extensões de planos/perfil | Três scripts SQL; sem migration runner |
| `backend/src/config/` | PostgreSQL, Redis opcional, Cloudinary, planos | `db.js`, `redis.js`, `cloudinary.js`, `wardrobePlans.js` |
| `frontend/` | Expo 54, React 19.1, React Native 0.81.5, React Navigation 6, AsyncStorage, SecureStore | `package.json`, lockfile, `.npmrc`, `app.json`, `eas.json`, `metro.config.js` |
| `frontend/src/components/` | Three/R3F native para avatar; UI e prévias com imagens | `BodyAvatar3D.native.js`, fallback web e `Model3DPreview.js` |
| `docs/` | Arquitetura, OpenAPI 3.0.3, servidor, apresentação e roadmap | `architecture.md`, `openapi.yaml`, `server-wsl.md` |
| Raiz/deploy | Docker Compose, imagem Node 24, PostgreSQL/Redis, alternativa VPS/PM2 | `compose.server.yml`, `.dockerignore`, `backend/Dockerfile`, `backend/deploy/hostinger-vps.sh`, `server.env.example` |
| Segurança do repositório | Ignore rules e scanner dedicado, acrescentados no CICLO 0 | `.gitignore`, `.dockerignore`, `.gitleaks.toml` |

Ambiente de verificação: Windows/PowerShell, Node `v24.18.0`, npm `12.0.1`. As versões instaladas das dependências diretas correspondem aos lockfiles inspecionados. Docker e PostgreSQL CLI não estavam disponíveis no PATH. Nenhum `AGENTS.md` foi encontrado no repositório ou nos ancestrais consultados.

## Riscos encontrados antes das alterações

1. Repositório público com conteúdo editorial/consultivo associado à Dani já rastreado; classificação e autorização de IP ainda não demonstradas.
2. Worktree extenso sem commit, incluindo componentes/imports/assets novos: um commit indiscriminado publicaria materiais sem revisão.
3. `.gitignore` cobria dotenv convencional, mas não diversas bases, certificados, capturas e diretórios de conhecimento privado; o contexto Docker também carecia de proteção recursiva.
4. Protótipo demo e API coexistem sem integração completa; dados pessoais inseridos na demo persistem globalmente entre sessões.
5. Identidade binária e cópia comercial para posse conflitam com a especificação vigente.
6. Uploads, privacidade da mídia, dependências, migrations e contratos de API apresentam riscos detalhados na auditoria.
7. Não foi encontrada configuração de CI no checkout inicial; não foram auditados rulesets, branch protection, secrets ou ambientes de produção no GitHub.

## Estratégia de branches e registro desta entrega

Manter `main` e todas as alterações preexistentes preservadas. A branch `techlead/universo-impar-foundation` concentra o CICLO 0; separar commits de proteção e documentação, usando staging com caminhos explícitos. Não incluir as 31 alterações e os 65 arquivos novos do produto automaticamente nos commits desta auditoria.

O escopo desta entrega é `.gitignore`, `.dockerignore`, `.gitleaks.toml` e os dois documentos de auditoria. A conferência por hashes comprovou que, dos 129 arquivos preexistentes, somente os dois arquivos ignore foram alterados; os outros 127 permaneceram idênticos byte a byte. Nenhum arquivo foi removido, nenhuma referência foi reescrita e nenhum artefato foi enviado ao remoto.

A proteção foi registrada no commit `933db18` (`chore(security): protect private repository and build materials`). A documentação constitui um segundo commit separado. Como o Git não tinha identidade de autor configurada, esses comandos usam `Codex <codex@localhost>` explicitamente, sem alterar configuração local/global do usuário. Não há push ou PR nesta entrega.

Para o CICLO 1, usar branches pequenas por correção/domínio e PRs conforme o workflow do projeto. Antes de integrar o trabalho local preexistente, classificá-lo por código, fixtures, assets e IP, com proveniência e testes. A revisão de merge deve distinguir o resultado testado no worktree do que está efetivamente no commit. Não há necessidade de rebase destrutivo ou force push.

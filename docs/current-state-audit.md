# UNIVERSO ÍMPAR — Auditoria do estado atual

CICLO 0 · 08/09/2026 · base `a907518ec596864cb10b38f571f79002466374aa` · branch `techlead/universo-impar-foundation`.

Consulte o [baseline Git e a preservação](repository-baseline.md) para SHAs, remotos, divergências e inventário. As evidências abaixo se referem ao worktree completo existente na auditoria, incluindo trabalho ainda não commitado. As linhas são referências dessa versão. Não houve mudança funcional, migração de banco, publicação, deploy ou reescrita de histórico neste ciclo.

## Conclusão executiva

O repositório contém um protótipo mobile de apresentação com persistência local e uma API Express/PostgreSQL parcialmente implementada. Há código reaproveitável, mas ele ainda não implementa a arquitetura de identidade, posse, conhecimento e privacidade do UNIVERSO ÍMPAR. Compilar a demo não demonstra um produto integrado ou pronto para dados reais.

O feed atual já seleciona conteúdo de lojas. O legado incompatível está nos mecanismos sociais residuais, na documentação, no modelo PERSON/STORE exclusivo e na transformação de produto comercial em item possuído. Existe renderização 3D real de um avatar genérico no native; as roupas continuam sendo prévias de imagens e o avatar não comprova reconstrução pessoal nem ajuste físico.

## Segurança, dados e propriedade intelectual

### Método e abrangência

A investigação combinou inventário de caminhos, leitura de código/configuração, expressões para tokens/chaves/JWT/URLs autenticadas/PII/IP e Gitleaks `8.30.1` com regras padrão e regras locais. O binário oficial foi obtido em diretório temporário, sem instalação global, e seu arquivo foi verificado pelo SHA-256 publicado `d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e`.

Foram inspecionados 77 arquivos textuais do worktree e 98 blobs textuais distintos entre 103 blobs de 12 commits acessíveis por todas as refs locais/remotas. O Gitleaks também analisou a cópia inicial de fontes/configuração e `git --all`; seu contador informou 9 commits com diffs analisados. A análise complementar por blobs cobre o conteúdo alcançável sem depender de diffs de merge. Foram puladas 57 ocorrências binárias somando snapshot e histórico; nenhuma ocorrência textual excedeu o limite de 8 MiB do verificador complementar.

Os resultados não contêm valores de secrets ou conteúdo de clientes: somente caminhos, linhas, regras e classificação. Dependências/caches não fizeram parte da busca de material privado do produto; dependências foram avaliadas separadamente com `npm audit`. Não foram examinados objetos Git inalcançáveis/reflogs, forks, caches externos, conteúdo remoto de URLs, histórico de deploy, dados em dispositivos, banco real ou contas Cloudinary. Não houve OCR/exame completo das imagens nem decodificação de arquivos compactados arbitrários. A ausência de detecção não é atestado de ausência de material sensível.

### Achados de segurança/IP

| ID | Prioridade | Evidência | Avaliação e encaminhamento |
| --- | --- | --- | --- |
| IP-01 | Alta, exige classificação antes de publicar mais conteúdo | `frontend/src/demo/data.js:315` e `frontend/src/contexts/DemoContext.js:209`; ambos já rastreados | Conteúdo editorial/consultivo associado à Dani no código distribuído ao cliente. Não foi comprovado que seja metodologia privada, tampouco que sua publicação esteja autorizada. Registrar como candidato IP; não copiar seus textos nesta auditoria. Separar conteúdo protegido de interfaces públicas no ciclo seguinte. |
| IP-02 | Alta para distribuição de assets | `frontend/assets/demo/`, `frontend/assets/models/README.md`, `michelle.glb` | Há atribuição local Three.js/Mixamo para o modelo; não há inventário completo de origem, licença e autorização das imagens. A atribuição não foi validada juridicamente. Preservar arquivos e hashes; classificar antes de incorporá-los/publicá-los. |
| IP-03 | Média | `LICENSE` raiz, repositório público confirmado | A licença MIT existente não documenta a proveniência e autorização de cada asset ou conteúdo editorial. Não foi alterada. Não usar a licença raiz como comprovação de que knowledge privado pode ser publicado. |
| DATA-01 | Alta | `DemoContext.js:14,58,86`, `App.js:10`, `AuthContext.js:107` | Uma chave global de AsyncStorage contém perfil, medidas, armário e referências locais às fotos/capturas. Logout remove sessão, mas não esse estado; outra sessão no mesmo aparelho continua acessando os dados. A disponibilidade das imagens depende da permanência dos arquivos locais. Conclusão demonstrada pelo fluxo de código, ainda sem ensaio em dispositivo. |
| DATA-02 | Alta | `ProfileScreen.js:27,181`, `003_customer_profile.sql:2`, `profileController.js:112` | Foto, idade e medidas podem ser reais. Há armazenamento local e backend, sem controles implementados de consentimento/retensão/exclusão/exportação demonstrados. Não foram encontrados dados reais confirmados nos arquivos examinados. |
| DATA-03 | Alta | `imageService.js:5`, `profileController.js:112` | Armazena URL padrão de mídia Cloudinary, sem entrega privada/assinada explícita. Autorização da API não protege automaticamente a mídia. Não foi testado um vazamento em produção. |
| DATA-04 | Média/alta | `storeController.js:4-7` | Consultas públicas retornam campos amplos da loja; painel de saves devolve identificação individual de cliente. Usar DTOs públicos e métricas agregadas salvo finalidade/autorização definida. |
| SEC-01 | Não confirmado como vazamento | `.env.example`, `server.env.example`, Compose e histórico | Candidatos de senha/URL são placeholders, credenciais locais de exemplo ou referências a variáveis. Não foram confirmados tokens de provedor, chaves privadas, JWTs reais, CPF/CNPJ real ou dumps pessoais no escopo. Exemplos não devem ser usados como credenciais de produção. |
| SEC-02 | Alta | `middleware/error.js:4-7`; conexões/logs em `config/redis.js` | Mensagens/códigos/detalhes de erros são devolvidos sem sanitização uniforme; podem carregar informações internas. Não há política central de redaction, retenção e acesso a logs/telemetry. |

Registros nominais em fixtures e métricas parecem demonstrativos (`data.js:301`, `StoreDashboardScreen.js:7`), mas sua sinteticidade não foi comprovada; os nomes não são reproduzidos aqui. O GLB foi validado offline como glTF 2, com 3.276.888 bytes, uma mesh, um skin, duas animações e recursos embutidos. Isso verifica estrutura, não autorização de uso, ausência de PII ou qualidade de renderização.

Nenhum secret real foi confirmado como já versionado. **Há candidatos a IP já versionados em repositório público**, reportados acima. Não houve remoção desses arquivos, `git rm --cached`, rotação de credenciais, alteração de visibilidade ou apagamento de histórico. Se a classificação confirmar exposição, o próximo passo é conter novas publicações e definir remediação com a responsável pelo conteúdo; eventual rotação/revogação e saneamento de histórico são ações distintas, que exigem escopo explícito.

### Proteções implementadas neste ciclo

O `.gitignore` passou a cobrir ambientes privados, secrets, credenciais, certificados/chaves, bases e backups locais, capturas, dados/modelos pessoais, knowledge/prompts privados, learning cases e relatórios brutos. Regras para diretórios sensíveis são recursivas. Exemplos sanitizados, migrations SQL, contratos e assets de referência existentes continuam versionáveis.

O `.dockerignore` recebeu proteção equivalente e recursiva para o contexto de build: `COPY backend` e `COPY docs` poderiam levar materiais locais à imagem. Nenhum arquivo foi retirado fisicamente. `.gitignore` não controla arquivos já rastreados, e Docker usa regras próprias; são limites documentados nas [instruções do Git](https://git-scm.com/docs/gitignore) e de [contexto Docker](https://docs.docker.com/build/concepts/context/#dockerignore-files).

O `.gitleaks.toml` mantém os detectores padrão e acrescenta detecção de arquivos de ambiente e diretórios privados. A exceção para nomes de exemplos só se aplica à regra de caminho; detectores de secrets continuam ativos nesses arquivos. Verificações sintéticas confirmaram bloqueio de `.env` e knowledge privado e permissão de exemplo/contrato público. Referência operacional: [Gitleaks oficial](https://github.com/gitleaks/gitleaks).

Uso local, com o scanner disponível no PATH:

```powershell
gitleaks git . --log-opts=--all --redact=100 --config .gitleaks.toml
gitleaks git . --pre-commit --staged --redact=100 --config .gitleaks.toml
```

Para untracked, executar `gitleaks dir` sobre uma cópia privada de fontes/configuração que inclua esses arquivos, como feito neste ciclo. Não guardar relatórios brutos no repositório. Os comandos retornam falha se houver achados; uma execução sem achados não classifica IP, PII, imagens ou licenças. Não foi instalado hook nem configurado CI/ruleset obrigatório: integrar esses controles ao workflow é entrega explícita do CICLO 1. `git add -f` ainda pode contornar ignore rules.

### Conhecimento e IA: lacuna arquitetural

Não foi encontrado AI Gateway, Prompt/Agent Registry, Knowledge Resolver, RAG ou governança de aprovação. A Dani atual usa conteúdo e respostas estáticas no frontend. A direção fornecida pelo projeto é:

```text
App → Backend → AI Gateway → Agent/Prompt Registry privado
                           → Authorized Knowledge Resolver → modelo

Raw Source → Candidate Knowledge → Review → Approval → Version → Authorized Index/RAG
```

Essa é uma direção de arquitetura, não uma implementação já entregue. Contratos públicos devem usar IDs, versões, contexto autorizado e provenance; prompts/chunks privados devem ser resolvidos no backend autorizado. `IMPAR KNOWLEDGE` e `PERSONAL KNOWLEDGE` precisam de namespaces, políticas e ciclos de vida independentes. Conversa, upload, inferência ou correção isolada pode originar um candidato, nunca alterar automaticamente conhecimento institucional aprovado.

Definir telemetry por allowlist de campos: IDs, versões, status, duração e uso agregado. Prompts, chunks, medidas, imagens, conversas e URLs privadas permanentes não devem aparecer em logs, respostas de erro ou analytics. As interfaces podem ser projetadas no CICLO 1 usando fixtures sintéticos; não há necessidade de colocar conhecimento real no Git para construí-las.

## Arquitetura e subsistemas

| Área | Estado encontrado | Implicação |
| --- | --- | --- |
| Arquitetura | Monólito Express, controllers com SQL via `pg`, pequenos services; frontend separado | Preservar simplicidade e contratos úteis; falta fronteira de domínio para identidade, posse, commerce e knowledge |
| Frontend | JavaScript, Expo 54/RN 0.81.5/React 19.1; navegação e componentes reutilizáveis | Base de prototipação aproveitável; sem tipos de domínio, testes de telas ou integração ponta a ponta |
| Demo/mocks | `App.js:10` sempre monta DemoProvider; `app.json:39` ativa demo; `AuthContext.js:10` assume demo quando configuração falta | Só desligar flag não integra produto. Chamadas API encontradas apenas em auth/me, login e cadastro |
| Backend | Rotas/controllers ESM, SQL parametrizado, tratamento assíncrono, Joi em parte das entradas | Ponto positivo para evitar injeção SQL, mas validação e apresentação de erros são inconsistentes |
| Banco | Dez tabelas e três scripts SQL; campos relacionais e JSONB/arrays | Não há migrations rastreadas por versão aplicada nem ensaio de atualização sobre volume existente |
| Autenticação | bcrypt custo 10, JWT, SecureStore quando disponível no native; expiração padrão de 7 dias | Sem revogação/refresh, recuperação/verificação de e-mail ou revalidação do papel do token demonstrados |
| RBAC | Middleware verifica claim `profileType`; PERSON e STORE globais | Protege algumas rotas, mas não representa memberships, papel por organização nem contexto ativo |
| API | Treze paths no OpenAPI, menos completos que as rotas reais | Swagger sem schemas completos e sem `securitySchemes`; `/showcases` GET/POST não define `responses` |
| Redis | Inicialização opcional/obrigatória configurável | Não foi encontrado uso funcional de cache nos controllers; rate limit atual é local ao processo |
| Cloudinary | Upload de buffer e persistência de URL; retorna placeholder quando sem cloud configurada | Uma criação bem-sucedida não comprova armazenamento real; faltam compensação e ciclo de vida da mídia |
| Wardrobe/planos | Itens, coleções e upgrades interativos na demo; backend tem capacidade, lock e trigger | Preservar proteção de capacidade, após separar posse de previews; plano local não comprova cobrança |
| Lojas/vitrines | Catálogo, follows de loja, vitrines e dashboard | Base comercial útil, mas métricas/campanhas demo não são analytics nem veiculação real |
| Dani | Aulas/recomendações fixas; revisão estática; agendamento por booleano e data fixa | Não há atendimento remoto, agenda, IA, RAG ou validação humana de Look |
| Deploy | Compose PostgreSQL/Redis/API, alternativa VPS/PM2, configuração EAS | Nenhum ambiente de produção foi acessado; prontidão operacional não está comprovada |

## Divergências obrigatórias com a especificação

| Tema | Evidência concreta do legado | Especificação e migração proposta |
| --- | --- | --- |
| Feed social | README chama produto de marketplace social; `socialController.js:27` já retorna somente STORE_ITEM/SHOWCASE; `FeedScreen.js:12` também filtra STORE | Preservar feed comercial/contextual e relacionamento cliente → loja com finalidade definida. Mapear dependências antes de retirar mecanismos sociais |
| Customer social graph | `routes/index.js:9` expõe `/users/:id/follow`; `001_schema.sql:6` tem `followed_user_id`; `:10` tem `looks.is_public DEFAULT true`; `:13` e rotas mantêm comentários em vitrines; UI tem curtidas públicas em `FeedPost.js:32,65` | Descontinuar customer follows, comentários/likes sociais e publicação social de Looks. Não foi encontrado CRUD de posts/likes/Looks no backend nem UI de feed público de clientes; estruturas existentes não comprovam esses fluxos ativos |
| PERSON/STORE exclusivos | Enum e `users.profile_type` em `001_schema.sql:2,4`; cadastro/JWT em `authController.js:2-3`; middleware em `auth.js:8`; navegação em `RootNavigator.js:163` | Identidade universal estável, perfis e capacidades vinculados a contextos/memberships. Trocar de contexto sem criar outra identidade ou fazer logout |
| Cópia comercial vira posse | `itemController.js:69,111,121` cria WARDROBE com origem STORE; `DemoContext.js:144,168` insere cópia no armário; `StoreDetailScreen.js:105` oferece a ação | `OWNED_ITEM`, `COMMERCIAL_PREVIEW` e `SPONSORED_PREVIEW` separados. Salvar/provar/anunciar não altera posse nem capacidade. Entrada no armário requer ownership/captura/catalogação apropriados |
| Histórico de cópias | `source_item_id`, `source_store_id`, `copiedFromStore` e saves preservam parte da origem | Inventariar e classificar registros existentes. Não assumir posse nem converter tudo cegamente em preview; usar proveniência, estado de revisão e fluxo de confirmação sem apagar registros |
| Ausência de identidade contextual | Sem memberships, organização/contexto ativo ou escopo de conhecimento; loja tem proprietário único; perfil demo é global | Migração aditiva, compatibilidade temporária e testes negativos de isolamento por pessoa/contexto/loja |
| 3D de roupa | `Model3DPreview.js:33` gira Animated.Image, mas `:43,48` declara 3D/validação; `ItemFormScreen.js:106` salva ready/demo-preview | Substituir rótulos e estados por verdade técnica: foto, captura, processamento, falha e modelo disponível. Malha/reconstrução/fitting exigem pipeline futuro próprio |
| Avatar 3D | `BodyAvatar3D.native.js:178,274` usa Canvas/GLTFLoader, morphs geométricos em `:18,50,105`; web em `BodyAvatar3D.js:76` usa Views/Image | Preservar renderer native como experimento. Avatar genérico deformado por heurística não é corpo reconstruído/calibrado nem prova de caimento. Fallback web não é malha 3D |
| Dani/conhecimento | Conteúdo no bundle, `DemoContext.js:209`, `DaniRicoScreen.js:47` | Substituir simulação apresentada como serviço real por estados explícitos e contratos; resolver conteúdo privado em infraestrutura autorizada, com proveniência e aprovação |

Dependências a preservar durante a migração: feed usa follows de loja e catálogo/vitrines; cópia para armário afeta saves, métricas, capacidade, fixtures, coleções e telas; `profile_type` afeta cadastro, token, middleware, SQL e navegação. Alterar uma dessas áreas isoladamente pode quebrar as demais. A proposta não autoriza apagar código ou dados neste ciclo.

## Riscos técnicos prioritários

| ID | Prioridade | Evidência e impacto | Ação proposta |
| --- | --- | --- | --- |
| TECH-01 | Alta | `multer@1.4.5-lts.2` instalado e no lockfile; `upload.js:2` aceita até 20 × 8 MiB em memória | Corrigir dependência e limites agregados/conteúdo/concorrência; até ~160 MiB por requisição só em buffers. Rotas exigem autenticação, mas contas válidas ainda podem causar indisponibilidade |
| TECH-02 | Alta | `showcaseController.js:2` recebe `itemIds` sem validar existência/posse comercial; array sem FK por item | Autorizar cada referência dentro do contexto da loja. Falha de integridade confirmada; leitura indevida de guarda-roupa não foi demonstrada |
| TECH-03 | Alta para evolução de banco | Compose inicializa SQL apenas no volume novo; script VPS reaplica SQL não idempotente e não usa `ON_ERROR_STOP` | Migration runner rastreável, execução transacional quando possível e ensaios de upgrade/restore isolados |
| TECH-04 | Alta para executabilidade local | `server.js:35` usa `.pathname` e produz `/C:/Users/NewBio%20Digital/ImparOutfit/docs/openapi.yaml`, inexistente | Usar conversão de file URL portável. O caminho convertido com `fileURLToPath` existe; defeito comprovado sem iniciar API |
| TECH-05 | Média/alta | `auth.js:6-8` usa papel do JWT até expirar; apenas rate limit global em `server.js:28` | Validação de configuração e autorização contextual, revogação/revalidação e defesa específica de autenticação |
| TECH-06 | Média/alta | Upload pessoal mantém transação/advisory lock durante chamada externa (`itemController.js:32-37`) | Separar etapas ou aplicar compensação/idempotência; persistir ID de mídia para evitar órfãos e permitir remoção |
| TECH-07 | Média | `/health` sempre responde OK; `connectRedis().catch` não impede listen com Redis obrigatório (`server.js:30,40`) | Diferenciar liveness/readiness e dependências obrigatórias |
| TECH-08 | Média | Docker sem `USER`; VPS usa rsync com exclusões estreitas; CORS `*` e `trust proxy=1` dependem da topologia | Validar usuário de execução, empacotamento e proxy. O endurecimento de `.dockerignore` não corrige o rsync |
| TECH-09 | Média | `WardrobeItemScreen.js:10-15` usa primeira peça se ID falta; `store-aurora` fixo em navegação/form; perfil usa COALESCE para campos nullable | Remover fallbacks silenciosos e IDs demo da operação real; garantir exclusão explícita de medidas e estados de erro |
| TECH-10 | Média/alta | EAS não mostra override que desative demo ou troque HTTP localhost | Validar configuração por ambiente e impedir build distribuído com dados demo/endpoint local acidental |

Preservar o bind da API em `127.0.0.1:4000` e ausência de publicação de portas de PostgreSQL/Redis no Compose. Não foram verificados firewall, TLS, backups reais, permissões do host ou topologia de produção.

### Dependências

`npm audit --json --ignore-scripts` foi executado nos dois projetos, sem instalação, `audit fix`, upgrade ou mudança dos lockfiles.

| Projeto | Baixa | Moderada | Alta | Crítica | Total retornado |
| --- | --- | --- | --- | --- | --- |
| Backend | 1 | 3 | 1 | 0 | 5 |
| Frontend | 0 | 18 | 12 | 0 | 30 |

São contagens de pacotes sinalizados pelo npm, incluindo cadeias transitivas, não 35 explorações comprovadas nem necessariamente 35 vulnerabilidades distintas. Backend retornou alertas em brace-expansion, qs/body-parser/express e Joi; frontend inclui ferramentas Expo/Metro e dependências de navegação/build. Correções sugeridas automaticamente podem exigir mudança major; não aplicar `npm audit fix --force`.

O retorno npm **não apontou Multer**, apesar de a versão instalada `1.4.5-lts.2` estar no intervalo afetado do [aviso oficial GHSA-5528-5vmv-3xc2](https://github.com/expressjs/multer/security/advisories/GHSA-5528-5vmv-3xc2), que descreve DoS por recursão e informa correção em `2.1.1`. A auditoria registra essa lacuna do resultado automatizado; não declara 2.1.1 como livre de todos os avisos posteriores. Revisar os avisos vigentes ao escolher a versão e testar os uploads após atualizar.

## Verificações executadas e limites

| Verificação | Resultado | O que não comprova |
| --- | --- | --- |
| Clone/remoto/fetch/ls-remote/divergência/worktrees | Confirmados conforme baseline | Não audita produção, proteção de branches ou secrets do GitHub |
| Snapshot, SHA-256 e `git bundle verify` | 129 arquivos preservados; bundle íntegro | Não é backup permanente ou de dados externos |
| Busca complementar + Gitleaks em histórico e snapshot | Sem secrets reais confirmados; IP/fixtures classificados como candidatos | Não é certificação de PII/IP, OCR, licença ou ausência absoluta de secrets |
| Ignore rules | 23 caminhos sensíveis representativos bloqueados, inclusive aninhados; 9 caminhos públicos permitidos | Nomes arbitrários com conteúdo privado continuam exigindo scanning/review |
| Fixtures da configuração Gitleaks | Dois arquivos sensíveis sintéticos detectados; exemplo e contrato permitidos | Não comprova toda regra de provedor ou todo formato de arquivo |
| `npm test` em backend | 3/3 testes passaram | Somente planos: padrão, capacidade e downgrade; sem rotas, JWT/RBAC, DB, uploads ou concorrência |
| `node --check` | 20 arquivos JS backend/test passaram | Sem execução das regras de negócio |
| OpenAPI / caminho de arquivo | YAML parseia; encontrados GET/POST `/showcases` sem responses, ausência de securitySchemes e caminho Windows inválido | Não foi executado validador completo de contrato |
| Bash e Compose | `bash -n` passou; YAML do Compose parseou os serviços database, redis e api | Não valida execução do deploy, semântica Docker, imagem ou aplicação das migrations |
| Bundle Android offline | Passou: 1.196 módulos, 58 assets, bundle Hermes ~9,38 MB | Não é APK/AAB, build assinado ou teste em dispositivo/renderização |
| Bundle web offline | Passou: 545 módulos, 53 assets, JS ~902 kB | Não é teste de navegador, acessibilidade ou integração com API |
| Dependências diretas/lockfiles | Versões instaladas correspondem aos locks; manifestos coerentes | Não substitui instalação limpa reproduzível |
| `npm audit` backend/frontend | Executou e retornou código 1 por vulnerabilidades; totais acima | Não prova exploitabilidade nem cobertura completa, como ilustra Multer |
| `git diff --check` nos arquivos da entrega | Sem erros de whitespace | Avisos LF/CRLF do ambiente continuam possíveis |

O primeiro bundle Android falhou por `spawn EPERM` do sandbox. A repetição com permissão para workers locais, `CI=1`, `EXPO_OFFLINE=1`, `EXPO_NO_TELEMETRY=1` e saída temporária passou. Android usou `--max-workers 2`; web usou `--max-workers 1`.

Comandos de bundle usados em `frontend/`, com `<diretorio-temporario>` substituído pela pasta do baseline:

```text
node node_modules/expo/bin/cli export --platform android --max-workers 2 --output-dir <diretorio-temporario>/build-android
node node_modules/expo/bin/cli export --platform web --max-workers 1 --output-dir <diretorio-temporario>/build-web
```

O backend não possui script de build. Não foram executados Docker/Compose, migrations, integração PostgreSQL/Redis/Cloudinary, EAS, instalação limpa, deploy ou testes em dispositivo. Docker e `psql` não estavam no PATH; não foi conectado banco alternativo nem criado serviço de produção. Não houve dev server. Os testes/builds representam o worktree inicial, incluindo arquivos untracked; não atestam um clone limpo da main.

## Preservar, refatorar e substituir

| Decisão | Escopo |
| --- | --- |
| Preservar | Todo trabalho local e histórico; identidade visual, navegação/componentes úteis, catálogo/vitrines comerciais, origem de itens e saves, SQL parametrizado, transações, locks/trigger de capacidade, Docker básico, contrato OpenAPI como ponto de partida e renderer native como experimento |
| Refatorar | Identidade/perfis/RBAC em contextos; separação demo/API; armazenamento por pessoa; DTOs/validação/erros; mídia privada; migrations e deploy; feed/contexto comercial; classificações e proveniência; estados técnicos de captura/3D; catálogo de assets e autorização de IP |
| Substituir | Copy-to-wardrobe como posse; PERSON/STORE exclusivo como arquitetura de identidade; mecanismos sociais entre clientes; foto giratória anunciada como 3D validado; respostas/agendas/métricas simuladas usadas como serviço real; incorporação de knowledge privado no bundle |

Preservar um arquivo não significa aprovar sua publicação ou manter sua semântica final. Mocks úteis podem continuar em demonstração explicitamente sintética e isolada. Nenhuma das substituições foi implementada neste ciclo.

## Proposta objetiva para o CICLO 1

Objetivo: estabelecer uma fundação executável, privada e testável com mudanças pequenas, mantendo os dados e a proveniência do legado. Não iniciar simultaneamente uma reconstrução de todas as telas ou um pipeline completo de IA/3D.

| Ordem | Entrega delimitada | Critérios de aceite |
| --- | --- | --- |
| 1 | Classificação do trabalho local e contenção de segurança | Inventário de IP/assets/fixtures, decisão explícita sobre conteúdo Dani; commits apenas de material autorizado; scanner em pre-commit/CI com saída redigida; secrets/dados privados fora de Git e contexto Docker |
| 2 | Executabilidade e isolamento | Corrigir caminho OpenAPI/configuração; app backend testável sem listen automático; migrations rastreáveis em DB descartável; demo separada da API; conta/contexto B não lê estado de A; builds e smoke tests reproduzíveis |
| 3 | ADR de identidade universal/contextual | Especificar identidade estável, perfis, memberships, contexto ativo e permissões; migration aditiva e mapeamento de PERSON/STORE; testes negativos de acesso a outra pessoa/loja/contexto |
| 4 | ADR e contratos de posse/preview | `OWNED_ITEM`, `COMMERCIAL_PREVIEW`, `SPONSORED_PREVIEW` explícitos; salvar/experimentar não incrementa posse/capacidade; inventário de cópias legadas e confirmação de ownership; migração reversível sem perda de origem |
| 5 | Plano de descontinuação social e contratos comerciais | Mapear consumidores de follows/comments/likes/looks; manter apenas relacionamento comercial autorizado e preferências privadas; definir compatibilidade/depreciação antes de retirar endpoints/colunas |
| 6 | Interfaces de knowledge e estados 3D | Contratos públicos de IDs/versões/provenance e autorização, sem prompts/chunks reais; namespaces institucional/pessoal separados; nenhum candidato indexado antes de aprovação; UI não declara reconstrução/validação inexistente |
| 7 | Correções prioritárias de exposição | Atualizar dependências afetadas com testes de upload; limites de mídia e entrega privada; sanitização de erros/logs; DTOs e autorização de itemIds; readiness e empacotamento/deploy revisados |

ADRs, schema aditivo e contratos precedem mudanças amplas na UX. Um Look pode referenciar previews comerciais/patrocinados temporariamente sem convertê-los em propriedade; esse caso deve aparecer nos testes de aceitação, junto de save, avatar e comparação. Fixtures devem cobrir os três tipos sem dados de pessoas reais.

Cada marco deve registrar diff, teste, build aplicável, commit semântico e revisão do conteúdo a publicar. O CICLO 1 termina quando as fronteiras e correções básicas estiverem comprovadas; agenda real, IA/RAG em produção, fitting físico, checkout e reconstrução 3D completa ficam para ciclos específicos.

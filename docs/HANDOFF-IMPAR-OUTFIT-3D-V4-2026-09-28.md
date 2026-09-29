# HANDOFF — IMPAR Outfit — Produto + UX + Avatar/Roupas 3D V4

Data de corte: 2026-09-28
Workstation canônica: PCNewBioDigital
Repositório canônico: C:\Users\NewBio Digital\ImparOutfit
Branch ativa: 3d/professional-avatar-v3-20260928
Remote: https://github.com/dev-dani-ricco/ImparOutfit.git

## 1. Objetivo do handoff

Este documento consolida o estado atual do IMPAR Outfit após:
- separação explícita CLIENTE FINAL x LOJISTA;
- evolução da experiência móvel;
- estabilização no Expo SDK 57;
- criação do preview externo;
- profissionalização do avatar 3D;
- evolução da prévia/reconstrução de roupas 3D;
- implantação do contrato operacional por papéis.

A continuação deve partir deste repositório e desta branch, nunca de cópias antigas do Dell.
## 2. Governança obrigatória

Toda evolução do produto deve seguir o AGENTS.md e envolver:
- PO / Project Lead;
- Tech Lead / Arquitetura;
- UX / Product Design;
- Mobile Frontend;
- Backend / Data;
- 3D / Reconstruction;
- Security / Privacy;
- QA / Release.

Fluxo obrigatório:
Problema -> diagnóstico -> arquitetura -> decisão tecnológica -> implementação -> validação -> release -> evolução.

Nenhuma melhoria 3D deve ser promovida apenas por impacto visual.
Ela precisa preservar privacidade, proveniência, compatibilidade, rollback e distinção entre POC, proxy e geometria real.
## 3. Estado funcional do produto

CLIENTE FINAL:
- Home própria;
- Armário;
- Descobrir;
- Análise;
- Perfil;
- Avatar Studio;
- contexto pessoal isolado do lojista.

LOJISTA:
- Painel;
- Catálogo;
- Campanhas;
- Conta;
- capabilities contextuais;
- troca explícita para o contexto pessoal.

A identidade permanece Person-first.
LOJISTA é contexto/autorização, não uma identidade global.
## 4. Avatar 3D — estado atual

A solução possui duas rotas complementares.

### 4.1 Avatar paramétrico local
Default aprovado para preview:
- MakeHuman / MPFB CC0;
- GLB skinned;
- centenas de morph targets;
- edição de corpo, rosto, altura, cabelo e aparência;
- cabelo modular;
- avatar_config versionado.

Controles expostos incluem:
- apresentação corporal;
- peso visual e musculatura;
- ombros, tórax, cintura, quadril, barriga, braços, coxas, panturrilhas e glúteos;
- comprimento de braços e pernas;
- formato/largura do rosto, mandíbula, queixo e maçãs;
- testa, nariz, olhos, boca e lábios;
- pele, olhos, cabelo e cor do cabelo.
### 4.2 Avatar realista por fotos

Existe rota opcional via provider adapter.
Provider-alvo atual: Avaturn.

Implementado:
- backend cria identidade pseudônima do provider;
- token do provider fica somente no servidor;
- sessão é curta;
- URL persistente precisa ser HTTPS;
- host da sessão é validado por allow-list;
- metadados seguros podem ser persistidos.

Pendente:
- AVATURN_API_TOKEN real;
- validação E2E com projeto comercial do provider;
- decisão comercial sobre custo/plano/limites.

Não apresentar como biometria ou scan corporal preciso.
## 5. Roupas 3D — estado atual

Existem dois níveis distintos.

### 5.1 Proxy imediato
GLBs próprios/procedurais para:
- top;
- pants;
- skirt;
- dress;
- bag;
- shoe.

O proxy responde a:
- categoria;
- medidas do avatar;
- tecido: RIGID / STRUCTURED / KNIT / FLUID;
- ease;
- silhouette allowance;
- material/PBR.

Ele é uma prévia visual e nunca deve ser rotulado como reconstrução real.
### 5.2 Geometria real reconstruída

Fluxo autoritativo:
capture -> validation -> reconstruction worker -> quality check -> READY -> private GLB.

O GLB real:
- é privado;
- exige autorização;
- passa por integrity/quality gate;
- só substitui o proxy quando o job está READY.

Não implementado como promessa:
- cloth simulation física;
- colisão corpo/roupa precisa;
- fitting de tamanho garantido;
- inferência automática de medidas por foto.
## 6. Proveniência e licenças

A base paramétrica aprovada utiliza ativos MakeHuman/MPFB CC0.
Os cabelos atuais utilizam ativos Quaternius CC0.
A proveniência está registrada em docs/licenses e docs/3d/asset-provenance.json.

Michelle/ativos humanos de procedência não aprovada permanecem bloqueados para produção.
Não introduzir novos modelos humanos ou de roupas sem:
- fonte identificada;
- licença registrada;
- compatibilidade comercial;
- hash/proveniência quando aplicável.
## 7. Segurança e privacidade

Regras vigentes:
- nenhuma credencial de provider no cliente;
- fotos cruas não entram em avatar_config;
- avatar privado não é implicitamente visível ao lojista;
- GLBs reconstruídos reais seguem rota autenticada;
- sessões de provider exigem HTTPS;
- host externo é restringido;
- proxies não podem se passar por reconstrução;
- logs não devem carregar dados biométricos, imagens ou secrets.

Banco e storage devem manter separação Person x Organization.
## 8. QA executado no PC NewBio em 2026-09-28

Frontend:
- npm test: 25/25 PASS;
- Expo Doctor: 21/21 PASS;
- API config guard local: PASS;
- API config guard distribuído com REQUIRE_DISTRIBUTED_API=true: PASS;
- Android export/bundle: PASS;
- bundle contém avatar paramétrico, cabelos e seis GLBs de roupas;
- Avatar Studio agora possui presets corporais e modo avançado recolhido para corpo/rosto sem remover controles finos.

Backend:
- suíte completa na branch integrada: ALL_TEST_FILES=PASS;
- avatarProvider.test.js: 3/3 PASS;
- foundation.test.js: 75/75 PASS sem falha pós-suite;
- productionConfig: 3/3 PASS;
- runner de testes força NODE_ENV=test + PGLITE_DATA_DIR=memory:// para isolar testes do runtime persistente;
- produção Vercel + Neon + storage privado: smoke E2E PASS.

Diagnóstico PGlite:
- o teardown da suíte foi resolvido sem mascarar erro;
- @electric-sql/pglite 0.5.8 é a versão latest consultada;
- PGlite persistente nodefs em Node 24.18.0 ainda reproduz RuntimeError: Aborted() fora do harness;
- produção continua devendo usar PostgreSQL; PGlite persistente não deve ser promovido como backend de produção.
## 9. Preview atual

Workstation que hospeda o Metro:
PCNewBioDigital.

Scheduled Task:
IMPAR Outfit Expo Preview.

Status revalidado após a evolução do Avatar Studio:
- task Running;
- porta 8480 Listening;
- Expo SDK 57.0.0;
- runtime 1.0.0;
- endpoint externo HTTP 200.

Expo Go URL:
exp://1sd3dca-poshaze1-8480.exp.direct

O Expo Go continua sendo caminho rápido de demonstração.
Depende de PC NewBio ligado, rede e sessão operacional.
## 10. Preview persistente correto

EAS Update já está configurado.
Project ID:
2251ff12-7ff9-4567-b27c-fd5f26c33fc6

Canais:
- development;
- preview;
- production.

Direção:
Git -> QA gates -> EAS preview -> stakeholder preview build.

Objetivo:
parar de depender de Metro/PC ligado para apresentação ao cliente.

Estado concluído em 2026-09-28:
- EAS autenticado como @poshaze1;
- Project ID confirmado: 2251ff12-7ff9-4567-b27c-fd5f26c33fc6;
- ambiente preview define EXPO_PUBLIC_API_URL=https://impar-outfit-api.vercel.app/api;
- guard distribuído passa com REQUIRE_DISTRIBUTED_API=true;
- primeiro build Android interno concluído no canal preview;
- EAS build ID: 9bbf5625-a1a2-4f2c-bf2f-8924b931ba40;
- runtime: 1.0.0;
- APK disponível e validado por HTTP 200;
- o APK não depende do Metro/PC NewBio para iniciar.

Backend distribuído:
- Vercel project: impar-outfit-api;
- endpoint público canônico: https://impar-outfit-api.vercel.app/api;
- Neon/PostgreSQL com 34 migrations aplicadas até 034_impar_analysis_requests.sql;
- storage privado S3-compatible ativo;
- smoke E2E PASS: cadastro -> identidade Neon -> upload privado -> URL assinada -> leitura WebP;
- rota serverless aninhada /api/:path* corrigida e validada;
- erros 5xx possuem logging sanitizado por requestId, sem payload/secrets.
## 11. Commits de referência

Linha principal desta frente:
- 565e872 — checkpoint professional avatar 3d wip;
- 5bc6281 — professionalize avatar and garment 3d pipeline;
- 529e411 — bind preview server to canonical workspace;
- 413be77 — checkpoint avatar provider and garment fit v3 wip;
- 7740909 — evolve professional avatars and garment 3d;
- 3c8443e — restrict realistic avatar provider session hosts;
- 35c410b — isolate PGlite test teardown harness;
- 449bd45 — simplify Avatar Studio with body presets and progressive advanced editing;
- 9d419bd — harden distributed production API readiness;
- 7aa2427 — connect production API to Neon private storage;
- 77a3e5f — harden distributed API release gates;
- 0861277 — route nested API paths on Vercel;
- 5ebc6f2 — add sanitized server-side error observability.

Baseline UX anterior:
- 27b736f — separate client and merchant preview journeys;
- a8c35fb — stakeholder preview runbook.

Branch de integração/release candidate atual: ops/e2e-preview-20260928.
O Android preview distribuído e o backend público estão aprovados para stakeholder preview. Produção pública/comercial continua condicionada aos gates físicos/provider descritos abaixo.
## 12. Próximos passos por papel

PO / Project Lead:
- definir qual nível 3D entra na oferta comercial;
- separar claramente “avatar paramétrico”, “avatar realista” e “fitting visual”;
- definir critérios de aceite para demonstração ao cliente.

Tech Lead / Arquitetura:
- testes PGlite isolados em memória: CONCLUÍDO;
- runtime distribuído PostgreSQL/Neon: CONCLUÍDO;
- API pública HTTPS em Vercel: CONCLUÍDO;
- EAS Preview Android independente do Metro: CONCLUÍDO;
- storage privado S3-compatible: CONCLUÍDO e validado em smoke E2E;
- manter PGlite nodefs/Node 24 fora do runtime de produção;
- validar provider abstraction/fallback quando o provider real for contratado/configurado.

UX / Product Design:
- presets corporais + modo avançado de corpo/rosto: IMPLEMENTADO;
- QA visual em iPhone/Android;
- revisar extremos de corpo/rosto e tons de pele;
- validar linguagem e hierarquia da nova primeira camada do Avatar Studio em dispositivo real.
Mobile:
- smoke do Avatar Studio em dispositivos reais;
- medir FPS/memória com GLB paramétrico;
- lazy-load de cabelos/garments quando necessário;
- manter Expo SDK 57 compatível.

Backend / Data:
- Neon/PostgreSQL conectado e migrations 001-034 aplicadas: CONCLUÍDO;
- storage privado e autorização de mídia: CONCLUÍDO e validado E2E;
- smoke versionado: npm run smoke:production-media;
- conectar provider real somente com segredo server-side quando houver credencial comercial;
- manter provider/engine versionado no avatar_config e persistir apenas metadados seguros.

3D / Reconstruction:
- calibrar morphs com amostras de corpos distintos;
- melhorar biblioteca de cabelo com proveniência aprovada;
- calibrar proxies por categoria/tecido;
- validar capturas e reconstruções reais.
Security / Privacy:
- threat model específico para avatar por fotos;
- retenção/exclusão de mídia;
- revisar provider DPA/termos antes de produção;
- garantir menor privilégio nos endpoints 3D.

QA / Release:
- frontend 25/25: PASS;
- Expo Doctor 21/21: PASS;
- Android distributed export/bundle: PASS;
- Android EAS internal preview build: FINISHED;
- APK artifact: HTTP 200;
- public API + Neon + private storage smoke: PASS;
- iOS internal build: BLOCKED EXTERNAMENTE por provisioning/credencial Apple interativa;
- smoke físico PERSON/ORGANIZATION em aparelhos reais permanece necessário;
- smoke private READY GLB e E2E provider permanecem condicionados a output/provider real;
- rollback continua disponível pelo histórico Git/Vercel.
## 13. Pendências críticas

P0 antes de produção pública/comercial:
1. smoke físico em iOS e Android;
2. provisionar credencial/dispositivo Apple para build iOS interno ou definir distribuição TestFlight;
3. validar Avaturn E2E se a rota premium for mantida;
4. revisar FPS/memória do GLB paramétrico em aparelhos intermediários;
5. executar smoke de um private READY GLB real quando houver reconstrução real aprovada.

Concluídos neste ciclo:
- PGlite removido do caminho de produção;
- backend PostgreSQL/Neon público HTTPS;
- storage privado;
- rota serverless aninhada;
- EXPO_PUBLIC_API_URL no EAS preview;
- primeiro Android EAS preview independente do Metro.

P1:
- presets corporais/faciais sem substituir controles finos: IMPLEMENTADO no Avatar Studio;
- mais cabelos licenciados;
- melhor iluminação e framing;
- instrumentação de performance;
- critérios de quality gate por categoria de roupa.
## 14. Regra de continuidade

Fonte canônica:
C:\Users\NewBio Digital\ImparOutfit

Não continuar a partir de:
- C:\Users\NewBio Digital\1 pasta compartilhada\migracao-dell-2026-09-25\ImparOutfit;
- cópias históricas do Dell;
- branches antigas de Cloudflare/infra como fonte de produto.

Antes de nova alteração:
1. git status;
2. confirmar branch;
3. checkpoint se houver WIP;
4. executar o papel responsável;
5. testes;
6. QA;
7. commit/push;
8. atualizar este handoff ou documento sucessor.

Fim do handoff.

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
- npm test: 24/24 PASS;
- Expo Doctor: 21/21 PASS;
- API config guard: PASS;
- Android export/bundle: PASS;
- bundle contém avatar paramétrico, cabelos e seis GLBs de roupas.

Backend:
- avatarProvider.test.js: 3/3 PASS;
- foundation.test.js: 75 assertions funcionais PASS;
- suite reporta 1 falha de teardown assíncrono do PGlite/Node após os testes.

A falha conhecida é:
RuntimeError: Aborted() após encerramento do foundation test.

Não tratar esse teardown como produto aprovado.
Isolar a combinação Node/PGlite antes de release de produção.
## 9. Preview atual

Workstation que hospeda o Metro:
PCNewBioDigital.

Scheduled Task:
IMPAR Outfit Expo Preview.

Status validado no handoff:
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

Ainda é necessário gerar/validar o primeiro build de preview compatível com o runtime atual para essa rota virar o canal canônico do cliente.
## 11. Commits de referência

Linha principal desta frente:
- 565e872 — checkpoint professional avatar 3d wip;
- 5bc6281 — professionalize avatar and garment 3d pipeline;
- 529e411 — bind preview server to canonical workspace;
- 413be77 — checkpoint avatar provider and garment fit v3 wip;
- 7740909 — evolve professional avatars and garment 3d;
- 3c8443e — restrict realistic avatar provider session hosts.

Baseline UX anterior:
- 27b736f — separate client and merchant preview journeys;
- a8c35fb — stakeholder preview runbook.

Branch atual deve continuar sendo tratada como experimental/preview até passar os gates restantes.
## 12. Próximos passos por papel

PO / Project Lead:
- definir qual nível 3D entra na oferta comercial;
- separar claramente “avatar paramétrico”, “avatar realista” e “fitting visual”;
- definir critérios de aceite para demonstração ao cliente.

Tech Lead / Arquitetura:
- resolver teardown PGlite;
- fechar estratégia de preview build/EAS;
- validar provider abstraction e fallback;
- consolidar storage privado para GLBs reais.

UX / Product Design:
- QA visual em iPhone/Android;
- revisar extremos de corpo/rosto e tons de pele;
- evoluir Avatar Studio sem excesso de controles na primeira camada;
- organizar presets + modo avançado.
Mobile:
- smoke do Avatar Studio em dispositivos reais;
- medir FPS/memória com GLB paramétrico;
- lazy-load de cabelos/garments quando necessário;
- manter Expo SDK 57 compatível.

Backend / Data:
- conectar provider real somente com segredo server-side;
- versionar provider/engine no avatar_config;
- persistir apenas metadados seguros;
- validar storage e autorização dos outputs 3D.

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
- manter 24/24 frontend como baseline mínimo;
- manter 21/21 Expo Doctor;
- bundle Android/iOS;
- smoke PERSON e ORGANIZATION;
- smoke avatar paramétrico;
- smoke garment proxy;
- smoke private READY GLB;
- E2E provider quando token existir;
- rollback commit registrado.
## 13. Pendências críticas

P0 antes de produção:
1. resolver PGlite teardown;
2. smoke real em iOS e Android;
3. criar preview build independente do Metro;
4. validar backend conectado e storage privado;
5. validar Avaturn E2E se a rota premium for mantida;
6. revisar desempenho do GLB paramétrico em aparelhos intermediários.

P1:
- presets corporais/faciais sem substituir controles finos;
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

# IMPAR Outfit — Execution Map do MVP

Data-base: 2026-09-28
Fonte canônica: C:\Users\NewBio Digital\ImparOutfit
Ambiente principal de validação atual: Expo Go no PCNewBioDigital
Status do produto: HOMOLOGAÇÃO / TESTES REAIS, não publicado em App Store ou Google Play.

## 1. Autoridade deste documento

Este documento consolida e substitui como fonte operacional de próximos passos:
- product-roadmap.md;
- product-evolution-2026-09-26.md;
- 3d/production-path.md;
- pendências ainda válidas de current-state-audit.md e security-cycle1.md;
- próximos passos do HANDOFF-IMPAR-OUTFIT-3D-V4-2026-09-28.md.

Os documentos anteriores permanecem como histórico/evidência. Em caso de conflito sobre prioridade ou estado atual, este Execution Map prevalece.

## 2. Objetivo do produto

Entregar um MVP do IMPAR Outfit que prove valor real para dois contextos sem misturar responsabilidades:

CLIENTE FINAL / PERSON:
identidade -> perfil/avatar -> armário privado -> Looks -> Análise ÍMPAR -> descoberta e referências comerciais.

LOJISTA / ORGANIZATION:
mesma pessoa -> contexto comercial autorizado -> catálogo -> vitrine -> campanhas/conteúdo -> sinais de interesse -> conta/capacidades.

A identidade é Person-first. Organização é contexto e autorização, nunca substituição da pessoa.
## 3. O que significa MVP neste projeto

MVP não significa publicar nas lojas agora.

O MVP será considerado entregue quando puder ser testado de ponta a ponta pelo Expo Go, em aparelhos reais, usando backend de homologação e dados persistentes reais, sem depender de funções fictícias para os fluxos centrais.

Obrigatório para o MVP:
- cadastro/login real;
- troca PERSON x ORGANIZATION sem vazamento de contexto;
- perfil e avatar paramétrico persistentes;
- armário real com mídia privada;
- criação/leitura de Looks reais;
- Análise ÍMPAR real sobre Look/contexto autorizado;
- descoberta de lojas/produtos e salvar referência sem criar posse;
- catálogo mínimo real do lojista;
- sinais/analytics mínimos baseados em dados reais ou explicitamente vazios;
- estados loading/empty/error/offline coerentes;
- segurança, privacidade e autorização preservadas;
- smoke em Expo Go em iOS e Android;
- rollback e handoff reproduzíveis.

Não obrigatório para o MVP:
- App Store / Google Play;
- checkout/pagamentos;
- mídia paga real ou cobrança de campanhas;
- Avaturn pago;
- fitting físico garantido;
- cloth simulation;
- reconstrução 3D perfeita;
- GPU dedicada;
- RAG amplo fora da Análise ÍMPAR governada;
- agenda/marketplace completo.

## 4. Modelo de ambiente vigente

DESENVOLVIMENTO -> QA AUTOMATIZADO -> HOMOLOGAÇÃO EXPO GO -> VALIDAÇÃO REAL -> CORREÇÃO -> PRÓXIMO CICLO.

Expo Go é o ambiente principal de teste/homologação enquanto o produto amadurece.
Vercel + Neon + storage privado são infraestrutura de homologação.
EAS Preview é auxiliar; não representa publicação comercial.
## 5. Estado factual consolidado

### Fundação concluída
- Person/Account, memberships, capabilities e isolamento PERSON/ORGANIZATION.
- PostgreSQL/Neon com migrations versionadas.
- API HTTPS distribuída em Vercel.
- mídia privada com acesso assinado.
- autenticação, revogação por token_version e autorização contextual.
- Commercial Product separado de Owned Wardrobe Item.
- Looks, Contexts, Collections, Comparisons e IMPAR Analysis no backend.
- pipeline de reconstruction com jobs/quality states/private output.
- avatar paramétrico MakeHuman/MPFB + cabelos licenciados.
- proxies 3D de roupas separados semanticamente de reconstrução real.
- smoke de API/Neon/storage real.
- frontend 25/25, Expo Doctor 21/21 e Android bundle aprovados.

### Lacuna central
O backend e o domínio estão mais maduros que a experiência mobile conectada.

Quando demoMode=false, RootNavigator envia o usuário para ConnectedExperience, hoje composto basicamente por ApiFoundationScreen + Análise ÍMPAR.

A experiência visual completa PERSON/LOJISTA continua majoritariamente apoiada por DemoContext.
Portanto, o produto conectado real ainda não possui paridade com o produto demonstrativo.
## 6. Matriz de integração visível

| Área | Visual atual | Backend | Estado MVP |
| --- | --- | --- | --- |
| Login/Cadastro | pronto | real | CONECTADO |
| Sessão/identidade | pronto | real | CONECTADO |
| Home PERSON | rica | existe | DEMO -> migrar |
| Armário/listagem | rica | real | DEMO -> migrar |
| Cadastro de peça | rico | real | LOCAL -> migrar |
| Detalhe 2D/3D | rico | parcial real | HÍBRIDO |
| Perfil | rico | real | LOCAL/HÍBRIDO |
| Avatar paramétrico | rico | real | HÍBRIDO AVANÇADO |
| Avatar realista | rico | adapter real | DEPENDÊNCIA EXTERNA |
| Looks | superfície técnica | real | CONECTAR À UX |
| Análise ÍMPAR | funcional | real | CONECTADO |
| Reconstrução | funcional | real | CONECTADO/BETA |
| Descobrir/Feed | rico | feed/produtos reais | DEMO -> migrar |
| Lojas/produtos | rico | real | DEMO -> migrar |
| Salvar referência | rico | real | DEMO -> migrar |
| Painel lojista | rico | parcial real | DEMO -> migrar |
| Catálogo lojista | rico | real | DEMO -> migrar |
| Campanhas | rico | showcase parcial | SIMULAÇÃO -> delimitar |
| Analytics lojista | rico | saves reais | DEMO -> migrar |
| Conta/capabilities | rico | real | DEMO -> migrar |

Regra: nenhum dado simulado pode ser exibido como métrica, campanha, posse, análise ou resultado real no modo conectado.
## 7. Prioridades de atuação

### P0 — caminho crítico do MVP
1. Unificar experiência visual e modo conectado real.
2. Eliminar o desvio ConnectedExperience técnico como jornada principal.
3. Criar camada de dados de produto que diferencie demo e API sem duplicar regra de negócio.
4. Conectar fluxo PERSON: Home -> Armário -> Item -> Look -> Análise -> Perfil/Avatar.
5. Preservar Expo Go durante toda a migração.
6. Manter isolamento PERSON/ORGANIZATION e autorização por capability.

### P1 — produto comercial mínimo
1. Conectar Descobrir -> Lojas -> Produtos -> salvar referência.
2. Conectar contexto LOJISTA -> Painel -> Catálogo -> Conta.
3. Substituir métricas fictícias por métricas reais, vazio explícito ou rótulo DEMONSTRAÇÃO.
4. Definir Campanhas MVP como showcase/conteúdo patrocinado, sem fingir compra de mídia.
5. Padronizar loading, empty, error e retry.

### P2 — maturidade
1. QA visual iPhone/Android.
2. acessibilidade e tap targets.
3. performance de imagens/3D/memória/FPS.
4. privacidade: consentimento, retenção, exclusão/exportação e órfãos de mídia.
5. rate limiting/concorrência adequados à infraestrutura distribuída.
6. observabilidade operacional sem PII/secrets.

### P3 — evolução pós-MVP
Avaturn comercial, reconstrução GPU, fitting avançado, pagamentos, mídia paga real, checkout, marketplace e publicação em lojas.
## 8. Ciclos end-to-end até o MVP

### CICLO M0 — Consolidação e verdade operacional
Status: CONCLUÍDO.
Entregas: Execution Map, estado factual, definição de MVP, prioridades e processo.

### CICLO M1 — Connected Product Shell
Status: IMPLEMENTADO / AGUARDANDO VALIDAÇÃO FÍSICA NO EXPO GO.
Objetivo: usuário autenticado real deve entrar na arquitetura visual correta PERSON/ORGANIZATION, sem cair numa superfície técnica paralela.

Entregue:
- ConnectedDataContext separado do DemoContext;
- Home, Armário, Descobrir e Perfil conectados a dados reais;
- Painel, Catálogo, Campanhas/showcases e Conta do LOJISTA usando dados reais;
- RootNavigator removeu a antiga ConnectedExperience técnica de duas abas;
- troca PERSON/ORGANIZATION usa o contexto real da conta;
- Descobrir salva/remove referência comercial pela API sem criar posse;
- Avatar Studio conectado lê perfil real e atualiza a API;
- loading, empty, error e retry básicos;
- teste de contrato impede ConnectedProductScreens de importar DemoContext.

Evidências automáticas:
- frontend 26/26 PASS;
- Expo Doctor 21/21 PASS;
- Android export/Metro PASS;
- API guard PASS;
- /health, /ready, /stores, /products e /showcases HTTP 200;
- Expo Preview task Running, porta 8480 Listening e túnel externo HTTP 200.

Smoke físico inicial em iPhone encontrou e corrigiu:
- Metro chegou a manter grafo antigo após a inclusão do ConnectedDataContext; preview agora reinicia com --clear.
- Login real ainda pré-preenchia demo@impar.com/demo; credenciais demonstrativas foram removidas do modo real.
- preview Expo Go agora fixa EXPO_PUBLIC_API_URL=https://impar-outfit-api.vercel.app/api.
- tela real identifica HOMOLOGAÇÃO e direciona explicitamente para criação de conta de homologação.

Gate restante: reabrir no Expo Go após o restart limpo e validar criação/login de conta real -> Home PERSON -> abas conectadas sem erro visual/runtime.

### CICLO M2 — PERSON Core
Objetivo: Perfil/Avatar -> Armário -> peça -> Look -> Análise usando persistência real.
Gate: conta nova completa esse fluxo sem DemoContext como fonte de verdade.

### CICLO M3 — Discovery / Commerce Reference
Objetivo: Feed/Lojas/Produtos reais, salvar/remover referência, usar referência em Look sem criar ownership.
Gate: produto comercial salvo continua fora do armário.
### CICLO M4 — ORGANIZATION Core
Objetivo: contexto de marca real com Painel, Catálogo, Conta/capabilities e analytics mínimos.
Campanha no MVP = showcase/conteúdo patrocinado; orçamento/alcance estimado fictício não será tratado como operação real.
Gate: lojista publica produto e cliente consegue descobri-lo, sem acesso a dados privados da cliente.

### CICLO M5 — 3D MVP
Objetivo: avatar paramétrico estável + proxy de roupa honesto + captura/reconstruction job real.
READY GLB privado substitui proxy somente após quality gate.
Gate: nenhum proxy é apresentado como reconstrução/fitting.

### CICLO M6 — Privacidade e Resiliência
Objetivo: consentimento, retenção/exclusão/exportação mínima, órfãos, limites, erro/offline/retry e observabilidade.
Gate: fluxos pessoais possuem política e comportamento verificáveis.

### CICLO M7 — UX / Performance / Acessibilidade
Objetivo: unificar design system, remover linguagem de protótipo, QA visual e performance em aparelhos reais.
Gate: PERSON e ORGANIZATION passam checklist visual/ergonômico.

### CICLO M8 — MVP Freeze e Aceite
Objetivo: somente correções, smoke completo, regressão, segurança, documentação e evidências.
Gate final: jornada MVP executada no Expo Go em iOS e Android, com backend de homologação e rollback conhecido.
## 9. Processo obrigatório de cada ciclo

1. PRODUCT / PROJECT LEAD
- declarar problema, resultado e usuário;
- definir o que entra/não entra;
- critérios de aceite observáveis.

2. TECH LEAD
- mapear impacto em dados, API, auth, compatibilidade e rollback;
- preferir menor arquitetura que preserve evolução.

3. UX / PRODUCT DESIGN
- fluxo, hierarquia, estados vazios/loading/error/offline e acessibilidade.

4. IMPLEMENTAÇÃO
- Mobile + Backend/Data + 3D apenas onde o ciclo tocar;
- não automatizar ou integrar comportamento fictício como real.

5. SECURITY / PRIVACY
- autorização, mídia, secrets, logs e isolamento.

6. QA AUTOMATIZADO
- testes frontend/backend;
- contratos;
- Expo Doctor;
- bundle/guard quando aplicável.

7. QA EXPO GO
- validar no ambiente principal real;
- PERSON;
- ORGANIZATION quando tocado;
- 3D quando tocado.

8. RELEASE DO CICLO
- commit;
- push;
- rollback identificado;
- Execution Map atualizado;
- handoff somente quando necessário.

9. EVOLUÇÃO
- bugs encontrados viram entrada do próximo ciclo pela prioridade de risco/impacto.
## 10. Critério de priorização

Ordem:
1. bloqueia jornada central;
2. risco de privacidade/segurança/dados;
3. função aparenta ser real mas é demo;
4. inconsistência entre backend e frontend;
5. falha de UX que impede ação;
6. performance/estabilidade;
7. refinamento visual;
8. expansão de escopo.

Não priorizar por impacto visual isolado.

## 11. Definition of Done de um ciclo

Um ciclo só fecha quando:
- código está no repositório canônico;
- git status limpo;
- testes relacionados passam;
- gates globais permanecem verdes;
- fluxo foi verificável no Expo Go quando aplicável;
- nenhuma função nova mascara demo como real;
- impacto de segurança foi revisado;
- rollback existe;
- este documento registra o novo estado.

## 12. Regra de branches

Branch canônica atual: 3d/professional-avatar-v3-20260928 até nova decisão explícita.
Criar branch focada apenas quando o risco justificar.
Não desenvolver a partir de ImparOutfit-runtime, Dell ou cópias de migração.
## 13. Painel de maturidade

| Dimensão | Estado |
| --- | --- |
| Fundação backend | MADURA PARA MVP |
| Auth/identidade | MADURA PARA MVP |
| Dados privados/storage | MADURA PARA MVP |
| Análise ÍMPAR | FUNCIONAL / evoluir UX |
| 3D paramétrico | FUNCIONAL / calibrar |
| Reconstruction | BETA REAL |
| UX demo | AVANÇADA |
| UX conectada | PRINCIPAL GARGALO |
| PERSON conectado | PARCIAL |
| ORGANIZATION conectado | INICIAL |
| Privacidade operacional | PARCIAL |
| QA automatizado | FORTE |
| QA em aparelhos | PENDENTE |
| Publicação em lojas | FORA DO ESCOPO ATUAL |

## 14. Decisão vigente

A prioridade imediata não é adicionar novas tecnologias.

É transformar a fundação real existente em um único produto conectado, coerente e testável.

CICLO ATIVO: M1 — Connected Product Shell.

Fim do Execution Map.

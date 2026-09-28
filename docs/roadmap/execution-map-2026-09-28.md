# IMPAR Outfit — Mapa de Execução e Melhorias

Data-base: 2026-09-28  
Release de referência: EAS `production`, runtime `1.0.0`, update group `cbd838c5-afb2-4487-9e07-ac5d1eff5cfa`  
Commit liberado: `fe52a0b`

## Objetivo

Evoluir o runtime 3D já validado em celular para um produto conectado, distribuível e comercialmente utilizável, sem misturar protótipo visual com promessas de precisão física ou infraestrutura ainda não comprovada.

## Estado atual

| Frente | Estado | Evidência / limite |
| --- | --- | --- |
| Avatar paramétrico | PRODUÇÃO | MakeHuman/MPFB2 + morph targets + 4 cabelos GLB |
| Avatar realista | PRODUÇÃO DEMONSTRÁVEL | Avaturn + consentimento + export/render; provider público ainda é protótipo |
| Garment Fit V2 | PRODUÇÃO DEMONSTRÁVEL | `MEASUREMENT_EASE_V2`; não é cloth physics |
| EAS production | PRODUÇÃO | iOS + Android publicados no canal `production` |
| Backend conectado | BASE PRONTA | API, auth, perfil, wardrobe, looks, reconstrução e análise existem |
| API pública de produção | BLOQUEADOR | `EXPO_PUBLIC_API_URL` ainda não existe no ambiente EAS production |
| Binário Store/Play | PENDENTE | Não deve ser criado antes da API TLS distribuída |
| Persistência conectada de avatar | EM EXECUÇÃO | Reaproveitando `customer_profiles.avatar_config` |
| Reconstrução de roupa real | POC | Precisa benchmark com captura real antes de escalar |
| Fit V3 / body-aware | PESQUISA CONTROLADA | Só entra após comparação objetiva com V2 |

## Ordem de execução

### P0 — Release 3D V2
Status: CONCLUÍDO.

Entregas: gates automatizados, smoke físico, consentimento Avaturn, Android/iOS bundle, EAS production e rollback documentado.

Critério de aceite: usuário consegue abrir e utilizar o runtime validado sem regressão conhecida.

### P1 — Avatar conectado
Status: EM EXECUÇÃO.

Resultado esperado: avatar deixa de depender apenas de estado local e passa a acompanhar a conta autenticada.

Entregas obrigatórias:
- persistir `avatarControls`, `realisticAvatar`, `avatarEngine` e `avatarConfiguredAt` no perfil existente;
- manter isolamento por pessoa;
- permitir limpar/substituir avatar realista;
- abrir Avatar Paramétrico e Avatar Realista no fluxo conectado;
- salvar ajustes diretamente em `PUT /profile`;
- manter fallback paramétrico.

Critério de aceite: logout/login em outro ciclo recupera o mesmo avatar da conta, sem cruzar dados entre pessoas.

Risco principal: URL externa do modelo Avaturn expirar ou mudar. Próxima evolução é copiar o GLB aprovado para storage privado controlado pela aplicação.

### P2 — Backend distribuído de produção
Status: PRÓXIMO BLOQUEADOR.

Resultado esperado: retirar a dependência de `localhost` e permitir app conectado real.

Entregas:
- subir API HTTPS em host controlado;
- PostgreSQL e Redis privados;
- migrations automatizadas;
- storage privado de mídia/GLB;
- backup e restore testados;
- health/readiness;
- logs sanitizados e request IDs;
- rate limiting e CORS revisados;
- configurar `EXPO_PUBLIC_API_URL` no EAS production;
- executar `REQUIRE_DISTRIBUTED_API=true` como gate.

Critério de aceite: login, perfil, wardrobe, looks, avatar e reconstrução funcionam por HTTPS fora da rede local.

### P3 — Onboarding profissional de avatar
Status: RECOMENDADO APÓS P2.

Resultado esperado: reduzir complexidade para usuário final.

Fluxo alvo:
`Fotos -> Medidas -> Corpo -> Rosto -> Cabelo -> Revisão 360° -> Salvar`.

Modos:
- Rápido: medidas essenciais + presets;
- Avançado: morphs completos.

Critério de aceite: usuário conclui avatar sem precisar entender termos técnicos do motor 3D.

### P4 — Custódia do avatar realista
Status: RECOMENDADO.

Resultado esperado: não depender da URL externa do provider como fonte permanente.

Entregas:
- ingestão privada do GLB exportado;
- hash, versão e origem;
- autorização por pessoa;
- revogação/remoção;
- política de retenção;
- histórico mínimo de versões com rollback.

Critério de aceite: renderer usa asset privado controlado pelo IMPAR Outfit; provider pode ficar indisponível sem apagar avatar já salvo.

### P5 — Pipeline de roupas reais
Status: VALIDAÇÃO NECESSÁRIA.

Resultado esperado: provar qualidade com peças reais antes de aumentar arquitetura.

Entregas:
- captura multivista guiada;
- validação de foco/cobertura;
- reconstruction job;
- quality gate por categoria;
- GLB privado;
- amostra real de TOP, PANTS e DRESS;
- medição de tempo, falha e recaptura.

Critério de aceite: conjunto mínimo de peças READY com qualidade visual repetível.

### P6 — Garment Fit V3 / Body-aware
Status: NÃO IMPLEMENTAR ÀS CEGAS.

Comparar:
- landmarks;
- cage deformation;
- rig/skin transfer;
- oclusão corporal;
- collision approximation.

Critério de decisão: só substituir V2 se houver ganho visual mensurável com custo/performance aceitáveis no mobile.

Cloth physics continua fora do obrigatório.

### P7 — Wardrobe + Looks + Análise ÍMPAR conectados
Status: BASE DE BACKEND EXISTE.

Resultado esperado: jornada real ponta a ponta.

Entregas:
- catálogo pessoal conectado;
- looks versionados;
- composição 3D;
- contexto;
- análise ÍMPAR;
- resultado final rastreável;
- distinção rigorosa entre peça possuída, referência comercial e patrocinada.

### P8 — Jornada LOJISTA
Status: BASE EXISTE / UX A EVOLUIR.

Entregas:
- catálogo;
- publicação de produto;
- preview para cliente;
- campanhas;
- saves/engagement;
- permissões por função;
- métricas sem exposição de PII.

### P9 — Hardening e distribuição
Status: FUTURO PRÓXIMO.

Entregas:
- atualizar dependências moderadas em branch própria;
- regressão Expo/React Navigation;
- testes de carga;
- observabilidade;
- backup/restore;
- runbook de incidente;
- build assinado;
- TestFlight/Play Internal;
- depois App Store/Play Store.

## Próximas três execuções objetivas

1. Concluir e publicar a branch de Avatar Conectado.
2. Implantar a API HTTPS e configurar `EXPO_PUBLIC_API_URL` no EAS production.
3. Executar um ciclo real: pessoa -> avatar -> peça real -> reconstrução -> quality gate -> Garment Fit V2 -> Look -> análise.

## Regras de decisão

- Não criar outra entidade quando a estrutura atual resolver com segurança.
- Não armazenar secrets no mobile.
- Não publicar build distribuído com loopback.
- Não chamar prévia proporcional de fitting físico.
- Não adotar cloth physics ou GPU por prestígio técnico; exigir caso de negócio e benchmark.
- Toda nova função deve ter teste, rollback, documentação e critério de aceite.

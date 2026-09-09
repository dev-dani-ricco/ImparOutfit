# Evidências de validação — CICLO 1

Branch `techlead/universo-impar-foundation`; base preservada `b06391a`.
Snapshot anterior às alterações: cycle1-baseline.md. Sem merge em main, push ou reescrita.
Alterações preexistentes da Showcase/planos/perfil incorporadas aos commits por domínio após
inventário/classificação; assets preservados. O conjunto final versionado deve reproduzir o worktree testado.

| Verificação | Resultado objetivo | Limite |
| --- | --- | --- |
| Backend `npm test` | 19/19 testes | Inclui três testes anteriores de planos; demais cobrem fundação e segurança |
| Frontend `npm test` | 3/3 testes novos | Não existia script/suíte frontend; testes de domínio/persistência, não de telas native |
| PostgreSQL local de teste | Migrations 001–006 executadas sem alterar SQL, com pgcrypto/PLpgSQL | PGlite/PostgreSQL WASM; não é deploy/teste de carga no PostgreSQL 16 de produção |
| Migração incremental | Legado com cópia comercial preservado; OWNED_ITEM não criado; save/review criados | Dados sintéticos, sem volume real |
| Runner | Reexecução, checksum inválido recusado, down/up de índices e recusa de down destrutivo | Adoção tem preflight estrutural mínimo, exige revisão de drift |
| Autorização A–G | Pessoa A/B, cliente+membro, loja A/B, MARKETING, saves, previews e códigos de erro | Testes HTTP com SQL real local |
| Defesa no schema | FKs e triggers recusam mídia/eventos/LookItems entre pessoas; Look público recusado | Não substitui política de credenciais do banco |
| Sessões/capabilities | JWT sem profileType, expiração de grants, revogação de membership/logout e escopo de recurso | Sem refresh/MFA/reset de senha |
| Upload | MIME real, extensão, decode, tamanho, quantidade, malformed multipart e leitura privada | Não é ensaio amplo de fuzzing/antimalware |
| OpenAPI | SwaggerParser valida e teste confere cada método/rota de routes/index.js | Cobertura de contrato estrutural; não todas as respostas têm schema exaustivo |
| Bundle Android | Export Expo/Hermes local concluído | Não é APK/AAB assinado nem teste em dispositivo |
| Bundle web | Export Expo local concluído | Navegador confere fluxo demo; não testa renderer native |
| Navegador final | Cliente: 47 OWNED_ITEM + 3 referências migradas; novo save resulta em 47 + 4 | Sessão de navegador local, dados fictícios |
| Troca de identidade | demo-store-owner recebe 0 peças, 0 saves e nenhuma medida da cliente | Estado anterior preservado na chave da própria pessoa |
| Sintaxe/infra | 25 fontes backend e 4 arquivos de teste passam node --check; bash -n e parse do Compose passam | Não executa Docker/deploy |
| Audit final | Backend 0; frontend 26: 8 altas/18 moderadas | Revisão de alcançabilidade em security-cycle1.md |
| Secrets | Gitleaks sem ocorrência confirmada no worktree | Sem OCR, contas remotas ou objetos Git inalcançáveis |

Os 12 testes de integração foram repetidos e passaram após o ajuste final de remoção de
atributo nullable do avatar. Os demais sete testes backend não foram alterados. Foram
validados 3 testes frontend e bundles finais Android (1.198 módulos, 58 assets, Hermes ~9,4 MB)
e web (547 módulos, 53 assets, JS ~910 kB). Capturas visuais ficam em `.expo-demo-check`,
ignorado pelo Git. Nenhum erro de execução foi reportado pelo navegador nos fluxos verificados.

Commits funcionais e de preservação: `d21524b` baseline; `37c5c4a` uploads;
`418cb5a` identidade/autorização; `23734c1` ownership/Looks; `025eaa2` contratos/migrations/deploy;
`46db36f` preservação/classificação da Showcase; `8ed4860` isolamento/semântica frontend;
`cdab638` limpeza explícita de atributos do perfil. A documentação consolidada é o commit seguinte.

Comandos reproduzíveis, a partir das respectivas pastas:

```text
backend: npm ci && npm test
frontend: npm ci && npm test
frontend: node node_modules/expo/bin/cli export --platform android --max-workers 2 --output-dir .expo-demo-check/cycle1-android-final
frontend: node node_modules/expo/bin/cli export --platform web --max-workers 1 --output-dir .expo-demo-check/cycle1-web-final
backend/frontend: npm audit --json --ignore-scripts
```

Bundles usaram CI=1, EXPO_OFFLINE=1, EXPO_NO_TELEMETRY=1. O sandbox Windows precisou autorizar
workers locais do Node/Metro e escrita no índice Git; nenhum bloqueio de aprovação impediu a entrega.
Audits com rede bloqueada foram repetidos com acesso autorizado ao npm; erro de rede não foi
contado como audit limpo. Relatórios brutos ficam fora do Git no snapshot privado do ciclo.

Pendências deliberadas: POC 3D real, integração completa das telas com API, storage externo e
políticas de retenção/consentimento, review definitivo de IP/licenças, revogação de URLs legadas,
upgrade major da toolchain e ensaio operacional de banco/backup/concorrência. A Especificação
Executiva e Prompt Mestre originais não foram localizados; usados requisitos desta solicitação
e conteúdo das auditorias sem presumir acesso aos originais.

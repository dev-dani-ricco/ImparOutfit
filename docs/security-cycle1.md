# Segurança — CICLO 1

Audit executado em 09/09/2026 nos dois projetos. Contagens são pacotes sinalizados,
incluindo dependentes transitivos; não equivalem a explorações comprovadas.

| Área | Antes | Depois | Resultado |
| --- | --- | --- | --- |
| Backend | 5 (1 alta, 3 moderadas, 1 baixa) | 0 | Correções compatíveis e substituição de parser YAML |
| Frontend | 30 (12 altas, 18 moderadas) | 26 (8 altas, 18 moderadas) | Patches aplicados; majors de Expo/React Navigation isoladas |

| Dependência | Versão anterior → atual | Tratamento |
| --- | --- | --- |
| Multer | 1.4.5-lts.2 → 2.3.0 | Major delimitada ao middleware, testes de MIME, multipart malformado, tamanho e quantidade. Corrige caminho plausível de DoS em upload autenticado |
| Joi | 17.13.4 → 17.13.7 | Patch de prototype pollution. Inputs não controlam templates/messages de validação |
| qs | 6.15.3 → 6.16.0 | Override compatível mantém Express 4.22.2; query parser simple e JSON com limite |
| body-parser | 1.20.6 → 1.20.8 | Atualização compatível |
| brace-expansion (backend) | 5.0.7 → 5.0.9 | Atualização compatível; remoção de yamljs/glob legado reduz superfície |
| @xmldom/xmldom (frontend) | 0.8.13 → 0.8.15 | Patch de parsing/XML na cadeia de ferramentas |
| PostCSS (frontend) | 8.4.49 → 8.5.28 | Override dentro da major 8; bundles Android/web validados |

Multer não apareceu no audit inicial apesar da versão antiga. A escolha considera também os
[avisos oficiais do projeto](https://github.com/expressjs/multer/security/advisories), incluindo
[nomes multipart malformados](https://github.com/expressjs/multer/security/advisories/GHSA-wc9g-mqfw-jrwm)
e [limpeza de uploads abortados](https://github.com/expressjs/multer/security/advisories/GHSA-3p4h-7m6x-2hcm).
O teste funcional não é certificação de ausência de vulnerabilidades futuras.

Alertas abertos:

| Raiz / cadeia | Risco e alcançabilidade analisada | Contenção e próximo passo |
| --- | --- | --- |
| image-size 1.2.1 → Metro/Expo | Alta: loops de parsers ICNS/JXL/HEIF em assets malformados; caminho de build, não parser de upload da API | Builds somente com assets revisados do repositório; nunca compilar capturas privadas como assets. Isolar upgrade Expo 54 → versão compatível corrigida e validar native/web. Não executar audit fix --force |
| decode-uri-component 0.2.2 → query-string/React Navigation | Moderada: decoding de percent encoding malformado | Não há linking configurado no NavigationContainer; não habilitar parsing de links externos antes de atualizar/mitigar. Audit informa ausência de correção aplicável nesta cadeia |
| uuid 3.4.0 e cadeia xcode/ngrok/Expo | Moderada: limites de buffer em funções específicas de geração | Cadeias de ferramentas; aplicação não expõe essas APIs a input externo. Atualizar junto da toolchain. Evitar override major cego e túnel de desenvolvimento exposto |

Principais riscos de aplicação corrigidos/mitigados: mídia pessoal passa por autorização de
leitura, deixa de ser URL pública retornada pela API, recebe nome gerado e validação por decode;
limites de upload/pixels/concorrência; erros internos sanitizados; JWT sem autoridade de papel
global; revogação/conta ativa revalidadas; DTO comercial sem identificação de clientes; vitrines
limitadas ao próprio catálogo; perfis/Looks/armário/saves isolados; cópia comercial não cria posse.
Migrations substituem reaplicação manual e startup valida configuração de auth.

Limites abertos: URLs pessoais antigas já distribuídas não foram revogadas no provedor externo;
storage local requer ACL, backup e volume privado; quota de bytes por pessoa, coleta de órfãos
após crash, retenção/exclusão/exportação, consentimento e antimalware adicional são pendências.
Não há refresh/reset/verificação de e-mail/MFA; cadastro comercial self-service legado continua.
Rate limit/concorrência são por processo; infraestrutura distribuída demanda política própria.
Não houve teste de carga/DoS extensivo, deploy real, pentest, acesso a produção ou rotação de secrets.

Scanner Gitleaks 8.30.1 do CICLO 0 reutilizado localmente com regras padrão + .gitleaks.toml e
redaction. Nenhum secret confirmado no scan do worktree; isso não substitui revisão de IP/PII,
OCR de assets ou inventário de credenciais em serviços externos. Relatórios brutos ficam no
snapshot temporário privado do ciclo. Veja ip-classification.md para conteúdo da Dani.

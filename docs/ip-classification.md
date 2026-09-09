# Classificação de IP — CICLO 1

Inventário de caminhos; não contém metodologia, transcrições ou recomendações proprietárias.
Classificação conservadora de risco, não autorização de publicação nem parecer jurídico.
PUBLIC: distribuição aprovada; INTERNAL: uso interno; CONFIDENTIAL: acesso restrito;
PROPRIETARY: conteúdo/metodologia com titularidade a validar; PERSONAL: dados/representação de pessoa;
SECRET: credenciais/chaves. Em arquivo misto prevalece a restrição maior para distribuição.

| Arquivo | Classificação | Risco | Ação recomendada |
| --- | --- | --- | --- |
| `frontend/src/demo/data.js` (blocos associados à Dani) | PROPRIETARY, provisória | Conteúdo editorial no bundle; origem e autorização não comprovadas | Revisão pela titular; separar catálogo público de conteúdo privado autorizado antes de distribuição |
| `frontend/src/contexts/DemoContext.js` (resposta demonstrativa) | PROPRIETARY, provisória | Texto consultivo estático pode ser interpretado como metodologia ou serviço real | Restringir à demonstração; futura API autorizada por IDs/versionamento, sem knowledge no cliente |
| `frontend/src/screens/DaniRicoScreen.js` | INTERNAL | Interface simula aulas, parecer e agenda; identidade/marca ligada à Dani | Manter aviso de demonstração; validar direitos e não apresentar como atendimento efetivo |
| `frontend/src/demo/data.js` (perfil/fixtures nominais) | PERSONAL, preventiva | Nomes e medidas parecem sintéticos; origem não demonstrada | Vincular a pessoa fictícia `demo-person`; confirmar sinteticidade antes de distribuição |
| `frontend/src/contexts/AuthContext.js` (identidades demo) | PERSONAL, preventiva | Identidade nominal demonstrativa | Marcar como fictícia e manter namespace demo sem equivalência com conta real |
| `frontend/src/screens/StoreDashboardScreen.js` (atividade nominal) | PERSONAL, preventiva | Exemplo de analytics com identificação de clientes | Usar identificação explicitamente sintética; API agora fornece somente agregados |
| `frontend/assets/demo/*.png` | INTERNAL | Proveniência/licença individual não comprovadas | Preservar assets e hashes; inventariar direitos antes de publicação |
| `frontend/assets/demo/distinct/*.jpg` | INTERNAL | Proveniência/licença individual não comprovadas | Preservar localmente para Showcase; revisar licenças e titularidade |
| `frontend/assets/models/michelle.glb` | INTERNAL | Modelo de referência, atribuição local sem verificação jurídica | Preservar experimento; não tratar como avatar reconstruído de cliente |
| `frontend/assets/models/README.md` | INTERNAL | Declaração de proveniência não comprova autorização | Validar a cadeia Three.js/Mixamo e condições de distribuição |
| `docs/presentation-guide.md` | INTERNAL | Roteiro de demonstração e capacidades simuladas | Atualizar sem reproduzir material da Dani; circulação interna |
| `docs/product-roadmap.md` | INTERNAL | Estratégia e funcionalidades futuras | Compartilhamento controlado; não prometer integrações concluídas |
| `LICENSE` | PUBLIC | Licença do código pode ser confundida com autorização para conteúdo/asset | Esclarecer escopo; não usar como prova de direitos da Dani |
| `docs/current-state-audit.md`, `docs/repository-baseline.md` | INTERNAL | Mapeamento técnico de riscos e histórico | Manter circulação interna e sem conteúdo bruto |
| `%TEMP%/universo-impar-cycle1-d66d9468d0b149ea803c5468c9ad606f/` (fora do Git) | CONFIDENTIAL | Snapshot preserva conteúdo e histórico potencialmente proprietário | Retenção privada controlada; não anexar a PR público |
| `.env*` privados (quando existentes; ignorados) | SECRET | Credenciais de execução | Nunca versionar; exemplos sanitizados são INTERNAL |

Não foram confirmadas credenciais reais nos arquivos examinados. Essa conclusão depende do
escopo dos scanners, não de uma garantia absoluta. Não houve OCR/perícia de assets nem revisão
de direitos externa. Arquivos existentes foram preservados e incorporados apenas à branch local
para reproduzir a Showcase; nenhum push, distribuição de bundle ou apagamento de histórico.
As classificações provisórias exigem decisão da titular antes de nova publicação.

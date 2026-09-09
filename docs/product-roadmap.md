# Roadmap após CICLO 1

CICLO 1 estabelece identidade Person/Account, memberships, capabilities, mídia privada,
migrations, separação de posse e referências comerciais, e demo isolada por identidade.
Consulte architecture.md e cycle1-validation.md para a entrega comprovada e seus limites.

Próximo marco: POC vertical real de Avatar + captura + reconstrução 3D + composição.

- Definir entradas/consentimento/proveniência e critérios mensuráveis de qualidade.
- Armazenar capturas em mídia privada e processar por jobs com estados reais.
- Produzir malhas/artefatos versionados com evidência de reconstrução e limitações.
- Integrar um Look com OWNED_ITEM e preview comercial preservando ownership.
- Verificar no dispositivo alvo, avaliar latência, custo, fidelidade e falhas.
- Integrar gradualmente telas Expo aos contratos reais; não confundir demo com backend.
- Migrar dependências Expo/Metro em ciclo isolado, com testes nativos e web.
- Resolver proveniência/licença de assets e classificação definitiva do conteúdo da Dani
  antes de distribuição; conhecimento privado exige governança/autorizações no backend.

Compras/importações validadas, checkout, cobrança, agenda real, RAG e escalabilidade operacional
não foram implementados. São escopos futuros separados; salvar ou provar produto não cria posse.

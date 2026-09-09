# Migrations — execução, adoção e recuperação

`backend/sql/001_schema.sql` foi preservado. `002`/`003` eram trabalho local prévio, agora
versionado. `004` adiciona identidade; `005` ownership, produtos, mídia e Looks; `006` índices.
Ordem lexical de prefixos numéricos; arquivos `.down.sql` não são aplicados como up.
`schema_migrations` grava nome, SHA-256 com LF normalizado, data e flag de adoção.
Migration aplicada não deve ser editada: alterações novas exigem próximo número.

```sh
cd backend
npm ci
npm run migrate
npm start
```

O runner adquire advisory lock, verifica checksums/ordem, aplica pendências e registra versões
na mesma transação. Falha reverte o lote inteiro. Não use psql manual no caminho normal.
Um schema existente sem ledger é recusado. Depois de backup verificado e comparação do schema
real com 001–003, execute `npm run migrate:adopt` em manutenção: checa tabelas/colunas/trigger
essenciais, registra 001–003 como adopted e aplica as novas. Essa checagem não é um comparador
exaustivo de drift; divergência de tipos/constraints/funções deve ser resolvida antes da adoção.
Schema parcial é recusado. Caso e-mails normalizados conflitem, a migração falha para revisão;
não se fundem identidades nem se escolhe um proprietário silenciosamente.

No Compose, volume novo recebe schema pelo runner da API. Volume antigo precisa da adoção
explícita, por exemplo `docker compose --env-file .env.server -f compose.server.yml run --rm api npm run migrate:adopt`,
após backup/revisão. A API só inicia se o runner concluir. Não foi acessado banco de produção.

`npm run migrate:down` reverte somente a última migration com down seguro: 006 remove índices.
004/005 não possuem down destrutivo: identidades, eventos e novas escritas não podem ser descartados
com segurança. Recuperação exige roll forward ou restauração do backup em banco separado e
conciliação das escritas posteriores. Backup do banco e mídia devem ser coordenados; o snapshot
Git do ciclo preserva código, não dados de execução.

Preservação: tabela items e item_saves originais continuam como histórico. Store vira Product;
saves/copias com origem conhecida tornam-se referências comerciais. Todo wardrobe legado sem
evento confirmado fica em review, inclusive catalogação direta. O endpoint privado de revisão
lista IDs/motivos sem URLs antigas. Nenhum restore de mídia externa é feito automaticamente.
Looks legados ficam privados e preservam arrays originais; versões novas usam LookItem com FKs.

Testes executam 001–006 sem modificar SQL em PostgreSQL WASM/PGlite, inclusive pgcrypto,
PL/pgSQL, constraints e triggers. Cobrem banco limpo, rerun, down/up de índices, adoção de legado
com cópia comercial e preservação dos registros. Isso não substitui ensaio de volume, locks de
múltiplas conexões, backup/restore e deploy em PostgreSQL 16 real na infraestrutura alvo.

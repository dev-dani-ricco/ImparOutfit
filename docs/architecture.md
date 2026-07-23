# IMPAROutfit - Arquitetura

## MVP até 10.000 usuários
- API Express monolítica, PostgreSQL gerenciado ou VPS, Redis para cache/rate limit e Cloudinary para imagens.
- PM2 em Hostinger Cloud VPS, Nginx com TLS e backups diários do PostgreSQL.
- Índices focados em feed, itens por loja e itens por usuário.

## Escala 100.000+ usuários
- Separar workers para processamento de imagens/notificações.
- Read replicas PostgreSQL, particionamento de eventos do feed e cache Redis por timelines.
- CDN para imagens Cloudinary, observabilidade com logs estruturados e métricas.
- Migração gradual para filas (BullMQ/Redis ou SQS) e deploy containerizado.

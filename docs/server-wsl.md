# Servidor de testes no Windows com WSL 2

## Pré-requisitos

- Windows com WSL 2
- Ubuntu 24.04
- Docker Engine e Docker Compose
- Repositório clonado no sistema de arquivos Linux

## Configuração

Na raiz do repositório:

```bash
cp server.env.example .env.server
```

Edite `.env.server` e substitua os valores `CHANGE_ME`. Não versione esse arquivo.

Valide a composição:

```bash
docker compose --env-file .env.server -f compose.server.yml config
```

Inicie os serviços:

```bash
docker compose --env-file .env.server -f compose.server.yml up -d --build
```

Verifique:

```bash
docker compose --env-file .env.server -f compose.server.yml ps
curl http://127.0.0.1:4000/health
```

O PostgreSQL e o Redis ficam apenas na rede privada do Docker. A API é
publicada somente no endereço local `127.0.0.1:4000` para ser exposta depois
por um proxy HTTPS ou Cloudflare Tunnel.

## Operação

Exibir logs da API:

```bash
docker compose --env-file .env.server -f compose.server.yml logs -f api
```

Reiniciar:

```bash
docker compose --env-file .env.server -f compose.server.yml restart
```

Parar sem apagar os dados:

```bash
docker compose --env-file .env.server -f compose.server.yml down
```

Os dados persistem nos volumes `postgres_data` e `redis_data`.

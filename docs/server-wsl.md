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
publicada somente no endereço local `127.0.0.1:4000`. O serviço `tunnel`
estabelece uma conexão de saída com a Cloudflare e publica a API por HTTPS,
sem abrir portas de entrada no roteador.

## Cloudflare Tunnel

Crie um túnel remotamente gerenciado no painel Cloudflare. Na rota pública,
associe o subdomínio desejado ao serviço:

```text
http://127.0.0.1:4000
```

Copie apenas o token do comando de instalação para
`CLOUDFLARE_TUNNEL_TOKEN` no arquivo `.env.server`. Não coloque o token em
comandos, logs ou arquivos versionados.

Depois de iniciar a composição, verifique a conexão:

```bash
docker compose --env-file .env.server -f compose.server.yml logs tunnel
```

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

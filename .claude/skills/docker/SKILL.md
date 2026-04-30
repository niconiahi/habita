---
name: docker
description: Docker compose command conventions. Use when running docker compose commands, managing containers, or working with the development infrastructure.
---

# Docker Commands

## Docker Compose

When running `docker compose` commands, DO NOT manually target the compose file with `-f` flag.

The compose file location is configured via environment variable (`COMPOSE_FILE`), so commands should be run as:

```bash
docker compose up
docker compose down
docker compose restart otel-collector
docker compose logs telemetry-db
```

NOT:

```bash
docker compose -f infra/app/docker-compose.yml up
```

The environment variable handles the file path automatically.

## Service naming

Docker service names describe their **function**, not their technology. Examples:

- `db` not `postgres` — the database role matters, the engine is an implementation detail
- `kv` not `valkey` or `redis` — it is a key-value cache
- `object` not `minio` — it is object storage
- `broker` not `redpanda` or `kafka` — it is a message broker

This convention allows swapping implementations without renaming services across the entire stack.

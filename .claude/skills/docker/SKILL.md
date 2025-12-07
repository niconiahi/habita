# Docker Commands

## Docker Compose

When running `docker compose` commands, DO NOT manually target the compose file with `-f` flag.

The compose file location is configured via environment variable (`COMPOSE_FILE`), so commands should be run as:

```bash
docker compose up
docker compose down
docker compose restart signoz-query-service
docker compose logs signoz-frontend
```

NOT:

```bash
docker compose -f infra/development/docker-compose.yml up
```

The environment variable handles the file path automatically.

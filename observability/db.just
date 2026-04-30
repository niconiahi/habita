# Observability database recipes

root := justfile_directory()
suffix := if root == "/opt/habita" { "prod" } else { "dev" }
manifest_env := `../bin/load-manifest`

obs_compose := "docker compose -p observability " + manifest_env + " -f " + root + "/infra/observability/docker-compose.yml -f " + root + "/infra/observability/docker-compose." + suffix + ".yml"
obs_run := obs_compose + " run --rm -e OBS_POSTGRES_DB=observability observability-ui"

# Open psql shell to the observability database
shell query="":
  #!/usr/bin/env bash
  set -euo pipefail
  DB_CONTAINER=$(docker ps -qf "label=habita.role=database" | head -1)
  if [[ -z "{{query}}" ]]; then
    docker exec -it "$DB_CONTAINER" sh -c 'psql -U "$POSTGRES_USER" -d observability'
  else
    docker exec -i "$DB_CONTAINER" sh -c 'psql -U "$POSTGRES_USER" -d observability' <<'QUERY'
  {{query}}
  QUERY
  fi

# Run pending migrations
migrate:
  {{obs_run}} pnpm kysely migrate:latest

# Create a new migration file (e.g., just observability db make add_roles)
make name:
  {{obs_run}} pnpm kysely migrate:make {{name}}

# Rollback the last migration
rollback:
  docker exec -e OBS_POSTGRES_DB=observability $(docker ps -qf "label=habita.role=observability-ui" | head -1) pnpm kysely migrate:down

# Reset: drop observability database, recreate, migrate
reset:
  #!/usr/bin/env bash
  set -euo pipefail

  DB_CONTAINER=$(docker ps -qf "label=habita.role=database" | head -1)

  echo "=== Dropping observability database ==="
  docker exec "$DB_CONTAINER" sh -c 'dropdb -U "$POSTGRES_USER" observability' 2>/dev/null || true

  echo "=== Creating observability database ==="
  docker exec "$DB_CONTAINER" sh -c 'createdb -U "$POSTGRES_USER" observability'

  echo "=== Running migrations ==="
  {{obs_run}} pnpm kysely migrate:latest

  echo ""
  echo "done"

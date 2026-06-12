# Database recipes

suffix := if justfile_directory() == "/opt/habita" { "prod" } else { "dev" }
manifest_env := `bin/load-manifest`

app_compose := "docker compose -p app " + manifest_env + " -f infra/app/docker-compose.yml -f infra/app/docker-compose." + suffix + ".yml"

# Open psql shell (e.g., just db shell, just db shell "SELECT 1")
shell query="":
  #!/usr/bin/env bash
  set -euo pipefail
  DB_CONTAINER=$(docker ps -qf "label=habita.role=database" | head -1)
  if [[ -z "{{query}}" ]]; then
    docker exec -it "$DB_CONTAINER" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
  else
    docker exec -i "$DB_CONTAINER" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'QUERY'
  {{query}}
  QUERY
  fi

# Run pending migrations
migrate:
  {{app_compose}} run --rm svelte pnpm kysely migrate:latest

# Regenerate database types from current schema
types:
  {{app_compose}} run --rm svelte pnpm run db:types

# Run database seeds
seed:
  {{app_compose}} run --rm svelte pnpm run db:seed

# Create a new migration file (e.g., just db make add_users_table)
make name:
  {{app_compose}} run --rm svelte pnpm kysely migrate:make {{name}}

# Reset database: wipe storage volumes (db + kv), keep app deps, restart with fresh migrations and seeds
reset:
  #!/usr/bin/env bash
  set -euo pipefail

  APP_COMPOSE="{{app_compose}}"
  STORAGE_COMPOSE="docker compose -p storage {{manifest_env}} -f infra/storage/docker-compose.yml -f infra/storage/docker-compose.{{suffix}}.yml"
  RUN="$APP_COMPOSE run --rm -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 svelte"

  echo ""
  echo "=== Stopping app, wiping storage volumes ==="
  $APP_COMPOSE down
  $STORAGE_COMPOSE down -v

  echo ""
  echo "=== Starting storage (db + kv) ==="
  $STORAGE_COMPOSE up -d

  echo ""
  echo "=== Waiting for database to be healthy ==="
  until $STORAGE_COMPOSE exec -T db pg_isready -h 127.0.0.1 -p 5432 -U postgres > /dev/null 2>&1; do
    sleep 1
  done

  echo ""
  echo "=== Running migrations ==="
  $RUN pnpm kysely migrate:latest

  echo ""
  echo "=== Running seeds ==="
  $RUN pnpm run db:seed

  echo ""
  echo "=== Generating database types ==="
  $RUN pnpm run db:types

  echo ""
  echo "=== Starting app ==="
  $APP_COMPOSE up -d

  echo ""
  echo "done"

# Point-in-time recovery from WAL archive (e.g., just db restore '2026-04-22 15:30:00')
restore timestamp="":
  ./bin/db-restore {{timestamp}}

# Rollback the last migration
rollback:
  docker exec $(docker ps -qf "label=habita.role=app" | head -1) npx kysely migrate:down

# Create a gzipped database dump
backup:
  docker exec $(docker ps -qf "label=habita.role=database" | head -1) sh -c 'pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Verify backup integrity by restoring to test database
restore-test backup_file="":
  #!/usr/bin/env bash
  set -euo pipefail

  DB_CONTAINER=$(docker ps -qf "label=habita.role=database" | head -1)
  UPLOADER_CONTAINER=$(docker ps -qf "label=habita.role=backup-uploader" | head -1)

  # Find latest backup if not specified
  if [[ -z "{{backup_file}}" ]]; then
    BACKUP=$(docker exec "$UPLOADER_CONTAINER" \
      sh -c 'ls -t /backups/*.sql.gz.age 2>/dev/null | head -1')
    if [[ -z "$BACKUP" ]]; then
      echo "no encrypted backup found in /backups"
      exit 1
    fi
    echo "Using latest backup: $BACKUP"
  else
    BACKUP="{{backup_file}}"
  fi

  echo ""
  echo "=== Restore Test ==="
  echo "Backup: $BACKUP"

  # Create temporary test database
  TEST_DB="habita_restore_test_$(date +%s)"
  echo ""
  echo "1. Creating test database: $TEST_DB"
  docker exec "$DB_CONTAINER" createdb -U postgres "$TEST_DB"

  # Decrypt and restore
  # Flow: container cat → local age decrypt → local gunzip → container psql
  echo ""
  echo "2. Decrypting and restoring backup..."
  docker exec "$UPLOADER_CONTAINER" cat "$BACKUP" | \
    age -d -i ~/.config/sops/age/keys.txt | \
    gunzip | \
    docker exec -i "$DB_CONTAINER" psql -U postgres -d "$TEST_DB" -q

  # Run sanity checks
  echo ""
  echo "3. Running sanity checks..."
  TABLES=$(docker exec "$DB_CONTAINER" \
    psql -U postgres -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
  echo "   Tables found: $TABLES"

  # Cleanup
  echo ""
  echo "4. Cleaning up test database..."
  docker exec "$DB_CONTAINER" dropdb -U postgres "$TEST_DB"

  echo ""
  echo "done"

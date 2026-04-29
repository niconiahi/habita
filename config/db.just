# Database recipes

env := env_var_or_default("ENV", if justfile_directory() == "/opt/habita" { "production" } else { "development" })
infra := "infra/" + env
manifest_env := `bin/load-manifest`

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
  docker compose -p app {{manifest_env}} -f {{infra}}/app/docker-compose.yml run --rm svelte pnpm kysely migrate:latest

# Regenerate database types from current schema
types:
  docker compose -p app {{manifest_env}} -f {{infra}}/app/docker-compose.yml run --rm svelte pnpm run db:types

# Run database seeds
seed:
  docker compose -p app {{manifest_env}} -f {{infra}}/app/docker-compose.yml run --rm svelte pnpm run db:seed

# Create a new migration file (e.g., just db make add_users_table)
make name:
  docker compose -p app {{manifest_env}} -f {{infra}}/app/docker-compose.yml run --rm svelte pnpm kysely migrate:make {{name}}

# Reset database: tear down storage + app, remove volumes, restart fresh with migrations and seeds
# Usage: ENV=production just db reset
reset:
  #!/usr/bin/env bash
  set -euo pipefail

  echo "Environment: {{env}}"

  STORAGE_COMPOSE="docker compose -p storage {{manifest_env}} -f {{infra}}/storage/docker-compose.yml"
  APP_COMPOSE="docker compose -p app {{manifest_env}} -f {{infra}}/app/docker-compose.yml"
  RUN="$APP_COMPOSE run --rm -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 svelte"

  echo ""
  echo "=== Tearing down app and storage, removing volumes ==="
  $APP_COMPOSE down -v
  $STORAGE_COMPOSE down -v

  echo ""
  echo "=== Starting storage (db + kv) ==="
  $STORAGE_COMPOSE up -d

  echo ""
  echo "=== Installing dependencies ==="
  $RUN pnpm install --force

  echo ""
  echo "=== Waiting for database to be healthy ==="
  until $STORAGE_COMPOSE exec db pg_isready -U postgres > /dev/null 2>&1; do
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
  echo "✅ Database reset complete!"

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
      echo "❌ No encrypted backup found in /backups"
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

  # TODO(human): Add domain-specific sanity queries here
  # Example: Check that critical tables have data
  # USERS=$(docker exec "$DB_CONTAINER" psql -U postgres -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM users;")
  # echo "   Users: $USERS"

  # Cleanup
  echo ""
  echo "4. Cleaning up test database..."
  docker exec "$DB_CONTAINER" dropdb -U postgres "$TEST_DB"

  echo ""
  echo "✅ Restore test completed successfully!"

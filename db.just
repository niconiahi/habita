# Database recipes

env := env_var_or_default("ENV", "development")
infra := "infra/" + env

# Open psql shell
shell:
  docker exec -it $(docker ps -qf "label=habita.role=database" | head -1) psql -U postgres -d habita

# Reset database: tear down app, remove volumes, restart fresh with migrations and seeds
# Usage: ENV=production just db reset
reset:
  #!/usr/bin/env bash
  set -euo pipefail

  echo "Environment: {{env}}"
  echo "⚠️  This will DELETE ALL DATA (database + cache)!"
  read -p "Are you sure? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi

  APP_COMPOSE="docker compose -p app -f {{infra}}/app/docker-compose.yml"

  echo ""
  echo "=== Tearing down app and removing volumes ==="
  $APP_COMPOSE down -v

  echo ""
  echo "=== Starting fresh containers ==="
  $APP_COMPOSE up -d

  echo ""
  echo "=== Installing dependencies ==="
  $APP_COMPOSE run --rm svelte bun install

  echo ""
  echo "=== Waiting for database to be healthy ==="
  until $APP_COMPOSE exec db pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
  done

  echo ""
  echo "=== Running migrations ==="
  $APP_COMPOSE run --rm svelte bunx kysely migrate:latest

  echo ""
  echo "=== Running seeds ==="
  $APP_COMPOSE run --rm svelte bun run db:seed

  echo ""
  echo "=== Generating database types ==="
  $APP_COMPOSE run --rm svelte bun run db:types

  echo ""
  echo "✅ Database reset complete!"

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

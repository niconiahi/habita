# Habita Infrastructure Orchestration

# Default to development, override with: just --set env production
env := "development"
infra := "infra/" + env

# List available commands
default:
  @just --list

# Create shared infrastructure (one-time setup)
# Run this once on a fresh server before deploying
infra-setup:
  docker network create internal 2>/dev/null || true
  docker volume create backups 2>/dev/null || true
  @echo "✅ Created network 'internal' and volume 'backups'"

# Alias for backwards compatibility
network: infra-setup

# Start all services in correct order
up: network
  @echo "Starting app (db + valkey + svelte)..."
  docker compose -p app -f {{infra}}/app/docker-compose.yml up -d
  @echo "Waiting for db to be healthy..."
  @until docker inspect --format='{{{{.State.Health.Status}}}}' $(docker ps -qf "label=habita.role=database" | head -1) 2>/dev/null | grep -q healthy; do sleep 2; done
  @echo "Starting api..."
  docker compose -p api -f {{infra}}/api/docker-compose.yml up -d
  @echo "Starting media..."
  docker compose -p media -f {{infra}}/media/docker-compose.yml up -d
  @echo "Starting gateway..."
  docker compose -p gateway -f {{infra}}/gateway/docker-compose.yml up -d
  @echo "Starting scheduler..."
  docker compose -p scheduler -f {{infra}}/scheduler/docker-compose.yml up -d
  @echo "Starting status page..."
  docker compose -p status -f {{infra}}/status/docker-compose.yml up -d
  @echo "Done! (geo not started - run 'just geo' if needed)"

# Stop all services
down:
  -docker compose -p status -f {{infra}}/status/docker-compose.yml down
  -docker compose -p scheduler -f {{infra}}/scheduler/docker-compose.yml down
  -docker compose -p gateway -f {{infra}}/gateway/docker-compose.yml down
  -docker compose -p media -f {{infra}}/media/docker-compose.yml down
  -docker compose -p api -f {{infra}}/api/docker-compose.yml down
  -docker compose -p geo -f {{infra}}/geo/docker-compose.yml down
  -docker compose -p app -f {{infra}}/app/docker-compose.yml down

# Start geo (nominatim) - heavy, optional
geo: network
  docker compose -p geo -f {{infra}}/geo/docker-compose.yml up -d

# Stop geo
geo-down:
  docker compose -p geo -f {{infra}}/geo/docker-compose.yml down

# View logs for a project or specific service (e.g., just logs app, just logs app svelte)
logs project service="":
  #!/usr/bin/env bash
  if [[ -z "{{service}}" ]]; then
    docker compose -p {{project}} -f {{infra}}/{{project}}/docker-compose.yml logs -f
  else
    docker compose -p {{project}} -f {{infra}}/{{project}}/docker-compose.yml logs -f {{service}}
  fi

# Restart a specific service
restart service:
  docker compose -p {{service}} -f {{infra}}/{{service}}/docker-compose.yml restart

# Reload a service (recreates container to pick up new env vars)
reload service:
  docker compose -p {{service}} -f {{infra}}/{{service}}/docker-compose.yml up -d --force-recreate

# Run production build locally (for testing auth flows that need ORIGIN)
preview:
  docker compose -p app -f {{infra}}/app/docker-compose.yml run --rm -p 5174:5174 svelte sh -c "bun run build && bun run preview --host 0.0.0.0 --port 5174"

# Pull latest images (for production deploys)
pull:
  docker compose -p app -f {{infra}}/app/docker-compose.yml pull
  docker compose -p api -f {{infra}}/api/docker-compose.yml pull

# Show status of all services
status:
  @echo "=== App ===" && docker compose -p app -f {{infra}}/app/docker-compose.yml ps
  @echo "\n=== API ===" && docker compose -p api -f {{infra}}/api/docker-compose.yml ps
  @echo "\n=== Gateway ===" && docker compose -p gateway -f {{infra}}/gateway/docker-compose.yml ps
  @echo "\n=== Scheduler ===" && docker compose -p scheduler -f {{infra}}/scheduler/docker-compose.yml ps
  @echo "\n=== Media ===" && docker compose -p media -f {{infra}}/media/docker-compose.yml ps
  @echo "\n=== Status ===" && docker compose -p status -f {{infra}}/status/docker-compose.yml ps

# Database shell
db:
  docker exec -it $(docker ps -qf "label=habita.role=database" | head -1) psql -U postgres -d habita

# Refresh node_modules in the svelte container (after adding/removing packages)
deps:
  docker compose -p app -f {{infra}}/app/docker-compose.yml run --rm svelte bun install

# Reset database: tear down app, remove volumes, restart fresh with migrations and seeds
# Usage: just --set env production db-reset
db-reset:
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
  $APP_COMPOSE run --rm svelte npx kysely migrate:latest

  echo ""
  echo "=== Running seeds ==="
  $APP_COMPOSE run --rm svelte bun run db:seed

  echo ""
  echo "=== Generating database types ==="
  $APP_COMPOSE run --rm svelte bun run db:types

  echo ""
  echo "✅ Database reset complete!"

# Manual backup (saves to current directory)
backup:
  docker exec $(docker ps -qf "label=habita.role=database" | head -1) sh -c 'pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore test: verify backup integrity by restoring to test database
# Requires: age CLI installed locally, private key in ~/.config/sops/age/keys.txt
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

# Clean up unused Docker resources
prune:
  docker image prune -f
  docker volume prune -f

# Deploy specific version (production only)
deploy-tag tag:
  IMAGE_TAG={{tag}} docker compose -p app -f {{infra}}/app/docker-compose.yml pull svelte
  docker compose -p app -f {{infra}}/app/docker-compose.yml up -d svelte
  @echo "Deployed svelte with tag: {{tag}}"

# Rollback to previous commit(s) and redeploy
rollback commits="1" +services="app api":
  #!/usr/bin/env bash
  set -euo pipefail

  echo "=== Rolling back {{commits}} commit(s) ==="
  git revert --no-commit HEAD~{{commits}}..HEAD

  echo ""
  echo "=== Redeploying services: {{services}} ==="
  just --set env {{env}} deploy {{services}}

  echo ""
  echo "⚠ Rollback applied but NOT committed. Review changes with 'git diff'"
  echo "  To finalize: git commit -m 'Rollback: revert {{commits}} commits'"
  echo "  To abort: git revert --abort"

# ============================================================================
# Secrets Management (sops + age)
# ============================================================================

# Generate a new age key (one-time setup)
secrets-keygen:
  @mkdir -p ~/.config/sops/age
  @if [ -f ~/.config/sops/age/keys.txt ]; then \
    echo "Key already exists at ~/.config/sops/age/keys.txt"; \
    echo "Public key:"; \
    grep "public key:" ~/.config/sops/age/keys.txt | cut -d: -f2 | tr -d ' '; \
  else \
    age-keygen -o ~/.config/sops/age/keys.txt; \
    echo "Key generated! Add this public key to .sops.yaml:"; \
    grep "public key:" ~/.config/sops/age/keys.txt | cut -d: -f2 | tr -d ' '; \
  fi

# Encrypt .env file (run after editing plaintext .env)
secrets-encrypt:
  sops -e --input-type dotenv --output-type dotenv {{infra}}/.env > {{infra}}/.env.enc
  @echo "Encrypted: {{infra}}/.env.enc"
  @if [ -f "{{infra}}/scheduler/rclone.conf" ]; then \
    sops -e {{infra}}/scheduler/rclone.conf > {{infra}}/scheduler/rclone.conf.enc; \
    echo "Encrypted: {{infra}}/scheduler/rclone.conf.enc"; \
  fi

# Decrypt .env.enc to .env (run on server or after clone)
secrets-decrypt:
  sops -d --input-type dotenv --output-type dotenv {{infra}}/.env.enc > {{infra}}/.env
  chmod 600 {{infra}}/.env
  @echo "Decrypted: {{infra}}/.env"
  @if [ -f "{{infra}}/scheduler/rclone.conf.enc" ]; then \
    sops -d {{infra}}/scheduler/rclone.conf.enc > {{infra}}/scheduler/rclone.conf; \
    chmod 600 {{infra}}/scheduler/rclone.conf; \
    echo "Decrypted: {{infra}}/scheduler/rclone.conf"; \
  fi

# Edit encrypted secrets directly (opens in $EDITOR)
secrets-edit:
  sops --input-type dotenv --output-type dotenv {{infra}}/.env.enc

# Show current public key
secrets-pubkey:
  @grep "public key:" ~/.config/sops/age/keys.txt 2>/dev/null | cut -d: -f2 | tr -d ' ' || echo "No key found. Run: just secrets-keygen"

# ============================================================================
# CI/CD Deployment (called by GitHub Actions)
# ============================================================================

# Deploy specific services: just --set env production deploy app api scheduler
deploy +services:
  #!/usr/bin/env bash
  set -euo pipefail

  # Deploy locking - prevent concurrent deploys
  exec 200>/tmp/habita-deploy.lock
  if ! flock -n 200; then
    echo "❌ Deploy already in progress (locked by another process)"
    exit 1
  fi
  echo "🔒 Deploy lock acquired"

  # Cleanup function for notifications and lock release
  cleanup() {
    local exit_code=$?
    if [[ -n "${DEPLOY_WEBHOOK_URL:-}" ]]; then
      if [[ $exit_code -eq 0 ]]; then
        curl -s -X POST "$DEPLOY_WEBHOOK_URL" \
          -H "Content-Type: application/json" \
          -d "{\"content\": \"✅ **Deploy succeeded** on habita.rent\n\nServices: {{services}}\"}" || true
      else
        curl -s -X POST "$DEPLOY_WEBHOOK_URL" \
          -H "Content-Type: application/json" \
          -d "{\"content\": \"❌ **Deploy failed** on habita.rent\n\nServices: {{services}}\n\nCheck logs: \`just --set env {{env}} logs app\`\"}" || true
      fi
    fi
    # Lock is released automatically when the script exits
  }
  trap cleanup EXIT

  echo "=== Pulling latest code ==="
  git fetch origin main && git reset --hard origin/main

  # Docker login is handled once during server provisioning via `docker login`
  # Credentials persist in ~/.docker/config.json

  # Decrypt secrets if .env doesn't exist OR if secrets is being deployed
  if [[ ! -f "{{infra}}/.env" ]] || [[ " {{services}} " == *" secrets "* ]]; then
    echo ""
    echo "=== Decrypting secrets ==="
    just --set env {{env}} secrets-decrypt
  fi

  echo ""
  echo "=== Deploying services: {{services}} ==="

  for svc in {{services}}; do
    case $svc in
      app)
        echo "→ Deploying app (pull, migrate, restart)..."
        docker compose -p app -f {{infra}}/app/docker-compose.yml pull svelte
        docker compose -p app -f {{infra}}/app/docker-compose.yml run --rm svelte npx kysely migrate:latest
        docker compose -p app -f {{infra}}/app/docker-compose.yml up -d --force-recreate --pull always svelte
        ;;
      api)
        echo "→ Deploying api (pull, restart)..."
        docker compose -p api -f {{infra}}/api/docker-compose.yml pull go
        docker compose -p api -f {{infra}}/api/docker-compose.yml up -d --force-recreate --pull always go
        ;;
      scheduler)
        echo "→ Deploying scheduler..."
        docker compose -p scheduler -f {{infra}}/scheduler/docker-compose.yml up -d --force-recreate --pull always
        ;;
      gateway)
        echo "→ Deploying gateway..."
        docker compose -p gateway -f {{infra}}/gateway/docker-compose.yml up -d --force-recreate --pull always
        ;;
      media)
        echo "→ Deploying media..."
        docker compose -p media -f {{infra}}/media/docker-compose.yml up -d --force-recreate --pull always
        ;;
      status)
        echo "→ Deploying status..."
        docker compose -p status -f {{infra}}/status/docker-compose.yml up -d --force-recreate --pull always
        ;;
      secrets)
        # Already handled above, just restart services that use .env
        echo "→ Restarting services that use .env..."
        docker compose -p app -f {{infra}}/app/docker-compose.yml up -d --pull always svelte
        docker compose -p api -f {{infra}}/api/docker-compose.yml up -d --pull always go
        docker compose -p media -f {{infra}}/media/docker-compose.yml up -d --pull always
        ;;
      *)
        echo "⚠ Unknown service: $svc"
        ;;
    esac
  done

  echo ""
  echo "=== Verifying health checks ==="
  sleep 10
  unhealthy=$(docker ps --filter "health=unhealthy" --format "{{{{.Names}}}}" 2>/dev/null || true)
  if [[ -n "$unhealthy" ]]; then
    echo "❌ UNHEALTHY containers detected: $unhealthy"
    exit 1
  fi
  echo "✅ All containers healthy"

  echo ""
  echo "=== Deploy complete ==="
  just --set env {{env}} status

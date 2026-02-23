# Habita Infrastructure Orchestration

# Auto-detects production on VPS (/opt/habita), override with: ENV=production just <command>
env := env_var_or_default("ENV", if justfile_directory() == "/opt/habita" { "production" } else { "development" })
infra := "infra/" + env

# versions.env: pass --env-file to compose when deploying in production
versions_env := if path_exists(infra + "/versions.env") == "true" { "--env-file " + infra + "/versions.env" } else { "" }

mod db
mod lint
mod test
mod secrets
mod deploy

# List available commands
default:
  @just --list

# ============================================================================
# Docker Infrastructure
# ============================================================================

# Create shared infrastructure (one-time setup)
infra-setup:
  docker network create internal 2>/dev/null || true
  docker volume create backups 2>/dev/null || true
  @echo "✅ Created network 'internal' and volume 'backups'"

# Start all services in correct order
up: infra-setup
  @echo "Starting app (db + valkey + svelte)..."
  docker compose -p app {{versions_env}} -f {{infra}}/app/docker-compose.yml up -d
  @echo "Waiting for db to be healthy..."
  @until docker inspect --format='{{{{.State.Health.Status}}}}' $(docker ps -qf "label=habita.role=database" | head -1) 2>/dev/null | grep -q healthy; do sleep 2; done
  @echo "Starting api..."
  docker compose -p api {{versions_env}} -f {{infra}}/api/docker-compose.yml up -d
  @echo "Starting media..."
  docker compose -p media -f {{infra}}/media/docker-compose.yml up -d
  @echo "Starting gateway..."
  docker compose -p gateway -f {{infra}}/gateway/docker-compose.yml up -d
  @echo "Starting scheduler..."
  docker compose -p scheduler -f {{infra}}/scheduler/docker-compose.yml up -d
  @echo "Starting pdf service..."
  docker compose -p pdf -f {{infra}}/pdf/docker-compose.yml up -d
  @echo "Starting status page..."
  docker compose -p status -f {{infra}}/status/docker-compose.yml up -d
  @echo "Starting geo (nominatim)..."
  docker compose -p geo -f {{infra}}/geo/docker-compose.yml up -d
  @echo "Done!"

# Stop all services
down:
  -docker compose -p status -f {{infra}}/status/docker-compose.yml down
  -docker compose -p pdf -f {{infra}}/pdf/docker-compose.yml down
  -docker compose -p scheduler -f {{infra}}/scheduler/docker-compose.yml down
  -docker compose -p gateway -f {{infra}}/gateway/docker-compose.yml down
  -docker compose -p media -f {{infra}}/media/docker-compose.yml down
  -docker compose -p api {{versions_env}} -f {{infra}}/api/docker-compose.yml down
  -docker compose -p geo -f {{infra}}/geo/docker-compose.yml down
  -docker compose -p app {{versions_env}} -f {{infra}}/app/docker-compose.yml down

# Start geo (nominatim) - heavy, optional
geo: infra-setup
  docker compose -p geo {{versions_env}} -f {{infra}}/geo/docker-compose.yml up -d

# Stop geo
geo-down:
  docker compose -p geo {{versions_env}} -f {{infra}}/geo/docker-compose.yml down

# View logs for a project or specific service (e.g., just logs app, just logs app svelte)
logs project service="":
  #!/usr/bin/env bash
  if [[ -z "{{service}}" ]]; then
    docker compose -p {{project}} {{versions_env}} -f {{infra}}/{{project}}/docker-compose.yml logs -f
  else
    docker compose -p {{project}} {{versions_env}} -f {{infra}}/{{project}}/docker-compose.yml logs -f {{service}}
  fi

# Restart a specific service
restart service:
  docker compose -p {{service}} {{versions_env}} -f {{infra}}/{{service}}/docker-compose.yml restart

# Reload a service (recreates container to pick up new env vars)
reload service:
  docker compose -p {{service}} {{versions_env}} -f {{infra}}/{{service}}/docker-compose.yml up -d --force-recreate

# Run production build locally (for testing auth flows that need ORIGIN)
preview:
  docker compose -p app {{versions_env}} -f {{infra}}/app/docker-compose.yml run --rm -p 5174:5174 svelte sh -c "pnpm run build && pnpm run preview --host 0.0.0.0 --port 5174"

# Show status of all services
status:
  @echo "=== App ===" && docker compose -p app {{versions_env}} -f {{infra}}/app/docker-compose.yml ps
  @echo "\n=== API ===" && docker compose -p api {{versions_env}} -f {{infra}}/api/docker-compose.yml ps
  @echo "\n=== Gateway ===" && docker compose -p gateway -f {{infra}}/gateway/docker-compose.yml ps
  @echo "\n=== Scheduler ===" && docker compose -p scheduler -f {{infra}}/scheduler/docker-compose.yml ps
  @echo "\n=== PDF ===" && docker compose -p pdf -f {{infra}}/pdf/docker-compose.yml ps
  @echo "\n=== Media ===" && docker compose -p media -f {{infra}}/media/docker-compose.yml ps
  @echo "\n=== Status ===" && docker compose -p status -f {{infra}}/status/docker-compose.yml ps

# Refresh node_modules in the svelte container (after adding/removing packages)
deps:
  docker compose -p app {{versions_env}} -f {{infra}}/app/docker-compose.yml run --rm svelte pnpm install

# Rebuild a service image (after Dockerfile changes)
rebuild project service="":
  #!/usr/bin/env bash
  if [[ -z "{{service}}" ]]; then
    docker compose -p {{project}} {{versions_env}} -f {{infra}}/{{project}}/docker-compose.yml build --no-cache
  else
    docker compose -p {{project}} {{versions_env}} -f {{infra}}/{{project}}/docker-compose.yml build --no-cache {{service}}
  fi

# Clean up unused Docker resources
prune:
  docker image prune -f
  docker volume prune -f

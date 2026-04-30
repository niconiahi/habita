# CI/CD Deployment (called by GitHub Actions)

suffix := if justfile_directory() == "/opt/habita" { "prod" } else { "dev" }
manifest_env := `bin/load-manifest`

# Deploy specific services: just deploy push app api scheduler
push +services:
  #!/usr/bin/env bash
  set -euo pipefail

  compose_for() {
    local stack="$1"
    echo "docker compose -p $stack {{manifest_env}} -f infra/$stack/docker-compose.yml -f infra/$stack/docker-compose.{{suffix}}.yml"
  }

  # Deploy locking - prevent concurrent deploys
  exec 200>/tmp/habita-deploy.lock
  if ! flock -n 200; then
    echo "deploy already in progress (locked by another process)"
    exit 1
  fi
  echo "deploy lock acquired"

  # Cleanup function for notifications and lock release
  cleanup() {
    local exit_code=$?
    if [[ -n "${DEPLOY_WEBHOOK_URL:-}" ]]; then
      if [[ $exit_code -eq 0 ]]; then
        curl -s -X POST "$DEPLOY_WEBHOOK_URL" \
          -H "Content-Type: application/json" \
          -d "{\"content\": \"deploy succeeded on habita.rent\n\nServices: {{services}}\"}" || true
      else
        curl -s -X POST "$DEPLOY_WEBHOOK_URL" \
          -H "Content-Type: application/json" \
          -d "{\"content\": \"deploy failed on habita.rent\n\nServices: {{services}}\n\nCheck logs: just logs app\"}" || true
      fi
    fi
  }
  trap cleanup EXIT

  echo "=== Pulling latest code ==="
  git fetch origin main && git reset --hard origin/main

  # Decrypt secrets only if .env doesn't exist (first deploy)
  if [[ ! -f "infra/.env.{{suffix}}" ]]; then
    echo ""
    echo "=== Decrypting secrets (first deploy) ==="
    just secrets decrypt
  fi

  echo ""
  echo "=== Deploying services: {{services}} ==="

  for svc in {{services}}; do
    APP=$(compose_for app)
    case $svc in
      app)
        echo "deploying app (pull, migrate, restart)..."
        $APP pull svelte
        $APP run --rm svelte npx kysely migrate:latest
        $APP up -d --force-recreate --pull always svelte
        ;;
      consumer)
        echo "deploying consumers (email, subscription, escalation)..."
        $(compose_for consumer) up -d --force-recreate --pull always
        ;;
      api)
        echo "deploying api (pull, restart)..."
        $(compose_for api) pull go
        $(compose_for api) up -d --force-recreate --pull always go
        ;;
      scheduler)
        echo "deploying scheduler..."
        $(compose_for scheduler) up -d --force-recreate --pull always
        ;;
      gateway)
        echo "deploying gateway..."
        $(compose_for gateway) up -d --force-recreate --pull always
        ;;
      media)
        echo "deploying media..."
        $(compose_for media) up -d --force-recreate --pull always
        ;;
      pdf)
        echo "deploying pdf (build + restart)..."
        $(compose_for pdf) up -d --force-recreate --build
        ;;
      status)
        echo "deploying status..."
        $(compose_for status) up -d --force-recreate --pull always
        ;;
      geo)
        echo "deploying geo..."
        $(compose_for geo) up -d --force-recreate --pull always
        ;;
      secrets)
        echo "secrets decrypted. restart services manually if needed"
        ;;
      *)
        echo "unknown service: $svc"
        ;;
    esac
  done

  echo ""
  echo "=== Verifying health checks ==="
  sleep 10
  unhealthy=$(docker ps --filter "health=unhealthy" --format "{{{{.Names}}}}" 2>/dev/null || true)
  if [[ -n "$unhealthy" ]]; then
    echo "unhealthy containers detected: $unhealthy"
    exit 1
  fi
  echo "all containers healthy"

  echo ""
  echo "=== Deploy complete ==="
  just ps

# Pull latest images (for production deploys)
pull:
  docker compose -p app {{manifest_env}} -f infra/app/docker-compose.yml -f infra/app/docker-compose.{{suffix}}.yml pull
  docker compose -p api {{manifest_env}} -f infra/api/docker-compose.yml -f infra/api/docker-compose.{{suffix}}.yml pull
  docker compose -p consumer {{manifest_env}} -f infra/consumer/docker-compose.yml -f infra/consumer/docker-compose.{{suffix}}.yml pull

# Deploy specific svelte image (production only)
image-svelte image:
  SVELTE_IMAGE={{image}} docker compose -p app -f infra/app/docker-compose.yml -f infra/app/docker-compose.{{suffix}}.yml pull svelte
  SVELTE_IMAGE={{image}} docker compose -p app -f infra/app/docker-compose.yml -f infra/app/docker-compose.{{suffix}}.yml up -d svelte
  @echo "Deployed svelte: {{image}}"

# Deploy specific broker image (production only)
image-broker image:
  BROKER_IMAGE={{image}} docker compose -p consumer -f infra/consumer/docker-compose.yml -f infra/consumer/docker-compose.{{suffix}}.yml pull
  BROKER_IMAGE={{image}} docker compose -p consumer -f infra/consumer/docker-compose.yml -f infra/consumer/docker-compose.{{suffix}}.yml up -d
  @echo "Deployed broker: {{image}}"

# Deploy specific go image (production only)
image-go image:
  GO_IMAGE={{image}} docker compose -p api -f infra/api/docker-compose.yml -f infra/api/docker-compose.{{suffix}}.yml pull go
  GO_IMAGE={{image}} docker compose -p api -f infra/api/docker-compose.yml -f infra/api/docker-compose.{{suffix}}.yml up -d go
  @echo "Deployed go: {{image}}"

# Rollback to previous commit(s) and redeploy
rollback commits="1" +services="app api":
  #!/usr/bin/env bash
  set -euo pipefail

  echo "=== Rolling back {{commits}} commit(s) ==="
  git revert --no-commit HEAD~{{commits}}..HEAD

  echo ""
  echo "=== Redeploying services: {{services}} ==="
  just deploy push {{services}}

  echo ""
  echo "rollback applied but NOT committed. review changes with 'git diff'"
  echo "  to finalize: git commit -m 'rollback: revert {{commits}} commits'"
  echo "  to abort: git revert --abort"

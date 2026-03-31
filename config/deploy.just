# CI/CD Deployment (called by GitHub Actions)

env := env_var_or_default("ENV", if justfile_directory() == "/opt/habita" { "production" } else { "development" })
infra := "infra/" + env

versions_env := if path_exists(infra + "/versions.env") == "true" { "--env-file " + infra + "/versions.env" } else { "" }

# Deploy specific services: ENV=production just deploy push app api scheduler
push +services:
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
          -d "{\"content\": \"❌ **Deploy failed** on habita.rent\n\nServices: {{services}}\n\nCheck logs: \`just logs app\`\"}" || true
      fi
    fi
    # Lock is released automatically when the script exits
  }
  trap cleanup EXIT

  echo "=== Pulling latest code ==="
  git fetch origin main && git reset --hard origin/main

  # Docker login is handled once during server provisioning via `docker login`
  # Credentials persist in ~/.docker/config.json

  # Decrypt secrets only if .env doesn't exist (first deploy)
  # For secret updates, manually run: ENV=production just secrets decrypt
  if [[ ! -f "{{infra}}/.env" ]]; then
    echo ""
    echo "=== Decrypting secrets (first deploy) ==="
    ENV={{env}} just secrets decrypt
  fi

  echo ""
  echo "=== Deploying services: {{services}} ==="

  for svc in {{services}}; do
    case $svc in
      app)
        echo "→ Deploying app (pull, migrate, restart)..."
        docker compose -p app {{versions_env}} -f {{infra}}/app/docker-compose.yml pull svelte
        docker compose -p app {{versions_env}} -f {{infra}}/app/docker-compose.yml run --rm svelte npx kysely migrate:latest
        docker compose -p app {{versions_env}} -f {{infra}}/app/docker-compose.yml up -d --force-recreate --pull always svelte
        ;;
      consumer)
        echo "→ Deploying consumers (email, subscription, escalation)..."
        docker compose -p consumer {{versions_env}} -f {{infra}}/consumer/docker-compose.yml up -d --force-recreate --pull always
        ;;
      api)
        echo "→ Deploying api (pull, restart)..."
        docker compose -p api {{versions_env}} -f {{infra}}/api/docker-compose.yml pull go
        docker compose -p api {{versions_env}} -f {{infra}}/api/docker-compose.yml up -d --force-recreate --pull always go
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
      pdf)
        echo "→ Deploying pdf (build + restart)..."
        docker compose -p pdf -f {{infra}}/pdf/docker-compose.yml up -d --force-recreate --build
        ;;
      status)
        echo "→ Deploying status..."
        docker compose -p status -f {{infra}}/status/docker-compose.yml up -d --force-recreate --pull always
        ;;
      geo)
        echo "→ Deploying geo..."
        docker compose -p geo -f {{infra}}/geo/docker-compose.yml up -d --force-recreate --pull always
        ;;
      secrets)
        echo "→ Secrets decrypted. Restart services manually if needed:"
        echo "  docker compose -p app restart svelte"
        echo "  docker compose -p api restart go"
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
  ENV={{env}} just status

# Pull latest images (for production deploys)
pull:
  docker compose -p app {{versions_env}} -f {{infra}}/app/docker-compose.yml pull
  docker compose -p api {{versions_env}} -f {{infra}}/api/docker-compose.yml pull

# Deploy specific svelte version (production only)
tag-svelte tag:
  SVELTE_TAG={{tag}} docker compose -p app -f {{infra}}/app/docker-compose.yml pull svelte
  SVELTE_TAG={{tag}} docker compose -p app -f {{infra}}/app/docker-compose.yml up -d svelte
  @echo "Deployed svelte with tag: {{tag}}"

# Deploy specific go version (production only)
tag-go tag:
  GO_TAG={{tag}} docker compose -p api -f {{infra}}/api/docker-compose.yml pull go
  GO_TAG={{tag}} docker compose -p api -f {{infra}}/api/docker-compose.yml up -d go
  @echo "Deployed go with tag: {{tag}}"

# Rollback to previous commit(s) and redeploy
rollback commits="1" +services="app api":
  #!/usr/bin/env bash
  set -euo pipefail

  echo "=== Rolling back {{commits}} commit(s) ==="
  git revert --no-commit HEAD~{{commits}}..HEAD

  echo ""
  echo "=== Redeploying services: {{services}} ==="
  ENV={{env}} just deploy push {{services}}

  echo ""
  echo "⚠ Rollback applied but NOT committed. Review changes with 'git diff'"
  echo "  To finalize: git commit -m 'Rollback: revert {{commits}} commits'"
  echo "  To abort: git revert --abort"

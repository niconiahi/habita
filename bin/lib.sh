#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "$REPO_ROOT" == "/opt/habita"* ]]; then
  ENV=production
else
  ENV=development
fi

if [[ "$ENV" == "production" ]]; then
  ENV_SUFFIX="prod"
else
  ENV_SUFFIX="dev"
fi

INFRA="$REPO_ROOT/infra"
ENV_FILE="$INFRA/.env.$ENV_SUFFIX"
MANIFEST_ENV=$("$REPO_ROOT/bin/load-manifest")

# Compose command for a stack: compose <stack> <args...>
# Merges base + env override automatically
compose() {
  local stack="$1"
  shift
  # shellcheck disable=SC2086
  docker compose \
    -p "$stack" \
    -f "$INFRA/$stack/docker-compose.yml" \
    -f "$INFRA/$stack/docker-compose.$ENV_SUFFIX.yml" \
    $MANIFEST_ENV \
    "$@"
}

# All stacks in dependency order
STACKS_UP="storage observability app consumer api media gateway scheduler broker pdf status geo autoheal"
STACKS_DOWN="autoheal geo status pdf broker scheduler gateway media api consumer app observability storage"

# Wait for a container to be healthy by label
wait_healthy() {
  local label="$1"
  local timeout="${2:-60}"
  local elapsed=0
  while [[ $elapsed -lt $timeout ]]; do
    local cid
    cid=$(docker ps -qf "label=habita.role=$label" | head -1)
    if [[ -n "$cid" ]] && docker inspect --format='{{.State.Health.Status}}' "$cid" 2>/dev/null | grep -q healthy; then
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  return 1
}

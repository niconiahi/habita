# Habita Infrastructure Orchestration

# Default to development, override with: just --set env production
env := "development"
infra := "infra/" + env

# List available commands
default:
  @just --list

# Create the internal network (one-time setup)
network:
  docker network create internal 2>/dev/null || true

# Start all services in correct order
up: network
  @echo "Starting app (db + valkey + svelte)..."
  docker compose -p app -f {{infra}}/app/docker-compose.yml up -d
  @echo "Waiting for db to be healthy..."
  @until docker inspect --format='{{{{.State.Health.Status}}}}' app-db-1 2>/dev/null | grep -q healthy; do sleep 2; done
  @echo "Starting api..."
  docker compose -p api -f {{infra}}/api/docker-compose.yml up -d
  @echo "Starting media..."
  docker compose -p media -f {{infra}}/media/docker-compose.yml up -d
  @echo "Starting gateway..."
  docker compose -p gateway -f {{infra}}/gateway/docker-compose.yml up -d
  @echo "Starting scheduler..."
  docker compose -p scheduler -f {{infra}}/scheduler/docker-compose.yml up -d
  @echo "Done! (geo not started - run 'just geo' if needed)"

# Stop all services
down:
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

# View logs for a service (e.g., just logs app)
logs service:
  docker compose -p {{service}} -f {{infra}}/{{service}}/docker-compose.yml logs -f

# Restart a specific service
restart service:
  docker compose -p {{service}} -f {{infra}}/{{service}}/docker-compose.yml restart

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

# Database shell
db:
  docker exec -it app-db-1 psql -U postgres -d habita

# Manual backup (saves to current directory)
backup:
  docker exec app-db-1 sh -c 'pg_dump -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Clean up unused Docker resources
prune:
  docker image prune -f
  docker volume prune -f

# Deploy specific version (production only)
deploy tag:
  IMAGE_TAG={{tag}} docker compose -p app -f {{infra}}/app/docker-compose.yml pull svelte
  docker compose -p app -f {{infra}}/app/docker-compose.yml up -d svelte
  @echo "Deployed svelte with tag: {{tag}}"

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

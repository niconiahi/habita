# Secrets management (sops + age)

env := env_var_or_default("ENV", "development")
infra := "infra/" + env

# Generate a new age key (one-time setup)
keygen:
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

# Encrypt .env to .env.enc
encrypt:
  sops -e --input-type dotenv --output-type dotenv {{infra}}/.env > {{infra}}/.env.enc
  @echo "Encrypted: {{infra}}/.env.enc"
  @if [ -f "{{infra}}/scheduler/rclone.conf" ]; then \
    sops -e {{infra}}/scheduler/rclone.conf > {{infra}}/scheduler/rclone.conf.enc; \
    echo "Encrypted: {{infra}}/scheduler/rclone.conf.enc"; \
  fi

# Decrypt .env.enc to .env
decrypt:
  sops -d --input-type dotenv --output-type dotenv {{infra}}/.env.enc > {{infra}}/.env
  chmod 600 {{infra}}/.env
  @echo "Decrypted: {{infra}}/.env"
  @if [ -f "{{infra}}/scheduler/rclone.conf.enc" ]; then \
    sops -d {{infra}}/scheduler/rclone.conf.enc > {{infra}}/scheduler/rclone.conf; \
    chmod 600 {{infra}}/scheduler/rclone.conf; \
    echo "Decrypted: {{infra}}/scheduler/rclone.conf"; \
  fi

# Edit encrypted secrets in $EDITOR
edit:
  #!/usr/bin/env bash
  sops --input-type dotenv --output-type dotenv {{infra}}/.env.enc
  exit_code=$?
  if [[ $exit_code -eq 200 ]]; then
    echo "No changes made."
    exit 0
  fi
  exit $exit_code

# Decrypt secrets AND restart affected services
apply:
  #!/usr/bin/env bash
  set -euo pipefail

  ENV={{env}} just secrets decrypt

  echo ""
  echo "=== Restarting services to pick up new secrets ==="
  docker compose -p app -f {{infra}}/app/docker-compose.yml restart svelte
  docker compose -p api -f {{infra}}/api/docker-compose.yml restart go

  echo ""
  echo "✅ Secrets applied and services restarted"

# Show current age public key
pubkey:
  @grep "public key:" ~/.config/sops/age/keys.txt 2>/dev/null | cut -d: -f2 | tr -d ' ' || echo "No key found. Run: just secrets keygen"

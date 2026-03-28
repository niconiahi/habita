# Secrets management (sops + age)

env := env_var_or_default("ENV", if justfile_directory() == "/opt/habita" { "production" } else { "development" })
infra := "infra/" + env
versions_env := if path_exists(infra + "/versions.env") == "true" { "--env-file " + infra + "/versions.env" } else { "" }

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

# Encrypt .env to .env.enc (e.g., just secrets encrypt production)
encrypt target=env:
  sops -e --input-type dotenv --output-type dotenv infra/{{target}}/.env > infra/{{target}}/.env.enc
  @echo "Encrypted: infra/{{target}}/.env.enc"
  @if [ -f "infra/{{target}}/scheduler/rclone.conf" ]; then \
    sops -e infra/{{target}}/scheduler/rclone.conf > infra/{{target}}/scheduler/rclone.conf.enc; \
    echo "Encrypted: infra/{{target}}/scheduler/rclone.conf.enc"; \
  fi

# Decrypt .env.enc to .env (e.g., just secrets decrypt production)
decrypt target=env:
  sops -d --input-type dotenv --output-type dotenv infra/{{target}}/.env.enc > infra/{{target}}/.env
  chmod 600 infra/{{target}}/.env
  @echo "Decrypted: infra/{{target}}/.env"
  @if [ -f "infra/{{target}}/scheduler/rclone.conf.enc" ]; then \
    sops -d infra/{{target}}/scheduler/rclone.conf.enc > infra/{{target}}/scheduler/rclone.conf; \
    chmod 600 infra/{{target}}/scheduler/rclone.conf; \
    echo "Decrypted: infra/{{target}}/scheduler/rclone.conf"; \
  fi

# Edit encrypted secrets in $EDITOR (e.g., just secrets edit production)
edit target=env:
  #!/usr/bin/env bash
  sops --input-type dotenv --output-type dotenv infra/{{target}}/.env.enc
  exit_code=$?
  if [[ $exit_code -eq 200 ]]; then
    echo "No changes made."
    exit 0
  fi
  exit $exit_code

# Decrypt secrets AND recreate affected services to pick up new env vars
apply:
  #!/usr/bin/env bash
  set -euo pipefail

  ENV={{env}} just secrets decrypt

  echo ""
  echo "=== Recreating services to pick up new secrets ==="
  docker compose -p app {{versions_env}} -f {{infra}}/app/docker-compose.yml up -d --force-recreate svelte
  docker compose -p api {{versions_env}} -f {{infra}}/api/docker-compose.yml up -d --force-recreate go

  echo ""
  echo "✅ Secrets applied and services recreated"

# Show current age public key
pubkey:
  @grep "public key:" ~/.config/sops/age/keys.txt 2>/dev/null | cut -d: -f2 | tr -d ' ' || echo "No key found. Run: just secrets keygen"

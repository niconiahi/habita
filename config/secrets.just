# Secrets management (sops + age)

suffix := if justfile_directory() == "/opt/habita" { "prod" } else { "dev" }
manifest_env := `bin/load-manifest`

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

# Encrypt .env to .env.enc (e.g., just secrets encrypt, just secrets encrypt prod)
encrypt target=suffix:
  sops -e --input-type dotenv --output-type dotenv infra/.env.{{target}} > infra/.env.{{target}}.enc
  @echo "Encrypted: infra/.env.{{target}}.enc"

# Decrypt .env.enc to .env (e.g., just secrets decrypt, just secrets decrypt prod)
decrypt target=suffix:
  sops -d --input-type dotenv --output-type dotenv infra/.env.{{target}}.enc > infra/.env.{{target}}
  chmod 600 infra/.env.{{target}}
  @echo "Decrypted: infra/.env.{{target}}"

# Decrypt secrets AND recreate affected services to pick up new env vars
apply:
  #!/usr/bin/env bash
  set -euo pipefail

  just secrets decrypt

  echo ""
  echo "=== Recreating services to pick up new secrets ==="
  docker compose -p app {{manifest_env}} -f infra/app/docker-compose.yml -f infra/app/docker-compose.{{suffix}}.yml up -d --force-recreate svelte
  docker compose -p api {{manifest_env}} -f infra/api/docker-compose.yml -f infra/api/docker-compose.{{suffix}}.yml up -d --force-recreate go

  echo ""
  echo "done"

# Show current age public key
pubkey:
  @grep "public key:" ~/.config/sops/age/keys.txt 2>/dev/null | cut -d: -f2 | tr -d ' ' || echo "No key found. Run: just secrets keygen"

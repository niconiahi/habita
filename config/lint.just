# Lint recipes

env := env_var_or_default("ENV", if justfile_directory() == "/opt/habita" { "production" } else { "development" })
infra := "infra/" + env

# Run prettier formatting
format:
  docker compose -p app -f {{infra}}/app/docker-compose.yml run --rm svelte pnpm run lint:format

# Run TypeScript type checking
types:
  docker compose -p app -f {{infra}}/app/docker-compose.yml run --rm svelte pnpm run lint:types

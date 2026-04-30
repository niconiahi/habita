# Lint recipes

suffix := if justfile_directory() == "/opt/habita" { "prod" } else { "dev" }

# Run prettier formatting
format:
  docker compose -p app -f infra/app/docker-compose.yml -f infra/app/docker-compose.{{suffix}}.yml run --rm svelte pnpm run lint:format

# Run TypeScript type checking
types:
  docker compose -p app -f infra/app/docker-compose.yml -f infra/app/docker-compose.{{suffix}}.yml run --rm svelte pnpm run lint:types

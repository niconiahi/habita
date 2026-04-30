# Observability lint recipes

root := justfile_directory()
suffix := if root == "/opt/habita" { "prod" } else { "dev" }
manifest_env := `../bin/load-manifest`

obs_compose := "docker compose -p observability " + manifest_env + " -f " + root + "/infra/observability/docker-compose.yml -f " + root + "/infra/observability/docker-compose." + suffix + ".yml"
obs_run := obs_compose + " run --rm observability-ui"

# Run prettier formatting
format:
  {{obs_run}} pnpm run lint:format

# Run TypeScript type checking
types:
  {{obs_run}} pnpm run lint:types

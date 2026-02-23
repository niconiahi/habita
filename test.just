# Test recipes

env := env_var_or_default("ENV", if justfile_directory() == "/opt/habita" { "production" } else { "development" })
infra := "infra/" + env

# Run E2E tests with Playwright (dedicated test container)
e2e *args:
  docker compose -p app -f {{infra}}/app/docker-compose.yml run --rm -e DOCKER_TEST=1 test npx playwright test {{args}}

# Run E2E tests visually one by one (headed mode, runs locally not in Docker)
e2e-visual *args:
  cd apps/web && POSTGRES_HOST=localhost npx playwright test --headed {{args}}

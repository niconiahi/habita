# Test recipes

suffix := if justfile_directory() == "/opt/habita" { "prod" } else { "dev" }

# Run E2E tests with Playwright (dedicated test container)
e2e *args:
  docker compose -p app -f infra/app/docker-compose.yml -f infra/app/docker-compose.{{suffix}}.yml run --rm -e DOCKER_TEST=1 test npx playwright test {{args}}

# Run E2E tests visually one by one (headed mode, runs locally not in Docker)
e2e-visual *args:
  cd apps/web && POSTGRES_HOST=localhost npx playwright test --headed {{args}}

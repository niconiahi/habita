.PHONY: help dev-up dev-down dev-restart dev-logs dev-logs-app dev-logs-db dev-logs-go dev-build dev-clean dev-db-migrate dev-db-seed dev-db-types dev-db-create-migration dev-db-shell dev-db-drop

help:
	@echo "Habita Development Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo ""
	@echo "Environment:"
	@echo "  dev-up                    Start development environment"
	@echo "  dev-down                  Stop development environment"
	@echo "  dev-restart               Restart development environment"
	@echo "  dev-build                 Rebuild development services"
	@echo "  dev-clean                 Stop and remove all containers, networks, and volumes"
	@echo ""
	@echo "Logs:"
	@echo "  dev-logs                  View logs from all services"
	@echo "  dev-logs-app              View logs from app service"
	@echo "  dev-logs-db               View logs from database"
	@echo "  dev-logs-go               View logs from Go service"
	@echo "  dev-logs-go               View logs from image service"
	@echo ""
	@echo "Database:"
	@echo "  dev-db-migrate            Run database migrations"
	@echo "  dev-db-seed               Seed database with initial data"
	@echo "  dev-db-types              Generate TypeScript types from database schema"
	@echo "  dev-db-create-migration   Create new migration (usage: make dev-db-create-migration add_route)"
	@echo "  dev-db-shell              Open PostgreSQL shell"
	@echo "  dev-db-drop               Drop database volume (WARNING: destroys all data)"
	@echo ""
	@echo "Cron jobs:"
	@echo "  dev-add-escalation-job    Executes the script that gathers all due escalations and store the job"
	@echo "  dev-db-migrate            Runs all jobs"

dev-up:
	docker compose -f infra/development/docker-compose.yml up -d

dev-down:
	docker compose -f infra/development/docker-compose.yml down

dev-restart:
	docker compose -f infra/development/docker-compose.yml restart

dev-logs:
	docker compose -f infra/development/docker-compose.yml logs -f

dev-logs-app:
	docker compose -f infra/development/docker-compose.yml logs -f app

dev-logs-db:
	docker compose -f infra/development/docker-compose.yml logs -f db

dev-logs-go:
	docker compose -f infra/development/docker-compose.yml logs -f go

dev-logs-image:
	docker compose -f infra/development/docker-compose.yml logs -f image

dev-logs-ofelia:
	docker compose -f infra/development/docker-compose.yml logs -f ofelia

dev-build:
	docker compose -f infra/development/docker-compose.yml build

dev-clean:
	docker compose -f infra/development/docker-compose.yml down --volumes --remove-orphans

# Database commands
dev-db-migrate:
	docker compose -f infra/development/docker-compose.yml exec app bun run db:migrate

dev-db-seed:
	docker compose -f infra/development/docker-compose.yml exec app bun run db:seed

dev-db-types:
	docker compose -f infra/development/docker-compose.yml exec app bun run db:types

dev-db-create-migration:
	@if [ -z "$(filter-out $@,$(MAKECMDGOALS))" ]; then \
		echo "Error: migration name required. Usage: make dev-db-create-migration add_route"; \
		exit 1; \
	fi
	docker compose -f infra/development/docker-compose.yml exec app bun kysely migrate:make $(filter-out $@,$(MAKECMDGOALS))

%:
	@:

dev-db-shell:
	docker compose -f infra/development/docker-compose.yml exec db psql -U $(shell grep POSTGRES_USER .env | cut -d '=' -f2) -d $(shell grep POSTGRES_DB .env | cut -d '=' -f2)

dev-db-drop:
	@echo "WARNING: This will destroy all database data!"
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read confirm
	docker compose -f infra/development/docker-compose.yml down
	docker volume rm development_memudo_app_data

# Cron jobs
dev-add-escalation-job:
	docker compose -f infra/development/docker-compose.yml exec app bun run /app/app/lib/server/cron/create_escalation_jobs.script.ts

dev-run-jobs:
	docker compose -f infra/development/docker-compose.yml exec app bun run /app/app/lib/server/cron/process_jobs.script.ts


.PHONY: help dev-up dev-down dev-restart dev-logs dev-logs-app dev-logs-db dev-logs-go dev-build dev-clean dev-db-migrate dev-db-seed dev-db-types dev-db-create-migration dev-db-shell dev-db-drop prod-up prod-down prod-restart prod-logs prod-logs-app prod-logs-db prod-logs-go prod-logs-caddy prod-logs-nominatim prod-logs-ofelia prod-build prod-status prod-db-migrate prod-db-shell

help:
	@echo "Habita Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "=== DEVELOPMENT ==="
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
	@echo "  dev-logs-image            View logs from image service"
	@echo "  dev-logs-ofelia           View logs from ofelia (cron)"
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
	@echo "  dev-run-jobs              Runs all jobs"
	@echo ""
	@echo "=== PRODUCTION ==="
	@echo ""
	@echo "Environment:"
	@echo "  prod-up                   Start production environment"
	@echo "  prod-down                 Stop production environment"
	@echo "  prod-restart              Restart production environment"
	@echo "  prod-build                Rebuild production services"
	@echo "  prod-status               Check status of all production containers"
	@echo ""
	@echo "Logs:"
	@echo "  prod-logs                 View logs from all services"
	@echo "  prod-logs-app             View logs from app service"
	@echo "  prod-logs-db              View logs from database"
	@echo "  prod-logs-go              View logs from Go service"
	@echo "  prod-logs-caddy           View logs from Caddy (reverse proxy)"
	@echo "  prod-logs-nominatim       View logs from Nominatim (geocoding)"
	@echo "  prod-logs-ofelia          View logs from Ofelia (cron)"
	@echo ""
	@echo "Database:"
	@echo "  prod-db-migrate           Run database migrations"
	@echo "  prod-db-shell             Open PostgreSQL shell"

# ============================================
# DEVELOPMENT COMMANDS
# ============================================

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
	docker compose -f infra/development/docker-compose.yml exec db psql -U $(shell grep POSTGRES_USER infra/development/.env | cut -d '=' -f2) -d $(shell grep POSTGRES_DB infra/development/.env | cut -d '=' -f2)

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

# ============================================
# PRODUCTION COMMANDS
# ============================================

prod-up:
	docker compose -f infra/production/docker-compose.yml up -d

prod-down:
	docker compose -f infra/production/docker-compose.yml down

prod-restart:
	docker compose -f infra/production/docker-compose.yml restart

prod-logs:
	docker compose -f infra/production/docker-compose.yml logs -f

prod-logs-app:
	docker compose -f infra/production/docker-compose.yml logs -f app

prod-logs-db:
	docker compose -f infra/production/docker-compose.yml logs -f db

prod-logs-go:
	docker compose -f infra/production/docker-compose.yml logs -f go

prod-logs-caddy:
	docker compose -f infra/production/docker-compose.yml logs -f caddy

dev-logs-image:
	docker compose -f infra/production/docker-compose.yml logs -f image

prod-logs-nominatim:
	docker compose -f infra/production/docker-compose.yml logs -f nominatim

prod-logs-ofelia:
	docker compose -f infra/production/docker-compose.yml logs -f ofelia

prod-build:
	docker compose -f infra/production/docker-compose.yml build

prod-status:
	docker compose -f infra/production/docker-compose.yml ps

prod-db-migrate:
	docker compose -f infra/production/docker-compose.yml exec app bun run db:migrate

prod-db-shell:
	docker compose -f infra/production/docker-compose.yml exec db psql -U $(shell grep POSTGRES_USER infra/production/.env | cut -d '=' -f2) -d $(shell grep POSTGRES_DB infra/production/.env | cut -d '=' -f2)


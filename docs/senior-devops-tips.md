# Senior DevOps: Professional Makefile Patterns for Docker Compose

A comprehensive guide to building production-grade Makefiles for Docker Compose-based deployments on VPS infrastructure.

This guide is tailored for the Habita project structure:
- `infra/development/` - Local development environment
- `infra/production/` - Production VPS deployment
- `infra/shared/` - Shared configurations

## Core Philosophy: Environment Separation + DRY Principles

Professional infrastructure management requires clear separation between environments while maintaining DRY (Don't Repeat Yourself) principles. With Docker Compose, you maintain consistent application definitions across all environments.

## 1. Multi-Environment Pattern with Variables

Based on your current infrastructure structure, here's how to set up DRY Makefile patterns:

```makefile
# Environment-specific compose files
COMPOSE_FILE_DEV = infra/development/docker-compose.yml
COMPOSE_FILE_PROD = infra/production/docker-compose.yml

# Environment-specific env files
ENV_FILE_DEV = .env
ENV_FILE_PROD = .env.production

# Docker compose command builder
define COMPOSE
	docker compose -f $(1)
endef

# Now your targets become DRY
dev-up:
	$(call COMPOSE,$(COMPOSE_FILE_DEV)) up -d

prod-up:
	$(call COMPOSE,$(COMPOSE_FILE_PROD)) up -d

# Service-specific operations
dev-logs-app:
	$(call COMPOSE,$(COMPOSE_FILE_DEV)) logs -f app

prod-logs-app:
	$(call COMPOSE,$(COMPOSE_FILE_PROD)) logs -f app
```

## 2. Safety Guards for Production

**NEVER** let destructive commands run in production without confirmation:

```makefile
# Safety check pattern
PRODUCTION_GUARD = @echo "⚠️  PRODUCTION OPERATION"; \
	echo "Type 'yes-i-am-sure' to continue:"; \
	read confirm; \
	if [ "$$confirm" != "yes-i-am-sure" ]; then \
		echo "Aborted."; \
		exit 1; \
	fi

prod-db-drop:
	$(PRODUCTION_GUARD)
	# actual destructive operation here

# Alternative: require explicit environment variable
prod-deploy:
	@test "$(CONFIRM_PROD_DEPLOY)" = "true" || \
		(echo "Set CONFIRM_PROD_DEPLOY=true to deploy" && exit 1)
	# deployment logic
```

## 3. Environment Detection & Context Switching

For Docker Compose deployments, focus on branch protection and environment file validation:

```makefile
# Detect current Git context
CURRENT_BRANCH := $(shell git branch --show-current)
GIT_COMMIT := $(shell git rev-parse --short HEAD)

# Detect if running locally or on production server
IS_PRODUCTION := $(shell test -f /var/run/habita-production && echo "true" || echo "false")

# Enforce branch-environment matching
prod-deploy:
	@if [ "$(CURRENT_BRANCH)" != "main" ]; then \
		echo "❌ Must be on 'main' branch for production"; \
		exit 1; \
	fi
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "❌ Working directory must be clean for production deploy"; \
		exit 1; \
	fi
	# deployment logic

# Validate environment files exist
check-env-dev:
	@test -f .env || (echo "❌ .env missing. Copy from .env.template" && exit 1)

check-env-prod:
	@test -f .env.production || (echo "❌ .env.production missing" && exit 1)
```

## 4. Remote Operations Pattern for Your VPS

For your Docker Compose VPS deployment:

```makefile
# Production VPS connection
PROD_HOST = habita.com  # or your VPS IP
PROD_USER = deploy
PROD_PATH = /opt/habita

# SSH helper for remote Docker Compose operations
define SSH_COMPOSE
	ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && docker compose -f infra/production/docker-compose.yml $(1)"
endef

# Remote operations - mirror your local commands
prod-up:
	$(call SSH_COMPOSE,up -d)

prod-down:
	$(call SSH_COMPOSE,down)

prod-restart:
	$(call SSH_COMPOSE,restart)

prod-logs:
	ssh -t $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && docker compose -f infra/production/docker-compose.yml logs -f"

prod-logs-app:
	ssh -t $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && docker compose -f infra/production/docker-compose.yml logs -f app"

prod-logs-db:
	ssh -t $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && docker compose -f infra/production/docker-compose.yml logs -f db"

prod-logs-go:
	ssh -t $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && docker compose -f infra/production/docker-compose.yml logs -f go"

# Database operations on production
prod-db-migrate:
	$(call SSH_COMPOSE,exec app bun run db:migrate)

prod-db-shell:
	ssh -t $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && docker compose -f infra/production/docker-compose.yml exec db psql -U \$$POSTGRES_USER -d \$$POSTGRES_DB"

# Remote shell access to app container
prod-shell-app:
	ssh -t $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && docker compose -f infra/production/docker-compose.yml exec app bash"

# Direct VPS shell
prod-shell:
	ssh -t $(PROD_USER)@$(PROD_HOST)
```

## 5. Health Checks & Smoke Tests

Leverage Docker Compose's built-in health checks and add application-level checks:

```makefile
# Check Docker Compose service health status
define check_service_health
	@echo "🏥 Checking service health: $(1)"
	@docker compose -f $(2) ps $(1) | grep -q "healthy" || \
		(echo "❌ Service $(1) is not healthy" && exit 1)
	@echo "✅ Service $(1) is healthy"
endef

# Local health checks
dev-health:
	@echo "🏥 Checking all services..."
	$(call check_service_health,db,$(COMPOSE_FILE_DEV))
	$(call check_service_health,app,$(COMPOSE_FILE_DEV))
	$(call check_service_health,valkey,$(COMPOSE_FILE_DEV))
	$(call check_service_health,go,$(COMPOSE_FILE_DEV))
	@echo "✅ All services healthy"

# Production health check (via SSH)
prod-health:
	@echo "🏥 Checking production services..."
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml ps --format json" | \
		grep -q '"Health":"healthy"' || \
		(echo "❌ Some services are unhealthy" && exit 1)
	@echo "✅ Production services healthy"

# Application-level health check
dev-app-health:
	@curl -sf http://localhost:5173 > /dev/null && echo "✅ App responding" || \
		(echo "❌ App not responding" && exit 1)

prod-app-health:
	@curl -sf https://habita.com > /dev/null && echo "✅ Production app responding" || \
		(echo "❌ Production app not responding" && exit 1)

# Post-deployment smoke test
prod-deploy: prod-pre-deploy-checks
	# ... deployment steps ...
	@sleep 10  # Give services time to start
	$(MAKE) prod-health
	$(MAKE) prod-app-health
	@echo "✅ Deployment successful"
```

## 6. Database Operations (THE CRITICAL STUFF)

**NEVER** run migrations automatically on prod deploy. **ALWAYS** separate migration from deployment.

For your PostgreSQL setup with Docker Compose:

```makefile
# Backup before migration (MANDATORY for prod)
prod-db-backup:
	@echo "📦 Creating backup: db-$$(date +%Y%m%d-%H%M%S).sql.gz"
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		mkdir -p backups && \
		docker compose -f infra/production/docker-compose.yml exec -T db \
		pg_dump -U \$$POSTGRES_USER \$$POSTGRES_DB | \
		gzip > backups/db-$$(date +%Y%m%d-%H%M%S).sql.gz"
	@echo "✅ Backup created"

# List available backups
prod-db-backups:
	@echo "📋 Available backups:"
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH)/backups && ls -lh *.sql.gz 2>/dev/null || echo 'No backups found'"

# Migration with backup (requires manual confirmation)
prod-db-migrate: prod-db-backup
	$(PRODUCTION_GUARD)
	@echo "🔄 Running migrations..."
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml exec app bun run db:migrate"
	@echo "✅ Migrations completed"

# Restore from backup
prod-db-restore:
	$(PRODUCTION_GUARD)
	@echo "📋 Available backups:"
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH)/backups && ls -1 *.sql.gz 2>/dev/null"
	@echo ""
	@echo "Enter backup filename to restore:"
	@read -p "> " backup; \
	ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		gunzip < backups/$$backup | \
		docker compose -f infra/production/docker-compose.yml exec -T db \
		psql -U \$$POSTGRES_USER \$$POSTGRES_DB"

# Download backup to local machine
prod-db-download-backup:
	@echo "📋 Available backups:"
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH)/backups && ls -1 *.sql.gz 2>/dev/null"
	@echo ""
	@echo "Enter backup filename to download:"
	@read -p "> " backup; \
	scp $(PROD_USER)@$(PROD_HOST):$(PROD_PATH)/backups/$$backup ./backups/

# Local database operations (keep existing)
dev-db-migrate:
	docker compose -f $(COMPOSE_FILE_DEV) exec app bun run db:migrate

dev-db-seed:
	docker compose -f $(COMPOSE_FILE_DEV) exec app bun run db:seed

dev-db-backup:
	@mkdir -p backups
	@echo "📦 Creating local backup..."
	docker compose -f $(COMPOSE_FILE_DEV) exec -T db \
		pg_dump -U $$POSTGRES_USER $$POSTGRES_DB | \
		gzip > backups/dev-db-$$(date +%Y%m%d-%H%M%S).sql.gz
```

## 7. Secrets Management

```makefile
# NEVER commit .env files to git
# Use encrypted secrets or secret managers

# Local development: use .env
dev-env-check:
	@test -f .env || (echo "❌ .env missing. Copy .env.template" && exit 1)

# Staging/Prod: pull from secret manager
staging-sync-secrets:
	aws secretsmanager get-secret-value \
		--secret-id habita/staging \
		--query SecretString \
		--output text > /tmp/staging.env
	scp /tmp/staging.env $(STAGING_USER)@$(STAGING_HOST):$(STAGING_PATH)/.env
	rm /tmp/staging.env

# Or use Vault, Doppler, etc.
```

## 8. Deployment Strategies for Docker Compose

### Zero-Downtime Deployment Pattern

For your single VPS setup with Docker Compose:

```makefile
# Complete deployment workflow
prod-deploy: check-env-prod
	$(PRODUCTION_GUARD)
	@echo "🚀 Starting production deployment..."

	# Step 1: Sync code to production
	@echo "📦 Syncing code to production..."
	rsync -avz --exclude 'node_modules' --exclude '.git' \
		--exclude 'backups' --exclude '*.log' \
		./ $(PROD_USER)@$(PROD_HOST):$(PROD_PATH)/

	# Step 2: Build new images on production server
	@echo "🔨 Building images on production..."
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml build"

	# Step 3: Pull any updated base images
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml pull"

	# Step 4: Restart services with zero downtime
	@echo "🔄 Rolling restart of services..."
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml up -d --no-deps --build app && \
		docker compose -f infra/production/docker-compose.yml up -d --no-deps --build go"

	# Step 5: Health check
	@sleep 10
	$(MAKE) prod-health
	$(MAKE) prod-app-health

	# Step 6: Cleanup old images
	@echo "🧹 Cleaning up old images..."
	@ssh $(PROD_USER)@$(PROD_HOST) "docker image prune -f"

	@echo "✅ Deployment successful!"

# Quick deploy (skip build if images are ready)
prod-deploy-quick:
	$(PRODUCTION_GUARD)
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml up -d"
	$(MAKE) prod-health

# Rollback to previous image
prod-rollback:
	$(PRODUCTION_GUARD)
	@echo "⏪ Rolling back to previous version..."
	@echo "Available images:"
	@ssh $(PROD_USER)@$(PROD_HOST) "docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}' | grep habita"
	@echo ""
	@echo "This will restart with previously running images"
	@read -p "Continue? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
			docker compose -f infra/production/docker-compose.yml down && \
			docker compose -f infra/production/docker-compose.yml up -d"; \
	fi
```

### Blue-Green with Docker Compose (Advanced)

For when you want true zero-downtime with instant rollback:

```makefile
# This requires nginx or Caddy to route between blue/green
prod-deploy-blue-green:
	$(PRODUCTION_GUARD)
	@echo "🔵 Deploying to blue environment..."

	# Deploy to blue stack
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -p habita-blue -f infra/production/docker-compose.yml up -d"

	# Health check blue
	@sleep 10
	@echo "🏥 Checking blue environment health..."
	# Check blue is healthy before switching

	@echo "🔀 Switching traffic to blue..."
	# Update Caddy/nginx config to point to blue
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		sed -i 's/habita-green/habita-blue/g' infra/production/Caddyfile && \
		docker compose -f infra/production/docker-compose.yml exec caddy caddy reload"

	@echo "🟢 Shutting down green environment..."
	@ssh $(PROD_USER)@$(PROD_HOST) "docker compose -p habita-green down"

	@echo "✅ Blue-green deployment complete"
```

## 9. Monitoring & Observability for Docker Compose

```makefile
# Quick status overview - local
dev-status:
	@echo "📊 Development Environment Status"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "Branch: $(CURRENT_BRANCH)"
	@echo "Commit: $(GIT_COMMIT)"
	@echo ""
	@echo "Services:"
	@docker compose -f $(COMPOSE_FILE_DEV) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "Resource Usage:"
	@docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
		$$(docker compose -f $(COMPOSE_FILE_DEV) ps -q)

# Production status
prod-status:
	@echo "📊 Production Environment Status"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		echo 'Services:' && \
		docker compose -f infra/production/docker-compose.yml ps --format 'table {{.Name}}\t{{.Status}}\t{{.Health}}' && \
		echo '' && \
		echo 'Resource Usage:' && \
		docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}' \
		\$$(docker compose -f infra/production/docker-compose.yml ps -q)"

# Tail logs with filtering
dev-logs-errors:
	docker compose -f $(COMPOSE_FILE_DEV) logs -f | grep -i "error\|exception\|fatal"

prod-logs-errors:
	ssh -t $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml logs -f | grep -i 'error\|exception\|fatal'"

# Check disk usage (important for Docker!)
dev-disk-usage:
	@echo "💾 Docker Disk Usage:"
	@docker system df -v

prod-disk-usage:
	@echo "💾 Production Docker Disk Usage:"
	@ssh $(PROD_USER)@$(PROD_HOST) "docker system df -v"

# Clean up old images and containers
dev-cleanup:
	@echo "🧹 Cleaning up development environment..."
	docker compose -f $(COMPOSE_FILE_DEV) down --volumes --remove-orphans
	docker system prune -f

prod-cleanup:
	$(PRODUCTION_GUARD)
	@echo "🧹 Cleaning up production (keeps volumes!)..."
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker system prune -f --volumes=false"

# Monitor specific service logs in real-time
dev-logs-follow:
	@echo "Available services: app, db, go, valkey, caddy, nominatim"
	@read -p "Service name: " service; \
	docker compose -f $(COMPOSE_FILE_DEV) logs -f --tail=100 $$service

prod-logs-follow:
	@echo "Available services: app, db, go, valkey, caddy, nominatim"
	@read -p "Service name: " service; \
	ssh -t $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml logs -f --tail=100 $$service"
```

## 10. Complete Professional Makefile for Habita

Here's a complete, production-ready Makefile tailored to your Docker Compose infrastructure:

```makefile
.PHONY: help

# ============================================================================
# Variables
# ============================================================================

# Compose files
COMPOSE_FILE_DEV = infra/development/docker-compose.yml
COMPOSE_FILE_PROD = infra/production/docker-compose.yml

# Git context
CURRENT_BRANCH := $(shell git branch --show-current)
GIT_COMMIT := $(shell git rev-parse --short HEAD)

# Production VPS (update with your actual values)
PROD_HOST = habita.com
PROD_USER = deploy
PROD_PATH = /opt/habita

# ============================================================================
# Helper Functions
# ============================================================================

define COMPOSE
	docker compose -f $(1)
endef

define SSH_COMPOSE
	ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && docker compose -f infra/production/docker-compose.yml $(1)"
endef

PRODUCTION_GUARD = @echo "⚠️  PRODUCTION OPERATION"; \
	echo "Type 'yes-i-am-sure' to continue:"; \
	read confirm; \
	if [ "$$confirm" != "yes-i-am-sure" ]; then \
		echo "Aborted."; \
		exit 1; \
	fi

# ============================================================================
# Help
# ============================================================================

help: ## Show this help
	@echo "Habita Infrastructure Management"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  %-30s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# ============================================================================
# Development
# ============================================================================

dev-up: ## Start development
	$(call COMPOSE,$(COMPOSE_FILE_DEV)) up -d

dev-down: ## Stop development
	$(call COMPOSE,$(COMPOSE_FILE_DEV)) down

dev-logs: ## View all logs
	$(call COMPOSE,$(COMPOSE_FILE_DEV)) logs -f

dev-status: ## Show status
	@docker compose -f $(COMPOSE_FILE_DEV) ps

# ============================================================================
# Production
# ============================================================================

prod-deploy: check-env-prod ## Deploy to production
	$(PRODUCTION_GUARD)
	@echo "🚀 Deploying..."
	@rsync -avz --exclude 'node_modules' --exclude '.git' ./ $(PROD_USER)@$(PROD_HOST):$(PROD_PATH)/
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml build && \
		docker compose -f infra/production/docker-compose.yml up -d"
	@echo "✅ Deployed"

prod-logs: ## View production logs
	ssh -t $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml logs -f"

prod-status: ## Production status
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml ps"

# ============================================================================
# Database
# ============================================================================

dev-db-migrate: ## Run dev migrations
	$(call COMPOSE,$(COMPOSE_FILE_DEV)) exec app bun run db:migrate

prod-db-backup: ## Backup production DB
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		mkdir -p backups && \
		docker compose -f infra/production/docker-compose.yml exec -T db \
		pg_dump -U \$$POSTGRES_USER \$$POSTGRES_DB | \
		gzip > backups/db-$$(date +%Y%m%d-%H%M%S).sql.gz"

prod-db-migrate: prod-db-backup ## Run prod migrations (with backup)
	$(PRODUCTION_GUARD)
	$(call SSH_COMPOSE,exec app bun run db:migrate)

# ============================================================================
# Utilities
# ============================================================================

check-env-prod: ## Check .env.production exists
	@test -f .env.production || (echo "❌ .env.production missing" && exit 1)
```

## 11. Docker-Specific Best Practices

### Volume Management

```makefile
# List all volumes
dev-volumes:
	@echo "Docker volumes:"
	@docker volume ls --filter name=development

prod-volumes:
	@ssh $(PROD_USER)@$(PROD_HOST) "docker volume ls --filter name=habita"

# Backup volumes (important for production!)
prod-volume-backup:
	@echo "📦 Backing up production volumes..."
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		for vol in habita_prod_db_data habita_prod_valkey_data; do \
			docker run --rm -v \$$vol:/data -v $(PROD_PATH)/backups:/backup \
			alpine tar czf /backup/\$$vol-$$(date +%Y%m%d).tar.gz -C /data .; \
		done"
```

### Docker Registry Usage (Optional)

If you use a private registry:

```makefile
# Build and tag with version
DOCKER_REGISTRY = registry.habita.com
VERSION := $(GIT_COMMIT)

docker-build-app:
	docker build -t $(DOCKER_REGISTRY)/app:$(VERSION) -t $(DOCKER_REGISTRY)/app:latest \
		-f apps/web/Dockerfile.production apps/web

docker-build-go:
	docker build -t $(DOCKER_REGISTRY)/go:$(VERSION) -t $(DOCKER_REGISTRY)/go:latest \
		-f apps/go/Dockerfile apps/go

docker-push:
	docker push $(DOCKER_REGISTRY)/app:$(VERSION)
	docker push $(DOCKER_REGISTRY)/app:latest
	docker push $(DOCKER_REGISTRY)/go:$(VERSION)
	docker push $(DOCKER_REGISTRY)/go:latest

# Deploy from registry
prod-deploy-from-registry:
	$(PRODUCTION_GUARD)
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml pull && \
		docker compose -f infra/production/docker-compose.yml up -d"
```

## Key Professional Principles

### 1. Idempotency
Running a command twice should be safe. Every operation should check its current state and only make changes if necessary.

### 2. Fail Fast
Check preconditions before expensive operations. Validate environment, context, permissions, and dependencies upfront.

### 3. Observability
Always log what's happening. Use clear status messages, progress indicators, and meaningful output.

### 4. Safety
Implement guard rails for production operations. Require explicit confirmation for destructive actions.

### 5. DRY (Don't Repeat Yourself)
Use functions and variables to avoid repetition. Define once, use everywhere.

### 6. Documentation
Create self-documenting help targets. Every command should have a clear description of what it does.

### 7. Atomicity
Each target should do ONE thing well. Break complex operations into smaller, composable targets.

### 8. Rollback Plan
Always have a way to undo operations. Maintain backups, use versioning, and document rollback procedures.

## Common Patterns

### Pre-flight Checks

```makefile
pre-deploy-checks:
	@echo "🔍 Running pre-deployment checks..."
	@$(MAKE) check-git-clean
	@$(MAKE) check-tests-passing
	@$(MAKE) check-dependencies

check-git-clean:
	@if [ -n "$$(git status --porcelain)" ]; then \
		echo "❌ Working directory not clean"; \
		exit 1; \
	fi
```

### Dependency Management

```makefile
deps-check:
	@command -v docker >/dev/null 2>&1 || \
		(echo "❌ Docker not installed" && exit 1)
	@command -v kubectl >/dev/null 2>&1 || \
		(echo "❌ kubectl not installed" && exit 1)
```

### Versioning

```makefile
VERSION := $(shell git describe --tags --always --dirty)
BUILD_DATE := $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
COMMIT := $(shell git rev-parse HEAD)

docker-build:
	docker build \
		--build-arg VERSION=$(VERSION) \
		--build-arg BUILD_DATE=$(BUILD_DATE) \
		--build-arg COMMIT=$(COMMIT) \
		-t habita-app:$(VERSION) .
```

## Anti-Patterns to Avoid

1. **Hard-coding environment values** - Use variables and environment files
2. **No error handling** - Always check return codes and provide meaningful errors
3. **Silent failures** - Log everything, especially in production
4. **No rollback strategy** - Always have a way to undo changes
5. **Mixing concerns** - Keep deployment, migration, and infrastructure separate
6. **Automatic production deployments** - Always require manual confirmation
7. **No health checks** - Always verify deployment success
8. **Forgetting backups** - Never run destructive operations without backups
9. **Exposing ports in production** - Don't expose DB/Redis ports, use internal Docker networks
10. **Building on local machine** - Build on the production server for consistency

## Habita-Specific Makefile Patterns

Based on your services (app, go, db, valkey, caddy, nominatim):

```makefile
# ============================================================================
# Service-Specific Operations
# ============================================================================

# Restart individual services
dev-restart-app: ## Restart app service only
	$(call COMPOSE,$(COMPOSE_FILE_DEV)) restart app

dev-restart-go: ## Restart Go service only
	$(call COMPOSE,$(COMPOSE_FILE_DEV)) restart go

prod-restart-app: ## Restart production app
	$(call SSH_COMPOSE,restart app)

prod-restart-go: ## Restart production Go service
	$(call SSH_COMPOSE,restart go)

# ============================================================================
# Nominatim (Geocoding) Management
# ============================================================================

dev-nominatim-status: ## Check Nominatim import status
	@docker compose -f $(COMPOSE_FILE_DEV) exec nominatim \
		curl -s http://localhost:8080/status.php

prod-nominatim-status: ## Check production Nominatim status
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml exec nominatim \
		curl -s http://localhost:8080/status.php"

# Nominatim takes hours to import - monitor progress
dev-nominatim-logs: ## Follow Nominatim import logs
	$(call COMPOSE,$(COMPOSE_FILE_DEV)) logs -f nominatim

# ============================================================================
# Caddy (Reverse Proxy) Management
# ============================================================================

dev-caddy-reload: ## Reload Caddy config
	docker compose -f $(COMPOSE_FILE_DEV) exec caddy caddy reload --config /etc/caddy/Caddyfile

prod-caddy-reload: ## Reload production Caddy
	$(call SSH_COMPOSE,exec caddy caddy reload --config /etc/caddy/Caddyfile)

dev-caddy-validate: ## Validate Caddyfile syntax
	docker compose -f $(COMPOSE_FILE_DEV) exec caddy caddy validate --config /etc/caddy/Caddyfile

# Check SSL certificates
prod-caddy-certs: ## Check Caddy SSL certificates
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml exec caddy \
		caddy list-certificates"

# ============================================================================
# Valkey (Redis) Operations
# ============================================================================

dev-valkey-cli: ## Open Valkey CLI
	docker compose -f $(COMPOSE_FILE_DEV) exec valkey valkey-cli

prod-valkey-cli: ## Open production Valkey CLI
	ssh -t $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		docker compose -f infra/production/docker-compose.yml exec valkey valkey-cli"

dev-valkey-flush: ## Flush Valkey cache (development)
	docker compose -f $(COMPOSE_FILE_DEV) exec valkey valkey-cli FLUSHALL

prod-valkey-flush: ## Flush production cache (DANGEROUS!)
	$(PRODUCTION_GUARD)
	$(call SSH_COMPOSE,exec valkey valkey-cli FLUSHALL)

# ============================================================================
# Multi-Service Health Checks
# ============================================================================

dev-check-all: ## Comprehensive development health check
	@echo "🏥 Running comprehensive health checks..."
	@echo ""
	@echo "Git Status:"
	@git status --short
	@echo ""
	@echo "Services:"
	@docker compose -f $(COMPOSE_FILE_DEV) ps
	@echo ""
	@echo "App Health:"
	@curl -sf http://localhost:5173 > /dev/null && echo "✅ App responding" || echo "❌ App down"
	@echo "Go API Health:"
	@curl -sf http://localhost:8081/health > /dev/null && echo "✅ Go API healthy" || echo "❌ Go API down"
	@echo "Nominatim:"
	@curl -sf http://localhost:8080/status.php > /dev/null && echo "✅ Nominatim ready" || echo "⚠️  Nominatim not ready"

prod-check-all: ## Comprehensive production health check
	@echo "🏥 Production Health Check"
	@ssh $(PROD_USER)@$(PROD_HOST) "cd $(PROD_PATH) && \
		echo 'Services:' && \
		docker compose -f infra/production/docker-compose.yml ps && \
		echo '' && \
		echo 'App Health:' && \
		curl -sf https://habita.com > /dev/null && echo '✅ App responding' || echo '❌ App down'"
```

## Production VPS Setup Checklist

Before using production commands, ensure your VPS has:

1. **SSH Key Access**: Set up SSH key-based authentication
   ```bash
   ssh-copy-id deploy@habita.com
   ```

2. **Docker & Docker Compose**: Install on VPS
   ```bash
   # Run on VPS
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker deploy
   ```

3. **Directory Structure**: Create on VPS
   ```bash
   ssh deploy@habita.com "mkdir -p /opt/habita/backups"
   ```

4. **Environment Files**: Upload .env.production
   ```bash
   scp .env.production deploy@habita.com:/opt/habita/
   ```

5. **Firewall**: Configure UFW
   ```bash
   # Run on VPS
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

6. **DNS**: Point your domain to VPS IP
   ```
   A record: habita.com -> VPS_IP
   ```

## Quick Start Guide

### Local Development
```bash
# Start everything
make dev-up

# Check status
make dev-status

# View logs
make dev-logs

# Run migrations
make dev-db-migrate

# Stop everything
make dev-down
```

### Production Deployment
```bash
# First time setup
scp .env.production deploy@habita.com:/opt/habita/
make prod-deploy

# Subsequent deployments
make prod-deploy

# Check production
make prod-status
make prod-check-all

# View logs
make prod-logs

# Database operations
make prod-db-backup
make prod-db-migrate
```

## Resources

- [GNU Make Manual](https://www.gnu.org/software/make/manual/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Compose Production Best Practices](https://docs.docker.com/compose/production/)
- [The Twelve-Factor App](https://12factor.net/)
- [Caddy Documentation](https://caddyserver.com/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)

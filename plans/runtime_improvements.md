# Runtime Improvements Plan

**Objective**: Unify development and production environments for consistency and simplicity

**Key Goals**:
1. Remove Node.js entirely - use only Bun runtime
2. Environment-agnostic Makefile commands (same commands work locally and on production box)
3. Simple SSH command to access production box and run commands

**Philosophy**: Development and production should behave identically. Same commands, same runtime, same behavior.

---

## 🎯 **OVERALL STATUS: PENDING**

**Current State**: Separate dev/prod commands, Node+Bun hybrid runtime
**Target State**: Unified commands, Bun-only runtime, seamless SSH workflow

---

## Phase 1: Remove Node, Use Only Bun ⏳ PENDING

### Context
Currently `apps/web/Dockerfile.production` uses `node:22` as base image and installs Bun on top of it. This creates:
- Unnecessary complexity (two runtimes)
- Larger image size
- Potential conflicts between Node and Bun
- Inconsistency (dev uses Bun, prod uses Node+Bun)

**Decision**: Use `oven/bun` base image exclusively, matching the development Dockerfile.

### 1.1 Update Production Dockerfile ⏳
- [ ] Read current `apps/web/Dockerfile.production`
- [ ] Replace `FROM node:22` with `FROM oven/bun` (line 13)
- [ ] Remove Bun installation steps (lines 18-19)
- [ ] Remove Node-specific environment setup
- [ ] Ensure `CMD ["bun", "run", "start"]` is used
- [ ] Verify all COPY statements are correct
- [ ] Ensure runtime stage is Bun-only

**Current Dockerfile Structure (BEFORE)**:
```dockerfile
FROM node:22 AS runtime
RUN curl -fsSL https://bun.sh/install | bash
# ... installs Bun on top of Node
```

**Target Dockerfile Structure (AFTER)**:
```dockerfile
FROM oven/bun AS runtime
# ... pure Bun runtime, no Node
```

### 1.2 Test Production Build Locally ⏳
- [ ] Build production image locally: `docker build -f apps/web/Dockerfile.production -t test-web .`
- [ ] Run container: `docker run -p 3000:3000 test-web`
- [ ] Verify app starts correctly
- [ ] Check logs for any Node-related errors
- [ ] Test basic functionality (homepage loads, assets serve)
- [ ] Verify `react-router-serve` works with Bun runtime

### 1.3 Verify GitHub Actions Compatibility ⏳
- [ ] Review `.github/workflows/deploy.yml`
- [ ] Confirm no Node-specific steps exist
- [ ] Verify image build steps are compatible
- [ ] Check if any workflow updates needed

### 1.4 Update Documentation ⏳
- [ ] Update `rules/runtime.md` to emphasize Bun-only usage
- [ ] Document that Node is NOT used anywhere in the stack
- [ ] Update any deployment docs mentioning runtime

---

## Phase 2: Environment-Agnostic Makefile ⏳ PENDING

### Context
Currently Makefile has duplicated commands:
- `dev-up`, `dev-down`, `dev-logs`, `dev-db-seed`, etc.
- `prod-up`, `prod-down`, `prod-logs`, `prod-db-migrate`, etc.

**Problem**: Running commands on production box requires remembering to use `prod-*` prefix. This is error-prone and breaks the "same commands everywhere" philosophy.

**Solution**: Auto-detect environment based on which `.env` file exists:
- Local machine: has `.env` → uses `infra/development/docker-compose.yml`
- Production box: has `.env.production` → uses `infra/production/docker-compose.yml`

**User Experience**:
- Locally: `make db-seed` → runs on development
- SSH to box: `make db-seed` → runs on production (automatically)
- No ENV variables, no prefixes, just works

### 2.1 Design Auto-Detection Logic ⏳
- [ ] Determine detection mechanism: check if `.env.production` exists
- [ ] If `.env.production` exists → production mode
- [ ] Otherwise → development mode
- [ ] Set `COMPOSE_FILE` variable based on detection
- [ ] Set `ENV_FILE` variable for commands that read .env directly

**Proposed Makefile Variables**:
```makefile
# Auto-detect environment based on .env file presence
ENV_FILE := $(shell [ -f .env.production ] && echo ".env.production" || echo ".env")
COMPOSE_DIR := $(shell [ -f .env.production ] && echo "infra/production" || echo "infra/development")
COMPOSE_FILE := $(COMPOSE_DIR)/docker-compose.yml
```

### 2.2 Create Unified Commands ⏳

#### Environment Commands
- [ ] Replace `dev-up` + `prod-up` with `up`
- [ ] Replace `dev-down` + `prod-down` with `down`
- [ ] Replace `dev-restart` + `prod-restart` with `restart`
- [ ] Replace `dev-build` + `prod-build` with `build`
- [ ] Replace `dev-clean` with `clean` (keep as dev-only or make safe for prod)
- [ ] Add `status` command (currently only prod has this)

#### Log Commands
- [ ] Replace `dev-logs` + `prod-logs` with `logs`
- [ ] Replace `dev-logs-app` + `prod-logs-app` with `logs-app`
- [ ] Replace `dev-logs-db` + `prod-logs-db` with `logs-db`
- [ ] Replace `dev-logs-go` + `prod-logs-go` with `logs-go`
- [ ] Add `logs-image` (dev only currently)
- [ ] Add `logs-caddy` (prod only currently)
- [ ] Add `logs-nominatim` (prod only currently)
- [ ] Add `logs-ofelia` (both have this)

#### Database Commands
- [ ] Replace `dev-db-migrate` + `prod-db-migrate` with `db-migrate`
- [ ] Replace `dev-db-seed` with `db-seed` (no prod equivalent currently)
- [ ] Replace `dev-db-types` with `db-types`
- [ ] Replace `dev-db-create-migration` with `db-create-migration`
- [ ] Replace `dev-db-shell` + `prod-db-shell` with `db-shell` (must read correct ENV_FILE)
- [ ] Replace `dev-db-drop` with `db-drop` (dev-only, add safety check)

#### Cron Job Commands
- [ ] Replace `dev-add-escalation-job` with `add-escalation-job`
- [ ] Replace `dev-run-jobs` with `run-jobs`

### 2.3 Handle Edge Cases ⏳
- [ ] **db-shell**: Must read POSTGRES_USER and POSTGRES_DB from correct .env file
  ```makefile
  db-shell:
      docker compose -f $(COMPOSE_FILE) exec db psql \
          -U $(shell grep POSTGRES_USER $(ENV_FILE) | cut -d '=' -f2) \
          -d $(shell grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2)
  ```
- [ ] **db-drop**: Should have safety confirmation for production
- [ ] **clean**: Consider if safe for production or dev-only
- [ ] **Commands that don't exist in prod**: Make them work with both compose files

### 2.4 Update Help Text ⏳
- [ ] Remove "DEVELOPMENT" and "PRODUCTION" sections
- [ ] Create unified sections: "Environment", "Logs", "Database", "Cron Jobs"
- [ ] Add "SSH" section for production access
- [ ] Document auto-detection behavior
- [ ] Add examples: "Commands work the same locally and on production box"
- [ ] Update command descriptions to be environment-agnostic

### 2.5 Update .PHONY Declarations ⏳
- [ ] Remove all `dev-*` and `prod-*` declarations
- [ ] Add new unified command names
- [ ] Ensure all targets are listed

---

## Phase 3: SSH Command for Production Box ⏳ PENDING

### Context
Need a simple way to SSH to production box and immediately be in the monorepo root (`/opt/habita`), ready to run make commands.

**Requirements**:
- Read connection details from `.env.production`
- SSH to box
- Change to `/opt/habita` directory
- Drop into interactive shell

**User Experience**:
```bash
# On local machine
make ssh

# Automatically connects and puts you in /opt/habita
habita@production:/opt/habita$ make db-seed
habita@production:/opt/habita$ make logs-app
habita@production:/opt/habita$ make db-shell
```

### 3.1 Implement SSH Command ⏳
- [ ] Add `ssh` target to Makefile
- [ ] Read `VPS_HOST` from `.env.production`
- [ ] Read `VPS_USER` from `.env.production`
- [ ] Read `VPS_PORT` from `.env.production`
- [ ] Use `ssh -t` for interactive terminal
- [ ] Use command: `"cd /opt/habita && exec bash"`
- [ ] Handle cases where .env.production doesn't exist (error message)

**Proposed Implementation**:
```makefile
ssh:
	@if [ ! -f .env.production ]; then \
		echo "Error: .env.production not found. SSH command only works with production environment."; \
		exit 1; \
	fi
	ssh -t -p $(shell grep VPS_PORT .env.production | cut -d '=' -f2 | tr -d '"' | tr -d ' ') \
		$(shell grep VPS_USER .env.production | cut -d '=' -f2 | tr -d '"' | tr -d ' ')@$(shell grep VPS_HOST .env.production | cut -d '=' -f2 | tr -d '"' | tr -d ' ') \
		"cd /opt/habita && exec bash"
```

### 3.2 Test SSH Command ⏳
- [ ] Run `make ssh` locally
- [ ] Verify connection succeeds
- [ ] Verify lands in `/opt/habita` directory
- [ ] Test running make commands from SSH session
- [ ] Test that auto-detection works (should use production compose file)
- [ ] Verify can exit cleanly

### 3.3 Document SSH Usage ⏳
- [ ] Add to help text
- [ ] Document SSH key requirements
- [ ] Add troubleshooting notes
- [ ] Document that commands work the same once connected

---

## Phase 4: Testing & Validation ⏳ PENDING

### 4.1 Local Testing (Development Environment) ⏳
- [ ] Test `make up` starts development environment
- [ ] Test `make down` stops development environment
- [ ] Test `make logs` shows all service logs
- [ ] Test `make logs-app` shows app logs only
- [ ] Test `make db-migrate` runs migrations
- [ ] Test `make db-seed` seeds database
- [ ] Test `make db-shell` opens PostgreSQL shell
- [ ] Test `make db-types` generates TypeScript types
- [ ] Test `make add-escalation-job` runs cron script
- [ ] Test `make run-jobs` processes jobs
- [ ] Verify auto-detection selects development compose file
- [ ] Verify commands read from `.env` file

### 4.2 Commit and Push Changes ⏳
- [ ] Stage all changes (Dockerfile, Makefile, plans/)
- [ ] Create commit with descriptive message
- [ ] Push to `nicolasaccetta/hab-14-deploy-to-production` branch
- [ ] Verify GitHub Actions workflow triggers
- [ ] Monitor build progress

### 4.3 GitHub Actions Build Validation ⏳
- [ ] Verify web image builds successfully with Bun-only runtime
- [ ] Verify go image builds successfully
- [ ] Verify images pushed to Docker Hub
- [ ] Verify SSH connection to VPS succeeds
- [ ] Verify code pull on VPS succeeds
- [ ] Verify Docker login on VPS succeeds
- [ ] Verify image pull on VPS succeeds
- [ ] Verify migrations run successfully
- [ ] Verify containers restart successfully
- [ ] Check deployment status output

### 4.4 Production Box Testing (Via SSH) ⏳
- [ ] Run `make ssh` from local machine
- [ ] Verify lands in `/opt/habita`
- [ ] Verify `.env.production` exists
- [ ] Run `make status` - check all containers running
- [ ] Run `make logs-app` - verify app logs visible
- [ ] Run `make db-shell` - verify PostgreSQL connection
- [ ] Exit db shell and verify still in `/opt/habita`
- [ ] Test other commands as needed
- [ ] Verify auto-detection selects production compose file

### 4.5 Bun Runtime Verification ⏳
- [ ] SSH to production box
- [ ] Check app container: `docker compose -f infra/production/docker-compose.yml exec app which bun`
- [ ] Verify Bun is available
- [ ] Check for Node: `docker compose -f infra/production/docker-compose.yml exec app which node`
- [ ] Verify Node is NOT available (command should fail)
- [ ] Check app process: `docker compose -f infra/production/docker-compose.yml exec app ps aux`
- [ ] Verify process is `bun run start` not `node`
- [ ] Check app logs for any Node-related errors
- [ ] Test app functionality (visit https://habita.rent)

### 4.6 End-to-End Workflow Test ⏳
- [ ] Make a small code change locally
- [ ] Commit and push to main branch
- [ ] Wait for GitHub Actions deployment
- [ ] SSH to production box: `make ssh`
- [ ] Check deployment: `make status`
- [ ] View logs: `make logs-app`
- [ ] Verify change is live
- [ ] Run any necessary commands (migrations, seed, etc.)

---

## Phase 5: Documentation Updates ⏳ PENDING

### 5.1 Mark Deployment Plan Complete ⏳
- [ ] Review `plans/deploying_to_production.md`
- [ ] Confirm all phases are marked complete
- [ ] Add final notes about runtime improvements
- [ ] Document that deployment plan is finished

### 5.2 Update Project Documentation ⏳
- [ ] Review README.md for command references
- [ ] Update any references to `dev-*` or `prod-*` commands
- [ ] Document new unified command structure
- [ ] Document `make ssh` workflow
- [ ] Document auto-detection behavior

### 5.3 Update Runtime Rules ⏳
- [ ] Review `rules/runtime.md`
- [ ] Strengthen Bun-only directive
- [ ] Document that Node is NOT used
- [ ] Add examples of correct usage

---

## Implementation Notes

### Auto-Detection Logic Details

**How It Works**:
1. Makefile checks if `.env.production` exists
2. If yes → sets variables to use production compose file
3. If no → sets variables to use development compose file
4. All commands use these variables

**Why This Works**:
- Local machine: Only has `.env` (no `.env.production`)
- Production box: Has `.env.production` in `/opt/habita/`
- Detection is automatic and transparent
- No manual environment variables needed

### Makefile Variable Structure

```makefile
# Auto-detect environment
ENV_FILE := $(shell [ -f .env.production ] && echo ".env.production" || echo ".env")
COMPOSE_DIR := $(shell [ -f .env.production ] && echo "infra/production" || echo "infra/development")
COMPOSE_FILE := $(COMPOSE_DIR)/docker-compose.yml

# All commands use these variables
up:
	docker compose -f $(COMPOSE_FILE) up -d

logs:
	docker compose -f $(COMPOSE_FILE) logs -f

db-shell:
	docker compose -f $(COMPOSE_FILE) exec db psql \
		-U $(shell grep POSTGRES_USER $(ENV_FILE) | cut -d '=' -f2) \
		-d $(shell grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2)
```

### Bun Runtime Benefits

**Why Bun-Only**:
- **Simplicity**: One runtime, not two
- **Performance**: Bun is faster than Node for most operations
- **Consistency**: Dev and prod use identical runtime
- **Stability**: No version conflicts between Node and Bun
- **Smaller Images**: No need for Node.js base layer

**Compatibility**:
- React Router works with Bun
- Kysely database migrations work with Bun
- All npm packages work with Bun (it's compatible with Node.js)
- Bun implements Node.js APIs natively

---

## Risk Assessment

### Low Risk
- ✅ Bun runtime compatibility (already works in dev)
- ✅ Auto-detection logic (simple file check)
- ✅ SSH command (standard SSH)

### Medium Risk
- ⚠️ Breaking change for existing scripts/docs referencing old commands
- ⚠️ Production build testing required before deployment

### Mitigation Strategies
- Test production build locally before deploying
- Monitor GitHub Actions deployment closely
- Have rollback plan (previous Docker images available)
- Test SSH and commands thoroughly before relying on them

---

## Success Criteria

**Phase 1 Complete When**:
- [ ] Dockerfile.production uses oven/bun base image
- [ ] Production build succeeds locally
- [ ] No Node runtime in production container
- [ ] App runs correctly with Bun

**Phase 2 Complete When**:
- [ ] All dev-*/prod-* commands removed
- [ ] Unified commands work locally
- [ ] Auto-detection works correctly
- [ ] Help text updated

**Phase 3 Complete When**:
- [ ] `make ssh` connects to production box
- [ ] Lands in /opt/habita directory
- [ ] Can run make commands from SSH session

**Phase 4 Complete When**:
- [ ] All commands tested locally
- [ ] Changes deployed to production
- [ ] All commands tested on production box
- [ ] Bun runtime verified working

**Phase 5 Complete When**:
- [ ] All documentation updated
- [ ] Old command references removed
- [ ] New workflow documented

**Overall Success When**:
- [ ] Can run `make db-seed` locally and it works
- [ ] Can SSH to box: `make ssh`
- [ ] Can run `make db-seed` on box and it works
- [ ] Same commands, same behavior, no prefixes needed
- [ ] Only Bun runtime, no Node anywhere

---

## Notes

- This plan is independent of `plans/deploying_to_production.md` (that work is complete)
- These improvements make the system more consistent and easier to use
- The philosophy is: "same commands everywhere, same behavior everywhere"
- Auto-detection is invisible to the user - commands just work

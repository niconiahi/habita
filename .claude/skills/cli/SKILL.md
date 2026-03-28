---
name: cli
description: CLI conventions. Use always when running shell commands — covers just recipes, dco wrapper, and when to avoid raw CLI tools.
---

# CLI Conventions

**Always use `just` first.** Only fall back to `dco` when no `just` recipe covers what you need and the task involves Docker. Never use raw `docker compose`, `npx`, or other CLI tools for project operations.

## `just` — Task Runner

All project operations go through `just`. Auto-detects environment: development locally, production on `/opt/habita`.

### Infrastructure

```bash
just up                        # Start all services (correct order, waits for db health)
just down                      # Stop all services
just status                    # Show status of all services
just restart app               # Restart a project
just restart app svelte        # Restart a specific service
just reload app svelte         # Force-recreate a service (picks up image/config changes)
just rebuild app svelte        # Rebuild image from scratch (after Dockerfile changes)
just logs svelte               # Follow svelte logs
just logs db                   # Follow database logs
just logs go                   # Follow Go API logs
just deps                      # Reinstall node_modules in svelte container
just preview                   # Run production build locally (tests ORIGIN-dependent flows)
just prune                     # Clean up unused Docker images and volumes
just geo                       # Start Nominatim (heavy, optional)
just geo-down                  # Stop Nominatim
just link                      # Symlink config files from config/ to root
```

### Database (`just db`)

```bash
just db shell                  # Open psql shell
just db reset                  # Drop, recreate, migrate, seed (development only)
just db backup                 # Create gzipped database dump
just db restore-test           # Verify backup integrity
just db restore-test dump.gz   # Restore specific backup file
```

### Linting (`just lint`)

```bash
just lint format               # Run Prettier formatting (inside Docker)
just lint types                # Run TypeScript type checking (inside Docker)
```

### Testing (`just test`)

```bash
just test e2e                  # Run all E2E tests (Playwright, in Docker)
just test e2e --grep "book"    # Run matching E2E tests
just test e2e-visual           # Run E2E visually in headed browser (local, not Docker)
just test e2e-visual --grep "book"
```

### Secrets (`just secrets`)

```bash
just secrets edit              # Edit development secrets in $EDITOR
just secrets edit production   # Edit production secrets
just secrets encrypt           # Encrypt .env → .env.enc
just secrets decrypt           # Decrypt .env.enc → .env
just secrets apply             # Decrypt + restart affected services
just secrets keygen            # Generate new age key (one-time)
just secrets pubkey            # Show current public key
```

### Deploy (`just deploy`)

```bash
just deploy push app api       # Build, push, deploy specific services
just deploy pull               # Pull latest images (production)
just deploy rollback           # Rollback 1 commit and redeploy
just deploy rollback 3 app     # Rollback 3 commits, redeploy app only
just deploy tag-svelte v1.2.3  # Deploy specific svelte version
just deploy tag-go v1.2.3      # Deploy specific go version
```

### Zone (`just zone`)

```bash
just zone argentina            # Extract Argentine boundaries from Nominatim
```

## `dco` — Fallback for ad-hoc Docker commands

`dco` (`bin/dco`) wraps `docker compose` with automatic environment detection and compose file resolution. **Only use `dco` when no `just` recipe exists for what you need.**

### Syntax

```bash
dco <stack> <service> <subcommand> [args...]
```

### Available stacks

`app`, `gateway`, `api`, `media`, `geo`, `scheduler`, `obs` (observability)

### Examples

```bash
dco app svelte run pnpm run db:migrate     # Run migrations (no just recipe yet)
dco app svelte run pnpm run db:types       # Regenerate DB types (no just recipe yet)
dco app svelte exec sh                     # Shell into running container
```

## Priority order

1. **`just`** — always check `just --list` first
2. **`dco`** — only if no `just` recipe exists and you need Docker
3. **Raw CLI** — never for project operations

## What NOT to do

```bash
# WRONG — dco when just recipe exists
dco app svelte logs -f

# RIGHT
just logs svelte
```

```bash
# WRONG — raw docker compose
docker compose -f infra/development/app/docker-compose.yml run --rm svelte pnpm run lint:format

# RIGHT
just lint format
```

```bash
# WRONG — npx/pnpm directly for project tasks
npx biome check --write
npx tsc --noEmit
npx prettier --write .

# RIGHT
just lint format
just lint types
```
